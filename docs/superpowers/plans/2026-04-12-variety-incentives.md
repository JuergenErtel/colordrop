# Kittysort — Variety & Incentives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 new features — dog "Strolch" mechanic, joker ball, ice ball, weekly challenge, milestones, ball skins, and backgrounds — to increase gameplay variety and player engagement.

**Architecture:** Each feature is self-contained with its own module. Features integrate via the existing game loop in `main.js`, rendering pipeline in `render.js`, and storage in `storage.js`. New canvas rendering follows the existing pattern (procedural drawing with `ctx` calls). No external dependencies.

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D, Web Audio API, localStorage

**Note:** This is a vanilla JS browser game with no test framework. Verification uses `node --check` for syntax and manual browser testing. Each task ends with a commit.

---

## Phase 1: Joker Ball

### Task 1: Joker ball rendering

**Files:**
- Modify: `js/constants.js` — add joker palette entry
- Modify: `js/balls.js` — add joker ball drawing variant

- [ ] **Step 1: Add joker to PALETTE in constants.js**

In `js/constants.js`, add after the `ember` palette entry (around line 74):

```javascript
  joker: {
    base:   '#C0A0FF',
    bright: '#E0C0FF',
    dark:   '#8060C0',
    glow:   'rgba(200,160,255,0.5)',
  },
```

- [ ] **Step 2: Add joker rendering in balls.js**

In `js/balls.js`, find the `drawBall` function. After the cat face drawing section (after `drawMiniCatFace` call), add a conditional branch for joker balls. The joker gets a rainbow gradient base instead of a solid color, plus a star symbol instead of a cat face.

Find the line that calls `drawMiniCatFace` (around line 106) and wrap it:

```javascript
    if (colorId === 'joker') {
      // Rainbow shimmer overlay
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
      ctx.clip();
      const rainbow = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      const hueShift = (ts * 0.05) % 360;
      for (let i = 0; i <= 6; i++) {
        rainbow.addColorStop(i / 6, `hsl(${(hueShift + i * 60) % 360}, 80%, 70%)`);
      }
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = rainbow;
      ctx.fill();
      ctx.restore();
      // Star symbol
      ctx.save();
      ctx.font = `bold ${R * 1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText('\u2726', cx, cy + 1); // ✦
      ctx.restore();
    } else {
      drawMiniCatFace(ctx, cx, cy, R, glow, ts);
    }
```

- [ ] **Step 3: Syntax check and commit**

```bash
node --check js/constants.js && node --check js/balls.js
git add js/constants.js js/balls.js
git commit -m "feat: add joker ball rendering with rainbow shimmer"
```

---

### Task 2: Joker ball game logic

**Files:**
- Modify: `js/engine.js` — joker in `canMove`, `isSolved`, `generateTubes`
- Modify: `js/main.js` — import changes

- [ ] **Step 1: Update canMove to accept joker as wildcard**

In `js/engine.js`, modify the `canMove` function (lines 105-115). Replace the final return:

```javascript
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
```

- [ ] **Step 2: Update isSolved to handle joker**

In `js/engine.js`, replace `isSolved` (lines 93-98):

```javascript
export function isSolved(tube) {
  if (tube.length === 0) return true;
  if (tube.length < CAPACITY) return false;
  // Find first non-joker color
  const real = tube.find(c => c !== 'joker');
  if (!real) return true; // all jokers counts as solved
  return tube.every(c => c === real || c === 'joker');
}
```

- [ ] **Step 3: Add joker ball to level generation**

In `js/engine.js`, find `generateTubes` (line 146). After the pool is built (after the loop that pushes colors, around line 158), add joker insertion:

```javascript
  // Joker ball: ~15% chance from level 20+, replaces one random ball
  if (n >= 20 && rng() < 0.15) {
    const ji = Math.floor(rng() * pool.length);
    pool[ji] = 'joker';
  }
```

- [ ] **Step 4: Update hint solver to handle joker**

In `js/engine.js`, find the `solveHint` function (uses `canMove` internally). The `canMove` change already handles joker matching, and `isSolved` already handles joker in completion check. No additional changes needed — verify by checking that `solveHint` only calls `canMove` and `isSolved` for its logic.

- [ ] **Step 5: Syntax check and commit**

```bash
node --check js/engine.js
git add js/engine.js
git commit -m "feat: add joker ball game logic (wildcard matching)"
```

---

## Phase 2: Ice Ball

### Task 3: Ice ball rendering

**Files:**
- Modify: `js/balls.js` — ice overlay drawing
- Modify: `js/render.js` — ice thaw animation state
- Modify: `js/animations.js` — add iceThaw map

- [ ] **Step 1: Add ice overlay to ball drawing**

In `js/balls.js`, in the `drawBall` function, after the rim light section (end of the function, before the final `ctx.restore()`), add:

```javascript
  // Ice overlay (frozen ball)
  if (frozen) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    // Blue ice tint
    ctx.fillStyle = 'rgba(180, 220, 255, 0.35)';
    ctx.fill();
    // Frost crack lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.3, cy - R * 0.5);
    ctx.lineTo(cx + R * 0.1, cy);
    ctx.lineTo(cx - R * 0.2, cy + R * 0.4);
    ctx.moveTo(cx + R * 0.1, cy);
    ctx.lineTo(cx + R * 0.5, cy - R * 0.2);
    ctx.moveTo(cx + R * 0.1, cy);
    ctx.lineTo(cx + R * 0.4, cy + R * 0.3);
    ctx.stroke();
    // Shimmer highlight
    ctx.globalAlpha = 0.3 + 0.1 * Math.sin(ts * 0.004);
    const shimmer = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    shimmer.addColorStop(0, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    ctx.fill();
    ctx.restore();
  }
```

Also update the `drawBall` function signature to accept a `frozen` parameter. Current signature (line 15):

```javascript
export function drawBall(ctx, cx, cy, colorId, glow, ts) {
```

Change to:

```javascript
export function drawBall(ctx, cx, cy, colorId, glow, ts, frozen = false) {
```

- [ ] **Step 2: Add iceThaw to ANIM**

In `js/animations.js`, add to the ANIM object:

```javascript
  iceThaw:    new Map(), // tubeIdx → { startTime, duration, ballColor }
```

And in `resetAnim()`:

```javascript
  ANIM.iceThaw    = new Map();
```

- [ ] **Step 3: Syntax check and commit**

```bash
node --check js/balls.js && node --check js/animations.js
git add js/balls.js js/animations.js
git commit -m "feat: add ice ball rendering with frost overlay and thaw animation state"
```

---

### Task 4: Ice ball game logic

**Files:**
- Modify: `js/engine.js` — ice in generation, canMove, isSolved
- Modify: `js/render.js` — pass frozen flag, thaw animation
- Modify: `js/main.js` — ice state tracking

- [ ] **Step 1: Add ice ball markers to game state**

In `js/main.js`, add to the `G` object (around line 58):

```javascript
  frozenBalls:    new Set(), // set of "tubeIdx-slotIdx" keys for frozen balls
```

- [ ] **Step 2: Add ice ball to level generation**

In `js/engine.js`, in `generateTubes`, after the joker insertion block, add:

```javascript
  // Ice balls: ~20% chance from level 30+, 1-2 frozen balls at tube bottoms
  const icePositions = [];
  if (n >= 30 && rng() < 0.20) {
    const iceCount = 1 + (rng() < 0.3 ? 1 : 0);
    const filledTubes = [];
    for (let t = 0; t < numColors; t++) filledTubes.push(t);
    for (let ic = 0; ic < iceCount && filledTubes.length > 0; ic++) {
      const ti = Math.floor(rng() * filledTubes.length);
      icePositions.push(filledTubes.splice(ti, 1)[0]);
    }
  }
```

Then export `icePositions` by returning it alongside the tubes. Since `generateTubes` currently returns just an array, change it to also set ice positions. The cleanest approach: export a helper that `main.js` calls after generating tubes.

Add a new export at the end of `engine.js`:

```javascript
export function getIcePositions(n, tubes) {
  if (n < 30) return [];
  const rng = mulberry32(n * 1234567 + 42);
  if (rng() >= 0.20) return [];
  const positions = [];
  const iceCount = 1 + (rng() < 0.3 ? 1 : 0);
  const candidates = [];
  for (let t = 0; t < tubes.length; t++) {
    if (tubes[t].length >= 2) candidates.push(t); // need at least 2 balls
  }
  for (let ic = 0; ic < iceCount && candidates.length > 0; ic++) {
    const ti = Math.floor(rng() * candidates.length);
    positions.push(candidates.splice(ti, 1)[0]);
  }
  return positions; // array of tube indices — ball at index 0 is frozen
}
```

Note: You'll need to copy the `mulberry32` helper from `tetris.js` into `engine.js`, or export it from a shared location. Simplest: copy the function into `engine.js` (it's only 7 lines).

- [ ] **Step 3: Integrate ice into generateLevel in main.js**

In `js/main.js`, import the new function:

```javascript
import { ..., getIcePositions } from './engine.js';
```

In `generateLevel`, after `G.tubes = generateTubes(n);` (line 308), add:

```javascript
  // Ice balls
  G.frozenBalls = new Set();
  const icePositions = getIcePositions(n, G.tubes);
  for (const ti of icePositions) {
    G.frozenBalls.add(`${ti}-0`); // bottom ball is frozen
  }
```

- [ ] **Step 4: Block moves from frozen balls**

In `js/engine.js`, the `canMove` function already checks source tube. But ice balls can't be moved — they're not the top ball by design (they're at index 0). The normal move logic only moves the top ball (`src[src.length - 1]`), so a frozen ball at index 0 is naturally immovable as long as there are balls above it.

However, we need to prevent moving the last ball from a tube if that ball is frozen. In `js/main.js`, in the `doMove` function or the `handleInput` section where `canMove` is checked, add a frozen check:

Find the `canMove` call in `handleInput` (around line 536):

```javascript
  } else if (canMove(G.tubes, G.selected, idx)) {
```

Change to:

```javascript
  } else if (canMove(G.tubes, G.selected, idx) && !G.frozenBalls.has(`${G.selected}-${G.tubes[G.selected].length - 1}`)) {
```

- [ ] **Step 5: Add ice thaw detection**

In `js/render.js`, in the `updateArc` function, after the tube-clear section and before the win check, add ice thaw detection:

```javascript
  // Ice thaw: check if any frozen ball is now the only ball in its tube
  if (G.frozenBalls.size > 0) {
    for (const key of G.frozenBalls) {
      const [ti] = key.split('-').map(Number);
      if (G.tubes[ti].length === 1 && G.frozenBalls.has(`${ti}-0`)) {
        // Start thaw animation
        ANIM.iceThaw.set(ti, {
          startTime: ts,
          duration: 800,
          ballColor: G.tubes[ti][0],
        });
        playSound('solved'); // reuse solved sound for now
        // Remove frozen status after animation
        const frozenKey = `${ti}-0`;
        setTimeout(() => {
          G.frozenBalls.delete(frozenKey);
          ANIM.iceThaw.delete(ti);
        }, 800);
      }
    }
  }
```

- [ ] **Step 6: Pass frozen flag to ball renderer**

In `js/render.js`, in `drawTubes`, where balls are drawn (the `_drawBall` assignment, around line 472), modify to pass frozen state:

Find the `_drawBall` assignment:

```javascript
      const _drawBall = (G.dailyModifier === 'symbols')
        ? (cx2, cy2) => drawBallSymbol(ctx, cx2, cy2, _color, COLOR_SYMBOLS[_color] || '?', false, ts)
        : (G.dailyModifier === 'memory' && G.memoryRevealed === false && !sel && !isTop)
        ? (cx2, cy2) => drawBallHidden(ctx, cx2, cy2, false, ts)
        : (cx2, cy2) => drawBall(ctx, cx2, cy2, _color, false, ts);
```

Replace the last line with:

```javascript
        : (cx2, cy2) => drawBall(ctx, cx2, cy2, _color, false, ts, G.frozenBalls && G.frozenBalls.has(`${i}-${bi}`));
```

- [ ] **Step 7: Update undo to restore frozen state**

In `js/main.js`, in the `undo` function, frozen balls should be part of history. Modify the history push in `doMove`:

Find `G.history.push(G.tubes.map(t => [...t]));` and change to:

```javascript
  G.history.push({ tubes: G.tubes.map(t => [...t]), frozen: new Set(G.frozenBalls) });
```

In `undo`, change `G.tubes = G.history.pop();` to:

```javascript
  const snapshot = G.history.pop();
  G.tubes = snapshot.tubes;
  G.frozenBalls = snapshot.frozen;
```

- [ ] **Step 8: Syntax check and commit**

```bash
node --check js/engine.js && node --check js/main.js && node --check js/render.js
git add js/engine.js js/main.js js/render.js
git commit -m "feat: add ice ball mechanic (frozen bottom balls thaw when exposed)"
```

---

## Phase 3: Dog "Strolch"

### Task 5: Dog level detection and state

**Files:**
- Create: `js/dog.js` — dog state machine, timer, attack logic
- Modify: `js/engine.js` — add `isDogLevel`
- Modify: `js/tetris.js` — exclude dog levels from tetris

- [ ] **Step 1: Add isDogLevel to engine.js**

In `js/engine.js`, after `isTimedLevel` (line 79), add:

```javascript
export function isDogLevel(n) {
  return n >= 10 && n % 3 === 1 && !isTimedLevel(n) && !isTetrisLevel(n);
}
```

Note: `n % 3 === 1` gives levels 10, 13, 16, 19, 22, ... (every 3rd starting at 10), excluding blitz and tetris levels.

- [ ] **Step 2: Exclude dog levels from tetris**

In `js/tetris.js`, import `isDogLevel`:

```javascript
import { levelConfig, isDogLevel } from './engine.js';
```

Update `isTetrisLevel`:

```javascript
export function isTetrisLevel(n) {
  return n >= 5 && n % 5 === 0 && !(n >= 8 && n % 8 === 0) && !isDogLevel(n);
}
```

- [ ] **Step 3: Create js/dog.js**

```javascript
'use strict';

// ── Dog "Strolch" state machine ─────────────────────────────────────────

export const DOG = {
  active:       false,
  cooldown:     8000,     // ms between attacks
  warnDuration: 3000,     // ms warning before attack
  nextAttack:   0,        // timestamp of next attack
  warning:      null,     // { startTime, sourceTube, destTube } during warning phase
  attacking:    null,     // { startTime, sourceTube, destTube, color, phase } during attack
  side:         'left',   // which side dog enters from
};

export function startDog() {
  DOG.active     = true;
  DOG.nextAttack = performance.now() + DOG.cooldown;
  DOG.warning    = null;
  DOG.attacking  = null;
  DOG.side       = Math.random() < 0.5 ? 'left' : 'right';
}

export function endDog() {
  DOG.active    = false;
  DOG.warning   = null;
  DOG.attacking = null;
}

/**
 * Pick source and destination tubes for dog attack.
 * Source: random non-empty, non-solved tube (prefer mixed colors).
 * Dest: random other tube that can accept the ball.
 */
export function planDogAttack(tubes, solvedTubes) {
  const CAPACITY = 4;
  // Find valid source tubes (non-empty, not solved, not being cleared)
  const sources = [];
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].length > 0 && !solvedTubes.has(i)) {
      sources.push(i);
    }
  }
  if (sources.length === 0) return null;

  const srcIdx = sources[Math.floor(Math.random() * sources.length)];
  const topColor = tubes[srcIdx][tubes[srcIdx].length - 1];

  // Find valid destination tubes
  const dests = [];
  for (let i = 0; i < tubes.length; i++) {
    if (i === srcIdx) continue;
    if (tubes[i].length >= CAPACITY) continue;
    dests.push(i);
  }
  if (dests.length === 0) return null;

  // Prefer matching color, then empty, then any
  const matching = dests.filter(d => tubes[d].length > 0 && tubes[d][tubes[d].length - 1] === topColor);
  const empty = dests.filter(d => tubes[d].length === 0);

  let destIdx;
  if (matching.length > 0) {
    destIdx = matching[Math.floor(Math.random() * matching.length)];
  } else if (empty.length > 0) {
    destIdx = empty[Math.floor(Math.random() * empty.length)];
  } else {
    destIdx = dests[Math.floor(Math.random() * dests.length)];
  }

  return { sourceTube: srcIdx, destTube: destIdx, color: topColor };
}

/**
 * Execute the dog's ball move on the game state.
 * Returns the moved color or null.
 */
export function executeDogAttack(tubes, sourceTube, destTube) {
  if (tubes[sourceTube].length === 0) return null;
  if (tubes[destTube].length >= 4) return null;
  const color = tubes[sourceTube].pop();
  tubes[destTube].push(color);
  return color;
}

/**
 * Update dog state each frame. Called from game loop.
 * Returns action: null, 'warn', 'attack', 'done'
 */
export function updateDog(ts, tubes, solvedTubes, animBusy) {
  if (!DOG.active) return null;

  // During attack animation — check if done
  if (DOG.attacking) {
    const elapsed = ts - DOG.attacking.startTime;
    if (elapsed >= 1200) { // attack animation ~1.2s
      DOG.attacking = null;
      DOG.nextAttack = ts + DOG.cooldown;
      DOG.side = DOG.side === 'left' ? 'right' : 'left';
      return 'done';
    }
    return null; // still animating
  }

  // During warning phase
  if (DOG.warning) {
    const elapsed = ts - DOG.warning.startTime;
    if (elapsed >= DOG.warnDuration) {
      // Warning over — execute attack (if not busy with player animation)
      if (animBusy) return null; // wait for player animation to finish
      const { sourceTube, destTube, color } = DOG.warning;
      const moved = executeDogAttack(tubes, sourceTube, destTube);
      if (moved) {
        DOG.attacking = {
          startTime: ts,
          sourceTube,
          destTube,
          color: moved,
          phase: 'run',
        };
        DOG.warning = null;
        return 'attack';
      } else {
        // Attack failed (tube state changed during warning) — reset
        DOG.warning = null;
        DOG.nextAttack = ts + DOG.cooldown;
        return null;
      }
    }
    return 'warn';
  }

  // Waiting for next attack
  if (ts >= DOG.nextAttack) {
    const plan = planDogAttack(tubes, solvedTubes);
    if (plan) {
      DOG.warning = {
        startTime: ts,
        sourceTube: plan.sourceTube,
        destTube: plan.destTube,
        color: plan.color,
      };
      return 'warn';
    } else {
      // No valid attack — try again later
      DOG.nextAttack = ts + 2000;
    }
  }

  return null;
}
```

- [ ] **Step 4: Syntax check and commit**

```bash
node --check js/dog.js && node --check js/engine.js && node --check js/tetris.js
git add js/dog.js js/engine.js js/tetris.js
git commit -m "feat: add dog level detection and state machine"
```

---

### Task 6: Dog rendering

**Files:**
- Create: `js/dog-renderer.js` — canvas drawing of the dog and warning indicators

- [ ] **Step 1: Create js/dog-renderer.js**

```javascript
'use strict';

import { CW, TUBE_W, TUBE_TOP, TUBE_H, TUBE_BOT, PALETTE } from './constants.js';
import { DOG } from './dog.js';
import { tubeCX } from './render.js';
import { spawnParticle } from './particles.js';
import { easeInOut, easeOutBack } from './animations.js';

// ── Warning paws ────────────────────────────────────────────────────────

function drawWarningPaws(ctx, ts, side) {
  const elapsed = ts - DOG.warning.startTime;
  const wave = Math.sin(elapsed * 0.008) * 3;
  const alpha = 0.6 + 0.3 * Math.sin(elapsed * 0.006);
  const x = side === 'left' ? -5 : CW + 5;
  const dir = side === 'left' ? 1 : -1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8B6914';

  // Two paw circles
  for (let i = 0; i < 2; i++) {
    const py = TUBE_TOP + TUBE_H * 0.3 + i * 45 + wave;
    // Paw pad
    ctx.beginPath();
    ctx.ellipse(x + dir * 12, py, 14, 18, dir * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Toe beans
    for (let t = 0; t < 3; t++) {
      const angle = -0.6 + t * 0.6;
      ctx.beginPath();
      ctx.arc(x + dir * (22 + Math.cos(angle) * 6), py - 10 + Math.sin(angle) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ── Warning tube highlight ──────────────────────────────────────────────

function drawWarningHighlight(ctx, ts, tubeIdx, tubeCount) {
  const cx = tubeCX(tubeIdx, tubeCount);
  const elapsed = ts - DOG.warning.startTime;
  const pulse = 0.4 + 0.3 * Math.sin(elapsed * 0.008);

  ctx.save();
  ctx.strokeStyle = `rgba(255, 140, 0, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(255, 140, 0, 0.6)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  const rx = cx - TUBE_W / 2 - 3;
  const ry = TUBE_TOP - 3;
  const rw = TUBE_W + 6;
  const rh = TUBE_H + 6;
  const rr = 10;
  ctx.moveTo(rx + rr, ry);
  ctx.lineTo(rx + rw - rr, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr);
  ctx.lineTo(rx + rw, ry + rh - rr);
  ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr);
  ctx.lineTo(rx + rr, ry + rh);
  ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr);
  ctx.lineTo(rx, ry + rr);
  ctx.arcTo(rx, ry, rx + rr, ry, rr);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ── Dog body ────────────────────────────────────────────────────────────

function drawDogBody(ctx, x, y, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  // Body
  ctx.fillStyle = '#C08030';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // White belly
  ctx.fillStyle = '#F0E0C0';
  ctx.beginPath();
  ctx.ellipse(0, 6, 18, 12, 0, 0, Math.PI);
  ctx.fill();

  // Head
  ctx.fillStyle = '#C08030';
  ctx.beginPath();
  ctx.arc(24, -10, 18, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#D09040';
  ctx.beginPath();
  ctx.ellipse(38, -6, 10, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#402010';
  ctx.beginPath();
  ctx.arc(44, -8, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#402010';
  ctx.beginPath();
  ctx.arc(28, -16, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye gleam
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(29, -17, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ears (floppy)
  ctx.fillStyle = '#A06020';
  ctx.beginPath();
  ctx.ellipse(14, -22, 8, 14, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Tail (wagging)
  ctx.strokeStyle = '#C08030';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -5);
  ctx.quadraticCurveTo(-38, -20, -30, -30);
  ctx.stroke();

  // Legs (simple)
  ctx.fillStyle = '#C08030';
  for (const lx of [-14, -6, 10, 18]) {
    ctx.fillRect(lx - 3, 16, 6, 12);
  }
  // Paws
  ctx.fillStyle = '#D09040';
  for (const lx of [-14, -6, 10, 18]) {
    ctx.beginPath();
    ctx.ellipse(lx, 28, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Attack animation ────────────────────────────────────────────────────

function drawDogAttack(ctx, ts, tubeCount) {
  const atk = DOG.attacking;
  if (!atk) return;

  const elapsed = ts - atk.startTime;
  const totalDur = 1200;
  const t = Math.min(elapsed / totalDur, 1);

  const srcX = tubeCX(atk.sourceTube, tubeCount);
  const dstX = tubeCX(atk.destTube, tubeCount);
  const startX = DOG.side === 'left' ? -40 : CW + 40;
  const endX = DOG.side === 'left' ? CW + 40 : -40;
  const flip = DOG.side === 'right';
  const y = TUBE_BOT + 15;

  let dogX;
  if (t < 0.3) {
    // Run in to source tube
    const p = easeInOut(t / 0.3);
    dogX = startX + (srcX - startX) * p;
  } else if (t < 0.5) {
    // At source tube (grabbing ball)
    dogX = srcX;
  } else if (t < 0.8) {
    // Run to dest tube
    const p = easeInOut((t - 0.5) / 0.3);
    dogX = srcX + (dstX - srcX) * p;
  } else {
    // Run out
    const p = easeInOut((t - 0.8) / 0.2);
    dogX = dstX + (endX - dstX) * p;

    // Dust particles while running out
    if (Math.random() < 0.3) {
      spawnParticle(dogX, y + 20, (Math.random() - 0.5) * 2, -1 - Math.random() * 2,
        '#D0C0A0', 3 + Math.random() * 3, 300 + Math.random() * 200, 0.05);
    }
  }

  drawDogBody(ctx, dogX, y, flip);

  // Speech bubble when running out
  if (t > 0.85) {
    ctx.save();
    ctx.font = 'bold 14px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Hehe!', dogX, y - 40);
    ctx.restore();
  }
}

// ── Main draw function ──────────────────────────────────────────────────

export function drawDog(ctx, ts, tubeCount) {
  if (!DOG.active) return;

  // Warning phase
  if (DOG.warning) {
    drawWarningPaws(ctx, ts, DOG.side);
    drawWarningHighlight(ctx, ts, DOG.warning.sourceTube, tubeCount);
  }

  // Attack phase
  if (DOG.attacking) {
    drawDogAttack(ctx, ts, tubeCount);
  }
}
```

- [ ] **Step 2: Syntax check and commit**

```bash
node --check js/dog-renderer.js
git add js/dog-renderer.js
git commit -m "feat: add dog canvas rendering (body, paws, attack animation)"
```

---

### Task 7: Dog integration into game loop

**Files:**
- Modify: `js/main.js` — import dog, integrate into generateLevel and loop
- Modify: `js/render.js` — import and call drawDog
- Modify: `index.html` — add dog overlay

- [ ] **Step 1: Add dog overlay to index.html**

Find the `tetrisOverlay` section in `index.html` and add after it:

```html
        <!-- Dog level overlay -->
        <div id="dogOverlay" class="blitz-overlay">
            <div class="blitz-card">
                <h1 class="blitz-title">\uD83D\uDC36 STROLCH IST DA! \uD83D\uDC36</h1>
                <p class="blitz-sub">LEVEL <span id="dogLevel"></span> &middot; <span id="dogTier"></span></p>
                <p class="blitz-desc">Strolch klaut Knäuel und bringt Chaos!<br><em>Sortiere trotzdem alles richtig.</em></p>
                <button id="dogStartBtn" class="blitz-btn">BEREIT!</button>
            </div>
        </div>
```

- [ ] **Step 2: Import and integrate dog in main.js**

Add imports at the top of `main.js`:

```javascript
import { DOG, startDog, endDog, updateDog } from './dog.js';
import { isDogLevel } from './engine.js';
```

In `generateLevel`, after the tetris overlay block (around line 350), add:

```javascript
  if (isDogLevel(n) && !G.isDailyChallenge) {
    document.getElementById('dogLevel').textContent = n;
    document.getElementById('dogTier').textContent = cfg.tier;
    document.getElementById('dogOverlay').classList.add('show');
  }
```

Add the dog start button handler (near other button handlers):

```javascript
document.getElementById('dogStartBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('dogOverlay').classList.remove('show');
  startDog();
});
```

- [ ] **Step 3: Add dog update to game loop**

In the `loop` function, before `renderFrame(ctx, ts, G);`, add:

```javascript
  // Dog: update state machine
  if (DOG.active && !G.won) {
    const dogAction = updateDog(ts, G.tubes, G.solvedTubes, ANIM.busy);
    if (dogAction === 'attack') {
      playSound('click'); // placeholder — will add dog_bark later
      // Trigger bounce on dest tube
      const destTube = DOG.attacking.destTube;
      const ballIdx = G.tubes[destTube].length - 1;
      ANIM.bounceMap.set(`${destTube}-${ballIdx}`, {
        startTime: ts, duration: 480, amplitude: 8,
      });
      ANIM.tubeWobble.set(destTube, {
        startTime: ts, duration: 400, amplitude: 2 * Math.PI / 180,
      });
    }
  }
```

Also end the dog when the level is won. In the `showWin` function, add:

```javascript
  endDog();
```

And in `generateLevel`, reset dog state:

```javascript
  endDog();
```

- [ ] **Step 4: Integrate drawDog into render.js**

In `js/render.js`, add import:

```javascript
import { drawDog } from './dog-renderer.js';
```

In `renderFrame`, after `drawTubes(ctx, ts, G)` and before the arc ball drawing, add:

```javascript
  drawDog(ctx, ts, G.tubes.length);
```

- [ ] **Step 5: Syntax check and commit**

```bash
node --check js/main.js && node --check js/render.js
git add js/main.js js/render.js index.html
git commit -m "feat: integrate dog Strolch into game loop and rendering"
```

---

### Task 8: Dog audio

**Files:**
- Modify: `js/audio.js` — add dog sounds

- [ ] **Step 1: Add dog sounds to playSound**

In `js/audio.js`, add new cases in the `playSound` switch (before the closing `}`):

```javascript
    case 'dog_warn': {
      // Low growl/sniff — filtered noise burst
      const ctx = getCtx();
      if (!ctx) break;
      const now = ctx.currentTime;
      const bufLen = ctx.sampleRate * 0.5;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2 * _sfxVolume, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      src.connect(bp); bp.connect(g); g.connect(ctx.destination);
      src.start(now); src.stop(now + 0.5);
      break;
    }

    case 'dog_bark': {
      // Short "Wuff!" — oscillator bark
      const ctx = getCtx();
      if (!ctx) break;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3 * _sfxVolume, now);
      g.gain.setValueAtTime(0.3 * _sfxVolume, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
      break;
    }

    case 'dog_run': {
      // Quick patter of feet
      const ctx = getCtx();
      if (!ctx) break;
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800 + Math.random() * 400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now + i * 0.06);
        g.gain.linearRampToValueAtTime(0.1 * _sfxVolume, now + i * 0.06 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.05);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.05);
      }
      break;
    }
```

- [ ] **Step 2: Wire up sounds in main.js**

In the dog update section of the loop, replace the placeholder sound:

```javascript
    if (dogAction === 'warn') {
      // Play warn sound only once at start
      if (ts - DOG.warning.startTime < 50) playSound('dog_warn');
    }
    if (dogAction === 'attack') {
      playSound('dog_bark');
```

- [ ] **Step 3: Syntax check and commit**

```bash
node --check js/audio.js && node --check js/main.js
git add js/audio.js js/main.js
git commit -m "feat: add dog sound effects (growl, bark, patter)"
```

---

## Phase 4: Storage & Economy Extensions

### Task 9: Storage for new features

**Files:**
- Modify: `js/storage.js` — add milestones, skins, backgrounds, weekly storage

- [ ] **Step 1: Add new storage functions**

In `js/storage.js`, add at the end (before any closing comments):

```javascript
// ── Milestones ────────────────────────────────────────────────────────────
export function loadMilestones() {
  return loadJSON(key('milestones'), {});
}
export function saveMilestone(levelNum) {
  const m = loadMilestones();
  m[levelNum] = true;
  saveJSON(key('milestones'), m);
}

// ── Ball skins ────────────────────────────────────────────────────────────
export function loadSkins() {
  return loadJSON(key('skins'), { owned: ['default'], active: 'default' });
}
export function saveSkins(data) {
  saveJSON(key('skins'), data);
}

// ── Backgrounds ───────────────────────────────────────────────────────────
export function loadBackgrounds() {
  return loadJSON(key('backgrounds'), { owned: ['cafe'], active: 'cafe' });
}
export function saveBackgrounds(data) {
  saveJSON(key('backgrounds'), data);
}

// ── Weekly challenge ──────────────────────────────────────────────────────
export function loadWeekly() {
  return loadJSON(key('weekly'), { week: 0, completed: [false, false, false], frame: null });
}
export function saveWeekly(data) {
  saveJSON(key('weekly'), data);
}
```

- [ ] **Step 2: Syntax check and commit**

```bash
node --check js/storage.js
git add js/storage.js
git commit -m "feat: add storage for milestones, skins, backgrounds, weekly"
```

---

## Phase 5: Milestones

### Task 10: Milestone system

**Files:**
- Create: `js/milestones.js` — milestone definitions and check logic
- Modify: `js/main.js` — trigger milestones on win
- Modify: `index.html` — milestone overlay

- [ ] **Step 1: Create js/milestones.js**

```javascript
'use strict';

import { loadMilestones, saveMilestone } from './storage.js';
import { earn } from './economy.js';

export const MILESTONES = [
  { level: 25,  bones: 30,  reward: null,           label: 'Entdecker',  desc: '25 Level geschafft!' },
  { level: 50,  bones: 50,  reward: 'bg_garden',    label: 'Gärtner',    desc: 'Hintergrund "Garten" freigeschaltet!' },
  { level: 100, bones: 75,  reward: 'bg_rooftop',   label: 'Aufsteiger', desc: 'Hintergrund "Dachterrasse" freigeschaltet!' },
  { level: 150, bones: 100, reward: 'skin_glitter',  label: 'Funkeln',    desc: 'Ball-Skin "Glitzer" freigeschaltet!' },
  { level: 200, bones: 125, reward: 'bg_winter',     label: 'Winterkind', desc: 'Hintergrund "Winterstube" freigeschaltet!' },
  { level: 300, bones: 200, reward: 'skin_gold',     label: 'Legende',    desc: 'Ball-Skin "Gold" freigeschaltet!' },
];

/**
 * Check if a milestone was just reached. Returns milestone object or null.
 */
export function checkMilestone(levelNum) {
  const achieved = loadMilestones();
  const ms = MILESTONES.find(m => m.level === levelNum);
  if (!ms || achieved[levelNum]) return null;
  return ms;
}

/**
 * Claim a milestone — award bones, save, return reward info.
 */
export function claimMilestone(milestone) {
  earn(milestone.bones);
  saveMilestone(milestone.level);
  return milestone;
}
```

- [ ] **Step 2: Add milestone overlay to index.html**

After the achievement overlay in `index.html`, add:

```html
        <!-- Milestone overlay -->
        <div id="milestoneOverlay" class="cat-unlock-overlay">
            <div class="cat-unlock-card">
                <div class="milestone-icon" id="milestoneIcon">\u2B50</div>
                <h2 class="cat-unlock-name" id="milestoneLabel"></h2>
                <p class="cat-unlock-fact" id="milestoneDesc"></p>
                <p class="cat-unlock-fact" id="milestoneBones"></p>
                <button id="milestoneClose" class="cat-unlock-btn">Weiter</button>
            </div>
        </div>
```

- [ ] **Step 3: Integrate into showWin in main.js**

Import:

```javascript
import { checkMilestone, claimMilestone } from './milestones.js';
```

In `showWin`, after achievement checks (around line 660), add:

```javascript
  // Milestone check
  const milestone = checkMilestone(LEVEL.current);
  if (milestone) {
    const claimed = claimMilestone(milestone);
    updateBonesDisplay();
    setTimeout(() => {
      document.getElementById('milestoneIcon').textContent = '\u2B50';
      document.getElementById('milestoneLabel').textContent = claimed.label;
      document.getElementById('milestoneDesc').textContent = claimed.desc;
      document.getElementById('milestoneBones').textContent = '+' + claimed.bones + ' Fischgräten';
      document.getElementById('milestoneOverlay').classList.add('show');
    }, 2800); // after win animation
  }
```

Add close button handler:

```javascript
document.getElementById('milestoneClose').addEventListener('click', () => {
  document.getElementById('milestoneOverlay').classList.remove('show');
});
```

- [ ] **Step 4: Syntax check and commit**

```bash
node --check js/milestones.js && node --check js/main.js
git add js/milestones.js js/main.js index.html
git commit -m "feat: add milestone system with rewards at levels 25-300"
```

---

## Phase 6: Ball Skins

### Task 11: Ball skin system

**Files:**
- Create: `js/skins.js` — skin management
- Modify: `js/balls.js` — skin-aware rendering
- Modify: `js/main.js` — load active skin
- Modify: `index.html` — skin selector in settings

- [ ] **Step 1: Create js/skins.js**

```javascript
'use strict';

import { loadSkins, saveSkins } from './storage.js';

export const SKIN_DEFS = {
  default:  { name: 'Wollknäuel', cost: 0 },
  glitter:  { name: 'Glitzer',    cost: 50 },
  crystal:  { name: 'Kristall',   cost: 80 },
  gold:     { name: 'Goldfaden',  cost: 100 },
};

let _activeSkin = 'default';

export function getActiveSkin() { return _activeSkin; }

export function setActiveSkin(id) {
  _activeSkin = id;
  const data = loadSkins();
  data.active = id;
  saveSkins(data);
}

export function ownsSkin(id) {
  return loadSkins().owned.includes(id);
}

export function unlockSkin(id) {
  const data = loadSkins();
  if (!data.owned.includes(id)) {
    data.owned.push(id);
    saveSkins(data);
  }
}

export function initSkins() {
  const data = loadSkins();
  _activeSkin = data.active || 'default';
}
```

- [ ] **Step 2: Add skin-specific drawing to balls.js**

In `js/balls.js`, import the skin getter:

```javascript
import { getActiveSkin } from './skins.js';
```

In the `drawBall` function, after the yarn strand texture section (around line 104) and before the cat face, add skin-specific overrides:

```javascript
    const skin = getActiveSkin();
    if (skin === 'glitter' && colorId !== 'joker') {
      // Sparkle particles on surface
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let s = 0; s < 6; s++) {
        const angle = (ts * 0.002 + s * 1.05) % (Math.PI * 2);
        const sr = R * 0.5 + Math.sin(ts * 0.003 + s) * R * 0.3;
        const sx = cx + Math.cos(angle) * sr;
        const sy = cy + Math.sin(angle) * sr;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (skin === 'crystal' && colorId !== 'joker') {
      // Faceted reflections
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      for (let f = 0; f < 5; f++) {
        const a1 = f * 1.26;
        const a2 = a1 + 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    } else if (skin === 'gold' && colorId !== 'joker') {
      // Gold thread overlay
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      ctx.clip();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        const gy = cy - R * 0.6 + g * R * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx - R, gy);
        ctx.quadraticCurveTo(cx, gy + 8 * Math.sin(ts * 0.003 + g), cx + R, gy);
        ctx.stroke();
      }
      ctx.restore();
    }
```

- [ ] **Step 3: Add skin selector to settings in index.html**

In the settings screen, after the SFX volume control, add:

```html
      <label>Ball-Skin</label>
      <div class="settings-control">
        <select id="skinSelector" class="settings-selector">
          <option value="default">Wollknäuel</option>
          <option value="glitter">Glitzer (50\uD83D\uDC1F)</option>
          <option value="crystal">Kristall (80\uD83D\uDC1F)</option>
          <option value="gold">Goldfaden (100\uD83D\uDC1F)</option>
        </select>
      </div>
```

- [ ] **Step 4: Wire up skin selector in main.js**

Import:

```javascript
import { initSkins, getActiveSkin, setActiveSkin, ownsSkin, unlockSkin, SKIN_DEFS } from './skins.js';
```

In the bootstrap section (bottom of file), add:

```javascript
initSkins();
```

Add event listener for skin selector:

```javascript
document.getElementById('skinSelector').addEventListener('change', e => {
  const id = e.target.value;
  if (id === 'default' || ownsSkin(id)) {
    setActiveSkin(id);
    playSound('click');
  } else {
    // Not owned — check if player can afford it
    const cost = SKIN_DEFS[id]?.cost || 0;
    if (getBalance() >= cost) {
      setBalance(getBalance() - cost);
      unlockSkin(id);
      setActiveSkin(id);
      updateBonesDisplay();
      playSound('cat_unlock');
    } else {
      e.target.value = getActiveSkin();
      playSound('invalid');
    }
  }
});
```

Also set the selector to current skin when settings open:

Find where `showSettingsScreen` is called or the settings button handler, and add:

```javascript
document.getElementById('skinSelector').value = getActiveSkin();
```

- [ ] **Step 5: Syntax check and commit**

```bash
node --check js/skins.js && node --check js/balls.js && node --check js/main.js
git add js/skins.js js/balls.js js/main.js index.html
git commit -m "feat: add ball skin system (glitter, crystal, gold)"
```

---

## Phase 7: Backgrounds

### Task 12: Background system

**Files:**
- Modify: `js/background.js` — add alternate background scenes
- Modify: `js/main.js` — load/apply active background
- Modify: `index.html` — background selector in settings
- Modify: `js/storage.js` — already done in Task 9

- [ ] **Step 1: Add background variants to background.js**

In `js/background.js`, the main export is `drawBackground(ctx, ts, theme, prevTheme, fade)`. Add a background ID parameter and alternate scenes.

Change the function signature:

```javascript
export function drawBackground(ctx, ts, theme, prevTheme, fade, bgId = 'cafe') {
```

At the top of the function body, add routing:

```javascript
  if (bgId === 'garden') return drawGardenBg(ctx, ts, theme);
  if (bgId === 'rooftop') return drawRooftopBg(ctx, ts, theme);
  if (bgId === 'winter') return drawWinterBg(ctx, ts, theme);
  // Default: existing café code continues below
```

Then add the three new functions at the end of the file:

```javascript
// ── Garden background ───────────────────────────────────────────────────

function drawGardenBg(ctx, ts, theme) {
  const t = THEMES[theme] || THEMES.EASY;

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(1, '#B0E0D0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH * 0.5);

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 3; i++) {
    const cx = ((ts * 0.01 + i * 160) % (CW + 100)) - 50;
    const cy = 40 + i * 30;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy - 8, 20, 0, Math.PI * 2);
    ctx.arc(cx + 35, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass
  const grass = ctx.createLinearGradient(0, CH * 0.45, 0, CH);
  grass.addColorStop(0, '#5B8C3E');
  grass.addColorStop(1, '#3D6B2E');
  ctx.fillStyle = grass;
  ctx.fillRect(0, CH * 0.45, CW, CH * 0.55);

  // Flowers
  const colors = ['#FF6B8A', '#FFD700', '#FF8C42', '#E066FF'];
  for (let i = 0; i < 8; i++) {
    const fx = 20 + i * 55 + Math.sin(ts * 0.002 + i) * 5;
    const fy = CH * 0.48 + Math.sin(i * 2.1) * 15;
    ctx.fillStyle = colors[i % colors.length];
    for (let p = 0; p < 5; p++) {
      const pa = (Math.PI * 2 * p) / 5;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(pa) * 5, fy + Math.sin(pa) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Table surface (reuse existing logic shape)
  drawTableSurface(ctx, t);
  drawVignette(ctx);
}

// ── Rooftop background ──────────────────────────────────────────────────

function drawRooftopBg(ctx, ts, theme) {
  const t = THEMES[theme] || THEMES.EASY;

  // Sunset sky
  const sky = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  sky.addColorStop(0, '#1a1a3e');
  sky.addColorStop(0.4, '#4a2c6a');
  sky.addColorStop(0.7, '#c05050');
  sky.addColorStop(1, '#e8a040');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH * 0.5);

  // Stars (subtle)
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 12; i++) {
    const sx = (i * 37 + 13) % CW;
    const sy = (i * 23 + 7) % (CH * 0.3);
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(ts * 0.001 + i * 1.7));
    ctx.globalAlpha = twinkle * 0.4;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // City silhouette
  ctx.fillStyle = '#1a1a2e';
  const buildings = [
    [0, 0.38, 40], [45, 0.32, 35], [85, 0.42, 30], [120, 0.35, 45],
    [170, 0.28, 35], [210, 0.40, 40], [255, 0.33, 30], [290, 0.45, 35],
    [330, 0.30, 40], [375, 0.38, 45],
  ];
  for (const [bx, hFrac, bw] of buildings) {
    const bh = CH * hFrac;
    ctx.fillRect(bx, CH * 0.5 - bh, bw, bh);
  }

  // Rooftop floor
  const floor = ctx.createLinearGradient(0, CH * 0.5, 0, CH);
  floor.addColorStop(0, '#4a4040');
  floor.addColorStop(1, '#2a2020');
  ctx.fillStyle = floor;
  ctx.fillRect(0, CH * 0.5, CW, CH * 0.5);

  // String lights
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, CH * 0.48);
  for (let lx = 0; lx <= CW; lx += 5) {
    ctx.lineTo(lx, CH * 0.48 + Math.sin(lx * 0.03) * 8);
  }
  ctx.stroke();
  // Light bulbs
  for (let lx = 20; lx < CW; lx += 40) {
    const ly = CH * 0.48 + Math.sin(lx * 0.03) * 8;
    const glow = 0.5 + 0.3 * Math.sin(ts * 0.003 + lx * 0.1);
    ctx.fillStyle = `rgba(255, 220, 100, ${glow})`;
    ctx.beginPath();
    ctx.arc(lx, ly + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawTableSurface(ctx, t);
  drawVignette(ctx);
}

// ── Winter background ───────────────────────────────────────────────────

function drawWinterBg(ctx, ts, theme) {
  const t = THEMES[theme] || THEMES.EASY;

  // Cozy wall
  const wall = ctx.createLinearGradient(0, 0, 0, CH * 0.5);
  wall.addColorStop(0, '#4a3525');
  wall.addColorStop(1, '#6a4a35');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, CW, CH * 0.5);

  // Window with snow
  ctx.fillStyle = '#8ab4d8';
  ctx.fillRect(CW * 0.6, CH * 0.05, CW * 0.3, CH * 0.25);
  // Window frame
  ctx.strokeStyle = '#5a3a20';
  ctx.lineWidth = 4;
  ctx.strokeRect(CW * 0.6, CH * 0.05, CW * 0.3, CH * 0.25);
  ctx.beginPath();
  ctx.moveTo(CW * 0.75, CH * 0.05);
  ctx.lineTo(CW * 0.75, CH * 0.30);
  ctx.moveTo(CW * 0.6, CH * 0.175);
  ctx.lineTo(CW * 0.9, CH * 0.175);
  ctx.stroke();

  // Snow on windowsill
  ctx.fillStyle = '#e8e8f0';
  ctx.beginPath();
  ctx.ellipse(CW * 0.75, CH * 0.30, CW * 0.17, 8, 0, 0, Math.PI);
  ctx.fill();

  // Snowflakes outside window
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 8; i++) {
    const sx = CW * 0.6 + ((ts * 0.02 + i * 17) % (CW * 0.3));
    const sy = CH * 0.05 + ((ts * 0.015 + i * 23) % (CH * 0.25));
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wooden floor
  const floor = ctx.createLinearGradient(0, CH * 0.45, 0, CH);
  floor.addColorStop(0, '#5a3a22');
  floor.addColorStop(1, '#3a2515');
  ctx.fillStyle = floor;
  ctx.fillRect(0, CH * 0.45, CW, CH * 0.55);

  // Warm glow from imaginary fireplace (left side)
  ctx.save();
  const glow = ctx.createRadialGradient(30, CH * 0.4, 0, 30, CH * 0.4, 200);
  glow.addColorStop(0, 'rgba(255, 140, 40, 0.15)');
  glow.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  drawTableSurface(ctx, t);
  drawVignette(ctx);
}
```

You'll need to extract `drawTableSurface` and `drawVignette` as helper functions from the existing code. Find the table drawing section (around lines 134-173) and the vignette section (around lines 190-195) and refactor them into standalone functions:

```javascript
function drawTableSurface(ctx, t) {
  // ... existing table oval code from lines 134-173
}

function drawVignette(ctx) {
  // ... existing vignette code from lines 190-195
}
```

- [ ] **Step 2: Add background selector to settings in index.html**

After the skin selector in settings, add:

```html
      <label>Hintergrund</label>
      <div class="settings-control">
        <select id="bgSelector" class="settings-selector">
          <option value="cafe">Katzencaf\u00e9</option>
          <option value="garden">Garten (\u2B50 Lvl 50)</option>
          <option value="rooftop">Dachterrasse (\u2B50 Lvl 100)</option>
          <option value="winter">Winterstube (\u2B50 Lvl 200)</option>
        </select>
      </div>
```

- [ ] **Step 3: Wire up background in main.js**

Import:

```javascript
import { loadBackgrounds, saveBackgrounds } from './storage.js';
```

Add a global for active background:

```javascript
let activeBackground = 'cafe';
```

In bootstrap:

```javascript
activeBackground = loadBackgrounds().active;
```

Pass to renderFrame — in the `renderFrame` call, you'll need to pass `activeBackground` through to `drawBackground`. The simplest way: store it on `G`:

```javascript
G.background = activeBackground;
```

In `render.js`, modify the `drawBackground` call in `renderFrame` to pass `G.background`:

```javascript
drawBackground(ctx, ts, G.theme, G.themePrev, G.themeFade, G.background || 'cafe');
```

Add event listener for background selector:

```javascript
document.getElementById('bgSelector').addEventListener('change', e => {
  const id = e.target.value;
  const owned = loadBackgrounds().owned;
  if (owned.includes(id)) {
    activeBackground = id;
    G.background = id;
    const data = loadBackgrounds();
    data.active = id;
    saveBackgrounds(data);
    invalidateRoomDecorCache();
    playSound('click');
  } else {
    e.target.value = activeBackground;
    playSound('invalid');
  }
});
```

- [ ] **Step 4: Unlock backgrounds from milestones**

In `js/milestones.js`, in `claimMilestone`, add background/skin unlocking:

```javascript
import { loadBackgrounds, saveBackgrounds } from './storage.js';
import { unlockSkin } from './skins.js';

export function claimMilestone(milestone) {
  earn(milestone.bones);
  saveMilestone(milestone.level);

  // Unlock associated reward
  if (milestone.reward) {
    if (milestone.reward.startsWith('bg_')) {
      const bgId = milestone.reward.replace('bg_', '');
      const bgs = loadBackgrounds();
      if (!bgs.owned.includes(bgId)) {
        bgs.owned.push(bgId);
        saveBackgrounds(bgs);
      }
    } else if (milestone.reward.startsWith('skin_')) {
      const skinId = milestone.reward.replace('skin_', '');
      unlockSkin(skinId);
    }
  }

  return milestone;
}
```

- [ ] **Step 5: Syntax check and commit**

```bash
node --check js/background.js && node --check js/milestones.js && node --check js/main.js && node --check js/render.js
git add js/background.js js/milestones.js js/main.js js/render.js index.html
git commit -m "feat: add 3 unlockable backgrounds (garden, rooftop, winter)"
```

---

## Phase 8: Weekly Challenge

### Task 13: Weekly challenge system

**Files:**
- Create: `js/weekly.js` — weekly challenge logic
- Modify: `js/main.js` — weekly UI integration
- Modify: `index.html` — weekly challenge button and overlay

- [ ] **Step 1: Create js/weekly.js**

```javascript
'use strict';

import { loadWeekly, saveWeekly } from './storage.js';
import { generateTubes, levelConfig } from './engine.js';

function getISOWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const WEEKLY_TIERS = ['MEDIUM', 'HARD', 'EXPERT'];
const WEEKLY_FRAMES = ['gold', 'silver', 'bronze', 'diamond'];

/**
 * Get the current weekly challenge state, resetting if it's a new week.
 */
export function getWeeklyState() {
  const currentWeek = getISOWeek();
  let state = loadWeekly();
  if (state.week !== currentWeek) {
    state = {
      week: currentWeek,
      completed: [false, false, false],
      frame: WEEKLY_FRAMES[currentWeek % WEEKLY_FRAMES.length],
    };
    saveWeekly(state);
  }
  return state;
}

/**
 * Generate tubes for a weekly challenge round (0, 1, or 2).
 */
export function generateWeeklyTubes(round) {
  const week = getISOWeek();
  const seed = week * 1000 + round;
  // Use a level number that corresponds to the tier difficulty
  const tierLevelMap = { MEDIUM: 25, HARD: 60, EXPERT: 120 };
  const fakeLevelNum = tierLevelMap[WEEKLY_TIERS[round]] || 25;
  return generateTubes(fakeLevelNum, seed);
}

/**
 * Get config for a weekly round.
 */
export function getWeeklyConfig(round) {
  const tierLevelMap = { MEDIUM: 25, HARD: 60, EXPERT: 120 };
  const fakeLevelNum = tierLevelMap[WEEKLY_TIERS[round]] || 25;
  return { ...levelConfig(fakeLevelNum), tier: WEEKLY_TIERS[round] };
}

/**
 * Mark a weekly round as completed.
 */
export function completeWeeklyRound(round) {
  const state = getWeeklyState();
  state.completed[round] = true;
  saveWeekly(state);
  return state.completed.every(Boolean); // true if all 3 done
}

/**
 * Check if weekly challenge is fully completed.
 */
export function isWeeklyDone() {
  return getWeeklyState().completed.every(Boolean);
}

/**
 * Get the next uncompleted weekly round (0-2), or -1 if all done.
 */
export function nextWeeklyRound() {
  const state = getWeeklyState();
  return state.completed.indexOf(false);
}

export function getWeeklyFrame() {
  return getWeeklyState().frame;
}
```

- [ ] **Step 2: Add weekly UI to index.html**

In the level select section, after the daily challenge button, add:

```html
        <button id="weeklyBtn" class="menu-btn weekly-btn">\uD83C\uDFC6 Wochen-Challenge</button>
```

Add a weekly overlay (after the daily overlay):

```html
        <!-- Weekly challenge overlay -->
        <div id="weeklyOverlay" class="blitz-overlay">
            <div class="blitz-card">
                <h1 class="blitz-title">\uD83C\uDFC6 WOCHEN-CHALLENGE</h1>
                <div id="weeklyProgress" class="weekly-progress"></div>
                <p class="blitz-desc" id="weeklyDesc"></p>
                <button id="weeklyStartBtn" class="blitz-btn">LOS!</button>
            </div>
        </div>
```

Add basic CSS for weekly progress in `css/game.css`:

```css
.weekly-progress { display: flex; gap: .5rem; justify-content: center; margin: .5rem 0; }
.weekly-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--gold); }
.weekly-dot.done { background: var(--gold); }
```

- [ ] **Step 3: Wire up weekly challenge in main.js**

Import:

```javascript
import { getWeeklyState, generateWeeklyTubes, getWeeklyConfig, completeWeeklyRound, nextWeeklyRound, isWeeklyDone } from './weekly.js';
```

Add button handler:

```javascript
document.getElementById('weeklyBtn').addEventListener('click', () => {
  playSound('click');
  if (isWeeklyDone()) {
    // Already done this week
    document.getElementById('weeklyDesc').textContent = 'Diese Woche bereits abgeschlossen! \u2705';
    document.getElementById('weeklyStartBtn').style.display = 'none';
  } else {
    const round = nextWeeklyRound();
    document.getElementById('weeklyDesc').textContent =
      `Runde ${round + 1} von 3 \u2014 ${['MEDIUM', 'HARD', 'EXPERT'][round]}`;
    document.getElementById('weeklyStartBtn').style.display = '';
  }

  // Update progress dots
  const state = getWeeklyState();
  const prog = document.getElementById('weeklyProgress');
  prog.innerHTML = state.completed.map((done, i) =>
    `<div class="weekly-dot ${done ? 'done' : ''}"></div>`
  ).join('');

  closeLevelSelect();
  document.getElementById('weeklyOverlay').classList.add('show');
});

document.getElementById('weeklyStartBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('weeklyOverlay').classList.remove('show');

  const round = nextWeeklyRound();
  if (round < 0) return;

  const cfg = getWeeklyConfig(round);
  G.tubes = generateWeeklyTubes(round);
  G.isDailyChallenge = false;
  G.isWeeklyChallenge = true;
  G.weeklyRound = round;

  // Set up game state similar to generateLevel
  G.moves = 0;
  G.history = [];
  G.selected = -1;
  G.selectedTime = -1;
  G.won = false;
  G.hintFrom = -1;
  G.hintTo = -1;
  G.hintUntil = 0;
  G.solvedTubes = new Set();
  G.frozenBalls = new Set();
  resetAnim();

  const newTheme = cfg.tier;
  G.theme = newTheme;
  document.getElementById('levelLabel').textContent = `WOCHEN ${round + 1}/3 \u2022 ${cfg.tier}`;
  updateHUD();
  hideOverlay();
});
```

Add to `G` object:

```javascript
  isWeeklyChallenge: false,
  weeklyRound:       0,
```

In `showWin`, add weekly completion check (before achievement checks):

```javascript
  if (G.isWeeklyChallenge) {
    const allDone = completeWeeklyRound(G.weeklyRound);
    if (allDone) {
      earn(50); // bonus fishbones for completing all 3
      updateBonesDisplay();
    }
    G.isWeeklyChallenge = false;
  }
```

- [ ] **Step 4: Syntax check and commit**

```bash
node --check js/weekly.js && node --check js/main.js
git add js/weekly.js js/main.js index.html css/game.css
git commit -m "feat: add weekly challenge system (3 rounds, bonus reward)"
```

---

## Phase 9: Final Integration & Polish

### Task 14: CSS styling for new UI elements

**Files:**
- Modify: `css/game.css` — styles for settings selectors, milestone overlay, dog overlay

- [ ] **Step 1: Add CSS for new elements**

In `css/game.css`, add:

```css
/* ── Settings selectors ──────────────────────────────── */
.settings-selector {
    width: 100%;
    padding: .4rem .6rem;
    border: 1px solid rgba(255,215,0,.3);
    border-radius: 6px;
    background: rgba(0,0,0,.3);
    color: var(--gold);
    font-family: var(--f-head);
    font-size: .7rem;
    outline: none;
}
.settings-selector:focus { border-color: var(--gold); }

/* ── Milestone overlay ───────────────────────────────── */
.milestone-icon {
    font-size: 3rem;
    text-align: center;
    margin-bottom: .5rem;
}

/* ── Weekly button ───────────────────────────────────── */
.weekly-btn {
    background: linear-gradient(180deg, #8B5CF6, #6D28D9) !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/game.css
git commit -m "feat: add CSS for settings selectors, milestone, and weekly UI"
```

---

### Task 15: Browser testing and final verification

- [ ] **Step 1: Syntax check all files**

```bash
node --check js/main.js && node --check js/render.js && node --check js/engine.js && node --check js/balls.js && node --check js/dog.js && node --check js/dog-renderer.js && node --check js/milestones.js && node --check js/skins.js && node --check js/weekly.js && node --check js/animations.js && node --check js/audio.js && node --check js/storage.js && node --check js/background.js && echo "All files pass syntax check"
```

- [ ] **Step 2: Test in browser**

Start local server and verify:
1. Normal level (1-9): plays normally, tube-clear effect works
2. Dog level (10): Strolch overlay appears, dog attacks during gameplay
3. Level 20+: joker ball sometimes appears, acts as wildcard
4. Level 30+: ice ball sometimes appears at tube bottom, thaws when exposed
5. Settings: skin and background selectors work
6. Weekly challenge: button opens overlay, rounds play correctly
7. Milestone at level 25: overlay appears with reward

- [ ] **Step 3: Final commit and deploy**

```bash
git push origin master
```
