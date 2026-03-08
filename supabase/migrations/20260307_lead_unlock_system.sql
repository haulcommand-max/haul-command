-- ════════════════════════════════════════════════════════════
-- Lead Unlock & Credit System
-- Phase 0 money path: brokers pay to unlock operator contacts
-- ════════════════════════════════════════════════════════════

-- Lead unlocks — records every contact unlock
CREATE TABLE IF NOT EXISTS public.lead_unlocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('credit', 'stripe', 'plan_included')),
    amount_cents INTEGER DEFAULT 0,
    stripe_payment_intent_id TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_lead_unlocks_buyer
    ON public.lead_unlocks(buyer_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_unlocks_operator
    ON public.lead_unlocks(operator_id, unlocked_at DESC);

-- Prevent duplicate unlocks (same buyer + operator)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_unlocks_unique
    ON public.lead_unlocks(operator_id, buyer_id);

-- Lead credit balances — prepaid credit packs
CREATE TABLE IF NOT EXISTS public.lead_credit_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    credits_remaining INTEGER DEFAULT 0 CHECK (credits_remaining >= 0),
    credits_purchased_total INTEGER DEFAULT 0,
    credits_used_total INTEGER DEFAULT 0,
    last_purchase_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credit purchase history
CREATE TABLE IF NOT EXISTS public.lead_credit_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    credits INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    purchased_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription state mirror (from Stripe webhooks)
CREATE TABLE IF NOT EXISTS public.subscription_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_id TEXT NOT NULL DEFAULT 'free',
    plan_name TEXT DEFAULT 'Free',
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN (
        'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'inactive'
    )),
    monthly_lead_credits INTEGER DEFAULT 0,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_states_stripe
    ON public.subscription_states(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_states_status
    ON public.subscription_states(status)
    WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.lead_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_states ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own unlocks
CREATE POLICY lead_unlocks_buyer_read ON public.lead_unlocks
    FOR SELECT TO authenticated
    USING (auth.uid() = buyer_id);

-- Operators can see who unlocked their contact
CREATE POLICY lead_unlocks_operator_read ON public.lead_unlocks
    FOR SELECT TO authenticated
    USING (auth.uid() = operator_id);

-- Users can read their own credit balance
CREATE POLICY credit_balance_own_read ON public.lead_credit_balances
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can read their own subscription
CREATE POLICY subscription_own_read ON public.subscription_states
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
