
/**
 * Haul Command - Points Calculator Verification (Standalone JS)
 * Logic from core/reputation/points_calculator.ts
 */

const POINT_VALUES = {
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

function calculatePoints(event) {
    const points = POINT_VALUES[event.type];
    let reason = '';

    switch (event.type) {
        case 'safe_job': reason = 'Safe Job Completion (Standard Reward)'; break;
        case 'five_star_bonus': reason = 'Excellence Bonus: 5-Star Rating'; break;
        case 'zero_cancel_streak': reason = 'Reliability Bonus: 30-Day Zero Cancel Streak'; break;
        case 'referral_verified': reason = 'Growth Reward: Verified Referral'; break;
        case 'store_purchase': reason = 'Ecosystem Bonus: Store Purchase'; break;
        case 'unicorn_verification': reason = 'Trust Verification: Unicorn Status Achieved'; break;
        case 'late_cancel': reason = 'Penalty: Late Cancellation (<24h)'; break;
        case 'compliance_violation': reason = 'Severe Penalty: Compliance Violation Detected'; break;
        case 'no_show': reason = 'Critical Penalty: No-Show on Assigned Load'; break;
    }

    return { points, reason, is_penalty: points < 0 };
}

function calculateRank(totalPoints) {
    if (totalPoints >= 500000) return 'Haul Command Vanguard';
    if (totalPoints >= 250000) return 'Freight Titan';
    if (totalPoints >= 100000) return 'National Operator';
    if (totalPoints >= 50000) return 'State Dominator';
    if (totalPoints >= 25000) return 'Corridor Captain';
    if (totalPoints >= 10000) return 'Route Commander';
    if (totalPoints >= 5000) return 'Corridor Operator';
    if (totalPoints >= 2000) return 'Lane Guard';
    if (totalPoints >= 500) return 'Flag Rookie';
    return 'Yard Walker';
}

function getMatchBoost(rank) {
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

// --- TEST CASES ---
console.log('--- TEST 1: Point Calculations ---');
const events = [
    { type: 'safe_job', provider_id: '123' },
    { type: 'no_show', provider_id: '123' }
];

events.forEach(e => {
    const res = calculatePoints(e);
    console.log(`Event: ${e.type.padEnd(20)} | Points: ${res.points.toString().padStart(4)} | Reason: ${res.reason}`);
});

console.log('\n--- TEST 2: Rank Progression ---');
const scores = [0, 600, 5500, 26000, 150000, 600000];
scores.forEach(score => {
    const rank = calculateRank(score);
    const boost = getMatchBoost(rank);
    console.log(`Score: ${score.toString().padEnd(7)} -> Rank: ${rank.padEnd(25)} | Boost: +${boost}`);
});
