// public/sw.js
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Service Worker (Workbox)
// Maximum offline capability for operators in remote areas.
// ═══════════════════════════════════════════════════════════════

importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute, NavigationRoute, Route } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// ── Precache App Shell ──
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ── Navigation (App Shell) — NetworkFirst with offline fallback ──
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'hc-pages',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  }),
  {
    // Don't cache API routes or auth callbacks
    denylist: [/^\/api\//, /^\/auth\//, /^\/\.well-known\//],
  }
);
registerRoute(navigationRoute);

// ── Compliance API → CacheFirst, 7 day expiry ──
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/compliance') || url.pathname.startsWith('/api/requirements'),
  new CacheFirst({
    cacheName: 'hc-compliance',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// ── Directory listings → StaleWhileRevalidate, 24h ──
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/directory') || url.pathname.startsWith('/api/operators'),
  new StaleWhileRevalidate({
    cacheName: 'hc-directory',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// ── Rate benchmarks → StaleWhileRevalidate, 24h ──
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/pricing') || url.pathname.startsWith('/api/rates'),
  new StaleWhileRevalidate({
    cacheName: 'hc-rates',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
);

// ── Map tiles → CacheFirst, 30 day ──
registerRoute(
  ({ url }) =>
    url.hostname.includes('tile') ||
    url.hostname.includes('maps') ||
    url.pathname.includes('/tiles/'),
  new CacheFirst({
    cacheName: 'hc-map-tiles',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 5000, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── User profile → NetworkFirst with offline fallback ──
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/profile') || url.pathname.startsWith('/api/freshness'),
  new NetworkFirst({
    cacheName: 'hc-profile',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

// ── Static assets → CacheFirst, immutable ──
registerRoute(
  ({ url }) => url.pathname.startsWith('/_next/static/'),
  new CacheFirst({
    cacheName: 'hc-static',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// ── Google Fonts → CacheFirst, 365 days ──
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'hc-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// ── Images → CacheFirst, 30 days ──
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'hc-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// ── Background Sync for POST/PUT failures ──
const bgSyncPlugin = new BackgroundSyncPlugin('hc-offline-mutations', {
  maxRetentionTime: 24 * 60, // 24 hours
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
      } catch (err) {
        await queue.unshiftRequest(entry);
        throw err;
      }
    }
  },
});

// Queue failed POST/PUT to location, milestones, messages
registerRoute(
  ({ url, request }) =>
    (request.method === 'POST' || request.method === 'PUT') &&
    (url.pathname.startsWith('/api/location/') ||
     url.pathname.startsWith('/api/jobs/') ||
     url.pathname.startsWith('/api/availability')),
  new NetworkFirst({
    cacheName: 'hc-mutations',
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// ── Offline fallback page ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('hc-offline-fallback').then((cache) =>
      cache.addAll(['/offline'])
    ).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Haul Command', {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag || 'hc-notification',
        data: data.data || {},
        vibrate: [200, 100, 200],
        actions: data.actions || [],
      })
    );
  } catch {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard/operator';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
