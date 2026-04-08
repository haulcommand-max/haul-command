-- ============================================================================
-- HC PAY — WALLET LEDGER + NOWPAYMENTS INTEGRATION
-- Migration: 20260321200000
--
-- Tables:
--   1. hc_pay_wallets         — one wallet per user (source of truth for balance)
--   2. hc_pay_ledger          — append-only immutable transaction log
--   3. nowpayments_payments   — NOWPayments payment records
--   4. hc_pay_payouts         — payout requests to operator bank accounts
--   5. hc_pay_revenue         — every dollar the platform earns
--
-- Functions:
--   - hc_pay_write_ledger_entry() — atomic ledger write with row-level locking
--   - create_wallet_for_new_user() — trigger: auto-create wallet on auth.users INSERT
-- ============================================================================

-- ── 1. HC Pay Wallets ──

CREATE TABLE IF NOT EXISTS hc_pay_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance_usd NUMERIC(18, 6) DEFAULT 0,
    pending_usd NUMERIC(18, 6) DEFAULT 0,
    lifetime_earned_usd NUMERIC(18, 6) DEFAULT 0,
    lifetime_paid_usd NUMERIC(18, 6) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    is_frozen BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user ON hc_pay_wallets(user_id);

ALTER TABLE hc_pay_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
    ON hc_pay_wallets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ── 2. HC Pay Ledger (append-only) ──

CREATE TABLE IF NOT EXISTS hc_pay_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES hc_pay_wallets(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES auth.users(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN (
        'payment_received',
        'quickpay_payout',
        'standard_payout',
        'platform_fee',
        'float_yield',
        'refund_issued',
        'adjustment'
    )),
    amount_usd NUMERIC(18, 6) NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    balance_after NUMERIC(18, 6) NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    counterparty_user_id UUID,
    fee_usd NUMERIC(18, 6) DEFAULT 0,
    crypto_coin TEXT,
    crypto_network TEXT,
    crypto_amount NUMERIC(28, 12),
    crypto_rate_usd NUMERIC(18, 6),
    nowpayments_payment_id TEXT,
    stripe_payment_intent_id TEXT,
    note TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet ON hc_pay_ledger(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON hc_pay_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON hc_pay_ledger(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_nowpayments ON hc_pay_ledger(nowpayments_payment_id)
    WHERE nowpayments_payment_id IS NOT NULL;

ALTER TABLE hc_pay_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ledger"
    ON hc_pay_ledger FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ── 3. NOWPayments Payment Records ──

CREATE TABLE IF NOT EXISTS nowpayments_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nowpayments_payment_id TEXT UNIQUE NOT NULL,
    payer_user_id UUID REFERENCES auth.users(id),
    payee_user_id UUID REFERENCES auth.users(id),
    reference_type TEXT,
    reference_id TEXT,
    pay_currency TEXT NOT NULL,
    pay_network TEXT,
    pay_amount NUMERIC(28, 12),
    price_amount NUMERIC(18, 6) NOT NULL,
    price_currency TEXT DEFAULT 'USD',
    hc_pay_fee_usd NUMERIC(18, 6),
    nowpayments_fee_usd NUMERIC(18, 6),
    net_to_operator_usd NUMERIC(18, 6),
    pay_address TEXT,
    payment_url TEXT,
    status TEXT DEFAULT 'waiting' CHECK (status IN (
        'waiting', 'confirming', 'confirmed', 'sending',
        'finished', 'failed', 'refunded', 'expired'
    )),
    expiration_estimate_date TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    actually_paid NUMERIC(28, 12),
    outcome_amount_usd NUMERIC(18, 6),
    ipn_verified BOOLEAN DEFAULT false,
    raw_ipn JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nowpay_payer ON nowpayments_payments(payer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nowpay_payee ON nowpayments_payments(payee_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nowpay_status ON nowpayments_payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nowpay_reference ON nowpayments_payments(reference_type, reference_id);

ALTER TABLE nowpayments_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
    ON nowpayments_payments FOR SELECT
    TO authenticated
    USING (auth.uid() = payer_user_id OR auth.uid() = payee_user_id);

-- ── 4. Payout Requests ──

CREATE TABLE IF NOT EXISTS hc_pay_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES hc_pay_wallets(id),
    user_id UUID REFERENCES auth.users(id),
    amount_usd NUMERIC(18, 6) NOT NULL,
    payout_type TEXT NOT NULL CHECK (payout_type IN ('quickpay', 'standard')),
    fee_usd NUMERIC(18, 6) DEFAULT 0,
    net_usd NUMERIC(18, 6),
    stripe_transfer_id TEXT,
    stripe_payout_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'paid', 'failed', 'cancelled'
    )),
    estimated_arrival TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON hc_pay_payouts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON hc_pay_payouts(status, created_at DESC);

ALTER TABLE hc_pay_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payouts"
    ON hc_pay_payouts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ── 5. HC Pay Revenue ──

CREATE TABLE IF NOT EXISTS hc_pay_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN (
        'crypto_fee', 'card_fee', 'quickpay_fee', 'float_yield', 'intelligence_api'
    )),
    amount_usd NUMERIC(18, 6) NOT NULL,
    ledger_entry_id UUID REFERENCES hc_pay_ledger(id),
    payer_user_id UUID,
    reference_type TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_source ON hc_pay_revenue(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON hc_pay_revenue(created_at DESC);

-- ── 6. Atomic Ledger Write Function ──

CREATE OR REPLACE FUNCTION hc_pay_write_ledger_entry(
    p_wallet_id UUID,
    p_user_id UUID,
    p_entry_type TEXT,
    p_amount_usd NUMERIC,
    p_direction TEXT,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL,
    p_counterparty_user_id UUID DEFAULT NULL,
    p_fee_usd NUMERIC DEFAULT 0,
    p_crypto_coin TEXT DEFAULT NULL,
    p_crypto_network TEXT DEFAULT NULL,
    p_crypto_amount NUMERIC DEFAULT NULL,
    p_crypto_rate_usd NUMERIC DEFAULT NULL,
    p_nowpayments_payment_id TEXT DEFAULT NULL,
    p_stripe_payment_intent_id TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_balance_after NUMERIC;
    v_entry_id UUID;
BEGIN
    -- Lock the wallet row for this transaction (prevents concurrent corruption)
    SELECT
        CASE WHEN p_direction = 'credit'
             THEN balance_usd + p_amount_usd
             ELSE balance_usd - p_amount_usd
        END
    INTO v_balance_after
    FROM hc_pay_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF v_balance_after IS NULL THEN
        RAISE EXCEPTION 'Wallet not found: %', p_wallet_id;
    END IF;

    IF p_direction = 'debit' AND v_balance_after < 0 THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %',
            v_balance_after + p_amount_usd, p_amount_usd;
    END IF;

    -- Write immutable ledger entry
    INSERT INTO hc_pay_ledger (
        wallet_id, user_id, entry_type, amount_usd, direction, balance_after,
        reference_type, reference_id, counterparty_user_id, fee_usd,
        crypto_coin, crypto_network, crypto_amount, crypto_rate_usd,
        nowpayments_payment_id, stripe_payment_intent_id, note, metadata
    ) VALUES (
        p_wallet_id, p_user_id, p_entry_type, p_amount_usd, p_direction, v_balance_after,
        p_reference_type, p_reference_id, p_counterparty_user_id, p_fee_usd,
        p_crypto_coin, p_crypto_network, p_crypto_amount, p_crypto_rate_usd,
        p_nowpayments_payment_id, p_stripe_payment_intent_id, p_note, p_metadata
    )
    RETURNING id INTO v_entry_id;

    -- Update wallet balance atomically
    UPDATE hc_pay_wallets SET
        balance_usd = v_balance_after,
        lifetime_earned_usd = CASE WHEN p_direction = 'credit'
                                   THEN lifetime_earned_usd + p_amount_usd
                                   ELSE lifetime_earned_usd END,
        lifetime_paid_usd   = CASE WHEN p_direction = 'debit'
                                   THEN lifetime_paid_usd + p_amount_usd
                                   ELSE lifetime_paid_usd END,
        updated_at = now()
    WHERE id = p_wallet_id;

    RETURN v_entry_id;
END;
$$;

-- ── 7. Auto-create Wallet Trigger ──

CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO hc_pay_wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;

CREATE TRIGGER on_auth_user_created_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_wallet_for_new_user();

-- ── 8. Backfill Wallets for Existing Users ──

INSERT INTO hc_pay_wallets (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
