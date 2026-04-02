-- ══════════════════════════════════════════════════════════════
-- HAUL COMMAND — PRODUCTION SCHEMA VERIFICATION SCRIPT
-- HC-FIX-009
-- 
-- Run this against production Supabase to confirm all critical
-- tables and columns exist. The application code depends on these.
--
-- Usage: Copy into Supabase SQL Editor → Run → Check output
-- Expected result: All rows show ✅ status
-- ══════════════════════════════════════════════════════════════

-- Helper function (temp, dropped at end)
CREATE OR REPLACE FUNCTION _hc_verify_column(p_table text, p_column text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table 
    AND column_name = p_column
  ) THEN
    RETURN '✅ EXISTS';
  ELSE
    RETURN '❌ MISSING';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION _hc_verify_table(p_table text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table
  ) THEN
    RETURN '✅ EXISTS';
  ELSE
    RETURN '❌ MISSING';
  END IF;
END;
$$;

-- ════════════════════════════════════════
-- SECTION 1: CRITICAL TABLE EXISTENCE
-- ════════════════════════════════════════

SELECT 'TABLE CHECK' AS check_type, table_name, _hc_verify_table(table_name) AS status
FROM (VALUES 
  ('profiles'),
  ('hc_global_operators'),
  ('directory_listings'),
  ('webhook_inbox'),
  ('user_subscriptions'),
  ('inbox_messages'),
  ('notifications'),
  ('loads'),
  ('ad_boosts'),
  ('data_purchases'),
  ('payments'),
  ('conversations'),
  ('messages')
) AS t(table_name)
ORDER BY status DESC, table_name;

-- ════════════════════════════════════════
-- SECTION 2: CRITICAL COLUMN EXISTENCE
-- ════════════════════════════════════════

-- 2A: profiles table — used by claim page, dashboard, entitlements
SELECT 'COLUMN CHECK: profiles' AS check_type, col_name, _hc_verify_column('profiles', col_name) AS status
FROM (VALUES 
  ('claim_state'),
  ('profile_completion_pct'),
  ('operator_id'),
  ('stripe_customer_id'),
  ('subscription_tier'),
  ('subscription_status'),
  ('phone'),
  ('avatar_url'),
  ('full_name')
) AS t(col_name)
ORDER BY status DESC, col_name;

-- 2B: hc_global_operators — used by directory main page
SELECT 'COLUMN CHECK: hc_global_operators' AS check_type, col_name, _hc_verify_column('hc_global_operators', col_name) AS status
FROM (VALUES 
  ('name'),
  ('admin1_code'),
  ('country_code'),
  ('confidence_score'),
  ('role_primary'),
  ('is_claimed'),
  ('city'),
  ('slug')
) AS t(col_name)
ORDER BY status DESC, col_name;

-- 2C: directory_listings — used by profile page, load board matching, RLS
SELECT 'COLUMN CHECK: directory_listings' AS check_type, col_name, _hc_verify_column('directory_listings', col_name) AS status
FROM (VALUES 
  ('slug'),
  ('name'),
  ('entity_type'),
  ('rank_score'),
  ('claim_status'),
  ('entity_id'),
  ('city'),
  ('region_code'),
  ('country_code'),
  ('is_visible'),
  ('claimed_by')
) AS t(col_name)
ORDER BY status DESC, col_name;

-- 2D: webhook_inbox — used by EntitlementEngine
SELECT 'COLUMN CHECK: webhook_inbox' AS check_type, col_name, _hc_verify_column('webhook_inbox', col_name) AS status
FROM (VALUES 
  ('provider'),
  ('event_id'),
  ('event_type'),
  ('payload'),
  ('status'),
  ('signature_verified'),
  ('retry_count'),
  ('processing_error')
) AS t(col_name)
ORDER BY status DESC, col_name;

-- 2E: loads — used by load board page
SELECT 'COLUMN CHECK: loads' AS check_type, col_name, _hc_verify_column('loads', col_name) AS status
FROM (VALUES 
  ('origin'),
  ('destination'),
  ('load_type'),
  ('rate_per_day'),
  ('country_code'),
  ('status'),
  ('corridor'),
  ('created_at')
) AS t(col_name)
ORDER BY status DESC, col_name;

-- ════════════════════════════════════════
-- SECTION 3: CRITICAL RPC/FUNCTION CHECK
-- ════════════════════════════════════════

SELECT 'FUNCTION CHECK' AS check_type, routine_name, '✅ EXISTS' AS status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'hc_start_conversation',
  'hc_send_msg',
  'rpc_state_counts',
  'bulk_ingest_directory_listings'
)
ORDER BY routine_name;

-- Check for MISSING functions
SELECT 'FUNCTION CHECK' AS check_type, fn_name AS routine_name, '❌ MISSING' AS status
FROM (VALUES 
  ('hc_start_conversation'),
  ('hc_send_msg'),
  ('rpc_state_counts'),
  ('bulk_ingest_directory_listings')
) AS t(fn_name)
WHERE fn_name NOT IN (
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public'
);

-- ════════════════════════════════════════
-- SECTION 4: RLS POLICY CHECK
-- ════════════════════════════════════════

SELECT 'RLS CHECK' AS check_type, tablename, 
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '⚠️ RLS DISABLED' END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'profiles', 'webhook_inbox', 'notifications', 'inbox_messages',
  'loads', 'directory_listings', 'hc_global_operators',
  'user_subscriptions', 'conversations', 'messages'
)
ORDER BY status, tablename;

-- ════════════════════════════════════════
-- SECTION 5: ROW COUNTS (sanity check)
-- ════════════════════════════════════════

SELECT 'ROW COUNT' AS check_type, 'profiles' AS table_name, count(*)::text AS status FROM public.profiles
UNION ALL
SELECT 'ROW COUNT', 'hc_global_operators', count(*)::text FROM public.hc_global_operators
UNION ALL
SELECT 'ROW COUNT', 'directory_listings', count(*)::text FROM public.directory_listings
UNION ALL
SELECT 'ROW COUNT', 'loads', count(*)::text FROM public.loads
UNION ALL
SELECT 'ROW COUNT', 'webhook_inbox', count(*)::text FROM public.webhook_inbox
UNION ALL
SELECT 'ROW COUNT', 'notifications', count(*)::text FROM public.notifications;

-- Cleanup temp functions
DROP FUNCTION IF EXISTS _hc_verify_column(text, text);
DROP FUNCTION IF EXISTS _hc_verify_table(text);
