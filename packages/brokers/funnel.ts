/**
 * HAUL COMMAND — Broker Conversion Funnel + Simulation
 * Converts broker leads → paying users via instant-match demos.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BrokerProfile {
  id: string;
  company_name: string;
  phone?: string;
  email?: string;
  loads_posted: number;
  active_status: 'lead' | 'demo' | 'trial' | 'paid' | 'churned';
  payment_score: number;
  claim_status: 'unclaimed' | 'claimed' | 'verified';
  created_at: string;
}

export interface MatchSimulation {
  matches: number;
  avg_response_time: string;
  price_range: [number, number];
  coverage: string;
  confidence: number;
}

export interface FunnelStep {
  step: number;
  name: string;
  description: string;
  conversion_trigger: string;
}

// ═══════════════════════════════════════════════════════════════
// BROKER FUNNEL DEFINITION
// ═══════════════════════════════════════════════════════════════

export const BROKER_FUNNEL: FunnelStep[] = [
  { step: 1, name: 'Instant Match Preview', description: 'Show available operators before signup', conversion_trigger: 'see_results' },
  { step: 2, name: 'Post First Load', description: 'Zero-friction load posting', conversion_trigger: 'post_load' },
  { step: 3, name: 'Receive Bids', description: 'Operator bids arrive in minutes', conversion_trigger: 'receive_bids' },
  { step: 4, name: 'Convert to Paid', description: 'Unlock priority placement + analytics', conversion_trigger: 'first_payment' },
];

// ═══════════════════════════════════════════════════════════════
// MATCH SIMULATOR (pre-signup conversion weapon)
// ═══════════════════════════════════════════════════════════════

export function simulateBrokerExperience(load: {
  origin: string;
  destination: string;
  price_cents: number;
  equipment_type?: string;
}): MatchSimulation {
  // Deterministic simulation based on load parameters
  const baseSeed = (load.origin + load.destination).length;
  const matchCount = 3 + (baseSeed % 8);
  const responseMinutes = 2 + (baseSeed % 6);

  return {
    matches: matchCount,
    avg_response_time: `${responseMinutes} minutes`,
    price_range: [
      Math.round(load.price_cents * 0.85),
      Math.round(load.price_cents * 1.15),
    ],
    coverage: matchCount > 5 ? 'strong' : 'moderate',
    confidence: Math.min(0.98, 0.75 + (matchCount * 0.03)),
  };
}

// ═══════════════════════════════════════════════════════════════
// SPEED COMPARISON (conversion accelerator)
// ═══════════════════════════════════════════════════════════════

export function generateSpeedComparison(): {
  haul_command_minutes: number;
  traditional_minutes: number;
  speedup_factor: string;
} {
  return {
    haul_command_minutes: 3,
    traditional_minutes: 25,
    speedup_factor: '8x faster',
  };
}

// ═══════════════════════════════════════════════════════════════
// BROKER REPUTATION (NEW — mirrors operator reputation)
// ═══════════════════════════════════════════════════════════════

export function computeBrokerReputation(broker: BrokerProfile & {
  avg_payment_days: number;
  cancellation_rate: number;
  operator_feedback_avg: number;
}): {
  overall: number;
  badge: string;
  risk_level: 'low' | 'medium' | 'high';
} {
  let score = 50;

  // Payment speed (0-30 pts)
  if (broker.avg_payment_days <= 3) score += 30;
  else if (broker.avg_payment_days <= 7) score += 20;
  else if (broker.avg_payment_days <= 14) score += 10;

  // Cancellation rate (0-20 pts)
  score += Math.max(0, 20 - broker.cancellation_rate * 100);

  // Operator feedback (0-20 pts)
  score += broker.operator_feedback_avg * 4;

  // Volume bonus
  if (broker.loads_posted > 50) score += 10;

  score = Math.min(100, Math.max(0, Math.round(score)));

  const badge = score >= 85 ? 'Preferred Broker' : score >= 65 ? 'Verified Broker' : 'Standard';
  const risk_level = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

  return { overall: score, badge, risk_level };
}

// ═══════════════════════════════════════════════════════════════
// BROKER OUTREACH MESSAGES
// ═══════════════════════════════════════════════════════════════

export function generateBrokerSMS(): string {
  return `Quick question — Are you still posting escort loads manually, or do you already have instant coverage? We're getting brokers matched with drivers in minutes. Reply YES for a free demo.`;
}

export function generateBrokerCallScript(brokerName: string): string {
  return `OPEN: "Hey — quick one, are you still posting escort loads the old way or do you have instant coverage?"
HOOK: "We're seeing brokers get matched with operators in under 5 minutes."
PAIN: "Most brokers lose time waiting for callbacks or chasing availability."
DEMO CLOSE: "Give me one lane — I'll show you how fast we can match it."`;
}
