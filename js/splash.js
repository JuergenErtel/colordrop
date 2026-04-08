'use strict';

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

  // More particles with better variety — bokeh, dust, fireflies
  const count = Math.min(120, Math.floor(window.innerWidth * window.innerHeight / 8000));
  particles = [];

  for (let i = 0; i < count; i++) {
    const r = Math.random();
    const type = r < 0.15 ? 'bokeh' : r < 0.4 ? 'firefly' : 'dust';
    particles.push({
      x: Math.random() * (particleCanvas.width || 1440),
      y: Math.random() * (particleCanvas.height || 900),
      vx: (Math.random() - 0.5) * (type === 'bokeh' ? 0.1 : 0.3),
      vy: type === 'bokeh' ? -Math.random() * 0.15 - 0.05 : -Math.random() * 0.4 - 0.1,
      size: type === 'bokeh' ? Math.random() * 25 + 15
           : type === 'firefly' ? Math.random() * 3 + 2
           : Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.05,
      alphaDir: (Math.random() - 0.5) * (type === 'bokeh' ? 0.003 : 0.008),
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
    const maxA = p.type === 'bokeh' ? 0.12 : 0.7;
    if (p.alpha > maxA || p.alpha < 0.02) p.alphaDir *= -1;
    p.alpha = Math.max(0.01, Math.min(maxA, p.alpha));

    if (p.y < -p.size * 2) { p.y = H + p.size * 2; p.x = Math.random() * W; }
    if (p.x < -p.size * 2) p.x = W + p.size * 2;
    if (p.x > W + p.size * 2) p.x = -p.size * 2;

    if (p.type === 'bokeh') {
      // Large soft bokeh circles
      const grad = particleCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `hsla(${p.hue}, 60%, 70%, ${p.alpha * 0.8})`);
      grad.addColorStop(0.5, `hsla(${p.hue}, 50%, 60%, ${p.alpha * 0.3})`);
      grad.addColorStop(0.8, `hsla(${p.hue}, 40%, 50%, ${p.alpha * 0.08})`);
      grad.addColorStop(1, 'transparent');
      particleCtx.fillStyle = grad;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      particleCtx.fill();
    } else if (p.type === 'firefly') {
      // Bright glow core
      const grad = particleCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
      grad.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${p.alpha * 0.7})`);
      grad.addColorStop(0.3, `hsla(${p.hue}, 70%, 60%, ${p.alpha * 0.25})`);
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
      particleCtx.fillStyle = `hsla(${p.hue}, 40%, 80%, ${p.alpha * 0.45})`;
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
      const angle = (Math.random() - 0.5) * 40;
      const jumpY = -(15 + Math.random() * 15);
      yarn.style.transition = 'transform .15s cubic-bezier(.2,.8,.3,1.4)';
      yarn.style.transform = `translateY(${jumpY}px) rotate(${angle}deg) scale(1.15)`;
      setTimeout(() => {
        yarn.style.transition = 'transform .6s cubic-bezier(.34,1.56,.64,1)';
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
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity .8s ease-out, transform .8s ease-out';
    }
  });

  requestAnimationFrame(() => {
    setTimeout(() => { if (logo) { logo.style.opacity = '1'; logo.style.transform = 'translateY(0)'; } }, 200);
    setTimeout(() => { if (tagline) { tagline.style.opacity = '1'; tagline.style.transform = 'translateY(0)'; } }, 500);
    setTimeout(() => { if (scene) { scene.style.opacity = '1'; scene.style.transform = 'translateY(0)'; } }, 800);
    setTimeout(() => { if (btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; } }, 1200);
  });
}

// ── Public API ───────────────────────────────────────────────────────────

export function initSplash() {
  initParticles();
  initYarnInteractions();
  animateEntrance();
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
