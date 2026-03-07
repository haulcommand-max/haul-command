// ══════════════════════════════════════════════════════════════
// INSTANT QUOTE ENGINE (RFQ Automator)
// 10x Move #4: Broker enters dimensions + route → instant
//              escort quote with coverage confidence
//
// WHY 10x: This is the TRANSACTION LAYER. Every other module
//          builds authority. This one captures revenue.
//          "Get a quote in 30 seconds" beats calling 5 escort
//          companies and waiting 2 days. This is the moat
//          that converts traffic into money.
// ══════════════════════════════════════════════════════════════

export interface QuoteRequest {
    requestId: string;
    /** Who */
    requesterType: "broker" | "carrier" | "shipper" | "self";
    requesterName?: string;
    requesterEmail?: string;
    requesterPhone?: string;

    /** What */
    loadDimensions: {
        widthM: number;
        heightM: number;
        lengthM: number;
        weightT: number;
    };
    loadDescription: string;
    loadType?: string; // transformer, wind blade, manufactured home, etc.

    /** Where */
    origin: string;
    originState: string;
    originCountry: string;
    destination: string;
    destinationState: string;
    destinationCountry: string;
    statesCrossed?: string[];

    /** When */
    preferredDate: string; // ISO date
    flexibility: "exact" | "plus_minus_1_day" | "plus_minus_3_days" | "flexible";
    urgency: "emergency" | "standard" | "planned";
}

export interface InstantQuote {
    quoteId: string;
    requestId: string;
    timestamp: string;

    /** Route analysis */
    routeSummary: {
        totalDistanceKm: number;
        statesCrossed: number;
        estimatedTransitDays: number;
    };

    /** Escort requirements */
    escortRequirements: {
        minEscortsNeeded: number;
        maxEscortsNeeded: number;
        escortType: "civil" | "police_required" | "both";
        certificationRequired: boolean;
        certificationDetails?: string;
    };

    /** Pricing */
    pricing: QuotePricing;

    /** Coverage */
    coverage: {
        overallConfidence: number; // 0-100
        matchedOperators: number;
        avgResponseTimeHours: number;
        shortageWarning: boolean;
        shortageReason?: string;
    };

    /** Permits */
    permits: {
        count: number;
        estimatedCost: number;
        leadTimeDays: number;
        authorities: string[];
    };

    /** Warnings */
    warnings: string[];

    /** CTA */
    callToAction: string;
    ctaUrl: string;
}

export interface QuotePricing {
    /** Escort cost */
    escortLow: number;
    escortHigh: number;
    escortBasis: string; // "per day", "per mile", etc.

    /** Permit cost */
    permitEstimate: number;

    /** Total estimate */
    totalLow: number;
    totalHigh: number;

    /** Currency */
    currency: string;

    /** Rate context */
    seasonalAdjustment: "surge" | "peak" | "normal" | "off_peak";
    seasonalNote: string;
}

// ── Rate Tables ──

interface RegionRate {
    countries: string[];
    dailyRateLow: number;
    dailyRateHigh: number;
    perMileLow: number;
    perMileHigh: number;
    currency: string;
}

const REGION_RATES: RegionRate[] = [
    { countries: ["US"], dailyRateLow: 400, dailyRateHigh: 800, perMileLow: 1.50, perMileHigh: 3.00, currency: "USD" },
    { countries: ["CA"], dailyRateLow: 450, dailyRateHigh: 900, perMileLow: 1.75, perMileHigh: 3.50, currency: "CAD" },
    { countries: ["AU"], dailyRateLow: 500, dailyRateHigh: 1000, perMileLow: 2.00, perMileHigh: 4.00, currency: "AUD" },
    { countries: ["GB"], dailyRateLow: 350, dailyRateHigh: 700, perMileLow: 1.50, perMileHigh: 3.00, currency: "GBP" },
    { countries: ["NZ"], dailyRateLow: 450, dailyRateHigh: 850, perMileLow: 1.75, perMileHigh: 3.50, currency: "NZD" },
    { countries: ["ZA"], dailyRateLow: 3500, dailyRateHigh: 7000, perMileLow: 15, perMileHigh: 30, currency: "ZAR" },
    { countries: ["DE", "AT", "CH"], dailyRateLow: 400, dailyRateHigh: 900, perMileLow: 2.00, perMileHigh: 4.00, currency: "EUR" },
    { countries: ["NL", "BE"], dailyRateLow: 400, dailyRateHigh: 800, perMileLow: 2.00, perMileHigh: 3.50, currency: "EUR" },
    { countries: ["FR", "ES", "IT", "PT"], dailyRateLow: 350, dailyRateHigh: 750, perMileLow: 1.75, perMileHigh: 3.00, currency: "EUR" },
    { countries: ["SE", "NO", "DK", "FI"], dailyRateLow: 450, dailyRateHigh: 950, perMileLow: 2.00, perMileHigh: 4.00, currency: "EUR" },
    { countries: ["IE"], dailyRateLow: 400, dailyRateHigh: 800, perMileLow: 1.75, perMileHigh: 3.00, currency: "EUR" },
    { countries: ["AE", "SA", "QA", "KW", "OM", "BH"], dailyRateLow: 1500, dailyRateHigh: 3500, perMileLow: 6, perMileHigh: 15, currency: "AED" },
    { countries: ["BR"], dailyRateLow: 1500, dailyRateHigh: 3500, perMileLow: 5, perMileHigh: 12, currency: "BRL" },
    { countries: ["MX"], dailyRateLow: 5000, dailyRateHigh: 12000, perMileLow: 20, perMileHigh: 50, currency: "MXN" },
    { countries: ["JP"], dailyRateLow: 50000, dailyRateHigh: 120000, perMileLow: 200, perMileHigh: 500, currency: "JPY" },
    { countries: ["KR"], dailyRateLow: 400000, dailyRateHigh: 900000, perMileLow: 1600, perMileHigh: 4000, currency: "KRW" },
    { countries: ["SG", "MY"], dailyRateLow: 500, dailyRateHigh: 1200, perMileLow: 2, perMileHigh: 5, currency: "SGD" },
    { countries: ["CL", "AR", "CO", "PE", "UY", "PA", "CR"], dailyRateLow: 300, dailyRateHigh: 700, perMileLow: 1.50, perMileHigh: 3.00, currency: "USD" },
    { countries: ["PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR"], dailyRateLow: 250, dailyRateHigh: 600, perMileLow: 1.25, perMileHigh: 2.50, currency: "EUR" },
    { countries: ["TR"], dailyRateLow: 5000, dailyRateHigh: 15000, perMileLow: 20, perMileHigh: 60, currency: "TRY" },
];

function getRateForCountry(country: string): RegionRate {
    return REGION_RATES.find(r => r.countries.includes(country)) ??
        { countries: [country], dailyRateLow: 400, dailyRateHigh: 800, perMileLow: 1.50, perMileHigh: 3.00, currency: "USD" };
}

// ── Quote Generator ──

export function generateInstantQuote(request: QuoteRequest): InstantQuote {
    const rate = getRateForCountry(request.originCountry);
    const stateCount = request.statesCrossed?.length ?? 2;

    // Rough distance estimate: 300km per state crossed
    const estimatedDistance = stateCount * 300;
    const transitDays = Math.max(1, Math.ceil(estimatedDistance / 800)); // ~800km/day

    // Escort requirements — simplified calc
    let minEscorts = 0;
    let maxEscorts = 0;
    let escortType: InstantQuote["escortRequirements"]["escortType"] = "civil";

    if (request.loadDimensions.widthM > 4.27) {
        minEscorts = 2; maxEscorts = 2;
    } else if (request.loadDimensions.widthM > 3.66 ||
        request.loadDimensions.heightM > 4.42 ||
        request.loadDimensions.lengthM > 24.4) {
        minEscorts = 1; maxEscorts = 2;
    }

    if (request.loadDimensions.widthM > 4.88) {
        escortType = "both"; // police may be required
    }

    // Pricing
    const seasonalMultiplier = request.urgency === "emergency" ? 1.5 : 1.0;
    const escortDailyCostLow = rate.dailyRateLow * maxEscorts * transitDays * seasonalMultiplier;
    const escortDailyCostHigh = rate.dailyRateHigh * maxEscorts * transitDays * seasonalMultiplier;
    const permitCost = stateCount * 30; // rough average
    const totalLow = escortDailyCostLow + permitCost;
    const totalHigh = escortDailyCostHigh + permitCost;

    const warnings: string[] = [];
    if (maxEscorts >= 2) warnings.push("Two escorts required — book both simultaneously to avoid scheduling gaps");
    if (escortType === "both") warnings.push("Police escort likely required for this load width — additional fees apply");
    if (request.urgency === "emergency") warnings.push("Emergency pricing applies — 1.5x standard rates");
    if (transitDays > 3) warnings.push(`Multi-day trip (${transitDays} days) — confirm overnight parking locations`);

    // Coverage confidence (would be real-time from operator DB)
    const confidence = request.originCountry === "US" ? 72 : 55;

    return {
        quoteId: `Q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        requestId: request.requestId,
        timestamp: new Date().toISOString(),
        routeSummary: {
            totalDistanceKm: estimatedDistance,
            statesCrossed: stateCount,
            estimatedTransitDays: transitDays,
        },
        escortRequirements: {
            minEscortsNeeded: minEscorts,
            maxEscortsNeeded: maxEscorts,
            escortType,
            certificationRequired: request.originCountry === "US" || request.originCountry === "DE" || request.originCountry === "CA",
            certificationDetails: request.originCountry === "US" ? "State-specific certification may be required" : undefined,
        },
        pricing: {
            escortLow: Math.round(escortDailyCostLow),
            escortHigh: Math.round(escortDailyCostHigh),
            escortBasis: `${maxEscorts} escort(s) × ${transitDays} day(s)`,
            permitEstimate: permitCost,
            totalLow: Math.round(totalLow),
            totalHigh: Math.round(totalHigh),
            currency: rate.currency,
            seasonalAdjustment: request.urgency === "emergency" ? "surge" : "normal",
            seasonalNote: request.urgency === "emergency"
                ? "Emergency premium: 1.5x standard rates"
                : "Standard seasonal rates",
        },
        coverage: {
            overallConfidence: confidence,
            matchedOperators: Math.floor(confidence / 10),
            avgResponseTimeHours: request.urgency === "emergency" ? 1 : 4,
            shortageWarning: confidence < 50,
            shortageReason: confidence < 50 ? "Limited escort availability in this region" : undefined,
        },
        permits: {
            count: stateCount,
            estimatedCost: permitCost,
            leadTimeDays: request.urgency === "emergency" ? 1 : 5,
            authorities: request.statesCrossed?.map(s => `${s} DOT`) ?? [`${request.originState} DOT`],
        },
        warnings,
        callToAction: maxEscorts > 0
            ? `Get matched with ${maxEscorts} certified escort(s) on this route`
            : "Your load may not require escorts — verify with a permit specialist",
        ctaUrl: `/quote/${request.requestId}`,
    };
}

// ── Voice Answer for Pricing Queries ──

export function generatePricingVoiceAnswer(
    country: string,
    widthM: number
): string {
    const rate = getRateForCountry(country);
    const escorts = widthM > 4.27 ? 2 : widthM > 3.66 ? 1 : 0;
    if (escorts === 0) {
        return `For a load ${widthM} meters wide, you may not need a pilot car in most jurisdictions. Check local regulations for your specific route.`;
    }
    return `A pilot car for a ${widthM}-meter wide load typically costs ${rate.dailyRateLow} to ${rate.dailyRateHigh} ${rate.currency} per day. You'll need ${escorts} escort vehicle${escorts > 1 ? "s" : ""}. Get an instant quote on Haul Command for your exact route.`;
}

// ── SEO: Quote Landing Pages ──

export function generateQuoteLandingPages(
    origins: string[],
    destinations: string[]
): { url: string; title: string; metaDescription: string }[] {
    const pages: { url: string; title: string; metaDescription: string }[] = [];
    for (const origin of origins) {
        for (const dest of destinations) {
            if (origin !== dest) {
                const oSlug = origin.toLowerCase().replace(/[\s,]+/g, "-");
                const dSlug = dest.toLowerCase().replace(/[\s,]+/g, "-");
                pages.push({
                    url: `/quote/${oSlug}-to-${dSlug}`,
                    title: `Pilot Car Quote: ${origin} to ${dest} | Haul Command`,
                    metaDescription: `Get an instant pilot car quote for ${origin} to ${dest}. See escort requirements, permit costs, and coverage availability in 30 seconds.`,
                });
            }
        }
    }
    return pages;
}
