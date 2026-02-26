-- 0012_leaderboards_realtime_trigger.sql

create or replace function public.apply_event_to_rollups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  month_key text := to_char(date_trunc('month', NEW.occurred_at), 'YYYY-MM');
  season_key text := public.season_year_key(NEW.occurred_at)::text;
begin
  -- month
  insert into public.leaderboard_rollups (period, period_key, country_code, admin1_code, actor_type, actor_id, runs_count, points, updated_at)
  values ('month', month_key, NEW.country_code, nullif(NEW.admin1_code,''), NEW.actor_type, NEW.actor_id, NEW.runs_count, NEW.points, now())
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = public.leaderboard_rollups.runs_count + excluded.runs_count,
    points    = public.leaderboard_rollups.points + excluded.points,
    updated_at = now();

  -- season_year (Feb 20 reset)
  insert into public.leaderboard_rollups (period, period_key, country_code, admin1_code, actor_type, actor_id, runs_count, points, updated_at)
  values ('season_year', season_key, NEW.country_code, nullif(NEW.admin1_code,''), NEW.actor_type, NEW.actor_id, NEW.runs_count, NEW.points, now())
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = public.leaderboard_rollups.runs_count + excluded.runs_count,
    points    = public.leaderboard_rollups.points + excluded.points,
    updated_at = now();

  -- all_time
  insert into public.leaderboard_rollups (period, period_key, country_code, admin1_code, actor_type, actor_id, runs_count, points, updated_at)
  values ('all_time', 'all', NEW.country_code, nullif(NEW.admin1_code,''), NEW.actor_type, NEW.actor_id, NEW.runs_count, NEW.points, now())
  on conflict (period, period_key, country_code, admin1_code, actor_type, actor_id)
  do update set
    runs_count = public.leaderboard_rollups.runs_count + excluded.runs_count,
    points    = public.leaderboard_rollups.points + excluded.points,
    updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists trg_apply_event_to_rollups on public.leaderboard_events;
create trigger trg_apply_event_to_rollups
after insert on public.leaderboard_events
for each row execute function public.apply_event_to_rollups();
