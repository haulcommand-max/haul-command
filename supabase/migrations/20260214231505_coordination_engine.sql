-- 🏗️ HAUL COMMAND OS: COORDINATION CONTROL CENTER
-- "The Infrastructure Authority Layer"

-- 1. POLICE AGENCY DIRECTORY (The Authority Map)
CREATE TABLE police_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- "Georgia State Patrol", "City of Atlanta PD"
    jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('state', 'county', 'municipal')),
    state_code TEXT NOT NULL,
    county TEXT,
    city TEXT,
    
    -- Contact Methods
    phone_primary TEXT,
    email_permits TEXT,
    portal_url TEXT,
    
    -- Operational Rules
    lead_time_hours INTEGER DEFAULT 48,
    escort_rate_hourly NUMERIC(10, 2),
    min_hours INTEGER DEFAULT 4,
    admin_fee NUMERIC(10, 2) DEFAULT 0,
    
    -- Metadata
    verified BOOLEAN DEFAULT false,
    last_confirmed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_police_geo ON police_agencies(state_code, county, city);


-- 2. UTILITY PROVIDER VERTICAL (Bucket Trucks / High Pole)
-- Treated as a specialized service provider vertical
CREATE TABLE utility_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    service_area_states TEXT[], -- Array of state codes
    
    -- Capabilities
    has_bucket_truck BOOLEAN DEFAULT true,
    max_height_feet INTEGER,
    is_line_crew BOOLEAN DEFAULT false, -- Certified to lift lines?
    
    -- Performance
    response_rating NUMERIC(3, 1) DEFAULT 5.0,
    verified BOOLEAN DEFAULT false,
    
    contacts_json JSONB, -- { "dispatch": "...", "billing": "..." }
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. COORDINATION TICKETS (The Workflow Engine)
-- Tracks the lifecycle of a coordination request from "Trigger" to "Confirmed"
CREATE TABLE coordination_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID, -- Link to the Lead/Job
    
    -- Classification
    coordination_type TEXT NOT NULL CHECK (coordination_type IN ('police', 'utility', 'route_survey')),
    target_agency_id UUID REFERENCES police_agencies(id),
    target_provider_id UUID REFERENCES utility_providers(id),
    
    -- Status Definitions
    -- packet_needed: System triggered, waiting for doc assembly
    -- sent: Packet emailed/faxed
    -- awaiting_confirmation: Follow-up needed
    -- confirmed: Green light
    -- escalated: Human intervention required
    status TEXT NOT NULL CHECK (status IN ('packet_needed', 'sent', 'awaiting_confirmation', 'confirmed', 'denied', 'escalated')),
    
    -- Workflow Data
    packet_sent_at TIMESTAMPTZ,
    confirmation_received_at TIMESTAMPTZ,
    assigned_officer_name TEXT,
    officer_contact TEXT,
    
    -- Trigger Reason (Why was this ticket created?)
    trigger_reason TEXT, -- "Width > 17ft", "Permit Condition", "Urban Corridor"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_job ON coordination_tickets(job_id);
CREATE INDEX idx_tickets_status ON coordination_tickets(status);


-- 4. LOGS & AUDIT (The Paper Trail)
CREATE TABLE coordination_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES coordination_tickets(id),
    action TEXT NOT NULL, -- "packet_sent", "reminder_sms", "officer_assigned"
    details JSONB,
    performed_by UUID, -- System or User
    created_at TIMESTAMPTZ DEFAULT NOW()
);
