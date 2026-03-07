-- ============================================================
-- Predictive Market Maker (AI Bid Shaping) — Migration Blueprint v1
-- Includes: tables, indexes, RLS policies, helper functions
-- Target: Supabase Postgres
-- Notes:
--  - Uses gen_random_uuid() (pgcrypto) and now() (timestamptz).
--  - Keeps mm_event_log and mm_audit_log append-only (enforced via trigger).
--  - RLS:
--      * public ingestion via a SECURITY DEFINER RPC (recommended)
--      * advertisers can read only their own decisions/insights
--      * admins can read/write everything via role check function
-- ============================================================

begin;

-- ----------------------------
-- Extensions
-- ----------------------------
create extension if not exists pgcrypto;

-- ----------------------------
-- Helper: admin role check
-- ----------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.role, '') in ('admin','owner','superadmin')
  );
$$;

comment on function public.is_admin() is
'Returns true if current auth.uid() is an admin. Adjust role source as needed.';

-- ----------------------------
-- Helper: actor id
-- ----------------------------
create or replace function public.current_actor_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- ============================================================
-- 1) TABLE: mm_event_log (immutable-ish event stream)
-- ============================================================
create table if not exists public.mm_event_log (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),

  country text not null,
  region text,
  city text,
  corridor_id uuid,
  port_id uuid,

  slot_type text,
  placement text,
  device text,

  session_id text,
  viewer_hash text,

  account_id uuid,
  campaign_id uuid,
  creative_id uuid,

  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,

  consent_state text not null default 'unknown',
  fraud_score numeric,
  value_usd_micros bigint
);

create index if not exists mm_event_log_ts_idx on public.mm_event_log using btree (ts);
create index if not exists mm_event_log_event_type_ts_idx on public.mm_event_log using btree (event_type, ts);
create index if not exists mm_event_log_country_ts_idx on public.mm_event_log using btree (country, ts);
create index if not exists mm_event_log_campaign_ts_idx on public.mm_event_log using btree (campaign_id, ts);
create index if not exists mm_event_log_slot_ts_idx on public.mm_event_log using btree (slot_type, ts);

comment on table public.mm_event_log is 'Market maker event stream for forecasting + decisions.';
comment on column public.mm_event_log.viewer_hash is 'Hashed IP/UA or viewer key; avoid raw PII.';
comment on column public.mm_event_log.value_usd_micros is 'Optional monetary value in USD micros for cost/revenue events.';

-- ============================================================
-- 2) TABLE: mm_feature_store (aggregated rolling features)
-- ============================================================
create table if not exists public.mm_feature_store (
  id uuid primary key default gen_random_uuid(),

  feature_key text not null,
  ts_bucket timestamptz not null,
  bucket_minutes int not null,

  geo jsonb not null,
  inventory jsonb not null,

  demand_features jsonb not null,
  monetization_features jsonb not null,
  liquidity_features jsonb not null,
  risk_features jsonb not null,
  consent_features jsonb not null,

  created_at timestamptz not null default now()
);

create unique index if not exists mm_feature_store_uniq_idx
  on public.mm_feature_store (feature_key, ts_bucket, bucket_minutes);

create index if not exists mm_feature_store_ts_bucket_idx
  on public.mm_feature_store using btree (ts_bucket);

create index if not exists mm_feature_store_feature_key_ts_bucket_idx
  on public.mm_feature_store using btree (feature_key, ts_bucket);

comment on table public.mm_feature_store is 'Aggregated features per geo/inventory bucket for forecasting.';

-- ============================================================
-- 3) TABLE: mm_forecasts (model outputs)
-- ============================================================
create table if not exists public.mm_forecasts (
  id uuid primary key default gen_random_uuid(),

  run_id uuid not null,
  ts_generated timestamptz not null default now(),

  horizon_minutes int not null,
  bucket_minutes int not null,

  feature_key text not null,
  geo jsonb not null,
  inventory jsonb not null,

  demand_forecast_index numeric not null,
  liquidity_forecast_index numeric not null,
  price_pressure_forecast numeric not null,
  expected_ecpm_usd numeric not null,
  expected_fill_rate numeric not null,
  risk_forecast_score numeric not null,
  confidence_score numeric not null,

  model_version text not null,
  inputs_snapshot_hash text not null
);

create index if not exists mm_forecasts_run_id_idx on public.mm_forecasts using btree (run_id);
create index if not exists mm_forecasts_ts_generated_idx on public.mm_forecasts using btree (ts_generated);
create index if not exists mm_forecasts_feature_key_horizon_idx
  on public.mm_forecasts using btree (feature_key, horizon_minutes);

comment on table public.mm_forecasts is 'Forecast outputs from market maker forecasting core.';

-- ============================================================
-- 4) TABLE: mm_actuator_decisions (proposed/applied decisions)
-- ============================================================
create table if not exists public.mm_actuator_decisions (
  id uuid primary key default gen_random_uuid(),

  run_id uuid not null,
  ts_decided timestamptz not null default now(),

  feature_key text not null,
  geo jsonb not null,
  inventory jsonb not null,

  decision_type text not null, -- floor_shaping|rotation_weight|pacing|density|house_mix|bid_guidance
  decision_payload jsonb not null,

  confidence_score numeric not null,

  requires_human_opt_in boolean not null default true,
  status text not null default 'proposed', -- proposed|queued|applied|rejected|rolled_back

  applied_by uuid,
  applied_at timestamptz,

  rollback_of_decision_id uuid references public.mm_actuator_decisions(id) on delete set null,

  guardrails_passed boolean not null default false,
  guardrails_payload jsonb not null default '{}'::jsonb,

  model_version text not null,
  inputs_snapshot_hash text not null,

  -- Advertiser visibility control:
  target_account_id uuid
);

create index if not exists mm_actuator_decisions_run_id_idx on public.mm_actuator_decisions using btree (run_id);
create index if not exists mm_actuator_decisions_status_ts_idx on public.mm_actuator_decisions using btree (status, ts_decided);
create index if not exists mm_actuator_decisions_type_ts_idx on public.mm_actuator_decisions using btree (decision_type, ts_decided);
create index if not exists mm_actuator_decisions_feature_key_ts_idx on public.mm_actuator_decisions using btree (feature_key, ts_decided);
create index if not exists mm_actuator_decisions_target_account_idx on public.mm_actuator_decisions using btree (target_account_id, status);

comment on table public.mm_actuator_decisions is 'Decisions generated by market maker. Status lifecycle: proposed->(queued)->applied / rejected / rolled_back.';
comment on column public.mm_actuator_decisions.target_account_id is 'If set, decision is an advertiser recommendation visible only to that advertiser.';

-- ============================================================
-- 5) TABLE: mm_audit_log (append-only)
-- ============================================================
create table if not exists public.mm_audit_log (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null default now(),

  actor_type text not null, -- system|admin|advertiser
  actor_id uuid,

  action text not null, -- forecast_run|decision_proposed|decision_applied|decision_rejected|rollback|kill_switch
  entity_type text not null, -- forecast|decision|config
  entity_id uuid,

  run_id uuid,

  severity text not null default 'info', -- info|warning|critical
  details jsonb not null default '{}'::jsonb,

  inputs_snapshot_hash text,
  model_version text
);

create index if not exists mm_audit_log_ts_idx on public.mm_audit_log using btree (ts);
create index if not exists mm_audit_log_action_ts_idx on public.mm_audit_log using btree (action, ts);
create index if not exists mm_audit_log_run_id_ts_idx on public.mm_audit_log using btree (run_id, ts);

comment on table public.mm_audit_log is 'Append-only audit log for forecasting + decisions + rollbacks + kill switch.';

-- ============================================================
-- 6) TABLE: mm_config (runtime knobs)
-- ============================================================
create table if not exists public.mm_config (
  id uuid primary key default gen_random_uuid(),
  scope text not null,      -- global|country|slot_type|feature_key
  scope_key text not null,  -- 'global'|'US'|'city_hero'|feature_key
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create unique index if not exists mm_config_uniq_idx on public.mm_config (scope, scope_key);

comment on table public.mm_config is 'Runtime config for market maker: toggles, thresholds, limits, kill switch.';

-- ============================================================
-- VIEWS
-- ============================================================
create or replace view public.mm_features_latest as
select distinct on (feature_key, bucket_minutes)
  *
from public.mm_feature_store
order by feature_key, bucket_minutes, ts_bucket desc;

create or replace view public.mm_decisions_pending as
select *
from public.mm_actuator_decisions
where status = 'proposed' and guardrails_passed = true;

comment on view public.mm_features_latest is 'Latest feature bucket per feature_key + bucket size.';
comment on view public.mm_decisions_pending is 'Pending decisions that passed guardrails and await apply/opt-in.';

-- ============================================================
-- APPEND-ONLY ENFORCEMENT
-- ============================================================
create or replace function public.mm_block_mutations()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Mutation not allowed on append-only table %', tg_table_name;
end;
$$;

drop trigger if exists mm_event_log_block_updates on public.mm_event_log;
create trigger mm_event_log_block_updates
before update or delete on public.mm_event_log
for each row execute function public.mm_block_mutations();

drop trigger if exists mm_audit_log_block_updates on public.mm_audit_log;
create trigger mm_audit_log_block_updates
before update or delete on public.mm_audit_log
for each row execute function public.mm_block_mutations();

-- ============================================================
-- RLS ENABLE
-- ============================================================
alter table public.mm_event_log enable row level security;
alter table public.mm_feature_store enable row level security;
alter table public.mm_forecasts enable row level security;
alter table public.mm_actuator_decisions enable row level security;
alter table public.mm_audit_log enable row level security;
alter table public.mm_config enable row level security;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- mm_event_log: admin read only
drop policy if exists mm_event_log_admin_select on public.mm_event_log;
create policy mm_event_log_admin_select
on public.mm_event_log for select to authenticated
using (public.is_admin());

-- mm_feature_store: admin only
drop policy if exists mm_feature_store_admin_select on public.mm_feature_store;
create policy mm_feature_store_admin_select
on public.mm_feature_store for select to authenticated
using (public.is_admin());

drop policy if exists mm_feature_store_admin_write on public.mm_feature_store;
create policy mm_feature_store_admin_write
on public.mm_feature_store for insert to authenticated
with check (public.is_admin());

-- mm_forecasts: admin only
drop policy if exists mm_forecasts_admin_select on public.mm_forecasts;
create policy mm_forecasts_admin_select
on public.mm_forecasts for select to authenticated
using (public.is_admin());

drop policy if exists mm_forecasts_admin_write on public.mm_forecasts;
create policy mm_forecasts_admin_write
on public.mm_forecasts for insert to authenticated
with check (public.is_admin());

-- mm_actuator_decisions: admin full + advertiser targeted read
drop policy if exists mm_decisions_admin_select on public.mm_actuator_decisions;
create policy mm_decisions_admin_select
on public.mm_actuator_decisions for select to authenticated
using (public.is_admin());

drop policy if exists mm_decisions_admin_write on public.mm_actuator_decisions;
create policy mm_decisions_admin_write
on public.mm_actuator_decisions for insert to authenticated
with check (public.is_admin());

drop policy if exists mm_decisions_admin_update on public.mm_actuator_decisions;
create policy mm_decisions_admin_update
on public.mm_actuator_decisions for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists mm_decisions_advertiser_select_targeted on public.mm_actuator_decisions;
create policy mm_decisions_advertiser_select_targeted
on public.mm_actuator_decisions for select to authenticated
using (target_account_id is not null and target_account_id = auth.uid());

-- mm_audit_log: admin only
drop policy if exists mm_audit_log_admin_select on public.mm_audit_log;
create policy mm_audit_log_admin_select
on public.mm_audit_log for select to authenticated
using (public.is_admin());

drop policy if exists mm_audit_log_admin_insert on public.mm_audit_log;
create policy mm_audit_log_admin_insert
on public.mm_audit_log for insert to authenticated
with check (public.is_admin());

-- mm_config: admin read/write
drop policy if exists mm_config_admin_select on public.mm_config;
create policy mm_config_admin_select
on public.mm_config for select to authenticated
using (public.is_admin());

drop policy if exists mm_config_admin_write on public.mm_config;
create policy mm_config_admin_write
on public.mm_config for insert to authenticated
with check (public.is_admin());

drop policy if exists mm_config_admin_update on public.mm_config;
create policy mm_config_admin_update
on public.mm_config for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- SECURITY DEFINER RPCs
-- ============================================================

-- 1) Ingest event
create or replace function public.mm_ingest_event(
  p_ts timestamptz default null,
  p_country text,
  p_region text default null,
  p_city text default null,
  p_corridor_id uuid default null,
  p_port_id uuid default null,
  p_slot_type text default null,
  p_placement text default null,
  p_device text default null,
  p_session_id text default null,
  p_viewer_hash text default null,
  p_account_id uuid default null,
  p_campaign_id uuid default null,
  p_creative_id uuid default null,
  p_event_type text,
  p_event_payload jsonb default '{}'::jsonb,
  p_consent_state text default 'unknown',
  p_fraud_score numeric default null,
  p_value_usd_micros bigint default null
)
returns table(ok boolean, event_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  insert into public.mm_event_log(
    ts, country, region, city, corridor_id, port_id,
    slot_type, placement, device,
    session_id, viewer_hash, account_id, campaign_id, creative_id,
    event_type, event_payload, consent_state, fraud_score, value_usd_micros
  ) values (
    coalesce(p_ts, now()), p_country, p_region, p_city, p_corridor_id, p_port_id,
    p_slot_type, p_placement, p_device,
    p_session_id, p_viewer_hash, p_account_id, p_campaign_id, p_creative_id,
    p_event_type, coalesce(p_event_payload,'{}'::jsonb), coalesce(p_consent_state,'unknown'),
    p_fraud_score, p_value_usd_micros
  )
  returning id into v_event_id;

  ok := true;
  event_id := v_event_id;
  return next;
end;
$$;

comment on function public.mm_ingest_event is
'SECURITY DEFINER ingest into mm_event_log. Use this instead of direct inserts.';

-- 2) Apply decision
create or replace function public.mm_apply_decision(
  p_decision_id uuid,
  p_actor_type text default 'admin',
  p_mode text default 'apply'  -- apply|queue
)
returns table(ok boolean, applied_config jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dec public.mm_actuator_decisions%rowtype;
  v_cfg jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_dec
  from public.mm_actuator_decisions
  where id = p_decision_id
  for update;

  if not found then
    raise exception 'decision not found';
  end if;

  if v_dec.status not in ('proposed','queued') then
    raise exception 'decision not in applicable state';
  end if;

  if p_mode = 'queue' then
    update public.mm_actuator_decisions
      set status = 'queued', applied_by = auth.uid(), applied_at = now()
    where id = p_decision_id;

    insert into public.mm_audit_log(actor_type, actor_id, action, entity_type, entity_id, run_id, severity, details, inputs_snapshot_hash, model_version)
    values (p_actor_type, auth.uid(), 'decision_queued', 'decision', p_decision_id, v_dec.run_id, 'info',
            jsonb_build_object('decision_type', v_dec.decision_type, 'feature_key', v_dec.feature_key),
            v_dec.inputs_snapshot_hash, v_dec.model_version);

    ok := true;
    applied_config := '{}'::jsonb;
    return next;
  end if;

  v_cfg := v_dec.decision_payload;

  insert into public.mm_config(scope, scope_key, config, updated_by)
  values ('feature_key', v_dec.feature_key, v_cfg, auth.uid())
  on conflict (scope, scope_key)
  do update set config = excluded.config, updated_at = now(), updated_by = auth.uid();

  update public.mm_actuator_decisions
    set status = 'applied', applied_by = auth.uid(), applied_at = now()
  where id = p_decision_id;

  insert into public.mm_audit_log(actor_type, actor_id, action, entity_type, entity_id, run_id, severity, details, inputs_snapshot_hash, model_version)
  values (p_actor_type, auth.uid(), 'decision_applied', 'decision', p_decision_id, v_dec.run_id, 'info',
          jsonb_build_object('decision_type', v_dec.decision_type, 'feature_key', v_dec.feature_key, 'applied_scope', 'feature_key'),
          v_dec.inputs_snapshot_hash, v_dec.model_version);

  ok := true;
  applied_config := v_cfg;
  return next;
end;
$$;

comment on function public.mm_apply_decision is
'SECURITY DEFINER apply decision -> mm_config + audit. Admin-only enforced inside function.';

-- 3) Kill switch
create or replace function public.mm_kill_switch(
  p_enabled boolean,
  p_reason text default null
)
returns table(ok boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  insert into public.mm_config(scope, scope_key, config, updated_by)
  values ('global', 'kill_switch', jsonb_build_object('enabled', p_enabled, 'reason', p_reason, 'ts', now()), auth.uid())
  on conflict (scope, scope_key)
  do update set config = excluded.config, updated_at = now(), updated_by = auth.uid();

  insert into public.mm_audit_log(actor_type, actor_id, action, entity_type, entity_id, run_id, severity, details)
  values ('admin', auth.uid(), 'kill_switch', 'config', null, null,
          case when p_enabled then 'warning' else 'info' end,
          jsonb_build_object('enabled', p_enabled, 'reason', p_reason));

  ok := true;
  return next;
end;
$$;

comment on function public.mm_kill_switch is
'Admin kill switch for all actuators; leaves forecasting and guidance active.';

commit;
