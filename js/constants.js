'use strict';

// ── Canvas & layout constants ─────────────────────────────────────────────
export const CW          = 420;
export const CH          = 520;
export const TUBE_W      = 68;
export const TUBE_H      = 240;
export const TUBE_BOT    = 440;
export const TUBE_TOP    = 200;
export const BALL_R      = 26;
export const BALL_D      = 52;
export const BALL_GAP    = 3;
export const BALL_PAD    = 10;
export const FLOAT_Y_BASE = 118;
export const DUR_LIFT    = 220;
export const DUR_ARC     = 380;
export const DUR_BOUNCE  = 480;
export const MAX_PARTS   = 500;

// ── Cat-café colour palette ───────────────────────────────────────────────
export const PALETTE = {
  coral: {
    base:   '#E8897A',
    bright: '#F5A898',
    dark:   '#C86B5C',
    glow:   'rgba(232,137,122,0.45)',
  },
  lavender: {
    base:   '#B8A0D2',
    bright: '#CDB8E8',
    dark:   '#9A82B4',
    glow:   'rgba(184,160,210,0.45)',
  },
  mint: {
    base:   '#8EC9B0',
    bright: '#A8DEC8',
    dark:   '#6EAB92',
    glow:   'rgba(142,201,176,0.45)',
  },
  honey: {
    base:   '#E8C47A',
    bright: '#F5D898',
    dark:   '#C8A05C',
    glow:   'rgba(232,196,122,0.45)',
  },
  peach: {
    base:   '#F0B090',
    bright: '#F8C8A8',
    dark:   '#D09070',
    glow:   'rgba(240,176,144,0.45)',
  },
  rose: {
    base:   '#E8A0B4',
    bright: '#F5B8CA',
    dark:   '#C88098',
    glow:   'rgba(232,160,180,0.45)',
  },
};

export const COLOR_KEYS = Object.keys(PALETTE);

// ── Difficulty themes ─────────────────────────────────────────────────────
export const THEMES = {
  EASY: {
    hues:           [10, 270, 150, 40, 25, 340],
    hueDelta:       12,
    sat:            35,
    bri:            92,
    containerStyle: 'cardboard',
    ballStyle:      'yarn',
    accentColor:    '#E8897A',
    sceneName:      'Cosy Corner',
  },
  MEDIUM: {
    hues:           [15, 260, 155, 45, 28, 345],
    hueDelta:       18,
    sat:            28,
    bri:            88,
    containerStyle: 'basket',
    ballStyle:      'yarn',
    accentColor:    '#B8A0D2',
    sceneName:      'Yarn Basket',
  },
  HARD: {
    hues:           [20, 250, 160, 50, 30, 350],
    hueDelta:       22,
    sat:            22,
    bri:            84,
    containerStyle: 'cattree',
    ballStyle:      'yarn',
    accentColor:    '#8EC9B0',
    sceneName:      'Cat Tree',
  },
  EXPERT: {
    hues:           [5, 280, 145, 38, 22, 335],
    hueDelta:       28,
    sat:            18,
    bri:            80,
    containerStyle: 'catbed',
    ballStyle:      'yarn',
    accentColor:    '#E8C47A',
    sceneName:      'Cat Bed',
  },
  MASTER: {
    hues:           [0, 290, 140, 35, 18, 330],
    hueDelta:       35,
    sat:            12,
    bri:            76,
    containerStyle: 'golden',
    ballStyle:      'yarn',
    accentColor:    '#F0B090',
    sceneName:      'Golden Paws',
  },
};

// ── Tier definitions ──────────────────────────────────────────────────────
export const TIER_DEFS = [
  { name: 'EASY',   minLevel:  1, maxLevel: 10 },
  { name: 'MEDIUM', minLevel: 11, maxLevel: 25 },
  { name: 'HARD',   minLevel: 26, maxLevel: 45 },
  { name: 'EXPERT', minLevel: 46, maxLevel: 70 },
  { name: 'MASTER', minLevel: 71, maxLevel: 999 },
];

// ── Achievements ──────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: 'first_solve',    icon: '🐱', title: 'First Purr',        desc: 'Solve your first level.' },
  { id: 'cat_nap',        icon: '🐈', title: 'Cat Nap',           desc: 'Play 7 days in a row.' },
  { id: 'paw_print',      icon: '🐾', title: 'Paw Print',         desc: 'Solve 10 levels.' },
  { id: 'pride_of_lions', icon: '🦁', title: 'Pride of Lions',    desc: 'Solve 50 levels.' },
  { id: 'cat_king',       icon: '👑', title: 'Cat King',          desc: 'Reach level 25.' },
  { id: 'yarn_ball',      icon: '🧶', title: 'Yarn Ball',         desc: 'Collect 3 stars on 5 levels.' },
  { id: 'tangled',        icon: '🧵', title: 'Tangled',           desc: 'Collect 3 stars on 20 levels.' },
  { id: 'daily_player',   icon: '📅', title: 'Daily Player',      desc: 'Complete a daily puzzle.' },
  { id: 'sharpshooter',   icon: '🎯', title: 'Sharpshooter',      desc: 'Solve a level in par or fewer moves.' },
  { id: 'star_collector', icon: '⭐', title: 'Star Collector',    desc: 'Collect 30 stars total.' },
  { id: 'hot_streak',     icon: '🔥', title: 'Hot Streak',        desc: 'Solve 3 levels in a row without undo.' },
  { id: 'purrfect',       icon: '💫', title: 'Purrfect',          desc: 'Get 3 stars on 10 levels.' },
  { id: 'lightning_paw',  icon: '⚡', title: 'Lightning Paw',     desc: 'Solve a timed level with >50% time left.' },
  { id: 'legendary',      icon: '🌟', title: 'Legendary',         desc: 'Unlock all other achievements.' },
];

// ── Tutorial data ─────────────────────────────────────────────────────────
export const TUTORIAL_TUBES = [
  ['coral', 'coral', 'lavender', 'lavender'],
  ['lavender', 'coral', 'coral', 'lavender'],
  [],
];

export const TUTORIAL_SCRIPT = [
  {
    step:    0,
    heading: 'Willkommen!',
    body:    'Tippe auf einen Behälter, um das oberste Knäuel auszuwählen.',
  },
  {
    step:    1,
    heading: 'Gut gemacht!',
    body:    'Jetzt tippe auf einen anderen Behälter, um das Knäuel hineinzulegen.',
  },
  {
    step:    2,
    heading: 'Super!',
    body:    'Sortiere alle Knäuel nach Farbe – jeder Behälter darf nur eine Farbe enthalten.',
  },
  {
    step:    3,
    heading: 'Fertig!',
    body:    'Du hast es geschafft! Viel Spaß beim Spielen.',
  },
];
