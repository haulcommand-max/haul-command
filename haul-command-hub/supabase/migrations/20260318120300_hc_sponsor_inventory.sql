CREATE TABLE IF NOT EXISTS hc_sponsor_inventory (
  slot_key                text PRIMARY KEY,
  page_type               text NOT NULL,
  canonical_url           text,
  country_slug            text,
  jurisdiction_slug       text,
  metro_slug              text,
  corridor_slug           text,
  service_slug            text,
  entity_id               uuid,
  sponsor_label           text NOT NULL DEFAULT 'sponsored',
  sponsor_package_weight  numeric NOT NULL DEFAULT 0,
  local_market_relevance  numeric NOT NULL DEFAULT 0,
  quality_guardrail_pass  boolean NOT NULL DEFAULT false,
  eligible                boolean NOT NULL DEFAULT false,
  sponsor_score           numeric NOT NULL DEFAULT 0,
  starts_at               timestamptz,
  ends_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_sponsor_inventory IS 'Labeled sponsor inventory. Separate from organic rank. Always labeled on render.';

ALTER TABLE hc_sponsor_inventory ADD CONSTRAINT chk_sponsor_label CHECK (
  sponsor_label IN ('sponsored', 'featured', 'promoted')
);

CREATE INDEX idx_sponsor_canonical ON hc_sponsor_inventory(canonical_url);
CREATE INDEX idx_sponsor_eligible ON hc_sponsor_inventory(page_type, eligible);
CREATE INDEX idx_sponsor_entity ON hc_sponsor_inventory(entity_id);
