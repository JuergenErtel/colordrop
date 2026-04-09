# Achievement-Integration Design Spec

**Datum:** 2026-04-09
**Ziel:** Achievements sichtbarer ins Spiel integrieren — motivierender Fortschritt, feierliche Unlock-Momente, klare Verbindung zu Katzen-Belohnungen.

---

## Übersicht

Vier Features, die auf einer gemeinsamen Fortschritts-Engine basieren:

| # | Feature | Ort | Zweck |
|---|---------|-----|-------|
| 1 | Fortschrittsanzeige | Win-Overlay | Zeigt bis zu 3 Achievements mit Balken nach jedem Sieg |
| 2 | Achievement-Popup | Eigenes Overlay | Feierliches zentriertes Overlay beim Freischalten |
| 3 | Nächstes Ziel | Hauptmenü | Motivierender Hinweis auf das nächste erreichbare Achievement |
| 4 | Cat-Verknüpfung | Achievement-Popup | Teaser "Neue Katze!" → Klick → Cat-Unlock-Screen |

Stil: **Motivierend** — der Spieler sieht aktiv, worauf er hinarbeitet.

---

## 1. Gemeinsame Fortschritts-Engine

### Neue Funktion: `getAchievementProgress()`

Berechnet den aktuellen Fortschritt für jedes Achievement. Rückgabe-Format pro Achievement:

```js
{
  id: 'paw_print',
  icon: '🐾',
  title: 'Paw Print',
  desc: 'Solve 20 levels.',
  unlocked: false,
  current: 17,
  target: 20,
  percent: 0.85,
  unlocksCat: 'whiskers' | null
}
```

**Datenquellen:** `loadProgress()`, `loadStats()`, `loadAchievements()`, Cat-Unlock-Mappings aus `cats.js`.

**Target-Mapping pro Achievement:**

| Achievement | Target | Current-Berechnung |
|-------------|--------|-------------------|
| first_solve | 1 | wonCount >= 1 ? 1 : 0 |
| cat_nap | 7 | TODO (Streak-Tage, noch nicht implementiert) |
| paw_print | 20 | wonCount |
| pride_of_lions | 50 | wonCount |
| cat_king | 30 | max gelöstes Level |
| yarn_ball | 10 | threeStarCount |
| tangled | 20 | threeStarCount |
| daily_player | 1 | isDaily completed ? 1 : 0 |
| sharpshooter | 3 | threeStarCount |
| star_collector | 60 | totalStars |
| hot_streak | 5 | currentStreak |
| purrfect | 10 | threeStarCount |
| lightning_paw | 1 | Blitz mit ≥2 Sternen gelöst ? 1 : 0 |
| legendary | 13 | Anzahl freigeschalteter anderer Achievements |

**Ort:** `main.js`, neben `checkAchievements()`.

**Cat-Verknüpfung:** Iteriert über `CATS` aus `cats.js`, prüft welche Katzen `type: 'achievement'` als Unlock-Bedingung haben, und mappt `value` auf die Achievement-ID.

---

## 2. Achievement-Popup (Overlay)

Ersetzt den bestehenden kleinen Toast (`achievementToast`) komplett.

### Visuelles Design

- **Hintergrund:** Dunkles Overlay (`rgba(0,0,0,0.75)`), pausiert das Spiel
- **Card:** Abgerundete Karte mit warmem Braun-Gradient, goldener Border
- **Icon:** 3.5rem, Bounce-Animation (scale 0→1.15→1 mit `cubic-bezier`), goldener `drop-shadow` Glow
- **Label:** "ACHIEVEMENT FREIGESCHALTET" in kleiner Uppercase-Schrift, gold
- **Titel:** Achievement-Name in 1.4rem, gold, mit Text-Shadow
- **Beschreibung:** Achievement-Desc in 0.8rem, weiß mit 55% Opacity
- **Katzen-Teaser:** Nur sichtbar wenn Achievement eine Katze freischaltet. Zeigt "🐱 Neue Katze freigeschaltet!" (nicht welche Katze). Erscheint mit Fade-In nach 0.8s Delay
- **Schließ-Hinweis:** "Tippen zum Fortfahren", weiß 20% Opacity, Fade-In nach 1.2s
- **Partikel:** Goldene ✦/✧ Symbole schweben dezent im Hintergrund

### Sound

Aufsteigender Glitzer-Sound über die bestehende Synth-Engine (Oszillator-basiert, kein Noise).

### Queue-Verhalten

- Mehrere Achievements werden nacheinander angezeigt (wie aktuelles Toast-System, aber als Overlay)
- Jedes Overlay wartet auf Tap/Click
- `_toastQueue` und `_nextToast()` werden durch neues Queue-System ersetzt

### HTML

Neues `<div id="achievementOverlay">` mit innerer Card-Struktur. Ersetzt das bestehende `<div id="achievementToast">`.

### CSS

z-index: 9500 (über Win-Overlay 9200, unter Cat-Unlock falls nötig).

---

## 3. Fortschrittsanzeige im Win-Overlay

### Position

Neue Sektion im bestehenden `.win-card`, zwischen Par-Anzeige (`#winPar`) und Buttons (`.win-actions`).

### Inhalt

Bis zu 3 noch nicht freigeschaltete Achievements, sortiert nach `percent` (höchster zuerst).

Pro Achievement eine Zeile:
- Icon (1.1rem)
- Name (0.65rem, weiß 50%)
- Zähler rechts (0.65rem, gold 70%, z.B. "17/20")
- Dünner Fortschrittsbalken (4px Höhe, Gold-Gradient)

### Animation

- Balken füllen sich mit 0.8s Ease-Transition
- Versetzter Start: 0.3s Delay pro Balken
- Balken die sich durch dieses Level verändert haben pulsieren kurz golden

### Logik

- `getAchievementProgress()` aufrufen, filtern auf `unlocked === false`, sortieren nach `percent` desc, erste 3 nehmen
- Wenn keine offenen Achievements: Sektion ausblenden
- Berechnung bei jedem Level-Sieg in `handleWin()`

### HTML

Neues `<div id="winAchProgress">` innerhalb `.win-card`.

---

## 4. Nächstes Ziel im Hauptmenü

### Position

Unter den Secondary-Buttons (Statistiken, Einstellungen, Katzen-Album, Streak-Kalender), über den Level-Tiers (`#lsTiers`).

### Inhalt

Ein einzelnes Widget:
- Gold-getönter Hintergrund (`rgba(255,215,0,0.06)`), goldene Border
- Abgerundete Karte (12px Radius)
- Links: Achievement-Icon (1.5rem, gold Drop-Shadow)
- Mitte: "NÄCHSTES ZIEL" Label + Achievement-Name + Fortschrittsbalken
- Rechts: Zähler (z.B. "17/20")

### Auswahl-Logik

Das noch nicht freigeschaltete Achievement mit dem höchsten `percent`.

### Interaktion

- Tap/Click öffnet den Stats-Screen (`showStatsScreen()`)

### Sonderfälle

- **Alle freigeschaltet:** Widget zeigt "🌟 Alle Achievements freigeschaltet!" ohne Balken
- **Aktualisierung:** Bei jedem Öffnen des Hauptmenüs (`openLevelSelect()`) neu berechnet

### HTML

Neues `<div id="nextGoalWidget">` in `.ls-actions`, nach `.ls-actions-secondary`.

---

## 5. Event-Flow nach Level-Sieg

Kompletter Ablauf:

```
Level gelöst
  → Canvas-Celebration (2.5s bestehend)
  → Win-Overlay erscheint (mit neuer Fortschrittsanzeige)
  → Spieler klickt "Next Level" oder "Menu"
  → Falls neue Achievements vorhanden:
      → Achievement-Overlay #1
        → Spieler tippt
        → Falls dieses Achievement eine Katze freischaltet:
            → Cat-Unlock-Overlay (bestehend)
            → Spieler tippt
      → Achievement-Overlay #2 (falls vorhanden)
        → gleicher Flow
      → ...
  → Weiter zum nächsten Level / Menü
```

**Änderungen am bestehenden Flow:**

- Achievement-Overlays kommen NACH dem Win-Overlay (nicht mehr als Toast während des Win-Overlays)
- `showCatUnlockToast()` wird in die Achievement-Queue integriert statt parallel aufgerufen
- `handleWin()` speichert `newAchs` und übergibt sie an den Button-Handler von "Next Level"/"Menu"
- Der Button-Handler startet die Achievement-Queue, und erst nach Abarbeitung geht es weiter

---

## 6. Zu entfernende Komponenten

- `<div id="achievementToast">` — HTML entfernen
- `.achievement-toast` CSS — entfernen
- `showAchievementToast()`, `_nextToast()`, `_toastQueue`, `_toastActive` — durch neues Overlay-System ersetzen

---

## 7. Dateien die geändert werden

| Datei | Änderung |
|-------|----------|
| `index.html` | Neues Achievement-Overlay HTML, Win-Progress HTML, Next-Goal Widget HTML, Toast entfernen, neues CSS |
| `js/main.js` | `getAchievementProgress()`, neues Overlay-System, Win-Overlay Fortschritt, Menü-Widget, Flow-Änderungen, Toast-Code entfernen |
| `js/constants.js` | Target-Werte zu `ACHIEVEMENTS` hinzufügen (optional, alternativ Mapping in main.js) |
