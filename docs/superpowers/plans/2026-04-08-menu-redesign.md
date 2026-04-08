# Royal Bold Menu Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the cheap-looking menu into a premium Royal Bold design with 3D gold buttons, tier-section level paths, and polished overlays.

**Architecture:** Primarily CSS changes in `index.html` inline `<style>`, plus HTML restructuring for the button layout and JS changes in `main.js` for the level path generation. Each task targets one visual area and can be verified by opening the game in a browser.

**Tech Stack:** CSS3 (gradients, box-shadow, transforms, animations), HTML5, vanilla JS

---

### Task 1: Primary action buttons — 3D gold/purple gradients

**Files:**
- Modify: `index.html:552-574` (CSS for `.ls-actions`, `.ls-action-btn`)

- [ ] **Step 1: Replace `.ls-actions` and `.ls-action-btn` CSS rules**

Find the block starting at line 552:
```css
        .ls-actions {
            display: flex;
            flex-direction: column;
            gap: .55rem;
            margin: .8rem 0 1rem;
        }

        .ls-action-btn {
            font-family: var(--f-head);
            font-size: .8rem;
            letter-spacing: 2px;
            padding: .55rem 1.4rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,.22);
            background: rgba(255,255,255,.08);
            color: #fff;
            cursor: pointer;
            transition: background .15s;
        }
        .ls-action-btn:hover  { background: rgba(255,255,255,.16); }
        .ls-action-btn:active { transform: scale(.97); }
        .ls-action-btn:disabled { opacity: .38; cursor: default; }
        .ls-action-btn--secondary { opacity: .7; }
        .ls-action-btn--secondary:hover { opacity: 1; }
```

Replace with:
```css
        .ls-actions {
            display: flex;
            flex-direction: column;
            gap: .55rem;
            margin: .8rem 0 1rem;
        }
        .ls-actions-secondary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: .5rem;
            margin-top: .3rem;
        }

        .ls-action-btn {
            font-family: 'Fredoka', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: 2px;
            padding: .75rem 1.4rem;
            border-radius: 14px;
            border: none;
            cursor: pointer;
            transition: transform .1s, box-shadow .1s;
            text-transform: uppercase;
        }
        .ls-action-btn:active { transform: translateY(2px); }
        .ls-action-btn:disabled { opacity: .38; cursor: default; }

        /* Primary: Gold gradient (Tages-Challenge) */
        .ls-action-btn--daily {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
            color: #4a2000;
            box-shadow: 0 4px 0 #B8860B, 0 6px 15px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3);
        }
        .ls-action-btn--daily:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #B8860B, 0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
        .ls-action-btn--daily:active { box-shadow: 0 2px 0 #B8860B, 0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }

        /* Primary: Purple gradient (Endlos-Modus) */
        .ls-action-btn--endless {
            background: linear-gradient(135deg, #7B68EE 0%, #6A5ACD 100%);
            color: #fff;
            box-shadow: 0 4px 0 #483D8B, 0 6px 15px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3);
        }
        .ls-action-btn--endless:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #483D8B, 0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
        .ls-action-btn--endless:active { box-shadow: 0 2px 0 #483D8B, 0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }

        /* Secondary: Subtle with gold border */
        .ls-action-btn--secondary {
            font-size: .8rem;
            font-weight: 500;
            padding: .6rem .8rem;
            border-radius: 12px;
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,215,0,.25);
            color: rgba(255,255,255,.7);
            box-shadow: none;
            text-transform: uppercase;
        }
        .ls-action-btn--secondary:hover { background: rgba(255,255,255,.12); border-color: rgba(255,215,0,.4); transform: none; }
        .ls-action-btn--secondary:active { transform: scale(.97); }

        /* Album button special gold shimmer */
        .ls-action-btn--album { border-color: rgba(255,215,0,.4); color: rgba(255,215,0,.8); }
```

- [ ] **Step 2: Restructure the HTML buttons in `index.html`**

Find lines 1170-1177:
```html
            <div class="ls-actions">
                <button id="dailyChallengeBtn" class="ls-action-btn" type="button">📅 Tages-Challenge</button>
                <button id="endlessBtn" class="ls-action-btn" type="button">♾️ Endlos-Modus</button>
                <button id="statsBtn" class="ls-action-btn ls-action-btn--secondary" type="button">📊 Statistiken</button>
                <button id="settingsBtn" class="ls-action-btn ls-action-btn--secondary" type="button">⚙️ Einstellungen</button>
                <button id="albumBtn" class="ls-action-btn" type="button">🐱 Katzen-Album</button>
                <button id="streakBtn" class="ls-action-btn ls-action-btn--secondary" type="button">📅 Streak-Kalender</button>
            </div>
```

Replace with:
```html
            <div class="ls-actions">
                <button id="dailyChallengeBtn" class="ls-action-btn ls-action-btn--daily" type="button">📅 Tages-Challenge</button>
                <button id="endlessBtn" class="ls-action-btn ls-action-btn--endless" type="button">♾️ Endlos-Modus</button>
                <div class="ls-actions-secondary">
                    <button id="statsBtn" class="ls-action-btn ls-action-btn--secondary" type="button">📊 Statistiken</button>
                    <button id="settingsBtn" class="ls-action-btn ls-action-btn--secondary" type="button">⚙️ Einstellungen</button>
                    <button id="albumBtn" class="ls-action-btn ls-action-btn--secondary ls-action-btn--album" type="button">🐱 Katzen-Album</button>
                    <button id="streakBtn" class="ls-action-btn ls-action-btn--secondary" type="button">📅 Streak-Kalender</button>
                </div>
            </div>
```

- [ ] **Step 3: Test manually**

Open http://localhost:8080 in browser, click Play. Verify:
- Tages-Challenge button has gold 3D gradient with press effect
- Endlos-Modus has purple 3D gradient
- 4 secondary buttons in 2x2 grid with gold borders
- Katzen-Album has stronger gold accent

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(menu): 3D gold/purple action buttons with 2x2 secondary grid"
```

---

### Task 2: Level path — tier-sections with round nodes

**Files:**
- Modify: `index.html:519-530,631-657` (CSS for `.ls-tier`, `.ls-grid`, `.ls-card`, `.ls-num`, `.ls-stars`)
- Modify: `js/main.js:742-794` (function `buildLevelSelect()`)

- [ ] **Step 1: Replace the level grid CSS with tier-section and node styles**

Find and replace the `.ls-tier` block at line 519:
```css
        .ls-tier { display: flex; flex-direction: column; gap: .6rem; }
```

Replace with:
```css
        .ls-tier {
            display: flex; flex-direction: column; align-items: center; gap: .6rem;
            padding: 1rem;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,.1);
        }
        .ls-tier-connector {
            width: 2px; height: 15px;
            background: rgba(255,255,255,.1);
            margin: 0 auto;
        }
```

Find and replace `.ls-tier-label` at lines 521-530:
```css
        .ls-tier-label {
            font-family: var(--f-head);
            font-size: .95rem;
            letter-spacing: .18em;
        }
        .ls-tier-label.easy   { color: #d4873f; }
        .ls-tier-label.medium { color: #b07baa; }
        .ls-tier-label.hard   { color: #6ba3a0; }
        .ls-tier-label.expert { color: #c96b4f; }
        .ls-tier-label.master { color: #c9a84c; }
```

Replace with:
```css
        .ls-tier-label {
            font-family: 'Fredoka', sans-serif;
            font-size: .7rem;
            font-weight: 700;
            letter-spacing: .15em;
            text-transform: uppercase;
            text-align: center;
        }
        .ls-tier-label.easy   { color: #d4873f; }
        .ls-tier-label.medium { color: #b07baa; }
        .ls-tier-label.hard   { color: #6ba3a0; }
        .ls-tier-label.expert { color: #c96b4f; }
        .ls-tier-label.master { color: #c9a84c; }
        .ls-tier.easy   { background: rgba(212,135,63,.08); border-color: rgba(212,135,63,.2); }
        .ls-tier.medium { background: rgba(176,123,170,.08); border-color: rgba(176,123,170,.2); }
        .ls-tier.hard   { background: rgba(107,163,160,.08); border-color: rgba(107,163,160,.2); }
        .ls-tier.expert { background: rgba(201,107,79,.08); border-color: rgba(201,107,79,.2); }
        .ls-tier.master { background: rgba(201,168,76,.08); border-color: rgba(201,168,76,.2); }
        .ls-tier.tier-locked { opacity: .5; }
```

Find and replace `.ls-grid` at lines 631-635:
```css
        .ls-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: .6rem;
        }
```

Replace with:
```css
        .ls-grid {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: .6rem;
        }
```

Find and replace `.ls-card` block at lines 637-657:
```css
        .ls-card {
            aspect-ratio: 1;
            border-radius: 12px;
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.12);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 2px;
            cursor: pointer;
            transition: background .15s, transform .1s;
            font-family: var(--f-mono);
            color: var(--text);
        }
        .ls-card:hover:not(:disabled) { background: rgba(255,255,255,.13); transform: scale(1.04); }
        .ls-card:active:not(:disabled){ transform: scale(.96); }
        .ls-card.solved  { border-color: rgba(247,201,72,.38); }
        .ls-card.locked  { opacity: .35; cursor: default; }
        .ls-card.current { border-color: rgba(255,255,255,.45); }

        .ls-num   { font-size: .95rem; font-weight: 500; line-height: 1; }
        .ls-stars { font-size: .65rem; letter-spacing: 1px; line-height: 1; }
```

Replace with:
```css
        .ls-card {
            width: 48px; height: 48px;
            border-radius: 50%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 1px;
            cursor: pointer;
            transition: transform .15s, box-shadow .15s;
            font-family: 'Fredoka', sans-serif;
            border: none;
        }
        .ls-card:hover:not(:disabled) { transform: scale(1.1); }
        .ls-card:active:not(:disabled){ transform: scale(.93); }

        .ls-card.solved {
            background: linear-gradient(135deg, #FFD700, #FF8C00);
            box-shadow: 0 3px 0 #B8860B, 0 0 15px rgba(255,200,0,.2);
            color: #4a2000;
        }
        .ls-card.locked {
            background: rgba(255,255,255,.05);
            border: 2px solid rgba(255,255,255,.1);
            cursor: default;
            color: rgba(255,255,255,.2);
        }
        .ls-card.current {
            background: linear-gradient(135deg, #8B5CF6, #6D28D9);
            box-shadow: 0 3px 0 #4C1D95, 0 0 20px rgba(139,92,246,.3);
            color: #fff;
            animation: nodeGlow 2s infinite alternate;
        }
        /* Unlocked but not solved or current */
        .ls-card:not(.solved):not(.locked):not(.current) {
            background: rgba(255,255,255,.08);
            border: 2px solid rgba(255,255,255,.2);
            color: rgba(255,255,255,.7);
        }

        @keyframes nodeGlow {
            from { transform: scale(1); }
            to { transform: scale(1.08); }
        }

        .ls-num   { font-size: .8rem; font-weight: 800; line-height: 1; }
        .ls-stars { font-size: .4rem; letter-spacing: 0; line-height: 1; }
```

- [ ] **Step 2: Rewrite `buildLevelSelect()` in `js/main.js`**

Find lines 742-794 (the entire `buildLevelSelect` function) and replace with:

```javascript
function buildLevelSelect() {
  const progress    = loadProgress();
  const maxUnlocked = maxUnlockedLevel();
  const showUpTo    = maxUnlocked + 3;
  const container   = document.getElementById('lsTiers');
  container.innerHTML = '';

  TIER_DEFS.forEach((tier, idx) => {
    const tierEnd = Math.min(tier.maxLevel, showUpTo);
    if (tier.minLevel > showUpTo) return;

    // Connector between tiers (not before first)
    if (idx > 0 && tier.minLevel <= showUpTo) {
      const conn = document.createElement('div');
      conn.className = 'ls-tier-connector';
      container.appendChild(conn);
    }

    const tierKey   = tier.name.toLowerCase();
    const tierLocked = tier.minLevel > maxUnlocked;

    const section = document.createElement('div');
    section.className = 'ls-tier ' + tierKey + (tierLocked ? ' tier-locked' : '');

    const label = document.createElement('div');
    label.className = 'ls-tier-label ' + tierKey;
    label.textContent = tier.name + (tierLocked ? ' \uD83D\uDD12' : '');
    section.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'ls-grid';

    for (let n = tier.minLevel; n <= tierEnd; n++) {
      const stars    = progress[n] || 0;
      const unlocked = n <= maxUnlocked;
      const btn      = document.createElement('button');

      btn.className = 'ls-card' +
        (stars > 0  ? ' solved'  : '') +
        (!unlocked  ? ' locked'  : '') +
        (n === LEVEL.current ? ' current' : '');
      btn.disabled      = !unlocked;
      btn.dataset.level = n;

      if (unlocked) {
        btn.innerHTML =
          '<span class="ls-num">' + (isTimedLevel(n) ? '\u26A1' : '') + n + (n === dailyLevelNum() ? ' \uD83D\uDCC5' : '') + '</span>' +
          (stars > 0 ? '<span class="ls-stars">' + '\u2B50'.repeat(stars) + '</span>' : '');
        btn.addEventListener('click', () => {
          closeLevelSelect();
          generateLevel(n);
        });
      } else {
        btn.innerHTML = '<span class="ls-num">\uD83D\uDD12</span>';
      }

      grid.appendChild(btn);
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}
```

- [ ] **Step 3: Test manually**

Open browser, navigate to level select. Verify:
- Each tier is a colored card (Easy=gold border, Medium=purple, etc.)
- Level nodes are round (48px circles)
- Solved: Gold gradient with 3D shadow
- Current: Purple gradient with pulsing glow
- Locked: Faint circle with lock icon
- Connectors between tier cards

- [ ] **Step 4: Commit**

```bash
git add index.html js/main.js
git commit -m "feat(menu): tier-section level path with round nodes"
```

---

### Task 3: Overlay screens — premium card styling

**Files:**
- Modify: `index.html:589-603` (CSS for `.stats-card`, `.stats-title`)

- [ ] **Step 1: Replace `.stats-card` and `.stats-title` CSS**

Find lines 589-603:
```css
        .stats-card {
            background: rgba(75,50,30,.90);
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 24px;
            padding: 2rem 2.5rem;
            max-width: 360px;
            width: 90%;
            text-align: center;
        }
        .stats-title {
            font-family: var(--f-head);
            font-size: 1.3rem;
            color: #fff;
            letter-spacing: 3px;
            margin: 0 0 1.2rem;
        }
```

Replace with:
```css
        .stats-card {
            background: linear-gradient(135deg, rgba(80,45,25,.95), rgba(60,35,20,.95));
            border: 1px solid rgba(255,215,0,.15);
            border-radius: 24px;
            padding: 2rem 2.5rem;
            max-width: 360px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,.5);
        }
        .stats-title {
            font-family: 'Fredoka', sans-serif;
            font-size: 1.3rem;
            letter-spacing: 3px;
            margin: 0 0 1.2rem;
            background: linear-gradient(180deg, #FFD700, #d4873f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
```

- [ ] **Step 2: Test manually**

Open Settings, Stats, Album, Cat-Detail — all should now have:
- Gradient background with gold-shimmer border
- Drop shadow for depth
- Gold gradient title text

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(menu): premium gradient cards with gold titles for overlays"
```

---

### Task 4: Win buttons and overlay buttons — 3D style

**Files:**
- Modify: `index.html:449-472` (CSS for `.win-btn`)
- Modify: `index.html:248-261` (CSS for `.blitz-btn`)

- [ ] **Step 1: Replace `.win-btn` CSS**

Find lines 449-472:
```css
        .win-btn {
            font-family: var(--f-mono);
            font-size: .78rem;
            letter-spacing: .15em;
            text-transform: uppercase;
            padding: .65rem 1.8rem;
            background: rgba(212,135,63,.12);
            border: 1px solid rgba(212,135,63,.38);
            border-radius: 100px;
            color: var(--gold);
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }
        .win-btn:hover { background: rgba(212,135,63,.22); border-color: rgba(212,135,63,.55); }
        .win-btn--secondary {
            background: rgba(255,255,255,.06);
            border-color: rgba(255,255,255,.15);
            color: var(--muted);
        }
        .win-btn--secondary:hover {
            background: rgba(255,255,255,.12);
            border-color: rgba(255,255,255,.30);
            color: var(--text);
        }
```

Replace with:
```css
        .win-btn {
            font-family: 'Fredoka', sans-serif;
            font-size: .85rem;
            font-weight: 700;
            letter-spacing: .15em;
            text-transform: uppercase;
            padding: .7rem 2rem;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
            border: none;
            border-radius: 100px;
            color: #4a2000;
            cursor: pointer;
            box-shadow: 0 4px 0 #B8860B, 0 6px 15px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3);
            transition: transform .1s, box-shadow .1s;
        }
        .win-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #B8860B, 0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
        .win-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #B8860B, 0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
        .win-btn--secondary {
            background: rgba(255,255,255,.08);
            border: 1px solid rgba(255,215,0,.25);
            color: rgba(255,255,255,.7);
            box-shadow: none;
        }
        .win-btn--secondary:hover {
            background: rgba(255,255,255,.14);
            border-color: rgba(255,215,0,.4);
            transform: none;
        }
        .win-btn--secondary:active { transform: scale(.97); }
```

- [ ] **Step 2: Replace `.blitz-btn` CSS**

Find lines 248-261:
```css
        .blitz-btn {
            font-family: var(--f-head);
            font-size: 1.1rem;
            letter-spacing: 3px;
            color: #fff;
            background: rgba(255,255,255,.12);
            border: 1px solid rgba(255,255,255,.30);
            border-radius: 12px;
            padding: .7rem 2.2rem;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .blitz-btn:hover  { background: rgba(255,255,255,.22); }
        .blitz-btn:active { transform: scale(.95); }
```

Replace with:
```css
        .blitz-btn {
            font-family: 'Fredoka', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 3px;
            color: #4a2000;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
            border: none;
            border-radius: 14px;
            padding: .75rem 2.2rem;
            cursor: pointer;
            box-shadow: 0 4px 0 #B8860B, 0 6px 15px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3);
            transition: transform .1s, box-shadow .1s;
        }
        .blitz-btn:hover  { transform: translateY(-1px); box-shadow: 0 5px 0 #B8860B, 0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
        .blitz-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 #B8860B, 0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3); }
```

- [ ] **Step 3: Upgrade win title and blitz title**

Find the `.win-title` rule (line ~407):
```css
        .win-title {
            font-family: var(--f-head);
            font-size: 3rem;
            background: linear-gradient(130deg, #d4873f, #c96b4f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: pulse 1.2s ease-in-out infinite alternate;
        }
```

Replace with:
```css
        .win-title {
            font-family: 'Fredoka', sans-serif;
            font-size: 3rem;
            background: linear-gradient(180deg, #FFD700, #d4873f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            filter: drop-shadow(0 0 20px rgba(255,200,0,.3));
            animation: pulse 1.2s ease-in-out infinite alternate;
        }
```

Find the `.win-stars` rule (line ~417):
```css
        .win-stars {
            font-size: 1.6rem;
            letter-spacing: .1em;
            line-height: 1;
        }
```

Replace with:
```css
        .win-stars {
            font-size: 1.6rem;
            letter-spacing: .1em;
            line-height: 1;
            filter: drop-shadow(0 0 8px rgba(255,200,0,.4));
        }
```

Find the `.win-icon` rule (line ~403):
```css
        .win-icon { font-size: 2.8rem; line-height: 1; }
```

Replace with:
```css
        .win-icon { font-size: 3.2rem; line-height: 1; }
```

Find the `.blitz-title` rule (line ~220):
```css
        .blitz-title {
            font-family: var(--f-head);
            font-size: 2rem;
            color: #fff;
            margin: 0 0 .6rem;
            animation: blitz-flicker .4s ease-out;
        }
```

Replace with:
```css
        .blitz-title {
            font-family: 'Fredoka', sans-serif;
            font-size: 2rem;
            margin: 0 0 .6rem;
            background: linear-gradient(180deg, #FFD700, #d4873f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: blitz-flicker .4s ease-out;
        }
```

- [ ] **Step 4: Test manually**

- Complete a level → win screen: gold 3D buttons, stronger gold glow on title, star glow, bigger icon
- Start Tages-Challenge or Endlos-Modus → blitz overlay: gold 3D "BEREIT" button, gold gradient title

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(menu): 3D gold buttons and gold titles for win/blitz screens"
```

---

### Task 5: Settings, Stats, Album, Streak detail styling

**Files:**
- Modify: `index.html` — multiple CSS blocks for settings, stats, album, streak

- [ ] **Step 1: Upgrade settings CSS**

Find the settings CSS (lines ~659-682).

Replace `.settings-label`:
```css
        .settings-label { color: rgba(255,255,255,.7); font-size: .85rem; }
```
With:
```css
        .settings-label { color: rgba(255,255,255,.8); font-size: .85rem; font-weight: 500; }
```

Replace `.settings-slider` webkit thumb:
```css
        .settings-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px; height: 16px; border-radius: 50%;
            background: var(--gold); cursor: pointer;
        }
```
With:
```css
        .settings-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px; height: 18px; border-radius: 50%;
            background: linear-gradient(135deg, #FFD700, #FF8C00);
            box-shadow: 0 2px 4px rgba(0,0,0,.3);
            cursor: pointer;
        }
```

Replace `.settings-slider` background:
```css
            background: rgba(255,255,255,.2); border-radius: 2px; outline: none;
```
With:
```css
            background: rgba(255,215,0,.15); border-radius: 2px; outline: none;
```

- [ ] **Step 2: Upgrade stats CSS**

Replace `.stats-value` (line ~613):
```css
        .stats-value { color: #fff; font-size: .85rem; font-weight: 600; text-align: right; }
```
With:
```css
        .stats-value { color: var(--gold); font-size: .85rem; font-weight: 600; text-align: right; }
```

Replace `.ach-icon` (lines ~628-629):
```css
        .ach-icon         { font-size: 1.4rem; opacity: .2; cursor: default; }
        .ach-icon.unlocked { opacity: 1; }
```
With:
```css
        .ach-icon         { font-size: 1.4rem; opacity: .2; cursor: default; transition: opacity .2s; }
        .ach-icon.unlocked { opacity: 1; filter: drop-shadow(0 0 6px rgba(255,215,0,.3)); }
```

- [ ] **Step 3: Upgrade album CSS**

Replace `.album-cell` (lines ~699-713). Find:
```css
        .album-cell {
            aspect-ratio: 1; border-radius: 10px;
            background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.10);
```
Replace just the border line with:
```css
            background: rgba(255,255,255,.06); border: 1px solid rgba(255,215,0,.12);
```

Replace `.album-cell.locked` opacity:
```css
        .album-cell.locked { opacity: .3; cursor: default; font-size: 1rem; }
```
With:
```css
        .album-cell.locked { opacity: .25; cursor: default; font-size: 1rem; }
```

Replace `.mascot-btn` (lines ~715-738). Find:
```css
        .mascot-btn {
            display: block;
            margin: .8rem auto .4rem;
            padding: .5rem 1.2rem;
            background: rgba(255,200,50,.2);
            border: 1px solid rgba(255,200,50,.5);
            border-radius: 12px;
            color: #FFD54F;
            font-family: 'Fredoka', sans-serif;
            font-size: .9rem;
            font-weight: 600;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .mascot-btn:hover {
            background: rgba(255,200,50,.35);
            transform: scale(1.03);
        }
```
Replace with:
```css
        .mascot-btn {
            display: block;
            margin: .8rem auto .4rem;
            padding: .55rem 1.4rem;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
            border: none;
            border-radius: 100px;
            color: #4a2000;
            font-family: 'Fredoka', sans-serif;
            font-size: .9rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 3px 0 #B8860B, 0 5px 12px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.3);
            transition: transform .1s, box-shadow .1s;
        }
        .mascot-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 0 #B8860B, 0 7px 15px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.3);
        }
```

- [ ] **Step 4: Upgrade streak CSS**

Replace `.streak-info` (line ~747):
```css
        .streak-info { font-size: 1rem; color: var(--gold); margin: -.3rem 0 1rem; }
```
With:
```css
        .streak-info {
            font-size: 1.2rem; margin: -.3rem 0 1rem;
            background: linear-gradient(180deg, #FFD700, #d4873f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
        }
```

Replace `.streak-day.played` and `.streak-day.today` (lines ~755-756):
```css
        .streak-day.played { background: rgba(212,135,63,.25); color: var(--gold); }
        .streak-day.today { border: 1px solid var(--gold); color: var(--gold); }
```
With:
```css
        .streak-day.played { background: linear-gradient(135deg, rgba(255,215,0,.2), rgba(255,140,0,.2)); color: var(--gold); }
        .streak-day.today { border: 1px solid var(--gold); color: var(--gold); box-shadow: 0 0 8px rgba(255,215,0,.3); }
```

- [ ] **Step 5: Test manually**

- Open Settings → gold slider thumbs, gold track
- Open Stats → gold values, glowing achievement icons
- Open Album → gold borders, 3D mascot button
- Open Streak → gold gradient streak text, glowing today cell

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(menu): premium styling for settings, stats, album, streak screens"
```

---

### Task 6: HUD, tutorial bubble, and premium banner

**Files:**
- Modify: `index.html` — CSS for `.hud-btn`, `.tut-bubble`, `.premium-banner`

- [ ] **Step 1: Upgrade HUD buttons**

Find `.hud-btn` (lines ~102-115):
```css
        .hud-btn {
            width: 38px; height: 38px;
            border-radius: 50%;
            background: rgba(160,120,80,.12);
            border: 1px solid rgba(160,120,80,.20);
            color: var(--text);
            font-size: 1rem;
            line-height: 1;
            cursor: pointer;
            transition: background .15s, border-color .15s, transform .1s, opacity .2s;
        }
        .hud-btn:hover         { background: rgba(160,120,80,.22); border-color: rgba(160,120,80,.35); }
        .hud-btn:active        { transform: scale(.92); }
```

Replace with:
```css
        .hud-btn {
            width: 38px; height: 38px;
            border-radius: 50%;
            background: rgba(160,120,80,.15);
            border: 1px solid rgba(160,120,80,.25);
            color: var(--text);
            font-size: 1rem;
            line-height: 1;
            cursor: pointer;
            box-shadow: 0 2px 0 rgba(0,0,0,.2);
            transition: background .15s, border-color .15s, transform .1s, box-shadow .1s, opacity .2s;
        }
        .hud-btn:hover         { background: rgba(160,120,80,.25); border-color: rgba(160,120,80,.4); }
        .hud-btn:active        { transform: translateY(1px); box-shadow: 0 1px 0 rgba(0,0,0,.2); }
```

Find `.hud-level` (search for it — should show the level name). Find the rule and add gold gradient text. If it looks like:
```css
        .hud-level { ... color: var(--gold); ... }
```

Replace `color: var(--gold)` with:
```css
            background: linear-gradient(180deg, #FFD700, #d4873f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
```

- [ ] **Step 2: Upgrade tutorial bubble**

Find `.tut-bubble` (lines ~284-305):
```css
            background: rgba(60,40,25,.92);
            border: 1px solid rgba(255,255,255,.18);
```

Replace with:
```css
            background: linear-gradient(135deg, rgba(80,45,25,.95), rgba(60,35,20,.95));
            border: 1px solid rgba(255,215,0,.2);
```

Find `.tut-skip` (lines ~307-315):
```css
            color: rgba(255,255,255,.45);
```

Replace with:
```css
            color: rgba(255,215,0,.6);
```

- [ ] **Step 3: Upgrade premium banner**

Find `.premium-banner` (lines ~759-768):
```css
            border-top: 1px solid rgba(212,135,63,.25);
```

Replace with:
```css
            border-top: 1px solid rgba(255,215,0,.3);
            box-shadow: 0 -4px 20px rgba(0,0,0,.3);
```

Find `.premium-btn` (lines ~770-776):
```css
        .premium-btn {
            font-family: var(--f-head); font-size: .7rem;
            padding: .3rem .8rem;
            background: rgba(212,135,63,.20);
            border: 1px solid rgba(212,135,63,.50);
            border-radius: 8px; color: var(--gold); cursor: pointer;
        }
        .premium-btn:hover { background: rgba(212,135,63,.35); }
```

Replace with:
```css
        .premium-btn {
            font-family: 'Fredoka', sans-serif; font-size: .7rem; font-weight: 600;
            padding: .35rem .9rem;
            background: linear-gradient(135deg, #FFD700, #FF8C00);
            border: none;
            border-radius: 100px; color: #4a2000; cursor: pointer;
            box-shadow: 0 2px 0 #B8860B, 0 3px 8px rgba(0,0,0,.3);
            transition: transform .1s, box-shadow .1s;
        }
        .premium-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 0 #B8860B, 0 5px 12px rgba(0,0,0,.3); }
        .premium-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #B8860B; }
```

- [ ] **Step 4: Test manually**

- Play a level → HUD buttons have subtle 3D shadow, press down on click
- Level name has gold gradient text
- Tutorial bubble has gold border and gradient background
- Premium banner has 3D gold button

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(menu): premium HUD, tutorial bubble, and premium banner styling"
```

---

### Task 7: Final polish and visual verification

**Files:**
- Modify: `index.html` (if any fixes needed)

- [ ] **Step 1: Add `prefers-reduced-motion` respect for nodeGlow animation**

Find the `@keyframes nodeGlow` that was added in Task 2 and add after it:

```css
        @media (prefers-reduced-motion: reduce) {
            .ls-card.current { animation: none; }
        }
```

- [ ] **Step 2: Full end-to-end visual test**

Open the game and verify every screen:
1. **Level Select** → 3D gold/purple primary buttons, 2x2 secondary grid, tier-section nodes
2. **Settings** → Gold slider, gradient card
3. **Stats** → Gold values, glowing achievements
4. **Album** → Gold borders, 3D mascot button
5. **Streak** → Gold gradient text, glowing today
6. **Tages-Challenge** → Gold BEREIT button, gold title
7. **Endlos-Modus** → Same premium overlay
8. **Play a level** → 3D HUD buttons, gold level text
9. **Complete a level** → 3D gold win buttons, gold glow title
10. **Tutorial** → Gold border bubble, gold skip text
11. **Premium banner** → 3D gold button

- [ ] **Step 3: Commit if any fixes were made**

```bash
git add index.html
git commit -m "fix(menu): reduced-motion support and visual polish"
```
