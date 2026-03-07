/**
 * Haul Command — useLocationTracking Hook
 *
 * React hook that manages:
 * 1. Permission request UI state
 * 2. Automatic start/stop based on user opt-in
 * 3. Entitlement-aware ping interval (free=60s, pro=30s, elite=15s)
 * 4. Offline queue flush on reconnect
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
    requestLocationPermission,
    startLocationTracking,
    stopLocationTracking,
    pingCurrentLocation,
    flushOfflineQueue,
    type LocationPing,
} from '@/lib/mobile/location';

// ─── Types ────────────────────────────────────────────────
export type LocationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'loading';

interface UseLocationTrackingOptions {
    /** Auto-start tracking when permission is granted */
    autoStart?: boolean;
    /** Ping interval in ms (overridden by entitlements if provided) */
    intervalMs?: number;
    /** User's tier from operator_entitlements */
    tier?: 'free' | 'basic' | 'pro' | 'elite';
}

interface UseLocationTrackingReturn {
    permission: LocationPermission;
    isTracking: boolean;
    lastPing: LocationPing | null;
    queueSize: number;
    requestPermission: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    pingNow: () => Promise<LocationPing | null>;
}

// ─── Tier → Interval mapping ─────────────────────────────
const TIER_INTERVAL: Record<string, number> = {
    free: 60_000,
    basic: 60_000,
    pro: 30_000,
    elite: 15_000,
};

// ─── Hook ─────────────────────────────────────────────────
export function useLocationTracking(
    options: UseLocationTrackingOptions = {}
): UseLocationTrackingReturn {
    const { autoStart = false, tier = 'free' } = options;
    const intervalMs = options.intervalMs ?? TIER_INTERVAL[tier] ?? 60_000;

    const [permission, setPermission] = useState<LocationPermission>('loading');
    const [isTracking, setIsTracking] = useState(false);
    const [lastPing, setLastPing] = useState<LocationPing | null>(null);
    const [queueSize, setQueueSize] = useState(0);
    const started = useRef(false);

    // Check initial permission
    useEffect(() => {
        if (!Capacitor.isPluginAvailable('Geolocation')) {
            setPermission('unsupported');
            return;
        }
        requestLocationPermission().then(p => setPermission(p));
    }, []);

    // Auto-start
    useEffect(() => {
        if (autoStart && permission === 'granted' && !started.current) {
            started.current = true;
            startLocationTracking(intervalMs).then(ok => setIsTracking(ok));
        }
    }, [autoStart, permission, intervalMs]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (started.current) {
                stopLocationTracking();
                started.current = false;
            }
        };
    }, []);

    // Queue size monitor
    useEffect(() => {
        const key = 'hc_location_queue';
        const check = () => {
            try {
                const q = JSON.parse(localStorage.getItem(key) || '[]');
                setQueueSize(q.length);
            } catch { setQueueSize(0); }
        };
        check();
        const id = setInterval(check, 5000);
        return () => clearInterval(id);
    }, []);

    const requestPerm = useCallback(async () => {
        const p = await requestLocationPermission();
        setPermission(p);
    }, []);

    const start = useCallback(async () => {
        if (permission !== 'granted') {
            await requestPerm();
        }
        const ok = await startLocationTracking(intervalMs);
        setIsTracking(ok);
        started.current = ok;
    }, [permission, intervalMs, requestPerm]);

    const stop = useCallback(async () => {
        await stopLocationTracking();
        setIsTracking(false);
        started.current = false;
    }, []);

    const pingNow = useCallback(async () => {
        const ping = await pingCurrentLocation();
        if (ping) setLastPing(ping);
        return ping;
    }, []);

    // Flush queue on reconnect
    useEffect(() => {
        const handler = () => {
            flushOfflineQueue().then(n => {
                if (n > 0) setQueueSize(prev => Math.max(0, prev - n));
            });
        };
        window.addEventListener('online', handler);
        return () => window.removeEventListener('online', handler);
    }, []);

    return {
        permission,
        isTracking,
        lastPing,
        queueSize,
        requestPermission: requestPerm,
        start,
        stop,
        pingNow,
    };
}
