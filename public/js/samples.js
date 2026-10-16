/**
 * Built-in Sample Image Generator for Vector Magic Web App
 * Creates realistic artwork, logos, icons, and document screenshots
 */

(function (window) {
  'use strict';

  const SampleGenerator = {
    /**
     * Sample 1: WhatsApp Message Screenshot (matches user's screenshot)
     */
    createWhatsAppSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // WhatsApp Chat Background
      ctx.fillStyle = '#efeae2';
      ctx.fillRect(0, 0, 360, 480);

      // Chat header
      ctx.fillStyle = '#075e54';
      ctx.fillRect(0, 0, 360, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.fillText('Delta Health Care', 60, 33);
      ctx.font = '11px sans-serif';
      ctx.fillText('online', 60, 47);

      // Contact Avatar
      ctx.beginPath();
      ctx.arc(32, 28, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#128c7e';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('D', 26, 34);

      // Incoming Chat Bubble 1
      ctx.fillStyle = '#ffffff';
      this.drawRoundedRect(ctx, 16, 75, 270, 155, 8);
      ctx.fill();

      // Avatar circle inside bubble
      ctx.beginPath();
      ctx.arc(38, 98, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#e57373';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('D', 34, 102);

      ctx.fillStyle = '#333333';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Delta', 60, 102);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#222222';
      ctx.fillText('Appointment with', 30, 126);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Prof. Dr. Nadira', 30, 142);
      ctx.font = '12px sans-serif';
      ctx.fillText('Sultana on 2026-10-17', 30, 158);
      ctx.fillText('(04:00 PM) is confirmed.', 30, 174);
      ctx.fillStyle = '#00796b';
      ctx.fillText('Serial: #89. Fee: 800 BDT.', 30, 192);

      // Incoming Chat Bubble 2
      ctx.fillStyle = '#ffffff';
      this.drawRoundedRect(ctx, 16, 245, 270, 160, 8);
      ctx.fill();

      ctx.fillStyle = '#222222';
      ctx.font = '12px sans-serif';
      ctx.fillText('Dear client, your', 30, 275);
      ctx.fillText('appointment with', 30, 292);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Prof. Dr. Nadira Sultana', 30, 310);
      ctx.font = '12px sans-serif';
      ctx.fillText('on 2026-10-17 is confirmed.', 30, 328);
      ctx.fillStyle = '#00796b';
      ctx.fillText('Serial: #90. Fee: 800 BDT.', 30, 348);
      ctx.fillStyle = '#666666';
      ctx.fillText('Thank you for choosing us!', 30, 370);

      return canvas.toDataURL('image/png');
    },

    /**
     * Sample 2: Vector Magic Hurricane / Mascot Logo
     */
    createMascotSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      // Light background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 300);

      // Shield background
      ctx.save();
      ctx.translate(200, 140);

      // Gold shield
      ctx.fillStyle = '#eab819';
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(85, -60);
      ctx.lineTo(75, 40);
      ctx.quadraticCurveTo(0, 110, 0, 110);
      ctx.quadraticCurveTo(0, 110, -75, 40);
      ctx.lineTo(-85, -60);
      ctx.closePath();
      ctx.fill();

      // Deep Navy inner shield
      ctx.fillStyle = '#0f2744';
      ctx.beginPath();
      ctx.moveTo(0, -80);
      ctx.lineTo(75, -52);
      ctx.lineTo(65, 34);
      ctx.quadraticCurveTo(0, 96, 0, 96);
      ctx.quadraticCurveTo(0, 96, -65, 34);
      ctx.lineTo(-75, -52);
      ctx.closePath();
      ctx.fill();

      // Dynamic swirl hurricane wings
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -5, 36, 0, Math.PI * 2);
      ctx.fill();

      // Crimson star
      ctx.fillStyle = '#e63946';
      this.drawStar(ctx, 0, -5, 5, 26, 12);
      ctx.fill();

      // Core eye
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, -5, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Typography banner
      ctx.fillStyle = '#0f2744';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.fillText('VECTOR MAGIC', 200, 265);

      ctx.fillStyle = '#e63946';
      ctx.font = 'bold 12px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('PRO AUTO TRACER', 200, 283);

      return canvas.toDataURL('image/png');
    },

    /**
     * Sample 3: Tech Geometric Emblem
     */
    createLogoSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 360, 360);

      // Geometric Hexagon with inner diamond
      ctx.save();
      ctx.translate(180, 160);

      // Cyan Hexagon
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = 90 * Math.cos(angle);
        const y = 90 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Dark Blue Polygon slice
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(90 * Math.cos(0), 90 * Math.sin(0));
      ctx.lineTo(90 * Math.cos(Math.PI / 3), 90 * Math.sin(Math.PI / 3));
      ctx.lineTo(90 * Math.cos((2 * Math.PI) / 3), 90 * Math.sin((2 * Math.PI) / 3));
      ctx.closePath();
      ctx.fill();

      // Golden center diamond
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(45, 0);
      ctx.lineTo(0, 45);
      ctx.lineTo(-45, 0);
      ctx.closePath();
      ctx.fill();

      // White inner ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEXUS LABS', 180, 295);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('PRECISION VECTOR ENGINE', 180, 315);

      return canvas.toDataURL('image/png');
    },

    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    },

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    }
  };

  window.SampleGenerator = SampleGenerator;
})(window);
