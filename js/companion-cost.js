'use strict';

// Begleiter-Fähigkeiten sind ein reines Gameplay-Feature: genau 1 Gratis-Einsatz
// pro Level für alle Spieler (kein Fischgräten-Abzug). Das Balancing erfolgt über
// den Sterne-Deckel (siehe showWin), nicht über Kosten.
// Liefert true, wenn in diesem Level noch ein Einsatz frei ist.
export function companionFree(usedThisLevel) {
  return !usedThisLevel;
}
