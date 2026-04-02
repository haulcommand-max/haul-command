-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 080 — ENTERPRISE REVENUE LAYER
-- Recurring revenue, private APIs, capacity guarantees, enterprise buyers
-- This is where Haul Command stops chasing one-offs.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── enterprise_contracts ──
CREATE TABLE IF NOT EXISTS public.enterprise_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  country_id uuid REFERENCES public.countries(id),
  corridor_id uuid REFERENCES public.hc_corridors(id),
  contract_key text UNIQUE NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('reserved_capacity','recurring_lane','private_network','compliance_api','data_api','enterprise_dashboard','mixed')),
  status text DEFAULT 'draft' CHECK (status IN ('draft','pending_signature','active','paused','expired','terminated')),
  billing_mode text NOT NULL CHECK (billing_mode IN ('monthly','annual','per_job','minimum_commitment','hybrid')),
  minimum_commitment numeric(12,2),
  currency_code char(3),
  starts_at date,
  ends_at date,
  scope_rules jsonb DEFAULT '{}'::jsonb,
  price_rules jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ec_buyer ON public.enterprise_contracts(buyer_entity_id);
CREATE INDEX IF NOT EXISTS idx_ec_type ON public.enterprise_contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_ec_status ON public.enterprise_contracts(status);

-- ── service_level_agreements ──
CREATE TABLE IF NOT EXISTS public.service_level_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_contract_id uuid NOT NULL REFERENCES public.enterprise_contracts(id),
  sla_key text NOT NULL,
  response_window_minutes integer,
  coverage_rules jsonb DEFAULT '{}'::jsonb,
  backup_capacity_rules jsonb DEFAULT '{}'::jsonb,
  penalty_rules jsonb DEFAULT '{}'::jsonb,
  credit_rules jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','retired')),
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_sla_contract ON public.service_level_agreements(enterprise_contract_id);
CREATE INDEX IF NOT EXISTS idx_sla_status ON public.service_level_agreements(status);

-- ── reserved_capacity_blocks ──
CREATE TABLE IF NOT EXISTS public.reserved_capacity_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_contract_id uuid NOT NULL REFERENCES public.enterprise_contracts(id),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  corridor_id uuid REFERENCES public.hc_corridors(id),
  country_role_id uuid NOT NULL REFERENCES public.country_roles(id),
  reserved_count integer NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  release_cutoff_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active','partially_used','exhausted','released','expired')),
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_rcb_contract ON public.reserved_capacity_blocks(enterprise_contract_id);
CREATE INDEX IF NOT EXISTS idx_rcb_role ON public.reserved_capacity_blocks(country_role_id);
CREATE INDEX IF NOT EXISTS idx_rcb_starts ON public.reserved_capacity_blocks(starts_at);
CREATE INDEX IF NOT EXISTS idx_rcb_status ON public.reserved_capacity_blocks(status);

-- ── api_subscriptions ──
CREATE TABLE IF NOT EXISTS public.api_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  enterprise_contract_id uuid REFERENCES public.enterprise_contracts(id),
  api_product_key text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','delinquent')),
  billing_plan text NOT NULL,
  request_quota integer,
  price_amount numeric(12,2),
  currency_code char(3),
  stripe_price_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_as_buyer ON public.api_subscriptions(buyer_entity_id);
CREATE INDEX IF NOT EXISTS idx_as_product ON public.api_subscriptions(api_product_key);
CREATE INDEX IF NOT EXISTS idx_as_status ON public.api_subscriptions(status);

-- ── webhook_subscriptions ──
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_entity_id uuid NOT NULL REFERENCES public.market_entities(id),
  enterprise_contract_id uuid REFERENCES public.enterprise_contracts(id),
  endpoint_url text NOT NULL,
  event_types jsonb DEFAULT '[]'::jsonb,
  secret_ciphertext text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','disabled')),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ws_buyer ON public.webhook_subscriptions(buyer_entity_id);
CREATE INDEX IF NOT EXISTS idx_ws_status ON public.webhook_subscriptions(status);

-- Wire deferred FK: hc_jobs.enterprise_contract_id → enterprise_contracts.id
DO $$ BEGIN
  ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_enterprise_contract
    FOREIGN KEY (enterprise_contract_id) REFERENCES public.enterprise_contracts(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

SELECT public.attach_updated_at_trigger('public.enterprise_contracts');
