# Background Cozy Overhaul — Design Spec

**Datum:** 2026-05-06
**Branch:** `background-cozy-overhaul` (anzulegen)
**Scope:** Default-Café + Kirschblüte aufpolieren. Garden, Rooftop, Winter unangetastet (nur ins neue Modul-Layout verschoben).

## Ziel

`js/background.js` von prozeduralen Placeholder-Layern zu einer „Cozy Wohnzimmer"-Bühne ausbauen, die premium-feel transportiert ohne vom Puzzle abzulenken. Gleiche Philosophie für die Kirschblüte-Saison: lived-in, charming, japanisches Garten-Setting mit Cat-Café-Identität.

## Erfolgskriterien

1. Default-Café enthält 8 zusätzliche Cozy-Elemente (siehe Layer-Liste).
2. Kirschblüte-Szene enthält 8 zusätzliche / verbesserte Elemente.
3. Bestehende Theme-Color-Drift (`themeCenter` / `lerpHSL`) bleibt funktional bei Tier-Wechsel.
4. Frame-Budget Background < 4 ms auf Desktop-Chrome (60 fps Ziel mit Headroom).
5. Mobile Viewport (375 × 667): keine Kollision von Décor-Elementen mit Puzzle-UI (Röhren-Bounding-Box `TUBE_TOP`–`TUBE_BOT`).
6. Garden / Rooftop / Winter rendern visuell **unverändert** vor/nach Refactor.

## Architektur

### Modul-Layout

```
js/background.js                  ~80 LOC   Dispatch (bgId → Modul) + Cache-Management
js/backgrounds/_shared.js         ~60 LOC   themeCenter, lerpHSL, drawCat() Helper
js/backgrounds/cafe.js            ~280 LOC  Default-Café (Cozy Wohnzimmer)
js/backgrounds/kirschbluete.js    ~220 LOC  Sakura-Garten
js/backgrounds/garden.js          ~50 LOC   bestehend, nur verschoben
js/backgrounds/rooftop.js         ~65 LOC   bestehend, nur verschoben
js/backgrounds/winter.js          ~60 LOC   bestehend, nur verschoben
```

`js/background.js` exportiert weiterhin `drawBackground(ctx, ts, theme, prevTheme, fade, bgId)` als einzige Public-API. Konsumenten (`main.js`, etc.) ändern nichts.

### Static-Layer-Cache

Jedes Szenen-Modul exportiert zwei Funktionen mit fester Signatur:

```js
export function drawStatic(ctx, theme, w, h)        // statische Layer
export function drawAnimated(ctx, ts, theme, fade)  // animierte Layer
```

Im Dispatcher (`js/background.js`):
- Offscreen-Canvas pro Szene (lazy erstellt, gleiche Auflösung wie Haupt-Canvas).
- Cache-Key: `${bgId}|${themeId}|${w}x${h}`. Bei Mismatch → `drawStatic` rebuildet Offscreen.
- Pro Frame: blit Offscreen → Haupt-Ctx, dann `drawAnimated` darüber.
- Public Helper `invalidateBackgroundCache()` für expliziten Reset (Theme-Change-Event).

Garden / Rooftop / Winter: **Behalten ihre aktuelle Render-Logik**, exportieren nur eine `draw(ctx, ts, theme)` direkt — keine Static/Anim-Trennung nötig (geringer Aufwand, geringer Win). Cache nur für Café + Kirschblüte aktiv.

### Theme-Integration-Regeln

- **Default-Café:** Wand / Floor / Baseboard / Tisch respektieren `themeCenter` + `lerpHSL` weiter (bestehende Logik unverändert).
- **Décor-Elemente** (Bilderrahmen, Pflanze, Fenster, Tasse, Katze) sind theme-neutral. Holzrahmen immer braun, Pflanze grün, Glas blau-grau, Katze cremefarben.
- **Holz-Elemente** (Boden-Dielen, Tisch, Wandleiste) nehmen ±5° Hue-Drift mit, aber Sättigung + Helligkeit fix → verhindert sichtbare Disharmonie bei extremen Tier-Themes.
- **Kirschblüte:** ignoriert Theme komplett (Saison-Look ist eigenständig).

## Café-Komposition (`cafe.js`)

Layer-Reihenfolge (back → front):

| # | Layer | Static/Anim | Theme-Drift | Notiz |
|---|-------|-------------|-------------|-------|
| 1 | Wand-Gradient | static | ✓ | Aktueller Code |
| 2 | Tapeten-Muster | static | – | Vertikale Streifen + Punkt-Variation, ~7 % Alpha |
| 3 | Bilderrahmen × 3 | static | – | Holzrahmen mit Katzen-Silhouetten (sitzend/schlafend/lugend) |
| 4 | Hängepflanze | static | – | Topf an Schnur oben rechts, 3 Blätter-Cluster |
| 5 | Fenster | static | – | Sprossen-Rahmen + Glas-Gradient |
| 6 | Lichtstrahl | **anim** | – | Trapez vom Fenster zum Tisch, Alpha 0.18→0.25 (`Math.sin(ts * 0.0008)`) |
| 7 | Holzdielen-Boden | static | (±5°) | 6–8 Dielen mit Maserung (ersetzt Perspektivlinien) |
| 8 | Akzent-Teppich | static | – | Warmes Oval, leicht versetzt |
| 9 | Wandleiste | static | ✓ | Bleibt |
| 10 | Tisch | static | ✓ | Bleibt |
| 11 | Tasse + Untertasse | static | – | x ≈ `CW * 0.12`, y ≈ `TABLE_CY - TABLE_RY * 0.3` |
| 12 | Dampf | **anim** | – | 3 Bezier-Strähnen, vertical drift + Alpha-Pulse |
| 13 | Schlafende Katze | **anim** | – | x ≈ `40`, y ≈ `CH * 0.88`. Atmet (Y-Skalierung ±2 %, ~3 s Periode) |
| 14 | Vignette | static | – | Bleibt |
| 15 | Lampen-Glow | static | – | Bleibt |
| 16 | Staubpartikel | **anim** | – | 14 Motes wie heute, an Lichtstrahl-Zone gebunden |

### Kollisions-Regeln

Décor außerhalb der Röhren-Bounding-Box. Konkret:
- Tasse + Untertasse links der Röhren-Spalte 0
- Schlafkatze unten links, klar unter `TABLE_CY + TABLE_RY`
- Hängepflanze oben rechts, oberhalb `TUBE_TOP - 20`
- Bilderrahmen verteilt im oberen Wand-Drittel, höher als `TUBE_TOP - 30`

### Animation-Spezifikation

Alle Animationen via `Math.sin(ts * k)`, kein RAF-Bookkeeping. Keine zusätzliche Per-Frame-Allocation (`MOTES`-Pattern: pre-build static array bei Modul-Load).

## Kirschblüte-Komposition (`kirschbluete.js`)

Layer-Reihenfolge:

| # | Layer | Static/Anim | Notiz |
|---|-------|-------------|-------|
| 1 | Himmel-Gradient | static | Bleibt |
| 2 | Berg-Silhouette | static | Sanfte Bezier-Form, blass-violett (`rgba(140,90,140,0.30)`), hinter Pagode |
| 3 | Pagode (3 Tiers) | static | Ersetzt aktuelle 2-Tier-Trapez-Pagode. Bezier-Dachkurven mit Aufschwung |
| 4 | Kirschbaum-Stamm + Äste | static | Bleibt erweitert (mehr Astverzweigung) |
| 5 | Blütenkrone-Cluster | static | 12–15 kleinere Blütenwolken (statt 5 großer Radials) |
| 6 | Stein-Laterne (Ishidōrō) | static | 4-Element-Silhouette: Sockel, Kelch, Lichtkammer, Dach |
| 7 | Boden mit Gras | static | Streifen-Textur, warmer Grünton |
| 8 | Stein-Pfad | static | 5–6 unregelmäßige Trittsteine, perspektivisch zur Pagode |
| 9 | Liegende Blütenblätter | static | ~25 rosa Punkte, varying Alpha + Größe |
| 10 | Sitzende Katze unter Baum | **anim** | Schwanzwedeln (sin-Welle, Spitze ±5 px) |
| 11 | Fallende Blüten (Petal-Form-Upgrade) | **anim** | 18 Stk. echte Petal-Pfade (Tropfen mit Mittelkerbe), Drift + Rotation |
| 12 | Vignette | static | Bleibt |

### Petal-Form-Upgrade

Aktuelles `drawSakuraPetal` (5 überlappende Ellipsen → wirkt wie kleine Blume) wird ersetzt durch einen einzelnen Petal-Pfad:
- Tropfen-Form via `quadraticCurveTo` mit Mittelkerbe oben
- `rotate(ts * 0.001 + seed)` für Taumel-Effekt
- Größe 4–7 px

### Stein-Laterne (Ishidōrō)

Position: x ≈ `CW * 0.62`, y-Sockel ≈ `CH * 0.78`. Vier gestapelte Elemente:
1. Quadratischer Sockel (~14 × 8 px)
2. Verjüngender Kelch
3. Lichtkammer (offene Quadrat-Form mit Mittelpunkt)
4. Pyramidales Dach mit Spitze

Farbe: `#7a6a5a` mit leichtem Gradient (Stein-Look). Theme-neutral.

## Code-Migration / Compatibility

`drawBackground` Public-API bleibt unverändert. Konsumenten in `js/main.js` und anderen müssen nichts ändern.

Garden / Rooftop / Winter: 1:1 Funktions-Move in eigenes Modul. Kein Refactor des Inhalts. Smoke-Test bestätigt Pixel-Gleichheit.

## Test-Strategie

### Browser-Smoke-Test (Chrome DevTools MCP)

1. **Lokal-Server starten:** `python -m http.server 8765` im Repo-Root.
2. **Default-Café laden:** Theme Tier 1, screenshot.
3. **Theme-Wechsel:** Tier 1 → 5 sequenziell, je screenshot. Wand-Hue-Drift erkennbar, Décor stabil.
4. **Mobile-Viewport:** 375 × 667 emuliert, Décor-Kollision visuell prüfen.
5. **Saison-Switch:** Set bgId zu `kirschbluete`, screenshot.
6. **Pixel-Regression Garden/Rooftop/Winter:** vor/nach Refactor screenshot, MD5-Vergleich (per `evaluate_script` mit Canvas → DataURL).

### Performance-Sanity

Chrome DevTools Performance-Recording 5 s mit aktivem Spiel. Background-Render-Time pro Frame < 4 ms (Desktop). Falls > 4 ms: Cache-Pfad debuggen (Cache-Miss?).

### Cache-Invalidation

Manueller Theme-Change im DevTools-Console (`G.theme = THEMES[3]; invalidateBackgroundCache()`). Nächster Frame muss korrekt rendern (kein Crash, korrekte Wand-Farbe).

## Rollout-Plan

Branch `background-cozy-overhaul`, ausgehend von `master`.

| Phase | Inhalt | Commit-Tag |
|-------|--------|------------|
| 1 | Modul-Split + Cache-System. Garden/Rooftop/Winter unverändert verschoben. Smoke-Test bestätigt Pixel-Gleichheit. | `refactor(bg): modular scenes + static cache` |
| 2 | Café-Elemente (Layer 2–13 neu hinzugefügt). | `feat(bg): cozy cafe — frames, plant, window, steam, sleeping cat` |
| 3 | Kirschblüte-Elemente (Berg, Pagode-Upgrade, Cluster-Krone, Laterne, Pfad, Petal-Upgrade, Katze). | `feat(bg): sakura — mountain, pagoda, lantern, cat, refined petals` |
| 4 | Visual review + Cleanup, optional Polish-Adjust. | `polish(bg): final visual pass` |

Drei Commits = drei Rollback-Punkte. Bei Problem in Phase 2 → revert auf Phase-1-State, Café bleibt funktional.

## Risiken & Open Questions

- **Cat-Silhouette-Form:** Schlafende Katze und sitzende Katze sind separate Pfade. `_shared.js::drawCat(ctx, x, y, opts)` mit `opts.pose ∈ {'sleeping', 'sitting'}`. Detailgrad iterativ im Implementation-Phase tunen.
- **Lichtstrahl-Sichtbarkeit:** Trapez-Form muss auf dunkleren Themes (Tier 5+) noch sichtbar sein. Alpha-Floor 0.15 als Untergrenze.
- **Pagode-Detail-Skalierung:** Bei Mobile (375 px Breite) wirkt 3-Tier-Pagode zu klein. Falls nötig: 2-Tier statt 3-Tier auf schmalen Viewports (responsive Layer-Variante).

## Out of Scope

- Tageszeit-Variationen (morgens/abends Lichtstimmung) — Post-Launch.
- Asset-Pipeline (PNG/SVG-Import) — würde Architektur sprengen, gegen reine Canvas-Philosophie.
- Garden / Rooftop / Winter visuelles Upgrade — andere Brainstorm-Runde.
- Audio-Layer (Vögelzwitschern, Wind-Rauschen) — eigenes Audio-Feature.
