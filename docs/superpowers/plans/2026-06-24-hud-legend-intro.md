# HUD-Symbol-Legende im Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Im Erst-Tutorial eine Erklär-Karte zeigen, die die HUD-Symbole 🐟 Fischgräten, 🐾 Pfoten (Leben), ↩ Zurück, 💡 Tipp erklärt.

**Architecture:** Neues Overlay `#hudIntroOverlay` im bestehenden Intro-Karten-Stil (`blitz-overlay`/`blitz-inner`). `startTutorial()` zeigt es vor dem ersten Tutorial-Bubble; sein Button blendet es aus und ruft `advanceTutStep()`.

**Tech Stack:** Vanilla HTML/CSS/ES-Module, Browser-Verifikation (kein Unit-Test — reine UI).

## Global Constraints

- Nur im Erst-Tutorial (an `startTutorial` gekoppelt, kein separater „gesehen"-Status).
- Defensiv: fehlt `#hudIntroOverlay` (alte gecachte HTML), direkt `advanceTutStep()`.
- Echte HUD-Icons nutzen: 🐟 = `<i class="fishbone"></i>`, 🐾 = `<span class="paw">🐾</span>`, ↩ und 💡 als Glyphen.
- Nach JS-Änderung: `node --check js/main.js`. Am Ende: `npm run cap:sync` + SW-Cache bumpen.

---

### Task 1: Legende-Karte (HTML + CSS)

**Files:**
- Modify: `index.html` (neues Overlay nach dem `jokerIntroOverlay`, ~Z. 329 ff.)
- Modify: `css/overlays.css` (neue `.hud-legend`-Regeln bei den Intro-Stilen)

**Interfaces:**
- Produces: DOM-Elemente `#hudIntroOverlay`, Button `#hudIntroBtn`.

- [ ] **Step 1: Overlay-Markup einfügen** — in `index.html` direkt VOR der Zeile `<div id="jokerIntroOverlay" class="blitz-overlay">`:

```html
    <!-- HUD-Symbol-Legende (Erst-Tutorial) -->
    <div id="hudIntroOverlay" class="blitz-overlay">
        <div class="blitz-inner">
            <h2 class="blitz-title">Deine Leiste <span class="paw">🐾</span></h2>
            <div class="hud-legend">
                <div class="hud-legend-row">
                    <div class="hud-legend-icon"><i class="fishbone"></i></div>
                    <div class="hud-legend-text">
                        <span class="hud-legend-name">Fischgräten</span>
                        <span class="hud-legend-desc">Deine Münzen – für Tipps, Extra-Züge und den Shop.</span>
                    </div>
                </div>
                <div class="hud-legend-row">
                    <div class="hud-legend-icon"><span class="paw">🐾</span></div>
                    <div class="hud-legend-text">
                        <span class="hud-legend-name">Pfoten = Leben</span>
                        <span class="hud-legend-desc">Gehen sie aus, lädt nach Zeit eins nach – oder per Werbung/Fischgräten auffüllen.</span>
                    </div>
                </div>
                <div class="hud-legend-row">
                    <div class="hud-legend-icon">↩</div>
                    <div class="hud-legend-text">
                        <span class="hud-legend-name">Zurück</span>
                        <span class="hud-legend-desc">Macht den letzten Zug rückgängig.</span>
                    </div>
                </div>
                <div class="hud-legend-row">
                    <div class="hud-legend-icon">💡</div>
                    <div class="hud-legend-text">
                        <span class="hud-legend-name">Tipp</span>
                        <span class="hud-legend-desc">Zeigt dir einen guten nächsten Zug (kostet ein paar Fischgräten).</span>
                    </div>
                </div>
            </div>
            <button id="hudIntroBtn" class="blitz-btn" type="button">Los geht's →</button>
        </div>
    </div>
```

- [ ] **Step 2: CSS einfügen** — in `css/overlays.css` ans Ende der Datei anhängen:

```css
/* ── HUD-Symbol-Legende (Erst-Tutorial) ───────────────────── */
.hud-legend {
    display: flex; flex-direction: column; gap: .9rem;
    margin: .6rem 0 1.4rem;
    text-align: left;
}
.hud-legend-row { display: flex; align-items: flex-start; gap: .8rem; }
.hud-legend-icon {
    flex: 0 0 2rem; width: 2rem; height: 2rem;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem;
}
.hud-legend-text { display: flex; flex-direction: column; gap: .1rem; }
.hud-legend-name { font-weight: 700; color: #fff; font-size: .95rem; }
.hud-legend-desc { font-size: .82rem; color: rgba(255,255,255,.65); line-height: 1.35; }
```

- [ ] **Step 3: Statisch im Browser prüfen (Screenshot)**

Run:
```bash
lsof -ti tcp:8799 | xargs kill -9 2>/dev/null; nohup python3 -m http.server 8799 --bind 127.0.0.1 >/dev/null 2>&1 & sleep 1
```
Dann im Browser/DevTools-MCP (390px): `document.getElementById('hudIntroOverlay').classList.add('show')` und Screenshot.
Expected: Zentrierte Karte „Deine Leiste 🐾", vier Zeilen mit echten Icons (🐟/🐾/↩/💡) sauber linksbündig ausgerichtet, Button „Los geht's →" mittig.

- [ ] **Step 4: Commit**

```bash
git add index.html css/overlays.css
git commit -m "feat(intro): HUD legend card markup + styles"
```

---

### Task 2: In den Tutorial-Flow einhängen

**Files:**
- Modify: `js/main.js` (`startTutorial()` ~Z. 1875; neuer Button-Handler bei den anderen Intro-Handlern ~Z. 2322)

**Interfaces:**
- Consumes: `#hudIntroOverlay`, `#hudIntroBtn` (Task 1); vorhandene `advanceTutStep()`.

- [ ] **Step 1: `startTutorial()` zeigt zuerst die Legende** — die letzten zwei Zeilen von `startTutorial()` ändern. Alt:

```js
  updateHUD();
  advanceTutStep();
}
```

Neu:

```js
  updateHUD();
  // Erst die HUD-Symbol-Legende, dann der normale Tutorial-Ablauf.
  const hudIntro = document.getElementById('hudIntroOverlay');
  if (hudIntro) hudIntro.classList.add('show');
  else advanceTutStep();
}
```

- [ ] **Step 2: Button-Handler ergänzen** — in `js/main.js` direkt VOR dem `jokerIntroBtn`-Handler (`document.getElementById('jokerIntroBtn').addEventListener(...)`, ~Z. 2322) einfügen:

```js
document.getElementById('hudIntroBtn')?.addEventListener('click', () => {
  playSound('click');
  document.getElementById('hudIntroOverlay').classList.remove('show');
  advanceTutStep();
});
```

- [ ] **Step 3: Syntax prüfen**

Run: `node --check js/main.js`
Expected: kein Output, Exit 0.

- [ ] **Step 4: Funktional im Browser prüfen** — SW/Cache leeren, frisch laden, Tutorial starten (Menü → „Spiel starten" beim Erst-Tutorial bzw. `startTutorial()` über die Tutorial-Bedingung). Erwartung:

Beim Tutorial-Start erscheint die Legende; Tap „Los geht's →" blendet sie aus und die erste Tutorial-Sprechblase („Willkommen! …") erscheint; Sortieren funktioniert normal.

Pragmatischer Check (DevTools-MCP), da das echte Tutorial nur für neue Spieler läuft:
```js
// Legende zeigen + Button klicken → tutBubble sichtbar?
document.getElementById('hudIntroOverlay').classList.add('show');
document.getElementById('hudIntroBtn').click();
({ legendShown: document.getElementById('hudIntroOverlay').classList.contains('show'),
   bubbleVisible: !document.getElementById('tutBubble').classList.contains('hidden') });
```
Expected: `{ legendShown: false, bubbleVisible: true }` (Legende aus, Sprechblase an) — sofern `G.tutorial` aktiv; sonst nur prüfen, dass der Klick die Legende ausblendet und nicht crasht.

- [ ] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat(intro): show HUD legend at tutorial start"
```

---

### Task 3: Build-Sync + SW-Cache

**Files:**
- Modify: `sw.js` (Cache-Bump)

- [ ] **Step 1: SW-Cache bumpen** — `const CACHE = '...'` auf neuen Wert, z. B. `'kittysort-hudlegend-7'`.

- [ ] **Step 2: Sync ins iOS-Bundle**

Run: `npm run cap:sync`
Expected: „Sync finished".

- [ ] **Step 3: Bundle-Gegencheck**

Run: `grep -c hudIntroOverlay ios/App/App/public/index.html && grep -c hud-legend ios/App/App/public/css/overlays.css`
Expected: je ≥1.

- [ ] **Step 4: Commit**

```bash
git add sw.js
git commit -m "chore(pwa): bump SW cache for HUD legend"
```

---

## Self-Review

- Spec-Abdeckung: Legende-Overlay (Task 1) ✓, vier Symbole mit echten Icons (Task 1) ✓, Einhängen in `startTutorial` + Button → `advanceTutStep` (Task 2) ✓, defensiv falls Overlay fehlt (Task 2 Step 1) ✓, Browser-Verifikation (Task 1/2) ✓, Sync/SW (Task 3) ✓.
- Keine Platzhalter; Element-IDs (`hudIntroOverlay`, `hudIntroBtn`) in Task 1 definiert und in Task 2 konsistent genutzt.
