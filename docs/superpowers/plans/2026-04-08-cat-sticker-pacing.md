# Cat Sticker Pacing & Mascot System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Slow down early cat unlocks, explain the cat system to players, and let players choose a mascot cat visible in-game.

**Architecture:** Three independent changes: (1) adjust numeric thresholds in `cats.js` and `main.js`, (2) add tutorial step + first-unlock hint text, (3) add mascot selection in album with rendering in game/splash. All changes are in existing files — no new files needed.

**Tech Stack:** Vanilla JS, Canvas 2D, localStorage

---

### Task 1: Adjust unlock pacing thresholds

**Files:**
- Modify: `js/cats.js:11-83` (level milestone values)
- Modify: `js/cats.js:103-176` (achievement-based cat thresholds — indirectly via achievement checks)
- Modify: `js/main.js:637-647` (achievement check thresholds)
- Modify: `js/constants.js:150-165` (achievement descriptions)

- [ ] **Step 1: Update level milestone thresholds in `js/cats.js`**

Change the `unlock.value` for level-type cats:

```js
// Luna: 10 → 20
{ id: 'luna', ..., unlock: { type: 'level', value: 20 }, ... },
// Mochi: 25 → 40
{ id: 'mochi', ..., unlock: { type: 'level', value: 40 }, ... },
// Felix: 50 → 75
{ id: 'felix', ..., unlock: { type: 'level', value: 75 }, ... },
// Nala: 75 → 100
{ id: 'nala', ..., unlock: { type: 'level', value: 100 }, ... },
// Kuro: 100 → 150
{ id: 'kuro', ..., unlock: { type: 'level', value: 150 }, ... },
// Freya: 150 → 200
{ id: 'freya', ..., unlock: { type: 'level', value: 200 }, ... },
// Sora: 200 → 250
{ id: 'sora', ..., unlock: { type: 'level', value: 250 }, ... },
// Mika: 250 → 300
{ id: 'mika', ..., unlock: { type: 'level', value: 300 }, ... },
// Zenith: 300 → 350
{ id: 'zenith', ..., unlock: { type: 'level', value: 350 }, ... },
```

- [ ] **Step 2: Update achievement thresholds in `js/main.js` checkAchievements()**

In `checkAchievements()` (line ~635-647), update these lines:

```js
  check('paw_print',      wonCount >= 20);           // was 10
  check('cat_king',       achCtx.levelNum >= 30);     // was 25
  check('yarn_ball',      threeStarCount >= 10);      // was 5
  check('sharpshooter',   threeStarCount >= 3);       // was achCtx.stars === 3
  check('star_collector', totalStars >= 60);           // was 30
  check('hot_streak',     (achCtx.stats.currentStreak || 0) >= 5);  // was 3
```

- [ ] **Step 3: Update achievement descriptions in `js/constants.js`**

```js
  { id: 'paw_print',      icon: '🐾', title: 'Paw Print',         desc: 'Solve 20 levels.' },
  { id: 'cat_king',       icon: '👑', title: 'Cat King',          desc: 'Reach level 30.' },
  { id: 'yarn_ball',      icon: '🧶', title: 'Yarn Ball',         desc: 'Collect 3 stars on 10 levels.' },
  { id: 'sharpshooter',   icon: '🎯', title: 'Sharpshooter',      desc: 'Collect 3 stars on 3 levels.' },
  { id: 'star_collector', icon: '⭐', title: 'Star Collector',    desc: 'Collect 60 stars total.' },
  { id: 'hot_streak',     icon: '🔥', title: 'Hot Streak',        desc: 'Solve 5 levels in a row without undo.' },
```

- [ ] **Step 4: Commit**

```bash
git add js/cats.js js/main.js js/constants.js
git commit -m "feat: slow down early cat unlock pacing"
```

---

### Task 2: Add tutorial explanation + first-unlock hint

**Files:**
- Modify: `js/constants.js:180-205` (TUTORIAL_SCRIPT — add step)
- Modify: `js/main.js:887-903` (advanceTutStep — handle 'dismiss' waitFor)
- Modify: `js/main.js:96-141` (showCatUnlockCelebration — add hint for first cat)
- Modify: `index.html:1298-1310` (catUnlockOverlay — add hint element)

- [ ] **Step 1: Add tutorial step in `js/constants.js`**

Add a new final step to `TUTORIAL_SCRIPT` after the existing step 3:

```js
  {
    step:    4,
    heading: 'Katzen sammeln!',
    body:    'Löse Level um Katzen zu entdecken. Jede Katze kannst du als dein Maskottchen wählen!',
    waitFor: 'dismiss',
  },
```

- [ ] **Step 2: Handle 'dismiss' waitFor in tutorial logic**

In `js/main.js`, the tutorial currently advances `tutStep` on 'select' events (line 452). The 'move' and 'win' events are handled by `G.onTutAdvance` callbacks in the engine. The new 'dismiss' step needs to advance when the user taps the skip/continue button.

Update `advanceTutStep()` (line 887) — when a step has `waitFor: 'dismiss'`, change the skip button text to "Weiter →" (instead of "Überspringen"):

```js
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

  const step = TUTORIAL_SCRIPT[G.tutStep];
  textEl.textContent  = step.heading + ': ' + step.body;
  skipBtn.textContent = step.waitFor === 'dismiss' ? 'Weiter →' : 'Überspringen';
  bubble.classList.remove('hidden');
}
```

Then update the `tutSkip` click handler (line 943) to handle dismiss steps vs. full skip:

```js
document.getElementById('tutSkip').addEventListener('click', () => {
  if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
      TUTORIAL_SCRIPT[G.tutStep].waitFor === 'dismiss') {
    G.tutStep++;
    advanceTutStep();
  } else {
    endTutorial();
  }
});
```

- [ ] **Step 3: Add hint element to cat unlock overlay in `index.html`**

In the `#catUnlockOverlay` section (after `#catUnlockFact`, before `#catUnlockClose`), add:

```html
<p class="cat-unlock-hint" id="catUnlockHint"></p>
```

Add CSS for the hint (in the `<style>` block near the other `.cat-unlock-*` styles):

```css
.cat-unlock-hint {
    color: rgba(255,220,150,.9);
    font-size: .85rem;
    font-weight: 600;
    margin-top: .5rem;
    opacity: 0;
    animation: fadeUp .5s ease-out 1.3s forwards;
}
```

- [ ] **Step 4: Show hint text on first-ever cat unlock**

In `showCatUnlockCelebration()` in `js/main.js` (line 108), after setting the text fields (line 121), add:

```js
  // Show mascot hint only on first-ever cat unlock
  const hintEl = document.getElementById('catUnlockHint');
  if (hintEl) {
    const collection = loadCollection();
    if (collection.length <= 1) {
      hintEl.textContent = 'Öffne das Katzen-Album um dein Maskottchen zu wählen!';
    } else {
      hintEl.textContent = '';
    }
  }
```

Note: At this point `saveCollection` has already been called (line 563 in showWin), so `collection.length <= 1` means this is the first cat.

- [ ] **Step 5: Commit**

```bash
git add js/constants.js js/main.js index.html
git commit -m "feat: tutorial cat explanation + first-unlock mascot hint"
```

---

### Task 3: Mascot storage + album selection UI

**Files:**
- Modify: `js/storage.js` (add loadMascot/saveMascot)
- Modify: `js/main.js:19-29` (import loadMascot/saveMascot)
- Modify: `js/main.js:1048-1080` (buildAlbumScreen — gold border for selected mascot)
- Modify: `js/main.js:1082-1102` (showCatDetail — add mascot button)
- Modify: `index.html:1234-1242` (catDetailOverlay — add mascot button element)
- Modify: `index.html` CSS (album-cell.mascot style, mascot button style)

- [ ] **Step 1: Add mascot storage functions in `js/storage.js`**

After the collection functions (line 121), add:

```js
// ── Mascot ───────────────────────────────────────────────────────────────
export function loadMascot() {
  return localStorage.getItem(`${PREFIX}-mascot`) || 'default';
}
export function saveMascot(id) {
  localStorage.setItem(`${PREFIX}-mascot`, id);
}
```

- [ ] **Step 2: Import mascot functions in `js/main.js`**

Add `loadMascot, saveMascot` to the storage import (line 20-29):

```js
import {
  loadProgress, saveStars, maxUnlockedLevel,
  loadDaily, saveDaily,
  loadStats, saveStats,
  loadAchievements, saveAchievements,
  isTutorialDone, markTutorialDone,
  migrateIfNeeded,
  loadSettings, saveSettings, loadEndlessBest,
  loadCollection, saveCollection,
  loadStreak, saveStreak,
  loadMascot, saveMascot,
} from './storage.js';
```

- [ ] **Step 3: Add mascot button to cat detail overlay in `index.html`**

In `#catDetailOverlay` (line 1234-1242), add a mascot button before the back button:

```html
    <div id="catDetailOverlay" class="screen-overlay hidden">
      <div class="stats-card cat-detail">
        <div class="cat-detail-emoji" id="catEmoji">🐱</div>
        <h2 class="stats-title" id="catName">Mochi</h2>
        <p class="cat-breed" id="catBreed">Britisch Kurzhaar</p>
        <p class="cat-fact" id="catFact">Fun fact here.</p>
        <button class="mascot-btn" id="mascotBtn" type="button">Als Maskottchen wählen</button>
        <button class="win-btn" id="catDetailBack" type="button">← Zurück</button>
      </div>
    </div>
```

- [ ] **Step 4: Add CSS for mascot selection**

In the `<style>` block in `index.html`, near the `.album-cell` styles:

```css
.album-cell.mascot {
    border: 2px solid rgba(255,200,50,.8);
    box-shadow: 0 0 8px rgba(255,200,50,.3);
}

.mascot-btn {
    display: block;
    margin: .8rem auto .4rem;
    padding: .5rem 1.2rem;
    background: rgba(255,200,50,.2);
    border: 1px solid rgba(255,200,50,.5);
    border-radius: 12px;
    color: #FFD54F;
    font-family: 'Fredoka', sans-serif;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, transform .1s;
}
.mascot-btn:hover {
    background: rgba(255,200,50,.35);
    transform: scale(1.03);
}
.mascot-btn.active {
    background: rgba(255,200,50,.1);
    border-color: rgba(255,200,50,.3);
    color: rgba(255,220,150,.7);
    cursor: default;
}
```

- [ ] **Step 5: Update `buildAlbumScreen()` to show gold border on mascot**

In `js/main.js`, update `buildAlbumScreen()` (line 1048):

```js
function buildAlbumScreen() {
  const owned = new Set(loadCollection());
  const currentMascot = loadMascot();
  document.getElementById('albumCount').textContent = owned.size + ' / ' + CATS.length;
  const grid = document.getElementById('albumGrid');
  grid.innerHTML = '';
  for (const cat of CATS) {
    const isOwned = owned.has(cat.id);
    const cell = document.createElement('div');
    cell.className = 'album-cell'
      + (!isOwned ? ' locked' : '')
      + (!isOwned && cat.premium ? ' premium-locked' : '')
      + (isOwned && cat.id === currentMascot ? ' mascot' : '');

    if (isOwned) {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.borderRadius = '8px';
      const catCtx = canvas.getContext('2d');
      const params = CAT_PARAMS.find(p => p.id === cat.id);
      if (params) {
        drawCatPortrait(catCtx, 32, 34, 24, params);
      }
      cell.appendChild(canvas);
      cell.title = cat.name;
      cell.addEventListener('click', () => showCatDetail(cat));
    } else {
      cell.textContent = '?';
    }

    grid.appendChild(cell);
  }
}
```

- [ ] **Step 6: Update `showCatDetail()` to include mascot button logic**

In `js/main.js`, update `showCatDetail()` (line 1082):

```js
function showCatDetail(cat) {
  // Draw large portrait
  const container = document.getElementById('catEmoji');
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  canvas.style.width = '120px';
  canvas.style.height = '120px';
  const catCtx = canvas.getContext('2d');
  const params = CAT_PARAMS.find(p => p.id === cat.id);
  if (params) {
    drawCatPortrait(catCtx, 64, 68, 48, params);
  }
  container.appendChild(canvas);

  document.getElementById('catName').textContent = cat.name;
  document.getElementById('catBreed').textContent = cat.breed;
  document.getElementById('catFact').textContent = cat.fact;

  // Mascot button
  const mascotBtn = document.getElementById('mascotBtn');
  const current = loadMascot();
  if (current === cat.id) {
    mascotBtn.textContent = 'Dein Maskottchen ✓';
    mascotBtn.classList.add('active');
    mascotBtn.onclick = null;
  } else {
    mascotBtn.textContent = 'Als Maskottchen wählen';
    mascotBtn.classList.remove('active');
    mascotBtn.onclick = () => {
      saveMascot(cat.id);
      mascotBtn.textContent = 'Dein Maskottchen ✓';
      mascotBtn.classList.add('active');
      mascotBtn.onclick = null;
      buildAlbumScreen(); // refresh gold border
    };
  }

  document.getElementById('catDetailOverlay').classList.remove('hidden');
}
```

- [ ] **Step 7: Commit**

```bash
git add js/storage.js js/main.js index.html
git commit -m "feat: mascot selection in cat album with gold border"
```

---

### Task 4: Render mascot cat in game and splash

**Files:**
- Modify: `js/cat-renderer.js:284-333` (drawMascotCat — accept optional CAT_PARAMS)
- Modify: `js/render.js:383` (pass mascot params to drawMascotCat)
- Modify: `js/render.js:15` (import CAT_PARAMS)
- Modify: `js/main.js` (expose mascot state to render, set G.mascotParams)
- Modify: `js/splash.js` (render mascot on splash screen)

- [ ] **Step 1: Modify `drawMascotCat()` to accept optional cat params**

In `js/cat-renderer.js`, update the signature and use params for colors if provided:

```js
export function drawMascotCat(ctx, cx, cy, size, ts, params) {
  const s = size;
  ctx.save();
  // Use params colors if provided, otherwise default orange cat
  const fur  = params ? params.furColor : '#D08840';
  const furL = params ? params.furLight : '#E8B878';
  const furD = params ? params.furDark  : '#9A6020';
  const eyeCol    = params ? params.eyeColor   : '#66BB6A';
  const earT      = params ? params.earType    : 'pointed';
  const mark      = params ? params.markings   : 'tabby';
  // Idle animation
  const tailPhase = Math.sin(ts / 800) * 0.3;
  const isBlinking = (ts % 4000) > 3800;
  const earTwitch = Math.sin(ts / 2500) * 0.03;

  // Body (sitting upright)
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.35, s * 0.45, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = furL;
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.5, s * 0.25, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();

  // Tail curving around body
  ctx.strokeStyle = fur; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.35, cy + s * 0.7);
  ctx.quadraticCurveTo(cx + s * 0.7 + tailPhase * s * 0.3, cy + s * 0.4, cx + s * 0.55 + tailPhase * s * 0.4, cy + s * 0.1);
  ctx.stroke();
  ctx.strokeStyle = furD; ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.58 + tailPhase * s * 0.35, cy + s * 0.2);
  ctx.quadraticCurveTo(cx + s * 0.6 + tailPhase * s * 0.4, cy + s * 0.12, cx + s * 0.55 + tailPhase * s * 0.4, cy + s * 0.1);
  ctx.stroke();

  // Front paws
  ctx.fillStyle = fur;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath(); ctx.ellipse(cx + side * s * 0.2, cy + s * 0.82, s * 0.1, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Head — reuse portrait components
  const hy = cy - s * 0.2, hs = s * 0.55;
  const expr = isBlinking ? 'sleepy' : (params ? params.expression : 'happy');
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(cx, hy, hs, hs * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  // Ears with twitch
  ctx.save();
  ctx.translate(cx, hy); ctx.rotate(earTwitch); ctx.translate(-cx, -hy);
  drawEars(ctx, cx, hy, hs, fur, furL, earT);
  ctx.restore();
  drawMarkings(ctx, cx, hy, hs, furD, furL, mark);
  drawEyes(ctx, cx, hy, hs, eyeCol, expr);
  drawNoseMouthWhiskers(ctx, cx, hy, hs);

  ctx.restore();
}
```

- [ ] **Step 2: Add mascot params to game state G**

In `js/main.js`, after the game state initialization (around line 50-90), add a function to resolve mascot params and call it at bootstrap:

```js
function updateMascotParams() {
  const id = loadMascot();
  G.mascotParams = (id && id !== 'default') ? (CAT_PARAMS.find(p => p.id === id) || null) : null;
}
```

Call `updateMascotParams()` at bootstrap (after `migrateIfNeeded()`, around line 1201):

```js
migrateIfNeeded();
updateMascotParams();
```

Also call it when mascot is changed in `showCatDetail()` — add `updateMascotParams()` right after `saveMascot(cat.id)`.

- [ ] **Step 3: Pass mascot params through render**

In `js/render.js`, the `renderFrame` function receives `G` as a parameter. Update the mascot draw call (line 383):

```js
  // Draw mascot cat when idle
  if (G.selected === -1 && !ANIM.busy && !ANIM.arc && !G.won) {
    drawMascotCat(ctx, CW - 45, CH - 35, 28, ts, G.mascotParams);
  }
```

No import changes needed — `drawMascotCat` is already imported in `render.js`.

- [ ] **Step 4: Render mascot on splash screen**

The splash cat is an SVG in `index.html` (`.splash-cat` SVG at line 1434). To swap it with the selected mascot, we add a canvas that overlays the SVG when a mascot is selected.

In `index.html`, add a canvas inside `.splash-scene` right after the SVG:

```html
<canvas id="splashMascotCanvas" class="splash-cat" width="220" height="240" style="display:none;"></canvas>
```

In `js/splash.js`, import and render the mascot:

Add imports at the top of `splash.js`:

```js
import { drawMascotCat, CAT_PARAMS } from './cat-renderer.js';
```

Add a new exported function:

```js
export function updateSplashMascot(mascotId) {
  const svg = document.querySelector('svg.splash-cat');
  const canvas = document.getElementById('splashMascotCanvas');
  if (!svg || !canvas) return;

  if (!mascotId || mascotId === 'default') {
    svg.style.display = '';
    canvas.style.display = 'none';
    return;
  }

  const params = CAT_PARAMS.find(p => p.id === mascotId);
  if (!params) {
    svg.style.display = '';
    canvas.style.display = 'none';
    return;
  }

  svg.style.display = 'none';
  canvas.style.display = '';
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 220, 240);
  drawMascotCat(ctx, 110, 120, 70, performance.now(), params);
}
```

In `js/main.js`, import `updateSplashMascot` and call it:

```js
import { initSplash, hideSplash, showSplash, updateSplashMascot } from './splash.js';
```

Call at bootstrap (after `updateMascotParams()`):

```js
updateSplashMascot(loadMascot());
```

Also call in `showCatDetail()` after `saveMascot()`:

```js
updateSplashMascot(cat.id);
```

And in `openLevelSelect()` (line 779), since `showSplash(true)` is called there, add after it:

```js
updateSplashMascot(loadMascot());
```

- [ ] **Step 5: Commit**

```bash
git add js/cat-renderer.js js/render.js js/main.js js/splash.js index.html
git commit -m "feat: selected mascot cat visible in game and splash"
```

---

### Task 5: Test and verify in browser

- [ ] **Step 1: Test pacing — verify early unlocks are spaced**

Open the game in Chrome DevTools. In console:
```js
localStorage.clear(); location.reload();
```
Play through the tutorial, solve Level 1. Verify:
- Whisker unlocks (first_solve) ✓
- Arrow does NOT unlock (needs 3 levels with 3★, not just 1)
- No other cats unlock

- [ ] **Step 2: Test tutorial — verify new cat step appears**

```js
localStorage.removeItem('catsort_tut_done'); location.reload();
```
Play through the tutorial. After winning, verify:
- "Katzen sammeln!" step appears with "Weiter →" button
- Clicking "Weiter →" advances to the end ("Gelöst! Du kennst jetzt alle Regeln.")
- "Los geht's →" ends the tutorial normally

- [ ] **Step 3: Test first-unlock hint**

Clear collection and replay:
```js
localStorage.removeItem('catsort-collection'); location.reload();
```
Win Level 1. Verify the cat celebration shows the extra hint line: "Öffne das Katzen-Album um dein Maskottchen zu wählen!"

- [ ] **Step 4: Test mascot selection**

Open the cat album. Verify:
- Whisker cell has NO gold border initially (mascot is 'default')
- Click Whisker → detail screen shows "Als Maskottchen wählen" button
- Click the button → text changes to "Dein Maskottchen ✓", button disabled
- Go back to album grid → Whisker cell has gold border
- Close album → mascot cat in bottom-right of game area shows Whisker's colors
- Open level select → splash shows Whisker instead of default orange cat

- [ ] **Step 5: Test default mascot fallback**

```js
localStorage.removeItem('catsort-mascot'); location.reload();
```
Verify default orange cat appears in game and splash.

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "chore: verify cat pacing and mascot system"
```
