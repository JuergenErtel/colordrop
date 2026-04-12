'use strict';

import { loadMilestones, saveMilestone, loadBackgrounds, saveBackgrounds } from './storage.js';
import { earn } from './economy.js';
import { unlockSkin } from './skins.js';

export const MILESTONES = [
  { level: 25,  bones: 30,  reward: null,           label: 'Entdecker',  desc: '25 Level geschafft!' },
  { level: 50,  bones: 50,  reward: 'bg_garden',    label: 'G\u00e4rtner',    desc: 'Hintergrund "Garten" freigeschaltet!' },
  { level: 100, bones: 75,  reward: 'bg_rooftop',   label: 'Aufsteiger', desc: 'Hintergrund "Dachterrasse" freigeschaltet!' },
  { level: 150, bones: 100, reward: 'skin_glitter',  label: 'Funkeln',    desc: 'Ball-Skin "Glitzer" freigeschaltet!' },
  { level: 200, bones: 125, reward: 'bg_winter',     label: 'Winterkind', desc: 'Hintergrund "Winterstube" freigeschaltet!' },
  { level: 300, bones: 200, reward: 'skin_gold',     label: 'Legende',    desc: 'Ball-Skin "Gold" freigeschaltet!' },
];

export function checkMilestone(levelNum) {
  const achieved = loadMilestones();
  const ms = MILESTONES.find(m => m.level === levelNum);
  if (!ms || achieved[levelNum]) return null;
  return ms;
}

export function claimMilestone(milestone) {
  earn(milestone.bones);
  saveMilestone(milestone.level);

  if (milestone.reward) {
    if (milestone.reward.startsWith('bg_')) {
      const bgId = milestone.reward.replace('bg_', '');
      const bgs = loadBackgrounds();
      if (!bgs.owned.includes(bgId)) {
        bgs.owned.push(bgId);
        saveBackgrounds(bgs);
      }
    }
    else if (milestone.reward.startsWith('skin_')) {
      const skinId = milestone.reward.replace('skin_', '');
      unlockSkin(skinId);
    }
  }

  return milestone;
}
