/**
 * Free Vector Image - Instant Sample Generator Suite
 * Includes landscape waterfall and clean bird samples to benchmark 100x quality
 */

(function (window) {
  'use strict';

  const SampleGenerator = {
    /**
     * 1. Landscape Waterfall Sample (Tests multi-layer color blending & gap-free seams)
     */
    createWaterfallSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 460;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
      skyGrad.addColorStop(0, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 460, 360);

      // Clouds
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(230, 60, 40, 0, Math.PI * 2);
      ctx.arc(200, 70, 30, 0, Math.PI * 2);
      ctx.arc(260, 70, 35, 0, Math.PI * 2);
      ctx.fill();

      // Distant Canyon Cliffs (Dark Slate Blue)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(100, 160);
      ctx.lineTo(130, 50);
      ctx.lineTo(180, 80);
      ctx.lineTo(210, 160);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(250, 160);
      ctx.lineTo(280, 70);
      ctx.lineTo(340, 50);
      ctx.lineTo(370, 160);
      ctx.closePath();
      ctx.fill();

      // Waterfall Stream (Cyan / White)
      const waterGrad = ctx.createLinearGradient(200, 80, 260, 240);
      waterGrad.addColorStop(0, '#ffffff');
      waterGrad.addColorStop(0.5, '#7dd3fc');
      waterGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(215, 90, 30, 140);

      // Midground Green Mountains
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, 220);
      ctx.lineTo(80, 70);
      ctx.lineTo(180, 130);
      ctx.lineTo(215, 230);
      ctx.lineTo(0, 230);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.moveTo(245, 230);
      ctx.lineTo(290, 120);
      ctx.lineTo(380, 60);
      ctx.lineTo(460, 190);
      ctx.lineTo(460, 230);
      ctx.closePath();
      ctx.fill();

      // Foreground Canyon Rocks (Warm Amber / Brown)
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(90, 280, 85, 45, -0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(370, 280, 80, 45, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // River Water Basin (Deep Teal / Blue)
      const poolGrad = ctx.createLinearGradient(0, 220, 0, 360);
      poolGrad.addColorStop(0, '#0284c7');
      poolGrad.addColorStop(1, '#0e7490');
      ctx.fillStyle = poolGrad;
      ctx.fillRect(0, 220, 460, 140);

      // Foreground Foliage / Leaves (Dark Navy Silhouette)
      ctx.fillStyle = '#0f172a';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(30 + i * 8, 300 + i * 5, 25, 7, -0.6 + i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      return canvas.toDataURL('image/png');
    },

    /**
     * 2. Songbird Sample with Checkerboard Background (Tests smart checkerboard cleanup!)
     */
    createBirdSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');

      // Draw fake grey/white checkerboard pattern typical of fake PNGs from Google
      const tileSize = 16;
      for (let y = 0; y < 340; y += tileSize) {
        for (let x = 0; x < 380; x += tileSize) {
          const isWhite = ((x / tileSize) + (y / tileSize)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#e2e8f0';
          ctx.fillRect(x, y, tileSize, tileSize);
        }
      }

      // Draw Clean Bird Subject
      ctx.save();
      ctx.translate(160, 150);

      // Bird Body & Wing (Charcoal Black)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-50, -30);
      ctx.bezierCurveTo(-20, -60, 30, -50, 70, -10);
      ctx.bezierCurveTo(120, 30, 160, 75, 170, 85);
      ctx.bezierCurveTo(140, 80, 90, 40, 40, 25);
      ctx.bezierCurveTo(0, 35, -30, 25, -60, -5);
      ctx.closePath();
      ctx.fill();

      // Red Breast / Robin Chest (Crimson Red)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-55, -20);
      ctx.bezierCurveTo(-35, -15, -20, 0, -25, 20);
      ctx.bezierCurveTo(-30, 35, -50, 40, -65, 30);
      ctx.bezierCurveTo(-80, 10, -75, -10, -55, -20);
      ctx.closePath();
      ctx.fill();

      // Sharp Beak (Dark Slate)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-60, -32);
      ctx.lineTo(-85, -28);
      ctx.lineTo(-62, -22);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-45, -32, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-45, -32, 2, 0, Math.PI * 2);
      ctx.fill();

      // Legs / Claws
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, 30);
      ctx.lineTo(-15, 65);
      ctx.lineTo(-30, 72);
      ctx.moveTo(10, 25);
      ctx.lineTo(8, 62);
      ctx.lineTo(-8, 70);
      ctx.stroke();

      ctx.restore();

      return canvas.toDataURL('image/png');
    },

    /**
     * 3. Geometric Tech Logo
     */
    createLogoSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 380, 340);

      ctx.save();
      ctx.translate(190, 155);

      const hex = (r) => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 6;
          pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
        }
        return pts;
      };

      const pts = hex(80);

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.lineTo(pts[3].x, pts[3].y);
      ctx.lineTo(pts[4].x, pts[4].y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pts[4].x, pts[4].y);
      ctx.lineTo(pts[5].x, pts[5].y);
      ctx.lineTo(pts[0].x, pts[0].y);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText('CYBERCORE', 190, 285);

      return canvas.toDataURL('image/png');
    },

    /**
     * 4. CNC Laser Cut Mandala
     */
    createMandalaSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 380, 340);

      ctx.save();
      ctx.translate(190, 170);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 120, 0, Math.PI * 2);
      ctx.arc(0, 0, 110, 0, Math.PI * 2, true);
      ctx.fill();

      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.bezierCurveTo(35, -50, 35, -90, 0, -105);
        ctx.bezierCurveTo(-35, -90, -35, -50, 0, -25);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -65, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      return canvas.toDataURL('image/png');
    },

    /**
     * 5. Vector MAX Ultra-Detail Rainbow Owl Sample
     */
    createOwlSample() {
      return 'assets/samples/owl_max_sample.png';
    }
  };

  window.SampleGenerator = SampleGenerator;
})(window);
