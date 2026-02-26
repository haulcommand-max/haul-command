-- Migration: 20260219_demand_heat.sql
-- Description: Tracking and predicting regional broker demand for escorts using a Z-score based HeatIndex.

-- 1. Base tracking table for regional signals
CREATE TABLE IF NOT EXISTS public.metro_demand_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code text NOT NULL, -- e.g. "TX" or "Florida"
    metro_area text NOT NULL, -- e.g. "Midland" or "Houston"
    date_recorded date NOT NULL DEFAULT CURRENT_DATE,
    
    -- Inputs
    load_posts_count integer DEFAULT 0,
    route_searches_count integer DEFAULT 0,
    quote_requests_count integer DEFAULT 0,
    broker_signup_velocity integer DEFAULT 0,
    coverage_gap_minutes numeric DEFAULT 0.0,
    
    -- Calculated Outputs
    heat_index numeric DEFAULT 0.0, -- The 0-100 score
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(region_code, metro_area, date_recorded)
);

-- RLS
ALTER TABLE public.metro_demand_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins control demand signals" ON public.metro_demand_signals
    FOR ALL USING (public.is_admin());

-- 2. Z-Score helper functions
-- In a true environment, we'd calculate standard deviation over a rolling 30-day window.
-- For the sake of the DB logic, we approximate the Z-Score calculation.
CREATE OR REPLACE FUNCTION public.calculate_z_score(val numeric, mean numeric, stddev numeric)
RETURNS numeric
LANGUAGE sql STABLE AS $$
    SELECT CASE WHEN stddev = 0 THEN 0 ELSE (val - mean) / stddev END;
$$;

-- 3. The Core Heat Prediction Formula
-- Formula: 0.30*Z(load_posts) + 0.20*Z(route_searches) + 0.20*Z(quote_requests) + 0.15*Z(broker_signup) + 0.15*Z(coverage_gap)
-- Note: Coverage Gap is typically inverse (higher gap = higher demand/scarcity), so we use a positive weight for higher numeric gaps.
CREATE OR REPLACE FUNCTION public.compute_demand_heat_index(
    p_load_posts integer,
    p_route_searches integer,
    p_quote_requests integer,
    p_broker_signups integer,
    p_coverage_gap numeric,
    -- Passing the moving averages and stddevs to keep this function pure
    p_load_mean numeric, p_load_std numeric,
    p_route_mean numeric, p_route_std numeric,
    p_quote_mean numeric, p_quote_std numeric,
    p_signup_mean numeric, p_signup_std numeric,
    p_gap_mean numeric, p_gap_std numeric
)
RETURNS numeric
LANGUAGE plpgsql STABLE AS $$
DECLARE
    z_loads numeric;
    z_routes numeric;
    z_quotes numeric;
    z_signups numeric;
    z_gaps numeric;
    
    raw_heat numeric;
    clamped_heat numeric;
BEGIN
    z_loads := public.calculate_z_score(p_load_posts::numeric, p_load_mean, p_load_std);
    z_routes := public.calculate_z_score(p_route_searches::numeric, p_route_mean, p_route_std);
    z_quotes := public.calculate_z_score(p_quote_requests::numeric, p_quote_mean, p_quote_std);
    z_signups := public.calculate_z_score(p_broker_signups::numeric, p_signup_mean, p_signup_std);
    z_gaps := public.calculate_z_score(p_coverage_gap, p_gap_mean, p_gap_std);
    
    -- Apply Weights
    raw_heat := (0.30 * z_loads) + (0.20 * z_routes) + (0.20 * z_quotes) + (0.15 * z_signups) + (0.15 * z_gaps);
    
    -- Normalize the aggregated Z-score (-3 to +3 range roughly) to a 0-100 scale.
    -- If raw_heat is 0 (average), it should be 50.
    -- If raw_heat is >= 2 (very high), it should approach 100.
    -- If raw_heat is <= -2 (very low), it should approach 0.
    
    clamped_heat := 50 + (raw_heat * 16.66); -- Roughly maps +/- 3 stddev to 0-100
    
    IF clamped_heat > 100 THEN clamped_heat := 100; END IF;
    IF clamped_heat < 0 THEN clamped_heat := 0; END IF;
    
    RETURN clamped_heat;
END;
$$;

-- 4. View for active 7-day visualization
CREATE OR REPLACE VIEW public.vw_active_metro_heat AS
SELECT 
    region_code,
    metro_area,
    AVG(heat_index) as avg_7d_heat,
    MAX(heat_index) as peak_7d_heat,
    SUM(load_posts_count) as weekly_loads
FROM public.metro_demand_signals
WHERE date_recorded >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY region_code, metro_area;

-- 5. Seed some initial data for USA/CANADA
INSERT INTO public.metro_demand_signals (region_code, metro_area, date_recorded, load_posts_count, route_searches_count, quote_requests_count, coverage_gap_minutes, heat_index)
VALUES 
    ('TX', 'Houston', CURRENT_DATE, 45, 120, 15, 45.5, 92.4),
    ('TX', 'Midland', CURRENT_DATE, 30, 80, 10, 85.0, 95.1), -- Rural high gap
    ('FL', 'Orlando', CURRENT_DATE, 25, 60, 5, 20.0, 78.5),
    ('AB', 'Calgary', CURRENT_DATE, 20, 50, 4, 30.0, 82.0),
    ('ON', 'Toronto', CURRENT_DATE, 40, 100, 12, 15.0, 75.0)
ON CONFLICT (region_code, metro_area, date_recorded) DO UPDATE 
SET heat_index = EXCLUDED.heat_index;
