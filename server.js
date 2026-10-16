/**
 * Free Vector Image - Production Server
 * High-performance server hosting the AI image-to-vector studio and API
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

// Serve static frontend assets (includes robots.txt and sitemap.xml for SEO)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Health check & status
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'Free Vector Image',
    version: '3.0.0',
    seo: {
      sitemap: '/sitemap.xml',
      robots: '/robots.txt'
    },
    features: ['Ultra-Smooth Vector', 'Gap-Free Seams', 'Checkerboard Removal', 'SVG', 'EPS', 'DXF', 'PDF']
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
      numberofcolors: 32,
      colorsampling: 2,
      colorquantcycles: 5,
      ltres: 0.05,
      qtres: 0.12,
      pathomit: 3,
      blurradius: 2,
      blurdelta: 25,
      linefilter: true,
      roundcoords: 3,
      viewbox: true
    };

    const clamped = new Uint8ClampedArray(imageData.data);
    const imgDataObj = {
      width: imageData.width,
      height: imageData.height,
      data: clamped
    };

    const tracedata = ImageTracer.imagedataToTracedata(imgDataObj, opts);
    res.json({ success: true, tracedata });
  } catch (err) {
    console.error('Vectorization API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✨ Free Vector Image Studio is LIVE!`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`🌐 SEO Enabled: /sitemap.xml & /robots.txt`);
  console.log(`💎 100x Quality Engine: Gap-Free Seams & Checkerboard Cleaner`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
