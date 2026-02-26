// ══════════════════════════════════════════════════════════════
// OFFLINE RESILIENCE ENGINE (Section 7)
// IndexedDB queue + auto-sync + exponential backoff
// ══════════════════════════════════════════════════════════════

const DB_NAME = 'hc_offline_v1';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

interface OfflineAction {
    id: string;
    type: 'checkin' | 'evidence_upload' | 'job_accept' | 'job_complete' | 'location_update';
    payload: any;
    createdAt: number;
    retryCount: number;
    status: 'pending' | 'syncing' | 'synced' | 'failed';
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function enqueueOfflineAction(type: OfflineAction['type'], payload: any): Promise<string> {
    const db = await openDB();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const action: OfflineAction = { id, type, payload, createdAt: Date.now(), retryCount: 0, status: 'pending' };
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).add(action);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
    });
}

export async function getPendingActions(): Promise<OfflineAction[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const idx = tx.objectStore(STORE_NAME).index('status');
        const req = idx.getAll('pending');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function updateAction(id: string, updates: Partial<OfflineAction>) {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => {
            const action = req.result;
            if (action) { Object.assign(action, updates); store.put(action); }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Sync all pending actions — exponential backoff on failure
export async function syncPendingActions(syncFn: (action: OfflineAction) => Promise<boolean>): Promise<{ synced: number; failed: number }> {
    const pending = await getPendingActions();
    let synced = 0, failed = 0;

    for (const action of pending) {
        if (action.retryCount >= 10) { await updateAction(action.id, { status: 'failed' }); failed++; continue; }
        await updateAction(action.id, { status: 'syncing' });
        try {
            const ok = await syncFn(action);
            if (ok) { await updateAction(action.id, { status: 'synced' }); synced++; }
            else { await updateAction(action.id, { status: 'pending', retryCount: action.retryCount + 1 }); failed++; }
        } catch {
            await updateAction(action.id, { status: 'pending', retryCount: action.retryCount + 1 }); failed++;
        }
    }
    return { synced, failed };
}

// Auto-sync on reconnect
export function startAutoSync(syncFn: (action: OfflineAction) => Promise<boolean>) {
    if (typeof window === 'undefined') return;
    const doSync = () => syncPendingActions(syncFn);
    window.addEventListener('online', doSync);
    // Also try every 30s if online
    setInterval(() => { if (navigator.onLine) doSync(); }, 30000);
}

export function isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
}
