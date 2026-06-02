/* Kittysort Service Worker — minimal & robust.
 *
 * Strategy:
 *   • Navigations / HTML  → network-first (fresh deploys win; cache only as
 *     offline fallback). This avoids the "stale HTML stuck forever" trap.
 *   • Static same-origin assets (css/js/img/audio) → cache-first, fill on use.
 *   • Cross-origin (fonts etc.) → passthrough, opportunistically cached.
 *
 * Bump CACHE on every meaningful asset change to purge old entries.
 */
'use strict';

const CACHE = 'kittysort-0096475-06022353';

// App shell: enough to boot offline. The rest fills in via runtime caching.
const PRECACHE = [
  './',
  './index.html',
  './css/base.css',
  './css/game.css',
  './css/overlays.css',
  './css/panels.css',
  './css/splash.css',
  './css/premium.css',
  './css/season.css',
  './js/main.js',
  './js/constants.js',
  './js/storage.js',
  './manifest.json',
  './img/logo-mark.png',
  './img/icon-192.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Best-effort: a single 404 must not abort the whole install.
      Promise.allSettled(PRECACHE.map((u) => cache.add(u)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // HTML / navigations → network-first.
  const isHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (sameOrigin && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // Everything else → cache-first, then network (and cache same-origin OK responses).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (sameOrigin && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
