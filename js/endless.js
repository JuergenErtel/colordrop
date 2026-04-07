'use strict';

import { COLOR_KEYS, TIER_DEFS }       from './constants.js';
import { mulberry32 }                   from './engine.js';
import { loadEndlessBest, saveEndlessBest } from './storage.js';

const CAPACITY = 4; // balls per tube (fixed)

// ── Tier mapping for endless rounds ──────────────────────────────────────
// Starts at MEDIUM (index 1), increases every 5 rounds, caps at MASTER (4).
function endlessTierIndex(round) {
  return Math.min(1 + Math.floor((round - 1) / 5), TIER_DEFS.length - 1);
}

// ── Public config for a given round ───────────────────────────────────────
export function endlessConfig(round) {
  const idx       = endlessTierIndex(round);
  const tierDef   = TIER_DEFS[idx];
  const tier      = tierDef.name;
  const diff      = idx;
  const numColors = Math.min(2 + diff, COLOR_KEYS.length);
  const colors    = COLOR_KEYS.slice(0, numColors);
  const empty     = diff <= 1 ? 2 : 1;
  return { tier, diff, colors, tubes: colors.length + empty, empty };
}

// ── Tube generation for endless ────────────────────────────────────────────
export function generateEndlessTubes(round) {
  const { colors, empty } = endlessConfig(round);
  // Mix level seed with Date.now() for variety between play sessions
  const seed = (round * 1234567 + (Date.now() & 0xFFFF)) | 0;
  const rng  = mulberry32(seed);

  const pool = [];
  for (const c of colors) {
    for (let i = 0; i < CAPACITY; i++) pool.push(c);
  }

  // Multi-round Fisher-Yates
  const rounds = 1 + endlessTierIndex(round);
  for (let r = 0; r < rounds; r++) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  const result = [];
  for (let t = 0; t < colors.length; t++) {
    result.push(pool.slice(t * CAPACITY, (t + 1) * CAPACITY));
  }
  for (let e = 0; e < empty; e++) result.push([]);
  return result;
}

// ── Par for endless round ─────────────────────────────────────────────────
export function endlessParForRound(round) {
  const { colors } = endlessConfig(round);
  const numColors  = colors.length;
  // Gets stricter as round increases within each tier block (every 5)
  const posInBlock = ((round - 1) % 5) / 4;
  return Math.round(numColors * (6 - posInBlock));
}

// ── State machine ─────────────────────────────────────────────────────────
export const ENDLESS = {
  active:      false,
  round:       0,
  bestRound:   0,
  allTimeBest: 0,
};

export function startEndless() {
  ENDLESS.allTimeBest = loadEndlessBest();
  ENDLESS.active      = true;
  ENDLESS.round       = 1;
  ENDLESS.bestRound   = 0;
}

export function endlessNextRound() {
  if (!ENDLESS.active) return;
  ENDLESS.bestRound = ENDLESS.round;
  ENDLESS.round++;
}

export function endEndless() {
  if (!ENDLESS.active) return;
  // bestRound is the last completed round
  saveEndlessBest(ENDLESS.bestRound);
  ENDLESS.allTimeBest = loadEndlessBest();
  ENDLESS.active      = false;
}
