-- ============================================================================
-- HAUL COMMAND: Role + Intent Engine — Step 3: Routing + Rule Engine Tables
-- Tables: hc_role_intents, hc_route_patterns, hc_next_move_rules,
--         hc_country_role_overlays, hc_country_intent_overlays,
--         hc_monetization_surfaces
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. hc_role_intents — Allowed intents per role
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_role_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL REFERENCES public.hc_roles(role_key),
  intent_key text NOT NULL REFERENCES public.hc_intents(intent_key),
  stage_key text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Composite unique: one role can have one intent per stage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hc_role_intents_role_intent_stage_key'
  ) THEN
    ALTER TABLE public.hc_role_intents
      ADD CONSTRAINT hc_role_intents_role_intent_stage_key
      UNIQUE (role_key, intent_key, stage_key);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_hc_role_intents_role_sort
  ON public.hc_role_intents(role_key, sort_order);
CREATE INDEX IF NOT EXISTS idx_hc_role_intents_intent
  ON public.hc_role_intents(intent_key);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. hc_route_patterns — Maps routes to page types
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_route_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_pattern text NOT NULL,
  page_type_key text NOT NULL REFERENCES public.hc_page_types(page_type_key),
  priority_rank integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_route_patterns_page_priority
  ON public.hc_route_patterns(page_type_key, priority_rank);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. hc_next_move_rules — Core rule engine for persistent next moves
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_next_move_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text REFERENCES public.hc_roles(role_key),
  family_key text REFERENCES public.hc_role_families(family_key),
  intent_key text REFERENCES public.hc_intents(intent_key),
  mode_key text REFERENCES public.hc_modes(mode_key),
  page_type_key text NOT NULL REFERENCES public.hc_page_types(page_type_key),
  stage_key text,
  market_maturity text,
  completion_gate_key text,
  priority_rank integer NOT NULL DEFAULT 0,
  primary_action_key text NOT NULL REFERENCES public.hc_action_catalog(action_key),
  secondary_action_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  monetization_action_key text,
  helper_copy text,
  dismissible boolean NOT NULL DEFAULT true,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_next_move_rules_page_priority
  ON public.hc_next_move_rules(page_type_key, priority_rank);
CREATE INDEX IF NOT EXISTS idx_hc_next_move_rules_role_intent
  ON public.hc_next_move_rules(role_key, intent_key);
CREATE INDEX IF NOT EXISTS idx_hc_next_move_rules_mode
  ON public.hc_next_move_rules(mode_key);
CREATE INDEX IF NOT EXISTS idx_hc_next_move_rules_live
  ON public.hc_next_move_rules(is_live) WHERE is_live = true;

DROP TRIGGER IF EXISTS trg_hc_next_move_rules_updated_at ON public.hc_next_move_rules;
CREATE TRIGGER trg_hc_next_move_rules_updated_at
  BEFORE UPDATE ON public.hc_next_move_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. hc_country_role_overlays — Country-specific role label / copy / enablement
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_country_role_overlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  role_key text NOT NULL REFERENCES public.hc_roles(role_key),
  local_label text,
  local_core_fear text,
  local_core_goal text,
  enabled_stage_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled_intent_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_intent_key text,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, role_key)
);

CREATE INDEX IF NOT EXISTS idx_hc_country_role_overlays_country
  ON public.hc_country_role_overlays(country_code);

DROP TRIGGER IF EXISTS trg_hc_country_role_overlays_updated_at ON public.hc_country_role_overlays;
CREATE TRIGGER trg_hc_country_role_overlays_updated_at
  BEFORE UPDATE ON public.hc_country_role_overlays
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. hc_country_intent_overlays — Country-specific intent tuning
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_country_intent_overlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  intent_key text NOT NULL REFERENCES public.hc_intents(intent_key),
  local_label text,
  helper_copy text,
  sort_override integer,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, intent_key)
);

CREATE INDEX IF NOT EXISTS idx_hc_country_intent_overlays_country
  ON public.hc_country_intent_overlays(country_code);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. hc_monetization_surfaces — Intent-aware monetization surface catalog
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_monetization_surfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surface_key text NOT NULL UNIQUE,
  role_key text,
  intent_key text,
  page_type_key text,
  mode_key text,
  monetization_type text NOT NULL,
  label text NOT NULL,
  target_path text,
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_monetization_surfaces_role_intent
  ON public.hc_monetization_surfaces(role_key, intent_key);
CREATE INDEX IF NOT EXISTS idx_hc_monetization_surfaces_live
  ON public.hc_monetization_surfaces(is_live) WHERE is_live = true;

COMMIT;
