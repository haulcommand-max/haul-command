-- 20260220_geo_hex_aggregates.sql
-- H3 hex bucketing aggregates for fast liquidity and incident heatmaps

CREATE TABLE IF NOT EXISTS public.market_hex_agg (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hex_id text NOT NULL, -- H3 index string
    window_start timestamptz NOT NULL,
    window_end timestamptz NOT NULL,
    active_drivers integer DEFAULT 0,
    active_loads integer DEFAULT 0,
    incidents integer DEFAULT 0,
    liquidity_score numeric DEFAULT 0.0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_hex_agg_search ON public.market_hex_agg(hex_id, window_end DESC);

CREATE TABLE IF NOT EXISTS public.incident_hex_agg (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    hex_id text NOT NULL,
    window_start timestamptz NOT NULL,
    window_end timestamptz NOT NULL,
    weighted_incidents numeric DEFAULT 0.0,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incident_hex_agg_search ON public.incident_hex_agg(hex_id, window_end DESC);

-- Enable RLS
ALTER TABLE public.market_hex_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_hex_agg ENABLE ROW LEVEL SECURITY;

-- Expose to authenticated users for map rendering
CREATE POLICY "Anyone can read hex aggregates" ON public.market_hex_agg FOR SELECT USING (true);
CREATE POLICY "Anyone can read incident hex aggregates" ON public.incident_hex_agg FOR SELECT USING (true);
