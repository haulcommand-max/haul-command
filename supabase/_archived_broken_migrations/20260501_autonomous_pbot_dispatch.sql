-- ═══════════════════════════════════════════════════════════════
-- P-BOT AUTONOMOUS DISPATCH & PG_VECTOR LOAD MATCHING
-- ═══════════════════════════════════════════════════════════════

-- 1. Enable pg_vector extension for AI-driven load matching
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- 2. Enhance operators table with vector embeddings for predictive matching
-- This vector will store embeddings of the operator's capabilities, preferred corridors,
-- historic reliability, and equipment tiers to instantly match them with complex loads.
ALTER TABLE public.hc_core_operators 
ADD COLUMN IF NOT EXISTS predictive_match_vector vector(1536);

-- 3. The Autonomous Dispatch Table (P-Bot Ecosystem)
-- This table is strictly for Autonomous Trucks (e.g., Kodiak, TuSimple) 
-- that legally require human Pilot Escort Vehicles.
CREATE TABLE IF NOT EXISTS public.hc_autonomous_dispatch_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autonomous_provider VARCHAR(100) NOT NULL, -- e.g., 'Kodiak Robotics', 'TuSimple', 'Waymo Via'
    truck_vin VARCHAR(50),
    origin_point GEOGRAPHY(Point, 4326) NOT NULL,
    destination_point GEOGRAPHY(Point, 4326) NOT NULL,
    route_geometry GEOGRAPHY(LineString, 4326),
    load_dimensions JSONB, -- { width_ft, height_ft, weight_lbs }
    required_pevos INTEGER DEFAULT 2,     -- e.g., 2 human escorts required
    status VARCHAR(50) DEFAULT 'pending_pevo_match', -- pending, matched, en_route, completed
    matched_operator_ids UUID[],          -- Array of PEVOs assigned to this autonomous truck
    dispatch_timestamp TIMESTAMPTZ DEFAULT NOW(),
    completion_timestamp TIMESTAMPTZ,
    auto_api_key_used VARCHAR(100)
);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_auto_dispatch_origin ON public.hc_autonomous_dispatch_requests USING GIST (origin_point);

-- 4. AdGrid Localized Asset Engine
-- Storing ultra-localized 8K images tailored exactly to the coordinates
CREATE TABLE IF NOT EXISTS public.hc_adgrid_localized_assets (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    region_code VARCHAR(50), -- e.g. state or province equivalent
    terrain_type VARCHAR(50), -- e.g. 'desert', 'tundra', 'urban', 'highway'
    image_url_8k TEXT NOT NULL,
    dynamic_headline TEXT,
    dynamic_cta TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simple RLS policies for the new tables
ALTER TABLE public.hc_autonomous_dispatch_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_adgrid_localized_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autonomous requests visible to matched operators" 
ON public.hc_autonomous_dispatch_requests FOR SELECT USING (true); -- In prod, secure this

CREATE POLICY "AdGrid assets publicly visible" 
ON public.hc_adgrid_localized_assets FOR SELECT USING (is_active = true);
