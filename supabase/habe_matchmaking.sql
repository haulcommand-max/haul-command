-- ============================================================================
-- HAUL COMMAND: MATCHMAKING & GEAR LOCKER (The "Brain")
-- Implements Deterministic Matching & Verified Equipment
-- ============================================================================

-- 🔧 A. GEAR LOCKER (Normalized + Verified) --
CREATE TABLE IF NOT EXISTS gear_catalog_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'high_pole', 'vhf_radio', 'dash_cam', 'cones'
    brand TEXT,
    model TEXT,
    key_features JSONB, -- { "night_vision": true, "height_inches": 192 }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, brand, model)
);

CREATE TABLE IF NOT EXISTS escort_gear_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES directory_profiles(id),
    catalog_item_id UUID REFERENCES gear_catalog_items(id),
    
    -- Denormalized for speed
    category TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_or_notes TEXT,
    
    photo_paths TEXT[], -- Proof
    verified_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escort_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES directory_profiles(id),
    badge_key TEXT NOT NULL, -- 'pro_gear', 'superload_ready', 'canada_ready'
    badge_level INTEGER DEFAULT 1,
    awarded_reason JSONB,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_key)
);

-- 🎯 B. MATCHMAKING INPUTS (Readiness & Requirements) --

-- 1. Updates to OFFERS (Matching Criteria)
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS pickup_geo GEOGRAPHY(POINT);
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS dropoff_geo GEOGRAPHY(POINT);
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS jurisdictions TEXT[]; -- ['US-FL', 'US-GA']
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS required_equipment_tags TEXT[]; -- ['high_pole', 'vhf_radio']
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS required_badges TEXT[]; -- ['superload_ready']
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS load_height_in INTEGER;
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'NOW'; -- 'NOW', '24H', 'PLANNED'
ALTER TABLE habe_offers ADD COLUMN IF NOT EXISTS trust_floor INTEGER DEFAULT 0;

-- 2. ESCORT READINESS (The "Available" Signal)
CREATE TABLE IF NOT EXISTS escort_readiness (
    user_id UUID PRIMARY KEY REFERENCES directory_profiles(id),
    home_geo GEOGRAPHY(POINT),
    service_radius_miles INTEGER DEFAULT 500,
    coverage_jurisdictions TEXT[], -- ['US-FL']
    
    equipment_tags TEXT[], -- Cached from Verified Gear
    availability_status TEXT DEFAULT 'OFFLINE', -- 'AVAILABLE_NOW', 'BOOKED'
    available_from TIMESTAMPTZ,
    available_to TIMESTAMPTZ,
    
    response_sla_seconds INTEGER DEFAULT 300, -- 5 mins
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_escort_readiness_geo ON escort_readiness USING GIST (home_geo);
CREATE INDEX idx_escort_readiness_tags ON escort_readiness USING GIN (equipment_tags);

-- 📝 C. AUDIT TRAIL (Why did we match?) --
CREATE TABLE IF NOT EXISTS match_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES habe_offers(id),
    run_reason TEXT, -- 'NEW_OFFER', 'TIMEOUT_EXPAND'
    algorithm_version TEXT, -- 'v1.0'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_run_id UUID REFERENCES match_runs(id),
    offer_id UUID REFERENCES habe_offers(id),
    candidate_id UUID REFERENCES directory_profiles(id),
    
    rank INTEGER NOT NULL,
    score_total NUMERIC NOT NULL,
    score_breakdown JSONB, -- { "proximity": 30, "readiness": 20 }
    
    hard_block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_run_id, rank)
);

-- Indexes
CREATE INDEX idx_match_candidates_offer ON match_candidates(offer_id);
