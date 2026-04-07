'use strict';

// ── Procedural Lo-Fi Ambient Music ───────────────────────────────────────
// Tier-specific chord progressions using Web Audio API sine oscillators.

/* global AudioContext */

// ── Chord progressions per tier ───────────────────────────────────────────
const PROGRESSIONS = {
  EASY: [
    [261.63, 329.63, 392.00],  // C major
    [293.66, 369.99, 440.00],  // D minor
    [349.23, 440.00, 523.25],  // F major
    [392.00, 493.88, 587.33],  // G major
  ],
  MEDIUM: [
    [261.63, 311.13, 392.00],  // C minor
    [311.13, 369.99, 466.16],  // Eb major
    [349.23, 415.30, 523.25],  // F minor
    [392.00, 466.16, 587.33],  // G minor
  ],
  HARD: [
    [220.00, 277.18, 329.63],  // A minor
    [246.94, 311.13, 369.99],  // B dim
    [261.63, 329.63, 415.30],  // C major#5
    [293.66, 349.23, 440.00],  // D minor
  ],
  EXPERT: [
    [185.00, 233.08, 293.66],  // F# minor
    [207.65, 261.63, 329.63],  // Ab major
    [220.00, 277.18, 349.23],  // A minor add9
    [246.94, 311.13, 392.00],  // B minor
  ],
  MASTER: [
    [174.61, 220.00, 277.18],  // F minor
    [196.00, 246.94, 311.13],  // G minor
    [207.65, 261.63, 329.63],  // Ab major
    [220.00, 277.18, 369.99],  // A minor7
  ],
};

const CHORD_DURATION = 3000; // ms per chord
const FADE_TIME      = 0.5;  // seconds for fade in/out

let _ctx         = null;
let _masterGain  = null;
let _volume      = 0.3;
let _enabled     = true;
let _currentTier = null;
let _scheduleId  = null;
let _chordIdx    = 0;
let _activeNodes = [];

function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = _volume;
      _masterGain.connect(_ctx.destination);
    } catch { /* no audio */ }
  }
  return _ctx;
}

function stopActiveNodes() {
  const ctx = _ctx;
  if (!ctx) return;
  const now = ctx.currentTime;
  _activeNodes.forEach(({ osc, gain }) => {
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + FADE_TIME);
      osc.stop(now + FADE_TIME + 0.1);
    } catch { /* already stopped */ }
  });
  _activeNodes = [];
}

function playChord(freqs) {
  const ctx = getCtx();
  if (!ctx || !_masterGain) return;
  const now = ctx.currentTime;

  freqs.forEach((freq, i) => {
    // Main oscillator
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = (i % 2 === 0 ? 3 : -3); // slight detune for warmth

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + FADE_TIME);
    gain.gain.setValueAtTime(0.18, now + CHORD_DURATION / 1000 - FADE_TIME);
    gain.gain.linearRampToValueAtTime(0, now + CHORD_DURATION / 1000);

    osc.connect(gain);
    gain.connect(_masterGain);
    osc.start(now);
    osc.stop(now + CHORD_DURATION / 1000 + 0.1);

    _activeNodes.push({ osc, gain });

    // Sub-bass at half frequency
    const bass     = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.value = freq / 2;

    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.07, now + FADE_TIME);
    bassGain.gain.setValueAtTime(0.07, now + CHORD_DURATION / 1000 - FADE_TIME);
    bassGain.gain.linearRampToValueAtTime(0, now + CHORD_DURATION / 1000);

    bass.connect(bassGain);
    bassGain.connect(_masterGain);
    bass.start(now);
    bass.stop(now + CHORD_DURATION / 1000 + 0.1);

    _activeNodes.push({ osc: bass, gain: bassGain });
  });
}

function scheduleNext(tier) {
  if (!_enabled || _currentTier !== tier) return;

  const progression = PROGRESSIONS[tier] || PROGRESSIONS.EASY;
  playChord(progression[_chordIdx % progression.length]);
  _chordIdx++;

  _scheduleId = setTimeout(() => scheduleNext(tier), CHORD_DURATION);
}

// ── Public API ────────────────────────────────────────────────────────────
export function startMusic(tier) {
  if (!_enabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Resume suspended context (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();

  if (_currentTier === tier) return; // already playing this tier

  stopMusic();
  _currentTier = tier;
  _chordIdx    = 0;
  scheduleNext(tier);
}

export function stopMusic() {
  if (_scheduleId !== null) {
    clearTimeout(_scheduleId);
    _scheduleId = null;
  }
  stopActiveNodes();
  _currentTier = null;
}

export function setMusicVolume(vol) {
  _volume = Math.max(0, Math.min(1, vol));
  if (_masterGain) _masterGain.gain.value = _volume;
}

export function getMusicVolume() { return _volume; }

export function setMusicEnabled(enabled) {
  _enabled = !!enabled;
  if (!_enabled) {
    stopMusic();
  }
}

export function isMusicEnabled() { return _enabled; }
