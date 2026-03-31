// ══════════════════════════════════════════════════════════════
// CAPTURE SYSTEM — Barrel Export
// ══════════════════════════════════════════════════════════════

export {
  // Identity Ladder
  IDENTITY_RUNGS,
  calculateRung,
  inferRole,
  ALERT_CATEGORY_CONFIG,
  type IdentityRung,
  type VisitorIdentity,
  type VisitorRole,
  type AlertCategory,
  type CommunityConfirmation,
  type PageContext,
  type PageType,
  type SavedSearch,
} from './identity-ladder';

export {
  // Capture Router
  decideCaptureOffer,
  shouldTrigger,
  isDismissed,
  markDismissed,
  type CaptureOffer,
  type OfferType,
  type TriggerSignals,
} from './capture-router';

export {
  // Saved Intent
  createSavedIntent,
  shouldSendAlert,
  buildAlertPayload,
  ENTITY_ALERT_MAP,
  type SavedIntent,
  type SavedEntityType,
  type AlertPayload,
} from './saved-intent';

export {
  // Availability Network
  availabilityBoost,
  shouldAutoOffline,
  calculateGapSeverity,
  type OperatorAvailability,
  type AvailabilityStatus,
  type EscortSpecialization,
  type CoverageGap,
} from './availability-network';

export {
  // Community Bridge
  COMMUNITY_BRIDGE_STEPS,
  getBridgeProgress,
  createDefaultMembership,
  generateGroupInviteUrl,
  type CommunityMembership,
  type CommunityPlatform,
  type ConfirmationSource,
} from './community-bridge';
