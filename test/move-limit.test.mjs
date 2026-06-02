import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelConfig, moveLimit, parForLevel } from '../js/engine.js';

test('levelConfig color ramp hits the new tier boundaries', () => {
  const colors = (n) => levelConfig(n).colors.length;
  // EASY 1-10: 2 -> 4
  assert.equal(colors(1), 2);
  assert.equal(colors(10), 4);
  // MEDIUM 11-30: 4 -> 6
  assert.equal(colors(11), 4);
  assert.equal(colors(30), 6);
  // HARD 31-70: 6 -> 8
  assert.equal(colors(31), 6);
  assert.equal(colors(70), 8);
  // EXPERT 71-140: 8 -> 9
  assert.equal(colors(71), 8);
  assert.equal(colors(140), 9);
  // MASTER 141-300: 9 -> 10
  assert.equal(colors(141), 9);
  assert.equal(colors(300), 10);
});

test('levelConfig always keeps 2 empty tubes', () => {
  for (const n of [1, 11, 50, 140, 300]) {
    assert.equal(levelConfig(n).empty, 2);
  }
});

test('moveLimit is null below the onset level', () => {
  for (const n of [1, 5, 10]) assert.equal(moveLimit(n), null);
});

test('moveLimit applies from level 11 and stays above par', () => {
  for (const n of [11, 30, 70, 140, 300]) {
    const lim = moveLimit(n);
    assert.equal(typeof lim, 'number');
    assert.ok(lim > parForLevel(n), `limit ${lim} must exceed par ${parForLevel(n)} at level ${n}`);
  }
});

test('moveLimit honours the par+floor minimum', () => {
  const n = 11;
  assert.ok(moveLimit(n) >= parForLevel(n) + 3);
});
