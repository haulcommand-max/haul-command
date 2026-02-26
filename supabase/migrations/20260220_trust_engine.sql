-- =========================
-- TRUST ENGINE (v1)
-- Supabase/Postgres
-- =========================
-- Assumes you already have public.profiles(id uuid primary key, type text, ...)
-- Roles used: driver, escort, broker, shipper, vendor

begin;

-- -------------------------
-- 1) Enumerations
-- -------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'trust_component') then
    create type public.trust_component as enum (
      'reliability',
      'communication',
      'safety',
      'execution',
      'professionalism',
      'admin',
      'payment',
      'load_quality',
      'site_preparedness',
      'turnaround'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'trust_event_polarity') then
    create type public.trust_event_polarity as enum ('good','bad','critical');
  end if;
end$$;

-- -------------------------
-- 2) Config Tables
-- -------------------------

create table if not exists public.trust_role_weights (
  role text not null,
  component public.trust_component not null,
  weight numeric not null check (weight >= 0 and weight <= 1),
  primary key (role, component)
);

create table if not exists public.trust_component_params (
  role text not null,
  component public.trust_component not null,
  tau_days numeric not null check (tau_days > 0),
  alpha numeric not null default 2,
  beta numeric not null default 2,
  primary key (role, component)
);

create table if not exists public.trust_event_rules (
  role text not null,
  event_type text not null,
  component public.trust_component not null,
  polarity public.trust_event_polarity not null,
  base_mult numeric not null default 1,
  critical_penalty numeric not null default 0,
  primary key (role, event_type)
);

-- -------------------------
-- 3) Fact Table
-- -------------------------
create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  entity_profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  verified boolean not null default true,
  severity numeric not null default 1,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trust_events_entity_idx on public.trust_events(entity_profile_id);
create index if not exists trust_events_occurred_idx on public.trust_events(occurred_at);
create index if not exists trust_events_role_idx on public.trust_events(role);
create index if not exists trust_events_type_idx on public.trust_events(event_type);

-- -------------------------
-- 4) Seed helpers
-- -------------------------
create or replace function public.trust_upsert_weight(p_role text, p_component public.trust_component, p_weight numeric)
returns void language plpgsql as $$
begin
  insert into public.trust_role_weights(role, component, weight)
  values (p_role, p_component, p_weight)
  on conflict (role, component) do update set weight = excluded.weight;
end$$;

create or replace function public.trust_upsert_params(p_role text, p_component public.trust_component, p_tau numeric, p_alpha numeric, p_beta numeric)
returns void language plpgsql as $$
begin
  insert into public.trust_component_params(role, component, tau_days, alpha, beta)
  values (p_role, p_component, p_tau, p_alpha, p_beta)
  on conflict (role, component) do update
    set tau_days = excluded.tau_days, alpha = excluded.alpha, beta = excluded.beta;
end$$;

create or replace function public.trust_upsert_rule(
  p_role text, p_event_type text, p_component public.trust_component, p_polarity public.trust_event_polarity,
  p_base_mult numeric, p_critical_penalty numeric
)
returns void language plpgsql as $$
begin
  insert into public.trust_event_rules(role, event_type, component, polarity, base_mult, critical_penalty)
  values (p_role, p_event_type, p_component, p_polarity, p_base_mult, p_critical_penalty)
  on conflict (role, event_type) do update
    set component = excluded.component,
        polarity = excluded.polarity,
        base_mult = excluded.base_mult,
        critical_penalty = excluded.critical_penalty;
end$$;

-- ---- Weights: Escort / Driver
select public.trust_upsert_weight('escort','reliability',0.30);
select public.trust_upsert_weight('escort','communication',0.18);
select public.trust_upsert_weight('escort','safety',0.22);
select public.trust_upsert_weight('escort','execution',0.15);
select public.trust_upsert_weight('escort','professionalism',0.10);
select public.trust_upsert_weight('escort','admin',0.05);

select public.trust_upsert_weight('driver','reliability',0.30);
select public.trust_upsert_weight('driver','communication',0.18);
select public.trust_upsert_weight('driver','safety',0.22);
select public.trust_upsert_weight('driver','execution',0.15);
select public.trust_upsert_weight('driver','professionalism',0.10);
select public.trust_upsert_weight('driver','admin',0.05);

select public.trust_upsert_params('escort','reliability',60,2,2);
select public.trust_upsert_params('escort','communication',60,2,2);
select public.trust_upsert_params('escort','safety',60,2,2);
select public.trust_upsert_params('escort','execution',60,2,2);
select public.trust_upsert_params('escort','professionalism',90,2,2);
select public.trust_upsert_params('escort','admin',120,2,2);

select public.trust_upsert_params('driver','reliability',60,2,2);
select public.trust_upsert_params('driver','communication',60,2,2);
select public.trust_upsert_params('driver','safety',60,2,2);
select public.trust_upsert_params('driver','execution',60,2,2);
select public.trust_upsert_params('driver','professionalism',90,2,2);
select public.trust_upsert_params('driver','admin',120,2,2);

-- ---- Weights: Broker
select public.trust_upsert_weight('broker','payment',0.35);
select public.trust_upsert_weight('broker','reliability',0.20);
select public.trust_upsert_weight('broker','communication',0.18);
select public.trust_upsert_weight('broker','load_quality',0.17);
select public.trust_upsert_weight('broker','professionalism',0.10);

select public.trust_upsert_params('broker','payment',90,2,2);
select public.trust_upsert_params('broker','reliability',60,2,2);
select public.trust_upsert_params('broker','communication',60,2,2);
select public.trust_upsert_params('broker','load_quality',60,2,2);
select public.trust_upsert_params('broker','professionalism',120,2,2);

-- ---- Weights: Shipper
select public.trust_upsert_weight('shipper','site_preparedness',0.25);
select public.trust_upsert_weight('shipper','turnaround',0.25);
select public.trust_upsert_weight('shipper','safety',0.20);
select public.trust_upsert_weight('shipper','communication',0.15);
select public.trust_upsert_weight('shipper','professionalism',0.15);

select public.trust_upsert_params('shipper','site_preparedness',60,2,2);
select public.trust_upsert_params('shipper','turnaround',60,2,2);
select public.trust_upsert_params('shipper','safety',90,2,2);
select public.trust_upsert_params('shipper','communication',60,2,2);
select public.trust_upsert_params('shipper','professionalism',120,2,2);

-- ---- Event Rules: Escort/Driver
select public.trust_upsert_rule('escort','completed_job','reliability','good',1.0,0);
select public.trust_upsert_rule('escort','on_time_arrival','reliability','good',1.0,0);
select public.trust_upsert_rule('escort','late_arrival','reliability','bad',1.0,0);
select public.trust_upsert_rule('escort','cancellation','reliability','bad',1.0,0);
select public.trust_upsert_rule('escort','no_show','reliability','critical',1.0,25);
select public.trust_upsert_rule('escort','check_in_on_time','communication','good',1.0,0);
select public.trust_upsert_rule('escort','quick_response','communication','good',1.0,0);
select public.trust_upsert_rule('escort','missed_check_in','communication','bad',1.0,0);
select public.trust_upsert_rule('escort','radio_nonresponsive','communication','bad',1.5,0);
select public.trust_upsert_rule('escort','proper_gear_verified','safety','good',1.0,0);
select public.trust_upsert_rule('escort','permit_compliant','safety','good',1.0,0);
select public.trust_upsert_rule('escort','missing_required_gear','safety','bad',1.2,0);
select public.trust_upsert_rule('escort','minor_safety_violation','safety','bad',1.0,0);
select public.trust_upsert_rule('escort','major_safety_violation','safety','critical',1.0,40);
select public.trust_upsert_rule('escort','abandoned_job','reliability','critical',1.0,35);

select public.trust_upsert_rule('driver','completed_job','reliability','good',1.0,0);
select public.trust_upsert_rule('driver','on_time_arrival','reliability','good',1.0,0);
select public.trust_upsert_rule('driver','late_arrival','reliability','bad',1.0,0);
select public.trust_upsert_rule('driver','cancellation','reliability','bad',1.0,0);
select public.trust_upsert_rule('driver','no_show','reliability','critical',1.0,25);
select public.trust_upsert_rule('driver','check_in_on_time','communication','good',1.0,0);
select public.trust_upsert_rule('driver','quick_response','communication','good',1.0,0);
select public.trust_upsert_rule('driver','missed_check_in','communication','bad',1.0,0);
select public.trust_upsert_rule('driver','radio_nonresponsive','communication','bad',1.5,0);
select public.trust_upsert_rule('driver','proper_gear_verified','safety','good',1.0,0);
select public.trust_upsert_rule('driver','permit_compliant','safety','good',1.0,0);
select public.trust_upsert_rule('driver','missing_required_gear','safety','bad',1.2,0);
select public.trust_upsert_rule('driver','minor_safety_violation','safety','bad',1.0,0);
select public.trust_upsert_rule('driver','major_safety_violation','safety','critical',1.0,40);
select public.trust_upsert_rule('driver','abandoned_job','reliability','critical',1.0,35);

-- ---- Event Rules: Broker
select public.trust_upsert_rule('broker','paid_on_time','payment','good',1.0,0);
select public.trust_upsert_rule('broker','quick_pay','payment','good',1.2,0);
select public.trust_upsert_rule('broker','late_payment','payment','bad',1.0,0);
select public.trust_upsert_rule('broker','dispute','payment','bad',1.2,0);
select public.trust_upsert_rule('broker','non_payment','payment','critical',1.0,50);
select public.trust_upsert_rule('broker','chargeback','payment','critical',1.0,60);
select public.trust_upsert_rule('broker','load_details_accurate','load_quality','good',1.0,0);
select public.trust_upsert_rule('broker','load_details_wrong','load_quality','bad',1.2,0);
select public.trust_upsert_rule('broker','schedule_change_last_minute','reliability','bad',1.4,0);
select public.trust_upsert_rule('broker','bait_and_switch','load_quality','critical',1.0,25);
select public.trust_upsert_rule('broker','responsive','communication','good',1.0,0);
select public.trust_upsert_rule('broker','unresponsive','communication','bad',1.2,0);

-- ---- Event Rules: Shipper
select public.trust_upsert_rule('shipper','load_ready','site_preparedness','good',1.0,0);
select public.trust_upsert_rule('shipper','paperwork_ready','site_preparedness','good',1.0,0);
select public.trust_upsert_rule('shipper','not_ready','site_preparedness','bad',1.4,0);
select public.trust_upsert_rule('shipper','detention_severe','turnaround','bad',1.5,15);
select public.trust_upsert_rule('shipper','dangerous_site_incident','safety','critical',1.0,35);
select public.trust_upsert_rule('shipper','responsive','communication','good',1.0,0);
select public.trust_upsert_rule('shipper','unresponsive','communication','bad',1.0,0);

-- -------------------------
-- 5) Math helpers
-- -------------------------
create or replace function public.trust_decay_weight(p_occurred_at timestamptz, p_asof timestamptz, p_tau_days numeric)
returns numeric language sql immutable as $$
  select exp( - (greatest(extract(epoch from (p_asof - p_occurred_at)) / 86400.0, 0)) / p_tau_days );
$$;

create or replace function public.trust_clip_0_100(p numeric)
returns numeric language sql immutable as $$
  select greatest(0, least(100, p));
$$;

-- -------------------------
-- 6) Component scores
-- -------------------------
create or replace function public.trust_component_scores(
  p_entity_profile_id uuid,
  p_asof timestamptz default now()
)
returns table (
  role text,
  component public.trust_component,
  good_sum numeric,
  bad_sum numeric,
  s_k numeric
)
language sql stable as $$
  with ent as (
    select p.id as entity_id, p.type as role
    from public.profiles p
    where p.id = p_entity_profile_id
  ),
  ev as (
    select
      e.entity_profile_id,
      e.role,
      e.event_type,
      e.occurred_at,
      e.verified,
      e.severity,
      r.component,
      r.polarity,
      r.base_mult,
      r.critical_penalty,
      cp.tau_days,
      cp.alpha,
      cp.beta,
      public.trust_decay_weight(e.occurred_at, p_asof, cp.tau_days) as d
    from public.trust_events e
    join ent on ent.entity_id = e.entity_profile_id
    join public.trust_event_rules r
      on r.role = ent.role and r.event_type = e.event_type
    join public.trust_component_params cp
      on cp.role = ent.role and cp.component = r.component
    where e.verified = true
  ),
  sums as (
    select
      (select role from ent) as role,
      component,
      sum(case when polarity = 'good' then d * (severity * base_mult) else 0 end) as good_sum,
      sum(case when polarity = 'bad' then d * (severity * base_mult) else 0 end) as bad_sum,
      max(alpha) as alpha,
      max(beta) as beta
    from ev
    where polarity in ('good','bad')
    group by component
  ),
  all_components as (
    select cp.role, cp.component, cp.alpha, cp.beta
    from public.trust_component_params cp
    join ent on ent.role = cp.role
  )
  select
    ac.role,
    ac.component,
    coalesce(s.good_sum, 0) as good_sum,
    coalesce(s.bad_sum, 0) as bad_sum,
    (coalesce(s.good_sum,0) + ac.alpha) /
    nullif( (coalesce(s.good_sum,0) + coalesce(s.bad_sum,0) + ac.alpha + ac.beta), 0 ) as s_k
  from all_components ac
  left join sums s
    on s.component = ac.component and s.role = ac.role
$$;

-- -------------------------
-- 7) Confidence
-- -------------------------
create or replace function public.trust_confidence(
  p_entity_profile_id uuid,
  p_asof timestamptz default now(),
  p_c_min numeric default 0.55,
  p_lambda numeric default 12
)
returns numeric
language sql stable as $$
  with ent as (
    select p.id as entity_id, p.type as role
    from public.profiles p
    where p.id = p_entity_profile_id
  ),
  n as (
    select
      coalesce(sum(public.trust_decay_weight(e.occurred_at, p_asof, 60)),0) as N
    from public.trust_events e
    join ent on ent.entity_id = e.entity_profile_id
    where e.verified = true
  )
  select
    greatest(0.35, least(1,
      p_c_min + (1 - p_c_min) * (1 - exp( - (select N from n) / p_lambda ))
    ));
$$;

-- -------------------------
-- 8) Critical penalty
-- -------------------------
create or replace function public.trust_critical_penalty(
  p_entity_profile_id uuid,
  p_asof timestamptz default now()
)
returns numeric
language sql stable as $$
  with ent as (
    select p.id as entity_id, p.type as role
    from public.profiles p
    where p.id = p_entity_profile_id
  ),
  ev as (
    select
      e.occurred_at,
      e.severity,
      r.critical_penalty,
      public.trust_decay_weight(e.occurred_at, p_asof, 90) as d
    from public.trust_events e
    join ent on ent.entity_id = e.entity_profile_id
    join public.trust_event_rules r
      on r.role = ent.role and r.event_type = e.event_type
    where e.verified = true
      and r.polarity = 'critical'
      and r.critical_penalty > 0
  )
  select coalesce(sum(d * (critical_penalty * greatest(e.severity,1))), 0) from ev e;
$$;

-- -------------------------
-- 9) Final Trust Score
-- -------------------------
create or replace function public.trust_score(
  p_entity_profile_id uuid,
  p_asof timestamptz default now()
)
returns numeric
language sql stable as $$
  with ent as (
    select p.id as entity_id, p.type as role
    from public.profiles p
    where p.id = p_entity_profile_id
  ),
  comp as (
    select * from public.trust_component_scores(p_entity_profile_id, p_asof)
  ),
  weighted as (
    select
      sum(w.weight * c.s_k) as weighted_sum
    from comp c
    join ent on ent.role = c.role
    join public.trust_role_weights w
      on w.role = ent.role and w.component = c.component
  ),
  c as (
    select public.trust_confidence(p_entity_profile_id, p_asof) as conf
  ),
  p as (
    select public.trust_critical_penalty(p_entity_profile_id, p_asof) as pen
  )
  select public.trust_clip_0_100( 100 * (select conf from c) * coalesce((select weighted_sum from weighted), 0) - (select pen from p) );
$$;

-- -------------------------
-- 10) Trend T = TS_now - TS_180days_ago
-- -------------------------
create or replace function public.trust_trend(
  p_entity_profile_id uuid,
  p_asof timestamptz default now()
)
returns numeric
language sql stable as $$
  with ts30 as (
    select public.trust_score(p_entity_profile_id, p_asof) as ts_now
  ),
  ts180 as (
    select public.trust_score(p_entity_profile_id, p_asof - interval '180 days') as ts_baseline
  )
  select (select ts_now from ts30) - (select ts_baseline from ts180);
$$;

-- -------------------------
-- 11) trust_profile_view
-- -------------------------
create or replace view public.trust_profile_view as
with base as (
  select
    p.id as profile_id,
    p.type as role,
    public.trust_score(p.id, now()) as trust_score,
    public.trust_trend(p.id, now()) as trust_trend,
    public.trust_confidence(p.id, now()) as confidence,
    public.trust_critical_penalty(p.id, now()) as critical_penalty
  from public.profiles p
),
packed as (
  select
    p.id as profile_id,
    jsonb_object_agg(
      c.component::text,
      jsonb_build_object(
        'good_sum', round(c.good_sum::numeric, 4),
        'bad_sum',  round(c.bad_sum::numeric, 4),
        's_k',      round(c.s_k::numeric, 6)
      )
      order by c.component::text
    ) as components_json
  from public.profiles p
  join lateral public.trust_component_scores(p.id, now()) c on true
  group by p.id
)
select
  b.profile_id,
  b.role,
  b.trust_score,
  b.trust_trend,
  b.confidence,
  b.critical_penalty,
  case
    when b.trust_score >= 90 then 'elite'
    when b.trust_score >= 80 then 'strong'
    when b.trust_score >= 70 then 'solid'
    when b.trust_score >= 60 then 'watch'
    else 'risk'
  end as trust_tier,
  case
    when b.confidence < 0.70 then 'low'
    when b.confidence < 0.85 then 'medium'
    else 'high'
  end as confidence_band,
  case
    when b.trust_trend >= 5 then 'improving'
    when b.trust_trend <= -5 then 'declining'
    else 'stable'
  end as trend_band,
  coalesce(pk.components_json, '{}'::jsonb) as components
from base b
left join packed pk on pk.profile_id = b.profile_id;

-- -------------------------
-- 12) RLS
-- -------------------------
alter table public.trust_events enable row level security;
alter table public.trust_role_weights enable row level security;
alter table public.trust_component_params enable row level security;
alter table public.trust_event_rules enable row level security;

drop policy if exists trust_role_weights_read on public.trust_role_weights;
create policy trust_role_weights_read on public.trust_role_weights for select using (true);

drop policy if exists trust_component_params_read on public.trust_component_params;
create policy trust_component_params_read on public.trust_component_params for select using (true);

drop policy if exists trust_event_rules_read on public.trust_event_rules;
create policy trust_event_rules_read on public.trust_event_rules for select using (true);

drop policy if exists trust_events_none on public.trust_events;
create policy trust_events_none on public.trust_events for select using (false);

drop policy if exists trust_events_insert_none on public.trust_events;
create policy trust_events_insert_none on public.trust_events for insert with check (false);

commit;
