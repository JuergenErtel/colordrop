# Color Drop Phase 3b — Daily Challenge, Achievements + Stats: Design-Spec
**Datum:** 2026-04-07
**Status:** Genehmigt

---

## 1. Ziel

Drei unabhängige, datengetriebene Subsysteme die das Spiel über den reinen Puzzle-Loop hinaus bereichern:

1. **Daily Challenge** — täglich ein neues Level (datumsbasierter Seed), eigener Modus + Markierung im Level-Select.
2. **Achievements** — 14 Abzeichen in zwei Kategorien (Fortschritt + Skill), Toast-Benachrichtigung nach dem Win.
3. **Stats** — Spielstatistiken (gespielte Level, Züge, Blitzrunden, Streaks), eigener Screen mit Achievement-Übersicht.

Alle Änderungen bleiben in `index.html`. Keine neuen Abhängigkeiten.

---

## 2. Architektur & Storage

### 2.1 localStorage-Keys

```
colordrop_v1           (unverändert)  { levelNum: stars }

colordrop_daily        {
    date:      "2026-04-07",   // ISO-Datum YYYY-MM-DD
    levelNum:  12,             // berechneter Tageslevel
    completed: false,          // true nach erstem Win
    stars:     0               // 0 = nicht gespielt, 1–3 = Ergebnis
}

colordrop_stats        {
    played:         0,   // gespielte Level (normal + daily)
    won:            0,   // gewonnene Level
    totalMoves:     0,   // Gesamtzüge über alle Level
    blitzPlayed:    0,   // gestartete Blitzrunden
    blitzWon:       0,   // gewonnene Blitzrunden
    bestStreak:     0,   // längste 3★-Serie (historisches Maximum)
    currentStreak:  0    // aktuelle laufende 3★-Serie
}

colordrop_achievements  ["first_win", "tier_medium", ...]   // Array unlocked IDs
```

### 2.2 Neue Hilfsfunktionen

```js
loadDaily()           → Object   // {} wenn kein Eintrag
saveDaily(obj)        → void

loadStats()           → Object   // Defaults wenn kein Eintrag
saveStats(obj)        → void

loadAchievements()    → string[] // [] wenn kein Eintrag
saveAchievements(ids) → void
```

### 2.3 Achievement-Prüfung

`checkAchievements(context)` wird nach jedem Win aufgerufen. `context` enthält den aktuellen Spielstand (Level, Stars, Stats). Gibt ein Array neu freigeschalteter Achievement-IDs zurück und speichert sie persistent.

---

## 3. Daily Challenge

### 3.1 Tagesauswahl

```js
function dailyLevelNum() {
    const dateStr = new Date().toISOString().slice(0, 10);  // "2026-04-07"
    let hash = 0;
    for (const ch of dateStr) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
    return (Math.abs(hash) % 25) + 1;   // Level 1–25 (EASY bis EXPERT; MASTER bewusst ausgeschlossen)
}
```

Gleicher Tag = gleicher Level für alle Spieler. Kein separater PRNG-Seed nötig — `generateLevel(n)` verwendet ohnehin den Level-Index als Seed.

### 3.2 Interstitial

Vor dem Spielen erscheint ein eigenes Overlay `#dailyOverlay` (analog `#blitzOverlay`):

```
📅  TAGES-CHALLENGE
Dienstag, 7. April 2026
Level 12 · MEDIUM
[ SPIELEN ]
```

- Datum wird lokalisiert dargestellt: `new Date().toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })`
- Hintergrundfarbe: `accentColor` des aktuellen Themes (CSS-Variable `--daily-color`)

### 3.3 Daily-Modus-Flag

`G.isDailyChallenge = false` — wird `true` wenn der Spieler über den Daily-Button einsteigt. Steuert:
- Kein Blitz-Timer (auch wenn das Level normalerweise `isTimedLevel(n)` wäre)
- Retry-Button nach Timeout deaktiviert (Daily kann nicht wiederholt werden)
- `saveStars()` wird auch aufgerufen (normaler Fortschritt zählt mit)
- `saveDaily()` wird zusätzlich aufgerufen

### 3.4 Bereits gespielt

Wenn `loadDaily().date === today && loadDaily().completed`:
- Button zeigt "📅 Heute: ★★☆ — Morgen wieder" statt "📅 Tages-Challenge"
- Kein Overlay, kein Spielen möglich

### 3.5 Level-Select Markierung

In `buildLevelSelect()`: der Tages-Level bekommt ein zusätzliches `📅`-Icon. Ist das Level gesperrt (noch nicht freigeschaltet), bleibt der Button gesperrt — der Daily-Zugang läuft nur über den eigenen Button.

### 3.6 HTML

```html
<!-- Daily Challenge Interstitial -->
<div id="dailyOverlay" class="blitz-overlay">
    <div class="blitz-inner" id="dailyInner">
        <h2 class="blitz-title">📅 TAGES-CHALLENGE</h2>
        <p class="blitz-level" id="dailyDate">Dienstag, 7. April 2026</p>
        <p class="blitz-time" id="dailyLevelLabel">Level 12 · MEDIUM</p>
        <button id="dailyStartBtn" class="blitz-btn" type="button">SPIELEN</button>
    </div>
</div>
```

---

## 4. Achievements

### 4.1 Achievement-Tabelle

| ID | Icon | Name | Bedingung |
|---|---|---|---|
| `first_win` | 🏆 | Erster Sieg | Erstes Level gewonnen |
| `tier_medium` | 🔥 | Aufsteiger | Level 4 gelöst (MEDIUM freigeschaltet) |
| `tier_hard` | ❄️ | Eisbrecher | Level 9 gelöst (HARD freigeschaltet) |
| `tier_expert` | 🌋 | Vulkanläufer | Level 16 gelöst (EXPERT freigeschaltet) |
| `tier_master` | 👑 | Meister | Level 26 gelöst (MASTER freigeschaltet) |
| `levels_10` | ⭐ | Zehner | 10 verschiedene Level gelöst |
| `levels_25` | 🌟 | Vierteljahrhundert | 25 verschiedene Level gelöst |
| `daily_first` | 📅 | Tagesmensch | Erste Daily Challenge abgeschlossen |
| `par_first` | 🎯 | Scharf | Erstes Level in Par oder besser gelöst |
| `three_star` | ✨ | Perfektion | Erstes 3-Sterne-Ergebnis |
| `streak_3` | 🔥 | Dreier-Serie | 3× 3-Sterne in Folge |
| `streak_5` | 💥 | Fünfer-Serie | 5× 3-Sterne in Folge |
| `blitz_first` | ⚡ | Blitzsieger | Erste Blitzrunde gewonnen |
| `blitz_5` | ⚡⚡ | Blitzmeister | 5 Blitzrunden gewonnen |

### 4.2 Konstante

```js
const ACHIEVEMENTS = [
    { id:'first_win',   icon:'🏆', name:'Erster Sieg',          desc:'Erstes Level gewonnen' },
    { id:'tier_medium', icon:'🔥', name:'Aufsteiger',            desc:'MEDIUM-Tier erreicht' },
    { id:'tier_hard',   icon:'❄️', name:'Eisbrecher',            desc:'HARD-Tier erreicht' },
    { id:'tier_expert', icon:'🌋', name:'Vulkanläufer',          desc:'EXPERT-Tier erreicht' },
    { id:'tier_master', icon:'👑', name:'Meister',               desc:'MASTER-Tier erreicht' },
    { id:'levels_10',   icon:'⭐', name:'Zehner',                desc:'10 Level gelöst' },
    { id:'levels_25',   icon:'🌟', name:'Vierteljahrhundert',    desc:'25 Level gelöst' },
    { id:'daily_first', icon:'📅', name:'Tagesmensch',           desc:'Erste Daily Challenge' },
    { id:'par_first',   icon:'🎯', name:'Scharf',                desc:'Level in Par gelöst' },
    { id:'three_star',  icon:'✨', name:'Perfektion',            desc:'3 Sterne erreicht' },
    { id:'streak_3',    icon:'🔥', name:'Dreier-Serie',          desc:'3× 3 Sterne in Folge' },
    { id:'streak_5',    icon:'💥', name:'Fünfer-Serie',          desc:'5× 3 Sterne in Folge' },
    { id:'blitz_first', icon:'⚡', name:'Blitzsieger',           desc:'Blitzrunde gewonnen' },
    { id:'blitz_5',     icon:'⚡⚡',name:'Blitzmeister',          desc:'5 Blitzrunden gewonnen' },
];
```

### 4.3 checkAchievements(context)

```js
// context = { levelNum, stars, stats, progress, isDaily, isBlitzWin }
function checkAchievements(context) → string[]  // neu freigeschaltete IDs
```

Prüft jede Achievement-Bedingung gegen `context` und die bestehende `loadAchievements()`-Liste. Gibt nur neu freigeschaltete IDs zurück.

### 4.4 Toast-Anzeige

- `#achievementToast` — festes Element unten-Mitte, `position: fixed; bottom: 2rem`
- Erscheint nach dem Win-Overlay (500 ms Verzögerung)
- Zeigt jeweils ein Achievement: `"🏆 Erster Sieg freigeschaltet!"`
- 3 Sekunden sichtbar, dann fade-out
- Mehrere neue Achievements: Queue, nacheinander

---

## 5. Stats

### 5.1 Aktualisierung

`updateStats(levelNum, stars, moves, isBlitz, blitzWon)` — nach jedem `showWin()` aufgerufen:
- `played++`, `won++`
- `totalMoves += moves`
- `blitzPlayed++` wenn `isBlitz`; `blitzWon++` wenn `isBlitz && blitzWon`
- Streak: `currentStreak++` wenn `stars === 3`, sonst `currentStreak = 0`
- `bestStreak = Math.max(bestStreak, currentStreak)`

### 5.2 Stats-Screen

Eigener Screen `#statsScreen` (analog `#levelSelect`), erreichbar über:
- Hauptmenü-Button (neuer Eintrag)
- Noch kein HUD-Zugang (YAGNI)

Inhalt:
```
STATISTIKEN
───────────────────────
Gespielte Level      42
Gewonnen             38
Gesamtzüge        1'204
Blitzrunden          8 gespielt · 5 gewonnen
Längste ★★★-Serie     4
───────────────────────
ACHIEVEMENTS   11 / 14
[🏆][✨][⚡][🎯][🔥] …   ← freigeschaltet (farbig)
[?][?][?]               ← gesperrt (grau)
[ zurück ]
```

Gesperrte Achievements zeigen nur `?` — kein Spoiler.

---

## 6. Neue HTML-Elemente

```html
<!-- Daily Challenge Interstitial (analog blitzOverlay) -->
<div id="dailyOverlay" class="blitz-overlay">
    <div class="blitz-inner">
        <h2 class="blitz-title">📅 TAGES-CHALLENGE</h2>
        <p class="blitz-level" id="dailyDate"></p>
        <p class="blitz-time" id="dailyLevelLabel"></p>
        <button id="dailyStartBtn" class="blitz-btn" type="button">SPIELEN</button>
    </div>
</div>

<!-- Achievement Toast -->
<div id="achievementToast" class="achievement-toast hidden"></div>

<!-- Stats Screen -->
<div id="statsScreen" class="screen hidden">
    <div class="stats-card">
        <h2 class="stats-title">STATISTIKEN</h2>
        <div class="stats-grid" id="statsGrid"></div>
        <h3 class="stats-subtitle" id="achievementCount">ACHIEVEMENTS 0 / 14</h3>
        <div class="achievement-grid" id="achievementGrid"></div>
        <button class="win-btn" id="statsBackBtn">← Zurück</button>
    </div>
</div>
```

Startbildschirm: neuer `#dailyChallengeBtn` unter `#playBtn`.

---

## 7. Neue CSS-Klassen

```css
/* Achievement Toast */
.achievement-toast {
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: rgba(20,20,40,.92); border: 1px solid rgba(255,255,255,.2);
    border-radius: 12px; padding: .6rem 1.4rem;
    font-size: .9rem; color: #fff; z-index: 300;
    opacity: 0; transition: opacity .3s;
    pointer-events: none;
}
.achievement-toast.show { opacity: 1; }

/* Stats Screen */
.stats-card { /* analog .win-card */ }
.stats-grid { display: grid; grid-template-columns: 1fr auto; gap: .4rem 1.2rem; }
.achievement-grid { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
.ach-icon { font-size: 1.5rem; opacity: .3; }
.ach-icon.unlocked { opacity: 1; }
```

---

## 8. Betroffene bestehende Funktionen

| Funktion | Änderung |
|---|---|
| `showWin()` | Ruft `updateStats()` und `checkAchievements()` auf; startet Achievement-Toast-Queue |
| `generateLevel(n)` | Prüft `G.isDailyChallenge`; überspringt Blitz-Timer wenn gesetzt |
| `buildLevelSelect()` | 📅-Icon auf Tages-Level-Button |
| Startbildschirm | Neuer `#dailyChallengeBtn` |
| Hauptmenü | Neuer Eintrag "Statistiken" → `showStatsScreen()` |

---

## 9. State-Erweiterung

```js
G.isDailyChallenge = false;   // true wenn über Daily-Button gestartet
```

---

## 10. Nicht in Scope

- Kein Social-Sharing der Daily Challenge
- Kein Online-Leaderboard
- Kein Achievement-Screen mit Details (nur Grid-Übersicht im Stats-Screen)
- Keine Hint-Funktion (separates Feature, zurückgestellt)
- Keine Push-Benachrichtigung für tägliche Challenge
