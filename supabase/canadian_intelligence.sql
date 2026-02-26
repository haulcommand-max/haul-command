-- ============================================================================
-- CANADIAN INTELLIGENCE LAYER (Phase 14)
-- ============================================================================
-- Purpose: Power the "Quebec Firewall" and "Resource Road" dominance.
-- Strategy: "Infrastructure Depth" vs "Listings" (PCL Killer).
-- ============================================================================

-- 1. LADD Channels (Resource Road Comms)
-- "If you don't know the channel, you die." - The ultimate moat.
CREATE TABLE IF NOT EXISTS ladd_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_name TEXT NOT NULL, -- "Sierra Yoyo Desan Road"
    region TEXT NOT NULL, -- "BC-Northeast"
    frequency_mhz DECIMAL(10,4) NOT NULL, -- 154.1000
    channel_code TEXT, -- "LADD-1"
    mile_marker_start DECIMAL(10,1),
    mile_marker_end DECIMAL(10,1),
    notes TEXT, -- "Call out every 2km. Heavy logging traffic."
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staging Areas (Border/Northern)
-- "Where do I park a 200ft load at -40C?"
CREATE TABLE IF NOT EXISTS staging_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- "Nordel Way Staging"
    location GEOGRAPHY(POINT) NOT NULL,
    capacity_trucks INTEGER, -- 15
    has_power BOOLEAN DEFAULT FALSE, -- Plug-ins for block heaters?
    is_secure BOOLEAN DEFAULT FALSE,
    border_crossing_id TEXT, -- "Pacific Hwy"
    notes TEXT, -- "Dirt lot, gets muddy in spring. Tim Hortons 500m walk."
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Quebec "Escorte Routière" Certification
-- The "Firewall" against US competitors.
CREATE TABLE IF NOT EXISTS quebec_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES pilot_car_drivers(id),
    cours_stm_completed BOOLEAN DEFAULT FALSE, -- The mandatory QC course
    allows_montreal_island BOOLEAN DEFAULT FALSE, -- Special permit for island
    french_fluency_level TEXT DEFAULT 'NONE', -- 'NATIVE', 'FLUENT', 'BASIC', 'NONE'
    vehicle_signage_compliant BOOLEAN DEFAULT FALSE, -- "DANGER CONVOI SURDIMENSIONNÉ"
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE ladd_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE staging_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quebec_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read LADD" ON ladd_channels FOR SELECT USING (true);
CREATE POLICY "Public Read Staging" ON staging_areas FOR SELECT USING (true);
