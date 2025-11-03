const APP_CACHE = 'app-shell-v3';
const RUNTIME_CACHE = 'runtime-v3';
const OFFLINE_URL = '/offline.html';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== APP_CACHE && k !== RUNTIME_CACHE) ? caches.delete(k) : null)
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;

  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const runtime = await caches.open(RUNTIME_CACHE);
        runtime.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(request);
        return cached || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  if (['style','script','image','font'].includes(request.destination)) {
    e.respondWith((async () => {
      const cached = await caches.match(request);
      const fetchPromise = fetch(request).then(async res => {
        const runtime = await caches.open(RUNTIME_CACHE);
        runtime.put(request, res.clone());
        return res;
      }).catch(() => null);
      return cached || fetchPromise || caches.match(OFFLINE_URL);
    })());
  }
});
