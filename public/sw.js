const CACHE_NAME = 'andamus-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nu cache-ui paginile HTML - ia mereu versiunea fresh de pe server
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const title = data.title || 'Andamus';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification',
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
