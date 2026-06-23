import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patchConstantsForNative } from '../tools/patch-constants.mjs';

test('patches BILLING_MODE preview -> native', () => {
  const src = "export const BILLING_MODE = 'preview';    // comment\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /export const BILLING_MODE = 'native';/);
  assert.doesNotMatch(out, /'preview'/);
});

test('patches BILLING_MODE stripe -> native', () => {
  const src = "export const BILLING_MODE = 'stripe';\n";
  assert.match(patchConstantsForNative(src), /BILLING_MODE = 'native'/);
});

test('patches REWARDED_MODE preview -> native', () => {
  const src = "export const REWARDED_MODE = 'preview';   // comment\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /export const REWARDED_MODE = 'native';/);
});

test('patches REWARDED_MODE adsense -> native', () => {
  const src = "export const REWARDED_MODE = 'adsense';\n";
  assert.match(patchConstantsForNative(src), /REWARDED_MODE = 'native'/);
});

test('patches both BILLING_MODE and REWARDED_MODE in one pass', () => {
  const src = "export const REWARDED_MODE = 'preview';\nexport const BILLING_MODE = 'preview';\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /REWARDED_MODE = 'native'/);
  assert.match(out, /BILLING_MODE = 'native'/);
});

test('leaves unrelated lines untouched', () => {
  const src = "export const ADMOB = { testing: true };\nexport const BILLING_MODE = 'preview';\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /ADMOB = \{ testing: true \}/);
  assert.match(out, /BILLING_MODE = 'native'/);
});

test('idempotent when already native', () => {
  const src = "export const BILLING_MODE = 'native';\nexport const REWARDED_MODE = 'native';\n";
  assert.equal(patchConstantsForNative(src), src);
});
