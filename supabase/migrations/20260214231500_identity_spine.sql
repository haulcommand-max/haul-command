-- 🏗️ HAUL COMMAND OS: LAYER 1 - IDENTITY SPINE
-- The "Login Gravity". No transaction occurs without a verified ID.

-- 1. IDENTITIES (The Root Table)
-- Unifies all ecosystem participants: Operators, Brokers, Carriers, Permit Vendors, Utility, Traffic Control, Enterprise, Admin
-- Replaces/Wraps legacy 'users' or 'companies' concepts.
CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity Type Logic
    type TEXT NOT NULL CHECK (type IN ('operator', 'broker', 'carrier', 'permit_vendor', 'utility', 'traffic_control', 'enterprise', 'admin')),
    
    -- Identification
    display_name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT, -- EIN / SSN (Encrypted at app layer if needed, or stored in secure vault)
    
    -- Contact Logic
    email TEXT UNIQUE NOT NULL,
    phone TEXT, -- E.164
    website TEXT,
    
    -- Verification Tier (The "Checkmark")
    verification_tier TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_tier IN ('unverified', 'basic', 'verified', 'command_partner', 'enterprise_verified')),
    verified_at TIMESTAMPTZ,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending_approval')),
    
    -- Hall Command ID (Public Reference, e.g., 'HC-99281')
    public_id TEXT UNIQUE, 
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_identities_type ON identities(type);
CREATE INDEX idx_identities_public_id ON identities(public_id);


-- 2. IDENTITY ATTRIBUTES (Flexible Metadata)
-- Stores capabilities, tags, and region eligibility.
CREATE TABLE identity_attributes (
    identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    key TEXT NOT NULL, -- e.g., 'fleet_size', 'insurance_limit', 'home_base'
    value JSONB NOT NULL, -- Flexible storage
    PRIMARY KEY (identity_id, key)
);


-- 3. VERIFICATION LEDGER (The Compliance History)
-- tracks *why* they are verified.
CREATE TABLE verification_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES identities(id),
    
    verification_type TEXT NOT NULL, -- 'insurance', 'twic', 'dot_authority', 'id_card'
    document_url TEXT,
    expiry_date DATE,
    
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    reviewer_notes TEXT,
    reviewed_by UUID, -- Admin ID
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_expiry ON verification_ledger(expiry_date);
CREATE INDEX idx_verification_identity ON verification_ledger(identity_id);


-- 4. TRUST SCORE CACHE (Performance Snapshot)
-- The "Command Index" (Layer 5) writes to this table.
-- Layer 1 reads from it for fast access.
CREATE TABLE identity_trust_scores (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    
    total_score NUMERIC(5, 2) DEFAULT 0.00,
    
    -- Component Breakdowns
    safety_score NUMERIC(5, 2),
    payment_velocity_score NUMERIC(5, 2),
    reliability_score NUMERIC(5, 2),
    community_score NUMERIC(5, 2),
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    trend TEXT CHECK (trend IN ('up', 'down', 'stable'))
);


-- 5. ACCESS & ROLES (Internal Permissions)
-- Connects to Supabase Auth (auth.users)
CREATE TABLE identity_members (
    user_id UUID NOT NULL, -- Links to auth.users
    identity_id UUID REFERENCES identities(id),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'dispatch', 'finance', 'member')),
    
    PRIMARY KEY (user_id, identity_id)
);


-- 6. AUDIT LOG (The "Black Box")
-- Records critical state changes.
CREATE TABLE identity_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES identities(id),
    action TEXT NOT NULL, -- 'status_change', 'tier_upgrade', 'info_update'
    changed_from JSONB,
    changed_to JSONB,
    performed_by UUID,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Preliminary)
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_trust_scores ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies to be added in security hardening phase.
