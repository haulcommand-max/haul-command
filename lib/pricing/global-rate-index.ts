// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL RATE INDEX ENGINE — Carvana-Style Price Intelligence
// "Is this price GREAT, GOOD, FAIR, HIGH, or OVERPRICED?"
//
// Covers ALL 52 countries × service types × corridor segments
// Updated by cron; queryable by any surface (directory, load board, map, API)
//
// Inspired by:
//   - Carvana's "Great Price / Good Price / Fair / Above" badges
//   - Zillow's Zestimate confidence bands
//   - Kayak's price prediction (will prices go up or down?)
//
// Architecture:
//   1. RATE BASELINES — per country × service × unit (historical + seasonal)
//   2. LIVE RATE INDEX — current rate vs. baseline → score -1 to +1
//   3. TREND PREDICTION — is the rate going up, down, or stable?
//   4. BADGE ENGINE — assigns human-readable badge per rate
//   5. COMPARISON SURFACE — "You're paying 12% below market" messaging
//   6. ALERT ENGINE — "Rates dropped 8% in your corridor this week"
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type RatingBadge = 'great_price' | 'good_price' | 'fair_price' | 'above_market' | 'overpriced';
export type TrendDirection = 'falling' | 'stable' | 'rising';
export type ServiceType = 'escort_lead' | 'escort_follow' | 'escort_oversize'
    | 'escort_superload' | 'route_survey' | 'height_pole' | 'pilot_car_general';
export type RateUnit = 'per_mile' | 'per_km' | 'per_day' | 'per_hour' | 'flat_rate';

export interface CountryRateBaseline {
    countryCode: string;
    currency: string;
    serviceType: ServiceType;
    unit: RateUnit;
    // Statistical baseline (rolling 90-day window)
    p10: number;      // 10th percentile — "great deal" floor
    p25: number;      // 25th percentile — "good" floor
    p50: number;      // median — "fair" anchor
    p75: number;      // 75th percentile — "above market" floor
    p90: number;      // 90th percentile — "overpriced" threshold
    mean: number;
    stdDev: number;
    sampleSize: number;
    // Seasonal adjustment
    seasonalMultiplier: number;  // 1.0 = normal, 1.15 = 15% above avg for this quarter
    // Freshness
    lastComputedAt: string;      // ISO timestamp
    dataWindowDays: number;      // typically 90
}

export interface RateIndexResult {
    countryCode: string;
    currency: string;
    serviceType: ServiceType;
    unit: RateUnit;
    // The query
    queryRate: number;
    // Index score: -1.0 (way below market) to +1.0 (way above market)
    // 0.0 = exactly at market median
    indexScore: number;
    // Human badge
    badge: RatingBadge;
    badgeLabel: string;
    badgeColor: string;  // hex
    badgeEmoji: string;
    // Percentile position
    percentilePosition: number; // 0-100 (where this rate falls in the distribution)
    // Comparison messaging
    comparisonText: string;       // "12% below market average"
    savingsOrPremiumAmount: number; // absolute difference from median
    savingsOrPremiumPercent: number;
    // Trend
    trend: TrendDirection;
    trendLabel: string;
    trendDelta7d: number;    // % change over last 7 days
    trendDelta30d: number;   // % change over last 30 days
    // Confidence
    confidence: 'high' | 'medium' | 'low';
    sampleSize: number;
}

export interface RateAlert {
    countryCode: string;
    corridorId?: string;
    serviceType: ServiceType;
    alertType: 'rate_drop' | 'rate_spike' | 'new_low' | 'seasonal_shift' | 'market_correction';
    message: string;
    changePercent: number;
    previousRate: number;
    currentRate: number;
    currency: string;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL 52 COUNTRIES — BASE RATE TABLE (USD-equivalent per day, pilot car/escort)
//
// Sources: marketplace data, regulatory filings, operator surveys, competitor scrapes
// Updated: Q1 2026
// ═══════════════════════════════════════════════════════════════════════════════

export const COUNTRY_RATE_TABLE: Record<string, {
    currency: string;
    baseDayRate: number;     // local currency
    baseDayRateUsd: number;  // USD equivalent
    perMileRate: number;     // local currency per mile/km
    perMileUnit: 'mile' | 'km';
    minimumCharge: number;   // local currency
    seasonalPeakMonths: number[];
    seasonalMultiplier: number;
    nightSurcharge: number;  // multiplier (1.25 = 25% extra)
    weekendSurcharge: number;
    holidaySurcharge: number;
    superloadMultiplier: number;
    routeSurveyFlatRate: number;  // local currency
}> = {
    // ═══ GOLD TIER ═══
    US: { currency: 'USD', baseDayRate: 450, baseDayRateUsd: 450, perMileRate: 1.75, perMileUnit: 'mile', minimumCharge: 250, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.20, nightSurcharge: 1.25, weekendSurcharge: 1.15, holidaySurcharge: 1.35, superloadMultiplier: 2.0, routeSurveyFlatRate: 350 },
    CA: { currency: 'CAD', baseDayRate: 580, baseDayRateUsd: 425, perMileRate: 2.85, perMileUnit: 'km', minimumCharge: 325, seasonalPeakMonths: [5, 6, 7, 8, 9], seasonalMultiplier: 1.15, nightSurcharge: 1.30, weekendSurcharge: 1.15, holidaySurcharge: 1.30, superloadMultiplier: 1.85, routeSurveyFlatRate: 450 },
    AU: { currency: 'AUD', baseDayRate: 750, baseDayRateUsd: 490, perMileRate: 3.20, perMileUnit: 'km', minimumCharge: 400, seasonalPeakMonths: [9, 10, 11, 12, 1, 2], seasonalMultiplier: 1.18, nightSurcharge: 1.30, weekendSurcharge: 1.20, holidaySurcharge: 1.40, superloadMultiplier: 2.2, routeSurveyFlatRate: 550 },
    GB: { currency: 'GBP', baseDayRate: 380, baseDayRateUsd: 480, perMileRate: 2.50, perMileUnit: 'mile', minimumCharge: 200, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.12, nightSurcharge: 1.25, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 1.9, routeSurveyFlatRate: 280 },
    NZ: { currency: 'NZD', baseDayRate: 680, baseDayRateUsd: 410, perMileRate: 3.00, perMileUnit: 'km', minimumCharge: 350, seasonalPeakMonths: [10, 11, 12, 1, 2], seasonalMultiplier: 1.15, nightSurcharge: 1.25, weekendSurcharge: 1.15, holidaySurcharge: 1.30, superloadMultiplier: 2.0, routeSurveyFlatRate: 480 },
    ZA: { currency: 'ZAR', baseDayRate: 5200, baseDayRateUsd: 280, perMileRate: 18.50, perMileUnit: 'km', minimumCharge: 2800, seasonalPeakMonths: [1, 2, 3, 10, 11], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 3500 },
    DE: { currency: 'EUR', baseDayRate: 420, baseDayRateUsd: 460, perMileRate: 2.80, perMileUnit: 'km', minimumCharge: 250, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.30, weekendSurcharge: 1.25, holidaySurcharge: 1.40, superloadMultiplier: 2.0, routeSurveyFlatRate: 320 },
    NL: { currency: 'EUR', baseDayRate: 430, baseDayRateUsd: 470, perMileRate: 2.90, perMileUnit: 'km', minimumCharge: 260, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.25, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 1.9, routeSurveyFlatRate: 330 },
    AE: { currency: 'AED', baseDayRate: 2000, baseDayRateUsd: 545, perMileRate: 8.50, perMileUnit: 'km', minimumCharge: 1200, seasonalPeakMonths: [10, 11, 12, 1, 2, 3], seasonalMultiplier: 1.25, nightSurcharge: 1.15, weekendSurcharge: 1.05, holidaySurcharge: 1.20, superloadMultiplier: 2.5, routeSurveyFlatRate: 1500 },
    BR: { currency: 'BRL', baseDayRate: 1100, baseDayRateUsd: 220, perMileRate: 4.50, perMileUnit: 'km', minimumCharge: 580, seasonalPeakMonths: [3, 4, 5, 8, 9, 10], seasonalMultiplier: 1.12, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 750 },

    // ═══ BLUE TIER ═══
    IE: { currency: 'EUR', baseDayRate: 400, baseDayRateUsd: 440, perMileRate: 2.70, perMileUnit: 'km', minimumCharge: 230, seasonalPeakMonths: [4, 5, 6, 9], seasonalMultiplier: 1.10, nightSurcharge: 1.25, weekendSurcharge: 1.15, holidaySurcharge: 1.30, superloadMultiplier: 1.8, routeSurveyFlatRate: 300 },
    SE: { currency: 'SEK', baseDayRate: 4800, baseDayRateUsd: 460, perMileRate: 32, perMileUnit: 'km', minimumCharge: 2800, seasonalPeakMonths: [5, 6, 7, 8], seasonalMultiplier: 1.15, nightSurcharge: 1.30, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 2.0, routeSurveyFlatRate: 3500 },
    NO: { currency: 'NOK', baseDayRate: 5200, baseDayRateUsd: 490, perMileRate: 35, perMileUnit: 'km', minimumCharge: 3000, seasonalPeakMonths: [5, 6, 7, 8], seasonalMultiplier: 1.18, nightSurcharge: 1.35, weekendSurcharge: 1.25, holidaySurcharge: 1.40, superloadMultiplier: 2.2, routeSurveyFlatRate: 3800 },
    DK: { currency: 'DKK', baseDayRate: 3400, baseDayRateUsd: 480, perMileRate: 22, perMileUnit: 'km', minimumCharge: 2000, seasonalPeakMonths: [4, 5, 6, 9], seasonalMultiplier: 1.10, nightSurcharge: 1.25, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 1.9, routeSurveyFlatRate: 2500 },
    FI: { currency: 'EUR', baseDayRate: 410, baseDayRateUsd: 450, perMileRate: 2.75, perMileUnit: 'km', minimumCharge: 240, seasonalPeakMonths: [5, 6, 7, 8], seasonalMultiplier: 1.12, nightSurcharge: 1.30, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 2.0, routeSurveyFlatRate: 310 },
    BE: { currency: 'EUR', baseDayRate: 400, baseDayRateUsd: 440, perMileRate: 2.75, perMileUnit: 'km', minimumCharge: 235, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.25, weekendSurcharge: 1.15, holidaySurcharge: 1.30, superloadMultiplier: 1.8, routeSurveyFlatRate: 300 },
    AT: { currency: 'EUR', baseDayRate: 410, baseDayRateUsd: 450, perMileRate: 2.80, perMileUnit: 'km', minimumCharge: 240, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.25, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 1.9, routeSurveyFlatRate: 310 },
    CH: { currency: 'CHF', baseDayRate: 520, baseDayRateUsd: 580, perMileRate: 3.50, perMileUnit: 'km', minimumCharge: 320, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.30, weekendSurcharge: 1.25, holidaySurcharge: 1.40, superloadMultiplier: 2.2, routeSurveyFlatRate: 400 },
    ES: { currency: 'EUR', baseDayRate: 340, baseDayRateUsd: 375, perMileRate: 2.30, perMileUnit: 'km', minimumCharge: 190, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 260 },
    FR: { currency: 'EUR', baseDayRate: 400, baseDayRateUsd: 440, perMileRate: 2.70, perMileUnit: 'km', minimumCharge: 230, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.25, weekendSurcharge: 1.20, holidaySurcharge: 1.35, superloadMultiplier: 1.9, routeSurveyFlatRate: 310 },
    IT: { currency: 'EUR', baseDayRate: 360, baseDayRateUsd: 395, perMileRate: 2.40, perMileUnit: 'km', minimumCharge: 200, seasonalPeakMonths: [3, 4, 5, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 270 },
    PT: { currency: 'EUR', baseDayRate: 310, baseDayRateUsd: 340, perMileRate: 2.10, perMileUnit: 'km', minimumCharge: 175, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 240 },
    SA: { currency: 'SAR', baseDayRate: 1800, baseDayRateUsd: 480, perMileRate: 7.50, perMileUnit: 'km', minimumCharge: 1000, seasonalPeakMonths: [10, 11, 12, 1, 2, 3], seasonalMultiplier: 1.20, nightSurcharge: 1.15, weekendSurcharge: 1.05, holidaySurcharge: 1.20, superloadMultiplier: 2.3, routeSurveyFlatRate: 1300 },
    QA: { currency: 'QAR', baseDayRate: 1900, baseDayRateUsd: 520, perMileRate: 8.00, perMileUnit: 'km', minimumCharge: 1100, seasonalPeakMonths: [10, 11, 12, 1, 2, 3], seasonalMultiplier: 1.22, nightSurcharge: 1.15, weekendSurcharge: 1.05, holidaySurcharge: 1.20, superloadMultiplier: 2.4, routeSurveyFlatRate: 1400 },
    MX: { currency: 'MXN', baseDayRate: 4300, baseDayRateUsd: 250, perMileRate: 18, perMileUnit: 'km', minimumCharge: 2400, seasonalPeakMonths: [1, 2, 3, 10, 11, 12], seasonalMultiplier: 1.12, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 2800 },

    // ═══ SILVER TIER ═══
    PL: { currency: 'PLN', baseDayRate: 1400, baseDayRateUsd: 350, perMileRate: 6, perMileUnit: 'km', minimumCharge: 750, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 900 },
    CZ: { currency: 'CZK', baseDayRate: 8500, baseDayRateUsd: 370, perMileRate: 36, perMileUnit: 'km', minimumCharge: 4500, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 5500 },
    SK: { currency: 'EUR', baseDayRate: 320, baseDayRateUsd: 350, perMileRate: 2.10, perMileUnit: 'km', minimumCharge: 180, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 240 },
    HU: { currency: 'HUF', baseDayRate: 125000, baseDayRateUsd: 340, perMileRate: 520, perMileUnit: 'km', minimumCharge: 65000, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 82000 },
    SI: { currency: 'EUR', baseDayRate: 340, baseDayRateUsd: 375, perMileRate: 2.30, perMileUnit: 'km', minimumCharge: 190, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 260 },
    EE: { currency: 'EUR', baseDayRate: 310, baseDayRateUsd: 340, perMileRate: 2.10, perMileUnit: 'km', minimumCharge: 175, seasonalPeakMonths: [5, 6, 7, 8], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 230 },
    LV: { currency: 'EUR', baseDayRate: 300, baseDayRateUsd: 330, perMileRate: 2.00, perMileUnit: 'km', minimumCharge: 170, seasonalPeakMonths: [5, 6, 7, 8], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 220 },
    LT: { currency: 'EUR', baseDayRate: 290, baseDayRateUsd: 320, perMileRate: 1.95, perMileUnit: 'km', minimumCharge: 160, seasonalPeakMonths: [5, 6, 7, 8], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.5, routeSurveyFlatRate: 210 },
    HR: { currency: 'EUR', baseDayRate: 310, baseDayRateUsd: 340, perMileRate: 2.05, perMileUnit: 'km', minimumCharge: 175, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 230 },
    RO: { currency: 'RON', baseDayRate: 1500, baseDayRateUsd: 320, perMileRate: 6.30, perMileUnit: 'km', minimumCharge: 800, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 960 },
    BG: { currency: 'BGN', baseDayRate: 560, baseDayRateUsd: 310, perMileRate: 2.35, perMileUnit: 'km', minimumCharge: 300, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.5, routeSurveyFlatRate: 360 },
    GR: { currency: 'EUR', baseDayRate: 310, baseDayRateUsd: 340, perMileRate: 2.05, perMileUnit: 'km', minimumCharge: 175, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.08, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.6, routeSurveyFlatRate: 230 },
    TR: { currency: 'TRY', baseDayRate: 8500, baseDayRateUsd: 280, perMileRate: 36, perMileUnit: 'km', minimumCharge: 4500, seasonalPeakMonths: [4, 5, 6, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 5500 },
    KW: { currency: 'KWD', baseDayRate: 140, baseDayRateUsd: 460, perMileRate: 0.60, perMileUnit: 'km', minimumCharge: 80, seasonalPeakMonths: [10, 11, 12, 1, 2, 3], seasonalMultiplier: 1.15, nightSurcharge: 1.15, weekendSurcharge: 1.05, holidaySurcharge: 1.20, superloadMultiplier: 2.0, routeSurveyFlatRate: 100 },
    OM: { currency: 'OMR', baseDayRate: 170, baseDayRateUsd: 440, perMileRate: 0.70, perMileUnit: 'km', minimumCharge: 95, seasonalPeakMonths: [10, 11, 12, 1, 2, 3], seasonalMultiplier: 1.15, nightSurcharge: 1.15, weekendSurcharge: 1.05, holidaySurcharge: 1.20, superloadMultiplier: 2.0, routeSurveyFlatRate: 120 },
    BH: { currency: 'BHD', baseDayRate: 165, baseDayRateUsd: 440, perMileRate: 0.70, perMileUnit: 'km', minimumCharge: 90, seasonalPeakMonths: [10, 11, 12, 1, 2, 3], seasonalMultiplier: 1.15, nightSurcharge: 1.15, weekendSurcharge: 1.05, holidaySurcharge: 1.20, superloadMultiplier: 2.0, routeSurveyFlatRate: 115 },
    SG: { currency: 'SGD', baseDayRate: 700, baseDayRateUsd: 520, perMileRate: 3.00, perMileUnit: 'km', minimumCharge: 380, seasonalPeakMonths: [1, 2, 11, 12], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 2.0, routeSurveyFlatRate: 480 },
    MY: { currency: 'MYR', baseDayRate: 1400, baseDayRateUsd: 310, perMileRate: 6, perMileUnit: 'km', minimumCharge: 750, seasonalPeakMonths: [1, 2, 11, 12], seasonalMultiplier: 1.08, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.6, routeSurveyFlatRate: 900 },
    JP: { currency: 'JPY', baseDayRate: 85000, baseDayRateUsd: 580, perMileRate: 360, perMileUnit: 'km', minimumCharge: 45000, seasonalPeakMonths: [3, 4, 9, 10], seasonalMultiplier: 1.12, nightSurcharge: 1.30, weekendSurcharge: 1.20, holidaySurcharge: 1.40, superloadMultiplier: 2.3, routeSurveyFlatRate: 55000 },
    KR: { currency: 'KRW', baseDayRate: 680000, baseDayRateUsd: 510, perMileRate: 2900, perMileUnit: 'km', minimumCharge: 360000, seasonalPeakMonths: [3, 4, 9, 10], seasonalMultiplier: 1.10, nightSurcharge: 1.25, weekendSurcharge: 1.15, holidaySurcharge: 1.35, superloadMultiplier: 2.0, routeSurveyFlatRate: 440000 },
    CL: { currency: 'CLP', baseDayRate: 250000, baseDayRateUsd: 280, perMileRate: 1050, perMileUnit: 'km', minimumCharge: 130000, seasonalPeakMonths: [3, 4, 5, 9, 10, 11], seasonalMultiplier: 1.10, nightSurcharge: 1.20, weekendSurcharge: 1.10, holidaySurcharge: 1.25, superloadMultiplier: 1.7, routeSurveyFlatRate: 160000 },
    AR: { currency: 'ARS', baseDayRate: 180000, baseDayRateUsd: 200, perMileRate: 750, perMileUnit: 'km', minimumCharge: 95000, seasonalPeakMonths: [3, 4, 5, 9, 10, 11], seasonalMultiplier: 1.10, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.5, routeSurveyFlatRate: 120000 },
    CO: { currency: 'COP', baseDayRate: 850000, baseDayRateUsd: 210, perMileRate: 3600, perMileUnit: 'km', minimumCharge: 450000, seasonalPeakMonths: [1, 2, 3, 10, 11, 12], seasonalMultiplier: 1.08, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.5, routeSurveyFlatRate: 550000 },
    PE: { currency: 'PEN', baseDayRate: 700, baseDayRateUsd: 190, perMileRate: 3.00, perMileUnit: 'km', minimumCharge: 370, seasonalPeakMonths: [3, 4, 5, 9, 10, 11], seasonalMultiplier: 1.08, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.5, routeSurveyFlatRate: 450 },

    // ═══ SLATE TIER ═══
    UY: { currency: 'UYU', baseDayRate: 8000, baseDayRateUsd: 200, perMileRate: 34, perMileUnit: 'km', minimumCharge: 4200, seasonalPeakMonths: [3, 4, 5, 9, 10, 11], seasonalMultiplier: 1.08, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.5, routeSurveyFlatRate: 5200 },
    PA: { currency: 'USD', baseDayRate: 380, baseDayRateUsd: 380, perMileRate: 1.60, perMileUnit: 'km', minimumCharge: 200, seasonalPeakMonths: [1, 2, 3, 12], seasonalMultiplier: 1.10, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.6, routeSurveyFlatRate: 280 },
    CR: { currency: 'CRC', baseDayRate: 130000, baseDayRateUsd: 250, perMileRate: 550, perMileUnit: 'km', minimumCharge: 68000, seasonalPeakMonths: [12, 1, 2, 3], seasonalMultiplier: 1.10, nightSurcharge: 1.15, weekendSurcharge: 1.10, holidaySurcharge: 1.20, superloadMultiplier: 1.5, routeSurveyFlatRate: 85000 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// RATE INDEX COMPUTATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class RateIndexEngine {

    // ── Generate Synthetic Baseline from Rate Table ─────────────────────────
    // In production, this would be computed from real transaction data.
    // For launch, we generate realistic distributions from the rate table.

    static getBaseline(countryCode: string, serviceType: ServiceType): CountryRateBaseline | null {
        const rates = COUNTRY_RATE_TABLE[countryCode];
        if (!rates) return null;

        const base = rates.baseDayRate;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const isSeasonal = rates.seasonalPeakMonths.includes(currentMonth);
        const seasonalMult = isSeasonal ? rates.seasonalMultiplier : 1.0;

        // Service-type adjustment
        const serviceMultiplier = this.getServiceMultiplier(serviceType);
        const adjustedBase = base * serviceMultiplier * seasonalMult;

        // Generate distribution around adjusted base
        const stdDev = adjustedBase * 0.18; // 18% standard deviation (realistic for logistics)

        return {
            countryCode,
            currency: rates.currency,
            serviceType,
            unit: serviceType === 'route_survey' ? 'flat_rate' : 'per_day',
            p10: Math.round(adjustedBase - stdDev * 1.28),
            p25: Math.round(adjustedBase - stdDev * 0.67),
            p50: Math.round(adjustedBase),
            p75: Math.round(adjustedBase + stdDev * 0.67),
            p90: Math.round(adjustedBase + stdDev * 1.28),
            mean: Math.round(adjustedBase * 1.02), // slight right-skew
            stdDev: Math.round(stdDev),
            sampleSize: this.estimateSampleSize(countryCode),
            seasonalMultiplier: seasonalMult,
            lastComputedAt: now.toISOString(),
            dataWindowDays: 90,
        };
    }

    // ── Core: Compute Rate Index Score ───────────────────────────────────────

    static computeIndex(
        queryRate: number,
        countryCode: string,
        serviceType: ServiceType = 'pilot_car_general',
    ): RateIndexResult | null {
        const baseline = this.getBaseline(countryCode, serviceType);
        if (!baseline) return null;

        const rates = COUNTRY_RATE_TABLE[countryCode];
        if (!rates) return null;

        // Index score: normalized position relative to distribution
        // -1.0 = way below market (great deal)
        //  0.0 = exactly at median
        // +1.0 = way above market (overpriced)
        const deviation = queryRate - baseline.p50;
        const normalizedScore = baseline.stdDev > 0
            ? Math.max(-1, Math.min(1, deviation / (baseline.stdDev * 2)))
            : 0;

        // Percentile position
        const percentile = this.estimatePercentile(queryRate, baseline);

        // Badge assignment
        const badge = this.assignBadge(percentile);

        // Comparison text
        const diffPercent = baseline.p50 > 0
            ? ((queryRate - baseline.p50) / baseline.p50) * 100
            : 0;
        const absDiff = Math.abs(queryRate - baseline.p50);

        // Trend (simplified — in production from historical snapshots)
        const trend = this.estimateTrend(countryCode);

        return {
            countryCode,
            currency: rates.currency,
            serviceType,
            unit: baseline.unit,
            queryRate,
            indexScore: Math.round(normalizedScore * 100) / 100,
            badge: badge.type,
            badgeLabel: badge.label,
            badgeColor: badge.color,
            badgeEmoji: badge.emoji,
            percentilePosition: Math.round(percentile),
            comparisonText: this.buildComparisonText(diffPercent, rates.currency, absDiff),
            savingsOrPremiumAmount: Math.round(absDiff),
            savingsOrPremiumPercent: Math.round(diffPercent * 10) / 10,
            trend: trend.direction,
            trendLabel: trend.label,
            trendDelta7d: trend.delta7d,
            trendDelta30d: trend.delta30d,
            confidence: baseline.sampleSize > 100 ? 'high'
                : baseline.sampleSize > 30 ? 'medium' : 'low',
            sampleSize: baseline.sampleSize,
        };
    }

    // ── Compute all service types for a country (dashboard view) ────────────

    static computeCountryDashboard(countryCode: string): {
        country: string;
        currency: string;
        services: RateIndexResult[];
        overallHealthScore: number;
        lastUpdated: string;
    } | null {
        const rates = COUNTRY_RATE_TABLE[countryCode];
        if (!rates) return null;

        const serviceTypes: ServiceType[] = [
            'pilot_car_general', 'escort_lead', 'escort_follow',
            'escort_oversize', 'escort_superload', 'route_survey',
        ];

        const services: RateIndexResult[] = [];
        for (const svc of serviceTypes) {
            const baseline = this.getBaseline(countryCode, svc);
            if (!baseline) continue;

            const result = this.computeIndex(baseline.p50, countryCode, svc);
            if (result) services.push(result);
        }

        return {
            country: countryCode,
            currency: rates.currency,
            services,
            overallHealthScore: this.computeMarketHealthScore(countryCode),
            lastUpdated: new Date().toISOString(),
        };
    }

    // ── Compute all 52 countries (global dashboard) ─────────────────────────

    static computeGlobalDashboard(): Array<{
        countryCode: string;
        currency: string;
        avgDayRate: number;
        avgDayRateUsd: number;
        trend: TrendDirection;
        marketHealthScore: number;
        seasonalStatus: 'peak' | 'normal' | 'off_peak';
    }> {
        const results = [];
        const now = new Date();
        const currentMonth = now.getMonth() + 1;

        for (const [code, rates] of Object.entries(COUNTRY_RATE_TABLE)) {
            const isPeak = rates.seasonalPeakMonths.includes(currentMonth);
            const isOffPeak = rates.seasonalPeakMonths.every(m =>
                Math.abs(m - currentMonth) > 2 || Math.abs(m - currentMonth + 12) > 2,
            );

            results.push({
                countryCode: code,
                currency: rates.currency,
                avgDayRate: rates.baseDayRate,
                avgDayRateUsd: rates.baseDayRateUsd,
                trend: this.estimateTrend(code).direction,
                marketHealthScore: this.computeMarketHealthScore(code),
                seasonalStatus: isPeak ? 'peak' as const
                    : isOffPeak ? 'off_peak' as const : 'normal' as const,
            });
        }

        return results.sort((a, b) => b.avgDayRateUsd - a.avgDayRateUsd);
    }

    // ── Badge Assignment (Carvana Style) ─────────────────────────────────────

    private static assignBadge(percentile: number): {
        type: RatingBadge;
        label: string;
        color: string;
        emoji: string;
    } {
        if (percentile <= 15) {
            return { type: 'great_price', label: 'Great Price', color: '#10B981', emoji: '🟢' };
        }
        if (percentile <= 35) {
            return { type: 'good_price', label: 'Good Price', color: '#34D399', emoji: '🟢' };
        }
        if (percentile <= 65) {
            return { type: 'fair_price', label: 'Fair Price', color: '#F59E0B', emoji: '🟡' };
        }
        if (percentile <= 85) {
            return { type: 'above_market', label: 'Above Market', color: '#F97316', emoji: '🟠' };
        }
        return { type: 'overpriced', label: 'Overpriced', color: '#EF4444', emoji: '🔴' };
    }

    // ── Comparison Text Builder ──────────────────────────────────────────────

    private static buildComparisonText(diffPercent: number, currency: string, absDiff: number): string {
        const absPct = Math.abs(Math.round(diffPercent));
        const formattedDiff = `${currency} ${absDiff.toLocaleString()}`;

        if (diffPercent < -15) return `${absPct}% below market — you're getting a great deal (${formattedDiff} savings)`;
        if (diffPercent < -5) return `${absPct}% below market average (${formattedDiff} savings)`;
        if (diffPercent < 5) return `Right at market rate`;
        if (diffPercent < 15) return `${absPct}% above market average (${formattedDiff} premium)`;
        return `${absPct}% above market — consider negotiating (${formattedDiff} premium)`;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static getServiceMultiplier(serviceType: ServiceType): number {
        const multipliers: Record<ServiceType, number> = {
            pilot_car_general: 1.0,
            escort_lead: 1.05,
            escort_follow: 0.95,
            escort_oversize: 1.15,
            escort_superload: 1.80,
            route_survey: 0.75,
            height_pole: 0.60,
        };
        return multipliers[serviceType];
    }

    private static estimatePercentile(rate: number, baseline: CountryRateBaseline): number {
        if (rate <= baseline.p10) return 5;
        if (rate <= baseline.p25) return 10 + ((rate - baseline.p10) / (baseline.p25 - baseline.p10)) * 15;
        if (rate <= baseline.p50) return 25 + ((rate - baseline.p25) / (baseline.p50 - baseline.p25)) * 25;
        if (rate <= baseline.p75) return 50 + ((rate - baseline.p50) / (baseline.p75 - baseline.p50)) * 25;
        if (rate <= baseline.p90) return 75 + ((rate - baseline.p75) / (baseline.p90 - baseline.p75)) * 15;
        return 95;
    }

    private static estimateTrend(countryCode: string): {
        direction: TrendDirection;
        label: string;
        delta7d: number;
        delta30d: number;
    } {
        // In production, this comes from historical rate snapshots
        // For launch: use seasonal signal
        const rates = COUNTRY_RATE_TABLE[countryCode];
        if (!rates) return { direction: 'stable', label: 'Stable', delta7d: 0, delta30d: 0 };

        const currentMonth = new Date().getMonth() + 1;
        const isPeak = rates.seasonalPeakMonths.includes(currentMonth);
        const approachingPeak = rates.seasonalPeakMonths.includes(currentMonth + 1);

        if (isPeak) {
            return { direction: 'rising', label: 'Rates trending up (peak season)', delta7d: 2.5, delta30d: 8.0 };
        }
        if (approachingPeak) {
            return { direction: 'rising', label: 'Rates starting to climb', delta7d: 1.2, delta30d: 4.0 };
        }
        return { direction: 'stable', label: 'Rates stable', delta7d: 0.3, delta30d: -1.0 };
    }

    private static estimateSampleSize(countryCode: string): number {
        // P1: Deterministic tier-based defaults until real transaction data drives this
        const goldCountries = ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'];
        const blueCountries = ['IE', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'ES', 'FR', 'IT', 'PT', 'SA', 'QA', 'MX'];
        if (goldCountries.includes(countryCode)) return 350;
        if (blueCountries.includes(countryCode)) return 120;
        return 40;
    }

    private static computeMarketHealthScore(countryCode: string): number {
        const rates = COUNTRY_RATE_TABLE[countryCode];
        if (!rates) return 0;

        // Factors: data depth, rate stability, coverage
        const sampleScore = Math.min(1, this.estimateSampleSize(countryCode) / 200);
        const rateStability = 1 - (rates.seasonalMultiplier - 1); // lower seasonal swing = more stable
        const coverageScore = rates.baseDayRateUsd > 300 ? 0.8 : 0.5; // proxy for market maturity

        return Math.round((sampleScore * 0.4 + rateStability * 0.3 + coverageScore * 0.3) * 100);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE ALERT ENGINE
// Detects significant rate movements and generates alerts
// ═══════════════════════════════════════════════════════════════════════════════

export class RateAlertEngine {

    static readonly ALERT_THRESHOLDS = {
        rate_drop: -0.08,       // 8% drop triggers alert
        rate_spike: 0.10,       // 10% spike triggers alert
        new_low: -0.15,         // 15% below 90-day average
        seasonal_shift: 0.12,   // 12% seasonal adjustment
    };

    static checkForAlerts(
        countryCode: string,
        serviceType: ServiceType,
        currentRate: number,
        previousRate: number, // from last check
    ): RateAlert[] {
        const alerts: RateAlert[] = [];
        const rates = COUNTRY_RATE_TABLE[countryCode];
        if (!rates) return alerts;

        const changePct = previousRate > 0
            ? (currentRate - previousRate) / previousRate
            : 0;

        if (changePct <= this.ALERT_THRESHOLDS.rate_drop) {
            alerts.push({
                countryCode,
                serviceType,
                alertType: 'rate_drop',
                message: `Rates dropped ${Math.abs(Math.round(changePct * 100))}% in ${countryCode}. Now ${rates.currency} ${currentRate}/day`,
                changePercent: Math.round(changePct * 100),
                previousRate,
                currentRate,
                currency: rates.currency,
                timestamp: Date.now(),
            });
        }

        if (changePct >= this.ALERT_THRESHOLDS.rate_spike) {
            alerts.push({
                countryCode,
                serviceType,
                alertType: 'rate_spike',
                message: `Rates spiked ${Math.round(changePct * 100)}% in ${countryCode}. Now ${rates.currency} ${currentRate}/day`,
                changePercent: Math.round(changePct * 100),
                previousRate,
                currentRate,
                currency: rates.currency,
                timestamp: Date.now(),
            });
        }

        const baseline = RateIndexEngine.getBaseline(countryCode, serviceType);
        if (baseline && currentRate < baseline.p10) {
            alerts.push({
                countryCode,
                serviceType,
                alertType: 'new_low',
                message: `New 90-day low in ${countryCode}: ${rates.currency} ${currentRate}/day`,
                changePercent: Math.round(((currentRate - baseline.p50) / baseline.p50) * 100),
                previousRate: baseline.p50,
                currentRate,
                currency: rates.currency,
                timestamp: Date.now(),
            });
        }

        return alerts;
    }
}
