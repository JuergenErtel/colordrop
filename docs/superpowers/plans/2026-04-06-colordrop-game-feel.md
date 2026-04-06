# Color Drop Game Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ZzFX synthesized sound, win confetti, par-colour move counter, and 1 empty tube at EXPERT+ to make the game feel alive and rewarding.

**Architecture:** All changes in `index.html` only. ZzFX (~1 KB) is embedded directly in the `<script>` block with lazy AudioContext init. Confetti particles reuse `ANIM.particles` with a `confetti: true` type flag; a separate `drawConfetti()` function renders them with normal compositing (not additive). The par colour is a CSS className swap on `#moveCount`. The empty-tube change is a one-line edit in `levelConfig()`.

**Tech Stack:** Vanilla JS, HTML5 Canvas, Web Audio API (via ZzFX), CSS.

---

## File Structure

Only one file is modified throughout:

- **Modify:** `index.html`
  - `<script>` block line ~419: embed ZzFX source
  - `const MAX_PARTS = 350` (line 443): increase to 500
  - `function updateParticles(dt)` (line 854): add confetti spin update
  - `function drawParticles()` (line 866): skip confetti particles (they use normal blending)
  - New `function drawConfetti()`: render rectangular confetti with source-over compositing
  - New `function spawnConfetti()`: push 80 confetti particles into `ANIM.particles`
  - `function updateArc()` (line 962): call `spawnConfetti()` on win
  - `function render()` (line 1033): call `drawConfetti()` after `drawParticles()`
  - `function playSound(name)` (line 1410): replace stub with ZzFX calls
  - `function updateHUD()` (line 1414): add par-colour className logic
  - CSS `<style>` block: add `.move-good`, `.move-ok`, `.move-over`
  - `function levelConfig(n)` (line ~507): change EXPERT and MASTER to `empty: 1`

---

## Task 1: ZzFX Sound

**Files:**
- Modify: `index.html` — `<script>` block

- [ ] **Step 1: Embed ZzFX immediately after the opening `<script>` tag**

Find (line ~419):
```js
    <script>
    'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
```

Insert after `'use strict';` and before the `/* ═══ CONSTANTS` banner:

```js

/* ═══════════════════════════════════════════════════════════
   ZZFX — Zuper Zmall Audio Library v2.0.1 (Frank Force, MIT)
   Source embedded to keep single-file architecture intact.
   AudioContext is created lazily in playSound() for iOS compat.
═══════════════════════════════════════════════════════════ */
let zzfx,zzfxX;zzfx=(...t)=>zzfxP(zzfxG(...t));zzfxG=(e=1,f=.05,a=220,b=0,l=0,M=.1,m=0,F=1,N=0,z=0,Y=0,X=0,P=0,I=0,Q=0,R=0,d=0,S=1,c=0,T=0)=>{let q=44100,w=2*Math.PI,L=q*b+9,r=q*l,v=q/a,h=0,n=0,D=0,k=1,A=[],C=zzfxX.createBuffer(1,L+r,q),G=C.getChannelData(0);for(T=c*[0,1,1.07,1.26,1.5,1.77][T|0]*w/q,a=w*a/q;h<L+r;h++){let p=h<L?h/L:1-(h-L)/r;let s=a*(1+(N*Math.sin(2*Math.PI*h/q)+z*Math.sin(h/v*w))+f);s+=T*Math.sin(h/q*2*Math.PI);D+=s;n+=([Math.sin(D),Math.sign(Math.sin(D)),1-2*(Math.floor(2*D/w)%2),((2*D/w%2)-1+2)%2-1][m|0]||Math.sin(D));let u=p*S*(k=Y?k+X/q:1)*e;G[h]=(Math.abs(n/++Q)>1?n/Math.abs(n):n)*u*Math.min(1,1+R*(h/q));Q=m||Q>99?1:Q}return G};zzfxP=(...t)=>{let e=zzfxX.createBuffer(t.length,t[0].length,44100),f=zzfxX.createBufferSource();for(let a in t)e.getChannelData(a).set(t[a]);f.buffer=e;f.connect(zzfxX.destination);f.start();return f};

```

- [ ] **Step 2: Replace the `playSound()` stub**

Find the current stub (around line 1410):
```js
function playSound(name) {
    \ TODO: Audio-Integration
}
```

Replace with:
```js
/**
 * Play a synthesized sound effect via ZzFX.
 * AudioContext is created lazily so iOS doesn't block before first gesture.
 * @param {'select'|'pop'|'invalid'|'solved'|'win'} name
 */
function playSound(name) {
    try {
        if (!zzfxX) zzfxX = new AudioContext();
        if (zzfxX.state === 'suspended') zzfxX.resume();
        switch (name) {
            // Light click when selecting a ball
            case 'select':  zzfx(.35, .05, 900,    0, .01, .03, 0, 2);               break;
            // Satisfying thud when ball lands (pitch drops)
            case 'pop':     zzfx(.5,  .03, 220,    0, .04, .1,  0, 1.2, -10);        break;
            // Harsh buzz for invalid move
            case 'invalid': zzfx(.4,  .1,  120, .01, .04, .06, 3,  .5);             break;
            // Bright chime when a tube is completed (pitch rises)
            case 'solved':  zzfx(.4,  .02, 660, .02, .08, .12, 0, 1.5, 5);          break;
            // C-major arpeggio (C5 → E5 → G5)
            case 'win':
                zzfx(.5, .02, 523, .02, .10, .12, 0, 1.5);
                setTimeout(() => zzfx(.5, .02, 659, .02, .10, .12, 0, 1.5), 130);
                setTimeout(() => zzfx(.6, .02, 784, .03, .15, .18, 0, 1.5), 260);
                break;
        }
    } catch(e) {}   // silently ignore if AudioContext is unavailable
}
```

- [ ] **Step 3: Verify in browser**

Open `index.html`. Click a ball — should hear a short high click. Click the same ball again (deselect) — click again. Move a ball — should hear the pop on landing. Try an invalid move (click a full tube onto another full tube) — should hear a harsh buzz. Solve a tube — should hear a chime. Win the level — should hear the 3-note fanfare.

If there is no sound at all on first interaction: open DevTools → Console and check for errors. The most likely issue is `zzfxX.createBuffer is not a function` which means `zzfxX` was not initialized before `zzfx()` was called — verify that the `if (!zzfxX) zzfxX = new AudioContext()` line runs before the `switch`.

- [ ] **Step 4: Commit**

```bash
cd C:/users/juerg/colordrop
git add index.html
git commit -m "feat: ZzFX synthesized sound effects (select, pop, invalid, solved, win)"
```

---

## Task 2: Win Konfetti

**Files:**
- Modify: `index.html` — `<script>` block only

Existing neon particles use `ctx.globalCompositeOperation = 'lighter'` (additive blending — creates glow). Confetti must use normal `'source-over'` compositing so colours look opaque and vivid. The approach: tag confetti particles with `confetti: true`, skip them in `drawParticles()`, and render them in a new `drawConfetti()`.

- [ ] **Step 1: Increase MAX_PARTS from 350 to 500**

Find:
```js
const MAX_PARTS  = 350;              // particle cap
```

Replace with:
```js
const MAX_PARTS  = 500;              // particle cap (increased for confetti)
```

- [ ] **Step 2: Update `updateParticles(dt)` to handle confetti spin**

Find:
```js
/** Advance all particles by dt seconds; remove dead ones. */
function updateParticles(dt) {
    for (let i = ANIM.particles.length - 1; i >= 0; i--) {
        const p = ANIM.particles[i];
        p.x    += p.vx * dt;
        p.y    += p.vy * dt;
        p.vy   += p.gravity * dt;
        p.life -= dt;
        if (p.life <= 0) ANIM.particles.splice(i, 1);
    }
}
```

Replace with:
```js
/** Advance all particles by dt seconds; remove dead ones. */
function updateParticles(dt) {
    for (let i = ANIM.particles.length - 1; i >= 0; i--) {
        const p = ANIM.particles[i];
        p.x    += p.vx * dt;
        p.y    += p.vy * dt;
        p.vy   += p.gravity * dt;
        p.life -= dt;
        if (p.confetti) {
            p.vx   *= 0.995;           // gentle air resistance
            p.angle += p.spin * dt;    // spin in radians/s
        }
        if (p.life <= 0) ANIM.particles.splice(i, 1);
    }
}
```

- [ ] **Step 3: Update `drawParticles()` to skip confetti particles**

Find the line inside `drawParticles()`:
```js
    for (const p of ANIM.particles) {
        ctx.globalAlpha = (p.life / p.maxLife) * 0.85;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * (p.life / p.maxLife), 0.5), 0, Math.PI * 2);
        ctx.fill();
    }
```

Replace with:
```js
    for (const p of ANIM.particles) {
        if (p.confetti) continue;      // confetti rendered separately in drawConfetti()
        ctx.globalAlpha = (p.life / p.maxLife) * 0.85;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * (p.life / p.maxLife), 0.5), 0, Math.PI * 2);
        ctx.fill();
    }
```

- [ ] **Step 4: Add `drawConfetti()` immediately after `drawParticles()`**

Find (immediately after the closing `}` of `drawParticles()`):
```js
/**
 * Burst of 35 particles from the centre of a completed tube.
```

Insert the following BEFORE that comment:

```js
/** Draw confetti particles as opaque rotating rectangles (normal compositing). */
function drawConfetti() {
    const confettiList = ANIM.particles.filter(p => p.confetti);
    if (!confettiList.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (const p of confettiList) {
        ctx.globalAlpha = Math.min(1, p.life / p.maxLife * 1.4);
        ctx.fillStyle   = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
    }
    ctx.restore();
}

```

- [ ] **Step 5: Add `spawnConfetti()` before `scheduleWinFireworks()`**

Find (the comment before `scheduleWinFireworks`):
```js
/**
 * Two waves of firework bursts across the canvas.
```

Insert the following immediately BEFORE that comment:

```js
/**
 * Spawn 80 rectangular confetti pieces in all 6 game colours.
 * Particles rise from the lower-centre then fall with gravity.
 * Called once when the player wins a level.
 */
function spawnConfetti() {
    const colors  = Object.values(PALETTE).map(p => p.base);
    const cx      = CW / 2;
    const startY  = CH * 0.65;          // spawn below tube area
    for (let i = 0; i < 80; i++) {
        const speed = 280 + Math.random() * 280;   // px/s upward
        const spread = (Math.random() - .5) * CW * 0.9;
        ANIM.particles.push({
            x:        cx + spread,
            y:        startY,
            vx:       (Math.random() - .5) * 120,  // px/s sideways
            vy:       -speed,                       // px/s upward
            gravity:  380,                          // px/s² downward
            life:     2.2 + Math.random() * 1.4,   // seconds
            maxLife:  3.6,
            color:    colors[Math.floor(Math.random() * colors.length)],
            confetti: true,
            w:        5 + Math.random() * 4,        // px width
            h:        9 + Math.random() * 5,        // px height
            angle:    Math.random() * Math.PI * 2,  // initial angle
            spin:     (Math.random() - .5) * 6,     // radians/s
        });
    }
}

```

- [ ] **Step 6: Call `spawnConfetti()` on win**

Find (in `updateArc()`):
```js
        G.won = true;
        scheduleWinFireworks();
        playSound('win');
```

Replace with:
```js
        G.won = true;
        spawnConfetti();
        scheduleWinFireworks();
        playSound('win');
```

- [ ] **Step 7: Call `drawConfetti()` in the render loop**

Find (in `render()`):
```js
    drawParticles();

    requestAnimationFrame(render);
```

Replace with:
```js
    drawParticles();
    drawConfetti();

    requestAnimationFrame(render);
```

- [ ] **Step 8: Verify in browser**

Win a level. You should see:
- Rectangular confetti in 6 colours rising then falling (canvas)
- Firework bursts in the background (existing `scheduleWinFireworks`)
- Both effects visible before the win overlay appears at 600 ms
- After the overlay appears, canvas continues rendering behind it

- [ ] **Step 9: Commit**

```bash
cd C:/users/juerg/colordrop
git add index.html
git commit -m "feat: win confetti (rectangular particles, 6 game colours, physics)"
```

---

## Task 3: Par-Colour Move Counter

**Files:**
- Modify: `index.html` — CSS `<style>` block and `updateHUD()` in `<script>`

- [ ] **Step 1: Add CSS colour classes**

Find (in `<style>`, the `.hud-level` block):
```css
        .hud-level {
          font-family: var(--f-head);
          font-size: 1.1rem;
          letter-spacing: .08em;
          color: var(--gold);
        }
```

Insert immediately AFTER the closing `}` of `.hud-level`:

```css

        /* Move counter colour coding relative to par */
        .move-good { color: #b2ff59; }   /* ≤ par           — lime green  */
        .move-ok   { color: #ff7043; }   /* ≤ par × 1.5     — orange      */
        .move-over { color: #f50057; }   /* > par × 1.5     — pink/red    */
```

- [ ] **Step 2: Update `updateHUD()` to apply the class**

Find `updateHUD()`:
```js
function updateHUD() {
    document.getElementById('moveCount').textContent  = G.moves;
    document.getElementById('levelLabel').textContent = 'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier;
    document.getElementById('undoBtn').disabled       = G.history.length === 0 || ANIM.busy || G.won;
    document.getElementById('resetBtn').disabled      = G.won;
    document.getElementById('menuBtnHud').disabled    = ANIM.busy || G.won;
}
```

Replace with:
```js
function updateHUD() {
    const mc  = document.getElementById('moveCount');
    mc.textContent = G.moves;
    if (G.moves === 0) {
        mc.className = '';
    } else {
        const par = parForLevel(LEVEL.current);
        mc.className = G.moves <= par       ? 'move-good' :
                       G.moves <= par * 1.5 ? 'move-ok'   : 'move-over';
    }
    document.getElementById('levelLabel').textContent = 'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier;
    document.getElementById('undoBtn').disabled       = G.history.length === 0 || ANIM.busy || G.won;
    document.getElementById('resetBtn').disabled      = G.won;
    document.getElementById('menuBtnHud').disabled    = ANIM.busy || G.won;
}
```

- [ ] **Step 3: Verify in browser**

- Start a level. Move counter shows `0` in neutral colour.
- Make moves up to par — counter turns lime green.
- Make moves to 1.5× par — counter turns orange.
- Make more moves — counter turns pink/red.
- Win the level. Open next level — counter resets to `0` (neutral).

- [ ] **Step 4: Commit**

```bash
cd C:/users/juerg/colordrop
git add index.html
git commit -m "feat: par-colour move counter (green/orange/red relative to par)"
```

---

## Task 4: 1 Empty Tube at EXPERT+

**Files:**
- Modify: `index.html` — `levelConfig()` in `<script>`

- [ ] **Step 1: Update `levelConfig()` for EXPERT and MASTER**

Find:
```js
function levelConfig(n) {
    if (n <=  3) return { colors: ['cyan','magenta'],                                    empty: 2, tier: 'EASY'   };
    if (n <=  8) return { colors: ['cyan','magenta','lime'],                             empty: 2, tier: 'MEDIUM' };
    if (n <= 15) return { colors: ['cyan','magenta','lime','yellow'],                    empty: 2, tier: 'HARD'   };
    if (n <= 25) return { colors: ['cyan','magenta','lime','yellow','orange'],           empty: 2, tier: 'EXPERT' };
    return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 2, tier: 'MASTER' };
}
```

Replace with:
```js
function levelConfig(n) {
    if (n <=  3) return { colors: ['cyan','magenta'],                                    empty: 2, tier: 'EASY'   };
    if (n <=  8) return { colors: ['cyan','magenta','lime'],                             empty: 2, tier: 'MEDIUM' };
    if (n <= 15) return { colors: ['cyan','magenta','lime','yellow'],                    empty: 2, tier: 'HARD'   };
    if (n <= 25) return { colors: ['cyan','magenta','lime','yellow','orange'],           empty: 1, tier: 'EXPERT' };
    return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 1, tier: 'MASTER' };
}
```

- [ ] **Step 2: Verify in browser**

Open the level select and navigate to Level 16 (EXPERT). Start it. The canvas should show **6 tubes** (5 colours + 1 empty) instead of 7. The puzzle should be harder but still solvable (the seeded generator guarantees solvability via backwards shuffle).

Open DevTools console and run:
```js
levelConfig(16).empty  // should be 1
levelConfig(15).empty  // should be 2
levelConfig(26).empty  // should be 1
```

- [ ] **Step 3: Commit**

```bash
cd C:/users/juerg/colordrop
git add index.html
git commit -m "feat: 1 empty tube at EXPERT+ for increased difficulty"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| ZzFX embedded, `let zzfxX` lazy init | Task 1 Step 1 |
| `playSound()` with 5 named sounds incl. win arpeggio | Task 1 Step 2 |
| try/catch for iOS AudioContext | Task 1 Step 2 |
| `confetti: true` type flag on particles | Task 2 Step 5 |
| `updateParticles` handles `spin` / air resistance | Task 2 Step 2 |
| `drawParticles` skips confetti | Task 2 Step 3 |
| `drawConfetti()` with source-over compositing | Task 2 Step 4 |
| `spawnConfetti()` — 80 particles, 6 colours, physics | Task 2 Step 5 |
| `spawnConfetti()` called on win | Task 2 Step 6 |
| `drawConfetti()` in render loop | Task 2 Step 7 |
| `.move-good/.move-ok/.move-over` CSS classes | Task 3 Step 1 |
| `updateHUD()` sets className per par | Task 3 Step 2 |
| className cleared on move 0 (new level) | Task 3 Step 2 |
| `levelConfig` EXPERT `empty: 1` | Task 4 Step 1 |
| `levelConfig` MASTER `empty: 1` | Task 4 Step 1 |

**Placeholder scan:** No TBDs, all code is complete. ✅

**Type consistency:**
- `p.confetti` is `true` in `spawnConfetti()`, checked with `if (p.confetti)` in `drawParticles()` and `updateParticles()` — consistent. ✅
- `p.spin` in radians/s, multiplied by `dt` in `updateParticles` — units consistent. ✅
- `parForLevel(LEVEL.current)` used in `updateHUD()` — `parForLevel` defined in Task 1 of the previous plan. ✅
- `CW` and `CH` (canvas width/height constants) used in `spawnConfetti()` — these are defined in the CONSTANTS section of the existing file. ✅
