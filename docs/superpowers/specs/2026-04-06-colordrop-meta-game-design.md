# Color Drop — Meta-Game & HUD: Design-Spec
**Datum:** 2026-04-06
**Status:** Genehmigt

---

## 1. Ziel

Die bestehende v2-Spiellogik (Animations-System, Partikel, Glassmorphismus) bleibt vollständig unverändert. Darüber wird eine Meta-Game-Schicht gelegt: dynamischer Level-Generator, professionelles HUD-Overlay, Level-Progression und Sound-Platzhalter.

---

## 2. Neues globales Objekt

```js
const LEVEL = { current: 1 };
```

Einzige Quelle der Wahrheit für die aktuelle Level-Nummer. Kein localStorage (Persistenz ausserhalb des Scope).

---

## 3. Level-Konfiguration

| Level-Bereich | Röhren | Farben | Leere Röhren |
|---|---|---|---|
| 1–5   | 4 | 2 | 2 |
| 6–15  | 5 | 3 | 2 |
| 16+   | 7 | 5 | 2 |

Farbauswahl pro Tier aus `PALETTE` (6 Farben vorhanden):
- Tier 1 (2 Farben): `cyan`, `magenta`
- Tier 2 (3 Farben): `cyan`, `magenta`, `lime`
- Tier 3 (5 Farben): `cyan`, `magenta`, `lime`, `yellow`, `orange`

---

## 4. Level-Generator (`generateLevel`)

Ersetzt `initLevel()` vollständig.

### Algorithmus (Rückwärts-Mischen — garantiert lösbar)

```
function generateLevel(levelNum):
  cfg = levelConfig(levelNum)          // {tubes, colors, empty}

  // 1. Gelösten Ausgangszustand bauen
  tubes = cfg.colors.map(c => [c,c,c,c])
  for i in range(cfg.empty): tubes.push([])

  // 2. Zufällig mischen durch gültige Rückwärts-Züge
  shuffleCount = 20 + levelNum * 3
  for i in range(shuffleCount):
    candidates = []
    for src in tubes:
      if src.length === 0: continue
      for dst in tubes:
        if dst === src: continue
        if dst.length >= 4: continue
        if dst.length > 0 && dst[last] !== src[last]: continue
        candidates.push({src, dst})
    if candidates.length > 0:
      pick = random(candidates)
      pick.dst.push(pick.src.pop())

  // 3. Retry falls zufällig wieder gelöst
  // checkWinState(tubes) ist ein reiner Helfer ohne G-Seiteneffekte:
  //   tubes.every(t => t.length === 0 || (t.length === 4 && t.every(c => c === t[0])))
  if checkWinState(tubes): return generateLevel(levelNum)

  // 4. G-State setzen
  G.tubes        = tubes
  G.selected     = -1
  G.selectedTime = -1
  G.moves        = 0
  G.history      = []
  G.won          = false
  G.flashTube    = -1
  G.flashUntil   = 0
  G.solvedTubes  = new Set()
  ANIM.arc       = null
  ANIM.bounceMap = new Map()
  ANIM.particles = []
  ANIM.busy      = false

  updateHUD()
  hideOverlay()
```

`shuffleCount = 20 + levelNum * 3` sorgt für organisch steigende Schwierigkeit.

---

## 5. HUD-Overlay (HTML über Canvas)

### HTML-Struktur

```html
<div class="canvas-wrap">
  <canvas id="c"></canvas>
  <div class="hud-overlay" id="hud">
    <button class="hud-btn" id="undoBtn" aria-label="Undo">↩</button>
    <span class="hud-level" id="levelLabel">LEVEL 1</span>
    <button class="hud-btn" id="resetBtn" aria-label="Reset">↺</button>
  </div>
</div>
```

### CSS

```css
.canvas-wrap {
  position: relative;   /* Anker für absolute Positionierung */
  width: 100%;
  display: flex;
  justify-content: center;
}

.hud-overlay {
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(8,12,20,0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px 20px 0 0;   /* passend zu canvas border-radius */
  z-index: 10;
}

.hud-btn {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .1s, opacity .2s;
}
.hud-btn:hover  { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.25); }
.hud-btn:active { transform: scale(.92); }
.hud-btn:disabled { opacity: 0.35; cursor: default; pointer-events: none; }

.hud-level {
  font-family: var(--f-head);
  font-size: 1.1rem;
  letter-spacing: .08em;
  color: var(--gold);
}
```

### Undo-Button-Zustand

`updateHUD()` setzt `undoBtn.disabled = G.history.length === 0 || ANIM.busy`.

---

## 6. Undo-Stack-Begrenzung

Nach jedem `G.history.push(...)` in `doMove()`:

```js
if (G.history.length > 5) G.history.shift();
```

Maximum 5 Einträge. `G.history` bleibt ein einfaches Array (kein struktureller Umbau).

---

## 7. Win-Screen-Erweiterung

### HTML (ersetzt bisherigen win-card Inhalt)

```html
<div class="win-card">
  <div class="win-icon">🏆</div>
  <h2 class="win-title">Solved!</h2>
  <p class="win-sub">Level <b id="finalLevel">1</b> — <b id="finalMoves">0</b> Züge</p>
  <div class="win-actions">
    <button class="win-btn win-btn--primary" id="nextLevelBtn">Next Level →</button>
    <button class="win-btn win-btn--secondary" id="menuBtn">Menu</button>
  </div>
</div>
```

### Logik

- **Next Level:** `LEVEL.current++` → `generateLevel(LEVEL.current)` → `hideOverlay()`
- **Menu:** `LEVEL.current = 1` → `generateLevel(1)` → `hideOverlay()`
- **Reset (HUD):** `generateLevel(LEVEL.current)` — gleiche Nummer, neue Generierung

### `showWin()` angepasst

```js
function showWin() {
  document.getElementById('finalLevel').textContent = LEVEL.current;
  document.getElementById('finalMoves').textContent = G.moves;
  document.getElementById('overlay').classList.add('show');
}
```

---

## 8. `updateHUD()` angepasst

```js
function updateHUD() {
  document.getElementById('moveCount').textContent   = G.moves;
  document.getElementById('levelLabel').textContent  = 'LEVEL ' + LEVEL.current;
  document.getElementById('undoBtn').disabled        = G.history.length === 0 || ANIM.busy;
}
```

---

## 9. Sound-Platzhalter

```js
/**
 * Sound-Hook — hier später Audio-Dateien einbinden.
 * @param {'select'|'pop'|'invalid'|'solved'|'win'} name
 */
function playSound(name) {
    // TODO: Audio-Integration
}
```

Aufrufe:

| Stelle im Code | Aufruf |
|---|---|
| `handleInput` — Kugel selektiert | `playSound('select')` |
| `updateArc` — Arc-Ende (Landung) | `playSound('pop')` |
| `triggerFlash` — ungültiger Zug | `playSound('invalid')` |
| `updateArc` — Röhre gelöst | `playSound('solved')` |
| `updateArc` — `checkWin()` true | `playSound('win')` |

---

## 10. Nicht im Scope

- localStorage / Fortschritts-Persistenz
- Highscore-System
- Animierter Level-Übergang
- Schwierigkeitsgrad-Einstellung
- Mehr als 6 Farben
