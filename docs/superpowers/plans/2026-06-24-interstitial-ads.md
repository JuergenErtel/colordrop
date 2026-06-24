# Interstitial-Werbung (Variante B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Echte native AdMob-Interstitial-Werbung zwischen Levels (Variante B: Gewinn-Bildschirm zuerst, Werbung beim „Weiter →"), die den Spieler nie blockiert.

**Architecture:** Geteilter AdMob-Init (Consent/ATT/SDK) wandert aus `native-rewarded.js` in ein neues `native-ads.js`; Rewarded und neues `native-interstitial.js` nutzen ihn gemeinsam. Abschluss der Ads läuft über Plugin-Events + Timeout-Netz (kein Hängen). `main.js` setzt beim Sieg nur ein Flag und zeigt die Werbung beim Vorrücken.

**Tech Stack:** Capacitor 8, `@capacitor-community/admob` 8.0.0, Vanilla-ES-Module, Node für Mock-Tests.

## Global Constraints

- Nur native Plattform zeigt Ads; Web/Preview = no-op (Spieler weiter, keine Werbung).
- Spieler wird **nie** blockiert: nicht bereit / kein Fill / kein Consent / Fehler → Werbung überspringen.
- `ADMOB.testing` bleibt `true`; nur Test-IDs (keine echten IDs in diesem Plan).
- Test-Interstitial-Unit (iOS): `ca-app-pub-3940256099942544/4411468910`.
- Plugin-Zugriff nur über `window.Capacitor.Plugins.AdMob` (kein statischer Import).
- Event-Namen (verifiziert): `interstitialAdDismissed`, `interstitialAdFailedToShow`.
- Nach jeder geänderten JS-Datei: `node --check <datei>`. Nach allem: `npm run cap:sync`.

---

### Task 1: Test-Interstitial-ID in Konstanten

**Files:**
- Modify: `js/constants.js` (ADMOB-Objekt)

**Interfaces:**
- Produces: `ADMOB.interstitialUnitId: string`

- [ ] **Step 1: ADMOB-Objekt erweitern**

In `js/constants.js`, im `export const ADMOB = { ... }` die Zeile nach `rewardedUnitId` einfügen:

```js
  rewardedUnitId: 'ca-app-pub-3940256099942544/1712485313', // Test-Rewarded (iOS)
  interstitialUnitId: 'ca-app-pub-3940256099942544/4411468910', // Test-Interstitial (iOS)
```

- [ ] **Step 2: Syntax prüfen**

Run: `node --check js/constants.js`
Expected: kein Output, Exit 0.

- [ ] **Step 3: Commit**

```bash
git add js/constants.js
git commit -m "feat(ads): add test interstitial unit id"
```

---

### Task 2: Geteilten AdMob-Init nach `native-ads.js` extrahieren

**Files:**
- Create: `js/native-ads.js`
- Modify: `js/native-rewarded.js` (Init-Teil entfernen, importieren)
- Modify: `js/main.js:51` (Import-Quelle von `initNativeAds`)
- Test: `tests/native-rewarded.test.mjs` (Regressionstest)

**Interfaces:**
- Produces: `getAdMob(): object|null`, `ensureInit(AdMob): Promise<{canRequestAds:boolean}>`, `initNativeAds(): Promise<void>` — alle aus `js/native-ads.js`.
- Consumes (native-rewarded.js): `getAdMob`, `ensureInit` aus `native-ads.js`.

- [ ] **Step 1: `js/native-ads.js` anlegen** (Init-Logik aus native-rewarded.js übernehmen)

```js
'use strict';

/* Geteilte AdMob-Basis: Consent (UMP) → ATT → SDK-Init, einmalig dedupliziert.
   Wird von native-rewarded.js und native-interstitial.js genutzt. Zugriff nur
   über window.Capacitor.Plugins.AdMob, damit der Web-Bundle unberührt bleibt. */

import { ADMOB } from './constants.js';

let _initPromise = null; // dedupe: Consent/ATT/initialize nur einmal

export function getAdMob() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins.AdMob) || null;
}

async function runInit(AdMob) {
  let canRequestAds = true;
  try {
    let info = await AdMob.requestConsentInfo();
    if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable) {
      info = await AdMob.showConsentForm();
    }
    if (info && typeof info.canRequestAds === 'boolean') {
      canRequestAds = info.canRequestAds;
    }
  } catch (err) {
    console.warn('native-ads: Consent-Schritt übersprungen:', err);
  }

  try {
    if (typeof AdMob.requestTrackingAuthorization === 'function') {
      await AdMob.requestTrackingAuthorization();
    }
  } catch (err) {
    console.warn('native-ads: ATT-Dialog übersprungen:', err);
  }

  await AdMob.initialize({ initializeForTesting: !!ADMOB.testing });
  return { canRequestAds };
}

export function ensureInit(AdMob) {
  if (!_initPromise) {
    _initPromise = runInit(AdMob).catch((err) => {
      _initPromise = null; // bei hartem Fehler nächsten Versuch erlauben
      throw err;
    });
  }
  return _initPromise;
}

export async function initNativeAds() {
  const AdMob = getAdMob();
  if (!AdMob) return;
  try {
    await ensureInit(AdMob);
  } catch (err) {
    console.warn('native-ads: Init beim Launch fehlgeschlagen:', err);
  }
}
```

- [ ] **Step 2: `js/native-rewarded.js` umbauen** — lokale Init-Funktionen löschen, importieren

Den Block von `let _initPromise = null;` (Zeile ~33) bis zum Ende von `export async function initNativeAds() { ... }` (Zeile ~95) **entfernen** und durch einen Import oben in der Datei ersetzen. Die `import { ADMOB } from './constants.js';`-Zeile bleibt. Direkt darunter einfügen:

```js
import { getAdMob, ensureInit, initNativeAds } from './native-ads.js';

export { initNativeAds };
```

(`playNativeRewarded` nutzt weiterhin `getAdMob()` und `ensureInit(AdMob)` — jetzt aus dem Import. Der Rest der Datei bleibt unverändert.)

- [ ] **Step 3: Import in `main.js` umstellen**

`js/main.js:51` ändern von:

```js
import { initNativeAds } from './native-rewarded.js';
```

zu:

```js
import { initNativeAds } from './native-ads.js';
```

- [ ] **Step 4: Regressionstest schreiben** `tests/native-rewarded.test.mjs`

```js
import { pathToFileURL } from 'node:url';
const MOD = pathToFileURL('js/native-rewarded.js').href;

async function run(name, emit) {
  const listeners = {};
  let showResolve, showReject;
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false }),
    requestTrackingAuthorization: async () => ({ status: 'authorized' }),
    initialize: async () => ({}),
    prepareRewardVideoAd: async () => ({ adUnitId: 'x' }),
    addListener: (evt, fn) => { (listeners[evt] ||= []).push(fn); return Promise.resolve({ remove() {} }); },
    showRewardVideoAd: () => new Promise((res, rej) => { showResolve = res; showReject = rej; }),
  };
  global.window = { Capacitor: { isNativePlatform: () => true, Plugins: { AdMob } } };
  const mod = await import(MOD + '?n=' + encodeURIComponent(name));
  const p = mod.playNativeRewarded('life');
  await new Promise(r => setTimeout(r, 30));
  const fire = (e, d) => (listeners[e] || []).forEach(f => f(d));
  emit({ fire, resolveShow: (v) => showResolve && showResolve(v) });
  return await p;
}

const cases = [
  ['reward+resolve+dismiss', ({fire,resolveShow}) => { fire('onRewardedVideoAdReward',{type:'',amount:1}); resolveShow({type:'',amount:1}); fire('onRewardedVideoAdDismissed'); }, true],
  ['dismiss only',           ({fire}) => fire('onRewardedVideoAdDismissed'), false],
  ['show hangs + events',    ({fire}) => { fire('onRewardedVideoAdReward',{type:'',amount:1}); fire('onRewardedVideoAdDismissed'); }, true],
  ['failed to show',         ({fire}) => fire('onRewardedVideoAdFailedToShow',{code:3}), false],
];
let pass = 0;
for (const [name, emit, expected] of cases) {
  const { completed } = await run(name, emit);
  const ok = completed === expected;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} → ${completed} (exp ${expected})`);
  if (ok) pass++;
}
console.log(`${pass}/${cases.length}`);
process.exit(pass === cases.length ? 0 : 1);
```

- [ ] **Step 5: Syntax + Test laufen lassen**

Run: `node --check js/native-ads.js && node --check js/native-rewarded.js && node tests/native-rewarded.test.mjs`
Expected: `4/4`, Exit 0 (Rewarded funktioniert nach dem Refactor unverändert).

- [ ] **Step 6: Commit**

```bash
git add js/native-ads.js js/native-rewarded.js js/main.js tests/native-rewarded.test.mjs
git commit -m "refactor(ads): shared AdMob init in native-ads.js (+ rewarded regression test)"
```

---

### Task 3: `native-interstitial.js` + Mock-Test

**Files:**
- Create: `js/native-interstitial.js`
- Test: `tests/native-interstitial.test.mjs`

**Interfaces:**
- Consumes: `getAdMob`, `ensureInit` aus `native-ads.js`; `ADMOB.interstitialUnitId`.
- Produces: `prepareInterstitial(): Promise<void>`, `showInterstitialIfReady(): Promise<boolean>` (true = Werbung lief und wurde geschlossen; false = übersprungen/Fehler).

- [ ] **Step 1: Fehlschlagenden Test schreiben** `tests/native-interstitial.test.mjs`

```js
import { pathToFileURL } from 'node:url';
const MOD = pathToFileURL('js/native-interstitial.js').href;

async function fresh(opts = {}) {
  const listeners = {};
  let showReject;
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: opts.canRequestAds !== false, isConsentFormAvailable: false }),
    requestTrackingAuthorization: async () => ({ status: 'authorized' }),
    initialize: async () => ({}),
    prepareInterstitial: async () => { if (opts.prepareFails) throw new Error('no fill'); return { adUnitId: 'x' }; },
    addListener: (evt, fn) => { (listeners[evt] ||= []).push(fn); return Promise.resolve({ remove() {} }); },
    showInterstitial: () => new Promise((_res, rej) => { showReject = rej; }),
  };
  global.window = { Capacitor: { isNativePlatform: () => !opts.web, Plugins: { AdMob } } };
  const mod = await import(MOD + '?n=' + Math.random().toString(36).slice(2));
  const fire = (e, d) => (listeners[e] || []).forEach(f => f(d));
  return { mod, fire, rejectShow: (e) => showReject && showReject(e) };
}

let pass = 0, total = 0;
const check = (name, got, exp) => { total++; const ok = got === exp; console.log(`${ok?'PASS':'FAIL'}  ${name} → ${got} (exp ${exp})`); if (ok) pass++; };

// 1) prepare + dismissed → true
{
  const { mod, fire } = await fresh();
  await mod.prepareInterstitial();
  const p = mod.showInterstitialIfReady();
  await new Promise(r => setTimeout(r, 20));
  fire('interstitialAdDismissed');
  check('prepared → dismissed', await p, true);
}
// 2) not prepared → false (sofort, nicht hängen)
{
  const { mod } = await fresh();
  check('not prepared → skip', await mod.showInterstitialIfReady(), false);
}
// 3) prepared, show "hängt", failedToShow → false
{
  const { mod, fire } = await fresh();
  await mod.prepareInterstitial();
  const p = mod.showInterstitialIfReady();
  await new Promise(r => setTimeout(r, 20));
  fire('interstitialAdFailedToShow', { code: 3 });
  check('prepared → failedToShow', await p, false);
}
// 4) web/preview (kein Native) → false
{
  const { mod } = await fresh({ web: true });
  await mod.prepareInterstitial();
  check('web → skip', await mod.showInterstitialIfReady(), false);
}

console.log(`${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `node tests/native-interstitial.test.mjs`
Expected: FAIL (Modul existiert noch nicht / `ERR_MODULE_NOT_FOUND`).

- [ ] **Step 3: `js/native-interstitial.js` implementieren**

```js
'use strict';

/* Natives Interstitial (AdMob). Vorgeladen, beim Vorrücken gezeigt. Abschluss
   über die Events (Dismissed/FailedToShow) + Timeout-Netz, damit nie etwas hängt.
   Blockiert den Spieler nie: nicht bereit/kein Fill/kein Consent → still skip. */

import { getAdMob, ensureInit } from './native-ads.js';
import { ADMOB } from './constants.js';

let _ready     = false;
let _preparing = null;

export async function prepareInterstitial() {
  const AdMob = getAdMob();
  if (!AdMob || _ready) return;
  if (_preparing) return _preparing;
  _preparing = (async () => {
    try {
      const { canRequestAds } = await ensureInit(AdMob);
      if (!canRequestAds) return;
      await AdMob.prepareInterstitial({ adId: ADMOB.interstitialUnitId });
      _ready = true;
    } catch (err) {
      console.warn('native-interstitial: prepare fehlgeschlagen:', err);
      _ready = false;
    } finally {
      _preparing = null;
    }
  })();
  return _preparing;
}

export async function showInterstitialIfReady() {
  const AdMob = getAdMob();
  if (!AdMob || !_ready) { prepareInterstitial(); return false; }
  _ready = false; // verbrauchen
  try {
    return await new Promise((resolve) => {
      let settled = false;
      const handles = [];
      const finish = (v) => {
        if (settled) return;
        settled = true;
        for (const h of handles) {
          Promise.resolve(h).then((x) => { try { x.remove(); } catch { /* ignore */ } });
        }
        resolve(v);
      };
      const on = (evt, fn) => handles.push(AdMob.addListener(evt, fn));
      on('interstitialAdDismissed',    () => finish(true));
      on('interstitialAdFailedToShow', () => finish(false));
      const guard = setTimeout(() => finish(true), 60000);
      handles.push({ remove: () => clearTimeout(guard) });
      AdMob.showInterstitial().catch((err) => { console.warn('native-interstitial: show error:', err); finish(false); });
    });
  } finally {
    prepareInterstitial(); // nächstes vorladen
  }
}
```

- [ ] **Step 4: Test laufen lassen, Erfolg bestätigen**

Run: `node --check js/native-interstitial.js && node tests/native-interstitial.test.mjs`
Expected: `4/4`, Exit 0.

- [ ] **Step 5: Commit**

```bash
git add js/native-interstitial.js tests/native-interstitial.test.mjs
git commit -m "feat(ads): native interstitial module (preload + event-settled show)"
```

---

### Task 4: In `main.js` verdrahten (Variante B)

**Files:**
- Modify: `js/main.js` (Import, generateLevel-Reset, Win-Flow, nextLevelBtn, App-Start)

**Interfaces:**
- Consumes: `prepareInterstitial`, `showInterstitialIfReady` aus `native-interstitial.js`; bestehendes `shouldShowAd`, `markAdShown`.

- [ ] **Step 1: Import ergänzen** (bei den anderen Ad-Imports, nach Zeile 51)

```js
import { initNativeAds } from './native-ads.js';
import { prepareInterstitial, showInterstitialIfReady } from './native-interstitial.js';
```

- [ ] **Step 2: Win-Flow auf Variante B umstellen** — in `generateLevel`s Sieg-Logik den Ad-Block (aktuell `js/main.js:1206`) ersetzen.

Alt:

```js
  // ── Ad interstitial check ──
  if (shouldShowAd()) {
    markAdShown();
    document.getElementById('adOverlay').classList.add('show');
    // Store win data for after ad dismissal
    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('winStars').innerHTML =
    Array.from({ length: stars }, () => '<span class="win-star">⭐</span>').join('') +
    Array.from({ length: 3 - stars }, () => '<span class="win-star">☆</span>').join('');
    document.getElementById('winPar').textContent     = 'Par: ' + par;
    buildWinAchProgress();
    buildWinRoomHint('winRoomHint');
    return;
  }
```

Neu:

```js
  // ── Ad interstitial (Variante B) ──
  // Nicht hier zeigen: nur merken. Der normale Gewinn-Bildschirm läuft unten;
  // die Werbung kommt beim Tippen auf „Weiter →" (nextLevelBtn).
  G.adDueOnAdvance = shouldShowAd();
```

- [ ] **Step 3: Flag bei Levelstart zurücksetzen** — in `generateLevel(n)` nahe `G.isDailyChallenge = false;` (Zeile ~678) ergänzen:

```js
  G.isDailyChallenge = false;
  G.dailyModifier = null;
  G.adDueOnAdvance = false;
```

- [ ] **Step 4: `nextLevelBtn`-Handler erweitern** (Zeile ~2046). Alt:

```js
document.getElementById('nextLevelBtn').addEventListener('click', () => {
  playSound('click');
  hideOverlay();
  // Safety net: a daily-challenge win must never advance the level chain
  // (LEVEL.current is the daily level number, not a progression level).
  // The button is normally hidden for daily wins; route to the menu anyway.
  if (G.isDailyChallenge) {
    processPendingUnlocks(() => openLevelSelect());
    return;
  }
  G.isDailyChallenge = false;
  G.dailyModifier = null;
  processPendingUnlocks(() => { generateLevel(LEVEL.current + 1); invalidateRoomDecorCache(); });
});
```

Neu:

```js
document.getElementById('nextLevelBtn').addEventListener('click', async () => {
  playSound('click');
  hideOverlay();
  // Safety net: a daily-challenge win must never advance the level chain
  // (LEVEL.current is the daily level number, not a progression level).
  // The button is normally hidden for daily wins; route to the menu anyway.
  if (G.isDailyChallenge) {
    processPendingUnlocks(() => openLevelSelect());
    return;
  }
  G.isDailyChallenge = false;
  G.dailyModifier = null;
  // Variante B: fällige Interstitial-Werbung beim Vorrücken zeigen. Nie blockieren —
  // ist keine bereit, geht es sofort weiter. markAdShown() nur, wenn wirklich gezeigt.
  if (G.adDueOnAdvance) {
    G.adDueOnAdvance = false;
    const shown = await showInterstitialIfReady();
    if (shown) markAdShown();
  }
  processPendingUnlocks(() => { generateLevel(LEVEL.current + 1); invalidateRoomDecorCache(); });
});
```

- [ ] **Step 5: Interstitial beim App-Start vorladen** — bei der Warm-up-Stelle (Zeile ~3420). Alt:

```js
    initNativeAds().catch((err) => console.warn('AdMob warm-up failed:', err));
```

Neu:

```js
    initNativeAds()
      .then(() => prepareInterstitial())
      .catch((err) => console.warn('AdMob warm-up failed:', err));
```

- [ ] **Step 6: Syntax prüfen**

Run: `node --check js/main.js`
Expected: kein Output, Exit 0.

- [ ] **Step 7: Browser-Smoke (Preview-Pfad, keine Native-Ads)** — sicherstellen, dass „Weiter →" normal vorrückt und kein Platzhalter-Schirm erscheint.

Run:
```bash
lsof -ti tcp:8799 | xargs kill -9 2>/dev/null; \
nohup python3 -m http.server 8799 --bind 127.0.0.1 >/dev/null 2>&1 & sleep 1; \
echo "manuell: http://127.0.0.1:8799 — Level lösen, „Weiter" → nächstes Level lädt, kein WERBUNG-Schirm"
```
Expected: Im Preview-Build (`REWARDED_MODE='preview'`) rückt „Weiter →" direkt vor; `showInterstitialIfReady()` liefert `false` (kein Native) und blockiert nicht.

- [ ] **Step 8: Commit**

```bash
git add js/main.js
git commit -m "feat(ads): show interstitial on advance (Variante B), preload on launch"
```

---

### Task 5: Build-Sync + Bundle-Verifikation

**Files:**
- Modify: `sw.js` (Cache-Bump)

- [ ] **Step 1: SW-Cache bumpen**

In `sw.js` die `const CACHE = '...'`-Zeile auf einen neuen Wert setzen, z. B. `'kittysort-interstitial-5'`.

- [ ] **Step 2: Sync ins iOS-Bundle**

Run: `npm run cap:sync`
Expected: „Sync finished", Plugins erkannt.

- [ ] **Step 3: Bundle-Gegencheck**

Run:
```bash
grep -c showInterstitialIfReady ios/App/App/public/js/native-interstitial.js && \
grep -c adDueOnAdvance ios/App/App/public/js/main.js && \
grep interstitialUnitId ios/App/App/public/js/constants.js
```
Expected: je ≥1 Treffer (Fix im Bundle).

- [ ] **Step 4: Commit**

```bash
git add sw.js
git commit -m "chore(pwa): bump SW cache for interstitial ads"
```

---

## Hinweise zur Echt-Verifikation

Native Test- Interstitials lassen sich nur auf dem Gerät prüfen. Im nächsten
TestFlight-Build (Build-Nummer hochzählen, archivieren, hochladen — siehe
Memory `ios-archive-signing`): nach ein paar Levels muss beim „Weiter →" ein
Vollbild-Test-Interstitial erscheinen, danach lädt das nächste Level. Premium-
Test: kein Interstitial. Kein Fill/Flugmodus: „Weiter" rückt trotzdem vor.
