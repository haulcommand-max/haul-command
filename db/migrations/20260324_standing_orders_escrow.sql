-- ================================================================
-- STANDING ORDERS + ESCROW ENHANCEMENT
-- Recurring load automation + payment tracking
-- ================================================================

CREATE TABLE IF NOT EXISTS standing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  corridor TEXT,
  load_type TEXT DEFAULT 'wide_load',
  rate_per_day NUMERIC(10,2) NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'weekly'
    CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly')),
  preferred_operator_id UUID,
  country_code TEXT DEFAULT 'us',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_dispatch_at TIMESTAMPTZ,
  last_dispatched_at TIMESTAMPTZ,
  dispatch_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_standing_orders_broker ON standing_orders (broker_id, status);
CREATE INDEX IF NOT EXISTS idx_standing_orders_dispatch ON standing_orders (status, next_dispatch_at)
  WHERE status = 'active';

-- Escrow transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID,
  operator_id UUID NOT NULL,
  broker_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) GENERATED ALWAYS AS (amount * 0.05) STORED,
  operator_payout NUMERIC(10,2) GENERATED ALWAYS AS (amount * 0.95) STORED,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'held', 'released', 'refunded', 'disputed')),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  conversation_id UUID,
  standing_order_id UUID REFERENCES standing_orders(id),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escrow_load ON escrow_transactions (load_id);
CREATE INDEX IF NOT EXISTS idx_escrow_operator ON escrow_transactions (operator_id, status);
CREATE INDEX IF NOT EXISTS idx_escrow_broker ON escrow_transactions (broker_id, status);

-- Enable RLS
ALTER TABLE standing_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can manage their standing orders" ON standing_orders
  FOR ALL USING (broker_id = auth.uid());

CREATE POLICY "Users can view their escrow" ON escrow_transactions
  FOR SELECT USING (operator_id = auth.uid() OR broker_id = auth.uid());

-- Add standing_order_id to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS standing_order_id UUID REFERENCES standing_orders(id);
