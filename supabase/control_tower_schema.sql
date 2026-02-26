-- =====================================================
-- HAUL COMMAND CONTROL TOWER — PRODUCTION SCHEMA
-- =====================================================
-- System of Record: Supabase Postgres
-- US + Canada first; multi-country ready
-- Automation-first with commission-only specialist pool
-- =====================================================

-- =====================================================
-- IDENTITY & ROLES
-- =====================================================

-- Users table (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- Link to Supabase Auth
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'suspended', 'deleted')) DEFAULT 'active'
);

-- Profiles (app-level metadata)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  company_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  locale TEXT DEFAULT 'en-US',
  onboarding_stage TEXT CHECK (onboarding_stage IN ('signup', 'profile', 'capabilities', 'verification', 'complete')) DEFAULT 'signup',
  contact_preferences JSONB DEFAULT '{}', -- email/sms/push prefs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles (many-to-many)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('escort', 'broker', 'shipper', 'vendor', 'affiliate', 'specialist', 'admin')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- =====================================================
-- ESCORT SUPPLY
-- =====================================================

-- Escort companies
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
  hq_lat NUMERIC(10,7),
  hq_lng NUMERIC(10,7),
  hall_command_id TEXT UNIQUE, -- HC-####
  status TEXT CHECK (status IN ('draft', 'claimed', 'verified', 'suspended')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate Hall Command ID
CREATE OR REPLACE FUNCTION generate_hall_command_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hall_command_id IS NULL THEN
    NEW.hall_command_id := 'HC-' || LPAD(nextval('hc_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS hc_id_seq START 1001;

CREATE TRIGGER set_hall_command_id
BEFORE INSERT ON escort_companies
FOR EACH ROW EXECUTE FUNCTION generate_hall_command_id();

-- Escort operators (individuals within companies)
CREATE TABLE escort_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  operator_name TEXT NOT NULL,
  operator_phone TEXT,
  operator_email TEXT,
  driver_license_state TEXT,
  driver_license_number TEXT,
  languages TEXT[], -- ['en', 'es', 'fr']
  status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service types (seed data)
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code TEXT UNIQUE NOT NULL, -- LEAD, CHASE, HIGH_POLE, POLICE_COORD, ROUTE_SURVEY, PERMITS, TWIC, etc.
  service_name TEXT NOT NULL,
  description TEXT,
  base_pricing_cents BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operator services (many-to-many)
CREATE TABLE operator_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
  proficiency TEXT CHECK (proficiency IN ('novice', 'intermediate', 'expert')) DEFAULT 'intermediate',
  years_experience INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(operator_id, service_type_id)
);

-- Coverage areas
CREATE TABLE coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  country TEXT NOT NULL, -- US, CA, MX
  state_province TEXT, -- FL, TX, ON, BC, etc.
  cities TEXT[], -- ['Miami', 'Tampa', 'Orlando']
  corridors TEXT[], -- ['I-95', 'I-10', 'A1A']
  radius_miles INTEGER, -- service radius from HQ
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability windows
CREATE TABLE availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment inventory
CREATE TABLE equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  equipment_type TEXT, -- LEAD_CAR, CHASE_TRUCK, HIGH_POLE_VEHICLE, PILOT_CAR
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  max_height_ft NUMERIC(5,2),
  has_radio BOOLEAN DEFAULT TRUE,
  has_amber_lights BOOLEAN DEFAULT TRUE,
  has_height_pole BOOLEAN DEFAULT FALSE,
  pole_max_height_ft NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capability flags
CREATE TABLE capability_flags (
  operator_id UUID PRIMARY KEY REFERENCES escort_operators(id) ON DELETE CASCADE,
  max_width_experience_ft NUMERIC(5,2),
  max_height_experience_ft NUMERIC(5,2),
  max_length_experience_ft NUMERIC(6,2),
  max_weight_experience_lbs BIGINT,
  night_service BOOLEAN DEFAULT FALSE,
  weekend_service BOOLEAN DEFAULT FALSE,
  has_twic BOOLEAN DEFAULT FALSE,
  languages TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE & VERIFICATION
-- =====================================================

-- Certification types (seed data by state/province)
CREATE TABLE certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_code TEXT UNIQUE NOT NULL, -- FL_PILOT_CAR, TX_ESCORT_CERT, ON_CVOR, etc.
  cert_name TEXT NOT NULL,
  country TEXT NOT NULL,
  state_province TEXT,
  issuing_authority TEXT,
  renewal_period_days INTEGER, -- 365, 730, etc.
  required_for_services TEXT[], -- ['LEAD', 'CHASE', 'HIGH_POLE']
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operator certifications
CREATE TABLE operator_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  cert_type_id UUID NOT NULL REFERENCES certification_types(id) ON DELETE CASCADE,
  cert_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  status TEXT CHECK (status IN ('pending', 'active', 'expired', 'suspended')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document types (seed data)
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_code TEXT UNIQUE NOT NULL, -- DL, COI, INSURANCE, REGISTRATION, W9, etc.
  doc_name TEXT NOT NULL,
  requires_expiry BOOLEAN DEFAULT FALSE,
  extraction_fields JSONB DEFAULT '{}', -- What fields to OCR
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (uploaded files + extracted data)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  doc_type_id UUID REFERENCES document_types(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  extracted_fields JSONB DEFAULT '{}',
  issued_date DATE,
  expiry_date DATE,
  status TEXT CHECK (status IN ('pending', 'pass', 'fail', 'expired')) DEFAULT 'pending',
  fail_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification events (immutable audit trail)
CREATE TABLE verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('uploaded', 'verified', 'rejected', 'expired', 'renewed')) NOT NULL,
  verified_by UUID REFERENCES users(id), -- Admin/specialist who verified
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DIRECTORY & MONETIZATION
-- =====================================================

-- Listings (public directory entity)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL, -- SEO-friendly URL
  title TEXT NOT NULL,
  description TEXT,
  service_types TEXT[], -- ['LEAD', 'CHASE', 'HIGH_POLE']
  coverage_states TEXT[],
  coverage_cities TEXT[],
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  rank_score NUMERIC(10,2) DEFAULT 0, -- Composite ranking score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim requests
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  claim_fee_cents BIGINT DEFAULT 2900, -- $29
  proof_documents TEXT[], -- URLs to proof of ownership
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorship plans (seed data)
CREATE TABLE sponsorship_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT UNIQUE NOT NULL, -- VERIFIED_PRO, FEATURED_CITY, AI_RECEPTIONIST
  plan_name TEXT NOT NULL,
  monthly_fee_cents BIGINT NOT NULL,
  benefits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorships (active subscriptions)
CREATE TABLE sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES escort_companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES sponsorship_plans(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active',
  region_scope JSONB DEFAULT '{}', -- Which cities/states/corridors
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES escort_companies(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  job_id UUID, -- Link to job_requests if applicable
  trust_weight NUMERIC(3,2) DEFAULT 1.0, -- Weighted by reviewer reputation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents (late/no-show/safety)
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES users(id),
  operator_id UUID REFERENCES escort_operators(id) ON DELETE CASCADE,
  incident_type TEXT CHECK (incident_type IN ('late', 'no_show', 'safety', 'compliance', 'other')) NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  description TEXT,
  job_id UUID,
  resolution_status TEXT CHECK (resolution_status IN ('open', 'investigating', 'resolved', 'dismissed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trust weights (calculated)
CREATE TABLE trust_weights (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  review_weight NUMERIC(3,2) DEFAULT 1.0, -- How much their reviews count
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- JOBS & PROOFS
-- =====================================================

-- Job requests
CREATE TABLE job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT CHECK (job_type IN ('escort', 'permit', 'route_survey', 'police_coord', 'bundle')) NOT NULL,
  origin_address TEXT,
  origin_lat NUMERIC(10,7),
  origin_lng NUMERIC(10,7),
  destination_address TEXT,
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  load_dimensions JSONB, -- {width_ft, height_ft, length_ft, weight_lbs}
  service_date DATE,
  service_time TIME,
  special_requirements TEXT,
  status TEXT CHECK (status IN ('draft', 'quoted', 'assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job assignments
CREATE TABLE job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  assignment_type TEXT, -- LEAD, CHASE, HIGH_POLE
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Proof events (RouteProof integration later)
CREATE TABLE proof_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  proof_type TEXT CHECK (proof_type IN ('start', 'checkpoint', 'end', 'incident')) NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  media_urls TEXT[], -- Photos/videos
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERMITTING CORE
-- =====================================================

-- Permit requests
CREATE TABLE permit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  load_dimensions JSONB NOT NULL, -- {width_ft, height_ft, length_ft, weight_lbs, axles}
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  route_states TEXT[], -- ['FL', 'GA', 'TX']
  route_jurisdictions JSONB, -- [{state: 'FL', counties: [...], cities: [...]}]
  service_date DATE,
  service_time TIME,
  rush_requested BOOLEAN DEFAULT FALSE,
  bundle_requested BOOLEAN DEFAULT FALSE, -- Includes escorts/police
  proof_pack_requested BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('draft', 'validating', 'auto_submitting', 'escalated', 'pending_portal', 'approved', 'denied')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permit rules (current effective rules per jurisdiction)
CREATE TABLE permit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  state_province TEXT NOT NULL,
  jurisdiction_type TEXT, -- STATE, COUNTY, CITY, MUNICIPAL
  jurisdiction_name TEXT,
  rule_category TEXT, -- WIDTH, HEIGHT, LENGTH, WEIGHT, ESCORT, POLICE, CURFEW, HOLIDAY
  rule_trigger JSONB, -- {operator: 'gt', threshold: 14.5, unit: 'ft'}
  rule_action JSONB, -- {action: 'require_escort', details: {...}}
  effective_date DATE,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule versions (history + audit trail)
CREATE TABLE rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES permit_rules(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes JSONB, -- What changed
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permit submissions (automation or manual)
CREATE TABLE permit_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id UUID NOT NULL REFERENCES permit_requests(id) ON DELETE CASCADE,
  jurisdiction_name TEXT NOT NULL,
  submission_method TEXT CHECK (submission_method IN ('auto_portal', 'auto_api', 'manual_specialist', 'manual_portal')) NOT NULL,
  submitted_by UUID REFERENCES users(id), -- Specialist ID if manual
  submitted_payload JSONB,
  portal_response JSONB,
  status TEXT CHECK (status IN ('pending', 'approved', 'denied', 'error')) DEFAULT 'pending',
  permit_file_url TEXT, -- Approved permit PDF
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ESCALATION & SPECIALIST OPS
-- =====================================================

-- Escalation cases
CREATE TABLE escalation_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id UUID REFERENCES permit_requests(id) ON DELETE CASCADE,
  escalation_reason TEXT CHECK (escalation_reason IN ('captcha', 'engineering_review', 'municipal_overlay', 'portal_error', 'rule_mismatch')) NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  auto_generated_summary JSONB, -- Load summary, dimension breakdown, flagged conflicts, etc.
  sla_deadline_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('open', 'claimed', 'in_progress', 'resolved', 'escalated_further')) DEFAULT 'open',
  claimed_by UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialist profiles
CREATE TABLE specialist_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  certification_status TEXT CHECK (certification_status IN ('pending', 'certified', 'suspended')) DEFAULT 'pending',
  exam_passed BOOLEAN DEFAULT FALSE,
  simulations_completed INTEGER DEFAULT 0,
  tenure_start_date DATE,
  tenure_status TEXT CHECK (tenure_status IN ('probation', 'active', 'veteran')) DEFAULT 'probation', -- veteran = 1+ year
  total_escalations_handled INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5,2) DEFAULT 0, -- Percentage
  avg_resolution_time_mins INTEGER,
  upsell_conversion_rate NUMERIC(5,2) DEFAULT 0,
  performance_tier TEXT CHECK (performance_tier IN ('standard', 'premium')) DEFAULT 'standard', -- premium = $25/escalation
  dynamic_multiplier NUMERIC(3,2) DEFAULT 1.0, -- Monthly performance bonus multiplier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialist shifts (who is online)
CREATE TABLE specialist_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ DEFAULT NOW(),
  shift_end TIMESTAMPTZ,
  status TEXT CHECK (status IN ('online', 'busy', 'offline')) DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specialist actions (audit trail)
CREATE TABLE specialist_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escalation_case_id UUID REFERENCES escalation_cases(id) ON DELETE CASCADE,
  action_type TEXT, -- CLAIMED, SUBMITTED, CALLED_CUSTOMER, PORTAL_LOGIN, etc.
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upsell credits (tracks who closed upsells)
CREATE TABLE upsell_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permit_request_id UUID REFERENCES permit_requests(id) ON DELETE CASCADE,
  upsell_type TEXT CHECK (upsell_type IN ('rush', 'bundle', 'proof_pack', 'police_coord', 'hall_pay_accel')) NOT NULL,
  credit_amount_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HALL PAY (RAIL-READY)
-- =====================================================

-- Wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance_cents BIGINT DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type TEXT CHECK (transaction_type IN ('charge', 'payout', 'refund', 'fee', 'credit')) NOT NULL,
  amount_cents BIGINT NOT NULL,
  description TEXT,
  related_permit_id UUID REFERENCES permit_requests(id),
  related_job_id UUID REFERENCES job_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payout accounts (token refs only, no raw credentials)
CREATE TABLE payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('stripe', 'paypal', 'ach')) NOT NULL,
  provider_account_id TEXT NOT NULL, -- Token/reference only
  account_nickname TEXT,
  status TEXT CHECK (status IN ('active', 'pending', 'suspended')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payout_account_id UUID REFERENCES payout_accounts(id) ON DELETE SET NULL,
  amount_cents BIGINT NOT NULL,
  payout_schedule TEXT CHECK (payout_schedule IN ('weekly', '3_day', 'instant')) DEFAULT 'weekly',
  status TEXT CHECK (status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenure status (or computed view)
CREATE TABLE tenure_status (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenure_start_date DATE,
  is_veteran BOOLEAN DEFAULT FALSE, -- 1+ year + good standing
  eligible_for_3day_payout BOOLEAN DEFAULT FALSE,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SCORING
-- =====================================================

-- Score snapshots (daily or on-demand)
CREATE TABLE score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  total_score INTEGER CHECK (total_score BETWEEN 0 AND 100) DEFAULT 0,
  verification_score NUMERIC DEFAULT 0,
  performance_score NUMERIC DEFAULT 0,
  reputation_score NUMERIC DEFAULT 0,
  risk_score NUMERIC DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score events (what changed the score)
CREATE TABLE score_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  event_type TEXT, -- CERT_ADDED, REVIEW_RECEIVED, INCIDENT_LOGGED, etc.
  score_delta INTEGER, -- +5, -10, etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Performance Optimization)
-- =====================================================

-- Identity
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Escort Supply
CREATE INDEX idx_escort_companies_owner ON escort_companies(owner_user_id);
CREATE INDEX idx_escort_companies_hc_id ON escort_companies(hall_command_id);
CREATE INDEX idx_escort_operators_company ON escort_operators(company_id);
CREATE INDEX idx_coverage_areas_operator ON coverage_areas(operator_id);
CREATE INDEX idx_coverage_areas_state ON coverage_areas(state_province);

-- Compliance
CREATE INDEX idx_documents_owner ON documents(owner_user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);

-- Directory
CREATE INDEX idx_listings_slug ON listings(slug);
CREATE INDEX idx_listings_verified ON listings(is_verified);
CREATE INDEX idx_listings_featured ON listings(is_featured);
CREATE INDEX idx_listings_rank ON listings(rank_score DESC);

-- Permitting
CREATE INDEX idx_permit_requests_user ON permit_requests(requester_user_id);
CREATE INDEX idx_permit_requests_status ON permit_requests(status);
CREATE INDEX idx_permit_rules_jurisdiction ON permit_rules(country, state_province);
CREATE INDEX idx_permit_submissions_request ON permit_submissions(permit_request_id);

-- Escalation
CREATE INDEX idx_escalation_cases_status ON escalation_cases(status);
CREATE INDEX idx_escalation_cases_severity ON escalation_cases(severity);
CREATE INDEX idx_escalation_cases_sla ON escalation_cases(sla_deadline_at);

-- Scoring
CREATE INDEX idx_score_snapshots_operator ON score_snapshots(operator_id);
CREATE INDEX idx_score_snapshots_computed ON score_snapshots(computed_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE escort_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE capability_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenure_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (expand as needed)

-- Users can read their own profile
CREATE POLICY users_select_own ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY users_update_own ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Public can read verified listings
CREATE POLICY listings_select_public ON listings
  FOR SELECT USING (is_verified = TRUE);

-- Specialists can view escalation cases
CREATE POLICY escalation_select_specialists ON escalation_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'specialist' AND status = 'active'
    )
  );

-- Users can view their own permit requests
CREATE POLICY permit_requests_select_own ON permit_requests
  FOR SELECT USING (auth.uid() = requester_user_id);

-- Admins can view everything (bypass RLS)
-- Note: Implement admin check function as needed

-- =====================================================
-- SEED DATA (Service Types, Document Types, etc.)
-- =====================================================

-- Service Types
INSERT INTO service_types (service_code, service_name, description, base_pricing_cents) VALUES
('LEAD', 'Lead Car', 'Front escort vehicle', 15000),
('CHASE', 'Chase Car', 'Rear escort vehicle', 15000),
('HIGH_POLE', 'High Pole', 'Height clearance verification', 25000),
('POLICE_COORD', 'Police Coordination', 'Arrange police escorts', 50000),
('ROUTE_SURVEY', 'Route Survey', 'Pre-move route inspection', 75000),
('PERMITS', 'Permit Services', 'Permit acquisition and filing', 20000),
('TWIC', 'TWIC Escort', 'Port and secure facility access', 30000);

-- Document Types
INSERT INTO document_types (doc_code, doc_name, requires_expiry, extraction_fields) VALUES
('DL', 'Driver License', TRUE, '{"number": "string", "state": "string", "expiry": "date"}'),
('COI', 'Certificate of Insurance', TRUE, '{"policy_number": "string", "coverage_amount": "number", "expiry": "date"}'),
('INSURANCE', 'Insurance Policy', TRUE, '{"policy_number": "string", "expiry": "date"}'),
('REGISTRATION', 'Vehicle Registration', TRUE, '{"vin": "string", "expiry": "date"}'),
('W9', 'W-9 Tax Form', FALSE, '{"ein": "string", "business_name": "string"}');

-- Sponsorship Plans
INSERT INTO sponsorship_plans (plan_code, plan_name, monthly_fee_cents, benefits) VALUES
('VERIFIED_PRO', 'Verified Pro', 7900, '{"verified_badge": true, "priority_ranking": true, "analytics_dashboard": true}'),
('FEATURED_CITY', 'Featured City/Service', 12900, '{"featured_badge": true, "top_of_search": true, "city_highlights": true}'),
('AI_RECEPTIONIST', 'AI Receptionist', 49900, '{"vapi_integration": true, "lead_routing": true, "call_recording": true, "crm_sync": true}');

-- =====================================================
-- FUNCTIONS (Business Logic)
-- =====================================================

-- Calculate Hall Command Score (placeholder - implement full logic)
CREATE OR REPLACE FUNCTION calculate_hall_score(p_operator_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total_score INTEGER := 0;
  v_verification_score NUMERIC := 0;
  v_performance_score NUMERIC := 0;
  v_reputation_score NUMERIC := 0;
  v_risk_score NUMERIC := 0;
BEGIN
  -- Verification Score (40 points max)
  -- Based on: certs, docs, equipment verified
  SELECT COUNT(*) * 5 INTO v_verification_score
  FROM operator_certifications
  WHERE operator_id = p_operator_id AND status = 'active';
  
  v_verification_score := LEAST(v_verification_score, 40);
  
  -- Performance Score (30 points max)
  -- Based on: jobs completed, on-time rate, etc.
  -- Placeholder logic
  v_performance_score := 20;
  
  -- Reputation Score (20 points max)
  -- Based on: reviews, ratings
  SELECT AVG(rating) * 4 INTO v_reputation_score
  FROM reviews
  WHERE operator_id = p_operator_id;
  
  v_reputation_score := COALESCE(LEAST(v_reputation_score, 20), 0);
  
  -- Risk Score (10 points deduction max)
  -- Based on: incidents, compliance issues
  SELECT COUNT(*) * -2 INTO v_risk_score
  FROM incidents
  WHERE operator_id = p_operator_id AND severity IN ('high', 'critical');
  
  v_risk_score := GREATEST(v_risk_score, -10);
  
  -- Total Score
  v_total_score := v_verification_score + v_performance_score + v_reputation_score + v_risk_score;
  v_total_score := GREATEST(LEAST(v_total_score, 100), 0);
  
  -- Insert snapshot
  INSERT INTO score_snapshots (operator_id, total_score, verification_score, performance_score, reputation_score, risk_score)
  VALUES (p_operator_id, v_total_score, v_verification_score, v_performance_score, v_reputation_score, v_risk_score);
  
  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS (Auto-Updates)
-- =====================================================

-- Update updated_at on table changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escort_companies_updated_at BEFORE UPDATE ON escort_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escort_operators_updated_at BEFORE UPDATE ON escort_operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_inventory_updated_at BEFORE UPDATE ON equipment_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capability_flags_updated_at BEFORE UPDATE ON capability_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operator_certifications_updated_at BEFORE UPDATE ON operator_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_requests_updated_at BEFORE UPDATE ON job_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permit_requests_updated_at BEFORE UPDATE ON permit_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permit_rules_updated_at BEFORE UPDATE ON permit_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permit_submissions_updated_at BEFORE UPDATE ON permit_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_specialist_profiles_updated_at BEFORE UPDATE ON specialist_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF SCHEMA
-- =====================================================
