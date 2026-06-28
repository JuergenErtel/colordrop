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

// ── Eis-Mechanik: eingefrorene Knäuel werden respektiert ───────────────────

test('applyPawTrick lehnt ab, wenn das oberste Knäuel von from eingefroren ist', () => {
  const tubes = [['rot', 'blau'], ['gruen']];
  // Position (0,1) — oberstes Knäuel von Röhre 0 — ist eingefroren.
  const isFrozen = (ti, bi) => ti === 0 && bi === 1;
  assert.equal(applyPawTrick(tubes, 0, 1, isFrozen), null);
  // Ohne frozen-Callback wie bisher (Zug klappt).
  const ok = applyPawTrick(tubes, 0, 1);
  assert.deepEqual(ok[1], ['gruen', 'blau']);
  // Callback der für diese Position false liefert → unverändertes Verhalten.
  const ok2 = applyPawTrick(tubes, 0, 1, () => false);
  assert.deepEqual(ok2[1], ['gruen', 'blau']);
});

test('applyMagnet stoppt vor einem eingefrorenen Knäuel und lässt es liegen', () => {
  // Röhre 1: ['rot','rot'] — das untere rot (Position (1,0)) ist eingefroren.
  const tubes = [['rot'], ['rot', 'rot']];
  const isFrozen = (ti, bi) => ti === 1 && bi === 0;
  const next = applyMagnet(tubes, 'rot', 0, isFrozen);
  // Oberes rot von Röhre 1 wird gezogen, das eingefrorene untere bleibt.
  assert.equal(next[0].filter(c => c === 'rot').length, 2);
  assert.deepEqual(next[1], ['rot']);
  // Ohne Callback würden beide gezogen.
  const free = applyMagnet(tubes, 'rot', 0);
  assert.deepEqual(free[1], []);
});

test('applyMagnet zieht nichts, wenn das oberste Knäuel selbst eingefroren ist', () => {
  const tubes = [['rot'], ['rot']];
  const isFrozen = (ti, bi) => ti === 1 && bi === 0; // einziges (= oberstes) Knäuel
  const next = applyMagnet(tubes, 'rot', 0, isFrozen);
  assert.deepEqual(next[1], ['rot']); // bleibt liegen
  assert.deepEqual(next[0], ['rot']);
});

// ── Task 2: Joker-Lösbarkeit + Magnet-No-Op ────────────────────────────────

test('isSolvable mit nicht-committetem Joker entfernt Überschussball und bleibt lösbar', () => {
  // Brett mit Joker + Überschuss: ['a','a','a'] | ['a'] | ['joker'] | [] —
  // jokerUsed=false signalisiert dem Solver, dass der Joker noch nicht committet
  // ist und das Brett real einen Ball zu viel hat. isSolvable muss den Überschuss
  // konservativ entfernen und dann trotzdem lösbar zurückgeben.
  const tubes = [['a','a','a'], ['a'], ['joker'], []];
  assert.ok(isSolvable(tubes, false) >= 0, 'mit jokerUsed=false muss lösbar sein');
});

test('applyMagnet ist No-Op, wenn keine andere Röhre die Farbe oben hat', () => {
  // 'rot' liegt oben in Röhre 0, aber keine andere Röhre hat 'rot' oben.
  // applyMagnet soll identisches Brett zurückgeben (tiefengleiche Kopie).
  const tubes = [['rot'], ['blau','blau'], []];
  const next = applyMagnet(tubes, 'rot', 0);
  assert.deepEqual(next, tubes); // nichts gezogen → identisch
});
