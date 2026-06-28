import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionFree } from '../js/companion-cost.js';

test('Begleiter-Einsatz ist gratis, solange in diesem Level noch nicht genutzt', () => {
  assert.equal(companionFree(false), true);
});

test('Begleiter-Einsatz ist nicht mehr verfügbar, wenn in diesem Level schon genutzt', () => {
  assert.equal(companionFree(true), false);
});
