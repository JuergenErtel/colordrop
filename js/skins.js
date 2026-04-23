'use strict';

import { loadSkins, saveSkins, loadBackgrounds, saveBackgrounds } from './storage.js';

// ── Skin definitions ─────────────────────────────────────────────────────
export const SKIN_DEFS = {
  default:  { name: 'Wollknäuel', cost: 0,   milestone: null },
  glitter:  { name: 'Glitzer',         cost: 120, milestone: 150 },
  crystal:  { name: 'Kristall',        cost: 200, milestone: null },
  gold:     { name: 'Goldfaden',       cost: 350, milestone: 300 },
};

// ── Background definitions ───────────────────────────────────────────────
export const BG_DEFS = {
  cafe:    { name: 'Katzencafé',  cost: 0,   milestone: null },
  garden:  { name: 'Garten',           cost: 250, milestone: 50 },
  rooftop: { name: 'Dachterrasse',     cost: 450, milestone: 100 },
  winter:  { name: 'Winterstube',      cost: 650, milestone: 200 },
};

// ── Skin state ───────────────────────────────────────────────────────────
let _activeSkin = 'default';

let _skinPreviewOverride = null;
export function setSkinPreviewOverride(id) { _skinPreviewOverride = id; }
export function getActiveSkin() { return _skinPreviewOverride ?? _activeSkin; }

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

