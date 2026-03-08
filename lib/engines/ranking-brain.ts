/**
 * Ranking Brain — Hybrid Stack
 * 
 * Combines Typesense retrieval with Freshness, Load Fit, and Trust Score
 * into a unified ranking policy. This is the single ranking truth.
 * 
 * Anti-overlap rule: "Supabase is NOT ranking truth" — all ranking
 * goes through this brain → Typesense.
 */

import { computeFreshness, type FreshnessInput } from './freshness';

export interface RankingSignals {
    // Core scores
    trust_score: number;
    reputation_score: number;
    freshness_score: number;
    // Engagement
    profile_views_30d: number;
    response_rate_7d: number;
    completed_jobs_90d: number;
    // Compliance
    is_verified: boolean;
    is_dispatch_ready: boolean;
    docs_current: boolean;
    // Boost
    boost_tier: string | null;
    boost_multiplier: number;
    // Activity
    last_availability_update_hours: number;
    last_login_hours: number;
}

export interface RankingResult {
    composite_score: number; // 0-1000, higher = better rank
    components: {
        trust: number;
        freshness: number;
        engagement: number;
        compliance: number;
        boost: number;
    };
    sort_key: string; // for Typesense sorting
    badges: string[];
    rank_tier: 'elite' | 'strong' | 'standard' | 'developing' | 'inactive';
}

// Weights — these define what matters for ranking
const WEIGHTS = {
    trust: 0.30,
    freshness: 0.25,
    engagement: 0.20,
    compliance: 0.15,
    boost: 0.10,
};

export function computeRanking(signals: RankingSignals): RankingResult {
    // 1. Trust component (0-100)
    const trust = Math.min(100,
        (signals.trust_score * 0.4) +
        (signals.reputation_score * 0.6)
    );

    // 2. Freshness component (0-100)
    const freshness = signals.freshness_score;

    // 3. Engagement component (0-100)
    const engagement = Math.min(100,
        (Math.min(50, signals.profile_views_30d * 2)) +
        (signals.response_rate_7d * 30) +
        (Math.min(20, signals.completed_jobs_90d * 2))
    );

    // 4. Compliance component (0-100)
    let compliance = 30; // base
    if (signals.is_verified) compliance += 30;
    if (signals.is_dispatch_ready) compliance += 25;
    if (signals.docs_current) compliance += 15;

    // 5. Boost component (0-100)
    const boost = signals.boost_multiplier > 1
        ? Math.min(100, (signals.boost_multiplier - 1) * 200)
        : 0;

    // Weighted composite (0-100)
    const rawComposite =
        trust * WEIGHTS.trust +
        freshness * WEIGHTS.freshness +
        engagement * WEIGHTS.engagement +
        compliance * WEIGHTS.compliance +
        boost * WEIGHTS.boost;

    // Scale to 0-1000 for finer granularity in Typesense sorting
    const composite_score = Math.round(rawComposite * 10);

    // Rank tier
    const rank_tier: RankingResult['rank_tier'] =
        composite_score >= 800 ? 'elite' :
            composite_score >= 600 ? 'strong' :
                composite_score >= 400 ? 'standard' :
                    composite_score >= 200 ? 'developing' : 'inactive';

    // Badges
    const badges: string[] = [];
    if (composite_score >= 800) badges.push('top_ranked');
    if (trust >= 85) badges.push('highly_trusted');
    if (freshness >= 90) badges.push('lightning_fresh');
    if (engagement >= 80) badges.push('highly_engaged');
    if (compliance >= 90) badges.push('fully_compliant');

    return {
        composite_score,
        components: { trust, freshness, engagement, compliance, boost },
        sort_key: String(composite_score).padStart(4, '0'),
        badges,
        rank_tier,
    };
}

/**
 * Compute ranking from raw operator data (convenience wrapper)
 */
export function computeRankingFromOperator(operator: {
    trust_score: number;
    reputation_score: number;
    is_verified: boolean;
    is_dispatch_ready: boolean;
    boost_tier: string | null;
    profile_views_30d?: number;
    response_rate_7d?: number;
    completed_jobs_90d?: number;
    freshness?: FreshnessInput;
}): RankingResult {
    const boostMultipliers: Record<string, number> = {
        premium: 3.0, featured: 2.0, spotlight: 1.5,
    };

    // Compute freshness if raw data provided
    let freshnessScore = 50; // default
    if (operator.freshness) {
        freshnessScore = computeFreshness(operator.freshness).freshness_score;
    }

    return computeRanking({
        trust_score: operator.trust_score || 0,
        reputation_score: operator.reputation_score || 0,
        freshness_score: freshnessScore,
        profile_views_30d: operator.profile_views_30d || 0,
        response_rate_7d: operator.response_rate_7d || 0,
        completed_jobs_90d: operator.completed_jobs_90d || 0,
        is_verified: operator.is_verified || false,
        is_dispatch_ready: operator.is_dispatch_ready || false,
        docs_current: true,
        boost_tier: operator.boost_tier,
        boost_multiplier: operator.boost_tier ? (boostMultipliers[operator.boost_tier] || 1) : 1,
        last_availability_update_hours: 0,
        last_login_hours: 0,
    });
}
