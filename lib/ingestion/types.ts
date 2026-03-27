/**
 * lib/ingestion/types.ts
 *
 * Core types for the Historical Market Observation Ingestion Engine.
 * Designed for global 120-country operation with no US-only logic.
 */

// ════════════════════════════════════════════════════════════════
// SOURCE & BATCH
// ════════════════════════════════════════════════════════════════

export type SourceType =
    | "pasted_text"
    | "manual_copy_paste"
    | "load_alert_feed"
    | "broker_post_group"
    | "operator_group_post"
    | "permit_dispatch_post"
    | "future_country_equivalent";

export type SourceClassification =
    | "historical_market_observation"
    | "community_market_observation"
    | "community_reputation_observation";

export type TrustDefault = "high" | "medium" | "low_until_repeated";

export interface IngestionBatch {
    id?: string;
    raw_text: string;
    text_hash: string;
    source_name: string | null;
    source_type: SourceType;
    source_classification: SourceClassification;
    country_hint: string | null; // ISO 3166-1 alpha-2
    batch_date: string | null; // user-supplied date for the batch
    ingested_at: string;
    total_lines: number;
    parsed_lines: number;
    partial_lines: number;
    unparsed_lines: number;
}

// ════════════════════════════════════════════════════════════════
// LINE PARSING
// ════════════════════════════════════════════════════════════════

export type ServiceType =
    | "lead"
    | "chase"
    | "steer"
    | "route_survey"
    | "permit_related"
    | "unknown";

export type Urgency =
    | "immediate"
    | "next_day"
    | "timed"
    | "standard"
    | "unknown";

export type PaymentTerms =
    | "quick_pay"
    | "cod"
    | "efs"
    | "cashapp"
    | "pay_at_end"
    | "text_only"
    | "unknown";

export type RoleCandidate =
    | "broker"
    | "dispatcher"
    | "pilot_car_operator"
    | "permit_company"
    | "transport_company"
    | "broker_operator_hybrid"
    | "broker_dispatcher_hybrid"
    | "pilot_permit_hybrid"
    | "unknown_market_actor";

export type ReputationSignal =
    | "caution"
    | "positive"
    | "neutral"
    | "none";

export interface ParsedLine {
    raw_line: string;
    observed_date: string;
    date_confident: boolean;
    parsed_name_or_company: string | null;
    raw_phone: string | null;
    normalized_phone: string | null;
    phone_is_placeholder: boolean;
    origin_raw: string | null;
    origin_city: string | null;
    origin_region: string | null;
    origin_country: string | null;
    destination_raw: string | null;
    destination_city: string | null;
    destination_region: string | null;
    destination_country: string | null;
    service_type: ServiceType;
    urgency: Urgency;
    payment_terms: PaymentTerms;
    role_candidates: RoleCandidate[];
    reputation_signal: ReputationSignal;
    reputation_text: string | null;
    truncation_flag: boolean;
    parse_confidence: number; // 0-1
    special_requirements: string | null;
    country_code_if_known: string | null;
}

// ════════════════════════════════════════════════════════════════
// ENTITY MODEL
// ════════════════════════════════════════════════════════════════

export interface MarketEntity {
    id?: string;
    canonical_name: string;
    display_name: string;
    entity_type: "organization" | "contact" | "unknown";
    primary_roles: RoleCandidate[];
    role_confidences: Record<RoleCandidate, number>;
    primary_phone: string | null;
    country_code: string | null;
    first_seen_at: string;
    last_seen_at: string;
    observation_count: number;
    recurrence_score: number;
    entity_confidence_score: number;
    claim_priority_score: number;
    monetization_value_score: number;
    internal_risk_score: number;
    public_display_eligible: boolean;
    data_completeness_score: number;
}

export interface EntityAlias {
    id?: string;
    entity_id: string;
    alias_name: string;
    alias_type: "name_variant" | "dba" | "abbreviation" | "phone_label" | "poster_identity";
    source_batch_id: string;
    first_seen_at: string;
    occurrence_count: number;
}

export interface EntityPhone {
    id?: string;
    raw_phone: string;
    normalized_phone: string;
    is_placeholder: boolean;
    linked_entity_ids: string[];
    first_seen_at: string;
    last_seen_at: string;
    occurrence_count: number;
    country_code: string | null;
}

export interface IdentityLink {
    id?: string;
    entity_a_id: string;
    entity_b_id: string;
    link_type: "hard_merge" | "soft_merge" | "possible_match" | "alias_link";
    merge_confidence: number;
    evidence_notes: string;
    created_at: string;
}

// ════════════════════════════════════════════════════════════════
// OBSERVATIONS
// ════════════════════════════════════════════════════════════════

export interface MarketObservation {
    id?: string;
    batch_id: string;
    source_name: string | null;
    source_type: SourceType;
    raw_line: string;
    observed_date: string;
    ingested_at: string;
    parsed_name_or_company: string | null;
    raw_phone: string | null;
    normalized_phone: string | null;
    origin_raw: string | null;
    origin_city: string | null;
    origin_region: string | null;
    destination_raw: string | null;
    destination_city: string | null;
    destination_region: string | null;
    service_type: ServiceType;
    urgency: Urgency;
    payment_terms: PaymentTerms;
    role_candidates: RoleCandidate[];
    reputation_signal: ReputationSignal;
    truncation_flag: boolean;
    parse_confidence: number;
    country_code_if_known: string | null;
    linked_entity_id: string | null;
    corridor_key: string | null;
    route_cluster_key: string | null;
}

export interface ReputationObservation {
    id?: string;
    batch_id: string;
    raw_reputation_text: string;
    target_name: string | null;
    target_phone: string | null;
    target_entity_id: string | null;
    repetition_count: number;
    corroboration_count: number;
    evidence_strength: "low" | "medium" | "high";
    source_quality: TrustDefault;
    confidence: number;
    visibility: "internal_only" | "manual_review" | "public_verified";
    observed_date: string;
    ingested_at: string;
}

// ════════════════════════════════════════════════════════════════
// CORRIDOR INTELLIGENCE
// ════════════════════════════════════════════════════════════════

export interface CorridorRecord {
    id?: string;
    corridor_key: string; // normalized "ORIGIN_REGION|DEST_REGION"
    origin_region: string;
    origin_city: string | null;
    destination_region: string;
    destination_city: string | null;
    country_code: string | null;
    observation_count: number;
    unique_actor_count: number;
    first_seen_at: string;
    last_seen_at: string;
    service_type_mix: Record<ServiceType, number>;
    urgency_mix: Record<Urgency, number>;
    payment_mix: Record<PaymentTerms, number>;
    corridor_strength_score: number;
    is_emerging: boolean;
}

// ════════════════════════════════════════════════════════════════
// BATCH OUTPUT
// ════════════════════════════════════════════════════════════════

export interface BatchSummary {
    batch_id: string;
    total_lines_processed: number;
    total_lines_partially_parsed: number;
    total_unparsed_lines: number;
    new_organizations_detected: number;
    new_contacts_detected: number;
    new_alias_clusters_detected: number;
    top_repeat_phones: Array<{ phone: string; count: number }>;
    top_repeat_names: Array<{ name: string; count: number }>;
    top_repeat_corridors: Array<{ corridor: string; count: number }>;
    service_type_mix: Record<ServiceType, number>;
    urgency_mix: Record<Urgency, number>;
    payment_term_mix: Record<PaymentTerms, number>;
    new_internal_risk_signals: number;
    claim_candidates: number;
    monetization_updates: number;
}
