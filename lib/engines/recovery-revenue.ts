/**
 * Recovery Revenue Engine
 * 
 * Finds leaking revenue and rescues it automatically.
 * Scans for: unfinished claims, expiring docs, stale freshness,
 * lost rank, failed payments, lapsed sponsors, dormant accounts.
 * 
 * Each recovery opportunity has a revenue_hook that maps to a
 * specific monetization path.
 */

export interface RecoverySignal {
    type: RecoveryType;
    operator_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    revenue_hook: string;
    estimated_recovery_value: number; // USD
    message: string;
    action_label: string;
    action_url: string;
    deadline?: string;
    context: Record<string, unknown>;
}

export type RecoveryType =
    | 'unfinished_claim'
    | 'expiring_docs'
    | 'stale_freshness'
    | 'rank_drop'
    | 'failed_payment'
    | 'lapsed_sponsor'
    | 'dormant_account'
    | 'missed_lead_unlock'
    | 'incomplete_profile'
    | 'expired_boost';

interface OperatorState {
    id: string;
    claim_status: 'unclaimed' | 'started' | 'completed';
    claim_started_at?: string;
    freshness_score: number;
    freshness_previous: number;
    rank_current: number;
    rank_previous: number;
    docs_expiring_within_30d: number;
    docs_expired: number;
    last_login_hours: number;
    profile_completion_pct: number;
    has_active_subscription: boolean;
    last_payment_failed: boolean;
    boost_expires_at?: string;
    sponsor_expires_at?: string;
    missed_lead_unlocks_30d: number;
}

const HOOKS: Record<string, { label: string; value: number }> = {
    fast_track_claim: { label: 'Fast-track Claim', value: 29 },
    claim_rescue: { label: 'Claim Rescue', value: 19 },
    fast_track_verification: { label: 'Fast-track Verification', value: 39 },
    freshness_guard: { label: 'Freshness Guard', value: 9.99 },
    rank_rescue: { label: 'Rank Rescue', value: 14.99 },
    payment_retry: { label: 'Payment Update', value: 29 },
    boost_renewal: { label: 'Boost Renewal', value: 29 },
    sponsor_renewal: { label: 'Sponsor Renewal', value: 99 },
    reactivation_offer: { label: 'Reactivation', value: 19 },
    lead_credit_pack: { label: 'Lead Credits', value: 25 },
    profile_completion: { label: 'Profile Boost', value: 9.99 },
};

export function scanForRecovery(state: OperatorState): RecoverySignal[] {
    const signals: RecoverySignal[] = [];
    const now = Date.now();

    // 1. Unfinished claim
    if (state.claim_status === 'started' && state.claim_started_at) {
        const hoursSince = (now - new Date(state.claim_started_at).getTime()) / 3600000;
        if (hoursSince > 2) {
            signals.push({
                type: 'unfinished_claim',
                operator_id: state.id,
                severity: hoursSince > 48 ? 'high' : 'medium',
                revenue_hook: hoursSince > 48 ? 'fast_track_claim' : 'claim_rescue',
                estimated_recovery_value: hoursSince > 48 ? 29 : 19,
                message: `Claim started ${Math.round(hoursSince)}h ago but never completed`,
                action_label: 'Complete Your Claim',
                action_url: `/claim/resume?operator=${state.id}`,
                context: { hours_since_start: hoursSince },
            });
        }
    }

    // 2. Expiring docs
    if (state.docs_expiring_within_30d > 0) {
        signals.push({
            type: 'expiring_docs',
            operator_id: state.id,
            severity: state.docs_expired > 0 ? 'critical' : 'high',
            revenue_hook: 'fast_track_verification',
            estimated_recovery_value: 39,
            message: `${state.docs_expiring_within_30d} doc(s) expiring soon, ${state.docs_expired} already expired`,
            action_label: 'Renew & Verify Fast',
            action_url: `/settings/documents?operator=${state.id}`,
            context: { expiring: state.docs_expiring_within_30d, expired: state.docs_expired },
        });
    }

    // 3. Stale freshness
    if (state.freshness_score < 40 && state.freshness_previous >= 40) {
        signals.push({
            type: 'stale_freshness',
            operator_id: state.id,
            severity: state.freshness_score < 20 ? 'critical' : 'high',
            revenue_hook: 'freshness_guard',
            estimated_recovery_value: 9.99,
            message: `Freshness dropped from ${state.freshness_previous} to ${state.freshness_score}`,
            action_label: 'Protect Your Freshness',
            action_url: `/settings/freshness?operator=${state.id}`,
            context: { current: state.freshness_score, previous: state.freshness_previous },
        });
    }

    // 4. Rank drop
    if (state.rank_current > state.rank_previous + 5) {
        const drop = state.rank_current - state.rank_previous;
        signals.push({
            type: 'rank_drop',
            operator_id: state.id,
            severity: drop > 20 ? 'critical' : drop > 10 ? 'high' : 'medium',
            revenue_hook: 'rank_rescue',
            estimated_recovery_value: 14.99,
            message: `Rank dropped ${drop} positions (was #${state.rank_previous}, now #${state.rank_current})`,
            action_label: 'Rescue Your Rank',
            action_url: `/boost?operator=${state.id}`,
            context: { current: state.rank_current, previous: state.rank_previous, drop },
        });
    }

    // 5. Failed payment
    if (state.last_payment_failed && state.has_active_subscription) {
        signals.push({
            type: 'failed_payment',
            operator_id: state.id,
            severity: 'critical',
            revenue_hook: 'payment_retry',
            estimated_recovery_value: 29,
            message: 'Payment failed — subscription at risk of cancellation',
            action_label: 'Update Payment Method',
            action_url: `/settings/billing?operator=${state.id}`,
            context: {},
        });
    }

    // 6. Expired boost
    if (state.boost_expires_at) {
        const expiresIn = (new Date(state.boost_expires_at).getTime() - now) / 3600000;
        if (expiresIn > 0 && expiresIn < 48) {
            signals.push({
                type: 'expired_boost',
                operator_id: state.id,
                severity: 'medium',
                revenue_hook: 'boost_renewal',
                estimated_recovery_value: 29,
                message: `Boost expires in ${Math.round(expiresIn)} hours`,
                action_label: 'Renew Your Boost',
                action_url: `/boost?operator=${state.id}&renew=true`,
                deadline: state.boost_expires_at,
                context: { hours_remaining: expiresIn },
            });
        }
    }

    // 7. Dormant account
    if (state.last_login_hours > 720 && state.claim_status === 'completed') {
        signals.push({
            type: 'dormant_account',
            operator_id: state.id,
            severity: state.last_login_hours > 2160 ? 'high' : 'medium',
            revenue_hook: 'reactivation_offer',
            estimated_recovery_value: 19,
            message: `No login for ${Math.round(state.last_login_hours / 24)} days`,
            action_label: 'Come Back & Get Visible',
            action_url: `/reactivate?operator=${state.id}`,
            context: { days_dormant: Math.round(state.last_login_hours / 24) },
        });
    }

    // 8. Missed lead unlocks
    if (state.missed_lead_unlocks_30d >= 3) {
        signals.push({
            type: 'missed_lead_unlock',
            operator_id: state.id,
            severity: 'medium',
            revenue_hook: 'lead_credit_pack',
            estimated_recovery_value: 25,
            message: `${state.missed_lead_unlocks_30d} lead unlock opportunities missed this month`,
            action_label: 'Get Lead Credits',
            action_url: `/settings/credits?operator=${state.id}`,
            context: { missed_count: state.missed_lead_unlocks_30d },
        });
    }

    // 9. Incomplete profile
    if (state.profile_completion_pct < 60 && state.claim_status === 'completed') {
        signals.push({
            type: 'incomplete_profile',
            operator_id: state.id,
            severity: 'low',
            revenue_hook: 'profile_completion',
            estimated_recovery_value: 9.99,
            message: `Profile only ${state.profile_completion_pct}% complete — missing out on visibility`,
            action_label: 'Complete Your Profile',
            action_url: `/profile/edit?operator=${state.id}`,
            context: { completion: state.profile_completion_pct },
        });
    }

    // Sort by severity (critical > high > medium > low)
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    signals.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

    return signals;
}

export function estimateTotalRecovery(signals: RecoverySignal[]): number {
    return signals.reduce((sum, s) => sum + s.estimated_recovery_value, 0);
}

export { HOOKS };
