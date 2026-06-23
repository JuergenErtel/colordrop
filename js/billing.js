'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   LAUNCH PROCEDURE
   ───────────────────────────────────────────────────────────────────────
   When Stripe is ready (company registered, account active):

   1. In js/constants.js:
      export const BILLING_MODE = 'stripe';
      export const STRIPE_LINKS = {
        lifetime: 'https://buy.stripe.com/ZZZ',
      };

   2. In the Stripe Payment Link (Einmalkauf-Modell — nur ein Tier):
      - Use a ONE-TIME payment (not a subscription)
      - Set success URL: https://kittysort.de/?success=1&tier=lifetime
      - Enable customer email collection

   3. Test with Stripe's test mode (4242 4242 4242 4242) before going live.

   4. Deploy. The handleStripeReturn() handler below automatically grants
      the appropriate subscription status when Stripe redirects back.

   For iOS/Android native IAP: set BILLING_MODE = 'native' and implement
   a native-bridge in a separate js/native-billing.js module.
   ══════════════════════════════════════════════════════════════════════════ */

import { BILLING_MODE, STRIPE_LINKS, SUB_TIERS, TRIAL_DAYS, WELCOME_BONUS_BONES } from './constants.js';
import { loadSubscription, saveSubscription } from './storage.js';
import { earn } from './economy.js';
import { purchaseNative, restoreNative, syncEntitlementsNative } from './native-billing.js';

// ── Pure status helpers ─────────────────────────────────────────────────
export function isActiveSubscription(sub) {
  if (!sub || !sub.active) return false;
  if (sub.lifetime) return true;
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) return false;
  return true;
}

export function currentTier() {
  const sub = loadSubscription();
  if (!isActiveSubscription(sub)) return null;
  return sub.tier;
}

export function isFounder() {
  const sub = loadSubscription();
  return !!(sub && sub.tier === 'founder');
}

export function isTrial() {
  const sub = loadSubscription();
  return !!(sub && sub.tier === 'trial' && isActiveSubscription(sub));
}

export function trialDaysLeft() {
  const sub = loadSubscription();
  if (!sub || sub.tier !== 'trial' || !sub.trialEnd) return 0;
  const ms = new Date(sub.trialEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export function subscriptionExpiryMs() {
  const sub = loadSubscription();
  if (!sub || !sub.expiresAt) return null;
  return new Date(sub.expiresAt).getTime() - Date.now();
}

// ── Purchase flow ───────────────────────────────────────────────────────
export async function purchase(tier) {
  if (tier === 'trial')    return grantTrial();
  if (BILLING_MODE === 'preview')  return grantPreview(tier);
  if (BILLING_MODE === 'stripe')   return redirectToStripe(tier);
  if (BILLING_MODE === 'native')   return purchaseNativeFlow(tier);
  throw new Error('Unknown BILLING_MODE: ' + BILLING_MODE);
}

// Nativer Kauf (StoreKit): erst Store bestätigen lassen, dann lokal die
// Berechtigung gewähren (gleicher Pfad wie Preview/Stripe-Rückkehr).
async function purchaseNativeFlow(tier) {
  const r = await purchaseNative(tier);
  if (r && r.ok) return grantPreview(tier);
  return r || { ok: false, reason: 'native_failed' };
}

// Käufe wiederherstellen (Apple-Pflicht) — kein Bonus.
export async function restorePurchases() {
  const owned = await restoreNative();
  if (!owned) return { ok: false, reason: 'nothing_to_restore' };
  setEntitlement('lifetime');
  return { ok: true, restored: true };
}

// Beim App-Start (nativ) still abgleichen — kein Bonus.
export async function syncEntitlementsOnLaunch() {
  const owned = await syncEntitlementsNative();
  if (owned && !isActiveSubscription(loadSubscription())) {
    setEntitlement('lifetime');
    return true;
  }
  return false;
}

function grantTrial() {
  const existing = loadSubscription();
  if (existing && existing.tier === 'trial') return { ok: false, reason: 'already_trial' };
  if (existing && existing.lifetime)         return { ok: false, reason: 'already_premium' };

  const now = new Date();
  const end = new Date(now.getTime() + TRIAL_DAYS * 86400000);
  saveSubscription({
    tier:      'trial',
    since:     now.toISOString(),
    trialEnd:  end.toISOString(),
    expiresAt: end.toISOString(),
    lifetime:  false,
    active:    true,
    stripeCustomerId: null,
  });
  return { ok: true, tier: 'trial', welcomeBonus: 0 };
}

export function shouldGrantWelcomeBonus(prevSub) {
  return !isActiveSubscription(prevSub);
}

export function buildSub(tier, now = new Date()) {
  let expiresAt = null;
  let lifetime  = false;
  if (tier === 'monthly')  expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
  if (tier === 'yearly')   expiresAt = new Date(now.getTime() + 365 * 86400000).toISOString();
  if (tier === 'lifetime') lifetime  = true;
  return {
    tier, since: now.toISOString(), trialEnd: null,
    expiresAt, lifetime, active: true, stripeCustomerId: null,
  };
}

function setEntitlement(tier) {
  const def = SUB_TIERS[tier];
  if (!def) return { ok: false, reason: 'unknown_tier' };
  saveSubscription(buildSub(tier));
  return { ok: true, tier };
}

function grantPreview(tier) {
  const def = SUB_TIERS[tier];
  if (!def) return { ok: false, reason: 'unknown_tier' };

  const prev  = loadSubscription();
  const bonus = shouldGrantWelcomeBonus(prev) ? WELCOME_BONUS_BONES : 0;

  saveSubscription(buildSub(tier));
  if (bonus) earn(bonus);

  return { ok: true, tier, welcomeBonus: bonus };
}

function redirectToStripe(tier) {
  const url = STRIPE_LINKS[tier];
  if (!url) {
    console.error('No Stripe link configured for tier:', tier);
    return { ok: false, reason: 'no_link' };
  }
  window.location.href = url;
  return { ok: true, redirecting: true };
}

// ── Stripe return-URL handler (called from main boot) ──────────────────
export function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') !== '1') return null;
  const tier = params.get('tier');
  if (!tier || !SUB_TIERS[tier]) return null;

  const result = grantPreview(tier);

  // Clean URL so a reload doesn't re-grant
  const url = new URL(window.location.href);
  url.searchParams.delete('success');
  url.searchParams.delete('tier');
  window.history.replaceState({}, '', url.toString());

  return result;
}

// ── Admin / debug ───────────────────────────────────────────────────────
export function cancelSubscription() {
  const sub = loadSubscription();
  if (!sub) return;
  sub.active = false;
  saveSubscription(sub);
}
