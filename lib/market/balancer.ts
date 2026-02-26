// ════════════════════════════════════════════════════════════════
// AUTONOMOUS MARKET BALANCER — State Classifier + Action Engine
// Cadence: evaluate every 10 min, publish every 15 min
// Feature-flagged, fairness-first, no SMS, no cert subsidies
// ════════════════════════════════════════════════════════════════

export type MarketState =
    | 'balanced' | 'supply_shortage' | 'demand_drop'
    | 'broker_price_too_low' | 'driver_friction_high'
    | 'corridor_risk_spike' | 'saturation';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface RegionSignals {
    availableDrivers: number;
    geoMinDriverThreshold: number;
    unfilledLoads: number;
    unfilledLoadsTrend: 'rising' | 'falling' | 'stable';
    avgFillTimeHours: number;
    regionalP60FillTime: number;
    regionalP75FillTime: number;
    regionalP90FillTime: number;
    brokerPriceAcceptanceRate: number; // 0-1
    driverDeclineRate: number;         // 0-1
    payPerMile: number;
    laneRateP50: number;
    acceptFlowTimeSeconds: number;
    dropoffRate: number;
    baselineDropoffRate: number;
    incidentFrequencyDelta: number;    // pct change vs baseline
    detourProbability: number;         // 0-1
    availableDriversRatio: number;     // vs geo demand (> 1 = surplus)
    demandScore: number;               // 0-100
    confidence: number;                // 0-1
    sampleSize24h: number;
}

export interface ClassifierOutput {
    state: MarketState;
    severity: Severity;
    recommendedActions: string[];
    signals: Partial<RegionSignals>;
}

// ── Market State Classifier ───────────────────────────────────
export function classifyMarket(s: RegionSignals): ClassifierOutput {
    // Low confidence → frozen / balanced
    if (s.confidence < 0.3 || s.sampleSize24h < 5) {
        return { state: 'balanced', severity: 'low', recommendedActions: ['maintain'], signals: s };
    }

    // Supply shortage
    if (s.availableDrivers < s.geoMinDriverThreshold && s.unfilledLoadsTrend === 'rising') {
        let severity: Severity = 'medium';
        if (s.avgFillTimeHours > s.regionalP90FillTime) severity = 'critical';
        else if (s.avgFillTimeHours > s.regionalP75FillTime) severity = 'high';
        return {
            state: 'supply_shortage', severity,
            recommendedActions: [
                'matching_radius_expand',
                'driver_hot_zone_push',
                'broker_radius_suggest',
                'broker_price_recommend',
                ...(severity === 'critical' ? ['seo_priority_boost', 'recruiter_push_queue'] : []),
            ],
            signals: s,
        };
    }

    // Broker price too low
    if (s.brokerPriceAcceptanceRate < 0.55 && s.driverDeclineRate > 0.3 && s.payPerMile < s.laneRateP50) {
        return {
            state: 'broker_price_too_low', severity: 'medium',
            recommendedActions: ['broker_price_recommend', 'driver_earnings_boost_badge', 'show_reason_codes'],
            signals: s,
        };
    }

    // Driver friction high
    if (s.acceptFlowTimeSeconds > 8 || s.dropoffRate > s.baselineDropoffRate * 1.25) {
        return {
            state: 'driver_friction_high', severity: 'medium',
            recommendedActions: ['reduce_friction_auto_fill', 'one_tap_accept_prompt', 'push_payload_enrich'],
            signals: s,
        };
    }

    // Corridor risk spike
    if (s.incidentFrequencyDelta > 0.4 || s.detourProbability > 0.35) {
        return {
            state: 'corridor_risk_spike', severity: 'high',
            recommendedActions: ['broker_departure_time_suggest', 'driver_route_risk_alert', 'seo_hot_corridor_generate'],
            signals: s,
        };
    }

    // Saturation
    if (s.availableDriversRatio > 2.0 && s.demandScore < 35) {
        return {
            state: 'saturation', severity: 'low',
            recommendedActions: ['broker_lower_price_suggest', 'seo_free_tools_internal_links', 'fast_accept_bonus_if_needed'],
            signals: s,
        };
    }

    // Demand drop
    if (s.unfilledLoadsTrend === 'falling' && s.demandScore < 30) {
        return {
            state: 'demand_drop', severity: 'low',
            recommendedActions: ['maintain', 'freshness_injection'],
            signals: s,
        };
    }

    return { state: 'balanced', severity: 'low', recommendedActions: ['maintain', 'freshness_injection'], signals: s };
}

// ── Action Catalog ────────────────────────────────────────────
export const ACTION_GUARDRAILS = {
    max_broker_price_jump_pct: 35,
    surge_multiplier_cap: 1.85,
    max_push_per_user_per_day: 4,
    daily_incentive_budget_usd: 500,
    min_confidence_for_incentive: 0.7,
    low_confidence_freeze: true,
};

export const ACTION_DESCRIPTIONS: Record<string, string> = {
    matching_radius_expand: 'Widen driver match radius for low-supply zone',
    driver_hot_zone_push: 'FCM push: hot zone alert to nearby available drivers',
    broker_radius_suggest: 'Suggest broker expand search radius',
    broker_price_recommend: 'Show broker recommended price range with reason code',
    seo_priority_boost: 'Mark geo page for priority indexing + freshness injection',
    recruiter_push_queue: 'Enqueue region into recruiter outreach pipeline',
    driver_earnings_boost_badge: 'Show earnings boost badge on driver load card',
    show_reason_codes: 'Display transparent reason codes to broker on guidance',
    reduce_friction_auto_fill: 'Auto-populate driver apply form from saved profile',
    one_tap_accept_prompt: 'Surface one-tap accept optimisation on load card',
    push_payload_enrich: 'Improve FCM payload richness for better CTR',
    broker_departure_time_suggest: 'Suggest departure window to avoid congestion',
    driver_route_risk_alert: 'Alert driver to elevated route risk before accept',
    seo_hot_corridor_generate: 'Generate/update corridor page with live traffic data',
    broker_lower_price_suggest: 'Suggest broker lower to p50 in saturated zone',
    seo_free_tools_internal_links: 'Boost free tool links in saturated geo pages',
    fast_accept_bonus_if_needed: 'Consider platform-funded fast-accept bonus (budget-capped)',
    freshness_injection: 'Inject real-time stats (loads, fill time) into geo pages',
    maintain: 'No action needed — monitor only',
};

// ── Feature flag check ────────────────────────────────────────
export function isBalancerEnabled(flags: Record<string, boolean>): boolean {
    return flags['market_balancer_enabled'] === true;
}

export function shouldRunIncentive(flags: Record<string, boolean>, confidence: number): boolean {
    return flags['incentives_enabled'] === true && confidence >= ACTION_GUARDRAILS.min_confidence_for_incentive;
}
