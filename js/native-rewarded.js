'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   NATIVE REWARDED VIDEO (AdMob) — Bridge für den Capacitor-iOS-Build
   ───────────────────────────────────────────────────────────────────────
   Ersetzt AdSense (im Web) durch AdMob (in der App). Nur nativ aktiv; im Web
   wird das Modul importiert, aber nie aufgerufen (REWARDED_MODE != 'native').

   Zugriff über window.Capacitor.Plugins.AdMob — KEIN statischer Paket-Import,
   damit der Web-Bundle (www/) unberührt bleibt.

   ── TODO am Mac ────────────────────────────────────────────────────────────
   1. npm i @capacitor-community/admob   (+ npx cap sync ios)
   2. AdMob-Konto: App + Rewarded-Ad-Unit anlegen → IDs unten eintragen.
   3. Info.plist: GADApplicationIdentifier, SKAdNetworkItems, NSUserTracking-
      UsageDescription (ATT). Privacy-Manifest PrivacyInfo.xcprivacy ergänzen.
   4. Zielgruppe 4+ (KEINE Kids-Kategorie) → AdMob non-personalized ok,
      Tagging entsprechend setzen.
   ══════════════════════════════════════════════════════════════════════════ */

// AdMob Ad-Unit-IDs (aus AdMob-Konsole). Test-IDs als Default, bis live.
const AD_UNITS = {
  // Googles offizielle Test-Rewarded-Unit (iOS) — vor Release ersetzen!
  rewarded: 'ca-app-pub-3940256099942544/1712485313',
};

let initialized = false;

function getAdMob() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins.AdMob) || null;
}

async function ensureInit(AdMob) {
  if (initialized) return;
  await AdMob.initialize({ initializeForTesting: false });
  initialized = true;
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
    await ensureInit(AdMob);
    await AdMob.prepareRewardVideoAd({ adId: AD_UNITS.rewarded });

    // showRewardVideoAd() liefert das Reward-Objekt, wenn die Belohnung
    // verdient wurde; bei Abbruch/kein Fill wirft es bzw. liefert nichts.
    const reward = await AdMob.showRewardVideoAd();
    return { completed: !!reward };
  } catch (err) {
    console.warn('native-rewarded: Ad fehlgeschlagen/abgebrochen:', err);
    return { completed: false };
  }
}
