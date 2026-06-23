'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   NATIVE HAPTIK (Capacitor @capacitor/haptics) — iOS-Build
   ───────────────────────────────────────────────────────────────────────
   Zentral an playSound() gekoppelt: jeder relevante Sound löst zusätzlich ein
   dezentes haptisches Feedback aus. Nur nativ aktiv (im Web No-op), kein
   statischer Paket-Import — Zugriff über window.Capacitor.Plugins.Haptics.

   Feuert unabhängig vom Sound-Mute (Haptik ≠ Audio).
   ══════════════════════════════════════════════════════════════════════════ */

// Sound-Name → Haptik-Art. Bewusst sparsam, damit es nicht „dauerbrummt".
const IMPACT_LIGHT   = new Set(['select', 'tap', 'drop', 'pop', 'click', 'undo', 'hint']);
const NOTIFY_SUCCESS = new Set(['win', 'solved', 'achievement']);
const NOTIFY_WARNING = new Set(['invalid']);
// 'tick' bewusst ausgenommen (Timer-Tick würde im Sekundentakt brummen).

function getHaptics() {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    return null;
  }
  return (C.Plugins && C.Plugins.Haptics) || null;
}

/**
 * Löst zum übergebenen Sound-Namen das passende haptische Feedback aus.
 * Fire-and-forget; Fehler werden geschluckt (z. B. wenn Plugin fehlt).
 */
export function hapticForSound(name) {
  const H = getHaptics();
  if (!H) return;
  try {
    if (IMPACT_LIGHT.has(name)) {
      H.impact({ style: 'LIGHT' });
    } else if (NOTIFY_SUCCESS.has(name)) {
      H.notification({ type: 'SUCCESS' });
    } else if (NOTIFY_WARNING.has(name)) {
      H.notification({ type: 'WARNING' });
    }
  } catch (_) {
    /* Haptik ist reines Nice-to-have — niemals das Spiel stören. */
  }
}
