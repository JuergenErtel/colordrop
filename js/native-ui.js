'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   NATIVE UI-POLITUR (Capacitor @capacitor/status-bar) — iOS-Build
   ───────────────────────────────────────────────────────────────────────
   Status-Bar an den hellen App-Hintergrund (#fdf6ec) anpassen: dunkler Text.
   Nur nativ aktiv; Zugriff über window.Capacitor.Plugins.StatusBar.
   ══════════════════════════════════════════════════════════════════════════ */

function getStatusBar() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins.StatusBar) || null;
}

/** Setzt dunklen Status-Bar-Text (für den hellen Hintergrund). Best-effort. */
export async function initNativeStatusBar() {
  const StatusBar = getStatusBar();
  if (!StatusBar) return;
  try {
    // Style.Light = „Dark text for light backgrounds".
    await StatusBar.setStyle({ style: 'LIGHT' });
  } catch (err) {
    console.warn('native-ui: StatusBar-Style fehlgeschlagen:', err);
  }
}
