
/**
 * Haul Command - Reputation Points Calculator
 * Implements the "Controlled Economy" logic for assigning points.
 */

export type EventType =
    | 'safe_job'
    | 'five_star_bonus'
    | 'zero_cancel_streak'
    | 'referral_verified'
    | 'store_purchase'
    | 'unicorn_verification'
    | 'late_cancel'
    | 'compliance_violation'
    | 'no_show';

export interface ReputationEvent {
    type: EventType;
    provider_id: string;
    meta?: any; // e.g., job_id, purchase_amount
}

export interface PointResult {
    points: number;
    reason: string;
    is_penalty: boolean;
}

const POINT_VALUES: Record<EventType, number> = {
    'safe_job': 100,
    'five_star_bonus': 25,
    'zero_cancel_streak': 200,
    'referral_verified': 150,
    'store_purchase': 20,
    'unicorn_verification': 300,
    'late_cancel': -200,
    'compliance_violation': -500,
    'no_show': -800
};

export function calculatePoints(event: ReputationEvent): PointResult {
    const points = POINT_VALUES[event.type];
    let reason = '';

    switch (event.type) {
        case 'safe_job':
            reason = 'Safe Job Completion (Standard Reward)';
            break;
        case 'five_star_bonus':
            reason = 'Excellence Bonus: 5-Star Rating';
            break;
        case 'zero_cancel_streak':
            reason = 'Reliability Bonus: 30-Day Zero Cancel Streak';
            break;
        case 'referral_verified':
            reason = 'Growth Reward: Verified Referral';
            break;
        case 'store_purchase':
            reason = 'Ecosystem Bonus: Store Purchase';
            break;
        case 'unicorn_verification':
            reason = 'Trust Verification: Unicorn Status Achieved';
            break;
        case 'late_cancel':
            reason = 'Penalty: Late Cancellation (<24h)';
            break;
        case 'compliance_violation':
            reason = 'Severe Penalty: Compliance Violation Detected';
            break;
        case 'no_show':
            reason = 'Critical Penalty: No-Show on Assigned Load';
            break;
    }

    return {
        points,
        reason,
        is_penalty: points < 0
    };
}

export function calculateRank(totalPoints: number): string {
    if (totalPoints >= 500000) return 'Haul Command Vanguard';
    if (totalPoints >= 250000) return 'Freight Titan';
    if (totalPoints >= 100000) return 'National Operator'; // +12 Boost
    if (totalPoints >= 50000) return 'State Dominator'; // +8 Boost
    if (totalPoints >= 25000) return 'Corridor Captain'; // +5 Boost
    if (totalPoints >= 10000) return 'Route Commander';
    if (totalPoints >= 5000) return 'Corridor Operator';
    if (totalPoints >= 2000) return 'Lane Guard';
    if (totalPoints >= 500) return 'Flag Rookie';
    return 'Yard Walker';
}

export function getMatchBoost(rank: string): number {
    switch (rank) {
        case 'Haul Command Vanguard': return 20;
        case 'Freight Titan': return 15;
        case 'National Operator': return 12;
        case 'State Dominator': return 8;
        case 'Corridor Captain': return 5;
        case 'Route Commander': return 3;
        case 'Corridor Operator': return 2;
        case 'Lane Guard': return 1;
        default: return 0;
    }
}
