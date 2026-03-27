-- ============================================================================
-- MONETIZATION ENGINE SPINES (BILLING, SETTLEMENT, OPPORTUNITY DELIVERY)
-- Upgrade-only migration to harden the three core money paths.
-- Migration: 20260327150000
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENGINE 1: BILLING & ENTITLEMENTS
-- Hardening the webhook idempotency log & unified subscription truths
-- ----------------------------------------------------------------------------

-- 1A: Upgrade webhook_inbox for replay safety and error visibility
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='webhook_inbox' AND column_name='status') THEN
        ALTER TABLE public.webhook_inbox ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed', 'retrying'));
        ALTER TABLE public.webhook_inbox ADD COLUMN retry_count int DEFAULT 0;
        ALTER TABLE public.webhook_inbox ADD COLUMN processing_error text;
        ALTER TABLE public.webhook_inbox ADD COLUMN signature_verified boolean DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_status ON public.webhook_inbox(status, received_at);

-- 1B: Ensure user_subscriptions is the canonical source of truth for MRR
-- Moving away from arbitrary profile.plan_tier fields.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_subscriptions' AND column_name='plan_id') THEN
        ALTER TABLE public.user_subscriptions ADD COLUMN plan_id text;
        ALTER TABLE public.user_subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
        ALTER TABLE public.user_subscriptions ADD COLUMN latest_invoice_id text;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- ENGINE 2: OPPORTUNITY DELIVERY (NATIVE PUSH)
-- Hardening push tokens and providing delivery observability
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='push_tokens' AND column_name='updated_at') THEN
        ALTER TABLE public.push_tokens ADD COLUMN updated_at timestamptz DEFAULT now();
        ALTER TABLE public.push_tokens ADD COLUMN error_count int DEFAULT 0;
        ALTER TABLE public.push_tokens ADD COLUMN last_failed_at timestamptz;
        ALTER TABLE public.push_tokens ADD COLUMN invalid_reason text;
    END IF;
END $$;

-- Immutable audit log for native push deliveries
CREATE TABLE IF NOT EXISTS public.push_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_id TEXT, -- Store token safely without foreign key for lifecycle resilience
    platform TEXT, -- 'ios', 'android', 'web'
    delivery_status TEXT DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sent', 'failed', 'opened', 'invalid_token')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_log_user ON public.push_delivery_log(profile_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_push_log_load ON public.push_delivery_log(load_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_push_log_status ON public.push_delivery_log(delivery_status);

-- ----------------------------------------------------------------------------
-- ENGINE 3: SETTLEMENT & TRUST
-- Executing the QuickPay bridge from delivered load -> factoring -> wallet
-- ----------------------------------------------------------------------------

-- Add settlement states to Jobs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='settlement_status') THEN
        -- settlement_status tracks the operational -> money conversion
        ALTER TABLE public.jobs ADD COLUMN settlement_status text DEFAULT 'unsettled' 
            CHECK (settlement_status IN ('unsettled', 'pod_submitted', 'pod_verified', 'quickpay_eligible', 'on_hold', 'factored_and_wallet_credited', 'payout_initiated', 'disputed'));
        ALTER TABLE public.jobs ADD COLUMN proof_of_delivery_id UUID REFERENCES public.documents(id);
        ALTER TABLE public.jobs ADD COLUMN actual_delivery_at TIMESTAMPTZ;
        ALTER TABLE public.jobs ADD COLUMN manual_review_flag boolean DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_settlement ON public.jobs(settlement_status) WHERE settlement_status != 'factored_and_wallet_credited';

-- 3A: The execution RPC bridge: "Execute Factoring & Transfer to Wallet"
-- This takes an approved factoring request and atomically writes to the ledger.
CREATE OR REPLACE FUNCTION public.execute_quickpay_settlement(
    p_job_id UUID,
    p_factoring_program_id UUID
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_job RECORD;
    v_factor_json JSONB;
    v_operator_wallet_id UUID;
    v_advance_amount NUMERIC;
    v_fee_amount NUMERIC;
    v_ledger_entry_id UUID;
BEGIN
    -- 1. Lock Job to prevent double settlement
    SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
    
    IF v_job.settlement_status = 'factored_and_wallet_credited' THEN
        RAISE EXCEPTION 'Job % is already settled.', p_job_id;
    END IF;
    
    IF v_job.settlement_status NOT IN ('pod_verified', 'quickpay_eligible') THEN
        RAISE EXCEPTION 'Job % is not eligible for settlement (status: %).', p_job_id, v_job.settlement_status;
    END IF;

    -- 2. Validate wallet exists
    SELECT id INTO v_operator_wallet_id FROM public.hc_pay_wallets WHERE user_id = v_job.driver_id;
    IF v_operator_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Operator % does not have a registered HC Pay Wallet.', v_job.driver_id;
    END IF;

    -- 3. Calculate breakdown
    v_factor_json := public.calculate_factoring_payout( (v_job.agreed_price_cents / 100.0)::NUMERIC, p_factoring_program_id );
    v_advance_amount := (v_factor_json->>'advance_amount')::NUMERIC;
    v_fee_amount := (v_factor_json->>'fee_amount')::NUMERIC;

    -- 4. Execute atomic ledger transaction (Operator Wallet Credit)
    v_ledger_entry_id := public.hc_pay_write_ledger_entry(
        p_wallet_id := v_operator_wallet_id,
        p_user_id := v_job.driver_id,
        p_entry_type := 'quickpay_payout',
        p_amount_usd := v_advance_amount,
        p_direction := 'credit',
        p_reference_type := 'job',
        p_reference_id := p_job_id::TEXT,
        p_counterparty_user_id := v_job.broker_id,
        p_fee_usd := v_fee_amount,
        p_note := 'QuickPay Load Settlement',
        p_metadata := jsonb_build_object('factoring_program_id', p_factoring_program_id)
    );

    -- 5. Record Platform Revenue (Factoring Rake)
    INSERT INTO public.hc_pay_revenue (source, amount_usd, ledger_entry_id, payer_user_id, reference_type, reference_id)
    VALUES ('quickpay_fee', v_fee_amount, v_ledger_entry_id, v_job.driver_id, 'job', p_job_id::TEXT);

    -- 6. Update Job Status
    UPDATE public.jobs SET settlement_status = 'factored_and_wallet_credited', updated_at = now() WHERE id = p_job_id;

    RETURN v_ledger_entry_id;
END;
$$;
