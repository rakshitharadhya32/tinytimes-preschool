// Custom service worker (vite-plugin-pwa "injectManifest" strategy).
//
// We intentionally do NOT depend on workbox-precaching here — the manifest placeholder below
// is populated at build time by vite-plugin-pwa, and we cache those URLs ourselves with the
// plain Cache API. This keeps the service worker small and dependency-free while still giving
// us a real `push` event listener, which the default `generateSW` strategy doesn't expose.

const CACHE_NAME = 'ankura-precache-v1';
// eslint-disable-next-line no-undef
const manifest = self.__WB_MANIFEST || [];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(manifest.map((entry) => (typeof entry === 'string' ? entry : entry.url)).filter(Boolean))
      )
      .catch(() => {
        // Best-effort — a precache miss (e.g. an asset 404s) shouldn't block install/activation.
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Parent announcement push notifications (see server/src/utils/push.js for what triggers these).
self.addEventListener('push', (event) => {
  let data = { title: 'TinyTimes Preschool', body: 'You have a new update.' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Non-JSON payload — fall back to the default text above.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/parent/feed');
    })
  );
});
