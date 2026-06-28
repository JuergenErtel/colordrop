# Begleiter-Katzen — Helfer-Fähigkeiten

**Datum:** 2026-06-28
**Status:** freigegeben (Design)
**Kontext:** Antwort auf App-Store-Ablehnung Guideline 4.3(a) (Spam / „repackaged template").
Submission-ID 242b4807-…, Review-Datum 28.06.2026, Version 1.0 (9).

## Problem

Kittysort wurde unter 4.3(a) abgelehnt: Die Kernmechanik (Ball-Sort / Water-Sort)
ist das meistgeklonte Genre im App Store. Der Reviewer ordnet die App in Sekunden
als „noch ein Wassersortierer" ein. Da dies die **erste App** des Accounts ist,
liegt **kein** Cross-Match gegen eigene Reskins vor — die Ursache ist rein
genre-/metadatengetrieben.

Gegenmaßnahme (zweistufig, hier Stufe 2 = Gameplay):
ein **echtes, sichtbares Gameplay-Unterscheidungsmerkmal**, das additiv auf die
bestehende, getestete Mechanik aufsetzt und das vorhandene einzigartige
34-Katzen-Sammelsystem ins Kern-Gameplay zieht.

## Kernidee

Jede gesammelte Katze ist nicht mehr nur ein Album-Bild, sondern ein
**Begleiter mit einer Fähigkeit**, den der Spieler in ein Level mitnimmt und
gegen Fischgräten (bestehende Soft-Currency) einsetzt.

Wirkung gegen 4.3(a):
- Reviewer sieht in <30 s Katzen aktiv im Spielfeld + animierte Fähigkeiten →
  klar kein Standard-Wassersortierer.
- Liefert die ASO-/Reviewer-Story: „Sammle 34 handgezeichnete Katzen — jede mit
  eigener Fähigkeit, die dir beim Sortieren hilft."

## Die 3 Fähigkeiten

Alle Fähigkeiten sind **lösbarkeits-sicher**: sie vereinfachen ein Level nur und
löschen niemals zum Lösen benötigtes Material. Damit bleibt jedes Level nach
Einsatz garantiert lösbar (verifizierbar gegen `isSolvable` in `engine.js`).

1. **🧺 Nickerchen-Korb** — fügt für dieses Level eine zusätzliche leere Röhre
   hinzu. Mehr Platz kann ein Level nie unlösbar machen.
   Technik: Tube-Array um `[]` erweitern; Render-Layout muss eine variable
   Röhrenzahl verkraften (tut es bereits, da `tubes`-Länge pro Level variiert).

2. **🐾 Pfoten-Trick** — genau **ein** Zug, der die Farbregel ignoriert:
   oberstes Knäuel auf eine beliebige nicht-volle Röhre, unabhängig von der
   oben liegenden Farbe. Umgeht `canMove` für diesen einen Zug; danach gelten
   wieder die normalen Regeln.

3. **🧲 Magnet-Schnurren** — Spieler wählt eine Farbe; alle **obenliegenden**
   Knäuel dieser Farbe wandern animiert in eine Zielröhre zusammen (nur soweit
   die Kapazität 4 reicht; Rest bleibt liegen). Visuell auffälligster Effekt →
   bevorzugt für Screenshots/Reviewer.

Jede der 34 Katzen erhält genau eine dieser Klassen (neues Feld `ability` in
`cats.js`), damit jede gesammelte Katze nützlich wirkt. Verteilung der Klassen
über die Katzen ist Balancing-Detail (grob gleichmäßig).

## Einsatz & Ökonomie

Dockt vollständig an das bestehende System (`economy.js`) an — kein neues
Währungs-/Ad-Subsystem.

- **Vor dem Level (Begleiter-Auswahl):** Liste freigeschalteter Katzen + ihre
  Fähigkeit. Auswahl persistiert als `selectedCompanion` in `storage.js`.
  Default = zuletzt gewählte / erste freigeschaltete Katze.
- **Im Level (Einsatz):** kleiner Begleiter-Button (Katzen-Portrait via
  bestehendem `cat-renderer.js` + Bones-Kosten). Tippen prüft `canAfford` und
  ruft `spend` (`economy.js`).
- **Kosten** (neue Konstante `COMPANION_COSTS` in `constants.js`):
  Pfoten-Trick 30, Nickerchen-Korb 40, Magnet-Schnurren 50 Fischgräten.
  (Liegen im Rahmen bestehender Sinks: Hint 10–100, +5 Züge 30.)
- **Club/Lifetime-Vorteil** (`isPremium()` aus `economy.js`):
  1× gratis pro Level, danach normaler Bones-Preis. Macht den IAP attraktiver.
- **Zug-Limit:** Fähigkeitseinsatz zählt **nicht** gegen `MOVE_LIMIT`
  (der Spieler bezahlt dafür). Der durch den Pfoten-Trick ausgelöste Zug zählt
  ebenfalls nicht als regulärer Zug.

## Was sich NICHT ändert (Risiko-Eindämmung)

Unangetastet bleiben: Kern-`canMove`, Level-Generator (`generateTubes`),
Solver/Hint (`solveHint`), die 300 Level, Blitz/Endless/Daily/Dog/Mouse-Modi,
IAP/Billing, AdMob. Die Begleiter-Schicht ist optional und additiv.

Offene Frage zur Klärung in der Implementierungsplanung: ob Fähigkeiten in den
Spezial-Modi (Blitz/Daily/Dog/Mouse) verfügbar sind oder vorerst nur im
Standard-Levelmodus. Default-Annahme: **nur Standard-Levelmodus** im ersten
Wurf (kleinste Angriffsfläche), Erweiterung später.

## Architektur / berührte Dateien

- **neu** `js/companion.js` — reine Zustandsfunktionen
  `applyNapBasket(tubes) → tubes`, `applyPawTrick(tubes, from, to) → tubes`,
  `applyMagnet(tubes, color, targetIdx) → tubes`. Keine UI, keine I/O →
  unit-testbar.
- `js/cats.js` — `ability`-Feld pro Katze.
- `js/constants.js` — `COMPANION_ABILITIES` (id, label, emoji, Beschreibung) +
  `COMPANION_COSTS`.
- `js/main.js` — Begleiter-Auswahl-Flow, In-Level-Button, Einsatz-Handler,
  Verdrahtung mit `economy.js` und `companion.js`, Animations-Trigger.
- `index.html` + CSS — Auswahl-UI + In-Level-Button + Fähigkeits-Animationen;
  Portraits via `cat-renderer.js`.
- `js/storage.js` — `selectedCompanion` laden/speichern.

## Datenfluss

1. Menü/Levelstart → `selectedCompanion` aus `storage.js` laden → Begleiter-Button
   rendert das Portrait + Fähigkeit + Kosten.
2. Tippen auf Button → Kosten via `isPremium()`/Gratis-Kontingent bestimmen →
   `canAfford` → Fähigkeitsmodus aktiv (z. B. Pfoten-Trick: nächste zwei Taps
   wählen Quelle/Ziel; Magnet: Farbauswahl).
3. `companion.js`-Funktion transformiert den Tube-State → `spend` →
   Render-Update + Animation → Sieg-Check über bestehendes `checkWinState`.

## Teststrategie

- **Unit (`js/companion.js`):** für jede Fähigkeit korrekte Transformation des
  Tube-Arrays; **Invariante:** Lösbarkeit bleibt nach Einsatz erhalten — gegen
  `isSolvable` einer Reihe generierter Level prüfen (Nickerchen-Korb &
  Pfoten-Trick & Magnet dürfen ein lösbares Level nie unlösbar machen).
- **Ökonomie:** Einsatz zieht korrekt Bones ab bzw. nutzt Gratis-Kontingent bei
  `isPremium()`; kein Einsatz bei zu wenig Bones.
- **Manuell:** Sichtprüfung der Animationen + Begleiter-Auswahl im Simulator.

## Differenzierungs-/ASO-Nutzen (Stufe 1, separat in Task #3)

- Name/Untertitel/Keywords weg von „water sort / wassersortieren / color sort"
  hin zum Katzen-Companion-Puzzle.
- Reviewer-Reply belegt: eigener Code, prozedurale Katzen-Grafik, Sammel-Meta-Game,
  jetzt zusätzlich Begleiter-Fähigkeiten → kein Template.

## Nicht im Scope (YAGNI)

- Fähigkeiten in Spezial-Modi (späterer Schritt).
- Mehr als 3 Fähigkeiten.
- Fähigkeits-Upgrades / Level-Ups pro Katze.
- Neue Währung oder neues Ad-Format.
