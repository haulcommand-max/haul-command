/**
 * Haul Command — Notification Rules Engine
 * lib/notifications/notification-rules.ts
 *
 * Maps business events to push payloads.
 * Channel routing: push first, email second, SMS surgical only.
 * All rules read from actual Supabase state — never fake signals.
 */

import type { PushPayload, BroadcastPayload, NotifEventType } from './push-service';

// ─── Rule matrix ──────────────────────────────────────────────────────────────
export const NOTIF_RULES: Record<
  NotifEventType,
  {
    defaultChannel: 'push' | 'email' | 'sms';
    fallback: Array<'push' | 'email' | 'sms' | 'in_app'>;
    dedupWindowHrs: number;
    useSMS: boolean;
    smsReason: string | null;
    priority: 'high' | 'normal' | 'low';
  }
> = {
  // ── Operator supply events
  new_load_match:               { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 2,  useSMS: false, smsReason: null,                               priority: 'high' },
  missed_opportunity:           { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 24, useSMS: false, smsReason: null,                               priority: 'normal' },
  load_cancelled:               { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 1,  useSMS: false, smsReason: null,                               priority: 'high' },
  route_alert:                  { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 12, useSMS: false, smsReason: null,                               priority: 'normal' },
  rate_alert:                   { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 24, useSMS: false, smsReason: null,                               priority: 'normal' },
  urgent_nearby_work:           { defaultChannel: 'push', fallback: ['sms'],              dedupWindowHrs: 1,  useSMS: true,  smsReason: 'Revenue-critical urgent fallback',   priority: 'high' },
  repositioning_opportunity:    { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 6,  useSMS: false, smsReason: null,                               priority: 'normal' },
  // ── Broker demand events
  operator_match_found:         { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 2,  useSMS: false, smsReason: null,                               priority: 'high' },
  quote_received:               { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 2,  useSMS: false, smsReason: null,                               priority: 'high' },
  coverage_gap_alert:           { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 4,  useSMS: true,  smsReason: 'Revenue-critical supply gap',        priority: 'high' },
  urgent_replacement_needed:    { defaultChannel: 'push', fallback: ['sms'],              dedupWindowHrs: 1,  useSMS: true,  smsReason: 'Emergency coverage replacement',      priority: 'high' },
  load_status_update:           { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 1,  useSMS: false, smsReason: null,                               priority: 'normal' },
  // ── Claim / trust events
  claim_reminder:               { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 72, useSMS: false, smsReason: null,                               priority: 'low' },
  claim_verification_step:      { defaultChannel: 'email',fallback: ['push'],             dedupWindowHrs: 48, useSMS: true,  smsReason: 'OTP / verification code delivery',   priority: 'high' },
  claim_approved:               { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 0,  useSMS: false, smsReason: null,                               priority: 'normal' },
  profile_incomplete:           { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 72, useSMS: false, smsReason: null,                               priority: 'low' },
  profile_benefit_unlocked:     { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 0,  useSMS: false, smsReason: null,                               priority: 'normal' },
  trust_score_changed:          { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 24, useSMS: false, smsReason: null,                               priority: 'normal' },
  // ── Directory / engagement events
  nearby_market_active:         { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 168,useSMS: false, smsReason: null,                               priority: 'low' },
  corridor_activity:            { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 48, useSMS: false, smsReason: null,                               priority: 'low' },
  saved_corridor_update:        { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 48, useSMS: false, smsReason: null,                               priority: 'low' },
  leaderboard_rank_change:      { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 24, useSMS: false, smsReason: null,                               priority: 'low' },
  // ── Global / expansion events
  market_activated:             { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 0,  useSMS: false, smsReason: null,                               priority: 'normal' },
  waitlist_position_update:     { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 24, useSMS: false, smsReason: null,                               priority: 'normal' },
  rules_update:                 { defaultChannel: 'push', fallback: ['in_app'],           dedupWindowHrs: 72, useSMS: false, smsReason: null,                               priority: 'low' },
  // ── Monetization
  adgrid_slot_active:           { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 0,  useSMS: false, smsReason: null,                               priority: 'normal' },
  data_product_expiring:        { defaultChannel: 'push', fallback: ['email'],            dedupWindowHrs: 24, useSMS: false, smsReason: null,                               priority: 'normal' },
  payment_confirmed:            { defaultChannel: 'email',fallback: ['push'],             dedupWindowHrs: 0,  useSMS: false, smsReason: null,                               priority: 'normal' },
  payment_failed:               { defaultChannel: 'push', fallback: ['email','sms'],      dedupWindowHrs: 6,  useSMS: true,  smsReason: 'Payment failure recovery',           priority: 'high' },
};

/**
 * Builds PushPayload for a given event + role.
 * Copy is role-aware and intent-specific.
 */
export function buildPushPayload(
  userId: string,
  eventType: NotifEventType,
  overrides: Partial<PushPayload> = {}
): PushPayload {
  const rule = NOTIF_RULES[eventType];
  return {
    userId,
    eventType,
    title: overrides.title ?? DEFAULT_COPY[eventType]?.title ?? 'Haul Command',
    body:  overrides.body  ?? DEFAULT_COPY[eventType]?.body  ?? 'You have a new notification.',
    deepLink:     overrides.deepLink,
    dataPayload:  overrides.dataPayload,
    dedupKey:     overrides.dedupKey,
    dedupWindowHrs: overrides.dedupWindowHrs ?? rule.dedupWindowHrs,
    corridorSlug: overrides.corridorSlug,
    countryCode:  overrides.countryCode,
    roleKey:      overrides.roleKey,
  };
}

// Default copy by event — override per call with real context
const DEFAULT_COPY: Partial<Record<NotifEventType, { title: string; body: string }>> = {
  new_load_match:            { title: '📍 New load match',        body: 'A load on your corridor is looking for an escort. Tap to view.' },
  urgent_nearby_work:        { title: '⚡ Urgent nearby work',      body: 'A carrier needs an escort operator ASAP near you.' },
  repositioning_opportunity: { title: '🚛 Backhaul opportunity',   body: 'A repositioning run is available on your return route.' },
  operator_match_found:      { title: '✅ Operator match found',     body: 'A verified escort operator is available for your load.' },
  coverage_gap_alert:        { title: '⚠️ Coverage gap detected',   body: 'No available escorts found for this corridor window. Act now.' },
  urgent_replacement_needed: { title: '🚨 Emergency replacement',   body: 'A load needs an immediate escort replacement. View details.' },
  claim_reminder:            { title: '🏷️ Unclaimed listing',      body: 'Your business may be listed. Claim it to unlock leads and trust.' },
  claim_approved:            { title: '✅ Listing claimed!',         body: 'Your Haul Command listing is now live. Start getting found.' },
  profile_incomplete:        { title: '📊 Profile incomplete',      body: 'Complete your profile to appear in more searches.' },
  profile_benefit_unlocked:  { title: '🌟 New benefit unlocked',    body: 'Your trust score increased. You now qualify for featured placement.' },
  nearby_market_active:      { title: '📍 Active market nearby',    body: 'Operator activity has increased in your region. Check the feed.' },
  saved_corridor_update:     { title: '🛣️ Corridor update',        body: 'A corridor you follow has new permit or rate information.' },
  payment_confirmed:         { title: '💳 Payment confirmed',      body: 'Your Haul Command subscription is active.' },
  payment_failed:            { title: '⚠️ Payment failed',         body: 'We couldn’t process your payment. Update your details to stay active.' },
  data_product_expiring:     { title: '⏳ Data access expiring',    body: 'Your corridor intelligence subscription expires in 3 days.' },
};
