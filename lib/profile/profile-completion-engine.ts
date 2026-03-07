// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE COMPLETION ENGINE
// Pure scoring logic — zero DB calls, zero side effects, fully testable.
//
// Drives claimed operators to complete their profiles by coupling progress
// to visibility, trust, and real opportunity signals.
//
// Weights (sum 100):
//   identity: 20 | coverage: 25 | equipment: 20
//   availability: 15 | trust: 10 | performance: 10
//
// Gates:
//   missing display_name OR phone → cap at 35
//   missing coverage_states      → cap at 55
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProfileFieldSnapshot {
  // identity (weight: 20)
  display_name: string | null;
  phone: string | null;
  email: string | null;
  home_base_city: string | null;
  home_base_state: string | null;

  // coverage (weight: 25)
  coverage_states: string[] | null;
  preferred_corridors: string[] | null;
  radius_miles: number | null;

  // equipment (weight: 20)
  vehicle_type: string | null;
  certifications: string[] | null;
  pilot_car_level: string | null;

  // availability (weight: 15)
  availability_status: string | null;
  hours: string | null;

  // trust (weight: 10)
  photo_url: string | null;
  insurance_proof: boolean;
  id_verification: boolean;

  // performance (weight: 10)
  response_time_band: ResponseTimeBand;
  completed_jobs: number;
  broker_feedback_count: number;
}

export type ResponseTimeBand = 'fast' | 'normal' | 'slow' | 'none';

export type VisibilityTier = 'hidden' | 'limited' | 'standard' | 'featured';

export interface FieldStatus {
  field: string;
  group: string;
  filled: boolean;
  points: number;
}

export interface GroupScore {
  score: number;
  max: number;
  fields: FieldStatus[];
}

export interface NextStep {
  field: string;
  group: string;
  label: string;
  reason: string;
  visibility_gain: number;
  seconds_estimate: number;
}

export interface ProfileCompletionResult {
  score: number;
  tier: VisibilityTier;
  group_scores: Record<string, GroupScore>;
  gate_active: string | null;
  gate_cap: number | null;
  next_step: NextStep | null;
  milestones_reached: number[];
  newly_crossed_milestones: number[];
}

export interface VisibilityScoreInput {
  profile_completion_score: number;
  availability_status: string | null;
  last_active_at: Date | null;
  response_time_band: ResponseTimeBand;
  verified_badge: boolean;
  active_boost?: { multiplier: number; expires_at: Date };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MILESTONES = [20, 40, 60, 80, 100] as const;

const MILESTONE_TOASTS: Record<number, string> = {
  20: 'nice — you\'re live. keep going.',
  40: 'good. you just unlocked a small visibility boost (24h).',
  60: 'you\'re now eligible for full leaderboard ranking.',
  80: 'strong profile. brokers trust this.',
  100: 'perfect. you\'re fully optimized.',
};

const MILESTONE_BOOSTS: Record<number, { type: string; duration_hours: number; multiplier: number }> = {
  40: { type: 'search_rank_boost', duration_hours: 24, multiplier: 1.10 },
  60: { type: 'search_rank_boost', duration_hours: 48, multiplier: 1.20 },
  80: { type: 'featured_operator_slot_eligibility', duration_hours: 168, multiplier: 1.30 },
};

interface FieldDef {
  field: string;
  weight: number; // points this field contributes to the group
  label: string;
  reason: string;
  seconds_estimate: number;
}

interface GroupDef {
  name: string;
  weight: number; // max points for this group
  fields: FieldDef[];
}

const GROUPS: GroupDef[] = [
  {
    name: 'identity',
    weight: 20,
    fields: [
      { field: 'display_name', weight: 5, label: 'Add your display name', reason: 'Brokers need to know who you are', seconds_estimate: 15 },
      { field: 'phone', weight: 5, label: 'Add your phone number', reason: 'Required for dispatch contact', seconds_estimate: 30 },
      { field: 'email', weight: 4, label: 'Add your email', reason: 'Receive job notifications', seconds_estimate: 15 },
      { field: 'home_base_city', weight: 3, label: 'Set your home base city', reason: 'Brokers search by location', seconds_estimate: 10 },
      { field: 'home_base_state', weight: 3, label: 'Set your home base state', reason: 'Appear in state-level searches', seconds_estimate: 10 },
    ],
  },
  {
    name: 'coverage',
    weight: 25,
    fields: [
      { field: 'coverage_states', weight: 12, label: 'Add your coverage states', reason: 'Appear in broker searches for your corridors', seconds_estimate: 30 },
      { field: 'preferred_corridors', weight: 8, label: 'Set preferred corridors', reason: 'Get matched to corridor-specific loads', seconds_estimate: 45 },
      { field: 'radius_miles', weight: 5, label: 'Set your service radius', reason: 'Filter matches to your range', seconds_estimate: 10 },
    ],
  },
  {
    name: 'equipment',
    weight: 20,
    fields: [
      { field: 'vehicle_type', weight: 8, label: 'Set your vehicle type', reason: 'Brokers filter by vehicle capability', seconds_estimate: 10 },
      { field: 'certifications', weight: 7, label: 'Add certifications', reason: 'Stand out with verified credentials', seconds_estimate: 60 },
      { field: 'pilot_car_level', weight: 5, label: 'Set your pilot car level', reason: 'Match to appropriate load types', seconds_estimate: 10 },
    ],
  },
  {
    name: 'availability',
    weight: 15,
    fields: [
      { field: 'availability_status', weight: 10, label: 'Set your availability', reason: 'Available operators get 3x more views', seconds_estimate: 5 },
      { field: 'hours', weight: 5, label: 'Set operating hours', reason: 'Brokers know when to reach you', seconds_estimate: 20 },
    ],
  },
  {
    name: 'trust',
    weight: 10,
    fields: [
      { field: 'photo_url', weight: 4, label: 'Add a photo or logo', reason: 'Profiles with photos get 40% more engagement', seconds_estimate: 30 },
      { field: 'insurance_proof', weight: 4, label: 'Upload proof of insurance', reason: 'Unlock compliance badge', seconds_estimate: 120 },
      { field: 'id_verification', weight: 2, label: 'Verify your identity', reason: 'Earn the verified operator badge', seconds_estimate: 180 },
    ],
  },
  {
    name: 'performance',
    weight: 10,
    fields: [
      { field: 'response_time_band', weight: 4, label: 'Improve response time', reason: 'Fast responders rank higher', seconds_estimate: 0 },
      { field: 'completed_jobs', weight: 4, label: 'Complete jobs', reason: 'Job history builds trust with brokers', seconds_estimate: 0 },
      { field: 'broker_feedback_count', weight: 2, label: 'Earn broker feedback', reason: 'Reviews boost your leaderboard position', seconds_estimate: 0 },
    ],
  },
];

const GATES = [
  {
    id: 'min_identity_gate',
    missing_any: ['display_name', 'phone'] as string[],
    cap: 35,
  },
  {
    id: 'coverage_gate',
    missing_any: ['coverage_states'] as string[],
    cap: 55,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function isFieldFilled(snapshot: ProfileFieldSnapshot, field: string): boolean {
  const val = (snapshot as unknown as Record<string, unknown>)[field];
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0 && val !== 'none';
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (Array.isArray(val)) return val.length > 0;
  return false;
}

function scoreToTier(score: number): VisibilityTier {
  if (score >= 80) return 'featured';
  if (score >= 50) return 'standard';
  if (score >= 25) return 'limited';
  return 'hidden';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

export function computeProfileCompletion(
  snapshot: ProfileFieldSnapshot,
  previousScore: number = 0,
): ProfileCompletionResult {
  const group_scores: Record<string, GroupScore> = {};
  let rawScore = 0;

  for (const group of GROUPS) {
    const totalFieldWeight = group.fields.reduce((s, f) => s + f.weight, 0);
    const fields: FieldStatus[] = [];
    let groupEarned = 0;

    for (const fieldDef of group.fields) {
      const filled = isFieldFilled(snapshot, fieldDef.field);
      const normalizedPoints = (fieldDef.weight / totalFieldWeight) * group.weight;
      const earned = filled ? normalizedPoints : 0;
      groupEarned += earned;
      fields.push({
        field: fieldDef.field,
        group: group.name,
        filled,
        points: Math.round(normalizedPoints * 100) / 100,
      });
    }

    group_scores[group.name] = {
      score: Math.round(groupEarned * 100) / 100,
      max: group.weight,
      fields,
    };
    rawScore += groupEarned;
  }

  // Apply gates
  let gate_active: string | null = null;
  let gate_cap: number | null = null;

  for (const gate of GATES) {
    const anyMissing = gate.missing_any.some(f => !isFieldFilled(snapshot, f));
    if (anyMissing) {
      if (gate_cap === null || gate.cap < gate_cap) {
        gate_active = gate.id;
        gate_cap = gate.cap;
      }
    }
  }

  let score = Math.round(rawScore);
  if (gate_cap !== null && score > gate_cap) {
    score = gate_cap;
  }
  score = Math.max(0, Math.min(100, score));

  const tier = scoreToTier(score);

  // Milestones
  const milestones_reached = MILESTONES.filter(m => score >= m);
  const newly_crossed_milestones = MILESTONES.filter(m => score >= m && previousScore < m);

  const next_step = getNextStep(snapshot, score);

  return {
    score,
    tier,
    group_scores,
    gate_active,
    gate_cap,
    next_step,
    milestones_reached,
    newly_crossed_milestones,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEXT STEP
// ═══════════════════════════════════════════════════════════════════════════════

export function getNextStep(
  snapshot: ProfileFieldSnapshot,
  _currentScore: number,
): NextStep | null {
  // Collect all unfilled fields with their potential point gain
  const candidates: NextStep[] = [];

  for (const group of GROUPS) {
    const totalFieldWeight = group.fields.reduce((s, f) => s + f.weight, 0);
    for (const fieldDef of group.fields) {
      if (!isFieldFilled(snapshot, fieldDef.field)) {
        // Skip performance fields the user can't directly fill
        if (fieldDef.seconds_estimate === 0) continue;

        const gain = Math.round(((fieldDef.weight / totalFieldWeight) * group.weight) * 100) / 100;
        candidates.push({
          field: fieldDef.field,
          group: group.name,
          label: fieldDef.label,
          reason: fieldDef.reason,
          visibility_gain: gain,
          seconds_estimate: fieldDef.seconds_estimate,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prioritize: gate-breaking fields first, then highest visibility gain
  const gateFields = new Set(GATES.flatMap(g => g.missing_any));
  candidates.sort((a, b) => {
    const aGate = gateFields.has(a.field) && !isFieldFilled(snapshot, a.field) ? 1 : 0;
    const bGate = gateFields.has(b.field) && !isFieldFilled(snapshot, b.field) ? 1 : 0;
    if (bGate !== aGate) return bGate - aGate;
    return b.visibility_gain - a.visibility_gain;
  });

  return candidates[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISIBILITY SCORE
// ═══════════════════════════════════════════════════════════════════════════════

export function computeVisibilityScore(input: VisibilityScoreInput): number {
  let score = 0;

  // Profile completion: 50% of visibility
  score += (input.profile_completion_score / 100) * 50;

  // Availability: 20% — being "available" is a strong signal
  if (input.availability_status === 'available' || input.availability_status === 'online') {
    score += 20;
  } else if (input.availability_status === 'busy') {
    score += 5;
  }

  // Recency: 15% — active in last 24h = full, decays over 14 days
  if (input.last_active_at) {
    const hoursAgo = (Date.now() - input.last_active_at.getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 24) {
      score += 15;
    } else if (hoursAgo <= 72) {
      score += 10;
    } else if (hoursAgo <= 336) { // 14 days
      score += 5;
    }
  }

  // Response time: 10%
  const responsePoints: Record<ResponseTimeBand, number> = {
    fast: 10,
    normal: 6,
    slow: 2,
    none: 0,
  };
  score += responsePoints[input.response_time_band];

  // Verified badge: 5%
  if (input.verified_badge) {
    score += 5;
  }

  // Apply active boost multiplier
  if (input.active_boost && new Date() < input.active_boost.expires_at) {
    score = Math.min(100, score * input.active_boost.multiplier);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE ELIGIBILITY
// ═══════════════════════════════════════════════════════════════════════════════

const FOUNDING_OPERATOR_CUTOFF = new Date('2026-06-01T00:00:00Z');

export function checkBadgeEligibility(
  snapshot: ProfileFieldSnapshot,
  score: number,
  claimedAt?: Date,
): string[] {
  const badges: string[] = [];

  // founding_operator: claimed before cutoff date
  if (claimedAt && claimedAt < FOUNDING_OPERATOR_CUTOFF) {
    badges.push('founding_operator');
  }

  // verified_operator: identity verified + score >= 80
  if (snapshot.id_verification && score >= 80) {
    badges.push('verified_operator');
  }

  // fast_responder: response time band is "fast"
  if (snapshot.response_time_band === 'fast') {
    badges.push('fast_responder');
  }

  return badges;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS (constants for external use)
// ═══════════════════════════════════════════════════════════════════════════════

export { MILESTONES, MILESTONE_TOASTS, MILESTONE_BOOSTS, GROUPS, GATES };
