'use strict';

// ── ZzFX — Micro Sound Effects Library (v2.0.0 minimal embed) ────────────
// Original by Frank Force — https://github.com/KilledByAPixel/ZzFX
// Trimmed to the minimum needed for playback only.
/* global AudioContext */

let _sfxVolume  = 0.7;
let _sfxEnabled = true;

export function setSfxVolume(vol)      { _sfxVolume = Math.max(0, Math.min(1, vol)); }
export function getSfxVolume()         { return _sfxVolume; }
export function setSfxEnabled(enabled) { _sfxEnabled = !!enabled; }
export function isSfxEnabled()         { return _sfxEnabled; }

let _ctx = null;
function audioCtx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
  }
  return _ctx;
}

/**
 * Minimal ZzFX sound player.
 * Parameters (all optional): [volume, randomness, frequency, attack, sustain, release, shape,
 *   shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation,
 *   bitCrush, delay, sustainVolume, decay, tremolo]
 */
function zzfx(...p) {
  const ctx = audioCtx();
  if (!ctx) return;

  // Defaults
  let [
    volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0,
    release = 0.1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
    pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0,
    modulation = 0, bitCrush = 0, delay = 0, sustainVolume = 1,
    decay = 0, tremolo = 0,
  ] = p;

  // Randomise frequency slightly
  frequency *= 1 + randomness * (Math.random() * 2 - 1);

  const sampleRate = ctx.sampleRate;
  const attackTime  = attack  * sampleRate;
  const sustainTime = sustain * sampleRate;
  const decayTime   = decay   * sampleRate;
  const releaseTime = release * sampleRate;
  const totalTime   = attackTime + sustainTime + decayTime + releaseTime + 9;
  const buffer      = ctx.createBuffer(1, totalTime, sampleRate);
  const data        = buffer.getChannelData(0);

  let freq   = frequency;
  let phase  = 0;
  let sampleIdx = 0;

  for (let i = 0; i < totalTime; i++) {
    const t = i / sampleRate;
    // Envelope
    let env;
    if (i < attackTime)
      env = i / attackTime;
    else if (i < attackTime + sustainTime)
      env = 1;
    else if (i < attackTime + sustainTime + decayTime)
      env = 1 - (i - attackTime - sustainTime) / decayTime * (1 - sustainVolume);
    else
      env = sustainVolume * (1 - (i - attackTime - sustainTime - decayTime) / releaseTime);

    env = Math.max(0, env);

    freq  += slide / sampleRate;
    freq  *= 1 + deltaSlide / sampleRate;
    phase += (Math.PI * 2 * freq) / sampleRate;

    let s;
    if (shape === 1)      s = phase % (Math.PI * 2) < Math.PI ? 1 : -1; // square
    else if (shape === 2) s = 1 - (phase % (Math.PI * 2)) / Math.PI;    // sawtooth
    else if (shape === 3) s = Math.abs((phase % (Math.PI * 2)) / Math.PI - 1) * 2 - 1; // triangle
    else                  s = Math.sin(phase);                            // sine

    data[i] = s * env * volume;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}

// ── Warm arpeggio helper ──────────────────────────────────────────────────
function playArpeggio(notes, interval) {
  const v = _sfxVolume;
  notes.forEach(([freq, delay]) => {
    setTimeout(() => zzfx(0.4 * v, 0.01, freq, 0.01, 0.08, 0.25, 0, 1, 0), delay);
  });
}

// ── Public API ────────────────────────────────────────────────────────────
export function playSound(name) {
  if (!_sfxEnabled) return;
  const v = _sfxVolume;
  try {
    switch (name) {
      case 'select':
        // Soft click — short sine blip at 600 Hz
        zzfx(0.3 * v, 0.02, 600, 0, 0.01, 0.06, 0, 1, 0);
        break;
      case 'pop':
        // Gentle plop — low sine drop at 180 Hz
        zzfx(0.35 * v, 0.03, 180, 0, 0.02, 0.12, 0, 1, -30);
        break;
      case 'invalid':
        // Short hiss — noisy burst at 100 Hz
        zzfx(0.25 * v, 0.05, 100, 0, 0.01, 0.08, 0, 0.5, 0, 0, 0, 0, 0, 0.4);
        break;
      case 'solved':
        // Warm chime at 440 Hz with slight sustain
        zzfx(0.5 * v, 0.01, 440, 0.02, 0.1, 0.3, 0, 1, 0);
        break;
      case 'tick':
        // Soft tick at 700 Hz — very short
        zzfx(0.2 * v, 0.01, 700, 0, 0.005, 0.04, 0, 1, 0);
        break;
      case 'win':
        // Warm arpeggio A4 → C#5 → E5 (440 → 554 → 659)
        playArpeggio([[440, 0], [554, 140], [659, 280]], 140);
        break;
      default:
        break;
    }
  } catch { /* audio blocked or not supported */ }
}
