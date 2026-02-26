-- Migration: 20260220_affiliate_engine_schema.sql
-- Subagent: Launch Dominance Setup
-- Provides the schema for the Viral Affiliate Engine with Match Priority Boost mechanics

CREATE TABLE IF NOT EXISTS public.affiliate_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code text NOT NULL UNIQUE,
    referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    conversion_event text NOT NULL CHECK (conversion_event IN ('signup', 'first_load_completed', 'first_offer_accepted')),
    reward_type text NOT NULL CHECK (reward_type IN ('match_priority_boost', 'fee_credit', 'pro_month')),
    reward_granted_at timestamptz,
    reward_expiration timestamptz,
    abuse_score numeric DEFAULT 0.0 CHECK (abuse_score >= 0.0 AND abuse_score <= 1.0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_referrer ON public.affiliate_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_referred ON public.affiliate_tracking(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_code ON public.affiliate_tracking(referral_code);

-- Fraud log to track velocity limits and detected self-referrals
CREATE TABLE IF NOT EXISTS public.affiliate_fraud_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    trigger_reason text NOT NULL,
    ip_address text,
    device_fingerprint text,
    created_at timestamptz DEFAULT now()
);

-- Table defining active boost windows for Match Priority
CREATE TABLE IF NOT EXISTS public.match_priority_boosts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_affiliate_id uuid REFERENCES public.affiliate_tracking(id) ON DELETE CASCADE,
    boost_percent numeric NOT NULL DEFAULT 20.0, -- e.g., +20% score
    starts_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL, -- usually now() + 30 days
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_priority_active ON public.match_priority_boosts(user_id, is_active, expires_at);

-- RLS Policies
ALTER TABLE public.affiliate_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_fraud_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_priority_boosts ENABLE ROW LEVEL SECURITY;

-- Referrers can see their own tracking records
CREATE POLICY "user_read_own_affiliates" ON public.affiliate_tracking 
FOR SELECT USING (auth.uid() = referrer_id);

-- Users can see their own active priority boosts
CREATE POLICY "user_read_own_boosts" ON public.match_priority_boosts 
FOR SELECT USING (auth.uid() = user_id);

-- System functions for managing affiliate logic (to be called by edge functions/triggers safely)
CREATE OR REPLACE FUNCTION public.grant_match_priority_boost(p_user_id uuid, p_source_affiliate_id uuid, p_days int DEFAULT 30, p_boost numeric DEFAULT 20.0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.match_priority_boosts(user_id, source_affiliate_id, boost_percent, expires_at)
    VALUES (p_user_id, p_source_affiliate_id, p_boost, now() + (p_days || ' days')::interval);
    RETURN true;
END;
$$;
