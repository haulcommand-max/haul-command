export interface TrainingHubPayload {
  catalog: Array<{
    slug: string;
    title: string;
    summary?: string | null;
    training_type?: string | null;
    credential_level?: string | null;
    module_count: number;
    hours_total: number;
    pricing_mode: string;
    requirement_fit?: string | null;
    ranking_impact?: string | null;
    sponsor_eligible: boolean;
  }>;
  geo_coverage: string[];
  levels: Array<{
    level_slug: string;
    level_name: string;
    description?: string | null;
    badge_slug?: string | null;
    rank_weight: number;
  }>;
}

export interface TrainingPagePayload {
  training: {
    id: string;
    slug: string;
    title: string;
    summary?: string | null;
    quick_answer?: string | null;
    training_type?: string | null;
    credential_level?: string | null;
    module_count: number;
    hours_total: number;
    jurisdiction_scope?: string | null;
    reciprocity_scope?: string | null;
    requirement_fit?: string | null;
    ranking_impact?: string | null;
    trust_badge_effect?: Record<string, unknown>;
    pricing_mode: string;
    pricing_json?: Record<string, unknown>;
    confidence_state: string;
    freshness_state: string;
    cta_primary?: string | null;
    cta_secondary?: string | null;
    reviewed_at?: string | null;
    next_review_due?: string | null;
  };
  modules: Array<{
    slug: string;
    title: string;
    summary?: string | null;
    hours: number;
    sort_order: number;
  }>;
  levels: Array<{
    level_slug: string;
    level_name: string;
    description?: string | null;
    badge_slug?: string | null;
    rank_weight: number;
    trust_weight: number;
    pricing_json?: Record<string, unknown>;
  }>;
  geo_fit: Array<{
    country_code: string;
    region_code?: string | null;
    fit_type: string;
    note?: string | null;
    confidence_state: string;
    freshness_state: string;
  }>;
  reciprocity: Array<{
    from_geo: string;
    to_geo: string;
    note?: string | null;
    confidence_state: string;
    freshness_state: string;
  }>;
  links: Array<{
    link_type: string;
    target_type: string;
    target_id: string;
    anchor_text?: string | null;
    priority: number;
  }>;
  badge_effects: Array<{
    badge_slug: string;
    on_platform_effect_json: Record<string, unknown>;
    visible_copy?: string | null;
  }>;
}

export interface TrainingCountryPayload {
  country_code: string;
  trainings: Array<{
    slug: string;
    title: string;
    summary?: string | null;
    credential_level?: string | null;
    pricing_mode: string;
    fit_type: string;
    note?: string | null;
    confidence_state: string;
    freshness_state: string;
  }>;
}
