// ============================================================
// Trigger.dev — Booking / Marketplace Jobs
// Delayed review requests, payout monitoring, job timeout
// ============================================================

import { triggerJob, type JobType } from '@/lib/trigger';

// Extend job types for marketplace
const MARKETPLACE_JOBS = {
    /** Request reviews 1 hour after job completion */
    scheduleReviewRequest: (jobId: string, brokerId: string, escortIds: string[]) =>
        triggerJob({
            type: 'review_request' as JobType,
            data: { job_id: jobId, broker_id: brokerId, escort_ids: escortIds },
            delay: '1h',
            idempotencyKey: `review-req-${jobId}`,
        }),

    /** Check payout status 3 days after completion (escrow release) */
    schedulePayoutCheck: (jobId: string) =>
        triggerJob({
            type: 'payout_check' as JobType,
            data: { job_id: jobId },
            delay: '72h',
            idempotencyKey: `payout-check-${jobId}`,
        }),

    /** Auto-cancel unaccepted offers after 2 hours */
    scheduleOfferExpiry: (requestId: string) =>
        triggerJob({
            type: 'offer_expiry' as JobType,
            data: { request_id: requestId },
            delay: '2h',
            idempotencyKey: `offer-expire-${requestId}`,
        }),

    /** Monitor job that's been in_progress too long (24h) */
    scheduleJobTimeoutCheck: (jobId: string) =>
        triggerJob({
            type: 'job_timeout_check' as JobType,
            data: { job_id: jobId },
            delay: '24h',
            idempotencyKey: `job-timeout-${jobId}`,
        }),

    /** Send booking confirmation SMS/push after short delay */
    scheduleBookingConfirmation: (jobId: string, delay: string = '30s') =>
        triggerJob({
            type: 'booking_confirmation' as JobType,
            data: { job_id: jobId },
            delay,
            idempotencyKey: `booking-confirm-${jobId}`,
        }),

    /** Trigger trust score recompute after review is submitted */
    recomputeTrustAfterReview: (revieweeId: string, jobId: string) =>
        triggerJob({
            type: 'trust_score_recompute' as JobType,
            data: { entity_id: revieweeId, trigger: 'review_submitted', job_id: jobId },
            idempotencyKey: `trust-review-${revieweeId}-${jobId}`,
        }),
};

export default MARKETPLACE_JOBS;
