-- ═══════════════════════════════════════════════════════════════════════════════
-- REVENUE ACTIVATION MIGRATION — Escrow + Referral + SMS + Messaging
-- All tables needed for Moves 5, 6, messaging monetization, and SMS credits
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════ ESCROW ═══════════════════════════════
CREATE TABLE IF NOT EXISTS escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL,
    broker_id UUID NOT NULL REFERENCES profiles(id),
    operator_id UUID REFERENCES profiles(id),
    corridor_slug TEXT,
    load_rate_usd NUMERIC(10,2) NOT NULL,
    platform_fee_pct NUMERIC(5,4) NOT NULL DEFAULT 0.0500,
    platform_fee_usd NUMERIC(10,2) GENERATED ALWAYS AS (load_rate_usd * platform_fee_pct) STORED,
    total_charge_usd NUMERIC(10,2) GENERATED ALWAYS AS (load_rate_usd * (1 + platform_fee_pct)) STORED,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','held','released','disputed','refunded','expired')),
    held_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    disputed_at TIMESTAMPTZ,
    dispute_reason TEXT,
    dispute_resolution TEXT,
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_broker ON escrow_holds(broker_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_operator ON escrow_holds(operator_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_load ON escrow_holds(load_id);

ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
CREATE POLICY escrow_holds_own ON escrow_holds FOR ALL USING (
    auth.uid() = broker_id OR auth.uid() = operator_id
);

-- ═══════════════════════════════════════ REFERRAL ═════════════════════════════
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES profiles(id),
    code TEXT NOT NULL UNIQUE,
    uses_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_operator ON referral_codes(operator_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES profiles(id),
    referred_id UUID NOT NULL REFERENCES profiles(id),
    referral_code_id UUID REFERENCES referral_codes(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','paid','expired')),
    reward_amount_usd NUMERIC(10,2) NOT NULL DEFAULT 25.00,
    qualified_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    stripe_credit_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY referral_codes_own ON referral_codes FOR ALL USING (auth.uid() = operator_id);
CREATE POLICY referral_rewards_own ON referral_rewards FOR ALL USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
);

-- ═══════════════════════════════════════ SMS CREDITS ══════════════════════════
CREATE TABLE IF NOT EXISTS sms_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
    credits_remaining INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    to_number TEXT NOT NULL,
    message TEXT NOT NULL,
    credits_used INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','opted_out')),
    provider TEXT DEFAULT 'novu',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_log_user ON sms_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_status ON sms_log(status);

ALTER TABLE sms_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY sms_credits_own ON sms_credits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sms_log_own ON sms_log FOR ALL USING (auth.uid() = user_id);

-- Add sms_opted_out to profiles if not exists
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN sms_opted_out BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════ MESSAGING FEATURES ══════════════════
CREATE TABLE IF NOT EXISTS message_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES profiles(id),
    messages_received_30d INTEGER NOT NULL DEFAULT 0,
    messages_responded_30d INTEGER NOT NULL DEFAULT 0,
    avg_response_time_minutes NUMERIC(10,1),
    response_rate_pct NUMERIC(5,2),
    has_response_guarantee BOOLEAN NOT NULL DEFAULT false,
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(operator_id)
);

CREATE INDEX IF NOT EXISTS idx_message_stats_operator ON message_stats(operator_id);
CREATE INDEX IF NOT EXISTS idx_message_stats_response_rate ON message_stats(response_rate_pct DESC);

ALTER TABLE message_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_stats_read ON message_stats FOR SELECT USING (true);
CREATE POLICY message_stats_update ON message_stats FOR UPDATE USING (auth.uid() = operator_id);

-- Emergency fill log
CREATE TABLE IF NOT EXISTS emergency_fill_blasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID NOT NULL,
    broker_id UUID NOT NULL REFERENCES profiles(id),
    corridor_slug TEXT NOT NULL,
    stripe_payment_intent_id TEXT,
    amount_usd NUMERIC(10,2) NOT NULL DEFAULT 25.00,
    operators_notified INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','sent','expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE emergency_fill_blasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY emergency_fill_own ON emergency_fill_blasts FOR ALL USING (auth.uid() = broker_id);

-- Add subscription tier to profiles for messaging feature gates
DO $$ BEGIN
    ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
