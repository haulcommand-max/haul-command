/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  INTENT_OPERATING_SURFACES,
  getIntentOperatingDashboard,
  scoreIntentSurface,
  type IntentOperatingSurface,
} from '../../lib/governance/intent-operating-spine';

describe('intent operating spine', () => {
  it('covers the major money, SEO, social, and workflow surfaces', () => {
    const keys = new Set(INTENT_OPERATING_SURFACES.map((surface) => surface.key));

    expect(keys).toEqual(
      new Set([
        'homepage_search',
        'directory_results',
        'profile_claim',
        'role_pages',
        'public_tools',
        'glossary',
        'community',
        'adgrid',
        'map_corridors',
        'developer_api',
      ]),
    );
  });

  it('requires every surface to expose intent, three next actions, stickiness, social, money, and AEO', () => {
    for (const surface of INTENT_OPERATING_SURFACES) {
      expect(surface.userIntent).not.toHaveLength(0);
      expect(surface.nextActions).toHaveLength(3);
      expect(surface.stickyLoop).not.toHaveLength(0);
      expect(surface.socialLoop).not.toHaveLength(0);
      expect(surface.monetizationPath).not.toHaveLength(0);
      expect(surface.aeoSurface).not.toHaveLength(0);
      expect(surface.evidenceRequired.length).toBeGreaterThanOrEqual(4);
      expect(surface.guardrails.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('scores complete intent surfaces as execution-ready', () => {
    const score = scoreIntentSurface(INTENT_OPERATING_SURFACES[0]);

    expect(score.score).toBe(100);
    expect(score.missing).toEqual([]);
    expect(score.nextFix).toContain('records intent');
  });

  it('flags surfaces that answer but do not route intent into sticky social money loops', () => {
    const weakSurface: IntentOperatingSurface = {
      key: 'glossary',
      surface: '/glossary/example',
      userIntent: 'Read a definition.',
      primaryRoleFamilies: [],
      stage: 'discover',
      nextActions: ['Read', 'Leave', ''],
      stickyLoop: '',
      socialLoop: '',
      monetizationPath: '',
      aeoSurface: '',
      evidenceRequired: ['term'],
      guardrails: [],
    };

    const score = scoreIntentSurface(weakSurface);

    expect(score.score).toBeLessThan(40);
    expect(score.missing).toEqual(
      expect.arrayContaining([
        'Needs role-family coverage.',
        'Needs enough evidence signals to measure intent.',
        'Needs at least two trust/compliance guardrails.',
        'Needs a sticky loop.',
        'Needs a social loop.',
        'Needs a monetization path.',
        'Needs an AEO surface.',
      ]),
    );
  });

  it('summarizes the sitewide intent spine', () => {
    const dashboard = getIntentOperatingDashboard();

    expect(dashboard.total).toBe(10);
    expect(dashboard.averageScore).toBe(100);
    expect(dashboard.complete).toBe(10);
    expect(dashboard.socialReady).toBe(10);
    expect(dashboard.monetizationReady).toBe(10);
  });
});
