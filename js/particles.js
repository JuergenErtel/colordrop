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
    // Confetti: sinusoidal horizontal drift for organic flutter
    if (p.isConfetti) {
      const age = (p.maxLife - p.life) * 0.003;
      p.x += Math.sin(age * 2.5 + (p.rotation || 0)) * 0.4;
    }
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

// ── Ambient fireflies ────────────────────────────────────────────────────
const FIREFLY_COUNT = 8;
const _fireflies = [];

export function spawnFireflies(accentColor) {
  _fireflies.length = 0;
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    _fireflies.push({
      baseX: 30 + Math.random() * 360,
      baseY: 80 + Math.random() * 380,
      phase: Math.random() * Math.PI * 2,
      freqX: 0.0003 + Math.random() * 0.0004,
      freqY: 0.0004 + Math.random() * 0.0003,
      ampX: 15 + Math.random() * 20,
      ampY: 12 + Math.random() * 15,
      size: 2 + Math.random() * 2,
      color: accentColor || 'rgba(255,215,0,0.15)',
    });
  }
}

export function clearFireflies() {
  _fireflies.length = 0;
}

export function drawFireflies(ctx, ts) {
  for (const f of _fireflies) {
    const x = f.baseX + Math.sin(ts * f.freqX + f.phase) * f.ampX;
    const y = f.baseY + Math.cos(ts * f.freqY + f.phase * 1.3) * f.ampY;
    const alpha = 0.12 + 0.10 * Math.sin(ts * 0.0012 + f.phase);
    // Gentle size pulse — breathe in and out
    const sizeScale = 1 + 0.2 * Math.sin(ts * 0.0008 + f.phase * 2.1);
    const sz = f.size * sizeScale;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, sz * 3.5);
    glow.addColorStop(0, f.color.replace(/[\d.]+\)$/, `${alpha})`));
    glow.addColorStop(0.5, f.color.replace(/[\d.]+\)$/, `${alpha * 0.3})`));
    glow.addColorStop(1, f.color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = glow;
    ctx.fillRect(x - sz * 3.5, y - sz * 3.5, sz * 7, sz * 7);

    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fillStyle = f.color.replace(/[\d.]+\)$/, `${alpha * 1.8})`);
    ctx.fill();
  }
}
