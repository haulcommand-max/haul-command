-- 0013_driver_rank_tiers_v2.sql

create or replace function public.driver_rank_tier(total_runs bigint)
returns text
language sql
stable
as $$
  select case
    when total_runs < 5 then 'fresh meat'
    when total_runs < 20 then 'green thumb'
    when total_runs < 50 then 'cone collector'
    when total_runs < 150 then 'mirror ninja'
    when total_runs < 400 then 'cb preacher'
    when total_runs < 1000 then 'curfew assassin'
    when total_runs < 2500 then 'route whisperer'
    when total_runs < 6000 then 'high-pole sensei'
    when total_runs < 15000 then 'permit reaper'
    when total_runs < 40000 then 'state-line warlord'
    when total_runs < 100000 then 'interstate tyrant'
    when total_runs < 250000 then 'legendary asphalt'
    else 'mythic: bo jackson mode'
  end;
$$;
