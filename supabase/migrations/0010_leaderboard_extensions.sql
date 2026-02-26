-- 0010_leaderboard_extensions.sql

-- 1) Add specific metric columns to the rollup table
-- This keeps the table efficient (1 row per actor/period) while supporting multiple "category killer" boards
alter table public.leaderboard_rollups
add column if not exists hazards_verified int not null default 0,
add column if not exists miles_driven bigint not null default 0,
add column if not exists on_time_count int not null default 0;

-- 2) Update the rollup function to aggregate these specific metrics
create or replace function public.rollup_leaderboards(p_from timestamptz, p_to timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- MONTH rollup (YYYY-MM)
  insert into public.leaderboard_rollups (
    period, period_key, country_code, admin1_code, actor_type, actor_id,
    runs_count, points, hazards_verified, miles_driven, on_time_count, updated_at
  )
  select
    'month'::public.leaderboard_period,
    to_char(date_trunc('month', e.occurred_at), 'YYYY-MM') as period_key,
    e.country_code,
    nullif(e.admin1_code,'') as admin1_code,
    e.actor_type,
    e.actor_id,
    sum(e.runs_count)::bigint,
    sum(e.points)::bigint,
    sum(case when e.event_kind = 'hazard_verified' then 1 else 0 end)::int,
    sum(case when e.event_kind = 'miles_logged' then e.points else 0 end)::bigint, -- Convention: points=miles for this event
    sum(case when e.event_kind = 'job_completed_ontime' then 1 else 0 end)::int,
    now()
  from public.leaderboard_events e
  where e.occurred_at >= p_from and e.occurred_at < p_to
  group by 1,2,3,4,5,6
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = excluded.runs_count,
    points = excluded.points,
    hazards_verified = excluded.hazards_verified,
    miles_driven = excluded.miles_driven,
    on_time_count = excluded.on_time_count,
    updated_at = now();

  -- SEASON YEAR rollup (Feb20 reset)
  insert into public.leaderboard_rollups (
    period, period_key, country_code, admin1_code, actor_type, actor_id,
    runs_count, points, hazards_verified, miles_driven, on_time_count, updated_at
  )
  select
    'season_year'::public.leaderboard_period,
    public.season_year_key(e.occurred_at)::text as period_key,
    e.country_code,
    nullif(e.admin1_code,'') as admin1_code,
    e.actor_type,
    e.actor_id,
    sum(e.runs_count)::bigint,
    sum(e.points)::bigint,
    sum(case when e.event_kind = 'hazard_verified' then 1 else 0 end)::int,
    sum(case when e.event_kind = 'miles_logged' then e.points else 0 end)::bigint,
    sum(case when e.event_kind = 'job_completed_ontime' then 1 else 0 end)::int,
    now()
  from public.leaderboard_events e
  where e.occurred_at >= p_from and e.occurred_at < p_to
  group by 1,2,3,4,5,6
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = excluded.runs_count,
    points = excluded.points,
    hazards_verified = excluded.hazards_verified,
    miles_driven = excluded.miles_driven,
    on_time_count = excluded.on_time_count,
    updated_at = now();

  -- ALL TIME rollup (incremental)
  insert into public.leaderboard_rollups (
    period, period_key, country_code, admin1_code, actor_type, actor_id,
    runs_count, points, hazards_verified, miles_driven, on_time_count, updated_at
  )
  select
    'all_time'::public.leaderboard_period,
    'all' as period_key,
    e.country_code,
    nullif(e.admin1_code,'') as admin1_code,
    e.actor_type,
    e.actor_id,
    sum(e.runs_count)::bigint,
    sum(e.points)::bigint,
    sum(case when e.event_kind = 'hazard_verified' then 1 else 0 end)::int,
    sum(case when e.event_kind = 'miles_logged' then e.points else 0 end)::bigint,
    sum(case when e.event_kind = 'job_completed_ontime' then 1 else 0 end)::int,
    now()
  from public.leaderboard_events e
  where e.occurred_at >= p_from and e.occurred_at < p_to
  group by 1,2,3,4,5,6
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = public.leaderboard_rollups.runs_count + excluded.runs_count,
    points     = public.leaderboard_rollups.points + excluded.points,
    hazards_verified = public.leaderboard_rollups.hazards_verified + excluded.hazards_verified,
    miles_driven     = public.leaderboard_rollups.miles_driven + excluded.miles_driven,
    on_time_count    = public.leaderboard_rollups.on_time_count + excluded.on_time_count,
    updated_at = now();
end;
$$;

-- 3) Category Killer Views (public)

-- Most Hazards (Waze++ Loop)
create or replace view public.leaderboard_most_hazards as
select
  period, period_key, country_code, admin1_code, actor_type, actor_id,
  hazards_verified as score,
  row_number() over (partition by period, period_key, country_code, admin1_code, actor_type order by hazards_verified desc) as rank
from public.leaderboard_rollups
where hazards_verified > 0;

-- Most Verified Miles
create or replace view public.leaderboard_most_miles as
select
  period, period_key, country_code, admin1_code, actor_type, actor_id,
  miles_driven as score,
  row_number() over (partition by period, period_key, country_code, admin1_code, actor_type order by miles_driven desc) as rank
from public.leaderboard_rollups
where miles_driven > 0;

-- Most On-Time
create or replace view public.leaderboard_most_ontime as
select
  period, period_key, country_code, admin1_code, actor_type, actor_id,
  on_time_count as score,
  row_number() over (partition by period, period_key, country_code, admin1_code, actor_type order by on_time_count desc) as rank
from public.leaderboard_rollups
where on_time_count > 0;
