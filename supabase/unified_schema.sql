-- ============================================================================
-- HAUL COMMAND UNIFIED MASTER SCHEMA
-- ============================================================================
-- Merged from:
-- 1. Antigravity Canonical Schema (The Spine)
-- 2. Escort Directory Schema (Trust, Profiles, Listings)
-- 3. Monetization Schema (Wallets, Payments, SaaS)
--
-- Rule 0: Anti-Downgrade Spine — Additive changes only.
-- ============================================================================

-- 0) EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Required for geo-matching

-- ============================================================================
-- 1) ENUMS & TYPES
-- ============================================================================

-- Auth & Verification
CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'bounced');
CREATE TYPE preferred_channel   AS ENUM ('phone', 'email', 'sms', 'app');
CREATE TYPE onboarding_stage    AS ENUM (
  'account_created', 'identity_added', 'capabilities_set', 
  'docs_uploaded', 'verified', 'monetization_active'
);

-- Lead & Job Lifecycle
CREATE TYPE lead_type AS ENUM (
  'escort_request', 'route_survey', 'steer_man',
  'bucket_line', 'pilot_chase', 'permit_help', 'police_coord', 'other'
);
CREATE TYPE lead_status AS ENUM (
  'new', 'qualified', 'dispatched', 'assigned',
  'completed', 'dead', 'archived'
);
CREATE TYPE assignment_status AS ENUM (
  'assigned', 'accepted', 'enroute', 'on_site', 'completed', 'canceled'
);

-- Providers
CREATE TYPE provider_type AS ENUM (
  'pilot_car', 'route_surveyor', 'steer_man',
  'bucket_line', 'police_coord', 'permit_runner', 'broker', 'carrier'
);
CREATE TYPE availability_status AS ENUM ('available', 'limited', 'unavailable');

-- Sourcing
CREATE TYPE source_type  AS ENUM ('rss', 'api', 'crawl', 'manual', 'email');
CREATE TYPE parse_status AS ENUM ('new', 'parsed', 'rejected');

-- Monetization
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');
CREATE TYPE wallet_status       AS ENUM ('active', 'frozen', 'closed');
CREATE TYPE transaction_type    AS ENUM ('charge', 'payout', 'fee', 'refund', 'dispatch_fee', 'quick_pay_fee');
CREATE TYPE transaction_status  AS ENUM ('pending', 'settled', 'failed', 'disputed');

-- ============================================================================
-- 2) AUTH & USER PROFILES
-- ============================================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active'
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('escort', 'broker', 'shipper', 'vendor', 'admin', 'dispatcher')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  legal_name TEXT,
  business_name TEXT,
  onboarding_stage onboarding_stage DEFAULT 'account_created',
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  notifications JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3) COMPANIES & IDENTITY (The Hub)
-- ============================================================================

CREATE TABLE public.companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Account Owner
  name          TEXT NOT NULL,
  legal_name    TEXT,
  domain        TEXT UNIQUE,
  hall_command_id TEXT UNIQUE, -- HC-XXXX format
  
  -- Location
  hq_city       TEXT,
  hq_state      TEXT,
  hq_country    TEXT DEFAULT 'US',
  hq_lat        NUMERIC(10,7),
  hq_lng        NUMERIC(10,7),
  
  -- Dimensions & Tags
  industry_tags TEXT[] DEFAULT '{}',
  is_buyer      BOOLEAN DEFAULT FALSE,
  is_provider   BOOLEAN DEFAULT FALSE,
  
  -- Trust
  quality_score NUMERIC(5,2) DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  verification_status verification_status DEFAULT 'unverified',
  
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_hall_id ON public.companies(hall_command_id);
CREATE INDEX idx_companies_state   ON public.companies(hq_state);

CREATE TABLE public.contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  role_title          TEXT,
  phone_e164          TEXT, -- Normalized
  email               TEXT,
  preferred_channel   preferred_channel DEFAULT 'phone',
  is_primary          BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4) PROVIDERS (Specialized Operators)
-- ============================================================================

CREATE TABLE public.providers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.users(id), -- If individual operator
  provider_type       provider_type NOT NULL DEFAULT 'pilot_car',
  
  -- Operational Details
  home_base_lat       NUMERIC(10,7),
  home_base_lng       NUMERIC(10,7),
  service_radius_miles INTEGER,
  years_experience    INTEGER DEFAULT 0,
  
  -- Availability & Performance
  availability_status availability_status DEFAULT 'available',
  rating_score        NUMERIC(5,2) DEFAULT 50 CHECK (rating_score BETWEEN 0 AND 100),
  response_speed_score NUMERIC(5,2) DEFAULT 50,
  completion_rate     NUMERIC(5,4) DEFAULT 1.0,
  
  -- Metadata
  bio                 TEXT,
  logo_url            TEXT,
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.coverage_areas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  state_province TEXT NOT NULL,
  corridors     TEXT[], -- ['I-10', 'US-301']
  counties      TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  type          TEXT CHECK (type IN ('high_pole', 'amber_lights', 'dashcam', 'cones', 'signs', 'vehicle')),
  description   TEXT,
  verified      BOOLEAN DEFAULT FALSE,
  status        TEXT DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5) INTELLIGENCE & LEADS (Demand)
-- ============================================================================

CREATE TABLE public.sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  type             source_type NOT NULL,
  base_url         TEXT,
  trusted          BOOLEAN DEFAULT FALSE,
  rate_limit_rps   INTEGER DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type           lead_type NOT NULL DEFAULT 'other',
  
  -- Buyer Info
  buyer_company_id    UUID REFERENCES public.companies(id),
  buyer_contact_id    UUID REFERENCES public.contacts(id),
  
  -- Route
  origin_city         TEXT,
  origin_state        TEXT,
  origin_lat          NUMERIC(10,7),
  origin_lng          NUMERIC(10,7),
  
  dest_city           TEXT,
  dest_state          TEXT,
  dest_lat            NUMERIC(10,7),
  dest_lng            NUMERIC(10,7),
  
  -- Load Specs
  width_in            INTEGER,
  height_in           INTEGER,
  length_in           INTEGER,
  weight_lb           INTEGER,
  
  -- Requirements
  pickup_date         DATE,
  needs_high_pole     BOOLEAN DEFAULT FALSE,
  needs_route_survey  BOOLEAN DEFAULT FALSE,
  
  -- Lifecycle
  status              lead_status DEFAULT 'new',
  score               NUMERIC(5,2) DEFAULT 0, -- Overall value score
  notes               TEXT,
  raw_payload         JSONB, -- Original data if scraped
  
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_geo_origin ON public.leads(origin_state);
CREATE INDEX idx_leads_status     ON public.leads(status);

-- ============================================================================
-- 6) MATCHING & MARKETPLACE
-- ============================================================================

CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  match_score     NUMERIC(5,2), -- 0-100 Suitability
  rank            INTEGER,
  status          TEXT DEFAULT 'potential', -- potential, viewed, contacted
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.offers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID REFERENCES public.matches(id),
  provider_id  UUID NOT NULL REFERENCES public.providers(id),
  lead_id      UUID NOT NULL REFERENCES public.leads(id),
  amount       NUMERIC(10,2),
  status       TEXT CHECK (status IN ('sent', 'viewed', 'accepted', 'declined', 'expired')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES public.leads(id),
  provider_id       UUID NOT NULL REFERENCES public.providers(id),
  agreed_rate       NUMERIC(10,2),
  status            assignment_status DEFAULT 'assigned',
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7) MONETIZATION (SaaS & Fintech)
-- ============================================================================

-- SaaS Plans
CREATE TABLE public.plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE, -- 'pro', 'enterprise'
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  features      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Plans
INSERT INTO public.plans (name, price_monthly, features) VALUES
  ('viewer', 0, '{"read_only": true}'),
  ('pro', 99, '{"bidding": true, "real_time": true}'),
  ('enterprise', 499, '{"api": true, "multi_seat": true}');

CREATE TABLE public.subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         UUID REFERENCES public.companies(id),
  plan_id            UUID REFERENCES public.plans(id),
  status             subscription_status DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Hall Pay Wallets
CREATE TABLE public.wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.companies(id), -- Business Wallet
  user_id     UUID REFERENCES public.users(id),     -- Personal Wallet
  balance     DECIMAL(12, 2) DEFAULT 0.00,
  currency    TEXT DEFAULT 'USD',
  status      wallet_status DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Credits Ledger (Pay-per-lead / Tokens)
CREATE TABLE public.credits_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id   UUID REFERENCES public.wallets(id),
  amount      INTEGER NOT NULL, -- +/- Credits
  reason      TEXT, -- 'referral', 'purchase', 'unlock_lead'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Transactions (Real Money)
CREATE TABLE public.transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id        UUID REFERENCES public.wallets(id), -- Impacted Wallet
  related_lead_id  UUID REFERENCES public.leads(id),
  
  type             transaction_type NOT NULL,
  amount_gross     DECIMAL(12, 2) NOT NULL,
  fee_amount       DECIMAL(12, 2) DEFAULT 0.00,
  amount_net       DECIMAL(12, 2) GENERATED ALWAYS AS (amount_gross - fee_amount) STORED,
  
  status           transaction_status DEFAULT 'pending',
  stripe_ref       TEXT,
  
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8) TRUST & AUDIT
-- ============================================================================

CREATE TABLE public.reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    UUID REFERENCES public.providers(id),
  reviewer_id    UUID REFERENCES public.users(id),
  assignment_id  UUID REFERENCES public.assignments(id), -- Verified link
  rating         INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  verified       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID, -- User or System
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  changes     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9) SECURITY POLICIES (RLS)
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads     ENABLE ROW LEVEL SECURITY;

-- Base Policy: Users see their own companies
CREATE POLICY "Users see own company" ON public.companies
  FOR ALL USING (auth.uid() = owner_user_id);

-- Base Policy: Public leads are visible (filtered by status in query)
CREATE POLICY "Public leads viewable" ON public.leads
  FOR SELECT USING (true); -- In prod, refine to status='new' or subscriber check

-- ============================================================================
-- 10) TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_update BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_leads_update BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- End Master Schema
