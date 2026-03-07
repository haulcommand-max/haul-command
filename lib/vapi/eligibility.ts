/**
 * Vapi Outbound Eligibility Scoring Engine
 *
 * Computes a 0.0–1.0 eligibility score for each entity (place or operator)
 * to determine whether a Vapi outbound call should be placed.
 * 
 * Minimum score to call: 0.72  (configurable)
 * Score inputs: entity_type_weight, corridor_heat, page_views, 
 *               search_impressions, competitor_density, missing_fields, 
 *               phone_validity, prior_contact_attempts
 */

// ── Score weights ──────────────────────────────────────────────────────────

const WEIGHTS = {
    entity_type: 0.10,
    corridor_heat: 0.20,
    page_views: 0.15,
    search_impressions: 0.15,
    competitor_density: 0.10,
    missing_fields: 0.10,
    phone_valid: 0.10,
    prior_contacts: 0.10,
} as const;

const ENTITY_TYPE_SCORES: Record<string, number> = {
    truck_stop: 1.00,
    motel: 0.85,
    repair_shop: 0.80,
    tire_shop: 0.70,
    truck_parking: 0.65,
    tow_rotator: 0.75,
    washout: 0.50,
    fuel_station_diesel_heavy: 0.60,
    rest_area: 0.40,
    scale_weigh_station_public: 0.30,
    // Global
    service_area: 0.55,
    freight_rest_stop: 0.50,
    border_facility: 0.45,
    port_adjacent_services: 0.70,
    industrial_park_services: 0.65,
    // Operators
    operator: 0.90,
};

export const MINIMUM_ELIGIBILITY_SCORE = 0.72;
export const MAX_DAILY_ATTEMPTS_PER_ENTITY = 2;
export const COOLDOWN_DAYS_AFTER_CONTACT = 14;

// ── Scoring ────────────────────────────────────────────────────────────────

export interface EligibilityInput {
    entityType: string;
    corridorHeatScore: number;     // 0-100
    pageViews7d: number;
    searchImpressions28d: number;
    competitorDensity: number;     // 0-100
    missingFieldsCount: number;    // raw count
    phoneValid: boolean;
    priorContactAttempts: number;
    lastContactAt?: Date | null;
}

export interface EligibilityResult {
    score: number;                 // 0.0 to 1.0
    eligible: boolean;
    reason: string;
    breakdown: Record<string, number>;
}

export function computeEligibilityScore(input: EligibilityInput): EligibilityResult {
    // Cooldown check
    if (input.lastContactAt) {
        const daysSince = (Date.now() - new Date(input.lastContactAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS_AFTER_CONTACT) {
            return {
                score: 0,
                eligible: false,
                reason: `Cooldown: ${Math.ceil(COOLDOWN_DAYS_AFTER_CONTACT - daysSince)} days remaining`,
                breakdown: {},
            };
        }
    }

    // Max attempts check
    if (input.priorContactAttempts >= MAX_DAILY_ATTEMPTS_PER_ENTITY * 5) {
        return {
            score: 0,
            eligible: false,
            reason: `Max contact attempts reached (${input.priorContactAttempts})`,
            breakdown: {},
        };
    }

    const breakdown: Record<string, number> = {};

    // Entity type score
    breakdown.entity_type = ENTITY_TYPE_SCORES[input.entityType] ?? 0.5;

    // Corridor heat (0-100 → 0-1)
    breakdown.corridor_heat = clamp(input.corridorHeatScore / 100);

    // Page views (log scale, cap at ~500 views for max score)
    breakdown.page_views = clamp(Math.log10(Math.max(input.pageViews7d, 1)) / Math.log10(500));

    // Search impressions (log scale, cap at ~5000)
    breakdown.search_impressions = clamp(Math.log10(Math.max(input.searchImpressions28d, 1)) / Math.log10(5000));

    // Competitor density (inverse — fewer competitors = higher priority for THEM claiming)
    breakdown.competitor_density = clamp(1 - (input.competitorDensity / 100));

    // Missing fields (more missing = more value in getting them to claim)
    breakdown.missing_fields = clamp(Math.min(input.missingFieldsCount, 10) / 10);

    // Phone validity
    breakdown.phone_valid = input.phoneValid ? 1.0 : 0.0;

    // Prior contacts penalty (diminishing returns)
    breakdown.prior_contacts = clamp(1 - (input.priorContactAttempts / 10));

    // Weighted sum
    const score =
        (breakdown.entity_type * WEIGHTS.entity_type) +
        (breakdown.corridor_heat * WEIGHTS.corridor_heat) +
        (breakdown.page_views * WEIGHTS.page_views) +
        (breakdown.search_impressions * WEIGHTS.search_impressions) +
        (breakdown.competitor_density * WEIGHTS.competitor_density) +
        (breakdown.missing_fields * WEIGHTS.missing_fields) +
        (breakdown.phone_valid * WEIGHTS.phone_valid) +
        (breakdown.prior_contacts * WEIGHTS.prior_contacts);

    const eligible = score >= MINIMUM_ELIGIBILITY_SCORE && input.phoneValid;

    return {
        score: Math.round(score * 10000) / 10000,
        eligible,
        reason: eligible
            ? 'Eligible for outbound contact'
            : !input.phoneValid
                ? 'Invalid phone number'
                : `Score ${score.toFixed(4)} below minimum ${MINIMUM_ELIGIBILITY_SCORE}`,
        breakdown,
    };
}

// ── Batch scoring for cron ─────────────────────────────────────────────────

export interface BatchScoringResult {
    total: number;
    eligible: number;
    scores: Array<{ entityId: string; entityType: string; score: number; eligible: boolean }>;
}

export function scoreBatch(entities: Array<{ id: string } & EligibilityInput>): BatchScoringResult {
    const scores = entities.map(e => {
        const result = computeEligibilityScore(e);
        return {
            entityId: e.id,
            entityType: e.entityType,
            score: result.score,
            eligible: result.eligible,
        };
    });

    return {
        total: scores.length,
        eligible: scores.filter(s => s.eligible).length,
        scores: scores.sort((a, b) => b.score - a.score),
    };
}

// ── Follow-the-sun capacity allocation ─────────────────────────────────────

export interface ThroughputSlot {
    countryCode: string;
    timezone: string;
    windowStart: string; // HH:MM
    windowEnd: string;
    weight: number;
    maxConcurrency: number;
    dailyBudgetCap: number;
}

export function isWithinCallingWindow(slot: ThroughputSlot, nowUtc: Date): boolean {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: slot.timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const localTime = formatter.format(nowUtc);
        const [h, m] = localTime.split(':').map(Number);
        const currentMinutes = (h || 0) * 60 + (m || 0);

        const [sh, sm] = slot.windowStart.split(':').map(Number);
        const [eh, em] = slot.windowEnd.split(':').map(Number);
        const startMin = (sh || 0) * 60 + (sm || 0);
        const endMin = (eh || 0) * 60 + (em || 0);

        return currentMinutes >= startMin && currentMinutes <= endMin;
    } catch {
        return false;
    }
}

export function getActiveSlots(slots: ThroughputSlot[], nowUtc: Date): ThroughputSlot[] {
    return slots
        .filter(s => isWithinCallingWindow(s, nowUtc))
        .sort((a, b) => b.weight - a.weight);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, v));
}
