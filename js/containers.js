'use strict';

import { TUBE_W, TUBE_H, TUBE_TOP } from './constants.js';

// ── Private helpers ───────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Rounded rect with per-corner radii [tl, tr, br, bl]
function roundRectCorners(ctx, x, y, w, h, tl, tr, br, bl) {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

/**
 * getBorderColor(state) — returns a warm CSS colour string based on state.
 */
export function getBorderColor(state) {
  if (state.flashing)  return 'rgba(200,80,60,0.80)';
  if (state.hintSrc)   return 'rgba(255,180,0,1.0)';
  if (state.hintDst)   return 'rgba(40,200,80,1.0)';
  if (state.selected)  return 'rgba(255,200,100,0.90)';
  if (state.solved)    return 'rgba(130,200,130,0.70)';
  return 'rgba(180,150,100,0.45)';
}

/** Apply shadow/glow settings derived from state */
function applyStateGlow(ctx, state, ts) {
  if (state.tapFlash) {
    ctx.shadowColor = 'rgba(255,215,0,0.3)';
    ctx.shadowBlur = 12;
    return;
  }
  if (state.flashing) {
    ctx.shadowColor = 'rgba(200,80,60,0.50)';
    ctx.shadowBlur  = 28;
  } else if (state.hintSrc) {
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.006);
    ctx.shadowColor = `rgba(255,180,0,${0.7 + pulse * 0.3})`;
    ctx.shadowBlur  = 28 + 22 * pulse;
  } else if (state.hintDst) {
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.006);
    ctx.shadowColor = `rgba(40,200,80,${0.7 + pulse * 0.3})`;
    ctx.shadowBlur  = 28 + 22 * pulse;
  } else if (state.selected) {
    ctx.shadowColor = 'rgba(255,200,100,0.40)';
    ctx.shadowBlur  = 24;
  } else if (state.solved) {
    // Pulsing glow 12–24
    const pulse     = 0.5 + 0.5 * Math.sin(ts * 0.004);
    ctx.shadowColor = 'rgba(130,200,130,0.28)';
    ctx.shadowBlur  = 12 + 12 * pulse;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur  = 0;
  }
}

// ── Shared geometry ───────────────────────────────────────────────────────

function geom(cx) {
  const x = cx - TUBE_W / 2;
  const y = TUBE_TOP;
  return { x, y, w: TUBE_W, h: TUBE_H };
}

// ── Style renderers ───────────────────────────────────────────────────────

function drawInnerShadow(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  // Top inner shadow
  const topSh = ctx.createLinearGradient(x, y, x, y + 28);
  topSh.addColorStop(0, 'rgba(20,10,0,0.18)');
  topSh.addColorStop(1, 'rgba(20,10,0,0)');
  ctx.fillStyle = topSh;
  ctx.fillRect(x, y, w, 28);
  // Bottom inner shadow
  const botSh = ctx.createLinearGradient(x, y + h - 20, x, y + h);
  botSh.addColorStop(0, 'rgba(20,10,0,0)');
  botSh.addColorStop(1, 'rgba(20,10,0,0.12)');
  ctx.fillStyle = botSh;
  ctx.fillRect(x, y + h - 20, w, 20);
  // Left highlight edge
  const leftHl = ctx.createLinearGradient(x, y, x + 8, y);
  leftHl.addColorStop(0, 'rgba(255,240,220,0.08)');
  leftHl.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = leftHl;
  ctx.fillRect(x, y, 8, h);
  ctx.restore();
}

function drawCardboard(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Body fill — vertical gradient for depth
  roundRect(ctx, x, y, w, h, 6);
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, 'rgba(175,135,90,0.38)');
  bodyGrad.addColorStop(0.5, 'rgba(160,120,80,0.32)');
  bodyGrad.addColorStop(1, 'rgba(140,100,65,0.38)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Horizontal corrugation texture lines every 18 px
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 6);
  ctx.clip();
  ctx.strokeStyle = 'rgba(120,85,45,0.18)';
  ctx.lineWidth   = 1;
  for (let ly = y + 18; ly < y + h; ly += 18) {
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  ctx.restore();

  // Inner shadow for depth
  drawInnerShadow(ctx, x, y, w, h, 6);

  // Flap tabs at top — two small rectangles
  ctx.fillStyle   = 'rgba(145,105,65,0.45)';
  ctx.strokeStyle = border;
  ctx.lineWidth   = 1.5;
  // Left flap
  ctx.beginPath();
  ctx.rect(x + 2, y - 10, w / 2 - 4, 12);
  ctx.fill();
  ctx.stroke();
  // Right flap
  ctx.beginPath();
  ctx.rect(x + w / 2 + 2, y - 10, w / 2 - 4, 12);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawBasket(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Body fill — vertical gradient
  roundRect(ctx, x, y, w, h, 8);
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, 'rgba(195,155,105,0.34)');
  bodyGrad.addColorStop(0.5, 'rgba(180,140,90,0.28)');
  bodyGrad.addColorStop(1, 'rgba(160,120,75,0.34)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Woven grid texture — clip to body
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.strokeStyle = 'rgba(140,100,50,0.16)';
  ctx.lineWidth   = 1;
  // Horizontal
  for (let ly = y + 14; ly < y + h; ly += 14) {
    ctx.beginPath();
    ctx.moveTo(x, ly);
    ctx.lineTo(x + w, ly);
    ctx.stroke();
  }
  // Vertical
  for (let lx = x + 14; lx < x + w; lx += 14) {
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y + h);
    ctx.stroke();
  }
  ctx.restore();

  // Inner shadow for depth
  drawInnerShadow(ctx, x, y, w, h, 8);

  // Raised rim at top — thicker horizontal band
  ctx.fillStyle   = 'rgba(190,150,100,0.38)';
  ctx.strokeStyle = border;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.rect(x, y, w, 10);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawCattree(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);
  const postW  = 14;
  const postX  = cx - postW / 2;

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Vertical post below platform (bottom portion)
  const platformH = Math.round(h * 0.72);
  const postY     = y + platformH;
  const postGrad = ctx.createLinearGradient(postX, postY, postX + postW, postY);
  postGrad.addColorStop(0, 'rgba(155,125,85,0.45)');
  postGrad.addColorStop(0.5, 'rgba(140,110,70,0.35)');
  postGrad.addColorStop(1, 'rgba(125,95,55,0.45)');
  ctx.fillStyle   = postGrad;
  ctx.strokeStyle = border;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.rect(postX, postY, postW, h - platformH);
  ctx.fill();
  ctx.stroke();

  // Sisal texture on post — vertical lines
  ctx.save();
  ctx.beginPath();
  ctx.rect(postX, postY, postW, h - platformH);
  ctx.clip();
  ctx.strokeStyle = 'rgba(160,130,80,0.22)';
  ctx.lineWidth   = 1;
  for (let lx = postX + 3; lx < postX + postW; lx += 3) {
    ctx.beginPath();
    ctx.moveTo(lx, postY);
    ctx.lineTo(lx, postY + h);
    ctx.stroke();
  }
  ctx.restore();

  // Platform body — vertical gradient
  roundRect(ctx, x, y, w, platformH, 6);
  const platGrad = ctx.createLinearGradient(x, y, x, y + platformH);
  platGrad.addColorStop(0, 'rgba(155,195,175,0.30)');
  platGrad.addColorStop(0.5, 'rgba(140,180,160,0.22)');
  platGrad.addColorStop(1, 'rgba(125,165,145,0.30)');
  ctx.fillStyle = platGrad;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Vertical sisal texture on platform
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, platformH, 6);
  ctx.clip();
  ctx.strokeStyle = 'rgba(100,140,110,0.15)';
  ctx.lineWidth   = 1;
  for (let lx = x + 8; lx < x + w; lx += 8) {
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y + platformH);
    ctx.stroke();
  }
  ctx.restore();

  // Inner shadow for depth
  drawInnerShadow(ctx, x, y, w, platformH, 6);

  ctx.restore();
}

function drawCatbed(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Cushion body — very rounded top corners, vertical gradient
  ctx.beginPath();
  roundRectCorners(ctx, x, y, w, h, 16, 16, 20, 20);
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, 'rgba(215,175,185,0.32)');
  bodyGrad.addColorStop(0.5, 'rgba(200,160,170,0.25)');
  bodyGrad.addColorStop(1, 'rgba(185,145,155,0.32)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Subtle circular quilt patterns (clipped)
  ctx.save();
  ctx.beginPath();
  roundRectCorners(ctx, x, y, w, h, 16, 16, 20, 20);
  ctx.clip();
  ctx.strokeStyle = 'rgba(170,120,130,0.12)';
  ctx.lineWidth   = 1;
  const circCenters = [
    { ox: 0,       oy: 0.25 },
    { ox: -0.20,   oy: 0.55 },
    { ox:  0.20,   oy: 0.55 },
    { ox:  0,      oy: 0.80 },
  ];
  for (const c of circCenters) {
    ctx.beginPath();
    ctx.arc(cx + c.ox * w, y + c.oy * h, w * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Inner shadow for depth (match body's rounded corners)
  ctx.save();
  ctx.beginPath();
  roundRectCorners(ctx, x, y, w, h, 16, 16, 20, 20);
  ctx.clip();
  const topSh = ctx.createLinearGradient(x, y, x, y + 28);
  topSh.addColorStop(0, 'rgba(20,10,0,0.18)');
  topSh.addColorStop(1, 'rgba(20,10,0,0)');
  ctx.fillStyle = topSh;
  ctx.fillRect(x, y, w, 28);
  const botSh = ctx.createLinearGradient(x, y + h - 20, x, y + h);
  botSh.addColorStop(0, 'rgba(20,10,0,0)');
  botSh.addColorStop(1, 'rgba(20,10,0,0.12)');
  ctx.fillStyle = botSh;
  ctx.fillRect(x, y + h - 20, w, 20);
  const leftHl = ctx.createLinearGradient(x, y, x + 8, y);
  leftHl.addColorStop(0, 'rgba(255,240,220,0.08)');
  leftHl.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = leftHl;
  ctx.fillRect(x, y, 8, h);
  ctx.restore();

  // Raised rim at top
  ctx.fillStyle   = 'rgba(210,170,180,0.38)';
  ctx.strokeStyle = border;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  roundRectCorners(ctx, x, y, w, 12, 16, 16, 4, 4);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawGolden(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Gold gradient fill (top → bottom) — richer gradient
  const goldGrad = ctx.createLinearGradient(x, y, x, y + h);
  goldGrad.addColorStop(0,   'rgba(255,225,120,0.24)');
  goldGrad.addColorStop(0.3, 'rgba(255,215,100,0.20)');
  goldGrad.addColorStop(0.7, 'rgba(255,200,70,0.24)');
  goldGrad.addColorStop(1,   'rgba(240,185,40,0.30)');

  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = goldGrad;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Diamond (argyle) pattern — clipped
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 8);
  ctx.clip();
  ctx.strokeStyle = 'rgba(200,165,30,0.18)';
  ctx.lineWidth   = 1;
  const dStep = 16;
  for (let dy = y - w; dy < y + h + w; dy += dStep) {
    ctx.beginPath();
    ctx.moveTo(x,     dy);
    ctx.lineTo(x + w, dy + w);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w, dy);
    ctx.lineTo(x,     dy + w);
    ctx.stroke();
  }
  ctx.restore();

  // Inner shadow for depth
  drawInnerShadow(ctx, x, y, w, h, 8);

  // Ornate rim — double border at top
  ctx.strokeStyle = 'rgba(255,220,80,0.55)';
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.moveTo(x + 6,     y + 2);
  ctx.lineTo(x + w - 6, y + 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,140,0.35)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 6,     y + 7);
  ctx.lineTo(x + w - 6, y + 7);
  ctx.stroke();

  ctx.restore();
}

/** Draw gold rim at tube opening */
function drawGoldRim(ctx, cx) {
  const x = cx - TUBE_W / 2;
  const rimGrad = ctx.createLinearGradient(x, TUBE_TOP, x + TUBE_W, TUBE_TOP);
  rimGrad.addColorStop(0, 'rgba(255,215,0,0)');
  rimGrad.addColorStop(0.3, 'rgba(255,215,0,0.25)');
  rimGrad.addColorStop(0.5, 'rgba(255,215,0,0.35)');
  rimGrad.addColorStop(0.7, 'rgba(255,215,0,0.25)');
  rimGrad.addColorStop(1, 'rgba(255,215,0,0)');

  ctx.save();
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, TUBE_TOP);
  ctx.lineTo(x + TUBE_W - 6, TUBE_TOP);
  ctx.stroke();
  ctx.restore();
}

/** Solved tube gold glow (pulsing) */
function drawSolvedGlow(ctx, cx, ts) {
  const x = cx - TUBE_W / 2;
  const pulse = 0.15 + 0.10 * Math.sin(ts * 0.002);
  ctx.save();
  ctx.shadowColor = `rgba(255,215,0,${pulse})`;
  ctx.shadowBlur = 18;
  roundRect(ctx, x - 2, TUBE_TOP - 2, TUBE_W + 4, TUBE_H + 4, 10);
  ctx.strokeStyle = `rgba(255,215,0,${pulse * 0.6})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Main export ───────────────────────────────────────────────────────────
/**
 * drawContainer(ctx, cx, style, state, ts)
 *   cx    — centre X of container
 *   style — 'cardboard' | 'basket' | 'cattree' | 'catbed' | 'golden'
 *   state — { selected, solved, flashing, hintSrc, hintDst }
 *   ts    — timestamp in ms (for pulsing animations)
 */
export function drawContainer(ctx, cx, style, state, ts) {
  // Ground contact shadow — anchors the tube to the surface
  ctx.save();
  const shCX = cx + 2;
  const shCY = TUBE_TOP + TUBE_H + 4;
  const shGrad = ctx.createRadialGradient(shCX, shCY, 0, shCX, shCY, TUBE_W * 0.52);
  shGrad.addColorStop(0, 'rgba(20,10,5,0.25)');
  shGrad.addColorStop(0.6, 'rgba(20,10,5,0.08)');
  shGrad.addColorStop(1, 'rgba(20,10,5,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(shCX, shCY, TUBE_W * 0.52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (state.solved) drawSolvedGlow(ctx, cx, ts);

  switch (style) {
    case 'cardboard': drawCardboard(ctx, cx, state, ts); break;
    case 'basket':    drawBasket   (ctx, cx, state, ts); break;
    case 'cattree':   drawCattree  (ctx, cx, state, ts); break;
    case 'catbed':    drawCatbed   (ctx, cx, state, ts); break;
    case 'golden':    drawGolden   (ctx, cx, state, ts); break;
    default:          drawCardboard(ctx, cx, state, ts); break;
  }

  drawGoldRim(ctx, cx);
}
