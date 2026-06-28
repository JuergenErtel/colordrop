import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionCost } from '../js/companion-cost.js';

test('Nicht-Premium zahlt vollen Preis', () => {
  assert.equal(companionCost('paw', { premium: false, freeUsedThisLevel: false }), 30);
  assert.equal(companionCost('magnet', { premium: false, freeUsedThisLevel: true }), 50);
});

test('Premium: erste Nutzung pro Level gratis', () => {
  assert.equal(companionCost('magnet', { premium: true, freeUsedThisLevel: false }), 0);
});

test('Premium: nach Gratis-Nutzung normaler Preis', () => {
  assert.equal(companionCost('magnet', { premium: true, freeUsedThisLevel: true }), 50);
});
