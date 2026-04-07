'use strict';

// ── Easing functions ──────────────────────────────────────────────────────
export function easeInOut(t) {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

// ── Quadratic Bézier ──────────────────────────────────────────────────────
/** p0, p1 (control), p2 are {x, y} objects */
export function bezier2(t, p0, p1, p2) {
  const u  = 1 - t;
  const x  = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
  const y  = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
  return { x, y };
}

// ── Animation state ───────────────────────────────────────────────────────
/**
 * ANIM holds all transient animation data.
 *
 * arc:       current ball-arc animation  {from, to, startTime, ball, srcX, srcY, dstX, dstY}
 * bounceMap: Map of tubeIdx → bounce state {startTime}
 * particles: particle array (managed by particles.js)
 * busy:      true while any animation is running
 */
export const ANIM = {
  arc:       null,
  bounceMap: new Map(),
  particles: [],
  busy:      false,
};

export function resetAnim() {
  ANIM.arc       = null;
  ANIM.bounceMap = new Map();
  ANIM.particles = [];
  ANIM.busy      = false;
}
