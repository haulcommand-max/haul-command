// lib/offline/queue.ts
// ═══════════════════════════════════════════════════════════════
// HAUL COMMAND — Offline Request Queue
// ═══════════════════════════════════════════════════════════════
// When POST/PUT requests fail due to no connection, queue them
// in IndexedDB and replay when connection returns.
// ═══════════════════════════════════════════════════════════════

const DB_NAME = 'hc_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending_requests';

export interface QueuedRequest {
  id?: number;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: string;
  headers: Record<string, string>;
  queued_at: string;
  type: 'milestone' | 'breadcrumb' | 'message' | 'availability' | 'location' | 'general';
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('queued_at', 'queued_at', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Enqueue a failed request ──
export async function enqueueRequest(req: Omit<QueuedRequest, 'id' | 'retries'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ ...req, retries: 0 });
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineQueue] Failed to enqueue:', err);
  }
}

// ── Get pending count ──
export async function getPendingCount(): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const count = store.count();
      count.onsuccess = () => resolve(count.result);
      count.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

// ── Get all pending items ──
export async function getPendingRequests(): Promise<QueuedRequest[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ── Replay all queued requests ──
export async function replayQueue(): Promise<{ success: number; failed: number }> {
  const result = { success: 0, failed: 0 };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const items: QueuedRequest[] = await new Promise((resolve) => {
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => resolve([]);
    });

    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        if (res.ok) {
          // Remove from queue
          const deleteTx = db.transaction(STORE_NAME, 'readwrite');
          deleteTx.objectStore(STORE_NAME).delete(item.id!);
          result.success++;
        } else if (item.retries < 3) {
          // Increment retry count
          const retryTx = db.transaction(STORE_NAME, 'readwrite');
          retryTx.objectStore(STORE_NAME).put({ ...item, retries: item.retries + 1 });
          result.failed++;
        } else {
          // Max retries — remove
          const deleteTx = db.transaction(STORE_NAME, 'readwrite');
          deleteTx.objectStore(STORE_NAME).delete(item.id!);
          result.failed++;
        }
      } catch {
        result.failed++;
        break; // Still offline
      }
    }
  } catch (err) {
    console.warn('[OfflineQueue] Replay error:', err);
  }

  return result;
}

// ── Fetch wrapper with offline queue ──
export async function resilientFetch(
  url: string,
  options: RequestInit & { queueType?: QueuedRequest['type'] } = {}
): Promise<Response> {
  const { queueType = 'general', ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  try {
    const res = await fetch(url, fetchOptions);
    return res;
  } catch (err) {
    // Network error — queue if it's a mutation
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await enqueueRequest({
        url,
        method: method as QueuedRequest['method'],
        body: typeof fetchOptions.body === 'string' ? fetchOptions.body : JSON.stringify(fetchOptions.body),
        headers: (fetchOptions.headers as Record<string, string>) || { 'Content-Type': 'application/json' },
        queued_at: new Date().toISOString(),
        type: queueType,
      });
    }
    throw err;
  }
}

// ── Connection listener — auto-replay on reconnect ──
export function initConnectionListener(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('[OfflineQueue] Connection restored — replaying queue...');
    const result = await replayQueue();
    console.log(`[OfflineQueue] Replayed: ${result.success} success, ${result.failed} failed`);
  });
}
