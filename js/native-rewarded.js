'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   NATIVE REWARDED VIDEO (AdMob) — Bridge für den Capacitor-iOS-Build
   ───────────────────────────────────────────────────────────────────────
   Ersetzt AdSense (im Web) durch AdMob (in der App). Nur nativ aktiv; im Web
   wird das Modul importiert, aber nie aufgerufen (REWARDED_MODE != 'native').

   Plugin: @capacitor-community/admob (SPM-nativ, Cap 8). Zugriff über
   window.Capacitor.Plugins.AdMob — KEIN statischer Paket-Import, damit der
   Web-Bundle (www/) unberührt bleibt.

   Reihenfolge (Google-vorgegeben, DSGVO):
     1. requestConsentInfo()           — UMP-Consent-Status holen
     2. showConsentForm()              — falls REQUIRED & Formular verfügbar
     3. requestTrackingAuthorization() — iOS ATT-Dialog
     4. initialize()                   — erst danach SDK starten
     5. prepare/showRewardVideoAd()    — Ads laden/zeigen

   IDs + Test-Flag stehen in constants.js (ADMOB). Test-Units liefern immer
   Fill und zählen NICHT als echte Impressions.

   ── TODO am Mac / vor Release ───────────────────────────────────────────────
   1. npm i @capacitor-community/admob   (+ npm run cap:sync)
   2. AdMob-Konto: App + Rewarded-Ad-Unit → echte IDs in constants.js (ADMOB)
      und Info.plist (GADApplicationIdentifier) eintragen, ADMOB.testing=false.
   3. Info.plist: NSUserTrackingUsageDescription, SKAdNetworkItems.
      Privacy-Manifest PrivacyInfo.xcprivacy ergänzen.
   ══════════════════════════════════════════════════════════════════════════ */

import { ADMOB } from './constants.js';

let _initPromise = null; // dedupe: Consent/ATT/initialize nur einmal

function getAdMob() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins.AdMob) || null;
}

// Consent (UMP) → ATT → SDK-Init. Gibt {canRequestAds} zurück.
async function runInit(AdMob) {
  // 1./2. UMP-Consent. Fehler hier dürfen das Spiel nicht blockieren.
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
    console.warn('native-rewarded: Consent-Schritt übersprungen:', err);
  }

  // 3. iOS App Tracking Transparency. Optional — kein Blocker bei Ablehnung.
  try {
    if (typeof AdMob.requestTrackingAuthorization === 'function') {
      await AdMob.requestTrackingAuthorization();
    }
  } catch (err) {
    console.warn('native-rewarded: ATT-Dialog übersprungen:', err);
  }

  // 4. SDK starten.
  await AdMob.initialize({ initializeForTesting: !!ADMOB.testing });

  return { canRequestAds };
}

function ensureInit(AdMob) {
  if (!_initPromise) {
    _initPromise = runInit(AdMob).catch((err) => {
      _initPromise = null; // bei hartem Fehler nächsten Versuch erlauben
      throw err;
    });
  }
  return _initPromise;
}

/**
 * Einmaliger Warm-up beim App-Start: Consent/ATT/SDK-Init vorbereiten, damit
 * das erste Rewarded-Video nicht erst den Consent-Flow durchläuft. Best-effort.
 */
export async function initNativeAds() {
  const AdMob = getAdMob();
  if (!AdMob) return;
  try {
    await ensureInit(AdMob);
  } catch (err) {
    console.warn('native-rewarded: Init beim Launch fehlgeschlagen:', err);
  }
}

/**
 * Spielt ein natives Rewarded-Video. Liefert { completed: boolean }.
 * completed=true nur, wenn der Nutzer die Belohnung tatsächlich verdient hat.
 */
export async function playNativeRewarded(/* surface */) {
  const AdMob = getAdMob();
  if (!AdMob) {
    console.warn('native-rewarded: AdMob-Plugin nicht verfügbar.');
    return { completed: false };
  }

  try {
    const { canRequestAds } = await ensureInit(AdMob);
    if (!canRequestAds) {
      console.warn('native-rewarded: Ads ohne Consent nicht erlaubt.');
      return { completed: false, reason: 'no-consent' };
    }

    await AdMob.prepareRewardVideoAd({ adId: ADMOB.rewardedUnitId });

    // WICHTIG: showRewardVideoAd() ruft call.resolve() nur im
    // userDidEarnRewardHandler auf — wird die Ad ohne Belohnung geschlossen,
    // wird das Promise WEDER resolved NOCH rejected. Allein darauf zu awaiten
    // lässt den Aufrufer ewig hängen (Bug: Leben-Overlay blieb nach dem Video
    // hängen, nur der Fischgräten-Button reagierte noch).
    //
    // Robust: Belohnung über das 'Reward'-Event erfassen und auf 'Dismissed'
    // (bzw. 'FailedToShow') auflösen. completed = ob die Belohnung kam.
    return await new Promise((resolve) => {
      let earned  = false;
      let settled = false;
      const handles = [];

      const finish = (completed) => {
        if (settled) return;
        settled = true;
        for (const h of handles) {
          Promise.resolve(h).then((x) => { try { x.remove(); } catch { /* ignore */ } });
        }
        resolve({ completed });
      };
      const on = (evt, fn) => handles.push(AdMob.addListener(evt, fn));

      on('onRewardedVideoAdReward',       () => { earned = true; });
      on('onRewardedVideoAdDismissed',    () => finish(earned));
      on('onRewardedVideoAdFailedToShow', () => finish(false));

      // Sicherheitsnetz: falls wider Erwarten kein Event kommt, nicht ewig hängen.
      const guard = setTimeout(() => finish(earned), 90000);
      handles.push({ remove: () => clearTimeout(guard) });

      // Promise resolved nur bei verdienter Belohnung; Reject = harter Fehler.
      AdMob.showRewardVideoAd()
        .then(() => { earned = true; })
        .catch((err) => { console.warn('native-rewarded: show error:', err); finish(false); });
    });
  } catch (err) {
    console.warn('native-rewarded: Ad fehlgeschlagen/abgebrochen:', err);
    return { completed: false };
  }
}
