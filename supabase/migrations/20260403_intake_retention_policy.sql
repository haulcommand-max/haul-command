-- ============================================================
-- INTAKE EVENTS RETENTION POLICY
-- GDPR Art. 5(1)(e): Storage limitation principle
-- Auto-delete behavioral tracking data after 90 days
-- ============================================================

begin;

-- 1. Add a scheduled deletion policy via pg_cron
-- (Requires pg_cron extension enabled in Supabase dashboard)

-- Create the cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_intake_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete intake events older than 90 days
    DELETE FROM public.intake_events
    WHERE received_at < NOW() - INTERVAL '90 days';

    -- Delete expired data purchases (mark as expired, don't delete)
    UPDATE public.data_purchases
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();

    -- Log the cleanup
    INSERT INTO public.hc_events (event_type, properties)
    VALUES ('system_cleanup', jsonb_build_object(
        'task', 'retention_policy',
        'ran_at', NOW()::text
    ));
END;
$$;

-- 2. Schedule the cleanup to run daily at 3:00 AM UTC
-- (Uncomment when pg_cron is enabled)
-- SELECT cron.schedule(
--     'cleanup-intake-events',
--     '0 3 * * *',
--     $$SELECT public.cleanup_expired_intake_events()$$
-- );

-- 3. Add index to support efficient deletion
CREATE INDEX IF NOT EXISTS idx_intake_events_received_at
    ON public.intake_events (received_at);

-- 4. Add RLS to intake_events if not already present
ALTER TABLE public.intake_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own intake events (if source_entity_id matches)
CREATE POLICY IF NOT EXISTS intake_events_own_read
    ON public.intake_events
    FOR SELECT
    TO authenticated
    USING (
        source_entity_id = auth.uid()::text
        OR source_entity_id IS NULL
    );

-- Service role has full access
CREATE POLICY IF NOT EXISTS intake_events_service
    ON public.intake_events
    FOR ALL
    USING (auth.role() = 'service_role');

commit;
