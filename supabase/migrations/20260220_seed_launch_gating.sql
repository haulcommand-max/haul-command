-- Migration: 20260220_seed_launch_gating.sql
-- Adds seed launch gating and email sequence tracking

-- 1) Seed launch gating settings
INSERT INTO public.app_settings (key, value, description) VALUES
    ('seed_launch_enabled', 'false', 'Gate: set to true to begin sending seed claim emails'),
    ('seed_launch_at', '2026-02-26T09:00:00-05:00', 'Hard date: seed claim emails start after this timestamp (ET)'),
    ('facebook_group_url', 'https://www.facebook.com/groups/haulcommand', 'Facebook group URL for claimed operators')
ON CONFLICT (key) DO NOTHING;

-- 2) Email sequence tracking table
CREATE TABLE IF NOT EXISTS public.email_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id uuid,
    sequence_name text NOT NULL,         -- e.g. 'seed_claim', 'claim_welcome'
    current_step int NOT NULL DEFAULT 0, -- last completed step
    max_steps int NOT NULL DEFAULT 3,
    status text NOT NULL DEFAULT 'active', -- active, completed, cancelled, suppressed
    started_at timestamptz NOT NULL DEFAULT now(),
    last_step_at timestamptz,
    next_step_at timestamptz,
    completed_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_profile ON public.email_sequences(profile_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON public.email_sequences(status, next_step_at);
CREATE INDEX IF NOT EXISTS idx_email_sequences_name ON public.email_sequences(sequence_name);

-- RLS
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.email_sequences
    FOR ALL USING (auth.role() = 'service_role');

-- 3) Add seeded_batch_id, seeded_at, phone_hash, email_hash to driver_profiles if missing
ALTER TABLE public.driver_profiles
    ADD COLUMN IF NOT EXISTS seeded_batch_id uuid,
    ADD COLUMN IF NOT EXISTS seeded_at timestamptz,
    ADD COLUMN IF NOT EXISTS phone_hash text,
    ADD COLUMN IF NOT EXISTS email_hash text;

-- Unique indexes for dedupe (partial — only where not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_profiles_phone_hash
    ON public.driver_profiles(phone_hash) WHERE phone_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_profiles_email_hash
    ON public.driver_profiles(email_hash) WHERE email_hash IS NOT NULL;

-- 4) Claim event tracking (for triggering welcome sequence)
CREATE TABLE IF NOT EXISTS public.claim_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    claim_hash text,
    claimed_at timestamptz NOT NULL DEFAULT now(),
    claim_method text DEFAULT 'web', -- web, email_link, admin
    metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_claim_events_profile ON public.claim_events(profile_id);

ALTER TABLE public.claim_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.claim_events
    FOR ALL USING (auth.role() = 'service_role');
