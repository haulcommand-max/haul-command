-- Ecosystem Ownership Sprint Migration
-- Escrow, QuickPay, Referral, GDPR tables
-- Run in Supabase SQL Editor

-- Escrow holds table
CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  payer_id TEXT NOT NULL,
  payee_id TEXT NOT NULL,
  amount_usd NUMERIC(12,2) NOT NULL,
  fee_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount_usd NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'disputed', 'refunded', 'factored')),
  description TEXT,
  released_at TIMESTAMPTZ,
  released_by TEXT,
  disputed_at TIMESTAMPTZ,
  factored_at TIMESTAMPTZ,
  quickpay_fee_usd NUMERIC(12,2),
  quickpay_payout_usd NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escrow disputes
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_id UUID REFERENCES escrow_holds(id),
  disputant_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved_payer', 'resolved_payee')),
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral credits
CREATE TABLE IF NOT EXISTS referral_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  credit_usd NUMERIC(8,2) NOT NULL DEFAULT 25,
  conversion_type TEXT DEFAULT 'signup',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_email)
);

-- GDPR deletion audit log
CREATE TABLE IF NOT EXISTS gdpr_deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier_hash TEXT NOT NULL,
  reason TEXT DEFAULT 'user_request',
  tables_purged TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_escrow_holds_job ON escrow_holds(job_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_payer ON escrow_holds(payer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_payee ON escrow_holds(payee_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_escrow ON escrow_disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_referrer ON referral_credits(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_email ON referral_credits(referred_email);

-- RLS
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_deletion_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_escrow_holds" ON escrow_holds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_escrow_disputes" ON escrow_disputes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_referral_credits" ON referral_credits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_gdpr_log" ON gdpr_deletion_log FOR ALL USING (true) WITH CHECK (true);
