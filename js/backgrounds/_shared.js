'use strict';

import { CW, CH, TUBE_BOT } from '../constants.js';

// ── Geometry constants (shared across scenes & room-decor) ────────────────
export const FLOOR_Y  = CH * 0.73;
export const TABLE_CX = CW * 0.5;
export const TABLE_CY = (TUBE_BOT + CH) / 2 + 8;
export const TABLE_RX = CW * 0.48;
export const TABLE_RY = CH * 0.10;

// ── HSL interpolation (shortest hue arc) ──────────────────────────────────
export function lerpHSL(h0, s0, b0, h1, s1, b1, t) {
  let dh = ((h1 - h0 + 540) % 360) - 180;
  return {
    h: (h0 + dh * t + 360) % 360,
    s: s0 + (s1 - s0) * t,
    b: b0 + (b1 - b0) * t,
  };
}

// ── Theme centre with slow hue drift ──────────────────────────────────────
export function themeCenter(theme, ts) {
  const angle = ts * 0.00015;
  const base  = theme.hues[0];
  const drift = Math.sin(angle) * theme.hueDelta * 0.5;
  return { h: base + drift, s: theme.sat, b: theme.bri };
}
