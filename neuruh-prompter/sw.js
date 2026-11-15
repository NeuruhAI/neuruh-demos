/* Neuruh Prompter service worker
   Strategy: precache the app shell on install; serve cache-first with
   background refresh for same-origin GETs, except navigations, which are
   network-first with a cache fallback so a deploy is never hidden behind
   a stale cached page. /api/* (remote relay, hub ingest, health) is NEVER
   cached, those must always hit the network.
   Bump VERSION to force clients onto a new build.
   v3.1.0: navigations went network-first. The Batch 5 Save fix (index.html
   only, VERSION left at v3.0.0) was invisible to the live browser, which
   kept serving the pre-fix page from cache np-v3.0.0: Save called
   prompt(), automation suppressed it, and nothing was stored. */
const VERSION = 'np-v3.1.0';
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

  // Navigations are network-first: the document must come from the
  // network when it is reachable, so a deploy reaches every client on
  // the next load instead of sitting behind a cached copy. Offline, the
  // cached copy still serves as the fallback.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

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
