// lib/directory/ranking.ts
//
// Directory Search Ranking Engine v2
// 8-factor weighted score + boost/penalty modifiers.
// Used by directory search, "nearby operators", and recommendation cards.
//
// Spec: HCOS-GROWTH-PLAY-01 / Directory surface

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface DirectoryListing {
    id: string;
    user_id: string | null;
    name: string;
    is_claimed: boolean;
    has_subscription: boolean;
    verification_tier: number;           // 0-4
    last_active_at: string | null;
    profile_completion: number;          // 0-1
    review_count: number;
    avg_review_score: number;            // 0-5
    response_rate: number;               // 0-1
    response_time_p50_seconds: number | null;
    corridors_claimed: number;
    counties_claimed: number;
    has_avatar: boolean;
    face_detected: boolean;
    equipment_photo_count: number;
    lat: number | null;
    lon: number | null;
}

export interface RankedListing {
    listing: DirectoryListing;
    raw_score: number;
    final_score: number;
    rank: number;
    breakdown: ScoreBreakdown;
    penalties: string[];
    boosts: string[];
}

export interface ScoreBreakdown {
    geo_proximity: number;
    verification: number;
    recency: number;
    reviews: number;
    profile_completeness: number;
    responsiveness: number;
    coverage_breadth: number;
    photo_quality: number;
}

// ============================================================
// WEIGHTS
// ============================================================

const WEIGHTS = {
    geo_proximity: 0.25,
    verification: 0.20,
    recency: 0.15,
    reviews: 0.12,
    profile_completeness: 0.10,
    responsiveness: 0.08,
    coverage_breadth: 0.05,
    photo_quality: 0.05,
} as const;

// ============================================================
// CONSTANTS
// ============================================================

const EARTH_RADIUS_KM = 6371;
const MAX_SEARCH_RADIUS_KM = 500;

// Recency bands (days since last active)
const RECENCY_BANDS = [
    { maxDays: 7, score: 1.0 },
    { maxDays: 14, score: 0.85 },
    { maxDays: 30, score: 0.6 },
    { maxDays: 60, score: 0.35 },
    { maxDays: 90, score: 0.2 },
    { maxDays: 180, score: 0.1 },
    { maxDays: Infinity, score: 0.02 },
];

// Boost multipliers
const BOOSTS = {
    is_claimed: 1.15,   // claimed always outranks unclaimed
    has_subscription: 1.10,   // paying operators get modest lift
    // NO boost for sponsored — sponsors get separate labeled slot
} as const;

// Penalty multipliers
const PENALTIES = {
    stale_60d: 0.6,
    stale_180d: 0.2,
    no_photo: 0.85,
    zero_reviews: 0.9,
    low_response_rate: 0.85,
    duplicate: 0.0,   // removed from results
} as const;

// ============================================================
// GEO UTILITIES
// ============================================================

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function normalizeDistance(distKm: number, maxKm: number): number {
    return Math.max(0, 1 - distKm / maxKm);
}

// ============================================================
// SCORING
// ============================================================

function computeGeoProximity(listing: DirectoryListing, searchLat: number, searchLon: number, radiusKm: number): number {
    if (!listing.lat || !listing.lon) return 0.1; // unknown location penalized
    const dist = haversineKm(listing.lat, listing.lon, searchLat, searchLon);
    return normalizeDistance(dist, radiusKm);
}

function computeVerification(listing: DirectoryListing): number {
    return listing.verification_tier / 4; // 0-4 → 0-1
}

function computeRecency(listing: DirectoryListing): number {
    if (!listing.last_active_at) return 0.02;
    const daysSince = (Date.now() - new Date(listing.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
    for (const band of RECENCY_BANDS) {
        if (daysSince <= band.maxDays) return band.score;
    }
    return 0.02;
}

function computeReviews(listing: DirectoryListing): number {
    if (listing.review_count === 0) return 0;
    const countNorm = Math.min(listing.review_count / 20, 1); // cap at 20 reviews
    const scoreNorm = listing.avg_review_score / 5;            // 0-5 → 0-1
    return countNorm * 0.4 + scoreNorm * 0.6;
}

function computeResponsiveness(listing: DirectoryListing): number {
    if (listing.response_rate <= 0) return 0;
    let score = listing.response_rate; // 0-1

    // Bonus for fast responders
    if (listing.response_time_p50_seconds !== null) {
        if (listing.response_time_p50_seconds < 300) score = Math.min(1, score * 1.2);      // < 5min
        else if (listing.response_time_p50_seconds < 900) score = Math.min(1, score * 1.1);  // < 15min
    }
    return score;
}

function computePhotoQuality(listing: DirectoryListing): number {
    let score = 0;
    if (listing.has_avatar) score += 0.3;
    if (listing.face_detected) score += 0.3;
    if (listing.equipment_photo_count >= 1) score += 0.2;
    if (listing.equipment_photo_count >= 3) score += 0.2;
    return Math.min(1, score);
}

function computeCoverageBreadth(listing: DirectoryListing): number {
    const corridorScore = Math.min(listing.corridors_claimed / 5, 1);
    const countyScore = Math.min(listing.counties_claimed / 10, 1);
    return corridorScore * 0.6 + countyScore * 0.4;
}

// ============================================================
// MAIN RANKING
// ============================================================

export function rankListing(
    listing: DirectoryListing,
    searchLat: number,
    searchLon: number,
    radiusKm: number = MAX_SEARCH_RADIUS_KM
): RankedListing {
    const breakdown: ScoreBreakdown = {
        geo_proximity: computeGeoProximity(listing, searchLat, searchLon, radiusKm),
        verification: computeVerification(listing),
        recency: computeRecency(listing),
        reviews: computeReviews(listing),
        profile_completeness: listing.profile_completion,
        responsiveness: computeResponsiveness(listing),
        coverage_breadth: computeCoverageBreadth(listing),
        photo_quality: computePhotoQuality(listing),
    };

    // Weighted sum
    let rawScore =
        breakdown.geo_proximity * WEIGHTS.geo_proximity +
        breakdown.verification * WEIGHTS.verification +
        breakdown.recency * WEIGHTS.recency +
        breakdown.reviews * WEIGHTS.reviews +
        breakdown.profile_completeness * WEIGHTS.profile_completeness +
        breakdown.responsiveness * WEIGHTS.responsiveness +
        breakdown.coverage_breadth * WEIGHTS.coverage_breadth +
        breakdown.photo_quality * WEIGHTS.photo_quality;

    // Apply boosts
    const boosts: string[] = [];
    let finalScore = rawScore;

    if (listing.is_claimed) {
        finalScore *= BOOSTS.is_claimed;
        boosts.push('claimed');
    }
    if (listing.has_subscription) {
        finalScore *= BOOSTS.has_subscription;
        boosts.push('subscriber');
    }

    // Apply penalties
    const penalties: string[] = [];

    if (!listing.last_active_at) {
        // No activity — heavy penalty
        finalScore *= PENALTIES.stale_180d;
        penalties.push('never_active');
    } else {
        const daysSince = (Date.now() - new Date(listing.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 180) {
            finalScore *= PENALTIES.stale_180d;
            penalties.push('stale_180d');
        } else if (daysSince > 60) {
            finalScore *= PENALTIES.stale_60d;
            penalties.push('stale_60d');
        }
    }

    if (!listing.has_avatar) {
        finalScore *= PENALTIES.no_photo;
        penalties.push('no_photo');
    }

    if (listing.review_count === 0 && listing.is_claimed) {
        finalScore *= PENALTIES.zero_reviews;
        penalties.push('zero_reviews');
    }

    if (listing.response_rate < 0.3 && listing.is_claimed) {
        finalScore *= PENALTIES.low_response_rate;
        penalties.push('low_response_rate');
    }

    return {
        listing,
        raw_score: rawScore,
        final_score: finalScore,
        rank: 0, // set after sorting
        breakdown,
        penalties,
        boosts,
    };
}

/**
 * Rank a batch of listings for a search query.
 */
export function rankListings(
    listings: DirectoryListing[],
    searchLat: number,
    searchLon: number,
    radiusKm: number = MAX_SEARCH_RADIUS_KM
): RankedListing[] {
    return listings
        .map(l => rankListing(l, searchLat, searchLon, radiusKm))
        .filter(r => r.final_score > 0) // remove duplicates (score=0)
        .sort((a, b) => b.final_score - a.final_score)
        .map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * "Why am I seeing this?" — transparency label for ranking.
 */
export function explainRanking(ranked: RankedListing): string {
    const reasons: string[] = [];

    if (ranked.breakdown.geo_proximity > 0.8) reasons.push('Very close to your search area');
    else if (ranked.breakdown.geo_proximity > 0.5) reasons.push('Near your search area');

    if (ranked.breakdown.verification === 1) reasons.push('Elite verified operator');
    else if (ranked.breakdown.verification >= 0.75) reasons.push('Verified operator');

    if (ranked.breakdown.recency === 1) reasons.push('Active this week');
    else if (ranked.breakdown.recency >= 0.6) reasons.push('Active this month');

    if (ranked.breakdown.reviews > 0.7) reasons.push('Highly rated');

    if (ranked.boosts.includes('claimed')) reasons.push('Claimed profile');

    return reasons.slice(0, 3).join(' · ') || 'Matches your search criteria';
}
