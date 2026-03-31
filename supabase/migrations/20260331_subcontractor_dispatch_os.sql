-- Haul Command Subcontractor & Dispatch OS Schema
-- Extracted from Freedom Pilot operational network audit
-- Converts manual ACORD/W-9 ingestion into machine-readable vendor orchestration.

-- 1. Operator/Company Foundational Entities
CREATE TABLE hc_operator_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id), -- Owner of the company account
    company_name VARCHAR(255) NOT NULL,
    tax_identifier VARCHAR(100), -- US EIN, UK UTR, AU ABN
    billing_address JSONB,
    trust_score INT DEFAULT 50, -- Starting neutral Trust Score (out of 100)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Digital Credential Wallet (The "ACORD / W-9 Tracker")
CREATE TABLE hc_credential_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES hc_operator_companies(id),
    document_type VARCHAR(100) CHECK (document_type IN ('auto_insurance', 'general_liability', 'w9_w8ben', 'state_certification', 'port_access')),
    document_url VARCHAR(1024) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending_review' CHECK (verification_status IN ('pending_review', 'verified', 'expired', 'rejected')),
    expiration_date DATE,
    metadata JSONB, -- E.g. {"liability_limit": 1000000, "acord_holder_named": true}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Capability Bidding Profile (The "Join Us Intake")
CREATE TABLE hc_operator_capabilities (
    company_id UUID REFERENCES hc_operator_companies(id),
    universal_capability hc_escort_capability, -- Enum created in previous global seed
    is_active BOOLEAN DEFAULT TRUE,
    jurisdiction_restrictions UUID[], -- If empty, means global. Array limits this capability to specific regions.
    PRIMARY KEY (company_id, universal_capability)
);

-- 4. Unified Dispatch Workflow (The "Request a Pilot Car + Permit Integration")
CREATE TABLE hc_dispatch_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id), -- The Broker/Carrier
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'searching', 'assigned', 'in_transit', 'completed', 'disputed')),
    route_origin JSONB NOT NULL,
    route_destination JSONB NOT NULL,
    load_dimensions JSONB, -- {width, height, length, weight, format}
    required_capabilities hc_escort_capability[], -- Driven by the Requirement Calculator
    budget_target DECIMAL(10, 2),
    assigned_company_id UUID REFERENCES hc_operator_companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Violation Ledger (The "Vendor Agreement" enforcement layer)
-- Tracks double-brokering, no-shows, and late paperwork.
CREATE TABLE hc_vendor_compliance_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES hc_operator_companies(id),
    dispatch_id UUID REFERENCES hc_dispatch_requests(id),
    violation_code VARCHAR(50) CHECK (violation_code IN ('no_show', 'direct_payment_solicitation', 'expired_credentials_during_trip', 'late_arrival', 'no_insurance_certificate_holder')),
    severity INT CHECK (severity BETWEEN 1 AND 5),
    deduction_amount DECIMAL(10, 2),
    resolved_at TIMESTAMPTZ
);

-- RLS Boilerplate (Security)
ALTER TABLE hc_credential_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies can view and upload their own wallets" 
    ON hc_credential_wallets FOR ALL 
    USING (company_id IN (SELECT id FROM hc_operator_companies WHERE user_id = auth.uid()));

-- Triggers for Expiration Alerts
CREATE OR REPLACE FUNCTION trigger_wallet_expiration_alert() RETURNS trigger AS $$
BEGIN
    -- If an insurance policy is marked expired, drop the trust score by 20 points
    IF NEW.verification_status = 'expired' AND OLD.verification_status = 'verified' THEN
        UPDATE hc_operator_companies SET trust_score = GREATEST(trust_score - 20, 0) WHERE id = NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trust_on_expiration
    AFTER UPDATE ON hc_credential_wallets
    FOR EACH ROW EXECUTE FUNCTION trigger_wallet_expiration_alert();
