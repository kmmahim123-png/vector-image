"""
Free Vector Image - VTracer High-Precision Vector Engine Bridge
Calls native Rust VTracer vectorizer with positional parameters for 100x quality
"""

import sys
import json
import os
import re
import vtracer
from PIL import Image

def vectorize_image(input_path, output_svg_path, options=None):
    if options is None:
        options = {}

    colormode = str(options.get('colormode', 'color'))
    hierarchical = str(options.get('hierarchical', 'stacked'))
    mode = str(options.get('mode', 'spline'))
    filter_speckle = int(options.get('filter_speckle', 6))
    color_precision = int(options.get('color_precision', 7))
    layer_difference = int(options.get('layer_difference', 16))
    corner_threshold = int(options.get('corner_threshold', 60))
    length_threshold = float(options.get('length_threshold', 4.0))
    max_iterations = int(options.get('max_iterations', 10))
    splice_threshold = int(options.get('splice_threshold', 45))
    path_precision = int(options.get('path_precision', 2))

    # Pre-clean fake checkerboard if present
    if options.get('clean_checkerboard', True):
        clean_fake_checkerboard(input_path)

    # Call vtracer with positional parameters (required by Python 3.14 PyO3 binding)
    vtracer.convert_image_to_svg_py(
        input_path,
        output_svg_path,
        colormode,
        hierarchical,
        mode,
        filter_speckle,
        color_precision,
        layer_difference,
        corner_threshold,
        length_threshold,
        max_iterations,
        splice_threshold,
        path_precision
    )

    with open(output_svg_path, 'r', encoding='utf-8', errors='ignore') as f:
        svg_content = f.read()

    # Get dimensions
    img = Image.open(input_path)
    w, h = img.size

    # Ensure standard, valid, responsive <svg> root element (never duplicate attributes)
    svg_content = re.sub(
        r'<svg\b[^>]*>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">',
        svg_content,
        count=1
    )

    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    # Count paths and extract stats
    paths_count = svg_content.count('<path')
    colors = set(re.findall(r'fill="([^"]+)"', svg_content))

    return {
        "success": True,
        "width": w,
        "height": h,
        "pathsCount": paths_count,
        "colorsCount": len(colors),
        "svgSizeKb": round(len(svg_content) / 1024, 1),
        "svgContent": svg_content
    }

def clean_fake_checkerboard(img_path):
    """Detects and clears fake PNG grey/white checkerboard backgrounds"""
    try:
        img = Image.open(img_path).convert('RGBA')
        w, h = img.size
        pixels = img.load()

        # Check corner pixels
        sample_pixels = [
            pixels[0, 0], pixels[w - 1, 0], pixels[0, h - 1], pixels[w - 1, h - 1],
            pixels[10, 10], pixels[w - 10, 10], pixels[10, h - 10], pixels[w - 10, h - 10]
        ]
        white_count = 0
        grey_count = 0

        for c in sample_pixels:
            r, g, b, a = c
            if r > 240 and g > 240 and b > 240:
                white_count += 1
            elif abs(r - g) < 7 and abs(g - b) < 7 and 190 <= r <= 235:
                grey_count += 1

        # Must have alternating white AND grey tiles to be a fake checkerboard
        if white_count >= 2 and grey_count >= 2:
            is_checker = True

        if is_checker:
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pixels[x, y]
                    is_white = r > 240 and g > 240 and b > 240
                    is_grey = abs(r - g) < 8 and abs(g - b) < 8 and 185 <= r <= 235
                    if is_white or is_grey:
                        pixels[x, y] = (r, g, b, 0)
            img.save(img_path)
    except Exception:
        pass

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python vtracer_bridge.py <input> <output>"}))
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

    result = vectorize_image(input_file, output_file, opts)
    # Output only the JSON metadata, omitting svgContent to keep stdout fast
    res_copy = dict(result)
    res_copy.pop('svgContent', None)
    print(json.dumps(res_copy))
