# Begleiter-Katzen — Finalisierung (4.3a-Resubmit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Begleiter-Katzen-Feature so überarbeiten, dass es für einen Apple-Reviewer sofort erlebbar, fair, verständlich und balanciert ist — und damit die 4.3(a)-Ablehnung überzeugend widerlegt; zusätzlich die obere HUD-Leiste verständlich neu gestalten.

**Architecture:** Begleiter-Einsatz wird von Fischgräten-Kosten auf **1 Gratis-Einsatz pro Level für alle Spieler** umgestellt (Cap=1), balanciert über einen **Sterne-Deckel auf 2** bei Nutzung. Reine Fähigkeits-Logik bleibt in `js/companion.js` (DOM-frei, node-testbar); Ökonomie/UI/Flow in `js/main.js`. Joker-Interaktion wird korrekt behandelt. Discoverability über Onboarding bei der ersten Katzen-Freischaltung + neugestaltete HUD-Leiste.

**Tech Stack:** Vanilla ES-Module, Canvas, `node --test` (.test.mjs), Capacitor 8 iOS.

## Global Constraints

- **Einsatz-Modell:** Genau **1 Begleiter-Einsatz pro Level**, **gratis für ALLE** (kein Fischgräten-Abzug mehr). Nach dem Einsatz ist der Begleiter für das Level „verbraucht".
- **Balancing:** Wird in einem Level eine Begleiter-Fähigkeit genutzt, ist die Sternwertung in diesem Level **auf max. 2 gedeckelt** (3 Sterne bleiben pures Können).
- **Undo erstattet** den Einsatz: nach Undo eines Begleiter-Zuges ist der Einsatz wieder verfügbar und der Sterne-Deckel aufgehoben.
- **Lösbarkeits-Garantie bleibt:** keine Fähigkeit macht ein lösbares Level unlösbar; Joker-Mechanik korrekt berücksichtigt.
- **Nur Standard-Levelmodus:** kein Begleiter in Tetris/Maus/Dog/Blitz(timed)/Daily/Tutorial.
- **Begleiter erscheint ab der ersten freigespielten Katze** (nach Level 1) — nicht davor.
- **Ice/Frozen:** eingefrorene Knäuel werden von paw/magnet nicht bewegt (bereits via `isFrozen`-Callback umgesetzt).
- **Sprache:** UI-Texte & Kommentare Deutsch.
- **Wording:** Katzen werden als **Begleiter** positioniert, nicht als „Maskottchen" (Maskottchen = separates Deko-Feature, klar abgegrenzt).
- **Keine Klon-Signalwörter** („sort/solve/Wassersortieren") in sichtbaren In-App-Texten/Tagline.
- Tube-Kapazität fix 4 (`CAPACITY`). Tests müssen grün bleiben (aktuell 62).

---

### Task 1: Einsatz-Modell umbauen — Gratis 1×/Level + Cap + Sterne-Deckel + Undo-Erstattung

Entfernt die Fischgräten-Kosten aus dem Begleiter-Flow und ersetzt sie durch ein hartes 1×/Level-Limit mit Sterne-Deckel. Behebt: kein Cap (5× nap), Undo-„Geld weg", nap-Sofort-Commit-Verlust, 3★-erkaufbar.

**Files:**
- Modify: `js/main.js` (G-State ~117; Reset ~727-730; `currentCompanionCost`/`companionAvailable`/`updateCompanionHUD` ~1166-1198; `commitCompanion` ~1208; `onCompanionClick` ~1241; `undo` ~858; `showWin` ~1357-1366)
- Modify: `js/companion-cost.js` (Kosten-Logik → entfällt/ersetzt)
- Modify: `js/constants.js` (`COMPANION_COSTS` entfernen)
- Modify: `test/companion-cost.test.mjs` (an neues Modell anpassen)
- Modify: `test/companion-data.test.mjs` (COMPANION_COSTS-Test entfernen)

**Interfaces:**
- Produces: `G.companionUsedThisLevel` (boolean). `commitCompanion(next)` (ohne cost-Param). `companionUsed()` Helper → `G.companionUsedThisLevel`.

- [ ] **Step 1: Test fürs neue Kosten-/Cap-Modell schreiben** — ersetze den Inhalt von `test/companion-cost.test.mjs` durch:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companionFree } from '../js/companion-cost.js';

test('Begleiter-Einsatz ist gratis, solange in diesem Level noch nicht genutzt', () => {
  assert.equal(companionFree(false), true);
});

test('Begleiter-Einsatz ist nicht mehr verfügbar, wenn in diesem Level schon genutzt', () => {
  assert.equal(companionFree(true), false);
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `npm test`
Expected: FAIL — `companionFree` existiert nicht.

- [ ] **Step 3: `js/companion-cost.js` ersetzen**

```js
'use strict';

// Begleiter-Fähigkeiten sind ein reines Gameplay-Feature: genau 1 Gratis-Einsatz
// pro Level für alle Spieler (kein Fischgräten-Abzug). Das Balancing erfolgt über
// den Sterne-Deckel (siehe showWin), nicht über Kosten.
// Liefert true, wenn in diesem Level noch ein Einsatz frei ist.
export function companionFree(usedThisLevel) {
  return !usedThisLevel;
}
```

- [ ] **Step 4: `COMPANION_COSTS` aus `js/constants.js` entfernen** (Zeile ~244) und sicherstellen, dass kein Import mehr darauf zeigt. `COMPANION_ABILITIES` bleibt unverändert.

- [ ] **Step 5: `test/companion-data.test.mjs` anpassen** — den Testfall `COMPANION_COSTS hat positive Kosten je Fähigkeit` ersatzlos entfernen; den Import von `COMPANION_COSTS` entfernen. Die Tests für `CATS`-ability und `COMPANION_ABILITIES` bleiben.

- [ ] **Step 6: G-State + Reset ergänzen** in `js/main.js`. Beim G-Objekt (~117) `companionUsedThisLevel: false,` ergänzen. Im Reset-Block (~727-730) `G.companionUsedThisLevel = false;` ergänzen. (Die anderen Reset-Pfade laufen laut Analyse alle durch `generateLevel`/`startTutorial`/`startDailyChallenge` — prüfe, dass `startTutorial` ~2110 und `startDailyChallenge` ~2383 das neue Feld ebenfalls auf false setzen, analog zu `companionFreeUsed`.)

- [ ] **Step 7: Begleiter-Helfer in `js/main.js` umstellen.** `currentCompanionCost` entfernen. Neuen Helper + angepasste Verfügbarkeit:

```js
function companionUsed() { return G.companionUsedThisLevel; }
```
`companionAvailable()` (~1174) am Ende ergänzen: `if (G.companionUsedThisLevel) return false;` ist FALSCH (Button soll sichtbar bleiben als „verbraucht") — stattdessen NICHT in `companionAvailable` prüfen, sondern in `updateCompanionHUD` den Verbraucht-Zustand rendern (Step 8) und in `onCompanionClick` den Einsatz blocken (Step 9).

- [ ] **Step 8: `updateCompanionHUD` (~1182) umstellen** — keine Kosten mehr, stattdessen Verbraucht-Zustand:

```js
function updateCompanionHUD() {
  const btn  = document.getElementById('companionBtn');
  if (!btn) return;
  const ac = activeCompanion();
  if (!companionAvailable()) { btn.classList.add('hidden'); return; }
  btn.classList.remove('hidden');
  const used = G.companionUsedThisLevel;
  btn.classList.toggle('used', used);
  btn.disabled = ANIM.busy || G.won || used;
  // Portrait/Badge/Label setzt Task 4 (HUD-Redesign); hier nur Zustandslogik.
  const aria = used
    ? `Begleiter ${ac.cat.name} — in diesem Level bereits eingesetzt`
    : `Begleiter ${ac.cat.name} — ${ac.ability.label} einsetzen (1× pro Level)`;
  btn.setAttribute('aria-label', aria);
}
```

- [ ] **Step 9: `commitCompanion` (~1208) ohne Bones, mit Used-Flag.** Ersetze die Funktion:

```js
function commitCompanion(next) {
  // Undo-Snapshot (als Begleiter-Zug markiert, damit undo() den Zug-Zähler
  // nicht dekrementiert und den Einsatz erstattet).
  G.history.push({ tubes: G.tubes.map(t => [...t]), frozen: new Set(G.frozenBalls), jokerUsed: G.jokerUsed, companion: true });
  if (G.history.length > 5) G.history.shift();

  G.companionUsedThisLevel = true;
  G.tubes = next;
  G.solvedTubes = new Set();
  for (let i = 0; i < G.tubes.length; i++) if (isSolved(G.tubes[i])) G.solvedTubes.add(i);

  cancelCompanionMode();
  // (Task 2 fügt hier die Joker-Removal-Logik ein; Task 3 das Einsatz-Feedback.)
  updateHUD();
  if (checkWinState(G.tubes) && !G.won) { G.won = true; showWin(); }
}
```
Alle Aufrufer von `commitCompanion(next, cost)` auf `commitCompanion(next)` umstellen (in `handleCompanionTap` und `onCompanionClick`).

- [ ] **Step 10: `onCompanionClick` (~1241) ohne Kosten, mit Cap + Confirm-Hook.** Ersetze die Bones-Prüfung:

```js
function onCompanionClick() {
  if (G.companionMode !== null) { cancelCompanionMode(); return; }
  if (!companionAvailable()) return;
  if (G.won || ANIM.busy) return;
  if (G.companionUsedThisLevel) { showToast('Begleiter in diesem Level schon eingesetzt'); return; }
  const ac = activeCompanion();
  // Task 3 schaltet hier den Bestätigungs-/Erklär-Dialog davor; nach Bestätigung:
  startCompanionAbility(ac);
}

function startCompanionAbility(ac) {
  if (ac.ability.id === 'nap') {
    commitCompanion(applyNapBasket(G.tubes));
  } else if (ac.ability.id === 'paw') {
    G.companionMode = 'pawFrom'; G.companionPawFrom = -1;
    showToast('Pfoten-Trick: Quell-Röhre antippen'); updateHUD();
  } else if (ac.ability.id === 'magnet') {
    G.companionMode = 'magnetColor';
    showToast('Magnet: Röhre mit Zielfarbe antippen'); updateHUD();
  }
}
```
In `handleCompanionTap` die `cost`-Variable und `commitCompanion(next, cost)` → `commitCompanion(next)` ersetzen.

- [ ] **Step 11: Sterne-Deckel in `showWin` (~1357-1366).** Direkt nach der `stars`-Berechnung (nach dem `else { stars = calcStars(...) }`-Block, vor der Verwendung von `stars`) einfügen:

```js
  // Begleiter-Nutzung deckelt die Wertung auf 2 Sterne — 3 Sterne bleiben Können.
  if (G.companionUsedThisLevel) stars = Math.min(stars, 2);
```

- [ ] **Step 12: Undo erstattet den Einsatz.** In `undo()` (~858), im Zweig der den Snapshot wiederherstellt: wenn der gepoppte Snapshot `companion === true` ist, `G.companionUsedThisLevel = false;` setzen (zusätzlich zum bestehenden `companion`-Tag-Handling beim Zug-Zähler). Konkret nach `const snapshot = G.history.pop();`:

```js
  if (snapshot && snapshot.companion) G.companionUsedThisLevel = false;
```

- [ ] **Step 13: Full-Suite + Build**

Run: `npm test`
Expected: PASS (companion-cost-Tests grün, companion-data ohne COSTS-Test grün, restliche grün).
Run: `npm run build:www`
Expected: kein Fehler, kein verbliebener Verweis auf `COMPANION_COSTS`/`companionCost`/`currentCompanionCost` (grep zur Kontrolle).

- [ ] **Step 14: Commit**

```bash
git add js/companion-cost.js js/constants.js js/main.js test/companion-cost.test.mjs test/companion-data.test.mjs
git commit -m "feat(companion): 1 Gratis-Einsatz/Level + Cap + Sterne-Deckel + Undo-Erstattung (Bones-Kosten raus)"
```

---

### Task 2: Joker-Interaktion + No-Op-Schutz

Behebt: paw/magnet auf Joker-Leveln (≥20) tot/korrupt; Magnet-No-Op verbraucht den Einsatz ohne Wirkung.

**Files:**
- Modify: `js/engine.js` (`isSolvable` ~187 — optionaler jokerUsed-Param)
- Modify: `js/main.js` (`commitCompanion` — Joker-Removal; `handleCompanionTap` — isSolvable mit jokerUsed + No-Op-Erkennung)
- Modify: `test/companion.test.mjs` (Tests für jokerUsed-Solvability + No-Op)

**Interfaces:**
- Consumes: `findJokerTube`, `applyJokerRemoval` (engine.js, bereits exportiert? `findJokerTube` ja; `applyJokerRemoval` ja).
- Produces: `isSolvable(tubes, jokerUsed = true, limit = 200000)` — wenn `jokerUsed === false` wird der Joker-Überschussball vor der Suche entfernt (analog `solveHint`).

- [ ] **Step 1: Failing tests** in `test/companion.test.mjs` ergänzen:

```js
import { applyMagnet as _am } from '../js/companion.js'; // falls noch nicht importiert: applyMagnet ist bereits importiert

test('isSolvable mit nicht-committetem Joker entfernt Überschussball und bleibt lösbar', () => {
  // Brett mit Joker + Überschuss: ['a','a','a'] | ['a'] | ['joker'] — mit jokerUsed=false lösbar
  const tubes = [['a','a','a'], ['a'], ['joker'], []];
  // jokerUsed=true (default) sieht 4×a + joker → ggf. nicht sauber lösbar; jokerUsed=false entfernt 1 a
  assert.ok(isSolvable(tubes, false) >= 0, 'mit jokerUsed=false muss lösbar sein');
});

test('applyMagnet ist No-Op, wenn keine andere Röhre die Farbe oben hat', () => {
  const tubes = [['rot'], ['blau','blau'], []];
  const next = applyMagnet(tubes, 'rot', 0);
  assert.deepEqual(next, tubes); // nichts gezogen → identisch
});
```
(`isSolvable` ist in companion.test.mjs bereits aus engine.js importiert.)

- [ ] **Step 2: Tests ausführen, Fehlschlag bestätigen**

Run: `npm test`
Expected: der isSolvable-jokerUsed-Test schlägt fehl (Param wird ignoriert), No-Op-Test ggf. schon grün.

- [ ] **Step 3: `isSolvable` in `js/engine.js` um jokerUsed erweitern.** Signatur ändern und am Anfang den Überschussball entfernen, wenn der Joker noch nicht committet ist (gleiche Idee wie `solveHint(tubes, jokerUsed=false)`):

```js
export function isSolvable(tubes, jokerUsed = true, limit = 200000) {
  function serialize(ts) { return ts.map(t => t.join(',')).join('|'); }
  function cloneTs(ts)   { return ts.map(t => [...t]); }

  // Nicht-committeter Joker: das Brett hat real einen Ball zu viel. Für die
  // Lösbarkeitssuche den Überschuss konservativ vor-entfernen (analog solveHint),
  // damit der Solver nicht fälschlich -1 liefert.
  if (!jokerUsed) {
    const work = cloneTs(tubes);
    const jti = findJokerTube(work);
    if (jti !== -1) {
      const colors = new Set();
      for (const t of work) for (const c of t) if (c !== 'joker') colors.add(c);
      for (const color of colors) {
        const copy = cloneTs(work);
        let removed = false;
        for (let ti = 0; ti < copy.length && !removed; ti++) {
          const idx = copy[ti].lastIndexOf(color);
          if (idx !== -1) { copy[ti].splice(idx, 1); removed = true; }
        }
        if (removed && isSolvable(copy, true, limit) >= 0) return 0;
      }
      return -1;
    }
  }

  if (checkWinState(tubes)) return 0;
  const visited = new Set([serialize(tubes)]);
  const queue   = [{ state: tubes, depth: 0 }];
  while (queue.length > 0 && visited.size < limit) {
    const { state, depth } = queue.shift();
    const n = state.length;
    for (let from = 0; from < n; from++) {
      for (let to = 0; to < n; to++) {
        if (!canMove(state, from, to)) continue;
        const next = cloneTs(state);
        next[to].push(next[from].pop());
        const key = serialize(next);
        if (visited.has(key)) continue;
        visited.add(key);
        if (checkWinState(next)) return depth + 1;
        queue.push({ state: next, depth: depth + 1 });
      }
    }
  }
  return -1;
}
```
(`findJokerTube` ist in engine.js definiert/oberhalb verfügbar.)

- [ ] **Step 4: `handleCompanionTap` (js/main.js) — isSolvable mit jokerUsed + No-Op-Schutz.** In beiden Zweigen (pawTo, magnetColor):
  - No-Op-Erkennung vor dem Solvability-Check: wenn `serializeTubes(next) === serializeTubes(G.tubes)` (keine Veränderung), `triggerFlash` + Toast „Hier bewirkt das nichts", `return` (kein Verbrauch). Nutze einen lokalen Helper `const same = (a,b) => a.length===b.length && a.every((t,i)=>t.join()===b[i].join());`.
  - Solvability-Check: `isSolvable(next, G.jokerUsed) < 0` statt `isSolvable(next) < 0`.

```js
  // im pawTo-Zweig, nach `const next = applyPawTrick(...)` und null-Check:
  if (same(next, G.tubes)) { triggerFlash(idx); showToast('Hier bewirkt das nichts'); return; }
  if (isSolvable(next, G.jokerUsed) < 0) { triggerFlash(idx); showToast('Das würde das Level blockieren'); return; }
  commitCompanion(next);

  // im magnetColor-Zweig analog, mit `same(next, G.tubes)` vor dem isSolvable-Check.
```

- [ ] **Step 5: `commitCompanion` — Joker korrekt committen.** In `commitCompanion` (nach `G.tubes = next;`, vor der solvedTubes-Schleife) die Joker-Removal-Logik einfügen (Pendant zu render.js:180-208, ohne Partikel):

```js
  // Begleiter-Zug kann den Joker erstmals mit Farben teilen → Überschussball
  // entfernen und Joker als committet markieren (sonst bleibt das Level unlösbar).
  if (!G.jokerUsed) {
    const jti = findJokerTube(G.tubes);
    if (jti !== -1) {
      const jt = G.tubes[jti];
      if (jt.length >= 2 && jt.some(c => c !== 'joker')) {
        if (applyJokerRemoval(G.tubes, jti)) G.jokerUsed = true;
      }
    }
  }
```
Sicherstellen, dass `findJokerTube` und `applyJokerRemoval` in main.js importiert sind (findJokerTube ist bereits importiert; `applyJokerRemoval` ggf. zum engine-Import hinzufügen).

- [ ] **Step 6: Tests + Build**

Run: `npm test` → PASS (neue Joker-/No-Op-Tests grün).
Run: `npm run build:www` → kein Fehler.

- [ ] **Step 7: Commit**

```bash
git add js/engine.js js/main.js test/companion.test.mjs
git commit -m "fix(companion): Joker-Lösbarkeit + Joker-Commit beim Begleiter-Zug + Magnet-No-Op-Schutz"
```

---

### Task 3: Bestätigungs-/Erklär-Dialog + Einsatz-Flow-Politur

Behebt: kein versehentlicher Einsatz mehr; erklärt jede Fähigkeit vor dem Einsatz; Magnet-Ziel-Hervorhebung; sichtbarer Abbruch; befriedigendes Einsatz-Feedback.

**Files:**
- Modify: `index.html` (neues `#companionConfirmOverlay` im bestehenden Modal-Stil; persistente Status-Leiste `#companionStatusBar`)
- Modify: `js/main.js` (`onCompanionClick` → Dialog; `startCompanionAbility`; magnet Aim-Highlight; Status-Leiste; Feedback in `commitCompanion`)
- Modify: `js/render.js` (magnet-Kandidaten-Röhren hervorheben, analog vorhandenem `companionAim`)
- Modify: CSS (Dialog + Status-Leiste im Projektstil, Akzent `#ffcad4`)

**Interfaces:**
- Consumes: `drawCatPortrait` (cat-renderer.js, Signatur `(ctx, cx, cy, size, params)`), `CAT_PARAMS`, `playSound`, `hapticForSound` (native-haptics.js), Animationshelfer aus `js/animations.js` (`easeOutBack`/`easeOutBounce`).

- [ ] **Step 1: Bestätigungs-Overlay in `index.html`** im Stil des bestehenden `.blitz-overlay`/`.blitz-inner` (such die Struktur ab ~417). Inhalt: Katzen-Portrait-Canvas, Katzenname, Fähigkeits-Emoji+Label, Erklärtext, „1× pro Level — kostet 1 Stern", Buttons „Einsetzen" / „Abbrechen". IDs: `#companionConfirmOverlay`, `#ccPortrait`, `#ccName`, `#ccAbility`, `#ccDesc`, `#ccConfirmBtn`, `#ccCancelBtn`.

- [ ] **Step 2: `onCompanionClick` zeigt zuerst den Dialog.** Statt direkt `startCompanionAbility(ac)` → `openCompanionConfirm(ac)`. Neue Funktion `openCompanionConfirm(ac)`:
  - befüllt Portrait (`drawCatPortrait` mit `CAT_PARAMS.find(p=>p.id===ac.cat.id)`), Name, `ac.ability.emoji + ac.ability.label`, `ac.ability.desc`, Hinweistext „Einmal pro Level · senkt die Sternwertung auf max. 2".
  - „Einsetzen" → Overlay schließen + `startCompanionAbility(ac)`.
  - „Abbrechen" → Overlay schließen.
  - Für paw/magnet erklärt der Text, dass danach Quelle/Ziel bzw. Farbe gewählt wird.

- [ ] **Step 3: Persistente Status-Leiste statt flüchtigem Toast** für den Auswahl-Modus (paw/magnet). `#companionStatusBar` einblenden mit Schritt-Text („Schritt 1/2: Quell-Röhre wählen" / „Ziel-Röhre wählen" / „Farbe wählen") und einem sichtbaren „✕ Abbrechen"-Button, der `cancelCompanionMode()` ruft. In `cancelCompanionMode` die Leiste ausblenden. Die bisherigen `showToast`-Aufrufe im Modus durch Statusleisten-Updates ersetzen.

- [ ] **Step 4: Magnet-Ziel-Hervorhebung.** Wenn `companionMode==='magnetColor'`, Kandidaten-Röhren hervorheben: alle Röhren, deren oberste Farbe in mind. einer anderen Röhre ebenfalls oben liegt (sinnvolle Magnet-Ziele). `G.companionAim` mit diesen Indizes füllen (analog paw). In `js/render.js` wird `G.companionAim` bereits gezeichnet — keine Render-Änderung nötig außer ggf. Klarheit.

- [ ] **Step 5: Einsatz-Feedback in `commitCompanion`.** Statt nur `playSound('select')`: pro Fähigkeit ein passender Sound + Haptik (`hapticForSound`, medium) + eine kurze Animation:
  - nap: neue Röhre „ploppt" rein (easeOutBack über die letzte Röhre).
  - paw: kurzer Pfoten-Stempel/Arc am Zielort.
  - magnet: „Zieh"-Effekt der gesammelten Knäuel.
  Mindestumfang fürs finale Build: eigener Sound + Haptik + ein sichtbarer Effekt (z. B. Partikel via `spawnParticle`). Halte es im bestehenden Animationssystem.

- [ ] **Step 6: Manuelle Verifikation + Build.** `npm test` (keine Regression), `npm run build:www`, im Browser: Dialog erscheint, Abbruch sichtbar, Magnet-Ziele hervorgehoben, Feedback spürbar.

- [ ] **Step 7: Commit**

```bash
git add index.html js/main.js js/render.js
git commit -m "feat(companion): Bestätigungs-/Erklär-Dialog, persistente Status-Leiste, Magnet-Aim, Einsatz-Feedback"
```

---

### Task 4: HUD-Leiste neu gestalten (obere Symbolzeile verständlich machen)

Behebt die Nutzer-Anforderung: obere Leiste klar, lesbar, nicht verwechselbar. Pfote 🐾 doppelt (Leben+Begleiter), gemischte Icons, enge Touch-Targets, Begleiter unklar.

**Files:**
- Modify: `index.html` (`.hud-overlay` ~76-88; Tagline ~70)
- Modify: CSS (`.hud-overlay`, `.hud-btn`, `.hud-companion`, neue Gruppen/Labels)
- Modify: `js/main.js` (`updateCompanionHUD` Portrait/Badge/used; `updateLivesDisplay` Icon)

**Interfaces:** Consumes `drawCatPortrait`/`CAT_PARAMS` für das Button-Portrait.

- [ ] **Step 1: Leben-Icon von 🐾 auf ❤️** umstellen (Pfote bleibt exklusiv für Begleiter). In `index.html:79` `<span class="paw">🐾</span>` → Herz; in `updateLivesDisplay` ggf. Klassen anpassen.

- [ ] **Step 2: Tagline entschärfen.** `index.html:70` `sort · schnurr · solve` → katziger Claim ohne „sort/solve", z. B. „kuscheln · sammeln · schnurren" (final mit Lead-Designer abstimmen; KEINE Genre-Klon-Wörter).

- [ ] **Step 3: HUD gruppieren & beschriften.** `.hud-overlay` so umbauen, dass **Status-Anzeigen** (Level, Fischgräten, Leben) optisch von **Aktions-Buttons** (Zurück, Tipp, Begleiter, Reset, Menü) getrennt sind (z. B. zwei Cluster mit Abstand). Aktions-Buttons: einheitliche Größe (Begleiter mind. so groß wie Hint), konsistenter Stil, jeweils klares Icon; Touch-Target ≥44px mit ausreichend Gap (Fehl-Taps vermeiden). Optional kleine Mini-Labels unter/neben den Aktions-Icons.

- [ ] **Step 4: Begleiter-Button = Katzen-Portrait + Fähigkeits-Badge + rosa Akzent.** In `updateCompanionHUD`: statt `companionBtnIcon`-Emoji ein kleines Portrait der aktiven Katze rendern (Mini-Canvas im Button via `drawCatPortrait`), mit kleinem Fähigkeits-Emoji-Badge. Verbraucht-Zustand: Portrait entsättigt (grayscale + opacity) + ✓-Overlay. Rosa Akzentring (`#ffcad4`), klar abgesetzt vom Gold-Cluster (undo/hint). `index.html` `#companionBtn` entsprechend umbauen (Canvas statt Emoji-Span).

- [ ] **Step 5: Manuelle Verifikation + Build.** `npm run build:www`, im Browser auf Phone- und iPad-Breite: alles erkennbar, keine doppelte Pfote, Begleiter klar als „meine Katze + Kraft", verbraucht-Zustand sichtbar, keine Überlappungen.

- [ ] **Step 6: Commit**

```bash
git add index.html js/main.js
git commit -m "feat(hud): obere Leiste neu — Status/Aktionen getrennt, Leben=Herz, Begleiter=Portrait+Badge, Tagline ohne Klon-Wörter"
```

---

### Task 5: Onboarding, Discoverability & Begleiter-Copy

Behebt: Feature nirgends erklärt; heimlicher Auto-Default-Begleiter; „Maskottchen"-Wording bestätigt Klon-Verdacht; Album zeigt aktiven Begleiter/Fähigkeit nicht.

**Files:**
- Modify: `js/main.js` (Unlock-Feier ~512-556; `activeCompanion` Besitz-Prüfung ~1154; Album `buildAlbumScreen`/`showCatDetail`; Default-Begleiter setzen)
- Modify: `js/constants.js` (TUTORIAL_SCRIPT „Maskottchen"-Wording; ggf. Starter-Begleiter)
- Modify: `js/cats.js` (Starter-Katze Whisker: Fähigkeit + sichere Frühfreischaltung prüfen)

- [ ] **Step 1: Starter-Katze sicher nach Level 1.** Verifizieren, dass `whisker` (oder die erste Katze) zuverlässig nach dem ersten gelösten Level freigeschaltet wird (`unlock: achievement 'first_solve'`). Beim ersten Freischalten **automatisch als `selectedCompanion` setzen**, falls noch keiner gewählt ist (in der Unlock-Verarbeitung / `checkCatUnlocks`). **Starter-Fähigkeit:** Whisker auf `magnet` setzen (visuell auffälligste Fähigkeit für den ersten Eindruck) — sofern mit Lead-Designer so abgestimmt; sonst `paw` belassen.

- [ ] **Step 2: Unlock-Feier = Begleiter-Onboarding.** In der Unlock-Feier (~531-537) den Hinweistext beim ersten Katzen-Unlock von „Öffne das Katzen-Album um dein **Maskottchen** zu wählen!" ändern zu einer Begleiter-Einführung, z. B.: „{Name} begleitet dich jetzt! Tippe im Level unten den Katzen-Button, um ihre Fähigkeit **{ability.label}** einzusetzen — 1× pro Level, gratis." (Fähigkeit der freigeschalteten Katze einsetzen.)

- [ ] **Step 3: Tutorial-Copy.** In `js/constants.js` `TUTORIAL_SCRIPT` den „Maskottchen"-Schritt (~296) auf Begleiter-Sprache umstellen oder einen kurzen Begleiter-Hinweis ergänzen (ohne das Tutorial zu überladen). Keine „Maskottchen=Skin"-Formulierung mehr, die Katzen als rein kosmetisch darstellt.

- [ ] **Step 4: `activeCompanion` Besitz-Prüfung.** Primärpfad (~1156) zusätzlich an Besitz koppeln: nur zurückgeben, wenn `loadCollection().includes(cat.id)`; sonst Fallback auf erste besessene Katze. Verhindert „Geist-Begleiter" durch veraltete ID.

- [ ] **Step 5: Album — aktiven Begleiter markieren + Fähigkeit immer anzeigen.** In `buildAlbumScreen` für die als Begleiter gewählte Katze ein eigenes Badge/Rahmen (klar unterscheidbar vom Mascot-Gold). Im `showCatDetail` die Fähigkeit jeder (auch nicht gewählten) Katze als Zeile anzeigen („Fähigkeit: {emoji} {label} — {desc}"), und „Als Maskottchen wählen" vs „Als Begleiter wählen" sprachlich/visuell klar trennen (Maskottchen = Deko im Café, Begleiter = Helfer im Level).

- [ ] **Step 6: Tests + Build.** `npm test` (keine Regression), `npm run build:www`. Manuell: erste Katze nach Level 1 wird Begleiter + Onboarding-Text erscheint; Album zeigt aktiven Begleiter + Fähigkeiten; kein „Maskottchen=Skin"-Text mehr.

- [ ] **Step 7: Commit**

```bash
git add js/main.js js/constants.js js/cats.js
git commit -m "feat(companion): Onboarding bei erster Katze, bewusster Begleiter, Begleiter-Copy statt Maskottchen, Album-Markierung"
```

---

### Task 6: Reviewer-/Store-Dokumente angleichen

Behebt: alte Klon-Signale in reviewer-sichtbaren Texten; Reviewer-Reply führt nicht zum Feature.

**Files:**
- Modify: `docs/REVIEW-NOTES.md` (alt: „Color Drop / color-sorting" → Begleiter-Identität)
- Modify: `docs/REVIEW-REPLY-4.3a.md` (Schritt-für-Schritt zum Feature ergänzen)
- Modify: `docs/STORE-LISTING-v2.md` (Tagline-/Wording-Konsistenz; Screenshot-Anforderungen schärfen)

- [ ] **Step 1: `docs/REVIEW-NOTES.md`** auf die neue Positionierung umschreiben: Name „Kittysort: Cat Companions", keine „color-sorting/Color Drop"-Formulierung; Begleiter-Feature + Fundort (ab Level 2, Katzen-Button, gratis 1×/Level) beschreiben.

- [ ] **Step 2: `docs/REVIEW-REPLY-4.3a.md`** um eine konkrete Wegbeschreibung ergänzen: „Solve level 1 → a companion cat is unlocked → from level 2, tap the cat button (bottom HUD) to use her ability — free, once per level." Sicherstellen, dass die Aussagen zum nun gratis/zugänglichen Feature stimmen.

- [ ] **Step 3: `docs/STORE-LISTING-v2.md`** auf Konsistenz prüfen: Tagline/Untertitel ohne „sort/solve"; im Screenshot-Abschnitt explizit fordern, dass Screenshot 1–2 die Begleiter-Fähigkeit in Aktion + das 34-Katzen-Album zeigen (nicht nur Sortierbretter). Vermerken, dass die Screenshots noch neu erstellt werden müssen (Nutzer-Aufgabe).

- [ ] **Step 4: Commit**

```bash
git add docs/REVIEW-NOTES.md docs/REVIEW-REPLY-4.3a.md docs/STORE-LISTING-v2.md
git commit -m "docs: reviewer-sichtbare Texte auf Companion-Identität angleichen + Wegbeschreibung zum Feature"
```

---

## Self-Review-Ergebnis

- **Spec-Abdeckung:** Gratis-1×/Level (T1), Cap (T1), Sterne-Deckel (T1), Undo-Erstattung (T1), Joker (T2), No-Op (T2), Bestätigungs-Dialog/nap-Schutz (T3), HUD-Redesign (T4), Onboarding/Copy/Auto-Default/Besitz-Prüfung/Album (T5), Reviewer-Docs (T6). Alle 8 Must-Fixes + HUD + Should abgedeckt.
- **Platzhalter:** Logik-Tasks (T1/T2) enthalten vollständigen Code. UI-Tasks (T3/T4/T5) geben konkrete Anker, IDs, Akzeptanzkriterien + Wording statt Pixel-CSS, da visuell iterativ — bewusst, mit klaren Zielzuständen.
- **Typ-Konsistenz:** `companionFree(usedThisLevel)`, `G.companionUsedThisLevel`, `commitCompanion(next)` (ein Param), `isSolvable(tubes, jokerUsed, limit)` durchgängig.
- **Screenshots** sind kein Code-Task (T6 Step 3 dokumentiert die Anforderung; Aufnahme ist Nutzer-/Gerät-Aufgabe).

## Entschiedene Mini-Frage
- Starter-Fähigkeit der ersten Katze (Whisker) = **magnet** (vom Nutzer bestätigt 2026-06-28). Task 5 Step 1 setzt Whisker auf `magnet`.
