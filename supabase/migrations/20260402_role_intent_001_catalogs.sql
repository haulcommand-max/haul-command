-- ============================================================================
-- HAUL COMMAND: Role + Intent Engine — Step 1: Canonical Catalogs
-- Tables: hc_role_families, hc_roles, hc_role_aliases, hc_modes, hc_intents,
--         hc_page_types, hc_action_catalog, hc_completion_gates
-- ============================================================================

BEGIN;

-- Ensure pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Updated-at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. hc_role_families — Top-level grouped role clusters for UI and routing
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_role_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  icon_key text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_role_families_sort_order
  ON public.hc_role_families(sort_order);

DROP TRIGGER IF EXISTS trg_hc_role_families_updated_at ON public.hc_role_families;
CREATE TRIGGER trg_hc_role_families_updated_at
  BEFORE UPDATE ON public.hc_role_families
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. hc_roles — Canonical role catalog
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL UNIQUE,
  family_key text NOT NULL REFERENCES public.hc_role_families(family_key),
  label text NOT NULL,
  description text,
  core_fear text,
  core_goal text,
  is_dual_mode_capable boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_roles_family_sort
  ON public.hc_roles(family_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_hc_roles_live
  ON public.hc_roles(is_live) WHERE is_live = true;

DROP TRIGGER IF EXISTS trg_hc_roles_updated_at ON public.hc_roles;
CREATE TRIGGER trg_hc_roles_updated_at
  BEFORE UPDATE ON public.hc_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. hc_role_aliases — Localized aliases per country/language
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_role_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL REFERENCES public.hc_roles(role_key),
  country_code text,
  language_code text,
  alias_text text NOT NULL,
  alias_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_role_aliases_role
  ON public.hc_role_aliases(role_key);
CREATE INDEX IF NOT EXISTS idx_hc_role_aliases_country_language
  ON public.hc_role_aliases(country_code, language_code);
CREATE INDEX IF NOT EXISTS idx_hc_role_aliases_tsv
  ON public.hc_role_aliases USING gin (to_tsvector('simple', alias_text));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. hc_modes — Persistent operating modes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  color_token text,
  nav_emphasis jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_modes_sort
  ON public.hc_modes(sort_order);

DROP TRIGGER IF EXISTS trg_hc_modes_updated_at ON public.hc_modes;
CREATE TRIGGER trg_hc_modes_updated_at
  BEFORE UPDATE ON public.hc_modes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. hc_intents — Canonical intent catalog
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  mode_key text NOT NULL REFERENCES public.hc_modes(mode_key),
  urgency_class text,
  monetization_class text,
  sort_order integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_intents_mode_sort
  ON public.hc_intents(mode_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_hc_intents_live
  ON public.hc_intents(is_live) WHERE is_live = true;

DROP TRIGGER IF EXISTS trg_hc_intents_updated_at ON public.hc_intents;
CREATE TRIGGER trg_hc_intents_updated_at
  BEFORE UPDATE ON public.hc_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. hc_page_types — Canonical page classifier
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_page_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  shell_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. hc_action_catalog — Canonical CTA actions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_action_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  target_path text,
  target_kind text,
  requires_auth boolean NOT NULL DEFAULT false,
  requires_market_context boolean NOT NULL DEFAULT false,
  requires_listing_context boolean NOT NULL DEFAULT false,
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_monetized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_action_catalog_monetized
  ON public.hc_action_catalog(is_monetized) WHERE is_monetized = true;

DROP TRIGGER IF EXISTS trg_hc_action_catalog_updated_at ON public.hc_action_catalog;
CREATE TRIGGER trg_hc_action_catalog_updated_at
  BEFORE UPDATE ON public.hc_action_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. hc_completion_gates — Activation and progression milestones
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_completion_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  gate_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
