/**
 * PRESENCE PRESSURE EXPERIMENTS ENGINE v1.0
 *
 * Controlled A/B testing layer for presence nudges, copy, and rewards.
 * Assignment: deterministic hash of operator_id → stable bucket.
 * Traffic: 50/50 default, multi-variant supported.
 *
 * Experiments:
 *   1. Status card pressure (loss/competition/earnings framing)
 *   2. Reactivation headline (urgency/earnings/protection)
 *   3. Primary button language (check in/stay visible/ready for dispatch)
 *   4. Freshness timer emphasis (standard/just-updated/precision/trust-badge)
 *   5. Idle reactor message (generic/geo-specific/competition/projection)
 *   6. Early check-in reward (none/soft/streak/priority-frame)
 *
 * Safety:
 *   - Auto-kill if false_available_now rate > 5%
 *   - Auto-promote winner if lift > 5% after 14 days
 *   - Guardrail: max 3 push/day, 3 modals/week
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export type ExperimentId =
    | 'status_card_pressure'
    | 'reactivation_headline_test'
    | 'primary_button_test'
    | 'freshness_emphasis_test'
    | 'idle_reactor_message_test'
    | 'early_checkin_reward_test';

export type VariantId = string;  // 'control' | 'variant_loss_frame' | etc.

export interface ExperimentAssignment {
    experiment_id: ExperimentId;
    variant_id: VariantId;
    operator_id: string;
    assigned_at: string;
}

export interface ExperimentConfig {
    id: ExperimentId;
    surface: string;
    variants: Record<VariantId, Record<string, any>>;
    traffic_split: Record<VariantId, number>;
    primary_metric: string;
    guardrails: Record<string, any>;
    status: 'active' | 'paused' | 'completed' | 'killed';
    winner?: VariantId;
}

export interface ExperimentEvent {
    experiment_id: ExperimentId;
    variant_id: VariantId;
    operator_id: string;
    event_type: string;       // 'impression' | 'click' | 'check_in' | 'dismiss'
    metadata?: Record<string, any>;
}

// ── Experiment Definitions ───────────────────────────────────────────────────

const EXPERIMENTS: Record<ExperimentId, ExperimentConfig> = {
    status_card_pressure: {
        id: 'status_card_pressure',
        surface: 'operator_dashboard_status_card',
        variants: {
            control: {
                nudge_copy: 'keep this current so brokers know when to call',
                emphasis_style: 'standard',
            },
            variant_loss_frame: {
                nudge_copy: 'profiles that stay updated get priority visibility',
                emphasis_style: 'bold_subphrase',
            },
            variant_competition_frame: {
                nudge_copy: 'nearby operators are checking in right now',
                emphasis_style: 'alert_tone',
            },
            variant_earnings_frame: {
                nudge_copy: 'operators who check in early catch more loads',
                emphasis_style: 'earnings_focus',
            },
        },
        traffic_split: { control: 25, variant_loss_frame: 25, variant_competition_frame: 25, variant_earnings_frame: 25 },
        primary_metric: 'operator_check_in_rate',
        guardrails: {},
        status: 'active',
    },

    reactivation_headline_test: {
        id: 'reactivation_headline_test',
        surface: 'reactivation_modal',
        variants: {
            control: { title: 'activity picking up near you' },
            variant_urgency: { title: 'demand building in your area' },
            variant_earnings: { title: 'strong booking potential nearby' },
            variant_protection: { title: 'stay visible to brokers' },
        },
        traffic_split: { control: 25, variant_urgency: 25, variant_earnings: 25, variant_protection: 25 },
        primary_metric: 'operator_check_in_rate',
        guardrails: { max_modal_frequency_per_week: 3 },
        status: 'active',
    },

    primary_button_test: {
        id: 'primary_button_test',
        surface: 'reactivation_modal_primary_button',
        variants: {
            control: { label: 'go available now' },
            variant_short: { label: 'check in now' },
            variant_visibility: { label: 'stay visible' },
            variant_dispatch: { label: 'ready for dispatch' },
        },
        traffic_split: { control: 25, variant_short: 25, variant_visibility: 25, variant_dispatch: 25 },
        primary_metric: 'modal_primary_click_rate',
        guardrails: {},
        status: 'active',
    },

    freshness_emphasis_test: {
        id: 'freshness_emphasis_test',
        surface: 'broker_search_status',
        variants: {
            control: { emphasis_style: 'standard', format: '{time} ago' },
            variant_strong_recent: {
                under_60_min_prefix: 'just updated',
                style: 'high_contrast',
            },
            variant_precision: {
                format_minutes: '{minutes}m ago',
                format_hours: '{hours}h ago',
                style: 'compact',
            },
            variant_trust_frame: {
                suffix: '— recently confirmed',
                style: 'trust_badge',
            },
        },
        traffic_split: { control: 25, variant_strong_recent: 25, variant_precision: 25, variant_trust_frame: 25 },
        primary_metric: 'bookings_per_100_broker_views',
        guardrails: {},
        status: 'active',
    },

    idle_reactor_message_test: {
        id: 'idle_reactor_message_test',
        surface: 'idle_operator_reactor_soft_ping',
        variants: {
            control: { copy: 'demand is picking up near your usual routes' },
            variant_geo_specific: { copy_template: 'movement increasing near {top_corridor}' },
            variant_competition: { copy: 'operators nearby are getting booked' },
            variant_projection: { copy: 'today shows strong booking potential in your area' },
        },
        traffic_split: { control: 25, variant_geo_specific: 25, variant_competition: 25, variant_projection: 25 },
        primary_metric: 'operator_check_in_rate',
        guardrails: { cooldown_hours: 18 },
        status: 'active',
    },

    early_checkin_reward_test: {
        id: 'early_checkin_reward_test',
        surface: 'post_check_in_feedback',
        variants: {
            control: { reward_points: 0, message: "you're live" },
            variant_soft_reward: { reward_points: 2, message: 'visibility boosted' },
            variant_streak_reward: { reward_points: 3, streak_tracking: true, message: 'check-in streak building' },
            variant_priority_frame: { reward_points: 0, message: "you're prioritized in urgent searches" },
        },
        traffic_split: { control: 25, variant_soft_reward: 25, variant_streak_reward: 25, variant_priority_frame: 25 },
        primary_metric: 'next_day_return_rate',
        guardrails: {},
        status: 'active',
    },
};

// ── Constants ────────────────────────────────────────────────────────────────

const EVALUATION_WINDOW_DAYS = 14;
const MIN_SAMPLE_SIZE_PER_ARM = 500;
const AUTO_PROMOTE_MIN_LIFT = 0.05;  // 5%
const KILL_SWITCH_FALSE_AVAIL_RATE = 0.05;

// ── Engine ────────────────────────────────────────────────────────────────────

export class PresenceExperimentEngine {
    constructor(private db: SupabaseClient) { }

    // ── ASSIGNMENT (deterministic hash) ───────────────────────────────────

    getAssignment(
        operatorId: string,
        experimentId: ExperimentId,
    ): VariantId {
        const config = EXPERIMENTS[experimentId];
        if (!config || config.status !== 'active') return 'control';

        // If there's a winner, everyone gets the winner
        if (config.winner) return config.winner;

        // Deterministic hash: stable bucket per operator per experiment
        const hash = this.hashCode(`${operatorId}:${experimentId}`);
        const variants = Object.keys(config.traffic_split);
        const weights = Object.values(config.traffic_split);
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const bucket = ((hash % totalWeight) + totalWeight) % totalWeight;
        let cumulative = 0;
        for (let i = 0; i < variants.length; i++) {
            cumulative += weights[i];
            if (bucket < cumulative) return variants[i];
        }
        return 'control';
    }

    // ── GET VARIANT CONFIG ────────────────────────────────────────────────

    getVariantConfig(
        operatorId: string,
        experimentId: ExperimentId,
    ): { variant_id: VariantId; config: Record<string, any> } {
        const variantId = this.getAssignment(operatorId, experimentId);
        const experiment = EXPERIMENTS[experimentId];
        const variantConfig = experiment?.variants[variantId] ?? experiment?.variants.control ?? {};
        return { variant_id: variantId, config: variantConfig };
    }

    // ── TRACK EVENT ───────────────────────────────────────────────────────

    async trackEvent(event: ExperimentEvent): Promise<void> {
        await this.db.from('experiment_events').insert({
            experiment_id: event.experiment_id,
            variant_id: event.variant_id,
            operator_id: event.operator_id,
            event_type: event.event_type,
            metadata: event.metadata ?? {},
            created_at: new Date().toISOString(),
        });
    }

    // ── TRACK IMPRESSION (convenience) ────────────────────────────────────

    async trackImpression(
        operatorId: string,
        experimentId: ExperimentId,
    ): Promise<VariantId> {
        const variantId = this.getAssignment(operatorId, experimentId);
        await this.trackEvent({
            experiment_id: experimentId,
            variant_id: variantId,
            operator_id: operatorId,
            event_type: 'impression',
        });
        return variantId;
    }

    // ── EVALUATE EXPERIMENT (cron: daily) ─────────────────────────────────

    async evaluate(experimentId: ExperimentId): Promise<{
        experiment_id: ExperimentId;
        status: string;
        results: Record<VariantId, {
            impressions: number;
            conversions: number;
            rate: number;
            lift_vs_control: number;
        }>;
        recommendation: string;
        auto_action?: string;
    }> {
        const config = EXPERIMENTS[experimentId];
        if (!config) {
            return {
                experiment_id: experimentId,
                status: 'not_found',
                results: {},
                recommendation: 'experiment not found',
            };
        }

        const windowStart = new Date(
            Date.now() - EVALUATION_WINDOW_DAYS * 86400000,
        ).toISOString();

        // Get events in window
        const { data: events } = await this.db
            .from('experiment_events')
            .select('variant_id, event_type')
            .eq('experiment_id', experimentId)
            .gte('created_at', windowStart);

        if (!events || events.length === 0) {
            return {
                experiment_id: experimentId,
                status: 'insufficient_data',
                results: {},
                recommendation: 'waiting for data',
            };
        }

        // Aggregate per variant
        const variants = Object.keys(config.variants);
        const results: Record<string, { impressions: number; conversions: number; rate: number; lift_vs_control: number }> = {};

        for (const v of variants) {
            const impressions = events.filter(e => e.variant_id === v && e.event_type === 'impression').length;
            const conversions = events.filter(e => e.variant_id === v && e.event_type === 'check_in').length;
            results[v] = {
                impressions,
                conversions,
                rate: impressions > 0 ? conversions / impressions : 0,
                lift_vs_control: 0,
            };
        }

        // Compute lift vs control
        const controlRate = results.control?.rate ?? 0;
        for (const v of variants) {
            if (v !== 'control' && controlRate > 0) {
                results[v].lift_vs_control = (results[v].rate - controlRate) / controlRate;
            }
        }

        // Find best variant
        let bestVariant = 'control';
        let bestLift = 0;
        for (const v of variants) {
            if (v !== 'control' && results[v].lift_vs_control > bestLift) {
                bestLift = results[v].lift_vs_control;
                bestVariant = v;
            }
        }

        // Check sample size
        const minSample = Math.min(...variants.map(v => results[v]?.impressions ?? 0));
        const hasSufficientData = minSample >= MIN_SAMPLE_SIZE_PER_ARM;

        // Auto-promote check
        let recommendation = 'continue running';
        let autoAction: string | undefined;

        if (hasSufficientData && bestLift >= AUTO_PROMOTE_MIN_LIFT) {
            recommendation = `promote ${bestVariant} (${(bestLift * 100).toFixed(1)}% lift)`;
            autoAction = `promote_${bestVariant}`;
        } else if (hasSufficientData && bestLift < 0.01) {
            recommendation = 'no significant winner — consider extending or killing';
        }

        // Kill switch: check false availability rate
        const falseAvailCheck = await this.checkKillSwitch(experimentId);
        if (falseAvailCheck.shouldKill) {
            recommendation = `KILL — false available rate ${(falseAvailCheck.rate * 100).toFixed(1)}% exceeds 5% threshold`;
            autoAction = 'kill';
        }

        return {
            experiment_id: experimentId,
            status: config.status,
            results,
            recommendation,
            auto_action: autoAction,
        };
    }

    // ── EVALUATE ALL (cron: daily) ────────────────────────────────────────

    async evaluateAll(): Promise<Record<ExperimentId, any>> {
        const results: Record<string, any> = {};
        for (const id of Object.keys(EXPERIMENTS) as ExperimentId[]) {
            if (EXPERIMENTS[id].status === 'active') {
                results[id] = await this.evaluate(id);
            }
        }
        return results;
    }

    // ── KILL SWITCH ───────────────────────────────────────────────────────

    private async checkKillSwitch(experimentId: ExperimentId): Promise<{
        shouldKill: boolean;
        rate: number;
    }> {
        const dayAgo = new Date(Date.now() - 86400000).toISOString();

        const { count: totalCheckIns } = await this.db
            .from('presence_audit_log')
            .select('id', { count: 'exact', head: true })
            .in('new_status', ['available_now'])
            .eq('source_signal', 'operator_toggle')
            .gte('timestamp_utc', dayAgo);

        const { count: falseReports } = await this.db
            .from('presence_audit_log')
            .select('id', { count: 'exact', head: true })
            .eq('source_signal', 'false_availability_penalty')
            .gte('timestamp_utc', dayAgo);

        const total = totalCheckIns ?? 1;
        const falseRate = (falseReports ?? 0) / Math.max(1, total);

        return {
            shouldKill: falseRate > KILL_SWITCH_FALSE_AVAIL_RATE,
            rate: falseRate,
        };
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    getExperimentConfig(experimentId: ExperimentId): ExperimentConfig | null {
        return EXPERIMENTS[experimentId] ?? null;
    }

    listActiveExperiments(): ExperimentConfig[] {
        return Object.values(EXPERIMENTS).filter(e => e.status === 'active');
    }

    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit int
        }
        return Math.abs(hash);
    }
}
