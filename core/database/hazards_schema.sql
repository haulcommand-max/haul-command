-- Protocol Zero: Crowdsourced Intelligence (The Waze Layer)
-- Master Hazard & Infrastructure Mapping for Haul Command

-- 1. Hazard Categories (The Waze Spine)
CREATE TYPE hazard_type AS ENUM (
    'scale_open',
    'scale_closed',
    'low_wire',
    'bridge_clearance',
    'debris',
    'police_active',
    'wide_parking_verified',
    'road_closure'
);

-- 2. Live Hazards Table
CREATE TABLE IF NOT EXISTS public.hazards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type hazard_type NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION, -- Direction of travel if applicable
    reported_by UUID REFERENCES auth.users(id),
    report_count INTEGER DEFAULT 1,
    verified_count INTEGER DEFAULT 0,
    is_permanent BOOLEAN DEFAULT FALSE, -- Low wires/Bridges = TRUE
    height_inches INTEGER, -- For low wire/bridge strikes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- For temporary hazards (e.g. debris, scales)
    deleted_at TIMESTAMPTZ
);

-- 3. High Pole Strike Log (The Data Goldmine)
CREATE TABLE IF NOT EXISTS public.high_pole_strikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES auth.users(id),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    recorded_height_inches INTEGER NOT NULL,
    sensor_metadata JSONB, -- For future LiDAR/Sensor integration
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Wide-Load Friendly Directory (Monetizable)
CREATE TABLE IF NOT EXISTS public.directory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'fuel', 'food', 'lodging'
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    wide_load_verified BOOLEAN DEFAULT FALSE,
    max_width_capacity INTEGER, -- in inches
    has_high_overhead BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE, -- Monetization handle
    partner_id TEXT, -- Priceline/Booking.com ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Geospatial Performance
CREATE INDEX IF NOT EXISTS hazards_geo_idx ON public.hazards USING gist (
  ll_to_earth(latitude, longitude)
);

-- Rules: 4-hour expiration for non-permanent hazards
-- This would be handled by a Cron job or Edge Function
COMMENT ON COLUMN public.hazards.expires_at IS 'Hazards like "Scales Open" should expire after 4 hours to maintain accuracy.';

-- RLS Policies
ALTER TABLE public.hazards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Hazards Access" ON public.hazards FOR SELECT USING (true);
CREATE POLICY "Authorized Reporters" ON public.hazards FOR INSERT WITH CHECK (auth.role() = 'authenticated');
