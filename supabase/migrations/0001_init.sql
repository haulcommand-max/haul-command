-- 0001_init.sql
-- Core schema + helpers for Haul Command marketplace OS

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
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

-- ---------- HELPERS ----------
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('platform_admin','safety_admin')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Immutable guard for audit log
create or replace function public.block_updates_deletes()
returns trigger language plpgsql as $$
begin
  raise exception 'This table is append-only.';
end $$;

-- ---------- TABLES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  display_name text,
  phone text,
  email text,
  country text,         -- 'US'|'CA'
  home_state text,      -- state/province code
  home_city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  org_type text not null check (org_type in ('broker','carrier')),
  name text not null,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists public.org_members (
  org_id uuid references public.orgs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table if not exists public.driver_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  base_lat double precision,
  base_lng double precision,
  service_radius_miles int default 150,
  cb_channel text,
  has_high_pole boolean default false,
  has_dashcam boolean default false,
  insurance_min_limit_usd int,
  verified_badge boolean default false,
  last_active_at timestamptz
);

create table if not exists public.broker_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  org_id uuid references public.orgs(id),
  business_verified boolean default false,
  mc_number text,
  dot_number text,
  billing_email text
);

create table if not exists public.equipment_catalog (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  doc_type doc_type not null,
  status doc_status not null default 'uploaded',
  storage_path text not null,
  sha256 text,
  issued_at date,
  expires_at date,
  extracted_json jsonb,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_owner on public.documents(owner_id);
create index if not exists idx_documents_type_status on public.documents(doc_type, status);

create table if not exists public.driver_equipment (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles(id) on delete cascade,
  equipment_id uuid references public.equipment_catalog(id),
  is_present boolean default true,
  verified boolean default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  photo_doc_id uuid references public.documents(id),
  unique(driver_id, equipment_id)
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles(id) on delete cascade,
  jurisdiction text not null,    -- 'FL','ON', etc.
  cert_number text,
  expires_at date,
  doc_id uuid references public.documents(id),
  verified boolean default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),
  unique(driver_id, jurisdiction, cert_number)
);

create index if not exists idx_certs_driver on public.certifications(driver_id);

create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid references public.profiles(id) on delete cascade,
  org_id uuid references public.orgs(id),
  status load_status not null default 'posted',
  title text,
  origin_text text,
  origin_lat double precision,
  origin_lng double precision,
  dest_text text,
  dest_lat double precision,
  dest_lng double precision,
  pickup_at timestamptz,
  equipment_requirements jsonb,
  dims jsonb,
  route_states text[],
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_loads_status on public.loads(status);
create index if not exists idx_loads_broker on public.loads(broker_id);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  load_id uuid references public.loads(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete cascade,
  status offer_status not null default 'sent',
  broker_visible_match_score int,
  price_offer_cents int,
  currency text default 'USD',
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_offers_driver on public.offers(driver_id);
create index if not exists idx_offers_load on public.offers(load_id);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  load_id uuid references public.loads(id) on delete cascade,
  broker_id uuid references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete cascade,
  status job_status not null default 'scheduled',
  agreed_price_cents int,
  currency text default 'USD',
  preauth_payment_id uuid,
  compliance_snapshot_id uuid,
  start_at timestamptz,
  end_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_jobs_driver on public.jobs(driver_id);
create index if not exists idx_jobs_broker on public.jobs(broker_id);

create table if not exists public.pretrip_handshakes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  driver_confirmed boolean not null,
  broker_confirmed boolean not null,
  load_dims jsonb not null,
  permit_numbers text[],
  cb_channel text,
  signed_at timestamptz not null default now(),
  signed_lat double precision,
  signed_lng double precision
);

create table if not exists public.evidence_artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  artifact_type text not null,
  doc_id uuid references public.documents(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- GPS breadcrumbs: keep table simple now; partition later if needed
create table if not exists public.gps_breadcrumbs (
  id bigserial primary key,
  job_id uuid references public.jobs(id) on delete cascade,
  recorded_at timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  speed_mph double precision,
  heading double precision
);

create index if not exists idx_gps_job_time on public.gps_breadcrumbs(job_id, recorded_at);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  broker_id uuid references public.profiles(id),
  driver_id uuid references public.profiles(id),
  status payment_status not null,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  amount_cents int not null,
  platform_fee_cents int default 0,
  currency text default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payments_touch
before update on public.payments
for each row execute function public.touch_updated_at();

create table if not exists public.hazards (
  id uuid primary key default gen_random_uuid(),
  hazard_type text not null,
  source text not null check (source in ('official','crowd')),
  status text not null default 'active',
  lat double precision not null,
  lng double precision not null,
  description text,
  confidence double precision default 0.5,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_hazards_geo on public.hazards(lat, lng);

create table if not exists public.hazard_reports (
  id uuid primary key default gen_random_uuid(),
  hazard_id uuid references public.hazards(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete cascade,
  report_type text not null check (report_type in ('confirm','deny','update')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('driver','broker')),
  subject_id uuid not null,
  score int not null check (score between 0 and 100),
  components jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scores_subject on public.score_snapshots(subject_type, subject_id);

create table if not exists public.leaderboard_periods (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('monthly','yearly','all_time')),
  start_date date,
  end_date date
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references public.leaderboard_periods(id) on delete cascade,
  scope_type text not null check (scope_type in ('country','state','province','corridor')),
  scope_key text not null,
  subject_type text not null check (subject_type in ('driver','broker')),
  subject_id uuid not null,
  metric_key text not null,
  metric_value numeric not null,
  rank int,
  created_at timestamptz not null default now()
);

create index if not exists idx_lb_scope on public.leaderboard_entries(period_id, scope_type, scope_key);

create table if not exists public.audit_events (
  id bigserial primary key,
  event_type text not null,
  actor_id uuid references public.profiles(id),
  subject_type text,
  subject_id uuid,
  payload jsonb not null,
  sha256 text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_subject on public.audit_events(subject_type, subject_id);

-- enforce append-only behavior at DB level
drop trigger if exists audit_no_update on public.audit_events;
create trigger audit_no_update
before update on public.audit_events
for each row execute function public.block_updates_deletes();

drop trigger if exists audit_no_delete on public.audit_events;
create trigger audit_no_delete
before delete on public.audit_events
for each row execute function public.block_updates_deletes();

-- Feature flags (future-proof)
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('user','org','global')),
  scope_id uuid,
  flag_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique(scope_type, scope_id, flag_key)
);

-- Webhook inbox (Stripe idempotency + debugging)
create table if not exists public.webhook_inbox (
  id uuid primary key default gen_random_uuid(),
  provider text not null,                 -- 'stripe'
  event_id text not null,
  event_type text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, event_id)
);
