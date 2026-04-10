'use strict';

// ══════════════════════════════════════════════════════════════════════════
//  DESIGN SYSTEM — Single source of truth for all visual tokens
//
//  Layer mapping:
//    Scene    → background.js, particles.js (fireflies)
//    Board    → render.js (layout), containers.js (tubes), balls.js (yarn)
//    HUD/UI   → css/game.css, main.js (DOM)
//    Panels   → css/panels.css, css/overlays.css
//    Splash   → css/splash.css, splash.js
// ══════════════════════════════════════════════════════════════════════════

// ── Colors ───────────────────────────────────────────────────────────────

export const COLORS = {
  // Page & surface
  bg:         '#fdf6ec',
  surface:    'rgba(160,120,80,.08)',
  border:     'rgba(160,120,80,.15)',

  // Brand
  gold:       '#d4873f',
  goldBright: '#FFD700',
  goldDark:   '#B8860B',
  goldMid:    '#FFA500',

  // Text
  text:       '#4a3728',
  muted:      'rgba(74,55,40,.45)',
  light:      'rgba(255,255,255,.65)',
  lightDim:   'rgba(255,255,255,.55)',

  // Semantic
  good:       '#7cb342',
  warn:       '#ef6c00',
  error:      '#c62828',

  // Card backgrounds (145° gradient from/to)
  cardFrom:   'rgba(85,55,32,.94)',
  cardTo:     'rgba(60,38,22,.94)',

  // Overlay backdrops
  overlayWarm:    'rgba(60,40,25,.80)',
  overlayDark:    'rgba(45,28,15,.92)',
  overlayDramatic:'rgba(40,22,10,.82)',
  overlayBlitz:   'rgba(50,30,18,.90)',

  // Card border & inner glow (shared across all cards)
  cardBorder:     'rgba(255,215,0,.12)',
  cardInsetGlow:  'rgba(255,240,220,.08)',

  // Tier accent colors (match constants.js THEMES)
  tierEasy:   '#d4873f',
  tierMedium: '#b07baa',
  tierHard:   '#6ba3a0',
  tierExpert: '#c96b4f',
  tierMaster: '#c9a84c',
};

// ── Spacing ──────────────────────────────────────────────────────────────

export const SPACING = {
  xs:   '.25rem',
  sm:   '.5rem',
  md:   '.75rem',
  lg:   '1rem',
  xl:   '1.5rem',
  xxl:  '2rem',

  // Card padding
  cardPadX:    '2.5rem',
  cardPadY:    '2rem',
  cardPadXWin: '3rem',
  cardPadYWin: '2.2rem',

  // HUD
  hudPadX: '16px',
  hudPadY: '10px',

  // Max widths
  maxGame:  '480px',
  maxCard:  '360px',
  maxAlbum: '400px',
};

// ── Shadows ──────────────────────────────────────────────────────────────

export const SHADOWS = {
  // Canvas floating-card
  canvas: [
    '0 0 60px rgba(180,130,70,.15)',
    '0 0 20px rgba(220,160,80,.08)',
    '0 20px 40px rgba(40,20,0,.40)',
    '0 4px 12px rgba(40,20,0,.18)',
  ].join(', '),

  // Gold raised button
  goldBtn:       '0 4px 0 #B8860B, 0 6px 15px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3)',
  goldBtnHover:  '0 5px 0 #B8860B, 0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3)',
  goldBtnActive: '0 2px 0 #B8860B, 0 3px 8px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3)',

  // HUD button
  hudBtn:       '0 2px 0 rgba(184,134,11,.3), 0 3px 8px rgba(0,0,0,.25)',
  hudBtnHover:  '0 3px 0 rgba(184,134,11,.3), 0 5px 12px rgba(0,0,0,.35)',
  hudBtnActive: '0 1px 0 rgba(184,134,11,.3)',

  // Card depth
  card:      '0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,240,220,.08)',
  cardHeavy: '0 40px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,240,220,.08)',

  // Secondary button
  secondary: '0 2px 6px rgba(0,0,0,.15)',

  // Controls
  controlBtn: '0 1px 3px rgba(0,0,0,.08)',
};

// ── Gradients ────────────────────────────────────────────────────────────

export const GRADIENTS = {
  // Gold button (primary action)
  goldBtn:    'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
  // Gold text
  goldText:   'linear-gradient(180deg, #FFD700, #d4873f)',
  // Title
  title:      'linear-gradient(130deg, #d4873f 0%, #c96b4f 45%, #a67c52 100%)',
  // Card background (used for all card/panel surfaces)
  card:       'linear-gradient(145deg, rgba(85,55,32,.94), rgba(60,38,22,.94))',
  // Play button (green)
  playBtn:    'linear-gradient(135deg, #00E676 0%, #00C853 50%, #00BFA5 100%)',
  // Endless button (purple)
  endlessBtn: 'linear-gradient(135deg, #7B68EE 0%, #6A5ACD 100%)',
  // HUD bar
  hudBar:     'linear-gradient(180deg, rgba(55,35,20,.62), rgba(60,40,25,.52))',
};

// ── Motion ───────────────────────────────────────────────────────────────

export const MOTION = {
  // Easing curves
  standard:    'cubic-bezier(.4,0,.2,1)',     // Material standard
  decelerate:  'cubic-bezier(.22,.61,.36,1)',  // Incoming elements
  spring:      'cubic-bezier(.2,.9,.3,1)',     // Bouncy pop
  overshoot:   'cubic-bezier(.34,1.56,.64,1)', // Strong overshoot

  // Durations
  fast:    '.1s',
  normal:  '.15s',
  medium:  '.35s',
  slow:    '.45s',
  overlay: '.45s',

  // Button press feedback
  btnPress: 'transform 0.08s ease',
};

// ── Z-Index ──────────────────────────────────────────────────────────────

export const Z_INDEX = {
  hudOverlay:      10,
  timerBar:        9,
  tutBubble:       50,
  premiumBanner:   100,
  splash:          9000,
  levelSelect:     9100,
  blitzOverlay:    9200,
  screenOverlay:   9250,
  winOverlay:      9300,
  achievementOvl:  9450,
  catUnlockOvl:    9500,
};

// ── Typography ───────────────────────────────────────────────────────────

export const FONTS = {
  heading: "'Nunito', sans-serif",
  display: "'Fredoka', sans-serif",
  body:    "'Nunito', sans-serif",
};

// ── Border Radii ─────────────────────────────────────────────────────────

export const RADII = {
  pill:   '100px',
  card:   '24px',
  button: '100px',
  circle: '50%',
  small:  '6px',
  medium: '12px',
  large:  '16px',
};
