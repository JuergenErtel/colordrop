import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATS, checkCatUnlocks } from '../js/cats.js';
import { COMPANION_ABILITIES } from '../js/constants.js';

const ABILITY_IDS = ['nap', 'paw', 'magnet'];

test('jede Katze hat eine gültige Fähigkeit', () => {
  for (const cat of CATS) {
    assert.ok(ABILITY_IDS.includes(cat.ability), `Katze ${cat.id} hat ungültige ability: ${cat.ability}`);
  }
});

test('COMPANION_ABILITIES deckt alle drei ids ab', () => {
  const ids = COMPANION_ABILITIES.map(a => a.id).sort();
  assert.deepEqual(ids, [...ABILITY_IDS].sort());
  for (const a of COMPANION_ABILITIES) {
    assert.ok(a.label && a.emoji && a.desc, `Fähigkeit ${a.id} fehlt label/emoji/desc`);
  }
});

// ── Slow-Drip-Pacing (Begleiter-Katzen nicht am Anfang fluten) ──────────────
test('langsamer Drip: höchstens 3 Katzen in den ersten 25 Leveln', () => {
  // Engagierter Früh-Spieler auf Level 25: alle realistisch bis dahin
  // erreichbaren Achievements, aber noch keine Tages-Serie.
  const reachableByLvl25 = [
    'first_solve', 'paw_print', 'hot_streak', 'star_collector',
    'yarn_ball', 'sharpshooter', 'lightning_paw',
  ];
  const newly = checkCatUnlocks(new Set(), {
    maxLevel: 25,
    achievements: reachableByLvl25,
    streak: 0,
    endlessBest: 0,
    isPremium: false,
  });
  assert.ok(newly.length <= 3, `Zu viele frühe Katzen: ${newly.length} (${newly.join(', ')})`);
});

test('genau ein Starter-Begleiter direkt nach dem ersten Level', () => {
  const newly = checkCatUnlocks(new Set(), {
    maxLevel: 1,
    achievements: ['first_solve'],
    streak: 0,
    endlessBest: 0,
    isPremium: false,
  });
  assert.equal(newly.length, 1, `Erwartet 1 Starter, bekam ${newly.length} (${newly.join(', ')})`);
});

test('keine zwei Level-Katzen teilen denselben Freischalt-Level (kein Doppel-Unlock)', () => {
  const levelValues = CATS
    .filter(c => c.unlock.type === 'level')
    .map(c => c.unlock.value);
  const unique = new Set(levelValues);
  assert.equal(unique.size, levelValues.length, 'Doppelte Level-Schwellen führen zu gleichzeitigen Unlocks');
});

