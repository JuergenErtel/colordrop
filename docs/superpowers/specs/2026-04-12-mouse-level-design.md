# Mäuselevel (Mäusejagd) — Design Spec

## Überblick

Neuer Spezial-Level-Typ: Whack-a-Mole Mini-Game. Mäuse gucken aus 9 Löchern (3x3 Raster) heraus, der Spieler tippt sie um sie zu fangen. Ziel: X Mäuse in Y Sekunden fangen.

## Einordnung im Spiel

- **Typ**: Eigenes Mini-Game (wie Sortier-Regen), ersetzt das normale Röhren-Sortieren
- **Rhythmus**: Alle 5 Level, versetzt zu Tetris — `n >= 12 && n % 5 === 2`
  - Levels: 12, 17, 22, 27, 32, 37, 42, 47, 52, 57...
- **Priorität in der Erkennungskette**: Blitz > Strolch > Mäusejagd > Tetris
  - Kollidiert ein Mäuselevel mit Blitz oder Strolch, gewinnt der höher priorisierte Typ
- **Daily Challenge**: Wird bei `G.isDailyChallenge` übersprungen (wie alle Spezialtypen)

## Spielmechanik

### Ablauf
1. Intro-Overlay erscheint: "🐭 MÄUSEJAGD 🐭" mit Level/Tier-Info und Ziel
2. Spieler klickt "BEREIT!" — Timer startet
3. Mäuse erscheinen zufällig in den 9 Löchern, bleiben kurz sichtbar, verschwinden wieder
4. Spieler tippt auf Mäuse um sie zu fangen
5. Ende wenn: Timer abgelaufen ODER Ziel + Bonusziel erreicht (alle Mäuse gefangen)

### Wertung
- Ziel erreicht → Level bestanden, 1 Stern
- Ziel + 50% Bonus erreicht → 2 Sterne
- Alle Mäuse gefangen (keiner entwischt) → 3 Sterne
- Ziel nicht erreicht → Game Over, Retry/Skip-Overlay

### Belohnung
- Fischgräten wie bei normalen Levels (sternbasiert)
- Goldene Mäuse geben je +5 Bonus-Fischgräten (sofort, unabhängig von Sternen)

## Maus-Typen

| Typ | Sichtzeit | Punkte | Visuell | Ab Tier |
|-----|-----------|--------|---------|---------|
| Normal | Tier-abhängig (2.5s–0.9s) | 1 | Braune Maus, runde Ohren | EASY |
| Schnell | 50% der normalen Zeit | 1 | Graue Maus, alert-Augen | MEDIUM |
| Fett | 150% der normalen Zeit | 2 | Große braune Maus, runde Backen | HARD |
| Golden | Tier-abhängig | 1 + Fischgräten-Bonus | Gold leuchtend, Glitzer-Partikel | MEDIUM |

## Fallen (ab EASY)

| Typ | Sichtzeit | Strafe | Visuell |
|-----|-----------|--------|---------|
| Igel | Wie normale Maus | -3 Sekunden | Stacheliger Igel, braun-beige |

Fallen-Häufigkeit steigt mit Tier:
- EASY: max 1 gleichzeitig aktive Falle
- MEDIUM: 1-2
- HARD: 2
- EXPERT: 2-3
- MASTER: 3

## Schwierigkeitsskalierung

| Parameter | EASY | MEDIUM | HARD | EXPERT | MASTER |
|-----------|------|--------|------|--------|--------|
| Timer (Sek.) | 30 | 25 | 22 | 18 | 15 |
| Ziel (Mäuse) | 6 | 8 | 10 | 12 | 14 |
| Sichtzeit normal | 2.5s | 2.0s | 1.5s | 1.2s | 0.9s |
| Max gleichzeitig sichtbar | 2 | 2-3 | 3 | 3-4 | 4 |
| Spawn-Intervall | 1.2s | 1.0s | 0.8s | 0.7s | 0.6s |
| Fallen aktiv | 1 | 1-2 | 2 | 2-3 | 3 |

## Visuelles Design

### Spielfeld
- 9 Löcher im 3x3 Raster, zentriert auf dem Canvas
- Löcher: dunkle Ellipsen mit leichtem 3D-Rand (Schatten nach innen)
- Hintergrund: bestehender Raum-Hintergrund (Holzboden des Cat Café)

### Mäuse (Canvas-Zeichnungen, prozedural)
- **Kopf**: Ovale Form, braunes Fell mit Farbverlauf
- **Ohren**: Zwei große runde Ohren oben (rosa Innenseite)
- **Augen**: Schwarze Knopfaugen mit weißem Glanzpunkt
- **Nase**: Kleine rosa Dreiecksnase
- **Schnurrhaare**: 3 pro Seite, feine Linien
- **Animation**: Maus fährt von unten hoch (Pop-up), wackelt leicht, fährt wieder runter
- **Fang-Animation**: Katzen-Pfote schlägt zu, Maus verschwindet mit Poof-Partikel
- **Varianten**: Schnelle=grau, Fette=größer+runde Backen, Goldene=Goldfarbe+Glow+Partikel

### Igel-Falle (Canvas)
- Runder Körper mit Stacheln (Dreiecke ringsum)
- Beige Gesicht, kleine schwarze Augen
- Bei Fehl-Tipp: rotes Blitz-Overlay + Schüttel-Animation + Zeitstrafe-Anzeige "-3s"

### HUD während Mäusejagd
- Oben: Timer-Bar (wie Blitz-Level, wiederverwendbar)
- Zähler: "🐭 4/8" (gefangen/ziel)
- Fischgräten-Bonus-Anzeige bei goldener Maus: "+5 🐟" Pop-up

## Technische Architektur

### Neue Dateien
- `js/mouse.js` — Spiellogik (State, Spawn-Queue, Hit-Detection, Scoring)
- `js/mouse-renderer.js` — Canvas-Zeichenfunktionen (drawMouse, drawHedgehog, drawHole, drawPaw)

### Änderungen an bestehenden Dateien
- `js/engine.js` — `isMouseLevel(n)` Erkennung
- `js/main.js` — generateLevel-Integration, Input-Handler, Game-Loop-Hook, Overlay-Handler
- `js/render.js` — renderFrame-Hook für Mäusejagd
- `index.html` — Intro-Overlay HTML, Game-Over-Overlay HTML
- `css/overlays.css` — Styling für Mäusejagd-Overlays

### State-Objekt (MOUSE)
```
MOUSE = {
  active: false,
  holes: [],           // 9 Einträge: { occupied: null | { type, spawnTime, duration } }
  caught: 0,           // gefangene Mäuse
  escaped: 0,          // entwischte Mäuse
  target: 8,           // Ziel-Anzahl
  totalSpawned: 0,     // gesamt gespawnte Mäuse (ohne Fallen)
  bonusBones: 0,       // gesammelte Goldmaus-Boni
  spawnTimer: 0,       // nächster Spawn-Zeitpunkt
  tier: 'MEDIUM',      // aktueller Tier für Skalierung
  pawAnim: null,       // { hole, startTime, duration } aktive Pfoten-Animation
}
```

### Wiederverwendung
- Timer-Bar: bestehende G.timer-Infrastruktur aus timer.js
- Overlay-System: bestehende blitz-overlay CSS-Klassen
- Partikel: bestehende spawnParticle-Funktion
- Sound: bestehende playSound-Infrastruktur (neue Sound-IDs: 'mouse_catch', 'mouse_miss', 'mouse_golden', 'hedgehog_hit')

### Feature-Intro
- Einmaliges Intro-Overlay bei erstem Mäuselevel (Level 12)
- Zeigt 3x3 Raster mit animierter Maus + Pfote + Igel-Warnung
- Nutzt hasSeenIntro('mouse') / markIntroSeen('mouse')

## Sounds (Formant-Synthese)
- `mouse_catch`: kurzes, zufriedenes "Miau"-artiges Piepsen
- `mouse_miss`: enttäuschtes kurzes "meh"
- `mouse_golden`: Kling-Sound (wie Münze)
- `hedgehog_hit`: Schmerz-Pieks + Brummen
