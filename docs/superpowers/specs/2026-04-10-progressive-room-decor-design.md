# Progressive Room Decoration — Design Spec

## Overview

Die 10 freischaltbaren Dekor-Elemente aus `room.js` werden direkt im Canvas-Hintergrund gezeichnet. Der Raum füllt sich visuell, je mehr Level der Spieler löst — vom leeren Café bis zum voll eingerichteten Katzencafé.

## Design-Entscheidungen

| Aspekt | Entscheidung |
|--------|-------------|
| Zeichenstil | Detailliert-prozedural (Canvas API, keine externen Assets) |
| Platzierung | Voller Raum — Wand, Seiten, Boden, unter/hinter Tisch |
| Unlock-Animation | Sanftes Fade-In (alpha 0→1, ~1s) |
| Farbgebung | Eigenfarbe + leichter Theme-Tint via `lerpHSL` |
| Idle-Animation | Nur 3 Elemente: Pflanze wiegt, Kaminfeuer flackert, Kronleuchter schwingt |

## Unlock-Reihenfolge & Positionen

| Lvl | ID | Name | Zone | Idle-Anim |
|----:|-----|------|------|-----------|
| 3 | rug | Kuschelteppich | Boden, unter Tisch (elliptisch) | — |
| 8 | shelf | Bücherregal | Wand, links-mitte | — |
| 15 | catbed | Katzenkörbchen | Boden, rechts vom Tisch | — |
| 25 | lamp | Stehlampe | Boden, links (+ Lichtkegel) | — |
| 40 | plant | Zimmerpflanze | Boden, rechts außen | wiegt sanft |
| 60 | wallart | Katzenbild | Wand, links oben | — |
| 85 | cattree | Kratzbaum | Boden, rechts-mitte | — |
| 120 | window | Fensterplatz | Wand, rechts oben | — |
| 160 | fireplace | Kamin | Wand/Boden, links | Feuer flackert |
| 200 | chandelier | Kronleuchter | Decke, mittig | schwingt leicht |

## Render-Reihenfolge (Z-Order)

Elemente werden in die bestehende Layer-Struktur von `background.js` integriert:

1. Wall (besteht)
2. Floor (besteht)
3. Baseboard (besteht)
4. **Teppich** — auf dem Boden, unter dem Tisch
5. Table (besteht)
6. **Wand-Elemente** — Bücherregal, Katzenbild, Fenster (hängen an der Wand, hinter dem Spielfeld)
7. **Kronleuchter** — hängt von der Decke
8. **Boden-Elemente links** — Stehlampe, Kamin (neben dem Spielfeld)
9. **Boden-Elemente rechts** — Katzenkörbchen, Zimmerpflanze, Kratzbaum
10. Spotlight (besteht)
11. Vignette (besteht)
12. **Lampen-/Kamin-Lichteffekte** — additive Glows über der Vignette
13. Lamp glow (besteht)
14. Dust motes (besteht)

## Element-Details

### 1. Kuschelteppich (Level 3)
- Ovaler Orientteppich unter dem Tisch
- Doppelter Bordürenring, Rauten-Motive an 4 Achsen
- Medaillon-Muster im Zentrum
- Fransen an Ober- und Unterkante
- Subtiler Abnutzungs-Highlight (hellerer Fleck)
- Basisfarbe: warm-rot/bordeaux, Theme-Tint auf Gold-Akzente

### 2. Bücherregal (Level 8)
- 4 Holz-Regalbretter mit sichtbarer Holzmaserung und Schattenwurf
- ~16 Bücher in verschiedenen Farben/Höhen mit Rücken-Details (Titellinien)
- Zusätzliche Objekte: Katzenfigur, Wollknäuel, Tasse mit Henkel, Mini-Pflanze, kleiner Bilderrahmen
- Holzfarbe: mittelbraun, Theme-Tint auf Buchfarben

### 3. Katzenkörbchen (Level 15)
- Geflochtener Weidenkorb mit horizontaler+vertikaler Flechtstruktur
- Kissen mit sichtbarer Naht
- Schlafende Katze: geschlossene Augen (gebogene Linien), Tigerstreifen, rosa Nase, Schwanz, vorgestreckte Pfote
- Ohr-Innenseite rosa
- Vorderer Korbrand als 3D-Lippe
- Basisfarbe: natürliches Weidenbraun, Katze sandfarben

### 4. Stehlampe (Level 25)
- Stoffschirm: Trapezform mit Stofftextur (vertikale Streifen) und Mittelnaht
- Sichtbare Glühbirne mit Glow
- Messing-Stange mit 2 Zierringen
- Runder Sockel
- Lichtkegel: auf Wand (oben) und Boden (unten) als radiale Gradienten
- Basisfarbe: cremefarbener Schirm, Messing-Stange, warmer Lichtkegel

### 5. Zimmerpflanze (Level 40)
- 7 Blätter in verschiedenen Grüntönen und Winkeln
- Hintere Blätter heller/kleiner (Tiefenstaffelung)
- Blattdetails: Mittelrippe + 2-3 Seitenadern pro Hauptblatt
- Terracotta-Topf: konische Form, Rand-Wulst, Ring-Detail, Textur-Linien
- Sichtbare Erde am Topfrand
- **Idle-Animation:** sanftes Wiegen der Blätter (sin-basiert, ~0.00015 speed)
- Basisfarbe: Grüntöne, Terracotta-Orange

### 6. Katzenbild (Level 60)
- Goldrahmen: doppelte Fase (outer+inner bevel), Highlight auf Oberseite
- Passepartout (heller Rand innerhalb des Rahmens)
- Katzenportrait: Kopf mit Ohren (Innenfarbe rosa)
  - Grüne Augen mit schwarzer Pupille und weißem Glanzpunkt
  - Rosa Dreiecksnase
  - Mund (zwei gebogene Linien)
  - 4 Schnurrhaare (2 pro Seite)
  - Stirnstreif (Tabby-Markierung)
- Schattenwurf hinter dem Rahmen an der Wand
- Basisfarbe: Gold-Rahmen, sandfarbene Katze

### 7. Kratzbaum (Level 85)
- 3 Plattformen (oben breit, mitte mittel, Basis breit) mit Teppich-Bezug
- 2 Pfosten: oberer (dünn) und unterer (dicker), Sisal-Wicklung als diagonale Streifen
- Kratzspuren auf dem unteren Pfosten (3 vertikale Linien)
- Seitenarm am Hauptpfosten mit hängendem Spielball (rot, an Faden)
- Basisfarbe: Naturholz/Sisal-Beige, Plattformen in warmem Grau-Beige

### 8. Fensterplatz (Level 120)
- Holzrahmen mit 4-teiliger Sprossung (Kreuz)
- Glaseffekt: leichter Blau-Gradient, Reflexion (heller Streifen oben-links)
- Außenansicht: 2-3 Wolken, Baumsilhouette, Dachkontur, warmer Horizont-Gradient
- Breites Fensterbrett mit kleinem Blumentopf (Blümchen)
- Lichteinfall: heller Gradient unter dem Fenster in den Raum hinein
- Basisfarbe: Holzrahmen mittelbraun, Glas bläulich-transparent

### 9. Kamin (Level 160)
- Steineinfassung: Ziegeltextur (horizontale+vertikale Fugen)
- 2 Pilaster (seitliche Stützen), Schlussstein über dem Bogen
- Kaminsims oben mit Schmuckleiste
- Halbrunder Bogen als Öffnung, dunkler Innenraum mit Rußflecken
- 3 Holzscheite mit Astlöchern, verschiedene Winkel
- Dreischichtiges Feuer: äußere Flamme (orange), innere Flamme (gelb), Kern (weiß-gelb)
- 2 Funken über dem Feuer
- Glutbett am Boden (rötlicher Gradient)
- Warmer Schein auf Wand (oben) und Boden (vorne)
- Feuerschein/Unterkante
- **Idle-Animation:** Flammen flackern (perlin-ähnlich mit sin-Kombination, ~0.003 speed), Funken wandern
- Basisfarbe: Stein rotbraun, Feuer orange/gelb

### 10. Kronleuchter (Level 200)
- Deckenhalterung (Rosette) + Kette (3-4 Glieder angedeutet)
- Messing-Hub (zentraler Körper, oval)
- 5 geschwungene Arme mit Kerzentellern
- Wachskerzen mit leichten Wachstropfen-Details
- Zweischichtige Flammen (äußere orange, innere gelb-weiß) pro Kerze
- Gesamter Lichtschein als großer radialer Gradient
- **Idle-Animation:** leichtes Schwingen (sin-basiert, ~0.0001 speed, max ±2px horizontal)
- Basisfarbe: Messing-Gold, cremefarbene Kerzen

## Technische Architektur

### Neue Datei: `js/room-decor.js`

Zentrale Datei für alle Dekor-Zeichenfunktionen:

```
export function drawRoomDecor(ctx, ts, theme, prevTheme, fade)
```

- Ruft intern `calculateRoomProgress()` auf (gecacht, nicht pro Frame)
- Iteriert über freigeschaltete Elemente und ruft die jeweilige `draw*`-Funktion auf
- Berechnet Theme-Tint einmalig und reicht ihn durch

### Einzelne Zeichenfunktionen

Pro Element eine Funktion:
- `drawRug(ctx, h, s, b, alpha)`
- `drawShelf(ctx, h, s, b, alpha)`
- `drawCatBed(ctx, h, s, b, alpha)`
- `drawLamp(ctx, h, s, b, alpha)`
- `drawPlant(ctx, ts, h, s, b, alpha)` — ts für Idle-Animation
- `drawWallArt(ctx, h, s, b, alpha)`
- `drawCatTree(ctx, h, s, b, alpha)`
- `drawWindow(ctx, h, s, b, alpha)`
- `drawFireplace(ctx, ts, h, s, b, alpha)` — ts für Idle-Animation
- `drawChandelier(ctx, ts, h, s, b, alpha)` — ts für Idle-Animation

Parameter:
- `h, s, b`: blended Theme-Farbe (wie in `drawBackground`)
- `alpha`: 0-1, für Fade-In bei neuem Unlock
- `ts`: Timestamp für animierte Elemente

### Theme-Tint-Berechnung

Jedes Element hat eine Basisfarbe. Der Theme-Tint wird per `lerpHSL` beigemischt:

```js
// Beispiel: Pflanze
const baseH = 120; // Grün
const tinted = lerpHSL(baseH, 50, 60, h, s, b, 0.15); // 15% Theme-Einfluss
```

Tint-Stärke: 10-20% je nach Element. Genug für Harmonie, wenig genug für Erkennbarkeit.

### Fade-In-System

- `room-decor.js` importiert `calculateRoomProgress()` aus `room.js`
- Bei jedem Frame wird geprüft welche Items unlocked sind
- Neu freigeschaltete Items bekommen eine `unlockTime` gespeichert (in-memory)
- Alpha berechnet sich als: `Math.min((ts - unlockTime) / 1000, 1)`
- Nach vollständigem Fade-In: Alpha bleibt 1, keine weitere Berechnung

### Integration in Render-Pipeline

In `render.js`, nach `drawBackground()`:

```js
import { drawRoomDecor } from './room-decor.js';

// In der Render-Funktion, nach drawBackground:
drawRoomDecor(ctx, ts, theme, prevTheme, G.themeFade);
```

Die Funktion `drawRoomDecor` ruft intern `calculateRoomProgress()` auf und zeichnet nur freigeschaltete Elemente.

### Positions-Konstanten

Alle Positionen relativ zu `CW`/`CH` definiert (responsive):

```js
const DECOR_POS = {
  rug:        { cx: CW * 0.50, cy: (TUBE_BOT + CH) / 2 + 8, rx: CW * 0.30, ry: CH * 0.09 },
  shelf:      { x: CW * 0.28, y: CH * 0.05, w: CW * 0.18, h: CH * 0.14 },
  catbed:     { cx: CW * 0.72, cy: CH * 0.73 - 2, w: 48, h: 24 },
  lamp:       { x: CW * 0.04, y: CH * 0.73 - 80 },
  plant:      { x: CW * 0.92, y: CH * 0.73 - 50 },
  wallart:    { x: CW * 0.07, y: CH * 0.09, w: 62, h: 48 },
  cattree:    { x: CW * 0.68, y: CH * 0.73 - 65 },
  window:     { x: CW * 0.82, y: CH * 0.07, w: 72, h: 80 },
  fireplace:  { x: CW * 0.16, y: CH * 0.73 - 52, w: 64 },
  chandelier: { cx: CW * 0.50, y: 0 },
};
```

### Performance

- `calculateRoomProgress()` wird gecacht (einmal pro Level-Wechsel, nicht pro Frame)
- Statische Elemente (ohne Idle-Animation) können auf ein Off-Screen-Canvas vorgerendert werden, das nur bei Theme-Wechsel neu gezeichnet wird
- Animierte Elemente (Pflanze, Kamin, Kronleuchter) werden jeden Frame gezeichnet, aber die Berechnungen sind minimal (sin/cos)

## Nicht im Scope

- Interaktion mit Dekor-Elementen (Antippen, Hover-Effekte)
- Sound-Effekte beim Unlock (ggf. separates Feature)
- Partikel-Effekte beim Unlock (Confetti etc. — ggf. separates Feature)
- Anordnung der Elemente durch den Spieler (Drag & Drop)
