# Color Drop — Hints (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 💡 Tipp button to the HUD that highlights the next valid move using a BFS solver; costs 1 move.

**Architecture:** Three layers — (1) a pure BFS solver (`canMoveState` + `solveHint`) that never touches `G`, (2) new hint state in `G` (`hintFrom/To/Until`) consumed by `drawTube()` to render highlights, (3) `showHint()` wiring the button click to solver + state update. All changes in `index.html`.

**Tech Stack:** Vanilla JS, HTML5 Canvas 2D, no new dependencies.

---

## File Structure

**Only file modified:** `index.html`

Sections touched (by line number in current file):
- **L860–879** — `const G` object: add 3 new hint fields
- **L1051** — `generateLevel()`: reset hint fields
- **L1166–1180** — after `canMove()`: insert `canMoveState()` + `solveHint()`
- **L1186–1217** — `doMove()`: clear hint on move
- **L1219–1234** — `undo()`: clear hint on undo
- **L1755–1808** — `drawTube()`: render hint highlight
- **L627–631** — HUD HTML: add `#hintBtn`
- **L2268–2270** — `updateHUD()`: disable/enable `#hintBtn`
- **L2456** — event listeners: add hint click listener
- After last listener: add `showHint()` function

---

## Task 1: Pure solver functions

**Files:**
- Modify: `index.html` — insert after `canMove()` (line ~1180)

The solver must never read `G` — it works on a snapshot of tubes passed in, so it can explore hypothetical states.

- [ ] **Step 1: Open `index.html`. Locate `canMove()` ending at line ~1180.**

Find this exact closing brace:
```js
    // Non-empty: colours must match
    return dst[dst.length - 1] === src[src.length - 1];
}
```

- [ ] **Step 2: Insert `canMoveState` and `solveHint` immediately after `canMove()`'s closing brace.**

```js
/** Pure canMove on an arbitrary tubes snapshot — no G access. */
function canMoveState(tubes, from, to) {
    if (from === to) return false;
    const src = tubes[from];
    const dst = tubes[to];
    if (src.length === 0) return false;
    if (dst.length >= 4)  return false;
    if (dst.length === 0) return true;
    return dst[dst.length - 1] === src[src.length - 1];
}

/**
 * BFS solver. Returns the first move of the shortest solution path,
 * or null if no solution found within 50 000 nodes.
 * @returns {{ from: number, to: number } | null}
 */
function solveHint() {
    const start   = G.tubes.map(t => [...t]);
    const queue   = [{ tubes: start, path: [] }];
    const visited = new Set([JSON.stringify(start)]);
    let nodes = 0;
    while (queue.length && nodes++ < 50000) {
        const { tubes, path } = queue.shift();
        for (let from = 0; from < tubes.length; from++) {
            for (let to = 0; to < tubes.length; to++) {
                if (!canMoveState(tubes, from, to)) continue;
                const next = tubes.map(t => [...t]);
                next[to].push(next[from].pop());
                const key = JSON.stringify(next);
                if (visited.has(key)) continue;
                visited.add(key);
                const newPath = [...path, { from, to }];
                if (checkWinState(next)) return newPath[0];
                queue.push({ tubes: next, path: newPath });
            }
        }
    }
    return null;
}
```

- [ ] **Step 3: Verify solver in browser console.**

Open `index.html` in browser. Start a level. Open DevTools Console and run:
```js
solveHint()
```
Expected: an object like `{ from: 2, to: 0 }` (indices vary by level). Must not be `null` for EASY–HARD levels.

Also verify the pure helper:
```js
canMoveState(G.tubes, 0, 1)   // some boolean — no error thrown
```

- [ ] **Step 4: Commit.**

```bash
git add index.html
git commit -m "feat(hints): add canMoveState + solveHint BFS solver"
```

---

## Task 2: G state fields + reset in generateLevel / doMove / undo

**Files:**
- Modify: `index.html` — `const G` (~L874), `generateLevel()` (~L1051), `doMove()` (~L1196), `undo()` (~L1225)

- [ ] **Step 1: Add hint fields to `const G`.**

Find in `const G` (line ~874):
```js
    flashTube:    -1,    // tube showing red flash
    flashUntil:   0,     // rAF timestamp when flash ends
```

Replace with:
```js
    flashTube:    -1,    // tube showing red flash
    flashUntil:   0,     // rAF timestamp when flash ends
    hintFrom:     -1,    // hint source tube index (-1 = inactive)
    hintTo:       -1,    // hint destination tube index (-1 = inactive)
    hintUntil:    0,     // frameTime timestamp when hint highlight expires
```

- [ ] **Step 2: Reset hint state in `generateLevel()`.**

Find in `generateLevel()` (line ~1051):
```js
    G.flashTube    = -1;
    G.flashUntil   = 0;
```

Replace with:
```js
    G.flashTube    = -1;
    G.flashUntil   = 0;
    G.hintFrom     = -1;
    G.hintTo       = -1;
    G.hintUntil    = 0;
```

- [ ] **Step 3: Clear hint in `doMove()`.**

Find in `doMove()` (line ~1196), the mutation block:
```js
    const color = G.tubes[from][G.tubes[from].length - 1];
    G.tubes[from].pop();
    G.tubes[to].push(color);
    G.moves++;
```

Replace with:
```js
    const color = G.tubes[from][G.tubes[from].length - 1];
    G.tubes[from].pop();
    G.tubes[to].push(color);
    G.moves++;
    G.hintFrom = G.hintTo = -1;
```

- [ ] **Step 4: Clear hint in `undo()`.**

Find in `undo()` (line ~1222):
```js
    G.tubes        = G.history.pop();
    G.selected     = -1;
    G.selectedTime = -1;
    G.moves        = Math.max(0, G.moves - 1);
    G.won          = false;
```

Replace with:
```js
    G.tubes        = G.history.pop();
    G.selected     = -1;
    G.selectedTime = -1;
    G.moves        = Math.max(0, G.moves - 1);
    G.won          = false;
    G.hintFrom     = G.hintTo = -1;
```

- [ ] **Step 5: Verify in browser console.**

Load level, open console:
```js
G.hintFrom   // -1
G.hintTo     // -1
G.hintUntil  // 0
```
Then manually call:
```js
G.hintFrom = 0; G.hintTo = 1; G.hintUntil = G.frameTime + 5000;
```
No error. (Highlight rendering comes in Task 3.)

- [ ] **Step 6: Commit.**

```bash
git add index.html
git commit -m "feat(hints): add hintFrom/To/Until state; reset in generateLevel/doMove/undo"
```

---

## Task 3: Hint highlight in drawTube()

**Files:**
- Modify: `index.html` — `drawTube()` (~L1755–1808)

The hint renders as:
- **Source tube**: bright white glow + white border gradient
- **Destination tube**: green glow + green border gradient

- [ ] **Step 1: Locate the `flashing` variable in `drawTube()` (~L1761).**

Find:
```js
    const flashing  = G.flashTube === i && G.frameTime < G.flashUntil;
```

- [ ] **Step 2: Add `hintSrc` and `hintDst` variables immediately after.**

```js
    const flashing  = G.flashTube === i && G.frameTime < G.flashUntil;
    const hintSrc   = G.hintFrom  === i && G.frameTime < G.hintUntil;
    const hintDst   = G.hintTo    === i && G.frameTime < G.hintUntil;
```

- [ ] **Step 3: Update the outer glow block to include hint cases.**

Find:
```js
    if (flashing) {
        ctx.shadowColor = 'rgba(255,50,50,.62)';
        ctx.shadowBlur  = 34;
    } else if (sel) {
        ctx.shadowColor = 'rgba(247,201,72,.44)';
        ctx.shadowBlur  = 30;
    } else if (solved) {
        const pulse     = 0.5 + 0.5 * Math.sin(ts * 0.003);
        ctx.shadowColor = 'rgba(80,255,150,.32)';
        ctx.shadowBlur  = 15 + pulse * 15;
    }
```

Replace with:
```js
    if (flashing) {
        ctx.shadowColor = 'rgba(255,50,50,.62)';
        ctx.shadowBlur  = 34;
    } else if (hintSrc) {
        ctx.shadowColor = 'rgba(255,255,255,.70)';
        ctx.shadowBlur  = 30;
    } else if (hintDst) {
        ctx.shadowColor = 'rgba(80,255,80,.70)';
        ctx.shadowBlur  = 30;
    } else if (sel) {
        ctx.shadowColor = 'rgba(247,201,72,.44)';
        ctx.shadowBlur  = 30;
    } else if (solved) {
        const pulse     = 0.5 + 0.5 * Math.sin(ts * 0.003);
        ctx.shadowColor = 'rgba(80,255,150,.32)';
        ctx.shadowBlur  = 15 + pulse * 15;
    }
```

- [ ] **Step 4: Update the border gradient to include hint colours.**

Find:
```js
    borderGrad.addColorStop(0,   flashing ? 'rgba(255,80,80,.72)'
                                : sel     ? 'rgba(247,201,72,.62)'
                                : solved  ? 'rgba(80,255,150,.40)'
                                :            'rgba(255,255,255,.30)');
    borderGrad.addColorStop(1,   flashing ? 'rgba(255,80,80,.25)'
                                : sel     ? 'rgba(247,201,72,.20)'
                                : solved  ? 'rgba(80,255,150,.12)'
                                :            'rgba(255,255,255,.05)');
```

Replace with:
```js
    borderGrad.addColorStop(0,   flashing ? 'rgba(255,80,80,.72)'
                                : hintSrc ? 'rgba(255,255,255,.85)'
                                : hintDst ? 'rgba(80,255,80,.75)'
                                : sel     ? 'rgba(247,201,72,.62)'
                                : solved  ? 'rgba(80,255,150,.40)'
                                :            'rgba(255,255,255,.30)');
    borderGrad.addColorStop(1,   flashing ? 'rgba(255,80,80,.25)'
                                : hintSrc ? 'rgba(255,255,255,.30)'
                                : hintDst ? 'rgba(80,255,80,.28)'
                                : sel     ? 'rgba(247,201,72,.20)'
                                : solved  ? 'rgba(80,255,150,.12)'
                                :            'rgba(255,255,255,.05)');
```

- [ ] **Step 5: Verify highlight renders in browser.**

Open level, DevTools Console:
```js
G.hintFrom = 0; G.hintTo = 1; G.hintUntil = G.frameTime + 5000;
```
Expected: tube 0 glows white, tube 1 glows green. After 5 s, both return to normal. Making a move also clears the highlight immediately.

- [ ] **Step 6: Commit.**

```bash
git add index.html
git commit -m "feat(hints): render hint highlight in drawTube (white=src, green=dst)"
```

---

## Task 4: showHint() + HUD button + updateHUD + event listener

**Files:**
- Modify: `index.html` — HUD HTML (~L628), `updateHUD()` (~L2268), event listeners (~L2456), add `showHint()`

- [ ] **Step 1: Add `#hintBtn` to HUD HTML.**

Find (~L628):
```html
                    <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
```

Replace with:
```html
                    <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
                    <button class="hud-btn" id="hintBtn" aria-label="Tipp">💡</button>
```

- [ ] **Step 2: Update `updateHUD()` to manage `#hintBtn` disabled state.**

Find in `updateHUD()` (~L2268):
```js
    document.getElementById('undoBtn').disabled       = G.tutorial || G.history.length === 0 || ANIM.busy || G.won;
```

Replace with:
```js
    document.getElementById('undoBtn').disabled       = G.tutorial || G.history.length === 0 || ANIM.busy || G.won;
    document.getElementById('hintBtn').disabled       = G.tutorial || ANIM.busy || G.won;
```

- [ ] **Step 3: Add `showHint()` function.**

Add after the `undo()` function closing brace (line ~1234), before the next function:

```js
/** Show a hint: BFS-solve current state, highlight first move, cost 1 move. */
function showHint() {
    if (ANIM.busy || G.won || G.tutorial) return;
    const move = solveHint();
    const btn  = document.getElementById('hintBtn');
    if (!move) {
        const orig    = btn.textContent;
        btn.textContent = '❌';
        btn.disabled    = true;
        setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
        return;
    }
    G.moves++;
    updateHUD();
    G.hintFrom  = move.from;
    G.hintTo    = move.to;
    G.hintUntil = G.frameTime + 2500;
}
```

- [ ] **Step 4: Add event listener for `#hintBtn`.**

Find (~L2456):
```js
document.getElementById('undoBtn'    ).addEventListener('click', undo);
```

Replace with:
```js
document.getElementById('undoBtn'    ).addEventListener('click', undo);
document.getElementById('hintBtn'    ).addEventListener('click', showHint);
```

- [ ] **Step 5: Verify full hint flow in browser.**

1. Load any level. Confirm 💡 button visible in HUD.
2. Click 💡. Expected: move counter increments by 1, source tube glows white, destination tube glows green.
3. Wait 2.5 s — highlight disappears automatically.
4. Click 💡 again, then make the suggested move — highlight clears immediately on move.
5. Click ↩ (undo) while hint is showing — highlight clears immediately.
6. Win a level — 💡 is disabled.
7. Start tutorial — 💡 is disabled.

- [ ] **Step 6: Commit.**

```bash
git add index.html
git commit -m "feat(hints): add showHint, hintBtn HUD button, updateHUD, event listener"
```
