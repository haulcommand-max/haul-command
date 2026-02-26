-- 🏗️ HAUL COMMAND OS: LAYER 4 - FINANCIAL GRAVITY (HALL PAY)
-- The "Money Gravity". Industry-specific payment rails.

-- 1. WALLETS (The Container)
-- Every Identity has a wallet.
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    
    currency TEXT DEFAULT 'USD',
    balance NUMERIC(12, 2) DEFAULT 0.00,
    frozen_holds NUMERIC(12, 2) DEFAULT 0.00, -- Amount locked in escrow
    
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'investigation')),
    
    stripe_connect_id TEXT, -- External payment processor ID
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_identity ON wallets(identity_id);


-- 2. TRANSACTIONS (The Ledger)
-- Immutable record of all money movement.
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    wallet_id UUID REFERENCES wallets(id),
    
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment_in', 'payout_out', 'escrow_lock', 'escrow_release', 'fee', 'refund')),
    
    amount NUMERIC(12, 2) NOT NULL,
    fee_amount NUMERIC(12, 2) DEFAULT 0.00,
    
    related_entity_type TEXT, -- 'load', 'escort_job', 'permit_order'
    related_entity_id UUID,
    
    description TEXT,
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    external_reference_id TEXT, -- Stripe Charge ID
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);


-- 3. ESCROW VAULTS (The Trust Layer)
-- Holds funds until job completion triggers release.
CREATE TABLE escrow_vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    job_id UUID, -- Link to the job being paid for
    payer_wallet_id UUID REFERENCES wallets(id),
    payee_wallet_id UUID REFERENCES wallets(id),
    
    amount_locked NUMERIC(12, 2) NOT NULL,
    
    release_condition_type TEXT NOT NULL CHECK (release_condition_type IN ('manual_approval', 'gps_verification', 'pod_upload', 'admin_override')),
    release_condition_data JSONB, -- { "geofence_id": "..." }
    
    status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'disputed', 'refunded')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ
);


-- 4. PAYOUT METHODS (Getting Paid)
-- specific banking info (tokenized/secure).
CREATE TABLE payout_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('ach', 'wire', 'rtp', 'check')),
    
    is_primary BOOLEAN DEFAULT false,
    
    -- Sensitive data handled via Stripe/External provider usually, 
    -- storing only references here.
    external_method_id TEXT, 
    
    last_4 TEXT,
    bank_name TEXT,
    
    status TEXT NOT NULL DEFAULT 'active'
);


-- 5. DISPUTES (Conflict Resolution)
-- Formal process for locking funds.
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    escrow_vault_id UUID REFERENCES escrow_vaults(id),
    
    initiator_identity_id UUID REFERENCES identities(id),
    
    reason TEXT NOT NULL CHECK (reason IN ('service_not_rendered', 'damaged_freight', 'late_arrival', 'unauthorized_charge')),
    description TEXT,
    evidence_urls JSONB, -- ["img1.jpg", "pdf1.pdf"]
    
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved_payer_win', 'resolved_payee_win', 'split')),
    
    resolution_notes TEXT,
    resolved_by UUID, -- Admin ID
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Note: Financial data requires strict RLS (User can only see own wallet).
