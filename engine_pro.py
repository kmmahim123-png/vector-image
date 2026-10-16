"""
Free Vector Image - Enterprise Pro Vector Engine
Combines:
  1. Auto-Detection of Monochrome Line Art vs Full Color Artwork
  2. For Line Art: Bilateral smoothing + Otsu thresholding + pure binary spline fitting (zero grey polygons)
  3. For Color Art: Lanczos super-sampling + Bilateral edge-preserving denoising + K-Means color quantization
  4. Automatic fake-checkerboard cleaner
  5. Native Rust VTracer Engine with Cubic Bézier Splines
  6. Clean standard SVG root element (no duplicate attributes)
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

def clean_fake_checkerboard(img_rgba):
    """Detects and strips fake PNG alternating grey/white checkerboard backgrounds"""
    w, h = img_rgba.size
    pixels = img_rgba.load()
    sample_pixels = [
        pixels[0, 0], pixels[w - 1, 0], pixels[0, h - 1], pixels[w - 1, h - 1],
        pixels[min(16, w-1), min(16, h-1)], pixels[max(0, w - 16), min(16, h-1)],
        pixels[min(16, w-1), max(0, h - 16)], pixels[max(0, w - 16), max(0, h - 16)]
    ]
    white_count = 0
    grey_count = 0
    for c in sample_pixels:
        r, g, b = c[:3]
        if r > 235 and g > 235 and b > 235:
            white_count += 1
        elif abs(int(r) - int(g)) < 8 and abs(int(g) - int(b)) < 8 and 180 <= r <= 235:
            grey_count += 1

    # Genuine checkerboard MUST have alternating white AND grey tiles!
    # A solid white background has grey_count == 0 and must NEVER be stripped!
    if white_count >= 2 and grey_count >= 2:
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y][:4]
                is_white = r > 235 and g > 235 and b > 235
                is_grey = abs(int(r) - int(g)) < 8 and abs(int(g) - int(b)) < 8 and 180 <= r <= 235
                if is_white or is_grey:
                    pixels[x, y] = (r, g, b, 0)
    return img_rgba

def is_monochrome_image(img):
    """Detects if an image is genuinely pure black & white / line art / grayscale with zero color"""
    arr = np.array(img.convert('RGB'))
    diff = np.max(arr, axis=2).astype(np.int32) - np.min(arr, axis=2).astype(np.int32)
    color_pixels = np.sum(diff > 25)
    total_pixels = arr.shape[0] * arr.shape[1]
    color_pct = (color_pixels / total_pixels) * 100
    # If even 0.2% of pixels have noticeable color, it is DEFINITELY a COLOR image!
    if color_pct > 0.2:
        return False
    return float(np.mean(diff < 18)) > 0.99

def vectorize_pro(input_path, output_svg_path, options=None):
    if options is None:
        options = {}

    orig_img = Image.open(input_path)
    if options.get('clean_checkerboard', True):
        orig_img = clean_fake_checkerboard(orig_img.convert('RGBA'))

    orig_w, orig_h = orig_img.size
    is_mono = is_monochrome_image(orig_img)
    preset = options.get('preset', 'auto')
    transparent_bg = options.get('transparent_bg', False)

    # Adaptive super-sampling: low-resolution web thumbnails (<500px) need 3x Lanczos
    # so discrete pixel staircases dissolve completely into continuous sub-pixel coordinates
    if max(orig_w, orig_h) < 500:
        scale = 3
    elif max(orig_w, orig_h) < 1400:
        scale = 2
    else:
        scale = 1
    
    tw = orig_w * scale
    th = orig_h * scale

    # -------------------------------------------------------------
    # CASE A: MONOCHROME LINE ART / SKETCH / STAMP / B&W DRAWING
    # -------------------------------------------------------------
    # Only route to Case A if genuinely monochrome or explicitly requested B&W preset
    if (is_mono and preset not in ('detailed', 'photo', 'illustration', 'color', 'clipart', 'logo')) or preset in ('cut_vinyl', 'silhouette', 'line_art'):
        gray = orig_img.convert('L')
        
        if scale > 1:
            gray_up = np.array(gray.resize((tw, th), Image.Resampling.LANCZOS))
        else:
            gray_up = np.array(gray)

        # Anti-aliased sub-pixel Gaussian pre-filter dissolves discrete pixel staircases into continuous gradient
        denoised = cv2.GaussianBlur(gray_up, (7, 7), 2.0)
        
        # Otsu thresholding cleanly separates dark strokes from background with smooth continuous contours
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        temp_thresh_path = input_path + "_thresh.png"
        cv2.imwrite(temp_thresh_path, thresh)

        filter_speckle = int(options.get('filter_speckle', 8))
        corner_threshold = int(options.get('corner_threshold', 80))
        length_threshold = float(options.get('length_threshold', 7.0))
        max_iterations = int(options.get('max_iterations', 30))
        splice_threshold = int(options.get('splice_threshold', 55))
        path_precision = int(options.get('path_precision', 2))
        
        # Binary spline tracing: gives PURE SOLID BLACK #000000 strokes with silky smooth cubic Béziers
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
        svg_root = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tw} {th}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
        if not transparent_bg and np.mean(gray_up > 200) > 0.4:
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
    # CASE B: FULL COLOR ARTWORK / ILLUSTRATION / PHOTO / LOGO
    # -------------------------------------------------------------
    if scale > 1:
        img_up = orig_img.resize((tw, th), Image.Resampling.LANCZOS)
    else:
        img_up = orig_img

    arr = np.array(img_up.convert('RGB'))
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)

    # Sub-pixel anti-aliasing pre-filter + bilateral edge-preserving denoiser
    denoise_level = options.get('denoise_level', 'low')
    if denoise_level == 'none':
        denoised = bgr
    elif denoise_level == 'high':
        smooth = cv2.GaussianBlur(bgr, (7, 7), 1.5)
        denoised = cv2.bilateralFilter(smooth, 9, 60, 60)
    elif denoise_level == 'medium':
        smooth = cv2.GaussianBlur(bgr, (5, 5), 1.2)
        denoised = cv2.bilateralFilter(smooth, 7, 50, 50)
    else:
        smooth = cv2.GaussianBlur(bgr, (5, 5), 1.2)
        denoised = cv2.bilateralFilter(smooth, 7, 45, 45)

    # Inspect color histogram to distinguish flat graphics/logos from continuous-tone photos
    small = cv2.resize(denoised, (100, 100))
    unique_colors_small = len(np.unique(small.reshape(-1, 3), axis=0))
    is_flat_graphic = (unique_colors_small < 1500) or (preset in ('logo', 'clipart', 'cut_vinyl'))

    colors_limit = int(options.get('colors_limit', 0))
    palette_centers = []

    if colors_limit > 0 or is_flat_graphic:
        # Snap anti-aliased edge halos to dominant colors to prevent 1000s of jagged edge fringes
        k = colors_limit if colors_limit > 0 else (16 if unique_colors_small < 800 else 24)
        pixels = denoised.reshape((-1, 3)).astype(np.float32)
        sample_size = min(35000, len(pixels))
        sample_indices = np.random.choice(len(pixels), sample_size, replace=False)
        sample_pixels = pixels[sample_indices]

        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 15, 0.2)
        _, _, centers = cv2.kmeans(sample_pixels, k, None, criteria, 5, cv2.KMEANS_PP_CENTERS)
        centers = np.uint8(centers)
        palette_centers = [rgb2hex(cv2.cvtColor(np.uint8([[c]]), cv2.COLOR_BGR2RGB)[0][0]) for c in centers]

        distances = np.linalg.norm(pixels[:, None, :] - centers[None, :, :].astype(np.float32), axis=2)
        labels = np.argmin(distances, axis=1)
        quantized_bgr = centers[labels].reshape(denoised.shape)
        final_bgr = quantized_bgr

        default_color_prec = 6
        default_layer_diff = 24
        default_len_thresh = 7.0
        default_corner_thresh = 75
        default_filter_speckle = 8
    else:
        # Full fidelity photographic direct vectorization
        final_bgr = denoised
        default_color_prec = 7
        default_layer_diff = 16
        default_len_thresh = 5.0
        default_corner_thresh = 75
        default_filter_speckle = 6

    temp_pre_path = input_path + "_color_pre.png"
    cv2.imwrite(temp_pre_path, final_bgr)

    filter_speckle = int(options.get('filter_speckle', default_filter_speckle))
    color_precision = int(options.get('color_precision', default_color_prec))
    layer_difference = int(options.get('layer_difference', default_layer_diff))
    corner_threshold = int(options.get('corner_threshold', default_corner_thresh))
    length_threshold = float(options.get('length_threshold', default_len_thresh))
    max_iterations = int(options.get('max_iterations', 30))
    splice_threshold = int(options.get('splice_threshold', 55))
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

    # Exact palette center snapping if quantized
    if palette_centers:
        fills = list(set(re.findall(r'fill="([^"]+)"', svg_content)))
        if fills:
            target_rgbs = np.array([hex2rgb(h) for h in palette_centers], dtype=np.float32)
            for f_col in fills:
                if f_col.lower() in ('none', 'transparent'):
                    continue
                f_rgb = np.array(hex2rgb(f_col), dtype=np.float32)
                dists = np.linalg.norm(target_rgbs - f_rgb, axis=1)
                best_idx = np.argmin(dists)
                svg_content = svg_content.replace(f'fill="{f_col}"', f'fill="{palette_centers[best_idx]}"')

    # Clean SVG root tag (ensures viewBox matches traced tw, th exactly so 0% of art is clipped)
    svg_content = re.sub(
        r'<svg\b[^>]*>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tw} {th}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">',
        svg_content,
        count=1
    )

    # Extract palette
    palette_data = []
    path_matches = re.findall(r'<path[^>]*fill="([^"]+)"[^>]*>', svg_content)
    color_counts = {}
    for c in path_matches:
        if c.lower() not in ('none', 'transparent'):
            color_counts[c] = color_counts.get(c, 0) + 1
    total_paths = sum(color_counts.values()) or 1

    for c, cnt in sorted(color_counts.items(), key=lambda x: x[1], reverse=True):
        palette_data.append({
            'hex': c.upper(),
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
