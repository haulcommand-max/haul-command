-- 20260220_views_v2.sql
-- V2 canonical views required by the spec.
-- v_active_escort_supply: used by match-generate (V2) for candidate pool
-- v_open_loads_enriched: used by Command Map + intelligence compute

-- ============================================================
-- A) v_active_escort_supply
-- Joins escort_presence + escort_profiles + active availability windows.
-- Filters to status in ('online','available').
-- ============================================================
CREATE OR REPLACE VIEW public.v_active_escort_supply AS
SELECT
  ep.escort_id,
  ep.last_lat                                                 AS lat,
  ep.last_lng                                                 AS lng,
  ep.status,
  ep.last_heartbeat_at,
  ep.push_token,
  ep.device_platform,
  ep.battery_pct,
  ep.network_quality,
  -- Profile fields
  epr.vehicle_type,
  epr.capabilities_json,
  epr.certifications_json,
  epr.insurance_status,
  epr.compliance_status,
  epr.trust_base,
  -- Effective radius: use window radius if active instant window, else profile default
  COALESCE(aw.radius_miles, epr.default_radius_miles, 150)  AS effective_radius_miles,
  -- Preferred states and corridors from availability window
  COALESCE(aw.preferred_states, '{}')                        AS preferred_states,
  COALESCE(aw.preferred_corridors, '{}')                     AS preferred_corridors,
  aw.min_rate                                                 AS min_rate_preference,
  aw.mode                                                     AS availability_mode,
  aw.start_at                                                 AS window_start,
  aw.end_at                                                   AS window_end
FROM public.escort_presence ep
JOIN public.escort_profiles epr USING (escort_id)
LEFT JOIN public.escort_availability_windows aw ON
  aw.escort_id = ep.escort_id
  AND aw.start_at <= now()
  AND aw.end_at >= now()
WHERE
  ep.status IN ('online','available')
  AND ep.last_heartbeat_at >= now() - interval '10 minutes';

-- ============================================================
-- B) v_open_loads_enriched
-- Open loads with computed lane/geo keys + intelligence joined.
-- Used by Command Map, match-generate, and intelligence compute.
-- ============================================================
CREATE OR REPLACE VIEW public.v_open_loads_enriched AS
SELECT
  l.id                                            AS load_id,
  l.broker_id,
  l.origin_city,
  COALESCE(l.origin_state, l.origin_admin1)       AS origin_state,
  COALESCE(l.origin_country, 'US')                AS origin_country,
  l.origin_lat,
  l.origin_lng,
  l.dest_city,
  COALESCE(l.dest_state, l.dest_admin1)           AS dest_state,
  COALESCE(l.dest_country, 'US')                  AS dest_country,
  l.dest_lat,
  l.dest_lng,
  l.rate_amount,
  l.rate_type,
  l.est_miles,
  l.urgency,
  l.load_type,
  l.pickup_earliest_at,
  l.pickup_latest_at,
  l.escort_requirements_json,
  l.dimensions_json,
  l.route_corridors,
  l.is_boosted,
  l.created_at,
  l.updated_at,
  -- Computed lane key (origin→dest→service)
  lower(COALESCE(l.origin_country,'US')) || ':' ||
  lower(COALESCE(l.origin_state, l.origin_admin1,'')) || ':' ||
  lower(COALESCE(l.origin_city,'')) || '__' ||
  lower(COALESCE(l.dest_country,'US')) || ':' ||
  lower(COALESCE(l.dest_state, l.dest_admin1,'')) || ':' ||
  lower(COALESCE(l.dest_city,'')) || '__' ||
  lower(COALESCE(l.service_required, l.load_type, 'pilot_car'))
                                                   AS lane_key,
  -- Geo key (state-level for now; corridor-level future)
  lower(COALESCE(l.origin_country,'US')) || ':' ||
  upper(COALESCE(l.origin_state, l.origin_admin1,''))
                                                   AS geo_key,
  -- Requirement complexity raw count (number of hard requirements)
  (
    CASE WHEN (l.escort_requirements_json->>'high_pole')::bool THEN 1 ELSE 0 END +
    CASE WHEN (l.escort_requirements_json->>'police_required')::bool THEN 1 ELSE 0 END +
    CASE WHEN (l.escort_requirements_json->>'lead_required')::bool THEN 1 ELSE 0 END +
    CASE WHEN (l.escort_requirements_json->>'chase_required')::bool THEN 1 ELSE 0 END +
    CASE WHEN (l.escort_requirements_json->>'permit_rider')::bool THEN 1 ELSE 0 END
  )                                                AS requirement_complexity_raw,
  -- Lead time: hours from now to pickup
  EXTRACT(EPOCH FROM (COALESCE(l.pickup_earliest_at, now() + interval '24 hours') - now())) / 3600.0
                                                   AS lead_time_hours_raw,
  -- Urgency numeric: hot=1, warm=0.65, planned=0.35, flex=0
  CASE l.urgency
    WHEN 'hot'     THEN 1.0
    WHEN 'warm'    THEN 0.65
    WHEN 'planned' THEN 0.35
    WHEN 'flex'    THEN 0.0
    ELSE 0.5
  END                                              AS urgency_numeric_raw,
  -- Intelligence (from load_intel)
  li.fill_probability_60m,
  li.fill_probability_4h,
  li.fill_probability_24h,
  li.confidence,
  li.hard_fill_risk_score_01,
  li.hard_fill_label,
  li.carvenum_value_color,
  li.carvenum_value_score_01,
  li.p_offer_60m,
  li.p_view_60m,
  li.p_accept_60m,
  li.explanation_top_factors,
  li.fill_speed_label,
  li.supply_demand_ratio,
  li.computed_at                                   AS intelligence_computed_at
FROM public.loads l
LEFT JOIN public.load_intel li ON li.load_id = l.id
WHERE l.status IN ('open','active');

-- ============================================================
-- C) v_command_map_loads (lighter version for map tile queries)
-- Only what the map needs; used with bbox filter
-- ============================================================
CREATE OR REPLACE VIEW public.v_command_map_loads AS
SELECT
  l.id              AS load_id,
  l.origin_lat,
  l.origin_lng,
  l.dest_lat,
  l.dest_lng,
  l.urgency,
  l.rate_amount,
  l.is_boosted,
  li.hard_fill_risk_score_01,
  li.hard_fill_label,
  li.carvenum_value_color,
  li.fill_probability_60m,
  li.confidence
FROM public.loads l
LEFT JOIN public.load_intel li ON li.load_id = l.id
WHERE l.status IN ('open','active')
  AND l.origin_lat IS NOT NULL
  AND l.origin_lng IS NOT NULL;

-- ============================================================
-- D) Update directory_active_loads_view to expose new columns
-- ============================================================
CREATE OR REPLACE VIEW public.directory_active_loads_view AS
SELECT
  l.id,
  l.created_at                                               AS posted_at,
  COALESCE(l.origin_state, l.origin_admin1)                 AS origin_state,
  l.origin_city,
  COALESCE(l.dest_state, l.dest_admin1)                     AS dest_state,
  l.dest_city,
  COALESCE(l.service_required, l.load_type)                 AS service_required,
  l.rate_amount,
  l.urgency,
  l.status,
  l.is_boosted,
  -- Intelligence: NO MOCKS. All from load_intel with computed_at.
  li.fill_speed_label,
  li.load_quality_grade,
  li.lane_badges,
  li.load_rank,
  li.rate_signal,
  li.fill_signal,
  -- Stage probabilities (NEW)
  li.fill_probability_60m,
  li.fill_probability_4h,
  li.fill_probability_24h,
  li.p_offer_60m,
  li.p_view_60m,
  li.p_accept_60m,
  li.confidence,
  li.p_low_60m,
  li.p_high_60m,
  li.explanation_top_factors,
  -- Hard fill
  li.hard_fill_risk_score_01,
  li.hard_fill_label,
  -- Carvenum
  li.carvenum_value_color,
  li.carvenum_value_score_01,
  -- Timestamps
  li.computed_at                                             AS intelligence_computed_at,
  -- Broker
  bm.trust_score                                            AS broker_trust_score,
  bm.avg_days_to_pay                                        AS broker_avg_days_to_pay
FROM public.loads l
LEFT JOIN public.load_intel li ON li.load_id = l.id
LEFT JOIN public.broker_metrics bm ON bm.broker_id = l.broker_id
WHERE l.status IN ('active', 'open');

-- ============================================================
-- E) Liquidity market health snapshot view (homepage counters)
-- ============================================================
CREATE OR REPLACE VIEW public.v_market_pulse AS
SELECT
  COUNT(ep.escort_id) FILTER (WHERE ep.status = 'available') AS escorts_available_now,
  COUNT(ep.escort_id) FILTER (WHERE ep.status IN ('available','online')) AS escorts_online_now,
  COUNT(l.id)                                                 AS open_loads_now,
  COUNT(l.id) FILTER (WHERE l.is_boosted = true)             AS boosted_loads_now,
  -- Median fill time (rolling 7d from liquidity_metrics_daily)
  (
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY median_time_to_fill_min)
    FROM public.liquidity_metrics_daily
    WHERE date >= CURRENT_DATE - 7 AND segment = 'market'
  )                                                           AS median_fill_time_min_7d
FROM public.escort_presence ep
CROSS JOIN (
  SELECT id FROM public.loads WHERE status IN ('open','active')
) l;
