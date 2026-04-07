# Color Drop Phase 3a — Visual Themes + Zeit-Level: Design-Spec
**Datum:** 2026-04-07
**Status:** Genehmigt

---

## 1. Ziel

Zwei unabhängige Subsysteme, die zusammen das Spielgefühl deutlich aufwerten:

1. **Visuelle Themes** — Jeder Tier bekommt ein eigenes visuelles Thema (Hintergrund, Ball-Stil, Akzentfarbe). Der Wechsel beim Erreichen eines neuen Tiers ist ein spürbarer Belohnungsmoment.
2. **Zeit-Level** — Jedes 5. Level (5, 10, 15 …) ist ein „Blitzrunde" mit Countdown. Bei Zeitablauf schlägt das Level fehl.

Alle Änderungen bleiben in `index.html`. Keine neuen Abhängigkeiten.

---

## 2. Visuelle Themes

### 2.1 Theme-Tabelle

| Tier | Level | Name | Hintergrund | Ball-Stil |
|------|-------|------|-------------|-----------|
| EASY | 1–3 | **Neon Night** *(aktuell)* | Dunkelblau-Lila, Sterne-Partikel | Glänzende 3D-Neon-Kugeln |
| MEDIUM | 4–8 | **Sunset** | Dunkelrot-Amber, Glut-Partikel | Satinierte Kugeln, warme Highlights |
| HARD | 9–15 | **Arctic** | Tiefes Eisblau, Schneestaub-Partikel | Kristall-Kugeln, Frost-Glanz |
| EXPERT | 16–25 | **Volcanic** | Fast-schwarzes Rot, Glut-Lava-Partikel | Feurige Kugeln, Lava-Glühen |
| MASTER | 26+ | **Aurum** | Schwarz-Gold, funkelnde Gold-Partikel | Goldene Kugeln, Edelstein-Schimmer |

### 2.2 Theme-Objekt

```js
const THEMES = {
    EASY:   { bgColors: ['#0a0a1a','#1a0a3a'], particleColor: '#ffffff',
               ballStyle: 'neon',    accentColor: '#7c4dff' },
    MEDIUM: { bgColors: ['#1a0800','#3a1400'], particleColor: '#ff6b35',
               ballStyle: 'satin',   accentColor: '#ff7043' },
    HARD:   { bgColors: ['#000d1a','#001428'], particleColor: '#a8d8ea',
               ballStyle: 'crystal', accentColor: '#00b4d8' },
    EXPERT: { bgColors: ['#1a0000','#2d0000'], particleColor: '#ff4500',
               ballStyle: 'fire',    accentColor: '#ff3d00' },
    MASTER: { bgColors: ['#0a0800','#1a1200'], particleColor: '#ffd700',
               ballStyle: 'aurum',   accentColor: '#ffc107' },
};
```

### 2.3 Ball-Stile

Alle Stile verwenden dieselben Spiel-Farben (cyan, magenta, lime …). Nur der visuelle Rendering-Effekt ändert sich:

| Style | Glanzpunkt | Rim-Light | Glow |
|-------|-----------|-----------|------|
| `neon` | weiss, scharf (aktuell) | nein | ja, farbig |
| `satin` | weiss, weich diffus | orange-warm | gedämpft |
| `crystal` | weiss+blau, scharf | blau-kalt | klar, kalt |
| `fire` | orange-weiss | rot | feurig, warm |
| `aurum` | gold, metallisch | gold | funkeld |

### 2.4 Theme-Wechsel

- `currentTheme()` — gibt `THEMES[levelConfig(LEVEL.current).tier]` zurück
- Theme-Wechsel tritt auf wenn `levelConfig(n).tier !== levelConfig(n-1).tier`
- Bei Wechsel: `G.themeFade = 0` → animiert auf `1` über 500 ms
- `drawBackground()` interpoliert bei `G.themeFade < 1` zwischen altem und neuem Theme

### 2.5 State-Erweiterungen

```js
G.theme       // aktuelles Theme-Objekt (Referenz aus THEMES)
G.themePrev   // vorheriges Theme (für Fade-Übergang), null wenn kein Wechsel läuft
G.themeFade   // 0..1, Fortschritt des Übergangs-Fade
```

---

## 3. Zeit-Level (Blitzrunde)

### 3.1 Definition

- `isTimedLevel(n)` → `n % 5 === 0`
- Zeitlimit skaliert mit Tier:

| Tier | Zeitlimit |
|------|-----------|
| EASY | 90 Sek. |
| MEDIUM | 120 Sek. |
| HARD | 150 Sek. |
| EXPERT | 180 Sek. |
| MASTER | 210 Sek. |

### 3.2 Blitzrunde-Interstitial

Erscheint **vor** dem Zeit-Level — nach dem Win-Overlay des vorherigen Levels oder beim Klick im Level-Select.

**Inhalt:**
```
⚡  BLITZRUNDE  ⚡
LEVEL 5 · EASY
Du hast 90 Sekunden.
Kein Erbarmen.
[ BEREIT! ]
```

**Verhalten:**
- Eigenes `#blitzOverlay` (analog `#overlay`)
- Hintergrund pulst in `accentColor` des aktuellen Themes (CSS keyframe `blitz-pulse`)
- Titel flackert beim Erscheinen (CSS keyframe `blitz-flicker`, 0.4 s, einmalig)
- Timer startet **erst** wenn Spieler auf BEREIT! tippt → kein Stress beim Lesen
- Im Level-Select: Zeit-Level-Buttons zeigen ⚡-Icon statt normaler Nummer

### 3.3 Timer-Anzeige

- Schmaler Balken (`#timerBar`, 6px hoch) direkt unter dem HUD
- Läuft von 100% → 0% (rechts nach links)
- Farbverlauf: grün → orange → rot (Breakpoints bei 50% und 20%)
- Unter 20%: Balken pulst (CSS animation)
- Unter 10 Sek.: Tick-Sound jede Sekunde (`playSound('tick')`) — neuer ZzFX-Sound, wird in Task 2 hinzugefügt

### 3.4 Timeout

- Overlay `#timeoutOverlay`: "ZEIT ABGELAUFEN" + Retry-Button
- Kein Stern wird gespeichert
- `G.timer.active = false` → Input blockiert

### 3.5 State-Erweiterungen

```js
G.timer = null | {
    active:   boolean,   // false = abgelaufen oder pausiert
    endTime:  number,    // rAF-Timestamp bei dem die Zeit abläuft
    duration: number,    // Gesamtdauer in ms (für Balkenprozent)
}
```

### 3.6 Timer-Lifecycle

```
generateLevel(n)  [aufgerufen von Next-Level oder Level-Select]
  → Puzzle aufbauen (G.tubes etc.)
  → isTimedLevel(n)?
       ja → G.timer = { active: false, duration }   // Timer noch NICHT aktiv
            Input blockieren (ANIM.busy = true)
            #blitzOverlay anzeigen (Puzzle sichtbar aber gesperrt)
       nein → G.timer = null

Klick BEREIT! in #blitzOverlay
  → #blitzOverlay verstecken
  → G.timer.active = true
  → G.timer.endTime = performance.now() + G.timer.duration
  → ANIM.busy = false   // Input freigeben

render() jede Frame:
  → updateTimer()
       if (G.timer?.active && frameTime >= G.timer.endTime) → showTimeout()
  → drawTimerBar()  (nur wenn G.timer != null)

showTimeout():
  → G.timer.active = false
  → ANIM.busy = true  (blockiert Input)
  → #timeoutOverlay anzeigen

Klick Retry in #timeoutOverlay:
  → #timeoutOverlay verstecken
  → generateLevel(LEVEL.current)   // zeigt erneut #blitzOverlay
```

### 3.7 Undo während Blitzrunde

Undo ist erlaubt (kein Extra-Penalty). Undo kostet Zeit indirekt durch die verbrauchten Sekunden.

---

## 4. Neue HTML-Elemente

```html
<!-- Timer-Balken (unter HUD, über Canvas) -->
<div id="timerBar" class="timer-bar hidden"></div>

<!-- Blitzrunde-Ankündigung -->
<div id="blitzOverlay" class="blitz-overlay hidden">
    <div class="blitz-inner">
        <h2 class="blitz-title">⚡ BLITZRUNDE ⚡</h2>
        <p class="blitz-level" id="blitzLevel">LEVEL 5 · EASY</p>
        <p class="blitz-time" id="blitzTime">Du hast 90 Sekunden.</p>
        <p class="blitz-sub">Kein Erbarmen.</p>
        <button id="blitzStartBtn" class="blitz-btn">BEREIT!</button>
    </div>
</div>

<!-- Timeout-Overlay -->
<div id="timeoutOverlay" class="overlay hidden">
    <div class="win-card">
        <h2>ZEIT ABGELAUFEN</h2>
        <button id="timeoutRetryBtn" class="win-btn">Nochmal</button>
    </div>
</div>
```

---

## 5. Neue CSS-Klassen

```css
/* Timer-Balken */
.timer-bar { height: 6px; width: 100%; transition: background 0.5s; }
.timer-bar.pulse { animation: timer-pulse 0.5s ease-in-out infinite alternate; }

/* Blitzrunde-Overlay */
.blitz-overlay { position: fixed; inset: 0; z-index: 60;
                  display: flex; align-items: center; justify-content: center; }
.blitz-inner { text-align: center; padding: 2rem; }
.blitz-title { animation: blitz-flicker 0.4s ease-out; font-size: 2rem; }
@keyframes blitz-flicker { 0%,20%,80%,100%{opacity:1} 10%,70%{opacity:.2} }
@keyframes blitz-pulse { from{opacity:.7} to{opacity:1} }
@keyframes timer-pulse { from{opacity:.6} to{opacity:1} }
```

---

## 6. Betroffene bestehende Funktionen

| Funktion | Änderung |
|----------|----------|
| `generateLevel(n)` | Theme berechnen + `G.theme` setzen; bei Tier-Wechsel `G.themeFade` starten; bei `isTimedLevel`: `#blitzOverlay` anzeigen statt direkt starten |
| `drawBackground(ts)` | Theme-Farben aus `G.theme`; interpoliert während Fade |
| `drawBall(...)` | Ball-Rendering-Zweig je `G.theme.ballStyle` |
| `buildLevelSelect()` | ⚡-Icon auf Zeit-Level-Buttons |
| `render()` | `updateTimer()` + `drawTimerBar()` aufrufen |
| `updateHUD()` | ⚡-Icon im Level-Label wenn `isTimedLevel` |

---

## 7. Nicht in Scope

- Kein Pausieren des Timers (Menu öffnen während Blitzrunde: nicht blockiert)
- Kein separater Highscore für Blitzrunden
- Kein Theme-Selector (Themes sind nicht manuell wählbar)
- Keine Animations-Überblendung zwischen Ball-Stilen (sofortiger Wechsel)
