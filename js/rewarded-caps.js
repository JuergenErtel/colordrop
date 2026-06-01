'use strict';

// Reine Cap/Cooldown-Buchhaltung. Keine Browser-Imports → Node-testbar.
// state shape: { date: 'YYYY-MM-DD', counts: {surface:n}, lastView: {surface:ts} }

export function emptyState(today) {
  return { date: today, counts: {}, lastView: {} };
}

export function resetIfNewDay(state, today) {
  if (!state || state.date !== today) return emptyState(today);
  return state;
}

export function canClaim(state, surface, now, limits) {
  const lim = limits[surface];
  if (!lim) return { ok: false, reason: 'unavailable' };

  const used = (state.counts && state.counts[surface]) || 0;
  const remaining = Math.max(0, lim.daily - used);
  if (remaining <= 0) return { ok: false, reason: 'capped', remaining: 0 };

  const last = (state.lastView && state.lastView[surface]) || 0;
  const elapsed = now - last;
  if (last && elapsed < lim.cooldownMs) {
    return { ok: false, reason: 'cooldown', remaining, msUntil: lim.cooldownMs - elapsed };
  }
  return { ok: true, remaining };
}

export function recordClaim(state, surface, now) {
  const counts   = { ...(state.counts || {}) };
  const lastView = { ...(state.lastView || {}) };
  counts[surface]   = (counts[surface] || 0) + 1;
  lastView[surface] = now;
  return { ...state, counts, lastView };
}
