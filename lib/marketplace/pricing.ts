// lib/marketplace/pricing.ts
//
// Pricing Integration for Escort Marketplace
// Computes suggested rates using base rates, surge, distance, and special requirements.
// Includes fairness guardrails.

export interface PricingInput {
    country_code: string;
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    load_type_tags: string[];
    special_requirements: string[];
    surge_multiplier: number;
    corridor_surge_multiplier?: number;
    escort_count: number;
}

export interface PricingOutput {
    suggested_rate_per_escort: number;
    suggested_rate_total: number;
    currency: string;
    breakdown: {
        base_rate: number;
        distance_factor: number;
        surge_factor: number;
        special_requirement_factor: number;
        per_escort_rate: number;
    };
    fairness: {
        capped: boolean;
        cap_reason?: string;
        absolute_max_multiplier: number;
    };
}

// ============================================================
// BASE RATES BY COUNTRY (USD equivalent per day)
// ============================================================

const BASE_RATES: Record<string, number> = {
    US: 450,
    CA: 400,
    AU: 500,
    GB: 480,
    NZ: 420,
    IE: 460,
    NL: 470,
    DE: 490,
    AE: 550,
    ZA: 280,
    SG: 520,
    MX: 250,
    BR: 220,
    FR: 470,
    ES: 380,
    IT: 400,
    JP: 600,
    KR: 500,
    IN: 180,
    ID: 150,
    TH: 200,
    VN: 140,
    PH: 160,
    // Fallback
    DEFAULT: 400,
};

const CURRENCY_MAP: Record<string, string> = {
    US: "USD", CA: "CAD", AU: "AUD", GB: "GBP", NZ: "NZD",
    IE: "EUR", NL: "EUR", DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR",
    AE: "AED", ZA: "ZAR", SG: "SGD", MX: "MXN", BR: "BRL",
    JP: "JPY", KR: "KRW", IN: "INR", ID: "IDR", TH: "THB",
    VN: "VND", PH: "PHP",
    DEFAULT: "USD",
};

// ============================================================
// SPECIAL REQUIREMENT MULTIPLIERS
// ============================================================

const SPECIAL_REQ_MULTIPLIERS: Record<string, number> = {
    night_move: 0.25,
    police: 0.15,
    route_survey: 0.30,
    height_pole: 0.10,
    wide_load: 0.15,
    superload: 0.40,
    multi_day: 0.20,
    weekend: 0.15,
    holiday: 0.30,
};

// ============================================================
// DISTANCE FACTOR
// ============================================================

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeDistanceFactor(distKm: number): number {
    // Base rate covers ~160km (100mi). Beyond that, scale up.
    if (distKm <= 160) return 1.0;
    if (distKm <= 400) return 1.0 + (distKm - 160) * 0.002;
    if (distKm <= 800) return 1.48 + (distKm - 400) * 0.0015;
    return Math.min(3.0, 2.08 + (distKm - 800) * 0.001); // cap at 3×
}

// ============================================================
// FAIRNESS GUARDRAILS
// ============================================================

const ABSOLUTE_MAX_MULTIPLIER = 3.5; // never more than 3.5× base rate total

// ============================================================
// COMPUTE PRICING
// ============================================================

export function computePricing(input: PricingInput): PricingOutput {
    const baseRate = BASE_RATES[input.country_code] ?? BASE_RATES.DEFAULT;
    const currency = CURRENCY_MAP[input.country_code] ?? CURRENCY_MAP.DEFAULT;

    // Distance
    const distKm = haversineKm(
        input.origin_lat, input.origin_lon,
        input.destination_lat, input.destination_lon
    );
    const distanceFactor = computeDistanceFactor(distKm);

    // Surge (take the max of general and corridor-specific)
    const surgeFactor = Math.max(input.surge_multiplier, input.corridor_surge_multiplier ?? 1.0);

    // Special requirements
    let specialReqFactor = 0;
    for (const req of input.special_requirements) {
        specialReqFactor += SPECIAL_REQ_MULTIPLIERS[req] ?? 0;
    }

    // Compute per-escort rate
    let perEscortRate = baseRate * surgeFactor * (1 + specialReqFactor) * distanceFactor;

    // Fairness cap
    let capped = false;
    let capReason: string | undefined;
    const effectiveMultiplier = perEscortRate / baseRate;

    if (effectiveMultiplier > ABSOLUTE_MAX_MULTIPLIER) {
        perEscortRate = baseRate * ABSOLUTE_MAX_MULTIPLIER;
        capped = true;
        capReason = `Rate capped at ${ABSOLUTE_MAX_MULTIPLIER}× base (${currency} ${baseRate}). Effective multiplier was ${effectiveMultiplier.toFixed(2)}×.`;
    }

    perEscortRate = Number(perEscortRate.toFixed(2));
    const totalRate = Number((perEscortRate * input.escort_count).toFixed(2));

    return {
        suggested_rate_per_escort: perEscortRate,
        suggested_rate_total: totalRate,
        currency,
        breakdown: {
            base_rate: baseRate,
            distance_factor: Number(distanceFactor.toFixed(4)),
            surge_factor: Number(surgeFactor.toFixed(4)),
            special_requirement_factor: Number(specialReqFactor.toFixed(4)),
            per_escort_rate: perEscortRate,
        },
        fairness: {
            capped,
            cap_reason: capReason,
            absolute_max_multiplier: ABSOLUTE_MAX_MULTIPLIER,
        },
    };
}
