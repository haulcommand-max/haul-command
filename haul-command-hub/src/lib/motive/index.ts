/**
 * Motive SDK — Barrel export
 *
 * Single entry point for the Motive integration SDK.
 * Re-exports from the local canonical implementation.
 */

// Client & OAuth
export {
  MotiveClient,
  MotiveAPIError,
  MotiveRateLimitError,
  getMotiveOAuthURL,
  exchangeMotiveCode,
  refreshMotiveToken,
  createMotiveClient,
} from './client';

// OAuth flow helpers
export {
  generateMotiveConnectURL,
  parseMotiveOAuthState,
  handleMotiveOAuthCallback,
  type MotiveConnectResult,
} from './oauth';

// Webhook utilities
export {
  verifyMotiveWebhookSignature,
  parseMotiveWebhookPayload,
  isRelevantMotiveEvent,
  categorizeMotiveEvent,
} from './webhooks';

// Types — re-export everything from types
export type {
  MotiveOAuthTokenResponse,
  MotiveCompanyResponse,
  MotiveUsersResponse,
  MotiveVehiclesResponse,
  MotiveVehicleResponse,
  MotiveVehicleLocationsResponse,
  MotiveDriverLocationsResponse,
  MotiveDriversAvailableTimeResponse,
  MotiveHOSLogsResponse,
  MotiveHOSViolationsResponse,
  MotiveFreightVehicleLocationsResponse,
  MotiveFreightSubscribeRequest,
  MotiveFreightSubscribeResponse,
  MotiveNearbyVehiclesResponse,
  MotiveNearbyVehiclesV2Response,
  MotiveFreightCompaniesResponse,
  MotiveFuelPurchasesResponse,
  MotiveIFTATripsResponse,
  MotiveMileageSummaryResponse,
  MotiveScorecardSummaryResponse,
  MotivePerformanceEventsResponse,
  MotiveInspectionReportsResponse,
  MotiveDispatchesResponse,
  MotiveGeofenceEventsResponse,
  MotiveFaultCodesResponse,
  MotiveWebhookPayload,
  MotiveWebhookEventType,
} from './types';
