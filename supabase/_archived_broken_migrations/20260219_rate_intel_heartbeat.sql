-- 20260219_rate_intel_heartbeat.sql
-- Phase 13: Rate Intelligence & Broker Heartbeat

-- 1. Rate Benchmarks Table
create table if not exists public.rate_benchmarks (
  id uuid primary key default gen_random_uuid(),

  country text not null default 'US',
  region text not null,              -- 'southeast', 'midwest', 'northeast', 'west', 'southwest', 'plains'
  service_type text not null,        -- 'lead', 'chase', 'high_pole', 'survey', 'security', 'bucket_truck'

  low_per_mile numeric,
  high_per_mile numeric,
  day_rate_low numeric,
  day_rate_high numeric,

  source text default 'haul_command_guide',
  updated_at timestamptz default now(),

  unique(country, region, service_type)
);

alter table public.rate_benchmarks enable row level security;
create policy "rate_benchmarks_read_all" on public.rate_benchmarks for select using (true);
create policy "rate_benchmarks_write_admin" on public.rate_benchmarks for all using (public.is_moderator());

-- 2. Schema Additions
alter table public.loads
add column if not exists broker_heartbeat_at timestamptz;

alter table public.load_intel
add column if not exists rate_position_01 numeric, -- 0.0 to 1.0 (or higher if great)
add column if not exists rate_signal text;         -- 'strong', 'fair', 'below'

-- 3. Logic: Compute Rate Position
create or replace function public.compute_rate_position_01(
  p_rate_per_mile numeric,
  p_low numeric,
  p_high numeric
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0,
    least(
      1,
      (p_rate_per_mile - p_low) / nullif(p_high - p_low, 0)
    )
  );
$$;

-- 4. Logic: Rate Signal
-- (Implemented in application layer usually, but helpful as computed col or during ingest)

-- 5. Updated Sweeper (Includes Heartbeat Logic)
create or replace function public.sweep_stale_loads(
  p_batch int default 1500,
  p_window_days int default 14,
  p_soft_ghost_threshold numeric default 0.75,
  p_hard_expire_hours int default 168,        -- 7 days hard expire
  p_ghost_expire_hours int default 96          -- 4 days + ghosty => expire
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock boolean;
  v_processed int := 0;
  v_demoted int := 0;
  v_expired int := 0;

  r record;
  v_trust numeric;
  v_unlocks24 int;
  v_ghost numeric;
  v_age_hours numeric;
  v_heartbeat_age_hours numeric;
  v_redirect_to text;
  v_from_path text;
begin
  -- Advisory lock
  select pg_try_advisory_lock(77889900) into v_lock;
  if not v_lock then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'lock_not_acquired');
  end if;

  for r in
    select
      l.id,
      l.posted_at,
      l.last_seen_at,
      l.broker_heartbeat_at,
      l.origin_country, l.origin_admin1, l.origin_city,
      l.dest_country, l.dest_admin1, l.dest_city,
      l.service_required,
      l.broker_id,
      l.ghost_score, -- current score
      bm.trust_score as broker_trust_01
    from public.loads l
    left join public.broker_metrics bm on bm.broker_id = l.broker_id and bm.window_days = 30
    where l.status = 'active'
      and l.posted_at >= (now() - make_interval(days => p_window_days))
    order by l.posted_at asc
    limit p_batch
  loop
    v_processed := v_processed + 1;

    -- A. Engagement check
    select count(*) into v_unlocks24
    from public.contact_unlocks
    where load_id = r.id
      and unlocked_at >= (now() - interval '24 hours');

    -- B. Compute Base Ghost Score
    v_trust := greatest(0, least(1, coalesce(r.broker_trust_01, 0.5)));
    v_ghost := public.compute_ghost_score_01(r.posted_at, r.last_seen_at, v_trust, v_unlocks24);
    
    -- C. Heartbeat Penalty
    -- If broker hasn't touched it in 72h, add penalty
    v_heartbeat_age_hours := extract(epoch from (now() - coalesce(r.broker_heartbeat_at, r.posted_at))) / 3600.0;
    
    if v_heartbeat_age_hours > 72 then
       v_ghost := least(1, v_ghost + 0.25);
    end if;

    v_age_hours := extract(epoch from (now() - r.posted_at)) / 3600.0;

    -- D. Update ghost_score
    if v_ghost != r.ghost_score then
        update public.loads set ghost_score = v_ghost where id = r.id;
    end if;

    -- E. Demote if ghosty
    if v_ghost >= p_soft_ghost_threshold then
      perform public.apply_ghost_demotion(r.id, v_ghost);
      v_demoted := v_demoted + 1;
    end if;

    -- F. Expire conditions
    -- 1. Hard Age Limit (7 days)
    -- 2. Ghost Age Limit (4 days + ghosty)
    -- 3. Heartbeat Limit (5 days / 120h without touch)
    if v_age_hours >= p_hard_expire_hours
       or (v_age_hours >= p_ghost_expire_hours and v_ghost >= 0.85)
       or (v_heartbeat_age_hours >= 120) 
    then
      update public.loads
      set status = 'expired', expired_at = now()
      where id = r.id and status='active';

      -- SEO Redirect
      v_from_path := '/loads/' || r.id::text;
      v_redirect_to := public.pick_redirect_target_for_load(
        r.origin_country, r.origin_admin1, r.origin_city,
        r.dest_country, r.dest_admin1, r.dest_city,
        r.service_required
      );

      insert into public.seo_redirects(from_path, to_path, code, reason)
      values (v_from_path, v_redirect_to, 301, 'expired_load')
      on conflict (from_path) do nothing;

      v_expired := v_expired + 1;
    end if;
  end loop;

  perform pg_advisory_unlock(77889900);

  return jsonb_build_object(
    'ok', true,
    'processed', v_processed,
    'demoted', v_demoted,
    'expired', v_expired
  );
end;
$$;

-- 6. Helper: Record Heartbeat
create or replace function public.record_broker_heartbeat(p_load_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.loads
  set broker_heartbeat_at = now()
  where id = p_load_id;
$$;

-- 7. Seed Benchmarks (Baseline)
insert into public.rate_benchmarks (country, region, service_type, low_per_mile, high_per_mile, day_rate_low, day_rate_high)
values
-- Southeast
('US', 'southeast', 'lead', 1.85, 2.25, 450, 600),
('US', 'southeast', 'chase', 1.85, 2.25, 450, 600),
('US', 'southeast', 'high_pole', 2.10, 2.75, 550, 750),
-- Midwest
('US', 'midwest', 'lead', 1.90, 2.30, 475, 625),
('US', 'midwest', 'chase', 1.90, 2.30, 475, 625),
('US', 'midwest', 'high_pole', 2.15, 2.85, 600, 800),
-- West
('US', 'west', 'lead', 2.00, 2.50, 500, 700),
('US', 'west', 'chase', 2.00, 2.50, 500, 700),
('US', 'west', 'high_pole', 2.25, 3.00, 650, 900),
-- Northeast
('US', 'northeast', 'lead', 2.10, 2.60, 550, 750),
('US', 'northeast', 'chase', 2.10, 2.60, 550, 750),
('US', 'northeast', 'high_pole', 2.50, 3.25, 700, 1000)
on conflict (country, region, service_type) do nothing;
