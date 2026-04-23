'use strict';

import { SEASONS, getCurrentSeasonKey, getCurrentSeason } from './season-content.js';
import { loadSeasonProgress, saveSeasonProgress, loadCollection, saveCollection } from './storage.js';
import { earn, isPremium } from './economy.js';
import { unlockSkin, unlockBg } from './skins.js';

// ── XP amounts per action ───────────────────────────────────────────────
export const XP = {
  levelSolve:      10,
  threeStarLevel:  20,  // replaces levelSolve, not additive
  dailyChallenge:  50,
  weeklyStage:     40,
  blitzWin:        30,
  miniGameWin:     40,
  achievement:    100,
};

// ── XP required to reach given tier (inclusive) ────────────────────────
export function xpForTier(tier) {
  if (tier <= 0)  return 0;
  if (tier > 50)  tier = 50;
  let total = 0;
  for (let t = 1; t <= tier; t++) total += 20 + 15 * (t - 1);
  return total;
}

export function tierFromXp(xp) {
  for (let t = 1; t <= 50; t++) {
    if (xp < xpForTier(t)) return t - 1;
  }
  return 50;
}

// ── Load / init progress (auto-resets at month boundary) ────────────────
export function getProgress() {
  const key = getCurrentSeasonKey();
  const saved = loadSeasonProgress();
  if (!saved || saved.seasonKey !== key) {
    if (saved) archiveUnclaimed(saved);
    const fresh = {
      seasonKey: key,
      xp: 0,
      claimedFree:    [],
      claimedPremium: [],
      startedAt: new Date().toISOString(),
    };
    saveSeasonProgress(fresh);
    return fresh;
  }
  return saved;
}

function archiveUnclaimed(oldProgress) {
  const season = SEASONS[oldProgress.seasonKey];
  if (!season) return;
  const currentTier = tierFromXp(oldProgress.xp);
  for (let t = 1; t <= currentTier; t++) {
    const rewards = season.rewards[t - 1] || { free: null, premium: null };
    if (rewards.free && !oldProgress.claimedFree.includes(t)) {
      applyReward(rewards.free);
    }
    if (rewards.premium && !oldProgress.claimedPremium.includes(t) && isPremium()) {
      applyReward(rewards.premium);
    }
  }
}

export function addXp(amount, _reason = '') {
  const p = getProgress();
  const oldTier = tierFromXp(p.xp);
  p.xp += amount;
  const newTier = tierFromXp(p.xp);
  saveSeasonProgress(p);
  return { oldTier, newTier, leveledUp: newTier > oldTier, newXp: p.xp, reason: _reason };
}

export function claimTier(tier, track = 'free') {
  const p = getProgress();
  const season = getCurrentSeason();
  if (!season) return { ok: false, reason: 'no_season' };
  if (tierFromXp(p.xp) < tier) return { ok: false, reason: 'not_reached' };

  const claimedList = track === 'premium' ? p.claimedPremium : p.claimedFree;
  if (claimedList.includes(tier)) return { ok: false, reason: 'already_claimed' };
  if (track === 'premium' && !isPremium()) return { ok: false, reason: 'not_premium' };

  const def = season.rewards[tier - 1]?.[track];
  if (!def) return { ok: false, reason: 'no_reward' };

  applyReward(def);
  claimedList.push(tier);
  saveSeasonProgress(p);
  return { ok: true, reward: def };
}

function applyReward(def) {
  if (!def) return;
  if (def.kind === 'bones')    earn(def.value);
  if (def.kind === 'skin')     unlockSkin(def.value);
  if (def.kind === 'bg')       unlockBg(def.value);
  if (def.kind === 'cat')      {
    const coll = loadCollection();
    if (!coll.includes(def.value)) { coll.push(def.value); saveCollection(coll); }
  }
  if (def.kind === 'frame')    {
    const frames = JSON.parse(localStorage.getItem('catsort_frames') || '[]');
    if (!frames.includes(def.value)) {
      frames.push(def.value);
      localStorage.setItem('catsort_frames', JSON.stringify(frames));
    }
  }
  if (def.kind === 'hint')     addHintToken(def.value);
  if (def.kind === 'undo')     addUndoToken(def.value);
  if (def.kind === 'ad_skip')  addAdSkipToken(def.value);
  if (def.kind === 'bundle')   def.items.forEach(applyReward);
}

function bump(key, delta) {
  const cur = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(cur + delta));
}
export function addHintToken(n = 1)    { bump('catsort_free_hints', n); }
export function addUndoToken(n = 1)    { bump('catsort_free_undos', n); }
export function addAdSkipToken(n = 1)  { bump('catsort_ad_skips',   n); }

export function consumeHintToken() {
  const c = parseInt(localStorage.getItem('catsort_free_hints') || '0', 10);
  if (c > 0) { localStorage.setItem('catsort_free_hints', String(c - 1)); return true; }
  return false;
}
export function consumeUndoToken() {
  const c = parseInt(localStorage.getItem('catsort_free_undos') || '0', 10);
  if (c > 0) { localStorage.setItem('catsort_free_undos', String(c - 1)); return true; }
  return false;
}

// ── Rollover check (call from main boot) ────────────────────────────────
export function checkSeasonRollover() {
  const saved = loadSeasonProgress();
  const currentKey = getCurrentSeasonKey();
  if (saved && saved.seasonKey !== currentKey) {
    const newSeason = getCurrentSeason();
    getProgress();  // triggers archive + reset internally
    return { rolled: true, newSeasonName: newSeason?.name || 'Neue Saison' };
  }
  return { rolled: false, newSeasonName: null };
}
