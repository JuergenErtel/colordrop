# CatSort Plan 3: Sammelsystem + Wirtschaft

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cat collection system (30 cats unlocked through gameplay), fish bone economy (earn and spend currency), daily streak calendar, and premium upgrade infrastructure.

**Architecture:** New modules for cat data (`js/cats.js`), economy logic (`js/economy.js`), and premium state (`js/premium.js`). New UI screens for cat album and streak calendar added to `index.html`. Main.js wires economy earning into win flow, hint/undo spending, and ad simulation.

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D (cat album gallery), CSS Grid (streak calendar)

---

## File Structure

```
js/
  cats.js         — Create: 30 cat definitions, unlock conditions, check logic
  economy.js      — Create: fish bone earning/spending, ad timing
  premium.js      — Create: premium state, feature gating
  storage.js      — Modify: add economy, collection, premium, streak persistence
  main.js         — Modify: wire economy into win/hint/undo, add album/streak/premium UI
  constants.js    — Modify: add fish bone reward values
index.html        — Modify: add cat album, streak calendar, premium banner UI + CSS
```

---

### Task 1: Add cat definitions and unlock logic

**Files:**
- Create: `js/cats.js`

- [ ] **Step 1: Create `js/cats.js`**

```js
// js/cats.js
'use strict';

/**
 * 30 collectible cats. Each has:
 * - id: unique string
 * - name: display name
 * - breed: breed/description
 * - emoji: visual placeholder (until real art)
 * - fact: fun fact text
 * - unlock: { type, value } — condition to unlock
 * - premium: true if premium-only
 */
export const CATS = [
  // ── Story Level Milestones (10) ────────────────────────
  { id:'mochi',    name:'Mochi',    breed:'Britisch Kurzhaar', emoji:'😺', fact:'Schläft 18 Stunden am Tag.',         unlock:{ type:'level', value:10 },  premium:false },
  { id:'espresso', name:'Espresso', breed:'Schwarze Katze',    emoji:'😸', fact:'Trinkt nur aus dem Wasserhahn.',      unlock:{ type:'level', value:25 },  premium:false },
  { id:'mango',    name:'Mango',    breed:'Orange Tabby',      emoji:'😻', fact:'Jagt ihren eigenen Schwanz.',         unlock:{ type:'level', value:50 },  premium:false },
  { id:'luna',     name:'Luna',     breed:'Perserkatze',       emoji:'😽', fact:'Hat einen eigenen Instagram-Account.',unlock:{ type:'level', value:75 },  premium:false },
  { id:'pixel',    name:'Pixel',    breed:'Calico',            emoji:'🐱', fact:'Kann Türen öffnen.',                  unlock:{ type:'level', value:100 }, premium:false },
  { id:'shadow',   name:'Shadow',   breed:'Russisch Blau',     emoji:'😼', fact:'Erscheint nur bei Vollmond.',         unlock:{ type:'level', value:150 }, premium:false },
  { id:'ginger',   name:'Ginger',   breed:'Maine Coon',        emoji:'😺', fact:'Wiegt stolze 9 Kilo.',               unlock:{ type:'level', value:200 }, premium:false },
  { id:'miso',     name:'Miso',     breed:'Japanische Bobtail',emoji:'😸', fact:'Bringt angeblich Glück.',             unlock:{ type:'level', value:250 }, premium:false },
  { id:'prince',   name:'Prince',   breed:'Siamkatze',         emoji:'😻', fact:'Miaut in perfekter Tonlage.',         unlock:{ type:'level', value:300 }, premium:false },
  { id:'whiskers', name:'Whiskers', breed:'Hauskatze',         emoji:'😽', fact:'Hat den Endlos-Modus entdeckt.',      unlock:{ type:'endless', value:1 }, premium:false },

  // ── Achievement-based (8) ──────────────────────────────
  { id:'felix',    name:'Felix',    breed:'Tuxedo',            emoji:'🐱', fact:'Trägt immer Anzug.',                  unlock:{ type:'achievement', value:'first_solve' },    premium:false },
  { id:'cleo',     name:'Cleo',     breed:'Ägyptische Mau',    emoji:'😼', fact:'Fühlt sich wie Kleopatra.',           unlock:{ type:'achievement', value:'paw_print' },      premium:false },
  { id:'simba',    name:'Simba',    breed:'Abessinier',        emoji:'🦁', fact:'Denkt er wäre ein Löwe.',             unlock:{ type:'achievement', value:'pride_of_lions' }, premium:false },
  { id:'ninja',    name:'Ninja',    breed:'Bombay',            emoji:'😸', fact:'Bewegt sich lautlos.',                unlock:{ type:'achievement', value:'hot_streak' },     premium:false },
  { id:'bella',    name:'Bella',    breed:'Ragdoll',           emoji:'😻', fact:'Wird beim Hochheben ganz schlaff.',   unlock:{ type:'achievement', value:'star_collector' }, premium:false },
  { id:'ziggy',    name:'Ziggy',    breed:'Cornish Rex',       emoji:'😺', fact:'Hat lockiges Fell.',                  unlock:{ type:'achievement', value:'yarn_ball' },      premium:false },
  { id:'storm',    name:'Storm',    breed:'Norwegische Waldkatze', emoji:'😽', fact:'Liebt Schnee und Regen.',         unlock:{ type:'achievement', value:'sharpshooter' },   premium:false },
  { id:'rocket',   name:'Rocket',   breed:'Bengal',            emoji:'⚡', fact:'Rennt 48 km/h.',                      unlock:{ type:'achievement', value:'lightning_paw' },  premium:false },

  // ── Daily Streak (6) ───────────────────────────────────
  { id:'cozy',     name:'Cozy',     breed:'Scottish Fold',     emoji:'😺', fact:'Sitzt immer im Karton.',              unlock:{ type:'streak', value:3 },   premium:false },
  { id:'chai',     name:'Chai',     breed:'Birmakatze',        emoji:'😸', fact:'Schnurrt beim Teetrinken.',           unlock:{ type:'streak', value:7 },   premium:false },
  { id:'noodle',   name:'Noodle',   breed:'Sphynx',            emoji:'😻', fact:'Trägt im Winter Pullover.',           unlock:{ type:'streak', value:14 },  premium:false },
  { id:'biscuit',  name:'Biscuit',  breed:'Exotic Shorthair',  emoji:'😽', fact:'Knetet alles was weich ist.',         unlock:{ type:'streak', value:30 },  premium:false },
  { id:'velvet',   name:'Velvet',   breed:'Chartreux',         emoji:'🐱', fact:'Ihr Fell fühlt sich wie Samt an.',    unlock:{ type:'streak', value:60 },  premium:false },
  { id:'legend',   name:'Legend',   breed:'Türkisch Van',      emoji:'😼', fact:'Schwimmt gerne.',                     unlock:{ type:'streak', value:100 }, premium:false },

  // ── Premium-only (5) ──────────────────────────────────
  { id:'duchess',  name:'Duchess',  breed:'Chinchilla Perser',  emoji:'👑', fact:'Akzeptiert nur Bio-Futter.',          unlock:{ type:'premium', value:true }, premium:true },
  { id:'sapphire', name:'Sapphire', breed:'Korat',              emoji:'💎', fact:'Hat smaragdgrüne Augen.',             unlock:{ type:'premium', value:true }, premium:true },
  { id:'marble',   name:'Marble',   breed:'American Curl',      emoji:'🎨', fact:'Jedes Ohr ist anders geformt.',       unlock:{ type:'premium', value:true }, premium:true },
  { id:'cosmos',   name:'Cosmos',   breed:'Nebelung',           emoji:'🌌', fact:'Ihr Fell schimmert silbern.',         unlock:{ type:'premium', value:true }, premium:true },
  { id:'kaiser',   name:'Kaiser',   breed:'Goldene Sphynx',     emoji:'✨', fact:'Die seltenste Katze der Welt.',       unlock:{ type:'premium', value:true }, premium:true },
];

/**
 * Check which cats are newly unlocked given current game state.
 * @param {Set<string>} owned — already unlocked cat IDs
 * @param {object} state — { maxLevel, achievements, streak, endlessBest, isPremium }
 * @returns {string[]} newly unlocked cat IDs
 */
export function checkCatUnlocks(owned, state) {
  const newCats = [];
  for (const cat of CATS) {
    if (owned.has(cat.id)) continue;
    let unlocked = false;
    switch (cat.unlock.type) {
      case 'level':
        unlocked = state.maxLevel >= cat.unlock.value;
        break;
      case 'achievement':
        unlocked = state.achievements.includes(cat.unlock.value);
        break;
      case 'streak':
        unlocked = state.streak >= cat.unlock.value;
        break;
      case 'endless':
        unlocked = state.endlessBest >= cat.unlock.value;
        break;
      case 'premium':
        unlocked = state.isPremium;
        break;
    }
    if (unlocked) newCats.push(cat.id);
  }
  return newCats;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/cats.js
git commit -m "feat: add 30 cat definitions with unlock conditions"
```

---

### Task 2: Add economy module

**Files:**
- Create: `js/economy.js`
- Modify: `js/constants.js`

- [ ] **Step 1: Add reward constants to constants.js**

Add at the end of `js/constants.js`:

```js
/* ── Fish bone economy ────────────────────────────────────── */
export const REWARDS = {
  levelWin:      5,
  threeStarWin: 10,
  dailyWin:     15,
  blitzWin:      3,
  endlessRound:  3,
  endlessBonus: 10,  // every 10 rounds
  rewardedAd:   20,
};

export const COSTS = {
  hint:     15,
  extraUndo: 10,
};
```

- [ ] **Step 2: Create `js/economy.js`**

```js
// js/economy.js
'use strict';

import { REWARDS, COSTS } from './constants.js';

let _balance = 0;
let _isPremium = false;

export function getBalance() { return _balance; }
export function setBalance(n) { _balance = Math.max(0, n); }

export function earn(amount) { _balance += amount; }
export function spend(amount) {
  if (_balance < amount) return false;
  _balance -= amount;
  return true;
}
export function canAfford(amount) { return _balance >= amount; }

/**
 * Calculate fish bones earned for a win.
 * Premium doubles rewards.
 */
export function calcWinReward(stars, isDaily, isBlitz, isEndless, endlessRound) {
  let amount = REWARDS.levelWin;
  if (stars === 3) amount = REWARDS.threeStarWin;
  if (isDaily) amount = REWARDS.dailyWin;
  if (isBlitz) amount += REWARDS.blitzWin;
  if (isEndless) {
    amount = REWARDS.endlessRound;
    if (endlessRound > 0 && endlessRound % 10 === 0) amount += REWARDS.endlessBonus;
  }
  if (_isPremium) amount *= 2;
  return amount;
}

/* ── Premium ──────────────────────────────────────────────── */

export function isPremium() { return _isPremium; }
export function setPremium(val) { _isPremium = !!val; }

/* ── Ad timing (simulated) ────────────────────────────────── */

let _levelsSinceAd = 0;
let _lastAdTime = 0;
const AD_INTERVAL_LEVELS = 3;
const AD_COOLDOWN_MS = 180000; // 3 minutes

export function shouldShowAd() {
  if (_isPremium) return false;
  _levelsSinceAd++;
  if (_levelsSinceAd >= AD_INTERVAL_LEVELS && (Date.now() - _lastAdTime) >= AD_COOLDOWN_MS) {
    return true;
  }
  return false;
}

export function markAdShown() {
  _levelsSinceAd = 0;
  _lastAdTime = Date.now();
}

/* ── Free tier limits ─────────────────────────────────────── */

const FREE_UNDO_LIMIT = 3;
let _undosUsed = 0;

export function canUndo(historyLen) {
  if (_isPremium) return historyLen > 0;
  return historyLen > 0 && _undosUsed < FREE_UNDO_LIMIT;
}

export function trackUndo() { _undosUsed++; }
export function resetUndos() { _undosUsed = 0; }
export function getUndosLeft() { return _isPremium ? 99 : Math.max(0, FREE_UNDO_LIMIT - _undosUsed); }

export function canUseHint() {
  if (_isPremium) return true;
  return _balance >= COSTS.hint;
}

export function spendHint() {
  if (_isPremium) return true;
  return spend(COSTS.hint);
}

/* ── Endless daily limit (free) ───────────────────────────── */

let _endlessPlaysToday = 0;
let _endlessDate = '';
const FREE_ENDLESS_LIMIT = 3;

export function canPlayEndless() {
  if (_isPremium) return true;
  const today = new Date().toISOString().slice(0, 10);
  if (_endlessDate !== today) { _endlessDate = today; _endlessPlaysToday = 0; }
  return _endlessPlaysToday < FREE_ENDLESS_LIMIT;
}

export function trackEndlessPlay() {
  const today = new Date().toISOString().slice(0, 10);
  if (_endlessDate !== today) { _endlessDate = today; _endlessPlaysToday = 0; }
  _endlessPlaysToday++;
}
```

- [ ] **Step 3: Commit**

```bash
git add js/constants.js js/economy.js
git commit -m "feat: add fish bone economy with rewards, costs, and premium gating"
```

---

### Task 3: Add collection and economy persistence

**Files:**
- Modify: `js/storage.js`

- [ ] **Step 1: Add collection, economy, and streak functions to storage.js**

Add after existing exports:

```js
/* ── Cat Collection ───────────────────────────────────────── */

export function loadCollection() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-collection`) || '[]'); }
  catch { return []; }
}

export function saveCollection(ids) {
  localStorage.setItem(`${PREFIX}-collection`, JSON.stringify(ids));
}

/* ── Economy (fish bone balance) ──────────────────────────── */

export function loadEconomy() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-economy`) || '0'); }
  catch { return 0; }
}

export function saveEconomy(balance) {
  localStorage.setItem(`${PREFIX}-economy`, JSON.stringify(balance));
}

/* ── Premium status ───────────────────────────────────────── */

export function loadPremium() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-premium`) || 'false'); }
  catch { return false; }
}

export function savePremium(val) {
  localStorage.setItem(`${PREFIX}-premium`, JSON.stringify(!!val));
}

/* ── Daily Streak ─────────────────────────────────────────── */

export function loadStreak() {
  const def = { current: 0, best: 0, lastDate: '', calendar: {} };
  try { return Object.assign(def, JSON.parse(localStorage.getItem(`${PREFIX}-streak`) || '{}')); }
  catch { return def; }
}

export function saveStreak(obj) {
  localStorage.setItem(`${PREFIX}-streak`, JSON.stringify(obj));
}
```

- [ ] **Step 2: Commit**

```bash
git add js/storage.js
git commit -m "feat: add collection, economy, premium, streak persistence"
```

---

### Task 4: Add UI — Cat Album, Streak Calendar, Premium Banner, Economy HUD

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add fish bone counter to HUD overlay**

In the `.hud-overlay` div, add after the menu button:

```html
<span class="hud-bones" id="bonesDisplay">🦴 0</span>
```

- [ ] **Step 2: Add fish bone counter CSS**

```css
.hud-bones {
  font-family: var(--f-head);
  font-size: .75rem;
  color: var(--gold);
  letter-spacing: .05em;
}
```

- [ ] **Step 3: Add Cat Album screen HTML**

Add after the settings screen:

```html
<!-- Cat Album -->
<div id="albumScreen" class="screen-overlay hidden">
  <div class="album-card">
    <h2 class="stats-title">KATZEN-ALBUM</h2>
    <p class="album-count" id="albumCount">0 / 30</p>
    <div class="album-grid" id="albumGrid"></div>
    <button class="win-btn" id="albumBackBtn" type="button">← Zurück</button>
  </div>
</div>

<!-- Cat Detail -->
<div id="catDetailOverlay" class="screen-overlay hidden">
  <div class="stats-card cat-detail">
    <div class="cat-detail-emoji" id="catEmoji">🐱</div>
    <h2 class="stats-title" id="catName">Mochi</h2>
    <p class="cat-breed" id="catBreed">Britisch Kurzhaar</p>
    <p class="cat-fact" id="catFact">Schläft 18 Stunden am Tag.</p>
    <button class="win-btn" id="catDetailBack" type="button">← Zurück</button>
  </div>
</div>
```

- [ ] **Step 4: Add Streak Calendar screen HTML**

Add after cat detail:

```html
<!-- Streak Calendar -->
<div id="streakScreen" class="screen-overlay hidden">
  <div class="stats-card">
    <h2 class="stats-title">TAGES-STREAK</h2>
    <p class="streak-info" id="streakInfo">🐾 0 Tage in Folge</p>
    <div class="streak-calendar" id="streakCalendar"></div>
    <button class="win-btn" id="streakBackBtn" type="button">← Zurück</button>
  </div>
</div>
```

- [ ] **Step 5: Add Premium banner HTML**

Add after streak calendar (but before tutorial bubble):

```html
<!-- Premium Banner -->
<div class="premium-banner" id="premiumBanner">
  <span>🐾 CatSort Premium — Keine Werbung, unbegrenzte Hints & Undos</span>
  <button class="premium-btn" id="premiumBtn" type="button">4,99€</button>
</div>
```

- [ ] **Step 6: Add album button in level select**

In `.ls-actions`, add after the endless button:

```html
<button id="albumBtn" class="ls-action-btn" type="button">🐱 Katzen-Album</button>
<button id="streakBtn" class="ls-action-btn ls-action-btn--secondary" type="button">📅 Streak-Kalender</button>
```

- [ ] **Step 7: Add CSS for album, streak, premium**

```css
/* ── Cat Album ────────────────────────────────────────────── */
.album-card {
  background: rgba(75,50,30,.90);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 24px;
  padding: 1.5rem 2rem;
  max-width: 400px;
  width: 92%;
  text-align: center;
  max-height: 80vh;
  overflow-y: auto;
}
.album-count {
  font-size: .8rem;
  color: rgba(255,255,255,.5);
  margin: -.5rem 0 1rem;
  letter-spacing: 2px;
}
.album-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: .5rem;
  margin-bottom: 1.2rem;
}
.album-cell {
  aspect-ratio: 1;
  border-radius: 10px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.10);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  cursor: pointer;
  transition: transform .1s, background .15s;
}
.album-cell:hover { background: rgba(255,255,255,.12); transform: scale(1.05); }
.album-cell.locked {
  opacity: .3;
  cursor: default;
  font-size: 1rem;
}
.album-cell.locked:hover { transform: none; background: rgba(255,255,255,.06); }
.album-cell.premium-locked {
  border-color: rgba(212,135,63,.3);
  opacity: .5;
}

/* ── Cat Detail ───────────────────────────────────────────── */
.cat-detail { max-width: 280px; }
.cat-detail-emoji { font-size: 3.5rem; margin-bottom: .5rem; }
.cat-breed { font-size: .75rem; color: rgba(255,255,255,.5); letter-spacing: 2px; text-transform: uppercase; margin: -.3rem 0 .8rem; }
.cat-fact { font-size: .85rem; color: rgba(255,255,255,.7); font-style: italic; margin-bottom: 1.2rem; }

/* ── Streak Calendar ──────────────────────────────────────── */
.streak-info {
  font-size: 1rem;
  color: var(--gold);
  margin: -.3rem 0 1rem;
}
.streak-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  margin-bottom: 1.2rem;
}
.streak-day {
  aspect-ratio: 1;
  border-radius: 6px;
  background: rgba(255,255,255,.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .6rem;
  color: rgba(255,255,255,.3);
}
.streak-day.played {
  background: rgba(212,135,63,.25);
  color: var(--gold);
}
.streak-day.today {
  border: 1px solid var(--gold);
  color: var(--gold);
}

/* ── Premium Banner ───────────────────────────────────────── */
.premium-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .8rem;
  padding: .5rem 1rem;
  background: rgba(60,40,25,.92);
  border-top: 1px solid rgba(212,135,63,.25);
  font-size: .7rem;
  color: rgba(255,255,255,.6);
  z-index: 100;
}
.premium-banner.hidden { display: none; }
.premium-btn {
  font-family: var(--f-head);
  font-size: .7rem;
  padding: .3rem .8rem;
  background: rgba(212,135,63,.20);
  border: 1px solid rgba(212,135,63,.50);
  border-radius: 8px;
  color: var(--gold);
  cursor: pointer;
}
.premium-btn:hover { background: rgba(212,135,63,.35); }
```

- [ ] **Step 8: Add ad interstitial placeholder**

```html
<!-- Ad Interstitial (simulated) -->
<div id="adOverlay" class="overlay">
  <div class="win-card">
    <div class="win-icon">📺</div>
    <h2 class="win-title" style="font-size:1.2rem">WERBUNG</h2>
    <p class="win-sub">Werbefrei spielen mit Premium!</p>
    <div class="win-actions">
      <button class="win-btn" id="adSkipBtn" type="button">Weiter →</button>
      <button class="win-btn win-btn--secondary" id="adPremiumBtn" type="button">Premium 4,99€</button>
    </div>
  </div>
</div>
```

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: add cat album, streak calendar, premium banner, economy HUD"
```

---

### Task 5: Wire everything in main.js

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add imports**

Add to existing imports:

```js
import { CATS, checkCatUnlocks } from './cats.js';
import {
  getBalance, setBalance, earn, spend, canAfford,
  calcWinReward, isPremium, setPremium,
  shouldShowAd, markAdShown,
  canUndo, trackUndo, resetUndos, getUndosLeft,
  canUseHint, spendHint, canPlayEndless, trackEndlessPlay,
} from './economy.js';
import { REWARDS, COSTS } from './constants.js';
import {
  loadCollection, saveCollection,
  loadEconomy, saveEconomy,
  loadPremium, savePremium,
  loadStreak, saveStreak,
} from './storage.js';
```

- [ ] **Step 2: Initialize economy on bootstrap**

After the settings initialization in bootstrap, add:

```js
// Initialize economy
setBalance(loadEconomy());
setPremium(loadPremium());
updateBonesDisplay();
updatePremiumBanner();
```

Add helper functions:

```js
function updateBonesDisplay() {
  document.getElementById('bonesDisplay').textContent = '🦴 ' + getBalance();
}

function updatePremiumBanner() {
  document.getElementById('premiumBanner').classList.toggle('hidden', isPremium());
}
```

- [ ] **Step 3: Modify showWin to award fish bones and check cat unlocks**

In `showWin`, after saving stars and updating stats, add:

```js
  // Award fish bones
  const isBlitz  = isTimedLevel(LEVEL.current) && !G.isDailyChallenge;
  const reward = calcWinReward(stars, G.isDailyChallenge, isBlitz, ENDLESS.active, ENDLESS.active ? ENDLESS.round : 0);
  earn(reward);
  saveEconomy(getBalance());
  updateBonesDisplay();

  // Check cat unlocks
  const owned = new Set(loadCollection());
  const maxLvl = Math.max(LEVEL.current, ...Object.keys(loadProgress()).map(Number));
  const unlockState = {
    maxLevel: maxLvl,
    achievements: loadAchievements(),
    streak: loadStreak().current,
    endlessBest: loadEndlessBest(),
    isPremium: isPremium(),
  };
  const newCats = checkCatUnlocks(owned, unlockState);
  if (newCats.length) {
    newCats.forEach(id => owned.add(id));
    saveCollection([...owned]);
    // Show cat unlock toast
    for (const id of newCats) {
      const cat = CATS.find(c => c.id === id);
      if (cat) showCatUnlockToast(cat);
    }
  }

  // Update streak
  updateDailyStreak();
```

- [ ] **Step 4: Add cat unlock toast function**

```js
function showCatUnlockToast(cat) {
  const el = document.getElementById('achievementToast');
  el.textContent = cat.emoji + ' Neue Katze: ' + cat.name + '!';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}
```

- [ ] **Step 5: Add streak update function**

```js
function updateDailyStreak() {
  const streak = loadStreak();
  const today = new Date().toISOString().slice(0, 10);
  if (streak.lastDate === today) return; // already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (streak.lastDate === yesterday) {
    streak.current++;
  } else if (streak.lastDate !== today) {
    streak.current = 1;
  }
  streak.best = Math.max(streak.best, streak.current);
  streak.lastDate = today;
  streak.calendar[today] = true;
  saveStreak(streak);
}
```

- [ ] **Step 6: Modify hint to use economy**

In the hint function, replace the hint cost logic. Before calling `solveHint`, check affordability:

```js
  // Check cost (free tier)
  if (!spendHint()) {
    // Can't afford
    btn.textContent = '🦴?';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = '🐱'; btn.disabled = false; }, 1500);
    return;
  }
  saveEconomy(getBalance());
  updateBonesDisplay();
```

- [ ] **Step 7: Modify undo to use economy limits**

In the undo function, check free tier limits:

```js
function undo() {
  if (!canUndo(G.history.length) || ANIM.busy) return;
  trackUndo();
  // ... rest of existing undo logic
}
```

- [ ] **Step 8: Reset undos on new level**

In `generateLevel` and `loadEndlessRound`, add `resetUndos()` at the start.

- [ ] **Step 9: Add ad check after wins**

In `showWin`, before showing the win overlay, add:

```js
  // Show ad (free tier, every 3 levels)
  if (shouldShowAd()) {
    markAdShown();
    document.getElementById('adOverlay').classList.add('show');
    return; // win overlay shown after ad dismiss
  }
```

- [ ] **Step 10: Add cat album event listeners**

```js
// ── Cat Album ───────────────────────────────────────────
document.getElementById('albumBtn').addEventListener('click', () => {
  buildAlbumScreen();
  document.getElementById('albumScreen').classList.remove('hidden');
});
document.getElementById('albumBackBtn').addEventListener('click', () => {
  document.getElementById('albumScreen').classList.add('hidden');
});
document.getElementById('catDetailBack').addEventListener('click', () => {
  document.getElementById('catDetailOverlay').classList.add('hidden');
});

function buildAlbumScreen() {
  const owned = new Set(loadCollection());
  document.getElementById('albumCount').textContent = owned.size + ' / ' + CATS.length;
  const grid = document.getElementById('albumGrid');
  grid.innerHTML = '';
  for (const cat of CATS) {
    const cell = document.createElement('div');
    const isOwned = owned.has(cat.id);
    cell.className = 'album-cell' +
      (!isOwned ? ' locked' : '') +
      (!isOwned && cat.premium ? ' premium-locked' : '');
    cell.textContent = isOwned ? cat.emoji : '?';
    cell.title = isOwned ? cat.name : '???';
    if (isOwned) {
      cell.addEventListener('click', () => showCatDetail(cat));
    }
    grid.appendChild(cell);
  }
}

function showCatDetail(cat) {
  document.getElementById('catEmoji').textContent = cat.emoji;
  document.getElementById('catName').textContent = cat.name;
  document.getElementById('catBreed').textContent = cat.breed;
  document.getElementById('catFact').textContent = cat.fact;
  document.getElementById('catDetailOverlay').classList.remove('hidden');
}
```

- [ ] **Step 11: Add streak calendar event listeners**

```js
// ── Streak Calendar ─────────────────────────────────────
document.getElementById('streakBtn').addEventListener('click', () => {
  buildStreakScreen();
  document.getElementById('streakScreen').classList.remove('hidden');
});
document.getElementById('streakBackBtn').addEventListener('click', () => {
  document.getElementById('streakScreen').classList.add('hidden');
});

function buildStreakScreen() {
  const streak = loadStreak();
  document.getElementById('streakInfo').textContent = '🐾 ' + streak.current + ' Tage in Folge (Rekord: ' + streak.best + ')';

  const cal = document.getElementById('streakCalendar');
  cal.innerHTML = '';
  // Show current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.toISOString().slice(0, 10);

  // Empty cells for days before 1st (Mon-start: adjust Sunday)
  const startOffset = (firstDay + 6) % 7; // Mon=0
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'streak-day';
    cal.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell = document.createElement('div');
    const played = streak.calendar && streak.calendar[dateStr];
    cell.className = 'streak-day' +
      (played ? ' played' : '') +
      (dateStr === today ? ' today' : '');
    cell.textContent = d;
    cal.appendChild(cell);
  }
}
```

- [ ] **Step 12: Add premium and ad event listeners**

```js
// ── Premium ─────────────────────────────────────────────
document.getElementById('premiumBtn').addEventListener('click', () => {
  // Simulated purchase
  setPremium(true);
  savePremium(true);
  updatePremiumBanner();
  alert('Premium aktiviert! Danke für deinen Kauf! 🐾');
});

document.getElementById('adPremiumBtn').addEventListener('click', () => {
  document.getElementById('adOverlay').classList.remove('show');
  setPremium(true);
  savePremium(true);
  updatePremiumBanner();
  alert('Premium aktiviert! 🐾');
});

document.getElementById('adSkipBtn').addEventListener('click', () => {
  document.getElementById('adOverlay').classList.remove('show');
  // Show the win overlay that was deferred
  document.getElementById('overlay').classList.add('show');
});
```

- [ ] **Step 13: Commit**

```bash
git add js/main.js
git commit -m "feat: wire cat collection, economy, streak, premium into game loop"
```

---

### Task 6: Integration test

**Files:** None (testing only)

- [ ] **Step 1: Test fish bone display**

Verify HUD shows "🦴 0" at start. Solve a level. Verify bones increase.

- [ ] **Step 2: Test cat album**

Click "Katzen-Album". Verify grid shows 30 cells (mostly locked). Solve level 10 — verify "Mochi" cat unlocks with toast.

- [ ] **Step 3: Test streak calendar**

Click "Streak-Kalender". Verify current month calendar renders. Today should have border. Played days should be highlighted.

- [ ] **Step 4: Test premium banner**

Verify premium banner visible at bottom. Click "4,99€". Verify banner disappears. Reset via `localStorage.removeItem('catsort-premium')` and reload.

- [ ] **Step 5: Test hint economy**

Verify hint button works when balance >= 15. With 0 balance, hint should show "🦴?" and refuse.

- [ ] **Step 6: Test ad simulation**

Play as free tier. After 3 wins, verify ad overlay appears. Click "Weiter" to dismiss.

- [ ] **Step 7: Commit tag**

```bash
git add -A
git commit -m "feat: CatSort Plan 3 complete — collection, economy, premium"
git tag catsort-v0.3-collection-economy
```

---

## Verification Checklist

- [ ] 30 cats defined with correct unlock conditions
- [ ] Fish bone balance displays in HUD and persists
- [ ] Winning a level awards correct fish bones
- [ ] Cat album shows owned/locked cats in 5-column grid
- [ ] Tapping owned cat shows detail (name, breed, fact)
- [ ] Streak calendar shows current month with played days
- [ ] Streak counter tracks consecutive play days
- [ ] Premium banner shows for free users, hidden for premium
- [ ] Hint costs 15 fish bones (free tier) or free (premium)
- [ ] Undo limited to 3 per level (free) or unlimited (premium)
- [ ] Ad interstitial shows every 3 wins (free tier only)
- [ ] Cat unlock toast appears when new cat is earned
- [ ] All data persists via localStorage
