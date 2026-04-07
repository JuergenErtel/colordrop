'use strict';

import { TIER_DEFS } from './constants.js';

const PREFIX  = 'catsort';
const VERSION = '1';

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

// ── Migration ─────────────────────────────────────────────────────────────
export function migrateIfNeeded() {
  const versionKey = key('version');
  if (localStorage.getItem(versionKey) === VERSION) return;

  // Remove legacy colordrop_* keys
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('colordrop_')) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));

  localStorage.setItem(versionKey, VERSION);
}
