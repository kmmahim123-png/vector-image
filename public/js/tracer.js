/**
 * Vector Magic Tracer Engine
 * Bridges ImageTracer with customizable presets, color quantization, and progress tracking
 */

(function (window) {
  'use strict';

  class VectorEngine {
    constructor() {
      this.currentImage = null;
      this.imageData = null;
      this.tracedata = null;
      this.activeOptions = null;
      this.fileName = 'artwork.png';
      this.isProcessing = false;
    }

    /**
     * Presets mirroring Vector Magic's fidelity modes
     */
    static Presets = {
      high: {
        numberofcolors: 24,
        colorsampling: 2,
        colorquantcycles: 3,
        mincolorratio: 0,
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 2,
        rightangleenhance: true,
        blurradius: 0,
        blurdelta: 20
      },
      medium: {
        numberofcolors: 16,
        colorsampling: 2,
        colorquantcycles: 3,
        mincolorratio: 0.005,
        ltres: 1,
        qtres: 1,
        pathomit: 8,
        rightangleenhance: true,
        blurradius: 1,
        blurdelta: 20
      },
      low: {
        numberofcolors: 8,
        colorsampling: 2,
        colorquantcycles: 2,
        mincolorratio: 0.02,
        ltres: 2,
        qtres: 2,
        pathomit: 16,
        rightangleenhance: false,
        blurradius: 2,
        blurdelta: 30
      },
      logo: {
        numberofcolors: 6,
        colorsampling: 2,
        colorquantcycles: 4,
        mincolorratio: 0.001,
        ltres: 0.8,
        qtres: 0.8,
        pathomit: 4,
        rightangleenhance: true,
        blurradius: 0,
        blurdelta: 10
      }
    };

    /**
     * Load image from file object or URL
     */
    loadImage(source, name = 'uploaded-image.png') {
      return new Promise((resolve, reject) => {
        this.fileName = name;
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
          this.currentImage = img;

          // Limit processing dimension to 1600px max to keep memory and computation optimal
          const maxDim = 1200;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;

          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);

          this.imageData = ctx.getImageData(0, 0, w, h);
          resolve({ image: img, width: w, height: h });
        };

        img.onerror = (err) => reject(new Error('Failed to load image source'));

        if (source instanceof File || source instanceof Blob) {
          const reader = new FileReader();
          reader.onload = (e) => (img.src = e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(source);
        } else if (typeof source === 'string') {
          img.src = source;
        } else {
          reject(new Error('Unsupported image source type'));
        }
      });
    }

    /**
     * Run the vectorization tracing pipeline
     * @param {Object} customOpts - Overrides for the preset
     * @param {Function} onProgress - Callback for progress step updates
     */
    async vectorize(customOpts = {}, onProgress = () => {}) {
      if (!this.imageData) {
        throw new Error('No image loaded to vectorize');
      }

      this.isProcessing = true;

      try {
        onProgress({ stage: 'Reading image data', percent: 15 });
        await new Promise((r) => setTimeout(r, 60));

        // Merge options
        const basePreset = VectorEngine.Presets[customOpts.preset || 'medium'] || VectorEngine.Presets.medium;
        const options = {
          ...basePreset,
          ...customOpts,
          roundcoords: 2,
          viewbox: true
        };
        this.activeOptions = options;

        onProgress({ stage: 'Quantizing colors & clustering palette', percent: 35 });
        await new Promise((r) => setTimeout(r, 80));

        onProgress({ stage: 'Extracting layer contours & boundaries', percent: 60 });
        await new Promise((r) => setTimeout(r, 80));

        // Call ImageTracer with image data
        const tracedata = window.ImageTracer.imagedataToTracedata(this.imageData, options);
        this.tracedata = tracedata;

        onProgress({ stage: 'Fitting Bézier curves & optimizing paths', percent: 85 });
        await new Promise((r) => setTimeout(r, 80));

        // Calculate statistics
        let totalPaths = 0;
        let totalSegments = 0;
        tracedata.layers.forEach((layer) => {
          totalPaths += layer.length;
          layer.forEach((path) => {
            totalSegments += (path.segments && path.segments.length) || 0;
          });
        });

        const stats = {
          colorsCount: tracedata.palette.length,
          pathsCount: totalPaths,
          segmentsCount: totalSegments,
          width: tracedata.width,
          height: tracedata.height
        };

        onProgress({ stage: 'Complete', percent: 100, stats });
        this.isProcessing = false;
        return { tracedata, stats };
      } catch (err) {
        this.isProcessing = false;
        throw err;
      }
    }

    /**
     * Re-color or toggle layers
     */
    updatePaletteColor(colorIndex, newHex) {
      if (!this.tracedata || !this.tracedata.palette[colorIndex]) return;
      const rgb = this.hexToRgb(newHex);
      if (rgb) {
        this.tracedata.palette[colorIndex].r = rgb.r;
        this.tracedata.palette[colorIndex].g = rgb.g;
        this.tracedata.palette[colorIndex].b = rgb.b;
      }
    }

    hexToRgb(hex) {
      const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return match
        ? {
            r: parseInt(match[1], 16),
            g: parseInt(match[2], 16),
            b: parseInt(match[3], 16)
          }
        : null;
    }
  }

  window.VectorEngine = VectorEngine;
})(window);
