-- 🏗️ HAUL COMMAND OS: STRATEGIC INTELLIGENCE LAYER (v2.0)
-- "The 10X Expansion Engine" & "Hall Command Intelligence (HCI)"

-- 1. VERTICALS CONFIGURATION
CREATE TYPE vertical_type AS ENUM ('standard_oversize', 'wind_energy', 'utility_power', 'cranes', 'military', 'ports_drayage');

CREATE TABLE vertical_profiles (
    vertical vertical_type PRIMARY KEY,
    avg_ticket_size TEXT CHECK (avg_ticket_size IN ('low', 'medium', 'high', 'very_high')),
    complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 10),
    seasonality_type TEXT,
    margin_target NUMERIC(4, 2) DEFAULT 0.20,
    barrier_to_entry_score INTEGER DEFAULT 5
);

INSERT INTO vertical_profiles (vertical, avg_ticket_size, complexity_score, seasonality_type, margin_target, barrier_to_entry_score) VALUES
('wind_energy', 'very_high', 9, 'project_based', 0.30, 9),
('utility_power', 'high', 7, 'storm_driven', 0.28, 8),
('cranes', 'medium', 5, 'steady_local', 0.22, 6),
('military', 'very_high', 10, 'contract_cycle', 0.35, 10),
('ports_drayage', 'low', 4, 'constant', 0.15, 3),
('standard_oversize', 'medium', 3, 'seasonal', 0.18, 2);


-- 2. LANE PROFITABILITY ENGINE
CREATE TABLE lane_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_state TEXT NOT NULL,
    destination_state TEXT NOT NULL,
    vertical vertical_type NOT NULL,
    avg_margin_pct NUMERIC(4,2),
    job_frequency_30d INTEGER,
    avg_final_price NUMERIC(10, 2),
    cancellation_rate NUMERIC(4, 2),
    profitability_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        (COALESCE(avg_margin_pct, 0) * 100 * 0.4) + 
        (LEAST(COALESCE(job_frequency_30d, 0), 100) * 0.3) + 
        (LEAST(COALESCE(avg_final_price, 0) / 1000, 100) * 0.2) - 
        (COALESCE(cancellation_rate, 0) * 100 * 0.1)
    ) STORED,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_state, destination_state, vertical)
);
CREATE INDEX idx_lane_score ON lane_metrics(profitability_score DESC);


-- 3. HCI: MARKET SIGNAL ENGINE
-- "Texas wind corridor entering surge phase — deploy operator recruitment + ad budget."
CREATE TABLE market_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_type TEXT NOT NULL, -- 'surge_demand', 'risk_cluster', 'compliance_drift'
    region_code TEXT, -- State or Corridor ID
    vertical vertical_type,
    
    severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
    trend_direction TEXT CHECK (trend_direction IN ('rising', 'stable', 'falling')),
    
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 4. HCI: REVENUE OPTIMIZATION (The Flywheel)
-- Tracks the performance of the 20 streams
CREATE TABLE revenue_flywheel_metrics (
    stream_name TEXT PRIMARY KEY, -- 'escort_dispatch', 'permit_processing', 'hall_pay'
    
    -- Flywheel Health
    trust_score_contribution NUMERIC(5,2), -- How much this stream boosts Trust Scores
    data_velocity_score INTEGER, -- How much data it feeds back
    
    -- Financials
    active_users_30d INTEGER,
    revenue_30d NUMERIC(15, 2),
    growth_rate_pct NUMERIC(5, 2),
    
    -- Strategic Actions
    recommended_action TEXT, -- 'boost_ads', 'fix_ux', 'upsell_permits'
    
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. DYNAMIC AD BUDGET ALLOCATION
CREATE TABLE state_ad_budgets (
    state_code TEXT PRIMARY KEY,
    current_surge_score NUMERIC(5,2) DEFAULT 0,
    top_lane_score NUMERIC(5,2) DEFAULT 0,
    allocation_weight NUMERIC(5, 2) GENERATED ALWAYS AS (
        (current_surge_score * 0.5) +
        (top_lane_score * 0.3) +
        (20.0 * 0.2)
    ) STORED,
    recommended_budget_share NUMERIC(5, 4),
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. SOCIAL CONTENT GENERATOR
CREATE TABLE social_content_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type TEXT CHECK (trigger_type IN ('surge_detected', 'new_regulation', 'severe_weather')),
    target_state TEXT,
    target_vertical vertical_type,
    data_payload JSONB,
    generated_text TEXT,
    platform TEXT DEFAULT 'facebook_group',
    status TEXT CHECK (status IN ('queued', 'generated', 'approved', 'posted', 'failed')),
    scheduled_for TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AFFILIATE OPTIMIZER (Retained)
CREATE TABLE affiliate_payout_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_margin_pct NUMERIC(4,2) NOT NULL,
    max_margin_pct NUMERIC(4,2),
    payout_pct NUMERIC(4,2) NOT NULL,
    vertical vertical_type,
    is_active BOOLEAN DEFAULT true
);
