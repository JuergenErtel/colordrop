'use strict';

import { REWARDS, COSTS, HINT_COSTS } from './constants.js';
import { loadEconomy, saveEconomy, loadPremium, savePremium } from './storage.js';

// ── Balance ───────────────────────────────────────────────────────────────────
export function getBalance() {
  return loadEconomy();
}

export function setBalance(n) {
  saveEconomy(Math.max(0, Math.floor(n)));
}

export function earn(amount) {
  setBalance(getBalance() + amount);
}

export function spend(amount) {
  const bal = getBalance();
  if (bal < amount) return false;
  setBalance(bal - amount);
  return true;
}

export function canAfford(amount) {
  return getBalance() >= amount;
}

// ── Premium ───────────────────────────────────────────────────────────────────
export function isPremium() {
  return loadPremium();
}

export function setPremium(val) {
  savePremium(!!val);
}

// ── Win rewards ───────────────────────────────────────────────────────────────
/**
 * Calculate reward for completing a level.
 * Premium players earn double.
 */
export function calcWinReward(stars, isDaily, isBlitz) {
  let reward = 0;

  if (isDaily) {
    reward += REWARDS.dailyWin;
  } else if (isBlitz) {
    reward += REWARDS.blitzWin;
  } else {
    reward += stars >= 3 ? REWARDS.threeStarWin : REWARDS.levelWin;
  }

  if (isPremium()) reward *= 2;

  return reward;
}

// ── Ad timing ─────────────────────────────────────────────────────────────────
const AD_INTERVAL_LEVELS = 3;
const AD_COOLDOWN_MS     = 3 * 60 * 1000; // 3 minutes

let _levelsSinceAd = 0;
let _lastAdTime    = 0;

export function shouldShowAd() {
  if (isPremium()) return false;
  if (_levelsSinceAd < AD_INTERVAL_LEVELS) return false;
  if (Date.now() - _lastAdTime < AD_COOLDOWN_MS) return false;
  return true;
}

export function markAdShown() {
  _levelsSinceAd = 0;
  _lastAdTime    = Date.now();
}

/** Call after each level completion to track ad cadence. */
export function tickAdLevel() {
  _levelsSinceAd += 1;
}

// ── Undo limits ───────────────────────────────────────────────────────────────
const FREE_UNDOS = 3;

let _undosUsed = 0;

export function canUndo(historyLen) {
  if (historyLen <= 0) return false;
  if (isPremium()) return true;
  return _undosUsed < FREE_UNDOS;
}

export function trackUndo() {
  _undosUsed += 1;
}

export function resetUndos() {
  _undosUsed = 0;
}

export function getUndosLeft() {
  if (isPremium()) return Infinity;
  return Math.max(0, FREE_UNDOS - _undosUsed);
}

// ── Hints ─────────────────────────────────────────────────────────────────
export function getHintCost(tierName) {
  return HINT_COSTS[tierName] ?? COSTS.hint;
}

export function canUseHint(tierName = 'EASY') {
  if (isPremium()) return true;
  return canAfford(getHintCost(tierName));
}

export function spendHint(tierName = 'EASY') {
  if (isPremium()) return true;
  return spend(getHintCost(tierName));
}

// ── Endless limits ────────────────────────────────────────────────────────────
const FREE_ENDLESS_PER_DAY = 3;
const _endlessKey = 'catsort-endless-plays';

function _todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function _loadEndlessPlays() {
  try {
    const raw = localStorage.getItem(_endlessKey);
    if (!raw) return { date: _todayStr(), count: 0 };
    const obj = JSON.parse(raw);
    if (obj.date !== _todayStr()) return { date: _todayStr(), count: 0 };
    return obj;
  } catch {
    return { date: _todayStr(), count: 0 };
  }
}

function _saveEndlessPlays(obj) {
  try { localStorage.setItem(_endlessKey, JSON.stringify(obj)); } catch { /* quota */ }
}

export function canPlayEndless() {
  if (isPremium()) return true;
  const { count } = _loadEndlessPlays();
  return count < FREE_ENDLESS_PER_DAY;
}

export function trackEndlessPlay() {
  if (isPremium()) return;
  const plays = _loadEndlessPlays();
  plays.count += 1;
  _saveEndlessPlays(plays);
}
