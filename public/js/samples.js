/**
 * FreeVector AI Pro - Original Sample Generator Suite
 * 100% Copyright-Free, High-Fidelity Test Graphics
 */

(function (window) {
  'use strict';

  const SampleGenerator = {
    /**
     * 1. Apex Falcon Esports Mascot Emblem
     */
    createFalconMascot() {
      const canvas = document.createElement('canvas');
      canvas.width = 460;
      canvas.height = 380;
      const ctx = canvas.getContext('2d');

      // Dark studio backdrop
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 460, 380);

      ctx.save();
      ctx.translate(230, 180);

      // Outer Shield / Crest
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, -140);
      ctx.lineTo(130, -70);
      ctx.lineTo(105, 70);
      ctx.lineTo(0, 140);
      ctx.lineTo(-105, 70);
      ctx.lineTo(-130, -70);
      ctx.closePath();
      ctx.fill();

      // Deep Navy Core
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, -125);
      ctx.lineTo(115, -60);
      ctx.lineTo(92, 60);
      ctx.lineTo(0, 125);
      ctx.lineTo(-92, 60);
      ctx.lineTo(-115, -60);
      ctx.closePath();
      ctx.fill();

      // Falcon Beak & Head Feathers
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(60, -20);
      ctx.lineTo(80, 20);
      ctx.lineTo(30, 15);
      ctx.lineTo(0, 50);
      ctx.lineTo(-30, 15);
      ctx.lineTo(-80, 20);
      ctx.lineTo(-60, -20);
      ctx.closePath();
      ctx.fill();

      // Sharp Amber Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(40, 20);
      ctx.lineTo(0, 75);
      ctx.lineTo(-40, 20);
      ctx.closePath();
      ctx.fill();

      // Beak Split Line
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(25, 25);
      ctx.lineTo(0, 60);
      ctx.closePath();
      ctx.fill();

      // Glowing Cyan Falcon Eyes
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(-45, -30);
      ctx.lineTo(-20, -25);
      ctx.lineTo(-35, -15);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(45, -30);
      ctx.lineTo(20, -25);
      ctx.lineTo(35, -15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Brand Typography
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('APEX FALCON', 230, 345);

      ctx.fillStyle = '#06b6d4';
      ctx.font = '700 11px sans-serif';
      ctx.letterSpacing = '5px';
      ctx.fillText('ESPORTS CREST', 230, 365);

      return canvas.toDataURL('image/png');
    },

    /**
     * 2. CyberCore Quantum Processor Logo
     */
    createCyberCoreLogo() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      // Crisp White Canvas for clean logo testing
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);

      ctx.save();
      ctx.translate(200, 180);

      // Outer Isometric Cube / Hexagon
      const hexPoints = (r) => {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 6;
          pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
        }
        return pts;
      };

      const pts = hexPoints(95);

      // Top Face - Electric Violet
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.closePath();
      ctx.fill();

      // Right Face - Deep Indigo
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.lineTo(pts[3].x, pts[3].y);
      ctx.lineTo(pts[4].x, pts[4].y);
      ctx.closePath();
      ctx.fill();

      // Left Face - Bright Cyber Cyan
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(pts[4].x, pts[4].y);
      ctx.lineTo(pts[5].x, pts[5].y);
      ctx.lineTo(pts[0].x, pts[0].y);
      ctx.closePath();
      ctx.fill();

      // Inner Core Node Circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Typography
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '1px';
      ctx.fillText('CYBERCORE', 200, 325);

      ctx.fillStyle = '#64748b';
      ctx.font = '700 11px sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('QUANTUM HARDWARE', 200, 348);

      return canvas.toDataURL('image/png');
    },

    /**
     * 3. Laser-Cut CNC Filigree Mandala (Sign & Cutting Demo)
     */
    createLaserCutMandala() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);

      ctx.save();
      ctx.translate(200, 200);

      ctx.fillStyle = '#0f172a';

      // Concentric rings with decorative petals for laser cutting
      ctx.beginPath();
      ctx.arc(0, 0, 140, 0, Math.PI * 2);
      ctx.arc(0, 0, 128, 0, Math.PI * 2, true);
      ctx.fill();

      // 8 Radial Petals
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.bezierCurveTo(40, -60, 40, -100, 0, -120);
        ctx.bezierCurveTo(-40, -100, -40, -60, 0, -30);
        ctx.fill();

        // Cutout hole inside petal
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -75, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Center Rosette
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      return canvas.toDataURL('image/png');
    },

    /**
     * 4. Executive Signature & Invoice Document
     */
    createDocumentSample() {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      // Paper ivory background
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, 380, 480);

      // Subtle invoice header
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('VERIFIED CONTRACT', 30, 45);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('REFERENCE: #AGY-8849-2026', 30, 65);
      ctx.fillText('DATE: OCTOBER 16, 2026', 30, 80);

      // Horizontal separator line
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 95);
      ctx.lineTo(350, 95);
      ctx.stroke();

      // Document Body Text
      ctx.fillStyle = '#334155';
      ctx.font = '12px sans-serif';
      ctx.fillText('This document certifies the vector conversion rights', 30, 125);
      ctx.fillText('and commercial enterprise licensing agreement.', 30, 145);
      ctx.fillText('All vector paths, mathematical Bézier splines,', 30, 165);
      ctx.fillText('and CAD exports are cleared for production use.', 30, 185);

      // Total fee badge
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(30, 220, 320, 50);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('MONTHLY ENTERPRISE SUBSCRIPTION', 45, 245);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('$99.00 / MONTH', 45, 263);

      // Signature section
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('AUTHORIZED SIGNATURE:', 30, 335);

      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(30, 420);
      ctx.lineTo(260, 420);
      ctx.stroke();

      // Realistic Handwritten Signature curve
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(40, 395);
      ctx.bezierCurveTo(70, 340, 90, 410, 110, 370);
      ctx.bezierCurveTo(130, 330, 140, 430, 160, 385);
      ctx.bezierCurveTo(180, 350, 195, 415, 220, 390);
      ctx.bezierCurveTo(240, 370, 250, 385, 275, 360);
      ctx.stroke();

      // Stamp Seal
      ctx.save();
      ctx.translate(300, 380);
      ctx.rotate(-0.15);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FREEVECTOR', 0, -8);
      ctx.fillText('APPROVED', 0, 6);
      ctx.fillText('★ 2026 ★', 0, 18);
      ctx.restore();

      return canvas.toDataURL('image/png');
    }
  };

  window.SampleGenerator = SampleGenerator;
})(window);
