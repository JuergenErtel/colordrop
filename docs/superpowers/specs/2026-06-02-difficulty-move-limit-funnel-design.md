# Spec: Schwierigkeitskurve + Zug-Limit-Funnel

**Datum:** 2026-06-02
**Status:** Approved (Design), bereit für Implementierungsplan
**Ziel:** Monetarisierung verbessern, indem das Spiel früher fordernd wird und
der Kern-Loop eine Verlust-/Ad-Situation bekommt. Aktuell ist das Kern-Puzzle
konsequenzfrei (kein Lebensverlust, freies Undo, sehr flache Farbkurve) → der
Nutzer braucht die Rewarded Ads zu lange nicht.

## Problem (Root Cause)

1. **Flache, späte Schwierigkeitskurve** (`engine.js` `levelConfig`): EASY 1–15
   (2–3 Farben), MEDIUM 16–45 (3–5), HARD 46–100 (5–7). Es dauert ~45 Level bis
   5 Farben. Immer 2 leere Röhren + freies Undo → niemand bleibt stecken.
2. **Konsequenzfreier Kern-Loop:** `consumeLife()` wird nur bei Mini-Games &
   Blitz aufgerufen (`tryStartGatedMode`, main.js). Im normalen Sortier-Level
   wird nie ein Leben verbraucht und es gibt keinen Fail-State. Alle Ad-Surfaces
   (`life`, `hint`, `continue`, `bones`) hängen an Stellen, die der Grind-Spieler
   im Hauptloop nicht berührt.

## Entscheidungen (vom Nutzer bestätigt)

- **Beide Hebel:** steilere/frühere Kurve UND Konsequenz im Kern-Puzzle.
- **Fail-Trigger:** Zug-Limit pro Level (Candy-Crush-Funnel).
- **Onset:** ab Level 11 (Level 1–10 bleiben limitfrei = Tutorial).
- **Fail-Screen-Optionen:** +5 Züge per Ad, +5 Züge per Fischgräten,
  Neustart kostet 1 Leben. **Kein** Gratis-Aufgeben.
- **Undo** bleibt unbegrenzt, gibt aber den Zug **nicht** zurück.

## A) Schwierigkeitskurve (`engine.js`, `constants.js`)

Tier-Bänder stauchen, Farben schneller hochziehen. Es gibt 10 spielbare Farben
(coral…ember; `joker` ist Sonderball, nicht mitgezählt).

| Tier   | alt (minLevel–maxLevel) | **neu** | Farben (min→max) neu |
|--------|-------------------------|---------|----------------------|
| EASY   | 1–15                    | **1–10**   | 2 → 4  |
| MEDIUM | 16–45                   | **11–30**  | 4 → 6  |
| HARD   | 46–100                  | **31–70**  | 6 → 8  |
| EXPERT | 101–180                 | **71–140** | 8 → 9  |
| MASTER | 181–300                 | **141–300**| 9 → 10 |

- `TIER_DEFS` (constants.js) erhält die neuen `minLevel`/`maxLevel`.
- `colorRanges` in `levelConfig` (engine.js): `[[2,4],[4,6],[6,8],[8,9],[9,10]]`.
- **Leere Röhren bleiben bei 2.** Reduktion auf 1 wäre riskant (Solvability-BFS
  / Generierungs-Performance) und ist bewusst NICHT Teil dieses Specs.
- Die Härte entsteht aus mehr Farben (früher) + dem Zug-Limit.
- Folgewirkungen sind unkritisch: `HINT_COSTS`, `timerDuration`, `mouseConfig`
  lesen den Tier-Namen über `tierForLevel`/`tierDifficulty` und passen sich
  automatisch an die neuen Bänder an.

## B) Zug-Limit (Kern-Mechanik)

### Konfiguration (`constants.js`)
```js
export const MOVE_LIMIT = {
  enabled:    true,
  onsetLevel: 11,        // ab hier greift das Limit; davor unbegrenzt
  mult:       { MEDIUM: 1.6, HARD: 1.5, EXPERT: 1.35, MASTER: 1.25 },
  floor:      3,         // limit ist mindestens par + floor
  adAmount:   5,         // +Züge pro Ad / Bones-Kauf
  bonesCost:  30,        // Fischgräten für +5 Züge
};
```

### Reine Funktion (`engine.js`)
```js
// Gibt das Zug-Limit für Level n zurück, oder null wenn kein Limit gilt.
export function moveLimit(n) {
  if (!MOVE_LIMIT.enabled || n < MOVE_LIMIT.onsetLevel) return null;
  const par  = parForLevel(n);
  const tier = tierForLevel(n);                 // EASY..MASTER
  const mult = MOVE_LIMIT.mult[tier] ?? 1.5;    // EASY hat keinen Eintrag → fällt nie an (onset=11)
  return Math.max(par + MOVE_LIMIT.floor, Math.ceil(par * mult));
}
```
- `null` = kein Limit (Level < 11 oder Flag aus) → bestehendes Verhalten.
- Limit liegt immer über `par` → 3 Sterne (`calcStars` vs. par) bleiben erreichbar.

### Zug-Zählung & Undo (`main.js` Spiel-State)
- Pro gültigem Gießen: `movesUsed += 1`.
- **Undo** revertiert nur das Brett; `movesUsed` bleibt unverändert (kein Refund).
  Begründung: nur so erzeugt ein Limit bei freiem Undo Druck. Misklick
  korrigieren kostet fair 1 Zug. (Hartes Undo-Limit wurde bewusst verworfen.)
- HUD zeigt Restzüge (`moveLimit(n) - movesUsed`), solange `moveLimit(n) !== null`.
  Anzeige optisch warnend bei wenigen Restzügen (z. B. ≤3).
- Fail-Bedingung: Spieler versucht zu gießen mit `movesUsed >= limit` (bzw.
  Restzüge = 0 und Level nicht gelöst) → Fail-Screen.

## C) Fail-Screen „Züge aufgebraucht" (der Ad-Moment)

Neuer Overlay (`index.html` + Handler in `main.js`), keine Gratis-Dismiss-Option:

1. **🎬 +5 Züge ansehen** — neue Rewarded-Surface `moves`.
   - Free: `showRewarded('moves')` → bei `completed` `movesUsed -= MOVE_LIMIT.adAmount`
     (Limit-Budget erhöhen), Overlay schließen, weiterspielen ohne Fortschrittsverlust.
   - Premium: `claimFree('moves')` (gratis, kein Video — wie Blitz-Continue),
     gleiche Caps/Cooldown.
2. **🐟 +5 Züge für 30 Fischgräten** — `spend(MOVE_LIMIT.bonesCost)` (economy.js);
   bei Erfolg gleiche +5-Logik. Bei zu wenig Bones: `playSound('invalid')`,
   optional Paywall-/Bones-Hinweis.
3. **🔄 Neustart (kostet 1 Leben)** — `consumeLife()`; bei 0 Leben greift die
   bestehende Lives-Empty-Ad-Wall (`showLivesEmpty`). Level neu generieren.
   - Auch das Verlassen des Levels aus dem Fail-Screen heraus kostet 1 Leben
     (kein Gratis-Exit). Nur diese drei Pfade führen aus dem Screen.

### Rewarded-Surface `moves` (`constants.js`)
```js
// in REWARDED_LIMITS:
moves: { daily: 30, cooldownMs: 0, amount: 5 },
```
- Großzügig, da Haupt-Funnel. `amount` redundant zu `MOVE_LIMIT.adAmount` —
  Single Source: Fail-Screen nutzt `MOVE_LIMIT.adAmount` für die Vergabe,
  `REWARDED_LIMITS.moves` nur fürs Cap/Cooldown-Gate.
- Premium-Pfad nutzt `canClaimFree('moves')` / `claimFree('moves')` (bereits in
  rewarded.js vorhanden).

## D) Sicherheit, Tuning, Test

- **Feature-Flag** `MOVE_LIMIT.enabled` + `onsetLevel` + mults → ohne Code-Eingriff
  abschalt-/justierbar. `enabled:false` stellt vollständig das alte Verhalten her.
- **Tests** (Node test runner, Stil `test/rewarded-caps.test.mjs`):
  - `moveLimit(n)`: null für n<11 und bei `enabled:false`; > par für n≥11;
    monoton sinkender Puffer über die Tiers; Floor greift bei kleinen Levels.
  - `levelConfig(n)`: neue Farb-/Tier-Grenzen (z. B. 5 Farben ~Level 13,
    Grenzfälle an Tier-Übergängen 10/11, 30/31, 70/71, 140/141).
- **Rückbau:** Flag aus → altes Verhalten. Tier-Band-Änderung ist reine
  Daten-Änderung in `TIER_DEFS`.

## Betroffene Dateien

- `js/constants.js` — `TIER_DEFS`, `REWARDED_LIMITS.moves`, neues `MOVE_LIMIT`.
- `js/engine.js` — `colorRanges` in `levelConfig`, neue `moveLimit(n)`.
- `js/main.js` — Zug-Zählung, HUD-Restzüge, Fail-Screen-Logik & Handler,
  Import von `claimFree`/`canClaimFree` (bereits vorhanden).
- `index.html` — neuer Fail-Screen-Overlay + HUD-Restzüge-Element.
- `css/*.css` — Styling Overlay + Restzüge-HUD (Warn-Zustand).
- `test/move-limit.test.mjs` (neu) — Unit-Tests.

## Bewusst NICHT im Scope (YAGNI)

- Reduktion leerer Röhren (Solvability-/Performance-Risiko).
- Hartes Undo-Limit (vom Nutzer verworfen).
- Gratis-Aufgeben aus dem Fail-Screen.
- Änderungen an Mini-Games/Blitz (bereits gated).
