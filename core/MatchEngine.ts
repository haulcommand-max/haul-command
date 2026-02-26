
/**
 * Haul Command Match Engine (The "Brain")
 * Implements Deterministic 6-Factor Scoring.
 */

// @ts-ignore
import { createClient } from '@supabase/supabase-js';

interface MatchRequest {
    offerId: string;
    pickupGeo: { lat: number, lng: number };
    jurisdictions: string[];
    requiredTags: string[];
    trustFloor: number;
}

interface EscortProfile {
    user_id: string;
    home_geo: any;
    service_radius: number;
    equipment_tags: string[];
    status: string;
    trust_score: number;
    response_avg: number;
    cancel_rate: number;
    service_radius_miles?: number; // Handle variations
}

interface ScoredCandidate {
    id: string;
    totalScore: number;
    hardBlockReason?: string;
    breakdown?: any;
}

export class MatchEngine {
    private supabase: any;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Run Match Algorithm (V1)
     */
    async runMatch(offerId: string) {
        console.log(`[MatchEngine] Running Match for Offer ${offerId}`);

        // 1. Fetch Offer Context
        const { data: offer } = await this.supabase.from('offers').select('*').eq('id', offerId).single();
        if (!offer) throw new Error("Offer not found");

        // 2. Fetch Candidates (Broad Geo Query first)
        // In Prod: Use PostGIS ST_DWithin
        const { data: candidates } = await this.supabase.from('escort_profiles').select('*').limit(50); // Mock limit

        const scoredCandidates: ScoredCandidate[] = candidates.map((candidate: EscortProfile) => this.scoreCandidate(candidate, offer));

        // 3. Filter & Sort
        const validCandidates = scoredCandidates
            .filter((c: ScoredCandidate) => !c.hardBlockReason)
            .sort((a: ScoredCandidate, b: ScoredCandidate) => b.totalScore - a.totalScore)
            .slice(0, 3); // Top 3

        // 4. Log Run
        const { data: run } = await this.supabase.from('match_runs').insert({
            offer_id: offerId,
            run_reason: 'NEW_OFFER',
            algorithm_version: 'v1.0'
        }).select('id').single();

        // 5. Log Candidates
        const records = validCandidates.map((c: ScoredCandidate, index: number) => ({
            match_run_id: run.id,
            escort_id: c.id,
            rank: index + 1,
            score_total: c.totalScore,
            score_breakdown: c.breakdown
        }));

        if (records.length > 0) {
            await this.supabase.from('match_candidates').insert(records);
        }

        return validCandidates;
    }

    /**
     * Deterministic Scoring Logic
     */
    private scoreCandidate(candidate: EscortProfile, offer: any): ScoredCandidate {
        // Step 0: Hard Gates
        if (candidate.status === 'OFFLINE') return { id: candidate.user_id, totalScore: 0, hardBlockReason: 'OFFLINE' };

        // Check Tags
        const missingTags = offer.required_equipment_tags?.filter((t: string) => !candidate.equipment_tags.includes(t)) || [];
        if (missingTags.length > 0) return { id: candidate.user_id, totalScore: 0, hardBlockReason: `MISSING_${missingTags.join('_')}` };

        // Step 1: Weighted Scoring

        // A. Proximity (30%)
        const distance = 10; // Mock Distance Calculation
        const radius = candidate.service_radius_miles || 500;
        const proximityScore = distance <= 10 ? 100 : Math.max(0, 100 * (1 - (distance / radius)));

        // B. Readiness (20%)
        const readinessScore = candidate.status === 'AVAILABLE_NOW' ? 100 : 50;

        // C. Reliability (15%) - Mocked from Trust Score
        const reliabilityScore = 90; // Would query trust_scores table

        // D. BrokerFit (15%) - Mocked
        const brokerFitScore = 80;

        // E. PriceFit (10%) - Mocked logic
        const priceFitScore = 100;

        // F. Specialization (10%)
        let specializationScore = 0;
        if (candidate.equipment_tags.includes('high_pole')) specializationScore += 40;
        if (candidate.equipment_tags.includes('superload_ready')) specializationScore += 40;
        specializationScore = Math.min(100, specializationScore);

        // Final Score
        const totalScore =
            (0.30 * proximityScore) +
            (0.20 * readinessScore) +
            (0.15 * reliabilityScore) +
            (0.15 * brokerFitScore) +
            (0.10 * priceFitScore) +
            (0.10 * specializationScore);

        return {
            id: candidate.user_id,
            totalScore: Math.round(totalScore),
            breakdown: {
                proximity: proximityScore,
                readiness: readinessScore,
                reliability: reliabilityScore,
                brokerFit: brokerFitScore,
                priceFit: priceFitScore,
                specialization: specializationScore
            }
        };
    }
}
