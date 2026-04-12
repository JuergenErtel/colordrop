'use strict';

import { CW, TUBE_W, TUBE_TOP, TUBE_H, TUBE_BOT } from './constants.js';
import { DOG } from './dog.js';
import { tubeCX } from './render.js';
import { spawnParticle } from './particles.js';
import { easeInOut } from './animations.js';

function drawWarningPaws(ctx, ts, side) {
  const elapsed = ts - DOG.warning.startTime;
  const wave = Math.sin(elapsed * 0.008) * 3;
  const alpha = 0.6 + 0.3 * Math.sin(elapsed * 0.006);
  const x = side === 'left' ? -5 : CW + 5;
  const dir = side === 'left' ? 1 : -1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8B6914';
  for (let i = 0; i < 2; i++) {
    const py = TUBE_TOP + TUBE_H * 0.3 + i * 45 + wave;
    ctx.beginPath();
    ctx.ellipse(x + dir * 12, py, 14, 18, dir * 0.2, 0, Math.PI * 2);
    ctx.fill();
    for (let t = 0; t < 3; t++) {
      const angle = -0.6 + t * 0.6;
      ctx.beginPath();
      ctx.arc(x + dir * (22 + Math.cos(angle) * 6), py - 10 + Math.sin(angle) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawWarningHighlight(ctx, ts, tubeIdx, tubeCount) {
  const cx = tubeCX(tubeIdx, tubeCount);
  const elapsed = ts - DOG.warning.startTime;
  const pulse = 0.4 + 0.3 * Math.sin(elapsed * 0.008);

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 140, 0, ' + pulse + ')';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(255, 140, 0, 0.6)';
  ctx.shadowBlur = 12;
  const rx = cx - TUBE_W / 2 - 3, ry = TUBE_TOP - 3;
  const rw = TUBE_W + 6, rh = TUBE_H + 6, rr = 10;
  ctx.beginPath();
  ctx.moveTo(rx + rr, ry);
  ctx.lineTo(rx + rw - rr, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr);
  ctx.lineTo(rx + rw, ry + rh - rr);
  ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr);
  ctx.lineTo(rx + rr, ry + rh);
  ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr);
  ctx.lineTo(rx, ry + rr);
  ctx.arcTo(rx, ry, rx + rr, ry, rr);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawDogBody(ctx, x, y, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  // Body
  ctx.fillStyle = '#C08030';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // White belly
  ctx.fillStyle = '#F0E0C0';
  ctx.beginPath();
  ctx.ellipse(0, 6, 18, 12, 0, 0, Math.PI);
  ctx.fill();

  // Head
  ctx.fillStyle = '#C08030';
  ctx.beginPath();
  ctx.arc(24, -10, 18, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#D09040';
  ctx.beginPath();
  ctx.ellipse(38, -6, 10, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#402010';
  ctx.beginPath();
  ctx.arc(44, -8, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#402010';
  ctx.beginPath();
  ctx.arc(28, -16, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(29, -17, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#A06020';
  ctx.beginPath();
  ctx.ellipse(14, -22, 8, 14, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#C08030';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -5);
  ctx.quadraticCurveTo(-38, -20, -30, -30);
  ctx.stroke();

  // Legs
  ctx.fillStyle = '#C08030';
  for (const lx of [-14, -6, 10, 18]) {
    ctx.fillRect(lx - 3, 16, 6, 12);
  }
  ctx.fillStyle = '#D09040';
  for (const lx of [-14, -6, 10, 18]) {
    ctx.beginPath();
    ctx.ellipse(lx, 28, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawDogAttack(ctx, ts, tubeCount) {
  const atk = DOG.attacking;
  if (!atk) return;

  const elapsed = ts - atk.startTime;
  const totalDur = 1200;
  const t = Math.min(elapsed / totalDur, 1);

  const srcX = tubeCX(atk.sourceTube, tubeCount);
  const dstX = tubeCX(atk.destTube, tubeCount);
  const startX = DOG.side === 'left' ? -40 : CW + 40;
  const endX = DOG.side === 'left' ? CW + 40 : -40;
  const flip = DOG.side === 'right';
  const y = TUBE_BOT + 15;

  let dogX;
  if (t < 0.3) {
    dogX = startX + (srcX - startX) * easeInOut(t / 0.3);
  } else if (t < 0.5) {
    dogX = srcX;
  } else if (t < 0.8) {
    dogX = srcX + (dstX - srcX) * easeInOut((t - 0.5) / 0.3);
  } else {
    const p = easeInOut((t - 0.8) / 0.2);
    dogX = dstX + (endX - dstX) * p;
    if (Math.random() < 0.3) {
      spawnParticle(dogX, y + 20, (Math.random() - 0.5) * 2, -1 - Math.random() * 2,
        '#D0C0A0', 3 + Math.random() * 3, 300 + Math.random() * 200, 0.05);
    }
  }

  drawDogBody(ctx, dogX, y, flip);

  if (t > 0.85) {
    ctx.save();
    ctx.font = 'bold 14px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Hehe!', dogX, y - 40);
    ctx.restore();
  }
}

export function drawDog(ctx, ts, tubeCount) {
  if (!DOG.active) return;

  if (DOG.warning) {
    drawWarningPaws(ctx, ts, DOG.side);
    drawWarningHighlight(ctx, ts, DOG.warning.sourceTube, tubeCount);
  }

  if (DOG.attacking) {
    drawDogAttack(ctx, ts, tubeCount);
  }
}
