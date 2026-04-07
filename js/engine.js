'use strict';

import {
  COLOR_KEYS, TIER_DEFS, THEMES,
  TUTORIAL_TUBES,
  BALL_D, BALL_GAP, BALL_PAD, TUBE_H,
} from './constants.js';

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
  const colors  = COLOR_KEYS.slice(0, 2 + Math.min(diff + 1, COLOR_KEYS.length - 2));
  // Number of non-empty tubes scales with level within tier
  const tierDef = TIER_DEFS[diff];
  const span    = tierDef.maxLevel - tierDef.minLevel || 1;
  const pos     = Math.max(0, Math.min(n - tierDef.minLevel, span));
  const tubes   = 2 + diff + Math.floor(pos / span * 2);
  const empty   = 1 + (diff >= 2 ? 1 : 0);
  return { tier, diff, colors, tubes, empty };
}

// ── Par and timer ─────────────────────────────────────────────────────────
export function parForLevel(n) {
  const { diff, tubes, colors } = levelConfig(n);
  const base = tubes * 4 + diff * 3;
  return Math.max(8, base + Math.floor(n * 0.4));
}

export function isTimedLevel(n) {
  return n >= 20 && n % 5 === 0;
}

export function timerDuration(n) {
  const base = 120000; // 2 min
  const reduction = Math.floor(n / 10) * 5000;
  return Math.max(45000, base - reduction);
}

export function calcStars(moves, par) {
  if (moves <= par)           return 3;
  if (moves <= par * 1.5)     return 2;
  return 1;
}

// ── Win detection ─────────────────────────────────────────────────────────
export function isSolved(tube) {
  if (tube.length === 0) return true;
  const capacity = Math.floor((TUBE_H - BALL_PAD * 2) / (BALL_D + BALL_GAP));
  if (tube.length !== capacity && tube.length !== 0) {
    // Partial tubes are not solved unless empty
    if (tube.length > 0 && tube.length < capacity) return false;
  }
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

  const capacity = Math.floor((TUBE_H - BALL_PAD * 2) / (BALL_D + BALL_GAP));
  if (dst.length >= capacity) return false;

  const topSrc = src[src.length - 1];
  if (dst.length === 0) return true;
  const topDst = dst[dst.length - 1];
  return topSrc === topDst;
}

// ── Tube generation ───────────────────────────────────────────────────────
export function generateTubes(n) {
  const { colors, tubes: numTubes, empty } = levelConfig(n);
  const capacity = Math.floor((TUBE_H - BALL_PAD * 2) / (BALL_D + BALL_GAP));
  const rng      = mulberry32(n * 1234567 + 42);

  // Build a pool of balls
  const pool = [];
  for (const c of colors) {
    for (let i = 0; i < capacity; i++) pool.push(c);
  }

  // Fisher-Yates shuffle (tierDifficulty rounds)
  const rounds = 1 + tierDifficulty(n);
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
  const capacity = Math.floor((TUBE_H - BALL_PAD * 2) / (BALL_D + BALL_GAP));

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
  const now   = Date.now();
  const day   = Math.floor((now - epoch) / 86400000);
  // Cycles through levels 1–70
  return (day % 70) + 1;
}
