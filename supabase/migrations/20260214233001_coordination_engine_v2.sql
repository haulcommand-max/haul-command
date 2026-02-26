-- 🏗️ HAUL COMMAND OS: COORDINATION CONTROL CENTER (v2.0)
-- Added: Pricing Module (Flat Tiers, Rush Surcharges, Hybrid Logic)

-- 1. POLICE AGENCY DIRECTORY (The Authority Map)
CREATE TABLE police_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('state', 'county', 'municipal')),
    state_code TEXT NOT NULL,
    county TEXT,
    city TEXT,
    phone_primary TEXT,
    email_permits TEXT,
    portal_url TEXT,
    lead_time_hours INTEGER DEFAULT 48,
    escort_rate_hourly NUMERIC(10, 2),
    min_hours INTEGER DEFAULT 4,
    admin_fee NUMERIC(10, 2) DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    last_confirmed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_police_geo ON police_agencies(state_code, county, city);

-- 2. UTILITY PROVIDER VERTICAL
CREATE TABLE utility_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    service_area_states TEXT[],
    has_bucket_truck BOOLEAN DEFAULT true,
    max_height_feet INTEGER,
    is_line_crew BOOLEAN DEFAULT false,
    response_rating NUMERIC(3, 1) DEFAULT 5.0,
    verified BOOLEAN DEFAULT false,
    contacts_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COORDINATION FEE RULES (The Pricing Brain)
-- "Transparent, Defensible, Scalable"
CREATE TABLE coordination_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL, -- "Standard Interstate", "Urban Complex", "Superload"
    
    -- Triggers
    min_complexity_score INTEGER DEFAULT 0,
    max_complexity_score INTEGER,
    
    -- Fee Structure
    fee_type TEXT CHECK (fee_type IN ('flat', 'hybrid')),
    base_fee NUMERIC(10, 2) NOT NULL,
    hybrid_threshold NUMERIC(10, 2), -- If total package > X
    hybrid_percent NUMERIC(4, 2), -- Add Y%
    
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Fee Tiers (Model 1: Flat Tiers)
INSERT INTO coordination_fee_rules (rule_name, min_complexity_score, max_complexity_score, fee_type, base_fee) VALUES
('Low Complexity', 0, 2, 'flat', 350.00),   -- $250-400 range
('Medium Complexity', 3, 5, 'flat', 600.00), -- $400-750 range
('High Complexity', 6, 8, 'flat', 950.00),   -- $750-1250 range
('Superload / Critical', 9, 99, 'flat', 1500.00); -- $1250+ range

-- 4. COORDINATION TICKETS (Workflow + Financials)
CREATE TABLE coordination_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    coordination_type TEXT NOT NULL CHECK (coordination_type IN ('police', 'utility', 'route_survey')),
    target_agency_id UUID REFERENCES police_agencies(id),
    target_provider_id UUID REFERENCES utility_providers(id),
    status TEXT NOT NULL CHECK (status IN ('packet_needed', 'sent', 'awaiting_confirmation', 'confirmed', 'denied', 'escalated')),
    
    -- Financials (The "Clean Model")
    agency_invoice_amount NUMERIC(10, 2), -- Pass-through
    coordination_fee NUMERIC(10, 2), -- Platform Revenue
    rush_surcharge NUMERIC(10, 2) DEFAULT 0,
    total_billable NUMERIC(10, 2) GENERATED ALWAYS AS (COALESCE(agency_invoice_amount, 0) + COALESCE(coordination_fee, 0) + COALESCE(rush_surcharge, 0)) STORED,
    
    -- Complexity Factors
    complexity_score INTEGER DEFAULT 1,
    is_rush BOOLEAN DEFAULT false,
    rush_reason TEXT, -- "<12h", "weekend"
    
    -- Workflow Data
    packet_sent_at TIMESTAMPTZ,
    confirmation_received_at TIMESTAMPTZ,
    assigned_officer_name TEXT,
    officer_contact TEXT,
    trigger_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tickets_job ON coordination_tickets(job_id);
CREATE INDEX idx_tickets_status ON coordination_tickets(status);

-- 5. SURCHARGE CALCULATOR FUNCTION
CREATE OR REPLACE FUNCTION calculate_rush_surcharge(hours_notice INT, is_weekend BOOLEAN) 
RETURNS NUMERIC AS $$
BEGIN
    IF is_weekend THEN RETURN 500.00; END IF;
    IF hours_notice < 6 THEN RETURN 500.00; END IF;
    IF hours_notice < 12 THEN RETURN 350.00; END IF;
    RETURN 0.00;
END;
$$ LANGUAGE plpgsql;

-- 6. LOGS
CREATE TABLE coordination_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES coordination_tickets(id),
    action TEXT NOT NULL,
    details JSONB,
    performed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
