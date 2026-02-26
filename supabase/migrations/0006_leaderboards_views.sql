-- 0006_leaderboards_views.sql

-- Country top 3 (US + CA), for any period
create or replace view public.directory_leaderboard_top3_country as
select
  period,
  period_key,
  country_code,
  actor_type,
  actor_id,
  runs_count,
  points,
  row_number() over (
    partition by period, period_key, country_code, actor_type
    order by runs_count desc, points desc, actor_id
  ) as rank
from public.leaderboard_rollups
where admin1_code is null;

-- State/Province top 3
create or replace view public.directory_leaderboard_top3_admin1 as
select
  period,
  period_key,
  country_code,
  admin1_code,
  actor_type,
  actor_id,
  runs_count,
  points,
  row_number() over (
    partition by period, period_key, country_code, admin1_code, actor_type
    order by runs_count desc, points desc, actor_id
  ) as rank
from public.leaderboard_rollups
where admin1_code is not null;

-- Convenience: current month + current season-year keys (server-side)
create or replace function public.current_month_key()
returns text language sql stable as $$
  select to_char(date_trunc('month', now()), 'YYYY-MM');
$$;

create or replace function public.current_season_year_key()
returns text language sql stable as $$
  select public.season_year_key(now())::text;
$$;
