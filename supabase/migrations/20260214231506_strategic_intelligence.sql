-- 🏗️ HAUL COMMAND OS: STRATEGIC INTELLIGENCE LAYER
-- "The 10X Expansion Engine"

-- 1. VERTICALS CONFIGURATION
-- Defines the high-value pillars of the expansion strategy.
CREATE TYPE vertical_type AS ENUM ('standard_oversize', 'wind_energy', 'utility_power', 'cranes', 'military', 'ports_drayage');

CREATE TABLE vertical_profiles (
    vertical vertical_type PRIMARY KEY,
    avg_ticket_size TEXT CHECK (avg_ticket_size IN ('low', 'medium', 'high', 'very_high')),
    complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 10),
    seasonality_type TEXT, -- 'project_based', 'storm_driven', 'steady'
    margin_target NUMERIC(4, 2) DEFAULT 0.20,
    barrier_to_entry_score INTEGER DEFAULT 5
);

-- Seed Verticals
INSERT INTO vertical_profiles (vertical, avg_ticket_size, complexity_score, seasonality_type, margin_target, barrier_to_entry_score) VALUES
('wind_energy', 'very_high', 9, 'project_based', 0.30, 9),
('utility_power', 'high', 7, 'storm_driven', 0.28, 8),
('cranes', 'medium', 5, 'steady_local', 0.22, 6),
('military', 'very_high', 10, 'contract_cycle', 0.35, 10),
('ports_drayage', 'low', 4, 'constant', 0.15, 3),
('standard_oversize', 'medium', 3, 'seasonal', 0.18, 2);


-- 2. LANE PROFITABILITY ENGINE
-- "Where do we focus?"
CREATE TABLE lane_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_state TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    vertical vertical_type NOT NULL,
    
    -- Performance Data (Updated Daily/Weekly via Cron)
    avg_margin_pct NUMERIC(4,2),
    job_frequency_30d INTEGER,
    avg_final_price NUMERIC(10, 2),
    cancellation_rate NUMERIC(4, 2),
    
    -- Calculated Score
    profitability_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        (COALESCE(avg_margin_pct, 0) * 100 * 0.4) + 
        (LEAST(COALESCE(job_frequency_30d, 0), 100) * 0.3) + -- Normalized cap at 100 jobs
        (LEAST(COALESCE(avg_final_price, 0) / 1000, 100) * 0.2) - -- Normalized price factor
        (COALESCE(cancellation_rate, 0) * 100 * 0.1)
    ) STORED,
    
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_state, destination_state, vertical)
);

CREATE INDEX idx_lane_score ON lane_metrics(profitability_score DESC);


-- 3. AFFILIATE OPTIMIZER
-- "Pay for quality, not just clicks."
CREATE TABLE affiliate_payout_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_margin_pct NUMERIC(4,2) NOT NULL,
    max_margin_pct NUMERIC(4,2), -- NULL means infinity
    payout_pct NUMERIC(4,2) NOT NULL, -- e.g., 0.15 for 15%
    vertical vertical_type, -- Optional override
    is_active BOOLEAN DEFAULT true
);

-- Seed logic: >30% margin gets 15%, 20-30% gets 10-12%, <18% gets 5-8%
INSERT INTO affiliate_payout_rules (min_margin_pct, max_margin_pct, payout_pct) VALUES
(0.30, NULL, 0.15),
(0.20, 0.29, 0.12),
(0.00, 0.19, 0.08);

CREATE TABLE affiliate_performance (
    affiliate_id UUID PRIMARY KEY, -- Links to users/partners
    total_jobs_30d INTEGER DEFAULT 0,
    volume_bonus_active BOOLEAN DEFAULT false, -- +2% if > 5 jobs
    current_tier_payout NUMERIC(4,2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. DYNAMIC AD BUDGET ALLOCATION
-- "Fuel the fire, starve the cold."
CREATE TABLE state_ad_budgets (
    state_code TEXT PRIMARY KEY,
    
    -- Inputs (from other tables)
    current_surge_score NUMERIC(5,2) DEFAULT 0, -- From surge_metrics
    top_lane_score NUMERIC(5,2) DEFAULT 0, -- Max lane score originating here
    
    -- Calculated Weight
    allocation_weight NUMERIC(5, 2) GENERATED ALWAYS AS (
        (current_surge_score * 0.5) +
        (top_lane_score * 0.3) +
        (20.0 * 0.2) -- Baseline factor
    ) STORED,
    
    recommended_budget_share NUMERIC(5, 4), -- % of total budget
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. SOCIAL CONTENT GENERATOR (Auto-Facebook)
-- "The Narrative Machine"
CREATE TABLE social_content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trigger Context
    trigger_type TEXT CHECK (trigger_type IN ('surge_detected', 'new_regulation', 'severe_weather')),
    target_state TEXT,
    target_vertical vertical_type,
    data_payload JSONB, -- { "demand_increase": "38%", "avg_rate": "$2.45" }
    
    -- Generated Content
    generated_text TEXT, -- The draft post
    platform TEXT DEFAULT 'facebook_group',
    
    -- Lifecycle
    status TEXT CHECK (status IN ('queued', 'generated', 'approved', 'posted', 'failed')),
    scheduled_for TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to queue content on surge (Conceptual trigger)
CREATE OR REPLACE FUNCTION trigger_content_on_surge()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.surge_detected = true AND OLD.surge_detected = false THEN
        INSERT INTO social_content_queue (trigger_type, target_state, status, data_payload)
        VALUES ('surge_detected', NEW.state_code, 'queued', jsonb_build_object('level', NEW.surge_level));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
