# Color Drop Phase 3a — Visual Themes + Blitzrunde Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 tier-bound visual themes (background + ball style) and a Blitzrunde mechanic (every 5th level has a countdown timer, fail on timeout).

**Architecture:** All changes in `index.html` only. `THEMES` constant drives `drawBackground()` and `drawBall()` via `G.theme`. Timer state lives in `G.timer`; `updateTimer()` / `drawTimerBar()` run every frame. Blitz flow: `generateLevel()` shows `#blitzOverlay` → BEREIT! starts timer → timeout shows `#timeoutOverlay`.

**Tech Stack:** Vanilla JS, HTML5 Canvas 2D, CSS animations, no new dependencies.

---

## File Map

| File | Changes |
|------|---------|
| `index.html` CSS (~line 11) | Add `.timer-bar`, `.blitz-overlay`, `.blitz-inner`, `.blitz-title`, `.blitz-btn`, keyframes |
| `index.html` HTML (~line 436) | Add `#timerBar` in `.canvas-inner`; add `#blitzOverlay`, `#timeoutOverlay` before `<script>` |
| `index.html` JS constants (~line 531) | Add `THEMES` after `PALETTE` |
| `index.html` JS state (~line 574) | Add `G.theme`, `G.themePrev`, `G.themeFade`, `G.timer` |
| `index.html` JS helpers (~line 621) | Add `isTimedLevel()`, `timerDuration()` after `parForLevel()` |
| `index.html` JS `generateLevel()` (~line 650) | Theme detection + blitz overlay flow |
| `index.html` JS `drawBackground()` (~line 1281) | Theme-driven animated gradient + fade interpolation |
| `index.html` JS `drawBall()` (~line 1393) | 5 ball styles driven by `G.theme.ballStyle` |
| `index.html` JS `render()` (~line 1222) | Advance `G.themeFade`; call `updateTimer()`, `drawTimerBar()` |
| `index.html` JS `playSound()` (~line 1684) | Add `'tick'` case |
| `index.html` JS new functions | Add `updateTimer()`, `drawTimerBar()`, `showBlitzOverlay()`, `showTimeout()` |
| `index.html` JS `buildLevelSelect()` (~line 1552) | ⚡ icon on timed level buttons |
| `index.html` JS `updateHUD()` (~line 1707) | ⚡ in level label for timed levels |
| `index.html` JS event listeners (~line 1765) | Wire `#blitzStartBtn`, `#timeoutRetryBtn` |

---

## Task 1: THEMES constant + G state fields

**Files:**
- Modify: `index.html` — JS constants block (~line 531); G object (~line 574)

- [ ] **Step 1: Add `THEMES` constant after `PALETTE`**

Find `};` closing PALETTE (line ~530). Insert immediately after it:

```js

/* ═══════════════════════════════════════════════════════════
   VISUAL THEMES  (one per tier — background + ball style)
═══════════════════════════════════════════════════════════ */

/**
 * Each theme drives drawBackground() and drawBall().
 * hues[0..2]     — HSL hue for the 3 radial-gradient stops
 * hueDelta[0..2] — sinusoidal variation amplitude per stop
 * sat[0..2]      — HSL saturation % per stop
 * bri[0..2]      — HSL brightness % per stop
 * particleColor  — CSS colour for background dust particles (future use)
 * ballStyle      — one of: 'neon' | 'satin' | 'crystal' | 'fire' | 'aurum'
 * accentColor    — CSS hex used for Blitzrunde overlay glow
 */
const THEMES = {
    EASY:   { hues:[265,230,210], hueDelta:[12, 8,10], sat:[60,55,50], bri:[9,6,4],
               particleColor:'rgba(255,255,255,.6)', ballStyle:'neon',    accentColor:'#7c4dff' },
    MEDIUM: { hues:[ 15, 20, 30], hueDelta:[10, 6, 8], sat:[65,60,55], bri:[8,5,3],
               particleColor:'rgba(255,107,53,.6)',   ballStyle:'satin',   accentColor:'#ff7043' },
    HARD:   { hues:[200,210,220], hueDelta:[ 8, 5, 7], sat:[70,65,60], bri:[8,5,3],
               particleColor:'rgba(168,216,234,.6)',  ballStyle:'crystal', accentColor:'#00b4d8' },
    EXPERT: { hues:[  0, 10, 15], hueDelta:[12, 8,10], sat:[70,65,60], bri:[8,5,3],
               particleColor:'rgba(255,69,0,.6)',     ballStyle:'fire',    accentColor:'#ff3d00' },
    MASTER: { hues:[ 45, 50, 40], hueDelta:[ 8, 5, 6], sat:[60,55,50], bri:[9,6,4],
               particleColor:'rgba(255,215,0,.6)',    ballStyle:'aurum',   accentColor:'#ffc107' },
};
```

- [ ] **Step 2: Add theme + timer fields to `G`**

Find the `const G = {` block (~line 574). Add four fields after `tutStep: 0,`:

```js
    tutStep:      0,        // index into TUTORIAL_SCRIPT
    theme:        null,     // current THEMES entry — set by generateLevel(), init below
    themePrev:    null,     // previous THEMES entry during fade, null when no transition
    themeFade:    1,        // 0→1 progress of theme-change fade (500 ms)
    timer:        null,     // null | { active, endTime, duration, _lastTick }
```

- [ ] **Step 3: Initialise `G.theme` directly after the `G` declaration**

Find `const ANIM = {` (~line 594). Insert one line immediately before it:

```js
G.theme = THEMES.EASY;   // default until generateLevel() is called
```

- [ ] **Step 4: Open browser, verify no console errors**

Open `file:///C:/users/juerg/colordrop/index.html`. DevTools → Console.
Expected: zero errors, game loads normally (EASY theme is default, background still blue-purple).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(themes): add THEMES constant and G state fields (theme, themePrev, themeFade, timer)"
```

---

## Task 2: Theme-aware `drawBackground()` + fade in `render()`

**Files:**
- Modify: `index.html` — `drawBackground()` (~line 1281); `render()` (~line 1222)

- [ ] **Step 1: Replace `drawBackground()`**

Find and replace the entire `drawBackground` function:

```js
// BEFORE (replace this):
function drawBackground(ts) {
    const t  = ts * 0.0002;
    const cx = CW * (0.5 + 0.15 * Math.sin(t));
    const cy = CH * (0.3  + 0.10 * Math.cos(t * 0.7));
    const r  = Math.hypot(CW, CH) * 0.65;

    const grad = ctx.createRadialGradient(cx, cy, 0, CW/2, CH/2, r);
    grad.addColorStop(0,   `hsl(${265+12*Math.sin(t*1.2)},60%,9%)`);
    grad.addColorStop(0.5, `hsl(${230+ 8*Math.cos(t)     },55%,6%)`);
    grad.addColorStop(1,   `hsl(${210+10*Math.sin(t*0.8) },50%,4%)`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);
}
```

```js
// AFTER:
function drawBackground(ts) {
    const t  = ts * 0.0002;
    const cx = CW * (0.5 + 0.15 * Math.sin(t));
    const cy = CH * (0.3  + 0.10 * Math.cos(t * 0.7));
    const r  = Math.hypot(CW, CH) * 0.65;

    // Interpolate between previous and current theme during fade
    const f    = G.themeFade;
    const prev = G.themePrev || G.theme;
    function lerp(a, b) { return a + (b - a) * f; }
    const hues = G.theme.hues.map((h, i) => lerp(prev.hues[i], h));
    const delt = G.theme.hueDelta.map((d, i) => lerp(prev.hueDelta[i], d));
    const sat  = G.theme.sat.map((s, i) => lerp(prev.sat[i], s));
    const bri  = G.theme.bri.map((b, i) => lerp(prev.bri[i], b));

    const grad = ctx.createRadialGradient(cx, cy, 0, CW/2, CH/2, r);
    grad.addColorStop(0,   `hsl(${hues[0]+delt[0]*Math.sin(t*1.2)},${sat[0]}%,${bri[0]}%)`);
    grad.addColorStop(0.5, `hsl(${hues[1]+delt[1]*Math.cos(t)     },${sat[1]}%,${bri[1]}%)`);
    grad.addColorStop(1,   `hsl(${hues[2]+delt[2]*Math.sin(t*0.8) },${sat[2]}%,${bri[2]}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);
}
```

- [ ] **Step 2: Advance `G.themeFade` in `render()`**

Find in `render()`:

```js
    // ── Update animation state ────────────────────────────────
    updateArc(ts);
    updateBounces(ts);
    updateParticles(dt);
```

Add theme-fade advance after `updateParticles(dt);`:

```js
    // ── Update animation state ────────────────────────────────
    updateArc(ts);
    updateBounces(ts);
    updateParticles(dt);
    if (G.themeFade < 1) {
        G.themeFade = Math.min(G.themeFade + dt / 0.5, 1);  // 500 ms fade
        if (G.themeFade >= 1) G.themePrev = null;
    }
```

- [ ] **Step 3: Test theme switching manually**

Open DevTools console, run:
```js
G.themePrev = G.theme; G.theme = THEMES.MEDIUM; G.themeFade = 0;
```
Expected: background fades from blue-purple → warm red-amber over ~0.5 s.

Try all themes:
```js
['EASY','MEDIUM','HARD','EXPERT','MASTER'].forEach((t,i) =>
  setTimeout(() => { G.themePrev = G.theme; G.theme = THEMES[t]; G.themeFade = 0; }, i*800)
);
```
Expected: 5 distinct colour transitions, each ~500 ms.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(themes): theme-aware drawBackground() with 500ms HSL fade"
```

---

## Task 3: Theme-aware `drawBall()` — 5 ball styles

**Files:**
- Modify: `index.html` — `drawBall()` (~line 1393)

- [ ] **Step 1: Replace `drawBall()`**

Find and replace the entire `drawBall` function (from `function drawBall(cx, cy, colorId, floating) {` to its closing `}`):

```js
function drawBall(cx, cy, colorId, floating) {
    const col   = PALETTE[colorId];
    if (!col) return;
    const style = G.theme ? G.theme.ballStyle : 'neon';

    ctx.save();

    // ── Shadow / glow ────────────────────────────────────────
    if (floating) {
        ctx.shadowColor = col.glow;
        ctx.shadowBlur  = 32;
    } else {
        ctx.shadowColor   = style === 'fire'    ? 'rgba(180,20,0,.65)'   :
                            style === 'aurum'   ? 'rgba(100,70,0,.65)'   :
                            style === 'crystal' ? 'rgba(0,60,140,.50)'   :
                            'rgba(0,0,0,.55)';
        ctx.shadowBlur    = (style === 'fire' || style === 'aurum') ? 14 : 10;
        ctx.shadowOffsetY = 4;
    }

    // ── Layer 1: sphere base (3-D radial gradient) ────────────
    ctx.beginPath();
    ctx.arc(cx, cy, BALL_R, 0, Math.PI * 2);
    const offX = style === 'crystal' ? -.20 : -.25;
    const offY = style === 'crystal' ? -.22 : -.28;
    const sphere = ctx.createRadialGradient(
        cx + BALL_R * offX, cy + BALL_R * offY, BALL_R * .05,
        cx, cy, BALL_R
    );
    sphere.addColorStop(0,   col.bright);
    sphere.addColorStop(0.5, col.base);
    sphere.addColorStop(1,   col.dark);
    ctx.fillStyle = sphere;
    ctx.fill();
    ctx.restore();

    ctx.save();

    // ── Layer 2: specular overlay (style-specific) ────────────
    ctx.beginPath();
    ctx.arc(cx, cy, BALL_R, 0, Math.PI * 2);
    const spec = ctx.createRadialGradient(
        cx - BALL_R * .30, cy - BALL_R * .38, 1,
        cx, cy, BALL_R
    );
    if (style === 'satin') {
        spec.addColorStop(0,    'rgba(255,220,180,.55)');
        spec.addColorStop(0.40, 'rgba(255,180,120,.08)');
        spec.addColorStop(1,    'rgba(0,0,0,.18)');
    } else if (style === 'crystal') {
        spec.addColorStop(0,    'rgba(200,235,255,.70)');
        spec.addColorStop(0.40, 'rgba(150,210,255,.12)');
        spec.addColorStop(1,    'rgba(0,20,60,.25)');
    } else if (style === 'fire') {
        spec.addColorStop(0,    'rgba(255,200,80,.65)');
        spec.addColorStop(0.40, 'rgba(255,100,20,.10)');
        spec.addColorStop(1,    'rgba(60,0,0,.30)');
    } else if (style === 'aurum') {
        spec.addColorStop(0,    'rgba(255,240,140,.72)');
        spec.addColorStop(0.40, 'rgba(220,180,50,.12)');
        spec.addColorStop(1,    'rgba(40,20,0,.30)');
    } else {  // neon (default)
        spec.addColorStop(0,    'rgba(255,255,255,.62)');
        spec.addColorStop(0.40, 'rgba(255,255,255,.10)');
        spec.addColorStop(1,    'rgba(0,0,0,.22)');
    }
    ctx.fillStyle = spec;
    ctx.fill();

    // ── Layer 3: glint(s) ─────────────────────────────────────
    if (style === 'aurum') {
        // Two glints: primary + secondary sparkle
        ctx.beginPath();
        ctx.arc(cx - BALL_R*.28, cy - BALL_R*.30, BALL_R*.17, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,180,.85)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + BALL_R*.18, cy - BALL_R*.40, BALL_R*.09, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,200,.60)';
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(cx - BALL_R*.28, cy - BALL_R*.30, BALL_R*.17, 0, Math.PI*2);
        ctx.fillStyle = style === 'fire'    ? 'rgba(255,230,120,.80)' :
                        style === 'crystal' ? 'rgba(220,240,255,.88)' :
                        'rgba(255,255,255,.78)';
        ctx.fill();
    }

    // ── Layer 4: rim light (all styles except neon) ───────────
    if (style !== 'neon') {
        ctx.beginPath();
        ctx.arc(cx, cy, BALL_R, 0, Math.PI*2);
        const rimColor = style === 'satin'   ? 'rgba(255,120,40,.25)'  :
                         style === 'crystal' ? 'rgba(100,200,255,.28)' :
                         style === 'fire'    ? 'rgba(255,80,0,.35)'    :
                         /* aurum */           'rgba(255,200,0,.30)';
        const rim = ctx.createRadialGradient(cx, cy, BALL_R*.6, cx, cy, BALL_R);
        rim.addColorStop(0, 'rgba(0,0,0,0)');
        rim.addColorStop(1, rimColor);
        ctx.fillStyle = rim;
        ctx.fill();
    }

    ctx.restore();
}
```

- [ ] **Step 2: Test all 5 ball styles**

In DevTools console, cycle through styles:
```js
['neon','satin','crystal','fire','aurum'].forEach((s,i) =>
  setTimeout(() => { G.theme = {...G.theme, ballStyle: s}; }, i*1200)
);
```
Expected:
- `neon`: white sharp glint, coloured glow (current look)
- `satin`: warm diffuse highlight, orange rim
- `crystal`: cold blue-white glint, icy rim
- `fire`: orange-yellow glint, red rim
- `aurum`: two gold glints, gold rim

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(themes): 5 ball styles in drawBall() — neon/satin/crystal/fire/aurum"
```

---

## Task 4: `generateLevel()` — theme detection and tier-change fade

**Files:**
- Modify: `index.html` — `generateLevel()` (~line 650)

- [ ] **Step 1: Add theme detection at the start of `generateLevel()`**

Find in `generateLevel()`:

```js
function generateLevel(n) {
    LEVEL.current  = n;
    const cfg      = levelConfig(n);
    let tubes;
    let retries = 0;
```

Replace with:

```js
function generateLevel(n) {
    LEVEL.current  = n;
    const cfg      = levelConfig(n);

    // ── Theme: detect tier change, start fade ─────────────────
    const newTheme = THEMES[cfg.tier];
    if (G.theme !== newTheme) {
        G.themePrev = G.theme;
        G.theme     = newTheme;
        G.themeFade = G.themePrev ? 0 : 1;   // skip fade on very first call
    }

    let tubes;
    let retries = 0;
```

- [ ] **Step 2: Verify theme changes when crossing tier boundaries**

In DevTools console:
```js
// Simulate entering MEDIUM tier (level 4)
generateLevel(4);
console.log(G.theme === THEMES.MEDIUM); // true
console.log(G.themeFade < 1);           // true — fade started
```

Also check level 3→4 produces a fade and 4→5 (same tier) does not:
```js
generateLevel(3);
console.log(G.theme === THEMES.EASY, G.themeFade);   // true, 1 (no change)
generateLevel(4);
console.log(G.theme === THEMES.MEDIUM, G.themeFade < 1); // true, true
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(themes): generateLevel() detects tier change and triggers 500ms theme fade"
```

---

## Task 5: HTML + CSS — timer bar, Blitzrunde overlay, Timeout overlay

**Files:**
- Modify: `index.html` — HTML body; CSS `<style>` block

- [ ] **Step 1: Add `#timerBar` HTML inside `.canvas-inner`**

Find in the HTML:

```html
            <div class="canvas-inner">
                <canvas id="c"></canvas>
                <div class="hud-overlay">
                    <button class="hud-btn" id="menuBtnHud" aria-label="Menu">☰</button>
                    <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
                    <span class="hud-level" id="levelLabel">LEVEL 1 · EASY</span>
                    <button class="hud-btn" id="resetBtn" aria-label="Reset">↺</button>
                </div>
            </div>
```

Replace with:

```html
            <div class="canvas-inner">
                <canvas id="c"></canvas>
                <div class="hud-overlay">
                    <button class="hud-btn" id="menuBtnHud" aria-label="Menu">☰</button>
                    <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
                    <span class="hud-level" id="levelLabel">LEVEL 1 · EASY</span>
                    <button class="hud-btn" id="resetBtn" aria-label="Reset">↺</button>
                </div>
                <div id="timerBar" class="timer-bar"></div>
            </div>
```

- [ ] **Step 2: Add `#blitzOverlay` and `#timeoutOverlay` HTML**

Find:

```html
    <!-- Tutorial bubble -->
```

Insert directly before it:

```html
    <!-- Blitzrunde announcement -->
    <div id="blitzOverlay" class="blitz-overlay">
        <div class="blitz-inner" id="blitzInner">
            <h2 class="blitz-title">⚡ BLITZRUNDE ⚡</h2>
            <p class="blitz-level" id="blitzLevel">LEVEL 5 · EASY</p>
            <p class="blitz-time" id="blitzTime">Du hast 90 Sekunden.</p>
            <p class="blitz-sub">Kein Erbarmen.</p>
            <button id="blitzStartBtn" class="blitz-btn" type="button">BEREIT!</button>
        </div>
    </div>

    <!-- Timeout overlay -->
    <div id="timeoutOverlay" class="overlay">
        <div class="win-card">
            <div class="win-icon">⏱</div>
            <h2 class="win-title">ZEIT ABGELAUFEN</h2>
            <div class="win-actions">
                <button class="win-btn" id="timeoutRetryBtn" type="button">Nochmal ↺</button>
            </div>
        </div>
    </div>

```

- [ ] **Step 3: Add CSS for timer bar**

Find `.move-over` rule in the CSS. Append directly after its closing `}`:

```css
        /* ── Timer bar ─────────────────────────────────────────── */
        .timer-bar {
            position: absolute;
            top: 59px;          /* just below the HUD strip */
            left: 0; right: 0;
            height: 6px;
            background: #4caf50;
            transform-origin: left;
            z-index: 9;
            display: none;      /* hidden until a timed level starts */
            transition: background .4s;
        }
        .timer-bar.visible { display: block; }
        .timer-bar.pulse   { animation: timer-pulse .5s ease-in-out infinite alternate; }
        @keyframes timer-pulse { from { opacity: .55; } to { opacity: 1; } }
```

- [ ] **Step 4: Add CSS for Blitzrunde overlay**

Append directly after the `.timer-bar` rules:

```css
        /* ── Blitzrunde overlay ─────────────────────────────────── */
        .blitz-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(5,5,15,.92);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition: opacity .3s ease;
        }
        .blitz-overlay.show { opacity: 1; pointer-events: all; }

        .blitz-inner {
            text-align: center;
            padding: 2.5rem 3rem;
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,.15);
            background: rgba(15,15,40,.85);
            animation: blitz-glow-pulse 1.5s ease-in-out infinite alternate;
        }
        @keyframes blitz-glow-pulse {
            from { box-shadow: 0 0 40px 0  var(--blitz-color, #7c4dff); }
            to   { box-shadow: 0 0 90px 20px var(--blitz-color, #7c4dff); }
        }

        .blitz-title {
            font-family: var(--f-head);
            font-size: 2rem;
            color: #fff;
            margin: 0 0 .6rem;
            animation: blitz-flicker .4s ease-out;
        }
        @keyframes blitz-flicker {
            0%,100%{ opacity:1 } 10%,70%{ opacity:.15 } 20%,80%{ opacity:1 }
        }
        .blitz-level {
            font-family: var(--f-mono);
            font-size: .85rem;
            color: rgba(255,255,255,.55);
            margin: 0 0 .4rem;
            letter-spacing: 2px;
        }
        .blitz-time {
            font-size: 1.1rem;
            color: rgba(255,255,255,.85);
            margin: 0 0 .3rem;
        }
        .blitz-sub {
            font-size: .85rem;
            color: rgba(255,255,255,.40);
            margin: 0 0 1.6rem;
            font-style: italic;
        }
        .blitz-btn {
            font-family: var(--f-head);
            font-size: 1.1rem;
            letter-spacing: 3px;
            color: #fff;
            background: rgba(255,255,255,.12);
            border: 1px solid rgba(255,255,255,.30);
            border-radius: 12px;
            padding: .7rem 2.2rem;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .blitz-btn:hover  { background: rgba(255,255,255,.22); }
        .blitz-btn:active { transform: scale(.95); }
```

- [ ] **Step 5: Verify overlays render correctly**

In DevTools console:
```js
// Test blitz overlay
document.getElementById('blitzOverlay').classList.add('show');
document.getElementById('blitzOverlay').style.setProperty('--blitz-color','#ff3d00');
```
Expected: dark full-screen overlay appears with pulsing red-orange glow, "⚡ BLITZRUNDE ⚡" title flickers on appear.

```js
// Test timeout overlay
document.getElementById('blitzOverlay').classList.remove('show');
document.getElementById('timeoutOverlay').classList.add('show');
```
Expected: "ZEIT ABGELAUFEN" card with ⏱ icon and "Nochmal ↺" button.

Restore:
```js
document.getElementById('timeoutOverlay').classList.remove('show');
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(blitz): add timer bar, Blitzrunde overlay, and Timeout overlay HTML+CSS"
```

---

## Task 6: Timer helpers + `playSound('tick')` + Blitz flow in `generateLevel()`

**Files:**
- Modify: `index.html` — helpers after `parForLevel()`; `playSound()`; `generateLevel()`

- [ ] **Step 1: Add `isTimedLevel()` and `timerDuration()` after `parForLevel()`**

Find:

```js
/** Par = colours × 5. Scales fairly across all tiers. */
function parForLevel(n) {
    return levelConfig(n).colors.length * 5;
}
```

Append directly after it:

```js
/** True for every 5th level — these are Blitzrunden with a countdown timer. */
function isTimedLevel(n) { return n % 5 === 0; }

/** Timer limit in milliseconds, scaled by tier. */
function timerDuration(n) {
    const map = { EASY:90, MEDIUM:120, HARD:150, EXPERT:180, MASTER:210 };
    return (map[levelConfig(n).tier] || 120) * 1000;
}
```

- [ ] **Step 2: Add `playSound('tick')` case**

Find in `playSound()`:

```js
            case 'win':
```

Insert directly before it:

```js
            // Short crisp tick for Blitzrunde countdown (last 10 seconds)
            case 'tick':    zzfx(.18, .01, 880,    0, .004, .04, 0, 2.2);              break;
```

- [ ] **Step 3: Add `showBlitzOverlay()` helper before `generateLevel()`**

Find `function generateLevel(n) {`. Insert directly before it:

```js
/** Populate and show the Blitzrunde announcement overlay. */
function showBlitzOverlay(n) {
    const cfg = levelConfig(n);
    const sec = timerDuration(n) / 1000;
    document.getElementById('blitzLevel').textContent = 'LEVEL ' + n + ' · ' + cfg.tier;
    document.getElementById('blitzTime').textContent  = 'Du hast ' + sec + ' Sekunden.';
    document.getElementById('blitzOverlay').style.setProperty('--blitz-color', G.theme.accentColor);
    document.getElementById('blitzOverlay').classList.add('show');
}

```

- [ ] **Step 4: Update `generateLevel()` to handle timed levels**

Find in `generateLevel()` the block at the end (after the shuffle `do...while`):

```js
    // 3. Write into game state
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

Replace with:

```js
    // 3. Write into game state
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

    // 4. Timer setup — timed levels show Blitz overlay first (timer starts on BEREIT!)
    if (isTimedLevel(n)) {
        G.timer    = { active: false, endTime: 0, duration: timerDuration(n), _lastTick: -1 };
        ANIM.busy  = true;   // block input until BEREIT! is clicked
        document.getElementById('timeoutOverlay').classList.remove('show');
        showBlitzOverlay(n);
    } else {
        G.timer = null;
        document.getElementById('timerBar').classList.remove('visible', 'pulse');
        document.getElementById('timeoutOverlay').classList.remove('show');
        document.getElementById('blitzOverlay').classList.remove('show');
    }

    updateHUD();
    hideOverlay();
}
```

- [ ] **Step 5: Test Blitz overlay appears on level 5**

In DevTools console:
```js
generateLevel(5);
```
Expected:
- Canvas shows the level 5 puzzle (tubes visible)
- Blitzrunde overlay appears on top with pulsing orange glow (EASY accentColor)
- Text: "LEVEL 5 · EASY" and "Du hast 90 Sekunden."
- Input is blocked (tapping tubes does nothing)

Also verify non-timed level shows no overlay:
```js
generateLevel(6);
```
Expected: Level 6 loads immediately, no Blitz overlay.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(blitz): isTimedLevel, timerDuration, tick sound, showBlitzOverlay, generateLevel blitz flow"
```

---

## Task 7: `updateTimer()` + `drawTimerBar()` + `render()` wiring + event listeners

**Files:**
- Modify: `index.html` — new functions; `render()`; event listeners section

- [ ] **Step 1: Add `updateTimer()` and `drawTimerBar()` before `render()`**

Find `function render(ts) {`. Insert directly before it:

```js
/* ── Timer (Blitzrunde) ──────────────────────────────────── */

function updateTimer() {
    if (!G.timer || !G.timer.active) return;

    // Tick sound in last 10 seconds
    const secondsLeft = Math.ceil((G.timer.endTime - G.frameTime) / 1000);
    if (secondsLeft <= 10 && secondsLeft > 0 && secondsLeft !== G.timer._lastTick) {
        G.timer._lastTick = secondsLeft;
        playSound('tick');
    }

    // Timeout
    if (G.frameTime >= G.timer.endTime) {
        G.timer.active = false;
        ANIM.busy      = true;
        playSound('invalid');
        document.getElementById('timeoutOverlay').classList.add('show');
    }
}

function drawTimerBar() {
    const bar = document.getElementById('timerBar');
    if (!G.timer) {
        bar.classList.remove('visible', 'pulse');
        return;
    }
    bar.classList.add('visible');

    const remaining = G.timer.active
        ? Math.max(0, G.timer.endTime - G.frameTime)
        : (G.timer.active === false && G.timer.endTime > 0 ? 0 : G.timer.duration);
    const pct = remaining / G.timer.duration;

    bar.style.width      = (pct * 100) + '%';
    bar.style.background = `hsl(${Math.round(pct * 120)}, 80%, 50%)`;
    bar.classList.toggle('pulse', pct < 0.2);
}

```

- [ ] **Step 2: Call `updateTimer()` and `drawTimerBar()` in `render()`**

Find in `render()`:

```js
    drawParticles();
    drawConfetti();
    drawTutorialHighlight();
```

Replace with:

```js
    drawParticles();
    drawConfetti();
    drawTutorialHighlight();
    updateTimer();
    drawTimerBar();
```

- [ ] **Step 3: Add event listeners for BEREIT! and Retry**

Find the event listeners block near the bottom. Append after `document.getElementById('tutBtn').addEventListener(...)`:

```js
document.getElementById('blitzStartBtn').addEventListener('click', () => {
    document.getElementById('blitzOverlay').classList.remove('show');
    G.timer.active  = true;
    G.timer.endTime = performance.now() + G.timer.duration;
    ANIM.busy       = false;
});

document.getElementById('timeoutRetryBtn').addEventListener('click', () => {
    document.getElementById('timeoutOverlay').classList.remove('show');
    generateLevel(LEVEL.current);   // will show blitzOverlay again
});
```

- [ ] **Step 4: Full Blitzrunde play-through test**

```js
localStorage.setItem('colordrop_tut_done','1');
location.reload();
```

Navigate to level 5 in Level Select. Expected:
1. Blitzrunde overlay appears. "BEREIT!" button visible.
2. Click "BEREIT!": overlay hides, timer bar appears (green, full width).
3. Play moves: bar shrinks, colour shifts green→yellow→orange→red.
4. Let timer run out: bar turns red, pulses, tick sounds last 10 s, "ZEIT ABGELAUFEN" overlay appears.
5. Click "Nochmal ↺": Blitzrunde overlay reappears for retry.

- [ ] **Step 5: Test non-timed level has no timer bar**

Navigate to level 6. Expected: no timer bar visible.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(blitz): updateTimer, drawTimerBar, render wiring, BEREIT!/Retry event listeners"
```

---

## Task 8: ⚡ icons in Level Select + HUD

**Files:**
- Modify: `index.html` — `buildLevelSelect()` (~line 1552); `updateHUD()` (~line 1707)

- [ ] **Step 1: Add ⚡ icon to timed level buttons in `buildLevelSelect()`**

Find in `buildLevelSelect()`:

```js
            if (unlocked) {
                btn.innerHTML =
                    '<span class="ls-num">' + n + '</span>' +
                    (stars > 0 ? '<span class="ls-stars">' + '⭐'.repeat(stars) + '</span>' : '');
```

Replace with:

```js
            if (unlocked) {
                btn.innerHTML =
                    '<span class="ls-num">' + (isTimedLevel(n) ? '⚡' + n : n) + '</span>' +
                    (stars > 0 ? '<span class="ls-stars">' + '⭐'.repeat(stars) + '</span>' : '');
```

- [ ] **Step 2: Add ⚡ to HUD level label for timed levels**

Find in `updateHUD()`:

```js
    document.getElementById('levelLabel').textContent = 'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier;
```

Replace with:

```js
    const timedMark = isTimedLevel(LEVEL.current) ? ' ⚡' : '';
    document.getElementById('levelLabel').textContent = 'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier + timedMark;
```

- [ ] **Step 3: Verify icons in browser**

Open Level Select. Expected: levels 5, 10, 15, 20, 25 show "⚡5", "⚡10", etc.

Play level 5 (click BEREIT!, make one move). Expected: HUD label shows "LEVEL 5 · EASY ⚡".

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(blitz): ⚡ icons on timed levels in Level Select and HUD label"
```

---

## Self-Review

### Spec coverage check

| Spec section | Covered by task |
|---|---|
| 5 tier-bound themes (EASY→MASTER) | Task 1 (THEMES), Task 4 (generateLevel) |
| Theme object (hues, ballStyle, accentColor) | Task 1 |
| drawBackground() theme-aware + fade | Task 2 |
| drawBall() 5 styles | Task 3 |
| Theme-change fade 500 ms | Task 2 (render), Task 4 (generateLevel) |
| G.theme / G.themePrev / G.themeFade | Task 1 |
| isTimedLevel(n) = n % 5 | Task 6 |
| timerDuration per tier | Task 6 |
| Blitzrunde overlay with ⚡ flicker + glow pulse | Task 5 |
| accentColor drives overlay glow | Task 5 (CSS var), Task 6 (showBlitzOverlay) |
| Timer starts only on BEREIT! | Task 7 (event listener) |
| Timer bar: 6px, green→red, pulse at <20% | Task 5 (CSS), Task 7 (drawTimerBar) |
| Tick sound last 10 seconds | Task 7 (updateTimer) |
| Timeout overlay "ZEIT ABGELAUFEN" + Retry | Task 5 (HTML), Task 7 (updateTimer + listener) |
| No stars saved on timeout | Task 7 (no saveStars call in showTimeout path) |
| ⚡ icon Level Select + HUD | Task 8 |
| G.timer state | Task 1 (field), Task 6 (generateLevel) |

All spec sections covered. ✓

### Placeholder scan

No TBD, TODO, or vague steps. All code complete. ✓

### Type/name consistency

- `THEMES.EASY / .MEDIUM / .HARD / .EXPERT / .MASTER` — defined Task 1, used Tasks 2, 4, 6 ✓
- `G.theme / .themePrev / .themeFade` — defined Task 1, used Tasks 2, 4 ✓
- `G.timer` — defined Task 1, set Task 6, read Tasks 7 ✓
- `isTimedLevel(n)` — defined Task 6, used Tasks 6, 7, 8 ✓
- `timerDuration(n)` — defined Task 6, used Tasks 6, 7 ✓
- `showBlitzOverlay(n)` — defined Task 6, called Task 6 ✓
- `updateTimer()` — defined Task 7, called Task 7 (render) ✓
- `drawTimerBar()` — defined Task 7, called Task 7 (render) ✓
- `G.theme.ballStyle` — set in THEMES Task 1, read in drawBall Task 3 ✓
- `G.theme.accentColor` — set in THEMES Task 1, read in showBlitzOverlay Task 6 ✓
- `--blitz-color` CSS var — set in Task 6 (showBlitzOverlay), used in CSS Task 5 ✓
