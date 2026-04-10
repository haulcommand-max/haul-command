-- FINTECH SETTLEMENT OS: ESCROW AND TRANSACTIONS

CREATE TABLE IF NOT EXISTS hc_escrows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    load_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
    broker_id uuid REFERENCES profiles(id),
    operator_id uuid REFERENCES profiles(id),
    total_amount numeric NOT NULL,
    currency text DEFAULT 'USD',
    status text DEFAULT 'PENDING_FUNDS', -- PENDING_FUNDS, ESCROW_LOCKED, PERMIT_RELEASED, DELIVERED_HOLDBACK, SETTLED, DISPUTED
    booking_deposit_amount numeric,
    permit_release_amount numeric,
    delivery_holdback_amount numeric,
    dispute_reserve_amount numeric,
    payment_gateway text, -- 'stripe' or 'crypto'
    gateway_reference_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hc_fiat_crypto_reconciliation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id uuid REFERENCES hc_escrows(id),
    crypto_currency text,
    crypto_amount numeric,
    usd_value_at_lock numeric,
    stablecoin_conversion_tx text,
    status text DEFAULT 'PENDING_SYNC',
    created_at timestamptz DEFAULT now(),
    synced_at timestamptz
);

CREATE TABLE IF NOT EXISTS hc_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid REFERENCES profiles(id),
    escrow_id uuid REFERENCES hc_escrows(id),
    amount numeric NOT NULL,
    payout_type text DEFAULT 'STANDARD_T2', -- 'STANDARD_T2' or 'INSTANT_SAMEDAY'
    fee_deducted numeric DEFAULT 0,
    stripe_payout_id text,
    status text DEFAULT 'INITIATED',
    created_at timestamptz DEFAULT now()
);
