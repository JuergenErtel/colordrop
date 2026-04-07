'use strict';

import { CW, CH } from './constants.js';

// ── Dust mote constants ───────────────────────────────────────────────────
const MOTE_COUNT   = 8;
const GOLDEN_ANGLE = 2.39996322972865; // radians

// Pre-compute stable per-mote phase offsets using golden angle spread
const MOTES = Array.from({ length: MOTE_COUNT }, (_, i) => ({
  phase:  i * GOLDEN_ANGLE,
  rx:     0.28 + (i % 3) * 0.18,   // relative X anchor (0..1 of CW)
  ry:     0.15 + (i % 4) * 0.20,   // relative Y anchor (0..1 of CH)
  size:   1.2 + (i % 3) * 0.8,
  speed:  0.00028 + (i % 5) * 0.00008,
}));

// ── Interpolation helpers ─────────────────────────────────────────────────
function lerpHSL(h0, s0, b0, h1, s1, b1, t) {
  // Interpolate hue via shortest arc
  let dh = ((h1 - h0 + 540) % 360) - 180;
  return {
    h: (h0 + dh * t + 360) % 360,
    s: s0 + (s1 - s0) * t,
    b: b0 + (b1 - b0) * t,
  };
}

function themeCenter(theme, ts) {
  // Slow-moving oscillation within the theme's hue array
  const angle  = ts * 0.00015;
  const hCount = theme.hues.length;
  const base   = theme.hues[0];
  const drift  = Math.sin(angle) * theme.hueDelta * 0.5;
  return { h: base + drift, s: theme.sat, b: theme.bri };
}

// ── Main export ───────────────────────────────────────────────────────────
/**
 * drawBackground(ctx, ts, theme, prevTheme, fade)
 *   ts        — timestamp in ms
 *   theme     — current THEMES entry
 *   prevTheme — previous THEMES entry (may equal theme on first frame)
 *   fade      — 0..1, interpolation progress from prevTheme → theme
 */
export function drawBackground(ctx, ts, theme, prevTheme, fade) {
  // ── 1. Compute blended HSL centre ──────────────────────────────────────
  const cur  = themeCenter(theme, ts);
  const prev = themeCenter(prevTheme, ts);
  const { h, s, b } = lerpHSL(prev.h, prev.s, prev.b, cur.h, cur.s, cur.b, fade);

  // ── 2. Radial warm gradient ────────────────────────────────────────────
  const gx = CW * (0.45 + 0.10 * Math.sin(ts * 0.00010));
  const gy = CH * (0.40 + 0.08 * Math.cos(ts * 0.00013));
  const gr = Math.max(CW, CH) * 0.85;

  const grad = ctx.createRadialGradient(gx, gy, gr * 0.05, gx, gy, gr);
  grad.addColorStop(0.00, `hsl(${h},${s}%,${b}%)`);
  grad.addColorStop(0.55, `hsl(${(h + 8) % 360},${Math.max(s - 5, 8)}%,${Math.max(b - 8, 60)}%)`);
  grad.addColorStop(1.00, `hsl(${(h + 18) % 360},${Math.max(s - 10, 6)}%,${Math.max(b - 18, 48)}%)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);

  // ── 3. Soft warm vignette ──────────────────────────────────────────────
  const vig = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.25, CW / 2, CH / 2, CH * 0.78);
  vig.addColorStop(0, 'rgba(30,15,5,0)');
  vig.addColorStop(1, 'rgba(30,15,5,0.25)');

  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CW, CH);

  // ── 4. Floating dust motes ─────────────────────────────────────────────
  ctx.save();
  for (const m of MOTES) {
    const t   = ts * m.speed + m.phase;
    const mx  = m.rx * CW + Math.cos(t)              * 18;
    const my  = m.ry * CH + Math.sin(t * 1.31 + 0.7) * 14;

    // Soft twinkle via alpha modulation
    const alpha = 0.18 + 0.22 * Math.abs(Math.sin(t * 0.47));

    ctx.beginPath();
    ctx.arc(mx, my, m.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,240,210,${alpha.toFixed(3)})`;
    ctx.fill();
  }
  ctx.restore();
}
