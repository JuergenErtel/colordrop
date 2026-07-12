'use strict';

/* Adaptiver Bottom-Banner (AdMob). Nur nativ + nur mit Consent + nicht für
   Premium. Zeigt/aktualisiert idempotent; hideBanner() blendet aus, ohne zu
   entfernen (schnelles Wiederzeigen). Wird NUR auf Menü/Level-Select gezeigt,
   nie über dem aktiven Spielbrett (main.js verdrahtet show/hide).
   Leere ADMOB.bannerUnitId → alles no-op (Banner deaktiviert). */

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
    console.info('[ad-metrics] banner: angefordert');
  } catch (err) {
    console.warn('[ad-metrics] banner: KEIN fill/Fehler:', err && err.message || err);
  }
}

export async function hideBanner() {
  const AdMob = getAdMob();
  if (!AdMob || !_shown) return;
  try { await AdMob.hideBanner(); } catch { /* ignore */ }
}
