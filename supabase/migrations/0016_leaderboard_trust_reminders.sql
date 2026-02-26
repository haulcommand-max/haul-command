-- 0016_leaderboard_trust_reminders.sql
-- Adds: broker trust score, compliance reminders, leaderboard snapshots + public views + RLS patterns

begin;

-- ---------- ENUMS ----------
do $$ begin
  create type public.actor_type as enum ('driver','broker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reminder_kind as enum ('insurance_expiring','cert_expiring','profile_incomplete','broker_payment_risk');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leaderboard_metric as enum (
    'most_runs',
    'most_verified_miles',
    'most_on_time',
    'most_hazards_verified'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.timeframe as enum ('month','season_year','all_time');
exception when duplicate_object then null; end $$;

-- ---------- BROKER TRUST SCORE ----------
create table if not exists public.broker_profiles (
  broker_id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  mc_number text,
  dot_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.broker_trust_scores (
  broker_id uuid primary key references public.broker_profiles(broker_id) on delete cascade,
  score numeric(6,2) not null default 0,                -- 0..100
  payment_speed_days numeric(6,2),                      -- rollup median
  cancellation_rate numeric(6,4),                       -- 0..1
  dispute_rate numeric(6,4),                            -- 0..1
  ghost_load_rate numeric(6,4),                         -- 0..1
  last_recomputed_at timestamptz not null default now(),
  breakdown jsonb not null default '{}'::jsonb
);

-- ---------- COMPLIANCE REMINDERS ----------
create table if not exists public.compliance_reminders (
  id uuid primary key default gen_random_uuid(),
  actor_type public.actor_type not null,
  actor_id uuid not null, -- auth.users.id (driver or broker)
  kind public.reminder_kind not null,
  due_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sent','dismissed','resolved','failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists compliance_reminders_due_idx
  on public.compliance_reminders(status, due_at);

-- ---------- EVENTS (write-only by service role) ----------
create table if not exists public.leaderboard_events (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_type public.actor_type not null,
  actor_id uuid not null,
  country_code text not null,  -- 'us' / 'ca'
  region_code text not null,   -- state/province (e.g., 'fl', 'on')
  metric public.leaderboard_metric not null,
  value numeric(12,2) not null default 0,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists leaderboard_events_rollup_idx
  on public.leaderboard_events(country_code, region_code, metric, occurred_at);

-- ---------- ROLLUPS (recomputed hourly / nightly) ----------
create table if not exists public.leaderboard_rollups (
  id bigserial primary key,
  as_of timestamptz not null default now(),
  timeframe public.timeframe not null,
  -- for season_year, season_start is Feb 20 (your rule), season_end = next Feb 20
  season_start date,
  season_end date,
  period_start date,
  period_end date,

  country_code text not null,
  region_code text not null, -- 'all' allowed for national
  metric public.leaderboard_metric not null,

  actor_type public.actor_type not null,
  actor_id uuid not null,

  score numeric(14,2) not null default 0,
  rank int not null default 0,

  delta_rank int not null default 0,      -- green up / red down arrows
  delta_score numeric(14,2) not null default 0,

  last_event_at timestamptz,
  updated_at timestamptz not null default now(),

  unique(timeframe, country_code, region_code, metric, actor_type, actor_id, period_start, season_start)
);

create index if not exists leaderboard_rollups_read_idx
  on public.leaderboard_rollups(country_code, region_code, metric, timeframe, rank);

-- ---------- SNAPSHOTS (hourly, immutable-ish) ----------
create table if not exists public.leaderboard_snapshots (
  id bigserial primary key,
  snapshotted_at timestamptz not null default now(),
  timeframe public.timeframe not null,
  country_code text not null,
  region_code text not null,
  metric public.leaderboard_metric not null,
  payload jsonb not null
);

create index if not exists leaderboard_snapshots_lookup_idx
  on public.leaderboard_snapshots(country_code, region_code, metric, timeframe, snapshotted_at desc);

-- ---------- PUBLIC VIEWS (SAFE FOR SEO) ----------
-- NOTE: keep PII out. Only expose display name + badges + counts.
-- You can later join your driver public profile view here.

create or replace view public.public_leaderboards as
select
  timeframe,
  country_code,
  region_code,
  metric,
  actor_type,
  actor_id,
  rank,
  score,
  delta_rank,
  delta_score,
  last_event_at,
  period_start,
  period_end,
  season_start,
  season_end,
  updated_at
from public.leaderboard_rollups;

-- ---------- RLS ----------
alter table public.leaderboard_events enable row level security;
alter table public.leaderboard_rollups enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.compliance_reminders enable row level security;
alter table public.broker_trust_scores enable row level security;
alter table public.broker_profiles enable row level security;

-- Write-only by service role (Edge Functions).
-- In Supabase, service_role bypasses RLS automatically, but we also deny anon/auth writes.

create policy "deny writes to events"
on public.leaderboard_events for insert to authenticated
with check (false);

create policy "deny updates to events"
on public.leaderboard_events for update to authenticated
using (false);

create policy "public read leaderboards"
on public.leaderboard_rollups for select
to anon, authenticated
using (true);

create policy "public read snapshots"
on public.leaderboard_snapshots for select
to anon, authenticated
using (true);

create policy "users read their own reminders"
on public.compliance_reminders for select
to authenticated
using (actor_id = auth.uid());

create policy "users dismiss their own reminders"
on public.compliance_reminders for update
to authenticated
using (actor_id = auth.uid())
with check (actor_id = auth.uid());

create policy "brokers read own profile"
on public.broker_profiles for select
to authenticated
using (broker_id = auth.uid());

create policy "brokers read own trust score"
on public.broker_trust_scores for select
to authenticated
using (broker_id = auth.uid());

commit;
