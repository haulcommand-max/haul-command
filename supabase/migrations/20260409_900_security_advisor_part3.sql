-- =====================================================================
-- Haul Command — Supabase Security Advisor Fixes (Part 3)
-- Generated: 2026-04-09
-- Fixes: Remaining lint 0010 (SECURITY DEFINER views),
--        lint 0011 (mutable search_path functions),
--        lint 0013 (RLS disabled tables)
-- =====================================================================
begin;

-- =====================================================================
-- 1) Fix lint 0010: Convert remaining SECURITY DEFINER views
--    to SECURITY INVOKER — caller's RLS context applies.
-- =====================================================================
do $$
declare
  v_names text[] := array[
    'listings',
    'directory_active_loads_public',
    'v_hot_corridor_loads',
    'v_leaderboard_latest',
    'v_directory_public',
    'v_operator_search',
    'v_load_board_public',
    'v_corridor_health',
    'v_training_catalog',
    'v_glossary_terms_public',
    'v_available_now_feed',
    'v_market_pulse',
    'v_trust_report_cards_public',
    'v_adgrid_inventory',
    'v_rate_benchmarks_public',
    'v_compliance_dashboard',
    'v_report_card_summary'
  ];
  v text;
begin
  foreach v in array v_names loop
    begin
      execute format('alter view public.%I set (security_invoker = true);', v);
      raise notice 'Fixed view: %', v;
    exception when undefined_table then
      raise notice 'View % does not exist, skipping', v;
    end;
  end loop;
end $$;


-- =====================================================================
-- 2) Fix lint 0011: Pin search_path on remaining flagged functions
--    Prevents search_path injection attacks.
-- =====================================================================
do $$
declare
  fn_names text[] := array[
    'process_fx_escrow',
    'hc_compute_trust_score',
    'hc_record_impression',
    'hc_match_loads_to_operators',
    'hc_generate_daily_leaderboard',
    'hc_process_claim_queue',
    'hc_corridor_demand_score',
    'hc_update_training_progress',
    'hc_glossary_hub_payload',
    'hc_generate_sitemap_urls',
    'hc_compute_operator_rank',
    'hc_process_notification_queue',
    'hc_sync_availability_broadcast',
    'hc_adgrid_decision_engine',
    'hc_rate_index_refresh',
    'hc_data_purchase_authorize',
    'hc_trust_decay_sweep',
    'hc_claim_evidence_verify',
    'hc_corridor_pricing_oracle',
    'hc_operator_profile_completeness',
    'hc_social_gravity_score',
    'hc_refresh_market_pulse',
    'hc_load_urgency_classifier',
    'hc_escort_auto_match',
    'hc_geo_fence_check',
    'hc_presence_heartbeat',
    'hc_push_notification_send',
    'hc_email_template_render',
    'hc_audit_event_log',
    'hc_billing_usage_meter'
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
    raise notice 'Pinned search_path: %.%(%)', r.schema_name, r.func_name, r.args;
  end loop;
end $$;


-- =====================================================================
-- 3) Fix lint 0013: Enable RLS on remaining unprotected tables
-- =====================================================================
do $$
declare
  t text;
  tables_to_lock text[] := array[
    'hc_content_generation_queue',
    'hc_blog_articles',
    'hc_country_waitlist',
    'hc_operator_locations',
    'hc_availability_broadcasts',
    'hc_presence_heartbeats',
    'hc_push_subscriptions',
    'hc_notification_queue',
    'hc_training_enrollment',
    'hc_training_progress',
    'hc_training_certificates',
    'hc_form_templates',
    'hc_form_submissions',
    'hc_data_purchases',
    'hc_sponsored_placements',
    'hc_claim_attempts',
    'hc_route_requests',
    'hc_rate_quotes',
    'hc_escrow_transactions',
    'hc_billing_events'
  ];
begin
  foreach t in array tables_to_lock loop
    begin
      execute format('alter table public.%I enable row level security;', t);
      raise notice 'RLS enabled: %', t;
    exception when undefined_table then
      raise notice 'Table % does not exist, skipping', t;
    end;
  end loop;
end $$;


-- =====================================================================
-- 4) Add baseline policies for content tables (public read)
-- =====================================================================

-- hc_blog_articles: public read, authenticated insert/update for authors
do $$
begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='hc_blog_articles') then
    execute $sql$
      drop policy if exists "blog_select_public" on public.hc_blog_articles;
      create policy "blog_select_public"
        on public.hc_blog_articles for select to anon, authenticated
        using (status = 'published' or status is null);
    $sql$;
  end if;
end $$;

-- hc_country_waitlist: public insert for signups, service_role for read
do $$
begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='hc_country_waitlist') then
    execute $sql$
      drop policy if exists "waitlist_insert_public" on public.hc_country_waitlist;
      create policy "waitlist_insert_public"
        on public.hc_country_waitlist for insert to anon, authenticated
        with check (
          email is not null and length(email) <= 320
          and country_code is not null and length(country_code) <= 3
        );
    $sql$;
  end if;
end $$;

-- hc_availability_broadcasts: authenticated insert for own data
do $$
begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='hc_availability_broadcasts') then
    execute $sql$
      drop policy if exists "avail_broadcast_insert_own" on public.hc_availability_broadcasts;
      create policy "avail_broadcast_insert_own"
        on public.hc_availability_broadcasts for insert to authenticated
        with check (auth.uid() = operator_id);

      drop policy if exists "avail_broadcast_select_public" on public.hc_availability_broadcasts;
      create policy "avail_broadcast_select_public"
        on public.hc_availability_broadcasts for select to anon, authenticated
        using (true);
    $sql$;
  end if;
end $$;


commit;

-- =====================================================================
-- VERIFICATION QUERIES (run post-migration)
-- =====================================================================
-- Check views are now SECURITY INVOKER:
-- select relname, reloptions from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where c.relkind = 'v' and n.nspname = 'public'
-- and relname in ('listings','v_hot_corridor_loads','v_leaderboard_latest');

-- Check functions have pinned search_path:
-- select proname, proconfig from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and proname like 'hc_%'
-- and proconfig @> array['search_path=pg_catalog, public, extensions'];

-- Check RLS is enabled:
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' and tablename like 'hc_%';
