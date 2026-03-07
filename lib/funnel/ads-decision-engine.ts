// lib/funnel/ads-decision-engine.ts
//
// Haul Command — Ad Autopilot Decision Engine
// Spec: Ad Autopilot Decision Spec v1.0.0
// Mode: fully_wired_runtime_governed
//
// Principle: paid_never_leads_liquidity — paid_only_amplifies
//
// Controls PLAI (Paid Lookalike Acquisition Infrastructure) campaigns
// with corridor-governed budgets and automatic enable/disable logic.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import type { CorridorLiquidityResult, ExpansionState } from "./corridor-governor";

// ============================================================
// TYPES
// ============================================================

export type PlaiDecision = 'enabled' | 'test_mode' | 'disabled' | 'force_disabled' | 'emergency_kill';
export type CampaignType = 'operator_acquisition' | 'broker_acquisition' | 'affiliate_growth';
export type ActivationCostTrend = 'declining_14d' | 'stable_14d' | 'rising_14d';

export interface AdsDecisionInput {
    corridor_id: string;
    country_iso2: string;
    cls_score: number;
    load_participation_pct: number;
    match_rate_pct: number;
    vapi_engagement_pct: number;
    activation_cost_trend: ActivationCostTrend;
    // Budget context
    daily_marketing_cap: number;
    demand_pressure: number;          // 0-1
    revenue_potential: number;         // 0-1
    cls_momentum: number;             // 0-1 (positive trend)
    // Safety signals
    spend_change_24h_pct?: number;
    cpa_change_24h_pct?: number;
    match_rate_change_7d_pct?: number;
}

export interface AdsDecisionOutput {
    corridor_id: string;
    country_iso2: string;
    plai_decision: PlaiDecision;
    daily_budget: number;
    budget_share_pct: number;
    opportunity_score: number;
    campaign_recommendations: CampaignRecommendation[];
    decision_reason: string;
    warnings: string[];
}

export interface CampaignRecommendation {
    campaign_type: CampaignType;
    bid_strategy: string;
    optimization_event: string;
    audiences: string[];
    creative_strategy: Record<string, boolean>;
    daily_budget_share_pct: number;
}

// ============================================================
// TRIGGER THRESHOLDS (from spec)
// ============================================================

const THRESHOLDS = {
    plai_enable: {
        cls_min: 60,
        load_participation_min: 30,
        match_rate_min: 55,
        vapi_engagement_min: 45,
        activation_cost_trend: 'declining_14d' as ActivationCostTrend,
    },
    plai_test_mode: {
        cls_range: [45, 59] as [number, number],
        demand_growth_min: 0.10,
        supply_pressure_flag: true,
    },
    plai_force_disable: {
        cls_max: 44,
        load_participation_max: 19,
        match_rate_max: 39,
    },
    emergency_kill: {
        spend_spike_24h: 40,
        cpa_spike_24h: 35,
        match_rate_drop_7d: 15,
    },
    budget: {
        min_daily_per_corridor: 25,
        max_share_single_corridor: 0.22,
        learning_pct: 0.10,
        retarget_pct: 0.20,
        prospecting_pct: 0.70,
    },
    cost_of_liquidity: {
        warning: 350,
        critical: 550,
    },
};

// ============================================================
// PLAI DECISION LOGIC
// ============================================================

export function decidePlaiState(input: AdsDecisionInput): PlaiDecision {
    // Emergency kill switch — check first, always
    if (
        (input.spend_change_24h_pct !== undefined && input.spend_change_24h_pct > THRESHOLDS.emergency_kill.spend_spike_24h) ||
        (input.cpa_change_24h_pct !== undefined && input.cpa_change_24h_pct > THRESHOLDS.emergency_kill.cpa_spike_24h) ||
        (input.match_rate_change_7d_pct !== undefined && input.match_rate_change_7d_pct < -THRESHOLDS.emergency_kill.match_rate_drop_7d)
    ) {
        return 'emergency_kill';
    }

    // Force disable — liquidity too low
    if (
        input.cls_score <= THRESHOLDS.plai_force_disable.cls_max ||
        input.load_participation_pct <= THRESHOLDS.plai_force_disable.load_participation_max ||
        input.match_rate_pct <= THRESHOLDS.plai_force_disable.match_rate_max
    ) {
        return 'force_disabled';
    }

    // Full enable — all conditions met
    if (
        input.cls_score >= THRESHOLDS.plai_enable.cls_min &&
        input.load_participation_pct >= THRESHOLDS.plai_enable.load_participation_min &&
        input.match_rate_pct >= THRESHOLDS.plai_enable.match_rate_min &&
        input.vapi_engagement_pct >= THRESHOLDS.plai_enable.vapi_engagement_min &&
        input.activation_cost_trend === THRESHOLDS.plai_enable.activation_cost_trend
    ) {
        return 'enabled';
    }

    // Test mode — in between
    if (
        input.cls_score >= THRESHOLDS.plai_test_mode.cls_range[0] &&
        input.cls_score <= THRESHOLDS.plai_test_mode.cls_range[1] &&
        input.demand_pressure >= THRESHOLDS.plai_test_mode.demand_growth_min
    ) {
        return 'test_mode';
    }

    return 'disabled';
}

// ============================================================
// OPPORTUNITY SCORE — Softmax budget allocation
// ============================================================

/**
 * Corridor Opportunity Score:
 *   (demand_pressure * 0.4) + (revenue_potential * 0.3) + (cls_momentum * 0.3)
 */
export function computeOpportunityScore(input: AdsDecisionInput): number {
    return Math.round((
        input.demand_pressure * 0.4 +
        input.revenue_potential * 0.3 +
        input.cls_momentum * 0.3
    ) * 1000) / 1000;
}

/**
 * Softmax normalization across active corridors.
 */
export function softmaxAllocate(
    corridorScores: { corridor_id: string; opportunity_score: number }[],
    totalBudget: number
): Map<string, number> {
    if (corridorScores.length === 0) return new Map();

    // Temperature parameter for softmax
    const temperature = 2.0;
    const expScores = corridorScores.map(c => ({
        corridor_id: c.corridor_id,
        exp: Math.exp(c.opportunity_score / temperature),
    }));

    const sumExp = expScores.reduce((s, e) => s + e.exp, 0);

    const allocations = new Map<string, number>();

    for (const c of expScores) {
        let share = c.exp / sumExp;

        // Cap single corridor at max share
        share = Math.min(share, THRESHOLDS.budget.max_share_single_corridor);

        // Enforce minimum budget
        const budget = Math.max(
            THRESHOLDS.budget.min_daily_per_corridor,
            Math.round(totalBudget * share * 100) / 100
        );

        allocations.set(c.corridor_id, budget);
    }

    return allocations;
}

// ============================================================
// CAMPAIGN RECOMMENDATIONS
// ============================================================

function buildCampaignRecommendations(
    input: AdsDecisionInput,
    decision: PlaiDecision,
    dailyBudget: number
): CampaignRecommendation[] {
    if (decision === 'disabled' || decision === 'force_disabled' || decision === 'emergency_kill') {
        return [];
    }

    const campaigns: CampaignRecommendation[] = [];

    // Operator acquisition (primary)
    campaigns.push({
        campaign_type: 'operator_acquisition',
        bid_strategy: 'cost_cap',
        optimization_event: 'operator_claim_completed',
        audiences: [
            'lookalike_existing_operators',
            'geo_corridor_radius',
            'heavy_haul_interest_cluster',
        ],
        creative_strategy: {
            dynamic_corridor_insertion: true,
            urgency_language: true,
            localized_language: true,
        },
        daily_budget_share_pct: 50,
    });

    // Broker acquisition
    campaigns.push({
        campaign_type: 'broker_acquisition',
        bid_strategy: 'value_optimized',
        optimization_event: 'first_load_posted',
        audiences: [
            'freight_broker_titles',
            'logistics_company_segments',
            'retarget_site_visitors',
        ],
        creative_strategy: {
            dynamic_lane_insertion: true,
            trust_badges: true,
            social_proof_blocks: true,
        },
        daily_budget_share_pct: 35,
    });

    // Affiliate growth (only when enabled, not test mode)
    if (decision === 'enabled') {
        campaigns.push({
            campaign_type: 'affiliate_growth',
            bid_strategy: 'cost_cap',
            optimization_event: 'affiliate_signup',
            audiences: [
                'logistics_marketing_interest',
                'referral_partner_segments',
            ],
            creative_strategy: {
                dynamic_corridor_insertion: false,
                urgency_language: false,
                localized_language: true,
            },
            daily_budget_share_pct: 15,
        });
    }

    return campaigns;
}

// ============================================================
// FULL DECISION ENGINE
// ============================================================

export function makeAdsDecision(input: AdsDecisionInput): AdsDecisionOutput {
    const decision = decidePlaiState(input);
    const opportunityScore = computeOpportunityScore(input);
    const warnings: string[] = [];

    let dailyBudget = 0;
    let budgetSharePct = 0;
    let reason = '';

    switch (decision) {
        case 'emergency_kill':
            reason = 'EMERGENCY: Spend/CPA spike or match rate collapse detected. All paid killed.';
            warnings.push('Emergency kill switch triggered');
            break;

        case 'force_disabled':
            reason = `CLS ${input.cls_score} below 45, participation ${input.load_participation_pct}%, match ${input.match_rate_pct}%. Paid forbidden — fix fundamentals first.`;
            break;

        case 'disabled':
            reason = `Conditions not met for even test mode. CLS=${input.cls_score}, demand_pressure=${input.demand_pressure}`;
            break;

        case 'test_mode':
            dailyBudget = Math.max(THRESHOLDS.budget.min_daily_per_corridor, input.daily_marketing_cap * 0.05);
            budgetSharePct = 5;
            reason = `Test mode: CLS ${input.cls_score} in range [45-59], demand growing. Limited budget for learning.`;
            warnings.push('Test mode active — monitor CPA closely');
            break;

        case 'enabled':
            dailyBudget = input.daily_marketing_cap * 0.15; // Base 15% allocation, adjusted by softmax
            budgetSharePct = 15;
            reason = `Full enable: CLS ${input.cls_score} ≥ 60, participation ${input.load_participation_pct}% ≥ 30%, match ${input.match_rate_pct}% ≥ 55%, VAPI ${input.vapi_engagement_pct}% ≥ 45%, costs declining.`;
            break;
    }

    // Cost of liquidity warning
    if (input.activation_cost_trend === 'rising_14d') {
        warnings.push('Activation cost trend rising — monitor CPA');
    }

    return {
        corridor_id: input.corridor_id,
        country_iso2: input.country_iso2,
        plai_decision: decision,
        daily_budget: Math.round(dailyBudget * 100) / 100,
        budget_share_pct: budgetSharePct,
        opportunity_score: opportunityScore,
        campaign_recommendations: buildCampaignRecommendations(input, decision, dailyBudget),
        decision_reason: reason,
        warnings,
    };
}

// ============================================================
// PERSIST DECISION
// ============================================================

export async function persistAdsDecision(output: AdsDecisionOutput): Promise<void> {
    const supabase = getSupabaseAdmin();

    for (const campaign of output.campaign_recommendations) {
        await supabase.from('ads_decision_log').upsert({
            decision_date: new Date().toISOString().slice(0, 10),
            corridor_id: output.corridor_id,
            country_iso2: output.country_iso2,
            cls_score: undefined, // Would be passed from input
            load_participation_pct: undefined,
            match_rate_pct: undefined,
            plai_decision: output.plai_decision,
            daily_budget: output.daily_budget * (campaign.daily_budget_share_pct / 100),
            budget_share_pct: output.budget_share_pct,
            opportunity_score: output.opportunity_score,
            campaign_type: campaign.campaign_type,
            bid_strategy: campaign.bid_strategy,
            optimization_event: campaign.optimization_event,
            decision_reason: output.decision_reason,
            warnings: output.warnings,
        }, { onConflict: 'corridor_id,decision_date,campaign_type' });
    }

    // If no campaigns (disabled state), log the disabled decision
    if (output.campaign_recommendations.length === 0) {
        await supabase.from('ads_decision_log').upsert({
            decision_date: new Date().toISOString().slice(0, 10),
            corridor_id: output.corridor_id,
            country_iso2: output.country_iso2,
            plai_decision: output.plai_decision,
            daily_budget: 0,
            budget_share_pct: 0,
            opportunity_score: output.opportunity_score,
            decision_reason: output.decision_reason,
            warnings: output.warnings,
        }, { onConflict: 'corridor_id,decision_date,campaign_type' });
    }
}
