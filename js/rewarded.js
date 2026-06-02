'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   REWARDED VIDEO — LAUNCH PROCEDURE
   ───────────────────────────────────────────────────────────────────────
   Aktuell REWARDED_MODE='preview' (constants.js): simuliertes Video, keine
   echte Werbung. Zum Live-Schalten mit Google H5 Games Ads:

   1. AdSense-für-Spiele-Account aktiv, Domain (kittysort.de) freigegeben.
   2. H5 Games Ads SDK im <head> laden (mit integrity + crossorigin):
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

let _inFlight = false;

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

  if (_inFlight) return { completed: false, reason: 'busy' };
  _inFlight = true;
  try {
    let completed = false;
    try {
      ({ completed } = await playAd(surface));
    } catch (e) {
      console.error('rewarded playAd failed:', e);
      return { completed: false, reason: 'error' };
    }
    if (!completed) return { completed: false, reason: 'aborted' };

    saveRewardedState(recordClaim(freshState(), surface, Date.now()));
    return { completed: true };
  } finally {
    _inFlight = false;
  }
}

// ── Premium-Perk: gratis weiter, ohne Video, aber gleiches Cap/Cooldown ─────
// Für Surfaces, die auch Premium-Nutzern sinnvoll offenstehen (z. B. Blitz-
// Continue). Reiner Gate-Check, ignoriert den Premium-Block von canShowRewarded.
export function canClaimFree(surface) {
  return canClaim(freshState(), surface, Date.now(), REWARDED_LIMITS);
}

// Bucht einen Claim ohne Ad. Belohnung vergibt der Aufrufer (wie showRewarded).
export function claimFree(surface) {
  const gate = canClaimFree(surface);
  if (!gate.ok) return { completed: false, reason: gate.reason };
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
