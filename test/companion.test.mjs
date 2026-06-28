import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTubes, isSolvable, CAPACITY } from '../js/engine.js';
import {
  applyNapBasket, applyPawTrick, applyMagnet, pawTrickTargets,
} from '../js/companion.js';

test('CAPACITY ist 4', () => {
  assert.equal(CAPACITY, 4);
});

test('applyNapBasket fügt genau eine leere Röhre hinzu, ohne das Original zu mutieren', () => {
  const tubes = [['a', 'b'], ['b', 'a'], []];
  const next = applyNapBasket(tubes);
  assert.equal(next.length, tubes.length + 1);
  assert.deepEqual(next[next.length - 1], []);
  // Original unverändert (reine Funktion)
  assert.equal(tubes.length, 3);
  // Inhalte kopiert, nicht referenziert
  next[0].push('x');
  assert.deepEqual(tubes[0], ['a', 'b']);
});

test('applyNapBasket erhält Lösbarkeit (sicher entscheidbare Fälle)', () => {
  // Nur niedrige Level mit wenigen Farben prüfen: dort terminiert isSolvable
  // sicher unter dem 200k-Limit. Bei höheren Leveln ist -1 zweideutig
  // (unlösbar vs. Limit erreicht), daher hier ausgeschlossen.
  for (let n = 1; n <= 5; n++) {
    const tubes = generateTubes(n);
    if (isSolvable(tubes) < 0) continue;
    assert.ok(
      isSolvable(applyNapBasket(tubes)) >= 0,
      `Nickerchen-Korb machte Level ${n} unlösbar`,
    );
  }
  // Handgemachte lösbare Konfiguration mittlerer Größe
  const ex = [['a', 'b', 'a', 'b'], ['b', 'a', 'b', 'a'], []];
  assert.ok(isSolvable(ex) >= 0);
  assert.ok(isSolvable(applyNapBasket(ex)) >= 0);
});

test('applyPawTrick verschiebt oberstes Knäuel regelwidrig und kopiert', () => {
  const tubes = [['rot', 'blau'], ['gruen']]; // blau dürfte nicht auf gruen
  const next = applyPawTrick(tubes, 0, 1);
  assert.deepEqual(next[0], ['rot']);
  assert.deepEqual(next[1], ['gruen', 'blau']);
  assert.deepEqual(tubes[0], ['rot', 'blau']); // Original unberührt
});

test('applyPawTrick gibt null bei verletzter Vorbedingung', () => {
  assert.equal(applyPawTrick([[], ['a']], 0, 1), null);        // Quelle leer
  assert.equal(applyPawTrick([['a','b','c','d'], ['x','y','z','w']], 1, 0), null); // Ziel voll
  assert.equal(applyPawTrick([['a']], 0, 0), null);            // from === to
});

test('pawTrickTargets liefert nur nicht-volle Röhren ungleich from', () => {
  const tubes = [['a'], ['b','b','b','b'], []];
  assert.deepEqual(pawTrickTargets(tubes, 0), [2]); // 1 ist voll, 0 ist from
});

test('applyMagnet zieht gleichfarbige Top-Gruppen in die Zielröhre', () => {
  // Ziel idx 0 (['rot']). rot liegt oben in Röhre 1 und 2.
  const tubes = [['rot'], ['blau', 'rot'], ['rot', 'rot']];
  const next = applyMagnet(tubes, 'rot', 0);
  // 1×rot aus Röhre1 + 2×rot aus Röhre2 = 3, plus vorhandenes → Kapazität 4 max
  assert.equal(next[0].filter(c => c === 'rot').length, 4);
  assert.deepEqual(next[1], ['blau']);
  // Röhre2 hatte 2 rot; nur soviel wie Kapazität zulässt wurde gezogen
  assert.ok(next[0].length <= CAPACITY);
});

test('applyMagnet respektiert Kapazität und lässt Überschuss liegen', () => {
  const tubes = [['rot', 'rot', 'rot'], ['rot', 'rot']]; // Ziel hat schon 3 rot
  const next = applyMagnet(tubes, 'rot', 0);
  assert.equal(next[0].length, CAPACITY);          // genau bis 4 gefüllt
  assert.equal(next[1].length, 1);                 // 1 rot blieb liegen
});
