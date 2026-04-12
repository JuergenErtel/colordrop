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

  // Empty tubes: always 2 — ensures puzzles are solvable; difficulty comes from color count
  const empty = 2;

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

export function isDogLevel(n) {
  return n >= 10 && n % 3 === 1 && !isTimedLevel(n);
}

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
  const real = tube.find(c => c !== 'joker');
  if (!real) return true;
  return tube.every(c => c === real || c === 'joker');
}

export function checkWinState(tubes) {
  return tubes.every(tube => isSolved(tube));
}

// ── Joker ball removal ───────────────────────────────────────────────────
// When the joker first shares a tube with colored balls, one ball of that
// color is removed from another tube (the joker is an extra ball).
// Returns { color, tubeIdx, ballIdx } of the removed ball, or null.
export function applyJokerRemoval(tubes, jokerTubeIdx) {
  const tube = tubes[jokerTubeIdx];
  const jokerColor = tube.find(c => c !== 'joker');
  if (!jokerColor) return null;

  // Prefer removing from the top of another tube (cleanest visually)
  for (let ti = 0; ti < tubes.length; ti++) {
    if (ti === jokerTubeIdx) continue;
    const t = tubes[ti];
    if (t.length > 0 && t[t.length - 1] === jokerColor) {
      t.pop();
      return { color: jokerColor, tubeIdx: ti, ballIdx: t.length };
    }
  }
  // Fallback: remove from anywhere
  for (let ti = 0; ti < tubes.length; ti++) {
    if (ti === jokerTubeIdx) continue;
    const t = tubes[ti];
    for (let bi = t.length - 1; bi >= 0; bi--) {
      if (t[bi] === jokerColor) {
        t.splice(bi, 1);
        return { color: jokerColor, tubeIdx: ti, ballIdx: bi };
      }
    }
  }
  return null;
}

// Find which tube index contains the joker, or -1
export function findJokerTube(tubes) {
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].includes('joker')) return i;
  }
  return -1;
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
  return topSrc === topDst || topSrc === 'joker' || topDst === 'joker';
}

// ── Solvability check (BFS, returns move count or -1) ────────────────────
function isSolvable(tubes, limit = 200000) {
  function serialize(ts) { return ts.map(t => t.join(',')).join('|'); }
  function cloneTs(ts)   { return ts.map(t => [...t]); }

  if (checkWinState(tubes)) return 0;
  const visited = new Set([serialize(tubes)]);
  const queue   = [{ state: tubes, depth: 0 }];

  while (queue.length > 0 && visited.size < limit) {
    const { state, depth } = queue.shift();
    const n = state.length;
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (!canMove(state, from, to)) continue;
        const next = cloneTs(state);
        next[to].push(next[from].pop());
        const key = serialize(next);
        if (visited.has(key)) continue;
        visited.add(key);
        if (checkWinState(next)) return depth + 1;
        queue.push({ state: next, depth: depth + 1 });
      }
    }
  }
  return -1;
}

// ── Tube generation ───────────────────────────────────────────────────────
export function generateTubes(n) {
  const { colors, tubes: numTubes, empty } = levelConfig(n);
  const capacity = CAPACITY;
  let seed = n * 1234567 + 42;

  for (let attempt = 0; attempt < 50; attempt++) {
    const rng = mulberry32(seed + attempt * 9999991);

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

    // Joker ball: ~15% chance from level 20+, extra ball in an empty tube
    const hasJoker = n >= 20 && rng() < 0.15;

    // Distribute into tubes
    const result = [];
    for (let t = 0; t < colors.length; t++) {
      result.push(pool.slice(t * capacity, (t + 1) * capacity));
    }
    // Add empty tubes (joker occupies one if present)
    if (hasJoker) {
      result.push(['joker']);
      for (let e = 1; e < empty; e++) result.push([]);
    } else {
      for (let e = 0; e < empty; e++) result.push([]);
    }

    // Verify solvability (skip for 2+ empty tubes — virtually always solvable)
    if (empty >= 2 || isSolvable(result) >= 0) return result;
  }

  // Fallback: shouldn't happen, but return last attempt anyway
  console.warn(`Level ${n}: no solvable layout found in 50 attempts`);
  const rng = mulberry32(seed);
  const pool = [];
  for (const c of colors) {
    for (let i = 0; i < capacity; i++) pool.push(c);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const result = [];
  for (let t = 0; t < colors.length; t++) {
    result.push(pool.slice(t * capacity, (t + 1) * capacity));
  }
  for (let e = 0; e < empty; e++) result.push([]);
  return result;
}

export function generateTutorialTubes() {
  return TUTORIAL_TUBES.map(t => [...t]);
}

/**
 * Generate tubes for daily mission with optional config override.
 * @param {object|null} override - { colors: string[], tubes: number, empty: number } or null
 */
export function generateDailyTubes(override) {
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  const cfg = override || (() => {
    const n = dailyLevelNum();
    const lc = levelConfig(n);
    return { colors: lc.colors, tubes: lc.tubes, empty: lc.empty };
  })();

  let seed = daySeed * 1234567 + 42;

  for (let attempt = 0; attempt < 50; attempt++) {
    const rng = mulberry32(seed + attempt * 9999991);
    const pool = [];
    for (const c of cfg.colors) {
      for (let i = 0; i < CAPACITY; i++) pool.push(c);
    }
    const rounds = 6;
    for (let r = 0; r < rounds; r++) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    const result = [];
    for (let t = 0; t < cfg.colors.length; t++) {
      result.push(pool.slice(t * CAPACITY, (t + 1) * CAPACITY));
    }
    for (let e = 0; e < cfg.empty; e++) result.push([]);
    if (cfg.empty >= 2 || isSolvable(result) >= 0) return result;
  }

  // Fallback
  const rng = mulberry32(seed);
  const pool = [];
  for (const c of cfg.colors) {
    for (let i = 0; i < CAPACITY; i++) pool.push(c);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const result = [];
  for (let t = 0; t < cfg.colors.length; t++) {
    result.push(pool.slice(t * CAPACITY, (t + 1) * CAPACITY));
  }
  for (let e = 0; e < cfg.empty; e++) result.push([]);
  return result;
}

// ── Smart hint solver (A* with heuristic) ────────────────────────────────

function hintHeuristic(tubes) {
  // Lower = closer to solved
  let h = 0;
  const colorLocations = {};  // color → set of tube indices

  for (let i = 0; i < tubes.length; i++) {
    const t = tubes[i];
    if (t.length === 0) continue;

    // Count completed tubes as big bonus (negative penalty)
    if (t.length === CAPACITY && t.every(c => c === t[0])) {
      h -= 10;
      continue;
    }

    // Count distinct colors in this tube (fragmentation penalty)
    const seen = new Set(t);
    h += (seen.size - 1) * 3;

    // Reward consecutive same-color runs from bottom
    let run = 1;
    for (let j = 1; j < t.length; j++) {
      if (t[j] === t[0]) run++; else break;
    }
    h -= run;

    // Track color locations for spread penalty
    for (const c of t) {
      if (!colorLocations[c]) colorLocations[c] = new Set();
      colorLocations[c].add(i);
    }
  }

  // Penalize colors spread across many tubes
  for (const c in colorLocations) {
    h += (colorLocations[c].size - 1) * 2;
  }

  return h;
}

function generateSmartMoves(state) {
  const n = state.length;
  const moves = [];

  for (let from = 0; from < n; from++) {
    const src = state[from];
    if (src.length === 0) continue;

    // Skip moving from an already-complete tube
    if (src.length === CAPACITY && src.every(c => c === src[0])) continue;

    const topColor = src[src.length - 1];

    for (let to = 0; to < n; to++) {
      if (!canMove(state, from, to)) continue;
      const dst = state[to];

      // Priority scoring for move ordering (lower = tried first)
      let priority = 0;

      if (dst.length > 0) {
        // Would this complete a tube?
        if (dst.length + 1 === CAPACITY && dst.every(c => c === topColor)) {
          priority = -100;  // best: completing a tube
        } else {
          priority = -countTopRun(dst);  // prefer stacking on longer same-color runs
        }
      } else {
        // Moving to empty tube — necessary but low priority
        priority = 10;
        // Extra penalty if source is already pure (pointless shuffle)
        if (src.every(c => c === src[0])) priority = 50;
      }

      moves.push({ from, to, priority });
    }
  }

  // Sort: lower priority = better move
  moves.sort((a, b) => a.priority - b.priority);
  return moves;
}

function countTopRun(tube) {
  if (tube.length === 0) return 0;
  const top = tube[tube.length - 1];
  let run = 1;
  for (let j = tube.length - 2; j >= 0; j--) {
    if (tube[j] === top) run++; else break;
  }
  return run;
}

export function solveHint(tubes, jokerUsed = true) {
  // If joker hasn't been committed yet, pre-remove surplus ball for each
  // possible color match and return the best hint found.
  if (!jokerUsed) {
    const jti = findJokerTube(tubes);
    if (jti !== -1) {
      const colors = new Set();
      for (const t of tubes) for (const c of t) if (c !== 'joker') colors.add(c);
      let bestHint = null;
      for (const color of colors) {
        const copy = tubes.map(t => [...t]);
        // Simulate: move joker next to this color, then remove surplus
        // Just pre-remove one ball of this color
        let removed = false;
        for (let ti = 0; ti < copy.length; ti++) {
          const t = copy[ti];
          if (t.length > 0 && t[t.length - 1] === color) {
            t.pop(); removed = true; break;
          }
        }
        if (!removed) {
          for (let ti = 0; ti < copy.length; ti++) {
            const idx = copy[ti].lastIndexOf(color);
            if (idx !== -1) { copy[ti].splice(idx, 1); removed = true; break; }
          }
        }
        if (removed) {
          const hint = solveHint(copy, true);
          if (hint) { bestHint = hint; break; }
        }
      }
      return bestHint;
    }
  }

  function serialize(ts) { return ts.map(t => t.join(',')).join('|'); }
  function cloneTs(ts)    { return ts.map(t => [...t]); }

  if (checkWinState(tubes)) return null;

  const LIMIT = 50000;
  const visited = new Set([serialize(tubes)]);

  // A* open list sorted by f = g + h
  const startH = hintHeuristic(tubes);
  let open = [{ state: tubes, moves: [], g: 0, f: startH }];

  while (open.length > 0 && visited.size < LIMIT) {
    // Pick node with lowest f
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const node = open[bestIdx];
    open[bestIdx] = open[open.length - 1];
    open.pop();

    const smartMoves = generateSmartMoves(node.state);

    for (const { from, to } of smartMoves) {
      const next = cloneTs(node.state);
      // Move the top ball
      next[to].push(next[from].pop());

      const key = serialize(next);
      if (visited.has(key)) continue;
      visited.add(key);

      const newMoves = [...node.moves, { from, to }];
      if (checkWinState(next)) return newMoves[0];

      const g = newMoves.length;
      const h = hintHeuristic(next);
      open.push({ state: next, moves: newMoves, g, f: g + h });
    }
  }

  return null;
}

// ── Seeded RNG for ice positions ─────────────────────────────────────────
function mulberry32Ice(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getIcePositions(n, tubes) {
  if (n < 30) return [];
  const rng = mulberry32Ice(n * 1234567 + 42);
  if (rng() >= 0.20) return [];
  const positions = [];
  const iceCount = 1 + (rng() < 0.3 ? 1 : 0);
  const candidates = [];
  for (let t = 0; t < tubes.length; t++) {
    if (tubes[t].length >= 2) candidates.push(t);
  }
  for (let ic = 0; ic < iceCount && candidates.length > 0; ic++) {
    const ti = Math.floor(rng() * candidates.length);
    positions.push(candidates.splice(ti, 1)[0]);
  }
  return positions;
}

// ── Daily level number ────────────────────────────────────────────────────
export function dailyLevelNum() {
  const epoch = new Date('2025-01-01').getTime();
  const day   = Math.floor((Date.now() - epoch) / 86400000);
  return (day % 200) + 1;
}
