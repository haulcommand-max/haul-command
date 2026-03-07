-- 20260226_0005_vapi_global_compliance.sql 
-- Migration to pre-seed Vapi compliance profiles.

CREATE TYPE public.call_recording_consent_type AS ENUM ('two_party', 'one_party', 'strict_ban');

CREATE TABLE IF NOT EXISTS public.country_compliance_profiles (
    country_code VARCHAR(2) PRIMARY KEY,
    region_name TEXT,
    call_recording_consent public.call_recording_consent_type DEFAULT 'two_party',
    outbound_allowed BOOLEAN DEFAULT false,
    required_disclosures JSONB DEFAULT '[]'::jsonb,
    compliance_last_verified_at TIMESTAMP WITH TIME ZONE,
    compliance_verified_by_user UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.country_compliance_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: Admin only write, Service role read.
CREATE POLICY "Admin write access for compliance profiles" 
    ON public.country_compliance_profiles 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role full access compliance_profiles" 
    ON public.country_compliance_profiles 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Seed defaults for the discovered countries explicitly found in proxy.ts, global_concepts.sql, and global_markets_migration.sql
INSERT INTO public.country_compliance_profiles (country_code, region_name, call_recording_consent, outbound_allowed, required_disclosures)
VALUES
    -- North America
    ('US', 'United States', 'two_party', false, '["This call is being recorded for quality and training purposes."]'::jsonb),
    ('CA', 'Canada', 'two_party', false, '["This call is being recorded for quality and training purposes."]'::jsonb),
    ('MX', 'Mexico', 'two_party', false, '["Grabación de llamadas para fines de calidad."]'::jsonb),

    -- Europe (Strict GDPR)
    ('GB', 'United Kingdom', 'strict_ban', false, '["Call recording is disabled due to strict data privacy regulations."]'::jsonb),
    ('SE', 'Sweden', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('NO', 'Norway', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('DE', 'Germany', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('NL', 'Netherlands', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('BE', 'Belgium', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('IT', 'Italy', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('TR', 'Turkey', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),

    -- Oceania
    ('AU', 'Australia', 'two_party', false, '["This call is being recorded for quality and training purposes."]'::jsonb),
    ('NZ', 'New Zealand', 'two_party', false, '["This call is being recorded for quality and training purposes."]'::jsonb),

    -- Middle East / Africa
    ('AE', 'United Arab Emirates', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('SA', 'Saudi Arabia', 'strict_ban', false, '["Call recording is disabled."]'::jsonb),
    ('ZA', 'South Africa', 'strict_ban', false, '["Call recording is disabled. (POPIA compliance)"]'::jsonb)
ON CONFLICT (country_code) DO NOTHING;

-- ── Create other Vapi Data Layer Tables ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vapi_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) UNIQUE NOT NULL,
    vapi_agent_id VARCHAR(255),
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    country_code VARCHAR(2),
    caller_number VARCHAR(50),
    recipient_number VARCHAR(50),
    call_status VARCHAR(50),
    duration_seconds INTEGER,
    recording_url TEXT,
    cost_usd DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.vapi_call_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vapi_call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(255) REFERENCES public.vapi_call_events(call_id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT,
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.vapi_call_transcripts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.vapi_call_intelligence (
    call_id VARCHAR(255) PRIMARY KEY REFERENCES public.vapi_call_events(call_id) ON DELETE CASCADE,
    intent_category VARCHAR(100),
    sentiment_score DECIMAL(3,2),
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    is_qualified_lead BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    revenue_attributed DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.vapi_call_intelligence ENABLE ROW LEVEL SECURITY;
