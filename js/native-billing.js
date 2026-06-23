'use strict';

/* Native In-App-Kauf (StoreKit 2) — Bridge für den Capacitor-iOS-Build.
   Zugriff ausschließlich über window.Capacitor.Plugins.Purchases — kein
   statischer Paket-Import (Web-Bundle bleibt unberührt). */

export const IAP_PRODUCT_IDS = {
  lifetime: 'de.kittysort.app.lifetime',
};

const PLUGIN_NAME = 'Purchases';

function getPlugin() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins[PLUGIN_NAME]) || null;
}

export async function purchaseNative(tier) {
  const productId = IAP_PRODUCT_IDS[tier];
  if (!productId) return { ok: false, reason: 'unknown_tier' };

  const plugin = getPlugin();
  if (!plugin) {
    console.warn('native-billing: Plugin nicht verfügbar.');
    return { ok: false, reason: 'plugin_unavailable' };
  }
  try {
    const res = await plugin.purchase({ productId });
    if (res && res.status === 'purchased') return { ok: true, tier };
    if (res && res.status === 'cancelled') return { ok: false, reason: 'cancelled' };
    if (res && res.status === 'pending')   return { ok: false, reason: 'pending' };
    return { ok: false, reason: 'purchase_failed' };
  } catch (err) {
    console.warn('native-billing: Kauf fehlgeschlagen:', err);
    return { ok: false, reason: 'purchase_failed' };
  }
}

export async function restoreNative() {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.restorePurchases();
    return !!(res && res.lifetime);
  } catch (err) {
    console.warn('native-billing: Restore fehlgeschlagen:', err);
    return false;
  }
}

export async function syncEntitlementsNative() {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.getEntitlements();
    return !!(res && res.lifetime);
  } catch (err) {
    console.warn('native-billing: Entitlement-Sync fehlgeschlagen:', err);
    return false;
  }
}

export async function getNativeProducts(ids) {
  const plugin = getPlugin();
  if (!plugin) return [];
  try {
    const res = await plugin.getProducts({ ids });
    return (res && res.products) || [];
  } catch (err) {
    console.warn('native-billing: getProducts fehlgeschlagen:', err);
    return [];
  }
}
