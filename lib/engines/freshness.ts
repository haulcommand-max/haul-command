/**
 * Freshness Engine
 * 
 * Measures who is actually current, active, and reliable NOW.
 * Feeds into Typesense ranking, Novu alerts, and Recovery Revenue Engine.
 * 
 * Inputs: availability updates, recent actions, response behavior,
 *   recent completions, document currency, app check-ins
 * Outputs: freshness_score, freshness_badges, decay_state, alerts
 */

export interface FreshnessInput {
    operator_id: string;
    last_availability_update: string | null;
    last_profile_edit: string | null;
    last_login: string | null;
    last_app_checkin: string | null;
    last_load_completion: string | null;
    last_response_to_inquiry: string | null;
    docs_expiring_within_30d: number;
    docs_expired: number;
    total_actions_last_7d: number;
    total_actions_last_30d: number;
    response_rate_7d: number; // 0-1
}

export interface FreshnessResult {
    operator_id: string;
    freshness_score: number; // 0-100
    decay_state: 'fresh' | 'warm' | 'cooling' | 'stale' | 'dormant';
    badges: string[];
    alerts: FreshnessAlert[];
    factors: Record<string, { score: number; weight: number; detail: string }>;
    computed_at: string;
}

export interface FreshnessAlert {
    type: 'warning' | 'critical' | 'recovery_opportunity';
    message: string;
    action: string;
    revenue_hook?: string;
}

// Decay thresholds in hours
const DECAY = {
    availability: { fresh: 24, warm: 72, cooling: 168, stale: 336 },
    profile: { fresh: 168, warm: 720, cooling: 2160, stale: 4320 },
    login: { fresh: 48, warm: 168, cooling: 720, stale: 2160 },
    completion: { fresh: 168, warm: 720, cooling: 2160, stale: 4320 },
    response: { fresh: 12, warm: 48, cooling: 168, stale: 720 },
};

function hoursSince(dateStr: string | null): number {
    if (!dateStr) return Infinity;
    return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function decayScore(hours: number, thresholds: { fresh: number; warm: number; cooling: number; stale: number }): number {
    if (hours <= thresholds.fresh) return 100;
    if (hours <= thresholds.warm) {
        return 100 - ((hours - thresholds.fresh) / (thresholds.warm - thresholds.fresh)) * 25;
    }
    if (hours <= thresholds.cooling) {
        return 75 - ((hours - thresholds.warm) / (thresholds.cooling - thresholds.warm)) * 35;
    }
    if (hours <= thresholds.stale) {
        return 40 - ((hours - thresholds.cooling) / (thresholds.stale - thresholds.cooling)) * 30;
    }
    return Math.max(0, 10 - (hours - thresholds.stale) / 720 * 10);
}

export function computeFreshness(input: FreshnessInput): FreshnessResult {
    const factors: Record<string, { score: number; weight: number; detail: string }> = {};

    // 1. Availability recency (35%)
    const availHours = hoursSince(input.last_availability_update);
    factors.availability = {
        score: decayScore(availHours, DECAY.availability),
        weight: 0.35,
        detail: availHours === Infinity ? 'Never updated' : `${Math.round(availHours)}h ago`,
    };

    // 2. Activity volume (20%)
    const activityScore = Math.min(100, (input.total_actions_last_7d * 8) + (input.total_actions_last_30d * 1.5));
    factors.activity = {
        score: activityScore,
        weight: 0.20,
        detail: `${input.total_actions_last_7d} actions/7d, ${input.total_actions_last_30d} actions/30d`,
    };

    // 3. Response behavior (20%)
    const responseHours = hoursSince(input.last_response_to_inquiry);
    const responseScore = Math.min(100, decayScore(responseHours, DECAY.response) * 0.6 + input.response_rate_7d * 40);
    factors.responsiveness = {
        score: responseScore,
        weight: 0.20,
        detail: `${Math.round(input.response_rate_7d * 100)}% rate, last ${Math.round(responseHours)}h ago`,
    };

    // 4. Document currency (15%)
    const docScore = input.docs_expired > 0 ? Math.max(0, 30 - input.docs_expired * 15) :
        input.docs_expiring_within_30d > 0 ? Math.max(40, 80 - input.docs_expiring_within_30d * 10) : 100;
    factors.documents = {
        score: docScore,
        weight: 0.15,
        detail: `${input.docs_expired} expired, ${input.docs_expiring_within_30d} expiring soon`,
    };

    // 5. Login / app presence (10%)
    const loginHours = hoursSince(input.last_login);
    factors.presence = {
        score: decayScore(loginHours, DECAY.login),
        weight: 0.10,
        detail: loginHours === Infinity ? 'Never logged in' : `${Math.round(loginHours)}h ago`,
    };

    // Weighted sum
    let freshness_score = 0;
    for (const f of Object.values(factors)) {
        freshness_score += f.score * f.weight;
    }
    freshness_score = Math.round(Math.max(0, Math.min(100, freshness_score)));

    // Decay state
    const decay_state: FreshnessResult['decay_state'] =
        freshness_score >= 80 ? 'fresh' :
            freshness_score >= 60 ? 'warm' :
                freshness_score >= 40 ? 'cooling' :
                    freshness_score >= 20 ? 'stale' : 'dormant';

    // Badges
    const badges: string[] = [];
    if (freshness_score >= 90) badges.push('lightning_fresh');
    if (input.response_rate_7d >= 0.9) badges.push('rapid_responder');
    if (input.total_actions_last_7d >= 10) badges.push('highly_active');
    if (input.docs_expired === 0 && input.docs_expiring_within_30d === 0) badges.push('docs_current');

    // Alerts
    const alerts: FreshnessAlert[] = [];
    if (decay_state === 'stale' || decay_state === 'dormant') {
        alerts.push({
            type: 'critical',
            message: `Profile freshness is ${decay_state} — ranking is degrading`,
            action: 'Update availability or complete a profile action',
            revenue_hook: 'freshness_rescue',
        });
    }
    if (input.docs_expired > 0) {
        alerts.push({
            type: 'critical',
            message: `${input.docs_expired} expired document(s) detected`,
            action: 'Upload renewed documents to restore verified status',
            revenue_hook: 'fast_track_verification',
        });
    }
    if (input.docs_expiring_within_30d > 0) {
        alerts.push({
            type: 'warning',
            message: `${input.docs_expiring_within_30d} document(s) expiring within 30 days`,
            action: 'Renew before expiration to maintain rank',
        });
    }
    if (decay_state === 'cooling') {
        alerts.push({
            type: 'recovery_opportunity',
            message: 'Your freshness is cooling — a single update could boost your rank',
            action: 'Update your availability status',
            revenue_hook: 'freshness_guard',
        });
    }

    return {
        operator_id: input.operator_id,
        freshness_score,
        decay_state,
        badges,
        alerts,
        factors,
        computed_at: new Date().toISOString(),
    };
}
