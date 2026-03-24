-- ================================================================
-- STRIPE CONNECT MARKETPLACE MODEL
-- ================================================================

-- Add Stripe Connect fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_connect ON profiles (stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- Operator payouts table
CREATE TABLE IF NOT EXISTS operator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  escrow_transaction_id UUID REFERENCES escrow_transactions(id),
  amount NUMERIC(10,2) NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'standard' CHECK (payout_method IN ('standard','instant')),
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_operator ON operator_payouts (operator_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON operator_payouts (status, created_at);

ALTER TABLE operator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators view own payouts" ON operator_payouts
  FOR SELECT USING (operator_id = auth.uid());
