-- ==============================================================================
-- Haul Command — Anti-Google Heavy Haul GPS Stack
-- Tables for DOT Road Restrictions, Bridge Hazards, and Vehicle Profiles
-- ==============================================================================

-- 1. Vehicle Profiles (Truck Dimensions)
CREATE TABLE IF NOT EXISTS public.vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID REFERENCES public.hc_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "9-Axle Superload Configuration"
    height_meters NUMERIC(5,2) NOT NULL,
    width_meters NUMERIC(5,2) NOT NULL,
    length_meters NUMERIC(5,2) NOT NULL,
    gross_weight_kg INTEGER NOT NULL,
    axle_count INTEGER,
    hazmat BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Road Restrictions (FHWA NBI & State DOT Hazards)
CREATE TABLE IF NOT EXISTS public.road_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_type TEXT NOT NULL, -- 'low_clearance', 'weight_limit', 'narrow_lane', 'tight_turn'
    source TEXT NOT NULL, -- 'fhwa_nbi', 'state_dot', 'user_reported'
    state_code VARCHAR(2),
    location GEOMETRY(POINT, 4326) NOT NULL,
    clearance_meters NUMERIC(5,2), -- for low bridges
    weight_limit_kg INTEGER, -- for weight limits
    width_meters NUMERIC(5,2), -- for narrow lanes
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'hard_restriction', -- 'hard_restriction' vs 'warning'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_road_restrictions_location ON public.road_restrictions USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_road_restrictions_state ON public.road_restrictions(state_code);

-- 3. Hazard Reports (HC Waze crowd-sourced)
CREATE TABLE IF NOT EXISTS public.hazard_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id),
    hazard_type TEXT NOT NULL, -- 'construction', 'accident', 'unmarked_low_clearance', 'weigh_station'
    location GEOMETRY(POINT, 4326) NOT NULL,
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_verified_by_ops BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hazard_reports_location ON public.hazard_reports USING GIST (location);

-- 4. Permit Routes (Digitized State DOT Approved Routes)
CREATE TABLE IF NOT EXISTS public.permit_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID, -- Links to commerce jobs (nullable if just a saved template)
    operator_id UUID REFERENCES auth.users(id),
    state_code VARCHAR(2) NOT NULL,
    permit_number TEXT,
    vehicle_profile_id UUID REFERENCES public.vehicle_profiles(id),
    route_polyline TEXT NOT NULL, -- Valhalla-compatible encoded polyline
    route_geom GEOMETRY(LineString, 4326),
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permit_routes_geom ON public.permit_routes USING GIST (route_geom);

-- RLS (Self-Serve Operators)
ALTER TABLE public.vehicle_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active restrictions" ON public.road_restrictions FOR SELECT
USING (is_active = true);

CREATE POLICY "Operators manage their own vehicle profiles" ON public.vehicle_profiles FOR ALL
USING (auth.uid() = operator_id);

CREATE POLICY "Anyone can report hazards" ON public.hazard_reports FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Anyone can read active hazard reports" ON public.hazard_reports FOR SELECT
USING (expires_at > NOW() OR expires_at IS NULL);
