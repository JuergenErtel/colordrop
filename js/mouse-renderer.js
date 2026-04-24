'use strict';

import { MOUSE, holePositions } from './mouse.js';

const PAW_DUR = 300;

// ── Draw a single hole (dark ellipse with 3D rim) ──────────────────────

function drawHole(ctx, x, y, w, h) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, w * 1.05, h * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hole body
  const grad = ctx.createRadialGradient(x, y, 0, x, y, w);
  grad.addColorStop(0, '#0a0604');
  grad.addColorStop(0.7, '#1a0e08');
  grad.addColorStop(1, '#3a2518');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rim highlight (top edge)
  ctx.strokeStyle = 'rgba(120,80,50,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
}

// ── Draw a mouse (procedural) ──────────────────────────────────────────

function drawMouse(ctx, x, y, size, type, progress) {
  // progress: 0=hidden below, 0.15=fully up, 0.85=start sinking, 1=gone
  const upY = y - size * 0.8; // visible position (above hole)
  const downY = y + size * 0.6; // hidden position (inside hole)
  let popY;
  if (progress < 0.15) {
    const t = progress / 0.15;
    popY = downY + (upY - downY) * t;
  } else if (progress > 0.85) {
    const t = (progress - 0.85) / 0.15;
    popY = upY + (downY - upY) * t;
  } else {
    popY = upY + Math.sin(progress * 12) * 2;
  }

  const s = type === 'fat' ? size * 1.25 : size;

  // Fur colors per type
  let fur, furLight, furDark;
  switch (type) {
    case 'fast':
      fur = '#9A9A9A'; furLight = '#C0C0C0'; furDark = '#6A6A6A';
      break;
    case 'fat':
      fur = '#B08060'; furLight = '#D0A888'; furDark = '#806040';
      break;
    case 'golden':
      fur = '#E8C840'; furLight = '#F8E080'; furDark = '#B89820';
      break;
    default:
      fur = '#B08868'; furLight = '#D0B098'; furDark = '#806848';
  }

  ctx.save();

  // No clip needed — hole rim drawn on top covers the bottom

  const mx = x, my = popY;

  // Golden glow
  if (type === 'golden') {
    ctx.shadowColor = 'rgba(255,200,0,0.6)';
    ctx.shadowBlur = 15;
  }

  // Body (oval)
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(mx, my + s * 0.3, s * 0.65, s * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = furLight;
  ctx.beginPath();
  ctx.ellipse(mx, my + s * 0.5, s * 0.35, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Head
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(mx, my - s * 0.15, s * 0.5, s * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  for (let side = -1; side <= 1; side += 2) {
    const ex = mx + side * s * 0.35;
    const ey = my - s * 0.5;
    // Outer ear
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Inner ear (pink)
    ctx.fillStyle = '#E8A0A0';
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  for (let side = -1; side <= 1; side += 2) {
    const ex = mx + side * s * 0.18;
    const ey = my - s * 0.2;
    // White
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(ex, ey, s * 0.1, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(ex, ey, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Glint
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(ex + s * 0.03, ey - s * 0.03, s * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose
  ctx.fillStyle = '#F0A0A0';
  ctx.beginPath();
  ctx.ellipse(mx, my + s * 0.02, s * 0.06, s * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = 'rgba(80,60,50,0.5)';
  ctx.lineWidth = 1;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(mx + side * s * 0.1, my + s * 0.05 + i * s * 0.04);
      ctx.lineTo(mx + side * s * 0.5, my + s * 0.02 + i * s * 0.07);
      ctx.stroke();
    }
  }

  // Fat mouse: cheeks
  if (type === 'fat') {
    ctx.fillStyle = 'rgba(230,180,160,0.4)';
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.arc(mx + side * s * 0.3, my + s * 0.05, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Golden mouse: sparkle particles
  if (type === 'golden') {
    const t = performance.now() * 0.003;
    ctx.fillStyle = 'rgba(255,230,100,0.7)';
    for (let i = 0; i < 5; i++) {
      const angle = t + i * 1.26;
      const dist = s * 0.4 + Math.sin(t * 2 + i) * s * 0.1;
      const px = mx + Math.cos(angle) * dist;
      const py = my - s * 0.1 + Math.sin(angle) * dist * 0.6;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ── Draw hedgehog ──────────────────────────────────────────────────────

function drawHedgehog(ctx, x, y, size, progress) {
  const upY = y - size * 0.8;
  const downY = y + size * 0.6;
  let popY;
  if (progress < 0.15) {
    const t = progress / 0.15;
    popY = downY + (upY - downY) * t;
  } else if (progress > 0.85) {
    const t = (progress - 0.85) / 0.15;
    popY = upY + (downY - upY) * t;
  } else {
    popY = upY + Math.sin(progress * 8) * 1.5;
  }

  ctx.save();
  // No clip needed — hole rim drawn on top covers the bottom

  const hx = x, hy = popY;

  // Spines (brown triangles around top half)
  ctx.fillStyle = '#8B6B4A';
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI + (i / 9) * Math.PI;
    const bx = hx + Math.cos(angle) * size * 0.55;
    const by = hy - size * 0.1 + Math.sin(angle) * size * 0.5;
    const tx = hx + Math.cos(angle) * size * 0.85;
    const ty = hy - size * 0.1 + Math.sin(angle) * size * 0.75;
    ctx.beginPath();
    ctx.moveTo(bx - 3, by);
    ctx.lineTo(tx, ty);
    ctx.lineTo(bx + 3, by);
    ctx.closePath();
    ctx.fill();
  }

  // Body
  ctx.fillStyle = '#C4A878';
  ctx.beginPath();
  ctx.ellipse(hx, hy + size * 0.1, size * 0.5, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Face (lighter)
  ctx.fillStyle = '#E8D8C0';
  ctx.beginPath();
  ctx.ellipse(hx, hy + size * 0.05, size * 0.3, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  for (let side = -1; side <= 1; side += 2) {
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(hx + side * size * 0.12, hy - size * 0.05, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nose
  ctx.fillStyle = '#3A3A3A';
  ctx.beginPath();
  ctx.arc(hx, hy + size * 0.12, size * 0.045, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Draw cat paw (catch animation) ─────────────────────────────────────

function drawPaw(ctx, x, y, size, progress) {
  // progress 0→1: paw swipes down
  const py = y - size * 1.5 + size * 2 * Math.min(progress * 3, 1);
  const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Paw pad
  ctx.fillStyle = '#D08840';
  ctx.beginPath();
  ctx.ellipse(x, py, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pads
  ctx.fillStyle = '#E8B0A0';
  ctx.beginPath();
  ctx.arc(x, py + size * 0.05, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(x + i * size * 0.18, py - size * 0.12, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Main render function ───────────────────────────────────────────────

export function renderMouseGame(ctx, ts, cw, ch) {
  if (!MOUSE.active) return;

  const positions = holePositions(cw, ch);
  const holeW = cw * 0.1;
  const holeH = holeW * 0.5;
  const mouseSize = holeW * 0.7;

  // Pass 1: Draw all holes (bottom layer)
  for (let i = 0; i < 9; i++) {
    drawHole(ctx, positions[i].x, positions[i].y, holeW, holeH);
  }

  // Pass 2: Draw creatures popping up from holes (on top of holes)
  for (let i = 0; i < 9; i++) {
    const pos = positions[i];
    const h = MOUSE.holes[i];
    if (h) {
      const elapsed = ts - h.spawnTime;
      const progress = Math.min(elapsed / h.duration, 1);
      if (h.type === 'hedgehog') {
        drawHedgehog(ctx, pos.x, pos.y, mouseSize, progress);
      } else if (!h.caught) {
        drawMouse(ctx, pos.x, pos.y, mouseSize, h.type, progress);
      }
    }
  }

  // Pass 3: Redraw hole rims on top to cover mouse bottoms
  for (let i = 0; i < 9; i++) {
    const pos = positions[i];
    // Draw just the bottom half of the hole as a cover
    ctx.save();
    ctx.beginPath();
    ctx.rect(pos.x - holeW * 1.2, pos.y - holeH * 0.2, holeW * 2.4, holeH * 2);
    ctx.clip();
    drawHole(ctx, pos.x, pos.y, holeW, holeH);
    ctx.restore();
  }

  // Pass 4: Overlays per hole
  for (let i = 0; i < 9; i++) {
    const pos = positions[i];

    // Paw animation
    if (MOUSE.pawAnim && MOUSE.pawAnim.hole === i) {
      const pawElapsed = ts - MOUSE.pawAnim.startTime;
      if (pawElapsed < PAW_DUR) {
        drawPaw(ctx, pos.x, pos.y, mouseSize, pawElapsed / PAW_DUR);
      } else {
        MOUSE.pawAnim = null;
      }
    }

    // Trap flash
    if (MOUSE.trapFlash && MOUSE.trapFlash.hole === i) {
      const flashElapsed = ts - MOUSE.trapFlash.startTime;
      if (flashElapsed < 500) {
        const flashAlpha = 0.5 * (1 - flashElapsed / 500);
        ctx.fillStyle = `rgba(255,50,50,${flashAlpha})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, holeW * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // "-3s" text
        ctx.save();
        ctx.font = `bold ${mouseSize * 0.6}px 'Fredoka', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255,80,80,${1 - flashElapsed / 500})`;
        ctx.fillText('-3s', pos.x, pos.y - holeH * 2 - flashElapsed * 0.05);
        ctx.restore();
      } else {
        MOUSE.trapFlash = null;
      }
    }
  }

  // HUD: caught counter (large, centered above grid)
  ctx.save();
  ctx.textAlign = 'center';
  const done = MOUSE.caught >= MOUSE.target;

  // Background pill
  const hudX = cw / 2, hudY = ch * 0.22;
  const pillW = 90, pillH = 32;
  ctx.fillStyle = 'rgba(30,18,10,0.6)';
  ctx.beginPath();
  ctx.roundRect(hudX - pillW, hudY - pillH + 4, pillW * 2, pillH * 2, pillH);
  ctx.fill();

  // Mouse emoji + count
  ctx.font = `bold 28px 'Fredoka', sans-serif`;
  ctx.fillStyle = done ? '#4CAF50' : '#FFF';
  ctx.fillText(`🐭  ${MOUSE.caught} / ${MOUSE.target}`, hudX, hudY + 10);
  ctx.restore();
}

// ── Hit test: which hole was tapped? ───────────────────────────────────

export function mouseHitTest(lx, ly, cw, ch) {
  const positions = holePositions(cw, ch);
  const mouseSize = cw * 0.1 * 0.7;
  // Hitbox must stay inside the row half-spacing (~33 px), else a tap on a
  // row-1/2 mouse also matches the empty row-0 hole and the iteration-first
  // rule makes the tap a no-op.
  const hitW = cw * 0.1 * 1.15;
  const hitH = mouseSize * 1.0;
  const hitCenterOffset = mouseSize * 0.65; // mouse silhouette midline
  for (let i = 0; i < 9; i++) {
    const dx = (lx - positions[i].x) / hitW;
    const dy = (ly - (positions[i].y - hitCenterOffset)) / hitH;
    if (dx * dx + dy * dy < 1) return i;
  }
  return -1;
}
