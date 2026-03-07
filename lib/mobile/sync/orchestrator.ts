/**
 * Haul Command — Sync Orchestrator
 *
 * Coordinates the offline-first sync cycle:
 * 1. Background pull on launch
 * 2. Delta sync every 60 seconds
 * 3. Flush outbox on reconnect
 */

import { createClient } from '@/utils/supabase/client';
import { isNativePlatform } from '../platform';
import {
    getOutboxEvents,
    removeOutboxEvent,
    markOutboxRetry,
    cacheLoad,
    cacheLeaderboard,
    setSyncState,
    getSyncState,
    type OutboxEvent,
} from '../sqlite/engine';

// ─── Outbox processors ───────────────────────────────────
type OutboxProcessor = (event: OutboxEvent) => Promise<void>;

const processors: Record<string, OutboxProcessor> = {
    PING_LOCATION: async (event) => {
        const supabase = createClient();
        const payload = JSON.parse(event.payload);
        const { error } = await supabase.rpc('hc_ping_location', {
            p_lat: payload.lat,
            p_lng: payload.lng,
            p_accuracy_m: payload.accuracy_m ?? null,
            p_altitude_m: payload.altitude_m ?? null,
            p_speed_mps: payload.speed_mps ?? null,
            p_heading_deg: payload.heading_deg ?? null,
            p_is_moving: payload.is_moving ?? true,
            p_source: payload.source ?? 'mobile',
            p_device_id: payload.device_id ?? null,
            p_session_id: payload.session_id ?? null,
            p_occurred_at: payload.occurred_at ?? null,
        });
        if (error) throw new Error(error.message);
    },

    ACK_LOAD: async (event) => {
        const supabase = createClient();
        const payload = JSON.parse(event.payload);
        const { error } = await supabase
            .from('load_events')
            .insert({
                load_id: payload.load_id,
                event_type: payload.event_type,
                actor_id: payload.actor_id,
                metadata: payload.metadata ?? {},
            });
        if (error) throw new Error(error.message);
    },
};

// ─── Outbox flush ─────────────────────────────────────────
export async function flushOutbox(): Promise<{ processed: number; failed: number }> {
    if (!isNativePlatform()) return { processed: 0, failed: 0 };

    const events = await getOutboxEvents(50);
    let processed = 0;
    let failed = 0;

    for (const event of events) {
        const processor = processors[event.type];
        if (!processor) {
            // Unknown event type — remove to avoid infinite retry
            await removeOutboxEvent(event.id);
            continue;
        }

        try {
            await processor(event);
            await removeOutboxEvent(event.id);
            processed++;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            if (event.tries >= 5) {
                // Dead letter — remove after too many retries
                await removeOutboxEvent(event.id);
            } else {
                await markOutboxRetry(event.id, msg);
            }
            failed++;
        }
    }

    return { processed, failed };
}

// ─── Delta sync: loads ────────────────────────────────────
export async function syncLoads(): Promise<number> {
    if (!isNativePlatform()) return 0;

    const supabase = createClient();
    const state = await getSyncState('loads');
    const since = state?.last_synced_at ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('loads')
        .select('*')
        .gte('updated_at', since)
        .order('updated_at', { ascending: true })
        .limit(100);

    if (error || !data?.length) return 0;

    for (const load of data) {
        await cacheLoad(load.id, load);
    }

    const lastUpdated = data[data.length - 1].updated_at;
    await setSyncState('loads', lastUpdated);

    return data.length;
}

// ─── Delta sync: leaderboard ──────────────────────────────
export async function syncLeaderboard(scope = 'global'): Promise<boolean> {
    if (!isNativePlatform()) return false;

    const supabase = createClient();

    // Pull top operators via the hybrid ranker
    const { data, error } = await supabase.rpc('hc_search_operators', {
        p_query: '',
        p_limit: 50,
    });

    if (error || !data) return false;

    await cacheLeaderboard(scope, data);
    await setSyncState(`leaderboard_${scope}`);

    return true;
}

// ─── Master sync cycle ───────────────────────────────────
let _syncInterval: ReturnType<typeof setInterval> | null = null;

export async function startSyncCycle(intervalMs = 60_000): Promise<void> {
    if (!isNativePlatform()) return;

    // Immediate sync on launch
    await Promise.allSettled([
        flushOutbox(),
        syncLoads(),
        syncLeaderboard(),
    ]);

    // Periodic delta sync
    if (_syncInterval) clearInterval(_syncInterval);
    _syncInterval = setInterval(async () => {
        if (!navigator.onLine) return;
        await Promise.allSettled([
            flushOutbox(),
            syncLoads(),
        ]);
    }, intervalMs);
}

export function stopSyncCycle(): void {
    if (_syncInterval) {
        clearInterval(_syncInterval);
        _syncInterval = null;
    }
}

// ─── Reconnect handler ───────────────────────────────────
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        flushOutbox().then(({ processed }) => {
            if (processed > 0) console.log(`[sync] Flushed ${processed} outbox events`);
        });
    });
}
