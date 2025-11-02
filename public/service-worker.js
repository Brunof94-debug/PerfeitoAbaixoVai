const APP_CACHE = 'app-shell-v1';
const RUNTIME_CACHE = 'runtime-v1';
const OFFLINE_URL = '/offline.html';

// List everything that makes up the app shell
const APP_SHELL = [
  '/', '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Installation: pre-cache the app shell and offline page
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activation: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== APP_CACHE && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
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

  // Static assets (CSS, JS, images)
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
 const APP_CACHE = 'app-shell-v1';
const RUNTIME_CACHE = 'runtime-v1';
const OFFLINE_URL = '/offline.html';

// List everything that makes up the app shell
const APP_SHELL = [
  '/', '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Installation: pre-cache the app shell and offline page
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activation: clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== APP_CACHE && key !== RUNTIME_CACHE) {
          return caches.delete(key);
        }
      }))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
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

  // Static assets (CSS, JS, images)
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const fetchPromise = fetch(request).then(async response => {
        const runtime = await caches.open(RUNTIME_CACHE);
        runtime.put(request, response.clone());
        return response;
      }).catch(() => null);
      return cached || fetchPromise || caches.match(OFFLINE_URL);
    })());
    return;
  }

  // API requests to crypto providers (CoinGecko/Binance)
  const isApi = /coingecko|binance\.com\/api/i.test(url.hostname + url.pathname);
  if (isApi) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      try {
        const netResponse = await fetch(request);
        if (netResponse.ok) {
          cache.put(request, netResponse.clone());
        }
        return netResponse;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
  }
});     const fetchPromise = fetch(request).then(async response => {
        const runtime = await caches.open(RUNTIME_CACHE);
        runtime.put(request, response.clone());
        return response;
      }).catch(() => null);
      return cached || fetchPromise || caches.match(OFFLINE_URL);
    })());
    return;
  }

  // API requests to crypto providers (CoinGecko/Binance)
  const isApi = /coingecko|binance\.com\/api/i.test(url.hostname + url.pathname);
  if (isApi) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      try {
        const netResponse = await fetch(request);
        if (netResponse.ok) {
          cache.put(request, netResponse.clone());
        }
        return netResponse;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })());
  }
});
