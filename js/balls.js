'use strict';

import { BALL_R, PALETTE } from './constants.js';
import { drawMiniCatFace } from './cat-renderer.js';

// ── Main export ───────────────────────────────────────────────────────────
/**
 * drawBall(ctx, cx, cy, colorId, floating, ts)
 *   cx      — centre X
 *   cy      — centre Y
 *   colorId — key into PALETTE ('coral', 'lavender', …)
 *   floating — true → warm glow halo; false → soft drop shadow
 *   ts      — timestamp in ms (unused here, kept for API consistency)
 */
export function drawBall(ctx, cx, cy, colorId, floating, ts) {
  const pal = PALETTE[colorId] ?? PALETTE.coral;
  const R   = BALL_R;

  ctx.save();

  // ── Layer 1: Shadow or glow halo ────────────────────────────────────────
  if (floating) {
    // Warm glow halo behind ball
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur  = 22;
  } else {
    // Soft warm drop shadow (painted manually for control)
    ctx.save();
    const shGrad = ctx.createRadialGradient(cx + 2, cy + 5, 0, cx + 2, cy + 5, R * 0.95);
    shGrad.addColorStop(0, 'rgba(40,20,5,0.38)');
    shGrad.addColorStop(1, 'rgba(40,20,5,0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 5, R * 0.92, R * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Layer 1 (cont.): Yarn ball base — radial gradient ───────────────────
  const grad = ctx.createRadialGradient(
    cx - R * 0.30, cy - R * 0.32, R * 0.05,   // inner highlight offset
    cx + R * 0.05, cy + R * 0.06, R,
  );
  grad.addColorStop(0,    pal.bright);
  grad.addColorStop(0.45, pal.base);
  grad.addColorStop(0.85, pal.dark);
  grad.addColorStop(1,    pal.dark);

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Clear shadow so it doesn't bleed into texture layers
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  // ── Layer 1b: Inner shadow for roundness ────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const innerSh = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.4, cx, cy, R);
  innerSh.addColorStop(0, 'rgba(0,0,0,0)');
  innerSh.addColorStop(0.7, 'rgba(0,0,0,0)');
  innerSh.addColorStop(1, 'rgba(30,15,5,0.14)');
  ctx.fillStyle = innerSh;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Layer 2: Yarn texture — 8 curved lines (clipped) ────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Primary strands — warm bright
  ctx.strokeStyle = pal.bright;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const baseAngle = (i / 8) * Math.PI * 2 + 0.2;
    const x0 = cx + Math.cos(baseAngle)             * R;
    const y0 = cy + Math.sin(baseAngle)             * R;
    const x2 = cx + Math.cos(baseAngle + Math.PI)   * R;
    const y2 = cy + Math.sin(baseAngle + Math.PI)   * R;
    const cpAngle = baseAngle + Math.PI / 2;
    const cpDist  = R * (0.45 + (i % 4) * 0.12);
    const cpX     = cx + Math.cos(cpAngle) * cpDist;
    const cpY     = cy + Math.sin(cpAngle) * cpDist;

    // Alternate thickness and opacity for organic feel
    ctx.globalAlpha = i % 2 === 0 ? 0.18 : 0.10;
    ctx.lineWidth   = i % 3 === 0 ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cpX, cpY, x2, y2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Layer 3: Cat face ────────────────────────────────────────────────────
  drawMiniCatFace(ctx, cx, cy - R * 0.05, BALL_R);

  // ── Layer 4: Specular highlight — soft gradient ──────────────────────────
  const specGrad = ctx.createRadialGradient(
    cx - R * 0.28, cy - R * 0.30, 0,
    cx - R * 0.28, cy - R * 0.30, R * 0.32,
  );
  specGrad.addColorStop(0,   'rgba(255,255,255,0.55)');
  specGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  specGrad.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx - R * 0.28, cy - R * 0.30, R * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();

  // ── Layer 5: Rim light (bottom-right edge) ──────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  const rimGrad = ctx.createRadialGradient(
    cx + R * 0.5, cy + R * 0.5, R * 0.5,
    cx + R * 0.5, cy + R * 0.5, R * 1.1,
  );
  rimGrad.addColorStop(0, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(0.82, 'rgba(255,240,210,0.15)');
  rimGrad.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ── Farbformen mode: grey ball with symbol ────────────────────────────────
/**
 * drawBallSymbol(ctx, cx, cy, colorId, symbol, floating, ts)
 *   Renders a neutral grey ball with a prominent symbol character.
 *   Used in "Farbformen" mode where shape/symbol matters, not color.
 */
export function drawBallSymbol(ctx, cx, cy, colorId, symbol, floating, ts) {
  const R = BALL_R;

  ctx.save();

  // ── Layer 1: Shadow or glow halo ──────────────────────────────────────────
  if (floating) {
    ctx.shadowColor = 'rgba(200,200,200,0.45)';
    ctx.shadowBlur  = 22;
  } else {
    ctx.save();
    const shGrad = ctx.createRadialGradient(cx + 2, cy + 5, 0, cx + 2, cy + 5, R * 0.95);
    shGrad.addColorStop(0, 'rgba(40,20,5,0.38)');
    shGrad.addColorStop(1, 'rgba(40,20,5,0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 5, R * 0.92, R * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Layer 2: Base — neutral grey radial gradient ──────────────────────────
  const grad = ctx.createRadialGradient(
    cx - R * 0.30, cy - R * 0.32, R * 0.05,
    cx + R * 0.05, cy + R * 0.06, R,
  );
  grad.addColorStop(0,    '#C8C0B8');
  grad.addColorStop(0.45, '#A89888');
  grad.addColorStop(0.85, '#887868');
  grad.addColorStop(1,    '#887868');

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Clear shadow so it doesn't bleed into text layer
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  // ── Layer 3: Symbol — centered, bold, white ───────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.font         = `bold ${R * 1.1}px sans-serif`;
  ctx.fillStyle    = 'white';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, cx, cy);
  ctx.restore();

  // ── Layer 4: Specular highlight ───────────────────────────────────────────
  const specGrad = ctx.createRadialGradient(
    cx - R * 0.28, cy - R * 0.30, 0,
    cx - R * 0.28, cy - R * 0.30, R * 0.32,
  );
  specGrad.addColorStop(0,   'rgba(255,255,255,0.55)');
  specGrad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  specGrad.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx - R * 0.28, cy - R * 0.30, R * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = specGrad;
  ctx.fill();

  ctx.restore();
}

// ── Gedächtnis mode: dark hidden ball with "?" ────────────────────────────
/**
 * drawBallHidden(ctx, cx, cy, floating, ts)
 *   Renders a dark mysterious ball with a faint "?" mark.
 *   Used in "Gedächtnis" mode where the ball's identity is concealed.
 */
export function drawBallHidden(ctx, cx, cy, floating, ts) {
  const R = BALL_R;

  ctx.save();

  // ── Layer 1: Drop shadow (no glow — keeps it mysterious) ─────────────────
  ctx.save();
  const shGrad = ctx.createRadialGradient(cx + 2, cy + 5, 0, cx + 2, cy + 5, R * 0.95);
  shGrad.addColorStop(0, 'rgba(40,20,5,0.38)');
  shGrad.addColorStop(1, 'rgba(40,20,5,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + 5, R * 0.92, R * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Layer 2: Base — dark brown radial gradient ────────────────────────────
  const grad = ctx.createRadialGradient(
    cx - R * 0.30, cy - R * 0.32, R * 0.05,
    cx + R * 0.05, cy + R * 0.06, R,
  );
  grad.addColorStop(0,    '#5A4A3A');
  grad.addColorStop(0.45, '#4A3A2A');
  grad.addColorStop(0.85, '#3A2A1A');
  grad.addColorStop(1,    '#3A2A1A');

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Clear shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  // ── Layer 3: Question mark — faint, centered ──────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.font         = `bold ${R * 1.0}px sans-serif`;
  ctx.fillStyle    = 'rgba(255,255,255,0.35)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
  ctx.restore();

  // No specular highlight — keeps it mysterious

  ctx.restore();
}
