'use strict';

// ── Dog "Strolch" state machine ─────────────────────────────────────────

export const DOG = {
  active:       false,
  cooldown:     8000,
  warnDuration: 3000,
  nextAttack:   0,
  warning:      null,
  attacking:    null,
  side:         'left',
};

export function startDog() {
  DOG.active     = true;
  DOG.nextAttack = performance.now() + DOG.cooldown;
  DOG.warning    = null;
  DOG.attacking  = null;
  DOG.side       = Math.random() < 0.5 ? 'left' : 'right';
}

export function endDog() {
  DOG.active    = false;
  DOG.warning   = null;
  DOG.attacking = null;
}

export function planDogAttack(tubes, solvedTubes) {
  const CAPACITY = 4;
  const sources = [];
  for (let i = 0; i < tubes.length; i++) {
    if (tubes[i].length > 0 && !solvedTubes.has(i)) {
      sources.push(i);
    }
  }
  if (sources.length === 0) return null;

  const srcIdx = sources[Math.floor(Math.random() * sources.length)];
  const topColor = tubes[srcIdx][tubes[srcIdx].length - 1];

  const dests = [];
  for (let i = 0; i < tubes.length; i++) {
    if (i === srcIdx) continue;
    if (tubes[i].length >= CAPACITY) continue;
    dests.push(i);
  }
  if (dests.length === 0) return null;

  const matching = dests.filter(d => tubes[d].length > 0 && tubes[d][tubes[d].length - 1] === topColor);
  const empty = dests.filter(d => tubes[d].length === 0);

  let destIdx;
  if (matching.length > 0) {
    destIdx = matching[Math.floor(Math.random() * matching.length)];
  } else if (empty.length > 0) {
    destIdx = empty[Math.floor(Math.random() * empty.length)];
  } else {
    destIdx = dests[Math.floor(Math.random() * dests.length)];
  }

  return { sourceTube: srcIdx, destTube: destIdx, color: topColor };
}

export function executeDogAttack(tubes, sourceTube, destTube) {
  if (tubes[sourceTube].length === 0) return null;
  if (tubes[destTube].length >= 4) return null;
  const color = tubes[sourceTube].pop();
  tubes[destTube].push(color);
  return color;
}

export function updateDog(ts, tubes, solvedTubes, animBusy) {
  if (!DOG.active) return null;

  if (DOG.attacking) {
    const elapsed = ts - DOG.attacking.startTime;
    if (elapsed >= 1200) {
      DOG.attacking = null;
      DOG.nextAttack = ts + DOG.cooldown;
      DOG.side = DOG.side === 'left' ? 'right' : 'left';
      return 'done';
    }
    return null;
  }

  if (DOG.warning) {
    const elapsed = ts - DOG.warning.startTime;
    if (elapsed >= DOG.warnDuration) {
      if (animBusy) return null;
      const { sourceTube, destTube } = DOG.warning;
      const moved = executeDogAttack(tubes, sourceTube, destTube);
      if (moved) {
        DOG.attacking = {
          startTime: ts,
          sourceTube,
          destTube,
          color: moved,
          phase: 'run',
        };
        DOG.warning = null;
        return 'attack';
      } else {
        DOG.warning = null;
        DOG.nextAttack = ts + DOG.cooldown;
        return null;
      }
    }
    return 'warn';
  }

  if (ts >= DOG.nextAttack) {
    const plan = planDogAttack(tubes, solvedTubes);
    if (plan) {
      DOG.warning = {
        startTime: ts,
        sourceTube: plan.sourceTube,
        destTube: plan.destTube,
        color: plan.color,
      };
      return 'warn';
    } else {
      DOG.nextAttack = ts + 2000;
    }
  }

  return null;
}
