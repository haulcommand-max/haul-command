DROP MATERIALIZED VIEW IF EXISTS mv_state_counts CASCADE;
DROP FUNCTION IF EXISTS rpc_state_counts();

CREATE MATERIALIZED VIEW mv_state_counts AS
SELECT 
    UPPER(TRIM(state)) as state, 
    COUNT(*) as total,
    SUM(CASE WHEN claimed = true THEN 1 ELSE 0 END) as claimed_count,
    SUM(CASE WHEN claimed = false OR claimed IS NULL THEN 1 ELSE 0 END) as unclaimed_count,
    AVG(rating) as avg_rating
FROM listings
WHERE active = true AND state IS NOT NULL AND state != ''
GROUP BY UPPER(TRIM(state));

CREATE UNIQUE INDEX mv_state_counts_state_idx ON mv_state_counts(state);

CREATE OR REPLACE FUNCTION rpc_state_counts()
RETURNS TABLE (
    state text,
    total bigint,
    claimed_count bigint,
    unclaimed_count bigint,
    avg_rating numeric
) AS $$
BEGIN
    RETURN QUERY SELECT mv.state, mv.total, mv.claimed_count, mv.unclaimed_count, mv.avg_rating FROM mv_state_counts mv ORDER BY mv.total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT SELECT ON mv_state_counts TO anon;
GRANT SELECT ON mv_state_counts TO authenticated;

NOTIFY pgrst, 'reload schema';
