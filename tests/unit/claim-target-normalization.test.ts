import { describe, expect, it } from 'vitest';

import {
  buildClaimPath,
  buildClaimResolutionCandidates,
  normalizeClaimParams,
} from '../../lib/claims/claim-target';

describe('claim target normalization', () => {
  it('accepts every claim CTA parameter and preserves intent/source passthrough', () => {
    const params = normalizeClaimParams({
      hcid: ' HC-TX-123 ',
      entity: 'entity-1',
      operator: 'op-1',
      eq: 'equipment-1',
      listing: 'listing-1',
      place: 'place-1',
      surface_id: 'surface-1',
      id: 'id-1',
      slug: 'big-yard',
      market: 'TX',
      country: 'US',
      region: 'TX',
      role: 'pilot-car-operator',
      corridor: 'i-10-tx',
      plan: 'verified',
      upgrade: 'territory',
      tool: 'haulsuggest',
      ref: 'ref-123',
      intent: 'profile-readiness',
      source: 'directory-card',
    });

    expect(params).toMatchObject({
      hcid: 'HC-TX-123',
      entity: 'entity-1',
      operator: 'op-1',
      eq: 'equipment-1',
      listing: 'listing-1',
      place: 'place-1',
      surface_id: 'surface-1',
      id: 'id-1',
      slug: 'big-yard',
      market: 'TX',
      country: 'US',
      region: 'TX',
      role: 'pilot-car-operator',
      corridor: 'i-10-tx',
      plan: 'verified',
      upgrade: 'territory',
      tool: 'haulsuggest',
      ref: 'ref-123',
      intent: 'profile-readiness',
      source: 'directory-card',
    });
  });

  it('builds auth-safe claim paths without dropping the original target', () => {
    const path = buildClaimPath(
      normalizeClaimParams({
      listing: 'listing-1',
      place: 'place-1',
      country: 'GB',
      role: 'route-surveyor',
      corridor: 'felixstowe-midlands',
      intent: 'list-location',
      source: 'tool',
    }),
    );

    expect(path).toBe('/claim?listing=listing-1&place=place-1&country=GB&role=route-surveyor&corridor=felixstowe-midlands&intent=list-location&source=tool');
  });

  it('treats HC IDs submitted through flexible operator fields as operator HC IDs', () => {
    const candidates = buildClaimResolutionCandidates(
      normalizeClaimParams({
        operator: 'HC-FL-9',
      }),
    );

    expect(candidates[0]).toMatchObject({
      table: 'operators',
      column: 'hc_id',
      value: 'HC-FL-9',
      targetParam: 'operator',
    });
  });

  it('prioritizes operators, then global operators, then places without assuming one table', () => {
    const candidates = buildClaimResolutionCandidates(
      normalizeClaimParams({
        hcid: 'HC-FL-9',
        listing: 'global-1',
        place: 'yard-1',
        slug: 'miami-yard',
      }),
    );

    expect(candidates.map((candidate) => `${candidate.table}.${candidate.column}`)).toEqual([
      'v_hc_directory_claim_requirements.id',
      'directory_entities.id',
      'directory_entities.hc_id',
      'operators.hc_id',
      'operators.id',
      'hc_global_operators.id',
      'hc_global_operators.slug',
      'hc_places.id',
      'hc_places.slug',
    ]);
  });

  it('resolves explicit directory entity claims before legacy operator surfaces', () => {
    const candidates = buildClaimResolutionCandidates(
      normalizeClaimParams({
        entity: 'entity-123',
        operator: 'operator-123',
      }),
    );

    expect(candidates.slice(0, 2).map((candidate) => `${candidate.table}.${candidate.column}`)).toEqual([
      'v_hc_directory_claim_requirements.id',
      'directory_entities.id',
    ]);
    expect(candidates[0]).toMatchObject({
      entityType: 'directory_entity',
      targetParam: 'entity',
      value: 'entity-123',
    });
  });

  it('adds corridor resolution without dropping role intent', () => {
    const candidates = buildClaimResolutionCandidates(
      normalizeClaimParams({
        corridor: 'i-10-houston-san-antonio',
        role: 'escort-operator',
      }),
    );

    expect(candidates).toEqual([
      {
        table: 'hc_corridor_public_v1',
        column: 'id',
        value: 'i-10-houston-san-antonio',
        entityType: 'corridor',
        targetParam: 'corridor',
      },
      {
        table: 'hc_corridor_public_v1',
        column: 'slug',
        value: 'i-10-houston-san-antonio',
        entityType: 'corridor',
        targetParam: 'corridor',
      },
    ]);
  });
});
