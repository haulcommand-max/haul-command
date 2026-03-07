/**
 * HAUL COMMAND — Offline Action Queue
 * IndexedDB-backed queue for field actions that sync when signal returns.
 * Retry-safe, idempotent, conflict-aware.
 */

const DB_NAME = 'hc_offline_queue';
const STORE_NAME = 'actions';
const DB_VERSION = 1;

export interface QueuedAction {
    id: string;
    type: 'status_update' | 'proof_upload' | 'availability_toggle' | 'load_accept' | 'load_decline' | 'invoice_submit' | 'doc_upload' | 'position_update' | 'message_send';
    payload: Record<string, any>;
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    created_at: string;
    retry_count: number;
    max_retries: number;
    status: 'pending' | 'syncing' | 'failed' | 'completed';
    idempotency_key: string;
    priority: number;  // 1=highest
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not available'));
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('priority', 'priority', { unique: false });
                store.createIndex('created_at', 'created_at', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Enqueue an action for later sync */
export async function enqueueAction(
    type: QueuedAction['type'],
    endpoint: string,
    payload: Record<string, any>,
    options?: { method?: QueuedAction['method']; priority?: number; maxRetries?: number }
): Promise<string> {
    const db = await openDB();
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const action: QueuedAction = {
        id,
        type,
        payload,
        endpoint,
        method: options?.method || 'POST',
        created_at: new Date().toISOString(),
        retry_count: 0,
        max_retries: options?.maxRetries ?? 5,
        status: 'pending',
        idempotency_key: id,
        priority: options?.priority ?? 5,
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).add(action);
        tx.oncomplete = () => { db.close(); resolve(id); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** Get all pending actions sorted by priority */
export async function getPendingActions(): Promise<QueuedAction[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const idx = tx.objectStore(STORE_NAME).index('status');
        const req = idx.getAll('pending');
        req.onsuccess = () => {
            db.close();
            const actions = req.result as QueuedAction[];
            resolve(actions.sort((a, b) => a.priority - b.priority || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        };
        req.onerror = () => { db.close(); reject(req.error); };
    });
}

/** Update action status */
async function updateAction(id: string, updates: Partial<QueuedAction>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
            if (getReq.result) {
                store.put({ ...getReq.result, ...updates });
            }
        };
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** Remove completed actions older than N hours */
export async function cleanupCompleted(maxAgeHours = 24): Promise<number> {
    const db = await openDB();
    const cutoff = Date.now() - maxAgeHours * 3600000;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.openCursor();
        let removed = 0;
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                const action = cursor.value as QueuedAction;
                if (action.status === 'completed' && new Date(action.created_at).getTime() < cutoff) {
                    cursor.delete();
                    removed++;
                }
                cursor.continue();
            }
        };
        tx.oncomplete = () => { db.close(); resolve(removed); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** Sync all pending actions — call when online */
export async function syncQueue(): Promise<{ synced: number; failed: number; remaining: number }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { synced: 0, failed: 0, remaining: (await getPendingActions()).length };
    }

    const actions = await getPendingActions();
    let synced = 0;
    let failed = 0;

    for (const action of actions) {
        await updateAction(action.id, { status: 'syncing' });

        try {
            const res = await fetch(action.endpoint, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': action.idempotency_key,
                },
                body: JSON.stringify(action.payload),
            });

            if (res.ok || res.status === 409) {
                // 409 = already processed (idempotent)
                await updateAction(action.id, { status: 'completed' });
                synced++;
            } else if (res.status >= 500) {
                // Server error — retry later
                const newRetry = action.retry_count + 1;
                if (newRetry >= action.max_retries) {
                    await updateAction(action.id, { status: 'failed', retry_count: newRetry });
                    failed++;
                } else {
                    await updateAction(action.id, { status: 'pending', retry_count: newRetry });
                }
            } else {
                // Client error — don't retry
                await updateAction(action.id, { status: 'failed', retry_count: action.retry_count + 1 });
                failed++;
            }
        } catch {
            // Network error — retry
            await updateAction(action.id, { status: 'pending', retry_count: action.retry_count + 1 });
        }
    }

    const remaining = (await getPendingActions()).length;
    return { synced, failed, remaining };
}

/** Get queue stats */
export async function getQueueStats(): Promise<{ pending: number; failed: number; completed: number }> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            db.close();
            const all = req.result as QueuedAction[];
            resolve({
                pending: all.filter(a => a.status === 'pending' || a.status === 'syncing').length,
                failed: all.filter(a => a.status === 'failed').length,
                completed: all.filter(a => a.status === 'completed').length,
            });
        };
        req.onerror = () => { db.close(); reject(req.error); };
    });
}

/** Initialize auto-sync on online event */
export function initAutoSync() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
        console.log('[HC Offline Queue] Back online — syncing...');
        syncQueue().then(r => console.log(`[HC Offline Queue] Synced: ${r.synced}, Failed: ${r.failed}, Remaining: ${r.remaining}`));
    });
    // Periodic cleanup
    setInterval(() => cleanupCompleted(48), 3600000);
}
