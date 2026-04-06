# Color Drop Tutorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive 3-move tutorial that launches on first visit and is re-accessible via a "?" button in the Level Select screen.

**Architecture:** All changes are confined to `index.html`. The tutorial reuses the existing game engine (canvas, `G.tubes`, `handleInput`, `updateArc`) with two new state fields (`G.tutorial`, `G.tutStep`), a hardcoded mini-puzzle, and an HTML text-bubble overlay. Persistence is a single `localStorage` key `colordrop_tut_done`.

**Tech Stack:** Vanilla JS, HTML5 Canvas, localStorage — no new dependencies.

---

## File Map

| File | Changes |
|------|---------|
| `index.html` (HTML section ~line 400) | Add `#tutBubble` div |
| `index.html` (CSS section ~line 11) | Add `.tut-bubble`, `.tut-skip` styles + `#tutBtn` button style |
| `index.html` (JS constants ~line 460) | Add `TUTORIAL_TUBES`, `TUTORIAL_SCRIPT` |
| `index.html` (JS state ~line 493) | Add `tutorial`, `tutStep` fields to `G` |
| `index.html` (JS functions) | Add `startTutorial`, `endTutorial`, `advanceTutStep`, `isValidTarget`, `tubeHasTopMatch`, `drawTutorialHighlight` |
| `index.html` (JS `render` ~line 1099) | Call `drawTutorialHighlight()` at end of draw phase |
| `index.html` (JS `handleInput` ~line 801) | Advance tutorial step after first selection |
| `index.html` (JS `updateArc` ~line 1027) | Advance tutorial step after each landing + win |
| `index.html` (JS `buildLevelSelect` ~line 1402) | Add "?" button HTML |
| `index.html` (JS event listeners ~line 1552) | Wire `#tutBtn` click |
| `index.html` (bootstrap ~line 1579) | Check `colordrop_tut_done` → `startTutorial` or `openLevelSelect` |

---

### Task 1: Tutorial constants + G state

**Files:**
- Modify: `index.html` (JS constants block, after PALETTE ~line 468; G object ~line 493)

- [ ] **Step 1: Add `TUTORIAL_TUBES` and `TUTORIAL_SCRIPT` constants**

In `index.html`, find the comment line `/* ═══ SEEDED PRNG ═══ */` (around line 470) and insert directly above it:

```js
/* ═══════════════════════════════════════════════════════════
   TUTORIAL
═══════════════════════════════════════════════════════════ */

// Fixed 3-move mini-puzzle: 2 colours, 2 balls each, 1 empty tube.
// Optimal solution: tube1→tube2, tube0→tube1, tube0→tube2 (3 moves).
const TUTORIAL_TUBES = [
    ['cyan', 'magenta'],   // index 0: bottom → top
    ['magenta', 'cyan'],   // index 1
    [],                     // index 2: empty
];

const TUTORIAL_SCRIPT = [
    { text: 'Tippe auf eine Röhre um die oberste Kugel aufzunehmen.', highlight: 'all',       waitFor: 'select' },
    { text: 'Tippe auf eine andere Röhre um sie abzulegen.',          highlight: 'targets',   waitFor: 'move'   },
    { text: 'Gut! Stapele gleiche Farben — eine Röhre, eine Farbe.',  highlight: 'top-match', waitFor: 'move'   },
    { text: 'Noch ein Zug — du schaffst das!',                        highlight: 'all',       waitFor: 'win'    },
];
```

- [ ] **Step 2: Add `tutorial` and `tutStep` to the `G` object**

Find the `const G = {` block (line ~493). Add two fields after `won: false,`:

```js
    won:          false,
    tutorial:     false,   // true = tutorial mode active
    tutStep:      0,        // index into TUTORIAL_SCRIPT
```

- [ ] **Step 3: Open `index.html` in a browser and verify no console errors**

Open `file:///C:/users/juerg/colordrop/index.html` in Chrome.
Open DevTools → Console tab.
Expected: zero errors, game loads normally.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(tutorial): add TUTORIAL_TUBES, TUTORIAL_SCRIPT constants and G state fields"
```

---

### Task 2: HTML + CSS for tutorial bubble

**Files:**
- Modify: `index.html` (HTML body ~line 400; CSS `<style>` block)

- [ ] **Step 1: Add `#tutBubble` HTML element**

In `index.html`, find the closing `</div>` of `<!-- Win screen -->` (around line 422). Insert directly after it (before `<script>`):

```html
    <!-- Tutorial bubble -->
    <div id="tutBubble" class="tut-bubble hidden">
        <span id="tutText"></span>
        <button id="tutSkip" class="tut-skip">Überspringen</button>
    </div>
```

- [ ] **Step 2: Add CSS for tutorial bubble**

In the `<style>` block, find the `.move-over` rule and append directly after it:

```css
        /* ── Tutorial bubble ────────────────────────────────── */
        .tut-bubble {
            position: fixed;
            bottom: 5rem;
            left: 50%;
            transform: translateX(-50%);
            width: min(420px, 90vw);
            background: rgba(15,20,32,.92);
            border: 1px solid rgba(255,255,255,.18);
            border-radius: 14px;
            padding: .9rem 1.1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: .8rem;
            font-size: .9rem;
            color: #e8eaf0;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 50;
            transition: opacity .2s;
        }
        .tut-bubble.hidden { opacity: 0; pointer-events: none; }
        .tut-skip {
            flex-shrink: 0;
            font-size: .75rem;
            color: rgba(255,255,255,.45);
            background: none;
            border: none;
            cursor: pointer;
            padding: .2rem .4rem;
            text-decoration: underline;
        }
```

- [ ] **Step 3: Verify bubble renders correctly**

Open the file in Chrome. In DevTools console run:
```js
document.getElementById('tutBubble').classList.remove('hidden');
document.getElementById('tutText').textContent = 'Test bubble text';
```
Expected: a dark pill appears at the bottom of the screen with "Test bubble text" and an "Überspringen" link.

Run to restore:
```js
document.getElementById('tutBubble').classList.add('hidden');
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(tutorial): add tutorial bubble HTML and CSS"
```

---

### Task 3: Core tutorial functions + bootstrap wiring

**Files:**
- Modify: `index.html` (JS functions section; bootstrap ~line 1579)

- [ ] **Step 1: Add `startTutorial`, `endTutorial`, `advanceTutStep` functions**

Find the `function openLevelSelect()` definition (line ~1457). Insert the three new functions directly **before** it:

```js
/* ── Tutorial ─────────────────────────────────────────── */

function startTutorial() {
    // Reset game state with the fixed tutorial puzzle
    G.tutorial     = true;
    G.tutStep      = 0;
    G.won          = false;
    G.moves        = 0;
    G.selected     = -1;
    G.selectedTime = -1;
    G.history      = [];
    G.flashTube    = -1;
    G.flashUntil   = 0;
    G.solvedTubes  = new Set();
    ANIM.arc       = null;
    ANIM.bounceMap = new Map();
    ANIM.particles = [];
    ANIM.busy      = false;

    // Load fixed tutorial tubes (deep copy so mutations don't affect constant)
    G.tubes = TUTORIAL_TUBES.map(t => [...t]);

    // Close any open overlays
    closeLevelSelect();
    document.getElementById('overlay').classList.remove('show');

    updateHUD();
    advanceTutStep();
}

function endTutorial() {
    localStorage.setItem('colordrop_tut_done', '1');
    G.tutorial = false;
    G.tutStep  = 0;
    document.getElementById('tutBubble').classList.add('hidden');
    generateLevel(1);
}

function advanceTutStep() {
    const bubble = document.getElementById('tutBubble');
    const textEl = document.getElementById('tutText');
    const skipBtn = document.getElementById('tutSkip');

    if (G.tutStep >= TUTORIAL_SCRIPT.length) {
        // All steps done — show win message
        textEl.textContent    = 'Gelöst! Du kennst jetzt alle Regeln.';
        skipBtn.textContent   = 'Los geht\'s →';
        bubble.classList.remove('hidden');
        return;
    }

    textEl.textContent  = TUTORIAL_SCRIPT[G.tutStep].text;
    skipBtn.textContent = 'Überspringen';
    bubble.classList.remove('hidden');
}
```

- [ ] **Step 2: Wire the skip/finish button**

Find the event listeners block (around line 1552). Add after the existing listeners:

```js
document.getElementById('tutSkip').addEventListener('click', endTutorial);
```

- [ ] **Step 3: Update bootstrap to check tutorial state**

Find these three lines at the bottom of the file (around line 1579):

```js
resizeCanvas();                  // size canvas before first paint
requestAnimationFrame(render);   // start render loop (shows animated background)
openLevelSelect();               // player picks their level
```

Replace with:

```js
resizeCanvas();                  // size canvas before first paint
requestAnimationFrame(render);   // start render loop (shows animated background)
if (!localStorage.getItem('colordrop_tut_done')) {
    startTutorial();             // first ever launch → guided tutorial
} else {
    openLevelSelect();           // returning player → level select
}
```

- [ ] **Step 4: Test first-launch tutorial trigger**

In Chrome DevTools console, clear tutorial state:
```js
localStorage.removeItem('colordrop_tut_done');
```
Reload the page (F5).
Expected:
- No level select appears
- Game canvas shows 3 tubes with cyan/magenta balls
- Tutorial bubble is visible at the bottom: "Tippe auf eine Röhre um die oberste Kugel aufzunehmen."
- "Überspringen" link visible

Click "Überspringen".
Expected: tutorial bubble hides, Level 1 loads normally (full tube set visible).

- [ ] **Step 5: Test returning-player flow**

In DevTools console:
```js
localStorage.setItem('colordrop_tut_done', '1');
```
Reload. Expected: Level Select appears as usual.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(tutorial): add startTutorial, endTutorial, advanceTutStep + bootstrap wiring"
```

---

### Task 4: Canvas highlight rendering

**Files:**
- Modify: `index.html` (JS functions section; `render` function ~line 1099)

- [ ] **Step 1: Add `isValidTarget` and `tubeHasTopMatch` helpers**

Find `function canMove(from, to)` (line ~700). Insert directly **before** it:

```js
/** Tutorial helper: true if tube `i` is a valid drop target for the currently selected ball. */
function isValidTarget(i) {
    if (G.selected === -1) return false;
    return canMove(G.selected, i);
}

/** Tutorial helper: true if tube `i` has ≥ 2 balls with the same colour on top. */
function tubeHasTopMatch(i) {
    const t = G.tubes[i];
    return t.length >= 2 && t[t.length - 1] === t[t.length - 2];
}
```

- [ ] **Step 2: Add `drawTutorialHighlight` function**

Find `function drawBackground(ts)` (line ~1131). Insert directly **before** it:

```js
/** Draws a pulsing highlight ring around tutorial-relevant tubes. */
function drawTutorialHighlight() {
    if (!G.tutorial || G.tutStep >= TUTORIAL_SCRIPT.length) return;
    const step  = TUTORIAL_SCRIPT[G.tutStep];
    const alpha = 0.45 + 0.35 * Math.sin(Date.now() / 280);

    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.lineWidth   = 3;

    for (let i = 0; i < G.tubes.length; i++) {
        const highlight =
            step.highlight === 'all'       ? true :
            step.highlight === 'targets'   ? isValidTarget(i) :
            step.highlight === 'top-match' ? tubeHasTopMatch(i) : false;
        if (!highlight) continue;

        const cx = tubeCX(i);
        const pad = 6;
        roundRect(ctx, cx - TUBE_W / 2 - pad, TUBE_TOP - pad, TUBE_W + pad * 2, TUBE_H + pad * 2, 14);
        ctx.stroke();
    }

    ctx.restore();
}
```

- [ ] **Step 3: Call `drawTutorialHighlight` in the render loop**

Find `drawConfetti();` in the `render` function (line ~1121). Add the call directly after it:

```js
    drawConfetti();
    drawTutorialHighlight();
```

- [ ] **Step 4: Test highlights in browser**

Clear tutorial state and reload:
```js
localStorage.removeItem('colordrop_tut_done'); location.reload();
```
Expected:
- All 3 tutorial tubes have a pulsing white outline (step 0, highlight: 'all')
- The outline breathes in/out continuously

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(tutorial): add drawTutorialHighlight with isValidTarget + tubeHasTopMatch helpers"
```

---

### Task 5: Step advancement hooks in handleInput + updateArc

**Files:**
- Modify: `index.html` (`handleInput` ~line 801; `updateArc` ~line 1027)

- [ ] **Step 1: Hook `handleInput` for the 'select' step**

Find this block in `handleInput` (around line 813):

```js
    if (G.selected === -1) {
        if (G.tubes[idx].length > 0) {
            G.selected     = idx;
            G.selectedTime = G.frameTime;
            playSound('select');
        }
```

Add the tutorial hook **after** `playSound('select');` and **before** the closing `}`:

```js
    if (G.selected === -1) {
        if (G.tubes[idx].length > 0) {
            G.selected     = idx;
            G.selectedTime = G.frameTime;
            playSound('select');
            // Tutorial: advance from step 0 ('select') to step 1
            if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
                TUTORIAL_SCRIPT[G.tutStep].waitFor === 'select') {
                G.tutStep++;
                advanceTutStep();
            }
        }
```

- [ ] **Step 2: Hook `updateArc` for 'move' and 'win' steps**

Find these lines in `updateArc` (around line 1051):

```js
    ANIM.arc  = null;
    ANIM.busy = false;
    updateHUD();   // re-enable undo button now that arc is done

    // Win check (after arc clears so overlay appears after animation)
    if (checkWin()) {
        G.won = true;
        spawnConfetti();
        scheduleWinFireworks();
        playSound('win');
        setTimeout(showWin, 600);
    }
```

Replace the entire block with:

```js
    ANIM.arc  = null;
    ANIM.busy = false;
    updateHUD();   // re-enable undo button now that arc is done

    // Tutorial: advance 'move' step after each landing
    if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
        TUTORIAL_SCRIPT[G.tutStep].waitFor === 'move') {
        G.tutStep++;
        advanceTutStep();
    }

    // Win check (after arc clears so overlay appears after animation)
    if (checkWin()) {
        G.won = true;
        spawnConfetti();
        scheduleWinFireworks();
        playSound('win');
        if (G.tutorial) {
            // Tutorial win: advance 'win' step, show completion message (no win overlay)
            if (G.tutStep < TUTORIAL_SCRIPT.length &&
                TUTORIAL_SCRIPT[G.tutStep].waitFor === 'win') {
                G.tutStep++;
                advanceTutStep();
            }
        } else {
            setTimeout(showWin, 600);
        }
    }
```

- [ ] **Step 3: Full tutorial play-through test**

Clear tutorial state and reload:
```js
localStorage.removeItem('colordrop_tut_done'); location.reload();
```

Play through the tutorial:
1. **Step 0:** "Tippe auf eine Röhre…" — all tubes glow. Tap tube 1 (cyan on top). Expected: step advances to "Tippe auf eine andere Röhre…", selected ball floats.
2. **Step 1:** Tap tube 2 (empty). Expected: ball drops, step advances to "Gut! Stapele gleiche Farben…", tube 2 now has `[cyan]`.
3. **Step 2:** Tap tube 0 (magenta on top) then tube 1 (magenta on top → match). Expected: step advances to "Noch ein Zug…". Tube 1 now `[magenta, magenta]`.
4. **Step 3:** Tap tube 0 (cyan) then tube 2 (cyan on top → match). Expected: confetti, tutorial bubble shows "Gelöst! Du kennst jetzt alle Regeln.", button changes to "Los geht's →".
5. Click "Los geht's →". Expected: Level 1 loads.

- [ ] **Step 4: Test skip mid-tutorial**

Clear and reload. After step 1 advances, click "Überspringen". Expected: tutorial ends, Level 1 loads.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(tutorial): wire step advancement in handleInput and updateArc"
```

---

### Task 6: "?" button in Level Select

**Files:**
- Modify: `index.html` (CSS `<style>` block; `buildLevelSelect` / Level Select HTML ~line 400; event listeners ~line 1552)

- [ ] **Step 1: Add CSS for the "?" button**

Find `.ls-tier-label.master` in the `<style>` block. Append directly after it:

```css
        .ls-tut-btn {
            position: absolute;
            top: 1.4rem;
            right: 1.5rem;
            width: 2.2rem;
            height: 2.2rem;
            border-radius: 50%;
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,255,255,.18);
            color: rgba(255,255,255,.55);
            font-size: .85rem;
            font-family: var(--f-mono);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background .15s;
        }
        .ls-tut-btn:hover { background: rgba(255,255,255,.15); }
```

- [ ] **Step 2: Add `position: relative` to `.ls-inner` so the button positions correctly**

Find `.ls-inner` in the `<style>` block:

```css
        .ls-inner { width: 100%; max-width: 480px; }
```

Replace with:

```css
        .ls-inner { width: 100%; max-width: 480px; position: relative; }
```

- [ ] **Step 3: Add the "?" button to the Level Select HTML**

Find the Level Select HTML block (around line 401):

```html
    <div class="level-select" id="levelSelect">
        <div class="ls-inner">
            <h1 class="ls-title">Color Drop</h1>
            <p class="ls-tagline">sort · stack · solve</p>
            <div class="ls-tiers" id="lsTiers"></div>
        </div>
    </div>
```

Replace with:

```html
    <div class="level-select" id="levelSelect">
        <div class="ls-inner">
            <h1 class="ls-title">Color Drop</h1>
            <p class="ls-tagline">sort · stack · solve</p>
            <button id="tutBtn" class="ls-tut-btn" aria-label="Tutorial">?</button>
            <div class="ls-tiers" id="lsTiers"></div>
        </div>
    </div>
```

- [ ] **Step 4: Wire the "?" button event listener**

Find `document.getElementById('tutSkip').addEventListener('click', endTutorial);` (added in Task 3). Add directly after it:

```js
document.getElementById('tutBtn').addEventListener('click', () => {
    closeLevelSelect();
    startTutorial();
});
```

- [ ] **Step 5: Test the "?" button**

Make sure `colordrop_tut_done` is set (so Level Select shows on load):
```js
localStorage.setItem('colordrop_tut_done', '1'); location.reload();
```
Expected: Level Select appears. A small "?" button is visible in the top-right of the Level Select card. Click it.
Expected: Level Select closes, tutorial starts with the 3-tube puzzle and the first bubble.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(tutorial): add '?' button to Level Select screen"
```

---

## Self-Review

### Spec coverage check

| Spec section | Covered by task |
|---|---|
| 2. Mini-puzzle (TUTORIAL_TUBES, 3-move solution) | Task 1 |
| 3. State (G.tutorial, G.tutStep) | Task 1 |
| 4. Script array (4 steps, highlight types, waitFor) | Task 1 |
| 5. Highlighting (pulsing ring, 3 modes) | Task 4 |
| 6. Text bubble HTML + CSS | Task 2 |
| 7. startTutorial + endTutorial | Task 3 |
| 8. advanceTutStep | Task 3 |
| 9. Aufrufstellen handleInput + updateArc | Task 5 |
| 10. Bootstrap first-launch check | Task 3 |
| 10. "?" button in Level Select | Task 6 |
| 10. Navigation: skip/finish → Level 1 | Task 3 + 5 |
| 11. No win overlay in tutorial mode | Task 5 |

All sections covered. ✓

### Placeholder scan

No TBD, TODO, or vague steps. All code is complete. ✓

### Type/name consistency check

- `TUTORIAL_TUBES` defined Task 1, used Task 3 (`startTutorial`) ✓
- `TUTORIAL_SCRIPT` defined Task 1, used Tasks 4, 5 ✓
- `G.tutorial` / `G.tutStep` defined Task 1, used Tasks 3, 4, 5 ✓
- `advanceTutStep()` defined Task 3, called in Tasks 3, 5 ✓
- `isValidTarget(i)` / `tubeHasTopMatch(i)` defined Task 4, used in Task 4 ✓
- `endTutorial()` defined Task 3, wired in Tasks 3, 6 ✓
- `startTutorial()` defined Task 3, called in Tasks 3, 6 ✓
- `TUBE_W`, `TUBE_TOP`, `TUBE_H`, `tubeCX()`, `roundRect()` — all existing constants/functions in codebase ✓
