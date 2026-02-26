import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    calculatePriceBand,
    labelPrice,
    priceLabel,
    priceColor,
    type PriceInputs,
    type PriceBand,
} from '@/lib/pricing/engine';

/**
 * POST /api/pricing/oracle
 *
 * Predictive Load Pricing Oracle
 * Input: load details → Output: recommended price band + fill probability + Carvana grade
 *
 * Country-scoped. Never returns foreign pricing.
 */

interface OracleRequest {
    country_code: string;
    region_code?: string;
    corridor_slug?: string;
    miles_estimate: number;
    load_type: 'PEVO' | 'HEIGHT_POLE' | 'ROUTE_SURVEY' | 'BUCKET_TRUCK' | 'POLICE';
    width_ft?: number;
    height_ft?: number;
    length_ft?: number;
    weight_lbs?: number;
    night_move?: boolean;
    weekend?: boolean;
    urban_heavy?: boolean;
    multi_day?: boolean;
    requires_police?: boolean;
    broker_id?: string;
    posted_price?: number;
}

// Map load types to pricing engine rate types
const LOAD_TYPE_MAP: Record<string, PriceInputs['rateType']> = {
    PEVO: 'pevo',
    HEIGHT_POLE: 'height_pole',
    ROUTE_SURVEY: 'pevo',
    BUCKET_TRUCK: 'pevo',
    POLICE: 'pevo',
};

// Map US region codes to baseline keys
const REGION_MAP: Record<string, string> = {
    FL: 'southeast', GA: 'southeast', AL: 'southeast', SC: 'southeast', NC: 'southeast',
    TN: 'southeast', MS: 'southeast', LA: 'southeast', AR: 'southeast', VA: 'southeast',
    TX: 'southwest', AZ: 'southwest', NM: 'southwest', OK: 'southwest',
    CA: 'west_coast', OR: 'west_coast', WA: 'west_coast', NV: 'west_coast', HI: 'west_coast',
    NY: 'northeast', NJ: 'northeast', PA: 'northeast', CT: 'northeast', MA: 'northeast',
    ME: 'northeast', NH: 'northeast', VT: 'northeast', RI: 'northeast', MD: 'northeast', DE: 'northeast', DC: 'northeast',
    OH: 'midwest', MI: 'midwest', IN: 'midwest', IL: 'midwest', WI: 'midwest',
    MN: 'midwest', IA: 'midwest', MO: 'midwest', KS: 'midwest', NE: 'midwest',
    SD: 'midwest', ND: 'midwest',
    CO: 'southwest', UT: 'southwest', WY: 'southwest', MT: 'southwest', ID: 'southwest',
    WV: 'southeast', KY: 'southeast',
    AK: 'west_coast',
};

export async function POST(req: NextRequest) {
    let body: OracleRequest;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body.country_code || !body.miles_estimate || !body.load_type) {
        return NextResponse.json({ error: 'country_code, miles_estimate, and load_type required' }, { status: 400 });
    }

    // Build complexity modifiers from flags
    const complexityMods: string[] = [];
    if (body.load_type === 'HEIGHT_POLE') complexityMods.push('height_pole');
    if (body.night_move) complexityMods.push('night_move');
    if (body.urban_heavy) complexityMods.push('urban_heavy');
    if (body.multi_day) complexityMods.push('multi_day');
    if (body.requires_police) complexityMods.push('police_required');
    // Superload detection: width > 16ft or weight > 200k lbs
    if ((body.width_ft && body.width_ft > 16) || (body.weight_lbs && body.weight_lbs > 200000)) {
        complexityMods.push('superload');
    }

    // Resolve region key
    let regionKey = 'national';
    if (body.country_code === 'US' && body.region_code) {
        regionKey = REGION_MAP[body.region_code.toUpperCase()] || 'southeast';
    } else if (body.country_code === 'CA') {
        regionKey = 'midwest'; // CA pricing closest to US midwest
    }

    // Determine rate type
    const rateType = LOAD_TYPE_MAP[body.load_type] || 'pevo';

    // Use day rate if miles < 50 (likely a local job)
    const usesDayRate = body.miles_estimate < 50;
    const finalRateType = usesDayRate
        ? (body.load_type === 'HEIGHT_POLE' ? 'day_rate_height' : 'day_rate')
        : rateType;

    const priceInputs: PriceInputs = {
        countryCode: body.country_code,
        regionKey: usesDayRate ? 'national' : regionKey,
        rateType: finalRateType,
        corridorHeatBand: 'balanced', // TODO: lookup from corridor intelligence
        complexityModifiers: complexityMods,
    };

    const band = calculatePriceBand(priceInputs);
    if (!band) {
        return NextResponse.json({
            error: 'Could not calculate pricing — unknown region or rate type',
            debug: { regionKey, rateType: finalRateType },
        }, { status: 422 });
    }

    // Compute per-mile and day-rate equivalents
    const perMileEquiv = band.unit === 'per_mile'
        ? { low: band.recommendedLow, high: band.recommendedHigh }
        : {
            low: Math.round(band.recommendedLow / Math.max(body.miles_estimate, 1) * 100) / 100,
            high: Math.round(band.recommendedHigh / Math.max(body.miles_estimate, 1) * 100) / 100
        };

    const totalEstimate = band.unit === 'per_mile'
        ? { low: Math.round(band.recommendedLow * body.miles_estimate), high: Math.round(band.recommendedHigh * body.miles_estimate) }
        : { low: band.recommendedLow, high: band.recommendedHigh };

    // Fill probability estimate (heuristic v1 — improves with learning loop)
    const fillProbAtTarget = estimateFillProbability(band, body);

    // Grade the posted price if provided
    let postedGrade: { label: string; color: string; fillProb: number } | null = null;
    if (body.posted_price != null) {
        const effectivePrice = band.unit === 'per_mile'
            ? body.posted_price / Math.max(body.miles_estimate, 1)
            : body.posted_price;
        const label = labelPrice(effectivePrice, band);
        postedGrade = {
            label: priceLabel(label),
            color: priceColor(label),
            fillProb: estimateFillProbForPrice(effectivePrice, band),
        };
    }

    // Confidence score (heuristic — improves as pricing_events accumulate)
    const confidence = body.country_code === 'US' || body.country_code === 'CA' ? 0.82 : 0.58;

    // Log pricing event
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        await supabase.from('pricing_events').insert({
            country_code: body.country_code,
            region_code: body.region_code || null,
            corridor_slug: body.corridor_slug || null,
            role: body.broker_id ? 'broker' : 'system',
            event_type: 'draft',
            load_type: body.load_type,
            miles_estimate: body.miles_estimate,
            width_ft: body.width_ft || null,
            height_ft: body.height_ft || null,
            length_ft: body.length_ft || null,
            weight_lbs: body.weight_lbs || null,
            night_move: body.night_move || false,
            weekend: body.weekend || false,
            urban_heavy: body.urban_heavy || false,
            multi_day: body.multi_day || false,
            requires_police: body.requires_police || false,
            suggested_floor: totalEstimate.low,
            suggested_target: Math.round((totalEstimate.low + totalEstimate.high) / 2),
            suggested_ceiling: totalEstimate.high,
            posted_price: body.posted_price || null,
            broker_id: body.broker_id || null,
        });
    } catch {
        // Non-blocking — pricing event logging should never fail the oracle
        console.warn('[pricing/oracle] Failed to log pricing event');
    }

    return NextResponse.json({
        currency: band.currency,
        unit: band.unit,
        recommended: {
            floor: totalEstimate.low,
            target: Math.round((totalEstimate.low + totalEstimate.high) / 2),
            ceiling: totalEstimate.high,
        },
        per_mile: perMileEquiv,
        total_estimate: totalEstimate,
        fill_probability_at_target: fillProbAtTarget,
        confidence,
        confidence_label: confidence >= 0.7 ? 'strong' : confidence >= 0.55 ? 'moderate' : 'early_estimate',
        multipliers: {
            country: band.countryMultiplier,
            heat: band.heatMultiplier,
            complexity: band.complexityMultiplier,
        },
        bands: {
            great_deal: { max: scaleToTotal(band.bands.greatDeal.max, band, body.miles_estimate) },
            fair_market: {
                min: scaleToTotal(band.bands.fairMarket.min, band, body.miles_estimate),
                max: scaleToTotal(band.bands.fairMarket.max, band, body.miles_estimate),
            },
            premium: {
                min: scaleToTotal(band.bands.premium.min, band, body.miles_estimate),
                max: scaleToTotal(band.bands.premium.max, band, body.miles_estimate),
            },
            overpriced: { min: scaleToTotal(band.bands.overpriced.min, band, body.miles_estimate) },
        },
        posted_grade: postedGrade,
        explanation: buildExplanation(body, band, complexityMods, confidence),
    });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function scaleToTotal(rate: number, band: PriceBand, miles: number): number {
    return band.unit === 'per_mile' ? Math.round(rate * miles) : rate;
}

function estimateFillProbability(band: PriceBand, body: OracleRequest): number {
    // Heuristic v1: base 72% for US, adjust by country confidence
    let base = body.country_code === 'US' || body.country_code === 'CA' ? 0.72 : 0.60;
    if (body.night_move) base -= 0.05;
    if (body.urban_heavy) base -= 0.03;
    if (body.multi_day) base += 0.02;
    return Math.min(0.95, Math.max(0.15, base));
}

function estimateFillProbForPrice(price: number, band: PriceBand): number {
    // Higher price = lower fill prob, lower price = higher fill prob
    const mid = (band.recommendedLow + band.recommendedHigh) / 2;
    const ratio = price / mid;
    if (ratio <= 0.9) return 0.88;
    if (ratio <= 1.0) return 0.75;
    if (ratio <= 1.1) return 0.62;
    if (ratio <= 1.2) return 0.45;
    return 0.28;
}

function buildExplanation(
    body: OracleRequest,
    band: PriceBand,
    mods: string[],
    confidence: number,
): string[] {
    const bullets: string[] = [];
    bullets.push(`Based on ${body.country_code} market rates for ${body.load_type}`);
    if (band.countryMultiplier !== 1.0) {
        bullets.push(`Country adjustment: ${band.countryMultiplier > 1 ? '+' : ''}${Math.round((band.countryMultiplier - 1) * 100)}%`);
    }
    if (band.heatMultiplier !== 1.0) {
        bullets.push(`Corridor heat: ${band.heatMultiplier > 1 ? '+' : ''}${Math.round((band.heatMultiplier - 1) * 100)}%`);
    }
    if (mods.length > 0) {
        bullets.push(`Complexity: ${mods.join(', ')}`);
    }
    if (confidence < 0.65) {
        bullets.push('Early market estimate — wider range expected');
    }
    return bullets;
}
