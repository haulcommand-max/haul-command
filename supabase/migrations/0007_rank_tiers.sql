-- 0007_rank_tiers.sql
create or replace function public.driver_rank_tier(total_runs bigint)
returns text
language sql
stable
as $$
  select case
    when total_runs < 5 then 'fresh meat'
    when total_runs < 20 then 'cone commander'
    when total_runs < 50 then 'mirror ninja'
    when total_runs < 100 then 'cb whisperer'
    when total_runs < 250 then 'curfew assassin'
    when total_runs < 500 then 'high-pole sensei'
    else 'road legend'
  end;
$$;
