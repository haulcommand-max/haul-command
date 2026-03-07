// lib/funnel/corridor-governor.ts
//
// Haul Command — Corridor Liquidity Scoring + Expansion Governor
// Spec: Autonomous Funnel Blueprint v1.0.0
//
// Computes CLS (Corridor Liquidity Score) 0-100
// Determines corridor stage (seeding → early_liquidity → market_formation → corridor_dominance)
// Governs expansion state per country (paused / cautious / push_hard)

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface CorridorMetrics {
    corridor_id: string;
    country_iso2: string;
    // Supply side
    raw_records: number;
    contactable_records: number;
    contacted: number;
    conversations_started: number;
    claims_started: number;
    verified_operators: number;
    activated_operators: number;
    load_participating: number;
    // Demand side
    prospects_identified: number;
    prospects_contactable: number;
    demand_conversations: number;
    accounts_created: number;
    loads_posted: number;
    loads_matched: number;
    repeat_posters: number;
    // Velocity
    median_time_to_claim_hours?: number;
    median_time_to_load_hours?: number;
    median_time_to_match_hours?: number;
    activation_cost?: number;
    operator_density_per_100km?: number;
}

export interface CorridorLiquidityResult {
    corridor_id: string;
    country_iso2: string;
    cls_score: number;                // 0-100
    stage: CorridorStage;
    rates: FunnelRates;
    warnings: WarningSignal[];
    expansion_eligible: boolean;
}

export type CorridorStage = 'seeding' | 'early_liquidity' | 'market_formation' | 'corridor_dominance';
export type ExpansionState = 'paused' | 'cautious' | 'push_hard';

export interface FunnelRates {
    record_coverage_pct: number;
    outreach_penetration_pct: number;
    conversation_rate_pct: number;
    claim_start_rate_pct: number;
    verification_rate_pct: number;
    activation_rate_pct: number;
    load_participation_pct: number;    // 🎯 TRUE NORTH STAR
    prospect_coverage_pct: number;
    demand_conversation_rate_pct: number;
    account_creation_rate_pct: number;
    first_load_rate_pct: number;
    match_rate_pct: number;
    repeat_poster_rate_pct: number;
}

export interface WarningSignal {
    type: WarningType;
    severity: 'info' | 'warning' | 'critical';
    signal_values: Record<string, number>;
    recommended_actions: string[];
}

export type WarningType =
    | 'high_conv_low_claim'
    | 'high_claim_low_verify'
    | 'activated_no_loads'
    | 'loads_no_match'
    | 'phantom_supply'
    | 'demand_backlog'
    | 'cpa_spike'
    | 'corridor_regression';

// ============================================================
// RATE COMPUTATION
// ============================================================

function safeRate(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 10000) / 100; // 2 decimal %
}

export function computeFunnelRates(m: CorridorMetrics): FunnelRates {
    return {
        // Supply funnel rates
        record_coverage_pct: safeRate(m.contactable_records, m.raw_records),
        outreach_penetration_pct: safeRate(m.contacted, m.contactable_records),
        conversation_rate_pct: safeRate(m.conversations_started, m.contacted),
        claim_start_rate_pct: safeRate(m.claims_started, m.conversations_started),
        verification_rate_pct: safeRate(m.verified_operators, m.claims_started),
        activation_rate_pct: safeRate(m.activated_operators, m.verified_operators),
        load_participation_pct: safeRate(m.load_participating, m.activated_operators),
        // Demand funnel rates
        prospect_coverage_pct: safeRate(m.prospects_contactable, m.prospects_identified),
        demand_conversation_rate_pct: safeRate(m.demand_conversations, m.prospects_contactable),
        account_creation_rate_pct: safeRate(m.accounts_created, m.demand_conversations),
        first_load_rate_pct: safeRate(m.loads_posted, m.accounts_created),
        match_rate_pct: safeRate(m.loads_matched, m.loads_posted),
        repeat_poster_rate_pct: safeRate(m.repeat_posters, m.accounts_created),
    };
}

// ============================================================
// CORRIDOR LIQUIDITY SCORE (CLS) — 0 to 100
// ============================================================

/**
 * CLS Formula:
 *   load_participation (30%) — THE north star
 * + match_rate (25%)
 * + activated_operators_volume (15%) — log-scaled
 * + verification_rate (10%)
 * + repeat_poster_rate (10%)
 * + demand_density (10%) — loads_posted volume log-scaled
 */
export function computeCLS(m: CorridorMetrics, rates: FunnelRates): number {
    // Load participation component (30%)
    // Target: 35% = full score. Cap at 50%.
    const participationScore = Math.min(100, (rates.load_participation_pct / 35) * 100);

    // Match rate component (25%)
    // Target: 65% = full score
    const matchScore = Math.min(100, (rates.match_rate_pct / 65) * 100);

    // Activated operators volume (15%)
    // Log-scaled: 500+ = 100
    const activatedVolScore = Math.min(100, (Math.log(1 + m.activated_operators) / Math.log(501)) * 100);

    // Verification rate (10%)
    // Target: 80% = full score
    const verifyScore = Math.min(100, (rates.verification_rate_pct / 80) * 100);

    // Repeat poster rate (10%)
    // Target: 45% = full score
    const repeatScore = Math.min(100, (rates.repeat_poster_rate_pct / 45) * 100);

    // Demand density (10%)
    // Log-scaled: 200+ loads posted = 100
    const demandScore = Math.min(100, (Math.log(1 + m.loads_posted) / Math.log(201)) * 100);

    const cls = Math.round(
        participationScore * 0.30 +
        matchScore * 0.25 +
        activatedVolScore * 0.15 +
        verifyScore * 0.10 +
        repeatScore * 0.10 +
        demandScore * 0.10
    );

    return Math.max(0, Math.min(100, cls));
}

// ============================================================
// STAGE CLASSIFICATION
// ============================================================

export function classifyStage(m: CorridorMetrics, rates: FunnelRates): CorridorStage {
    // Stage 3 — Corridor Dominance
    if (
        m.activated_operators >= 500 &&
        m.load_participating >= 200 &&
        rates.match_rate_pct >= 65 &&
        rates.repeat_poster_rate_pct >= 45
    ) return 'corridor_dominance';

    // Stage 2 — Market Formation
    if (
        m.activated_operators >= 200 &&
        m.load_participating >= 70 &&
        m.accounts_created >= 50 &&
        rates.match_rate_pct >= 55 &&
        rates.repeat_poster_rate_pct >= 30
    ) return 'market_formation';

    // Stage 1 — Early Liquidity
    if (
        m.activated_operators >= 75 &&
        m.load_participating >= 20 &&
        m.accounts_created >= 15 &&
        rates.match_rate_pct >= 35
    ) return 'early_liquidity';

    // Stage 0 — Seeding
    return 'seeding';
}

// ============================================================
// EARLY WARNING DETECTION
// ============================================================

export function detectWarnings(m: CorridorMetrics, rates: FunnelRates): WarningSignal[] {
    const warnings: WarningSignal[] = [];

    // ⚠️ Warning #1 — High Conversations, Low Claims
    if (rates.conversation_rate_pct >= 20 && rates.claim_start_rate_pct < 15) {
        warnings.push({
            type: 'high_conv_low_claim',
            severity: rates.claim_start_rate_pct < 10 ? 'critical' : 'warning',
            signal_values: {
                conversation_rate: rates.conversation_rate_pct,
                claim_start_rate: rates.claim_start_rate_pct,
            },
            recommended_actions: [
                'Localize VAPI script for this corridor',
                'Adjust opener (trust-first, not pitch-first)',
                'Verify ICP targeting accuracy',
                'Test cultural messaging variants',
            ],
        });
    }

    // ⚠️ Warning #2 — High Claims, Low Verification
    if (rates.claim_start_rate_pct >= 20 && rates.verification_rate_pct < 50) {
        warnings.push({
            type: 'high_claim_low_verify',
            severity: rates.verification_rate_pct < 35 ? 'critical' : 'warning',
            signal_values: {
                claim_start_rate: rates.claim_start_rate_pct,
                verification_rate: rates.verification_rate_pct,
            },
            recommended_actions: [
                'Simplify claim flow (reduce required fields)',
                'Localize document instructions',
                'Check compliance requirements match market',
                'Add progress indicator to claim UX',
            ],
        });
    }

    // 🚨 Warning #3 — Activated but Not Taking Loads (MOST DANGEROUS)
    if (m.activated_operators >= 30 && rates.load_participation_pct < 20) {
        warnings.push({
            type: 'activated_no_loads',
            severity: 'critical',
            signal_values: {
                activated_operators: m.activated_operators,
                load_participating: m.load_participating,
                load_participation_pct: rates.load_participation_pct,
            },
            recommended_actions: [
                'PHANTOM SUPPLY — boost demand side immediately',
                'Improve matching algorithm for this corridor',
                'Increase notification frequency for new loads',
                'Review pricing signals (rates may not match expectations)',
                'Conduct manual outreach to understand blockers',
            ],
        });
    }

    // ⚠️ Warning #4 — Loads Posted but Not Matched
    if (m.loads_posted >= 10 && rates.match_rate_pct < 40) {
        warnings.push({
            type: 'loads_no_match',
            severity: rates.match_rate_pct < 25 ? 'critical' : 'warning',
            signal_values: {
                loads_posted: m.loads_posted,
                loads_matched: m.loads_matched,
                match_rate: rates.match_rate_pct,
            },
            recommended_actions: [
                'Execute corridor strike campaign (targeted operator outreach)',
                'Identify specific geo coverage gaps',
                'Do NOT broadly expand country — fill corridor holes first',
                'Review if load types match available operator capabilities',
            ],
        });
    }

    // Phantom supply: looks active but no real engagement
    if (m.activated_operators >= 50 && m.load_participating < 5 && m.loads_posted >= 20) {
        warnings.push({
            type: 'phantom_supply',
            severity: 'critical',
            signal_values: {
                activated_operators: m.activated_operators,
                load_participating: m.load_participating,
                loads_posted: m.loads_posted,
            },
            recommended_actions: [
                'CRITICAL: Phantom supply detected — operators are registered but invisible',
                'Audit notification delivery pipeline',
                'Check if operators have app installed / push enabled',
                'Manual call sample of activated operators to verify engagement',
            ],
        });
    }

    // Demand backlog: loads piling up without matches
    if (m.loads_posted > m.loads_matched * 3 && m.loads_posted >= 15) {
        warnings.push({
            type: 'demand_backlog',
            severity: 'warning',
            signal_values: {
                loads_posted: m.loads_posted,
                loads_matched: m.loads_matched,
                backlog_ratio: m.loads_posted / Math.max(1, m.loads_matched),
            },
            recommended_actions: [
                'Demand is outrunning supply — increase operator outreach',
                'Enable VAPI surge mode for this corridor',
                'Consider temporary rate incentives for operators',
            ],
        });
    }

    return warnings;
}

// ============================================================
// EXPANSION GOVERNOR
// ============================================================

export interface ExpansionDecision {
    country_iso2: string;
    state: ExpansionState;
    reasons: string[];
    green_corridors: number;
    blue_corridors: number;
    avg_participation: number;
    avg_match_rate: number;
    avg_repeat_rate: number;
}

export function evaluateExpansionGovernor(
    country_iso2: string,
    corridorResults: CorridorLiquidityResult[]
): ExpansionDecision {
    const greens = corridorResults.filter(c => c.stage === 'market_formation' || c.stage === 'corridor_dominance');
    const blues = corridorResults.filter(c => c.stage === 'corridor_dominance');

    const avgParticipation = corridorResults.length > 0
        ? corridorResults.reduce((s, c) => s + c.rates.load_participation_pct, 0) / corridorResults.length
        : 0;
    const avgMatch = corridorResults.length > 0
        ? corridorResults.reduce((s, c) => s + c.rates.match_rate_pct, 0) / corridorResults.length
        : 0;
    const avgRepeat = corridorResults.length > 0
        ? corridorResults.reduce((s, c) => s + c.rates.repeat_poster_rate_pct, 0) / corridorResults.length
        : 0;

    const hasAnyCriticalWarning = corridorResults.some(c =>
        c.warnings.some(w => w.severity === 'critical')
    );

    const reasons: string[] = [];
    let state: ExpansionState;

    // 🔴 PAUSE — any critical failure
    if (
        avgParticipation < 20 ||
        avgMatch < 40 ||
        corridorResults.some(c => c.rates.verification_rate_pct < 50) ||
        hasAnyCriticalWarning
    ) {
        state = 'paused';
        if (avgParticipation < 20) reasons.push(`Avg participation ${avgParticipation.toFixed(1)}% < 20% threshold`);
        if (avgMatch < 40) reasons.push(`Avg match rate ${avgMatch.toFixed(1)}% < 40% threshold`);
        if (hasAnyCriticalWarning) reasons.push('Critical warning signals detected');
        reasons.push('ACTION: Fix funnel leaks, localize scripts, audit data quality. DO NOT add new corridors.');
    }
    // 🟢 PUSH HARD — all signals green
    else if (
        avgParticipation >= 30 &&
        avgMatch >= 55 &&
        avgRepeat >= 30 &&
        (greens.length >= 2 || blues.length >= 1)
    ) {
        state = 'push_hard';
        reasons.push(`All green: participation ${avgParticipation.toFixed(1)}%, match ${avgMatch.toFixed(1)}%, repeat ${avgRepeat.toFixed(1)}%`);
        reasons.push(`${greens.length} green corridors, ${blues.length} blue corridors`);
        reasons.push('ACTION: Increase outreach volume, begin paid tests, expand adjacent corridors, activate referral loops');
    }
    // 🟡 CAUTIOUS — mixed signals
    else {
        state = 'cautious';
        reasons.push(`Mixed signals: participation ${avgParticipation.toFixed(1)}%, match ${avgMatch.toFixed(1)}%, repeat ${avgRepeat.toFixed(1)}%`);
        reasons.push('ACTION: Targeted corridor fills, improve notifications, strengthen broker side. Do NOT scale paid yet.');
    }

    return {
        country_iso2,
        state,
        reasons,
        green_corridors: greens.length,
        blue_corridors: blues.length,
        avg_participation: Math.round(avgParticipation * 100) / 100,
        avg_match_rate: Math.round(avgMatch * 100) / 100,
        avg_repeat_rate: Math.round(avgRepeat * 100) / 100,
    };
}

// ============================================================
// FULL CORRIDOR EVALUATION
// ============================================================

export function evaluateCorridor(metrics: CorridorMetrics): CorridorLiquidityResult {
    const rates = computeFunnelRates(metrics);
    const cls_score = computeCLS(metrics, rates);
    const stage = classifyStage(metrics, rates);
    const warnings = detectWarnings(metrics, rates);

    return {
        corridor_id: metrics.corridor_id,
        country_iso2: metrics.country_iso2,
        cls_score,
        stage,
        rates,
        warnings,
        expansion_eligible: stage !== 'seeding' && warnings.filter(w => w.severity === 'critical').length === 0,
    };
}

// ============================================================
// PERSIST SNAPSHOT
// ============================================================

export async function persistCorridorSnapshot(
    metrics: CorridorMetrics,
    result: CorridorLiquidityResult
): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from('corridor_liquidity_snapshots').upsert({
        corridor_id: metrics.corridor_id,
        country_iso2: metrics.country_iso2,
        snapshot_date: new Date().toISOString().slice(0, 10),
        // Supply
        raw_records: metrics.raw_records,
        contactable_records: metrics.contactable_records,
        contacted: metrics.contacted,
        conversations_started: metrics.conversations_started,
        claims_started: metrics.claims_started,
        verified_operators: metrics.verified_operators,
        activated_operators: metrics.activated_operators,
        load_participating: metrics.load_participating,
        // Demand
        prospects_identified: metrics.prospects_identified,
        prospects_contactable: metrics.prospects_contactable,
        demand_conversations: metrics.demand_conversations,
        accounts_created: metrics.accounts_created,
        loads_posted: metrics.loads_posted,
        loads_matched: metrics.loads_matched,
        repeat_posters: metrics.repeat_posters,
        // Computed rates
        record_coverage_pct: result.rates.record_coverage_pct,
        outreach_penetration_pct: result.rates.outreach_penetration_pct,
        conversation_rate_pct: result.rates.conversation_rate_pct,
        claim_start_rate_pct: result.rates.claim_start_rate_pct,
        verification_rate_pct: result.rates.verification_rate_pct,
        activation_rate_pct: result.rates.activation_rate_pct,
        load_participation_pct: result.rates.load_participation_pct,
        match_rate_pct: result.rates.match_rate_pct,
        repeat_poster_rate_pct: result.rates.repeat_poster_rate_pct,
        // CLS
        cls_score: result.cls_score,
        stage: result.stage,
        // Velocity
        median_time_to_claim_hours: metrics.median_time_to_claim_hours,
        median_time_to_load_hours: metrics.median_time_to_load_hours,
        median_time_to_match_hours: metrics.median_time_to_match_hours,
        activation_cost: metrics.activation_cost,
        operator_density_per_100km: metrics.operator_density_per_100km,
    }, { onConflict: 'corridor_id,snapshot_date' });

    // Persist warnings
    for (const warning of result.warnings) {
        await supabase.from('funnel_warnings').insert({
            country_iso2: metrics.country_iso2,
            corridor_id: metrics.corridor_id,
            warning_type: warning.type,
            severity: warning.severity,
            signal_values: warning.signal_values,
            recommended_actions: warning.recommended_actions,
        });
    }
}
