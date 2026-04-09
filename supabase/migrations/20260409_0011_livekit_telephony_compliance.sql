-- Migration: Telephony Compliance & DNC Registry
-- 1. Creates a Do Not Call registry to guarantee legal compliance across the 120 country framework.
-- 2. Upgrades LiveKit Outbound Eligibility to verify against DNC

CREATE TABLE IF NOT EXISTS public.telephony_dnc_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL UNIQUE,
    country_code TEXT,
    reason TEXT DEFAULT 'opt_out', -- 'opt_out', 'invalid_number', 'legal_demand'
    added_at TIMESTAMPTZ DEFAULT now(),
    source TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS dnc_phone_idx ON public.telephony_dnc_registry (phone_number);

-- Add a compliance check view for the continuous dialer swarm
CREATE OR REPLACE VIEW public.livekit_compliant_dial_queue AS
SELECT e.*
FROM public.livekit_outbound_eligibility e
LEFT JOIN public.telephony_dnc_registry dnc ON e.target_phone = dnc.phone_number
WHERE 
    e.status = 'pending' 
    AND e.eligibility_score >= 0.70
    AND dnc.phone_number IS NULL; -- Guaranteed exclusion of Do Not Call lists

-- RLS
ALTER TABLE public.telephony_dnc_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY dnc_read_sr ON public.telephony_dnc_registry FOR SELECT TO service_role USING (true);
CREATE POLICY dnc_insert_sr ON public.telephony_dnc_registry FOR INSERT TO service_role WITH CHECK (true);
