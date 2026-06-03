import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTubes, isSolved } from '../js/engine.js';

// Regression: Level 6 (and any level) must never start with a tube
// that is already fully sorted — the Fisher-Yates shuffle could leave
// a monochrome tube and the old accept criterion returned it as-is.
test('no level starts with an already-solved tube', () => {
  for (let n = 1; n <= 300; n++) {
    const tubes = generateTubes(n);
    const preSorted = tubes.filter(t => t.length >= 4 && isSolved(t));
    assert.equal(
      preSorted.length, 0,
      `Level ${n} starts with ${preSorted.length} pre-sorted tube(s): ${JSON.stringify(tubes)}`,
    );
  }
});
