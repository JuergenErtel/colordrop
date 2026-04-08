'use strict';

import {
  COLOR_KEYS, TIER_DEFS, THEMES,
  TUTORIAL_TUBES,
} from './constants.js';

const CAPACITY = 4; // balls per tube (fixed)

// ── PRNG ──────────────────────────────────────────────────────────────────
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ── Tier helpers ──────────────────────────────────────────────────────────
export function tierForLevel(n) {
  for (const t of TIER_DEFS) {
    if (n >= t.minLevel && n <= t.maxLevel) return t.name;
  }
  return TIER_DEFS[TIER_DEFS.length - 1].name;
}

export function tierDifficulty(n) {
  const name = tierForLevel(n);
  const idx  = TIER_DEFS.findIndex(t => t.name === name);
  return idx; // 0=EASY … 4=MASTER
}

// ── Level configuration ───────────────────────────────────────────────────
export function levelConfig(n) {
  const tier    = tierForLevel(n);
  const diff    = tierDifficulty(n);
  const tierDef = TIER_DEFS[diff];
  const span    = tierDef.maxLevel - tierDef.minLevel || 1;
  const progress = Math.min(1, (n - tierDef.minLevel) / span);

  // Colors ramp up faster and scale within each tier:
  //   EASY   (1-15):   2 → 3 colors
  //   MEDIUM (16-45):  3 → 5 colors
  //   HARD   (46-100): 5 → 7 colors
  //   EXPERT (101-180):7 → 9 colors
  //   MASTER (181-300):9 → 10 colors
  const colorRanges = [
    [2, 3],   // EASY
    [3, 5],   // MEDIUM
    [5, 7],   // HARD
    [7, 9],   // EXPERT
    [9, 10],  // MASTER
  ];
  const [minC, maxC] = colorRanges[diff] || [2, 3];
  const numColors = Math.min(Math.floor(minC + progress * (maxC - minC + 0.99)), COLOR_KEYS.length);
  const colors = COLOR_KEYS.slice(0, numColors);

  // Empty tubes: 2 for early levels, 1 from MEDIUM onward, some MASTER levels get 1
  const empty = (diff === 0 || (diff === 1 && progress < 0.3)) ? 2 : 1;

  return { tier, diff, colors, tubes: colors.length + empty, empty };
}

// ── Par and timer ─────────────────────────────────────────────────────────
export function parForLevel(n) {
  const { colors } = levelConfig(n);
  const numColors  = colors.length;
  const diff = tierDifficulty(n);
  const tierDef = TIER_DEFS[diff];
  const span    = tierDef.maxLevel - tierDef.minLevel || 1;
  const progress = (n - tierDef.minLevel) / span;
  // Tighter par: scales with colors but gets stricter at higher tiers
  const baseMult = 5.5 - diff * 0.5;
  return Math.max(numColors + 2, Math.round(numColors * (baseMult - progress * 1.5)));
}

export function isTimedLevel(n) { return n >= 8 && n % 8 === 0; }

export function timerDuration(n) {
  const tierMs = { EASY: 100, MEDIUM: 85, HARD: 70, EXPERT: 55, MASTER: 45 };
  return (tierMs[tierForLevel(n)] || 70) * 1000;
}

export function calcStars(moves, par) {
  if (moves <= par)           return 3;
  if (moves <= par * 1.5)     return 2;
  return 1;
}

// ── Win detection ─────────────────────────────────────────────────────────
export function isSolved(tube) {
  if (tube.length === 0) return true;
  if (tube.length < CAPACITY) return false;
  const first = tube[0];
  return tube.every(c => c === first);
}

export function checkWinState(tubes) {
  return tubes.every(tube => isSolved(tube));
}

// ── Move validation ───────────────────────────────────────────────────────
export function canMove(tubes, from, to) {
  if (from === to) return false;
  const src  = tubes[from];
  const dst  = tubes[to];
  if (src.length === 0) return false;
  if (dst.length >= CAPACITY) return false;
  const topSrc = src[src.length - 1];
  if (dst.length === 0) return true;
  const topDst = dst[dst.length - 1];
  return topSrc === topDst;
}

// ── Tube generation ───────────────────────────────────────────────────────
export function generateTubes(n) {
  const { colors, tubes: numTubes, empty } = levelConfig(n);
  const capacity = CAPACITY;
  const rng      = mulberry32(n * 1234567 + 42);

  // Build a pool of balls
  const pool = [];
  for (const c of colors) {
    for (let i = 0; i < capacity; i++) pool.push(c);
  }

  // Fisher-Yates shuffle — more rounds = harder scramble
  const rounds = 2 + tierDifficulty(n) * 2;
  for (let r = 0; r < rounds; r++) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  // Distribute into tubes
  const result = [];
  for (let t = 0; t < colors.length; t++) {
    result.push(pool.slice(t * capacity, (t + 1) * capacity));
  }
  // Add empty tubes
  for (let e = 0; e < empty; e++) result.push([]);

  return result;
}

export function generateTutorialTubes() {
  return TUTORIAL_TUBES.map(t => [...t]);
}

// ── BFS hint solver ───────────────────────────────────────────────────────
export function solveHint(tubes) {
  const capacity = CAPACITY;

  function serialize(ts) { return ts.map(t => t.join(',')).join('|'); }
  function cloneTs(ts)    { return ts.map(t => [...t]); }

  const start = serialize(tubes);
  if (checkWinState(tubes)) return null;

  const queue   = [{ state: tubes, moves: [] }];
  const visited = new Set([start]);
  const LIMIT   = 5000;

  while (queue.length > 0 && visited.size < LIMIT) {
    const { state, moves } = queue.shift();
    const n = state.length;
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (!canMove(state, from, to)) continue;
        const next = cloneTs(state);
        next[to].push(next[from].pop());
        const key = serialize(next);
        if (visited.has(key)) continue;
        visited.add(key);
        const newMoves = [...moves, { from, to }];
        if (checkWinState(next)) return newMoves[0];
        queue.push({ state: next, moves: newMoves });
      }
    }
  }
  return null;
}

// ── Daily level number ────────────────────────────────────────────────────
export function dailyLevelNum() {
  const epoch = new Date('2025-01-01').getTime();
  const day   = Math.floor((Date.now() - epoch) / 86400000);
  return (day % 200) + 1;
}
