'use strict';

import * as C from './constants.js';
import { migrateIfNeeded, loadProgress } from './storage.js';
import { levelConfig, generateTubes, parForLevel } from './engine.js';
import { ANIM, resetAnim } from './animations.js';
import { spawnParticle } from './particles.js';
import { playSound } from './audio.js';

migrateIfNeeded();
console.log(
  'CatSort modules loaded.',
  'Colors:',  C.COLOR_KEYS.length,
  'Tiers:',   Object.keys(C.THEMES).length,
  'Level 1:', levelConfig(1).tier,
);
