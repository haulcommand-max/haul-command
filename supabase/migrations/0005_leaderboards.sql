-- 0005_leaderboards.sql
-- Requires pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Enumerations
do $$ begin
  create type public.actor_type as enum ('driver','broker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leaderboard_period as enum ('month','season_year','all_time');
exception when duplicate_object then null; end $$;

-- 2) Append-only events (source of truth)
create table if not exists public.leaderboard_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,                    -- references profiles.id (or drivers/brokers table id)
  actor_type public.actor_type not null,
  job_id uuid null,                          -- optional linkage
  event_kind text not null,                  -- e.g. 'run_completed', 'job_completed', 'hazard_verified'
  runs_count int not null default 0,         -- for "most runs" leaderboard
  points int not null default 0,             -- future-proof scoring
  country_code text not null,                -- 'US' or 'CA' (or more later)
  admin1_code text null,                     -- US state (FL/GA) or CA province (ON/QC)
  occurred_at timestamptz not null default now(),
  inserted_at timestamptz not null default now()
);

create index if not exists leaderboard_events_actor_idx
  on public.leaderboard_events (actor_type, actor_id, occurred_at desc);

create index if not exists leaderboard_events_region_idx
  on public.leaderboard_events (country_code, admin1_code, occurred_at desc);

create index if not exists leaderboard_events_kind_idx
  on public.leaderboard_events (event_kind, occurred_at desc);

-- 3) Season-year key function (resets every Feb 20)
-- Returns the "season year label" (e.g. 2026 means Feb 20 2026 -> Feb 19 2027)
create or replace function public.season_year_key(ts timestamptz)
returns int
language sql
stable
as $$
  select case
    when (extract(month from ts) > 2)
      or (extract(month from ts) = 2 and extract(day from ts) >= 20)
    then extract(year from ts)::int
    else (extract(year from ts)::int - 1)
  end;
$$;

-- 4) Rollup table (fast reads)
create table if not exists public.leaderboard_rollups (
  id uuid primary key default gen_random_uuid(),
  period public.leaderboard_period not null,
  period_key text not null,                  -- month: 'YYYY-MM', season_year: '2026', all_time: 'all'
  country_code text not null,
  admin1_code text null,                     -- null = country-level board, else state/province board
  actor_type public.actor_type not null,
  actor_id uuid not null,
  runs_count bigint not null default 0,
  points bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (period, period_key, country_code, admin1_code, actor_type, actor_id)
);

create index if not exists leaderboard_rollups_query_idx
  on public.leaderboard_rollups (period, period_key, country_code, admin1_code, runs_count desc, points desc);

-- 5) Rollup function (idempotent rebuild for a time window)
-- Call this nightly/hourly via scheduler.
create or replace function public.rollup_leaderboards(p_from timestamptz, p_to timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- MONTH rollup (YYYY-MM)
  insert into public.leaderboard_rollups (period, period_key, country_code, admin1_code, actor_type, actor_id, runs_count, points, updated_at)
  select
    'month'::public.leaderboard_period,
    to_char(date_trunc('month', e.occurred_at), 'YYYY-MM') as period_key,
    e.country_code,
    nullif(e.admin1_code,'') as admin1_code,
    e.actor_type,
    e.actor_id,
    sum(e.runs_count)::bigint as runs_count,
    sum(e.points)::bigint as points,
    now()
  from public.leaderboard_events e
  where e.occurred_at >= p_from and e.occurred_at < p_to
  group by 1,2,3,4,5,6
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = excluded.runs_count,
    points = excluded.points,
    updated_at = now();

  -- SEASON YEAR rollup (Feb20 reset)
  insert into public.leaderboard_rollups (period, period_key, country_code, admin1_code, actor_type, actor_id, runs_count, points, updated_at)
  select
    'season_year'::public.leaderboard_period,
    public.season_year_key(e.occurred_at)::text as period_key,
    e.country_code,
    nullif(e.admin1_code,'') as admin1_code,
    e.actor_type,
    e.actor_id,
    sum(e.runs_count)::bigint,
    sum(e.points)::bigint,
    now()
  from public.leaderboard_events e
  where e.occurred_at >= p_from and e.occurred_at < p_to
  group by 1,2,3,4,5,6
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = excluded.runs_count,
    points = excluded.points,
    updated_at = now();

  -- ALL TIME rollup (always recompute from full table in a separate job, or incremental here)
  -- Incremental: only add new window deltas (safer for high volume)
  insert into public.leaderboard_rollups (period, period_key, country_code, admin1_code, actor_type, actor_id, runs_count, points, updated_at)
  select
    'all_time'::public.leaderboard_period,
    'all' as period_key,
    e.country_code,
    nullif(e.admin1_code,'') as admin1_code,
    e.actor_type,
    e.actor_id,
    sum(e.runs_count)::bigint,
    sum(e.points)::bigint,
    now()
  from public.leaderboard_events e
  where e.occurred_at >= p_from and e.occurred_at < p_to
  group by 1,2,3,4,5,6
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = public.leaderboard_rollups.runs_count + excluded.runs_count,
    points    = public.leaderboard_rollups.points + excluded.points,
    updated_at = now();
end;
$$;

revoke all on function public.rollup_leaderboards(timestamptz, timestamptz) from public;
grant execute on function public.rollup_leaderboards(timestamptz, timestamptz) to service_role;
