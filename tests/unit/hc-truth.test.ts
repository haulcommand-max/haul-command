/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  buildLoadTruthCard,
  getAdgridIntentTags,
  getInsuranceCopy,
  getPayerRiskCopy,
  getTruthLevel,
  normalizeTruthCard,
  type HCTruthCard,
  type HCTruthSignal,
} from '../../lib/hc-truth';

describe('HC Truth Layer scoring', () => {
  it('maps scores into public-safe truth levels', () => {
    expect(getTruthLevel(96)).toBe('excellent');
    expect(getTruthLevel(82)).toBe('good');
    expect(getTruthLevel(61)).toBe('watch');
    expect(getTruthLevel(36)).toBe('risk');
    expect(getTruthLevel(18)).toBe('blocked');
  });

  it('can intentionally represent unknown evidence without pretending confidence', () => {
    expect(getTruthLevel(null)).toBe('unknown');
    expect(getTruthLevel(undefined)).toBe('unknown');
  });
});

describe('HC Truth Layer no-dead-end behavior', () => {
  it('adds a safe next action when a warning card has none', () => {
    const signal: HCTruthSignal = {
      key: 'payer_limited_history',
      label: 'Limited payer history',
      level: 'watch',
      scoreImpact: -12,
      publicSummary: 'Limited payment history available.',
      sourceTable: 'hc_broker_risk_scores',
      evidenceCount: 1,
    };

    const card = normalizeTruthCard({
      entityType: 'payer',
      entityId: 'payer-001',
      score: 58,
      level: 'watch',
      headline: 'Proceed carefully',
      summary: 'This payer has limited payment history in Haul Command.',
      signals: [signal],
      missingRequirements: [],
      suggestedActions: [],
      suggestedQuestions: [],
      monetizationTriggers: [],
      adgridIntentTags: [],
      lastComputedAt: '2026-05-07T12:00:00.000Z',
    });

    expect(card.suggestedActions).toContain(
      'Review the evidence, confirm terms in writing, and choose the safest available next step.',
    );
  });
});

describe('HC Truth Layer public-safe copy', () => {
  it('does not use legally risky payer labels for limited history', () => {
    const copy = getPayerRiskCopy('unknown');
    expect(copy).toContain('Limited payment history');
    expect(copy.toLowerCase()).not.toContain('scam');
    expect(copy.toLowerCase()).not.toContain('fraud');
  });

  it('keeps insurance language verification-safe', () => {
    expect(getInsuranceCopy('uploaded')).toBe(
      'Insurance document uploaded. Coverage should be independently verified before dispatch.',
    );
    expect(getInsuranceCopy('missing')).toBe(
      'No insurance document is currently visible on this profile.',
    );
  });
});

describe('HC Truth Layer AdGrid intent tags', () => {
  it('maps operational pain signals into monetizable intent tags', () => {
    const signals: HCTruthSignal[] = [
      {
        key: 'insurance_gap',
        label: 'Insurance gap',
        level: 'watch',
        scoreImpact: -10,
        publicSummary: 'Insurance needs review.',
      },
      {
        key: 'deadhead_high',
        label: 'High deadhead',
        level: 'risk',
        scoreImpact: -18,
        publicSummary: 'Deadhead may pressure margin.',
      },
      {
        key: 'payer_limited_history',
        label: 'Limited payer history',
        level: 'watch',
        scoreImpact: -12,
        publicSummary: 'Confirm payment terms.',
      },
      {
        key: 'equipment_missing',
        label: 'Equipment missing',
        level: 'blocked',
        scoreImpact: -30,
        publicSummary: 'Equipment proof is missing.',
      },
    ];

    expect(getAdgridIntentTags(signals)).toEqual([
      'commercial-insurance',
      'fuel-card',
      'escrow-fast-pay',
      'pilot-car-equipment',
    ]);
  });
});

describe('buildLoadTruthCard', () => {
  it('warns against weak-rate loads with high deadhead and limited payer history', () => {
    const card = buildLoadTruthCard({
      loadId: 'load-houston-laredo-001',
      rateCents: 45000,
      marketRateCents: 70000,
      deadheadMiles: 315,
      estimatedDeadheadCostCents: 20475,
      payerReliabilityScore: null,
      depositFunded: false,
      escrowAvailable: true,
      credentialMatched: true,
      equipmentMatched: true,
      routeRiskLevel: 'watch',
      countryCode: 'US',
      corridorSlug: 'houston-tx-to-laredo-tx',
      computedAt: '2026-05-07T12:00:00.000Z',
    });

    expect(card.entityType).toBe('load');
    expect(card.entityId).toBe('load-houston-laredo-001');
    expect(card.level).toBe('risk');
    expect(card.headline).toBe('Proceed carefully before accepting this load');
    expect(card.signals.map((signal) => signal.key)).toEqual(
      expect.arrayContaining(['rate_below_market', 'deadhead_high', 'payer_limited_history']),
    );
    expect(card.suggestedQuestions).toEqual(
      expect.arrayContaining([
        'Is deadhead, hotel, no-go, detention, and layover pay written into the rate confirmation?',
        'Will the payer fund escrow, deposit, or fast-pay protection before dispatch?',
      ]),
    );
    expect(card.suggestedActions).toEqual(
      expect.arrayContaining([
        'Set or review your rate floor before accepting this load.',
        'Request written payment terms before dispatch.',
      ]),
    );
    expect(card.adgridIntentTags).toEqual(
      expect.arrayContaining(['fuel-card', 'escrow-fast-pay']),
    );
  });
});
