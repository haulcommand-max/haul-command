-- 20260313_0051_extend_profiles_surfaces.sql
-- Additive columns on profiles and surfaces.
-- SKIP: profiles.equipment_types (already exists from 20260222_directory_upgrade.sql)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. profiles — add service capabilities, scoring, plan tier columns
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_types text[] NOT NULL DEFAULT '{}'::text[],
  -- SKIP equipment_types: already added by 20260222_directory_upgrade.sql
  ADD COLUMN IF NOT EXISTS credentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS coverage_regions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS coverage_corridors uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS availability_state text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS after_hours_capable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS urgent_ready boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS route_survey_capable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS height_pole_capable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS steer_specialist_capable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS response_speed_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommendation_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_completeness_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_freshness_score numeric(6,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS boost_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS analytics_enabled boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT chk_prof_avail_state
    CHECK (availability_state IN ('unknown','available_now','available_soon','busy','inactive'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT chk_prof_plan_tier
    CHECK (plan_tier IN ('free','road_ready','fast_lane','enterprise'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_service_types_gin ON public.profiles USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_profiles_coverage_corridors_gin ON public.profiles USING GIN(coverage_corridors);
CREATE INDEX IF NOT EXISTS idx_profiles_availability_state ON public.profiles(availability_state);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_tier ON public.profiles(plan_tier);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. surfaces — add metro/city FK targets, features, SEO signal columns
--    FK constraints added later in 0052 after hc_metros/hc_cities exist
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.surfaces
  ADD COLUMN IF NOT EXISTS metro_id uuid,
  ADD COLUMN IF NOT EXISTS city_id uuid,
  ADD COLUMN IF NOT EXISTS hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS surface_tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS access_tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS parking_features jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS staging_features jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS security_features jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS faq_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS local_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_problem_slugs text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS rules_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS glossary_term_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS map_pack_readiness_score numeric(6,3) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_surfaces_city_id ON public.surfaces(city_id);
CREATE INDEX IF NOT EXISTS idx_surfaces_metro_id ON public.surfaces(metro_id);
CREATE INDEX IF NOT EXISTS idx_surfaces_surface_tags_gin ON public.surfaces USING GIN(surface_tags);
CREATE INDEX IF NOT EXISTS idx_surfaces_access_tags_gin ON public.surfaces USING GIN(access_tags);
CREATE INDEX IF NOT EXISTS idx_surfaces_related_problems_gin ON public.surfaces USING GIN(related_problem_slugs);

COMMIT;
