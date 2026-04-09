export interface GlossaryHubCounts {
  total_terms: number;
  total_countries: number;
  total_topics: number;
  total_letters: number;
}

export interface GlossaryHubTermCard {
  slug: string;
  canonical_term: string;
  short_definition: string;
  topic_primary_slug?: string | null;
  commercial_intent_level: number;
  sponsor_eligible: boolean;
}

export interface GlossaryHubTopic {
  slug: string;
  name: string;
  description?: string | null;
  active_term_count: number;
}

export interface GlossaryHubCountry {
  country_code: string;
  overlay_term_count: number;
  last_overlay_update?: string | null;
}

export interface GlossaryHubPayload {
  counts: GlossaryHubCounts;
  featured_terms: GlossaryHubTermCard[];
  recently_updated_terms: Array<{
    slug: string;
    canonical_term: string;
    updated_at: string;
    freshness_state: string;
  }>;
  topic_clusters: GlossaryHubTopic[];
  country_clusters: GlossaryHubCountry[];
  letter_index: string[];
}

export interface GlossaryTermPayload {
  term: {
    id: string;
    slug: string;
    canonical_term: string;
    short_definition: string;
    expanded_definition?: string | null;
    plain_english?: string | null;
    why_it_matters?: string | null;
    term_type: string;
    topic_primary_slug?: string | null;
    topic_primary_name?: string | null;
    commercial_intent_level: number;
    near_me_relevance: boolean;
    sponsor_eligible: boolean;
    featured_snippet_candidate: boolean;
    ai_answer_variant?: string | null;
    voice_answer_variant?: string | null;
    confidence_state: string;
    freshness_state: string;
    reviewed_at?: string | null;
    next_review_due?: string | null;
    source_count: number;
    overlay?: {
      country_code: string;
      region_code?: string | null;
      local_title_override?: string | null;
      local_regulatory_note?: string | null;
      is_indexable: boolean;
    } | null;
  };
  aliases: Array<{
    alias: string;
    alias_type: string;
    country_code?: string | null;
    region_code?: string | null;
    language_code: string;
    is_preferred: boolean;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    sort_order: number;
    is_voice_friendly: boolean;
  }>;
  use_cases: Array<{
    use_case: string;
    sort_order: number;
  }>;
  sources: Array<{
    source_type: string;
    source_label: string;
    source_url?: string | null;
    source_note?: string | null;
    source_authority_score: number;
    is_primary: boolean;
  }>;
  links: Array<{
    link_type: string;
    target_type: string;
    target_id: string;
    anchor_text?: string | null;
    priority: number;
    is_auto_generated: boolean;
    metadata?: Record<string, unknown>;
  }>;
  relationships: Array<{
    relationship_type: string;
    weight: number;
    to_term_slug: string;
    to_term_name: string;
  }>;
  quality: {
    definition_score?: number;
    link_score?: number;
    geo_score?: number;
    trust_score?: number;
    commercial_score?: number;
    voice_score?: number;
    overall_score?: number;
    notes?: string | null;
  };
  metrics: {
    pageviews_30d?: number;
    entrances_30d?: number;
    ctr_search_30d?: number | null;
    claim_clicks_30d?: number;
    tool_clicks_30d?: number;
    regulation_clicks_30d?: number;
    sponsor_clicks_30d?: number;
    lead_clicks_30d?: number;
    exits_30d?: number;
    avg_time_seconds_30d?: number | null;
  };
}

export interface GlossaryTopicPayload {
  topic: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    parent_topic_id?: string | null;
    sort_order: number;
  };
  terms: Array<{
    slug: string;
    canonical_term: string;
    short_definition: string;
    commercial_intent_level: number;
    sponsor_eligible: boolean;
    overall_quality_score: number;
  }>;
  related_links: Array<{
    link_type: string;
    target_type: string;
    target_id: string;
    anchor_text?: string | null;
    priority: number;
  }>;
}

export interface GlossaryCountryPayload {
  country_code: string;
  terms: Array<{
    slug: string;
    canonical_term: string;
    short_definition: string;
    commercial_intent_level: number;
    sponsor_eligible: boolean;
    local_regulatory_note?: string | null;
    updated_at?: string | null;
  }>;
  aliases: Array<{
    alias: string;
    alias_type: string;
    term_slug: string;
    term_name: string;
  }>;
  related_links: Array<{
    term_slug: string;
    link_type: string;
    target_type: string;
    target_id: string;
    anchor_text?: string | null;
    priority: number;
  }>;
}
