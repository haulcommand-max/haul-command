/**
 * HAUL COMMAND — Trust Score Engine
 * Calculates composite trust score from behavioral + compliance signals.
 * Trust Score = weighted composite of verification, reliability, and freshness.
 */

export interface TrustInputs {
    // Verification (0-1 each)
    identity_verified: boolean;
    insurance_verified: boolean;
    insurance_expires_at?: string;
    license_verified: boolean;
    equipment_verified: boolean;
    background_check: boolean;

    // Reliability metrics
    completion_rate: number;       // 0-1
    cancellation_rate: number;     // 0-1 (lower is better)
    on_time_rate: number;          // 0-1
    avg_response_minutes: number;  // lower is better
    dispute_rate: number;          // 0-1 (lower is better)
    incident_free_streak: number;  // count

    // Experience
    total_completions: number;
    corridor_completions: number;  // for specific corridor
    months_active: number;
    repeat_booking_rate: number;   // 0-1

    // Freshness
    last_active_at?: string;
    profile_completeness: number;  // 0-1
    last_doc_update_at?: string;
}

export interface TrustScore {
    overall: number;           // 0-100
    verification: number;      // 0-100
    reliability: number;       // 0-100
    experience: number;        // 0-100
    freshness: number;         // 0-100
    tier: 'elite' | 'strong' | 'verified' | 'basic' | 'unverified';
    badges: TrustBadge[];
    warnings: string[];
    fit_score?: number;        // 0-100 (for specific load)
}

export interface TrustBadge {
    id: string;
    label: string;
    icon: string;
    color: string;
    verified: boolean;
    expires_at?: string;
    days_until_expiry?: number;
}

const WEIGHTS = {
    verification: 0.30,
    reliability: 0.35,
    experience: 0.15,
    freshness: 0.20,
};

export function calculateTrustScore(inputs: TrustInputs): TrustScore {
    // ── Verification Score ──
    const verChecks = [
        inputs.identity_verified,
        inputs.insurance_verified,
        inputs.license_verified,
        inputs.equipment_verified,
        inputs.background_check,
    ];
    const verScore = (verChecks.filter(Boolean).length / verChecks.length) * 100;

    // Insurance expiry penalty
    let insurancePenalty = 0;
    if (inputs.insurance_expires_at) {
        const daysLeft = Math.floor((new Date(inputs.insurance_expires_at).getTime() - Date.now()) / 86400000);
        if (daysLeft < 0) insurancePenalty = 30;
        else if (daysLeft < 7) insurancePenalty = 15;
        else if (daysLeft < 30) insurancePenalty = 5;
    }

    const verification = Math.max(0, verScore - insurancePenalty);

    // ── Reliability Score ──
    const completionWeight = Math.min(inputs.completion_rate * 100, 100) * 0.30;
    const cancellationWeight = Math.max(0, (1 - inputs.cancellation_rate) * 100) * 0.20;
    const onTimeWeight = Math.min(inputs.on_time_rate * 100, 100) * 0.25;
    const responseWeight = Math.max(0, Math.min(100, 100 - inputs.avg_response_minutes * 2)) * 0.15;
    const disputeWeight = Math.max(0, (1 - inputs.dispute_rate * 5) * 100) * 0.10;
    const reliability = completionWeight + cancellationWeight + onTimeWeight + responseWeight + disputeWeight;

    // ── Experience Score ──
    const completionScore = Math.min(inputs.total_completions / 50, 1) * 40;
    const corridorScore = Math.min(inputs.corridor_completions / 10, 1) * 25;
    const tenureScore = Math.min(inputs.months_active / 24, 1) * 15;
    const repeatScore = inputs.repeat_booking_rate * 20;
    const experience = completionScore + corridorScore + tenureScore + repeatScore;

    // ── Freshness Score ──
    let freshness = inputs.profile_completeness * 50;
    if (inputs.last_active_at) {
        const daysSince = Math.floor((Date.now() - new Date(inputs.last_active_at).getTime()) / 86400000);
        if (daysSince < 1) freshness += 50;
        else if (daysSince < 3) freshness += 40;
        else if (daysSince < 7) freshness += 30;
        else if (daysSince < 14) freshness += 20;
        else if (daysSince < 30) freshness += 10;
        // >30 days = 0 freshness bonus
    }

    // ── Overall ──
    const overall = Math.round(
        verification * WEIGHTS.verification +
        reliability * WEIGHTS.reliability +
        experience * WEIGHTS.experience +
        freshness * WEIGHTS.freshness
    );

    // ── Tier ──
    let tier: TrustScore['tier'] = 'unverified';
    if (overall >= 90 && verification >= 80) tier = 'elite';
    else if (overall >= 75 && verification >= 60) tier = 'strong';
    else if (overall >= 50 && verification >= 40) tier = 'verified';
    else if (overall >= 25) tier = 'basic';

    // ── Badges ──
    const badges: TrustBadge[] = [];
    if (inputs.identity_verified) badges.push({ id: 'id', label: 'Identity Verified', icon: '🪪', color: '#10B981', verified: true });
    if (inputs.insurance_verified) {
        const daysLeft = inputs.insurance_expires_at ? Math.floor((new Date(inputs.insurance_expires_at).getTime() - Date.now()) / 86400000) : undefined;
        badges.push({
            id: 'insurance', label: 'Insurance Verified', icon: '🛡️',
            color: daysLeft !== undefined && daysLeft < 30 ? '#F59E0B' : '#10B981',
            verified: true, expires_at: inputs.insurance_expires_at, days_until_expiry: daysLeft,
        });
    }
    if (inputs.license_verified) badges.push({ id: 'license', label: 'Licensed', icon: '📋', color: '#10B981', verified: true });
    if (inputs.equipment_verified) badges.push({ id: 'equipment', label: 'Equipment Verified', icon: '🚗', color: '#10B981', verified: true });
    if (inputs.background_check) badges.push({ id: 'bg', label: 'Background Check', icon: '✅', color: '#10B981', verified: true });
    if (tier === 'elite') badges.push({ id: 'elite', label: 'Elite Operator', icon: '🔥', color: '#F59E0B', verified: true });
    if (inputs.incident_free_streak >= 50) badges.push({ id: 'safety', label: `${inputs.incident_free_streak} Incident-Free`, icon: '🏅', color: '#8B5CF6', verified: true });

    // ── Warnings ──
    const warnings: string[] = [];
    if (insurancePenalty > 0) {
        const d = inputs.insurance_expires_at ? Math.floor((new Date(inputs.insurance_expires_at).getTime() - Date.now()) / 86400000) : -1;
        if (d < 0) warnings.push('Insurance expired');
        else warnings.push(`Insurance expires in ${d} days`);
    }
    if (inputs.cancellation_rate > 0.15) warnings.push('High cancellation rate');
    if (inputs.avg_response_minutes > 30) warnings.push('Slow response time');
    if (inputs.profile_completeness < 0.5) warnings.push('Profile incomplete');

    return {
        overall, verification: Math.round(verification), reliability: Math.round(reliability),
        experience: Math.round(experience), freshness: Math.round(freshness),
        tier, badges, warnings,
    };
}

/** Calculate fit score for a specific load */
export function calculateFitScore(
    trust: TrustScore,
    loadFactors: {
        corridor_match: boolean;
        state_compliant: boolean;
        load_type_experience: number;  // 0-1
        distance_miles: number;
        available_now: boolean;
        language_match: boolean;
    }
): number {
    let fit = trust.overall * 0.40;
    if (loadFactors.corridor_match) fit += 15;
    if (loadFactors.state_compliant) fit += 15;
    fit += loadFactors.load_type_experience * 10;
    if (loadFactors.available_now) fit += 10;
    if (loadFactors.language_match) fit += 5;
    if (loadFactors.distance_miles < 50) fit += 5;
    else if (loadFactors.distance_miles < 100) fit += 3;
    return Math.min(100, Math.round(fit));
}
