/**
 * Free Vector Image Pro - Client Vector Engine Bridge
 * Dispatches vectorization to native Rust VTracer Engine + OpenCV Bilateral AI Filtering
 */

(function (window) {
  'use strict';

  class VectorEngine {
    constructor() {
      this.currentImage = null;
      this.dataUrl = null;
      this.fileName = 'vector-image.png';
      this.currentSvg = null;
      this.stats = null;
      this.palette = [];
      this.isProcessing = false;
    }

    /**
     * Enterprise Presets for $100/mo Professional Vector Production
     */
    static Presets = {
      auto: {
        name: 'Auto Precision (Exact Colors)',
        description: 'Preserves 100% of rich colors, smooth curves, and continuous sub-pixel contours.',
        preset: 'auto',
        colors_limit: 0,
        denoise_level: 'low',
        super_sampling: 2,
        filter_speckle: 8,
        corner_threshold: 75,
        length_threshold: 7.0,
        splice_threshold: 55,
        max_iterations: 30,
        clean_checkerboard: true
      },
      logo: {
        name: 'Clean Logo & Badge',
        description: 'Silky smooth contours, right-angle corner detection, 8 dominant brand colors, zero halos.',
        preset: 'logo',
        colors_limit: 8,
        denoise_level: 'medium',
        super_sampling: 2,
        filter_speckle: 8,
        corner_threshold: 75,
        length_threshold: 7.0,
        splice_threshold: 55,
        max_iterations: 30,
        clean_checkerboard: true
      },
      clipart: {
        name: 'Graphic & Clipart',
        description: 'Silky smooth Bézier curves, 16 distinct colors, stacked layers for zero white seams.',
        preset: 'ultra',
        colors_limit: 16,
        denoise_level: 'medium',
        super_sampling: 2,
        filter_speckle: 8,
        corner_threshold: 75,
        length_threshold: 7.0,
        splice_threshold: 55,
        max_iterations: 30,
        clean_checkerboard: true
      },
      illustration: {
        name: 'Illustration & Art',
        description: 'Rich 32-color palette, fine curve details, perfect for complex graphics and landscapes.',
        preset: 'detailed',
        colors_limit: 32,
        denoise_level: 'medium',
        super_sampling: 2,
        filter_speckle: 6,
        corner_threshold: 75,
        length_threshold: 6.0,
        splice_threshold: 55,
        max_iterations: 30,
        clean_checkerboard: true
      },
      cut_vinyl: {
        name: 'Laser & Vinyl Cutter',
        description: 'Monochrome closed cut contours with silky Bézier splines for CNC, vinyl, and laser cutting.',
        preset: 'cut_vinyl',
        colors_limit: 2,
        denoise_level: 'high',
        super_sampling: 2,
        filter_speckle: 8,
        corner_threshold: 80,
        length_threshold: 7.0,
        splice_threshold: 55,
        max_iterations: 30,
        clean_checkerboard: true
      },
      photo: {
        name: 'Photo / High-Fidelity',
        description: 'Maximum color fidelity and gradients with smooth, natural transitions.',
        preset: 'detailed',
        colors_limit: 0, // Auto / full
        denoise_level: 'low',
        super_sampling: 2,
        filter_speckle: 6,
        corner_threshold: 75,
        length_threshold: 5.0,
        splice_threshold: 55,
        max_iterations: 30,
        clean_checkerboard: false
      }
    };

    /**
     * Load image from file, blob, or URL
     */
    loadImage(source, name = 'vector-image.png') {
      return new Promise((resolve, reject) => {
        this.fileName = name;
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = () => {
          this.currentImage = img;

          // Convert to dataURL
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          this.dataUrl = canvas.toDataURL('image/png');
          resolve({
            image: img,
            width: canvas.width,
            height: canvas.height
          });
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        if (source instanceof File || source instanceof Blob) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.dataUrl = e.target.result;
            img.src = e.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(source);
        } else if (typeof source === 'string') {
          this.dataUrl = source;
          img.src = source;
        } else {
          reject(new Error('Unsupported source format'));
        }
      });
    }

    /**
     * Execute Enterprise Pro Vectorization
     */
    async vectorize(customOpts = {}, onProgress = () => {}) {
      if (!this.dataUrl) {
        throw new Error('No image loaded to vectorize');
      }

      this.isProcessing = true;

      try {
        onProgress({ stage: '1/3 AI Super-Sampling & Bilateral Edge Denoising...', percent: 25 });
        await new Promise((r) => setTimeout(r, 60));

        const presetKey = customOpts.presetKey || 'clipart';
        const basePreset = VectorEngine.Presets[presetKey] || VectorEngine.Presets.clipart;

        const options = {
          ...basePreset,
          ...customOpts
        };

        onProgress({ stage: '2/3 Fitting Continuous Cubic Bézier Splines...', percent: 65 });

        const response = await fetch('/api/vectorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: this.dataUrl,
            options: options
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Vectorization failed on server');
        }

        const data = await response.json();
        if (!data.success || !data.svg) {
          throw new Error(data.error || 'Vectorization returned no SVG');
        }

        this.currentSvg = data.svg;
        this.stats = data.stats || {};
        this.palette = data.palette || [];

        onProgress({ stage: '3/3 Vectorization Complete (Enterprise Pro Quality)', percent: 100, stats: this.stats });
        this.isProcessing = false;
        return {
          svg: data.svg,
          stats: this.stats,
          palette: this.palette
        };
      } catch (err) {
        this.isProcessing = false;
        throw err;
      }
    }

    /**
     * Dynamic client-side recoloring without server roundtrip
     */
    recolorClient(colorMapping) {
      if (!this.currentSvg) return this.currentSvg;

      let updatedSvg = this.currentSvg;
      for (const [oldHex, newHex] of Object.entries(colorMapping)) {
        if (newHex.toLowerCase() === 'transparent' || newHex.toLowerCase() === 'none') {
          // Remove paths
          const regex = new RegExp(`<path[^>]*fill="${oldHex}"[^>]*\\/?>`, 'gi');
          updatedSvg = updatedSvg.replace(regex, '');
          const pairRegex = new RegExp(`<path[^>]*fill="${oldHex}"[^>]*>[\\s\\S]*?<\\/path>`, 'gi');
          updatedSvg = updatedSvg.replace(pairRegex, '');
        } else {
          const regex = new RegExp(`fill="${oldHex}"`, 'gi');
          updatedSvg = updatedSvg.replace(regex, `fill="${newHex}"`);
        }
      }

      this.currentSvg = updatedSvg;
      return updatedSvg;
    }
  }

  window.VectorEngine = VectorEngine;
})(window);
