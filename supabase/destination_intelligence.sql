-- ============================================================================
-- DESTINATION INTELLIGENCE LAYER (Phase 15 - Destination SEO)
-- ============================================================================
-- Purpose: Power the "Living Atlas" Programmatic SEO Strategy.
-- Strategy: Rank for "Pilot Car for [Refinery Name]" by providing Gate Logistics.
-- ============================================================================

-- 1. Destinations Table (The Industrial Nodes)
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- "ExxonMobil Baytown Refinery"
    slug TEXT NOT NULL, -- "exxonmobil-baytown-refinery"
    type TEXT NOT NULL, -- 'PORT', 'REFINERY', 'MINE', 'INDUSTRIAL_PARK', 'BORDER_CROSSING'
    jurisdiction_id TEXT NOT NULL, -- 'US-TX'
    
    -- Using Geography for accurate distance calcs (PostGIS)
    gate_location GEOGRAPHY(POINT) NOT NULL, -- The TRUCK GATE coordinates. Critical.
    
    -- Logistical details extracted by "Logistics Detective" Agent
    truck_gate_label TEXT, -- "Gate 3 via Decker Drive"
    radio_channel TEXT, -- "LADD-1" or "154.100 VHF"
    ppe_required BOOLEAN DEFAULT TRUE,
    has_overnight_parking BOOLEAN DEFAULT FALSE,
    security_level TEXT DEFAULT 'STANDARD', -- 'TWIC', 'MARSEC', 'STANDARD'
    
    -- AI Generated Content
    logistics_summary TEXT, -- "Enter via Gate 3. Staging available at Love's 2 miles south."
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Destination Staging Junction
-- Links an Industrial Destination to the nearest approved Staging Area.
CREATE TABLE IF NOT EXISTS destination_staging_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID REFERENCES destinations(id),
    staging_area_id UUID REFERENCES staging_areas(id), -- From canadian_intelligence.sql (or expanded global table)
    distance_miles DECIMAL(10,2),
    notes TEXT -- "Best for waiting for morning shift."
);

-- RLS
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_staging_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Public Read Links" ON destination_staging_links FOR SELECT USING (true);

-- Index for Geospatial search ("Find destinations near me")
CREATE INDEX IF NOT EXISTS idx_destinations_location ON destinations USING GIST (gate_location);
