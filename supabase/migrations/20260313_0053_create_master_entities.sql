-- 20260313_0053_create_master_entities.sql
-- New tables: hc_shipper_profiles, hc_entity_aliases
-- No hc_glossary_terms (merged into existing glossary_terms in migration 0054)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. hc_shipper_profiles — shipper entity (standalone, no FK to hc_companies)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_shipper_profiles (
  shipper_profile_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name       text NOT NULL,
  country_code       text NOT NULL,
  active_regions     text[] NOT NULL DEFAULT '{}'::text[],
  project_types      text[] NOT NULL DEFAULT '{}'::text[],
  enterprise_flags   jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_info       jsonb NOT NULL DEFAULT '{}'::jsonb,
  preferred_corridors uuid[] NOT NULL DEFAULT '{}'::uuid[],
  volume_tier        text NOT NULL DEFAULT 'standard',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_name, country_code)
);

DO $$ BEGIN
  ALTER TABLE public.hc_shipper_profiles ADD CONSTRAINT chk_shipper_volume_tier
    CHECK (volume_tier IN ('standard','high_volume','enterprise'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_hc_shipper_country ON public.hc_shipper_profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_hc_shipper_projects_gin ON public.hc_shipper_profiles USING GIN(project_types);
CREATE INDEX IF NOT EXISTS idx_hc_shipper_corridors_gin ON public.hc_shipper_profiles USING GIN(preferred_corridors);

ALTER TABLE public.hc_shipper_profiles ENABLE ROW LEVEL SECURITY;
-- INTERNAL-ONLY: contains contact_info, enterprise_flags. No public read.
CREATE POLICY hc_shipper_service_all ON public.hc_shipper_profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
-- NO public read policy. NO GRANT to anon/authenticated.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. hc_entity_aliases — cross-entity alias lookup for dedupe/resolution
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_entity_aliases (
  entity_alias_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      text NOT NULL,            -- operator, broker, corridor, metro, city, glossary, surface
  entity_id        uuid NOT NULL,
  alias_text       text NOT NULL,
  alias_kind       text NOT NULL,            -- name, abbreviation, acronym, slang, translation
  language         text,                     -- BCP 47 locale
  country_code     text,
  confidence_score numeric(6,3) NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.hc_entity_aliases ADD CONSTRAINT chk_alias_kind
    CHECK (alias_kind IN ('name','abbreviation','acronym','slang','translation','misspelling','trade_name'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- COALESCE required for null-safe uniqueness, so use a unique index not an inline constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_entity_aliases_uniq ON public.hc_entity_aliases (entity_type, entity_id, alias_text, COALESCE(language, '__null__'));
CREATE INDEX IF NOT EXISTS idx_hc_aliases_text ON public.hc_entity_aliases(alias_text);
-- pg_trgm already enabled in 20260225_glossary_tables.sql (may be in extensions schema)
CREATE INDEX IF NOT EXISTS idx_hc_aliases_text_trgm ON public.hc_entity_aliases USING gin(alias_text public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_hc_aliases_entity ON public.hc_entity_aliases(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hc_aliases_country ON public.hc_entity_aliases(country_code);

ALTER TABLE public.hc_entity_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY hc_aliases_public_read ON public.hc_entity_aliases FOR SELECT USING (true);
CREATE POLICY hc_aliases_service_write ON public.hc_entity_aliases
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT ON public.hc_entity_aliases TO anon, authenticated;

COMMIT;
