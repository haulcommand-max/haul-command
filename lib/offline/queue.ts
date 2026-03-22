/**
 * HAUL COMMAND — Offline Request Queue
 *
 * Stores failed POST/PUT requests in IndexedDB.
 * Replays them in order when connection returns.
 * Shows sync count in app nav.
 */

const DB_NAME = 'hc_offline_queue';
const STORE_NAME = 'requests';
const DB_VERSION = 1;

export interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body: unknown;
  timestamp: number;
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('No IndexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(item: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({ ...item, timestamp: Date.now(), retries: 0 });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAll(): Promise<QueuedRequest[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function remove(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function count(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const req = tx.objectStore(STORE_NAME).count();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function replay(): Promise<{ success: number; failed: number }> {
  const items = await getAll();
  let success = 0, failed = 0;
  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      });
      if (res.ok && item.id) {
        await remove(item.id);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { success, failed };
}

/** Listen for connectivity changes and auto-replay */
function autoSync(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { replay().catch(() => {}); });
}

export const offlineQueue = { enqueue, getAll, remove, count, replay, autoSync };
