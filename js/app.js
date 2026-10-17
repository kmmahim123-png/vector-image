/**
 * Free Vector Image Pro - Main Application Controller
 * Powered by native Rust VTracer Engine + OpenCV Bilateral AI Filtering + K-Means Color Snapping
 */

(function () {
  'use strict';

  // Instantiate Vector Engine
  const engine = new window.VectorEngine();

  // App State
  const state = {
    screen: 'hero',
    fileName: 'vector-image.svg',
    originalImage: null,
    svgString: null,
    stats: null,
    palette: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    splitPos: 50,
    isDraggingSplit: false,
    viewMode: 'split',
    currentPreset: 'auto',
    cleanCheckerboard: true,
    transparentBg: false,
    denoiseLevel: 'low',
    colorsLimit: 0,
    options: {
      filter_speckle: 8,
      corner_threshold: 75,
      length_threshold: 7.0,
      splice_threshold: 55,
      max_iterations: 30
    }
  };

  // DOM Elements
  const DOM = {
    heroSection: document.getElementById('hero-section'),
    processingSection: document.getElementById('processing-section'),
    resultSection: document.getElementById('result-section'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    uploadBtn: document.getElementById('upload-btn'),
    navUploadTrigger: document.getElementById('nav-upload-trigger'),
    progressBar: document.getElementById('progress-bar'),
    progressStatus: document.getElementById('progress-status'),
    progressPercent: document.getElementById('progress-percent'),
    resultFilename: document.getElementById('result-filename'),
    presetBadge: document.getElementById('preset-badge'),
    canvasContainer: document.getElementById('canvas-container'),
    originalImgTag: document.getElementById('original-image-view'),
    vectorSvgContainer: document.getElementById('vector-svg-container'),
    splitDivider: document.getElementById('split-divider'),
    splitHandle: document.getElementById('split-handle'),
    zoomLevelText: document.getElementById('zoom-level-text'),
    zoomInBtn: document.getElementById('zoom-in-btn'),
    zoomOutBtn: document.getElementById('zoom-out-btn'),
    zoomResetBtn: document.getElementById('zoom-reset-btn'),
    statsBadge: document.getElementById('stats-badge'),
    studioPaletteBar: document.getElementById('studio-palette-bar'),
    paletteCountBadge: document.getElementById('palette-count-badge'),
    studioSwatchesRow: document.getElementById('studio-swatches-row'),
    sampleCards: document.querySelectorAll('.sample-card'),
    btnEditResult: document.getElementById('btn-edit-result'),
    btnNewImage: document.getElementById('btn-new-image'),
    editDrawer: document.getElementById('edit-drawer'),
    closeEditDrawer: document.getElementById('close-edit-drawer'),
    applyEditBtn: document.getElementById('apply-edit-btn'),
    transparentBgToggle: document.getElementById('toggle-transparent-bg'),
    cleanCheckerToggle: document.getElementById('toggle-clean-checker'),
    colorsCountSlider: document.getElementById('colors-count-slider'),
    colorsCountVal: document.getElementById('colors-count-val'),
    denoiseVal: document.getElementById('denoise-val'),
    detailSlider: document.getElementById('detail-slider'),
    smoothingSlider: document.getElementById('smoothing-slider'),
    despeckleSlider: document.getElementById('despeckle-slider'),
    dlVectorStd: document.getElementById('dl-vector-std'),
    dlVector4k: document.getElementById('dl-vector-4k'),
    dlVector8k: document.getElementById('dl-vector-8k'),
    dlFillSvg: document.getElementById('dl-fill-svg'),
    dlHiresPng: document.getElementById('dl-hires-png'),
    dlHiresPng4x: document.getElementById('dl-hires-png-4x'),
    dlHiresPng8x: document.getElementById('dl-hires-png-8x'),
    dlFillEps: document.getElementById('dl-fill-eps'),
    dlFillPdf: document.getElementById('dl-fill-pdf')
  };

  /**
   * Initialize
   */
  function init() {
    setupUploadHandlers();
    setupSampleHandlers();
    setupViewerControls();
    setupDownloadButtons();
    setupEditControls();
    setupHeroSlider();
    setupClipboardPaste();

    window.addEventListener('resize', () => {
      if (state.screen === 'result') {
        resetZoomAndPan();
      }
    });

    // Generate thumbnails for instant samples
    setTimeout(() => {
      const waterfallSample = window.SampleGenerator.createWaterfallSample();
      const birdSample = window.SampleGenerator.createBirdSample();
      const logoSample = window.SampleGenerator.createLogoSample();
      const mandalaSample = window.SampleGenerator.createMandalaSample();

      const img1 = document.getElementById('sample-img-waterfall');
      const img2 = document.getElementById('sample-img-bird');
      const img3 = document.getElementById('sample-img-logo');
      const img4 = document.getElementById('sample-img-mandala');

      if (img1) img1.src = waterfallSample;
      if (img2) img2.src = birdSample;
      if (img3) img3.src = logoSample;
      if (img4) img4.src = mandalaSample;
    }, 60);
  }

  /**
   * Upload & Drag-and-drop Handlers
   */
  function setupUploadHandlers() {
    DOM.uploadBtn.addEventListener('click', () => DOM.fileInput.click());
    if (DOM.navUploadTrigger) {
      DOM.navUploadTrigger.addEventListener('click', () => {
        showScreen('hero');
        DOM.fileInput.click();
      });
    }

    DOM.dropZone.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') DOM.fileInput.click();
    });

    DOM.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      DOM.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      DOM.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        DOM.dropZone.classList.remove('dragover');
      });
    });

    DOM.dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) {
        handleFileSelect(dt.files[0]);
      }
    });

    DOM.btnNewImage.addEventListener('click', () => {
      showScreen('hero');
    });
  }

  function setupClipboardPaste() {
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          handleFileSelect(blob, 'pasted-artwork.png');
          break;
        }
      }
    });
  }

  /**
   * Sample Image Cards
   */
  function setupSampleHandlers() {
    DOM.sampleCards.forEach((card) => {
      card.addEventListener('click', () => {
        const sampleType = card.dataset.sample;
        let dataUrl = '';
        let sampleName = 'vector-sample.png';
        let suggestedPreset = 'logo';

        if (sampleType === 'waterfall') {
          dataUrl = window.SampleGenerator.createWaterfallSample();
          sampleName = 'Waterfall_Landscape.png';
          suggestedPreset = 'illustration';
          state.colorsLimit = 32;
        } else if (sampleType === 'bird') {
          dataUrl = window.SampleGenerator.createBirdSample();
          sampleName = 'Songbird_Transparent.png';
          suggestedPreset = 'auto';
          state.colorsLimit = 0;
        } else if (sampleType === 'logo') {
          dataUrl = window.SampleGenerator.createLogoSample();
          sampleName = 'CyberCore_Tech_Logo.png';
          suggestedPreset = 'logo';
          state.colorsLimit = 8;
        } else if (sampleType === 'mandala') {
          dataUrl = window.SampleGenerator.createMandalaSample();
          sampleName = 'CNC_Laser_Mandala.png';
          suggestedPreset = 'cut_vinyl';
          state.colorsLimit = 2;
        }

        state.currentPreset = suggestedPreset;
        applyPresetToControls(suggestedPreset);
        processImageSource(dataUrl, sampleName);
      });
    });
  }

  function handleFileSelect(file, fallbackName) {
    const fileName = file.name || fallbackName || 'vector-graphic.png';
    processImageSource(file, fileName);
  }

  /**
   * Central Vector Tracing Pipeline
   */
  async function processImageSource(source, fileName) {
    state.fileName = fileName;
    DOM.resultFilename.textContent = fileName;
    showScreen('processing');

    try {
      const { image } = await engine.loadImage(source, fileName);
      state.originalImage = image;
      DOM.originalImgTag.src = image.src;

      // Vectorize via Enterprise AI engine
      const { svg, stats, palette } = await engine.vectorize(
        {
          presetKey: state.currentPreset,
          colors_limit: state.colorsLimit,
          denoise_level: state.denoiseLevel,
          clean_checkerboard: state.cleanCheckerboard,
          transparent_bg: state.transparentBg,
          ...state.options
        },
        (progress) => {
          DOM.progressBar.style.width = `${progress.percent}%`;
          DOM.progressPercent.textContent = `${progress.percent}%`;
          DOM.progressStatus.textContent = progress.stage;
        }
      );

      state.svgString = svg;
      state.stats = stats;
      state.palette = palette || [];

      updatePresetBadge();
      renderVectorPreview();
      updateStatsUI();
      renderPaletteBar(state.palette);
      resetZoomAndPan();

      showScreen('result');
    } catch (err) {
      console.error('Vectorization error:', err);
      alert('Vectorization failed: ' + err.message);
      showScreen('hero');
    }
  }

  function updatePresetBadge() {
    const p = window.VectorEngine.Presets[state.currentPreset];
    if (p && DOM.presetBadge) {
      DOM.presetBadge.textContent = `✨ ${p.name}`;
    }
  }

  function applyPresetToControls(presetKey) {
    const p = window.VectorEngine.Presets[presetKey];
    if (!p) return;

    state.colorsLimit = p.colors_limit !== undefined ? p.colors_limit : 8;
    state.denoiseLevel = p.denoise_level || 'medium';
    state.options.filter_speckle = p.filter_speckle || 8;
    state.options.corner_threshold = p.corner_threshold || 75;
    state.options.length_threshold = p.length_threshold || 7.0;
    state.options.splice_threshold = p.splice_threshold || 55;
    state.options.max_iterations = p.max_iterations || 30;

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });

    document.querySelectorAll('.denoise-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.denoise === state.denoiseLevel);
    });
    if (DOM.denoiseVal) DOM.denoiseVal.textContent = state.denoiseLevel;

    document.querySelectorAll('.color-limit-btn').forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.limit, 10) === state.colorsLimit);
    });
    if (DOM.colorsCountVal) DOM.colorsCountVal.textContent = state.colorsLimit === 0 ? 'Auto' : state.colorsLimit;
    if (DOM.colorsCountSlider) DOM.colorsCountSlider.value = state.colorsLimit || 32;
  }

  function updateCanvasDimensions() {
    let w = (state.stats && state.stats.width) || 500;
    let h = (state.stats && state.stats.height) || 500;

    if (state.svgString) {
      const vbMatch = state.svgString.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
      if (vbMatch) {
        w = parseFloat(vbMatch[3]) || w;
        h = parseFloat(vbMatch[4]) || h;
      }
    }

    const stage = document.getElementById('viewer-stage');
    if (stage) {
      stage.style.width = `${w}px`;
      stage.style.height = `${h}px`;
    }

    DOM.vectorSvgContainer.style.width = `${w}px`;
    DOM.vectorSvgContainer.style.height = `${h}px`;
    DOM.originalImgTag.style.width = `${w}px`;
    DOM.originalImgTag.style.height = `${h}px`;

    const svg = DOM.vectorSvgContainer.querySelector('svg');
    if (svg) {
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
    }
  }

  function calculateFitZoom() {
    let w = (state.stats && state.stats.width) || 500;
    let h = (state.stats && state.stats.height) || 500;

    if (state.svgString) {
      const vbMatch = state.svgString.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
      if (vbMatch) {
        w = parseFloat(vbMatch[3]) || w;
        h = parseFloat(vbMatch[4]) || h;
      }
    }

    const viewport = DOM.canvasContainer;
    if (!viewport) return 1;
    const vw = viewport.clientWidth || 750;
    const vh = viewport.clientHeight || 540;
    const pad = 60;
    const scaleX = (vw - pad) / w;
    const scaleY = (vh - pad) / h;
    const fitScale = Math.min(scaleX, scaleY);
    return Math.max(0.1, Number(fitScale.toFixed(2)));
  }

  function renderVectorPreview() {
    if (!state.svgString) return;
    DOM.vectorSvgContainer.innerHTML = state.svgString;

    if (state.viewMode === 'wireframe') {
      DOM.vectorSvgContainer.classList.add('wireframe-mode');
    } else {
      DOM.vectorSvgContainer.classList.remove('wireframe-mode');
    }

    updateCanvasDimensions();
    updateViewModeDisplay();
  }

  /**
   * Interactive Color Palette Bar (Vector Magic Style)
   */
  function renderPaletteBar(palette) {
    if (!DOM.studioSwatchesRow) return;
    DOM.studioSwatchesRow.innerHTML = '';

    if (!palette || palette.length === 0) {
      DOM.studioPaletteBar.style.display = 'none';
      return;
    }

    DOM.studioPaletteBar.style.display = 'block';
    if (DOM.paletteCountBadge) DOM.paletteCountBadge.textContent = palette.length;

    palette.forEach((item) => {
      const pill = document.createElement('div');
      pill.className = 'swatch-pill';
      pill.dataset.hex = item.hex;

      pill.innerHTML = `
        <div class="swatch-color-box" style="background-color: ${item.hex};"></div>
        <span class="swatch-hex">${item.hex}</span>
        <span class="swatch-pct">${item.percentage}%</span>
        <button class="swatch-btn-remove" title="Make Transparent (Remove Background)">✕</button>
      `;

      // Hover to highlight matching paths
      pill.addEventListener('mouseenter', () => {
        const paths = DOM.vectorSvgContainer.querySelectorAll(`path[fill="${item.hex}"]`);
        paths.forEach((p) => {
          p.dataset.origOpacity = p.style.opacity || '1';
          p.style.filter = 'drop-shadow(0 0 6px #06b6d4)';
        });
      });

      pill.addEventListener('mouseleave', () => {
        const paths = DOM.vectorSvgContainer.querySelectorAll(`path[fill="${item.hex}"]`);
        paths.forEach((p) => {
          p.style.filter = 'none';
        });
      });

      // Remove / Make Transparent button
      const removeBtn = pill.querySelector('.swatch-btn-remove');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.svgString = engine.recolorClient({ [item.hex]: 'transparent' });
        renderVectorPreview();
        pill.remove();
        if (state.stats) {
          state.stats.pathsCount = Math.max(1, (state.stats.pathsCount || 10) - item.count);
          state.stats.colorsCount = Math.max(1, (state.stats.colorsCount || 2) - 1);
          updateStatsUI();
        }
      });

      // Recolor: Click pill to open native color picker
      pill.addEventListener('click', () => {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = item.hex.length === 7 ? item.hex : '#ffffff';
        colorInput.style.position = 'fixed';
        colorInput.style.opacity = '0';
        document.body.appendChild(colorInput);
        colorInput.click();

        colorInput.addEventListener('change', () => {
          const newColor = colorInput.value.toUpperCase();
          state.svgString = engine.recolorClient({ [item.hex]: newColor });
          renderVectorPreview();
          pill.querySelector('.swatch-color-box').style.backgroundColor = newColor;
          pill.querySelector('.swatch-hex').textContent = newColor;
          item.hex = newColor;
          document.body.removeChild(colorInput);
        });
      });

      DOM.studioSwatchesRow.appendChild(pill);
    });
  }

  function updateViewModeDisplay() {
    const originalPane = document.getElementById('pane-original');
    const vectorPane = document.getElementById('pane-vector');
    const divider = DOM.splitDivider;

    if (state.viewMode === 'split') {
      originalPane.style.display = 'block';
      vectorPane.style.display = 'block';
      divider.style.display = 'block';
      setSplitPosition(state.splitPos);
    } else if (state.viewMode === 'side') {
      originalPane.style.display = 'block';
      vectorPane.style.display = 'block';
      divider.style.display = 'none';
      originalPane.style.clipPath = 'none';
      vectorPane.style.clipPath = 'none';
    } else if (state.viewMode === 'vector' || state.viewMode === 'wireframe') {
      originalPane.style.display = 'none';
      vectorPane.style.display = 'block';
      divider.style.display = 'none';
      vectorPane.style.clipPath = 'none';
    } else if (state.viewMode === 'original') {
      originalPane.style.display = 'block';
      vectorPane.style.display = 'none';
      divider.style.display = 'none';
      originalPane.style.clipPath = 'none';
    }
  }

  function setSplitPosition(pos) {
    state.splitPos = Math.max(0, Math.min(100, pos));
    DOM.splitDivider.style.left = `${state.splitPos}%`;
    const vectorPane = document.getElementById('pane-vector');
    if (vectorPane) {
      vectorPane.style.clipPath = `polygon(${state.splitPos}% 0, 100% 0, 100% 100%, ${state.splitPos}% 100%)`;
    }
  }

  /**
   * Deep Zoom & Pan
   */
  function setupViewerControls() {
    DOM.zoomInBtn.addEventListener('click', () => changeZoom(1.4));
    DOM.zoomOutBtn.addEventListener('click', () => changeZoom(1 / 1.4));
    DOM.zoomResetBtn.addEventListener('click', () => resetZoomAndPan());

    DOM.canvasContainer.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.25 : 0.8;
        changeZoom(factor);
      },
      { passive: false }
    );

    DOM.canvasContainer.addEventListener('mousedown', (e) => {
      if (e.target.closest('#split-handle') || e.target.closest('#split-divider')) return;
      state.isPanning = true;
      state.panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
      DOM.canvasContainer.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isPanning) {
        state.pan.x = e.clientX - state.panStart.x;
        state.pan.y = e.clientY - state.panStart.y;
        applyTransform();
      }

      if (state.isDraggingSplit) {
        const rect = DOM.canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        setSplitPosition(pct);
      }
    });

    window.addEventListener('mouseup', () => {
      state.isPanning = false;
      state.isDraggingSplit = false;
      DOM.canvasContainer.classList.remove('panning');
    });

    DOM.splitHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      state.isDraggingSplit = true;
    });

    // Touchscreen Support for Split Dragging (iOS / iPadOS / Android)
    if (DOM.splitHandle) {
      DOM.splitHandle.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        state.isDraggingSplit = true;
      }, { passive: true });
    }

    // Touchscreen Support for Canvas Panning (1-finger drag)
    DOM.canvasContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('#split-handle') || e.target.closest('#split-divider')) return;
      if (e.touches.length === 1) {
        state.isPanning = true;
        state.panStart = { x: e.touches[0].clientX - state.pan.x, y: e.touches[0].clientY - state.pan.y };
        DOM.canvasContainer.classList.add('panning');
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (state.isDraggingSplit && e.touches.length > 0) {
        const rect = DOM.canvasContainer.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const pct = (x / rect.width) * 100;
        setSplitPosition(pct);
      } else if (state.isPanning && e.touches.length === 1) {
        state.pan.x = e.touches[0].clientX - state.panStart.x;
        state.pan.y = e.touches[0].clientY - state.panStart.y;
        applyTransform();
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      state.isPanning = false;
      state.isDraggingSplit = false;
      DOM.canvasContainer.classList.remove('panning');
    });

    // 1-Click Transparent Canvas Toggle Button
    const btnToggleBg = document.getElementById('btn-toggle-bg-canvas');
    if (btnToggleBg) {
      btnToggleBg.addEventListener('click', () => {
        state.transparentBg = !state.transparentBg;
        btnToggleBg.classList.toggle('active', state.transparentBg);
        btnToggleBg.innerHTML = state.transparentBg ? '☀️ Studio White BG' : '🏁 Transparent Canvas';

        if (state.svgString) {
          if (state.transparentBg) {
            // Strip solid background rect/path
            const match = state.svgString.match(/<path[^>]*fill="(#[Ff][A-Fa-f0-9]{5}|#[Ww][Hh][Ii][Tt][Ee])"[^>]*>/i);
            if (match) {
              state.svgString = state.svgString.replace(match[0], '');
            }
            state.svgString = state.svgString.replace(/<rect[^>]*fill="#ffffff"[^>]*\/>/i, '');
          } else {
            // Re-insert clean white studio background
            if (!state.svgString.includes('<rect width="100%" height="100%" fill="#ffffff"/>')) {
              state.svgString = state.svgString.replace(/(<svg\b[^>]*>)/i, '$1\n<rect width="100%" height="100%" fill="#ffffff"/>');
            }
          }
          renderVectorPreview();
        }
      });
    }

    document.querySelectorAll('.view-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.id === 'btn-toggle-bg-canvas') return;
        document.querySelectorAll('.view-mode-btn').forEach((b) => {
          if (b.id !== 'btn-toggle-bg-canvas') b.classList.remove('active');
        });
        btn.classList.add('active');
        state.viewMode = btn.dataset.mode;
        renderVectorPreview();
      });
    });
  }

  function changeZoom(factor) {
    state.zoom = Math.max(0.15, Math.min(32, state.zoom * factor));
    DOM.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
    applyTransform();
  }

  function resetZoomAndPan() {
    updateCanvasDimensions();
    state.zoom = calculateFitZoom();
    state.pan = { x: 0, y: 0 };
    DOM.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
    applyTransform();
    setSplitPosition(50);
  }

  function applyTransform() {
    const stage = document.getElementById('viewer-stage');
    if (stage) {
      stage.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    }
  }

  /**
   * Executive Download Handlers: Standard Vector SVG, 4K Vector SVG, 8K Vector SVG, High-Res PNG Suite (1x, 4K, 8K), EPS, PDF
   */
  function setupDownloadButtons() {
    const getBaseName = () => state.fileName.replace(/\.[^/.]+$/, '');

    // OPTION 1: Standard Vector Image (SVG)
    const dlStd = DOM.dlVectorStd || DOM.dlFillSvg;
    if (dlStd) {
      dlStd.addEventListener('click', () => {
        if (!state.svgString) return;
        window.VectorExporters.downloadVectorSVG(state.svgString, `${getBaseName()}.svg`, null);
      });
    }

    // OPTION 2: Download Vector Image 4K (3840px Ultra-HD native SVG artboard)
    if (DOM.dlVector4k) {
      DOM.dlVector4k.addEventListener('click', () => {
        if (!state.svgString) return;
        window.VectorExporters.downloadVectorSVG(state.svgString, `${getBaseName()}-4k.svg`, 3840);
      });
    }

    // OPTION 3: Download Vector Image 8K (7680px Cinema Master native SVG artboard)
    if (DOM.dlVector8k) {
      DOM.dlVector8k.addEventListener('click', () => {
        if (!state.svgString) return;
        window.VectorExporters.downloadVectorSVG(state.svgString, `${getBaseName()}-8k.svg`, 7680);
      });
    }

    // High-Resolution PNG Suite (1x, 4K, 8K)
    if (DOM.dlHiresPng) {
      DOM.dlHiresPng.addEventListener('click', () => downloadRasterPNG(1));
    }
    if (DOM.dlHiresPng4x) {
      DOM.dlHiresPng4x.addEventListener('click', () => downloadRasterPNG(4));
    }
    if (DOM.dlHiresPng8x) {
      DOM.dlHiresPng8x.addEventListener('click', () => downloadRasterPNG(8));
    }

    // Design Formats (EPS & PDF)
    if (DOM.dlFillEps) {
      DOM.dlFillEps.addEventListener('click', () => {
        if (!state.svgString) return;
        const w = (state.stats && state.stats.width) || 500;
        const h = (state.stats && state.stats.height) || 500;
        const eps = window.VectorExporters.generateEPSFromSVG(state.svgString, w, h);
        window.VectorExporters.downloadFile(eps, `${getBaseName()}.eps`, 'application/postscript');
      });
    }

    if (DOM.dlFillPdf) {
      DOM.dlFillPdf.addEventListener('click', () => {
        if (!state.svgString) return;
        const w = (state.stats && state.stats.width) || 500;
        const h = (state.stats && state.stats.height) || 500;
        const pdf = window.VectorExporters.generatePDFFromSVG(state.svgString, w, h);
        window.VectorExporters.downloadFile(pdf, `${getBaseName()}.pdf`, 'application/pdf');
      });
    }
  }

  function downloadRasterPNG(scale = 4) {
    if (!state.svgString) return;

    // Read aspect ratio from viewBox
    const vbMatch = state.svgString.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
    let vbW = (state.stats && state.stats.width) || 500;
    let vbH = (state.stats && state.stats.height) || 500;
    if (vbMatch) {
      vbW = parseFloat(vbMatch[3]) || vbW;
      vbH = parseFloat(vbMatch[4]) || vbH;
    }

    let w = vbW;
    let h = vbH;
    let suffix = '1x';

    if (scale === 4) {
      w = 3840;
      h = Math.round((3840 * vbH) / vbW);
      suffix = '4k-ultra';
    } else if (scale === 8) {
      w = 7680;
      h = Math.round((7680 * vbH) / vbW);
      suffix = '8k-master';
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = new Image();
    const svgBlob = new Blob([state.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const baseName = state.fileName.replace(/\.[^/.]+$/, '');
        window.VectorExporters.downloadFile(blob, `${baseName}-${suffix}.png`, 'image/png');
      }, 'image/png');
    };
    img.src = url;
  }

  function updateStatsUI() {
    if (!state.stats || !DOM.statsBadge) return;
    DOM.statsBadge.innerHTML = `
      <span>⚡ Engine: <strong>AI Spline Core</strong></span>
      <span>🎨 Colors: <strong>${state.stats.colorsCount || (state.palette ? state.palette.length : 8)}</strong></span>
      <span>📐 Smooth Paths: <strong>${state.stats.pathsCount || 42}</strong></span>
      <span>📦 Vector Size: <strong>${state.stats.svgSizeKb || 25} KB</strong></span>
    `;
  }

  function setupEditControls() {
    DOM.btnEditResult.addEventListener('click', () => {
      DOM.editDrawer.classList.toggle('open');
    });

    DOM.closeEditDrawer.addEventListener('click', () => {
      DOM.editDrawer.classList.remove('open');
    });

    if (DOM.cleanCheckerToggle) {
      DOM.cleanCheckerToggle.addEventListener('change', (e) => {
        state.cleanCheckerboard = e.target.checked;
      });
    }

    if (DOM.transparentBgToggle) {
      DOM.transparentBgToggle.addEventListener('change', (e) => {
        state.transparentBg = e.target.checked;
      });
    }

    // Color limit pills
    document.querySelectorAll('.color-limit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-limit-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.colorsLimit = parseInt(btn.dataset.limit, 10);
        if (DOM.colorsCountVal) DOM.colorsCountVal.textContent = state.colorsLimit === 0 ? 'Auto' : state.colorsLimit;
      });
    });

    if (DOM.colorsCountSlider) {
      DOM.colorsCountSlider.addEventListener('input', (e) => {
        state.colorsLimit = parseInt(e.target.value, 10);
        if (DOM.colorsCountVal) DOM.colorsCountVal.textContent = state.colorsLimit;
        document.querySelectorAll('.color-limit-btn').forEach((b) => {
          b.classList.toggle('active', parseInt(b.dataset.limit, 10) === state.colorsLimit);
        });
      });
    }

    // Denoise pills
    document.querySelectorAll('.denoise-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.denoise-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.denoiseLevel = btn.dataset.denoise;
        if (DOM.denoiseVal) DOM.denoiseVal.textContent = state.denoiseLevel;
      });
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentPreset = btn.dataset.preset;
        applyPresetToControls(state.currentPreset);
      });
    });

    // Bézier Curve Smoothing Slider (0=Smooth to 4=Ultra-Silky)
    if (DOM.smoothingSlider) {
      DOM.smoothingSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const configs = [
          { length: 4.0, splice: 45, iter: 20 },
          { length: 5.5, splice: 50, iter: 25 },
          { length: 7.0, splice: 55, iter: 30 },
          { length: 8.5, splice: 58, iter: 35 },
          { length: 10.0, splice: 62, iter: 40 }
        ];
        const cfg = configs[val] || configs[2];
        state.options.length_threshold = cfg.length;
        state.options.splice_threshold = cfg.splice;
        state.options.max_iterations = cfg.iter;
      });
    }

    // Corner Precision & Detail Slider (1=Silky Organic Curves to 5=Sharp Technical Angles)
    if (DOM.detailSlider) {
      DOM.detailSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const corners = [85, 80, 75, 70, 60];
        state.options.corner_threshold = corners[val - 1] || 75;
      });
    }

    // Despeckle / Jitter Filter Slider
    if (DOM.despeckleSlider) {
      DOM.despeckleSlider.addEventListener('input', (e) => {
        state.options.filter_speckle = parseInt(e.target.value, 10);
      });
    }

    DOM.applyEditBtn.addEventListener('click', async () => {
      DOM.editDrawer.classList.remove('open');
      if (state.originalImage) {
        processImageSource(state.originalImage.src, state.fileName);
      }
    });
  }

  function setupHeroSlider() {
    const heroSlider = document.getElementById('hero-compare-range');
    const heroVectorPane = document.getElementById('hero-vector-pane');

    if (heroSlider && heroVectorPane) {
      heroSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        heroVectorPane.style.clipPath = `polygon(${val}% 0, 100% 0, 100% 100%, ${val}% 100%)`;
      });
    }
  }

  function showScreen(screenName) {
    state.screen = screenName;
    DOM.heroSection.style.display = screenName === 'hero' ? 'block' : 'none';
    DOM.processingSection.style.display = screenName === 'processing' ? 'flex' : 'none';
    DOM.resultSection.style.display = screenName === 'result' ? 'block' : 'none';

    if (screenName === 'result') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
