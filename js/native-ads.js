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

  // 1) iOS ATT zuerst: ein einzelner System-Dialog, bevor das UMP-Formular
  //    erscheint. So sieht der Nutzer nicht zwei aufeinanderfolgende, leicht
  //    verwirrende Consent-Dialoge (UMP-Sheet direkt gefolgt vom ATT-Prompt).
  try {
    if (typeof AdMob.requestTrackingAuthorization === 'function') {
      await AdMob.requestTrackingAuthorization();
    }
  } catch (err) {
    console.warn('native-ads: ATT-Dialog übersprungen:', err);
  }

  // 2) UMP-Consent (DSGVO) holen und ggf. Formular zeigen.
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

  // 3) Erst danach das SDK starten.
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
