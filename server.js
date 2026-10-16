/**
 * Free Vector Image - Enterprise Production Server
 * Powered by native Rust VTracer Engine + OpenCV Bilateral Denoising + K-Means Color Clustering
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Serve static assets (includes robots.txt and sitemap.xml)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Health check & status
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'Free Vector Image Pro',
    version: '5.0.0-enterprise-ai',
    engine: 'VisionCortex VTracer Rust Core + OpenCV Bilateral AI Filtering + K-Means Palette Snapping',
    seo: {
      sitemap: '/sitemap.xml',
      robots: '/robots.txt'
    },
    features: [
      'Native Rust VTracer Spline Engine',
      'Lanczos AI Super-Resolution (Anti-Pixelation)',
      'Bilateral Edge-Preserving Denoising',
      'Interactive Color Palette Manager',
      'Instant One-Click Background Transparency',
      'Screen Print Separation Films (ZIP + Crosshair Targets)',
      'Laser & Vinyl Cutter Die-Cut Toolpath (DXF + SVG)',
      'AutoCAD DXF R12',
      'PostScript Level 3 EPS',
      'Vector PDF-1.4'
    ]
  });
});

/**
 * High-Precision Vectorization API Endpoint
 */
app.post('/api/vectorize', async (req, res) => {
  try {
    const { imageBase64, options } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data supplied' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inputPath = path.join(tempDir, `in_${fileId}.png`);
    const outputPath = path.join(tempDir, `out_${fileId}.svg`);
    const optsPath = path.join(tempDir, `opts_${fileId}.json`);

    fs.writeFileSync(inputPath, buffer);

    const tracingOpts = {
      preset: (options && (options.preset || options.presetKey)) || 'auto',
      colors_limit: (options && options.colors_limit !== undefined) ? parseInt(options.colors_limit, 10) : 0,
      denoise_level: (options && options.denoise_level) || 'low',
      super_sampling: (options && options.super_sampling) || 2,
      clean_checkerboard: options ? options.clean_checkerboard !== false : true,
      transparent_bg: options ? options.transparent_bg === true : false,
      filter_speckle: (options && options.filter_speckle !== undefined) ? options.filter_speckle : 16,
      corner_threshold: (options && options.corner_threshold !== undefined) ? options.corner_threshold : 80,
      length_threshold: (options && options.length_threshold !== undefined) ? options.length_threshold : 8.5,
      splice_threshold: (options && options.splice_threshold !== undefined) ? options.splice_threshold : 58,
      max_iterations: (options && options.max_iterations !== undefined) ? options.max_iterations : 35,
      color_precision: (options && options.color_precision !== undefined) ? options.color_precision : 6,
      layer_difference: (options && options.layer_difference !== undefined) ? options.layer_difference : 30,
      recolor_map: (options && options.recolor_map) || {},
      ...options
    };

    fs.writeFileSync(optsPath, JSON.stringify(tracingOpts));

    // Execute pro AI vectorization engine
    execFile('python', ['engine_pro.py', inputPath, outputPath, optsPath], (err, stdout, stderr) => {
      // Clean up input files
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(optsPath)) fs.unlinkSync(optsPath);
      } catch (e) {}

      if (err) {
        console.error('Engine error:', err, stderr);
        return res.status(500).json({ error: 'Vectorization failed: ' + err.message });
      }

      try {
        let stats = {};
        if (stdout && stdout.trim()) {
          try {
            stats = JSON.parse(stdout.trim());
          } catch (e) {
            console.error('Could not parse python json:', stdout);
          }
        }

        const svgContent = fs.readFileSync(outputPath, 'utf8');
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        res.json({
          success: true,
          svg: svgContent,
          stats: {
            width: stats.width || 400,
            height: stats.height || 400,
            pathsCount: stats.pathsCount || svgContent.split('<path').length - 1,
            colorsCount: stats.colorsCount || (stats.palette ? stats.palette.length : 16),
            svgSizeKb: stats.svgSizeKb || Math.round(svgContent.length / 1024),
            engine: 'Enterprise AI Spline Engine'
          },
          palette: stats.palette || []
        });
      } catch (readErr) {
        console.error('Error reading vector output:', readErr);
        res.status(500).json({ error: 'Failed to read vector output' });
      }
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Screen Print Separations ZIP Generator Endpoint
 */
app.post('/api/screen-print-zip', async (req, res) => {
  try {
    const { svg, width = 800, height = 800 } = req.body;
    if (!svg) {
      return res.status(400).json({ error: 'No SVG supplied' });
    }

    const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempSvgPath = path.join(tempDir, `sep_in_${fileId}.svg`);
    const tempZipPath = path.join(tempDir, `separations_${fileId}.zip`);

    fs.writeFileSync(tempSvgPath, svg);

    execFile('python', ['zip_separations.py', tempSvgPath, tempZipPath, String(width), String(height)], (err, stdout, stderr) => {
      try {
        if (fs.existsSync(tempSvgPath)) fs.unlinkSync(tempSvgPath);
      } catch (e) {}

      if (err) {
        console.error('ZIP generation error:', err, stderr);
        return res.status(500).json({ error: 'ZIP generation failed: ' + err.message });
      }

      res.download(tempZipPath, 'Screen_Print_Separation_Films.zip', (downloadErr) => {
        try {
          if (fs.existsSync(tempZipPath)) fs.unlinkSync(tempZipPath);
        } catch (e) {}
      });
    });
  } catch (err) {
    console.error('ZIP server error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Laser & Vinyl Cut Contour Generator Endpoint
 */
app.post('/api/cut-contour', async (req, res) => {
  try {
    const { imageBase64, offset = 6 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data supplied' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const inputPath = path.join(tempDir, `cut_in_${fileId}.png`);
    const outputPath = path.join(tempDir, `cut_out_${fileId}.svg`);

    fs.writeFileSync(inputPath, buffer);

    execFile('python', ['cut_generator.py', inputPath, outputPath, String(offset)], (err, stdout, stderr) => {
      try {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      } catch (e) {}

      if (err) {
        console.error('Cut contour error:', err, stderr);
        return res.status(500).json({ error: 'Cut contour failed: ' + err.message });
      }

      try {
        const cutSvg = fs.readFileSync(outputPath, 'utf8');
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        res.json({ success: true, svg: cutSvg });
      } catch (e) {
        res.status(500).json({ error: 'Failed to read cut SVG' });
      }
    });
  } catch (err) {
    console.error('Cut contour server error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ Free Vector Image Pro Studio is LIVE on port ${PORT}`);
  console.log(`🚀 Workspace URL: http://localhost:${PORT}`);
  console.log(`💎 Enterprise AI: OpenCV Bilateral + K-Means + VTracer`);
  console.log(`🖨️ Production Ready: Screen Print ZIP & Laser Cut Contours`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
