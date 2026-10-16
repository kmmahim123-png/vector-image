/**
 * Free Vector Image - Professional Multi-Format Exporter Suite
 * Converts native VTracer SVGs into SVG, EPS Level 3, AutoCAD DXF, Vector PDF, and 8K PNG
 */

(function (window) {
  'use strict';

  const VectorExporters = {
    /**
     * Download pure SVG (Standard, 4K, or 8K resolution headers)
     * Maintains responsive width="100%" height="100%" with preserveAspectRatio="xMidYMid meet"
     * so that Chrome, Firefox, Edge, and Illustrator NEVER render offscreen or show a blank/empty screen!
     */
    downloadVectorSVG(svgString, filename = 'vector-image.svg', targetWidth = null) {
      let outputSvg = svgString;
      if (targetWidth) {
        // Try native DOMParser first to guarantee 100% valid W3C XML with zero duplicate attributes
        let parsedSuccessfully = false;
        if (typeof window !== 'undefined' && window.DOMParser) {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const svgEl = doc.documentElement;
            if (svgEl && svgEl.tagName.toLowerCase() === 'svg' && !doc.querySelector('parsererror')) {
              const vb = svgEl.getAttribute('viewBox') || '';
              const vbParts = vb.trim().split(/[\s,]+/).map(parseFloat);
              let targetHeight = targetWidth;
              if (vbParts.length >= 4 && vbParts[2] > 0) {
                targetHeight = Math.round((targetWidth * vbParts[3]) / vbParts[2]);
              }
              const resLabel = targetWidth >= 7000 ? '8K-CinemaMaster' : (targetWidth >= 3000 ? '4K-UltraHD' : 'Standard');
              svgEl.setAttribute('width', '100%');
              svgEl.setAttribute('height', '100%');
              svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
              svgEl.setAttribute('data-resolution', resLabel);
              svgEl.setAttribute('data-render-width', String(targetWidth));
              svgEl.setAttribute('data-render-height', String(targetHeight));
              outputSvg = new XMLSerializer().serializeToString(doc);
              parsedSuccessfully = true;
            }
          } catch (e) {
            parsedSuccessfully = false;
          }
        }

        if (!parsedSuccessfully) {
          // Robust regex fallback with strict deduplication
          const vbMatch = svgString.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
          let targetHeight = targetWidth;
          if (vbMatch) {
            const vbW = parseFloat(vbMatch[3]);
            const vbH = parseFloat(vbMatch[4]);
            if (vbW > 0) {
              targetHeight = Math.round((targetWidth * vbH) / vbW);
            }
          }
          const resLabel = targetWidth >= 7000 ? '8K-CinemaMaster' : (targetWidth >= 3000 ? '4K-UltraHD' : 'Standard');
          outputSvg = outputSvg.replace(
            /<svg\b([^>]*)>/i,
            (match, attrs) => {
              let cleanAttrs = attrs
                .replace(/\s+width=["'][^"']*["']/gi, '')
                .replace(/\s+height=["'][^"']*["']/gi, '')
                .replace(/\s+preserveaspectratio=["'][^"']*["']/gi, '')
                .replace(/\s+data-resolution=["'][^"']*["']/gi, '')
                .replace(/\s+data-render-width=["'][^"']*["']/gi, '')
                .replace(/\s+data-render-height=["'][^"']*["']/gi, '');
              return `<svg${cleanAttrs} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" data-resolution="${resLabel}" data-render-width="${targetWidth}" data-render-height="${targetHeight}">`;
            }
          );
        }
      }
      this.downloadFile(outputSvg, filename, 'image/svg+xml');
    },

    downloadSVG(svgString, filename = 'vector-image.svg') {
      this.downloadVectorSVG(svgString, filename, null);
    },

    /**
     * Download Screen Print Separation Films ZIP package
     */
    async downloadScreenPrintZip(svgString, width = 800, height = 800, filename = 'Screen_Print_Separations.zip') {
      const response = await fetch('/api/screen-print-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg: svgString, width, height })
      });
      if (!response.ok) throw new Error('Failed to generate screen print films');
      const blob = await response.blob();
      this.downloadFile(blob, filename, 'application/zip');
    },

    /**
     * Download Laser / Vinyl Die-Cut Toolpath Contour
     */
    async downloadCutPath(imageBase64, offset = 6, filename = 'laser-vinyl-cut-contour.svg') {
      const response = await fetch('/api/cut-contour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, offset })
      });
      if (!response.ok) throw new Error('Failed to generate cut path');
      const data = await response.json();
      if (data.svg) {
        this.downloadFile(data.svg, filename, 'image/svg+xml');
      }
    },

    /**
     * Convert SVG string into PostScript Level 3 EPS
     */
    generateEPSFromSVG(svgString, width = 500, height = 500) {
      const w = Math.round(width);
      const h = Math.round(height);

      let eps = `%!PS-Adobe-3.0 EPSF-3.0\n`;
      eps += `%%BoundingBox: 0 0 ${w} ${h}\n`;
      eps += `%%HiResBoundingBox: 0.000 0.000 ${w}.000 ${h}.000\n`;
      eps += `%%Title: Free Vector Image Export\n`;
      eps += `%%Creator: Free Vector Image (https://freevectorimage.io)\n`;
      eps += `%%Pages: 1\n`;
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
      eps += `0.5 setlinewidth 1 setlinejoin 1 setlinecap\n\n`;

      // Parse path elements from SVG
      const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*fill="([^"]+)"[^>]*>/gi;
      let match;

      while ((match = pathRegex.exec(svgString)) !== null) {
        const d = match[1];
        const fill = match[2];
        const rgb = this.parseColorToRgb(fill);

        const r = (rgb.r / 255).toFixed(4);
        const g = (rgb.g / 255).toFixed(4);
        const b = (rgb.b / 255).toFixed(4);

        eps += `${r} ${g} ${b} rgb\n`;
        eps += `newpath\n`;

        // Translate SVG path tokens
        const tokens = d.match(/([a-df-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/gi) || [];
        let i = 0;
        let cmd = '';

        while (i < tokens.length) {
          const t = tokens[i];
          if (/^[a-df-z]$/i.test(t)) {
            cmd = t.toUpperCase();
            i++;
          }

          if (cmd === 'M' && i + 1 < tokens.length) {
            const px = parseFloat(tokens[i]);
            const py = h - parseFloat(tokens[i + 1]);
            eps += `${px.toFixed(2)} ${py.toFixed(2)} m\n`;
            i += 2;
          } else if (cmd === 'L' && i + 1 < tokens.length) {
            const px = parseFloat(tokens[i]);
            const py = h - parseFloat(tokens[i + 1]);
            eps += `${px.toFixed(2)} ${py.toFixed(2)} l\n`;
            i += 2;
          } else if (cmd === 'C' && i + 5 < tokens.length) {
            const x1 = parseFloat(tokens[i]);
            const y1 = h - parseFloat(tokens[i + 1]);
            const x2 = parseFloat(tokens[i + 2]);
            const y2 = h - parseFloat(tokens[i + 3]);
            const x3 = parseFloat(tokens[i + 4]);
            const y3 = h - parseFloat(tokens[i + 5]);
            eps += `${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} ${x3.toFixed(2)} ${y3.toFixed(2)} c\n`;
            i += 6;
          } else if (cmd === 'Z') {
            eps += `cp\n`;
          } else {
            i++;
          }
        }

        eps += `gsave fill grestore stroke\n\n`;
      }

      eps += `grestore\n`;
      eps += `showpage\n`;
      eps += `%%EOF\n`;

      return eps;
    },

    /**
     * Convert SVG string into AutoCAD DXF format
     */
    generateDXFFromSVG(svgString, width = 500, height = 500) {
      const h = height;
      let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n0\nENDSEC\n`;
      dxf += `0\nSECTION\n2\nENTITIES\n`;

      const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*>/gi;
      let match;
      let polyIdx = 0;

      while ((match = pathRegex.exec(svgString)) !== null) {
        const d = match[1];
        polyIdx++;
        dxf += `0\nPOLYLINE\n8\nLAYER_CUT\n66\n1\n70\n1\n`;

        const tokens = d.match(/([a-df-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/gi) || [];
        let i = 0;
        let cmd = '';

        while (i < tokens.length) {
          const t = tokens[i];
          if (/^[a-df-z]$/i.test(t)) {
            cmd = t.toUpperCase();
            i++;
          }

          if ((cmd === 'M' || cmd === 'L') && i + 1 < tokens.length) {
            const px = parseFloat(tokens[i]).toFixed(3);
            const py = (h - parseFloat(tokens[i + 1])).toFixed(3);
            dxf += `0\nVERTEX\n8\nLAYER_CUT\n10\n${px}\n20\n${py}\n30\n0.0\n`;
            i += 2;
          } else if (cmd === 'C' && i + 5 < tokens.length) {
            const x1 = parseFloat(tokens[i]);
            const y1 = parseFloat(tokens[i + 1]);
            const x2 = parseFloat(tokens[i + 2]);
            const y2 = parseFloat(tokens[i + 3]);
            const x3 = parseFloat(tokens[i + 4]);
            const y3 = parseFloat(tokens[i + 5]);

            // Discretize cubic Bézier into 4 vertices
            for (let s = 1; s <= 4; s++) {
              const u = s / 4;
              const inv = 1 - u;
              const vx = inv*inv*inv*x1 + 3*inv*inv*u*x1 + 3*inv*u*u*x2 + u*u*u*x3;
              const vy = h - (inv*inv*inv*y1 + 3*inv*inv*u*y1 + 3*inv*u*u*y2 + u*u*u*y3);
              dxf += `0\nVERTEX\n8\nLAYER_CUT\n10\n${vx.toFixed(3)}\n20\n${vy.toFixed(3)}\n30\n0.0\n`;
            }
            i += 6;
          } else {
            i++;
          }
        }

        dxf += `0\nSEQEND\n8\nLAYER_CUT\n`;
      }

      dxf += `0\nENDSEC\n0\nEOF\n`;
      return dxf;
    },

    /**
     * Convert SVG string into Vector PDF-1.4 stream
     */
    generatePDFFromSVG(svgString, width = 500, height = 500) {
      const w = Math.round(width);
      const h = Math.round(height);

      let stream = `q\n0.5 w 1 j 1 J\n`;

      const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*fill="([^"]+)"[^>]*>/gi;
      let match;

      while ((match = pathRegex.exec(svgString)) !== null) {
        const d = match[1];
        const fill = match[2];
        const rgb = this.parseColorToRgb(fill);

        const r = (rgb.r / 255).toFixed(4);
        const g = (rgb.g / 255).toFixed(4);
        const b = (rgb.b / 255).toFixed(4);

        stream += `${r} ${g} ${b} rg\n${r} ${g} ${b} RG\n`;

        const tokens = d.match(/([a-df-z]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/gi) || [];
        let i = 0;
        let cmd = '';

        while (i < tokens.length) {
          const t = tokens[i];
          if (/^[a-df-z]$/i.test(t)) {
            cmd = t.toUpperCase();
            i++;
          }

          if (cmd === 'M' && i + 1 < tokens.length) {
            const px = parseFloat(tokens[i]).toFixed(2);
            const py = (h - parseFloat(tokens[i + 1])).toFixed(2);
            stream += `${px} ${py} m\n`;
            i += 2;
          } else if (cmd === 'L' && i + 1 < tokens.length) {
            const px = parseFloat(tokens[i]).toFixed(2);
            const py = (h - parseFloat(tokens[i + 1])).toFixed(2);
            stream += `${px} ${py} l\n`;
            i += 2;
          } else if (cmd === 'C' && i + 5 < tokens.length) {
            const x1 = parseFloat(tokens[i]).toFixed(2);
            const y1 = (h - parseFloat(tokens[i + 1])).toFixed(2);
            const x2 = parseFloat(tokens[i + 2]).toFixed(2);
            const y2 = (h - parseFloat(tokens[i + 3])).toFixed(2);
            const x3 = parseFloat(tokens[i + 4]).toFixed(2);
            const y3 = (h - parseFloat(tokens[i + 5])).toFixed(2);
            stream += `${x1} ${y1} ${x2} ${y2} ${x3} ${y3} c\n`;
            i += 6;
          } else if (cmd === 'Z') {
            stream += `h\n`;
          } else {
            i++;
          }
        }

        stream += `B\n`;
      }

      stream += `Q\n`;
      const streamBytes = new TextEncoder().encode(stream);
      const streamLen = streamBytes.length;

      const objects = [];
      const offsets = [];

      objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
      objects.push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
      objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Contents 4 0 R /Resources << >> >>\nendobj\n`);
      objects.push(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`);

      let pdfHeader = `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n`;
      let currentOffset = pdfHeader.length;

      offsets.push(0);
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

    parseColorToRgb(colorStr) {
      if (!colorStr) return { r: 0, g: 0, b: 0 };
      if (colorStr.startsWith('#')) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        return {
          r: parseInt(hex.slice(0, 2), 16) || 0,
          g: parseInt(hex.slice(2, 4), 16) || 0,
          b: parseInt(hex.slice(4, 6), 16) || 0
        };
      }
      const match = colorStr.match(/\d+/g);
      if (match && match.length >= 3) {
        return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
      }
      return { r: 0, g: 0, b: 0 };
    },

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
      }, 250);
    }
  };

  window.VectorExporters = VectorExporters;
})(window);
