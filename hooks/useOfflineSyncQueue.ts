'use client';
/**
 * hooks/useOfflineSyncQueue.ts
 * Haul Command — Offline Sync Queue Resolver
 *
 * Problem: Operators in dead zones toggle availability or submit status updates.
 *          These need to sync the moment connectivity is restored.
 *
 * Solution:
 *   1. All state-changing actions go through queueAction()
 *   2. If online → execute immediately via API
 *   3. If offline → persist to IndexedDB (survives page close)
 *   4. On reconnect → drain queue in order, with retry backoff
 *   5. Conflict resolution: last-write-wins by timestamp
 *
 * Usage:
 *   const { queueAction, pendingCount, isSyncing } = useOfflineSyncQueue();
 *   await queueAction({ type: 'availability.toggle', payload: { status: 'online' } });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface QueuedAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number; // epoch ms
  attempts: number;
  lastAttemptAt?: number;
}

export interface SyncResult {
  succeeded: number;
  failed: number;
  errors: { id: string; error: string }[];
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = 'hc_offline_queue';
const STORE_NAME = 'actions';
const DB_VERSION = 1;

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function persistAction(action: QueuedAction): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function removeAction(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllActions(): Promise<QueuedAction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve((req.result as QueuedAction[]).sort((a, b) => a.createdAt - b.createdAt));
    req.onerror = () => reject(req.error);
  });
}

// ─── API executor ─────────────────────────────────────────────────────────────
const ACTION_ENDPOINTS: Record<string, string> = {
  'availability.toggle': '/api/operator/availability',
  'location.update': '/api/operator/location',
  'checklist.completed': '/api/operator/checklist',
  'load.bid': '/api/loads/bid',
  'profile.update': '/api/operator/profile',
  'assignment.acknowledge': '/api/dispatch/acknowledge',
};

async function executeAction(action: QueuedAction): Promise<void> {
  const endpoint = ACTION_ENDPOINTS[action.type];
  if (!endpoint) throw new Error(`No endpoint configured for action type: ${action.type}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...action.payload,
      _offline_action_id: action.id,
      _queued_at: action.createdAt,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export function useOfflineSyncQueue() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const syncLock = useRef(false);

  // Load pending count on mount
  useEffect(() => {
    if (typeof indexedDB === 'undefined') return;
    loadAllActions().then((actions) => setPendingCount(actions.length)).catch(console.error);
  }, []);

  // Listen for online/offline transitions
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Drain queue when coming back online
  const drainQueue = useCallback(async (): Promise<SyncResult> => {
    if (syncLock.current) return { succeeded: 0, failed: 0, errors: [] };
    syncLock.current = true;
    setIsSyncing(true);

    const actions = await loadAllActions();
    const result: SyncResult = { succeeded: 0, failed: 0, errors: [] };

    for (const action of actions) {
      if (action.attempts >= MAX_ATTEMPTS) {
        result.failed++;
        result.errors.push({ id: action.id, error: 'Max retry attempts exceeded' });
        await removeAction(action.id);
        continue;
      }

      try {
        await executeAction(action);
        await removeAction(action.id);
        result.succeeded++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        result.errors.push({ id: action.id, error: errorMsg });
        await persistAction({
          ...action,
          attempts: action.attempts + 1,
          lastAttemptAt: Date.now(),
        });
        result.failed++;
        // Brief delay between retries
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    const remaining = await loadAllActions();
    setPendingCount(remaining.length);
    setLastSyncResult(result);
    setIsSyncing(false);
    syncLock.current = false;
    return result;
  }, []);

  // Auto-drain when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      drainQueue().catch(console.error);
    }
  }, [isOnline, pendingCount, drainQueue]);

  /**
   * Queue a new action. If online, executes immediately.
   * If offline, persists to IndexedDB and executes on reconnect.
   */
  const queueAction = useCallback(
    async (action: { type: string; payload: Record<string, unknown> }) => {
      const queued: QueuedAction = {
        id: `${action.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: action.type,
        payload: action.payload,
        createdAt: Date.now(),
        attempts: 0,
      };

      if (isOnline) {
        // Try immediate execution
        try {
          await executeAction(queued);
          return { queued: false, executed: true };
        } catch {
          // Fall through to queue
        }
      }

      // Offline or execute failed — queue it
      await persistAction(queued);
      setPendingCount((c) => c + 1);
      return { queued: true, executed: false };
    },
    [isOnline]
  );

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncResult,
    queueAction,
    drainQueue,
  };
}
