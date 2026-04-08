# Cat Sticker Pacing & Mascot System — Design Spec

**Date:** 2026-04-08
**Goal:** Fix two problems: (1) cats unlock too fast early on, killing the collection thrill; (2) no explanation of what cats are for. Additionally, make cats cosmetically useful as selectable mascots.

---

## 1. New Unlock Pacing

Raise early thresholds so the first ~30 levels feel rewarding, not overwhelming. Keep Whisker at Level 1 as the hook, then space out subsequent unlocks.

### Achievement-based cats — new thresholds

| Cat | Achievement | Old Condition | New Condition |
|-----|------------|---------------|---------------|
| Whisker | first_solve | First level solved | **Unchanged** |
| Arrow | sharpshooter | 3★ on any level (`stars === 3`) | 3★ on **3** levels (`threeStarCount >= 3`) |
| Ember | hot_streak | 3 in a row without undo | **5** in a row without undo |
| Tansy | yarn_ball | 3★ on 5 levels | 3★ on **10** levels |
| Pebble | paw_print | 10 levels solved | **20** levels solved |
| Starla | star_collector | 30 total stars | **60** total stars |
| Rex | cat_king | Reach level 25 | Reach level **30** |

### Level-milestone cats — new thresholds

| Cat | Old Level | New Level |
|-----|-----------|-----------|
| Luna | 10 | **20** |
| Mochi | 25 | **40** |
| Felix | 50 | **75** |
| Nala | 75 | **100** |
| Kuro | 100 | **150** |
| Freya | 150 | **200** |
| Sora | 200 | **250** |
| Mika | 250 | **300** |
| Zenith | 300 | **350** |

### Expected early-game pacing

- Level 1: Whisker (hook)
- ~Level 8: Ember (if playing well without undo)
- ~Level 15: Arrow + Tansy (skill-based)
- Level 20: Luna + Pebble (milestone)
- ~Level 20: Starla (60 stars accumulated)

Result: ~3-4 cats by Level 15 instead of the current ~5-7. Each unlock feels earned.

### Files changed

- `js/cats.js` — update `unlock.value` for level-milestone cats
- `js/constants.js` — update achievement descriptions to match new thresholds
- `js/main.js` `checkAchievements()` — update numeric thresholds for `paw_print` (20), `yarn_ball` (threeStarCount >= 10), `star_collector` (totalStars >= 60), `hot_streak` (streak >= 5), `cat_king` (level >= 30), `sharpshooter` (threeStarCount >= 3)

---

## 2. Tutorial Explanation

Add a new final step to `TUTORIAL_SCRIPT` in `js/constants.js` after the existing win step:

```
{
  step: 4,
  heading: 'Katzen sammeln!',
  body: 'Löse Level um Katzen zu entdecken. Jede Katze kannst du als Maskottchen wählen!',
  waitFor: 'dismiss',
}
```

This step appears after the tutorial win, before entering the level select. The `waitFor: 'dismiss'` means the user taps to continue (no game action required).

### Files changed

- `js/constants.js` — add tutorial step
- `js/main.js` — handle `waitFor: 'dismiss'` in tutorial logic (tap anywhere to advance)

---

## 3. First Unlock Hint

When the first-ever cat is unlocked (Whisker after Level 1), add a line below the fun fact in the celebration overlay:

> **"Öffne das Katzen-Album um dein Maskottchen zu wählen!"**

This only appears for the very first cat unlock, not subsequent ones.

### Implementation

In `showCatUnlockToast()` in `js/main.js`, check if the collection was empty before this unlock. If so, show the extra hint text in `#catUnlockFact` or a new element below it.

### Files changed

- `js/main.js` — conditional hint text in `showCatUnlockToast()`
- `index.html` — optional: add a `<p id="catUnlockHint">` element below `#catUnlockFact`
- CSS in `index.html` — style for the hint text (smaller, lighter)

---

## 4. Mascot Selection in Album

### Album Grid

- Currently selected mascot gets a **gold border** (2px solid gold, or `rgba(255,200,50,.8)`) in the album grid.
- Default mascot (before any selection): the standard orange cat (no cat ID, stored as `null` or `'default'`).

### Detail Screen

- Add a button below the fun fact: **"Als Maskottchen wählen"**
- If this cat is already the mascot, button shows **"Dein Maskottchen ✓"** (disabled)
- Clicking the button saves the selection and updates the gold border in the grid

### Storage

- New localStorage key: `catsort-mascot`
- Value: cat ID string (e.g. `'whisker'`) or `'default'` for the standard cat
- New functions in `js/storage.js`: `loadMascot()` and `saveMascot(id)`

### Files changed

- `js/storage.js` — `loadMascot()`, `saveMascot()`
- `js/main.js` — `showCatDetail()` adds mascot button; `buildAlbumScreen()` adds gold border to selected
- `index.html` — add mascot button to `#catDetailOverlay`
- CSS — `.album-cell.mascot` gold border style, mascot button style

---

## 5. Mascot Visible In-Game

### Spielfeld (bottom-right corner)

The mascot cat replaces the current hardcoded orange cat drawn by `drawMascotCat()`.

- On game load and on mascot change, read `loadMascot()` to get the selected cat ID
- If `'default'` or null, draw the standard orange cat (current behavior)
- Otherwise, look up `CAT_PARAMS` for the selected cat and use `drawMascotCat()` with those params
- `drawMascotCat()` in `js/cat-renderer.js` may need to accept color/style params from `CAT_PARAMS`

### Splash Screen

The center cat on the splash screen should reflect the chosen mascot.

- `js/splash.js` `initSplash()` or the splash render function reads `loadMascot()`
- Draws the selected cat portrait instead of the default cat
- Falls back to default orange cat if no mascot selected

### Level Select

Small cat icon next to the Album button or in the header area showing the current mascot. This is a nice-to-have and can be a simple rendered portrait at ~32px.

### Files changed

- `js/cat-renderer.js` — `drawMascotCat()` accepts optional `CAT_PARAMS` entry
- `js/main.js` — pass selected mascot params to render loop
- `js/splash.js` — render selected mascot on splash
- `index.html` — optional: small mascot canvas in level select header

---

## Non-goals

- No gameplay bonuses from cats (purely cosmetic)
- No cat animations or idle behaviors (future consideration)
- No social/sharing features
- Existing cat data in localStorage is not migrated — players keep their unlocked cats, pacing only affects future unlocks
