# Achievement Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make achievements a visible, motivating part of the gameplay loop — progress bars in the win screen, a celebratory unlock overlay, a next-goal widget in the menu, and cat-unlock chaining.

**Architecture:** A shared `getAchievementProgress()` function computes progress for all achievements. Four UI features consume it: win-overlay progress bars, achievement-unlock overlay, main-menu next-goal widget, and cat-unlock chaining. The existing toast system is replaced entirely.

**Tech Stack:** Vanilla JS (ES modules), CSS animations, existing Web Audio synth engine in `js/audio.js`.

**Spec:** `docs/superpowers/specs/2026-04-09-achievement-integration-design.md`

---

## File Map

| File | Changes |
|------|---------|
| `js/constants.js` | Add `target` field to each `ACHIEVEMENTS` entry |
| `js/main.js` | Add `getAchievementProgress()`, new overlay system, win-progress rendering, menu widget, flow changes, remove old toast |
| `js/audio.js` | Add `'achievement'` sound case |
| `index.html` | Add achievement overlay HTML, win-progress container, next-goal widget, achievement overlay CSS, remove old toast HTML+CSS |

---

### Task 1: Add target values to ACHIEVEMENTS constant

**Files:**
- Modify: `js/constants.js:154-169`

- [ ] **Step 1: Add `target` field to each achievement**

In `js/constants.js`, replace the `ACHIEVEMENTS` array (lines 154-169) with:

```js
export const ACHIEVEMENTS = [
  { id: 'first_solve',    icon: '🐱', title: 'First Purr',        desc: 'Solve your first level.',                  target: 1 },
  { id: 'cat_nap',        icon: '🐈', title: 'Cat Nap',           desc: 'Play 7 days in a row.',                    target: 7 },
  { id: 'paw_print',      icon: '🐾', title: 'Paw Print',         desc: 'Solve 20 levels.',                         target: 20 },
  { id: 'pride_of_lions', icon: '🦁', title: 'Pride of Lions',    desc: 'Solve 50 levels.',                         target: 50 },
  { id: 'cat_king',       icon: '👑', title: 'Cat King',          desc: 'Reach level 30.',                          target: 30 },
  { id: 'yarn_ball',      icon: '🧶', title: 'Yarn Ball',         desc: 'Collect 3 stars on 10 levels.',            target: 10 },
  { id: 'tangled',        icon: '🧵', title: 'Tangled',           desc: 'Collect 3 stars on 20 levels.',            target: 20 },
  { id: 'daily_player',   icon: '📅', title: 'Daily Player',      desc: 'Complete a daily puzzle.',                  target: 1 },
  { id: 'sharpshooter',   icon: '🎯', title: 'Sharpshooter',      desc: 'Collect 3 stars on 3 levels.',             target: 3 },
  { id: 'star_collector', icon: '⭐', title: 'Star Collector',    desc: 'Collect 60 stars total.',                  target: 60 },
  { id: 'hot_streak',     icon: '🔥', title: 'Hot Streak',        desc: 'Solve 5 levels in a row without undo.',    target: 5 },
  { id: 'purrfect',       icon: '💫', title: 'Purrfect',          desc: 'Get 3 stars on 10 levels.',                target: 10 },
  { id: 'lightning_paw',  icon: '⚡', title: 'Lightning Paw',     desc: 'Solve a timed level with >50% time left.', target: 1 },
  { id: 'legendary',      icon: '🌟', title: 'Legendary',         desc: 'Unlock all other achievements.',           target: 13 },
];
```

- [ ] **Step 2: Commit**

```bash
git add js/constants.js
git commit -m "feat: add target values to ACHIEVEMENTS constant"
```

---

### Task 2: Implement `getAchievementProgress()`

**Files:**
- Modify: `js/main.js` (insert after `checkAchievements()` at ~line 732)

- [ ] **Step 1: Add the progress function after `checkAchievements()`**

Insert after line 732 (after the closing `}` of `checkAchievements`), before the `// ── Achievement Toast` comment:

```js
// ── Achievement Progress ────────────────────────────────────────────────

function getAchievementProgress() {
  const progress    = loadProgress();
  const stats       = loadStats();
  const unlocked    = new Set(loadAchievements());
  const wonCount    = Object.keys(progress).length;
  const totalStars  = Object.values(progress).reduce((s, v) => s + v, 0);
  const threeStars  = Object.values(progress).filter(v => v >= 3).length;
  const maxLevel    = Math.max(0, ...Object.keys(progress).map(Number));

  // Build cat-unlock map: achievement_id → cat_id
  const catMap = {};
  for (const cat of CATS) {
    if (cat.unlock && cat.unlock.type === 'achievement') {
      catMap[cat.unlock.value] = cat.id;
    }
  }

  const currentMap = {
    first_solve:    Math.min(wonCount, 1),
    cat_nap:        0, // TODO: streak-by-date not yet tracked
    paw_print:      Math.min(wonCount, 20),
    pride_of_lions: Math.min(wonCount, 50),
    cat_king:       Math.min(maxLevel, 30),
    yarn_ball:      Math.min(threeStars, 10),
    tangled:        Math.min(threeStars, 20),
    daily_player:   unlocked.has('daily_player') ? 1 : 0,
    sharpshooter:   Math.min(threeStars, 3),
    star_collector: Math.min(totalStars, 60),
    hot_streak:     Math.min(stats.currentStreak || 0, 5),
    purrfect:       Math.min(threeStars, 10),
    lightning_paw:  unlocked.has('lightning_paw') ? 1 : 0,
    legendary:      ACHIEVEMENTS.filter(a => a.id !== 'legendary' && unlocked.has(a.id)).length,
  };

  return ACHIEVEMENTS.map(a => ({
    id:         a.id,
    icon:       a.icon,
    title:      a.title,
    desc:       a.desc,
    unlocked:   unlocked.has(a.id),
    current:    unlocked.has(a.id) ? a.target : (currentMap[a.id] || 0),
    target:     a.target,
    percent:    unlocked.has(a.id) ? 1 : Math.min((currentMap[a.id] || 0) / a.target, 1),
    unlocksCat: catMap[a.id] || null,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat: add getAchievementProgress() function"
```

---

### Task 3: Add achievement overlay HTML and CSS

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add achievement overlay CSS**

In `index.html`, find the achievement toast CSS block (lines 286-304) and replace it entirely with:

```css
/* ── Achievement Overlay ──────────────────────────────────── */
.achievement-overlay {
    position: fixed; inset: 0;
    z-index: 9450;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.75);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    opacity: 0; pointer-events: none;
    transition: opacity .4s ease;
}
.achievement-overlay.show { opacity: 1; pointer-events: auto; }

.ach-card {
    background: linear-gradient(145deg, rgba(80,45,20,.95), rgba(50,28,12,.95));
    border: 2px solid rgba(255,215,0,.35);
    border-radius: 22px;
    padding: 2rem 2.5rem;
    text-align: center;
    width: min(300px, 85vw);
    box-shadow: 0 0 40px rgba(255,215,0,.1), 0 20px 60px rgba(0,0,0,.5);
    position: relative;
    overflow: hidden;
}
.ach-card::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 30%, rgba(255,215,0,.08), transparent 60%);
    pointer-events: none;
}

.ach-label {
    font-size: .6rem; letter-spacing: 4px;
    color: rgba(255,215,0,.6);
    text-transform: uppercase;
    margin-bottom: .8rem;
}
.ach-big-icon {
    font-size: 3.5rem;
    filter: drop-shadow(0 0 16px rgba(255,215,0,.5));
    animation: achIconPop .6s cubic-bezier(.175,.885,.32,1.275) both;
    margin-bottom: .5rem;
}
.ach-title {
    font-size: 1.4rem; font-weight: 700;
    color: #FFD700;
    text-shadow: 0 0 12px rgba(255,215,0,.3);
    margin-bottom: .3rem;
}
.ach-desc {
    font-size: .8rem;
    color: rgba(255,255,255,.55);
    margin-bottom: 1.2rem;
}
.ach-cat-teaser {
    border-top: 1px solid rgba(255,215,0,.15);
    padding-top: .8rem;
    display: none;
    align-items: center; justify-content: center; gap: .5rem;
    font-size: .75rem;
    color: rgba(255,215,0,.5);
    animation: achFadeIn 1s ease .8s both;
}
.ach-cat-teaser.visible { display: flex; }
.ach-tap-hint {
    margin-top: 1rem;
    font-size: .6rem;
    color: rgba(255,255,255,.2);
    letter-spacing: 1px;
    animation: achFadeIn 1.5s ease 1.2s both;
}

/* Floating particles */
.ach-particle {
    position: absolute;
    color: rgba(255,215,0,.25);
    pointer-events: none;
}
.ach-particle:nth-child(1) { top: 12%; left: 18%; font-size: .6rem; animation: achFloat 3s ease-in-out infinite; }
.ach-particle:nth-child(2) { top: 22%; right: 20%; font-size: .8rem; animation: achFloat 2.5s ease-in-out infinite .3s; }
.ach-particle:nth-child(3) { bottom: 28%; left: 25%; font-size: .5rem; animation: achFloat 2.8s ease-in-out infinite .5s; }
.ach-particle:nth-child(4) { bottom: 20%; right: 22%; font-size: .7rem; animation: achFloat 3.2s ease-in-out infinite .8s; }

@keyframes achIconPop {
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    60%  { transform: scale(1.15) rotate(3deg); }
    100% { transform: scale(1) rotate(0); opacity: 1; }
}
@keyframes achFadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes achFloat {
    0%, 100% { transform: translateY(0) rotate(0); opacity: .25; }
    50%      { transform: translateY(-12px) rotate(15deg); opacity: .5; }
}
```

- [ ] **Step 2: Add achievement overlay HTML**

Find line 1539 (`<div id="achievementToast"...>`) and replace it with:

```html
<!-- Achievement Unlock Overlay -->
<div id="achievementOverlay" class="achievement-overlay">
    <span class="ach-particle">✦</span>
    <span class="ach-particle">✧</span>
    <span class="ach-particle">✦</span>
    <span class="ach-particle">✧</span>
    <div class="ach-card">
        <div class="ach-label">Achievement freigeschaltet</div>
        <div class="ach-big-icon" id="achIcon">🐾</div>
        <div class="ach-title" id="achTitle">Paw Print</div>
        <div class="ach-desc" id="achDesc">Löse 20 Level.</div>
        <div class="ach-cat-teaser" id="achCatTeaser">
            <span style="font-size:1.2rem">🐱</span>
            <span>Neue Katze freigeschaltet!</span>
        </div>
        <div class="ach-tap-hint">Tippen zum Fortfahren</div>
    </div>
</div>
```

- [ ] **Step 3: Add win-progress container to win card**

Find the win card HTML (line ~1487, `<p class="win-par" id="winPar">Par: 10</p>`). Add a new div between `#winPar` and `.win-actions`:

```html
            <p class="win-par" id="winPar">Par: 10</p>
            <div class="win-ach-progress" id="winAchProgress"></div>
            <div class="win-actions">
```

- [ ] **Step 4: Add win-progress CSS**

Add after the achievement overlay CSS block:

```css
/* ── Win Achievement Progress ─────────────────────────────── */
.win-ach-progress {
    border-top: 1px solid rgba(255,255,255,.08);
    padding-top: .7rem;
    margin-top: .5rem;
    margin-bottom: .3rem;
}
.win-ach-progress:empty { display: none; }
.win-ach-row {
    display: flex; align-items: center; gap: .5rem;
    margin-bottom: .5rem;
}
.win-ach-row:last-child { margin-bottom: 0; }
.win-ach-icon { font-size: 1.1rem; width: 1.5rem; text-align: center; }
.win-ach-info { flex: 1; text-align: left; }
.win-ach-header {
    display: flex; justify-content: space-between;
    margin-bottom: .15rem;
}
.win-ach-name { font-size: .65rem; color: rgba(255,255,255,.5); }
.win-ach-count { font-size: .65rem; color: rgba(255,215,0,.7); font-weight: 600; }
.win-ach-bar {
    height: 4px;
    background: rgba(255,255,255,.08);
    border-radius: 2px;
    overflow: hidden;
}
.win-ach-fill {
    height: 100%;
    background: linear-gradient(90deg, #FFD700, #FFA500);
    border-radius: 2px;
    width: 0;
    transition: width .8s ease;
}
.win-ach-fill.changed {
    animation: achBarPulse 1s ease .8s;
}
@keyframes achBarPulse {
    0%, 100% { filter: brightness(1); }
    50%      { filter: brightness(1.5); }
}
```

- [ ] **Step 5: Add next-goal widget HTML**

In the level select section (line ~1474, after `.ls-actions-secondary` closing `</div>`), add:

```html
                <div class="ls-next-goal" id="nextGoalWidget">
                    <span class="ls-next-goal-icon" id="nextGoalIcon">🐾</span>
                    <div class="ls-next-goal-info">
                        <div class="ls-next-goal-label">NÄCHSTES ZIEL</div>
                        <div class="ls-next-goal-name" id="nextGoalName">Paw Print</div>
                        <div class="ls-next-goal-bar"><div class="ls-next-goal-fill" id="nextGoalFill"></div></div>
                    </div>
                    <span class="ls-next-goal-count" id="nextGoalCount">17/20</span>
                </div>
```

- [ ] **Step 6: Add next-goal CSS**

Add after the win-progress CSS:

```css
/* ── Next Goal Widget (Main Menu) ─────────────────────────── */
.ls-next-goal {
    background: linear-gradient(135deg, rgba(255,215,0,.06), rgba(255,165,0,.04));
    border: 1px solid rgba(255,215,0,.15);
    border-radius: 12px;
    padding: .7rem 1rem;
    margin-top: .6rem;
    display: flex; align-items: center; gap: .7rem;
    cursor: pointer;
    transition: border-color .2s;
}
.ls-next-goal:hover { border-color: rgba(255,215,0,.3); }
.ls-next-goal-icon {
    font-size: 1.5rem;
    filter: drop-shadow(0 0 6px rgba(255,215,0,.3));
}
.ls-next-goal-info { flex: 1; text-align: left; }
.ls-next-goal-label {
    font-size: .55rem; letter-spacing: 1.5px;
    color: rgba(255,215,0,.5);
    text-transform: uppercase;
    margin-bottom: .1rem;
}
.ls-next-goal-name {
    font-size: .8rem; font-weight: 600;
    color: rgba(255,255,255,.7);
    margin-bottom: .25rem;
}
.ls-next-goal-bar {
    height: 4px;
    background: rgba(255,255,255,.08);
    border-radius: 2px;
    overflow: hidden;
}
.ls-next-goal-fill {
    height: 100%;
    background: linear-gradient(90deg, #FFD700, #FFA500);
    border-radius: 2px;
    width: 0;
    transition: width .5s ease;
}
.ls-next-goal-count {
    font-size: .7rem;
    color: rgba(255,215,0,.6);
    font-weight: 600;
}
.ls-next-goal.all-done {
    justify-content: center;
    gap: .4rem;
}
.ls-next-goal.all-done .ls-next-goal-info,
.ls-next-goal.all-done .ls-next-goal-count { display: none; }
```

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add achievement overlay, win-progress, and next-goal HTML/CSS"
```

---

### Task 4: Add achievement unlock sound

**Files:**
- Modify: `js/audio.js:164` (inside `playSound` switch)

- [ ] **Step 1: Add `'achievement'` case to `playSound()`**

In `js/audio.js`, inside the `switch (name)` block in `playSound()`, add a new case. Find an appropriate spot (after the last existing case, before the closing `}` of the switch):

```js
      case 'achievement': {
        // Ascending sparkle — three quick rising tones
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const vol = 0.3 * _sfxVolume;
        const notes = [523, 659, 784]; // C5, E5, G5

        for (let i = 0; i < notes.length; i++) {
          const t = now + i * 0.12;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          g.connect(ctx.destination);

          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(notes[i], t);
          osc.connect(g);
          osc.start(t);
          osc.stop(t + 0.4);
        }
        break;
      }
```

- [ ] **Step 2: Commit**

```bash
git add js/audio.js
git commit -m "feat: add achievement unlock sound effect"
```

---

### Task 5: Implement achievement overlay system in main.js

**Files:**
- Modify: `js/main.js` (replace toast system at lines 734-757)

- [ ] **Step 1: Replace the old toast system**

Find the old toast code (lines 734-757):

```js
// ── Achievement Toast ────────────────────────────────────────────────────

const _toastQueue  = [];
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
  el.textContent = def.icon + '  ' + def.title + ' freigeschaltet!';
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(_nextToast, 350);
  }, 3000);
}
```

Replace it entirely with:

```js
// ── Achievement Overlay ─────────────────────────────────────────────────

const _achQueue    = [];
let   _achShowing  = false;
let   _achCallback = null;

function showAchievementOverlays(ids, onDone) {
  // Build queue entries with cat-unlock info
  const achProgress = getAchievementProgress();
  for (const id of ids) {
    const info = achProgress.find(a => a.id === id);
    if (info) _achQueue.push(info);
  }
  _achCallback = onDone || null;
  if (!_achShowing) _nextAchOverlay();
}

function _nextAchOverlay() {
  const info = _achQueue.shift();
  if (!info) {
    _achShowing = false;
    if (_achCallback) { _achCallback(); _achCallback = null; }
    return;
  }
  _achShowing = true;

  const overlay = document.getElementById('achievementOverlay');
  document.getElementById('achIcon').textContent  = info.icon;
  document.getElementById('achTitle').textContent = info.title;
  document.getElementById('achDesc').textContent  = info.desc;

  const teaser = document.getElementById('achCatTeaser');
  if (info.unlocksCat) {
    teaser.classList.add('visible');
  } else {
    teaser.classList.remove('visible');
  }

  // Reset animations by removing and re-adding show
  overlay.classList.remove('show');
  void overlay.offsetHeight; // force reflow
  overlay.classList.add('show');

  playSound('achievement');

  // Re-trigger icon animation
  const icon = document.getElementById('achIcon');
  icon.style.animation = 'none';
  void icon.offsetHeight;
  icon.style.animation = '';

  // Click to dismiss
  function dismiss() {
    overlay.removeEventListener('click', dismiss);
    overlay.classList.remove('show');

    if (info.unlocksCat) {
      // Show cat unlock after a short delay
      const cat = CATS.find(c => c.id === info.unlocksCat);
      if (cat) {
        setTimeout(() => {
          showCatUnlockCelebration(cat);
          // After cat unlock is dismissed, continue achievement queue
          // (handled by catUnlockClose button calling processUnlockQueue,
          //  but we override it below)
        }, 400);
        // We'll continue the achievement queue after cat unlock
        _waitForCatUnlock(() => setTimeout(_nextAchOverlay, 300));
        return;
      }
    }
    setTimeout(_nextAchOverlay, 300);
  }

  overlay.addEventListener('click', dismiss);
}

function _waitForCatUnlock(onClosed) {
  // Poll for cat unlock overlay to close (it has its own close button)
  const check = setInterval(() => {
    const catOverlay = document.getElementById('catUnlockOverlay');
    if (!catOverlay.classList.contains('show')) {
      clearInterval(check);
      onClosed();
    }
  }, 200);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat: replace achievement toast with celebratory overlay system"
```

---

### Task 6: Implement win-overlay progress bars

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add `buildWinAchProgress()` function**

Insert after `getAchievementProgress()` (and before the achievement overlay code):

```js
// ── Win Overlay Progress ────────────────────────────────────────────────

function buildWinAchProgress() {
  const all       = getAchievementProgress();
  const remaining = all.filter(a => !a.unlocked && a.id !== 'cat_nap');
  remaining.sort((a, b) => b.percent - a.percent);
  const top3 = remaining.slice(0, 3);

  const container = document.getElementById('winAchProgress');
  container.innerHTML = '';

  for (let i = 0; i < top3.length; i++) {
    const a = top3[i];
    const row = document.createElement('div');
    row.className = 'win-ach-row';
    row.innerHTML =
      '<span class="win-ach-icon">' + a.icon + '</span>' +
      '<div class="win-ach-info">' +
        '<div class="win-ach-header">' +
          '<span class="win-ach-name">' + a.title + '</span>' +
          '<span class="win-ach-count">' + a.current + '/' + a.target + '</span>' +
        '</div>' +
        '<div class="win-ach-bar">' +
          '<div class="win-ach-fill" data-percent="' + (a.percent * 100) + '" style="width:0"></div>' +
        '</div>' +
      '</div>';
    container.appendChild(row);
  }

  // Animate bars with staggered delay
  requestAnimationFrame(() => {
    const fills = container.querySelectorAll('.win-ach-fill');
    fills.forEach((fill, i) => {
      setTimeout(() => {
        fill.style.width = fill.dataset.percent + '%';
      }, 300 + i * 300);
    });
  });
}
```

- [ ] **Step 2: Call `buildWinAchProgress()` in `handleWin()`**

In `handleWin()`, find where the win overlay is populated (line ~647-652). After `document.getElementById('winPar').textContent = 'Par: ' + par;` (both occurrences — one for ad path at ~642, one for normal path at ~652), add:

```js
    buildWinAchProgress();
```

So the ad-path block (around lines 637-643) becomes:

```js
    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('winStars').innerHTML =
    Array.from({ length: stars }, () => '<span class="win-star">\u2B50</span>').join('') +
    Array.from({ length: 3 - stars }, () => '<span class="win-star">\u2606</span>').join('');
    document.getElementById('winPar').textContent     = 'Par: ' + par;
    buildWinAchProgress();
```

And the normal-path block (around lines 647-652) becomes:

```js
  document.getElementById('finalLevel').textContent = LEVEL.current;
  document.getElementById('finalMoves').textContent = G.moves;
  document.getElementById('winStars').innerHTML =
    Array.from({ length: stars }, () => '<span class="win-star">\u2B50</span>').join('') +
    Array.from({ length: 3 - stars }, () => '<span class="win-star">\u2606</span>').join('');
  document.getElementById('winPar').textContent     = 'Par: ' + par;
  buildWinAchProgress();
```

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat: add achievement progress bars to win overlay"
```

---

### Task 7: Implement next-goal widget in main menu

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add `updateNextGoalWidget()` function**

Insert after `buildWinAchProgress()`:

```js
// ── Next Goal Widget ────────────────────────────────────────────────────

function updateNextGoalWidget() {
  const widget = document.getElementById('nextGoalWidget');
  if (!widget) return;

  const all       = getAchievementProgress();
  const remaining = all.filter(a => !a.unlocked && a.id !== 'cat_nap');
  remaining.sort((a, b) => b.percent - a.percent);

  if (remaining.length === 0) {
    // All achievements unlocked
    widget.classList.add('all-done');
    document.getElementById('nextGoalIcon').textContent  = '🌟';
    document.getElementById('nextGoalName').textContent  = 'Alle Achievements freigeschaltet!';
    document.getElementById('nextGoalCount').textContent = '';
    document.getElementById('nextGoalFill').style.width  = '100%';
    return;
  }

  widget.classList.remove('all-done');
  const best = remaining[0];

  document.getElementById('nextGoalIcon').textContent  = best.icon;
  document.getElementById('nextGoalName').textContent  = best.title;
  document.getElementById('nextGoalCount').textContent = best.current + '/' + best.target;

  requestAnimationFrame(() => {
    document.getElementById('nextGoalFill').style.width = (best.percent * 100) + '%';
  });
}
```

- [ ] **Step 2: Call it in `openLevelSelect()`**

In `openLevelSelect()` (line ~866), add `updateNextGoalWidget();` after `buildLevelSelect();` (line ~869):

```js
function openLevelSelect() {
  if (ENDLESS.active) { endEndless(); stopMusic(); }
  G.isDailyChallenge = false;
  buildLevelSelect();
  updateNextGoalWidget();
  updateDailyBtn();
```

- [ ] **Step 3: Add click listener for the widget**

In the event listener section (around line ~1068, near the statsBtn listener), add:

```js
document.getElementById('nextGoalWidget').addEventListener('click', () => { playSound('click'); showStatsScreen(); });
```

- [ ] **Step 4: Commit**

```bash
git add js/main.js
git commit -m "feat: add next-goal achievement widget to main menu"
```

---

### Task 8: Rewire the win flow — achievements after win overlay

**Files:**
- Modify: `js/main.js`

This is the most delicate task. The current flow shows achievement toasts during the win overlay. The new flow shows achievement overlays AFTER the user clicks a win-screen button.

- [ ] **Step 1: Store pending achievements and cat unlocks in handleWin()**

In `handleWin()`, the new achievements and new cats are already computed. We need to store them so the button handlers can trigger the overlay queue. Add a module-level variable near the top of the file (around line 98, near `const unlockQueue`):

```js
let _pendingAchs = [];
let _pendingCats = [];
```

- [ ] **Step 2: Modify handleWin() to store instead of showing**

In `handleWin()`, find the cat unlock section (lines 606-623). Change it to store but NOT show immediately:

Replace:

```js
  // ── Cat unlocks ──
  const owned = new Set(loadCollection());
  const maxLvl = Math.max(LEVEL.current, ...Object.keys(progress).map(Number));
  const newCats = checkCatUnlocks(owned, {
    maxLevel: maxLvl,
    achievements: loadAchievements(),
    streak: loadStreak().current,
    endlessBest: loadEndlessBest(),
    isPremium: isPremium(),
  });
  if (newCats.length) {
    newCats.forEach(id => owned.add(id));
    saveCollection([...owned]);
    for (const id of newCats) {
      const cat = CATS.find(c => c.id === id);
      if (cat) showCatUnlockToast(cat);
    }
  }
```

With:

```js
  // ── Cat unlocks (store for after win overlay) ──
  const owned = new Set(loadCollection());
  const maxLvl = Math.max(LEVEL.current, ...Object.keys(progress).map(Number));
  const newCats = checkCatUnlocks(owned, {
    maxLevel: maxLvl,
    achievements: loadAchievements(),
    streak: loadStreak().current,
    endlessBest: loadEndlessBest(),
    isPremium: isPremium(),
  });
  if (newCats.length) {
    newCats.forEach(id => owned.add(id));
    saveCollection([...owned]);
  }

  _pendingAchs = newAchs;
  _pendingCats = newCats;
```

- [ ] **Step 3: Remove the inline `showAchievementToast` calls from handleWin()**

In the ad-path (line ~643), remove:

```js
    if (newAchs.length) showAchievementToast(newAchs);
```

In the normal-path timeout (line ~665), remove:

```js
    if (newAchs.length) showAchievementToast(newAchs);
```

- [ ] **Step 4: Add a function to process pending unlocks**

Insert after `_waitForCatUnlock`:

```js
function processPendingUnlocks(onDone) {
  if (_pendingAchs.length === 0) {
    // No achievements, but maybe non-achievement cat unlocks
    for (const id of _pendingCats) {
      const cat = CATS.find(c => c.id === id);
      if (cat) showCatUnlockToast(cat);
    }
    _pendingAchs = [];
    _pendingCats = [];
    if (onDone) onDone();
    return;
  }

  // Show achievement overlays; cat unlocks for achievement-linked cats
  // are handled inside showAchievementOverlays via unlocksCat.
  // Non-achievement cat unlocks still use the old toast.
  const achCatIds = new Set();
  const achProgress = getAchievementProgress();
  for (const id of _pendingAchs) {
    const info = achProgress.find(a => a.id === id);
    if (info && info.unlocksCat) achCatIds.add(info.unlocksCat);
  }

  showAchievementOverlays(_pendingAchs, () => {
    // Show any non-achievement cat unlocks after
    for (const id of _pendingCats) {
      if (!achCatIds.has(id)) {
        const cat = CATS.find(c => c.id === id);
        if (cat) showCatUnlockToast(cat);
      }
    }
    _pendingAchs = [];
    _pendingCats = [];
    if (onDone) onDone();
  });
}
```

- [ ] **Step 5: Modify "Next Level" and "Menu" button handlers**

Find the button handlers (lines ~1030-1034):

Replace:

```js
document.getElementById('nextLevelBtn').addEventListener('click', () => {
  playSound('click');
  generateLevel(LEVEL.current + 1);
});
document.getElementById('menuBtn').addEventListener('click', () => { playSound('click'); openLevelSelect(); });
```

With:

```js
document.getElementById('nextLevelBtn').addEventListener('click', () => {
  playSound('click');
  hideOverlay();
  processPendingUnlocks(() => generateLevel(LEVEL.current + 1));
});
document.getElementById('menuBtn').addEventListener('click', () => {
  playSound('click');
  hideOverlay();
  processPendingUnlocks(() => openLevelSelect());
});
```

- [ ] **Step 6: Handle ad dismissal path**

Find the ad close handler. Search for `adOverlay` close logic:

```bash
grep -n "adOverlay" js/main.js
```

Ensure that when the ad overlay is dismissed, it also calls `processPendingUnlocks` before proceeding to the win overlay. The ad path already stores win data, so after the ad is dismissed, the win overlay shows. The pending achievements are already stored, so they'll trigger when the user clicks Next Level/Menu from the win overlay. No change needed here.

- [ ] **Step 7: Commit**

```bash
git add js/main.js
git commit -m "feat: rewire win flow to show achievements after win overlay dismissal"
```

---

### Task 9: Clean up old toast references

**Files:**
- Modify: `js/main.js`
- Modify: `index.html`

- [ ] **Step 1: Verify old toast HTML is already removed**

In Task 3, we replaced the `<div id="achievementToast">` with the new overlay. Confirm that the old element is gone:

```bash
grep -n "achievementToast" index.html
```

Should return no results. If it still exists, remove it.

- [ ] **Step 2: Verify old toast CSS is already removed**

```bash
grep -n "achievement-toast" index.html
```

Should return no results. The old `.achievement-toast` block was replaced in Task 3.

- [ ] **Step 3: Verify old toast JS is replaced**

```bash
grep -n "showAchievementToast\|_toastQueue\|_toastActive\|_nextToast" js/main.js
```

Should return no results — these were replaced in Task 5.

- [ ] **Step 4: Test the full flow manually**

Open the game in a browser. Test these scenarios:

1. **Win a level** → Win overlay shows with progress bars (up to 3 achievements) → click "Next Level" → if achievements were earned, overlay appears with icon animation and sound → tap to dismiss → next level loads
2. **Win a level that unlocks a cat via achievement** → Achievement overlay shows "🐱 Neue Katze freigeschaltet!" teaser → tap → Cat unlock screen appears → tap → continues
3. **Main menu** → "Nächstes Ziel" widget visible below secondary buttons → shows closest achievement with progress bar → tap opens stats screen
4. **All achievements unlocked** → Widget shows "🌟 Alle Achievements freigeschaltet!" → Win overlay has no progress section

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: clean up old achievement toast references"
```

---

### Task 10: Final integration test and commit

- [ ] **Step 1: Run a full play-through**

Open `index.html` in the browser. Play through 2-3 levels. Verify:

- Win overlay progress bars animate with staggered timing
- Achievement overlay appears when a new achievement is earned
- Sound plays on achievement unlock
- Cat teaser shows only for cat-unlocking achievements
- Cat unlock overlay chains after achievement overlay dismiss
- Main menu next-goal widget updates after returning
- No console errors

- [ ] **Step 2: Edge case — clear localStorage for fresh start**

Open browser console:
```js
localStorage.clear();
location.reload();
```

Play the tutorial, complete first level. Verify:
- "First Purr" achievement overlay appears
- If this unlocks cat "Whisker", cat teaser shows → cat unlock screen chains
- Win overlay shows top 3 remaining achievements
- Menu shows next goal

- [ ] **Step 3: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "feat: achievement integration complete — overlay, progress, next-goal, cat chaining"
```
