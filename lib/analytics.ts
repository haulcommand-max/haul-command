/**
 * lib/analytics.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central analytics event bus for Haul Command.
 * Wraps PostHog so components never import posthog-js directly.
 *
 * Usage:
 *   import { hcTrack, hcIdentify } from '@/lib/analytics';
 *   hcTrack('dispatch_assigned', { load_id: '...', corridor: 'I-10' });
 */

import posthog from 'posthog-js';

// ── Operator Identity ────────────────────────────────────────────────────────
export function hcIdentify(operator: {
  id: string;
  email: string;
  role?: string;
  country?: string;
  tier?: string;
  created_at?: string;
}) {
  if (typeof window === 'undefined') return;
  posthog.identify(operator.id, {
    email:       operator.email,
    role:        operator.role,
    country:     operator.country,
    tier:        operator.tier,
    signup_date: operator.created_at,
  });
}

export function hcReset() {
  if (typeof window === 'undefined') return;
  posthog.reset();
}

// ── Generic event track ──────────────────────────────────────────────────────
export function hcTrack(event: HCEvent, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
}

// ── Typed Event Catalogue ────────────────────────────────────────────────────
export type HCEvent =
  // Auth & onboarding
  | 'operator_signup'
  | 'operator_login'
  | 'onboarding_step_completed'
  | 'profile_claimed'
  // Load Board
  | 'load_posted'
  | 'load_viewed'
  | 'load_accepted'
  | 'load_declined'
  | 'load_boosted'
  // Dispatch
  | 'dispatch_assigned'
  | 'dispatch_completed'
  | 'dispatch_cancelled'
  // Training
  | 'training_module_started'
  | 'training_module_completed'
  | 'training_quiz_passed'
  | 'training_quiz_failed'
  | 'training_certified'
  // AdGrid
  | 'adgrid_impression'
  | 'adgrid_click'
  | 'adgrid_conversion'
  | 'adgrid_campaign_created'
  // Payments
  | 'quickpay_initiated'
  | 'quickpay_completed'
  | 'subscription_started'
  | 'subscription_cancelled'
  // Directory
  | 'directory_search'
  | 'directory_profile_viewed'
  | 'directory_contact_clicked'
  // Map / corridors
  | 'corridor_viewed'
  | 'corridor_sponsored'
  | 'map_loaded'
  | 'near_me_searched'
  // Alerts / notifications
  | 'alert_subscribed'
  | 'push_notification_clicked';

// ── Convenience wrappers for common flows ───────────────────────────────────

export const HC = {
  dispatchAssigned: (loadId: string, corridor: string, operatorId: string) =>
    hcTrack('dispatch_assigned', { load_id: loadId, corridor, operator_id: operatorId }),

  trainingCompleted: (module: string, score: number) =>
    hcTrack('training_module_completed', { module, score }),

  adImpression: (campaignId: string, zone: string, country: string) =>
    hcTrack('adgrid_impression', { campaign_id: campaignId, zone, country }),

  adClick: (campaignId: string, zone: string, variant: string) =>
    hcTrack('adgrid_click', { campaign_id: campaignId, zone, variant }),

  loadPosted: (corridor: string, rate: number, urgency: 'standard' | 'urgent') =>
    hcTrack('load_posted', { corridor, rate, urgency }),

  profileClaimed: (entityId: string, country: string, tier: string) =>
    hcTrack('profile_claimed', { entity_id: entityId, country, tier }),
};
