import { describe, it, expect } from "vitest";
import {
  computeProfileCompletion,
  computeVisibilityScore,
  getNextStep,
  checkBadgeEligibility,
  type ProfileFieldSnapshot,
  type VisibilityScoreInput,
} from "@/lib/profile/profile-completion-engine";

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<ProfileFieldSnapshot> = {}): ProfileFieldSnapshot {
  return {
    display_name: null,
    phone: null,
    email: null,
    home_base_city: null,
    home_base_state: null,
    coverage_states: null,
    preferred_corridors: null,
    radius_miles: null,
    vehicle_type: null,
    certifications: null,
    pilot_car_level: null,
    availability_status: null,
    hours: null,
    photo_url: null,
    insurance_proof: false,
    id_verification: false,
    response_time_band: 'none',
    completed_jobs: 0,
    broker_feedback_count: 0,
    ...overrides,
  };
}

function makeFullSnapshot(): ProfileFieldSnapshot {
  return makeSnapshot({
    display_name: 'John Doe',
    phone: '+15551234567',
    email: 'john@example.com',
    home_base_city: 'Dallas',
    home_base_state: 'TX',
    coverage_states: ['TX', 'OK', 'LA'],
    preferred_corridors: ['I-35', 'I-10'],
    radius_miles: 200,
    vehicle_type: 'Pilot Car',
    certifications: ['TWIC', 'CDL'],
    pilot_car_level: 'lead',
    availability_status: 'available',
    hours: '06:00-18:00',
    photo_url: 'https://example.com/photo.jpg',
    insurance_proof: true,
    id_verification: true,
    response_time_band: 'fast',
    completed_jobs: 15,
    broker_feedback_count: 8,
  });
}

// ── computeProfileCompletion ────────────────────────────────────────────────

describe('computeProfileCompletion', () => {
  it('empty profile scores 0 with tier hidden', () => {
    const result = computeProfileCompletion(makeSnapshot());
    expect(result.score).toBe(0);
    expect(result.tier).toBe('hidden');
  });

  it('full profile scores 100 with tier featured', () => {
    const result = computeProfileCompletion(makeFullSnapshot());
    expect(result.score).toBe(100);
    expect(result.tier).toBe('featured');
  });

  it('identity-only fields yield ~20 points (capped by identity gate at 35)', () => {
    const snap = makeSnapshot({
      display_name: 'Jane',
      phone: '+15559876543',
      email: 'jane@example.com',
      home_base_city: 'Houston',
      home_base_state: 'TX',
    });
    const result = computeProfileCompletion(snap);
    // Identity group = 20 points, but coverage_states gate caps at 55
    // Since score is 20 and cap is 55, score stays at 20
    expect(result.score).toBe(20);
    expect(result.tier).toBe('hidden');
  });

  it('missing display_name caps score at 35', () => {
    const snap = makeSnapshot({
      // display_name missing
      phone: '+15551234567',
      email: 'test@example.com',
      home_base_city: 'Dallas',
      home_base_state: 'TX',
      coverage_states: ['TX'],
      preferred_corridors: ['I-35'],
      radius_miles: 150,
      vehicle_type: 'Pilot Car',
      certifications: ['TWIC'],
      pilot_car_level: 'lead',
      availability_status: 'available',
      hours: '08:00-17:00',
      photo_url: 'https://example.com/photo.jpg',
      insurance_proof: true,
    });
    const result = computeProfileCompletion(snap);
    expect(result.score).toBeLessThanOrEqual(35);
    expect(result.gate_active).toBe('min_identity_gate');
    expect(result.gate_cap).toBe(35);
  });

  it('missing phone caps score at 35', () => {
    const snap = makeSnapshot({
      display_name: 'Jane',
      // phone missing
      email: 'jane@example.com',
      home_base_city: 'Houston',
      home_base_state: 'TX',
      coverage_states: ['TX'],
      preferred_corridors: ['I-35'],
      radius_miles: 200,
      vehicle_type: 'Pilot Car',
    });
    const result = computeProfileCompletion(snap);
    expect(result.score).toBeLessThanOrEqual(35);
    expect(result.gate_active).toBe('min_identity_gate');
  });

  it('missing coverage_states caps score at 55', () => {
    const snap = makeSnapshot({
      display_name: 'Jane',
      phone: '+15551234567',
      email: 'jane@example.com',
      home_base_city: 'Houston',
      home_base_state: 'TX',
      // coverage_states missing
      vehicle_type: 'Pilot Car',
      certifications: ['TWIC'],
      pilot_car_level: 'lead',
      availability_status: 'available',
      hours: '08:00-17:00',
      photo_url: 'https://example.com/photo.jpg',
      insurance_proof: true,
      id_verification: true,
    });
    const result = computeProfileCompletion(snap);
    expect(result.score).toBeLessThanOrEqual(55);
    expect(result.gate_active).toBe('coverage_gate');
    expect(result.gate_cap).toBe(55);
  });

  it('both gates active — lower cap (35) wins', () => {
    // Missing both display_name AND coverage_states
    const snap = makeSnapshot({
      phone: '+15551234567',
      email: 'jane@example.com',
      home_base_city: 'Houston',
      home_base_state: 'TX',
      vehicle_type: 'Pilot Car',
      availability_status: 'available',
    });
    const result = computeProfileCompletion(snap);
    expect(result.gate_cap).toBe(35);
  });

  it('group scores sum to the correct total', () => {
    const result = computeProfileCompletion(makeFullSnapshot());
    const groupSum = Object.values(result.group_scores).reduce((s, g) => s + g.score, 0);
    expect(Math.round(groupSum)).toBe(100);
  });

  it('each group max matches defined weights', () => {
    const result = computeProfileCompletion(makeSnapshot());
    expect(result.group_scores['identity'].max).toBe(20);
    expect(result.group_scores['coverage'].max).toBe(25);
    expect(result.group_scores['equipment'].max).toBe(20);
    expect(result.group_scores['availability'].max).toBe(15);
    expect(result.group_scores['trust'].max).toBe(10);
    expect(result.group_scores['performance'].max).toBe(10);
  });

  it('tier thresholds: hidden < 25, limited 25-49, standard 50-79, featured 80+', () => {
    expect(computeProfileCompletion(makeSnapshot(), 0).tier).toBe('hidden');

    // Enough fields for ~50+ score
    const mid = makeSnapshot({
      display_name: 'Jane',
      phone: '+1555',
      email: 'j@e.com',
      home_base_city: 'H',
      home_base_state: 'TX',
      coverage_states: ['TX'],
      preferred_corridors: ['I-35'],
      radius_miles: 100,
      vehicle_type: 'Pilot Car',
      certifications: ['TWIC'],
      pilot_car_level: 'lead',
    });
    const midResult = computeProfileCompletion(mid);
    expect(midResult.score).toBeGreaterThanOrEqual(50);
    expect(midResult.tier).toBe('standard');
  });

  // Milestone detection
  it('detects newly crossed milestones', () => {
    const snap = makeFullSnapshot();
    const result = computeProfileCompletion(snap, 75);
    expect(result.newly_crossed_milestones).toContain(80);
    expect(result.newly_crossed_milestones).toContain(100);
    expect(result.newly_crossed_milestones).not.toContain(40);
  });

  it('returns all milestones reached', () => {
    const result = computeProfileCompletion(makeFullSnapshot());
    expect(result.milestones_reached).toEqual([20, 40, 60, 80, 100]);
  });

  it('no newly crossed milestones when score unchanged', () => {
    const result = computeProfileCompletion(makeFullSnapshot(), 100);
    expect(result.newly_crossed_milestones).toEqual([]);
  });
});

// ── getNextStep ─────────────────────────────────────────────────────────────

describe('getNextStep', () => {
  it('returns null for a full profile', () => {
    const step = getNextStep(makeFullSnapshot(), 100);
    expect(step).toBeNull();
  });

  it('recommends gate-breaking field first', () => {
    const snap = makeSnapshot({
      // display_name missing (gate field)
      phone: '+15551234567',
      email: 'test@example.com',
      coverage_states: ['TX'],
    });
    const step = getNextStep(snap, 20);
    expect(step).not.toBeNull();
    expect(step!.field).toBe('display_name');
  });

  it('recommends coverage_states when identity gate is clear', () => {
    const snap = makeSnapshot({
      display_name: 'Jane',
      phone: '+15551234567',
      email: 'test@example.com',
      home_base_city: 'Houston',
      home_base_state: 'TX',
    });
    const step = getNextStep(snap, 20);
    expect(step).not.toBeNull();
    expect(step!.field).toBe('coverage_states');
  });

  it('skips performance fields (seconds_estimate=0)', () => {
    const snap = makeSnapshot({
      display_name: 'Jane',
      phone: '+15551234567',
      email: 'test@example.com',
      home_base_city: 'Houston',
      home_base_state: 'TX',
      coverage_states: ['TX'],
      preferred_corridors: ['I-35'],
      radius_miles: 200,
      vehicle_type: 'Pilot Car',
      certifications: ['TWIC'],
      pilot_car_level: 'lead',
      availability_status: 'available',
      hours: '08:00-17:00',
      photo_url: 'https://example.com/photo.jpg',
      insurance_proof: true,
      id_verification: true,
      // performance fields empty but can't be directly filled
    });
    const step = getNextStep(snap, 90);
    expect(step).toBeNull();
  });

  it('returns visibility_gain > 0', () => {
    const step = getNextStep(makeSnapshot(), 0);
    expect(step).not.toBeNull();
    expect(step!.visibility_gain).toBeGreaterThan(0);
  });
});

// ── computeVisibilityScore ──────────────────────────────────────────────────

describe('computeVisibilityScore', () => {
  it('returns 0 for completely empty input', () => {
    const score = computeVisibilityScore({
      profile_completion_score: 0,
      availability_status: null,
      last_active_at: null,
      response_time_band: 'none',
      verified_badge: false,
    });
    expect(score).toBe(0);
  });

  it('returns 100 for maxed-out input', () => {
    const score = computeVisibilityScore({
      profile_completion_score: 100,
      availability_status: 'available',
      last_active_at: new Date(),
      response_time_band: 'fast',
      verified_badge: true,
    });
    expect(score).toBe(100);
  });

  it('availability online gives same credit as available', () => {
    const base: VisibilityScoreInput = {
      profile_completion_score: 50,
      availability_status: 'available',
      last_active_at: new Date(),
      response_time_band: 'normal',
      verified_badge: false,
    };
    const scoreAvail = computeVisibilityScore(base);
    const scoreOnline = computeVisibilityScore({ ...base, availability_status: 'online' });
    expect(scoreAvail).toBe(scoreOnline);
  });

  it('recency decays over time', () => {
    const now = new Date();
    const base: VisibilityScoreInput = {
      profile_completion_score: 50,
      availability_status: null,
      last_active_at: now,
      response_time_band: 'none',
      verified_badge: false,
    };

    const fresh = computeVisibilityScore(base);
    const stale = computeVisibilityScore({
      ...base,
      last_active_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    });
    const ancient = computeVisibilityScore({
      ...base,
      last_active_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    });

    expect(fresh).toBeGreaterThan(stale);
    expect(stale).toBeGreaterThan(ancient);
  });

  it('active boost multiplies score', () => {
    const base: VisibilityScoreInput = {
      profile_completion_score: 50,
      availability_status: 'available',
      last_active_at: new Date(),
      response_time_band: 'normal',
      verified_badge: false,
    };
    const without = computeVisibilityScore(base);
    const withBoost = computeVisibilityScore({
      ...base,
      active_boost: {
        multiplier: 1.2,
        expires_at: new Date(Date.now() + 86400000),
      },
    });
    expect(withBoost).toBeGreaterThan(without);
  });

  it('expired boost has no effect', () => {
    const base: VisibilityScoreInput = {
      profile_completion_score: 50,
      availability_status: 'available',
      last_active_at: new Date(),
      response_time_band: 'normal',
      verified_badge: false,
    };
    const without = computeVisibilityScore(base);
    const withExpired = computeVisibilityScore({
      ...base,
      active_boost: {
        multiplier: 1.5,
        expires_at: new Date(Date.now() - 1000), // expired
      },
    });
    expect(withExpired).toBe(without);
  });

  it('score is clamped to 0-100', () => {
    const score = computeVisibilityScore({
      profile_completion_score: 100,
      availability_status: 'available',
      last_active_at: new Date(),
      response_time_band: 'fast',
      verified_badge: true,
      active_boost: {
        multiplier: 2.0,
        expires_at: new Date(Date.now() + 86400000),
      },
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── checkBadgeEligibility ───────────────────────────────────────────────────

describe('checkBadgeEligibility', () => {
  it('founding_operator when claimed before cutoff', () => {
    const badges = checkBadgeEligibility(
      makeFullSnapshot(),
      100,
      new Date('2026-03-01'),
    );
    expect(badges).toContain('founding_operator');
  });

  it('no founding_operator when claimed after cutoff', () => {
    const badges = checkBadgeEligibility(
      makeFullSnapshot(),
      100,
      new Date('2026-07-01'),
    );
    expect(badges).not.toContain('founding_operator');
  });

  it('verified_operator when id_verification + score >= 80', () => {
    const badges = checkBadgeEligibility(
      makeSnapshot({ id_verification: true, response_time_band: 'normal' }),
      85,
    );
    expect(badges).toContain('verified_operator');
  });

  it('no verified_operator when score < 80', () => {
    const badges = checkBadgeEligibility(
      makeSnapshot({ id_verification: true, response_time_band: 'normal' }),
      70,
    );
    expect(badges).not.toContain('verified_operator');
  });

  it('fast_responder when response_time_band is fast', () => {
    const badges = checkBadgeEligibility(
      makeSnapshot({ response_time_band: 'fast' }),
      50,
    );
    expect(badges).toContain('fast_responder');
  });

  it('no badges for empty profile', () => {
    const badges = checkBadgeEligibility(makeSnapshot(), 0);
    expect(badges).toEqual([]);
  });
});
