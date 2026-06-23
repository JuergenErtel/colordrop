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

test('leaves REWARDED_MODE and other lines untouched', () => {
  const src = "export const REWARDED_MODE = 'preview';\nexport const BILLING_MODE = 'preview';\n";
  const out = patchConstantsForNative(src);
  assert.match(out, /REWARDED_MODE = 'preview'/);
  assert.match(out, /BILLING_MODE = 'native'/);
});

test('idempotent when already native', () => {
  const src = "export const BILLING_MODE = 'native';\n";
  assert.equal(patchConstantsForNative(src), src);
});
