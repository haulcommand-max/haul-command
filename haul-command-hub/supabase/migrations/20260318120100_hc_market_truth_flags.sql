-- Drop old version and recreate with spec-exact schema
DROP TABLE IF EXISTS hc_market_truth_flags CASCADE;

CREATE TABLE hc_market_truth_flags (
  surface_type          text NOT NULL,
  page_key              text NOT NULL,
  canonical_url         text,
  country_slug          text,
  jurisdiction_slug     text,
  metro_slug            text,
  corridor_slug         text,
  service_slug          text,
  metric_name           text NOT NULL,
  metric_value_text     text,
  metric_value_numeric  numeric,
  is_renderable         boolean NOT NULL DEFAULT false,
  reason_code           text NOT NULL DEFAULT 'no_real_data',
  freshness_ok          boolean NOT NULL DEFAULT false,
  methodology_ok        boolean NOT NULL DEFAULT false,
  observation_count     integer NOT NULL DEFAULT 0,
  last_updated_at       timestamptz,
  methodology_url       text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (surface_type, page_key, metric_name)
);

COMMENT ON TABLE hc_market_truth_flags IS 'Gates metric rendering on all public surfaces. No metric renders without is_renderable=true.';

CREATE INDEX idx_mtf_canonical ON hc_market_truth_flags(canonical_url);
CREATE INDEX idx_mtf_surface_geo ON hc_market_truth_flags(surface_type, country_slug, jurisdiction_slug);
CREATE INDEX idx_mtf_metric_renderable ON hc_market_truth_flags(metric_name, is_renderable);

-- Allowed reason_codes: ready, stale, missing_methodology, too_few_observations, no_real_data, suppressed_until_truth_ready
ALTER TABLE hc_market_truth_flags ADD CONSTRAINT chk_reason_code CHECK (
  reason_code IN ('ready', 'stale', 'missing_methodology', 'too_few_observations', 'no_real_data', 'suppressed_until_truth_ready')
);
