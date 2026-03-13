/**
 * Novu Inline Triggers — Wire Points
 * 
 * Helper functions that wrap common notification emits.
 * Call these from your API routes / server actions when 
 * the triggering action happens (e.g., lead unlock, enrollment, etc.)
 * 
 * These are convenience wrappers around emitNotification()
 * with pre-filled event names and payload constructors.
 * 
 * @status wired_not_live
 */

import { emitNotification, NOVU_EVENT_NAMES, idempotencyKey } from './index';
import type {
    LeadUnlockedPayload,
    TrainingEnrolledPayload,
    CredentialSubmittedPayload,
    CredentialApprovedPayload,
    CredentialRejectedPayload,
    LoadMatchFoundPayload,
    BoostActivatedPayload,
    SponsorshipActivatedPayload,
    SponsorshipPaymentFailedPayload,
} from './events';

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD UNLOCK TRIGGERS
// Wire into: app/api/leads/route.ts (POST unlock action)
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyLeadUnlocked(data: {
    unlock_id: string;
    operator_id: string;
    buyer_id: string;
    buyer_name?: string;
    operator_name?: string;
    payment_method: 'credit' | 'stripe' | 'plan_included';
    amount_cents: number;
}) {
    // Notify the OPERATOR that someone unlocked their contact
    return emitNotification(
        NOVU_EVENT_NAMES.LEAD_UNLOCKED,
        {
            ...data,
            unlocked_at: new Date().toISOString(),
        },
        {
            subscriberId: data.operator_id,
            idempotencyKey: idempotencyKey('lead.unlocked', data.unlock_id),
        },
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING TRIGGERS
// Wire into: app/api/training/route.ts (enrollment action)
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyTrainingEnrolled(data: {
    enrollment_id: string;
    user_id: string;
    course_id: string;
    course_name: string;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.TRAINING_ENROLLED,
        {
            ...data,
            enrolled_at: new Date().toISOString(),
        },
        {
            subscriberId: data.user_id,
            idempotencyKey: idempotencyKey('training.enrolled', data.enrollment_id),
        },
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREDENTIAL TRIGGERS
// Wire into: credential upload / admin review actions  
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyCredentialSubmitted(data: {
    verification_id: string;
    operator_id: string;
    credential_type: string;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.CREDENTIAL_SUBMITTED,
        {
            ...data,
            submitted_at: new Date().toISOString(),
        },
        {
            subscriberId: data.operator_id,
            idempotencyKey: idempotencyKey('credential.submitted', data.verification_id),
        },
    );
}

export async function notifyCredentialApproved(data: {
    verification_id: string;
    operator_id: string;
    credential_type: string;
    valid_until?: string;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.CREDENTIAL_APPROVED,
        {
            ...data,
            approved_at: new Date().toISOString(),
        },
        {
            subscriberId: data.operator_id,
            idempotencyKey: idempotencyKey('credential.approved', data.verification_id),
        },
    );
}

export async function notifyCredentialRejected(data: {
    verification_id: string;
    operator_id: string;
    credential_type: string;
    reason: string;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.CREDENTIAL_REJECTED,
        {
            ...data,
            rejected_at: new Date().toISOString(),
        },
        {
            subscriberId: data.operator_id,
            idempotencyKey: idempotencyKey('credential.rejected', data.verification_id),
        },
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD MATCH TRIGGERS
// Wire into: load matching engine / alert parser
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyLoadMatchFound(data: {
    alert_id: string;
    operator_id: string;
    origin: string;
    destination: string;
    load_type: string;
    rate_amount?: number;
    rate_per_mile?: number;
    miles?: number;
    pickup_date?: string;
    urgency?: 'standard' | 'priority' | 'emergency';
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.LOAD_MATCH_FOUND,
        {
            ...data,
            urgency: data.urgency || 'standard',
        },
        {
            subscriberId: data.operator_id,
            idempotencyKey: idempotencyKey('load.match_found', data.alert_id),
        },
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOST / SPONSORSHIP TRIGGERS
// Wire into: Stripe webhook handlers / admin activation
// ═══════════════════════════════════════════════════════════════════════════════

export async function notifyBoostActivated(data: {
    boost_id: string;
    operator_id: string;
    boost_type: string;
    duration_days: number;
    expires_at: string;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.BOOST_ACTIVATED,
        {
            ...data,
            activated_at: new Date().toISOString(),
        },
        {
            subscriberId: data.operator_id,
            idempotencyKey: idempotencyKey('boost.activated', data.boost_id),
        },
    );
}

export async function notifySponsorshipActivated(data: {
    sponsorship_id: string;
    sponsor_id: string;
    territory_name: string;
    expires_at: string;
    amount_cents: number;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.SPONSORSHIP_ACTIVATED,
        {
            ...data,
            activated_at: new Date().toISOString(),
        },
        {
            subscriberId: data.sponsor_id,
            idempotencyKey: idempotencyKey('sponsorship.activated', data.sponsorship_id),
        },
    );
}

export async function notifySponsorshipPaymentFailed(data: {
    sponsorship_id: string;
    sponsor_id: string;
    territory_name: string;
    failure_reason: string;
    retry_at?: string;
}) {
    return emitNotification(
        NOVU_EVENT_NAMES.SPONSORSHIP_PAYMENT_FAILED,
        data,
        {
            subscriberId: data.sponsor_id,
            idempotencyKey: idempotencyKey('sponsorship.payment_failed', data.sponsorship_id),
        },
    );
}
