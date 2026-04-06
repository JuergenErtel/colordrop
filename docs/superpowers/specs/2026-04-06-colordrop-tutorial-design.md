# Color Drop — Tutorial: Design-Spec
**Datum:** 2026-04-06
**Status:** Genehmigt

---

## 1. Ziel

Ein interaktives Tutorial das Spieler beim ersten Start durch ein fixes Mini-Puzzle führt. Schritt-für-Schritt-Anleitung mit Canvas-Highlighting und HTML-Textblasen. Jederzeit über einen „?"-Button im Level-Select erneut aufrufbar.

Alle Änderungen beschränken sich auf `index.html`.

---

## 2. Mini-Puzzle

**3 Röhren, 2 Farben (cyan + magenta), je 2 Kugeln — lösbar in exakt 3 Zügen.**

Fest codiert (nicht generiert, kein PRNG):

```js
const TUTORIAL_TUBES = [
    ['cyan', 'magenta'],   // Röhre 0: unten→oben
    ['magenta', 'cyan'],   // Röhre 1
    [],                     // Röhre 2: leer
];
```

**Optimaler Lösungsweg:**

| Zug | Von | Nach | Ergebnis |
|-----|-----|------|----------|
| 1   | Röhre 1 (cyan oben) | Röhre 2 (leer) | Röhre 2: [cyan] |
| 2   | Röhre 0 (magenta oben) | Röhre 1 (magenta oben → match) | Röhre 1: [magenta, magenta] ✓ |
| 3   | Röhre 0 (cyan oben) | Röhre 2 (cyan oben → match) | Röhre 2: [cyan, cyan] ✓ |

Spieler kann auch andere gültige Züge machen — das Tutorial prüft nicht den exakten Zug, nur ob ein Zug stattgefunden hat.

---

## 3. State

Zwei neue Felder im globalen `G`-Objekt:

```js
tutorial: false,   // true = Tutorial-Modus aktiv
tutStep: 0,        // Aktueller Schritt im TUTORIAL_SCRIPT (0–3)
```

Tutorial-Modus verwendet die existierende Spiellogik vollständig (handleInput, updateArc, checkWin etc.) — nur das Puzzle-Setup und das Overlay-Rendering werden ersetzt.

---

## 4. Script

```js
const TUTORIAL_SCRIPT = [
    {
        text:      'Tippe auf eine Röhre um die oberste Kugel aufzunehmen.',
        highlight: 'all',       // alle Röhren pulsieren
        waitFor:   'select',    // wartet auf: Spieler selektiert eine Röhre
    },
    {
        text:      'Tippe auf eine andere Röhre um sie abzulegen.',
        highlight: 'targets',   // gültige Zielröhren pulsieren
        waitFor:   'move',      // wartet auf: Zug abgeschlossen
    },
    {
        text:      'Gut! Stapele gleiche Farben — eine Röhre, eine Farbe.',
        highlight: 'top-match', // Röhre mit zwei gleichen Kugeln oben leuchtet
        waitFor:   'move',
    },
    {
        text:      'Noch ein Zug — du schaffst das!',
        highlight: 'all',
        waitFor:   'win',       // wartet auf: checkWin() true
    },
];
```

**Nach dem Sieg:**
- Textblase zeigt: „Gelöst! Du kennst jetzt alle Regeln."
- Button „Los geht's →" startet Level 1
- `localStorage.setItem('colordrop_tut_done', '1')` wird gesetzt

---

## 5. Highlighting

Pulsierender Leuchtring auf dem Canvas, gerendert nach den Röhren in `render()`:

```js
function drawTutorialHighlight() {
    if (!G.tutorial) return;
    const step   = TUTORIAL_SCRIPT[G.tutStep];
    const alpha  = 0.45 + 0.35 * Math.sin(Date.now() / 280);   // Pulsieren
    const radius = TUBE.w * 0.6;

    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth   = 3;

    TUBES.forEach((tube, i) => {
        const shouldHighlight =
            step.highlight === 'all' ||
            (step.highlight === 'targets' && isValidTarget(i)) ||
            (step.highlight === 'top-match' && tubeHasTopMatch(i));

        if (!shouldHighlight) return;
        const cx = tubeX(i);
        const cy = TUBE.top + TUBE.h / 2;
        ctx.beginPath();
        ctx.roundRect(cx - TUBE.w/2 - 4, TUBE.top - 4, TUBE.w + 8, TUBE.h + 8, radius);
        ctx.stroke();
    });
}
```

Hilfsfunktionen:
- `isValidTarget(i)`: Röhre i ist leer ODER oberste Kugel = selektierte Farbe
- `tubeHasTopMatch(i)`: Röhre i hat ≥ 2 Kugeln und die obersten zwei sind gleiche Farbe

---

## 6. Textblase (HTML)

Neues HTML-Element unterhalb des Canvas:

```html
<div id="tutBubble" class="tut-bubble hidden">
    <span id="tutText"></span>
    <button id="tutSkip" class="tut-skip">Überspringen</button>
</div>
```

**CSS:**

```css
.tut-bubble {
    position: absolute;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
    width: min(420px, 90vw);
    background: rgba(15,20,32,.92);
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 14px;
    padding: .9rem 1.1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .8rem;
    font-size: .9rem;
    color: #e8eaf0;
    backdrop-filter: blur(8px);
    z-index: 50;
    transition: opacity .2s;
}
.tut-bubble.hidden { opacity: 0; pointer-events: none; }
.tut-skip {
    flex-shrink: 0;
    font-size: .75rem;
    color: rgba(255,255,255,.45);
    background: none;
    border: none;
    cursor: pointer;
    padding: .2rem .4rem;
    text-decoration: underline;
}
```

---

## 7. Tutorial starten

```js
function startTutorial() {
    // Spielzustand zurücksetzen
    G.tutorial = true;
    G.tutStep  = 0;
    G.won      = false;
    G.moves    = 0;
    G.selected = null;

    // Röhren aus festem Template befüllen
    TUBES = TUTORIAL_TUBES.map(t => [...t]);

    // Overlay schliessen falls offen
    closeLevelSelect();
    document.getElementById('overlay').classList.remove('show');

    // Textblase anzeigen
    advanceTutStep();
}
```

---

## 8. Schritte weiterschalten

`advanceTutStep()` wird aufgerufen wenn die `waitFor`-Bedingung des aktuellen Schritts erfüllt ist:

```js
function advanceTutStep() {
    const bubble = document.getElementById('tutBubble');
    const textEl = document.getElementById('tutText');

    if (G.tutStep >= TUTORIAL_SCRIPT.length) {
        // Gewonnen-Zustand
        textEl.textContent = 'Gelöst! Du kennst jetzt alle Regeln.';
        document.getElementById('tutSkip').textContent = 'Los geht\'s →';
        bubble.classList.remove('hidden');
        return;
    }

    textEl.textContent = TUTORIAL_SCRIPT[G.tutStep].text;
    bubble.classList.remove('hidden');
}
```

**Aufrufstellen:**

| Wo | Bedingung |
|----|-----------|
| `handleInput` nach Selektion | `G.tutorial && step.waitFor === 'select'` → `G.tutStep++; advanceTutStep()` |
| `updateArc` nach Landung | `G.tutorial && step.waitFor === 'move'` → `G.tutStep++; advanceTutStep()` |
| `updateArc` nach `checkWin()` | `G.tutorial && step.waitFor === 'win'` → `G.tutStep++; advanceTutStep()` |

---

## 9. Tutorial beenden (Überspringen oder Abschluss)

```js
function endTutorial() {
    localStorage.setItem('colordrop_tut_done', '1');
    G.tutorial = false;
    document.getElementById('tutBubble').classList.add('hidden');
    generateLevel(1);
}
```

`#tutSkip`-Button ruft `endTutorial()` auf — sowohl bei „Überspringen" als auch bei „Los geht's →" nach dem Sieg.

---

## 10. Navigation & Persistenz

**Erster Start:**

```js
function bootstrap() {
    resizeCanvas();
    requestAnimationFrame(render);
    if (!localStorage.getItem('colordrop_tut_done')) {
        startTutorial();
    } else {
        openLevelSelect();
    }
}
```

**„?"-Button im Level-Select:**

```html
<button id="tutBtn" class="ls-tut-btn">?</button>
```

```css
.ls-tut-btn {
    position: absolute;
    top: 1.8rem;
    right: 1.5rem;
    width: 2rem; height: 2rem;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
    border: 1px solid rgba(255,255,255,.2);
    color: rgba(255,255,255,.6);
    font-size: .85rem;
    cursor: pointer;
}
```

Klick: `closeLevelSelect(); startTutorial();`

---

## 11. Nicht im Scope

- Animierte Pfeile die auf Röhren zeigen
- Mehrsprachigkeit (Tutorial-Texte sind auf Deutsch)
- Tutorial-Replay-Statistiken
- Fortgeschrittenes Tutorial (Mehrfarb-Level)
