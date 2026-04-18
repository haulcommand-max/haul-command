-- ============================================================
-- Migration: Add operator_earnings table for persistent earnings tracking
-- Replaces localStorage-based earnings with Supabase-backed storage
-- ============================================================

-- operator_earnings: persistent record of every earnings event
CREATE TABLE IF NOT EXISTS public.operator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID,                                      -- link to jobs table
    amount_cents INTEGER NOT NULL DEFAULT 0,           -- gross amount
    fee_cents INTEGER NOT NULL DEFAULT 0,              -- platform fee
    net_cents INTEGER NOT NULL DEFAULT 0,              -- net amount (amount - fee)
    currency TEXT NOT NULL DEFAULT 'USD',
    source TEXT NOT NULL DEFAULT 'job_completion'       -- job_completion | payout | bonus | referral | adjustment
        CHECK (source IN ('job_completion', 'payout', 'bonus', 'referral', 'adjustment')),
    status TEXT NOT NULL DEFAULT 'pending'              -- pending | confirmed | paid | failed
        CHECK (status IN ('pending', 'confirmed', 'paid', 'failed')),
    corridor_id TEXT,                                  -- optional corridor link
    corridor_label TEXT,
    origin_state TEXT,
    destination_state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Performance indexes
    CONSTRAINT positive_amounts CHECK (amount_cents >= 0 AND fee_cents >= 0 AND net_cents >= 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_operator_earnings_user_id ON public.operator_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_operator_earnings_user_status ON public.operator_earnings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_operator_earnings_user_created ON public.operator_earnings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_earnings_source ON public.operator_earnings(source);
CREATE INDEX IF NOT EXISTS idx_operator_earnings_corridor ON public.operator_earnings(corridor_id);

-- RLS: Operators can only read their own earnings
ALTER TABLE public.operator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings"
    ON public.operator_earnings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert earnings"
    ON public.operator_earnings FOR INSERT
    WITH CHECK (true);  -- Only service role should insert

CREATE POLICY "Service role can update earnings"
    ON public.operator_earnings FOR UPDATE
    USING (true);  -- Only service role should update

-- Add claim_state and profile fields to profiles if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'claim_state'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN claim_state TEXT DEFAULT 'unclaimed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'profile_completion_pct'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN profile_completion_pct INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'trust_tier'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN trust_tier TEXT DEFAULT 'unverified';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'operator_id'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN operator_id UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'service_corridors'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN service_corridors TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'availability_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN availability_status TEXT DEFAULT 'unavailable';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'push_token'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN push_token TEXT;
    END IF;
END $$;

-- Add commonly_confused and phonetic_guide to glossary_public if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'glossary_public' AND column_name = 'commonly_confused'
    ) THEN
        ALTER TABLE public.glossary_public ADD COLUMN commonly_confused JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'glossary_public' AND column_name = 'phonetic_guide'
    ) THEN
        ALTER TABLE public.glossary_public ADD COLUMN phonetic_guide TEXT;
    END IF;
END $$;

-- Notification log for tracking push notification delivery
CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    targets_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_type ON public.notification_log(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON public.notification_log(created_at DESC);

-- Function: auto-create earnings record when a job is completed
CREATE OR REPLACE FUNCTION public.sync_job_to_earnings()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Insert for each assigned escort
        IF NEW.assigned_escort_ids IS NOT NULL AND array_length(NEW.assigned_escort_ids, 1) > 0 THEN
            INSERT INTO public.operator_earnings (
                user_id, job_id, amount_cents, fee_cents, net_cents,
                currency, source, status, origin_state, destination_state, confirmed_at
            )
            SELECT
                unnest(NEW.assigned_escort_ids),
                NEW.job_id,
                COALESCE((NEW.agreed_rate_total * 100)::INTEGER, 0),
                0,  -- fee calculated separately
                COALESCE((NEW.agreed_rate_total * 100)::INTEGER, 0),
                COALESCE(NEW.currency, 'USD'),
                'job_completion',
                'confirmed',
                NEW.origin_state,
                NEW.destination_state,
                now()
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-sync completed jobs to earnings
DROP TRIGGER IF EXISTS trg_sync_job_to_earnings ON public.jobs;
CREATE TRIGGER trg_sync_job_to_earnings
    AFTER INSERT OR UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_job_to_earnings();

COMMENT ON TABLE public.operator_earnings IS 'Persistent earnings records for operators. Fed by job completions, payouts, bonuses, and referrals.';
COMMENT ON TABLE public.notification_log IS 'Audit log for push notifications sent to operators.';
