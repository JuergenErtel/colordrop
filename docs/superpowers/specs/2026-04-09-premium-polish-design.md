# Premium Polish — Full Premium Pass

**Ziel:** Kittysort soll sich durchgängig wie eine High-End Casual-Game-App anfühlen (Referenz: Royal Match / Candy Crush). Vier Phasen, jeweils eigenständig testbar.

**Performance-Strategie:** Smart balancieren — volle Animationen als Default, internes Performance-Budget pro Effekt, `prefers-reduced-motion` als graceful Fallback. 60fps oder Animation weglassen.

---

## Phase 1: Ball-Animation — Premium Movement

Das Herzstück: Jede Ball-Bewegung wird ein 4-Stufen-Event statt eines einfachen Bézier-Arcs.

### Aktueller Zustand

- `DUR_ARC = 380ms` mit `easeInOut` — kein physisches Gewicht
- Kein Squash/Stretch
- Landing: nur `easeOutBounce` auf Y-Offset (14px Amplitude)
- Kein Tube-Feedback beim Aufprall
- Trail-Partikel vorhanden aber dünn (40% Chance pro Frame)

### Neues Ball-Movement

#### 1.1 Lift (0–220ms)

- Bestehender Lift bleibt (`easeOutBack`, Ball steigt aus Tube)
- **Neu:** Vertikaler Stretch beim Aufstieg: `scaleY: 1.15, scaleX: 0.88`
- Stretch baut sich über die Lift-Dauer auf und normalisiert am Ende
- Bestehender `floatY` Sinus-Pulse bleibt als Idle-Float

#### 1.2 Arc (220–640ms)

- **Dauer:** `DUR_ARC` von 380ms auf 420ms erhöhen
- **Easing:** `easeInOut` ersetzen durch `easeOutQuart` — schneller Start, sanftes Abbremsen ("geworfen mit Schwerkraft")
- **Neue Easing-Funktion:** `easeOutQuart(t) = 1 - Math.pow(1 - t, 4)`
- **Stretch entlang Flugrichtung:** Ball verformt sich leicht in Bewegungsrichtung
  - Berechne Tangente der Bézier-Kurve an Position t
  - Rotiere Ball-Canvas um `atan2(dy, dx)`
  - Stretch: `scaleX: 1.12, scaleY: 0.9` entlang Tangente
  - Normalisiert in den letzten 15% des Arcs
- **Trail-Partikel verdichten:** Chance von 40% auf 70% pro Frame erhöhen, Partikelgröße 4-7px (statt 3-5px), Lebensdauer 400ms (statt 300ms)

#### 1.3 Impact (640–720ms)

- **Squash:** Ball bei Landing `scaleY: 0.7, scaleX: 1.3` → federt zurück (80ms, `easeOutElastic`)
- **Neue Easing-Funktion:** `easeOutElastic` mit 2 Schwingungen, gedämpft
- **Impact-Ring:** Kreis expandiert von Ball-Radius auf 2× Ball-Radius, opacity 0.4→0, Farbe = Ball-Glow-Farbe, Dauer 300ms
- **Tube-Wobble:** Ziel-Tube rotiert ±1.5° und federt zurück (400ms, `easeOutElastic`). Alle Bälle im Tube wackeln mit.
  - Implementierung: `ANIM.tubeWobble` Map analog zu `bounceMap`
  - Wobble wird im Tube-Rendering als `ctx.rotate()` angewendet
- **Sound:** Bestehender `pop` Sound bleibt

#### 1.4 Settle (720–1000ms)

- **Micro-Bounce:** 2 kleine Bounces auf dem gelandeten Ball (amplitude 6px, dann 2px)
- Bestehender `easeOutBounce` in `bounceMap` wird beibehalten, Amplitude von 14 auf 10 reduzieren (natürlicher)
- **Neighbor Jiggle:** Bälle unter dem gelandeten Ball werden kurz zusammengedrückt (`scaleY: 0.95`) und federn zurück (200ms, versetzt 30ms pro Ball-Position)
  - Implementierung: `ANIM.jiggleMap` — speichert betroffene Ball-Keys mit Timing
- Nach Settle: `ANIM.busy = false`

### Neue ANIM-Felder

```js
ANIM.tubeWobble  = new Map();  // tubeIdx → { startTime, duration, amplitude }
ANIM.jiggleMap   = new Map();  // "tube-ball" → { startTime, duration }
ANIM.impactRing  = null;       // { x, y, startTime, duration, color }
```

### Reduced-Motion Fallback

- Squash/Stretch: deaktiviert (Ball bleibt rund)
- Trail-Partikel: deaktiviert
- Impact-Ring: einfacher Opacity-Fade
- Tube-Wobble: deaktiviert
- Neighbor Jiggle: deaktiviert
- Arc selbst: bleibt (kürzere Dauer: 280ms)

---

## Phase 2: Screen-Transitions

Einheitliches Transition-System statt hartem `opacity 0→1` auf allen Screens.

### Aktueller Zustand

- Alle Overlays: `.show` Klasse → `opacity: 0→1, transition: .3s ease`
- Kein räumliches Gefühl, kein Zusammenhang zwischen Screens
- `classList.add('show')` / `classList.remove('show')` direkt in main.js

### Technischer Ansatz

CSS-basiert für DOM-Overlays (GPU-beschleunigt via `transform` + `opacity`), Canvas-basiert für Tube-Intros.

Neue CSS-Klassen: `.entering` / `.leaving` mit spezifischen Animationen pro Screen-Typ. JS steuert Timing und Klassen-Toggle über eine zentrale `transitionTo(screen, options)` Funktion.

### 2.1 Level-Select → Gameplay (300ms)

**Out:** Level-Select `translateY(0) → translateY(-30px)` + `opacity 1→0` (200ms, `ease-in`)
**In:** Canvas-Wrapper `scale(0.95) opacity(0) → scale(1) opacity(1)` (300ms, `ease-out`)
**Canvas:** Tubes droppen staggered von oben:
- Jeder Tube startet mit `translateY: -TUBE_H` und `opacity: 0`
- Animiert zu Endposition mit `easeOutBounce` (400ms)
- Versatz: 50ms pro Tube (links nach rechts)
- Implementierung: `ANIM.tubeIntro[]` Array mit startTime pro Tube

### 2.2 Gameplay → Win-Overlay (400ms)

**Canvas:** Dimmt (`globalAlpha: 0.5`) über 300ms — kein CSS blur (Performance)
**Win-Card:** `scale(0) → scale(1)` mit `easeOutBack` (overshoot 1.15), 400ms
**Stars:** Sequenziell aufleuchten, 100ms versetzt pro Stern, `scale(0) → scale(1.2) → scale(1)` Spring-Effekt
**Buttons:** Fade-in 150ms nach Card-Animation

### 2.3 Win → Nächstes Level (500ms)

**Win-Card Out:** `translateY(0) scale(1) → translateY(-40px) scale(0.9) opacity(0)` (250ms, `ease-in`)
**Canvas:** Globalpha zurück auf 1.0 (200ms)
**Tubes:** Staggered drop-in (wie 2.1)

### 2.4 Menu → Settings/Stats/Album/Streak (350ms)

**Sheet-Style:** Panel `translateY(100%) → translateY(0)` (350ms, `ease-out`)
**Backdrop:** Hintergrund dimmt (`rgba(0,0,0,0.5)`, 200ms)
**Schließen:** Reverse — Panel `translateY(0) → translateY(100%)` (250ms, `ease-in`)
**Touch:** Swipe-down zum Schließen (optional, nice-to-have)

### 2.5 Blitz/Daily/Endless Overlays (400ms)

**In:** `scale(0.85) opacity(0) → scale(1) opacity(1)` (400ms, `ease-out`) + bestehender Glow-Pulse
**Out:** `scale(1) → scale(1.05) opacity(0)` (200ms) — "explodiert" leicht beim Start

### Transition-Koordination

```js
async function transitionTo(target, options = {}) {
  const { outAnim = 'fade', inAnim = 'fade', duration = 300 } = options;
  // 1. Aktiven Screen mit .leaving Klasse versehen
  // 2. Warten auf transitionend
  // 3. Display none auf altem Screen
  // 4. Neuen Screen mit .entering Klasse anzeigen
  // 5. .entering entfernen nach Animation
}
```

### Reduced-Motion Fallback

- Alle Transitions: einfaches Crossfade (opacity, 200ms)
- Kein scale, translateY, oder easeOutBack
- Tube drop-in: instant appear (kein stagger)

---

## Phase 3: Visueller Zusammenhalt

Canvas-Gameplay auf das "Royal Bold" Level der Menüs bringen.

### 3.1 Canvas-Hintergrund

**Aktuell:** Animierter Gradient (`drawBackground` in `background.js`), Theme-basiert
**Änderung:**
- Farbtemperatur wärmer: Basis-Töne von kalt-blau zu warm-braun (#2a1810 → #1a0e08)
- Tier-Farbe als subtiler radialer Schimmer am unteren Rand (opacity 0.08-0.12)
- Ambient Gold-Glow: `radialGradient` zentriert unten, `rgba(212,135,63, 0.10)`
- Theme-Crossfade bleibt (bestehend `G.themeFade`)

### 3.2 Tube-Rendering

**Datei:** `containers.js` → `drawContainer()`
**Änderungen:**
- **Gold-Rim:** Oben am Tube-Opening: 2px Linie mit Gold-Gradient (`#FFD700 → transparent` links/rechts), opacity 0.25
- **Glasmorphism-Tint:** Bestehenden Tube-Fill wärmer tonen — `rgba(160,120,80, 0.06)` statt neutralem Weiß
- **Gelöste Tubes:** Sanftes Gold-Glow drumherum (pulsierend, 0.15→0.25 opacity, 3s Zyklus)
- **Selected Tube:** Bestehende Highlight-Farbe bleibt, plus subtiler Gold-Schimmer am Rim

### 3.3 HUD im Royal-Stil

**Aktuell:** `.hud-btn` mit einfachem Background + Border
**Änderungen:**
- Mini-3D-Effekt: `box-shadow: 0 2px 0 darkerShade` (halbe Tiefe der Menü-Buttons)
- Gold-Akzent: Border-Color `rgba(255,215,0, 0.2)`, Background-Tint `rgba(255,215,0, 0.08)`
- Hint-Button (Hauptaktion): Volles 3D-Gold wie Menü-Buttons (klein)
- Font: sicherstellen dass Fredoka überall im HUD verwendet wird
- Bones-Anzeige: Gold-Gradient auf der Zahl

### 3.4 Einheitliche Design-Tokens

Konsistente Werte über DOM und Canvas:

| Token | Wert | Verwendung |
|-------|------|------------|
| Shadow-Depth | 4px offset | Buttons, Cards |
| Shadow-Depth-Small | 2px offset | HUD-Buttons, Tags |
| Border-Radius-Card | 10px | Alle Karten/Panels |
| Border-Radius-Button | 18px | Alle Buttons |
| Gold-Gradient | `#FFD700 → #d4873f` | Titel, Akzente |
| Gold-Border | `rgba(255,215,0, 0.2)` | Ränder überall |
| Warm-Cream-BG | `#fdf6ec` | DOM Background |
| Canvas-BG-Warm | `#2a1810 → #1a0e08` | Canvas Gradient |
| Font-UI | Fredoka | Alles außer Body-Text |

### Reduced-Motion Fallback

- Ambient Gold-Glow: statisch (kein Puls)
- Gelöste-Tube-Glow: statisch bei 0.2 opacity
- Keine Änderungen an Farben/Tokens nötig

---

## Phase 4: Micro-Interactions & Juice

Die kleinen Details, die aus "gut" ein "wow" machen.

### 4.1 Tap & Selection Feedback

**Tube antippen:**
- Ripple-Effekt am Tap-Punkt: 2 konzentrische Kreise expandieren (von 10px auf 35px), opacity fade-out, Gold-Farbe, 400ms
- Tube-Flash: Tube-Fill kurz heller (opacity +0.1, 50ms, dann zurück)
- Implementierung: `ANIM.ripple = { x, y, startTime }`

**Ball selected (schon floating):**
- Pulsierender Glow-Ring um den floating Ball (20→24px Radius, 1.5s Zyklus)
- Schatten-Ellipse auf dem Tube darunter (Tiefenwirkung)
- Bestehender `pulse` Scaling bleibt

**Ungültiger Zug:**
- Tube schüttelt sich horizontal (±4px, 3 Zyklen, 300ms)
- Rötlicher Flash auf Tube-Fill (50ms)
- Implementierung: `ANIM.tubeShake` Map

### 4.2 Win Celebration Upgrade

Sequenzielle Celebration statt alles gleichzeitig:

1. **0ms:** Letzter Ball landet mit extra-starkem Impact (Amplitude ×1.5)
2. **200ms:** Screen-Shake (Canvas `translate` ±4px, 150ms, 3 Zyklen)
3. **300ms:** Tubes "explodieren" sequenziell (bestehend `triggerTubeExplosion`, 80ms Versatz)
4. **500ms:** Gold-Flash: Canvas-Overlay `rgba(255,215,0, 0.15)` für 100ms
5. **600ms:** Confetti burst (bestehend) + Win-Card spring-in (Phase 2)

Implementierung: `scheduleWinFireworks` erweitern mit `setTimeout` Kaskade.

### 4.3 Mascot-Katze reagiert

**Datei:** `cat-renderer.js` → `drawMascotCat()`

- **Ball fliegt:** Katze schaut dem Ball nach (Kopf-Rotation Richtung Arc-Position)
  - Lese `ANIM.arc` Position, berechne Winkel von Katzen-Position
  - Subtile Kopfrotation (max ±15°)
- **Ungültiger Zug:** Katze schüttelt Kopf (2x links-rechts, 400ms)
- **Lange idle (>5s):** Zufällige Idle-Animation (Gähnen: Mund öffnet, Putzen: Pfote ans Gesicht)
  - 1 Animation alle 8-12s (randomisiert)
- **Win:** Katze springt freudig (translateY -10px, 2 Bounces)

### 4.4 Ambient-Partikel

- 5-8 langsame "Glühwürmchen" im Canvas-Hintergrund
- Farbe: Tier-Akzentfarbe mit 0.15 opacity
- Bewegung: Sinus-Pfade (unterschiedliche Frequenzen/Amplituden)
- Größe: 2-4px, mit weichem Glow (radialGradient)
- Performance: Recycled aus bestehendem Partikel-Pool (`MAX_PARTS`)
- Spawnen bei Level-Start, despawnen bei Win

### 4.5 Button-Feedback

- **Tap:** `scale(0.95)` für 80ms → spring-back zu `scale(1)` (CSS transition)
- **Hover:** Bestehend (`translateY(-1px)` + shadow grow) — keine Änderung
- **Disabled tap:** Subtiler Shake (±2px, 200ms) statt nur "nichts passiert"
- **Sound:** Leises "click" bei jedem Button-Tap (neuer Sound in `audio.js`, kurzer 1200Hz Blip, 50ms)

### 4.6 Zahlen-Animationen

- **Move-Counter:** Bei jedem Zug neue Zahl "slide up" rein (alte Zahl fährt nach oben raus)
  - CSS: `translateY(0) → translateY(-100%)` alte Zahl, `translateY(100%) → translateY(0)` neue Zahl, 200ms
- **Bones-Gewinn:** Count-up von altem zu neuem Wert (500ms, `easeOutQuart`)
- **Stars im Win-Screen:** Sequenziell aufleuchten (100ms Versatz), `scale(0) → scale(1.2) → scale(1)`
- **Timer-Puls:** Puls-Intensität proportional zu verbleibender Zeit (letzten 20%: doppelte Frequenz)

### Performance-Budget (Phase 4)

| Effekt | Budget | Reduced-Motion |
|--------|--------|----------------|
| Ambient-Partikel | max 8 gleichzeitig | Aus |
| Ripple-Effekt | 1 pro Tap | Einfacher Opacity-Flash |
| Screen-Shake | max 4px, 150ms | Aus |
| Katzen-Reaktionen | 1 Animation gleichzeitig | Statisch |
| Tube-Shake | 1 Tube gleichzeitig | Rötlicher Flash only |
| Button click Sound | 1 pro Event | Unverändert |

---

## Phasen-Reihenfolge & Abhängigkeiten

```
Phase 1 (Ball-Animation)     ← keine Abhängigkeiten, sofort startbar
Phase 2 (Screen-Transitions) ← keine Abhängigkeiten, parallel zu Phase 1 möglich
Phase 3 (Visueller Zusammenhalt) ← nach Phase 1 (Tube-Wobble muss existieren für Gold-Rim Interaktion)
Phase 4 (Micro-Interactions) ← nach Phase 1+2 (baut auf ANIM-Erweiterungen auf)
```

Jede Phase ist eigenständig deploybar und testbar. Phase 3 und 4 nutzen die ANIM-Infrastruktur aus Phase 1.

## Betroffene Dateien

| Datei | Phase(n) | Änderungen |
|-------|----------|------------|
| `js/animations.js` | 1, 4 | Neue Easings, neue ANIM-Felder |
| `js/render.js` | 1, 3, 4 | Ball-Verformung, Impact-Ring, Ripple, Tube-Wobble, Ambient |
| `js/main.js` | 1, 2, 4 | Transition-System, Win-Sequenz, Shake, Zahlen-Animation |
| `js/constants.js` | 1 | Timing-Konstanten (DUR_ARC etc.) |
| `js/containers.js` | 3 | Gold-Rim, wärmerer Tint, Solved-Glow |
| `js/background.js` | 3 | Wärmere Farben, Ambient-Glow |
| `js/particles.js` | 1, 4 | Trail-Verdichtung, Ambient-Glühwürmchen |
| `js/cat-renderer.js` | 4 | Reaktive Katzen-Animationen |
| `js/audio.js` | 4 | Button-Click Sound |
| `index.html` | 2, 3, 4 | CSS Transitions, HUD-Styling, Zahlen-Anim |
