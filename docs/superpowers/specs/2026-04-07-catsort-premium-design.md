# CatSort — Premium Freemium Puzzle Game

**Datum:** 2026-04-07
**Basis:** ColorDrop (bestehendes Ball-Sort-Puzzle, 100 Level, Canvas-basiert)
**Ansatz:** Evolution — bestehendes Spiel zum Katzen-thematisierten Premium-Produkt transformieren

---

## 1. Branding & Visuelles Theme

### Name

**CatSort** — kurz, klar, App-Store-suchbar.

### Visuelles Konzept: Cozy Katzencafé

**Hintergrund:**
- Warmes, gemütliches Katzencafé-Interior (illustrativ, nicht fotorealistisch)
- Weiches Licht, Bücherregale, Pflanzen
- Pro Tier wechselt die Café-Szene:
  - Easy: Fensterbrett
  - Medium: Sofa-Ecke
  - Hard: Dachterrasse
  - Expert: Kaminzimmer
  - Master: Geheimes Dachboden-Zimmer
- Subtile Parallax-Animation (Dampf aus Kaffeetasse, Staubpartikel im Licht)

**Behälter (ersetzt Röhren):**

| Tier | Behälter-Typ |
|------|-------------|
| Easy | Offene Pappkartons |
| Medium | Geflochtene Körbchen |
| Hard | Kratzbaumplattformen |
| Expert | Elegante Katzenbetten |
| Master | Goldene Premium-Körbe |

**Bälle → Wollknäuel:**
- 6 Farben als flauschige Wollknäuel mit sichtbarer Textur
- Jedes Knäuel hat ein winziges Katzengesicht-Detail (Augen + Ohren die rausgucken)
- Subtile Wackel-Animation im Idle-State
- Bei Auswahl: Knäuel springt freudig hoch

**UI-Elemente:**
- Buttons mit Pfoten-Icons und abgerundeten, weichen Formen
- Schriftart: rund, freundlich (z.B. Nunito, Quicksand)
- Farbpalette: warme Töne (Creme, Karamell, Rosé, Salbei)
- Menü-Icons: Pfote (Menü), Wollknäuel (Undo), Katzengesicht (Hint)

---

## 2. Katzen-Sammelsystem

### Konzept: Katzen-Album

Spieler sammeln **30 verschiedene Katzen** — jede mit eigenem Namen, Rasse und Illustration.

### Freischalt-Quellen

| Quelle | Anzahl | Beispiele |
|--------|--------|-----------|
| Story-Level Milestones | 10 | Level 10, 25, 50, 75, 100, 150, 200, 250, 300, Endlos-Start |
| Achievements | 8 | Erster Win, 3-Star-Streak ×10, alle Tiers geschafft, etc. |
| Daily Challenge Streaks | 6 | 3, 7, 14, 30, 60, 100 Tage in Folge |
| Blitz-Erfolge | 3 | Erster Blitz-Win, 10 Blitz-Wins, alle Blitz-Levels |
| Geheime / Easter-Egg | 3 | 100 Undos benutzt, um Mitternacht gespielt, Level in 1 Zug |

### Katzen-Galerie Screen

- Grid-Ansicht aller 30 Katzen
- Freigeschaltet: farbige Illustration + Name + Rasse + kurzer Fun-Fact
- Gesperrt: grauer Silhouetten-Umriss + "???" + vager Hint zur Freischaltung
- Tap auf Katze → Detail-Ansicht mit größerer Illustration

### Beispiel-Katzen

1. "Mochi" — Britisch Kurzhaar, grau, rund, verschlafen
2. "Espresso" — Schwarze Katze, wach, neugierig
3. "Mango" — Orange Tabby, verspielt
4. "Luna" — Weiße Perserkatze, elegant
5. "Pixel" — Calico, quirky
6. ...bis zu seltenen: "Kaiser" — Goldene Sphynx (Geheime Katze)

### Freischalt-Feedback

- Neue Katze → spezieller Celebration-Screen mit Illustration + Name + "Neue Katze entdeckt!"
- Toast-Notification mit Schnurr-Sound
- Kleine Katze erscheint kurz auf dem Spielfeld und winkt

---

## 3. Freemium & Monetarisierung

### Währung: Fischgräten

| Aktion | Verdienst |
|--------|-----------|
| Level gewonnen | 5 Fischgräten |
| 3-Star Level | 10 Fischgräten |
| Daily Challenge | 15 Fischgräten |
| Blitz-Win | 3 Fischgräten |
| Rewarded Video (optional) | 20 Fischgräten |

### Free vs. Premium

| Feature | Free | Premium |
|---------|------|---------|
| Alle Level spielbar | Ja | Ja |
| Werbung | Interstitial alle 3 Level | Keine |
| Undo | 3 pro Level | Unbegrenzt |
| Hints | 15 Fischgräten pro Hint | Unbegrenzt, gratis |
| Fischgräten-Verdienst | Normal | Doppelt |
| Endlos-Modus | 3 Runden/Tag | Unbegrenzt |
| Exklusive Katzen | — | 5 Premium-Katzen |
| Musik bei Ads | Pausiert | Unterbrechungsfrei |

### Premium-Preis

- Einmalkauf: **4,99€**
- Einführungsangebot (erste 24h): 2,49€ (50% Rabatt)
- Premium-Button permanent im Menü (dezent)

### Ad-Strategie

- **Interstitial:** nach jedem 3. gewonnenen Level, max 1 pro 3 Minuten
- **Rewarded Video:** optional im Shop ("Schau Video für 20 Fischgräten"), nie erzwungen
- **Kein Banner:** zerstört Café-Atmosphäre und Canvas-Ästhetik

### Fair-Play-Prinzipien

- Kein Pay-to-Win: alle Level ohne Premium lösbar
- Kein Energy/Lives-System: Spieler können immer spielen
- Ads nervig genug zum Konvertieren, nicht aggressiv genug zum Deinstallieren

---

## 4. Audio & Atmosphäre

### Hintergrundmusik

- Lo-Fi / Cozy Café Stil: sanfte Akustikgitarre, leises Klavier, weiche Pads
- 2-3 Loops je ~60-90 Sekunden
- Pro Tier ein Mood-Wechsel:
  - Easy: fröhlich, leicht
  - Medium: entspannt, jazzy
  - Hard: fokussiert, minimal
  - Expert: atmosphärisch, spannender
  - Master: episch, belohnend
- Leise im Hintergrund, Spielsounds haben Priorität
- Getrennte Mute-Toggles: Musik / Effekte

### Sound-Effekte

| Aktion | Sound |
|--------|-------|
| Wollknäuel auswählen | Weiches "Miau" (kurz, variiert) |
| Knäuel landen | Sanfter Plop + leises Glöckchen (Halsband) |
| Ungültiger Zug | Kurzes Fauchen |
| Röhre gelöst | Zufriedenes Schnurren (1 Sek.) |
| Level gewonnen | Schnurren + Glöckchen-Melodie |
| Katze freigeschaltet | "Mrrp!" + Jingle |
| Undo | Leises "Mew" (rückwärts-artig) |
| Hint benutzt | Neugieriges "Prrt?" |
| Blitz-Timer tickt | Ticken, ab 10 Sek. lauter + Katzen-Nervosität |

### Ambient-Details

- Leises Kaffeetassen-Klirren (dezent, zufällig)
- Gelegentliches fernes Schnurren (alle ~30 Sek.)
- Regen-auf-Fenster in bestimmten Tiers (optional)

---

## 5. Content & Level-Struktur

### Story-Level: 300 Level in 5 Tiers

| Tier | Level | Farben | Behälter | Café-Szene |
|------|-------|--------|----------|------------|
| Easy | 1-50 | 2-3 | 4-5 | Fensterbrett |
| Medium | 51-120 | 3-4 | 5-6 | Sofa-Ecke |
| Hard | 121-200 | 4-5 | 6-7 | Dachterrasse |
| Expert | 201-260 | 5-6 | 7-8 | Kaminzimmer |
| Master | 261-300 | 6 | 8 | Geheimes Dachboden-Zimmer |

- Bestehender Seed-basierter Generator auf 300 Level erweitert
- Tier-Grenzen und Par-Werte proportional angepasst
- Blitzrunde weiterhin alle 5 Level

### Endlos-Modus

- Freigeschaltet nach Level 100
- Free: 3 Runden/Tag, Premium: unbegrenzt
- Startet bei Medium-Schwierigkeit, steigert sich alle 5 Runden
- Schwierigkeits-Cap bei Master-Niveau
- Eigener Highscore: "Längste Serie ohne Fehler"
- Fischgräten: 3 pro Runde, Bonus alle 10 Runden
- Bei Niederlage: Zusammenfassung (Runden, Züge, Fischgräten)

### Daily Challenge

- Datum-Seed wie bisher
- Neu: **Streak-Kalender** — visueller Monatskalender mit Pfoten-Stempeln
- Streak-Belohnungen schalten Katzen frei (3, 7, 14, 30, 60, 100 Tage)

---

## 6. UI-Screens & Navigation

### Screen-Struktur

```
Startscreen (CatSort Logo + Katzen-Animation)
├── Spielen → Level Select (5 Tier-Tabs, scrollbares Grid)
│   └── Level → Gameplay Screen
│       └── Win Screen (Sterne + Fischgräten + ggf. neue Katze)
├── Endlos → Endlos-Gameplay
│   └── Game Over Screen (Zusammenfassung)
├── Daily → Daily Challenge Gameplay
│   └── Win Screen + Streak-Kalender
├── Katzen-Album → Galerie Grid (30 Katzen)
│   └── Katzen-Detail (Illustration + Info)
├── Statistiken → Stats + Achievements
├── Einstellungen → Musik/Effekte Lautstärke, Premium kaufen
└── Premium-Banner (dezent, unterer Rand)
```

### Startscreen

- CatSort-Logo mit animierter Katze die auf dem "o" schläft
- Wollknäuel rollt als Ladeanimation
- Buttons: Spielen, Endlos, Daily, Katzen-Album, Stats, Einstellungen
- Täglicher Streak-Counter oben rechts
- Fischgräten-Counter oben links

### Level Select

- 5 Tabs oben (Tier-Namen mit Café-Szene-Icon)
- Grid-Ansicht:
  - Gesperrt: Karton mit Klebeband zu
  - Gelöst: offener Karton mit 1-3 Sternen
  - Aktuelles Level: Katze guckt aus dem Karton

### Win Screen

- Große Sterne-Animation
- Fischgräten fliegen ins Counter
- Bei neuer Katze: Reveal mit Illustration + Name + "Neue Katze entdeckt!"
- Buttons: Nächstes Level, Nochmal, Level Select

### Gameplay HUD

- Oben links: Fischgräten-Counter
- Oben mitte: Level-Name + Zug-Counter (grün/orange/rot)
- Oben rechts: Menü (Pfote-Icon)
- Unten: Undo (Wollknäuel-Icon) + Hint (Katzengesicht-Icon)
- Blitz: Timer-Balken oben, Katze am Rand wird nervöser je weniger Zeit

---

## 7. Technische Umsetzung

### Architektur

Bestehende Single-File aufteilen:

```
index.html          — Shell, CSS, Canvas, Buttons
js/
  engine.js         — Game-State, Züge, Validierung, Win-Check, PRNG
  render.js         — Canvas-Rendering (Hintergrund, Behälter, Knäuel, Partikel)
  theme.js          — Tier-Themes, Farben, Café-Szenen
  audio.js          — Web Audio, Musik-Loops, Sound-Effekte
  collection.js     — Katzen-Album, Freischalt-Logik
  economy.js        — Fischgräten, Premium-Status, Ad-Timing
  ui.js             — Screens, Modals, Navigation, Level-Select
  daily.js          — Daily Challenge, Streak-Kalender
  endless.js        — Endlos-Modus Logik
  storage.js        — localStorage Abstraktion
  tutorial.js       — Tutorial-Flow
```

### Assets

| Typ | Anzahl | Größe |
|-----|--------|-------|
| Katzen-Illustrationen | 30 | je ~50-100KB (PNG/WebP/SVG) |
| Café-Hintergründe | 5 | je ~100-200KB |
| Musik-Loops | 5 (1 pro Tier) | je ~200-500KB (MP3/OGG) |
| Katzen-Sounds | 3-4 Samples | ~50KB gesamt |
| Sonstige SFX | Synthetisch (ZzFX) | ~1KB |
| **Gesamt** | | **~5-8 MB** |

### Persistenz (localStorage)

| Key | Inhalt |
|-----|--------|
| `catsort-progress` | Level-Stars (300 Level) |
| `catsort-daily` | Daily-Daten + Streak-Kalender |
| `catsort-stats` | Spielstatistiken |
| `catsort-achievements` | Achievement-Status |
| `catsort-collection` | Freigeschaltete Katzen |
| `catsort-economy` | Fischgräten-Balance |
| `catsort-premium` | Premium-Status |
| `catsort-settings` | Musik/Effekte Lautstärke |

### Asset-Beschaffung

- Katzen-Illustrationen + Café-Hintergründe: KI-generiert (konsistenter Stil) oder Illustrator
- Musik: lizenzfreie Lo-Fi Loops (Pixabay, Uppbeat) oder KI-generiert
- Katzen-Sounds: freie Sound-Libraries (Freesound.org) oder aufnehmen
