-- ============================================================================
-- HAUL COMMAND ESCORT DIRECTORY + TRUST LAYER SCHEMA
-- ============================================================================
-- Purpose: National (US + Canada) AI directory with trust scoring, doc verification,
--          Hall Pay integration, and anti-fraud audit trails
-- Target: 1,000+ escorts with verification, scoring, payments, and specialist escalation
-- Revenue: Verified Pro ($79/mo) + Featured Slots ($129/mo) + AI Receptionist ($499/mo)
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo queries

-- ============================================================================
-- 0) CORE IDENTITY & ROLES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active',
  locale TEXT DEFAULT 'en-US',
  timezone TEXT DEFAULT 'America/New_York'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);

-- User roles (many-to-many: one user can be escort + broker + vendor)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('escort', 'broker', 'shipper', 'vendor', 'affiliate', 'admin')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- User profiles (extended identity data)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  legal_name TEXT,
  business_name TEXT,
  ein_ssn_last4 TEXT, -- store minimally or token reference
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  onboarding_stage TEXT CHECK (onboarding_stage IN ('account_created', 'identity_added', 'capabilities_set', 'docs_uploaded', 'verified', 'monetization_active')) DEFAULT 'account_created',
  consent_flags JSONB DEFAULT '{}',
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_stage);
CREATE INDEX idx_profiles_state ON profiles(state_province);

-- ============================================================================
-- 1) ESCORT COMPANIES + OPERATORS (supports solo and teams)
-- ============================================================================

CREATE TABLE escort_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website TEXT,
  phone_public TEXT,
  email_public TEXT,
  hq_city TEXT,
  hq_state TEXT,
  hq_country TEXT DEFAULT 'US',
  hq_lat NUMERIC,
  hq_lng NUMERIC,
  hall_command_id TEXT UNIQUE, -- HC-XXXX format
  status TEXT CHECK (status IN ('draft', 'claimed', 'verified', 'suspended')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_owner ON escort_companies(owner_user_id);
CREATE INDEX idx_companies_status ON escort_companies(status);
CREATE INDEX idx_companies_hc_id ON escort_companies(hall_command_id);
CREATE INDEX idx_companies_state ON escort_companies(hq_state);

-- Generate Hall Command ID trigger
CREATE OR REPLACE FUNCTION generate_hall_command_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hall_command_id IS NULL THEN
    NEW.hall_command_id := 'HC-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    -- Check for collision and regenerate if needed
    WHILE EXISTS (SELECT 1 FROM escort_companies WHERE hall_command_id = NEW.hall_command_id AND id != NEW.id) LOOP
      NEW.hall_command_id := 'HC-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_hc_id
BEFORE INSERT OR UPDATE ON escort_companies
FOR EACH ROW EXECUTE FUNCTION generate_hall_command_id();

CREATE TABLE escort_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  operator_type TEXT CHECK (operator_type IN ('solo', 'employee', 'contractor')) DEFAULT 'solo',
  public_contact_preference TEXT CHECK (public_contact_preference IN ('call', 'text', 'email')) DEFAULT 'call',
  years_experience INTEGER CHECK (years_experience >= 0),
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_operators_user ON escort_operators(user_id);
CREATE INDEX idx_operators_company ON escort_operators(company_id);

-- ============================================================================
-- 2) COVERAGE, AVAILABILITY, EQUIPMENT, CAPABILITIES
-- ============================================================================

-- Service types (seed data)
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed service types
INSERT INTO service_types (code, name, description) VALUES
('lead', 'Lead Escort', 'Front escort vehicle'),
('chase', 'Chase Escort', 'Rear escort vehicle'),
('high_pole', 'High Pole/Steerman', 'Height measurement and clearance verification'),
('police_coord', 'Police Coordination', 'State trooper/police escort coordination'),
('route_survey', 'Route Survey', 'Pre-run route reconnaissance'),
('permits', 'Permit Services', 'Permit acquisition and filing'),
('twic_port', 'TWIC/Port Access', 'Port and terminal access with TWIC credential'),
('superload', 'Superload Support', 'Engineering review and superload coordination'),
('night_weekend', 'Night/Weekend Runs', 'Off-hours movement support');

-- Operator services (many-to-many)
CREATE TABLE operator_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_types(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(operator_id, service_type_id)
);

CREATE INDEX idx_op_services_operator ON operator_services(operator_id);
CREATE INDEX idx_op_services_type ON operator_services(service_type_id);

-- Coverage areas
CREATE TABLE coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  country TEXT DEFAULT 'US',
  state_province TEXT NOT NULL,
  counties TEXT[], -- optional county-level coverage
  corridors TEXT[], -- e.g., ['I-10', 'I-75', 'US-301']
  radius_miles INTEGER, -- optional radius from HQ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coverage_operator ON coverage_areas(operator_id);
CREATE INDEX idx_coverage_state ON coverage_areas(state_province);
CREATE INDEX idx_coverage_corridors ON coverage_areas USING GIN(corridors);

-- Availability windows
CREATE TABLE availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time_local TIME,
  end_time_local TIME,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_operator ON availability_windows(operator_id);

-- Equipment inventory
CREATE TABLE equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  equipment_type TEXT CHECK (equipment_type IN ('amber_beacon', 'lightbar', 'high_pole', 'cb_radio', 'dashcam', 'flags_signs', 'cones', 'measuring_wheel', 'lidar_laser')) NOT NULL,
  make_model TEXT,
  serial_or_tag TEXT,
  status TEXT CHECK (status IN ('active', 'maintenance', 'retired')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_operator ON equipment_inventory(operator_id);
CREATE INDEX idx_equipment_type ON equipment_inventory(equipment_type);

-- Capability flags (extended operator capabilities)
CREATE TABLE capability_flags (
  operator_id UUID PRIMARY KEY REFERENCES escort_operators(id) ON DELETE CASCADE,
  max_height_measured_ft_in NUMERIC,
  max_width_experience_ft NUMERIC,
  superload_experience BOOLEAN DEFAULT FALSE,
  night_run_ok BOOLEAN DEFAULT FALSE,
  weekend_ok BOOLEAN DEFAULT FALSE,
  port_experience BOOLEAN DEFAULT FALSE,
  twic_holder BOOLEAN DEFAULT FALSE,
  languages TEXT[] DEFAULT ARRAY['en'],
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3) CERTIFICATIONS, COMPLIANCE, DOC VERIFICATION
-- ============================================================================

-- Certification types (seed data)
CREATE TABLE certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  issuer TEXT,
  region_scope TEXT, -- state/national
  verification_url_pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed certification types
INSERT INTO certification_types (name, issuer, region_scope) VALUES
('Commercial Driver License', 'State DMV', 'state'),
('TWIC Card', 'TSA', 'national'),
('High Pole Certification', 'Various Training Providers', 'national'),
('Oversize/Overweight Certification', 'State DOT', 'state'),
('HAZMAT Endorsement', 'State DMV', 'state');

CREATE TABLE operator_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  cert_type_id UUID REFERENCES certification_types(id) ON DELETE CASCADE,
  cert_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  status TEXT CHECK (status IN ('pending', 'verified', 'expired', 'revoked')) DEFAULT 'pending',
  verification_method TEXT CHECK (verification_method IN ('manual', 'ocr', 'api')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id), -- admin user who verified
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_op_certs_operator ON operator_certifications(operator_id);
CREATE INDEX idx_op_certs_status ON operator_certifications(status);
CREATE INDEX idx_op_certs_expiry ON operator_certifications(expiry_date);

-- Document types (seed data)
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  required_for_roles TEXT[] DEFAULT ARRAY['escort'],
  expiry_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed document types
INSERT INTO document_types (name, required_for_roles, expiry_required) VALUES
('Driver License', ARRAY['escort'], TRUE),
('Insurance Certificate', ARRAY['escort'], TRUE),
('Vehicle Registration', ARRAY['escort'], TRUE),
('W-9 Form', ARRAY['escort', 'vendor'], FALSE),
('Certificate of Insurance (COI)', ARRAY['escort'], TRUE),
('Business License', ARRAY['escort', 'vendor'], TRUE);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  doc_type_id UUID REFERENCES document_types(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  extracted_fields JSONB DEFAULT '{}',
  issued_date DATE,
  expiry_date DATE,
  status TEXT CHECK (status IN ('pending', 'pass', 'fail', 'expired')) DEFAULT 'pending',
  fail_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docs_owner ON documents(owner_user_id);
CREATE INDEX idx_docs_operator ON documents(operator_id);
CREATE INDEX idx_docs_company ON documents(company_id);
CREATE INDEX idx_docs_status ON documents(status);
CREATE INDEX idx_docs_expiry ON documents(expiry_date);

-- Verification events (audit trail)
CREATE TABLE verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT CHECK (subject_type IN ('document', 'certification', 'company', 'operator')) NOT NULL,
  subject_id UUID NOT NULL,
  event_type TEXT CHECK (event_type IN ('uploaded', 'ocr_pass', 'ocr_fail', 'manual_pass', 'manual_fail', 'expired', 'renewed')) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_events_subject ON verification_events(subject_type, subject_id);
CREATE INDEX idx_verification_events_type ON verification_events(event_type);
CREATE INDEX idx_verification_events_created ON verification_events(created_at DESC);

-- ============================================================================
-- 4) LISTINGS, CLAIMING, SPONSORED SLOTS
-- ============================================================================

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID UNIQUE REFERENCES escort_operators(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  hero_image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  geo_lat NUMERIC,
  geo_lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_operator ON listings(operator_id);
CREATE INDEX idx_listings_slug ON listings(slug);
CREATE INDEX idx_listings_state ON listings(state);
CREATE INDEX idx_listings_public ON listings(is_public);

-- Claim requests
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('submitted', 'approved', 'denied')) DEFAULT 'submitted',
  proof_notes TEXT,
  fee_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claim_requests_listing ON claim_requests(listing_id);
CREATE INDEX idx_claim_requests_status ON claim_requests(status);

-- Sponsorship plans (seed data)
CREATE TABLE sponsorship_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL,
  includes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sponsorship plans
INSERT INTO sponsorship_plans (name, description, price_monthly, includes) VALUES
('Verified Pro', 'Verified badge, document monitoring, rank boost', 79, '{"badge": true, "doc_monitoring": true, "rank_boost": 1.5}'),
('Featured City', 'Featured placement in city search results', 129, '{"featured_badge": true, "city_placement": true}'),
('Featured State', 'Featured placement in state search results', 199, '{"featured_badge": true, "state_placement": true}'),
('Featured Service', 'Featured placement in service category', 149, '{"featured_badge": true, "service_placement": true}'),
('AI Receptionist', '24/7 AI call answering and lead capture', 499, '{"ai_receptionist": true, "lead_routing": true, "call_recording": true}');

CREATE TABLE sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES sponsorship_plans(id) ON DELETE CASCADE,
  region_scope JSONB DEFAULT '{}', -- {city: 'Tampa', state: 'FL', service: 'high_pole'}
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled')) DEFAULT 'active',
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsorships_listing ON sponsorships(listing_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);

-- ============================================================================
-- 5) REVIEWS, BROKER FEEDBACK, INCIDENTS (anti-gaming)
-- ============================================================================

-- Review sources (seed data)
CREATE TABLE review_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT UNIQUE NOT NULL,
  trust_weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed review sources
INSERT INTO review_sources (source, trust_weight) VALUES
('haul_command', 1.0),
('broker_verified', 3.0), -- 3x weight for verified broker reviews
('shipper_verified', 3.0),
('public', 0.5); -- lower weight for unverified public reviews

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source_id UUID REFERENCES review_sources(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  text TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  verified_job_id UUID, -- links to job_assignments if verified
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_verified ON reviews(verified_job_id);

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  incident_type TEXT CHECK (incident_type IN ('late', 'no_show', 'safety', 'comm_issue', 'doc_issue', 'route_issue')) NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 5) NOT NULL,
  notes TEXT,
  reported_by_user_id UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_operator ON incidents(operator_id);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_verified ON incidents(verified);

-- ============================================================================
-- 6) JOBS (optional early) + PROOF LOGS (later)
-- ============================================================================

CREATE TABLE job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  load_dims JSONB DEFAULT '{}', -- {height, width, length, weight}
  date_time TIMESTAMPTZ,
  services_needed TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT CHECK (status IN ('new', 'quoted', 'booked', 'completed', 'canceled')) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_requests_requester ON job_requests(requester_user_id);
CREATE INDEX idx_job_requests_status ON job_requests(status);

CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID REFERENCES job_requests(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  agreed_rate NUMERIC,
  status TEXT CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'canceled')) DEFAULT 'assigned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_assignments_request ON job_assignments(job_request_id);
CREATE INDEX idx_job_assignments_operator ON job_assignments(operator_id);
CREATE INDEX idx_job_assignments_status ON job_assignments(status);

CREATE TABLE proof_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('departed', 'checkpoint', 'arrived', 'delay')) NOT NULL,
  geo_lat NUMERIC,
  geo_lng NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proof_events_assignment ON proof_events(job_assignment_id);
CREATE INDEX idx_proof_events_type ON proof_events(event_type);

-- ============================================================================
-- 7) HALL PAY LEDGER (payment rail ready)
-- ============================================================================

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'USD',
  balance NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'frozen', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_status ON wallets(status);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('charge', 'payout', 'fee', 'refund')) NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'settled', 'failed')) DEFAULT 'pending',
  reference TEXT, -- stripe_payment_intent_id or hallpay_ref
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_reference ON transactions(reference);

CREATE TABLE payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  method TEXT CHECK (method IN ('card', 'ach')) NOT NULL,
  token_ref TEXT NOT NULL, -- store provider token, not raw account data
  status TEXT CHECK (status IN ('active', 'pending_verification', 'failed')) DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payout_accounts_user ON payout_accounts(user_id);
CREATE INDEX idx_payout_accounts_status ON payout_accounts(status);

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  fee_amount NUMERIC DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'processing', 'settled', 'failed')) DEFAULT 'pending',
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ============================================================================
-- 8) HALL COMMAND SCORE (0-100 scoring system)
-- ============================================================================

CREATE TABLE hall_scores (
  operator_id UUID PRIMARY KEY REFERENCES escort_operators(id) ON DELETE CASCADE,
  total_score INTEGER CHECK (total_score BETWEEN 0 AND 100) DEFAULT 0,
  verification_score NUMERIC DEFAULT 0,
  performance_score NUMERIC DEFAULT 0,
  reputation_score NUMERIC DEFAULT 0,
  risk_score NUMERIC DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hall_scores_total ON hall_scores(total_score DESC);

-- Hall Score calculation function
CREATE OR REPLACE FUNCTION calculate_hall_score(p_operator_id UUID)
RETURNS VOID AS $$
DECLARE
  v_verification_score NUMERIC := 0;
  v_performance_score NUMERIC := 0;
  v_reputation_score NUMERIC := 0;
  v_risk_score NUMERIC := 0;
  v_total_score INTEGER;
BEGIN
  -- Verification Score (30 pts)
  -- Insurance valid + recent (10 pts)
  IF EXISTS (
    SELECT 1 FROM documents d
    JOIN document_types dt ON d.doc_type_id = dt.id
    WHERE d.operator_id = p_operator_id
    AND dt.name = 'Insurance Certificate'
    AND d.status = 'pass'
    AND d.expiry_date > NOW()
  ) THEN
    v_verification_score := v_verification_score + 10;
  END IF;

  -- Required docs complete (8 pts)
  v_verification_score := v_verification_score + (
    SELECT LEAST(8, COUNT(*) * 2)
    FROM documents
    WHERE operator_id = p_operator_id AND status = 'pass'
  );

  -- Certifications verified (8 pts)
  v_verification_score := v_verification_score + (
    SELECT LEAST(8, COUNT(*) * 2)
    FROM operator_certifications
    WHERE operator_id = p_operator_id AND status = 'verified' AND expiry_date > NOW()
  );

  -- Equipment capability (4 pts)
  v_verification_score := v_verification_score + (
    SELECT LEAST(4, COUNT(*))
    FROM equipment_inventory
    WHERE operator_id = p_operator_id AND status = 'active'
  );

  v_verification_score := LEAST(30, v_verification_score);

  -- Performance Score (35 pts) - placeholder for now
  -- TODO: Implement on-time reliability, cancellation rate, response speed, completion volume
  v_performance_score := 20; -- default moderate performance

  -- Reputation Score (20 pts)
  -- Weighted reviews
  SELECT COALESCE(
    LEAST(20, 
      SUM(r.rating * rs.trust_weight) / NULLIF(COUNT(*), 0) * 4
    ), 0
  ) INTO v_reputation_score
  FROM reviews r
  JOIN review_sources rs ON r.source_id = rs.id
  JOIN listings l ON r.listing_id = l.id
  WHERE l.operator_id = p_operator_id;

  -- Risk Score (−15 to 0)
  SELECT COALESCE(
    GREATEST(-15, -1 * SUM(severity)), 0
  ) INTO v_risk_score
  FROM incidents
  WHERE operator_id = p_operator_id AND verified = TRUE;

  -- Calculate total (capped 0-100)
  v_total_score := GREATEST(0, LEAST(100, 
    ROUND(v_verification_score + v_performance_score + v_reputation_score + v_risk_score)
  ));

  -- Upsert score
  INSERT INTO hall_scores (operator_id, total_score, verification_score, performance_score, reputation_score, risk_score, last_calculated_at)
  VALUES (p_operator_id, v_total_score, v_verification_score, v_performance_score, v_reputation_score, v_risk_score, NOW())
  ON CONFLICT (operator_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    verification_score = EXCLUDED.verification_score,
    performance_score = EXCLUDED.performance_score,
    reputation_score = EXCLUDED.reputation_score,
    risk_score = EXCLUDED.risk_score,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate score when docs/certs/reviews change
CREATE OR REPLACE FUNCTION trigger_score_recalc()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_hall_score(NEW.operator_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_docs_score_recalc AFTER INSERT OR UPDATE ON documents
FOR EACH ROW WHEN (NEW.operator_id IS NOT NULL)
EXECUTE FUNCTION trigger_score_recalc();

CREATE TRIGGER trg_certs_score_recalc AFTER INSERT OR UPDATE ON operator_certifications
FOR EACH ROW EXECUTE FUNCTION trigger_score_recalc();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Admin full access policy (apply to all tables)
CREATE POLICY admin_all_access ON users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Users can read/update their own data
CREATE POLICY users_own_data ON users FOR ALL TO authenticated
USING (id = auth.uid());

CREATE POLICY profiles_own_data ON profiles FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Escorts can manage their own companies/operators
CREATE POLICY escorts_own_companies ON escort_companies FOR ALL TO authenticated
USING (owner_user_id = auth.uid());

CREATE POLICY escorts_own_operators ON escort_operators FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Public can read published listings
CREATE POLICY listings_public_read ON listings FOR SELECT TO anon, authenticated
USING (is_public = TRUE);

-- Reviews are public read
CREATE POLICY reviews_public_read ON reviews FOR SELECT TO anon, authenticated
USING (TRUE);

-- Users can read their own wallet/transactions
CREATE POLICY wallets_own_data ON wallets FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY transactions_own_data ON transactions FOR SELECT TO authenticated
USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_operators_company_user ON escort_operators(company_id, user_id);
CREATE INDEX idx_listings_state_public ON listings(state, is_public);
CREATE INDEX idx_hall_scores_operator_score ON hall_scores(operator_id, total_score DESC);
CREATE INDEX idx_reviews_listing_rating ON reviews(listing_id, rating DESC);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
