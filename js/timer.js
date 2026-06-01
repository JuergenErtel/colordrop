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
  const countdown = document.getElementById('timerCountdown');
  // Nur anzeigen, solange der Timer aktiv läuft. Ein gestoppter Timer (Level
  // gewonnen, Zeit abgelaufen, oder vor Rundenstart) darf nicht stehen bleiben –
  // sonst hängt nach einer Blitzrunde die rote "0" im nächsten Level fest.
  if (!timer || !timer.active) {
    bar.classList.remove('visible', 'pulse');
    if (countdown) countdown.classList.remove('visible', 'urgent');
    return;
  }
  bar.classList.add('visible');

  const remaining = Math.max(0, timer.endTime - frameTime);
  const pct = remaining / timer.duration;
  const hue = Math.round(pct * 120);
  const clr = `hsl(${hue}, 100%, 55%)`;

  bar.style.width      = (pct * 100) + '%';
  bar.style.background = clr;
  bar.style.color      = clr;
  bar.classList.toggle('pulse', pct < 0.2);

  // Countdown number
  if (countdown) {
    countdown.classList.add('visible');
    const secs = Math.ceil(remaining / 1000);
    countdown.textContent = secs;
    countdown.style.color = clr;
    countdown.classList.toggle('urgent', pct < 0.2);
  }
}
