-- =========================
-- Haul Command: Liquidity + Pricing + Recruiting (Additive)
-- =========================

begin;

-- 0) Extensions (safe)
create extension if not exists pgcrypto;

-- 1) Role helpers (adjust to match your existing schema if needed)
-- Assumes public.profiles(id uuid primary key, role text)
create or replace function public.current_role()
returns text
language sql
stable
as $$
  select coalesce((select role::text from public.profiles where id = auth.uid()), 'user');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('owner_admin','admin','moderator','finance','support');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_role() in ('owner_admin','admin');
$$;

-- 2) Enum types (optional but clean)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'mission_type') then
    create type public.mission_type as enum ('dead_zone_rescue','corridor_buildout','metro_fortify');
  end if;

  if not exists (select 1 from pg_type where typname = 'mission_status') then
    create type public.mission_status as enum ('queued','running','paused','completed','failed','cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'outreach_channel') then
    create type public.outreach_channel as enum ('sms','email','call','facebook_post','in_app');
  end if;

  if not exists (select 1 from pg_type where typname = 'outreach_status') then
    create type public.outreach_status as enum ('queued','sent','delivered','failed','responded','opted_out');
  end if;
end $$;

-- 3) Pricing market stats
create table if not exists public.pricing_market_stats (
  id uuid primary key default gen_random_uuid(),
  market_id text not null, -- e.g. "US|FL|tampa|I-75_seg_12"
  country text not null,
  region text not null,     -- state/province code
  metro_id text null,
  corridor_id text null,
  corridor_segment_id text null,

  -- signals
  csi numeric not null default 1.0,                  -- corridor saturation index
  scarcity_pressure numeric not null default 0.0,
  urgency_pressure numeric not null default 0.0,
  corridor_priority numeric not null default 1.0,
  broker_quality_factor numeric not null default 1.0,

  searches_7d integer not null default 0,
  broker_requests_7d integer not null default 0,
  load_posts_7d integer not null default 0,

  active_drivers integer not null default 0,
  required_drivers integer not null default 0,
  gap_miles integer not null default 0,

  -- pricing outputs
  dsm_base numeric not null default 1.0,
  dsm_current numeric not null default 1.0,
  last_delta numeric not null default 0.0,

  -- performance outcomes (rolling / last window)
  match_success_rate numeric not null default 0.0,
  median_time_to_fill_minutes numeric not null default 0.0,
  cancellation_rate numeric not null default 0.0,
  net_revenue_per_load numeric not null default 0.0,
  repeat_probability numeric not null default 0.0,

  window_start timestamptz null,
  window_end timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pricing_market_stats_market_id_uidx
on public.pricing_market_stats (market_id);

create index if not exists pricing_market_stats_region_idx
on public.pricing_market_stats (country, region);

create index if not exists pricing_market_stats_metro_idx
on public.pricing_market_stats (metro_id);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_pricing_market_stats_updated_at on public.pricing_market_stats;
create trigger trg_pricing_market_stats_updated_at
before update on public.pricing_market_stats
for each row execute function public.set_updated_at();

-- 4) Bandit arms per market (Thompson / Bayesian params)
create table if not exists public.pricing_bandit_arms (
  id uuid primary key default gen_random_uuid(),
  market_id text not null references public.pricing_market_stats(market_id) on delete cascade,
  arm_delta numeric not null, -- e.g. -0.10 ... +0.20

  -- Simple Beta model for "success"; plus optional running reward stats
  alpha numeric not null default 1.0,
  beta  numeric not null default 1.0,

  trials integer not null default 0,
  successes integer not null default 0,

  avg_reward numeric not null default 0.0,
  last_reward numeric not null default 0.0,
  last_pulled_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_bandit_arms_market_idx
on public.pricing_bandit_arms (market_id);

create unique index if not exists pricing_bandit_arms_market_arm_uidx
on public.pricing_bandit_arms (market_id, arm_delta);

drop trigger if exists trg_pricing_bandit_arms_updated_at on public.pricing_bandit_arms;
create trigger trg_pricing_bandit_arms_updated_at
before update on public.pricing_bandit_arms
for each row execute function public.set_updated_at();

-- 5) Corridor segments
create table if not exists public.corridor_segments (
  id uuid primary key default gen_random_uuid(),
  corridor_id text not null,         -- e.g. "I-75"
  segment_index integer not null,    -- e.g. 0..N
  segment_miles integer not null default 50,

  -- optional geometry representation
  polyline text null,               -- encoded polyline (optional)
  bbox jsonb null,                  -- {minLat,minLng,maxLat,maxLng}
  center_lat numeric null,
  center_lng numeric null,

  country text not null default 'US',
  region_hint text null,            -- best-effort state/province

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists corridor_segments_uidx
on public.corridor_segments (corridor_id, segment_index);

create index if not exists corridor_segments_country_idx
on public.corridor_segments (country);

drop trigger if exists trg_corridor_segments_updated_at on public.corridor_segments;
create trigger trg_corridor_segments_updated_at
before update on public.corridor_segments
for each row execute function public.set_updated_at();

-- 6) Corridor segment metrics (rolling)
create table if not exists public.corridor_segment_metrics (
  id uuid primary key default gen_random_uuid(),
  corridor_id text not null,
  segment_index integer not null,
  corridor_segment_id text generated always as (corridor_id || '_seg_' || segment_index::text) stored,

  -- signals
  csi numeric not null default 1.0,
  active_escorts integer not null default 0,
  required_escorts integer not null default 0,
  largest_gap_miles integer not null default 0,

  searches_7d integer not null default 0,
  load_posts_7d integer not null default 0,
  broker_requests_7d integer not null default 0,

  failure_rate numeric not null default 0.0,
  median_time_to_fill_minutes numeric not null default 0.0,

  -- predictive expansion score
  eps numeric not null default 0.0,

  window_start timestamptz null,
  window_end timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists corridor_segment_metrics_uidx
on public.corridor_segment_metrics (corridor_id, segment_index);

create index if not exists corridor_segment_metrics_eps_idx
on public.corridor_segment_metrics (eps desc);

drop trigger if exists trg_corridor_segment_metrics_updated_at on public.corridor_segment_metrics;
create trigger trg_corridor_segment_metrics_updated_at
before update on public.corridor_segment_metrics
for each row execute function public.set_updated_at();

-- 7) Recruit missions
create table if not exists public.recruit_missions (
  id uuid primary key default gen_random_uuid(),
  mission_type public.mission_type not null,
  status public.mission_status not null default 'queued',

  -- scope
  country text not null,
  region text null,         -- state/province code
  metro_id text null,
  corridor_id text null,
  corridor_segment_id text null,

  -- triggers snapshot
  lrs numeric null,
  csi numeric null,
  eps numeric null,
  search_success_rate numeric null,
  corridor_gap_miles integer null,

  -- targets
  target_verified_operators integer null,
  target_raise_csi_to numeric null,
  timebox_hours integer null,
  timebox_days integer null,

  -- execution control
  priority integer not null default 50,
  cooldown_until timestamptz null,

  -- audit
  created_by uuid null,
  started_at timestamptz null,
  completed_at timestamptz null,
  last_error text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruit_missions_status_priority_idx
on public.recruit_missions (status, priority desc);

create index if not exists recruit_missions_scope_idx
on public.recruit_missions (country, region, metro_id, corridor_id);

drop trigger if exists trg_recruit_missions_updated_at on public.recruit_missions;
create trigger trg_recruit_missions_updated_at
before update on public.recruit_missions
for each row execute function public.set_updated_at();

-- 8) Recruit outreach events
create table if not exists public.recruit_outreach_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.recruit_missions(id) on delete cascade,

  channel public.outreach_channel not null,
  status public.outreach_status not null default 'queued',

  operator_id uuid null,            -- optional link if you have operators table
  phone_e164 text null,
  email text null,

  template_key text null,
  payload jsonb null,               -- rendered data
  provider_message_id text null,

  sent_at timestamptz null,
  responded_at timestamptz null,
  opted_out_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruit_outreach_events_mission_idx
on public.recruit_outreach_events (mission_id);

create index if not exists recruit_outreach_events_status_idx
on public.recruit_outreach_events (status);

drop trigger if exists trg_recruit_outreach_events_updated_at on public.recruit_outreach_events;
create trigger trg_recruit_outreach_events_updated_at
before update on public.recruit_outreach_events
for each row execute function public.set_updated_at();

-- 9) Operator claim events (for "claim your profile" + funnel tracking)
create table if not exists public.operator_claim_events (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid null,           -- reference if your operators table exists
  user_id uuid null,               -- auth.uid of claimant
  claim_method text not null default 'sms', -- sms/email/in_app
  status text not null default 'initiated', -- initiated/verified/completed/failed

  phone_e164 text null,
  email text null,

  verification_sent_at timestamptz null,
  verified_at timestamptz null,
  completed_at timestamptz null,

  meta jsonb null,

  created_at timestamptz not null default now()
);

create index if not exists operator_claim_events_operator_idx
on public.operator_claim_events (operator_id);

create index if not exists operator_claim_events_user_idx
on public.operator_claim_events (user_id);

-- =========================
-- RLS
-- =========================

alter table public.pricing_market_stats enable row level security;
alter table public.pricing_bandit_arms enable row level security;
alter table public.corridor_segments enable row level security;
alter table public.corridor_segment_metrics enable row level security;
alter table public.recruit_missions enable row level security;
alter table public.recruit_outreach_events enable row level security;
alter table public.operator_claim_events enable row level security;

-- Default: public can read corridor segments + metrics (for map), but not pricing internals/missions.
-- Adjust if you want fully private.

-- corridor_segments: readable by anon + auth
drop policy if exists "corridor_segments_read_all" on public.corridor_segments;
create policy "corridor_segments_read_all"
on public.corridor_segments
for select
to anon, authenticated
using (true);

-- corridor_segment_metrics: readable by anon + auth
drop policy if exists "corridor_segment_metrics_read_all" on public.corridor_segment_metrics;
create policy "corridor_segment_metrics_read_all"
on public.corridor_segment_metrics
for select
to anon, authenticated
using (true);

-- pricing_market_stats: readable by staff only
drop policy if exists "pricing_market_stats_read_staff" on public.pricing_market_stats;
create policy "pricing_market_stats_read_staff"
on public.pricing_market_stats
for select
to authenticated
using (public.is_staff());

-- pricing_market_stats: write by admin only
drop policy if exists "pricing_market_stats_write_admin" on public.pricing_market_stats;
create policy "pricing_market_stats_write_admin"
on public.pricing_market_stats
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- pricing_bandit_arms: staff read
drop policy if exists "pricing_bandit_arms_read_staff" on public.pricing_bandit_arms;
create policy "pricing_bandit_arms_read_staff"
on public.pricing_bandit_arms
for select
to authenticated
using (public.is_staff());

-- pricing_bandit_arms: admin write
drop policy if exists "pricing_bandit_arms_write_admin" on public.pricing_bandit_arms;
create policy "pricing_bandit_arms_write_admin"
on public.pricing_bandit_arms
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- recruit_missions: staff read
drop policy if exists "recruit_missions_read_staff" on public.recruit_missions;
create policy "recruit_missions_read_staff"
on public.recruit_missions
for select
to authenticated
using (public.is_staff());

-- recruit_missions: admin write
drop policy if exists "recruit_missions_write_admin" on public.recruit_missions;
create policy "recruit_missions_write_admin"
on public.recruit_missions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- recruit_outreach_events: staff read
drop policy if exists "recruit_outreach_events_read_staff" on public.recruit_outreach_events;
create policy "recruit_outreach_events_read_staff"
on public.recruit_outreach_events
for select
to authenticated
using (public.is_staff());

-- recruit_outreach_events: admin write
drop policy if exists "recruit_outreach_events_write_admin" on public.recruit_outreach_events;
create policy "recruit_outreach_events_write_admin"
on public.recruit_outreach_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- operator_claim_events:
-- - authenticated users can insert their own claim events
-- - staff can read all (for funnel)
drop policy if exists "operator_claim_events_insert_self" on public.operator_claim_events;
create policy "operator_claim_events_insert_self"
on public.operator_claim_events
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "operator_claim_events_read_staff" on public.operator_claim_events;
create policy "operator_claim_events_read_staff"
on public.operator_claim_events
for select
to authenticated
using (public.is_staff());

commit;
