/**
 * lib/comms/smsFailover.ts — Haul Command SMS Fallback Logic Engine
 *
 * Philosophy: Push first. SMS only when push fails AND the event justifies the cost.
 * This utility defines:
 *   1. PRIORITY_SMS_EVENTS — the allowlist of events that warrant SMS spend
 *   2. shouldSendSms() — evaluates whether an event + user state requires SMS
 *   3. buildSmsPayload() — builds a compliant <160-char SMS body
 *
 * Integration points:
 *   - Called AFTER Firebase push attempt returns failure / no device token
 *   - Works with Twilio / Vonage / AWS SNS (adapter pattern — swap freely)
 *   - Records send attempts in hc_events for cost tracking
 */

export type HcEventType =
  | 'load.match_found'
  | 'insurance.expiring_30d'
  | 'insurance.expired'
  | 'claim.verification_required'
  | 'claim.abandoned_7d'
  | 'escrow.payment_released'
  | 'escrow.payment_failed'
  | 'assignment.confirmed'
  | 'assignment.cancelled_urgent'
  | 'profile.suspended'
  | 'account.security_alert'
  | 'bid.won'
  | 'load.post_expiring_4h';

/**
 * Priority SMS event definitions.
 * cost_weight: 1=cheapest trigger, 5=most expensive/justified
 * reason:       why SMS is warranted over push-only
 */
export const PRIORITY_SMS_EVENTS: Record<
  HcEventType,
  { send_sms: boolean; cost_weight: 1 | 2 | 3 | 4 | 5; reason: string }
> = {
  'load.match_found': {
    send_sms: true,
    cost_weight: 5,
    reason: 'Revenue event — operator needs to act within minutes or loses the load.',
  },
  'insurance.expiring_30d': {
    send_sms: false,
    cost_weight: 2,
    reason: 'Push + email sufficient. 30-day window is not urgent enough for SMS spend.',
  },
  'insurance.expired': {
    send_sms: true,
    cost_weight: 4,
    reason: 'Account suspension risk — operator may be operating illegally without knowing.',
  },
  'claim.verification_required': {
    send_sms: true,
    cost_weight: 3,
    reason: 'Onboarding blocker. SMS breaks friction faster than email for new users.',
  },
  'claim.abandoned_7d': {
    send_sms: false,
    cost_weight: 2,
    reason: 'Push retargeting handles this. SMS only if push token is missing AND value is high.',
  },
  'escrow.payment_released': {
    send_sms: true,
    cost_weight: 5,
    reason: 'Money event — operators expect payment confirmation.',
  },
  'escrow.payment_failed': {
    send_sms: true,
    cost_weight: 5,
    reason: 'Money event — urgent recovery required.',
  },
  'assignment.confirmed': {
    send_sms: true,
    cost_weight: 4,
    reason: 'Operational confirmation. Operator may be in field without app open.',
  },
  'assignment.cancelled_urgent': {
    send_sms: true,
    cost_weight: 5,
    reason: 'Time-critical operational change. Operator must know immediately.',
  },
  'profile.suspended': {
    send_sms: true,
    cost_weight: 4,
    reason: 'Operator is locked out and may not know why. SMS ensures reach.',
  },
  'account.security_alert': {
    send_sms: true,
    cost_weight: 5,
    reason: 'Security — user must be notified regardless of push state.',
  },
  'bid.won': {
    send_sms: true,
    cost_weight: 4,
    reason: 'Revenue event — operator needs to confirm acceptance quickly.',
  },
  'load.post_expiring_4h': {
    send_sms: false,
    cost_weight: 2,
    reason: 'Push handles time-sensitive alerts. SMS overkill for post expiry.',
  },
};

/**
 * Evaluate whether a given event + push result requires SMS fallback.
 */
export function shouldSendSms(params: {
  eventType: HcEventType;
  pushDelivered: boolean;
  hasDeviceToken: boolean;
  userOptedIntoSms?: boolean;
}): boolean {
  const { eventType, pushDelivered, hasDeviceToken, userOptedIntoSms = true } = params;
  const rule = PRIORITY_SMS_EVENTS[eventType];
  if (!rule || !rule.send_sms) return false;
  if (!userOptedIntoSms) return false;
  // Only send SMS if push failed or user has no device token
  if (pushDelivered && hasDeviceToken) return false;
  return true;
}

/**
 * Build a compliant <160-char SMS body for an event.
 * All bodies must include: what happened, action required, and Haul Command branding.
 */
export function buildSmsPayload(
  eventType: HcEventType,
  vars: Record<string, string>,
): string {
  const templates: Record<HcEventType, string> = {
    'load.match_found':
      `HC: New load match in ${vars.region ?? 'your area'}. Open the app to accept before it expires. haulcommand.com`,
    'insurance.expired':
      `HC ALERT: Your insurance on file has expired. Your profile is now suspended. Update at haulcommand.com/dashboard`,
    'claim.verification_required':
      `HC: Verify your profile to start receiving load matches. Takes 2 min: haulcommand.com/claim`,
    'escrow.payment_released':
      `HC: Payment of ${vars.amount ?? 'your funds'} released. Check your account at haulcommand.com/dashboard`,
    'escrow.payment_failed':
      `HC URGENT: Payment failed for ${vars.load_id ?? 'your assignment'}. Action needed: haulcommand.com/dashboard`,
    'assignment.confirmed':
      `HC: Assignment confirmed for ${vars.load_ref ?? 'your load'}. Depart ${vars.pickup_time ?? 'as scheduled'}. haulcommand.com`,
    'assignment.cancelled_urgent':
      `HC URGENT: Assignment ${vars.load_ref ?? ''} cancelled. Contact broker: ${vars.broker_phone ?? 'via app'}. haulcommand.com`,
    'profile.suspended':
      `HC: Your profile was suspended. Reason: ${vars.reason ?? 'missing documents'}. Resolve at haulcommand.com/dashboard`,
    'account.security_alert':
      `HC SECURITY: New login detected on your account. Not you? Secure it now: haulcommand.com/settings`,
    'bid.won':
      `HC: Your bid was accepted for ${vars.load_ref ?? 'a load'}! Confirm your route details: haulcommand.com/dashboard`,
    'insurance.expiring_30d':
      `HC: Insurance expiring in 30 days. Update before it lapses: haulcommand.com/dashboard`,
    'claim.abandoned_7d':
      `HC: Your profile claim is incomplete. Finish claiming to get load matches: haulcommand.com/claim`,
    'load.post_expiring_4h':
      `HC: Your load post expires in 4 hours. Extend or close it: haulcommand.com/dashboard`,
  };

  const body = templates[eventType] ?? `HC: You have an important update. Visit haulcommand.com`;
  // Hard trim to 160 chars — SMS standard
  return body.substring(0, 160);
}
