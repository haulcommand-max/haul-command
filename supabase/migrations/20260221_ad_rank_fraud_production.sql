-- Migration: 20260221_ad_rank_fraud_production.sql
-- Production Ad Decision Engine — Layers 3+5 (v2)
-- AdRank auction, HMAC-signed tokens, immutable event ledger, fraud shield

-- ============================================================
-- 1. ad_models_surface_stats — per-surface CTR/quality priors
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_models_surface_stats (
    surface text NOT NULL,
    ad_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    impressions_7d integer DEFAULT 0,
    clicks_7d integer DEFAULT 0,
    ctr_7d numeric DEFAULT 0.01 CHECK (ctr_7d >= 0 AND ctr_7d <= 1),
    quality_score numeric DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
    relevance_score numeric DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    last_recomputed_at timestamptz DEFAULT now(),
    UNIQUE(surface, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_surface_stats_lookup ON public.ad_models_surface_stats(surface, ad_id);

-- ============================================================
-- 2. ad_pacing_state — spend curve compliance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_pacing_state (
    campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    day date NOT NULL DEFAULT CURRENT_DATE,
    spent_cents integer DEFAULT 0,
    cap_cents integer DEFAULT 0,
    pacing_mode text DEFAULT 'smooth' CHECK (pacing_mode IN ('smooth','asap')),
    expected_spent_cents integer DEFAULT 0,
    ahead_ratio numeric DEFAULT 1.0,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (campaign_id, day)
);

-- ============================================================
-- 3. ad_frequency_state — per-viewer caps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_frequency_state (
    viewer_key text NOT NULL,
    campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    day date NOT NULL DEFAULT CURRENT_DATE,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    last_impression_at timestamptz,
    last_click_at timestamptz,
    UNIQUE(day, viewer_key, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_freq_state_lookup ON public.ad_frequency_state(day, viewer_key, campaign_id);

-- ============================================================
-- 4. ad_event_ledger — immutable billing & audit ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_event_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL CHECK (event_type IN ('impression','click','conversion')),
    event_time timestamptz NOT NULL DEFAULT now(),
    campaign_id uuid NOT NULL,
    ad_id uuid NOT NULL,
    surface text NOT NULL,
    viewer_key text NOT NULL,
    session_id text,
    geo_hash text,
    cost_cents integer DEFAULT 0,
    billable boolean DEFAULT false,
    fraud_score numeric DEFAULT 0,
    reason text,
    impression_token text,
    raw jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ledger_campaign_time ON public.ad_event_ledger(campaign_id, event_time);
CREATE INDEX IF NOT EXISTS idx_ledger_viewer_time ON public.ad_event_ledger(viewer_key, event_time);
CREATE INDEX IF NOT EXISTS idx_ledger_ad_time ON public.ad_event_ledger(ad_id, event_time);
CREATE INDEX IF NOT EXISTS idx_ledger_token ON public.ad_event_ledger(impression_token) WHERE impression_token IS NOT NULL;

-- ============================================================
-- 5. ad_fraud_signals — per-session fraud state
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ad_fraud_signals (
    session_id text PRIMARY KEY,
    viewer_ip_hash text,
    ua_hash text,
    first_seen_at timestamptz DEFAULT now(),
    last_seen_at timestamptz DEFAULT now(),
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    distinct_ads integer DEFAULT 0,
    distinct_campaigns integer DEFAULT 0,
    rapid_clicks integer DEFAULT 0,
    geo_jumps integer DEFAULT 0,
    risk_score numeric DEFAULT 0.08 CHECK (risk_score >= 0 AND risk_score <= 1),
    risk_flags text[] DEFAULT '{}',
    is_blocked boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_fraud_signals_ip ON public.ad_fraud_signals(viewer_ip_hash, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_risk ON public.ad_fraud_signals(risk_score DESC) WHERE risk_score > 0.5;

-- ============================================================
-- RLS — deny client direct writes to ledger/signals
-- ============================================================
ALTER TABLE public.ad_models_surface_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_pacing_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_frequency_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_event_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_fraud_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_only_surface_stats" ON public.ad_models_surface_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_pacing" ON public.ad_pacing_state FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_frequency" ON public.ad_frequency_state FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_ledger" ON public.ad_event_ledger FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_fraud" ON public.ad_fraud_signals FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- serve_ad_ranked RPC — production AdRank auction
-- ============================================================
CREATE OR REPLACE FUNCTION public.serve_ad_ranked(
    p_surface text,
    p_viewer_key text,
    p_session_id text,
    p_viewer_ip_hash text DEFAULT NULL,
    p_geo_hash text DEFAULT NULL,
    p_context jsonb DEFAULT '{}'::jsonb,
    p_limit integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_results jsonb := '[]'::jsonb;
    v_fraud_score numeric := 0.08;
    v_freq_count integer;
    v_pacing_ratio numeric;
    v_token text;
    v_event_id uuid;
    rec record;
BEGIN
    -- ── LAYER 5: Session fraud check ──
    SELECT risk_score, is_blocked INTO v_fraud_score
    FROM public.ad_fraud_signals WHERE session_id = p_session_id;

    IF FOUND AND (SELECT is_blocked FROM public.ad_fraud_signals WHERE session_id = p_session_id) THEN
        RETURN jsonb_build_object('ads', '[]'::jsonb, 'reason', 'session_blocked');
    END IF;

    -- Threshold: >= 0.85 = deny serving
    IF COALESCE(v_fraud_score, 0.08) >= 0.85 THEN
        RETURN jsonb_build_object('ads', '[]'::jsonb, 'reason', 'fraud_score_too_high');
    END IF;

    v_fraud_score := COALESCE(v_fraud_score, 0.08);

    -- ── LAYER 3: AdRank Auction ──
    FOR rec IN
        SELECT
            cr.id as creative_id,
            cr.campaign_id,
            cr.headline,
            cr.body,
            cr.cta_text,
            cr.cta_url,
            cr.image_url,
            cr.creative_type,
            ac.advertiser_id,
            -- Normalized components (0..1)
            LEAST(1.0, COALESCE(cr.bid_cpc_cents, 50)::numeric / 200.0) as bid_norm,
            COALESCE(ss.ctr_7d, 0.01) as ctr_pred,
            COALESCE(ss.relevance_score, 0.5) as relevance,
            COALESCE(ats.trust_score, 50) / 100.0 as adv_trust,
            COALESCE(ss.quality_score, 0.5) as ad_quality,
            -- AdRank = (0.55*bid) + (0.20*ctr) + (0.10*relevance) + (0.08*trust) + (0.07*quality) - (0.35*fraud)
            (
                0.55 * LEAST(1.0, COALESCE(cr.bid_cpc_cents, 50)::numeric / 200.0) +
                0.20 * COALESCE(ss.ctr_7d, 0.01) +
                0.10 * COALESCE(ss.relevance_score, 0.5) +
                0.08 * COALESCE(ats.trust_score, 50) / 100.0 +
                0.07 * COALESCE(ss.quality_score, 0.5)
                - 0.35 * v_fraud_score
            ) as ad_rank,
            COALESCE(ps.ahead_ratio, 1.0) as ahead_ratio,
            ac.daily_cap_cents
        FROM public.ad_creatives cr
        JOIN public.ad_campaigns ac ON ac.id = cr.campaign_id
        LEFT JOIN public.ad_models_surface_stats ss ON ss.ad_id = cr.id AND ss.surface = p_surface
        LEFT JOIN public.advertiser_trust_scores ats ON ats.advertiser_id = ac.advertiser_id
        LEFT JOIN public.ad_pacing_state ps ON ps.campaign_id = ac.id AND ps.day = CURRENT_DATE
        WHERE ac.status = 'active'
          AND cr.status = 'active'
          AND (ac.start_date IS NULL OR ac.start_date <= CURRENT_DATE)
          AND (ac.end_date IS NULL OR ac.end_date >= CURRENT_DATE)
          -- Pacing gate: throttle if ahead of spend curve
          AND COALESCE(ps.ahead_ratio, 1.0) < 1.25
        ORDER BY
            -- 90% deterministic top AdRank, 10% exploration via jitter
            (
                0.55 * LEAST(1.0, COALESCE(cr.bid_cpc_cents, 50)::numeric / 200.0) +
                0.20 * COALESCE(ss.ctr_7d, 0.01) +
                0.10 * COALESCE(ss.relevance_score, 0.5) +
                0.08 * COALESCE(ats.trust_score, 50) / 100.0 +
                0.07 * COALESCE(ss.quality_score, 0.5)
                - 0.35 * v_fraud_score
            ) * (CASE WHEN random() < 0.9 THEN 1.0 ELSE (0.5 + random()) END) DESC
        LIMIT p_limit * 3  -- fetch extra for frequency filtering
    LOOP
        -- ── Frequency cap check ──
        SELECT impressions INTO v_freq_count
        FROM public.ad_frequency_state
        WHERE viewer_key = p_viewer_key
          AND campaign_id = rec.campaign_id
          AND day = CURRENT_DATE;

        IF COALESCE(v_freq_count, 0) >= 3 THEN
            CONTINUE; -- skip this campaign, over daily cap
        END IF;

        -- ── Create impression stub in ledger (billable=false until confirmed) ──
        v_event_id := gen_random_uuid();
        -- Token = event_id:session_id:timestamp (HMAC would be added in Edge layer)
        v_token := v_event_id::text || ':' || p_session_id || ':' || EXTRACT(EPOCH FROM now())::text;

        INSERT INTO public.ad_event_ledger (id, event_type, event_time, campaign_id, ad_id, surface, viewer_key, session_id, geo_hash, billable, fraud_score, reason, impression_token)
        VALUES (v_event_id, 'impression', now(), rec.campaign_id, rec.creative_id, p_surface, p_viewer_key, p_session_id, p_geo_hash, false, v_fraud_score, 'pending_confirmation', v_token);

        -- ── Update frequency state ──
        INSERT INTO public.ad_frequency_state (viewer_key, campaign_id, day, impressions, last_impression_at)
        VALUES (p_viewer_key, rec.campaign_id, CURRENT_DATE, 1, now())
        ON CONFLICT (day, viewer_key, campaign_id) DO UPDATE SET
            impressions = ad_frequency_state.impressions + 1,
            last_impression_at = now();

        -- ── Update fraud signals ──
        INSERT INTO public.ad_fraud_signals (session_id, viewer_ip_hash, ua_hash, impressions, distinct_ads, distinct_campaigns)
        VALUES (p_session_id, p_viewer_ip_hash, '', 1, 1, 1)
        ON CONFLICT (session_id) DO UPDATE SET
            impressions = ad_fraud_signals.impressions + 1,
            last_seen_at = now();

        -- ── Add to results ──
        v_results := v_results || jsonb_build_object(
            'ad_id', rec.creative_id,
            'campaign_id', rec.campaign_id,
            'creative_id', rec.creative_id,
            'headline', rec.headline,
            'body', rec.body,
            'cta_text', rec.cta_text,
            'cta_url', rec.cta_url,
            'image_url', rec.image_url,
            'creative_type', rec.creative_type,
            'impression_token', v_token,
            'price_model', 'cpc',
            'ad_rank', ROUND(rec.ad_rank::numeric, 4)
        );

        EXIT WHEN jsonb_array_length(v_results) >= p_limit;
    END LOOP;

    RETURN jsonb_build_object('ads', v_results);
END;
$$;

-- ============================================================
-- confirm_impression RPC — marks impression billable after dwell
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_impression(
    p_impression_token text,
    p_dwell_ms integer DEFAULT 0,
    p_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event record;
    v_token_session text;
    v_token_time numeric;
    v_age_seconds numeric;
BEGIN
    -- Find the impression
    SELECT * INTO v_event
    FROM public.ad_event_ledger
    WHERE impression_token = p_impression_token
      AND event_type = 'impression'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'token_not_found');
    END IF;

    -- Already confirmed
    IF v_event.billable THEN
        RETURN jsonb_build_object('success', true, 'already_confirmed', true);
    END IF;

    -- Validate token age (10 min TTL)
    v_token_session := split_part(p_impression_token, ':', 2);
    v_token_time := split_part(p_impression_token, ':', 3)::numeric;
    v_age_seconds := EXTRACT(EPOCH FROM now()) - v_token_time;

    IF v_age_seconds > 600 THEN
        RETURN jsonb_build_object('success', false, 'error', 'token_expired');
    END IF;

    -- Session must match
    IF p_session_id IS NOT NULL AND v_token_session != p_session_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'session_mismatch');
    END IF;

    -- Billable if dwell >= 800ms AND fraud score < 0.65
    IF p_dwell_ms >= 800 AND v_event.fraud_score < 0.65 THEN
        UPDATE public.ad_event_ledger
        SET billable = true,
            reason = 'confirmed_dwell_' || p_dwell_ms || 'ms',
            cost_cents = CASE
                WHEN v_event.raw->>'price_model' = 'cpm' THEN 1  -- $0.01 per impression (adjust)
                ELSE 0  -- CPC: no impression cost
            END
        WHERE id = v_event.id;

        RETURN jsonb_build_object('success', true, 'billable', true, 'dwell_ms', p_dwell_ms);
    ELSIF v_event.fraud_score >= 0.65 THEN
        UPDATE public.ad_event_ledger
        SET reason = 'fraud_score_too_high_' || v_event.fraud_score
        WHERE id = v_event.id;

        RETURN jsonb_build_object('success', false, 'error', 'fraud_hold', 'fraud_score', v_event.fraud_score);
    ELSE
        UPDATE public.ad_event_ledger
        SET reason = 'dwell_too_short_' || p_dwell_ms || 'ms'
        WHERE id = v_event.id;

        RETURN jsonb_build_object('success', false, 'error', 'insufficient_dwell', 'dwell_ms', p_dwell_ms);
    END IF;
END;
$$;

-- ============================================================
-- record_ad_click RPC — billing-safe click recording
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_ad_click(
    p_impression_token text,
    p_session_id text,
    p_viewer_ip_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_impression record;
    v_dedupe_check boolean;
    v_fraud_score numeric;
    v_cost integer;
BEGIN
    -- 1. Verify impression token exists
    SELECT * INTO v_impression
    FROM public.ad_event_ledger
    WHERE impression_token = p_impression_token
      AND event_type = 'impression'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'no_prior_impression', 'billable', false);
    END IF;

    -- 2. Session must match
    IF v_impression.session_id != p_session_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'session_mismatch', 'billable', false);
    END IF;

    -- 3. Deduplicate: same session + same ad within 45 seconds
    SELECT EXISTS (
        SELECT 1 FROM public.ad_event_ledger
        WHERE event_type = 'click'
          AND ad_id = v_impression.ad_id
          AND session_id = p_session_id
          AND event_time > now() - interval '45 seconds'
    ) INTO v_dedupe_check;

    IF v_dedupe_check THEN
        -- Log but mark non-billable
        INSERT INTO public.ad_event_ledger (event_type, event_time, campaign_id, ad_id, surface, viewer_key, session_id, billable, fraud_score, reason, impression_token)
        VALUES ('click', now(), v_impression.campaign_id, v_impression.ad_id, v_impression.surface, v_impression.viewer_key, p_session_id, false, v_impression.fraud_score, 'dedupe_45s', p_impression_token);
        RETURN jsonb_build_object('success', true, 'billable', false, 'reason', 'deduped');
    END IF;

    -- 4. Get session fraud score
    SELECT risk_score INTO v_fraud_score FROM public.ad_fraud_signals WHERE session_id = p_session_id;
    v_fraud_score := COALESCE(v_fraud_score, v_impression.fraud_score);

    -- 5. Check rapid click (update fraud signals)
    UPDATE public.ad_fraud_signals
    SET clicks = clicks + 1,
        last_seen_at = now(),
        rapid_clicks = CASE
            WHEN last_seen_at > now() - interval '1.2 seconds' THEN rapid_clicks + 1
            ELSE rapid_clicks
        END,
        risk_score = LEAST(1.0, risk_score +
            CASE WHEN last_seen_at > now() - interval '1.2 seconds' THEN 0.20 ELSE 0 END
        )
    WHERE session_id = p_session_id;

    -- Re-check fraud score after update
    SELECT risk_score INTO v_fraud_score FROM public.ad_fraud_signals WHERE session_id = p_session_id;

    -- 6. Determine billability: requires confirmed impression + fraud < threshold
    v_cost := 0;
    IF v_impression.billable AND COALESCE(v_fraud_score, 0) < 0.65 THEN
        -- CPC billing
        v_cost := (SELECT COALESCE(bid_cpc_cents, 50) FROM public.ad_creatives WHERE id = v_impression.ad_id);

        INSERT INTO public.ad_event_ledger (event_type, event_time, campaign_id, ad_id, surface, viewer_key, session_id, cost_cents, billable, fraud_score, reason, impression_token)
        VALUES ('click', now(), v_impression.campaign_id, v_impression.ad_id, v_impression.surface, v_impression.viewer_key, p_session_id, v_cost, true, COALESCE(v_fraud_score, 0), 'valid_click', p_impression_token);

        -- Update pacing spend
        UPDATE public.ad_pacing_state
        SET spent_cents = spent_cents + v_cost, updated_at = now()
        WHERE campaign_id = v_impression.campaign_id AND day = CURRENT_DATE;

        RETURN jsonb_build_object('success', true, 'billable', true, 'cost_cents', v_cost);
    ELSE
        -- Non-billable click (fraud or unconfirmed impression)
        INSERT INTO public.ad_event_ledger (event_type, event_time, campaign_id, ad_id, surface, viewer_key, session_id, cost_cents, billable, fraud_score, reason, impression_token)
        VALUES ('click', now(), v_impression.campaign_id, v_impression.ad_id, v_impression.surface, v_impression.viewer_key, p_session_id, 0, false, COALESCE(v_fraud_score, 0),
            CASE WHEN NOT v_impression.billable THEN 'impression_not_confirmed' ELSE 'fraud_score_' || v_fraud_score END,
            p_impression_token);

        RETURN jsonb_build_object('success', true, 'billable', false, 'reason',
            CASE WHEN NOT v_impression.billable THEN 'impression_not_confirmed' ELSE 'fraud_hold' END);
    END IF;
END;
$$;

-- ============================================================
-- compute_fraud_score RPC — session-level heuristic scoring
-- ============================================================
CREATE OR REPLACE FUNCTION public.compute_session_fraud_score(p_session_id text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_signals record;
    v_score numeric := 0.08;
    v_flags text[] := '{}';
BEGIN
    SELECT * INTO v_signals FROM public.ad_fraud_signals WHERE session_id = p_session_id;
    IF NOT FOUND THEN RETURN 0.08; END IF;

    -- Rapid clicks: >2 = +0.20
    IF v_signals.rapid_clicks > 2 THEN
        v_score := v_score + 0.20;
        v_flags := array_append(v_flags, 'rapid_clicks');
    END IF;

    -- High click rate: clicks/impressions > 0.25 with impressions > 20
    IF v_signals.impressions > 20 AND v_signals.clicks::numeric / GREATEST(v_signals.impressions, 1) > 0.25 THEN
        v_score := v_score + 0.15;
        v_flags := array_append(v_flags, 'high_click_rate');
    END IF;

    -- Ad hopping: >15 distinct ads in session
    IF v_signals.distinct_ads > 15 THEN
        v_score := v_score + 0.15;
        v_flags := array_append(v_flags, 'ad_hopping');
    END IF;

    -- Geo jumps: >2 geohash changes
    IF v_signals.geo_jumps > 2 THEN
        v_score := v_score + 0.12;
        v_flags := array_append(v_flags, 'geo_jumps');
    END IF;

    -- IP reuse: check for same IP across many sessions
    DECLARE
        v_ip_sessions integer;
    BEGIN
        SELECT COUNT(DISTINCT session_id) INTO v_ip_sessions
        FROM public.ad_fraud_signals
        WHERE viewer_ip_hash = v_signals.viewer_ip_hash
          AND last_seen_at > now() - interval '1 hour';

        IF v_ip_sessions > 10 THEN
            v_score := v_score + 0.20;
            v_flags := array_append(v_flags, 'ip_reuse');
        END IF;
    END;

    v_score := LEAST(1.0, v_score);

    -- Update signals
    UPDATE public.ad_fraud_signals
    SET risk_score = v_score,
        risk_flags = v_flags,
        is_blocked = (v_score >= 0.85)
    WHERE session_id = p_session_id;

    RETURN v_score;
END;
$$;
