// lib/funnel/vapi-pressure.ts
//
// Haul Command — VAPI Pressure Orchestrator
// Spec: Autonomous Funnel Blueprint v1.0.0
//
// Determines outbound call priority, enforces safeguards,
// manages surge mode, and tracks VAPI conversation KPIs.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface VapiPressureConfig {
    max_calls_per_entity_per_7d: number;
    cooling_window_hours: number;
    multilingual_auto_detect: boolean;
    surge_multiplier: number;
}

export interface VapiTarget {
    record_id: string;
    funnel_side: 'supply' | 'demand';
    country_iso2: string;
    corridor_id: string;
    phone_hash: string;
    language_target: string;
    priority_score: number;
    is_surge: boolean;
}

export interface VapiKpiSnapshot {
    country_iso2: string;
    corridor_id?: string;
    period: string;               // ISO date
    // Connection KPIs
    total_dials: number;
    connected: number;
    connection_rate_pct: number;   // Target: 18-35%
    // Engagement KPIs
    engaged_past_20s: number;
    engagement_rate_pct: number;   // Target: 45-65%
    // Intent KPIs
    intent_positive: number;
    intent_capture_rate_pct: number; // Target: 15-30%
    // Claim KPIs
    claim_prompt_accepted: number;
    claim_acceptance_rate_pct: number; // Target: 25-45%
    // Language KPIs
    language_matches: number;
    language_total: number;
    multilingual_success_pct: number; // Target: >92%
}

export interface SurgeDecision {
    corridor_id: string;
    surge_enabled: boolean;
    multiplier: number;
    reason: string;
}

// ============================================================
// DEFAULT CONFIG
// ============================================================

const DEFAULT_CONFIG: VapiPressureConfig = {
    max_calls_per_entity_per_7d: 3,
    cooling_window_hours: 72,
    multilingual_auto_detect: true,
    surge_multiplier: 1.8,
};

// ============================================================
// PRIORITY SCORING
// ============================================================

/**
 * VAPI Priority Formula:
 *   (coverage_gap_score * 0.35) +
 *   (demand_pressure * 0.35) +
 *   (recent_activity_drop * 0.30)
 *
 * Higher score = call first.
 */
export function computeCallPriority(
    coverage_gap_score: number,   // 0-1, how under-served is this corridor
    demand_pressure: number,       // 0-1, are there loads waiting
    recent_activity_drop: number   // 0-1, has engagement dropped recently
): number {
    return Math.round((
        coverage_gap_score * 0.35 +
        demand_pressure * 0.35 +
        recent_activity_drop * 0.30
    ) * 1000) / 1000;
}

// ============================================================
// SAFEGUARD CHECKS
// ============================================================

/**
 * Check if we can call this entity, enforcing:
 * - Max calls per entity per 7 days
 * - Cooling window between calls
 * - DNC (do not call) list
 */
export async function canCallEntity(
    recordId: string,
    funnelSide: 'supply' | 'demand',
    config: VapiPressureConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = getSupabaseAdmin();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const coolingCutoff = new Date(Date.now() - config.cooling_window_hours * 60 * 60 * 1000).toISOString();

    // Check recent call count
    const { count } = await supabase
        .from('vapi_call_log')
        .select('id', { count: 'exact', head: true })
        .eq('record_id', recordId)
        .eq('funnel_side', funnelSide)
        .gte('started_at', sevenDaysAgo);

    if ((count || 0) >= config.max_calls_per_entity_per_7d) {
        return { allowed: false, reason: `Max ${config.max_calls_per_entity_per_7d} calls/7d reached` };
    }

    // Check cooling window
    const { data: recentCall } = await supabase
        .from('vapi_call_log')
        .select('started_at')
        .eq('record_id', recordId)
        .gte('started_at', coolingCutoff)
        .order('started_at', { ascending: false })
        .limit(1);

    if (recentCall && recentCall.length > 0) {
        return { allowed: false, reason: `Cooling window (${config.cooling_window_hours}h) active` };
    }

    // Check DNC
    const { data: dncCall } = await supabase
        .from('vapi_call_log')
        .select('outcome')
        .eq('record_id', recordId)
        .eq('outcome', 'do_not_call')
        .limit(1);

    if (dncCall && dncCall.length > 0) {
        return { allowed: false, reason: 'Entity on DNC list' };
    }

    return { allowed: true };
}

// ============================================================
// SURGE MODE EVALUATION
// ============================================================

/**
 * Enable surge when:
 * - demand_backlog_flag is true (loads waiting > operators available)
 * - CLS is between 30 and 55 (there's potential but not yet liquidity)
 */
export function evaluateSurge(
    corridor_id: string,
    demandBacklog: boolean,
    clsScore: number
): SurgeDecision {
    if (demandBacklog && clsScore >= 30 && clsScore <= 55) {
        return {
            corridor_id,
            surge_enabled: true,
            multiplier: DEFAULT_CONFIG.surge_multiplier,
            reason: `Demand backlog detected, CLS ${clsScore} in surge range [30-55]. Multiplier ${DEFAULT_CONFIG.surge_multiplier}x.`,
        };
    }

    return {
        corridor_id,
        surge_enabled: false,
        multiplier: 1.0,
        reason: clsScore > 55
            ? 'Corridor healthy — no surge needed'
            : !demandBacklog
                ? 'No demand backlog — surge not warranted'
                : `CLS ${clsScore} outside surge range`,
    };
}

// ============================================================
// VAPI KPI COMPUTATION
// ============================================================

export async function computeVapiKpis(
    countryIso2: string,
    corridorId?: string,
    days: number = 7
): Promise<VapiKpiSnapshot> {
    const supabase = getSupabaseAdmin();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
        .from('vapi_call_log')
        .select('*')
        .eq('country_iso2', countryIso2)
        .gte('started_at', since);

    if (corridorId) {
        query = query.eq('corridor_id', corridorId);
    }

    const { data: calls } = await query;
    const allCalls = calls || [];

    const totalDials = allCalls.length;
    const connected = allCalls.filter(c => c.connected).length;
    const engaged = allCalls.filter(c => c.engaged_past_20s).length;
    const intentPos = allCalls.filter(c => c.intent_positive).length;
    const claimAccepted = allCalls.filter(c => c.claim_prompt_accepted).length;
    const langMatches = allCalls.filter(c => c.language_match).length;
    const langTotal = allCalls.filter(c => c.language_detected).length;

    const safeRate = (n: number, d: number) => d > 0 ? Math.round((n / d) * 10000) / 100 : 0;

    return {
        country_iso2: countryIso2,
        corridor_id: corridorId,
        period: new Date().toISOString().slice(0, 10),
        total_dials: totalDials,
        connected,
        connection_rate_pct: safeRate(connected, totalDials),
        engaged_past_20s: engaged,
        engagement_rate_pct: safeRate(engaged, connected),
        intent_positive: intentPos,
        intent_capture_rate_pct: safeRate(intentPos, connected),
        claim_prompt_accepted: claimAccepted,
        claim_acceptance_rate_pct: safeRate(claimAccepted, connected),
        language_matches: langMatches,
        language_total: langTotal,
        multilingual_success_pct: safeRate(langMatches, langTotal),
    };
}

// ============================================================
// LOCALIZATION AUTO-ADAPTATION
// ============================================================

export interface LocalizationAction {
    action: 'switch_voice_model' | 'rotate_script' | 'enable_local_copy';
    corridor_id: string;
    country_iso2: string;
    reason: string;
    current_value: number;
    threshold: number;
}

/**
 * Monitor engagement and auto-trigger localization actions:
 * - Switch voice model when engagement below 35%
 * - Rotate script variant when claim rate below 20%
 * - Enable local copy pack when country is new
 */
export function evaluateLocalization(
    kpis: VapiKpiSnapshot,
    corridorId: string,
    isNewCountry: boolean
): LocalizationAction[] {
    const actions: LocalizationAction[] = [];

    if (kpis.engagement_rate_pct < 35 && kpis.total_dials >= 30) {
        actions.push({
            action: 'switch_voice_model',
            corridor_id: corridorId,
            country_iso2: kpis.country_iso2,
            reason: `Engagement ${kpis.engagement_rate_pct}% below 35% threshold`,
            current_value: kpis.engagement_rate_pct,
            threshold: 35,
        });
    }

    if (kpis.claim_acceptance_rate_pct < 20 && kpis.connected >= 20) {
        actions.push({
            action: 'rotate_script',
            corridor_id: corridorId,
            country_iso2: kpis.country_iso2,
            reason: `Claim rate ${kpis.claim_acceptance_rate_pct}% below 20% threshold`,
            current_value: kpis.claim_acceptance_rate_pct,
            threshold: 20,
        });
    }

    if (isNewCountry) {
        actions.push({
            action: 'enable_local_copy',
            corridor_id: corridorId,
            country_iso2: kpis.country_iso2,
            reason: 'New country launch — local copy pack required',
            current_value: 0,
            threshold: 0,
        });
    }

    return actions;
}
