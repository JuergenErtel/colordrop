'use strict';

import { playSound } from './audio.js';

/**
 * updateTimer(timer, frameTime, won)
 *   timer     — G.timer object { active, endTime, duration, _lastTick }
 *   frameTime — current rAF timestamp
 *   won       — true if the game is already won
 *   Returns true if time ran out this frame.
 */
export function updateTimer(timer, frameTime, won) {
  if (!timer || !timer.active || won) return false;

  // Tick sound in last 10 seconds
  const secondsLeft = Math.ceil((timer.endTime - frameTime) / 1000);
  if (secondsLeft <= 10 && secondsLeft > 0 && secondsLeft !== timer._lastTick) {
    timer._lastTick = secondsLeft;
    playSound('tick');
  }

  // Timeout
  if (frameTime >= timer.endTime) {
    timer.active = false;
    playSound('invalid');
    return true;
  }

  return false;
}

/**
 * drawTimerBar(bar, timer, frameTime)
 *   bar       — DOM element (.timer-bar)
 *   timer     — G.timer object or null
 *   frameTime — current rAF timestamp
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
  bar.style.background = `hsl(${Math.round(pct * 120)}, 100%, 55%)`;
  bar.style.color      = `hsl(${Math.round(pct * 120)}, 100%, 55%)`; // for box-shadow currentColor
  bar.classList.toggle('pulse', pct < 0.2);
}
