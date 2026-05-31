'use strict';

// ── Illustrated background images ───────────────────────────────────────────
// A background id listed here uses a painted image instead of the procedural
// scene (both in-game and in the shop preview). Ids NOT listed fall back to the
// procedural renderer in backgrounds/*.js — so images can be added one at a time.
const BG_IMAGES = {
  cafe: 'img/bg-cafe.jpg',
  // kirschbluete: 'img/bg-kirschbluete.jpg',
  // garden:       'img/bg-garden.jpg',
  // rooftop:      'img/bg-rooftop.jpg',
  // winter:       'img/bg-winter.jpg',
};

const _cache = {};   // bgId -> { img, ready, error, cbs:[] }

export function hasBgImage(bgId) {
  return !!BG_IMAGES[bgId];
}

// Returns the loaded HTMLImageElement, or null if not (yet) available.
// Pass onReady to be notified once a not-yet-loaded image finishes (used by the
// shop preview, which is drawn once and must redraw when the image arrives).
export function getBgImage(bgId, onReady) {
  const url = BG_IMAGES[bgId];
  if (!url) return null;
  let e = _cache[bgId];
  if (!e) {
    e = _cache[bgId] = { img: new Image(), ready: false, error: false, cbs: [] };
    e.img.onload  = () => { e.ready = true; e.cbs.splice(0).forEach((fn) => fn()); };
    e.img.onerror = () => { e.error = true; e.cbs.splice(0).forEach((fn) => fn()); };
    e.img.src = url;
  }
  if (e.ready) return e.img;
  if (onReady && !e.error) e.cbs.push(onReady);
  return null;
}

// Draw an image to fully cover w×h (centre-crop any overflow).
export function drawBgImageCover(ctx, img, w, h) {
  const ir = img.width / img.height;
  const cr = w / h;
  let dw, dh, dx, dy;
  if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; dy = 0; }
  else         { dw = w; dh = w / ir; dx = 0; dy = (h - dh) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Kick off loading early so the image is ready by the time it's shown.
export function preloadBgImage(bgId) { getBgImage(bgId); }
