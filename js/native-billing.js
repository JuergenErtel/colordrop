'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   NATIVE IN-APP-KAUF (StoreKit) — Bridge für den Capacitor-iOS-Build
   ───────────────────────────────────────────────────────────────────────
   Apple verlangt für digitale Güter IAP (nicht Stripe). Dieses Modul ist nur
   im nativen App-Build aktiv; im Web wird es zwar importiert, aber nie
   aufgerufen (BILLING_MODE bleibt dort 'preview'/'stripe').

   Zugriff bewusst über das globale window.Capacitor.Plugins-Registry —
   KEINE statischen Paket-Imports, damit der Web-Bundle (www/) unberührt bleibt.

   ── OFFENE ENTSCHEIDUNG (am Mac final wählen) ──────────────────────────────
   IAP-Plugin. Zwei sinnvolle Optionen für EIN Einmalprodukt:
     A) Direktes StoreKit-Plugin (z. B. cordova-plugin-purchase / CdvPurchase)
        – kein Drittdienst, lokale Belegprüfung, etwas mehr Code.
     B) RevenueCat (@revenuecat/purchases-capacitor)
        – serverseitige Belegprüfung ohne eigenen Server, sehr robust,
          kostenlos unter Umsatzschwelle, braucht RevenueCat-Account + API-Key.
   Sobald gewählt: PLUGIN_NAME + den markierten Aufruf unten anpassen.

   ── TODO am Mac ────────────────────────────────────────────────────────────
   1. Produkt in App Store Connect anlegen (Non-Consumable):
        Product ID = IAP_PRODUCT_IDS.lifetime
   2. Plugin installieren + in Xcode StoreKit-Capability/Config ergänzen.
   3. Markierten Aufruf unten gegen die echte Plugin-API setzen.
   ══════════════════════════════════════════════════════════════════════════ */

// Product IDs — müssen 1:1 mit App Store Connect übereinstimmen.
export const IAP_PRODUCT_IDS = {
  lifetime: 'de.kittysort.app.lifetime',
};

// Name des Plugins im Capacitor.Plugins-Registry (nach Plugin-Wahl setzen).
const PLUGIN_NAME = 'InAppPurchase'; // <-- anpassen je nach gewähltem Plugin

function getPlugin() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null; // nicht im nativen Build
  }
  return (C.Plugins && C.Plugins[PLUGIN_NAME]) || null;
}

/**
 * Startet den nativen Kauf. Liefert { ok: boolean, reason?: string }.
 * Die tatsächliche Berechtigung (lifetime) wird NACH Bestätigung durch den
 * Store in billing.js lokal gespeichert (grantPreview-Pfad wiederverwendet).
 */
export async function purchaseNative(tier) {
  const productId = IAP_PRODUCT_IDS[tier];
  if (!productId) return { ok: false, reason: 'unknown_tier' };

  const plugin = getPlugin();
  if (!plugin) {
    // Sauberer Fallback statt hartem Fehler (z. B. Plugin noch nicht gelinkt).
    console.warn('native-billing: IAP-Plugin nicht verfügbar.');
    return { ok: false, reason: 'plugin_unavailable' };
  }

  try {
    // ── EINZIGER INTEGRATIONS-PUNKT ───────────────────────────────────────
    // An die API des gewählten Plugins anpassen. Erwartet: wirft bei
    // Abbruch/Fehler, sonst erfolgreicher Kauf.
    await plugin.purchase({ productId });
    // ──────────────────────────────────────────────────────────────────────
    return { ok: true, tier };
  } catch (err) {
    console.warn('native-billing: Kauf abgebrochen/fehlgeschlagen:', err);
    return { ok: false, reason: 'purchase_failed' };
  }
}

/**
 * Käufe wiederherstellen (Apple-Pflicht für Non-Consumables).
 * Liefert true, wenn ein gültiger Lifetime-Kauf gefunden wurde.
 */
export async function restoreNative() {
  const plugin = getPlugin();
  if (!plugin) return false;
  try {
    // ── INTEGRATIONS-PUNKT (Plugin-spezifisch) ────────────────────────────
    const res = await plugin.restorePurchases();
    // Erwartete Form je nach Plugin prüfen — hier defensiv:
    return !!(res && res.lifetime);
  } catch (err) {
    console.warn('native-billing: Restore fehlgeschlagen:', err);
    return false;
  }
}
