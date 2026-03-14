// ============================================================
// Trigger.dev — Background Job Orchestration
// Handles: trust recompute, doc expiry, claim nudges, AI batch
// Feature flag: TRIGGER_DEV
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

const TRIGGER_API_KEY = process.env.TRIGGER_API_KEY || '';
const TRIGGER_API_URL = process.env.TRIGGER_API_URL || 'https://api.trigger.dev';

// ── Job Types ──
export type JobType =
    | 'trust_score_recompute'
    | 'document_expiry_check'
    | 'claim_nudge_sequence'
    | 'profile_completion_reminder'
    | 'reactivation_campaign'
    | 'duplicate_detection_batch'
    | 'document_ocr_pipeline'
    | 'ranking_recompute'
    | 'voice_call_enqueue'
    | 'partner_offer_timing'
    | 'seo_generation_batch'
    | 'anomaly_check'
    | 'enrichment_job'
    | 'claim_funnel_anomaly'
    // ── Marketplace / Booking Jobs ──
    | 'review_request'
    | 'payout_check'
    | 'offer_expiry'
    | 'job_timeout_check'
    | 'booking_confirmation'
    | 'typesense_incremental_sync';

interface TriggerJobPayload {
    type: JobType;
    data: Record<string, unknown>;
    delay?: string; // e.g., '15m', '2h', '24h'
    idempotencyKey?: string;
}

// ── Trigger a background job ──
export async function triggerJob(payload: TriggerJobPayload): Promise<{ jobId: string }> {
    if (!isEnabled('TRIGGER_DEV') || !TRIGGER_API_KEY) {
        console.warn('[Trigger.dev] Disabled or missing key — job queued locally only');
        return { jobId: `local-${Date.now()}` };
    }

    const res = await fetch(`${TRIGGER_API_URL}/api/v1/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TRIGGER_API_KEY}`,
        },
        body: JSON.stringify({
            name: payload.type,
            payload: payload.data,
            ...(payload.delay ? { deliverAfter: payload.delay } : {}),
            ...(payload.idempotencyKey ? { id: payload.idempotencyKey } : {}),
        }),
    });

    if (!res.ok) {
        console.error('[Trigger.dev] Job trigger failed:', res.statusText);
        return { jobId: `failed-${Date.now()}` };
    }

    const data = await res.json();
    return { jobId: data.id || `trigger-${Date.now()}` };
}

// ── Claim Flow Jobs ──
export const ClaimJobs = {
    /** Send nudge after claim start with no OTP completion */
    scheduleOtpReminder: (surfaceId: string, delay: string = '15m') =>
        triggerJob({
            type: 'claim_nudge_sequence',
            data: { surface_id: surfaceId, stage: 'otp_reminder' },
            delay,
            idempotencyKey: `otp-remind-${surfaceId}`,
        }),

    /** Send nudge after ownership with no profile progress */
    scheduleCompletionReminder: (surfaceId: string, delay: string = '2h') =>
        triggerJob({
            type: 'profile_completion_reminder',
            data: { surface_id: surfaceId },
            delay,
            idempotencyKey: `complete-remind-${surfaceId}`,
        }),

    /** Recompute trust score after document verification */
    recomputeTrustScore: (entityId: string) =>
        triggerJob({
            type: 'trust_score_recompute',
            data: { entity_id: entityId },
            idempotencyKey: `trust-recomp-${entityId}-${Date.now()}`,
        }),

    /** Check document expiry dates across all operators */
    scheduleExpiryCheck: () =>
        triggerJob({
            type: 'document_expiry_check',
            data: { check_type: 'all_operators' },
        }),

    /** Queue voice call for high-value stalled claim */
    enqueueVoiceCall: (surfaceId: string, playbook: string) =>
        triggerJob({
            type: 'voice_call_enqueue',
            data: { surface_id: surfaceId, playbook },
            delay: '1h',
        }),

    /** Detect and flag duplicate claims */
    runDuplicateDetection: (surfaceId: string) =>
        triggerJob({
            type: 'duplicate_detection_batch',
            data: { surface_id: surfaceId },
        }),

    /** Reactivate stale listings */
    startReactivation: (surfaceId: string) =>
        triggerJob({
            type: 'reactivation_campaign',
            data: { surface_id: surfaceId },
        }),

    /** Process uploaded document through OCR */
    processDocumentOcr: (documentId: string, docType: string) =>
        triggerJob({
            type: 'document_ocr_pipeline',
            data: { document_id: documentId, doc_type: docType },
        }),
};

// ── SEO & Content Jobs ──
export const ContentJobs = {
    generateSeoPages: (country: string, batchSize: number = 50) =>
        triggerJob({
            type: 'seo_generation_batch',
            data: { country, batch_size: batchSize },
        }),

    enrichOperator: (entityId: string) =>
        triggerJob({
            type: 'enrichment_job',
            data: { entity_id: entityId },
        }),
};

// ── Monitoring Jobs ──
export const MonitoringJobs = {
    runAnomalyCheck: (metric: string) =>
        triggerJob({
            type: 'anomaly_check',
            data: { metric },
        }),

    checkClaimFunnel: () =>
        triggerJob({
            type: 'claim_funnel_anomaly',
            data: { check_type: 'daily' },
        }),
};
