// lib/analytics/booking-events.ts
// PostHog server-side events for the booking/payment flow
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

const POSTHOG_KEY = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

async function captureServerEvent(event: string, distinctId: string, properties: Record<string, unknown>) {
    if (!isEnabled('POSTHOG') || !POSTHOG_KEY) return;

    try {
        await fetch(`${POSTHOG_HOST}/capture/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: POSTHOG_KEY,
                event,
                distinct_id: distinctId,
                properties: {
                    ...properties,
                    $lib: 'haul-command-server',
                    timestamp: new Date().toISOString(),
                },
            }),
        });
    } catch {
        // Non-blocking — analytics should never break revenue flow
    }
}

// ── Booking Flow Events ──

export const BookingEvents = {
    /** Load posted by broker */
    loadPosted: (brokerId: string, props: { request_id: string; country: string; load_type: string }) =>
        captureServerEvent('load_posted', brokerId, props),

    /** Match pipeline generated offers */
    offersGenerated: (brokerId: string, props: { request_id: string; candidate_count: number; offer_count: number }) =>
        captureServerEvent('offers_generated', brokerId, props),

    /** Operator accepted an offer */
    offerAccepted: (operatorId: string, props: { offer_id: string; request_id: string; rate: number }) =>
        captureServerEvent('offer_accepted', operatorId, props),

    /** Booking created with Stripe charge */
    bookingCreated: (brokerId: string, props: {
        job_id: string; escorts: number; total_rate: number; platform_fee_cents: number;
        payment_intent_id?: string; country: string;
    }) =>
        captureServerEvent('booking_created', brokerId, props),

    /** Payment authorized (Stripe) */
    paymentAuthorized: (brokerId: string, props: { job_id: string; amount_cents: number }) =>
        captureServerEvent('payment_authorized', brokerId, props),

    /** Payment captured (after job completion) */
    paymentCaptured: (brokerId: string, props: { job_id: string; amount_cents: number }) =>
        captureServerEvent('payment_captured', brokerId, props),

    /** Payment failed */
    paymentFailed: (brokerId: string, props: { job_id: string; error: string }) =>
        captureServerEvent('payment_failed', brokerId, props),

    /** Job started (in_progress) */
    jobStarted: (operatorId: string, props: { job_id: string }) =>
        captureServerEvent('job_started', operatorId, props),

    /** Job completed */
    jobCompleted: (actorId: string, props: {
        job_id: string; payment_captured: boolean; duration_hours?: number;
    }) =>
        captureServerEvent('job_completed', actorId, props),

    /** Payout ready for admin processing */
    payoutReady: (operatorId: string, props: { job_id: string; amount_cents: number }) =>
        captureServerEvent('payout_ready', operatorId, props),

    /** Payout completed */
    payoutCompleted: (operatorId: string, props: { job_id: string; amount_cents: number }) =>
        captureServerEvent('payout_completed', operatorId, props),

    /** Review submitted */
    reviewSubmitted: (reviewerId: string, props: {
        job_id: string; rating: number; reviewer_role: string; reviewee_id: string;
    }) =>
        captureServerEvent('review_submitted', reviewerId, props),

    /** Booking cancelled */
    bookingCancelled: (actorId: string, props: {
        job_id: string; reason: string; refunded: boolean;
    }) =>
        captureServerEvent('booking_cancelled', actorId, props),

    /** Tracking activated */
    trackingActivated: (operatorId: string, props: { job_id: string; device_count: number }) =>
        captureServerEvent('tracking_activated', operatorId, props),
};

export default BookingEvents;
