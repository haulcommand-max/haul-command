/**
 * Haul Command — Background Location Engine
 * 
 * Wraps @capacitor/geolocation for foreground + background pings.
 * Calls hc_ping_location RPC on Supabase with each position fix.
 * Falls back to local storage queue if offline (flush on reconnect).
 */

import { Geolocation, type Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { createClient } from '@/utils/supabase/client';
import { safeUUID } from '@/lib/identity/uid';

// ─── Types ────────────────────────────────────────────────
export interface LocationPing {
    lat: number;
    lng: number;
    accuracy_m?: number;
    altitude_m?: number;
    speed_mps?: number;
    heading_deg?: number;
    is_moving?: boolean;
    source?: string;
    device_id?: string;
    session_id?: string;
    occurred_at?: string;
}

interface PendingPing extends LocationPing {
    queued_at: string;
}

// ─── Constants ────────────────────────────────────────────
const OFFLINE_QUEUE_KEY = 'hc_location_queue';
const SESSION_ID_KEY = 'hc_location_session';
const DEFAULT_INTERVAL_MS = 30_000; // 30s (overridden by entitlements)

// ─── Session ID (per app launch) ──────────────────────────
function getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    let sid = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
        sid = safeUUID();
        sessionStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
}

// ─── Offline Queue ────────────────────────────────────────
function enqueuePing(ping: LocationPing): void {
    if (typeof window === 'undefined') return;
    const queue: PendingPing[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push({ ...ping, queued_at: new Date().toISOString() });
    // Cap at 500 pings (older ones drop)
    if (queue.length > 500) queue.splice(0, queue.length - 500);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function dequeueAll(): PendingPing[] {
    if (typeof window === 'undefined') return [];
    const queue: PendingPing[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return queue;
}

// ─── Send ping to Supabase ────────────────────────────────
async function sendPing(ping: LocationPing): Promise<boolean> {
    try {
        const supabase = createClient();
        const { error } = await supabase.rpc('hc_ping_location', {
            p_lat: ping.lat,
            p_lng: ping.lng,
            p_accuracy_m: ping.accuracy_m ?? null,
            p_altitude_m: ping.altitude_m ?? null,
            p_speed_mps: ping.speed_mps ?? null,
            p_heading_deg: ping.heading_deg ?? null,
            p_is_moving: ping.is_moving ?? true,
            p_source: ping.source ?? 'mobile',
            p_device_id: ping.device_id ?? null,
            p_session_id: ping.session_id ?? null,
            p_occurred_at: ping.occurred_at ?? null,
        });
        return !error;
    } catch {
        return false;
    }
}

// ─── Flush offline queue ──────────────────────────────────
export async function flushOfflineQueue(): Promise<number> {
    const queue = dequeueAll();
    if (!queue.length) return 0;

    let flushed = 0;
    // Send in batches of 10
    for (let i = 0; i < queue.length; i += 10) {
        const batch = queue.slice(i, i + 10);
        const results = await Promise.allSettled(batch.map(p => sendPing(p)));
        flushed += results.filter(r => r.status === 'fulfilled' && r.value).length;
    }
    return flushed;
}

// ─── Convert Capacitor Position → LocationPing ────────────
function positionToPing(pos: Position): LocationPing {
    return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_m: pos.coords.accuracy ?? undefined,
        altitude_m: pos.coords.altitude ?? undefined,
        speed_mps: pos.coords.speed ?? undefined,
        heading_deg: pos.coords.heading ?? undefined,
        is_moving: (pos.coords.speed ?? 0) > 0.5,
        source: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
        session_id: getSessionId(),
        occurred_at: new Date(pos.timestamp).toISOString(),
    };
}

// ─── Single shot: get + send ──────────────────────────────
export async function pingCurrentLocation(): Promise<LocationPing | null> {
    try {
        const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 10_000,
        });
        const ping = positionToPing(pos);
        const sent = await sendPing(ping);
        if (!sent) enqueuePing(ping);
        return ping;
    } catch {
        return null;
    }
}

// ─── Continuous watcher ───────────────────────────────────
let _watchId: string | null = null;
let _intervalId: ReturnType<typeof setInterval> | null = null;

export async function startLocationTracking(
    intervalMs: number = DEFAULT_INTERVAL_MS
): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        // Web fallback: use setInterval with getCurrentPosition
        if (_intervalId) return true;
        _intervalId = setInterval(() => pingCurrentLocation(), intervalMs);
        await pingCurrentLocation(); // immediate first ping
        return true;
    }

    try {
        // Native: use watchPosition for battery-efficient tracking
        _watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: false },
            async (pos, err) => {
                if (err || !pos) return;
                const ping = positionToPing(pos);
                const sent = await sendPing(ping);
                if (!sent) enqueuePing(ping);
            }
        );
        return true;
    } catch {
        return false;
    }
}

export async function stopLocationTracking(): Promise<void> {
    if (_watchId) {
        await Geolocation.clearWatch({ id: _watchId });
        _watchId = null;
    }
    if (_intervalId) {
        clearInterval(_intervalId);
        _intervalId = null;
    }
}

// ─── Permission check ─────────────────────────────────────
export async function requestLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
        const status = await Geolocation.requestPermissions();
        return status.location === 'granted' ? 'granted' : status.location === 'denied' ? 'denied' : 'prompt';
    } catch {
        return 'denied';
    }
}

// ─── Reconnect listener (flush queue when back online) ────
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        flushOfflineQueue().then(n => {
            if (n > 0) console.log(`[hc-location] Flushed ${n} offline pings`);
        });
    });
}
