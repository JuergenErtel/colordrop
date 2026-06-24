# HUD-Symbol-Legende im Intro — Design

**Datum:** 2026-06-24
**Status:** freigegeben (Design), wartet auf Spec-Review

## Ziel

Im Erst-Tutorial (Intro) eine kleine Erklär-Karte zeigen, die die Symbole der
oberen HUD-Leiste erklärt — denn neue Spieler verstehen 🐟/🐾/↩/💡 sonst nicht.

## Nicht-Ziele (YAGNI)

- Kein dauerhaft erreichbarer „Hilfe"-Button (nur im Erst-Tutorial).
- Keine interaktiven Coachmarks/Hervorhebungen der echten HUD-Buttons.
- Keine Erklärung weiterer Symbole (☰ Menü, ↺ Reset, Level-Label) — nur die
  vier vom Nutzer genannten.

## Zu erklärende Symbole (obere HUD-Reihe, index.html ~Z. 73–80)

| Icon | Name | Erklärung (Karte) |
|---|---|---|
| 🐟 (`<i class="fishbone">`) | Fischgräten | Deine Münzen: für Tipps, Extra-Züge und den Shop. |
| 🐾 (`.paw`) | Pfoten = Leben | Gehen sie aus, lädt nach Zeit eins nach (oder per Werbung/Fischgräten auffüllen). |
| ↩ (`#undoBtn`) | Zurück | Macht den letzten Zug rückgängig. |
| 💡 (`#hintBtn`) | Tipp | Zeigt einen guten nächsten Zug (kostet ein paar Fischgräten). |

## Komponenten

### `index.html` — neues Overlay `#hudIntroOverlay`
- Im Stil der bestehenden Intro-Karten (`class="blitz-overlay"` außen,
  `class="blitz-inner"` innen — zentriert, gestylt).
- Inhalt: Titel „Deine Leiste 🐾", vier `.hud-legend-row`-Zeilen (Icon links,
  Name + Erklärung rechts), Button `#hudIntroBtn` „Los geht's →".
- Das 🐟-Icon nutzt `<i class="fishbone"></i>` (gleiche Darstellung wie im HUD),
  🐾 als `<span class="paw">🐾</span>`, ↩ und 💡 als Text-Glyphen.

### `css` — `.hud-legend` Regeln (in `css/overlays.css`, bei den Intro-Stilen)
- `.hud-legend` Container (Spalte, Abstand).
- `.hud-legend-row` = Flex-Zeile: feste Icon-Spalte (zentriert) + Text-Spalte
  (linksbündig), damit die Erklärungen sauber untereinander ausgerichtet sind.
- `.hud-legend-icon` (Icon-Größe), `.hud-legend-name` (fett), `.hud-legend-desc`
  (kleiner, gedämpft).

### `js/main.js` — Anzeige-Logik
- In `startTutorial()` (Z. ~1852): nachdem das Tutorial-Level steht, **zuerst**
  `#hudIntroOverlay` einblenden; die normale erste Sprechblase erst danach.
- Button `#hudIntroBtn`: blendet das Overlay aus und startet den bestehenden
  Tutorial-Ablauf (erste Sprechblase via vorhandener Render-Funktion).
- Erscheint nur im Erst-Tutorial (an `startTutorial` gekoppelt, das ohnehin nur
  für neue Spieler läuft).

## Datenfluss

```
Neuer Spieler → startTutorial()
  → Tutorial-Level generieren (wie bisher)
  → #hudIntroOverlay zeigen (Legende)
  → Tap „Los geht's →" → Overlay aus → erste Tutorial-Sprechblase
  → normaler Tutorial-Ablauf (sortieren …)
```

## Fehlerbehandlung / Edge Cases

- Overlay-Element fehlt (alte gecachte HTML): defensiv prüfen (`if (el)`), sonst
  direkt normalen Tutorial-Ablauf starten — kein Absturz.
- Tutorial übersprungen / wiederholt: Legende ist an `startTutorial` gekoppelt;
  kein separater „gesehen"-Status nötig (Tutorial selbst ist Erst-Onboarding).

## Verifikation

- **Browser-Screenshot** (390px): Legende zentriert, vier Zeilen mit echten
  Icons sauber ausgerichtet, Button mittig.
- **Funktional:** „Los geht's →" blendet die Legende aus und die erste
  Tutorial-Sprechblase erscheint; Sortieren funktioniert normal weiter.
- **Syntax:** `node --check js/main.js`.
