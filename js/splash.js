'use strict';

// ══════════════════════════════════════════════════════════════════════════
//  SPLASH SCREEN — Particles, Yarn interactions, entrance animation
// ══════════════════════════════════════════════════════════════════════════

let particles = [];
let particleCtx = null;
let particleCanvas = null;
let animId = null;
let active = true;

// ── Particle System ──────────────────────────────────────────────────────

function initParticles() {
  particleCanvas = document.getElementById('splashParticles');
  if (!particleCanvas) return;

  particleCtx = particleCanvas.getContext('2d');
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);

  // Create particles — mix of dust motes and firefly-like glows
  const count = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 12000));
  particles = [];

  for (let i = 0; i < count; i++) {
    const isFirefly = Math.random() < 0.25;
    particles.push({
      x: Math.random() * particleCanvas.width,
      y: Math.random() * particleCanvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      size: isFirefly ? Math.random() * 3 + 2 : Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      alphaDir: (Math.random() - 0.5) * 0.008,
      isFirefly,
      hue: isFirefly
        ? (Math.random() < 0.5 ? 35 + Math.random() * 20 : 50 + Math.random() * 15) // warm gold/amber
        : 30 + Math.random() * 30, // dust warmth
      phase: Math.random() * Math.PI * 2,
    });
  }

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
    // Drift
    p.x += p.vx + Math.sin(time * 0.0005 + p.phase) * 0.15;
    p.y += p.vy;

    // Twinkle
    p.alpha += p.alphaDir;
    if (p.alpha > 0.7 || p.alpha < 0.05) p.alphaDir *= -1;
    p.alpha = Math.max(0.02, Math.min(0.7, p.alpha));

    // Wrap
    if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;

    // Draw
    if (p.isFirefly) {
      // Glow
      const grad = particleCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      grad.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${p.alpha * 0.6})`);
      grad.addColorStop(0.4, `hsla(${p.hue}, 70%, 55%, ${p.alpha * 0.2})`);
      grad.addColorStop(1, 'transparent');
      particleCtx.fillStyle = grad;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      particleCtx.fill();

      // Core
      particleCtx.fillStyle = `hsla(${p.hue}, 90%, 85%, ${p.alpha})`;
      particleCtx.beginPath();
      particleCtx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      particleCtx.fill();
    } else {
      // Dust mote
      particleCtx.fillStyle = `hsla(${p.hue}, 40%, 80%, ${p.alpha * 0.5})`;
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
    // Add glow shadow based on color
    const colors = {
      'yarn-ball--red':    'rgba(231,76,60,.5)',
      'yarn-ball--blue':   'rgba(52,152,219,.5)',
      'yarn-ball--green':  'rgba(46,204,113,.5)',
      'yarn-ball--yellow': 'rgba(241,196,15,.5)',
      'yarn-ball--purple': 'rgba(155,89,182,.5)',
    };
    for (const [cls, glow] of Object.entries(colors)) {
      if (yarn.classList.contains(cls)) {
        yarn.style.filter = `drop-shadow(0 0 12px ${glow})`;
      }
    }

    // Bounce on click/tap
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

  // Start invisible
  [logo, tagline, scene, btn].forEach(el => {
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity .8s ease-out, transform .8s ease-out';
    }
  });

  // Stagger reveal
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (logo) { logo.style.opacity = '1'; logo.style.transform = 'translateY(0)'; }
    }, 200);
    setTimeout(() => {
      if (tagline) { tagline.style.opacity = '1'; tagline.style.transform = 'translateY(0)'; }
    }, 500);
    setTimeout(() => {
      if (scene) { scene.style.opacity = '1'; scene.style.transform = 'translateY(0)'; }
    }, 800);
    setTimeout(() => {
      if (btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }
    }, 1200);
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
    splash.classList.add('hiding');
    setTimeout(() => {
      splash.classList.add('hidden');
      active = false;
      if (animId) cancelAnimationFrame(animId);
      // Clean up particle canvas memory
      if (particleCtx) particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
      particles = [];
      resolve();
    }, 850);
  });
}

export function showSplash(bgOnly = false) {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  active = true;
  splash.classList.remove('hidden', 'hiding');
  if (bgOnly) {
    splash.classList.add('bg-only');
  } else {
    splash.classList.remove('bg-only');
    animateEntrance();
  }
  initParticles();
}
