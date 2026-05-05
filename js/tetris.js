'use strict';

import { COLOR_KEYS } from './constants.js';
import { levelConfig, isDogLevel } from './engine.js';

// ── Tetris level detection ───────────────────────────────────────────────

export function isTetrisLevel(n) {
  return n >= 5 && n % 5 === 0 && !(n >= 8 && n % 8 === 0) && !isDogLevel(n);
}

// ── Tetris state ─────────────────────────────────────────────────────────

export const TETRIS = {
  active:     false,
  queue:      [],       // remaining ball colors to drop
  current:    null,     // color of the ball currently falling
  column:     0,        // which tube column the ball is over (player moves this)
  dropStart:  0,        // timestamp when current ball started falling
  dropSpeed:  120,      // pixels per second (Y velocity)
  placed:     0,        // total balls placed
  total:      0,        // total balls to place
  numTubes:   0,        // number of tubes (no empty tubes in tetris)
  landing:    null,     // { tube, startTime } — brief landing animation
};

// ── Seeded RNG ───────────────────────────────────────────────────────────

function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Start a tetris round ─────────────────────────────────────────────────

export function startTetris(levelNum) {
  const cfg = levelConfig(levelNum);
  const numColors = cfg.colors.length;
  const capacity = 4;

  // Build ball queue: each color × capacity, shuffled
  const pool = [];
  for (let c = 0; c < numColors; c++) {
    for (let i = 0; i < capacity; i++) {
      pool.push(cfg.colors[c]);
    }
  }

  // Shuffle
  const rng = mulberry32(levelNum * 7654321 + 99);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  TETRIS.active   = true;
  TETRIS.current  = pool.shift();
  TETRIS.queue    = pool;
  TETRIS.column   = Math.floor(rng() * numColors); // random start column
  TETRIS.dropStart = performance.now();
  TETRIS.dropSpeed = 100 + numColors * 10; // faster with more tubes
  TETRIS.placed   = 0;
  TETRIS.total    = numColors * capacity;
  TETRIS.numTubes = numColors;
  TETRIS.landing  = null;
}

// ── Move ball to a different column ──────────────────────────────────────

export function tetrisMoveTo(tubeIdx) {
  if (tubeIdx >= 0 && tubeIdx < TETRIS.numTubes) {
    TETRIS.column = tubeIdx;
  }
}

// ── Spawn next ball ──────────────────────────────────────────────────────

export function tetrisNextBall() {
  if (TETRIS.queue.length === 0) {
    TETRIS.current = null;
    return;
  }
  TETRIS.current   = TETRIS.queue.shift();
  TETRIS.column    = Math.floor(Math.random() * TETRIS.numTubes);
  TETRIS.dropStart = performance.now();
  TETRIS.landing   = null;
  // Gradually speed up
  TETRIS.dropSpeed += 3;
}

// ── Get current ball Y position (0 = top, 1 = landed) ───────────────────

export function tetrisBallProgress(ts) {
  const elapsed = ts - TETRIS.dropStart;
  // Fall takes about 2 seconds base, adjusted by speed
  const fallDuration = 2500 * (120 / TETRIS.dropSpeed);
  return Math.min(elapsed / fallDuration, 1);
}

// ── End tetris mode ──────────────────────────────────────────────────────

export function endTetris() {
  TETRIS.active   = false;
  TETRIS.current  = null;
  TETRIS.queue    = [];
  TETRIS.placed   = 0;
  TETRIS.total    = 0;
  TETRIS.landing  = null;
}

// ── Check if placement is valid ──────────────────────────────────────────

export function canPlaceTetris(tubes, tubeIdx, color) {
  const tube = tubes[tubeIdx];
  if (tube.length >= 4) return false;
  if (tube.length === 0) return true;
  return tube[tube.length - 1] === color;
}

// ── Check if all tubes are full (win) ────────────────────────────────────

export function isTetrisWon(tubes, numTubes) {
  for (let i = 0; i < numTubes; i++) {
    if (tubes[i].length < 4) return false;
  }
  return true;
}
