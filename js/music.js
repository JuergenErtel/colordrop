'use strict';

// ── Procedural Layered Music Engine ─────────────────────────────────────
// Three layers: melody (triangle/glockenspiel), pad (sine chords), rhythm (noise hats + sine kick).
// Tier-specific key, tempo, and mood. Random melody patterns for variety.

/* global AudioContext */

// ── Melody patterns (relative semitone intervals) ────────────────────────
const MELODY_PATTERNS = [
  [0, 4, 7, 12, 7, 4],           // Aufwärts-Arpeggio
  [12, 10, 7, 5, 4, 0],          // Abwärts-Lauf
  [0, 2, 4, 7, 4, 2, 0],         // Wellenbewegung
  [7, 5, 7, 12, 10, 7],          // Hüpfend
  [0, 0, 4, 4, 7, 7, 12],        // Stufenweise Paare
  [4, 7, 12, 11, 12, 7],         // Verspieltes Pendeln
  [0, 7, 4, 12, 7, 0],           // Große Sprünge
  [12, 7, 9, 5, 7, 4, 0],        // Absteigende Melodie
];

// ── Tier configurations ──────────────────────────────────────────────────
// root: base frequency (Hz), scale: semitone steps, bpm, density (rhythm fill 0-1)
// chords: arrays of semitone offsets from root for each chord
const TIER_CONFIG = {
  EASY: {
    root: 261.63,  // C4
    scale: [0, 2, 4, 5, 7, 9, 11], // C major
    bpm: 110,
    density: 0.6,
    chords: [
      [0, 4, 7],    // C
      [5, 9, 12],   // F
      [7, 11, 14],  // G
      [9, 12, 16],  // Am
      [0, 4, 7],    // C
      [5, 9, 14],   // F add9
    ],
  },
  MEDIUM: {
    root: 196.00,  // G3
    scale: [0, 2, 4, 5, 7, 9, 11], // G major
    bpm: 115,
    density: 0.7,
    chords: [
      [0, 4, 7],    // G
      [5, 9, 12],   // C
      [2, 5, 9],    // Am
      [7, 11, 14],  // D
      [9, 12, 16],  // Em
      [5, 9, 12],   // C
    ],
  },
  HARD: {
    root: 293.66,  // D4
    scale: [0, 2, 3, 5, 7, 8, 10], // D minor
    bpm: 120,
    density: 0.75,
    chords: [
      [0, 3, 7],    // Dm
      [5, 8, 12],   // Gm
      [3, 7, 10],   // F
      [7, 10, 14],  // Am
      [8, 12, 15],  // Bb
      [0, 3, 7],    // Dm
    ],
  },
  EXPERT: {
    root: 220.00,  // A3
    scale: [0, 2, 3, 5, 7, 8, 10], // A minor
    bpm: 125,
    density: 0.85,
    chords: [
      [0, 3, 7],    // Am
      [3, 7, 10],   // C
      [5, 8, 12],   // Dm
      [7, 10, 14],  // Em
      [8, 12, 15],  // F
      [3, 7, 12],   // C (octave)
    ],
  },
  MASTER: {
    root: 164.81,  // E3
    scale: [0, 2, 3, 5, 7, 8, 10], // E minor
    bpm: 130,
    density: 0.95,
    chords: [
      [0, 3, 7],    // Em
      [5, 8, 12],   // Am
      [7, 10, 14],  // Bm
      [3, 7, 10],   // G
      [8, 12, 15],  // C
      [0, 3, 7],    // Em
    ],
  },
};

// ── State ────────────────────────────────────────────────────────────────
let _ctx            = null;
let _masterGain     = null;
let _volume         = 0.3;
let _enabled        = true;
let _currentTier    = null;
let _scheduleId     = null;
let _barIndex       = 0;
let _lastPatternIdx = -1;
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

/** Convert semitone offset from root to frequency. */
function semiToFreq(root, semi) {
  return root * Math.pow(2, semi / 12);
}

/** Snap a semitone interval to the nearest note in the scale. */
function snapToScale(semi, scale) {
  const octave = Math.floor(semi / 12) * 12;
  const note = ((semi % 12) + 12) % 12;
  let best = scale[0];
  let bestDist = 99;
  for (const s of scale) {
    const d = Math.abs(s - note);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return octave + best;
}

/** Bar duration in seconds. */
function barDuration(bpm) {
  return 240 / bpm; // 4 beats
}

// ── Melody Layer ─────────────────────────────────────────────────────────

function playMelodyNote(freq, duration, startTime) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const vol = 0.15;
  const attack = 0.02;
  const noteDecay = duration * 0.8;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + attack);
  gain.gain.setValueAtTime(vol, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDecay);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(startTime);
  osc.stop(startTime + noteDecay + 0.05);
}

function scheduleMelody(tier, config, barStart) {
  // 30% chance to rest this bar
  if (Math.random() < 0.3) return;

  // Pick a pattern different from last
  let idx;
  do {
    idx = Math.floor(Math.random() * MELODY_PATTERNS.length);
  } while (idx === _lastPatternIdx && MELODY_PATTERNS.length > 1);
  _lastPatternIdx = idx;

  const pattern = MELODY_PATTERNS[idx];
  const barDur = barDuration(config.bpm);
  const noteDur = barDur / pattern.length;

  // Use current chord root for transposition
  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chordRoot = config.chords[chordIdx][0]; // lowest note of chord

  for (let i = 0; i < pattern.length; i++) {
    const semi = snapToScale(pattern[i] + chordRoot, config.scale);
    const freq = semiToFreq(config.root, semi);
    // Keep melody in a pleasant range (200-1200 Hz)
    const clampedFreq = freq < 200 ? freq * 2 : (freq > 1200 ? freq / 2 : freq);
    const t = barStart + i * noteDur;
    playMelodyNote(clampedFreq, noteDur, t);
  }
}

// ── Rhythm Layer ─────────────────────────────────────────────────────────

function playHiHat(startTime, vol) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.05;
  const bufLen = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 8000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  src.connect(hp);
  hp.connect(gain);
  gain.connect(_masterGain);
  src.start(startTime);
  src.stop(startTime + dur + 0.01);
}

function playSoftKick(startTime) {
  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const dur = 0.1;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, startTime);
  osc.frequency.exponentialRampToValueAtTime(50, startTime + dur);

  gain.gain.setValueAtTime(0.12, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

  osc.connect(gain);
  gain.connect(_masterGain);
  osc.start(startTime);
  osc.stop(startTime + dur + 0.01);
}

function scheduleRhythm(config, barStart) {
  const barDur = barDuration(config.bpm);
  const eighthDur = barDur / 8;

  for (let i = 0; i < 8; i++) {
    const t = barStart + i * eighthDur;
    const isOnBeat = i % 2 === 0;
    const isStrongBeat = i === 0 || i === 4;

    // Hi-hat volume based on position
    let hatVol;
    if (isStrongBeat)    hatVol = 0.06;
    else if (isOnBeat)   hatVol = 0.06 * 0.6;
    else                 hatVol = 0.06 * 0.3;

    // Humanize: chance to skip off-beats
    if (!isOnBeat && Math.random() > config.density) continue;
    // Even on-beats can occasionally be skipped for feel
    if (!isStrongBeat && Math.random() < 0.08) continue;

    playHiHat(t, hatVol);
  }

  // Soft kick on beat 1 and 3
  playSoftKick(barStart);
  playSoftKick(barStart + barDur / 2);
}

// ── Pad Layer ────────────────────────────────────────────────────────────

function schedulePad(config, barStart) {
  // Pad changes every 2 bars
  if (_barIndex % 2 !== 0) return;

  const ctx = _ctx;
  if (!ctx || !_masterGain) return;

  const chordIdx = Math.floor(_barIndex / 2) % config.chords.length;
  const chord = config.chords[chordIdx];
  const padDur = barDuration(config.bpm) * 2; // 2 bars
  const now = barStart;

  for (let n = 0; n < chord.length; n++) {
    const freq = semiToFreq(config.root, chord[n]);
    const detune = (n % 2 === 0) ? 3 : -3;

    // Main pad note
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;

    // Breathing envelope: swell up then down
    const peakVol = 0.14;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peakVol, now + padDur * 0.4);
    gain.gain.linearRampToValueAtTime(peakVol * 0.7, now + padDur * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + padDur);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(now);
    osc.stop(now + padDur + 0.1);
    _activeNodes.push({ osc, gain });

    // Octave overtone (quieter)
    const oct = ctx.createOscillator();
    const octGain = ctx.createGain();
    oct.type = 'sine';
    oct.frequency.value = freq * 2;

    octGain.gain.setValueAtTime(0, now);
    octGain.gain.linearRampToValueAtTime(0.04, now + padDur * 0.4);
    octGain.gain.linearRampToValueAtTime(0.025, now + padDur * 0.7);
    octGain.gain.linearRampToValueAtTime(0, now + padDur);

    oct.connect(octGain);
    octGain.connect(_masterGain);
    oct.start(now);
    oct.stop(now + padDur + 0.1);
    _activeNodes.push({ osc: oct, gain: octGain });
  }

  // Sub-bass: lowest chord note / 2
  const bassFreq = semiToFreq(config.root, chord[0]) / 2;
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.value = bassFreq;

  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.06, now + padDur * 0.3);
  bassGain.gain.linearRampToValueAtTime(0.04, now + padDur * 0.7);
  bassGain.gain.linearRampToValueAtTime(0, now + padDur);

  bass.connect(bassGain);
  bassGain.connect(_masterGain);
  bass.start(now);
  bass.stop(now + padDur + 0.1);
  _activeNodes.push({ osc: bass, gain: bassGain });
}

// ── Main scheduler ───────────────────────────────────────────────────────

function scheduleBar(tier) {
  if (!_enabled || _currentTier !== tier || _crossfading) return;

  const config = TIER_CONFIG[tier] || TIER_CONFIG.EASY;
  const ctx = _ctx;
  if (!ctx) return;

  const barStart = ctx.currentTime + 0.05; // small lookahead
  const barDur = barDuration(config.bpm);

  // Clean up finished nodes
  _activeNodes = _activeNodes.filter(({ osc }) => {
    try { return osc.context.currentTime < osc._stopTime; } catch { return false; }
  });

  schedulePad(config, barStart);
  scheduleMelody(tier, config, barStart);
  scheduleRhythm(config, barStart);

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
  _lastPatternIdx = -1;
}

// ── Public API ────────────────────────────────────────────────────────────

export function startMusic(tier) {
  if (!_enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  if (_currentTier === tier) return; // already playing this tier

  if (_currentTier !== null) {
    // Crossfade to new tier
    _crossfading = true;
    const now = ctx.currentTime;

    // Fade out current
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
      _lastPatternIdx = -1;
      _currentTier = tier;
      _crossfading = false;

      // Fade in new
      _masterGain.gain.setValueAtTime(0, _ctx.currentTime);
      _masterGain.gain.linearRampToValueAtTime(_volume, _ctx.currentTime + 1.0);
      scheduleBar(tier);
    }, 1050);
  } else {
    // Fresh start
    _currentTier = tier;
    _barIndex = 0;
    _lastPatternIdx = -1;
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
