'use strict';

// ── Procedural Layered Music Engine v3 ────────────────────────────────
// Cheerful, upbeat puzzle game music. Each tier has its own feel but all
// are energetic and fun — think Tetris/Candy Crush, not spa ambient.
//
//   EASY:   Bouncy, bright, playful — major pentatonic, fast staccato
//   MEDIUM: Funky groove, syncopated, catchy — mixolydian swagger
//   HARD:   Driving energy, darker but exciting — dorian punch
//   EXPERT: Intense, fast arpeggios, rushing — harmonic minor urgency
//   MASTER: Epic & powerful, triumphant — dramatic, big chords

/* global AudioContext */

// ── Tier configurations ──────────────────────────────────────────────────
const TIER_CONFIG = {
  EASY: {
    root: 392.00,  // G4 — bright, cheerful register
    scale: [0, 2, 4, 7, 9],  // major pentatonic — instant happiness
    bpm: 138,
    beatsPerBar: 4,
    swing: 0.12,   // slight shuffle for bounciness
    melodyOsc: 'triangle',
    melodyVol: 0.22,
    melodyAttack: 0.003,
    melodyDecay: 0.35,  // short staccato = bouncy
    padOsc: 'triangle',
    padVol: 0.07,
    bassVol: 0.08,
    hatVol: 0.05,
    kickVol: 0.12,
    clapVol: 0.07,
    hatPattern:  [0.8, 0.4, 0.7, 0.3, 0.8, 0.4, 0.7, 0.3],  // steady 8ths
    kickPattern: [1, 0, 0, 0, 0.8, 0, 0, 0],  // four-on-floor kick
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0],    // clap on 2 & 4
    melodyNoteDivision: 8,
    melodyRestChance: 0.12,
    melodySkipChance: 0.15,
    chords: [
      [0, 4, 7],     // I   (G)
      [7, 11, 14],   // V   (D)
      [5, 9, 12],    // IV  (C)
      [7, 11, 14],   // V   (D)
      [0, 4, 7],     // I   (G)
      [2, 5, 9],     // vi  (Em) — brief tension
      [5, 9, 12],    // IV  (C)
      [7, 11, 14],   // V   (D) — resolve!
    ],
  },
  MEDIUM: {
    root: 293.66,  // D4 — warm but present
    scale: [0, 2, 4, 5, 7, 9, 10],  // mixolydian — funky, soulful
    bpm: 128,
    beatsPerBar: 4,
    swing: 0.18,   // more shuffle = groove
    melodyOsc: 'custom_pluck',
    melodyVol: 0.22,
    melodyAttack: 0.002,
    melodyDecay: 0.3,
    padOsc: 'triangle',
    padVol: 0.06,
    bassVol: 0.10,
    hatVol: 0.05,
    kickVol: 0.13,
    clapVol: 0.08,
    // Syncopated groove — off-beat emphasis
    hatPattern:  [0.6, 0.3, 0.8, 0.4, 0.6, 0.5, 0.9, 0.3,
                  0.6, 0.3, 0.8, 0.4, 0.7, 0.5, 0.8, 0.4],
    kickPattern: [1, 0, 0, 0.5, 0, 0, 0.8, 0,
                  0, 0.4, 0, 0, 1, 0, 0, 0.5],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0.3,
                  0, 0, 0, 0, 1, 0, 0, 0],
    melodyNoteDivision: 8,
    melodyRestChance: 0.10,
    melodySkipChance: 0.20,
    chords: [
      [0, 4, 7],      // D
      [0, 4, 7, 10],  // D7
      [5, 9, 12],     // G
      [7, 10, 14],    // A7
      [0, 4, 7],      // D
      [10, 14, 17],   // C  (bVII — mixolydian!)
      [5, 9, 12],     // G
      [7, 10, 14],    // A7
    ],
  },
  HARD: {
    root: 220.00,  // A3 — punchy, not too low
    scale: [0, 2, 3, 5, 7, 9, 10],  // dorian — minor but groovy, not sad
    bpm: 140,
    beatsPerBar: 4,
    swing: 0.05,   // straighter = more driving
    melodyOsc: 'sawtooth',
    melodyVol: 0.14,
    melodyAttack: 0.005,
    melodyDecay: 0.4,
    padOsc: 'sawtooth',
    padVol: 0.04,
    bassVol: 0.12,
    hatVol: 0.06,
    kickVol: 0.14,
    clapVol: 0.09,
    // Driving 16th hats with strong backbeat
    hatPattern:  [0.8, 0.3, 0.5, 0.3, 0.7, 0.3, 0.5, 0.4,
                  0.8, 0.3, 0.5, 0.3, 0.7, 0.3, 0.6, 0.3],
    kickPattern: [1, 0, 0, 0, 0, 0, 0.7, 0,
                  0, 0, 1, 0, 0, 0.5, 0, 0],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0,
                  0, 0, 0, 0, 1, 0, 0, 0.4],
    melodyNoteDivision: 8,
    melodyRestChance: 0.15,
    melodySkipChance: 0.12,
    chords: [
      [0, 3, 7],     // Am
      [5, 9, 12],    // Dm
      [0, 3, 7],     // Am
      [7, 10, 14],   // Em
      [3, 7, 10],    // C
      [5, 9, 12],    // Dm
      [8, 12, 15],   // F (bVI dorian brightness)
      [7, 10, 14],   // Em
    ],
  },
  EXPERT: {
    root: 164.81,  // E3 — deeper but fast = exciting
    scale: [0, 1, 4, 5, 7, 8, 11],  // harmonic minor — exotic, urgent
    bpm: 152,
    beatsPerBar: 4,
    swing: 0.0,    // dead straight = machine-like intensity
    melodyOsc: 'square',
    melodyVol: 0.10,
    melodyAttack: 0.001,
    melodyDecay: 0.2,  // very short = rapid-fire
    padOsc: 'sawtooth',
    padVol: 0.04,
    bassVol: 0.13,
    hatVol: 0.06,
    kickVol: 0.15,
    clapVol: 0.10,
    // Driving, relentless
    hatPattern:  [0.9, 0.4, 0.6, 0.3, 0.8, 0.5, 0.6, 0.4,
                  0.9, 0.3, 0.7, 0.4, 0.8, 0.5, 0.7, 0.3],
    kickPattern: [1, 0, 0, 0.4, 0, 0.7, 0, 0,
                  0.5, 0, 0, 0, 1, 0, 0.6, 0],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0,
                  0, 0, 0, 0, 1, 0, 0, 0.5],
    melodyNoteDivision: 16,  // fast arpeggios
    melodyRestChance: 0.15,
    melodySkipChance: 0.10,
    chords: [
      [0, 4, 7],      // E
      [5, 8, 12],     // Am
      [7, 11, 14],    // B
      [0, 4, 7],      // E
      [1, 5, 8],      // F (neapolitan color)
      [5, 8, 12],     // Am
      [7, 11, 14],    // B
      [0, 3, 7, 11],  // Em(maj7) — tension
    ],
  },
  MASTER: {
    root: 130.81,  // C3 — epic, powerful
    scale: [0, 2, 3, 5, 7, 9, 11],  // melodic minor — dramatic, cinematic
    bpm: 160,
    beatsPerBar: 4,
    swing: 0.0,
    melodyOsc: 'sawtooth',
    melodyVol: 0.11,
    melodyAttack: 0.005,
    melodyDecay: 0.3,
    padOsc: 'sawtooth',
    padVol: 0.05,
    bassVol: 0.14,
    hatVol: 0.06,
    kickVol: 0.16,
    clapVol: 0.11,
    // Powerful, pounding
    hatPattern:  [0.9, 0.5, 0.7, 0.4, 0.8, 0.5, 0.7, 0.5,
                  0.9, 0.4, 0.7, 0.5, 0.8, 0.5, 0.7, 0.4],
    kickPattern: [1, 0, 0, 0.5, 0, 0, 0.8, 0,
                  0, 0.4, 0, 0, 1, 0, 0, 0.6],
    clapPattern: [0, 0, 0, 0, 1, 0, 0, 0.3,
                  0, 0, 0, 0, 1, 0, 0.5, 0],
    melodyNoteDivision: 12,
    melodyRestChance: 0.18,
    melodySkipChance: 0.12,
    chords: [
      [0, 3, 7],      // Cm
      [7, 11, 14],    // G (dominant — drama!)
      [5, 8, 12],     // Fm
      [3, 7, 10],     // Eb (relative major lift)
      [0, 3, 7],      // Cm
      [8, 12, 15],    // Ab (bVI — epic)
      [5, 8, 12],     // Fm
      [7, 11, 14],    // G (back to tension)
    ],
  },
};

// ── Melody phrase shapes (contour patterns) ─────────────────────────────
// Upbeat, energetic shapes — more leaps, more ascending motion
const PHRASE_SHAPES = [
  [0, 2, 4, 5, 4, 2, 3, 5],        // rising arch
  [0, 3, 1, 4, 2, 5, 3, 6],        // thirds climbing — optimistic
  [0, 4, 2, 5, 3, 6, 4, 7],        // leaping up — exciting
  [5, 3, 5, 4, 6, 4, 7, 5],        // bouncing high
  [0, 0, 2, 2, 4, 4, 5, 7],        // paired steps up — building
  [0, 4, 0, 5, 0, 4, 0, 7],        // pedal point — rhythmic drive
  [7, 5, 6, 4, 5, 3, 4, 2],        // descending but stepwise — graceful
  [0, 2, 4, 7, 4, 5, 7, 9],        // major arpeggio up — triumphant
  [0, 1, 2, 3, 4, 5, 6, 7],        // scale run up — momentum
  [4, 2, 5, 3, 6, 4, 7, 5],        // zigzag rising — playful
  [0, 4, 7, 4, 0, 5, 9, 5],        // triad bounces — catchy
  [7, 7, 5, 5, 4, 4, 2, 0],        // cascade down — satisfying
  [0, 2, 0, 4, 0, 5, 0, 7],        // alternating root — dancey
  [3, 5, 7, 5, 3, 5, 7, 9],        // rocking up — energy
];

// ── Bass patterns per tier feel ────────────────────────────────────────
const BASS_PATTERNS = {
  EASY:   [[0, 7, 12, 7], [0, 0, 7, 7], [0, 4, 7, 12]],
  MEDIUM: [[0, 7, 5, 7], [0, 0, 12, 10], [0, 3, 5, 7], [0, 7, 0, 5]],
  HARD:   [[0, 0, 12, 0], [0, 5, 7, 5], [0, 0, 7, 12], [0, 12, 7, 0]],
  EXPERT: [[0, 12, 0, 7, 0, 12, 7, 0], [0, 7, 12, 7, 0, 5, 7, 12]],
  MASTER: [[0, 0, 12, 12, 0, 0, 7, 7], [0, 12, 7, 0, 5, 12, 7, 5]],
};

// ── State ────────────────────────────────────────────────────────────────
let _ctx            = null;
let _masterGain     = null;
let _volume         = 0.3;
let _enabled        = true;
let _currentTier    = null;
let _scheduleId     = null;
let _barIndex       = 0;
let _phraseIndex    = -1;
let _scaleOffset    = 0;
let _bassPatIndex   = 0;
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
    // Pluck: punchy attack, fast decay — percussive and catchy
    gain.gain.setValueAtTime(vol * 1.2, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, startTime + noteLen * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen);
  } else {
    gain.gain.setValueAtTime(vol, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteLen);
  }

  // Filter harsh oscillators
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

  // Octave double for brightness (triangle only)
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
  if (Math.random() < config.melodyRestChance) return;

  // Pick phrase shape
  let idx;
  do {
    idx = Math.floor(Math.random() * PHRASE_SHAPES.length);
  } while (idx === _phraseIndex && PHRASE_SHAPES.length > 1);
  _phraseIndex = idx;

  const shape = PHRASE_SHAPES[idx];
  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const numNotes = config.melodyNoteDivision;
  const noteDur = barDur / numNotes;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chordRoot = config.chords[chordIdx][0];

  // Wander every 8 bars
  if (_barIndex % 8 === 0) {
    _scaleOffset += Math.floor(Math.random() * 5) - 2;
    _scaleOffset = Math.max(-2, Math.min(4, _scaleOffset));
  }

  const swing = config.swing || 0;

  for (let i = 0; i < numNotes; i++) {
    if (Math.random() < config.melodySkipChance) continue;

    const shapeIdx = Math.floor((i / numNotes) * shape.length);
    const degree = shape[shapeIdx] + _scaleOffset;
    const semi = scaleNoteToSemi(degree, config.scale) + chordRoot;
    let freq = semiToFreq(config.root, semi);

    while (freq < 200) freq *= 2;
    while (freq > 1600) freq /= 2;

    // Swing: push off-beat notes slightly late
    let swingOffset = 0;
    if (i % 2 === 1) swingOffset = noteDur * swing;

    const jitter = (Math.random() - 0.5) * noteDur * 0.04;
    const t = barStart + i * noteDur + swingOffset + jitter;

    // Accent on strong beats
    const isStrong = (i % (numNotes / config.beatsPerBar)) === 0;
    if (isStrong) {
      // Temporarily boost volume for accented notes (handled via velocity)
    }

    playMelodyNote(freq, noteDur, t, config);
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

function playClap(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  // Clap = layered noise bursts
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
    const t = startTime + layer * 0.008;  // staggered = realistic clap
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

  // Punchy transient
  gain.gain.setValueAtTime(vol * 1.3, startTime);
  gain.gain.setValueAtTime(vol, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.01);

  // Click transient for attack
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
}

function scheduleRhythm(config, barStart) {
  const barDur = barDuration(config.bpm, config.beatsPerBar);
  const hatSteps = config.hatPattern.length;
  const stepDur = barDur / hatSteps;
  const swing = config.swing || 0;

  // Hi-hats
  for (let i = 0; i < hatSteps; i++) {
    const vol = config.hatPattern[i] * config.hatVol;
    if (vol < 0.003) continue;
    if (Math.random() < 0.06) continue;  // rare humanize skip

    let swingOffset = (i % 2 === 1) ? stepDur * swing : 0;
    const jitter = (Math.random() - 0.5) * stepDur * 0.03;
    playHiHat(barStart + i * stepDur + swingOffset + jitter, vol);
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
}

// ── Pad Layer ────────────────────────────────────────────────────────────

function schedulePad(config, barStart) {
  if (_barIndex % 2 !== 0) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const padDur = barDuration(config.bpm, config.beatsPerBar) * 2;
  const now = barStart;

  for (let n = 0; n < Math.min(chord.length, 3); n++) {
    const freq = semiToFreq(config.root, chord[n]);
    const detune = (Math.random() - 0.5) * 6;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = config.padOsc;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    let dest = _masterGain;
    if (config.padOsc === 'sawtooth' || config.padOsc === 'square') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800 + Math.random() * 400;
      filter.Q.value = 0.7;
      filter.connect(_masterGain);
      dest = filter;
    }

    const vol = config.padVol;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + padDur * 0.25);
    gain.gain.linearRampToValueAtTime(vol * 0.7, now + padDur * 0.6);
    gain.gain.linearRampToValueAtTime(0, now + padDur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + padDur + 0.1);
    trackNode(osc, gain);
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

  // Pick bass pattern, rotate every 4 bars
  const patterns = BASS_PATTERNS[tier] || BASS_PATTERNS.EASY;
  if (_barIndex % 4 === 0) {
    _bassPatIndex = (_bassPatIndex + 1) % patterns.length;
  }
  const pattern = patterns[_bassPatIndex];
  const noteDur = barDur / pattern.length;
  const swing = config.swing || 0;

  for (let i = 0; i < pattern.length; i++) {
    if (Math.random() < 0.08) continue;

    const semi = rootSemi + pattern[i];
    let freq = semiToFreq(config.root, semi);
    while (freq > 180) freq /= 2;
    while (freq < 35) freq *= 2;

    let swingOffset = (i % 2 === 1) ? noteDur * swing : 0;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const vol = config.bassVol * 0.7;
    const t = barStart + i * noteDur + swingOffset;

    // Punchy bass envelope
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.setValueAtTime(vol * 0.8, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 0.8);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(t);
    osc.stop(t + noteDur);
    trackNode(osc, gain);
  }
}

// ── Chord stab (accent on bar 1 of every 4 bars) ────────────────────────

function scheduleChordStab(config, barStart) {
  if (_barIndex % 4 !== 0) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const stabDur = 0.15;

  for (const semi of chord.slice(0, 3)) {
    let freq = semiToFreq(config.root, semi);
    while (freq < 250) freq *= 2;
    while (freq > 1200) freq /= 2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const vol = 0.10;
    gain.gain.setValueAtTime(vol, barStart);
    gain.gain.exponentialRampToValueAtTime(0.001, barStart + stabDur);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(barStart);
    osc.stop(barStart + stabDur + 0.02);
    trackNode(osc, gain);
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
  if (_activeNodes.length > 120) _activeNodes = _activeNodes.slice(-60);

  schedulePad(config, barStart);
  scheduleMelody(config, barStart);
  scheduleRhythm(config, barStart);
  scheduleBassLine(config, tier, barStart);
  scheduleChordStab(config, barStart);

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
  _bassPatIndex = 0;
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
