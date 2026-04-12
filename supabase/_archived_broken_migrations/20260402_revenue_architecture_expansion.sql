-- ============================================================================
-- REVENUE ARCHITECTURE EXPANSION — Phase 2 Monetization Tables
-- Adds missing tables identified in the ODS Domination Revenue Architecture
-- Depends on: profiles, provider_directory, offers, monetization_flags
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. corridor_subscriptions — Operators auto-dispatched for corridor loads
-- Revenue: $19/mo per corridor per operator
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.corridor_subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  corridor_slug       text NOT NULL,           -- e.g. 'i-10-tx-fl', 'us-20-id-or'
  corridor_display    text NOT NULL,           -- e.g. 'I-10 Texas → Florida'
  origin_state        text,
  destination_state   text,
  country_code        text NOT NULL DEFAULT 'us',
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
  stripe_subscription_id text,                 -- Stripe recurring charge ref
  price_cents         integer NOT NULL DEFAULT 1900,  -- $19.00/mo
  currency            text NOT NULL DEFAULT 'usd',
  auto_dispatch       boolean NOT NULL DEFAULT true,  -- auto-first-look on matching loads
  priority_rank       integer NOT NULL DEFAULT 0,     -- dispatch priority within corridor
  subscribed_at       timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  cancelled_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridor_subs_operator ON public.corridor_subscriptions(operator_id, status);
CREATE INDEX IF NOT EXISTS idx_corridor_subs_corridor ON public.corridor_subscriptions(corridor_slug, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_corridor_subs_unique ON public.corridor_subscriptions(operator_id, corridor_slug) WHERE status = 'active';

ALTER TABLE public.corridor_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY corridor_subs_owner ON public.corridor_subscriptions
  FOR ALL USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
CREATE POLICY corridor_subs_admin ON public.corridor_subscriptions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- 2. quote_requests — Inbound quote requests with fan-out routing
-- Revenue: $5/quote on non-Pro plans, free on Pro+
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id        uuid REFERENCES public.profiles(id),  -- NULL for anonymous
  requester_email     text,
  requester_phone     text,
  requester_company   text,

  -- Load details
  load_description    text NOT NULL,
  width_inches        numeric,
  height_inches       numeric,
  length_inches       numeric,
  weight_lbs          numeric,
  escorts_needed      integer NOT NULL DEFAULT 1,

  -- Route
  origin_city         text NOT NULL,
  origin_state        text NOT NULL,
  origin_country      text NOT NULL DEFAULT 'us',
  destination_city    text NOT NULL,
  destination_state   text NOT NULL,
  destination_country text NOT NULL DEFAULT 'us',

  -- Urgency + type
  urgency             text NOT NULL DEFAULT 'standard' CHECK (urgency IN ('standard','rush','emergency')),
  service_type        text NOT NULL DEFAULT 'escort' CHECK (service_type IN ('escort','pilot_car','height_pole','route_survey','project_planning')),

  -- Quote routing state
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','routed','quoted','accepted','expired','cancelled')),
  routed_to_count     integer NOT NULL DEFAULT 0,
  exclusive_buyer_id  uuid REFERENCES public.profiles(id),  -- NULL = standard fan-out
  exclusive_price_cents integer,                             -- Premium for exclusive lead

  -- Monetization
  quote_fee_cents     integer NOT NULL DEFAULT 0,  -- $5 per non-Pro quote
  fee_charged         boolean NOT NULL DEFAULT false,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz DEFAULT (now() + interval '72 hours')
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_requester ON public.quote_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_origin ON public.quote_requests(origin_state, origin_country);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY quote_requests_owner ON public.quote_requests
  FOR ALL USING (requester_id = auth.uid()) WITH CHECK (requester_id = auth.uid());
CREATE POLICY quote_requests_admin ON public.quote_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- 3. certification_records — Operator certifications with expiry tracking
-- Revenue: CEVO $299, CSE $449, state certs $99/state
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certification_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cert_type           text NOT NULL CHECK (cert_type IN ('cevo','cse','npca','state','osha','hazmat','defensive_driving','custom')),
  cert_name           text NOT NULL,           -- e.g. 'CEVO Certification', 'Texas Escort Flag Car'
  issuing_authority   text,                    -- e.g. 'Texas DOT', 'National Safety Council'
  cert_number         text,                    -- Certificate ID/number
  state_code          text,                    -- For state-specific certs
  country_code        text NOT NULL DEFAULT 'us',

  -- Lifecycle
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','pending','revoked','enrolled')),
  issued_at           date,
  expires_at          date,
  renewed_at          date,

  -- Enrollment tracking (for HC-sold certifications)
  enrolled_via_hc     boolean NOT NULL DEFAULT false,
  enrollment_price_cents integer,
  stripe_payment_id   text,

  -- Monitoring
  expiry_reminder_sent boolean NOT NULL DEFAULT false,
  auto_renew          boolean NOT NULL DEFAULT false,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cert_records_operator ON public.certification_records(operator_id, status);
CREATE INDEX IF NOT EXISTS idx_cert_records_expiry ON public.certification_records(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cert_records_type ON public.certification_records(cert_type, status);

ALTER TABLE public.certification_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY cert_records_owner ON public.certification_records
  FOR ALL USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
CREATE POLICY cert_records_admin ON public.certification_records
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
-- Carriers can see operator's active certs (public trust signal)
CREATE POLICY cert_records_public_read ON public.certification_records
  FOR SELECT USING (status = 'active');


-- ────────────────────────────────────────────────────────────────────────────
-- 4. coi_documents — Insurance certificate vault with expiry monitoring
-- Revenue: $9/mo for vault subscription (unlimited storage + auto-alerts)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coi_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type       text NOT NULL DEFAULT 'coi' CHECK (document_type IN ('coi','general_liability','umbrella','workers_comp','cargo','custom')),
  insurance_provider  text,
  policy_number       text,
  coverage_amount_cents bigint,                -- Coverage amount e.g. $1M = 100000000

  -- File storage
  file_url            text NOT NULL,           -- Supabase storage URL
  file_hash           text,                    -- SHA-256 for integrity

  -- Lifecycle
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','pending_review','rejected')),
  issued_at           date,
  expires_at          date NOT NULL,
  verified_at         timestamptz,
  verified_by         uuid REFERENCES public.profiles(id),

  -- Share links (carriers can verify via share link)
  share_token         text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_enabled       boolean NOT NULL DEFAULT false,

  -- Monitoring
  expiry_alert_30d    boolean NOT NULL DEFAULT false,
  expiry_alert_7d     boolean NOT NULL DEFAULT false,
  expiry_alert_1d     boolean NOT NULL DEFAULT false,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coi_docs_operator ON public.coi_documents(operator_id, status);
CREATE INDEX IF NOT EXISTS idx_coi_docs_expiry ON public.coi_documents(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_coi_docs_share ON public.coi_documents(share_token) WHERE share_enabled = true;

ALTER TABLE public.coi_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY coi_docs_owner ON public.coi_documents
  FOR ALL USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());
CREATE POLICY coi_docs_admin ON public.coi_documents
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
-- Shared COI visible via share_token (handled at API layer, not RLS)


-- ────────────────────────────────────────────────────────────────────────────
-- 5. standing_orders — Recurring escort dispatch for regular corridors
-- Revenue: $10/mo per active standing order
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.standing_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  corridor_slug       text NOT NULL,
  corridor_display    text NOT NULL,

  -- Recurrence
  frequency           text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily','weekly','biweekly','monthly')),
  preferred_day       text,                    -- e.g. 'monday', 'first_of_month'
  preferred_time      time,                    -- Preferred dispatch time

  -- Load specs (template)
  load_description    text,
  escorts_needed      integer NOT NULL DEFAULT 1,
  width_inches        numeric,
  height_inches       numeric,
  length_inches       numeric,
  weight_lbs          numeric,

  -- Auto-match preferences
  preferred_operator_id uuid REFERENCES public.profiles(id),
  auto_match          boolean NOT NULL DEFAULT true,
  max_rate_cents      integer,

  -- Status + billing
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','cancelled')),
  stripe_subscription_id text,
  price_cents         integer NOT NULL DEFAULT 1000,  -- $10/mo
  currency            text NOT NULL DEFAULT 'usd',
  jobs_created_count  integer NOT NULL DEFAULT 0,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_standing_orders_carrier ON public.standing_orders(carrier_id, status);
CREATE INDEX IF NOT EXISTS idx_standing_orders_corridor ON public.standing_orders(corridor_slug, status);

ALTER TABLE public.standing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY standing_orders_owner ON public.standing_orders
  FOR ALL USING (carrier_id = auth.uid()) WITH CHECK (carrier_id = auth.uid());
CREATE POLICY standing_orders_admin ON public.standing_orders
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- 6. page_sponsorships — Sponsor glossary terms, tools, emergency pages
-- Revenue: $49–$149/mo per tool or glossary category
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.page_sponsorships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_type           text NOT NULL CHECK (page_type IN ('glossary_term','tool','emergency','guide','regulation','corridor')),
  page_slug           text NOT NULL,           -- e.g. 'pilot-car', 'escort-calculator', 'i-10-corridor'
  page_display        text NOT NULL,           -- Display name for sponsor dashboard

  -- Sponsorship details
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','expired','cancelled')),
  tier                text NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard','premium','exclusive')),
  price_cents         integer NOT NULL,
  currency            text NOT NULL DEFAULT 'usd',
  stripe_subscription_id text,

  -- Display config
  sponsor_label       text,                    -- Custom sponsor name
  sponsor_logo_url    text,
  sponsor_cta_text    text,
  sponsor_cta_url     text,

  -- Performance
  impressions         bigint NOT NULL DEFAULT 0,
  clicks              bigint NOT NULL DEFAULT 0,

  starts_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_sponsorships_page ON public.page_sponsorships(page_type, page_slug, status);
CREATE INDEX IF NOT EXISTS idx_page_sponsorships_sponsor ON public.page_sponsorships(sponsor_id, status);

ALTER TABLE public.page_sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY page_sponsorships_owner ON public.page_sponsorships
  FOR ALL USING (sponsor_id = auth.uid()) WITH CHECK (sponsor_id = auth.uid());
CREATE POLICY page_sponsorships_admin ON public.page_sponsorships
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
-- Public read for rendering sponsored content
CREATE POLICY page_sponsorships_public_read ON public.page_sponsorships
  FOR SELECT USING (status = 'active');


-- ────────────────────────────────────────────────────────────────────────────
-- 7. enterprise_customers — Enterprise API + white-label account management
-- Revenue: $500–$10,000/mo API access, $2,000–$10,000/mo white-label
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enterprise_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name        text NOT NULL,
  company_domain      text,
  billing_email       text NOT NULL,

  -- Enterprise tier
  tier                text NOT NULL DEFAULT 'api_basic' CHECK (tier IN ('api_basic','api_pro','api_enterprise','white_label')),
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','suspended','cancelled')),

  -- API config
  api_key_hash        text NOT NULL,           -- SHA-256 of the API key
  api_key_prefix      text NOT NULL,           -- First 8 chars for identification (e.g. 'hc_live_')
  rate_limit_rpm      integer NOT NULL DEFAULT 60,   -- Requests per minute
  rate_limit_daily    integer NOT NULL DEFAULT 10000,

  -- White-label config
  white_label_enabled boolean NOT NULL DEFAULT false,
  white_label_domain  text,
  white_label_logo_url text,
  white_label_colors  jsonb DEFAULT '{}',

  -- Billing
  price_cents         integer NOT NULL,
  currency            text NOT NULL DEFAULT 'usd',
  stripe_subscription_id text,

  -- Usage tracking
  total_api_calls     bigint NOT NULL DEFAULT 0,
  current_month_calls bigint NOT NULL DEFAULT 0,
  last_api_call_at    timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_enterprise_api_prefix ON public.enterprise_customers(api_key_prefix);
CREATE INDEX IF NOT EXISTS idx_enterprise_profile ON public.enterprise_customers(profile_id);

ALTER TABLE public.enterprise_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY enterprise_owner ON public.enterprise_customers
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY enterprise_admin ON public.enterprise_customers
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- ────────────────────────────────────────────────────────────────────────────
-- 8. Extensions to existing offers table — urgency/rush pricing
-- Revenue: Rush $25 flat + 1.5x rate, After-hours 1.25x, Rescue $50 + 1.5x
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Add urgency_level if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'offers' AND column_name = 'urgency_level'
  ) THEN
    ALTER TABLE public.offers ADD COLUMN urgency_level text DEFAULT 'standard' 
      CHECK (urgency_level IN ('standard','rush','rescue','after_hours'));
  END IF;

  -- Add time_pricing_multiplier
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'offers' AND column_name = 'time_pricing_multiplier'
  ) THEN
    ALTER TABLE public.offers ADD COLUMN time_pricing_multiplier numeric(4,2) DEFAULT 1.00;
  END IF;

  -- Add rush_surcharge_cents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'offers' AND column_name = 'rush_surcharge_cents'
  ) THEN
    ALTER TABLE public.offers ADD COLUMN rush_surcharge_cents integer DEFAULT 0;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 9. Extensions to jobs table — payout type + consolidated invoicing
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'payout_type'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN payout_type text DEFAULT 'standard' 
      CHECK (payout_type IN ('standard','instant'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'instant_fee_cents'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN instant_fee_cents integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'consolidated_invoice_id'
  ) THEN
    ALTER TABLE public.jobs ADD COLUMN consolidated_invoice_id uuid;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────────────
-- 10. Extensions to provider_directory — sponsorship + lead tracking
-- ────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'provider_directory' AND column_name = 'sponsor_tier'
  ) THEN
    ALTER TABLE public.provider_directory ADD COLUMN sponsor_tier text DEFAULT NULL;
    ALTER TABLE public.provider_directory ADD COLUMN sponsor_expires_at timestamptz DEFAULT NULL;
    ALTER TABLE public.provider_directory ADD COLUMN lead_unlock_count integer DEFAULT 0;
    ALTER TABLE public.provider_directory ADD COLUMN claim_status text DEFAULT 'unclaimed' 
      CHECK (claim_status IN ('unclaimed','claimed','verified','suspended'));
  END IF;
END $$;


COMMIT;

-- ============================================================================
-- SUMMARY OF WHAT THIS MIGRATION CREATES
-- ============================================================================
-- 
-- NEW TABLES (7):
--   1. corridor_subscriptions  — $19/mo per corridor operator subscription
--   2. quote_requests          — Inbound quote routing with $5/quote fees
--   3. certification_records   — CEVO/CSE/state cert tracking + sales
--   4. coi_documents           — Insurance certificate vault ($9/mo)
--   5. standing_orders         — Recurring escort dispatch ($10/mo)
--   6. page_sponsorships       — Glossary/tool/page sponsors ($49-149/mo)
--   7. enterprise_customers    — Enterprise API access ($500-10K/mo)
--
-- TABLE EXTENSIONS (3):
--   - offers: urgency_level, time_pricing_multiplier, rush_surcharge_cents
--   - jobs: payout_type, instant_fee_cents, consolidated_invoice_id  
--   - provider_directory: sponsor_tier, sponsor_expires_at, lead_unlock_count, claim_status
--
-- EXISTING TABLES PRESERVED (already in DB):
--   - lead_unlocks (20260307)
--   - territory_sponsorships (20260307)
--   - monetization_flags (20260402)
--   - monetization_events (20260227)
--   - monetization_default_rules (20260402)
--   - hc_monetization_surfaces (20260402)
--   - escrow_payments / escrow_holds / hc_escrow_disputes
--   - hc_pay_payouts / payout_splits
--
-- ALL 39 MONETIZATION SURFACES NOW HAVE BACKING DATABASE OBJECTS.
