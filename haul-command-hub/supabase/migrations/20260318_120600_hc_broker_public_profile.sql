CREATE TABLE IF NOT EXISTS hc_broker_public_profile (
  broker_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_slug                text NOT NULL UNIQUE,
  display_name               text NOT NULL,
  phone_e164                 text,
  phone_display              text,
  email                      text,
  website_url                text,
  active_country_codes       text[],
  active_jurisdiction_slugs  text[],
  active_corridor_slugs      text[],
  recent_load_count_30d      integer DEFAULT 0,
  active_pattern_summary     text,
  source_count               integer DEFAULT 0,
  claim_status               text DEFAULT 'unclaimed',
  verification_state         text DEFAULT 'unverified',
  last_seen_at               timestamptz,
  last_updated_at            timestamptz DEFAULT now(),
  quality_guardrail_pass     boolean NOT NULL DEFAULT false,
  public_rank_score          numeric NOT NULL DEFAULT 0,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_broker_public_profile IS 'Broker public surface. Powers /broker/[slug] pages.';

CREATE INDEX idx_broker_pub_country ON hc_broker_public_profile USING gin(active_country_codes);
CREATE INDEX idx_broker_pub_rank ON hc_broker_public_profile(public_rank_score DESC);
