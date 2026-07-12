'use strict';

/* Geteilte AdMob-Basis: Consent (UMP/DSGVO) → SDK-Init, einmalig dedupliziert.
   Kein ATT/IDFA-Tracking (child-directed, nicht-personalisierte Ads).
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

  // Kein ATT/IDFA-Tracking: Bei child-directed (kindgerechte, nicht-
  // personalisierte Ads) nutzt der AdMob-SDK die Werbe-ID nicht → es findet
  // kein Tracking i. S. d. ATT statt (NSPrivacyTracking=false). Deshalb KEIN
  // requestTrackingAuthorization()-Prompt. Nur der DSGVO-Consent via UMP bleibt.

  // UMP-Consent (DSGVO) holen und ggf. Formular zeigen.
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

  // 3) Erst danach das SDK starten — kindgerechte Inhaltsfilterung setzen:
  //    maxAdContentRating: 'General' → nur G-geeignete Werbung (Enum-String aus
  //    @capacitor-community/admob MaxAdContentRating.General)
  //    tagForChildDirectedTreatment + tagForUnderAgeOfConsent → COPPA/TFUA-Flags.
  await AdMob.initialize({
    initializeForTesting:      !!ADMOB.testing,
    maxAdContentRating:        'General',
    tagForChildDirectedTreatment: true,
    tagForUnderAgeOfConsent:   true,
  });
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
