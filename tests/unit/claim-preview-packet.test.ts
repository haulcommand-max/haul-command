/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import {
  buildClaimPreviewPacket,
  normalizeClaimRole,
} from '../../lib/claims/claim-preview-packet';

describe('claim preview packet', () => {
  it('normalizes role language into role-aware claim paths', () => {
    expect(normalizeClaimRole('Pilot Car Operator')).toBe('pilot_car_operator');
    expect(normalizeClaimRole('permit expediter')).toBe('permit_service');
    expect(normalizeClaimRole('route survey company')).toBe('route_surveyor');
    expect(normalizeClaimRole('equipment installer')).toBe('equipment_supplier');
    expect(normalizeClaimRole('freight broker')).toBe('broker');
  });

  it('builds proof-safe metrics when no real profile demand numbers exist', () => {
    const packet = buildClaimPreviewPacket({
      name: 'North Florida Escort',
      roleKey: 'pilot car',
      region: 'FL',
      countryCode: 'US',
      isClaimed: false,
    });

    expect(packet.statusLabel).toBe('Unclaimed');
    expect(packet.profileCompleteness).toBeGreaterThanOrEqual(70);
    expect(packet.metrics).toEqual([
      { label: 'Search appearances', value: 'Eligible after indexing', evidence: 'eligibility' },
      { label: 'Profile views', value: 'Tracked after visits', evidence: 'eligibility' },
      { label: 'Demand matches', value: 'Available after market signals', evidence: 'eligibility' },
    ]);
    expect(packet.nextActions).toEqual(['Claim free', 'Confirm service area', 'Turn on job alerts']);
  });

  it('uses actual metrics only when supplied', () => {
    const packet = buildClaimPreviewPacket({
      roleKey: 'broker',
      city: 'Houston',
      region: 'TX',
      countryCode: 'US',
      actualSearchAppearances: 18,
      actualProfileViews: 4,
      actualDemandMatches: 2,
    });

    expect(packet.roleKey).toBe('broker');
    expect(packet.locationLabel).toBe('Houston, TX, US');
    expect(packet.metrics.map((metric) => metric.evidence)).toEqual(['actual', 'actual', 'actual']);
    expect(packet.metrics.map((metric) => metric.value)).toEqual(['18', '4', '2']);
  });
});
