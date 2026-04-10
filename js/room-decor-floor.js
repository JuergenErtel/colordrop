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

// ══════════════════════════════════════════════════════════════════════════
//  PLANT — Potted plant with swaying leaves
// ══════════════════════════════════════════════════════════════════════════

export function drawPlant(ctx, ts, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;

  const terra = tint(15, 50, 48, h, s, b, 0.12);

  // Idle animation: gentle sway
  const sway = Math.sin(ts * 0.00015) * 0.04;

  ctx.save();

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 52, 16, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();

  // Leaves (back to front, each with own green shade and sway offset)
  const leaves = [
    { angle: -0.7 + sway * 0.8,  gh: 115, gs: 38, gb: 42, len: 32, w: 8, phase: 0 },
    { angle:  0.6 + sway * 0.6,  gh: 120, gs: 40, gb: 44, len: 30, w: 7, phase: 1 },
    { angle: -0.45 + sway,       gh: 125, gs: 42, gb: 48, len: 36, w: 9, phase: 2 },
    { angle:  0.35 + sway * 1.1, gh: 118, gs: 44, gb: 46, len: 34, w: 8, phase: 3 },
    { angle: -0.2 + sway * 1.2,  gh: 130, gs: 40, gb: 50, len: 38, w: 9, phase: 4 },
    { angle:  0.1 + sway * 0.9,  gh: 122, gs: 45, gb: 52, len: 35, w: 8, phase: 5 },
    { angle: -0.05 + sway * 1.0, gh: 128, gs: 42, gb: 54, len: 32, w: 7, phase: 6 },
  ];

  const stemBase = { x: x + 14, y: y + 34 };

  for (const leaf of leaves) {
    const lc = tint(leaf.gh, leaf.gs, leaf.gb, h, s, b, 0.15);
    const tipX = stemBase.x + Math.sin(leaf.angle) * leaf.len;
    const tipY = stemBase.y - Math.cos(leaf.angle) * leaf.len;
    const midX = (stemBase.x + tipX) / 2 + Math.sin(leaf.angle + 0.5) * leaf.w;
    const midY = (stemBase.y + tipY) / 2;

    ctx.beginPath();
    ctx.moveTo(stemBase.x, stemBase.y);
    ctx.quadraticCurveTo(midX - leaf.w * 0.5, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + leaf.w * 0.5, midY, stemBase.x, stemBase.y);
    ctx.fillStyle = `hsla(${lc.h}, ${lc.s}%, ${lc.b}%, 0.75)`;
    ctx.fill();

    // Midrib
    ctx.beginPath();
    ctx.moveTo(stemBase.x, stemBase.y);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = `hsla(${lc.h}, ${lc.s}%, ${lc.b - 12}%, 0.3)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Side veins (2 per leaf for main leaves)
    if (leaf.len > 33) {
      for (const vf of [0.35, 0.6]) {
        const vx = stemBase.x + (tipX - stemBase.x) * vf;
        const vy = stemBase.y + (tipY - stemBase.y) * vf;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(leaf.angle) * 4, vy + Math.sin(leaf.angle) * 4);
        ctx.strokeStyle = `hsla(${lc.h}, ${lc.s}%, ${lc.b - 10}%, 0.2)`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }
  }

  // Soil
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 35, 10, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(25, 40%, 25%, 0.5)';
  ctx.fill();

  // Pot rim
  ctx.fillStyle = `hsl(${terra.h}, ${terra.s}%, ${terra.b + 5}%)`;
  ctx.fillRect(x + 4, y + 34, 20, 4);

  // Pot body (tapered)
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 38);
  ctx.lineTo(x + 8, y + 52);
  ctx.lineTo(x + 20, y + 52);
  ctx.lineTo(x + 23, y + 38);
  ctx.closePath();
  ctx.fillStyle = `hsl(${terra.h}, ${terra.s}%, ${terra.b}%)`;
  ctx.fill();

  // Pot texture lines
  ctx.strokeStyle = `hsla(${terra.h}, ${terra.s}%, ${terra.b - 8}%, 0.15)`;
  ctx.lineWidth = 0.5;
  for (let py = y + 40; py < y + 52; py += 5) {
    ctx.beginPath();
    ctx.moveTo(x + 6, py);
    ctx.lineTo(x + 22, py);
    ctx.stroke();
  }

  // Pot ring detail
  ctx.strokeStyle = `hsla(${terra.h}, ${terra.s}%, ${terra.b + 8}%, 0.3)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 42);
  ctx.lineTo(x + 23, y + 42);
  ctx.stroke();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  CAT TREE — Sisal-wrapped post with platforms and toy
// ══════════════════════════════════════════════════════════════════════════

export function drawCatTree(ctx, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;

  const wood = tint(35, 30, 55, h, s, b, 0.15);
  const carpet = tint(32, 18, 65, h, s, b, 0.12);
  const sisal  = tint(40, 28, 62, h, s, b, 0.12);

  ctx.save();

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 68, 18, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();

  // Base platform
  ctx.fillStyle = `hsl(${carpet.h}, ${carpet.s}%, ${carpet.b}%)`;
  ctx.fillRect(x - 2, y + 62, 32, 6);
  ctx.fillStyle = `hsla(${carpet.h}, ${carpet.s}%, ${carpet.b - 8}%, 0.2)`;
  ctx.fillRect(x, y + 64, 28, 2);

  // Lower post (thick, sisal)
  const postX = x + 10;
  ctx.fillStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b}%)`;
  ctx.fillRect(postX, y + 20, 10, 42);
  // Sisal diagonal wrap
  ctx.save();
  ctx.beginPath();
  ctx.rect(postX, y + 20, 10, 42);
  ctx.clip();
  ctx.globalAlpha = 0.15;
  for (let sy = y + 20; sy < y + 65; sy += 5) {
    ctx.beginPath();
    ctx.moveTo(postX, sy);
    ctx.lineTo(postX + 10, sy - 4);
    ctx.strokeStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b - 10}%)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();

  // Scratch marks
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b - 15}%)`;
  ctx.lineWidth = 0.6;
  for (const sx of [postX + 2, postX + 5, postX + 7]) {
    ctx.beginPath();
    ctx.moveTo(sx, y + 32);
    ctx.lineTo(sx, y + 48);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Middle platform
  ctx.fillStyle = `hsl(${carpet.h}, ${carpet.s}%, ${carpet.b}%)`;
  ctx.fillRect(x, y + 16, 26, 5);
  ctx.fillStyle = `hsla(${carpet.h}, ${carpet.s}%, ${carpet.b - 8}%, 0.2)`;
  ctx.fillRect(x + 2, y + 18, 22, 2);

  // Upper post (thinner)
  ctx.fillStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b}%)`;
  ctx.fillRect(postX + 1, y + 2, 8, 14);
  ctx.save();
  ctx.beginPath();
  ctx.rect(postX + 1, y + 2, 8, 14);
  ctx.clip();
  ctx.globalAlpha = 0.12;
  for (let sy = y + 2; sy < y + 16; sy += 4) {
    ctx.beginPath();
    ctx.moveTo(postX + 1, sy);
    ctx.lineTo(postX + 9, sy - 3);
    ctx.strokeStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b - 10}%)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();

  // Top platform
  ctx.fillStyle = `hsl(${carpet.h}, ${carpet.s}%, ${carpet.b + 2}%)`;
  ctx.fillRect(x - 1, y - 2, 30, 5);
  ctx.fillStyle = `hsla(${carpet.h}, ${carpet.s}%, ${carpet.b - 8}%, 0.2)`;
  ctx.fillRect(x + 1, y, 26, 2);

  // Side arm with dangling toy
  ctx.strokeStyle = `hsl(${wood.h}, ${wood.s}%, ${wood.b}%)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(postX + 8, y + 30);
  ctx.lineTo(x + 28, y + 28);
  ctx.stroke();

  // String
  ctx.strokeStyle = 'hsla(0, 0%, 50%, 0.3)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 28);
  ctx.lineTo(x + 26, y + 40);
  ctx.stroke();

  // Ball toy
  ctx.beginPath();
  ctx.arc(x + 26, y + 43, 4, 0, Math.PI * 2);
  const toyC = tint(0, 50, 55, h, s, b, 0.15);
  ctx.fillStyle = `hsl(${toyC.h}, ${toyC.s}%, ${toyC.b}%)`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 25, y + 42, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${toyC.h}, ${toyC.s}%, ${toyC.b + 20}%, 0.3)`;
  ctx.fill();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  FIREPLACE — Brick mantel with fire, logs, glow
// ══════════════════════════════════════════════════════════════════════════

export function drawFireplace(ctx, ts, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;
  const fw = pos.w;

  const brick = tint(15, 35, 42, h, s, b, 0.15);
  const stone = tint(25, 30, 50, h, s, b, 0.12);

  ctx.save();

  // Warm glow on wall above
  const wallGlow = ctx.createRadialGradient(x + fw / 2, y - 10, 0, x + fw / 2, y - 10, 45);
  wallGlow.addColorStop(0.0, 'rgba(255,150,50,0.10)');
  wallGlow.addColorStop(1.0, 'rgba(255,150,50,0)');
  ctx.fillStyle = wallGlow;
  ctx.fillRect(x - 10, y - 40, fw + 20, 45);

  // Mantel top
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s + 3}%, ${stone.b + 8}%)`;
  ctx.fillRect(x - 2, y, fw + 4, 6);
  ctx.fillStyle = `hsla(${stone.h}, ${stone.s}%, ${stone.b + 14}%, 0.3)`;
  ctx.fillRect(x, y + 5, fw, 1.5);

  // Mantel body
  ctx.fillStyle = `hsl(${brick.h}, ${brick.s}%, ${brick.b}%)`;
  ctx.fillRect(x, y + 6, fw, 46);

  // Brick texture
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + 6, fw, 46);
  ctx.clip();
  ctx.globalAlpha = 0.18;
  for (let by = y + 6; by < y + 52; by += 8) {
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + fw, by);
    ctx.strokeStyle = `hsl(${brick.h}, ${brick.s - 5}%, ${brick.b - 10}%)`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  for (let by = y + 6; by < y + 52; by += 8) {
    const offset = ((by - y) / 8 % 2) * 8;
    for (let bx2 = x + offset; bx2 < x + fw; bx2 += 16) {
      ctx.beginPath();
      ctx.moveTo(bx2, by);
      ctx.lineTo(bx2, by + 8);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Pilasters
  const pilW = 8;
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s + 2}%, ${stone.b + 4}%)`;
  ctx.fillRect(x, y + 6, pilW, 46);
  ctx.fillRect(x + fw - pilW, y + 6, pilW, 46);
  ctx.fillStyle = `hsla(${stone.h}, ${stone.s}%, ${stone.b - 8}%, 0.2)`;
  ctx.fillRect(x + pilW, y + 6, 1, 46);
  ctx.fillRect(x + fw - pilW - 1, y + 6, 1, 46);

  // Arch opening
  const archX = x + pilW + 2;
  const archW = fw - 2 * pilW - 4;
  const archH = 36;
  const archY = y + 52 - archH;
  const archR = archW / 2;

  ctx.beginPath();
  ctx.moveTo(archX, y + 52);
  ctx.lineTo(archX, archY + archR);
  ctx.arc(archX + archR, archY + archR, archR, Math.PI, 0);
  ctx.lineTo(archX + archW, y + 52);
  ctx.closePath();
  ctx.fillStyle = 'rgba(12,6,3,0.9)';
  ctx.fill();

  // Keystone
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s}%, ${stone.b + 6}%)`;
  ctx.fillRect(archX + archR - 5, archY + archR - archR - 1, 10, 6);

  // Inner back wall
  ctx.beginPath();
  ctx.moveTo(archX + 3, y + 52);
  ctx.lineTo(archX + 3, archY + archR + 2);
  ctx.arc(archX + archR, archY + archR + 2, archR - 3, Math.PI, 0);
  ctx.lineTo(archX + archW - 3, y + 52);
  ctx.closePath();
  ctx.fillStyle = 'rgba(22,12,6,0.85)';
  ctx.fill();

  // Soot stains
  const sootGrad = ctx.createRadialGradient(archX + archR, archY + archR - 5, 0, archX + archR, archY + archR, archR);
  sootGrad.addColorStop(0.0, 'rgba(0,0,0,0.2)');
  sootGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = sootGrad;
  ctx.beginPath();
  ctx.arc(archX + archR, archY + archR, archR - 3, Math.PI, 0);
  ctx.fill();

  // Logs and fire (clipped to arch)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(archX + 3, y + 52);
  ctx.lineTo(archX + 3, archY + archR + 2);
  ctx.arc(archX + archR, archY + archR + 2, archR - 3, Math.PI, 0);
  ctx.lineTo(archX + archW - 3, y + 52);
  ctx.clip();

  const logY = y + 48;
  ctx.fillStyle = 'hsla(20, 35%, 28%, 0.85)';
  ctx.save();
  ctx.translate(archX + 8, logY);
  ctx.rotate(-0.05);
  ctx.fillRect(0, 0, archW * 0.6, 5);
  ctx.beginPath();
  ctx.arc(3, 2.5, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(20, 30%, 20%, 0.5)';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'hsla(18, 32%, 25%, 0.85)';
  ctx.save();
  ctx.translate(archX + 12, logY - 4);
  ctx.rotate(0.08);
  ctx.fillRect(0, 0, archW * 0.5, 4);
  ctx.restore();
  ctx.fillStyle = 'hsla(22, 30%, 23%, 0.8)';
  ctx.save();
  ctx.translate(archX + 14, logY + 1);
  ctx.rotate(-0.03);
  ctx.fillRect(0, 0, archW * 0.4, 3.5);
  ctx.restore();

  // Fire
  const fireX = archX + archR;
  const fireY = logY - 4;
  const flicker1 = Math.sin(ts * 0.003) * 2;
  const flicker2 = Math.sin(ts * 0.005 + 1.3) * 1.5;
  const flicker3 = Math.sin(ts * 0.004 + 2.7) * 1.8;

  const outerFlame = ctx.createRadialGradient(fireX + flicker1, fireY + 6, 0, fireX, fireY, 16);
  outerFlame.addColorStop(0.0, 'rgba(255,120,20,0.85)');
  outerFlame.addColorStop(0.4, 'rgba(255,80,10,0.5)');
  outerFlame.addColorStop(0.8, 'rgba(200,40,5,0.15)');
  outerFlame.addColorStop(1.0, 'rgba(200,40,5,0)');
  ctx.beginPath();
  ctx.ellipse(fireX + flicker1 * 0.5, fireY, 10, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = outerFlame;
  ctx.fill();

  const innerFlame = ctx.createRadialGradient(fireX + flicker2 * 0.3, fireY + 4, 0, fireX, fireY, 10);
  innerFlame.addColorStop(0.0, 'rgba(255,230,80,0.9)');
  innerFlame.addColorStop(0.5, 'rgba(255,180,40,0.5)');
  innerFlame.addColorStop(1.0, 'rgba(255,180,40,0)');
  ctx.beginPath();
  ctx.ellipse(fireX + flicker2 * 0.3, fireY + 2, 6, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = innerFlame;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(fireX + flicker3 * 0.2, fireY + 4, 3, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,200,0.6)';
  ctx.fill();

  // Sparks
  const spark1Y = fireY - 10 - Math.abs(Math.sin(ts * 0.002)) * 6;
  const spark2Y = fireY - 8 - Math.abs(Math.sin(ts * 0.003 + 1)) * 8;
  ctx.beginPath();
  ctx.arc(fireX - 4 + flicker1, spark1Y, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,200,80,0.6)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fireX + 3 + flicker2, spark2Y, 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,180,60,0.5)';
  ctx.fill();

  // Ember bed
  const emberGrad = ctx.createLinearGradient(archX + 5, logY + 3, archX + 5, logY + 8);
  emberGrad.addColorStop(0.0, 'rgba(255,100,20,0.25)');
  emberGrad.addColorStop(1.0, 'rgba(255,60,10,0.05)');
  ctx.fillStyle = emberGrad;
  ctx.fillRect(archX + 5, logY + 3, archW - 10, 5);

  ctx.restore(); // end arch clip

  // Hearth
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s - 2}%, ${stone.b - 3}%)`;
  ctx.fillRect(x - 2, y + 52, fw + 4, 5);

  // Floor glow
  const floorGlow = ctx.createRadialGradient(x + fw / 2, y + 60, 0, x + fw / 2, y + 60, 30);
  floorGlow.addColorStop(0.0, 'rgba(255,140,50,0.08)');
  floorGlow.addColorStop(1.0, 'rgba(255,140,50,0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(x + fw / 2, y + 60, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
