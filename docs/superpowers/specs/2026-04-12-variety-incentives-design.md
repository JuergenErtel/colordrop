# Kittysort — Mehr Abwechslung & Anreize

**Datum:** 2026-04-12
**Status:** Approved

---

## 1. Der Hund "Strolch" (Störenfried-Mechanik)

### Konzept
Ab Level 10 taucht alle 3 Level ein frecher Hund auf, der zeitbasiert Bälle zwischen Röhren verschiebt.

### Auftrittshäufigkeit
- Ab Level 10, jedes 3. Level (10, 13, 16, 19, …)
- NICHT gleichzeitig mit Tetris- oder Blitz-Leveln
- Anzeige im Level-Header: "🐕 Strolch ist unterwegs!" 

### Timing pro Angriff
- **8s Cooldown** zwischen Angriffen (Timer startet bei Levelstart)
- **3s Vorwarnung**: Pfoten am Canvas-Rand, Ziel-Röhre wird orange markiert, Knurr-/Schnüffel-Sound
- **Zuschlagen**: Hund rennt rein, schnappt obersten Ball der Ziel-Röhre, rennt zu einer Ziel-Röhre, legt Ball ab
- **Wegrennen**: Staubwolke, frecher Ausdruck, "Wuff!"-Sound
- Danach 8s Cooldown bis nächste Vorwarnung

### Ball-Verschiebung (Logik)
- **Source**: Zufällige nicht-leere, nicht-gelöste Röhre (bevorzugt Röhren mit gemischten Farben)
- **Destination**: Zufällige andere Röhre, wobei bevorzugt wird: (1) Röhre wo die Farbe passt (top matches), (2) leere Röhre, (3) beliebige nicht-volle Röhre
- **Sicherheit**: Verschiebung ist immer ein legaler Zustand (Ball wird gepoppt und gepusht). Das Level bleibt lösbar, weil der Hund nur umsortiert — keine Bälle verschwinden oder entstehen
- **Nicht während Animation**: Hund wartet, falls gerade ein Arc/Move animiert wird

### Visuelles
- **Hund**: Canvas-gezeichneter Cartoon-Hund, braun/weiß, ~80px hoch, einfacher Stil passend zur Katze
- **Vorwarnung**: Zwei braune Pfoten tauchen am linken oder rechten Canvas-Rand auf, wackeln leicht. Die Ziel-Röhre bekommt einen pulsierenden orangenen Rahmen
- **Angriff**: Hund läuft horizontal über die Röhren (ease-in-out, ~600ms). Beim Source-Tube: Ball "schnappt" er sich (Ball fliegt an seine Position). Beim Dest-Tube: Ball fällt rein (normaler Drop mit Bounce)
- **Abgang**: Hund rennt zum gegenüberliegenden Rand raus, kleine Staubwolken-Partikel
- **Sprechblase**: Kurze "Hehe!" oder "Wuff!"-Blase über dem Hund beim Wegrennen

### Audio
- Vorwarnung: leises Knurren/Schnüffeln (kurzer Noise-basierter Sound)
- Zuschlagen: "Wuff!" (kurzer bellender Sound)
- Wegrennen: schnelles Tapsen (rhythmische kurze Clicks)

### Undo-Interaktion
- Hund-Züge werden NICHT in die Undo-History aufgenommen (der Spieler kann Hund-Aktionen nicht rückgängig machen)
- Hund-Timer pausiert während Undo-Animation

---

## 2. Joker-Ball (Wildcard)

### Konzept
Ein regenbogenfarbener Ball, der auf jede Farbe passt. Kleine Hilfe in schwierigen Leveln.

### Auftrittshäufigkeit
- Ab Level 20
- ~15% Chance pro Level, dass ein Joker-Ball vorkommt
- Maximal 1 Joker pro Level
- Ersetzt einen zufälligen Ball bei der Level-Generierung

### Gameplay
- Kann auf JEDE Farbe gelegt werden (passt immer)
- JEDE Farbe kann auf den Joker gelegt werden
- Bei der Solved-Prüfung zählt der Joker als "passend" zu jeder Farbe
- Im Tube-Clear-Effekt (4 gleichfarbige Bälle): Joker zählt als die Farbe der anderen 3 Bälle

### Visuelles
- Regenbogen-Gradient statt einfarbig
- Leichtes Funkeln/Glitzer-Partikel im Idle
- Kleiner Stern statt Katzengesicht
- `PALETTE.joker = { base: rainbow-gradient, bright: '#fff', dark: '#888', glow: 'rgba(255,255,255,0.5)' }`

---

## 3. Eis-Ball (Frozen)

### Konzept
Ein eingefrorener Ball ganz unten in einer Röhre. Kann nicht bewegt werden, bis alle Bälle darüber entfernt wurden. Dann taut er auf.

### Auftrittshäufigkeit
- Ab Level 30
- ~20% Chance pro Level, 1-2 Eis-Bälle pro Level
- Immer auf Position 0 (ganz unten) einer Röhre platziert

### Gameplay
- Eis-Ball kann NICHT bewegt werden, solange Bälle darüber liegen
- Sobald der Eis-Ball der einzige Ball in der Röhre ist, startet automatisch eine Auftau-Animation (~800ms)
- Nach dem Auftauen wird er zu einem normalen Ball seiner Farbe und kann bewegt werden
- Eis-Bälle blockieren das Solved-Prüfen: eine Röhre mit Eis-Ball kann nicht "gelöst" sein

### Visuelles
- Normale Ballfarbe, aber mit halbtransparentem Eisblau-Overlay
- Eiskristall-Muster (2-3 weiße Linien als Risse)
- Auftau-Animation: Eis schmilzt von oben nach unten (Overlay fade-out), Wassertropfen-Partikel, kurzer "Pling!"-Sound
- Leichtes Schimmern im Idle (weißer Glanz wandert über den Ball)

---

## 4. Wöchentliche Herausforderung

### Konzept
Jeden Montag startet eine 3-Level-Serie mit Bonus-Belohnung.

### Mechanik
- 3 aufeinanderfolgende Puzzle-Level mit steigender Schwierigkeit (MEDIUM → HARD → EXPERT)
- Seeded RNG basierend auf ISO-Wochennummer (deterministisch)
- Verfällt am Sonntag 23:59
- Belohnung: 50 Fischgräten + exklusiver Rahmen für Katzen-Karte (rotiert wöchentlich aus 4 Designs: Gold, Silber, Bronze, Diamant)

### UI
- Neuer Button im Level-Select: "📅 Wochen-Challenge" (unterhalb Daily Challenge)
- Fortschrittsanzeige: 3 Kreise (leer/gefüllt) für die 3 Level
- Nach Abschluss: Belohnungs-Overlay mit Rahmen-Vorschau
- "Bereits abgeschlossen ✓" wenn fertig

### Storage
- `catsort_weekly`: `{ week: ISO-Woche, completed: [bool, bool, bool], frame: string }`

---

## 5. Meilenstein-Belohnungen

### Konzept
Bei bestimmten Level-Meilensteinen gibt es besondere Belohnungen.

### Meilensteine
| Level | Belohnung | Animation |
|-------|-----------|-----------|
| 25 | 30 Fischgräten + "Entdecker"-Badge | Konfetti + Gold-Flash |
| 50 | 50 Fischgräten + Hintergrund "Garten" | Blütenregen-Partikel |
| 100 | 75 Fischgräten + Hintergrund "Dachterrasse" | Feuerwerk |
| 150 | 100 Fischgräten + Ball-Skin "Glitzer" | Glitzer-Explosion |
| 200 | 125 Fischgräten + Hintergrund "Winterstube" | Schneeflocken |
| 300 | 200 Fischgräten + Ball-Skin "Gold" + "Legende"-Badge | Mega-Feuerwerk + alle Effekte |

### UI
- Meilenstein-Overlay (ähnlich Cat-Unlock): großes Icon, Animation, Beschreibungstext
- Im Level-Select: Meilenstein-Marker auf der Level-Leiste (Stern-Icon)

### Storage
- `catsort_milestones`: `{ 25: true, 50: true, ... }` (einmal pro Meilenstein)

---

## 6. Ball-Skins

### Konzept
Freischaltbare visuelle Varianten für die Bälle. Rein kosmetisch.

### Skins
| Skin | Kosten | Freischaltung |
|------|--------|---------------|
| Wollknäuel | — | Standard (gratis) |
| Glitzer | 50 | Shop oder Meilenstein 150 |
| Kristall | 80 | Shop |
| Goldfaden | 100 | Shop oder Meilenstein 300 |

### Gameplay
- Skin ändert nur die Zeichnung in `balls.js` (Textur/Effekte), nicht die Farbe
- Aktiver Skin gilt für alle Modi
- Auswahl im Einstellungen-Screen

### Visuelles
- **Glitzer**: Funkelnde Partikel auf der Ball-Oberfläche, Sternchen statt Faden-Textur
- **Kristall**: Halbtransparent, facettierte Reflexionen, prismatischer Glanz
- **Goldfaden**: Goldene Fäden statt normale, warmer Glanz, luxuriöser Look

### Storage
- `catsort_skins`: `{ owned: ['default', 'glitter'], active: 'default' }`

---

## 7. Freischaltbare Hintergründe

### Konzept
3 zusätzliche Szenen neben dem Standard-Katzencafé.

### Hintergründe
| Name | Freischaltung | Stil |
|------|---------------|------|
| Katzencafé | Standard | Warme Brauntöne, Holz, gemütlich |
| Garten | Meilenstein 50 | Grüntöne, Blumen, Sonnenlicht, Bäume |
| Dachterrasse | Meilenstein 100 | Abendrot, Stadtsilhouette, Lichterketten |
| Winterstube | Meilenstein 200 | Schnee am Fenster, Kamin, warmes Licht |

### Gameplay
- Hintergrund ändert die Canvas-Zeichnung in `background.js` und `room-decor.js`
- Auswahl im Einstellungen-Screen
- Hintergrund gilt für alle Modi

### Storage
- `catsort_backgrounds`: `{ owned: ['cafe'], active: 'cafe' }`

---

## Technische Übersicht

### Neue Dateien
- `js/dog.js` — Hund-Logik (Timer, Angriff, State Machine)
- `js/dog-renderer.js` — Hund Canvas-Zeichnung und Animationen
- `js/weekly.js` — Wöchentliche Herausforderung Logik
- `js/milestones.js` — Meilenstein-Prüfung und Belohnungen
- `js/skins.js` — Ball-Skin Verwaltung

### Geänderte Dateien
- `js/engine.js` — Joker-Ball und Eis-Ball in Level-Generierung, `canMove`/`isSolved` Anpassungen
- `js/balls.js` — Joker-Ball Rendering, Eis-Ball Rendering, Skin-Varianten
- `js/render.js` — Eis-Auftau-Animation, Hund-Rendering-Integration
- `js/main.js` — Hund-Timer, Joker/Eis in Spiellogik, Meilenstein-Check bei Win, Weekly-UI
- `js/constants.js` — Neue Palette-Einträge (Joker), Meilenstein-Definitionen
- `js/storage.js` — Neue Storage-Keys (weekly, milestones, skins, backgrounds)
- `js/audio.js` — Hund-Sounds (knurren, wuff, tapsen), Eis-Sounds (schmelzen, pling)
- `js/background.js` — Neue Hintergrund-Szenen
- `index.html` — Weekly-Button, Meilenstein-Overlay, Skin/Background-Auswahl in Settings
- `css/game.css` — Styling für neue UI-Elemente
