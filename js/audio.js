'use strict';

// ── Sound Engine ─────────────────────────────────────────────────────────
// Clean Web Audio API synthesizer for cat-themed sound effects.
// Replaces ZzFX with readable, debuggable code.

let _sfxVolume  = 0.7;
let _sfxEnabled = true;
let _ctx = null;

/** Return value ± spread%. e.g. randomize(100, 0.1) → 90-110 */
function randomize(v, spread) {
  return v * (1 + (Math.random() - 0.5) * spread);
}

/**
 * Create a bandpass formant filter connected source → filter → dest.
 * Returns the BiquadFilterNode so its frequency can be automated.
 */
function formant(ctx, freq, Q, source, dest) {
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = Q;
  source.connect(f);
  f.connect(dest);
  return f;
}

/** Create a white noise AudioBufferSourceNode. */
function makeNoise(ctx, dur) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

export function setSfxVolume(vol)      { _sfxVolume = Math.max(0, Math.min(1, vol)); }
export function getSfxVolume()         { return _sfxVolume; }
export function setSfxEnabled(enabled) { _sfxEnabled = !!enabled; }
export function isSfxEnabled()         { return _sfxEnabled; }

function getCtx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/**
 * Play a synthesized tone.
 * @param {number} freq — starting frequency in Hz
 * @param {number} dur — duration in seconds
 * @param {number} vol — volume 0-1
 * @param {object} opts — { slide, shape, noise, attack, decay }
 */
function tone(freq, dur, vol, opts = {}) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const {
    slide = 0,       // Hz per second frequency change
    shape = 'sine',  // 'sine'|'square'|'sawtooth'|'triangle'
    noise = false,   // white noise instead of oscillator
    attack = 0.01,   // attack time in seconds
    decay = dur,     // decay start time
  } = opts;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol * _sfxVolume, now + attack);
  gain.gain.setValueAtTime(vol * _sfxVolume, now + Math.min(decay, dur * 0.7));
  gain.gain.linearRampToValueAtTime(0, now + dur);
  gain.connect(ctx.destination);

  if (noise) {
    // White noise via buffer
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gain);
    src.start(now);
    src.stop(now + dur);
  } else {
    const osc = ctx.createOscillator();
    osc.type = shape;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide * dur, now + dur);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + dur);
  }
}

/**
 * Play a purring sound — rapid amplitude modulation of a low tone.
 */
function purr(dur, vol) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 28;  // low rumble

  // Tremolo via LFO modulating gain
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 26;  // purr vibration ~26 Hz
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.5;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(vol * _sfxVolume, now + 0.05);
  masterGain.gain.setValueAtTime(vol * _sfxVolume, now + dur * 0.7);
  masterGain.gain.linearRampToValueAtTime(0, now + dur);

  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  osc.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc.start(now);
  lfo.start(now);
  osc.stop(now + dur);
  lfo.stop(now + dur);
}

/**
 * Improved purr — sawtooth through bandpass + filtered noise + dual LFO.
 * @param {number} dur — duration in seconds
 * @param {number} vol — volume 0-1
 */
function purrV2(dur, vol) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const v = vol * _sfxVolume;
  const baseFreq = randomize(25, 0.08);

  // Master gain with breath rhythm (slow LFO)
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(v, now + 0.05);
  master.gain.setValueAtTime(v, now + dur - 0.2);
  master.gain.linearRampToValueAtTime(0, now + dur);
  master.connect(ctx.destination);

  // Breath LFO — slow volume swell ~0.5 Hz
  const breathLfo = ctx.createOscillator();
  breathLfo.frequency.value = randomize(0.5, 0.1);
  const breathGain = ctx.createGain();
  breathGain.gain.value = v * 0.15;
  breathLfo.connect(breathGain);
  breathGain.connect(master.gain);
  breathLfo.start(now);
  breathLfo.stop(now + dur);

  // Layer 1: Sawtooth → bandpass resonance body
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = baseFreq;
  const body = ctx.createBiquadFilter();
  body.type = 'bandpass';
  body.frequency.value = randomize(200, 0.1);
  body.Q.value = 3;
  osc.connect(body);
  body.connect(master);

  // Purr rattle — amplitude tremolo at ~25 Hz
  const rattleLfo = ctx.createOscillator();
  rattleLfo.frequency.value = randomize(25, 0.1);
  const rattleGain = ctx.createGain();
  rattleGain.gain.value = 0.4;
  rattleLfo.connect(rattleGain);
  rattleGain.connect(master.gain);
  rattleLfo.start(now);
  rattleLfo.stop(now + dur);

  // Layer 2: Filtered noise for breath texture
  const noise = makeNoise(ctx, dur);
  const noiseBp = ctx.createBiquadFilter();
  noiseBp.type = 'bandpass';
  noiseBp.frequency.value = randomize(280, 0.1);
  noiseBp.Q.value = 1.5;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.3;
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  osc.start(now);
  noise.start(now);
  osc.stop(now + dur);
  noise.stop(now + dur);
}

// ── Public API ────────────────────────────────────────────────────────────

export function playSound(name) {
  if (!_sfxEnabled) return;
  try {
    switch (name) {

      case 'select': {
        // Formant "Miau" — noise through 2 gliding bandpass filters
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.18, 0.15);
        const vol = 0.3 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.03);
        gain.gain.setValueAtTime(vol, now + dur - 0.05);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        // Noise source
        const noise = makeNoise(ctx, dur);

        // F1: 600→900 Hz — the "vowel body"
        const f1 = formant(ctx, randomize(600, 0.1), 5, noise, gain);
        f1.frequency.linearRampToValueAtTime(randomize(900, 0.1), now + dur);

        // F2: 1200→1600 Hz — the "brightness"
        const f2 = formant(ctx, randomize(1200, 0.1), 4, noise, gain);
        f2.frequency.linearRampToValueAtTime(randomize(1600, 0.1), now + dur);

        noise.start(now);
        noise.stop(now + dur);
        break;
      }

      case 'pop':
        // Gentle plop + tiny collar bell
        tone(180, 0.12, 0.3, { slide: -400 });
        setTimeout(() => tone(2400, 0.08, 0.12), 50);
        break;

      case 'invalid': {
        // Cat hiss — bandpass-filtered noise with sharp attack
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.12, 0.2);
        const vol = 0.25 * _sfxVolume;

        // Sharp attack, exponential decay
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        gain.connect(ctx.destination);

        const noise = makeNoise(ctx, dur);

        // Bandpass at ~4kHz for sibilance
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = randomize(4000, 0.15);
        bp.Q.value = 2;
        noise.connect(bp);

        // Highpass at 2kHz to remove low rumble
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;
        bp.connect(hp);
        hp.connect(gain);

        noise.start(now);
        noise.stop(now + dur);
        break;
      }

      case 'solved':
        // Satisfied purr + warm bell chime
        purrV2(0.4, 0.2);
        setTimeout(() => tone(880, 0.15, 0.2), 100);
        break;

      case 'tick':
        // Soft tick
        tone(700, 0.04, 0.15, { attack: 0.002 });
        break;

      case 'win':
        // Long purr + ascending bell melody
        purrV2(0.8, 0.18);
        setTimeout(() => tone(880,  0.18, 0.25), 100);
        setTimeout(() => tone(1100, 0.18, 0.25), 280);
        setTimeout(() => tone(1320, 0.22, 0.3),  450);
        break;

      case 'undo':
        // Soft "Mew" — downward slide
        tone(700, 0.1, 0.2, { slide: -4000 });
        break;

      case 'hint':
        // Curious "Prrt?" — upward chirp
        tone(350, 0.12, 0.22, { slide: 3000 });
        break;

      case 'cat_unlock':
        // Excited "Mrrp!" + jingle cascade
        tone(400, 0.12, 0.28, { slide: 3500 });
        setTimeout(() => tone(1200, 0.1, 0.18), 130);
        setTimeout(() => tone(1500, 0.1, 0.18), 250);
        setTimeout(() => tone(1800, 0.1, 0.18), 360);
        setTimeout(() => tone(2200, 0.12, 0.22), 470);
        break;

      default:
        break;
    }
  } catch { /* audio blocked or not supported */ }
}
