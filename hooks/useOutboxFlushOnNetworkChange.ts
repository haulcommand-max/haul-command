/**
 * Haul Command — useOutboxFlushOnNetworkChange()
 *
 * Triggers outbox flush on:
 *   1. Network status change ("online" event)
 *   2. App resume from background (Capacitor App.stateChange)
 *   3. Visibility change (browser tab refocus)
 *
 * Flushes both the location outbox (localStorage) and the
 * SQLite outbox (if on native), plus the evidence upload queue.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { flushOfflineQueue } from '@/lib/mobile/location';
import { flushEvidenceQueue, getQueuedUploadCount } from '@/lib/mobile/evidence';
import { isNativePlatform } from '@/lib/mobile/platform';

// ─── Types ────────────────────────────────────────────────
interface FlushStats {
    locationPings: number;
    evidencePhotos: number;
    sqliteEvents: number;
    lastFlushAt: string | null;
    isOnline: boolean;
    isFlushing: boolean;
}

interface UseOutboxFlushOptions {
    /** Auto-flush on mount if online (default: true) */
    autoFlushOnMount?: boolean;
    /** Debounce ms to avoid rapid-fire flushes (default: 2000) */
    debounceMs?: number;
    /** Callback after a successful flush */
    onFlush?: (stats: { location: number; evidence: number; sqlite: number }) => void;
}

// ─── Hook ─────────────────────────────────────────────────
export function useOutboxFlushOnNetworkChange(
    options: UseOutboxFlushOptions = {}
): FlushStats & { flushNow: () => Promise<void> } {
    const { autoFlushOnMount = true, debounceMs = 2000, onFlush } = options;

    const [stats, setStats] = useState<FlushStats>({
        locationPings: 0,
        evidencePhotos: 0,
        sqliteEvents: 0,
        lastFlushAt: null,
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isFlushing: false,
    });

    const flushInProgress = useRef(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const appListenerRef = useRef<any>(null);

    // ── Core flush logic ───────────────────────────────────
    const doFlush = useCallback(async () => {
        if (flushInProgress.current) return;
        if (!navigator.onLine) return;

        flushInProgress.current = true;
        setStats(prev => ({ ...prev, isFlushing: true }));

        let locationCount = 0;
        let evidenceCount = 0;
        let sqliteCount = 0;

        try {
            // 1. Flush localStorage location pings
            locationCount = await flushOfflineQueue();

            // 2. Flush evidence upload queue
            evidenceCount = await flushEvidenceQueue();

            // 3. Flush SQLite outbox (native only)
            if (isNativePlatform()) {
                try {
                    // Dynamic import to avoid SSR issues
                    const { flushOutbox } = await import('@/lib/mobile/sync/orchestrator');
                    const result = await flushOutbox();
                    sqliteCount = result.processed;
                } catch {
                    // SQLite not initialized — skip
                }
            }

            const now = new Date().toISOString();
            setStats(prev => ({
                ...prev,
                locationPings: prev.locationPings + locationCount,
                evidencePhotos: prev.evidencePhotos + evidenceCount,
                sqliteEvents: prev.sqliteEvents + sqliteCount,
                lastFlushAt: now,
                isFlushing: false,
            }));

            if (onFlush && (locationCount + evidenceCount + sqliteCount) > 0) {
                onFlush({ location: locationCount, evidence: evidenceCount, sqlite: sqliteCount });
            }

            if (locationCount + evidenceCount + sqliteCount > 0) {
                console.log(
                    `[outbox-flush] Synced: ${locationCount} pings, ${evidenceCount} photos, ${sqliteCount} sqlite events`
                );
            }
        } catch (err) {
            console.warn('[outbox-flush] Error during flush:', err);
            setStats(prev => ({ ...prev, isFlushing: false }));
        } finally {
            flushInProgress.current = false;
        }
    }, [onFlush]);

    // ── Debounced flush (prevents rapid-fire on flaky connections) ──
    const debouncedFlush = useCallback(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            doFlush();
        }, debounceMs);
    }, [doFlush, debounceMs]);

    // ── Manual trigger ─────────────────────────────────────
    const flushNow = useCallback(async () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        await doFlush();
    }, [doFlush]);

    // ── 1. Network change: online/offline ──────────────────
    useEffect(() => {
        const handleOnline = () => {
            setStats(prev => ({ ...prev, isOnline: true }));
            debouncedFlush();
        };

        const handleOffline = () => {
            setStats(prev => ({ ...prev, isOnline: false }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [debouncedFlush]);

    // ── 2. Capacitor App.stateChange (resume from background) ──
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let cleanup: (() => void) | undefined;

        (async () => {
            try {
                const { App } = await import('@capacitor/app');
                const listener = await App.addListener('appStateChange', (state) => {
                    if (state.isActive) {
                        // App just resumed — flush outbox
                        debouncedFlush();
                    }
                });
                appListenerRef.current = listener;
                cleanup = () => listener.remove();
            } catch {
                // @capacitor/app not installed — skip
            }
        })();

        return () => {
            if (cleanup) cleanup();
        };
    }, [debouncedFlush]);

    // ── 3. Visibility change (browser tab refocus) ─────────
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && navigator.onLine) {
                debouncedFlush();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [debouncedFlush]);

    // ── 4. Auto-flush on mount ─────────────────────────────
    useEffect(() => {
        if (autoFlushOnMount && navigator.onLine) {
            // Slight delay to let the app hydrate
            const t = setTimeout(() => doFlush(), 1000);
            return () => clearTimeout(t);
        }
    }, [autoFlushOnMount, doFlush]);

    // ── Cleanup timers ─────────────────────────────────────
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    return { ...stats, flushNow };
}
