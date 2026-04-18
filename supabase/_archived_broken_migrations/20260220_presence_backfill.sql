-- ============================================================
-- PR #3.5: PRESENCE BACKFILL & LEADERBOARD HYDRATION WING
-- ============================================================

-- 1. Ensure escort_presence table has all required fields (from previous migration)
-- including session_source and active_region if missing
ALTER TABLE public.escort_presence
  ADD COLUMN IF NOT EXISTS active_region text,
  ADD COLUMN IF NOT EXISTS session_source text;

-- 2. Backfill Presence for all Escorts
-- Give every escort who doesn't have a presence row a default "offline" row 
-- so the directory JOINs don't drop them.
INSERT INTO public.escort_presence (escort_id, is_online, last_seen_at)
SELECT 
  id, 
  false, 
  now() - interval '2 hours'
FROM public.profiles
WHERE role = 'escort'
  AND id NOT IN (SELECT escort_id FROM public.escort_presence)
ON CONFLICT (escort_id) DO NOTHING;

-- 3. Ensure public_leaderboards view is robust and exactly matches requirements
-- We need final_score to be populated. First, ensure it's not null for existing escorts.
UPDATE public.escort_profiles 
SET final_score = COALESCE(final_score, 50.0) 
WHERE final_score IS NULL;

DROP VIEW IF EXISTS public.public_leaderboards CASCADE;

CREATE VIEW public.public_leaderboards AS
SELECT
  ep.escort_id AS id,
  p.display_name AS name,
  ep.final_score,
  ep.rank_tier,
  ep.service_state AS state,
  ep.service_city AS city,
  ep.is_claimed,
  DENSE_RANK() OVER (ORDER BY ep.final_score DESC NULLS LAST) AS rank,
  ep.final_score / 100.0 AS compliance_score,
  true AS funds_verified_badge,
  ep.score_last_calculated_at AS updated_at
FROM public.escort_profiles ep
JOIN public.profiles p ON p.id = ep.escort_id
WHERE ep.final_score IS NOT NULL
  AND ep.final_score > 0;
