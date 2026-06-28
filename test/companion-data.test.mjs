import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATS } from '../js/cats.js';
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

