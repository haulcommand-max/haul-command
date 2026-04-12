-- =========================================================================
-- HAUL COMMAND DOUBLE PLATINUM EXECUTION SPRINT
-- TARGET: INFRASTRUCTURE / DATABASE HARDENING (POINTS 5, 7, 8)
--
-- 1. POSTGIS ROUTE MATCHING MATRIX (ST_Intersects)
-- 2. WEBHOOK EVENT SKELETONS (pg_net)
-- 3. AUTOMATED DECEPTION / HONEYPOT DATA
-- =========================================================================

-- Enable pg_net extension for async webhooks directly out of Postgres
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- =========================================================================
-- PART 1: POSTGIS LINESTRING ROUTE MATCHING UPGRADE (Task 5)
-- Refactoring load matching from radial ST_DWithin to ST_Intersects
-- =========================================================================

-- We need to ensure that the load-matching algorithm operates on the polyline.
-- If loads are stored with origin/destination, we simulate a straight line route if 
-- a complex path isn't provided. In production, this would use a generated routing pgrouting.

CREATE OR REPLACE FUNCTION hc_match_operators_to_load_polyline(
    p_load_id UUID,
    p_buffer_meters DOUBLE PRECISION DEFAULT 16093.4 -- 10 miles default buffer
)
RETURNS TABLE (
    operator_id UUID,
    operator_geom GEOMETRY,
    distance_to_route DOUBLE PRECISION,
    matching_confidence DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_load_geom GEOMETRY;
BEGIN
    -- 1. Resolve the Polyline for the load (using origin and destination for now, or true path if mapped)
    -- As a baseline, we draw a buffered ST_MakeLine between origin and destination.
    SELECT ST_MakeLine(origin_geom::geometry, destination_geom::geometry)
    INTO v_load_geom
    FROM hc_loads
    WHERE id = p_load_id;

    -- Fallback safety check
    IF v_load_geom IS NULL THEN
        RAISE EXCEPTION 'Load % does not have valid geometry.', p_load_id;
    END IF;

    -- 2. Return operators whose recorded live location intersects the buffered corridor
    --    This matches operators driving directly ALONG the deadhead route.
    RETURN QUERY
    SELECT 
        l.operator_id,
        l.current_location::geometry as operator_geom,
        ST_Distance(l.current_location::geometry, v_load_geom) as distance_to_route,
        -- Confidence scalar based on proximity to the direct vector
        GREATEST(0, (1 - (ST_Distance(l.current_location::geometry, v_load_geom) / p_buffer_meters))) * 100 as matching_confidence
    FROM hc_operator_locations l
    WHERE ST_Intersects(
        l.current_location::geometry,
        ST_Buffer(v_load_geom::geography, p_buffer_meters)::geometry
    )
    ORDER BY distance_to_route ASC;
END;
$$;


-- =========================================================================
-- PART 2: ENTERPRISE WEBHOOK PIPELINE (pg_net) (Task 7)
-- Instantly dispatch load status changes to enterprise TMS without hitting Next.js API
-- =========================================================================

CREATE TABLE IF NOT EXISTS hc_tms_webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_org_id UUID REFERENCES hc_enterprise_organizations(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    event_type TEXT NOT NULL, -- e.g. "load_status_changed", "operator_arrived"
    is_active BOOLEAN DEFAULT true,
    secret_key TEXT, -- HMAC signature key for validation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal function to queue an async HTTP POST to enterprise webhooks
CREATE OR REPLACE FUNCTION hc_dispatch_tms_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sub RECORD;
    v_payload JSONB;
    v_request_id BIGINT;
BEGIN
    -- Only dispatch if the status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status = NEW.status) THEN
        RETURN NEW;
    END IF;

    -- Construct the event payload
    v_payload := jsonb_build_object(
        'event', 'load_status_changed',
        'load_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', NOW()
    );

    -- Loop through active webhooks for the enterprise owner of this load
    FOR v_sub IN 
        SELECT target_url, secret_key 
        FROM hc_tms_webhook_subscriptions 
        WHERE enterprise_org_id = NEW.broker_id 
          AND event_type = 'load_status_changed'
          AND is_active = true
    LOOP
        -- Execute non-blocking POST via pg_net
        SELECT net.http_post(
            url := v_sub.target_url,
            body := v_payload,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'X-Haul-Command-Signature', encode(hmac(v_payload::TEXT, v_sub.secret_key, 'sha256'), 'hex')
            )
        ) INTO v_request_id;
        
        -- We could log v_request_id to an audit table here.
    END LOOP;

    RETURN NEW;
END;
$$;

-- Bind the webhook dispatcher to the loads table
DROP TRIGGER IF EXISTS tr_dispatch_tms_webhook ON hc_loads;
CREATE TRIGGER tr_dispatch_tms_webhook
AFTER UPDATE OF status ON hc_loads
FOR EACH ROW
EXECUTE FUNCTION hc_dispatch_tms_webhook();


-- =========================================================================
-- PART 3: AUTOMATED DECEPTION / HONEYPOT DATA (Task 8)
-- Inject watermark data to identify scrapers
-- =========================================================================

CREATE TABLE IF NOT EXISTS hc_deception_honeypots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watermark_code TEXT UNIQUE NOT NULL, -- The unique identifier hidden in the load description or permit ID
    fake_load_id UUID UNIQUE NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_scraped_at TIMESTAMPTZ,
    scraper_ip TEXT
);

-- View that automatically unifies real loads with honeypot loads
CREATE OR REPLACE VIEW public_hc_load_board_secure AS
SELECT 
    id,
    origin_city,
    origin_state,
    destination_city,
    destination_state,
    pickup_date,
    equipment_type,
    rate,
    status,
    false as is_honeypot
FROM hc_loads
WHERE status IN ('open', 'matched')
UNION ALL
-- Inject the Ghost Data into the stream
-- To avoid disrupting real business logic, honeypots are structurally indistinguishable 
-- but contain impossible route geometries or watermark IDs tracked in the DB.
SELECT 
    fake_load_id as id,
    'Deception Point' as origin_city,
    'ZZ' as origin_state, -- Impossible state to flag internal queries
    'Phantom City' as destination_city,
    'ZZ' as destination_state,
    NOW() + interval '30 days' as pickup_date,
    'Superload 19-Axle' as equipment_type,
    99999 as rate,
    'open' as status,
    true as is_honeypot
FROM hc_deception_honeypots
WHERE fake_load_id NOT IN (SELECT id FROM hc_loads); -- Ensure no collision

-- Scraper detection trap endpoint trigger (pseudo log)
CREATE OR REPLACE FUNCTION hc_trap_scraper_access(p_ip TEXT, p_load_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE hc_deception_honeypots 
    SET last_scraped_at = NOW(), scraper_ip = p_ip
    WHERE fake_load_id = p_load_id;
END;
$$;
