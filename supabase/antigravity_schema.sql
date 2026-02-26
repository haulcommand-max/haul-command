-- ============================================================================
-- ANTIGRAVITY: CANONICAL PRODUCTION SCHEMA
-- ============================================================================
-- Rule 0: Anti-Downgrade Spine — additive only. No destructive migrations.
-- UUID PKs. Timestamps everywhere. Soft deletes. RLS on all tables.
-- ============================================================================

-- ===================== ENUMS =====================

CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'bounced');
CREATE TYPE preferred_channel   AS ENUM ('phone', 'email', 'sms', 'app');
CREATE TYPE source_type         AS ENUM ('rss', 'api', 'crawl', 'manual', 'email');
CREATE TYPE parse_status        AS ENUM ('new', 'parsed', 'rejected');

CREATE TYPE lead_type AS ENUM (
  'escort_request', 'route_survey', 'steer_man',
  'bucket_line', 'pilot_chase', 'permit_help', 'other'
);
CREATE TYPE lead_status AS ENUM (
  'new', 'qualified', 'dispatched', 'assigned',
  'completed', 'dead', 'archived'
);

CREATE TYPE provider_type AS ENUM (
  'pilot_car', 'route_surveyor', 'steer_man',
  'bucket_line', 'police_coord', 'permit_runner'
);
CREATE TYPE availability_status AS ENUM ('available', 'limited', 'unavailable');

CREATE TYPE credential_type AS ENUM (
  'state_cert', 'insurance', 'background_check', 'twic', 'other'
);

CREATE TYPE offer_status AS ENUM ('sent', 'viewed', 'accepted', 'declined', 'expired');
CREATE TYPE assignment_status AS ENUM (
  'assigned', 'enroute', 'on_site', 'completed', 'canceled'
);
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled');


-- ===================== CORE ENTITIES =====================

-- 1. COMPANIES
CREATE TABLE public.companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  legal_name    TEXT,
  domain        TEXT UNIQUE,
  gbp_place_id  TEXT,
  hq_city       TEXT,
  hq_state      TEXT,
  hq_country    TEXT DEFAULT 'US',
  industry_tags TEXT[] DEFAULT '{}',
  is_buyer      BOOLEAN DEFAULT FALSE,
  is_provider   BOOLEAN DEFAULT FALSE,
  quality_score NUMERIC(5,2) DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_state  ON public.companies(hq_state);
CREATE INDEX idx_companies_buyer  ON public.companies(is_buyer)  WHERE is_buyer = TRUE;
CREATE INDEX idx_companies_provider ON public.companies(is_provider) WHERE is_provider = TRUE;

COMMENT ON TABLE public.companies IS 'Buyers and providers in the Antigravity ecosystem.';


-- 2. CONTACTS
CREATE TABLE public.contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  role_title          TEXT,
  phone_e164          TEXT,
  email               TEXT,
  preferred_channel   preferred_channel DEFAULT 'phone',
  verification_status verification_status DEFAULT 'unverified',
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE INDEX idx_contacts_email   ON public.contacts(email) WHERE email IS NOT NULL;

COMMENT ON TABLE public.contacts IS 'People attached to companies. E.164 phone format enforced at app layer.';


-- ===================== LEAD INTAKE + SIGNALS =====================

-- 3. SOURCES (connector registry)
CREATE TABLE public.sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  type             source_type NOT NULL,
  base_url         TEXT,
  allowed          BOOLEAN DEFAULT TRUE,
  robots_respected BOOLEAN DEFAULT TRUE,
  rate_limit_rps   INTEGER DEFAULT 1,
  last_success_at  TIMESTAMPTZ,
  last_fail_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.sources IS 'Registry of all data connectors (RSS, API, crawl, manual, email).';


-- 4. RAW EVENTS (ingestion landing zone)
CREATE TABLE public.raw_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id      UUID NOT NULL REFERENCES public.sources(id),
  source_url     TEXT,
  raw_payload    JSONB NOT NULL,
  fetched_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash_signature TEXT NOT NULL,
  parse_status   parse_status DEFAULT 'new',
  reject_reason  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_raw_events_hash ON public.raw_events(hash_signature);
CREATE INDEX idx_raw_events_source      ON public.raw_events(source_id);
CREATE INDEX idx_raw_events_status      ON public.raw_events(parse_status);

COMMENT ON TABLE public.raw_events IS 'Raw ingestion landing zone. hash_signature prevents exact duplicates.';


-- 5. LEADS
CREATE TABLE public.leads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type           lead_type NOT NULL DEFAULT 'other',
  buyer_company_id    UUID REFERENCES public.companies(id),
  buyer_contact_id    UUID REFERENCES public.contacts(id),
  origin_text         TEXT,
  dest_text           TEXT,
  origin_lat          NUMERIC(10,7),
  origin_lng          NUMERIC(10,7),
  dest_lat            NUMERIC(10,7),
  dest_lng            NUMERIC(10,7),
  pickup_date         DATE,
  time_window         TEXT,
  load_length_ft      NUMERIC(8,2),
  load_width_ft       NUMERIC(8,2),
  load_height_ft      NUMERIC(8,2),
  load_weight_lb      NUMERIC(12,2),
  needs_high_pole     BOOLEAN DEFAULT FALSE,
  needs_route_survey  BOOLEAN DEFAULT FALSE,
  needs_bucket_line   BOOLEAN DEFAULT FALSE,
  notes               TEXT,
  status              lead_status DEFAULT 'new',
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status     ON public.leads(status);
CREATE INDEX idx_leads_type       ON public.leads(lead_type);
CREATE INDEX idx_leads_pickup     ON public.leads(pickup_date) WHERE pickup_date IS NOT NULL;
CREATE INDEX idx_leads_created    ON public.leads(created_at DESC);
CREATE INDEX idx_leads_buyer      ON public.leads(buyer_company_id) WHERE buyer_company_id IS NOT NULL;

COMMENT ON TABLE public.leads IS 'Qualified lead records with full load specs and lifecycle status.';


-- 6. LEAD_SOURCES (many-to-many: lead ↔ raw_event provenance)
CREATE TABLE public.lead_sources (
  lead_id       UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  raw_event_id  UUID NOT NULL REFERENCES public.raw_events(id),
  source_url    TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lead_id, raw_event_id)
);

COMMENT ON TABLE public.lead_sources IS 'Provenance trail: which raw events produced each lead.';


-- ===================== SCORING + QUALIFICATION =====================

-- 7. LEAD SCORES
CREATE TABLE public.lead_scores (
  lead_id             UUID PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  intent_score        NUMERIC(5,2) DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  freshness_score     NUMERIC(5,2) DEFAULT 0 CHECK (freshness_score BETWEEN 0 AND 100),
  fit_score           NUMERIC(5,2) DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  contactability_score NUMERIC(5,2) DEFAULT 0 CHECK (contactability_score BETWEEN 0 AND 100),
  geo_score           NUMERIC(5,2) DEFAULT 0 CHECK (geo_score BETWEEN 0 AND 100),
  overall_score       NUMERIC(5,2) DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  score_explain       JSONB DEFAULT '{}',
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_scores_overall ON public.lead_scores(overall_score DESC);

COMMENT ON TABLE public.lead_scores IS '5-axis scoring with transparent explain JSON.';


-- 8. LEAD REQUIREMENTS
CREATE TABLE public.lead_requirements (
  lead_id               UUID PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  required_services     TEXT[] DEFAULT '{}',
  min_experience_years  INTEGER,
  certifications_required TEXT[] DEFAULT '{}',
  equipment_required    TEXT[] DEFAULT '{}',
  travel_constraints    JSONB
);

COMMENT ON TABLE public.lead_requirements IS 'Hard requirements for matching: services, certs, equipment.';


-- ===================== PROVIDERS =====================

-- 9. PROVIDERS
CREATE TABLE public.providers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES public.companies(id),
  provider_type       provider_type NOT NULL,
  home_base_lat       NUMERIC(10,7),
  home_base_lng       NUMERIC(10,7),
  service_area        JSONB DEFAULT '{}',
  availability_status availability_status DEFAULT 'available',
  rating_score        NUMERIC(5,2) DEFAULT 50 CHECK (rating_score BETWEEN 0 AND 100),
  response_speed_score NUMERIC(5,2) DEFAULT 50 CHECK (response_speed_score BETWEEN 0 AND 100),
  completion_rate     NUMERIC(5,4) DEFAULT 1.0,
  cancellation_rate   NUMERIC(5,4) DEFAULT 0.0,
  deleted_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_providers_type   ON public.providers(provider_type);
CREATE INDEX idx_providers_avail  ON public.providers(availability_status);
CREATE INDEX idx_providers_rating ON public.providers(rating_score DESC);

COMMENT ON TABLE public.providers IS 'Operators and vendors with capability, location, and performance data.';


-- 10. PROVIDER CAPABILITIES
CREATE TABLE public.provider_capabilities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  capabilities TEXT[] DEFAULT '{}',
  max_height_ft NUMERIC(6,2),
  notes        TEXT
);

CREATE INDEX idx_provider_caps ON public.provider_capabilities(provider_id);

COMMENT ON TABLE public.provider_capabilities IS 'Capability flags: high_pole, route_survey, night_ops, etc.';


-- 11. PROVIDER CREDENTIALS
CREATE TABLE public.provider_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  credential_type credential_type NOT NULL,
  issuer          TEXT,
  credential_id   TEXT,
  expires_at      DATE,
  verified        BOOLEAN DEFAULT FALSE,
  document_url    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_creds_provider ON public.provider_credentials(provider_id);
CREATE INDEX idx_provider_creds_expiry   ON public.provider_credentials(expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE public.provider_credentials IS 'State certs, insurance, TWIC, background checks with expiry tracking.';


-- ===================== MATCHING + DISPATCH =====================

-- 12. MATCHES
CREATE TABLE public.matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID NOT NULL REFERENCES public.leads(id),
  provider_id     UUID NOT NULL REFERENCES public.providers(id),
  eligibility_pass BOOLEAN DEFAULT FALSE,
  match_score     NUMERIC(5,2) DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  rank            INTEGER,
  match_explain   JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_lead     ON public.matches(lead_id);
CREATE INDEX idx_matches_provider ON public.matches(provider_id);
CREATE INDEX idx_matches_score    ON public.matches(match_score DESC);

COMMENT ON TABLE public.matches IS 'Eligibility + ranking results with transparent explain JSON.';


-- 13. OFFERS
CREATE TABLE public.offers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  offer_status offer_status DEFAULT 'sent',
  rate_quote   NUMERIC(10,2),
  expires_at   TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_offers_match  ON public.offers(match_id);
CREATE INDEX idx_offers_status ON public.offers(offer_status);

COMMENT ON TABLE public.offers IS 'Offer lifecycle: sent → viewed → accepted/declined/expired.';


-- 14. ASSIGNMENTS
CREATE TABLE public.assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES public.leads(id),
  provider_id       UUID NOT NULL REFERENCES public.providers(id),
  assignment_status assignment_status DEFAULT 'assigned',
  agreed_rate       NUMERIC(10,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_lead     ON public.assignments(lead_id);
CREATE INDEX idx_assignments_provider ON public.assignments(provider_id);
CREATE INDEX idx_assignments_status   ON public.assignments(assignment_status);

COMMENT ON TABLE public.assignments IS 'State machine: assigned → enroute → on_site → completed/canceled.';


-- ===================== MONETIZATION + ACCESS =====================

-- 15. PLANS
CREATE TABLE public.plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  features      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.plans IS 'Subscription tiers: free, pro, dispatcher, enterprise.';

-- Seed default plans
INSERT INTO public.plans (name, monthly_price, features) VALUES
  ('free',       0,     '{"lead_delay_hours": 24, "daily_digest": true,  "real_time": false, "match_dispatch": false}'),
  ('pro',       99,     '{"lead_delay_hours": 0,  "daily_digest": true,  "real_time": true,  "match_dispatch": true, "rank_boost": true}'),
  ('dispatcher', 249,   '{"lead_delay_hours": 0,  "daily_digest": true,  "real_time": true,  "match_dispatch": true, "multi_provider": true, "team_seats": 5, "sla_tools": true}'),
  ('enterprise', 999,   '{"lead_delay_hours": 0,  "daily_digest": true,  "real_time": true,  "match_dispatch": true, "multi_provider": true, "team_seats": 25, "api_access": true, "regional_exclusivity": true}');


-- 16. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id         UUID NOT NULL,
  plan_id            UUID NOT NULL REFERENCES public.plans(id),
  status             subscription_status DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_account ON public.subscriptions(account_id);

COMMENT ON TABLE public.subscriptions IS 'User/company subscription state.';


-- 17. CREDITS LEDGER (pay-per-lead)
CREATE TABLE public.credits_ledger (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  delta      INTEGER NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credits_account ON public.credits_ledger(account_id);

COMMENT ON TABLE public.credits_ledger IS 'Credit ledger for pay-per-lead reveals. Positive = earned, negative = spent.';


-- ===================== TRUST + SAFETY =====================

-- 18. AUDIT LOG
CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  meta        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor  ON public.audit_log(actor_id);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_time   ON public.audit_log(created_at DESC);

COMMENT ON TABLE public.audit_log IS 'Immutable audit trail for all mutations.';


-- ===================== UTILITY =====================

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'companies', 'contacts', 'sources', 'leads',
      'providers', 'assignments', 'subscriptions'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;


-- ===================== ROW LEVEL SECURITY =====================

ALTER TABLE public.companies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_requirements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_credentials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log           ENABLE ROW LEVEL SECURITY;

-- Public read for plans (pricing page)
CREATE POLICY "plans_public_read" ON public.plans
  FOR SELECT USING (TRUE);

-- Service role full access (all tables get this pattern)
-- In production: replace with granular per-role policies
CREATE POLICY "service_role_all_companies" ON public.companies
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_contacts" ON public.contacts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_sources" ON public.sources
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_raw_events" ON public.raw_events
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_leads" ON public.leads
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_lead_sources" ON public.lead_sources
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_lead_scores" ON public.lead_scores
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_lead_reqs" ON public.lead_requirements
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_providers" ON public.providers
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_provider_caps" ON public.provider_capabilities
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_provider_creds" ON public.provider_credentials
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_matches" ON public.matches
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_offers" ON public.offers
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_assignments" ON public.assignments
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_credits" ON public.credits_ledger
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_audit" ON public.audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- END CANONICAL SCHEMA
-- ============================================================================
