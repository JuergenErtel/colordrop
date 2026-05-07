'use strict';

import { CW, CH } from '../constants.js';
import { FLOOR_Y, TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, lerpHSL, themeCenter } from './_shared.js';

// ══════════════════════════════════════════════════════════════════════════
//  CAFÉ — Default cozy living-room scene
//
//  Layer order (back → front):
//    1.  Wall gradient        — warm vertical, theme-driven
//    2.  Wallpaper pattern    — vertical stripes + dot motif (NEW)
//    3.  Floor gradient       — darker warm surface
//    4.  Wood planks          — horizontal floorboards w/ grain (NEW)
//    5.  Baseboard            — wall/floor accent line
//    6.  Table                — oval surface beneath the puzzle
//    7.  Cup + saucer         — small porcelain mug, left of tubes (NEW)
//    8.  Steam                — 3 wavy bezier strands above cup (NEW, anim)
//    9.  Spotlight            — warm directional light from upper-left
//    10. Vignette             — cinematic edge darkening
//    11. Lamp glow            — warm pool at bottom
//    12. Dust motes           — floating atmospheric particles
// ══════════════════════════════════════════════════════════════════════════

const GOLDEN_ANGLE = 2.39996322972865;

// ── Dust motes (Layer 12) ─────────────────────────────────────────────────
const MOTE_COUNT = 14;
const MOTES = Array.from({ length: MOTE_COUNT }, (_, i) => ({
  phase:  i * GOLDEN_ANGLE,
  rx:     0.08 + (i * GOLDEN_ANGLE * 0.14) % 0.84,
  ry:     0.06 + (i * GOLDEN_ANGLE * 0.11) % 0.88,
  size:   0.7 + (i % 5) * 0.6,
  speed:  0.00020 + (i % 7) * 0.00005,
}));

// ── Wallpaper dots (Layer 2) — golden-angle scatter, pre-baked ────────────
const WALLPAPER_DOTS = Array.from({ length: 36 }, (_, i) => ({
  x: ((i * GOLDEN_ANGLE * 53.7) % 1) * CW,
  y: ((i * GOLDEN_ANGLE * 41.3) % 1) * FLOOR_Y,
  r: 1 + (i % 3) * 0.4,
}));

// ── Wood-plank grain ticks (Layer 4) — pre-baked, distributed across planks
const PLANK_COUNT = 7;
const PLANK_H     = (CH - FLOOR_Y) / PLANK_COUNT;
const PLANK_GRAIN = Array.from({ length: 22 }, (_, i) => ({
  plankIdx: i % PLANK_COUNT,
  yFrac:    0.25 + ((i * GOLDEN_ANGLE * 0.31) % 0.5),
  xStart:   ((i * GOLDEN_ANGLE * 0.47) % 1) * CW,
  width:    CW * (0.10 + (i % 4) * 0.08),
}));

// ── Cup geometry (Layer 7) ────────────────────────────────────────────────
const CUP_X       = CW * 0.10;
const CUP_Y       = TABLE_CY - TABLE_RY * 0.4;
const CUP_R       = 11;
const SAUCER_RX   = CUP_R * 1.85;
const SAUCER_RY   = CUP_R * 0.5;
const COFFEE_TOP  = CUP_Y - CUP_R * 1.35;

// ══════════════════════════════════════════════════════════════════════════

export function draw(ctx, ts, theme, prevTheme, fade) {
  const cur  = themeCenter(theme, ts);
  const prev = themeCenter(prevTheme, ts);
  const { h, s, b } = lerpHSL(prev.h, prev.s, prev.b, cur.h, cur.s, cur.b, fade);
  const floorH = (h + 18) % 360;

  drawWall(ctx, h, s, b);
  drawWallpaper(ctx, h, s, b);
  drawFloor(ctx, floorH, s, b);
  drawWoodPlanks(ctx, floorH, s, b);
  drawBaseboard(ctx, h, s, b, floorH);
  drawTable(ctx, h, s, b, floorH);
  drawCup(ctx);
  drawSteam(ctx, ts);
  drawSpotlight(ctx, ts, h, s, b);
  drawVignette(ctx);
  drawLampGlow(ctx, ts);
  drawMotes(ctx, ts);
}

// ── Layer 1: Wall ─────────────────────────────────────────────────────────
function drawWall(ctx, h, s, b) {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0.00, `hsl(${h}, ${Math.max(s + 6, 18)}%, ${Math.max(b - 22, 38)}%)`);
  g.addColorStop(0.35, `hsl(${(h + 6) % 360}, ${Math.max(s + 4, 16)}%, ${Math.max(b - 10, 50)}%)`);
  g.addColorStop(1.00, `hsl(${(h + 12) % 360}, ${Math.min(s + 8, 50)}%, ${b}%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, FLOOR_Y);
}

// ── Layer 2: Wallpaper pattern ────────────────────────────────────────────
function drawWallpaper(ctx, h, s, b) {
  ctx.save();

  // Vertical stripes — soft, evenly spaced
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = `hsl(${h}, ${Math.max(s + 4, 16)}%, ${Math.max(b - 32, 26)}%)`;
  ctx.lineWidth = 1;
  for (let x = 12; x < CW; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();
  }

  // Dot motif — small darker accents scattered between stripes
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = `hsl(${h}, ${Math.max(s + 8, 20)}%, ${Math.max(b - 38, 22)}%)`;
  for (const d of WALLPAPER_DOTS) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── Layer 3: Floor base ───────────────────────────────────────────────────
function drawFloor(ctx, floorH, s, b) {
  const g = ctx.createLinearGradient(0, FLOOR_Y, 0, CH);
  g.addColorStop(0.00, `hsl(${floorH}, ${Math.max(s - 2, 10)}%, ${Math.max(b - 28, 28)}%)`);
  g.addColorStop(0.40, `hsl(${floorH}, ${Math.max(s - 4, 8)}%, ${Math.max(b - 36, 20)}%)`);
  g.addColorStop(1.00, `hsl(${floorH}, ${Math.max(s - 6, 6)}%, ${Math.max(b - 42, 14)}%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, FLOOR_Y, CW, CH - FLOOR_Y);
}

// ── Layer 4: Wood planks ──────────────────────────────────────────────────
function drawWoodPlanks(ctx, floorH, s, b) {
  ctx.save();

  // Plank seams — horizontal dark lines at boundaries
  ctx.strokeStyle = `hsla(${floorH}, ${Math.max(s + 6, 14)}%, ${Math.max(b - 48, 10)}%, 0.55)`;
  ctx.lineWidth = 1;
  for (let i = 1; i < PLANK_COUNT; i++) {
    const py = FLOOR_Y + i * PLANK_H;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(CW, py);
    ctx.stroke();
  }

  // Subtle highlight just below each seam (catches light, suggests bevel)
  ctx.strokeStyle = `hsla(${floorH}, ${Math.min(s + 12, 40)}%, ${Math.min(b + 8, 80)}%, 0.10)`;
  for (let i = 1; i < PLANK_COUNT; i++) {
    const py = FLOOR_Y + i * PLANK_H + 1;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(CW, py);
    ctx.stroke();
  }

  // Grain ticks — short horizontal strokes scattered across planks
  ctx.strokeStyle = `hsla(${floorH}, ${Math.max(s, 8)}%, ${Math.max(b - 32, 20)}%, 0.22)`;
  ctx.lineWidth = 0.6;
  for (const g of PLANK_GRAIN) {
    const py = FLOOR_Y + (g.plankIdx + g.yFrac) * PLANK_H;
    ctx.beginPath();
    ctx.moveTo(g.xStart, py);
    ctx.lineTo(Math.min(g.xStart + g.width, CW), py);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Layer 5: Baseboard ────────────────────────────────────────────────────
function drawBaseboard(ctx, h, s, b, floorH) {
  ctx.fillStyle = `hsla(${floorH}, ${Math.max(s + 5, 14)}%, ${Math.max(b - 40, 12)}%, 0.7)`;
  ctx.fillRect(0, FLOOR_Y - 1, CW, 4);
  ctx.fillStyle = `hsla(${h}, ${Math.min(s + 10, 45)}%, ${Math.min(b + 10, 98)}%, 0.22)`;
  ctx.fillRect(0, FLOOR_Y - 4, CW, 3);
}

// ── Layer 6: Table ────────────────────────────────────────────────────────
function drawTable(ctx, h, s, b, floorH) {
  // Shadow under table
  ctx.save();
  const tShadow = ctx.createRadialGradient(TABLE_CX, TABLE_CY + 6, 0, TABLE_CX, TABLE_CY + 6, TABLE_RX * 1.1);
  tShadow.addColorStop(0,   'rgba(20,10,5,0.30)');
  tShadow.addColorStop(0.6, 'rgba(20,10,5,0.12)');
  tShadow.addColorStop(1,   'rgba(20,10,5,0)');
  ctx.fillStyle = tShadow;
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY + 6, TABLE_RX * 1.1, TABLE_RY * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Table top (warm bright oval)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(
    TABLE_CX - TABLE_RX * 0.2, TABLE_CY - TABLE_RY * 0.3, 0,
    TABLE_CX, TABLE_CY, TABLE_RX
  );
  g.addColorStop(0.0, `hsla(${(h + 8) % 360}, ${Math.min(s + 18, 55)}%, ${Math.min(b + 10, 96)}%, 0.50)`);
  g.addColorStop(0.5, `hsla(${(h + 5) % 360}, ${Math.min(s + 12, 48)}%, ${Math.min(b + 5, 92)}%, 0.35)`);
  g.addColorStop(1.0, `hsla(${h}, ${Math.min(s + 6, 40)}%, ${Math.max(b - 5, 60)}%, 0.20)`);
  ctx.fillStyle = g;
  ctx.fill();

  // Top rim highlight
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.strokeStyle = `hsla(${h}, ${Math.min(s + 15, 50)}%, ${Math.min(b + 15, 98)}%, 0.28)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bottom rim shadow
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, 0.05, Math.PI * 0.95);
  ctx.strokeStyle = `hsla(${floorH}, ${Math.min(s + 8, 40)}%, ${Math.max(b - 25, 30)}%, 0.25)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// ── Layer 7: Cup + saucer (theme-neutral porcelain) ───────────────────────
function drawCup(ctx) {
  ctx.save();

  // Saucer shadow
  ctx.fillStyle = 'rgba(50,30,15,0.22)';
  ctx.beginPath();
  ctx.ellipse(CUP_X + 1, CUP_Y + CUP_R * 0.55, SAUCER_RX * 1.05, SAUCER_RY * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Saucer
  const saucerGrad = ctx.createRadialGradient(
    CUP_X - SAUCER_RX * 0.3, CUP_Y + CUP_R * 0.35, 0,
    CUP_X, CUP_Y + CUP_R * 0.45, SAUCER_RX
  );
  saucerGrad.addColorStop(0, '#fbf5e8');
  saucerGrad.addColorStop(1, '#d8c8a8');
  ctx.fillStyle = saucerGrad;
  ctx.beginPath();
  ctx.ellipse(CUP_X, CUP_Y + CUP_R * 0.45, SAUCER_RX, SAUCER_RY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,55,0.40)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Cup handle (drawn first, peeks out from right side)
  ctx.strokeStyle = '#e8dec0';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(CUP_X + CUP_R * 0.95, CUP_Y - CUP_R * 0.55, CUP_R * 0.55, -Math.PI * 0.45, Math.PI * 0.45, false);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,90,55,0.30)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Cup body (rounded U)
  const cupGrad = ctx.createLinearGradient(CUP_X - CUP_R, CUP_Y - CUP_R, CUP_X + CUP_R, CUP_Y);
  cupGrad.addColorStop(0, '#fffbf0');
  cupGrad.addColorStop(0.6, '#f3e9d0');
  cupGrad.addColorStop(1, '#d6c5a0');
  ctx.fillStyle = cupGrad;
  ctx.beginPath();
  ctx.moveTo(CUP_X - CUP_R, CUP_Y - CUP_R * 1.35);
  ctx.lineTo(CUP_X - CUP_R * 0.92, CUP_Y);
  ctx.quadraticCurveTo(CUP_X, CUP_Y + CUP_R * 0.45, CUP_X + CUP_R * 0.92, CUP_Y);
  ctx.lineTo(CUP_X + CUP_R, CUP_Y - CUP_R * 1.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,55,0.40)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Coffee surface (dark ellipse on top)
  ctx.fillStyle = '#3a2410';
  ctx.beginPath();
  ctx.ellipse(CUP_X, COFFEE_TOP, CUP_R * 0.95, CUP_R * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Crema highlight
  ctx.fillStyle = 'rgba(180,130,80,0.45)';
  ctx.beginPath();
  ctx.ellipse(CUP_X - CUP_R * 0.3, COFFEE_TOP - 1, CUP_R * 0.5, CUP_R * 0.10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Layer 8: Steam (animated) ─────────────────────────────────────────────
function drawSteam(ctx, ts) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;

  for (let i = 0; i < 3; i++) {
    const baseX  = CUP_X - 6 + i * 6;
    const phase  = ts * 0.0011 + i * 1.7;
    const phaseB = ts * 0.0008 + i * 0.9;
    const wobble = Math.sin(phase) * 5;
    const drift  = Math.sin(phaseB) * 2;
    const alpha  = 0.18 + 0.10 * Math.sin(ts * 0.0015 + i * 0.7);

    ctx.strokeStyle = `rgba(245,235,220,${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(baseX, COFFEE_TOP - 2);
    ctx.bezierCurveTo(
      baseX + wobble,        COFFEE_TOP - 18,
      baseX - wobble + drift, COFFEE_TOP - 36,
      baseX + wobble * 0.4,   COFFEE_TOP - 52
    );
    ctx.stroke();
  }

  ctx.restore();
}

// ── Layer 9: Spotlight ────────────────────────────────────────────────────
function drawSpotlight(ctx, ts, h, s, b) {
  const spotX = CW * 0.30 + Math.sin(ts * 0.00006) * 8;
  const spotY = -20;
  const g = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, CH * 0.75);
  g.addColorStop(0.0, `hsla(${(h + 10) % 360}, ${Math.min(s + 20, 55)}%, ${Math.min(b + 12, 98)}%, 0.20)`);
  g.addColorStop(0.3, `hsla(${(h + 5) % 360}, ${Math.min(s + 12, 45)}%, ${Math.min(b + 6, 95)}%, 0.10)`);
  g.addColorStop(1.0, 'rgba(255,240,220,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 10: Vignette ────────────────────────────────────────────────────
function drawVignette(ctx) {
  const g = ctx.createRadialGradient(CW / 2, CH * 0.42, CH * 0.18, CW / 2, CH * 0.42, CH * 0.82);
  g.addColorStop(0.0,  'rgba(30,15,5,0)');
  g.addColorStop(0.55, 'rgba(30,15,5,0.10)');
  g.addColorStop(1.0,  'rgba(20,10,3,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 11: Lamp glow ───────────────────────────────────────────────────
function drawLampGlow(ctx, ts) {
  const lampX = CW * 0.5 + Math.sin(ts * 0.00008) * 12;
  const g = ctx.createRadialGradient(lampX, CH + 5, 0, lampX, CH + 5, CH * 0.50);
  g.addColorStop(0.0, 'rgba(235,170,90,0.22)');
  g.addColorStop(0.4, 'rgba(212,140,70,0.12)');
  g.addColorStop(1.0, 'rgba(212,135,63,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 12: Dust motes ──────────────────────────────────────────────────
//   Toned down vs the pre-overhaul version: with wallpaper texture present,
//   bright motes compete visually. Smaller radius + ~half the alpha.
function drawMotes(ctx, ts) {
  ctx.save();
  for (const m of MOTES) {
    const t = ts * m.speed + m.phase;
    const mx = m.rx * CW + Math.cos(t) * 18;
    const my = m.ry * CH + Math.sin(t * 1.31 + 0.7) * 14;
    const alpha = 0.14 + 0.18 * Math.abs(Math.sin(t * 0.47));
    ctx.beginPath();
    ctx.arc(mx, my, m.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,225,180,${alpha.toFixed(3)})`;
    ctx.fill();
  }
  ctx.restore();
}
