BEGIN;

-- 1. Create a lightweight real-time status table to avoid locking the main directory table
CREATE TABLE IF NOT EXISTS public.operator_live_status (
    operator_id UUID PRIMARY KEY REFERENCES public.hc_global_operators(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'offline', -- 'available', 'busy', 'offline'
    last_pinged_at timestamptz DEFAULT now(),
    current_lat double precision,
    current_lng double precision,
    city_override text,
    available_until timestamptz
);

-- Enable RLS for Realtime tracking
ALTER TABLE public.operator_live_status ENABLE ROW LEVEL SECURITY;

-- Everyone can view live status
CREATE POLICY "Public can view live status" ON public.operator_live_status
    FOR SELECT USING (true);

-- Operators can only update their own status
CREATE POLICY "Operators can update own status" ON public.operator_live_status
    FOR ALL USING (auth.uid() = operator_id);

-- Enable Supabase Realtime on this table
alter publication supabase_realtime add table public.operator_live_status;

-- 2. Add an index to rapidly query who is online *right now*
CREATE INDEX idx_operator_live_status_available 
ON public.operator_live_status(status, last_pinged_at) 
WHERE status = 'available';

-- 3. Create RPC for instant ping updates
CREATE OR REPLACE FUNCTION ping_live_status(
    p_operator_id UUID, 
    p_status text, 
    p_lat double precision DEFAULT NULL, 
    p_lng double precision DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.operator_live_status (operator_id, status, last_pinged_at, current_lat, current_lng)
    VALUES (p_operator_id, p_status, now(), p_lat, p_lng)
    ON CONFLICT (operator_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        last_pinged_at = EXCLUDED.last_pinged_at,
        current_lat = COALESCE(EXCLUDED.current_lat, operator_live_status.current_lat),
        current_lng = COALESCE(EXCLUDED.current_lng, operator_live_status.current_lng);
END;
$$;

COMMIT;
