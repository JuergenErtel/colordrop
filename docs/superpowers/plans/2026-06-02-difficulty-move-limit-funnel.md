# Difficulty + Zug-Limit-Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Spiel früher fordernd machen (steilere Farbkurve) und dem Kern-Puzzle ab Level 11 ein Zug-Limit mit „Züge aufgebraucht"-Fail-Screen geben, der Rewarded Ads / Fischgräten / Lebensverlust als Ausgänge anbietet — um die Monetarisierung zu verbessern.

**Architecture:** Reine Spiel-Logik (Farbkurve, Zug-Limit) lebt in `engine.js` + `constants.js` und ist per Node-Unittest abgedeckt. Der Zug-Budget-Zähler (`G.movesSpent`, undo-fest) und der Fail-Screen leben in `main.js`/`index.html`. Der Render-Loop (`render.js`) ruft nach dem Move-Settle einen entkoppelten Hook `window.__onMovesExhausted()` auf. Premium nutzt den bestehenden `claimFree`-Pfad aus `rewarded.js`.

**Tech Stack:** Vanilla ES-Module (Browser), Node test runner (`node --test`) für reine Logik.

**Spec:** `docs/superpowers/specs/2026-06-02-difficulty-move-limit-funnel-design.md`

---

## File Structure

- `js/constants.js` — `TIER_DEFS` (neue Bänder), neues `MOVE_LIMIT`-Objekt, `REWARDED_LIMITS.moves`.
- `js/engine.js` — `colorRanges` in `levelConfig`, neue reine Funktion `moveLimit(n)`.
- `js/main.js` — `G.movesSpent` (Reset/Inkrement), Restzüge-HUD, Fail-Screen-Handler + `window.__onMovesExhausted`.
- `js/render.js` — ein Hook-Aufruf nach Win-Check.
- `index.html` — Fail-Screen-Overlay + Restzüge-HUD-Element.
- `css/overlays.css` — Styling Restzüge-HUD (Warn-Zustand). Overlay nutzt bestehende `.overlay`/`.win-*`-Klassen.
- `test/move-limit.test.mjs` (neu) — Unittests für `moveLimit` und neue `levelConfig`-Grenzen.

---

## Task 1: Neue Tier-Bänder + steilere Farbkurve

**Files:**
- Modify: `js/constants.js` (TIER_DEFS, ~Zeile 152–156)
- Modify: `js/engine.js` (`colorRanges` in `levelConfig`, ~Zeile 49–55)
- Test: `test/move-limit.test.mjs` (neu)

- [ ] **Step 1: Failing-Test für die neuen Farbgrenzen schreiben**

Erstelle `test/move-limit.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelConfig } from '../js/engine.js';

test('levelConfig color ramp hits the new tier boundaries', () => {
  const colors = (n) => levelConfig(n).colors.length;
  // EASY 1-10: 2 -> 4
  assert.equal(colors(1), 2);
  assert.equal(colors(10), 4);
  // MEDIUM 11-30: 4 -> 6
  assert.equal(colors(11), 4);
  assert.equal(colors(30), 6);
  // HARD 31-70: 6 -> 8
  assert.equal(colors(31), 6);
  assert.equal(colors(70), 8);
  // EXPERT 71-140: 8 -> 9
  assert.equal(colors(71), 8);
  assert.equal(colors(140), 9);
  // MASTER 141-300: 9 -> 10
  assert.equal(colors(141), 9);
  assert.equal(colors(300), 10);
});

test('levelConfig always keeps 2 empty tubes', () => {
  for (const n of [1, 11, 50, 140, 300]) {
    assert.equal(levelConfig(n).empty, 2);
  }
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `node --test test/move-limit.test.mjs`
Expected: FAIL (alte Bänder liefern z. B. `colors(11) === 3` statt `4`).

- [ ] **Step 3: TIER_DEFS in `js/constants.js` ersetzen**

Ersetze den Block (aktuell):

```js
  { name: 'EASY',   minLevel:   1, maxLevel:  15 },
  { name: 'MEDIUM', minLevel:  16, maxLevel:  45 },
  { name: 'HARD',   minLevel:  46, maxLevel: 100 },
  { name: 'EXPERT', minLevel: 101, maxLevel: 180 },
  { name: 'MASTER', minLevel: 181, maxLevel: 300 },
```

durch:

```js
  { name: 'EASY',   minLevel:   1, maxLevel:  10 },
  { name: 'MEDIUM', minLevel:  11, maxLevel:  30 },
  { name: 'HARD',   minLevel:  31, maxLevel:  70 },
  { name: 'EXPERT', minLevel:  71, maxLevel: 140 },
  { name: 'MASTER', minLevel: 141, maxLevel: 300 },
```

- [ ] **Step 4: `colorRanges` in `js/engine.js` ersetzen**

Ersetze (aktuell):

```js
  const colorRanges = [
    [2, 3],   // EASY
    [3, 5],   // MEDIUM
    [5, 7],   // HARD
    [7, 9],   // EXPERT
    [9, 10],  // MASTER
  ];
```

durch:

```js
  const colorRanges = [
    [2, 4],   // EASY
    [4, 6],   // MEDIUM
    [6, 8],   // HARD
    [8, 9],   // EXPERT
    [9, 10],  // MASTER
  ];
```

Aktualisiere den Kommentarblock darüber (Zeilen „EASY (1-15): 2 → 3 colors" usw.) auf die neuen Bänder/Farben.

- [ ] **Step 5: Test laufen lassen, Erfolg bestätigen**

Run: `node --test test/move-limit.test.mjs`
Expected: PASS (beide Tests grün).

- [ ] **Step 6: Commit**

```bash
git add js/constants.js js/engine.js test/move-limit.test.mjs
git commit -m "feat(difficulty): steilere Farbkurve + frühere Tier-Bänder"
```

---

## Task 2: `MOVE_LIMIT`-Konfig + reine `moveLimit(n)`-Funktion

**Files:**
- Modify: `js/constants.js` (neues Export-Objekt, nach `REWARDED_LIMITS`)
- Modify: `js/engine.js` (neue Funktion nach `parForLevel`, ~Zeile 77)
- Test: `test/move-limit.test.mjs`

- [ ] **Step 1: Failing-Tests für `moveLimit` ergänzen**

Hänge an `test/move-limit.test.mjs` an:

```js
import { moveLimit, parForLevel } from '../js/engine.js';

test('moveLimit is null below the onset level', () => {
  for (const n of [1, 5, 10]) assert.equal(moveLimit(n), null);
});

test('moveLimit applies from level 11 and stays above par', () => {
  for (const n of [11, 30, 70, 140, 300]) {
    const lim = moveLimit(n);
    assert.equal(typeof lim, 'number');
    assert.ok(lim > parForLevel(n), `limit ${lim} must exceed par ${parForLevel(n)} at level ${n}`);
  }
});

test('moveLimit honours the par+floor minimum', () => {
  const n = 11;
  assert.ok(moveLimit(n) >= parForLevel(n) + 3);
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag bestätigen**

Run: `node --test test/move-limit.test.mjs`
Expected: FAIL mit „moveLimit is not a function" / „export 'moveLimit'".

- [ ] **Step 3: `MOVE_LIMIT` in `js/constants.js` ergänzen**

Füge direkt nach dem `REWARDED_LIMITS`-Block (nach dessen schließender `};`, ~Zeile 200) ein:

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

- [ ] **Step 4: `moveLimit(n)` in `js/engine.js` implementieren**

Erweitere den Import oben in `engine.js`:

```js
import {
  COLOR_KEYS, TIER_DEFS, THEMES,
  TUTORIAL_TUBES, MOVE_LIMIT,
} from './constants.js';
```

Füge direkt nach `parForLevel` (nach dessen schließender `}`, ~Zeile 77) ein:

```js
// Gibt das Zug-Limit für Level n zurück, oder null wenn kein Limit gilt.
export function moveLimit(n) {
  if (!MOVE_LIMIT.enabled || n < MOVE_LIMIT.onsetLevel) return null;
  const par  = parForLevel(n);
  const mult = MOVE_LIMIT.mult[tierForLevel(n)] ?? 1.5;
  return Math.max(par + MOVE_LIMIT.floor, Math.ceil(par * mult));
}
```

- [ ] **Step 5: Test laufen lassen, Erfolg bestätigen**

Run: `node --test test/move-limit.test.mjs`
Expected: PASS (alle Tests grün).

- [ ] **Step 6: Commit**

```bash
git add js/constants.js js/engine.js test/move-limit.test.mjs
git commit -m "feat(movelimit): MOVE_LIMIT-Konfig + reine moveLimit(n)-Funktion"
```

---

## Task 3: Rewarded-Surface `moves`

**Files:**
- Modify: `js/constants.js` (`REWARDED_LIMITS`, ~Zeile 195–200)

- [ ] **Step 1: `moves`-Eintrag ergänzen**

Im `REWARDED_LIMITS`-Objekt nach der `continue`-Zeile einfügen:

```js
  moves:    { daily: 30, cooldownMs: 0, amount: 5 },     // Haupt-Funnel: +5 Züge
```

(Das `amount`-Feld dient nur der Dokumentation; die Vergabe nutzt `MOVE_LIMIT.adAmount`. Das Cap/Cooldown-Gate liest `daily`/`cooldownMs`.)

- [ ] **Step 2: Rewarded-Tests laufen lassen (Regression)**

Run: `node --test test/rewarded-caps.test.mjs`
Expected: PASS (9 Tests grün — neuer Surface bricht nichts).

- [ ] **Step 3: Commit**

```bash
git add js/constants.js
git commit -m "feat(rewarded): neue Surface 'moves' (Haupt-Funnel)"
```

---

## Task 4: Undo-fester Zug-Budget-Zähler `G.movesSpent`

**Files:**
- Modify: `js/main.js` (`generateLevel` ~Zeile 713; `doMove` ~Zeile 823; G-State-Literal ~Zeile 84)

Hintergrund: `G.moves` wird beim Undo dekrementiert (main.js:861) und steuert die Sterne. Das Limit braucht einen separaten, undo-festen Zähler.

- [ ] **Step 1: Initialfeld im G-State deklarieren**

Im G-Objekt-Literal (bei `moves:` / `history:`, ~Zeile 84) ergänzen, damit das Feld existiert:

```js
  movesSpent:     0,
```

- [ ] **Step 2: Zähler in `generateLevel` zurücksetzen**

In `generateLevel` direkt nach `G.moves = 0;` (Zeile 713) einfügen:

```js
  G.movesSpent   = 0;   // undo-fester Budget-Zähler für das Zug-Limit
```

- [ ] **Step 3: Zähler in `doMove` inkrementieren**

In `doMove` direkt nach `G.moves++;` (Zeile 823) einfügen:

```js
  G.movesSpent++;       // wird vom Undo NICHT zurückgesetzt (Limit-Druck)
```

(Bewusst KEIN Dekrement in `undo()` — undo gibt das Limit-Budget nicht zurück.)

- [ ] **Step 4: Syntax-Check**

Run: `node --check js/main.js`
Expected: keine Ausgabe (OK).

- [ ] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat(movelimit): undo-fester Budget-Zähler G.movesSpent"
```

---

## Task 5: Restzüge-HUD

**Files:**
- Modify: `index.html` (HUD-Bereich neben `moveCount`)
- Modify: `js/main.js` (`import` Zeile 39; `updateHUD`, ~Zeile 1056–1075)
- Modify: `css/overlays.css` (Warn-Styling)

- [ ] **Step 1: HUD-Element in `index.html` ergänzen**

Suche das Element mit `id="moveCountWrap"` (das den Zug-Zähler umschließt). Füge unmittelbar nach diesem Wrap-Element ein:

```html
<div id="movesLeftWrap" class="moves-left hidden">Züge übrig: <b id="movesLeft">–</b></div>
```

- [ ] **Step 2: Import in `js/main.js` erweitern**

Ergänze in der `import { ... } from './engine.js';`-Zeile (Zeile 39) `moveLimit`:

```js
  calcStars, checkWinState, isSolved, canMove, moveLimit,
```

- [ ] **Step 3: Restzüge in `updateHUD` rendern**

Suche in `updateHUD` die Stelle nach dem Block, der `moveCount` setzt (nach ~Zeile 1075). Füge ein:

```js
  // Restzüge-HUD (nur wenn ein Limit gilt)
  const lim       = moveLimit(LEVEL.current);
  const mlWrap    = document.getElementById('movesLeftWrap');
  const mlVal     = document.getElementById('movesLeft');
  if (mlWrap && mlVal) {
    if (lim === null || G.tutorial || TETRIS.active) {
      mlWrap.classList.add('hidden');
    } else {
      const left = Math.max(0, lim - G.movesSpent);
      mlVal.textContent = left;
      mlWrap.classList.remove('hidden');
      mlWrap.classList.toggle('moves-left--warn', left <= 3);
    }
  }
```

- [ ] **Step 4: Warn-Styling in `css/overlays.css` ergänzen**

Am Ende der Datei einfügen:

```css
.moves-left { font-size: 0.85rem; opacity: 0.85; }
.moves-left.hidden { display: none; }
.moves-left--warn { color: #E8897A; font-weight: 700; opacity: 1; animation: movesPulse 0.6s ease-in-out infinite alternate; }
@keyframes movesPulse { from { transform: scale(1); } to { transform: scale(1.12); } }
```

- [ ] **Step 5: Syntax-Check**

Run: `node --check js/main.js`
Expected: keine Ausgabe (OK).

- [ ] **Step 6: Manuelle Verifikation**

Run: Spiel lokal öffnen (siehe Task 8), Level 1 → kein „Züge übrig"; Level 11+ → „Züge übrig: N" sichtbar, sinkt pro Gießen, springt bei Undo NICHT zurück.

- [ ] **Step 7: Commit**

```bash
git add index.html js/main.js css/overlays.css
git commit -m "feat(movelimit): Restzüge-HUD mit Warn-Zustand"
```

---

## Task 6: Fail-Screen-Overlay (HTML)

**Files:**
- Modify: `index.html` (neuer Overlay neben den anderen `.overlay`-Blöcken, z. B. nach `timeoutOverlay`)

- [ ] **Step 1: Overlay-Markup einfügen**

Füge nach dem schließenden `</div>` des `id="timeoutOverlay"`-Blocks ein:

```html
<div id="movesOutOverlay" class="overlay">
  <div class="win-card">
    <div class="win-icon">🫙</div>
    <h2 class="win-title">Züge aufgebraucht!</h2>
    <p class="win-sub">Hol dir mehr Züge oder starte neu.</p>
    <div class="win-actions">
      <button class="win-btn" id="movesAdBtn" type="button">🎬 +5 Züge ansehen</button>
      <button class="win-btn win-btn--secondary" id="movesBonesBtn" type="button">🐟 +5 Züge (30)</button>
      <button class="win-btn win-btn--secondary" id="movesRestartBtn" type="button">🔄 Neustart (−1 Leben)</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verifikation (Markup lädt)**

Run: Spiel lokal öffnen (Task 8) und in der Browser-Konsole prüfen:
`document.getElementById('movesOutOverlay') !== null`
Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(movelimit): Fail-Screen-Overlay 'Züge aufgebraucht'"
```

---

## Task 7: Fail-Screen-Logik + Render-Hook

**Files:**
- Modify: `js/main.js` (Imports Zeile 13–17; neuer Handler-Block nach ~Zeile 2212; `window.__onMovesExhausted`)
- Modify: `js/render.js` (Hook-Aufruf nach Win-Check, ~Zeile 320–323)

- [ ] **Step 1: Imports in `js/main.js` erweitern**

Ergänze die `economy.js`-Import-Gruppe (Zeile 13–17) um `spend, canAfford`:

```js
  getBalance, setBalance, earn, calcWinReward, isPremium, setPremium,
  spend, canAfford,
```

Stelle sicher, dass `MOVE_LIMIT` aus `constants.js` importiert ist (zur bestehenden `from './constants.js'`-Import-Gruppe hinzufügen, falls nicht vorhanden).

`claimFree`, `canClaimFree`, `showRewarded`, `canShowRewarded` (rewarded.js) sowie `consumeLife`, `hasLife` (lives.js) sind bereits importiert. `moveLimit` wird in Task 5 importiert.

- [ ] **Step 2: Fail-Screen-Logik in `js/main.js` einfügen**

Füge nach dem `timeoutContinueBtn`-Handler-Block (nach ~Zeile 2212) ein:

```js
// ── Zug-Limit: Fail-Screen "Züge aufgebraucht" ──────────────────────────────
function grantExtraMoves() {
  // Budget erhöhen, indem der Verbrauch reduziert wird → Limit - movesSpent wächst.
  G.movesSpent = Math.max(0, G.movesSpent - MOVE_LIMIT.adAmount);
  document.getElementById('movesOutOverlay').classList.remove('show');
  ANIM.busy = false;
  updateHUD();
  playSound('click');
}

// Vom Render-Loop aufgerufen, sobald ein Zug ohne Sieg gelandet ist.
window.__onMovesExhausted = function () {
  if (G.won || G.tutorial || TETRIS.active) return;
  if (checkWinState(G.tubes)) return;            // Sieg-Move → kein Fail
  const lim = moveLimit(LEVEL.current);
  if (lim === null || G.movesSpent < lim) return;

  const overlay = document.getElementById('movesOutOverlay');
  if (!overlay || overlay.classList.contains('show')) return;

  // Ad-Button nur zeigen, wenn Gate erlaubt (Premium: gratis via claimFree).
  const adBtn  = document.getElementById('movesAdBtn');
  const adGate = isPremium() ? canClaimFree('moves') : canShowRewarded('moves');
  adBtn.style.display = adGate.ok ? '' : 'none';
  adBtn.textContent   = isPremium() ? '▶️ +5 Züge' : '🎬 +5 Züge ansehen';

  const bonesBtn = document.getElementById('movesBonesBtn');
  bonesBtn.textContent = '🐟 +5 Züge (' + MOVE_LIMIT.bonesCost + ')';

  overlay.classList.add('show');
  playSound('invalid');
};

document.getElementById('movesAdBtn').addEventListener('click', async () => {
  const { completed } = isPremium() ? claimFree('moves') : await showRewarded('moves');
  if (!completed) { playSound('invalid'); return; }
  grantExtraMoves();
});

document.getElementById('movesBonesBtn').addEventListener('click', () => {
  if (!canAfford(MOVE_LIMIT.bonesCost)) { playSound('invalid'); return; }
  spend(MOVE_LIMIT.bonesCost);
  updateBonesDisplay();
  grantExtraMoves();
});

document.getElementById('movesRestartBtn').addEventListener('click', () => {
  document.getElementById('movesOutOverlay').classList.remove('show');
  if (!isPremium() && !hasLife()) { showLivesEmpty(() => generateLevel(LEVEL.current)); return; }
  if (!isPremium()) { consumeLife(); updateLivesDisplay(); }
  generateLevel(LEVEL.current);
  invalidateRoomDecorCache();
});
```

- [ ] **Step 3: Render-Hook in `js/render.js` einfügen**

Suche den immediate-Win-Block (~Zeile 320–323):

```js
  const won = (G.tutorial ? checkWinTutorial(G.tubes) : checkWinState(G.tubes)) && !G.won;
  if (won) {
    G.won = true;
```

Finde das Ende dieses `if (won) { ... }`-Blocks und füge unmittelbar nach dessen schließender `}` ein:

```js
  // Zug-Limit: nach jedem gelandeten Zug prüfen, ob das Budget verbraucht ist.
  if (typeof window !== 'undefined' && window.__onMovesExhausted) window.__onMovesExhausted();
```

- [ ] **Step 4: Syntax-Check beider Dateien**

Run: `node --check js/main.js && node --check js/render.js`
Expected: keine Ausgabe (OK).

- [ ] **Step 5: Regressions-Tests**

Run: `node --test test/`
Expected: alle Tests grün (move-limit + rewarded-caps).

- [ ] **Step 6: Manuelle Verifikation (siehe Task 8 zum Start)**

Szenario Free-User (kein Premium-Abo):
1. Level 11+ spielen, absichtlich Züge verschwenden bis „Züge übrig: 0".
2. Nächster Gießversuch → Overlay „Züge aufgebraucht!" erscheint.
3. „🎬 +5 Züge ansehen" → Preview-Video → +5 Züge, weiterspielen ohne Reset.
4. Erneut leer → „🐟 +5 Züge (30)" → −30 Fischgräten, +5 Züge (bei genug Bones).
5. Erneut leer → „🔄 Neustart (−1 Leben)" → 1 Leben weg, Level neu; bei 0 Leben → Lives-Empty-Wall.
6. Level ≤ 10 → niemals Fail-Screen.

Szenario Premium:
1. Level 11+, Limit greift, HUD sichtbar.
2. Fail-Screen → Ad-Button zeigt „▶️ +5 Züge" und gibt sofort gratis +5 (kein Video).

- [ ] **Step 7: Commit**

```bash
git add js/main.js js/render.js
git commit -m "feat(movelimit): Fail-Screen-Logik (+5 Ad/Bones, Neustart kostet Leben) + Render-Hook"
```

---

## Task 8: Lokaler Start, Gesamt-Verifikation & Deploy

**Files:** keine Code-Änderung (außer evtl. Bugfix-Commits)

- [ ] **Step 1: Spiel lokal starten**

Run (PowerShell, Projektwurzel): `python -m http.server 8000`
Öffne `http://localhost:8000` im Browser. (Alternativ vorhandenes Dev-Setup nutzen, falls dokumentiert.)

- [ ] **Step 2: Premium-Status für Free-Test entfernen**

Browser-Konsole:
```js
localStorage.removeItem('kittysort_subscription'); location.reload();
```

- [ ] **Step 3: Alle Szenarien aus Task 7 Step 6 durchspielen** (Free + Premium).

- [ ] **Step 4: Voller Testlauf**

Run: `node --test test/`
Expected: alle grün.

- [ ] **Step 5: Build stempeln**

Run: `node tools/stamp-build.mjs`
Expected: „Build gestempelt: <hash> · <datum>".

- [ ] **Step 6: Commit + Push (Deploy auf kittysort.de)**

```bash
git add index.html version.txt
git commit -m "chore(build): stamp deploy move-limit-funnel"
git push origin master
```

- [ ] **Step 7: Pipeline-Update**

```powershell
pipeline-update -Slug colordrop -Summary "Schwierigkeit steiler + Zug-Limit-Funnel ab L11 (Fail-Screen mit Ad/Bones/Leben) live" -Todos @("Live-Balancing der mult-Werte beobachten", "Ad-Fill-Rate nach AdSense-Live pruefen")
```

---

## Self-Review

**Spec-Coverage:**
- A) Farbkurve + Tier-Bänder → Task 1 ✓
- B) Zug-Limit (Konfig, reine Funktion, undo-fester Zähler, HUD, Fail-Bedingung) → Tasks 2, 4, 5, 7 ✓
- C) Fail-Screen (Ad/Bones/Neustart, Surface `moves`, Premium-Pfad) → Tasks 3, 6, 7 ✓
- D) Feature-Flag, Tests, Rückbau → `MOVE_LIMIT.enabled` (Task 2), Tests (Tasks 1–2), Flag-Rückbau dokumentiert ✓

**Platzhalter:** keine — alle Code-Schritte enthalten vollständigen Code.

**Typ-Konsistenz:** `G.movesSpent` (Task 4) durchgängig in HUD (Task 5) und Fail-Logik (Task 7) genutzt; `moveLimit()` Rückgabe `number|null` überall mit `=== null`-Guard behandelt; `MOVE_LIMIT.adAmount`/`bonesCost` konsistent referenziert; `window.__onMovesExhausted` in render.js aufgerufen, in main.js definiert.

**Bekannte Annahmen (beim Ausführen verifizieren):**
- `economy.js` exportiert `spend` und `canAfford` (von `lives.js` genutzt — beim Import bestätigen; falls anders benannt, an die tatsächlichen Exports anpassen).
- `updateBonesDisplay`, `updateLivesDisplay`, `showLivesEmpty`, `invalidateRoomDecorCache`, `ANIM`, `TETRIS`, `LEVEL` existieren bereits in main.js (im Plan referenziert — beim Einfügen vorhanden).
- Genaue Zeilen für `moveCountWrap`-Nachbarschaft und das Ende des `if (won)`-Blocks in render.js per Kontext-Suche bestätigen, nicht blind auf Zeilennummern verlassen.
