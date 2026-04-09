# Premium Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Kittysort into a Royal Match-level premium experience through juicy ball animations, smooth screen transitions, visual consistency across menu/gameplay, and micro-interactions.

**Architecture:** Four phases, each independently deployable. Phase 1+2 extend the existing `ANIM` object and CSS transitions. Phase 3 modifies canvas rendering (background, containers, HUD). Phase 4 adds tap feedback, ambient particles, and reactive mascot. All changes respect `prefers-reduced-motion`.

**Tech Stack:** Vanilla JS (ES6 modules), Canvas 2D API, CSS transitions/transforms, Web Audio API

**Spec:** `docs/superpowers/specs/2026-04-09-premium-polish-design.md`

---

## File Map

| File | Changes | Phase |
|------|---------|-------|
| `js/constants.js` | New timing constants | 1 |
| `js/animations.js` | New easings, new ANIM fields, resetAnim update | 1, 4 |
| `js/render.js` | Ball deformation, impact ring, tube wobble, ripple, ambient draw | 1, 3, 4 |
| `js/main.js` | Transition system, win sequence, shake, number animations, tube intro trigger | 1, 2, 4 |
| `js/containers.js` | Gold rim, warmer tint, solved glow | 3 |
| `js/background.js` | Warmer colors, gold ambient glow | 3 |
| `js/particles.js` | Trail density, ambient fireflies | 1, 4 |
| `js/cat-renderer.js` | Reactive mascot (head track, idle, win) | 4 |
| `js/audio.js` | Button click sound | 4 |
| `index.html` | CSS transitions, HUD gold styling, number animation CSS | 2, 3, 4 |

---

## Phase 1: Ball-Animation — Premium Movement

### Task 1: New easing functions and ANIM fields

**Files:**
- Modify: `js/constants.js:14-17`
- Modify: `js/animations.js`

- [ ] **Step 1: Add new timing constants to constants.js**

In `js/constants.js`, change the timing constants:

```js
export const DUR_LIFT    = 220;
export const DUR_ARC     = 420;    // was 380
export const DUR_BOUNCE  = 480;
export const DUR_IMPACT  = 80;
export const DUR_SETTLE  = 280;
export const DUR_WOBBLE  = 400;
export const DUR_JIGGLE  = 200;
```

- [ ] **Step 2: Add new easing functions to animations.js**

Append after `easeOutBounce` in `js/animations.js`:

```js
export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

export function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
}
```

- [ ] **Step 3: Extend ANIM object and resetAnim**

In `js/animations.js`, add new fields to the ANIM object:

```js
export const ANIM = {
  arc:        null,
  bounceMap:  new Map(),
  particles:  [],
  busy:       false,
  tubeWobble: new Map(),   // tubeIdx → { startTime, duration, amplitude }
  jiggleMap:  new Map(),   // "tube-ball" → { startTime, duration }
  impactRing: null,        // { x, y, startTime, duration, color }
  tubeIntro:  null,        // [{ startTime, duration }] per tube, or null
  ripple:     null,        // { x, y, startTime }
  tubeShake:  new Map(),   // tubeIdx → { startTime, duration, amplitude }
  screenShake: null,       // { startTime, duration, amplitude }
  goldFlash:  null,        // { startTime, duration } — win gold overlay
  canvasDim:  0,           // 0..1, canvas dimming for win overlay
};

export function resetAnim() {
  ANIM.arc        = null;
  ANIM.bounceMap  = new Map();
  ANIM.particles  = [];
  ANIM.busy       = false;
  ANIM.tubeWobble = new Map();
  ANIM.jiggleMap  = new Map();
  ANIM.impactRing = null;
  ANIM.tubeIntro  = null;
  ANIM.ripple     = null;
  ANIM.tubeShake  = new Map();
  ANIM.screenShake = null;
  ANIM.goldFlash  = null;
  ANIM.canvasDim  = 0;
}
```

- [ ] **Step 4: Update imports in render.js**

In `js/render.js` line 10, update imports:

```js
import { easeInOut, easeOutBack, easeOutBounce, easeOutQuart, easeOutElastic, bezier2, ANIM } from './animations.js';
```

And update constants import at line 3-8 to include new constants:

```js
import {
  CW, CH, TUBE_W, TUBE_H, TUBE_TOP, TUBE_BOT,
  BALL_R, BALL_D, BALL_GAP, BALL_PAD,
  FLOAT_Y_BASE, DUR_LIFT, DUR_ARC, DUR_BOUNCE,
  DUR_IMPACT, DUR_SETTLE, DUR_WOBBLE, DUR_JIGGLE,
  PALETTE, THEMES, TUTORIAL_SCRIPT,
} from './constants.js';
```

- [ ] **Step 5: Test and commit**

Run: Open `http://kittysort.de` locally (or `index.html`), verify game loads without errors in console.

```bash
git add js/constants.js js/animations.js js/render.js
git commit -m "feat: add new easing functions and ANIM fields for premium ball animation"
```

---

### Task 2: Ball deformation (squash & stretch) during arc

**Files:**
- Modify: `js/render.js` — `drawArcBall()` and `drawFloatingBall()`

- [ ] **Step 1: Add stretch during lift in drawFloatingBall**

In `js/render.js`, replace the `drawFloatingBall` function (lines 201-223):

```js
function drawFloatingBall(ctx, ts, G) {
  if (G.selected === -1) return;
  const tube = G.tubes[G.selected];
  if (!tube.length) return;

  const tubeCount = G.tubes.length;
  const cx    = tubeCX(G.selected, tubeCount);
  const color = tube[tube.length - 1];

  const restY   = ballCY(tube.length - 1);
  const targetY = floatY(ts);
  const elapsed = G.selectedTime >= 0 ? ts - G.selectedTime : DUR_LIFT;
  const liftT   = Math.min(elapsed / DUR_LIFT, 1);
  const bY      = restY + (targetY - restY) * easeOutBack(liftT);

  // Stretch during lift, normalize at top (skip if reduced motion)
  let sx = 1, sy = 1;
  if (!REDUCED_MOTION) {
    const stretchT = liftT < 0.7 ? liftT / 0.7 : 1 - (liftT - 0.7) / 0.3;
    sx = 1 - stretchT * 0.12;  // scaleX: 1 → 0.88 → 1
    sy = 1 + stretchT * 0.15;  // scaleY: 1 → 1.15 → 1
  }

  const pulse = liftT >= 1 ? 1 + Math.sin(ts * 0.005) * 0.04 : 1;

  // Pulsing glow ring when floating
  if (liftT >= 1 && !REDUCED_MOTION) {
    const ringPulse = 0.5 + 0.5 * Math.sin(ts * 0.004);
    const ringR = BALL_R + 6 + ringPulse * 4;  // 20→24px radius
    ctx.save();
    ctx.strokeStyle = `rgba(255,200,100,${0.15 + ringPulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, bY, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Shadow ellipse on tube below
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, ballCY(tube.length - 1) + BALL_R + 4, BALL_R * 0.7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, bY);
  ctx.scale(sx * pulse, sy * pulse);
  drawBall(ctx, 0, 0, color, true, ts);
  ctx.restore();
}
```

- [ ] **Step 2: Add directional stretch and improved easing in drawArcBall**

Replace the `drawArcBall` function (lines 174-199):

```js
function drawArcBall(ctx, ts, dt, G) {
  const a       = ANIM.arc;
  const elapsed = ts - a.startTime;
  const rawT    = Math.min(elapsed / a.duration, 1);
  const easedT  = easeOutQuart(rawT);
  const pos     = bezier2(easedT, a.p0, a.p1, a.p2);

  // Compute tangent for directional stretch
  const epsilon = 0.01;
  const tA = Math.max(0, easedT - epsilon);
  const tB = Math.min(1, easedT + epsilon);
  const pA = bezier2(tA, a.p0, a.p1, a.p2);
  const pB = bezier2(tB, a.p0, a.p1, a.p2);
  const angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);

  // Stretch factor: full in middle, normalize at ends
  const stretchAmount = rawT < 0.85 ? 1 : (1 - rawT) / 0.15;
  const sx = 1 + 0.12 * stretchAmount;  // elongate along direction
  const sy = 1 - 0.10 * stretchAmount;  // compress perpendicular

  // Trail particle (denser)
  if (rawT < 0.92 && Math.random() < 0.7 * dt * 60) {
    const col = PALETTE[a.color];
    if (col) {
      spawnParticle(
        pos.x + (Math.random() - 0.5) * 4,
        pos.y + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        -2 - Math.random() * 2,
        col.glow,
        4 + Math.random() * 3,
        400 + Math.random() * 100,
        0.08,
      );
    }
  }

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);
  ctx.scale(sx, sy);
  drawBall(ctx, 0, 0, a.color, true, ts);
  ctx.restore();
}
```

- [ ] **Step 3: Test and commit**

Open the game, select a ball and move it. Verify:
- Ball stretches vertically during lift
- Ball elongates along flight direction during arc
- Trail particles are denser and larger
- Ball normalizes shape at end of arc

```bash
git add js/render.js
git commit -m "feat: add squash/stretch deformation to ball lift and arc"
```

---

### Task 3: Impact effects (squash, ring, tube wobble, neighbor jiggle)

**Files:**
- Modify: `js/render.js` — `updateArc()`, `drawTubes()`, new draw helpers

- [ ] **Step 1: Add impact ring, wobble, and jiggle triggers in updateArc**

Replace the `updateArc` function in `js/render.js` (lines 78-132):

```js
function updateArc(ts, G) {
  if (!ANIM.arc) return;
  const elapsed = ts - ANIM.arc.startTime;
  if (elapsed < ANIM.arc.duration) return;

  const { toTube, color } = ANIM.arc;
  const ballIdx    = G.tubes[toTube].length - 1;
  const tubeCount  = G.tubes.length;
  const cx         = tubeCX(toTube, tubeCount);
  const cy         = ballCY(ballIdx);

  // Squash on impact: scaleY 0.7, scaleX 1.3 → spring back
  ANIM.jiggleMap.set(`${toTube}-${ballIdx}`, {
    startTime: ts,
    duration: DUR_IMPACT,
    squash: true,  // flag: this is a squash, not a neighbor jiggle
  });

  // Bounce on landed ball (reduced amplitude for more natural feel)
  ANIM.bounceMap.set(`${toTube}-${ballIdx}`, {
    startTime: ts,
    duration:  DUR_BOUNCE,
    amplitude: 10,
  });

  // Impact ring
  const col = PALETTE[color];
  if (col) {
    ANIM.impactRing = {
      x: cx, y: cy,
      startTime: ts,
      duration: 300,
      color: col.glow,
    };
  }

  // Tube wobble (skip in reduced-motion)
  if (!REDUCED_MOTION) {
    ANIM.tubeWobble.set(toTube, {
      startTime: ts,
      duration: DUR_WOBBLE,
      amplitude: 1.5 * Math.PI / 180,  // 1.5 degrees in radians
    });

    // Neighbor jiggle — balls below the landed one
    for (let bi = 0; bi < ballIdx; bi++) {
      const key = `${toTube}-${bi}`;
      ANIM.jiggleMap.set(key, {
        startTime: ts + (ballIdx - bi) * 30,  // 30ms stagger per position
        duration: DUR_JIGGLE,
      });
    }
  }

  playSound('pop');

  // Tube explosion (once per solved tube)
  if (!G.solvedTubes.has(toTube) && isSolved(G.tubes[toTube])) {
    G.solvedTubes.add(toTube);
    triggerTubeExplosion(toTube, G.tubes, (idx) => tubeCX(idx, tubeCount));
    playSound('solved');
  }

  ANIM.arc  = null;
  ANIM.busy = false;

  // Tutorial: advance 'move' step
  if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
      TUTORIAL_SCRIPT[G.tutStep].waitFor === 'move') {
    G.tutStep++;
    if (G.onTutAdvance) G.onTutAdvance();
  }

  // Win check
  const won = G.tutorial ? checkWinTutorial(G.tubes) : checkWinState(G.tubes);
  if (won) {
    G.won = true;
    spawnConfetti();
    scheduleWinFireworks();
    playSound('win');
    if (G.tutorial) {
      if (G.tutStep < TUTORIAL_SCRIPT.length &&
          TUTORIAL_SCRIPT[G.tutStep].waitFor === 'win') {
        G.tutStep++;
      }
      setTimeout(() => { if (G.onTutAdvance) G.onTutAdvance(); }, 600);
    } else {
      setTimeout(() => { if (G.onWin) G.onWin(); }, 600);
    }
  }

  if (G.onHUDUpdate) G.onHUDUpdate();
}
```

- [ ] **Step 2: Add update functions for new animation types**

Add after `updateBounces` in `js/render.js`:

```js
function updateWobbles(ts) {
  for (const [key, w] of ANIM.tubeWobble) {
    if (ts - w.startTime >= w.duration) ANIM.tubeWobble.delete(key);
  }
}

function updateJiggles(ts) {
  for (const [key, j] of ANIM.jiggleMap) {
    if (ts - j.startTime >= j.duration) ANIM.jiggleMap.delete(key);
  }
}

function updateImpactRing(ts) {
  if (ANIM.impactRing && ts - ANIM.impactRing.startTime >= ANIM.impactRing.duration) {
    ANIM.impactRing = null;
  }
}
```

- [ ] **Step 3: Apply wobble to tube rendering in drawTubes**

Replace the `drawTubes` function (lines 142-172):

```js
function drawTubes(ctx, ts, G) {
  const tubeCount = G.tubes.length;
  const theme     = THEMES[G.theme] || THEMES.EASY;

  for (let i = 0; i < tubeCount; i++) {
    const tube  = G.tubes[i];
    const cx    = tubeCX(i, tubeCount);
    const sel   = G.selected === i && !ANIM.busy;
    const solved   = isSolved(tube);
    const flashing = G.flashTube === i && G.frameTime < G.flashUntil;
    const hintSrc  = G.hintFrom === i && G.frameTime < G.hintUntil;
    const hintDst  = G.hintTo === i && G.frameTime < G.hintUntil;
    const arcDest  = ANIM.arc && ANIM.arc.toTube === i;

    const state = { selected: sel, solved, flashing, hintSrc, hintDst };

    // Tube intro animation
    let introOffsetY = 0;
    let introAlpha = 1;
    if (ANIM.tubeIntro && ANIM.tubeIntro[i]) {
      const intro = ANIM.tubeIntro[i];
      const ie = ts - intro.startTime;
      if (ie < 0) {
        introOffsetY = -TUBE_H - 50;
        introAlpha = 0;
      } else if (ie < intro.duration) {
        const t = ie / intro.duration;
        introOffsetY = (-TUBE_H - 50) * (1 - easeOutBounce(t));
        introAlpha = Math.min(1, t * 3);
      }
      // Clean up finished intros
      if (ie >= intro.duration) ANIM.tubeIntro[i] = null;
    }

    // Apply wobble rotation
    const wobble = ANIM.tubeWobble.get(i);
    let wobbleAngle = 0;
    if (wobble) {
      const wt = (ts - wobble.startTime) / wobble.duration;
      wobbleAngle = wobble.amplitude * Math.sin(wt * Math.PI * 3) * (1 - wt);
    }

    ctx.save();
    if (introAlpha < 1) ctx.globalAlpha = introAlpha;
    ctx.translate(cx, TUBE_TOP + TUBE_H / 2 + introOffsetY);
    ctx.rotate(wobbleAngle);
    ctx.translate(-cx, -(TUBE_TOP + TUBE_H / 2));

    drawContainer(ctx, cx, theme.containerStyle, state, ts);

    // Balls inside tube
    const renderCount = arcDest ? tube.length - 1 : tube.length;
    for (let bi = 0; bi < renderCount; bi++) {
      const bounceKey = `${i}-${bi}`;
      const bounce    = ANIM.bounceMap.get(bounceKey);
      let yOff = 0;
      if (bounce) {
        const bt = Math.min((ts - bounce.startTime) / bounce.duration, 1);
        yOff = -bounce.amplitude * (1 - easeOutBounce(bt));
      }

      // Squash/jiggle deformation
      const jiggle = ANIM.jiggleMap.get(bounceKey);
      let jSx = 1, jSy = 1;
      if (jiggle && !REDUCED_MOTION) {
        const je = ts - jiggle.startTime;
        if (je >= 0) {
          const jt = Math.min(je / jiggle.duration, 1);
          if (jiggle.squash) {
            // Landing squash: scaleY 0.7→1, scaleX 1.3→1
            const squashT = easeOutElastic(jt);
            jSx = 1.3 - 0.3 * squashT;  // 1.3 → 1.0
            jSy = 0.7 + 0.3 * squashT;  // 0.7 → 1.0
          } else {
            // Neighbor jiggle: subtle compress
            const compress = 0.05 * (1 - easeOutElastic(jt));
            jSx = 1 + compress;
            jSy = 1 - compress;
          }
        }
      }

      const bx = cx;
      const by = ballCY(bi) + yOff;
      if (jSx !== 1) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(jSx, jSy);
        drawBall(ctx, 0, 0, tube[bi], false, ts);
        ctx.restore();
      } else {
        drawBall(ctx, bx, by, tube[bi], false, ts);
      }
    }

    ctx.restore();
  }
}
```

- [ ] **Step 4: Add impact ring drawing**

Add before `renderFrame` in `js/render.js`:

```js
function drawImpactRing(ctx, ts) {
  const r = ANIM.impactRing;
  if (!r) return;
  const t = (ts - r.startTime) / r.duration;
  if (t > 1) return;
  const radius = BALL_R + (BALL_R * t);
  const alpha = 0.4 * (1 - t);
  ctx.save();
  ctx.strokeStyle = r.color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
```

- [ ] **Step 5: Wire up new update/draw calls in renderFrame**

In the `renderFrame` function, add the new update calls after `updateBounces(ts)`:

```js
  updateWobbles(ts);
  updateJiggles(ts);
  updateImpactRing(ts);
```

And add `drawImpactRing(ctx, ts);` after `drawParticles(ctx);`:

```js
  drawParticles(ctx);
  drawImpactRing(ctx, ts);
  drawConfetti(ctx);
```

- [ ] **Step 6: Test and commit**

Open game, complete a move. Verify:
- Impact ring expands and fades at landing
- Tube wobbles briefly on impact
- Balls below the landed ball compress and spring back
- Bounce amplitude is slightly reduced (10 instead of 14)

```bash
git add js/render.js js/constants.js
git commit -m "feat: add impact ring, tube wobble, and neighbor jiggle on ball landing"
```

---

### Task 4: Reduced-motion fallback for Phase 1

**Files:**
- Modify: `js/render.js`

- [ ] **Step 1: Add reduced-motion detection**

Add at the top of `js/render.js` (after imports):

```js
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

- [ ] **Step 2: Gate deformation and effects behind REDUCED_MOTION**

In `drawArcBall`: Wrap the stretch calculation and trail spawning:

```js
  // Directional stretch (skip if reduced motion)
  let sx = 1, sy = 1;
  let angle = 0;
  if (!REDUCED_MOTION) {
    const epsilon = 0.01;
    const tA = Math.max(0, easedT - epsilon);
    const tB = Math.min(1, easedT + epsilon);
    const pA = bezier2(tA, a.p0, a.p1, a.p2);
    const pB = bezier2(tB, a.p0, a.p1, a.p2);
    angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
    const stretchAmount = rawT < 0.85 ? 1 : (1 - rawT) / 0.15;
    sx = 1 + 0.12 * stretchAmount;
    sy = 1 - 0.10 * stretchAmount;
  }

  // Trail particles (skip if reduced motion)
  if (!REDUCED_MOTION && rawT < 0.92 && Math.random() < 0.7 * dt * 60) {
    // ... particle spawn
  }
```

In `drawFloatingBall`: wrap stretch in `if (!REDUCED_MOTION)`, default sx/sy to 1.

In `updateArc`: wrap wobble and jiggle triggers in `if (!REDUCED_MOTION)`.

- [ ] **Step 3: Test and commit**

Test with `prefers-reduced-motion: reduce` in dev tools. Ball should fly smoothly without deformation or trails.

```bash
git add js/render.js
git commit -m "feat: add reduced-motion fallback for ball animations"
```

---

## Phase 2: Screen Transitions

### Task 5: CSS transition infrastructure

**Files:**
- Modify: `index.html` — CSS section

- [ ] **Step 1: Add transition CSS for overlays and level-select**

Find the existing `.overlay` CSS in `index.html` and replace the simple opacity transition with richer animations. Add these rules after the existing overlay styles:

```css
/* ── Screen Transitions ──────────────────────────────── */
.overlay {
  /* Keep existing styles, but change transition: */
  transition: opacity .35s ease, transform .35s ease;
  transform: scale(0.92);
}
.overlay.show {
  opacity: 1; pointer-events: all;
  transform: scale(1);
}

.level-select {
  /* Keep existing, add transform */
  transition: opacity .3s ease, transform .3s ease;
  transform: translateY(0);
}
.level-select.leaving {
  opacity: 0;
  transform: translateY(-30px);
  transition: opacity .2s ease-in, transform .2s ease-in;
}

/* Sheet-style panels (settings, stats, album, streak) */
.sheet-panel {
  transform: translateY(100%);
  transition: transform .35s cubic-bezier(.2,.9,.3,1);
}
.sheet-panel:not(.hidden) {
  transform: translateY(0);
}

/* Blitz/Daily/Endless overlays — scale pop */
.blitz-overlay {
  transition: opacity .35s ease, transform .35s cubic-bezier(.2,.9,.3,1);
  transform: scale(0.85);
}
.blitz-overlay.show {
  opacity: 1; pointer-events: all;
  transform: scale(1);
}

/* Win stars stagger */
.win-star {
  display: inline-block;
  transform: scale(0);
  animation: none;
}
.overlay.show .win-star:nth-child(1) { animation: starPop .4s .1s cubic-bezier(.2,.9,.3,1) forwards; }
.overlay.show .win-star:nth-child(2) { animation: starPop .4s .2s cubic-bezier(.2,.9,.3,1) forwards; }
.overlay.show .win-star:nth-child(3) { animation: starPop .4s .3s cubic-bezier(.2,.9,.3,1) forwards; }

@keyframes starPop {
  0%   { transform: scale(0); }
  70%  { transform: scale(1.25); }
  100% { transform: scale(1); }
}

/* Reduced motion: simple crossfade only */
@media (prefers-reduced-motion: reduce) {
  .overlay, .level-select, .blitz-overlay, .sheet-panel {
    transition: opacity .2s ease !important;
    transform: none !important;
  }
  .overlay.show, .blitz-overlay.show {
    transform: none !important;
  }
  .win-star { animation: none !important; transform: scale(1) !important; }
}
```

- [ ] **Step 2: Add sheet-panel class to settings/stats/album/streak screens**

In `index.html`, add `sheet-panel` class to the existing settings, stats, album, and streak screen divs. These currently use `hidden` class toggling. Keep the `hidden` class but also add `sheet-panel` for the slide-up animation.

- [ ] **Step 3: Test and commit**

Verify overlays scale in, settings slides up from bottom, stars pop sequentially in win screen. Check reduced-motion falls back to simple fades.

```bash
git add index.html
git commit -m "feat: add CSS transition system for screen overlays and panels"
```

---

### Task 6: Tube intro (staggered drop-in) animation

**Files:**
- Modify: `js/main.js` — `generateLevel()` and `closeLevelSelect()`
- Modify: `js/render.js` — already handled in Task 3's `drawTubes`

- [ ] **Step 1: Trigger tube intro in generateLevel**

In `js/main.js`, at the end of `generateLevel()` after `resetAnim()` (around line 309), add:

```js
  // Staggered tube drop-in animation
  const introNow = performance.now();
  ANIM.tubeIntro = G.tubes.map((_, i) => ({
    startTime: introNow + i * 50,  // 50ms stagger per tube
    duration: 400,
  }));
```

- [ ] **Step 2: Also trigger tube intro after endless round load**

In `js/main.js`, in the `loadEndlessRound` function (find with grep), add the same tube intro setup after `resetAnim()` or `generateEndlessTubes()`.

- [ ] **Step 3: Clean up finished tube intros in render**

In `js/render.js` `renderFrame`, add after the other update calls:

```js
  // Clean up tube intro when all done
  if (ANIM.tubeIntro && ANIM.tubeIntro.every(t => t === null)) {
    ANIM.tubeIntro = null;
  }
```

- [ ] **Step 4: Test and commit**

Start a level — tubes should drop in from above with bounce, staggered left to right.

```bash
git add js/main.js js/render.js
git commit -m "feat: add staggered tube drop-in animation on level start"
```

---

### Task 7: Win overlay spring-in and star stagger

**Files:**
- Modify: `js/main.js` — `showWin()`
- Modify: `index.html` — win stars markup

- [ ] **Step 1: Wrap each star in a span with win-star class**

In `js/main.js`, in `showWin()`, change the star rendering (around line 609):

```js
  const starCount = stars;
  const emptyCount = 3 - stars;
  document.getElementById('winStars').innerHTML =
    Array.from({ length: starCount }, (_, i) =>
      `<span class="win-star">\u2B50</span>`
    ).join('') +
    Array.from({ length: emptyCount }, (_, i) =>
      `<span class="win-star">\u2606</span>`
    ).join('');
```

- [ ] **Step 2: Test and commit**

Win a level. Stars should pop in sequentially (100ms, 200ms, 300ms delay). Win card should scale from 0.92 to 1.

```bash
git add js/main.js
git commit -m "feat: staggered star pop animation in win overlay"
```

---

## Phase 3: Visual Consistency

### Task 8: Warmer canvas background

**Files:**
- Modify: `js/background.js`

- [ ] **Step 1: Warm up the gradient colors**

In `js/background.js`, modify the gradient stops in `drawBackground` (around line 58-60):

```js
  grad.addColorStop(0.00, `hsl(${h},${s}%,${b}%)`);
  grad.addColorStop(0.55, `hsl(${(h + 8) % 360},${Math.max(s - 5, 8)}%,${Math.max(b - 8, 48)}%)`);
  grad.addColorStop(1.00, `hsl(${(h + 18) % 360},${Math.max(s - 10, 6)}%,${Math.max(b - 18, 36)}%)`);
```

- [ ] **Step 2: Add warm gold ambient glow at bottom**

After the vignette (line 71), add:

```js
  // ── 3b. Warm gold ambient glow at bottom ───────────────────────────────
  const goldGlow = ctx.createRadialGradient(CW / 2, CH + 20, 0, CW / 2, CH + 20, CH * 0.55);
  goldGlow.addColorStop(0, 'rgba(212,135,63,0.10)');
  goldGlow.addColorStop(1, 'rgba(212,135,63,0)');
  ctx.fillStyle = goldGlow;
  ctx.fillRect(0, 0, CW, CH);
```

- [ ] **Step 3: Warm up dust mote color**

Change the mote color (line 85) from `rgba(255,240,210,...)` to a slightly warmer gold:

```js
    ctx.fillStyle = `rgba(255,225,180,${alpha.toFixed(3)})`;
```

- [ ] **Step 4: Test and commit**

Verify the gameplay canvas has a warmer, more golden tone that feels closer to the menu's cream/gold palette.

```bash
git add js/background.js
git commit -m "feat: warmer canvas background with gold ambient glow"
```

---

### Task 9: Gold rim and solved glow on tubes

**Files:**
- Modify: `js/containers.js`

- [ ] **Step 1: Add gold rim to drawContainer**

In `js/containers.js`, add a shared gold rim function before the main export:

```js
/** Draw gold rim at tube opening */
function drawGoldRim(ctx, cx, state) {
  const x = cx - TUBE_W / 2;
  const rimGrad = ctx.createLinearGradient(x, TUBE_TOP, x + TUBE_W, TUBE_TOP);
  rimGrad.addColorStop(0, 'rgba(255,215,0,0)');
  rimGrad.addColorStop(0.3, 'rgba(255,215,0,0.25)');
  rimGrad.addColorStop(0.5, 'rgba(255,215,0,0.35)');
  rimGrad.addColorStop(0.7, 'rgba(255,215,0,0.25)');
  rimGrad.addColorStop(1, 'rgba(255,215,0,0)');

  ctx.save();
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, TUBE_TOP);
  ctx.lineTo(x + TUBE_W - 6, TUBE_TOP);
  ctx.stroke();
  ctx.restore();
}

/** Solved tube gold glow (pulsing) */
function drawSolvedGlow(ctx, cx, ts) {
  const x = cx - TUBE_W / 2;
  const pulse = 0.15 + 0.10 * Math.sin(ts * 0.002);
  ctx.save();
  ctx.shadowColor = `rgba(255,215,0,${pulse})`;
  ctx.shadowBlur = 18;
  roundRect(ctx, x - 2, TUBE_TOP - 2, TUBE_W + 4, TUBE_H + 4, 10);
  ctx.strokeStyle = `rgba(255,215,0,${pulse * 0.6})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.restore();
}
```

- [ ] **Step 2: Wire gold rim into drawContainer and import TUBE_TOP**

Modify the `drawContainer` export to call gold rim and solved glow:

```js
export function drawContainer(ctx, cx, style, state, ts) {
  // Solved glow (behind container)
  if (state.solved) drawSolvedGlow(ctx, cx, ts);

  switch (style) {
    case 'cardboard': drawCardboard(ctx, cx, state, ts); break;
    case 'basket':    drawBasket   (ctx, cx, state, ts); break;
    case 'cattree':   drawCattree  (ctx, cx, state, ts); break;
    case 'catbed':    drawCatbed   (ctx, cx, state, ts); break;
    case 'golden':    drawGolden   (ctx, cx, state, ts); break;
    default:          drawCardboard(ctx, cx, state, ts); break;
  }

  // Gold rim (on top)
  drawGoldRim(ctx, cx, state);
}
```

- [ ] **Step 3: Test and commit**

Verify: all tubes have subtle gold rim at top, solved tubes have pulsing gold glow.

```bash
git add js/containers.js
git commit -m "feat: add gold rim and solved glow to tube rendering"
```

---

### Task 10: HUD royal styling

**Files:**
- Modify: `index.html` — CSS for `.hud-btn`

- [ ] **Step 1: Update HUD button CSS**

In `index.html`, find the `.hud-btn` styles and update:

```css
.hud-btn {
    padding: .45rem .85rem;
    border-radius: 18px;
    border: 1px solid rgba(255,215,0,.2);
    background: linear-gradient(180deg, rgba(255,215,0,.12), rgba(255,215,0,.04));
    color: var(--gold);
    font: bold .85rem Fredoka, Nunito, sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 0 rgba(184,134,11,.3), 0 3px 8px rgba(0,0,0,.2);
    transition: background .15s, border-color .15s, transform .1s, box-shadow .1s, opacity .2s;
}
.hud-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 0 rgba(184,134,11,.3), 0 5px 12px rgba(0,0,0,.3); }
.hud-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 rgba(184,134,11,.3); }
.hud-btn:disabled { opacity: .35; cursor: default; pointer-events: none; }
```

- [ ] **Step 2: Make hint button a full gold primary button**

Add a specific style for the hint button:

```css
#hintBtn {
    background: linear-gradient(180deg, #FFD700, #CC8800);
    color: #3a2010;
    border: none;
    box-shadow: 0 2px 0 #B8860B, 0 4px 10px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.3);
}
#hintBtn:hover { box-shadow: 0 3px 0 #B8860B, 0 6px 14px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
#hintBtn:active { box-shadow: 0 1px 0 #B8860B, inset 0 1px 0 rgba(255,255,255,.3); }
#hintBtn:disabled { opacity: .35; background: linear-gradient(180deg, #C0A040, #A08030); }
```

- [ ] **Step 3: Gold gradient on bones display**

```css
#bonesDisplay {
    background: linear-gradient(180deg, #FFD700, #d4873f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: bold;
}
```

- [ ] **Step 4: Test and commit**

Verify HUD buttons have mini-3D effect with gold accents. Hint button stands out as primary action.

```bash
git add index.html
git commit -m "feat: royal gold styling for HUD buttons"
```

---

## Phase 4: Micro-Interactions & Juice

### Task 11: Tap ripple and invalid-move tube shake

**Files:**
- Modify: `js/render.js` — new draw functions
- Modify: `js/main.js` — trigger ripple on tap, tube shake on invalid move

- [ ] **Step 1: Add ripple drawing in render.js**

Add before `renderFrame`:

```js
function drawRipple(ctx, ts) {
  const r = ANIM.ripple;
  if (!r) return;
  const elapsed = ts - r.startTime;
  if (elapsed > 400) { ANIM.ripple = null; return; }
  const t = elapsed / 400;

  ctx.save();
  // Outer ring
  const radius1 = 10 + 25 * t;
  ctx.strokeStyle = `rgba(255,215,0,${0.4 * (1 - t)})`;
  ctx.lineWidth = 2 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, radius1, 0, Math.PI * 2);
  ctx.stroke();
  // Inner ring
  const radius2 = 8 + 20 * t;
  ctx.strokeStyle = `rgba(255,215,0,${0.25 * (1 - t)})`;
  ctx.lineWidth = 1.5 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, radius2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
```

- [ ] **Step 2: Add tube shake to drawTubes**

In the `drawTubes` function, add shake handling alongside the wobble. After the wobble angle calculation, add:

```js
    // Tube shake (invalid move feedback)
    const shake = ANIM.tubeShake.get(i);
    let shakeX = 0;
    if (shake) {
      const st = (ts - shake.startTime) / shake.duration;
      if (st >= 1) {
        ANIM.tubeShake.delete(i);
      } else {
        shakeX = shake.amplitude * Math.sin(st * Math.PI * 6) * (1 - st);
      }
    }
```

Then apply `shakeX` to the translate: `ctx.translate(cx + shakeX, ...)`

- [ ] **Step 3: Trigger ripple and shake in main.js**

In `js/main.js`, import ANIM at the top if not already imported.

In `handleInput`, when a tube is tapped (after `G.selected = idx` on successful select), add:

```js
      ANIM.ripple = { x: tubeCX(idx, G.tubes.length), y: ly, startTime: G.frameTime };
```

In `triggerFlash`, add tube shake:

```js
function triggerFlash(idx) {
  G.flashTube  = idx;
  G.flashUntil = G.frameTime + 320;
  ANIM.tubeShake.set(idx, {
    startTime: G.frameTime,
    duration: 300,
    amplitude: 4,
  });
  playSound('invalid');
}
```

- [ ] **Step 4: Wire drawRipple into renderFrame**

Add `drawRipple(ctx, ts);` after `drawImpactRing(ctx, ts);`.

- [ ] **Step 5: Test and commit**

Tap a tube — verify gold ripple. Try invalid move — verify tube shakes horizontally.

```bash
git add js/render.js js/main.js
git commit -m "feat: add tap ripple effect and tube shake on invalid move"
```

---

### Task 12: Enhanced win celebration sequence

**Files:**
- Modify: `js/render.js` — screen shake
- Modify: `js/main.js` — win sequence timing

- [ ] **Step 1: Add screen shake to renderFrame**

In `js/render.js`, in `renderFrame`, at the very beginning of the draw section (after update calls), add:

```js
  // Screen shake
  if (ANIM.screenShake) {
    const se = ts - ANIM.screenShake.startTime;
    if (se < ANIM.screenShake.duration) {
      const st = se / ANIM.screenShake.duration;
      const offset = ANIM.screenShake.amplitude * Math.sin(st * Math.PI * 6) * (1 - st);
      ctx.save();
      ctx.translate(offset, offset * 0.5);
    } else {
      ANIM.screenShake = null;
    }
  }
```

And at the very end of `renderFrame` (before the timer section), close the shake and draw gold flash:

```js
  // Gold flash overlay (win celebration)
  if (ANIM.goldFlash) {
    const gfe = performance.now() - ANIM.goldFlash.startTime;
    if (gfe < ANIM.goldFlash.duration) {
      const gft = gfe / ANIM.goldFlash.duration;
      const gfa = 0.15 * (gft < 0.5 ? gft * 2 : 2 - gft * 2);
      ctx.fillStyle = `rgba(255,215,0,${gfa})`;
      ctx.fillRect(0, 0, CW, CH);
    } else {
      ANIM.goldFlash = null;
    }
  }

  // Canvas dim for win overlay
  if (ANIM.canvasDim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${ANIM.canvasDim * 0.5})`;
    ctx.fillRect(0, 0, CW, CH);
  }

  if (ANIM.screenShake) ctx.restore();
```

- [ ] **Step 2: Upgrade win sequence in render.js updateArc**

In `updateArc`, replace the simple win block with a sequenced celebration:

```js
  if (won) {
    G.won = true;

    // 0ms: Extra-strong impact on winning ball (amplitude ×1.5)
    ANIM.bounceMap.set(`${toTube}-${ballIdx}`, {
      startTime: ts,
      duration: DUR_BOUNCE,
      amplitude: 15,  // 1.5x normal (10)
    });

    // 200ms: screen shake
    if (!REDUCED_MOTION) {
      setTimeout(() => {
        ANIM.screenShake = { startTime: performance.now(), duration: 150, amplitude: 4 };
      }, 200);
    }

    // 300ms: tube explosions staggered
    const solved = [...G.solvedTubes];
    solved.forEach((ti, idx) => {
      setTimeout(() => {
        triggerTubeExplosion(ti, G.tubes, (i) => tubeCX(i, tubeCount));
      }, 300 + idx * 80);
    });

    // 500ms: gold flash overlay
    setTimeout(() => {
      ANIM.goldFlash = { startTime: performance.now(), duration: 100 };
    }, 500);

    // 600ms: confetti + sound
    setTimeout(() => {
      spawnConfetti();
      playSound('win');
    }, 600);

    // 750ms: fireworks
    setTimeout(() => scheduleWinFireworks(), 750);

    if (G.tutorial) {
      if (G.tutStep < TUTORIAL_SCRIPT.length &&
          TUTORIAL_SCRIPT[G.tutStep].waitFor === 'win') {
        G.tutStep++;
      }
      setTimeout(() => { if (G.onTutAdvance) G.onTutAdvance(); }, 1100);
    } else {
      setTimeout(() => { if (G.onWin) G.onWin(); }, 1100);
    }
  }
```

Note: Move `playSound('win')` into the setTimeout and remove it from the immediate call.

- [ ] **Step 3: Test and commit**

Win a level. Verify: impact → screen shake (200ms) → tubes explode staggered (300ms) → confetti (500ms) → win card (1000ms).

```bash
git add js/render.js
git commit -m "feat: sequenced win celebration with screen shake and staggered explosions"
```

---

### Task 13: Reactive mascot cat

**Files:**
- Modify: `js/cat-renderer.js` — `drawMascotCat()` add head tracking
- Modify: `js/render.js` — pass arc position to mascot

- [ ] **Step 1: Add reactive head tracking to drawMascotCat**

In `js/cat-renderer.js`, modify `drawMascotCat` to accept an optional `lookAt` parameter:

```js
export function drawMascotCat(ctx, cx, cy, size, ts, params, lookAt) {
```

Before drawing the head (around line 323), add head rotation based on `lookAt`:

```js
  // Head — reactive tracking
  const hy = cy - s * 0.2, hs = s * 0.55;
  let headTilt = 0;
  if (lookAt) {
    const dx = lookAt.x - cx;
    const dy = lookAt.y - cy;
    headTilt = Math.atan2(dy, dx) * 0.15;  // max ~15° tilt
    headTilt = Math.max(-0.26, Math.min(0.26, headTilt));  // clamp ±15°
  }

  ctx.save();
  ctx.translate(cx, hy);
  ctx.rotate(headTilt);
  ctx.translate(-cx, -hy);
```

And close with `ctx.restore();` after the nose/mouth/whiskers draw.

- [ ] **Step 2: Pass arc position from render.js**

In `js/render.js`, in the mascot draw section of `renderFrame` (line 382-384), change:

```js
  // Draw mascot cat when idle or tracking arc
  if (!G.won) {
    let lookAt = null;
    if (ANIM.arc) {
      const elapsed = ts - ANIM.arc.startTime;
      const rawT = Math.min(elapsed / ANIM.arc.duration, 1);
      const easedT = easeOutQuart(rawT);
      lookAt = bezier2(easedT, ANIM.arc.p0, ANIM.arc.p1, ANIM.arc.p2);
    }
    if (G.selected === -1 && !ANIM.busy || ANIM.arc) {
      drawMascotCat(ctx, CW - 45, CH - 35, 28, ts, G.mascotParams, lookAt);
    }
  }
```

Update the `drawMascotCat` import to match the new signature (already compatible — just adds optional param).

- [ ] **Step 3: Test and commit**

Move a ball — mascot cat should subtly tilt its head following the arc. Idle: normal idle animations.

```bash
git add js/cat-renderer.js js/render.js
git commit -m "feat: mascot cat tracks flying ball with head tilt"
```

---

### Task 14: Ambient firefly particles

**Files:**
- Modify: `js/particles.js`
- Modify: `js/render.js`

- [ ] **Step 1: Add ambient firefly spawner in particles.js**

Add to `js/particles.js`:

```js
const FIREFLY_COUNT = 6;
const _fireflies = [];

export function spawnFireflies(accentColor) {
  _fireflies.length = 0;
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    _fireflies.push({
      baseX: 30 + Math.random() * 360,
      baseY: 80 + Math.random() * 380,
      phase: Math.random() * Math.PI * 2,
      freqX: 0.0003 + Math.random() * 0.0004,
      freqY: 0.0004 + Math.random() * 0.0003,
      ampX: 15 + Math.random() * 20,
      ampY: 12 + Math.random() * 15,
      size: 2 + Math.random() * 2,
      color: accentColor || 'rgba(255,215,0,0.15)',
    });
  }
}

export function clearFireflies() {
  _fireflies.length = 0;
}

export function drawFireflies(ctx, ts) {
  for (const f of _fireflies) {
    const x = f.baseX + Math.sin(ts * f.freqX + f.phase) * f.ampX;
    const y = f.baseY + Math.cos(ts * f.freqY + f.phase * 1.3) * f.ampY;
    const alpha = 0.08 + 0.07 * Math.sin(ts * 0.001 + f.phase);

    // Soft glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, f.size * 3);
    glow.addColorStop(0, f.color.replace(/[\d.]+\)$/, `${alpha})`));
    glow.addColorStop(1, f.color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = glow;
    ctx.fillRect(x - f.size * 3, y - f.size * 3, f.size * 6, f.size * 6);

    // Core dot
    ctx.beginPath();
    ctx.arc(x, y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = f.color.replace(/[\d.]+\)$/, `${alpha * 1.5})`);
    ctx.fill();
  }
}
```

- [ ] **Step 2: Spawn fireflies on level start, draw in renderFrame**

In `js/render.js`, import the new functions:

```js
import { spawnParticle, updateParticles, drawParticles, drawConfetti, triggerTubeExplosion, spawnConfetti, scheduleWinFireworks, spawnFireflies, clearFireflies, drawFireflies } from './particles.js';
```

In `renderFrame`, draw fireflies right after `drawBackground`:

```js
  drawBackground(ctx, ts, theme, prevTheme, G.themeFade);
  if (!REDUCED_MOTION) drawFireflies(ctx, ts);
```

In `js/main.js`, import and call `spawnFireflies` in `generateLevel` after setting the theme:

```js
import { spawnFireflies, clearFireflies } from './particles.js';
```

```js
  // In generateLevel, after theme setup:
  const themeObj = THEMES[G.theme] || THEMES.EASY;
  spawnFireflies(themeObj.accentColor.replace(')', ',0.15)').replace('rgb', 'rgba'));
```

- [ ] **Step 3: Test and commit**

Start a level — see 6 softly drifting firefly dots in the background.

```bash
git add js/particles.js js/render.js js/main.js
git commit -m "feat: add ambient firefly particles in gameplay background"
```

---

### Task 15: Button click sound and tap feedback CSS

**Files:**
- Modify: `js/audio.js`
- Modify: `index.html` — CSS
- Modify: `js/main.js` — add sound to button clicks

- [ ] **Step 1: Add button click sound to audio.js**

In `js/audio.js`, add a new sound in the `playSound` switch or sound map (find the pattern used for other sounds). Add a `click` sound:

```js
function synthClick(ctx, dest, t0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1200;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.15 * _sfxVolume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}
```

Register it in the sound map/switch so `playSound('click')` works.

- [ ] **Step 2: Add tap scale CSS to all buttons**

In `index.html`, add:

```css
/* Button tap feedback */
.hud-btn:active, .win-btn:active, .blitz-btn:active,
.ls-action-btn:active, .premium-btn:active {
    transform: translateY(1px) scale(0.96);
    transition: transform 0.08s ease;
}
```

- [ ] **Step 3: Add click sound to key button event listeners**

In `js/main.js`, add `playSound('click')` to the button event listeners for: nextLevelBtn, menuBtn, menuBtnHud, undoBtn, resetBtn, settingsBtn, albumBtn, statsBtn, and the daily/blitz/endless buttons. Add it as the first line of each click handler.

- [ ] **Step 4: Test and commit**

Click buttons — hear subtle click, see scale feedback.

```bash
git add js/audio.js js/main.js index.html
git commit -m "feat: add button click sound and tap scale feedback"
```

---

### Task 16: Canvas dim on win + hideOverlay undim

**Files:**
- Modify: `js/main.js` — `showWin()` and `hideOverlay()`

- [ ] **Step 1: Dim canvas when win overlay shows**

In `js/main.js`, in `showWin()` before showing the overlay, add:

```js
  // Dim canvas behind win overlay (300ms fade)
  const dimStart = performance.now();
  function dimStep() {
    const elapsed = performance.now() - dimStart;
    ANIM.canvasDim = Math.min(elapsed / 300, 1);
    if (ANIM.canvasDim < 1) requestAnimationFrame(dimStep);
  }
  dimStep();
```

- [ ] **Step 2: Undim canvas when overlay hides**

In `hideOverlay()`, add:

```js
function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
  // Undim canvas
  const undimStart = performance.now();
  function undimStep() {
    const elapsed = performance.now() - undimStart;
    ANIM.canvasDim = Math.max(1 - elapsed / 200, 0);
    if (ANIM.canvasDim > 0) requestAnimationFrame(undimStep);
  }
  undimStep();
}
```

- [ ] **Step 3: Test and commit**

Win a level — canvas dims behind the win card. Dismiss — canvas undims.

```bash
git add js/main.js
git commit -m "feat: canvas dim/undim for win overlay"
```

---

### Task 17: Cat mascot idle animations and invalid-move reaction

**Files:**
- Modify: `js/cat-renderer.js`

- [ ] **Step 1: Add idle animation state and headshake to drawMascotCat**

In `js/cat-renderer.js`, add state variables at module level:

```js
let _catIdleTimer = 0;
let _catIdleAnim = null;  // 'yawn' | 'wash' | null
let _catIdleStart = 0;
let _catShake = 0;        // headshake timestamp (set from outside)
let _catWinJump = 0;      // win jump timestamp

export function triggerCatShake() { _catShake = performance.now(); }
export function triggerCatWinJump() { _catWinJump = performance.now(); }
```

- [ ] **Step 2: Implement idle cycle in drawMascotCat**

In `drawMascotCat`, before drawing the head, add:

```js
  // Idle animation cycle (8-12s)
  if (!lookAt && !_catIdleAnim) {
    if (ts - _catIdleTimer > 8000 + Math.random() * 4000) {
      _catIdleTimer = ts;
      _catIdleAnim = Math.random() > 0.5 ? 'yawn' : 'wash';
      _catIdleStart = ts;
    }
  }
  if (_catIdleAnim && ts - _catIdleStart > 1500) _catIdleAnim = null;

  // Yawn: open mouth wider
  let mouthOpen = 0;
  if (_catIdleAnim === 'yawn') {
    const yt = (ts - _catIdleStart) / 1500;
    mouthOpen = yt < 0.4 ? yt / 0.4 : (1 - yt) / 0.6;
  }

  // Win jump
  let jumpY = 0;
  if (_catWinJump && ts - _catWinJump < 600) {
    const jt = (ts - _catWinJump) / 600;
    jumpY = -10 * Math.sin(jt * Math.PI * 2) * (1 - jt);
  }

  // Headshake on invalid move
  let shakeAngle = 0;
  if (_catShake && ts - _catShake < 400) {
    const st = (ts - _catShake) / 400;
    shakeAngle = 0.15 * Math.sin(st * Math.PI * 4) * (1 - st);
  }
```

Apply `jumpY` to the body translate, `shakeAngle` to head rotation (add to existing `headTilt`), and `mouthOpen` to open the mouth wider when yawning (scale the mouth W-shape y offset by `1 + mouthOpen * 0.8`).

- [ ] **Step 3: Trigger reactions from main.js**

In `js/main.js`, import the triggers:

```js
import { drawCatPortrait, drawMascotCat, CAT_PARAMS, triggerCatShake, triggerCatWinJump } from './cat-renderer.js';
```

In `triggerFlash()` add: `triggerCatShake();`

In the win celebration sequence (updateArc), add at 0ms: `triggerCatWinJump();`

- [ ] **Step 4: Test and commit**

Invalid move: cat shakes head. Idle >8s: cat yawns. Win: cat jumps.

```bash
git add js/cat-renderer.js js/main.js
git commit -m "feat: reactive mascot cat with idle, headshake, and win jump"
```

---

### Task 18: Tube tap flash and invalid-move reddish flash

**Files:**
- Modify: `js/containers.js` — add flash state support
- Modify: `js/render.js` — pass tap flash state

- [ ] **Step 1: Add tap brightness flash to containers**

In `js/containers.js`, in `applyStateGlow`, add at the top:

```js
  if (state.tapFlash) {
    ctx.shadowColor = 'rgba(255,215,0,0.3)';
    ctx.shadowBlur = 12;
    return;  // tap flash overrides other states briefly
  }
```

- [ ] **Step 2: Pass tapFlash state from render.js**

In `drawTubes` in `render.js`, add to the state object:

```js
    const tapFlash = ANIM.ripple && Math.abs(cx - ANIM.ripple.x) < TUBE_W &&
                     ts - ANIM.ripple.startTime < 50;
    const redFlash = ANIM.tubeShake.has(i) &&
                     ts - ANIM.tubeShake.get(i).startTime < 50;
    const state = { selected: sel, solved, flashing: flashing || redFlash, hintSrc, hintDst, tapFlash };
```

- [ ] **Step 3: Test and commit**

Tap a tube: brief brightness flash. Invalid move: brief red flash + shake.

```bash
git add js/containers.js js/render.js
git commit -m "feat: tube tap flash and invalid-move reddish flash"
```

---

### Task 19: Move counter number animation

**Files:**
- Modify: `index.html` — CSS for number roll
- Modify: `js/main.js` — `updateHUD()` move counter animation

- [ ] **Step 1: Add number roll CSS**

In `index.html`, add:

```css
/* Move counter roll animation */
.move-counter-wrap {
    display: inline-block;
    overflow: hidden;
    height: 1.4em;
    vertical-align: middle;
    position: relative;
}
.move-counter-wrap .move-old,
.move-counter-wrap .move-new {
    display: block;
    transition: transform .2s cubic-bezier(.2,.9,.3,1);
}
.move-counter-wrap.rolling .move-old {
    transform: translateY(-100%);
}
.move-counter-wrap.rolling .move-new {
    transform: translateY(-100%);
}
```

- [ ] **Step 2: Update moveCount element in HTML**

Find the `moveCount` span in `index.html` and wrap it:

```html
<span class="move-counter-wrap" id="moveCountWrap">
  <span class="move-old" id="moveCount">0</span>
  <span class="move-new" id="moveCountNew">0</span>
</span>
```

- [ ] **Step 3: Animate number change in updateHUD**

In `js/main.js`, modify the move counter update in `updateHUD`:

```js
  const mc = document.getElementById('moveCount');
  const mcNew = document.getElementById('moveCountNew');
  const mcWrap = document.getElementById('moveCountWrap');

  if (mc.textContent !== String(G.moves)) {
    mcNew.textContent = G.moves;
    mcWrap.classList.add('rolling');
    setTimeout(() => {
      mc.textContent = G.moves;
      mcWrap.classList.remove('rolling');
    }, 200);
  }
```

- [ ] **Step 4: Test and commit**

Make a move — counter should roll up to new number.

```bash
git add index.html js/main.js
git commit -m "feat: add rolling number animation for move counter"
```

---

## Final Review

### Task 20: Integration test and cleanup

- [ ] **Step 1: Full playthrough test**

Play through: Tutorial → Level 1-3 → Win → Next Level → Settings → Album → Daily Challenge → Blitz. Verify at each step:
- Ball animations: stretch on lift, directional stretch in arc, squash on impact, wobble, jiggle
- Screen transitions: level-select slides up, canvas scales in, tubes drop in staggered
- Win: shake → stagger explosions → confetti → win card
- Visual consistency: warm background, gold rims, HUD matches menu style
- Micro-interactions: ripple on tap, shake on invalid, mascot tracks ball
- Performance: 60fps on mobile (check with dev tools performance tab)
- Reduced motion: enable in dev tools, verify graceful fallback

- [ ] **Step 2: Fix any issues found**

Address any bugs or visual glitches discovered in the playthrough.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: integration fixes for premium polish"
```
