-- ═══════════════════════════════════════════════════════════════════
-- PERFORMANCE PATCH: Emergency Indexes + Materialized View
-- Audit: PRODUCTION_PERFORMANCE_AUDIT.md — Phase 3
-- Target: Eliminate full-table scans on hot paths
-- ═══════════════════════════════════════════════════════════════════

-- 1. Composite index for the most-hit directory query pattern:
--    WHERE active = true AND state = ? ORDER BY rank_score DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_active_state
  ON listings(state) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_active_rank
  ON listings(rank_score DESC NULLS LAST) WHERE active = true;

-- 2. Slug lookup on directory_listings (profile resolver hot path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directory_listings_slug
  ON directory_listings(slug);

-- 3. Visibility + rank ordering on directory_listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dl_visible_rank
  ON directory_listings(rank_score DESC NULLS LAST) WHERE is_visible = true;

-- 4. Slug redirect lookup (fires on every slug-based profile view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slug_redirects_active
  ON slug_redirects(old_slug) WHERE is_active = true;

-- 5. Materialized view for state counts
--    Replaces the full-table scan in /api/directory/region-stats
--    and the stateRes query in directory/page.tsx
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_state_counts AS
  SELECT
    state,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE claimed = true)::int AS claimed_count,
    COUNT(*) FILTER (WHERE claimed = false OR claimed IS NULL)::int AS unclaimed_count,
    ROUND(AVG(rating)::numeric, 1) AS avg_rating
  FROM listings
  WHERE active = true AND state IS NOT NULL AND state != ''
  GROUP BY state
  ORDER BY total DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_state_counts_state ON mv_state_counts(state);

-- 6. RPC to read the materialized view (avoids direct table access from client)
CREATE OR REPLACE FUNCTION rpc_state_counts()
RETURNS TABLE(
  state text,
  total int,
  claimed_count int,
  unclaimed_count int,
  avg_rating numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT state, total, claimed_count, unclaimed_count, avg_rating
  FROM mv_state_counts
  ORDER BY total DESC;
$$;

-- 7. Cron job to refresh the materialized view every 5 minutes
-- Uncomment when pg_cron is enabled:
-- SELECT cron.schedule(
--   'refresh_state_counts',
--   '*/5 * * * *',
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_state_counts'
-- );

-- 8. Grant access to the materialized view for anon/authenticated
GRANT SELECT ON mv_state_counts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_state_counts() TO anon, authenticated;
