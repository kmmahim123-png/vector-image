/**
 * Free Vector Image - Main Application Controller
 * Handles Studio Viewport, Deep Zoom (up to 3200%), Gap-Free Exporters,
 * Preset Switching, and Checkerboard Cleaner
 */

(function () {
  'use strict';

  // Instantiate Vector Engine
  const engine = new window.VectorEngine();

  // App State
  const state = {
    screen: 'hero', // 'hero' | 'processing' | 'result'
    fileName: 'vector-image.svg',
    originalImage: null,
    tracedata: null,
    stats: null,
    zoom: 1,
    pan: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
    splitPos: 50,
    isDraggingSplit: false,
    viewMode: 'split', // 'split' | 'side' | 'vector' | 'original' | 'wireframe'
    hiddenColors: new Set(),
    transparentBg: false,
    cleanCheckerboard: true,
    currentPreset: 'ultra',
    options: {
      numberofcolors: 32,
      ltres: 0.05,
      qtres: 0.12,
      pathomit: 3,
      blurradius: 2,
      blurdelta: 25
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
    paletteContainer: document.getElementById('palette-container'),
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
    detailSlider: document.getElementById('detail-slider'),
    smoothingSlider: document.getElementById('smoothing-slider'),
    despeckleSlider: document.getElementById('despeckle-slider'),
    diffModal: document.getElementById('diff-modal'),
    diffModalClose: document.getElementById('diff-modal-close'),
    diffModalTrigger: document.getElementById('diff-modal-trigger')
  };

  /**
   * Initialize Application
   */
  function init() {
    setupUploadHandlers();
    setupSampleHandlers();
    setupViewerControls();
    setupDownloadButtons();
    setupEditControls();
    setupModals();
    setupHeroSlider();
    setupClipboardPaste();

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

  /**
   * Clipboard Paste Handler
   */
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
        let suggestedPreset = 'ultra';

        if (sampleType === 'waterfall') {
          dataUrl = window.SampleGenerator.createWaterfallSample();
          sampleName = 'Waterfall_Landscape.png';
          suggestedPreset = 'detailed';
        } else if (sampleType === 'bird') {
          dataUrl = window.SampleGenerator.createBirdSample();
          sampleName = 'Songbird_Transparent.png';
          suggestedPreset = 'ultra';
        } else if (sampleType === 'logo') {
          dataUrl = window.SampleGenerator.createLogoSample();
          sampleName = 'CyberCore_Tech_Logo.png';
          suggestedPreset = 'logo';
        } else if (sampleType === 'mandala') {
          dataUrl = window.SampleGenerator.createMandalaSample();
          sampleName = 'CNC_Laser_Mandala.png';
          suggestedPreset = 'silhouette';
        }

        state.currentPreset = suggestedPreset;
        applyPresetToSliders(suggestedPreset);
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
      engine.autoCleanBg = state.cleanCheckerboard;

      // Step 1: Load image & analyze heuristics
      const { image, hasCheckerboard } = await engine.loadImage(source, fileName);
      state.originalImage = image;
      DOM.originalImgTag.src = image.src;

      // Step 2: Vectorize with 100x quality options
      const { tracedata, stats } = await engine.vectorize(
        {
          preset: state.currentPreset,
          ...state.options
        },
        (progress) => {
          DOM.progressBar.style.width = `${progress.percent}%`;
          DOM.progressPercent.textContent = `${progress.percent}%`;
          DOM.progressStatus.textContent = progress.stage;
        }
      );

      state.tracedata = tracedata;
      state.stats = stats;
      state.hiddenColors.clear();

      // Step 3: Render and present
      updatePresetBadge();
      renderVectorPreview();
      updatePaletteUI();
      updateStatsUI();
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

  function applyPresetToSliders(presetKey) {
    const p = window.VectorEngine.Presets[presetKey];
    if (!p) return;

    state.options.numberofcolors = p.numberofcolors;
    state.options.ltres = p.ltres;
    state.options.qtres = p.qtres;
    state.options.pathomit = p.pathomit;
    state.options.blurradius = p.blurradius;
    state.options.blurdelta = p.blurdelta;

    if (DOM.colorsCountSlider) {
      DOM.colorsCountSlider.value = p.numberofcolors;
      DOM.colorsCountVal.textContent = p.numberofcolors;
    }
    if (DOM.despeckleSlider) {
      DOM.despeckleSlider.value = p.pathomit;
    }

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === presetKey);
    });
  }

  /**
   * Render vector preview inside canvas
   */
  function renderVectorPreview() {
    if (!state.tracedata) return;

    const svgString = window.VectorExporters.generateSVG(state.tracedata, {
      mode: state.viewMode === 'wireframe' ? 'wireframe' : 'stroke_fill',
      strokeWidth: 0.75,
      hiddenColors: state.hiddenColors,
      transparentBg: state.transparentBg
    });

    DOM.vectorSvgContainer.innerHTML = svgString;

    if (state.viewMode === 'wireframe') {
      DOM.vectorSvgContainer.classList.add('wireframe-mode');
    } else {
      DOM.vectorSvgContainer.classList.remove('wireframe-mode');
    }

    updateViewModeDisplay();
  }

  /**
   * View Mode Switcher
   */
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
   * Deep Zoom (up to 3200%) & Pan Handlers
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

    document.querySelectorAll('.view-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-mode-btn').forEach((b) => b.classList.remove('active'));
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
    state.zoom = 1;
    state.pan = { x: 0, y: 0 };
    DOM.zoomLevelText.textContent = '100%';
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
   * Production Download Handlers: SVG, EPS, DXF, PDF, and 2K/4K/8K PNG
   */
  function setupDownloadButtons() {
    // Fill Only Group (Gap-free & cut ready)
    document.getElementById('dl-fill-svg').addEventListener('click', () => downloadFile('fill', 'svg'));
    document.getElementById('dl-fill-eps').addEventListener('click', () => downloadFile('fill', 'eps'));
    document.getElementById('dl-fill-dxf').addEventListener('click', () => downloadFile('fill', 'dxf'));
    document.getElementById('dl-fill-pdf').addEventListener('click', () => downloadFile('fill', 'pdf'));

    // Stroke + Fill Group (Web & Screen)
    document.getElementById('dl-stroke-svg').addEventListener('click', () => downloadFile('stroke_fill', 'svg'));
    document.getElementById('dl-stroke-eps').addEventListener('click', () => downloadFile('stroke_fill', 'eps'));
    document.getElementById('dl-stroke-pdf').addEventListener('click', () => downloadFile('stroke_fill', 'pdf'));

    // Ultra-HD Raster PNGs
    document.getElementById('dl-hires-png').addEventListener('click', () => downloadRasterPNG(2));
    document.getElementById('dl-hires-png-4x').addEventListener('click', () => downloadRasterPNG(4));
    document.getElementById('dl-hires-png-8x').addEventListener('click', () => downloadRasterPNG(8));
  }

  function downloadFile(mode, format) {
    if (!state.tracedata) return;
    const baseName = state.fileName.replace(/\.[^/.]+$/, '');
    const suffix = mode === 'fill' ? '-vector' : '-seamless';

    if (format === 'svg') {
      const svg = window.VectorExporters.generateSVG(state.tracedata, {
        mode,
        hiddenColors: state.hiddenColors,
        transparentBg: state.transparentBg
      });
      window.VectorExporters.downloadFile(svg, `${baseName}${suffix}.svg`, 'image/svg+xml');
    } else if (format === 'eps') {
      const eps = window.VectorExporters.generateEPS(state.tracedata, {
        mode,
        hiddenColors: state.hiddenColors,
        transparentBg: state.transparentBg
      });
      window.VectorExporters.downloadFile(eps, `${baseName}${suffix}.eps`, 'application/postscript');
    } else if (format === 'dxf') {
      const dxf = window.VectorExporters.generateDXF(state.tracedata, {
        hiddenColors: state.hiddenColors,
        transparentBg: state.transparentBg
      });
      window.VectorExporters.downloadFile(dxf, `${baseName}-cnc.dxf`, 'application/dxf');
    } else if (format === 'pdf') {
      const pdf = window.VectorExporters.generatePDF(state.tracedata, {
        mode,
        hiddenColors: state.hiddenColors,
        transparentBg: state.transparentBg
      });
      window.VectorExporters.downloadFile(pdf, `${baseName}${suffix}.pdf`, 'application/pdf');
    }
  }

  function downloadRasterPNG(scale = 4) {
    if (!state.tracedata) return;
    const svgString = window.VectorExporters.generateSVG(state.tracedata, {
      mode: 'stroke_fill',
      strokeWidth: 0.75,
      hiddenColors: state.hiddenColors,
      transparentBg: state.transparentBg
    });

    const w = state.tracedata.width * scale;
    const h = state.tracedata.height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const baseName = state.fileName.replace(/\.[^/.]+$/, '');
        window.VectorExporters.downloadFile(blob, `${baseName}-${scale}x-master.png`, 'image/png');
      });
    };
    img.src = url;
  }

  /**
   * Palette Management & Color Editor
   */
  function updatePaletteUI() {
    if (!state.tracedata || !DOM.paletteContainer) return;
    DOM.paletteContainer.innerHTML = '';

    const palette = state.tracedata.palette;
    palette.forEach((col, idx) => {
      if (col.a === 0) return;
      const hex = window.VectorExporters.rgbToHex(col.r, col.g, col.b);
      const isHidden = state.hiddenColors.has(idx);

      const item = document.createElement('div');
      item.className = `palette-item ${isHidden ? 'hidden-layer' : ''}`;
      item.innerHTML = `
        <div class="palette-swatch" style="background-color: ${hex}"></div>
        <div class="palette-info">
          <span class="palette-hex">${hex.toUpperCase()}</span>
          <span class="palette-layer">Layer #${idx}</span>
        </div>
        <div class="palette-actions">
          <input type="color" value="${hex}" class="color-picker-input" data-index="${idx}" title="Click to recolor this vector layer">
          <button class="palette-toggle-btn" data-index="${idx}" title="${isHidden ? 'Show layer' : 'Hide layer'}">
            ${isHidden ? '👁️‍🗨️' : '👁️'}
          </button>
        </div>
      `;

      DOM.paletteContainer.appendChild(item);
    });

    DOM.paletteContainer.querySelectorAll('.color-picker-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        engine.updatePaletteColor(idx, e.target.value);
        renderVectorPreview();
        updatePaletteUI();
      });
    });

    DOM.paletteContainer.querySelectorAll('.palette-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (state.hiddenColors.has(idx)) {
          state.hiddenColors.delete(idx);
        } else {
          state.hiddenColors.add(idx);
        }
        renderVectorPreview();
        updatePaletteUI();
      });
    });
  }

  /**
   * Stats UI Update
   */
  function updateStatsUI() {
    if (!state.stats || !DOM.statsBadge) return;
    DOM.statsBadge.innerHTML = `
      <span>🎨 <strong>${state.stats.colorsCount}</strong> Colors</span>
      <span>📐 <strong>${state.stats.pathsCount}</strong> Paths</span>
      <span>⚡ <strong>${state.stats.nodesCount}</strong> Anchors</span>
      <span>📦 Vector: <strong>${state.stats.vectorKb} KB</strong></span>
    `;
  }

  /**
   * Studio Drawer Controls
   */
  function setupEditControls() {
    DOM.btnEditResult.addEventListener('click', () => {
      DOM.editDrawer.classList.toggle('open');
    });

    DOM.closeEditDrawer.addEventListener('click', () => {
      DOM.editDrawer.classList.remove('open');
    });

    DOM.transparentBgToggle.addEventListener('change', (e) => {
      state.transparentBg = e.target.checked;
      renderVectorPreview();
    });

    if (DOM.cleanCheckerToggle) {
      DOM.cleanCheckerToggle.addEventListener('change', (e) => {
        state.cleanCheckerboard = e.target.checked;
      });
    }

    DOM.colorsCountSlider.addEventListener('input', (e) => {
      DOM.colorsCountVal.textContent = e.target.value;
      state.options.numberofcolors = parseInt(e.target.value, 10);
    });

    DOM.detailSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const res = (6 - val) * 0.05;
      state.options.ltres = res;
      state.options.qtres = res * 2;
    });

    DOM.smoothingSlider.addEventListener('input', (e) => {
      state.options.blurradius = parseInt(e.target.value, 10);
      state.options.blurdelta = 20 + state.options.blurradius * 5;
    });

    DOM.despeckleSlider.addEventListener('input', (e) => {
      state.options.pathomit = parseInt(e.target.value, 10);
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentPreset = btn.dataset.preset;
        applyPresetToSliders(state.currentPreset);
      });
    });

    DOM.applyEditBtn.addEventListener('click', async () => {
      DOM.editDrawer.classList.remove('open');
      if (state.originalImage) {
        processImageSource(state.originalImage.src, state.fileName);
      }
    });
  }

  /**
   * Modal Handlers
   */
  function setupModals() {
    DOM.diffModalTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      DOM.diffModal.classList.add('active');
    });

    DOM.diffModalClose.addEventListener('click', () => {
      DOM.diffModal.classList.remove('active');
    });

    DOM.diffModal.addEventListener('click', (e) => {
      if (e.target === DOM.diffModal) DOM.diffModal.classList.remove('active');
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
