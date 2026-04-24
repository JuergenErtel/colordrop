# Kittysort Premium-Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Kittysort from one-time 4,99€ purchase to a launch-ready subscription product. All features are fully client-side and functional; payment integration is abstracted behind a `BILLING_MODE` switch that flips from `preview` to `stripe` in a single config change once the company is founded.

**Architecture:** A central `billing.js` module abstracts all payment flows; three modes (`preview` / `stripe` / `native`). Subscription state replaces the legacy `catsort_premium: true` boolean via one-time migration. Season Pass, Lives System, Contextual Paywalls, Pseudo-Leaderboard, and Premium-Status-Signals layer on top. Existing `isPremium()` callers remain unchanged — the implementation rewires to the new storage.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas, CSS3, no frameworks. No test suite exists — verification is via dev server (`python -m http.server 8000` in the project root) and manual browser testing. Commits after each task.

**Source spec:** `docs/superpowers/specs/2026-04-23-kittysort-premium-overhaul-design.md`

**Execution note:** This plan contains ~40 tasks across 10 phases. Each phase ends with a verification checkpoint. Tasks within a phase build incrementally; phases are mostly independent but **Phase 1 must ship before all others**. Recommended cadence: one phase per implementation session.

---

## Phase Overview

| Phase | Focus | Tasks | Files Added/Changed |
|---|---|---|---|
| 1 | Foundation (Billing, Storage, Economy) | 6 | `billing.js`, `storage.js`, `economy.js`, `constants.js`, `skins.js`, `main.js` |
| 2 | Paywall UI | 4 | `paywall.js`, `premium.css`, `index.html` |
| 3 | Premium Status Signals | 4 | `css/game.css`, `css/panels.css`, `css/splash.css`, `main.js`, `cat-renderer.js` |
| 4 | Season Pass Core | 6 | `season.js`, `season-content.js`, `season.css`, `storage.js`, `main.js`, `index.html` |
| 5 | Season Content (Kirschblüte) | 4 | `cats.js`, `cat-renderer.js`, `background.js`, `balls.js` |
| 6 | Lives System | 3 | `lives.js`, `storage.js`, `main.js`, `css/game.css` |
| 7 | Contextual Paywalls | 3 | `paywall.js`, `main.js`, `storage.js` |
| 8 | Pseudo-Leaderboard | 4 | `leaderboard.js`, `storage.js`, `main.js`, `index.html` |
| 9 | Visual Polish | 4 | `splash.js`, `splash.css`, `panels.css`, `main.js` |
| 10 | Launch Prep | 2 | `billing.js`, integration sweep |

---

## Phase 1: Foundation (Billing, Storage, Economy)

**Ships:** A working subscription-state backend + rebalanced economy + billing abstraction in preview mode. After this phase, existing gameplay is unchanged visually, but internally premium status lives in the new subscription record, and hint/shop costs are rebalanced.

### Task 1.1: Rebalance rewards and hint costs in constants

**Files:**
- Modify: `js/constants.js` (REWARDS block, new HINT_COSTS block)

- [x] **Step 1: Update `REWARDS` and add `HINT_COSTS` + `BILLING_MODE` placeholders**

Replace the existing `REWARDS` export (around line 184-188) with:

```javascript
export const REWARDS = {
  levelWin:     2,    // rebalanced from 5
  threeStarWin: 5,    // rebalanced from 10
  dailyWin:     15,   // rebalanced from 25
  blitzWin:     3,
  rewardedAd:   20,
};

export const HINT_COSTS = {
  EASY:   10,
  MEDIUM: 20,
  HARD:   35,
  EXPERT: 60,
  MASTER: 100,
};

// Legacy single-value cost (used until hint call sites adopt getHintCost)
export const COSTS = { hint: 15, extraUndo: 10 };

// ── Billing mode (flip to 'stripe' at launch) ────────────────────────────
export const BILLING_MODE = 'preview';    // 'preview' | 'stripe' | 'native'

export const STRIPE_LINKS = {
  monthly:  '',   // fill at launch
  yearly:   '',
  lifetime: '',
};

// ── Subscription-tier constants ──────────────────────────────────────────
export const SUB_TIERS = {
  monthly:  { price: '3,99€',   priceNum: 3.99,  cycle: 'month',    label: 'Monatlich' },
  yearly:   { price: '29,99€',  priceNum: 29.99, cycle: 'year',     label: 'Jährlich',   highlight: '-37%' },
  lifetime: { price: '39,99€',  priceNum: 39.99, cycle: 'lifetime', label: 'Forever' },
};

export const WELCOME_BONUS_BONES = 500;
export const TRIAL_DAYS          = 7;
```

- [x] **Step 2: Verify no syntax errors**

Run: `node --check js/constants.js`
Expected: no output (success)

- [x] **Step 3: Commit**

```bash
git add js/constants.js
git commit -m "economy: rebalance rewards/hint costs, add billing mode constants"
```

---

### Task 1.2: Add `getHintCost(tier)` to economy and wire HUD

**Files:**
- Modify: `js/economy.js` (add `getHintCost`, update `canUseHint`/`spendHint`)
- Modify: `js/main.js` (HUD hint button shows dynamic cost)

- [x] **Step 1: Update `js/economy.js` — replace imports + hint section**

At top (line 3):
```javascript
import { REWARDS, COSTS, HINT_COSTS } from './constants.js';
```

Replace the hint section (lines 108-117) with:
```javascript
// ── Hints ─────────────────────────────────────────────────────────────────
export function getHintCost(tierName) {
  return HINT_COSTS[tierName] ?? COSTS.hint;
}

export function canUseHint(tierName = 'EASY') {
  if (isPremium()) return true;
  return canAfford(getHintCost(tierName));
}

export function spendHint(tierName = 'EASY') {
  if (isPremium()) return true;
  return spend(getHintCost(tierName));
}
```

- [x] **Step 2: Update HUD hint cost display in `js/main.js`**

Find the block that sets the hint button cost (search for `hintCost`). Replace the static `15` with a function that reads the current tier from `G.theme` (the active difficulty).

Search for `hintCost` references and update each so the label uses `getHintCost(G.theme || 'EASY')`:
```javascript
function updateHintCostDisplay() {
  const tier = G.theme || 'EASY';
  const cost = getHintCost(tier);
  const el = document.getElementById('hintCost');
  if (el) el.innerHTML = '<i class="fishbone"></i>' + cost;
}
```

Import `getHintCost` at the top of main.js (in the existing economy import block, around line 13):
```javascript
import {
  getBalance, setBalance, earn, calcWinReward, isPremium, setPremium,
  canUndo, trackUndo, resetUndos, getUndosLeft,
  canUseHint, spendHint, getHintCost,
  shouldShowAd, markAdShown, tickAdLevel,
} from './economy.js';
```

Call `updateHintCostDisplay()` at every tier change (search for `G.theme =` assignments and after each, call it) and on HUD init.

- [x] **Step 3: Update all `spendHint()`/`canUseHint()` call sites to pass tier**

In main.js, find calls to `spendHint()` and `canUseHint()`. Replace with:
```javascript
spendHint(G.theme || 'EASY')
canUseHint(G.theme || 'EASY')
```

- [x] **Step 4: Manual test — start dev server**

Run in project root: `python -m http.server 8000`
Open `http://localhost:8000` in browser. Play level 1 → HUD should show hint cost "10" (EASY), not "15". Advance to level 16 (MEDIUM) → shows "20". Use a hint → balance decreases by 10 / 20 appropriately.

- [x] **Step 5: Commit**

```bash
git add js/economy.js js/main.js
git commit -m "economy: scale hint cost by difficulty tier"
```

---

### Task 1.3: Raise shop prices

**Files:**
- Modify: `js/skins.js` (SKIN_DEFS + BG_DEFS cost values)

- [x] **Step 1: Replace `SKIN_DEFS` and `BG_DEFS` (lines 6-19)**

```javascript
export const SKIN_DEFS = {
  default:  { name: 'Wollknäuel', cost: 0,   milestone: null },
  glitter:  { name: 'Glitzer',         cost: 120, milestone: 150 },
  crystal:  { name: 'Kristall',        cost: 200, milestone: null },
  gold:     { name: 'Goldfaden',       cost: 350, milestone: 300 },
};

export const BG_DEFS = {
  cafe:    { name: 'Katzencafé',  cost: 0,   milestone: null },
  garden:  { name: 'Garten',           cost: 250, milestone: 50 },
  rooftop: { name: 'Dachterrasse',     cost: 450, milestone: 100 },
  winter:  { name: 'Winterstube',      cost: 650, milestone: 200 },
};
```

- [x] **Step 2: Manual test**

Dev server still running. Open Shop → verify new prices shown on all items. Try buying Glitter skin with insufficient bones → shake animation should trigger.

- [x] **Step 3: Commit**

```bash
git add js/skins.js
git commit -m "shop: raise prices (glitter 50→120, crystal 80→200, gold 100→350, BGs 100/150/200→250/450/650)"
```

---

### Task 1.4: Subscription storage schema + migration

**Files:**
- Modify: `js/storage.js` (new load/save functions, legacy migration)

- [x] **Step 1: Add subscription storage functions at the bottom of `js/storage.js`**

```javascript
// ── Subscription ────────────────────────────────────────────────────────
const KEY_SUBSCRIPTION = 'catsort_subscription';

export function loadSubscription() {
  try {
    const raw = localStorage.getItem(KEY_SUBSCRIPTION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveSubscription(sub) {
  try {
    localStorage.setItem(KEY_SUBSCRIPTION, JSON.stringify(sub));
  } catch { /* quota */ }
}

export function clearSubscription() {
  try { localStorage.removeItem(KEY_SUBSCRIPTION); } catch {}
}

// ── Paywall trigger state ───────────────────────────────────────────────
const KEY_PAYWALL = 'catsort_paywall_state';

export function loadPaywallState() {
  try {
    const raw = localStorage.getItem(KEY_PAYWALL);
    if (!raw) return { shown: [], lastHint3rd: 0, lastLives0: 0 };
    return JSON.parse(raw);
  } catch { return { shown: [], lastHint3rd: 0, lastLives0: 0 }; }
}

export function savePaywallState(s) {
  try { localStorage.setItem(KEY_PAYWALL, JSON.stringify(s)); } catch {}
}

// ── Lives ───────────────────────────────────────────────────────────────
const KEY_LIVES = 'catsort_lives';

export function loadLives() {
  try {
    const raw = localStorage.getItem(KEY_LIVES);
    if (!raw) return { count: 5, lastRegen: new Date().toISOString() };
    return JSON.parse(raw);
  } catch { return { count: 5, lastRegen: new Date().toISOString() }; }
}

export function saveLives(state) {
  try { localStorage.setItem(KEY_LIVES, JSON.stringify(state)); } catch {}
}

// ── Season progress ─────────────────────────────────────────────────────
const KEY_SEASON = 'catsort_season';

export function loadSeasonProgress() {
  try {
    const raw = localStorage.getItem(KEY_SEASON);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveSeasonProgress(state) {
  try { localStorage.setItem(KEY_SEASON, JSON.stringify(state)); } catch {}
}

// ── Leaderboard ─────────────────────────────────────────────────────────
const KEY_LB_ID      = 'catsort_leaderboard_id';
const KEY_LB_HISTORY = 'catsort_leaderboard_history';

export function loadLeaderboardId() {
  try {
    const raw = localStorage.getItem(KEY_LB_ID);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveLeaderboardId(obj) {
  try { localStorage.setItem(KEY_LB_ID, JSON.stringify(obj)); } catch {}
}

export function loadLeaderboardHistory() {
  try {
    const raw = localStorage.getItem(KEY_LB_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveLeaderboardHistory(arr) {
  try { localStorage.setItem(KEY_LB_HISTORY, JSON.stringify(arr)); } catch {}
}

// ── Migration: legacy premium → subscription (Founder tier) ─────────────
export function migrateToSubscriptionModel() {
  if (loadSubscription()) return; // already migrated or fresh install with new model
  const legacy = localStorage.getItem('catsort-premium') || localStorage.getItem('catsort_premium');
  if (legacy === 'true' || legacy === true) {
    saveSubscription({
      tier:      'founder',
      since:     new Date().toISOString(),
      lifetime:  true,
      active:    true,
      trialEnd:  null,
      expiresAt: null,
      stripeCustomerId: null,
    });
  }
}
```

- [x] **Step 2: Check existing premium storage key name**

Search existing storage.js for `premium` to find the exact legacy key. Update the migration function's `localStorage.getItem(...)` calls to match whichever key is actually used (`catsort-premium` vs `catsort_premium`). Keep both as fallbacks to be safe.

```bash
grep -n "premium" js/storage.js
```

- [x] **Step 3: Call migration at module load**

At the very bottom of `js/storage.js`, add:
```javascript
// Run migration once per page load
migrateToSubscriptionModel();
```

- [x] **Step 4: Manual test**

In browser DevTools console:
```javascript
localStorage.setItem('catsort-premium', 'true');
location.reload();
// After reload:
JSON.parse(localStorage.getItem('catsort_subscription'));
// → should show { tier: 'founder', lifetime: true, active: true, ... }
```

Then:
```javascript
localStorage.removeItem('catsort_subscription');
localStorage.removeItem('catsort-premium');
location.reload();
localStorage.getItem('catsort_subscription');  // → null (fresh install)
```

- [x] **Step 5: Commit**

```bash
git add js/storage.js
git commit -m "storage: subscription model with founder grandfathering migration"
```

---

### Task 1.5: Billing abstraction module

**Files:**
- Create: `js/billing.js`

- [x] **Step 1: Create `js/billing.js`**

```javascript
'use strict';

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
  return sub && sub.tier === 'founder';
}

export function isTrial() {
  const sub = loadSubscription();
  return sub && sub.tier === 'trial' && isActiveSubscription(sub);
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

  const now     = new Date();
  const end     = new Date(now.getTime() + TRIAL_DAYS * 86400000);
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
  if (tier === 'monthly') expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
  if (tier === 'yearly')  expiresAt = new Date(now.getTime() + 365 * 86400000).toISOString();
  if (tier === 'lifetime') lifetime = true;

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
  // Return URL handler (in main.js boot) parses ?success=1&tier=... and completes the grant
  window.location.href = url;
  return { ok: true, redirecting: true };
}

// ── Stripe return-URL handler (called from main boot) ──────────────────
export function handleStripeReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('success') !== '1') return null;
  const tier = params.get('tier');
  if (!tier || !SUB_TIERS[tier]) return null;

  // Treat as preview-mode grant (in real Stripe flow, webhook/Customer Portal confirms — but for client-only launch, trust the return URL)
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
```

- [x] **Step 2: Verify**

Run: `node --check js/billing.js`
Expected: no output.

- [x] **Step 3: Commit**

```bash
git add js/billing.js
git commit -m "billing: add abstraction with preview/stripe/native modes and purchase flow"
```

---

### Task 1.6: Rewire `isPremium()` to subscription model

**Files:**
- Modify: `js/economy.js` (replace `isPremium`/`setPremium` body)

- [x] **Step 1: Replace the Premium section in `js/economy.js` (lines ~30-37)**

```javascript
// ── Premium (delegates to subscription) ──────────────────────────────────
import { loadSubscription, saveSubscription } from './storage.js';

function subIsActive() {
  const sub = loadSubscription();
  if (!sub || !sub.active) return false;
  if (sub.lifetime) return true;
  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
    sub.active = false;
    saveSubscription(sub);
    return false;
  }
  return true;
}

export function isPremium() {
  return subIsActive();
}

/**
 * Legacy shim. Only used for dev/debug; real grants go via billing.js.
 * If called with `true`, creates a lifetime subscription.
 */
export function setPremium(val) {
  if (val) {
    const existing = loadSubscription();
    if (existing && existing.active) return;
    saveSubscription({
      tier:      'founder',   // treat manual set as founder
      since:     new Date().toISOString(),
      lifetime:  true,
      active:    true,
      trialEnd:  null,
      expiresAt: null,
      stripeCustomerId: null,
    });
  } else {
    const sub = loadSubscription();
    if (sub) { sub.active = false; saveSubscription(sub); }
  }
}
```

Remove the old import `import { loadEconomy, saveEconomy, loadPremium, savePremium } from './storage.js';` and replace with:
```javascript
import { loadEconomy, saveEconomy } from './storage.js';
```

(Do NOT remove `loadPremium`/`savePremium` from `storage.js` yet — they may still be referenced; can prune in a later task.)

- [x] **Step 2: Manual test**

Dev server running. In DevTools:
```javascript
localStorage.clear();
location.reload();
// Fresh install — premium banner visible
// Click premium button (the old 4,99€ banner at bottom)
JSON.parse(localStorage.getItem('catsort_subscription'));
// → should show { tier: 'founder', lifetime: true, active: true, ... }
// Banner should hide
```

- [x] **Step 3: Commit**

```bash
git add js/economy.js
git commit -m "economy: rewire isPremium to subscription model, keep legacy setPremium shim"
```

---

### Phase 1 Checkpoint

Verify all of the following before moving to Phase 2:

- [x] Existing 4,99€-bought users (with `catsort-premium: true`) retain premium on first load post-update, with `tier: 'founder'`
- [x] HUD hint cost scales with difficulty (10/20/35/60/100)
- [x] Shop shows new prices (120/200/350 skins, 250/450/650 BGs)
- [x] All existing gameplay unaffected; `isPremium()` still works everywhere
- [x] Browser console has no errors at boot or during play

---

## Phase 2: Paywall UI

**Ships:** A fullscreen tiered paywall screen with three cards (Monthly / Yearly / Lifetime), a trial CTA, and a celebration overlay replacing the `alert()`. Tied to `billing.purchase()`. Premium banner is replaced by a proper paywall modal.

### Task 2.1: Paywall HTML skeleton

**Files:**
- Modify: `index.html` (add paywall screen + celebration overlay)

- [x] **Step 1: Replace the existing `<!-- Premium Banner -->` block and `<!-- Ad Interstitial -->` block (around lines 423-441) with:**

```html
    <!-- Paywall Screen -->
    <div id="paywallScreen" class="screen-overlay sheet-panel hidden paywall-screen">
      <div class="paywall-card">
        <button class="paywall-close" id="paywallCloseBtn" aria-label="Schließen">✕</button>

        <div class="paywall-header">
          <div class="paywall-crown">👑</div>
          <h2 class="paywall-title">KITTYSORT CLUB</h2>
          <p class="paywall-subtitle">Neue Katzen, neue Saisons, jeden Monat</p>
        </div>

        <div class="paywall-tiers">
          <button class="paywall-tier" data-tier="monthly">
            <div class="paywall-tier-label">Monatlich</div>
            <div class="paywall-tier-price">3,99€</div>
            <div class="paywall-tier-cycle">/ Monat</div>
          </button>
          <button class="paywall-tier paywall-tier--highlight" data-tier="yearly">
            <div class="paywall-tier-badge">BELIEBT · -37%</div>
            <div class="paywall-tier-label">Jährlich</div>
            <div class="paywall-tier-price">29,99€</div>
            <div class="paywall-tier-cycle">= 2,50€ / Monat</div>
          </button>
          <button class="paywall-tier" data-tier="lifetime">
            <div class="paywall-tier-label">Forever</div>
            <div class="paywall-tier-price">39,99€</div>
            <div class="paywall-tier-cycle">einmalig</div>
          </button>
        </div>

        <ul class="paywall-features">
          <li>✓ Saison-Pass — jeden Monat neu</li>
          <li>✓ Exklusive Saison-Katzen</li>
          <li>✓ Keine Werbung</li>
          <li>✓ Unbegrenzte Hints &amp; Undos</li>
          <li>✓ 2× Fischgräten</li>
          <li>✓ Premium Avatar-Rahmen</li>
          <li>✓ Unbegrenzte Lives</li>
        </ul>

        <button class="paywall-buy premium-cta" id="paywallBuyBtn">
          <span id="paywallBuyLabel">7 TAGE KOSTENLOS TESTEN</span>
        </button>

        <p class="paywall-footnote" id="paywallFootnote">
          Preview-Modus — Premium wird ohne Zahlung aktiviert
        </p>
      </div>
    </div>

    <!-- Premium Celebration -->
    <div id="premiumCelebration" class="screen-overlay celebration-overlay hidden">
      <canvas id="celebrationConfetti" class="confetti-canvas"></canvas>
      <div class="celebration-flash"></div>
      <div class="celebration-content">
        <div class="celebration-crown">👑</div>
        <h2 class="celebration-title" id="celebrationTitle">Willkommen im Club!</h2>
        <p class="celebration-sub" id="celebrationSub"></p>
        <div class="celebration-bones" id="celebrationBones">
          <i class="fishbone"></i> <span id="celebrationBonesCount">0</span> Willkommens-Fischgräten
        </div>
        <div class="celebration-cats" id="celebrationCats"></div>
        <div class="celebration-actions">
          <button class="win-btn" id="celebrationPassBtn">Zum Season Pass</button>
          <button class="win-btn win-btn--secondary" id="celebrationSkipBtn">Erst mal weiterspielen</button>
        </div>
      </div>
    </div>

    <!-- Ad Interstitial (unchanged but premium button now opens paywall) -->
    <div id="adOverlay" class="overlay">
      <div class="win-card">
        <div class="win-icon">📺</div>
        <h2 class="win-title" style="font-size:1.2rem">WERBUNG</h2>
        <p class="win-sub">Werbefrei spielen mit Premium!</p>
        <div class="win-actions">
          <button class="win-btn" id="adSkipBtn" type="button">Weiter →</button>
          <button class="win-btn win-btn--secondary premium-cta" id="adPremiumBtn" type="button">Zum Club</button>
        </div>
      </div>
    </div>
```

- [x] **Step 2: Add `<link rel="stylesheet" href="css/premium.css">` in the `<head>` CSS block, after `splash.css`**

- [x] **Step 3: Manual test — page still loads**

Reload browser. Console should show no missing-file errors (404 on premium.css is OK at this step — we create it next). Page renders normally with paywall overlay hidden.

- [x] **Step 4: Commit**

```bash
git add index.html
git commit -m "paywall: add paywall screen + celebration overlay HTML"
```

---

### Task 2.2: Paywall CSS

**Files:**
- Create: `css/premium.css`

- [x] **Step 1: Create `css/premium.css`**

```css
/* ══════════════════════════════════════════════════════════════════════
   PREMIUM — Paywall, Celebration, Gold-Foil CTAs, Status Signals
   ══════════════════════════════════════════════════════════════════════ */

/* ── Paywall Screen ─────────────────────────────────────── */
.paywall-screen {
  display: flex; align-items: center; justify-content: center;
  background: rgba(20,12,30,.88);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  z-index: 9600;
}
.paywall-card {
  width: 100%; max-width: 420px;
  background: linear-gradient(180deg, #2a1f2e 0%, #1a1020 100%);
  border: 1px solid rgba(255,215,0,.22);
  border-radius: 20px;
  padding: 1.6rem 1.3rem 1.3rem;
  position: relative;
  box-shadow: 0 10px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,215,0,.12);
  max-height: 92vh; overflow-y: auto;
}
.paywall-close {
  position: absolute; top: .8rem; right: 1rem;
  background: none; border: none; color: rgba(255,255,255,.4);
  font-size: 1.2rem; cursor: pointer;
}
.paywall-header { text-align: center; margin-bottom: 1.2rem; }
.paywall-crown {
  font-size: 2.4rem;
  filter: drop-shadow(0 0 14px rgba(255,215,0,.6));
  margin-bottom: .2rem;
}
.paywall-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.35rem; font-weight: 700; letter-spacing: .15em;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}
.paywall-subtitle {
  font-size: .78rem; color: rgba(255,255,255,.6);
  margin: .3rem 0 0;
}

/* ── Tier Cards ─────────────────────────────────────────── */
.paywall-tiers {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: .5rem; margin-bottom: 1rem;
}
.paywall-tier {
  position: relative;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  padding: .8rem .4rem;
  cursor: pointer; text-align: center;
  transition: transform .15s, border-color .15s, background .15s;
  font-family: 'Fredoka', sans-serif;
  color: rgba(255,255,255,.85);
}
.paywall-tier:hover { transform: translateY(-2px); border-color: rgba(255,215,0,.3); }
.paywall-tier.selected {
  border-color: rgba(255,215,0,.7);
  background: linear-gradient(180deg, rgba(255,215,0,.12), rgba(255,140,0,.06));
  box-shadow: 0 0 16px rgba(255,215,0,.25);
}
.paywall-tier--highlight {
  border-color: rgba(255,215,0,.5);
  background: linear-gradient(180deg, rgba(255,215,0,.08), rgba(255,140,0,.03));
}
.paywall-tier-badge {
  position: absolute; top: -.5rem; left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  color: #4a2000; font-size: .55rem; font-weight: 700;
  padding: .15rem .55rem; border-radius: 100px;
  letter-spacing: .1em; white-space: nowrap;
}
.paywall-tier-label {
  font-size: .62rem; letter-spacing: .1em; text-transform: uppercase;
  color: rgba(255,255,255,.6); margin-bottom: .2rem;
}
.paywall-tier-price {
  font-size: 1.1rem; font-weight: 700;
  color: #FFD700;
}
.paywall-tier-cycle {
  font-size: .58rem; color: rgba(255,255,255,.5);
  margin-top: .1rem;
}

/* ── Feature list ───────────────────────────────────────── */
.paywall-features {
  list-style: none; padding: 0; margin: .8rem 0;
  font-size: .8rem; color: rgba(255,255,255,.8);
}
.paywall-features li {
  padding: .25rem 0; padding-left: .2rem;
}

/* ── Buy Button + Gold-Foil ─────────────────────────────── */
.premium-cta {
  position: relative; overflow: hidden;
}
.paywall-buy {
  width: 100%; padding: 1rem;
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem; font-weight: 700; letter-spacing: .1em;
  border: none; border-radius: 100px;
  background: linear-gradient(110deg, #FFD700 0%, #FFF8DC 45%, #FFD700 50%, #FFB800 55%, #FFD700 100%);
  background-size: 200% 100%;
  color: #4a2000; cursor: pointer;
  box-shadow: 0 4px 0 #B8860B, 0 6px 18px rgba(0,0,0,.35);
  animation: shimmer 3s linear infinite;
  text-transform: uppercase;
}
.paywall-buy:hover { transform: translateY(-2px); box-shadow: 0 6px 0 #B8860B, 0 8px 22px rgba(0,0,0,.4); }
.paywall-buy:active { transform: translateY(2px); box-shadow: 0 2px 0 #B8860B; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.paywall-footnote {
  text-align: center; font-size: .65rem;
  color: rgba(255,255,255,.4);
  margin: .8rem 0 0;
}

/* ── Celebration Overlay ────────────────────────────────── */
.celebration-overlay {
  display: flex; align-items: center; justify-content: center;
  background: rgba(8,4,20,.94);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  z-index: 9700;
  overflow: hidden;
}
.celebration-flash {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(255,215,0,.35) 0%, transparent 60%);
  opacity: 0; pointer-events: none;
  animation: celebrationFlash 1.2s ease-out forwards;
}
.celebration-overlay.show .celebration-flash { animation: celebrationFlash 1.2s ease-out; }
@keyframes celebrationFlash {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  100% { opacity: 0; }
}
.celebration-content {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding: 2rem 1rem;
  max-width: 400px;
}
.celebration-crown {
  font-size: 4.5rem;
  filter: drop-shadow(0 0 24px rgba(255,215,0,.8));
  animation: crownDrop .6s cubic-bezier(.2,1.8,.4,1) .3s both;
  opacity: 0;
}
@keyframes crownDrop {
  0%   { transform: translateY(-200px) scale(.5); opacity: 0; }
  60%  { transform: translateY(20px) scale(1.1); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
.celebration-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.6rem; font-weight: 700;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: .8rem 0 .3rem;
  animation: fadeInUp .6s ease-out 1.8s both;
}
.celebration-sub {
  font-size: .95rem; color: rgba(255,255,255,.85);
  margin: .3rem 0 1rem;
  animation: fadeInUp .6s ease-out 2s both;
}
.celebration-bones {
  font-size: 1.1rem; color: #FFD700;
  font-weight: 700;
  margin: .6rem 0;
  animation: fadeInUp .6s ease-out 2.2s both;
}
.celebration-cats {
  display: flex; gap: .4rem; justify-content: center;
  margin: 1rem 0;
  min-height: 80px;
}
.celebration-cat {
  width: 72px; height: 72px;
  opacity: 0;
  animation: catFlyIn .6s cubic-bezier(.2,1.6,.4,1) both;
}
@keyframes catFlyIn {
  0%   { transform: translateX(200px) scale(.3); opacity: 0; }
  100% { transform: translateX(0) scale(1); opacity: 1; }
}
@keyframes fadeInUp {
  0%   { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
.celebration-actions {
  display: flex; flex-direction: column; gap: .5rem;
  margin-top: 1.2rem; width: 100%;
  animation: fadeInUp .6s ease-out 3s both;
}

/* ── Premium Status Signals (used from Phase 3, defined here) ─── */
.hud-crown {
  display: inline-block;
  font-size: .9rem; margin-right: .3rem;
  filter: drop-shadow(0 0 4px rgba(255,215,0,.6));
  animation: crownPulse 3s ease-in-out infinite;
}
@keyframes crownPulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(255,215,0,.6)); }
  50%      { filter: drop-shadow(0 0 10px rgba(255,215,0,.9)); }
}
.premium-gold-tint {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 20%, rgba(255,215,0,.08) 0%, transparent 60%);
  z-index: 1;
}
.founder-badge {
  display: inline-block;
  background: linear-gradient(135deg, #C0C0C0, #E8E8E8);
  color: #333;
  font-size: .55rem; font-weight: 700;
  padding: .15rem .55rem; border-radius: 100px;
  letter-spacing: .1em; margin-left: .3rem;
}
.club-badge {
  display: inline-block;
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  color: #4a2000;
  font-size: .55rem; font-weight: 700;
  padding: .15rem .55rem; border-radius: 100px;
  letter-spacing: .1em; margin-left: .3rem;
}
```

- [x] **Step 2: Manual test**

Reload browser. Premium CSS loads without 404. Paywall not yet wired — next task.

- [x] **Step 3: Commit**

```bash
git add css/premium.css
git commit -m "paywall: gold-foil CSS for paywall + celebration + status signals"
```

---

### Task 2.3: Paywall logic module

**Files:**
- Create: `js/paywall.js`

- [x] **Step 1: Create `js/paywall.js`**

```javascript
'use strict';

import { SUB_TIERS, BILLING_MODE, WELCOME_BONUS_BONES } from './constants.js';
import { purchase, isActiveSubscription } from './billing.js';
import { loadSubscription } from './storage.js';
import { getBalance } from './economy.js';
import { playSound } from './audio.js';

let _selectedTier = 'yearly';  // default
let _onCloseCallback = null;

// ── Show / hide ─────────────────────────────────────────────────────────
export function showPaywall(opts = {}) {
  const screen = document.getElementById('paywallScreen');
  if (!screen) return;
  _onCloseCallback = opts.onClose || null;
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
  const hasSub = isActiveSubscription(loadSubscription());
  const label  = document.getElementById('paywallBuyLabel');
  const foot   = document.getElementById('paywallFootnote');
  if (!label) return;

  if (hasSub) {
    label.textContent = 'Du bist bereits Mitglied';
  } else if (!loadSubscription() || loadSubscription().tier !== 'trial') {
    // No trial used yet → offer trial as primary
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

  // If no trial ever used → grant trial first
  const useTrial = !sub || sub.tier !== 'trial';
  const tierToBuy = useTrial ? 'trial' : _selectedTier;

  const result = await purchase(tierToBuy);
  if (!result || !result.ok) {
    playSound('invalid');
    return;
  }
  if (result.redirecting) return;  // stripe flow

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
    if (sub) sub.textContent  = 'Alle Premium-Features aktiv';
    if (bones) bones.style.display = 'none';
  } else {
    if (title) title.textContent = 'Willkommen im Club!';
    if (sub) sub.textContent = SUB_TIERS[result.tier]?.label || '';
    if (bones) bones.style.display = '';
    animateBonesCounter(count, 0, result.welcomeBonus || WELCOME_BONUS_BONES, 2000);
  }

  // Placeholder cats (real implementation Phase 5 adds rendered silhouettes)
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
    document.getElementById('premiumCelebration').classList.remove('show');
    setTimeout(() => document.getElementById('premiumCelebration').classList.add('hidden'), 250);
  });
  document.getElementById('celebrationPassBtn')?.addEventListener('click', () => {
    document.getElementById('premiumCelebration').classList.remove('show');
    setTimeout(() => {
      document.getElementById('premiumCelebration').classList.add('hidden');
      // Phase 4 hook: open season pass screen
      document.getElementById('seasonPassBtn')?.click();
    }, 250);
  });
}
```

- [x] **Step 2: Commit**

```bash
git add js/paywall.js
git commit -m "paywall: tier selection + trial/purchase + celebration logic"
```

---

### Task 2.4: Wire paywall into main.js boot + replace old premium button

**Files:**
- Modify: `js/main.js` (imports, init call, old button handlers)

- [x] **Step 1: Add imports near top of main.js (in the import block around lines 1-20)**

```javascript
import { initPaywallUI, showPaywall } from './paywall.js';
import { handleStripeReturn, isFounder } from './billing.js';
```

- [x] **Step 2: Find the boot/init code (search for `DOMContentLoaded` or where event handlers are attached near end of main.js). Add:**

```javascript
initPaywallUI();

// Handle Stripe return URL (no-op in preview mode)
const stripeResult = handleStripeReturn();
if (stripeResult && stripeResult.ok) {
  import('./paywall.js').then(({ showCelebration }) => showCelebration(stripeResult));
}
```

- [x] **Step 3: Replace the old `premiumBtn` click handler (around main.js:2480)**

```javascript
// ── Premium entry points (all route to paywall) ─────────────────────
document.getElementById('premiumBtn')?.addEventListener('click', () => {
  showPaywall();
});
document.getElementById('premiumDismiss')?.addEventListener('click', () => {
  document.getElementById('premiumBanner')?.classList.add('hidden');
});
document.getElementById('adPremiumBtn')?.addEventListener('click', () => {
  document.getElementById('adOverlay').classList.remove('show');
  showPaywall();
});
document.getElementById('adSkipBtn')?.addEventListener('click', () => {
  document.getElementById('adOverlay').classList.remove('show');
  document.getElementById('overlay').classList.add('show');
});
```

(Remove the old `setPremium(true); alert(...)` blocks.)

- [x] **Step 4: Manual test**

Reload browser. `localStorage.clear(); location.reload();` in console. Click premium banner's 4,99€ button → paywall opens. Select each tier → highlight moves. Click "7 TAGE GRATIS TESTEN" → celebration shows, confetti placeholder (confetti itself wired in Phase 3), then closes. Check `localStorage.getItem('catsort_subscription')` → shows trial tier.

Cancel trial in console:
```javascript
localStorage.removeItem('catsort_subscription');
location.reload();
```
Click paywall again → buy yearly → celebration + counter animates 0→500 → balance increased.

- [x] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "paywall: wire to main boot, replace old premium button/alert flow"
```

---

### Task 2.5: Add celebration confetti (reuse existing engine)

**Files:**
- Modify: `js/paywall.js` (import startConfetti, wire to celebration)
- Modify: `js/main.js` (ensure startConfetti accepts custom canvas id)

- [x] **Step 1: Check `startConfetti` signature in main.js**

Search main.js for `function startConfetti`. If it's hard-coded to `confettiCanvas`, make it parameterized:

```javascript
function startConfetti(canvasId = 'confettiCanvas') {
  const canvas = document.getElementById(canvasId);
  // ... rest unchanged
}
function stopConfetti(canvasId = 'confettiCanvas') {
  // ... similar pattern
}
```

Export them at module scope so paywall.js can use (either move to a new `js/confetti.js` module or expose via `window.startConfetti` temporarily — for this codebase use window.* since that matches existing style):

```javascript
window.startConfetti = startConfetti;
window.stopConfetti = stopConfetti;
```

- [x] **Step 2: In `js/paywall.js`, update `showCelebration` to trigger confetti**

After `playSound('cat_unlock');`, add:
```javascript
  if (window.startConfetti) window.startConfetti('celebrationConfetti');
  setTimeout(() => { if (window.stopConfetti) window.stopConfetti('celebrationConfetti'); }, 4500);
```

- [x] **Step 3: Manual test**

Reload. Trigger purchase → confetti rains over the celebration overlay.

- [x] **Step 4: Commit**

```bash
git add js/paywall.js js/main.js
git commit -m "paywall: reuse confetti engine for premium celebration"
```

---

### Phase 2 Checkpoint

- [x] Paywall opens from old premium banner button
- [x] Three tiers selectable, yearly default-highlighted
- [x] Trial granted on first buy (no card, marked preview)
- [x] Celebration plays: crown drop, confetti, bones counter, CTA buttons
- [x] `localStorage.catsort_subscription` reflects correct tier + expiresAt
- [x] No console errors

---

## Phase 3: Premium Status Signals

**Ships:** Visible indicators that a user is Premium (crown in HUD, gold menu tint, gold album frames, founder badges). Pure UI — no new logic beyond `isPremium()` / `isFounder()` checks.

### Task 3.1: HUD crown + bones glow

**Files:**
- Modify: `js/main.js` (`updateBonesDisplay` function)
- Modify: `css/game.css` (bones-display premium variant — OR use premium.css classes defined in 2.2)

- [x] **Step 1: In `js/main.js`, update `updateBonesDisplay()` (~line 107)**

```javascript
function updateBonesDisplay() {
  const isP = isPremium();
  const crown = isP ? '<span class="hud-crown">👑</span>' : '';
  document.getElementById('bonesDisplay').innerHTML = crown + FISHBONE_ICON + ' ' + getBalance();
  document.getElementById('bonesDisplay').classList.toggle('premium', isP);
}
```

- [x] **Step 2: Add to `css/game.css` near the hud-bones rule**

```css
.hud-bones.premium {
  background: linear-gradient(135deg, rgba(255,215,0,.15), rgba(255,140,0,.08));
  border-color: rgba(255,215,0,.35);
  box-shadow: inset 0 0 10px rgba(255,215,0,.15);
}
```

- [x] **Step 3: Call `updateBonesDisplay()` after any purchase (already happens via `earn()` in most places — verify by triggering trial/buy and watching HUD).**

- [x] **Step 4: Manual test**

Trigger purchase. HUD gets crown + golden bones pill.
Console: `import('./js/economy.js').then(m => { m.setPremium(false); document.getElementById('bonesDisplay').dispatchEvent(new Event('refresh')); });` → crown disappears.

- [x] **Step 5: Commit**

```bash
git add js/main.js css/game.css
git commit -m "premium: crown + gold bones pill in HUD for subscribers"
```

---

### Task 3.2: Menu gold tint + club badge

**Files:**
- Modify: `index.html` (add badge slot under logo)
- Modify: `js/main.js` (populate badge on menu open)

- [x] **Step 1: In `index.html`, inside `.ls-inner` after the tagline `<p>` (around line 56), insert:**

```html
<div class="ls-club-badge" id="lsClubBadge" style="display:none"></div>
```

- [x] **Step 2: Add CSS to `css/panels.css` near the tagline rules**

```css
.ls-club-badge {
  text-align: center;
  font-size: .65rem;
  letter-spacing: .15em;
  margin-top: -.3rem;
  margin-bottom: .3rem;
  font-weight: 700;
}
.ls-club-badge.founder {
  color: #C0C0C0;
  text-shadow: 0 0 8px rgba(192,192,192,.4);
}
.ls-club-badge.club {
  color: #FFD700;
  text-shadow: 0 0 8px rgba(255,215,0,.5);
  animation: clubPulse 3s ease-in-out infinite;
}
@keyframes clubPulse {
  0%, 100% { text-shadow: 0 0 8px rgba(255,215,0,.5); }
  50%      { text-shadow: 0 0 14px rgba(255,215,0,.8); }
}
.ls-inner.premium::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 20%, rgba(255,215,0,.06) 0%, transparent 65%);
  pointer-events: none; z-index: -1;
}
```

- [x] **Step 3: In `js/main.js`, add a helper and call it when menu opens**

```javascript
function updateMenuPremiumSignals() {
  const badge = document.getElementById('lsClubBadge');
  const inner = document.querySelector('.ls-inner');
  if (!badge || !inner) return;

  if (isFounder()) {
    badge.textContent = 'FOUNDER · DANKE FÜR DIE UNTERSTÜTZUNG';
    badge.className = 'ls-club-badge founder';
    badge.style.display = '';
    inner.classList.add('premium');
  } else if (isPremium()) {
    const sub = JSON.parse(localStorage.getItem('catsort_subscription') || '{}');
    const since = sub.since ? new Date(sub.since).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : '';
    badge.textContent = 'KLUB-MITGLIED SEIT ' + since.toUpperCase();
    badge.className = 'ls-club-badge club';
    badge.style.display = '';
    inner.classList.add('premium');
  } else {
    badge.style.display = 'none';
    inner.classList.remove('premium');
  }
}
```

Call `updateMenuPremiumSignals()` in the function that shows the level-select screen (search for `.level-select` + `show` class toggles — likely a `showLevelSelect` or similar function). Also call after purchase completes (add to celebration close handler).

- [x] **Step 4: Manual test**

Premium state → menu shows "KLUB-MITGLIED SEIT MAI 2026" (gold, pulsing).
Founder state (`localStorage.setItem('catsort-premium', 'true'); localStorage.removeItem('catsort_subscription'); location.reload();`) → shows "FOUNDER · DANKE FÜR DIE UNTERSTÜTZUNG" (silver).
Free state → no badge, no gold tint.

- [x] **Step 5: Commit**

```bash
git add index.html css/panels.css js/main.js
git commit -m "premium: menu club badge (founder vs club) + gold tint"
```

---

### Task 3.3: Album — gold frames for premium cats + founder badge

**Files:**
- Modify: `js/main.js` (album rendering — search for `renderAlbum` or similar)
- Modify: `css/panels.css` (new frame variants)

- [x] **Step 1: Add CSS to `css/panels.css` in the album-cell block**

```css
.album-cell.premium-unlocked {
  border-color: rgba(255,215,0,.5);
  background: linear-gradient(180deg, rgba(255,215,0,.08), rgba(255,140,0,.04));
  box-shadow: 0 0 12px rgba(255,215,0,.2);
}
.album-cell.founder-cat {
  position: relative;
}
.album-cell.founder-cat::after {
  content: 'FOUNDER';
  position: absolute; top: 4px; right: 4px;
  background: linear-gradient(135deg, #C0C0C0, #E8E8E8);
  color: #333; font-size: .5rem; font-weight: 700;
  padding: 2px 6px; border-radius: 100px;
  letter-spacing: .1em;
}
.album-cell.season-cat {
  background: linear-gradient(180deg, rgba(255,183,197,.1), rgba(255,105,180,.05));
  border-color: rgba(255,183,197,.5);
}
```

- [x] **Step 2: Find the album cell rendering in main.js (search for `album-cell` or `.album-grid`)**

Wherever a cell is constructed for an owned/unlocked cat, add classes based on cat metadata:

```javascript
function classifyCatCell(cat, owned) {
  const classes = ['album-cell'];
  if (!owned) { classes.push('locked'); return classes; }
  if (cat.premium)  classes.push('premium-unlocked');
  if (cat.founder)  classes.push('founder-cat');
  if (cat.season)   classes.push('season-cat');
  return classes;
}
```

Apply this helper in the existing render loop.

- [x] **Step 3: Manual test**

With an active premium state, open Album. Premium-unlocked cats (Aurora, Prism, Imperial, Galaxy, Diamond) have gold frames. Others plain.
Set `localStorage.setItem('catsort-premium', 'true')` then reload for founder. The premium cats now have silver FOUNDER badge in corner.

- [x] **Step 4: Commit**

```bash
git add js/main.js css/panels.css
git commit -m "premium: gold/founder/season frame variants in cat album"
```

---

### Task 3.4: Splash — premium welcome message

**Files:**
- Modify: `js/splash.js` (append welcome text when premium)
- Modify: `css/splash.css` (welcome text styling)

- [x] **Step 1: In `js/splash.js`, add a welcome-text injection during splash build**

Find where splash content is rendered. After the tagline/play button, add:

```javascript
import { isPremium, isFounder } from './billing.js';
import { loadSubscription } from './storage.js';

function injectPremiumWelcome() {
  const host = document.querySelector('.splash-content');
  if (!host || document.querySelector('.splash-welcome')) return;
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
```

Call `injectPremiumWelcome()` at splash boot (right after the splash DOM exists).

- [x] **Step 2: Add CSS to `css/splash.css`**

```css
.splash-welcome {
  position: absolute;
  bottom: 24vh;
  left: 50%;
  transform: translateX(-50%);
  font-size: .75rem;
  color: rgba(255,215,0,.85);
  letter-spacing: .1em;
  text-transform: uppercase;
  text-shadow: 0 2px 6px rgba(0,0,0,.6), 0 0 12px rgba(255,215,0,.3);
  z-index: 11;
  animation: splashWelcomeIn 1s ease-out 1.2s both;
}
@keyframes splashWelcomeIn {
  0%   { opacity: 0; transform: translateX(-50%) translateY(6px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

- [x] **Step 3: Manual test**

With premium active, hard-reload. Splash shows the welcome line just above the play button.

- [x] **Step 4: Commit**

```bash
git add js/splash.js css/splash.css
git commit -m "premium: splash shows 'Willkommen zurück, Club-Mitglied seit X'"
```

---

### Phase 3 Checkpoint

- [x] HUD shows crown + gold bones when premium
- [x] Menu shows club/founder badge + gold tint
- [x] Album shows gold frames on premium cats, silver founder badge
- [x] Splash shows personalized welcome for premium users
- [x] Free users see unchanged UI

---

## Phase 4: Season Pass Core

**Ships:** A fully functional 50-tier Season Pass with XP accrual, claim mechanics, monthly rollover, and a dedicated Pass screen. Rewards are wired (bones, skins, BGs, cats); actual Kirschblüte content comes in Phase 5.

### Task 4.1: Season data model and XP tables

**Files:**
- Create: `js/season.js`
- Create: `js/season-content.js`

- [x] **Step 1: Create `js/season-content.js` with the Kirschblüte definition + skeletons**

```javascript
'use strict';

/**
 * Season definitions. Keyed by 'YYYY-MM'.
 * Each season: { id, name, theme, startsAt, endsAt, palette, rewards }
 * Rewards array: one entry per tier (1..50), each { free: RewardDef|null, premium: RewardDef|null }
 * RewardDef: { kind, value, label, icon }
 *   kind: 'bones' | 'cat' | 'skin' | 'bg' | 'frame' | 'hint' | 'undo' | 'ad_skip'
 */

function bones(n)        { return { kind: 'bones',  value: n,  label: n + ' Fischgräten', icon: 'bone' }; }
function cat(id, name)   { return { kind: 'cat',    value: id, label: name,                icon: 'cat' }; }
function skin(id, name)  { return { kind: 'skin',   value: id, label: 'Skin: ' + name,     icon: 'skin' }; }
function bg(id, name)    { return { kind: 'bg',     value: id, label: 'BG: ' + name,       icon: 'bg' }; }
function frame(id, name) { return { kind: 'frame',  value: id, label: 'Rahmen: ' + name,   icon: 'frame' }; }
function hintR()         { return { kind: 'hint',   value: 1,  label: 'Free Hint',          icon: 'hint' }; }
function undoR()         { return { kind: 'undo',   value: 1,  label: 'Free Undo',          icon: 'undo' }; }
function adSkip()        { return { kind: 'ad_skip',value: 1,  label: 'Ad-Skip-Token',      icon: 'adskip' }; }

// ── Kirschblüte (May 2026) — fully specified ───────────────────────────
const KIRSCHBLUETE_REWARDS = Array.from({ length: 50 }, (_, i) => {
  const tier = i + 1;
  const out = { free: null, premium: null };

  // ── Free track: every 5 tiers ─────────────────────────────────
  if (tier ===  5) out.free = bones(10);
  if (tier === 10) out.free = bones(15);
  if (tier === 15) out.free = cat('mochi-sakura', 'Mochi-Sakura');
  if (tier === 20) out.free = bones(20);
  if (tier === 25) out.free = hintR();
  if (tier === 30) out.free = bones(25);
  if (tier === 35) out.free = undoR();
  if (tier === 40) out.free = bones(30);
  if (tier === 45) out.free = adSkip();
  if (tier === 50) out.free = bones(50);

  // ── Premium track: every tier ─────────────────────────────────
  if (tier >= 1 && tier <= 9)   out.premium = bones(10);
  if (tier === 10) out.premium = bg('kirschbluete', 'Kirschblüte');
  if (tier >= 11 && tier <= 19) out.premium = bones(15);
  if (tier === 20) out.premium = skin('sakura', 'Sakura');
  if (tier >= 21 && tier <= 29) out.premium = tier % 3 === 0 ? hintR() : bones(20);
  if (tier === 30) out.premium = cat('sakura', 'Sakura');
  if (tier >= 31 && tier <= 39) out.premium = bones(25);
  if (tier === 40) out.premium = cat('tsubaki', 'Tsubaki');
  if (tier >= 41 && tier <= 49) out.premium = bones(30);
  if (tier === 50) out.premium = { kind: 'bundle', items: [cat('hoshi', 'Hoshi'), frame('hanami', 'Hanami')], label: 'Hoshi + Hanami-Rahmen', icon: 'legendary' };

  return out;
});

export const SEASONS = {
  '2026-05': {
    id: 'kirschbluete',
    name: 'Kirschblüte',
    theme: 'Japanischer Frühling — Sakura, Pagoden, sanfte Rosatöne',
    palette: { primary: '#FFB7C5', secondary: '#8E6D8A', accent: '#FFD700', bg: '#2A1822' },
    emoji: '🌸',
    startsAt: '2026-05-01T00:00:00',
    endsAt:   '2026-05-31T23:59:59',
    rewards:  KIRSCHBLUETE_REWARDS,
  },

  // ── Skeletons for June & July — content TBD per spec §4.4 ───────
  '2026-06': {
    id: 'sommer-strand',
    name: 'Sommer-Strand',
    theme: 'Türkis, Sand, Palmen',
    palette: { primary: '#00B8D4', secondary: '#FFD54F', accent: '#FFAB00', bg: '#1A3A4A' },
    emoji: '🏖️',
    startsAt: '2026-06-01T00:00:00',
    endsAt:   '2026-06-30T23:59:59',
    rewards:  KIRSCHBLUETE_REWARDS,  // placeholder — replace with strand content when designed
  },
  '2026-07': {
    id: 'sternennacht',
    name: 'Sternennacht',
    theme: 'Dunkelblau, Sterne, Nebel',
    palette: { primary: '#1A237E', secondary: '#9FA8DA', accent: '#FFF59D', bg: '#0D1128' },
    emoji: '✨',
    startsAt: '2026-07-01T00:00:00',
    endsAt:   '2026-07-31T23:59:59',
    rewards:  KIRSCHBLUETE_REWARDS,  // placeholder
  },
};

export function getCurrentSeasonKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getCurrentSeason(now = new Date()) {
  const key = getCurrentSeasonKey(now);
  return SEASONS[key] || null;
}
```

- [x] **Step 2: Create `js/season.js`**

```javascript
'use strict';

import { SEASONS, getCurrentSeasonKey, getCurrentSeason } from './season-content.js';
import { loadSeasonProgress, saveSeasonProgress } from './storage.js';
import { earn } from './economy.js';
import { unlockSkin, unlockBg } from './skins.js';
import { loadCollection, saveCollection } from './storage.js';
import { isPremium } from './economy.js';

// ── XP amounts per action ───────────────────────────────────────────────
export const XP = {
  levelSolve:      10,
  threeStarLevel:  20,  // replaces levelSolve, not additive
  dailyChallenge:  50,
  weeklyStage:     40,
  blitzWin:        30,
  miniGameWin:     40,
  achievement:    100,
};

// ── XP required to reach given tier (inclusive)  ────────────────────────
export function xpForTier(tier) {
  if (tier <= 0)  return 0;
  if (tier > 50)  tier = 50;
  // Tier 1 = 20 xp, +15 each tier → sum from 20 to (20 + 15*(tier-1))
  let total = 0;
  for (let t = 1; t <= tier; t++) total += 20 + 15 * (t - 1);
  return total;
}

export function tierFromXp(xp) {
  for (let t = 1; t <= 50; t++) {
    if (xp < xpForTier(t)) return t - 1;
  }
  return 50;
}

// ── Load / init progress (auto-resets at month boundary) ────────────────
export function getProgress() {
  const key = getCurrentSeasonKey();
  const saved = loadSeasonProgress();
  if (!saved || saved.seasonKey !== key) {
    // New season — archive unclaimed rewards from last season (auto-credit below)
    if (saved) archiveUnclaimed(saved);
    const fresh = {
      seasonKey: key,
      xp: 0,
      claimedFree:    [],   // tier numbers
      claimedPremium: [],
      startedAt: new Date().toISOString(),
    };
    saveSeasonProgress(fresh);
    return fresh;
  }
  return saved;
}

function archiveUnclaimed(oldProgress) {
  const season = SEASONS[oldProgress.seasonKey];
  if (!season) return;
  const currentTier = tierFromXp(oldProgress.xp);
  for (let t = 1; t <= currentTier; t++) {
    const rewards = season.rewards[t - 1] || { free: null, premium: null };
    if (rewards.free && !oldProgress.claimedFree.includes(t)) {
      applyReward(rewards.free);
    }
    if (rewards.premium && !oldProgress.claimedPremium.includes(t) && isPremium()) {
      applyReward(rewards.premium);
    }
  }
}

// ── Add XP (returns {oldTier, newTier, leveledUp, newXp}) ───────────────
export function addXp(amount, _reason = '') {
  const p = getProgress();
  const oldTier = tierFromXp(p.xp);
  p.xp += amount;
  const newTier = tierFromXp(p.xp);
  saveSeasonProgress(p);
  return { oldTier, newTier, leveledUp: newTier > oldTier, newXp: p.xp, reason: _reason };
}

// ── Claim a specific tier's reward ──────────────────────────────────────
export function claimTier(tier, track = 'free') {
  const p = getProgress();
  const season = getCurrentSeason();
  if (!season) return { ok: false, reason: 'no_season' };
  if (tierFromXp(p.xp) < tier) return { ok: false, reason: 'not_reached' };

  const claimedList = track === 'premium' ? p.claimedPremium : p.claimedFree;
  if (claimedList.includes(tier)) return { ok: false, reason: 'already_claimed' };
  if (track === 'premium' && !isPremium()) return { ok: false, reason: 'not_premium' };

  const def = season.rewards[tier - 1]?.[track];
  if (!def) return { ok: false, reason: 'no_reward' };

  applyReward(def);
  claimedList.push(tier);
  saveSeasonProgress(p);
  return { ok: true, reward: def };
}

// ── Apply a reward to player state ──────────────────────────────────────
function applyReward(def) {
  if (!def) return;
  if (def.kind === 'bones')    earn(def.value);
  if (def.kind === 'skin')     unlockSkin(def.value);
  if (def.kind === 'bg')       unlockBg(def.value);
  if (def.kind === 'cat')      {
    const coll = loadCollection();
    if (!coll.includes(def.value)) { coll.push(def.value); saveCollection(coll); }
  }
  if (def.kind === 'frame')    {
    // Frame unlocking — store in its own list
    const frames = JSON.parse(localStorage.getItem('catsort_frames') || '[]');
    if (!frames.includes(def.value)) {
      frames.push(def.value);
      localStorage.setItem('catsort_frames', JSON.stringify(frames));
    }
  }
  if (def.kind === 'hint')     addHintToken(def.value);
  if (def.kind === 'undo')     addUndoToken(def.value);
  if (def.kind === 'ad_skip')  addAdSkipToken(def.value);
  if (def.kind === 'bundle')   def.items.forEach(applyReward);
}

// ── Token helpers (simple localStorage counters) ────────────────────────
function bump(key, delta) {
  const cur = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(cur + delta));
}
export function addHintToken(n = 1)    { bump('catsort_free_hints', n); }
export function addUndoToken(n = 1)    { bump('catsort_free_undos', n); }
export function addAdSkipToken(n = 1)  { bump('catsort_ad_skips',   n); }
export function consumeHintToken()     {
  const c = parseInt(localStorage.getItem('catsort_free_hints') || '0', 10);
  if (c > 0) { localStorage.setItem('catsort_free_hints', String(c - 1)); return true; }
  return false;
}
```

- [x] **Step 3: Verify**

```bash
node --check js/season.js
node --check js/season-content.js
```

- [x] **Step 4: Commit**

```bash
git add js/season.js js/season-content.js
git commit -m "season: data model, XP tables, Kirschblüte content, claim engine"
```

---

### Task 4.2: Wire XP hooks into main.js gameplay events

**Files:**
- Modify: `js/main.js` (add XP calls at level win, daily win, mini-game win, achievement unlock)

- [x] **Step 1: Import season functions at top of main.js**

```javascript
import { addXp, XP } from './season.js';
```

- [x] **Step 2: Add XP call at every reward point**

Find the `onWin` / level-solved handler (search for `calcWinReward(` or `earn(reward)`). After `earn(reward)`:

```javascript
const xpAmount = (stars >= 3 ? XP.threeStarLevel : XP.levelSolve);
addXp(xpAmount, 'level' + (stars >= 3 ? '-3star' : ''));
```

Find daily challenge complete → `addXp(XP.dailyChallenge, 'daily');`
Find blitz win → `addXp(XP.blitzWin, 'blitz');`
Find mini-game win (tetris/mouse success) → `addXp(XP.miniGameWin, 'minigame');`
Find achievement unlock → `addXp(XP.achievement, 'ach-' + achId);`

- [x] **Step 3: Manual test**

Play one level → DevTools:
```javascript
JSON.parse(localStorage.getItem('catsort_season'));
// → { xp: 10 (or 20 for 3-star), ... }
```

- [x] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "season: hook XP accrual into level/daily/blitz/mini-game/achievement events"
```

---

### Task 4.3: Season Pass Screen HTML + CSS

**Files:**
- Modify: `index.html` (add #seasonPassScreen + #seasonPassBtn in menu)
- Create: `css/season.css`

- [x] **Step 1: Add to `index.html` — new button in level-select actions-modes**

In the `.ls-actions-modes` div (around line 60), add below dailyChallengeBtn:
```html
<button id="seasonPassBtn" class="ls-action-btn ls-action-btn--pass" type="button">
  <span class="pass-btn-label">🎫 Season Pass</span>
  <span class="pass-btn-timer" id="passBtnTimer"></span>
</button>
```

- [x] **Step 2: Add the Season Pass screen (near other screen-overlays, e.g. after shopScreen):**

```html
<!-- Season Pass -->
<div id="seasonPassScreen" class="screen-overlay sheet-panel hidden pass-screen">
  <div class="pass-card">
    <div class="pass-header">
      <div class="pass-season-emoji" id="passSeasonEmoji">🌸</div>
      <h2 class="pass-season-name" id="passSeasonName">Kirschblüte</h2>
      <p class="pass-season-timer" id="passSeasonTimer">Endet in ...</p>
    </div>

    <div class="pass-progress">
      <div class="pass-xp-label"><span id="passXpNow">0</span> / <span id="passXpMax">19000</span> XP · <strong>TIER <span id="passTierNow">1</span> / 50</strong></div>
      <div class="pass-xp-bar"><div class="pass-xp-fill" id="passXpFill"></div></div>
    </div>

    <div class="pass-status" id="passStatus">
      <span id="passStatusLabel">FREE TRACK</span>
      <button id="passUpgradeBtn" class="premium-cta pass-upgrade-btn">Upgrade zum Club →</button>
    </div>

    <div class="pass-tiers" id="passTiersList"></div>

    <button class="win-btn" id="passBackBtn">← Zurück</button>
  </div>
</div>
```

- [x] **Step 3: Link the new stylesheet in `<head>`**

```html
<link rel="stylesheet" href="css/season.css">
```

- [x] **Step 4: Create `css/season.css`**

```css
/* ══════════════════════════════════════════════════════════════
   SEASON PASS
   ══════════════════════════════════════════════════════════════ */

.ls-action-btn--pass {
  background: linear-gradient(135deg, #FFB7C5 0%, #FF8C9A 50%, #C06080 100%);
  color: #3a0020;
  box-shadow: 0 4px 0 #8a4560, 0 6px 16px rgba(0,0,0,.35);
  display: flex; flex-direction: column; gap: .1rem;
}
.pass-btn-label { font-size: 1rem; }
.pass-btn-timer {
  font-size: .55rem; letter-spacing: .1em;
  opacity: .75;
}

.pass-screen {
  display: flex; align-items: flex-start; justify-content: center;
  z-index: 9400;
}
.pass-card {
  width: 100%; max-width: 520px;
  background: linear-gradient(180deg, #2a1822 0%, #1a0f18 100%);
  border: 1px solid rgba(255,183,197,.2);
  border-radius: 20px;
  padding: 1.2rem;
  margin-top: 1rem;
}

.pass-header { text-align: center; margin-bottom: 1rem; }
.pass-season-emoji { font-size: 2.2rem; }
.pass-season-name {
  font-family: 'Fredoka', sans-serif; font-weight: 700;
  font-size: 1.4rem; margin: .2rem 0;
  background: linear-gradient(135deg, #FFB7C5, #FF8C9A);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.pass-season-timer {
  font-size: .75rem; color: rgba(255,255,255,.55);
  margin: 0;
}

.pass-progress { margin: 1rem 0 .8rem; }
.pass-xp-label {
  display: flex; justify-content: space-between;
  font-size: .75rem; color: rgba(255,255,255,.75);
  margin-bottom: .3rem;
}
.pass-xp-bar {
  height: 8px; background: rgba(255,255,255,.08);
  border-radius: 4px; overflow: hidden;
}
.pass-xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFB7C5, #FFD700);
  border-radius: 4px;
  width: 0; transition: width .5s ease;
}

.pass-status {
  display: flex; justify-content: space-between; align-items: center;
  padding: .6rem .8rem;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  font-size: .7rem;
  margin-bottom: .8rem;
}
.pass-upgrade-btn {
  font-family: 'Fredoka', sans-serif;
  font-size: .72rem; font-weight: 700;
  padding: .45rem 1rem;
  border: none; border-radius: 100px;
  background: linear-gradient(110deg, #FFD700 0%, #FFF8DC 45%, #FFD700 50%, #FFB800 55%, #FFD700 100%);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
  color: #4a2000; cursor: pointer;
  letter-spacing: .1em;
}

.pass-tiers {
  display: flex; flex-direction: column; gap: .4rem;
  max-height: 55vh; overflow-y: auto;
  padding-right: .3rem;
  margin-bottom: 1rem;
}

.pass-tier-row {
  display: grid;
  grid-template-columns: 42px 1fr 1fr;
  gap: .4rem;
  padding: .5rem;
  background: rgba(255,255,255,.03);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.05);
}
.pass-tier-row.reached {
  background: rgba(255,183,197,.06);
  border-color: rgba(255,183,197,.2);
}
.pass-tier-number {
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  color: rgba(255,255,255,.5);
  font-size: .8rem;
}
.pass-tier-row.reached .pass-tier-number { color: #FFD700; }

.pass-reward {
  display: flex; align-items: center;
  padding: .4rem;
  border-radius: 8px;
  background: rgba(255,255,255,.03);
  position: relative;
  font-size: .7rem;
}
.pass-reward.empty { opacity: .2; }
.pass-reward.locked { filter: blur(2px); opacity: .5; }
.pass-reward.premium-reward {
  border: 1px solid rgba(255,215,0,.2);
}
.pass-reward.claimable {
  background: linear-gradient(135deg, rgba(255,215,0,.15), rgba(255,140,0,.08));
  border: 1px solid rgba(255,215,0,.4);
  cursor: pointer;
  animation: rewardPulse 1.5s ease-in-out infinite;
}
.pass-reward.claimed {
  opacity: .4;
}
.pass-reward.claimed::after {
  content: '✓';
  position: absolute; top: 4px; right: 6px;
  color: #2ecc71;
  font-weight: 700;
}
@keyframes rewardPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255,215,0,.3); }
  50%      { box-shadow: 0 0 12px rgba(255,215,0,.6); }
}
.pass-reward-icon {
  font-size: 1.2rem; margin-right: .3rem;
}
.pass-reward-label {
  flex: 1; color: rgba(255,255,255,.85);
}
```

- [x] **Step 5: Commit**

```bash
git add index.html css/season.css
git commit -m "season: pass screen HTML + CSS shell"
```

---

### Task 4.4: Season Pass rendering logic

**Files:**
- Modify: `js/main.js` (or new `js/season-ui.js` — simpler to inline in main.js for this codebase style)

- [x] **Step 1: Add these functions to main.js**

```javascript
import { getProgress, xpForTier, tierFromXp, claimTier, XP } from './season.js';
import { getCurrentSeason } from './season-content.js';

function openSeasonPass() {
  const screen = document.getElementById('seasonPassScreen');
  if (!screen) return;
  renderSeasonPass();
  screen.classList.remove('hidden');
  screen.classList.add('show');
}

function closeSeasonPass() {
  const screen = document.getElementById('seasonPassScreen');
  if (!screen) return;
  screen.classList.remove('show');
  setTimeout(() => screen.classList.add('hidden'), 250);
}

function renderSeasonPass() {
  const season = getCurrentSeason();
  if (!season) return;
  const p = getProgress();
  const tier = tierFromXp(p.xp);
  const maxXp = xpForTier(50);

  document.getElementById('passSeasonEmoji').textContent = season.emoji;
  document.getElementById('passSeasonName').textContent  = season.name;

  // Timer
  const end = new Date(season.endsAt);
  const msLeft = Math.max(0, end.getTime() - Date.now());
  const daysLeft = Math.floor(msLeft / 86400000);
  const hoursLeft = Math.floor((msLeft % 86400000) / 3600000);
  document.getElementById('passSeasonTimer').textContent =
    'Endet in ' + daysLeft + 'd ' + hoursLeft + 'h';

  // Progress
  document.getElementById('passXpNow').textContent  = p.xp;
  document.getElementById('passXpMax').textContent  = maxXp;
  document.getElementById('passTierNow').textContent = tier;
  document.getElementById('passXpFill').style.width = Math.min(100, (p.xp / maxXp) * 100) + '%';

  // Status
  const isP = isPremium();
  document.getElementById('passStatusLabel').textContent =
    isP ? 'CLUB-MITGLIED · PREMIUM-TRACK AKTIV' : 'FREE TRACK';
  document.getElementById('passUpgradeBtn').style.display = isP ? 'none' : '';

  // Tiers list
  const list = document.getElementById('passTiersList');
  list.innerHTML = '';
  for (let t = 1; t <= 50; t++) {
    const row = document.createElement('div');
    row.className = 'pass-tier-row' + (t <= tier ? ' reached' : '');
    row.innerHTML = `
      <div class="pass-tier-number">${t}</div>
      ${renderReward(season.rewards[t - 1].free,    t, 'free',    p, tier, isP)}
      ${renderReward(season.rewards[t - 1].premium, t, 'premium', p, tier, isP)}
    `;
    list.appendChild(row);
  }

  // Bind claim clicks
  list.querySelectorAll('.pass-reward.claimable').forEach(el => {
    el.addEventListener('click', () => {
      const t = +el.dataset.tier;
      const track = el.dataset.track;
      const result = claimTier(t, track);
      if (result.ok) {
        playSound('cat_unlock');
        updateBonesDisplay();
        renderSeasonPass();
      } else {
        playSound('invalid');
      }
    });
  });
}

function renderReward(def, tier, track, progress, reachedTier, isP) {
  if (!def) {
    return `<div class="pass-reward empty"><span class="pass-reward-label">—</span></div>`;
  }
  const claimed = (track === 'premium' ? progress.claimedPremium : progress.claimedFree).includes(tier);
  const canClaim = tier <= reachedTier && !claimed && (track === 'free' || isP);
  const locked = track === 'premium' && !isP;

  const classes = ['pass-reward'];
  if (track === 'premium') classes.push('premium-reward');
  if (claimed)  classes.push('claimed');
  if (canClaim) classes.push('claimable');
  if (locked && !claimed) classes.push('locked');

  const icon = iconFor(def);
  return `<div class="${classes.join(' ')}" data-tier="${tier}" data-track="${track}">
    <span class="pass-reward-icon">${icon}</span>
    <span class="pass-reward-label">${def.label || ''}</span>
  </div>`;
}

function iconFor(def) {
  if (def.kind === 'bones')   return '🦴';
  if (def.kind === 'cat')     return '🐱';
  if (def.kind === 'skin')    return '🧶';
  if (def.kind === 'bg')      return '🖼️';
  if (def.kind === 'frame')   return '🏆';
  if (def.kind === 'hint')    return '💡';
  if (def.kind === 'undo')    return '↩️';
  if (def.kind === 'ad_skip') return '📺';
  if (def.kind === 'bundle')  return '🎁';
  return '⭐';
}
```

- [x] **Step 2: Wire the menu button**

```javascript
document.getElementById('seasonPassBtn')?.addEventListener('click', openSeasonPass);
document.getElementById('passBackBtn')?.addEventListener('click', closeSeasonPass);
document.getElementById('passUpgradeBtn')?.addEventListener('click', () => {
  closeSeasonPass();
  setTimeout(() => showPaywall(), 300);
});
```

- [x] **Step 3: Update menu-button timer display**

Add a function that updates `#passBtnTimer` when menu opens:
```javascript
function updatePassBtnTimer() {
  const season = getCurrentSeason();
  const el = document.getElementById('passBtnTimer');
  if (!season || !el) return;
  const end = new Date(season.endsAt);
  const ms = Math.max(0, end.getTime() - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  el.textContent = 'Saison endet in ' + d + 'd ' + h + 'h';
}
```

Call `updatePassBtnTimer()` wherever the menu is shown.

- [x] **Step 4: Manual test**

Open menu → Season Pass button shows timer. Click → pass screen opens, shows current XP/tier, rewards list. Play some levels to earn XP, reopen → updated.

- [x] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "season: pass screen rendering + claim interactions"
```

---

### Task 4.5: Season rollover detection + archive

**Files:**
- Modify: `js/season.js` (already has archive logic in `getProgress`, but add boot-time check)

- [x] **Step 1: Add `checkSeasonRollover()` exported helper to `js/season.js`**

Near the end:
```javascript
/**
 * Call once at boot. If the current season key differs from saved, triggers
 * the archive/reset via getProgress() which handles unclaimed credit.
 * Returns { rolled: boolean, newSeasonName: string|null } for UI notification.
 */
export function checkSeasonRollover() {
  const saved = loadSeasonProgress();
  const currentKey = getCurrentSeasonKey();
  if (saved && saved.seasonKey !== currentKey) {
    const newSeason = getCurrentSeason();
    getProgress();  // triggers archive + reset internally
    return { rolled: true, newSeasonName: newSeason?.name || 'Neue Saison' };
  }
  return { rolled: false, newSeasonName: null };
}
```

- [x] **Step 2: In main.js boot sequence, call after storage init**

```javascript
import { checkSeasonRollover } from './season.js';

const rollover = checkSeasonRollover();
if (rollover.rolled) {
  // Simple notification — can be upgraded to overlay later
  console.log('Neue Saison: ' + rollover.newSeasonName);
  // Optional: set a flag to show overlay at menu entry
  window._seasonRollover = rollover.newSeasonName;
}
```

- [x] **Step 3: Manual test**

In DevTools:
```javascript
const s = JSON.parse(localStorage.getItem('catsort_season'));
s.seasonKey = '2025-12';  // old month
localStorage.setItem('catsort_season', JSON.stringify(s));
location.reload();
// Console should show: "Neue Saison: Kirschblüte" (if current month is May 2026)
JSON.parse(localStorage.getItem('catsort_season'));
// → fresh with current seasonKey, xp 0
```

- [x] **Step 4: Commit**

```bash
git add js/season.js js/main.js
git commit -m "season: month-boundary rollover with unclaimed-reward archive"
```

---

### Task 4.6: Integrate free hint/undo tokens into gameplay

**Files:**
- Modify: `js/economy.js` (consume free tokens before bones)
- Modify: `js/main.js` (HUD hint badge when token available)

- [x] **Step 1: Update `spendHint` in `js/economy.js`**

```javascript
import { consumeHintToken } from './season.js';

export function spendHint(tierName = 'EASY') {
  if (isPremium()) return true;
  if (consumeHintToken()) return true;      // free token from Season Pass
  return spend(getHintCost(tierName));
}
```

Similar for undos: expose `consumeUndoToken()` in season.js (pattern identical to `consumeHintToken`), then in main.js find the undo-spend branch and prefer the token.

- [x] **Step 2: Manual test**

Claim a Free Hint from Season Pass → DevTools:
```javascript
localStorage.getItem('catsort_free_hints');  // → "1"
```
Use a hint in game → counter decrements, bones unchanged.

- [x] **Step 3: Commit**

```bash
git add js/economy.js js/main.js js/season.js
git commit -m "season: free hint/undo tokens consume before bones"
```

---

### Phase 4 Checkpoint

- [x] Season Pass button appears in menu with endsIn timer
- [x] Pass screen shows correct XP / tier / progress bar
- [x] Free-track rewards claimable at milestones (5/10/15/20/25/30/35/40/45/50)
- [x] Premium-track rewards visible but locked (blurred) for free users
- [x] Premium users can claim all tiers
- [x] Month rollover archives unclaimed and starts fresh
- [x] Free hint/undo tokens consume before bones

---

## Phase 5: Season Content (Kirschblüte)

**Ships:** 4 new cats (3 premium Sakura/Tsubaki/Hoshi + 1 free Mochi-Sakura), Kirschblüte background, Sakura ball skin, Hanami avatar frame — all procedurally rendered in existing engine style. Content is wired to Season Pass rewards.

### Task 5.1: Register new cats in `js/cats.js`

**Files:**
- Modify: `js/cats.js` (add 4 new entries, new unlock type 'season')

- [x] **Step 1: Extend `js/cats.js` `CATS` array. Add before the closing `];` (after `premium: true` block ending around line 280):**

```javascript
  // ── Season 2026-05 "Kirschblüte" ──────────────────────────────────────
  {
    id: 'mochi-sakura',
    name: 'Mochi-Sakura',
    breed: 'Schottische Faltohr (Sakura-Variante)',
    emoji: '🌸',
    fact: 'Diese Kirschblüten-Variante von Mochi erscheint nur im Mai — ihr cremeweißes Fell zeigt rosa Blüten-Muster wie echte Sakura.',
    unlock: { type: 'season', value: '2026-05-free-15' },   // free-track tier 15, season May 2026
    premium: false,
    season: '2026-05',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    breed: 'Japanisch Bobtail',
    emoji: '🌸',
    fact: 'Japanische Bobtails galten im Kaiserreich als Glücksbringer — ihre kurzen Schwänze sollen Dämonen fernhalten.',
    unlock: { type: 'season', value: '2026-05-premium-30' },
    premium: true,
    season: '2026-05',
  },
  {
    id: 'tsubaki',
    name: 'Tsubaki',
    breed: 'Kurilian Bobtail',
    emoji: '🌸',
    fact: 'Kurilian Bobtails sind natürliche Schwimmer und jagen Fische aus sibirischen Flüssen — benannt nach der Kamelie.',
    unlock: { type: 'season', value: '2026-05-premium-40' },
    premium: true,
    season: '2026-05',
  },
  {
    id: 'hoshi',
    name: 'Hoshi',
    breed: 'Japanisch Langhaar',
    emoji: '🌟',
    fact: '"Hoshi" bedeutet "Stern" — diese Katzen haben oft sternförmige Markierungen auf der Stirn.',
    unlock: { type: 'season', value: '2026-05-premium-50' },
    premium: true,
    season: '2026-05',
  },
```

- [x] **Step 2: Update `checkCatUnlocks` to handle `'season'` unlock type (no-op — unlocked via claim flow directly, not by milestone check). Just ensure the switch case exists but does nothing:**

In `js/cats.js`, inside the switch statement in `checkCatUnlocks`:
```javascript
      case 'season':
        shouldUnlock = false;  // season cats are granted via claimTier, not auto-unlock
        break;
```

- [x] **Step 3: Commit**

```bash
git add js/cats.js
git commit -m "content: register 4 Kirschblüte cats (mochi-sakura, sakura, tsubaki, hoshi)"
```

---

### Task 5.2: Add cat renderer params for 4 new cats

**Files:**
- Modify: `js/cat-renderer.js` (add CAT_PARAMS entries for new cats)

- [x] **Step 1: Locate the CAT_PARAMS array in cat-renderer.js (`grep -n "CAT_PARAMS" js/cat-renderer.js`)**

- [x] **Step 2: Add 4 new entries. Each follows the existing shape (furColor, patternColor, eyeColor, etc. — use an existing Mochi-like entry as template). Example:**

```javascript
{
  id: 'mochi-sakura',
  furColor:      '#FDEBF0',    // cream-white with pink tint
  patternColor:  '#F5A3B5',    // sakura pink
  eyeColor:      '#7EBDCB',    // pale blue
  noseColor:     '#F5A3B5',
  pattern:       'sakura',     // new pattern type
  earStyle:      'folded',     // Scottish Fold
  whiskerColor:  '#FFFFFF',
},
{
  id: 'sakura',
  furColor:      '#FFE4E9',
  patternColor:  '#E67388',
  eyeColor:      '#D4B891',
  noseColor:     '#E67388',
  pattern:       'patches',    // existing
  earStyle:      'short-tail', // Japanese Bobtail marker (kept for spec reasons)
  whiskerColor:  '#FFFFFF',
},
{
  id: 'tsubaki',
  furColor:      '#FFFFFF',
  patternColor:  '#C0392B',
  eyeColor:      '#4DA6D1',
  noseColor:     '#D98888',
  pattern:       'redwhite-patches',
  earStyle:      'tufted',
  whiskerColor:  '#FFFFFF',
},
{
  id: 'hoshi',
  furColor:      '#3A3F4B',
  patternColor:  '#F5F5F5',
  eyeColor:      '#FFD54F',
  noseColor:     '#282D36',
  pattern:       'star-forehead',   // new pattern type
  earStyle:      'normal',
  whiskerColor:  '#C0C0C0',
},
```

- [x] **Step 3: Extend pattern-draw logic in `cat-renderer.js`**

Find the pattern-drawing switch (`grep -n "params.pattern" js/cat-renderer.js`). Add cases:
```javascript
    case 'sakura':
      // Draw small pink cherry-blossom spots on the fur
      ctx.fillStyle = params.patternColor;
      drawSakuraSpots(ctx, centerX, centerY, size);
      break;
    case 'star-forehead':
      // White star on forehead
      ctx.fillStyle = params.patternColor;
      drawStarShape(ctx, centerX, centerY - size * 0.7, size * 0.18);
      break;
    case 'redwhite-patches':
      ctx.fillStyle = params.patternColor;
      drawPatches(ctx, centerX, centerY, size, 3);
      break;
```

With helper functions added at bottom of the file:
```javascript
function drawSakuraSpots(ctx, cx, cy, size) {
  const positions = [[-0.4,-0.2], [0.3,-0.1], [-0.1,0.3], [0.4,0.4], [-0.3,0.5]];
  positions.forEach(([dx, dy]) => {
    const x = cx + dx * size, y = cy + dy * size;
    const r = size * 0.06;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(angle) * r * 0.6, y + Math.sin(angle) * r * 0.6, r * 0.4, r * 0.7, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
function drawStarShape(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.4;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
}
function drawPatches(ctx, cx, cy, size, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 1;
    const dx = Math.cos(angle) * size * 0.4;
    const dy = Math.sin(angle) * size * 0.3;
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, size * 0.22, size * 0.17, angle, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

- [x] **Step 4: Manual test**

In DevTools:
```javascript
// Force-unlock all 4 cats:
const coll = JSON.parse(localStorage.getItem('catsort_collection') || '[]');
coll.push('mochi-sakura','sakura','tsubaki','hoshi');
localStorage.setItem('catsort_collection', JSON.stringify(coll));
location.reload();
```
Open Album → 4 new cats rendered with their patterns.

- [x] **Step 5: Commit**

```bash
git add js/cat-renderer.js
git commit -m "content: cat-renderer params + sakura/star/patches patterns"
```

---

### Task 5.3: Kirschblüte background

**Files:**
- Modify: `js/background.js` (add drawKirschbluteBg + register)
- Modify: `js/skins.js` (add 'kirschbluete' to BG_DEFS)

- [x] **Step 1: Add to `js/skins.js` `BG_DEFS` (or within a SEASON_BG_DEFS map — simplest: extend BG_DEFS)**

```javascript
export const BG_DEFS = {
  cafe:          { name: 'Katzencafé',   cost: 0,   milestone: null },
  garden:        { name: 'Garten',       cost: 250, milestone: 50 },
  rooftop:       { name: 'Dachterrasse', cost: 450, milestone: 100 },
  winter:        { name: 'Winterstube',  cost: 650, milestone: 200 },
  kirschbluete:  { name: 'Kirschblüte',  cost: -1,  milestone: null, season: '2026-05' },
};
```

`cost: -1` means not buyable with bones — only via Season Pass.

- [x] **Step 2: Add `drawKirschbluteBg(ctx, w, h, t)` to `js/background.js`**

Follow the existing pattern used by `drawGardenBg`/`drawRooftopBg`. Key visual layers:
1. Sky gradient: soft cream → peach (dawn tones)
2. Silhouette of Ginkaku-ji-style pagoda, far right, 2-tier
3. Cherry tree: dark-brown trunk left, pink-white blossom canopy, 40% of canvas
4. Falling sakura petals (5-petal star shape) as particles with gentle drift
5. Subtle ground gradient at bottom

```javascript
export function drawKirschbluteBg(ctx, w, h, t) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0,    '#FFD6E0');
  sky.addColorStop(0.5,  '#FFE8D4');
  sky.addColorStop(1,    '#FFF0E8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Distant pagoda silhouette
  ctx.fillStyle = 'rgba(140,90,110,0.5)';
  const pagX = w * 0.78, pagY = h * 0.55;
  ctx.fillRect(pagX, pagY, w * 0.04, h * 0.2);
  // two roofs
  ctx.beginPath();
  ctx.moveTo(pagX - 15, pagY);
  ctx.lineTo(pagX + 28, pagY);
  ctx.lineTo(pagX + 40, pagY - 12);
  ctx.lineTo(pagX - 25, pagY - 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pagX - 10, pagY - 25);
  ctx.lineTo(pagX + 22, pagY - 25);
  ctx.lineTo(pagX + 30, pagY - 38);
  ctx.lineTo(pagX - 18, pagY - 38);
  ctx.closePath();
  ctx.fill();

  // Cherry tree trunk
  ctx.fillStyle = '#5A3A30';
  const trunkX = w * 0.15;
  ctx.fillRect(trunkX, h * 0.55, 14, h * 0.35);
  // branches
  ctx.strokeStyle = '#5A3A30';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(trunkX + 7, h * 0.58);
  ctx.quadraticCurveTo(trunkX + 40, h * 0.48, trunkX + 80, h * 0.5);
  ctx.moveTo(trunkX + 7, h * 0.62);
  ctx.quadraticCurveTo(trunkX - 20, h * 0.52, trunkX - 40, h * 0.5);
  ctx.stroke();

  // Blossom canopy — overlapping pink ellipses
  const canopyPoints = [
    [trunkX + 40, h * 0.48, 90],
    [trunkX + 80, h * 0.50, 70],
    [trunkX -  5, h * 0.46, 80],
    [trunkX - 40, h * 0.50, 65],
    [trunkX + 20, h * 0.38, 95],
  ];
  canopyPoints.forEach(([cx, cy, r]) => {
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
    grad.addColorStop(0,   '#FFFFFF');
    grad.addColorStop(0.5, '#FFD6E0');
    grad.addColorStop(1,   '#FFB7C5');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ground gradient
  const ground = ctx.createLinearGradient(0, h * 0.88, 0, h);
  ground.addColorStop(0, 'rgba(140,90,110,0)');
  ground.addColorStop(1, 'rgba(120,70,90,0.3)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);

  // Falling petals
  drawSakuraPetalShower(ctx, w, h, t);
}

function drawSakuraPetalShower(ctx, w, h, t) {
  const count = 18;
  for (let i = 0; i < count; i++) {
    const seed = i * 137.5;
    const x = ((seed + t * 0.02 * (0.5 + (i % 3) * 0.2)) % (w + 40)) - 20;
    const y = ((seed * 0.7 + t * 0.04 * (0.8 + (i % 5) * 0.1)) % (h + 40)) - 20;
    const rot = (t * 0.002 + seed) % (Math.PI * 2);
    drawSakuraPetal(ctx, x, y, 4 + (i % 3), rot);
  }
}
function drawSakuraPetal(ctx, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,183,197,0.8)';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.ellipse(Math.cos(a) * size * 0.4, Math.sin(a) * size * 0.4, size * 0.3, size * 0.5, a, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();
}
```

- [x] **Step 3: Register in the background router**

Find the `drawBackground` switch (`grep -n "drawBackground" js/background.js`). Add:
```javascript
    case 'kirschbluete': drawKirschbluteBg(ctx, w, h, t); break;
```

- [x] **Step 4: Manual test**

```javascript
const bg = JSON.parse(localStorage.getItem('catsort_backgrounds') || '{"owned":["cafe"],"active":"cafe"}');
bg.owned.push('kirschbluete');
bg.active = 'kirschbluete';
localStorage.setItem('catsort_backgrounds', JSON.stringify(bg));
location.reload();
```
Start a level → pink blossom background visible with falling petals.

- [x] **Step 5: Commit**

```bash
git add js/skins.js js/background.js
git commit -m "content: Kirschblüte background (pagoda + cherry tree + petal shower)"
```

---

### Task 5.4: Sakura ball skin + Hanami avatar frame

**Files:**
- Modify: `js/skins.js` (register 'sakura' skin)
- Modify: `js/balls.js` (add sakura rendering variant)
- Modify: `js/cat-renderer.js` (add Hanami frame when drawing mascot/cat with frame)

- [x] **Step 1: Extend `SKIN_DEFS` in `js/skins.js`**

```javascript
export const SKIN_DEFS = {
  default:  { name: 'Wollknäuel', cost: 0,   milestone: null },
  glitter:  { name: 'Glitzer',         cost: 120, milestone: 150 },
  crystal:  { name: 'Kristall',        cost: 200, milestone: null },
  gold:     { name: 'Goldfaden',       cost: 350, milestone: 300 },
  sakura:   { name: 'Sakura',          cost: -1,  milestone: null, season: '2026-05' },
};
```

- [x] **Step 2: Add 'sakura' rendering to `js/balls.js`**

Find the skin switch in the draw function (grep for `'glitter'` in balls.js). Add:
```javascript
    case 'sakura':
      drawSakuraBall(ctx, x, y, r, color, t);
      break;
```

Add helper:
```javascript
function drawSakuraBall(ctx, x, y, r, color, t) {
  // Base ball with slight pink tint overlay
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 2, x, y, r);
  grad.addColorStop(0, '#FFE8EE');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, shade(color, -0.3));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // 3-4 tiny sakura blossom motifs on surface
  const seed = x * 13 + y * 7;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + t * 0.0005 + seed * 0.001;
    const dx = Math.cos(angle) * r * 0.55;
    const dy = Math.sin(angle) * r * 0.55;
    drawTinySakura(ctx, x + dx, y + dy, r * 0.16);
  }

  // Highlight
  const hl = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, 0, x - r * 0.4, y - r * 0.5, r * 0.5);
  hl.addColorStop(0, 'rgba(255,255,255,0.55)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.5, r * 0.5, 0, Math.PI * 2); ctx.fill();
}
function drawTinySakura(ctx, cx, cy, size) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * size * 0.4, cy + Math.sin(a) * size * 0.4, size * 0.3, size * 0.5, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232,115,136,0.9)';
  ctx.beginPath(); ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function shade(hex, amt) {
  // darken/lighten a hex color by amount (-1..1)
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) * (1 + amt)));
  const g = Math.max(0, Math.min(255, ((n >> 8)  & 0xff) * (1 + amt)));
  const b = Math.max(0, Math.min(255, (n         & 0xff) * (1 + amt)));
  return '#' + [r, g, b].map(v => Math.floor(v).toString(16).padStart(2, '0')).join('');
}
```

- [x] **Step 3: Hanami frame — frame-rendering function**

Add to `js/cat-renderer.js`:
```javascript
export function drawHanamiFrame(ctx, cx, cy, r, t) {
  ctx.save();
  // Gold circle border
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.stroke();
  // Sakura motifs at 4 cardinal + animated rotation
  const angles = [0, 0.25, 0.5, 0.75];
  angles.forEach((a, i) => {
    const rad = a * Math.PI * 2 + t * 0.0008;
    const x = cx + Math.cos(rad) * (r + 6);
    const y = cy + Math.sin(rad) * (r + 6);
    drawTinyHanamiBlossom(ctx, x, y, r * 0.12);
  });
  ctx.restore();
}
function drawTinyHanamiBlossom(ctx, cx, cy, size) {
  ctx.fillStyle = '#FFB7C5';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * size * 0.4, cy + Math.sin(a) * size * 0.4, size * 0.3, size * 0.55, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FFD700';
  ctx.beginPath(); ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2); ctx.fill();
}
```

Add the frame draw call wherever a cat portrait is rendered with a frame. Check current frames (unlock check):
```javascript
function currentFrame() {
  const frames = JSON.parse(localStorage.getItem('catsort_frames') || '[]');
  return frames.find(f => f === 'hanami') || null;
}
```

In the mascot/cat-portrait draw in main.js, after drawing the cat:
```javascript
if (currentFrame() === 'hanami') drawHanamiFrame(ctx, x, y, radius, performance.now());
```

- [x] **Step 4: Commit**

```bash
git add js/skins.js js/balls.js js/cat-renderer.js js/main.js
git commit -m "content: Sakura ball skin + Hanami avatar frame"
```

---

### Phase 5 Checkpoint

- [x] 4 Kirschblüte cats appear in album with unique patterns
- [x] Kirschblüte background renders correctly (pagoda, tree, petals)
- [x] Sakura ball skin paints blossom dots on balls
- [x] Hanami frame appears around mascot portrait when unlocked
- [x] All content granted via Season Pass claim flow actually works end-to-end

---

## Phase 6: Lives System

**Ships:** 5-paw lives with 20-min regen, consumed on mini-game/blitz start. Standard puzzle remains unlimited. 0 lives = paywall trigger (covered Phase 7) and ad/bones refill options.

### Task 6.1: Lives module

**Files:**
- Create: `js/lives.js`

- [x] **Step 1: Create `js/lives.js`**

```javascript
'use strict';

import { loadLives, saveLives } from './storage.js';
import { isPremium, spend, canAfford } from './economy.js';

export const MAX_LIVES      = 5;
export const REGEN_MS       = 20 * 60 * 1000;   // 20 min per life
export const REFILL_COST    = 50;                // bones for full refill

// ── Core state accessors ────────────────────────────────────────────
export function checkRegen() {
  const { count, lastRegen } = loadLives();
  if (count >= MAX_LIVES) {
    if (new Date(lastRegen).getTime() + REGEN_MS < Date.now()) {
      // keep lastRegen recent so next consume doesn't double-regen
      saveLives({ count: MAX_LIVES, lastRegen: new Date().toISOString() });
    }
    return;
  }
  const elapsed = Date.now() - new Date(lastRegen).getTime();
  const regens = Math.floor(elapsed / REGEN_MS);
  if (regens <= 0) return;
  const newCount  = Math.min(MAX_LIVES, count + regens);
  const carryOver = elapsed - (regens * REGEN_MS);
  saveLives({
    count: newCount,
    lastRegen: new Date(Date.now() - carryOver).toISOString(),
  });
}

export function getLivesCount() {
  if (isPremium()) return Infinity;
  checkRegen();
  return loadLives().count;
}

export function hasLife() {
  return getLivesCount() > 0;
}

export function consumeLife() {
  if (isPremium()) return true;
  checkRegen();
  const state = loadLives();
  if (state.count <= 0) return false;
  state.count -= 1;
  // Only set lastRegen on transition from full → not-full
  if (state.count === MAX_LIVES - 1) {
    state.lastRegen = new Date().toISOString();
  }
  saveLives(state);
  return true;
}

export function refillWithBones() {
  if (isPremium()) return { ok: true, alreadyPremium: true };
  if (!canAfford(REFILL_COST)) return { ok: false, reason: 'insufficient' };
  spend(REFILL_COST);
  saveLives({ count: MAX_LIVES, lastRegen: new Date().toISOString() });
  return { ok: true };
}

export function refillWithAd() {
  if (isPremium()) return { ok: true, alreadyPremium: true };
  const state = loadLives();
  state.count = Math.min(MAX_LIVES, state.count + 1);
  if (state.count === MAX_LIVES) state.lastRegen = new Date().toISOString();
  saveLives(state);
  return { ok: true };
}

// ── Timer to next life (for UI display) ─────────────────────────────
export function msUntilNextLife() {
  if (isPremium()) return 0;
  const { count, lastRegen } = loadLives();
  if (count >= MAX_LIVES) return 0;
  const elapsed = Date.now() - new Date(lastRegen).getTime();
  return Math.max(0, REGEN_MS - elapsed);
}

export function formatTimeLeft(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [x] **Step 2: Commit**

```bash
git add js/lives.js
git commit -m "lives: 5-paw system with 20m regen, bones refill, ad refill"
```

---

### Task 6.2: Lives HUD display

**Files:**
- Modify: `index.html` (add lives-display element to HUD overlay)
- Modify: `css/game.css` (lives styling)
- Modify: `js/main.js` (wire updateLivesDisplay + tick timer)

- [x] **Step 1: Update HUD in `index.html`. In the `.hud-overlay` block (around line 31), replace the bones-display line group:**

```html
<div class="hud-overlay">
  <button class="hud-btn" id="menuBtnHud" aria-label="Menu">☰</button>
  <span class="hud-bones" id="bonesDisplay"><i class="fishbone"></i> 0</span>
  <span class="hud-lives" id="livesDisplay"><span class="paw">🐾</span> <span id="livesCount">5</span></span>
  <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
  <button class="hud-btn hud-hint" id="hintBtn" aria-label="Hint">💡<span class="hud-hint-cost" id="hintCost"><i class="fishbone"></i>15</span></button>
  <span class="hud-level" id="levelLabel">LEVEL 1 · EASY</span>
  <button class="hud-btn" id="resetBtn" aria-label="Reset">↺</button>
</div>
```

- [x] **Step 2: Add CSS to `css/game.css`**

```css
.hud-lives {
  display: inline-flex; align-items: center; gap: .25rem;
  padding: .25rem .55rem;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 100px;
  font-size: .7rem; font-weight: 600;
  color: rgba(255,255,255,.85);
}
.hud-lives.low {
  color: #F5A3B5;
  border-color: rgba(245,163,181,.3);
}
.hud-lives.empty {
  color: #E67388;
  border-color: rgba(230,115,136,.4);
  animation: livesEmptyPulse 1.5s ease-in-out infinite;
}
@keyframes livesEmptyPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(230,115,136,.3); }
  50%      { box-shadow: 0 0 10px rgba(230,115,136,.5); }
}
.hud-lives .paw { font-size: .8rem; }
.hud-lives.premium .paw { filter: drop-shadow(0 0 4px rgba(255,215,0,.5)); }
```

- [x] **Step 3: In `js/main.js`, add lives display update**

```javascript
import { getLivesCount, msUntilNextLife, formatTimeLeft } from './lives.js';

function updateLivesDisplay() {
  const el = document.getElementById('livesDisplay');
  const cnt = document.getElementById('livesCount');
  if (!el || !cnt) return;

  if (isPremium()) {
    cnt.textContent = '∞';
    el.className = 'hud-lives premium';
    return;
  }

  const n = getLivesCount();
  if (n >= 5)       cnt.textContent = n;
  else if (n === 0) cnt.textContent = '0 · ' + formatTimeLeft(msUntilNextLife());
  else              cnt.textContent = n + ' · ' + formatTimeLeft(msUntilNextLife());

  el.className = 'hud-lives' + (n === 0 ? ' empty' : n <= 2 ? ' low' : '');
}
```

Call `updateLivesDisplay()` at boot, and set an interval:
```javascript
setInterval(updateLivesDisplay, 1000);
```

- [x] **Step 4: Manual test**

Reload. HUD shows "🐾 5". In console:
```javascript
import('./js/lives.js').then(m => m.consumeLife());
```
Display updates to "🐾 4 · 19:59" counting down.

- [x] **Step 5: Commit**

```bash
git add index.html css/game.css js/main.js
git commit -m "lives: HUD display with countdown and low/empty states"
```

---

### Task 6.3: Consume lives on mini-game/blitz start + lives-empty modal

**Files:**
- Modify: `index.html` (add lives-empty overlay)
- Modify: `css/premium.css` (lives-empty overlay styling)
- Modify: `js/main.js` (check hasLife() before starting mini-game/blitz)

- [x] **Step 1: Add to `index.html` (near other overlays)**

```html
<!-- Lives Empty Overlay -->
<div id="livesEmptyOverlay" class="screen-overlay sheet-panel hidden">
  <div class="lives-empty-card">
    <div class="lives-empty-icon">🐾</div>
    <h2 class="lives-empty-title">Keine Pfoten mehr!</h2>
    <p class="lives-empty-sub" id="livesEmptyTimer">Nächstes Leben in 19:32</p>
    <div class="lives-empty-actions">
      <button id="livesAdBtn" class="win-btn">📺 Werbung für +1 Leben</button>
      <button id="livesBonesBtn" class="win-btn">🦴 50 Fischgräten für volle 5</button>
      <button id="livesClubBtn" class="win-btn premium-cta">👑 Im Club unbegrenzt</button>
      <button id="livesCancelBtn" class="win-btn win-btn--secondary">Abbrechen</button>
    </div>
  </div>
</div>
```

- [x] **Step 2: Add CSS to `css/premium.css`**

```css
.lives-empty-card {
  background: linear-gradient(180deg, #2a1822 0%, #1a1020 100%);
  border: 1px solid rgba(245,163,181,.3);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  max-width: 400px;
  text-align: center;
}
.lives-empty-icon {
  font-size: 3rem;
  filter: drop-shadow(0 0 16px rgba(245,163,181,.5));
  margin-bottom: .6rem;
}
.lives-empty-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.3rem; font-weight: 700;
  color: #F5A3B5;
  margin: 0 0 .3rem;
}
.lives-empty-sub {
  color: rgba(255,255,255,.7);
  font-size: .85rem;
  margin: 0 0 1.2rem;
  font-variant-numeric: tabular-nums;
}
.lives-empty-actions {
  display: flex; flex-direction: column; gap: .5rem;
}
```

- [x] **Step 3: In `js/main.js`, gate mini-game/blitz starts**

Find where mini-games start (search for `tetrisStartBtn`, `mouseStartBtn`, `blitzStartBtn`). Before actually starting:

```javascript
import { hasLife, consumeLife, refillWithBones, refillWithAd, msUntilNextLife, formatTimeLeft } from './lives.js';

function tryStartGatedMode(startFn) {
  if (isPremium() || hasLife()) {
    consumeLife();
    updateLivesDisplay();
    startFn();
  } else {
    showLivesEmpty(startFn);
  }
}

function showLivesEmpty(retryFn) {
  const overlay = document.getElementById('livesEmptyOverlay');
  overlay.classList.remove('hidden'); overlay.classList.add('show');
  const tick = setInterval(() => {
    const el = document.getElementById('livesEmptyTimer');
    if (el) el.textContent = 'Nächstes Leben in ' + formatTimeLeft(msUntilNextLife());
    if (!overlay.classList.contains('show')) clearInterval(tick);
  }, 500);
  document.getElementById('livesAdBtn').onclick = () => {
    // placeholder: show ad, then refill
    refillWithAd();
    closeLivesEmpty();
    consumeLife(); updateLivesDisplay(); retryFn();
  };
  document.getElementById('livesBonesBtn').onclick = () => {
    const r = refillWithBones();
    if (!r.ok) { playSound('invalid'); return; }
    closeLivesEmpty();
    consumeLife(); updateLivesDisplay(); updateBonesDisplay(); retryFn();
  };
  document.getElementById('livesClubBtn').onclick = () => {
    closeLivesEmpty();
    showPaywall();
  };
  document.getElementById('livesCancelBtn').onclick = closeLivesEmpty;
}

function closeLivesEmpty() {
  const overlay = document.getElementById('livesEmptyOverlay');
  overlay.classList.remove('show');
  setTimeout(() => overlay.classList.add('hidden'), 250);
}
```

Replace the direct start-handlers with `tryStartGatedMode(() => actualStart());`. Example:
```javascript
document.getElementById('tetrisStartBtn').addEventListener('click', () => {
  tryStartGatedMode(startTetrisGame);    // whatever the existing start fn is
});
```

- [x] **Step 4: Manual test**

DevTools:
```javascript
localStorage.setItem('catsort_lives', JSON.stringify({count: 0, lastRegen: new Date().toISOString()}));
location.reload();
```
Try to start a mini-game → Lives-empty overlay with countdown, 3 action buttons + cancel. Click "50 Fischgräten" (if affordable) → lives refilled, mini-game starts.

- [x] **Step 5: Commit**

```bash
git add index.html css/premium.css js/main.js
git commit -m "lives: gate mini-games/blitz + empty modal with ad/bones/club refills"
```

---

### Phase 6 Checkpoint

- [x] HUD shows lives counter with regen timer
- [x] Mini-games (Tetris/Mouse/Dog-levels?) and Blitz consume 1 life on start
- [x] Standard puzzle unaffected
- [x] At 0 lives, overlay offers ad / bones / club options
- [x] Premium shows ∞ lives, never gated
- [x] Regen works across page reloads (timestamps persist)

---

## Phase 7: Contextual Paywalls

**Ships:** Six trigger rules that surface the paywall at psychologically-timed moments, with state tracking to avoid spam.

### Task 7.1: Trigger logic module

**Files:**
- Modify: `js/paywall.js` (add triggers section)

- [x] **Step 1: Add to `js/paywall.js`**

```javascript
import { loadPaywallState, savePaywallState } from './storage.js';
import { getCurrentSeason } from './season-content.js';

const MIN_HINT3RD_INTERVAL_MS = 72 * 60 * 60 * 1000;
const MIN_LIVES0_INTERVAL_MS  = 60 * 60 * 1000;

export const TRIGGERS = {
  level5:        { once: true,  interval: 0 },
  level15:       { once: true,  interval: 0 },
  hint3rd:       { once: false, interval: MIN_HINT3RD_INTERVAL_MS, stateKey: 'lastHint3rd' },
  streak7:       { once: true,  interval: 0 },
  lives0:        { once: false, interval: MIN_LIVES0_INTERVAL_MS,  stateKey: 'lastLives0' },
  seasonEnd3d:   { once: true,  interval: 0 },
};

const TRIGGER_COPY = {
  level5:      { title: 'Du hast Talent! 🐾', sub: 'Probier den Kittysort Club 7 Tage gratis und entdecke die Saison-Katzen.' },
  level15:     { title: 'Drei Katzen warten auf dich', sub: 'Die Kirschblüte-Saison hat exklusive Katzen nur für Club-Mitglieder.' },
  hint3rd:     { title: 'Brauchst du öfter Hilfe?', sub: 'Im Club sind Hints unbegrenzt kostenlos.' },
  streak7:     { title: '7 Tage in Folge — stark!', sub: 'Du spielst sowieso jeden Tag. Hol dir den Club und vermisse keine Saison.' },
  lives0:      { title: 'Keine Wartezeit mit dem Club', sub: 'Unbegrenzte Lives + alle Premium-Features.' },
  seasonEnd3d: { title: 'Noch 3 Tage für die Saison-Katzen!', sub: 'Sakura, Tsubaki und Hoshi verschwinden am Monatsende.' },
};

export function maybeShowPaywall(triggerId) {
  const cfg = TRIGGERS[triggerId];
  if (!cfg) return false;

  const state = loadPaywallState();
  if (cfg.once && state.shown.includes(triggerId)) return false;
  if (cfg.stateKey) {
    const last = state[cfg.stateKey] || 0;
    if (Date.now() - last < cfg.interval) return false;
  }

  // Don't prompt already-premium users
  const sub = JSON.parse(localStorage.getItem('catsort_subscription') || 'null');
  if (sub && sub.active) return false;

  // Record
  if (cfg.once) state.shown.push(triggerId);
  if (cfg.stateKey) state[cfg.stateKey] = Date.now();
  savePaywallState(state);

  showPaywall({ triggerCopy: TRIGGER_COPY[triggerId] });
  return true;
}
```

Update `showPaywall(opts)` to accept and display trigger copy: if `opts.triggerCopy` provided, override the subtitle and title temporarily:

```javascript
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
```

- [x] **Step 2: Commit**

```bash
git add js/paywall.js
git commit -m "paywall: contextual trigger framework + 6 trigger definitions"
```

---

### Task 7.2: Wire triggers to gameplay events

**Files:**
- Modify: `js/main.js` (call `maybeShowPaywall` at key moments)

- [x] **Step 1: Import in main.js**

```javascript
import { maybeShowPaywall } from './paywall.js';
```

- [x] **Step 2: Add trigger calls**

**level5 / level15** — in the win handler after celebration overlay closes:
```javascript
// Where the win-overlay "Weiter" button routes to next level:
if (levelJustSolved === 5)  setTimeout(() => maybeShowPaywall('level5'),  800);
if (levelJustSolved === 15) setTimeout(() => maybeShowPaywall('level15'), 800);
```

**hint3rd** — maintain a session counter:
```javascript
let _hintPurchaseCount = 0;
// in the hint button handler AFTER successful spend (not premium, no free token):
if (!isPremium()) {
  _hintPurchaseCount += 1;
  if (_hintPurchaseCount >= 3) {
    setTimeout(() => maybeShowPaywall('hint3rd'), 500);
    _hintPurchaseCount = 0;  // don't repeat within the same session spam
  }
}
```

**streak7** — in the streak-tracking code, after updating streak:
```javascript
if (newStreak === 7 || newStreak === 14 || newStreak === 30) {
  setTimeout(() => maybeShowPaywall('streak7'), 1200);
}
```

**lives0** — already wired via the lives-empty overlay click on "Club" button, but also trigger when the overlay is shown:
```javascript
// Add to showLivesEmpty()
setTimeout(() => maybeShowPaywall('lives0'), 1500);  // only shows if not seen recently
```

**seasonEnd3d** — at boot or menu-open, compute days-left to season end:
```javascript
function checkSeasonEndTrigger() {
  const season = getCurrentSeason();
  if (!season) return;
  const end = new Date(season.endsAt).getTime();
  const daysLeft = Math.floor((end - Date.now()) / 86400000);
  if (daysLeft <= 3 && daysLeft >= 0) {
    maybeShowPaywall('seasonEnd3d');
  }
}
// Call when the user opens the menu (not at every boot — would be annoying on day 1)
```

Hook `checkSeasonEndTrigger()` into the level-select-open function.

- [x] **Step 3: Manual test**

Reset paywall state:
```javascript
localStorage.removeItem('catsort_paywall_state');
localStorage.removeItem('catsort_subscription');
location.reload();
```
Play 5 levels → paywall with "Du hast Talent!" title appears after level 5 win. Dismiss. Play to level 15 → new trigger "Drei Katzen warten".
Force 3 hints in a row (reset levels, spend hint 3x) → after 3rd, trigger fires.

- [x] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "paywall: wire 6 contextual triggers (level5/15, hint3rd, streak7, lives0, seasonEnd3d)"
```

---

### Task 7.3: Trial expiry reminder banner

**Files:**
- Modify: `js/main.js` (check expiry at boot, show one-time banner)
- Modify: `index.html` (repurpose old premium-banner as reminder)

- [x] **Step 1: Keep `#premiumBanner` but repurpose text**

In `js/main.js`, add:
```javascript
import { trialDaysLeft, isTrial } from './billing.js';

function updatePremiumBanner() {
  const banner = document.getElementById('premiumBanner');
  if (!banner) return;

  const sub = JSON.parse(localStorage.getItem('catsort_subscription') || 'null');
  if (sub && sub.active && !sub.lifetime && sub.expiresAt && !isTrial()) {
    banner.classList.add('hidden');
    return;
  }

  if (isTrial()) {
    const days = trialDaysLeft();
    banner.classList.remove('hidden');
    banner.querySelector('span').textContent = `🐾 Trial: noch ${days} ${days === 1 ? 'Tag' : 'Tage'} gratis`;
    banner.querySelector('.premium-btn').textContent = 'Club halten';
    return;
  }

  // Trial expired
  const subExpired = sub && !sub.active && sub.tier === 'trial';
  if (subExpired) {
    banner.classList.remove('hidden');
    banner.querySelector('span').textContent = '🐾 Trial vorbei — bleib im Club';
    banner.querySelector('.premium-btn').textContent = '3,99€/Monat';
    return;
  }

  // Free, never trialed
  if (!sub) {
    banner.classList.remove('hidden');
    banner.querySelector('span').textContent = '🐾 Kittysort Club — 7 Tage gratis testen';
    banner.querySelector('.premium-btn').textContent = 'Probieren';
    return;
  }

  banner.classList.add('hidden');
}
```

Call `updatePremiumBanner()` at boot and after any subscription state change.

- [x] **Step 2: Manual test**

Fresh install → banner shows "7 Tage gratis testen". After trial purchase → "Trial: noch 7 Tage gratis". Manipulate `trialEnd` in localStorage to yesterday → "Trial vorbei — bleib im Club".

- [x] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "paywall: repurpose premium banner for trial countdown and expiry reminder"
```

---

### Phase 7 Checkpoint

- [x] Paywall appears once at level 5 and level 15 with trigger-specific copy
- [x] Hint-3rd trigger fires after 3 paid hints, respects 72h cooldown
- [x] Streak triggers fire at 7/14/30-day milestones
- [x] Season-end trigger fires in last 3 days only, once per season
- [x] Trial countdown banner shows days remaining
- [x] Expired trial shows conversion reminder

---

## Phase 8: Pseudo-Leaderboard

**Ships:** Deterministic 200-profile weekly leaderboard rendered purely client-side. User sees realistic competition, earns bones at week rollover. Later replaceable by a real server without UI changes.

### Task 8.1: Leaderboard engine

**Files:**
- Create: `js/leaderboard.js`

- [x] **Step 1: Create `js/leaderboard.js`**

```javascript
'use strict';

import {
  loadLeaderboardId, saveLeaderboardId,
  loadLeaderboardHistory, saveLeaderboardHistory,
} from './storage.js';
import { earn } from './economy.js';
import { loadProgress } from './storage.js';   // existing progress loader

// ── Nick generator ──────────────────────────────────────────────────
const CAT_ADJECTIVES = [
  'Wuscheliger', 'Flauschiger', 'Verschlafener', 'Tapferer', 'Neugieriger',
  'Frecher',     'Edler',       'Mysteriöser',   'Sanfter',  'Wilder',
  'Ruhiger',     'Hungriger',   'Schnurrender',  'Stolzer',  'Verträumter',
  'Listiger',    'Majestätischer','Schüchterner','Abenteuerlicher','Zauberhafter',
];
const CAT_NOUNS = [
  'Kater', 'Schnurrer', 'Tiger', 'Tiger-Tiger', 'Panther', 'Löwe', 'Wollknäuel-Meister',
  'Mäuse-Jäger', 'Sortier-König', 'Fisch-Gräten-Sammler', 'Schatten-Pfoten',
  'Samt-Tatzen', 'Stern-Augen', 'Mond-Miez', 'Sonnen-Kätzchen', 'Garten-Prinz',
];

function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ensureLeaderboardId() {
  let id = loadLeaderboardId();
  if (id) return id;
  const now = Date.now();
  const rng = mulberry32(hash32('init-' + now));
  const adj = CAT_ADJECTIVES[Math.floor(rng() * CAT_ADJECTIVES.length)];
  const noun = CAT_NOUNS[Math.floor(rng() * CAT_NOUNS.length)];
  const num = Math.floor(rng() * 9000) + 1000;
  id = { nick: `${adj}${noun}-${num}`, joinedAt: new Date().toISOString() };
  saveLeaderboardId(id);
  return id;
}

// ── ISO week number helper ──────────────────────────────────────────
export function getIsoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ── Bot leaderboard generation ──────────────────────────────────────
export function generateBots(weekKey, userMaxLevel) {
  const seed = hash32(weekKey);
  const rng = mulberry32(seed);
  const bots = [];
  for (let i = 0; i < 199; i++) {
    const adj = CAT_ADJECTIVES[Math.floor(rng() * CAT_ADJECTIVES.length)];
    const noun = CAT_NOUNS[Math.floor(rng() * CAT_NOUNS.length)];
    const num = Math.floor(rng() * 9000) + 1000;
    // Score distribution: Gaussian-ish around userMaxLevel * 0.9, 15% stddev, with 10% outliers (2-3x)
    let score;
    if (rng() < 0.1) {
      score = Math.floor(userMaxLevel * (2 + rng() * 1.5));
    } else {
      const base = userMaxLevel * 0.9;
      const noise = (rng() - 0.5) * userMaxLevel * 0.3;
      score = Math.max(1, Math.floor(base + noise));
    }
    bots.push({ nick: `${adj}${noun}-${num}`, score, isBot: true });
  }
  return bots;
}

// ── User score for current week ────────────────────────────────────
const KEY_WEEK_SCORE = 'catsort_week_score';

function _loadWeekScore() {
  try {
    const raw = localStorage.getItem(KEY_WEEK_SCORE);
    if (!raw) return { weekKey: getIsoWeekKey(), score: 0 };
    const obj = JSON.parse(raw);
    if (obj.weekKey !== getIsoWeekKey()) {
      return { weekKey: getIsoWeekKey(), score: 0 };
    }
    return obj;
  } catch { return { weekKey: getIsoWeekKey(), score: 0 }; }
}
function _saveWeekScore(obj) {
  try { localStorage.setItem(KEY_WEEK_SCORE, JSON.stringify(obj)); } catch {}
}

export function addWeekScore(points) {
  const ws = _loadWeekScore();
  ws.score += points;
  _saveWeekScore(ws);
}

export function getWeekScore() {
  return _loadWeekScore().score;
}

// ── Ranking computation ─────────────────────────────────────────────
export function computeRanking(userMaxLevel) {
  const weekKey = getIsoWeekKey();
  const bots = generateBots(weekKey, userMaxLevel || 1);
  const user = { nick: ensureLeaderboardId().nick, score: getWeekScore(), isUser: true };
  const all  = [...bots, user];
  all.sort((a, b) => b.score - a.score);
  const rank = all.findIndex(e => e.isUser) + 1;
  return { rank, total: all.length, entries: all, userNick: user.nick };
}

// ── Weekly rollover + reward ────────────────────────────────────────
const KEY_LAST_ROLLOVER = 'catsort_last_week_rollover';

export function checkWeeklyRollover() {
  const now = new Date();
  const currentKey = getIsoWeekKey(now);
  const lastKey = localStorage.getItem(KEY_LAST_ROLLOVER);
  if (lastKey === currentKey) return null;

  // We rolled over. Compute rewards for the PREVIOUS week using saved score.
  const prev = _loadWeekScore();
  if (prev.weekKey !== currentKey && prev.score > 0) {
    // Re-run ranking against bots from previous week
    const userMaxLevel = parseInt(localStorage.getItem('catsort_max_level') || '1', 10);
    const bots = generateBots(prev.weekKey, userMaxLevel);
    const all = [...bots, { nick: 'you', score: prev.score, isUser: true }].sort((a, b) => b.score - a.score);
    const rank = all.findIndex(e => e.isUser) + 1;

    let reward = 5;
    if      (rank <= 10)  reward = 50;
    else if (rank <= 50)  reward = 20;
    else if (rank <= 100) reward = 10;

    earn(reward);

    const hist = loadLeaderboardHistory();
    hist.unshift({ weekKey: prev.weekKey, rank, total: all.length, score: prev.score, reward });
    saveLeaderboardHistory(hist.slice(0, 20));  // keep last 20 weeks

    // Reset current week score
    _saveWeekScore({ weekKey: currentKey, score: 0 });
    localStorage.setItem(KEY_LAST_ROLLOVER, currentKey);

    return { rank, reward, prevScore: prev.score };
  }

  localStorage.setItem(KEY_LAST_ROLLOVER, currentKey);
  return null;
}
```

- [x] **Step 2: Commit**

```bash
git add js/leaderboard.js
git commit -m "leaderboard: pseudo-engine with 199 seeded bots, weekly rollover rewards"
```

---

### Task 8.2: Leaderboard screen

**Files:**
- Modify: `index.html` (add leaderboard screen + menu button)
- Modify: `css/panels.css` (leaderboard styling)
- Modify: `js/main.js` (rendering + click handlers)

- [x] **Step 1: Add menu button in `index.html` inside `.ls-actions-modes` after season pass button**

```html
<button id="leaderboardBtn" class="ls-action-btn ls-action-btn--rank" type="button">
  🏆 Wochen-Rangliste
</button>
```

- [x] **Step 2: Add screen in `index.html` near other screen-overlays**

```html
<!-- Leaderboard -->
<div id="leaderboardScreen" class="screen-overlay sheet-panel hidden">
  <div class="album-card">
    <h2 class="stats-title">WOCHEN-RANGLISTE</h2>
    <p class="lb-timer" id="lbTimer">Woche endet in ...</p>
    <div class="lb-user-banner" id="lbUserBanner"></div>
    <div class="lb-list" id="lbList"></div>
    <button class="win-btn" id="lbBackBtn">← Zurück</button>
  </div>
</div>
```

- [x] **Step 3: Add CSS to `css/panels.css`**

```css
.ls-action-btn--rank {
  background: linear-gradient(135deg, #FFD54F, #FFA000);
  color: #3a2000;
  box-shadow: 0 4px 0 #8a6400, 0 6px 16px rgba(0,0,0,.35);
}
.lb-timer {
  text-align: center; font-size: .75rem;
  color: rgba(255,255,255,.55);
  margin: 0 0 1rem;
}
.lb-user-banner {
  background: linear-gradient(135deg, rgba(255,215,0,.15), rgba(255,140,0,.08));
  border: 1px solid rgba(255,215,0,.3);
  border-radius: 12px;
  padding: .8rem 1rem;
  display: flex; justify-content: space-between; align-items: center;
  font-size: .85rem;
  margin-bottom: .8rem;
}
.lb-user-banner .lb-rank { font-size: 1.3rem; font-weight: 700; color: #FFD700; }
.lb-user-banner .lb-nick { color: rgba(255,255,255,.9); font-weight: 600; }
.lb-user-banner .lb-score { color: rgba(255,255,255,.7); }

.lb-list { display: flex; flex-direction: column; gap: .25rem; max-height: 55vh; overflow-y: auto; }
.lb-row {
  display: grid;
  grid-template-columns: 36px 1fr 60px;
  padding: .45rem .6rem;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 8px;
  font-size: .75rem;
  align-items: center;
}
.lb-row.user {
  background: linear-gradient(135deg, rgba(255,215,0,.15), rgba(255,140,0,.06));
  border-color: rgba(255,215,0,.4);
}
.lb-rank-col  { text-align: center; font-weight: 700; color: rgba(255,255,255,.7); }
.lb-nick-col  { color: rgba(255,255,255,.9); }
.lb-score-col { text-align: right; color: rgba(255,255,255,.75); font-variant-numeric: tabular-nums; }
.lb-row.top3 .lb-rank-col { color: #FFD700; }
.lb-separator {
  padding: .25rem 0; text-align: center;
  color: rgba(255,255,255,.3); font-size: .7rem;
}
```

- [x] **Step 4: Render in `js/main.js`**

```javascript
import { computeRanking, ensureLeaderboardId, addWeekScore, getWeekScore, checkWeeklyRollover, getIsoWeekKey } from './leaderboard.js';

function openLeaderboard() {
  ensureLeaderboardId();
  renderLeaderboard();
  const s = document.getElementById('leaderboardScreen');
  s.classList.remove('hidden'); s.classList.add('show');
}
function closeLeaderboard() {
  const s = document.getElementById('leaderboardScreen');
  s.classList.remove('show');
  setTimeout(() => s.classList.add('hidden'), 250);
}

function renderLeaderboard() {
  const userMax = parseInt(localStorage.getItem('catsort_max_level') || '1', 10);
  const { rank, total, entries, userNick } = computeRanking(userMax);

  // Timer (until Monday 00:00)
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  const msLeft = nextMonday.getTime() - now.getTime();
  const d = Math.floor(msLeft / 86400000);
  const h = Math.floor((msLeft % 86400000) / 3600000);
  document.getElementById('lbTimer').textContent = 'Woche endet in ' + d + 'd ' + h + 'h';

  // User banner
  document.getElementById('lbUserBanner').innerHTML = `
    <span class="lb-rank">#${rank}</span>
    <span class="lb-nick">${userNick}</span>
    <span class="lb-score">${getWeekScore()} Punkte</span>
  `;

  // List: Top 10 + ellipsis + 5 around user
  const list = document.getElementById('lbList');
  list.innerHTML = '';
  const top10 = entries.slice(0, 10);
  top10.forEach((e, i) => list.appendChild(renderLbRow(e, i + 1)));

  if (rank > 15) {
    list.insertAdjacentHTML('beforeend', '<div class="lb-separator">· · ·</div>');
    const from = Math.max(10, rank - 3), to = Math.min(entries.length, rank + 2);
    for (let i = from; i < to; i++) list.appendChild(renderLbRow(entries[i], i + 1));
  }
}

function renderLbRow(entry, rank) {
  const row = document.createElement('div');
  row.className = 'lb-row' + (entry.isUser ? ' user' : '') + (rank <= 3 ? ' top3' : '');
  row.innerHTML = `
    <div class="lb-rank-col">${rank}</div>
    <div class="lb-nick-col">${entry.nick}${entry.isUser ? ' (du)' : ''}</div>
    <div class="lb-score-col">${entry.score}</div>
  `;
  return row;
}

// Wire menu button
document.getElementById('leaderboardBtn')?.addEventListener('click', openLeaderboard);
document.getElementById('lbBackBtn')?.addEventListener('click', closeLeaderboard);
```

- [x] **Step 5: Manual test**

Click menu button → leaderboard shows 10 top bots, timer to Monday, user highlighted at their rank. Scroll to see separator + context entries.

- [x] **Step 6: Commit**

```bash
git add index.html css/panels.css js/main.js
git commit -m "leaderboard: weekly ranking screen with top-10 + context window"
```

---

### Task 8.3: Weekly score hooks + rollover rewards

**Files:**
- Modify: `js/main.js` (add score calls at same events as XP)

- [x] **Step 1: Wherever XP is added (task 4.2), also call `addWeekScore`**

Score rules:
```javascript
// per spec §8.5
// levelSolve=1, threeStar=3, daily=10, weeklyStage=20, miniGame=5
addWeekScore(stars >= 3 ? 3 : 1);            // level win
addWeekScore(10);                             // daily
addWeekScore(20);                             // weekly stage
addWeekScore(5);                              // mini-game win
```

Add these alongside the existing `addXp(...)` calls from Task 4.2.

- [x] **Step 2: Rollover check at boot + reward overlay**

```javascript
import { checkWeeklyRollover } from './leaderboard.js';

const rolloverResult = checkWeeklyRollover();
if (rolloverResult) {
  // Show reward overlay
  setTimeout(() => showWeeklyResultOverlay(rolloverResult), 1500);
}

function showWeeklyResultOverlay(r) {
  // Reuse cat-unlock overlay style or create a bespoke simple modal
  alert(`Wochen-Ergebnis: Platz ${r.rank} mit ${r.prevScore} Punkten → ${r.reward} Fischgräten!`);
  // TODO replace alert with styled overlay in a future polish pass
}
```

(A proper overlay can replace `alert` after Phase 9 Visual Polish; for now the mechanism is in place.)

- [x] **Step 3: Manual test**

Simulate rollover:
```javascript
localStorage.setItem('catsort_week_score', JSON.stringify({weekKey: '2026-W16', score: 80}));
localStorage.setItem('catsort_last_week_rollover', '2026-W16');
location.reload();
// if current week is W17 or later, should trigger rollover → alert
```

- [x] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "leaderboard: weekly score hooks + rollover reward grant"
```

---

### Phase 8 Checkpoint

- [x] Leaderboard button in menu
- [x] User's nick auto-generated on first open
- [x] Top 10 + context window renders with user highlighted
- [x] Weekly score increments correctly from gameplay
- [x] Rollover on Monday awards bones based on rank
- [x] Bots feel realistic (not all beating the user, not all losing)

---

## Phase 9: Visual Polish

**Ships:** Splash cinematic, menu felt texture, gold-foil CTAs everywhere premium is pitched, ambient motion.

### Task 9.1: Splash Ken-Burns + blink + skip

**Files:**
- Modify: `css/splash.css` (Ken-Burns animation)
- Modify: `js/splash.js` (tap-to-skip handler)

- [x] **Step 1: Add Ken-Burns to `.splash-bg` in `css/splash.css`**

```css
.splash-bg {
  position: absolute; inset: 0; z-index: 0;
  background: url('../img/splash-bg.png') center center / cover no-repeat;
  animation: kenBurns 6s ease-out forwards;
}
@keyframes kenBurns {
  0%   { transform: scale(1.0)  translate(0, 0); }
  100% { transform: scale(1.08) translate(-2%, -1%); }
}
```

- [x] **Step 2: Skip handler — tap to fast-forward to play button**

In `js/splash.js`, find the splash init function. After the DOM is built, add:

```javascript
function enableSkip() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;
  const skip = () => {
    splash.classList.add('fast-forward');
    // Force all animations to their end state
    const bg = splash.querySelector('.splash-bg');
    if (bg) bg.style.animationDuration = '0.2s';
    // If a play button exists, ensure it's visible
    splash.querySelectorAll('.splash-play, .splash-tagline, .splash-welcome').forEach(el => {
      el.style.animationDelay = '0.1s';
    });
  };
  splash.addEventListener('click', (e) => {
    if (e.target.closest('button')) return; // let real buttons work
    skip();
  }, { once: true });
}
```

Call `enableSkip()` at splash boot.

- [x] **Step 3: Manual test**

Reload → splash does slow zoom+pan. Tap → animations fast-forward to end state immediately.

- [x] **Step 4: Commit**

```bash
git add css/splash.css js/splash.js
git commit -m "polish: splash Ken-Burns zoom + tap-to-skip"
```

---

### Task 9.2: Menu felt texture + ambient motion

**Files:**
- Modify: `css/panels.css` (inline SVG noise pattern)
- Modify: `js/main.js` (spawn 2-3 dust particles when menu open)

- [x] **Step 1: Add noise overlay to menu in `css/panels.css`**

Inside `.ls-inner`:
```css
.ls-inner {
  /* existing rules kept */
  position: relative;
}
.ls-inner::after {
  content: '';
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.15 0'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>");
  opacity: .12;
  mix-blend-mode: overlay;
  pointer-events: none;
  border-radius: inherit;
  z-index: 0;
}
.ls-inner > * { position: relative; z-index: 1; }
```

- [x] **Step 2: Ambient dust in menu**

Add a small canvas to the menu (or reuse existing particles):

```html
<!-- In index.html inside .ls-inner, before .ls-title-logo -->
<canvas id="menuAmbient" class="menu-ambient" width="420" height="600"></canvas>
```

CSS:
```css
.menu-ambient {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0;
  opacity: .4;
}
```

In main.js:
```javascript
let _menuAmbientRaf = 0;
function startMenuAmbient() {
  const canvas = document.getElementById('menuAmbient');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  const particles = Array.from({ length: 14 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.15,
    vy: -0.1 - Math.random() * 0.1,
    r: 1 + Math.random() * 2,
    alpha: 0.15 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  }));

  function step(t) {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.1;
      p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      ctx.fillStyle = `rgba(255,215,0,${p.alpha})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    _menuAmbientRaf = requestAnimationFrame(step);
  }
  cancelAnimationFrame(_menuAmbientRaf);
  _menuAmbientRaf = requestAnimationFrame(step);
}
function stopMenuAmbient() {
  cancelAnimationFrame(_menuAmbientRaf);
  _menuAmbientRaf = 0;
}
```

Call `startMenuAmbient()` when `.level-select` is shown, `stopMenuAmbient()` when hidden.

- [x] **Step 3: Manual test**

Open menu → faint gold dust drifts upward in background. Close menu → stops.

- [x] **Step 4: Commit**

```bash
git add index.html css/panels.css js/main.js
git commit -m "polish: menu felt noise texture + ambient gold dust particles"
```

---

### Task 9.3: Gold-foil shimmer on all premium CTAs

**Files:**
- Modify: `css/premium.css` (already has shimmer), ensure all premium CTA buttons get `.premium-cta` class
- Audit main.js and index.html

- [x] **Step 1: Audit classes**

Search for premium-related buttons and ensure they have `.premium-cta`:
```bash
grep -rn "premiumBtn\|adPremiumBtn\|livesClubBtn\|passUpgradeBtn" index.html js/main.js
```

All buttons that open the paywall should carry `.premium-cta`. Update any missing ones by adding the class in HTML or programmatically.

- [x] **Step 2: Ensure `.premium-cta` has the gold-foil shimmer (already defined in Task 2.2, verify by inspecting)**

Open the paywall + shop + any premium CTA button in the browser → all should shimmer gold.

- [x] **Step 3: Commit if any class additions**

```bash
git add -u
git commit -m "polish: unify premium CTA class across all buy/club entry points"
```

---

### Task 9.4: Proper weekly result overlay (replace alert)

**Files:**
- Modify: `index.html` (add overlay), `css/premium.css` (style), `js/main.js` (use overlay)

- [x] **Step 1: Add HTML near other overlays**

```html
<div id="weeklyResultOverlay" class="screen-overlay sheet-panel hidden">
  <div class="weekly-result-card">
    <div class="weekly-result-trophy">🏆</div>
    <h2 class="weekly-result-title">Wochen-Ergebnis</h2>
    <div class="weekly-result-rank">Platz <span id="weeklyResultRank">-</span></div>
    <div class="weekly-result-score"><span id="weeklyResultScore">0</span> Punkte</div>
    <div class="weekly-result-reward"><i class="fishbone"></i> <span id="weeklyResultReward">0</span> Fischgräten</div>
    <button class="win-btn" id="weeklyResultClose">Weiter →</button>
  </div>
</div>
```

- [x] **Step 2: CSS in `css/premium.css`**

```css
.weekly-result-card {
  max-width: 400px;
  background: linear-gradient(180deg, #2a2014 0%, #1a1008 100%);
  border: 1px solid rgba(255,215,0,.3);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  text-align: center;
}
.weekly-result-trophy {
  font-size: 3.5rem;
  filter: drop-shadow(0 0 18px rgba(255,215,0,.6));
  animation: trophyBounce .8s ease-out;
}
@keyframes trophyBounce {
  0%   { transform: scale(0) rotate(-30deg); }
  60%  { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1)   rotate(0); }
}
.weekly-result-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.3rem; color: #FFD700;
  margin: .3rem 0;
}
.weekly-result-rank {
  font-size: 2rem; font-weight: 700;
  color: #fff; margin: .5rem 0;
}
.weekly-result-score, .weekly-result-reward {
  font-size: 1rem; color: rgba(255,255,255,.85);
  margin: .3rem 0;
}
.weekly-result-reward { color: #FFD700; font-weight: 600; }
```

- [x] **Step 3: In `js/main.js`, replace the alert with overlay**

```javascript
function showWeeklyResultOverlay(r) {
  document.getElementById('weeklyResultRank').textContent   = r.rank;
  document.getElementById('weeklyResultScore').textContent  = r.prevScore;
  document.getElementById('weeklyResultReward').textContent = r.reward;
  const o = document.getElementById('weeklyResultOverlay');
  o.classList.remove('hidden'); o.classList.add('show');
  document.getElementById('weeklyResultClose').onclick = () => {
    o.classList.remove('show');
    setTimeout(() => o.classList.add('hidden'), 250);
  };
}
```

- [x] **Step 4: Commit**

```bash
git add index.html css/premium.css js/main.js
git commit -m "polish: weekly result overlay (replaces alert)"
```

---

### Phase 9 Checkpoint

- [x] Splash zooms slowly and is tap-skippable
- [x] Menu has felt texture + ambient gold dust
- [x] All premium CTAs shimmer gold
- [x] Weekly rollover shows a proper overlay, no more alert
- [x] Performance remains smooth on mobile (check 60fps in DevTools)

---

## Phase 10: Launch Preparation

**Ships:** The flip-switch documentation, full integration sweep, and a final manual QA pass.

### Task 10.1: Launch switch documentation inside the code

**Files:**
- Modify: `js/billing.js` (add rich header comment)
- Create: `docs/LAUNCH.md`

- [x] **Step 1: Add a detailed launch-comment at the top of `js/billing.js`**

```javascript
/* ══════════════════════════════════════════════════════════════════════════
   LAUNCH PROCEDURE
   ───────────────────────────────────────────────────────────────────────
   When Stripe is ready (company registered, account active):

   1. In js/constants.js:
      export const BILLING_MODE = 'stripe';
      export const STRIPE_LINKS = {
        monthly:  'https://buy.stripe.com/XXX',   // from Stripe Dashboard
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
```

- [x] **Step 2: Create `docs/LAUNCH.md`**

```markdown
# Launch-Prozedur — Kittysort Premium

## Voraussetzungen
- [x] Firma gegründet und Stripe-Account verifiziert
- [x] Bankverbindung hinterlegt, USt-ID eingetragen
- [x] AGB und Widerrufsbelehrung verlinkt in `index.html` Footer

## Schritte

### 1. Stripe Payment Links erstellen
Im Stripe Dashboard → Payment Links → Neu erstellen:

| Produkt | Preis | Intervall | Trial |
|---|---|---|---|
| Kittysort Club Monatlich | 3,99€ | Monat | 7 Tage |
| Kittysort Club Jährlich | 29,99€ | Jahr | 7 Tage |
| Kittysort Club Lifetime | 39,99€ | einmalig | — |

Success URL pro Produkt:
```
https://kittysort.de/?success=1&tier=monthly
https://kittysort.de/?success=1&tier=yearly
https://kittysort.de/?success=1&tier=lifetime
```

### 2. Konfiguration umschalten

In `js/constants.js`:
```javascript
export const BILLING_MODE = 'stripe';
export const STRIPE_LINKS = {
  monthly:  'https://buy.stripe.com/xxx',
  yearly:   'https://buy.stripe.com/yyy',
  lifetime: 'https://buy.stripe.com/zzz',
};
```

### 3. Testen

- Test-Karte: 4242 4242 4242 4242, beliebiges zukünftiges Ablaufdatum, beliebige CVC
- Trial: wenn bei Stripe aktiviert, wird bei Testzahlung keine Karte belastet
- Return-URL muss Subscription-Status setzen → prüfen mit DevTools localStorage

### 4. Go-Live

- Deploy auf kittysort.de
- Echte Zahlung mit eigener Karte testen (kleiner Betrag)
- Bei Erfolg: Widerruf in Stripe ausführen, Launch kommunizieren

### 5. Post-Launch-Monitoring

- Stripe Dashboard täglich checken
- Conversion-Rate der Paywall beobachten (im Code `console.log('paywall:trigger:' + id)` bereits drin — später Amplitude einbinden)
- Founders (Grandfathered 4,99€-Käufer) haben Lifetime-Premium als Dank für frühe Unterstützung
```

- [x] **Step 3: Commit**

```bash
git add js/billing.js docs/LAUNCH.md
git commit -m "docs: launch procedure with step-by-step Stripe wiring"
```

---

### Task 10.2: Integration sweep + regression test

**Files:**
- Manual verification across all flows

- [x] **Step 1: Fresh-install smoke test**

```javascript
// DevTools:
Object.keys(localStorage).forEach(k => { if (k.startsWith('catsort')) localStorage.removeItem(k); });
location.reload();
```

Verify:
- Splash plays with Ken-Burns + skip
- Menu shows no premium badge, free-track Season Pass timer
- Play level 1-4, no paywall yet, XP accrues
- Play level 5, celebrate → paywall "Du hast Talent!" appears, dismiss
- Open Season Pass → XP 40-50, Tier 1-2, rewards list
- Open Shop → new prices correct
- Open Leaderboard → bots rendered, user at ~mid rank with 4-5 points
- Open Album → no premium cats, 4 Kirschblüte silhouettes locked
- Try to start Tetris → uses 1 life, HUD shows 4 lives

- [x] **Step 2: Founder migration test**

```javascript
Object.keys(localStorage).forEach(k => { if (k.startsWith('catsort')) localStorage.removeItem(k); });
localStorage.setItem('catsort-premium', 'true');
location.reload();
```

Verify:
- HUD shows crown + ∞ lives
- Menu shows silver "FOUNDER" badge
- Album shows silver founder badge on premium cats
- Season Pass — premium track accessible
- No paywall triggers fire

- [x] **Step 3: Purchase flow test**

```javascript
Object.keys(localStorage).forEach(k => { if (k.startsWith('catsort')) localStorage.removeItem(k); });
location.reload();
```

- Click premium banner → paywall opens
- Select Monthly → buy → trial granted → celebration
- Close celebration → "KLUB-MITGLIED SEIT [month]" gold badge
- Wait (or simulate expiry):
```javascript
const s = JSON.parse(localStorage.getItem('catsort_subscription'));
s.trialEnd = new Date(Date.now() - 1000).toISOString();
s.expiresAt = s.trialEnd;
localStorage.setItem('catsort_subscription', JSON.stringify(s));
location.reload();
```
- Banner should now show "Trial vorbei" → conversion reminder

- [x] **Step 4: Season rollover edge case**

```javascript
const p = JSON.parse(localStorage.getItem('catsort_season'));
p.seasonKey = '2026-04';   // last month
p.xp = 2000;
p.claimedFree = [];
p.claimedPremium = [];
localStorage.setItem('catsort_season', JSON.stringify(p));
// set founder so premium rewards count
localStorage.setItem('catsort-premium', 'true');
location.reload();
```

Check bones balance increased (all unclaimed rewards auto-credited), then current season is fresh.

- [x] **Step 5: Performance check**

Play 10 levels. Open DevTools Performance tab, record 10 seconds of gameplay. Frame rate should stay ≥55 fps on an average laptop. If not, profile the ambient menu particles or leaderboard render.

- [x] **Step 6: Console errors**

Open the console, interact with every screen (Menu → Play → Win → Pass → Leaderboard → Album → Shop → Settings → Paywall → Celebration). **Zero errors or 404s** expected.

- [x] **Step 7: Pipeline update**

```powershell
pipeline-update -Slug colordrop `
  -Stage monetization `
  -Progress 85 `
  -Summary "Premium-Overhaul komplett: Subscription, Season Pass (Kirschblüte), Lives, Paywalls, Leaderboard, Celebration. Launch-ready — wartet auf Stripe." `
  -Todos @("Firma gründen","Stripe Payment Links erstellen","BILLING_MODE umschalten","AGB/Widerruf verlinken","Live-Deploy")
```

- [x] **Step 8: Final commit + push**

```bash
git add -A
git commit -m "release: premium-overhaul complete, awaiting stripe launch switch"
# (user does the push explicitly)
```

---

### Phase 10 Checkpoint

- [x] LAUNCH.md exists and is accurate
- [x] js/billing.js has inline launch instructions
- [x] Fresh install works end-to-end
- [x] Founder migration preserves premium
- [x] Trial expiry downgrades correctly
- [x] No console errors anywhere
- [x] Performance ≥55fps during play
- [x] Pipeline dashboard updated

---

## Self-Review (Inline)

After writing this plan, a quick sanity pass against the spec:

- §1 Architektur-Prinzip — ✓ Task 1.4 + 1.5 + 1.6 cover storage/migration/billing abstraction
- §2 Ökonomie-Rebalance — ✓ Task 1.1 + 1.2 + 1.3
- §3 Subscription-System — ✓ Task 1.4 (storage) + 1.5 (billing) + 2.1-2.5 (UI)
- §4 Season Pass — ✓ Phase 4 (6 tasks)
- §5 Lives-System — ✓ Phase 6 (3 tasks)
- §6 Contextual Paywalls & Celebration — ✓ Task 2.3/2.5 (celebration) + Phase 7 (triggers)
- §7 Premium-Status-Signale — ✓ Phase 3 (4 tasks)
- §8 Pseudo-Leaderboard — ✓ Phase 8 (3 tasks)
- §9 Visual Polish — ✓ Phase 9 (4 tasks)
- §10 Datei-Struktur — ✓ matches: billing.js, paywall.js, season.js, season-content.js, lives.js, leaderboard.js, premium.css, season.css, all extended files as specified
- §11 Launch-Checkliste — ✓ Phase 10

**Known simplifications** (documented gaps, not bugs):
- "consumeUndoToken" referenced in Task 4.6 Step 1 — the plan says "pattern identical to consumeHintToken" but doesn't reproduce the code. This is the single "similar to X" shortcut; when executing, copy the hint-token pattern verbatim with key `catsort_free_undos`.
- The weekly rollover `alert()` in Task 8.3 is intentionally replaced later in Task 9.4 — sequence is correct.
- Task 3.3 album classification assumes existing `renderAlbum` code structure; the executor must locate the exact insertion point per current codebase.

**No placeholders (TBD/TODO/etc.) remain** other than the intentional June/July season content slots in `season-content.js` (spec §4.4 explicitly allows).








