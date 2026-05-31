# Rewarded Video System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein echtes Rewarded-Video-System, das Belohnungen nur nach abgeschlossenem (simuliertem) Video vergibt, mit Tageslimit+Cooldown und vier Surfaces.

**Architecture:** Ein neues Modul `js/rewarded.js` kapselt Provider/Player + Gate und liefert `showRewarded(surface) → Promise<{completed}>`. Die reine Cap/Cooldown-Logik liegt isoliert in `js/rewarded-caps.js` (keine Browser-Imports, Node-testbar). Belohnungen vergeben die Aufrufstellen selbst. Provider-Switch `REWARDED_MODE='preview'` spiegelt das bestehende `BILLING_MODE`-Muster.

**Tech Stack:** Vanilla ES-Module (Browser `<script type="module">`), localStorage, Canvas-Spiel. Node nur für Unit-Tests der reinen Logik.

**Spec:** `docs/superpowers/specs/2026-05-31-rewarded-video-system-design.md`

---

## File Structure

- **Create** `js/rewarded-caps.js` — reine Funktionen: `emptyState`, `resetIfNewDay`, `canClaim`, `recordClaim`. Keine Imports. Eine Verantwortung: Cap/Cooldown-Buchhaltung.
- **Create** `js/rewarded.js` — öffentliche API (`canShowRewarded`, `showRewarded`) + Provider (`preview`/`adsense`/`native`) + Preview-Player-Overlay-Steuerung.
- **Create** `package.json` (Root) — nur `{"type":"module"}`, damit Node die ESM-`.js`-Dateien testen kann. Browser unberührt.
- **Create** `test/rewarded-caps.test.mjs` — Node-Unit-Tests der reinen Logik.
- **Modify** `js/constants.js` — `REWARDED_MODE`, `REWARDED_LIMITS`.
- **Modify** `js/storage.js` — `loadRewardedState`, `saveRewardedState`.
- **Modify** `index.html` — `#rewardedOverlay` + Bones-Button im Shop-Header + „+20s"-Button im Timeout-Overlay.
- **Modify** `css/overlays.css` — Styles für `#rewardedOverlay` (Pfötchen-Puls).
- **Modify** `js/main.js` — Surfaces verdrahten: life (`livesAdBtn`), hint (`showHintAction`/`applyHint`/`grantFreeHint`), bones (Shop-Button), continue (Timeout-Overlay). Plus Import von `showRewarded`/`canShowRewarded`.
- **Modify** `js/render.js` — Timeout-Pfad: „continue"-Button im Timeout-Overlay sichtbar schalten.

---

## Task 1: Reine Cap/Cooldown-Logik (`rewarded-caps.js`) + Node-Test-Setup

**Files:**
- Create: `package.json`
- Create: `js/rewarded-caps.js`
- Test: `test/rewarded-caps.test.mjs`

- [ ] **Step 1: Root-`package.json` anlegen (ermöglicht ESM in Node-Tests)**

Create `package.json`:

```json
{
  "name": "colordrop",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Failing test schreiben**

Create `test/rewarded-caps.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, resetIfNewDay, canClaim, recordClaim } from '../js/rewarded-caps.js';

const LIMITS = {
  bones: { daily: 3, cooldownMs: 300000, amount: 50 },
  life:  { daily: 5, cooldownMs: 60000 },
};

test('emptyState starts at given date with no counts', () => {
  const s = emptyState('2026-05-31');
  assert.equal(s.date, '2026-05-31');
  assert.deepEqual(s.counts, {});
  assert.deepEqual(s.lastView, {});
});

test('resetIfNewDay wipes counts when the day changed', () => {
  const old = { date: '2026-05-30', counts: { bones: 3 }, lastView: { bones: 111 } };
  const reset = resetIfNewDay(old, '2026-05-31');
  assert.equal(reset.date, '2026-05-31');
  assert.deepEqual(reset.counts, {});
});

test('resetIfNewDay keeps state on the same day', () => {
  const s = { date: '2026-05-31', counts: { bones: 1 }, lastView: { bones: 5 } };
  assert.equal(resetIfNewDay(s, '2026-05-31'), s);
});

test('canClaim ok when under daily cap and no cooldown', () => {
  const s = emptyState('2026-05-31');
  const r = canClaim(s, 'bones', 1_000_000, LIMITS);
  assert.equal(r.ok, true);
  assert.equal(r.remaining, 3);
});

test('canClaim capped when daily limit reached', () => {
  const s = { date: '2026-05-31', counts: { bones: 3 }, lastView: {} };
  const r = canClaim(s, 'bones', 1_000_000, LIMITS);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'capped');
});

test('canClaim cooldown blocks a too-soon second view', () => {
  const s = { date: '2026-05-31', counts: { bones: 1 }, lastView: { bones: 1_000_000 } };
  const r = canClaim(s, 'bones', 1_000_000 + 10_000, LIMITS); // 10s < 300s cooldown
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'cooldown');
  assert.ok(r.msUntil > 0);
});

test('canClaim ok again after cooldown elapsed', () => {
  const s = { date: '2026-05-31', counts: { bones: 1 }, lastView: { bones: 1_000_000 } };
  const r = canClaim(s, 'bones', 1_000_000 + 300_001, LIMITS);
  assert.equal(r.ok, true);
});

test('canClaim unavailable for unknown surface', () => {
  const r = canClaim(emptyState('2026-05-31'), 'nope', 1, LIMITS);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'unavailable');
});

test('recordClaim increments count and stamps lastView immutably', () => {
  const s = emptyState('2026-05-31');
  const s2 = recordClaim(s, 'bones', 42);
  assert.equal(s2.counts.bones, 1);
  assert.equal(s2.lastView.bones, 42);
  assert.deepEqual(s.counts, {}, 'original state not mutated');
});
```

- [ ] **Step 3: Test ausführen, Fehlschlag bestätigen**

Run: `node --test test/rewarded-caps.test.mjs`
Expected: FAIL — `Cannot find module '../js/rewarded-caps.js'`.

- [ ] **Step 4: Minimal-Implementierung schreiben**

Create `js/rewarded-caps.js`:

```js
'use strict';

// Reine Cap/Cooldown-Buchhaltung. Keine Browser-Imports → Node-testbar.
// state shape: { date: 'YYYY-MM-DD', counts: {surface:n}, lastView: {surface:ts} }

export function emptyState(today) {
  return { date: today, counts: {}, lastView: {} };
}

export function resetIfNewDay(state, today) {
  if (!state || state.date !== today) return emptyState(today);
  return state;
}

export function canClaim(state, surface, now, limits) {
  const lim = limits[surface];
  if (!lim) return { ok: false, reason: 'unavailable' };

  const used = (state.counts && state.counts[surface]) || 0;
  const remaining = Math.max(0, lim.daily - used);
  if (remaining <= 0) return { ok: false, reason: 'capped', remaining: 0 };

  const last = (state.lastView && state.lastView[surface]) || 0;
  const elapsed = now - last;
  if (last && elapsed < lim.cooldownMs) {
    return { ok: false, reason: 'cooldown', remaining, msUntil: lim.cooldownMs - elapsed };
  }
  return { ok: true, remaining };
}

export function recordClaim(state, surface, now) {
  const counts   = { ...(state.counts || {}) };
  const lastView = { ...(state.lastView || {}) };
  counts[surface]   = (counts[surface] || 0) + 1;
  lastView[surface] = now;
  return { ...state, counts, lastView };
}
```

- [ ] **Step 5: Test ausführen, Erfolg bestätigen**

Run: `node --test test/rewarded-caps.test.mjs`
Expected: PASS — alle Tests grün.

- [ ] **Step 6: Commit**

```bash
git add package.json js/rewarded-caps.js test/rewarded-caps.test.mjs
git commit -m "feat(rewarded): pure cap/cooldown logic + node test setup"
```

---

## Task 2: Konstanten & Persistenz

**Files:**
- Modify: `js/constants.js` (nach dem `REWARDS`-Block, ~Zeile 190)
- Modify: `js/storage.js` (nach dem Daily-Block, ~Zeile 53)

- [ ] **Step 1: `REWARDED_MODE` + `REWARDED_LIMITS` in `constants.js` ergänzen**

In `js/constants.js`, direkt nach dem `export const REWARDS = {...};`-Block einfügen:

```js
// ── Rewarded video (flip to 'adsense' at launch) ─────────────────────────
export const REWARDED_MODE = 'preview';   // 'preview' | 'adsense' | 'native'

export const REWARDED_LIMITS = {
  life:     { daily: 5,  cooldownMs: 60000 },              // 1 Min
  hint:     { daily: 10, cooldownMs: 30000 },              // großzügig
  bones:    { daily: 3,  cooldownMs: 300000, amount: 50 }, // 5 Min, +50 Fischgräten
  continue: { daily: 3,  cooldownMs: 60000 },              // Blitz-Timeout
};
```

- [ ] **Step 2: Storage-Accessoren in `storage.js` ergänzen**

In `js/storage.js`, direkt nach `export function saveDaily(obj) {...}` einfügen:

```js
// ── Rewarded video state ───────────────────────────────────────────────────
export function loadRewardedState() {
  return loadJSON(key('rewarded'), null);
}

export function saveRewardedState(state) {
  saveJSON(key('rewarded'), state);
}
```

- [ ] **Step 3: Syntaxcheck**

Run: `node --check js/constants.js && node --check js/storage.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add js/constants.js js/storage.js
git commit -m "feat(rewarded): constants and persistence for rewarded state"
```

---

## Task 3: Rewarded-Modul (`rewarded.js`) — API + Provider + Preview-Player

**Files:**
- Create: `js/rewarded.js`
- Modify: `index.html` (neues Overlay, nach `#adOverlay` ~Zeile 585)
- Modify: `css/overlays.css` (Pfötchen-Puls)

- [ ] **Step 1: Preview-Overlay-Markup in `index.html` einfügen**

In `index.html`, direkt nach dem schließenden `</div>` von `#adOverlay` (nach Zeile 585) einfügen:

```html
    <!-- Rewarded Video (Preview-Simulation) -->
    <div id="rewardedOverlay" class="overlay">
      <div class="win-card">
        <div class="win-icon rewarded-paw">🐾</div>
        <h2 class="win-title" style="font-size:1.2rem">Werbung läuft …</h2>
        <p class="win-sub">Belohnung in <b id="rewardedCountdown">5</b> s</p>
        <div class="win-actions">
          <button class="win-btn hidden" id="rewardedClaimBtn" type="button">Belohnung abholen 🎁</button>
          <button class="win-btn win-btn--secondary" id="rewardedCancelBtn" type="button">Abbrechen</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Pfötchen-Puls-Style in `css/overlays.css` ergänzen**

Am Ende von `css/overlays.css` anhängen. **Wichtig:** Es gibt keine generische
`.hidden`-Regel im Projekt (alle bestehenden sind scoped), daher braucht es
explizit `.win-btn.hidden`, sonst werden Claim-/Cancel-/Continue-Buttons nicht
versteckt:

```css
/* Rewarded video preview overlay */
.win-btn.hidden { display: none; }

.rewarded-paw {
  animation: rewardedPaw 1s ease-in-out infinite;
}
@keyframes rewardedPaw {
  0%, 100% { transform: scale(1);    opacity: 0.85; }
  50%      { transform: scale(1.15); opacity: 1; }
}
```

- [ ] **Step 3: `js/rewarded.js` schreiben**

Create `js/rewarded.js`:

```js
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   REWARDED VIDEO — LAUNCH PROCEDURE
   ───────────────────────────────────────────────────────────────────────
   Aktuell REWARDED_MODE='preview' (constants.js): simuliertes Video, keine
   echte Werbung. Zum Live-Schalten mit Google H5 Games Ads:

   1. AdSense-für-Spiele-Account aktiv, Domain (kittysort.de) freigegeben.
   2. H5 Games Ads SDK im <head> laden:
      <script async src="https://...adsbygoogle.js?client=ca-pub-XXXX"></script>
      window.adsbygoogle = window.adsbygoogle || [];
      window.adConfig({ preloadAdBreaks: 'on' });
   3. In constants.js: export const REWARDED_MODE = 'adsense';
   4. playAdSenseAd() unten nutzt window.adBreak({type:'reward', ...}).
      Kein Fill / Abbruch → {completed:false} → keine Belohnung.

   Native (iOS/Android IAP-Ad-Bridge): REWARDED_MODE='native', eigenes
   js/native-rewarded.js bereitstellen.
   ══════════════════════════════════════════════════════════════════════════ */

import { REWARDED_MODE, REWARDED_LIMITS } from './constants.js';
import { loadRewardedState, saveRewardedState } from './storage.js';
import { isPremium } from './economy.js';
import { resetIfNewDay, canClaim, recordClaim } from './rewarded-caps.js';
import { playSound } from './audio.js';

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// Lädt State, wendet Mitternacht-Reset an und persistiert den Reset.
function freshState() {
  const state = resetIfNewDay(loadRewardedState(), todayStr());
  saveRewardedState(state);
  return state;
}

// Reiner Gate-Check (kein Ad). Premium → nie Rewarded.
export function canShowRewarded(surface) {
  if (isPremium()) return { ok: false, reason: 'premium' };
  return canClaim(freshState(), surface, Date.now(), REWARDED_LIMITS);
}

// Spielt Ad, bucht bei Abschluss. Belohnung vergibt der Aufrufer.
export async function showRewarded(surface) {
  const gate = canShowRewarded(surface);
  if (!gate.ok) return { completed: false, reason: gate.reason };

  const { completed } = await playAd(surface);
  if (!completed) return { completed: false, reason: 'aborted' };

  saveRewardedState(recordClaim(freshState(), surface, Date.now()));
  return { completed: true };
}

// ── Provider dispatch ──────────────────────────────────────────────────────
function playAd(surface) {
  if (REWARDED_MODE === 'preview') return playPreviewAd();
  if (REWARDED_MODE === 'adsense') return playAdSenseAd(surface);
  if (REWARDED_MODE === 'native')  return Promise.reject(new Error('native rewarded not implemented'));
  return Promise.resolve({ completed: false });
}

// Simuliertes 5-Sekunden-Video mit Abbruch-Option.
function playPreviewAd() {
  return new Promise((resolve) => {
    const overlay    = document.getElementById('rewardedOverlay');
    const countdown  = document.getElementById('rewardedCountdown');
    const claimBtn   = document.getElementById('rewardedClaimBtn');
    const cancelBtn  = document.getElementById('rewardedCancelBtn');

    let remaining = 5;
    countdown.textContent = remaining;
    claimBtn.classList.add('hidden');
    cancelBtn.classList.remove('hidden');
    overlay.classList.add('show');
    playSound('click');

    const interval = setInterval(() => {
      remaining -= 1;
      countdown.textContent = Math.max(0, remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        cancelBtn.classList.add('hidden');
        claimBtn.classList.remove('hidden');
      }
    }, 1000);

    function cleanup() {
      clearInterval(interval);
      overlay.classList.remove('show');
      claimBtn.onclick  = null;
      cancelBtn.onclick = null;
    }
    claimBtn.onclick  = () => { cleanup(); resolve({ completed: true }); };
    cancelBtn.onclick = () => { cleanup(); resolve({ completed: false }); };
  });
}

// Google H5 Games Ads (Stub bis Account/Domain live — siehe Header).
function playAdSenseAd(surface) {
  return new Promise((resolve) => {
    if (typeof window.adBreak !== 'function') { resolve({ completed: false }); return; }
    let earned = false;
    window.adBreak({
      type: 'reward',
      name: 'rewarded-' + surface,
      beforeReward: (showAdFn) => showAdFn(),
      adViewed:     () => { earned = true; },
      adDismissed:  () => {},
      adBreakDone:  () => resolve({ completed: earned }),
    });
  });
}
```

- [ ] **Step 4: Syntaxcheck**

Run: `node --check js/rewarded.js && echo OK`
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add js/rewarded.js index.html css/overlays.css
git commit -m "feat(rewarded): rewarded.js module with preview player + adsense stub"
```

---

## Task 4: Surface „life" — `livesAdBtn` an Rewarded koppeln

**Files:**
- Modify: `js/main.js` — Import (~Zeile 48 Bereich der `./daily.js`-Imports) und `showLivesEmpty` (~Zeile 255)

- [ ] **Step 1: Import von `showRewarded`/`canShowRewarded` ergänzen**

In `js/main.js`, nach der bestehenden Import-Zeile `import { getDailyModifier, ... } from './daily.js';` einfügen:

```js
import { showRewarded, canShowRewarded } from './rewarded.js';
```

- [ ] **Step 2: `livesAdBtn`-Handler auf Rewarded umstellen**

In `js/main.js`, in `showLivesEmpty(retryFn)` den bestehenden Block ersetzen:

```js
  document.getElementById('livesAdBtn').onclick = () => {
    refillWithAd();
    closeLivesEmpty();
    consumeLife(); updateLivesDisplay(); retryFn();
  };
```

durch:

```js
  const livesAdBtn = document.getElementById('livesAdBtn');
  const livesAdGate = canShowRewarded('life');
  livesAdBtn.style.display = livesAdGate.ok ? '' : 'none';
  livesAdBtn.onclick = async () => {
    const { completed } = await showRewarded('life');
    if (!completed) { playSound('invalid'); return; }
    refillWithAd();
    closeLivesEmpty();
    consumeLife(); updateLivesDisplay(); retryFn();
  };
```

- [ ] **Step 3: Syntaxcheck**

Run: `node --check js/main.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Browser-Verifikation**

Statischen Server starten (`python -m http.server 8765`), Seite laden. Im DevTools-Konsolenkontext:
- localStorage so setzen, dass Leben = 0 (`localStorage.setItem('catsort_lives', JSON.stringify({count:0,lastRegen:new Date().toISOString()}))`), Seite neu laden, Level starten, scheitern lassen → „Keine Pfoten"-Overlay.
- „📺 Werbung für +1 Leben" klicken → `#rewardedOverlay` erscheint, Countdown 5→0, „Belohnung abholen" → Overlay schließt, Leben +1, Level-Retry.
- Erneut öffnen innerhalb 60 s → `livesAdBtn` ausgeblendet (Cooldown).

Erwartung: Belohnung nur nach „Belohnung abholen"; „Abbrechen" gibt nichts.

- [ ] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat(rewarded): gate extra-life refill behind rewarded video"
```

---

## Task 5: Surface „hint" — Gratis-Hint per Video bei zu wenig Fischgräten

**Files:**
- Modify: `js/main.js` — `showHintAction` (~Zeile 894) refaktorieren, `grantFreeHint` ergänzen

- [ ] **Step 1: Hint-Anwendung in `applyHint()` extrahieren**

In `js/main.js`, den Move-Such-/Anzeige-Teil am Ende von `showHintAction` (von `let move;` bis `G.hintUntil = G.frameTime + 4000;`) in eine eigene Funktion auslagern. Neue Funktion direkt vor `showHintAction` einfügen:

```js
function applyHint() {
  let move;
  try {
    move = solveHint(G.tubes, G.jokerUsed);
  } catch (e) {
    console.error('solveHint failed:', e);
    return;
  }
  if (!move) {
    G.hintCooldown = true;
    setHintIcon('❌');  // ❌
    const btn = document.getElementById('hintBtn');
    btn.disabled = true;
    setTimeout(() => {
      G.hintCooldown = false;
      setHintIcon('💡');  // 💡
      btn.disabled = false;
    }, 1500);
    return;
  }
  updateHUD();
  G.hintFrom  = move.from;
  G.hintTo    = move.to;
  G.hintUntil = G.frameTime + 4000;
}

// Hint ohne Fischgräten-Kosten (nach abgeschlossenem Rewarded-Video).
function grantFreeHint() {
  applyHint();
}
```

- [ ] **Step 2: `showHintAction` auf `applyHint()` umstellen + Rewarded-Fallback**

In `js/main.js`, `showHintAction` so anpassen, dass der bezahlte Pfad `applyHint()` aufruft und der Fehlschlag-Pfad (zu wenig Fischgräten) ein Rewarded anbietet. Ersetze den Block

```js
  if (!spendHint(G.theme || 'EASY')) {
    setHintIcon(FISHBONE_ICON + '❓');  // fishbone + ❓
    btn.disabled = true;
    setTimeout(() => { setHintIcon('💡'); btn.disabled = false; }, 1500);  // 💡
    return;
  }
```

durch:

```js
  if (!spendHint(G.theme || 'EASY')) {
    // Zu wenig Fischgräten — Gratis-Hint per Video anbieten, falls verfügbar.
    if (canShowRewarded('hint').ok) {
      showRewarded('hint').then(({ completed }) => {
        if (completed) { grantFreeHint(); }
        else { playSound('invalid'); }
      });
    } else {
      setHintIcon(FISHBONE_ICON + '❓');  // fishbone + ❓
      btn.disabled = true;
      setTimeout(() => { setHintIcon('💡'); btn.disabled = false; }, 1500);  // 💡
    }
    return;
  }
```

Und im bezahlten Pfad den ursprünglichen `let move; … G.hintUntil = …`-Block (jetzt am Funktionsende) durch einen einzigen Aufruf ersetzen:

```js
  applyHint();
```

- [ ] **Step 3: Syntaxcheck**

Run: `node --check js/main.js && echo OK`
Expected: `OK`

- [ ] **Step 4: Browser-Verifikation**

- localStorage Fischgräten auf 0 setzen (`localStorage.setItem('catsort_bones','0')`), Seite neu laden, Level starten.
- Hint-Button drücken → `#rewardedOverlay` erscheint (statt rotem ❓). Nach „Belohnung abholen" wird ein Hint angezeigt (`G.hintFrom/hintTo` leuchten), **ohne** dass Fischgräten abgezogen werden.
- „Abbrechen" → kein Hint, `invalid`-Sound.
- Mit genug Fischgräten: Hint zieht normal Kosten ab (bezahlter Pfad unverändert).

- [ ] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat(rewarded): offer free hint via rewarded video when bones short"
```

---

## Task 6: Surface „bones" — Gratis-Fischgräten-Button im Shop

**Files:**
- Modify: `index.html` — Shop-Header (~Zeile 422-425)
- Modify: `js/main.js` — Shop-Open-Handler (~Zeile 2898) + neuer Button-Handler

- [ ] **Step 1: Button-Markup im Shop-Header einfügen**

In `index.html`, den Shop-Header-Block

```html
        <div class="shop-header">
          <h2 class="stats-title">SHOP</h2>
          <span class="shop-balance" id="shopBalance"></span>
        </div>
```

ersetzen durch:

```html
        <div class="shop-header">
          <h2 class="stats-title">SHOP</h2>
          <span class="shop-balance" id="shopBalance"></span>
        </div>
        <button class="win-btn" id="shopRewardBonesBtn" type="button">📺 Gratis-Fischgräten</button>
```

- [ ] **Step 2: Button beim Shop-Öffnen aktualisieren**

In `js/main.js`, im `shopBtn`-Click-Handler vor `document.getElementById('shopScreen').classList.remove('hidden');` einfügen:

```js
  updateShopRewardBtn();
```

Und eine neue Funktion direkt vor dem `shopBtn`-Handler einfügen:

```js
function updateShopRewardBtn() {
  const btn = document.getElementById('shopRewardBonesBtn');
  if (!btn) return;
  const gate = canShowRewarded('bones');
  if (gate.ok) {
    btn.style.display = '';
    btn.disabled = false;
    btn.textContent = '📺 Gratis-Fischgräten (noch ' + gate.remaining + ' heute)';
  } else if (gate.reason === 'cooldown') {
    btn.style.display = '';
    btn.disabled = true;
    btn.textContent = '📺 Gleich wieder verfügbar …';
  } else {
    // premium / capped / unavailable
    btn.style.display = 'none';
  }
}
```

- [ ] **Step 3: Click-Handler für den Bones-Button**

In `js/main.js`, direkt nach dem `shopBackBtn`-Handler (~Zeile 2908) einfügen:

```js
document.getElementById('shopRewardBonesBtn')?.addEventListener('click', async () => {
  const { completed } = await showRewarded('bones');
  if (!completed) { playSound('invalid'); updateShopRewardBtn(); return; }
  earn(REWARDED_LIMITS.bones.amount);
  updateBonesDisplay();
  document.getElementById('shopBalance').textContent = getBalance() + ' 🦴';
  updateShopRewardBtn();
});
```

- [ ] **Step 4: `REWARDED_LIMITS` + `getBalance` importieren falls nötig**

Prüfen, ob `REWARDED_LIMITS` und `getBalance` in `js/main.js` importiert sind. `getBalance` aus `./economy.js`, `REWARDED_LIMITS` aus `./constants.js`. Falls nicht vorhanden, zu den jeweiligen bestehenden Import-Listen hinzufügen.

Run zur Prüfung: `grep -n "getBalance\|REWARDED_LIMITS" js/main.js`
Erwartung: beide erscheinen in den Import-Blöcken. Falls `earn` fehlt, ebenfalls aus `./economy.js` ergänzen (ist aber bereits importiert).

- [ ] **Step 5: Syntaxcheck**

Run: `node --check js/main.js && echo OK`
Expected: `OK`

- [ ] **Step 6: Browser-Verifikation**

- Shop öffnen → Button „📺 Gratis-Fischgräten (noch 3 heute)".
- Klick → Video → „Belohnung abholen" → Fischgräten +50, Balance aktualisiert, Counter „noch 2 heute".
- Sofort erneut → Button „Gleich wieder verfügbar …" deaktiviert (5-Min-Cooldown).
- Nach 3 Views am Tag → Button ausgeblendet (capped).

- [ ] **Step 7: Commit**

```bash
git add index.html js/main.js
git commit -m "feat(rewarded): free fish-bones button in shop via rewarded video"
```

---

## Task 7: Surface „continue" — Blitz-Timeout +20 s per Video

**Files:**
- Modify: `index.html` — Timeout-Overlay (~Zeile 126-134)
- Modify: `js/render.js` — Timeout-Anzeige (~Zeile 1074)
- Modify: `js/main.js` — neuer Continue-Handler + Import von `addTimeFn`-Hilfe

- [ ] **Step 1: Continue-Button im Timeout-Overlay einfügen**

In `index.html`, die `win-actions` des `#timeoutOverlay` erweitern:

```html
            <div class="win-actions">
                <button class="win-btn hidden" id="timeoutContinueBtn" type="button">📺 +20 Sek weiter</button>
                <button class="win-btn" id="timeoutRetryBtn" type="button">Nochmal ↺</button>
            </div>
```

- [ ] **Step 2: Continue-Button beim Timeout sichtbar schalten**

In `js/render.js`, den Timeout-Block

```js
    const timedOut = updateTimer(G.timer, G.frameTime, G.won);
    if (timedOut && !MOUSE.active) {
      ANIM.busy = true;
      document.getElementById('timeoutOverlay').classList.add('show');
    }
```

ersetzen durch:

```js
    const timedOut = updateTimer(G.timer, G.frameTime, G.won);
    if (timedOut && !MOUSE.active) {
      ANIM.busy = true;
      if (window.__configureTimeoutContinue) window.__configureTimeoutContinue();
      document.getElementById('timeoutOverlay').classList.add('show');
    }
```

(`render.js` darf nicht zirkulär `main.js` importieren; daher ruft es eine von `main.js` registrierte Hook-Funktion auf.)

- [ ] **Step 3: Continue-Hook + Handler in `main.js`**

In `js/main.js`, direkt nach dem `timeoutRetryBtn`-Handler (~Zeile 2167) einfügen:

```js
// Von render.js beim Timeout aufgerufen: Continue-Button je nach Gate zeigen.
window.__configureTimeoutContinue = function () {
  const btn = document.getElementById('timeoutContinueBtn');
  if (!btn) return;
  btn.classList.toggle('hidden', !canShowRewarded('continue').ok);
};

document.getElementById('timeoutContinueBtn').addEventListener('click', async () => {
  const { completed } = await showRewarded('continue');
  if (!completed) { playSound('invalid'); return; }
  document.getElementById('timeoutOverlay').classList.remove('show');
  // Timer um 20 s verlängern und weiterspielen.
  G.timer.active  = true;
  G.timer.endTime = performance.now() + 20000;
  G.timer._lastTick = -1;
  ANIM.busy = false;
  document.getElementById('timerBar').classList.add('visible');
});
```

- [ ] **Step 4: Syntaxcheck**

Run: `node --check js/main.js && node --check js/render.js && echo OK`
Expected: `OK`

- [ ] **Step 5: Browser-Verifikation**

- Ein Blitz-Level (`isTimedLevel`, z.B. an einer ⚡-Stelle) starten, Timer ablaufen lassen → Timeout-Overlay mit „📺 +20 Sek weiter".
- Klick → Video → „Belohnung abholen" → Overlay schließt, Timer läuft mit 20 s weiter, Spiel spielbar.
- „Abbrechen" im Video → nichts, Overlay bleibt.
- Nach 3× am Tag → Continue-Button ausgeblendet, nur „Nochmal ↺".

- [ ] **Step 6: Commit**

```bash
git add index.html js/render.js js/main.js
git commit -m "feat(rewarded): blitz timeout +20s continue via rewarded video"
```

---

## Task 8: Gesamt-Verifikation & Aufräumen

**Files:** keine Änderung (Verifikation), ggf. kleine Fixes

- [ ] **Step 1: Unit-Tests laufen**

Run: `node --test`
Expected: alle Tests grün (rewarded-caps).

- [ ] **Step 2: Alle geänderten JS syntaktisch prüfen**

Run: `node --check js/rewarded.js && node --check js/rewarded-caps.js && node --check js/main.js && node --check js/render.js && node --check js/constants.js && node --check js/storage.js && echo ALL_OK`
Expected: `ALL_OK`

- [ ] **Step 3: Premium-Pfad prüfen (Browser)**

- localStorage Subscription auf aktiv setzen (`catsort_subscription` mit `{tier:'lifetime',lifetime:true,active:true}`), Seite neu laden.
- Shop öffnen → „Gratis-Fischgräten"-Button ausgeblendet.
- (Leben/Hint sind für Premium ohnehin unbegrenzt; keine Rewarded-Prompts.)

Erwartung: Kein Rewarded-Surface für Premium sichtbar.

- [ ] **Step 4: Mitternacht-Reset & Cap end-to-end (Browser)**

- Im Konsolenkontext `catsort_rewarded` mit `date` von gestern und `counts.bones:3` setzen, Shop öffnen → Button wieder verfügbar (Reset), Counter „noch 3 heute".

- [ ] **Step 5: Abschluss-Commit (falls Fixes nötig)**

```bash
git add -A
git commit -m "test(rewarded): full verification pass for rewarded video system"
```

---

## Self-Review-Notiz

- **Spec-Abdeckung:** API (Task 3), Provider/Preview/adsense-Stub/native (Task 3), Caps+Cooldown+Reset (Task 1/2), Surfaces life/hint/bones/continue (Task 4–7), Premium-Ausblendung (Task 3 `canShowRewarded` + Surfaces), Abbruch=keine Belohnung (Task 3 `showRewarded`), Tests (Task 1 Node + Browser je Surface). Alle Spec-Abschnitte haben eine Task.
- **Typkonsistenz:** `showRewarded`/`canShowRewarded` Rückgabeform `{ok|completed, reason, remaining, msUntil}` durchgängig; `recordClaim`/`canClaim`/`resetIfNewDay`-Signaturen identisch in Test und Modul.
- **Render-Kopplung:** `render.js` ruft `main.js` über `window.__configureTimeoutContinue` auf, um Zirkular-Import zu vermeiden — bewusst gewählt, da `render.js` bereits andere DOM-Overlays direkt steuert.
