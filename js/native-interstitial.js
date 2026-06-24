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
