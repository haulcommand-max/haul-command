
/**
 * Haul Command Match Engine (Core Brain)
 * Deterministic 6-Factor Scoring with real data queries.
 *
 * Factors:
 *   A. Proximity   (30%) — haversine distance vs service radius
 *   B. Readiness   (20%) — availability status + recent heartbeat
 *   C. Reliability  (15%) — trust score from trust_scores table
 *   D. BrokerFit   (15%) — past jobs with this broker + repeat rate
 *   E. PriceFit    (10%) — rate vs broker budget
 *   F. Specialization (10%) — equipment tags match
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface MatchRequest {
    offerId: string;
    pickupGeo: { lat: number; lng: number };
    destGeo?: { lat: number; lng: number };
    jurisdictions: string[];
    requiredTags: string[];
    trustFloor: number;
    budgetMax?: number;
    brokerId?: string;
}

interface EscortProfile {
    user_id: string;
    base_lat: number | null;
    base_lng: number | null;
    service_radius_miles: number;
    equipment_tags: string[];
    availability_status: string;
    has_high_pole: boolean;
    last_active_at: string | null;
    display_name: string | null;
    home_state: string | null;
}

interface ScoredCandidate {
    id: string;
    display_name: string | null;
    totalScore: number;
    hardBlockReason?: string;
    distance_miles?: number;
    breakdown: {
        proximity: number;
        readiness: number;
        reliability: number;
        brokerFit: number;
        priceFit: number;
        specialization: number;
    };
}

// Haversine distance in miles
function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export class MatchEngine {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Run full match algorithm for an offer
     */
    async runMatch(offerId: string): Promise<ScoredCandidate[]> {
        console.log(`[MatchEngine] Running match for offer ${offerId}`);

        // 1. Fetch Offer Context
        const { data: offer, error: offerErr } = await this.supabase
            .from('offers')
            .select('*, loads!inner(*)')
            .eq('id', offerId)
            .single();

        if (offerErr || !offer) throw new Error(`Offer not found: ${offerId}`);

        const load = offer.loads;
        const pickupLat = load.origin_lat;
        const pickupLng = load.origin_lng;
        const requiredEquipment = load.equipment_requirements ?? {};
        const brokerId = load.broker_id;

        // 2. Fetch candidate pool — available drivers with profiles
        const { data: candidates, error: candErr } = await this.supabase
            .from('driver_profiles')
            .select(`
                user_id,
                base_lat,
                base_lng,
                service_radius_miles,
                has_high_pole,
                has_dashcam,
                equipment_tags,
                availability_status,
                last_active_at,
                profiles!inner (
                    display_name,
                    home_state
                )
            `)
            .in('availability_status', ['available', 'busy'])
            .limit(100);

        if (candErr || !candidates || candidates.length === 0) {
            console.log('[MatchEngine] No candidates found');
            return [];
        }

        // 3. Fetch supporting data in parallel
        const candidateIds = candidates.map((c: any) => c.user_id);

        const [trustRes, jobsRes] = await Promise.all([
            this.supabase
                .from('trust_scores')
                .select('user_id, score')
                .in('user_id', candidateIds),
            this.supabase
                .from('jobs')
                .select('driver_id, broker_id, status')
                .in('driver_id', candidateIds)
                .eq('status', 'completed'),
        ]);

        // Trust map
        const trustMap = new Map<string, number>();
        for (const t of (trustRes.data ?? []) as any[]) {
            trustMap.set(t.user_id, t.score ?? 50);
        }

        // Broker fit map (how many times this driver has worked with this broker)
        const brokerFitMap = new Map<string, number>();
        if (brokerId) {
            for (const j of (jobsRes.data ?? []) as any[]) {
                if (j.broker_id === brokerId) {
                    brokerFitMap.set(j.driver_id, (brokerFitMap.get(j.driver_id) ?? 0) + 1);
                }
            }
        }

        // 4. Score each candidate
        const scoredCandidates: ScoredCandidate[] = [];

        for (const c of candidates as any[]) {
            const profile = c.profiles;
            const driverId = c.user_id;
            const equipTags: string[] = Array.isArray(c.equipment_tags) ? c.equipment_tags : [];

            // Hard gate: offline
            if (c.availability_status === 'offline') continue;

            // Hard gate: missing required equipment
            const requiredTagsList = Object.keys(requiredEquipment).filter(k => requiredEquipment[k] === true);
            const missingTags = requiredTagsList.filter(t => !equipTags.includes(t));
            if (missingTags.length > 0) {
                scoredCandidates.push({
                    id: driverId,
                    display_name: profile?.display_name ?? null,
                    totalScore: 0,
                    hardBlockReason: `MISSING_${missingTags.join('_')}`,
                    breakdown: { proximity: 0, readiness: 0, reliability: 0, brokerFit: 0, priceFit: 0, specialization: 0 },
                });
                continue;
            }

            // Hard gate: high pole required but not equipped
            if (requiredEquipment.high_pole && !c.has_high_pole) {
                scoredCandidates.push({
                    id: driverId,
                    display_name: profile?.display_name ?? null,
                    totalScore: 0,
                    hardBlockReason: 'MISSING_HIGH_POLE',
                    breakdown: { proximity: 0, readiness: 0, reliability: 0, brokerFit: 0, priceFit: 0, specialization: 0 },
                });
                continue;
            }

            // A. Proximity (30%) — real haversine distance
            const radius = c.service_radius_miles ?? 150;
            let proximityScore = 50; // default if no geo data
            let distanceMiles: number | undefined;

            if (c.base_lat && c.base_lng && pickupLat && pickupLng) {
                distanceMiles = haversineDistanceMiles(c.base_lat, c.base_lng, pickupLat, pickupLng);
                if (distanceMiles > radius * 1.5) continue; // too far, skip entirely
                proximityScore = distanceMiles <= 25 ? 100
                    : distanceMiles <= 50 ? 90
                        : distanceMiles <= 100 ? 75
                            : Math.max(0, 100 * (1 - distanceMiles / radius));
            }

            // B. Readiness (20%) — availability + recency of last heartbeat
            let readinessScore = c.availability_status === 'available' ? 100 : 50;
            if (c.last_active_at) {
                const minutesSinceActive = (Date.now() - new Date(c.last_active_at).getTime()) / 60000;
                if (minutesSinceActive < 5) readinessScore = Math.min(readinessScore + 10, 100);
                else if (minutesSinceActive > 60) readinessScore = Math.max(readinessScore - 20, 0);
            }

            // C. Reliability (15%) — real trust score
            const trustScore = trustMap.get(driverId) ?? 50;
            const reliabilityScore = Math.min(trustScore, 100);

            // D. BrokerFit (15%) — repeat partnership with this broker
            const repeatJobs = brokerFitMap.get(driverId) ?? 0;
            const brokerFitScore = Math.min(repeatJobs * 25, 100); // 4+ jobs = max

            // E. PriceFit (10%) — currently no rate_preferences table,
            // so all candidates get neutral score. Will wire when rate table exists.
            const priceFitScore = 70;

            // F. Specialization (10%) — equipment tag density
            let specializationScore = 0;
            if (c.has_high_pole) specializationScore += 40;
            if (equipTags.includes('superload_ready')) specializationScore += 30;
            if (c.has_dashcam) specializationScore += 15;
            if (equipTags.length >= 3) specializationScore += 15;
            specializationScore = Math.min(100, specializationScore);

            // Weighted total
            const totalScore =
                0.30 * proximityScore +
                0.20 * readinessScore +
                0.15 * reliabilityScore +
                0.15 * brokerFitScore +
                0.10 * priceFitScore +
                0.10 * specializationScore;

            scoredCandidates.push({
                id: driverId,
                display_name: profile?.display_name ?? null,
                totalScore: Math.round(totalScore),
                distance_miles: distanceMiles ? Math.round(distanceMiles) : undefined,
                breakdown: {
                    proximity: proximityScore,
                    readiness: readinessScore,
                    reliability: reliabilityScore,
                    brokerFit: brokerFitScore,
                    priceFit: priceFitScore,
                    specialization: specializationScore,
                },
            });
        }

        // 5. Filter & Sort — top 3
        const validCandidates = scoredCandidates
            .filter(c => !c.hardBlockReason)
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 3);

        // 6. Log Match Run
        const { data: run } = await this.supabase.from('match_runs').insert({
            offer_id: offerId,
            run_reason: 'NEW_OFFER',
            algorithm_version: 'v2.0',
            candidates_evaluated: scoredCandidates.length,
            candidates_valid: validCandidates.length,
        }).select('id').single();

        // 7. Log Candidate Records
        if (run && validCandidates.length > 0) {
            const records = validCandidates.map((c, index) => ({
                match_run_id: run.id,
                escort_id: c.id,
                rank: index + 1,
                score_total: c.totalScore,
                score_breakdown: c.breakdown,
                distance_miles: c.distance_miles,
            }));
            try { await this.supabase.from('match_candidates').insert(records); } catch { /* non-critical */ }
        }

        return validCandidates;
    }
}
