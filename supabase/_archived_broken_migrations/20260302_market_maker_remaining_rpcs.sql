-- ============================================================
-- Predictive Market Maker — Remaining RPCs (Migration 2)
-- All 6 RPCs that were deployed to Supabase but not yet saved locally.
-- Source: conversation 13c03262 "Deploying Market Maker RPCs"
-- ============================================================

-- ============================================================
-- 1) mm_build_feature_buckets
--    Aggregate mm_event_log → mm_feature_store by geo×slot×time
-- ============================================================
create or replace function public.mm_build_feature_buckets(
  p_start_ts timestamptz,
  p_end_ts timestamptz,
  p_bucket_minutes int default 60
)
returns table(ok boolean, rows_written int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int := 0;
  v_bucket_interval interval;
begin
  v_bucket_interval := (p_bucket_minutes || ' minutes')::interval;

  insert into public.mm_feature_store (
    feature_key, ts_bucket, bucket_minutes,
    geo, inventory,
    demand_features, monetization_features,
    liquidity_features, risk_features, consent_features
  )
  select
    -- feature_key = canonical composite
    coalesce(country,'_') || '|' || coalesce(region,'_') || '|' || coalesce(city,'_') || '|' ||
    coalesce(corridor_id::text,'_') || '|' || coalesce(slot_type,'_') || '|' || coalesce(device,'_'),

    -- ts_bucket: truncate to bucket
    date_trunc('hour', ts) + (floor(extract(minute from ts) / p_bucket_minutes) * v_bucket_interval),
    p_bucket_minutes,

    -- geo
    jsonb_build_object('country', country, 'region', region, 'city', city, 'corridor_id', corridor_id, 'port_id', port_id),
    -- inventory
    jsonb_build_object('slot_type', slot_type, 'placement', placement, 'device', device),

    -- demand_features
    jsonb_build_object(
      'total_events', count(*),
      'page_views', count(*) filter (where event_type like 'page_view%'),
      'searches', count(*) filter (where event_type = 'search_internal'),
      'load_posts', count(*) filter (where event_type = 'load_post_create')
    ),
    -- monetization_features
    jsonb_build_object(
      'impressions', count(*) filter (where event_type = 'ad_impression_viewable'),
      'clicks', count(*) filter (where event_type = 'ad_click'),
      'conversions', count(*) filter (where event_type = 'conversion'),
      'revenue_micros', coalesce(sum(value_usd_micros) filter (where event_type in ('ad_impression_viewable','conversion')), 0)
    ),
    -- liquidity_features
    jsonb_build_object(
      'campaigns_created', count(*) filter (where event_type = 'campaign_created'),
      'campaigns_paused', count(*) filter (where event_type = 'campaign_paused'),
      'new_advertisers', count(*) filter (where event_type = 'new_advertiser_signup')
    ),
    -- risk_features
    jsonb_build_object(
      'fraud_flags', count(*) filter (where event_type = 'fraud_flag'),
      'chargebacks', count(*) filter (where event_type = 'chargeback'),
      'avg_fraud_score', avg(fraud_score)
    ),
    -- consent_features
    jsonb_build_object(
      'consent_granted', count(*) filter (where consent_state = 'granted'),
      'consent_denied', count(*) filter (where consent_state = 'denied'),
      'consent_unknown', count(*) filter (where consent_state = 'unknown')
    )

  from public.mm_event_log
  where ts >= p_start_ts and ts < p_end_ts
  group by 1, 2, 3, 4, 5
  on conflict (feature_key, ts_bucket, bucket_minutes)
  do update set
    demand_features = excluded.demand_features,
    monetization_features = excluded.monetization_features,
    liquidity_features = excluded.liquidity_features,
    risk_features = excluded.risk_features,
    consent_features = excluded.consent_features,
    created_at = now();

  get diagnostics v_rows = row_count;

  -- Audit
  insert into public.mm_audit_log (actor_type, action, entity_type, severity, details)
  values ('system', 'feature_build', 'feature_store', 'info',
          jsonb_build_object('start_ts', p_start_ts, 'end_ts', p_end_ts, 'bucket_minutes', p_bucket_minutes, 'rows_written', v_rows));

  ok := true;
  rows_written := v_rows;
  return next;
end;
$$;

comment on function public.mm_build_feature_buckets is
'Aggregate event log into feature store buckets by geo×slot×time.';


-- ============================================================
-- 2) mm_run_forecast
--    Read mm_features_latest → write mm_forecasts → log audit.
--    Uses rules_v1 heuristic model (swap for ML later).
-- ============================================================
create or replace function public.mm_run_forecast(
  p_bucket_minutes int default 60,
  p_horizons_minutes int[] default array[60, 240, 1440],
  p_model_version text default 'rules_v1'
)
returns table(ok boolean, run_id uuid, forecasts_written int, inputs_snapshot_hash text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid := gen_random_uuid();
  v_count int := 0;
  v_hash text;
begin
  -- Compute a snapshot hash from the latest features
  select md5(string_agg(id::text, ',' order by feature_key))
  into v_hash
  from public.mm_feature_store
  where bucket_minutes = p_bucket_minutes;

  v_hash := coalesce(v_hash, md5(now()::text));

  -- Generate forecasts for each feature_key × horizon
  insert into public.mm_forecasts (
    run_id, horizon_minutes, bucket_minutes,
    feature_key, geo, inventory,
    demand_forecast_index, liquidity_forecast_index,
    price_pressure_forecast, expected_ecpm_usd,
    expected_fill_rate, risk_forecast_score,
    confidence_score, model_version, inputs_snapshot_hash
  )
  select
    v_run_id,
    h.horizon,
    f.bucket_minutes,
    f.feature_key,
    f.geo,
    f.inventory,

    -- rules_v1 heuristics
    -- demand_forecast_index: normalized event count
    least(1.0, greatest(0.0,
      (f.demand_features->>'total_events')::numeric / greatest(1, 100.0)
    )),

    -- liquidity_forecast_index
    least(1.0, greatest(0.0,
      case when (f.monetization_features->>'impressions')::numeric > 0
        then (f.monetization_features->>'clicks')::numeric / (f.monetization_features->>'impressions')::numeric * 10
        else 0.3
      end
    )),

    -- price_pressure_forecast
    least(1.0, greatest(0.0,
      (f.demand_features->>'total_events')::numeric / greatest(1, 200.0)
    )),

    -- expected_ecpm_usd
    case when (f.monetization_features->>'impressions')::numeric > 0
      then ((f.monetization_features->>'revenue_micros')::numeric / (f.monetization_features->>'impressions')::numeric) / 1000.0
      else 2.50  -- default eCPM
    end,

    -- expected_fill_rate
    case when (f.demand_features->>'total_events')::numeric > 0
      then least(1.0, (f.monetization_features->>'impressions')::numeric / (f.demand_features->>'total_events')::numeric)
      else 0.5
    end,

    -- risk_forecast_score
    least(1.0, greatest(0.0,
      (f.risk_features->>'fraud_flags')::numeric / greatest(1, (f.demand_features->>'total_events')::numeric)
    )),

    -- confidence_score: higher with more data
    least(1.0, greatest(0.1,
      ln(greatest(1, (f.demand_features->>'total_events')::numeric)) / ln(1000)
    )),

    p_model_version,
    v_hash

  from (
    select distinct on (feature_key, bucket_minutes) *
    from public.mm_feature_store
    where bucket_minutes = p_bucket_minutes
    order by feature_key, bucket_minutes, ts_bucket desc
  ) f
  cross join unnest(p_horizons_minutes) as h(horizon);

  get diagnostics v_count = row_count;

  -- Audit
  insert into public.mm_audit_log (actor_type, action, entity_type, run_id, severity, details, inputs_snapshot_hash, model_version)
  values ('system', 'forecast_run', 'forecast', v_run_id, 'info',
          jsonb_build_object('bucket_minutes', p_bucket_minutes, 'horizons', p_horizons_minutes, 'forecasts_written', v_count),
          v_hash, p_model_version);

  ok := true;
  run_id := v_run_id;
  forecasts_written := v_count;
  inputs_snapshot_hash := v_hash;
  return next;
end;
$$;

comment on function public.mm_run_forecast is
'Generate forecasts from latest features using rules_v1 heuristic model. Swap model_version for ML later.';


-- ============================================================
-- 3) mm_generate_decisions
--    Read forecasts for run_id → write decisions with guardrails
-- ============================================================
create or replace function public.mm_generate_decisions(
  p_run_id uuid,
  p_decision_types text[] default array['floor_shaping','rotation_weight','pacing','density','house_mix','bid_guidance'],
  p_config_scope jsonb default null
)
returns table(ok boolean, decisions_written int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  v_kill jsonb;
  v_kill_enabled boolean;
begin
  -- Check kill switch
  select config into v_kill from public.mm_config where scope = 'global' and scope_key = 'kill_switch';
  v_kill_enabled := coalesce((v_kill->>'enabled')::boolean, false);

  -- If kill switch on, only allow bid_guidance (informational)
  if v_kill_enabled then
    p_decision_types := array['bid_guidance'];
  end if;

  insert into public.mm_actuator_decisions (
    run_id, feature_key, geo, inventory,
    decision_type, decision_payload,
    confidence_score, requires_human_opt_in,
    guardrails_passed, guardrails_payload,
    model_version, inputs_snapshot_hash
  )
  select
    p_run_id,
    f.feature_key,
    f.geo,
    f.inventory,
    dt.dtype,

    -- decision_payload: varies by type
    case dt.dtype
      when 'floor_shaping' then jsonb_build_object(
        'suggested_floor_multiplier', 1.0 + (f.price_pressure_forecast * 0.15),
        'max_raise_pct', 15, 'max_drop_pct', 10
      )
      when 'rotation_weight' then jsonb_build_object(
        'freshness_boost', case when f.expected_fill_rate < 0.5 then 1.2 else 1.0 end,
        'fatigue_decay', 0.95
      )
      when 'pacing' then jsonb_build_object(
        'spend_smoothing', true,
        'throttle_low_roi', f.risk_forecast_score > 0.5
      )
      when 'density' then jsonb_build_object(
        'max_density', case when f.expected_fill_rate > 0.85 then 4 else 3 end
      )
      when 'house_mix' then jsonb_build_object(
        'house_share_pct', case when f.expected_fill_rate < 0.5 then 30 else 10 end
      )
      when 'bid_guidance' then jsonb_build_object(
        'suggested_bid_min', f.expected_ecpm_usd * 0.8,
        'suggested_bid_max', f.expected_ecpm_usd * 1.3,
        'expected_ecpm', f.expected_ecpm_usd,
        'confidence', f.confidence_score
      )
      else '{}'::jsonb
    end,

    f.confidence_score,

    -- requires_human_opt_in: yes if confidence < 0.6 or non-guidance
    (f.confidence_score < 0.6 or dt.dtype != 'bid_guidance'),

    -- guardrails_passed
    (f.confidence_score >= 0.3 and f.risk_forecast_score < 0.75),

    -- guardrails_payload
    jsonb_build_object(
      'confidence_check', f.confidence_score >= 0.3,
      'risk_check', f.risk_forecast_score < 0.75,
      'kill_switch_active', v_kill_enabled
    ),

    f.model_version,
    f.inputs_snapshot_hash

  from public.mm_forecasts f
  cross join unnest(p_decision_types) as dt(dtype)
  where f.run_id = p_run_id;

  get diagnostics v_count = row_count;

  -- Audit
  insert into public.mm_audit_log (actor_type, action, entity_type, run_id, severity, details)
  values ('system', 'decisions_generated', 'decision', p_run_id, 'info',
          jsonb_build_object('decision_types', p_decision_types, 'decisions_written', v_count, 'kill_switch_active', v_kill_enabled));

  ok := true;
  decisions_written := v_count;
  return next;
end;
$$;

comment on function public.mm_generate_decisions is
'Generate proposed decisions from forecasts with guardrail checks. Kill switch restricts to bid_guidance only.';


-- ============================================================
-- 4) mm_list_pending_decisions
--    List pending decisions for admin UI / advertiser insights
-- ============================================================
create or replace function public.mm_list_pending_decisions(
  p_limit int default 50,
  p_decision_type text default null,
  p_country text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  select coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb)
  into v_res
  from (
    select
      id, run_id, ts_decided, feature_key, geo, inventory,
      decision_type, decision_payload,
      confidence_score, requires_human_opt_in,
      status, guardrails_passed, guardrails_payload,
      target_account_id, model_version
    from public.mm_actuator_decisions
    where status in ('proposed', 'queued')
      and guardrails_passed = true
      and (p_decision_type is null or decision_type = p_decision_type)
      and (p_country is null or geo->>'country' = p_country)
      -- Advertiser can only see their targeted decisions
      and (public.is_admin() or (target_account_id is not null and target_account_id = auth.uid()))
    order by confidence_score desc, ts_decided desc
    limit p_limit
  ) d;

  return v_res;
end;
$$;

comment on function public.mm_list_pending_decisions is
'List pending decisions. Admins see all; advertisers see only their targeted decisions.';


-- ============================================================
-- 5) mm_reject_decision
-- ============================================================
-- Drop old overload with different signature (had p_actor_id param)
DROP FUNCTION IF EXISTS public.mm_reject_decision(uuid, uuid, text) CASCADE;
create or replace function public.mm_reject_decision(
  p_decision_id uuid,
  p_reason text default null
)
returns table(ok boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dec public.mm_actuator_decisions%rowtype;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_dec from public.mm_actuator_decisions where id = p_decision_id for update;

  if not found then raise exception 'decision not found'; end if;
  if v_dec.status not in ('proposed', 'queued') then raise exception 'decision not in rejectable state'; end if;

  update public.mm_actuator_decisions
  set status = 'rejected', applied_by = auth.uid(), applied_at = now()
  where id = p_decision_id;

  insert into public.mm_audit_log (actor_type, actor_id, action, entity_type, entity_id, run_id, severity, details, inputs_snapshot_hash, model_version)
  values ('admin', auth.uid(), 'decision_rejected', 'decision', p_decision_id, v_dec.run_id, 'info',
          jsonb_build_object('decision_type', v_dec.decision_type, 'feature_key', v_dec.feature_key, 'reason', p_reason),
          v_dec.inputs_snapshot_hash, v_dec.model_version);

  ok := true;
  return next;
end;
$$;

comment on function public.mm_reject_decision is
'Reject a proposed/queued decision. Admin-only.';


-- ============================================================
-- 6) mm_rollback_decision
-- ============================================================
create or replace function public.mm_rollback_decision(
  p_decision_id uuid,
  p_reason text default null
)
returns table(ok boolean, rollback_decision_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dec public.mm_actuator_decisions%rowtype;
  v_rb_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into v_dec from public.mm_actuator_decisions where id = p_decision_id for update;

  if not found then raise exception 'decision not found'; end if;
  if v_dec.status != 'applied' then raise exception 'can only rollback applied decisions'; end if;

  -- Mark original as rolled_back
  update public.mm_actuator_decisions
  set status = 'rolled_back'
  where id = p_decision_id;

  -- Delete the config entry that was applied
  delete from public.mm_config
  where scope = 'feature_key' and scope_key = v_dec.feature_key;

  -- Create a revert decision row
  insert into public.mm_actuator_decisions (
    run_id, feature_key, geo, inventory,
    decision_type, decision_payload,
    confidence_score, requires_human_opt_in,
    status, applied_by, applied_at,
    rollback_of_decision_id,
    guardrails_passed, guardrails_payload,
    model_version, inputs_snapshot_hash
  ) values (
    v_dec.run_id, v_dec.feature_key, v_dec.geo, v_dec.inventory,
    v_dec.decision_type, jsonb_build_object('action', 'rollback', 'original_payload', v_dec.decision_payload),
    1.0, false,
    'applied', auth.uid(), now(),
    p_decision_id,
    true, jsonb_build_object('rollback', true),
    v_dec.model_version, v_dec.inputs_snapshot_hash
  )
  returning id into v_rb_id;

  -- Audit at warning severity
  insert into public.mm_audit_log (actor_type, actor_id, action, entity_type, entity_id, run_id, severity, details, inputs_snapshot_hash, model_version)
  values ('admin', auth.uid(), 'rollback', 'decision', p_decision_id, v_dec.run_id, 'warning',
          jsonb_build_object('decision_type', v_dec.decision_type, 'feature_key', v_dec.feature_key, 'reason', p_reason, 'rollback_decision_id', v_rb_id),
          v_dec.inputs_snapshot_hash, v_dec.model_version);

  ok := true;
  rollback_decision_id := v_rb_id;
  return next;
end;
$$;

comment on function public.mm_rollback_decision is
'Rollback an applied decision: reverts config, creates revert row, audits at warning severity.';
