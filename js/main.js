'use strict';

import {
  CW, CH, DUR_ARC,
  THEMES, TIER_DEFS,
  ACHIEVEMENTS, TUTORIAL_SCRIPT,
  REWARDS, COSTS,
} from './constants.js';

import { CATS, checkCatUnlocks } from './cats.js';
import { drawCatPortrait, drawMascotCat, CAT_PARAMS, triggerCatShake, triggerCatWinJump } from './cat-renderer.js';
import {
  getBalance, setBalance, earn, calcWinReward, isPremium, setPremium,
  shouldShowAd, markAdShown, tickAdLevel,
  canUndo, trackUndo, resetUndos,
  canUseHint, spendHint,
} from './economy.js';

import {
  loadProgress, saveStars, maxUnlockedLevel,
  loadDaily, saveDaily,
  loadStats, saveStats,
  loadAchievements, saveAchievements,
  isTutorialDone, markTutorialDone,
  hasSeenIntro, markIntroSeen,
  migrateIfNeeded,
  loadSettings, saveSettings,
  loadCollection, saveCollection,
  loadStreak, saveStreak,
  loadMascot, saveMascot,
  loadBackgrounds, saveBackgrounds,
} from './storage.js';

import {
  levelConfig, parForLevel, isTimedLevel, timerDuration,
  calcStars, checkWinState, isSolved, canMove,
  generateTubes, generateTutorialTubes, solveHint, findJokerTube,
  dailyLevelNum, generateDailyTubes, getIcePositions, isDogLevel,
  isMouseLevel, mouseConfig,
} from './engine.js';
import { DOG, startDog, endDog, updateDog } from './dog.js';
import { MOUSE, startMouse, endMouse, updateMouse, tapHole, mouseStars } from './mouse.js';
import { renderMouseGame, mouseHitTest } from './mouse-renderer.js';

import { getDailyModifier, getDailyCat, getDailyMissionText, getDailyGenerationOverride } from './daily.js';
import { TETRIS, isTetrisLevel, startTetris, tetrisNextBall, endTetris, canPlaceTetris, isTetrisWon, tetrisMoveTo, tetrisBallProgress } from './tetris.js';

import { ANIM, resetAnim } from './animations.js';
import { spawnFireflies, spawnConfetti, scheduleWinFireworks, triggerTubeExplosion } from './particles.js';
import { playSound } from './audio.js';
import { setSfxVolume, setSfxEnabled, isSfxEnabled, getSfxVolume } from './audio.js';
import { renderFrame, tubeCX, ballCY, floatY, tubeAt } from './render.js';
import { drawBall } from './balls.js';
import { startMusic, stopMusic, setMusicVolume, setMusicEnabled, isMusicEnabled, getMusicVolume } from './music.js';
import { initSplash, hideSplash, showSplash, updateSplashMascot } from './splash.js';
import { buildRoomPanel, buildWinRoomHint } from './room.js';
import { invalidateRoomDecorCache } from './room-decor.js';
import { checkMilestone, claimMilestone } from './milestones.js';
import { initSkins, getActiveSkin, setActiveSkin, ownsSkin, unlockSkin, SKIN_DEFS, BG_DEFS, ownsBg, unlockBg, getActiveBg, setActiveBg, setSkinPreviewOverride } from './skins.js';

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
  dailyModifier:    null,
  memoryRevealed:   true,
  memoryRevealEnd:  0,
  flashTube:      -1,
  flashUntil:     0,
  hintFrom:       -1,
  hintTo:         -1,
  hintUntil:      0,
  hintCooldown:   false,
  frameTime:      0,
  lastTime:       -1,
  solvedTubes:    new Set(),
  frozenBalls:    new Set(),
  jokerUsed:      true,
  onWin:          null,
  onHUDUpdate:    null,
  onTutAdvance:   null,
  background:     'cafe',
};

// ══════════════════════════════════════════════════════════════════════════
//  ECONOMY / COLLECTION HELPERS
// ══════════════════════════════════════════════════════════════════════════

const FISHBONE_ICON = '<i class="fishbone"></i>';

function updateBonesDisplay() {
  document.getElementById('bonesDisplay').innerHTML = FISHBONE_ICON + ' ' + getBalance();
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
let _pendingAchs = [];
let _pendingCats = [];

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

let _unlockAnimId = 0;

function showCatUnlockCelebration(cat) {
  playSound('cat_unlock');
  if (_unlockAnimId) { cancelAnimationFrame(_unlockAnimId); _unlockAnimId = 0; }

  const params = CAT_PARAMS.find(p => p.id === cat.id);

  // Show overlay
  const overlay = document.getElementById('catUnlockOverlay');
  overlay.classList.add('show');

  // Start confetti
  startConfetti();

  // Reset CSS animations by re-inserting content children
  const content = overlay.querySelector('.cat-unlock-content');
  const clone = content.cloneNode(true);
  content.parentNode.replaceChild(clone, content);

  // Set text on the cloned elements
  clone.querySelector('#catUnlockName').textContent = cat.name;
  clone.querySelector('#catUnlockBreed').textContent = cat.breed;
  clone.querySelector('#catUnlockFact').textContent = cat.fact;

  // Show mascot hint only on first-ever cat unlock
  const hintEl = clone.querySelector('#catUnlockHint');
  if (hintEl) {
    const collection = loadCollection();
    hintEl.textContent = collection.length <= 1
      ? 'Öffne das Katzen-Album um dein Maskottchen zu wählen!' : '';
  }

  // Animate mascot cat on the cloned canvas
  const canvas = clone.querySelector('#catUnlockPortrait');
  const ctx = canvas.getContext('2d');
  function animatePortrait(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (params) drawMascotCat(ctx, canvas.width / 2, canvas.height * 0.38, canvas.width * 0.42, ts, params, null);
    _unlockAnimId = requestAnimationFrame(animatePortrait);
  }
  _unlockAnimId = requestAnimationFrame(animatePortrait);

  // Re-bind close button
  clone.querySelector('#catUnlockClose').addEventListener('click', () => {
    overlay.classList.remove('show');
    stopConfetti();
    if (_unlockAnimId) { cancelAnimationFrame(_unlockAnimId); _unlockAnimId = 0; }
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
  G.isDailyChallenge = false;
  G.dailyModifier = null;
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
  G.frozenBalls  = new Set();
  G.jokerUsed    = findJokerTube(G.tubes) === -1; // false if joker present
  const icePositions = getIcePositions(n, G.tubes);
  for (const ti of icePositions) {
    G.frozenBalls.add(`${ti}-0`);
  }
  resetAnim();
  endDog();

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
  } else if (isDogLevel(n) && !G.isDailyChallenge) {
    const cfg = levelConfig(n);
    document.getElementById('dogLevel').textContent = n;
    document.getElementById('dogTier').textContent = cfg.tier;
    document.getElementById('dogOverlay').classList.add('show');
  } else if (isMouseLevel(n) && !G.isDailyChallenge) {
    // Mouse hunt: whack-a-mole mini-game — no ice in mini-games
    G.frozenBalls = new Set();
    G.tubes = [];
    const mcfg = mouseConfig(n);
    G.timer = { active: false, endTime: 0, duration: mcfg.timer * 1000, _lastTick: -1 };
    ANIM.busy = true;
    ANIM.tubeIntro = [];
    document.getElementById('timerBar').classList.remove('visible', 'pulse');
    document.getElementById('mouseGameOverOverlay').classList.remove('show');
    showMouseOverlay(n);
  } else if (isTetrisLevel(n) && !G.isDailyChallenge) {
    // Tetris round: replace normal puzzle with drop mode — no ice in rain mode
    G.timer = null;
    G.frozenBalls = new Set();
    const cfg = levelConfig(n);
    G.tubes = [];
    for (let i = 0; i < cfg.colors.length; i++) G.tubes.push([]);
    // No empty tubes in tetris — player fills them all
    ANIM.busy = true;
    ANIM.tubeIntro = G.tubes.map((_, i) => ({
      startTime: performance.now() + i * 50,
      duration: 400,
    }));
    document.getElementById('timerBar').classList.remove('visible', 'pulse');
    document.getElementById('tetrisGameOverOverlay').classList.remove('show');
    showTetrisOverlay(n);
  } else {
    G.timer = null;
    document.getElementById('timerBar').classList.remove('visible', 'pulse');
    document.getElementById('timeoutOverlay').classList.remove('show');
    document.getElementById('blitzOverlay').classList.remove('show');
  }

  // Feature intro overlays (shown once)
  if (n === 12 && !hasSeenIntro('mouse')) {
    ANIM.busy = true;
    document.getElementById('mouseIntroOverlay').classList.add('show');
  } else if (n === 21 && !hasSeenIntro('joker')) {
    ANIM.busy = true;
    document.getElementById('jokerIntroOverlay').classList.add('show');
  } else if (n === 31 && !hasSeenIntro('ice')) {
    ANIM.busy = true;
    document.getElementById('iceIntroOverlay').classList.add('show');
  }

  updateHUD();
  hideOverlay();
  startMusic(levelConfig(n).tier);
}

function doMove(from, to) {
  // Undo snapshot (capped at 5)
  G.history.push({ tubes: G.tubes.map(t => [...t]), frozen: new Set(G.frozenBalls), jokerUsed: G.jokerUsed });
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
  const peakY = Math.min(startY, endY) - 130;

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
  if (G.dailyModifier === 'noundo') return;
  if (!canUndo(G.history.length) || ANIM.busy) return;
  trackUndo();
  playSound('undo');
  const snapshot = G.history.pop();
  if (Array.isArray(snapshot)) {
    G.tubes = snapshot;
    G.frozenBalls = new Set();
  } else {
    G.tubes = snapshot.tubes;
    G.frozenBalls = snapshot.frozen;
  }
  G.jokerUsed    = snapshot.jokerUsed ?? true;
  G.selected     = -1;
  G.selectedTime = -1;
  G.moves        = Math.max(0, G.moves - 1);
  G.won          = false;
  G.hintFrom     = G.hintTo = -1;
  G.hintUntil    = 0;
  G.solvedTubes  = new Set();
  ANIM.tubeClear = new Map(); // cancel pending tube-clear animations
  for (let i = 0; i < G.tubes.length; i++) {
    if (isSolved(G.tubes[i])) G.solvedTubes.add(i);
  }
  updateHUD();
  hideOverlay();
}

function setHintIcon(content) {
  const btn = document.getElementById('hintBtn');
  const cost = document.getElementById('hintCost');
  // Remove all child nodes before the cost badge, then insert new content
  while (btn.firstChild && btn.firstChild !== cost) {
    btn.removeChild(btn.firstChild);
  }
  // Insert HTML content before cost badge
  const wrapper = document.createElement('span');
  wrapper.innerHTML = content;
  while (wrapper.firstChild) {
    btn.insertBefore(wrapper.firstChild, cost);
  }
}

function updateHintCostBadge() {
  const el = document.getElementById('hintCost');
  if (!el) return;
  if (isPremium()) {
    el.classList.add('hidden');
  } else {
    el.classList.remove('hidden');
    el.innerHTML = `${FISHBONE_ICON}${COSTS.hint}`;
  }
}

function showHintAction() {
  if (ANIM.busy || G.won || G.tutorial) return;
  const btn = document.getElementById('hintBtn');

  // Economy check — hints cost fish bones (free for premium)
  playSound('hint');
  if (!spendHint()) {
    setHintIcon(FISHBONE_ICON + '\u2753');  // fishbone + ❓
    btn.disabled = true;
    setTimeout(() => { setHintIcon('\uD83D\uDCA1'); btn.disabled = false; }, 1500);  // 💡
    return;
  }
  updateBonesDisplay();
  updateHintCostBadge();

  let move;
  try {
    move = solveHint(G.tubes, G.jokerUsed);
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
  triggerCatShake();
}

function handleInput(lx, ly) {
  // Mouse hunt mode: tap on holes
  if (MOUSE.active) {
    const hole = mouseHitTest(lx, ly, CW, CH);
    if (hole >= 0) {
      const result = tapHole(hole, performance.now());
      if (result && result.type === 'trap' && G.timer && G.timer.active) {
        // Apply time penalty
        G.timer.endTime -= result.penalty;
      }
    }
    return;
  }

  // Tetris mode: swipe handled separately (see touch/pointer events below)
  if (TETRIS.active && TETRIS.current) return;
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
  } else if (canMove(G.tubes, G.selected, idx) && !G.frozenBalls.has(`${G.selected}-${G.tubes[G.selected].length - 1}`)) {
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
  const mc    = document.getElementById('moveCount');
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

  mc.classList.remove('move-good', 'move-ok', 'move-over');
  mcNew.classList.remove('move-good', 'move-ok', 'move-over');
  if (G.moves > 0) {
    const par = parForLevel(LEVEL.current);
    const cls =
      G.moves <= par       ? 'move-good' :
      G.moves <= par * 1.5 ? 'move-ok'   : 'move-over';
    mc.classList.add(cls);
    mcNew.classList.add(cls);
  }
  if (TETRIS.active) {
    document.getElementById('levelLabel').textContent = '\uD83E\uDDF6 SORTIER-REGEN';
  } else if (MOUSE.active) {
    document.getElementById('levelLabel').textContent = '\uD83D\uDC2D M\u00c4USEJAGD';
  } else if (G.isDailyChallenge && G.dailyModifier) {
    const mod = getDailyModifier();
    document.getElementById('levelLabel').textContent = mod.icon + ' ' + mod.name.toUpperCase();
  } else {
    const timedMark = isTimedLevel(LEVEL.current) ? ' \u26A1' : '';
    document.getElementById('levelLabel').textContent =
      'LEVEL ' + LEVEL.current + ' \u00B7 ' + levelConfig(LEVEL.current).tier + timedMark;
  }
  document.getElementById('undoBtn').disabled    = TETRIS.active || G.tutorial || G.dailyModifier === 'noundo' || G.history.length === 0 || ANIM.busy || G.won;
  document.getElementById('hintBtn').disabled    = TETRIS.active || G.tutorial || ANIM.busy || G.won || G.hintCooldown;
  document.getElementById('resetBtn').disabled   = G.won;
  document.getElementById('menuBtnHud').disabled = ANIM.busy || G.won;
}

function showWin() {
  endDog();
  if (MOUSE.active) endMouse();
  triggerCatWinJump();
  if (!G.won) return;
  G.won = false; // prevent re-entry

  // Stop blitz timer so it doesn't keep ticking during the win overlay
  if (G.timer) {
    G.timer.active = false;
    document.getElementById('timerBar').classList.remove('visible', 'pulse');
  }
  const par = parForLevel(LEVEL.current);
  let stars;
  if (G.dailyModifier === 'minimalist') {
    if (G.moves <= par)          stars = 3;
    else if (G.moves <= par + 1) stars = 2;
    else if (G.moves <= par + 2) stars = 1;
    else                         stars = 1;
  } else {
    stars = calcStars(G.moves, par);
  }
  const isBlitz  = isTimedLevel(LEVEL.current) && !G.isDailyChallenge;
  const blitzWon = isBlitz && G.timer !== null;

  if (!G.isDailyChallenge) {
    saveStars(LEVEL.current, stars);
  }

  if (G.isDailyChallenge) {
    const dt = new Date();
    const today = dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getDate()).padStart(2, '0');
    saveDaily({ date: today, levelNum: LEVEL.current, completed: true, stars });
  }

  const stats    = updateStatsData(LEVEL.current, stars, G.moves, isBlitz, blitzWon);
  const progress = loadProgress();
  const actualLevel = G.isDailyChallenge ? maxUnlockedLevel() : LEVEL.current;
  const newAchs  = checkAchievements({
    levelNum: actualLevel, stars, stats, progress,
    isDaily: G.isDailyChallenge, isBlitz,
  });

  // Milestone check
  const milestone = checkMilestone(LEVEL.current);
  if (milestone) {
    const claimed = claimMilestone(milestone);
    updateBonesDisplay();
    setTimeout(() => {
      document.getElementById('milestoneLabel').textContent = claimed.label;
      document.getElementById('milestoneDesc').textContent = claimed.desc;
      document.getElementById('milestoneBones').textContent = '+' + claimed.bones + ' Fischgr\u00e4ten';
      document.getElementById('milestoneOverlay').classList.add('show');
      playSound('achievement');
    }, 2800);
  }

  // ── Economy: award fish bones ──
  const reward = calcWinReward(stars, G.isDailyChallenge, isBlitz);
  earn(reward);
  updateBonesDisplay();
  tickAdLevel();

  // ── Cat unlocks (store for after win overlay) ──
  const owned = new Set(loadCollection());
  const maxLvl = Math.max(actualLevel, ...Object.keys(progress).map(Number));
  const newCats = checkCatUnlocks(owned, {
    maxLevel: maxLvl,
    achievements: loadAchievements(),
    streak: loadStreak().current,
    endlessBest: 0,
    isPremium: isPremium(),
  });
  if (newCats.length) {
    newCats.forEach(id => owned.add(id));
    saveCollection([...owned]);
  }

  _pendingAchs = newAchs;
  _pendingCats = newCats;
  updateDailyStreak();

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
    buildWinAchProgress();
    buildWinRoomHint('winRoomHint');
    return;
  }

  document.getElementById('finalLevel').textContent = LEVEL.current;
  document.getElementById('finalMoves').textContent = G.moves;
  document.getElementById('winStars').innerHTML =
    Array.from({ length: stars }, () => '<span class="win-star">\u2B50</span>').join('') +
    Array.from({ length: 3 - stars }, () => '<span class="win-star">\u2606</span>').join('');
  document.getElementById('winPar').textContent     = 'Par: ' + par;
  buildWinAchProgress();
  buildWinRoomHint('winRoomHint');
  // Delay the overlay so the canvas celebration is visible first
  setTimeout(() => {
    // Dim canvas behind win overlay
    const dimStart = performance.now();
    function dimStep() {
      const elapsed = performance.now() - dimStart;
      ANIM.canvasDim = Math.min(elapsed / 500, 1);
      if (ANIM.canvasDim < 1) requestAnimationFrame(dimStep);
    }
    dimStep();
    document.getElementById('overlay').classList.add('show');
  }, 1800);
}

function hideOverlay() {
  document.getElementById('overlay').classList.remove('show');
  const undimStart = performance.now();
  function undimStep() {
    const elapsed = performance.now() - undimStart;
    ANIM.canvasDim = Math.max(1 - elapsed / 200, 0);
    if (ANIM.canvasDim > 0) requestAnimationFrame(undimStep);
  }
  undimStep();
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
  check('cat_nap',        loadStreak().current >= 7);
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
    cat_nap:        Math.min(loadStreak().current, 7),
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

// ── Next Goal Widget ────────────────────────────────────────────────────

function updateNextGoalWidget() {
  const widget = document.getElementById('nextGoalWidget');
  if (!widget) return;

  const all       = getAchievementProgress();
  const remaining = all.filter(a => !a.unlocked);
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

// ── Win Overlay Progress ────────────────────────────────────────────────

function buildWinAchProgress() {
  const all       = getAchievementProgress();
  const remaining = all.filter(a => !a.unlocked);
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
        }, 400);
        // Continue achievement queue after cat unlock
        _waitForCatUnlock(() => setTimeout(_nextAchOverlay, 300));
        return;
      }
    }
    setTimeout(_nextAchOverlay, 300);
  }

  overlay.addEventListener('click', dismiss);
}

function _waitForCatUnlock(onClosed) {
  const check = setInterval(() => {
    const catOverlay = document.getElementById('catUnlockOverlay');
    if (!catOverlay.classList.contains('show')) {
      clearInterval(check);
      onClosed();
    }
  }, 200);
}

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

function showMouseOverlay(n) {
  const cfg = levelConfig(n);
  const mcfg = mouseConfig(n);
  document.getElementById('mouseLevel').textContent = 'LEVEL ' + n + ' \u00B7 ' + cfg.tier;
  document.getElementById('mouseGoal').textContent = 'Fang ' + mcfg.target + ' M\u00e4use in ' + mcfg.timer + ' Sekunden!';
  const theme = THEMES[cfg.tier] || THEMES.EASY;
  document.getElementById('mouseOverlay').style.setProperty('--blitz-color', theme.accentColor);
  document.getElementById('mouseOverlay').classList.add('show');
}

function showTetrisOverlay(n) {
  const cfg = levelConfig(n);
  document.getElementById('tetrisLevel').textContent = 'LEVEL ' + n + ' \u00B7 ' + cfg.tier;
  const theme = THEMES[cfg.tier] || THEMES.EASY;
  document.getElementById('tetrisOverlay').style.setProperty('--blitz-color', theme.accentColor);
  document.getElementById('tetrisOverlay').classList.add('show');
}

function showDailyOverlay() {
  const mod = getDailyModifier();
  const owned = [...new Set(loadCollection())];
  const cat = getDailyCat(owned);
  const text = getDailyMissionText(mod.key, cat.name);

  const dateLabel = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  document.getElementById('dailyModBadge').textContent = mod.icon + ' ' + mod.name;
  document.getElementById('dailyMissionText').textContent = text;
  document.getElementById('dailyModDesc').textContent = mod.desc;
  document.getElementById('dailyDate').textContent = dateLabel;

  // Draw cat portrait on canvas
  const canvas = document.getElementById('dailyCatPortrait');
  const catCtx = canvas.getContext('2d');
  catCtx.clearRect(0, 0, 80, 80);
  const params = CAT_PARAMS.find(p => p.id === cat.id);
  if (params) {
    drawCatPortrait(catCtx, 40, 42, 30, params);
  }

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
          invalidateRoomDecorCache();
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
  G.isDailyChallenge = false;
  G.dailyModifier = null;
  G.memoryRevealed = true;
  G.memoryRevealEnd = 0;
  if (TETRIS.active) endTetris();
  endDog();
  stopMusic();
  // Play calm menu music after a short pause
  setTimeout(() => startMusic('MENU'), 300);
  buildLevelSelect();
  updateNextGoalWidget();
  buildRoomPanel('roomPanel');
  updateDailyBtn();
  updateSerieDisplay();
  hideOverlay();
  if (G.timer) { G.timer = null; }
  ANIM.busy = false;
  document.getElementById('blitzOverlay').classList.remove('show');
  document.getElementById('dailyOverlay').classList.remove('show');
  document.getElementById('timeoutOverlay').classList.remove('show');
  document.getElementById('dogOverlay').classList.remove('show');
  document.getElementById('jokerIntroOverlay').classList.remove('show');
  document.getElementById('iceIntroOverlay').classList.remove('show');
  document.getElementById('mouseOverlay').classList.remove('show');
  document.getElementById('mouseIntroOverlay').classList.remove('show');
  document.getElementById('mouseGameOverOverlay').classList.remove('show');
  if (MOUSE.active) endMouse();
  // Show splash as atmospheric background behind level select
  showSplash(true);
  updateSplashMascot(loadMascot());
  const nextLevel = maxUnlockedLevel();
  const playBtn = document.getElementById('playBtn');
  playBtn.textContent = nextLevel <= 1 ? '▶ Spiel starten' : '▶ Level ' + nextLevel;
  document.getElementById('levelSelect').classList.add('show');
  // Don't auto-scroll — let the player scroll manually
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
  G.frozenBalls  = new Set();
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
  invalidateRoomDecorCache();
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

// ── Tetris swipe handling ──────────────────────────────────────────────────
let tetrisSwipeStartX = 0;
let tetrisSwipeActive = false;
const SWIPE_THRESHOLD = 20; // min px to register as swipe

function tetrisSwipeStart(clientX) {
  if (TETRIS.active && TETRIS.current) {
    tetrisSwipeStartX = clientX;
    tetrisSwipeActive = true;
  }
}

function tetrisSwipeEnd(clientX) {
  if (!tetrisSwipeActive) return false;
  tetrisSwipeActive = false;
  if (!TETRIS.active || !TETRIS.current) return false;
  const dx = clientX - tetrisSwipeStartX;
  if (Math.abs(dx) < SWIPE_THRESHOLD) return true; // tap — do nothing in tetris
  const dir = dx > 0 ? 1 : -1;
  const next = TETRIS.column + dir;
  if (next >= 0 && next < TETRIS.numTubes) {
    playSound('select');
    tetrisMoveTo(next);
  }
  return true;
}

canvas.addEventListener('click', e => {
  if (TETRIS.active && TETRIS.current) return; // swipe handles tetris
  const p = toCanvas(e);
  handleInput(p.x, p.y);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (TETRIS.active && TETRIS.current) {
    tetrisSwipeStart(e.touches[0].clientX);
    return;
  }
  const p = toCanvas(e);
  handleInput(p.x, p.y);
}, { passive: false });

canvas.addEventListener('touchend', e => {
  if (TETRIS.active && TETRIS.current && tetrisSwipeActive) {
    const touch = e.changedTouches[0];
    tetrisSwipeEnd(touch.clientX);
    return;
  }
}, { passive: false });

// Mouse swipe fallback for desktop
canvas.addEventListener('mousedown', e => {
  if (TETRIS.active && TETRIS.current) {
    tetrisSwipeStart(e.clientX);
  }
});

canvas.addEventListener('mouseup', e => {
  if (tetrisSwipeActive) {
    tetrisSwipeEnd(e.clientX);
  }
});

// Keyboard controls for tetris mode (arrow keys / A-D)
document.addEventListener('keydown', e => {
  if (!TETRIS.active || !TETRIS.current) return;
  let dir = 0;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = -1;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 1;
  if (dir !== 0) {
    e.preventDefault();
    const next = TETRIS.column + dir;
    if (next >= 0 && next < TETRIS.numTubes) {
      playSound('select');
      tetrisMoveTo(next);
    }
  }
});

document.getElementById('milestoneClose').addEventListener('click', () => {
  document.getElementById('milestoneOverlay').classList.remove('show');
});

document.getElementById('menuBtnHud').addEventListener('click', () => { playSound('click'); openLevelSelect(); });
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('hintBtn').addEventListener('click', showHintAction);
document.getElementById('resetBtn').addEventListener('click', () =>
  G.tutorial ? startTutorial() : (generateLevel(LEVEL.current), invalidateRoomDecorCache())
);
document.getElementById('nextLevelBtn').addEventListener('click', () => {
  playSound('click');
  hideOverlay();
  G.isDailyChallenge = false;
  G.dailyModifier = null;
  processPendingUnlocks(() => { generateLevel(LEVEL.current + 1); invalidateRoomDecorCache(); });
});
document.getElementById('menuBtn').addEventListener('click', () => {
  playSound('click');
  hideOverlay();
  processPendingUnlocks(() => openLevelSelect());
});
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

document.getElementById('playBtn').addEventListener('click', () => {
  playSound('click');
  closeLevelSelect();
  generateLevel(maxUnlockedLevel());
  invalidateRoomDecorCache();
});

document.getElementById('dailyChallengeBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('levelSelect').classList.remove('show');
  showDailyOverlay();
});


document.getElementById('dailyStartBtn').addEventListener('click', () => {
  document.getElementById('dailyOverlay').classList.remove('show');
  hideSplash();

  const mod = getDailyModifier();
  G.isDailyChallenge = true;
  G.dailyModifier = mod.key;

  // Generate puzzle with modifier overrides
  const override = getDailyGenerationOverride(mod.key);
  const n = dailyLevelNum();

  resetUndos();
  LEVEL.current = n;

  // Theme based on actual difficulty
  const tier = override
    ? (mod.key === 'master' ? 'EXPERT' : 'HARD')
    : levelConfig(n).tier;
  if (G.theme !== tier) {
    G.themePrev = G.theme;
    G.theme     = tier;
    G.themeFade = G.themePrev ? 0 : 1;
  }

  G.tubes        = generateDailyTubes(override);
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
  G.frozenBalls  = new Set();
  G.jokerUsed    = findJokerTube(G.tubes) === -1;
  G.memoryRevealed = true;
  G.memoryRevealEnd = 0;
  resetAnim();

  // Staggered tube drop-in
  const introNow = performance.now();
  ANIM.tubeIntro = G.tubes.map((_, i) => ({
    startTime: introNow + i * 50,
    duration: 400,
  }));

  // Apply modifier-specific setup
  if (mod.key === 'blitz') {
    G.timer = { active: true, endTime: performance.now() + 60000, duration: 60000, _lastTick: -1 };
    document.getElementById('timerBar').classList.add('visible');
  } else {
    G.timer = null;
    document.getElementById('timerBar').classList.remove('visible', 'pulse');
  }

  if (mod.key === 'memory') {
    G.memoryRevealed = true;
    G.memoryRevealEnd = performance.now() + 5000;
  }

  document.getElementById('timeoutOverlay').classList.remove('show');
  document.getElementById('blitzOverlay').classList.remove('show');

  updateHUD();
  hideOverlay();
  startMusic(tier);
  invalidateRoomDecorCache();
});

document.getElementById('statsBtn').addEventListener('click', () => { playSound('click'); showStatsScreen(); });
document.getElementById('nextGoalWidget').addEventListener('click', () => { playSound('click'); showStatsScreen(); });
document.getElementById('statsBackBtn').addEventListener('click', hideStatsScreen);

document.getElementById('blitzStartBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('blitzOverlay').classList.remove('show');
  G.timer.active  = true;
  G.timer.endTime = performance.now() + G.timer.duration;
  ANIM.busy       = false;
  document.getElementById('timerBar').classList.add('visible');
});

document.getElementById('timeoutRetryBtn').addEventListener('click', () => {
  document.getElementById('timeoutOverlay').classList.remove('show');
  generateLevel(LEVEL.current);
  invalidateRoomDecorCache();
});

// ── Mouse hunt handlers ─────────────────────────────────
document.getElementById('mouseStartBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('mouseOverlay').classList.remove('show');
  startMouse(LEVEL.current);
  G.timer.active  = true;
  G.timer.endTime = performance.now() + G.timer.duration;
  ANIM.busy       = false;
  document.getElementById('timerBar').classList.add('visible');
});

document.getElementById('mouseRetryBtn').addEventListener('click', () => {
  document.getElementById('mouseGameOverOverlay').classList.remove('show');
  generateLevel(LEVEL.current);
  invalidateRoomDecorCache();
});

document.getElementById('mouseSkipBtn').addEventListener('click', () => {
  document.getElementById('mouseGameOverOverlay').classList.remove('show');
  endMouse();
  generateLevel(LEVEL.current + 1);
  invalidateRoomDecorCache();
});

document.getElementById('mouseIntroBtn').addEventListener('click', () => {
  playSound('click');
  markIntroSeen('mouse');
  document.getElementById('mouseIntroOverlay').classList.remove('show');
  ANIM.busy = false;
});

// ── Feature intro handlers ───────────────────────────────
document.getElementById('jokerIntroBtn').addEventListener('click', () => {
  playSound('click');
  markIntroSeen('joker');
  document.getElementById('jokerIntroOverlay').classList.remove('show');
  ANIM.busy = false;
});

document.getElementById('iceIntroBtn').addEventListener('click', () => {
  playSound('click');
  markIntroSeen('ice');
  document.getElementById('iceIntroOverlay').classList.remove('show');
  ANIM.busy = false;
});

// ── Dog handlers ─────────────────────────────────────────
document.getElementById('dogStartBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('dogOverlay').classList.remove('show');
  startDog();
});

// ── Tetris handlers ─────────────────────────────────────────
document.getElementById('tetrisStartBtn').addEventListener('click', () => {
  playSound('click');
  document.getElementById('tetrisOverlay').classList.remove('show');
  startTetris(LEVEL.current);
  // Safeguard: ensure G.tubes matches TETRIS.numTubes
  while (G.tubes.length < TETRIS.numTubes) G.tubes.push([]);
  if (G.tubes.length > TETRIS.numTubes) G.tubes.length = TETRIS.numTubes;
  TETRIS.dropStart = performance.now(); // reset so ball starts falling NOW
  ANIM.busy = false;
});
document.getElementById('tetrisRetryBtn').addEventListener('click', () => {
  document.getElementById('tetrisGameOverOverlay').classList.remove('show');
  endTetris();
  generateLevel(LEVEL.current);
  invalidateRoomDecorCache();
});
document.getElementById('tetrisSkipBtn').addEventListener('click', () => {
  document.getElementById('tetrisGameOverOverlay').classList.remove('show');
  endTetris();
  // Skip to next level
  const next = LEVEL.current + 1;
  generateLevel(next);
  invalidateRoomDecorCache();
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
// TODO: Remove reset button before production release
document.getElementById('resetAllBtn').addEventListener('click', () => {
  if (confirm('Wirklich ALLES zurücksetzen?\nFortschritt, Katzen, Achievements — alles weg!')) {
    localStorage.clear();
    location.reload();
  }
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
  if (on) startMusic(levelConfig(LEVEL.current).tier);
  const s = loadSettings(); s.musicEnabled = on; saveSettings(s);
});
document.getElementById('sfxToggle').addEventListener('click', () => {
  const on = !isSfxEnabled();
  setSfxEnabled(on);
  document.getElementById('sfxToggle').textContent = on ? '🔊' : '🔇';
  const s = loadSettings(); s.sfxEnabled = on; saveSettings(s);
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

// ── Shop ──────────────────────────────────────────────────────────────────

let _shopTab = 'skins';

function buildShopGrid() {
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = '';
  document.getElementById('shopBalance').innerHTML = FISHBONE_ICON + ' ' + getBalance();

  if (_shopTab === 'skins') {
    for (const [id, def] of Object.entries(SKIN_DEFS)) {
      grid.appendChild(buildShopItem('skin', id, def));
    }
  } else {
    for (const [id, def] of Object.entries(BG_DEFS)) {
      grid.appendChild(buildShopItem('bg', id, def));
    }
  }
}

function buildShopItem(type, id, def) {
  const owned = type === 'skin' ? ownsSkin(id) : ownsBg(id);
  const active = type === 'skin' ? getActiveSkin() === id : G.background === id;
  const isFree = def.cost === 0;

  // Skins: always buyable with fishbones (if affordable)
  // Backgrounds: only unlockable via milestones, never purchasable
  const canBuy = type === 'skin' && !owned && !isFree && getBalance() >= def.cost;
  const tooExpensive = type === 'skin' && !owned && !isFree && getBalance() < def.cost;
  const bgLocked = type === 'bg' && !owned && !isFree;

  const card = document.createElement('div');
  card.className = 'shop-item' + (active ? ' active' : '') + ((tooExpensive || bgLocked) ? ' locked' : '');

  // Preview
  const preview = document.createElement('div');
  preview.className = 'shop-item-preview';
  if (type === 'skin') {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 200;
    preview.appendChild(c);
    requestAnimationFrame(() => drawSkinPreview(c, id));
  } else {
    const c = document.createElement('canvas');
    c.width = 120; c.height = 80;
    preview.appendChild(c);
    requestAnimationFrame(() => drawBgPreview(c, id));
  }
  card.appendChild(preview);

  // Name
  const name = document.createElement('div');
  name.className = 'shop-item-name';
  name.textContent = def.name;
  card.appendChild(name);

  // Status
  const status = document.createElement('div');
  status.className = 'shop-item-status';
  if (active) {
    const btn = document.createElement('span');
    btn.className = 'shop-btn shop-btn--active';
    btn.textContent = '\u2713 Aktiv';
    status.appendChild(btn);
  } else if (owned || isFree) {
    const btn = document.createElement('button');
    btn.className = 'shop-btn shop-btn--select';
    btn.textContent = 'Ausw\u00e4hlen';
    btn.addEventListener('click', () => {
      if (type === 'skin') { setActiveSkin(id); }
      else { setActiveBg(id); G.background = id; invalidateRoomDecorCache(); }
      playSound('click');
      buildShopGrid();
    });
    status.appendChild(btn);
  } else if (canBuy) {
    const btn = document.createElement('button');
    btn.className = 'shop-btn shop-btn--buy';
    btn.innerHTML = FISHBONE_ICON + ' ' + def.cost;
    btn.addEventListener('click', () => {
      if (!confirm(def.name + ' f\u00fcr ' + def.cost + ' Fischgr\u00e4ten kaufen?')) return;
      if (getBalance() >= def.cost) {
        setBalance(getBalance() - def.cost);
        unlockSkin(id);
        setActiveSkin(id);
        playSound('cat_unlock');
        updateBonesDisplay();
        buildShopGrid();
      } else {
        playSound('invalid');
      }
    });
    status.appendChild(btn);
  } else if (tooExpensive) {
    // Skin too expensive — show price greyed out
    const btn = document.createElement('span');
    btn.className = 'shop-btn shop-btn--locked';
    btn.innerHTML = FISHBONE_ICON + ' ' + def.cost;
    status.appendChild(btn);
  } else if (bgLocked) {
    // Background locked — only via milestone
    const btn = document.createElement('span');
    btn.className = 'shop-btn shop-btn--locked';
    btn.textContent = '\uD83D\uDD12 Level ' + (def.milestone || '?') + ' erreichen';
    status.appendChild(btn);
  }
  card.appendChild(status);

  return card;
}

function drawSkinPreview(canvas, skinId) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = 68;

  // ── Per-skin color theme ──
  const themes = {
    default: {
      bg1: '#2d1a0e', bg2: '#0f0906',
      ballBright: '#F5A898', ballBase: '#E8897A', ballDark: '#C86B5C',
      glow: 'rgba(232,137,122,.5)', yarn: 'rgba(255,220,200,.2)',
    },
    glitter: {
      bg1: '#1e1030', bg2: '#0a0610',
      ballBright: '#E8C0F8', ballBase: '#C890E0', ballDark: '#9860B8',
      glow: 'rgba(200,150,255,.55)', yarn: 'rgba(255,220,255,.25)',
    },
    crystal: {
      bg1: '#0c1820', bg2: '#04080e',
      ballBright: '#B8E8F8', ballBase: '#80C8E8', ballDark: '#4898C0',
      glow: 'rgba(120,200,255,.5)', yarn: 'rgba(200,240,255,.2)',
    },
    gold: {
      bg1: '#2a1e06', bg2: '#100c02',
      ballBright: '#FFE880', ballBase: '#F0C840', ballDark: '#C89820',
      glow: 'rgba(255,200,0,.55)', yarn: 'rgba(255,240,150,.25)',
    },
  };
  const t = themes[skinId] || themes.default;

  // ── Background ──
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.8);
  bg.addColorStop(0, t.bg1);
  bg.addColorStop(1, t.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Large aura glow ──
  const aura = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.6);
  aura.addColorStop(0, t.glow);
  aura.addColorStop(0.6, t.glow.replace(/[\d.]+\)$/, '.15)'));
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // ── Ball base ──
  const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.05, cx, cy, R);
  grad.addColorStop(0, t.ballBright);
  grad.addColorStop(0.5, t.ballBase);
  grad.addColorStop(1, t.ballDark);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // ── Inner shadow for roundness ──
  const inner = ctx.createRadialGradient(cx, cy - R * 0.3, R * 0.4, cx, cy, R);
  inner.addColorStop(0, 'rgba(0,0,0,0)');
  inner.addColorStop(0.75, 'rgba(0,0,0,0)');
  inner.addColorStop(1, 'rgba(0,0,0,.18)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = inner;
  ctx.fill();

  // ── Yarn strand texture ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.97, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = t.yarn;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.15;
    const cpA = a + Math.PI / 2;
    const cpD = R * (0.4 + (i % 4) * 0.14);
    ctx.lineWidth = i % 3 === 0 ? 3 : 2;
    ctx.globalAlpha = i % 2 === 0 ? 0.7 : 0.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.quadraticCurveTo(cx + Math.cos(cpA) * cpD, cy + Math.sin(cpA) * cpD,
      cx + Math.cos(a + Math.PI) * R, cy + Math.sin(a + Math.PI) * R);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ── Skin-specific overlay ON the ball ──
  if (skinId === 'glitter') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
    ctx.clip();
    // Big sparkle stars on the ball
    const sparkles = [
      [-.35,-.4,4],[.4,-.25,3.5],[.15,.4,3],[-.3,.2,2.5],
      [.5,.1,3],[-.1,-.55,2.8],[.25,-.5,2],[-.45,.35,2.5],
    ];
    for (const [sx, sy, sz] of sparkles) {
      const px = cx + sx * R, py = cy + sy * R;
      // Star glow
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath();
      ctx.arc(px, py, sz * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // 4-point star
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.moveTo(px, py - sz * 2.2);
      ctx.lineTo(px + sz * 0.5, py);
      ctx.lineTo(px, py + sz * 2.2);
      ctx.lineTo(px - sz * 0.5, py);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px - sz * 2.2, py);
      ctx.lineTo(px, py + sz * 0.5);
      ctx.lineTo(px + sz * 2.2, py);
      ctx.lineTo(px, py - sz * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (skinId === 'crystal') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
    ctx.clip();
    // Facet lines — bright and visible
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 1.5;
    for (let f = 0; f < 8; f++) {
      const a1 = f * 0.78, a2 = a1 + 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
      ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R);
      ctx.closePath();
      ctx.stroke();
    }
    // Strong prismatic rainbow overlay
    const prism = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    prism.addColorStop(0, 'rgba(255,80,80,.18)');
    prism.addColorStop(0.25, 'rgba(80,255,80,.18)');
    prism.addColorStop(0.5, 'rgba(80,80,255,.18)');
    prism.addColorStop(0.75, 'rgba(255,255,80,.18)');
    prism.addColorStop(1, 'rgba(255,80,255,.18)');
    ctx.fillStyle = prism;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    // Glass reflection streak
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.5, cy - R * 0.6);
    ctx.quadraticCurveTo(cx - R * 0.1, cy - R * 0.3, cx + R * 0.3, cy - R * 0.5);
    ctx.stroke();
    ctx.restore();
  } else if (skinId === 'gold') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
    ctx.clip();
    // Bold gold thread lines
    ctx.strokeStyle = 'rgba(255,215,0,.6)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    for (let g = 0; g < 6; g++) {
      const gy = cy - R * 0.8 + g * R * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx - R, gy);
      ctx.quadraticCurveTo(cx, gy + 10, cx + R, gy);
      ctx.stroke();
    }
    // Metallic sheen
    const sheen = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    sheen.addColorStop(0, 'rgba(255,240,150,.0)');
    sheen.addColorStop(0.4, 'rgba(255,240,150,.15)');
    sheen.addColorStop(0.5, 'rgba(255,255,220,.25)');
    sheen.addColorStop(0.6, 'rgba(255,240,150,.15)');
    sheen.addColorStop(1, 'rgba(255,240,150,.0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Cat face (except crystal) ──
  if (skinId !== 'crystal') {
    const faceY = cy - R * 0.05;
    const eyeR = 4.5;
    // Eyes
    ctx.fillStyle = '#402818';
    ctx.beginPath();
    ctx.ellipse(cx - R * 0.22, faceY - R * 0.08, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + R * 0.22, faceY - R * 0.08, eyeR, eyeR * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye gleam
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(cx - R * 0.18, faceY - R * 0.14, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + R * 0.26, faceY - R * 0.14, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = skinId === 'gold' ? '#C08840' : '#D4756B';
    ctx.beginPath();
    ctx.moveTo(cx, faceY + R * 0.06);
    ctx.lineTo(cx - 4.5, faceY + R * 0.18);
    ctx.lineTo(cx + 4.5, faceY + R * 0.18);
    ctx.closePath();
    ctx.fill();
    // Mouth
    ctx.strokeStyle = skinId === 'gold' ? '#A07030' : '#B0605A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, faceY + R * 0.18);
    ctx.quadraticCurveTo(cx - 7, faceY + R * 0.32, cx - 11, faceY + R * 0.24);
    ctx.moveTo(cx, faceY + R * 0.18);
    ctx.quadraticCurveTo(cx + 7, faceY + R * 0.32, cx + 11, faceY + R * 0.24);
    ctx.stroke();
  }

  // ── Specular highlight — big and bright ──
  const spec = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, 0, cx - R * 0.3, cy - R * 0.35, R * 0.5);
  spec.addColorStop(0, 'rgba(255,255,255,.6)');
  spec.addColorStop(0.4, 'rgba(255,255,255,.2)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.arc(cx - R * 0.3, cy - R * 0.35, R * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Rim light ──
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1, -0.9, 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawBgPreview(canvas, bgId) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  if (bgId === 'cafe') {
    const wall = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    wall.addColorStop(0, '#6a4a35'); wall.addColorStop(1, '#8a6a55');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, w, h * 0.55);
    ctx.fillStyle = '#4a3020'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
  } else if (bgId === 'garden') {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    sky.addColorStop(0, '#87CEEB'); sky.addColorStop(1, '#B0E0D0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.5);
    ctx.fillStyle = '#5B8C3E'; ctx.fillRect(0, h * 0.5, w, h * 0.5);
    ctx.fillStyle = '#FF6B8A';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(15 + i * 25, h * 0.52, 3, 0, Math.PI * 2); ctx.fill(); }
  } else if (bgId === 'rooftop') {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    sky.addColorStop(0, '#1a1a3e'); sky.addColorStop(0.5, '#4a2c6a'); sky.addColorStop(1, '#e8a040');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.5);
    ctx.fillStyle = '#1a1a2e';
    for (let i = 0; i < 6; i++) ctx.fillRect(i * 22, h * 0.25 + (i % 3) * 8, 18, h * 0.25 - (i % 3) * 8);
    ctx.fillStyle = '#4a4040'; ctx.fillRect(0, h * 0.5, w, h * 0.5);
  } else if (bgId === 'winter') {
    ctx.fillStyle = '#5a3a25'; ctx.fillRect(0, 0, w, h * 0.55);
    ctx.fillStyle = '#8ab4d8'; ctx.fillRect(w * 0.6, h * 0.05, w * 0.3, h * 0.3);
    ctx.fillStyle = '#3a2515'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
  }
}

document.getElementById('shopBtn').addEventListener('click', () => {
  playSound('click');
  _shopTab = 'skins';
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'skins'));
  buildShopGrid();
  document.getElementById('shopScreen').classList.remove('hidden');
});

document.getElementById('shopBackBtn').addEventListener('click', () => {
  document.getElementById('shopScreen').classList.add('hidden');
});

document.querySelectorAll('.shop-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    _shopTab = tab.dataset.tab;
    document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t === tab));
    buildShopGrid();
    playSound('click');
  });
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

// ── Serie Display ────────────────────────────────────────────
function updateSerieDisplay() {
  const streak = loadStreak();
  const display = document.getElementById('serieDisplay');
  const el = document.getElementById('serieCount');
  if (!display || !el) return;
  if (streak.current > 0) {
    el.textContent = streak.current;
    display.style.display = '';
  } else {
    display.style.display = 'none';
  }
}

// ── Premium ──────────────────────────────────────────────────
document.getElementById('premiumBtn').addEventListener('click', () => {
  setPremium(true);
  updatePremiumBanner();
  alert('Premium aktiviert! Danke!');
});
document.getElementById('premiumDismiss').addEventListener('click', () => {
  document.getElementById('premiumBanner').classList.add('hidden');
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


// ══════════════════════════════════════════════════════════════════════════
//  RENDER LOOP
// ══════════════════════════════════════════════════════════════════════════

function loop(ts) {
  if (G.dailyModifier === 'memory' && G.memoryRevealed && G.memoryRevealEnd > 0 && ts >= G.memoryRevealEnd) {
    G.memoryRevealed = false;
  }

  // Tetris: check if falling ball has landed
  if (TETRIS.active && TETRIS.current && !TETRIS.landing) {
    const progress = tetrisBallProgress(ts);
    if (progress >= 1) {
      // Ball reached the tube — place it
      const col = TETRIS.column;
      const color = TETRIS.current;
      if (canPlaceTetris(G.tubes, col, color)) {
        G.tubes[col].push(color);
        TETRIS.placed++;
        TETRIS.landing = { tube: col, startTime: ts };
        playSound('drop');

        // Check win
        if (isTetrisWon(G.tubes, TETRIS.numTubes)) {
          G.won = true;
          TETRIS.landing = null;
          endTetris();

          // Win celebration effects
          ANIM.screenShake = { startTime: performance.now(), duration: 350, amplitude: 8 };
          const tubeCount = G.tubes.length;
          for (let ti = 0; ti < tubeCount; ti++) {
            setTimeout(() => triggerTubeExplosion(ti, G.tubes, (i) => tubeCX(i, tubeCount)), 200 + ti * 80);
          }
          setTimeout(() => { ANIM.goldFlash = { startTime: performance.now(), duration: 400 }; }, 400);
          setTimeout(() => playSound('win'), 500);
          setTimeout(() => spawnConfetti(), 600);
          setTimeout(() => spawnConfetti(), 1200);
          setTimeout(() => scheduleWinFireworks(), 900);
          setTimeout(() => showWin(), 1800);
        } else {
          // Next ball after brief pause
          setTimeout(() => {
            TETRIS.landing = null;
            tetrisNextBall();
          }, 350);
        }
      } else {
        // Wrong color — game over!
        playSound('invalid');
        triggerCatShake();
        TETRIS.current = null; // stop the loop immediately
        setTimeout(() => {
          document.getElementById('tetrisPlaced').textContent = TETRIS.placed;
          document.getElementById('tetrisTotal').textContent = TETRIS.total;
          document.getElementById('tetrisGameOverOverlay').classList.add('show');
        }, 500);
      }
    }
  }

  // Dog: update state machine
  if (DOG.active && !G.won) {
    const dogAction = updateDog(ts, G.tubes, G.solvedTubes, ANIM.busy);
    if (dogAction === 'warn' && ts - DOG.warning.startTime < 50) {
      playSound('dog_warn');
    }
    if (dogAction === 'attack') {
      playSound('dog_bark');
      const destTube = DOG.attacking.destTube;
      const ballIdx = G.tubes[destTube].length - 1;
      if (ballIdx >= 0) {
        ANIM.bounceMap.set(`${destTube}-${ballIdx}`, {
          startTime: ts, duration: 480, amplitude: 8,
        });
        ANIM.tubeWobble.set(destTube, {
          startTime: ts, duration: 400, amplitude: 2 * Math.PI / 180,
        });
      }
    }
  }

  // Mouse hunt: update spawns, check timer
  if (MOUSE.active) {
    updateMouse(ts);

    // Timer-driven timeout check
    if (G.timer && G.timer.active && ts >= G.timer.endTime) {
      G.timer.active = false;
      // Evaluate BEFORE ending (endMouse clears state)
      const stars = mouseStars();
      const caught = MOUSE.caught;
      const target = MOUSE.target;
      const bonus = MOUSE.bonusBones;
      endMouse();
      if (stars > 0) {
        // Target reached — win!
        G.won = true;
        saveStars(LEVEL.current, stars);
        const reward = calcWinReward(stars, false, false);
        earn(reward + bonus);
        updateBonesDisplay();
        playSound('win');
        setTimeout(() => showWin(), 800);
      } else {
        playSound('invalid');
        document.getElementById('mouseCaught').textContent = caught;
        document.getElementById('mouseTarget').textContent = target;
        document.getElementById('mouseGameOverOverlay').classList.add('show');
      }
    }

    // Check if target reached mid-game
    if (MOUSE.active && MOUSE.caught >= MOUSE.target) {
      // Keep playing for bonus stars until timer ends — but if ALL mice caught perfectly
      // we could end early. For now, let timer run for bonus opportunities.
    }
  }

  renderFrame(ctx, ts, G);
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════════════════════════════════
//  BOOTSTRAP
// ══════════════════════════════════════════════════════════════════════════

migrateIfNeeded();
initSkins();
G.background = loadBackgrounds().active;
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
