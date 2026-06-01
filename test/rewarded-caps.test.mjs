import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, resetIfNewDay, canClaim, recordClaim } from '../js/rewarded-caps.js';

const LIMITS = {
  bones: { daily: 3, cooldownMs: 300000, amount: 50 },
  life:  { daily: 5, cooldownMs: 60000 },
};

test('emptyState starts at given date with no counts', () => {
  const s = emptyState('2026-05-31');
  assert.equal(s.date, '2026-05-31');
  assert.deepEqual(s.counts, {});
  assert.deepEqual(s.lastView, {});
});

test('resetIfNewDay wipes counts when the day changed', () => {
  const old = { date: '2026-05-30', counts: { bones: 3 }, lastView: { bones: 111 } };
  const reset = resetIfNewDay(old, '2026-05-31');
  assert.equal(reset.date, '2026-05-31');
  assert.deepEqual(reset.counts, {});
});

test('resetIfNewDay keeps state on the same day', () => {
  const s = { date: '2026-05-31', counts: { bones: 1 }, lastView: { bones: 5 } };
  assert.equal(resetIfNewDay(s, '2026-05-31'), s);
});

test('canClaim ok when under daily cap and no cooldown', () => {
  const s = emptyState('2026-05-31');
  const r = canClaim(s, 'bones', 1_000_000, LIMITS);
  assert.equal(r.ok, true);
  assert.equal(r.remaining, 3);
});

test('canClaim capped when daily limit reached', () => {
  const s = { date: '2026-05-31', counts: { bones: 3 }, lastView: {} };
  const r = canClaim(s, 'bones', 1_000_000, LIMITS);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'capped');
});

test('canClaim cooldown blocks a too-soon second view', () => {
  const s = { date: '2026-05-31', counts: { bones: 1 }, lastView: { bones: 1_000_000 } };
  const r = canClaim(s, 'bones', 1_000_000 + 10_000, LIMITS); // 10s < 300s cooldown
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'cooldown');
  assert.ok(r.msUntil > 0);
});

test('canClaim ok again after cooldown elapsed', () => {
  const s = { date: '2026-05-31', counts: { bones: 1 }, lastView: { bones: 1_000_000 } };
  const r = canClaim(s, 'bones', 1_000_000 + 300_001, LIMITS);
  assert.equal(r.ok, true);
});

test('canClaim unavailable for unknown surface', () => {
  const r = canClaim(emptyState('2026-05-31'), 'nope', 1, LIMITS);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'unavailable');
});

test('recordClaim increments count and stamps lastView immutably', () => {
  const s = emptyState('2026-05-31');
  const s2 = recordClaim(s, 'bones', 42);
  assert.equal(s2.counts.bones, 1);
  assert.equal(s2.lastView.bones, 42);
  assert.deepEqual(s.counts, {}, 'original state not mutated');
});
