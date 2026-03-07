-- 20260227_0040_escort_marketplace_auto_match_engine.sql
-- Global Escort Marketplace Auto-Match Engine v1
-- Tables: load_requests, match_runs, offers, jobs
-- Supports 25-country geo isolation, ranked matching, offer cascades

begin;

-- =========================
-- Load Requests
-- =========================

create table if not exists public.load_requests (
  request_id uuid primary key default gen_random_uuid(),
  country_code text not null,
  admin1_code text,
  origin_lat double precision not null,
  origin_lon double precision not null,
  destination_lat double precision not null,
  destination_lon double precision not null,
  pickup_time_window jsonb not null,        -- { start: ISO, end: ISO }
  load_type_tags jsonb not null default '[]', -- ["oversize","wide","heavy_haul","superload"]
  dimensions jsonb,                          -- { length, width, height, weight }
  required_escort_count int not null default 1,
  special_requirements jsonb default '[]',   -- ["night_move","police","route_survey","height_pole"]
  broker_id uuid,
  carrier_id uuid,
  budget_range jsonb,                        -- { min, max, currency }
  cross_border_flag boolean not null default false,
  status text not null default 'pending',    -- pending|matching|matched|expired|cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists load_requests_country_idx on public.load_requests (country_code);
create index if not exists load_requests_admin1_idx on public.load_requests (country_code, admin1_code);
create index if not exists load_requests_status_idx on public.load_requests (status);
create index if not exists load_requests_broker_idx on public.load_requests (broker_id);
create index if not exists load_requests_created_idx on public.load_requests (created_at desc);

-- =========================
-- Match Runs (audit trail for every match computation)
-- =========================

create table if not exists public.match_runs (
  match_run_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.load_requests(request_id),
  stage text not null,                       -- candidate_gen|scoring|offer_strategy|booking
  candidate_count int not null default 0,
  top_candidates jsonb default '[]',         -- [{operator_id, score, rank}]
  explainability jsonb default '{}',         -- per-candidate score breakdown
  offer_plan jsonb,                          -- strategy chosen + params
  cascade_round int not null default 0,
  computed_at timestamptz not null default now()
);

create index if not exists match_runs_request_idx on public.match_runs (request_id);
create index if not exists match_runs_stage_idx on public.match_runs (stage);

-- =========================
-- Offers (one per operator per request)
-- =========================

create table if not exists public.offers (
  offer_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.load_requests(request_id),
  match_run_id uuid references public.match_runs(match_run_id),
  operator_id uuid not null,
  rate_offered numeric(12,2),
  currency text not null default 'USD',
  status text not null default 'sent',       -- sent|accepted|declined|expired|withdrawn
  cascade_round int not null default 0,
  accept_deadline_at timestamptz,
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  response_metadata jsonb,                   -- decline reason, counter-offer, etc
  created_at timestamptz not null default now()
);

create index if not exists offers_request_idx on public.offers (request_id);
create index if not exists offers_operator_idx on public.offers (operator_id);
create index if not exists offers_status_idx on public.offers (status);
create index if not exists offers_deadline_idx on public.offers (accept_deadline_at)
  where status = 'sent';

-- =========================
-- Jobs (confirmed bookings)
-- =========================

create table if not exists public.jobs (
  job_id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.load_requests(request_id),
  broker_id uuid,
  carrier_id uuid,
  assigned_escort_ids jsonb not null default '[]',    -- [uuid]
  agreed_rate_total numeric(12,2),
  currency text not null default 'USD',
  compliance_snapshot jsonb not null default '{}',    -- frozen compliance state at booking
  audit_trail jsonb not null default '[]',            -- [{action, ts, actor}]
  status text not null default 'confirmed',           -- confirmed|in_progress|completed|cancelled|disputed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_request_idx on public.jobs (request_id);
create index if not exists jobs_broker_idx on public.jobs (broker_id);
create index if not exists jobs_status_idx on public.jobs (status);

-- =========================
-- Operator Availability (real-time state)
-- =========================

create table if not exists public.operator_availability (
  operator_id uuid primary key,
  country_code text not null,
  admin1_coverage jsonb not null default '[]',  -- ["TX","OK","LA"]
  home_lat double precision,
  home_lon double precision,
  last_known_lat double precision,
  last_known_lon double precision,
  availability_status text not null default 'offline', -- available|busy|offline
  service_tags jsonb not null default '[]',     -- ["pilot_car","route_survey","height_pole"]
  equipment_tags jsonb not null default '[]',   -- ["lightbar","signs","poles","cb"]
  compliance_flags jsonb not null default '{}', -- { license_verified, insurance_verified, ... }
  trust_score numeric(5,2) default 0,
  acceptance_rate_30d numeric(5,4) default 0,
  response_time_p50_seconds int,
  cancellation_rate_90d numeric(5,4) default 0,
  active_job_count int not null default 0,
  last_active_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists operator_avail_country_idx
  on public.operator_availability (country_code);
create index if not exists operator_avail_status_idx
  on public.operator_availability (availability_status)
  where availability_status = 'available';
create index if not exists operator_avail_active_idx
  on public.operator_availability (last_active_at desc);

-- =========================
-- Broker↔Escort Relationship Graph Edges
-- =========================

create table if not exists public.broker_escort_edges (
  broker_id uuid not null,
  operator_id uuid not null,
  jobs_completed int not null default 0,
  last_job_at timestamptz,
  avg_rating numeric(3,2),
  relationship_weight numeric(5,4) not null default 0,
  flags jsonb default '{}',                   -- { preferred, blocked, ring_suspect }
  updated_at timestamptz not null default now(),
  constraint broker_escort_edges_pk primary key (broker_id, operator_id)
);

create index if not exists broker_escort_edges_operator_idx
  on public.broker_escort_edges (operator_id);

-- =========================
-- Offer timeout helper
-- =========================

create or replace function public.expire_stale_offers()
returns int
language plpgsql
security definer
as $$
declare
  expired_count int;
begin
  update public.offers
  set status = 'expired',
      responded_at = now()
  where status = 'sent'
    and accept_deadline_at < now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

-- =========================
-- RLS
-- =========================

alter table public.load_requests enable row level security;
alter table public.match_runs enable row level security;
alter table public.offers enable row level security;
alter table public.jobs enable row level security;
alter table public.operator_availability enable row level security;
alter table public.broker_escort_edges enable row level security;

commit;
