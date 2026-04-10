'use strict';

import { CW, CH, TUBE_TOP, TUBE_BOT } from './constants.js';

// ══════════════════════════════════════════════════════════════════════════
//  SCENE BACKGROUND — Wall, Floor, Surface, Lighting, Atmosphere
//
//  Visual layers (back to front):
//    1. Wall       — warm vertical gradient, upper 73%
//    2. Floor      — darker warm surface, lower 27%
//    3. Baseboard  — thin accent line at wall/floor junction
//    4. Table      — lighter oval surface beneath the puzzle
//    5. Spotlight   — warm directional light from upper-left
//    6. Vignette   — cinematic edge darkening
//    7. Lamp glow  — warm pool at bottom (cozy table lamp)
//    8. Dust motes — floating atmospheric particles
// ══════════════════════════════════════════════════════════════════════════

// ── Dust mote constants ───────────────────────────────────────────────────
const MOTE_COUNT   = 14;
const GOLDEN_ANGLE = 2.39996322972865;

const MOTES = Array.from({ length: MOTE_COUNT }, (_, i) => ({
  phase:  i * GOLDEN_ANGLE,
  rx:     0.08 + (i * GOLDEN_ANGLE * 0.14) % 0.84,
  ry:     0.06 + (i * GOLDEN_ANGLE * 0.11) % 0.88,
  size:   0.7 + (i % 5) * 0.6,
  speed:  0.00020 + (i % 7) * 0.00005,
}));

// ── Geometry constants ───────────────────────────────────────────────────
export const FLOOR_Y      = CH * 0.73;          // wall/floor boundary
export const TABLE_CX     = CW * 0.5;           // table centre X
export const TABLE_CY     = (TUBE_BOT + CH) / 2 + 8; // table centre Y (below tubes)
export const TABLE_RX     = CW * 0.48;          // table ellipse semi-width
export const TABLE_RY     = CH * 0.10;          // table ellipse semi-height

// ── Interpolation helpers ─────────────────────────────────────────────────
export function lerpHSL(h0, s0, b0, h1, s1, b1, t) {
  let dh = ((h1 - h0 + 540) % 360) - 180;
  return {
    h: (h0 + dh * t + 360) % 360,
    s: s0 + (s1 - s0) * t,
    b: b0 + (b1 - b0) * t,
  };
}

export function themeCenter(theme, ts) {
  const angle = ts * 0.00015;
  const base  = theme.hues[0];
  const drift = Math.sin(angle) * theme.hueDelta * 0.5;
  return { h: base + drift, s: theme.sat, b: theme.bri };
}

// ══════════════════════════════════════════════════════════════════════════

export function drawBackground(ctx, ts, theme, prevTheme, fade) {

  // ── 0. Compute blended theme colour ────────────────────────────────────
  const cur  = themeCenter(theme, ts);
  const prev = themeCenter(prevTheme, ts);
  const { h, s, b } = lerpHSL(prev.h, prev.s, prev.b, cur.h, cur.s, cur.b, fade);

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 1 — WALL (upper portion)
  // ══════════════════════════════════════════════════════════════════════
  const wallGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  wallGrad.addColorStop(0.00, `hsl(${h}, ${Math.max(s + 6, 18)}%, ${Math.max(b - 22, 38)}%)`);
  wallGrad.addColorStop(0.35, `hsl(${(h + 6) % 360}, ${Math.max(s + 4, 16)}%, ${Math.max(b - 10, 50)}%)`);
  wallGrad.addColorStop(1.00, `hsl(${(h + 12) % 360}, ${Math.min(s + 8, 50)}%, ${b}%)`);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, CW, FLOOR_Y);

  // Wall texture — visible horizontal stripes (paint strokes)
  ctx.save();
  ctx.globalAlpha = 0.09;
  for (let y = 12; y < FLOOR_Y; y += 24) {
    ctx.fillStyle = y % 48 === 0
      ? 'rgba(255,240,220,1)'
      : 'rgba(60,30,10,1)';
    ctx.fillRect(0, y, CW, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 2 — FLOOR (lower portion)
  // ══════════════════════════════════════════════════════════════════════
  const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, CH);
  const floorH = (h + 18) % 360;
  floorGrad.addColorStop(0.00, `hsl(${floorH}, ${Math.max(s - 2, 10)}%, ${Math.max(b - 28, 28)}%)`);
  floorGrad.addColorStop(0.40, `hsl(${floorH}, ${Math.max(s - 4, 8)}%, ${Math.max(b - 36, 20)}%)`);
  floorGrad.addColorStop(1.00, `hsl(${floorH}, ${Math.max(s - 6, 6)}%, ${Math.max(b - 42, 14)}%)`);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, FLOOR_Y, CW, CH - FLOOR_Y);

  // Floor grain — visible perspective lines converging toward center
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.strokeStyle = 'rgba(180,140,100,1)';
  ctx.lineWidth = 1;
  const vanishX = CW * 0.5;
  for (let i = 0; i < 8; i++) {
    const startX = (i / 7) * CW;
    ctx.beginPath();
    ctx.moveTo(startX, CH);
    ctx.lineTo(vanishX + (startX - vanishX) * 0.3, FLOOR_Y);
    ctx.stroke();
  }
  // Horizontal floor bands
  for (let y = FLOOR_Y + 18; y < CH; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CW, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 3 — BASEBOARD (wall/floor junction)
  // ══════════════════════════════════════════════════════════════════════
  // Dark line — strong separation
  ctx.fillStyle = `hsla(${floorH}, ${Math.max(s + 5, 14)}%, ${Math.max(b - 40, 12)}%, 0.7)`;
  ctx.fillRect(0, FLOOR_Y - 1, CW, 4);
  // Highlight above
  ctx.fillStyle = `hsla(${h}, ${Math.min(s + 10, 45)}%, ${Math.min(b + 10, 98)}%, 0.22)`;
  ctx.fillRect(0, FLOOR_Y - 4, CW, 3);

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 4 — TABLE SURFACE (oval beneath puzzle)
  // ══════════════════════════════════════════════════════════════════════

  // Table shadow (underneath)
  ctx.save();
  const tShadow = ctx.createRadialGradient(TABLE_CX, TABLE_CY + 6, 0, TABLE_CX, TABLE_CY + 6, TABLE_RX * 1.1);
  tShadow.addColorStop(0, 'rgba(20,10,5,0.30)');
  tShadow.addColorStop(0.6, 'rgba(20,10,5,0.12)');
  tShadow.addColorStop(1, 'rgba(20,10,5,0)');
  ctx.fillStyle = tShadow;
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY + 6, TABLE_RX * 1.1, TABLE_RY * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Table top — warm bright oval (clearly visible surface)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, 0, Math.PI * 2);
  const tableGrad = ctx.createRadialGradient(
    TABLE_CX - TABLE_RX * 0.2, TABLE_CY - TABLE_RY * 0.3, 0,
    TABLE_CX, TABLE_CY, TABLE_RX
  );
  tableGrad.addColorStop(0.0, `hsla(${(h + 8) % 360}, ${Math.min(s + 18, 55)}%, ${Math.min(b + 10, 96)}%, 0.50)`);
  tableGrad.addColorStop(0.5, `hsla(${(h + 5) % 360}, ${Math.min(s + 12, 48)}%, ${Math.min(b + 5, 92)}%, 0.35)`);
  tableGrad.addColorStop(1.0, `hsla(${h}, ${Math.min(s + 6, 40)}%, ${Math.max(b - 5, 60)}%, 0.20)`);
  ctx.fillStyle = tableGrad;
  ctx.fill();

  // Table edge highlight (top rim) — visible edge
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.strokeStyle = `hsla(${h}, ${Math.min(s + 15, 50)}%, ${Math.min(b + 15, 98)}%, 0.28)`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Table bottom edge — subtle dark outline for depth
  ctx.beginPath();
  ctx.ellipse(TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, 0, 0.05, Math.PI * 0.95);
  ctx.strokeStyle = `hsla(${floorH}, ${Math.min(s + 8, 40)}%, ${Math.max(b - 25, 30)}%, 0.25)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 5 — SPOTLIGHT (warm directional from upper-left)
  // ══════════════════════════════════════════════════════════════════════
  const spotX = CW * 0.30 + Math.sin(ts * 0.00006) * 8;
  const spotY = -20;
  const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, CH * 0.75);
  spotGrad.addColorStop(0.0, `hsla(${(h + 10) % 360}, ${Math.min(s + 20, 55)}%, ${Math.min(b + 12, 98)}%, 0.20)`);
  spotGrad.addColorStop(0.3, `hsla(${(h + 5) % 360}, ${Math.min(s + 12, 45)}%, ${Math.min(b + 6, 95)}%, 0.10)`);
  spotGrad.addColorStop(1.0, 'rgba(255,240,220,0)');
  ctx.fillStyle = spotGrad;
  ctx.fillRect(0, 0, CW, CH);

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 6 — VIGNETTE (cinematic edge darkening)
  // ══════════════════════════════════════════════════════════════════════
  const vig = ctx.createRadialGradient(CW / 2, CH * 0.42, CH * 0.18, CW / 2, CH * 0.42, CH * 0.82);
  vig.addColorStop(0.0, 'rgba(30,15,5,0)');
  vig.addColorStop(0.55, 'rgba(30,15,5,0.10)');
  vig.addColorStop(1.0, 'rgba(20,10,3,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 7 — LAMP GLOW (warm pool at bottom)
  // ══════════════════════════════════════════════════════════════════════
  const lampX = CW * 0.5 + Math.sin(ts * 0.00008) * 12;
  const lampGlow = ctx.createRadialGradient(lampX, CH + 5, 0, lampX, CH + 5, CH * 0.50);
  lampGlow.addColorStop(0.0, 'rgba(235,170,90,0.22)');
  lampGlow.addColorStop(0.4, 'rgba(212,140,70,0.12)');
  lampGlow.addColorStop(1.0, 'rgba(212,135,63,0)');
  ctx.fillStyle = lampGlow;
  ctx.fillRect(0, 0, CW, CH);

  // ══════════════════════════════════════════════════════════════════════
  //  LAYER 8 — FLOATING DUST MOTES
  // ══════════════════════════════════════════════════════════════════════
  ctx.save();
  for (const m of MOTES) {
    const t   = ts * m.speed + m.phase;
    const mx  = m.rx * CW + Math.cos(t) * 18;
    const my  = m.ry * CH + Math.sin(t * 1.31 + 0.7) * 14;
    const alpha = 0.28 + 0.32 * Math.abs(Math.sin(t * 0.47));

    ctx.beginPath();
    ctx.arc(mx, my, m.size * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,225,180,${alpha.toFixed(3)})`;
    ctx.fill();
  }
  ctx.restore();
}
