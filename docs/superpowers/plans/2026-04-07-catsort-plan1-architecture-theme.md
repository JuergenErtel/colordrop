# CatSort Plan 1: Architektur + Katzen-Theme

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ColorDrop into CatSort — modularize the single-file architecture and apply the complete cat café visual theme.

**Architecture:** Extract the 2600-line `index.html` into ES modules under `js/`. Replace the neon aesthetic with a warm cat café theme: illustrated backgrounds, themed containers (boxes/baskets), yarn balls with cat faces, paw-themed UI, and a new startscreen.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas 2D, CSS custom properties, Google Fonts (Nunito)

---

## File Structure

```
index.html              — Shell: HTML structure, CSS, module entry point
js/
  main.js               — Bootstrap, event listeners, screen navigation
  engine.js             — Game state, move logic, win check, PRNG, level generation
  render.js             — Canvas render loop, draw calls orchestration
  background.js         — Café background scenes per tier
  containers.js         — Draw themed containers (boxes, baskets, etc.)
  balls.js              — Draw yarn balls with cat face details
  particles.js          — Particle system, confetti, fireworks
  animations.js         — Arc, bounce, easing functions
  audio.js              — ZzFX sounds, playSound()
  ui.js                 — HUD, overlays, level select, stats, tutorial
  storage.js            — localStorage abstraction (progress, daily, stats, achievements)
  constants.js          — Canvas dimensions, layout, timing, palette, themes, achievements
  daily.js              — Daily challenge logic
  timer.js              — Blitzrunde timer logic
```

---

### Task 1: Create module scaffold and extract constants

**Files:**
- Create: `js/constants.js`
- Create: `js/main.js`
- Modify: `index.html` (change `<script>` to module entry)

This task sets up the ES module infrastructure and moves all constants out of `index.html`.

- [ ] **Step 1: Create `js/constants.js`**

```js
// js/constants.js
'use strict';

/* ── Canvas & Layout ──────────────────────────────────────── */
export const CW = 420, CH = 520;

export const TUBE_W   = 68;
export const TUBE_H   = 240;
export const TUBE_BOT = 440;
export const TUBE_TOP = TUBE_BOT - TUBE_H;

export const BALL_R   = 26;
export const BALL_D   = BALL_R * 2;
export const BALL_GAP = 3;
export const BALL_PAD = 10;

export const FLOAT_Y_BASE = 118;

export const DUR_LIFT   = 220;
export const DUR_ARC    = 380;
export const DUR_BOUNCE = 480;
export const MAX_PARTS  = 500;

/* ── Colour Palette (warm cat-café tones) ─────────────────── */
export const PALETTE = {
    coral:    { base:'#ff8a80', bright:'#ffcdd2', dark:'#5d0000', glow:'rgba(255,138,128,.7)' },
    lavender: { base:'#b39ddb', bright:'#e6ceff', dark:'#311b6e', glow:'rgba(179,157,219,.7)' },
    mint:     { base:'#80cbc4', bright:'#c8f5f0', dark:'#004d40', glow:'rgba(128,203,196,.7)' },
    honey:    { base:'#ffd54f', bright:'#fff9c4', dark:'#5c4400', glow:'rgba(255,213,79,.7)'  },
    peach:    { base:'#ffab91', bright:'#ffddc1', dark:'#5c1800', glow:'rgba(255,171,145,.7)' },
    rose:     { base:'#f48fb1', bright:'#ffc1e3', dark:'#5c0030', glow:'rgba(244,143,177,.7)' },
};

/* ── Colour key mapping (old → new for level generation) ──── */
export const COLOR_KEYS = Object.keys(PALETTE);

/* ── Tier Themes (cat café scenes) ────────────────────────── */
export const THEMES = {
    EASY:   {
        hues:[30,35,25], hueDelta:[6,4,5], sat:[25,20,18], bri:[92,88,85],
        containerStyle: 'cardboard',
        ballStyle: 'yarn',
        accentColor: '#ffab91',
        sceneName: 'Fensterbrett',
    },
    MEDIUM: {
        hues:[20,25,30], hueDelta:[5,3,4], sat:[22,18,15], bri:[90,86,82],
        containerStyle: 'basket',
        ballStyle: 'yarn',
        accentColor: '#ce93d8',
        sceneName: 'Sofa-Ecke',
    },
    HARD:   {
        hues:[200,190,210], hueDelta:[4,3,5], sat:[18,15,12], bri:[88,84,80],
        containerStyle: 'cattree',
        ballStyle: 'yarn',
        accentColor: '#80cbc4',
        sceneName: 'Dachterrasse',
    },
    EXPERT: {
        hues:[15,20,10], hueDelta:[5,3,4], sat:[28,22,18], bri:[85,80,76],
        containerStyle: 'catbed',
        ballStyle: 'yarn',
        accentColor: '#ef9a9a',
        sceneName: 'Kaminzimmer',
    },
    MASTER: {
        hues:[42,45,38], hueDelta:[4,3,3], sat:[35,30,25], bri:[88,82,78],
        containerStyle: 'golden',
        ballStyle: 'yarn',
        accentColor: '#ffd54f',
        sceneName: 'Dachboden',
    },
};

/* ── Achievements ─────────────────────────────────────────── */
export const ACHIEVEMENTS = [
    { id:'first_win',   icon:'🐱', name:'Erstes Miau',          desc:'Erstes Level gewonnen' },
    { id:'tier_medium', icon:'🐈', name:'Neugierige Katze',     desc:'MEDIUM-Tier erreicht' },
    { id:'tier_hard',   icon:'🐾', name:'Samtpfote',            desc:'HARD-Tier erreicht' },
    { id:'tier_expert', icon:'🦁', name:'Löwenherz',            desc:'EXPERT-Tier erreicht' },
    { id:'tier_master', icon:'👑', name:'Katzen-Kaiser',        desc:'MASTER-Tier erreicht' },
    { id:'levels_10',   icon:'🧶', name:'Wollknäuel-Fan',       desc:'10 Level gelöst' },
    { id:'levels_25',   icon:'🧵', name:'Garnmeister',          desc:'25 Level gelöst' },
    { id:'daily_first', icon:'📅', name:'Tageskatze',           desc:'Erste Daily Challenge' },
    { id:'par_first',   icon:'🎯', name:'Schnurrfekt',          desc:'Level in Par gelöst' },
    { id:'three_star',  icon:'⭐', name:'Sternchen',            desc:'3 Sterne erreicht' },
    { id:'streak_3',    icon:'🔥', name:'Dreier-Schnurrer',     desc:'3× 3 Sterne in Folge' },
    { id:'streak_5',    icon:'💫', name:'Fünfer-Schnurrer',     desc:'5× 3 Sterne in Folge' },
    { id:'blitz_first', icon:'⚡', name:'Blitzkatze',           desc:'Blitzrunde gewonnen' },
    { id:'blitz_5',     icon:'🌟', name:'Blitzmeister',         desc:'5 Blitzrunden gewonnen' },
];

/* ── Tier definitions (for level select grid) ─────────────── */
export const TIER_DEFS = [
    { name: 'EASY',   cls: 'easy',   first: 1,  last: 15 },
    { name: 'MEDIUM', cls: 'medium', first: 16, last: 30 },
    { name: 'HARD',   cls: 'hard',   first: 31, last: 50 },
    { name: 'EXPERT', cls: 'expert', first: 51, last: 75 },
    { name: 'MASTER', cls: 'master', first: 76, last: Infinity },
];

/* ── Tutorial ─────────────────────────────────────────────── */
export const TUTORIAL_TUBES = [
    ['coral', 'lavender'],
    ['lavender', 'coral'],
    [],
];

export const TUTORIAL_SCRIPT = [
    { text: 'Tippe auf einen Behälter um das oberste Knäuel aufzunehmen.', highlight: 'all',       waitFor: 'select' },
    { text: 'Tippe auf einen anderen Behälter um es abzulegen.',           highlight: 'targets',   waitFor: 'move'   },
    { text: 'Gut! Sortiere gleiche Farben — ein Behälter, eine Farbe.',    highlight: 'top-match', waitFor: 'move'   },
    { text: 'Noch ein Zug — du schaffst das!',                             highlight: 'all',       waitFor: 'win'    },
];
```

- [ ] **Step 2: Create `js/main.js` as empty entry point**

```js
// js/main.js
'use strict';

// Module entry point — will be populated as modules are extracted
import * as C from './constants.js';

console.log('CatSort modules loaded. Colors:', C.COLOR_KEYS.length, 'Tiers:', Object.keys(C.THEMES).length);
```

- [ ] **Step 3: Update `index.html` — add module script tag**

Add this right before the closing `</body>` tag, keeping the existing `<script>` block temporarily:

```html
<script type="module" src="js/main.js"></script>
```

- [ ] **Step 4: Verify modules load**

Open `index.html` in browser (via local server — `npx serve .` or similar, since ES modules require HTTP). Check browser console for: `CatSort modules loaded. Colors: 6 Tiers: 5`

- [ ] **Step 5: Commit**

```bash
git add js/constants.js js/main.js index.html
git commit -m "feat: create module scaffold and extract constants"
```

---

### Task 2: Extract storage module

**Files:**
- Create: `js/storage.js`

- [ ] **Step 1: Create `js/storage.js`**

```js
// js/storage.js
'use strict';

const PREFIX = 'catsort';

/* ── Progress (level → best stars) ────────────────────────── */

export function loadProgress() {
    try { return JSON.parse(localStorage.getItem(`${PREFIX}-progress`) || '{}'); }
    catch { return {}; }
}

export function saveStars(levelNum, stars) {
    const data = loadProgress();
    if ((data[levelNum] || 0) < stars) {
        data[levelNum] = stars;
        localStorage.setItem(`${PREFIX}-progress`, JSON.stringify(data));
    }
}

export function maxUnlockedLevel() {
    const keys = Object.keys(loadProgress()).map(Number);
    return keys.length === 0 ? 1 : Math.max(...keys) + 1;
}

/* ── Daily Challenge ──────────────────────────────────────── */

export function loadDaily() {
    try { return JSON.parse(localStorage.getItem(`${PREFIX}-daily`) || 'null') || {}; }
    catch { return {}; }
}

export function saveDaily(obj) {
    localStorage.setItem(`${PREFIX}-daily`, JSON.stringify(obj));
}

/* ── Stats ────────────────────────────────────────────────── */

export function loadStats() {
    const def = { played:0, won:0, totalMoves:0, blitzPlayed:0, blitzWon:0, bestStreak:0, currentStreak:0 };
    try { return Object.assign(def, JSON.parse(localStorage.getItem(`${PREFIX}-stats`) || '{}')); }
    catch { return def; }
}

export function saveStats(obj) {
    localStorage.setItem(`${PREFIX}-stats`, JSON.stringify(obj));
}

/* ── Achievements ─────────────────────────────────────────── */

export function loadAchievements() {
    try { return JSON.parse(localStorage.getItem(`${PREFIX}-achievements`) || '[]'); }
    catch { return []; }
}

export function saveAchievements(ids) {
    localStorage.setItem(`${PREFIX}-achievements`, JSON.stringify(ids));
}

/* ── Tutorial ─────────────────────────────────────────────── */

export function isTutorialDone() {
    return !!localStorage.getItem(`${PREFIX}-tut-done`);
}

export function markTutorialDone() {
    localStorage.setItem(`${PREFIX}-tut-done`, '1');
}

/* ── Migration from ColorDrop v1/v2 ──────────────────────── */

export function migrateIfNeeded() {
    if (localStorage.getItem(`${PREFIX}-version`) === '1') return;

    // Clear old ColorDrop keys
    ['colordrop_v1','colordrop_stats','colordrop_achievements',
     'colordrop_daily','colordrop_tut_done','colordrop_version'].forEach(k =>
        localStorage.removeItem(k)
    );

    localStorage.setItem(`${PREFIX}-version`, '1');
}
```

- [ ] **Step 2: Verify — import in main.js and test**

Add to `js/main.js`:
```js
import { migrateIfNeeded, loadProgress } from './storage.js';
migrateIfNeeded();
console.log('Storage OK, progress:', loadProgress());
```

- [ ] **Step 3: Commit**

```bash
git add js/storage.js js/main.js
git commit -m "feat: extract storage module with migration"
```

---

### Task 3: Extract engine module

**Files:**
- Create: `js/engine.js`

- [ ] **Step 1: Create `js/engine.js`**

```js
// js/engine.js
'use strict';

import { PALETTE, COLOR_KEYS, THEMES, TUTORIAL_TUBES } from './constants.js';

/* ── Seeded PRNG (Mulberry32) ─────────────────────────────── */

export function mulberry32(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/* ── Level Configuration ──────────────────────────────────── */

export function levelConfig(n) {
    if (n <= 15) return { colors: COLOR_KEYS.slice(0, 2), empty: 2, tier: 'EASY'   };
    if (n <= 30) return { colors: COLOR_KEYS.slice(0, 3), empty: 2, tier: 'MEDIUM' };
    if (n <= 50) return { colors: COLOR_KEYS.slice(0, 4), empty: 2, tier: 'HARD'   };
    if (n <= 75) return { colors: COLOR_KEYS.slice(0, 5), empty: 1, tier: 'EXPERT' };
    return           { colors: COLOR_KEYS.slice(0, 6), empty: 1, tier: 'MASTER' };
}

export function tierDifficulty(n) {
    const ranges = [[1,15],[16,30],[31,50],[51,75],[76,100]];
    const r = ranges.find(([lo, hi]) => n >= lo && n <= hi) || ranges[ranges.length - 1];
    return Math.min(1, (n - r[0]) / Math.max(1, r[1] - r[0]));
}

export function parForLevel(n) {
    const colors = levelConfig(n).colors.length;
    const d      = tierDifficulty(n);
    return Math.round(colors * (6 - d));
}

export function isTimedLevel(n) { return n > 0 && n % 5 === 0; }

export function timerDuration(n) {
    const map = { EASY:90, MEDIUM:120, HARD:150, EXPERT:180, MASTER:210 };
    return (map[levelConfig(n).tier] || 120) * 1000;
}

export function calcStars(moves, par) {
    if (moves <= par)       return 3;
    if (moves <= par * 1.5) return 2;
    return 1;
}

/* ── Win Check ────────────────────────────────────────────── */

export function checkWinState(tubes) {
    return tubes.every(t => t.length === 0 || (t.length === 4 && t.every(c => c === t[0])));
}

export function isSolved(tube) {
    return tube.length === 4 && tube.every(c => c === tube[0]);
}

/* ── Move Logic ───────────────────────────────────────────── */

export function canMove(tubes, from, to) {
    if (from === to) return false;
    const src = tubes[from];
    const dst = tubes[to];
    if (src.length === 0) return false;
    if (dst.length >= 4)  return false;
    if (dst.length === 0) return true;
    return dst[dst.length - 1] === src[src.length - 1];
}

/* ── Level Generation ─────────────────────────────────────── */

export function generateTubes(n) {
    const cfg = levelConfig(n);
    let tubes;
    let retries = 0;

    do {
        const rng   = mulberry32(n + retries * 997);
        const balls = cfg.colors.flatMap(c => [c, c, c, c]);
        const rounds = 1 + Math.floor(tierDifficulty(n) * 2);
        for (let r = 0; r < rounds; r++) {
            for (let i = balls.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [balls[i], balls[j]] = [balls[j], balls[i]];
            }
        }
        tubes = [];
        for (let i = 0; i < cfg.colors.length; i++) {
            tubes.push(balls.slice(i * 4, (i + 1) * 4));
        }
        for (let i = 0; i < cfg.empty; i++) tubes.push([]);
    } while (tubes.some(t => t.length === 4 && t.every(c => c === t[0])) && ++retries < 100);

    return tubes;
}

export function generateTutorialTubes() {
    return TUTORIAL_TUBES.map(t => [...t]);
}

/* ── BFS Solver (Hints) ───────────────────────────────────── */

export function solveHint(tubes) {
    const start   = tubes.map(t => [...t]);
    const queue   = [{ tubes: start, firstMove: null }];
    const visited = new Set([JSON.stringify(start)]);
    let head = 0, nodes = 0;

    while (head < queue.length && nodes++ < 50000) {
        const { tubes: state, firstMove } = queue[head++];
        for (let from = 0; from < state.length; from++) {
            for (let to = 0; to < state.length; to++) {
                if (!canMove(state, from, to)) continue;
                const next = state.map(t => [...t]);
                next[to].push(next[from].pop());
                const key = JSON.stringify(next);
                if (visited.has(key)) continue;
                visited.add(key);
                const move = firstMove ?? { from, to };
                if (checkWinState(next)) return move;
                queue.push({ tubes: next, firstMove: move });
            }
        }
    }
    return null;
}

/* ── Daily Challenge ──────────────────────────────────────── */

export function dailyLevelNum() {
    const d = new Date();
    const dateStr = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    let hash = 0;
    for (const ch of dateStr) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
    return (Math.abs(hash) % 75) + 1;
}
```

- [ ] **Step 2: Verify — import in main.js and test**

Add to `js/main.js`:
```js
import { levelConfig, generateTubes, parForLevel } from './engine.js';
const tubes = generateTubes(1);
console.log('Engine OK, Level 1:', levelConfig(1).tier, 'tubes:', tubes.length, 'par:', parForLevel(1));
```

- [ ] **Step 3: Commit**

```bash
git add js/engine.js js/main.js
git commit -m "feat: extract engine module (game logic, PRNG, solver)"
```

---

### Task 4: Extract animations module

**Files:**
- Create: `js/animations.js`

- [ ] **Step 1: Create `js/animations.js`**

```js
// js/animations.js
'use strict';

/* ── Easing Functions ─────────────────────────────────────── */

export function easeInOut(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }

export function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2);
}

export function easeOutBounce(t) {
    const n = 7.5625, d = 2.75;
    if (t < 1/d)     return n*t*t;
    if (t < 2/d)     return n*(t-=1.5/d)*t + 0.75;
    if (t < 2.5/d)   return n*(t-=2.25/d)*t + 0.9375;
    return n*(t-=2.625/d)*t + 0.984375;
}

/* ── Geometry ─────────────────────────────────────────────── */

export function bezier2(t, p0, p1, p2) {
    const u = 1 - t;
    return {
        x: u*u*p0.x + 2*u*t*p1.x + t*t*p2.x,
        y: u*u*p0.y + 2*u*t*p1.y + t*t*p2.y,
    };
}

/* ── Animation State ──────────────────────────────────────── */

export const ANIM = {
    arc:       null,
    bounceMap: new Map(),
    particles: [],
    busy:      false,
};

export function resetAnim() {
    ANIM.arc       = null;
    ANIM.bounceMap = new Map();
    ANIM.particles = [];
    ANIM.busy      = false;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/animations.js
git commit -m "feat: extract animations module (easing, bezier, ANIM state)"
```

---

### Task 5: Extract particles module

**Files:**
- Create: `js/particles.js`

- [ ] **Step 1: Create `js/particles.js`**

```js
// js/particles.js
'use strict';

import { CW, CH, PALETTE } from './constants.js';
import { ANIM } from './animations.js';
import { MAX_PARTS } from './constants.js';

/* ── Spawn ────────────────────────────────────────────────── */

export function spawnParticle(x, y, vx, vy, color, size, life, gravity) {
    if (ANIM.particles.length >= MAX_PARTS) return;
    ANIM.particles.push({ x, y, vx, vy, color, size, life, maxLife: life, gravity });
}

/* ── Update ───────────────────────────────────────────────── */

export function updateParticles(dt) {
    for (let i = ANIM.particles.length - 1; i >= 0; i--) {
        const p = ANIM.particles[i];
        p.x    += p.vx * dt;
        p.y    += p.vy * dt;
        p.vy   += p.gravity * dt;
        p.life -= dt;
        if (p.confetti) {
            p.vx   *= 0.995;
            p.angle += p.spin * dt;
        }
        if (p.life <= 0) ANIM.particles.splice(i, 1);
    }
}

/* ── Draw (additive neon glow) ────────────────────────────── */

export function drawParticles(ctx) {
    if (!ANIM.particles.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of ANIM.particles) {
        if (p.confetti) continue;
        ctx.globalAlpha = (p.life / p.maxLife) * 0.85;
        ctx.fillStyle   = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * (p.life / p.maxLife), 0.5), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

/* ── Confetti (opaque rotating rectangles) ────────────────── */

export function drawConfetti(ctx) {
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

/* ── Tube Explosion ───────────────────────────────────────── */

export function triggerTubeExplosion(tubeIdx, tubes, tubeCX) {
    const cx  = tubeCX(tubeIdx);
    const cy  = 200 + 240 * 0.4;  // TUBE_TOP + TUBE_H * 0.4
    const col = PALETTE[tubes[tubeIdx][0]];
    if (!col) return;
    const colors = [col.base, col.bright, '#ffffff'];
    for (let i = 0; i < 35; i++) {
        const angle = Math.PI * 2 * Math.random();
        const speed = 50 + Math.random() * 100;
        spawnParticle(
            cx + (Math.random()-.5) * 8,
            cy + (Math.random()-.5) * 8,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 30,
            colors[Math.floor(Math.random() * colors.length)],
            2 + Math.random() * 3,
            0.6 + Math.random() * 0.6,
            220
        );
    }
}

/* ── Win Confetti ─────────────────────────────────────────── */

export function spawnConfetti() {
    const colors = Object.values(PALETTE).map(p => p.base);
    const cx     = CW / 2;
    const startY = CH * 0.65;
    for (let i = 0; i < 80; i++) {
        const speed  = 280 + Math.random() * 280;
        const spread = (Math.random() - .5) * CW * 0.9;
        ANIM.particles.push({
            x: cx + spread, y: startY,
            vx: (Math.random() - .5) * 120,
            vy: -speed,
            gravity: 380,
            life: 2.2 + Math.random() * 1.4,
            maxLife: 3.6,
            color: colors[Math.floor(Math.random() * colors.length)],
            confetti: true,
            w: 5 + Math.random() * 4,
            h: 9 + Math.random() * 5,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - .5) * 6,
        });
    }
}

/* ── Win Fireworks ────────────────────────────────────────── */

export function scheduleWinFireworks() {
    const colorKeys = Object.keys(PALETTE);
    const positions = [
        {x:CW*.15,y:CH*.25},{x:CW*.85,y:CH*.20},{x:CW*.50,y:CH*.15},
        {x:CW*.25,y:CH*.45},{x:CW*.75,y:CH*.42},{x:CW*.10,y:CH*.52},{x:CW*.90,y:CH*.55},
    ];

    function burst(cx, cy, count, minSpeed, maxSpeed) {
        for (let i = 0; i < count; i++) {
            const col   = PALETTE[colorKeys[Math.floor(Math.random()*colorKeys.length)]];
            const angle = Math.PI * 2 * Math.random();
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            spawnParticle(
                cx + (Math.random()-.5)*10, cy + (Math.random()-.5)*10,
                Math.cos(angle) * speed, Math.sin(angle) * speed - 60,
                [col.base, col.bright, '#ffffff'][Math.floor(Math.random()*3)],
                2 + Math.random() * 4,
                0.8 + Math.random() * 1.0,
                180
            );
        }
    }

    positions.forEach((p, i) =>
        setTimeout(() => burst(p.x, p.y, 45, 80, 280), i * 200)
    );
    setTimeout(() => {
        positions.forEach((p, i) =>
            setTimeout(() =>
                burst(p.x + (Math.random()-.5)*80, p.y + (Math.random()-.5)*60, 30, 60, 200),
                i * 150
            )
        );
    }, 1000);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/particles.js
git commit -m "feat: extract particles module (spawn, confetti, fireworks)"
```

---

### Task 6: Extract audio module

**Files:**
- Create: `js/audio.js`

- [ ] **Step 1: Create `js/audio.js`**

```js
// js/audio.js
'use strict';

/* ── ZzFX (embedded, MIT license) ─────────────────────────── */

let zzfxX, zzfxG, zzfxP;
const zzfx = (...t) => zzfxP(zzfxG(...t));
zzfxG=(e=1,f=.05,a=220,b=0,l=0,M=.1,m=0,F=1,N=0,z=0,Y=0,X=0,P=0,I=0,Q=0,R=0,d=0,S=1,c=0,T=0)=>{let q=44100,w=2*Math.PI,L=q*b+9,r=q*l,v=q/a,h=0,n=0,D=0,k=1,A=[],C=zzfxX.createBuffer(1,L+r,q),G=C.getChannelData(0);for(T=c*[0,1,1.07,1.26,1.5,1.77][T|0]*w/q,a=w*a/q;h<L+r;h++){let p=h<L?h/L:1-(h-L)/r;let s=a*(1+(N*Math.sin(2*Math.PI*h/q)+z*Math.sin(h/v*w))+f);s+=T*Math.sin(h/q*2*Math.PI);D+=s;n+=([Math.sin(D),Math.sign(Math.sin(D)),1-2*(Math.floor(2*D/w)%2),((2*D/w%2)-1+2)%2-1][m|0]||Math.sin(D));let u=p*S*(k=Y?k+X/q:1)*e;G[h]=(Math.abs(n/++Q)>1?n/Math.abs(n):n)*u*Math.min(1,1+R*(h/q));Q=m||Q>99?1:Q}return G};
zzfxP=(...t)=>{let e=zzfxX.createBuffer(t.length,t[0].length,44100),f=zzfxX.createBufferSource();for(let a in t)e.getChannelData(a).set(t[a]);f.buffer=e;f.connect(zzfxX.destination);f.start();return f};

/* ── Sound Effects (cat-themed) ───────────────────────────── */

export function playSound(name) {
    try {
        if (!zzfxX) zzfxX = new AudioContext();
        if (zzfxX.state === 'suspended') zzfxX.resume();
        switch (name) {
            // Soft click — yarn ball selected
            case 'select':  zzfx(.3,  .05, 600,    0, .02, .05, 0, 1.5);               break;
            // Gentle plop — yarn ball lands
            case 'pop':     zzfx(.4,  .03, 180,    0, .05, .12, 0, 1.0, -8);            break;
            // Short hiss — invalid move
            case 'invalid': zzfx(.35, .08, 100, .01, .04, .06, 3,  .4);                 break;
            // Warm chime — container complete (purr-like)
            case 'solved':  zzfx(.35, .02, 440, .03, .10, .15, 0, 1.2, 3);              break;
            // Soft tick for blitz countdown
            case 'tick':    zzfx(.15, .01, 700,    0, .004, .04, 0, 1.8);                break;
            // Warm arpeggio — win (A4 → C#5 → E5)
            case 'win':
                zzfx(.4, .02, 440, .02, .12, .15, 0, 1.2);
                setTimeout(() => zzfx(.4, .02, 554, .02, .12, .15, 0, 1.2), 150);
                setTimeout(() => zzfx(.5, .02, 659, .03, .18, .20, 0, 1.2), 300);
                break;
        }
    } catch(e) {}
}
```

- [ ] **Step 2: Commit**

```bash
git add js/audio.js
git commit -m "feat: extract audio module with warm cat-themed sounds"
```

---

### Task 7: Extract background renderer

**Files:**
- Create: `js/background.js`

- [ ] **Step 1: Create `js/background.js`**

Warm café backgrounds with ambient elements (steam, dust particles, soft lighting):

```js
// js/background.js
'use strict';

import { CW, CH } from './constants.js';

/**
 * Draw the café background for the current tier theme.
 * Warm gradients with soft animated light, replacing the neon style.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} ts — requestAnimationFrame timestamp
 * @param {object} theme — current THEMES entry
 * @param {object|null} prevTheme — previous theme during fade (null = no fade)
 * @param {number} fade — 0→1 fade progress
 */
export function drawBackground(ctx, ts, theme, prevTheme, fade) {
    const t  = ts * 0.00015;  // slower than neon — calmer café vibe
    const cx = CW * (0.5 + 0.08 * Math.sin(t));
    const cy = CH * (0.35 + 0.06 * Math.cos(t * 0.7));
    const r  = Math.hypot(CW, CH) * 0.7;

    const prev = prevTheme || theme;
    function lerp(a, b) { return a + (b - a) * fade; }

    const hues = theme.hues.map((h, i) => lerp(prev.hues[i], h));
    const delt = theme.hueDelta.map((d, i) => lerp(prev.hueDelta[i], d));
    const sat  = theme.sat.map((s, i) => lerp(prev.sat[i], s));
    const bri  = theme.bri.map((b, i) => lerp(prev.bri[i], b));

    // Main warm gradient
    const grad = ctx.createRadialGradient(cx, cy, 0, CW/2, CH/2, r);
    grad.addColorStop(0,   `hsl(${hues[0]+delt[0]*Math.sin(t*0.8)},${sat[0]}%,${bri[0]}%)`);
    grad.addColorStop(0.5, `hsl(${hues[1]+delt[1]*Math.cos(t*0.6)},${sat[1]}%,${bri[1]}%)`);
    grad.addColorStop(1,   `hsl(${hues[2]+delt[2]*Math.sin(t*0.5)},${sat[2]}%,${bri[2]}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // Soft warm vignette (darker edges)
    const vignette = ctx.createRadialGradient(CW/2, CH/2, CW*0.25, CW/2, CH/2, CW*0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(30,15,5,.25)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CW, CH);

    // Floating dust motes (warm light particles)
    drawDustMotes(ctx, ts);
}

/** Subtle floating dust particles in warm light. */
function drawDustMotes(ctx, ts) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const count = 8;
    for (let i = 0; i < count; i++) {
        const seed  = i * 137.508;  // golden angle spread
        const x     = (CW * 0.1) + (CW * 0.8) * ((Math.sin(seed + ts * 0.00008 * (1 + i * 0.1)) + 1) / 2);
        const y     = (CH * 0.1) + (CH * 0.8) * ((Math.cos(seed * 1.3 + ts * 0.00006 * (1 + i * 0.15)) + 1) / 2);
        const alpha = 0.08 + 0.06 * Math.sin(ts * 0.001 + seed);
        const size  = 1.5 + Math.sin(seed * 0.7) * 0.8;

        ctx.globalAlpha = alpha;
        ctx.fillStyle   = 'rgba(255,240,210,1)';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/background.js
git commit -m "feat: add warm café background renderer with dust motes"
```

---

### Task 8: Extract container renderer

**Files:**
- Create: `js/containers.js`

- [ ] **Step 1: Create `js/containers.js`**

Themed containers replace the glassmorphic tubes:

```js
// js/containers.js
'use strict';

import { TUBE_W, TUBE_H, TUBE_TOP, TUBE_BOT } from './constants.js';

/**
 * Rounded-rect path helper.
 * @param {number[]} r — [TL, TR, BR, BL] corner radii
 */
function roundRect(ctx, x, y, w, h, r) {
    const [tl, tr, br, bl] = r;
    ctx.beginPath();
    ctx.moveTo(x+tl, y);
    ctx.lineTo(x+w-tr, y);
    ctx.arcTo(x+w, y,   x+w, y+tr,   tr);
    ctx.lineTo(x+w, y+h-br);
    ctx.arcTo(x+w, y+h, x+w-br, y+h, br);
    ctx.lineTo(x+bl, y+h);
    ctx.arcTo(x,   y+h, x,   y+h-bl, bl);
    ctx.lineTo(x, y+tl);
    ctx.arcTo(x,   y,   x+tl, y,     tl);
    ctx.closePath();
}

/**
 * Draw a themed container at tube position.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx — centre X of the container
 * @param {string} style — 'cardboard'|'basket'|'cattree'|'catbed'|'golden'
 * @param {object} state — { selected, solved, flashing, hintSrc, hintDst }
 * @param {number} ts — rAF timestamp
 */
export function drawContainer(ctx, cx, style, state, ts) {
    const tx = cx - TUBE_W / 2;

    ctx.save();

    // ── Outer glow based on state ────────────────────────────
    if (state.flashing) {
        ctx.shadowColor = 'rgba(200,80,60,.50)';
        ctx.shadowBlur  = 28;
    } else if (state.hintSrc) {
        ctx.shadowColor = 'rgba(255,240,200,.55)';
        ctx.shadowBlur  = 24;
    } else if (state.hintDst) {
        ctx.shadowColor = 'rgba(130,200,130,.55)';
        ctx.shadowBlur  = 24;
    } else if (state.selected) {
        ctx.shadowColor = 'rgba(255,200,100,.40)';
        ctx.shadowBlur  = 24;
    } else if (state.solved) {
        const pulse     = 0.5 + 0.5 * Math.sin(ts * 0.003);
        ctx.shadowColor = 'rgba(130,200,130,.28)';
        ctx.shadowBlur  = 12 + pulse * 12;
    }

    // ── Style-specific drawing ───────────────────────────────
    switch (style) {
        case 'cardboard': drawCardboard(ctx, tx, state); break;
        case 'basket':    drawBasket(ctx, tx, state);    break;
        case 'cattree':   drawCatTree(ctx, tx, state);   break;
        case 'catbed':    drawCatBed(ctx, tx, state);    break;
        case 'golden':    drawGolden(ctx, tx, state);    break;
        default:          drawCardboard(ctx, tx, state); break;
    }

    ctx.restore();
}

/* ── Cardboard Box (Easy tier) ────────────────────────────── */

function drawCardboard(ctx, tx, state) {
    const borderColor = getBorderColor(state);

    // Box body — warm cardboard brown
    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [4, 4, 8, 8]);
    ctx.fillStyle = 'rgba(160,120,80,.35)';
    ctx.fill();

    // Cardboard texture lines
    ctx.strokeStyle = 'rgba(140,100,60,.15)';
    ctx.lineWidth   = 0.5;
    for (let y = TUBE_TOP + 20; y < TUBE_TOP + TUBE_H - 10; y += 18) {
        ctx.beginPath();
        ctx.moveTo(tx + 6, y);
        ctx.lineTo(tx + TUBE_W - 6, y);
        ctx.stroke();
    }

    // Border
    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [4, 4, 8, 8]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Flap tabs at top
    ctx.fillStyle = 'rgba(140,100,60,.25)';
    ctx.fillRect(tx + 3, TUBE_TOP, 12, 8);
    ctx.fillRect(tx + TUBE_W - 15, TUBE_TOP, 12, 8);
}

/* ── Woven Basket (Medium tier) ───────────────────────────── */

function drawBasket(ctx, tx, state) {
    const borderColor = getBorderColor(state);

    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [6, 6, 14, 14]);
    ctx.fillStyle = 'rgba(180,140,90,.30)';
    ctx.fill();

    // Weave pattern
    ctx.strokeStyle = 'rgba(160,120,70,.18)';
    ctx.lineWidth   = 1;
    for (let y = TUBE_TOP + 12; y < TUBE_TOP + TUBE_H - 6; y += 12) {
        ctx.beginPath();
        ctx.moveTo(tx + 4, y);
        ctx.lineTo(tx + TUBE_W - 4, y);
        ctx.stroke();
    }
    for (let x = tx + 12; x < tx + TUBE_W - 4; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, TUBE_TOP + 8);
        ctx.lineTo(x, TUBE_TOP + TUBE_H - 6);
        ctx.stroke();
    }

    // Rim at top
    roundRect(ctx, tx - 2, TUBE_TOP - 3, TUBE_W + 4, 10, [6, 6, 2, 2]);
    ctx.fillStyle = 'rgba(160,120,70,.35)';
    ctx.fill();

    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [6, 6, 14, 14]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
}

/* ── Cat Tree Platform (Hard tier) ────────────────────────── */

function drawCatTree(ctx, tx, state) {
    const borderColor = getBorderColor(state);

    // Vertical post
    ctx.fillStyle = 'rgba(180,160,120,.25)';
    ctx.fillRect(tx + TUBE_W/2 - 8, TUBE_TOP + TUBE_H - 20, 16, 20);

    // Platform body
    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H - 16, [10, 10, 10, 10]);
    ctx.fillStyle = 'rgba(140,180,160,.25)';
    ctx.fill();

    // Sisal texture (vertical lines)
    ctx.strokeStyle = 'rgba(160,140,100,.12)';
    ctx.lineWidth   = 0.5;
    for (let x = tx + 8; x < tx + TUBE_W - 4; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, TUBE_TOP + 8);
        ctx.lineTo(x, TUBE_TOP + TUBE_H - 20);
        ctx.stroke();
    }

    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H - 16, [10, 10, 10, 10]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
}

/* ── Cat Bed (Expert tier) ────────────────────────────────── */

function drawCatBed(ctx, tx, state) {
    const borderColor = getBorderColor(state);

    // Soft cushion shape (more rounded)
    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [16, 16, 20, 20]);
    ctx.fillStyle = 'rgba(200,160,170,.28)';
    ctx.fill();

    // Plush texture (subtle circles)
    ctx.fillStyle = 'rgba(180,140,150,.08)';
    for (let y = TUBE_TOP + 20; y < TUBE_TOP + TUBE_H - 10; y += 22) {
        for (let x = tx + 14; x < tx + TUBE_W - 10; x += 20) {
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Raised rim at top
    roundRect(ctx, tx - 3, TUBE_TOP - 4, TUBE_W + 6, 14, [12, 12, 4, 4]);
    ctx.fillStyle = 'rgba(200,160,170,.20)';
    ctx.fill();

    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [16, 16, 20, 20]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
}

/* ── Golden Basket (Master tier) ──────────────────────────── */

function drawGolden(ctx, tx, state) {
    const borderColor = getBorderColor(state);

    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [8, 8, 16, 16]);

    // Gold gradient fill
    const goldGrad = ctx.createLinearGradient(tx, TUBE_TOP, tx + TUBE_W, TUBE_TOP + TUBE_H);
    goldGrad.addColorStop(0,   'rgba(255,215,100,.20)');
    goldGrad.addColorStop(0.5, 'rgba(255,200,50,.28)');
    goldGrad.addColorStop(1,   'rgba(200,160,30,.18)');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Diamond pattern
    ctx.strokeStyle = 'rgba(255,220,100,.12)';
    ctx.lineWidth   = 0.5;
    for (let y = TUBE_TOP + 10; y < TUBE_TOP + TUBE_H - 6; y += 16) {
        for (let x = tx + 10; x < tx + TUBE_W - 6; x += 16) {
            ctx.beginPath();
            ctx.moveTo(x, y - 6);
            ctx.lineTo(x + 6, y);
            ctx.lineTo(x, y + 6);
            ctx.lineTo(x - 6, y);
            ctx.closePath();
            ctx.stroke();
        }
    }

    // Ornate rim
    roundRect(ctx, tx - 3, TUBE_TOP - 5, TUBE_W + 6, 14, [8, 8, 3, 3]);
    ctx.fillStyle = 'rgba(255,210,80,.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,100,.35)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Main border
    roundRect(ctx, tx, TUBE_TOP, TUBE_W, TUBE_H, [8, 8, 16, 16]);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
}

/* ── Helper: border colour from state ─────────────────────── */

function getBorderColor(state) {
    if (state.flashing) return 'rgba(200,80,60,.65)';
    if (state.hintSrc)  return 'rgba(255,240,200,.70)';
    if (state.hintDst)  return 'rgba(130,200,130,.65)';
    if (state.selected) return 'rgba(255,200,100,.55)';
    if (state.solved)   return 'rgba(130,200,130,.35)';
    return 'rgba(180,160,140,.30)';
}
```

- [ ] **Step 2: Commit**

```bash
git add js/containers.js
git commit -m "feat: add 5 themed container styles (box, basket, cattree, catbed, golden)"
```

---

### Task 9: Extract yarn ball renderer

**Files:**
- Create: `js/balls.js`

- [ ] **Step 1: Create `js/balls.js`**

Yarn balls with subtle cat face detail and wobble:

```js
// js/balls.js
'use strict';

import { BALL_R, PALETTE } from './constants.js';

/**
 * Draw a yarn ball at (cx, cy).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {string} colorId — key into PALETTE
 * @param {boolean} floating — true → warm glow halo instead of drop shadow
 * @param {number} ts — rAF timestamp (for idle wobble)
 */
export function drawBall(ctx, cx, cy, colorId, floating, ts) {
    const col = PALETTE[colorId];
    if (!col) return;

    ctx.save();

    // ── Shadow / glow ────────────────────────────────────────
    if (floating) {
        ctx.shadowColor = col.glow;
        ctx.shadowBlur  = 24;
    } else {
        ctx.shadowColor   = 'rgba(60,30,10,.35)';
        ctx.shadowBlur    = 8;
        ctx.shadowOffsetY = 3;
    }

    // ── Layer 1: yarn ball base (soft radial gradient) ────────
    ctx.beginPath();
    ctx.arc(cx, cy, BALL_R, 0, Math.PI * 2);
    const sphere = ctx.createRadialGradient(
        cx - BALL_R * 0.22, cy - BALL_R * 0.25, BALL_R * 0.05,
        cx, cy, BALL_R
    );
    sphere.addColorStop(0,   col.bright);
    sphere.addColorStop(0.5, col.base);
    sphere.addColorStop(1,   col.dark);
    ctx.fillStyle = sphere;
    ctx.fill();
    ctx.restore();

    ctx.save();

    // ── Layer 2: yarn texture (curved lines) ─────────────────
    ctx.beginPath();
    ctx.arc(cx, cy, BALL_R - 1, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = col.bright;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth   = 0.8;
    for (let i = 0; i < 6; i++) {
        const angle  = (i / 6) * Math.PI;
        const startX = cx + Math.cos(angle) * BALL_R * 0.8;
        const startY = cy + Math.sin(angle) * BALL_R * 0.8;
        const endX   = cx - Math.cos(angle) * BALL_R * 0.8;
        const endY   = cy - Math.sin(angle) * BALL_R * 0.8;
        const cpX    = cx + Math.sin(angle + 1) * BALL_R * 0.5;
        const cpY    = cy + Math.cos(angle + 1) * BALL_R * 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Layer 3: cat face details (tiny ears + eyes) ─────────
    drawCatFace(ctx, cx, cy);

    ctx.restore();

    // ── Layer 4: specular highlight ──────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx - BALL_R * 0.25, cy - BALL_R * 0.28, BALL_R * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.fill();
    ctx.restore();
}

/**
 * Draw tiny cat ears and eyes peeking from the yarn ball.
 * Drawn inside a clip region of the ball.
 */
function drawCatFace(ctx, cx, cy) {
    const s = BALL_R * 0.35;  // face scale

    // Ears (two small triangles poking up)
    ctx.fillStyle = 'rgba(80,50,30,.5)';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.7, cy - s * 0.3);
    ctx.lineTo(cx - s * 0.35, cy - s * 1.0);
    ctx.lineTo(cx - s * 0.05, cy - s * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.05, cy - s * 0.3);
    ctx.lineTo(cx + s * 0.35, cy - s * 1.0);
    ctx.lineTo(cx + s * 0.7, cy - s * 0.3);
    ctx.fill();

    // Inner ears
    ctx.fillStyle = 'rgba(200,140,140,.35)';
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.55, cy - s * 0.25);
    ctx.lineTo(cx - s * 0.35, cy - s * 0.75);
    ctx.lineTo(cx - s * 0.15, cy - s * 0.25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.15, cy - s * 0.25);
    ctx.lineTo(cx + s * 0.35, cy - s * 0.75);
    ctx.lineTo(cx + s * 0.55, cy - s * 0.25);
    ctx.fill();

    // Eyes (two small dots)
    ctx.fillStyle = 'rgba(40,25,15,.55)';
    ctx.beginPath();
    ctx.arc(cx - s * 0.28, cy + s * 0.05, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + s * 0.28, cy + s * 0.05, s * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.beginPath();
    ctx.arc(cx - s * 0.24, cy + s * 0.0, s * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + s * 0.32, cy + s * 0.0, s * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Tiny nose
    ctx.fillStyle = 'rgba(200,120,120,.45)';
    ctx.beginPath();
    ctx.arc(cx, cy + s * 0.25, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
}
```

- [ ] **Step 2: Commit**

```bash
git add js/balls.js
git commit -m "feat: add yarn ball renderer with cat face details"
```

---

### Task 10: Create main render loop and game state orchestration

**Files:**
- Create: `js/render.js`
- Create: `js/timer.js`

- [ ] **Step 1: Create `js/timer.js`**

```js
// js/timer.js
'use strict';

import { playSound } from './audio.js';

/**
 * Update the blitz timer. Returns true if time ran out.
 * @param {object} timer — G.timer
 * @param {number} frameTime
 */
export function updateTimer(timer, frameTime, won) {
    if (!timer || !timer.active || won) return false;

    const secondsLeft = Math.ceil((timer.endTime - frameTime) / 1000);
    if (secondsLeft <= 10 && secondsLeft > 0 && secondsLeft !== timer._lastTick) {
        timer._lastTick = secondsLeft;
        playSound('tick');
    }

    if (frameTime >= timer.endTime) {
        timer.active = false;
        playSound('invalid');
        return true;  // timeout
    }
    return false;
}

/**
 * Update the timer bar DOM element.
 * @param {HTMLElement} bar
 * @param {object|null} timer
 * @param {number} frameTime
 */
export function drawTimerBar(bar, timer, frameTime) {
    if (!timer) {
        bar.classList.remove('visible', 'pulse');
        return;
    }
    bar.classList.add('visible');

    const remaining = timer.active
        ? Math.max(0, timer.endTime - frameTime)
        : (timer.active === false && timer.endTime > 0 ? 0 : timer.duration);
    const pct = remaining / timer.duration;

    bar.style.width      = (pct * 100) + '%';
    bar.style.background = `hsl(${Math.round(pct * 120)}, 70%, 45%)`;
    bar.classList.toggle('pulse', pct < 0.2);
}
```

- [ ] **Step 2: Create `js/render.js`**

```js
// js/render.js
'use strict';

import {
    CW, CH, TUBE_W, TUBE_H, TUBE_TOP, TUBE_BOT,
    BALL_R, BALL_D, BALL_GAP, BALL_PAD, FLOAT_Y_BASE,
    DUR_LIFT, DUR_ARC, DUR_BOUNCE, PALETTE, THEMES,
    TUTORIAL_SCRIPT,
} from './constants.js';
import { ANIM, easeInOut, easeOutBack, easeOutBounce, bezier2 } from './animations.js';
import { drawBackground } from './background.js';
import { drawContainer } from './containers.js';
import { drawBall } from './balls.js';
import { drawParticles, drawConfetti, spawnParticle, triggerTubeExplosion, spawnConfetti, scheduleWinFireworks } from './particles.js';
import { updateTimer, drawTimerBar } from './timer.js';
import { isSolved, checkWinState, canMove } from './engine.js';
import { playSound } from './audio.js';

/* ── Layout Helpers ───────────────────────────────────────── */

export function tubeCX(i, tubeCount) {
    const gap = (CW - tubeCount * TUBE_W) / (tubeCount + 1);
    return gap + i * (TUBE_W + gap) + TUBE_W / 2;
}

export function ballCY(bi) {
    return TUBE_BOT - BALL_PAD - BALL_R - bi * (BALL_D + BALL_GAP);
}

export function floatY(ts) {
    return FLOAT_Y_BASE + Math.sin(ts * 0.0028) * 5;
}

function roundRect(ctx, x, y, w, h, r) {
    const [tl, tr, br, bl] = r;
    ctx.beginPath();
    ctx.moveTo(x+tl, y);
    ctx.lineTo(x+w-tr, y);
    ctx.arcTo(x+w, y,   x+w, y+tr,   tr);
    ctx.lineTo(x+w, y+h-br);
    ctx.arcTo(x+w, y+h, x+w-br, y+h, br);
    ctx.lineTo(x+bl, y+h);
    ctx.arcTo(x,   y+h, x,   y+h-bl, bl);
    ctx.lineTo(x, y+tl);
    ctx.arcTo(x,   y,   x+tl, y,     tl);
    ctx.closePath();
}

/* ── Hit Testing ──────────────────────────────────────────── */

export function tubeAt(lx, ly, tubeCount) {
    for (let i = 0; i < tubeCount; i++) {
        const tx = tubeCX(i, tubeCount) - TUBE_W / 2;
        if (lx >= tx && lx <= tx + TUBE_W &&
            ly >= TUBE_TOP && ly <= TUBE_TOP + TUBE_H) return i;
    }
    return -1;
}

/* ── Main Render Frame ────────────────────────────────────── */

/**
 * Render one frame. Called by the game loop in main.js.
 * G is the full game state object.
 */
export function renderFrame(ctx, ts, G) {
    const dt = G.lastTime < 0
        ? 0.016
        : Math.min((ts - G.lastTime) / 1000, 0.05);
    G.lastTime  = ts;
    G.frameTime = ts;

    // ── Update animations ────────────────────────────────────
    updateArc(ts, G);
    updateBounces(ts);
    const { updateParticles: updateParts } = require_updateParticles();
    updateParts(dt);
    if (G.themeFade < 1) {
        G.themeFade = Math.min(G.themeFade + dt / 0.5, 1);
        if (G.themeFade >= 1) G.themePrev = null;
    }

    // ── Draw ─────────────────────────────────────────────────
    drawBackground(ctx, ts, G.theme, G.themePrev, G.themeFade);

    const n = G.tubes.length;
    for (let i = 0; i < n; i++) {
        drawTubeWithBalls(ctx, i, ts, G);
    }

    if (ANIM.arc)                        drawArcBall(ctx, ts, dt);
    if (G.selected !== -1 && !ANIM.busy) drawFloatingBall(ctx, ts, G);

    drawParticles(ctx);
    drawConfetti(ctx);
    drawTutorialHighlight(ctx, G);

    const timerBar = document.getElementById('timerBar');
    const timedOut = updateTimer(G.timer, G.frameTime, G.won);
    drawTimerBar(timerBar, G.timer, G.frameTime);
    if (timedOut) {
        ANIM.busy = true;
        document.getElementById('timeoutOverlay').classList.add('show');
    }
}

// Lazy import to avoid circular dependency
function require_updateParticles() {
    const { updateParticles } = await_module();
    return { updateParticles };
}

// Actually we can import directly since particles doesn't import render
import { updateParticles } from './particles.js';

/* ── Draw Tube + Balls ────────────────────────────────────── */

function drawTubeWithBalls(ctx, i, ts, G) {
    const tube = G.tubes[i];
    const cx   = tubeCX(i, G.tubes.length);
    const sel      = G.selected === i && !ANIM.busy;
    const solved   = isSolved(tube);
    const flashing = G.flashTube === i && G.frameTime < G.flashUntil;
    const hintSrc  = G.hintFrom  === i && G.frameTime < G.hintUntil;
    const hintDst  = G.hintTo    === i && G.frameTime < G.hintUntil;
    const arcDest  = ANIM.arc && ANIM.arc.toTube === i;

    const containerStyle = G.theme ? G.theme.containerStyle : 'cardboard';

    drawContainer(ctx, cx, containerStyle, {
        selected: sel, solved, flashing, hintSrc, hintDst,
    }, ts);

    // Balls inside
    const renderCount = arcDest ? tube.length - 1 : tube.length;
    for (let bi = 0; bi < renderCount; bi++) {
        const bounceKey = `${i}-${bi}`;
        const bounce    = ANIM.bounceMap.get(bounceKey);
        let yOff = 0;
        if (bounce) {
            const bt = Math.min((ts - bounce.startTime) / bounce.duration, 1);
            yOff = -bounce.amplitude * (1 - easeOutBounce(bt));
        }
        drawBall(ctx, cx, ballCY(bi) + yOff, tube[bi], false, ts);
    }
}

/* ── Floating Ball ────────────────────────────────────────── */

function drawFloatingBall(ctx, ts, G) {
    if (G.selected === -1) return;
    const tube = G.tubes[G.selected];
    if (!tube.length) return;

    const cx       = tubeCX(G.selected, G.tubes.length);
    const color    = tube[tube.length - 1];
    const restY    = ballCY(tube.length - 1);
    const targetY  = floatY(ts);
    const elapsed  = G.selectedTime >= 0 ? ts - G.selectedTime : DUR_LIFT;
    const liftT    = Math.min(elapsed / DUR_LIFT, 1);
    const by       = restY + (targetY - restY) * easeOutBack(liftT);
    const pulse    = liftT >= 1 ? 1 + Math.sin(ts * 0.005) * 0.04 : 1;

    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(pulse, pulse);
    drawBall(ctx, 0, 0, color, true, ts);
    ctx.restore();
}

/* ── Arc Ball ─────────────────────────────────────────────── */

function drawArcBall(ctx, ts, dt) {
    const a       = ANIM.arc;
    const elapsed = ts - a.startTime;
    const rawT    = Math.min(elapsed / a.duration, 1);
    const easedT  = easeInOut(rawT);
    const pos     = bezier2(easedT, a.p0, a.p1, a.p2);

    if (rawT < 0.92 && Math.random() < 0.4 * dt * 60) {
        const col = PALETTE[a.color];
        if (col) {
            spawnParticle(
                pos.x + (Math.random()-.5)*4,
                pos.y + (Math.random()-.5)*4,
                (Math.random()-.5)*20,
                -25 - Math.random()*20,
                col.glow, 2 + Math.random()*2,
                0.18 + Math.random()*0.08, 60
            );
        }
    }

    drawBall(ctx, pos.x, pos.y, a.color, true, ts);
}

/* ── Arc Completion ───────────────────────────────────────── */

function updateArc(ts, G) {
    if (!ANIM.arc) return;
    const elapsed = ts - ANIM.arc.startTime;
    if (elapsed < ANIM.arc.duration) return;

    const { toTube } = ANIM.arc;
    const ballIdx    = G.tubes[toTube].length - 1;

    ANIM.bounceMap.set(`${toTube}-${ballIdx}`, {
        startTime: ts, duration: DUR_BOUNCE, amplitude: 14,
    });

    playSound('pop');

    if (!G.solvedTubes.has(toTube) && isSolved(G.tubes[toTube])) {
        G.solvedTubes.add(toTube);
        triggerTubeExplosion(toTube, G.tubes, i => tubeCX(i, G.tubes.length));
        playSound('solved');
    }

    ANIM.arc  = null;
    ANIM.busy = false;

    // Tutorial advance
    if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
        TUTORIAL_SCRIPT[G.tutStep].waitFor === 'move') {
        G.tutStep++;
        if (G.onTutAdvance) G.onTutAdvance();
    }

    // Win check
    const winCheck = G.tutorial
        ? G.tubes.every(t => {
            if (t.length === 0) return true;
            if (!t.every(c => c === t[0])) return false;
            return true;
        }) && new Set(G.tubes.filter(t => t.length > 0).map(t => t[0])).size ===
               G.tubes.filter(t => t.length > 0).length
        : checkWinState(G.tubes);

    if (winCheck) {
        G.won = true;
        spawnConfetti();
        scheduleWinFireworks();
        playSound('win');
        if (G.tutorial) {
            if (G.tutStep < TUTORIAL_SCRIPT.length &&
                TUTORIAL_SCRIPT[G.tutStep].waitFor === 'win') {
                G.tutStep++;
                if (G.onTutAdvance) G.onTutAdvance();
            }
        } else if (G.onWin) {
            setTimeout(G.onWin, 600);
        }
    }

    if (G.onHUDUpdate) G.onHUDUpdate();
}

function updateBounces(ts) {
    for (const [key, b] of ANIM.bounceMap) {
        if (ts - b.startTime >= b.duration) ANIM.bounceMap.delete(key);
    }
}

/* ── Tutorial Highlight ───────────────────────────────────── */

function drawTutorialHighlight(ctx, G) {
    if (!G.tutorial || G.tutStep >= TUTORIAL_SCRIPT.length) return;
    const step  = TUTORIAL_SCRIPT[G.tutStep];
    const alpha = 0.4 + 0.3 * Math.sin(Date.now() / 300);
    const n     = G.tubes.length;

    ctx.save();
    ctx.strokeStyle = `rgba(255,230,180,${alpha.toFixed(3)})`;
    ctx.lineWidth   = 2.5;

    for (let i = 0; i < n; i++) {
        const isTarget =
            step.highlight === 'all' ? true :
            step.highlight === 'targets' ? (G.selected !== -1 && canMove(G.tubes, G.selected, i)) :
            step.highlight === 'top-match' ? (G.tubes[i].length >= 2 && G.tubes[i][G.tubes[i].length-1] === G.tubes[i][G.tubes[i].length-2]) :
            false;
        if (!isTarget) continue;

        const cx  = tubeCX(i, n);
        const pad = 6;
        roundRect(ctx, cx - TUBE_W/2 - pad, TUBE_TOP - pad, TUBE_W + pad*2, TUBE_H + pad*2, [14,14,14,14]);
        ctx.stroke();
    }
    ctx.restore();
}
```

Wait — the render.js file above has issues (lazy import hack, require_updateParticles that won't work). Let me fix this properly.

- [ ] **Step 3: Fix render.js — remove broken lazy import**

The `require_updateParticles` function and `await_module` call must be removed. The direct import of `updateParticles` from `particles.js` is already present and correct. Remove lines containing `require_updateParticles` and `await_module`, and replace the call site with the direct import:

Replace in `renderFrame`:
```js
    const { updateParticles: updateParts } = require_updateParticles();
    updateParts(dt);
```
with:
```js
    updateParticles(dt);
```

And remove the `require_updateParticles` function entirely.

- [ ] **Step 4: Commit**

```bash
git add js/render.js js/timer.js
git commit -m "feat: add main render loop with themed drawing pipeline"
```

---

### Task 11: Build main.js — full game orchestration

**Files:**
- Modify: `js/main.js` (replace placeholder with full game logic)

- [ ] **Step 1: Write complete `js/main.js`**

```js
// js/main.js
'use strict';

import {
    CW, CH, DUR_ARC, THEMES, ACHIEVEMENTS, TIER_DEFS,
    TUTORIAL_SCRIPT, TUTORIAL_TUBES, FLOAT_Y_BASE,
} from './constants.js';
import {
    levelConfig, generateTubes, generateTutorialTubes, parForLevel,
    isTimedLevel, timerDuration, calcStars, dailyLevelNum,
    canMove, isSolved, solveHint, checkWinState,
} from './engine.js';
import { ANIM, resetAnim, easeOutBack } from './animations.js';
import { renderFrame, tubeCX, ballCY, floatY, tubeAt } from './render.js';
import { playSound } from './audio.js';
import { spawnConfetti, scheduleWinFireworks } from './particles.js';
import {
    migrateIfNeeded, loadProgress, saveStars, maxUnlockedLevel,
    loadDaily, saveDaily, loadStats, saveStats,
    loadAchievements, saveAchievements, isTutorialDone, markTutorialDone,
} from './storage.js';

/* ── Game State ───────────────────────────────────────────── */

const G = {
    tubes: [], selected: -1, selectedTime: -1, moves: 0,
    history: [], won: false,
    tutorial: false, tutStep: 0,
    theme: null, themePrev: null, themeFade: 1,
    timer: null, isDailyChallenge: false,
    flashTube: -1, flashUntil: 0,
    hintFrom: -1, hintTo: -1, hintUntil: 0, hintCooldown: false,
    frameTime: 0, lastTime: -1,
    solvedTubes: new Set(),
    // Callbacks for render.js
    onWin: null, onHUDUpdate: null, onTutAdvance: null,
};

G.theme = THEMES.EASY;

const LEVEL = { current: 1 };

/* ── Canvas Setup ─────────────────────────────────────────── */

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width  = CW;
    canvas.height = CH;
    const maxPx = Math.min(window.innerWidth - 32, 480);
    const scale = maxPx / CW;
    canvas.style.width  = maxPx + 'px';
    canvas.style.height = Math.round(CH * scale) + 'px';
}

/* ── Game Logic ───────────────────────────────────────────── */

function generateLevel(n) {
    LEVEL.current = n;
    const cfg     = levelConfig(n);
    const newTheme = THEMES[cfg.tier];
    if (G.theme !== newTheme) {
        G.themePrev = G.theme;
        G.theme     = newTheme;
        G.themeFade = G.themePrev ? 0 : 1;
    }

    G.tubes        = generateTubes(n);
    G.selected     = -1;
    G.selectedTime = -1;
    G.moves        = 0;
    G.history      = [];
    G.won          = false;
    G.flashTube    = -1;
    G.flashUntil   = 0;
    G.hintFrom     = -1;
    G.hintTo       = -1;
    G.hintUntil    = 0;
    G.hintCooldown = false;
    G.solvedTubes  = new Set();
    resetAnim();

    if (isTimedLevel(n) && !G.isDailyChallenge) {
        G.timer   = { active: false, endTime: 0, duration: timerDuration(n), _lastTick: -1 };
        ANIM.busy = true;
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

function doMove(from, to) {
    G.history.push(G.tubes.map(t => [...t]));
    if (G.history.length > 5) G.history.shift();

    const startX = tubeCX(from, G.tubes.length);
    const startY = floatY(G.frameTime);
    const color  = G.tubes[from][G.tubes[from].length - 1];
    G.tubes[from].pop();
    G.tubes[to].push(color);
    G.moves++;
    G.hintFrom = G.hintTo = -1;
    G.hintUntil = 0;
    updateHUD();

    const endX  = tubeCX(to, G.tubes.length);
    const endY  = ballCY(G.tubes[to].length - 1);
    const peakY = Math.min(startY, endY) - 90;

    ANIM.arc = {
        color, toTube: to,
        p0: { x: startX, y: startY },
        p1: { x: (startX + endX) / 2, y: peakY },
        p2: { x: endX, y: endY },
        startTime: G.frameTime, duration: DUR_ARC,
    };
    ANIM.busy = true;
}

function undo() {
    if (!G.history.length || ANIM.busy) return;
    G.tubes        = G.history.pop();
    G.selected     = -1;
    G.selectedTime = -1;
    G.moves        = Math.max(0, G.moves - 1);
    G.won          = false;
    G.hintFrom     = G.hintTo = -1;
    G.hintUntil    = 0;
    G.solvedTubes  = new Set();
    for (let i = 0; i < G.tubes.length; i++) {
        if (isSolved(G.tubes[i])) G.solvedTubes.add(i);
    }
    updateHUD();
    hideOverlay();
}

function showHintAction() {
    if (ANIM.busy || G.won || G.tutorial) return;
    const btn = document.getElementById('hintBtn');
    let move;
    try { move = solveHint(G.tubes); } catch (e) { return; }
    if (!move) {
        G.hintCooldown = true;
        btn.textContent = '❌';
        btn.disabled    = true;
        setTimeout(() => { G.hintCooldown = false; btn.textContent = '🐱'; btn.disabled = false; }, 1500);
        return;
    }
    G.moves++;
    updateHUD();
    G.hintFrom  = move.from;
    G.hintTo    = move.to;
    G.hintUntil = G.frameTime + 2500;
}

function triggerFlash(idx) {
    G.flashTube  = idx;
    G.flashUntil = G.frameTime + 320;
    playSound('invalid');
}

/* ── Input Handling ───────────────────────────────────────── */

function handleInput(lx, ly) {
    if (G.won || ANIM.busy) return;
    const idx = tubeAt(lx, ly, G.tubes.length);
    if (idx === -1) { G.selected = -1; G.selectedTime = -1; return; }

    if (G.selected === -1) {
        if (G.tubes[idx].length > 0) {
            G.selected     = idx;
            G.selectedTime = G.frameTime;
            playSound('select');
            if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
                TUTORIAL_SCRIPT[G.tutStep].waitFor === 'select') {
                G.tutStep++;
                advanceTutStep();
            }
        }
    } else if (idx === G.selected) {
        G.selected = -1; G.selectedTime = -1;
    } else if (canMove(G.tubes, G.selected, idx)) {
        const from = G.selected;
        G.selected = -1; G.selectedTime = -1;
        doMove(from, idx);
    } else {
        triggerFlash(idx);
        const dst = G.tubes[idx];
        if (dst.length > 0 && dst.length < 4) {
            G.selected     = idx;
            G.selectedTime = G.frameTime;
        }
    }
}

/* ── Callbacks (used by render.js) ────────────────────────── */

G.onWin = function() {
    showWin();
};

G.onHUDUpdate = function() {
    updateHUD();
};

G.onTutAdvance = function() {
    advanceTutStep();
};

/* ── UI: HUD ──────────────────────────────────────────────── */

function updateHUD() {
    const mc = document.getElementById('moveCount');
    mc.textContent = G.moves;
    mc.classList.remove('move-good', 'move-ok', 'move-over');
    if (G.moves > 0) {
        const par = parForLevel(LEVEL.current);
        mc.classList.add(G.moves <= par ? 'move-good' : G.moves <= par * 1.5 ? 'move-ok' : 'move-over');
    }
    const timedMark = isTimedLevel(LEVEL.current) ? ' ⚡' : '';
    document.getElementById('levelLabel').textContent =
        'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier + timedMark;
    document.getElementById('undoBtn').disabled    = G.tutorial || G.history.length === 0 || ANIM.busy || G.won;
    document.getElementById('hintBtn').disabled    = G.tutorial || ANIM.busy || G.won || G.hintCooldown;
    document.getElementById('resetBtn').disabled   = G.won;
    document.getElementById('menuBtnHud').disabled = ANIM.busy || G.won;
}

/* ── UI: Win Screen ───────────────────────────────────────── */

function showWin() {
    if (!G.won) return;
    G.won = false;
    const par      = parForLevel(LEVEL.current);
    const stars    = calcStars(G.moves, par);
    const isBlitz  = isTimedLevel(LEVEL.current) && !G.isDailyChallenge;
    const blitzWon = isBlitz && G.timer !== null;

    saveStars(LEVEL.current, stars);

    if (G.isDailyChallenge) {
        const dt = new Date();
        const today = dt.getFullYear() + '-' +
            String(dt.getMonth() + 1).padStart(2, '0') + '-' +
            String(dt.getDate()).padStart(2, '0');
        saveDaily({ date: today, levelNum: LEVEL.current, completed: true, stars });
    }

    const stats    = updateStatsData(LEVEL.current, stars, G.moves, isBlitz, blitzWon);
    const progress = loadProgress();
    const newAchs  = checkAchievements({
        levelNum: LEVEL.current, stars, stats, progress,
        isDaily: G.isDailyChallenge, isBlitz,
    });

    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('winStars').textContent   = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('winPar').textContent     = 'Par: ' + par;
    document.getElementById('overlay').classList.add('show');

    if (newAchs.length) showAchievementToast(newAchs);
}

function hideOverlay() {
    document.getElementById('overlay').classList.remove('show');
}

/* ── Stats + Achievements ─────────────────────────────────── */

function updateStatsData(levelNum, stars, moves, isBlitz, blitzWon) {
    const s = loadStats();
    s.played++; s.won++; s.totalMoves += moves;
    if (isBlitz) { s.blitzPlayed++; if (blitzWon) s.blitzWon++; }
    if (stars === 3) { s.currentStreak++; s.bestStreak = Math.max(s.bestStreak, s.currentStreak); }
    else { s.currentStreak = 0; }
    saveStats(s);
    return s;
}

function checkAchievements(ctx) {
    const unlocked = new Set(loadAchievements());
    const newIds   = [];
    function check(id, cond) { if (!unlocked.has(id) && cond) { unlocked.add(id); newIds.push(id); } }
    const wonCount = Object.keys(ctx.progress).length;
    check('first_win',   true);
    check('tier_medium', ctx.levelNum >= 16);
    check('tier_hard',   ctx.levelNum >= 31);
    check('tier_expert', ctx.levelNum >= 51);
    check('tier_master', ctx.levelNum >= 76);
    check('levels_10',   wonCount >= 10);
    check('levels_25',   wonCount >= 25);
    check('daily_first', ctx.isDaily);
    check('par_first',   ctx.stars === 3);
    check('three_star',  ctx.stars === 3);
    check('streak_3',    ctx.stats.currentStreak >= 3);
    check('streak_5',    ctx.stats.currentStreak >= 5);
    check('blitz_first', ctx.isBlitz);
    check('blitz_5',     ctx.stats.blitzWon >= 5);
    if (newIds.length) saveAchievements([...unlocked]);
    return newIds;
}

/* ── Achievement Toast ────────────────────────────────────── */

const _toastQueue = [];
let   _toastActive = false;

function showAchievementToast(ids) {
    _toastQueue.push(...ids);
    if (!_toastActive) _nextToast();
}

function _nextToast() {
    const id = _toastQueue.shift();
    if (!id) { _toastActive = false; return; }
    _toastActive = true;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) { _nextToast(); return; }
    const el = document.getElementById('achievementToast');
    el.textContent = def.icon + '  ' + def.name + ' freigeschaltet!';
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); setTimeout(_nextToast, 350); }, 3000);
}

/* ── Blitz + Daily Overlays ───────────────────────────────── */

function showBlitzOverlay(n) {
    const cfg = levelConfig(n);
    const sec = timerDuration(n) / 1000;
    document.getElementById('blitzLevel').textContent = 'LEVEL ' + n + ' · ' + cfg.tier;
    document.getElementById('blitzTime').textContent  = 'Du hast ' + sec + ' Sekunden.';
    document.getElementById('blitzOverlay').style.setProperty('--blitz-color', G.theme.accentColor);
    document.getElementById('blitzOverlay').classList.add('show');
}

function showDailyOverlay() {
    const n   = dailyLevelNum();
    const cfg = levelConfig(n);
    const dateLabel = new Date().toLocaleDateString('de-DE', {
        weekday:'long', day:'numeric', month:'long', year:'numeric'
    });
    document.getElementById('dailyDate').textContent       = dateLabel;
    document.getElementById('dailyLevelLabel').textContent = 'Level ' + n + ' · ' + cfg.tier;
    document.getElementById('dailyOverlay').style.setProperty('--blitz-color', THEMES[cfg.tier].accentColor);
    document.getElementById('dailyOverlay').classList.add('show');
}

function updateDailyBtn() {
    const daily = loadDaily();
    const d2    = new Date();
    const today = d2.getFullYear() + '-' +
        String(d2.getMonth() + 1).padStart(2, '0') + '-' +
        String(d2.getDate()).padStart(2, '0');
    const btn = document.getElementById('dailyChallengeBtn');
    if (daily.date === today && daily.completed) {
        btn.textContent = '📅 Heute: ' + '⭐'.repeat(daily.stars) + ' — morgen wieder';
        btn.disabled    = true;
    } else {
        btn.textContent = '📅 Tages-Challenge';
        btn.disabled    = false;
    }
}

/* ── Level Select ─────────────────────────────────────────── */

function buildLevelSelect() {
    const progress    = loadProgress();
    const maxUL       = maxUnlockedLevel();
    const showUpTo    = maxUL + 3;
    const container   = document.getElementById('lsTiers');
    container.innerHTML = '';

    TIER_DEFS.forEach(tier => {
        const tierEnd = Math.min(tier.last === Infinity ? showUpTo : tier.last, showUpTo);
        if (tier.first > showUpTo) return;
        const section = document.createElement('div');
        section.className = 'ls-tier';
        const label = document.createElement('h3');
        label.className = 'ls-tier-label ' + tier.cls;
        label.textContent = tier.name;
        section.appendChild(label);
        const grid = document.createElement('div');
        grid.className = 'ls-grid';
        for (let n = tier.first; n <= tierEnd; n++) {
            const stars    = progress[n] || 0;
            const unlocked = n <= maxUL;
            const btn      = document.createElement('button');
            btn.className = 'ls-card' +
                (stars > 0 ? ' solved' : '') +
                (!unlocked ? ' locked' : '') +
                (n === LEVEL.current ? ' current' : '');
            btn.disabled      = !unlocked;
            btn.dataset.level = n;
            if (unlocked) {
                btn.innerHTML =
                    '<span class="ls-num">' + (isTimedLevel(n) ? '⚡' : '') + n +
                    (n === dailyLevelNum() ? ' 📅' : '') + '</span>' +
                    (stars > 0 ? '<span class="ls-stars">' + '⭐'.repeat(stars) + '</span>' : '');
                btn.addEventListener('click', () => { closeLevelSelect(); generateLevel(n); });
            } else {
                btn.innerHTML = '<span class="ls-num">🔒</span>';
            }
            grid.appendChild(btn);
        }
        section.appendChild(grid);
        container.appendChild(section);
    });
}

function openLevelSelect() {
    G.isDailyChallenge = false;
    buildLevelSelect();
    updateDailyBtn();
    hideOverlay();
    if (G.timer) G.timer = null;
    ANIM.busy = false;
    document.getElementById('blitzOverlay').classList.remove('show');
    document.getElementById('dailyOverlay').classList.remove('show');
    document.getElementById('timeoutOverlay').classList.remove('show');
    document.getElementById('levelSelect').classList.add('show');
    requestAnimationFrame(() => {
        const first = document.querySelector('#lsTiers .ls-card:not(.solved):not(.locked)');
        if (first) first.scrollIntoView({ behavior:'smooth', block:'center' });
    });
}

function closeLevelSelect() {
    document.getElementById('levelSelect').classList.remove('show');
}

/* ── Stats Screen ─────────────────────────────────────────── */

function buildStatsScreen() {
    const s   = loadStats();
    const ach = loadAchievements();
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = '';
    const rows = [
        ['Gespielte Level',   s.played],
        ['Gewonnen',          s.won],
        ['Gesamtzüge',        s.totalMoves.toLocaleString('de-CH')],
        ['Blitzrunden',       s.blitzPlayed + ' gespielt · ' + s.blitzWon + ' gewonnen'],
        ['Längste ★★★-Serie', s.bestStreak],
    ];
    for (const [label, value] of rows) {
        const l = document.createElement('span');
        l.className = 'stats-label'; l.textContent = label;
        const v = document.createElement('span');
        v.className = 'stats-value'; v.textContent = value;
        grid.append(l, v);
    }
    document.getElementById('achCount').textContent = 'ACHIEVEMENTS ' + ach.length + ' / ' + ACHIEVEMENTS.length;
    const achGrid = document.getElementById('achGrid');
    achGrid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
        const span       = document.createElement('span');
        const isUnlocked = ach.includes(a.id);
        span.className   = 'ach-icon' + (isUnlocked ? ' unlocked' : '');
        span.textContent = isUnlocked ? a.icon : '?';
        span.title       = isUnlocked ? a.name + ': ' + a.desc : '???';
        achGrid.appendChild(span);
    }
}

/* ── Tutorial ─────────────────────────────────────────────── */

function startTutorial() {
    G.tutorial = true; G.tutStep = 0; G.won = false; G.moves = 0;
    G.selected = -1; G.selectedTime = -1; G.history = [];
    G.flashTube = -1; G.flashUntil = 0;
    G.hintFrom = -1; G.hintTo = -1; G.hintUntil = 0; G.hintCooldown = false;
    G.solvedTubes = new Set();
    resetAnim();
    G.tubes = generateTutorialTubes();
    closeLevelSelect();
    document.getElementById('overlay').classList.remove('show');
    updateHUD();
    advanceTutStep();
}

function endTutorial() {
    markTutorialDone();
    G.tutorial = false; G.tutStep = 0;
    document.getElementById('tutBubble').classList.add('hidden');
    generateLevel(1);
}

function advanceTutStep() {
    const bubble  = document.getElementById('tutBubble');
    const textEl  = document.getElementById('tutText');
    const skipBtn = document.getElementById('tutSkip');
    if (G.tutStep >= TUTORIAL_SCRIPT.length) {
        textEl.textContent  = 'Gelöst! Du kennst jetzt alle Regeln.';
        skipBtn.textContent = 'Los geht\'s →';
        bubble.classList.remove('hidden');
        return;
    }
    textEl.textContent  = TUTORIAL_SCRIPT[G.tutStep].text;
    skipBtn.textContent = 'Überspringen';
    bubble.classList.remove('hidden');
}

/* ── Pointer / Touch Events ───────────────────────────────── */

function toCanvas(e) {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
}

canvas.addEventListener('click', e => { const p = toCanvas(e); handleInput(p.x, p.y); });
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const p = toCanvas(e);
    handleInput(p.x, p.y);
}, { passive: false });

document.getElementById('menuBtnHud').addEventListener('click', openLevelSelect);
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('hintBtn').addEventListener('click', showHintAction);
document.getElementById('resetBtn').addEventListener('click', () =>
    G.tutorial ? startTutorial() : generateLevel(LEVEL.current)
);
document.getElementById('nextLevelBtn').addEventListener('click', () =>
    generateLevel(LEVEL.current + 1)
);
document.getElementById('menuBtn').addEventListener('click', openLevelSelect);
document.getElementById('tutSkip').addEventListener('click', endTutorial);
document.getElementById('tutBtn').addEventListener('click', () => { closeLevelSelect(); startTutorial(); });
document.getElementById('dailyChallengeBtn').addEventListener('click', () => {
    document.getElementById('levelSelect').classList.remove('show');
    showDailyOverlay();
});
document.getElementById('dailyStartBtn').addEventListener('click', () => {
    document.getElementById('dailyOverlay').classList.remove('show');
    G.isDailyChallenge = true;
    generateLevel(dailyLevelNum());
});
document.getElementById('statsBtn').addEventListener('click', () => {
    buildStatsScreen();
    document.getElementById('statsScreen').classList.remove('hidden');
});
document.getElementById('statsBackBtn').addEventListener('click', () => {
    document.getElementById('statsScreen').classList.add('hidden');
});
document.getElementById('blitzStartBtn').addEventListener('click', () => {
    document.getElementById('blitzOverlay').classList.remove('show');
    G.timer.active  = true;
    G.timer.endTime = performance.now() + G.timer.duration;
    ANIM.busy       = false;
});
document.getElementById('timeoutRetryBtn').addEventListener('click', () => {
    document.getElementById('timeoutOverlay').classList.remove('show');
    generateLevel(LEVEL.current);
});

window.addEventListener('resize', resizeCanvas);

/* ── Render Loop ──────────────────────────────────────────── */

function loop(ts) {
    renderFrame(ctx, ts, G);
    requestAnimationFrame(loop);
}

/* ── Bootstrap ────────────────────────────────────────────── */

migrateIfNeeded();
resizeCanvas();
requestAnimationFrame(loop);

if (!isTutorialDone()) {
    startTutorial();
} else {
    openLevelSelect();
}
```

- [ ] **Step 2: Verify — open in browser, play through tutorial and level 1**

Check:
- Background shows warm tones (not neon purple)
- Containers show cardboard box style (not glass tubes)
- Balls look like yarn balls with cat face details
- Tutorial text references "Behälter" and "Knäuel"
- Level select opens after tutorial
- All controls work (undo, hint, reset, menu)
- Win screen appears after solving

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: complete game orchestration in main.js with all event wiring"
```

---

### Task 12: Update HTML — CatSort branding and warm CSS theme

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove the entire inline `<script>` block from `index.html`**

Delete everything between `<script>` and `</script>` (lines 726–2621). Keep only the `<script type="module" src="js/main.js"></script>` tag added in Task 1.

- [ ] **Step 2: Update `<head>` — fonts and title**

Replace:
```html
<title>Color Drop</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```
with:
```html
<title>CatSort</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Update CSS design tokens**

Replace the `:root` block:
```css
:root {
    --bg:       #fdf6ec;
    --surface:  rgba(160,120,80,.08);
    --border:   rgba(160,120,80,.15);
    --gold:     #d4873f;
    --text:     #4a3728;
    --muted:    rgba(74,55,40,.45);
    --f-head:   'Nunito', sans-serif;
    --f-mono:   'Nunito', sans-serif;
}
```

- [ ] **Step 4: Update body background**

Replace:
```css
background-color: var(--bg);
background-image:
    radial-gradient(ellipse 70% 45% at  10%  5%, rgba(90, 40,175,.22) 0%, transparent 60%),
    radial-gradient(ellipse 55% 40% at  90% 95%, rgba(28, 85,210,.16) 0%, transparent 60%);
```
with:
```css
background-color: var(--bg);
background-image:
    radial-gradient(ellipse 70% 45% at  10%  5%, rgba(210,170,120,.18) 0%, transparent 60%),
    radial-gradient(ellipse 55% 40% at  90% 95%, rgba(180,140,100,.12) 0%, transparent 60%);
```

- [ ] **Step 5: Update header title gradient**

Replace:
```css
background: linear-gradient(130deg, #f7c948 0%, #ff7b54 45%, #c47af9 100%);
```
with (both `.title` and `.ls-title`):
```css
background: linear-gradient(130deg, #d4873f 0%, #c96b4f 45%, #a67c52 100%);
```

- [ ] **Step 6: Update HTML text content**

Replace:
```html
<h1 class="title">Color Drop</h1>
<p class="tagline">sort · stack · solve</p>
```
with:
```html
<h1 class="title">CatSort</h1>
<p class="tagline">sort · schnurr · solve</p>
```

And in level select:
```html
<h1 class="ls-title">CatSort</h1>
<p class="ls-tagline">sort · schnurr · solve</p>
```

- [ ] **Step 7: Update HUD button icons**

Replace:
```html
<button class="hud-btn" id="hintBtn" aria-label="Hint">💡</button>
```
with:
```html
<button class="hud-btn" id="hintBtn" aria-label="Hint">🐱</button>
```

- [ ] **Step 8: Update win overlay icon**

Replace:
```html
<div class="win-icon">🏆</div>
```
with:
```html
<div class="win-icon">🐾</div>
```

- [ ] **Step 9: Update overlay backgrounds to warm tones**

Replace all `rgba(8,12,20,...)` and `rgba(5,5,15,...)` overlay backgrounds:

```css
.overlay { background: rgba(60,40,25,.80); }
.level-select { background: rgba(60,40,25,.94); }
.blitz-overlay { background: rgba(50,30,18,.90); }
.screen-overlay { background: rgba(45,28,15,.92); }
```

And card/inner backgrounds:
```css
.win-card { background: rgba(80,55,35,.92); }
.blitz-inner { background: rgba(70,45,28,.88); }
.stats-card { background: rgba(75,50,30,.90); }
```

- [ ] **Step 10: Update move counter colours (warmer)**

Replace:
```css
.move-good { color: #b2ff59; }
.move-ok   { color: #ff7043; }
.move-over { color: #f50057; }
```
with:
```css
.move-good { color: #7cb342; }
.move-ok   { color: #ef6c00; }
.move-over { color: #c62828; }
```

- [ ] **Step 11: Update tier label colours (warmer)**

Replace:
```css
.ls-tier-label.easy   { color: #80ffff; }
.ls-tier-label.medium { color: #b2ff59; }
.ls-tier-label.hard   { color: #ffe57f; }
.ls-tier-label.expert { color: #ff7043; }
.ls-tier-label.master { color: #f50057; }
```
with:
```css
.ls-tier-label.easy   { color: #d4873f; }
.ls-tier-label.medium { color: #b07baa; }
.ls-tier-label.hard   { color: #6ba3a0; }
.ls-tier-label.expert { color: #c96b4f; }
.ls-tier-label.master { color: #c9a84c; }
```

- [ ] **Step 12: Update HUD bar and canvas shadow to warm**

Replace:
```css
.hud-overlay { background: rgba(8,12,20,.55); }
```
with:
```css
.hud-overlay { background: rgba(60,40,25,.55); }
```

Replace:
```css
box-shadow: 0 0 60px rgba(80,40,160,.24), 0 24px 48px rgba(0,0,0,.58);
```
with:
```css
box-shadow: 0 0 40px rgba(160,120,70,.18), 0 24px 48px rgba(40,20,0,.45);
```

- [ ] **Step 13: Update button styles to warm**

Replace `.win-btn` gold tones:
```css
.win-btn {
    background: rgba(212,135,63,.12);
    border: 1px solid rgba(212,135,63,.38);
    color: var(--gold);
}
.win-btn:hover { background: rgba(212,135,63,.22); border-color: rgba(212,135,63,.55); }
```

Replace `.hud-btn` styles:
```css
.hud-btn {
    background: rgba(160,120,80,.12);
    border: 1px solid rgba(160,120,80,.20);
}
.hud-btn:hover { background: rgba(160,120,80,.22); border-color: rgba(160,120,80,.35); }
```

- [ ] **Step 14: Verify full visual theme**

Open in browser. Check:
- Warm cream/beige background throughout
- Brown/amber text and titles
- "CatSort" branding visible
- Cat emoji (🐱) for hint button, paw (🐾) for win
- Warm overlay backgrounds (not dark blue/purple)
- Level select tier labels in warm colours

- [ ] **Step 15: Commit**

```bash
git add index.html
git commit -m "feat: rebrand to CatSort with warm cat café CSS theme"
```

---

### Task 13: Integration test — play through full game loop

**Files:** None (testing only)

- [ ] **Step 1: Start local server**

```bash
npx serve . -l 3000
```

- [ ] **Step 2: Test tutorial flow**

Clear localStorage (`localStorage.clear()` in console), refresh. Verify:
- Tutorial starts automatically
- Text references "Behälter" and "Knäuel"
- Tutorial highlight shows warm colour (not white/blue)
- Completing tutorial opens level select

- [ ] **Step 3: Test level 1–3**

Play through levels 1–3:
- Warm café background visible
- Cardboard box containers render correctly
- Yarn balls with cat face details visible
- Arc animation works with trail particles
- Win screen shows 🐾 and stars
- Level select updates with solved levels

- [ ] **Step 4: Test Blitzrunde**

Navigate to level 5 (timed). Verify:
- Blitz overlay appears with warm styling
- Timer bar works
- Timeout overlay works

- [ ] **Step 5: Test Daily Challenge**

Click "Tages-Challenge" in level select. Verify:
- Daily overlay appears
- Level generates and plays correctly

- [ ] **Step 6: Test Stats + Achievements**

Click "Statistiken". Verify:
- Stats display correctly
- Achievement icons show cat-themed emojis (🐱, 🐈, 🐾, etc.)

- [ ] **Step 7: Test hint**

Use hint button (🐱). Verify:
- BFS solver runs
- Source/destination tubes highlight with warm glow (not neon)
- ❌ feedback works if no solution

- [ ] **Step 8: Commit — tag milestone**

```bash
git add -A
git commit -m "feat: CatSort Plan 1 complete — architecture + cat café theme"
git tag catsort-v0.1-theme
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] No inline `<script>` remains in `index.html` (all JS in `js/` modules)
- [ ] Game loads via `<script type="module" src="js/main.js">`
- [ ] All 12 JS modules exist and have no import errors in console
- [ ] Visual theme is consistently warm (no remnant neon blues/purples)
- [ ] "CatSort" branding appears everywhere (title, level select, page title)
- [ ] Cat-themed elements: 🐱 hint, 🐾 win, cat face on yarn balls
- [ ] 5 container styles render per tier (cardboard → golden)
- [ ] Tutorial, Daily Challenge, Blitz, Stats, Achievements all functional
- [ ] localStorage uses `catsort-*` prefix (not `colordrop_*`)
- [ ] Migration from old keys happens on first load
- [ ] Touch input works on mobile (test with devtools device mode)
