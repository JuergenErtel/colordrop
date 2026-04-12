'use strict';

import { loadSkins, saveSkins, loadBackgrounds, saveBackgrounds } from './storage.js';

// ── Skin definitions ─────────────────────────────────────────────────────
export const SKIN_DEFS = {
  default:  { name: 'Wollkn\u00e4uel', cost: 0,   milestone: null },
  glitter:  { name: 'Glitzer',         cost: 50,  milestone: 150 },
  crystal:  { name: 'Kristall',        cost: 80,  milestone: null },
  gold:     { name: 'Goldfaden',       cost: 100, milestone: 300 },
};

// ── Background definitions ───────────────────────────────────────────────
export const BG_DEFS = {
  cafe:    { name: 'Katzencaf\u00e9',  cost: 0,   milestone: null },
  garden:  { name: 'Garten',           cost: 100, milestone: 50 },
  rooftop: { name: 'Dachterrasse',     cost: 150, milestone: 100 },
  winter:  { name: 'Winterstube',      cost: 200, milestone: 200 },
};

// ── Skin state ───────────────────────────────────────────────────────────
let _activeSkin = 'default';

export function getActiveSkin() { return _activeSkin; }

export function setActiveSkin(id) {
  _activeSkin = id;
  const data = loadSkins();
  data.active = id;
  saveSkins(data);
}

export function ownsSkin(id) {
  return loadSkins().owned.includes(id);
}

export function unlockSkin(id) {
  const data = loadSkins();
  if (!data.owned.includes(id)) {
    data.owned.push(id);
    saveSkins(data);
  }
}

export function initSkins() {
  const data = loadSkins();
  _activeSkin = data.active || 'default';
}

// ── Background helpers ───────────────────────────────────────────────────
export function ownsBg(id) {
  return loadBackgrounds().owned.includes(id);
}

export function unlockBg(id) {
  const data = loadBackgrounds();
  if (!data.owned.includes(id)) {
    data.owned.push(id);
    saveBackgrounds(data);
  }
}

export function getActiveBg() {
  return loadBackgrounds().active;
}

export function setActiveBg(id) {
  const data = loadBackgrounds();
  data.active = id;
  saveBackgrounds(data);
}
