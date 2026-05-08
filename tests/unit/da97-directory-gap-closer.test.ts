/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  DA97_DIRECTORY_GAPS,
  getDA97GapDashboard,
  scoreDA97Gap,
  type DA97Gap,
} from '../../lib/governance/da97-directory-gap-closer';

describe('DA97 directory gap closer', () => {
  it('maps the core competitors into concrete Haul Command counter-moves', () => {
    const competitors = new Set(DA97_DIRECTORY_GAPS.map((gap) => gap.competitor));

    expect(competitors).toEqual(
      new Set(['ods', 'esc', 'jj_keller', 'pilot_car_loads', 'oversize_io', 'legacy_directory']),
    );
  });

  it('requires each gap to include surfaces, signals, guardrails, a moat, and revenue path', () => {
    for (const gap of DA97_DIRECTORY_GAPS) {
      expect(gap.requiredSurfaces.length).toBeGreaterThanOrEqual(3);
      expect(gap.requiredDataSignals.length).toBeGreaterThanOrEqual(5);
      expect(gap.requiredGuardrails.length).toBeGreaterThanOrEqual(2);
      expect(gap.minimum15xImprovement).not.toHaveLength(0);
      expect(gap.moatCreated).not.toHaveLength(0);
      expect(gap.revenuePath).not.toHaveLength(0);
    }
  });

  it('scores a complete gap as moat-ready enough for execution tracking', () => {
    const score = scoreDA97Gap(DA97_DIRECTORY_GAPS[0]);

    expect(score.score).toBeGreaterThanOrEqual(90);
    expect(score.missing).toEqual([]);
    expect(score.nextAction).toContain('proving the signals');
  });

  it('flags strategy-only gaps that lack measurable implementation requirements', () => {
    const weakGap: DA97Gap = {
      id: 'weak-gap',
      competitor: 'legacy_directory',
      competitorStrength: 'Has old SEO.',
      haulCommandCounter: 'Be better.',
      pillar: 'identity_graph',
      minimum15xImprovement: '',
      moatCreated: '',
      requiredSurfaces: ['/directory'],
      requiredDataSignals: ['claim_status'],
      requiredGuardrails: [],
      revenuePath: '',
      status: 'open',
    };

    const score = scoreDA97Gap(weakGap);

    expect(score.score).toBeLessThan(50);
    expect(score.missing).toEqual(
      expect.arrayContaining([
        'Needs at least three connected product surfaces.',
        'Needs richer data signals to become measurable.',
        'Needs stronger trust and legal guardrails.',
        'Needs a revenue path.',
        'Needs an explicit moat.',
        'Needs a 15X improvement statement.',
      ]),
    );
  });

  it('summarizes the directory gap closure dashboard', () => {
    const dashboard = getDA97GapDashboard();

    expect(dashboard.total).toBe(6);
    expect(dashboard.averageScore).toBeGreaterThanOrEqual(90);
    expect(dashboard.inProgress).toBeGreaterThanOrEqual(3);
    expect(dashboard.moatReady).toBe(6);
  });
});
