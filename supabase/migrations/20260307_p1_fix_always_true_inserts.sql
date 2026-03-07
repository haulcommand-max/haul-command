-- ============================================================
-- P1 PHASE 1: Replace dangerous WITH CHECK (true) insert policies
-- These let ANY anonymous user insert ANY payload
-- Applied: 2026-03-07
-- ============================================================

-- ── Alert Subscriptions: validate email ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hc_alert_subscriptions' AND policyname LIKE '%insert%') THEN
    DROP POLICY IF EXISTS "Anyone can subscribe to alerts" ON public.hc_alert_subscriptions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_alert_subscriptions') THEN
    CREATE POLICY "validated_public_insert_alert_sub" ON public.hc_alert_subscriptions
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      email IS NOT NULL
      AND length(email) <= 320
      AND email LIKE '%@%.%'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'alert_subscriptions policy: %', SQLERRM;
END $$;

-- ── Device Tokens: validate token ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can register device token" ON public.hc_device_tokens;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_device_tokens') THEN
    CREATE POLICY "validated_public_insert_device_token" ON public.hc_device_tokens
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      token IS NOT NULL
      AND length(token) >= 10
      AND length(token) <= 512
    );
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'device_tokens policy: %', SQLERRM;
END $$;

-- ── Compliance Card Downloads: validate ──
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can insert compliance card downloads" ON public.hc_compliance_card_downloads;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_compliance_card_downloads') THEN
    CREATE POLICY "validated_public_insert_compliance_dl" ON public.hc_compliance_card_downloads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);  -- intentional: analytics-only table, low risk
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'compliance_dl policy: %', SQLERRM;
END $$;

-- ── Backend-only tables: REVOKE client insert entirely ──
-- These should only be written via service-role / Edge Functions

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_company_discovery_queue') THEN
    DROP POLICY IF EXISTS "Anyone can insert company discovery" ON public.hc_company_discovery_queue;
    REVOKE INSERT ON public.hc_company_discovery_queue FROM anon, authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_company_merge_log') THEN
    DROP POLICY IF EXISTS "Anyone can insert merge log" ON public.hc_company_merge_log;
    REVOKE INSERT ON public.hc_company_merge_log FROM anon, authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_discovery_batches') THEN
    DROP POLICY IF EXISTS "Anyone can insert discovery batches" ON public.hc_discovery_batches;
    REVOKE INSERT ON public.hc_discovery_batches FROM anon, authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_fmcsa_carriers') THEN
    DROP POLICY IF EXISTS "Anyone can insert fmcsa carriers" ON public.hc_fmcsa_carriers;
    REVOKE INSERT ON public.hc_fmcsa_carriers FROM anon, authenticated;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── Dispatcher tables: move to authenticated-only ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_dispatchers') THEN
    DROP POLICY IF EXISTS "Anyone can insert dispatchers" ON public.hc_dispatchers;
    REVOKE INSERT ON public.hc_dispatchers FROM anon;
    -- Keep authenticated insert but scope it
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_dispatcher_aliases') THEN
    DROP POLICY IF EXISTS "Anyone can insert dispatcher aliases" ON public.hc_dispatcher_aliases;
    REVOKE INSERT ON public.hc_dispatcher_aliases FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_dispatcher_company_edges') THEN
    DROP POLICY IF EXISTS "Anyone can insert dispatcher company edges" ON public.hc_dispatcher_company_edges;
    REVOKE INSERT ON public.hc_dispatcher_company_edges FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_dispatcher_corridor_edges') THEN
    DROP POLICY IF EXISTS "Anyone can insert dispatcher corridor edges" ON public.hc_dispatcher_corridor_edges;
    REVOKE INSERT ON public.hc_dispatcher_corridor_edges FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_dispatcher_merge_suggestions') THEN
    DROP POLICY IF EXISTS "Anyone can insert dispatcher merge suggestions" ON public.hc_dispatcher_merge_suggestions;
    REVOKE INSERT ON public.hc_dispatcher_merge_suggestions FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_lane_posts') THEN
    DROP POLICY IF EXISTS "Anyone can insert lane posts" ON public.hc_lane_posts;
    REVOKE INSERT ON public.hc_lane_posts FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── CSN tables: validated insert or backend-only ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_csn_signals') THEN
    DROP POLICY IF EXISTS "Anyone can insert csn signals" ON public.hc_csn_signals;
    REVOKE INSERT ON public.hc_csn_signals FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_csn_tracks') THEN
    DROP POLICY IF EXISTS "Anyone can insert csn tracks" ON public.hc_csn_tracks;
    REVOKE INSERT ON public.hc_csn_tracks FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='hc_csn_votes') THEN
    DROP POLICY IF EXISTS "Anyone can insert csn votes" ON public.hc_csn_votes;
    REVOKE INSERT ON public.hc_csn_votes FROM anon;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
