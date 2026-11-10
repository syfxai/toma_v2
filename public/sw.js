const CACHE_NAME = 'toma-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // DO NOT intercept or cache API calls or Vite dev server internals
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.includes('/@vite/') || 
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('node_modules')
  ) {
    return;
  }

  // Network First: Always try to get the freshest version from network.
  // Fallback to cache only when offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && event.request.method === 'GET' && !url.pathname.startsWith('/api/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html') || caches.match('/')))
  );
});
