// Minimal localStorage stub must be set before storage.js loads at module init
// (economy.js → storage.js runs migrateToSubscriptionModel() at import time).
const _store = new Map();
globalThis.localStorage = {
  getItem:    (k) => _store.has(k) ? _store.get(k) : null,
  setItem:    (k, v) => _store.set(k, String(v)),
  removeItem: (k) => _store.delete(k),
  get length() { return _store.size; },
  key:        (i) => [..._store.keys()][i] ?? null,
};

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Dynamic import so the stub above is in place before the module initializes.
const { adDecision } = await import('../js/economy.js');

const MIN = 60 * 1000;

test('premium sieht nie ein Interstitial', () => {
  assert.equal(adDecision({ levelsSinceAd: 99, lastAdTime: 0, now: 10 * MIN, premium: true }), false);
});

test('unter Level-Intervall → kein Ad', () => {
  assert.equal(adDecision({ levelsSinceAd: 2, lastAdTime: 0, now: 10 * MIN, premium: false, intervalLevels: 3, cooldownMs: 2 * MIN }), false);
});

test('Intervall erreicht, aber Cooldown noch aktiv → kein Ad', () => {
  assert.equal(adDecision({ levelsSinceAd: 3, lastAdTime: 9 * MIN, now: 10 * MIN, premium: false, intervalLevels: 3, cooldownMs: 2 * MIN }), false);
});

test('Intervall erreicht UND Cooldown abgelaufen → Ad', () => {
  assert.equal(adDecision({ levelsSinceAd: 3, lastAdTime: 7 * MIN, now: 10 * MIN, premium: false, intervalLevels: 3, cooldownMs: 2 * MIN }), true);
});

test('Default-Cooldown ist 2 Minuten (Regressions-Schutz)', () => {
  // lastAdTime vor 2.5 min → Ad; vor 1.5 min → kein Ad (Default cooldownMs)
  assert.equal(adDecision({ levelsSinceAd: 3, lastAdTime: 10 * MIN - 2.5 * MIN, now: 10 * MIN, premium: false }), true);
  assert.equal(adDecision({ levelsSinceAd: 3, lastAdTime: 10 * MIN - 1.5 * MIN, now: 10 * MIN, premium: false }), false);
});
