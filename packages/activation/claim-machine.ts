/**
 * HAUL COMMAND — Claim Machine + Operator Activation System
 * Growth engine: convert scraped profiles → active users → revenue.
 * Integrates with VAPI for automated outreach.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface OperatorProfile {
  haul_command_id: string;
  name: string;
  phone?: string;
  email?: string;
  claimed: boolean;
  claim_token?: string;
  claimed_at?: string;
  claim_method?: 'sms' | 'email' | 'web' | 'call';
  activation_status: 'unclaimed' | 'claimed' | 'active' | 'dormant';
  profile_views: number;
  available_jobs_nearby: number;
  missed_revenue_estimate: number;
  heat_score: number;
  last_contacted_at?: string;
  contact_attempts: number;
}

export interface ClaimMetrics {
  total_profiles: number;
  claimed: number;
  activated: number;
  claim_rate: number;
  activation_rate: number;
}

export interface ValueSignal {
  has_rankings: boolean;
  has_jobs: boolean;
  has_profile_views: boolean;
  has_corridor_data: boolean;
  total_value_score: number;
}

// ═══════════════════════════════════════════════════════════════
// CLAIM TOKEN GENERATOR
// ═══════════════════════════════════════════════════════════════

export function generateClaimToken(): string {
  return `claim_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
}

export function generateClaimUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/claim?token=${token}`;
}

// ═══════════════════════════════════════════════════════════════
// VALUE SIGNAL CALCULATOR (determines when to make contact)
// ═══════════════════════════════════════════════════════════════

export function calculateValueSignals(profile: OperatorProfile): ValueSignal {
  const has_rankings = profile.profile_views > 0;
  const has_jobs = profile.available_jobs_nearby > 0;
  const has_profile_views = profile.profile_views > 10;
  const has_corridor_data = profile.missed_revenue_estimate > 0;

  let total = 0;
  if (has_rankings) total += 25;
  if (has_jobs) total += 30;
  if (has_profile_views) total += 20;
  if (has_corridor_data) total += 25;

  return { has_rankings, has_jobs, has_profile_views, has_corridor_data, total_value_score: total };
}

// ═══════════════════════════════════════════════════════════════
// HEAT SCORE (pre-call qualification)
// ═══════════════════════════════════════════════════════════════

export function calculateHeatScore(profile: OperatorProfile): number {
  let heat = 0;
  heat += Math.min(30, profile.profile_views * 2);
  heat += Math.min(25, profile.available_jobs_nearby * 5);
  heat += profile.missed_revenue_estimate > 500 ? 20 : profile.missed_revenue_estimate > 100 ? 10 : 0;
  // SMS click engagement would come from analytics
  heat += profile.heat_score > 0 ? Math.min(25, profile.heat_score) : 0;
  return Math.min(100, heat);
}

export function shouldTriggerCall(profile: OperatorProfile): boolean {
  const signals = calculateValueSignals(profile);
  const heat = calculateHeatScore(profile);
  const daysSinceCreated = profile.last_contacted_at
    ? (Date.now() - new Date(profile.last_contacted_at).getTime()) / 86400000
    : 999;

  return (
    heat >= 50 &&
    signals.total_value_score >= 60 &&
    profile.claimed === false &&
    daysSinceCreated >= 3 &&
    profile.contact_attempts < 5
  );
}

// ═══════════════════════════════════════════════════════════════
// SMS / OUTREACH MESSAGE GENERATORS
// ═══════════════════════════════════════════════════════════════

export function generateClaimSMS(profile: OperatorProfile, claimUrl: string): string {
  if (profile.available_jobs_nearby > 0) {
    return `Hey — quick heads up. We added your escort service to Haul Command. There are ${profile.available_jobs_nearby} active loads in your area right now. You're currently unclaimed, which means you're not getting dispatched. Takes 30 seconds to claim your profile: ${claimUrl}`;
  }
  return `Hey — we added your escort service to Haul Command. Brokers are already searching your area. Claim your profile in 30 seconds and start getting visibility: ${claimUrl}`;
}

export function generateFollowUpSMS(profile: OperatorProfile, claimUrl: string): string {
  if (profile.missed_revenue_estimate > 0) {
    return `Just checking in — You've missed an estimated $${Math.round(profile.missed_revenue_estimate)} in jobs this week by not being active on Haul Command. Claim it here: ${claimUrl}`;
  }
  return `Still want those jobs? Your Haul Command profile is getting views but you're not active yet. Claim it: ${claimUrl}`;
}

export function generateMissedMoneyEmail(profile: OperatorProfile, claimUrl: string): string {
  return `Subject: You missed $${Math.round(profile.missed_revenue_estimate)} this week

${profile.name},

Your escort service was added to Haul Command — the largest pilot car and heavy haul marketplace.

This week, ${profile.available_jobs_nearby} loads moved through your area. Because your profile isn't claimed, brokers couldn't reach you directly.

Estimated missed revenue: $${Math.round(profile.missed_revenue_estimate)}

It takes 30 seconds to claim your profile and start receiving dispatches:
${claimUrl}

— Haul Command Team`;
}

// ═══════════════════════════════════════════════════════════════
// VAPI CALL SCRIPT GENERATOR
// ═══════════════════════════════════════════════════════════════

export function generateVAPICallScript(profile: OperatorProfile): string {
  return `OPEN:
"Hey, is this ${profile.name}? This is the team at Haul Command — we actually built out your escort profile and it's already getting visibility."

PROOF:
"We're seeing activity on your page — ${profile.profile_views} profile views and ${profile.available_jobs_nearby} job searches coming through your area."

VALUE:
"You're just not claimed yet, so you're not receiving any of it."

CLOSE:
"I can activate it for you in about 30 seconds — want me to send the link?"`;
}

// ═══════════════════════════════════════════════════════════════
// ACTIVATION FLOW ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

export interface ActivationStep {
  day: number;
  channel: 'sms' | 'email' | 'call' | 'push' | 'voicemail';
  condition: string;
}

export const ACTIVATION_SEQUENCE: ActivationStep[] = [
  { day: 0, channel: 'sms', condition: 'always' },
  { day: 1, channel: 'email', condition: 'has_email' },
  { day: 2, channel: 'sms', condition: 'no_response' },
  { day: 3, channel: 'call', condition: 'heat_score >= 50' },
  { day: 5, channel: 'voicemail', condition: 'no_response' },
  { day: 7, channel: 'push', condition: 'has_app' },
  { day: 14, channel: 'sms', condition: 'no_response' },
  { day: 30, channel: 'email', condition: 'has_email' },
];

export function getNextActivationStep(
  profile: OperatorProfile,
  daysSinceFirstContact: number
): ActivationStep | null {
  for (const step of ACTIVATION_SEQUENCE) {
    if (step.day > daysSinceFirstContact) {
      return step;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// METRICS CALCULATOR
// ═══════════════════════════════════════════════════════════════

export function computeClaimMetrics(profiles: OperatorProfile[]): ClaimMetrics {
  const total = profiles.length;
  const claimed = profiles.filter(p => p.claimed).length;
  const activated = profiles.filter(p => p.activation_status === 'active').length;

  return {
    total_profiles: total,
    claimed,
    activated,
    claim_rate: total > 0 ? Math.round((claimed / total) * 10000) / 100 : 0,
    activation_rate: claimed > 0 ? Math.round((activated / claimed) * 10000) / 100 : 0,
  };
}
