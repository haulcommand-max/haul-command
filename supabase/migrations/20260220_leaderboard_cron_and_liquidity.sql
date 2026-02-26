-- ============================================================
-- LEADERBOARD CRON + MARKETPLACE LIQUIDITY VIEW
-- Migration: 20260220_leaderboard_cron_and_liquidity.sql
-- ============================================================

-- 1. Schedule leaderboard snapshot hourly via pg_cron
-- Requires pg_cron extension (enabled on Supabase Pro+)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove any existing schedule to avoid duplicates
    PERFORM cron.unschedule('leaderboard-snapshot-hourly');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- schedule doesn't exist yet, safe to ignore
  END IF;
END $$;

-- Schedule the edge function to fire every hour at minute :05
SELECT cron.schedule(
  'leaderboard-snapshot-hourly',
  '5 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/leaderboard-snapshot-hourly',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );$$
);

-- 2. Marketplace Liquidity Prediction View
-- Materializes liquidity signals for SWR consumption
CREATE OR REPLACE VIEW public.v_market_liquidity AS
WITH driver_density AS (
  SELECT
    COALESCE(dp.home_state, 'XX') AS geo_key,
    COUNT(*) FILTER (WHERE ep.status = 'online') AS active_drivers,
    COUNT(*) AS total_drivers
  FROM public.driver_profiles dp
  LEFT JOIN public.escort_presence ep ON ep.escort_id = dp.user_id
  GROUP BY COALESCE(dp.home_state, 'XX')
),
match_velocity AS (
  SELECT
    COALESCE(l.origin_state, 'XX') AS geo_key,
    COUNT(*) FILTER (WHERE j.created_at > NOW() - INTERVAL '6 hours') AS matches_6h,
    COUNT(*) FILTER (WHERE j.created_at > NOW() - INTERVAL '1 hour')  AS matches_1h
  FROM public.loads l
  LEFT JOIN public.jobs j ON j.load_id = l.id
  WHERE l.created_at > NOW() - INTERVAL '24 hours'
  GROUP BY COALESCE(l.origin_state, 'XX')
),
demand_heat AS (
  SELECT
    COALESCE(origin_state, 'XX') AS geo_key,
    COUNT(*) FILTER (WHERE status = 'active') AS active_loads,
    COUNT(*) AS total_loads_24h
  FROM public.loads
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY COALESCE(origin_state, 'XX')
)
SELECT
  COALESCE(dd.geo_key, mv.geo_key, dh.geo_key) AS geo_key,

  -- Liquidity score (0-100)
  LEAST(100, GREATEST(0,
    (COALESCE(dd.active_drivers, 0)::numeric / NULLIF(GREATEST(dd.total_drivers, 1), 0) * 30) +
    (LEAST(COALESCE(mv.matches_1h, 0), 10)::numeric / 10 * 25) +
    (LEAST(COALESCE(dh.active_loads, 0), 20)::numeric / 20 * 20) +
    (CASE WHEN COALESCE(dd.active_drivers, 0) > 3 AND COALESCE(dh.active_loads, 0) > 0 THEN 15 ELSE 0 END) +
    (CASE WHEN COALESCE(mv.matches_6h, 0) > 2 THEN 10 ELSE COALESCE(mv.matches_6h, 0)::numeric / 2 * 10 END)
  ))::int AS liquidity_score,

  -- Predicted fill minutes
  CASE
    WHEN COALESCE(dd.active_drivers, 0) >= 5 AND COALESCE(mv.matches_1h, 0) >= 2 THEN 15
    WHEN COALESCE(dd.active_drivers, 0) >= 3 THEN 35
    WHEN COALESCE(dd.active_drivers, 0) >= 1 THEN 75
    ELSE 180
  END AS predicted_fill_minutes,

  -- Risk band
  CASE
    WHEN COALESCE(dd.active_drivers, 0) >= 5 AND COALESCE(mv.matches_1h, 0) >= 2 THEN 'green'
    WHEN COALESCE(dd.active_drivers, 0) >= 2 THEN 'yellow'
    ELSE 'red'
  END AS risk_band,

  COALESCE(dd.active_drivers, 0) AS active_drivers,
  COALESCE(dh.active_loads, 0) AS active_loads,
  COALESCE(mv.matches_6h, 0) AS matches_6h,
  NOW() AS updated_at

FROM driver_density dd
FULL OUTER JOIN match_velocity mv ON mv.geo_key = dd.geo_key
FULL OUTER JOIN demand_heat dh ON dh.geo_key = COALESCE(dd.geo_key, mv.geo_key);

-- Grant read access
GRANT SELECT ON public.v_market_liquidity TO anon, authenticated;

-- 3. Schedule compliance reminders (while we're at it)
SELECT cron.schedule(
  'compliance-reminders-daily',
  '0 9 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/compliance-reminders-run',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );$$
);
