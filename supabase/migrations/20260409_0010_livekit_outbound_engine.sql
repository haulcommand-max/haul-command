-- Migration: LiveKit Outbound Engine
-- Upgrades the legacy VAPI tele-sales architecture to LiveKit WebRTC/SIP Infrastructure
-- Provides clean additive tables for claims, sales, and verification campaigns

CREATE TABLE IF NOT EXISTS public.livekit_outbound_eligibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id TEXT NOT NULL, -- The HC_ID of the operator/claimable entity
    entity_type TEXT NOT NULL DEFAULT 'operator',
    country_code TEXT NOT NULL,
    program_type TEXT NOT NULL, -- e.g., 'profile_claim', 'adgrid_upsell', 'data_verification'
    target_phone TEXT NOT NULL,
    eligibility_score NUMERIC DEFAULT 0.0, -- Confidence score for dialing algorithm
    last_called_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, dialed, answered, converted, failed, unsubscribed
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for the dialing algorithm to quickly grab the next high-value target
CREATE INDEX IF NOT EXISTS lk_oe_score_idx ON public.livekit_outbound_eligibility (eligibility_score DESC) WHERE eligibility_score >= 0.70 AND status = 'pending';
CREATE INDEX IF NOT EXISTS lk_oe_country_idx ON public.livekit_outbound_eligibility (country_code, program_type);

CREATE TABLE IF NOT EXISTS public.livekit_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name TEXT NOT NULL,
    participant_identity TEXT NOT NULL,
    call_type TEXT NOT NULL, -- 'inbound_webrtc', 'outbound_sip'
    status TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    recording_url TEXT,
    system_instruction TEXT,
    telemetry_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lk_ce_room_idx ON public.livekit_call_events (room_name);

-- RLS
ALTER TABLE public.livekit_outbound_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livekit_call_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY lk_outbound_elig_sr ON public.livekit_outbound_eligibility FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY lk_call_events_sr ON public.livekit_call_events FOR ALL TO service_role USING (true) WITH CHECK (true);
