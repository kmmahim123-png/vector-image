"""
Free Vector Image - Enterprise Pro Vector Engine
Powered by VisionCortex VTracer Rust Core + Intelligent Sub-Pixel Pre-Filtering
Combines:
  1. Auto-Detection of Monochrome Line Art vs Logos/Graphics vs Full Color Artwork
  2. For Line Art: Gaussian sub-pixel anti-aliasing + Otsu thresholding + pure binary spline fitting (zero grey polygons)
  3. For Logos / Graphics / Typography:
     - 2x/3x Lanczos super-sampling (expanding physical pixels into continuous sub-pixel grid)
     - Anti-aliased Gaussian spatial guidance filter (dissolves discrete raster pixel steps into continuous gradient space)
     - Adaptive Dominant Color Snapping (extracts true brand colors via K-Means, eliminating false anti-aliasing color ribbons)
     - Organic Bézier Spline Fitting (corner_threshold: 82, length_threshold: 8.0, max_iterations: 40, splice_threshold: 60)
     - Cutout mode on transparent background: cleanly isolates outer badge/shape from canvas corners
  4. For Photos / Rich Art:
     - Edge-preserving bilateral filter (cleans JPEG ringing/mosquito noise without median step-hardening)
     - High color precision spline fitting
  5. Automatic fake-checkerboard cleaner (cleans only genuine alternating grey/white checkerboards, never solid white backgrounds)
  6. Instant transparent background handling (safely removes background without affecting internal white elements)
  7. Standard, valid, responsive SVG root element (no duplicate attributes, sub-pixel viewBox)
"""

import sys
import json
import os
import re
import cv2
import numpy as np
from PIL import Image
import vtracer

def hex2rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join([c*2 for c in h])
    return [int(h[i:i+2], 16) for i in (0, 2, 4)]

def rgb2hex(rgb):
    return '#{:02X}{:02X}{:02X}'.format(int(np.clip(rgb[0], 0, 255)), int(np.clip(rgb[1], 0, 255)), int(np.clip(rgb[2], 0, 255)))

def clean_fake_checkerboard(img_rgba, make_transparent=False):
    """Detects and strips genuine fake-PNG alternating grey/white checkerboard backgrounds without affecting solid white backgrounds"""
    w, h = img_rgba.size
    if w < 64 or h < 64:
        return img_rgba
    
    tile_size = 16
    pixels = img_rgba.load()
    try:
        p00 = pixels[4, 4][:3]
        p10 = pixels[4 + tile_size, 4][:3]
        p01 = pixels[4, 4 + tile_size][:3]
        p11 = pixels[4 + tile_size, 4 + tile_size][:3]

        def is_white_px(c):
            return c[0] > 240 and c[1] > 240 and c[2] > 240
        def is_grey_px(c):
            return abs(int(c[0]) - int(c[1])) < 6 and abs(int(c[1]) - int(c[2])) < 6 and 190 <= c[0] <= 225

        has_checker = (
            (is_white_px(p00) and is_grey_px(p10) and is_grey_px(p01) and is_white_px(p11)) or
            (is_grey_px(p00) and is_white_px(p10) and is_white_px(p01) and is_grey_px(p11))
        )

        if has_checker:
            p_other0 = pixels[w - 4 - tile_size, 4][:3]
            p_other1 = pixels[w - 4, 4][:3]
            if (is_white_px(p_other0) and is_grey_px(p_other1)) or (is_grey_px(p_other0) and is_white_px(p_other1)):
                target_alpha = 0 if make_transparent else 255
                replacement = (255, 255, 255, target_alpha)
                for y in range(h):
                    for x in range(w):
                        c = pixels[x, y]
                        if is_white_px(c) or is_grey_px(c):
                            pixels[x, y] = replacement
    except Exception:
        pass
    return img_rgba

def is_monochrome_image(img):
    """Detects if an image is genuinely pure black & white / line art / grayscale with zero color"""
    arr = np.array(img.convert('RGB'))
    diff = np.max(arr, axis=2).astype(np.int32) - np.min(arr, axis=2).astype(np.int32)
    color_pixels = np.sum(diff > 25)
    total_pixels = arr.shape[0] * arr.shape[1]
    color_pct = (color_pixels / total_pixels) * 100
    if color_pct > 0.2:
        return False
    return float(np.mean(diff < 18)) > 0.99

def get_dominant_colors_auto(pixels_float, max_k=16):
    """Finds optimal k dominant colors for a logo/graphic using reconstruction error elbow"""
    sample_size = min(40000, len(pixels_float))
    indices = np.random.choice(len(pixels_float), sample_size, replace=False)
    sample = pixels_float[indices]

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.2)
    
    # Try k=2 first
    _, labels2, centers2 = cv2.kmeans(sample, 2, None, criteria, 5, cv2.KMEANS_PP_CENTERS)
    dists2 = np.linalg.norm(sample - centers2[labels2.flatten()], axis=1)
    mean_err2 = float(np.mean(dists2))

    if mean_err2 < 14.0:
        return 2, np.uint8(centers2)

    # Try k=3, 4, 6, 8, 12, 16
    prev_err = mean_err2
    best_k = 2
    best_centers = centers2

    for k in [3, 4, 6, 8, 12, 16]:
        if k > max_k:
            break
        _, labels, centers = cv2.kmeans(sample, k, None, criteria, 4, cv2.KMEANS_PP_CENTERS)
        dists = np.linalg.norm(sample - centers[labels.flatten()], axis=1)
        err = float(np.mean(dists))
        
        # If error drops below 11 RGB levels or marginal improvement < 1.8, we found the true palette
        if err < 11.0 or (prev_err - err) < 1.8:
            return k, np.uint8(centers)
        prev_err = err
        best_k = k
        best_centers = centers

    return best_k, np.uint8(best_centers)

def is_flat_logo_or_graphic(img):
    """Detects whether an image is a flat brand logo, badge, typography, sticker, or vector art"""
    w, h = img.size
    thumb = img.resize((180, 180), Image.Resampling.BILINEAR)
    arr = np.array(thumb)
    
    # Quantize to 16-level bins to count distinct color regions
    quant = (arr // 16) * 16
    unique_clusters = len(np.unique(quant.reshape(-1, 3), axis=0))
    return unique_clusters <= 48

def vectorize_pro(input_path, output_svg_path, options=None):
    if options is None:
        options = {}

    orig_img = Image.open(input_path)
    transparent_bg = options.get('transparent_bg', False)
    
    if options.get('clean_checkerboard', True):
        orig_img = clean_fake_checkerboard(orig_img.convert('RGBA'), make_transparent=transparent_bg)

    orig_w, orig_h = orig_img.size

    # CRITICAL: Always composite transparent/RGBA images onto clean white
    # so transparent pixels NEVER turn into black (0, 0, 0)!
    if orig_img.mode in ('RGBA', 'LA') or (orig_img.mode == 'P' and 'transparency' in orig_img.info):
        rgba = orig_img.convert('RGBA')
        bg = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
        alpha_composite = Image.alpha_composite(bg, rgba)
        clean_rgb_img = alpha_composite.convert('RGB')
    else:
        clean_rgb_img = orig_img.convert('RGB')

    is_mono = is_monochrome_image(clean_rgb_img)
    preset = options.get('preset', 'auto')
    colors_limit = int(options.get('colors_limit', 0))

    # Determine processing mode
    is_line_art = (is_mono and preset not in ('detailed', 'photo', 'illustration', 'color')) or preset in ('cut_vinyl', 'silhouette', 'line_art')
    is_logo_art = not is_line_art and (preset in ('logo', 'clipart') or colors_limit > 0 or (preset == 'auto' and is_flat_logo_or_graphic(clean_rgb_img)))

    # -------------------------------------------------------------
    # CASE A: MONOCHROME LINE ART / SKETCH / STAMP / B&W DRAWING
    # -------------------------------------------------------------
    if is_line_art:
        scale = 3 if max(orig_w, orig_h) < 900 else 2
        tw = orig_w * scale
        th = orig_h * scale

        gray = clean_rgb_img.convert('L')
        gray_up = np.array(gray.resize((tw, th), Image.Resampling.LANCZOS))

        # Anti-aliased sub-pixel Gaussian pre-filter dissolves discrete pixel staircases into continuous gradient
        denoised = cv2.GaussianBlur(gray_up, (5, 5), 1.5)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        temp_thresh_path = input_path + "_thresh.png"
        cv2.imwrite(temp_thresh_path, thresh)

        filter_speckle = int(options.get('filter_speckle', 12))
        corner_threshold = int(options.get('corner_threshold', 82))
        length_threshold = float(options.get('length_threshold', 8.0))
        max_iterations = int(options.get('max_iterations', 40))
        splice_threshold = int(options.get('splice_threshold', 60))
        path_precision = int(options.get('path_precision', 2))
        
        vtracer.convert_image_to_svg_py(
            temp_thresh_path,
            output_svg_path,
            'binary',
            'stacked',
            'spline',
            filter_speckle,
            4,
            24,
            corner_threshold,
            length_threshold,
            max_iterations,
            splice_threshold,
            path_precision
        )
        
        try:
            if os.path.exists(temp_thresh_path):
                os.remove(temp_thresh_path)
        except Exception:
            pass

        with open(output_svg_path, 'r', encoding='utf-8', errors='ignore') as f:
            svg_content = f.read()

        # Clean SVG root tag (eliminate duplicate width/height attributes)
        svg_root = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tw} {th}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" style="stroke-linejoin:round;stroke-linecap:round;">'
        if not transparent_bg:
            svg_root += f'\n<rect width="100%" height="100%" fill="#ffffff"/>'
        svg_content = re.sub(r'<svg\b[^>]*>', svg_root, svg_content, count=1)

        paths_count = svg_content.count('<path')
        palette_data = [
            {'hex': '#000000', 'count': paths_count, 'percentage': 100.0}
        ]
        if not transparent_bg:
            palette_data.insert(0, {'hex': '#FFFFFF', 'count': 1, 'percentage': 100.0})

        with open(output_svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)

        return {
            "success": True,
            "width": tw,
            "height": th,
            "origWidth": orig_w,
            "origHeight": orig_h,
            "pathsCount": paths_count,
            "colorsCount": len(palette_data),
            "palette": palette_data,
            "svgSizeKb": round(len(svg_content) / 1024, 1),
            "svgContent": svg_content
        }

    # -------------------------------------------------------------
    # CASE B: LOGO / BADGE / TYPOGRAPHY / FLAT VECTOR ART
    # -------------------------------------------------------------
    elif is_logo_art:
        # Super-sampling scale (expand 1 physical pixel into 4 or 9 continuous sub-pixels)
        scale = 3 if max(orig_w, orig_h) < 800 else 2
        tw = orig_w * scale
        th = orig_h * scale

        up_img = clean_rgb_img.resize((tw, th), Image.Resampling.LANCZOS)
        arr_up = np.array(up_img)

        # Anti-aliased Gaussian spatial guidance filter:
        # Dissolves discrete raster pixel steps into continuous gradient space!
        blurred_rgb = cv2.GaussianBlur(arr_up, (5, 5), 1.1)
        pixels_float = blurred_rgb.reshape((-1, 3)).astype(np.float32)

        # Adaptive Dominant Color Snapping:
        # Extracts true brand colors, eliminating 150+ false intermediate anti-aliasing color ribbons
        if colors_limit > 0:
            k = colors_limit
            sample_size = min(40000, len(pixels_float))
            indices = np.random.choice(len(pixels_float), sample_size, replace=False)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.2)
            _, _, centers = cv2.kmeans(pixels_float[indices], k, None, criteria, 6, cv2.KMEANS_PP_CENTERS)
            final_centers = np.uint8(centers)
        else:
            k, final_centers = get_dominant_colors_auto(pixels_float)

        # Assign each pixel to the nearest genuine brand color center
        distances = np.linalg.norm(pixels_float[:, None, :] - final_centers[None, :, :].astype(np.float32), axis=2)
        labels = np.argmin(distances, axis=1)
        quantized = final_centers[labels].reshape(arr_up.shape)

        temp_pre_path = input_path + "_logo_pre.png"
        Image.fromarray(quantized).save(temp_pre_path)

        # Spline parameters optimized for silky, organic, master-level Bézier curves
        filter_speckle = int(options.get('filter_speckle', 10))
        color_precision = int(options.get('color_precision', 7))
        layer_difference = int(options.get('layer_difference', 20))
        corner_threshold = int(options.get('corner_threshold', 82))
        length_threshold = float(options.get('length_threshold', 8.0))
        max_iterations = int(options.get('max_iterations', 40))
        splice_threshold = int(options.get('splice_threshold', 60))
        path_precision = int(options.get('path_precision', 2))

        # Use cutout mode when transparent background is requested so foreground shapes
        # (like circles and badges) are completely isolated from outer canvas corners!
        hierarchical_mode = 'cutout' if transparent_bg else 'stacked'

        vtracer.convert_image_to_svg_py(
            temp_pre_path,
            output_svg_path,
            'color',
            hierarchical_mode,
            'spline',
            filter_speckle,
            color_precision,
            layer_difference,
            corner_threshold,
            length_threshold,
            max_iterations,
            splice_threshold,
            path_precision
        )

        try:
            if os.path.exists(temp_pre_path):
                os.remove(temp_pre_path)
        except Exception:
            pass

        with open(output_svg_path, 'r', encoding='utf-8', errors='ignore') as f:
            svg_content = f.read()

        # Handle Transparent Background:
        # Safely remove outer background paths without affecting internal white typography!
        if transparent_bg:
            bg_target_hex = rgb2hex(quantized[0, 0]).upper()
            
            # Identify paths that touch the canvas corners and match the background
            path_blocks = re.findall(r'<path[^>]*d="([^"]+)"[^>]*fill="([^"]+)"[^>]*transform="translate\(([^)]+)\)"[^>]*>', svg_content)
            for d, fill_col, trans in path_blocks:
                fc = fill_col.upper()
                rgb_c = hex2rgb(fc)
                is_bg_color = (fc == bg_target_hex) or (rgb_c[0] > 235 and rgb_c[1] > 235 and rgb_c[2] > 235)
                if is_bg_color:
                    tx, ty = [float(x) for x in trans.split(',')]
                    commands = re.findall(r'([MCZ])\s*([-\d.\s]*)', d)
                    xs = [tx]
                    ys = [ty]
                    for cmd, args in commands:
                        if cmd in ('M', 'C'):
                            parts = [float(x) for x in args.strip().split()]
                            if cmd == 'M':
                                xs.append(tx + parts[0])
                                ys.append(ty + parts[1])
                            elif cmd == 'C':
                                xs.append(tx + parts[4])
                                ys.append(ty + parts[5])
                    min_x, max_x = min(xs), max(xs)
                    min_y, max_y = min(ys), max(ys)
                    touches_corner = (
                        (min_x <= 3 and min_y <= 3) or
                        (max_x >= tw - 3 and min_y <= 3) or
                        (min_x <= 3 and max_y >= th - 3) or
                        (max_x >= tw - 3 and max_y >= th - 3)
                    )
                    # If this path touches the outer canvas corner, it is the outer background!
                    if touches_corner:
                        pattern = re.compile(r'<path[^>]*d="' + re.escape(d) + r'"[^>]*>')
                        svg_content = pattern.sub('', svg_content, count=1)

        # Clean SVG root tag (ensures viewBox matches traced tw, th exactly with sub-pixel geometric precision)
        svg_root = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tw} {th}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" style="stroke-linejoin:round;stroke-linecap:round;">'
        svg_content = re.sub(r'<svg\b[^>]*>', svg_root, svg_content, count=1)

        # Extract palette
        path_matches = re.findall(r'<path[^>]*fill="([^"]+)"[^>]*>', svg_content)
        color_counts = {}
        for c in path_matches:
            if c.lower() not in ('none', 'transparent'):
                color_counts[c.upper()] = color_counts.get(c.upper(), 0) + 1
        total_paths = sum(color_counts.values()) or 1

        palette_data = []
        for c, cnt in sorted(color_counts.items(), key=lambda x: x[1], reverse=True):
            palette_data.append({
                'hex': c,
                'count': cnt,
                'percentage': round((cnt / total_paths) * 100, 1)
            })

        with open(output_svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)

        return {
            "success": True,
            "width": tw,
            "height": th,
            "origWidth": orig_w,
            "origHeight": orig_h,
            "pathsCount": len(path_matches),
            "colorsCount": len(palette_data),
            "palette": palette_data[:32],
            "svgSizeKb": round(len(svg_content) / 1024, 1),
            "svgContent": svg_content
        }

    # -------------------------------------------------------------
    # CASE C: FULL COLOR ARTWORK / ILLUSTRATION / PHOTO
    # -------------------------------------------------------------
    else:
        scale = 2
        tw = orig_w * scale
        th = orig_h * scale

        img_up = clean_rgb_img.resize((tw, th), Image.Resampling.LANCZOS)
        arr = np.array(img_up)
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

        # Edge-preserving bilateral filter: removes JPEG ringing/mosquito noise without median step-hardening
        smooth_bgr = cv2.bilateralFilter(bgr, 7, 50, 50)

        if colors_limit > 0:
            pixels = smooth_bgr.reshape((-1, 3)).astype(np.float32)
            sample_size = min(35000, len(pixels))
            sample_indices = np.random.choice(len(pixels), sample_size, replace=False)
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 0.2)
            _, _, centers = cv2.kmeans(pixels[sample_indices], colors_limit, None, criteria, 5, cv2.KMEANS_PP_CENTERS)
            centers = np.uint8(centers)
            distances = np.linalg.norm(pixels[:, None, :] - centers[None, :, :].astype(np.float32), axis=2)
            labels = np.argmin(distances, axis=1)
            final_bgr = centers[labels].reshape(smooth_bgr.shape)
        else:
            final_bgr = smooth_bgr

        temp_pre_path = input_path + "_color_pre.png"
        cv2.imwrite(temp_pre_path, final_bgr)

        filter_speckle = int(options.get('filter_speckle', 12))
        color_precision = int(options.get('color_precision', 6))
        layer_difference = int(options.get('layer_difference', 24))
        corner_threshold = int(options.get('corner_threshold', 68))
        length_threshold = float(options.get('length_threshold', 6.0))
        max_iterations = int(options.get('max_iterations', 35))
        splice_threshold = int(options.get('splice_threshold', 52))
        path_precision = int(options.get('path_precision', 2))

        vtracer.convert_image_to_svg_py(
            temp_pre_path,
            output_svg_path,
            'color',
            'stacked',
            'spline',
            filter_speckle,
            color_precision,
            layer_difference,
            corner_threshold,
            length_threshold,
            max_iterations,
            splice_threshold,
            path_precision
        )

        try:
            if os.path.exists(temp_pre_path):
                os.remove(temp_pre_path)
        except Exception:
            pass

        with open(output_svg_path, 'r', encoding='utf-8', errors='ignore') as f:
            svg_content = f.read()

        # Transparent background handling
        if transparent_bg:
            first_path_match = re.search(r'<path[^>]*d="([^"]*)"[^>]*fill="([^"]*)"[^>]*>', svg_content)
            if first_path_match:
                bg_col = first_path_match.group(2).upper()
                if bg_col in ('#FFFFFF', '#FEFEFE', '#FAFBFC', '#F5F4F2', '#FDFDFD', '#F9F9F9', '#FFFCFC'):
                    svg_content = svg_content.replace(first_path_match.group(0), '', 1)

        # Clean SVG root tag
        svg_root = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tw} {th}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision" style="stroke-linejoin:round;stroke-linecap:round;">'
        svg_content = re.sub(r'<svg\b[^>]*>', svg_root, svg_content, count=1)

        # Extract palette
        palette_data = []
        path_matches = re.findall(r'<path[^>]*fill="([^"]+)"[^>]*>', svg_content)
        color_counts = {}
        for c in path_matches:
            if c.lower() not in ('none', 'transparent'):
                color_counts[c.upper()] = color_counts.get(c.upper(), 0) + 1
        total_paths = sum(color_counts.values()) or 1

        for c, cnt in sorted(color_counts.items(), key=lambda x: x[1], reverse=True):
            palette_data.append({
                'hex': c,
                'count': cnt,
                'percentage': round((cnt / total_paths) * 100, 1)
            })

        with open(output_svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)

        return {
            "success": True,
            "width": tw,
            "height": th,
            "origWidth": orig_w,
            "origHeight": orig_h,
            "pathsCount": len(path_matches),
            "colorsCount": len(palette_data),
            "palette": palette_data[:32],
            "svgSizeKb": round(len(svg_content) / 1024, 1),
            "svgContent": svg_content
        }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python engine_pro.py <input> <output> [opts.json]"}))
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    opts = {}
    if len(sys.argv) >= 4:
        try:
            with open(sys.argv[3], 'r') as f:
                opts = json.load(f)
        except Exception:
            opts = {}

    result = vectorize_pro(input_file, output_file, opts)
    res_copy = dict(result)
    res_copy.pop('svgContent', None)
    print(json.dumps(res_copy))
