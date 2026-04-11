'use strict';

import { COLOR_KEYS } from './constants.js';
import { CATS } from './cats.js';

// ── Modifiers ─────────────────────────────────────────────────────────────
export const DAILY_MODIFIERS = {
  minimalist: {
    key:  'minimalist',
    name: 'Minimalist',
    icon: '🎯',
    desc: 'Jeder Zug zählt — nur wenige Züge für 3 Sterne!',
  },
  giant: {
    key:  'giant',
    name: 'Riesenpuzzle',
    icon: '🐾',
    desc: 'Extra viele Farben! Die Pfoten sind gefragt.',
  },
  blitz: {
    key:  'blitz',
    name: 'Blitz',
    icon: '⚡',
    desc: 'Gegen die Uhr! Schneller als ein Katzenpfotenhieb.',
  },
  noundo: {
    key:  'noundo',
    name: 'Kein Undo',
    icon: '🔒',
    desc: 'Kein Zurück — überlege gut!',
  },
  symbols: {
    key:  'symbols',
    name: 'Farbformen',
    icon: '🔷',
    desc: 'Vergiss die Farben — nur Symbole zählen!',
  },
  memory: {
    key:  'memory',
    name: 'Gedächtnis',
    icon: '🧠',
    desc: 'Behalte das Muster im Kopf – wie eine schlaue Hauskatze.',
  },
  master: {
    key:  'master',
    name: 'Meisterstück',
    icon: '👑',
    desc: 'Ein Puzzle für wahre Meister!',
  },
};

// ── Weekday → modifier mapping (0 = Sonntag) ──────────────────────────────
// [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
export const DAY_MODIFIER_MAP = [
  'master',
  'minimalist',
  'giant',
  'blitz',
  'noundo',
  'symbols',
  'memory',
];

// ── Mission texts (3 per modifier, German, {name} = cat name) ─────────────
export const MISSION_TEXTS = {
  minimalist: [
    '{name} sagt: Weniger ist mehr – löse das Puzzle mit minimalem Aufwand!',
    'Heute trainiert {name} deine Konzentration – nur das Wesentliche zählt.',
    'Mit {name} an deiner Seite: Schaffe Ordnung im kleinen Chaos!',
  ],
  giant: [
    '{name} krault die Pfoten – heute wird das Puzzle riesig!',
    'Halte durch! {name} glaubt an dich – auch bei vielen Farben.',
    '{name} beobachtet gespannt: Meisterst du das Riesenpuzzle?',
  ],
  blitz: [
    '{name} feuert dich an – schnell, schnell, keine Zeit zu verlieren!',
    'Zeig {name} wie flink deine Finger sind – das Blitzpuzzle wartet!',
    '{name} schaut auf die Uhr: Schaffst du es rechtzeitig?',
  ],
  noundo: [
    '{name} kennt kein Zurück – und du heute auch nicht!',
    'Jeder Zug muss sitzen: {name} vertraut deiner Voraussicht.',
    '{name} flüstert: Denk nach, bevor du tippst – kein Rückgängig!',
  ],
  symbols: [
    '{name} hat scharfe Augen – erkennst du alle Symbole?',
    'Heute helfen Symbole statt Farben. {name} testet deine Wahrnehmung!',
    '{name} schnurrt anerkennend, wenn du alle Symbole richtig sortierst.',
  ],
  memory: [
    '{name} hat ein phänomenales Gedächtnis – kannst du mithalten?',
    'Merke dir das Muster! {name} beobachtet jede Bewegung.',
    '{name} erwartet, dass du das Puzzle aus dem Kopf löst.',
  ],
  master: [
    '{name} verneigt sich vor dem Meisterpuzzle – bist du bereit?',
    'Nur die Mutigsten wagen es: {name} fiebert mit dir mit!',
    '{name} schnurrt nur für echte Puzzle-Meister – beweise dich!',
  ],
};

// ── PRNG (same algorithm as engine.js) ────────────────────────────────────
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Deterministic seed for today: YYYYMMDD as integer ─────────────────────
export function dailySeed() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}

// ── Today's modifier based on weekday ─────────────────────────────────────
export function getDailyModifier() {
  const weekday = new Date().getDay(); // 0=Sun … 6=Sat
  const key = DAY_MODIFIER_MAP[weekday];
  return DAILY_MODIFIERS[key];
}

// ── Pick a deterministic daily cat from the player's collection ───────────
export function getDailyCat(ownedIds) {
  if (!ownedIds || ownedIds.length === 0) return CATS[0];
  const rng = mulberry32(dailySeed() ^ 0xCAFE1234);
  const idx = Math.floor(rng() * ownedIds.length);
  const id  = ownedIds[idx];
  return CATS.find(c => c.id === id) ?? CATS[0];
}

// ── Pick a deterministic mission text for today ───────────────────────────
export function getDailyMissionText(modifierKey, catName) {
  const pool = MISSION_TEXTS[modifierKey] ?? MISSION_TEXTS.master;
  const rng  = mulberry32(dailySeed() ^ 0xBEEF5678);
  const idx  = Math.floor(rng() * pool.length);
  return pool[idx].replace(/\{name\}/g, catName);
}

// ── Generation overrides per modifier ─────────────────────────────────────
export function getDailyGenerationOverride(modifierKey) {
  const rng = mulberry32(dailySeed() ^ 0xF00DCAFE);

  if (modifierKey === 'giant') {
    const numColors = 5 + Math.floor(rng() * 3); // 5, 6 or 7
    const colors = COLOR_KEYS.slice(0, numColors);
    return { colors, tubes: numColors + 2, empty: 2 };
  }

  if (modifierKey === 'master') {
    const numColors = 7 + Math.floor(rng() * 3); // 7, 8 or 9
    const colors = COLOR_KEYS.slice(0, numColors);
    return { colors, tubes: numColors + 2, empty: 2 };
  }

  return null;
}

// ── Color → symbol map ────────────────────────────────────────────────────
export const COLOR_SYMBOLS = {
  coral:    '●',
  lavender: '▲',
  mint:     '■',
  honey:    '◆',
  peach:    '★',
  rose:     '♥',
  sky:      '✦',
  plum:     '⬟',
  slate:    '◎',
  ember:    '✿',
};
