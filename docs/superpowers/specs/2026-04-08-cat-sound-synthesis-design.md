# Cat Sound Synthesis — Fortgeschrittene Formant-Synthese

**Datum:** 2026-04-08
**Status:** Approved
**Scope:** 6 Katzen-Sounds in `js/audio.js` überarbeiten

## Kontext

Die aktuellen Katzen-Sounds in Kittysort sind rein synthetisch (einfache OscillatorNodes mit Frequenz-Slides). Sie funktionieren, klingen aber maschinell und wenig katzenartig. Ziel: Deutlich überzeugendere Sounds durch fortgeschrittene Synthese-Techniken, ohne externe Audio-Dateien.

## Technik: Formant-Synthese + Layering

Statt einfacher Oszillatoren werden **mehrere BiquadFilter (Bandpass) als Formanten** eingesetzt, analog zu echter Stimmsynthese. Katzenlaute haben 2–3 charakteristische Resonanzfrequenzen, die den Klangcharakter bestimmen.

### Hilfsfunktionen

- `formant(freq, Q, source, gainNode)` — Erstellt einen Bandpass-Filter bei gegebener Frequenz und Q-Faktor, verbindet ihn mit einer Quelle und einem Gain-Node. Wiederverwendbar für alle Sounds.
- `randomize(value, spread)` — Gibt `value * (1 + (Math.random() - 0.5) * spread)` zurück. Wird für Variation bei jedem Aufruf verwendet.

### Die 6 Sounds

#### 1. Miau (select)
- **Trigger:** Röhrenauswahl
- **Technik:** Rauschquelle → 2 Bandpass-Formanten (F1: ~800Hz, F2: ~1500Hz)
- **Formant-Glide:** F1 startet bei 600Hz, gleitet zu 900Hz; F2 startet bei 1200Hz, gleitet zu 1600Hz — simuliert "Mi-au"-Silbenwechsel
- **Vibrato:** LFO bei ~6Hz moduliert Pitch leicht (±20 cents)
- **Hüllkurve:** 30ms Attack, 100ms Sustain, 50ms Release
- **Dauer:** ~180ms
- **Variation:** ±10% auf alle Frequenzen, ±15% Dauer

#### 2. Purr (solved, win)
- **Trigger:** Röhre komplett sortiert / Level gewonnen
- **Technik:** 2 Layer:
  1. Sawtooth-Oszillator bei ~25Hz (Grundfrequenz) → Bandpass bei ~200Hz (Resonanzkörper)
  2. Gefiltertes Noise (Bandpass 150–400Hz) für Atem-Textur
- **Puls-Modulation:** LFO bei ~25Hz moduliert Amplitude — erzeugt das charakteristische "Rattern" des Schnurrens
- **Atemrhythmus:** Langsamer LFO (~0.5Hz) moduliert Gesamtlautstärke leicht — simuliert Ein/Ausatmen
- **Hüllkurve:** 50ms Attack, langer Sustain, 200ms Release
- **Dauer:** 400ms (solved) / 800ms (win)
- **Variation:** ±8% auf Grundfrequenz, ±10% LFO-Rate

#### 3. Hiss (invalid)
- **Trigger:** Ungültiger Zug / Timer abgelaufen
- **Technik:** White Noise → Bandpass-Filter (Zentrum: ~4000Hz, Q: 2) + Highpass bei 2000Hz
- **Charakter:** Zischendes, scharfes Fauchen statt generischem Rauschen
- **Hüllkurve:** 5ms Attack (sehr schnell), kein Sustain, 100ms exponentieller Decay
- **Dauer:** ~120ms
- **Variation:** ±15% auf Filterfrequenz, ±20% Dauer

#### 4. Mrrp (cat_unlock)
- **Trigger:** Katze freigeschaltet
- **Technik:** Rauschquelle → 2 Formanten mit schnellem Aufwärts-Sweep
- **Triller:** FM-Synthese bei ~15Hz erzeugt das typische "Trillern"
- **Formant-Sweep:** F1: 400→1200Hz, F2: 800→2000Hz über 150ms
- **Hüllkurve:** 10ms Attack, 100ms Sustain, 80ms Release
- **Dauer:** ~200ms
- **Nachklang:** Optionaler kurzer Jingle (bestehende aufsteigende Töne bleiben erhalten)
- **Variation:** ±10% auf Sweep-Geschwindigkeit, ±12% Frequenzen

#### 5. Prrt (hint)
- **Trigger:** Hint-Aktivierung
- **Technik:** Kurzer Noise-Burst (20ms) → Formant-Upglide (300→800Hz)
- **Fragender Charakter:** Pitch steigt am Ende nochmal an (wie ein Fragezeichen)
- **Hüllkurve:** 5ms Attack, 80ms Sustain, 40ms Release
- **Dauer:** ~130ms
- **Variation:** ±10% auf alle Frequenzen

#### 6. Mew (undo)
- **Trigger:** Undo-Aktion
- **Technik:** Einzelner Formant (F1: ~1200Hz), dünner und höher als Miau
- **Pitch:** Abwärts-Glide 1200→800Hz — klingt enttäuscht/klein
- **Hüllkurve:** 15ms Attack, 60ms Sustain, 30ms Release
- **Dauer:** ~100ms
- **Variation:** ±10% Pitch, ±15% Dauer

## Variation-System

Jeder Sound bekommt bei jedem Aufruf leicht randomisierte Parameter:
- Frequenzen: ±10%
- Dauer: ±15%
- Formant-Positionen: leichte Verschiebung
- Dies verhindert den "Roboter-Effekt" bei wiederholtem Abspielen

## Architektur-Entscheidungen

- **Keine neuen Dateien** — alles in `js/audio.js`
- **Bestehende API bleibt identisch** — `playSound(name)` Signatur ändert sich nicht
- **Keine Breaking Changes** — render.js, main.js, timer.js brauchen keine Anpassung
- **Hilfsfunktion `formant()`** wird als private Funktion in audio.js hinzugefügt
- **Bestehende `purr()` Funktion** wird erweitert (nicht ersetzt)
- **Bestehende `tone()` Funktion** bleibt für Nicht-Katzen-Sounds (tick, pop, win-jingle)

## Nicht im Scope

- UI-Sounds (pop, tick, tap) — klingen bereits passabel
- Win-Jingle (aufsteigende Töne) — bleiben, Purr davor wird verbessert
- Ambient-Musik (music.js) — separates Thema
- Externe Audio-Dateien — bewusst ausgeschlossen
- Reverb/Delay-Effekte — unnötige Komplexität für kurze Sounds
