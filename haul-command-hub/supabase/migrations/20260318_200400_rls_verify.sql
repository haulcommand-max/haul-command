-- ============================================================================
-- RLS HARDENING VERIFICATION — Run after the main hardening script
-- ============================================================================

-- 1. Check RLS is ON for all public tables
SELECT tablename, 
       CASE WHEN rowsecurity THEN '✅ ON' ELSE '❌ OFF' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY rowsecurity, tablename;

-- 2. Verify no "Allow all" or "Service Role Full Access" policies remain
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND (policyname LIKE 'Allow all%' OR policyname LIKE 'Service Role Full Access%');

-- 3. Show all remaining policies (should be only scoped read policies)
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Check function search_paths
SELECT p.proname, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'set_updated_at', 'fn_slug_redirect_target_exists',
    'rpc_compute_trust_score', 'fn_slug_redirect_no_chain',
    'tg_directory_listings_slug_guard', 'fn_sync_directory_to_search',
    'slugify', 'rpc_batch_compute_trust_scores'
  );

-- 5. Check MV grants (should return no rows)
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name LIKE 'mv_hc_%'
  AND grantee IN ('anon', 'authenticated');
