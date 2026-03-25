CREATE TABLE IF NOT EXISTS hc_provider_search_index (
  provider_id            uuid PRIMARY KEY,
  provider_slug          text NOT NULL,
  context_surface        text,
  country_slug           text,
  jurisdiction_slug      text,
  metro_slug             text,
  service_slug           text,
  title                  text NOT NULL,
  subtitle               text,
  location_label         text,
  badges_json            jsonb,
  organic_rank_score     numeric NOT NULL DEFAULT 0,
  sponsor_eligible       boolean NOT NULL DEFAULT false,
  quality_guardrail_pass boolean NOT NULL DEFAULT false,
  last_updated_at        timestamptz DEFAULT now(),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_provider_search_index IS 'Search and browse ranking surface for directory and service pages.';

CREATE INDEX idx_psi_country ON hc_provider_search_index(country_slug);
CREATE INDEX idx_psi_jur ON hc_provider_search_index(jurisdiction_slug);
CREATE INDEX idx_psi_service ON hc_provider_search_index(service_slug);
CREATE INDEX idx_psi_rank ON hc_provider_search_index(organic_rank_score DESC);
CREATE INDEX idx_psi_guardrail ON hc_provider_search_index(quality_guardrail_pass);
