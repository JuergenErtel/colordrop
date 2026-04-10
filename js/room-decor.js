'use strict';

import { CW, CH, TUBE_BOT } from './constants.js';
import { FLOOR_Y, TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY, lerpHSL, themeCenter } from './background.js';
import { calculateRoomProgress } from './room.js';

// Wall items (drawn behind puzzle)
import { drawShelf, drawWallArt, drawWindow, drawChandelier } from './room-decor-wall.js';
// Floor items (drawn beside puzzle)
import { drawRug, drawCatBed, drawLamp, drawPlant, drawCatTree, drawFireplace } from './room-decor-floor.js';

// ── Positions (all relative to CW/CH) ──────────────────────────────────
export const DECOR_POS = {
  rug:        { cx: TABLE_CX, cy: TABLE_CY, rx: CW * 0.30, ry: CH * 0.09 },
  shelf:      { x: CW * 0.05, y: CH * 0.04, w: CW * 0.20, h: CH * 0.16 },
  catbed:     { x: CW * 0.70, y: FLOOR_Y - 26 },
  lamp:       { x: CW * 0.04, y: FLOOR_Y - 85 },
  plant:      { x: CW * 0.88, y: FLOOR_Y - 55 },
  wallart:    { x: CW * 0.30, y: CH * 0.06, w: 56, h: 44 },
  cattree:    { x: CW * 0.76, y: FLOOR_Y - 70 },
  window:     { x: CW * 0.72, y: CH * 0.05, w: 65, h: 72 },
  fireplace:  { x: CW * 0.14, y: FLOOR_Y - 55, w: 60 },
  chandelier: { cx: CW * 0.50, y: 0 },
};

// ── Draw function registry (Z-order groups) ────────────────────────────
// Each entry: [id, drawFn, needsTimestamp]
const DRAW_ORDER = [
  // Group 1: Under table
  ['rug',        drawRug,        false],
  // Group 2: Wall items (behind puzzle area)
  ['shelf',      drawShelf,      false],
  ['wallart',    drawWallArt,    false],
  ['window',     drawWindow,     false],
  ['chandelier', drawChandelier, true ],
  // Group 3: Floor items left
  ['lamp',       drawLamp,       false],
  ['fireplace',  drawFireplace,  true ],
  // Group 4: Floor items right
  ['catbed',     drawCatBed,     false],
  ['plant',      drawPlant,      true ],
  ['cattree',    drawCatTree,    false],
];

// ── Fade-in state ───────────────────────────────────────────────────────
let _prevUnlockedIds = new Set();
const _unlockTimes = new Map();     // id → timestamp of unlock
let _cachedProgress = null;
let _cacheLevel = -1;

function getProgress(currentLevel) {
  if (currentLevel !== _cacheLevel) {
    _cachedProgress = calculateRoomProgress();
    _cacheLevel = currentLevel;
  }
  return _cachedProgress;
}

// Call once when a new level is generated to bust the cache
export function invalidateRoomDecorCache() {
  _cacheLevel = -1;
}

// ── Main draw entry point ───────────────────────────────────────────────

/**
 * drawRoomDecor(ctx, ts, theme, prevTheme, fade, currentLevel)
 *
 * Called from render.js right after drawBackground().
 * Draws all unlocked décor items with theme tint and fade-in.
 */
export function drawRoomDecor(ctx, ts, theme, prevTheme, fade, currentLevel) {
  const progress = getProgress(currentLevel);

  // Build set of currently unlocked ids
  const unlockedIds = new Set(
    progress.items.filter(it => it.status === 'unlocked').map(it => it.id)
  );

  // Detect newly unlocked items → record unlock time for fade-in
  for (const id of unlockedIds) {
    if (!_prevUnlockedIds.has(id) && !_unlockTimes.has(id)) {
      _unlockTimes.set(id, ts);
    }
  }
  _prevUnlockedIds = unlockedIds;

  // Compute blended theme colour (same logic as drawBackground)
  const cur  = themeCenter(theme, ts);
  const prev = themeCenter(prevTheme, ts);
  const { h, s, b } = lerpHSL(prev.h, prev.s, prev.b, cur.h, cur.s, cur.b, fade);

  // Draw each unlocked item in Z-order
  for (const [id, drawFn, needsTs] of DRAW_ORDER) {
    if (!unlockedIds.has(id)) continue;

    // Compute fade-in alpha
    const unlockTime = _unlockTimes.get(id);
    let alpha = 1;
    if (unlockTime !== undefined) {
      alpha = Math.min((ts - unlockTime) / 1000, 1);
      if (alpha >= 1) _unlockTimes.delete(id); // done fading
    }

    const pos = DECOR_POS[id];

    ctx.save();
    if (alpha < 1) ctx.globalAlpha = alpha;

    if (needsTs) {
      drawFn(ctx, ts, h, s, b, pos);
    } else {
      drawFn(ctx, h, s, b, pos);
    }

    ctx.restore();
  }
}
