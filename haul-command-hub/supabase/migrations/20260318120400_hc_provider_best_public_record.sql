-- Provider Best Public Record — view over hc_places + identities + identity_scores
-- Created as a TABLE for now (materialized manually via refresh job)
-- until the source tables are confirmed to have the required columns.

CREATE TABLE IF NOT EXISTS hc_provider_best_public_record (
  provider_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_slug                 text NOT NULL UNIQUE,
  display_name                  text NOT NULL,
  legal_name                    text,
  entity_type                   text,
  phone_e164                    text,
  phone_display                 text,
  sms_e164                      text,
  website_url                   text,
  email                         text,
  country_slug                  text,
  jurisdiction_slug             text,
  metro_slug                    text,
  service_area_labels           text[],
  capabilities                  text[],
  claim_status                  text DEFAULT 'unclaimed',
  verification_state            text DEFAULT 'unverified',
  response_time_minutes_median  numeric,
  availability_signal           text,
  source_count                  integer DEFAULT 0,
  last_seen_at                  timestamptz,
  last_updated_at               timestamptz DEFAULT now(),
  corridor_slugs                text[],
  quality_guardrail_pass        boolean NOT NULL DEFAULT false,
  public_rank_score             numeric NOT NULL DEFAULT 0,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_provider_best_public_record IS 'Best known public profile for each provider. Powers profiles even pre-claim.';

-- Quality guardrail: display_name + entity_type + at least one contact path + seen date
CREATE OR REPLACE FUNCTION hc_compute_provider_guardrail()
RETURNS trigger AS $$
BEGIN
  NEW.quality_guardrail_pass := (
    coalesce(NEW.display_name, '') <> ''
    AND NEW.entity_type IS NOT NULL
    AND (
      NEW.phone_e164 IS NOT NULL
      OR NEW.website_url IS NOT NULL
      OR NEW.email IS NOT NULL
      OR NEW.provider_slug IS NOT NULL
    )
    AND (
      NEW.last_seen_at IS NOT NULL
      OR NEW.last_updated_at IS NOT NULL
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provider_guardrail ON hc_provider_best_public_record;
CREATE TRIGGER trg_provider_guardrail
  BEFORE INSERT OR UPDATE ON hc_provider_best_public_record
  FOR EACH ROW EXECUTE FUNCTION hc_compute_provider_guardrail();

CREATE INDEX idx_provider_pub_country ON hc_provider_best_public_record(country_slug);
CREATE INDEX idx_provider_pub_jur ON hc_provider_best_public_record(jurisdiction_slug);
CREATE INDEX idx_provider_pub_rank ON hc_provider_best_public_record(public_rank_score DESC);
CREATE INDEX idx_provider_pub_guardrail ON hc_provider_best_public_record(quality_guardrail_pass);
