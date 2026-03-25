-- ═══════════════════════════════════════════════════════════════
-- STANDING ORDERS — Recurring Escort Scheduling System
-- Haul Command revenue category: pre-funded recurring loads
-- ═══════════════════════════════════════════════════════════════

-- ── Recurring Schedules (Standing Orders) ─────────────────────
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL,
  title TEXT NOT NULL,
  origin_jurisdiction TEXT NOT NULL,
  destination_jurisdiction TEXT NOT NULL,
  corridor_slug TEXT,
  load_type TEXT NOT NULL,
  load_dimensions JSONB,
  rate_per_occurrence DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly','custom')),
  days_of_week INTEGER[],          -- 0=Sun, 1=Mon...6=Sat for weekly/custom
  start_date DATE NOT NULL,
  end_date DATE,
  total_occurrences INTEGER,       -- calculated on creation
  completed_occurrences INTEGER DEFAULT 0,
  preferred_operator_id UUID,
  priority_dispatch BOOLEAN DEFAULT FALSE,  -- $15/occurrence add-on
  status TEXT DEFAULT 'pending_funding' CHECK (status IN ('pending_funding','active','paused','completed','cancelled')),
  escrow_balance DECIMAL(12,2) DEFAULT 0,
  platform_fee_percent DECIMAL(4,2) DEFAULT 5.00,
  cancellation_fee_percent DECIMAL(4,2) DEFAULT 10.00,
  compliance_flags JSONB DEFAULT '[]',
  next_dispatch_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_broker ON recurring_schedules(broker_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_status ON recurring_schedules(status);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_next_dispatch ON recurring_schedules(next_dispatch_date);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_corridor ON recurring_schedules(corridor_slug);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_operator ON recurring_schedules(preferred_operator_id);

-- ── Schedule Occurrences ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES recurring_schedules(id) ON DELETE CASCADE,
  occurrence_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '06:00',
  operator_id UUID,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','dispatched','accepted','in_progress','completed','cancelled','no_show','compliance_hold')),
  escrow_amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  operator_payout DECIMAL(10,2),
  priority_fee DECIMAL(10,2) DEFAULT 0,
  dispatched_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,
  kill_fee_paid DECIMAL(10,2) DEFAULT 0,
  replacement_operator_id UUID,
  compliance_flags JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_schedule ON schedule_occurrences(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_date ON schedule_occurrences(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_operator ON schedule_occurrences(operator_id);
CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_status ON schedule_occurrences(status);
CREATE INDEX IF NOT EXISTS idx_schedule_occurrences_dispatch ON schedule_occurrences(scheduled_date, status)
  WHERE status IN ('scheduled','dispatched');

-- ── Schedule Pre-Funding ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_prefunding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES recurring_schedules(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  funding_type TEXT DEFAULT 'initial' CHECK (funding_type IN ('initial','topup','refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  funded_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_prefunding_schedule ON schedule_prefunding(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_prefunding_status ON schedule_prefunding(status);
CREATE INDEX IF NOT EXISTS idx_schedule_prefunding_stripe ON schedule_prefunding(stripe_payment_intent_id);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_prefunding ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "svc_recurring_schedules" ON recurring_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_schedule_occurrences" ON schedule_occurrences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "svc_schedule_prefunding" ON schedule_prefunding FOR ALL USING (true) WITH CHECK (true);

-- Public read on active schedules (for operator matching)
CREATE POLICY IF NOT EXISTS "read_active_schedules" ON recurring_schedules FOR SELECT USING (status = 'active');
CREATE POLICY IF NOT EXISTS "read_schedule_occurrences" ON schedule_occurrences FOR SELECT USING (true);
