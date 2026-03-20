/**
 * Motive SDK — Barrel Export
 *
 * Import everything from '@/lib/motive'
 */

// Types
export type {
  MotiveOAuthTokenResponse,
  MotiveStoredToken,
  MotiveCompany,
  MotiveUser,
  MotiveVehicle,
  MotiveLocation,
  MotiveVehicleLocation,
  MotiveDriverLocation,
  MotiveHOSLog,
  MotiveHOSStatus,
  MotiveDriverAvailableTime,
  MotiveFreightVehicleLocation,
  MotiveFreightSubscription,
  MotiveNearbyVehicle,
  MotiveNearbyVehicleV2,
  MotiveFuelPurchase,
  MotiveIFTATrip,
  MotiveMileageSummary,
  MotiveScorecardSummary,
  MotivePerformanceEvent,
  MotivePerformanceEventType,
  MotiveInspectionReport,
  MotiveDispatch,
  MotiveDispatchStatus,
  MotiveGeofenceEvent,
  MotiveFaultCode,
  MotiveWebhookPayload,
  MotiveWebhookEventType,
} from './types';

// Client
export {
  MotiveClient,
  MotiveAPIError,
  MotiveRateLimitError,
  getMotiveOAuthURL,
  exchangeMotiveCode,
  refreshMotiveToken,
  createMotiveClient,
} from './client';

// OAuth helpers
export {
  generateMotiveConnectURL,
  parseMotiveOAuthState,
  handleMotiveOAuthCallback,
} from './oauth';

// Webhook helpers
export {
  verifyMotiveWebhookSignature,
  parseMotiveWebhookPayload,
  isRelevantMotiveEvent,
  categorizeMotiveEvent,
} from './webhooks';
