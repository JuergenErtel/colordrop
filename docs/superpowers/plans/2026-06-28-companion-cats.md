# Begleiter-Katzen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine additive „Begleiter-Katzen"-Schicht, in der jede gesammelte Katze eine von drei Helfer-Fähigkeiten (Nickerchen-Korb, Pfoten-Trick, Magnet-Schnurren) ins Standard-Levelspiel einbringt, bezahlt mit Fischgräten — als sichtbares Gameplay-Unterscheidungsmerkmal gegen die App-Store-Ablehnung 4.3(a).

**Architecture:** Reine Zustandslogik in neuem `js/companion.js` (DOM-frei, node-testbar), die das `tubes`-Array transformiert. Datenschicht in `constants.js`/`cats.js`/`storage.js`. UI- und Ökonomie-Verdrahtung im bestehenden `js/main.js` über das globale `G`-Spielzustandsobjekt. Kern-Mechanik (`canMove`, `generateTubes`, `solveHint`) bleibt unangetastet; Fähigkeiten setzen additiv obendrauf.

**Tech Stack:** Vanilla ES-Module (kein Framework), Canvas-Rendering, `node --test` mit `.test.mjs`, Capacitor 8 für den iOS-Build.

## Global Constraints

- **Lösbarkeits-Garantie:** Keine Fähigkeit darf ein lösbares Level unlösbar machen. `applyNapBasket` ist beweisbar sicher (mehr Platz). `applyPawTrick`/`applyMagnet` werden zur Laufzeit über `isSolvable(next) >= 0` abgesichert — schlägt die Prüfung fehl, wird die Aktion abgelehnt und **keine** Fischgräten abgezogen.
- **Keine Material-Löschung:** Fähigkeiten bewegen nur Knäuel oder fügen Röhren hinzu; nie wird ein Knäuel entfernt.
- **Nur Standard-Levelmodus** im ersten Wurf — nicht in Blitz/Daily/Dog/Mouse/Endless/Tetris.
- **Tube-Kapazität ist fix 4** (`CAPACITY` in `engine.js`).
- **Bones-Ökonomie ausschließlich über `economy.js`** (`canAfford`, `spend`, `isPremium`) — keine neue Währung.
- **Kosten** (`COMPANION_COSTS`): Pfoten-Trick 30, Nickerchen-Korb 40, Magnet-Schnurren 50 Fischgräten. Club/Lifetime (`isPremium()`): 1× gratis pro Level, danach normaler Preis.
- **Fähigkeitseinsatz zählt nicht** gegen `MOVE_LIMIT` und erhöht `G.moves` nicht.
- **Sprache:** UI-Texte und Kommentare auf Deutsch (projektüblich).
- **Persistenz** robust gegen `localStorage`-Fehler (try/catch wie in `storage.js`).

---

### Task 1: Kern-Logik `companion.js` + `isSolvable`-Export

**Files:**
- Modify: `js/engine.js` (Zeile 187 `function isSolvable` → exportieren; Zeile 8 `CAPACITY` → exportieren)
- Create: `js/companion.js`
- Test: `test/companion.test.mjs`

**Interfaces:**
- Consumes: aus `engine.js`: `export function isSolvable(tubes, limit?)` (Move-Anzahl oder -1), `export const CAPACITY` (=4), bereits vorhandenes `generateTubes(n)`, `isSolved(tube)`.
- Produces:
  - `applyNapBasket(tubes) -> tubes` (neue Kopie mit einer zusätzlichen leeren Röhre)
  - `applyPawTrick(tubes, from, to) -> tubes | null` (oberstes Knäuel von `from` nach `to`, ignoriert Farbregel; `null` wenn Vorbedingung verletzt)
  - `applyMagnet(tubes, color, targetIdx) -> tubes` (zusammenhängende gleichfarbige Top-Gruppen aller anderen Röhren nach `targetIdx`, soweit Kapazität reicht)
  - `pawTrickTargets(tubes, from) -> number[]` (Indizes nicht-voller Zielröhren ≠ from)

- [ ] **Step 1: `isSolvable` und `CAPACITY` aus `engine.js` exportieren**

In `js/engine.js` Zeile 8:
```js
export const CAPACITY = 4; // balls per tube (fixed)
```
In `js/engine.js` Zeile 187:
```js
export function isSolvable(tubes, limit = 200000) {
```
(Nur das Schlüsselwort `export` voranstellen — Funktionsrumpf unverändert.)

- [ ] **Step 2: Failing test schreiben** — `test/companion.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTubes, isSolvable, CAPACITY } from '../js/engine.js';
import {
  applyNapBasket, applyPawTrick, applyMagnet, pawTrickTargets,
} from '../js/companion.js';

test('CAPACITY ist 4', () => {
  assert.equal(CAPACITY, 4);
});

test('applyNapBasket fügt genau eine leere Röhre hinzu, ohne das Original zu mutieren', () => {
  const tubes = [['a', 'b'], ['b', 'a'], []];
  const next = applyNapBasket(tubes);
  assert.equal(next.length, tubes.length + 1);
  assert.deepEqual(next[next.length - 1], []);
  // Original unverändert (reine Funktion)
  assert.equal(tubes.length, 3);
  // Inhalte kopiert, nicht referenziert
  next[0].push('x');
  assert.deepEqual(tubes[0], ['a', 'b']);
});

test('applyNapBasket erhält Lösbarkeit für eine Stichprobe echter Level', () => {
  for (let n = 1; n <= 60; n++) {
    const tubes = generateTubes(n);
    if (isSolvable(tubes) < 0) continue; // nur lösbare Ausgangslagen prüfen
    assert.ok(
      isSolvable(applyNapBasket(tubes)) >= 0,
      `Nickerchen-Korb machte Level ${n} unlösbar`,
    );
  }
});

test('applyPawTrick verschiebt oberstes Knäuel regelwidrig und kopiert', () => {
  const tubes = [['rot', 'blau'], ['gruen']]; // blau dürfte nicht auf gruen
  const next = applyPawTrick(tubes, 0, 1);
  assert.deepEqual(next[0], ['rot']);
  assert.deepEqual(next[1], ['gruen', 'blau']);
  assert.deepEqual(tubes[0], ['rot', 'blau']); // Original unberührt
});

test('applyPawTrick gibt null bei verletzter Vorbedingung', () => {
  assert.equal(applyPawTrick([[], ['a']], 0, 1), null);        // Quelle leer
  assert.equal(applyPawTrick([['a','b','c','d'], ['x','y','z','w']], 1, 0), null); // Ziel voll
  assert.equal(applyPawTrick([['a']], 0, 0), null);            // from === to
});

test('pawTrickTargets liefert nur nicht-volle Röhren ungleich from', () => {
  const tubes = [['a'], ['b','b','b','b'], []];
  assert.deepEqual(pawTrickTargets(tubes, 0), [2]); // 1 ist voll, 0 ist from
});

test('applyMagnet zieht gleichfarbige Top-Gruppen in die Zielröhre', () => {
  // Ziel idx 0 (['rot']). rot liegt oben in Röhre 1 und 2.
  const tubes = [['rot'], ['blau', 'rot'], ['rot', 'rot']];
  const next = applyMagnet(tubes, 'rot', 0);
  // 1×rot aus Röhre1 + 2×rot aus Röhre2 = 3, plus vorhandenes → Kapazität 4 max
  assert.equal(next[0].filter(c => c === 'rot').length, 4);
  assert.deepEqual(next[1], ['blau']);
  // Röhre2 hatte 2 rot; nur soviel wie Kapazität zulässt wurde gezogen
  assert.ok(next[0].length <= CAPACITY);
});

test('applyMagnet respektiert Kapazität und lässt Überschuss liegen', () => {
  const tubes = [['rot', 'rot', 'rot'], ['rot', 'rot']]; // Ziel hat schon 3 rot
  const next = applyMagnet(tubes, 'rot', 0);
  assert.equal(next[0].length, CAPACITY);          // genau bis 4 gefüllt
  assert.equal(next[1].length, 1);                 // 1 rot blieb liegen
});
```

- [ ] **Step 3: Test ausführen, Fehlschlag bestätigen**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/companion.js'` bzw. fehlende Exporte.

- [ ] **Step 4: `js/companion.js` implementieren**

```js
'use strict';

// Reine Zustandslogik für Begleiter-Fähigkeiten. DOM-frei und ohne Ökonomie-/
// Storage-Import, damit alles in Node unit-testbar bleibt. Die Verdrahtung mit
// Fischgräten und UI passiert in main.js.

import { CAPACITY } from './engine.js';

function clone(tubes) { return tubes.map(t => [...t]); }

// 🧺 Nickerchen-Korb: eine zusätzliche leere Röhre. Mehr Platz kann ein Level
// niemals unlösbar machen (beweisbar sicher).
export function applyNapBasket(tubes) {
  return [...clone(tubes), []];
}

// 🐾 Pfoten-Trick: verschiebt das oberste Knäuel von `from` nach `to` und
// ignoriert dabei die Farbregel. Gibt null zurück, wenn der Zug unmöglich ist.
export function applyPawTrick(tubes, from, to) {
  if (from === to) return null;
  if (!tubes[from] || tubes[from].length === 0) return null;
  if (!tubes[to] || tubes[to].length >= CAPACITY) return null;
  const next = clone(tubes);
  next[to].push(next[from].pop());
  return next;
}

// Gültige Ziele für den Pfoten-Trick: nicht-volle Röhren ungleich `from`.
export function pawTrickTargets(tubes, from) {
  const out = [];
  for (let i = 0; i < tubes.length; i++) {
    if (i === from) continue;
    if (tubes[i].length < CAPACITY) out.push(i);
  }
  return out;
}

// 🧲 Magnet-Schnurren: zieht aus allen anderen Röhren die zusammenhängende
// gleichfarbige Top-Gruppe der gewählten Farbe in `targetIdx`, soweit die
// Kapazität reicht. Überschuss bleibt liegen.
export function applyMagnet(tubes, color, targetIdx) {
  const next = clone(tubes);
  const target = next[targetIdx];
  for (let i = 0; i < next.length; i++) {
    if (i === targetIdx) continue;
    const src = next[i];
    while (
      target.length < CAPACITY &&
      src.length > 0 &&
      src[src.length - 1] === color
    ) {
      target.push(src.pop());
    }
  }
  return next;
}
```

- [ ] **Step 5: Test ausführen, Erfolg bestätigen**

Run: `npm test`
Expected: PASS (alle `companion.test.mjs`-Fälle grün, bestehende Tests weiterhin grün).

- [ ] **Step 6: Commit**

```bash
git add js/engine.js js/companion.js test/companion.test.mjs
git commit -m "feat(companion): reine Fähigkeits-Logik + isSolvable/CAPACITY-Export"
```

---

### Task 2: Datenschicht — Fähigkeits-Konstanten, Katzen-Mapping, Kosten-Helfer, Persistenz

**Files:**
- Modify: `js/constants.js` (neue Exporte am Ende des Konstanten-Blocks, nahe `COSTS`/`HINT_COSTS` ~Zeile 235)
- Modify: `js/cats.js` (Feld `ability` an jedem Katzen-Objekt)
- Modify: `js/storage.js` (selectedCompanion-Persistenz)
- Create: `js/companion-cost.js` (reine Kosten-Logik)
- Test: `test/companion-cost.test.mjs`, `test/companion-data.test.mjs`

**Interfaces:**
- Consumes: `CATS` aus `cats.js`; `COMPANION_ABILITIES`, `COMPANION_COSTS` aus `constants.js`.
- Produces:
  - `constants.js`: `export const COMPANION_ABILITIES` (Array `{ id, label, emoji, desc }` mit ids `'nap' | 'paw' | 'magnet'`), `export const COMPANION_COSTS = { paw: 30, nap: 40, magnet: 50 }`
  - `cats.js`: jedes Katzen-Objekt hat `ability: 'nap' | 'paw' | 'magnet'`
  - `companion-cost.js`: `companionCost(abilityId, { premium, freeUsedThisLevel }) -> number` (0 = gratis)
  - `storage.js`: `loadSelectedCompanion() -> string|null`, `saveSelectedCompanion(catId)`

- [ ] **Step 1: Failing tests schreiben**

`test/companion-data.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATS } from '../js/cats.js';
import { COMPANION_ABILITIES, COMPANION_COSTS } from '../js/constants.js';

const ABILITY_IDS = ['nap', 'paw', 'magnet'];

test('jede Katze hat eine gültige Fähigkeit', () => {
  for (const cat of CATS) {
    assert.ok(ABILITY_IDS.includes(cat.ability), `Katze ${cat.id} hat ungültige ability: ${cat.ability}`);
  }
});

test('COMPANION_ABILITIES deckt alle drei ids ab', () => {
  const ids = COMPANION_ABILITIES.map(a => a.id).sort();
  assert.deepEqual(ids, [...ABILITY_IDS].sort());
  for (const a of COMPANION_ABILITIES) {
    assert.ok(a.label && a.emoji && a.desc, `Fähigkeit ${a.id} fehlt label/emoji/desc`);
  }
});

test('COMPANION_COSTS hat positive Kosten je Fähigkeit', () => {
  for (const id of ABILITY_IDS) {
    assert.ok(COMPANION_COSTS[id] > 0, `Kosten für ${id} fehlen`);
  }
});
```

`test/companion-cost.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionCost } from '../js/companion-cost.js';

test('Nicht-Premium zahlt vollen Preis', () => {
  assert.equal(companionCost('paw', { premium: false, freeUsedThisLevel: false }), 30);
  assert.equal(companionCost('magnet', { premium: false, freeUsedThisLevel: true }), 50);
});

test('Premium: erste Nutzung pro Level gratis', () => {
  assert.equal(companionCost('magnet', { premium: true, freeUsedThisLevel: false }), 0);
});

test('Premium: nach Gratis-Nutzung normaler Preis', () => {
  assert.equal(companionCost('magnet', { premium: true, freeUsedThisLevel: true }), 50);
});
```

- [ ] **Step 2: Tests ausführen, Fehlschlag bestätigen**

Run: `npm test`
Expected: FAIL — fehlende Exporte/Module/`ability`-Felder.

- [ ] **Step 3: `COMPANION_ABILITIES` + `COMPANION_COSTS` in `constants.js` ergänzen**

Direkt nach `export const COSTS = { hint: 15, extraUndo: 10 };` (Zeile ~235):
```js
// ── Begleiter-Fähigkeiten (Helfer-Katzen) ────────────────────────────────
export const COMPANION_ABILITIES = [
  { id: 'nap',    emoji: '🧺', label: 'Nickerchen-Korb', desc: 'Legt für dieses Level einen zusätzlichen leeren Korb an.' },
  { id: 'paw',    emoji: '🐾', label: 'Pfoten-Trick',    desc: 'Ein Zug, der die Farbregel ignoriert.' },
  { id: 'magnet', emoji: '🧲', label: 'Magnet-Schnurren', desc: 'Zieht alle obenliegenden Knäuel einer Farbe zusammen.' },
];

export const COMPANION_COSTS = { paw: 30, nap: 40, magnet: 50 };
```

- [ ] **Step 4: `ability`-Feld an jeder Katze in `cats.js` ergänzen**

An jedem Objekt im `CATS`-Array ein `ability`-Feld setzen. Verteilung grob gleichmäßig über die drei Klassen — Reihenfolge im Array zyklisch `nap`, `paw`, `magnet`, `nap`, … Beispiel für die ersten Einträge (Muster für alle fortsetzen):
```js
  { id: 'luna',  name: 'Luna',  breed: 'Russisch Blau', emoji: '😺', fact: '…', unlock: { type: 'level', value: 20 },  premium: false, ability: 'nap' },
  { id: 'mochi', name: 'Mochi', breed: 'Schottische Faltohr', emoji: '😸', fact: '…', unlock: { type: 'level', value: 40 }, premium: false, ability: 'paw' },
  { id: 'felix', name: 'Felix', breed: 'Maine Coon', emoji: '😻', fact: '…', unlock: { type: 'level', value: 75 }, premium: false, ability: 'magnet' },
```
(Bestehende Felder unverändert lassen, nur `ability` anhängen. Den `fact`-Text NICHT kürzen — hier nur als `…` abgekürzt.)

- [ ] **Step 5: `companion-cost.js` implementieren**

```js
'use strict';

// Reine Kosten-Logik für Begleiter-Fähigkeiten (testbar, ohne economy/DOM).
import { COMPANION_COSTS } from './constants.js';

// Liefert die Fischgräten-Kosten für den Einsatz. 0 = gratis (Premium-Freibetrag).
export function companionCost(abilityId, { premium, freeUsedThisLevel }) {
  if (premium && !freeUsedThisLevel) return 0;
  return COMPANION_COSTS[abilityId] ?? 0;
}
```

- [ ] **Step 6: Persistenz in `storage.js` ergänzen**

Vor dem Migrations-Block (z. B. nach dem Mascot-Block ~Zeile 153):
```js
// ── Begleiter-Auswahl ─────────────────────────────────────────────────────
export function loadSelectedCompanion() {
  const v = localStorage.getItem(`${PREFIX}-companion`);
  return v || null;
}
export function saveSelectedCompanion(catId) {
  saveRaw(`${PREFIX}-companion`, catId);
}
```

- [ ] **Step 7: Tests ausführen, Erfolg bestätigen**

Run: `npm test`
Expected: PASS (companion-data, companion-cost und alle bestehenden Tests grün).

- [ ] **Step 8: Commit**

```bash
git add js/constants.js js/cats.js js/companion-cost.js js/storage.js test/companion-cost.test.mjs test/companion-data.test.mjs
git commit -m "feat(companion): Fähigkeits-Konstanten, Katzen-Mapping, Kosten-Helfer, Persistenz"
```

---

### Task 3: UI- & Spiel-Integration in `main.js` / `index.html` / CSS

**Files:**
- Modify: `index.html` (Begleiter-Button im Game-HUD bei Zeile 80-81; Begleiter-Auswahl-Overlay)
- Modify: `js/main.js` (Imports; `G`-Felder; Auswahl-Flow; Einsatz-Handler; Tap-Handler-Erweiterung bei Zeile 996-1033; HUD-Update bei ~1092; Wiring bei ~2047)
- Modify: CSS (im `<style>`-Block von `index.html` oder zugehöriger CSS-Datei — dort, wo `.hud-btn`/`.hud-hint` definiert sind)

**Interfaces:**
- Consumes: aus `companion.js` `applyNapBasket/applyPawTrick/applyMagnet/pawTrickTargets`; aus `companion-cost.js` `companionCost`; aus `engine.js` `isSolvable`; aus `economy.js` `canAfford/spend/isPremium`; aus `storage.js` `loadSelectedCompanion/saveSelectedCompanion`; aus `cats.js` `CATS`; aus `constants.js` `COMPANION_ABILITIES`; aus `render.js` `tubeAt`; bestehende `updateHUD`, `updateBonesDisplay`, `playSound`, `triggerFlash`, `doMove`-Animationsmuster, `loadCollection` (freigeschaltete Katzen).
- Produces: keine Exporte (UI-Schicht).

**State (neue `G`-Felder, beim `G`-Objekt ~Zeile 116 ergänzen):**
```js
  companionMode:        null,   // null | 'pawFrom' | 'pawTo' | 'magnetColor'
  companionPawFrom:     -1,
  companionFreeUsed:    false,  // Premium-Gratis-Einsatz in diesem Level verbraucht?
```

- [ ] **Step 1: Begleiter-Button + Auswahl-Overlay in `index.html`**

Nach dem `hintBtn` (Zeile 81) im selben HUD-Container einfügen:
```html
<button class="hud-btn hud-companion" id="companionBtn" aria-label="Begleiter-Fähigkeit">
  <span id="companionBtnIcon">🐾</span>
  <span class="hud-hint-cost" id="companionCost"><i class="fishbone"></i>30</span>
</button>
```
Vor `</body>` (oder bei den anderen Overlays) das Auswahl-Overlay:
```html
<div id="companionPickOverlay" class="overlay hidden">
  <div class="overlay-card">
    <h2>Begleiter wählen</h2>
    <p class="muted">Jede Katze hilft anders beim Sortieren.</p>
    <div id="companionPickList" class="companion-list"></div>
    <button id="companionPickClose" class="btn">Schließen</button>
  </div>
</div>
```

- [ ] **Step 2: CSS für Button + Liste**

Im CSS (neben `.hud-btn`):
```css
.hud-companion { position: relative; }
.companion-list { display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 50vh; overflow-y: auto; }
.companion-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 12px; background: #fff7; cursor: pointer; }
.companion-item.active { outline: 2px solid #ffcad4; }
.companion-item .companion-portrait { width: 40px; height: 40px; border-radius: 50%; }
.companion-item.locked { opacity: .4; pointer-events: none; }
.companion-aim { outline: 3px dashed #ffcad4 !important; } /* hebt Ziel-Röhren visuell hervor */
```

- [ ] **Step 3: Imports + `G`-Felder + Selektoren in `main.js`**

Imports oben ergänzen:
```js
import { applyNapBasket, applyPawTrick, applyMagnet, pawTrickTargets } from './companion.js';
import { companionCost } from './companion-cost.js';
import { COMPANION_ABILITIES } from './constants.js';
import { loadSelectedCompanion, saveSelectedCompanion } from './storage.js';
```
(`isSolvable` zum bestehenden `engine.js`-Import hinzufügen; `CATS`, `loadCollection`, `canAfford`, `spend`, `isPremium`, `tubeAt` sind bereits importiert — prüfen und ggf. ergänzen.)

`G`-Felder wie oben unter **State** beschrieben einfügen. In der Level-Init (dort wo `resetUndos()`/`G.selected=-1` gesetzt werden, ~Zeile 706 und ~714) `G.companionMode = null; G.companionPawFrom = -1; G.companionFreeUsed = false;` ergänzen.

- [ ] **Step 4: Helfer — aktive Katze & Fähigkeit ermitteln**

```js
function activeCompanion() {
  const id = loadSelectedCompanion();
  let cat = CATS.find(c => c.id === id);
  if (!cat) {
    // Fallback: erste freigeschaltete Katze aus der Sammlung
    const owned = loadCollection();
    cat = CATS.find(c => owned.includes(c.id)) || null;
  }
  if (!cat) return null;
  const ability = COMPANION_ABILITIES.find(a => a.id === cat.ability) || null;
  return ability ? { cat, ability } : null;
}

function currentCompanionCost() {
  const ac = activeCompanion();
  if (!ac) return 0;
  return companionCost(ac.ability.id, { premium: isPremium(), freeUsedThisLevel: G.companionFreeUsed });
}
```

- [ ] **Step 5: HUD-Anzeige des Begleiter-Buttons**

```js
function updateCompanionHUD() {
  const btn  = document.getElementById('companionBtn');
  const icon = document.getElementById('companionBtnIcon');
  const cost = document.getElementById('companionCost');
  if (!btn) return;
  const ac = activeCompanion();
  if (!ac) { btn.classList.add('hidden'); return; }
  btn.classList.remove('hidden');
  icon.textContent = ac.ability.emoji;
  const c = currentCompanionCost();
  cost.innerHTML = c === 0 ? '👑' : `${FISHBONE_ICON}${c}`;
  btn.disabled = G.tutorial || ANIM.busy || G.won || G.companionMode !== null;
}
```
In `updateHUD()` (~Zeile 1092, wo `hintBtn.disabled` gesetzt wird) `updateCompanionHUD();` aufrufen.

- [ ] **Step 6: Einsatz-Handler — Button-Klick startet die Fähigkeit**

```js
function onCompanionClick() {
  if (G.companionMode !== null) { cancelCompanionMode(); return; }
  const ac = activeCompanion();
  if (!ac) return;
  if (G.won || ANIM.busy || G.tutorial) return;
  const cost = currentCompanionCost();
  if (cost > 0 && !canAfford(cost)) { showToast?.('Zu wenig Fischgräten'); return; }

  if (ac.ability.id === 'nap') {
    // Sofort anwendbar, keine Zielauswahl
    commitCompanion(applyNapBasket(G.tubes), cost);
  } else if (ac.ability.id === 'paw') {
    G.companionMode = 'pawFrom';
    G.companionPawFrom = -1;
    showToast?.('Pfoten-Trick: Quell-Korb antippen');
    updateHUD();
  } else if (ac.ability.id === 'magnet') {
    G.companionMode = 'magnetColor';
    showToast?.('Magnet: Knäuel der Zielfarbe antippen');
    updateHUD();
  }
}

function cancelCompanionMode() {
  G.companionMode = null;
  G.companionPawFrom = -1;
  clearCompanionAim();
  updateHUD();
}

// Wendet einen fertig berechneten Zustand an, zieht Kosten ab, animiert nicht
// (Layout-Wechsel direkt) und prüft Sieg. `next` muss bereits lösbar verifiziert
// sein (siehe Tap-Handler für paw/magnet). nap ist immer sicher.
function commitCompanion(next, cost) {
  // Undo-Snapshot wie bei doMove
  G.history.push({ tubes: G.tubes.map(t => [...t]), frozen: new Set(G.frozenBalls), jokerUsed: G.jokerUsed });
  if (G.history.length > 5) G.history.shift();

  if (cost > 0) { if (!spend(cost)) return; }
  else { G.companionFreeUsed = true; } // Premium-Gratis verbraucht

  G.tubes = next;
  G.solvedTubes = new Set();
  for (let i = 0; i < G.tubes.length; i++) if (isSolved(G.tubes[i])) G.solvedTubes.add(i);
  cancelCompanionMode();
  playSound('select');
  updateBonesDisplay();
  updateHUD();
  // Sieg prüfen (bestehende Routine wiederverwenden)
  checkWin?.();
}
```
(`showToast`/`checkWin` mit `?.` aufgerufen — falls im Projekt anders benannt, an die vorhandene Toast-/Win-Routine anpassen, die `doMove`/`applyHint` nutzen.)

- [ ] **Step 7: Tap-Handler für Ziel-/Farbauswahl erweitern**

Am Anfang der Tube-Tap-Logik (in der Funktion bei `js/main.js:996`, direkt nach `const idx = tubeAt(lx, ly, G.tubes.length);` und der `idx === -1`-Abfrage) einfügen:
```js
  // Begleiter-Fähigkeit: Ziel-/Farbauswahl fängt den normalen Tap ab
  if (G.companionMode !== null && idx !== -1) {
    handleCompanionTap(idx);
    return;
  }
```
Neue Funktion:
```js
function handleCompanionTap(idx) {
  const ac = activeCompanion();
  if (!ac) { cancelCompanionMode(); return; }
  const cost = currentCompanionCost();

  if (G.companionMode === 'pawFrom') {
    if (G.tubes[idx].length === 0) return;        // leere Quelle ignorieren
    G.companionPawFrom = idx;
    G.companionMode = 'pawTo';
    highlightCompanionAim(pawTrickTargets(G.tubes, idx));
    return;
  }
  if (G.companionMode === 'pawTo') {
    const next = applyPawTrick(G.tubes, G.companionPawFrom, idx);
    if (!next) { triggerFlash(idx); return; }     // ungültiges Ziel
    if (isSolvable(next) < 0) {                    // Lösbarkeits-Guard
      triggerFlash(idx);
      showToast?.('Das würde das Level blockieren');
      return;
    }
    commitCompanion(next, cost);
    return;
  }
  if (G.companionMode === 'magnetColor') {
    const t = G.tubes[idx];
    if (t.length === 0) return;
    const color = t[t.length - 1];
    const next = applyMagnet(G.tubes, color, idx);
    if (isSolvable(next) < 0) {                    // Lösbarkeits-Guard
      triggerFlash(idx);
      showToast?.('Das würde das Level blockieren');
      return;
    }
    commitCompanion(next, cost);
    return;
  }
}

function highlightCompanionAim(indices) {
  G.companionAim = new Set(indices); // vom Renderer optional ausgewertet
}
function clearCompanionAim() {
  G.companionAim = null;
}
```
(Hinweis: `G.companionAim` ist optionaler Render-Hinweis; falls `render.js` ihn nicht auswertet, bleibt das Spiel funktionsfähig — die Hervorhebung ist rein kosmetisch und kann in Task 4 ergänzt werden.)

- [ ] **Step 8: Begleiter-Auswahl-Overlay verdrahten**

```js
function openCompanionPick() {
  const list = document.getElementById('companionPickList');
  if (!list) return;
  list.innerHTML = '';
  const owned = loadCollection();
  const selectedId = loadSelectedCompanion();
  for (const cat of CATS) {
    const ability = COMPANION_ABILITIES.find(a => a.id === cat.ability);
    const unlocked = owned.includes(cat.id);
    const row = document.createElement('div');
    row.className = 'companion-item' + (cat.id === selectedId ? ' active' : '') + (unlocked ? '' : ' locked');
    row.innerHTML =
      `<canvas class="companion-portrait" width="40" height="40"></canvas>` +
      `<div><b>${cat.name}</b><br><span class="muted">${ability.emoji} ${ability.label}</span></div>`;
    if (unlocked) {
      row.addEventListener('click', () => {
        saveSelectedCompanion(cat.id);
        updateCompanionHUD();
        openCompanionPick(); // neu rendern für active-Markierung
      });
    }
    list.appendChild(row);
    // Portrait via bestehendem cat-renderer zeichnen
    drawCatPortrait?.(row.querySelector('canvas').getContext('2d'), cat.id, 40);
  }
  document.getElementById('companionPickOverlay').classList.remove('hidden');
}
```
(`drawCatPortrait` aus `cat-renderer.js` importieren, Signatur an die tatsächliche anpassen — sie rendert ein Katzen-Portrait auf einen Canvas-Context.)

- [ ] **Step 9: Event-Wiring**

Bei den anderen `addEventListener`-Aufrufen (~Zeile 2047):
```js
document.getElementById('companionBtn').addEventListener('click', () => { playSound('click'); onCompanionClick(); });
document.getElementById('companionPickClose').addEventListener('click', () =>
  document.getElementById('companionPickOverlay').classList.add('hidden'));
```
Langer Druck / Doppelfunktion: Der Begleiter-Button startet die Fähigkeit; die Auswahl wird über das Album/den Sammelbildschirm geöffnet — dort einen „Als Begleiter wählen"-Eintrag ergänzen, der `openCompanionPick()` aufruft. (Falls schneller: einen kleinen „⚙"-Zugang neben dem Begleiter-Button platzieren.)

- [ ] **Step 10: `npm test` + manuelle Funktionsprüfung im Browser**

Run: `npm test`
Expected: PASS (keine Regression; reine Logik-Tests aus Task 1/2 bleiben grün).

Run: `npm run build:www` und `index.html`/`www` im Browser öffnen.
Manuell prüfen: Begleiter-Button sichtbar, Nickerchen-Korb fügt Röhre hinzu, Pfoten-Trick (Quelle→Ziel) verschiebt regelwidrig, Magnet zieht Farbe zusammen, Bones werden korrekt abgezogen, bei zu wenig Bones passiert nichts, Premium 1× gratis.

- [ ] **Step 11: Commit**

```bash
git add index.html js/main.js
git commit -m "feat(companion): HUD-Button, Auswahl-Overlay, Einsatz-Flow mit Lösbarkeits-Guard"
```

---

### Task 4: Render-Hervorhebung der Ziel-Röhren + Build & Simulator-Verifikation

**Files:**
- Modify: `js/render.js` (optionale Hervorhebung von `G.companionAim`-Röhren — falls Renderer Zugriff auf Zielindizes hat; sonst über CSS-Overlay verzichten)
- Modify: `js/main.js` (Aufräumen: `G.companionAim` initialisieren)

**Interfaces:**
- Consumes: `G.companionAim` (Set von Röhren-Indizes oder null).
- Produces: visuelle Hervorhebung; keine Logikänderung.

- [ ] **Step 1: `G.companionAim` initialisieren**

Beim `G`-Objekt ergänzen: `companionAim: null,`. In der Level-Init zurücksetzen.

- [ ] **Step 2: Hervorhebung im Renderer (optional, kosmetisch)**

In `render.js` dort, wo eine einzelne Röhre gezeichnet wird, falls ein State-Zugang besteht: wenn der Röhren-Index in `G.companionAim` liegt, einen gestrichelten Rahmen zeichnen. Wenn `render.js` keinen direkten `G`-Zugriff hat, diesen Schritt überspringen — die Fähigkeiten funktionieren ohne Hervorhebung; die Toast-Hinweise leiten den Spieler.

- [ ] **Step 3: Build & Sync**

Run: `npm run build:www && npm run cap:sync`
Expected: Build ohne Fehler, `www/` aktualisiert, `cap sync ios` ok.

- [ ] **Step 4: Im iOS-Simulator verifizieren**

Gemäß Memory „iOS build & run" die App im Simulator starten. Manuell durchspielen: ein Standard-Level mit jeder der drei Fähigkeiten lösen; prüfen, dass Spezial-Level (Blitz/Daily/Dog/Mouse) den Begleiter-Button ausblenden bzw. ignorieren.

- [ ] **Step 5: Commit**

```bash
git add js/render.js js/main.js
git commit -m "feat(companion): Ziel-Röhren-Hervorhebung + Simulator-verifiziert"
```

---

## Self-Review-Ergebnis

- **Spec-Abdeckung:** Nickerchen-Korb/Pfoten-Trick/Magnet (Task 1), Katzen-Mapping + Kosten + Premium-Gratis + Persistenz (Task 2), Auswahl-UI + In-Level-Button + Einsatz + Bones (Task 3), Lösbarkeits-Garantie (Task 1 beweisbar für nap, Task 3 Laufzeit-Guard für paw/magnet), „nur Standard-Modus" (Task 3 Step 5 Button-Disable + Task 4 Step 4 Verifikation). Alle Spec-Abschnitte abgedeckt.
- **Platzhalter:** keine TODO/TBD; alle Code-Schritte enthalten vollständigen Code. Mit `?.` markierte Aufrufe (`showToast`/`checkWin`/`drawCatPortrait`) sind explizit als „an vorhandene Routine anpassen" gekennzeichnet — der ausführende Entwickler muss die reale Signatur im Code bestätigen.
- **Typ-Konsistenz:** Fähigkeits-ids `'nap'|'paw'|'magnet'` durchgängig; `companionCost(abilityId, {premium, freeUsedThisLevel})` einheitlich; `applyPawTrick` gibt `tubes|null`, Aufrufer prüft auf `null`.

## Offene Punkte zur Klärung während der Umsetzung
- Reale Signatur von `drawCatPortrait` in `cat-renderer.js` und der Toast-/Win-Routine in `main.js` (vor Task 3 Step 6/8 kurz verifizieren).
- Zugang zur Begleiter-Auswahl: über Album-Bildschirm vs. eigener Button — in Task 3 Step 9 entschieden, ggf. an vorhandene Menüstruktur anpassen.
