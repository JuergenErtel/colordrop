'use strict';

import { lerpHSL } from './background.js';

function tint(baseH, baseS, baseB, themeH, themeS, themeB, amount) {
  return lerpHSL(baseH, baseS, baseB, themeH, themeS, themeB, amount);
}

// ══════════════════════════════════════════════════════════════════════════
//  SHELF — Bookshelf with books, cat figurine, mug, yarn
// ══════════════════════════════════════════════════════════════════════════

export function drawShelf(ctx, h, s, b, pos) {
  const { x, y, w: sw } = pos;
  const sh = pos.h;
  const wood = tint(25, 40, 42, h, s, b, 0.15);

  ctx.save();

  // Shadow behind shelf
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + 3, y + 3, sw, sh);

  // Back panel
  ctx.fillStyle = `hsl(${wood.h}, ${wood.s}%, ${wood.b}%)`;
  ctx.fillRect(x, y, sw, sh);

  // Wood grain
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let gy = y + 4; gy < y + sh; gy += 8) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + sw, gy);
    ctx.strokeStyle = `hsl(${wood.h}, ${wood.s}%, ${wood.b - 12}%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();

  // 4 shelves
  const shelfPositions = [0, 0.27, 0.54, 0.81];
  for (const frac of shelfPositions) {
    const sy = y + sh * frac;
    ctx.fillStyle = `hsl(${wood.h}, ${wood.s + 4}%, ${wood.b + 10}%)`;
    ctx.fillRect(x - 2, sy, sw + 4, 3);
    ctx.fillStyle = `hsla(${wood.h}, ${wood.s}%, ${wood.b - 15}%, 0.15)`;
    ctx.fillRect(x, sy + 3, sw, 2);
  }

  // Books on shelves — procedural generation
  const bookColors = [
    [0, 45, 50], [220, 45, 50], [120, 40, 48], [45, 50, 60],
    [280, 35, 48], [25, 45, 45], [200, 40, 55], [340, 40, 52],
  ];

  const shelfTops = shelfPositions.map(f => y + sh * f + 5);

  // Row 1 — full of books
  let bx = x + 3;
  for (let i = 0; i < 8 && bx < x + sw - 5; i++) {
    const bw = 5 + (i * 7 % 5);
    const bHeight = 14 + (i * 11 % 8);
    const [bh, bs, bb] = bookColors[i % bookColors.length];
    const tc = tint(bh, bs, bb, h, s, b, 0.1);
    const by2 = shelfTops[0] + (sh * 0.27 - 5) - bHeight;
    ctx.fillStyle = `hsl(${tc.h}, ${tc.s}%, ${tc.b}%)`;
    ctx.fillRect(bx, by2, bw, bHeight);
    if (bw > 6) {
      ctx.fillStyle = `hsla(${tc.h}, ${tc.s}%, ${tc.b + 20}%, 0.25)`;
      ctx.fillRect(bx + 1, by2 + 3, bw - 2, 0.8);
    }
    bx += bw + 1.5;
  }

  // Row 2 — books + cat figurine
  bx = x + 3;
  for (let i = 0; i < 5 && bx < x + sw - 20; i++) {
    const bw = 5 + ((i + 3) * 7 % 5);
    const bHeight = 12 + ((i + 3) * 11 % 7);
    const [bh2, bs2, bb2] = bookColors[(i + 3) % bookColors.length];
    const tc = tint(bh2, bs2, bb2, h, s, b, 0.1);
    const by2 = shelfTops[1] + (sh * 0.27 - 5) - bHeight;
    ctx.fillStyle = `hsl(${tc.h}, ${tc.s}%, ${tc.b}%)`;
    ctx.fillRect(bx, by2, bw, bHeight);
    bx += bw + 1.5;
  }
  // Cat figurine
  const figX = bx + 4;
  const figY = shelfTops[1] + (sh * 0.27 - 5) - 12;
  ctx.beginPath();
  ctx.ellipse(figX + 5, figY + 5, 5, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(35, 40%, 68%, 0.7)';
  ctx.fill();
  ctx.fillStyle = 'hsla(35, 40%, 65%, 0.6)';
  ctx.beginPath();
  ctx.moveTo(figX + 1, figY + 3);
  ctx.lineTo(figX + 3, figY - 1);
  ctx.lineTo(figX + 5, figY + 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(figX + 5, figY + 3);
  ctx.lineTo(figX + 7, figY - 1);
  ctx.lineTo(figX + 9, figY + 3);
  ctx.fill();

  // Row 3 — yarn ball + mug + few books
  bx = x + 3;
  ctx.beginPath();
  ctx.arc(bx + 6, shelfTops[2] + (sh * 0.27 - 5) - 7, 6, 0, Math.PI * 2);
  const yarnC = tint(340, 45, 65, h, s, b, 0.15);
  ctx.fillStyle = `hsl(${yarnC.h}, ${yarnC.s}%, ${yarnC.b}%)`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx + 6, shelfTops[2] + (sh * 0.27 - 5) - 7, 4, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${yarnC.h}, ${yarnC.s}%, ${yarnC.b + 12}%, 0.25)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  const mugX = bx + 18;
  const mugY = shelfTops[2] + (sh * 0.27 - 5) - 12;
  ctx.fillStyle = 'hsla(30, 10%, 88%, 0.7)';
  ctx.fillRect(mugX, mugY, 8, 12);
  ctx.beginPath();
  ctx.arc(mugX + 8, mugY + 6, 3.5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.strokeStyle = 'hsla(30, 10%, 85%, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Row 4 — sparse (small photo frame, mini plant)
  const frameX = x + 5;
  const frameY = shelfTops[3] + 3;
  ctx.strokeStyle = `hsla(${wood.h}, ${wood.s}%, ${wood.b + 15}%, 0.5)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX, frameY, 10, 13);
  ctx.fillStyle = 'hsla(30, 15%, 80%, 0.15)';
  ctx.fillRect(frameX + 1.5, frameY + 1.5, 7, 10);

  const mpX = x + 22;
  const mpY = shelfTops[3] + 2;
  ctx.fillStyle = 'hsla(120, 40%, 45%, 0.6)';
  ctx.beginPath();
  ctx.ellipse(mpX + 4, mpY + 3, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'hsla(15, 50%, 45%, 0.6)';
  ctx.fillRect(mpX + 1, mpY + 9, 6, 6);

  // Top and bottom trim
  ctx.fillStyle = `hsl(${wood.h}, ${wood.s + 4}%, ${wood.b + 12}%)`;
  ctx.fillRect(x - 3, y - 2, sw + 6, 4);
  ctx.fillRect(x - 3, y + sh, sw + 6, 4);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  WALL ART — Gold-framed cat portrait
// ══════════════════════════════════════════════════════════════════════════

export function drawWallArt(ctx, h, s, b, pos) {
  const { x, y, w: fw, h: fh } = pos;
  const gold = tint(42, 55, 62, h, s, b, 0.12);
  const cat = tint(32, 40, 68, h, s, b, 0.10);

  ctx.save();

  // Shadow behind frame
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + 3, y + 3, fw, fh);

  // Outer frame
  ctx.fillStyle = `hsl(${gold.h}, ${gold.s}%, ${gold.b}%)`;
  ctx.fillRect(x, y, fw, fh);

  // Frame bevel (outer)
  ctx.strokeStyle = `hsl(${gold.h}, ${gold.s - 5}%, ${gold.b - 8}%)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, fw - 6, fh - 6);

  // Frame bevel (inner)
  ctx.strokeStyle = `hsl(${gold.h}, ${gold.s}%, ${gold.b + 5}%)`;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 6, y + 6, fw - 12, fh - 12);

  // Frame highlight (top edge)
  ctx.fillStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b + 15}%, 0.25)`;
  ctx.fillRect(x + 1, y + 1, fw - 2, 2);

  // Mat / passepartout
  ctx.fillStyle = 'hsla(40, 15%, 85%, 0.15)';
  ctx.fillRect(x + 8, y + 8, fw - 16, fh - 16);

  // Cat portrait area
  const px = x + 10;
  const py = y + 10;
  const pw = fw - 20;
  const ph = fh - 20;

  // Background wash
  const bgGrad = ctx.createRadialGradient(px + pw / 2, py + ph * 0.6, 0, px + pw / 2, py + ph / 2, pw);
  bgGrad.addColorStop(0.0, 'hsla(35, 20%, 80%, 0.15)');
  bgGrad.addColorStop(1.0, 'hsla(30, 15%, 70%, 0.08)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(px, py, pw, ph);

  // Cat face
  const fcx = px + pw / 2;
  const fcy = py + ph * 0.45;
  const fr = Math.min(pw, ph) * 0.3;

  // Head
  ctx.beginPath();
  ctx.ellipse(fcx, fcy, fr, fr * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.fill();

  // Ears
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b - 2}%)`;
  ctx.beginPath();
  ctx.moveTo(fcx - fr * 0.7, fcy - fr * 0.3);
  ctx.lineTo(fcx - fr * 0.3, fcy - fr * 1.1);
  ctx.lineTo(fcx - fr * 0.05, fcy - fr * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fcx + fr * 0.7, fcy - fr * 0.3);
  ctx.lineTo(fcx + fr * 0.3, fcy - fr * 1.1);
  ctx.lineTo(fcx + fr * 0.05, fcy - fr * 0.3);
  ctx.fill();

  // Inner ears (pink)
  ctx.fillStyle = 'hsla(350, 30%, 65%, 0.35)';
  ctx.beginPath();
  ctx.moveTo(fcx - fr * 0.6, fcy - fr * 0.3);
  ctx.lineTo(fcx - fr * 0.3, fcy - fr * 0.9);
  ctx.lineTo(fcx - fr * 0.1, fcy - fr * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fcx + fr * 0.6, fcy - fr * 0.3);
  ctx.lineTo(fcx + fr * 0.3, fcy - fr * 0.9);
  ctx.lineTo(fcx + fr * 0.1, fcy - fr * 0.3);
  ctx.fill();

  // Eyes
  const eyeY = fcy + fr * 0.05;
  const eyeR = fr * 0.2;
  for (const side of [-1, 1]) {
    const ex = fcx + side * fr * 0.35;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR, eyeR * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(120, 50%, 50%, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'hsla(30, 30%, 30%, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR * 0.3, eyeR * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,20,20,0.7)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
  }

  // Forehead stripe (tabby)
  ctx.strokeStyle = `hsla(${cat.h}, ${cat.s + 5}%, ${cat.b - 15}%, 0.3)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(fcx, fcy - fr * 0.6);
  ctx.lineTo(fcx, fcy - fr * 0.15);
  ctx.stroke();

  // Nose
  ctx.beginPath();
  ctx.moveTo(fcx, fcy + fr * 0.25);
  ctx.lineTo(fcx - fr * 0.1, fcy + fr * 0.35);
  ctx.lineTo(fcx + fr * 0.1, fcy + fr * 0.35);
  ctx.closePath();
  ctx.fillStyle = 'hsla(350, 35%, 65%, 0.6)';
  ctx.fill();

  // Mouth
  ctx.strokeStyle = `hsla(${cat.h}, ${cat.s}%, ${cat.b - 25}%, 0.3)`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(fcx, fcy + fr * 0.35);
  ctx.quadraticCurveTo(fcx - fr * 0.15, fcy + fr * 0.5, fcx - fr * 0.25, fcy + fr * 0.42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fcx, fcy + fr * 0.35);
  ctx.quadraticCurveTo(fcx + fr * 0.15, fcy + fr * 0.5, fcx + fr * 0.25, fcy + fr * 0.42);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = 'hsla(40, 20%, 75%, 0.3)';
  ctx.lineWidth = 0.5;
  const wBase = fcy + fr * 0.3;
  for (const [dx, dy, angle] of [
    [-fr * 0.3, -1, -0.08], [-fr * 0.35, 1, 0.05],
    [fr * 0.3, -1, 0.08],  [fr * 0.35, 1, -0.05],
  ]) {
    ctx.beginPath();
    ctx.moveTo(fcx + dx * 0.3, wBase + dy);
    ctx.lineTo(fcx + dx * 1.8, wBase + dy + angle * 30);
    ctx.stroke();
  }

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  WINDOW — Wooden frame with cross bars, sky view, windowsill
// ══════════════════════════════════════════════════════════════════════════

export function drawWindow(ctx, h, s, b, pos) {
  const { x, y, w: ww, h: wh } = pos;
  const frame = tint(28, 38, 52, h, s, b, 0.15);

  ctx.save();

  // Light cast into room
  const lightCast = ctx.createRadialGradient(x + ww / 2, y + wh / 2, 0, x + ww / 2, y + wh, wh);
  lightCast.addColorStop(0.0, 'rgba(200,220,250,0.08)');
  lightCast.addColorStop(1.0, 'rgba(200,220,250,0)');
  ctx.fillStyle = lightCast;
  ctx.fillRect(x - 10, y, ww + 20, wh + 30);

  // Outer frame
  ctx.fillStyle = `hsl(${frame.h}, ${frame.s}%, ${frame.b}%)`;
  ctx.fillRect(x, y, ww, wh);
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillRect(x, y, ww, wh);
  ctx.shadowColor = 'transparent';

  // Glass area (inset)
  const gx = x + 4;
  const gy = y + 4;
  const gw = ww - 8;
  const gh = wh - 8;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
  skyGrad.addColorStop(0.0, 'hsla(215, 50%, 72%, 0.30)');
  skyGrad.addColorStop(0.4, 'hsla(210, 45%, 78%, 0.22)');
  skyGrad.addColorStop(0.7, 'hsla(200, 40%, 85%, 0.15)');
  skyGrad.addColorStop(1.0, 'hsla(35, 40%, 82%, 0.10)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(gx, gy, gw, gh);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(gx + gw * 0.25, gy + gh * 0.15, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.ellipse(gx + gw * 0.7, gy + gh * 0.22, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Distant tree silhouette
  ctx.fillStyle = 'rgba(60,90,50,0.15)';
  ctx.beginPath();
  ctx.ellipse(gx + 10, gy + gh * 0.55, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rooftop silhouette
  ctx.fillStyle = 'rgba(80,60,50,0.12)';
  ctx.fillRect(gx + gw * 0.6, gy + gh * 0.5, 16, 10);

  // Warm horizon glow
  const hzGrad = ctx.createLinearGradient(gx, gy + gh * 0.45, gx, gy + gh * 0.6);
  hzGrad.addColorStop(0.0, 'rgba(255,220,160,0)');
  hzGrad.addColorStop(1.0, 'rgba(255,220,160,0.10)');
  ctx.fillStyle = hzGrad;
  ctx.fillRect(gx, gy + gh * 0.45, gw, gh * 0.15);

  // Glass reflection
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(gx + 3, gy + 3);
  ctx.lineTo(gx + gw * 0.4, gy + 3);
  ctx.lineTo(gx + gw * 0.3, gy + gh * 0.25);
  ctx.lineTo(gx + 3, gy + gh * 0.3);
  ctx.closePath();
  ctx.fill();

  // Cross bars
  ctx.fillStyle = `hsl(${frame.h}, ${frame.s}%, ${frame.b + 3}%)`;
  ctx.fillRect(gx, gy + gh / 2 - 2, gw, 4);
  ctx.fillRect(gx + gw / 2 - 2, gy, 4, gh);
  ctx.fillStyle = `hsla(${frame.h}, ${frame.s}%, ${frame.b - 12}%, 0.2)`;
  ctx.fillRect(gx, gy + gh / 2 + 2, gw, 1);
  ctx.fillRect(gx + gw / 2 + 2, gy, 1, gh);

  // Inner frame edge
  ctx.strokeStyle = 'hsla(0, 0%, 0%, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gy, gw, gh);

  // Windowsill
  const sillH = 5;
  ctx.fillStyle = `hsl(${frame.h}, ${frame.s + 2}%, ${frame.b + 8}%)`;
  ctx.fillRect(x - 4, y + wh, ww + 8, sillH);
  ctx.fillStyle = `hsla(${frame.h}, ${frame.s}%, ${frame.b + 18}%, 0.3)`;
  ctx.fillRect(x - 4, y + wh, ww + 8, 1.5);

  // Small flower pot on sill
  const fpX = x + ww - 14;
  const fpY = y + wh - 8;
  ctx.strokeStyle = 'hsla(120, 35%, 40%, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fpX + 4, fpY);
  ctx.lineTo(fpX + 4, fpY - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fpX + 4, fpY - 9, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(340, 50%, 65%, 0.6)';
  ctx.fill();
  ctx.fillStyle = 'hsla(15, 50%, 45%, 0.6)';
  ctx.fillRect(fpX + 1, fpY, 6, 5);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  CHANDELIER — Brass candelabra with 5 arms
// ══════════════════════════════════════════════════════════════════════════

export function drawChandelier(ctx, ts, h, s, b, pos) {
  const { cx, y: baseY } = pos;
  const brass = tint(42, 52, 60, h, s, b, 0.12);

  const swing = Math.sin(ts * 0.0001) * 2;
  const drawX = cx + swing;

  ctx.save();

  // Overall glow
  const glow = ctx.createRadialGradient(drawX, baseY + 55, 0, drawX, baseY + 55, 80);
  glow.addColorStop(0.0, 'rgba(255,220,120,0.10)');
  glow.addColorStop(0.5, 'rgba(255,200,80,0.04)');
  glow.addColorStop(1.0, 'rgba(255,200,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(drawX, baseY + 55, 80, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ceiling mount
  ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b + 5}%)`;
  ctx.fillRect(cx - 6, baseY, 12, 5);

  // Chain
  ctx.strokeStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b}%)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, baseY + 5);
  ctx.lineTo(drawX, baseY + 20);
  ctx.stroke();

  // Hub
  ctx.beginPath();
  ctx.ellipse(drawX, baseY + 24, 8, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b + 3}%)`;
  ctx.fill();

  // 5 arms with candles
  const armPositions = [-2, -1, 0, 1, 2];
  const armSpacing = 16;

  for (const ai of armPositions) {
    const ax = drawX + ai * armSpacing;
    const candleY = baseY + 28 + (2 - Math.abs(ai)) * 3;

    ctx.beginPath();
    ctx.moveTo(drawX, baseY + 24);
    ctx.quadraticCurveTo(drawX + ai * armSpacing * 0.5, candleY + 3, ax, candleY);
    ctx.strokeStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b}%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(ax, candleY, 4, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b + 2}%)`;
    ctx.fill();

    const candleH = 10 + (ai === 0 ? 4 : 0);
    ctx.fillStyle = 'hsla(40, 20%, 92%, 0.8)';
    ctx.fillRect(ax - 2, candleY - candleH, 4, candleH);

    if (Math.abs(ai) === 1) {
      ctx.fillStyle = 'hsla(40, 15%, 88%, 0.5)';
      ctx.beginPath();
      ctx.ellipse(ax + 1.5, candleY - candleH + 3, 1, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const flameY = candleY - candleH - 5;
    const flicker = Math.sin(ts * 0.005 + ai * 1.7) * 1.5;
    ctx.beginPath();
    ctx.ellipse(ax + flicker * 0.3, flameY, 3, 5, 0, 0, Math.PI * 2);
    const flameGrad = ctx.createRadialGradient(ax, flameY + 2, 0, ax, flameY, 5);
    flameGrad.addColorStop(0.0, 'rgba(255,210,80,0.85)');
    flameGrad.addColorStop(0.5, 'rgba(255,170,40,0.5)');
    flameGrad.addColorStop(1.0, 'rgba(255,140,20,0)');
    ctx.fillStyle = flameGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(ax + flicker * 0.15, flameY + 1, 1.5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,200,0.7)';
    ctx.fill();
  }

  ctx.restore();
}
