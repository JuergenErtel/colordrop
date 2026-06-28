'use strict';

// Reine Zustandslogik für Begleiter-Fähigkeiten. DOM-frei und ohne Ökonomie-/
// Storage-Import, damit alles in Node unit-testbar bleibt. Die Verdrahtung mit
// Fischgräten und UI passiert in main.js.

import { CAPACITY } from './engine.js';

function clone(tubes) { return tubes.map(t => [...t]); }

// 🧺 Nickerchen-Korb: eine zusätzliche leere Röhre. Mehr Platz kann ein Level
// niemals unlösbar machen (beweisbar sicher).
export function applyNapBasket(tubes) {
  return [...clone(tubes), []];
}

// 🐾 Pfoten-Trick: verschiebt das oberste Knäuel von `from` nach `to` und
// ignoriert dabei die Farbregel. Gibt null zurück, wenn der Zug unmöglich ist.
export function applyPawTrick(tubes, from, to) {
  if (from === to) return null;
  if (!tubes[from] || tubes[from].length === 0) return null;
  if (!tubes[to] || tubes[to].length >= CAPACITY) return null;
  const next = clone(tubes);
  next[to].push(next[from].pop());
  return next;
}

// Gültige Ziele für den Pfoten-Trick: nicht-volle Röhren ungleich `from`.
export function pawTrickTargets(tubes, from) {
  const out = [];
  for (let i = 0; i < tubes.length; i++) {
    if (i === from) continue;
    if (tubes[i].length < CAPACITY) out.push(i);
  }
  return out;
}

// 🧲 Magnet-Schnurren: zieht aus allen anderen Röhren die zusammenhängende
// gleichfarbige Top-Gruppe der gewählten Farbe in `targetIdx`, soweit die
// Kapazität reicht. Überschuss bleibt liegen.
export function applyMagnet(tubes, color, targetIdx) {
  const next = clone(tubes);
  const target = next[targetIdx];
  for (let i = 0; i < next.length; i++) {
    if (i === targetIdx) continue;
    const src = next[i];
    while (
      target.length < CAPACITY &&
      src.length > 0 &&
      src[src.length - 1] === color
    ) {
      target.push(src.pop());
    }
  }
  return next;
}
