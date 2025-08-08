/* Basic service worker for notification demo (no external services) */
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { clients.claim(); });

// Minimal message channel to trigger an immediate notification from page
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION' && data.title) {
    self.registration.showNotification(data.title, {
      body: data.body || '',
      icon: data.icon || '/favicon.svg',
      badge: data.badge || '/favicon.svg',
      tag: data.tag || 'dsa-habit',
      timestamp: Date.now(),
      vibrate: [40, 20, 40]
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = '/';
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
