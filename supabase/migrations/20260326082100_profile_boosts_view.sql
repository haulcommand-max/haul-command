-- =============================================================================
-- HAUL COMMAND: profile_boosts TABLE — Fix for notifications cron
-- Root Cause: /api/cron/notifications queries `profile_boosts` which doesn't
-- exist (only `ad_boosts` exists). This creates a normalized view so both work.
-- =============================================================================

-- Create profile_boosts as a view aliasing ad_boosts so the notifications
-- cron doesn't crash when it queries operator_id from this table.
CREATE OR REPLACE VIEW public.profile_boosts AS
SELECT
  id,
  profile_id AS operator_id,   -- notifications cron needs operator_id
  profile_id,
  duration_days,
  amount_cents,
  stripe_session_id,
  status,
  'standard' AS boost_type,    -- default type for backwards compat
  starts_at,
  expires_at,
  created_at
FROM public.ad_boosts;
