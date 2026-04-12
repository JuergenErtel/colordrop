'use strict';

import { CW, TUBE_W, TUBE_TOP, TUBE_H, TUBE_BOT, BALL_R, PALETTE } from './constants.js';
import { DOG } from './dog.js';
import { tubeCX, ballCY } from './render.js';
import { spawnParticle } from './particles.js';
import { easeInOut } from './animations.js';

// ── Warning paws (large, clearly recognizable) ─────────────────────────

function drawWarningPaws(ctx, ts, side) {
  const elapsed = ts - DOG.warning.startTime;
  const wave = Math.sin(elapsed * 0.006) * 5;
  // Paws slide in over the first 500ms
  const slideIn = Math.min(1, elapsed / 500);
  const baseX = side === 'left' ? -30 + slideIn * 25 : CW + 30 - slideIn * 25;
  const dir = side === 'left' ? 1 : -1;
  const pulse = 0.7 + 0.3 * Math.sin(elapsed * 0.005);

  ctx.save();
  ctx.globalAlpha = pulse;

  for (let i = 0; i < 2; i++) {
    const py = TUBE_TOP + TUBE_H * 0.25 + i * 55 + wave;
    const px = baseX + dir * 8;

    // Main paw pad
    ctx.fillStyle = '#A07030';
    ctx.beginPath();
    ctx.ellipse(px, py, 18, 22, dir * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Inner pad (lighter)
    ctx.fillStyle = '#D4A870';
    ctx.beginPath();
    ctx.ellipse(px, py + 4, 12, 14, dir * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Four toe beans
    const toeOffsets = [
      { dx: -10, dy: -16 }, { dx: -3, dy: -20 },
      { dx: 5, dy: -20 },  { dx: 12, dy: -16 },
    ];
    ctx.fillStyle = '#A07030';
    for (const toe of toeOffsets) {
      ctx.beginPath();
      ctx.ellipse(px + toe.dx * dir, py + toe.dy, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Toe bean inner (lighter)
    ctx.fillStyle = '#D4A870';
    for (const toe of toeOffsets) {
      ctx.beginPath();
      ctx.ellipse(px + toe.dx * dir, py + toe.dy + 1, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Claws
    ctx.strokeStyle = '#604020';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (const toe of toeOffsets) {
      ctx.beginPath();
      ctx.moveTo(px + toe.dx * dir, py + toe.dy - 6);
      ctx.lineTo(px + (toe.dx + 1) * dir, py + toe.dy - 10);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ── Warning tube highlight ──────────────────────────────────────────────

function drawWarningHighlight(ctx, ts, tubeIdx, tubeCount) {
  const cx = tubeCX(tubeIdx, tubeCount);
  const elapsed = ts - DOG.warning.startTime;
  const pulse = 0.5 + 0.4 * Math.sin(elapsed * 0.007);

  ctx.save();
  ctx.strokeStyle = `rgba(255, 100, 0, ${pulse})`;
  ctx.lineWidth = 4;
  ctx.shadowColor = 'rgba(255, 80, 0, 0.7)';
  ctx.shadowBlur = 16;
  const rx = cx - TUBE_W / 2 - 4, ry = TUBE_TOP - 4;
  const rw = TUBE_W + 8, rh = TUBE_H + 8, rr = 10;
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

  // "!" warning icon above tube
  const iconPulse = 0.6 + 0.4 * Math.sin(elapsed * 0.01);
  ctx.globalAlpha = iconPulse;
  ctx.font = 'bold 22px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF4400';
  ctx.shadowColor = 'rgba(255, 68, 0, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText('!', cx, TUBE_TOP - 14);
  ctx.restore();
}

// ── Dog body ────────────────────────────────────────────────────────────

function drawDogBody(ctx, x, y, flip, mouthOpen) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(0, 30, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail (wagging)
  const tailWag = Math.sin(performance.now() * 0.015) * 0.4;
  ctx.save();
  ctx.strokeStyle = '#C08030';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -5);
  ctx.quadraticCurveTo(-40, -22 + tailWag * 10, -32 + tailWag * 8, -32);
  ctx.stroke();
  ctx.restore();

  // Body
  ctx.fillStyle = '#C08030';
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // White belly
  ctx.fillStyle = '#F0E0C0';
  ctx.beginPath();
  ctx.ellipse(2, 8, 20, 13, 0, -0.2, Math.PI + 0.2);
  ctx.fill();

  // Legs (animated running)
  const legPhase = performance.now() * 0.012;
  ctx.fillStyle = '#C08030';
  const legPositions = [-16, -6, 8, 18];
  for (let li = 0; li < 4; li++) {
    const legSwing = Math.sin(legPhase + li * 1.2) * 4;
    ctx.fillRect(legPositions[li] - 3, 16 + legSwing, 7, 14);
    // Paw
    ctx.fillStyle = '#D4A060';
    ctx.beginPath();
    ctx.ellipse(legPositions[li], 30 + legSwing, 5.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C08030';
  }

  // Head
  ctx.fillStyle = '#C08030';
  ctx.beginPath();
  ctx.arc(26, -12, 20, 0, Math.PI * 2);
  ctx.fill();

  // Ears (floppy, bouncing)
  ctx.fillStyle = '#A06020';
  const earBounce = Math.sin(performance.now() * 0.01) * 2;
  ctx.beginPath();
  ctx.ellipse(14, -26 + earBounce, 9, 16, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Second ear behind head
  ctx.beginPath();
  ctx.ellipse(32, -26 + earBounce * 0.7, 8, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#D09040';
  ctx.beginPath();
  ctx.ellipse(42, -6, 12, 10, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  if (mouthOpen) {
    ctx.fillStyle = '#802020';
    ctx.beginPath();
    ctx.ellipse(44, 0, 7, 5, 0.1, 0, Math.PI);
    ctx.fill();
    // Tongue
    ctx.fillStyle = '#E06060';
    ctx.beginPath();
    ctx.ellipse(44, 3, 4, 5, 0, 0, Math.PI);
    ctx.fill();
  }

  // Nose
  ctx.fillStyle = '#302010';
  ctx.beginPath();
  ctx.ellipse(50, -8, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(49, -9, 2, 1.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (mischievous)
  ctx.fillStyle = '#302010';
  ctx.beginPath();
  ctx.ellipse(30, -18, 4, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(38, -17, 3.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye gleam
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(31, -19, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(39, -18, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows (mischievous slant)
  ctx.strokeStyle = '#8B5E20';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(26, -24);
  ctx.lineTo(33, -23);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(35, -22);
  ctx.lineTo(42, -22);
  ctx.stroke();

  ctx.restore();
}

// ── Carried ball (shown in dog's mouth during attack) ───────────────────

function drawCarriedBall(ctx, x, y, color) {
  const pal = PALETTE[color];
  if (!pal) return;
  const r = BALL_R * 0.6;
  ctx.save();
  const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
  grad.addColorStop(0, pal.bright);
  grad.addColorStop(0.7, pal.base);
  grad.addColorStop(1, pal.dark);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// ── Attack animation ────────────────────────────────────────────────────

function drawDogAttack(ctx, ts, tubeCount) {
  const atk = DOG.attacking;
  if (!atk) return;

  const elapsed = ts - atk.startTime;
  const totalDur = 1800; // slower animation (was 1200)
  const t = Math.min(elapsed / totalDur, 1);

  const srcX = tubeCX(atk.sourceTube, tubeCount);
  const dstX = tubeCX(atk.destTube, tubeCount);
  const startX = DOG.side === 'left' ? -50 : CW + 50;
  const endX = DOG.side === 'left' ? CW + 50 : -50;
  const flip = DOG.side === 'right';
  const y = TUBE_BOT + 10;

  let dogX;
  let mouthOpen = false;
  let showBall = false;
  let ballX = 0, ballY = 0;

  if (t < 0.25) {
    // Run in to source tube
    dogX = startX + (srcX - startX) * easeInOut(t / 0.25);
  } else if (t < 0.4) {
    // At source tube — grabbing ball (mouth opens)
    dogX = srcX;
    mouthOpen = true;
    // Ball lifts from tube towards dog's mouth
    const grabT = (t - 0.25) / 0.15;
    showBall = true;
    const tubeTopY = ballCY(3); // approximate top ball position
    ballX = srcX;
    ballY = tubeTopY + (y - 15 - tubeTopY) * easeInOut(grabT);
  } else if (t < 0.7) {
    // Run to destination with ball in mouth
    const runT = (t - 0.4) / 0.3;
    dogX = srcX + (dstX - srcX) * easeInOut(runT);
    mouthOpen = true;
    showBall = true;
    ballX = dogX + (flip ? -35 : 35);
    ballY = y - 15;
    // Dust while running
    if (Math.random() < 0.25) {
      spawnParticle(dogX, y + 25, (Math.random() - 0.5) * 3, -1.5 - Math.random() * 2,
        '#D0C0A0', 3 + Math.random() * 3, 400 + Math.random() * 200, 0.06);
    }
  } else if (t < 0.8) {
    // Drop ball at destination
    dogX = dstX;
    const dropT = (t - 0.7) / 0.1;
    showBall = true;
    const targetBallY = ballCY(0); // bottom-ish
    ballX = dstX;
    ballY = (y - 15) + (targetBallY - (y - 15)) * easeInOut(dropT);
    mouthOpen = dropT < 0.5;
  } else {
    // Run away
    const fleeT = (t - 0.8) / 0.2;
    dogX = dstX + (endX - dstX) * easeInOut(fleeT);
    // More dust
    if (Math.random() < 0.4) {
      spawnParticle(dogX, y + 25, (Math.random() - 0.5) * 4, -2 - Math.random() * 3,
        '#D0C0A0', 4 + Math.random() * 3, 300 + Math.random() * 300, 0.08);
    }
  }

  // Draw the carried ball (behind dog)
  if (showBall) {
    drawCarriedBall(ctx, ballX, ballY, atk.color);
  }

  // Draw dog
  drawDogBody(ctx, dogX, y, flip, mouthOpen);

  // Speech bubble when running away
  if (t > 0.82 && t < 0.98) {
    const bubbleAlpha = t < 0.85 ? (t - 0.82) / 0.03 : 1 - (t - 0.95) / 0.03;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, bubbleAlpha));
    // Bubble background
    const bx = dogX + (flip ? -50 : 50);
    const by = y - 50;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(bx, by, 30, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + 14);
    ctx.lineTo(dogX + (flip ? -20 : 30), y - 30);
    ctx.lineTo(bx + 2, by + 14);
    ctx.fill();
    // Text
    ctx.font = 'bold 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#604020';
    ctx.fillText('Hehe!', bx, by);
    ctx.restore();
  }
}

// ── Main draw function ──────────────────────────────────────────────────

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
