# Color Drop — Level Scaling Design

## Goal

Expand the game from ~25 to ~100 levels by broadening each tier to ~15–20 levels and adding a subtle intra-tier difficulty curve. Existing save data is reset.

## Tier Distribution

| Tier   | Levels | Colors                                       | Empty Tubes | Par Range |
|--------|--------|----------------------------------------------|-------------|-----------|
| EASY   | 1–15   | cyan, magenta                                | 2           | 12 → 10   |
| MEDIUM | 16–30  | cyan, magenta, lime                          | 2           | 18 → 15   |
| HARD   | 31–50  | cyan, magenta, lime, yellow                  | 2           | 24 → 20   |
| EXPERT | 51–75  | cyan, magenta, lime, yellow, orange          | 1           | 30 → 25   |
| MASTER | 76+    | cyan, magenta, lime, yellow, orange, pink    | 1           | 36 → 30   |

## Intra-Tier Difficulty

Each level gets a `difficulty` factor (0.0 at tier start, 1.0 at tier end):

```
difficulty = (n - tierFirst) / (tierLast - tierFirst)
```

For MASTER (open-ended), `tierLast` is capped at `tierFirst + 24` (i.e. 76–100) so difficulty reaches 1.0 at level 100 and stays there.

### Par (move target for 3 stars)

Interpolates between generous and strict:

```
par = round(colors * lerp(6, 5, difficulty))
```

Examples:
- EASY Level 1: `round(2 * 6.0) = 12`
- EASY Level 15: `round(2 * 5.0) = 10`
- HARD Level 31: `round(4 * 6.0) = 24`
- HARD Level 50: `round(4 * 5.0) = 20`

### Shuffle Intensity

Number of full Fisher-Yates passes over the ball array:

```
shuffleRounds = 1 + floor(difficulty * 2)
```

- Difficulty 0.0 → 1 pass (some near-solved arrangements possible)
- Difficulty 0.5 → 2 passes
- Difficulty 1.0 → 3 passes (deeply scrambled, fewer lucky starts)

## Affected Functions

### `levelConfig(n)`

New tier boundaries:

```js
if (n <= 15) return { colors: ['cyan','magenta'],                                    empty: 2, tier: 'EASY'   };
if (n <= 30) return { colors: ['cyan','magenta','lime'],                             empty: 2, tier: 'MEDIUM' };
if (n <= 50) return { colors: ['cyan','magenta','lime','yellow'],                    empty: 2, tier: 'HARD'   };
if (n <= 75) return { colors: ['cyan','magenta','lime','yellow','orange'],           empty: 1, tier: 'EXPERT' };
return           { colors: ['cyan','magenta','lime','yellow','orange','pink'], empty: 1, tier: 'MASTER' };
```

### `parForLevel(n)`

Replace `colors * 5` with difficulty-aware interpolation:

```js
function parForLevel(n) {
    const cfg  = levelConfig(n);
    const d    = tierDifficulty(n);
    return Math.round(cfg.colors.length * (6 - d));
}
```

### New helper: `tierDifficulty(n)`

```js
function tierDifficulty(n) {
    const tiers = [
        { first: 1,  last: 15 },
        { first: 16, last: 30 },
        { first: 31, last: 50 },
        { first: 51, last: 75 },
        { first: 76, last: 100 },
    ];
    const tier = tiers.find(t => n >= t.first && n <= t.last)
              || tiers[tiers.length - 1];
    return Math.min(1, (n - tier.first) / Math.max(1, tier.last - tier.first));
}
```

### `generateLevel(n)` — shuffle rounds

Replace the single Fisher-Yates pass with `shuffleRounds` passes:

```js
const rounds = 1 + Math.floor(tierDifficulty(n) * 2);
for (let r = 0; r < rounds; r++) {
    for (let i = balls.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }
}
```

### `TIER_DEFS`

```js
const TIER_DEFS = [
    { name: 'EASY',   cls: 'easy',   first: 1,  last: 15 },
    { name: 'MEDIUM', cls: 'medium', first: 16, last: 30 },
    { name: 'HARD',   cls: 'hard',   first: 31, last: 50 },
    { name: 'EXPERT', cls: 'expert', first: 51, last: 75 },
    { name: 'MASTER', cls: 'master', first: 76, last: Infinity },
];
```

### `dailyLevelNum()`

Expand range from `% 25` to `% 75` (levels 1–75, MASTER excluded):

```js
return (Math.abs(hash) % 75) + 1;
```

### `checkAchievements()`

Update tier thresholds:

```js
check('tier_medium', ctx.levelNum >= 16);
check('tier_hard',   ctx.levelNum >= 31);
check('tier_expert', ctx.levelNum >= 51);
check('tier_master', ctx.levelNum >= 76);
```

Update level-count achievements (optional — could add `levels_50`, `levels_75`):

```js
check('levels_10',   wonCount >= 10);
check('levels_25',   wonCount >= 25);
```

### localStorage Reset

On load, clear old progress keys so the new level numbering starts fresh:

```js
localStorage.removeItem('colordrop_v1');
localStorage.removeItem('colordrop_stats');
localStorage.removeItem('colordrop_achievements');
localStorage.removeItem('colordrop_daily');
```

This should be a one-time migration. Use a version key (`colordrop_version`) set to `2` to detect whether the reset has already been applied.

## Not Affected

- **Themes** — resolved by tier name, no changes needed
- **Blitz timer** — `isTimedLevel(n % 5 === 0)` and `timerDuration()` scale by tier automatically
- **Hint system** — BFS solver is level-agnostic
- **Tutorial** — uses fixed tubes, unrelated to level config
- **Sound, particles, visuals** — no changes
- **Daily Challenge UI** — overlay logic unchanged, only `dailyLevelNum()` range changes
