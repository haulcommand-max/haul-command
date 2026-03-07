-- ============================================================
-- P1 PHASE 2: Harden critical functions — set search_path
-- Priority: payment, escrow, crypto, vault, claim, booking
-- Applied: 2026-03-07
-- ============================================================

-- ── CRITICAL: vault_read_secret ──
-- This function touches secrets — highest priority hardening
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vault_read_secret') THEN
    EXECUTE format(
      'ALTER FUNCTION public.vault_read_secret SET search_path = %L',
      ''
    );
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'vault_read_secret: %', SQLERRM;
END $$;

-- ── Payment functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_payment_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_payment_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_payment_create: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_payment_capture' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_payment_capture SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_payment_capture: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_payment_route' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_payment_route SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_payment_route: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_payment_summary' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_payment_summary SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_payment_summary: %', SQLERRM;
END $$;

-- ── Escrow functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_escrow_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_escrow_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_escrow_create: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_escrow_release' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_escrow_release SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_escrow_release: %', SQLERRM;
END $$;

-- ── Crypto payment functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_crypto_payment_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_crypto_payment_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_crypto_payment_create: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_crypto_payment_ipn_update' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_crypto_payment_ipn_update SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_crypto_payment_ipn_update: %', SQLERRM;
END $$;

-- ── Stripe functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_stripe_create_account' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_stripe_create_account SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_stripe_create_account: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_stripe_onboard_request' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_stripe_onboard_request SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_stripe_onboard_request: %', SQLERRM;
END $$;

-- ── API Key function ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_api_key_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_api_key_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_api_key_create: %', SQLERRM;
END $$;

-- ── Booking functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_booking_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_booking_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_booking_create: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_booking_confirm' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_booking_confirm SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_booking_confirm: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_booking_accept' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_booking_accept SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_booking_accept: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_booking_notify' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_booking_notify SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_booking_notify: %', SQLERRM;
END $$;

-- ── Job functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_job_start' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_job_start SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_job_start: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_job_verify' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_job_verify SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_job_verify: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_job_complete' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_job_complete SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_job_complete: %', SQLERRM;
END $$;

-- ── Claim functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_claim_initiate' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_claim_initiate SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_claim_initiate: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_claim_verify' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_claim_verify SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_claim_verify: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_claim_submit_relationships' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_claim_submit_relationships SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_claim_submit_relationships: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_claim_outreach_generate' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_claim_outreach_generate SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_claim_outreach_generate: %', SQLERRM;
END $$;

-- ── Dispute function ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_dispute_open' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_dispute_open SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_dispute_open: %', SQLERRM;
END $$;

-- ── AdGrid functions ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'serve_adgrid_ad' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.serve_adgrid_ad SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'serve_adgrid_ad: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_adgrid_advertiser_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_adgrid_advertiser_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_adgrid_advertiser_create: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_adgrid_campaign_create' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_adgrid_campaign_create SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_adgrid_campaign_create: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_adgrid_auction' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_adgrid_auction SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_adgrid_auction: %', SQLERRM;
END $$;

-- ── Radar RPCs ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_radar_live_signals' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.rpc_radar_live_signals SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'rpc_radar_live_signals: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_radar_us_states' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.rpc_radar_us_states SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'rpc_radar_us_states: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_radar_stats' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.rpc_radar_stats SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'rpc_radar_stats: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rpc_radar_country_summary' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.rpc_radar_country_summary SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'rpc_radar_country_summary: %', SQLERRM;
END $$;

-- ── Partner dashboard ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_partner_dashboard' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.get_partner_dashboard SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'get_partner_dashboard: %', SQLERRM;
END $$;

-- ── Compliance ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'hc_operator_compliance' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.hc_operator_compliance SET search_path = '';
  END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hc_operator_compliance: %', SQLERRM;
END $$;
