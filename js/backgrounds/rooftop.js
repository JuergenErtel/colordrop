'use strict';

import { CW, CH } from '../constants.js';

export function draw(ctx, ts, theme) {
  // Sunset sky
  const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  sky.addColorStop(0, '#1a1a3e');
  sky.addColorStop(0.4, '#4a2c6a');
  sky.addColorStop(0.7, '#c05050');
  sky.addColorStop(1, '#e8a040');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH * 0.5);

  // Stars
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const sx = (i * 37 + 13) % CW;
    const sy = (i * 23 + 7) % (CH * 0.3);
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(ts * 0.001 + i * 1.7));
    ctx.globalAlpha = twinkle * 0.4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // City silhouette
  ctx.fillStyle = '#1a1a2e';
  const buildings = [[0,0.38,40],[45,0.32,35],[85,0.42,30],[120,0.35,45],[170,0.28,35],[210,0.40,40],[255,0.33,30],[290,0.45,35],[330,0.30,40],[375,0.38,45]];
  for (const [bx, hFrac, bw] of buildings) {
    ctx.fillRect(bx, CH * 0.5 - CH * hFrac, bw, CH * hFrac);
  }

  // Rooftop floor
  const floor = ctx.createLinearGradient(0, CH * 0.5, 0, CH);
  floor.addColorStop(0, '#4a4040');
  floor.addColorStop(1, '#2a2020');
  ctx.fillStyle = floor;
  ctx.fillRect(0, CH * 0.5, CW, CH * 0.5);

  // String lights
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CH * 0.48);
  for (let lx = 0; lx <= CW; lx += 5) {
    ctx.lineTo(lx, CH * 0.48 + Math.sin(lx * 0.03) * 8);
  }
  ctx.stroke();
  for (let lx = 20; lx < CW; lx += 40) {
    const ly = CH * 0.48 + Math.sin(lx * 0.03) * 8;
    const glow = 0.5 + 0.3 * Math.sin(ts * 0.003 + lx * 0.1);
    ctx.fillStyle = `rgba(255, 220, 100, ${glow})`;
    ctx.beginPath();
    ctx.arc(lx, ly + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vignette
  const vig = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.25, CW / 2, CH / 2, CW * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);
}
