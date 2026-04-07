# Color Drop — Hints (Phase 4): Design-Spec
**Datum:** 2026-04-07
**Status:** Genehmigt

---

## 1. Ziel

Ein Tipp-Button (`💡 Tipp`) im HUD der dem Spieler den nächsten validen Zug anzeigt.
Nutzen kostet 1 Zug (Move-Counter +1). Die Anzeige erfolgt via Canvas-Highlight (2,5 s).

---

## 2. Architektur

Alle Änderungen bleiben in `index.html`. Keine neuen Abhängigkeiten.

### 2.1 Neue Funktionen

```js
// Pure canMove ohne G-Zugriff — wird vom Solver benötigt
canMoveState(tubes, from, to) → boolean

// BFS-Solver: gibt ersten Zug der Lösung zurück, oder null
solveHint() → { from: number, to: number } | null

// Orchestriert Klick auf #hintBtn
showHint() → void
```

### 2.2 Solver — solveHint()

BFS über serialisierte Tube-Zustände (`JSON.stringify(tubes)` als Set-Key).

```js
function solveHint() {
    const start = G.tubes.map(t => [...t]);
    const queue = [{ tubes: start, path: [] }];
    const visited = new Set([JSON.stringify(start)]);
    let nodes = 0;
    while (queue.length && nodes++ < 50000) {
        const { tubes, path } = queue.shift();
        for (let from = 0; from < tubes.length; from++) {
            for (let to = 0; to < tubes.length; to++) {
                if (!canMoveState(tubes, from, to)) continue;
                const next = tubes.map(t => [...t]);
                next[to].push(next[from].pop());
                const key = JSON.stringify(next);
                if (visited.has(key)) continue;
                visited.add(key);
                const newPath = [...path, { from, to }];
                if (checkWinState(next)) return newPath[0];
                queue.push({ tubes: next, path: newPath });
            }
        }
    }
    return null;
}
```

Node-Limit: **50.000**. Reicht für EASY–EXPERT. Bei MASTER ggf. kein Treffer → Fallback.

---

## 3. UX & Verhalten

### 3.1 Button

```html
<button id="hintBtn" class="hud-btn" type="button">💡 Tipp</button>
```

Platzierung: im HUD neben `#undoBtn`.

Disabled wenn:
- `ANIM.busy` (Animation läuft)
- `G.won` (Level gewonnen)
- Tutorial-Modus

### 3.2 Klick-Ablauf

1. `showHint()` aufrufen
2. `solveHint()` ausführen
3. **Kein Ergebnis (`null`):** Button-Text kurz auf `❌ kein Tipp` setzen (1,5 s), kein Move-Count
4. **Ergebnis `{from, to}`:**
   - `G.moves++` + `updateHUD()` (1 Zug Strafe)
   - `G.hintFrom = from`, `G.hintTo = to`, `G.hintUntil = G.frameTime + 2500`

### 3.3 Highlight (Canvas)

Im Draw-Loop, wenn `G.frameTime < G.hintUntil`:

- **Quell-Tube** (`G.hintFrom`): weißer Leuchtring (`shadowBlur: 20`, `strokeStyle: 'white'`)
- **Ziel-Tube** (`G.hintTo`): grüner Rahmen (`strokeStyle: '#4f4'`, `setLineDash([6,4])`)

Highlight erlischt:
- Automatisch nach 2,5 s
- Sofort bei `doMove()` und `undo()`

---

## 4. State-Erweiterung

```js
// In generateLevel() initialisieren:
G.hintFrom  = -1;   // Quell-Tube Index (-1 = inaktiv)
G.hintTo    = -1;   // Ziel-Tube Index  (-1 = inaktiv)
G.hintUntil = 0;    // frameTime-Timestamp bis Highlight sichtbar
```

---

## 5. Betroffene bestehende Funktionen

| Funktion | Änderung |
|---|---|
| `generateLevel()` | `G.hintFrom = G.hintTo = -1; G.hintUntil = 0;` |
| `doMove()` | `G.hintFrom = G.hintTo = -1;` (Highlight löschen) |
| `undo()` | `G.hintFrom = G.hintTo = -1;` |
| Draw-Loop (`drawTube` / Tube-Render) | Highlight-Ring zeichnen wenn aktiv |
| HUD-HTML | `#hintBtn` neben `#undoBtn` |

---

## 6. Nicht in Scope

- Kein Achievement für Hint-Nutzung
- Kein neuer localStorage-Key
- Kein Web Worker (synchroner BFS reicht)
- Keine Anzeige der vollständigen Lösung
- Kein Hint-Counter / Limit pro Level
