-- =============================================================================
-- CORRIDOR COMPLETION RATE ENGINE
-- 2026-03-06
--
-- Because we now capture both OPEN and COVERED loads, we can compute:
--   completion_rate = covered_loads / total_loads
--
-- High completion rate = strong escort demand + fast booking corridor
-- This becomes a ranking signal for Corridor Liquidity Score (CLS).
-- =============================================================================

-- Add completion_rate columns to corridor_heat if not present
ALTER TABLE public.corridor_heat
  ADD COLUMN IF NOT EXISTS total_loads     int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS covered_loads   int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completion_rate numeric(5,4) DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS completion_band text DEFAULT 'unknown'
    CHECK (completion_band IN ('unknown','cold','warm','hot','on_fire'));

-- Create index for fast completion rate queries
CREATE INDEX IF NOT EXISTS idx_corridor_heat_completion
  ON public.corridor_heat (completion_rate DESC)
  WHERE completion_rate > 0;

-- =============================================================================
-- RPC: hc_update_corridor_completion_rates
-- Scans extraction candidates for covered_load signals and computes rates.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.hc_update_corridor_completion_rates()
RETURNS TABLE(
  corridor text,
  total int,
  covered int,
  rate numeric,
  band text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r record;
  v_rate numeric;
  v_band text;
BEGIN
  -- Aggregate all candidates by corridor (origin_state → dest_state)
  FOR r IN
    SELECT
      CONCAT(origin_state, '-', dest_state) AS corridor_key,
      origin_state,
      dest_state,
      COUNT(*) AS total_loads,
      COUNT(*) FILTER (WHERE signals::text LIKE '%covered_load%') AS covered_loads
    FROM public.hc_extraction_candidates
    WHERE origin_state IS NOT NULL
      AND dest_state IS NOT NULL
      AND status IN ('pending', 'merged')
    GROUP BY origin_state, dest_state
    HAVING COUNT(*) >= 2  -- minimum 2 sightings for meaningful rate
  LOOP
    -- Compute completion rate
    v_rate := r.covered_loads::numeric / r.total_loads::numeric;

    -- Assign band
    v_band := CASE
      WHEN v_rate >= 0.75 THEN 'on_fire'
      WHEN v_rate >= 0.50 THEN 'hot'
      WHEN v_rate >= 0.25 THEN 'warm'
      WHEN v_rate > 0     THEN 'cold'
      ELSE 'unknown'
    END;

    -- Upsert into corridor_heat
    UPDATE public.corridor_heat SET
      total_loads     = r.total_loads,
      covered_loads   = r.covered_loads,
      completion_rate = v_rate,
      completion_band = v_band,
      updated_at      = now()
    WHERE corridor_key = r.corridor_key;

    -- Return the computed row
    corridor := r.corridor_key;
    total    := r.total_loads;
    covered  := r.covered_loads;
    rate     := v_rate;
    band     := v_band;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Grant execute to authenticated users (read-only computation)
GRANT EXECUTE ON FUNCTION public.hc_update_corridor_completion_rates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hc_update_corridor_completion_rates() TO service_role;

-- =============================================================================
-- RPC: hc_get_hottest_corridors
-- Returns top corridors ranked by completion rate (demand confidence).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.hc_get_hottest_corridors(
  p_limit int DEFAULT 20,
  p_min_loads int DEFAULT 2
)
RETURNS TABLE(
  corridor_key text,
  origin_state text,
  dest_state text,
  heat_score numeric,
  total_loads int,
  covered_loads int,
  completion_rate numeric,
  completion_band text,
  active_loads int,
  last_seen_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ch.corridor_key,
    ch.origin_admin1 AS origin_state,
    ch.dest_admin1 AS dest_state,
    ch.heat_01 AS heat_score,
    ch.total_loads,
    ch.covered_loads,
    ch.completion_rate,
    ch.completion_band,
    ch.active_loads,
    ch.last_seen_at
  FROM public.corridor_heat ch
  WHERE ch.total_loads >= p_min_loads
    AND ch.country = 'US'
  ORDER BY
    ch.completion_rate DESC,
    ch.heat_01 DESC,
    ch.active_loads DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.hc_get_hottest_corridors(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hc_get_hottest_corridors(int, int) TO service_role;

-- =============================================================================
-- Run initial computation against existing data
-- =============================================================================
SELECT * FROM public.hc_update_corridor_completion_rates();
