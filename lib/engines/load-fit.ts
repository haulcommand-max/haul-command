/**
 * Load Fit Engine
 * 
 * Ranks the best operator for a specific move/load.
 * Combines: route proximity, corridor familiarity, equipment match,
 * credentials, freshness, response history, deadhead cost.
 * 
 * Powers: broker shortlists, dispatch waves, compare pages
 */

export interface LoadProfile {
    load_id: string;
    origin: { lat: number; lng: number; city: string; state: string };
    destination: { lat: number; lng: number; city: string; state: string };
    corridor: string;
    required_role: string; // 'pilot_car' | 'chase_car' | 'lead_car'
    requires_height_pole: boolean;
    requires_certifications: string[];
    urgency: 'standard' | 'rush' | 'emergency';
    start_date: string;
    estimated_miles: number;
}

export interface OperatorProfile {
    operator_id: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
    role_subtypes: string[];
    has_height_pole: boolean;
    certifications: string[];
    trust_score: number;
    freshness_score: number;
    reputation_score: number;
    response_rate_7d: number;
    avg_response_time_minutes: number;
    completed_jobs_90d: number;
    corridors_familiar: string[];
    is_available: boolean;
    is_dispatch_ready: boolean;
    boost_tier: string | null;
}

export interface FitResult {
    operator_id: string;
    fit_score: number; // 0-100
    confidence: number; // 0-1
    deadhead_miles: number;
    factors: Record<string, { score: number; weight: number; detail: string }>;
    disqualified: boolean;
    disqualify_reason?: string;
    wave_priority: number; // lower = contacted first
}

// Haversine distance in miles
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function proximityScore(miles: number): number {
    if (miles <= 25) return 100;
    if (miles <= 50) return 90;
    if (miles <= 100) return 75;
    if (miles <= 200) return 55;
    if (miles <= 300) return 35;
    if (miles <= 500) return 15;
    return 0;
}

export function scoreOperatorFit(load: LoadProfile, operator: OperatorProfile): FitResult {
    const factors: FitResult['factors'] = {};

    // Hard disqualifiers
    if (!operator.is_available) {
        return { operator_id: operator.operator_id, fit_score: 0, confidence: 1, deadhead_miles: 0, factors: {}, disqualified: true, disqualify_reason: 'Not available', wave_priority: 999 };
    }
    if (load.requires_height_pole && !operator.has_height_pole) {
        return { operator_id: operator.operator_id, fit_score: 0, confidence: 1, deadhead_miles: 0, factors: {}, disqualified: true, disqualify_reason: 'Missing height pole equipment', wave_priority: 999 };
    }
    if (!operator.role_subtypes.includes(load.required_role)) {
        return { operator_id: operator.operator_id, fit_score: 0, confidence: 1, deadhead_miles: 0, factors: {}, disqualified: true, disqualify_reason: `Role mismatch: needs ${load.required_role}`, wave_priority: 999 };
    }

    // Check required certs
    const missingCerts = load.requires_certifications.filter(c => !operator.certifications.includes(c));
    if (missingCerts.length > 0) {
        return { operator_id: operator.operator_id, fit_score: 0, confidence: 1, deadhead_miles: 0, factors: {}, disqualified: true, disqualify_reason: `Missing certifications: ${missingCerts.join(', ')}`, wave_priority: 999 };
    }

    // 1. Proximity / Deadhead (30%)
    const deadhead = haversine(operator.lat, operator.lng, load.origin.lat, load.origin.lng);
    factors.proximity = {
        score: proximityScore(deadhead),
        weight: 0.30,
        detail: `${Math.round(deadhead)} miles deadhead`,
    };

    // 2. Corridor familiarity (15%)
    const corridorFamiliar = operator.corridors_familiar.includes(load.corridor);
    const destStateFamiliar = operator.corridors_familiar.some(c => c.includes(load.destination.state));
    factors.corridor = {
        score: corridorFamiliar ? 100 : destStateFamiliar ? 50 : 10,
        weight: 0.15,
        detail: corridorFamiliar ? 'Familiar corridor' : destStateFamiliar ? 'Familiar destination state' : 'New corridor',
    };

    // 3. Trust & reputation (20%)
    factors.trust = {
        score: Math.min(100, (operator.trust_score * 0.4) + (operator.reputation_score * 0.6)),
        weight: 0.20,
        detail: `Trust: ${operator.trust_score}, Rep: ${operator.reputation_score}`,
    };

    // 4. Freshness (15%)
    factors.freshness = {
        score: operator.freshness_score,
        weight: 0.15,
        detail: `Freshness: ${operator.freshness_score}`,
    };

    // 5. Response history (10%)
    const responseScore = Math.min(100,
        (operator.response_rate_7d * 60) +
        Math.max(0, 40 - operator.avg_response_time_minutes)
    );
    factors.responsiveness = {
        score: responseScore,
        weight: 0.10,
        detail: `${Math.round(operator.response_rate_7d * 100)}% rate, ${Math.round(operator.avg_response_time_minutes)}min avg`,
    };

    // 6. Experience volume (10%)
    const expScore = Math.min(100, operator.completed_jobs_90d * 5);
    factors.experience = {
        score: expScore,
        weight: 0.10,
        detail: `${operator.completed_jobs_90d} jobs in 90d`,
    };

    // Weighted total
    let fit_score = 0;
    for (const f of Object.values(factors)) {
        fit_score += f.score * f.weight;
    }

    // Boost multiplier
    const boostMultipliers: Record<string, number> = { premium: 1.08, featured: 1.05, spotlight: 1.02 };
    if (operator.boost_tier && boostMultipliers[operator.boost_tier]) {
        fit_score *= boostMultipliers[operator.boost_tier];
    }

    // Dispatch-ready bonus
    if (operator.is_dispatch_ready) {
        fit_score *= 1.03;
    }

    // Urgency adjustment
    if (load.urgency === 'emergency') {
        // Weight proximity and responsiveness much higher
        fit_score = fit_score * 0.5 + (factors.proximity.score * 0.3 + factors.responsiveness.score * 0.2);
    }

    fit_score = Math.round(Math.max(0, Math.min(100, fit_score)));

    // Confidence based on data quality
    let confidence = 0.5;
    if (operator.completed_jobs_90d >= 5) confidence += 0.15;
    if (operator.freshness_score >= 60) confidence += 0.1;
    if (operator.response_rate_7d > 0) confidence += 0.15;
    if (corridorFamiliar) confidence += 0.1;
    confidence = Math.min(1, confidence);

    // Wave priority (lower = first to contact)
    const wave_priority = Math.round(100 - fit_score + (deadhead / 10));

    return {
        operator_id: operator.operator_id,
        fit_score,
        confidence,
        deadhead_miles: Math.round(deadhead),
        factors,
        disqualified: false,
        wave_priority,
    };
}

export function rankOperatorsForLoad(load: LoadProfile, operators: OperatorProfile[]): FitResult[] {
    return operators
        .map(op => scoreOperatorFit(load, op))
        .filter(r => !r.disqualified)
        .sort((a, b) => b.fit_score - a.fit_score);
}

export function buildShortlist(load: LoadProfile, operators: OperatorProfile[], maxSize: number = 5): FitResult[] {
    const ranked = rankOperatorsForLoad(load, operators);
    return ranked.slice(0, maxSize);
}
