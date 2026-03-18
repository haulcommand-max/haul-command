/**
 * Haul Command Load Board Volume & Coverage Intelligence v3
 * Unified type definitions — merges v2 volume + v3 pricing/forecasting/tagging
 *
 * Global: all types are country-agnostic, ISO 3166-1 alpha-2 for country codes.
 */

// ─── Source & Batch ──────────────────────────────────────────────

export type SourceType =
  | 'load_alert_board'
  | 'broker_post_feed'
  | 'dispatcher_post_feed'
  | 'operator_group_post'
  | 'complaint_post'
  | 'scraped_load_board_history'
  | 'unknown';

export type TrustLevel = 'high' | 'medium' | 'low_until_repeated';

export interface IngestionBatch {
  id: string;
  raw_text: string;
  text_hash: string;
  source_name: string | null;
  source_type: SourceType;
  country_hint: string | null;
  ingested_at: string;
  supplied_date: string | null;
  line_count: number;
  parsed_count: number;
  partial_count: number;
  unparsed_count: number;
}

// ─── Service, Urgency, Payment ───────────────────────────────────

export type ServiceType =
  | 'lead'
  | 'chase'
  | 'steer'
  | 'route_survey'
  | 'permit_related'
  | 'unknown';

export type UrgencyLevel =
  | 'immediate'
  | 'next_day'
  | 'timed'
  | 'standard'
  | 'unspecified';

export type PaymentTerm =
  | 'quick_pay'
  | 'cod'
  | 'efs'
  | 'cashapp'
  | 'pay_at_end'
  | 'text_only'
  | 'unspecified';

// ─── Role System (v3 patch: broker_role_observed first) ──────────
//
// Hard business truth: anyone posting loads on the board is acting
// as a broker/dispatcher for Haul Command purposes. Unknown is last resort.

export type ActorRole =
  | 'broker_role_observed'
  | 'dispatcher_role_observed'
  | 'hybrid_possible'
  | 'permit_related_actor'
  | 'pilot_related_actor'
  | 'transport_company_actor'
  | 'unknown_market_actor';

export interface RoleCandidate {
  role: ActorRole;
  confidence: number;
  evidence: string;
}

export interface RoleDistribution {
  broker_role_observed_count: number;
  dispatcher_role_observed_count: number;
  hybrid_possible_count: number;
  permit_related_actor_count: number;
  pilot_related_actor_count: number;
  transport_company_actor_count: number;
  unknown_market_actor_count: number;
}

// ─── Pricing (v3) ────────────────────────────────────────────────

export interface PricingObservation {
  raw_price_text: string;
  quoted_amount: number | null;
  quoted_currency: string;          // default 'USD'
  quoted_pay_type: PaymentTerm;
  quoted_miles: number | null;
  derived_pay_per_mile: number | null;
  pricing_confidence: number;       // 0–1
}

// ─── Tagging System (v3) ─────────────────────────────────────────

export interface ObservationTags {
  geography: string[];
  service: string[];
  urgency: string[];
  payment: string[];
  actor: string[];
  risk: string[];
  intelligence: string[];
}

// ─── Parsed Observation ──────────────────────────────────────────

export interface ParsedObservation {
  raw_line: string;
  observed_date: string | null;
  observed_date_uncertain: boolean;
  source_name: string | null;
  source_type: SourceType;

  // Extracted fields
  parsed_name_or_company: string | null;
  raw_phone: string | null;
  normalized_phone: string | null;
  phone_is_placeholder: boolean;
  origin_raw: string | null;
  destination_raw: string | null;
  origin_city: string | null;
  origin_admin_division: string | null;
  destination_city: string | null;
  destination_admin_division: string | null;
  country_code: string | null;

  service_type: ServiceType;
  urgency: UrgencyLevel;
  payment_terms: PaymentTerm;
  role_candidates: RoleCandidate[];
  reputation_signal: ReputationSignal | null;
  special_requirements: string[];

  // Pricing (v3)
  pricing: PricingObservation | null;

  // Tagging (v3)
  tags: ObservationTags;

  // Corridor & Route Family (v3)
  corridor_key: string | null;           // e.g. "TX→OK"
  route_family_key: string | null;       // broader cluster, e.g. "TX_SOUTH→OK"

  truncation_flag: boolean;
  parse_confidence: number;

  // Semantic
  board_activity_flag: boolean;
  availability_assumption: 'likely_not_available';
  volume_signal_weight: number;

  // Speed signals (v3)
  same_actor_repeat_same_day: boolean;
  same_route_repeat_same_day: boolean;
  timed_post_flag: boolean;
  fast_cover_signal: number;

  // Seed data marker (v3)
  is_seed_data: boolean;

  // Source format tracking (mixed-format patch)
  source_format: 'alert_line' | 'structured_listing' | 'unknown';
}

// ─── Reputation ──────────────────────────────────────────────────

export interface ReputationSignal {
  raw_text: string;
  target_name: string | null;
  target_phone: string | null;
  signal_type: 'caution' | 'warning' | 'positive';
  evidence_strength: 'single_mention' | 'repeated' | 'corroborated';
  visibility: 'internal_only';
}

// ─── Entities ────────────────────────────────────────────────────

export interface OrganizationCandidate {
  canonical_name: string;
  display_name: string;
  aliases: string[];
  phones: string[];
  role_candidates: RoleCandidate[];
  country_codes: string[];
  corridors_seen: string[];
  first_seen: string;
  last_seen: string;
  observation_count: number;
  recurrence_score: number;
  linked_identity_id: string | null;    // FK bridge to identities table
}

export interface ContactCandidate {
  canonical_name: string;
  display_name: string;
  aliases: string[];
  phones: string[];
  linked_org_name: string | null;
  first_seen: string;
  last_seen: string;
}

export interface PhoneRecord {
  raw_phone: string;
  normalized_phone: string;
  is_placeholder: boolean;
  linked_names: string[];
  linked_orgs: string[];
  observation_count: number;
  first_seen: string;
  last_seen: string;
}

export interface AliasRecord {
  display_variant: string;
  canonical_candidate: string;
  linked_phone: string | null;
  linked_org: string | null;
  source_batch_id: string;
  observed_at: string;
}

// ─── Corridor ────────────────────────────────────────────────────

export interface CorridorRecord {
  corridor_key: string;
  origin_raw: string;
  destination_raw: string;
  origin_admin_division: string;
  destination_admin_division: string;
  country_code: string;
  route_family_key: string | null;
  observation_count: number;
  service_types_seen: ServiceType[];
  actors_seen: string[];
  urgency_density: number;
  avg_price: number | null;
  price_observations: number;
  first_seen: string;
  last_seen: string;
}

// ─── Scoring ─────────────────────────────────────────────────────

export type ScoreBand = 'low' | 'medium' | 'high' | 'dominant';

export interface EntityScores {
  recurrence_score: number;
  recurrence_band: ScoreBand;
  entity_confidence_score: number;
  claim_priority_score: number;
  monetization_value_score: number;
  internal_risk_score: number;
  public_display_eligible: boolean;
  data_completeness_score: number;
}

export interface CorridorScores {
  corridor_strength_score: number;
  volume_score: number;
  urgency_density: number;
  fast_cover_environment_score: number;
  board_velocity_signal: number;
  avg_price_per_mile: number | null;
}

// ─── Volume Intelligence ─────────────────────────────────────────

export interface DailyVolume {
  date: string;
  total_observations: number;
  by_service_type: Record<ServiceType, number>;
  by_admin_division: Record<string, number>;
  by_country: Record<string, number>;
  urgent_count: number;
  repeat_actor_count: number;
  price_observations: number;
}

// ─── Batch Output Contract (v3 patch — full) ────────────────────

export interface BatchOutputSummary {
  batch_id: string;
  total_lines_received: number;
  total_lines_processed: number;
  total_lines_partially_parsed: number;
  total_unparsed_lines: number;
  total_lines_failed: number;
  daily_volume_estimate: number;

  // Chunking
  total_chunks_created: number;
  total_chunks_succeeded: number;
  total_chunks_failed: number;
  truncation_detected_flag: boolean;
  full_batch_ingested_flag: boolean;

  // Counts
  total_observations: number;
  total_unique_phones: number;
  total_unique_name_variants: number;
  total_unique_company_candidates: number;
  total_unique_origin_locations: number;
  total_unique_destination_locations: number;
  total_unique_corridor_pairs: number;
  total_unique_route_families: number;
  total_unique_service_types: number;
  total_reputation_flagged_lines: number;
  total_truncated_lines: number;
  total_placeholder_phone_lines: number;
  total_price_observations: number;

  // Observations by day
  observations_by_day: Record<string, number>;

  new_organizations_detected: OrganizationCandidate[];
  new_contacts_detected: ContactCandidate[];
  new_alias_clusters_detected: AliasRecord[];

  top_repeat_phones: { phone: string; count: number }[];
  top_repeat_names: { name: string; count: number }[];
  top_repeat_company_candidates: { name: string; count: number }[];
  top_repeat_corridors: { corridor: string; count: number }[];
  top_volume_actors: { name: string; observations: number }[];
  top_claim_candidates: { name: string; score: number }[];
  top_enrichment_candidates: { name: string; score: number }[];
  top_internal_risk_candidates: { name: string; score: number }[];

  service_type_mix: Record<ServiceType, number>;
  urgency_mix: Record<UrgencyLevel, number>;
  payment_term_mix: Record<PaymentTerm, number>;
  role_mix: Record<string, number>;
  role_distribution: RoleDistribution;

  // Speed summary
  speed_summary: {
    board_velocity_signal: number;
    fast_cover_environment_score: number;
    same_day_repeat_actor_count: number;
    same_day_repeat_corridor_count: number;
    urgency_density: number;
  };

  board_velocity_signal: number;
  new_internal_risk_signals: ReputationSignal[];
  claim_candidates: string[];
  monetization_updates: string[];

  // Risk report (internal only)
  risk_report: {
    top_warning_clusters: { target: string; count: number; type: string }[];
    phone_risk_watchlist: { phone: string; signals: number }[];
    actor_risk_watchlist: { name: string; signals: number }[];
  };

  // Pricing intelligence
  pricing_summary: {
    total_price_observations: number;
    avg_quoted_amount: number | null;
    avg_pay_per_mile: number | null;
    price_by_corridor: { corridor: string; avg_price: number; count: number }[];
    price_by_service: Record<string, { avg: number; count: number }>;
    price_by_actor: { name: string; avg_price: number; count: number }[];
    top_raw_price_examples: string[];
    failed_price_parse_examples: string[];
  };

  // Seed data summary
  seed_data_summary: {
    broker_seed_profiles_created: number;
    alias_clusters_created: number;
    phone_clusters_created: number;
    corridor_seed_records_created: number;
    pricing_seed_records_created: number;
    risk_seed_records_created: number;
    structured_listing_seed_records_created: number;
    alert_line_seed_records_created: number;
  };

  // Training/seed updates
  training_updates: {
    entities_created: number;
    aliases_created: number;
    corridors_created: number;
    reputation_observations_created: number;
    volume_signals_created: number;
  };

  // QA
  qa_report: {
    full_batch_ingested: boolean;
    lines_received_equals_processed_plus_failed: boolean;
    pricing_qc_completed: boolean;
    role_distribution_completed: boolean;
    unknown_share_percent: number;
    unknown_share_flagged: boolean;
    truncation_flagged: boolean;
    lines_forced_to_unknown: number;
    price_like_lines_without_price: number;
    // Mixed-format QA
    mixed_format_detected: boolean;
    single_parser_on_mixed_batch: boolean;
    unaccounted_line_count: number;
  };

  // Segmentation (mixed-format patch)
  segmentation_summary: {
    total_segments: number;
    total_alert_segments: number;
    total_structured_segments: number;
    total_noise_segments: number;
    total_date_segments: number;
    total_lines_preserved_as_noise: number;
    format_mix: 'alert_only' | 'structured_only' | 'mixed' | 'unknown';
  };

  // Broker surface summary
  broker_surface_summary: {
    broker_surfaces_created: number;
    broker_surfaces_updated: number;
    claim_ready_count: number;
    outreach_ready_count: number;
    activation_ready_count: number;
    watchlist_count: number;
  };

  // Persistence status
  persisted_to_supabase: boolean;
}

// ─── Config ──────────────────────────────────────────────────────

export interface IngestionConfig {
  source_name: string | null;
  source_type: SourceType;
  country_hint: string | null;
  supplied_date: string | null;
}
