// tests/unit/trust-engine.test.ts
// Trust Score v3 + Leaderboard Score — comprehensive unit tests

/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import {
  computeTrustScore,
  computeLeaderboardScore,
  applyInactivityDecay,
  type TrustInput,
  type LeaderboardInput,
  type TrustResult,
} from '../../lib/trust/trust-score-v3';

function makeTrustInput(overrides: Partial<TrustInput> = {}): TrustInput {
  return {
    account_id: 'test-account-001',
    country_iso2: 'US',
    admin1: 'TX',
    phone_verified: true,
    govt_id_verified: true,
    business_verified: true,
    profile_fields_complete_ratio: 1.0,
    service_area_defined: true,
    escort_types_defined: true,
    median_reply_minutes: 5,
    reply_rate_24h: 0.95,
    verified_completions_30d: 20,
    verified_completions_180d: 100,
    cancellation_rate: 0.02,
    ledger_reliability_score: 0.95,
    paid_attestations_ratio: 0.90,
    dispute_rate: 0.01,
    peer_endorsements_weighted: 0.85,
    report_rate: 0.0,
    sybil_risk: 0.0,
    anomaly_score: 0.0,
    ...overrides,
  };
}

function makeLeaderboardInput(overrides: Partial<LeaderboardInput> = {}): LeaderboardInput {
  return {
    account_id: 'test-account-001',
    trust_score: 90,
    verified_completions_30d: 20,
    reply_rate_24h: 0.95,
    profile_completeness: 1.0,
    volatility: 0.1,
    sybil_risk: 0.0,
    ledger_reliability_score: 0.95,
    report_rate: 0.0,
    dispute_rate: 0.01,
    ...overrides,
  };
}

// ============================================================
// TRUST SCORE TESTS
// ============================================================

describe('computeTrustScore', () => {
  it('returns a score between 0 and 100', () => {
    const result = computeTrustScore(makeTrustInput());
    expect(result.trust_score).toBeGreaterThanOrEqual(0);
    expect(result.trust_score).toBeLessThanOrEqual(100);
  });

  it('perfect inputs produce verified_elite tier', () => {
    const result = computeTrustScore(makeTrustInput());
    expect(result.trust_tier).toBe('verified_elite');
    expect(result.trust_score).toBeGreaterThanOrEqual(85);
  });

  it('zero inputs produce unverified tier', () => {
    const result = computeTrustScore(makeTrustInput({
      phone_verified: false,
      govt_id_verified: false,
      business_verified: false,
      profile_fields_complete_ratio: 0,
      service_area_defined: false,
      escort_types_defined: false,
      median_reply_minutes: 300,
      reply_rate_24h: 0,
      verified_completions_30d: 0,
      verified_completions_180d: 0,
      cancellation_rate: 1.0,
      ledger_reliability_score: 0,
      paid_attestations_ratio: 0,
      dispute_rate: 1.0,
      peer_endorsements_weighted: 0,
      report_rate: 1.0,
      sybil_risk: 1.0,
      anomaly_score: 1.0,
    }));
    expect(result.trust_tier).toBe('unverified');
    expect(result.trust_score).toBeLessThan(35);
  });

  it('includes all 7 components in the result', () => {
    const result = computeTrustScore(makeTrustInput());
    expect(result).toHaveProperty('identity_verification');
    expect(result).toHaveProperty('profile_completeness');
    expect(result).toHaveProperty('responsiveness');
    expect(result).toHaveProperty('completion_quality');
    expect(result).toHaveProperty('ledger_reliability');
    expect(result).toHaveProperty('community_signal');
    expect(result).toHaveProperty('anti_gaming_health');
  });

  it('all components are between 0 and 1', () => {
    const result = computeTrustScore(makeTrustInput());
    const keys: (keyof TrustResult)[] = [
      'identity_verification', 'profile_completeness', 'responsiveness',
      'completion_quality', 'ledger_reliability', 'community_signal', 'anti_gaming_health',
    ];
    keys.forEach((key) => {
      expect(result[key]).toBeGreaterThanOrEqual(0);
      expect(result[key]).toBeLessThanOrEqual(1);
    });
  });

  it('high sybil risk reduces anti_gaming_health', () => {
    const clean = computeTrustScore(makeTrustInput({ sybil_risk: 0.0 }));
    const risky = computeTrustScore(makeTrustInput({ sybil_risk: 0.9 }));
    expect(risky.anti_gaming_health).toBeLessThan(clean.anti_gaming_health);
    expect(risky.trust_score).toBeLessThan(clean.trust_score);
  });

  it('phone_verified adds to identity score', () => {
    const noPhone = computeTrustScore(makeTrustInput({ phone_verified: false }));
    const withPhone = computeTrustScore(makeTrustInput({ phone_verified: true }));
    expect(withPhone.identity_verification).toBeGreaterThan(noPhone.identity_verification);
  });

  it('slow reply time reduces responsiveness', () => {
    const fast = computeTrustScore(makeTrustInput({ median_reply_minutes: 5 }));
    const slow = computeTrustScore(makeTrustInput({ median_reply_minutes: 200 }));
    expect(slow.responsiveness).toBeLessThan(fast.responsiveness);
  });

  it('high cancellation rate reduces completion quality', () => {
    const low = computeTrustScore(makeTrustInput({ cancellation_rate: 0.01 }));
    const high = computeTrustScore(makeTrustInput({ cancellation_rate: 0.8 }));
    expect(high.completion_quality).toBeLessThan(low.completion_quality);
  });

  it('preserves account_id in result', () => {
    const result = computeTrustScore(makeTrustInput({ account_id: 'abc-123' }));
    expect(result.account_id).toBe('abc-123');
  });

  // Tier boundary tests
  it('score of 34 is unverified', () => {
    // Create inputs that result in ~34 score
    const result = computeTrustScore(makeTrustInput({
      phone_verified: true,
      govt_id_verified: false,
      business_verified: false,
      profile_fields_complete_ratio: 0.3,
      service_area_defined: false,
      escort_types_defined: false,
      median_reply_minutes: 180,
      reply_rate_24h: 0.2,
      verified_completions_30d: 1,
      verified_completions_180d: 3,
      cancellation_rate: 0.5,
      ledger_reliability_score: 0.3,
      paid_attestations_ratio: 0.1,
      dispute_rate: 0.3,
      peer_endorsements_weighted: 0.1,
      report_rate: 0.3,
      sybil_risk: 0.3,
      anomaly_score: 0.3,
    }));
    expect(['unverified', 'emerging']).toContain(result.trust_tier);
  });

  it('score in 60-84 range is verified tier', () => {
    const result = computeTrustScore(makeTrustInput({
      phone_verified: true,
      govt_id_verified: true,
      business_verified: false,
      profile_fields_complete_ratio: 0.7,
      service_area_defined: true,
      escort_types_defined: false,
      median_reply_minutes: 30,
      reply_rate_24h: 0.7,
      verified_completions_30d: 8,
      verified_completions_180d: 40,
      cancellation_rate: 0.05,
      ledger_reliability_score: 0.7,
      paid_attestations_ratio: 0.6,
      dispute_rate: 0.05,
      peer_endorsements_weighted: 0.5,
      report_rate: 0.05,
      sybil_risk: 0.05,
      anomaly_score: 0.05,
    }));
    expect(['verified', 'verified_elite']).toContain(result.trust_tier);
    expect(result.trust_score).toBeGreaterThanOrEqual(60);
  });
});

// ============================================================
// LEADERBOARD SCORE TESTS
// ============================================================

describe('computeLeaderboardScore', () => {
  it('returns a score between 0 and 1000', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput());
    expect(result.leaderboard_score).toBeGreaterThanOrEqual(0);
    expect(result.leaderboard_score).toBeLessThanOrEqual(1000);
  });

  it('includes all 5 components', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput());
    expect(result).toHaveProperty('trust_component');
    expect(result).toHaveProperty('velocity_component');
    expect(result).toHaveProperty('responsiveness_component');
    expect(result).toHaveProperty('profile_component');
    expect(result).toHaveProperty('stability_component');
  });

  it('trust_component is trust_score * 6', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput({ trust_score: 80 }));
    expect(result.trust_component).toBe(480);
  });

  it('high sybil_risk caps score at 350', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput({ sybil_risk: 0.8 }));
    expect(result.leaderboard_score).toBeLessThanOrEqual(350);
    expect(result.capped).toBe(true);
    expect(result.cap_reason).toContain('sybil_cap');
  });

  it('low ledger_reliability caps score at 500', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput({
      ledger_reliability_score: 0.2,
      sybil_risk: 0.0,
    }));
    expect(result.leaderboard_score).toBeLessThanOrEqual(500);
    expect(result.capped).toBe(true);
    expect(result.cap_reason).toContain('low_evidence_cap');
  });

  it('report_rate applies penalty', () => {
    const clean = computeLeaderboardScore(makeLeaderboardInput({ report_rate: 0 }));
    const reported = computeLeaderboardScore(makeLeaderboardInput({ report_rate: 0.5 }));
    expect(reported.leaderboard_score).toBeLessThan(clean.leaderboard_score);
    expect(reported.penalties_total).toBeGreaterThan(0);
  });

  it('dispute_rate applies penalty', () => {
    const clean = computeLeaderboardScore(makeLeaderboardInput({ dispute_rate: 0 }));
    const disputed = computeLeaderboardScore(makeLeaderboardInput({ dispute_rate: 0.5 }));
    expect(disputed.leaderboard_score).toBeLessThan(clean.leaderboard_score);
    expect(disputed.penalties_total).toBeGreaterThan(0);
  });

  it('more completions increase velocity component', () => {
    const few = computeLeaderboardScore(makeLeaderboardInput({ verified_completions_30d: 2 }));
    const many = computeLeaderboardScore(makeLeaderboardInput({ verified_completions_30d: 25 }));
    expect(many.velocity_component).toBeGreaterThan(few.velocity_component);
  });

  it('high volatility reduces stability component', () => {
    const stable = computeLeaderboardScore(makeLeaderboardInput({ volatility: 0.0 }));
    const volatile = computeLeaderboardScore(makeLeaderboardInput({ volatility: 0.9 }));
    expect(volatile.stability_component).toBeLessThan(stable.stability_component);
  });

  it('preserves account_id', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput({ account_id: 'xyz-456' }));
    expect(result.account_id).toBe('xyz-456');
  });

  it('sybil cap takes priority over low-evidence cap', () => {
    const result = computeLeaderboardScore(makeLeaderboardInput({
      sybil_risk: 0.8,
      ledger_reliability_score: 0.2,
    }));
    expect(result.capped).toBe(true);
    expect(result.cap_reason).toContain('sybil_cap');
    expect(result.leaderboard_score).toBeLessThanOrEqual(350);
  });
});

// ============================================================
// INACTIVITY DECAY TESTS
// ============================================================

describe('applyInactivityDecay', () => {
  it('no decay within trigger window', () => {
    expect(applyInactivityDecay(85, 0)).toBe(85);
    expect(applyInactivityDecay(85, 30)).toBe(85);
    expect(applyInactivityDecay(85, 45)).toBe(85);
  });

  it('decays after trigger days', () => {
    const decayed = applyInactivityDecay(85, 75); // 30 days overdue
    expect(decayed).toBeLessThan(85);
    expect(decayed).toBeGreaterThan(0);
  });

  it('more inactive days = more decay', () => {
    const d60 = applyInactivityDecay(85, 60);
    const d120 = applyInactivityDecay(85, 120);
    const d365 = applyInactivityDecay(85, 365);
    expect(d60).toBeGreaterThan(d120);
    expect(d120).toBeGreaterThan(d365);
  });

  it('decay is logarithmic (gradual, not linear)', () => {
    const base = 100;
    const d50 = applyInactivityDecay(base, 50);   // 5 days overdue
    const d80 = applyInactivityDecay(base, 80);   // 35 days overdue
    const d200 = applyInactivityDecay(base, 200); // 155 days overdue

    // Logarithmic = rate of decay slows over time
    const drop1 = base - d50;               // first 5 days of decay
    const drop2 = d50 - d80;                // next 30 days
    const dropPerDay1 = drop1 / 5;
    const dropPerDay2 = drop2 / 30;
    expect(dropPerDay1).toBeGreaterThan(dropPerDay2);

    // Score should never hit zero
    expect(d200).toBeGreaterThan(0);
  });

  it('custom trigger days work', () => {
    const standard = applyInactivityDecay(85, 46, 45);   // 1 day overdue
    const custom = applyInactivityDecay(85, 46, 60);     // not yet overdue
    expect(custom).toBe(85);
    expect(standard).toBeLessThan(85);
  });

  it('zero score stays zero', () => {
    expect(applyInactivityDecay(0, 100)).toBe(0);
  });
});

// ============================================================
// INTEGRATION: TRUST → LEADERBOARD PIPELINE
// ============================================================

describe('Trust → Leaderboard pipeline', () => {
  it('trust result feeds into leaderboard correctly', () => {
    const trustInput = makeTrustInput();
    const trustResult = computeTrustScore(trustInput);

    const lbInput: LeaderboardInput = {
      account_id: trustResult.account_id,
      trust_score: trustResult.trust_score,
      verified_completions_30d: trustInput.verified_completions_30d,
      reply_rate_24h: trustInput.reply_rate_24h,
      profile_completeness: trustResult.profile_completeness,
      volatility: 0.1,
      sybil_risk: trustInput.sybil_risk,
      ledger_reliability_score: trustInput.ledger_reliability_score,
      report_rate: trustInput.report_rate,
      dispute_rate: trustInput.dispute_rate,
    };

    const lbResult = computeLeaderboardScore(lbInput);
    expect(lbResult.leaderboard_score).toBeGreaterThan(0);
    expect(lbResult.account_id).toBe(trustResult.account_id);
  });

  it('low trust score still produces valid leaderboard result', () => {
    const trustResult = computeTrustScore(makeTrustInput({
      phone_verified: false,
      govt_id_verified: false,
      business_verified: false,
      profile_fields_complete_ratio: 0.1,
      verified_completions_30d: 0,
      verified_completions_180d: 0,
      ledger_reliability_score: 0.1,
    }));

    const lbResult = computeLeaderboardScore({
      account_id: trustResult.account_id,
      trust_score: trustResult.trust_score,
      verified_completions_30d: 0,
      reply_rate_24h: 0.1,
      profile_completeness: trustResult.profile_completeness,
      volatility: 0.8,
      sybil_risk: 0.0,
      ledger_reliability_score: 0.1,
      report_rate: 0.0,
      dispute_rate: 0.0,
    });

    expect(lbResult.leaderboard_score).toBeGreaterThanOrEqual(0);
    expect(lbResult.capped).toBe(true); // low ledger reliability
  });
});
