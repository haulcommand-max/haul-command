-- ==============================================================================
-- HAUL COMMAND CORE MOAT INFRASTRUCTURE: TRUST SCORE NEURAL MODEL
-- Creates the multi-layer tracking and evaluation system for predictive reliability
-- ==============================================================================

-- 1. OPERATIONAL METRICS (Deterministic Core - Fast Path Reads)
-- Keeps track of hard metrics with extremely fast read times for public & broker surfaces
CREATE TABLE IF NOT EXISTS public.operator_metrics (
    operator_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Escort Inputs
    on_time_rate NUMERIC(5,2) DEFAULT 100.00,
    response_latency_p50 INTEGER DEFAULT 0, -- stored in minutes
    completion_rate NUMERIC(5,2) DEFAULT 100.00,
    cancellation_rate NUMERIC(5,2) DEFAULT 0.00,
    corridor_experience_count INTEGER DEFAULT 0,
    
    -- Computed Layer 1
    base_reliability_score NUMERIC(5,2) DEFAULT 0.00, -- 0-100
    
    -- Metadata
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect with RLS
ALTER TABLE public.operator_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read operator metrics" ON public.operator_metrics FOR SELECT USING (true);
CREATE POLICY "System update operator metrics" ON public.operator_metrics FOR ALL USING (auth.uid() = operator_id OR auth.jwt() ->> 'role' = 'service_role');


-- 2. BROKER RISK PROFILES
-- Tracks broker behavior to ensure two-sided trust and detect fraud/non-payment
CREATE TABLE IF NOT EXISTS public.broker_risk_profiles (
    broker_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    
    payment_speed_days NUMERIC(5,2) DEFAULT 30.00,
    dispute_frequency NUMERIC(5,2) DEFAULT 0.00,
    cancellation_behavior NUMERIC(5,2) DEFAULT 0.00,
    job_volume_consistency NUMERIC(5,2) DEFAULT 0.00,
    
    risk_band TEXT DEFAULT 'UNKNOWN', -- LOW, MEDIUM, HIGH, CRITICAL
    
    last_computed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect with RLS
ALTER TABLE public.broker_risk_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers can read own risk" ON public.broker_risk_profiles FOR SELECT USING (auth.uid() = broker_id);
-- Enterprise API access logic would exist in the functions reading this


-- 3. TRUST SCORE HISTORY (Time-Series Data)
-- Tracks the evolution of scores, decay curves, and anomalies for Enterprise monetization
CREATE TABLE IF NOT EXISTS public.trust_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('escort', 'broker')),
    
    -- Outputs from Neural Model / Contextual Layer
    layer_1_score NUMERIC(5,2) NOT NULL,
    layer_2_context_score NUMERIC(5,2),
    layer_3_predicted_reliability NUMERIC(5,4),
    
    risk_flag_probability NUMERIC(5,4),
    anomaly_score NUMERIC(5,4),
    confidence_interval NUMERIC(5,4),
    
    context_snapshot JSONB DEFAULT '{}'::jsonb, -- e.g. { load_type: 'oversize', market_tightness: 0.8 }
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast time-series retrieval
CREATE INDEX IF NOT EXISTS idx_trust_history_target ON public.trust_score_history(target_id, recorded_at DESC);

ALTER TABLE public.trust_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own history" ON public.trust_score_history FOR SELECT USING (auth.uid() = target_id);
-- Enterprise API accesses this directly.


-- 4. FUNCTION: UPSERT OPERATOR METRICS
CREATE OR REPLACE FUNCTION update_operator_metrics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_operator_metrics
    BEFORE UPDATE ON public.operator_metrics
    FOR EACH ROW EXECUTE FUNCTION update_operator_metrics();

-- 5. FUNCTION: UPSERT BROKER RISK
CREATE OR REPLACE FUNCTION update_broker_risk()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_broker_risk
    BEFORE UPDATE ON public.broker_risk_profiles
    FOR EACH ROW EXECUTE FUNCTION update_broker_risk();
