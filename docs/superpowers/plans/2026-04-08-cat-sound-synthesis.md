# Cat Sound Synthesis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 6 simple oscillator-based cat sounds with formant synthesis for more realistic, varied cat audio.

**Architecture:** Add `randomize()` and `formant()` helper functions to `audio.js`, then replace each of the 6 cat sound cases in `playSound()` with formant-based implementations. Existing `tone()` and `purr()` stay for non-cat sounds. The `purr()` function gets a new version called `purrV2()` used by solved/win.

**Tech Stack:** Web Audio API (AudioContext, OscillatorNode, BiquadFilterNode, GainNode, AudioBufferSourceNode)

---

### Task 1: Add helper functions (`randomize` and `formant`)

**Files:**
- Modify: `js/audio.js:9` (add after line 9, before `setSfxVolume`)

- [ ] **Step 1: Add `randomize()` helper after line 9**

```javascript
/** Return value ± spread%. e.g. randomize(100, 0.1) → 90-110 */
function randomize(v, spread) {
  return v * (1 + (Math.random() - 0.5) * spread);
}
```

- [ ] **Step 2: Add `formant()` helper after `randomize`**

```javascript
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
```

- [ ] **Step 3: Add `makeNoise()` helper after `formant`**

This creates a reusable white noise source node — needed by miau, hiss, mrrp, prrt, mew.

```javascript
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
```

- [ ] **Step 4: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): add randomize, formant, makeNoise helpers"
```

---

### Task 2: Replace `select` sound with formant Miau

**Files:**
- Modify: `js/audio.js` — replace the `case 'select'` block (lines 115-118)

- [ ] **Step 1: Replace the select case**

Replace:
```javascript
      case 'select':
        // Soft "Miau" — sine sliding up
        tone(500, 0.15, 0.3, { slide: 2500 });
        break;
```

With:
```javascript
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
```

- [ ] **Step 2: Test manually**

Open the game in browser, click a tube, listen for a vowel-like "miau" sound with natural variation on repeat clicks.

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): formant-based miau sound for select"
```

---

### Task 3: Replace `purr` function with `purrV2` for solved/win

**Files:**
- Modify: `js/audio.js` — add `purrV2()` after existing `purr()` function (after line 106), then update `solved` and `win` cases

- [ ] **Step 1: Add `purrV2()` function after the existing `purr()` (after line 106)**

Keep the old `purr()` intact (it's not used elsewhere after this change, but safe to keep).

```javascript
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
```

- [ ] **Step 2: Update the `solved` case to use `purrV2`**

Replace:
```javascript
      case 'solved':
        // Satisfied purr + warm bell chime
        purr(0.8, 0.2);
        setTimeout(() => tone(880, 0.15, 0.2), 100);
        break;
```

With:
```javascript
      case 'solved':
        // Satisfied purr + warm bell chime
        purrV2(0.4, 0.2);
        setTimeout(() => tone(880, 0.15, 0.2), 100);
        break;
```

- [ ] **Step 3: Update the `win` case to use `purrV2`**

Replace:
```javascript
      case 'win':
        // Long purr + ascending bell melody
        purr(1.2, 0.18);
        setTimeout(() => tone(880,  0.18, 0.25), 100);
        setTimeout(() => tone(1100, 0.18, 0.25), 280);
        setTimeout(() => tone(1320, 0.22, 0.3),  450);
        break;
```

With:
```javascript
      case 'win':
        // Long purr + ascending bell melody
        purrV2(0.8, 0.18);
        setTimeout(() => tone(880,  0.18, 0.25), 100);
        setTimeout(() => tone(1100, 0.18, 0.25), 280);
        setTimeout(() => tone(1320, 0.22, 0.3),  450);
        break;
```

- [ ] **Step 4: Test manually**

Complete a tube (solved sound) and complete a level (win sound). Purr should sound richer with a "rattle" texture and subtle breath rhythm.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): improved purr with bandpass + noise layers for solved/win"
```

---

### Task 4: Replace `invalid` sound with formant Hiss

**Files:**
- Modify: `js/audio.js` — replace the `case 'invalid'` block

- [ ] **Step 1: Replace the invalid case**

Replace:
```javascript
      case 'invalid':
        // Cat hiss — noise burst
        tone(0, 0.12, 0.25, { noise: true, attack: 0.005 });
        break;
```

With:
```javascript
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
```

- [ ] **Step 2: Test manually**

Make an invalid move. Should sound like a sharp, sibilant hiss rather than generic white noise.

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): bandpass-filtered hiss sound for invalid moves"
```

---

### Task 5: Replace `cat_unlock` sound with formant Mrrp + jingle

**Files:**
- Modify: `js/audio.js` — replace the `case 'cat_unlock'` block

- [ ] **Step 1: Replace the cat_unlock case**

Replace:
```javascript
      case 'cat_unlock':
        // Excited "Mrrp!" + jingle cascade
        tone(400, 0.12, 0.28, { slide: 3500 });
        setTimeout(() => tone(1200, 0.1, 0.18), 130);
        setTimeout(() => tone(1500, 0.1, 0.18), 250);
        setTimeout(() => tone(1800, 0.1, 0.18), 360);
        setTimeout(() => tone(2200, 0.12, 0.22), 470);
        break;
```

With:
```javascript
      case 'cat_unlock': {
        // Excited "Mrrp!" — trilling formant sweep + jingle cascade
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.2, 0.1);
        const vol = 0.28 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.01);
        gain.gain.setValueAtTime(vol, now + dur - 0.08);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        // Noise source for formant excitation
        const noise = makeNoise(ctx, dur);

        // F1: fast upward sweep 400→1200 Hz
        const f1 = formant(ctx, randomize(400, 0.12), 5, noise, gain);
        f1.frequency.linearRampToValueAtTime(randomize(1200, 0.12), now + dur);

        // F2: 800→2000 Hz
        const f2 = formant(ctx, randomize(800, 0.12), 4, noise, gain);
        f2.frequency.linearRampToValueAtTime(randomize(2000, 0.12), now + dur);

        // Trill — FM via amplitude modulation at ~15 Hz
        const trillLfo = ctx.createOscillator();
        trillLfo.frequency.value = randomize(15, 0.1);
        const trillGain = ctx.createGain();
        trillGain.gain.value = vol * 0.4;
        trillLfo.connect(trillGain);
        trillGain.connect(gain.gain);
        trillLfo.start(now);
        trillLfo.stop(now + dur);

        noise.start(now);
        noise.stop(now + dur);

        // Jingle cascade (kept from original)
        setTimeout(() => tone(1200, 0.1, 0.18), 130);
        setTimeout(() => tone(1500, 0.1, 0.18), 250);
        setTimeout(() => tone(1800, 0.1, 0.18), 360);
        setTimeout(() => tone(2200, 0.12, 0.22), 470);
        break;
      }
```

- [ ] **Step 2: Test manually**

Unlock a cat in the album. Should hear an excited trill followed by the familiar ascending jingle.

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): trilling mrrp formant sound for cat unlock"
```

---

### Task 6: Replace `hint` sound with formant Prrt

**Files:**
- Modify: `js/audio.js` — replace the `case 'hint'` block

- [ ] **Step 1: Replace the hint case**

Replace:
```javascript
      case 'hint':
        // Curious "Prrt?" — upward chirp
        tone(350, 0.12, 0.22, { slide: 3000 });
        break;
```

With:
```javascript
      case 'hint': {
        // Curious "Prrt?" — noise burst into formant upglide with question rise
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.13, 0.1);
        const vol = 0.22 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.005);
        gain.gain.setValueAtTime(vol, now + dur - 0.04);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        const noise = makeNoise(ctx, dur);

        // Single formant sweeping up — "questioning" intonation
        // 300→600 Hz in first 60%, then quick rise to 800 Hz (question mark)
        const f1 = formant(ctx, randomize(300, 0.1), 5, noise, gain);
        f1.frequency.linearRampToValueAtTime(randomize(600, 0.1), now + dur * 0.6);
        f1.frequency.linearRampToValueAtTime(randomize(800, 0.1), now + dur);

        // Subtle second formant for richness
        const f2 = formant(ctx, randomize(900, 0.1), 3, noise, gain);
        f2.frequency.linearRampToValueAtTime(randomize(1400, 0.1), now + dur);

        noise.start(now);
        noise.stop(now + dur);
        break;
      }
```

- [ ] **Step 2: Test manually**

Activate a hint. Should sound like a short, curious chirp with rising pitch at the end.

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): curious prrt formant sound for hints"
```

---

### Task 7: Replace `undo` sound with formant Mew

**Files:**
- Modify: `js/audio.js` — replace the `case 'undo'` block

- [ ] **Step 1: Replace the undo case**

Replace:
```javascript
      case 'undo':
        // Soft "Mew" — downward slide
        tone(700, 0.1, 0.2, { slide: -4000 });
        break;
```

With:
```javascript
      case 'undo': {
        // Soft "Mew" — single thin formant gliding down
        const ctx = getCtx();
        if (!ctx) break;
        const now = ctx.currentTime;
        const dur = randomize(0.1, 0.15);
        const vol = 0.2 * _sfxVolume;

        // Envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.015);
        gain.gain.setValueAtTime(vol, now + dur - 0.03);
        gain.gain.linearRampToValueAtTime(0, now + dur);
        gain.connect(ctx.destination);

        const noise = makeNoise(ctx, dur);

        // Single formant, high and thin, gliding down — disappointed small cat
        const f1 = formant(ctx, randomize(1200, 0.1), 6, noise, gain);
        f1.frequency.linearRampToValueAtTime(randomize(800, 0.1), now + dur);

        noise.start(now);
        noise.stop(now + dur);
        break;
      }
```

- [ ] **Step 2: Test manually**

Undo a move. Should sound like a short, thin, descending mew — smaller and higher than the miau.

- [ ] **Step 3: Commit**

```bash
git add js/audio.js
git commit -m "feat(audio): thin descending mew formant sound for undo"
```

---

### Task 8: Final cleanup and verification

**Files:**
- Modify: `js/audio.js` — remove old `purr()` if no longer referenced

- [ ] **Step 1: Check if old `purr()` is still referenced anywhere**

Search for `purr(` in the codebase (not `purrV2(`). If only the old definition remains and no callers reference it, remove the old `purr()` function (lines 76-106).

- [ ] **Step 2: Open the game and test all 6 sounds end-to-end**

Test sequence:
1. Select a tube → miau (formant vowel)
2. Make an invalid move → hiss (filtered sibilant)
3. Undo → mew (thin downward)
4. Use a hint → prrt (curious chirp)
5. Complete a tube → solved purr (rich rattle)
6. Complete a level → win purr (longer, with jingle)

Verify each sound has audible variation when triggered multiple times in a row.

- [ ] **Step 3: Commit cleanup if any changes were made**

```bash
git add js/audio.js
git commit -m "refactor(audio): remove unused legacy purr function"
```
