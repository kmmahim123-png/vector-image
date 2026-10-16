/**
 * Vector Magic Web App Server
 * Express Server providing static assets and vectorization API endpoints
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ImageTracer = require('imagetracerjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Health check & status
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'Vector Magic Web App',
    engine: 'ImageTracer + REA Reverse Engineering Bridge',
    version: '1.0.0'
  });
});

/**
 * Server-side vectorization API endpoint
 */
app.post('/api/vectorize', (req, res) => {
  try {
    const { imageData, options } = req.body;
    if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
      return res.status(400).json({ error: 'Invalid image data supplied' });
    }

    const opts = options || {
      numberofcolors: 16,
      colorsampling: 2,
      colorquantcycles: 3,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      roundcoords: 2,
      viewbox: true
    };

    // Convert array back to Uint8ClampedArray
    const clamped = new Uint8ClampedArray(imageData.data);
    const imgDataObj = {
      width: imageData.width,
      height: imageData.height,
      data: clamped
    };

    const tracedata = ImageTracer.imagedataToTracedata(imgDataObj, opts);
    res.json({ success: true, tracedata });
  } catch (err) {
    console.error('Server vectorization error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✨ Vector Magic Web App is LIVE!`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`🔬 REA Reverse-Engineering Workbench integrated.`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
