const CACHE_NAME = 'andamus-v1';
const urlsToCache = [
  '/',
  '/cerca',
  '/offri',
  '/profilo',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification',
  };

  event.waitUntil(
    self.registration.showNotification('Andamus', options)
  );
});
