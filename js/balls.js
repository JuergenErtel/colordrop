'use strict';

import { BALL_R, PALETTE } from './constants.js';

// ── Private: cat face ─────────────────────────────────────────────────────
/**
 * drawCatFace(ctx, cx, cy)
 *   Renders a subtle cat face centred at (cx, cy).
 *   Scale is derived from BALL_R * 0.35.
 */
function drawCatFace(ctx, cx, cy) {
  const sc = BALL_R * 0.35;   // ~9 px at default BALL_R = 26

  ctx.save();
  ctx.translate(cx, cy);

  // ── Ears (triangles) ────────────────────────────────────────────────────
  const earW  = sc * 0.90;
  const earH  = sc * 0.80;
  const earOX = sc * 0.62;   // horizontal offset from centre
  const earY  = -sc * 0.68;  // how high above centre

  // Outer ear fill — warm dark, very subtle
  ctx.fillStyle = 'rgba(80,50,40,0.14)';
  // Left ear
  ctx.beginPath();
  ctx.moveTo(-earOX,          earY);
  ctx.lineTo(-earOX - earW,   earY - earH);
  ctx.lineTo(-earOX + earW,   earY - earH);
  ctx.closePath();
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.moveTo( earOX,          earY);
  ctx.lineTo( earOX - earW,   earY - earH);
  ctx.lineTo( earOX + earW,   earY - earH);
  ctx.closePath();
  ctx.fill();

  // Inner ears — tiny pink triangles
  const isc = 0.52;
  ctx.fillStyle = 'rgba(220,140,150,0.18)';
  // Left inner
  ctx.beginPath();
  ctx.moveTo(-earOX,                    earY - earH * 0.10);
  ctx.lineTo(-earOX - earW * isc,       earY - earH * 0.88);
  ctx.lineTo(-earOX + earW * isc,       earY - earH * 0.88);
  ctx.closePath();
  ctx.fill();
  // Right inner
  ctx.beginPath();
  ctx.moveTo( earOX,                    earY - earH * 0.10);
  ctx.lineTo( earOX - earW * isc,       earY - earH * 0.88);
  ctx.lineTo( earOX + earW * isc,       earY - earH * 0.88);
  ctx.closePath();
  ctx.fill();

  // ── Dot eyes ────────────────────────────────────────────────────────────
  const eyeR  = sc * 0.22;
  const eyeOX = sc * 0.40;
  const eyeY  = -sc * 0.05;

  // Eye fill
  ctx.fillStyle = 'rgba(55,35,25,0.55)';
  ctx.beginPath();
  ctx.arc(-eyeOX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc( eyeOX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine — tiny offset white dot
  ctx.fillStyle = 'rgba(255,255,255,0.60)';
  const shineR = eyeR * 0.38;
  ctx.beginPath();
  ctx.arc(-eyeOX + eyeR * 0.35, eyeY - eyeR * 0.35, shineR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc( eyeOX + eyeR * 0.35, eyeY - eyeR * 0.35, shineR, 0, Math.PI * 2);
  ctx.fill();

  // ── Tiny nose (small rounded triangle) ──────────────────────────────────
  const noseW = sc * 0.22;
  const noseH = sc * 0.14;
  const noseY = eyeY + sc * 0.30;

  ctx.fillStyle = 'rgba(200,120,130,0.42)';
  ctx.beginPath();
  ctx.moveTo(0,       noseY - noseH);
  ctx.lineTo(-noseW,  noseY + noseH);
  ctx.lineTo( noseW,  noseY + noseH);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

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
  drawCatFace(ctx, cx, cy - R * 0.05);

  // ── Layer 4: Specular highlight ──────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx - R * 0.30, cy - R * 0.30, R * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  ctx.restore();
}
