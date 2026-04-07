# Color Drop Phase 3b — Daily Challenge, Achievements + Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three data-driven subsystems — Daily Challenge (date-seeded level per day), Achievements (14 badges, toast notification), and Stats (play statistics + achievement overview screen).

**Architecture:** All changes in `index.html`. Three new localStorage keys (`colordrop_daily`, `colordrop_stats`, `colordrop_achievements`) alongside the existing `colordrop_v1`. `showWin()` is the central integration point: it calls `updateStats()` and `checkAchievements()` after every win. Daily Challenge reuses the existing `blitz-overlay` CSS class for its interstitial. `G.isDailyChallenge` flag suppresses the Blitz timer on daily levels.

**Tech Stack:** Vanilla JS, localStorage, existing CSS custom properties (`var(--f-head)`, `var(--f-mono)`).

---

## File Map

| File | Changes |
|------|---------|
| `index.html` CSS (~line 11) | Add `.ls-actions`, `.ls-action-btn`, `.screen-overlay`, `.stats-card`, `.stats-grid`, `.ach-grid`, `.ach-icon`, `.achievement-toast` |
| `index.html` HTML (~line 546) | Add `.ls-actions` div with `#dailyChallengeBtn` and `#statsBtn` to level select |
| `index.html` HTML (~line 570) | Add `#dailyOverlay`, `#statsScreen`, `#achievementToast` before tutorial bubble |
| `index.html` JS constants (~line 642) | Add `ACHIEVEMENTS` array after `PALETTE` |
| `index.html` JS state (~line 713) | Add `G.isDailyChallenge` field |
| `index.html` JS helpers (~line 1821) | Add `loadDaily/saveDaily`, `loadStats/saveStats`, `loadAchievements/saveAchievements` after `saveStars()` |
| `index.html` JS `generateLevel()` (~line 868) | Guard blitz timer with `!G.isDailyChallenge` |
| `index.html` JS `updateTimer()` (~line 1406) | Guard against `G.won` to prevent timeout overlay after winning |
| `index.html` JS `showWin()` (~line 2023) | Call `updateStats()`, `checkAchievements()`, `showAchievementToast()`, save daily result |
| `index.html` JS `openLevelSelect()` (~line 1957) | Add `updateDailyBtn()` call + reset `G.isDailyChallenge` |
| `index.html` JS `buildLevelSelect()` (~line 1846) | Add 📅 icon on daily level button |
| `index.html` JS new functions | `dailyLevelNum`, `showDailyOverlay`, `updateDailyBtn`, `updateStats`, `checkAchievements`, `showAchievementToast`, `_nextToast`, `buildStatsScreen`, `showStatsScreen`, `hideStatsScreen` |
| `index.html` JS event listeners (~line 2071) | Wire `#dailyChallengeBtn`, `#dailyStartBtn`, `#statsBtn`, `#statsBackBtn` |

---

## Task 1: ACHIEVEMENTS constant + storage helpers + G.isDailyChallenge

**Files:**
- Modify: `index.html` — JS constants block (~line 642); G object (~line 713); after `saveStars()` (~line 1821)

- [ ] **Step 1: Add `ACHIEVEMENTS` constant after `PALETTE`**

Find the line (around line 642):
```js
};

/* ═══════════════════════════════════════════════════════════
   VISUAL THEMES
```

Insert the `ACHIEVEMENTS` constant immediately after the `PALETTE` closing `};` and before the THEMES comment block:

```js
/* ═══════════════════════════════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════════════════════════════ */
const ACHIEVEMENTS = [
    { id:'first_win',   icon:'🏆', name:'Erster Sieg',         desc:'Erstes Level gewonnen' },
    { id:'tier_medium', icon:'🔥', name:'Aufsteiger',           desc:'MEDIUM-Tier erreicht' },
    { id:'tier_hard',   icon:'❄️', name:'Eisbrecher',           desc:'HARD-Tier erreicht' },
    { id:'tier_expert', icon:'🌋', name:'Vulkanläufer',         desc:'EXPERT-Tier erreicht' },
    { id:'tier_master', icon:'👑', name:'Meister',              desc:'MASTER-Tier erreicht' },
    { id:'levels_10',   icon:'⭐', name:'Zehner',               desc:'10 Level gelöst' },
    { id:'levels_25',   icon:'🌟', name:'Vierteljahrhundert',   desc:'25 Level gelöst' },
    { id:'daily_first', icon:'📅', name:'Tagesmensch',          desc:'Erste Daily Challenge' },
    { id:'par_first',   icon:'🎯', name:'Scharf',               desc:'Level in Par gelöst' },
    { id:'three_star',  icon:'✨', name:'Perfektion',           desc:'3 Sterne erreicht' },
    { id:'streak_3',    icon:'🔥', name:'Dreier-Serie',         desc:'3× 3 Sterne in Folge' },
    { id:'streak_5',    icon:'💥', name:'Fünfer-Serie',         desc:'5× 3 Sterne in Folge' },
    { id:'blitz_first', icon:'⚡', name:'Blitzsieger',          desc:'Blitzrunde gewonnen' },
    { id:'blitz_5',     icon:'⚡⚡',name:'Blitzmeister',         desc:'5 Blitzrunden gewonnen' },
];

```

- [ ] **Step 2: Add `G.isDailyChallenge` to the G state object**

Find in the G object (around line 875):
```js
    timer:        null,     // null | { active, endTime, duration, _lastTick }
```

Add immediately after it:
```js
    isDailyChallenge: false, // true when the current level was started via Daily Challenge
```

- [ ] **Step 3: Add storage helper functions after `saveStars()`**

Find:
```js
/**
 * The highest level the player is allowed to start.
 * Always at least 1.
 */
function maxUnlockedLevel() {
```

Insert directly before it:

```js
/* ── Daily Challenge persistence ───────────────────────── */

function loadDaily() {
    try { return JSON.parse(localStorage.getItem('colordrop_daily') || 'null') || {}; }
    catch { return {}; }
}
function saveDaily(obj) {
    localStorage.setItem('colordrop_daily', JSON.stringify(obj));
}

/* ── Stats persistence ──────────────────────────────────── */

function loadStats() {
    const def = { played:0, won:0, totalMoves:0, blitzPlayed:0, blitzWon:0, bestStreak:0, currentStreak:0 };
    try { return Object.assign(def, JSON.parse(localStorage.getItem('colordrop_stats') || '{}')); }
    catch { return def; }
}
function saveStats(obj) {
    localStorage.setItem('colordrop_stats', JSON.stringify(obj));
}

/* ── Achievements persistence ───────────────────────────── */

function loadAchievements() {
    try { return JSON.parse(localStorage.getItem('colordrop_achievements') || '[]'); }
    catch { return []; }
}
function saveAchievements(ids) {
    localStorage.setItem('colordrop_achievements', JSON.stringify(ids));
}

```

- [ ] **Step 4: Verify in browser console**

Open `file:///C:/users/juerg/colordrop/index.html`. In DevTools console:
```js
console.log(typeof ACHIEVEMENTS, ACHIEVEMENTS.length);    // "object" 14
console.log(typeof G.isDailyChallenge);                   // "boolean"
console.log(loadStats());   // {played:0, won:0, totalMoves:0, ...}
console.log(loadDaily());   // {}
console.log(loadAchievements());  // []
```
Expected: all pass without errors.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(phase3b): ACHIEVEMENTS constant, G.isDailyChallenge, storage helpers"
```

---

## Task 2: `updateStats()` + `checkAchievements()` + `updateTimer()` guard + `showWin()` wiring

**Files:**
- Modify: `index.html` — new functions before `showWin()`; `updateTimer()` (~line 1406); `showWin()` (~line 2023)

- [ ] **Step 1: Add `updateStats()` and `checkAchievements()` before `showWin()`**

Find `function showWin() {`. Insert directly before it:

```js
/* ── Stats + Achievements ───────────────────────────────── */

/**
 * Increment play stats after a win. Returns the updated stats object.
 * @param {number}  levelNum
 * @param {number}  stars      1–3
 * @param {number}  moves
 * @param {boolean} isBlitz
 * @param {boolean} blitzWon
 */
function updateStats(levelNum, stars, moves, isBlitz, blitzWon) {
    const s = loadStats();
    s.played++;
    s.won++;
    s.totalMoves += moves;
    if (isBlitz) {
        s.blitzPlayed++;
        if (blitzWon) s.blitzWon++;
    }
    if (stars === 3) {
        s.currentStreak++;
        s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    } else {
        s.currentStreak = 0;
    }
    saveStats(s);
    return s;
}

/**
 * Check all achievements and unlock any newly earned ones.
 * @param {{ levelNum:number, stars:number, stats:object, progress:object,
 *            isDaily:boolean, isBlitz:boolean }} ctx
 * @returns {string[]} IDs of newly unlocked achievements
 */
function checkAchievements(ctx) {
    const unlocked = new Set(loadAchievements());
    const newIds   = [];

    function check(id, condition) {
        if (!unlocked.has(id) && condition) { unlocked.add(id); newIds.push(id); }
    }

    const wonCount = Object.keys(ctx.progress).length;

    check('first_win',   true);
    check('tier_medium', ctx.levelNum >= 4);
    check('tier_hard',   ctx.levelNum >= 9);
    check('tier_expert', ctx.levelNum >= 16);
    check('tier_master', ctx.levelNum >= 26);
    check('levels_10',   wonCount >= 10);
    check('levels_25',   wonCount >= 25);
    check('daily_first', ctx.isDaily);
    check('par_first',   ctx.stars === 3);   // 3 stars = at or under par
    check('three_star',  ctx.stars === 3);
    check('streak_3',    ctx.stats.currentStreak >= 3);
    check('streak_5',    ctx.stats.currentStreak >= 5);
    check('blitz_first', ctx.isBlitz);
    check('blitz_5',     ctx.stats.blitzWon >= 5);

    if (newIds.length) saveAchievements([...unlocked]);
    return newIds;
}

```

- [ ] **Step 2: Guard `updateTimer()` against firing after win**

Find in `updateTimer()`:
```js
function updateTimer() {
    if (!G.timer || !G.timer.active) return;
```

Replace with:
```js
function updateTimer() {
    if (!G.timer || !G.timer.active || G.won) return;
```

- [ ] **Step 3: Replace `showWin()`**

Find and replace the entire `showWin()` function:

```js
// BEFORE (replace this):
function showWin() {
    if (!G.won) return;   // player reset before the 600 ms timer fired
    const par   = parForLevel(LEVEL.current);
    const stars = calcStars(G.moves, par);
    saveStars(LEVEL.current, stars);
    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('winStars').textContent   = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('winPar').textContent     = 'Par: ' + par;
    document.getElementById('overlay').classList.add('show');
}
```

```js
// AFTER:
function showWin() {
    if (!G.won) return;   // player reset before the 600 ms timer fired
    const par      = parForLevel(LEVEL.current);
    const stars    = calcStars(G.moves, par);
    const isBlitz  = isTimedLevel(LEVEL.current) && !G.isDailyChallenge;
    const blitzWon = isBlitz && G.timer !== null;

    saveStars(LEVEL.current, stars);

    if (G.isDailyChallenge) {
        const today = new Date().toISOString().slice(0, 10);
        saveDaily({ date: today, levelNum: LEVEL.current, completed: true, stars });
    }

    const stats   = updateStats(LEVEL.current, stars, G.moves, isBlitz, blitzWon);
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
```

- [ ] **Step 4: Verify stats update in browser**

In DevTools console:
```js
// Simulate a win on level 3 (non-blitz)
localStorage.removeItem('colordrop_stats');
localStorage.removeItem('colordrop_achievements');
G.won = true; G.moves = 8; LEVEL.current = 3; G.isDailyChallenge = false; G.timer = null;
showWin();
console.log(loadStats());
// Expected: { played:1, won:1, totalMoves:8, blitzPlayed:0, blitzWon:0, bestStreak:0, currentStreak:0 }
// (streak 0 because 3 stars requires moves <= par — par for level 3 may be higher)
console.log(loadAchievements());
// Expected: ["first_win"] at minimum
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(phase3b): updateStats, checkAchievements, showWin wiring, updateTimer win guard"
```

---

## Task 3: Achievement Toast — HTML + CSS + JS

**Files:**
- Modify: `index.html` — HTML before tutorial bubble (~line 592); CSS block; JS new functions

- [ ] **Step 1: Add `#achievementToast` HTML**

Find:
```html
    <!-- Tutorial bubble -->
```

Insert directly before it:
```html
    <!-- Achievement Toast -->
    <div id="achievementToast" class="achievement-toast"></div>

```

- [ ] **Step 2: Add CSS for achievement toast**

Find the `.blitz-btn:active` rule (last blitz CSS rule). Append directly after its closing `}`:

```css
        /* ── Achievement Toast ─────────────────────────────────── */
        .achievement-toast {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20,20,40,.92);
            border: 1px solid rgba(255,255,255,.2);
            border-radius: 12px;
            padding: .6rem 1.4rem;
            font-size: .9rem;
            color: #fff;
            z-index: 400;
            opacity: 0;
            transition: opacity .3s;
            pointer-events: none;
            white-space: nowrap;
        }
        .achievement-toast.show { opacity: 1; }
```

- [ ] **Step 3: Add `showAchievementToast()` JS before `render()`**

Find `/* ── Timer (Blitzrunde) ──────────────────────────────────── */`. Insert directly before it:

```js
/* ── Achievement Toast ───────────────────────────────────── */

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
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(_nextToast, 350);
    }, 3000);
}

```

- [ ] **Step 4: Test toast in browser**

In DevTools console:
```js
showAchievementToast(['first_win', 'three_star']);
```
Expected:
- "🏆  Erster Sieg freigeschaltet!" appears at bottom-center for 3 seconds
- Then fades out, "✨  Perfektion freigeschaltet!" appears for 3 seconds
- Then fades out

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(phase3b): achievement toast with queue"
```

---

## Task 4: Stats Screen — HTML + CSS + JS + Level Select buttons

**Files:**
- Modify: `index.html` — HTML (stats screen + level select buttons); CSS; JS new functions; event listeners

- [ ] **Step 1: Add Level Select action buttons to HTML**

Find in HTML:
```html
            <button id="tutBtn" class="ls-tut-btn" type="button" aria-label="Tutorial starten">?</button>
            <div class="ls-tiers" id="lsTiers"></div>
```

Replace with:
```html
            <button id="tutBtn" class="ls-tut-btn" type="button" aria-label="Tutorial starten">?</button>
            <div class="ls-actions">
                <button id="dailyChallengeBtn" class="ls-action-btn" type="button">📅 Tages-Challenge</button>
                <button id="statsBtn" class="ls-action-btn ls-action-btn--secondary" type="button">📊 Statistiken</button>
            </div>
            <div class="ls-tiers" id="lsTiers"></div>
```

- [ ] **Step 2: Add `#statsScreen` HTML**

Find:
```html
    <!-- Achievement Toast -->
```

Insert directly before it:
```html
    <!-- Stats Screen -->
    <div id="statsScreen" class="screen-overlay hidden">
        <div class="stats-card">
            <h2 class="stats-title">STATISTIKEN</h2>
            <div class="stats-grid" id="statsGrid"></div>
            <h3 class="stats-sub" id="achCount">ACHIEVEMENTS 0 / 14</h3>
            <div class="ach-grid" id="achGrid"></div>
            <button class="win-btn" id="statsBackBtn" type="button">← Zurück</button>
        </div>
    </div>

```

- [ ] **Step 3: Add CSS for Level Select action buttons**

Find the `.ls-tut-btn` rule in the CSS. Append directly after its closing `}`:

```css
        /* ── Level Select action buttons ───────────────────────── */
        .ls-actions {
            display: flex;
            flex-direction: column;
            gap: .55rem;
            margin: .8rem 0 1rem;
        }
        .ls-action-btn {
            font-family: var(--f-head);
            font-size: .8rem;
            letter-spacing: 2px;
            padding: .55rem 1.4rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.22);
            background: rgba(255,255,255,.08);
            color: #fff;
            cursor: pointer;
            transition: background .15s;
        }
        .ls-action-btn:hover  { background: rgba(255,255,255,.16); }
        .ls-action-btn:active { transform: scale(.97); }
        .ls-action-btn:disabled { opacity: .38; cursor: default; }
        .ls-action-btn--secondary { opacity: .7; }
        .ls-action-btn--secondary:hover { opacity: 1; }
```

- [ ] **Step 4: Add CSS for Stats Screen**

Append directly after the `.ls-action-btn` rules:

```css
        /* ── Stats Screen ──────────────────────────────────────── */
        .screen-overlay {
            position: fixed;
            inset: 0;
            z-index: 150;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(5,5,15,.93);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
        }
        .screen-overlay.hidden { display: none; }

        .stats-card {
            background: rgba(15,15,40,.90);
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 24px;
            padding: 2rem 2.5rem;
            max-width: 360px;
            width: 90%;
            text-align: center;
        }
        .stats-title {
            font-family: var(--f-head);
            font-size: 1.3rem;
            color: #fff;
            letter-spacing: 3px;
            margin: 0 0 1.2rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: .35rem 1.5rem;
            margin-bottom: 1.4rem;
            text-align: left;
        }
        .stats-label { color: rgba(255,255,255,.55); font-size: .85rem; }
        .stats-value { color: #fff; font-size: .85rem; font-weight: 600; text-align: right; }
        .stats-sub {
            font-family: var(--f-mono);
            font-size: .75rem;
            letter-spacing: 2px;
            color: rgba(255,255,255,.45);
            margin: 0 0 .8rem;
        }
        .ach-grid {
            display: flex;
            flex-wrap: wrap;
            gap: .55rem;
            justify-content: center;
            margin-bottom: 1.6rem;
        }
        .ach-icon        { font-size: 1.4rem; opacity: .2; cursor: default; }
        .ach-icon.unlocked { opacity: 1; }
```

- [ ] **Step 5: Add `buildStatsScreen()`, `showStatsScreen()`, `hideStatsScreen()` JS**

Find `function showWin() {`. Insert directly before it:

```js
/* ── Stats Screen ────────────────────────────────────────── */

function buildStatsScreen() {
    const s   = loadStats();
    const ach = loadAchievements();

    // Stats rows
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
        l.className   = 'stats-label';
        l.textContent = label;
        const v = document.createElement('span');
        v.className   = 'stats-value';
        v.textContent = value;
        grid.append(l, v);
    }

    // Achievement count + grid
    document.getElementById('achCount').textContent = 'ACHIEVEMENTS ' + ach.length + ' / ' + ACHIEVEMENTS.length;
    const achGrid = document.getElementById('achGrid');
    achGrid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
        const span         = document.createElement('span');
        const isUnlocked   = ach.includes(a.id);
        span.className     = 'ach-icon' + (isUnlocked ? ' unlocked' : '');
        span.textContent   = isUnlocked ? a.icon : '?';
        span.title         = isUnlocked ? a.name + ': ' + a.desc : '???';
        achGrid.appendChild(span);
    }
}

function showStatsScreen() {
    buildStatsScreen();
    document.getElementById('statsScreen').classList.remove('hidden');
}

function hideStatsScreen() {
    document.getElementById('statsScreen').classList.add('hidden');
}

```

- [ ] **Step 6: Add event listeners for Stats Screen**

Find:
```js
document.getElementById('blitzStartBtn').addEventListener('click', () => {
```

Insert directly before it:
```js
document.getElementById('statsBtn'    ).addEventListener('click', showStatsScreen);
document.getElementById('statsBackBtn').addEventListener('click', hideStatsScreen);
```

- [ ] **Step 7: Test Stats Screen in browser**

Open Level Select, click "📊 Statistiken".
Expected: full-screen dark overlay with stats card, all values zero, 14 grey `?` achievement icons, "← Zurück" closes it.

Simulate some achievements:
```js
saveAchievements(['first_win','three_star','blitz_first']);
showStatsScreen();
```
Expected: 3 icons coloured (🏆 ✨ ⚡), remaining 11 grey `?`.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat(phase3b): stats screen, achievement grid, level select action buttons"
```

---

## Task 5: Daily Challenge — HTML + logic + generateLevel integration + Level Select wiring

**Files:**
- Modify: `index.html` — HTML (`#dailyOverlay`); JS new functions; `generateLevel()`; `openLevelSelect()`; `buildLevelSelect()`; event listeners

- [ ] **Step 1: Add `#dailyOverlay` HTML**

Find:
```html
    <!-- Stats Screen -->
```

Insert directly before it:
```html
    <!-- Daily Challenge Interstitial -->
    <div id="dailyOverlay" class="blitz-overlay">
        <div class="blitz-inner">
            <h2 class="blitz-title">📅 TAGES-CHALLENGE</h2>
            <p class="blitz-level" id="dailyDate"></p>
            <p class="blitz-time" id="dailyLevelLabel"></p>
            <button id="dailyStartBtn" class="blitz-btn" type="button">SPIELEN</button>
        </div>
    </div>

```

- [ ] **Step 2: Add `dailyLevelNum()`, `showDailyOverlay()`, `updateDailyBtn()` JS**

Find `function showBlitzOverlay(n) {`. Insert directly before it:

```js
/* ── Daily Challenge ─────────────────────────────────────── */

/** Returns today's daily challenge level number (1–25, same for all players on same date). */
function dailyLevelNum() {
    const dateStr = new Date().toISOString().slice(0, 10);  // "2026-04-07"
    let hash = 0;
    for (const ch of dateStr) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
    return (Math.abs(hash) % 25) + 1;   // Level 1–25 (EASY–EXPERT; MASTER excluded intentionally)
}

/** Populate and show the Daily Challenge announcement overlay. */
function showDailyOverlay() {
    const n         = dailyLevelNum();
    const cfg       = levelConfig(n);
    const dateLabel = new Date().toLocaleDateString('de-DE', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('dailyDate').textContent       = dateLabel;
    document.getElementById('dailyLevelLabel').textContent = 'Level ' + n + ' · ' + cfg.tier;
    document.getElementById('dailyOverlay').style.setProperty('--blitz-color', THEMES[cfg.tier].accentColor);
    document.getElementById('dailyOverlay').classList.add('show');
}

/** Update the daily challenge button text based on today's play status. */
function updateDailyBtn() {
    const daily = loadDaily();
    const today = new Date().toISOString().slice(0, 10);
    const btn   = document.getElementById('dailyChallengeBtn');
    if (daily.date === today && daily.completed) {
        btn.textContent = '📅 Heute: ' + '⭐'.repeat(daily.stars) + ' — morgen wieder';
        btn.disabled    = true;
    } else {
        btn.textContent = '📅 Tages-Challenge';
        btn.disabled    = false;
    }
}

```

- [ ] **Step 3: Guard blitz timer for daily challenges in `generateLevel()`**

Find in `generateLevel()`:
```js
    if (isTimedLevel(n)) {
```

Replace with:
```js
    if (isTimedLevel(n) && !G.isDailyChallenge) {
```

- [ ] **Step 4: Reset `G.isDailyChallenge` and call `updateDailyBtn()` in `openLevelSelect()`**

Find in `openLevelSelect()`:
```js
function openLevelSelect() {
    buildLevelSelect();
    hideOverlay();   // close win overlay if it was open
```

Replace with:
```js
function openLevelSelect() {
    G.isDailyChallenge = false;
    buildLevelSelect();
    updateDailyBtn();
    hideOverlay();   // close win overlay if it was open
```

- [ ] **Step 5: Add 📅 icon to daily level in `buildLevelSelect()`**

Find in `buildLevelSelect()`:
```js
                    '<span class="ls-num">' + (isTimedLevel(n) ? '⚡' + n : n) + '</span>' +
```

Replace with:
```js
                    '<span class="ls-num">' + (isTimedLevel(n) ? '⚡' : '') + n + (n === dailyLevelNum() ? ' 📅' : '') + '</span>' +
```

- [ ] **Step 6: Add event listeners for Daily Challenge**

Find:
```js
document.getElementById('statsBtn'    ).addEventListener('click', showStatsScreen);
```

Insert directly before it:
```js
document.getElementById('dailyChallengeBtn').addEventListener('click', () => {
    document.getElementById('levelSelect').classList.remove('show');
    showDailyOverlay();
});

document.getElementById('dailyStartBtn').addEventListener('click', () => {
    document.getElementById('dailyOverlay').classList.remove('show');
    G.isDailyChallenge = true;
    generateLevel(dailyLevelNum());
});

```

- [ ] **Step 7: Also hide `#dailyOverlay` in `openLevelSelect()`**

Find in `openLevelSelect()`:
```js
    document.getElementById('blitzOverlay').classList.remove('show');
    document.getElementById('timeoutOverlay').classList.remove('show');
```

Replace with:
```js
    document.getElementById('blitzOverlay').classList.remove('show');
    document.getElementById('dailyOverlay').classList.remove('show');
    document.getElementById('timeoutOverlay').classList.remove('show');
```

- [ ] **Step 8: Full Daily Challenge play-through test**

In DevTools console, clear daily progress:
```js
localStorage.removeItem('colordrop_daily');
location.reload();
```

Open Level Select. Expected:
1. "📅 Tages-Challenge" button enabled
2. Click it: dark overlay with today's date, level number, "SPIELEN" button
3. Click "SPIELEN": daily level loads, no Blitz timer (even if level 5/10/15/20/25)
4. Solve the level: Win overlay appears; `loadDaily()` shows `{ completed:true, stars:N }`
5. Click Menu: Level Select shows "📅 Heute: ⭐⭐☆ — morgen wieder" (disabled)

Test 📅 icon in Level Select:
```js
console.log(dailyLevelNum());   // e.g. 12
// Level 12 button should show "12 📅"
```

- [ ] **Step 9: Test blitz level as daily (skip timer)**

```js
// If today's daily level happens to be 5, 10, 15, 20, or 25:
// Force a known timed level as daily for testing:
const n = 5;
G.isDailyChallenge = true;
generateLevel(n);
// Expected: no Blitz overlay, timer bar not visible
G.isDailyChallenge = false;
```

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "feat(phase3b): daily challenge — overlay, level logic, generateLevel integration, level select wiring"
```

---

## Self-Review

### Spec coverage

| Spec section | Task |
|---|---|
| `colordrop_daily` / `colordrop_stats` / `colordrop_achievements` keys | Task 1 |
| `loadDaily/saveDaily`, `loadStats/saveStats`, `loadAchievements/saveAchievements` | Task 1 |
| `G.isDailyChallenge` state field | Task 1 |
| `updateStats()` — played, won, totalMoves, blitz, streak | Task 2 |
| `checkAchievements()` — all 14 IDs | Task 2 |
| `showWin()` wiring — stats, achievements, daily save | Task 2 |
| `updateTimer()` win guard | Task 2 |
| Achievement Toast HTML + CSS + JS queue | Task 3 |
| Stats Screen HTML + CSS | Task 4 |
| `buildStatsScreen()` — stats rows + achievement icons | Task 4 |
| Level Select "📅 Tages-Challenge" + "📊 Statistiken" buttons | Task 4 |
| `dailyLevelNum()` — date-seeded hash, Level 1–25 | Task 5 |
| `showDailyOverlay()` — date label, level label, accent color | Task 5 |
| `updateDailyBtn()` — disabled + result text when already played | Task 5 |
| No Blitz timer for daily challenges | Task 5 |
| `G.isDailyChallenge` reset on `openLevelSelect()` | Task 5 |
| 📅 icon on daily level button in Level Select | Task 5 |
| `saveDaily()` called from `showWin()` when `G.isDailyChallenge` | Task 2 |
| `daily_first` achievement triggers on `isDaily` | Task 2 |

All spec sections covered. ✓

### Placeholder scan

No TBD, TODO, or vague steps. All code complete. ✓

### Type consistency

- `ACHIEVEMENTS[].id` strings used in `checkAchievements()` and `buildStatsScreen()` — consistent. ✓
- `loadStats()` returns object with `currentStreak`, `bestStreak`, `blitzWon` — used correctly in `checkAchievements()`. ✓
- `G.isDailyChallenge` set `true` in `dailyStartBtn` listener, reset `false` in `openLevelSelect()`. ✓
- `dailyLevelNum()` called in Task 5 steps 2, 5, 6 — all consistent. ✓
- `showAchievementToast(ids)` defined in Task 3, called in Task 2 (`showWin`). Task 3 must be merged before Task 2 in execution order — Tasks are numbered correctly (Task 3 before Task 2 in showWin is a forward reference, but since all JS is in one file parsed top-to-bottom, `showAchievementToast` must be defined before `showWin` is called at runtime, not at parse time — OK). ✓
