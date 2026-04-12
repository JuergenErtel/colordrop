# Shop-Screen Design

**Datum:** 2026-04-12
**Status:** Approved

---

## Zugang

Neuer Button "Shop" im Hauptmenu (in `ls-actions-secondary`, neben Statistiken/Einstellungen/Katzen-Album). Offnet einen Fullscreen Sheet-Panel (`screen-overlay sheet-panel`) wie das Katzen-Album.

## Layout

- **Header:** "SHOP" Titel + Fischgraten-Anzeige (aktuelles Guthaben, rechts oben)
- **Tab-Leiste:** Zwei Tabs — "Ball-Skins" | "Hintergrunde". Aktiver Tab gold unterstrichen, inaktiver gedimmt.
- **Grid:** 2 Karten pro Reihe, scrollbar
- **Footer:** "← Zuruck" Button (gleicher Stil wie Album/Stats Back-Buttons)

## Item-Karte

Jede Karte zeigt:

1. **Vorschau** — Canvas-gezeichnet:
   - Skins: Ein Ball in der Hauptfarbe (coral) mit dem jeweiligen Skin-Effekt (Glitzer-Partikel, Kristall-Facetten, Gold-Faden)
   - Hintergrunde: Kleines Thumbnail der Szene (vereinfachte Version der drawGardenBg etc.)
2. **Name** — z.B. "Glitzer", "Garten"
3. **Status-Zeile** — je nach Zustand:

| Zustand | Darstellung |
|---------|------------|
| Besitzt + Aktiv | Gruner Haken "Aktiv" (kein Button) |
| Besitzt, nicht aktiv | Button "Auswahlen" (gold) |
| Kaufbar (Fischgraten) | Button mit Preis z.B. "50" mit Fischgraten-Icon |
| Gesperrt (nur Meilenstein) | Schloss-Icon + "Level 50" (ausgegraut) |

Gesperrte Karten sind leicht ausgegraut (opacity 0.5), aber sichtbar.

## Items und Preise

### Ball-Skins

| Skin | Fischgraten-Preis | Alternativ-Unlock |
|------|-------------------|-------------------|
| Wollknauel | — | Standard (gratis) |
| Glitzer | 50 | Meilenstein Level 150 |
| Kristall | 80 | Nur Shop |
| Goldfaden | 100 | Meilenstein Level 300 |

### Hintergrunde

| Hintergrund | Fischgraten-Preis | Alternativ-Unlock |
|-------------|-------------------|-------------------|
| Katzencafe | — | Standard (gratis) |
| Garten | 100 | Meilenstein Level 50 |
| Dachterrasse | 150 | Meilenstein Level 100 |
| Winterstube | 200 | Meilenstein Level 200 |

Items die per Meilenstein ODER Kauf freigeschaltet werden konnen, zeigen den Kauf-Button. Wenn der Spieler den Meilenstein zuerst erreicht, ist das Item schon freigeschaltet und kostet nichts.

## Kaufvorgang

1. Spieler tippt auf Preis-Button
2. Prufung: Genug Fischgraten?
   - Ja: Fischgraten abziehen, Item freischalten, sofort als aktiv setzen
   - Nein: "invalid" Sound, Button wackelt kurz (shake-Animation)
3. Bei Kauf: "cat_unlock" Sound, Guthaben-Anzeige aktualisiert, Button wechselt zu "Aktiv"

## Auswahl

- Tap auf "Auswahlen" bei einem bereits freigeschalteten Item setzt es als aktiv
- Das vorher aktive Item wechselt zuruck zu "Auswahlen"
- "click" Sound bei Auswahl

## Technische Umsetzung

### Neue Dateien
- Keine neuen JS-Module notig — Logik passt in main.js (Shop-UI Rendering)

### Geanderte Dateien
- `index.html` — Shop-Screen HTML (sheet-panel), Shop-Button im Menu
- `css/panels.css` — Shop-Grid, Tab-Leiste, Item-Karten Styling
- `js/main.js` — Shop open/close, Tab-Wechsel, Kauf-Logik, Auswahl-Logik, Vorschau-Canvas
- `js/skins.js` — bereits vorhanden (getActiveSkin, setActiveSkin, ownsSkin, unlockSkin)
- `js/storage.js` — bereits vorhanden (loadSkins, saveSkins, loadBackgrounds, saveBackgrounds)

### Entfernen
- Skin-Selector und Background-Selector aus den Einstellungen entfernen (Shop ersetzt sie)

## UI-Stil

Folgt dem bestehenden Stil:
- Dunkler Hintergrund (wie Katzen-Album)
- Gold-Akzente fur Titel und aktive Elemente
- Abgerundete Karten mit leichtem Schatten
- Font: Fredoka
