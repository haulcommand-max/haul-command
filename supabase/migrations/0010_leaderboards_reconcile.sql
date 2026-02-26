-- 0010_leaderboards_reconcile.sql

create or replace function public.reconcile_leaderboards()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  month_start timestamptz := date_trunc('month', now());
  prev_month_start timestamptz := date_trunc('month', now() - interval '1 month');
  next_month_start timestamptz := date_trunc('month', now() + interval '1 month');

  season_start timestamptz;
  season_end   timestamptz;
  curr_season_year int := public.season_year_key(now());
begin
  -- Compute season window: Feb 20 (curr_season_year) -> Feb 20 (curr_season_year + 1)
  season_start := make_timestamptz(curr_season_year, 2, 20, 0, 0, 0, 'UTC');
  season_end   := make_timestamptz(curr_season_year + 1, 2, 20, 0, 0, 0, 'UTC');

  -- 1) Delete rollups for affected windows (month + season_year) so we can reinsert cleanly
  delete from public.leaderboard_rollups
  where
    (period = 'month' and period_key in (
      to_char(prev_month_start, 'YYYY-MM'),
      to_char(month_start, 'YYYY-MM')
    ))
    or
    (period = 'season_year' and period_key = curr_season_year::text);

  -- 2) Rebuild prev month + current month + current season-year
  perform public.rollup_leaderboards(prev_month_start, next_month_start);
  perform public.rollup_leaderboards(season_start, season_end);

  -- 3) Rebuild ALL_TIME from scratch (authoritative)
  delete from public.leaderboard_rollups where period = 'all_time' and period_key = 'all';

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
  group by 1,2,3,4,5,6;

end;
$$;

revoke all on function public.reconcile_leaderboards() from public;
grant execute on function public.reconcile_leaderboards() to service_role;
