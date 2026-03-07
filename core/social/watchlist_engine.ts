/**
 * WATCHLIST ENGINE — Social Gravity Engine v2, Module 8
 *
 * The #1 engagement gap: operators can't follow corridors, brokers can't
 * follow operators, nobody can subscribe to demand shifts.
 *
 * Watch types:
 *   - corridor: "I-75 FL corridor"
 *   - operator: follow a specific operator
 *   - broker: follow a broker's activity
 *   - equipment_type: "height pole" loads near me
 *
 * Digest modes:
 *   - realtime: push immediately when triggered
 *   - daily: batch into 07:15 local digest
 *   - weekly: batch into Monday 06:00 report
 *
 * Triggers:
 *   - watched_corridor_spike: demand velocity exceeds threshold
 *   - watched_operator_rising: operator's momentum band changed
 *   - new_load_matching_watch: new load matches watch criteria
 *   - price_shift_detected: rate change > 10% in watched corridor
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export type WatchType = 'corridor' | 'operator' | 'broker' | 'equipment_type';
export type DigestMode = 'realtime' | 'daily' | 'weekly';

export interface WatchlistEntry {
    id: string;
    user_id: string;
    watch_type: WatchType;
    target_id: string;          // corridor_key, operator_id, broker_id, or equipment slug
    target_label: string;       // human-readable: "I-75 FL", "John Smith", "ABC Logistics"
    digest_mode: DigestMode;
    is_active: boolean;
    metadata: Record<string, unknown>;  // extra filters (radius, min_rate, etc.)
    created_at: string;
    last_triggered_at: string | null;
    trigger_count: number;
}

export interface WatchTriggerEvent {
    watch_id: string;
    user_id: string;
    watch_type: WatchType;
    target_id: string;
    trigger_type: string;       // watched_corridor_spike, new_load_matching_watch, etc.
    title: string;
    body: string;
    data: Record<string, unknown>;
    priority: 'high' | 'normal' | 'low';
    created_at: string;
}

export interface WatchDigest {
    user_id: string;
    digest_mode: DigestMode;
    period_start: string;
    period_end: string;
    events: WatchTriggerEvent[];
    summary: {
        total_events: number;
        corridors_watched: number;
        operators_watched: number;
        top_event: WatchTriggerEvent | null;
    };
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_WATCHES_PER_USER = 25;
const MAX_REALTIME_PUSHES_PER_DAY = 8;
const TRIGGER_COOLDOWN_MINUTES = 30;  // Same watch can't fire within 30min

const TRIGGER_TEMPLATES: Record<string, { title: string; body: string }> = {
    watched_corridor_spike: {
        title: 'demand rising in {{target_label}}',
        body: '{{load_count}} loads posted in the last {{hours}}h. operators getting booked.',
    },
    watched_operator_rising: {
        title: '{{target_label}} is rising',
        body: 'momentum band changed to {{new_band}}. they just completed {{jobs}} jobs.',
    },
    new_load_matching_watch: {
        title: 'new load in {{target_label}}',
        body: '{{load_summary}} — matches your watch criteria.',
    },
    price_shift_detected: {
        title: 'rate shift in {{target_label}}',
        body: 'rates {{direction}} {{pct}}% in the last 24h. current median: ${{rate}}/mi.',
    },
    watched_broker_returned: {
        title: 'a watched broker is active',
        body: '{{target_label}} posted {{load_count}} loads in your corridor.',
    },
    watched_equipment_demand: {
        title: '{{target_label}} demand spike',
        body: '{{load_count}} {{target_label}} loads posted near you today.',
    },
};

// ── Engine ────────────────────────────────────────────────────────────────────

export class WatchlistEngine {
    constructor(private db: SupabaseClient) { }

    // ── CRUD ──────────────────────────────────────────────────────────────

    async addWatch(
        userId: string,
        watchType: WatchType,
        targetId: string,
        targetLabel: string,
        digestMode: DigestMode = 'daily',
        metadata: Record<string, unknown> = {},
    ): Promise<{ ok: boolean; watch?: WatchlistEntry; error?: string }> {
        // Check cap
        const { count } = await this.db
            .from('watchlist')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true);

        if ((count ?? 0) >= MAX_WATCHES_PER_USER) {
            return { ok: false, error: `max ${MAX_WATCHES_PER_USER} watches per user` };
        }

        // Check for duplicate
        const { data: existing } = await this.db
            .from('watchlist')
            .select('id')
            .eq('user_id', userId)
            .eq('watch_type', watchType)
            .eq('target_id', targetId)
            .eq('is_active', true)
            .limit(1);

        if (existing && existing.length > 0) {
            return { ok: false, error: 'already watching this target' };
        }

        const { data, error } = await this.db
            .from('watchlist')
            .insert({
                user_id: userId,
                watch_type: watchType,
                target_id: targetId,
                target_label: targetLabel,
                digest_mode: digestMode,
                is_active: true,
                metadata,
                trigger_count: 0,
            })
            .select()
            .single();

        if (error) return { ok: false, error: error.message };
        return { ok: true, watch: data };
    }

    async removeWatch(userId: string, watchId: string): Promise<boolean> {
        const { error } = await this.db
            .from('watchlist')
            .update({ is_active: false })
            .eq('id', watchId)
            .eq('user_id', userId);
        return !error;
    }

    async updateDigestMode(
        userId: string,
        watchId: string,
        mode: DigestMode,
    ): Promise<boolean> {
        const { error } = await this.db
            .from('watchlist')
            .update({ digest_mode: mode })
            .eq('id', watchId)
            .eq('user_id', userId);
        return !error;
    }

    async getUserWatches(userId: string): Promise<WatchlistEntry[]> {
        const { data } = await this.db
            .from('watchlist')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        return data ?? [];
    }

    // ── TRIGGER EVALUATION ────────────────────────────────────────────────

    /**
     * Evaluate all watches for a specific trigger type & target.
     * Called by event stream when corridor_spike, load_posted, etc. fires.
     */
    async evaluateTrigger(
        triggerType: string,
        targetType: WatchType,
        targetId: string,
        eventData: Record<string, unknown>,
    ): Promise<{ triggered: number; queued: number; realtime: number }> {
        // Find all active watches matching this target
        const { data: watches } = await this.db
            .from('watchlist')
            .select('*')
            .eq('watch_type', targetType)
            .eq('target_id', targetId)
            .eq('is_active', true);

        if (!watches || watches.length === 0) {
            return { triggered: 0, queued: 0, realtime: 0 };
        }

        let triggered = 0;
        let queued = 0;
        let realtime = 0;

        for (const watch of watches) {
            // Cooldown check
            if (watch.last_triggered_at) {
                const lastFired = new Date(watch.last_triggered_at).getTime();
                const cooldownMs = TRIGGER_COOLDOWN_MINUTES * 60 * 1000;
                if (Date.now() - lastFired < cooldownMs) continue;
            }

            // Build notification from template
            const template = TRIGGER_TEMPLATES[triggerType];
            if (!template) continue;

            const title = this.interpolate(template.title, {
                target_label: watch.target_label,
                ...eventData,
            });
            const body = this.interpolate(template.body, {
                target_label: watch.target_label,
                ...eventData,
            });

            const event: Omit<WatchTriggerEvent, 'created_at'> = {
                watch_id: watch.id,
                user_id: watch.user_id,
                watch_type: watch.watch_type,
                target_id: watch.target_id,
                trigger_type: triggerType,
                title,
                body,
                data: eventData,
                priority: this.computePriority(triggerType, eventData),
            };

            // Store event
            await this.db.from('watchlist_events').insert({
                ...event,
                digest_mode: watch.digest_mode,
                delivered: watch.digest_mode === 'realtime',
            });

            // Update watch
            await this.db
                .from('watchlist')
                .update({
                    last_triggered_at: new Date().toISOString(),
                    trigger_count: (watch.trigger_count ?? 0) + 1,
                })
                .eq('id', watch.id);

            triggered++;

            // Route by digest mode
            if (watch.digest_mode === 'realtime') {
                const sent = await this.sendRealtimePush(watch.user_id, event);
                if (sent) realtime++;
            } else {
                queued++;  // Will be picked up by daily/weekly digest cron
            }
        }

        return { triggered, queued, realtime };
    }

    // ── DIGEST BUILDER ────────────────────────────────────────────────────

    /**
     * Build digest for a user. Called by daily (07:15) or weekly (Mon 06:00) cron.
     */
    async buildDigest(
        userId: string,
        mode: DigestMode,
    ): Promise<WatchDigest | null> {
        const periodHours = mode === 'daily' ? 24 : 168;
        const periodStart = new Date(Date.now() - periodHours * 3600000).toISOString();
        const periodEnd = new Date().toISOString();

        const { data: events } = await this.db
            .from('watchlist_events')
            .select('*')
            .eq('user_id', userId)
            .eq('digest_mode', mode)
            .eq('delivered', false)
            .gte('created_at', periodStart)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!events || events.length === 0) return null;

        // Mark as delivered
        const eventIds = events.map((e: any) => e.id);
        await this.db
            .from('watchlist_events')
            .update({ delivered: true })
            .in('id', eventIds);

        // Get watch stats
        const { data: watches } = await this.db
            .from('watchlist')
            .select('watch_type')
            .eq('user_id', userId)
            .eq('is_active', true);

        const corridors = (watches ?? []).filter((w: any) => w.watch_type === 'corridor').length;
        const operators = (watches ?? []).filter((w: any) => w.watch_type === 'operator').length;

        return {
            user_id: userId,
            digest_mode: mode,
            period_start: periodStart,
            period_end: periodEnd,
            events,
            summary: {
                total_events: events.length,
                corridors_watched: corridors,
                operators_watched: operators,
                top_event: events[0] ?? null,
            },
        };
    }

    /**
     * Run digest for all users with a given mode. Called by cron.
     */
    async runDigestBatch(mode: DigestMode): Promise<{ processed: number; sent: number }> {
        // Get users with undelivered events for this mode
        const { data: users } = await this.db
            .from('watchlist_events')
            .select('user_id')
            .eq('digest_mode', mode)
            .eq('delivered', false)
            .limit(500);

        if (!users) return { processed: 0, sent: 0 };

        const uniqueUsers = [...new Set(users.map((u: any) => u.user_id))];
        let sent = 0;

        for (const userId of uniqueUsers) {
            const digest = await this.buildDigest(userId, mode);
            if (digest && digest.events.length > 0) {
                // Queue notification
                await this.db.from('push_queue').insert({
                    user_id: userId,
                    channel: 'in_app',
                    title: mode === 'daily'
                        ? `${digest.summary.total_events} updates from your watchlist`
                        : `weekly watchlist report: ${digest.summary.total_events} events`,
                    body: digest.summary.top_event
                        ? digest.summary.top_event.title
                        : 'check your watched corridors and operators.',
                    data: {
                        type: 'watchlist_digest',
                        mode,
                        event_count: digest.summary.total_events,
                        top_trigger: digest.summary.top_event?.trigger_type,
                    },
                });
                sent++;
            }
        }

        return { processed: uniqueUsers.length, sent };
    }

    // ── HELPERS ────────────────────────────────────────────────────────────

    private async sendRealtimePush(
        userId: string,
        event: Omit<WatchTriggerEvent, 'created_at'>,
    ): Promise<boolean> {
        // Check daily push limit
        const dayAgo = new Date(Date.now() - 86400000).toISOString();
        const { count } = await this.db
            .from('push_queue')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', dayAgo);

        if ((count ?? 0) >= MAX_REALTIME_PUSHES_PER_DAY) return false;

        await this.db.from('push_queue').insert({
            user_id: userId,
            channel: 'push',
            title: event.title,
            body: event.body,
            data: {
                type: 'watchlist_trigger',
                watch_id: event.watch_id,
                trigger_type: event.trigger_type,
                target_id: event.target_id,
                ...event.data,
            },
        });
        return true;
    }

    private computePriority(
        triggerType: string,
        data: Record<string, unknown>,
    ): 'high' | 'normal' | 'low' {
        if (triggerType === 'watched_corridor_spike') return 'high';
        if (triggerType === 'new_load_matching_watch') return 'high';
        if (triggerType === 'price_shift_detected') {
            const pct = Number(data.pct ?? 0);
            return pct > 15 ? 'high' : 'normal';
        }
        return 'normal';
    }

    private interpolate(template: string, vars: Record<string, unknown>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? key));
    }
}
