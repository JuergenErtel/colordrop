'use strict';

import { SUB_TIERS, BILLING_MODE, WELCOME_BONUS_BONES } from './constants.js';
import { purchase, isActiveSubscription } from './billing.js';
import { loadSubscription } from './storage.js';
import { getBalance } from './economy.js';
import { playSound } from './audio.js';

let _selectedTier = 'yearly';
let _onCloseCallback = null;

// ── Show / hide ─────────────────────────────────────────────────────────
export function showPaywall(opts = {}) {
  const screen = document.getElementById('paywallScreen');
  if (!screen) return;
  _onCloseCallback = opts.onClose || null;

  const titleEl = screen.querySelector('.paywall-title');
  const subEl   = screen.querySelector('.paywall-subtitle');
  if (opts.triggerCopy) {
    if (titleEl) titleEl.textContent = opts.triggerCopy.title;
    if (subEl)   subEl.textContent   = opts.triggerCopy.sub;
  } else {
    if (titleEl) titleEl.textContent = 'KITTYSORT CLUB';
    if (subEl)   subEl.textContent   = 'Neue Katzen, neue Saisons, jeden Monat';
  }

  screen.classList.remove('hidden');
  screen.classList.add('show');
  selectTier(opts.initialTier || 'yearly');
  updateBuyLabel();
  playSound('click');
}

export function hidePaywall() {
  const screen = document.getElementById('paywallScreen');
  if (!screen) return;
  screen.classList.remove('show');
  setTimeout(() => screen.classList.add('hidden'), 250);
  if (_onCloseCallback) { _onCloseCallback(); _onCloseCallback = null; }
}

// ── Tier selection ──────────────────────────────────────────────────────
function selectTier(tier) {
  _selectedTier = tier;
  document.querySelectorAll('.paywall-tier').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.tier === tier);
  });
  updateBuyLabel();
}

function updateBuyLabel() {
  const sub    = loadSubscription();
  const hasSub = isActiveSubscription(sub);
  const label  = document.getElementById('paywallBuyLabel');
  const foot   = document.getElementById('paywallFootnote');
  if (!label) return;

  if (hasSub) {
    label.textContent = 'Du bist bereits Mitglied';
  } else if (!sub || sub.tier !== 'trial') {
    label.textContent = 'JETZT 7 TAGE GRATIS TESTEN';
  } else {
    const def = SUB_TIERS[_selectedTier];
    label.textContent = 'KAUFEN · ' + (def?.price || '');
  }

  if (foot) {
    foot.textContent = BILLING_MODE === 'preview'
      ? 'Preview-Modus — Premium wird ohne Zahlung aktiviert'
      : 'Abo jederzeit kündbar · Keine versteckten Kosten';
  }
}

// ── Purchase flow ───────────────────────────────────────────────────────
async function handleBuyClick() {
  const sub = loadSubscription();
  if (isActiveSubscription(sub)) {
    hidePaywall();
    return;
  }

  const useTrial = !sub || sub.tier !== 'trial';
  const tierToBuy = useTrial ? 'trial' : _selectedTier;

  const result = await purchase(tierToBuy);
  if (!result || !result.ok) {
    playSound('invalid');
    return;
  }
  if (result.redirecting) return;

  hidePaywall();
  showCelebration(result);
}

// ── Celebration ─────────────────────────────────────────────────────────
export function showCelebration(result) {
  const overlay = document.getElementById('premiumCelebration');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  overlay.classList.add('show');

  const title = document.getElementById('celebrationTitle');
  const sub   = document.getElementById('celebrationSub');
  const bones = document.getElementById('celebrationBones');
  const count = document.getElementById('celebrationBonesCount');
  const cats  = document.getElementById('celebrationCats');

  if (result.tier === 'trial') {
    if (title) title.textContent = '7 Tage Club — gratis!';
    if (sub)   sub.textContent   = 'Alle Premium-Features aktiv';
    if (bones) bones.style.display = 'none';
  } else {
    if (title) title.textContent = 'Willkommen im Club!';
    if (sub)   sub.textContent   = SUB_TIERS[result.tier]?.label || '';
    if (bones) bones.style.display = '';
    animateBonesCounter(count, 0, result.welcomeBonus || WELCOME_BONUS_BONES, 2000);
  }

  if (cats) {
    cats.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const el = document.createElement('div');
      el.className = 'celebration-cat';
      el.style.animationDelay = (0.6 + i * 0.2) + 's';
      el.textContent = '🐱';
      el.style.fontSize = '3.5rem';
      el.style.lineHeight = '1';
      cats.appendChild(el);
    }
  }

  playSound('cat_unlock');

  if (window.startConfetti) window.startConfetti('celebrationConfetti');
  setTimeout(() => { if (window.stopConfetti) window.stopConfetti('celebrationConfetti'); }, 4500);
}

function animateBonesCounter(el, from, to, durationMs) {
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Wire buttons (call once at boot) ────────────────────────────────────
export function initPaywallUI() {
  document.querySelectorAll('.paywall-tier').forEach(btn => {
    btn.addEventListener('click', () => selectTier(btn.dataset.tier));
  });
  document.getElementById('paywallBuyBtn')?.addEventListener('click', handleBuyClick);
  document.getElementById('paywallCloseBtn')?.addEventListener('click', hidePaywall);

  document.getElementById('celebrationSkipBtn')?.addEventListener('click', () => {
    const o = document.getElementById('premiumCelebration');
    if (!o) return;
    o.classList.remove('show');
    setTimeout(() => o.classList.add('hidden'), 250);
  });
  document.getElementById('celebrationPassBtn')?.addEventListener('click', () => {
    const o = document.getElementById('premiumCelebration');
    if (!o) return;
    o.classList.remove('show');
    setTimeout(() => {
      o.classList.add('hidden');
      // Phase 4 hook: open season pass screen if button exists
      document.getElementById('seasonPassBtn')?.click();
    }, 250);
  });
}
