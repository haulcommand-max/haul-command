/**
 * HAUL COMMAND — Service Worker (Workbox)
 * Offline-first caching for 57-country operations.
 */
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST || []);

// Compliance API — CacheFirst, 7 day expiry
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/compliance') || url.pathname.startsWith('/api/escort-requirements'),
  new CacheFirst({
    cacheName: 'hc-compliance',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60, maxEntries: 200 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Directory listings — StaleWhileRevalidate, 24h
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/directory') || url.pathname.startsWith('/api/operators'),
  new StaleWhileRevalidate({
    cacheName: 'hc-directory',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 100 }),
    ],
  })
);

// Rate benchmarks — StaleWhileRevalidate, 24h
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/rates') || url.pathname.startsWith('/api/benchmarks'),
  new StaleWhileRevalidate({
    cacheName: 'hc-rates',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 50 }),
    ],
  })
);

// Map tiles — CacheFirst, 30 day expiry
registerRoute(
  ({ url }) => {
    const tileHosts = ['api.mapbox.com', 'tiles.mapbox.com', 'a.tile.openstreetmap.org', 'b.tile.openstreetmap.org', 'c.tile.openstreetmap.org'];
    return tileHosts.some(h => url.hostname.includes(h));
  },
  new CacheFirst({
    cacheName: 'hc-map-tiles',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60, maxEntries: 5000 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// User profile — NetworkFirst with offline fallback
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/profile') || url.pathname.startsWith('/api/auth'),
  new NetworkFirst({
    cacheName: 'hc-profile',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60, maxEntries: 10 }),
    ],
  })
);

// Static assets — CacheFirst
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'hc-static-assets',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60, maxEntries: 200 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Listen for skip waiting
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
