'use strict';

import { loadSkins, saveSkins } from './storage.js';

export const SKIN_DEFS = {
  default:  { name: 'Wollknäuel', cost: 0 },
  glitter:  { name: 'Glitzer',    cost: 50 },
  crystal:  { name: 'Kristall',   cost: 80 },
  gold:     { name: 'Goldfaden',  cost: 100 },
};

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
