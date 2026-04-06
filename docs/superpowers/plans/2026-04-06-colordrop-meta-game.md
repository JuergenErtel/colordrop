# Color Drop Meta-Game & HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dynamic level generator (3 difficulty tiers), a Glassmorphismus HUD overlay over the canvas, a Next Level / Menu win screen, and sound placeholder hooks to `index.html`.

**Architecture:** All changes are confined to the single `index.html` file. The v2 animation engine (G, ANIM, render loop) is untouched. A new `LEVEL` object tracks the current level number. `generateLevel(n)` replaces `initLevel()` entirely. The HUD is a `position:absolute` HTML div layered over the canvas inside a new `.canvas-inner` wrapper.

**Tech Stack:** Vanilla JS, HTML5 Canvas, CSS (no build tooling).

---

## File Structure

Only one file is modified throughout:

- **Modify:** `index.html`
  - CSS section (lines ~11–210): add `.canvas-inner`, `.hud-overlay`, `.hud-btn`, `.hud-level`, `.win-actions`, `.win-btn--secondary`
  - HTML section (lines ~213–242): restructure canvas-wrap, update win-card
  - JS section (lines ~244–1075): add LEVEL, levelConfig, checkWinState, generateLevel, playSound; update updateHUD, showWin, updateArc, doMove, event listeners, bootstrap

---

## Task 1: Level Generator

**Files:**
- Modify: `index.html` — JS section only

The existing `initLevel()` function (line ~384) hardcodes 2 colours and a shuffled pool. This task replaces it with a parametric `generateLevel(n)` that builds any tier configuration and shuffles from a guaranteed-solvable state.

- [ ] **Step 1: Add LEVEL object and levelConfig() directly after the ANIM block (around line 310)**

Find this exact line:
```js
const ANIM = {
    arc:       null,         // ArcAnim | null
    bounceMap: new Map(),    // "tubeIdx-ballIdx" → BounceAnim
    particles: [],           // Particle[]
    busy:      false,        // blocks input during arc
};
```

Insert immediately after the closing `};`:

```js

/* ═══════════════════════════════════════════════════════════
   LEVEL STATE
═══════════════════════════════════════════════════════════ */

const LEVEL = { current: 1 };

/**
 * Returns tube/colour configuration for a given level number.
 * Tier 1 (1–5):  4 tubes, 2 colours, 2 empty.
 * Tier 2 (6–15): 5 tubes, 3 colours, 2 empty.
 * Tier 3 (16+):  7 tubes, 5 colours, 2 empty.
 */
function levelConfig(n) {
    if (n <= 5)  return { colors: ['cyan','magenta'],                        empty: 2 };
    if (n <= 15) return { colors: ['cyan','magenta','lime'],                 empty: 2 };
    return           { colors: ['cyan','magenta','lime','yellow','orange'], empty: 2 };
}

/**
 * Pure win-check on an arbitrary tubes array — no G side-effects.
 * Used by generateLevel to detect accidental re-solved states.
 */
function checkWinState(tubes) {
    return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(c => c === t[0])));
}
```

- [ ] **Step 2: Add generateLevel() immediately after checkWinState()**

```js
/**
 * Build a level by backwards-shuffling from a solved state.
 * Guaranteed solvable because every move is a legal game move.
 *
 * @param {number} n  Level number (1-based)
 */
function generateLevel(n) {
    LEVEL.current  = n;
    const cfg      = levelConfig(n);

    // 1. Start from solved state
    const tubes = cfg.colors.map(c => [c, c, c, c]);
    for (let i = 0; i < cfg.empty; i++) tubes.push([]);

    // 2. Apply random valid moves to shuffle (more moves = harder)
    const shuffleCount = 20 + n * 3;
    for (let s = 0; s < shuffleCount; s++) {
        const candidates = [];
        for (let si = 0; si < tubes.length; si++) {
            if (tubes[si].length === 0) continue;
            for (let di = 0; di < tubes.length; di++) {
                if (di === si) continue;
                if (tubes[di].length >= 4) continue;
                if (tubes[di].length > 0 &&
                    tubes[di][tubes[di].length - 1] !== tubes[si][tubes[si].length - 1]) continue;
                candidates.push({ si, di });
            }
        }
        if (candidates.length > 0) {
            const { si, di } = candidates[Math.floor(Math.random() * candidates.length)];
            tubes[di].push(tubes[si].pop());
        }
    }

    // 3. Retry if shuffle accidentally produced a solved state
    if (checkWinState(tubes)) { generateLevel(n); return; }

    // 4. Write into game state
    G.tubes        = tubes;
    G.selected     = -1;
    G.selectedTime = -1;
    G.moves        = 0;
    G.history      = [];
    G.won          = false;
    G.flashTube    = -1;
    G.flashUntil   = 0;
    G.solvedTubes  = new Set();
    ANIM.arc       = null;
    ANIM.bounceMap = new Map();
    ANIM.particles = [];
    ANIM.busy      = false;

    updateHUD();
    hideOverlay();
}
```

- [ ] **Step 3: Replace the bootstrap call at the bottom of the file**

Find (line ~1073):
```js
resizeCanvas();   // size canvas before first paint
initLevel();      // build level 1
requestAnimationFrame(render);  // start game loop
```

Replace with:
```js
resizeCanvas();         // size canvas before first paint
generateLevel(1);       // build level 1
requestAnimationFrame(render);  // start game loop
```

- [ ] **Step 4: Verify in browser**

Open `index.html`. The game should start on Level 1 (2 colours, 4 tubes) and be playable. Console must be error-free. Undo and the old reset button still work (they call `initLevel` which still exists — we'll wire them properly in Task 2).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add LEVEL object, levelConfig, checkWinState, generateLevel"
```

---

## Task 2: HUD Overlay (HTML + CSS + JS wiring)

**Files:**
- Modify: `index.html` — CSS, HTML, and JS sections

This task adds the `.canvas-inner` wrapper, the `.hud-overlay` glassmorphism strip, and removes the Undo/Reset buttons from the `.controls` strip. It also updates `updateHUD()` and `updateArc()` to keep the undo button state in sync.

- [ ] **Step 1: Add CSS for canvas-inner, hud-overlay, hud-btn, hud-level**

Find this CSS block (line ~80):
```css
        /* ── Canvas container ───────────────────────────────── */
        .canvas-wrap { width: 100%; display: flex; justify-content: center; }
```

Replace with:
```css
        /* ── Canvas container ───────────────────────────────── */
        .canvas-wrap { width: 100%; display: flex; justify-content: center; }

        /* Inner wrapper shrinks to canvas CSS width so the HUD aligns exactly */
        .canvas-inner { position: relative; display: inline-block; }

        /* HUD strip overlaid on top of the canvas */
        .hud-overlay {
            position: absolute;
            top: 0; left: 0; right: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: rgba(8,12,20,.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-bottom: 1px solid rgba(255,255,255,.08);
            border-radius: 20px 20px 0 0;
            z-index: 10;
        }

        .hud-btn {
            width: 38px; height: 38px;
            border-radius: 50%;
            background: rgba(255,255,255,.07);
            border: 1px solid rgba(255,255,255,.12);
            color: var(--text);
            font-size: 1rem;
            line-height: 1;
            cursor: pointer;
            transition: background .15s, border-color .15s, transform .1s, opacity .2s;
        }
        .hud-btn:hover         { background: rgba(255,255,255,.13); border-color: rgba(255,255,255,.25); }
        .hud-btn:active        { transform: scale(.92); }
        .hud-btn:disabled      { opacity: .35; cursor: default; pointer-events: none; }

        .hud-level {
            font-family: var(--f-head);
            font-size: 1.1rem;
            letter-spacing: .08em;
            color: var(--gold);
        }
```

- [ ] **Step 2: Restructure the canvas-wrap HTML**

Find (line ~220):
```html
        <div class="canvas-wrap">
            <canvas id="c"></canvas>
        </div>
```

Replace with:
```html
        <div class="canvas-wrap">
            <div class="canvas-inner">
                <canvas id="c"></canvas>
                <div class="hud-overlay">
                    <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
                    <span class="hud-level" id="levelLabel">LEVEL 1</span>
                    <button class="hud-btn" id="resetBtn" aria-label="Reset">↺</button>
                </div>
            </div>
        </div>
```

- [ ] **Step 3: Remove Undo/Reset buttons from the controls strip**

Find (line ~224):
```html
        <div class="controls">
            <button class="btn" id="undoBtn">↩ Undo</button>
            <div class="moves-pill">
                <span class="moves-n" id="moveCount">0</span>
                <span class="moves-l">moves</span>
            </div>
            <button class="btn" id="resetBtn">↺ Reset</button>
        </div>
```

Replace with:
```html
        <div class="controls">
            <div class="moves-pill">
                <span class="moves-n" id="moveCount">0</span>
                <span class="moves-l">moves</span>
            </div>
        </div>
```

- [ ] **Step 4: Update updateHUD() to set levelLabel and undo button state**

Find (line ~1016):
```js
function updateHUD() {
    document.getElementById('moveCount').textContent = G.moves;
}
```

Replace with:
```js
function updateHUD() {
    document.getElementById('moveCount').textContent  = G.moves;
    document.getElementById('levelLabel').textContent = 'LEVEL ' + LEVEL.current;
    document.getElementById('undoBtn').disabled       = G.history.length === 0 || ANIM.busy;
}
```

- [ ] **Step 5: Add updateHUD() call inside updateArc() after arc clears**

Find (line ~713):
```js
    ANIM.arc  = null;
    ANIM.busy = false;

    // Win check (after arc clears so overlay appears after animation)
    if (checkWin()) {
```

Replace with:
```js
    ANIM.arc  = null;
    ANIM.busy = false;
    updateHUD();   // re-enable undo button now that arc is done

    // Win check (after arc clears so overlay appears after animation)
    if (checkWin()) {
```

- [ ] **Step 6: Update event listeners to use generateLevel**

Find (line ~1061):
```js
document.getElementById('undoBtn'   ).addEventListener('click', undo);
document.getElementById('resetBtn'  ).addEventListener('click', initLevel);
document.getElementById('playAgain' ).addEventListener('click', initLevel);
```

Replace with:
```js
document.getElementById('undoBtn' ).addEventListener('click', undo);
document.getElementById('resetBtn').addEventListener('click', () => generateLevel(LEVEL.current));
```

(The `playAgain` listener is removed here; it will be replaced by `nextLevelBtn`/`menuBtn` in Task 3.)

- [ ] **Step 7: Verify in browser**

- HUD strip appears at top of canvas with ↩ left, LEVEL 1 centre, ↺ right
- Undo button is disabled (greyed) at game start
- After one move, undo button becomes active
- ↺ resets to the same level number (new shuffle)
- Moves counter still shows at bottom

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: HUD glassmorphism overlay with level label and icon buttons"
```

---

## Task 3: Win Overlay Update

**Files:**
- Modify: `index.html` — CSS, HTML, and JS sections

Replace the single "Play Again" button with "Next Level →" and "Menu", add the level number to the win message, and wire the new event listeners.

- [ ] **Step 1: Add CSS for win-actions and secondary button variant**

Find this CSS block (line ~195):
```css
        .win-btn {
            margin-top: .4rem;
```

Insert immediately **before** `.win-btn {`:
```css
        .win-actions {
            display: flex;
            gap: .75rem;
            margin-top: .4rem;
        }

```

Then find (line ~209):
```css
        .win-btn:hover { background: rgba(247,201,72,.20); border-color: rgba(247,201,72,.65); }
```

Add immediately after that line:
```css
        .win-btn--secondary {
            background: rgba(255,255,255,.06);
            border-color: rgba(255,255,255,.15);
            color: var(--muted);
        }
        .win-btn--secondary:hover {
            background: rgba(255,255,255,.12);
            border-color: rgba(255,255,255,.30);
            color: var(--text);
        }
```

- [ ] **Step 2: Update win-card HTML**

Find (line ~235):
```html
    <div class="overlay" id="overlay">
        <div class="win-card">
            <div class="win-icon">🏆</div>
            <h2 class="win-title">Solved!</h2>
            <p class="win-sub">Completed in <b id="finalMoves">0</b> moves</p>
            <button class="win-btn" id="playAgain">Play Again</button>
        </div>
    </div>
```

Replace with:
```html
    <div class="overlay" id="overlay">
        <div class="win-card">
            <div class="win-icon">🏆</div>
            <h2 class="win-title">Solved!</h2>
            <p class="win-sub">Level <b id="finalLevel">1</b> — <b id="finalMoves">0</b> Züge</p>
            <div class="win-actions">
                <button class="win-btn" id="nextLevelBtn">Next Level →</button>
                <button class="win-btn win-btn--secondary" id="menuBtn">Menu</button>
            </div>
        </div>
    </div>
```

- [ ] **Step 3: Update showWin() to include the level number**

Find (line ~1020):
```js
function showWin() {
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('overlay').classList.add('show');
}
```

Replace with:
```js
function showWin() {
    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('overlay').classList.add('show');
}
```

- [ ] **Step 4: Wire nextLevelBtn and menuBtn event listeners**

Find the event listeners block (after the resetBtn listener added in Task 2):
```js
document.getElementById('undoBtn' ).addEventListener('click', undo);
document.getElementById('resetBtn').addEventListener('click', () => generateLevel(LEVEL.current));
```

Add immediately after:
```js
document.getElementById('nextLevelBtn').addEventListener('click', () => {
    LEVEL.current++;
    generateLevel(LEVEL.current);
});
document.getElementById('menuBtn').addEventListener('click', () => {
    LEVEL.current = 1;
    generateLevel(1);
});
```

- [ ] **Step 5: Verify in browser**

- Solve Level 1 (e.g., move all cyan to one tube, all magenta to another)
- Win overlay shows «Level 1 — N Züge»
- «Next Level →» starts Level 2 (still 4 tubes, 2 colours since tier 1 covers 1–5)
- «Menu» resets to Level 1 with a fresh puzzle
- Level label in HUD updates correctly after each transition

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: win overlay with Next Level / Menu buttons and level counter"
```

---

## Task 4: Sound Placeholders + Undo Stack Cap

**Files:**
- Modify: `index.html` — JS section only

Add the `playSound()` stub and insert calls at the 5 trigger points. Cap the undo history at 5 entries. Remove the now-unused `initLevel()` function.

- [ ] **Step 1: Add playSound() after the UI HELPERS section**

Find (line ~1014):
```js
/* ═══════════════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════════════ */

function updateHUD() {
```

Insert the function **before** `function updateHUD()`:
```js
/**
 * Sound hook — wire up audio files here when ready.
 * @param {'select'|'pop'|'invalid'|'solved'|'win'} name
 */
function playSound(name) { // eslint-disable-line no-unused-vars
    // TODO: Audio-Integration
}

```

- [ ] **Step 2: Add playSound('select') in handleInput when a ball is selected**

Find (line ~534):
```js
    if (G.selected === -1) {
        if (G.tubes[idx].length > 0) {
            G.selected     = idx;
            G.selectedTime = G.frameTime;
        }
```

Replace with:
```js
    if (G.selected === -1) {
        if (G.tubes[idx].length > 0) {
            G.selected     = idx;
            G.selectedTime = G.frameTime;
            playSound('select');
        }
```

- [ ] **Step 3: Add playSound('invalid') in triggerFlash**

Find (line ~569):
```js
function triggerFlash(idx) {
    G.flashTube  = idx;
    G.flashUntil = G.frameTime + 320;
}
```

Replace with:
```js
function triggerFlash(idx) {
    G.flashTube  = idx;
    G.flashUntil = G.frameTime + 320;
    playSound('invalid');
}
```

- [ ] **Step 4: Add playSound calls in updateArc at the three remaining trigger points**

Find (line ~707):
```js
    // Tube explosion (once per solved tube)
    if (!G.solvedTubes.has(toTube) && isSolved(G.tubes[toTube])) {
        G.solvedTubes.add(toTube);
        triggerTubeExplosion(toTube);
    }

    ANIM.arc  = null;
    ANIM.busy = false;
    updateHUD();   // re-enable undo button now that arc is done

    // Win check (after arc clears so overlay appears after animation)
    if (checkWin()) {
        G.won = true;
        scheduleWinFireworks();
        setTimeout(showWin, 600);
    }
```

Replace with:
```js
    // Tube explosion (once per solved tube)
    if (!G.solvedTubes.has(toTube) && isSolved(G.tubes[toTube])) {
        G.solvedTubes.add(toTube);
        triggerTubeExplosion(toTube);
        playSound('solved');
    }

    playSound('pop');     // ball has landed

    ANIM.arc  = null;
    ANIM.busy = false;
    updateHUD();   // re-enable undo button now that arc is done

    // Win check (after arc clears so overlay appears after animation)
    if (checkWin()) {
        G.won = true;
        scheduleWinFireworks();
        playSound('win');
        setTimeout(showWin, 600);
    }
```

- [ ] **Step 5: Cap undo history at 5 entries in doMove()**

Find (line ~444):
```js
    // ── Undo snapshot (logic is immediate, as in v1) ──
    G.history.push(G.tubes.map(t => [...t]));
```

Replace with:
```js
    // ── Undo snapshot — capped at 5 entries ──
    G.history.push(G.tubes.map(t => [...t]));
    if (G.history.length > 5) G.history.shift();
```

- [ ] **Step 6: Remove the now-unused initLevel() function**

Find and delete the entire block (line ~381):
```js
/**
 * Level 1:  2 colours × 4 balls each  →  2 mixed full tubes + 2 empty tubes.
 * Retries if the initial state happens to be already solved.
 */
function initLevel() {
    const cols = ['cyan', 'magenta'];
    const pool = cols.flatMap(c => [c,c,c,c]);
    for (let i = pool.length-1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [pool[i],pool[j]] = [pool[j],pool[i]];
    }
    G.tubes        = [ pool.slice(0,4), pool.slice(4,8), [], [] ];
    G.selected     = -1;
    G.selectedTime = -1;
    G.moves        = 0;
    G.history      = [];
    G.won          = false;
    G.flashTube    = -1;
    G.flashUntil   = 0;
    G.solvedTubes  = new Set();
    ANIM.arc       = null;
    ANIM.bounceMap = new Map();
    ANIM.particles = [];
    ANIM.busy      = false;
    if (checkWin()) { initLevel(); return; }
    updateHUD();
    hideOverlay();
}
```

- [ ] **Step 7: Verify in browser**

- Level 1 loads, plays correctly (2 colours)
- Undo stack allows maximum 5 undos — the 6th undo does nothing (button disabled)
- Undo button goes grey immediately after a move is made during animation (ANIM.busy)
- Undo button re-activates after animation completes
- Console: no errors, no references to `initLevel`
- Level 6: 5 tubes with 3 colours
- Level 16: 7 tubes with 5 colours (test by temporarily changing `LEVEL.current = 16` in browser console then calling `generateLevel(16)`)

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: playSound stubs, undo stack cap at 5, remove initLevel"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Covered by |
|---|---|
| LEVEL object | Task 1 |
| levelConfig (3 tiers) | Task 1 |
| checkWinState helper | Task 1 |
| generateLevel (backwards shuffle) | Task 1 |
| shuffleCount = 20 + n*3 | Task 1 |
| HUD overlay (HTML div, position:absolute) | Task 2 |
| Undo btn left, Level centre, Reset right | Task 2 |
| backdrop-filter glassmorphism | Task 2 |
| updateHUD sets levelLabel + undoBtn.disabled | Task 2 |
| updateArc calls updateHUD after busy=false | Task 2 |
| Win overlay: finalLevel + finalMoves | Task 3 |
| nextLevelBtn → LEVEL.current++ + generateLevel | Task 3 |
| menuBtn → LEVEL.current=1 + generateLevel(1) | Task 3 |
| resetBtn → generateLevel(LEVEL.current) | Task 2 |
| Undo stack cap at 5 | Task 4 |
| playSound stub + 5 call sites | Task 4 |
| Remove initLevel | Task 4 |

All spec requirements covered. ✅
