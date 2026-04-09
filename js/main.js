'use strict';

import {
  CW, CH, DUR_ARC,
  THEMES, TIER_DEFS,
  ACHIEVEMENTS, TUTORIAL_SCRIPT,
  REWARDS, COSTS,
} from './constants.js';

import { CATS, checkCatUnlocks } from './cats.js';
import { drawCatPortrait, drawMascotCat, CAT_PARAMS } from './cat-renderer.js';
import {
  getBalance, setBalance, earn, calcWinReward, isPremium, setPremium,
  shouldShowAd, markAdShown, tickAdLevel,
  canUndo, trackUndo, resetUndos,
  canUseHint, spendHint, canPlayEndless, trackEndlessPlay,
} from './economy.js';

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

import {
  levelConfig, parForLevel, isTimedLevel, timerDuration,
  calcStars, checkWinState, isSolved, canMove,
  generateTubes, generateTutorialTubes, solveHint,
  dailyLevelNum,
} from './engine.js';

import { ANIM, resetAnim } from './animations.js';
import { spawnFireflies } from './particles.js';
import { playSound } from './audio.js';
import { setSfxVolume, setSfxEnabled, isSfxEnabled, getSfxVolume } from './audio.js';
import { renderFrame, tubeCX, ballCY, floatY, tubeAt } from './render.js';
import { startMusic, stopMusic, setMusicVolume, setMusicEnabled, isMusicEnabled, getMusicVolume } from './music.js';
import { ENDLESS, endlessConfig, generateEndlessTubes, endlessParForRound, startEndless, endlessNextRound, endEndless } from './endless.js';
import { initSplash, hideSplash, showSplash, updateSplashMascot } from './splash.js';

// ══════════════════════════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════════════════════════

const LEVEL = { current: 1 };

const G = {
  tubes:          [],
  selected:       -1,
  selectedTime:   -1,
  moves:          0,
  history:        [],
  won:            false,
  tutorial:       false,
  tutStep:        0,
  theme:          'EASY',
  themePrev:      null,
  themeFade:      1,
  timer:          null,
  isDailyChallenge: false,
  flashTube:      -1,
  flashUntil:     0,
  hintFrom:       -1,
  hintTo:         -1,
  hintUntil:      0,
  hintCooldown:   false,
  frameTime:      0,
  lastTime:       -1,
  solvedTubes:    new Set(),
  onWin:          null,
  onHUDUpdate:    null,
  onTutAdvance:   null,
};

// ══════════════════════════════════════════════════════════════════════════
//  ECONOMY / COLLECTION HELPERS
// ══════════════════════════════════════════════════════════════════════════

function updateBonesDisplay() {
  document.getElementById('bonesDisplay').textContent = '\uD83E\uDDB4 ' + getBalance();
}

function updatePremiumBanner() {
  document.getElementById('premiumBanner').classList.toggle('hidden', isPremium());
}

function updateMascotParams() {
  const id = loadMascot();
  G.mascotParams = (id && id !== 'default') ? (CAT_PARAMS.find(p => p.id === id) || null) : null;
}

// ── Cat unlock celebration queue ──────────────────────────────────────────
const unlockQueue = [];
let unlockShowing = false;

function showCatUnlockToast(cat) {
  unlockQueue.push(cat);
  if (!unlockShowing) processUnlockQueue();
}

function processUnlockQueue() {
  if (unlockQueue.length === 0) { unlockShowing = false; return; }
  unlockShowing = true;
  const cat = unlockQueue.shift();
  showCatUnlockCelebration(cat);
}

function showCatUnlockCelebration(cat) {
  playSound('cat_unlock');

  // Draw cat portrait
  const canvas = document.getElementById('catUnlockPortrait');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 200, 200);
  const params = CAT_PARAMS.find(p => p.id === cat.id);
  if (params) drawCatPortrait(ctx, 100, 105, 72, params);

  // Set text
  document.getElementById('catUnlockName').textContent = cat.name;
  document.getElementById('catUnlockBreed').textContent = cat.breed;
  document.getElementById('catUnlockFact').textContent = cat.fact;

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

  // Show overlay
  const overlay = document.getElementById('catUnlockOverlay');
  overlay.classList.add('show');

  // Start confetti
  startConfetti();

  // Reset animations by re-inserting content children
  const content = overlay.querySelector('.cat-unlock-content');
  const clone = content.cloneNode(true);
  content.parentNode.replaceChild(clone, content);

  // Re-bind close button
  clone.querySelector('#catUnlockClose').addEventListener('click', () => {
    overlay.classList.remove('show');
    stopConfetti();
    setTimeout(processUnlockQueue, 400);
  });
}

// ── Confetti particle system ─────────────────────────────────────────────
let confettiParticles = [];
let confettiAnim = null;

function startConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  confettiParticles = [];
  const colors = ['#ffd700','#ff6b6b','#4ecdc4','#ff69b4','#7c5cff','#45b7d1','#f7dc6f','#ff8c42','#98d8c8','#c39bd3'];

  // Initial burst
  for (let i = 0; i < 120; i++) {
    confettiParticles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 100,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
      gravity: 0.12 + Math.random() * 0.08,
      alpha: 1,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Continuous rain from top
  let spawnTimer = 0;
  function animateConfetti(time) {
    confettiAnim = requestAnimationFrame(animateConfetti);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spawnTimer++;
    if (spawnTimer % 3 === 0 && confettiParticles.length < 300) {
      confettiParticles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 1.5,
        w: Math.random() * 7 + 3,
        h: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 8,
        gravity: 0.04 + Math.random() * 0.03,
        alpha: 1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.x += p.vx + Math.sin(time * 0.002 + p.phase) * 0.5;
      p.y += p.vy;
      p.rot += p.rotV;

      if (p.y > canvas.height + 20) {
        confettiParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }
  animateConfetti(performance.now());
}

function stopConfetti() {
  if (confettiAnim) { cancelAnimationFrame(confettiAnim); confettiAnim = null; }
  confettiParticles = [];
  const canvas = document.getElementById('confettiCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function updateDailyStreak() {
  const streak = loadStreak();
  const today = new Date().toISOString().slice(0, 10);
  if (streak.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  streak.current = (streak.lastDate === yesterday) ? streak.current + 1 : 1;
  streak.best = Math.max(streak.best, streak.current);
  streak.lastDate = today;
  if (!streak.calendar) streak.calendar = {};
  streak.calendar[today] = true;
  saveStreak(streak);
}

// ══════════════════════════════════════════════════════════════════════════
//  CANVAS SETUP
// ══════════════════════════════════════════════════════════════════════════

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = CW;
  canvas.height = CH;
  const maxPx   = Math.min(window.innerWidth - 32, 480);
  const scale   = maxPx / CW;
  canvas.style.width  = maxPx + 'px';
  canvas.style.height = Math.round(CH * scale) + 'px';
}

// ══════════════════════════════════════════════════════════════════════════
//  GAME LOGIC
// ══════════════════════════════════════════════════════════════════════════

function generateLevel(n) {
  resetUndos();
  LEVEL.current = n;
  const cfg     = levelConfig(n);

  // Theme: detect tier change, start fade
  const newTheme = cfg.tier;
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

  // Staggered tube drop-in animation
  const introNow = performance.now();
  ANIM.tubeIntro = G.tubes.map((_, i) => ({
    startTime: introNow + i * 50,
    duration: 400,
  }));

  // Spawn ambient fireflies
  const themeObj = THEMES[G.theme] || THEMES.EASY;
  const _ac = themeObj.accentColor || '#ffd700';
  const _hex = _ac.replace('#', '');
  const _r = parseInt(_hex.slice(0, 2), 16);
  const _g = parseInt(_hex.slice(2, 4), 16);
  const _b = parseInt(_hex.slice(4, 6), 16);
  spawnFireflies(`rgba(${_r},${_g},${_b},0.15)`);

  // Timer setup
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
  startMusic(levelConfig(n).tier);
}

function doMove(from, to) {
  // Undo snapshot (capped at 5)
  G.history.push(G.tubes.map(t => [...t]));
  if (G.history.length > 5) G.history.shift();

  const tubeCount = G.tubes.length;
  const startX = tubeCX(from, tubeCount);
  const startY = floatY(G.frameTime);

  // Mutate
  const color = G.tubes[from][G.tubes[from].length - 1];
  G.tubes[from].pop();
  G.tubes[to].push(color);
  G.moves++;
  G.hintFrom = G.hintTo = -1;
  G.hintUntil = 0;
  updateHUD();

  // Start arc animation
  const endX  = tubeCX(to, tubeCount);
  const endY  = ballCY(G.tubes[to].length - 1);
  const peakY = Math.min(startY, endY) - 90;

  ANIM.arc = {
    color,
    toTube:    to,
    p0: { x: startX, y: startY },
    p1: { x: (startX + endX) / 2, y: peakY },
    p2: { x: endX, y: endY },
    startTime: G.frameTime,
    duration:  DUR_ARC,
  };
  ANIM.busy = true;
}

function undo() {
  if (!canUndo(G.history.length) || ANIM.busy) return;
  trackUndo();
  playSound('undo');
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

function setHintIcon(emoji) {
  const btn = document.getElementById('hintBtn');
  const cost = document.getElementById('hintCost');
  // Preserve the cost badge — only replace the text node
  const textNode = btn.firstChild;
  if (textNode && textNode.nodeType === 3) {
    textNode.textContent = emoji;
  } else {
    btn.insertBefore(document.createTextNode(emoji), cost);
  }
}

function updateHintCostBadge() {
  const el = document.getElementById('hintCost');
  if (!el) return;
  if (isPremium()) {
    el.classList.add('hidden');
  } else {
    el.classList.remove('hidden');
    el.textContent = `\uD83E\uDDB4${COSTS.hint}`;
  }
}

function showHintAction() {
  if (ANIM.busy || G.won || G.tutorial) return;
  const btn = document.getElementById('hintBtn');

  // Economy check — hints cost fish bones (free for premium)
  playSound('hint');
  if (!spendHint()) {
    setHintIcon('\uD83E\uDDB4\u2753');  // 🦴❓
    btn.disabled = true;
    setTimeout(() => { setHintIcon('\uD83D\uDCA1'); btn.disabled = false; }, 1500);  // 💡
    return;
  }
  updateBonesDisplay();
  updateHintCostBadge();

  let move;
  try {
    move = solveHint(G.tubes);
  } catch (e) {
    console.error('solveHint failed:', e);
    return;
  }
  if (!move) {
    G.hintCooldown  = true;
    setHintIcon('\u274C');  // ❌
    btn.disabled    = true;
    setTimeout(() => {
      G.hintCooldown  = false;
      setHintIcon('\uD83D\uDCA1');  // 💡
      btn.disabled    = false;
    }, 1500);
    return;
  }
  updateHUD();
  G.hintFrom  = move.from;
  G.hintTo    = move.to;
  G.hintUntil = G.frameTime + 4000;
}

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

function handleInput(lx, ly) {
  if (G.won)     return;
  if (ANIM.busy) return;

  const idx = tubeAt(lx, ly, G.tubes.length);

  if (idx === -1) {
    G.selected     = -1;
    G.selectedTime = -1;
    return;
  }

  if (G.selected === -1) {
    if (G.tubes[idx].length > 0) {
      G.selected     = idx;
      G.selectedTime = G.frameTime;
      playSound('select');
      ANIM.ripple = { x: tubeCX(idx, G.tubes.length), y: ly, startTime: G.frameTime };
      // Tutorial: advance from 'select' step
      if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
          TUTORIAL_SCRIPT[G.tutStep].waitFor === 'select') {
        G.tutStep++;
        advanceTutStep();
      }
    }
  } else if (idx === G.selected) {
    G.selected     = -1;
    G.selectedTime = -1;
  } else if (canMove(G.tubes, G.selected, idx)) {
    const from     = G.selected;
    G.selected     = -1;
    G.selectedTime = -1;
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

// ══════════════════════════════════════════════════════════════════════════
//  CALLBACKS
// ══════════════════════════════════════════════════════════════════════════

G.onWin = function () {
  showWin();
};

G.onHUDUpdate = function () {
  updateHUD();
};

G.onTutAdvance = function () {
  advanceTutStep();
};

// ══════════════════════════════════════════════════════════════════════════
//  UI FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════

function updateHUD() {
  const mc = document.getElementById('moveCount');
  mc.textContent = G.moves;
  mc.classList.remove('move-good', 'move-ok', 'move-over');
  if (G.moves > 0) {
    const par = parForLevel(LEVEL.current);
    mc.classList.add(
      G.moves <= par       ? 'move-good' :
      G.moves <= par * 1.5 ? 'move-ok'   : 'move-over'
    );
  }
  if (ENDLESS.active) {
    document.getElementById('levelLabel').textContent = 'ENDLOS \u00B7 RUNDE ' + ENDLESS.round;
  } else {
    const timedMark = isTimedLevel(LEVEL.current) ? ' \u26A1' : '';
    document.getElementById('levelLabel').textContent =
      'LEVEL ' + LEVEL.current + ' \u00B7 ' + levelConfig(LEVEL.current).tier + timedMark;
  }
  document.getElementById('undoBtn').disabled    = G.tutorial || G.history.length === 0 || ANIM.busy || G.won;
  document.getElementById('hintBtn').disabled    = G.tutorial || ANIM.busy || G.won || G.hintCooldown;
  document.getElementById('resetBtn').disabled   = G.won;
  document.getElementById('menuBtnHud').disabled = ANIM.busy || G.won;
}

function showWin() {
  if (!G.won) return;
  G.won = false; // prevent re-entry
  const par   = parForLevel(LEVEL.current);
  const stars = calcStars(G.moves, par);
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

  // ── Economy: award fish bones ──
  const reward = calcWinReward(stars, G.isDailyChallenge, isBlitz, ENDLESS.active, ENDLESS.active ? ENDLESS.round : 0);
  earn(reward);
  updateBonesDisplay();
  tickAdLevel();

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
  updateDailyStreak();

  if (ENDLESS.active) {
    endlessNextRound();
    setTimeout(() => loadEndlessRound(), 800);
    return;
  }

  // ── Ad interstitial check ──
  if (shouldShowAd()) {
    markAdShown();
    document.getElementById('adOverlay').classList.add('show');
    // Store win data for after ad dismissal
    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('winStars').innerHTML =
    Array.from({ length: stars }, () => '<span class="win-star">\u2B50</span>').join('') +
    Array.from({ length: 3 - stars }, () => '<span class="win-star">\u2606</span>').join('');
    document.getElementById('winPar').textContent     = 'Par: ' + par;
    if (newAchs.length) showAchievementToast(newAchs);
    return;
  }

  document.getElementById('finalLevel').textContent = LEVEL.current;
  document.getElementById('finalMoves').textContent = G.moves;
  document.getElementById('winStars').innerHTML =
    Array.from({ length: stars }, () => '<span class="win-star">\u2B50</span>').join('') +
    Array.from({ length: 3 - stars }, () => '<span class="win-star">\u2606</span>').join('');
  document.getElementById('winPar').textContent     = 'Par: ' + par;
  document.getElementById('overlay').classList.add('show');

  if (newAchs.length) showAchievementToast(newAchs);
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

function updateStatsData(levelNum, stars, moves, isBlitz, blitzWon) {
  const s = loadStats();
  s.totalSolves = (s.totalSolves || 0) + 1;
  s.totalMoves  = (s.totalMoves || 0) + moves;
  if (stars === 3) {
    s.currentStreak = (s.currentStreak || 0) + 1;
    s.bestStreak    = Math.max(s.bestStreak || 0, s.currentStreak);
  } else {
    s.currentStreak = 0;
  }
  // Update last play date for streak tracking
  const d = new Date();
  s.lastPlayDate = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
  saveStats(s);
  return s;
}

function checkAchievements(achCtx) {
  const unlocked = new Set(loadAchievements());
  const newIds   = [];

  function check(id, condition) {
    if (!unlocked.has(id) && condition) { unlocked.add(id); newIds.push(id); }
  }

  const progress  = achCtx.progress;
  const wonCount  = Object.keys(progress).length;
  const totalStars = Object.values(progress).reduce((s, v) => s + v, 0);
  const threeStarCount = Object.values(progress).filter(v => v >= 3).length;

  check('first_solve',    true);
  check('cat_nap',        false); // TODO: streak tracking by date
  check('paw_print',      wonCount >= 20);
  check('pride_of_lions', wonCount >= 50);
  check('cat_king',       achCtx.levelNum >= 30);
  check('yarn_ball',      threeStarCount >= 10);
  check('tangled',        threeStarCount >= 20);
  check('daily_player',   achCtx.isDaily);
  check('sharpshooter',   threeStarCount >= 3);
  check('star_collector', totalStars >= 60);
  check('hot_streak',     (achCtx.stats.currentStreak || 0) >= 5);
  check('purrfect',       threeStarCount >= 10);
  check('lightning_paw',  achCtx.isBlitz && achCtx.stars >= 2); // simplified check

  // Legendary: all others unlocked
  const allOthers = ACHIEVEMENTS.filter(a => a.id !== 'legendary').every(a => unlocked.has(a.id));
  check('legendary', allOthers);

  if (newIds.length) saveAchievements([...unlocked]);
  return newIds;
}

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

// ── Blitz / Daily overlays ───────────────────────────────────────────────

function showBlitzOverlay(n) {
  const cfg = levelConfig(n);
  const sec = timerDuration(n) / 1000;
  document.getElementById('blitzLevel').textContent = 'LEVEL ' + n + ' \u00B7 ' + cfg.tier;
  document.getElementById('blitzTime').textContent  = 'Du hast ' + sec + ' Sekunden.';
  const theme = THEMES[cfg.tier] || THEMES.EASY;
  document.getElementById('blitzOverlay').style.setProperty('--blitz-color', theme.accentColor);
  document.getElementById('blitzOverlay').classList.add('show');
}

function showDailyOverlay() {
  const n         = dailyLevelNum();
  const cfg       = levelConfig(n);
  const dateLabel = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  document.getElementById('dailyDate').textContent       = dateLabel;
  document.getElementById('dailyLevelLabel').textContent = 'Level ' + n + ' \u00B7 ' + cfg.tier;
  const theme = THEMES[cfg.tier] || THEMES.EASY;
  document.getElementById('dailyOverlay').style.setProperty('--blitz-color', theme.accentColor);
  document.getElementById('dailyOverlay').classList.add('show');
}

function updateDailyBtn() {
  const daily = loadDaily();
  const d2    = new Date();
  const today = d2.getFullYear() + '-' +
    String(d2.getMonth() + 1).padStart(2, '0') + '-' +
    String(d2.getDate()).padStart(2, '0');
  const btn = document.getElementById('dailyChallengeBtn');
  if (daily && daily.date === today && daily.completed) {
    btn.textContent = '\uD83D\uDCC5 Heute: ' + '\u2B50'.repeat(daily.stars) + ' \u2014 morgen wieder';
    btn.disabled    = true;
  } else {
    btn.textContent = '\uD83D\uDCC5 Tages-Challenge';
    btn.disabled    = false;
  }
}

// ── Level Select ─────────────────────────────────────────────────────────

function buildLevelSelect() {
  const progress    = loadProgress();
  const maxUnlocked = maxUnlockedLevel();
  const showUpTo    = maxUnlocked + 3;
  const container   = document.getElementById('lsTiers');
  container.innerHTML = '';

  TIER_DEFS.forEach((tier, idx) => {
    const tierEnd = Math.min(tier.maxLevel, showUpTo);
    if (tier.minLevel > showUpTo) return;

    // Connector between tiers (not before first)
    if (idx > 0 && tier.minLevel <= showUpTo) {
      const conn = document.createElement('div');
      conn.className = 'ls-tier-connector';
      container.appendChild(conn);
    }

    const tierKey   = tier.name.toLowerCase();
    const tierLocked = tier.minLevel > maxUnlocked;

    const section = document.createElement('div');
    section.className = 'ls-tier ' + tierKey + (tierLocked ? ' tier-locked' : '');

    const label = document.createElement('div');
    label.className = 'ls-tier-label ' + tierKey;
    label.textContent = tier.name + (tierLocked ? ' \uD83D\uDD12' : '');
    section.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'ls-grid';

    for (let n = tier.minLevel; n <= tierEnd; n++) {
      const stars    = progress[n] || 0;
      const unlocked = n <= maxUnlocked;
      const btn      = document.createElement('button');

      btn.className = 'ls-card' +
        (stars > 0  ? ' solved'  : '') +
        (!unlocked  ? ' locked'  : '') +
        (n === LEVEL.current ? ' current' : '');
      btn.disabled      = !unlocked;
      btn.dataset.level = n;

      if (unlocked) {
        btn.innerHTML =
          '<span class="ls-num">' + (isTimedLevel(n) ? '\u26A1' : '') + n + (n === dailyLevelNum() ? ' \uD83D\uDCC5' : '') + '</span>' +
          (stars > 0 ? '<span class="ls-stars">' + '\u2B50'.repeat(stars) + '</span>' : '');
        btn.addEventListener('click', () => {
          closeLevelSelect();
          generateLevel(n);
        });
      } else {
        btn.innerHTML = '<span class="ls-num">\uD83D\uDD12</span>';
      }

      grid.appendChild(btn);
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}

function openLevelSelect() {
  if (ENDLESS.active) { endEndless(); stopMusic(); }
  G.isDailyChallenge = false;
  buildLevelSelect();
  updateDailyBtn();
  hideOverlay();
  if (G.timer) { G.timer = null; }
  ANIM.busy = false;
  document.getElementById('blitzOverlay').classList.remove('show');
  document.getElementById('dailyOverlay').classList.remove('show');
  document.getElementById('timeoutOverlay').classList.remove('show');
  // Show splash as atmospheric background behind level select
  showSplash(true);
  updateSplashMascot(loadMascot());
  document.getElementById('levelSelect').classList.add('show');
  requestAnimationFrame(() => {
    const first = document.querySelector('#lsTiers .ls-card:not(.solved):not(.locked)');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function closeLevelSelect() {
  document.getElementById('levelSelect').classList.remove('show');
  hideSplash();
}

// ── Stats Screen ─────────────────────────────────────────────────────────

function buildStatsScreen() {
  const s   = loadStats();
  const ach = loadAchievements();

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  const rows = [
    ['Gel\u00F6ste Level',    s.totalSolves || 0],
    ['Gesamtz\u00FCge',       (s.totalMoves || 0).toLocaleString('de-CH')],
    ['L\u00E4ngste \u2605\u2605\u2605-Serie', s.bestStreak || 0],
    ['Gesamtsterne',          s.totalStars || 0],
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

  document.getElementById('achCount').textContent =
    'ACHIEVEMENTS ' + ach.length + ' / ' + ACHIEVEMENTS.length;
  const achGrid = document.getElementById('achGrid');
  achGrid.innerHTML = '';
  for (const a of ACHIEVEMENTS) {
    const span       = document.createElement('span');
    const isUnlocked = ach.includes(a.id);
    span.className   = 'ach-icon' + (isUnlocked ? ' unlocked' : '');
    span.textContent = isUnlocked ? a.icon : '?';
    span.title       = isUnlocked ? a.title + ': ' + a.desc : '???';
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

// ── Tutorial ─────────────────────────────────────────────────────────────

function startTutorial() {
  G.tutorial     = true;
  G.tutStep      = 0;
  G.won          = false;
  G.moves        = 0;
  G.selected     = -1;
  G.selectedTime = -1;
  G.history      = [];
  G.flashTube    = -1;
  G.flashUntil   = 0;
  G.hintFrom     = -1;
  G.hintTo       = -1;
  G.hintUntil    = 0;
  G.hintCooldown = false;
  G.solvedTubes  = new Set();
  resetAnim();

  G.tubes = generateTutorialTubes();

  closeLevelSelect();
  document.getElementById('overlay').classList.remove('show');

  updateHUD();
  advanceTutStep();
}

function endTutorial() {
  markTutorialDone();
  G.tutorial = false;
  G.tutStep  = 0;
  document.getElementById('tutBubble').classList.add('hidden');
  generateLevel(1);
}

function advanceTutStep() {
  const bubble  = document.getElementById('tutBubble');
  const textEl  = document.getElementById('tutText');
  const skipBtn = document.getElementById('tutSkip');

  if (G.tutStep >= TUTORIAL_SCRIPT.length) {
    textEl.textContent  = 'Gel\u00F6st! Du kennst jetzt alle Regeln.';
    skipBtn.textContent = 'Los geht\'s \u2192';
    bubble.classList.remove('hidden');
    return;
  }

  const step = TUTORIAL_SCRIPT[G.tutStep];
  textEl.textContent  = step.heading + ': ' + step.body;
  skipBtn.textContent = step.waitFor === 'dismiss' ? 'Weiter \u2192' : '\u00DCberspringen';
  bubble.classList.remove('hidden');
}

// ── Coordinate conversion ────────────────────────────────────────────────

function toCanvas(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = CW / rect.width;
  const scaleY = CH / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════════════════

canvas.addEventListener('click', e => {
  const p = toCanvas(e);
  handleInput(p.x, p.y);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const p = toCanvas(e);
  handleInput(p.x, p.y);
}, { passive: false });

document.getElementById('menuBtnHud').addEventListener('click', () => { playSound('click'); openLevelSelect(); });
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('hintBtn').addEventListener('click', showHintAction);
document.getElementById('resetBtn').addEventListener('click', () =>
  G.tutorial ? startTutorial() : generateLevel(LEVEL.current)
);
document.getElementById('nextLevelBtn').addEventListener('click', () => {
  playSound('click');
  generateLevel(LEVEL.current + 1);
});
document.getElementById('menuBtn').addEventListener('click', () => { playSound('click'); openLevelSelect(); });
document.getElementById('tutSkip').addEventListener('click', () => {
  if (G.tutorial && G.tutStep < TUTORIAL_SCRIPT.length &&
      TUTORIAL_SCRIPT[G.tutStep].waitFor === 'dismiss') {
    G.tutStep++;
    advanceTutStep();
  } else {
    endTutorial();
  }
});
document.getElementById('tutBtn').addEventListener('click', () => {
  closeLevelSelect();
  startTutorial();
});

document.getElementById('dailyChallengeBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('levelSelect').classList.remove('show');
  showDailyOverlay();
});

document.getElementById('dailyStartBtn').addEventListener('click', () => {
  document.getElementById('dailyOverlay').classList.remove('show');
  hideSplash();
  G.isDailyChallenge = true;
  generateLevel(dailyLevelNum());
});

document.getElementById('statsBtn').addEventListener('click', () => { playSound('click'); showStatsScreen(); });
document.getElementById('statsBackBtn').addEventListener('click', hideStatsScreen);

document.getElementById('blitzStartBtn').addEventListener('click', () => {
  playSound('click');
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

// ── Settings ───────────────────────────────────────────────
document.getElementById('settingsBtn').addEventListener('click', () => {
  playSound('click');
  const s = loadSettings();
  document.getElementById('musicVolume').value = Math.round(s.musicVolume * 100);
  document.getElementById('sfxVolume').value = Math.round(s.sfxVolume * 100);
  document.getElementById('musicToggle').textContent = s.musicEnabled ? '🔊' : '🔇';
  document.getElementById('sfxToggle').textContent = s.sfxEnabled ? '🔊' : '🔇';
  document.getElementById('settingsScreen').classList.remove('hidden');
});
document.getElementById('settingsBackBtn').addEventListener('click', () => {
  document.getElementById('settingsScreen').classList.add('hidden');
});
document.getElementById('musicVolume').addEventListener('input', (e) => {
  const vol = parseInt(e.target.value) / 100;
  setMusicVolume(vol);
  const s = loadSettings(); s.musicVolume = vol; saveSettings(s);
});
document.getElementById('sfxVolume').addEventListener('input', (e) => {
  const vol = parseInt(e.target.value) / 100;
  setSfxVolume(vol);
  const s = loadSettings(); s.sfxVolume = vol; saveSettings(s);
});
document.getElementById('musicToggle').addEventListener('click', () => {
  const on = !isMusicEnabled();
  setMusicEnabled(on);
  document.getElementById('musicToggle').textContent = on ? '🔊' : '🔇';
  if (on && !ENDLESS.active) startMusic(levelConfig(LEVEL.current).tier);
  const s = loadSettings(); s.musicEnabled = on; saveSettings(s);
});
document.getElementById('sfxToggle').addEventListener('click', () => {
  const on = !isSfxEnabled();
  setSfxEnabled(on);
  document.getElementById('sfxToggle').textContent = on ? '🔊' : '🔇';
  const s = loadSettings(); s.sfxEnabled = on; saveSettings(s);
});

// ── Endless Mode ──────────────────────────────────────────
document.getElementById('endlessBtn').addEventListener('click', () => {
  playSound('click');
  closeLevelSelect();
  document.getElementById('endlessRound').textContent = 'RUNDE 1';
  document.getElementById('endlessBest').textContent = 'Rekord: ' + loadEndlessBest();
  document.getElementById('endlessOverlay').classList.add('show');
});
document.getElementById('endlessStartBtn').addEventListener('click', () => {
  playSound('click');
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

// ── Cat Album ────────────────────────────────────────────────
document.getElementById('albumBtn').addEventListener('click', () => {
  playSound('click');
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
      // Draw cat portrait on a small canvas
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
      updateMascotParams();
      updateSplashMascot(cat.id);
      mascotBtn.textContent = 'Dein Maskottchen ✓';
      mascotBtn.classList.add('active');
      mascotBtn.onclick = null;
      buildAlbumScreen(); // refresh gold border
    };
  }

  document.getElementById('catDetailOverlay').classList.remove('hidden');
}

// ── Streak Calendar ──────────────────────────────────────────
document.getElementById('streakBtn').addEventListener('click', () => {
  buildStreakScreen();
  document.getElementById('streakScreen').classList.remove('hidden');
});
document.getElementById('streakBackBtn').addEventListener('click', () => {
  document.getElementById('streakScreen').classList.add('hidden');
});

function buildStreakScreen() {
  const streak = loadStreak();
  document.getElementById('streakInfo').textContent = '\uD83D\uDC3E ' + streak.current + ' Tage in Folge (Rekord: ' + streak.best + ')';
  const cal = document.getElementById('streakCalendar');
  cal.innerHTML = '';
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.toISOString().slice(0, 10);
  const startOffset = (firstDay + 6) % 7; // Monday-first
  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement('div');
    empty.className = 'streak-day';
    cal.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const cell = document.createElement('div');
    cell.className = 'streak-day' + (streak.calendar && streak.calendar[dateStr] ? ' played' : '') + (dateStr === today ? ' today' : '');
    cell.textContent = d;
    cal.appendChild(cell);
  }
}

// ── Premium ──────────────────────────────────────────────────
document.getElementById('premiumBtn').addEventListener('click', () => {
  setPremium(true);
  updatePremiumBanner();
  alert('Premium aktiviert! Danke!');
});
document.getElementById('adPremiumBtn').addEventListener('click', () => {
  document.getElementById('adOverlay').classList.remove('show');
  setPremium(true);
  updatePremiumBanner();
  alert('Premium aktiviert!');
});
document.getElementById('adSkipBtn').addEventListener('click', () => {
  document.getElementById('adOverlay').classList.remove('show');
  document.getElementById('overlay').classList.add('show');
});

function loadEndlessRound() {
  resetUndos();
  const cfg = endlessConfig(ENDLESS.round);
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

  // Staggered tube drop-in animation
  const introNow = performance.now();
  ANIM.tubeIntro = G.tubes.map((_, i) => ({
    startTime: introNow + i * 50,
    duration: 400,
  }));

  LEVEL.current = ENDLESS.round;
  document.getElementById('timerBar').classList.remove('visible', 'pulse');
  document.getElementById('blitzOverlay').classList.remove('show');
  document.getElementById('timeoutOverlay').classList.remove('show');
  startMusic(cfg.tier);
  updateHUD();
  hideOverlay();
}

// ══════════════════════════════════════════════════════════════════════════
//  RENDER LOOP
// ══════════════════════════════════════════════════════════════════════════

function loop(ts) {
  renderFrame(ctx, ts, G);
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════════════════════════════════
//  BOOTSTRAP
// ══════════════════════════════════════════════════════════════════════════

migrateIfNeeded();
updateMascotParams();
updateSplashMascot(loadMascot());
const savedSettings = loadSettings();
setMusicVolume(savedSettings.musicVolume);
setSfxVolume(savedSettings.sfxVolume);
setMusicEnabled(savedSettings.musicEnabled);
setSfxEnabled(savedSettings.sfxEnabled);

// Economy & premium init
updateBonesDisplay();
updatePremiumBanner();

resizeCanvas();
requestAnimationFrame(loop);

// ── Hint badge & splash init ─────────────────────────────────────────────
updateHintCostBadge();
initSplash();

document.getElementById('splashPlayBtn').addEventListener('click', async () => {
  playSound('tap');
  await hideSplash();
  if (!isTutorialDone()) {
    startTutorial();
  } else {
    openLevelSelect();
  }
});
