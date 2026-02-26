-- ══════════════════════════════════════════════════════════════
-- RPC: recently_filled_jobs
-- Returns last N completed jobs for the RecentlyFilledStrip.
-- No PII — only route, escort type, fill time, and relative label.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recently_filled_jobs(limit_n int DEFAULT 12)
RETURNS TABLE (
    job_id              uuid,
    origin_city         text,
    origin_region       text,
    dest_city           text,
    dest_region         text,
    escort_type         text,
    fill_minutes        int,
    filled_ago_label    text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT
        l.id                                                        AS job_id,
        l.origin_city                                               AS origin_city,
        l.origin_state                                              AS origin_region,
        l.destination_city                                          AS dest_city,
        l.destination_state                                         AS dest_region,
        l.service_required                                          AS escort_type,
        GREATEST(1, ROUND(
            EXTRACT(EPOCH FROM (l.booked_at - l.posted_at)) / 60
        )::int)                                                     AS fill_minutes,
        CASE
            WHEN l.booked_at > now() - interval '1 hour'  THEN
                EXTRACT(MINUTE FROM now() - l.booked_at)::int::text || 'm ago'
            WHEN l.booked_at > now() - interval '24 hours' THEN
                EXTRACT(HOUR FROM now() - l.booked_at)::int::text || 'h ago'
            ELSE
                EXTRACT(DAY FROM now() - l.booked_at)::int::text || 'd ago'
        END                                                         AS filled_ago_label
    FROM public.loads l
    WHERE
        l.status   = 'completed'
        AND l.booked_at IS NOT NULL
        AND l.posted_at IS NOT NULL
        -- no gated or test records
        AND l.origin_city IS NOT NULL
        AND l.destination_city IS NOT NULL
    ORDER BY l.booked_at DESC
    LIMIT limit_n;
$$;

-- Grant to anonymous role so the public API route can call it
GRANT EXECUTE ON FUNCTION public.recently_filled_jobs(int) TO anon, authenticated;
