'use strict';

import { MAX_PARTS, PALETTE, COLOR_KEYS } from './constants.js';
import { ANIM } from './animations.js';

// ── Particle pool ─────────────────────────────────────────────────────────
// Particles live in ANIM.particles (shared array managed here)

export function spawnParticle(x, y, vx, vy, color, size, life, gravity = 0.15) {
  if (ANIM.particles.length >= MAX_PARTS) return;
  ANIM.particles.push({ x, y, vx, vy, color, size, life, maxLife: life, gravity, alpha: 1 });
}

// ── Update ────────────────────────────────────────────────────────────────
export function updateParticles(dt) {
  const arr = ANIM.particles;
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x    += p.vx * dt * 0.06;
    p.y    += p.vy * dt * 0.06;
    p.vy   += p.gravity * dt * 0.06;
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
    if (p.life <= 0) arr.splice(i, 1);
  }
}

// ── Draw ──────────────────────────────────────────────────────────────────
export function drawParticles(ctx) {
  for (const p of ANIM.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawConfetti(ctx) {
  for (const p of ANIM.particles) {
    if (!p.isConfetti) continue;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();
    p.rotation = (p.rotation || 0) + 0.08;
  }
}

// ── Tube explosion ────────────────────────────────────────────────────────
export function triggerTubeExplosion(tubeIdx, tubes, tubeCX) {
  const tube    = tubes[tubeIdx];
  if (!tube || tube.length === 0) return;
  const cx      = tubeCX(tubeIdx);
  const color   = PALETTE[tube[tube.length - 1]]?.bright ?? '#fff';
  const count   = 12 + Math.floor(Math.random() * 8);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 3 + Math.random() * 4;
    spawnParticle(
      cx, 300,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed - 2,
      color,
      4 + Math.random() * 4,
      400 + Math.random() * 300,
      0.1,
    );
  }
}

// ── Confetti burst ────────────────────────────────────────────────────────
export function spawnConfetti() {
  const colors = COLOR_KEYS.map(k => PALETTE[k].bright);
  for (let i = 0; i < 80; i++) {
    const p = {
      x:          Math.random() * 420,
      y:          -10 - Math.random() * 40,
      vx:         (Math.random() - 0.5) * 4,
      vy:         2 + Math.random() * 3,
      color:      colors[Math.floor(Math.random() * colors.length)],
      size:       6 + Math.random() * 6,
      life:       1200 + Math.random() * 800,
      maxLife:    2000,
      gravity:    0.05,
      alpha:      1,
      isConfetti: true,
      rotation:   Math.random() * Math.PI * 2,
    };
    if (ANIM.particles.length < MAX_PARTS) ANIM.particles.push(p);
  }
}

// ── Win fireworks ─────────────────────────────────────────────────────────
export function scheduleWinFireworks() {
  const delays = [0, 200, 450, 750];
  delays.forEach(delay => {
    setTimeout(() => {
      spawnConfetti();
      const x     = 80 + Math.random() * 260;
      const y     = 100 + Math.random() * 200;
      const color = PALETTE[COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]].bright;
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 4 + Math.random() * 5;
        spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 1, color, 5, 600, 0.08);
      }
    }, delay);
  });
}
