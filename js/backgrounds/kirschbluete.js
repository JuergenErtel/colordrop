'use strict';

import { CW, CH } from '../constants.js';

// ══════════════════════════════════════════════════════════════════════════
//  KIRSCHBLÜTE — Japanese Spring (Cherry Blossom) seasonal scene
// ══════════════════════════════════════════════════════════════════════════

export function draw(ctx, ts, theme) {
  // Sky gradient (dawn pink → peach → cream)
  const sky = ctx.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0,   '#FFD6E0');
  sky.addColorStop(0.5, '#FFE8D4');
  sky.addColorStop(1,   '#FFF0E8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH);

  // Distant pagoda silhouette (two-tier)
  ctx.fillStyle = 'rgba(140,90,110,0.55)';
  const pagX = CW * 0.78, pagY = CH * 0.55;
  ctx.fillRect(pagX, pagY, CW * 0.04, CH * 0.2);
  ctx.beginPath();
  ctx.moveTo(pagX - 15, pagY);
  ctx.lineTo(pagX + 28, pagY);
  ctx.lineTo(pagX + 40, pagY - 12);
  ctx.lineTo(pagX - 25, pagY - 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pagX - 10, pagY - 25);
  ctx.lineTo(pagX + 22, pagY - 25);
  ctx.lineTo(pagX + 30, pagY - 38);
  ctx.lineTo(pagX - 18, pagY - 38);
  ctx.closePath();
  ctx.fill();

  // Cherry tree trunk + branches
  ctx.fillStyle = '#5A3A30';
  const trunkX = CW * 0.15;
  ctx.fillRect(trunkX, CH * 0.55, 14, CH * 0.35);
  ctx.strokeStyle = '#5A3A30';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(trunkX + 7, CH * 0.58);
  ctx.quadraticCurveTo(trunkX + 40, CH * 0.48, trunkX + 80, CH * 0.50);
  ctx.moveTo(trunkX + 7, CH * 0.62);
  ctx.quadraticCurveTo(trunkX - 20, CH * 0.52, trunkX - 40, CH * 0.50);
  ctx.stroke();

  // Blossom canopy — overlapping pink radial gradients
  const canopy = [
    [trunkX + 40, CH * 0.48, 90],
    [trunkX + 80, CH * 0.50, 70],
    [trunkX -  5, CH * 0.46, 80],
    [trunkX - 40, CH * 0.50, 65],
    [trunkX + 20, CH * 0.38, 95],
  ];
  canopy.forEach(([cx, cy, r]) => {
    const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
    g.addColorStop(0,   '#FFFFFF');
    g.addColorStop(0.5, '#FFD6E0');
    g.addColorStop(1,   '#FFB7C5');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ground gradient
  const ground = ctx.createLinearGradient(0, CH * 0.88, 0, CH);
  ground.addColorStop(0, 'rgba(140,90,110,0)');
  ground.addColorStop(1, 'rgba(120,70,90,0.3)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, CH * 0.88, CW, CH * 0.12);

  // Falling petals (18 drifting sakura particles)
  drawSakuraPetalShower(ctx, ts);

  // Light vignette for depth
  const vig = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.3, CW / 2, CH / 2, CW * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(60,30,50,0.2)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);
}

function drawSakuraPetalShower(ctx, ts) {
  const count = 18;
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = ((seed + ts * 0.02 * (0.5 + (i % 3) * 0.2)) % (CW + 40)) - 20;
    const y = ((seed * 0.7 + ts * 0.04 * (0.8 + (i % 5) * 0.1)) % (CH + 40)) - 20;
    const rot = (ts * 0.002 + seed) % (Math.PI * 2);
    drawSakuraPetal(ctx, x, y, 4 + (i % 3), rot);
  }
}

function drawSakuraPetal(ctx, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,183,197,0.82)';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.ellipse(Math.cos(a) * size * 0.4, Math.sin(a) * size * 0.4, size * 0.3, size * 0.5, a, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}
