-- ═══════════════════════════════════════════════════════════════════════
-- GLOBAL CLAIM SYSTEM — Phase 2: Claim Engine Wiring Pack
-- Auto-generated from AntiGravity YAML Spec v1.0.0
-- ═══════════════════════════════════════════════════════════════════════

-- ============================
-- 1) CLAIMABILITY + METHODS
-- ============================

CREATE OR REPLACE FUNCTION public.set_claimable_status(
  p_surface_id uuid default null,
  p_country_code text default null,
  p_surface_type text default null,
  p_batch_limit int default 5000,
  p_dry_run boolean default false
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count int := 0;
BEGIN
  -- We assume standard logic: if it has phone/email/website, it's claimable
  IF NOT p_dry_run THEN
    UPDATE surfaces s
    SET 
      claim_status = CASE 
        WHEN claim_status = 'unclaimed' AND (phone IS NOT NULL OR email IS NOT NULL OR website IS NOT NULL) THEN 'claimable'
        ELSE claim_status
      END,
      claim_methods_available = ARRAY(
          SELECT unnest FROM unnest(
              ARRAY[
                  CASE WHEN website IS NOT NULL THEN 'dns' ELSE NULL END,
                  CASE WHEN website IS NOT NULL THEN 'website_token' ELSE NULL END,
                  CASE WHEN email IS NOT NULL THEN 'email_otp' ELSE NULL END,
                  CASE WHEN phone IS NOT NULL THEN 'sms_otp' ELSE NULL END,
                  'document',
                  'manual'
              ]
          ) WHERE unnest IS NOT NULL
      ),
      updated_at = now()
    WHERE claim_status IN ('unclaimed', 'claimable')
      AND (p_surface_id IS NULL OR id = p_surface_id)
      AND (p_country_code IS NULL OR country_code = p_country_code)
      AND (p_surface_type IS NULL OR surface_type = p_surface_type)
    RETURNING 1;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  END IF;
  
  RETURN v_updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_contactability_score(
  p_surface_id uuid
) RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
      WHEN phone IS NOT NULL AND email IS NOT NULL AND website IS NOT NULL THEN 1.0
      WHEN phone IS NOT NULL AND email IS NOT NULL THEN 0.8
      WHEN email IS NOT NULL AND website IS NOT NULL THEN 0.7
      WHEN phone IS NOT NULL THEN 0.5
      WHEN email IS NOT NULL THEN 0.4
      WHEN website IS NOT NULL THEN 0.3
      ELSE 0.0
  END
  FROM surfaces WHERE id = p_surface_id;
$$;


-- ============================
-- 2) PRIORITY SCORING
-- ============================

CREATE OR REPLACE FUNCTION public.compute_claim_priority_score(
  p_surface_id uuid default null,
  p_country_code text default null,
  p_surface_type text default null,
  p_recompute_all boolean default false,
  p_batch_limit int default 5000,
  p_dry_run boolean default false
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int := 0;
BEGIN
  IF NOT p_dry_run THEN
    UPDATE surfaces SET
        claim_priority_score = GREATEST(0, LEAST(100,
            (monetization_score * 30) +
            (liquidity_score * 30) +
            (data_confidence_score * 15) +
            (public.compute_contactability_score(id) * 15.0) +
            (CASE
                WHEN last_seen_activity_at IS NULL THEN 3.0
                WHEN last_seen_activity_at > now() - interval '7 days' THEN 10.0
                WHEN last_seen_activity_at > now() - interval '30 days' THEN 7.0
                WHEN last_seen_activity_at > now() - interval '90 days' THEN 4.0
                ELSE 2.0
            END) -
            (risk_score * 25) -
            (outreach_attempts_30d * 3)
        )),
        claim_priority_tier = CASE
            WHEN claim_priority_score >= 80 THEN 'A'
            WHEN claim_priority_score >= 65 THEN 'B'
            WHEN claim_priority_score >= 45 THEN 'C'
            ELSE 'D'
        END,
        updated_at = now()
    WHERE (p_recompute_all OR claim_priority_score = 0)
      AND (p_surface_id IS NULL OR id = p_surface_id)
      AND (p_country_code IS NULL OR country_code = p_country_code)
      AND (p_surface_type IS NULL OR surface_type = p_surface_type);
      
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;
  RETURN v_count;
END;
$$;


-- ============================
-- 3) QUEUE BUILDING + SCHEDULING
-- ============================

CREATE OR REPLACE FUNCTION public.build_claim_outreach_queue(
  p_country_code text default null,
  p_surface_type text default null,
  p_tier_filter text[] default array['A','B'],
  p_limit_per_country int default 250,
  p_global_limit int default 5000,
  p_min_priority numeric default 65,
  p_respect_fatigue boolean default true,
  p_dry_run boolean default false
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_batch_id uuid := gen_random_uuid();
BEGIN
  IF NOT p_dry_run THEN
    INSERT INTO outreach_events (id, surface_id, channel, template_id, status)
    SELECT gen_random_uuid(), id, 'email', 'claim_invite_default', 'queued'
    FROM surfaces
    WHERE claim_status = 'claimable'
      AND claim_priority_tier = ANY(p_tier_filter)
      AND claim_priority_score >= p_min_priority
      AND (p_country_code IS NULL OR country_code = p_country_code)
      AND (p_surface_type IS NULL OR surface_type = p_surface_type)
      AND (NOT p_respect_fatigue OR auth.uid() IS NULL) -- simplified fatigue
    LIMIT p_global_limit;
  END IF;
  RETURN v_batch_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_outreach_windows(
  p_batch_id uuid,
  p_min_hours_between_attempts int default 36,
  p_timezone text default 'America/New_York',
  p_dry_run boolean default false
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.select_best_channel_and_template(
  p_batch_id uuid,
  p_enable_channels text[] default array['email','sms','in_app'],
  p_optional_channels text[] default array[]::text[],
  p_dry_run boolean default false
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_outreach_events(
  p_batch_id uuid,
  p_outreach_per_hour_global int default 4000,
  p_outreach_per_hour_per_country int default 300,
  p_kill_switch_global_pause boolean default false,
  p_pause_countries text[] default array[]::text[],
  p_pause_surface_types text[] default array[]::text[],
  p_dry_run boolean default false
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 0;
END;
$$;

-- ============================
-- 4) PROVIDER ADAPTER SEND 
-- ============================
CREATE OR REPLACE FUNCTION public.dequeue_outreach_events(
  p_limit int default 200,
  p_channel text default null
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res jsonb;
BEGIN
  WITH next_batch AS (
    SELECT id FROM outreach_events 
    WHERE status = 'queued' 
      AND (p_channel IS NULL OR channel = p_channel)
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ), up as (
    UPDATE outreach_events
    SET status = 'sending'
    WHERE id IN (SELECT id FROM next_batch)
    RETURNING id, surface_id, channel, template_id
  )
  SELECT jsonb_agg(row_to_json(up)) INTO v_res FROM up;
  RETURN coalesce(v_res, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_outreach_sent(
  p_outreach_event_id uuid,
  p_provider text,
  p_provider_message_id text,
  p_sent_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE outreach_events 
  SET status = 'sent', provider_message_id = p_provider_message_id, sent_at = p_sent_at
  WHERE id = p_outreach_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_outreach_delivery_update(
  p_outreach_event_id uuid,
  p_status text,
  p_provider_payload jsonb default null,
  p_updated_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE outreach_events 
  SET status = p_status, metadata = metadata || p_provider_payload
  WHERE id = p_outreach_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_opt_out(
  p_contact text,
  p_channel text,
  p_surface_id uuid default null,
  p_reason text default null,
  p_opted_out_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO outreach_suppressions (contact_value, contact_type, reason, created_at)
  VALUES (p_contact, p_channel, coalesce(p_reason, 'opt_out'), p_opted_out_at)
  ON CONFLICT (contact_value, contact_type) DO UPDATE SET reason = excluded.reason;
END;
$$;

-- ============================
-- 5) CLAIM WIZARD CORE
-- ============================

CREATE OR REPLACE FUNCTION public.initiate_claim(
  p_surface_id uuid,
  p_claimant_user_id uuid,
  p_preferred_route text default null,
  p_request_ip inet default null,
  p_user_agent text default null
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim_id uuid;
BEGIN
  INSERT INTO claims (surface_id, claimant_user_id, country_code, status, verification_route)
  SELECT id, p_claimant_user_id, country_code, 'initiated', coalesce(p_preferred_route, 'email_otp')
  FROM surfaces WHERE id = p_surface_id
  RETURNING id INTO v_claim_id;
  RETURN v_claim_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_claim_otp(
  p_claim_id uuid,
  p_route text,                 -- sms|email
  p_destination text,           -- phone/email
  p_ttl_seconds int default 600,
  p_provider_hint text default null
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE claims SET status = 'otp_sent', verification_token = encode(gen_random_bytes(3), 'hex'), verification_token_expires = now() + (p_ttl_seconds * interval '1 second')
  WHERE id = p_claim_id;
  RETURN jsonb_build_object('challenge_id', p_claim_id, 'ttl_seconds', p_ttl_seconds);
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_claim_otp(
  p_claim_id uuid,
  p_code text,
  p_attempt_ip inet default null
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match boolean;
BEGIN
  UPDATE claims 
  SET status = 'otp_verified', verification_attempts = verification_attempts + 1
  WHERE id = p_claim_id AND verification_token = p_code AND verification_token_expires > now()
  RETURNING true INTO v_match;
  
  RETURN coalesce(v_match, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_claim_evidence(
  p_claim_id uuid,
  p_route text,                 
  p_evidence jsonb              
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE claims SET status = 'review', verification_evidence = p_evidence::text
  WHERE id = p_claim_id;
END;
$$;

-- ============================
-- 6) ADMIN REVIEW + APPROVAL
-- ============================

CREATE OR REPLACE FUNCTION public.approve_claim(
  p_claim_id uuid,
  p_admin_user_id uuid,
  p_perks text[] default array['verified_badge','profile_strength_boost','priority_placement_14d','lead_routing_toggle'],
  p_approved_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE claims SET status = 'approved', approved_at = p_approved_at WHERE id = p_claim_id;
  UPDATE surfaces SET claim_status = 'claimed', claim_owner_id = (SELECT claimant_user_id FROM claims WHERE id = p_claim_id)
  WHERE id = (SELECT surface_id FROM claims WHERE id = p_claim_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_claim(
  p_claim_id uuid,
  p_admin_user_id uuid,
  p_reason text,
  p_rejected_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE claims SET status = 'rejected', rejected_at = p_rejected_at, rejected_reason = p_reason WHERE id = p_claim_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_review_queue(
  p_queue text default null,
  p_country_code text default null,
  p_limit int default 100,
  p_offset int default 0
) RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(jsonb_agg(row_to_json(c)), '[]'::jsonb)
  FROM claims c WHERE status = 'review' LIMIT p_limit OFFSET p_offset;
$$;

-- ============================
-- 7) DISPUTES + LOCKS
-- ============================

CREATE OR REPLACE FUNCTION public.open_claim_dispute(
  p_surface_id uuid,
  p_existing_owner_id uuid default null,
  p_new_claim_id uuid,
  p_reason text default 'conflict',
  p_opened_at timestamptz default now()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_disp uuid;
BEGIN
  INSERT INTO claim_disputes (surface_id, initiated_by, against_claim_id, status, created_at)
  VALUES (p_surface_id, auth.uid(), p_new_claim_id, 'open', p_opened_at)
  RETURNING id INTO v_disp;
  UPDATE surfaces SET claim_status = 'disputed' WHERE id = p_surface_id;
  RETURN v_disp;
END;
$$;

CREATE OR REPLACE FUNCTION public.lock_surface_for_claims(
  p_surface_id uuid,
  p_lock_reason text,
  p_locked_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE surfaces SET claim_status = 'locked' WHERE id = p_surface_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_claim_dispute(
  p_dispute_id uuid,
  p_surface_id uuid,
  p_outcome text,
  p_resolved_by uuid,
  p_resolution_payload jsonb default '{}'::jsonb,
  p_resolved_at timestamptz default now()
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE claim_disputes SET status = 'resolved', resolution = p_outcome, resolved_by = p_resolved_by, resolved_at = p_resolved_at WHERE id = p_dispute_id;
END;
$$;

-- ============================
-- 8) WATCHDOGS + AUDIT + KPIs
-- ============================

CREATE OR REPLACE FUNCTION public.expire_stale_otps(
  p_now timestamptz default now()
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_c int;
BEGIN
  UPDATE claims SET status = 'rejected', rejected_reason = 'otp_expired'
  WHERE status = 'otp_sent' AND verification_token_expires < p_now;
  GET DIAGNOSTICS v_c = ROW_COUNT;
  RETURN v_c;
END;
$$;

CREATE OR REPLACE FUNCTION public.retry_failed_sends(
  p_max_retries int default 2,
  p_lookback_hours int default 24
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN RETURN 0; END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_audit_hashes(
  p_country_code text default null,
  p_batch_limit int default 20000
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN RETURN 0; END;
$$;

CREATE OR REPLACE FUNCTION public.detect_duplicate_contacts(
  p_threshold int default 5,
  p_lookback_days int default 180
) RETURNS jsonb
LANGUAGE sql
STABLE
AS $$ SELECT '[]'::jsonb; $$;

CREATE OR REPLACE FUNCTION public.flag_high_risk_claims_for_review(
  p_risk_threshold numeric default 0.80,
  p_lookback_hours int default 72
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN RETURN 0; END; $$;

CREATE OR REPLACE FUNCTION public.compute_claim_kpis_by_country(
  p_window_days int default 30
) RETURNS jsonb
LANGUAGE sql
STABLE
AS $$ SELECT '[]'::jsonb; $$;

CREATE OR REPLACE FUNCTION public.compute_claim_kpis_by_surface_type(
  p_window_days int default 30
) RETURNS jsonb
LANGUAGE sql
STABLE
AS $$ SELECT '[]'::jsonb; $$;

CREATE OR REPLACE FUNCTION public.publish_insights_cards(
  p_window_days int default 30
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN RETURN 0; END; $$;
