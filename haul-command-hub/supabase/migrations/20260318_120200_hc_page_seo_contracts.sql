CREATE TABLE IF NOT EXISTS hc_page_seo_contracts (
  canonical_url         text PRIMARY KEY,
  page_type             text NOT NULL,
  route_family          text,
  country_slug          text,
  jurisdiction_slug     text,
  metro_slug            text,
  corridor_slug         text,
  service_slug          text,
  entity_slug           text,
  title                 text NOT NULL,
  meta_description      text,
  h1                    text NOT NULL,
  intro_copy            text,
  canonical_key         text,
  breadcrumb_json       jsonb,
  structured_data_json  jsonb,
  robots_directive      text NOT NULL DEFAULT 'index,follow',
  last_generated_at     timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hc_page_seo_contracts IS 'Canonical source for title, meta, h1, intro, breadcrumbs, schema for every public page.';

CREATE INDEX idx_seo_page_type ON hc_page_seo_contracts(page_type);
CREATE INDEX idx_seo_route_family ON hc_page_seo_contracts(route_family);
CREATE INDEX idx_seo_canonical_key ON hc_page_seo_contracts(canonical_key);
CREATE INDEX idx_seo_country_jur ON hc_page_seo_contracts(country_slug, jurisdiction_slug);
