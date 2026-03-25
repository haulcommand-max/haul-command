CREATE TABLE IF NOT EXISTS hc_requirements_public (
  surface_key               text PRIMARY KEY,
  country_slug              text NOT NULL,
  jurisdiction_slug         text,
  load_type_slug            text,
  jurisdiction_label        text NOT NULL,
  escort_thresholds_json    jsonb,
  permit_links_json         jsonb,
  governing_source_links_json jsonb,
  methodology_url           text,
  last_reviewed_at          timestamptz,
  quality_guardrail_pass    boolean NOT NULL DEFAULT false,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_requirements_public IS 'Canonical requirements surface contract. Powers /requirements pages.';

-- Quality guardrail trigger
CREATE OR REPLACE FUNCTION hc_compute_requirements_guardrail()
RETURNS trigger AS $$
BEGIN
  NEW.quality_guardrail_pass := (
    NEW.governing_source_links_json IS NOT NULL
    AND NEW.last_reviewed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_requirements_guardrail ON hc_requirements_public;
CREATE TRIGGER trg_requirements_guardrail
  BEFORE INSERT OR UPDATE ON hc_requirements_public
  FOR EACH ROW EXECUTE FUNCTION hc_compute_requirements_guardrail();

CREATE INDEX idx_req_country ON hc_requirements_public(country_slug);
CREATE INDEX idx_req_jur ON hc_requirements_public(jurisdiction_slug);
