'use strict';

// ══════════════════════════════════════════════════════════════════════════
//  ROOM PROGRESS — Cat Café decoration system
//
//  Room items unlock as the player solves levels.
//  Progress is derived from loadProgress() — no separate storage needed.
// ══════════════════════════════════════════════════════════════════════════

import { loadProgress } from './storage.js';

// ── Room item definitions ────────────────────────────────────────────────

export const ROOM_ITEMS = [
  { id: 'rug',        icon: '🧶', name: 'Kuschelteppich',   unlockAt: 3,   tier: 'EASY'   },
  { id: 'shelf',      icon: '📚', name: 'Bücherregal',      unlockAt: 8,   tier: 'EASY'   },
  { id: 'catbed',     icon: '🛏️', name: 'Katzenkörbchen',   unlockAt: 15,  tier: 'EASY'   },
  { id: 'lamp',       icon: '💡', name: 'Stehlampe',        unlockAt: 25,  tier: 'MEDIUM' },
  { id: 'plant',      icon: '🪴', name: 'Zimmerpflanze',    unlockAt: 40,  tier: 'MEDIUM' },
  { id: 'wallart',    icon: '🖼️', name: 'Katzenbild',       unlockAt: 60,  tier: 'HARD'   },
  { id: 'cattree',    icon: '🌳', name: 'Kratzbaum',        unlockAt: 85,  tier: 'HARD'   },
  { id: 'window',     icon: '🪟', name: 'Fensterplatz',     unlockAt: 120, tier: 'EXPERT' },
  { id: 'fireplace',  icon: '🔥', name: 'Kamin',            unlockAt: 160, tier: 'EXPERT' },
  { id: 'chandelier', icon: '✨', name: 'Kronleuchter',     unlockAt: 200, tier: 'MASTER' },
];

// ── Progress calculation ─────────────────────────────────────────────────

/**
 * calculateRoomProgress() → { solvedCount, items[], nextItem }
 * Each item gets: { ...def, status: 'locked'|'unlockable'|'unlocked', progress: 0-1 }
 */
export function calculateRoomProgress() {
  const progress = loadProgress();
  const solvedCount = Object.keys(progress).length;

  const items = ROOM_ITEMS.map(def => {
    const unlocked = solvedCount >= def.unlockAt;
    const pct = Math.min(solvedCount / def.unlockAt, 1);
    // "unlockable" = within 5 levels of unlocking
    const nearThreshold = def.unlockAt - 5;
    const unlockable = !unlocked && solvedCount >= nearThreshold;
    return {
      ...def,
      status: unlocked ? 'unlocked' : unlockable ? 'unlockable' : 'locked',
      progress: pct,
    };
  });

  const nextItem = items.find(it => it.status !== 'unlocked') || null;
  const unlockedCount = items.filter(it => it.status === 'unlocked').length;

  return { solvedCount, items, nextItem, unlockedCount, totalItems: ROOM_ITEMS.length };
}

// ── DOM builder — RoomProgressPanel ──────────────────────────────────────

/**
 * buildRoomPanel(containerId) — populates the room progress panel in the DOM
 */
export function buildRoomPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { items, nextItem, unlockedCount, totalItems, solvedCount } = calculateRoomProgress();

  // Header
  let html = `
    <div class="room-header">
      <span class="room-title">Katzencafé</span>
      <span class="room-count">${unlockedCount} / ${totalItems}</span>
    </div>
  `;

  // Next reward card (if there's something to unlock)
  if (nextItem) {
    const levelsLeft = nextItem.unlockAt - solvedCount;
    html += `
      <div class="room-next-card ${nextItem.status === 'unlockable' ? 'room-next-card--close' : ''}">
        <span class="room-next-icon">${nextItem.icon}</span>
        <div class="room-next-info">
          <div class="room-next-label">NÄCHSTER UNLOCK</div>
          <div class="room-next-name">${nextItem.name}</div>
          <div class="room-next-bar">
            <div class="room-next-fill" style="width: ${(nextItem.progress * 100).toFixed(1)}%"></div>
          </div>
        </div>
        <span class="room-next-dist">${levelsLeft > 0 ? `noch ${levelsLeft}` : 'Bereit!'}</span>
      </div>
    `;
  }

  // Decor slot grid
  html += '<div class="room-grid">';
  for (const item of items) {
    const cls = `room-slot room-slot--${item.status}`;
    html += `
      <div class="${cls}">
        <span class="room-slot-icon">${item.icon}</span>
        <span class="room-slot-name">${item.name}</span>
        ${item.status === 'locked' ? `<span class="room-slot-lock">🔒</span>` : ''}
        ${item.status === 'unlockable'
          ? `<div class="room-slot-bar"><div class="room-slot-fill" style="width:${(item.progress * 100).toFixed(1)}%"></div></div>`
          : ''}
      </div>
    `;
  }
  html += '</div>';

  container.innerHTML = html;
}

// ── Win screen hint — shows room progress on level win ───────────────────

/**
 * buildWinRoomHint(containerId) — small hint below win achievements
 */
export function buildWinRoomHint(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { nextItem, solvedCount, unlockedCount, totalItems } = calculateRoomProgress();
  if (!nextItem) {
    container.innerHTML = `<div class="room-win-hint room-win-hint--done">✨ Café komplett eingerichtet!</div>`;
    return;
  }

  const levelsLeft = nextItem.unlockAt - solvedCount;
  if (levelsLeft <= 0) {
    container.innerHTML = `
      <div class="room-win-hint room-win-hint--unlock">
        <span class="room-win-icon">${nextItem.icon}</span>
        <span>${nextItem.name} freigeschaltet!</span>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="room-win-hint">
        <span class="room-win-icon">${nextItem.icon}</span>
        <span>${nextItem.name} — noch ${levelsLeft} Level</span>
      </div>
    `;
  }
}
