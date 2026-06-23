'use strict';

// Pure tube/ball layout geometry — no DOM/canvas dependencies, so it can be
// unit-tested directly. Imported (and re-exported) by render.js.

import {
  CW, TUBE_W, TUBE_H, TUBE_TOP, TUBE_BOT,
  BALL_R, BALL_D, BALL_GAP, BALL_PAD, FLOAT_Y_BASE,
} from './constants.js';

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

/**
 * Hit test: returns the tube index at (lx, ly), or -1 to deselect.
 *
 * Within the tube band we resolve to the tube whose CENTRE is nearest (same
 * approach as tetris mode). At high levels the per-tube rectangles overlap, so
 * the old "first rectangle containing the point" test always picked the left
 * neighbour in the overlap zone — the high-level mis-tap bug. Nearest-centre
 * gives each tube its full centre-pitch with no dead gaps and no left bias.
 * Taps clearly above/below the tubes, or left/right of all of them, return -1
 * so tapping empty space still deselects.
 */
export function tubeAt(lx, ly, tubeCount) {
  if (tubeCount <= 0) return -1;
  if (ly < TUBE_TOP || ly > TUBE_TOP + TUBE_H) return -1;

  const leftEdge  = tubeCX(0, tubeCount) - TUBE_W / 2;
  const rightEdge = tubeCX(tubeCount - 1, tubeCount) + TUBE_W / 2;
  if (lx < leftEdge || lx > rightEdge) return -1;

  let best = 0, bestDist = Infinity;
  for (let i = 0; i < tubeCount; i++) {
    const d = Math.abs(lx - tubeCX(i, tubeCount));
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}
