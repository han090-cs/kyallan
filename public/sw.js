/* Kyallan offline shell + stale-while-offline support for same-origin snapshots. */
const CACHE_NAME = 'kyallan-shell-v2-__BUILD_HASH__';
const BASE = new URL('./', self.registration.scope);
const SHELL = [
  new URL('./', BASE).href,
  new URL('index.html', BASE).href,
  new URL('css/style.css', BASE).href,
  new URL('js/app.js', BASE).href,
  new URL('manifest.webmanifest', BASE).href,
  new URL('favicon.svg', BASE).href,
  new URL('icon-192.png', BASE).href,
  new URL('icon-512.png', BASE).href,
  new URL('assets/fonts/padauk-400.woff2', BASE).href,
  new URL('assets/fonts/padauk-700.woff2', BASE).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(SHELL.map(async (url) => {
      try { await cache.add(url); } catch { /* Optional cache item; the site can still install. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('kyallan-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Do not intercept third-party APIs/media.

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE_NAME)).put(new URL('index.html', BASE).href, response.clone());
        return response;
      } catch {
        return (await caches.match(new URL('index.html', BASE).href)) || (await caches.match(new URL('./', BASE).href)) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.includes('/data/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          const stableKey = new Request(url.origin + url.pathname, { method: 'GET' });
          await cache.put(stableKey, response.clone());
        }
        return response;
      } catch {
        const stableKey = new Request(url.origin + url.pathname, { method: 'GET' });
        return (await cache.match(stableKey)) || (await cache.match(request, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') await cache.put(request, response.clone());
      return response;
    } catch {
      return Response.error();
    }
  })());
});
