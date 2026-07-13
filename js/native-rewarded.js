'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   NATIVE REWARDED VIDEO (AdMob) — Bridge für den Capacitor-iOS-Build
   ───────────────────────────────────────────────────────────────────────
   Ersetzt AdSense (im Web) durch AdMob (in der App). Nur nativ aktiv; im Web
   wird das Modul importiert, aber nie aufgerufen (REWARDED_MODE != 'native').

   Plugin: @capacitor-community/admob (SPM-nativ, Cap 8). Zugriff über
   window.Capacitor.Plugins.AdMob — KEIN statischer Paket-Import, damit der
   Web-Bundle (www/) unberührt bleibt.

   Reihenfolge (kein ATT — child-directed, nicht-personalisierte Ads; nur DSGVO/UMP):
     1. requestConsentInfo()           — UMP-Consent-Status holen
     2. showConsentForm()              — falls REQUIRED & Formular verfügbar
     3. initialize()                   — erst danach SDK starten
     4. prepare/showRewardVideoAd()    — Ads laden/zeigen
   Kein requestTrackingAuthorization()/ATT-Dialog, kein NSUserTrackingUsageDescription
   in der Info.plist (NSPrivacyTracking=false). Siehe native-ads.js.

   IDs + Test-Flag stehen in constants.js (ADMOB). Test-Units liefern immer
   Fill und zählen NICHT als echte Impressions.
   ══════════════════════════════════════════════════════════════════════════ */

import { ADMOB } from './constants.js';
// Consent/ATT/SDK-Init liegt geteilt in native-ads.js (einmalig dedupliziert).
import { getAdMob, ensureInit, initNativeAds } from './native-ads.js';

export { initNativeAds };

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
    console.info('[ad-metrics] rewarded: geladen (fill ok)');

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

      // 'earned' kommt AUSSCHLIESSLICH aus dem 'Reward'-Event (oben). Je nach
      // Plugin-/SDK-Version resolved showRewardVideoAd() bereits beim Anzeigen
      // (nicht erst bei verdienter Belohnung) — würden wir hier earned=true
      // setzen, bekäme der Nutzer beim frühen Schließen einen Gratis-Reward.
      // Reject = harter Fehler → sauber auflösen.
      AdMob.showRewardVideoAd()
        .catch((err) => { console.warn('native-rewarded: show error:', err); finish(false); });
    });
  } catch (err) {
    console.warn('[ad-metrics] rewarded: KEIN fill/Fehler/Abbruch:', err && err.message || err);
    return { completed: false };
  }
}
