-- ============================================================================
-- HAUL COMMAND: FOUNDATIONS & CATEGORY KILLER SCHEMA
-- Includes: Directory, Verification, Trust, Payments, Disputes, Jurisdictions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 🏔️ E. JURISDICTIONS (The Canonical Truth) --
CREATE TYPE jurisdiction_type AS ENUM ('STATE', 'PROVINCE', 'TERRITORY');
CREATE TABLE IF NOT EXISTS jurisdictions (
    code TEXT PRIMARY KEY, -- 'US-FL', 'CA-ON', 'PR'
    country TEXT NOT NULL, -- 'US', 'CA'
    name TEXT NOT NULL,
    type jurisdiction_type NOT NULL,
    dot_links_json JSONB, -- { "permits": "url", "escort_manual": "url" }
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🏢 A. DIRECTORY & PROFILES (The Public Face) --
CREATE TYPE profile_type AS ENUM ('ESCORT', 'COMPANY', 'BROKER');
CREATE TYPE listing_tier AS ENUM ('FREE', 'VERIFIED', 'PRO', 'ELITE');

CREATE TABLE IF NOT EXISTS directory_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Link to Auth
    type profile_type NOT NULL,
    
    display_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    
    bio TEXT,
    service_area JSONB, -- { "states": ["US-FL", "US-GA"], "radius_miles": 500 }
    base_location GEOGRAPHY(POINT),
    
    equipment_tags TEXT[], -- ['HIGH_POLE', 'CHASE_CAR']
    languages TEXT[], -- ['en', 'es', 'fr']
    
    is_listed BOOLEAN DEFAULT FALSE,
    tier listing_tier DEFAULT 'FREE',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programmatic SEO Locations
CREATE TYPE location_type AS ENUM ('STATE', 'PROVINCE', 'CITY', 'PORT', 'INTERCHANGE', 'INDUSTRIAL_HUB');
CREATE TABLE IF NOT EXISTS directory_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type location_type NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    jurisdiction_code TEXT REFERENCES jurisdictions(code),
    
    centroid GEOGRAPHY(POINT),
    seo_template_key TEXT, -- 'high-pole-escort-near-x'
    facts_json JSONB, -- { "active_escorts": 12, "avg_rate": 2.50 }
    
    UNIQUE(slug, jurisdiction_code)
);

-- 🔐 B. VERIFICATION & EVIDENCE VAULT ( The Trust Moat) --
CREATE TYPE verification_type AS ENUM ('INSURANCE', 'LIGHTBAR', 'VHF_RADIO', 'CERT', 'TWIC', 'VEHICLE_PHOTOS', 'BACKGROUND_CHECK');
CREATE TYPE requirement_severity AS ENUM ('BLOCK', 'WARN', 'INFO');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS verification_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jurisdiction_code TEXT REFERENCES jurisdictions(code),
    requirement_type verification_type NOT NULL,
    rules_json JSONB, -- { "min_height_inches": 43 }
    severity requirement_severity DEFAULT 'WARN',
    applies_to profile_type[] -- ['ESCORT']
);

CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES directory_profiles(id), -- Link to Profile
    doc_type verification_type NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage Path
    
    issued_at DATE,
    expires_at DATE,
    
    status verification_status DEFAULT 'PENDING',
    verified_by UUID, -- Admin ID
    verified_at TIMESTAMPTZ,
    
    metadata_json JSONB, -- { "measured_height": 45, "vhf_channels": [1, 5] }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE vault_item_type AS ENUM ('CALL_RECORDING', 'CALL_TRANSCRIPT', 'SMS_THREAD', 'ROUTE_REPLAY', 'PHOTOS', 'INCIDENT_REPORT');
CREATE TABLE IF NOT EXISTS proof_vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID, -- Link to HABE booking if exists
    type vault_item_type NOT NULL,
    storage_path TEXT NOT NULL,
    hash TEXT, -- Integrity Check
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⭐ C. TRUST TIERS & SCORING --
CREATE TABLE IF NOT EXISTS trust_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- 'Gold', 'Platinum'
    applies_to profile_type NOT NULL,
    min_score NUMERIC NOT NULL,
    benefits_json JSONB -- { "fee_discount": 0.02 }
);

CREATE TABLE IF NOT EXISTS trust_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES directory_profiles(id),
    role profile_type NOT NULL,
    score NUMERIC DEFAULT 50.0,
    components_json JSONB, -- { "cancel_rate": 0.01, "response_time": 120 }
    tier_id UUID REFERENCES trust_tiers(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 💳 D. PAYMENTS & DISPUTES (Stripe Connect) --
CREATE TYPE payment_status AS ENUM ('REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'PROCESSING', 'SUCCEEDED', 'CANCELED');
CREATE TYPE transfer_status AS ENUM ('PENDING', 'PAID', 'REVERSED');
CREATE TYPE dispute_status AS ENUM ('NONE', 'WARNING', 'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST');

CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    amount_total INTEGER NOT NULL, -- Cents
    currency TEXT DEFAULT 'usd',
    status payment_status DEFAULT 'REQUIRES_PAYMENT_METHOD',
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    stripe_transfer_id TEXT UNIQUE,
    destination_account_id TEXT NOT NULL, -- Stripe Connect Account ID
    amount INTEGER NOT NULL,
    status transfer_status DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_key TEXT UNIQUE NOT NULL, -- 'release_on_completion_24h'
    rules_json JSONB -- { "hold_duration_hours": 24 }
);

CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    stripe_dispute_id TEXT,
    status dispute_status DEFAULT 'NONE',
    reason TEXT,
    evidence_deadline TIMESTAMPTZ,
    resolution_at TIMESTAMPTZ,
    notes TEXT
);

-- RLS (Security Layer) --
ALTER TABLE directory_profiles ENABLE ROW LEVEL SECURITY;
-- Public can read verified profiles
CREATE POLICY "Public profiles are viewable" ON directory_profiles FOR SELECT USING (is_listed = true);
-- Users can edit own
-- (Requires auth.uid() matching user_id checking)

ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
-- Only Owner and Admin can see docs (Sensitive!)

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
-- Only participants in booking can see payments

-- Indexes --
CREATE INDEX idx_directory_profiles_location ON directory_profiles USING GIST (base_location);
CREATE INDEX idx_directory_locations_centroid ON directory_locations USING GIST (centroid);
CREATE INDEX idx_verification_documents_user ON verification_documents(user_id);
