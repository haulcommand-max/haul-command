/* public/sw.js
 * Haul Command PWA Service Worker (production template)
 * - Offline shell
 * - Runtime caching (directory + assets)
 * - Push notifications
 * - Basic background sync queue stub (extend later)
 */

const VERSION = 'hc-sw-v1';
const APP_SHELL_CACHE = `hc-app-shell-${VERSION}`;
const RUNTIME_CACHE = `hc-runtime-${VERSION}`;

// App shell: keep this list small and stable
const APP_SHELL_ASSETS = [
    '/',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((k) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(k))
                    .map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

// Network helpers
async function cacheFirst(req) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
}

async function staleWhileRevalidate(req) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req)
        .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
        })
        .catch(() => null);

    return cached || (await fetchPromise) || Response.error();
}

async function networkFirst(req) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
    } catch (e) {
        const cached = await cache.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Only handle same-origin GET requests
    if (req.method !== 'GET' || url.origin !== self.location.origin) return;

    // App shell + static assets: cache-first
    if (
        url.pathname.startsWith('/_next/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.svg')
    ) {
        event.respondWith(cacheFirst(req));
        return;
    }

    // Directory pages: stale-while-revalidate
    if (url.pathname.startsWith('/directory/') || url.pathname.startsWith('/corridors/') || url.pathname.startsWith('/ports/')) {
        event.respondWith(staleWhileRevalidate(req));
        return;
    }

    // API pulse endpoints: network-first (falls back to cached JSON)
    if (url.pathname.startsWith('/api/market-pulse') || url.pathname.startsWith('/api/route-iq')) {
        event.respondWith(networkFirst(req));
        return;
    }

    // Default: stale-while-revalidate for most pages
    event.respondWith(staleWhileRevalidate(req));
});

// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Haul Command';
    const options = {
        body: data.body || 'New activity on your routes.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: {
            url: data.url || '/',
            meta: data.meta || {},
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || '/';

    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const client = allClients.find((c) => c.url.includes(self.location.origin));
            if (client) {
                client.navigate(targetUrl);
                client.focus();
                return;
            }
            self.clients.openWindow(targetUrl);
        })()
    );
});

// BACKGROUND SYNC STUB (extend later)
self.addEventListener('sync', (event) => {
    if (event.tag === 'hc-sync-queue') {
        event.waitUntil(Promise.resolve()); // implement queued actions later
    }
});
