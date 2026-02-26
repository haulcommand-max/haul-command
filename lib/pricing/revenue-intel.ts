/**
 * Revenue Intelligence Configuration
 *
 * Single source of truth for:
 *  - Price anchors and regional multipliers
 *  - Conversion priors
 *  - Liquidity protection triggers
 *  - AdGrid yield parameters
 *  - Experiment guardrails
 */

// ── Price Anchors (US Reference) ───────────────────────────────────────────

export const PRICE_ANCHORS_USD = {
    pro_escort_monthly: 29,
    pro_broker_monthly: 59,
    control_tower_monthly: 149,
} as const;

export const PRICE_GUARDRAILS = {
    minDiscountPct: -35,
    maxIncreasePctWithoutProof: 25,
    requireExperimentBeforeGlobalChange: true,
} as const;

// ── Regional Multipliers ───────────────────────────────────────────────────

export const REGIONAL_MULTIPLIERS: Record<string, number> = {
    // Tier A: Full price
    US: 1.00,
    CA: 1.00,
    AU: 1.00,
    GB: 0.95,
    AE: 1.05,
    // Tier B: Adjusted
    DE: 0.90,
    NO: 0.95,
    SE: 0.90,
    NZ: 0.85,
    // Tier C: Penetration
    ZA: 0.70,
    SA: 0.80,
};

export function computeRegionalPrice(
    anchorUsd: number,
    countryCode: string,
    experimentAdjustment: number = 1.0,
    liquidityProtectionFactor: number = 1.0,
): number {
    const multiplier = REGIONAL_MULTIPLIERS[countryCode] ?? 1.0;
    const raw = anchorUsd * multiplier * experimentAdjustment * liquidityProtectionFactor;
    // Psychological rounding
    return Math.round(raw * 100) / 100;
}

// ── Conversion Priors (guide experiments, never force pricing) ─────────────

export const CONVERSION_PRIORS = {
    escort_paid_rate: { low: 0.05, expected: 0.10, strong: 0.14 },
    broker_paid_rate: { low: 0.04, expected: 0.08, strong: 0.12 },
    control_tower_rate: { low: 0.01, expected: 0.025, strong: 0.05 },
} as const;

// ── Liquidity Protection ───────────────────────────────────────────────────

export type LiquidityStatus = 'strong' | 'stable' | 'warning' | 'critical';

export const LIQUIDITY_THRESHOLDS = {
    warning: { fillRateDropPct: 15, timeToFillIncreasePct: 25 },
    critical: { fillRateDropPct: 30 },
} as const;

export const LIQUIDITY_PROTECTION_FACTORS: Record<LiquidityStatus, number> = {
    strong: 1.05,
    stable: 1.00,
    warning: 0.90,
    critical: 0.85,
};

export function getLiquidityActions(status: LiquidityStatus): string[] {
    switch (status) {
        case 'warning':
            return ['pause_price_increases', 'widen_match_radius', 'boost_supply_notifications', 'flag_pricing_team'];
        case 'critical':
            return ['auto_apply_price_relief_discount', 'increase_invite_pressure', 'suppress_experimental_price_hikes'];
        default:
            return [];
    }
}

// ── AdGrid Yield Parameters ────────────────────────────────────────────────

export const ADGRID_BASE_ECPM = {
    conservative: 9,
    expected: 16,
    strong: 28,
} as const;

export const AD_MATURITY_ADJUSTMENT: Record<string, number> = {
    high: 1.00,
    medium: 0.80,
    emerging: 0.60,
};

export const ADGRID_COUNTRY_CONFIG: Record<string, {
    currency: string;
    vatRate: number;
    adMaturity: 'high' | 'medium' | 'emerging';
    multiplier: number;
}> = {
    US: { currency: 'USD', vatRate: 0.0, adMaturity: 'high', multiplier: 1.00 },
    CA: { currency: 'CAD', vatRate: 0.13, adMaturity: 'high', multiplier: 1.00 },
    AU: { currency: 'AUD', vatRate: 0.10, adMaturity: 'high', multiplier: 1.00 },
    GB: { currency: 'GBP', vatRate: 0.20, adMaturity: 'high', multiplier: 0.95 },
    NZ: { currency: 'NZD', vatRate: 0.15, adMaturity: 'medium', multiplier: 0.85 },
    SE: { currency: 'SEK', vatRate: 0.25, adMaturity: 'high', multiplier: 0.90 },
    NO: { currency: 'NOK', vatRate: 0.25, adMaturity: 'high', multiplier: 0.95 },
    AE: { currency: 'AED', vatRate: 0.05, adMaturity: 'high', multiplier: 1.05 },
    SA: { currency: 'SAR', vatRate: 0.15, adMaturity: 'emerging', multiplier: 0.80 },
    DE: { currency: 'EUR', vatRate: 0.19, adMaturity: 'high', multiplier: 0.90 },
    ZA: { currency: 'ZAR', vatRate: 0.15, adMaturity: 'emerging', multiplier: 0.70 },
};

export function computeAdPrice(
    baseCpmUsd: number,
    countryCode: string,
    demandHeatMultiplier: number = 1.0,
    inventoryScarcityMultiplier: number = 1.0,
): { cpmLocal: number; floorUsd: number } {
    const config = ADGRID_COUNTRY_CONFIG[countryCode] || ADGRID_COUNTRY_CONFIG.US;
    const maturityAdj = AD_MATURITY_ADJUSTMENT[config.adMaturity];
    const cpmLocal = baseCpmUsd * config.multiplier * maturityAdj * demandHeatMultiplier * inventoryScarcityMultiplier;

    const floorMap: Record<string, number> = { high: 0.80, medium: 0.60, emerging: 0.40 };
    const floorUsd = floorMap[config.adMaturity] || 0.40;

    return {
        cpmLocal: Math.max(Math.round(cpmLocal * 100) / 100, floorUsd),
        floorUsd,
    };
}

// ── Experiment Guardrails ──────────────────────────────────────────────────

export const EXPERIMENT_GUARDRAILS = {
    minSampleSizePerVariant: 500,
    earlyStop: {
        probabilityOfBeingBestGte: 0.95,
        revenueLiftGte: 0.07,
    },
    autoPause: {
        conversionDropPct: 25,
        fillRateDropPct: 15,
    },
    rolloutStages: ['10_pct', '25_pct', '50_pct', '100_pct'] as const,
} as const;

// ── Revenue Leak Types ─────────────────────────────────────────────────────

export type RevenuLeakType =
    | 'underpriced_corridor'
    | 'high_traffic_low_yield'
    | 'strong_usage_low_conversion'
    | 'high_demand_low_supply';

export function getLeakAction(leakType: RevenuLeakType): string[] {
    switch (leakType) {
        case 'underpriced_corridor':
            return ['recommend_price_increase', 'notify_ops'];
        case 'high_traffic_low_yield':
            return ['raise_ad_floor', 'trigger_ad_sales_outreach'];
        case 'strong_usage_low_conversion':
            return ['trigger_paywall_experiment', 'review_feature_gating'];
        case 'high_demand_low_supply':
            return ['trigger_autonomous_supply_mover', 'boost_escort_invites'];
    }
}
