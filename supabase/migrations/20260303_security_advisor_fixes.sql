-- =====================================================================
-- Haul Command — Supabase Security Advisor Fixes
-- Generated: 2026-03-03
-- Fixes: lint 0010 (SECURITY DEFINER views) + lint 0013 (RLS disabled)
-- =====================================================================
begin;

-- =====================================================================
-- 1) Fix lint 0010: Convert views to SECURITY INVOKER
--    Ensures caller's privileges/RLS context is applied, not the
--    view creator's. Eliminates privilege escalation risk.
-- =====================================================================

alter view public.mm_decisions_pending              set (security_invoker = true);
alter view public.v_broker_activation_funnel        set (security_invoker = true);
alter view public.listing_review_summary            set (security_invoker = true);
alter view public.claim_kpi_summary                 set (security_invoker = true);
alter view public.v_broker_intent_heatmap           set (security_invoker = true);
alter view public.v_corridor_demand_pressure        set (security_invoker = true);
alter view public.v_broker_health_monitor           set (security_invoker = true);
alter view public.surface_intelligence_dashboard    set (security_invoker = true);
alter view public.mm_features_latest                set (security_invoker = true);
alter view public.hc_surface_nearest_corridor       set (security_invoker = true);
alter view public.compliance_dashboard              set (security_invoker = true);
alter view public.v_broker_winback_board            set (security_invoker = true);


-- =====================================================================
-- 2) Fix lint 0013: Enable RLS on public tables
--    Deny-by-default until explicit policies are added below.
-- =====================================================================

alter table public.claim_governor       enable row level security;
alter table public.surface_types        enable row level security;
alter table public.hc_corridors         enable row level security;
alter table public.hc_regions           enable row level security;
alter table public.hc_corridor_regions  enable row level security;
alter table public.hc_surface_corridor  enable row level security;


-- =====================================================================
-- 3) Policies: Catalog tables (public read for anon + authenticated)
--    These are reference/lookup tables used by the public site.
-- =====================================================================

-- surface_types -------------------------------------------------------
drop policy if exists "surface_types_select_anon" on public.surface_types;
drop policy if exists "surface_types_select_auth" on public.surface_types;

create policy "surface_types_select_anon"
  on public.surface_types for select to anon
  using (true);

create policy "surface_types_select_auth"
  on public.surface_types for select to authenticated
  using (true);

-- hc_corridors --------------------------------------------------------
drop policy if exists "hc_corridors_select_anon" on public.hc_corridors;
drop policy if exists "hc_corridors_select_auth" on public.hc_corridors;

create policy "hc_corridors_select_anon"
  on public.hc_corridors for select to anon
  using (true);

create policy "hc_corridors_select_auth"
  on public.hc_corridors for select to authenticated
  using (true);

-- hc_regions ----------------------------------------------------------
drop policy if exists "hc_regions_select_anon" on public.hc_regions;
drop policy if exists "hc_regions_select_auth" on public.hc_regions;

create policy "hc_regions_select_anon"
  on public.hc_regions for select to anon
  using (true);

create policy "hc_regions_select_auth"
  on public.hc_regions for select to authenticated
  using (true);

-- hc_corridor_regions -------------------------------------------------
drop policy if exists "hc_corridor_regions_select_anon" on public.hc_corridor_regions;
drop policy if exists "hc_corridor_regions_select_auth" on public.hc_corridor_regions;

create policy "hc_corridor_regions_select_anon"
  on public.hc_corridor_regions for select to anon
  using (true);

create policy "hc_corridor_regions_select_auth"
  on public.hc_corridor_regions for select to authenticated
  using (true);

-- hc_surface_corridor -------------------------------------------------
drop policy if exists "hc_surface_corridor_select_anon" on public.hc_surface_corridor;
drop policy if exists "hc_surface_corridor_select_auth" on public.hc_surface_corridor;

create policy "hc_surface_corridor_select_anon"
  on public.hc_surface_corridor for select to anon
  using (true);

create policy "hc_surface_corridor_select_auth"
  on public.hc_surface_corridor for select to authenticated
  using (true);


-- =====================================================================
-- 4) claim_governor: LOCKED DOWN (admin-only via service_role)
--    With RLS enabled and zero policies, anon/authenticated get
--    zero access. Only service_role bypasses RLS.
-- =====================================================================

drop policy if exists "claim_governor_select_anon"  on public.claim_governor;
drop policy if exists "claim_governor_select_auth"  on public.claim_governor;
drop policy if exists "claim_governor_write_auth"   on public.claim_governor;

-- No policies intentionally: deny-by-default for all non-service roles.


commit;


-- =====================================================================
-- VERIFICATION QUERIES (run after migration to confirm fixes)
-- =====================================================================

-- Check 1: Views should now show security_invoker in reloptions
-- select relname, reloptions
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where c.relkind = 'v' and n.nspname = 'public'
--   and c.relname in ('mm_decisions_pending','v_broker_activation_funnel',
--     'listing_review_summary','claim_kpi_summary','v_broker_intent_heatmap',
--     'v_corridor_demand_pressure','v_broker_health_monitor',
--     'surface_intelligence_dashboard','mm_features_latest',
--     'hc_surface_nearest_corridor','compliance_dashboard','v_broker_winback_board');

-- Check 2: RLS should be enabled
-- select tablename, rowsecurity from pg_tables
-- where schemaname = 'public' and tablename in (
--   'claim_governor','surface_types','hc_corridors',
--   'hc_regions','hc_corridor_regions','hc_surface_corridor');

-- Check 3: Policies should exist for catalog tables (not claim_governor)
-- select tablename, policyname, roles, cmd from pg_policies
-- where schemaname = 'public' and tablename in (
--   'surface_types','hc_corridors','hc_regions',
--   'hc_corridor_regions','hc_surface_corridor','claim_governor')
-- order by tablename, policyname;
