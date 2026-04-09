-- ==============================================================================
-- Haul Command Database Migration
-- Target: Delayed FOMO Claim Architecture
-- Logic: Do not fire claim webhooks until the page stews in Google for 90 days
--        OR until the page has generated > 15 real broker views.
-- ==============================================================================

-- 1. Create the Traffic/SEO metrics table for Operators
CREATE TABLE IF NOT EXISTS public.hc_operator_traffic_metrics (
    entity_id uuid PRIMARY KEY REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
    days_indexed int DEFAULT 0,
    broker_view_count int DEFAULT 0,
    search_impression_count int DEFAULT 0,
    seo_value_threshold_reached boolean DEFAULT false,
    last_updated_at timestamptz DEFAULT now()
);

-- 2. Create the evaluation function (Runs Nightly via pg_cron)
CREATE OR REPLACE FUNCTION public.evaluate_seo_claim_readiness()
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    -- We want them to say "OH SHIT SON, I NEED THIS."
    -- We only target unclaimed profiles that have been indexed for > 90 days 
    -- OR have proven broker traffic (views > 15)
    FOR r IN 
        SELECT o.id, o.email, o.business_name, t.days_indexed, t.broker_view_count 
        FROM public.hc_global_operators o
        JOIN public.hc_operator_traffic_metrics t ON o.id = t.entity_id
        WHERE o.status = 'unclaimed' 
        AND o.email IS NOT NULL
        AND t.seo_value_threshold_reached = false
        AND (t.days_indexed > 90 OR t.broker_view_count > 15)
    LOOP
        -- Mark as threshold reached so we don't trigger the webhook twice
        UPDATE public.hc_operator_traffic_metrics 
        SET seo_value_threshold_reached = true 
        WHERE entity_id = r.id;

        -- FIRE THE WEBHOOK TO LISTMONK
        -- Utilizing pg_net to send the HTTP POST directly from Postgres
        PERFORM net.http_post(
            url := current_setting('app.settings.listmonk_url') || '/api/subscribers',
            headers := '{"Content-Type": "application/json", "Authorization": "Basic ' || current_setting('app.settings.listmonk_auth') || '"}',
            body := json_build_object(
                'email', r.email,
                'name', r.business_name,
                'status', 'enabled',
                'lists', ARRAY[2], -- 2 = The "Billy Gene FOMO Suppression List"
                'preconfirm_subscriptions', true,
                'attribs', json_build_object(
                    'stew_days', r.days_indexed,
                    'broker_views', r.broker_view_count
                )
            )::jsonb
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the Cron Job (Runs every night at 2:00 AM)
SELECT cron.schedule(
    'nightly_seo_claim_evaluation',
    '0 2 * * *',
    $$SELECT public.evaluate_seo_claim_readiness();$$
);
