/**
 * DEPRECATED — use root lib/motive/* instead.
 * This barrel file re-exports from the canonical implementation
 * to avoid breaking imports in haul-command-hub.
 *
 * @deprecated Import from '@/lib/motive' (root project) instead.
 */

// Re-export types from root
export type {
  MotiveOAuthTokenResponse,
  MotiveCompany,
  MotiveUser,
  MotiveVehicle,
  MotiveHOSLog,
  MotiveInspectionReport,
  MotiveFaultCode,
  MotiveWebhookPayload,
} from '../../../../types/motive';

console.warn(
  '[DEPRECATED] haul-command-hub/src/lib/motive is deprecated. ' +
  'Use the canonical Motive integration at lib/motive/* in the root project.'
);
