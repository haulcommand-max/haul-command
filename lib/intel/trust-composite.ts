/**
 * Unified Trust Score Computation (Trust Score v3+)
 * 
 * Merges all four intelligence engine outputs into a single composite 
 * trust score and tier assignment.
 * 
 * Feature sources:
 *   - escort_license_matches.license_verified_flag
 *   - operator_review_signals.escort_review_signal_score
 *   - operator_photo_signals.photo_signal_score
 *   - graph_edges broker_to_escort weight + stability
 * 
 * Actions unlocked:
 *   - hidden_escort_discovery_queue
 *   - rank_boost_for_verified
 *   - fraud_suppression_for_suspicious_patterns
 *   - broker_recommendations (who to call first)
 */

import { getSupabaseAdmin } from "@/lib/supabase/admin";

// ═══════════════════════════════════════════════════════════════
// COMPOSITE SCORING WEIGHTS
// ═══════════════════════════════════════════════════════════════

const TRUST_WEIGHTS = {
    licenseVerified: 0.30,
    reviewSignal: 0.25,
    photoSignal: 0.15,
    graphReliability: 0.20,
    graphBrokerDiversity: 0.10,
};

const TIER_THRESHOLDS = {
    platinum: 0.85,
    gold: 0.70,
    silver: 0.50,
    bronze: 0.30,
    unscored: 0,
};

export type TrustTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'unscored';

// ═══════════════════════════════════════════════════════════════
// COMPUTATION
// ═══════════════════════════════════════════════════════════════

export interface TrustInputs {
    licenseVerifiedFlag: boolean;
    licenseMatchScore: number;
    reviewSignalScore: number;
    photoSignalScore: number;
    graphReliabilityScore: number;
    graphBrokerEdges: number;
}

export interface TrustResult {
    compositeScore: number;
    tier: TrustTier;
    breakdown: {
        licenseComponent: number;
        reviewComponent: number;
        photoComponent: number;
        graphComponent: number;
        diversityComponent: number;
    };
}

export function computeCompositeTrustScore(inputs: TrustInputs): TrustResult {
    // License: verified = 1.0, matched but unverified = matchScore * 0.7, none = 0
    const licenseComponent = inputs.licenseVerifiedFlag
        ? 1.0
        : inputs.licenseMatchScore * 0.7;

    // Review signal (already 0-1)
    const reviewComponent = inputs.reviewSignalScore;

    // Photo signal (already 0-1)
    const photoComponent = inputs.photoSignalScore;

    // Graph reliability (already 0-1)
    const graphComponent = inputs.graphReliabilityScore;

    // Broker diversity (log-scaled edge count)
    const diversityComponent = Math.min(1.0, Math.log10(inputs.graphBrokerEdges + 1) / Math.log10(21));

    // Weighted sum
    const composite =
        (licenseComponent * TRUST_WEIGHTS.licenseVerified) +
        (reviewComponent * TRUST_WEIGHTS.reviewSignal) +
        (photoComponent * TRUST_WEIGHTS.photoSignal) +
        (graphComponent * TRUST_WEIGHTS.graphReliability) +
        (diversityComponent * TRUST_WEIGHTS.graphBrokerDiversity);

    const compositeScore = Math.round(Math.min(1.0, composite) * 10000) / 10000;

    // Tier assignment
    let tier: TrustTier;
    if (compositeScore >= TIER_THRESHOLDS.platinum) tier = 'platinum';
    else if (compositeScore >= TIER_THRESHOLDS.gold) tier = 'gold';
    else if (compositeScore >= TIER_THRESHOLDS.silver) tier = 'silver';
    else if (compositeScore >= TIER_THRESHOLDS.bronze) tier = 'bronze';
    else tier = 'unscored';

    return {
        compositeScore,
        tier,
        breakdown: {
            licenseComponent: Math.round(licenseComponent * 10000) / 10000,
            reviewComponent: Math.round(reviewComponent * 10000) / 10000,
            photoComponent: Math.round(photoComponent * 10000) / 10000,
            graphComponent: Math.round(graphComponent * 10000) / 10000,
            diversityComponent: Math.round(diversityComponent * 10000) / 10000,
        },
    };
}

// ═══════════════════════════════════════════════════════════════
// BATCH RECOMPUTATION JOB (daily)
// ═══════════════════════════════════════════════════════════════

export async function recomputeAllTrustScores(): Promise<{
    operatorsProcessed: number;
    errors: string[];
}> {
    const supabase = getSupabaseAdmin();

    const errors: string[] = [];

    // Get all operator trust signals
    const { data: signals } = await supabase
        .from('operator_trust_signals')
        .select('*')
        .limit(5000);

    if (!signals) return { operatorsProcessed: 0, errors: ['No trust signals found'] };

    let processed = 0;

    for (const sig of signals) {
        try {
            const result = computeCompositeTrustScore({
                licenseVerifiedFlag: sig.license_verified_flag || false,
                licenseMatchScore: sig.license_match_score || 0,
                reviewSignalScore: sig.review_signal_score || 0,
                photoSignalScore: sig.photo_signal_score || 0,
                graphReliabilityScore: sig.graph_reliability_score || 0,
                graphBrokerEdges: sig.graph_broker_edges || 0,
            });

            await supabase.from('operator_trust_signals').update({
                composite_trust_score: result.compositeScore,
                trust_tier: result.tier,
                computed_at: new Date().toISOString(),
            }).eq('operator_id', sig.operator_id);

            processed++;
        } catch (err: any) {
            errors.push(`${sig.operator_id}: ${err.message}`);
        }
    }

    return { operatorsProcessed: processed, errors };
}
