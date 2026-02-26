-- 20260219_stale_load_sweeper.sql
-- Phase 12: Ghost Protocol & SEO Redirects

-- 0. Helper Functions
create or replace function public.is_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'moderator')
  );
$$;

-- 1. Minimal status + timestamps
alter table public.loads
add column if not exists last_seen_at timestamptz,          -- last time broker/carrier touched it
add column if not exists filled_at timestamptz,
add column if not exists expired_at timestamptz,
add column if not exists ghost_score numeric not null default 0; -- 0..1

-- 2. Redirect map for SEO
create table if not exists public.seo_redirects (
  from_path text primary key,             -- e.g. /loads/abc123
  to_path text not null,                  -- e.g. /loads/florida
  code int not null default 301,          -- 301 permanent
  reason text not null default 'expired_load',
  created_at timestamptz not null default now()
);

alter table public.seo_redirects enable row level security;

drop policy if exists "seo_redirects_public_read" on public.seo_redirects;
create policy "seo_redirects_public_read"
on public.seo_redirects for select
to anon, authenticated
using (true);

-- Writes only by service/moderators
drop policy if exists "seo_redirects_write_mod_only" on public.seo_redirects;
create policy "seo_redirects_write_mod_only"
on public.seo_redirects for all
to authenticated
using (public.is_moderator())
with check (public.is_moderator());

-- 3. Load Intel Updates
alter table public.load_intel
add column if not exists ghost_badge boolean not null default false;

-- 4. Logic Functions

-- Ghost Score Calculation
create or replace function public.compute_ghost_score_01(
  p_posted_at timestamptz,
  p_last_seen_at timestamptz,
  p_broker_trust_01 numeric,
  p_recent_unlocks_24h int default 0
)
returns numeric
language plpgsql
stable
as $$
declare
  hours_posted numeric := extract(epoch from (now() - p_posted_at)) / 3600.0;
  hours_seen numeric := case when p_last_seen_at is null then 9999 else extract(epoch from (now() - p_last_seen_at)) / 3600.0 end;
  trust numeric := greatest(0, least(1, coalesce(p_broker_trust_01, 0.5)));
  unlocks int := coalesce(p_recent_unlocks_24h, 0);

  age_score numeric;
  seen_score numeric;
  trust_score numeric;
  unlock_score numeric;
  score numeric;
begin
  -- age: ramps from 0 at 6h to 1 at 72h
  age_score := greatest(0, least(1, (hours_posted - 6) / (72 - 6)));

  -- last seen: if broker hasn't touched it, ghost rises (0 at 2h, 1 at 48h)
  seen_score := greatest(0, least(1, (hours_seen - 2) / (48 - 2)));

  -- low trust increases ghost likelihood
  trust_score := 1 - trust; -- 1=bad trust, 0=good trust

  -- engagement: if people are unlocking, it's probably real
  unlock_score := case
    when unlocks >= 8 then 0.0
    when unlocks >= 3 then 0.35
    when unlocks >= 1 then 0.6
    else 1.0
  end;

  -- weights: age + last_seen dominate; trust + engagement refine
  score := age_score*0.45 + seen_score*0.35 + trust_score*0.12 + unlock_score*0.08;

  return greatest(0, least(1, score));
end;
$$;

-- Apply Demotion
create or replace function public.apply_ghost_demotion(
  p_load_id uuid,
  p_ghost_score_01 numeric
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.load_intel
  set
    ghost_badge = (p_ghost_score_01 >= 0.75),
    -- demote rank (cap at -40 points)
    load_rank = greatest(0, load_rank - (least(40, (p_ghost_score_01 * 40))) )
  where load_id = p_load_id;
$$;

-- Pick Redirect Target
create or replace function public.pick_redirect_target_for_load(
  p_origin_country text, p_origin_admin1 text, p_origin_city text,
  p_dest_country text, p_dest_admin1 text, p_dest_city text,
  p_service text
)
returns text
language plpgsql
stable
as $$
declare
  lane_path text;
  city_path text;
  state_path text;
begin
  -- Routing logic
  -- /lanes/fl-miami-to-tx-houston/pilot-car
  lane_path := '/lanes/' || lower(coalesce(p_origin_admin1, 'us')) || '-' || lower(coalesce(p_origin_city, 'city')) || '-to-' || lower(coalesce(p_dest_admin1, 'us')) || '-' || lower(coalesce(p_dest_city, 'city')) || '/' || lower(replace(coalesce(p_service, 'general'),' ','-'));
  
  -- Fallback to simple loads page if complex routing fails or looks weird
  return lane_path;
exception when others then
  return '/loads';
end;
$$;

-- Sweeper Worker
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
  v_redirect_to text;
  v_from_path text;
begin
  -- Advisory lock to prevent overlapping runs
  select pg_try_advisory_lock(77889900) into v_lock;
  if not v_lock then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'lock_not_acquired');
  end if;

  for r in
    select
      l.id,
      l.posted_at,
      l.last_seen_at,
      l.origin_country, l.origin_admin1, l.origin_city,
      l.dest_country, l.dest_admin1, l.dest_city,
      l.service_required,
      l.broker_id,
      bm.trust_score as broker_trust_01
    from public.loads l
    left join public.broker_metrics bm on bm.broker_id = l.broker_id and bm.window_days = 30
    where l.status = 'active'
      and l.posted_at >= (now() - make_interval(days => p_window_days))
    order by l.posted_at asc
    limit p_batch
  loop
    v_processed := v_processed + 1;

    -- Engagement check
    select count(*) into v_unlocks24
    from public.contact_unlocks
    where load_id = r.id
      and unlocked_at >= (now() - interval '24 hours');

    v_trust := greatest(0, least(1, coalesce(r.broker_trust_01, 0.5)));

    v_ghost := public.compute_ghost_score_01(r.posted_at, r.last_seen_at, v_trust, v_unlocks24);
    v_age_hours := extract(epoch from (now() - r.posted_at)) / 3600.0;

    -- Update ghost_score
    update public.loads set ghost_score = v_ghost where id = r.id;

    -- Demote if ghosty
    if v_ghost >= p_soft_ghost_threshold then
      perform public.apply_ghost_demotion(r.id, v_ghost);
      v_demoted := v_demoted + 1;
    end if;

    -- Expire conditions
    if v_age_hours >= p_hard_expire_hours
       or (v_age_hours >= p_ghost_expire_hours and v_ghost >= 0.85)
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
