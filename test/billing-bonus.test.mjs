// Minimal localStorage stub must be set before storage.js loads at module init.
// We use a dynamic import so the stub assignment runs first (top-level ESM
// import statements are hoisted, but the code below them is not).

// Minimal localStorage stub so storage.js can be loaded in Node.js
// (migrateToSubscriptionModel() runs at module init and calls localStorage).
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

const { shouldGrantWelcomeBonus, buildSub } = await import('../js/billing.js');

test('bonus granted when no previous subscription', () => {
  assert.equal(shouldGrantWelcomeBonus(null), true);
  assert.equal(shouldGrantWelcomeBonus({ active: false }), true);
});

test('no bonus when already lifetime', () => {
  assert.equal(shouldGrantWelcomeBonus({ active: true, lifetime: true }), false);
});

test('buildSub lifetime sets lifetime true and active', () => {
  const s = buildSub('lifetime', new Date('2026-06-23T00:00:00Z'));
  assert.equal(s.lifetime, true);
  assert.equal(s.active, true);
  assert.equal(s.tier, 'lifetime');
  assert.equal(s.expiresAt, null);
});
