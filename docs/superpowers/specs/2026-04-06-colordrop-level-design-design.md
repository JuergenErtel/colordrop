# Color Drop — Level Design & Progression: Design-Spec
**Datum:** 2026-04-06
**Status:** Genehmigt

---

## 1. Ziel

Die bestehende Spiellogik und das Animations-System bleiben unverändert. Darüber wird eine vollständige Progression-Schicht gelegt: deterministische Level via Seeded PRNG, 5 Schwierigkeits-Tiere mit weichen Übergängen, ein Sterne-System mit localStorage-Persistenz und ein Level-Select-Screen als Einstieg ins Spiel.

---

## 2. Neue Tier-Struktur

| Level | Farben | Röhren gesamt | Leer | Tier-Name |
|---|---|---|---|---|
| 1–3 | 2 | 4 | 2 | EASY |
| 4–8 | 3 | 5 | 2 | MEDIUM |
| 9–15 | 4 | 6 | 2 | HARD |
| 16–25 | 5 | 7 | 2 | EXPERT |
| 26+ | 6 | 8 | 2 | MASTER |

`levelConfig(n)` wird erweitert um ein `tier`-Feld:

```js
function levelConfig(n) {
    if (n <=  3) return { colors: ['cyan','magenta'],                          empty: 2, tier: 'EASY'   };
    if (n <=  8) return { colors: ['cyan','magenta','lime'],                   empty: 2, tier: 'MEDIUM' };
    if (n <= 15) return { colors: ['cyan','magenta','lime','yellow'],          empty: 2, tier: 'HARD'   };
    if (n <= 25) return { colors: ['cyan','magenta','lime','yellow','orange'], empty: 2, tier: 'EXPERT' };
    return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 2, tier: 'MASTER' };
}
```

---

## 3. Seeded PRNG (Deterministische Level)

Jedes Level N erzeugt immer dasselbe Puzzle, weil alle Zufallsentscheide im Generator über einen deterministischen PRNG mit Seed = N laufen.

```js
/**
 * Mulberry32 — schneller 32-bit PRNG.
 * @param {number} seed  Level-Nummer (1-basiert)
 * @returns {function(): number}  Gibt Werte in [0, 1) zurück
 */
function mulberry32(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
```

In `generateLevel(n)` wird `const rng = mulberry32(n);` erstellt und alle bisherigen `Math.random()`-Aufrufe durch `rng()` ersetzt.

---

## 4. Par-System

```js
function parForLevel(n) {
    return levelConfig(n).colors.length * 5;
}
```

| Tier | Farben | Par |
|---|---|---|
| EASY | 2 | 10 |
| MEDIUM | 3 | 15 |
| HARD | 4 | 20 |
| EXPERT | 5 | 25 |
| MASTER | 6 | 30 |

---

## 5. Sterne-Rating

```
Züge ≤ par          → ⭐⭐⭐
Züge ≤ par × 1.5    → ⭐⭐
Züge >  par × 1.5   → ⭐
```

```js
function calcStars(moves, par) {
    if (moves <= par)           return 3;
    if (moves <= par * 1.5)     return 2;
    return 1;
}
```

---

## 6. localStorage-Persistenz

**Key:** `colordrop_v1`

**Format:** JSON-Objekt, Key = Level-Nummer als String, Value = beste Stern-Anzahl (1–3).

```json
{ "1": 3, "2": 2, "3": 1 }
```

**Regeln:**
- Nur gelöste Level werden gespeichert.
- Bestehender Wert wird nur überschrieben wenn der neue **besser** ist (z.B. 2→3, nie 3→1).
- `maxUnlocked = Math.max(...Object.keys(data).map(Number)) + 1` (nächstes Level nach dem besten gelösten).
- Level 1 ist immer spielbar (unabhängig von maxUnlocked).

**Helper-Funktionen:**

```js
function loadProgress() {
    try { return JSON.parse(localStorage.getItem('colordrop_v1') || '{}'); }
    catch { return {}; }
}

function saveStars(levelNum, stars) {
    const data = loadProgress();
    if ((data[levelNum] || 0) < stars) {
        data[levelNum] = stars;
        localStorage.setItem('colordrop_v1', JSON.stringify(data));
    }
}

function maxUnlockedLevel() {
    const keys = Object.keys(loadProgress()).map(Number);
    return keys.length === 0 ? 1 : Math.max(...keys) + 1;
}
```

---

## 7. Win-Screen (erweitert)

```html
<div class="win-card">
  <div class="win-icon">🏆</div>
  <h2 class="win-title">Solved!</h2>
  <p class="win-sub">Level <b id="finalLevel">1</b> — <b id="finalMoves">0</b> Züge</p>
  <div class="win-stars" id="winStars">⭐⭐⭐</div>
  <p class="win-par" id="winPar">Par: 10</p>
  <div class="win-actions">
    <button class="win-btn" id="nextLevelBtn">Next Level →</button>
    <button class="win-btn win-btn--secondary" id="menuBtn">Menu</button>
  </div>
</div>
```

`showWin()` berechnet Sterne, zeigt sie an und ruft `saveStars()` auf:

```js
function showWin() {
    if (!G.won) return;
    const par   = parForLevel(LEVEL.current);
    const stars = calcStars(G.moves, par);
    saveStars(LEVEL.current, stars);
    document.getElementById('finalLevel').textContent = LEVEL.current;
    document.getElementById('finalMoves').textContent = G.moves;
    document.getElementById('winStars').textContent   = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('winPar').textContent     = 'Par: ' + par;
    document.getElementById('overlay').classList.add('show');
}
```

---

## 8. HUD (erweitert)

**Neue Anordnung im `.hud-overlay`:**

```
[☰]  [↩]     LEVEL 3 · EASY     [↺]
```

`updateHUD()` aktualisiert das Label:
```js
document.getElementById('levelLabel').textContent =
    'LEVEL ' + LEVEL.current + ' · ' + levelConfig(LEVEL.current).tier;
```

**Neuer Button `#menuBtn-hud`** (☰, ganz links), öffnet den Level Select Screen. Dieser Button ist **unabhängig** vom `#menuBtn` im Win-Overlay.

---

## 9. Level Select Screen

### HTML-Struktur

```html
<div class="level-select" id="levelSelect">
  <div class="ls-inner">
    <h1 class="ls-title">Color Drop</h1>
    <p class="ls-tagline">sort · stack · solve</p>
    <div class="ls-tiers" id="lsTiers">
      <!-- Tier sections und Kacheln werden per JS generiert -->
    </div>
  </div>
</div>
```

### Tier-Sektion (JS-generiert)

```html
<div class="ls-tier">
  <h3 class="ls-tier-label easy">EASY</h3>
  <div class="ls-grid">
    <button class="ls-card solved" data-level="1">
      <span class="ls-num">1</span>
      <span class="ls-stars">⭐⭐⭐</span>
    </button>
    <button class="ls-card locked" data-level="4" disabled>
      <span class="ls-num">🔒</span>
    </button>
    ...
  </div>
</div>
```

### Freischalt-Logik

- `data-level ≤ maxUnlockedLevel()` → spielbar
- `data-level > maxUnlockedLevel()` → `.locked`, `disabled`
- Gelöste Level zeigen Sterne-Emoji-String

### CSS (Kernregeln)

```css
.level-select {
    position: fixed; inset: 0; z-index: 200;
    display: flex; align-items: flex-start; justify-content: center;
    overflow-y: auto;
    background: rgba(8,12,20,.96);
    backdrop-filter: blur(20px);
    padding: 2rem 1rem;
}
.ls-inner { width: 100%; max-width: 480px; }
.ls-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; }
.ls-card  {
    aspect-ratio: 1;
    border-radius: 12px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.12);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s, transform .1s;
}
.ls-card:hover  { background: rgba(255,255,255,.13); }
.ls-card.locked { opacity: .35; cursor: default; }
.ls-card.solved { border-color: rgba(247,201,72,.35); }
.ls-tier-label.easy   { color: #80ffff; }
.ls-tier-label.medium { color: #b2ff59; }
.ls-tier-label.hard   { color: #ffe57f; }
.ls-tier-label.expert { color: #ff7043; }
.ls-tier-label.master { color: #f50057; }
```

### Tier-Grenzen im Screen

Der Level Select zeigt alle Tier-Sektionen bis zum nächsten gesperrten Tier + 1 Level voraus (Motivation). Nicht alle zukünftigen Level werden vorab angezeigt.

**Gezeigt werden:** Level 1 bis `maxUnlockedLevel() + 3`.
- Level ≤ `maxUnlockedLevel()`: spielbar (mit Sternen falls gelöst)
- Level `maxUnlockedLevel()+1` bis `+3`: locked-Kacheln als Vorschau

### Navigation

- App-Start → Level Select erscheint sofort
- Level anklicken → `generateLevel(n)`, Level Select schliessen
- HUD `☰` → Level Select öffnen (Spiel pausiert, kein `G.won`-Check nötig da kein Zustandsverlust)
- `menuBtn` im Win-Overlay → Level Select öffnen (wie bisher)

---

## 10. Nicht im Scope

- Offline-Solver für exakten Minimalzug-Par
- Achievements / Badges
- Cloud-Sync / Account-System
- Animierter Level-Select-Übergang
- Level-Editor
