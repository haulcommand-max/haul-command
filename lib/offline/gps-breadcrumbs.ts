/**
 * HAUL COMMAND — Offline GPS Breadcrumb Recorder
 *
 * Records GPS breadcrumbs to IndexedDB when offline on active jobs.
 * Batch uploads to gps_breadcrumbs table when connection returns.
 */

const DB_NAME = 'hc_gps_breadcrumbs';
const STORE_NAME = 'breadcrumbs';
const DB_VERSION = 1;

export interface GpsBreadcrumb {
  id?: number;
  job_id: string;
  operator_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
  uploaded: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('No IndexedDB'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_job', 'job_id', { unique: false });
        store.createIndex('by_uploaded', 'uploaded', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function recordBreadcrumb(crumb: Omit<GpsBreadcrumb, 'id' | 'uploaded'>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({ ...crumb, uploaded: false });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUnuploadedBreadcrumbs(): Promise<GpsBreadcrumb[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const index = tx.objectStore(STORE_NAME).index('by_uploaded');
  const req = index.getAll(IDBKeyRange.only(0)); // 0 = false in IndexedDB
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function markUploaded(ids: number[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const id of ids) {
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) { req.result.uploaded = true; store.put(req.result); }
    };
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function uploadBreadcrumbs(): Promise<{ uploaded: number; failed: number }> {
  const crumbs = await getUnuploadedBreadcrumbs();
  if (crumbs.length === 0) return { uploaded: 0, failed: 0 };

  // Batch upload in chunks of 100
  let uploaded = 0, failed = 0;
  for (let i = 0; i < crumbs.length; i += 100) {
    const batch = crumbs.slice(i, i + 100);
    try {
      const res = await fetch('/api/gps/breadcrumbs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breadcrumbs: batch.map(c => ({
          job_id: c.job_id, operator_id: c.operator_id,
          lat: c.lat, lng: c.lng, accuracy: c.accuracy,
          heading: c.heading, speed: c.speed, timestamp: c.timestamp,
        })) }),
      });
      if (res.ok) {
        const ids = batch.map(c => c.id).filter((id): id is number => id != null);
        await markUploaded(ids);
        uploaded += batch.length;
      } else { failed += batch.length; }
    } catch { failed += batch.length; }
  }
  return { uploaded, failed };
}

/** Auto-upload when connection returns */
export function autoUploadOnReconnect(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => { uploadBreadcrumbs().catch(() => {}); });
}
