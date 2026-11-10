/* Neuruh Prompter service worker
   Strategy: precache the app shell on install; serve cache-first with
   background refresh for same-origin GETs. /api/* (remote relay, hub
   ingest, health) is NEVER cached — those must always hit the network.
   Bump VERSION to force clients onto a new build. */
const VERSION = 'np-v3.0.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})            // partial precache is fine (e.g. missing icon)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                     // uploads/relay pass straight through
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;           // don't touch cross-origin
  if (url.pathname.includes('/api/')) return;           // live endpoints: never cached

  e.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);                              // offline: fall back to cache
      return hit || refresh;
    })
  );
});
