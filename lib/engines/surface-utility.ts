/**
 * Surface Utility Scorer
 * 
 * Decides whether a page should exist, be indexed, upgraded, or suppressed.
 * Prevents thin SEO spam and maximizes page ROI.
 * 
 * Verdict: keep | noindex | suppress | upgrade
 */

export type PageVerdict = 'keep' | 'noindex' | 'suppress' | 'upgrade';

export interface SurfaceUtilityInput {
    surface_id: string;
    page_url: string;
    page_class: string;
    // Traffic
    organic_impressions_30d: number;
    organic_clicks_30d: number;
    direct_views_30d: number;
    // Claim potential
    is_claimed: boolean;
    claim_readiness_score: number;
    // Ad potential
    has_sponsor_inventory: boolean;
    nearby_sponsor_demand: number;
    sponsor_revenue_30d: number;
    // Data node value
    connected_entities: number;
    internal_links_in: number;
    internal_links_out: number;
    // Local uniqueness
    competitor_pages_same_query: number;
    content_depth_score: number; // 0-100, how unique/valuable
    // Age and history
    page_age_days: number;
    was_ever_indexed: boolean;
}

export interface SurfaceUtilityResult {
    surface_id: string;
    utility_score: number; // 0-100
    verdict: PageVerdict;
    index_recommendation: boolean;
    upgrade_priority: 'none' | 'low' | 'medium' | 'high';
    factors: Record<string, number>;
    reason: string;
    computed_at: string;
}

export function scoreSurfaceUtility(input: SurfaceUtilityInput): SurfaceUtilityResult {
    const factors: Record<string, number> = {};

    // 1. Traffic value (25%)
    const ctr = input.organic_impressions_30d > 0
        ? input.organic_clicks_30d / input.organic_impressions_30d : 0;
    factors.traffic = Math.min(100,
        (input.organic_clicks_30d * 5) +
        (input.organic_impressions_30d * 0.5) +
        (input.direct_views_30d * 3) +
        (ctr * 200)
    );

    // 2. Claim potential (20%)
    factors.claim = input.is_claimed ? 100 :
        Math.min(100, input.claim_readiness_score * 1.2);

    // 3. Ad potential (20%)
    factors.ad = Math.min(100,
        (input.sponsor_revenue_30d * 10) +
        (input.nearby_sponsor_demand * 8) +
        (input.has_sponsor_inventory ? 20 : 0)
    );

    // 4. Data node value (20%)
    factors.data = Math.min(100,
        (input.connected_entities * 3) +
        (input.internal_links_in * 4) +
        (input.internal_links_out * 2)
    );

    // 5. Local uniqueness (15%)
    const competitionPenalty = Math.max(0, 100 - input.competitor_pages_same_query * 15);
    factors.uniqueness = Math.min(100,
        (input.content_depth_score * 0.6) +
        (competitionPenalty * 0.4)
    );

    // Weighted total
    const utility_score = Math.round(
        factors.traffic * 0.25 +
        factors.claim * 0.20 +
        factors.ad * 0.20 +
        factors.data * 0.20 +
        factors.uniqueness * 0.15
    );

    // Verdict
    let verdict: PageVerdict;
    let reason: string;
    let index_recommendation: boolean;
    let upgrade_priority: SurfaceUtilityResult['upgrade_priority'];

    if (utility_score >= 60) {
        verdict = 'keep';
        index_recommendation = true;
        upgrade_priority = utility_score >= 80 ? 'none' : 'low';
        reason = 'Page meets utility threshold — index and maintain';
    } else if (utility_score >= 35) {
        verdict = 'noindex';
        index_recommendation = false;
        upgrade_priority = 'medium';
        reason = 'Below index threshold — keep for internal linking but noindex';
    } else if (utility_score >= 15) {
        // Check if it has growth potential
        if (input.page_age_days < 30 || input.claim_readiness_score > 40) {
            verdict = 'upgrade';
            index_recommendation = false;
            upgrade_priority = 'high';
            reason = 'Low utility but has potential — prioritize content upgrade';
        } else {
            verdict = 'noindex';
            index_recommendation = false;
            upgrade_priority = 'low';
            reason = 'Low utility, limited potential — noindex and deprioritize';
        }
    } else {
        verdict = 'suppress';
        index_recommendation = false;
        upgrade_priority = 'none';
        reason = 'Thin page with no demonstrated value — suppress from sitemap';
    }

    return {
        surface_id: input.surface_id,
        utility_score,
        verdict,
        index_recommendation,
        upgrade_priority,
        factors,
        reason,
        computed_at: new Date().toISOString(),
    };
}
