-- =========================================================
-- audit.countries_control + daily tier usage RPC
-- + merge sweep wrapper RPCs for edge function
-- Deployed: 2026-03-03
-- =========================================================

-- Country control plane for merge sweep scheduling
create table if not exists audit.countries_control (
  country_code        text primary key,
  tier                text not null check (tier in ('A','B','C','D')),
  enabled             boolean not null default true,
  merge_sweep_enabled boolean not null default true,
  weekly_group        text,  -- 'w1'..'w4' for rolling weekly batches
  notes               text,
  updated_at          timestamptz not null default now()
);

create index if not exists countries_control_tier_idx
  on audit.countries_control (tier, enabled, merge_sweep_enabled);

-- Seed 52 countries: A=nightly(US,CA) B=major(15) C=mid(19) D=small(16)
insert into audit.countries_control(country_code, tier, weekly_group, notes) values
  ('US', 'A', null, 'Nightly sweep — primary market'),
  ('CA', 'A', null, 'Nightly sweep — primary market'),
  ('GB', 'B', 'w1', 'Major EU/Commonwealth'), ('AU', 'B', 'w1', 'Major Commonwealth'),
  ('NZ', 'B', 'w1', 'Commonwealth Pacific'), ('DE', 'B', 'w1', 'Major EU'),
  ('NL', 'B', 'w1', 'Major EU'), ('FR', 'B', 'w2', 'Major EU'),
  ('AE', 'B', 'w2', 'Major MENA'), ('SA', 'B', 'w2', 'Major MENA'),
  ('ZA', 'B', 'w2', 'Major Africa'), ('BR', 'B', 'w2', 'Major LATAM'),
  ('MX', 'B', 'w3', 'Major LATAM'), ('JP', 'B', 'w3', 'Major APAC'),
  ('KR', 'B', 'w3', 'Major APAC'), ('IN', 'B', 'w3', 'Major APAC'),
  ('SG', 'B', 'w3', 'Major APAC'),
  ('IE', 'C', 'w1', 'EU mid-tier'), ('BE', 'C', 'w1', 'EU mid-tier'),
  ('AT', 'C', 'w1', 'EU mid-tier'), ('CH', 'C', 'w1', 'EU mid-tier'),
  ('IT', 'C', 'w2', 'EU mid-tier'), ('ES', 'C', 'w2', 'EU mid-tier'),
  ('PT', 'C', 'w2', 'EU mid-tier'), ('SE', 'C', 'w2', 'EU mid-tier'),
  ('NO', 'C', 'w2', 'EU mid-tier'), ('DK', 'C', 'w3', 'EU mid-tier'),
  ('FI', 'C', 'w3', 'EU mid-tier'), ('PL', 'C', 'w3', 'EU mid-tier'),
  ('CZ', 'C', 'w3', 'EU mid-tier'), ('MY', 'C', 'w3', 'APAC mid-tier'),
  ('TR', 'C', 'w4', 'MENA mid-tier'), ('CL', 'C', 'w4', 'LATAM mid-tier'),
  ('TW', 'C', 'w4', 'APAC mid-tier'), ('IL', 'C', 'w4', 'MENA mid-tier'),
  ('QA', 'C', 'w4', 'Gulf mid-tier'),
  ('TH', 'D', 'w1', 'APAC small'), ('PH', 'D', 'w1', 'APAC small'),
  ('ID', 'D', 'w1', 'APAC small'), ('VN', 'D', 'w2', 'APAC small'),
  ('KW', 'D', 'w2', 'Gulf small'), ('OM', 'D', 'w2', 'Gulf small'),
  ('BH', 'D', 'w2', 'Gulf small'), ('NG', 'D', 'w3', 'Africa small'),
  ('KE', 'D', 'w3', 'Africa small'), ('CO', 'D', 'w3', 'LATAM small'),
  ('AR', 'D', 'w3', 'LATAM small'), ('PE', 'D', 'w4', 'LATAM small'),
  ('EG', 'D', 'w4', 'MENA small'), ('RO', 'D', 'w4', 'EU small'),
  ('HU', 'D', 'w4', 'EU small'), ('GR', 'D', 'w4', 'EU small')
on conflict (country_code) do nothing;

alter table audit.countries_control enable row level security;
create policy cc_svc on audit.countries_control for all to service_role using (true) with check (true);

-- Daily usage by tier
create or replace function public.hc_daily_merge_units_by_tier(p_day_utc text)
returns table(tier text, units_used numeric)
language sql security definer set search_path = audit, public as $$
  with day_bounds as (
    select (p_day_utc::date)::timestamptz as start_ts,
           ((p_day_utc::date + interval '1 day')::timestamptz) as end_ts
  )
  select cc.tier, coalesce(sum(j.cost_units), 0)::numeric as units_used
  from audit.job_runs j
  join audit.countries_control cc on cc.country_code = j.country_code
  cross join day_bounds d
  where j.job_name = 'hc_merge_sweep'
    and j.started_at >= d.start_ts and j.started_at < d.end_ts
    and j.status = 'ok'
  group by cc.tier order by cc.tier;
$$;

revoke all on function public.hc_daily_merge_units_by_tier(text) from public, anon, authenticated;
grant execute on function public.hc_daily_merge_units_by_tier(text) to service_role;

-- Wrapper RPCs for edge function (audit schema not exposed via PostgREST)
create or replace function public.hc_start_wrapper_job(p_job_name text, p_notes text default null)
returns uuid language plpgsql security definer set search_path = audit, public as $$
declare v_run_id uuid;
begin
  insert into audit.job_runs(job_name, country_code, source_id, started_at, status, metrics, cost_units, notes)
  values (p_job_name, null, null, now(), 'partial', '{}'::jsonb, 0, p_notes)
  returning run_id into v_run_id;
  return v_run_id;
end;
$$;

create or replace function public.hc_finish_wrapper_job(
  p_run_id uuid, p_status text, p_metrics jsonb default '{}'::jsonb,
  p_cost_units numeric default 0, p_notes text default null
) returns void language plpgsql security definer set search_path = audit, public as $$
begin
  update audit.job_runs set ended_at = now(), status = p_status::audit.hc_job_status,
    metrics = p_metrics, cost_units = p_cost_units, notes = coalesce(p_notes, notes)
  where run_id = p_run_id;
end;
$$;

create or replace function public.hc_fetch_merge_sweep_countries(
  p_tiers text[] default null, p_country_code text default null
) returns table(country_code text, tier text, enabled boolean, merge_sweep_enabled boolean, weekly_group text)
language sql security definer set search_path = audit, public as $$
  select cc.country_code, cc.tier, cc.enabled, cc.merge_sweep_enabled, cc.weekly_group
  from audit.countries_control cc
  where cc.enabled = true and cc.merge_sweep_enabled = true
    and (p_tiers is null or cc.tier = any(p_tiers))
    and (p_country_code is null or cc.country_code = upper(p_country_code))
  order by cc.tier, cc.country_code;
$$;

create or replace function public.hc_run_merge_sweep_for_country(
  p_country_code text, p_entity_type text,
  p_batch_size int default 25, p_max_batches int default 5,
  p_max_merges_total int default 300, p_max_merges_per_cluster int default 15,
  p_max_distance_m int default 150, p_min_name_sim numeric default 0.75,
  p_dry_run boolean default false
) returns jsonb language plpgsql security definer set search_path = canon, public as $$
begin
  return canon.hc_merge_sweep(
    p_country_code, p_entity_type::canon.hc_entity_type,
    p_batch_size, p_max_batches, p_max_merges_total, p_max_merges_per_cluster,
    p_max_distance_m, p_min_name_sim, p_dry_run
  );
end;
$$;

-- Lock all RPCs to service_role only
revoke all on function public.hc_start_wrapper_job(text, text) from public, anon, authenticated;
grant execute on function public.hc_start_wrapper_job(text, text) to service_role;
revoke all on function public.hc_finish_wrapper_job(uuid, text, jsonb, numeric, text) from public, anon, authenticated;
grant execute on function public.hc_finish_wrapper_job(uuid, text, jsonb, numeric, text) to service_role;
revoke all on function public.hc_fetch_merge_sweep_countries(text[], text) from public, anon, authenticated;
grant execute on function public.hc_fetch_merge_sweep_countries(text[], text) to service_role;
revoke all on function public.hc_run_merge_sweep_for_country(text, text, int, int, int, int, int, numeric, boolean) from public, anon, authenticated;
grant execute on function public.hc_run_merge_sweep_for_country(text, text, int, int, int, int, int, numeric, boolean) to service_role;
