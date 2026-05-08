/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  createAssetRegistryEntry,
  getAssetRegistryReadiness,
  validateAssetRegistryEntry,
  type HCAssetRegistryEntry,
} from '../../lib/governance/asset-registry';

function makeAsset(overrides: Partial<HCAssetRegistryEntry> = {}): HCAssetRegistryEntry {
  return createAssetRegistryEntry({
    id: 'load-takeability-truth-card',
    featureName: 'Load Takeability Truth Card',
    ownerSurface: 'load-board',
    status: 'active',
    relatedSupabaseTables: [
      'hc_loads',
      'hc_load_takeability_scores',
      'hc_broker_risk_scores',
      'deadhead_cost_estimates',
    ],
    relatedGithubFiles: [
      'lib/hc-truth/loadTruth.ts',
      'components/loadboard/LoadTruthCard.tsx',
    ],
    relatedRoutes: ['/loads', '/loads/[country]/[region]'],
    relatedVercelEnvs: [],
    purposes: {
      seo: 'Turns load pages into useful market-intelligence surfaces.',
      aeo: 'Provides answer-ready explanations for whether a load is worth taking.',
      adgrid: 'Routes deadhead, payer, escrow, credential, and equipment intent into AdGrid tags.',
      matching: 'Feeds autonomous matching with takeability and readiness signals.',
      trust: 'Surfaces payer reliability and evidence-backed load risk.',
      monetization: 'Supports Fast Lane, escrow, RouteReady, and sponsor paths.',
    },
    countryReadiness: 'global_ready',
    lastAuditedAt: '2026-05-07T12:00:00.000Z',
    safeToEditNotes: 'Pure scoring module. Extend signals before changing public labels.',
    doNotBreakDependencies: ['hc_broker_risk_scores', 'hc_rate_benchmarks'],
    ...overrides,
  });
}

describe('Haul Command Asset Registry', () => {
  it('accepts a fully mapped authority asset', () => {
    const asset = makeAsset();
    const result = validateAssetRegistryEntry(asset);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(getAssetRegistryReadiness(asset)).toBe('complete');
  });

  it('rejects assets with no owner surface or source-of-record dependency map', () => {
    const result = validateAssetRegistryEntry(
      makeAsset({
        ownerSurface: '',
        relatedSupabaseTables: [],
        relatedGithubFiles: [],
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'ownerSurface is required so the asset is not orphaned.',
        'At least one Supabase table/view or GitHub file must be mapped.',
      ]),
    );
  });

  it('marks assets incomplete when authority, trust, or monetization purposes are missing', () => {
    const asset = makeAsset({
      purposes: {
        seo: '',
        aeo: '',
        adgrid: '',
        matching: 'Feeds matching.',
        trust: '',
        monetization: '',
      },
    });

    const result = validateAssetRegistryEntry(asset);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'seo purpose is required for authority tracking.',
        'aeo purpose is required for answer-engine tracking.',
        'adgrid purpose is required for monetization routing.',
        'trust purpose is required for ecosystem confidence.',
        'monetization purpose is required so the asset has a money path.',
      ]),
    );
    expect(getAssetRegistryReadiness(asset)).toBe('blocked');
  });

  it('requires country readiness and safe-to-edit notes', () => {
    const result = validateAssetRegistryEntry(
      makeAsset({
        countryReadiness: 'unknown',
        safeToEditNotes: '',
      }),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'countryReadiness must be more specific than unknown.',
        'safeToEditNotes is required to prevent downgrade drift.',
      ]),
    );
  });
});
