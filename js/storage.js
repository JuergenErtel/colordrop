'use strict';

import { TIER_DEFS } from './constants.js';

const PREFIX  = 'catsort';
const VERSION = '2';

// ── Helpers ───────────────────────────────────────────────────────────────
function key(name) { return `${PREFIX}_${name}`; }

function loadJSON(k, fallback) {
  try {
    const raw = localStorage.getItem(k);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(k, value) {
  try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* quota */ }
}

// ── Progress (stars per level) ─────────────────────────────────────────────
export function loadProgress() {
  return loadJSON(key('progress'), {});
}

export function saveStars(levelNum, stars) {
  const p = loadProgress();
  const prev = p[levelNum] ?? 0;
  if (stars > prev) {
    p[levelNum] = stars;
    saveJSON(key('progress'), p);
  }
}

export function maxUnlockedLevel() {
  const p    = loadProgress();
  const nums = Object.keys(p).map(Number);
  if (nums.length === 0) return 1;
  const maxSolved = Math.max(...nums);
  return maxSolved + 1;
}

// ── Daily puzzle ──────────────────────────────────────────────────────────
export function loadDaily() {
  return loadJSON(key('daily'), null);
}

export function saveDaily(obj) {
  saveJSON(key('daily'), obj);
}

// ── Rewarded video state ───────────────────────────────────────────────────
export function loadRewardedState() {
  return loadJSON(key('rewarded'), null);
}

export function saveRewardedState(state) {
  saveJSON(key('rewarded'), state);
}

// ── Stats ─────────────────────────────────────────────────────────────────
const DEFAULT_STATS = {
  totalMoves:     0,
  totalSolves:    0,
  bestStreak:     0,
  currentStreak:  0,
  lastPlayDate:   null,
  totalStars:     0,
};

export function loadStats() {
  return { ...DEFAULT_STATS, ...loadJSON(key('stats'), {}) };
}

export function saveStats(obj) {
  saveJSON(key('stats'), obj);
}

// ── Achievements ──────────────────────────────────────────────────────────
export function loadAchievements() {
  return loadJSON(key('achievements'), []);
}

export function saveAchievements(ids) {
  saveJSON(key('achievements'), ids);
}

// ── Tutorial ──────────────────────────────────────────────────────────────
export function isTutorialDone() {
  return localStorage.getItem(key('tut_done')) === '1';
}

export function markTutorialDone() {
  localStorage.setItem(key('tut_done'), '1');
}

export function hasSeenIntro(id) {
  return localStorage.getItem(key('intro_' + id)) === '1';
}

export function markIntroSeen(id) {
  localStorage.setItem(key('intro_' + id), '1');
}

// ── Settings ──────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { musicVolume: 0.3, sfxVolume: 0.7, musicEnabled: true, sfxEnabled: true };

export function loadSettings() {
  try { return Object.assign({ ...DEFAULT_SETTINGS }, JSON.parse(localStorage.getItem(`${PREFIX}-settings`) || '{}')); }
  catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(obj) {
  localStorage.setItem(`${PREFIX}-settings`, JSON.stringify(obj));
}

// ── Endless best score ─────────────────────────────────────────────────────
export function loadEndlessBest() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-endless`) || '0'); }
  catch { return 0; }
}

export function saveEndlessBest(score) {
  const current = loadEndlessBest();
  if (score > current) localStorage.setItem(`${PREFIX}-endless`, JSON.stringify(score));
}

// ── Collection ────────────────────────────────────────────────────────────
export function loadCollection() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-collection`) || '[]'); }
  catch { return []; }
}
export function saveCollection(ids) {
  localStorage.setItem(`${PREFIX}-collection`, JSON.stringify(ids));
}

// ── Mascot ───────────────────────────────────────────────────────────────
export function loadMascot() {
  return localStorage.getItem(`${PREFIX}-mascot`) || 'default';
}
export function saveMascot(id) {
  localStorage.setItem(`${PREFIX}-mascot`, id);
}

// ── Economy (coin balance) ────────────────────────────────────────────────
export function loadEconomy() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-economy`) || '0'); }
  catch { return 0; }
}
export function saveEconomy(balance) {
  localStorage.setItem(`${PREFIX}-economy`, JSON.stringify(balance));
}

// ── Premium status ────────────────────────────────────────────────────────
export function loadPremium() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-premium`) || 'false'); }
  catch { return false; }
}
export function savePremium(val) {
  localStorage.setItem(`${PREFIX}-premium`, JSON.stringify(!!val));
}

// ── Streak ────────────────────────────────────────────────────────────────
export function loadStreak() {
  const def = { current: 0, best: 0, lastDate: '', calendar: {} };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(`${PREFIX}-streak`) || '{}')); }
  catch { return def; }
}
export function saveStreak(obj) {
  localStorage.setItem(`${PREFIX}-streak`, JSON.stringify(obj));
}

// ── Migration ─────────────────────────────────────────────────────────────
export function migrateIfNeeded() {
  const versionKey = key('version');
  if (localStorage.getItem(versionKey) === VERSION) return;

  // Remove all legacy and current game keys for a clean reset
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('colordrop_') || k.startsWith('catsort_') || k.startsWith('catsort-'))) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));

  localStorage.setItem(versionKey, VERSION);
}

// ── Milestones ────────────────────────────────────────────────────────────
export function loadMilestones() {
  return loadJSON(key('milestones'), {});
}
export function saveMilestone(levelNum) {
  const m = loadMilestones();
  m[levelNum] = true;
  saveJSON(key('milestones'), m);
}

// ── Ball skins ────────────────────────────────────────────────────────────
export function loadSkins() {
  return loadJSON(key('skins'), { owned: ['default'], active: 'default' });
}
export function saveSkins(data) {
  saveJSON(key('skins'), data);
}

// ── Backgrounds ───────────────────────────────────────────────────────────
export function loadBackgrounds() {
  return loadJSON(key('backgrounds'), { owned: ['cafe'], active: 'cafe' });
}
export function saveBackgrounds(data) {
  saveJSON(key('backgrounds'), data);
}

// ── Weekly challenge ──────────────────────────────────────────────────────
export function loadWeekly() {
  return loadJSON(key('weekly'), { week: 0, completed: [false, false, false], frame: null });
}
export function saveWeekly(data) {
  saveJSON(key('weekly'), data);
}

// ── Subscription ────────────────────────────────────────────────────────
const KEY_SUBSCRIPTION = 'catsort_subscription';

export function loadSubscription() {
  try {
    const raw = localStorage.getItem(KEY_SUBSCRIPTION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveSubscription(sub) {
  try {
    localStorage.setItem(KEY_SUBSCRIPTION, JSON.stringify(sub));
  } catch { /* quota */ }
}

export function clearSubscription() {
  try { localStorage.removeItem(KEY_SUBSCRIPTION); } catch {}
}

// ── Paywall trigger state ───────────────────────────────────────────────
const KEY_PAYWALL = 'catsort_paywall_state';

export function loadPaywallState() {
  try {
    const raw = localStorage.getItem(KEY_PAYWALL);
    if (!raw) return { shown: [], lastHint3rd: 0, lastLives0: 0 };
    return JSON.parse(raw);
  } catch { return { shown: [], lastHint3rd: 0, lastLives0: 0 }; }
}

export function savePaywallState(s) {
  try { localStorage.setItem(KEY_PAYWALL, JSON.stringify(s)); } catch {}
}

// ── Lives ───────────────────────────────────────────────────────────────
const KEY_LIVES = 'catsort_lives';

export function loadLives() {
  try {
    const raw = localStorage.getItem(KEY_LIVES);
    if (!raw) return { count: 5, lastRegen: new Date().toISOString() };
    return JSON.parse(raw);
  } catch { return { count: 5, lastRegen: new Date().toISOString() }; }
}

export function saveLives(state) {
  try { localStorage.setItem(KEY_LIVES, JSON.stringify(state)); } catch {}
}

// ── Season progress ─────────────────────────────────────────────────────
const KEY_SEASON = 'catsort_season';

export function loadSeasonProgress() {
  try {
    const raw = localStorage.getItem(KEY_SEASON);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveSeasonProgress(state) {
  try { localStorage.setItem(KEY_SEASON, JSON.stringify(state)); } catch {}
}

// ── Leaderboard ─────────────────────────────────────────────────────────
const KEY_LB_ID      = 'catsort_leaderboard_id';
const KEY_LB_HISTORY = 'catsort_leaderboard_history';

export function loadLeaderboardId() {
  try {
    const raw = localStorage.getItem(KEY_LB_ID);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveLeaderboardId(obj) {
  try { localStorage.setItem(KEY_LB_ID, JSON.stringify(obj)); } catch {}
}

export function loadLeaderboardHistory() {
  try {
    const raw = localStorage.getItem(KEY_LB_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

export function saveLeaderboardHistory(arr) {
  try { localStorage.setItem(KEY_LB_HISTORY, JSON.stringify(arr)); } catch {}
}

// ── Migration: legacy premium → subscription (Founder tier) ─────────────
export function migrateToSubscriptionModel() {
  if (loadSubscription()) return; // already migrated or fresh install with new model
  const legacy = localStorage.getItem('catsort-premium') || localStorage.getItem('catsort_premium');
  if (legacy === 'true' || legacy === true) {
    saveSubscription({
      tier:      'founder',
      since:     new Date().toISOString(),
      lifetime:  true,
      active:    true,
      trialEnd:  null,
      expiresAt: null,
      stripeCustomerId: null,
    });
  }
}

// Run migration once per page load
migrateToSubscriptionModel();
