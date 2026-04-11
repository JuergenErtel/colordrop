'use strict';

import {
  CW, CH, TUBE_W, TUBE_H, TUBE_TOP, TUBE_BOT,
  BALL_R, BALL_D, BALL_GAP, BALL_PAD,
  FLOAT_Y_BASE, DUR_LIFT, DUR_ARC, DUR_BOUNCE,
  DUR_IMPACT, DUR_SETTLE, DUR_WOBBLE, DUR_JIGGLE,
  PALETTE, THEMES, TUTORIAL_SCRIPT,
} from './constants.js';

import { easeInOut, easeOutBack, easeOutBounce, easeOutQuart, easeOutElastic, bezier2, ANIM } from './animations.js';
import { spawnParticle, updateParticles, drawParticles, drawConfetti, triggerTubeExplosion, spawnConfetti, scheduleWinFireworks, spawnFireflies, clearFireflies, drawFireflies } from './particles.js';
import { drawBackground } from './background.js';
import { drawRoomDecor } from './room-decor.js';
import { drawContainer } from './containers.js';
import { drawBall, drawBallSymbol, drawBallHidden } from './balls.js';
import { COLOR_SYMBOLS } from './daily.js';
import { drawMascotCat } from './cat-renderer.js';
import { playSound } from './audio.js';
import { checkWinState, isSolved } from './engine.js';
import { updateTimer, drawTimerBar } from './timer.js';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const { toTube, color } = ANIM.arc;
  const ballIdx    = G.tubes[toTube].length - 1;
  const tubeCount  = G.tubes.length;
  const cx         = tubeCX(toTube, tubeCount);
  const cy         = ballCY(ballIdx);

  // Squash on impact: scaleY 0.7, scaleX 1.3 → spring back
  ANIM.jiggleMap.set(`${toTube}-${ballIdx}`, {
    startTime: ts,
    duration: DUR_IMPACT,
    squash: true,
  });

  // Bounce on landed ball
  ANIM.bounceMap.set(`${toTube}-${ballIdx}`, {
    startTime: ts,
    duration:  DUR_BOUNCE,
    amplitude: 10,
  });

  // Impact ring
  const col = PALETTE[color];
  if (col) {
    ANIM.impactRing = {
      x: cx, y: cy,
      startTime: ts,
      duration: 300,
      color: col.glow,
    };
  }

  // Tube wobble and neighbor jiggle (skip in reduced motion)
  if (!REDUCED_MOTION) {
    ANIM.tubeWobble.set(toTube, {
      startTime: ts,
      duration: DUR_WOBBLE,
      amplitude: 1.5 * Math.PI / 180,
    });

    for (let bi = 0; bi < ballIdx; bi++) {
      const key = `${toTube}-${bi}`;
      ANIM.jiggleMap.set(key, {
        startTime: ts + (ballIdx - bi) * 30,
        duration: DUR_JIGGLE,
      });
    }
  }

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

    // 0ms: Extra-strong impact on winning ball
    ANIM.bounceMap.set(`${toTube}-${ballIdx}`, {
      startTime: ts,
      duration: DUR_BOUNCE,
      amplitude: 20,
    });

    // 200ms: screen shake (strong)
    if (!REDUCED_MOTION) {
      setTimeout(() => {
        ANIM.screenShake = { startTime: performance.now(), duration: 350, amplitude: 8 };
      }, 200);
    }

    // 300ms: ALL tubes explode staggered
    for (let ti = 0; ti < tubeCount; ti++) {
      setTimeout(() => {
        triggerTubeExplosion(ti, G.tubes, (i) => tubeCX(i, tubeCount));
      }, 300 + ti * 80);
    }

    // 500ms: gold flash (long, bright)
    setTimeout(() => {
      ANIM.goldFlash = { startTime: performance.now(), duration: 400 };
    }, 500);

    // 600ms: win sound
    setTimeout(() => playSound('win'), 600);

    // 700ms: first confetti wave
    setTimeout(() => spawnConfetti(), 700);

    // 1000ms: second screen shake + fireworks
    if (!REDUCED_MOTION) {
      setTimeout(() => {
        ANIM.screenShake = { startTime: performance.now(), duration: 200, amplitude: 4 };
      }, 1000);
    }
    setTimeout(() => scheduleWinFireworks(), 1000);

    // 1400ms: second confetti wave
    setTimeout(() => spawnConfetti(), 1400);

    // 1800ms: third confetti wave + second gold flash
    setTimeout(() => {
      spawnConfetti();
      ANIM.goldFlash = { startTime: performance.now(), duration: 300 };
    }, 1800);

    // 600ms: trigger showWin (which internally delays overlay by 1800ms)
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

function updateWobbles(ts) {
  for (const [key, w] of ANIM.tubeWobble) {
    if (ts - w.startTime >= w.duration) ANIM.tubeWobble.delete(key);
  }
}

function updateJiggles(ts) {
  for (const [key, j] of ANIM.jiggleMap) {
    if (j.startTime <= ts && ts - j.startTime >= j.duration) ANIM.jiggleMap.delete(key);
  }
}

function updateImpactRing(ts) {
  if (ANIM.impactRing && ts - ANIM.impactRing.startTime >= ANIM.impactRing.duration) {
    ANIM.impactRing = null;
  }
}

// ── Board frame — visual containment for the puzzle area ─────────────────

const BOARD_PAD_X = 14;
const BOARD_PAD_TOP = 22;
const BOARD_PAD_BOT = 18;
const BOARD_R = 16;

function drawBoardFrame(ctx, ts, G) {
  const tubeCount = G.tubes.length;
  if (tubeCount === 0) return;

  // Compute board bounds from tube grid
  const firstCX = tubeCX(0, tubeCount);
  const lastCX  = tubeCX(tubeCount - 1, tubeCount);
  const bx = firstCX - TUBE_W / 2 - BOARD_PAD_X;
  const by = TUBE_TOP - BOARD_PAD_TOP;
  const bw = (lastCX + TUBE_W / 2 + BOARD_PAD_X) - bx;
  const bh = TUBE_H + BOARD_PAD_TOP + BOARD_PAD_BOT;

  // ── Board drop shadow (underneath, offset down) ──
  ctx.save();
  const shY = by + 6;
  const shGrad = ctx.createRadialGradient(bx + bw / 2, shY + bh / 2 + 8, bw * 0.15,
                                           bx + bw / 2, shY + bh / 2 + 8, bw * 0.6);
  shGrad.addColorStop(0, 'rgba(20,10,5,0.22)');
  shGrad.addColorStop(1, 'rgba(20,10,5,0)');
  ctx.fillStyle = shGrad;
  ctx.fillRect(bx - 20, shY, bw + 40, bh + 20);
  ctx.restore();

  // ── Board surface (rounded rect) ──
  ctx.save();
  roundRect(ctx, bx, by, bw, bh, BOARD_R);

  // Fill — semi-transparent warm surface
  const boardFill = ctx.createLinearGradient(bx, by, bx, by + bh);
  boardFill.addColorStop(0.0, 'rgba(255,240,215,0.07)');
  boardFill.addColorStop(0.3, 'rgba(255,235,200,0.05)');
  boardFill.addColorStop(1.0, 'rgba(200,160,100,0.04)');
  ctx.fillStyle = boardFill;
  ctx.fill();

  // Border — very subtle warm edge
  ctx.strokeStyle = 'rgba(200,160,100,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner top highlight (catches the spotlight)
  ctx.beginPath();
  roundRect(ctx, bx, by, bw, bh, BOARD_R);
  ctx.clip();
  const topHL = ctx.createLinearGradient(bx, by, bx, by + 16);
  topHL.addColorStop(0, 'rgba(255,245,225,0.08)');
  topHL.addColorStop(1, 'rgba(255,245,225,0)');
  ctx.fillStyle = topHL;
  ctx.fillRect(bx, by, bw, 16);

  ctx.restore();
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

    const tapFlash = ANIM.ripple && Math.abs(cx - ANIM.ripple.x) < TUBE_W &&
                     ts - ANIM.ripple.startTime < 50;
    const redFlash = ANIM.tubeShake.has(i) &&
                     ts - ANIM.tubeShake.get(i).startTime < 50;
    const state = { selected: sel, solved, flashing: flashing || redFlash, hintSrc, hintDst, tapFlash };

    // Tube intro animation
    let introOffsetY = 0;
    let introAlpha = 1;
    if (ANIM.tubeIntro && ANIM.tubeIntro[i]) {
      const intro = ANIM.tubeIntro[i];
      const ie = ts - intro.startTime;
      if (ie < 0) {
        introOffsetY = -TUBE_H - 50;
        introAlpha = 0;
      } else if (ie < intro.duration) {
        const t = ie / intro.duration;
        introOffsetY = (-TUBE_H - 50) * (1 - easeOutBounce(t));
        introAlpha = Math.min(1, t * 3);
      } else {
        ANIM.tubeIntro[i] = null;
      }
    }

    // Wobble rotation
    const wobble = ANIM.tubeWobble.get(i);
    let wobbleAngle = 0;
    if (wobble) {
      const wt = (ts - wobble.startTime) / wobble.duration;
      wobbleAngle = wobble.amplitude * Math.sin(wt * Math.PI * 3) * (1 - wt);
    }

    // Tube shake (invalid move)
    const shake = ANIM.tubeShake.get(i);
    let shakeX = 0;
    if (shake) {
      const st = (ts - shake.startTime) / shake.duration;
      if (st >= 1) {
        ANIM.tubeShake.delete(i);
      } else {
        shakeX = shake.amplitude * Math.sin(st * Math.PI * 6) * (1 - st);
      }
    }

    ctx.save();
    if (introAlpha < 1) ctx.globalAlpha = introAlpha;
    ctx.translate(cx + shakeX, TUBE_TOP + TUBE_H / 2 + introOffsetY);
    ctx.rotate(wobbleAngle);
    ctx.translate(-cx, -(TUBE_TOP + TUBE_H / 2));

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

      // Squash/jiggle deformation
      const jiggle = ANIM.jiggleMap.get(bounceKey);
      let jSx = 1, jSy = 1;
      if (jiggle && !REDUCED_MOTION) {
        const je = ts - jiggle.startTime;
        if (je >= 0) {
          const jt = Math.min(je / jiggle.duration, 1);
          if (jiggle.squash) {
            const squashT = easeOutElastic(jt);
            jSx = 1.45 - 0.45 * squashT;   // 1.45 → 1.0
            jSy = 0.55 + 0.45 * squashT;   // 0.55 → 1.0
          } else {
            const compress = 0.05 * (1 - easeOutElastic(jt));
            jSx = 1 + compress;
            jSy = 1 - compress;
          }
        }
      }

      // Idle breathing — gentle scale pulse on topmost ball only
      const isTop = bi === renderCount - 1;
      if (isTop && !sel && !solved && jSx === 1 && !bounce && !REDUCED_MOTION) {
        const breath = 1 + 0.018 * Math.sin(ts * 0.003 + i * 1.8);
        jSx = breath;
        jSy = 2 - breath;  // inverse: slightly squash when wide
      }

      const bx = cx;
      const by = ballCY(bi) + yOff;
      // Choose ball renderer based on daily modifier
      const _color = tube[bi];
      const _drawBall = (G.dailyModifier === 'symbols')
        ? (cx2, cy2) => drawBallSymbol(ctx, cx2, cy2, _color, COLOR_SYMBOLS[_color] || '?', false, ts)
        : (G.dailyModifier === 'memory' && G.memoryRevealed === false && !sel)
        ? (cx2, cy2) => drawBallHidden(ctx, cx2, cy2, false, ts)
        : (cx2, cy2) => drawBall(ctx, cx2, cy2, _color, false, ts);

      if (jSx !== 1) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(jSx, jSy);
        _drawBall(0, 0);
        ctx.restore();
      } else {
        _drawBall(bx, by);
      }
    }

    ctx.restore();
  }
}

function drawArcBall(ctx, ts, dt, G) {
  const a       = ANIM.arc;
  const elapsed = ts - a.startTime;
  const rawT    = Math.min(elapsed / a.duration, 1);
  const easedT  = easeOutQuart(rawT);
  const pos     = bezier2(easedT, a.p0, a.p1, a.p2);

  // Directional stretch (skip if reduced motion)
  let sx = 1, sy = 1;
  let angle = 0;
  if (!REDUCED_MOTION) {
    const epsilon = 0.01;
    const tA = Math.max(0, easedT - epsilon);
    const tB = Math.min(1, easedT + epsilon);
    const pA = bezier2(tA, a.p0, a.p1, a.p2);
    const pB = bezier2(tB, a.p0, a.p1, a.p2);
    angle = Math.atan2(pB.y - pA.y, pB.x - pA.x);
    // Stronger stretch in middle of arc, normalize at end
    const mid = 1 - Math.abs(rawT - 0.4) / 0.4;  // peaks at 40%
    const stretchAmount = Math.max(0, Math.min(1, mid)) * (rawT < 0.85 ? 1 : (1 - rawT) / 0.15);
    sx = 1 + 0.25 * stretchAmount;   // 25% elongation (was 12%)
    sy = 1 - 0.18 * stretchAmount;   // 18% compression (was 10%)
  }

  // Trail particles — bright, visible
  if (!REDUCED_MOTION && rawT < 0.95) {
    const col = PALETTE[a.color];
    if (col) {
      // Spawn 1-2 particles per frame
      const count = Math.random() < 0.5 ? 2 : 1;
      for (let pi = 0; pi < count; pi++) {
        spawnParticle(
          pos.x + (Math.random() - 0.5) * 6,
          pos.y + (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4,
          -2 - Math.random() * 3,
          col.bright,                         // bright color (was glow)
          5 + Math.random() * 4,              // bigger (was 4+3)
          500 + Math.random() * 200,          // longer life (was 400+100)
          0.06,
        );
      }
    }
  }

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle);
  ctx.scale(sx, sy);
  if (G.dailyModifier === 'symbols') {
    drawBallSymbol(ctx, 0, 0, a.color, COLOR_SYMBOLS[a.color] || '?', true, ts);
  } else if (G.dailyModifier === 'memory' && G.memoryRevealed === false) {
    drawBallHidden(ctx, 0, 0, true, ts);
  } else {
    drawBall(ctx, 0, 0, a.color, true, ts);
  }
  ctx.restore();
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

  // Stretch during lift, normalize at top (skip if reduced motion)
  let sx = 1, sy = 1;
  if (!REDUCED_MOTION) {
    const stretchT = liftT < 0.7 ? liftT / 0.7 : 1 - (liftT - 0.7) / 0.3;
    sx = 1 - stretchT * 0.12;  // scaleX: 1 → 0.88 → 1
    sy = 1 + stretchT * 0.15;  // scaleY: 1 → 1.15 → 1
  }

  const pulse = liftT >= 1 ? 1 + Math.sin(ts * 0.005) * 0.04 : 1;

  // Pulsing glow ring when floating
  if (liftT >= 1 && !REDUCED_MOTION) {
    const ringPulse = 0.5 + 0.5 * Math.sin(ts * 0.004);
    const ringR = BALL_R + 6 + ringPulse * 4;  // 20→24px radius
    ctx.save();
    ctx.strokeStyle = `rgba(255,200,100,${0.15 + ringPulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, bY, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Shadow ellipse on tube below — softer gradient shadow
    ctx.save();
    const shCY = ballCY(tube.length - 1) + BALL_R + 4;
    const shGrad = ctx.createRadialGradient(cx, shCY, 0, cx, shCY, BALL_R * 0.85);
    shGrad.addColorStop(0, 'rgba(0,0,0,0.16)');
    shGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx, shCY, BALL_R * 0.85, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, bY);
  ctx.scale(sx * pulse, sy * pulse);
  if (G.dailyModifier === 'symbols') {
    drawBallSymbol(ctx, 0, 0, color, COLOR_SYMBOLS[color] || '?', true, ts);
  } else if (G.dailyModifier === 'memory' && G.memoryRevealed === false) {
    drawBallHidden(ctx, 0, 0, true, ts);
  } else {
    drawBall(ctx, 0, 0, color, true, ts);
  }
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

// ── Hint overlay — animated arrow + bouncing ball ────────────────────────

function drawHintOverlay(ctx, ts, G) {
  if (G.hintFrom < 0 || G.hintTo < 0 || G.frameTime >= G.hintUntil) return;
  const tubeCount = G.tubes.length;
  const srcX = tubeCX(G.hintFrom, tubeCount);
  const dstX = tubeCX(G.hintTo, tubeCount);
  const srcTube = G.tubes[G.hintFrom];

  // ── Pulsing highlight on top ball ──
  if (srcTube.length > 0) {
    const topIdx = srcTube.length - 1;
    const bx = srcX;
    const baseY = ballCY(topIdx);
    const pulse = 0.5 + 0.5 * Math.sin(ts * 0.006);

    ctx.save();
    // Outer glow
    ctx.strokeStyle = `rgba(255,180,0,${0.3 + pulse * 0.3})`;
    ctx.lineWidth = 6;
    const outerR = BALL_R + 10 + pulse * 4;
    ctx.beginPath();
    ctx.arc(bx, baseY, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.strokeStyle = `rgba(255,200,40,${0.7 + pulse * 0.3})`;
    ctx.lineWidth = 3;
    const innerR = BALL_R + 5 + pulse * 2;
    ctx.beginPath();
    ctx.arc(bx, baseY, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Animated "hand" pointer below the ball
    const handY = baseY + BALL_R + 18 + Math.sin(ts * 0.005) * 6;
    ctx.font = 'bold 18px Fredoka, Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,200,40,${0.7 + pulse * 0.3})`;
    ctx.fillText('☝', bx, handY);
    ctx.restore();
  }

  // ── Animated curved arrow from source to destination ──
  const arrowY = TUBE_TOP - 20;
  const midX = (srcX + dstX) / 2;
  const midY = arrowY - 40 - Math.sin(ts * 0.004) * 10;

  ctx.save();
  const pulse = 0.6 + 0.4 * Math.sin(ts * 0.005);

  // Glow layer (thick, blurred)
  ctx.strokeStyle = `rgba(255,180,0,${pulse * 0.35})`;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(srcX, arrowY);
  ctx.quadraticCurveTo(midX, midY, dstX, arrowY);
  ctx.stroke();

  // Main dashed path
  ctx.strokeStyle = `rgba(255,200,40,${0.7 + pulse * 0.3})`;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -ts * 0.04;
  ctx.beginPath();
  ctx.moveTo(srcX, arrowY);
  ctx.quadraticCurveTo(midX, midY, dstX, arrowY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead at destination — larger, filled
  const angle = Math.atan2(arrowY - midY, dstX - midX);
  const headLen = 16;
  ctx.fillStyle = `rgba(40,200,80,${0.8 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.moveTo(dstX, arrowY);
  ctx.lineTo(dstX - headLen * Math.cos(angle - 0.45), arrowY - headLen * Math.sin(angle - 0.45));
  ctx.lineTo(dstX - headLen * Math.cos(angle + 0.45), arrowY - headLen * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();

  // Arrow circle markers at start/end
  ctx.fillStyle = `rgba(255,180,0,${0.8 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(srcX, arrowY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(40,200,80,${0.8 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(dstX, arrowY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawImpactRing(ctx, ts) {
  const r = ANIM.impactRing;
  if (!r) return;
  const t = (ts - r.startTime) / r.duration;
  if (t > 1) return;

  ctx.save();

  // Inner ring — fast, bright
  const r1 = BALL_R + BALL_R * 1.2 * t;
  const a1 = 0.6 * (1 - t * t);                   // quadratic fade for snappier feel
  ctx.strokeStyle = r.color;
  ctx.globalAlpha = a1;
  ctx.lineWidth = 3.5 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, r1, 0, Math.PI * 2);
  ctx.stroke();

  // Outer ring — slower, softer
  const r2 = BALL_R + BALL_R * 2.2 * t;
  const a2 = 0.25 * (1 - t);
  ctx.globalAlpha = a2;
  ctx.lineWidth = 1.5 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, r2, 0, Math.PI * 2);
  ctx.stroke();

  // Centre glow dot — brief bright flash
  if (t < 0.3) {
    const dotAlpha = 0.5 * (1 - t / 0.3);
    const dotR = BALL_R * 0.4 * (1 - t / 0.3);
    const glow = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, dotR);
    glow.addColorStop(0, r.color.replace(/[\d.]+\)$/, `${dotAlpha})`));
    glow.addColorStop(1, r.color.replace(/[\d.]+\)$/, '0)'));
    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(r.x, r.y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRipple(ctx, ts) {
  const r = ANIM.ripple;
  if (!r) return;
  const elapsed = ts - r.startTime;
  if (elapsed > 400) { ANIM.ripple = null; return; }
  const t = elapsed / 400;

  ctx.save();
  const radius1 = 10 + 25 * t;
  ctx.strokeStyle = `rgba(255,215,0,${0.4 * (1 - t)})`;
  ctx.lineWidth = 2 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, radius1, 0, Math.PI * 2);
  ctx.stroke();

  const radius2 = 8 + 20 * t;
  ctx.strokeStyle = `rgba(255,215,0,${0.25 * (1 - t)})`;
  ctx.lineWidth = 1.5 * (1 - t);
  ctx.beginPath();
  ctx.arc(r.x, r.y, radius2, 0, Math.PI * 2);
  ctx.stroke();
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
  updateWobbles(ts);
  updateJiggles(ts);
  updateImpactRing(ts);
  updateParticles(dt);

  if (ANIM.tubeIntro && ANIM.tubeIntro.every(t => t === null)) {
    ANIM.tubeIntro = null;
  }

  // Theme fade
  if (G.themeFade < 1) {
    G.themeFade = Math.min(G.themeFade + (dt / 1000) / 0.5, 1);
    if (G.themeFade >= 1) G.themePrev = null;
  }

  // Draw
  const theme     = THEMES[G.theme] || THEMES.EASY;
  const prevTheme = G.themePrev ? (THEMES[G.themePrev] || theme) : theme;
  drawBackground(ctx, ts, theme, prevTheme, G.themeFade);
  drawRoomDecor(ctx, ts, theme, prevTheme, G.themeFade, G.level);
  if (!REDUCED_MOTION) drawFireflies(ctx, ts);

  // Screen shake
  let _shakeActive = false;
  if (ANIM.screenShake) {
    const se = performance.now() - ANIM.screenShake.startTime;
    if (se < ANIM.screenShake.duration) {
      const st = se / ANIM.screenShake.duration;
      const offset = ANIM.screenShake.amplitude * Math.sin(st * Math.PI * 6) * (1 - st);
      ctx.save();
      ctx.translate(offset, offset * 0.5);
      _shakeActive = true;
    } else {
      ANIM.screenShake = null;
    }
  }

  // Draw mascot cat (tracks flying ball)
  if (!G.won) {
    let lookAt = null;
    if (ANIM.arc) {
      const arcElapsed = ts - ANIM.arc.startTime;
      const arcRawT = Math.min(arcElapsed / ANIM.arc.duration, 1);
      const arcEasedT = easeOutQuart(arcRawT);
      lookAt = bezier2(arcEasedT, ANIM.arc.p0, ANIM.arc.p1, ANIM.arc.p2);
    }
    if (G.selected === -1 && !ANIM.busy || ANIM.arc) {
      drawMascotCat(ctx, CW - 55, CH - 45, 40, ts, G.mascotParams, lookAt);
    }
  }

  drawBoardFrame(ctx, ts, G);
  drawTubes(ctx, ts, G);
  drawHintOverlay(ctx, ts, G);

  if (ANIM.arc)                        drawArcBall(ctx, ts, dt / 1000, G);
  if (G.selected !== -1 && !ANIM.busy) drawFloatingBall(ctx, ts, G);

  drawParticles(ctx);
  drawImpactRing(ctx, ts);
  drawRipple(ctx, ts);
  drawConfetti(ctx);
  drawTutorialHighlight(ctx, G);

  // Gold flash overlay (win celebration) — warm radial with smooth ease
  if (ANIM.goldFlash) {
    const gfe = performance.now() - ANIM.goldFlash.startTime;
    if (gfe < ANIM.goldFlash.duration) {
      const gft = gfe / ANIM.goldFlash.duration;
      // Smooth bell curve: fast in, slow out
      const gfa = 0.28 * Math.sin(gft * Math.PI);
      const flashGrad = ctx.createRadialGradient(CW / 2, CH / 2, 0, CW / 2, CH / 2, CH * 0.7);
      flashGrad.addColorStop(0, `rgba(255,225,120,${gfa * 1.2})`);
      flashGrad.addColorStop(0.5, `rgba(255,200,60,${gfa})`);
      flashGrad.addColorStop(1, `rgba(255,180,30,${gfa * 0.3})`);
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, CW, CH);
    } else {
      ANIM.goldFlash = null;
    }
  }

  // Canvas dim for win overlay
  if (ANIM.canvasDim > 0) {
    ctx.fillStyle = `rgba(0,0,0,${ANIM.canvasDim * 0.5})`;
    ctx.fillRect(0, 0, CW, CH);
  }

  // Close screen shake
  if (_shakeActive) ctx.restore();

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
