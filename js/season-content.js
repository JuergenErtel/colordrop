'use strict';

/**
 * Season definitions. Keyed by 'YYYY-MM'.
 * Each season: { id, name, theme, startsAt, endsAt, palette, rewards }
 * Rewards array: one entry per tier (1..50), each { free: RewardDef|null, premium: RewardDef|null }
 * RewardDef: { kind, value, label, icon }
 *   kind: 'bones' | 'cat' | 'skin' | 'bg' | 'frame' | 'hint' | 'undo' | 'ad_skip' | 'bundle'
 */

function bones(n)        { return { kind: 'bones',  value: n,  label: n + ' Fischgräten', icon: 'bone' }; }
function cat(id, name)   { return { kind: 'cat',    value: id, label: name,                icon: 'cat' }; }
function skin(id, name)  { return { kind: 'skin',   value: id, label: 'Skin: ' + name,     icon: 'skin' }; }
function bg(id, name)    { return { kind: 'bg',     value: id, label: 'BG: ' + name,       icon: 'bg' }; }
function frame(id, name) { return { kind: 'frame',  value: id, label: 'Rahmen: ' + name,   icon: 'frame' }; }
function hintR()         { return { kind: 'hint',   value: 1,  label: 'Free Hint',          icon: 'hint' }; }
function undoR()         { return { kind: 'undo',   value: 1,  label: 'Free Undo',          icon: 'undo' }; }
function adSkip()        { return { kind: 'ad_skip',value: 1,  label: 'Ad-Skip-Token',      icon: 'adskip' }; }

// ── Kirschblüte (May 2026) — fully specified ───────────────────────────
const KIRSCHBLUETE_REWARDS = Array.from({ length: 50 }, (_, i) => {
  const tier = i + 1;
  const out = { free: null, premium: null };

  // Free track: every 5 tiers
  if (tier ===  5) out.free = bones(10);
  if (tier === 10) out.free = bones(15);
  if (tier === 15) out.free = cat('mochi-sakura', 'Mochi-Sakura');
  if (tier === 20) out.free = bones(20);
  if (tier === 25) out.free = hintR();
  if (tier === 30) out.free = bones(25);
  if (tier === 35) out.free = undoR();
  if (tier === 40) out.free = bones(30);
  if (tier === 45) out.free = adSkip();
  if (tier === 50) out.free = bones(50);

  // Premium track: every tier
  if (tier >= 1 && tier <= 9)   out.premium = bones(10);
  if (tier === 10) out.premium = bg('kirschbluete', 'Kirschblüte');
  if (tier >= 11 && tier <= 19) out.premium = bones(15);
  if (tier === 20) out.premium = skin('sakura', 'Sakura');
  if (tier >= 21 && tier <= 29) out.premium = tier % 3 === 0 ? hintR() : bones(20);
  if (tier === 30) out.premium = cat('sakura', 'Sakura');
  if (tier >= 31 && tier <= 39) out.premium = bones(25);
  if (tier === 40) out.premium = cat('tsubaki', 'Tsubaki');
  if (tier >= 41 && tier <= 49) out.premium = bones(30);
  if (tier === 50) out.premium = {
    kind: 'bundle',
    items: [cat('hoshi', 'Hoshi'), frame('hanami', 'Hanami')],
    label: 'Hoshi + Hanami-Rahmen', icon: 'legendary',
  };

  return out;
});

export const SEASONS = {
  '2026-05': {
    id: 'kirschbluete',
    name: 'Kirschblüte',
    theme: 'Japanischer Frühling — Sakura, Pagoden, sanfte Rosatöne',
    palette: { primary: '#FFB7C5', secondary: '#8E6D8A', accent: '#FFD700', bg: '#2A1822' },
    emoji: '🌸',
    startsAt: '2026-05-01T00:00:00',
    endsAt:   '2026-05-31T23:59:59',
    rewards:  KIRSCHBLUETE_REWARDS,
  },
  '2026-06': {
    id: 'sommer-strand',
    name: 'Sommer-Strand',
    theme: 'Türkis, Sand, Palmen',
    palette: { primary: '#00B8D4', secondary: '#FFD54F', accent: '#FFAB00', bg: '#1A3A4A' },
    emoji: '🏖️',
    startsAt: '2026-06-01T00:00:00',
    endsAt:   '2026-06-30T23:59:59',
    rewards:  KIRSCHBLUETE_REWARDS,
  },
  '2026-07': {
    id: 'sternennacht',
    name: 'Sternennacht',
    theme: 'Dunkelblau, Sterne, Nebel',
    palette: { primary: '#1A237E', secondary: '#9FA8DA', accent: '#FFF59D', bg: '#0D1128' },
    emoji: '✨',
    startsAt: '2026-07-01T00:00:00',
    endsAt:   '2026-07-31T23:59:59',
    rewards:  KIRSCHBLUETE_REWARDS,
  },
};

export function getCurrentSeasonKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getCurrentSeason(now = new Date()) {
  const key = getCurrentSeasonKey(now);
  return SEASONS[key] || null;
}
