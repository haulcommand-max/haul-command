-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 060 — JOBS AND COMMERCE SPINE
-- Core jobs, line items, requirements, assignments, quotes, payouts, reserves
-- This is where every order becomes many monetized line items
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── hc_jobs — the upgraded canonical jobs table ──
-- Coexists with existing public.jobs; this is the OS-grade version
CREATE TABLE IF NOT EXISTS public.hc_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('escort','route_survey','permit','utility_support','traffic_control','police_coordination','recovery','staging','multi_role_move','other')),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  customer_entity_id uuid REFERENCES public.market_entities(id),
  broker_entity_id uuid REFERENCES public.market_entities(id),
  carrier_entity_id uuid REFERENCES public.market_entities(id),
  corridor_id uuid,  -- FK deferred
  intake_event_id uuid REFERENCES public.intake_events(id),
  enterprise_contract_id uuid,  -- FK deferred until phase 080
  load_type text,
  origin_label text,
  destination_label text,
  origin_lat numeric(9,6),
  origin_lng numeric(9,6),
  destination_lat numeric(9,6),
  destination_lng numeric(9,6),
  length_ft numeric(8,2),
  width_ft numeric(8,2),
  height_ft numeric(8,2),
  weight_lbs numeric(12,2),
  urgency_level text DEFAULT 'normal' CHECK (urgency_level IN ('normal','priority','urgent','emergency')),
  job_status text DEFAULT 'intake' CHECK (job_status IN ('intake','quoted','booked','dispatching','in_progress','completed','cancelled','failed')),
  customer_budget_min numeric(12,2),
  customer_budget_max numeric(12,2),
  currency_code char(3),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_country_type ON public.hc_jobs(country_id, job_type);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_status ON public.hc_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_urgency ON public.hc_jobs(urgency_level);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_corridor ON public.hc_jobs(corridor_id);

-- ── job_stack_line_items — every role, fee, surcharge is a line ──
CREATE TABLE IF NOT EXISTS public.job_stack_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.hc_jobs(id),
  line_item_type text NOT NULL CHECK (line_item_type IN ('role','fee','surcharge','bounty','tax','referral','sponsorship_credit','platform_take','reserve_hold','insurance','financing','dispute_fee','other')),
  country_role_id uuid REFERENCES public.country_roles(id),
  assigned_entity_id uuid REFERENCES public.market_entities(id),
  label text NOT NULL,
  quantity numeric(12,2) DEFAULT 1,
  unit_basis text,
  unit_price numeric(12,2),
  provider_pay numeric(12,2),
  customer_price numeric(12,2),
  haul_command_margin numeric(12,2),
  currency_code char(3),
  is_required boolean DEFAULT true,
  is_visible_to_customer boolean DEFAULT true,
  is_settled boolean DEFAULT false,
  source_rule text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jsli_job ON public.job_stack_line_items(job_id);
CREATE INDEX IF NOT EXISTS idx_jsli_type ON public.job_stack_line_items(line_item_type);
CREATE INDEX IF NOT EXISTS idx_jsli_role ON public.job_stack_line_items(country_role_id);
CREATE INDEX IF NOT EXISTS idx_jsli_margin ON public.job_stack_line_items(haul_command_margin DESC);

-- ── job_role_requirements ──
CREATE TABLE IF NOT EXISTS public.job_role_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('job','template','country_default','archetype_default','corridor_default')),
  job_id uuid REFERENCES public.hc_jobs(id),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  country_role_id uuid NOT NULL REFERENCES public.country_roles(id),
  archetype_profile text,
  load_type text,
  dimension_thresholds jsonb DEFAULT '{}'::jsonb,
  required_count_min integer DEFAULT 1,
  required_count_max integer,
  mandatory boolean DEFAULT true,
  sequence_order integer DEFAULT 100,
  required_when_rules jsonb DEFAULT '{}'::jsonb,
  optional_upgrade_rules jsonb DEFAULT '{}'::jsonb,
  source_type text DEFAULT 'system_template',
  source_ref text,
  confidence text DEFAULT 'medium' CHECK (confidence IN ('low','medium','high')),
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_jrr_job ON public.job_role_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_jrr_country ON public.job_role_requirements(country_id);
CREATE INDEX IF NOT EXISTS idx_jrr_role ON public.job_role_requirements(country_role_id);
CREATE INDEX IF NOT EXISTS idx_jrr_mandatory ON public.job_role_requirements(mandatory);
CREATE INDEX IF NOT EXISTS idx_jrr_sequence ON public.job_role_requirements(sequence_order);

-- ── job_assignments ──
CREATE TABLE IF NOT EXISTS public.job_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.hc_jobs(id),
  country_role_id uuid NOT NULL REFERENCES public.country_roles(id),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  line_item_id uuid REFERENCES public.job_stack_line_items(id),
  assignment_status text DEFAULT 'proposed' CHECK (assignment_status IN ('proposed','invited','accepted','declined','cancelled','completed','no_show','replaced')),
  offered_pay numeric(12,2),
  currency_code char(3),
  fallback_rank integer DEFAULT 1,
  accept_by_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  proof_required boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ja_job ON public.job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_ja_entity ON public.job_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_ja_status ON public.job_assignments(assignment_status);
CREATE INDEX IF NOT EXISTS idx_ja_fallback ON public.job_assignments(fallback_rank);

-- ── job_quotes ──
CREATE TABLE IF NOT EXISTS public.job_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.hc_jobs(id),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_role_id uuid REFERENCES public.country_roles(id),
  quoted_amount numeric(12,2) NOT NULL,
  currency_code char(3) NOT NULL,
  quote_status text DEFAULT 'submitted' CHECK (quote_status IN ('submitted','shortlisted','accepted','rejected','withdrawn')),
  line_items jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_jq_job ON public.job_quotes(job_id);
CREATE INDEX IF NOT EXISTS idx_jq_entity ON public.job_quotes(entity_id);
CREATE INDEX IF NOT EXISTS idx_jq_status ON public.job_quotes(quote_status);

-- ── job_financials ──
CREATE TABLE IF NOT EXISTS public.job_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid UNIQUE NOT NULL REFERENCES public.hc_jobs(id),
  customer_price numeric(12,2),
  provider_pay_total numeric(12,2),
  haul_command_take numeric(12,2),
  extras_total numeric(12,2),
  gross_margin numeric(12,2),
  currency_code char(3),
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','authorized','partially_paid','paid','refunded','chargeback')),
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jf_payment ON public.job_financials(payment_status);
CREATE INDEX IF NOT EXISTS idx_jf_margin ON public.job_financials(gross_margin DESC);

-- ── pricing_observations — raw market pricing, never collapsed ──
CREATE TABLE IF NOT EXISTS public.pricing_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  country_role_id uuid REFERENCES public.country_roles(id),
  permit_actor_id uuid,  -- FK deferred
  job_id uuid REFERENCES public.hc_jobs(id),
  region_code text,
  city_or_corridor text,
  service_type text NOT NULL,
  load_type text,
  pricing_basis text NOT NULL,
  currency_code char(3) NOT NULL,
  tax_included boolean DEFAULT false,
  base_min numeric(12,2), base_max numeric(12,2), minimum_charge numeric(12,2),
  hourly_min numeric(12,2), hourly_max numeric(12,2),
  daily_min numeric(12,2), daily_max numeric(12,2),
  distance_min numeric(12,2), distance_max numeric(12,2),
  standby_min numeric(12,2), standby_max numeric(12,2),
  detention_min numeric(12,2), detention_max numeric(12,2),
  after_hours_multiplier numeric(6,2), weekend_multiplier numeric(6,2), holiday_multiplier numeric(6,2),
  deadhead_min numeric(12,2), deadhead_max numeric(12,2),
  repositioning_min numeric(12,2), repositioning_max numeric(12,2),
  cancellation_min numeric(12,2), cancellation_max numeric(12,2),
  no_go_min numeric(12,2), no_go_max numeric(12,2),
  utility_add_on_min numeric(12,2), utility_add_on_max numeric(12,2),
  police_add_on_min numeric(12,2), police_add_on_max numeric(12,2),
  route_survey_min numeric(12,2), route_survey_max numeric(12,2),
  complexity_premium_notes text,
  source_type text NOT NULL,
  source_name text, source_url text, source_ref text,
  observation_date date NOT NULL,
  confidence_label text NOT NULL CHECK (confidence_label IN ('low','medium','high','verified')),
  internal_only_or_public text DEFAULT 'internal' CHECK (internal_only_or_public IN ('internal','public')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_country_svc ON public.pricing_observations(country_id, service_type);
CREATE INDEX IF NOT EXISTS idx_po_role ON public.pricing_observations(country_role_id);
CREATE INDEX IF NOT EXISTS idx_po_source ON public.pricing_observations(source_type);
CREATE INDEX IF NOT EXISTS idx_po_date ON public.pricing_observations(observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_confidence ON public.pricing_observations(confidence_label);

-- ── wallets_ledger ──
CREATE TABLE IF NOT EXISTS public.wallets_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  job_id uuid REFERENCES public.hc_jobs(id),
  entry_type text NOT NULL CHECK (entry_type IN ('charge','credit','payout','reserve_hold','reserve_release','dispute_hold','dispute_release','fee','refund','adjustment')),
  direction text NOT NULL CHECK (direction IN ('debit','credit')),
  amount numeric(12,2) NOT NULL,
  currency_code char(3) NOT NULL,
  status text DEFAULT 'posted' CHECK (status IN ('pending','posted','failed','reversed')),
  external_processor text,
  external_reference text,
  memo text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wl_entity ON public.wallets_ledger(entity_id);
CREATE INDEX IF NOT EXISTS idx_wl_job ON public.wallets_ledger(job_id);
CREATE INDEX IF NOT EXISTS idx_wl_type ON public.wallets_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_wl_created ON public.wallets_ledger(created_at DESC);

-- ── payout_splits ──
CREATE TABLE IF NOT EXISTS public.payout_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.hc_jobs(id),
  assignment_id uuid REFERENCES public.job_assignments(id),
  payee_entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  split_role text NOT NULL,
  gross_amount numeric(12,2) NOT NULL,
  fee_amount numeric(12,2) DEFAULT 0,
  net_amount numeric(12,2) NOT NULL,
  currency_code char(3) NOT NULL,
  settlement_status text DEFAULT 'pending' CHECK (settlement_status IN ('pending','ready','processing','paid','failed','reversed')),
  external_payout_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ps_job ON public.payout_splits(job_id);
CREATE INDEX IF NOT EXISTS idx_ps_payee ON public.payout_splits(payee_entity_id);
CREATE INDEX IF NOT EXISTS idx_ps_settlement ON public.payout_splits(settlement_status);

-- ── reserves ──
CREATE TABLE IF NOT EXISTS public.reserves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.hc_jobs(id),
  entity_id uuid REFERENCES public.market_entities(id),
  reserve_type text NOT NULL CHECK (reserve_type IN ('customer_deposit','dispute_hold','weather_hold','capacity_hold','fast_pay_hold','tax_hold')),
  amount numeric(12,2) NOT NULL,
  currency_code char(3) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','released','consumed','expired')),
  held_at timestamptz DEFAULT now(),
  released_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_reserves_job ON public.reserves(job_id);
CREATE INDEX IF NOT EXISTS idx_reserves_status ON public.reserves(status);
CREATE INDEX IF NOT EXISTS idx_reserves_type ON public.reserves(reserve_type);

-- Add FK from intake_events.created_job_id → hc_jobs.id (deferred)
DO $$ BEGIN
  ALTER TABLE public.intake_events ADD CONSTRAINT fk_intake_created_job
    FOREIGN KEY (created_job_id) REFERENCES public.hc_jobs(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Attach triggers
SELECT public.attach_updated_at_trigger('public.hc_jobs');
SELECT public.attach_updated_at_trigger('public.job_stack_line_items');
SELECT public.attach_updated_at_trigger('public.job_assignments');
SELECT public.attach_updated_at_trigger('public.job_financials');
SELECT public.attach_updated_at_trigger('public.pricing_observations');
SELECT public.attach_updated_at_trigger('public.payout_splits');
