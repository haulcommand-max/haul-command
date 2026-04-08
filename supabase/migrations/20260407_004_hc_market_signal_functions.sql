create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.rpc_emit_signal_event(
  p_event_name text,
  p_object_type text,
  p_object_id text,
  p_payload_json jsonb default '{}'::jsonb,
  p_country_code text default null,
  p_region_code text default null,
  p_city_slug text default null,
  p_corridor_id uuid default null,
  p_severity numeric default 0,
  p_confidence numeric default 0,
  p_source_system text default 'app',
  p_dedupe_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.hc_signal_events (
    event_name,
    object_type,
    object_id,
    payload_json,
    country_code,
    region_code,
    city_slug,
    corridor_id,
    severity,
    confidence,
    source_system,
    dedupe_key
  )
  values (
    p_event_name,
    p_object_type,
    p_object_id,
    coalesce(p_payload_json, '{}'::jsonb),
    p_country_code,
    p_region_code,
    p_city_slug,
    p_corridor_id,
    coalesce(p_severity, 0),
    coalesce(p_confidence, 0),
    coalesce(p_source_system, 'app'),
    p_dedupe_key
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.rpc_upsert_market_signal(
  p_signal_type text,
  p_source_event_id uuid,
  p_object_type text,
  p_object_id text,
  p_geo_scope text default 'global',
  p_country_code text default null,
  p_region_code text default null,
  p_city_slug text default null,
  p_corridor_id uuid default null,
  p_signal_score numeric default 0,
  p_urgency_score numeric default 0,
  p_seo_value_score numeric default 0,
  p_claim_value_score numeric default 0,
  p_monetization_value_score numeric default 0,
  p_liquidity_value_score numeric default 0,
  p_quality_score numeric default 0,
  p_expires_at timestamptz default null,
  p_meta_json jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signal_id uuid;
begin
  select id
  into v_signal_id
  from public.hc_market_signals
  where signal_type = p_signal_type
    and object_type = p_object_type
    and object_id = p_object_id
    and country_code is not distinct from p_country_code
    and region_code is not distinct from p_region_code
    and city_slug is not distinct from p_city_slug
    and corridor_id is not distinct from p_corridor_id
    and status not in ('archived', 'expired')
  order by updated_at desc
  limit 1;

  if v_signal_id is null then
    insert into public.hc_market_signals (
      signal_type,
      source_event_id,
      object_type,
      object_id,
      geo_scope,
      country_code,
      region_code,
      city_slug,
      corridor_id,
      signal_score,
      urgency_score,
      seo_value_score,
      claim_value_score,
      monetization_value_score,
      liquidity_value_score,
      quality_score,
      expires_at,
      meta_json
    )
    values (
      p_signal_type,
      p_source_event_id,
      p_object_type,
      p_object_id,
      coalesce(p_geo_scope, 'global'),
      p_country_code,
      p_region_code,
      p_city_slug,
      p_corridor_id,
      coalesce(p_signal_score, 0),
      coalesce(p_urgency_score, 0),
      coalesce(p_seo_value_score, 0),
      coalesce(p_claim_value_score, 0),
      coalesce(p_monetization_value_score, 0),
      coalesce(p_liquidity_value_score, 0),
      coalesce(p_quality_score, 0),
      p_expires_at,
      coalesce(p_meta_json, '{}'::jsonb)
    )
    returning id into v_signal_id;
  else
    update public.hc_market_signals
    set
      source_event_id = coalesce(p_source_event_id, source_event_id),
      geo_scope = coalesce(p_geo_scope, geo_scope),
      signal_score = coalesce(p_signal_score, signal_score),
      urgency_score = coalesce(p_urgency_score, urgency_score),
      seo_value_score = coalesce(p_seo_value_score, seo_value_score),
      claim_value_score = coalesce(p_claim_value_score, claim_value_score),
      monetization_value_score = coalesce(p_monetization_value_score, monetization_value_score),
      liquidity_value_score = coalesce(p_liquidity_value_score, liquidity_value_score),
      quality_score = coalesce(p_quality_score, quality_score),
      expires_at = coalesce(p_expires_at, expires_at),
      meta_json = coalesce(p_meta_json, '{}'::jsonb),
      status = 'queued',
      updated_at = now()
    where id = v_signal_id;
  end if;

  return v_signal_id;
end;
$$;

create or replace function public.rpc_queue_distribution_jobs(
  p_content_packet_id uuid,
  p_jobs jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job jsonb;
  v_count integer := 0;
begin
  if jsonb_typeof(p_jobs) <> 'array' then
    raise exception 'p_jobs must be a json array';
  end if;

  for v_job in select * from jsonb_array_elements(p_jobs)
  loop
    insert into public.hc_distribution_jobs (
      content_packet_id,
      channel,
      account_key,
      publish_mode,
      scheduled_for,
      priority_score,
      status
    )
    values (
      p_content_packet_id,
      coalesce(v_job->>'channel', 'unknown'),
      v_job->>'account_key',
      coalesce((v_job->>'publish_mode')::public.hc_publish_mode, 'draft_only'),
      coalesce((v_job->>'scheduled_for')::timestamptz, now()),
      coalesce((v_job->>'priority_score')::numeric, 0),
      'queued'
    );

    v_count := v_count + 1;
  end loop;

  update public.hc_content_packets
  set status = 'scheduled'
  where id = p_content_packet_id
    and status in ('approved', 'draft', 'qa_pending', 'review_required');

  return v_count;
end;
$$;

create or replace function public.rpc_enqueue_surface_refresh(
  p_surface_type text,
  p_surface_key text,
  p_source_object_type text,
  p_source_object_id text,
  p_reason text,
  p_priority_score numeric default 0,
  p_payload_json jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.hc_surface_refresh_jobs (
    surface_type,
    surface_key,
    source_object_type,
    source_object_id,
    reason,
    priority_score,
    payload_json
  )
  values (
    p_surface_type,
    p_surface_key,
    p_source_object_type,
    p_source_object_id,
    p_reason,
    coalesce(p_priority_score, 0),
    coalesce(p_payload_json, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.rpc_score_claim_pressure_targets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  insert into public.hc_claim_pressure_targets (
    profile_id,
    entity_type,
    country_code,
    region_code,
    city_slug,
    traffic_score,
    gap_score,
    competitive_risk_score,
    seo_value_score,
    missed_money_score,
    trust_gap_score,
    claim_probability_score,
    priority_score,
    recommended_cta,
    status
  )
  select
    ms.object_id as profile_id,
    ms.object_type as entity_type,
    ms.country_code,
    ms.region_code,
    ms.city_slug,
    coalesce((ms.meta_json->>'traffic_score')::numeric, 0),
    coalesce((ms.meta_json->>'gap_score')::numeric, 0),
    coalesce((ms.meta_json->>'competitive_risk_score')::numeric, 0),
    coalesce(ms.seo_value_score, 0),
    coalesce((ms.meta_json->>'missed_money_score')::numeric, 0),
    coalesce((ms.meta_json->>'trust_gap_score')::numeric, 0),
    coalesce((ms.meta_json->>'claim_probability_score')::numeric, 0),
    (
      coalesce((ms.meta_json->>'traffic_score')::numeric, 0) * 0.20 +
      coalesce((ms.meta_json->>'gap_score')::numeric, 0) * 0.20 +
      coalesce((ms.meta_json->>'competitive_risk_score')::numeric, 0) * 0.15 +
      coalesce(ms.signal_score, 0) * 0.15 +
      coalesce((ms.meta_json->>'trust_gap_score')::numeric, 0) * 0.10 +
      coalesce(ms.seo_value_score, 0) * 0.10 +
      coalesce((ms.meta_json->>'claim_probability_score')::numeric, 0) * 0.10
    ) as priority_score,
    coalesce(ms.meta_json->>'recommended_cta', 'claim_profile'),
    'open'
  from public.hc_market_signals ms
  where ms.signal_type = 'claim_pressure'
    and ms.object_type in ('profile', 'company', 'person')
    and ms.status in ('queued', 'processed')
  on conflict (profile_id)
  do update set
    entity_type = excluded.entity_type,
    country_code = excluded.country_code,
    region_code = excluded.region_code,
    city_slug = excluded.city_slug,
    traffic_score = excluded.traffic_score,
    gap_score = excluded.gap_score,
    competitive_risk_score = excluded.competitive_risk_score,
    seo_value_score = excluded.seo_value_score,
    missed_money_score = excluded.missed_money_score,
    trust_gap_score = excluded.trust_gap_score,
    claim_probability_score = excluded.claim_probability_score,
    priority_score = excluded.priority_score,
    recommended_cta = excluded.recommended_cta,
    status = 'open',
    updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
