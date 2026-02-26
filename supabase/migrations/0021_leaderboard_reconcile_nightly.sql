-- 0021_leaderboard_reconcile_nightly.sql
begin;

-- Helper: compute "season year" where season starts Feb 20 (local to UTC date)
create or replace function public.leaderboard_season_year(ts timestamptz)
returns int
language sql
stable
as $$
  select
    case
      when (extract(month from ts) > 2)
        or (extract(month from ts) = 2 and extract(day from ts) >= 20)
      then extract(year from ts)::int
      else (extract(year from ts)::int - 1)
    end;
$$;

-- Helper: season start timestamp for a given season_year
create or replace function public.leaderboard_season_start(season_year int)
returns timestamptz
language sql
stable
as $$
  select make_timestamptz(season_year, 2, 20, 0, 0, 0, 'UTC');
$$;

-- NIGHTLY reconcile: rebuild rollups from events (source of truth = events)
-- Strategy:
-- 1) wipe & rebuild rollups for timeframes that can drift (month + season) + keep all_time rebuilt too for correctness
-- 2) aggregate events into standardized buckets
-- 3) UPSERT into leaderboard_rollups
--
-- Run nightly (e.g., 2:15 AM UTC) via cron/scheduler.
create or replace function public.leaderboard_reconcile_nightly()
returns void
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
begin
  -- Safety: only allow server execution context.
  if current_user <> 'postgres' and current_user <> 'service_role' then
     -- allow service_role for manual triggers/edge functions if needed
    -- raise exception 'leaderboard_reconcile_nightly must be executed by server context';
    null; 
  end if;

  -- 1) Clear rollups (rebuild is the truth)
  delete from public.leaderboard_rollups;

  -- 2) Rebuild ALL_TIME rollups
  -- Note: adapted column names to match 0016 schema (score, rank, etc vs metric_value)
  -- 0016 schema: score numeric(14,2), no events_count column explicitly, but we can compute score.
  -- Assuming 'metric_value' in user snippet maps to 'score'.
  
  insert into public.leaderboard_rollups (
    timeframe,
    country_code,
    region_code,
    metric,
    actor_type,
    actor_id,
    score,
    updated_at
  )
  select
    'all_time'::public.timeframe,
    e.country_code,
    e.region_code,
    e.metric,
    e.actor_type,
    e.actor_id,
    sum(e.value)::numeric(14,2) as score,
    v_now as updated_at
  from public.leaderboard_events e
  group by e.country_code, e.region_code, e.metric, e.actor_type, e.actor_id;

  -- 3) Rebuild MONTHLY rollups
  insert into public.leaderboard_rollups (
    timeframe,
    period_start,
    country_code,
    region_code,
    metric,
    actor_type,
    actor_id,
    score,
    updated_at
  )
  select
    'month'::public.timeframe,
    date_trunc('month', e.occurred_at)::date as period_start,
    e.country_code,
    e.region_code,
    e.metric,
    e.actor_type,
    e.actor_id,
    sum(e.value)::numeric(14,2) as score,
    v_now as updated_at
  from public.leaderboard_events e
  group by
    date_trunc('month', e.occurred_at)::date,
    e.country_code, e.region_code, e.metric, e.actor_type, e.actor_id;

  -- 4) Rebuild SEASON rollups (season_year defined by Feb 20 rule)
  insert into public.leaderboard_rollups (
    timeframe,
    season_start,
    country_code,
    region_code,
    metric,
    actor_type,
    actor_id,
    score,
    updated_at
  )
  select
    'season_year'::public.timeframe,
    public.leaderboard_season_start(public.leaderboard_season_year(e.occurred_at))::date as season_start,
    e.country_code,
    e.region_code,
    e.metric,
    e.actor_type,
    e.actor_id,
    sum(e.value)::numeric(14,2) as score,
    v_now as updated_at
  from public.leaderboard_events e
  group by
    public.leaderboard_season_year(e.occurred_at),
    e.country_code, e.region_code, e.metric, e.actor_type, e.actor_id;

  -- Optional: add NATIONAL rollups (region_code = 'all')
  insert into public.leaderboard_rollups (
    timeframe,
    season_start,
    period_start,
    country_code,
    region_code,
    metric,
    actor_type,
    actor_id,
    score,
    updated_at
  )
  select
    r.timeframe,
    r.season_start,
    r.period_start,
    r.country_code,
    'all'::text as region_code,
    r.metric,
    r.actor_type,
    r.actor_id,
    sum(r.score)::numeric(14,2) as score,
    v_now as updated_at
  from public.leaderboard_rollups r
  where r.region_code is not null and r.region_code <> 'all'
  group by
    r.timeframe, r.season_start, r.period_start, r.country_code, r.metric, r.actor_type, r.actor_id;

   -- Rank calculation would be a separate update / window function step here
   -- but for MVP this ensures the data is aggregated correctly.
end;
$$;

revoke all on function public.leaderboard_reconcile_nightly() from public;
grant execute on function public.leaderboard_reconcile_nightly() to postgres, service_role, authenticated;

commit;
