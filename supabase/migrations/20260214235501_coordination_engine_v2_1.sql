-- 🏗️ HAUL COMMAND OS: COORDINATION CONTROL CENTER (v2.1)
-- Added: Margin Protection System & Pricing Guardrails

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

-- 3. PRICING GUARDRAILS (The Margin Protection System)
-- "So You Never Underprice Again"
CREATE TABLE pricing_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key TEXT NOT NULL UNIQUE, -- e.g. 'min_job_floor', 'short_notice_12h'
    value_numeric NUMERIC(10, 2),
    value_percent NUMERIC(5, 4), -- 1.15 for +15%
    description TEXT,
    is_hard_lock BOOLEAN DEFAULT true, -- "No Exceptions"
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pricing_guardrails (rule_key, value_numeric, value_percent, description, is_hard_lock) VALUES
('min_job_floor', 500.00, NULL, 'Guardrail 1: Minimum Invoice Total', true),
('complexity_multiplier', NULL, 1.15, 'Guardrail 2: Width>14ft, Multi-state, Urban, Night, Superload', true),
('short_notice_24h', NULL, 1.15, 'Guardrail 3: <24h Booking Window (+15%)', true),
('short_notice_12h', NULL, 1.25, 'Guardrail 3: <12h Booking Window (+25%)', true),
('margin_floor_pct', NULL, 0.15, 'Guardrail 4: Min Margin % Alert Threshold', false),
('deadhead_mile_threshold', 40.00, NULL, 'Guardrail 5: Miles before repositioning fee kicks in', true);


-- 4. COORDINATION FEE RULES (Base Pricing)
CREATE TABLE coordination_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    min_complexity_score INTEGER DEFAULT 0,
    max_complexity_score INTEGER,
    fee_type TEXT CHECK (fee_type IN ('flat', 'hybrid')),
    base_fee NUMERIC(10, 2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO coordination_fee_rules (rule_name, min_complexity_score, max_complexity_score, fee_type, base_fee) VALUES
('Low Complexity', 0, 2, 'flat', 350.00),
('Medium Complexity', 3, 5, 'flat', 600.00),
('High Complexity', 6, 8, 'flat', 950.00),
('Superload / Critical', 9, 99, 'flat', 1500.00);


-- 5. COORDINATION TICKETS (Workflow + Financials)
CREATE TABLE coordination_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID,
    coordination_type TEXT NOT NULL CHECK (coordination_type IN ('police', 'utility', 'route_survey')),
    target_agency_id UUID REFERENCES police_agencies(id),
    target_provider_id UUID REFERENCES utility_providers(id),
    status TEXT NOT NULL CHECK (status IN ('packet_needed', 'sent', 'awaiting_confirmation', 'confirmed', 'denied', 'escalated')),
    
    -- Inputs for Logic
    width_feet NUMERIC(4,1),
    is_multi_state BOOLEAN,
    is_urban BOOLEAN,
    is_night_move BOOLEAN,
    is_superload BOOLEAN,
    booking_notice_hours INTEGER,
    
    -- Financials (Calculated via Guardrails)
    agency_invoice_amount NUMERIC(10, 2), -- Pass-through cost
    
    base_coordination_fee NUMERIC(10, 2), -- From fee_rules
    applied_multiplier NUMERIC(4, 2) DEFAULT 1.0, -- Complexity/Rush
    
    final_service_fee NUMERIC(10, 2) GENERATED ALWAYS AS (base_coordination_fee * applied_multiplier) STORED,
    
    total_billable NUMERIC(10, 2) GENERATED ALWAYS AS (
        GREATEST(
            COALESCE(agency_invoice_amount, 0) + (COALESCE(base_coordination_fee, 0) * COALESCE(applied_multiplier, 1.0)),
            500.00 -- Guardrail 1: Hard floor (can be dynamic via trigger later, hardcoded for safety now)
        )
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_job ON coordination_tickets(job_id);
CREATE INDEX idx_tickets_status ON coordination_tickets(status);

-- 6. PRICING LOGIC FUNCTION
-- Call this trigger/function on insert/update of ticket attributes
CREATE OR REPLACE FUNCTION calculate_ticket_pricing() 
RETURNS TRIGGER AS $$
DECLARE
    v_complexity_mult NUMERIC := 1.0;
    v_rush_mult NUMERIC := 1.0;
BEGIN
    -- Guardrail 2: Complexity
    IF NEW.width_feet > 14 OR NEW.is_multi_state OR NEW.is_urban OR NEW.is_night_move OR NEW.is_superload THEN
        v_complexity_mult := 1.15;
    END IF;

    -- Guardrail 3: Short Notice
    IF NEW.booking_notice_hours < 12 THEN
        v_rush_mult := 1.25;
    ELSIF NEW.booking_notice_hours < 24 THEN
        v_rush_mult := 1.15;
    END IF;

    -- Apply highest multiplier logic or compounded? 
    -- User said "Minimum multiplier = 1.15". Usually stackable or max. 
    -- Let's stack them for safety (Margin Protection).
    NEW.applied_multiplier := v_complexity_mult * v_rush_mult;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_pricing_guardrails
BEFORE INSERT OR UPDATE ON coordination_tickets
FOR EACH ROW EXECUTE FUNCTION calculate_ticket_pricing();
