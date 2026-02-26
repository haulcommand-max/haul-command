-- ============================================================================
-- HAUL COMMAND AUTONOMOUS BOOKING ENGINE (HABE) SCHEMA
-- Phase 16: The "Zero-Touch" Brokerage
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS --
CREATE TYPE habe_offer_state AS ENUM (
    'NEW_OFFER_CAPTURED',
    'VALIDATING',
    'ROUTING_TO_CANDIDATES',
    'OFFER_SENT',
    'WAITING_RESPONSE',
    'NEGOTIATING', -- Counter-offer active
    'ACCEPTED',
    'BROKER_CONFIRMING',
    'BOOKED',
    'COMPLETED',
    'CANCELLED',
    'FAILED',
    'EXPIRED'
);

CREATE TYPE habe_role_type AS ENUM ('BROKER', 'DRIVER', 'ESCORT', 'DISPATCHER', 'ADMIN');
CREATE TYPE habe_rate_type AS ENUM ('PER_MILE', 'FLAT_RATE', 'HOURLY');

-- 1. HABE PROFILES (Extends auth.users or base identities) --
CREATE TABLE IF NOT EXISTS habe_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Link to Auth System
    role habe_role_type NOT NULL,
    organization_name TEXT,
    
    -- Trust & Quality
    trust_score NUMERIC DEFAULT 50.0, -- 0-100
    reliability_score NUMERIC DEFAULT 50.0,
    
    -- Settings
    voice_enabled BOOLEAN DEFAULT TRUE,
    auto_accept_min_rate NUMERIC, -- "Auto-accept anything > $2.00/mi"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROXY NUMBERS (Masked Comms) --
CREATE TABLE IF NOT EXISTS habe_proxy_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES habe_profiles(id),
    phone_number TEXT NOT NULL, -- The Masked Twilio Number
    is_active BOOLEAN DEFAULT TRUE,
    provider_sid TEXT -- Twilio SID
);

-- 3. OFFERS (The Core Transaction Object) --
CREATE TABLE IF NOT EXISTS habe_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_profile_id UUID REFERENCES habe_profiles(id),
    
    -- Voice Data
    initial_call_id TEXT, -- Vapi Call ID
    voice_transcript TEXT,
    confidence_score NUMERIC DEFAULT 0.0,
    
    -- Load Details
    pickup_city TEXT NOT NULL,
    pickup_state TEXT,
    pickup_time TIMESTAMPTZ,
    pickup_geo GEOGRAPHY(POINT), -- PostGIS for routing
    
    dropoff_city TEXT NOT NULL,
    dropoff_state TEXT,
    dropoff_time TIMESTAMPTZ,
    dropoff_geo GEOGRAPHY(POINT),
    
    cargo_description TEXT,
    dims_length_ft NUMERIC,
    dims_width_ft NUMERIC,
    dims_height_ft NUMERIC,
    weight_lbs NUMERIC,
    
    -- Requirements
    req_high_pole BOOLEAN DEFAULT FALSE,
    req_chase BOOLEAN DEFAULT FALSE,
    req_bucket_truck BOOLEAN DEFAULT FALSE,
    req_route_survey BOOLEAN DEFAULT FALSE,
    
    -- Financials
    offer_rate_value NUMERIC,
    offer_rate_type habe_rate_type,
    offer_currency TEXT DEFAULT 'USD',
    
    -- State Machine
    status habe_offer_state DEFAULT 'NEW_OFFER_CAPTURED',
    current_assignee_id UUID REFERENCES habe_profiles(id), -- Who is currently holding the "Hot Potato"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NEGOTIATIONS (The Deal Flow) --
CREATE TABLE IF NOT EXISTS habe_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES habe_offers(id),
    candidate_id UUID REFERENCES habe_profiles(id),
    
    status TEXT NOT NULL, -- 'PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED'
    
    counter_rate_value NUMERIC,
    counter_note TEXT,
    
    response_time_seconds INTEGER, -- Used for Reliability Score
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EVENT LOG (Immutable Audit Trail) --
CREATE TABLE IF NOT EXISTS habe_offer_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES habe_offers(id),
    event_type TEXT NOT NULL, -- 'STATE_CHANGE', 'VOICE_CALL', 'SMS_SENT'
    payload JSONB, -- Full details
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEDGER (Financial Truth) --
CREATE TABLE IF NOT EXISTS habe_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES habe_offers(id),
    booking_fee_amount NUMERIC,
    driver_payout_amount NUMERIC,
    stripe_charge_id TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE habe_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE habe_negotiations ENABLE ROW LEVEL SECURITY;

-- Indexes for Routing
CREATE INDEX IF NOT EXISTS idx_habe_offers_pickup_geo ON habe_offers USING GIST (pickup_geo);
CREATE INDEX IF NOT EXISTS idx_habe_offers_status ON habe_offers(status);
