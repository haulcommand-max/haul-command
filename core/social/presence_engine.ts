/**
 * PRESENCE & AVAILABILITY ENGINE v1.0
 *
 * Root signal layer that feeds: Social Gravity, Broker Confidence,
 * Opportunity Radar, Leaderboard, AdGrid pricing.
 *
 * 5 Canonical States:
 *   🟢 available_now  → "ready for dispatch" (money state)
 *   🟡 available_soon → "opening coming up"
 *   🔵 on_job         → "currently on a load" (trust builder)
 *   ⚪ recently_active → "recently active in this corridor"
 *   ⚫ offline         → "not checked in recently"
 *
 * Auto-Decay Rules:
 *   available_now  → 4h no signal → recently_active
 *   available_now  → 24h no signal → offline
 *   available_soon → 36h stale → recently_active
 *   on_job         → 18h no end → recently_active
 *   recently_active → 120h → offline
 *
 * Truth Guardrails:
 *   - Never show available_now if stale > 240 min
 *   - Suppress if 3+ declines in 6h window
 *   - Penalty for false availability (broker reports no response)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export type PresenceStatus = 'available_now' | 'available_soon' | 'on_job' | 'recently_active' | 'offline';

export type AvailableSoonWindow = 'later_today' | 'tomorrow' | 'within_48h' | 'custom';

export interface PresenceState {
    operator_id: string;
    status: PresenceStatus;
    previous_status: PresenceStatus;
    corridor_scope: string | null;      // null = global
    available_soon_window?: AvailableSoonWindow;
    custom_eta?: string;                // ISO date for custom ETA
    last_signal_at: string;             // last activity signal
    status_set_at: string;              // when current status was set
    freshness_minutes: number;          // minutes since last signal
    is_stale: boolean;                  // freshness > decay threshold
    source_signal: string;              // what triggered this state
}

export interface PresenceDisplay {
    status: PresenceStatus;
    icon: string;
    label: string;
    subtext: string;
    freshness_label: string;            // "updated 12m ago"
    priority_rank: number;              // 1-5 for sort ordering
    is_fresh: boolean;
}

export interface PresenceAuditEntry {
    operator_id: string;
    previous_status: PresenceStatus;
    new_status: PresenceStatus;
    timestamp_utc: string;
    corridor_scope: string | null;
    source_signal: string;
    freshness_minutes: number;
}

export interface PresenceLeaderboardPoints {
    check_in: number;
    available_minutes: number;
    on_job_confirmation: number;
    accuracy_bonus: number;
    false_availability_penalty: number;
    total: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresenceStatus, {
    icon: string;
    label_broker: string;
    label_operator: string;
    broker_subtext: string;
    priority_rank: number;
}> = {
    available_now: {
        icon: '🟢',
        label_broker: 'available now',
        label_operator: 'available now',
        broker_subtext: 'ready for dispatch',
        priority_rank: 1,
    },
    available_soon: {
        icon: '🟡',
        label_broker: 'available soon',
        label_operator: 'available later',
        broker_subtext: 'opening coming up',
        priority_rank: 2,
    },
    on_job: {
        icon: '🔵',
        label_broker: 'on a job',
        label_operator: 'on a job',
        broker_subtext: 'currently on a load',
        priority_rank: 3,
    },
    recently_active: {
        icon: '⚪',
        label_broker: 'recently active',
        label_operator: 'recently active',
        broker_subtext: 'recently active in this corridor',
        priority_rank: 4,
    },
    offline: {
        icon: '⚫',
        label_broker: 'offline',
        label_operator: 'offline',
        broker_subtext: 'not checked in recently',
        priority_rank: 5,
    },
};

// Decay rules (in minutes)
const DECAY_RULES: Record<PresenceStatus, {
    degrade_after_minutes: number;
    degrade_to: PresenceStatus;
    offline_after_minutes: number;
}> = {
    available_now: {
        degrade_after_minutes: 240,         // 4 hours
        degrade_to: 'recently_active',
        offline_after_minutes: 1440,        // 24 hours
    },
    available_soon: {
        degrade_after_minutes: 2160,        // 36 hours
        degrade_to: 'recently_active',
        offline_after_minutes: 4320,        // 72 hours
    },
    on_job: {
        degrade_after_minutes: 1080,        // 18 hours
        degrade_to: 'recently_active',
        offline_after_minutes: 4320,        // 72 hours
    },
    recently_active: {
        degrade_after_minutes: 7200,        // 120 hours (5 days)
        degrade_to: 'offline',
        offline_after_minutes: 7200,
    },
    offline: {
        degrade_after_minutes: Infinity,
        degrade_to: 'offline',
        offline_after_minutes: Infinity,
    },
};

const STALE_THRESHOLD_MINUTES = 240;
const DECLINE_WINDOW_HOURS = 6;
const DECLINE_THRESHOLD = 3;

// Leaderboard points
const POINTS = {
    check_in: 2,
    check_in_cap_per_day: 6,
    available_per_30_min: 1,
    available_cap_per_day: 12,
    on_job_confirmation: 4,
    on_job_cap_per_day: 8,
    accuracy_bonus: 6,
    false_availability_penalty: -10,
    false_availability_visibility_downgrade_minutes: 180,
};

// Density formula weights for social gravity
const DENSITY_WEIGHTS: Record<PresenceStatus, number> = {
    available_now: 1.00,
    available_soon: 0.70,
    on_job: 0.55,
    recently_active: 0.35,
    offline: 0.00,
};

// ── Engine ────────────────────────────────────────────────────────────────────

export class PresenceEngine {
    constructor(private db: SupabaseClient) { }

    // ── SET STATUS (ONE-TAP) ──────────────────────────────────────────────

    async setStatus(
        operatorId: string,
        newStatus: PresenceStatus,
        options: {
            corridorScope?: string;
            availableSoonWindow?: AvailableSoonWindow;
            customEta?: string;
            sourceSignal?: string;
        } = {},
    ): Promise<PresenceState> {
        // Get current state
        const current = await this.getState(operatorId);
        const previousStatus = current?.status ?? 'offline';
        const now = new Date().toISOString();

        // Truth guardrail: suppress available_now if too many recent declines
        if (newStatus === 'available_now') {
            const suppressed = await this.checkDeclineSuppress(operatorId);
            if (suppressed) {
                newStatus = 'available_soon' as PresenceStatus;
            }
        }

        // Update DB
        await this.db.from('operator_presence').upsert({
            operator_id: operatorId,
            status: newStatus,
            previous_status: previousStatus,
            corridor_scope: options.corridorScope ?? null,
            available_soon_window: options.availableSoonWindow ?? null,
            custom_eta: options.customEta ?? null,
            last_signal_at: now,
            status_set_at: now,
            source_signal: options.sourceSignal ?? 'operator_toggle',
        }, { onConflict: 'operator_id' });

        // Audit log
        await this.logAudit({
            operator_id: operatorId,
            previous_status: previousStatus,
            new_status: newStatus,
            timestamp_utc: now,
            corridor_scope: options.corridorScope ?? null,
            source_signal: options.sourceSignal ?? 'operator_toggle',
            freshness_minutes: 0,
        });

        // Award leaderboard points for check-in
        if (newStatus === 'available_now' || newStatus === 'available_soon') {
            await this.awardCheckInPoints(operatorId);
        }
        if (newStatus === 'on_job' && previousStatus !== 'on_job') {
            await this.awardOnJobPoints(operatorId);
        }

        // Update operators table for backward compat
        await this.db.from('operators').update({
            availability_status: newStatus,
            last_active_at: now,
        }).eq('id', operatorId);

        return this.getState(operatorId) as Promise<PresenceState>;
    }

    // ── RECORD SIGNAL (INFERRED ACTIVITY) ─────────────────────────────────

    async recordSignal(
        operatorId: string,
        signal: string,
    ): Promise<void> {
        const now = new Date().toISOString();

        // Update last_signal_at without changing status
        await this.db.from('operator_presence').update({
            last_signal_at: now,
        }).eq('operator_id', operatorId);

        // Also update operators table
        await this.db.from('operators').update({
            last_active_at: now,
        }).eq('id', operatorId);
    }

    // ── GET STATE ─────────────────────────────────────────────────────────

    async getState(operatorId: string): Promise<PresenceState | null> {
        const { data } = await this.db
            .from('operator_presence')
            .select('*')
            .eq('operator_id', operatorId)
            .single();

        if (!data) return null;

        const lastSignal = new Date(data.last_signal_at).getTime();
        const freshness = Math.round((Date.now() - lastSignal) / 60000);
        const decayRule = DECAY_RULES[data.status as PresenceStatus] ?? DECAY_RULES.offline;
        const isStale = freshness > decayRule.degrade_after_minutes;

        return {
            operator_id: data.operator_id,
            status: data.status,
            previous_status: data.previous_status ?? 'offline',
            corridor_scope: data.corridor_scope,
            available_soon_window: data.available_soon_window,
            custom_eta: data.custom_eta,
            last_signal_at: data.last_signal_at,
            status_set_at: data.status_set_at,
            freshness_minutes: freshness,
            is_stale: isStale,
            source_signal: data.source_signal ?? 'unknown',
        };
    }

    // ── GET DISPLAY (BROKER OR OPERATOR VIEW) ─────────────────────────────

    async getDisplay(
        operatorId: string,
        viewerType: 'broker' | 'operator' = 'broker',
    ): Promise<PresenceDisplay> {
        const state = await this.getState(operatorId);
        const status = state?.status ?? 'offline';
        const config = STATUS_CONFIG[status];
        const freshness = state?.freshness_minutes ?? 9999;

        // Format freshness label
        let freshnessLabel: string;
        if (freshness < 60) {
            freshnessLabel = `updated ${freshness}m ago`;
        } else if (freshness < 1440) {
            freshnessLabel = `checked in ${Math.round(freshness / 60)}h ago`;
        } else {
            freshnessLabel = `last active ${Math.round(freshness / 1440)}d ago`;
        }

        return {
            status,
            icon: config.icon,
            label: viewerType === 'broker' ? config.label_broker : config.label_operator,
            subtext: config.broker_subtext,
            freshness_label: freshnessLabel,
            priority_rank: config.priority_rank,
            is_fresh: freshness < STALE_THRESHOLD_MINUTES,
        };
    }

    // ── AUTO-DECAY (CRON: run every 5 minutes) ───────────────────────────

    async runAutoDecay(): Promise<{
        degraded: number;
        offlined: number;
        audit_entries: number;
    }> {
        const now = Date.now();
        let degraded = 0;
        let offlined = 0;
        let auditEntries = 0;

        // Get all non-offline operators
        const { data: operators } = await this.db
            .from('operator_presence')
            .select('operator_id, status, last_signal_at, corridor_scope, source_signal')
            .neq('status', 'offline')
            .limit(1000);

        if (!operators) return { degraded: 0, offlined: 0, audit_entries: 0 };

        for (const op of operators) {
            const lastSignal = new Date(op.last_signal_at).getTime();
            const freshness = Math.round((now - lastSignal) / 60000);
            const rule = DECAY_RULES[op.status as PresenceStatus];

            if (!rule) continue;

            let newStatus: PresenceStatus | null = null;

            // Check offline threshold first (takes priority)
            if (freshness >= rule.offline_after_minutes) {
                newStatus = 'offline';
                offlined++;
            }
            // Then check degrade threshold
            else if (freshness >= rule.degrade_after_minutes) {
                newStatus = rule.degrade_to;
                degraded++;
            }

            if (newStatus && newStatus !== op.status) {
                await this.db.from('operator_presence').update({
                    status: newStatus,
                    previous_status: op.status,
                    source_signal: 'auto_decay',
                }).eq('operator_id', op.operator_id);

                // Update operators table
                await this.db.from('operators').update({
                    availability_status: newStatus,
                }).eq('id', op.operator_id);

                await this.logAudit({
                    operator_id: op.operator_id,
                    previous_status: op.status as PresenceStatus,
                    new_status: newStatus,
                    timestamp_utc: new Date().toISOString(),
                    corridor_scope: op.corridor_scope,
                    source_signal: 'auto_decay',
                    freshness_minutes: freshness,
                });
                auditEntries++;
            }
        }

        return { degraded, offlined, audit_entries: auditEntries };
    }

    // ── WEIGHTED DENSITY (SOCIAL GRAVITY) ─────────────────────────────────

    async getWeightedDensity(state: string = 'FL'): Promise<{
        raw_count: number;
        weighted_density: number;
        breakdown: Record<PresenceStatus, number>;
        copy: string;
    }> {
        const { data: operators } = await this.db
            .from('operator_presence')
            .select('status')
            .eq('corridor_scope', state)   // or use operators.home_base_state
            .neq('status', 'offline');

        const breakdown: Record<PresenceStatus, number> = {
            available_now: 0,
            available_soon: 0,
            on_job: 0,
            recently_active: 0,
            offline: 0,
        };

        for (const op of operators ?? []) {
            const s = op.status as PresenceStatus;
            if (s in breakdown) breakdown[s]++;
        }

        const rawCount = (operators ?? []).length;

        const weightedDensity =
            breakdown.available_now * DENSITY_WEIGHTS.available_now +
            breakdown.available_soon * DENSITY_WEIGHTS.available_soon +
            breakdown.on_job * DENSITY_WEIGHTS.on_job +
            breakdown.recently_active * DENSITY_WEIGHTS.recently_active;

        let copy = 'building coverage in this area';
        if (weightedDensity >= 30) copy = 'high activity zone — operators getting booked';
        else if (weightedDensity >= 15) copy = 'strong local coverage — brokers moving loads';
        else if (weightedDensity >= 6) copy = 'operators are active nearby';
        else if (weightedDensity >= 1) copy = 'operators are checking in — coverage forming now';

        return { raw_count: rawCount, weighted_density: weightedDensity, breakdown, copy };
    }

    // ── FALSE AVAILABILITY REPORT ─────────────────────────────────────────

    async reportFalseAvailability(
        operatorId: string,
        reportedBy: string,
    ): Promise<void> {
        // Record the report
        await this.db.from('presence_audit_log').insert({
            operator_id: operatorId,
            previous_status: 'available_now',
            new_status: 'recently_active',
            source_signal: `false_availability_report_by_${reportedBy}`,
            freshness_minutes: 0,
        });

        // Degrade status
        await this.db.from('operator_presence').update({
            status: 'recently_active',
            previous_status: 'available_now',
            source_signal: 'false_availability_penalty',
        }).eq('operator_id', operatorId);

        // Apply leaderboard penalty
        await this.db.from('operator_momentum').update({
            total_score: 0, // TODO: Use RPC decrement in production
        }).eq('user_id', operatorId);

        // Apply temporary visibility downgrade
        const expiresAt = new Date(
            Date.now() + POINTS.false_availability_visibility_downgrade_minutes * 60000,
        ).toISOString();

        await this.db.from('search_boosts').insert({
            user_id: operatorId,
            multiplier: 0.5,  // 50% visibility for 3 hours
            reason: 'false_availability_penalty',
            expires_at: expiresAt,
        });
    }

    // ── LEADERBOARD POINTS ────────────────────────────────────────────────

    async getPresencePoints(operatorId: string): Promise<PresenceLeaderboardPoints> {
        const dayAgo = new Date(Date.now() - 86400000).toISOString();

        // Count check-ins today
        const { count: checkIns } = await this.db
            .from('presence_audit_log')
            .select('id', { count: 'exact', head: true })
            .eq('operator_id', operatorId)
            .in('new_status', ['available_now', 'available_soon'])
            .eq('source_signal', 'operator_toggle')
            .gte('timestamp_utc', dayAgo);

        const checkInPts = Math.min(
            (checkIns ?? 0) * POINTS.check_in,
            POINTS.check_in_cap_per_day,
        );

        // Available minutes today (simplified)
        const { data: presence } = await this.db
            .from('operator_presence')
            .select('status, status_set_at')
            .eq('operator_id', operatorId)
            .single();

        let availMinPts = 0;
        if (presence?.status === 'available_now') {
            const setAt = new Date(presence.status_set_at).getTime();
            const mins = Math.round((Date.now() - setAt) / 60000);
            const units = Math.floor(mins / 30);
            availMinPts = Math.min(units * POINTS.available_per_30_min, POINTS.available_cap_per_day);
        }

        return {
            check_in: checkInPts,
            available_minutes: availMinPts,
            on_job_confirmation: 0,  // computed at job end
            accuracy_bonus: 0,       // computed from broker feedback
            false_availability_penalty: 0,
            total: checkInPts + availMinPts,
        };
    }

    // ── HELPERS ────────────────────────────────────────────────────────────

    private async checkDeclineSuppress(operatorId: string): Promise<boolean> {
        const windowAgo = new Date(
            Date.now() - DECLINE_WINDOW_HOURS * 3600000,
        ).toISOString();

        const { count } = await this.db
            .from('presence_audit_log')
            .select('id', { count: 'exact', head: true })
            .eq('operator_id', operatorId)
            .eq('source_signal', 'false_availability_penalty')
            .gte('timestamp_utc', windowAgo);

        return (count ?? 0) >= DECLINE_THRESHOLD;
    }

    private async logAudit(entry: PresenceAuditEntry): Promise<void> {
        await this.db.from('presence_audit_log').insert({
            operator_id: entry.operator_id,
            previous_status: entry.previous_status,
            new_status: entry.new_status,
            timestamp_utc: entry.timestamp_utc,
            corridor_scope: entry.corridor_scope,
            source_signal: entry.source_signal,
            freshness_minutes: entry.freshness_minutes,
        });
    }

    private async awardCheckInPoints(operatorId: string): Promise<void> {
        // Simple increment — real implementation would check daily cap
        try {
            await this.db.rpc('increment_momentum_points', {
                p_user_id: operatorId,
                p_points: POINTS.check_in,
                p_source: 'presence_check_in',
            });
        } catch { /* Graceful if RPC doesn't exist yet */ }
    }

    private async awardOnJobPoints(operatorId: string): Promise<void> {
        try {
            await this.db.rpc('increment_momentum_points', {
                p_user_id: operatorId,
                p_points: POINTS.on_job_confirmation,
                p_source: 'on_job_confirmation',
            });
        } catch { /* Graceful if RPC doesn't exist yet */ }
    }
}
