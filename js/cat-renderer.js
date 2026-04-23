'use strict';

import { CATS } from './cats.js';

// ── Mascot reaction state ───────────────────────────────────────────────
let _catIdleTimer = 0;
let _catIdleNext = 5000;
let _catIdleAnim = null;
let _catIdleStart = 0;
let _catShake = 0;
let _catWinJump = 0;

export function triggerCatShake() { _catShake = performance.now(); }
export function triggerCatWinJump() { _catWinJump = performance.now(); }

// ── Cat Parameter Definitions ───────────────────────────────────────────────
export const CAT_PARAMS = [
  { id: 'luna',     furColor: '#8B9DAF', furLight: '#B8C8D8', furDark: '#6B7D8F', eyeColor: '#4CAF50', earType: 'pointed', markings: 'none',   expression: 'proud' },
  { id: 'mochi',    furColor: '#E8D5C0', furLight: '#F5EDE3', furDark: '#C4A882', eyeColor: '#FFB347', earType: 'folded',  markings: 'none',   expression: 'happy' },
  { id: 'felix',    furColor: '#8B6914', furLight: '#C4A44A', furDark: '#5C4510', eyeColor: '#66BB6A', earType: 'pointed', markings: 'tabby',  expression: 'proud' },
  { id: 'nala',     furColor: '#F5E6D3', furLight: '#FFF8F0', furDark: '#6B4226', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'curious' },
  { id: 'kuro',     furColor: '#2C2C2C', furLight: '#4A4A4A', furDark: '#1A1A1A', eyeColor: '#FFD54F', earType: 'pointed', markings: 'none',   expression: 'proud' },
  { id: 'freya',    furColor: '#A0785A', furLight: '#D4B896', furDark: '#6B4D35', eyeColor: '#66BB6A', earType: 'pointed', markings: 'tabby',  expression: 'curious' },
  { id: 'sora',     furColor: '#FFFFFF', furLight: '#FFFFFF', furDark: '#E0D8D0', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'playful' },
  { id: 'mika',     furColor: '#7B8B9A', furLight: '#A8B8C8', furDark: '#5A6A7A', eyeColor: '#FFB347', earType: 'round',   markings: 'none',   expression: 'happy' },
  { id: 'zenith',   furColor: '#D4A050', furLight: '#E8C880', furDark: '#3A3020', eyeColor: '#66BB6A', earType: 'pointed', markings: 'spots',  expression: 'curious' },
  { id: 'cosmos',   furColor: '#F0E6DC', furLight: '#FFFFFF', furDark: '#8B7355', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'sleepy' },
  { id: 'whisker',  furColor: '#C4956A', furLight: '#E0C0A0', furDark: '#8B6B45', eyeColor: '#66BB6A', earType: 'pointed', markings: 'tabby',  expression: 'curious' },
  { id: 'pebble',   furColor: '#B0A090', furLight: '#D0C8C0', furDark: '#887868', eyeColor: '#66BB6A', earType: 'round',   markings: 'none',   expression: 'playful' },
  { id: 'simba',    furColor: '#D4A030', furLight: '#F0CC70', furDark: '#9A7020', eyeColor: '#FFB347', earType: 'pointed', markings: 'tabby',  expression: 'proud' },
  { id: 'ember',    furColor: '#C87830', furLight: '#E8A860', furDark: '#6B4010', eyeColor: '#FFD54F', earType: 'pointed', markings: 'spots',  expression: 'playful' },
  { id: 'starla',   furColor: '#FFFFFF', furLight: '#FFFFFF', furDark: '#D08040', eyeColor: '#FFB347', earType: 'pointed', markings: 'calico', expression: 'happy' },
  { id: 'tansy',    furColor: '#D0A878', furLight: '#E8D0B8', furDark: '#A08058', eyeColor: '#4CAF50', earType: 'round',   markings: 'tabby',  expression: 'happy' },
  { id: 'arrow',    furColor: '#E0D0B8', furLight: '#F0E8E0', furDark: '#6B5030', eyeColor: '#FFD54F', earType: 'pointed', markings: 'spots',  expression: 'curious' },
  { id: 'bolt',     furColor: '#E8E0D0', furLight: '#FFFFFF', furDark: '#C0B098', eyeColor: '#66BB6A', earType: 'pointed', markings: 'none',   expression: 'playful' },
  { id: 'rex',      furColor: '#B89878', furLight: '#D8C0A8', furDark: '#8A6848', eyeColor: '#FFB347', earType: 'round',   markings: 'none',   expression: 'proud' },
  { id: 'sunny',    furColor: '#D8A050', furLight: '#F0C888', furDark: '#A07030', eyeColor: '#66BB6A', earType: 'pointed', markings: 'tabby',  expression: 'happy' },
  { id: 'lucky',    furColor: '#FFFFFF', furLight: '#FFFFFF', furDark: '#2C2C2C', eyeColor: '#FFD54F', earType: 'round',   markings: 'calico', expression: 'happy' },
  { id: 'nova',     furColor: '#E8D0C0', furLight: '#F8E8E0', furDark: '#C8A898', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'curious' },
  { id: 'sage',     furColor: '#7A5840', furLight: '#A88868', furDark: '#5A3828', eyeColor: '#FFD54F', earType: 'round',   markings: 'none',   expression: 'sleepy' },
  { id: 'blaze',    furColor: '#C87040', furLight: '#E8A878', furDark: '#8A4820', eyeColor: '#66BB6A', earType: 'pointed', markings: 'tabby',  expression: 'playful' },
  { id: 'legend',   furColor: '#F0E0D0', furLight: '#FFFFFF', furDark: '#C8B8A8', eyeColor: '#E8A030', earType: 'round',   markings: 'none',   expression: 'proud' },
  { id: 'aurora',   furColor: '#F5E8DC', furLight: '#FFFFFF', furDark: '#6B4226', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'happy' },
  { id: 'prism',    furColor: '#F0E6DC', furLight: '#FFFFFF', furDark: '#8B6040', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'curious' },
  { id: 'imperial', furColor: '#8B7355', furLight: '#B8A080', furDark: '#4A3520', eyeColor: '#FFD54F', earType: 'pointed', markings: 'tabby',  expression: 'proud' },
  { id: 'galaxy',   furColor: '#6A6A6A', furLight: '#909090', furDark: '#3A3A3A', eyeColor: '#FFD54F', earType: 'pointed', markings: 'spots',  expression: 'curious' },
  { id: 'diamond',  furColor: '#FFFFFF', furLight: '#FFFFFF', furDark: '#E8E0D8', eyeColor: '#42A5F5', earType: 'pointed', markings: 'none',   expression: 'proud' },
  // ── Season 2026-05 Kirschblüte ─────────────────────────────────────────
  { id: 'mochi-sakura', furColor: '#FDEBF0', furLight: '#FFFFFF', furDark: '#E8B0C0', eyeColor: '#7EBDCB', earType: 'folded',  markings: 'spots',  expression: 'happy' },
  { id: 'sakura',       furColor: '#FFE4E9', furLight: '#FFFFFF', furDark: '#C87888', eyeColor: '#D4B891', earType: 'pointed', markings: 'calico', expression: 'playful' },
  { id: 'tsubaki',      furColor: '#FFFFFF', furLight: '#FFFFFF', furDark: '#C0392B', eyeColor: '#4DA6D1', earType: 'pointed', markings: 'calico', expression: 'curious' },
  { id: 'hoshi',        furColor: '#3A3F4B', furLight: '#5A5F6B', furDark: '#1F242F', eyeColor: '#FFD54F', earType: 'pointed', markings: 'spots',  expression: 'proud' },
];

// ── drawCatPortrait ─────────────────────────────────────────────────────────
export function drawCatPortrait(ctx, cx, cy, size, params) {
  const s = size;
  const { furColor, furLight, furDark, eyeColor, earType, markings, expression } = params;
  ctx.save();

  // 1 ── Head shape (wider-than-tall oval)
  ctx.fillStyle = furColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy, s, s * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2 ── Ears
  drawEars(ctx, cx, cy, s, furColor, furLight, earType);

  // 3 ── Fur markings
  drawMarkings(ctx, cx, cy, s, furDark, furLight, markings);

  // 4 ── Eyes
  drawEyes(ctx, cx, cy, s, eyeColor, expression);

  // 5 ── Nose + 6 ── Mouth + 7 ── Whiskers
  drawNoseMouthWhiskers(ctx, cx, cy, s);

  ctx.restore();
}

// ── Nose, Mouth, Whiskers (shared by portrait & mascot) ─────────────────────
function drawNoseMouthWhiskers(ctx, cx, cy, s) {
  // Nose — small pink inverted triangle
  const ny = cy + s * 0.15;
  ctx.fillStyle = '#E8A0A0';
  ctx.beginPath();
  ctx.moveTo(cx, ny - s * 0.06);
  ctx.lineTo(cx - s * 0.06, ny + s * 0.04);
  ctx.lineTo(cx + s * 0.06, ny + s * 0.04);
  ctx.closePath();
  ctx.fill();

  // Mouth — W-shape
  const my = ny + s * 0.06;
  ctx.strokeStyle = '#8B6050';
  ctx.lineWidth = s * 0.025;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.12, my + s * 0.04);
  ctx.quadraticCurveTo(cx - s * 0.05, my + s * 0.1, cx, my);
  ctx.quadraticCurveTo(cx + s * 0.05, my + s * 0.1, cx + s * 0.12, my + s * 0.04);
  ctx.stroke();

  // Whiskers — 3 per side, slightly curved
  ctx.strokeStyle = 'rgba(80,60,50,0.5)';
  ctx.lineWidth = s * 0.015;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = -1; i <= 1; i++) {
      const wx = cx + side * s * 0.2;
      const wy = ny + s * 0.05 + i * s * 0.06;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(cx + side * s * 0.55, wy + i * s * 0.04, cx + side * s * 0.7, wy + i * s * 0.1);
      ctx.stroke();
    }
  }
}

// ── Ears ────────────────────────────────────────────────────────────────────
function drawEars(ctx, cx, cy, s, furColor, furLight, earType) {
  for (let side = -1; side <= 1; side += 2) {
    const ex = cx + side * s * 0.6;
    const ey = cy - s * 0.65;
    // Outer ear
    ctx.fillStyle = furColor;
    ctx.beginPath();
    if (earType === 'pointed') {
      ctx.moveTo(ex - side * s * 0.05, cy - s * 0.4);
      ctx.lineTo(ex + side * s * 0.15, ey - s * 0.35);
      ctx.lineTo(ex + side * s * 0.35, cy - s * 0.35);
    } else if (earType === 'folded') {
      ctx.moveTo(ex - side * s * 0.05, cy - s * 0.4);
      ctx.lineTo(ex + side * s * 0.12, ey - s * 0.2);
      ctx.quadraticCurveTo(ex + side * s * 0.3, ey - s * 0.05, ex + side * s * 0.35, cy - s * 0.35);
    } else {
      ctx.moveTo(ex - side * s * 0.05, cy - s * 0.4);
      ctx.quadraticCurveTo(ex + side * s * 0.15, ey - s * 0.2, ex + side * s * 0.35, cy - s * 0.35);
    }
    ctx.closePath();
    ctx.fill();
    // Inner ear (pink tint)
    ctx.fillStyle = furLight;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    if (earType === 'pointed') {
      ctx.moveTo(ex + side * s * 0.02, cy - s * 0.42);
      ctx.lineTo(ex + side * s * 0.15, ey - s * 0.22);
      ctx.lineTo(ex + side * s * 0.28, cy - s * 0.38);
    } else if (earType === 'folded') {
      ctx.moveTo(ex + side * s * 0.02, cy - s * 0.42);
      ctx.lineTo(ex + side * s * 0.12, ey - s * 0.1);
      ctx.quadraticCurveTo(ex + side * s * 0.24, ey, ex + side * s * 0.28, cy - s * 0.38);
    } else {
      ctx.moveTo(ex + side * s * 0.02, cy - s * 0.42);
      ctx.quadraticCurveTo(ex + side * s * 0.12, ey - s * 0.1, ex + side * s * 0.28, cy - s * 0.38);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ── Markings ────────────────────────────────────────────────────────────────
function drawMarkings(ctx, cx, cy, s, furDark, furLight, markings) {
  if (markings === 'none') return;
  ctx.save();
  if (markings === 'tabby') {
    ctx.strokeStyle = furDark;
    ctx.lineWidth = s * 0.04;
    ctx.lineCap = 'round';
    // Forehead M-shape
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, cy - s * 0.35);
    ctx.lineTo(cx - s * 0.15, cy - s * 0.55);
    ctx.lineTo(cx, cy - s * 0.4);
    ctx.lineTo(cx + s * 0.15, cy - s * 0.55);
    ctx.lineTo(cx + s * 0.3, cy - s * 0.35);
    ctx.stroke();
    // Cheek stripes
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + side * s * 0.35, cy - s * 0.05 + i * s * 0.1);
        ctx.lineTo(cx + side * s * 0.65, cy + i * s * 0.1);
        ctx.stroke();
      }
    }
  } else if (markings === 'tuxedo') {
    ctx.fillStyle = furLight;
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.45, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (markings === 'calico') {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#D07030';
    ctx.beginPath(); ctx.arc(cx - s * 0.4, cy - s * 0.1, s * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = furDark;
    ctx.beginPath(); ctx.arc(cx + s * 0.35, cy + s * 0.15, s * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#D07030';
    ctx.beginPath(); ctx.arc(cx + s * 0.1, cy - s * 0.45, s * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (markings === 'spots') {
    ctx.fillStyle = furDark;
    ctx.globalAlpha = 0.45;
    for (const [sx, sy, sr] of [[-0.3,-0.2,0.07],[0.35,0.05,0.06],[-0.1,-0.45,0.055],[0.2,-0.35,0.05],[-0.4,0.15,0.05],[0.3,0.25,0.06],[0,0.3,0.04]]) {
      ctx.beginPath(); ctx.arc(cx + sx * s, cy + sy * s, sr * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ── Eyes ─────────────────────────────────────────────────────────────────────
function drawEyes(ctx, cx, cy, s, eyeColor, expression) {
  for (let side = -1; side <= 1; side += 2) {
    const ex = cx + side * s * 0.32, ey = cy - s * 0.1;
    const ew = s * 0.18, eh = s * 0.2;
    ctx.save();
    // Eye shape clip based on expression
    ctx.beginPath();
    if (expression === 'sleepy')          ctx.ellipse(ex, ey + eh * 0.15, ew, eh * 0.4, 0, 0, Math.PI * 2);
    else if (expression === 'happy')      ctx.ellipse(ex, ey + eh * 0.1, ew, eh * 0.55, 0, 0, Math.PI * 2);
    else if (expression === 'curious')    ctx.ellipse(ex, ey, ew * 1.1, eh * 1.1, 0, 0, Math.PI * 2);
    else if (expression === 'proud')      ctx.ellipse(ex, ey, ew, eh * 0.7, side * 0.1, 0, Math.PI * 2);
    else if (expression === 'playful' && side === 1) ctx.ellipse(ex, ey + eh * 0.1, ew, eh * 0.45, 0, 0, Math.PI * 2);
    else                                  ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2);
    ctx.clip();
    // Sclera
    ctx.fillStyle = '#FFF';
    ctx.fillRect(ex - ew * 1.2, ey - eh * 1.2, ew * 2.4, eh * 2.4);
    // Iris with radial gradient
    const ig = ctx.createRadialGradient(ex, ey, 0, ex, ey, ew * 0.85);
    ig.addColorStop(0, eyeColor); ig.addColorStop(0.7, eyeColor); ig.addColorStop(1, darkenHex(eyeColor, 40));
    ctx.fillStyle = ig;
    ctx.beginPath(); ctx.arc(ex, ey, ew * 0.8, 0, Math.PI * 2); ctx.fill();
    // Vertical slit pupil
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath(); ctx.ellipse(ex, ey, ew * 0.12, ew * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    // Reflection dot
    ctx.fillStyle = '#FFF'; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(ex + ew * 0.25, ey - eh * 0.25, ew * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // Eyelid outline
    ctx.strokeStyle = 'rgba(60,40,30,0.6)';
    ctx.lineWidth = s * 0.02;
    ctx.beginPath();
    if (expression === 'sleepy')     ctx.ellipse(ex, ey + eh * 0.15, ew * 1.05, eh * 0.45, 0, Math.PI, Math.PI * 2);
    else if (expression === 'happy') ctx.ellipse(ex, ey + eh * 0.1, ew * 1.05, eh * 0.6, 0, Math.PI, Math.PI * 2);
    else                             ctx.ellipse(ex, ey, ew * 1.05, eh * 1.05, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
}

// ── drawMiniCatFace ─────────────────────────────────────────────────────────
export function drawMiniCatFace(ctx, cx, cy, radius) {
  const r = radius;
  ctx.save();
  // Ear tips poking above the ball
  ctx.fillStyle = 'rgba(60,40,30,0.35)';
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(cx + side * r * 0.35, cy - r * 0.75);
    ctx.lineTo(cx + side * r * 0.6, cy - r * 1.05);
    ctx.lineTo(cx + side * r * 0.75, cy - r * 0.7);
    ctx.closePath(); ctx.fill();
  }
  // Eyes with slit pupils
  for (let side = -1; side <= 1; side += 2) {
    const ex = cx + side * r * 0.25, ey = cy - r * 0.15;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.13, r * 0.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(80,160,80,0.7)';
    ctx.beginPath(); ctx.arc(ex, ey, r * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(20,20,20,0.8)';
    ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.03, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(ex + r * 0.04, ey - r * 0.05, r * 0.025, 0, Math.PI * 2); ctx.fill();
  }
  // Tiny nose
  ctx.fillStyle = 'rgba(200,130,130,0.7)';
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.05); ctx.lineTo(cx - r * 0.05, cy + r * 0.12); ctx.lineTo(cx + r * 0.05, cy + r * 0.12);
  ctx.closePath(); ctx.fill();
  // Whiskers
  ctx.strokeStyle = 'rgba(60,40,30,0.35)';
  ctx.lineWidth = r * 0.015;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.12, cy + r * 0.1 + i * r * 0.05);
      ctx.lineTo(cx + side * r * 0.55, cy + r * 0.08 + i * r * 0.08);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── drawMascotCat ───────────────────────────────────────────────────────────
export function drawMascotCat(ctx, cx, cy, size, ts, params, lookAt) {
  const s = size;
  ctx.save();
  const fur  = params ? params.furColor : '#D08840';
  const furL = params ? params.furLight : '#E8B878';
  const furD = params ? params.furDark  : '#9A6020';
  const eyeCol = params ? params.eyeColor  : '#66BB6A';
  const earT   = params ? params.earType   : 'pointed';
  const mark   = params ? params.markings  : 'tabby';
  // Idle animation
  const tailPhase = Math.sin(ts / 800) * 0.3;
  const isBlinking = (ts % 4000) > 3800;
  const earTwitch = Math.sin(ts / 2500) * 0.03;

  // Head — reuse portrait components
  const hy = cy - s * 0.2, hs = s * 0.55;
  let headTilt = 0;
  if (lookAt) {
    const dx = lookAt.x - cx;
    const dy = lookAt.y - cy;
    headTilt = Math.atan2(dy, dx) * 0.15;
    headTilt = Math.max(-0.26, Math.min(0.26, headTilt));
  }

  // Idle animation cycle (8-12s)
  if (!lookAt && !_catIdleAnim) {
    if (ts - _catIdleTimer > _catIdleNext) {
      _catIdleTimer = ts;
      _catIdleNext = 5000 + Math.random() * 4000;
      _catIdleAnim = Math.random() > 0.5 ? 'yawn' : 'wash';
      _catIdleStart = ts;
    }
  }
  if (_catIdleAnim && ts - _catIdleStart > 2500) _catIdleAnim = null;

  // Yawn visual: open mouth wider (2.5s duration)
  let mouthOpen = 0;
  if (_catIdleAnim === 'yawn') {
    const yt = (ts - _catIdleStart) / 2500;
    mouthOpen = yt < 0.3 ? yt / 0.3 : yt < 0.6 ? 1 : (1 - yt) / 0.4;
  }
  // Wash visual: paw rises to face (2.5s duration)
  let washPaw = 0;
  if (_catIdleAnim === 'wash') {
    const wt = (ts - _catIdleStart) / 2500;
    washPaw = wt < 0.2 ? wt / 0.2 : wt < 0.75 ? 1 : (1 - wt) / 0.25;
  }

  // Win jump
  let jumpY = 0;
  if (_catWinJump && ts - _catWinJump < 600) {
    const jt = (ts - _catWinJump) / 600;
    jumpY = -10 * Math.sin(jt * Math.PI * 2) * (1 - jt);
  }

  // Headshake on invalid move
  let shakeAngle = 0;
  if (_catShake && ts - _catShake < 400) {
    const sht = (ts - _catShake) / 400;
    shakeAngle = 0.15 * Math.sin(sht * Math.PI * 4) * (1 - sht);
  }

  // Apply win jump offset
  if (jumpY !== 0) {
    ctx.translate(0, jumpY);
  }

  // Body (sitting upright)
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.35, s * 0.45, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = furL;
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.5, s * 0.25, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();

  // Tail curving around body
  ctx.strokeStyle = fur; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.35, cy + s * 0.7);
  ctx.quadraticCurveTo(cx + s * 0.7 + tailPhase * s * 0.3, cy + s * 0.4, cx + s * 0.55 + tailPhase * s * 0.4, cy + s * 0.1);
  ctx.stroke();
  ctx.strokeStyle = furD; ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.58 + tailPhase * s * 0.35, cy + s * 0.2);
  ctx.quadraticCurveTo(cx + s * 0.6 + tailPhase * s * 0.4, cy + s * 0.12, cx + s * 0.55 + tailPhase * s * 0.4, cy + s * 0.1);
  ctx.stroke();

  // Front paws
  ctx.fillStyle = fur;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath(); ctx.ellipse(cx + side * s * 0.2, cy + s * 0.82, s * 0.1, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  }

  const expr = isBlinking ? 'sleepy' : (params ? params.expression : 'happy');
  ctx.save(); ctx.translate(cx, hy); ctx.rotate(headTilt + shakeAngle); ctx.translate(-cx, -hy);
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(cx, hy, hs, hs * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  // Ears with twitch
  ctx.save();
  ctx.translate(cx, hy); ctx.rotate(earTwitch); ctx.translate(-cx, -hy);
  drawEars(ctx, cx, hy, hs, fur, furL, earT);
  ctx.restore();
  drawMarkings(ctx, cx, hy, hs, furD, furL, mark);
  drawEyes(ctx, cx, hy, hs, eyeCol, _catIdleAnim === 'yawn' ? 'sleepy' : expr);
  drawNoseMouthWhiskers(ctx, cx, hy, hs);

  // Yawn: draw open mouth over the existing one
  if (mouthOpen > 0.05) {
    const ny = hy + hs * 0.15;
    const my = ny + hs * 0.06;
    const openH = hs * 0.28 * mouthOpen;
    ctx.fillStyle = 'rgba(40,15,10,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, my + openH * 0.2, hs * 0.18 * mouthOpen, openH, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tongue
    ctx.fillStyle = 'rgba(230,130,130,0.8)';
    ctx.beginPath();
    ctx.ellipse(cx, my + openH * 0.5, hs * 0.12 * mouthOpen, openH * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wash: draw paw near face
  if (washPaw > 0.05) {
    const pawX = cx - hs * 0.4;
    const pawBaseY = cy + s * 0.82;
    const pawTargetY = hy + hs * 0.15;
    const pawY = pawBaseY + (pawTargetY - pawBaseY) * washPaw;
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(pawX, pawY, s * 0.13, s * 0.1, -0.4 * washPaw, 0, Math.PI * 2);
    ctx.fill();
    // Paw pads
    ctx.fillStyle = 'rgba(220,170,160,0.6)';
    ctx.beginPath();
    ctx.arc(pawX + s * 0.02, pawY + s * 0.03, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

// ── Utility ─────────────────────────────────────────────────────────────────
function darkenHex(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xFF) - amount);
  const b = Math.max(0, (n & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
