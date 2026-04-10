'use strict';

import { lerpHSL } from './background.js';

// ── Theme tint helper ───────────────────────────────────────────────────
// Blends a base hue toward the scene theme by `amount` (0-1)
function tint(baseH, baseS, baseB, themeH, themeS, themeB, amount) {
  return lerpHSL(baseH, baseS, baseB, themeH, themeS, themeB, amount);
}

// ══════════════════════════════════════════════════════════════════════════
//  RUG — Oval oriental rug under table
// ══════════════════════════════════════════════════════════════════════════

export function drawRug(ctx, h, s, b, pos) {
  const { cx, cy, rx, ry } = pos;

  // Base colours with theme tint
  const rug  = tint(0, 40, 45, h, s, b, 0.15);   // deep red
  const gold = tint(40, 55, 65, h, s, b, 0.12);   // gold accents

  ctx.save();

  // Main rug body — filled ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  const rugGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  rugGrad.addColorStop(0.0, `hsla(${rug.h}, ${rug.s}%, ${rug.b}%, 0.35)`);
  rugGrad.addColorStop(0.5, `hsla(${rug.h}, ${rug.s}%, ${rug.b - 5}%, 0.25)`);
  rugGrad.addColorStop(0.8, `hsla(${rug.h}, ${rug.s - 5}%, ${rug.b - 10}%, 0.15)`);
  rugGrad.addColorStop(1.0, `hsla(${rug.h}, ${rug.s - 8}%, ${rug.b - 15}%, 0.0)`);
  ctx.fillStyle = rugGrad;
  ctx.fill();

  // Outer border ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.22)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner border ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.18)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center medallion
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.35, ry * 0.35, 0, 0, Math.PI * 2);
  const medGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.35);
  medGrad.addColorStop(0.0, `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.18)`);
  medGrad.addColorStop(1.0, `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.0)`);
  ctx.fillStyle = medGrad;
  ctx.fill();
  ctx.strokeStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.14)`;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Diamond motifs at 4 compass points (between the two border rings)
  const midR = rx * 0.75;
  const midRy = ry * 0.75;
  const dSize = 4;
  const diamonds = [
    [cx, cy - midRy],
    [cx, cy + midRy],
    [cx - midR, cy],
    [cx + midR, cy],
  ];
  for (const [dx, dy] of diamonds) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.18)`;
    ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
    ctx.restore();
  }

  // Fringe at top and bottom
  ctx.globalAlpha = 0.2;
  const fringeW = rx * 0.5;
  for (let fx = cx - fringeW; fx < cx + fringeW; fx += 4) {
    ctx.fillStyle = `hsl(${rug.h}, ${rug.s}%, ${rug.b}%)`;
    ctx.fillRect(fx, cy - ry - 3, 1.5, 4);
    ctx.fillRect(fx, cy + ry - 1, 1.5, 4);
  }
  ctx.globalAlpha = 1;

  // Subtle wear highlight
  const wearGrad = ctx.createRadialGradient(cx + rx * 0.1, cy - ry * 0.1, 0, cx, cy, rx * 0.5);
  wearGrad.addColorStop(0.0, 'rgba(255,240,200,0.05)');
  wearGrad.addColorStop(1.0, 'rgba(255,240,200,0)');
  ctx.fillStyle = wearGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  CAT BED — Wicker basket with sleeping cat
// ══════════════════════════════════════════════════════════════════════════

export function drawCatBed(ctx, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;
  const w = 48;
  const bh = 26;

  const wicker = tint(30, 35, 55, h, s, b, 0.15);
  const cushion = tint(35, 20, 78, h, s, b, 0.12);
  const cat = tint(32, 40, 68, h, s, b, 0.10);

  ctx.save();

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + bh + 2, w * 0.5, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  // Basket back
  ctx.beginPath();
  const bx = x, by = y;
  ctx.moveTo(bx + 4, by + bh);
  ctx.quadraticCurveTo(bx - 2, by + bh * 0.3, bx + 6, by);
  ctx.lineTo(bx + w - 6, by);
  ctx.quadraticCurveTo(bx + w + 2, by + bh * 0.3, bx + w - 4, by + bh);
  ctx.closePath();
  ctx.fillStyle = `hsl(${wicker.h}, ${wicker.s}%, ${wicker.b}%)`;
  ctx.fill();

  // Woven texture — horizontal
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.2;
  for (let wy = by + 3; wy < by + bh; wy += 5) {
    ctx.beginPath();
    ctx.moveTo(bx, wy);
    ctx.lineTo(bx + w, wy);
    ctx.strokeStyle = `hsl(${wicker.h}, ${wicker.s + 5}%, ${wicker.b - 10}%)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Woven texture — vertical
  for (let wx = bx + 4; wx < bx + w; wx += 7) {
    ctx.beginPath();
    ctx.moveTo(wx, by);
    ctx.lineTo(wx, by + bh);
    ctx.strokeStyle = `hsl(${wicker.h}, ${wicker.s + 3}%, ${wicker.b - 8}%)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();

  // Cushion
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + bh * 0.45, w * 0.38, bh * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${cushion.h}, ${cushion.s}%, ${cushion.b}%, 0.5)`;
  ctx.fill();
  // Cushion stitch
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + bh * 0.45);
  ctx.lineTo(x + w * 0.7, y + bh * 0.45);
  ctx.strokeStyle = `hsla(${cushion.h}, ${cushion.s}%, ${cushion.b - 10}%, 0.25)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Sleeping cat — curled body
  const catCx = x + w / 2;
  const catCy = y + bh * 0.4;
  ctx.beginPath();
  ctx.ellipse(catCx, catCy + 2, 18, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.fill();

  // Stripes on body
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(catCx, catCy + 2, 18, 9, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.2;
  for (let si = -12; si < 14; si += 5) {
    ctx.beginPath();
    ctx.moveTo(catCx + si, catCy - 8);
    ctx.lineTo(catCx + si + 6, catCy + 12);
    ctx.strokeStyle = `hsl(${cat.h}, ${cat.s + 5}%, ${cat.b - 15}%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // Cat head
  const headX = catCx - 10;
  const headY = catCy - 3;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 8, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b + 2}%)`;
  ctx.fill();

  // Ears
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.beginPath();
  ctx.moveTo(headX - 6, headY - 3);
  ctx.lineTo(headX - 3, headY - 9);
  ctx.lineTo(headX, headY - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + 6, headY - 3);
  ctx.lineTo(headX + 3, headY - 9);
  ctx.lineTo(headX, headY - 3);
  ctx.fill();

  // Inner ears (pink)
  ctx.fillStyle = 'hsla(350, 30%, 65%, 0.4)';
  ctx.beginPath();
  ctx.moveTo(headX - 5, headY - 3);
  ctx.lineTo(headX - 3, headY - 7);
  ctx.lineTo(headX - 1, headY - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + 5, headY - 3);
  ctx.lineTo(headX + 3, headY - 7);
  ctx.lineTo(headX + 1, headY - 3);
  ctx.fill();

  // Closed eyes
  ctx.strokeStyle = `hsla(${cat.h}, ${cat.s}%, ${cat.b - 30}%, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(headX - 3, headY, 2.5, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headX + 3, headY, 2.5, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Nose
  ctx.fillStyle = 'hsla(350, 35%, 65%, 0.6)';
  ctx.beginPath();
  ctx.ellipse(headX, headY + 3, 1.8, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(catCx + 14, catCy + 4);
  ctx.quadraticCurveTo(catCx + 22, catCy, catCx + 20, catCy - 4);
  ctx.strokeStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Paw peeking out
  ctx.beginPath();
  ctx.ellipse(catCx + 2, catCy + 10, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b + 3}%)`;
  ctx.fill();

  // Front rim (3D lip)
  ctx.beginPath();
  ctx.moveTo(bx + 2, by + bh - 2);
  ctx.quadraticCurveTo(bx + w / 2, by + bh + 4, bx + w - 2, by + bh - 2);
  ctx.strokeStyle = `hsl(${wicker.h}, ${wicker.s + 2}%, ${wicker.b + 5}%)`;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  LAMP — Standing floor lamp with fabric shade
// ══════════════════════════════════════════════════════════════════════════

export function drawLamp(ctx, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;

  const shade  = tint(40, 25, 82, h, s, b, 0.15);
  const brass  = tint(42, 50, 62, h, s, b, 0.12);

  ctx.save();

  // Light cone on wall (behind lamp)
  const wallGlow = ctx.createRadialGradient(x + 14, y - 10, 0, x + 14, y - 10, 60);
  wallGlow.addColorStop(0.0, 'rgba(255,220,130,0.10)');
  wallGlow.addColorStop(1.0, 'rgba(255,220,130,0)');
  ctx.fillStyle = wallGlow;
  ctx.fillRect(x - 30, y - 50, 90, 70);

  // Shade (trapezoid)
  const shadeW1 = 20;
  const shadeW2 = 30;
  const shadeH = 20;
  const shadeCx = x + 14;
  const shadeTop = y;
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW1 / 2, shadeTop);
  ctx.lineTo(shadeCx + shadeW1 / 2, shadeTop);
  ctx.lineTo(shadeCx + shadeW2 / 2, shadeTop + shadeH);
  ctx.lineTo(shadeCx - shadeW2 / 2, shadeTop + shadeH);
  ctx.closePath();
  ctx.fillStyle = `hsl(${shade.h}, ${shade.s}%, ${shade.b}%)`;
  ctx.fill();

  // Fabric texture on shade
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.12;
  for (let fx = shadeCx - shadeW2 / 2; fx < shadeCx + shadeW2 / 2; fx += 4) {
    ctx.beginPath();
    ctx.moveTo(fx, shadeTop);
    ctx.lineTo(fx, shadeTop + shadeH);
    ctx.strokeStyle = `hsl(${shade.h}, ${shade.s}%, ${shade.b - 12}%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();

  // Seam
  ctx.beginPath();
  ctx.moveTo(shadeCx, shadeTop);
  ctx.lineTo(shadeCx, shadeTop + shadeH);
  ctx.strokeStyle = `hsla(${shade.h}, ${shade.s}%, ${shade.b - 8}%, 0.15)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Inner glow at bottom of shade
  const innerGlow = ctx.createLinearGradient(shadeCx, shadeTop + shadeH * 0.4, shadeCx, shadeTop + shadeH);
  innerGlow.addColorStop(0.0, 'rgba(255,240,180,0.1)');
  innerGlow.addColorStop(1.0, 'rgba(255,225,140,0.35)');
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW1 / 2 + 4, shadeTop + shadeH * 0.4);
  ctx.lineTo(shadeCx + shadeW1 / 2 - 4, shadeTop + shadeH * 0.4);
  ctx.lineTo(shadeCx + shadeW2 / 2 - 2, shadeTop + shadeH);
  ctx.lineTo(shadeCx - shadeW2 / 2 + 2, shadeTop + shadeH);
  ctx.closePath();
  ctx.fillStyle = innerGlow;
  ctx.fill();

  // Top/bottom rings
  ctx.strokeStyle = `hsla(${brass.h}, ${brass.s}%, ${brass.b}%, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW1 / 2, shadeTop);
  ctx.lineTo(shadeCx + shadeW1 / 2, shadeTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW2 / 2, shadeTop + shadeH);
  ctx.lineTo(shadeCx + shadeW2 / 2, shadeTop + shadeH);
  ctx.stroke();

  // Bulb glow
  ctx.beginPath();
  ctx.arc(shadeCx, shadeTop + shadeH + 3, 4, 0, Math.PI * 2);
  const bulbGrad = ctx.createRadialGradient(shadeCx, shadeTop + shadeH + 3, 0, shadeCx, shadeTop + shadeH + 3, 5);
  bulbGrad.addColorStop(0.0, 'rgba(255,240,180,0.7)');
  bulbGrad.addColorStop(1.0, 'rgba(255,220,120,0)');
  ctx.fillStyle = bulbGrad;
  ctx.fill();

  // Pole
  const poleTop = shadeTop + shadeH + 5;
  const poleBot = y + 80;
  ctx.beginPath();
  ctx.moveTo(shadeCx, poleTop);
  ctx.lineTo(shadeCx, poleBot);
  const poleGrad = ctx.createLinearGradient(shadeCx - 2, 0, shadeCx + 2, 0);
  poleGrad.addColorStop(0.0, `hsl(${brass.h}, ${brass.s}%, ${brass.b - 8}%)`);
  poleGrad.addColorStop(0.5, `hsl(${brass.h}, ${brass.s}%, ${brass.b + 5}%)`);
  poleGrad.addColorStop(1.0, `hsl(${brass.h}, ${brass.s}%, ${brass.b - 8}%)`);
  ctx.strokeStyle = poleGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pole accent rings
  for (const ry of [poleTop + 15, poleTop + 45]) {
    ctx.beginPath();
    ctx.moveTo(shadeCx - 3, ry);
    ctx.lineTo(shadeCx + 3, ry);
    ctx.strokeStyle = `hsla(${brass.h}, ${brass.s}%, ${brass.b + 8}%, 0.4)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Base
  ctx.beginPath();
  ctx.ellipse(shadeCx, poleBot + 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b - 4}%)`;
  ctx.fill();

  // Floor light pool
  const floorGlow = ctx.createRadialGradient(shadeCx, poleBot + 8, 0, shadeCx, poleBot + 8, 30);
  floorGlow.addColorStop(0.0, 'rgba(255,220,120,0.12)');
  floorGlow.addColorStop(1.0, 'rgba(255,220,120,0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(shadeCx, poleBot + 8, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Placeholder exports — will be implemented in Task 5
export function drawPlant(ctx, ts, h, s, b, pos) {}
export function drawCatTree(ctx, h, s, b, pos) {}
export function drawFireplace(ctx, ts, h, s, b, pos) {}
