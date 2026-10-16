# Vector Magic Web App (Reversed with REA)

A modern, full-featured raster-to-vector auto-tracing web application inspired by **Vector Magic** and built using reverse-engineered algorithms and architecture analyzed through **REA ("Reverse Engineer Anything" - `morluto/rea`)**.

Convert bitmap images (**JPG, PNG, GIF, BMP, WEBP**) into clean, mathematically precise vector graphics (**SVG, EPS, PDF**) with full color quantization, Bézier spline fitting, and dual export modes.

---

## 📸 Key Features

* **Dual Vector Modes** (matching Vector Magic):
  * **Fill only**: Closed paths with solid fills, tailored specifically for **vinyl cutting, laser cutting, engraving, CNC milling, and embroidery digitizing** where extra strokes would cause knife offset errors or double cuts.
  * **Stroke + Fill**: Seamless hairline matching strokes that eliminate the notorious sub-pixel anti-aliasing seams (white sliver artifacts) in web browsers, vector viewers, and print.
* **Multi-Format Vector Export**:
  * **SVG**: W3C compliant Scalable Vector Graphics with grouped color layers and metadata.
  * **EPS**: PostScript Level 3 Encapsulated PostScript with quadratic-to-cubic Bézier elevation (`curveto`) for Adobe Illustrator, CorelDRAW, and Inkscape.
  * **PDF**: Native vector PDF-1.4 file with vector graphics content streams (`q`, `rg`, `RG`, `m`, `l`, `c`, `h`, `f`, `Q`).
  * **High-Res PNG**: Supersampled 2x and 4x raster renders for high-DPI displays.
* **Interactive Canvas Viewer**:
  * **Deep Zoom**: Zoom from 20% to 2,500% with mouse wheel or zoom buttons to inspect infinite vector sharpness.
  * **Pan**: Click and drag to pan across the canvas at any zoom level.
  * **Interactive Split Comparison Slider**: Drag the vertical divider handle to compare the pixelated original bitmap with the smooth vector result in real time.
  * **View Modes**: Split Slider, Side-by-Side, Vector Only, Original Bitmap, and Wireframe/Path Outline view.
* **Live Segmentation & Palette Editor**:
  * Interactive color swatches showing RGB hex codes and layer indices.
  * Color picker to recolor any vector layer dynamically.
  * Visibility toggle (eye icon) to show/hide individual color layers.
  * Background removal toggle (transparent background).
  * Quality presets: **High**, **Medium**, **Low**, and **Logo**.
  * Fine-tuning sliders: Max Colors (2–32), Detail Level, Curve Smoothing, and Despeckle/Noise filter.
* **Instant Trial Samples**:
  * Pre-loaded samples including the **WhatsApp Confirmation Document** (reproducing the user's sample), the **Vector Magic Hurricane Mascot**, and the **Nexus Labs Geometric Emblem**.
  * Clipboard paste (`Ctrl + V`) support and drag-and-drop file upload.
* **🔬 REA Reverse-Engineering Workbench**:
  * Built-in REA inspector modal explaining the reverse-engineered pipeline and displaying raw SVG XML, PostScript EPS code, and PDF vector streams.

---

## 🔬 Reverse-Engineering Architecture (Powered by REA)

This application was engineered by dissecting Vector Magic's proprietary auto-tracing pipeline following the REA workflow:

```
[ Input Bitmap Image (JPG/PNG) ]
               │
               ▼
[ 1. Color Quantization & Palette Clustering ]
   • K-Means / Median Cut deterministic color clustering
   • Quantizes millions of 24-bit RGB values into 2 to 32 dominant colors
               │
               ▼
[ 2. Layer Separation & Marching Squares Edge Detection ]
   • Decomposes indexed pixels into binary layer matrices
   • Marching squares edge node extraction at half-pixel boundary centers
               │
               ▼
[ 3. Path Scanning & Directional Interpolation ]
   • Chains 8-direction edge nodes into continuous closed loops
   • Distinguishes outer contours and inner hole polygons
               │
               ▼
[ 4. Bézier Curve Fitting & Spline Optimization ]
   • Philip Schneider's recursive least-squares curve fitting algorithm
   • Douglas-Peucker point decimation for right-angle corner preservation
   • Fits quadratic and cubic Bézier splines within tolerance thresholds
               │
               ▼
┌──────────────────────────────┴──────────────────────────────┐
▼                                                             ▼
[ Mode A: Fill Only ]                         [ Mode B: Stroke + Fill ]
• Solid fills (`fill="#hex"`)                 • Matching perimeter hairline stroke
• Zero stroke width                           • Eliminates browser anti-aliasing gaps
• Ideal for cutters & plotters                • Ideal for screens & graphic design
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │
                                      ▼
           [ Multi-Format Output: SVG • EPS Level 3 • Vector PDF ]
```

---

## 🚀 Quick Start

### 1. Start the Server

```bash
npm start
```

Or run directly with Node:
```bash
node server.js
```

### 2. Open in Your Browser

Navigate to:
```
http://localhost:3000
```

---

## 📁 Project Structure

```
project 1/
├── server.js              # Express server with static asset hosting and vector API
├── package.json           # Dependencies and scripts
├── public/
│   ├── index.html         # Main Vector Magic UI matching the official design
│   ├── css/
│   │   └── styles.css     # Dark navy/gold theme and responsive layout
│   ├── js/
│   │   ├── app.js         # Main UI controller, zoom/pan, split slider, state
│   │   ├── tracer.js      # Vectorization engine, color quantization, presets
│   │   ├── exporters.js   # SVG, EPS Level 3, and Vector PDF generators
│   │   └── samples.js     # Programmatic sample generators (WhatsApp, Mascot, Logo)
│   └── vendor/
│       ├── imagetracer.js # Tracing engine
│       └── jspdf.umd.min.js # PDF generation library
└── rea-repo/              # Cloned morluto/rea repository
```

---

## 📄 License

MIT License. Created with inspiration from Vector Magic and powered by REA reverse-engineering methodology.
