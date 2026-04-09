'use strict';

// ── Procedural Layered Music Engine v2 ────────────────────────────────
// Each tier has a distinct sonic identity:
//   EASY:   Music-box/glockenspiel, gentle waltz-like rhythm, major pentatonic
//   MEDIUM: Warm plucked synth, lo-fi groove, jazzy chords, syncopation
//   HARD:   Dark pulsing synth, driving 16th hats, minor key, bass pulses
//   EXPERT: Tense arpeggios, complex rhythms, dissonant clusters, fast
//   MASTER: Epic/cinematic, deep drones, polyrhythmic, dramatic swells

/* global AudioContext */

// ── Tier configurations ──────────────────────────────────────────────────
const TIER_CONFIG = {
  EASY: {
    root: 523.25,  // C5 — high, music-box range
    scale: [0, 2, 4, 7, 9],  // major pentatonic — always sounds nice
    bpm: 90,
    beatsPerBar: 3,  // waltz feel (3/4)
    melodyOsc: 'triangle',
    melodyVol: 0.18,
    melodyAttack: 0.005,
    melodyDecay: 0.7,
    padOsc: 'sine',
    padVol: 0.10,
    bassVol: 0.04,
    hatVol: 0.03,
    kickVol: 0.06,
    hatPattern: [1, 0, 0.5, 0, 0.7, 0],  // waltz: ONE two three
    kickPattern: [1, 0, 0, 0, 0, 0],
    melodyNoteDivision: 6,   // 6 notes per bar
    melodyRestChance: 0.35,
    melodySkipChance: 0.3,   // chance to skip individual notes (space)
    chords: [
      [0, 4, 7],     // I   (C)
      [0, 4, 7],     // I
      [5, 9, 12],    // IV  (F)
      [7, 11, 14],   // V   (G)
      [4, 7, 12],    // iii (E)
      [9, 12, 16],   // vi  (Am)
    ],
  },
  MEDIUM: {
    root: 196.00,  // G3 — warmer, lower
    scale: [0, 2, 4, 5, 7, 9, 10, 11],  // mixolydian — jazzy, soulful
    bpm: 95,
    beatsPerBar: 4,
    melodyOsc: 'custom_pluck',  // handled specially: sharp attack + fast decay
    melodyVol: 0.20,
    melodyAttack: 0.003,
    melodyDecay: 0.4,
    padOsc: 'triangle',
    padVol: 0.08,
    bassVol: 0.08,
    hatVol: 0.04,
    kickVol: 0.10,
    hatPattern: [0.8, 0.3, 0.6, 0.5, 0.9, 0.3, 0.6, 0.4],  // lo-fi shuffle
    kickPattern: [1, 0, 0, 0.6, 0, 0, 0.8, 0],
    melodyNoteDivision: 8,
    melodyRestChance: 0.25,
    melodySkipChance: 0.4,   // spacious, room to breathe
    chords: [
      [0, 4, 7, 10],   // G7
      [5, 9, 12, 16],  // Cmaj7
      [2, 5, 9, 12],   // Am7
      [7, 10, 14, 17],  // D9
      [0, 3, 7, 10],   // Gm7
      [5, 9, 12, 14],  // Cmaj9
    ],
  },
  HARD: {
    root: 146.83,  // D3 — dark, low
    scale: [0, 1, 3, 5, 7, 8, 10],  // phrygian — dark, Spanish tension
    bpm: 115,
    beatsPerBar: 4,
    melodyOsc: 'sawtooth',
    melodyVol: 0.10,
    melodyAttack: 0.01,
    melodyDecay: 0.5,
    padOsc: 'sawtooth',
    padVol: 0.05,
    bassVol: 0.10,
    hatVol: 0.05,
    kickVol: 0.12,
    hatPattern: [0.7, 0.3, 0.5, 0.3, 0.7, 0.4, 0.5, 0.3,
                 0.7, 0.3, 0.5, 0.3, 0.8, 0.4, 0.6, 0.3],  // 16th hats
    kickPattern: [1, 0, 0, 0, 0.7, 0, 0, 0.5,
                  0, 0, 1, 0, 0, 0.6, 0, 0],
    melodyNoteDivision: 8,
    melodyRestChance: 0.4,
    melodySkipChance: 0.2,
    chords: [
      [0, 3, 7],     // Dm
      [1, 5, 8],     // Eb (bII — phrygian color)
      [0, 3, 7],     // Dm
      [5, 8, 12],    // Gm
      [7, 10, 13],   // Am(b5)
      [1, 5, 8],     // Eb
    ],
  },
  EXPERT: {
    root: 110.00,  // A2 — deep, tense
    scale: [0, 1, 4, 5, 7, 8, 11],  // harmonic minor — exotic, urgent
    bpm: 128,
    beatsPerBar: 4,
    melodyOsc: 'square',
    melodyVol: 0.08,
    melodyAttack: 0.002,
    melodyDecay: 0.25,
    padOsc: 'sawtooth',
    padVol: 0.04,
    bassVol: 0.12,
    hatVol: 0.05,
    kickVol: 0.13,
    // Breakbeat-ish pattern
    hatPattern: [0.8, 0.3, 0.6, 0.2, 0.7, 0.5, 0.4, 0.3,
                 0.9, 0.2, 0.5, 0.4, 0.6, 0.3, 0.7, 0.5],
    kickPattern: [1, 0, 0, 0.4, 0, 0.7, 0, 0,
                  0.5, 0, 0, 0, 1, 0, 0.6, 0],
    melodyNoteDivision: 16,  // fast arpeggios
    melodyRestChance: 0.3,
    melodySkipChance: 0.15,
    chords: [
      [0, 4, 7],      // Am
      [1, 5, 8],      // Bb
      [0, 4, 7, 11],  // Am(maj7)
      [5, 8, 12],     // Dm
      [7, 11, 14],    // E
      [8, 11, 14],    // F
    ],
  },
  MASTER: {
    root: 82.41,   // E2 — rumbling, epic
    scale: [0, 2, 3, 5, 7, 8, 11],  // harmonic minor on E — dramatic
    bpm: 135,
    beatsPerBar: 4,
    melodyOsc: 'sawtooth',
    melodyVol: 0.07,
    melodyAttack: 0.01,
    melodyDecay: 0.35,
    padOsc: 'sawtooth',
    padVol: 0.04,
    bassVol: 0.14,
    hatVol: 0.05,
    kickVol: 0.14,
    // Polyrhythmic — groups of 3 over 4
    hatPattern: [0.8, 0.2, 0.5, 0.7, 0.2, 0.5, 0.8, 0.2,
                 0.6, 0.7, 0.2, 0.5, 0.8, 0.3, 0.5, 0.7],
    kickPattern: [1, 0, 0, 0, 0, 0.8, 0, 0,
                  0, 0, 1, 0, 0.7, 0, 0, 0.5],
    melodyNoteDivision: 12,
    melodyRestChance: 0.45,
    melodySkipChance: 0.3,
    chords: [
      [0, 3, 7],       // Em
      [0, 3, 7, 11],   // Em(maj7)
      [8, 12, 15],     // C
      [7, 11, 14],     // B
      [5, 8, 12],      // Am
      [3, 7, 10],      // G
    ],
  },
};

// ── Melody phrase shapes (contour patterns) ─────────────────────────────
// Each array describes relative motion: 0=repeat, positive=up, negative=down
// These get interpreted relative to scale, not chromatic
const PHRASE_SHAPES = [
  [0, 1, 2, 3, 2, 1, 0, -1],       // arch
  [0, 2, 1, 3, 2, 4, 3, 5],        // ascending zigzag
  [4, 3, 2, 1, 0, -1, 0, 1],       // descending settle
  [0, 3, 2, 0, -1, 1, 3, 0],       // leap and return
  [0, 0, 1, 1, 2, 2, 3, 3],        // paired steps up
  [3, 1, 3, 0, 2, -1, 1, 0],       // bouncy
  [0, 4, 0, 3, 0, 2, 0, 1],        // pedal point
  [0, -1, -2, -1, 0, 1, 2, 1],     // wave
  [0, 2, 4, 2, 0, -2, -4, -2],     // wide wave
  [4, 4, 3, 3, 2, 2, 1, 0],        // cascade pairs
  [0, 1, 0, 2, 0, 3, 0, 4],        // alternating rise
  [0, 3, 1, 4, 2, 5, 3, 6],        // thirds climbing
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
let _scaleOffset    = 0;   // wandering root for melody variety
let _activeNodes    = [];
let _crossfading    = false;

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
  // Convert a scale degree (0,1,2,...) to semitone offset
  const octave = Math.floor(degree / scale.length);
  const idx = ((degree % scale.length) + scale.length) % scale.length;
  return octave * 12 + scale[idx];
}

function barDuration(bpm, beatsPerBar) {
  return (60 / bpm) * beatsPerBar;
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
  const decay = duration * config.melodyDecay;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + attack);

  if (config.melodyOsc === 'custom_pluck') {
    // Pluck: instant attack, fast exponential decay
    gain.gain.setValueAtTime(vol, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(vol * 0.1, startTime + decay * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);
  } else {
    gain.gain.setValueAtTime(vol, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decay);
  }

  // Low-pass filter for softer timbres (EASY, MEDIUM)
  let dest = _masterGain;
  if (config.melodyOsc === 'triangle' || config.melodyOsc === 'custom_pluck') {
    // No filter needed for triangle
  } else if (config.melodyOsc === 'sawtooth' || config.melodyOsc === 'square') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000 + Math.random() * 1000;
    filter.Q.value = 1;
    filter.connect(_masterGain);
    dest = filter;
  }

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + decay + 0.05);
  _activeNodes.push({ osc, gain });

  // For pluck: add a quiet overtone for shimmer
  if (config.melodyOsc === 'custom_pluck') {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 3;  // 5th harmonic-ish
    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(vol * 0.15, startTime + 0.002);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + decay * 0.15);
    osc2.connect(gain2);
    gain2.connect(_masterGain);
    osc2.start(startTime);
    osc2.stop(startTime + decay * 0.2);
    _activeNodes.push({ osc: osc2, gain: gain2 });
  }
}

function scheduleMelody(config, barStart) {
  // Chance to rest entire bar
  if (Math.random() < config.melodyRestChance) return;

  // Pick a phrase shape different from last
  let idx;
  do {
    idx = Math.floor(Math.random() * PHRASE_SHAPES.length);
  } while (idx === _phraseIndex && PHRASE_SHAPES.length > 1);
  _phraseIndex = idx;

  const shape = PHRASE_SHAPES[idx];
  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const numNotes = config.melodyNoteDivision;
  const noteDur = barDur / numNotes;

  // Use chord for harmonic context
  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chordRoot = config.chords[chordIdx][0];

  // Slowly wandering offset for long-term variety
  if (_barIndex % 8 === 0) {
    _scaleOffset += Math.floor(Math.random() * 5) - 2;
    _scaleOffset = Math.max(-3, Math.min(3, _scaleOffset));
  }

  for (let i = 0; i < numNotes; i++) {
    // Chance to skip this note (rhythmic space)
    if (Math.random() < config.melodySkipChance) continue;

    const shapeIdx = Math.floor((i / numNotes) * shape.length);
    const degree = shape[shapeIdx] + _scaleOffset;

    // Convert scale degree to semitone, add chord root transposition
    const semi = scaleNoteToSemi(degree, config.scale) + chordRoot;
    let freq = semiToFreq(config.root, semi);

    // Keep in pleasant range
    while (freq < 150) freq *= 2;
    while (freq > 1400) freq /= 2;

    // Slight humanization of timing
    const jitter = (Math.random() - 0.5) * noteDur * 0.08;
    const t = barStart + i * noteDur + jitter;

    playMelodyNote(freq, noteDur, t, config);
  }
}

// ── Rhythm Layer ─────────────────────────────────────────────────────────

function playHiHat(startTime, vol, config) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.04;
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  // Different hat tone per tier
  hp.frequency.value = config.bpm > 120 ? 9000 : 7000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  src.connect(hp);
  hp.connect(gain);
  gain.connect(_masterGain);
  src.start(startTime);
  src.stop(startTime + dur + 0.01);
}

function playSoftKick(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.12;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, startTime);
  osc.frequency.exponentialRampToValueAtTime(40, startTime + dur);

  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.01);
}

function scheduleRhythm(config, barStart) {
  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const hatSteps = config.hatPattern.length;
  const kickSteps = config.kickPattern.length;
  const stepDur = barDur / hatSteps;

  for (let i = 0; i < hatSteps; i++) {
    const vol = config.hatPattern[i] * config.hatVol;
    if (vol < 0.005) continue;
    // Humanize
    if (Math.random() < 0.1) continue;
    const jitter = (Math.random() - 0.5) * stepDur * 0.05;
    playHiHat(barStart + i * stepDur + jitter, vol, config);
  }

  const kickStepDur = barDur / kickSteps;
  for (let i = 0; i < kickSteps; i++) {
    const vol = config.kickPattern[i] * config.kickVol;
    if (vol < 0.005) continue;
    playSoftKick(barStart + i * kickStepDur, vol);
  }
}

// ── Pad Layer ────────────────────────────────────────────────────────────

function schedulePad(config, barStart) {
  // Pad changes every 2 bars
  if (_barIndex % 2 !== 0) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const padDur = barDuration(config.bpm, config.beatsPerBar) * 2;
  const now = barStart;

  for (let n = 0; n < Math.min(chord.length, 3); n++) {
    const freq = semiToFreq(config.root, chord[n]);
    const detune = (Math.random() - 0.5) * 8;  // slight detuning for width

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = config.padOsc;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    // Filter for sawtooth/square pads
    let dest = _masterGain;
    if (config.padOsc === 'sawtooth' || config.padOsc === 'square') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600 + Math.random() * 400;
      filter.Q.value = 0.5;
      filter.connect(_masterGain);
      dest = filter;
    }

    const vol = config.padVol;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + padDur * 0.35);
    gain.gain.linearRampToValueAtTime(vol * 0.6, now + padDur * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + padDur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + padDur + 0.1);
    _activeNodes.push({ osc, gain });

    // Subtle octave shimmer
    if (n === 0 && config.padVol >= 0.06) {
      const oct = ctx.createOscillator();
      const octGain = ctx.createGain();
      oct.type = 'sine';
      oct.frequency.value = freq * 2;
      octGain.gain.setValueAtTime(0, now);
      octGain.gain.linearRampToValueAtTime(vol * 0.2, now + padDur * 0.4);
      octGain.gain.linearRampToValueAtTime(0, now + padDur);
      oct.connect(octGain);
      octGain.connect(_masterGain);
      oct.start(now);
      oct.stop(now + padDur + 0.1);
      _activeNodes.push({ osc: oct, gain: octGain });
    }
  }

  // Sub-bass
  const bassNote = chord[0];
  const bassFreq = semiToFreq(config.root, bassNote);
  // Keep bass in sub range
  let subFreq = bassFreq;
  while (subFreq > 120) subFreq /= 2;
  while (subFreq < 30) subFreq *= 2;

  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.value = subFreq;

  const bv = config.bassVol;
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(bv, now + padDur * 0.2);
  bassGain.gain.linearRampToValueAtTime(bv * 0.7, now + padDur * 0.7);
  bassGain.gain.linearRampToValueAtTime(0, now + padDur);

  bass.connect(bassGain);
  bassGain.connect(_masterGain);
  bass.start(now);
  bass.stop(now + padDur + 0.1);
  _activeNodes.push({ osc: bass, gain: bassGain });
}

// ── Bass line (MEDIUM+) ─────────────────────────────────────────────────

function scheduleBassLine(config, barStart) {
  if (config.bassVol < 0.07) return;  // only for tiers with prominent bass

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const rootSemi = chord[0];

  // Simple walking bass pattern: root, 5th, octave, 5th
  const bassPattern = [0, 7, 12, 7];
  const noteDur = barDur / bassPattern.length;

  for (let i = 0; i < bassPattern.length; i++) {
    if (Math.random() < 0.15) continue;  // occasional rest

    const semi = rootSemi + bassPattern[i];
    let freq = semiToFreq(config.root, semi);
    while (freq > 150) freq /= 2;
    while (freq < 40) freq *= 2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const vol = config.bassVol * 0.6;
    const t = barStart + i * noteDur;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.85);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(t);
    osc.stop(t + noteDur);
    _activeNodes.push({ osc, gain });
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

  // Clean up finished nodes
  const now = ctx.currentTime;
  _activeNodes = _activeNodes.filter(({ osc }) => {
    try { return osc.playbackState !== 3; } catch { return false; }
  });
  // Trim if too many nodes accumulated
  if (_activeNodes.length > 100) _activeNodes = _activeNodes.slice(-50);

  schedulePad(config, barStart);
  scheduleMelody(config, barStart);
  scheduleRhythm(config, barStart);
  scheduleBassLine(config, barStart);

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
  _scaleOffset = 0;
}

// ── Public API ────────────────────────────────────────────────────────────

export function startMusic(tier) {
  if (!_enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  if (_currentTier === tier) return;

  if (_currentTier !== null) {
    // Crossfade to new tier
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
