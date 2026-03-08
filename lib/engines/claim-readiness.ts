/**
 * Claim Readiness Engine
 * 
 * Decides when a page is valuable enough to outreach and claim.
 * Rule: No outreach before visible value exists.
 * 
 * Outputs: readiness_score, outreach_state, suppression_flag,
 *   top 3 claim value messages
 */

export type OutreachState = 'suppress' | 'passive_only' | 'ready_for_outreach' | 'high_priority';

export interface ClaimReadinessInput {
    surface_id: string;
    operator_id: string;
    // Page quality signals
    impressions_30d: number;
    search_impressions_30d: number;
    profile_views_30d: number;
    // Content signals
    profile_completion_pct: number;
    has_photo: boolean;
    has_reviews: boolean;
    review_count: number;
    trust_score: number;
    // Placement signals
    related_page_count: number;
    internal_links_count: number;
    corridor_placements: number;
    // Market signals
    is_claimed: boolean;
    claim_status: 'unclaimed' | 'started' | 'completed';
    role_type: string;
    country_code: string;
    state: string;
    city: string;
    // Sponsor potential
    nearby_sponsors: number;
    corridor_sponsor_demand: number;
}

export interface ClaimReadinessResult {
    surface_id: string;
    operator_id: string;
    readiness_score: number; // 0-100
    outreach_state: OutreachState;
    suppression_flag: boolean;
    top_messages: string[];
    factors: Record<string, number>;
    computed_at: string;
}

export function computeClaimReadiness(input: ClaimReadinessInput): ClaimReadinessResult {
    if (input.is_claimed || input.claim_status === 'completed') {
        return {
            surface_id: input.surface_id,
            operator_id: input.operator_id,
            readiness_score: 100,
            outreach_state: 'suppress',
            suppression_flag: true,
            top_messages: ['Already claimed'],
            factors: {},
            computed_at: new Date().toISOString(),
        };
    }

    const factors: Record<string, number> = {};

    // 1. Visibility proof (30%)
    const visScore = Math.min(100,
        (input.impressions_30d * 0.5) +
        (input.search_impressions_30d * 1.0) +
        (input.profile_views_30d * 2.0)
    );
    factors.visibility = visScore;

    // 2. Content quality (25%)
    let contentScore = input.profile_completion_pct * 0.5;
    if (input.has_photo) contentScore += 15;
    if (input.has_reviews) contentScore += 10;
    contentScore += Math.min(20, input.review_count * 4);
    contentScore += Math.min(10, input.trust_score / 10);
    factors.content = Math.min(100, contentScore);

    // 3. Placement strength (20%)
    const placementScore = Math.min(100,
        (input.related_page_count * 5) +
        (input.internal_links_count * 3) +
        (input.corridor_placements * 10)
    );
    factors.placement = placementScore;

    // 4. Market value (15%)
    const marketScore = Math.min(100,
        (input.nearby_sponsors * 10) +
        (input.corridor_sponsor_demand * 8)
    );
    factors.market = marketScore;

    // 5. Claimability confidence (10%)
    let claimScore = 50; // base
    if (input.city) claimScore += 15;
    if (input.state) claimScore += 10;
    if (input.role_type) claimScore += 10;
    if (input.claim_status === 'started') claimScore += 20; // already showed interest
    factors.claimability = Math.min(100, claimScore);

    // Weighted total
    const readiness_score = Math.round(
        factors.visibility * 0.30 +
        factors.content * 0.25 +
        factors.placement * 0.20 +
        factors.market * 0.15 +
        factors.claimability * 0.10
    );

    // Outreach state
    let outreach_state: OutreachState;
    if (readiness_score >= 70) outreach_state = 'high_priority';
    else if (readiness_score >= 45) outreach_state = 'ready_for_outreach';
    else if (readiness_score >= 20) outreach_state = 'passive_only';
    else outreach_state = 'suppress';

    // Top 3 value messages
    const messages: string[] = [];
    if (input.profile_views_30d > 0) {
        messages.push(`Your profile was viewed ${input.profile_views_30d} times this month`);
    }
    if (input.search_impressions_30d > 0) {
        messages.push(`You appeared in ${input.search_impressions_30d} searches this month`);
    }
    if (input.corridor_placements > 0) {
        messages.push(`You're featured on ${input.corridor_placements} corridor pages`);
    }
    if (input.review_count > 0) {
        messages.push(`${input.review_count} reviews mention your services`);
    }
    if (input.nearby_sponsors > 0) {
        messages.push(`${input.nearby_sponsors} businesses are sponsoring in your area`);
    }
    if (messages.length === 0) {
        messages.push(`Claim your profile to get discovered by brokers in ${input.state || input.country_code}`);
    }

    return {
        surface_id: input.surface_id,
        operator_id: input.operator_id,
        readiness_score,
        outreach_state,
        suppression_flag: outreach_state === 'suppress',
        top_messages: messages.slice(0, 3),
        factors,
        computed_at: new Date().toISOString(),
    };
}
