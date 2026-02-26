-- Enable UUIDs
create extension if not exists "pgcrypto";

-- ENUMS
do $$ begin
  create type user_role as enum ('driver','broker','carrier_admin','dispatcher','safety_admin','platform_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_type as enum ('insurance','certification','license','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type doc_status as enum ('uploaded','verified','rejected','expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type load_status as enum ('draft','posted','paused','cancelled','filled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type offer_status as enum ('sent','viewed','accepted','declined','expired','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('scheduled','arrived','rolling','paused','completed','cancelled','disputed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('preauthorized','captured','refunded','payout_pending','paid_out','frozen');
exception when duplicate_object then null; end $$;

-- PROFILES (ties to auth.users.id)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  display_name text,
  phone text,
  email text,
  country text,            -- 'US'/'CA'
  home_state text,         -- state/province code
  home_city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ORGS (for brokers/carriers with teams)
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  org_type text not null check (org_type in ('broker','carrier')),
  name text not null,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists org_members (
  org_id uuid references orgs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- DRIVER DETAIL
create table if not exists driver_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  base_lat double precision,
  base_lng double precision,
  service_radius_miles int default 150,
  cb_channel text,
  has_high_pole boolean default false,
  has_dashcam boolean default false,
  insurance_min_limit_usd int, -- store normalized limit
  verified_badge boolean default false,
  last_active_at timestamptz
);

-- BROKER DETAIL
create table if not exists broker_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  org_id uuid references orgs(id),
  business_verified boolean default false,
  mc_number text,
  dot_number text,
  billing_email text
);

-- EQUIPMENT CATALOG + DRIVER EQUIPMENT (with verification)
create table if not exists equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,       -- 'roof_sign','light_bar','height_pole'
  name text not null,
  description text
);

create table if not exists driver_equipment (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references profiles(id) on delete cascade,
  equipment_id uuid references equipment_catalog(id),
  is_present boolean default true,
  verified boolean default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  photo_doc_id uuid, -- points to documents row
  unique(driver_id, equipment_id)
);

-- DOCUMENTS (versioned)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  doc_type doc_type not null,
  status doc_status not null default 'uploaded',
  storage_path text not null,          -- Supabase Storage path
  sha256 text,                          -- optional hash
  issued_at date,
  expires_at date,
  extracted_json jsonb,                 -- OCR extraction results
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now()
);

-- CERTIFICATIONS (structured)
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references profiles(id) on delete cascade,
  jurisdiction text not null,      -- state/province code
  cert_number text,
  expires_at date,
  doc_id uuid references documents(id),
  verified boolean default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  unique(driver_id, jurisdiction, cert_number)
);

-- LOADS (broker posts)
create table if not exists loads (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid references profiles(id) on delete cascade,
  org_id uuid references orgs(id),
  status load_status not null default 'posted',
  title text,
  origin_text text,
  origin_lat double precision,
  origin_lng double precision,
  dest_text text,
  dest_lat double precision,
  dest_lng double precision,
  pickup_at timestamptz,
  equipment_requirements jsonb,     -- e.g. {high_pole:true, light_bar:true}
  dims jsonb,                       -- {height_ft:15.5,width_ft:12,length_ft:110,weight_lbs:180000}
  route_states text[],              -- ['FL','GA']
  notes text,
  created_at timestamptz not null default now()
);

-- OFFERS (system-to-driver ping or driver bids)
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  load_id uuid references loads(id) on delete cascade,
  driver_id uuid references profiles(id) on delete cascade,
  status offer_status not null default 'sent',
  broker_visible_match_score int,       -- 0..100
  price_offer_cents int,                -- optional bidding
  currency text default 'USD',
  sent_at timestamptz not null default now(),
  responded_at timestamptz
);

-- JOBS (when accepted)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  load_id uuid references loads(id) on delete cascade,
  broker_id uuid references profiles(id) on delete cascade,
  driver_id uuid references profiles(id) on delete cascade,
  status job_status not null default 'scheduled',
  agreed_price_cents int,
  currency text default 'USD',
  preauth_payment_id uuid,              -- payments row
  compliance_snapshot_id uuid,          -- evidence packet id
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

-- PRE-TRIP HANDSHAKE (immutable)
create table if not exists pretrip_handshakes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  driver_confirmed boolean not null,
  broker_confirmed boolean not null,
  load_dims jsonb not null,
  permit_numbers text[],
  cb_channel text,
  signed_at timestamptz not null default now(),
  signed_lat double precision,
  signed_lng double precision
);

-- EVIDENCE ARTIFACTS
create table if not exists evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  artifact_type text not null,   -- 'calibration_photo','pickup_photo','bol_photo','incident_photo','note'
  doc_id uuid references documents(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- GPS BREADCRUMBS (partition later if needed)
create table if not exists gps_breadcrumbs (
  id bigserial primary key,
  job_id uuid references jobs(id) on delete cascade,
  recorded_at timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  speed_mph double precision,
  heading double precision
);

create index if not exists idx_gps_job_time on gps_breadcrumbs(job_id, recorded_at);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  broker_id uuid references profiles(id),
  driver_id uuid references profiles(id),
  status payment_status not null,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  amount_cents int not null,
  platform_fee_cents int default 0,
  currency text default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- HAZARDS (Waze++)
create table if not exists hazards (
  id uuid primary key default gen_random_uuid(),
  hazard_type text not null,      -- 'low_wire','construction_shift','enforcement','rough_crossing'
  source text not null,           -- 'official'|'crowd'
  status text not null default 'active', -- 'active'|'expired'|'removed'
  lat double precision not null,
  lng double precision not null,
  description text,
  confidence double precision default 0.5,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists hazard_reports (
  id uuid primary key default gen_random_uuid(),
  hazard_id uuid references hazards(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete cascade,
  report_type text not null,  -- 'confirm'|'deny'|'update'
  notes text,
  created_at timestamptz not null default now()
);

-- SCORES (versioned snapshots)
create table if not exists score_snapshots (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('driver','broker')),
  subject_id uuid not null,
  score int not null check (score between 0 and 100),
  components jsonb not null,
  created_at timestamptz not null default now()
);

-- LEADERBOARDS (monthly/yearly/all-time)
create table if not exists leaderboard_periods (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('monthly','yearly','all_time')),
  start_date date,
  end_date date
);

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references leaderboard_periods(id) on delete cascade,
  scope_type text not null check (scope_type in ('country','state','province','corridor')),
  scope_key text not null,           -- 'US','CA','FL','ON','I-10'
  subject_type text not null check (subject_type in ('driver','broker')),
  subject_id uuid not null,
  metric_key text not null,          -- 'jobs_completed','verified_miles','hazards_verified'
  metric_value numeric not null,
  rank int,
  created_at timestamptz not null default now()
);

-- IMMUTABLE AUDIT EVENTS
create table if not exists audit_events (
  id bigserial primary key,
  event_type text not null,
  actor_id uuid references profiles(id),
  subject_type text,
  subject_id uuid,
  payload jsonb not null,
  sha256 text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_subject on audit_events(subject_type, subject_id);
