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
 * Purr — sawtooth through bandpass + filtered noise + dual LFO.
 * @param {number} dur — duration in seconds
 * @param {number} vol — volume 0-1
 */
function purr(dur, vol) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const v = vol * _sfxVolume;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(v, now + 0.05);
  master.gain.setValueAtTime(v, now + dur - 0.15);
  master.gain.linearRampToValueAtTime(0, now + dur);
  master.connect(ctx.destination);

  // Purr rattle — amplitude tremolo at ~25 Hz
  const rattleLfo = ctx.createOscillator();
  rattleLfo.frequency.value = randomize(25, 0.1);
  const rattleGain = ctx.createGain();
  rattleGain.gain.value = 0.5;
  rattleLfo.connect(rattleGain);
  rattleGain.connect(master.gain);
  rattleLfo.start(now);
  rattleLfo.stop(now + dur);

  // Layer 1: Sawtooth at audible freq through bandpass body
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = randomize(80, 0.08);
  const body = ctx.createBiquadFilter();
  body.type = 'bandpass';
  body.frequency.value = randomize(350, 0.1);
  body.Q.value = 2;
  osc.connect(body);
  body.connect(master);

  // Layer 2: Second harmonic for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = randomize(160, 0.08);
  const body2 = ctx.createBiquadFilter();
  body2.type = 'bandpass';
  body2.frequency.value = randomize(500, 0.1);
  body2.Q.value = 3;
  const g2 = ctx.createGain();
  g2.gain.value = 0.4;
  osc2.connect(body2);
  body2.connect(g2);
  g2.connect(master);

  osc.start(now);
  osc2.start(now);
  osc.stop(now + dur);
  osc2.stop(now + dur);
}

// ── Public API ────────────────────────────────────────────────────────────

export function playSound(name) {
  if (!_sfxEnabled) return;
  try {
    switch (name) {

      case 'select': {
        // Formant "Miau" — sawtooth through 2 gliding bandpass filters + vibrato
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.3, 0.15);
        const vol = 0.35 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.03);
        gain.gain.setValueAtTime(vol, now + dur - 0.08);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        // Voiced source — sawtooth with pitch glide ("mi-au" syllables)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(randomize(480, 0.1), now);
        osc.frequency.linearRampToValueAtTime(randomize(650, 0.1), now + dur * 0.4);
        osc.frequency.linearRampToValueAtTime(randomize(550, 0.1), now + dur);

        // Vibrato ~6 Hz
        const vib = ctx.createOscillator();
        vib.frequency.value = 6;
        const vibGain = ctx.createGain();
        vibGain.gain.value = 15;
        vib.connect(vibGain);
        vibGain.connect(osc.frequency);
        vib.start(now);
        vib.stop(now + dur);

        // F1: 700→1000 Hz — vowel body
        const f1 = formant(ctx, randomize(700, 0.1), 8, osc, gain);
        f1.frequency.linearRampToValueAtTime(randomize(1000, 0.1), now + dur);

        // F2: 1400→1800 Hz — brightness
        const f2 = formant(ctx, randomize(1400, 0.1), 6, osc, gain);
        f2.frequency.linearRampToValueAtTime(randomize(1800, 0.1), now + dur);

        osc.start(now);
        osc.stop(now + dur);
        break;
      }

      case 'pop':
        // Gentle plop + tiny collar bell
        tone(180, 0.12, 0.3, { slide: -400 });
        setTimeout(() => tone(2400, 0.08, 0.12), 50);
        break;

      case 'invalid': {
        // Cat hiss — 3 layers: growl+jitter, breathy mid, sharp sibilance
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.5, 0.15);
        const vol = 0.4 * _sfxVolume;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(vol, now + 0.008);
        master.gain.setValueAtTime(vol, now + 0.15);
        master.gain.exponentialRampToValueAtTime(0.001, now + dur);
        master.connect(ctx.destination);

        // Layer 1: Guttural growl with jitter for roughness
        const growl = ctx.createOscillator();
        growl.type = 'sawtooth';
        growl.frequency.setValueAtTime(randomize(600, 0.1), now);
        growl.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        const jitter = ctx.createOscillator();
        jitter.frequency.value = randomize(70, 0.1);
        const jitterG = ctx.createGain();
        jitterG.gain.value = 80;
        jitter.connect(jitterG);
        jitterG.connect(growl.frequency);
        const growlBp = ctx.createBiquadFilter();
        growlBp.type = 'bandpass';
        growlBp.frequency.value = randomize(500, 0.1);
        growlBp.Q.value = 4;
        const growlVol = ctx.createGain();
        growlVol.gain.setValueAtTime(0.7, now);
        growlVol.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        growl.connect(growlBp);
        growlBp.connect(growlVol);
        growlVol.connect(master);

        // Layer 2: Breathy mid — noise through vocal-range bandpass
        const noise1 = makeNoise(ctx, dur);
        const midBp = ctx.createBiquadFilter();
        midBp.type = 'bandpass';
        midBp.frequency.setValueAtTime(randomize(2000, 0.1), now);
        midBp.frequency.linearRampToValueAtTime(randomize(1200, 0.1), now + dur);
        midBp.Q.value = 2;
        const midVol = ctx.createGain();
        midVol.gain.value = 0.5;
        noise1.connect(midBp);
        midBp.connect(midVol);
        midVol.connect(master);

        // Layer 3: Sharp sibilance — high noise
        const noise2 = makeNoise(ctx, dur);
        const hiBp = ctx.createBiquadFilter();
        hiBp.type = 'bandpass';
        hiBp.frequency.value = randomize(6000, 0.1);
        hiBp.Q.value = 0.8;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 3000;
        const hiVol = ctx.createGain();
        hiVol.gain.setValueAtTime(0, now);
        hiVol.gain.linearRampToValueAtTime(0.6, now + 0.05);
        noise2.connect(hiBp);
        hiBp.connect(hp);
        hp.connect(hiVol);
        hiVol.connect(master);

        growl.start(now);
        jitter.start(now);
        noise1.start(now);
        noise2.start(now);
        growl.stop(now + 0.25);
        jitter.stop(now + 0.25);
        noise1.stop(now + dur);
        noise2.stop(now + dur);
        break;
      }

      case 'solved':
        // Satisfied purr + warm bell chime
        purr(0.4, 0.2);
        setTimeout(() => tone(880, 0.15, 0.2), 100);
        break;

      case 'tick':
        // Soft tick
        tone(700, 0.04, 0.15, { attack: 0.002 });
        break;

      case 'win':
        // Long purr + ascending bell melody
        purr(0.8, 0.18);
        setTimeout(() => tone(880,  0.18, 0.25), 100);
        setTimeout(() => tone(1100, 0.18, 0.25), 280);
        setTimeout(() => tone(1320, 0.22, 0.3),  450);
        break;

      case 'undo': {
        // Soft "Mew" — thin sawtooth formant gliding down
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.18, 0.15);
        const vol = 0.25 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.02);
        gain.gain.setValueAtTime(vol, now + dur - 0.04);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        // Voiced source — higher pitch, descending
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(randomize(620, 0.1), now);
        osc.frequency.linearRampToValueAtTime(randomize(420, 0.1), now + dur);

        // Single thin formant gliding down — disappointed small cat
        const f1 = formant(ctx, randomize(1200, 0.1), 8, osc, gain);
        f1.frequency.linearRampToValueAtTime(randomize(800, 0.1), now + dur);

        osc.start(now);
        osc.stop(now + dur);
        break;
      }

      case 'hint': {
        // Curious "Prrt?" — sawtooth chirp with questioning rise
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.2, 0.1);
        const vol = 0.25 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.01);
        gain.gain.setValueAtTime(vol, now + dur - 0.05);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        // Voiced source — rising pitch with question-mark uptick
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(randomize(350, 0.1), now);
        osc.frequency.linearRampToValueAtTime(randomize(500, 0.1), now + dur * 0.6);
        osc.frequency.linearRampToValueAtTime(randomize(700, 0.1), now + dur);

        // F1: questioning upglide
        const f1 = formant(ctx, randomize(500, 0.1), 6, osc, gain);
        f1.frequency.linearRampToValueAtTime(randomize(900, 0.1), now + dur);

        // F2: brightness
        const f2 = formant(ctx, randomize(1100, 0.1), 4, osc, gain);
        f2.frequency.linearRampToValueAtTime(randomize(1600, 0.1), now + dur);

        osc.start(now);
        osc.stop(now + dur);
        break;
      }

      case 'cat_unlock': {
        // Excited "Mrrp!" — trilling sawtooth formant sweep + jingle cascade
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.25, 0.1);
        const vol = 0.3 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.01);
        gain.gain.setValueAtTime(vol, now + dur - 0.08);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        // Voiced source — fast rising pitch
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(randomize(400, 0.12), now);
        osc.frequency.linearRampToValueAtTime(randomize(750, 0.12), now + dur);

        // Trill — amplitude modulation at ~15 Hz for cat trilling
        const trillLfo = ctx.createOscillator();
        trillLfo.frequency.value = randomize(15, 0.1);
        const trillGain = ctx.createGain();
        trillGain.gain.value = vol * 0.4;
        trillLfo.connect(trillGain);
        trillGain.connect(gain.gain);
        trillLfo.start(now);
        trillLfo.stop(now + dur);

        // F1: fast upward sweep
        const f1 = formant(ctx, randomize(600, 0.12), 7, osc, gain);
        f1.frequency.linearRampToValueAtTime(randomize(1200, 0.12), now + dur);

        // F2: brightness
        const f2 = formant(ctx, randomize(1200, 0.12), 5, osc, gain);
        f2.frequency.linearRampToValueAtTime(randomize(2000, 0.12), now + dur);

        osc.start(now);
        osc.stop(now + dur);

        // Jingle cascade (kept from original)
        setTimeout(() => tone(1200, 0.1, 0.18), 230);
        setTimeout(() => tone(1500, 0.1, 0.18), 350);
        setTimeout(() => tone(1800, 0.1, 0.18), 460);
        setTimeout(() => tone(2200, 0.12, 0.22), 570);
        break;
      }

      case 'click': {
        const ctx = getCtx();
        if (!ctx) break;
        const t0 = ctx.currentTime;
        synthClick(ctx, ctx.destination, t0);
        break;
      }

      case 'achievement': {
        // Ascending sparkle — three quick rising tones
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const vol = 0.3 * _sfxVolume;
        const notes = [523, 659, 784]; // C5, E5, G5

        for (let i = 0; i < notes.length; i++) {
          const t = now + i * 0.12;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          g.connect(ctx.destination);

          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(notes[i], t);
          osc.connect(g);
          osc.start(t);
          osc.stop(t + 0.4);
        }
        break;
      }

      case 'dog_warn': {
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const bufLen = ctx.sampleRate * 0.5;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2 * _sfxVolume, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        src.connect(bp); bp.connect(g); g.connect(ctx.destination);
        src.start(now); src.stop(now + 0.5);
        break;
      }

      case 'dog_bark': {
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3 * _sfxVolume, now);
        g.gain.setValueAtTime(0.3 * _sfxVolume, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.2);
        break;
      }

      case 'dog_run': {
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = 800 + Math.random() * 400;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, now + i * 0.06);
          g.gain.linearRampToValueAtTime(0.1 * _sfxVolume, now + i * 0.06 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.05);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.05);
        }
        break;
      }

      default:
        break;
    }
  } catch { /* audio blocked or not supported */ }
}

function synthClick(ctx, dest, t0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1200;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.15 * _sfxVolume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}
