/* Minimal service worker (v2).
   - HTML navigations: network-first, cache for offline fallback.
   - Same-origin static assets: stale-while-revalidate (fixes stale CSS/JS bug).
   - Cross-origin (fonts, images): network only.

   The previous cache-first strategy on same-origin assets meant returning
   visitors could see old CSS/JS after a deploy unless the manual cache key
   was bumped. SWR removes that footgun. */

const CACHE = 'fleshandbones-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './scripts.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
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

  // Navigations: network-first, cache successful navigations, fall back to shell
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        const index = await caches.match('./index.html');
        if (index) return index;
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // Same-origin static: stale-while-revalidate
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);

      const networkPromise = fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      }).catch(() => null);

      if (cached) {
        // Return cached instantly; refresh in background.
        return cached;
      }
      const netRes = await networkPromise;
      if (netRes) return netRes;
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })());
    return;
  }

  // Cross-origin: network only
});