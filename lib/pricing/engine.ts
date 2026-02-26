/**
 * Dynamic Pricing Intelligence Engine
 *
 * Generates Good / Fair / Bad price bands using:
 *   US baseline → country multiplier → corridor heat → complexity modifiers
 *
 * Produces Carvana-style price matrix output.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface PriceInputs {
    countryCode: string;
    regionKey: string;          // southeast, midwest, national, etc.
    rateType: 'pevo' | 'height_pole' | 'day_rate' | 'day_rate_height';
    corridorHeatBand?: 'cold' | 'balanced' | 'warm' | 'hot' | 'critical';
    complexityModifiers?: string[];   // height_pole, superload, night_move, etc.
}

export interface PriceBand {
    recommendedLow: number;
    recommendedHigh: number;
    unit: 'per_mile' | 'per_day';
    currency: string;
    countryMultiplier: number;
    heatMultiplier: number;
    complexityMultiplier: number;
    bands: {
        greatDeal: { max: number };
        fairMarket: { min: number; max: number };
        premium: { min: number; max: number };
        overpriced: { min: number };
    };
}

export type PriceLabel = 'great_deal' | 'fair_market' | 'premium' | 'overpriced';

// ── Constants (mirrors DB seeds — can be overridden from Supabase) ─────────

const COUNTRY_MULTIPLIERS: Record<string, { multiplier: number; currency: string }> = {
    US: { multiplier: 1.00, currency: 'USD' },
    CA: { multiplier: 0.98, currency: 'CAD' },
    AU: { multiplier: 1.18, currency: 'AUD' },
    GB: { multiplier: 1.12, currency: 'GBP' },
    NZ: { multiplier: 1.15, currency: 'NZD' },
    SE: { multiplier: 1.20, currency: 'SEK' },
    NO: { multiplier: 1.28, currency: 'NOK' },
    AE: { multiplier: 1.10, currency: 'AED' },
    SA: { multiplier: 1.05, currency: 'SAR' },
    DE: { multiplier: 1.14, currency: 'EUR' },
    ZA: { multiplier: 0.82, currency: 'ZAR' },
};

const BASELINE_RATES: Record<string, Record<string, { low: number; high: number; unit: 'per_mile' | 'per_day' }>> = {
    southeast: { pevo: { low: 1.65, high: 1.85, unit: 'per_mile' }, height_pole: { low: 1.90, high: 2.20, unit: 'per_mile' } },
    midwest: { pevo: { low: 1.75, high: 1.95, unit: 'per_mile' }, height_pole: { low: 2.00, high: 2.50, unit: 'per_mile' } },
    northeast: { pevo: { low: 1.80, high: 2.00, unit: 'per_mile' }, height_pole: { low: 2.00, high: 2.50, unit: 'per_mile' } },
    southwest: { pevo: { low: 1.85, high: 2.00, unit: 'per_mile' } },
    west_coast: { pevo: { low: 2.00, high: 2.25, unit: 'per_mile' }, height_pole: { low: 2.25, high: 2.75, unit: 'per_mile' } },
    national: { day_rate: { low: 450, high: 650, unit: 'per_day' }, day_rate_height: { low: 550, high: 800, unit: 'per_day' } },
};

const HEAT_MULTIPLIERS: Record<string, number> = {
    cold: 0.95,
    balanced: 1.00,
    warm: 1.08,
    hot: 1.18,
    critical: 1.32,
};

const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
    height_pole: 1.18,
    superload: 1.35,
    night_move: 1.12,
    urban_heavy: 1.15,
    multi_day: 1.08,
    police_required: 1.10,
};

// ── Engine ─────────────────────────────────────────────────────────────────

export function calculatePriceBand(inputs: PriceInputs): PriceBand | null {
    // 1. Get baseline
    const regionRates = BASELINE_RATES[inputs.regionKey];
    if (!regionRates) return null;

    const baseline = regionRates[inputs.rateType];
    if (!baseline) return null;

    // 2. Country multiplier
    const country = COUNTRY_MULTIPLIERS[inputs.countryCode] || COUNTRY_MULTIPLIERS.US;
    const countryMult = country.multiplier;

    // 3. Corridor heat
    const heatMult = HEAT_MULTIPLIERS[inputs.corridorHeatBand || 'balanced'] || 1.00;

    // 4. Stack complexity modifiers (multiplicative)
    let complexityMult = 1.00;
    for (const mod of inputs.complexityModifiers || []) {
        const m = COMPLEXITY_MULTIPLIERS[mod];
        if (m) complexityMult *= m;
    }

    // 5. Calculate recommended range
    const totalMult = countryMult * heatMult * complexityMult;
    const recLow = roundPrice(baseline.low * totalMult, baseline.unit);
    const recHigh = roundPrice(baseline.high * totalMult, baseline.unit);

    // 6. Build Carvana-style bands
    const bands = {
        greatDeal: { max: recLow },
        fairMarket: { min: recLow, max: recHigh },
        premium: { min: recHigh, max: roundPrice(recHigh * 1.20, baseline.unit) },
        overpriced: { min: roundPrice(recHigh * 1.20, baseline.unit) },
    };

    return {
        recommendedLow: recLow,
        recommendedHigh: recHigh,
        unit: baseline.unit,
        currency: country.currency,
        countryMultiplier: countryMult,
        heatMultiplier: heatMult,
        complexityMultiplier: complexityMult,
        bands,
    };
}

/**
 * Label a specific price against the recommended bands.
 */
export function labelPrice(price: number, band: PriceBand): PriceLabel {
    if (price < band.bands.greatDeal.max) return 'great_deal';
    if (price <= band.bands.fairMarket.max) return 'fair_market';
    if (price <= band.bands.premium.max) return 'premium';
    return 'overpriced';
}

/**
 * Get the color for a price label (used in UI).
 */
export function priceColor(label: PriceLabel): string {
    switch (label) {
        case 'great_deal': return '#22c55e';
        case 'fair_market': return '#f59e0b';
        case 'premium': return '#f97316';
        case 'overpriced': return '#ef4444';
    }
}

/**
 * Get display text for a price label.
 */
export function priceLabel(label: PriceLabel): string {
    switch (label) {
        case 'great_deal': return 'Great Deal';
        case 'fair_market': return 'Fair Market';
        case 'premium': return 'Premium';
        case 'overpriced': return 'Overpriced';
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function roundPrice(value: number, unit: 'per_mile' | 'per_day'): number {
    if (unit === 'per_mile') {
        // Round to nearest $0.05
        return Math.round(value * 20) / 20;
    }
    // Day rates round to nearest $25
    return Math.round(value / 25) * 25;
}
