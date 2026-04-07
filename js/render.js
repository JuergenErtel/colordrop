'use strict';

import {
  CW, CH, TUBE_W, TUBE_H, TUBE_TOP, TUBE_BOT,
  BALL_R, BALL_D, BALL_GAP, BALL_PAD,
  FLOAT_Y_BASE, DUR_LIFT, DUR_ARC, DUR_BOUNCE,
  PALETTE, THEMES, TUTORIAL_SCRIPT,
} from './constants.js';

import { easeInOut, easeOutBack, easeOutBounce, bezier2, ANIM } from './animations.js';
import { spawnParticle, updateParticles, drawParticles, drawConfetti, triggerTubeExplosion, spawnConfetti, scheduleWinFireworks } from './particles.js';
import { drawBackground } from './background.js';
import { drawContainer } from './containers.js';
import { drawBall } from './balls.js';
import { playSound } from './audio.js';
import { checkWinState, isSolved } from './engine.js';
import { updateTimer, drawTimerBar } from './timer.js';

// ── Layout helpers (exported) ────────────────────────────────────────────

/** Centre X of tube i given tubeCount total tubes */
export function tubeCX(i, tubeCount) {
  const gap = (CW - tubeCount * TUBE_W) / (tubeCount + 1);
  return gap + i * (TUBE_W + gap) + TUBE_W / 2;
}

/** Centre Y of ball at stack index bi (0 = bottom) */
export function ballCY(bi) {
  return TUBE_BOT - BALL_PAD - BALL_R - bi * (BALL_D + BALL_GAP);
}

/** Oscillating float position */
export function floatY(ts) {
  return FLOAT_Y_BASE + Math.sin(ts * 0.0028) * 5;
}

/** Hit test: returns tube index at (lx, ly) or -1 */
export function tubeAt(lx, ly, tubeCount) {
  for (let i = 0; i < tubeCount; i++) {
    const tx = tubeCX(i, tubeCount) - TUBE_W / 2;
    if (lx >= tx && lx <= tx + TUBE_W &&
        ly >= TUBE_TOP && ly <= TUBE_TOP + TUBE_H) return i;
  }
  return -1;
}

// ── Private helpers ──────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Tutorial win check: each non-empty tube is uniform AND no colour in two tubes */
function checkWinTutorial(tubes) {
  const seen = new Set();
  for (const t of tubes) {
    if (t.length === 0) continue;
    if (!t.every(c => c === t[0])) return false;
    if (seen.has(t[0])) return false;
    seen.add(t[0]);
  }
  return true;
}

// ── Arc completion ───────────────────────────────────────────────────────

function updateArc(ts, G) {
  if (!ANIM.arc) return;
  const elapsed = ts - ANIM.arc.startTime;
  if (elapsed < ANIM.arc.duration) return;

  const { toTube } = ANIM.arc;
  const ballIdx    = G.tubes[toTube].length - 1;
  const tubeCount  = G.tubes.length;

  // Start bounce on the landed ball
  ANIM.bounceMap.set(`${toTube}-${ballIdx}`, {
    startTime: ts,
    duration:  DUR_BOUNCE,
    amplitude: 14,
  });

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

function updateBounces(ts) {
  for (const [key, b] of ANIM.bounceMap) {
    if (ts - b.startTime >= b.duration) ANIM.bounceMap.delete(key);
  }
}

// ── Drawing sub-routines ─────────────────────────────────────────────────

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
      drawBall(ctx, cx, ballCY(bi) + yOff, tube[bi], false, ts);
    }
  }
}

function drawArcBall(ctx, ts, dt, G) {
  const a       = ANIM.arc;
  const elapsed = ts - a.startTime;
  const rawT    = Math.min(elapsed / a.duration, 1);
  const easedT  = easeInOut(rawT);
  const pos     = bezier2(easedT, a.p0, a.p1, a.p2);

  // Trail particle
  if (rawT < 0.92 && Math.random() < 0.4 * dt * 60) {
    const col = PALETTE[a.color];
    if (col) {
      spawnParticle(
        pos.x + (Math.random() - 0.5) * 4,
        pos.y + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        -2 - Math.random() * 2,
        col.glow,
        3 + Math.random() * 2,
        300 + Math.random() * 100,
        0.08,
      );
    }
  }

  drawBall(ctx, pos.x, pos.y, a.color, true, ts);
}

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

  const pulse = liftT >= 1 ? 1 + Math.sin(ts * 0.005) * 0.04 : 1;

  ctx.save();
  ctx.translate(cx, bY);
  ctx.scale(pulse, pulse);
  drawBall(ctx, 0, 0, color, true, ts);
  ctx.restore();
}

function drawTutorialHighlight(ctx, G) {
  if (!G.tutorial || G.tutStep >= TUTORIAL_SCRIPT.length) return;
  const step  = TUTORIAL_SCRIPT[G.tutStep];
  const alpha = 0.45 + 0.35 * Math.sin(Date.now() / 280);
  const tubeCount = G.tubes.length;

  ctx.save();
  ctx.strokeStyle = `rgba(255,230,180,${alpha.toFixed(3)})`;
  ctx.lineWidth   = 3;

  for (let i = 0; i < tubeCount; i++) {
    let highlight = false;
    if (step.waitFor === 'select') {
      highlight = G.tubes[i].length > 0;
    } else if (step.waitFor === 'move') {
      highlight = true;
    } else if (step.waitFor === 'win') {
      highlight = true;
    }
    if (!highlight) continue;

    const cx  = tubeCX(i, tubeCount);
    const pad = 6;
    roundRect(ctx, cx - TUBE_W / 2 - pad, TUBE_TOP - pad, TUBE_W + pad * 2, TUBE_H + pad * 2, 14);
    ctx.stroke();
  }

  ctx.restore();
}

// ── Main render function ─────────────────────────────────────────────────

/**
 * renderFrame(ctx, ts, G)
 *   ctx — canvas 2d context
 *   ts  — rAF timestamp
 *   G   — game state object
 */
export function renderFrame(ctx, ts, G) {
  // Delta time (capped at 50ms)
  const dt = G.lastTime < 0
    ? 16
    : Math.min(ts - G.lastTime, 50);
  G.lastTime  = ts;
  G.frameTime = ts;

  // Update animation state
  updateArc(ts, G);
  updateBounces(ts);
  updateParticles(dt);

  // Theme fade
  if (G.themeFade < 1) {
    G.themeFade = Math.min(G.themeFade + (dt / 1000) / 0.5, 1);
    if (G.themeFade >= 1) G.themePrev = null;
  }

  // Draw
  const theme     = THEMES[G.theme] || THEMES.EASY;
  const prevTheme = G.themePrev ? (THEMES[G.themePrev] || theme) : theme;
  drawBackground(ctx, ts, theme, prevTheme, G.themeFade);

  drawTubes(ctx, ts, G);

  if (ANIM.arc)                        drawArcBall(ctx, ts, dt / 1000, G);
  if (G.selected !== -1 && !ANIM.busy) drawFloatingBall(ctx, ts, G);

  drawParticles(ctx);
  drawConfetti(ctx);
  drawTutorialHighlight(ctx, G);

  // Timer
  const timerBar = document.getElementById('timerBar');
  if (timerBar) {
    const timedOut = updateTimer(G.timer, G.frameTime, G.won);
    if (timedOut) {
      ANIM.busy = true;
      document.getElementById('timeoutOverlay').classList.add('show');
    }
    drawTimerBar(timerBar, G.timer, G.frameTime);
  }
}
