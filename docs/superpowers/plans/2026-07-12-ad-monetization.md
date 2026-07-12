# Ad-Monetarisierung Optimierung — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Werbeeinnahmen von Kittysort deutlich erhöhen, indem der durch die 4+-Einstufung erzwungene COPPA-Werbe-Deckel entfernt (Age-Rating → 9+), ein Banner als Dauer-Umsatzquelle ergänzt, die Fill-Rate messbar gemacht und die Interstitial-Frequenz feinjustiert wird.

**Architecture:** Quelle liegt in `js/` (ES-Module). Der native iOS-Build entsteht über `npm run cap:sync` → `tools/build-www.mjs` kopiert nach `www/` und patcht `REWARDED_MODE`/`BILLING_MODE` auf `'native'`, danach `cap sync ios`. AdMob wird ausschließlich über `window.Capacitor.Plugins.AdMob` angesprochen (kein statischer Import), Basis-Init (ATT→UMP→initialize) liegt zentral in `js/native-ads.js`. Ads sind nur im nativen Build aktiv; Web nutzt Preview-Stubs.

**Tech Stack:** Capacitor 8, `@capacitor-community/admob` 8.0.0 (SPM-nativ), Vanilla-JS-ES-Module, Node `node --test` für Logik-Tests.

## Global Constraints

- Ad-Zugriff NUR über `window.Capacitor.Plugins.AdMob`, niemals statischer Paket-Import (würde den Web-Bundle brechen). — verbatim aus `js/native-ads.js`
- Web-/Preview-Pfad darf sich NICHT ändern: `REWARDED_MODE`-Quelle bleibt `'preview'`; nur der native Build wird gepatcht (`tools/patch-constants.mjs`).
- Ad-Creatives bleiben familientauglich: `maxAdContentRating: 'General'` (G) bleibt gesetzt — auch nach dem Age-Rating-Wechsel.
- Kein Ad darf den Spieler blockieren: nicht bereit / kein Fill / kein Consent → still weiter (bestehendes Verhalten beibehalten).
- Änderungen an Spiel-Logik brauchen einen Node-Test (`node --test`), bevor sie als fertig gelten. Reine Config-/Native-Änderungen werden auf dem Gerät verifiziert (Xcode-Konsole + AdMob-Dashboard), da nicht unit-testbar.
- AdMob-App-ID/Unit-IDs stehen in `js/constants.js` (`ADMOB`); neue Unit-IDs kommen aus dem AdMob-Konto Coding Brothers.

---

> **REVISION 2026-07-12 — Pragmatischer Weg gewählt.** Nutzer bleibt bewusst bei
> **child-directed=true** (kein Rating-Wechsel, null Compliance-Risiko). Grund:
> 9+ ist kein sauberer COPPA-Exit (schließt unter-13 weiter ein), 13+ kostet
> Store-Auffindbarkeit. Monetarisierungs-Gewinn kommt daher aus dem **fehlenden
> Banner** + Consent/Cadence-Fixes, NICHT aus dem Ad-Flag.
> → **V1 (Rating 9+) und Task 1 (Flag-Umstellung) ENTFALLEN.** Aktive Tasks:
> 2 (Logging), 3 (Cadence), 4 (Banner = Haupt-Hebel), 5 (Info.plist/Tracking), 6 (Build).
> Die entfallenen Abschnitte bleiben unten als durchgestrichen stehen (Doku/Historie).

## Manuelle Voraussetzungen (macht Juergen — kein Code, aber Blocker)

Diese Schritte kann ein Agent NICHT ausführen; sie müssen vor bzw. parallel zur Code-Umsetzung erledigt werden.

- [ ] ~~**V1 — Age-Rating auf 9+ anheben.**~~ **ENTFÄLLT** (pragmatischer Weg): 9+ ist kein sauberer COPPA-Exit und bringt für die Ad-Auslieferung nichts (AdMob liest die Store-Einstufung nicht). Rating bleibt wie ist. Der Audit-Punkt „4+/Tracking" wird stattdessen in Task 5 gelöst, indem Tracking ganz entfällt (child-directed trackt ohnehin nicht).

- [ ] **V2 — Banner-Ad-Unit im AdMob-Konto anlegen.**
  AdMob → App „Kittysort (iOS)" (App-ID `ca-app-pub-6440829707267793~6903635482`) → *Anzeigenblöcke* → **Neuer Anzeigenblock → Banner** → Name z. B. „Kittysort iOS Banner". Die erzeugte Unit-ID (`ca-app-pub-6440829707267793/XXXXXXXXXX`) an Juergen/ins Repo geben — sie wird in Task 5 in `constants.js` eingetragen.
  **Warum:** Banner braucht eine eigene Unit-ID (getrennt von Interstitial/Rewarded).

- [ ] **V3 — (Optional, empfohlen) Google-SKAdNetwork-IDs bereithalten.**
  Aktuelle Liste: https://developers.google.com/admob/ios/3p-skadnetwork-ids — wird in Task 6 in `Info.plist` eingetragen (verbessert Attribution → eCPM).

---

## ~~Task 1: Ad-Targeting-Flags umstellen~~ — ENTFÄLLT (pragmatischer Weg)

> **Übersprungen.** child-directed=true bleibt (kein Rating-Wechsel). Dieser
> Abschnitt bleibt nur als Referenz erhalten, falls später doch auf 13+ +
> child-directed=false umgestellt wird. **Nicht umsetzen.** `js/native-ads.js`
> bleibt unverändert (`tagForChildDirectedTreatment: true`, `tagForUnderAgeOfConsent: true`).

**Files:**
- Modify: `js/native-ads.js:50-55` (der `AdMob.initialize({...})`-Block)

**Interfaces:**
- Consumes: nichts Neues.
- Produces: keine API-Änderung — nur verändertes Laufzeitverhalten von `ensureInit()` (mehr Fill, personalisierte Ads erlaubt).

**Kontext:** Aktuell (Zeilen 50–55):
```js
await AdMob.initialize({
  initializeForTesting:      !!ADMOB.testing,
  maxAdContentRating:        'General',
  tagForChildDirectedTreatment: true,
  tagForUnderAgeOfConsent:   true,
});
```
`tagForChildDirectedTreatment: true` = COPPA-Flag „an unter-13 gerichtet" → kleinster Werbe-Pool (nur families-self-certified Netzwerke), kein Targeting → niedrige Fill + Mini-eCPM. Das ist die Hauptursache für „fast nie Werbung".

**WICHTIG — nur EIN Flag ändern.** Nur `tagForChildDirectedTreatment` auf `false`; `tagForUnderAgeOfConsent` bleibt `true`. Grund (geprüft, siehe Abschnitt „Ablehnungsrisiko"): Kittysort spricht als Katzen-/Cartoon-Puzzle erkennbar auch unter-13-Jährige an. Apple verbietet für „primarily for kids under 13"-Apps **behavioral advertising**, Google-Families-Policy verbietet die Übertragung der Werbe-ID. `tagForUnderAgeOfConsent: true` hält die Ads **nicht-personalisiert** → compliant. Der Fill-Gewinn kommt fast vollständig schon aus dem Wegfall von child-directed (größerer Netzwerk-Pool); personalisierte Ads (`tagForUnderAgeOfConsent:false`) wären der eCPM-Bonus, aber ein Ablehnungs-/Account-Risiko und daher NICHT Teil dieses Plans.

- [ ] **Step 1: Nur das child-directed-Flag umstellen (nur nach erledigtem V1 = Rating 9+!)**

Ersetze den `initialize`-Block in `js/native-ads.js` durch:
```js
  // 9+ App: kein COPPA-child-directed mehr → größerer Netzwerk-Pool, aber weiter
  // NICHT-personalisiert (kind-anziehende App: keine behavioral ads / keine
  // Werbe-ID-Übertragung — Apple- + Google-Families-konform).
  //   maxAdContentRating 'General' (G)     → Creatives bleiben familientauglich.
  //   tagForChildDirectedTreatment:false   → raus aus dem kleinsten COPPA-Pool.
  //   tagForUnderAgeOfConsent:true (BLEIBT) → Ads bleiben nicht-personalisiert.
  await AdMob.initialize({
    initializeForTesting:      !!ADMOB.testing,
    maxAdContentRating:        'General',
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent:   true,
  });
```

- [ ] **Step 2: Bestehende Native-Tests laufen lassen (kein Regress)**

Run: `node --test`
Expected: alle grün (die Init-Flags werden von `tests/native-interstitial.test.mjs`/`native-rewarded.test.mjs` nicht geprüft — Mock ignoriert die Options; Tests bleiben PASS).

- [ ] **Step 3: Commit**

```bash
git add js/native-ads.js
git commit -m "ads: 9+ targeting — child-directed=false, personalisierte G-Ads erlaubt"
```

- [ ] **Step 4: Geräte-Verifikation (nach cap:sync + Build, siehe Task 7)**

Auf echtem iPhone (nicht Simulator — AdMob liefert dort schlecht): 3 Level lösen → „Weiter" tippen. Erwartung: Interstitial erscheint häufiger als vorher. In AdMob → *Berichte* nach ~24 h: Fill-Rate + eCPM gestiegen. **Zwischenschritt** — wird zusammen mit Task 2 gemessen.

---

## Task 2: Ad-Fill-Diagnose sichtbar machen

**Files:**
- Modify: `js/native-interstitial.js` (prepare-Erfolg/-Fehler loggen)
- Modify: `js/native-rewarded.js` (prepare-Fehler loggen)

**Interfaces:**
- Consumes: nichts Neues.
- Produces: einheitliches Log-Präfix `[ad-metrics]` in der Xcode-/Console.app-Ausgabe — kein API-Change.

**Kontext:** Heute wird ein fehlender Fill *still* verschluckt (`catch` mit generischem `console.warn`). Dadurch ist nicht unterscheidbar, ob „keine Werbung" an Cadence, Consent oder Fill liegt. Ein klares Präfix macht die echte Fill-Rate am Gerät ablesbar.

- [ ] **Step 1: Interstitial-Prepare instrumentieren**

In `js/native-interstitial.js`, in `prepareInterstitial()`, den `try/catch` erweitern:
```js
      await AdMob.prepareInterstitial({ adId: ADMOB.interstitialUnitId });
      _ready = true;
      console.info('[ad-metrics] interstitial: geladen (fill ok)');
    } catch (err) {
      console.warn('[ad-metrics] interstitial: KEIN fill/prepare-Fehler:', err && err.message || err);
      _ready = false;
```
(nur die zwei `console.*`-Zeilen ergänzen; Logik unverändert.)

- [ ] **Step 2: Rewarded-Prepare instrumentieren**

In `js/native-rewarded.js`, direkt nach `await AdMob.prepareRewardVideoAd({ adId: ADMOB.rewardedUnitId });`:
```js
    console.info('[ad-metrics] rewarded: geladen (fill ok)');
```
und im äußeren `catch` (Zeile ~96) die Meldung präfixen:
```js
    console.warn('[ad-metrics] rewarded: KEIN fill/Fehler/Abbruch:', err && err.message || err);
```

- [ ] **Step 3: Bestehende Tests laufen lassen**

Run: `node --test`
Expected: alle grün (nur Log-Zeilen ergänzt).

- [ ] **Step 4: Commit**

```bash
git add js/native-interstitial.js js/native-rewarded.js
git commit -m "ads: [ad-metrics]-Logging für Interstitial/Rewarded-Fill"
```

- [ ] **Step 5: Am Gerät ablesen**

Xcode → Run → *Console.app* nach `ad-metrics` filtern. Notieren: wie oft „geladen" vs. „KEIN fill" über eine 10-Minuten-Session. Das ist die Baseline vor/nach Task 1.

---

## Task 3: Interstitial-Cadence testbar machen + entschärfen

**Files:**
- Modify: `js/economy.js:91-125` (Cadence-Konstanten + neue reine Funktion `adDecision`)
- Test: `test/ad-cadence.test.mjs` (neu)

**Interfaces:**
- Consumes: `AD_INTERVAL_LEVELS`, `AD_COOLDOWN_MS` (modul-intern).
- Produces:
  - `adDecision({ levelsSinceAd, lastAdTime, now, premium, intervalLevels?, cooldownMs? }) → boolean` — reine, seiteneffektfreie Entscheidung.
  - `shouldShowAd()` bleibt exportiert, ruft intern `adDecision(...)`.

**Kontext:** `shouldShowAd()` liest heute Modul-State (`_levelsSinceAd`, `_lastAdTime`) + `Date.now()` + `isPremium()` — nicht unit-testbar. Wir ziehen die Entscheidung in eine reine Funktion und senken den Cooldown 3 → 2 min (mehr Impressions bei gleicher Nicht-Nerv-Garantie: es bleibt max. 1 Interstitial pro 2 min, frühestens nach 3 Leveln).

- [ ] **Step 1: Failing test schreiben**

Create `test/ad-cadence.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adDecision } from '../js/economy.js';

const MIN = 60 * 1000;

test('premium sieht nie ein Interstitial', () => {
  assert.equal(adDecision({ levelsSinceAd: 99, lastAdTime: 0, now: 10 * MIN, premium: true }), false);
});

test('unter Level-Intervall → kein Ad', () => {
  assert.equal(adDecision({ levelsSinceAd: 2, lastAdTime: 0, now: 10 * MIN, premium: false, intervalLevels: 3, cooldownMs: 2 * MIN }), false);
});

test('Intervall erreicht, aber Cooldown noch aktiv → kein Ad', () => {
  assert.equal(adDecision({ levelsSinceAd: 3, lastAdTime: 9 * MIN, now: 10 * MIN, premium: false, intervalLevels: 3, cooldownMs: 2 * MIN }), false);
});

test('Intervall erreicht UND Cooldown abgelaufen → Ad', () => {
  assert.equal(adDecision({ levelsSinceAd: 3, lastAdTime: 7 * MIN, now: 10 * MIN, premium: false, intervalLevels: 3, cooldownMs: 2 * MIN }), true);
});
```

- [ ] **Step 2: Test laufen lassen → muss fehlschlagen**

Run: `node --test test/ad-cadence.test.mjs`
Expected: FAIL mit „adDecision is not a function" / Import-Fehler.

- [ ] **Step 3: `adDecision` implementieren + Cooldown senken**

In `js/economy.js`:
```js
// ── Ad timing ───────────────────────────────────────────────────────────────
const AD_INTERVAL_LEVELS = 3;
const AD_COOLDOWN_MS     = 2 * 60 * 1000; // 2 minutes (war 3)
const _adCadenceKey      = 'catsort-ad-cadence';
```
und neue reine Funktion (direkt vor `shouldShowAd`):
```js
// Reine Cadence-Entscheidung (unit-testbar; kein Modul-State, kein Date.now()).
export function adDecision({ levelsSinceAd, lastAdTime, now, premium,
                             intervalLevels = AD_INTERVAL_LEVELS,
                             cooldownMs = AD_COOLDOWN_MS }) {
  if (premium) return false;
  if (levelsSinceAd < intervalLevels) return false;
  if (now - lastAdTime < cooldownMs) return false;
  return true;
}
```
und `shouldShowAd()` darauf umstellen:
```js
export function shouldShowAd() {
  return adDecision({
    levelsSinceAd: _levelsSinceAd,
    lastAdTime:    _lastAdTime,
    now:           Date.now(),
    premium:       isPremium(),
  });
}
```

- [ ] **Step 4: Test laufen lassen → muss bestehen**

Run: `node --test test/ad-cadence.test.mjs`
Expected: PASS (4/4).

- [ ] **Step 5: Volle Suite (kein Regress)**

Run: `node --test`
Expected: alle grün.

- [ ] **Step 6: Commit**

```bash
git add js/economy.js test/ad-cadence.test.mjs
git commit -m "ads: adDecision() reine Cadence-Funktion + Cooldown 3->2min + Tests"
```

---

## Task 4: Banner-Ad (Dauer-Umsatzquelle) im Menü/Level-Select

**Files:**
- Create: `js/native-banner.js`
- Modify: `js/constants.js:201-206` (`ADMOB.bannerUnitId` ergänzen)
- Modify: `js/main.js` (Banner beim Verlassen des aktiven Spiels zeigen, beim Start eines Levels ausblenden)
- Modify: `js/native-rewarded.js:33` (Re-Export von `initNativeAds` bleibt; kein Konflikt)

**Interfaces:**
- Consumes: `getAdMob`, `ensureInit` aus `js/native-ads.js`; `ADMOB.bannerUnitId` aus `constants.js`.
- Produces:
  - `showBanner() → Promise<void>` — zeigt/aktualisiert den unteren Adaptive-Banner (idempotent; Consent-/Premium-Guard inklusive).
  - `hideBanner() → Promise<void>` — blendet den Banner aus (nicht entfernen; schnelles Wiederzeigen).

**Kontext:** Banner ist die verlässlichste Dauer-Einnahme, fehlt aktuell komplett. Er darf das aktive Spielbrett NICHT überlappen → nur auf Menü- und Level-Select-Screens zeigen, während des Spielens ausblenden. Plugin-API (`@capacitor-community/admob` v8): `AdMob.showBanner({ adId, adSize, position, margin, npa })`, `AdMob.hideBanner()`, Position-Enum-String `'BOTTOM_CENTER'`, Size-Enum-String `'ADAPTIVE_BANNER'`.

- [ ] **Step 1: Banner-Unit-ID eintragen (braucht V2)**

In `js/constants.js`, `ADMOB`-Objekt erweitern:
```js
export const ADMOB = {
  testing: false,
  appId:   'ca-app-pub-6440829707267793~6903635482',
  rewardedUnitId: 'ca-app-pub-6440829707267793/1623388647',
  interstitialUnitId: 'ca-app-pub-6440829707267793/4056156468',
  bannerUnitId: 'ca-app-pub-6440829707267793/XXXXXXXXXX', // aus V2 einsetzen
};
```

- [ ] **Step 2: Banner-Modul schreiben**

Create `js/native-banner.js`:
```js
'use strict';

/* Adaptiver Bottom-Banner (AdMob). Nur nativ + nur mit Consent + nicht für
   Premium. Zeigt/aktualisiert idempotent; hideBanner() blendet aus, ohne zu
   entfernen (schnelles Wiederzeigen). Wird NUR auf Menü/Level-Select gezeigt,
   nie über dem aktiven Spielbrett. */

import { getAdMob, ensureInit } from './native-ads.js';
import { ADMOB } from './constants.js';

let _shown = false;

export async function showBanner() {
  const AdMob = getAdMob();
  if (!AdMob || !ADMOB.bannerUnitId) return;
  try {
    const { canRequestAds } = await ensureInit(AdMob);
    if (!canRequestAds) return;
    if (_shown) { await AdMob.resumeBanner().catch(() => {}); return; }
    await AdMob.showBanner({
      adId:     ADMOB.bannerUnitId,
      adSize:   'ADAPTIVE_BANNER',
      position: 'BOTTOM_CENTER',
      margin:   0,
    });
    _shown = true;
  } catch (err) {
    console.warn('[ad-metrics] banner: KEIN fill/Fehler:', err && err.message || err);
  }
}

export async function hideBanner() {
  const AdMob = getAdMob();
  if (!AdMob || !_shown) return;
  try { await AdMob.hideBanner(); } catch { /* ignore */ }
}
```

- [ ] **Step 3: In main.js verdrahten — zeigen im Menü, verstecken im Spiel**

In `js/main.js` importieren (bei den übrigen Ad-Imports, Nähe Zeile 53–55):
```js
import { showBanner, hideBanner } from './native-banner.js';
```
Banner ausblenden, wenn ein Level startet — in `generateLevel(...)` (Funktionsanfang) bzw. direkt beim Start eines Levels:
```js
  if (!isPremium()) hideBanner();
```
Banner zeigen, wenn der Level-Select/das Menü geöffnet wird — in `openLevelSelect()` (Funktionsanfang):
```js
  if (!isPremium()) showBanner();
```
(Exakte Funktionsnamen prüfen: `openLevelSelect` existiert — vgl. `main.js:2488,2505`; `generateLevel` existiert — vgl. `main.js:2500`. Falls das Menü separat von Level-Select geöffnet wird, `showBanner()` auch dort ergänzen, `hideBanner()` immer beim tatsächlichen Level-Start.)

- [ ] **Step 4: Node-Test für die Guard-Logik**

Create `test/native-banner.test.mjs` (Stil analog `tests/native-interstitial.test.mjs`):
```js
import { pathToFileURL } from 'node:url';
const MOD = pathToFileURL('js/native-banner.js').href;

async function fresh(opts = {}) {
  const calls = [];
  const AdMob = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', canRequestAds: opts.canRequestAds !== false, isConsentFormAvailable: false }),
    requestTrackingAuthorization: async () => ({ status: 'authorized' }),
    initialize: async () => ({}),
    showBanner: async (o) => { calls.push(['show', o]); },
    hideBanner: async () => { calls.push(['hide']); },
    resumeBanner: async () => { calls.push(['resume']); },
  };
  global.window = { Capacitor: { isNativePlatform: () => !opts.web, Plugins: { AdMob } } };
  const mod = await import(MOD + '?n=' + Math.random().toString(36).slice(2));
  return { mod, calls };
}

let pass = 0, total = 0;
const check = (n, got, exp) => { total++; const ok = got === exp; console.log(`${ok?'PASS':'FAIL'}  ${n} → ${got} (exp ${exp})`); if (ok) pass++; };

// 1) Web (kein native) → kein showBanner
{ const { mod, calls } = await fresh({ web: true }); await mod.showBanner(); check('web → no show', calls.length, 0); }
// 2) native + consent → showBanner einmal
{ const { mod, calls } = await fresh(); await mod.showBanner(); check('native → 1 show', calls.filter(c=>c[0]==='show').length, 1); }
// 3) zweiter showBanner → resume statt erneutem show
{ const { mod, calls } = await fresh(); await mod.showBanner(); await mod.showBanner(); check('2. show → resume', calls.filter(c=>c[0]==='resume').length, 1); }
// 4) kein Consent → kein show
{ const { mod, calls } = await fresh({ canRequestAds: false }); await mod.showBanner(); check('no-consent → no show', calls.filter(c=>c[0]==='show').length, 0); }

console.log(`${pass}/${total}`);
process.exit(pass === total ? 0 : 1);
```

- [ ] **Step 5: Test ausführen**

Run: `node test/native-banner.test.mjs`
Expected: `4/4`, Exit 0.

- [ ] **Step 6: Volle Suite**

Run: `node --test`
Expected: alle grün.

- [ ] **Step 7: Commit**

```bash
git add js/native-banner.js js/constants.js js/main.js test/native-banner.test.mjs
git commit -m "ads: adaptiver Bottom-Banner im Menue/Level-Select (nicht im Spiel)"
```

- [ ] **Step 8: Geräte-Check**

Am iPhone: Menü/Level-Select → Banner unten sichtbar, überlappt keine Buttons. Level starten → Banner weg. Zurück ins Menü → Banner wieder da. (Bei Überlappung mit unteren UI-Elementen in Step 3 einen CSS-Bottom-Abstand für den Level-Select ergänzen — Banner-Höhe adaptiv ~50–90 px.)

---

## Task 5: Tracking entfernen (löst 4+/Tracking-Widerspruch) + SKAdNetwork vervollständigen

**Files:**
- Modify: `js/native-ads.js:25-31` (ATT-Aufruf entfernen)
- Modify: `ios/App/App/Info.plist` (`NSUserTrackingUsageDescription` entfernen, `SKAdNetworkItems` vervollständigen)
- Manuell (ASC): App-Datenschutz-Label „Tracking" → **Nein**

**Interfaces:** keine Code-Schnittstelle; entfernt nur den ATT-Prompt.

**Kontext:** Bei `child-directed=true` (pragmatischer Weg) findet **kein** IDFA-Tracking statt — das Privacy-Manifest deklariert bereits `NSPrivacyTracking=false` (Audit §6). Der ATT-Prompt ist damit **widersprüchlich**: Er fragt nach Tracking-Erlaubnis, obwohl gar nicht getrackt wird — genau der 4+/Tracking-Punkt (Audit `:29`, „Hoch"). Lösung ohne Rating-Wechsel: ATT-Prompt entfernen + ASC-Label auf „kein Tracking" stellen. SKAdNetwork bleibt (ist ATT-frei erlaubt und hilft der Ad-Attribution → eCPM).

- [ ] **Step 1: ATT-Aufruf aus native-ads.js entfernen**

In `js/native-ads.js`, den `requestTrackingAuthorization`-Block (Zeilen ~25–31) löschen. `runInit` beginnt dann direkt mit dem UMP-Consent-Schritt. Kommentar-Kopf (Zeile 22–24) entsprechend kürzen. UMP/Consent bleibt unangetastet.

- [ ] **Step 2: Regressions-Tests**

Run: `node --test`
Expected: alle grün (die native-Tests mocken `requestTrackingAuthorization`, aber rufen es nicht zwingend — Entfernen bricht sie nicht; falls doch ein Test darauf besteht, den Mock-Aufruf im Test entfernen).

- [ ] **Step 3: NSUserTrackingUsageDescription aus Info.plist entfernen**

In `ios/App/App/Info.plist` den `NSUserTrackingUsageDescription`-Key **samt** `<string>`-Wert löschen (ohne ATT-Prompt ist der Key unnötig und ein Reviewer-Flag).

- [ ] **Step 4: SKAdNetworkItems mit aktueller Google-Liste füllen**

Die vollständige ID-Liste von https://developers.google.com/admob/ios/3p-skadnetwork-ids (V3) in `SKAdNetworkItems` eintragen (jede als `<dict><key>SKAdNetworkIdentifier</key><string>xxxx.skadnetwork</string></dict>`). Bestehende 6 IDs behalten, fehlende ergänzen (Duplikate vermeiden).

- [ ] **Step 5: Plist-Syntax prüfen**

Run: `plutil -lint ios/App/App/Info.plist`
Expected: `ios/App/App/Info.plist: OK`

- [ ] **Step 6: ASC-Datenschutz-Label anpassen (manuell, Juergen)**

ASC → App-Datenschutz → „Tracking" von **Ja** auf **Nein** (bzw. IDFA/Werbedaten nicht mehr als „zum Tracking verwendet" markieren). Muss zum entfernten ATT-Prompt + `NSPrivacyTracking=false` passen. Mit Build 15 einreichen.

- [ ] **Step 7: Commit**

```bash
git add js/native-ads.js ios/App/App/Info.plist
git commit -m "ads: kein IDFA-Tracking mehr (ATT raus) + SKAdNetwork vervollstaendigt"
```

---

## Task 6: Build 15 bauen, syncen, einreichen

**Files:**
- Modify: iOS-Projekt `CURRENT_PROJECT_VERSION` (via `tools/stamp-build.mjs` bzw. Xcode)
- Generated: `www/`, `ios/App/App/public/` (durch `cap:sync`)

**Interfaces:** keine.

**Kontext:** Alle Code-Änderungen liegen in `js/`; erst `cap:sync` bringt sie in den nativen Build. Aktuell Build 14 (`CURRENT_PROJECT_VERSION 14`, Commit `af1f089`). Siehe Memory `ios-build-run.md` / `ios-archive-signing.md` für Toolchain-/Signing-Eigenheiten.

- [ ] **Step 1: Native Build bauen + syncen**

Run: `npm run cap:sync`
Expected: „build-www: … auf 'native' gesetzt." + `cap sync ios` ohne Fehler + Plugin-Registrierung ok.

- [ ] **Step 2: Verifizieren, dass die Flags im nativen Bundle stimmen**

Run: `grep -nE "tagForChildDirectedTreatment|bannerUnitId|AD_COOLDOWN_MS" ios/App/App/public/js/native-ads.js ios/App/App/public/js/constants.js ios/App/App/public/js/economy.js`
Expected: `tagForChildDirectedTreatment: false`, gültige `bannerUnitId`, `AD_COOLDOWN_MS = 2 * 60 * 1000`.

- [ ] **Step 3: Build-Nummer 14 → 15**

`node tools/stamp-build.mjs` (falls dieses Script die Nummer setzt) ODER in Xcode → Target „App" → *General* → Build = 15. (Script-Verhalten vorab mit `cat tools/stamp-build.mjs` prüfen.)

- [ ] **Step 4: Auf echtem iPhone smoke-testen**

Xcode → Run auf Gerät. Prüfen: (a) Menü zeigt Banner unten, (b) Level-Start blendet Banner aus, (c) nach 3 Leveln + „Weiter" kommt ein Interstitial, (d) Rewarded (Züge+/Leben) spielt, (e) `[ad-metrics]`-Logs zeigen „geladen". Kein Absturz offline/ohne Fill.

- [ ] **Step 5: Archivieren + hochladen**

Nach Memory `ios-archive-signing.md` (Team Coding Brothers UG, Keychain-Fix). Archive → Distribute → App Store Connect. **Wichtig:** In ASC das **Age-Rating 9+** (V1) mit dieser Version einreichen; Reviewer-Notiz beibehalten.

- [ ] **Step 6: Commit + Tag**

```bash
git add -A
git commit -m "chore(ios): Build 15 — Ad-Monetarisierung (9+ targeting, Banner, Cadence)"
```

---

## Erwarteter Effekt & Priorisierung

| Task | Hebel | Aufwand | Erwarteter Umsatz-Effekt |
|---|---|---|---|
| **Task 4 (Banner)** | neue Dauer-Fläche (fehlt komplett) | mittel | **Hoch** — jetzt der Haupt-Hebel: konstante Impressions bei jedem Menü-Aufruf, additiv unabhängig vom Ad-Flag |
| Task 3 (Cadence) | 3→2 min Cooldown | niedrig | **Niedrig-Mittel** — mehr Interstitial-Impressions ohne Nerv-Risiko |
| Task 2 (Logging) | Messbarkeit | niedrig | 0 direkt, aber deckt auf, ob Consent-Ablehnung statt Fill die Bremse ist |
| Task 5 (Tracking raus/SKAdNetwork) | Compliance + Attribution | niedrig | **Niedrig** direkt; entschärft aber den offenen 4+/Tracking-Ablehnungspunkt |

**Reihenfolge-Empfehlung:** Task 2 (messen) → Task 4 (Banner = größter Gewinn) → Task 3 → Task 5 → Task 6. Kein Rating-/Flag-Risiko auf diesem Weg. Nach ein paar Tagen Live-Daten (Task 2) neu bewerten, ob der child-directed-Deckel den Umstieg auf 13+ doch rechtfertigt.

## Nicht im Scope (bewusst ausgelassen)

- **App-Open-Ad beim Kaltstart:** `@capacitor-community/admob` 8.0.0 hat **kein** App-Open-Format (nur banner/interstitial/reward/reward-interstitial). Bräuchte custom-nativen Code → separate Entscheidung.
- **Interstitial bei Level-Fail:** möglich, aber UX-riskant (Frust nach Niederlage). Erst nach Messung aus Task 2 entscheiden.
- **AdMob-Mediation (mehrere Networks):** größerer Setup-Aufwand; sinnvoll erst, wenn Task 1 den Grund-Fill belegt hat.
- **Rewarded-Interstitial-Format:** vom Plugin unterstützt, aber neue Surface-Entscheidung — nicht Teil dieser Runde.

## Ablehnungsrisiko (pragmatischer Weg, geprüft 2026-07-12)

Auf diesem Weg gibt es **kein Rating- und kein Ad-Flag-Risiko** — child-directed bleibt `true`, Ads bleiben G-gerated + nicht-personalisiert. Der Weg ist per Konstruktion konservativer als der aktuelle Live-Stand.

| Änderung | Apple-Reject-Risiko | Begründung |
|---|---|---|
| Banner / Interstitial-Cadence | **kein** | Standard-Ad-Formate, child-directed-konform. |
| Tracking/ATT entfernen + SKAdNetwork | **kein — reduziert Risiko** | Beseitigt den offenen 4+/Tracking-Widerspruch (Audit `:29`), macht ASC-Label + Privacy-Manifest konsistent. |
| ~~Rating 9+ / child-directed=false / personalisierte Ads~~ | **bewusst NICHT umgesetzt** | Nutzer bleibt kind-sicher bei 4+/child-directed. eCPM-Deckel wird akzeptiert; Banner + Fixes liefern den Zuwachs. |

**Später abwägbar:** Zeigt Task 2, dass der child-directed-Deckel wirklich stark bremst, ist der saubere (aber audience-teurere) Umstieg **13+ + child-directed=false** (nicht 9+) jederzeit als separate Runde möglich.

## Risiken & Rollback

- **Banner überlappt UI:** Falls Adaptive-Banner untere Buttons verdeckt → CSS-Safe-Area-Abstand im Level-Select (Task 4 Step 8). Rollback: `showBanner()`-Aufrufe entfernen, Rest bleibt.
- **ATT-Entfernung (Task 5):** Sicherstellen, dass der AdMob-SDK ohne ATT nicht doch IDFA nutzt — bei `child-directed=true` + `NSPrivacyTracking=false` ist das gegeben. Rollback: ATT-Block + Info.plist-Key wieder einsetzen (ein Commit).
- **Consent/DSGVO:** unverändert — UMP-Consent bleibt; Ads bleiben nicht-personalisiert (child-directed). Kein zusätzliches Tracking gegenüber heute.

## Self-Review

- **Spec-Abdeckung:** Ursache 1 (child-directed) → V1+Task 1 ✓; Ursache 2 (Consent) → unverändert respektiert, Logging in Task 2 macht es sichtbar ✓; Ursache 3 (Cadence/keine Banner) → Task 3 + Task 4 ✓; Audit-Punkte 4+/Tracking + SKAdNetwork + ATT-Text → V1 + Task 5 ✓.
- **Platzhalter:** `bannerUnitId`/SKAdNetwork-IDs sind bewusste externe Werte (V2/V3), sonst kein TODO im Code.
- **Typ-Konsistenz:** `adDecision(...)` gleiche Signatur in economy.js-Definition (Task 3 Step 3) und Test (Step 1) ✓; `showBanner`/`hideBanner` gleiche Namen in Modul (Task 4 Step 2), main.js-Import (Step 3) und Test (Step 4) ✓.
