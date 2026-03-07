-- =====================================================================
-- Haul Command — Supabase Security Advisor Fixes (Part 2)
-- Generated: 2026-03-03 14:16 EST
-- Fixes: lint 0011, 0014, 0016, 0024, 0008
-- Status: APPLIED LIVE
-- =====================================================================

-- =====================================================================
-- 0100: Pin search_path for all flagged functions (lint 0011)
-- =====================================================================
do $$
declare
  fn_names text[] := array[
    'set_updated_at','claim_audit_block_mutations','retry_failed_sends',
    'current_actor_id','hc_update_driver_geo','purchase_ppl_lead',
    'create_ppl_lead','verify_claim_otp','hc_refresh_place_nearest_corridor_mv',
    'is_admin','hc_outbox_mark_processed_bulk','set_compliance_defaults',
    'wallet_debit','hc_search_operators','activate_brand_defense',
    'hc_build_profile_search_text','is_opted_out','compute_dedupe_hash',
    'dequeue_outreach_events','normalize_text','hc_clamp01',
    'compute_claim_priority_score_batch','reject_claim','lock_surface_for_claims',
    'hc_decay','submit_claim_evidence','slugify','submit_opt_out_request',
    'send_claim_otp','compute_contactability_score','compute_surface_demand_score',
    'resolve_claim_dispute','initiate_claim','register_push_token',
    'reset_outreach_attempts_30d','sync_surfaces_to_directory','ensure_wallet',
    'fn_set_gdpr_applicability','build_claim_outreach_queue','record_opt_out',
    'list_review_queue','search_directory','sync_all_to_directory',
    'mm_block_mutations','expire_stale_otps','approve_claim',
    'mark_outreach_sent','compute_claim_kpis_by_country','wallet_credit',
    'fn_compute_corridor_health','hc_update_profile_search','hc_touch_updated_at',
    'process_opt_out_request','compute_claim_kpis_by_surface_type',
    'hc_search_loads','hc_apply_place_nearest_corridor_mapping',
    'open_claim_dispute','get_directory_stats','compute_claim_priority_score',
    'apply_outreach_delivery_update','get_directory_sync_status','set_claimable_status'
  ];
  r record;
  alter_stmt text;
begin
  for r in
    select n.nspname as schema_name, p.proname as func_name,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(fn_names)
  loop
    alter_stmt := format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public, extensions;',
      r.schema_name, r.func_name, r.args
    );
    execute alter_stmt;
  end loop;
end $$;


-- =====================================================================
-- 0101: Move extensions out of public (lint 0014)
-- Note: pg_net does NOT support SET SCHEMA (Supabase system extension)
-- =====================================================================
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
alter extension unaccent set schema extensions;
alter extension btree_gin set schema extensions;
alter extension citext set schema extensions;
-- alter extension pg_net set schema extensions; -- NOT SUPPORTED


-- =====================================================================
-- 0102: Lock down materialized views (lint 0016)
-- =====================================================================
revoke all on public.directory_popular_searches from anon, authenticated;
revoke all on public.hc_place_nearest_corridor_mv from anon, authenticated;
revoke all on public.mv_heatmap_tiles from anon, authenticated;
revoke all on public.liquidity_cells_snapshot from anon, authenticated;

grant select on public.directory_popular_searches to service_role;
grant select on public.hc_place_nearest_corridor_mv to service_role;
grant select on public.mv_heatmap_tiles to service_role;
grant select on public.liquidity_cells_snapshot to service_role;


-- =====================================================================
-- 0103: Fix permissive INSERT policies (lint 0024)
-- Replace WITH CHECK (true) with constrained ingest rules
-- =====================================================================
drop policy if exists "adgrid_events_anon_insert" on public.adgrid_events;
create policy "adgrid_events_constrained_insert"
  on public.adgrid_events for insert to anon, authenticated
  with check (
    event_type is not null and length(event_type) <= 64
    and slot_id is not null and length(slot_id) <= 128
    and (meta is null or length(meta::text) <= 4000)
  );

drop policy if exists "behavioral_events_insert" on public.behavioral_events;
create policy "behavioral_events_constrained_insert"
  on public.behavioral_events for insert to anon, authenticated
  with check (
    event_type is not null and length(event_type) <= 64
    and (metadata is null or length(metadata::text) <= 8000)
    and (geo_fingerprint is null or length(geo_fingerprint::text) <= 2000)
  );

drop policy if exists "hc_be_anon_insert" on public.hc_behavioral_events;
create policy "hc_be_constrained_insert"
  on public.hc_behavioral_events for insert to anon, authenticated
  with check (
    event_type is not null and length(event_type) <= 64
    and (meta is null or length(meta::text) <= 4000)
  );

drop policy if exists "hc_events_insert_anon" on public.hc_events;
create policy "hc_events_constrained_insert"
  on public.hc_events for insert to anon, authenticated
  with check (
    event_type is not null and length(event_type) <= 64
    and (properties is null or length(properties::text) <= 8000)
  );

drop policy if exists "sponsor_metrics_insert_public" on public.sponsor_metrics;
create policy "sponsor_metrics_constrained_insert"
  on public.sponsor_metrics for insert to anon, authenticated
  with check (
    event_type is not null and length(event_type) <= 64
    and (region_code is null or length(region_code) <= 10)
  );


-- =====================================================================
-- 0200: Explicit deny policies for server-only tables (lint 0008)
-- =====================================================================
do $$
declare
  t text;
  tables text[] := array[
    'activity_events','ad_products','amm_directives','audit_source_snapshots',
    'broker_intel_dirty','claim_governor','corridor_surge_scores',
    'coverage_guarantee_predictions','cross_border_friction_scores',
    'data_quality_events','deadhead_cost_estimates','directory_search_logs',
    'domination_alerts','escort_blocklists','escort_shortage_map',
    'evidence_artifacts','fcc_coverage_snapshots','featured_placements',
    'gate_event_log','hc_loads','hc_vendors','heatmap_snapshots',
    'ingestion_jobs','lane_intel_dirty','liquidity_metrics_daily',
    'liquidity_shock_events','liquidity_snapshots','load_complexity_scores',
    'load_intel_queue','load_urgency_scores','load_visibility_zones',
    'market_pressure_snapshots','metro_breakthrough_targets',
    'monetization_events','multi_escort_optimizations','operator_mastery',
    'permit_validation_results','port_operator_proximity','pretrip_handshakes',
    'rate_benchmarks','rate_outcomes_rollup','repositioning_signals',
    'scorecards_broker','scorecards_escort','system_metrics',
    'terminal_operator_experience','terminal_risk_profile','trust_edges'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I;', t || '_deny_anon_auth', t);
    execute format($sql$
      create policy %I on public.%I for all to anon, authenticated
      using (false) with check (false);
    $sql$, t || '_deny_anon_auth', t);
  end loop;
end $$;
