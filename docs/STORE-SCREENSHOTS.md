# App Store Connect — Screenshots

## Pflicht-Größen (Stand 2026)
App Store Connect verlangt mindestens **einen** iPhone-Screenshot-Satz in der
größten Klasse; kleinere werden automatisch herunterskaliert.

| Klasse | Auflösung (Hochformat) | Geräte | Status |
|---|---|---|---|
| **6.9"** | **1320 × 2868** | iPhone 16/17 Pro Max, Plus | ✅ Pflicht — nutzen wir |
| 6.5" | 1242 × 2688 | ältere Pro Max | optional |
| 6.7" | 1290 × 2796 | 14/15 Pro Max | optional |
| iPad 13" | 2064 × 2752 | nur falls App iPad unterstützt | bei Bedarf |

- 1–10 Screenshots pro Sprache. Empfehlung: **5–6**.
- Reihenfolge = Anzeige-Reihenfolge; der erste ist der wichtigste.

## Vorhandene Aufnahmen (`store-assets/screenshots/`)
Aufgenommen von der Live-Site in exakt **1320 × 2868** (6.9"):

| Datei | Inhalt | Marketing-tauglich |
|---|---|---|
| `01-menu.png` | Splash/Hero — Logo + Katze + „Spielen" | ✅ guter erster Screenshot |
| `02-gameplay.png` | Level 1, Sortier-Röhren mit Katzen-Bällen, HUD | ✅ zeigt das Kernprinzip |

## Empfohlener finaler Satz (5–6) — beim echten Spielen aufnehmen
Die zwei vorhandenen reichen als Start; für eine starke Store-Präsenz noch
ergänzen — am besten mit **echtem Fortschritt** (sieht authentischer aus):

1. **Hero/Menü** (`01-menu`) — Markenbild, Wiedererkennung.
2. **Gameplay leicht** (`02-gameplay`) — „so funktioniert's".
3. **Gelöstes Level / Win-Moment** — Erfolgserlebnis, Konfetti/Katze.
4. **Katzen-Album mit freigeschalteten Katzen** — der Sammel-Hook (NICHT leer!).
5. **Höheres Level (viele Röhren)** — zeigt Tiefe/Anspruch.
6. **Werbefrei/Club** oder Blitz-Modus — Feature-Vielfalt.

> Tipp: Jeweils eine kurze Bildunterschrift drüberlegen (z. B. „Sortiere die
> Farben", „Sammle süße Kätzchen") — hebt die Conversion deutlich.

## So aufnehmen

**A) Aus dem Browser (schnell, volle Kontrolle, was wir genutzt haben)**
1. www.kittysort.de in Chrome öffnen, DevTools → Geräte-Toolbar.
2. Responsive auf **440 × 956**, Device Pixel Ratio **3** (= 1320 × 2868).
3. Szene ansteuern, Screenshot „Capture screenshot" → fertig in 6.9".

**B) Aus dem iOS-Simulator (am authentischsten, mit Status-Bar)**
```
xcrun simctl boot "iPhone 17 Pro Max"        # 6.9"-Gerät
# App installieren/starten (siehe ios-build-run), Szene ansteuern
xcrun simctl io booted screenshot bild.png   # nativ 1320 × 2868
```

## Vor Upload
- Keine Debug-/Premium-Overlays im Bild, das nicht gewollt ist (die untere
  „Alles freischalten 2,99 €"-Leiste in `02-gameplay` ist ok, aber bewusst wählen).
- PNG, sRGB, exakt 1320 × 2868, kein Alpha nötig.
