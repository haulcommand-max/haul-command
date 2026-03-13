/**
 * lib/novu — Notification Brain Central
 * 
 * Re-exports all Novu notification infrastructure from one import.
 * 
 * Usage:
 *   import { emitNotification, NOVU_EVENT_NAMES } from '@/lib/novu';
 */

export { getNovuClient, isNovuDryRun } from './client';
export { emitNotification, emitBatch, type EmitResult, type EmitOptions, type NovuPayload } from './emitter';
export { NOVU_EVENT_NAMES, idempotencyKey, type NovuEventName, type EventPayloadMap } from './events';

// Re-export all payload types for consumers
export type {
    LeadUnlockedPayload,
    LeadCreditLowPayload,
    LeadCreditRefundPayload,
    TrainingEnrolledPayload,
    TrainingReminderPayload,
    TrainingRenewalDuePayload,
    TrainingExpiredPayload,
    CredentialSubmittedPayload,
    CredentialApprovedPayload,
    CredentialRejectedPayload,
    CredentialExpiringPayload,
    LoadMatchFoundPayload,
    LoadDigestPayload,
    LoadAlertPausedPayload,
    BoostActivatedPayload,
    BoostExpiringPayload,
    BoostRenewalDuePayload,
    SponsorshipActivatedPayload,
    SponsorshipExpiringPayload,
    SponsorshipPaymentFailedPayload,
} from './events';

// Inline trigger convenience functions
export {
    notifyLeadUnlocked,
    notifyTrainingEnrolled,
    notifyCredentialSubmitted,
    notifyCredentialApproved,
    notifyCredentialRejected,
    notifyLoadMatchFound,
    notifyBoostActivated,
    notifySponsorshipActivated,
    notifySponsorshipPaymentFailed,
} from './triggers';
