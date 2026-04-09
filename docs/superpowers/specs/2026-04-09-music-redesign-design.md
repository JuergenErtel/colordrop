# Music Redesign — Fröhliche prozedurale Schichtmusik

**Datum:** 2026-04-09
**Ziel:** Die monotone Ambient-Musik durch fröhliche, variierende prozedurale Musik ersetzen, die rhythmisch und verspielt klingt und sich nie genau wiederholt.

---

## Übersicht

Kompletter Neubau von `js/music.js`. Gleiche öffentliche API, komplett neue Interna. Drei gleichzeitige Schichten (Melodie, Pad, Rhythmus) mit zufälliger Variation.

**Keine Änderungen an anderen Dateien** — die API `startMusic(tier)`, `stopMusic()`, `setMusicVolume()` etc. bleibt identisch.

---

## 1. Tier-Konfiguration

Jedes Tier hat eine eigene musikalische Persönlichkeit:

| Tier | Tonart | BPM | Charakter |
|------|--------|-----|-----------|
| EASY | C-Dur | 110 | Unbeschwert, verspielt |
| MEDIUM | G-Dur | 115 | Warm, etwas mehr Drive |
| HARD | D-Moll | 120 | Fokussiert, spannend |
| EXPERT | A-Moll | 125 | Intensiv, geheimnisvoll |
| MASTER | E-Moll | 130 | Episch, druckvoll |

Pro Tier definiert als `TIER_CONFIG`:
- `root`: Grundton-Frequenz (Hz)
- `scale`: Array von Halbtonschritten (Dur: `[0,2,4,5,7,9,11]`, Moll: `[0,2,3,5,7,8,10]`)
- `bpm`: Tempo
- `chords`: Array von 6 Akkorden als relative Halbtonschritt-Arrays (z.B. `[[0,4,7], [5,9,12], ...]`)
- `density`: Rhythmus-Dichte (0.0-1.0, EASY=0.6, MASTER=0.95)

---

## 2. Melodie-System

### 8 Melodie-Patterns

Definiert als relative Intervalle (Halbtonschritte über dem Grundton):

```js
const MELODY_PATTERNS = [
  [0, 4, 7, 12, 7, 4],           // Aufwärts-Arpeggio
  [12, 10, 7, 5, 4, 0],          // Abwärts-Lauf
  [0, 2, 4, 7, 4, 2, 0],         // Wellenbewegung
  [7, 5, 7, 12, 10, 7],          // Hüpfend
  [0, 0, 4, 4, 7, 7, 12],        // Stufenweise Paare
  [4, 7, 12, 11, 12, 7],         // Verspieltes Pendeln
  [0, 7, 4, 12, 7, 0],           // Große Sprünge
  [12, 7, 9, 5, 7, 4, 0],        // Absteigende Melodie
];
```

### Ablauf pro Takt

- Ein Pattern = 1 Takt (4 Beats)
- Noten gleichmäßig verteilt über den Takt (Achtel/Viertel je nach Pattern-Länge)
- Nach jedem Pattern: zufällig neues wählen (kein direktes Wiederholen des gleichen)
- Jeder 3.-4. Takt: Melodie pausiert (nur Pad + Rhythmus) — Chance ~30%

### Transposition

Pattern-Intervalle werden auf die aktuelle Akkord-Grundnote transponiert. Die Intervalle werden in die Tier-Skala "eingerastet" (nächste verfügbare Skalennote).

### Sound

- Triangle-Oszillator
- Attack: 0.02s
- Decay: Note-Dauer × 0.8 (kurz, perkussiv)
- Lautstärke: 0.15 pro Note (relativ zum Master-Gain)
- Ergebnis: Glockenspiel/Kalimba-Charakter

---

## 3. Rhythmus-System

### Hi-Hat

- Gefilterter Noise-Burst: Highpass 8kHz, Dauer 0.05s
- Spielt auf jedem Achtel (8 pro Takt)
- Dynamik nach Position:
  - Beat 1, 3 (on-beat): 100% Lautstärke
  - Beat 2, 4 (on-beat): 60%
  - Off-Beats: 30%
- Humanisierung: ~20% Chance, einzelne Schläge auszulassen
- Tier-abhängig: `density` steuert, wie viele Off-Beats tatsächlich gespielt werden (EASY weniger, MASTER mehr)
- Lautstärke: 0.06 pro Hit

### Soft Kick

- Sinus-Oszillator: Frequenz-Sweep 150Hz→50Hz über 0.1s
- Spielt auf Beat 1 und Beat 3
- Lautstärke: 0.12
- Gibt sanften Puls

### Gesamtlautstärke Rhythmus

~40% des Melodie-Volumens. Untermalt, dominiert nicht.

---

## 4. Akkord-Pads

### Verbesserungen gegenüber aktuell

- 6 Akkorde pro Tier statt 4
- Akkord-Dauer: 2 Takte (= `60/BPM * 4 * 2` Sekunden)
- Sine-Oszillatoren mit Detune (+3/-3 Cent) für Wärme
- Zusätzlicher Oberton: Oktave über jeder Note bei 25% Lautstärke
- Lautstärke-Atmung: sanftes Anschwellen über erste Hälfte, Abschwellen über zweite Hälfte

### Sound

- 3 Sine-Oszillatoren (Akkordnoten) + 3 Oktav-Obertöne
- Sub-Bass: tiefste Note / 2 (wie aktuell)
- Lautstärke pro Note: 0.14 (Haupt) + 0.04 (Oberton) + 0.06 (Sub-Bass)

---

## 5. Scheduling

### Zentraler Loop: `scheduleBar(tier)`

Pro Takt (4 Beats, Dauer = `240 / BPM` Sekunden):

1. **Melodie:** Wenn nicht Pause-Takt → Pattern wählen, Noten über den Takt verteilen und via `setTimeout` planen
2. **Rhythmus:** 8 Hi-Hat-Slots + 2 Kick-Slots planen
3. **Pad:** Alle 2 Takte neuen Akkord starten

Am Ende jedes Takts: `setTimeout(() => scheduleBar(tier), taktDauer * 1000)`.

### State

```js
_barIndex       // laufender Takt-Zähler
_lastPatternIdx // letztes Melodie-Pattern (um Wiederholung zu vermeiden)
_scheduleId     // setTimeout-ID für nächsten Takt
_activeNodes    // aktuell klingende Pad-Oszillatoren
```

---

## 6. Crossfade

Beim Tier-Wechsel (`startMusic(newTier)` während bereits Musik läuft):

1. `_masterGain.gain` von aktuellem Wert auf 0 über 1s rampen
2. Nach 1s: alle aktiven Nodes stoppen, State zurücksetzen
3. Neuen Tier starten mit `_masterGain.gain` von 0 auf `_volume` über 1s

Kein Timing-Sync — neue Musik beginnt bei Takt 1.

---

## 7. Öffentliche API (unverändert)

```js
startMusic(tier)        // Startet Musik, Crossfade wenn schon läuft
stopMusic()             // Fade-Out (0.5s) + Stop
setMusicVolume(vol)     // 0-1
getMusicVolume()        // → number
setMusicEnabled(on)     // true/false
isMusicEnabled()        // → boolean
```

---

## 8. Dateiänderungen

| Datei | Änderung |
|-------|----------|
| `js/music.js` | Kompletter Neubau (gleiche API, neue Interna) |

Keine anderen Dateien betroffen.
