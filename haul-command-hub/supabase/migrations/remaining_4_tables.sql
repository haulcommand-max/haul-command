-- Gap 12: Remaining 4 tables + helpers
-- Paste this entire block into the Supabase SQL Editor and click Run

-- Table 5: Provider Search Index
CREATE TABLE IF NOT EXISTS hc_provider_search_index (
  provider_id uuid PRIMARY KEY,
  provider_slug text NOT NULL,
  context_surface text,
  country_slug text,
  jurisdiction_slug text,
  metro_slug text,
  service_slug text,
  title text NOT NULL,
  subtitle text,
  location_label text,
  badges_json jsonb,
  organic_rank_score numeric NOT NULL DEFAULT 0,
  sponsor_eligible boolean NOT NULL DEFAULT false,
  quality_guardrail_pass boolean NOT NULL DEFAULT false,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 6: Broker Public Profile
CREATE TABLE IF NOT EXISTS hc_broker_public_profile (
  broker_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  phone_e164 text,
  phone_display text,
  email text,
  website_url text,
  active_country_codes text[],
  active_jurisdiction_slugs text[],
  active_corridor_slugs text[],
  recent_load_count_30d integer DEFAULT 0,
  active_pattern_summary text,
  source_count integer DEFAULT 0,
  claim_status text DEFAULT 'unclaimed',
  verification_state text DEFAULT 'unverified',
  last_seen_at timestamptz,
  last_updated_at timestamptz DEFAULT now(),
  quality_guardrail_pass boolean NOT NULL DEFAULT false,
  public_rank_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 7: Rates Public
CREATE TABLE IF NOT EXISTS hc_rates_public (
  surface_key text PRIMARY KEY,
  surface_type text NOT NULL,
  country_slug text,
  jurisdiction_slug text,
  corridor_slug text,
  currency_code text NOT NULL DEFAULT 'USD',
  rate_low numeric,
  rate_mid numeric,
  rate_high numeric,
  sample_size_30d integer,
  change_vs_7d_pct numeric,
  change_vs_30d_pct numeric,
  methodology_url text,
  freshness_timestamp timestamptz,
  quality_guardrail_pass boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table 8: Requirements Public
CREATE TABLE IF NOT EXISTS hc_requirements_public (
  surface_key text PRIMARY KEY,
  country_slug text NOT NULL,
  jurisdiction_slug text,
  load_type_slug text,
  jurisdiction_label text NOT NULL,
  escort_thresholds_json jsonb,
  permit_links_json jsonb,
  governing_source_links_json jsonb,
  methodology_url text,
  last_reviewed_at timestamptz,
  quality_guardrail_pass boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_country ON hc_provider_search_index (country_slug);
CREATE INDEX IF NOT EXISTS idx_search_service ON hc_provider_search_index (service_slug);
CREATE INDEX IF NOT EXISTS idx_search_rank ON hc_provider_search_index (organic_rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_broker_slug ON hc_broker_public_profile (broker_slug);
CREATE INDEX IF NOT EXISTS idx_rates_country ON hc_rates_public (country_slug);
CREATE INDEX IF NOT EXISTS idx_reqs_country ON hc_requirements_public (country_slug);

-- RLS
ALTER TABLE hc_provider_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_broker_public_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_rates_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE hc_requirements_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public_read_search_index" ON hc_provider_search_index FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_broker" ON hc_broker_public_profile FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_rates" ON hc_rates_public FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "public_read_reqs" ON hc_requirements_public FOR SELECT USING (true);
