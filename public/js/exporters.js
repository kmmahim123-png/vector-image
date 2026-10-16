/**
 * Vector Exporters: SVG, EPS, and PDF vector file generators
 * Reverse-engineered pipeline matching Vector Magic standards
 */

(function (window) {
  'use strict';

  const VectorExporters = {
    /**
     * Converts RGB/RGBA to hex string
     */
    rgbToHex(r, g, b) {
      const toHex = (c) => ('0' + Math.max(0, Math.min(255, Math.round(c))).toString(16)).slice(-2);
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },

    /**
     * Convert Tracedata to SVG String
     * @param {Object} td - tracedata object with width, height, palette, layers
     * @param {Object} opts - { mode: 'fill' | 'stroke_fill', strokeWidth: 0.8, transparentBg: false, scale: 1 }
     */
    generateSVG(td, opts = {}) {
      const mode = opts.mode || 'stroke_fill';
      const strokeWidth = opts.strokeWidth !== undefined ? opts.strokeWidth : (mode === 'stroke_fill' ? 0.8 : 0);
      const isStroke = mode === 'stroke_fill';
      const w = td.width || 400;
      const h = td.height || 400;
      const round = (val) => Number(val.toFixed(2));

      let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
      svg += `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`;
      svg += `  <desc>Vectorized by VectorMagic App (Reverse-Engineered via REA)</desc>\n`;
      svg += `  <defs>\n    <style>\n      .vm-path { shape-rendering: geometricPrecision; }\n    </style>\n  </defs>\n`;

      td.layers.forEach((layer, layerIdx) => {
        const col = td.palette[layerIdx];
        if (!col) return;
        if (col.a === 0) return; // skip transparent
        if (opts.hiddenColors && opts.hiddenColors.has(layerIdx)) return;

        // Skip background if transparentBg is requested and this is the first full-canvas layer
        if (opts.transparentBg && layerIdx === 0 && (col.r > 240 && col.g > 240 && col.b > 240)) {
          return;
        }

        const hexColor = this.rgbToHex(col.r, col.g, col.b);
        const opacity = col.a !== undefined ? (col.a / 255).toFixed(3) : '1';

        svg += `  <g id="layer-${layerIdx}" fill="${hexColor}"`;
        if (isStroke && strokeWidth > 0) {
          svg += ` stroke="${hexColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`;
        } else {
          svg += ` stroke="none"`;
        }
        if (opacity !== '1.000' && opacity !== '1') {
          svg += ` opacity="${opacity}"`;
        }
        svg += ` class="vm-path">\n`;

        layer.forEach((pathObj, pathIdx) => {
          let d = '';
          const segments = pathObj.segments || [];
          segments.forEach((seg, si) => {
            if (si === 0) {
              d += `M ${round(seg.x1)} ${round(seg.y1)} `;
            }
            if (seg.type === 'L') {
              d += `L ${round(seg.x2)} ${round(seg.y2)} `;
            } else if (seg.type === 'Q') {
              d += `Q ${round(seg.x2)} ${round(seg.y2)} ${round(seg.x3)} ${round(seg.y3)} `;
            }
          });
          if (d.length > 0) {
            d += 'Z';
            svg += `    <path d="${d}" />\n`;
          }
        });

        svg += `  </g>\n`;
      });

      svg += `</svg>`;
      return svg;
    },

    /**
     * Converts Tracedata to Encapsulated PostScript (EPS Level 3)
     * Format widely accepted by Adobe Illustrator, CorelDRAW, Inkscape, and vinyl plotters
     */
    generateEPS(td, opts = {}) {
      const mode = opts.mode || 'stroke_fill';
      const isStroke = mode === 'stroke_fill';
      const strokeWidth = opts.strokeWidth || 0.6;
      const w = Math.round(td.width || 400);
      const h = Math.round(td.height || 400);

      let eps = `%!PS-Adobe-3.0 EPSF-3.0\n`;
      eps += `%%BoundingBox: 0 0 ${w} ${h}\n`;
      eps += `%%HiResBoundingBox: 0.000 0.000 ${w}.000 ${h}.000\n`;
      eps += `%%Title: Vector Magic Traced Vector\n`;
      eps += `%%Creator: VectorMagic Web App (Reversed with REA)\n`;
      eps += `%%Pages: 1\n`;
      eps += `%%DocumentData: Clean7Bit\n`;
      eps += `%%LanguageLevel: 3\n`;
      eps += `%%EndComments\n\n`;

      eps += `%%BeginProlog\n`;
      eps += `/m {moveto} bind def\n`;
      eps += `/l {lineto} bind def\n`;
      eps += `/c {curveto} bind def\n`;
      eps += `/cp {closepath} bind def\n`;
      eps += `/rgb {setrgbcolor} bind def\n`;
      eps += `%%EndProlog\n\n`;

      eps += `%%Page: 1 1\n`;
      eps += `gsave\n`;
      eps += `${strokeWidth} setlinewidth 1 setlinejoin 1 setlinecap\n\n`;

      td.layers.forEach((layer, layerIdx) => {
        const col = td.palette[layerIdx];
        if (!col || col.a === 0) return;
        if (opts.hiddenColors && opts.hiddenColors.has(layerIdx)) return;
        if (opts.transparentBg && layerIdx === 0 && (col.r > 240 && col.g > 240 && col.b > 240)) return;

        const r = (col.r / 255).toFixed(4);
        const g = (col.g / 255).toFixed(4);
        const b = (col.b / 255).toFixed(4);

        eps += `% Layer ${layerIdx}: rgb(${col.r}, ${col.g}, ${col.b})\n`;
        eps += `${r} ${g} ${b} rgb\n`;

        layer.forEach((pathObj) => {
          const segments = pathObj.segments || [];
          if (segments.length === 0) return;

          eps += `newpath\n`;
          segments.forEach((seg, si) => {
            // PostScript origin is bottom-left, invert Y
            const y1 = (h - seg.y1).toFixed(2);
            if (si === 0) {
              eps += `${seg.x1.toFixed(2)} ${y1} m\n`;
            }

            if (seg.type === 'L') {
              const y2 = (h - seg.y2).toFixed(2);
              eps += `${seg.x2.toFixed(2)} ${y2} l\n`;
            } else if (seg.type === 'Q') {
              // Elevate Quadratic Bézier (P0, QP, P2) to Cubic Bézier (P0, CP1, CP2, P2)
              const cp1x = (seg.x1 + (2 / 3) * (seg.x2 - seg.x1)).toFixed(2);
              const cp1y = (h - (seg.y1 + (2 / 3) * (seg.y2 - seg.y1))).toFixed(2);
              const cp2x = (seg.x3 + (2 / 3) * (seg.x2 - seg.x3)).toFixed(2);
              const cp2y = (h - (seg.y3 + (2 / 3) * (seg.y2 - seg.y3))).toFixed(2);
              const endX = seg.x3.toFixed(2);
              const endY = (h - seg.y3).toFixed(2);

              eps += `${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY} c\n`;
            }
          });

          eps += `cp\n`;
          if (isStroke) {
            eps += `gsave fill grestore stroke\n`;
          } else {
            eps += `fill\n`;
          }
        });
        eps += `\n`;
      });

      eps += `grestore\n`;
      eps += `showpage\n`;
      eps += `%%EOF\n`;

      return eps;
    },

    /**
     * Converts Tracedata to native Vector PDF
     * Uses pure PDF-1.4 vector stream syntax for zero-loss crisp infinite resolution
     */
    generatePDF(td, opts = {}) {
      const mode = opts.mode || 'stroke_fill';
      const isStroke = mode === 'stroke_fill';
      const strokeWidth = opts.strokeWidth || 0.6;
      const w = Math.round(td.width || 400);
      const h = Math.round(td.height || 400);

      // Build PDF vector stream content
      let stream = `q\n`;
      stream += `${strokeWidth} w 1 j 1 J\n`;

      td.layers.forEach((layer, layerIdx) => {
        const col = td.palette[layerIdx];
        if (!col || col.a === 0) return;
        if (opts.hiddenColors && opts.hiddenColors.has(layerIdx)) return;
        if (opts.transparentBg && layerIdx === 0 && (col.r > 240 && col.g > 240 && col.b > 240)) return;

        const r = (col.r / 255).toFixed(4);
        const g = (col.g / 255).toFixed(4);
        const b = (col.b / 255).toFixed(4);

        stream += `${r} ${g} ${b} rg\n`;
        if (isStroke) {
          stream += `${r} ${g} ${b} RG\n`;
        }

        layer.forEach((pathObj) => {
          const segments = pathObj.segments || [];
          if (segments.length === 0) return;

          segments.forEach((seg, si) => {
            const y1 = (h - seg.y1).toFixed(2);
            if (si === 0) {
              stream += `${seg.x1.toFixed(2)} ${y1} m\n`;
            }

            if (seg.type === 'L') {
              const y2 = (h - seg.y2).toFixed(2);
              stream += `${seg.x2.toFixed(2)} ${y2} l\n`;
            } else if (seg.type === 'Q') {
              const cp1x = (seg.x1 + (2 / 3) * (seg.x2 - seg.x1)).toFixed(2);
              const cp1y = (h - (seg.y1 + (2 / 3) * (seg.y2 - seg.y1))).toFixed(2);
              const cp2x = (seg.x3 + (2 / 3) * (seg.x2 - seg.x3)).toFixed(2);
              const cp2y = (h - (seg.y3 + (2 / 3) * (seg.y2 - seg.y3))).toFixed(2);
              const endX = seg.x3.toFixed(2);
              const endY = (h - seg.y3).toFixed(2);

              stream += `${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY} c\n`;
            }
          });

          stream += `h\n`;
          if (isStroke) {
            stream += `B\n`; // Fill and stroke path
          } else {
            stream += `f\n`; // Fill path
          }
        });
      });

      stream += `Q\n`;

      const streamBytes = new TextEncoder().encode(stream);
      const streamLen = streamBytes.length;

      // Construct standard PDF 1.4 catalog, pages, page, content stream
      const objects = [];
      const offsets = [];

      function addObject(content) {
        objects.push(content);
      }

      // 1: Catalog
      addObject(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

      // 2: Pages
      addObject(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);

      // 3: Page
      addObject(
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Contents 4 0 R /Resources << >> >>\nendobj\n`
      );

      // 4: Contents Stream
      addObject(
        `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`
      );

      // Assemble PDF with exact byte offsets for xref table
      let pdfHeader = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
      let currentOffset = pdfHeader.length;

      offsets.push(0); // 0th object is always free
      let body = '';
      objects.forEach((obj) => {
        offsets.push(currentOffset);
        body += obj;
        currentOffset += obj.length;
      });

      const xrefOffset = currentOffset;
      let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
      offsets.slice(1).forEach((off) => {
        xref += `${('0000000000' + off).slice(-10)} 00000 n \n`;
      });

      let trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

      return pdfHeader + body + xref + trailer;
    },

    /**
     * Download text / blob file to user's browser
     */
    downloadFile(content, filename, mimeType) {
      const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    }
  };

  window.VectorExporters = VectorExporters;
})(window);
