/**
 * Novu Event Contracts — Payload Types for All Monetization Tables
 * 
 * Every event has:
 *   - Stable event name (string literal)
 *   - Typed payload contract
 *   - Idempotency key format
 *   - Source table reference
 * 
 * @status live — types stable, can be used before Novu API key is set
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD UNLOCK EVENTS
// Source: public.lead_unlocks
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeadUnlockedPayload {
    unlock_id: string;
    operator_id: string;
    buyer_id: string;
    buyer_name?: string;
    operator_name?: string;
    payment_method: 'credit' | 'stripe' | 'plan_included';
    amount_cents: number;
    unlocked_at: string;
}

export interface LeadCreditLowPayload {
    user_id: string;
    credits_remaining: number;
    credits_used_total: number;
    threshold: number; // e.g. 3
}

export interface LeadCreditRefundPayload {
    user_id: string;
    unlock_id: string;
    refund_amount_cents: number;
    reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING EVENTS
// Source: public.training_enrollments
// ═══════════════════════════════════════════════════════════════════════════════

export interface TrainingEnrolledPayload {
    enrollment_id: string;
    user_id: string;
    course_id: string;
    course_name: string;
    enrolled_at: string;
}

export interface TrainingReminderPayload {
    enrollment_id: string;
    user_id: string;
    course_name: string;
    days_since_enrollment: number;
    progress_percent: number;
}

export interface TrainingRenewalDuePayload {
    enrollment_id: string;
    user_id: string;
    course_name: string;
    expiry_date: string;
    days_until_expiry: number;
}

export interface TrainingExpiredPayload {
    enrollment_id: string;
    user_id: string;
    course_name: string;
    expired_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREDENTIAL EVENTS
// Source: public.credential_verifications
// ═══════════════════════════════════════════════════════════════════════════════

export interface CredentialSubmittedPayload {
    verification_id: string;
    operator_id: string;
    credential_type: string;
    submitted_at: string;
}

export interface CredentialApprovedPayload {
    verification_id: string;
    operator_id: string;
    credential_type: string;
    approved_at: string;
    valid_until?: string;
}

export interface CredentialRejectedPayload {
    verification_id: string;
    operator_id: string;
    credential_type: string;
    reason: string;
    rejected_at: string;
}

export interface CredentialExpiringPayload {
    verification_id: string;
    operator_id: string;
    credential_type: string;
    expiry_date: string;
    days_until_expiry: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD ALERT EVENTS
// Source: public.hc_load_alerts
// ═══════════════════════════════════════════════════════════════════════════════

export interface LoadMatchFoundPayload {
    alert_id: string;
    operator_id: string;
    origin: string;
    destination: string;
    load_type: string;
    rate_amount?: number;
    rate_per_mile?: number;
    miles?: number;
    pickup_date?: string;
    urgency: 'standard' | 'priority' | 'emergency';
}

export interface LoadDigestPayload {
    operator_id: string;
    matches_count: number;
    top_matches: Array<{
        origin: string;
        destination: string;
        rate_amount?: number;
    }>;
    period: 'daily' | 'weekly';
}

export interface LoadAlertPausedPayload {
    operator_id: string;
    reason: string;
    paused_at: string;
    resume_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE BOOST EVENTS
// Source: public.profile_boosts
// ═══════════════════════════════════════════════════════════════════════════════

export interface BoostActivatedPayload {
    boost_id: string;
    operator_id: string;
    boost_type: string;
    duration_days: number;
    activated_at: string;
    expires_at: string;
}

export interface BoostExpiringPayload {
    boost_id: string;
    operator_id: string;
    boost_type: string;
    expires_at: string;
    days_until_expiry: number;
}

export interface BoostRenewalDuePayload {
    boost_id: string;
    operator_id: string;
    boost_type: string;
    performance_summary: {
        views_gained: number;
        leads_gained: number;
        rank_change: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERRITORY SPONSORSHIP EVENTS
// Source: public.territory_sponsorships
// ═══════════════════════════════════════════════════════════════════════════════

export interface SponsorshipActivatedPayload {
    sponsorship_id: string;
    sponsor_id: string;
    territory_name: string;
    activated_at: string;
    expires_at: string;
    amount_cents: number;
}

export interface SponsorshipExpiringPayload {
    sponsorship_id: string;
    sponsor_id: string;
    territory_name: string;
    expires_at: string;
    days_until_expiry: number;
}

export interface SponsorshipPaymentFailedPayload {
    sponsorship_id: string;
    sponsor_id: string;
    territory_name: string;
    failure_reason: string;
    retry_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT NAMES — Canonical Registry
// ═══════════════════════════════════════════════════════════════════════════════

export const NOVU_EVENT_NAMES = {
    // Lead Unlocks
    LEAD_UNLOCKED: 'lead.unlocked',
    LEAD_CREDIT_LOW: 'lead.credit_low',
    LEAD_CREDIT_REFUND: 'lead.credit_refund',

    // Training
    TRAINING_ENROLLED: 'training.enrolled',
    TRAINING_REMINDER: 'training.reminder',
    TRAINING_RENEWAL_DUE: 'training.renewal_due',
    TRAINING_EXPIRED: 'training.expired',

    // Credentials
    CREDENTIAL_SUBMITTED: 'credential.submitted',
    CREDENTIAL_APPROVED: 'credential.approved',
    CREDENTIAL_REJECTED: 'credential.rejected',
    CREDENTIAL_EXPIRING: 'credential.expiring',

    // Load Alerts
    LOAD_MATCH_FOUND: 'load.match_found',
    LOAD_DIGEST: 'load.digest',
    LOAD_ALERT_PAUSED: 'load.alert_paused',

    // Profile Boosts
    BOOST_ACTIVATED: 'boost.activated',
    BOOST_EXPIRING: 'boost.expiring',
    BOOST_RENEWAL_DUE: 'boost.renewal_due',

    // Territory Sponsorships
    SPONSORSHIP_ACTIVATED: 'sponsorship.activated',
    SPONSORSHIP_EXPIRING: 'sponsorship.expiring',
    SPONSORSHIP_PAYMENT_FAILED: 'sponsorship.payment_failed',
} as const;

export type NovuEventName = typeof NOVU_EVENT_NAMES[keyof typeof NOVU_EVENT_NAMES];

// ═══════════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY KEY GENERATORS
// Prevents duplicate sends for the same logical event.
// ═══════════════════════════════════════════════════════════════════════════════

export function idempotencyKey(eventName: string, ...parts: string[]): string {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${eventName}:${parts.join(':')}:${date}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT → PAYLOAD TYPE MAP (for TypeScript safety)
// ═══════════════════════════════════════════════════════════════════════════════

export type EventPayloadMap = {
    [NOVU_EVENT_NAMES.LEAD_UNLOCKED]: LeadUnlockedPayload;
    [NOVU_EVENT_NAMES.LEAD_CREDIT_LOW]: LeadCreditLowPayload;
    [NOVU_EVENT_NAMES.LEAD_CREDIT_REFUND]: LeadCreditRefundPayload;
    [NOVU_EVENT_NAMES.TRAINING_ENROLLED]: TrainingEnrolledPayload;
    [NOVU_EVENT_NAMES.TRAINING_REMINDER]: TrainingReminderPayload;
    [NOVU_EVENT_NAMES.TRAINING_RENEWAL_DUE]: TrainingRenewalDuePayload;
    [NOVU_EVENT_NAMES.TRAINING_EXPIRED]: TrainingExpiredPayload;
    [NOVU_EVENT_NAMES.CREDENTIAL_SUBMITTED]: CredentialSubmittedPayload;
    [NOVU_EVENT_NAMES.CREDENTIAL_APPROVED]: CredentialApprovedPayload;
    [NOVU_EVENT_NAMES.CREDENTIAL_REJECTED]: CredentialRejectedPayload;
    [NOVU_EVENT_NAMES.CREDENTIAL_EXPIRING]: CredentialExpiringPayload;
    [NOVU_EVENT_NAMES.LOAD_MATCH_FOUND]: LoadMatchFoundPayload;
    [NOVU_EVENT_NAMES.LOAD_DIGEST]: LoadDigestPayload;
    [NOVU_EVENT_NAMES.LOAD_ALERT_PAUSED]: LoadAlertPausedPayload;
    [NOVU_EVENT_NAMES.BOOST_ACTIVATED]: BoostActivatedPayload;
    [NOVU_EVENT_NAMES.BOOST_EXPIRING]: BoostExpiringPayload;
    [NOVU_EVENT_NAMES.BOOST_RENEWAL_DUE]: BoostRenewalDuePayload;
    [NOVU_EVENT_NAMES.SPONSORSHIP_ACTIVATED]: SponsorshipActivatedPayload;
    [NOVU_EVENT_NAMES.SPONSORSHIP_EXPIRING]: SponsorshipExpiringPayload;
    [NOVU_EVENT_NAMES.SPONSORSHIP_PAYMENT_FAILED]: SponsorshipPaymentFailedPayload;
};
