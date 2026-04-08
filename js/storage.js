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
