begin;

-- ============================================================
-- UPGRADE 1: ROLE INFERENCE + AUTO-SEVERITY
-- ============================================================

alter table public.trust_events
  alter column role drop not null;

alter table public.trust_events
  alter column severity drop not null;

-- Safe JSON numeric extraction
create or replace function public.jsonb_num(p jsonb, k text, default_val numeric)
returns numeric language sql immutable as $$
  select coalesce(nullif((p->>k), '')::numeric, default_val);
$$;

-- Auto-severity from event_type + meta
create or replace function public.trust_auto_severity(p_event_type text, p_meta jsonb)
returns numeric language plpgsql immutable as $$
declare
  minutes_late numeric;
  days_late numeric;
  hours_notice numeric;
  detention_minutes numeric;
begin
  minutes_late      := public.jsonb_num(p_meta, 'minutes_late', 0);
  days_late         := public.jsonb_num(p_meta, 'days_late', 0);
  hours_notice      := public.jsonb_num(p_meta, 'hours_notice', 999);
  detention_minutes := public.jsonb_num(p_meta, 'detention_minutes', 0);

  if p_event_type = 'late_arrival' then
    if minutes_late <= 0 then return 0.2; end if;
    if minutes_late between 1 and 15 then return 0.3; end if;
    if minutes_late between 16 and 45 then return 0.8; end if;
    if minutes_late between 46 and 90 then return 1.4; end if;
    return 2.0;
  end if;

  if p_event_type = 'cancellation' then
    if hours_notice >= 24 then return 0.3; end if;
    if hours_notice >= 2  then return 1.0; end if;
    return 2.0;
  end if;

  if p_event_type = 'late_payment' then
    if days_late <= 0 then return 0.2; end if;
    if days_late between 1 and 7   then return 0.6; end if;
    if days_late between 8 and 21  then return 1.2; end if;
    if days_late between 22 and 45 then return 2.0; end if;
    return 3.0;
  end if;

  if p_event_type = 'detention_severe' then
    if detention_minutes <= 0  then return 0.5; end if;
    if detention_minutes < 60  then return 0.8; end if;
    if detention_minutes < 180 then return 1.2; end if;
    return 1.5;
  end if;

  return 1.0;
end;
$$;

-- Trigger: infer role + auto severity
create or replace function public.trust_events_fill_defaults()
returns trigger language plpgsql as $$
declare
  inferred_role text;
  computed_sev numeric;
begin
  if new.role is null or btrim(new.role) = '' then
    select p.type into inferred_role from public.profiles p where p.id = new.entity_profile_id;
    new.role := coalesce(inferred_role, 'vendor');
  end if;

  if new.severity is null or new.severity <= 0 then
    computed_sev := public.trust_auto_severity(new.event_type, new.meta);
    new.severity := greatest(coalesce(computed_sev, 1.0), 0.1);
  end if;

  return new;
end;
$$;

drop trigger if exists trust_events_fill_defaults_trg on public.trust_events;
create trigger trust_events_fill_defaults_trg
before insert or update on public.trust_events
for each row execute function public.trust_events_fill_defaults();

-- ============================================================
-- UPGRADE 2: CORRIDOR-LEVEL TRUST
-- ============================================================

create table if not exists public.corridors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  corridor_type text not null default 'highway',
  geojson jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists corridors_name_type_uniq on public.corridors (name, corridor_type);

alter table public.trust_events
  add column if not exists corridor_id uuid references public.corridors(id) on delete set null;

create index if not exists trust_events_corridor_idx on public.trust_events(corridor_id);

-- Seed corridors
insert into public.corridors(name, corridor_type) values
  ('I-75',        'highway'),
  ('I-10',        'highway'),
  ('I-95',        'highway'),
  ('Port Zone',   'port_zone'),
  ('Border Zone', 'border_zone')
on conflict (name, corridor_type) do nothing;

-- ============================================================
-- CORRIDOR-AWARE FUNCTIONS (overloaded with p_corridor_id)
-- ============================================================

-- Component scores (corridor-aware)
create or replace function public.trust_component_scores(
  p_entity_profile_id uuid,
  p_corridor_id uuid,
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
    select p.id as entity_id, p.type as role from public.profiles p where p.id = p_entity_profile_id
  ),
  ev as (
    select
      e.entity_profile_id, e.role, e.event_type, e.occurred_at, e.verified, e.severity,
      r.component, r.polarity, r.base_mult, r.critical_penalty,
      cp.tau_days, cp.alpha, cp.beta,
      public.trust_decay_weight(e.occurred_at, p_asof, cp.tau_days) as d
    from public.trust_events e
    join ent on ent.entity_id = e.entity_profile_id
    join public.trust_event_rules r on r.role = ent.role and r.event_type = e.event_type
    join public.trust_component_params cp on cp.role = ent.role and cp.component = r.component
    where e.verified = true and (p_corridor_id is null or e.corridor_id = p_corridor_id)
  ),
  sums as (
    select
      (select role from ent) as role,
      component,
      sum(case when polarity = 'good' then d * (severity * base_mult) else 0 end) as good_sum,
      sum(case when polarity = 'bad'  then d * (severity * base_mult) else 0 end) as bad_sum,
      max(alpha) as alpha, max(beta) as beta
    from ev where polarity in ('good','bad') group by component
  ),
  all_components as (
    select cp.role, cp.component, cp.alpha, cp.beta
    from public.trust_component_params cp join ent on ent.role = cp.role
  )
  select
    ac.role, ac.component,
    coalesce(s.good_sum, 0) as good_sum,
    coalesce(s.bad_sum, 0) as bad_sum,
    (coalesce(s.good_sum,0) + ac.alpha) /
      nullif((coalesce(s.good_sum,0) + coalesce(s.bad_sum,0) + ac.alpha + ac.beta), 0) as s_k
  from all_components ac
  left join sums s on s.component = ac.component and s.role = ac.role
$$;

-- Backward-compatible wrapper
create or replace function public.trust_component_scores(
  p_entity_profile_id uuid,
  p_asof timestamptz default now()
)
returns table (role text, component public.trust_component, good_sum numeric, bad_sum numeric, s_k numeric)
language sql stable as $$
  select * from public.trust_component_scores(p_entity_profile_id, null::uuid, p_asof);
$$;

-- Confidence (corridor-aware)
create or replace function public.trust_confidence(
  p_entity_profile_id uuid,
  p_corridor_id uuid,
  p_asof timestamptz default now(),
  p_c_min numeric default 0.55,
  p_lambda numeric default 12
)
returns numeric language sql stable as $$
  with ent as (
    select p.id as entity_id from public.profiles p where p.id = p_entity_profile_id
  ),
  n as (
    select coalesce(sum(public.trust_decay_weight(e.occurred_at, p_asof, 60)),0) as N
    from public.trust_events e join ent on ent.entity_id = e.entity_profile_id
    where e.verified = true and (p_corridor_id is null or e.corridor_id = p_corridor_id)
  )
  select greatest(0.35, least(1, p_c_min + (1 - p_c_min) * (1 - exp(-(select N from n) / p_lambda))));
$$;

create or replace function public.trust_confidence(
  p_entity_profile_id uuid,
  p_asof timestamptz default now(),
  p_c_min numeric default 0.55,
  p_lambda numeric default 12
)
returns numeric language sql stable as $$
  select public.trust_confidence(p_entity_profile_id, null::uuid, p_asof, p_c_min, p_lambda);
$$;

-- Critical penalty (corridor-aware)
create or replace function public.trust_critical_penalty(
  p_entity_profile_id uuid,
  p_corridor_id uuid,
  p_asof timestamptz default now()
)
returns numeric language sql stable as $$
  with ent as (
    select p.id as entity_id, p.type as role from public.profiles p where p.id = p_entity_profile_id
  ),
  ev as (
    select e.occurred_at, e.severity, r.critical_penalty,
      public.trust_decay_weight(e.occurred_at, p_asof, 90) as d
    from public.trust_events e
    join ent on ent.entity_id = e.entity_profile_id
    join public.trust_event_rules r on r.role = ent.role and r.event_type = e.event_type
    where e.verified = true and r.polarity = 'critical' and r.critical_penalty > 0
      and (p_corridor_id is null or e.corridor_id = p_corridor_id)
  )
  select coalesce(sum(d * (critical_penalty * greatest(ev.severity,1))), 0) from ev;
$$;

create or replace function public.trust_critical_penalty(
  p_entity_profile_id uuid, p_asof timestamptz default now()
)
returns numeric language sql stable as $$
  select public.trust_critical_penalty(p_entity_profile_id, null::uuid, p_asof);
$$;

-- Trust score (corridor-aware)
create or replace function public.trust_score(
  p_entity_profile_id uuid,
  p_corridor_id uuid,
  p_asof timestamptz default now()
)
returns numeric language sql stable as $$
  with ent as (
    select p.id as entity_id, p.type as role from public.profiles p where p.id = p_entity_profile_id
  ),
  comp as (select * from public.trust_component_scores(p_entity_profile_id, p_corridor_id, p_asof)),
  weighted as (
    select sum(w.weight * c.s_k) as weighted_sum
    from comp c join ent on ent.role = c.role
    join public.trust_role_weights w on w.role = ent.role and w.component = c.component
  ),
  c as (select public.trust_confidence(p_entity_profile_id, p_corridor_id, p_asof) as conf),
  p as (select public.trust_critical_penalty(p_entity_profile_id, p_corridor_id, p_asof) as pen)
  select public.trust_clip_0_100(100 * (select conf from c) * coalesce((select weighted_sum from weighted), 0) - (select pen from p));
$$;

create or replace function public.trust_score(
  p_entity_profile_id uuid, p_asof timestamptz default now()
)
returns numeric language sql stable as $$
  select public.trust_score(p_entity_profile_id, null::uuid, p_asof);
$$;

-- Trend (corridor-aware)
create or replace function public.trust_trend(
  p_entity_profile_id uuid, p_corridor_id uuid, p_asof timestamptz default now()
)
returns numeric language sql stable as $$
  select
    public.trust_score(p_entity_profile_id, p_corridor_id, p_asof) -
    public.trust_score(p_entity_profile_id, p_corridor_id, p_asof - interval '180 days');
$$;

create or replace function public.trust_trend(
  p_entity_profile_id uuid, p_asof timestamptz default now()
)
returns numeric language sql stable as $$
  select public.trust_trend(p_entity_profile_id, null::uuid, p_asof);
$$;

-- ============================================================
-- CORRIDOR VIEW
-- ============================================================
create or replace view public.trust_profile_corridor_view as
with base as (
  select
    p.id as profile_id, p.type as role,
    c.id as corridor_id, c.name as corridor_name, c.corridor_type,
    public.trust_score(p.id, c.id, now()) as trust_score,
    public.trust_trend(p.id, c.id, now()) as trust_trend,
    public.trust_confidence(p.id, c.id, now()) as confidence,
    public.trust_critical_penalty(p.id, c.id, now()) as critical_penalty
  from public.profiles p cross join public.corridors c
),
packed as (
  select p.id as profile_id, c.id as corridor_id,
    jsonb_object_agg(cs.component::text,
      jsonb_build_object('good_sum',round(cs.good_sum::numeric,4),'bad_sum',round(cs.bad_sum::numeric,4),'s_k',round(cs.s_k::numeric,6))
      order by cs.component::text
    ) as components_json
  from public.profiles p cross join public.corridors c
  join lateral public.trust_component_scores(p.id, c.id, now()) cs on true
  group by p.id, c.id
)
select
  b.profile_id, b.role, b.corridor_id, b.corridor_name, b.corridor_type,
  b.trust_score, b.trust_trend, b.confidence, b.critical_penalty,
  case when b.trust_score >= 90 then 'elite' when b.trust_score >= 80 then 'strong'
       when b.trust_score >= 70 then 'solid' when b.trust_score >= 60 then 'watch' else 'risk' end as trust_tier,
  case when b.confidence < 0.70 then 'low' when b.confidence < 0.85 then 'medium' else 'high' end as confidence_band,
  case when b.trust_trend >= 5 then 'improving' when b.trust_trend <= -5 then 'declining' else 'stable' end as trend_band,
  coalesce(pk.components_json, '{}'::jsonb) as components
from base b
left join packed pk on pk.profile_id = b.profile_id and pk.corridor_id = b.corridor_id;

-- RLS for corridors
alter table public.corridors enable row level security;
drop policy if exists corridors_read_all on public.corridors;
create policy corridors_read_all on public.corridors for select using (true);

commit;
