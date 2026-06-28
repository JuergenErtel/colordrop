'use strict';

// Reine Kosten-Logik für Begleiter-Fähigkeiten (testbar, ohne economy/DOM).
import { COMPANION_COSTS } from './constants.js';

// Liefert die Fischgräten-Kosten für den Einsatz. 0 = gratis (Premium-Freibetrag).
export function companionCost(abilityId, { premium, freeUsedThisLevel }) {
  if (premium && !freeUsedThisLevel) return 0;
  return COMPANION_COSTS[abilityId] ?? 0;
}
