# Menu Redesign — Royal Bold Premium

**Datum:** 2026-04-08
**Status:** Approved
**Scope:** Komplettes Menü-Redesign (alles außer Splash)

## Kontext

Das aktuelle Level-Select-Menü und die Overlay-Screens sehen "billig" aus — flache, transparente Buttons ohne Tiefe, minimale Level-Cards, kein visueller Wow-Effekt. Der Splash-Screen und Cat-Unlock-Celebration sind bereits hochwertig. Ziel: Den gesamten Rest auf das gleiche Premium-Niveau heben.

## Designrichtung: Royal Bold

Inspiriert von Top-Casual-Games (Royal Match, Candy Crush): Goldene Gradienten, 3D-Buttons mit Box-Shadow-Tiefe, knallige Farbakzente, klare visuelle Hierarchie.

## 1. Action-Buttons (Level-Select-Hauptmenü)

### Primär-Buttons (Tages-Challenge, Endlos-Modus)
- Background: Farbige linear-gradients (Gold für Tages-Challenge, Lila für Endlos)
- 3D-Effekt: `box-shadow: 0 4px 0 <darker-shade>, 0 6px 15px rgba(0,0,0,.4)`
- Inset-Highlight: `inset 0 1px 0 rgba(255,255,255,.3)` für Glanz
- Border-radius: 14px
- Font: Fredoka, 1rem, weight 700
- Textfarbe: Dunkel auf Gold (#4a2000), Weiß auf Lila
- Press-Effekt: `translateY(2px)`, box-shadow reduziert auf `0 2px 0`
- Hover: Leicht heller, `translateY(-1px)`, shadow vergrößert

### Sekundär-Buttons (Statistiken, Einstellungen, Katzen-Album, Streak-Kalender)
- Layout: 2x2 Grid statt vertikaler Stack
- Background: `rgba(255,255,255,.08)`
- Border: `1px solid rgba(255,215,0,.25)`
- Border-radius: 12px
- Font: Fredoka, 0.8rem, weight 500
- Textfarbe: `rgba(255,255,255,.7)`
- Hover: Border → `rgba(255,215,0,.4)`, Background → `rgba(255,255,255,.12)`
- Emoji-Icons links vom Text

### Katzen-Album Button — Sonderbehandlung
- Leichter Gold-Schimmer am Border, hebt sich von den anderen Sekundär-Buttons ab
- Zeigt aktives Maskottchen-Emoji wenn vorhanden

## 2. Level-Pfad (Tier-Sections mit Nodes)

Ersetzt das bisherige 4-Spalten-Grid komplett.

### Tier-Karten
- Jeder Schwierigkeitsgrad (Easy, Medium, Hard, Expert, Master) als eigene Karte
- Background: `rgba(<tier-color>, .08)`
- Border: `1px solid rgba(<tier-color>, .2)`
- Border-radius: 16px
- Padding: 1rem
- Tier-Label oben zentriert: Uppercase, letter-spacing 0.15em, Tier-Farbe
- Gesperrte Tiers: `opacity: 0.5`, Schloss-Icon neben Label

### Tier-Farben (bestehend)
- Easy: `#d4873f` (Gold)
- Medium: `#b07baa` (Lila)
- Hard: `#6ba3a0` (Teal)
- Expert: `#c96b4f` (Rust)
- Master: `#c9a84c` (Gelb)

### Level-Nodes (innerhalb der Tier-Karte)
- Layout: Horizontal flex, zentriert, gap 0.6rem
- Form: Rund (border-radius: 50%)
- Größe: 48px × 48px

**Solved:**
- Background: `linear-gradient(135deg, #FFD700, #FF8C00)`
- Box-shadow: `0 3px 0 #B8860B, 0 0 15px rgba(255,200,0,.2)`
- Level-Nummer in dunkelbrauner Farbe (#4a2000), weight 800
- Sterne darunter in kleiner Schrift (0.4rem)

**Current (nächstes zu spielen):**
- Background: `linear-gradient(135deg, #8B5CF6, #6D28D9)`
- Box-shadow: `0 3px 0 #4C1D95, 0 0 20px rgba(139,92,246,.3)`
- Pulsierender Glow-Animation (scale 1→1.08, 2s infinite alternate)
- Level-Nummer weiß, weight 800

**Locked:**
- Background: `rgba(255,255,255,.05)`
- Border: `2px solid rgba(255,255,255,.1)`
- Schloss-Icon in `rgba(255,255,255,.2)`

### Verbinder zwischen Tiers
- Vertikale Linie: `2px solid rgba(255,255,255,.1)`, 15px Höhe
- Zentriert zwischen den Tier-Karten

## 3. Overlay-Screens

### Gemeinsame Basis (Settings, Stats, Album, Streak, Cat-Detail)
- Card-Background: `linear-gradient(135deg, rgba(80,45,25,.95), rgba(60,35,20,.95))`
- Border: `1px solid rgba(255,215,0,.15)` (dezenter Gold-Schimmer statt weiß)
- Border-radius: 24px (bleibt)
- Box-shadow: `0 20px 60px rgba(0,0,0,.5)`
- Title: Fredoka statt Nunito, `background: linear-gradient(180deg, #FFD700, #d4873f)`, `-webkit-background-clip: text`

### Zurück-Button (in allen Overlays)
- Gleicher Royal-Bold-Stil wie Hauptmenü-Buttons
- Gold-Gradient, 3D-Effekt, Press-Animation

### Settings-Screen
- Slider-Thumb: Gold-Gradient statt flat `var(--gold)`
- Slider-Track: `rgba(255,215,0,.15)` Hintergrund
- Toggle-Buttons: Gold-Akzent wenn aktiv
- Labels: Etwas heller (`rgba(255,255,255,.8)`)

### Stats-Screen
- Werte in Gold-Farbe statt plain weiß
- Grid-Zeilen mit subtiler Trennlinie (`rgba(255,255,255,.06)`)
- Achievement-Icons: Gold-Border wenn unlocked, `box-shadow: 0 0 8px rgba(255,215,0,.2)`

### Album-Screen
- Zellen: Leichter Gold-Border wenn unlocked
- Mascot-Auswahl-Button: Gold-Gradient (3D) statt flat
- Locked-Cells: Dezenter, `opacity: 0.25`

### Streak-Kalender
- Gespielte Tage: Gold-Gradient-Hintergrund statt flat rgba
- Heute: Leuchtender Gold-Border mit Glow
- Streak-Zahl: Größer, Gold-Gradient-Text

## 4. Win-Screen / Game-Over

### Win-Screen
- Buttons: 3D-Gold-Gradient (Primär) bzw. 3D mit dezenter Border (Sekundär)
- Titel "Solved!": Stärkerer Gold-Glow (`text-shadow: 0 0 30px rgba(255,200,0,.4)`)
- Sterne: Leichter Glow-Effekt

### Game-Over / Timeout
- Gleiche Button-Upgrades
- Emoji-Icon etwas größer

## 5. HUD (Gameplay-Leiste)

- Buttons (Menu, Undo, Reset): Leichter 3D-Effekt mit `box-shadow: 0 2px 0 rgba(0,0,0,.3)`
- Active: `translateY(1px)`, shadow reduziert
- Hint-Button: Behält bestehenden Glow (schon Premium)
- Level-Anzeige: Gold-Gradient-Text statt flat gold

## 6. Blitz/Daily/Endless Overlays

- Buttons: 3D-Stil wie Hauptmenü
- Glow-Pulse-Animation bleibt (schon gut)
- Title: Gold-Gradient-Text

## 7. Tutorial-Bubble

- Background: Reicherer Gradient statt flat
- Border: Dezenter Gold-Akzent
- Skip-Button: Gold-Farbe statt muted weiß

## 8. Premium-Banner

- Button: Gold-Gradient 3D-Stil
- Text: Etwas prominenter
- Border-top: Gold-Gradient statt flat

## Architektur

- **Nur CSS-Änderungen** in `index.html` (inline `<style>`)
- **HTML-Änderungen** für Level-Pfad: `.ls-tiers` Generierung in `main.js` anpassen (Grid → Tier-Sections mit Nodes)
- **Sekundär-Button-Layout**: HTML in `index.html` minimal anpassen (2x2 Grid)
- Bestehende CSS-Variablen erweitern, nicht ersetzen
- Alle Animationen mit `prefers-reduced-motion` respektieren

## Nicht im Scope

- Splash-Screen (schon Premium)
- Cat-Unlock-Celebration (schon Premium)
- Spielfeld-Rendering (Canvas, separates Thema)
- Neue Features oder Funktionalität
- Sound-Änderungen
