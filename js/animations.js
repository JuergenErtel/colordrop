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

export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

export function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
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
 * arc:        current ball-arc animation  {from, to, startTime, ball, srcX, srcY, dstX, dstY}
 * bounceMap:  Map of tubeIdx → bounce state {startTime}
 * particles:  particle array (managed by particles.js)
 * busy:       true while any animation is running
 * tubeWobble: Map of tubeIdx → wobble state
 * jiggleMap:  Map of tubeIdx → jiggle state
 * impactRing: impact ring animation state
 * tubeIntro:  tube intro animation state
 * ripple:     ripple animation state
 * tubeShake:  Map of tubeIdx → shake state
 * screenShake: screen shake state
 * goldFlash:  gold flash animation state
 * canvasDim:  canvas dim level (0–1)
 */
export const ANIM = {
  arc:        null,
  bounceMap:  new Map(),
  particles:  [],
  busy:       false,
  tubeWobble: new Map(),
  jiggleMap:  new Map(),
  impactRing: null,
  tubeIntro:  null,
  ripple:     null,
  tubeShake:  new Map(),
  screenShake: null,
  goldFlash:  null,
  canvasDim:  0,
  tubeClear:  new Map(), // tubeIdx → { startTime, duration, color }
  iceThaw:    new Map(),
};

export function resetAnim() {
  ANIM.arc        = null;
  ANIM.bounceMap  = new Map();
  ANIM.particles  = [];
  ANIM.busy       = false;
  ANIM.tubeWobble = new Map();
  ANIM.jiggleMap  = new Map();
  ANIM.impactRing = null;
  ANIM.tubeIntro  = null;
  ANIM.ripple     = null;
  ANIM.tubeShake  = new Map();
  ANIM.screenShake = null;
  ANIM.goldFlash  = null;
  ANIM.canvasDim  = 0;
  ANIM.tubeClear  = new Map();
  ANIM.iceThaw    = new Map();
}
