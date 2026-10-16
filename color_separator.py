"""
Free Vector Image - Professional Color Management & Screen Print Separation Engine
Extracts color palettes, allows real-time recoloring/transparency,
and generates film positive separations with registration marks.
"""

import re
import os
import json
import zipfile
import io

def parse_svg_colors(svg_content):
    """Extracts all unique colors and their path counts from SVG"""
    paths = re.findall(r'<path[^>]*fill="([^"]+)"[^>]*>', svg_content)
    color_counts = {}
    for c in paths:
        if c.lower() in ('none', 'transparent'):
            continue
        color_counts[c] = color_counts.get(c, 0) + 1
    
    total = sum(color_counts.values()) or 1
    sorted_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
    
    palette = []
    for color, count in sorted_colors:
        palette.append({
            'hex': color,
            'count': count,
            'percentage': round((count / total) * 100, 1)
        })
    return palette

def recolor_svg(svg_content, color_mapping):
    """
    color_mapping is a dict: { "#old_hex": "#new_hex" or "transparent" }
    Replaces or removes colors dynamically in milliseconds.
    """
    res = svg_content
    for old_color, new_color in color_mapping.items():
        if new_color.lower() in ('transparent', 'none', 'remove'):
            # Remove all paths with this fill
            res = re.sub(
                rf'<path[^>]*fill="{re.escape(old_color)}"[^>]*/>',
                '',
                res,
                flags=re.IGNORECASE
            )
            res = re.sub(
                rf'<path[^>]*fill="{re.escape(old_color)}"[^>]*>.*?</path>',
                '',
                res,
                flags=re.IGNORECASE | re.DOTALL
            )
        else:
            # Replace fill color
            res = re.sub(
                rf'fill="{re.escape(old_color)}"',
                f'fill="{new_color}"',
                res,
                flags=re.IGNORECASE
            )
    return res

def generate_screen_print_separations(svg_content, width=800, height=800):
    """
    Splits the SVG into individual black-and-white film positives per color channel,
    complete with 4-corner registration marks and color film headers.
    Returns a dictionary of { filename: svg_content }
    """
    palette = parse_svg_colors(svg_content)
    separations = {}
    
    # Registration mark SVG snippet
    reg_mark = lambda x, y: f'''
    <g stroke="#000000" stroke-width="1" fill="none">
        <circle cx="{x}" cy="{y}" r="12" />
        <line x1="{x-16}" y1="{y}" x2="{x+16}" y2="{y}" />
        <line x1="{x}" y1="{y-16}" x2="{x}" y2="{y+16}" />
        <circle cx="{x}" cy="{y}" r="4" fill="#000000" />
    </g>
    '''
    
    corners = [
        (25, 25),
        (width - 25, 25),
        (25, height - 25),
        (width - 25, height - 25)
    ]
    reg_marks_svg = "".join([reg_mark(cx, cy) for cx, cy in corners])
    
    # Parse all path elements
    path_regex = re.compile(r'(<path[^>]*fill="([^"]+)"[^>]*>)', re.IGNORECASE)
    
    for idx, item in enumerate(palette):
        target_color = item['hex']
        clean_name = target_color.replace('#', '').upper()
        
        # Replace target color paths with solid pure black (#000000) for screen film positive
        # and remove all other color paths
        def path_filter(match):
            full_path = match.group(1)
            fill_color = match.group(2)
            if fill_color.lower() == target_color.lower():
                return re.sub(r'fill="[^"]+"', 'fill="#000000"', full_path, flags=re.IGNORECASE)
            return '' # strip other colors
            
        film_paths = path_regex.sub(path_filter, svg_content)
        # Extract everything between <svg> and </svg>
        inner_content = re.sub(r'<svg[^>]*>', '', film_paths)
        inner_content = re.sub(r'</svg>', '', inner_content)
        
        # Build complete separation film SVG
        film_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">
    <!-- Screen Print Separation Film: Color #{clean_name} ({idx+1} of {len(palette)}) -->
    <rect width="100%" height="100%" fill="#ffffff" />
    <g id="artwork_channel_{clean_name}">
        {inner_content}
    </g>
    <!-- Registration Alignment Marks for Screen Exposure -->
    <g id="registration_marks">
        {reg_marks_svg}
        <text x="50" y="30" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#000000">
            FILM #{idx+1}: {target_color.upper()} | {item['percentage']}% Area | Free Vector Image Pro
        </text>
    </g>
</svg>'''
        filename = f"Film_Separation_{idx+1}_{clean_name}.svg"
        separations[filename] = film_svg
        
    return separations
