'use strict';

import { drawMascotCat, CAT_PARAMS } from './cat-renderer.js';
import { isPremium } from './economy.js';
import { isFounder } from './billing.js';
import { loadSubscription } from './storage.js';

// ══════════════════════════════════════════════════════════════════════════
//  SPLASH SCREEN — Particles, Yarn interactions, entrance animation
// ══════════════════════════════════════════════════════════════════════════

let particles = [];
let particleCtx = null;
let particleCanvas = null;
let animId = null;
let active = true;
let hideTimer = null;  // track pending hide timeout

// ── Particle System ──────────────────────────────────────────────────────

function initParticles() {
  particleCanvas = document.getElementById('splashParticles');
  if (!particleCanvas) return;
  if (animId) cancelAnimationFrame(animId);

  particleCtx = particleCanvas.getContext('2d');
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);

  // Slightly calmer particle field so the scene feels richer, not noisier.
  const count = Math.min(105, Math.floor(window.innerWidth * window.innerHeight / 9500));
  particles = [];

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const type = r < 0.13 ? 'bokeh' : r < 0.34 ? 'firefly' : 'dust';
    particles.push({
      x: Math.random() * (particleCanvas.width || 1440),
      y: Math.random() * (particleCanvas.height || 900),
      vx: (Math.random() - 0.5) * (type === 'bokeh' ? 0.08 : 0.22),
      vy: type === 'bokeh' ? -Math.random() * 0.11 - 0.03 : -Math.random() * 0.28 - 0.06,
      size: type === 'bokeh' ? Math.random() * 25 + 15
           : type === 'firefly' ? Math.random() * 2.6 + 1.8
           : Math.random() * 1.3 + 0.4,
      alpha: Math.random() * 0.28 + 0.04,
      alphaDir: (Math.random() - 0.5) * (type === 'bokeh' ? 0.0022 : 0.0055),
      type,
      hue: type === 'bokeh'
        ? [30, 35, 40, 280, 320][Math.floor(Math.random() * 5)]
        : type === 'firefly'
        ? 35 + Math.random() * 25
        : 25 + Math.random() * 35,
      phase: Math.random() * Math.PI * 2,
    });
  }

  active = true;
  renderParticles(performance.now());
}

function resizeParticleCanvas() {
  if (!particleCanvas) return;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

function renderParticles(time) {
  if (!active) return;
  animId = requestAnimationFrame(renderParticles);

  if (!particleCtx) return;
  const W = particleCanvas.width;
  const H = particleCanvas.height;
  particleCtx.clearRect(0, 0, W, H);

  for (const p of particles) {
    p.x += p.vx + Math.sin(time * 0.0004 + p.phase) * (p.type === 'bokeh' ? 0.3 : 0.15);
    p.y += p.vy;

    p.alpha += p.alphaDir;
    const maxA = p.type === 'bokeh' ? 0.1 : p.type === 'firefly' ? 0.55 : 0.3;
    if (p.alpha > maxA || p.alpha < 0.02) p.alphaDir *= -1;
    p.alpha = Math.max(0.01, Math.min(maxA, p.alpha));

    if (p.y < -p.size * 2) { p.y = H + p.size * 2; p.x = Math.random() * W; }
    if (p.x < -p.size * 2) p.x = W + p.size * 2;
    if (p.x > W + p.size * 2) p.x = -p.size * 2;

    if (p.type === 'bokeh') {
      // Large soft bokeh circles
      const grad = particleCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `hsla(${p.hue}, 58%, 72%, ${p.alpha * 0.68})`);
      grad.addColorStop(0.5, `hsla(${p.hue}, 48%, 60%, ${p.alpha * 0.24})`);
      grad.addColorStop(0.8, `hsla(${p.hue}, 40%, 50%, ${p.alpha * 0.07})`);
      grad.addColorStop(1, 'transparent');
      particleCtx.fillStyle = grad;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      particleCtx.fill();
    } else if (p.type === 'firefly') {
      // Bright glow core
      const grad = particleCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
      grad.addColorStop(0, `hsla(${p.hue}, 78%, 74%, ${p.alpha * 0.6})`);
      grad.addColorStop(0.3, `hsla(${p.hue}, 68%, 60%, ${p.alpha * 0.22})`);
      grad.addColorStop(1, 'transparent');
      particleCtx.fillStyle = grad;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
      particleCtx.fill();

      particleCtx.fillStyle = `hsla(${p.hue}, 90%, 90%, ${p.alpha})`;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      particleCtx.fill();
    } else {
      particleCtx.fillStyle = `hsla(${p.hue}, 34%, 82%, ${p.alpha * 0.4})`;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      particleCtx.fill();
    }
  }
}

// ── Yarn Ball Interactions ───────────────────────────────────────────────

function initYarnInteractions() {
  const yarns = document.querySelectorAll('.yarn-ball');
  yarns.forEach(yarn => {
    yarn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const angle = (Math.random() - 0.5) * 20;
      const jumpY = -(10 + Math.random() * 10);
      yarn.style.transition = 'transform .16s cubic-bezier(.2,.8,.3,1.2)';
      yarn.style.transform = `translateY(${jumpY}px) rotate(${angle}deg) scale(1.1)`;
      setTimeout(() => {
        yarn.style.transition = 'transform .65s cubic-bezier(.28,1.3,.5,1)';
        yarn.style.transform = '';
      }, 180);
    });
  });
}

// ── Entrance Animation ───────────────────────────────────────────────────

function animateEntrance() {
  const logo = document.querySelector('.splash-logo');
  const tagline = document.querySelector('.splash-tagline');
  const scene = document.querySelector('.splash-scene');
  const btn = document.querySelector('.splash-play');

  [logo, tagline, scene, btn].forEach(el => {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity .9s cubic-bezier(.22,.61,.36,1), transform .9s cubic-bezier(.22,.61,.36,1)';
    }
  });

  requestAnimationFrame(() => {
    setTimeout(() => { if (logo) { logo.style.opacity = '1'; logo.style.transform = 'translateY(0)'; } }, 180);
    setTimeout(() => { if (tagline) { tagline.style.opacity = '1'; tagline.style.transform = 'translateY(0)'; } }, 420);
    setTimeout(() => { if (scene) { scene.style.opacity = '1'; scene.style.transform = 'translateY(0)'; } }, 740);
    setTimeout(() => { if (btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; } }, 1040);
  });
}

// ── Public API ───────────────────────────────────────────────────────────

// ── Premium Welcome ──────────────────────────────────────────────────────

function injectPremiumWelcome() {
  const host = document.querySelector('.splash-content');
  if (!host || host.querySelector('.splash-welcome')) return;
  if (!isPremium()) return;

  const el = document.createElement('p');
  el.className = 'splash-welcome';
  if (isFounder()) {
    el.textContent = 'Willkommen zurück, Founder';
  } else {
    const sub = loadSubscription();
    const since = sub?.since ? new Date(sub.since).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '';
    el.textContent = 'Willkommen zurück, Club-Mitglied seit ' + since;
  }
  host.appendChild(el);
}

export function initSplash() {
  injectPremiumWelcome();
  initParticles();
  initYarnInteractions();
  animateEntrance();
  enableSplashSkip();
}

function enableSplashSkip() {
  const splash = document.getElementById('splashScreen');
  if (!splash || splash.__skipWired) return;
  splash.__skipWired = true;
  splash.addEventListener('click', (e) => {
    // Don't interfere with real buttons (play, tut, etc.)
    if (e.target.closest('button')) return;
    splash.classList.add('fast-forward');
    // Collapse delays on fade-in/welcome animation
    splash.querySelectorAll('.splash-welcome').forEach(el => {
      el.style.animationDelay = '0.1s';
    });
  }, { once: true });
}

export function hideSplash() {
  return new Promise(resolve => {
    const splash = document.getElementById('splashScreen');
    if (!splash || splash.classList.contains('hidden')) {
      resolve();
      return;
    }
    // Cancel any pending hide so showSplash can't be undone
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    splash.classList.add('hiding');
    hideTimer = setTimeout(() => {
      hideTimer = null;
      // Only hide if still in 'hiding' state (not re-shown in the meantime)
      if (!splash.classList.contains('hiding')) { resolve(); return; }
      splash.classList.add('hidden');
      active = false;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      if (particleCtx && particleCanvas) particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      particles = [];
      resolve();
    }, 850);
  });
}

export function showSplash(bgOnly = false) {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  // Cancel any pending hide
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

  splash.classList.remove('hidden', 'hiding');
  if (bgOnly) {
    splash.classList.add('bg-only');
  } else {
    splash.classList.remove('bg-only');
    animateEntrance();
  }

  if (!active || particles.length === 0) {
    initParticles();
  }
}

export function updateSplashMascot(mascotId) {
  const svg = document.querySelector('svg.splash-cat');
  const canvas = document.getElementById('splashMascotCanvas');
  if (!svg || !canvas) return;

  if (!mascotId || mascotId === 'default') {
    svg.style.display = '';
    canvas.style.display = 'none';
    return;
  }

  const params = CAT_PARAMS.find(p => p.id === mascotId);
  if (!params) {
    svg.style.display = '';
    canvas.style.display = 'none';
    return;
  }

  svg.style.display = 'none';
  canvas.style.display = '';
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 220, 240);
  drawMascotCat(ctx, 110, 120, 70, performance.now(), params);
}
