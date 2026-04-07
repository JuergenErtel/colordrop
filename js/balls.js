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
    ctx.shadowBlur  = 18;
  } else {
    // Soft warm drop shadow (painted manually for control)
    ctx.save();
    ctx.fillStyle = 'rgba(60,30,10,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy + 4, R * 0.85, R * 0.40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Layer 1 (cont.): Yarn ball base — radial gradient ───────────────────
  const grad = ctx.createRadialGradient(
    cx - R * 0.28, cy - R * 0.28, R * 0.08,   // inner highlight offset
    cx,            cy,            R,
  );
  grad.addColorStop(0,    pal.bright);
  grad.addColorStop(0.55, pal.base);
  grad.addColorStop(1,    pal.dark);

  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Clear shadow so it doesn't bleed into texture layers
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  // ── Layer 2: Yarn texture — 6 curved lines (clipped) ────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = pal.bright;
  ctx.globalAlpha = 0.15;
  ctx.lineWidth   = 2;

  // 6 quadratic bezier strands distributed around the ball
  for (let i = 0; i < 6; i++) {
    const baseAngle = (i / 6) * Math.PI * 2;
    const x0 = cx + Math.cos(baseAngle)             * R;
    const y0 = cy + Math.sin(baseAngle)             * R;
    const x2 = cx + Math.cos(baseAngle + Math.PI)   * R;
    const y2 = cy + Math.sin(baseAngle + Math.PI)   * R;
    // Control point offset perpendicular to the strand
    const cpAngle = baseAngle + Math.PI / 2;
    const cpDist  = R * (0.5 + (i % 3) * 0.15);
    const cpX     = cx + Math.cos(cpAngle) * cpDist;
    const cpY     = cy + Math.sin(cpAngle) * cpDist;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cpX, cpY, x2, y2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Layer 3: Cat face ────────────────────────────────────────────────────
  drawMiniCatFace(ctx, cx, cy - R * 0.05, BALL_R);

  // ── Layer 4: Specular highlight ──────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx - R * 0.30, cy - R * 0.30, R * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  ctx.restore();
}
