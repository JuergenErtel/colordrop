'use strict';

import { CW, CH } from '../constants.js';

export function draw(ctx, ts, theme) {
  // Warm wall
  const wall = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  wall.addColorStop(0, '#4a3525');
  wall.addColorStop(1, '#6a4a35');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, CW, CH * 0.5);

  // Window
  ctx.fillStyle = '#8ab4d8';
  ctx.fillRect(CW * 0.6, CH * 0.05, CW * 0.3, CH * 0.25);
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = 4;
  ctx.strokeRect(CW * 0.6, CH * 0.05, CW * 0.3, CH * 0.25);
  ctx.beginPath();
  ctx.moveTo(CW * 0.75, CH * 0.05);
  ctx.lineTo(CW * 0.75, CH * 0.30);
  ctx.moveTo(CW * 0.6, CH * 0.175);
  ctx.lineTo(CW * 0.9, CH * 0.175);
  ctx.stroke();

  // Snow on windowsill
  ctx.fillStyle = '#e8e8f0';
  ctx.beginPath();
  ctx.ellipse(CW * 0.75, CH * 0.30, CW * 0.17, 8, 0, 0, Math.PI);
  ctx.fill();

  // Snowflakes outside window
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 8; i++) {
    const sx = CW * 0.6 + ((ts * 0.02 + i * 17) % (CW * 0.3));
    const sy = CH * 0.05 + ((ts * 0.015 + i * 23) % (CH * 0.25));
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wood floor
  const floor = ctx.createLinearGradient(0, CH * 0.45, 0, CH);
  floor.addColorStop(0, '#5a3a22');
  floor.addColorStop(1, '#3a2515');
  ctx.fillStyle = floor;
  ctx.fillRect(0, CH * 0.45, CW, CH * 0.55);

  // Warm glow
  ctx.save();
  const glow = ctx.createRadialGradient(30, CH * 0.4, 0, 30, CH * 0.4, 200);
  glow.addColorStop(0, 'rgba(255, 140, 40, 0.15)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Vignette
  const vig = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.25, CW / 2, CH / 2, CW * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);
}
