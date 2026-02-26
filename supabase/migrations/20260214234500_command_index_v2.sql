-- 🏗️ HAUL COMMAND OS: COMMAND INDEX LAYER (v2.0)
-- "The Trust Score & Leaderboard Engine"

-- 1. TRUST SCORE LEDGER (The 6-Factor Model)
-- 0-1000 Scale. Hard to fake. Expensive to manipulate.
CREATE TABLE trust_scores (
    company_id UUID PRIMARY KEY REFERENCES companies(id),
    
    -- 1. Performance Index (30%)
    -- On-time %, Verified Jobs, Complexity Weight, Repeat Rate
    performance_points INTEGER DEFAULT 0,
    performance_score NUMERIC(5, 2) GENERATED ALWAYS AS (LEAST(performance_points, 300)) STORED,
    
    -- 2. Safety Index (25%)
    -- Incident Rate, Citations, Claims, Route Deviations
    -- Starts at 250, deductions for incidents
    safety_points INTEGER DEFAULT 250,
    safety_score NUMERIC(5, 2) GENERATED ALWAYS AS (GREATEST(LEAST(safety_points, 250), 0)) STORED,
    
    -- 3. Compliance Index (15%)
    -- Permit Matches, Doc Completeness, Cross-Border Adherence
    compliance_points INTEGER DEFAULT 0,
    compliance_score NUMERIC(5, 2) GENERATED ALWAYS AS (LEAST(compliance_points, 150)) STORED,
    
    -- 4. Financial Reliability Index (15%)
    -- Hall Pay Adoption %, Dispute Ratio, Refund Freq
    financial_points INTEGER DEFAULT 0,
    financial_score NUMERIC(5, 2) GENERATED ALWAYS AS (LEAST(financial_points, 150)) STORED,
    
    -- 5. Longevity Index (10%)
    -- Active Fiscal Years (Logarithmic Scale)
    longevity_points INTEGER DEFAULT 0,
    longevity_score NUMERIC(5, 2) GENERATED ALWAYS AS (LEAST(longevity_points, 100)) STORED,
    
    -- 6. Influence Index (5%)
    -- Reviews, Referrals, Certification Contribs
    influence_points INTEGER DEFAULT 0,
    influence_score NUMERIC(5, 2) GENERATED ALWAYS AS (LEAST(influence_points, 50)) STORED,
    
    -- THE COMPOSITE SCORE (0-1000)
    total_trust_score INTEGER GENERATED ALWAYS AS (
        performance_score + safety_score + compliance_score + 
        financial_score + longevity_score + influence_score
    ) STORED,
    
    current_rank_tier TEXT, -- 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Apex'
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_score_rank ON trust_scores(total_trust_score DESC);


-- 2. POINTS LEDGER (Audit Trail)
-- Every point change is recorded here. No black box.
CREATE TABLE trust_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    event_type TEXT NOT NULL, -- 'job_completed', 'incident_report', 'hall_pay_milestone'
    category TEXT CHECK (category IN ('performance', 'safety', 'compliance', 'financial', 'longevity', 'influence')),
    points_delta INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- Job ID, Incident ID, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. LEADERBOARDS (Gamification)
-- Pre-calculated views for speed
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type TEXT CHECK (period_type IN ('lifetime', 'fiscal_year', 'quarterly', 'monthly')),
    period_label TEXT, -- 'FY2026', 'Q3-2026'
    
    vertical vertical_type, -- Optional filter (e.g. 'Wind Energy Leaderboard')
    market_id UUID, -- Optional geo filter
    
    company_id UUID REFERENCES companies(id),
    rank_position INTEGER,
    score_snapshot INTEGER,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_query ON leaderboards(period_type, vertical, rank_position);


-- 4. TIER DEFINITIONS (The Ladder)
CREATE TABLE rank_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL UNIQUE, -- 'Apex'
    min_score INTEGER NOT NULL,
    benefits_json JSONB, -- { "fee_discount": 0.02, "early_access": true }
    max_slots INTEGER -- Scarcity Management (e.g., only 50 Apex per region)
);

INSERT INTO rank_tiers (tier_name, min_score, max_slots) VALUES
('Iron', 0, NULL),
('Bronze', 300, NULL),
('Silver', 500, NULL),
('Gold', 700, NULL),
('Platinum', 850, NULL),
('Apex', 950, 50); -- Strategic Scarcity
