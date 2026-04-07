# CatSort Plan 2: Audio + Content

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand CatSort to 300 story levels + endless mode, add background music system with procedural Lo-Fi ambient audio, and enhance sound effects with cat-themed variations.

**Architecture:** Extend existing TIER_DEFS and levelConfig for 300 levels. Add a new `js/endless.js` module for the endless game mode. Build a procedural music system in `js/music.js` using Web Audio API oscillators (no external audio files needed). Add a settings screen for volume controls.

**Tech Stack:** Vanilla JS (ES modules), Web Audio API (OscillatorNode, GainNode), existing ZzFX for SFX

---

## File Structure

```
js/
  constants.js      — Modify: expand TIER_DEFS to 300 levels
  engine.js          — Modify: update levelConfig for 300 levels, add endless helpers
  music.js           — Create: procedural Lo-Fi ambient music generator
  endless.js         — Create: endless mode state machine and scoring
  audio.js           — Modify: add volume control, cat sound variations
  main.js            — Modify: wire endless mode, music, settings screen
  storage.js         — Modify: add settings + endless highscore persistence
index.html           — Modify: add settings screen, endless mode UI
```

---

### Task 1: Expand to 300 story levels

**Files:**
- Modify: `js/constants.js`
- Modify: `js/engine.js`

- [ ] **Step 1: Update TIER_DEFS in constants.js**

Replace the TIER_DEFS array:

```js
export const TIER_DEFS = [
  { name: 'EASY',   minLevel:  1, maxLevel:  50 },
  { name: 'MEDIUM', minLevel: 51, maxLevel: 120 },
  { name: 'HARD',   minLevel: 121, maxLevel: 200 },
  { name: 'EXPERT', minLevel: 201, maxLevel: 260 },
  { name: 'MASTER', minLevel: 261, maxLevel: 300 },
];
```

- [ ] **Step 2: Update levelConfig in engine.js**

Replace the `levelConfig` function to handle the expanded range properly:

```js
export function levelConfig(n) {
  const tier    = tierForLevel(n);
  const diff    = tierDifficulty(n);
  // Colors: EASY=2, MEDIUM=3, HARD=4, EXPERT=5, MASTER=6
  const numColors = Math.min(2 + diff, COLOR_KEYS.length);
  const colors    = COLOR_KEYS.slice(0, numColors);
  // Empty tubes: 2 for EASY/MEDIUM, 1 for HARD+
  const empty = diff <= 1 ? 2 : 1;
  return { tier, diff, colors, tubes: colors.length + empty, empty };
}
```

- [ ] **Step 3: Update parForLevel in engine.js**

Replace to scale properly across 300 levels:

```js
export function parForLevel(n) {
  const { colors } = levelConfig(n);
  const numColors  = colors.length;
  // Intra-tier difficulty: 0 at tier start, 1 at tier end
  const tierDef = TIER_DEFS[tierDifficulty(n)];
  const span    = tierDef.maxLevel - tierDef.minLevel || 1;
  const progress = (n - tierDef.minLevel) / span;
  // Par: generous (colors×6) → strict (colors×5) within each tier
  return Math.round(numColors * (6 - progress));
}
```

- [ ] **Step 4: Update isTimedLevel for 300 levels**

Replace to keep blitz every 10th level instead of every 5th:

```js
export function isTimedLevel(n) {
  return n >= 10 && n % 10 === 0;
}
```

- [ ] **Step 5: Update timerDuration for wider range**

```js
export function timerDuration(n) {
  const tierMs = { EASY: 120, MEDIUM: 105, HARD: 90, EXPERT: 75, MASTER: 60 };
  const tier = tierForLevel(n);
  return (tierMs[tier] || 90) * 1000;
}
```

- [ ] **Step 6: Update dailyLevelNum range to 1-200**

```js
export function dailyLevelNum() {
  const epoch = new Date('2025-01-01').getTime();
  const now   = Date.now();
  const day   = Math.floor((now - epoch) / 86400000);
  return (day % 200) + 1;
}
```

- [ ] **Step 7: Verify — open in browser, check level select shows more levels**

After solving level 1, level select should show levels up to ~4. The EASY tier label should still appear. Navigate to level select and confirm no JS errors.

- [ ] **Step 8: Commit**

```bash
git add js/constants.js js/engine.js
git commit -m "feat: expand to 300 story levels across 5 tiers"
```

---

### Task 2: Add settings persistence

**Files:**
- Modify: `js/storage.js`

- [ ] **Step 1: Add settings and endless highscore to storage.js**

Add these functions after the existing exports:

```js
/* ── Settings ─────────────────────────────────────────────── */

const DEFAULT_SETTINGS = { musicVolume: 0.3, sfxVolume: 0.7, musicEnabled: true, sfxEnabled: true };

export function loadSettings() {
  try {
    return Object.assign({ ...DEFAULT_SETTINGS }, JSON.parse(localStorage.getItem(`${PREFIX}-settings`) || '{}'));
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(obj) {
  localStorage.setItem(`${PREFIX}-settings`, JSON.stringify(obj));
}

/* ── Endless mode ─────────────────────────────────────────── */

export function loadEndlessBest() {
  try { return JSON.parse(localStorage.getItem(`${PREFIX}-endless`) || '0'); }
  catch { return 0; }
}

export function saveEndlessBest(score) {
  const current = loadEndlessBest();
  if (score > current) {
    localStorage.setItem(`${PREFIX}-endless`, JSON.stringify(score));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/storage.js
git commit -m "feat: add settings and endless highscore persistence"
```

---

### Task 3: Create procedural music system

**Files:**
- Create: `js/music.js`

- [ ] **Step 1: Create `js/music.js`**

Procedural Lo-Fi ambient music using Web Audio API oscillators — no external audio files. Each tier has a different mood (chord progression, tempo, timbre).

```js
// js/music.js
'use strict';

/**
 * Procedural Lo-Fi ambient music generator.
 * Uses Web Audio API oscillators to create gentle, looping café music.
 * No external audio files needed.
 */

let ctx = null;
let masterGain = null;
let currentTier = null;
let playing = false;
let loopTimer = null;
let _volume = 0.3;
let _enabled = true;

/* ── Tier chord progressions (MIDI note numbers) ─────────── */
const CHORDS = {
  EASY:   [[60,64,67], [65,69,72], [67,71,74], [60,64,67]],       // C-F-G-C (happy)
  MEDIUM: [[62,65,69], [60,64,67], [65,69,72], [62,65,69]],       // Dm-C-F-Dm (relaxed)
  HARD:   [[64,67,71], [62,65,69], [60,64,67], [64,67,71]],       // Em-Dm-C-Em (focused)
  EXPERT: [[60,63,67], [65,68,72], [62,65,68], [60,63,67]],       // Cm-Fm-Ddim-Cm (tense)
  MASTER: [[60,64,67,71],[65,69,72],[67,71,74,77],[60,64,67,71]], // Cmaj7-F-G7-Cmaj7 (epic)
};

const TEMPO = { EASY: 72, MEDIUM: 66, HARD: 60, EXPERT: 54, MASTER: 48 };

/* ── MIDI note → frequency ────────────────────────────────── */
function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/* ── Initialize audio context (lazy) ──────────────────────── */
function ensureCtx() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  } catch { /* no audio */ }
  return ctx;
}

/* ── Play a single soft pad chord ─────────────────────────── */
function playChord(notes, duration, startTime) {
  if (!ctx) return;
  const chordGain = ctx.createGain();
  chordGain.gain.setValueAtTime(0, startTime);
  chordGain.gain.linearRampToValueAtTime(0.08, startTime + 0.3);
  chordGain.gain.setValueAtTime(0.08, startTime + duration - 0.5);
  chordGain.gain.linearRampToValueAtTime(0, startTime + duration);
  chordGain.connect(masterGain);

  for (const note of notes) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = midiToFreq(note);
    // Slight detune for warmth
    osc.detune.value = (Math.random() - 0.5) * 8;
    osc.connect(chordGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Add a quiet sub-octave for warmth
  if (notes.length > 0) {
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = midiToFreq(notes[0] - 12);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, startTime);
    subGain.gain.linearRampToValueAtTime(0.03, startTime + 0.5);
    subGain.gain.setValueAtTime(0.03, startTime + duration - 0.8);
    subGain.gain.linearRampToValueAtTime(0, startTime + duration);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(startTime);
    subOsc.stop(startTime + duration);
  }
}

/* ── Schedule one loop of the chord progression ───────────── */
function scheduleLoop(tier) {
  if (!ctx || !playing) return;
  const chords   = CHORDS[tier] || CHORDS.EASY;
  const bpm      = TEMPO[tier] || 66;
  const beatSec  = 60 / bpm;
  const chordDur = beatSec * 4;  // 4 beats per chord
  const loopDur  = chordDur * chords.length;
  const now      = ctx.currentTime + 0.1;

  for (let i = 0; i < chords.length; i++) {
    playChord(chords[i], chordDur, now + i * chordDur);
  }

  // Schedule next loop
  loopTimer = setTimeout(() => {
    if (playing) scheduleLoop(tier);
  }, (loopDur - 0.5) * 1000);
}

/* ── Public API ───────────────────────────────────────────── */

export function startMusic(tier) {
  if (!_enabled) return;
  ensureCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  // If already playing this tier, don't restart
  if (playing && currentTier === tier) return;

  stopMusic();
  currentTier = tier;
  playing = true;
  scheduleLoop(tier);
}

export function stopMusic() {
  playing = false;
  currentTier = null;
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
}

export function setMusicVolume(vol) {
  _volume = Math.max(0, Math.min(1, vol));
  if (masterGain) {
    masterGain.gain.setTargetAtTime(_volume, ctx.currentTime, 0.1);
  }
}

export function getMusicVolume() { return _volume; }

export function setMusicEnabled(enabled) {
  _enabled = enabled;
  if (!enabled) stopMusic();
}

export function isMusicEnabled() { return _enabled; }
```

- [ ] **Step 2: Commit**

```bash
git add js/music.js
git commit -m "feat: add procedural Lo-Fi ambient music generator"
```

---

### Task 4: Add volume control to sound effects

**Files:**
- Modify: `js/audio.js`

- [ ] **Step 1: Add volume control API to audio.js**

Add these variables and functions at the top of the file (after the `audioCtx` function):

```js
let _sfxVolume = 0.7;
let _sfxEnabled = true;

export function setSfxVolume(vol) { _sfxVolume = Math.max(0, Math.min(1, vol)); }
export function getSfxVolume() { return _sfxVolume; }
export function setSfxEnabled(enabled) { _sfxEnabled = enabled; }
export function isSfxEnabled() { return _sfxEnabled; }
```

- [ ] **Step 2: Gate playSound with volume and enabled flag**

At the start of the `playSound` function, add:

```js
export function playSound(name) {
  if (!_sfxEnabled) return;
  try {
    // ... existing switch cases, but multiply all volume values by _sfxVolume
```

Update each zzfx call's first parameter (volume) to multiply by `_sfxVolume`. For example:
- `zzfx(0.3 * _sfxVolume, ...)` instead of `zzfx(0.3, ...)`
- Apply to all 6 sound cases (select, pop, invalid, solved, tick, win)

For win, update the playArpeggio call similarly:
```js
case 'win':
  notes.forEach(([freq, delay]) => {
    setTimeout(() => zzfx(0.4 * _sfxVolume, 0.01, freq, 0.01, 0.08, 0.25, 0, 1, 0), delay);
  });
  break;
```

(Inline the playArpeggio since it's only used once and needs the volume parameter.)

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat: add SFX volume control and enable/disable toggle"
```

---

### Task 5: Create endless mode module

**Files:**
- Create: `js/endless.js`

- [ ] **Step 1: Create `js/endless.js`**

```js
// js/endless.js
'use strict';

import { COLOR_KEYS, TIER_DEFS } from './constants.js';
import { mulberry32, canMove, checkWinState } from './engine.js';
import { loadEndlessBest, saveEndlessBest } from './storage.js';

/* ── Endless Mode State ───────────────────────────────────── */

export const ENDLESS = {
  active:    false,
  round:     0,         // current round (1-based)
  bestRound: 0,         // session best
  allTimeBest: 0,       // localStorage best
};

/**
 * Generate tubes for an endless round.
 * Difficulty increases every 5 rounds, capping at MASTER level.
 */
export function endlessConfig(round) {
  // Start at MEDIUM difficulty, increase every 5 rounds
  const diffIndex = Math.min(1 + Math.floor((round - 1) / 5), 4);
  const numColors = Math.min(2 + diffIndex, COLOR_KEYS.length);
  const colors    = COLOR_KEYS.slice(0, numColors);
  const empty     = diffIndex <= 1 ? 2 : 1;
  const tier      = TIER_DEFS[diffIndex].name;
  return { tier, colors, tubes: colors.length + empty, empty };
}

export function generateEndlessTubes(round) {
  const { colors, empty } = endlessConfig(round);
  const capacity = 4;
  const rng      = mulberry32(round * 7654321 + Date.now() % 10000);

  const pool = [];
  for (const c of colors) {
    for (let i = 0; i < capacity; i++) pool.push(c);
  }

  // Shuffle multiple rounds for harder scramble
  const rounds = 2 + Math.floor(round / 3);
  for (let r = 0; r < rounds; r++) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  const result = [];
  for (let t = 0; t < colors.length; t++) {
    result.push(pool.slice(t * capacity, (t + 1) * capacity));
  }
  for (let e = 0; e < empty; e++) result.push([]);
  return result;
}

export function endlessParForRound(round) {
  const { colors } = endlessConfig(round);
  return Math.round(colors.length * 5.5);
}

export function startEndless() {
  ENDLESS.active    = true;
  ENDLESS.round     = 1;
  ENDLESS.bestRound = 0;
  ENDLESS.allTimeBest = loadEndlessBest();
}

export function endlessNextRound() {
  ENDLESS.round++;
  ENDLESS.bestRound = Math.max(ENDLESS.bestRound, ENDLESS.round);
}

export function endEndless() {
  saveEndlessBest(ENDLESS.bestRound);
  ENDLESS.allTimeBest = Math.max(ENDLESS.allTimeBest, ENDLESS.bestRound);
  ENDLESS.active = false;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/endless.js
git commit -m "feat: add endless mode module with progressive difficulty"
```

---

### Task 6: Add settings screen and endless mode UI to HTML

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add settings screen HTML**

Add after the stats screen `</div>` (after the `achievementToast` div):

```html
<!-- Settings Screen -->
<div id="settingsScreen" class="screen-overlay hidden">
  <div class="stats-card">
    <h2 class="stats-title">EINSTELLUNGEN</h2>
    <div class="settings-grid">
      <label class="settings-label">Musik</label>
      <div class="settings-control">
        <input type="range" id="musicVolume" min="0" max="100" value="30" class="settings-slider">
        <button id="musicToggle" class="settings-toggle">🔊</button>
      </div>
      <label class="settings-label">Effekte</label>
      <div class="settings-control">
        <input type="range" id="sfxVolume" min="0" max="100" value="70" class="settings-slider">
        <button id="sfxToggle" class="settings-toggle">🔊</button>
      </div>
    </div>
    <button class="win-btn" id="settingsBackBtn" type="button">← Zurück</button>
  </div>
</div>

<!-- Endless Mode Overlay -->
<div id="endlessOverlay" class="blitz-overlay">
  <div class="blitz-inner">
    <h2 class="blitz-title">♾️ ENDLOS-MODUS</h2>
    <p class="blitz-level" id="endlessRound">RUNDE 1</p>
    <p class="blitz-time" id="endlessBest">Rekord: 0</p>
    <button id="endlessStartBtn" class="blitz-btn" type="button">LOS!</button>
  </div>
</div>

<!-- Endless Game Over -->
<div id="endlessGameOverOverlay" class="overlay">
  <div class="win-card">
    <div class="win-icon">😿</div>
    <h2 class="win-title">GAME OVER</h2>
    <p class="win-sub">Runde <b id="endlessFinalRound">0</b></p>
    <p class="win-par" id="endlessBestDisplay">Rekord: 0</p>
    <div class="win-actions">
      <button class="win-btn" id="endlessRetryBtn" type="button">Nochmal</button>
      <button class="win-btn win-btn--secondary" id="endlessMenuBtn" type="button">Menü</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add settings button to level select**

In the `.ls-actions` div, add after the stats button:

```html
<button id="settingsBtn" class="ls-action-btn ls-action-btn--secondary" type="button">⚙️ Einstellungen</button>
```

- [ ] **Step 3: Add endless mode button to level select**

In the `.ls-actions` div, add after the daily challenge button:

```html
<button id="endlessBtn" class="ls-action-btn" type="button">♾️ Endlos-Modus</button>
```

- [ ] **Step 4: Add settings CSS**

Add to the `<style>` section:

```css
.settings-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: .6rem 1rem;
  align-items: center;
  margin-bottom: 1.4rem;
  text-align: left;
}
.settings-label {
  color: rgba(255,255,255,.7);
  font-size: .85rem;
}
.settings-control {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.settings-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255,255,255,.2);
  border-radius: 2px;
  outline: none;
}
.settings-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--gold);
  cursor: pointer;
}
.settings-toggle {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 2px;
}
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add settings screen, endless mode UI, and endless game over overlay"
```

---

### Task 7: Wire everything together in main.js

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add imports**

Add these imports to the top of main.js:

```js
import { startMusic, stopMusic, setMusicVolume, setMusicEnabled, isMusicEnabled, getMusicVolume } from './music.js';
import { setSfxVolume, setSfxEnabled, isSfxEnabled, getSfxVolume } from './audio.js';
import { loadSettings, saveSettings, loadEndlessBest, saveEndlessBest } from './storage.js';
import {
  ENDLESS, endlessConfig, generateEndlessTubes, endlessParForRound,
  startEndless, endlessNextRound, endEndless,
} from './endless.js';
```

- [ ] **Step 2: Initialize settings on bootstrap**

Add after `migrateIfNeeded()` in the bootstrap section:

```js
// Apply saved settings
const savedSettings = loadSettings();
setMusicVolume(savedSettings.musicVolume);
setSfxVolume(savedSettings.sfxVolume);
setMusicEnabled(savedSettings.musicEnabled);
setSfxEnabled(savedSettings.sfxEnabled);
```

- [ ] **Step 3: Start music when entering a level**

In the `generateLevel` function, after `updateHUD()`, add:

```js
// Start tier-appropriate music
const tierName = levelConfig(n).tier;
startMusic(tierName);
```

- [ ] **Step 4: Add settings screen event listeners**

Add before the render loop section:

```js
// ── Settings ────────────────────────────────────────────────
document.getElementById('settingsBtn').addEventListener('click', () => {
  const settings = loadSettings();
  document.getElementById('musicVolume').value = Math.round(settings.musicVolume * 100);
  document.getElementById('sfxVolume').value = Math.round(settings.sfxVolume * 100);
  document.getElementById('musicToggle').textContent = settings.musicEnabled ? '🔊' : '🔇';
  document.getElementById('sfxToggle').textContent = settings.sfxEnabled ? '🔊' : '🔇';
  document.getElementById('settingsScreen').classList.remove('hidden');
});

document.getElementById('settingsBackBtn').addEventListener('click', () => {
  document.getElementById('settingsScreen').classList.add('hidden');
});

document.getElementById('musicVolume').addEventListener('input', (e) => {
  const vol = parseInt(e.target.value) / 100;
  setMusicVolume(vol);
  const settings = loadSettings();
  settings.musicVolume = vol;
  saveSettings(settings);
});

document.getElementById('sfxVolume').addEventListener('input', (e) => {
  const vol = parseInt(e.target.value) / 100;
  setSfxVolume(vol);
  const settings = loadSettings();
  settings.sfxVolume = vol;
  saveSettings(settings);
});

document.getElementById('musicToggle').addEventListener('click', () => {
  const enabled = !isMusicEnabled();
  setMusicEnabled(enabled);
  document.getElementById('musicToggle').textContent = enabled ? '🔊' : '🔇';
  if (enabled && !ENDLESS.active) {
    startMusic(levelConfig(LEVEL.current).tier);
  }
  const settings = loadSettings();
  settings.musicEnabled = enabled;
  saveSettings(settings);
});

document.getElementById('sfxToggle').addEventListener('click', () => {
  const enabled = !isSfxEnabled();
  setSfxEnabled(enabled);
  document.getElementById('sfxToggle').textContent = enabled ? '🔊' : '🔇';
  const settings = loadSettings();
  settings.sfxEnabled = enabled;
  saveSettings(settings);
});
```

- [ ] **Step 5: Add endless mode event listeners**

```js
// ── Endless Mode ────────────────────────────────────────────
document.getElementById('endlessBtn').addEventListener('click', () => {
  closeLevelSelect();
  document.getElementById('endlessRound').textContent = 'RUNDE 1';
  document.getElementById('endlessBest').textContent = 'Rekord: ' + loadEndlessBest();
  document.getElementById('endlessOverlay').classList.add('show');
});

document.getElementById('endlessStartBtn').addEventListener('click', () => {
  document.getElementById('endlessOverlay').classList.remove('show');
  startEndless();
  loadEndlessRound();
});

document.getElementById('endlessRetryBtn').addEventListener('click', () => {
  document.getElementById('endlessGameOverOverlay').classList.remove('show');
  startEndless();
  loadEndlessRound();
});

document.getElementById('endlessMenuBtn').addEventListener('click', () => {
  document.getElementById('endlessGameOverOverlay').classList.remove('show');
  openLevelSelect();
});
```

- [ ] **Step 6: Add loadEndlessRound function**

Add after the endless event listeners:

```js
function loadEndlessRound() {
  const cfg = endlessConfig(ENDLESS.round);

  // Theme transition
  const newTheme = THEMES[cfg.tier];
  if (G.theme !== newTheme) {
    G.themePrev = G.theme;
    G.theme     = newTheme;
    G.themeFade = G.themePrev ? 0 : 1;
  }

  G.tubes        = generateEndlessTubes(ENDLESS.round);
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
  G.timer        = null;
  G.isDailyChallenge = false;
  resetAnim();

  LEVEL.current = ENDLESS.round;
  document.getElementById('timerBar').classList.remove('visible', 'pulse');
  document.getElementById('blitzOverlay').classList.remove('show');
  document.getElementById('timeoutOverlay').classList.remove('show');

  startMusic(cfg.tier);
  updateHUD();
  hideOverlay();
}
```

- [ ] **Step 7: Modify showWin to handle endless mode**

In the existing `showWin` function, add endless mode handling. After the existing win logic (stars, save, achievements), add before the overlay display:

```js
  // Endless mode: go to next round instead of showing win overlay
  if (ENDLESS.active) {
    endlessNextRound();
    setTimeout(() => loadEndlessRound(), 800);
    return;
  }
```

- [ ] **Step 8: Add HUD label for endless mode**

In `updateHUD`, update the level label logic:

```js
  if (ENDLESS.active) {
    document.getElementById('levelLabel').textContent = 'ENDLOS · RUNDE ' + ENDLESS.round;
  } else {
    const timedMark = isTimedLevel(LEVEL.current) ? ' ⚡' : '';
    document.getElementById('levelLabel').textContent =
      'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier + timedMark;
  }
```

- [ ] **Step 9: Update menu button to handle endless mode exit**

In the `openLevelSelect` function, add at the start:

```js
  if (ENDLESS.active) {
    endEndless();
    stopMusic();
  }
```

- [ ] **Step 10: Commit**

```bash
git add js/main.js
git commit -m "feat: wire up music system, settings screen, and endless mode"
```

---

### Task 8: Integration test

**Files:** None (testing only)

- [ ] **Step 1: Test 300 levels**

Open browser, navigate to level select. Solve a few levels. Verify:
- Level numbers display correctly
- Tier labels change at correct boundaries (1-50 EASY, 51+ MEDIUM)
- Par values are reasonable
- Blitz levels appear every 10th level

- [ ] **Step 2: Test music system**

Start a level. Verify:
- Ambient music plays (soft sine pad chords)
- Music changes when tier changes
- Volume slider in settings works
- Mute toggle works
- Music stops when returning to level select menu

- [ ] **Step 3: Test settings persistence**

Change volume settings, reload page. Verify settings are restored.

- [ ] **Step 4: Test endless mode**

Click "Endlos-Modus" button. Verify:
- Overlay shows round number and best record
- Game starts at MEDIUM difficulty
- After winning a round, next round loads automatically
- Difficulty increases (more colors after round 5)
- HUD shows "ENDLOS · RUNDE X"
- Exiting via menu saves best record
- Re-entering shows updated best record

- [ ] **Step 5: Test SFX volume**

Change SFX volume slider. Verify sound effects get louder/quieter. Toggle mute.

- [ ] **Step 6: Commit tag**

```bash
git add -A
git commit -m "feat: CatSort Plan 2 complete — audio + content expansion"
git tag catsort-v0.2-audio-content
```

---

## Verification Checklist

- [ ] TIER_DEFS covers levels 1-300 in 5 tiers
- [ ] levelConfig returns correct colors/tubes/empty for all 5 tiers
- [ ] parForLevel scales within each tier from generous to strict
- [ ] Blitz levels every 10th level (from level 10)
- [ ] Daily challenge cycles through levels 1-200
- [ ] Procedural music plays with tier-specific chords
- [ ] Music volume and SFX volume controllable independently
- [ ] Settings persist across page reloads
- [ ] Endless mode generates progressive difficulty
- [ ] Endless best score persists
- [ ] No console errors
