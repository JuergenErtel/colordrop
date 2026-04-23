'use strict';

import {
  loadLeaderboardId, saveLeaderboardId,
  loadLeaderboardHistory, saveLeaderboardHistory,
} from './storage.js';
import { earn } from './economy.js';

// ── Nick generator ──────────────────────────────────────────────────
const CAT_ADJECTIVES = [
  'Wuscheliger','Flauschiger','Verschlafener','Tapferer','Neugieriger',
  'Frecher','Edler','Mysteriöser','Sanfter','Wilder',
  'Ruhiger','Hungriger','Schnurrender','Stolzer','Verträumter',
  'Listiger','Majestätischer','Schüchterner','Abenteuerlicher','Zauberhafter',
];
const CAT_NOUNS = [
  'Kater','Schnurrer','Tiger','Panther','Löwe','Wollknäuel-Meister',
  'Mäuse-Jäger','Sortier-König','Fisch-Gräten-Sammler','Schatten-Pfoten',
  'Samt-Tatzen','Stern-Augen','Mond-Miez','Sonnen-Kätzchen','Garten-Prinz',
  'Dach-Wanderer','Nacht-Streuner','Baum-Kletterer','Sofa-Löwe','Fenster-Späher',
];

function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ensureLeaderboardId() {
  let id = loadLeaderboardId();
  if (id) return id;
  const rng = mulberry32(hash32('init-' + Date.now()));
  const adj = CAT_ADJECTIVES[Math.floor(rng() * CAT_ADJECTIVES.length)];
  const noun = CAT_NOUNS[Math.floor(rng() * CAT_NOUNS.length)];
  const num = Math.floor(rng() * 9000) + 1000;
  id = { nick: `${adj}${noun}-${num}`, joinedAt: new Date().toISOString() };
  saveLeaderboardId(id);
  return id;
}

// ── ISO week number helper ──────────────────────────────────────────
export function getIsoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ── Bot leaderboard generation ──────────────────────────────────────
export function generateBots(weekKey, userMaxLevel) {
  const seed = hash32(weekKey);
  const rng = mulberry32(seed);
  const bots = [];
  for (let i = 0; i < 199; i++) {
    const adj = CAT_ADJECTIVES[Math.floor(rng() * CAT_ADJECTIVES.length)];
    const noun = CAT_NOUNS[Math.floor(rng() * CAT_NOUNS.length)];
    const num = Math.floor(rng() * 9000) + 1000;
    let score;
    if (rng() < 0.1) {
      // Outliers (top 10%) — 2-3.5x user's max level
      score = Math.floor((userMaxLevel || 1) * (2 + rng() * 1.5));
    } else {
      // Gaussian-ish around user × 0.9, with 30% spread
      const base = (userMaxLevel || 1) * 0.9;
      const noise = (rng() - 0.5) * (userMaxLevel || 1) * 0.3;
      score = Math.max(1, Math.floor(base + noise));
    }
    bots.push({ nick: `${adj}${noun}-${num}`, score, isBot: true });
  }
  return bots;
}

// ── User score for current week ────────────────────────────────────
const KEY_WEEK_SCORE = 'catsort_week_score';

function _loadWeekScore() {
  try {
    const raw = localStorage.getItem(KEY_WEEK_SCORE);
    if (!raw) return { weekKey: getIsoWeekKey(), score: 0 };
    const obj = JSON.parse(raw);
    if (obj.weekKey !== getIsoWeekKey()) {
      return { weekKey: getIsoWeekKey(), score: 0 };
    }
    return obj;
  } catch { return { weekKey: getIsoWeekKey(), score: 0 }; }
}
function _saveWeekScore(obj) {
  try { localStorage.setItem(KEY_WEEK_SCORE, JSON.stringify(obj)); } catch {}
}

export function addWeekScore(points) {
  const ws = _loadWeekScore();
  ws.score += points;
  _saveWeekScore(ws);
}

export function getWeekScore() {
  return _loadWeekScore().score;
}

// ── Ranking computation ─────────────────────────────────────────────
export function computeRanking(userMaxLevel) {
  const weekKey = getIsoWeekKey();
  const bots = generateBots(weekKey, userMaxLevel || 1);
  const user = { nick: ensureLeaderboardId().nick, score: getWeekScore(), isUser: true };
  const all  = [...bots, user];
  all.sort((a, b) => b.score - a.score);
  const rank = all.findIndex(e => e.isUser) + 1;
  return { rank, total: all.length, entries: all, userNick: user.nick };
}

// ── Weekly rollover + reward ────────────────────────────────────────
const KEY_LAST_ROLLOVER = 'catsort_last_week_rollover';

export function checkWeeklyRollover() {
  const now = new Date();
  const currentKey = getIsoWeekKey(now);
  const lastKey = localStorage.getItem(KEY_LAST_ROLLOVER);
  if (lastKey === currentKey) return null;

  // Rolled over. Compute rewards for the PREVIOUS week.
  try {
    const raw = localStorage.getItem(KEY_WEEK_SCORE);
    const prev = raw ? JSON.parse(raw) : null;
    if (prev && prev.weekKey !== currentKey && prev.score > 0) {
      const userMaxLevel = parseInt(localStorage.getItem('catsort_max_level') || '1', 10);
      const bots = generateBots(prev.weekKey, userMaxLevel);
      const all = [...bots, { nick: 'you', score: prev.score, isUser: true }].sort((a, b) => b.score - a.score);
      const rank = all.findIndex(e => e.isUser) + 1;

      let reward = 5;
      if      (rank <= 10)  reward = 50;
      else if (rank <= 50)  reward = 20;
      else if (rank <= 100) reward = 10;

      earn(reward);

      const hist = loadLeaderboardHistory();
      hist.unshift({ weekKey: prev.weekKey, rank, total: all.length, score: prev.score, reward });
      saveLeaderboardHistory(hist.slice(0, 20));

      _saveWeekScore({ weekKey: currentKey, score: 0 });
      localStorage.setItem(KEY_LAST_ROLLOVER, currentKey);

      return { rank, reward, prevScore: prev.score };
    }
  } catch (e) { /* swallow */ }

  localStorage.setItem(KEY_LAST_ROLLOVER, currentKey);
  return null;
}
