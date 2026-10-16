/**
 * Vector Magic Web App Main Controller
 * Handles UI interactions, zoom/pan canvas, split-slider, vector downloads, and REA workbench
 */

(function () {
  'use strict';

  // Instantiate the vector engine
  const engine = new window.VectorEngine();

  // App State
  const state = {
    screen: 'hero', // 'hero' | 'processing' | 'result'
    fileName: 'WhatsApp Image 2026-10-16 at 12.01.59 PM.jpeg',
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
    currentPreset: 'medium',
    activeTab: 'download', // 'download' | 'edit' | 'rea'
    options: {
      numberofcolors: 16,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      blurradius: 1
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
    progressBar: document.getElementById('progress-bar'),
    progressStatus: document.getElementById('progress-status'),
    progressPercent: document.getElementById('progress-percent'),
    resultFilename: document.getElementById('result-filename'),
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
    colorsCountSlider: document.getElementById('colors-count-slider'),
    colorsCountVal: document.getElementById('colors-count-val'),
    detailSlider: document.getElementById('detail-slider'),
    smoothingSlider: document.getElementById('smoothing-slider'),
    despeckleSlider: document.getElementById('despeckle-slider'),
    diffModal: document.getElementById('diff-modal'),
    diffModalClose: document.getElementById('diff-modal-close'),
    diffModalTrigger: document.getElementById('diff-modal-trigger'),
    reaModal: document.getElementById('rea-modal'),
    reaModalClose: document.getElementById('rea-modal-close'),
    reaModalTrigger: document.getElementById('rea-modal-trigger'),
    rawCodePreview: document.getElementById('raw-code-preview'),
    rawCodeTypeSelect: document.getElementById('raw-code-type')
  };

  /**
   * Initialize App
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

    // Setup default sample image pre-load for instant trial
    setTimeout(() => {
      const whatsappSample = window.SampleGenerator.createWhatsAppSample();
      const mascotSample = window.SampleGenerator.createMascotSample();
      const logoSample = window.SampleGenerator.createLogoSample();

      const sampleImg1 = document.getElementById('sample-img-whatsapp');
      const sampleImg2 = document.getElementById('sample-img-mascot');
      const sampleImg3 = document.getElementById('sample-img-logo');

      if (sampleImg1) sampleImg1.src = whatsappSample;
      if (sampleImg2) sampleImg2.src = mascotSample;
      if (sampleImg3) sampleImg3.src = logoSample;
    }, 100);
  }

  /**
   * Upload & Drag-and-drop Handlers
   */
  function setupUploadHandlers() {
    DOM.uploadBtn.addEventListener('click', () => DOM.fileInput.click());
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
   * Support Ctrl+V clipboard paste directly
   */
  function setupClipboardPaste() {
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          handleFileSelect(blob, 'pasted-image.png');
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
        let sampleName = 'sample.png';

        if (sampleType === 'whatsapp') {
          dataUrl = window.SampleGenerator.createWhatsAppSample();
          sampleName = 'WhatsApp Image 2026-10-16 at 12.01.59 PM.jpeg';
        } else if (sampleType === 'mascot') {
          dataUrl = window.SampleGenerator.createMascotSample();
          sampleName = 'Vector_Magic_Hurricane_Mascot.png';
        } else if (sampleType === 'logo') {
          dataUrl = window.SampleGenerator.createLogoSample();
          sampleName = 'Nexus_Labs_Precision_Logo.png';
        }

        processImageSource(dataUrl, sampleName);
      });
    });
  }

  /**
   * Handle user selected file
   */
  function handleFileSelect(file, fallbackName) {
    const fileName = file.name || fallbackName || 'uploaded-image.png';
    processImageSource(file, fileName);
  }

  /**
   * Central Pipeline Processing function
   */
  async function processImageSource(source, fileName) {
    state.fileName = fileName;
    DOM.resultFilename.textContent = fileName;
    showScreen('processing');

    try {
      // Step 1: Load Image
      const { image, width, height } = await engine.loadImage(source, fileName);
      state.originalImage = image;
      DOM.originalImgTag.src = image.src;

      // Step 2: Vectorize with current options
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

      // Step 3: Render Result to Canvas & SVG Container
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

  /**
   * Render vector preview inside the comparison viewer
   */
  function renderVectorPreview() {
    if (!state.tracedata) return;

    const svgString = window.VectorExporters.generateSVG(state.tracedata, {
      mode: 'stroke_fill',
      strokeWidth: 0.75,
      hiddenColors: state.hiddenColors,
      transparentBg: state.transparentBg
    });

    DOM.vectorSvgContainer.innerHTML = svgString;

    // Apply wireframe styling if active
    if (state.viewMode === 'wireframe') {
      DOM.vectorSvgContainer.classList.add('wireframe-mode');
    } else {
      DOM.vectorSvgContainer.classList.remove('wireframe-mode');
    }

    updateViewModeDisplay();
  }

  /**
   * Update View Mode Display (Split, Side-by-side, Vector, Original, Wireframe)
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

  /**
   * Set split slider position (0 - 100%)
   */
  function setSplitPosition(pos) {
    state.splitPos = Math.max(0, Math.min(100, pos));
    DOM.splitDivider.style.left = `${state.splitPos}%`;
    const vectorPane = document.getElementById('pane-vector');
    if (vectorPane) {
      vectorPane.style.clipPath = `polygon(${state.splitPos}% 0, 100% 0, 100% 100%, ${state.splitPos}% 100%)`;
    }
  }

  /**
   * Setup Zoom and Pan Controls
   */
  function setupViewerControls() {
    // Zoom Buttons
    DOM.zoomInBtn.addEventListener('click', () => changeZoom(1.4));
    DOM.zoomOutBtn.addEventListener('click', () => changeZoom(1 / 1.4));
    DOM.zoomResetBtn.addEventListener('click', () => resetZoomAndPan());

    // Mouse wheel zoom
    DOM.canvasContainer.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.2 : 0.83;
        changeZoom(factor);
      },
      { passive: false }
    );

    // Pan by dragging
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

    // Split Divider Dragging
    DOM.splitHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      state.isDraggingSplit = true;
    });

    // View Mode Selector buttons
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
    state.zoom = Math.max(0.2, Math.min(25, state.zoom * factor));
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
   * Setup Download Buttons (Fill Only & Stroke + Fill: SVG, EPS, PDF)
   */
  function setupDownloadButtons() {
    // Fill Only Group
    document.getElementById('dl-fill-svg').addEventListener('click', () => downloadFile('fill', 'svg'));
    document.getElementById('dl-fill-eps').addEventListener('click', () => downloadFile('fill', 'eps'));
    document.getElementById('dl-fill-pdf').addEventListener('click', () => downloadFile('fill', 'pdf'));

    // Stroke + Fill Group
    document.getElementById('dl-stroke-svg').addEventListener('click', () => downloadFile('stroke_fill', 'svg'));
    document.getElementById('dl-stroke-eps').addEventListener('click', () => downloadFile('stroke_fill', 'eps'));
    document.getElementById('dl-stroke-pdf').addEventListener('click', () => downloadFile('stroke_fill', 'pdf'));

    // High Res PNG
    document.getElementById('dl-hires-png').addEventListener('click', () => downloadRasterPNG(2));
    document.getElementById('dl-hires-png-4x').addEventListener('click', () => downloadRasterPNG(4));
  }

  function downloadFile(mode, format) {
    if (!state.tracedata) return;
    const baseName = state.fileName.replace(/\.[^/.]+$/, '');
    const suffix = mode === 'fill' ? '-fill-only' : '-stroke-fill';

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
    } else if (format === 'pdf') {
      const pdf = window.VectorExporters.generatePDF(state.tracedata, {
        mode,
        hiddenColors: state.hiddenColors,
        transparentBg: state.transparentBg
      });
      window.VectorExporters.downloadFile(pdf, `${baseName}${suffix}.pdf`, 'application/pdf');
    }
  }

  /**
   * Render vector to high-res PNG at 2x or 4x supersampling
   */
  function downloadRasterPNG(scale = 2) {
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
        window.VectorExporters.downloadFile(blob, `${baseName}-${scale}x.png`, 'image/png');
      });
    };
    img.src = url;
  }

  /**
   * Update Palette UI in Edit Result drawer
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
          <input type="color" value="${hex}" class="color-picker-input" data-index="${idx}" title="Change color">
          <button class="palette-toggle-btn" data-index="${idx}" title="${isHidden ? 'Show layer' : 'Hide layer'}">
            ${isHidden ? '👁️‍🗨️' : '👁️'}
          </button>
        </div>
      `;

      DOM.paletteContainer.appendChild(item);
    });

    // Event listeners for palette items
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
   * Update Stats UI
   */
  function updateStatsUI() {
    if (!state.stats || !DOM.statsBadge) return;
    DOM.statsBadge.innerHTML = `
      <span>🎨 ${state.stats.colorsCount} Colors</span>
      <span>📐 ${state.stats.pathsCount} Paths</span>
      <span>⚡ ${state.stats.segmentsCount} Segments</span>
      <span>📏 ${state.stats.width} × ${state.stats.height} px</span>
    `;
  }

  /**
   * Setup Edit Controls (Sliders, Presets, Background)
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

    DOM.colorsCountSlider.addEventListener('input', (e) => {
      DOM.colorsCountVal.textContent = e.target.value;
      state.options.numberofcolors = parseInt(e.target.value, 10);
    });

    DOM.detailSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      // Map 1-5 to ltres & qtres
      const res = (6 - val) * 0.4;
      state.options.ltres = res;
      state.options.qtres = res;
    });

    DOM.smoothingSlider.addEventListener('input', (e) => {
      state.options.blurradius = parseInt(e.target.value, 10);
    });

    DOM.despeckleSlider.addEventListener('input', (e) => {
      state.options.pathomit = parseInt(e.target.value, 10);
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentPreset = btn.dataset.preset;
        const p = window.VectorEngine.Presets[state.currentPreset];
        if (p) {
          DOM.colorsCountSlider.value = p.numberofcolors;
          DOM.colorsCountVal.textContent = p.numberofcolors;
          state.options.numberofcolors = p.numberofcolors;
          state.options.ltres = p.ltres;
          state.options.qtres = p.qtres;
          state.options.pathomit = p.pathomit;
        }
      });
    });

    // Apply Changes button
    DOM.applyEditBtn.addEventListener('click', async () => {
      DOM.editDrawer.classList.remove('open');
      if (state.originalImage) {
        processImageSource(state.originalImage.src, state.fileName);
      }
    });
  }

  /**
   * Setup Modal Windows ("What's the difference?" and "REA Workbench")
   */
  function setupModals() {
    // "What's the difference?"
    DOM.diffModalTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      DOM.diffModal.classList.add('active');
    });

    DOM.diffModalClose.addEventListener('click', () => {
      DOM.diffModal.classList.remove('active');
    });

    // "REA Inspector Workbench"
    DOM.reaModalTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      updateRawCodePreview();
      DOM.reaModal.classList.add('active');
    });

    DOM.reaModalClose.addEventListener('click', () => {
      DOM.reaModal.classList.remove('active');
    });

    // Click outside to close modals
    [DOM.diffModal, DOM.reaModal].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Code format selector in REA workbench
    DOM.rawCodeTypeSelect.addEventListener('change', () => {
      updateRawCodePreview();
    });
  }

  function updateRawCodePreview() {
    if (!state.tracedata) {
      DOM.rawCodePreview.textContent = '// Please vectorize an image first to view reverse-engineered output';
      return;
    }

    const type = DOM.rawCodeTypeSelect.value;
    if (type === 'svg') {
      const svg = window.VectorExporters.generateSVG(state.tracedata, { mode: 'stroke_fill' });
      DOM.rawCodePreview.textContent = svg;
    } else if (type === 'eps') {
      const eps = window.VectorExporters.generateEPS(state.tracedata, { mode: 'stroke_fill' });
      DOM.rawCodePreview.textContent = eps;
    } else if (type === 'pdf') {
      const pdf = window.VectorExporters.generatePDF(state.tracedata, { mode: 'stroke_fill' });
      DOM.rawCodePreview.textContent = pdf.substring(0, 3000) + '\n\n... [Truncated for preview]';
    } else if (type === 'json') {
      DOM.rawCodePreview.textContent = JSON.stringify(
        {
          width: state.tracedata.width,
          height: state.tracedata.height,
          palette: state.tracedata.palette,
          layersCount: state.tracedata.layers.length,
          stats: state.stats
        },
        null,
        2
      );
    }
  }

  /**
   * Hero interactive split comparison slider
   */
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

  /**
   * Screen Navigation
   */
  function showScreen(screenName) {
    state.screen = screenName;
    DOM.heroSection.style.display = screenName === 'hero' ? 'block' : 'none';
    DOM.processingSection.style.display = screenName === 'processing' ? 'flex' : 'none';
    DOM.resultSection.style.display = screenName === 'result' ? 'block' : 'none';

    if (screenName === 'result') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Start the application when DOM is ready
  document.addEventListener('DOMContentLoaded', init);
})();
