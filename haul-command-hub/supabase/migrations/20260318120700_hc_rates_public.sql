CREATE TABLE IF NOT EXISTS hc_rates_public (
  surface_key           text PRIMARY KEY,
  surface_type          text NOT NULL,
  country_slug          text,
  jurisdiction_slug     text,
  corridor_slug         text,
  currency_code         text NOT NULL DEFAULT 'USD',
  rate_low              numeric,
  rate_mid              numeric,
  rate_high             numeric,
  sample_size_30d       integer,
  change_vs_7d_pct      numeric,
  change_vs_30d_pct     numeric,
  methodology_url       text,
  freshness_timestamp   timestamptz,
  quality_guardrail_pass boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_rates_public IS 'Truth-safe rates surface. Never renders without methodology. Powers /rates pages.';

-- Quality guardrail trigger
CREATE OR REPLACE FUNCTION hc_compute_rates_guardrail()
RETURNS trigger AS $$
BEGIN
  NEW.quality_guardrail_pass := (
    NEW.methodology_url IS NOT NULL
    AND NEW.freshness_timestamp IS NOT NULL
    AND NEW.sample_size_30d IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rates_guardrail ON hc_rates_public;
CREATE TRIGGER trg_rates_guardrail
  BEFORE INSERT OR UPDATE ON hc_rates_public
  FOR EACH ROW EXECUTE FUNCTION hc_compute_rates_guardrail();

CREATE INDEX idx_rates_country ON hc_rates_public(country_slug);
CREATE INDEX idx_rates_corridor ON hc_rates_public(corridor_slug) WHERE corridor_slug IS NOT NULL;
CREATE INDEX idx_rates_guardrail ON hc_rates_public(quality_guardrail_pass);
