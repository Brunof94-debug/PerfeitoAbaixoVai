const APP_CACHE = 'app-shell-v1';
const RUNTIME_CACHE = 'runtime-v1';
const OFFLINE_URL = './offline.html';


const APP_SHELL = [
'./',
'./index.html',
'./manifest.webmanifest',
'./offline.html',
'./icons/icon-192.png',
'./icons/icon-512.png'
];


self.addEventListener('install', event => {
event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL)));
self.skipWaiting();
});


self.addEventListener('activate', event => {
event.waitUntil(
caches.keys().then(keys => Promise.all(keys.map(k => (k !== APP_CACHE && k !== RUNTIME_CACHE) ? caches.delete(k) : null)))
);
self.clients.claim();
});


self.addEventListener('fetch', event => {
const { request } = event;


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


if (['style','script','image','font'].includes(request.destination)) {
event.respondWith((async () => {
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
