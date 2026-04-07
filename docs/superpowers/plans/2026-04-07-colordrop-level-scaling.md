# Color Drop Level Scaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the game from ~25 to ~100 levels with broader tiers and a subtle intra-tier difficulty curve (stricter par + deeper shuffle).

**Architecture:** All changes in `index.html`. `levelConfig()` gets new tier boundaries, new `tierDifficulty()` helper drives `parForLevel()` and shuffle rounds in `generateLevel()`. `TIER_DEFS`, `dailyLevelNum()`, and `checkAchievements()` updated to match. One-time localStorage reset via version key.

**Tech Stack:** Vanilla JS, no new dependencies.

---

## File Map

| File | Changes |
|------|---------|
| `index.html` JS `levelConfig()` (~line 910) | New tier boundaries (15/30/50/75) |
| `index.html` JS after `levelConfig()` (~line 916) | Add `tierDifficulty()` helper |
| `index.html` JS `parForLevel()` (~line 919) | Difficulty-aware par interpolation |
| `index.html` JS `generateLevel()` (~line 1033) | Multi-round Fisher-Yates shuffle |
| `index.html` JS `dailyLevelNum()` (~line 967) | Range `% 75` instead of `% 25` |
| `index.html` JS `TIER_DEFS` (~line 2170) | New `first/last` values |
| `index.html` JS `checkAchievements()` (~line 2413) | New tier thresholds |
| `index.html` JS BOOTSTRAP (~line 2594) | One-time localStorage reset with version key |

---

## Task 1: localStorage reset + version key

**Files:**
- Modify: `index.html` — BOOTSTRAP block (~line 2592)

- [ ] **Step 1: Add version-based reset before the existing bootstrap code**

Find (~line 2592):
```js
resizeCanvas();                  // size canvas before first paint
```

Insert directly before it:
```js
// ── One-time migration: v2 level scaling resets all progress ──
if (localStorage.getItem('colordrop_version') !== '2') {
    localStorage.removeItem('colordrop_v1');
    localStorage.removeItem('colordrop_stats');
    localStorage.removeItem('colordrop_achievements');
    localStorage.removeItem('colordrop_daily');
    localStorage.removeItem('colordrop_tut_done');
    localStorage.setItem('colordrop_version', '2');
}

```

- [ ] **Step 2: Verify in browser**

Open `index.html`. In DevTools console:
```js
localStorage.getItem('colordrop_version')   // "2"
```
Reload page — tutorial should start (tut_done was cleared). Expected: no errors, game starts fresh.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(scaling): one-time localStorage reset for v2 level scaling"
```

---

## Task 2: `levelConfig()` + `tierDifficulty()` + `parForLevel()`

**Files:**
- Modify: `index.html` — `levelConfig()` (~line 910), `parForLevel()` (~line 919)

- [ ] **Step 1: Replace `levelConfig()` with new tier boundaries**

Find (~line 910):
```js
function levelConfig(n) {
    if (n <=  3) return { colors: ['cyan','magenta'],                                    empty: 2, tier: 'EASY'   };
    if (n <=  8) return { colors: ['cyan','magenta','lime'],                             empty: 2, tier: 'MEDIUM' };
    if (n <= 15) return { colors: ['cyan','magenta','lime','yellow'],                    empty: 2, tier: 'HARD'   };
    if (n <= 25) return { colors: ['cyan','magenta','lime','yellow','orange'],           empty: 1, tier: 'EXPERT' };
    return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 1, tier: 'MASTER' };
}
```

Replace with:
```js
function levelConfig(n) {
    if (n <= 15) return { colors: ['cyan','magenta'],                                    empty: 2, tier: 'EASY'   };
    if (n <= 30) return { colors: ['cyan','magenta','lime'],                             empty: 2, tier: 'MEDIUM' };
    if (n <= 50) return { colors: ['cyan','magenta','lime','yellow'],                    empty: 2, tier: 'HARD'   };
    if (n <= 75) return { colors: ['cyan','magenta','lime','yellow','orange'],           empty: 1, tier: 'EXPERT' };
    return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 1, tier: 'MASTER' };
}
```

- [ ] **Step 2: Add `tierDifficulty()` after `levelConfig()`**

Find the closing `}` of `levelConfig()` (~line 916). Insert directly after it:

```js

/** Intra-tier difficulty factor: 0.0 at tier start, 1.0 at tier end. */
function tierDifficulty(n) {
    const ranges = [
        [1, 15], [16, 30], [31, 50], [51, 75], [76, 100],
    ];
    const r = ranges.find(([lo, hi]) => n >= lo && n <= hi) || ranges[ranges.length - 1];
    return Math.min(1, (n - r[0]) / Math.max(1, r[1] - r[0]));
}
```

- [ ] **Step 3: Replace `parForLevel()` with difficulty-aware version**

Find (~line 919):
```js
/** Par = colours × 5. Scales fairly across all tiers. */
function parForLevel(n) {
    return levelConfig(n).colors.length * 5;
}
```

Replace with:
```js
/** Par interpolates from generous (colors×6) to strict (colors×5) within each tier. */
function parForLevel(n) {
    const colors = levelConfig(n).colors.length;
    const d      = tierDifficulty(n);
    return Math.round(colors * (6 - d));
}
```

- [ ] **Step 4: Verify in browser console**

```js
// EASY tier
parForLevel(1)    // 12  (2 * 6.0)
parForLevel(8)    // 11  (2 * 5.5, rounded)
parForLevel(15)   // 10  (2 * 5.0)

// HARD tier
parForLevel(31)   // 24  (4 * 6.0)
parForLevel(50)   // 20  (4 * 5.0)

// MASTER tier
parForLevel(76)   // 36  (6 * 6.0)
parForLevel(100)  // 30  (6 * 5.0)

// tierDifficulty
tierDifficulty(1)    // 0
tierDifficulty(15)   // 1
tierDifficulty(31)   // 0
tierDifficulty(120)  // 1 (clamped)
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(scaling): new tier boundaries, tierDifficulty(), difficulty-aware parForLevel()"
```

---

## Task 3: Multi-round shuffle in `generateLevel()`

**Files:**
- Modify: `index.html` — `generateLevel()` (~line 1033)

- [ ] **Step 1: Replace the single Fisher-Yates pass with multi-round shuffle**

Find (~line 1029):
```js
        // 1. Flat array of all balls, then Fisher-Yates shuffle.
        //    This guarantees every colour gets mixed — the old game-valid-move approach
        //    could get stuck (e.g. cyan fills both empty tubes in the first 2 moves,
        //    leaving lime/mag unmovable for the rest of the shuffle).
        const balls = cfg.colors.flatMap(c => [c, c, c, c]);
        for (let i = balls.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [balls[i], balls[j]] = [balls[j], balls[i]];
        }
```

Replace with:
```js
        // 1. Flat array of all balls, then Fisher-Yates shuffle.
        //    More rounds at higher intra-tier difficulty = deeper scramble.
        const balls  = cfg.colors.flatMap(c => [c, c, c, c]);
        const rounds = 1 + Math.floor(tierDifficulty(n) * 2);   // 1–3
        for (let r = 0; r < rounds; r++) {
            for (let i = balls.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [balls[i], balls[j]] = [balls[j], balls[i]];
            }
        }
```

- [ ] **Step 2: Verify in browser**

Generate a few levels and check they load without errors:
```js
generateLevel(1);   // EASY — 1 shuffle round
generateLevel(15);  // EASY — 3 shuffle rounds
generateLevel(50);  // HARD — 3 shuffle rounds
generateLevel(76);  // MASTER — 1 shuffle round
generateLevel(100); // MASTER — 3 shuffle rounds
```
Expected: all levels load, tubes are displayed, no console errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(scaling): multi-round Fisher-Yates shuffle based on tierDifficulty"
```

---

## Task 4: `TIER_DEFS` + `dailyLevelNum()` + `checkAchievements()`

**Files:**
- Modify: `index.html` — `dailyLevelNum()` (~line 967), `TIER_DEFS` (~line 2170), `checkAchievements()` (~line 2413)

- [ ] **Step 1: Update `dailyLevelNum()` range**

Find (~line 967):
```js
    return (Math.abs(hash) % 25) + 1;   // Level 1–25 (EASY–EXPERT; MASTER excluded intentionally)
```

Replace with:
```js
    return (Math.abs(hash) % 75) + 1;   // Level 1–75 (EASY–EXPERT; MASTER excluded intentionally)
```

- [ ] **Step 2: Update `TIER_DEFS`**

Find (~line 2170):
```js
const TIER_DEFS = [
    { name: 'EASY',   cls: 'easy',   first: 1,  last: 3  },
    { name: 'MEDIUM', cls: 'medium', first: 4,  last: 8  },
    { name: 'HARD',   cls: 'hard',   first: 9,  last: 15 },
    { name: 'EXPERT', cls: 'expert', first: 16, last: 25 },
    { name: 'MASTER', cls: 'master', first: 26, last: Infinity },
];
```

Replace with:
```js
const TIER_DEFS = [
    { name: 'EASY',   cls: 'easy',   first: 1,  last: 15 },
    { name: 'MEDIUM', cls: 'medium', first: 16, last: 30 },
    { name: 'HARD',   cls: 'hard',   first: 31, last: 50 },
    { name: 'EXPERT', cls: 'expert', first: 51, last: 75 },
    { name: 'MASTER', cls: 'master', first: 76, last: Infinity },
];
```

- [ ] **Step 3: Update `checkAchievements()` tier thresholds**

Find (~line 2413):
```js
    check('tier_medium', ctx.levelNum >= 4);
    check('tier_hard',   ctx.levelNum >= 9);
    check('tier_expert', ctx.levelNum >= 16);
    check('tier_master', ctx.levelNum >= 26);
```

Replace with:
```js
    check('tier_medium', ctx.levelNum >= 16);
    check('tier_hard',   ctx.levelNum >= 31);
    check('tier_expert', ctx.levelNum >= 51);
    check('tier_master', ctx.levelNum >= 76);
```

- [ ] **Step 4: Verify in browser**

```js
// Daily level now in 1–75 range
dailyLevelNum()   // some number 1–75

// TIER_DEFS
TIER_DEFS[0]      // { name: 'EASY', cls: 'easy', first: 1, last: 15 }
TIER_DEFS[4]      // { name: 'MASTER', cls: 'master', first: 76, last: Infinity }

// Open Level Select — should show EASY section with levels 1–15 (or up to unlocked+3)
```

- [ ] **Step 5: Verify achievements in console**

```js
localStorage.removeItem('colordrop_achievements');
checkAchievements({ levelNum: 15, stars: 3, stats: loadStats(), progress: loadProgress(), isDaily: false, isBlitz: false });
// Expected: ["first_win","par_first","three_star"] — no tier_medium (need level >= 16)

checkAchievements({ levelNum: 16, stars: 2, stats: loadStats(), progress: loadProgress(), isDaily: false, isBlitz: false });
// Expected: should include "tier_medium"
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(scaling): update TIER_DEFS, dailyLevelNum range, achievement thresholds"
```

---

## Task 5: Full play-through test

- [ ] **Step 1: Fresh start test**

Clear all data and reload:
```js
localStorage.clear();
location.reload();
```

Expected:
1. Tutorial starts (tut_done was cleared)
2. Skip tutorial → Level Select shows EASY tier with levels 1–4 visible (1 unlocked + 3 preview)
3. Level 1 label shows "LEVEL 1 · EASY"

- [ ] **Step 2: Level progression test**

Play through level 1 (or simulate):
```js
// Quick-win: set tubes to solved state
G.tubes = [['cyan','cyan','cyan','cyan'],['magenta','magenta','magenta','magenta'],[],[]];
G.won = true; G.moves = 10;
showWin();
```

Expected:
- Win overlay shows stars (par for level 1 = 12, so 10 moves = 3 stars)
- Level Select now shows level 2 unlocked
- Still in EASY tier

- [ ] **Step 3: Tier transition test**

```js
// Simulate winning level 15 (last EASY) then check level 16
generateLevel(16);
```

Expected:
- Theme fades from EASY to MEDIUM
- HUD shows "LEVEL 16 · MEDIUM"
- 3 colors visible in tubes

- [ ] **Step 4: Par scaling test**

```js
// Verify par curve makes sense
[1, 8, 15, 16, 30, 31, 50, 51, 75, 76, 100].forEach(n =>
    console.log('Level', n, '→ par', parForLevel(n), '(' + levelConfig(n).tier + ')')
);
```

Expected output:
```
Level 1 → par 12 (EASY)
Level 8 → par 11 (EASY)
Level 15 → par 10 (EASY)
Level 16 → par 18 (MEDIUM)
Level 30 → par 15 (MEDIUM)
Level 31 → par 24 (HARD)
Level 50 → par 20 (HARD)
Level 51 → par 30 (EXPERT)
Level 75 → par 25 (EXPERT)
Level 76 → par 36 (MASTER)
Level 100 → par 30 (MASTER)
```

- [ ] **Step 5: Blitz level test**

```js
generateLevel(5);    // EASY blitz
generateLevel(15);   // EASY blitz (last EASY)
generateLevel(30);   // MEDIUM blitz
```

Expected: all three show Blitz overlay with correct tier and timer duration.

- [ ] **Step 6: Daily Challenge test**

Open Level Select, click "📅 Tages-Challenge".
Expected: daily level is in 1–75 range, plays correctly, no Blitz timer even if level is a multiple of 5.

- [ ] **Step 7: Commit (no code changes — just verification)**

If any issues were found and fixed during testing, commit them:
```bash
git add index.html
git commit -m "fix(scaling): adjustments from play-through testing"
```

---

## Self-Review

### Spec coverage

| Spec section | Task |
|---|---|
| New tier boundaries (15/30/50/75) | Task 2 Step 1 |
| `tierDifficulty()` helper | Task 2 Step 2 |
| Difficulty-aware `parForLevel()` | Task 2 Step 3 |
| Multi-round shuffle | Task 3 |
| `TIER_DEFS` update | Task 4 Step 2 |
| `dailyLevelNum()` range 1–75 | Task 4 Step 1 |
| `checkAchievements()` thresholds | Task 4 Step 3 |
| localStorage reset with version key | Task 1 |

All spec sections covered. ✓

### Placeholder scan

No TBD, TODO, or vague steps. All code complete. ✓

### Type consistency

- `tierDifficulty(n)` returns 0.0–1.0 — used in `parForLevel()` (Task 2) and `generateLevel()` (Task 3). ✓
- `levelConfig(n)` return shape unchanged — all consumers still work. ✓
- `TIER_DEFS` first/last values match `levelConfig()` boundaries. ✓
- `checkAchievements()` thresholds match TIER_DEFS first values. ✓
