-- 🏗️ HAUL COMMAND OS: COMMAND INDEX LAYER (v2.1)
-- "The Trust Score & Leaderboard Engine"
-- UPDATED: Exact Mathematical Breakdown (User Blueprint)

-- 1. TRUST SCORE LEDGER (The 6-Factor Model)
-- 0-1000 Scale. Hard to fake. Expensive to manipulate.

CREATE TABLE trust_scores (
    company_id UUID PRIMARY KEY REFERENCES companies(id),
    
    -- ==========================================
    -- 1. PERFORMANCE INDEX (30%)
    -- Formula: 300 * (0.4*OT + 0.3*JobFactor + 0.2*Complexity + 0.1*Repeat)
    -- ==========================================
    metric_on_time_rate NUMERIC(4,3) DEFAULT 1.0, -- (OT) 0.0 to 1.0
    metric_verified_jobs INTEGER DEFAULT 0, -- (VJ)
    metric_complexity_avg NUMERIC(4,2) DEFAULT 1.0, -- (CJ)
    metric_repeat_rate NUMERIC(4,3) DEFAULT 0.0, -- (RR) 0.0 to 1.0
    
    -- Calculation Logic
    performance_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        LEAST(300, 
            300 * (
                (0.40 * metric_on_time_rate) +
                (0.30 * (LN(GREATEST(1, 1 + metric_verified_jobs)) / LN(2001))) + -- Logarithmic Job Factor
                (0.20 * (LEAST(metric_complexity_avg, 10) / 10.0)) + -- Normalized Complexity
                (0.10 * metric_repeat_rate)
            )
        )
    ) STORED,

    -- ==========================================
    -- 2. SAFETY INDEX (25%)
    -- Formula: 250 * ExpPenalty(Incidents) * ExpPenalty(Citations) * MajorPenalty
    -- ==========================================
    metric_incident_rate NUMERIC(5,2) DEFAULT 0, -- (IR) per 100 jobs
    metric_citation_rate NUMERIC(5,2) DEFAULT 0, -- (CR)
    metric_major_accident BOOLEAN DEFAULT false, -- (MA)
    
    safety_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        LEAST(250,
            250 * 
            EXP(-0.5 * metric_incident_rate) * -- Exponential decay
            EXP(-0.3 * metric_citation_rate) * 
            (CASE WHEN metric_major_accident THEN 0.5 ELSE 1.0 END)
        )
    ) STORED,

    -- ==========================================
    -- 3. COMPLIANCE INDEX (15%)
    -- Formula: 150 * (0.5*PermitMatch + 0.3*DocRate + 0.2*CrossBorder)
    -- ==========================================
    metric_permit_match_rate NUMERIC(4,3) DEFAULT 1.0, -- (PM)
    metric_doc_submission_rate NUMERIC(4,3) DEFAULT 1.0, -- (DR)
    metric_cross_border_compliance NUMERIC(4,3) DEFAULT 1.0, -- (CB)
    
    compliance_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        LEAST(150,
            150 * (
                (0.5 * metric_permit_match_rate) +
                (0.3 * metric_doc_submission_rate) +
                (0.2 * metric_cross_border_compliance)
            )
        )
    ) STORED,

    -- ==========================================
    -- 4. FINANCIAL RELIABILITY INDEX (15%)
    -- Formula: 150 * HallPay% * DisputePenalty * RefundPenalty
    -- ==========================================
    metric_hall_pay_adoption NUMERIC(4,3) DEFAULT 0.0, -- (HP)
    metric_dispute_ratio NUMERIC(5,2) DEFAULT 0.0, -- (DRR)
    metric_refund_freq NUMERIC(5,2) DEFAULT 0.0, -- (RF)
    
    financial_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        LEAST(150,
            150 * 
            metric_hall_pay_adoption *
            EXP(-2.0 * metric_dispute_ratio) *
            EXP(-1.0 * metric_refund_freq)
        )
    ) STORED,

    -- ==========================================
    -- 5. LONGEVITY INDEX (10%)
    -- Formula: 100 * LogGrowth(Years)
    -- ==========================================
    metric_active_years NUMERIC(4,2) DEFAULT 0.0, -- (Y)
    
    longevity_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        LEAST(100,
            100 * (LN(GREATEST(1, 1 + metric_active_years)) / LN(26)) -- Maxes at 25 years (log base)
        )
    ) STORED,

    -- ==========================================
    -- 6. INFLUENCE INDEX (5%)
    -- Formula: 50 * (0.5*Reviews + 0.3*Referrals + 0.2*Certs)
    -- ==========================================
    metric_review_avg NUMERIC(3,2) DEFAULT 0.0, -- (BR) Normalized 0-1 (e.g. 5 stars = 1.0)
    metric_referral_score NUMERIC(4,3) DEFAULT 0.0, -- (REF)
    metric_cert_completion NUMERIC(4,3) DEFAULT 0.0, -- (CERT)
    
    influence_score NUMERIC(5, 2) GENERATED ALWAYS AS (
        LEAST(50,
            50 * (
                (0.5 * metric_review_avg) +
                (0.3 * metric_referral_score) +
                (0.2 * metric_cert_completion)
            )
        )
    ) STORED,

    -- ==========================================
    -- TOTAL TRUST SCORE (0-1000)
    -- ==========================================
    total_trust_score INTEGER GENERATED ALWAYS AS (
        CAST(
            performance_score + 
            safety_score + 
            compliance_score + 
            financial_score + 
            longevity_score + 
            influence_score 
        AS INTEGER)
    ) STORED,
    
    current_rank_tier TEXT, -- 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Apex'
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rank Constraints
    CONSTRAINT check_scores_positive CHECK (
        performance_score >= 0 AND safety_score >= 0 AND compliance_score >= 0 AND
        financial_score >= 0 AND longevity_score >= 0 AND influence_score >= 0
    )
);

CREATE INDEX idx_trust_score_rank ON trust_scores(total_trust_score DESC);


-- 2. POINTS LEDGER (Audit Trail)
CREATE TABLE trust_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    event_type TEXT NOT NULL, 
    category TEXT CHECK (category IN ('performance', 'safety', 'compliance', 'financial', 'longevity', 'influence')),
    points_delta INTEGER, -- Can be null if it affects a metric directly
    metric_affected TEXT, -- e.g. 'metric_incident_rate'
    
    description TEXT,
    reference_id UUID, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. RANK TIERS (The Ladder & Scarcity)
CREATE TABLE rank_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name TEXT NOT NULL UNIQUE, 
    min_score INTEGER NOT NULL,
    max_slots INTEGER, -- Scarcity (Apex only)
    benefits_json JSONB
);

INSERT INTO rank_tiers (tier_name, min_score, max_slots) VALUES
('Iron', 0, NULL),
('Bronze', 300, NULL),
('Silver', 500, NULL),
('Gold', 700, NULL),
('Platinum', 850, NULL),
('Apex', 950, 50); -- Strategic Scarcity

-- 4. LEADERBOARDS
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type TEXT CHECK (period_type IN ('lifetime', 'fiscal_year', 'quarterly', 'monthly')),
    period_label TEXT, -- 'FY2026'
    
    vertical vertical_type, 
    market_id UUID, 
    
    company_id UUID REFERENCES companies(id),
    rank_position INTEGER,
    score_snapshot INTEGER,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
