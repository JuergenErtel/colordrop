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
  if (state.hintSrc)   return 'rgba(255,220,140,0.90)';
  if (state.hintDst)   return 'rgba(100,190,110,0.90)';
  if (state.selected)  return 'rgba(255,200,100,0.90)';
  if (state.solved)    return 'rgba(130,200,130,0.70)';
  return 'rgba(180,150,100,0.45)';
}

/** Apply shadow/glow settings derived from state */
function applyStateGlow(ctx, state, ts) {
  if (state.flashing) {
    ctx.shadowColor = 'rgba(200,80,60,0.50)';
    ctx.shadowBlur  = 28;
  } else if (state.hintSrc) {
    ctx.shadowColor = 'rgba(255,240,200,0.55)';
    ctx.shadowBlur  = 24;
  } else if (state.hintDst) {
    ctx.shadowColor = 'rgba(130,200,130,0.55)';
    ctx.shadowBlur  = 24;
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

function drawCardboard(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Body fill
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = 'rgba(160,120,80,0.35)';
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

  // Body fill
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = 'rgba(180,140,90,0.30)';
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
  ctx.fillStyle   = 'rgba(140,110,70,0.40)';
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

  // Platform body
  roundRect(ctx, x, y, w, platformH, 6);
  ctx.fillStyle = 'rgba(140,180,160,0.25)';
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

  ctx.restore();
}

function drawCatbed(ctx, cx, state, ts) {
  const { x, y, w, h } = geom(cx);
  const border = getBorderColor(state);

  ctx.save();
  applyStateGlow(ctx, state, ts);

  // Cushion body — very rounded top corners
  ctx.beginPath();
  roundRectCorners(ctx, x, y, w, h, 16, 16, 20, 20);
  ctx.fillStyle = 'rgba(200,160,170,0.28)';
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

  // Gold gradient fill (top → bottom)
  const goldGrad = ctx.createLinearGradient(x, y, x, y + h);
  goldGrad.addColorStop(0,   'rgba(255,215,100,0.20)');
  goldGrad.addColorStop(0.5, 'rgba(255,210,80,0.24)');
  goldGrad.addColorStop(1,   'rgba(255,200,50,0.28)');

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

// ── Main export ───────────────────────────────────────────────────────────
/**
 * drawContainer(ctx, cx, style, state, ts)
 *   cx    — centre X of container
 *   style — 'cardboard' | 'basket' | 'cattree' | 'catbed' | 'golden'
 *   state — { selected, solved, flashing, hintSrc, hintDst }
 *   ts    — timestamp in ms (for pulsing animations)
 */
export function drawContainer(ctx, cx, style, state, ts) {
  switch (style) {
    case 'cardboard': drawCardboard(ctx, cx, state, ts); break;
    case 'basket':    drawBasket   (ctx, cx, state, ts); break;
    case 'cattree':   drawCattree  (ctx, cx, state, ts); break;
    case 'catbed':    drawCatbed   (ctx, cx, state, ts); break;
    case 'golden':    drawGolden   (ctx, cx, state, ts); break;
    default:          drawCardboard(ctx, cx, state, ts); break;
  }
}
