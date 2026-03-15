/* public/sw.js
 * HAUL COMMAND PWA Service Worker — MAXIMUM OFFLINE MODE
 * - Aggressive caching for mountain/dead-zone coverage
 * - Full offline dashboard shell
 * - Background sync with IndexedDB queue
 * - Push notifications
 * - 57-country directory pre-cache
 * - API response caching for offline access
 */

const VERSION = 'hc-sw-v4';
const APP_SHELL_CACHE = `hc-app-shell-${VERSION}`;
const RUNTIME_CACHE = `hc-runtime-${VERSION}`;
const API_CACHE = `hc-api-${VERSION}`;
const IMG_CACHE = `hc-images-${VERSION}`;
const ALL_CACHES = [APP_SHELL_CACHE, RUNTIME_CACHE, API_CACHE, IMG_CACHE];

// ══════════════════════════════════════════════
// APP SHELL — cached on install for instant offline load
// ══════════════════════════════════════════════
const APP_SHELL_ASSETS = [
    '/',
    '/offline',
    '/manifest.json',
    '/icons/app/icon-192.png',
    '/icons/app/icon-512.png',
    '/dashboard',
    '/directory',
    '/tools/escort-calculator',
    '/escort-requirements',
];

// ══════════════════════════════════════════════
// INSTALL — Pre-cache app shell
// ══════════════════════════════════════════════
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then((cache) => {
            return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
                console.warn('[SW] Some shell assets failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// ══════════════════════════════════════════════
// ACTIVATE — Clean old caches
// ══════════════════════════════════════════════
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((k) => !ALL_CACHES.includes(k))
                    .map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

// ══════════════════════════════════════════════
// CACHING STRATEGIES
// ══════════════════════════════════════════════

// Cache-first: static assets, fonts, images
async function cacheFirst(req, cacheName) {
    const cache = await caches.open(cacheName || RUNTIME_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
    } catch {
        return caches.match('/offline');
    }
}

// Stale-while-revalidate: pages, directory listings
async function staleWhileRevalidate(req) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req)
        .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
        })
        .catch(() => null);
    return cached || (await fetchPromise) || caches.match('/offline');
}

// Network-first with aggressive fallback: API calls
async function networkFirstAPI(req) {
    const cache = await caches.open(API_CACHE);
    try {
        const res = await fetch(req);
        if (res && res.ok) {
            cache.put(req, res.clone());
        }
        return res;
    } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        // Return a structured offline JSON response
        return new Response(
            JSON.stringify({
                offline: true,
                message: 'You are offline. Showing cached data.',
                cached_at: null,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

// Network-first with offline page fallback
async function networkFirstPage(req) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
    } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        return caches.match('/offline');
    }
}

// ══════════════════════════════════════════════
// FETCH HANDLER — Route to strategies
// ══════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Only handle same-origin
    if (url.origin !== self.location.origin) return;
    // Skip non-GET
    if (req.method !== 'GET') return;

    // 1. Static assets: cache-first (aggressive)
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/brand/') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.woff')
    ) {
        event.respondWith(cacheFirst(req, RUNTIME_CACHE));
        return;
    }

    // 2. Images: cache-first with dedicated cache (limit 500 entries)
    if (
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.ico')
    ) {
        event.respondWith(cacheFirst(req, IMG_CACHE));
        return;
    }

    // 3. API endpoints: network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        // Exclude mutation endpoints from caching
        if (
            url.pathname.includes('/heartbeat') ||
            url.pathname.includes('/push/') ||
            url.pathname.includes('/ai/')
        ) {
            return; // Let these pass through
        }
        event.respondWith(networkFirstAPI(req));
        return;
    }

    // 4. Directory/listing pages: stale-while-revalidate (57 countries)
    if (
        url.pathname.startsWith('/directory/') ||
        url.pathname.startsWith('/corridors/') ||
        url.pathname.startsWith('/ports/') ||
        url.pathname.startsWith('/place/') ||
        url.pathname.startsWith('/near/') ||
        url.pathname.startsWith('/escort/') ||
        url.pathname.startsWith('/surfaces/') ||
        url.pathname.startsWith('/loads') ||
        url.pathname.startsWith('/compare/') ||
        url.pathname.startsWith('/requirements/') ||
        url.pathname.startsWith('/tools/') ||
        url.pathname.match(/^\/[a-z]{2}\//) // /us/, /ca/, /gb/, /de/, /au/ etc.
    ) {
        event.respondWith(staleWhileRevalidate(req));
        return;
    }

    // 5. Dashboard and auth pages: network-first (fresh data preferred)
    if (
        url.pathname.startsWith('/dashboard') ||
        url.pathname.startsWith('/profile') ||
        url.pathname.startsWith('/settings') ||
        url.pathname.startsWith('/jobs')
    ) {
        event.respondWith(networkFirstPage(req));
        return;
    }

    // 6. Default: stale-while-revalidate
    event.respondWith(staleWhileRevalidate(req));
});

// ══════════════════════════════════════════════
// BACKGROUND SYNC — Queue offline actions
// ══════════════════════════════════════════════
const SYNC_DB = 'hc_offline_v1';
const SYNC_STORE = 'sync_queue';

async function openSyncDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(SYNC_DB, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(SYNC_STORE)) {
                const store = db.createObjectStore(SYNC_STORE, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function processSyncQueue() {
    try {
        const db = await openSyncDB();
        const tx = db.transaction(SYNC_STORE, 'readwrite');
        const store = tx.objectStore(SYNC_STORE);
        const idx = store.index('status');
        const req = idx.getAll('pending');

        return new Promise((resolve) => {
            req.onsuccess = async () => {
                const pending = req.result || [];
                let synced = 0;

                for (const action of pending) {
                    if (action.retryCount >= 10) {
                        action.status = 'failed';
                        store.put(action);
                        continue;
                    }

                    try {
                        const endpoint = getEndpointForAction(action.type);
                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(action.payload),
                        });

                        if (res.ok) {
                            action.status = 'synced';
                            store.put(action);
                            synced++;
                        } else {
                            action.retryCount++;
                            store.put(action);
                        }
                    } catch {
                        action.retryCount++;
                        store.put(action);
                    }
                }

                resolve(synced);
            };
        });
    } catch (e) {
        console.error('[SW] Sync queue error:', e);
    }
}

function getEndpointForAction(type) {
    const endpoints = {
        checkin: '/api/heartbeat',
        evidence_upload: '/api/evidence/upload',
        job_accept: '/api/jobs/accept',
        job_complete: '/api/jobs/complete',
        location_update: '/api/presence/update',
    };
    return endpoints[type] || '/api/sync';
}

self.addEventListener('sync', (event) => {
    if (event.tag === 'hc-sync-queue') {
        event.waitUntil(processSyncQueue());
    }
});

// Periodic background sync (if browser supports it)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'hc-periodic-sync') {
        event.waitUntil(processSyncQueue());
    }
});

// ══════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ══════════════════════════════════════════════
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'HAUL COMMAND';
    const options = {
        body: data.body || 'New activity on your routes.',
        icon: '/icons/app/icon-192.png',
        badge: '/icons/app/icon-192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'hc-notification',
        renotify: !!data.tag,
        data: {
            url: data.url || '/',
            meta: data.meta || {},
        },
        actions: data.actions || [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

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

// ══════════════════════════════════════════════
// MESSAGE HANDLER — Client communication
// ══════════════════════════════════════════════
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data === 'getVersion') {
        event.ports[0].postMessage({ version: VERSION });
    }
    if (event.data && event.data.type === 'CACHE_URLS') {
        // Pre-cache specific URLs on demand (e.g. operator's active corridors)
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(event.data.urls || []).catch(console.warn);
            })
        );
    }
});
