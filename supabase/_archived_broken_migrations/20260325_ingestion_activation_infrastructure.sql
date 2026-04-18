-- =================================================================
-- HAUL COMMAND — INGESTION + ACTIVATION INFRASTRUCTURE
-- Supabase migration: queue, operators, events, escrow, affiliates
-- Merges with existing schema (upgrade only, never downgrade)
-- =================================================================

-- ─── OPERATORS TABLE (production scale) ──────────────────────
CREATE TABLE IF NOT EXISTS operators (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  haul_command_id TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT UNIQUE,
  email           TEXT,
  website         TEXT,
  address         TEXT,
  country         TEXT,
  region          TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  rating          NUMERIC(3,2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  services        JSONB DEFAULT '[]'::jsonb,
  enrichment_score INTEGER DEFAULT 0,
  quality_score   INTEGER DEFAULT 0,
  source          TEXT DEFAULT 'manual',
  last_seen_at    TIMESTAMPTZ DEFAULT now(),
  claimed         BOOLEAN DEFAULT FALSE,
  claimed_at      TIMESTAMPTZ,
  claim_token     TEXT,
  activation_status TEXT DEFAULT 'unclaimed' CHECK (activation_status IN ('unclaimed','claimed','active','dormant')),
  profile_views   INTEGER DEFAULT 0,
  available_jobs_nearby INTEGER DEFAULT 0,
  missed_revenue_estimate NUMERIC(10,2) DEFAULT 0,
  heat_score      INTEGER DEFAULT 0,
  contact_attempts INTEGER DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operators_country ON operators(country);
CREATE INDEX IF NOT EXISTS idx_operators_region ON operators(region);
CREATE INDEX IF NOT EXISTS idx_operators_quality ON operators(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_operators_claimed ON operators(claimed);
CREATE INDEX IF NOT EXISTS idx_operators_activation ON operators(activation_status);
CREATE INDEX IF NOT EXISTS idx_operators_heat ON operators(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_operators_geo ON operators USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ─── INGESTION QUEUE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_queue (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query           TEXT NOT NULL,
  country_code    TEXT NOT NULL,
  region          TEXT,
  tier            TEXT DEFAULT 'A' CHECK (tier IN ('A','B','C','D')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  attempts        INTEGER DEFAULT 0,
  results_count   INTEGER DEFAULT 0,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingestion_queue_status ON ingestion_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_queue_tier ON ingestion_queue(tier);

-- ─── INGESTION EVENTS (observability) ────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type            TEXT NOT NULL,
  payload         JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── ESCROW TABLE (financial engine) ─────────────────────────
CREATE TABLE IF NOT EXISTS escrow_records (
  id              TEXT PRIMARY KEY,
  job_id          TEXT NOT NULL,
  broker_id       TEXT NOT NULL,
  operator_id     TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL,
  currency        TEXT DEFAULT 'usd',
  status          TEXT DEFAULT 'funded' CHECK (status IN ('funded','held','released','disputed','refunded')),
  funded_at       TIMESTAMPTZ DEFAULT now(),
  release_conditions JSONB DEFAULT '[]'::jsonb,
  auto_release_at TIMESTAMPTZ,
  released_at     TIMESTAMPTZ,
  dispute_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_records(status);
CREATE INDEX IF NOT EXISTS idx_escrow_broker ON escrow_records(broker_id);
CREATE INDEX IF NOT EXISTS idx_escrow_operator ON escrow_records(operator_id);

-- ─── CERTIFICATIONS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id     TEXT NOT NULL,
  type            TEXT NOT NULL,
  issuing_authority TEXT,
  issuing_country TEXT,
  document_url    TEXT,
  expiration_date DATE,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','expired')),
  confidence_score NUMERIC(4,3) DEFAULT 0,
  extracted_data  JSONB DEFAULT '{}'::jsonb,
  verified_at     TIMESTAMPTZ,
  verified_by     TEXT DEFAULT 'ai',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certs_operator ON certifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_certs_status ON certifications(status);

-- ─── AFFILIATES TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliates (
  id              TEXT PRIMARY KEY,
  user_id         TEXT UNIQUE NOT NULL,
  referral_code   TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(4,3) DEFAULT 0.10,
  tier            TEXT DEFAULT 'standard' CHECK (tier IN ('standard','pro','elite')),
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_payout_cents INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id    TEXT REFERENCES affiliates(id),
  referred_user_id TEXT NOT NULL,
  referred_type   TEXT DEFAULT 'operator' CHECK (referred_type IN ('operator','broker')),
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','activated','paid','expired')),
  commission_cents INTEGER DEFAULT 0,
  referred_at     TIMESTAMPTZ DEFAULT now(),
  activated_at    TIMESTAMPTZ
);

-- ─── CORRIDOR INTELLIGENCE TABLE ─────────────────────────────
CREATE TABLE IF NOT EXISTS corridor_intel (
  key             TEXT PRIMARY KEY,
  origin          TEXT NOT NULL,
  destination     TEXT NOT NULL,
  demand_count    INTEGER DEFAULT 0,
  avg_rate_cents  INTEGER DEFAULT 0,
  min_rate_cents  INTEGER DEFAULT 0,
  max_rate_cents  INTEGER DEFAULT 0,
  operator_density INTEGER DEFAULT 0,
  trend           TEXT DEFAULT 'stable' CHECK (trend IN ('rising','stable','falling')),
  urgency_factor  NUMERIC(3,2) DEFAULT 0.50,
  last_load_at    TIMESTAMPTZ,
  last_updated    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridor_demand ON corridor_intel(demand_count DESC);

-- ─── BROKER PROFILES TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS broker_profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name    TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  loads_posted    INTEGER DEFAULT 0,
  active_status   TEXT DEFAULT 'lead' CHECK (active_status IN ('lead','demo','trial','paid','churned')),
  payment_score   INTEGER DEFAULT 50,
  claim_status    TEXT DEFAULT 'unclaimed',
  avg_payment_days NUMERIC(5,1) DEFAULT 30,
  cancellation_rate NUMERIC(4,3) DEFAULT 0,
  operator_feedback_avg NUMERIC(3,2) DEFAULT 3.0,
  reputation_score INTEGER DEFAULT 50,
  reputation_badge TEXT DEFAULT 'Standard',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── EQUIPMENT STORE ORDERS TABLE ────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_orders (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id     TEXT,
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cents     INTEGER NOT NULL,
  payment_method  TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe','escrow_deduction','invoice')),
  escrow_id       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  shipping_address JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── RLS POLICIES ────────────────────────────────────────────
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_orders ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (ingestion workers use service role)
CREATE POLICY "service_role_all_operators" ON operators FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_escrow" ON escrow_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_certs" ON certifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_affiliates" ON affiliates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_brokers" ON broker_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_equipment" ON equipment_orders FOR ALL USING (auth.role() = 'service_role');

-- Public read for operators directory
CREATE POLICY "public_read_operators" ON operators FOR SELECT USING (true);
