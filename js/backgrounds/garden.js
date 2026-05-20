'use strict';

import { CW, CH } from '../constants.js';

export function draw(ctx, ts, theme) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(1, '#B0E0D0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH * 0.5);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 3; i++) {
    const cx = ((ts * 0.01 + i * 160) % (CW + 100)) - 50;
    const cy = 40 + i * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy - 8, 20, 0, Math.PI * 2);
    ctx.arc(cx + 35, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass
  const grass = ctx.createLinearGradient(0, CH * 0.45, 0, CH);
  grass.addColorStop(0, '#5B8C3E');
  grass.addColorStop(1, '#3D6B2E');
  ctx.fillStyle = grass;
  ctx.fillRect(0, CH * 0.45, CW, CH * 0.55);

  // Flowers
  const colors = ['#FF6B8A', '#FFD700', '#FF8C42', '#E066FF'];
  for (let i = 0; i < 8; i++) {
    const fx = 20 + i * 55 + Math.sin(ts * 0.002 + i) * 5;
    const fy = CH * 0.48 + Math.sin(i * 2.1) * 15;
    ctx.fillStyle = colors[i % colors.length];
    for (let p = 0; p < 5; p++) {
      const pa = (Math.PI * 2 * p) / 5;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(pa) * 5, fy + Math.sin(pa) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vignette
  const vig = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.25, CW / 2, CH / 2, CW * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);
}
