// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL PRICING SANITY GUARD — The Quiet Money Protector
// Prevents silent revenue bleed from cross-country pricing mistakes
//
// For every monetized action validates:
//   - minimum price floors per country
//   - maximum discount ceilings
//   - FX volatility buffers
//   - margin floor protection
//   - boost auction anti-dumping rules
//
// Anomaly detection:
//   - sudden ARPU drop by country
//   - abnormal boost pricing
//   - conversion spike with low revenue
//
// Outputs: safe_price, risk_flag, margin_estimate
// ═══════════════════════════════════════════════════════════════════════════════

import { COUNTRY_RATE_TABLE } from '../pricing/global-rate-index';
import { HCServerTrack } from '../analytics/posthog-server';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type PricingActionType =
    | 'subscription'
    | 'match_fee'
    | 'load_boost'
    | 'featured_slot'
    | 'data_product'
    | 'place_premium'
    | 'adgrid_bid';

export interface PricingSanityInput {
    actionType: PricingActionType;
    localCurrency: string;
    proposedPriceLocal: number;
    usdReference: number;
    countryCode: string;
    corridorId?: string;
    corridorDemandHeat?: number;     // 0-1
    historicalConversionRate?: number; // 0-1
}

export interface PricingSanityResult {
    safePrice: number;               // the price after all guards applied
    safePriceUsd: number;
    originalPrice: number;
    currency: string;
    adjustmentMade: boolean;
    adjustmentReason?: string;
    riskFlag: RiskFlag | null;
    marginEstimate: {
        grossMarginPct: number;      // estimated margin after costs
        isHealthy: boolean;
    };
    guards: GuardResult[];
}

export interface RiskFlag {
    type: 'below_floor' | 'below_margin' | 'fx_drift' | 'discount_excessive'
    | 'anti_dumping' | 'conversion_anomaly' | 'arpu_drop';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    suggestedAction: string;
}

export interface GuardResult {
    guard: string;
    passed: boolean;
    detail: string;
}

export interface PricingAnomaly {
    countryCode: string;
    anomalyType: string;
    expectedValue: number;
    actualValue: number;
    severity: 'low' | 'medium' | 'high';
    detectedAt: string;
    message: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY-LEVEL PRICE FLOORS & AFFORDABILITY (USD equivalent)
// ═══════════════════════════════════════════════════════════════════════════════

const PRICE_FLOORS_USD: Record<PricingActionType, Record<string, number>> = {
    subscription: {
        US: 29, CA: 25, AU: 29, GB: 29, NZ: 25, ZA: 9, DE: 25, NL: 25, AE: 35,
        BR: 7, IE: 25, SE: 29, NO: 29, DK: 29, FI: 25, BE: 25, AT: 25, CH: 35,
        ES: 19, FR: 25, IT: 19, PT: 15, SA: 25, QA: 29, MX: 7,
        PL: 9, CZ: 9, SK: 7, HU: 7, SI: 9, EE: 7, LV: 7, LT: 7, HR: 7,
        RO: 7, BG: 5, GR: 9, TR: 5, KW: 25, OM: 19, BH: 19, SG: 25,
        MY: 7, JP: 29, KR: 19, CL: 7, AR: 5, CO: 5, PE: 5, UY: 5, PA: 9, CR: 7,
        DEFAULT: 9,
    },
    match_fee: {
        US: 14, CA: 14, AU: 14, GB: 14, AE: 19, DEFAULT: 5,
    },
    load_boost: {
        US: 7, CA: 7, AU: 7, GB: 7, AE: 9, DEFAULT: 3,
    },
    featured_slot: {
        US: 49, CA: 49, AU: 49, GB: 49, AE: 69, DEFAULT: 19,
    },
    data_product: {
        US: 49, CA: 49, AU: 49, GB: 49, AE: 69, DEFAULT: 25,
    },
    place_premium: {
        US: 14, CA: 14, AU: 14, GB: 14, DEFAULT: 5,
    },
    adgrid_bid: {
        US: 0.50, CA: 0.50, AU: 0.50, GB: 0.50, DEFAULT: 0.10,
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GUARD CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const GUARD_CONFIG = {
    // Maximum discount from base price
    maxDiscountPct: 0.50,         // never discount more than 50%
    // Minimum margin floor
    marginFloorPct: 0.15,         // at least 15% gross margin
    // FX volatility buffer
    fxVolatilityBuffer: 0.08,     // 8% buffer for FX swings
    // Anti-dumping for auctions
    antiDumpingFloorPct: 0.25,    // boost bids can't go below 25% of reference
    // Max price (anti-glitch)
    maxMultiplierFromReference: 5.0, // can't be >5× the reference price
    // ARPU monitoring
    arpuDropAlertPct: 0.15,       // alert if ARPU drops >15% in a period
};

// ═══════════════════════════════════════════════════════════════════════════════
// AFFORDABILITY INDEX — USD purchasing power parity
// ═══════════════════════════════════════════════════════════════════════════════

const AFFORDABILITY_INDEX: Record<string, number> = {
    // 1.0 = US baseline. Higher = more expensive market, Lower = more affordable needed
    US: 1.00, CA: 0.95, AU: 1.00, GB: 1.00, NZ: 0.90, ZA: 0.35, DE: 0.95, NL: 0.95,
    AE: 1.10, BR: 0.30, IE: 0.95, SE: 0.95, NO: 1.00, DK: 0.95, FI: 0.90, BE: 0.90,
    AT: 0.90, CH: 1.15, ES: 0.75, FR: 0.90, IT: 0.80, PT: 0.65, SA: 0.85, QA: 0.95,
    MX: 0.30, PL: 0.45, CZ: 0.50, SK: 0.45, HU: 0.40, SI: 0.55, EE: 0.50, LV: 0.45,
    LT: 0.45, HR: 0.45, RO: 0.40, BG: 0.35, GR: 0.55, TR: 0.30, KW: 0.85, OM: 0.75,
    BH: 0.80, SG: 0.95, MY: 0.40, JP: 0.90, KR: 0.80, CL: 0.40, AR: 0.25, CO: 0.25,
    PE: 0.25, UY: 0.35, PA: 0.45, CR: 0.40,
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE: VALIDATE PRICE
// ═══════════════════════════════════════════════════════════════════════════════

export class PricingSanityGuard {

    static validate(input: PricingSanityInput): PricingSanityResult {
        const guards: GuardResult[] = [];
        let safePrice = input.proposedPriceLocal;
        let adjustmentMade = false;
        let adjustmentReason: string | undefined;
        let riskFlag: RiskFlag | null = null;

        const floors = PRICE_FLOORS_USD[input.actionType] || {};
        const floorUsd = floors[input.countryCode] ?? floors.DEFAULT ?? 1;
        const affordability = AFFORDABILITY_INDEX[input.countryCode] ?? 0.50;
        const rateData = COUNTRY_RATE_TABLE[input.countryCode];
        const fxRate = rateData
            ? rateData.baseDayRate / rateData.baseDayRateUsd
            : 1;

        // Convert proposed price to USD for comparison
        const proposedUsd = fxRate > 0 ? input.proposedPriceLocal / fxRate : input.usdReference;

        // ── Guard 1: Minimum Price Floor ────────────────────────────────────

        if (proposedUsd < floorUsd) {
            safePrice = floorUsd * fxRate;
            adjustmentMade = true;
            adjustmentReason = `Price raised to minimum floor: $${floorUsd} USD (${input.localCurrency} ${Math.round(safePrice)})`;
            riskFlag = {
                type: 'below_floor',
                severity: 'high',
                message: `Proposed price $${proposedUsd.toFixed(2)} is below $${floorUsd} floor for ${input.countryCode}`,
                suggestedAction: 'Increase price to meet country floor',
            };
            guards.push({ guard: 'min_price_floor', passed: false, detail: adjustmentReason });
        } else {
            guards.push({ guard: 'min_price_floor', passed: true, detail: `$${proposedUsd.toFixed(2)} ≥ $${floorUsd} floor` });
        }

        // ── Guard 2: Maximum Discount Ceiling ───────────────────────────────

        if (input.usdReference > 0) {
            const discountPct = (input.usdReference - proposedUsd) / input.usdReference;
            if (discountPct > GUARD_CONFIG.maxDiscountPct) {
                safePrice = (input.usdReference * (1 - GUARD_CONFIG.maxDiscountPct)) * fxRate;
                adjustmentMade = true;
                adjustmentReason = `Discount capped at ${GUARD_CONFIG.maxDiscountPct * 100}% (was ${(discountPct * 100).toFixed(0)}%)`;
                riskFlag = {
                    type: 'discount_excessive',
                    severity: 'medium',
                    message: `${(discountPct * 100).toFixed(0)}% discount exceeds ${GUARD_CONFIG.maxDiscountPct * 100}% ceiling`,
                    suggestedAction: 'Reduce discount or get manual approval',
                };
                guards.push({ guard: 'max_discount_ceiling', passed: false, detail: adjustmentReason });
            } else {
                guards.push({
                    guard: 'max_discount_ceiling', passed: true,
                    detail: `${(discountPct * 100).toFixed(0)}% discount within ${GUARD_CONFIG.maxDiscountPct * 100}% ceiling`,
                });
            }
        }

        // ── Guard 3: FX Volatility Buffer ───────────────────────────────────

        if (input.usdReference > 0) {
            const fxDrift = Math.abs(proposedUsd - input.usdReference) / input.usdReference;
            if (fxDrift > GUARD_CONFIG.fxVolatilityBuffer && proposedUsd < input.usdReference) {
                guards.push({
                    guard: 'fx_volatility_buffer', passed: false,
                    detail: `FX drift ${(fxDrift * 100).toFixed(1)}% exceeds ${GUARD_CONFIG.fxVolatilityBuffer * 100}% buffer`,
                });
                if (!riskFlag || riskFlag.severity === 'low') {
                    riskFlag = {
                        type: 'fx_drift', severity: 'medium',
                        message: `FX-adjusted price drifted ${(fxDrift * 100).toFixed(1)}% from reference`,
                        suggestedAction: 'Review FX rates and update pricing',
                    };
                }
            } else {
                guards.push({
                    guard: 'fx_volatility_buffer', passed: true,
                    detail: `FX drift ${(fxDrift * 100).toFixed(1)}% within buffer`,
                });
            }
        }

        // ── Guard 4: Margin Floor Protection ────────────────────────────────

        const estimatedCostUsd = proposedUsd * 0.30; // ~30% platform cost estimate
        const grossMarginPct = proposedUsd > 0
            ? (proposedUsd - estimatedCostUsd) / proposedUsd
            : 0;
        const marginHealthy = grossMarginPct >= GUARD_CONFIG.marginFloorPct;

        if (!marginHealthy) {
            guards.push({
                guard: 'margin_floor', passed: false,
                detail: `Estimated margin ${(grossMarginPct * 100).toFixed(1)}% below ${GUARD_CONFIG.marginFloorPct * 100}% floor`,
            });
            if (!riskFlag) {
                riskFlag = {
                    type: 'below_margin', severity: 'medium',
                    message: `Margin ${(grossMarginPct * 100).toFixed(1)}% below floor`,
                    suggestedAction: 'Increase price or reduce costs',
                };
            }
        } else {
            guards.push({
                guard: 'margin_floor', passed: true,
                detail: `Margin ${(grossMarginPct * 100).toFixed(1)}% above floor`,
            });
        }

        // ── Guard 5: Anti-Dumping (for auction bids) ────────────────────────

        if (input.actionType === 'adgrid_bid' || input.actionType === 'load_boost') {
            const refFloor = input.usdReference * GUARD_CONFIG.antiDumpingFloorPct;
            if (proposedUsd < refFloor && proposedUsd > 0) {
                safePrice = refFloor * fxRate;
                adjustmentMade = true;
                adjustmentReason = `Anti-dumping: bid raised to ${GUARD_CONFIG.antiDumpingFloorPct * 100}% of reference`;
                guards.push({ guard: 'anti_dumping', passed: false, detail: adjustmentReason });
                riskFlag = {
                    type: 'anti_dumping', severity: 'high',
                    message: `Bid $${proposedUsd.toFixed(2)} below anti-dumping floor $${refFloor.toFixed(2)}`,
                    suggestedAction: 'Increase minimum bid or review auction mechanics',
                };
            } else {
                guards.push({ guard: 'anti_dumping', passed: true, detail: 'Bid above anti-dumping floor' });
            }
        }

        // ── Guard 6: Anti-Glitch (price too high) ───────────────────────────

        if (input.usdReference > 0 && proposedUsd > input.usdReference * GUARD_CONFIG.maxMultiplierFromReference) {
            safePrice = input.usdReference * GUARD_CONFIG.maxMultiplierFromReference * fxRate;
            adjustmentMade = true;
            adjustmentReason = `Glitch guard: price capped at ${GUARD_CONFIG.maxMultiplierFromReference}× reference`;
            guards.push({ guard: 'anti_glitch', passed: false, detail: adjustmentReason });
        } else {
            guards.push({ guard: 'anti_glitch', passed: true, detail: 'Price within reasonable range' });
        }

        // Round final price
        safePrice = Math.round(safePrice * 100) / 100;
        const safePriceUsd = fxRate > 0 ? safePrice / fxRate : safePrice;

        // Track anomalies in PostHog
        if (riskFlag && riskFlag.severity === 'high' || riskFlag?.severity === 'critical') {
            HCServerTrack.pricingAnomalyDetected({
                countryCode: input.countryCode,
                corridorId: input.corridorId || 'global',
                anomalyType: riskFlag!.type,
                expectedRate: input.usdReference,
                actualRate: proposedUsd,
                severity: riskFlag!.severity === 'critical' ? 'high' : riskFlag!.severity as 'low' | 'medium' | 'high',
            });
        }

        return {
            safePrice,
            safePriceUsd: Math.round(safePriceUsd * 100) / 100,
            originalPrice: input.proposedPriceLocal,
            currency: input.localCurrency,
            adjustmentMade,
            adjustmentReason,
            riskFlag,
            marginEstimate: {
                grossMarginPct: Math.round(grossMarginPct * 1000) / 1000,
                isHealthy: marginHealthy,
            },
            guards,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANOMALY DETECTION — Run daily by cron
    // ═══════════════════════════════════════════════════════════════════════════

    static detectAnomalies(params: {
        currentArpu: Record<string, number>;   // country → ARPU this period
        previousArpu: Record<string, number>;  // country → ARPU last period
        conversionRates: Record<string, number>; // country → conversion rate
        revenueByCountry: Record<string, number>;
    }): PricingAnomaly[] {
        const anomalies: PricingAnomaly[] = [];

        for (const [country, currentVal] of Object.entries(params.currentArpu)) {
            const previousVal = params.previousArpu[country];
            if (!previousVal || previousVal === 0) continue;

            const dropPct = (previousVal - currentVal) / previousVal;

            // ARPU drop
            if (dropPct > GUARD_CONFIG.arpuDropAlertPct) {
                anomalies.push({
                    countryCode: country,
                    anomalyType: 'arpu_drop',
                    expectedValue: previousVal,
                    actualValue: currentVal,
                    severity: dropPct > 0.30 ? 'high' : 'medium',
                    detectedAt: new Date().toISOString(),
                    message: `ARPU dropped ${(dropPct * 100).toFixed(1)}% in ${country}: $${previousVal.toFixed(2)} → $${currentVal.toFixed(2)}`,
                });
            }
        }

        // Conversion/revenue mismatch
        for (const [country, convRate] of Object.entries(params.conversionRates)) {
            const revenue = params.revenueByCountry[country] || 0;
            const arpu = params.currentArpu[country] || 0;

            // High conversion but low revenue = pricing too low
            if (convRate > 0.20 && arpu < 5) {
                anomalies.push({
                    countryCode: country,
                    anomalyType: 'conversion_spike_low_revenue',
                    expectedValue: 10,
                    actualValue: arpu,
                    severity: 'high',
                    detectedAt: new Date().toISOString(),
                    message: `${country}: ${(convRate * 100).toFixed(0)}% conversion but only $${arpu.toFixed(2)} ARPU — prices likely too low`,
                });
            }
        }

        return anomalies;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONVENIENCE: Validate common monetized actions
    // ═══════════════════════════════════════════════════════════════════════════

    static validateSubscription(priceLocal: number, currency: string, countryCode: string, referenceUsd: number) {
        return this.validate({
            actionType: 'subscription', localCurrency: currency,
            proposedPriceLocal: priceLocal, usdReference: referenceUsd, countryCode,
        });
    }

    static validateMatchFee(priceLocal: number, currency: string, countryCode: string, referenceUsd: number) {
        return this.validate({
            actionType: 'match_fee', localCurrency: currency,
            proposedPriceLocal: priceLocal, usdReference: referenceUsd, countryCode,
        });
    }

    static validateBoostBid(bidLocal: number, currency: string, countryCode: string, referenceUsd: number, corridorId?: string) {
        return this.validate({
            actionType: 'load_boost', localCurrency: currency,
            proposedPriceLocal: bidLocal, usdReference: referenceUsd, countryCode, corridorId,
        });
    }

    static validateDataProduct(priceLocal: number, currency: string, countryCode: string, referenceUsd: number) {
        return this.validate({
            actionType: 'data_product', localCurrency: currency,
            proposedPriceLocal: priceLocal, usdReference: referenceUsd, countryCode,
        });
    }
}
