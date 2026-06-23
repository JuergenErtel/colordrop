import { test } from 'node:test';
import assert from 'node:assert/strict';

function withPlugin(plugin) {
  globalThis.window = {
    Capacitor: { isNativePlatform: () => true, Plugins: { Purchases: plugin } },
  };
}
function withoutNative() {
  globalThis.window = { Capacitor: { isNativePlatform: () => false, Plugins: {} } };
}

const mod = await import('../js/native-billing.js');

test('purchaseNative maps purchased -> ok', async () => {
  withPlugin({ purchase: async () => ({ status: 'purchased' }) });
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: true, tier: 'lifetime' });
});

test('purchaseNative maps cancelled -> reason cancelled', async () => {
  withPlugin({ purchase: async () => ({ status: 'cancelled' }) });
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: false, reason: 'cancelled' });
});

test('purchaseNative maps pending -> reason pending', async () => {
  withPlugin({ purchase: async () => ({ status: 'pending' }) });
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: false, reason: 'pending' });
});

test('purchaseNative unknown tier', async () => {
  withPlugin({ purchase: async () => ({ status: 'purchased' }) });
  assert.deepEqual(await mod.purchaseNative('xyz'), { ok: false, reason: 'unknown_tier' });
});

test('purchaseNative no plugin -> plugin_unavailable', async () => {
  withoutNative();
  assert.deepEqual(await mod.purchaseNative('lifetime'), { ok: false, reason: 'plugin_unavailable' });
});

test('restoreNative true when lifetime owned', async () => {
  withPlugin({ restorePurchases: async () => ({ lifetime: true }) });
  assert.equal(await mod.restoreNative(), true);
});

test('restoreNative false without plugin', async () => {
  withoutNative();
  assert.equal(await mod.restoreNative(), false);
});

test('syncEntitlementsNative reads getEntitlements', async () => {
  withPlugin({ getEntitlements: async () => ({ lifetime: true }) });
  assert.equal(await mod.syncEntitlementsNative(), true);
});

test('getNativeProducts returns array', async () => {
  withPlugin({ getProducts: async () => ({ products: [{ id: 'x', displayPrice: '2,99 €', displayName: 'Forever' }] }) });
  const r = await mod.getNativeProducts(['x']);
  assert.equal(r[0].displayPrice, '2,99 €');
});

test('getNativeProducts empty without plugin', async () => {
  withoutNative();
  assert.deepEqual(await mod.getNativeProducts(['x']), []);
});
