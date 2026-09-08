const CACHE = 'jarvis7-v2';
const OFFLINE_FALLBACK = './jarvis-mobile.html';
const STATIC_ASSETS = new Set([
  '/jarvis-mobile.html',
  '/index.html',
  '/stubox-v2.html',
  '/manifest.webmanifest'
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      './jarvis-mobile.html',
      './index.html',
      './stubox-v2.html',
      './manifest.webmanifest'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('authorization')) return;

  const isStaticAsset = STATIC_ASSETS.has(url.pathname) || STATIC_ASSETS.has(`/${url.pathname.split('/').pop()}`);
  const isNavigation = request.mode === 'navigate';

  if (!isStaticAsset && !isNavigation) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || !response.ok || response.type !== 'basic') return response;

        if (isStaticAsset) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (isNavigation) return caches.match(OFFLINE_FALLBACK);
        return Response.error();
      })
  );
});
