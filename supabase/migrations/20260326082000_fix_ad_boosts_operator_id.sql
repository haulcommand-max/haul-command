-- =============================================================================
-- HAUL COMMAND: FIX ad_boosts SCHEMA — Add operator_id column
-- Root Cause: /api/cron/boost-expiry logs show 42703 "column does not exist"
-- The current table has profile_id. This migration adds operator_id as an alias
-- computed column AND backfills it from profile_id so both old and new code work.
-- =============================================================================

ALTER TABLE public.ad_boosts
  ADD COLUMN IF NOT EXISTS operator_id UUID;

-- Backfill from existing profile_id values
UPDATE public.ad_boosts
SET operator_id = profile_id
WHERE operator_id IS NULL;

-- Make operator_id auto-sync via trigger for new rows
CREATE OR REPLACE FUNCTION public.sync_boost_operator_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.operator_id := NEW.profile_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_boost_operator_id ON public.ad_boosts;
CREATE TRIGGER trg_sync_boost_operator_id
  BEFORE INSERT OR UPDATE ON public.ad_boosts
  FOR EACH ROW EXECUTE FUNCTION public.sync_boost_operator_id();

-- Index for fast cron lookups
CREATE INDEX IF NOT EXISTS idx_ad_boosts_operator_id ON public.ad_boosts(operator_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_expires_at  ON public.ad_boosts(expires_at);
