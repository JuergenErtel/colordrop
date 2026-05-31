'use strict';

import { CW, CH } from '../constants.js';
import { FLOOR_Y, TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY } from './_shared.js';

// ══════════════════════════════════════════════════════════════════════════
//  WINTER — cozy snowy cabin
//
//  Rebuilt to share the Café base (wood planks, baseboard, table, vignette)
//  so décor (fireplace, window, plant…) sits correctly, plus winter mood:
//  cool window light, warm fire glow, frosted corners, falling snow.
//  No bespoke window — the décor window owns that slot (avoids the old clash).
//
//  Layer order (back → front):
//    1. Wall (warm log cabin, cool-tinted top)
//    2. Wall log seams
//    3. Floor gradient
//    4. Wood planks + grain
//    5. Baseboard
//    6. Table oval
//    7. Cool window-light wash (upper-right)
//    8. Warm fire glow (lower-left, anim flicker)
//    9. Vignette
//   10. Corner frost
//   11. Falling snow (anim, in front)
// ══════════════════════════════════════════════════════════════════════════

const GOLDEN_ANGLE = 2.39996322972865;

const PLANK_COUNT = 7;
const PLANK_H     = (CH - FLOOR_Y) / PLANK_COUNT;
const PLANK_GRAIN = Array.from({ length: 22 }, (_, i) => ({
  plankIdx: i % PLANK_COUNT,
  yFrac:    0.25 + ((i * GOLDEN_ANGLE * 0.31) % 0.5),
  xStart:   ((i * GOLDEN_ANGLE * 0.47) % 1) * CW,
  width:    CW * (0.10 + (i % 4) * 0.08),
}));

// Wall log seams (horizontal cabin logs) — pre-baked
const LOG_COUNT = 6;

// Snowflakes — sparse, soft, drift down in front
const SNOW_COUNT = 30;
const SNOW = Array.from({ length: SNOW_COUNT }, (_, i) => ({
  xFrac:  (i * GOLDEN_ANGLE * 37.1) % 1,
  yOff:   ((i * GOLDEN_ANGLE * 53.3) % 1) * CH,
  size:   0.8 + (i % 4) * 0.55,
  speed:  0.010 + (i % 5) * 0.006,
  sway:   5 + (i % 3) * 5,
  swaySpd: 0.0007 + (i % 4) * 0.0004,
  phase:  i * GOLDEN_ANGLE,
}));

export function draw(ctx, ts) {
  drawWall(ctx);
  drawFloor(ctx);
  drawPlanks(ctx);
  drawBaseboard(ctx);
  drawTable(ctx);
  drawWindowLight(ctx);
  drawFireGlow(ctx, ts);
  drawVignette(ctx);
  drawCornerFrost(ctx);
  drawSnow(ctx, ts);
}

// ── Layer 1+2: Wall (warm cabin wood, cool-tinted top) ────────────────────
function drawWall(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0.00, '#3c3340');   // cool, shadowed top
  g.addColorStop(0.30, '#574438');
  g.addColorStop(1.00, '#6e5038');   // warm wood near floor
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, FLOOR_Y);

  // Horizontal log seams + bevel highlight
  for (let i = 1; i < LOG_COUNT; i++) {
    const y = (FLOOR_Y / LOG_COUNT) * i;
    ctx.strokeStyle = 'rgba(30,20,14,0.30)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,225,190,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y + 1.5); ctx.lineTo(CW, y + 1.5); ctx.stroke();
  }
}

// ── Layer 3: Floor base ───────────────────────────────────────────────────
function drawFloor(ctx) {
  const g = ctx.createLinearGradient(0, FLOOR_Y, 0, CH);
  g.addColorStop(0.00, '#5a3c26');
  g.addColorStop(0.45, '#452c1b');
  g.addColorStop(1.00, '#321f12');
  ctx.fillStyle = g;
  ctx.fillRect(0, FLOOR_Y, CW, CH - FLOOR_Y);
}

// ── Layer 4: Wood planks ──────────────────────────────────────────────────
function drawPlanks(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20,12,6,0.55)';
  ctx.lineWidth = 1;
  for (let i = 1; i < PLANK_COUNT; i++) {
    const py = FLOOR_Y + i * PLANK_H;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(CW, py); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,225,180,0.08)';
  for (let i = 1; i < PLANK_COUNT; i++) {
    const py = FLOOR_Y + i * PLANK_H + 1;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(CW, py); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(30,18,10,0.22)';
  ctx.lineWidth = 0.6;
  for (const g of PLANK_GRAIN) {
    const py = FLOOR_Y + (g.plankIdx + g.yFrac) * PLANK_H;
    ctx.beginPath(); ctx.moveTo(g.xStart, py); ctx.lineTo(Math.min(g.xStart + g.width, CW), py); ctx.stroke();
  }
  ctx.restore();
}

// ── Layer 5: Baseboard ────────────────────────────────────────────────────
function drawBaseboard(ctx) {
  ctx.fillStyle = 'rgba(28,18,10,0.70)';
  ctx.fillRect(0, FLOOR_Y - 1, CW, 4);
  ctx.fillStyle = 'rgba(255,225,185,0.16)';
  ctx.fillRect(0, FLOOR_Y - 4, CW, 3);
}

// ── Layer 6: Table ────────────────────────────────────────────────────────
function drawTable(ctx) {
  ctx.save();
  const sh = ctx.createRadialGradient(TABLE_CX, TABLE_CY + 6, 0, TABLE_CX, TABLE_CY + 6, TABLE_RX * 1.1);
  sh.addColorStop(0, 'rgba(15,8,4,0.32)');
  sh.addColorStop(0.6, 'rgba(15,8,4,0.12)');
  sh.addColorStop(1, 'rgba(15,8,4,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY + 6, TABLE_RX * 1.1, TABLE_RY * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(
    TABLE_CX - TABLE_RX * 0.2, TABLE_CY - TABLE_RY * 0.3, 0,
    TABLE_CX, TABLE_CY, TABLE_RX
  );
  g.addColorStop(0.0, 'rgba(150,110,70,0.50)');
  g.addColorStop(0.5, 'rgba(120,86,54,0.34)');
  g.addColorStop(1.0, 'rgba(80,54,32,0.20)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.strokeStyle = 'rgba(255,235,200,0.24)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// ── Layer 7: Cool window light (upper-right diagonal wash) ─────────────────
function drawWindowLight(ctx) {
  const g = ctx.createRadialGradient(CW * 0.86, -30, 0, CW * 0.86, -30, CH * 0.85);
  g.addColorStop(0.0, 'rgba(180,210,240,0.18)');
  g.addColorStop(0.35, 'rgba(150,185,225,0.08)');
  g.addColorStop(1.0, 'rgba(150,185,225,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 8: Warm fire glow (lower-left, gentle flicker) ───────────────────
function drawFireGlow(ctx, ts) {
  const flicker = 0.85 + 0.15 * Math.sin(ts * 0.006) + 0.06 * Math.sin(ts * 0.013 + 1.3);
  const gx = CW * 0.16, gy = FLOOR_Y - 4;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, CH * 0.55);
  g.addColorStop(0.0, `rgba(255,150,60,${(0.22 * flicker).toFixed(3)})`);
  g.addColorStop(0.4, `rgba(235,120,50,${(0.10 * flicker).toFixed(3)})`);
  g.addColorStop(1.0, 'rgba(235,120,50,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 9: Vignette ─────────────────────────────────────────────────────
function drawVignette(ctx) {
  const g = ctx.createRadialGradient(CW / 2, CH * 0.42, CH * 0.18, CW / 2, CH * 0.42, CH * 0.82);
  g.addColorStop(0.0,  'rgba(15,12,20,0)');
  g.addColorStop(0.55, 'rgba(15,12,20,0.12)');
  g.addColorStop(1.0,  'rgba(10,8,16,0.48)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 10: Corner frost (cool white creeping in from corners) ──────────
function drawCornerFrost(ctx) {
  const corners = [
    [0, 0], [CW, 0], [0, CH * 0.5], [CW, CH * 0.5],
  ];
  for (const [cx, cy] of corners) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CW * 0.34);
    g.addColorStop(0.0, 'rgba(225,238,255,0.16)');
    g.addColorStop(1.0, 'rgba(225,238,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
  }
}

// ── Layer 11: Falling snow (animated, in front) ───────────────────────────
function drawSnow(ctx, ts) {
  ctx.save();
  for (const f of SNOW) {
    const y = (f.yOff + ts * f.speed) % (CH + 16) - 8;
    const x = f.xFrac * CW + Math.sin(ts * f.swaySpd + f.phase) * f.sway;
    const alpha = 0.45 + 0.30 * Math.abs(Math.sin(ts * 0.001 + f.phase));
    ctx.beginPath();
    ctx.arc(x, y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,250,255,${alpha.toFixed(3)})`;
    ctx.fill();
  }
  ctx.restore();
}
