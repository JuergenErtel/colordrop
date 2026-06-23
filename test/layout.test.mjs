import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tubeAt, tubeCX } from '../js/layout.js';

// Geometry recap (constants.js): CW=420, TUBE_W=68, TUBE_TOP=200, TUBE_H=240.
// From ~8 tubes upward the per-tube rectangles OVERLAP, so the old
// "first rectangle that contains the point" hit-test always picked the LEFT
// neighbour in the overlap zone — the high-level mis-tap bug. The fix: resolve
// to the tube whose CENTRE is nearest (within the tube band), like tetris mode.

const BAND_Y = 300; // inside [TUBE_TOP, TUBE_TOP+TUBE_H]

test('high level: a tap right of the midpoint selects the RIGHT tube (was left-biased)', () => {
  const n = 11;
  const mid = (tubeCX(5, n) + tubeCX(6, n)) / 2;
  // A point just right of the 5↔6 midpoint is closest to tube 6.
  assert.equal(tubeAt(mid + 4, BAND_Y, n), 6);
  // …and just left of the midpoint is closest to tube 5.
  assert.equal(tubeAt(mid - 4, BAND_Y, n), 5);
});

test('a tap exactly on a tube centre selects that tube', () => {
  const n = 11;
  for (const i of [0, 3, 6, 10]) {
    assert.equal(tubeAt(tubeCX(i, n), BAND_Y, n), i);
  }
});

test('low level: a tap in the gap selects the nearest tube (more forgiving)', () => {
  const n = 4;
  const mid = (tubeCX(0, n) + tubeCX(1, n)) / 2;
  assert.equal(tubeAt(mid + 5, BAND_Y, n), 1);
  assert.equal(tubeAt(mid - 5, BAND_Y, n), 0);
});

test('taps above or below the tube band return -1 (deselect preserved)', () => {
  const n = 11;
  const x = tubeCX(6, n);
  assert.equal(tubeAt(x, 100, n), -1); // above TUBE_TOP (200)
  assert.equal(tubeAt(x, 500, n), -1); // below TUBE_TOP+TUBE_H (440)
});

test('taps clearly left/right of all tubes return -1 (deselect preserved)', () => {
  const n = 4; // low count → real left/right margins exist
  const leftEdge  = tubeCX(0, n) - 34;       // TUBE_W/2 = 34
  const rightEdge = tubeCX(n - 1, n) + 34;
  assert.equal(tubeAt(leftEdge - 20, BAND_Y, n), -1);
  assert.equal(tubeAt(rightEdge + 20, BAND_Y, n), -1);
});
