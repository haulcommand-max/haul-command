-- Migration: Wave 2 Settlement Guardrails & Autonomous Release Loop
-- Enacts the "financial-sync" cron and GPS-POD wiring per Double Platinum OS requirements

-- 1. Ensure resilience on payout tracking
ALTER TABLE "public"."hc_pay_payouts"
  ADD COLUMN IF NOT EXISTS "retry_count" int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_retry_at" timestamptz;

-- 2. GPS Proof of Delivery (POD) Geofence Function
-- Restricts status transition if operator is not physically at the destination.
-- Global canonical scope (120-country safe, PostGIS enabled)
CREATE OR REPLACE FUNCTION public.mark_load_delivered_with_pod(p_load_id UUID, p_lat FLOAT, p_lng FLOAT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dest_geog geography;
    v_dist float;
    v_filled_by uuid;
BEGIN
    -- Extract the destination coordinates and owner of the active load
    SELECT destination_geog, filled_by::uuid INTO v_dest_geog, v_filled_by 
    FROM public.hc_loads 
    WHERE id = p_load_id AND load_status = 'IN_TRANSIT';
    
    IF v_dest_geog IS NULL THEN
        RAISE EXCEPTION 'Load % not found or not in transit.', p_load_id;
    END IF;

    -- Authorization check: Ensure the caller actually owns the load
    IF auth.uid() IS NOT NULL AND auth.uid() != v_filled_by THEN
        RAISE EXCEPTION 'Unauthorized: Caller does not own this load.';
    END IF;

    -- Calculate Haversine distance via PostGIS geography
    v_dist := ST_Distance(v_dest_geog, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography);

    -- Enforce 2,000 meter global laydown-yard tolerance for heavy haul
    IF v_dist > 2000 THEN
        RAISE EXCEPTION 'POD Failed: Operator is % meters away. Must be within 2km to trigger autonomous settlement release.', ROUND(v_dist);
    END IF;

    -- Valid GPS signature. Transition load state autonomously.
    UPDATE public.hc_loads 
    SET load_status = 'DELIVERED', 
        updated_at = NOW() 
    WHERE id = p_load_id;

    RETURN true;
END;
$$;

-- 3. Autonomous Settlement Release Trigger
-- Watches for DELIVERED state and releases the associated escrow ledger natively.
CREATE OR REPLACE FUNCTION public.trg_hc_escrow_release()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atomic trigger: Release escrow only when load becomes delivered natively or via GPS function
    IF NEW.load_status = 'DELIVERED' AND OLD.load_status != 'DELIVERED' THEN
        UPDATE public.hc_escrow
        SET status = 'release_pending',
            updated_at = NOW()
        WHERE booking_id = NEW.id
          AND status = 'held';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hc_escrow_release_on_delivery ON public.hc_loads;
CREATE TRIGGER trg_hc_escrow_release_on_delivery
    AFTER UPDATE OF load_status ON public.hc_loads
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_hc_escrow_release();

-- 4. Financial-Sync Retry Function (To be invoked by pg_cron or edge external cron)
CREATE OR REPLACE FUNCTION public.retry_failed_payouts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Promote stalled/failed payloads into pending queue for edge worker to catch
    WITH updated AS (
        UPDATE public.hc_pay_payouts
        SET status = 'pending',
            retry_count = retry_count + 1,
            next_retry_at = NOW() + INTERVAL '1 hour',
            updated_at = NOW()
        WHERE status = 'FAILED'
          AND retry_count < 3
          AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM updated;

    RETURN v_count;
END;
$$;

-- Ensure extension pg_cron exists (Fail-safe for Supabase local/hosted environments)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Reschedule if exists to alter logic
    PERFORM cron.unschedule('financial-sync-payouts');
    PERFORM cron.schedule('financial-sync-payouts', '*/15 * * * *', 'SELECT public.retry_failed_payouts();');
  END IF;
END $$;
