'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   LAUNCH PROCEDURE
   ───────────────────────────────────────────────────────────────────────
   When Stripe is ready (company registered, account active):

   1. In js/constants.js:
      export const BILLING_MODE = 'stripe';
      export const STRIPE_LINKS = {
        monthly:  'https://buy.stripe.com/XXX',
        yearly:   'https://buy.stripe.com/YYY',
        lifetime: 'https://buy.stripe.com/ZZZ',
      };

   2. In each Stripe Payment Link:
      - Set success URL: https://kittysort.de/?success=1&tier=monthly
                                                         (change per tier)
      - Enable customer email collection
      - Enable 7-day trial on monthly/yearly (optional — current client-side
        trial still works, Stripe trial adds real-card verification)

   3. Test with Stripe's test mode (4242 4242 4242 4242) before going live.

   4. Deploy. The handleStripeReturn() handler below automatically grants
      the appropriate subscription status when Stripe redirects back.

   For iOS/Android native IAP: set BILLING_MODE = 'native' and implement
   a native-bridge in a separate js/native-billing.js module.
   ══════════════════════════════════════════════════════════════════════════ */

import { BILLING_MODE, STRIPE_LINKS, SUB_TIERS, TRIAL_DAYS, WELCOME_BONUS_BONES } from './constants.js';
import { loadSubscription, saveSubscription } from './storage.js';
import { earn } from './economy.js';

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
  if (BILLING_MODE === 'native')   throw new Error('Native IAP not implemented');
  throw new Error('Unknown BILLING_MODE: ' + BILLING_MODE);
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

function grantPreview(tier) {
  const def = SUB_TIERS[tier];
  if (!def) return { ok: false, reason: 'unknown_tier' };

  const now = new Date();
  let expiresAt = null;
  let lifetime  = false;
  if (tier === 'monthly')  expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
  if (tier === 'yearly')   expiresAt = new Date(now.getTime() + 365 * 86400000).toISOString();
  if (tier === 'lifetime') lifetime  = true;

  saveSubscription({
    tier,
    since:     now.toISOString(),
    trialEnd:  null,
    expiresAt,
    lifetime,
    active:    true,
    stripeCustomerId: null,
  });

  earn(WELCOME_BONUS_BONES);
  return { ok: true, tier, welcomeBonus: WELCOME_BONUS_BONES };
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
