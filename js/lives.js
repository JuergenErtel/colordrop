'use strict';

import { loadLives, saveLives } from './storage.js';
import { isPremium, spend, canAfford } from './economy.js';

export const MAX_LIVES   = 5;
export const REGEN_MS    = 20 * 60 * 1000;   // 20 min per life
export const REFILL_COST = 50;                // bones for full refill

// ── Core state accessors ────────────────────────────────────────────
export function checkRegen() {
  const { count, lastRegen } = loadLives();
  if (count >= MAX_LIVES) {
    // keep lastRegen fresh so next consume doesn't double-regen
    if (new Date(lastRegen).getTime() + REGEN_MS < Date.now()) {
      saveLives({ count: MAX_LIVES, lastRegen: new Date().toISOString() });
    }
    return;
  }
  const elapsed = Date.now() - new Date(lastRegen).getTime();
  const regens = Math.floor(elapsed / REGEN_MS);
  if (regens <= 0) return;
  const newCount  = Math.min(MAX_LIVES, count + regens);
  const carryOver = elapsed - (regens * REGEN_MS);
  saveLives({
    count: newCount,
    lastRegen: new Date(Date.now() - carryOver).toISOString(),
  });
}

export function getLivesCount() {
  if (isPremium()) return Infinity;
  checkRegen();
  return loadLives().count;
}

export function hasLife() {
  return getLivesCount() > 0;
}

export function consumeLife() {
  if (isPremium()) return true;
  checkRegen();
  const state = loadLives();
  if (state.count <= 0) return false;
  state.count -= 1;
  // Only set lastRegen when transitioning from full → not-full
  if (state.count === MAX_LIVES - 1) {
    state.lastRegen = new Date().toISOString();
  }
  saveLives(state);
  return true;
}

export function refillWithBones() {
  if (isPremium()) return { ok: true, alreadyPremium: true };
  if (!canAfford(REFILL_COST)) return { ok: false, reason: 'insufficient' };
  spend(REFILL_COST);
  saveLives({ count: MAX_LIVES, lastRegen: new Date().toISOString() });
  return { ok: true };
}

export function refillWithAd() {
  if (isPremium()) return { ok: true, alreadyPremium: true };
  const state = loadLives();
  state.count = Math.min(MAX_LIVES, state.count + 1);
  if (state.count === MAX_LIVES) state.lastRegen = new Date().toISOString();
  saveLives(state);
  return { ok: true };
}

export function msUntilNextLife() {
  if (isPremium()) return 0;
  const { count, lastRegen } = loadLives();
  if (count >= MAX_LIVES) return 0;
  const elapsed = Date.now() - new Date(lastRegen).getTime();
  return Math.max(0, REGEN_MS - elapsed);
}

export function formatTimeLeft(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
