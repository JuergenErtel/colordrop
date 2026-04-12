'use strict';

// ── Procedural Layered Music Engine v4 — Orchestral Edition ─────────
// Rich, orchestral puzzle game music with driving rhythms.
// Each tier has its own feel — all energetic, fun, and BIG sounding.
//
//   EASY:   Bouncy, bright, playful — major pentatonic, catchy arpeggios
//   MEDIUM: Funky groove, syncopated — mixolydian swagger, thick bass
//   HARD:   Driving energy, powerful — dorian punch, orchestral stabs
//   EXPERT: Intense, rushing arpeggios — harmonic minor urgency
//   MASTER: Epic & triumphant — dramatic, cinematic, full orchestra

/* global AudioContext */

// ── Tier configurations ──────────────────────────────────────────────────
const TIER_CONFIG = {
  EASY: {
    root: 392.00,  // G4
    scale: [0, 2, 4, 7, 9],
    bpm: 138,
    beatsPerBar: 4,
    swing: 0.12,
    melodyOsc: 'triangle',
    melodyVol: 0.22,
    melodyAttack: 0.003,
    melodyDecay: 0.35,
    padOsc: 'triangle',
    padVol: 0.06,
    padVoices: 4,        // more voices = richer strings
    padDetune: 10,       // wider = more orchestral
    bassOsc: 'triangle',
    bassVol: 0.10,
    hatVol: 0.05,
    kickVol: 0.14,
    clapVol: 0.07,
    snareVol: 0.06,
    tambVol: 0.03,
    arpVol: 0.09,
    arpSpeed: 8,         // notes per bar
    counterVol: 0.08,
    stabVol: 0.12,
    hatPattern:  [0.8, 0.4, 0.7, 0.3, 0.8, 0.4, 0.7, 0.3],
    kickPattern: [1, 0, 0, 0, 0.8, 0, 0, 0],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0],
    snarePattern:[0, 0, 0, 0, 0.9, 0, 0, 0.4],
    tambPattern: [0.4, 0.2, 0.3, 0.2, 0.4, 0.2, 0.3, 0.2,
                  0.4, 0.2, 0.3, 0.2, 0.4, 0.2, 0.3, 0.2],
    melodyNoteDivision: 8,
    melodyRestChance: 0.12,
    melodySkipChance: 0.15,
    chords: [
      [0, 4, 7],     // I   (G)
      [7, 11, 14],   // V   (D)
      [5, 9, 12],    // IV  (C)
      [7, 11, 14],   // V   (D)
      [0, 4, 7],     // I   (G)
      [2, 5, 9],     // vi  (Em)
      [5, 9, 12],    // IV  (C)
      [7, 11, 14],   // V   (D)
    ],
  },
  MEDIUM: {
    root: 293.66,  // D4
    scale: [0, 2, 4, 5, 7, 9, 10],
    bpm: 128,
    beatsPerBar: 4,
    swing: 0.18,
    melodyOsc: 'custom_pluck',
    melodyVol: 0.22,
    melodyAttack: 0.002,
    melodyDecay: 0.3,
    padOsc: 'triangle',
    padVol: 0.05,
    padVoices: 5,
    padDetune: 12,
    bassOsc: 'triangle',
    bassVol: 0.12,
    hatVol: 0.05,
    kickVol: 0.15,
    clapVol: 0.08,
    snareVol: 0.07,
    tambVol: 0.03,
    arpVol: 0.08,
    arpSpeed: 8,
    counterVol: 0.07,
    stabVol: 0.14,
    hatPattern:  [0.6, 0.3, 0.8, 0.4, 0.6, 0.5, 0.9, 0.3,
                  0.6, 0.3, 0.8, 0.4, 0.7, 0.5, 0.8, 0.4],
    kickPattern: [1, 0, 0, 0.5, 0, 0, 0.8, 0,
                  0, 0.4, 0, 0, 1, 0, 0, 0.5],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0.3,
                  0, 0, 0, 0, 1, 0, 0, 0],
    snarePattern:[0, 0, 0, 0, 0.8, 0, 0, 0,
                  0, 0, 0, 0, 0.9, 0, 0, 0.5],
    tambPattern: [0.3, 0.15, 0.25, 0.15, 0.35, 0.15, 0.25, 0.2,
                  0.3, 0.15, 0.25, 0.15, 0.35, 0.2, 0.3, 0.15],
    melodyNoteDivision: 8,
    melodyRestChance: 0.10,
    melodySkipChance: 0.20,
    chords: [
      [0, 4, 7],
      [0, 4, 7, 10],
      [5, 9, 12],
      [7, 10, 14],
      [0, 4, 7],
      [10, 14, 17],
      [5, 9, 12],
      [7, 10, 14],
    ],
  },
  HARD: {
    root: 220.00,  // A3
    scale: [0, 2, 3, 5, 7, 9, 10],
    bpm: 140,
    beatsPerBar: 4,
    swing: 0.05,
    melodyOsc: 'sawtooth',
    melodyVol: 0.14,
    melodyAttack: 0.005,
    melodyDecay: 0.4,
    padOsc: 'sawtooth',
    padVol: 0.04,
    padVoices: 6,
    padDetune: 14,
    bassOsc: 'sawtooth',
    bassVol: 0.13,
    hatVol: 0.06,
    kickVol: 0.16,
    clapVol: 0.09,
    snareVol: 0.08,
    tambVol: 0.04,
    arpVol: 0.07,
    arpSpeed: 16,
    counterVol: 0.06,
    stabVol: 0.16,
    hatPattern:  [0.8, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.4,
                  0.8, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.3],
    kickPattern: [1, 0, 0, 0, 0, 0, 0.7, 0,
                  0, 0, 1, 0, 0, 0.5, 0, 0],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0,
                  0, 0, 0, 0, 1, 0, 0, 0.4],
    snarePattern:[0, 0, 0, 0, 1, 0, 0, 0.3,
                  0, 0, 0, 0, 1, 0, 0.5, 0.3],
    tambPattern: [0.5, 0.2, 0.35, 0.2, 0.5, 0.2, 0.35, 0.25,
                  0.5, 0.2, 0.35, 0.2, 0.5, 0.25, 0.4, 0.2],
    melodyNoteDivision: 8,
    melodyRestChance: 0.15,
    melodySkipChance: 0.12,
    chords: [
      [0, 3, 7],
      [5, 9, 12],
      [0, 3, 7],
      [7, 10, 14],
      [3, 7, 10],
      [5, 9, 12],
      [8, 12, 15],
      [7, 10, 14],
    ],
  },
  EXPERT: {
    root: 164.81,  // E3
    scale: [0, 1, 4, 5, 7, 8, 11],
    bpm: 152,
    beatsPerBar: 4,
    swing: 0.0,
    melodyOsc: 'square',
    melodyVol: 0.10,
    melodyAttack: 0.001,
    melodyDecay: 0.2,
    padOsc: 'sawtooth',
    padVol: 0.04,
    padVoices: 6,
    padDetune: 16,
    bassOsc: 'sawtooth',
    bassVol: 0.14,
    hatVol: 0.06,
    kickVol: 0.17,
    clapVol: 0.10,
    snareVol: 0.09,
    tambVol: 0.04,
    arpVol: 0.08,
    arpSpeed: 16,
    counterVol: 0.06,
    stabVol: 0.18,
    hatPattern:  [0.9, 0.4, 0.6, 0.3, 0.8, 0.5, 0.6, 0.4,
                  0.9, 0.3, 0.7, 0.4, 0.8, 0.5, 0.7, 0.3],
    kickPattern: [1, 0, 0, 0.4, 0, 0.7, 0, 0,
                  0.5, 0, 0, 0, 1, 0, 0.6, 0],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0,
                  0, 0, 0, 0, 1, 0, 0, 0.5],
    snarePattern:[0, 0, 0, 0, 1, 0, 0, 0.4,
                  0, 0, 0.3, 0, 1, 0, 0.6, 0.4],
    tambPattern: [0.5, 0.25, 0.4, 0.2, 0.5, 0.25, 0.4, 0.25,
                  0.5, 0.2, 0.4, 0.25, 0.5, 0.25, 0.45, 0.2],
    melodyNoteDivision: 16,
    melodyRestChance: 0.15,
    melodySkipChance: 0.10,
    chords: [
      [0, 4, 7],
      [5, 8, 12],
      [7, 11, 14],
      [0, 4, 7],
      [1, 5, 8],
      [5, 8, 12],
      [7, 11, 14],
      [0, 3, 7, 11],
    ],
  },
  MASTER: {
    root: 130.81,  // C3
    scale: [0, 2, 3, 5, 7, 9, 11],
    bpm: 160,
    beatsPerBar: 4,
    swing: 0.0,
    melodyOsc: 'sawtooth',
    melodyVol: 0.11,
    melodyAttack: 0.005,
    melodyDecay: 0.3,
    padOsc: 'sawtooth',
    padVol: 0.05,
    padVoices: 8,
    padDetune: 18,
    bassOsc: 'sawtooth',
    bassVol: 0.15,
    hatVol: 0.06,
    kickVol: 0.18,
    clapVol: 0.11,
    snareVol: 0.10,
    tambVol: 0.04,
    arpVol: 0.09,
    arpSpeed: 16,
    counterVol: 0.07,
    stabVol: 0.20,
    hatPattern:  [0.9, 0.5, 0.7, 0.4, 0.8, 0.5, 0.7, 0.5,
                  0.9, 0.4, 0.7, 0.5, 0.8, 0.5, 0.7, 0.4],
    kickPattern: [1, 0, 0, 0.5, 0, 0, 0.8, 0,
                  0, 0.4, 0, 0, 1, 0, 0, 0.6],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0.3,
                  0, 0, 0, 0, 1, 0, 0.5, 0],
    snarePattern:[0, 0, 0, 0, 1, 0, 0.3, 0.4,
                  0, 0, 0.3, 0, 1, 0, 0.5, 0.6],
    tambPattern: [0.5, 0.3, 0.4, 0.25, 0.5, 0.3, 0.4, 0.3,
                  0.5, 0.25, 0.4, 0.3, 0.5, 0.3, 0.45, 0.25],
    melodyNoteDivision: 12,
    melodyRestChance: 0.18,
    melodySkipChance: 0.12,
    chords: [
      [0, 3, 7],
      [7, 11, 14],
      [5, 8, 12],
      [3, 7, 10],
      [0, 3, 7],
      [8, 12, 15],
      [5, 8, 12],
      [7, 11, 14],
    ],
  },
  MENU: {
    root: 392.00,  // G4 — bright, cheerful
    scale: [0, 2, 4, 7, 9],  // major pentatonic — pure happy, no dissonance
    bpm: 100,      // relaxed but cheerful — café lobby feel
    beatsPerBar: 4,
    swing: 0.12,   // gentle shuffle
    melodyOsc: 'triangle',
    melodyVol: 0.20,       // melody is the star — clear and present
    melodyAttack: 0.01,    // soft pluck — not too sharp
    melodyDecay: 0.55,     // longer notes — singable, melodic
    padOsc: 'sine',
    padVol: 0.07,          // warm bed underneath
    padVoices: 4,
    padDetune: 6,
    bassOsc: 'sine',
    bassVol: 0.06,
    hatVol: 0.02,          // barely-there hi-hat
    kickVol: 0.05,         // gentle pulse
    clapVol: 0.0,
    snareVol: 0.0,
    tambVol: 0.02,
    arpVol: 0.07,          // quiet arpeggios — support, not compete
    arpSpeed: 4,           // slow arpeggios — gentle shimmer
    counterVol: 0.0,       // NO counter-melody — keeps it clean and singable
    stabVol: 0.0,
    hatPattern:  [0.2, 0, 0.15, 0, 0.2, 0, 0.15, 0],
    kickPattern: [0.4, 0, 0, 0, 0.25, 0, 0, 0],
    clapPattern: [0, 0, 0, 0, 0, 0, 0, 0],
    snarePattern:[0, 0, 0, 0, 0, 0, 0, 0],
    tambPattern: [0.15, 0.08, 0.1, 0.08, 0.15, 0.08, 0.1, 0.08,
                  0.15, 0.08, 0.1, 0.08, 0.15, 0.08, 0.1, 0.08],
    melodyNoteDivision: 4,   // quarter notes — simple, singable melody
    melodyRestChance: 0.2,   // some rests for phrasing
    melodySkipChance: 0.0,   // NO skips — stepwise motion only = melodic
    chords: [
      [0, 4, 7],     // I   (G)
      [0, 4, 7],     // I   (G)  — repeat for stability
      [5, 9, 12],    // IV  (C)  — bright lift
      [5, 9, 12],    // IV  (C)
      [0, 4, 7],     // I   (G)
      [7, 11, 14],   // V   (D)  — gentle push
      [5, 9, 12],    // IV  (C)
      [0, 4, 7],     // I   (G)  — home
    ],
  },
};

// ── Melody phrase shapes (earworm-optimized: repetition + singable intervals) ──
// A/B structure: each pair = verse(A) + variation(B) for instant catchiness
const PHRASE_SHAPES = [
  // --- Hook-heavy shapes (repeated motifs) ---
  [0, 2, 4, 2, 0, 2, 4, 7],        // A: simple hook — up, back, up higher
  [0, 2, 4, 7, 4, 2, 4, 2],        // B: answer — reaches up, falls back
  [0, 4, 0, 4, 0, 4, 2, 7],        // A: insistent pedal hook — catchy!
  [0, 4, 2, 7, 4, 2, 0, 4],        // B: answer to pedal hook
  [0, 0, 2, 4, 0, 0, 2, 7],        // A: rhythmic repeat — da-da DUM DUM
  [0, 0, 4, 2, 0, 0, 4, 5],        // B: rhythmic variation
  // --- Singable melodic shapes ---
  [0, 2, 4, 5, 4, 2, 3, 5],        // arch — classic singable
  [4, 2, 4, 5, 7, 5, 4, 2],        // wave — up and down, memorable
  [0, 4, 7, 4, 0, 5, 9, 5],        // triad bounces — very catchy
  [7, 7, 5, 5, 4, 4, 2, 0],        // cascade — satisfying resolution
  // --- Energy shapes ---
  [0, 2, 4, 7, 4, 5, 7, 9],        // climbing — builds excitement
  [3, 5, 7, 5, 3, 5, 7, 9],        // rocking up — pure energy
];

// ── Hook riffs — short catchy motifs that loop (per tier) ───────────────
// Each riff is [scaleDegree, durationMultiplier] pairs
const HOOK_RIFFS = {
  EASY:   [[0,1], [2,1], [4,1], [2,0.5], [4,0.5], [7,2]],         // do-re-mi-re-mi-sol~
  MEDIUM: [[0,1], [4,0.5], [2,0.5], [0,1], [4,0.5], [5,0.5], [4,2]], // funky hook
  HARD:   [[0,0.5], [0,0.5], [3,1], [5,0.5], [3,0.5], [0,1], [7,1]], // punchy riff
  EXPERT: [[0,0.5], [4,0.5], [7,0.5], [4,0.5], [0,0.5], [4,0.5], [7,0.5], [11,0.5]], // arpeggio run
  MASTER: [[0,1], [3,0.5], [5,0.5], [7,1], [5,0.5], [3,0.5], [0,2]], // epic motif
  MENU:   [[0,2], [2,2], [4,2], [2,2]],                                      // simple, singable — do re mi re
};

// ── Arpeggio patterns (intervals within chord) ──────────────────────────
const ARP_PATTERNS = [
  [0, 1, 2, 1],              // up-down triad
  [0, 1, 2, 1, 0, 2],       // rolling
  [2, 1, 0, 1, 2, 0],       // down-up
  [0, 2, 1, 0, 2, 1],       // skip pattern
  [0, 0, 1, 2, 2, 1],       // doubled roots
  [0, 1, 2, 2, 1, 0, 1, 2], // wave
];

// ── Bass patterns ────────────────────────────────────────────────────────
const BASS_PATTERNS = {
  EASY:   [[0, 7, 12, 7], [0, 0, 7, 7], [0, 4, 7, 12]],
  MEDIUM: [[0, 7, 5, 7], [0, 0, 12, 10], [0, 3, 5, 7], [0, 7, 0, 5]],
  HARD:   [[0, 0, 12, 0], [0, 5, 7, 5], [0, 0, 7, 12], [0, 12, 7, 0]],
  EXPERT: [[0, 12, 0, 7, 0, 12, 7, 0], [0, 7, 12, 7, 0, 5, 7, 12]],
  MASTER: [[0, 0, 12, 12, 0, 0, 7, 7], [0, 12, 7, 0, 5, 12, 7, 5]],
  MENU:   [[0, 7, 12, 7], [0, 12, 7, 0]],
};

// ── Fill patterns (hit indices within 16 steps) ─────────────────────────
const FILL_PATTERNS = [
  [8, 9, 10, 11, 12, 13, 14, 15],          // classic run into downbeat
  [10, 11, 12, 12.5, 13, 13.5, 14, 14.5, 15],  // accelerating
  [8, 10, 11, 13, 14, 15],                 // syncopated fill
  [12, 13, 14, 14.5, 15, 15.5],            // short burst at end
];

// ── State ────────────────────────────────────────────────────────────────
let _ctx            = null;
let _masterGain     = null;
let _volume         = 0.3;
let _enabled        = true;
let _currentTier    = null;
let _scheduleId     = null;
let _barIndex       = 0;
let _phraseIndex    = -1;
let _phraseRepeat   = 0;   // how many bars the current phrase has played
let _scaleOffset    = 0;
let _bassPatIndex   = 0;
let _arpPatIndex    = 0;
let _activeNodes    = [];
let _crossfading    = false;
let _lastMelodyFreqs = []; // store last bar's melody for echo

// ── AudioContext ─────────────────────────────────────────────────────────
function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = _volume;
      _masterGain.connect(_ctx.destination);
    } catch { return null; }
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function semiToFreq(root, semi) {
  return root * Math.pow(2, semi / 12);
}

function scaleNoteToSemi(degree, scale) {
  const octave = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return octave * 12 + scale[idx];
}

function barDuration(bpm, beatsPerBar) {
  return (60 / bpm) * beatsPerBar;
}

function trackNode(osc, gain) {
  _activeNodes.push({ osc, gain });
}

// ── Melody Layer ─────────────────────────────────────────────────────────

function playMelodyNote(freq, duration, startTime, config) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const oscType = config.melodyOsc === 'custom_pluck' ? 'triangle' : config.melodyOsc;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = oscType;
  osc.frequency.value = freq;

  const vol = config.melodyVol;
  const attack = config.melodyAttack;
  const noteLen = duration * config.melodyDecay;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + attack);

  if (config.melodyOsc === 'custom_pluck') {
    gain.gain.setValueAtTime(vol * 1.2, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, startTime + noteLen * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen);
  } else {
    gain.gain.setValueAtTime(vol, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen);
  }

  let dest = _masterGain;
  if (config.melodyOsc === 'sawtooth' || config.melodyOsc === 'square') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2500 + Math.random() * 1500;
    filter.Q.value = 2;
    filter.connect(_masterGain);
    dest = filter;
  }

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + noteLen + 0.05);
  trackNode(osc, gain);

  // Pluck shimmer overtone
  if (config.melodyOsc === 'custom_pluck') {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 3;
    gain2.gain.setValueAtTime(vol * 0.2, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen * 0.12);
    osc2.connect(gain2);
    gain2.connect(_masterGain);
    osc2.start(startTime);
    osc2.stop(startTime + noteLen * 0.15);
    trackNode(osc2, gain2);
  }

  // Octave double for brightness
  if (config.melodyOsc === 'triangle' && Math.random() < 0.4) {
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 2;
    gain3.gain.setValueAtTime(0, startTime);
    gain3.gain.linearRampToValueAtTime(vol * 0.12, startTime + attack);
    gain3.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen * 0.5);
    osc3.connect(gain3);
    gain3.connect(_masterGain);
    osc3.start(startTime);
    osc3.stop(startTime + noteLen * 0.55);
    trackNode(osc3, gain3);
  }
}

function scheduleMelody(config, barStart) {
  // Occasional rest but less frequent — melody should be present
  if (Math.random() < config.melodyRestChance * 0.5) return;

  // ── Phrase repetition: repeat same shape 4 bars, then switch ──
  // This is THE key to earworm quality — repetition breeds familiarity
  _phraseRepeat++;
  if (_phraseRepeat >= 4 || _phraseIndex < 0) {
    _phraseRepeat = 0;
    let idx;
    // Use A/B pairing: if we just played an even shape, try the next (odd) one
    if (_phraseIndex >= 0 && _phraseIndex % 2 === 0 && _phraseIndex + 1 < PHRASE_SHAPES.length) {
      idx = _phraseIndex + 1;  // play the B answer
    } else {
      // Pick a new A shape (even index)
      const evenShapes = PHRASE_SHAPES.length;
      do {
        idx = Math.floor(Math.random() * Math.floor(evenShapes / 2)) * 2;
      } while (idx === _phraseIndex && evenShapes > 2);
    }
    _phraseIndex = idx;
  }

  const shape = PHRASE_SHAPES[_phraseIndex];
  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const numNotes = config.melodyNoteDivision;
  const noteDur = barDur / numNotes;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chordRoot = config.chords[chordIdx][0];

  // Wander less — keep it closer to home for catchiness
  if (_barIndex % 16 === 0) {
    _scaleOffset += Math.floor(Math.random() * 3) - 1;
    _scaleOffset = Math.max(-1, Math.min(2, _scaleOffset));
  }

  const swing = config.swing || 0;
  const melodyFreqs = [];

  for (let i = 0; i < numNotes; i++) {
    // Lower skip chance — melody should be more continuous for earworm
    if (Math.random() < config.melodySkipChance * 0.6) continue;

    const shapeIdx = Math.floor((i / numNotes) * shape.length);
    const degree = shape[shapeIdx] + _scaleOffset;
    const semi = scaleNoteToSemi(degree, config.scale) + chordRoot;
    let freq = semiToFreq(config.root, semi);

    while (freq < 200) freq *= 2;
    while (freq > 1600) freq /= 2;

    let swingOffset = 0;
    if (i % 2 === 1) swingOffset = noteDur * swing;

    const jitter = (Math.random() - 0.5) * noteDur * 0.04;
    const t = barStart + i * noteDur + swingOffset + jitter;

    playMelodyNote(freq, noteDur, t, config);
    melodyFreqs.push({ freq, t, dur: noteDur });

    // ── Melody echo: repeat note quietly a 16th later ──
    if (i % 2 === 0 && Math.random() < 0.35) {
      const echoDelay = noteDur * 0.5;
      const echoVol = config.melodyVol * 0.3;
      const echoT = t + echoDelay;
      const ctx = _ctx;
      if (ctx && _masterGain) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const eLen = noteDur * 0.25;
        gain.gain.setValueAtTime(echoVol, echoT);
        gain.gain.exponentialRampToValueAtTime(0.001, echoT + eLen);
        osc.connect(gain);
        gain.connect(_masterGain);
        osc.start(echoT);
        osc.stop(echoT + eLen + 0.02);
        trackNode(osc, gain);
      }
    }
  }

  _lastMelodyFreqs = melodyFreqs;
}

// ── Hook Riff Layer (catchy repeating motif) ────────────────────────────

function scheduleHookRiff(config, tier, barStart) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  // Hook only plays on even bars (melody plays every bar, hook adds texture)
  // This prevents two independent melodies clashing
  if (_barIndex % 2 !== 0) return;

  const riff = HOOK_RIFFS[tier] || HOOK_RIFFS.EASY;
  const barDur = barDuration(config.bpm, config.beatsPerBar);

  // Hook riff is ALWAYS rooted on the tonic — no chord transposition!
  // This keeps it as a recognizable, stable motif throughout.
  const octaveShift = (_barIndex % 8 < 4) ? 0 : 12;
  const hookVol = config.melodyVol * 0.28 * (0.85 + 0.15 * Math.sin(_barIndex * 0.5));

  const totalUnits = riff.reduce((sum, n) => sum + n[1], 0);
  const unitDur = barDur / totalUnits;

  let t = barStart;
  for (const [degree, durMul] of riff) {
    // Pure scale degree — no chordRoot offset, stays in key guaranteed
    const semi = scaleNoteToSemi(degree, config.scale) + octaveShift;
    let freq = semiToFreq(config.root, semi);
    while (freq < 300) freq *= 2;
    while (freq > 1200) freq /= 2;

    const noteDur = unitDur * durMul;
    const noteLen = noteDur * 0.65;

    // Bright bell-like tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(hookVol, t);
    gain.gain.setValueAtTime(hookVol * 0.9, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(t);
    osc.stop(t + noteLen + 0.02);
    trackNode(osc, gain);

    // Bell overtone
    const bell = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bell.type = 'sine';
    bell.frequency.value = freq * 2;
    bellGain.gain.setValueAtTime(hookVol * 0.15, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.4);
    bell.connect(bellGain);
    bellGain.connect(_masterGain);
    bell.start(t);
    bell.stop(t + noteLen * 0.5);
    trackNode(bell, bellGain);

    t += noteDur;
  }
}

// ── Counter-Melody Layer (call-and-response) ────────────────────────────

// Snap a frequency to the nearest note in the current scale
function snapToScale(freq, root, scale) {
  // Find the semitone offset from root
  const semiFromRoot = 12 * Math.log2(freq / root);
  const octave = Math.floor(semiFromRoot / 12);
  const semi = ((semiFromRoot % 12) + 12) % 12;

  // Find closest scale tone
  let bestDist = 999;
  let bestSemi = 0;
  for (const s of scale) {
    const dist = Math.min(Math.abs(semi - s), 12 - Math.abs(semi - s));
    if (dist < bestDist) { bestDist = dist; bestSemi = s; }
  }
  return root * Math.pow(2, (octave * 12 + bestSemi) / 12);
}

function scheduleCounterMelody(config, barStart) {
  // Plays on odd bars — echoes the previous bar's melody, snapped to scale
  if (_barIndex % 2 === 0) return;
  if (Math.random() < 0.25) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const vol = config.counterVol || 0.07;

  const source = _lastMelodyFreqs;
  if (source.length > 0) {
    const responseDelay = barDur / config.beatsPerBar;
    const maxNotes = Math.min(source.length, 6);

    for (let i = 0; i < maxNotes; i++) {
      if (Math.random() < 0.15) continue;

      // Transpose up a scale third (= 2 scale degrees) and snap to scale
      // This guarantees we stay in key!
      let freq = source[i].freq * Math.pow(2, 3 / 12);  // ~minor third up
      freq = snapToScale(freq, config.root, config.scale);
      while (freq > 2000) freq /= 2;

      const t = barStart + responseDelay + i * (barDur / maxNotes);
      const noteLen = (barDur / maxNotes) * 0.5;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + noteLen * 0.15);
      gain.gain.setValueAtTime(vol * 0.8, t + noteLen * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

      osc.connect(gain);
      gain.connect(_masterGain);
      osc.start(t);
      osc.stop(t + noteLen + 0.05);
      trackNode(osc, gain);
    }
  }
}

// ── Arpeggio Layer ──────────────────────────────────────────────────────

function scheduleArpeggio(config, barStart) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  // Arpeggios come in waves — play 2 bars, rest 2 bars
  if (_barIndex % 4 >= 2 && Math.random() < 0.7) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];

  // Rotate arp pattern
  if (_barIndex % 2 === 0) {
    _arpPatIndex = (_arpPatIndex + 1) % ARP_PATTERNS.length;
  }
  const arpPattern = ARP_PATTERNS[_arpPatIndex];
  const speed = config.arpSpeed || 8;
  const noteDur = barDur / speed;
  const vol = config.arpVol || 0.08;

  for (let i = 0; i < speed; i++) {
    if (Math.random() < 0.08) continue;

    const patIdx = i % arpPattern.length;
    const chordIdx2 = arpPattern[patIdx] % chord.length;
    const semi = chord[chordIdx2];
    // Place arpeggios an octave above root for sparkle
    let freq = semiToFreq(config.root, semi + 12);
    while (freq < 300) freq *= 2;
    while (freq > 2400) freq /= 2;

    const swingOffset = (i % 2 === 1) ? noteDur * (config.swing || 0) : 0;
    const t = barStart + i * noteDur + swingOffset;
    const noteLen = noteDur * 0.4;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Percussive pluck envelope
    gain.gain.setValueAtTime(vol * 1.1, t);
    gain.gain.exponentialRampToValueAtTime(vol * 0.4, t + noteLen * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen);

    // Shimmer: high sine overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(vol * 0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.5);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(t);
    osc.stop(t + noteLen + 0.02);
    trackNode(osc, gain);

    osc2.connect(gain2);
    gain2.connect(_masterGain);
    osc2.start(t);
    osc2.stop(t + noteLen * 0.55);
    trackNode(osc2, gain2);
  }
}

// ── Rhythm Layer ─────────────────────────────────────────────────────────

function playHiHat(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.035;
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 9000;
  bp.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  src.connect(bp);
  bp.connect(gain);
  gain.connect(_masterGain);
  src.start(startTime);
  src.stop(startTime + dur + 0.01);
}

function playSnare(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.12;

  // Noise body (wires)
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 2000;
  hp.Q.value = 0.8;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.7, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  src.connect(hp);
  hp.connect(noiseGain);
  noiseGain.connect(_masterGain);
  src.start(startTime);
  src.stop(startTime + dur + 0.01);

  // Tonal body (drum shell)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, startTime);
  osc.frequency.exponentialRampToValueAtTime(120, startTime + dur * 0.3);

  oscGain.gain.setValueAtTime(vol * 0.5, startTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur * 0.6);

  osc.connect(oscGain);
  oscGain.connect(_masterGain);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.01);
}

function playTambourine(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.025;
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // Tambourine: high metallic shimmer
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 6000 + Math.random() * 3000;
  bp.Q.value = 2.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  src.connect(bp);
  bp.connect(gain);
  gain.connect(_masterGain);
  src.start(startTime);
  src.stop(startTime + dur + 0.01);
}

function playClap(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.08;
  for (let layer = 0; layer < 3; layer++) {
    const bufLen = Math.floor(ctx.sampleRate * 0.02);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500 + layer * 500;
    bp.Q.value = 0.8;

    const gain = ctx.createGain();
    const t = startTime + layer * 0.008;
    gain.gain.setValueAtTime(vol * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur - layer * 0.015);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(_masterGain);
    src.start(t);
    src.stop(t + dur + 0.01);
  }
}

function playKick(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.15;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, startTime);
  osc.frequency.exponentialRampToValueAtTime(35, startTime + dur * 0.6);

  gain.gain.setValueAtTime(vol * 1.3, startTime);
  gain.gain.setValueAtTime(vol, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.01);

  // Click transient
  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = 'triangle';
  click.frequency.value = 800;
  clickGain.gain.setValueAtTime(vol * 0.4, startTime);
  clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.015);
  click.connect(clickGain);
  clickGain.connect(_masterGain);
  click.start(startTime);
  click.stop(startTime + 0.02);

  // Sub punch for weight
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.value = 55;
  subGain.gain.setValueAtTime(vol * 0.3, startTime);
  subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
  sub.connect(subGain);
  subGain.connect(_masterGain);
  sub.start(startTime);
  sub.stop(startTime + 0.09);
}

function scheduleRhythm(config, barStart) {
  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const swing = config.swing || 0;

  // Hi-hats
  const hatSteps = config.hatPattern.length;
  const hatStepDur = barDur / hatSteps;
  for (let i = 0; i < hatSteps; i++) {
    const vol = config.hatPattern[i] * config.hatVol;
    if (vol < 0.003) continue;
    if (Math.random() < 0.06) continue;
    let swingOffset = (i % 2 === 1) ? hatStepDur * swing : 0;
    const jitter = (Math.random() - 0.5) * hatStepDur * 0.03;
    playHiHat(barStart + i * hatStepDur + swingOffset + jitter, vol);
  }

  // Kicks
  const kickSteps = config.kickPattern.length;
  const kickStepDur = barDur / kickSteps;
  for (let i = 0; i < kickSteps; i++) {
    const vol = config.kickPattern[i] * config.kickVol;
    if (vol < 0.005) continue;
    playKick(barStart + i * kickStepDur, vol);
  }

  // Claps
  const clapSteps = config.clapPattern.length;
  const clapStepDur = barDur / clapSteps;
  for (let i = 0; i < clapSteps; i++) {
    const vol = config.clapPattern[i] * (config.clapVol || 0);
    if (vol < 0.005) continue;
    playClap(barStart + i * clapStepDur, vol);
  }

  // Snare
  if (config.snarePattern) {
    const snareSteps = config.snarePattern.length;
    const snareStepDur = barDur / snareSteps;
    for (let i = 0; i < snareSteps; i++) {
      const vol = config.snarePattern[i] * (config.snareVol || 0);
      if (vol < 0.005) continue;
      playSnare(barStart + i * snareStepDur, vol);
    }
  }

  // Tambourine
  if (config.tambPattern) {
    const tambSteps = config.tambPattern.length;
    const tambStepDur = barDur / tambSteps;
    for (let i = 0; i < tambSteps; i++) {
      const vol = config.tambPattern[i] * (config.tambVol || 0);
      if (vol < 0.003) continue;
      if (Math.random() < 0.08) continue;
      const swingOff = (i % 2 === 1) ? tambStepDur * swing : 0;
      playTambourine(barStart + i * tambStepDur + swingOff, vol);
    }
  }
}

// ── Percussion Fill (every 4 or 8 bars) ─────────────────────────────────

function scheduleFill(config, barStart) {
  // Fill on bar before phrase boundary
  const isFillBar = (_barIndex % 8 === 7) || (_barIndex % 4 === 3 && Math.random() < 0.4);
  if (!isFillBar) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const stepDur = barDur / 16;
  const pattern = FILL_PATTERNS[Math.floor(Math.random() * FILL_PATTERNS.length)];

  for (const step of pattern) {
    const t = barStart + step * stepDur;
    const intensity = (step / 16);  // builds toward end
    const vol = (config.snareVol || 0.07) * (0.5 + intensity * 0.7);

    playSnare(t, vol);

    // Add kick on some fill hits for power
    if (Math.random() < 0.3) {
      playKick(t, config.kickVol * 0.5);
    }
  }
}

// ── Pad Layer (orchestral strings) ───────────────────────────────────────

function schedulePad(config, barStart) {
  if (_barIndex % 2 !== 0) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const padDur = barDuration(config.bpm, config.beatsPerBar) * 2;
  const now = barStart;
  const voices = config.padVoices || 3;
  const detuneSpread = config.padDetune || 8;

  // Multi-voice pad for orchestral richness
  for (let n = 0; n < Math.min(chord.length, 3); n++) {
    const baseFreq = semiToFreq(config.root, chord[n]);

    for (let v = 0; v < voices; v++) {
      const detune = (v - (voices - 1) / 2) * (detuneSpread / voices)
                     + (Math.random() - 0.5) * 3;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = config.padOsc;
      osc.frequency.value = baseFreq;
      osc.detune.value = detune;

      let dest = _masterGain;
      if (config.padOsc === 'sawtooth' || config.padOsc === 'square') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Slowly open filter for movement
        const baseF = 600 + Math.random() * 300;
        filter.frequency.setValueAtTime(baseF, now);
        filter.frequency.linearRampToValueAtTime(baseF + 400, now + padDur * 0.4);
        filter.frequency.linearRampToValueAtTime(baseF, now + padDur);
        filter.Q.value = 0.5;
        filter.connect(_masterGain);
        dest = filter;
      }

      // Per-voice volume (divided by voice count)
      const vol = config.padVol / voices;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + padDur * 0.2);
      gain.gain.linearRampToValueAtTime(vol * 0.8, now + padDur * 0.6);
      gain.gain.linearRampToValueAtTime(0, now + padDur);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + padDur + 0.1);
      trackNode(osc, gain);
    }
  }

  // Sub-bass drone
  let subFreq = semiToFreq(config.root, chord[0]);
  while (subFreq > 120) subFreq /= 2;
  while (subFreq < 30) subFreq *= 2;

  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.value = subFreq;

  const bv = config.bassVol * 0.4;
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(bv, now + padDur * 0.15);
  bassGain.gain.linearRampToValueAtTime(bv * 0.6, now + padDur * 0.7);
  bassGain.gain.linearRampToValueAtTime(0, now + padDur);

  bass.connect(bassGain);
  bassGain.connect(_masterGain);
  bass.start(now);
  bass.stop(now + padDur + 0.1);
  trackNode(bass, bassGain);
}

// ── Bass line ───────────────────────────────────────────────────────────

function scheduleBassLine(config, tier, barStart) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const rootSemi = chord[0];

  const patterns = BASS_PATTERNS[tier] || BASS_PATTERNS.EASY;
  if (_barIndex % 4 === 0) {
    _bassPatIndex = (_bassPatIndex + 1) % patterns.length;
  }
  const pattern = patterns[_bassPatIndex];
  const noteDur = barDur / pattern.length;
  const swing = config.swing || 0;
  const bassOsc = config.bassOsc || 'triangle';

  for (let i = 0; i < pattern.length; i++) {
    if (Math.random() < 0.08) continue;

    const semi = rootSemi + pattern[i];
    let freq = semiToFreq(config.root, semi);
    while (freq > 180) freq /= 2;
    while (freq < 35) freq *= 2;

    let swingOffset = (i % 2 === 1) ? noteDur * swing : 0;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = bassOsc;
    osc.frequency.value = freq;

    let dest = _masterGain;
    if (bassOsc === 'sawtooth') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400 + Math.random() * 200;
      filter.Q.value = 2;
      filter.connect(_masterGain);
      dest = filter;
    }

    const vol = config.bassVol * 0.7;
    const t = barStart + i * noteDur + swingOffset;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.setValueAtTime(vol * 0.8, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.8);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + noteDur);
    trackNode(osc, gain);

    // Octave up ghost note for presence
    if (i % 2 === 1 && Math.random() < 0.3) {
      const ghost = ctx.createOscillator();
      const ghostGain = ctx.createGain();
      ghost.type = 'sine';
      ghost.frequency.value = freq * 2;
      ghostGain.gain.setValueAtTime(vol * 0.15, t);
      ghostGain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.3);
      ghost.connect(ghostGain);
      ghostGain.connect(_masterGain);
      ghost.start(t);
      ghost.stop(t + noteDur * 0.35);
      trackNode(ghost, ghostGain);
    }
  }
}

// ── Chord stabs (orchestral brass-like hits) ────────────────────────────

function scheduleChordStab(config, barStart) {
  // More frequent stabs — every 2 bars with some randomness
  const isStabBar = (_barIndex % 4 === 0) || (_barIndex % 2 === 0 && Math.random() < 0.5);
  if (!isStabBar) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const stabVol = config.stabVol || 0.12;
  const barDur = barDuration(config.bpm, config.beatsPerBar);

  // Stab on beat 1, and sometimes a shorter stab on beat 3
  const stabPoints = [0];
  if (Math.random() < 0.4) stabPoints.push(barDur / 2);

  for (const offset of stabPoints) {
    const stabDur = offset === 0 ? 0.18 : 0.10;
    const vol = offset === 0 ? stabVol : stabVol * 0.6;

    for (const semi of chord.slice(0, 3)) {
      let freq = semiToFreq(config.root, semi);
      while (freq < 250) freq *= 2;
      while (freq > 1200) freq /= 2;

      const t = barStart + offset;

      // Main stab — bright, brassy
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      // Lowpass for warmth but keeping attack brightness
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + stabDur);
      filter.Q.value = 1.5;
      filter.connect(_masterGain);

      gain.gain.setValueAtTime(vol, t);
      gain.gain.setValueAtTime(vol * 0.7, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + stabDur);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(t);
      osc.stop(t + stabDur + 0.02);
      trackNode(osc, gain);
    }
  }
}

// ── Energy build-up (every 8 bars, riser effect) ────────────────────────

function scheduleRiser(config, barStart) {
  // Play a rising noise sweep on bar 7 of every 8-bar phrase
  if (_barIndex % 8 !== 6) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const riserDur = barDur * 1.5;  // extends slightly into next bar

  // Filtered noise sweep
  const bufLen = Math.floor(ctx.sampleRate * riserDur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(200, barStart);
  filter.frequency.exponentialRampToValueAtTime(8000, barStart + riserDur);
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, barStart);
  gain.gain.linearRampToValueAtTime(0.06, barStart + riserDur * 0.8);
  gain.gain.linearRampToValueAtTime(0, barStart + riserDur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(_masterGain);
  src.start(barStart);
  src.stop(barStart + riserDur + 0.05);
}

// ── Cat Choir — sings "Kit-ty-sort!" ─────────────────────────────────────
// Child-like cat voices singing the game name.
// 4 bright voices with slight pitch/timing offsets for choir effect.

// Syllable definitions with formant TRANSITIONS (start → end)
// Child formants are higher than adult formants
const CHOIR_SYLLABLES = [
  { // "KI" — crisp /k/ + bright /ɪ/
    f1s: 550, f1e: 400,
    f2s: 2400, f2e: 3000,   // higher F2 = child voice
    dur: 0.20,
    noiseDur: 0.03, noiseFreq: 4000, noiseVol: 1.5,
  },
  { // "TI" — crisp /t/ + bright /i/
    f1s: 450, f1e: 320,
    f2s: 2800, f2e: 3400,   // very high F2 = childlike /i/
    dur: 0.18,
    noiseDur: 0.025, noiseFreq: 6000, noiseVol: 1.8,
  },
  { // "SORT" — /s/ + round /ɔː/ + /t/
    f1s: 600, f1e: 750,
    f2s: 1300, f2e: 1000,
    dur: 0.45,
    noiseDur: 0.06, noiseFreq: 8000, noiseVol: 1.5,
  },
];

// Choir melodies
const CHOIR_MELODIES = [
  [4, 4, 2],     // sol-sol-mi
  [2, 4, 7],     // mi-sol-do'
  [4, 2, 0],     // sol-mi-do
  [0, 2, 4],     // do-re-mi
];

function scheduleCatChoir(config, barStart) {
  if (_barIndex < 8) return;
  if ((_barIndex - 8) % 12 !== 0) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);

  // ── Duck the music during choir ──
  // Briefly lower master volume so choir cuts through
  const totalChoirDur = 1.2;  // approximate duration of all syllables
  const choirStart = barStart + barDur * 0.45;
  const duckStart = choirStart - 0.1;
  _masterGain.gain.setValueAtTime(_volume, duckStart);
  _masterGain.gain.linearRampToValueAtTime(_volume * 0.2, duckStart + 0.08);
  _masterGain.gain.setValueAtTime(_volume * 0.2, duckStart + totalChoirDur);
  _masterGain.gain.linearRampToValueAtTime(_volume, duckStart + totalChoirDur + 0.3);

  // ── Choir output — bypasses masterGain (not ducked) ──
  const choirBus = ctx.createGain();
  choirBus.gain.value = 0.55; // louder choir — must cut through clearly
  choirBus.connect(ctx.destination);

  const melodyIdx = Math.floor(_barIndex / 12) % CHOIR_MELODIES.length;
  const choirMelody = CHOIR_MELODIES[melodyIdx];

  const numVoices = 4;
  const voiceDetune = [8, -8, 3, -3];  // slight spread for choir width

  for (let voice = 0; voice < numVoices; voice++) {
    const timeJitter = (Math.random() - 0.5) * 0.02;
    let syllableTime = choirStart + timeJitter;

    for (let s = 0; s < CHOIR_SYLLABLES.length; s++) {
      const syl = CHOIR_SYLLABLES[s];
      const melDegree = choirMelody[s];

      const semi = scaleNoteToSemi(melDegree, config.scale);
      // Child register: ~600-1100 Hz (bright and clear)
      let baseFreq = semiToFreq(config.root, semi + 12);
      while (baseFreq < 550) baseFreq *= 2;
      while (baseFreq > 1100) baseFreq /= 2;

      const t = syllableTime;
      const dur = syl.dur;

      // ═══ CONSONANT — strong, distinct noise burst ═══
      const nDur = syl.noiseDur;
      const nLen = Math.floor(ctx.sampleRate * nDur);
      const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
      const nData = nBuf.getChannelData(0);
      for (let i = 0; i < nLen; i++) nData[i] = Math.random() * 2 - 1;

      const nSrc = ctx.createBufferSource();
      nSrc.buffer = nBuf;

      // Highpass gives consonants bite
      const nHp = ctx.createBiquadFilter();
      nHp.type = 'highpass';
      nHp.frequency.value = syl.noiseFreq * 0.5;
      nHp.Q.value = 0.5;

      const nBp = ctx.createBiquadFilter();
      nBp.type = 'bandpass';
      nBp.frequency.value = syl.noiseFreq;
      nBp.Q.value = 1.5;

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(syl.noiseVol * 0.15, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + nDur);

      nSrc.connect(nHp);
      nHp.connect(nBp);
      nBp.connect(nGain);
      nGain.connect(choirBus);
      nSrc.start(t);
      nSrc.stop(t + nDur + 0.01);

      // ═══ VOWEL — sawtooth through MOVING formants ═══
      const vowelStart = t + nDur * 0.4;
      const vowelDur = dur - nDur * 0.2;
      const isLast = s === CHOIR_SYLLABLES.length - 1;

      // Triangle + square mix = child-like brightness without harshness
      const saw = ctx.createOscillator();
      saw.type = 'triangle';
      saw.detune.value = voiceDetune[voice];

      // Add a quiet square wave for harmonics (children have bright overtones)
      const sq = ctx.createOscillator();
      sq.type = 'square';
      sq.frequency.value = baseFreq;
      sq.detune.value = voiceDetune[voice];
      const sqGain = ctx.createGain();
      sqGain.gain.value = 0.15; // very quiet — just adds brightness
      sq.connect(sqGain);

      // Quick pitch scoop (child-like eager attack)
      saw.frequency.setValueAtTime(baseFreq * 0.94, vowelStart);
      saw.frequency.exponentialRampToValueAtTime(baseFreq, vowelStart + 0.03);
      sq.frequency.setValueAtTime(baseFreq * 0.94, vowelStart);
      sq.frequency.exponentialRampToValueAtTime(baseFreq, vowelStart + 0.03);

      // Very subtle vibrato (children sing straighter)
      const vib = ctx.createOscillator();
      const vibG = ctx.createGain();
      vib.frequency.value = 4 + Math.random();
      vibG.gain.value = baseFreq * 0.005; // much less vibrato
      vib.connect(vibG);
      vibG.connect(saw.frequency);
      vib.start(vowelStart);
      vib.stop(vowelStart + vowelDur + 0.1);

      // Brighter lowpass — children have more high-frequency energy
      const soft = ctx.createBiquadFilter();
      soft.type = 'lowpass';
      soft.frequency.value = 5000;
      soft.Q.value = 0.3;

      // FORMANT 1 — wider Q = more natural, less nasal
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(syl.f1s, vowelStart);
      f1.frequency.linearRampToValueAtTime(syl.f1e, vowelStart + vowelDur * 0.3);
      f1.Q.value = 2.5;  // wider = warmer, less ghostly

      // FORMANT 2 — wider for child-like brightness
      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(syl.f2s, vowelStart);
      f2.frequency.linearRampToValueAtTime(syl.f2e, vowelStart + vowelDur * 0.3);
      f2.Q.value = 2;

      // Formant gains — balanced for clarity
      const f1g = ctx.createGain();
      f1g.gain.value = 2.5;
      const f2g = ctx.createGain();
      f2g.gain.value = 2.0;

      // Route: saw+sq → soft → (f1, f2) → envelope
      saw.connect(soft);
      sqGain.connect(soft);
      soft.connect(f1);
      soft.connect(f2);
      f1.connect(f1g);
      f2.connect(f2g);

      const vowelEnv = ctx.createGain();
      vowelEnv.gain.setValueAtTime(0, vowelStart);
      vowelEnv.gain.linearRampToValueAtTime(0.85, vowelStart + 0.01); // fast attack = child energy
      if (isLast) {
        // "SORT" — sustain and fade
        vowelEnv.gain.setValueAtTime(0.75, vowelStart + vowelDur * 0.4);
        vowelEnv.gain.linearRampToValueAtTime(0, vowelStart + vowelDur);
      } else {
        vowelEnv.gain.setValueAtTime(0.7, vowelStart + vowelDur * 0.3);
        vowelEnv.gain.exponentialRampToValueAtTime(0.001, vowelStart + vowelDur * 0.85);
      }

      f1g.connect(vowelEnv);
      f2g.connect(vowelEnv);
      vowelEnv.connect(choirBus);
      saw.start(vowelStart);
      saw.stop(vowelStart + vowelDur + 0.05);
      sq.start(vowelStart);
      sq.stop(vowelStart + vowelDur + 0.05);
      trackNode(saw, vowelEnv);

      // Pitch clarity: quiet sine following the same pitch
      const sine = ctx.createOscillator();
      sine.type = 'sine';
      sine.frequency.value = baseFreq;
      sine.detune.value = voiceDetune[voice];
      sine.frequency.setValueAtTime(baseFreq * 0.92, vowelStart);
      sine.frequency.exponentialRampToValueAtTime(baseFreq, vowelStart + 0.04);
      const vibG2 = ctx.createGain();
      vibG2.gain.value = baseFreq * 0.012;
      vib.connect(vibG2);
      vibG2.connect(sine.frequency);

      const sineEnv = ctx.createGain();
      sineEnv.gain.setValueAtTime(0, vowelStart);
      sineEnv.gain.linearRampToValueAtTime(0.25, vowelStart + 0.015); // stronger sine = clearer pitch
      if (isLast) {
        sineEnv.gain.linearRampToValueAtTime(0, vowelStart + vowelDur);
      } else {
        sineEnv.gain.exponentialRampToValueAtTime(0.001, vowelStart + vowelDur * 0.8);
      }
      sine.connect(sineEnv);
      sineEnv.connect(choirBus);
      sine.start(vowelStart);
      sine.stop(vowelStart + vowelDur + 0.05);
      trackNode(sine, sineEnv);

      // Ending /t/ on "sort" — sharp click
      if (isLast) {
        const tEnd = vowelStart + vowelDur - 0.03;
        const tLen = Math.floor(ctx.sampleRate * 0.025);
        const tBuf = ctx.createBuffer(1, tLen, ctx.sampleRate);
        const tData = tBuf.getChannelData(0);
        for (let i = 0; i < tLen; i++) tData[i] = Math.random() * 2 - 1;
        const tSrc = ctx.createBufferSource();
        tSrc.buffer = tBuf;
        const tBp = ctx.createBiquadFilter();
        tBp.type = 'bandpass';
        tBp.frequency.value = 4000;
        tBp.Q.value = 1;
        const tGain = ctx.createGain();
        tGain.gain.setValueAtTime(0.12, tEnd);
        tGain.gain.exponentialRampToValueAtTime(0.001, tEnd + 0.025);
        tSrc.connect(tBp);
        tBp.connect(tGain);
        tGain.connect(choirBus);
        tSrc.start(tEnd);
        tSrc.stop(tEnd + 0.03);
      }

      syllableTime += dur + 0.07;
    }
  }
}

// ── Main scheduler ───────────────────────────────────────────────────────

function scheduleBar(tier) {
  if (!_enabled || _currentTier !== tier || _crossfading) return;

  const config = TIER_CONFIG[tier] || TIER_CONFIG.EASY;
  const ctx = _ctx;
  if (!ctx) return;

  const barStart = ctx.currentTime + 0.05;
  const barDur = barDuration(config.bpm, config.beatsPerBar);

  // Trim old nodes
  if (_activeNodes.length > 200) _activeNodes = _activeNodes.slice(-100);

  // Core layers
  schedulePad(config, barStart);
  scheduleMelody(config, barStart);
  scheduleRhythm(config, barStart);
  scheduleBassLine(config, tier, barStart);

  // Orchestral layers
  scheduleChordStab(config, barStart);
  scheduleArpeggio(config, barStart);
  scheduleCounterMelody(config, barStart);
  scheduleHookRiff(config, tier, barStart);

  // Energy & dynamics
  scheduleFill(config, barStart);
  scheduleRiser(config, barStart);

  // Cat choir — "Kit-ty-sort!"
  scheduleCatChoir(config, barStart);

  _barIndex++;
  _scheduleId = setTimeout(() => scheduleBar(tier), barDur * 1000);
}

// ── Stop helpers ─────────────────────────────────────────────────────────

function stopActiveNodes(fadeTime) {
  const ctx = _ctx;
  if (!ctx) return;
  const now = ctx.currentTime;
  const fade = fadeTime || 0.5;

  _activeNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fade);
      osc.stop(now + fade + 0.1);
    } catch { /* already stopped */ }
  });
  _activeNodes = [];
}

function fullStop() {
  if (_scheduleId !== null) {
    clearTimeout(_scheduleId);
    _scheduleId = null;
  }
  stopActiveNodes(0.5);
  _currentTier = null;
  _barIndex = 0;
  _phraseIndex = -1;
  _phraseRepeat = 0;
  _scaleOffset = 0;
  _bassPatIndex = 0;
  _arpPatIndex = 0;
  _lastMelodyFreqs = [];
}

// ── Public API ────────────────────────────────────────────────────────────

export function startMusic(tier) {
  if (!_enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  if (_currentTier === tier) return;

  if (_currentTier !== null) {
    _crossfading = true;
    const now = ctx.currentTime;

    if (_scheduleId !== null) {
      clearTimeout(_scheduleId);
      _scheduleId = null;
    }
    _masterGain.gain.cancelScheduledValues(now);
    _masterGain.gain.setValueAtTime(_masterGain.gain.value, now);
    _masterGain.gain.linearRampToValueAtTime(0, now + 1.0);

    setTimeout(() => {
      stopActiveNodes(0);
      _barIndex = 0;
      _phraseIndex = -1;
      _scaleOffset = 0;
      _bassPatIndex = 0;
      _arpPatIndex = 0;
      _currentTier = tier;
      _crossfading = false;

      _masterGain.gain.setValueAtTime(0, _ctx.currentTime);
      _masterGain.gain.linearRampToValueAtTime(_volume, _ctx.currentTime + 1.0);
      scheduleBar(tier);
    }, 1050);
  } else {
    _currentTier = tier;
    _barIndex = 0;
    _phraseIndex = -1;
    _scaleOffset = 0;
    _bassPatIndex = 0;
    _arpPatIndex = 0;
    _masterGain.gain.setValueAtTime(0, ctx.currentTime);
    _masterGain.gain.linearRampToValueAtTime(_volume, ctx.currentTime + 0.5);
    scheduleBar(tier);
  }
}

export function stopMusic() {
  if (_crossfading) {
    _crossfading = false;
  }
  fullStop();
  if (_masterGain) {
    _masterGain.gain.cancelScheduledValues(_ctx.currentTime);
    _masterGain.gain.setValueAtTime(0, _ctx.currentTime);
  }
}

export function setMusicVolume(vol) {
  _volume = Math.max(0, Math.min(1, vol));
  if (_masterGain && !_crossfading) {
    _masterGain.gain.cancelScheduledValues(_ctx.currentTime);
    _masterGain.gain.setValueAtTime(_volume, _ctx.currentTime);
  }
}

export function getMusicVolume() { return _volume; }

export function setMusicEnabled(enabled) {
  _enabled = !!enabled;
  if (!_enabled) {
    stopMusic();
  }
}

export function isMusicEnabled() { return _enabled; }
