'use strict';

import { loadWeekly, saveWeekly } from './storage.js';
import { generateTubes, levelConfig } from './engine.js';

function getISOWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const WEEKLY_TIERS = ['MEDIUM', 'HARD', 'EXPERT'];
const WEEKLY_FRAMES = ['gold', 'silver', 'bronze', 'diamond'];

export function getWeeklyState() {
  const currentWeek = getISOWeek();
  let state = loadWeekly();
  if (state.week !== currentWeek) {
    state = {
      week: currentWeek,
      completed: [false, false, false],
      frame: WEEKLY_FRAMES[currentWeek % WEEKLY_FRAMES.length],
    };
    saveWeekly(state);
  }
  return state;
}

export function generateWeeklyTubes(round) {
  const tierLevelMap = { MEDIUM: 25, HARD: 60, EXPERT: 120 };
  const fakeLevelNum = tierLevelMap[WEEKLY_TIERS[round]] || 25;
  return generateTubes(fakeLevelNum);
}

export function getWeeklyConfig(round) {
  const tierLevelMap = { MEDIUM: 25, HARD: 60, EXPERT: 120 };
  const fakeLevelNum = tierLevelMap[WEEKLY_TIERS[round]] || 25;
  return { ...levelConfig(fakeLevelNum), tier: WEEKLY_TIERS[round] };
}

export function completeWeeklyRound(round) {
  const state = getWeeklyState();
  state.completed[round] = true;
  saveWeekly(state);
  return state.completed.every(Boolean);
}

export function isWeeklyDone() {
  return getWeeklyState().completed.every(Boolean);
}

export function nextWeeklyRound() {
  const state = getWeeklyState();
  return state.completed.indexOf(false);
}
