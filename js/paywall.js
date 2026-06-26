'use strict';

import { SUB_TIERS, BILLING_MODE, APP_STORE_URL, APP_STORE_LIVE } from './constants.js';
import { purchase, isActiveSubscription, restorePurchases } from './billing.js';
import { getNativeProducts, IAP_PRODUCT_IDS } from './native-billing.js';
import { loadSubscription, loadPaywallState, savePaywallState } from './storage.js';
import { getBalance } from './economy.js';
import { playSound } from './audio.js';

let _selectedTier = 'lifetime';
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
  const restoreHint = document.getElementById('paywallRestoreHint');
  if (restoreHint) restoreHint.hidden = true;
  selectTier(opts.initialTier || 'lifetime');
  updateBuyLabel();
  // intentional fire-and-forget: hidePaywall runs before any stale label write matters
  applyLocalizedPrice();
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

  const isWebDemo = BILLING_MODE === 'preview';

  if (hasSub) {
    label.textContent = 'Du hast bereits alles freigeschaltet';
  } else if (isWebDemo) {
    // Web: kein Kauf hier — Verweis auf die native iOS-App.
    label.textContent = APP_STORE_LIVE ? '\u{1F34F} Im App Store laden' : '\u{1F34F} Bald im App Store';
  } else {
    const def = SUB_TIERS[_selectedTier];
    label.textContent = 'FÜR IMMER FREISCHALTEN · ' + (def?.price || '');
  }

  if (foot) {
    foot.textContent = isWebDemo
      ? 'Der Kittysort Club ist in der iOS-App erhältlich.'
      : 'Einmalzahlung · Kein Abo · Keine versteckten Kosten';
  }
}

// ── Purchase flow ───────────────────────────────────────────────────────
function setPaywallHint(msg) {
  const hint = document.getElementById('paywallRestoreHint');
  if (!hint) return;
  hint.hidden = false;
  hint.textContent = msg;
}

// Sichtbares Feedback für jeden fehlgeschlagenen nativen Kauf — sonst wirkt der
// Button "unresponsive" (App-Review 2.1b), wenn StoreKit das Produkt z. B.
// wegen fehlendem Paid-Apps-Vertrag oder Sandbox-Problemen nicht laden kann.
const NATIVE_FAIL_COPY = {
  plugin_unavailable: 'Kauf momentan nicht verfügbar. Bitte versuche es später erneut.',
  purchase_failed:    'Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.',
  native_failed:      'Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.',
  pending:            'Dein Kauf wartet noch auf Freigabe.',
  unknown_tier:       'Dieses Produkt ist gerade nicht verfügbar.',
};

async function handleBuyClick() {
  const sub = loadSubscription();
  if (isActiveSubscription(sub)) {
    hidePaywall();
    return;
  }

  // Web-Demo (kittysort.de): KEIN Gratis-Premium mehr — stattdessen auf die
  // native iOS-App verweisen (dort läuft der echte StoreKit-Kauf).
  if (BILLING_MODE === 'preview') {
    if (APP_STORE_LIVE) {
      window.open(APP_STORE_URL, '_blank', 'noopener');
    } else {
      setPaywallHint('Die App wird gerade geprüft — bald im App Store! 🐱');
      playSound('click');
    }
    return;
  }

  // Nativer Kauf: Button sperren + Status zeigen, damit ein langsamer
  // StoreKit-Abruf nicht als "toter Button" wahrgenommen wird.
  const btn   = document.getElementById('paywallBuyBtn');
  const label = document.getElementById('paywallBuyLabel');
  const prevLabel = label ? label.textContent : '';
  if (btn) btn.disabled = true;
  if (label) label.textContent = 'Verbinde mit dem App Store …';

  let result;
  try {
    result = await purchase(_selectedTier);
  } catch (err) {
    console.warn('paywall: Kauf-Aufruf fehlgeschlagen:', err);
    result = { ok: false, reason: 'purchase_failed' };
  } finally {
    if (btn) btn.disabled = false;
    if (label) label.textContent = prevLabel;
  }

  if (!result || !result.ok) {
    // Abbruch durch den Nutzer braucht keine Fehlermeldung.
    if (!result || result.reason !== 'cancelled') {
      setPaywallHint(NATIVE_FAIL_COPY[result?.reason] || NATIVE_FAIL_COPY.purchase_failed);
      playSound('invalid');
    }
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
    // Fischgräten-Block nur zeigen, wenn tatsächlich welche gutgeschrieben
    // wurden. Restore (welcomeBonus: 0) darf keine "+500"-Animation vorgaukeln.
    const earnedBones = result.welcomeBonus ?? 0;
    if (bones) bones.style.display = earnedBones > 0 ? '' : 'none';
    if (earnedBones > 0) animateBonesCounter(count, 0, earnedBones, 2000);
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

// ── Localized price ─────────────────────────────────────────────────────
async function applyLocalizedPrice() {
  const products = await getNativeProducts([IAP_PRODUCT_IDS.lifetime]);
  const p = products.find(x => x.id === IAP_PRODUCT_IDS.lifetime);
  if (!p) return; // Fallback: hardcodierter Preis bleibt
  const priceEl = document.querySelector('.paywall-tier[data-tier="lifetime"] .paywall-tier-price');
  if (priceEl) priceEl.textContent = p.displayPrice;
  const label = document.getElementById('paywallBuyLabel');
  if (label && !isActiveSubscription(loadSubscription())) {
    label.textContent = 'FÜR IMMER FREISCHALTEN · ' + p.displayPrice;
  }
}

// ── Restore flow ─────────────────────────────────────────────────────────
async function handleRestoreClick() {
  const btn  = document.getElementById('paywallRestoreBtn');
  const hint = document.getElementById('paywallRestoreHint');
  if (btn) btn.disabled = true;
  try {
    const res = await restorePurchases();
    if (res && res.ok && res.restored) {
      hidePaywall();
      showCelebration({ tier: 'lifetime', welcomeBonus: 0 });
    } else if (hint) {
      hint.hidden = false;
      hint.textContent = 'Kein früherer Kauf gefunden.';
      playSound('invalid');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── Wire buttons (call once at boot) ────────────────────────────────────
export function initPaywallUI() {
  document.querySelectorAll('.paywall-tier').forEach(btn => {
    btn.addEventListener('click', () => selectTier(btn.dataset.tier));
  });
  document.getElementById('paywallBuyBtn')?.addEventListener('click', handleBuyClick);
  document.getElementById('paywallRestoreBtn')?.addEventListener('click', handleRestoreClick);
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

// ══════════════════════════════════════════════════════════════════════
//  CONTEXTUAL TRIGGERS
// ══════════════════════════════════════════════════════════════════════

const MIN_HINT3RD_INTERVAL_MS = 72 * 60 * 60 * 1000;
const MIN_LIVES0_INTERVAL_MS  = 60 * 60 * 1000;

export const TRIGGERS = {
  level5:      { once: true,  interval: 0 },
  level15:     { once: true,  interval: 0 },
  hint3rd:     { once: false, interval: MIN_HINT3RD_INTERVAL_MS, stateKey: 'lastHint3rd' },
  streak7:     { once: true,  interval: 0 },
  lives0:      { once: false, interval: MIN_LIVES0_INTERVAL_MS,  stateKey: 'lastLives0' },
  seasonEnd3d: { once: true,  interval: 0 },
};

const TRIGGER_COPY = {
  level5:      { title: 'Du hast Talent! 🐾',          sub: 'Schalte einmalig alle Saison-Katzen und Premium-Features frei — für immer.' },
  level15:     { title: 'Drei Katzen warten auf dich', sub: 'Die Kirschblüte-Saison hat exklusive Katzen — einmal freischalten, für immer behalten.' },
  hint3rd:     { title: 'Brauchst du öfter Hilfe?',    sub: 'Mit dem Unlock sind Hints unbegrenzt kostenlos.' },
  streak7:     { title: '7 Tage in Folge — stark!',    sub: 'Du spielst sowieso jeden Tag. Einmal freischalten und keine Saison verpassen.' },
  lives0:      { title: 'Keine Wartezeit mehr',        sub: 'Unbegrenzte Lives + alle Premium-Features — einmalig freigeschaltet.' },
  seasonEnd3d: { title: 'Noch 3 Tage für die Saison-Katzen!', sub: 'Sakura, Tsubaki und Hoshi verschwinden am Monatsende.' },
};

export function maybeShowPaywall(triggerId) {
  const cfg = TRIGGERS[triggerId];
  if (!cfg) return false;

  // Don't prompt already-premium users
  const sub = loadSubscription();
  if (sub && sub.active) return false;

  const state = loadPaywallState();
  if (cfg.once && state.shown.includes(triggerId)) return false;
  if (cfg.stateKey) {
    const last = state[cfg.stateKey] || 0;
    if (Date.now() - last < cfg.interval) return false;
  }

  if (cfg.once) state.shown.push(triggerId);
  if (cfg.stateKey) state[cfg.stateKey] = Date.now();
  savePaywallState(state);

  showPaywall({ triggerCopy: TRIGGER_COPY[triggerId] });
  return true;
}
