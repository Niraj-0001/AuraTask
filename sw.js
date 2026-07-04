const CACHE_NAME = 'auratask-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch listener to satisfy PWA install requirements
  e.respondWith(fetch(e.request));
});
