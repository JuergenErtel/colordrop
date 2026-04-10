# Progressive Room Decoration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Draw unlocked room décor items directly on the game canvas, so the café fills up visually as the player progresses.

**Architecture:** New module `room-decor.js` coordinates drawing. Two companion files (`room-decor-wall.js`, `room-decor-floor.js`) contain the actual Canvas draw functions for 10 items. `drawBackground()` in `background.js` exports its private `lerpHSL` helper. `render.js` calls `drawRoomDecor()` right after `drawBackground()`.

**Tech Stack:** Vanilla Canvas 2D API, ES modules, existing `lerpHSL` for theme tinting.

**Spec:** `docs/superpowers/specs/2026-04-10-progressive-room-decor-design.md`

---

## File Structure

| File | Role |
|------|------|
| `js/background.js` | **Modify:** export `lerpHSL` and `themeCenter`, export geometry constants `FLOOR_Y`, `TABLE_CX`, `TABLE_CY`, `TABLE_RX`, `TABLE_RY` |
| `js/room-decor.js` | **Create:** coordinator — positions, fade-in, calls draw functions in Z-order |
| `js/room-decor-wall.js` | **Create:** `drawShelf`, `drawWallArt`, `drawWindow`, `drawChandelier` |
| `js/room-decor-floor.js` | **Create:** `drawRug`, `drawCatBed`, `drawLamp`, `drawPlant`, `drawCatTree`, `drawFireplace` |
| `js/render.js` | **Modify:** import and call `drawRoomDecor` after `drawBackground` |

---

### Task 1: Export helpers from background.js

**Files:**
- Modify: `js/background.js:39-53` (lerpHSL, themeCenter — add `export`)
- Modify: `js/background.js:32-36` (geometry constants — add `export`)

- [ ] **Step 1: Export lerpHSL and themeCenter**

In `js/background.js`, change line 39 from:

```js
function lerpHSL(h0, s0, b0, h1, s1, b1, t) {
```

to:

```js
export function lerpHSL(h0, s0, b0, h1, s1, b1, t) {
```

And change line 48 from:

```js
function themeCenter(theme, ts) {
```

to:

```js
export function themeCenter(theme, ts) {
```

- [ ] **Step 2: Export geometry constants**

In `js/background.js`, change lines 32-36 from:

```js
const FLOOR_Y      = CH * 0.73;
const TABLE_CX     = CW * 0.5;
const TABLE_CY     = (TUBE_BOT + CH) / 2 + 8;
const TABLE_RX     = CW * 0.48;
const TABLE_RY     = CH * 0.10;
```

to:

```js
export const FLOOR_Y      = CH * 0.73;
export const TABLE_CX     = CW * 0.5;
export const TABLE_CY     = (TUBE_BOT + CH) / 2 + 8;
export const TABLE_RX     = CW * 0.48;
export const TABLE_RY     = CH * 0.10;
```

- [ ] **Step 3: Verify game still loads**

Run the game in browser, confirm background renders as before (no regressions from adding `export`).

- [ ] **Step 4: Commit**

```bash
git add js/background.js
git commit -m "refactor: export lerpHSL, themeCenter, geometry constants from background.js"
```

---

### Task 2: Create room-decor.js coordinator

**Files:**
- Create: `js/room-decor.js`

This file handles: positions, fade-in tracking, progress caching, Z-order dispatch.

- [ ] **Step 1: Create room-decor.js with full coordinator logic**

Create `js/room-decor.js`:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add js/room-decor.js
git commit -m "feat: add room-decor.js coordinator with positions, fade-in, Z-order dispatch"
```

---

### Task 3: Create room-decor-floor.js — Rug, CatBed, Lamp

**Files:**
- Create: `js/room-decor-floor.js`

Start with the first 3 floor items. More will be added in Tasks 4 and 5.

- [ ] **Step 1: Create room-decor-floor.js with drawRug**

Create `js/room-decor-floor.js`:

```js
'use strict';

import { lerpHSL } from './background.js';

// ── Theme tint helper ───────────────────────────────────────────────────
// Blends a base hue toward the scene theme by `amount` (0-1)
function tint(baseH, baseS, baseB, themeH, themeS, themeB, amount) {
  return lerpHSL(baseH, baseS, baseB, themeH, themeS, themeB, amount);
}

// ══════════════════════════════════════════════════════════════════════════
//  RUG — Oval oriental rug under table
// ══════════════════════════════════════════════════════════════════════════

export function drawRug(ctx, h, s, b, pos) {
  const { cx, cy, rx, ry } = pos;

  // Base colours with theme tint
  const rug  = tint(0, 40, 45, h, s, b, 0.15);   // deep red
  const gold = tint(40, 55, 65, h, s, b, 0.12);   // gold accents

  ctx.save();

  // Main rug body — filled ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  const rugGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  rugGrad.addColorStop(0.0, `hsla(${rug.h}, ${rug.s}%, ${rug.b}%, 0.35)`);
  rugGrad.addColorStop(0.5, `hsla(${rug.h}, ${rug.s}%, ${rug.b - 5}%, 0.25)`);
  rugGrad.addColorStop(0.8, `hsla(${rug.h}, ${rug.s - 5}%, ${rug.b - 10}%, 0.15)`);
  rugGrad.addColorStop(1.0, `hsla(${rug.h}, ${rug.s - 8}%, ${rug.b - 15}%, 0.0)`);
  ctx.fillStyle = rugGrad;
  ctx.fill();

  // Outer border ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.85, ry * 0.85, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.22)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner border ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.18)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center medallion
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.35, ry * 0.35, 0, 0, Math.PI * 2);
  const medGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.35);
  medGrad.addColorStop(0.0, `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.18)`);
  medGrad.addColorStop(1.0, `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.0)`);
  ctx.fillStyle = medGrad;
  ctx.fill();
  ctx.strokeStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.14)`;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Diamond motifs at 4 compass points (between the two border rings)
  const midR = rx * 0.75;
  const midRy = ry * 0.75;
  const dSize = 4;
  const diamonds = [
    [cx, cy - midRy],       // top
    [cx, cy + midRy],       // bottom
    [cx - midR, cy],        // left
    [cx + midR, cy],        // right
  ];
  for (const [dx, dy] of diamonds) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b}%, 0.18)`;
    ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
    ctx.restore();
  }

  // Fringe at top and bottom
  ctx.globalAlpha = 0.2;
  const fringeW = rx * 0.5;
  for (let fx = cx - fringeW; fx < cx + fringeW; fx += 4) {
    ctx.fillStyle = `hsl(${rug.h}, ${rug.s}%, ${rug.b}%)`;
    ctx.fillRect(fx, cy - ry - 3, 1.5, 4);
    ctx.fillRect(fx, cy + ry - 1, 1.5, 4);
  }
  ctx.globalAlpha = 1;

  // Subtle wear highlight
  const wearGrad = ctx.createRadialGradient(cx + rx * 0.1, cy - ry * 0.1, 0, cx, cy, rx * 0.5);
  wearGrad.addColorStop(0.0, 'rgba(255,240,200,0.05)');
  wearGrad.addColorStop(1.0, 'rgba(255,240,200,0)');
  ctx.fillStyle = wearGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  CAT BED — Wicker basket with sleeping cat
// ══════════════════════════════════════════════════════════════════════════

export function drawCatBed(ctx, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;
  const w = 48;
  const bh = 26;

  const wicker = tint(30, 35, 55, h, s, b, 0.15);
  const cushion = tint(35, 20, 78, h, s, b, 0.12);
  const cat = tint(32, 40, 68, h, s, b, 0.10);

  ctx.save();

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + bh + 2, w * 0.5, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  // Basket back
  ctx.beginPath();
  const bx = x, by = y;
  ctx.moveTo(bx + 4, by + bh);
  ctx.quadraticCurveTo(bx - 2, by + bh * 0.3, bx + 6, by);
  ctx.lineTo(bx + w - 6, by);
  ctx.quadraticCurveTo(bx + w + 2, by + bh * 0.3, bx + w - 4, by + bh);
  ctx.closePath();
  ctx.fillStyle = `hsl(${wicker.h}, ${wicker.s}%, ${wicker.b}%)`;
  ctx.fill();

  // Woven texture — horizontal
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.2;
  for (let wy = by + 3; wy < by + bh; wy += 5) {
    ctx.beginPath();
    ctx.moveTo(bx, wy);
    ctx.lineTo(bx + w, wy);
    ctx.strokeStyle = `hsl(${wicker.h}, ${wicker.s + 5}%, ${wicker.b - 10}%)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Woven texture — vertical
  for (let wx = bx + 4; wx < bx + w; wx += 7) {
    ctx.beginPath();
    ctx.moveTo(wx, by);
    ctx.lineTo(wx, by + bh);
    ctx.strokeStyle = `hsl(${wicker.h}, ${wicker.s + 3}%, ${wicker.b - 8}%)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();

  // Cushion
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + bh * 0.45, w * 0.38, bh * 0.32, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${cushion.h}, ${cushion.s}%, ${cushion.b}%, 0.5)`;
  ctx.fill();
  // Cushion stitch
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y + bh * 0.45);
  ctx.lineTo(x + w * 0.7, y + bh * 0.45);
  ctx.strokeStyle = `hsla(${cushion.h}, ${cushion.s}%, ${cushion.b - 10}%, 0.25)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Sleeping cat — curled body
  const catCx = x + w / 2;
  const catCy = y + bh * 0.4;
  ctx.beginPath();
  ctx.ellipse(catCx, catCy + 2, 18, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.fill();

  // Stripes on body
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(catCx, catCy + 2, 18, 9, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.2;
  for (let si = -12; si < 14; si += 5) {
    ctx.beginPath();
    ctx.moveTo(catCx + si, catCy - 8);
    ctx.lineTo(catCx + si + 6, catCy + 12);
    ctx.strokeStyle = `hsl(${cat.h}, ${cat.s + 5}%, ${cat.b - 15}%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();

  // Cat head
  const headX = catCx - 10;
  const headY = catCy - 3;
  ctx.beginPath();
  ctx.ellipse(headX, headY, 8, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b + 2}%)`;
  ctx.fill();

  // Ears
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.beginPath();
  ctx.moveTo(headX - 6, headY - 3);
  ctx.lineTo(headX - 3, headY - 9);
  ctx.lineTo(headX, headY - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + 6, headY - 3);
  ctx.lineTo(headX + 3, headY - 9);
  ctx.lineTo(headX, headY - 3);
  ctx.fill();

  // Inner ears (pink)
  ctx.fillStyle = `hsla(350, 30%, 65%, 0.4)`;
  ctx.beginPath();
  ctx.moveTo(headX - 5, headY - 3);
  ctx.lineTo(headX - 3, headY - 7);
  ctx.lineTo(headX - 1, headY - 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headX + 5, headY - 3);
  ctx.lineTo(headX + 3, headY - 7);
  ctx.lineTo(headX + 1, headY - 3);
  ctx.fill();

  // Closed eyes
  ctx.strokeStyle = `hsla(${cat.h}, ${cat.s}%, ${cat.b - 30}%, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(headX - 3, headY, 2.5, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headX + 3, headY, 2.5, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Nose
  ctx.fillStyle = 'hsla(350, 35%, 65%, 0.6)';
  ctx.beginPath();
  ctx.ellipse(headX, headY + 3, 1.8, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.beginPath();
  ctx.moveTo(catCx + 14, catCy + 4);
  ctx.quadraticCurveTo(catCx + 22, catCy, catCx + 20, catCy - 4);
  ctx.strokeStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Paw peeking out
  ctx.beginPath();
  ctx.ellipse(catCx + 2, catCy + 10, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b + 3}%)`;
  ctx.fill();

  // Front rim (3D lip)
  ctx.beginPath();
  ctx.moveTo(bx + 2, by + bh - 2);
  ctx.quadraticCurveTo(bx + w / 2, by + bh + 4, bx + w - 2, by + bh - 2);
  ctx.strokeStyle = `hsl(${wicker.h}, ${wicker.s + 2}%, ${wicker.b + 5}%)`;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  LAMP — Standing floor lamp with fabric shade
// ══════════════════════════════════════════════════════════════════════════

export function drawLamp(ctx, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;

  const shade  = tint(40, 25, 82, h, s, b, 0.15);
  const brass  = tint(42, 50, 62, h, s, b, 0.12);

  ctx.save();

  // Light cone on wall (behind lamp)
  const wallGlow = ctx.createRadialGradient(x + 14, y - 10, 0, x + 14, y - 10, 60);
  wallGlow.addColorStop(0.0, 'rgba(255,220,130,0.10)');
  wallGlow.addColorStop(1.0, 'rgba(255,220,130,0)');
  ctx.fillStyle = wallGlow;
  ctx.fillRect(x - 30, y - 50, 90, 70);

  // Shade (trapezoid)
  const shadeW1 = 20; // top width
  const shadeW2 = 30; // bottom width
  const shadeH = 20;
  const shadeCx = x + 14;
  const shadeTop = y;
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW1 / 2, shadeTop);
  ctx.lineTo(shadeCx + shadeW1 / 2, shadeTop);
  ctx.lineTo(shadeCx + shadeW2 / 2, shadeTop + shadeH);
  ctx.lineTo(shadeCx - shadeW2 / 2, shadeTop + shadeH);
  ctx.closePath();
  ctx.fillStyle = `hsl(${shade.h}, ${shade.s}%, ${shade.b}%)`;
  ctx.fill();

  // Fabric texture on shade
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.12;
  for (let fx = shadeCx - shadeW2 / 2; fx < shadeCx + shadeW2 / 2; fx += 4) {
    ctx.beginPath();
    ctx.moveTo(fx, shadeTop);
    ctx.lineTo(fx, shadeTop + shadeH);
    ctx.strokeStyle = `hsl(${shade.h}, ${shade.s}%, ${shade.b - 12}%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();

  // Seam
  ctx.beginPath();
  ctx.moveTo(shadeCx, shadeTop);
  ctx.lineTo(shadeCx, shadeTop + shadeH);
  ctx.strokeStyle = `hsla(${shade.h}, ${shade.s}%, ${shade.b - 8}%, 0.15)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Inner glow at bottom of shade
  const innerGlow = ctx.createLinearGradient(shadeCx, shadeTop + shadeH * 0.4, shadeCx, shadeTop + shadeH);
  innerGlow.addColorStop(0.0, 'rgba(255,240,180,0.1)');
  innerGlow.addColorStop(1.0, 'rgba(255,225,140,0.35)');
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW1 / 2 + 4, shadeTop + shadeH * 0.4);
  ctx.lineTo(shadeCx + shadeW1 / 2 - 4, shadeTop + shadeH * 0.4);
  ctx.lineTo(shadeCx + shadeW2 / 2 - 2, shadeTop + shadeH);
  ctx.lineTo(shadeCx - shadeW2 / 2 + 2, shadeTop + shadeH);
  ctx.closePath();
  ctx.fillStyle = innerGlow;
  ctx.fill();

  // Top/bottom rings
  ctx.strokeStyle = `hsla(${brass.h}, ${brass.s}%, ${brass.b}%, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW1 / 2, shadeTop);
  ctx.lineTo(shadeCx + shadeW1 / 2, shadeTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(shadeCx - shadeW2 / 2, shadeTop + shadeH);
  ctx.lineTo(shadeCx + shadeW2 / 2, shadeTop + shadeH);
  ctx.stroke();

  // Bulb glow
  ctx.beginPath();
  ctx.arc(shadeCx, shadeTop + shadeH + 3, 4, 0, Math.PI * 2);
  const bulbGrad = ctx.createRadialGradient(shadeCx, shadeTop + shadeH + 3, 0, shadeCx, shadeTop + shadeH + 3, 5);
  bulbGrad.addColorStop(0.0, 'rgba(255,240,180,0.7)');
  bulbGrad.addColorStop(1.0, 'rgba(255,220,120,0)');
  ctx.fillStyle = bulbGrad;
  ctx.fill();

  // Pole
  const poleTop = shadeTop + shadeH + 5;
  const poleBot = y + 80;
  ctx.beginPath();
  ctx.moveTo(shadeCx, poleTop);
  ctx.lineTo(shadeCx, poleBot);
  const poleGrad = ctx.createLinearGradient(shadeCx - 2, 0, shadeCx + 2, 0);
  poleGrad.addColorStop(0.0, `hsl(${brass.h}, ${brass.s}%, ${brass.b - 8}%)`);
  poleGrad.addColorStop(0.5, `hsl(${brass.h}, ${brass.s}%, ${brass.b + 5}%)`);
  poleGrad.addColorStop(1.0, `hsl(${brass.h}, ${brass.s}%, ${brass.b - 8}%)`);
  ctx.strokeStyle = poleGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pole accent rings
  for (const ry of [poleTop + 15, poleTop + 45]) {
    ctx.beginPath();
    ctx.moveTo(shadeCx - 3, ry);
    ctx.lineTo(shadeCx + 3, ry);
    ctx.strokeStyle = `hsla(${brass.h}, ${brass.s}%, ${brass.b + 8}%, 0.4)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Base
  ctx.beginPath();
  ctx.ellipse(shadeCx, poleBot + 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b - 4}%)`;
  ctx.fill();

  // Floor light pool
  const floorGlow = ctx.createRadialGradient(shadeCx, poleBot + 8, 0, shadeCx, poleBot + 8, 30);
  floorGlow.addColorStop(0.0, 'rgba(255,220,120,0.12)');
  floorGlow.addColorStop(1.0, 'rgba(255,220,120,0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(shadeCx, poleBot + 8, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Placeholder exports — will be implemented in Tasks 4 and 5
export function drawPlant(ctx, ts, h, s, b, pos) {}
export function drawCatTree(ctx, h, s, b, pos) {}
export function drawFireplace(ctx, ts, h, s, b, pos) {}
```

- [ ] **Step 2: Commit**

```bash
git add js/room-decor-floor.js
git commit -m "feat: add room-decor-floor.js with drawRug, drawCatBed, drawLamp"
```

---

### Task 4: Create room-decor-wall.js — Shelf, WallArt, Window, Chandelier

**Files:**
- Create: `js/room-decor-wall.js`

- [ ] **Step 1: Create room-decor-wall.js with all 4 wall items**

Create `js/room-decor-wall.js`:

```js
'use strict';

import { lerpHSL } from './background.js';

function tint(baseH, baseS, baseB, themeH, themeS, themeB, amount) {
  return lerpHSL(baseH, baseS, baseB, themeH, themeS, themeB, amount);
}

// ══════════════════════════════════════════════════════════════════════════
//  SHELF — Bookshelf with books, cat figurine, mug, yarn
// ══════════════════════════════════════════════════════════════════════════

export function drawShelf(ctx, h, s, b, pos) {
  const { x, y, w: sw } = pos;
  const sh = pos.h;
  const wood = tint(25, 40, 42, h, s, b, 0.15);

  ctx.save();

  // Shadow behind shelf
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + 3, y + 3, sw, sh);

  // Back panel
  ctx.fillStyle = `hsl(${wood.h}, ${wood.s}%, ${wood.b}%)`;
  ctx.fillRect(x, y, sw, sh);

  // Wood grain
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let gy = y + 4; gy < y + sh; gy += 8) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + sw, gy);
    ctx.strokeStyle = `hsl(${wood.h}, ${wood.s}%, ${wood.b - 12}%)`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();

  // 4 shelves
  const shelfPositions = [0, 0.27, 0.54, 0.81];
  for (const frac of shelfPositions) {
    const sy = y + sh * frac;
    ctx.fillStyle = `hsl(${wood.h}, ${wood.s + 4}%, ${wood.b + 10}%)`;
    ctx.fillRect(x - 2, sy, sw + 4, 3);
    // Shelf shadow
    ctx.fillStyle = `hsla(${wood.h}, ${wood.s}%, ${wood.b - 15}%, 0.15)`;
    ctx.fillRect(x, sy + 3, sw, 2);
  }

  // Books on shelves — procedural generation
  const bookColors = [
    [0, 45, 50],    // red
    [220, 45, 50],  // blue
    [120, 40, 48],  // green
    [45, 50, 60],   // yellow
    [280, 35, 48],  // purple
    [25, 45, 45],   // brown
    [200, 40, 55],  // cyan
    [340, 40, 52],  // pink
  ];

  const shelfTops = shelfPositions.map(f => y + sh * f + 5);

  // Row 1 — full of books
  let bx = x + 3;
  for (let i = 0; i < 8 && bx < x + sw - 5; i++) {
    const bw = 5 + (i * 7 % 5);
    const bHeight = 14 + (i * 11 % 8);
    const [bh, bs, bb] = bookColors[i % bookColors.length];
    const tc = tint(bh, bs, bb, h, s, b, 0.1);
    const by2 = shelfTops[0] + (sh * 0.27 - 5) - bHeight;
    ctx.fillStyle = `hsl(${tc.h}, ${tc.s}%, ${tc.b}%)`;
    ctx.fillRect(bx, by2, bw, bHeight);
    // Title line
    if (bw > 6) {
      ctx.fillStyle = `hsla(${tc.h}, ${tc.s}%, ${tc.b + 20}%, 0.25)`;
      ctx.fillRect(bx + 1, by2 + 3, bw - 2, 0.8);
    }
    bx += bw + 1.5;
  }

  // Row 2 — books + cat figurine
  bx = x + 3;
  for (let i = 0; i < 5 && bx < x + sw - 20; i++) {
    const bw = 5 + ((i + 3) * 7 % 5);
    const bHeight = 12 + ((i + 3) * 11 % 7);
    const [bh2, bs2, bb2] = bookColors[(i + 3) % bookColors.length];
    const tc = tint(bh2, bs2, bb2, h, s, b, 0.1);
    const by2 = shelfTops[1] + (sh * 0.27 - 5) - bHeight;
    ctx.fillStyle = `hsl(${tc.h}, ${tc.s}%, ${tc.b}%)`;
    ctx.fillRect(bx, by2, bw, bHeight);
    bx += bw + 1.5;
  }
  // Cat figurine
  const figX = bx + 4;
  const figY = shelfTops[1] + (sh * 0.27 - 5) - 12;
  ctx.beginPath();
  ctx.ellipse(figX + 5, figY + 5, 5, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(35, 40%, 68%, 0.7)`;
  ctx.fill();
  // Figurine ears
  ctx.fillStyle = `hsla(35, 40%, 65%, 0.6)`;
  ctx.beginPath();
  ctx.moveTo(figX + 1, figY + 3);
  ctx.lineTo(figX + 3, figY - 1);
  ctx.lineTo(figX + 5, figY + 3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(figX + 5, figY + 3);
  ctx.lineTo(figX + 7, figY - 1);
  ctx.lineTo(figX + 9, figY + 3);
  ctx.fill();

  // Row 3 — yarn ball + mug + few books
  bx = x + 3;
  // Yarn ball
  ctx.beginPath();
  ctx.arc(bx + 6, shelfTops[2] + (sh * 0.27 - 5) - 7, 6, 0, Math.PI * 2);
  const yarnC = tint(340, 45, 65, h, s, b, 0.15);
  ctx.fillStyle = `hsl(${yarnC.h}, ${yarnC.s}%, ${yarnC.b}%)`;
  ctx.fill();
  // Yarn texture
  ctx.beginPath();
  ctx.arc(bx + 6, shelfTops[2] + (sh * 0.27 - 5) - 7, 4, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${yarnC.h}, ${yarnC.s}%, ${yarnC.b + 12}%, 0.25)`;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Mug
  const mugX = bx + 18;
  const mugY = shelfTops[2] + (sh * 0.27 - 5) - 12;
  ctx.fillStyle = 'hsla(30, 10%, 88%, 0.7)';
  ctx.fillRect(mugX, mugY, 8, 12);
  // Mug handle
  ctx.beginPath();
  ctx.arc(mugX + 8, mugY + 6, 3.5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.strokeStyle = 'hsla(30, 10%, 85%, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Row 4 — sparse (small photo frame, mini plant)
  const frameX = x + 5;
  const frameY = shelfTops[3] + 3;
  ctx.strokeStyle = `hsla(${wood.h}, ${wood.s}%, ${wood.b + 15}%, 0.5)`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX, frameY, 10, 13);
  ctx.fillStyle = 'hsla(30, 15%, 80%, 0.15)';
  ctx.fillRect(frameX + 1.5, frameY + 1.5, 7, 10);

  // Mini plant
  const mpX = x + 22;
  const mpY = shelfTops[3] + 2;
  ctx.fillStyle = 'hsla(120, 40%, 45%, 0.6)';
  ctx.beginPath();
  ctx.ellipse(mpX + 4, mpY + 3, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsla(15, 50%, 45%, 0.6)`;
  ctx.fillRect(mpX + 1, mpY + 9, 6, 6);

  // Top and bottom trim
  ctx.fillStyle = `hsl(${wood.h}, ${wood.s + 4}%, ${wood.b + 12}%)`;
  ctx.fillRect(x - 3, y - 2, sw + 6, 4);
  ctx.fillRect(x - 3, y + sh, sw + 6, 4);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  WALL ART — Gold-framed cat portrait
// ══════════════════════════════════════════════════════════════════════════

export function drawWallArt(ctx, h, s, b, pos) {
  const { x, y, w: fw, h: fh } = pos;
  const gold = tint(42, 55, 62, h, s, b, 0.12);
  const cat = tint(32, 40, 68, h, s, b, 0.10);

  ctx.save();

  // Shadow behind frame
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.rect(x + 3, y + 3, fw, fh);
  ctx.fill();
  ctx.filter = 'blur(3px)';
  ctx.fill();
  ctx.filter = 'none';

  // Outer frame
  ctx.fillStyle = `hsl(${gold.h}, ${gold.s}%, ${gold.b}%)`;
  ctx.fillRect(x, y, fw, fh);

  // Frame bevel (outer)
  ctx.strokeStyle = `hsl(${gold.h}, ${gold.s - 5}%, ${gold.b - 8}%)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, fw - 6, fh - 6);

  // Frame bevel (inner)
  ctx.strokeStyle = `hsl(${gold.h}, ${gold.s}%, ${gold.b + 5}%)`;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 6, y + 6, fw - 12, fh - 12);

  // Frame highlight (top edge)
  ctx.fillStyle = `hsla(${gold.h}, ${gold.s}%, ${gold.b + 15}%, 0.25)`;
  ctx.fillRect(x + 1, y + 1, fw - 2, 2);

  // Mat / passepartout
  ctx.fillStyle = `hsla(40, 15%, 85%, 0.15)`;
  ctx.fillRect(x + 8, y + 8, fw - 16, fh - 16);

  // Cat portrait area
  const px = x + 10;
  const py = y + 10;
  const pw = fw - 20;
  const ph = fh - 20;

  // Background wash
  const bgGrad = ctx.createRadialGradient(px + pw / 2, py + ph * 0.6, 0, px + pw / 2, py + ph / 2, pw);
  bgGrad.addColorStop(0.0, 'hsla(35, 20%, 80%, 0.15)');
  bgGrad.addColorStop(1.0, 'hsla(30, 15%, 70%, 0.08)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(px, py, pw, ph);

  // Cat face
  const fcx = px + pw / 2;
  const fcy = py + ph * 0.45;
  const fr = Math.min(pw, ph) * 0.3;

  // Head
  ctx.beginPath();
  ctx.ellipse(fcx, fcy, fr, fr * 0.85, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b}%)`;
  ctx.fill();

  // Ears
  ctx.fillStyle = `hsl(${cat.h}, ${cat.s}%, ${cat.b - 2}%)`;
  ctx.beginPath();
  ctx.moveTo(fcx - fr * 0.7, fcy - fr * 0.3);
  ctx.lineTo(fcx - fr * 0.3, fcy - fr * 1.1);
  ctx.lineTo(fcx - fr * 0.05, fcy - fr * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fcx + fr * 0.7, fcy - fr * 0.3);
  ctx.lineTo(fcx + fr * 0.3, fcy - fr * 1.1);
  ctx.lineTo(fcx + fr * 0.05, fcy - fr * 0.3);
  ctx.fill();

  // Inner ears (pink)
  ctx.fillStyle = 'hsla(350, 30%, 65%, 0.35)';
  ctx.beginPath();
  ctx.moveTo(fcx - fr * 0.6, fcy - fr * 0.3);
  ctx.lineTo(fcx - fr * 0.3, fcy - fr * 0.9);
  ctx.lineTo(fcx - fr * 0.1, fcy - fr * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fcx + fr * 0.6, fcy - fr * 0.3);
  ctx.lineTo(fcx + fr * 0.3, fcy - fr * 0.9);
  ctx.lineTo(fcx + fr * 0.1, fcy - fr * 0.3);
  ctx.fill();

  // Eyes
  const eyeY = fcy + fr * 0.05;
  const eyeR = fr * 0.2;
  for (const side of [-1, 1]) {
    const ex = fcx + side * fr * 0.35;
    // Iris
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR, eyeR * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(120, 50%, 50%, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'hsla(30, 30%, 30%, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Pupil
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeR * 0.3, eyeR * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,20,20,0.7)';
    ctx.fill();
    // Glint
    ctx.beginPath();
    ctx.arc(ex - eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
  }

  // Forehead stripe (tabby)
  ctx.strokeStyle = `hsla(${cat.h}, ${cat.s + 5}%, ${cat.b - 15}%, 0.3)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(fcx, fcy - fr * 0.6);
  ctx.lineTo(fcx, fcy - fr * 0.15);
  ctx.stroke();

  // Nose
  ctx.beginPath();
  ctx.moveTo(fcx, fcy + fr * 0.25);
  ctx.lineTo(fcx - fr * 0.1, fcy + fr * 0.35);
  ctx.lineTo(fcx + fr * 0.1, fcy + fr * 0.35);
  ctx.closePath();
  ctx.fillStyle = 'hsla(350, 35%, 65%, 0.6)';
  ctx.fill();

  // Mouth
  ctx.strokeStyle = `hsla(${cat.h}, ${cat.s}%, ${cat.b - 25}%, 0.3)`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(fcx, fcy + fr * 0.35);
  ctx.quadraticCurveTo(fcx - fr * 0.15, fcy + fr * 0.5, fcx - fr * 0.25, fcy + fr * 0.42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fcx, fcy + fr * 0.35);
  ctx.quadraticCurveTo(fcx + fr * 0.15, fcy + fr * 0.5, fcx + fr * 0.25, fcy + fr * 0.42);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = `hsla(40, 20%, 75%, 0.3)`;
  ctx.lineWidth = 0.5;
  const wBase = fcy + fr * 0.3;
  for (const [dx, dy, angle] of [
    [-fr * 0.3, -1, -0.08], [-fr * 0.35, 1, 0.05],
    [fr * 0.3, -1, 0.08],  [fr * 0.35, 1, -0.05],
  ]) {
    ctx.beginPath();
    ctx.moveTo(fcx + dx * 0.3, wBase + dy);
    ctx.lineTo(fcx + dx * 1.8, wBase + dy + angle * 30);
    ctx.stroke();
  }

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  WINDOW — Wooden frame with cross bars, sky view, windowsill
// ══════════════════════════════════════════════════════════════════════════

export function drawWindow(ctx, h, s, b, pos) {
  const { x, y, w: ww, h: wh } = pos;
  const frame = tint(28, 38, 52, h, s, b, 0.15);

  ctx.save();

  // Light cast into room
  const lightCast = ctx.createRadialGradient(x + ww / 2, y + wh / 2, 0, x + ww / 2, y + wh, wh);
  lightCast.addColorStop(0.0, 'rgba(200,220,250,0.08)');
  lightCast.addColorStop(1.0, 'rgba(200,220,250,0)');
  ctx.fillStyle = lightCast;
  ctx.fillRect(x - 10, y, ww + 20, wh + 30);

  // Outer frame
  ctx.fillStyle = `hsl(${frame.h}, ${frame.s}%, ${frame.b}%)`;
  ctx.fillRect(x, y, ww, wh);
  // Frame shadow
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillRect(x, y, ww, wh);
  ctx.shadowColor = 'transparent';

  // Glass area (inset)
  const gx = x + 4;
  const gy = y + 4;
  const gw = ww - 8;
  const gh = wh - 8;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
  skyGrad.addColorStop(0.0, 'hsla(215, 50%, 72%, 0.30)');
  skyGrad.addColorStop(0.4, 'hsla(210, 45%, 78%, 0.22)');
  skyGrad.addColorStop(0.7, 'hsla(200, 40%, 85%, 0.15)');
  skyGrad.addColorStop(1.0, 'hsla(35, 40%, 82%, 0.10)');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(gx, gy, gw, gh);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(gx + gw * 0.25, gy + gh * 0.15, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.ellipse(gx + gw * 0.7, gy + gh * 0.22, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Distant tree silhouette
  ctx.fillStyle = 'rgba(60,90,50,0.15)';
  ctx.beginPath();
  ctx.ellipse(gx + 10, gy + gh * 0.55, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rooftop silhouette
  ctx.fillStyle = 'rgba(80,60,50,0.12)';
  ctx.fillRect(gx + gw * 0.6, gy + gh * 0.5, 16, 10);

  // Warm horizon glow
  const hzGrad = ctx.createLinearGradient(gx, gy + gh * 0.45, gx, gy + gh * 0.6);
  hzGrad.addColorStop(0.0, 'rgba(255,220,160,0)');
  hzGrad.addColorStop(1.0, 'rgba(255,220,160,0.10)');
  ctx.fillStyle = hzGrad;
  ctx.fillRect(gx, gy + gh * 0.45, gw, gh * 0.15);

  // Glass reflection
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(gx + 3, gy + 3);
  ctx.lineTo(gx + gw * 0.4, gy + 3);
  ctx.lineTo(gx + gw * 0.3, gy + gh * 0.25);
  ctx.lineTo(gx + 3, gy + gh * 0.3);
  ctx.closePath();
  ctx.fill();

  // Cross bars
  ctx.fillStyle = `hsl(${frame.h}, ${frame.s}%, ${frame.b + 3}%)`;
  ctx.fillRect(gx, gy + gh / 2 - 2, gw, 4); // horizontal
  ctx.fillRect(gx + gw / 2 - 2, gy, 4, gh); // vertical
  // Bar shadows
  ctx.fillStyle = `hsla(${frame.h}, ${frame.s}%, ${frame.b - 12}%, 0.2)`;
  ctx.fillRect(gx, gy + gh / 2 + 2, gw, 1);
  ctx.fillRect(gx + gw / 2 + 2, gy, 1, gh);

  // Inner frame edge (inset shadow)
  ctx.strokeStyle = `hsla(0, 0%, 0%, 0.12)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(gx, gy, gw, gh);

  // Windowsill
  const sillH = 5;
  ctx.fillStyle = `hsl(${frame.h}, ${frame.s + 2}%, ${frame.b + 8}%)`;
  ctx.fillRect(x - 4, y + wh, ww + 8, sillH);
  // Sill highlight
  ctx.fillStyle = `hsla(${frame.h}, ${frame.s}%, ${frame.b + 18}%, 0.3)`;
  ctx.fillRect(x - 4, y + wh, ww + 8, 1.5);

  // Small flower pot on sill
  const fpX = x + ww - 14;
  const fpY = y + wh - 8;
  // Stem
  ctx.strokeStyle = 'hsla(120, 35%, 40%, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fpX + 4, fpY);
  ctx.lineTo(fpX + 4, fpY - 8);
  ctx.stroke();
  // Flower
  ctx.beginPath();
  ctx.arc(fpX + 4, fpY - 9, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(340, 50%, 65%, 0.6)';
  ctx.fill();
  // Pot
  ctx.fillStyle = 'hsla(15, 50%, 45%, 0.6)';
  ctx.fillRect(fpX + 1, fpY, 6, 5);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  CHANDELIER — Brass candelabra with 5 arms
// ══════════════════════════════════════════════════════════════════════════

export function drawChandelier(ctx, ts, h, s, b, pos) {
  const { cx, y: baseY } = pos;
  const brass = tint(42, 52, 60, h, s, b, 0.12);

  // Idle animation: gentle swing
  const swing = Math.sin(ts * 0.0001) * 2;
  const drawX = cx + swing;

  ctx.save();

  // Overall glow
  const glow = ctx.createRadialGradient(drawX, baseY + 55, 0, drawX, baseY + 55, 80);
  glow.addColorStop(0.0, 'rgba(255,220,120,0.10)');
  glow.addColorStop(0.5, 'rgba(255,200,80,0.04)');
  glow.addColorStop(1.0, 'rgba(255,200,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(drawX, baseY + 55, 80, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ceiling mount
  ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b + 5}%)`;
  ctx.fillRect(cx - 6, baseY, 12, 5);

  // Chain
  ctx.strokeStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b}%)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, baseY + 5);
  ctx.lineTo(drawX, baseY + 20);
  ctx.stroke();

  // Hub
  ctx.beginPath();
  ctx.ellipse(drawX, baseY + 24, 8, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b + 3}%)`;
  ctx.fill();

  // 5 arms with candles
  const armPositions = [-2, -1, 0, 1, 2];
  const armSpacing = 16;

  for (const ai of armPositions) {
    const ax = drawX + ai * armSpacing;
    const armLen = Math.abs(ai) * 8;
    const candleY = baseY + 28 + (2 - Math.abs(ai)) * 3; // center higher

    // Arm curve
    ctx.beginPath();
    ctx.moveTo(drawX, baseY + 24);
    ctx.quadraticCurveTo(drawX + ai * armSpacing * 0.5, candleY + 3, ax, candleY);
    ctx.strokeStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b}%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Candle cup
    ctx.beginPath();
    ctx.ellipse(ax, candleY, 4, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${brass.h}, ${brass.s}%, ${brass.b + 2}%)`;
    ctx.fill();

    // Candle
    const candleH = 10 + (ai === 0 ? 4 : 0);
    ctx.fillStyle = 'hsla(40, 20%, 92%, 0.8)';
    ctx.fillRect(ax - 2, candleY - candleH, 4, candleH);

    // Wax drip detail
    if (Math.abs(ai) === 1) {
      ctx.fillStyle = 'hsla(40, 15%, 88%, 0.5)';
      ctx.beginPath();
      ctx.ellipse(ax + 1.5, candleY - candleH + 3, 1, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flame — outer
    const flameY = candleY - candleH - 5;
    const flicker = Math.sin(ts * 0.005 + ai * 1.7) * 1.5;
    ctx.beginPath();
    ctx.ellipse(ax + flicker * 0.3, flameY, 3, 5, 0, 0, Math.PI * 2);
    const flameGrad = ctx.createRadialGradient(ax, flameY + 2, 0, ax, flameY, 5);
    flameGrad.addColorStop(0.0, 'rgba(255,210,80,0.85)');
    flameGrad.addColorStop(0.5, 'rgba(255,170,40,0.5)');
    flameGrad.addColorStop(1.0, 'rgba(255,140,20,0)');
    ctx.fillStyle = flameGrad;
    ctx.fill();

    // Flame — inner (bright core)
    ctx.beginPath();
    ctx.ellipse(ax + flicker * 0.15, flameY + 1, 1.5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,200,0.7)';
    ctx.fill();
  }

  ctx.restore();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/room-decor-wall.js
git commit -m "feat: add room-decor-wall.js with drawShelf, drawWallArt, drawWindow, drawChandelier"
```

---

### Task 5: Add Plant, CatTree, Fireplace to room-decor-floor.js

**Files:**
- Modify: `js/room-decor-floor.js` (replace placeholder exports)

- [ ] **Step 1: Replace the 3 placeholder exports with full implementations**

In `js/room-decor-floor.js`, replace the three placeholder lines at the bottom:

```js
// Placeholder exports — will be implemented in Tasks 4 and 5
export function drawPlant(ctx, ts, h, s, b, pos) {}
export function drawCatTree(ctx, h, s, b, pos) {}
export function drawFireplace(ctx, ts, h, s, b, pos) {}
```

with:

```js
// ══════════════════════════════════════════════════════════════════════════
//  PLANT — Potted plant with swaying leaves
// ══════════════════════════════════════════════════════════════════════════

export function drawPlant(ctx, ts, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;

  const terra = tint(15, 50, 48, h, s, b, 0.12);

  // Idle animation: gentle sway
  const sway = Math.sin(ts * 0.00015) * 0.04;

  ctx.save();

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 52, 16, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();

  // Leaves (back to front, each with own green shade and sway offset)
  const leaves = [
    { angle: -0.7 + sway * 0.8,  gh: 115, gs: 38, gb: 42, len: 32, w: 8, phase: 0 },
    { angle:  0.6 + sway * 0.6,  gh: 120, gs: 40, gb: 44, len: 30, w: 7, phase: 1 },
    { angle: -0.45 + sway,       gh: 125, gs: 42, gb: 48, len: 36, w: 9, phase: 2 },
    { angle:  0.35 + sway * 1.1, gh: 118, gs: 44, gb: 46, len: 34, w: 8, phase: 3 },
    { angle: -0.2 + sway * 1.2,  gh: 130, gs: 40, gb: 50, len: 38, w: 9, phase: 4 },
    { angle:  0.1 + sway * 0.9,  gh: 122, gs: 45, gb: 52, len: 35, w: 8, phase: 5 },
    { angle: -0.05 + sway * 1.0, gh: 128, gs: 42, gb: 54, len: 32, w: 7, phase: 6 },
  ];

  const stemBase = { x: x + 14, y: y + 34 };

  for (const leaf of leaves) {
    const lc = tint(leaf.gh, leaf.gs, leaf.gb, h, s, b, 0.15);
    const tipX = stemBase.x + Math.sin(leaf.angle) * leaf.len;
    const tipY = stemBase.y - Math.cos(leaf.angle) * leaf.len;
    const midX = (stemBase.x + tipX) / 2 + Math.sin(leaf.angle + 0.5) * leaf.w;
    const midY = (stemBase.y + tipY) / 2;

    ctx.beginPath();
    ctx.moveTo(stemBase.x, stemBase.y);
    ctx.quadraticCurveTo(midX - leaf.w * 0.5, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + leaf.w * 0.5, midY, stemBase.x, stemBase.y);
    ctx.fillStyle = `hsla(${lc.h}, ${lc.s}%, ${lc.b}%, 0.75)`;
    ctx.fill();

    // Midrib
    ctx.beginPath();
    ctx.moveTo(stemBase.x, stemBase.y);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = `hsla(${lc.h}, ${lc.s}%, ${lc.b - 12}%, 0.3)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Side veins (2 per leaf for main leaves)
    if (leaf.len > 33) {
      for (const vf of [0.35, 0.6]) {
        const vx = stemBase.x + (tipX - stemBase.x) * vf;
        const vy = stemBase.y + (tipY - stemBase.y) * vf;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(leaf.angle) * 4, vy + Math.sin(leaf.angle) * 4);
        ctx.strokeStyle = `hsla(${lc.h}, ${lc.s}%, ${lc.b - 10}%, 0.2)`;
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }
  }

  // Soil
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 35, 10, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(25, 40%, 25%, 0.5)';
  ctx.fill();

  // Pot rim
  ctx.fillStyle = `hsl(${terra.h}, ${terra.s}%, ${terra.b + 5}%)`;
  ctx.fillRect(x + 4, y + 34, 20, 4);

  // Pot body (tapered)
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 38);
  ctx.lineTo(x + 8, y + 52);
  ctx.lineTo(x + 20, y + 52);
  ctx.lineTo(x + 23, y + 38);
  ctx.closePath();
  ctx.fillStyle = `hsl(${terra.h}, ${terra.s}%, ${terra.b}%)`;
  ctx.fill();

  // Pot texture lines
  ctx.strokeStyle = `hsla(${terra.h}, ${terra.s}%, ${terra.b - 8}%, 0.15)`;
  ctx.lineWidth = 0.5;
  for (let py = y + 40; py < y + 52; py += 5) {
    ctx.beginPath();
    ctx.moveTo(x + 6, py);
    ctx.lineTo(x + 22, py);
    ctx.stroke();
  }

  // Pot ring detail
  ctx.strokeStyle = `hsla(${terra.h}, ${terra.s}%, ${terra.b + 8}%, 0.3)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 42);
  ctx.lineTo(x + 23, y + 42);
  ctx.stroke();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  CAT TREE — Sisal-wrapped post with platforms and toy
// ══════════════════════════════════════════════════════════════════════════

export function drawCatTree(ctx, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;

  const wood = tint(35, 30, 55, h, s, b, 0.15);
  const carpet = tint(32, 18, 65, h, s, b, 0.12);
  const sisal  = tint(40, 28, 62, h, s, b, 0.12);

  ctx.save();

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 68, 18, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();

  // Base platform
  ctx.fillStyle = `hsl(${carpet.h}, ${carpet.s}%, ${carpet.b}%)`;
  ctx.fillRect(x - 2, y + 62, 32, 6);
  ctx.fillStyle = `hsla(${carpet.h}, ${carpet.s}%, ${carpet.b - 8}%, 0.2)`;
  ctx.fillRect(x, y + 64, 28, 2);

  // Lower post (thick, sisal)
  const postX = x + 10;
  ctx.fillStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b}%)`;
  ctx.fillRect(postX, y + 20, 10, 42);
  // Sisal diagonal wrap
  ctx.save();
  ctx.beginPath();
  ctx.rect(postX, y + 20, 10, 42);
  ctx.clip();
  ctx.globalAlpha = 0.15;
  for (let sy = y + 20; sy < y + 65; sy += 5) {
    ctx.beginPath();
    ctx.moveTo(postX, sy);
    ctx.lineTo(postX + 10, sy - 4);
    ctx.strokeStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b - 10}%)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  ctx.restore();

  // Scratch marks
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b - 15}%)`;
  ctx.lineWidth = 0.6;
  for (const sx of [postX + 2, postX + 5, postX + 7]) {
    ctx.beginPath();
    ctx.moveTo(sx, y + 32);
    ctx.lineTo(sx, y + 48);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Middle platform
  ctx.fillStyle = `hsl(${carpet.h}, ${carpet.s}%, ${carpet.b}%)`;
  ctx.fillRect(x, y + 16, 26, 5);
  ctx.fillStyle = `hsla(${carpet.h}, ${carpet.s}%, ${carpet.b - 8}%, 0.2)`;
  ctx.fillRect(x + 2, y + 18, 22, 2);

  // Upper post (thinner)
  ctx.fillStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b}%)`;
  ctx.fillRect(postX + 1, y + 2, 8, 14);
  ctx.save();
  ctx.beginPath();
  ctx.rect(postX + 1, y + 2, 8, 14);
  ctx.clip();
  ctx.globalAlpha = 0.12;
  for (let sy = y + 2; sy < y + 16; sy += 4) {
    ctx.beginPath();
    ctx.moveTo(postX + 1, sy);
    ctx.lineTo(postX + 9, sy - 3);
    ctx.strokeStyle = `hsl(${sisal.h}, ${sisal.s}%, ${sisal.b - 10}%)`;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.restore();

  // Top platform
  ctx.fillStyle = `hsl(${carpet.h}, ${carpet.s}%, ${carpet.b + 2}%)`;
  ctx.fillRect(x - 1, y - 2, 30, 5);
  ctx.fillStyle = `hsla(${carpet.h}, ${carpet.s}%, ${carpet.b - 8}%, 0.2)`;
  ctx.fillRect(x + 1, y, 26, 2);

  // Side arm with dangling toy
  ctx.strokeStyle = `hsl(${wood.h}, ${wood.s}%, ${wood.b}%)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(postX + 8, y + 30);
  ctx.lineTo(x + 28, y + 28);
  ctx.stroke();

  // String
  ctx.strokeStyle = `hsla(0, 0%, 50%, 0.3)`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 28);
  ctx.lineTo(x + 26, y + 40);
  ctx.stroke();

  // Ball toy
  ctx.beginPath();
  ctx.arc(x + 26, y + 43, 4, 0, Math.PI * 2);
  const toyC = tint(0, 50, 55, h, s, b, 0.15);
  ctx.fillStyle = `hsl(${toyC.h}, ${toyC.s}%, ${toyC.b}%)`;
  ctx.fill();
  // Ball highlight
  ctx.beginPath();
  ctx.arc(x + 25, y + 42, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${toyC.h}, ${toyC.s}%, ${toyC.b + 20}%, 0.3)`;
  ctx.fill();

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  FIREPLACE — Brick mantel with fire, logs, glow
// ══════════════════════════════════════════════════════════════════════════

export function drawFireplace(ctx, ts, h, s, b, pos) {
  const x = pos.x;
  const y = pos.y;
  const fw = pos.w;

  const brick = tint(15, 35, 42, h, s, b, 0.15);
  const stone = tint(25, 30, 50, h, s, b, 0.12);

  ctx.save();

  // Warm glow on wall above
  const wallGlow = ctx.createRadialGradient(x + fw / 2, y - 10, 0, x + fw / 2, y - 10, 45);
  wallGlow.addColorStop(0.0, 'rgba(255,150,50,0.10)');
  wallGlow.addColorStop(1.0, 'rgba(255,150,50,0)');
  ctx.fillStyle = wallGlow;
  ctx.fillRect(x - 10, y - 40, fw + 20, 45);

  // Mantel top
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s + 3}%, ${stone.b + 8}%)`;
  ctx.fillRect(x - 2, y, fw + 4, 6);
  // Mantel trim
  ctx.fillStyle = `hsla(${stone.h}, ${stone.s}%, ${stone.b + 14}%, 0.3)`;
  ctx.fillRect(x, y + 5, fw, 1.5);

  // Mantel body
  ctx.fillStyle = `hsl(${brick.h}, ${brick.s}%, ${brick.b}%)`;
  ctx.fillRect(x, y + 6, fw, 46);

  // Brick texture
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + 6, fw, 46);
  ctx.clip();
  ctx.globalAlpha = 0.18;
  // Horizontal mortar lines
  for (let by = y + 6; by < y + 52; by += 8) {
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + fw, by);
    ctx.strokeStyle = `hsl(${brick.h}, ${brick.s - 5}%, ${brick.b - 10}%)`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  // Vertical mortar lines (offset every other row)
  for (let by = y + 6; by < y + 52; by += 8) {
    const offset = ((by - y) / 8 % 2) * 8;
    for (let bx2 = x + offset; bx2 < x + fw; bx2 += 16) {
      ctx.beginPath();
      ctx.moveTo(bx2, by);
      ctx.lineTo(bx2, by + 8);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Pilasters (side columns)
  const pilW = 8;
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s + 2}%, ${stone.b + 4}%)`;
  ctx.fillRect(x, y + 6, pilW, 46);
  ctx.fillRect(x + fw - pilW, y + 6, pilW, 46);
  // Pilaster inner edge
  ctx.fillStyle = `hsla(${stone.h}, ${stone.s}%, ${stone.b - 8}%, 0.2)`;
  ctx.fillRect(x + pilW, y + 6, 1, 46);
  ctx.fillRect(x + fw - pilW - 1, y + 6, 1, 46);

  // Arch opening
  const archX = x + pilW + 2;
  const archW = fw - 2 * pilW - 4;
  const archH = 36;
  const archY = y + 52 - archH;
  const archR = archW / 2;

  ctx.beginPath();
  ctx.moveTo(archX, y + 52);
  ctx.lineTo(archX, archY + archR);
  ctx.arc(archX + archR, archY + archR, archR, Math.PI, 0);
  ctx.lineTo(archX + archW, y + 52);
  ctx.closePath();
  ctx.fillStyle = 'rgba(12,6,3,0.9)';
  ctx.fill();

  // Keystone
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s}%, ${stone.b + 6}%)`;
  ctx.fillRect(archX + archR - 5, archY + archR - archR - 1, 10, 6);

  // Inner back wall
  ctx.beginPath();
  ctx.moveTo(archX + 3, y + 52);
  ctx.lineTo(archX + 3, archY + archR + 2);
  ctx.arc(archX + archR, archY + archR + 2, archR - 3, Math.PI, 0);
  ctx.lineTo(archX + archW - 3, y + 52);
  ctx.closePath();
  ctx.fillStyle = 'rgba(22,12,6,0.85)';
  ctx.fill();

  // Soot stains at arch top
  const sootGrad = ctx.createRadialGradient(archX + archR, archY + archR - 5, 0, archX + archR, archY + archR, archR);
  sootGrad.addColorStop(0.0, 'rgba(0,0,0,0.2)');
  sootGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = sootGrad;
  ctx.beginPath();
  ctx.arc(archX + archR, archY + archR, archR - 3, Math.PI, 0);
  ctx.fill();

  // Logs
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(archX + 3, y + 52);
  ctx.lineTo(archX + 3, archY + archR + 2);
  ctx.arc(archX + archR, archY + archR + 2, archR - 3, Math.PI, 0);
  ctx.lineTo(archX + archW - 3, y + 52);
  ctx.clip();

  const logY = y + 48;
  // Log 1
  ctx.fillStyle = 'hsla(20, 35%, 28%, 0.85)';
  ctx.save();
  ctx.translate(archX + 8, logY);
  ctx.rotate(-0.05);
  ctx.fillRect(0, 0, archW * 0.6, 5);
  ctx.beginPath();
  ctx.arc(3, 2.5, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'hsla(20, 30%, 20%, 0.5)';
  ctx.fill();
  ctx.restore();
  // Log 2
  ctx.fillStyle = 'hsla(18, 32%, 25%, 0.85)';
  ctx.save();
  ctx.translate(archX + 12, logY - 4);
  ctx.rotate(0.08);
  ctx.fillRect(0, 0, archW * 0.5, 4);
  ctx.restore();
  // Log 3
  ctx.fillStyle = 'hsla(22, 30%, 23%, 0.8)';
  ctx.save();
  ctx.translate(archX + 14, logY + 1);
  ctx.rotate(-0.03);
  ctx.fillRect(0, 0, archW * 0.4, 3.5);
  ctx.restore();

  // Fire — animated flames
  const fireX = archX + archR;
  const fireY = logY - 4;
  const flicker1 = Math.sin(ts * 0.003) * 2;
  const flicker2 = Math.sin(ts * 0.005 + 1.3) * 1.5;
  const flicker3 = Math.sin(ts * 0.004 + 2.7) * 1.8;

  // Outer flame
  const outerFlame = ctx.createRadialGradient(fireX + flicker1, fireY + 6, 0, fireX, fireY, 16);
  outerFlame.addColorStop(0.0, 'rgba(255,120,20,0.85)');
  outerFlame.addColorStop(0.4, 'rgba(255,80,10,0.5)');
  outerFlame.addColorStop(0.8, 'rgba(200,40,5,0.15)');
  outerFlame.addColorStop(1.0, 'rgba(200,40,5,0)');
  ctx.beginPath();
  ctx.ellipse(fireX + flicker1 * 0.5, fireY, 10, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = outerFlame;
  ctx.fill();

  // Inner flame
  const innerFlame = ctx.createRadialGradient(fireX + flicker2 * 0.3, fireY + 4, 0, fireX, fireY, 10);
  innerFlame.addColorStop(0.0, 'rgba(255,230,80,0.9)');
  innerFlame.addColorStop(0.5, 'rgba(255,180,40,0.5)');
  innerFlame.addColorStop(1.0, 'rgba(255,180,40,0)');
  ctx.beginPath();
  ctx.ellipse(fireX + flicker2 * 0.3, fireY + 2, 6, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = innerFlame;
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.ellipse(fireX + flicker3 * 0.2, fireY + 4, 3, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,200,0.6)';
  ctx.fill();

  // Sparks
  const spark1Y = fireY - 10 - Math.abs(Math.sin(ts * 0.002)) * 6;
  const spark2Y = fireY - 8 - Math.abs(Math.sin(ts * 0.003 + 1)) * 8;
  ctx.beginPath();
  ctx.arc(fireX - 4 + flicker1, spark1Y, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,200,80,0.6)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fireX + 3 + flicker2, spark2Y, 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,180,60,0.5)';
  ctx.fill();

  // Ember bed
  const emberGrad = ctx.createLinearGradient(archX + 5, logY + 3, archX + 5, logY + 8);
  emberGrad.addColorStop(0.0, 'rgba(255,100,20,0.25)');
  emberGrad.addColorStop(1.0, 'rgba(255,60,10,0.05)');
  ctx.fillStyle = emberGrad;
  ctx.fillRect(archX + 5, logY + 3, archW - 10, 5);

  ctx.restore(); // end arch clip

  // Hearth (bottom ledge)
  ctx.fillStyle = `hsl(${stone.h}, ${stone.s - 2}%, ${stone.b - 3}%)`;
  ctx.fillRect(x - 2, y + 52, fw + 4, 5);

  // Floor glow
  const floorGlow = ctx.createRadialGradient(x + fw / 2, y + 60, 0, x + fw / 2, y + 60, 30);
  floorGlow.addColorStop(0.0, 'rgba(255,140,50,0.08)');
  floorGlow.addColorStop(1.0, 'rgba(255,140,50,0)');
  ctx.fillStyle = floorGlow;
  ctx.beginPath();
  ctx.ellipse(x + fw / 2, y + 60, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/room-decor-floor.js
git commit -m "feat: add drawPlant, drawCatTree, drawFireplace to room-decor-floor.js"
```

---

### Task 6: Integrate into render pipeline

**Files:**
- Modify: `js/render.js:1-19` (add import)
- Modify: `js/render.js:768-769` (add drawRoomDecor call)
- Modify: `js/room-decor.js` (add invalidateRoomDecorCache call on level change — check where G.level is set)

- [ ] **Step 1: Check where G.level is set to find the right invalidation hook**

Look in `js/main.js` for where `generateLevel` or `G.level` is assigned after level completion.

- [ ] **Step 2: Add import to render.js**

At line 13 in `js/render.js`, after the `drawBackground` import, add:

```js
import { drawRoomDecor } from './room-decor.js';
```

- [ ] **Step 3: Add drawRoomDecor call after drawBackground**

At line 768 in `js/render.js`, after `drawBackground(ctx, ts, theme, prevTheme, G.themeFade);`, add:

```js
  drawRoomDecor(ctx, ts, theme, prevTheme, G.themeFade, G.level);
```

So lines 768-769 become:

```js
  drawBackground(ctx, ts, theme, prevTheme, G.themeFade);
  drawRoomDecor(ctx, ts, theme, prevTheme, G.themeFade, G.level);
  if (!REDUCED_MOTION) drawFireflies(ctx, ts);
```

- [ ] **Step 4: Add cache invalidation when level changes**

In `js/main.js`, find where `generateLevel(n)` is called (the function that sets up a new level). Add at the top of that file:

```js
import { invalidateRoomDecorCache } from './room-decor.js';
```

Then, right after each `generateLevel(n)` call, add:

```js
invalidateRoomDecorCache();
```

- [ ] **Step 5: Test in browser**

Open the game. Verify:
1. Background renders as before (no regressions)
2. If player has solved levels, unlocked décor items appear in the background
3. Décor items have visible theme tinting that matches the current tier
4. Animated items (plant, fireplace, chandelier) move subtly

To test quickly: in browser console, manually set progress to unlock items:

```js
localStorage.setItem('colordrop_progress', JSON.stringify(
  Object.fromEntries(Array.from({length: 200}, (_, i) => [i + 1, 3]))
));
location.reload();
```

This simulates 200 solved levels (all items unlocked).

- [ ] **Step 6: Commit**

```bash
git add js/render.js js/main.js js/room-decor.js
git commit -m "feat: integrate room décor into render pipeline"
```

---

### Task 7: Visual tuning pass

**Files:**
- Modify: `js/room-decor.js` (position constants)
- Possibly modify: `js/room-decor-wall.js`, `js/room-decor-floor.js` (sizes, alphas)

- [ ] **Step 1: Test with different unlock counts**

Test the following scenarios in browser (using localStorage manipulation):

```js
// Scenario 1: Level 5 (only rug unlocked)
localStorage.setItem('colordrop_progress', JSON.stringify(
  Object.fromEntries(Array.from({length: 5}, (_, i) => [i + 1, 3]))
));
location.reload();
```

```js
// Scenario 2: Level 30 (rug, shelf, catbed, lamp)
localStorage.setItem('colordrop_progress', JSON.stringify(
  Object.fromEntries(Array.from({length: 30}, (_, i) => [i + 1, 3]))
));
location.reload();
```

```js
// Scenario 3: Level 100 (up through cattree)
localStorage.setItem('colordrop_progress', JSON.stringify(
  Object.fromEntries(Array.from({length: 100}, (_, i) => [i + 1, 3]))
));
location.reload();
```

- [ ] **Step 2: Adjust positions and sizes if elements overlap puzzle or each other**

Based on visual inspection, tune `DECOR_POS` values in `room-decor.js`. The key constraint: no element should overlap the puzzle tube area (x: ~70-350, y: 200-440 given CW=420, CH=520).

- [ ] **Step 3: Adjust alpha/opacity if elements are too prominent or too subtle**

Ensure décor is visible but doesn't compete with the gameplay. Wall items should be at ~0.6-0.8 effective opacity. Floor items at full opacity but with soft colours.

- [ ] **Step 4: Test theme transitions**

Play through enough levels to trigger a tier change (e.g., level 15→16 for EASY→MEDIUM). Verify décor items smoothly transition their theme tint along with the background.

- [ ] **Step 5: Commit any adjustments**

```bash
git add js/room-decor.js js/room-decor-wall.js js/room-decor-floor.js
git commit -m "fix: tune room décor positions, sizes, and opacity"
```
