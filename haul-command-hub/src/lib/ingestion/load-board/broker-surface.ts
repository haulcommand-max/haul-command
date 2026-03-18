/**
 * Haul Command — Broker Surface Builder
 *
 * Automatically creates and maintains broker acquisition surfaces from
 * ingested broker-role observations. Every broker phone/alias/corridor
 * becomes an acquisition wedge.
 *
 * scrape → normalize → create broker surface → enrich → score → activate
 *
 * Global: country-agnostic, all 57 countries.
 */

import type {
  OrganizationCandidate,
  EntityScores,
  ParsedObservation,
} from './types';

// ─── Broker Surface Types ────────────────────────────────────────

export type AcquisitionStatus =
  | 'seeded'
  | 'observed_only'
  | 'claim_ready'
  | 'outreach_ready'
  | 'activation_ready'
  | 'claimed'
  | 'onboarded'
  | 'high_value_watchlist'
  | 'internal_hold';

export interface BrokerSurface {
  // Identity
  broker_surface_id: string;
  canonical_display_name: string;
  canonical_company_candidate: string | null;
  primary_phone: string | null;
  additional_phones: string[];
  alias_cluster_ids: string[];
  linked_identity_id: string | null;
  verification_status: 'unverified' | 'id_verified' | 'manually_verified';

  // Acquisition
  acquisition_status: AcquisitionStatus;
  activation_priority_score: number;
  claim_priority_score: number;
  outreach_priority_score: number;
  growth_target_flag: boolean;
  first_seen_at: string;
  last_seen_at: string;

  // Market
  observed_corridors: string[];
  observed_route_families: string[];
  observed_service_types: string[];
  observed_price_points: number[];
  observed_urgency_patterns: string[];
  observed_payment_patterns: string[];
  recurrence_score: number;
  corridor_strength_score: number;

  // Trust
  internal_risk_score: number;
  warning_cluster_count: number;
  internal_notes_only: boolean;

  // Geography
  countries_seen: string[];
  admin_divisions_seen: string[];
  origin_locations_seen: string[];
  destination_locations_seen: string[];

  // Surface
  profile_slug: string;
  public_surface_eligibility: boolean;
  claimable_surface_flag: boolean;
  internal_seed_flag: boolean;
  monetization_value_score: number;
}

export interface BrokerSurfaceSummary {
  broker_surfaces_created: number;
  broker_surfaces_updated: number;
  claim_ready_count: number;
  outreach_ready_count: number;
  activation_ready_count: number;
  watchlist_count: number;
  top_new_surfaces: {
    broker_surface_id: string;
    canonical_display_name: string;
    primary_phone: string | null;
    activation_priority_score: number;
  }[];
  top_activation_candidates: {
    broker_surface_id: string;
    canonical_display_name: string;
    primary_phone: string | null;
    activation_priority_score: number;
    reason: string;
  }[];
  top_claim_ready: {
    broker_surface_id: string;
    canonical_display_name: string;
    claim_priority_score: number;
  }[];
}

// ─── Builder ─────────────────────────────────────────────────────

export class BrokerSurfaceBuilder {
  private surfaces: Map<string, BrokerSurface> = new Map();
  private surfacesByPhone: Map<string, BrokerSurface> = new Map();

  /**
   * Build broker surfaces from resolved organizations and their observations.
   */
  buildSurfaces(
    orgs: OrganizationCandidate[],
    entityScores: { org: OrganizationCandidate; scores: EntityScores }[],
    observations: ParsedObservation[],
  ): void {
    const scoresMap = new Map(entityScores.map(e => [e.org.canonical_name, e.scores]));

    for (const org of orgs) {
      // Only create surface for broker_role_observed actors
      const isBroker = org.role_candidates.some(
        r => r.role === 'broker_role_observed' || r.role === 'dispatcher_role_observed'
      );
      if (!isBroker && org.phones.length === 0 && !org.canonical_name) continue;

      const primaryPhone = org.phones[0] ?? null;
      const lookupKey = primaryPhone ?? org.canonical_name;

      // Check if surface exists (by phone first, then name)
      let surface = primaryPhone ? this.surfacesByPhone.get(primaryPhone) : undefined;
      if (!surface) surface = this.surfaces.get(org.canonical_name);

      const scores = scoresMap.get(org.canonical_name);
      const orgObs = observations.filter(o =>
        (o.normalized_phone && org.phones.includes(o.normalized_phone)) ||
        (o.parsed_name_or_company && org.aliases.includes(o.parsed_name_or_company))
      );

      if (surface) {
        // Update existing surface
        this.updateSurface(surface, org, scores, orgObs);
      } else {
        // Create new surface
        surface = this.createSurface(org, scores, orgObs);
        this.surfaces.set(org.canonical_name, surface);
        if (primaryPhone) this.surfacesByPhone.set(primaryPhone, surface);
        // Also index additional phones
        for (const ph of org.phones.slice(1)) {
          this.surfacesByPhone.set(ph, surface);
        }
      }
    }
  }

  private createSurface(
    org: OrganizationCandidate,
    scores: EntityScores | undefined,
    obs: ParsedObservation[],
  ): BrokerSurface {
    const corridors: string[] = [];
    const routeFamilies: string[] = [];
    const serviceTypes: string[] = [];
    const pricePoints: number[] = [];
    const urgencyPatterns: string[] = [];
    const paymentPatterns: string[] = [];
    const countries: string[] = [];
    const adminDivs: string[] = [];
    const origins: string[] = [];
    const dests: string[] = [];

    for (const o of obs) {
      if (o.corridor_key && !corridors.includes(o.corridor_key)) corridors.push(o.corridor_key);
      if (o.route_family_key && !routeFamilies.includes(o.route_family_key)) routeFamilies.push(o.route_family_key);
      if (o.service_type !== 'unknown' && !serviceTypes.includes(o.service_type)) serviceTypes.push(o.service_type);
      if (o.pricing?.quoted_amount) pricePoints.push(o.pricing.quoted_amount);
      if (o.urgency !== 'unspecified' && !urgencyPatterns.includes(o.urgency)) urgencyPatterns.push(o.urgency);
      if (o.payment_terms !== 'unspecified' && !paymentPatterns.includes(o.payment_terms)) paymentPatterns.push(o.payment_terms);
      if (o.country_code && !countries.includes(o.country_code)) countries.push(o.country_code);
      if (o.origin_admin_division && !adminDivs.includes(o.origin_admin_division)) adminDivs.push(o.origin_admin_division);
      if (o.destination_admin_division && !adminDivs.includes(o.destination_admin_division)) adminDivs.push(o.destination_admin_division);
      if (o.origin_raw && !origins.includes(o.origin_raw)) origins.push(o.origin_raw);
      if (o.destination_raw && !dests.includes(o.destination_raw)) dests.push(o.destination_raw);
    }

    const activationScore = this.computeActivationScore(org, scores, obs);
    const claimScore = scores?.claim_priority_score ?? 0;
    const outreachScore = this.computeOutreachScore(org, scores, obs);
    const monetizationScore = scores?.monetization_value_score ?? 0;

    const status = this.determineStatus(activationScore, claimScore, outreachScore, scores);

    return {
      broker_surface_id: `bsrf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      canonical_display_name: org.display_name,
      canonical_company_candidate: org.canonical_name,
      primary_phone: org.phones[0] ?? null,
      additional_phones: org.phones.slice(1),
      alias_cluster_ids: org.aliases,
      linked_identity_id: org.linked_identity_id ?? null,
      verification_status: 'unverified',

      acquisition_status: status,
      activation_priority_score: activationScore,
      claim_priority_score: claimScore,
      outreach_priority_score: outreachScore,
      growth_target_flag: activationScore >= 0.5,
      first_seen_at: org.first_seen,
      last_seen_at: org.last_seen,

      observed_corridors: corridors,
      observed_route_families: routeFamilies,
      observed_service_types: serviceTypes,
      observed_price_points: pricePoints,
      observed_urgency_patterns: urgencyPatterns,
      observed_payment_patterns: paymentPatterns,
      recurrence_score: org.recurrence_score,
      corridor_strength_score: corridors.length * 0.15,

      internal_risk_score: scores?.internal_risk_score ?? 0,
      warning_cluster_count: 0,
      internal_notes_only: true,

      countries_seen: countries,
      admin_divisions_seen: adminDivs,
      origin_locations_seen: origins,
      destination_locations_seen: dests,

      profile_slug: slugify(org.display_name),
      public_surface_eligibility: (scores?.entity_confidence_score ?? 0) >= 0.6 && org.observation_count >= 2,
      claimable_surface_flag: !!org.phones[0] || org.observation_count >= 2,
      internal_seed_flag: true,
      monetization_value_score: monetizationScore,
    };
  }

  private updateSurface(
    surface: BrokerSurface,
    org: OrganizationCandidate,
    scores: EntityScores | undefined,
    obs: ParsedObservation[],
  ): void {
    // Append new aliases
    for (const alias of org.aliases) {
      if (!surface.alias_cluster_ids.includes(alias)) surface.alias_cluster_ids.push(alias);
    }
    // Append phones
    for (const ph of org.phones) {
      if (ph !== surface.primary_phone && !surface.additional_phones.includes(ph)) {
        surface.additional_phones.push(ph);
      }
    }
    // Append observations data
    for (const o of obs) {
      if (o.corridor_key && !surface.observed_corridors.includes(o.corridor_key)) surface.observed_corridors.push(o.corridor_key);
      if (o.route_family_key && !surface.observed_route_families.includes(o.route_family_key)) surface.observed_route_families.push(o.route_family_key);
      if (o.service_type !== 'unknown' && !surface.observed_service_types.includes(o.service_type)) surface.observed_service_types.push(o.service_type);
      if (o.pricing?.quoted_amount) surface.observed_price_points.push(o.pricing.quoted_amount);
      if (o.country_code && !surface.countries_seen.includes(o.country_code)) surface.countries_seen.push(o.country_code);
    }

    // Refresh scores
    surface.activation_priority_score = this.computeActivationScore(org, scores, obs);
    surface.claim_priority_score = scores?.claim_priority_score ?? surface.claim_priority_score;
    surface.outreach_priority_score = this.computeOutreachScore(org, scores, obs);
    surface.monetization_value_score = scores?.monetization_value_score ?? surface.monetization_value_score;
    surface.recurrence_score = org.recurrence_score;
    surface.last_seen_at = org.last_seen;

    // Re-determine status
    surface.acquisition_status = this.determineStatus(
      surface.activation_priority_score,
      surface.claim_priority_score,
      surface.outreach_priority_score,
      scores,
    );
  }

  private computeActivationScore(
    org: OrganizationCandidate,
    scores: EntityScores | undefined,
    obs: ParsedObservation[],
  ): number {
    let score = 0;
    if (org.phones.length > 0) score += 0.2;
    if (org.observation_count >= 3) score += 0.15;
    if (org.observation_count >= 5) score += 0.1;
    if (org.corridors_seen.length >= 2) score += 0.1;
    if (org.country_codes.length >= 2) score += 0.1;
    if (obs.some(o => o.pricing)) score += 0.1;
    if (obs.some(o => o.urgency !== 'unspecified')) score += 0.05;
    if ((scores?.entity_confidence_score ?? 0) >= 0.6) score += 0.1;
    if ((scores?.data_completeness_score ?? 0) >= 0.6) score += 0.1;
    return Math.min(1, Math.round(score * 100) / 100);
  }

  private computeOutreachScore(
    org: OrganizationCandidate,
    scores: EntityScores | undefined,
    obs: ParsedObservation[],
  ): number {
    let score = 0;
    if (org.phones.length >= 1) score += 0.25;
    if (org.observation_count >= 2) score += 0.2;
    if (org.corridors_seen.length >= 2) score += 0.15;
    if ((scores?.entity_confidence_score ?? 0) >= 0.5) score += 0.2;
    if (obs.some(o => o.pricing)) score += 0.1;
    if (org.aliases.length >= 2) score += 0.1;
    return Math.min(1, Math.round(score * 100) / 100);
  }

  private determineStatus(
    activation: number,
    claim: number,
    outreach: number,
    scores: EntityScores | undefined,
  ): AcquisitionStatus {
    if ((scores?.internal_risk_score ?? 0) > 0.7) return 'internal_hold';
    if (activation >= 0.7) return 'activation_ready';
    if (outreach >= 0.6) return 'outreach_ready';
    if (claim >= 0.5) return 'claim_ready';
    if (activation >= 0.3) return 'high_value_watchlist';
    if (claim >= 0.2) return 'observed_only';
    return 'seeded';
  }

  // ─── Output ──────────────────────────────────────────────────────

  getSurfaces(): BrokerSurface[] {
    return Array.from(this.surfaces.values());
  }

  getSummary(): BrokerSurfaceSummary {
    const all = this.getSurfaces();
    const created = all.length;
    const updated = 0; // In single-batch context, all are "created"

    const claimReady = all.filter(s => s.acquisition_status === 'claim_ready');
    const outreachReady = all.filter(s => s.acquisition_status === 'outreach_ready');
    const activationReady = all.filter(s => s.acquisition_status === 'activation_ready');
    const watchlist = all.filter(s => s.acquisition_status === 'high_value_watchlist');

    const topNew = all
      .sort((a, b) => b.activation_priority_score - a.activation_priority_score)
      .slice(0, 10)
      .map(s => ({
        broker_surface_id: s.broker_surface_id,
        canonical_display_name: s.canonical_display_name,
        primary_phone: s.primary_phone,
        activation_priority_score: s.activation_priority_score,
      }));

    const topActivation = activationReady
      .concat(outreachReady)
      .sort((a, b) => b.activation_priority_score - a.activation_priority_score)
      .slice(0, 10)
      .map(s => ({
        broker_surface_id: s.broker_surface_id,
        canonical_display_name: s.canonical_display_name,
        primary_phone: s.primary_phone,
        activation_priority_score: s.activation_priority_score,
        reason: s.acquisition_status === 'activation_ready'
          ? 'high_activation_score_and_corridor_density'
          : 'outreach_ready_with_repeat_presence',
      }));

    const topClaim = claimReady
      .sort((a, b) => b.claim_priority_score - a.claim_priority_score)
      .slice(0, 10)
      .map(s => ({
        broker_surface_id: s.broker_surface_id,
        canonical_display_name: s.canonical_display_name,
        claim_priority_score: s.claim_priority_score,
      }));

    return {
      broker_surfaces_created: created,
      broker_surfaces_updated: updated,
      claim_ready_count: claimReady.length,
      outreach_ready_count: outreachReady.length,
      activation_ready_count: activationReady.length,
      watchlist_count: watchlist.length,
      top_new_surfaces: topNew,
      top_activation_candidates: topActivation,
      top_claim_ready: topClaim,
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
