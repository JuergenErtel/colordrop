# Rewarded Video System — Design Spec

**Datum:** 2026-05-31
**Projekt:** colordrop / Kittysort
**Status:** Approved (Brainstorming abgeschlossen)

## Ziel

Ein echtes Rewarded-Video-System: Der Spieler schaut freiwillig eine
Werbung und erhält **nur bei abgeschlossenem Video** eine Belohnung. Ersetzt
die heutigen Stubs, bei denen Belohnungen ohne jede Werbung sofort verschenkt
werden.

Scope dieser Aufgabe: **Architektur + Simulation**. Vollständiges System mit
sauberem Abschluss-Handling und simuliertem Ad-Player (Preview-Modus),
drop-in-bereit für ein echtes Netzwerk später — spiegelt das bestehende
`BILLING_MODE='preview'`-Muster.

## Ist-Zustand (was ersetzt/erweitert wird)

- **Interstitial** (`#adOverlay`, `shouldShowAd`/`markAdShown`/`tickAdLevel` in
  `economy.js`): Platzhalter-Overlay alle 3 Level. **Bleibt unangetastet** —
  das ist Interstitial, nicht Rewarded.
- **`refillWithAd()`** (`lives.js`): vergibt aktuell sofort +1 Leben ohne
  Video. Bleibt als Vergabe-Funktion, wird künftig nur nach `completed:true`
  aufgerufen.
- **Hints** (`showHintAction`, `spendHint`): kosten Fischgräten, keine
  Ad-Option. Wird um einen Gratis-Hint-Pfad erweitert.
- **`rewardedAd: 20`** in `constants.js`: bestehender XP-Wert, bleibt wie er
  ist (nicht Teil dieses Systems).

## Architektur (Ansatz A)

Ein Modul `js/rewarded.js` kapselt Player + Gate + Caps. Die Belohnung selbst
vergibt **jede Aufrufstelle** (lives/hint/economy) — das Modul vergibt nie
selbst. Klare Grenzen, ein Provider-Switch wie beim Billing.

### Öffentliche API

```js
// Reiner Check — für Button-Zustand & "noch N heute"-Anzeige (kein Ad)
canShowRewarded(surface) → { ok, reason?, remaining?, msUntil? }
//   reason: 'premium' | 'capped' | 'cooldown' | 'unavailable'

// Spielt Ad, prüft Gate, zählt bei Abschluss hoch, setzt Cooldown
showRewarded(surface) → Promise<{ completed, reason? }>
```

**Ablauf `showRewarded`:**
1. Gate prüfen (`canShowRewarded`). Wenn nicht `ok` → sofort
   `{completed:false, reason}`.
2. Ad abspielen (Provider).
3. Bei Abschluss: View buchen (Tageszähler +1, Cooldown-Stempel) →
   `{completed:true}`.
4. Bei Abbruch / kein Fill: `{completed:false}`, **kein** State-Update,
   **keine** Belohnung.

### Provider & Simulation

Schalter in `constants.js`, analog zu `BILLING_MODE`, mit Launch-Kommentar-
Header im Modul (wie `billing.js`):

```js
export const REWARDED_MODE = 'preview';  // 'preview' | 'adsense' | 'native'
```

- **`preview`**: zeigt `#rewardedOverlay` — Cozy-Karte mit „Werbung läuft",
  **5-Sek-Countdown**, Pfötchen-Animation, **„Abbrechen"** (→ `completed:false`)
  und nach Ablauf **„Belohnung abholen 🎁"** (→ `completed:true`). Voll testbar
  ohne Account.
- **`adsense`**: Hook auf Google **H5 Games Ads** `adBreak({type:'reward'})`,
  vorerst dokumentierter Stub mit Launch-Prozedur im Header (Account/Domain
  nötig). Kein Fill → `completed:false`.
- **`native`**: `throw 'not implemented'` (iOS/Android-Bridge später).

## Caps & State (Tageslimit + Cooldown)

Konfiguration in `constants.js`:

```js
export const REWARDED_LIMITS = {
  life:     { daily: 5,  cooldownMs: 60_000 },           // 1 Min
  hint:     { daily: 10, cooldownMs: 30_000 },           // großzügig, kostet Zeit
  bones:    { daily: 3,  cooldownMs: 5*60_000, amount: 50 },
  continue: { daily: 3,  cooldownMs: 60_000 },           // Blitz-Timeout
};
```

State in `storage.js`: `{ date: 'YYYY-MM-DD', counts: {surface:n}, lastView:
{surface:ts} }`. Beim Laden: wenn `date` ≠ heute → `counts`/`lastView`
zurücksetzen (Mitternacht-Reset).

Die Cap-Logik wird als **reine Funktionen** `(state, now, limits) → result`
geschrieben (Date/localStorage außen vorgehalten), damit sie ohne Browser per
Node testbar ist.

## Surfaces

| Surface | Auslöser | Belohnung bei `completed:true` |
|---|---|---|
| **life** | „Keine Leben"-Overlay (`livesAdBtn`, existiert) | `refillWithAd()` → +1 Leben, dann `retryFn()` |
| **hint** | Hint-Klick scheitert an zu wenig Fischgräten → neuer Button „📺 Gratis-Hint" | `grantFreeHint()` — Hint ohne Kosten ausführen |
| **bones** | Neuer Button im Menü/Shop, mit „noch N heute" | `earn(REWARDED_LIMITS.bones.amount)` |
| **continue** | Blitz-Timeout-Overlay (`#timeoutOverlay`) → „📺 +20 Sek weiter" | Timer +20s, weiterspielen statt verlieren |

Jeder Button ruft `canShowRewarded(surface)` für Zustand/Label und ist
deaktiviert bzw. ausgeblendet bei `capped`/`cooldown`/`premium`.

## Premium & Fehlerfälle

- **Premium**: `canShowRewarded` → `{ok:false, reason:'premium'}`; alle
  Rewarded-Buttons werden **ausgeblendet** (werbefrei-Versprechen). Leben/Hints
  sind für Premium ohnehin unbegrenzt.
- **Abbruch / kein Fill**: keine Belohnung, kein State-Update, sanfte Meldung
  („Gerade keine Werbung verfügbar"). Nie ein Reward ohne abgeschlossenes Video.

## Module & Dateien

- **Neu**: `js/rewarded.js` (API, Provider, Cap-Logik), `#rewardedOverlay` in
  `index.html`, Styles im passenden CSS (Overlay-Pattern wie bestehende
  Overlays).
- **Geändert**: `constants.js` (`REWARDED_MODE`, `REWARDED_LIMITS`),
  `storage.js` (`loadRewardedState`/`saveRewardedState`), `lives.js`-Aufrufstelle
  in `main.js` (`livesAdBtn` → async + Gate), `showHintAction` (Gratis-Hint-
  Fallback + `grantFreeHint`), Blitz-Timeout-Handler, neuer Bones-Button im
  Menü/Shop.

## Testing

- **Reine Logik** (Cap, Cooldown, Mitternacht-Reset, `canShowRewarded`-
  Verzweigung): Node-Skript, da kein Test-Framework im Projekt existiert. Die
  Funktionen nehmen `(state, now, limits)` und sind dadurch deterministisch.
- **Surfaces + Simulation**: Browser-Verifikation (statischer Server +
  Chrome DevTools), wie beim Daily-Bugfix: Overlay-Ablauf, Abschluss vs.
  Abbruch, Premium-Ausblendung, „noch N heute".

## Bewusst ausgeschlossen (YAGNI)

- Echte Ad-Netzwerk-Integration (nur Stub/Hook).
- Native IAP/Ad-Bridge.
- Server-seitige Reward-Validierung (Client-only, wie der Rest des Spiels).
- Belohnungs-Surfaces über die vier genannten hinaus.
