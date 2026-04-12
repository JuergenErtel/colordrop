'use strict';

import { mouseConfig, tierForLevel } from './engine.js';
import { playSound } from './audio.js';

// ── Mouse level state ───────────────────────────────────────────────────

export const MOUSE = {
  active:       false,
  holes:        [],       // 9 entries: null | { type, spawnTime, duration, caught }
  caught:       0,
  escaped:      0,
  target:       0,
  totalSpawned: 0,
  bonusBones:   0,
  spawnTimer:   0,
  cfg:          null,     // mouseConfig result
  pawAnim:      null,     // { hole, startTime }
  trapFlash:    null,     // { hole, startTime }
};

// ── Hole layout (3x3 grid positions, in canvas coordinates) ─────────────

const HOLE_COLS = 3;
const HOLE_ROWS = 3;

export function holePositions(cw, ch) {
  const positions = [];
  const gridW = cw * 0.7;
  const gridH = ch * 0.38;
  const offsetX = (cw - gridW) / 2;
  const offsetY = ch * 0.35;
  const cellW = gridW / HOLE_COLS;
  const cellH = gridH / HOLE_ROWS;
  for (let r = 0; r < HOLE_ROWS; r++) {
    for (let c = 0; c < HOLE_COLS; c++) {
      positions.push({
        x: offsetX + cellW * (c + 0.5),
        y: offsetY + cellH * (r + 0.5),
      });
    }
  }
  return positions;
}

// ── Start / End ─────────────────────────────────────────────────────────

export function startMouse(levelNum) {
  const cfg = mouseConfig(levelNum);
  MOUSE.active       = true;
  MOUSE.holes        = Array.from({ length: 9 }, () => null);
  MOUSE.caught       = 0;
  MOUSE.escaped      = 0;
  MOUSE.target       = cfg.target;
  MOUSE.totalSpawned = 0;
  MOUSE.bonusBones   = 0;
  MOUSE.spawnTimer   = performance.now() + 800; // first spawn after 0.8s
  MOUSE.cfg          = cfg;
  MOUSE.pawAnim      = null;
  MOUSE.trapFlash    = null;
}

export function endMouse() {
  MOUSE.active = false;
  MOUSE.holes  = [];
}

// ── Mouse types ─────────────────────────────────────────────────────────

function pickMouseType(cfg) {
  const r = Math.random();
  // Trap chance: ~15-25% depending on tier
  const trapChance = 0.15;
  if (r < trapChance) return 'hedgehog';

  const remaining = 1 - trapChance;
  let threshold = trapChance;

  if (cfg.hasGold && Math.random() < 0.08) return 'golden';
  if (cfg.hasFat && Math.random() < 0.12) return 'fat';
  if (cfg.hasFast && Math.random() < 0.2) return 'fast';
  return 'normal';
}

function visibilityForType(type, baseVisibility) {
  switch (type) {
    case 'fast':     return baseVisibility * 0.5;
    case 'fat':      return baseVisibility * 1.5;
    case 'hedgehog': return baseVisibility * 1.0;
    case 'golden':   return baseVisibility * 1.0;
    default:         return baseVisibility;
  }
}

// ── Update (called every frame) ─────────────────────────────────────────

export function updateMouse(ts) {
  if (!MOUSE.active) return null;
  const cfg = MOUSE.cfg;

  // Check for expired mice (escaped or trap disappeared)
  for (let i = 0; i < 9; i++) {
    const h = MOUSE.holes[i];
    if (!h || h.caught) continue;
    if (ts >= h.spawnTime + h.duration) {
      if (h.type !== 'hedgehog') {
        MOUSE.escaped++;
      }
      MOUSE.holes[i] = null;
    }
  }

  // Spawn new mice
  if (ts >= MOUSE.spawnTimer) {
    const activeCount = MOUSE.holes.filter(h => h !== null).length;
    const trapCount = MOUSE.holes.filter(h => h && h.type === 'hedgehog').length;

    if (activeCount < cfg.maxActive) {
      // Find empty holes
      const empty = [];
      for (let i = 0; i < 9; i++) {
        if (!MOUSE.holes[i]) empty.push(i);
      }
      if (empty.length > 0) {
        const hole = empty[Math.floor(Math.random() * empty.length)];
        let type = pickMouseType(cfg);

        // Enforce trap limit
        if (type === 'hedgehog' && trapCount >= cfg.traps) {
          type = 'normal';
        }

        const duration = visibilityForType(type, cfg.visibility);
        MOUSE.holes[hole] = { type, spawnTime: ts, duration, caught: false };
        if (type !== 'hedgehog') MOUSE.totalSpawned++;
      }
    }

    MOUSE.spawnTimer = ts + cfg.spawnInterval * (0.7 + Math.random() * 0.6);
  }

  // Check win: all mice caught (perfect)
  // Game continues until timer runs out — win/lose checked in main.js via timer

  return null;
}

// ── Hit detection ───────────────────────────────────────────────────────

export function tapHole(holeIdx, ts) {
  if (!MOUSE.active || holeIdx < 0 || holeIdx >= 9) return null;
  const h = MOUSE.holes[holeIdx];
  if (!h || h.caught) return null;

  if (h.type === 'hedgehog') {
    // Penalty: -3 seconds (handled by caller via timer)
    MOUSE.trapFlash = { hole: holeIdx, startTime: ts };
    MOUSE.holes[holeIdx] = null;
    playSound('hedgehog_hit');
    return { type: 'trap', penalty: 3000 };
  }

  // Catch the mouse!
  h.caught = true;
  MOUSE.pawAnim = { hole: holeIdx, startTime: ts };
  MOUSE.caught++;

  const points = h.type === 'fat' ? 2 : 1;
  let bonus = 0;
  if (h.type === 'golden') {
    bonus = 5;
    MOUSE.bonusBones += bonus;
    playSound('mouse_golden');
  } else {
    playSound('mouse_catch');
  }

  // Remove after brief catch animation
  setTimeout(() => {
    if (MOUSE.holes[holeIdx] === h) MOUSE.holes[holeIdx] = null;
  }, 300);

  return { type: 'catch', points, bonus, mouseType: h.type };
}

// ── Scoring ─────────────────────────────────────────────────────────────

export function mouseStars() {
  if (MOUSE.caught < MOUSE.target) return 0; // failed
  if (MOUSE.escaped === 0) return 3;          // perfect
  const ratio = MOUSE.caught / Math.max(1, MOUSE.totalSpawned);
  if (ratio >= 0.85) return 2;
  return 1;
}
