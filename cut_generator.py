"""
Free Vector Image - Laser & Vinyl Cut Contour Generator
Generates die-cut, kiss-cut, and CNC outer toolpaths with zero overlapping lines.
"""

import sys
import json
import os
import re
import cv2
import numpy as np
from PIL import Image
import vtracer

def generate_cut_path(input_path, output_svg_path, offset_px=6):
    img = Image.open(input_path)
    w, h = img.size
    arr = np.array(img)

    if arr.ndim == 3 and arr.shape[2] == 4:
        alpha = arr[:, :, 3]
        if np.mean(alpha > 10) < 0.95:
            fg_mask = (alpha > 20).astype(np.uint8) * 255
        else:
            # Alpha is fully opaque, use corner background detection
            rgb = arr[:, :, :3]
            corners = [rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]
            bg_color = np.median(corners, axis=0)
            diff = np.linalg.norm(rgb.astype(float) - bg_color.astype(float), axis=2)
            fg_mask = (diff > 30).astype(np.uint8) * 255
    else:
        rgb = arr if arr.ndim == 3 else np.stack([arr]*3, axis=-1)
        corners = [rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]
        bg_color = np.median(corners, axis=0)
        diff = np.linalg.norm(rgb.astype(float) - bg_color.astype(float), axis=2)
        fg_mask = (diff > 30).astype(np.uint8) * 255

    # Dilate for die-cut offset margin if requested
    if offset_px > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (offset_px * 2 + 1, offset_px * 2 + 1))
        fg_mask = cv2.dilate(fg_mask, kernel)

    # Fill holes and keep only external contours
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    solid_mask = np.zeros_like(fg_mask)
    cv2.drawContours(solid_mask, contours, -1, 255, -1)

    # Smooth contour boundary with slight Gaussian or Median
    solid_mask = cv2.medianBlur(solid_mask, 5)

    temp_mask_path = input_path + "_cut_mask.png"
    cv2.imwrite(temp_mask_path, solid_mask)

    # Trace with vtracer in binary mode
    vtracer.convert_image_to_svg_py(
        temp_mask_path,
        output_svg_path,
        'binary',
        'stacked',
        'spline',
        10,
        4,
        24,
        60,
        4.0,
        10,
        45,
        2
    )

    try:
        if os.path.exists(temp_mask_path):
            os.remove(temp_mask_path)
    except Exception:
        pass

    with open(output_svg_path, 'r', encoding='utf-8') as f:
        svg_content = f.read()

    # Convert fill to red cutline stroke (#FF0000 1pt / 0.5mm)
    svg_content = svg_content.replace('fill="#000000"', 'fill="none" stroke="#FF0000" stroke-width="1.5" vector-effect="non-scaling-stroke"')
    svg_content = svg_content.replace('fill="#ffffff"', 'fill="none"')

    # Ensure standard, valid, responsive <svg> root element (never duplicate attributes)
    svg_content = re.sub(
        r'<svg\b[^>]*>',
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">',
        svg_content,
        count=1
    )

    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    return {
        "success": True,
        "width": w,
        "height": h,
        "svg": svg_content
    }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python cut_generator.py <input> <output> [offset]"}))
        sys.exit(1)

    offset = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    res = generate_cut_path(sys.argv[1], sys.argv[2], offset)
    print(json.dumps({"success": True, "width": res['width'], "height": res['height']}))
