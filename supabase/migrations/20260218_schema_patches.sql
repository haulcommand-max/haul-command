-- ============================================================
-- Schema Patches — Fixes for common migration dependency failures
--
-- Adds missing columns that many migrations depend on:
--   feature_flags: key, config, rollout_pct
--   user_role enum: 'admin' value
--   geo_entity_type enum (never created)
-- ============================================================

-- ── feature_flags: add missing columns ──────────────────────
-- The table was created with 'name' but many migrations use 'key'.
-- Add 'key' as a distinct column (text, unique) alongside 'name',
-- and the other columns migrations expect.

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS key text;

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS rollout_pct integer NOT NULL DEFAULT 100;

ALTER TABLE public.feature_flags
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}';

-- Give 'name' a default so migrations that only supply 'key' don't violate NOT NULL
ALTER TABLE public.feature_flags ALTER COLUMN name SET DEFAULT '';

-- Backfill key from name for any existing rows
UPDATE public.feature_flags SET key = name WHERE key IS NULL;

-- Make key NOT NULL and unique (required for ON CONFLICT (key))
DO $$
BEGIN
  ALTER TABLE public.feature_flags ALTER COLUMN key SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_key_unique UNIQUE (key);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── user_role enum: add 'admin' value ───────────────────────
-- Many migrations reference role = 'admin' but only 'platform_admin' exists.
DO $$
BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── geo_entity_type enum ─────────────────────────────────────
-- Needed by seo_ops_intelligence, international_seo_core, geo_expansion_load_board.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geo_entity_type') THEN
    CREATE TYPE public.geo_entity_type AS ENUM (
      'country','region','state','province','county','city','metro',
      'zip','neighborhood','corridor','port','terminal',
      'industrial_zone','free_trade_zone','border_crossing'
    );
  END IF;
END $$;
