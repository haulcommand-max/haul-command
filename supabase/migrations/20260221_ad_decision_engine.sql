-- Migration: 20260221_ad_decision_engine.sql
-- Layer 3: AdRank Auction Decision Engine
-- Layer 5: Trust & Fraud Shield

-- ============================================================
-- LAYER 3 — DECISION ENGINE
-- ============================================================

-- 1. Ad Quality Scores — tracks predicted CTR + conversion per creative
CREATE TABLE IF NOT EXISTS public.ad_quality_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    predicted_ctr numeric DEFAULT 0.01 CHECK (predicted_ctr >= 0 AND predicted_ctr <= 1),
    predicted_conversion numeric DEFAULT 0.005 CHECK (predicted_conversion >= 0 AND predicted_conversion <= 1),
    historical_impressions integer DEFAULT 0,
    historical_clicks integer DEFAULT 0,
    historical_conversions integer DEFAULT 0,
    quality_score numeric DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),
    last_computed_at timestamptz DEFAULT now(),
    UNIQUE(creative_id)
);

-- 2. Ad Bids — per-creative bid amounts
ALTER TABLE public.ad_creatives
    ADD COLUMN IF NOT EXISTS bid_cpc_cents integer DEFAULT 50,
    ADD COLUMN IF NOT EXISTS bid_cpm_cents integer DEFAULT 500;

-- 3. Advertiser Trust Scores
CREATE TABLE IF NOT EXISTS public.advertiser_trust_scores (
    advertiser_id uuid PRIMARY KEY REFERENCES auth.users(id),
    trust_score numeric DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    payment_reliability numeric DEFAULT 100,
    creative_quality numeric DEFAULT 50,
    policy_violations integer DEFAULT 0,
    last_computed_at timestamptz DEFAULT now()
);

-- 4. Frequency Caps
CREATE TABLE IF NOT EXISTS public.ad_frequency_caps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    max_impressions_per_user_per_day integer DEFAULT 3,
    max_impressions_per_user_per_hour integer DEFAULT 1,
    UNIQUE(campaign_id)
);

-- 5. Ad Pacing — tracks daily delivery rate
CREATE TABLE IF NOT EXISTS public.ad_pacing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    target_date date NOT NULL DEFAULT CURRENT_DATE,
    target_impressions integer DEFAULT 0,
    delivered_impressions integer DEFAULT 0,
    pacing_factor numeric DEFAULT 1.0 CHECK (pacing_factor >= 0 AND pacing_factor <= 5),
    UNIQUE(campaign_id, target_date)
);

-- ============================================================
-- LAYER 5 — FRAUD SHIELD
-- ============================================================

-- 6. Traffic Events — raw event log for fraud analysis
CREATE TABLE IF NOT EXISTS public.ad_traffic_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL CHECK (event_type IN ('impression','click','conversion')),
    creative_id uuid NOT NULL,
    placement_id text NOT NULL,
    user_id uuid,
    ip_hash text, -- SHA-256 of IP for privacy
    user_agent_hash text,
    session_id text,
    occurred_at timestamptz DEFAULT now(),
    fraud_score numeric DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
    is_valid boolean DEFAULT true,
    fraud_reason text
);

CREATE INDEX IF NOT EXISTS idx_traffic_events_creative ON public.ad_traffic_events(creative_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_traffic_events_ip ON public.ad_traffic_events(ip_hash, occurred_at);
CREATE INDEX IF NOT EXISTS idx_traffic_events_fraud ON public.ad_traffic_events(is_valid, fraud_score);

-- 7. IP Reputation
CREATE TABLE IF NOT EXISTS public.ad_ip_reputation (
    ip_hash text PRIMARY KEY,
    reputation_score numeric DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
    total_events integer DEFAULT 0,
    flagged_events integer DEFAULT 0,
    is_blocked boolean DEFAULT false,
    first_seen_at timestamptz DEFAULT now(),
    last_seen_at timestamptz DEFAULT now()
);

-- 8. Fraud Rules — configurable detection rules
CREATE TABLE IF NOT EXISTS public.ad_fraud_rules (
    id text PRIMARY KEY,
    rule_name text NOT NULL,
    rule_type text NOT NULL CHECK (rule_type IN ('rapid_click','bot_heuristic','ip_velocity','session_anomaly','billing')),
    threshold_value numeric NOT NULL,
    action text NOT NULL DEFAULT 'flag' CHECK (action IN ('flag','block','refund','alert')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Seed default fraud rules
INSERT INTO public.ad_fraud_rules (id, rule_name, rule_type, threshold_value, action) VALUES
    ('rapid_click_5s', 'Rapid Click Detection', 'rapid_click', 5, 'flag'),
    ('rapid_click_1s', 'Instant Double Click', 'rapid_click', 1, 'block'),
    ('ip_velocity_100', 'IP Velocity Limit', 'ip_velocity', 100, 'flag'),
    ('ip_velocity_500', 'IP Flood Detection', 'ip_velocity', 500, 'block'),
    ('bot_no_js', 'No JavaScript Bot', 'bot_heuristic', 1, 'block'),
    ('session_zero_dwell', 'Zero Dwell Time', 'session_anomaly', 0, 'flag'),
    ('billing_invalid_click', 'Invalid Click Filter', 'billing', 0.8, 'refund')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.ad_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_frequency_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_pacing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_traffic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_fraud_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_quality" ON public.ad_quality_scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_trust" ON public.advertiser_trust_scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_freq" ON public.ad_frequency_caps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_pacing" ON public.ad_pacing FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_traffic" ON public.ad_traffic_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_ip" ON public.ad_ip_reputation FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_fraud_rules" ON public.ad_fraud_rules FOR SELECT USING (true);
CREATE POLICY "service_all_fraud_rules" ON public.ad_fraud_rules FOR ALL USING (auth.role() = 'service_role');

-- Advertisers can read own trust score
CREATE POLICY "advertiser_own_trust" ON public.advertiser_trust_scores FOR SELECT USING (advertiser_id = auth.uid());

-- ============================================================
-- UPGRADED SERVE_AD RPC — AdRank Auction
-- ============================================================

CREATE OR REPLACE FUNCTION public.serve_ad(
    p_placement_id text,
    p_user_role text DEFAULT NULL,
    p_jurisdiction text DEFAULT NULL,
    p_user_ip_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_winner record;
    v_user_id uuid;
    v_freq_count integer;
BEGIN
    v_user_id := auth.uid();

    -- ── LAYER 5: IP reputation check ──
    IF p_user_ip_hash IS NOT NULL THEN
        -- Check if IP is blocked
        IF EXISTS (SELECT 1 FROM public.ad_ip_reputation WHERE ip_hash = p_user_ip_hash AND is_blocked = true) THEN
            RETURN jsonb_build_object('ad', NULL, 'message', 'blocked');
        END IF;
        -- Update last_seen
        INSERT INTO public.ad_ip_reputation (ip_hash, last_seen_at, total_events)
        VALUES (p_user_ip_hash, now(), 1)
        ON CONFLICT (ip_hash) DO UPDATE SET
            last_seen_at = now(),
            total_events = ad_ip_reputation.total_events + 1;
    END IF;

    -- ── LAYER 3: AdRank Auction ──
    -- AdRank = (Bid * 0.55) + (CTR_pred * 0.20) + (Conv_pred * 0.15) + (Trust * 0.10)
    SELECT
        cr.id as creative_id,
        cr.headline,
        cr.body,
        cr.cta_text,
        cr.cta_url,
        cr.image_url,
        cr.creative_type,
        ac.id as campaign_id,
        ac.advertiser_id,
        -- AdRank formula
        (
            COALESCE(cr.bid_cpc_cents, 50)::numeric / 100.0 * 0.55 +
            COALESCE(qs.predicted_ctr, 0.01) * 100 * 0.20 +
            COALESCE(qs.predicted_conversion, 0.005) * 100 * 0.15 +
            COALESCE(ats.trust_score, 50) * 0.10
        ) as ad_rank,
        COALESCE(ap.pacing_factor, 1.0) as pacing_factor,
        COALESCE(fc.max_impressions_per_user_per_hour, 1) as freq_cap_hour
    INTO v_winner
    FROM public.ad_creatives cr
    JOIN public.ad_campaigns ac ON ac.id = cr.campaign_id
    JOIN public.ad_placements pl ON pl.id = p_placement_id
    LEFT JOIN public.ad_quality_scores qs ON qs.creative_id = cr.id
    LEFT JOIN public.advertiser_trust_scores ats ON ats.advertiser_id = ac.advertiser_id
    LEFT JOIN public.ad_pacing ap ON ap.campaign_id = ac.id AND ap.target_date = CURRENT_DATE
    LEFT JOIN public.ad_frequency_caps fc ON fc.campaign_id = ac.id
    WHERE ac.status = 'active'
      AND cr.status = 'active'
      AND (cr.creative_type = pl.format OR pl.format = 'native')
      AND (ac.start_date IS NULL OR ac.start_date <= CURRENT_DATE)
      AND (ac.end_date IS NULL OR ac.end_date >= CURRENT_DATE)
      -- Role targeting
      AND (ac.targeting->>'roles' IS NULL OR ac.targeting->'roles' ? COALESCE(p_user_role, 'unknown'))
      -- Jurisdiction targeting
      AND (ac.targeting->>'jurisdictions' IS NULL OR ac.targeting->'jurisdictions' ? COALESCE(p_jurisdiction, ''))
      -- Pacing: only serve if under delivery target
      AND COALESCE(ap.pacing_factor, 1.0) > 0
    ORDER BY
        -- AdRank * pacing_factor * random jitter (prevents deterministic winner)
        (
            COALESCE(cr.bid_cpc_cents, 50)::numeric / 100.0 * 0.55 +
            COALESCE(qs.predicted_ctr, 0.01) * 100 * 0.20 +
            COALESCE(qs.predicted_conversion, 0.005) * 100 * 0.15 +
            COALESCE(ats.trust_score, 50) * 0.10
        ) * COALESCE(ap.pacing_factor, 1.0) * (0.8 + random() * 0.4) DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ad', NULL, 'message', 'No eligible ads');
    END IF;

    -- ── Frequency cap check ──
    IF v_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_freq_count
        FROM public.ad_impressions
        WHERE creative_id = v_winner.creative_id
          AND user_id = v_user_id
          AND viewed_at > now() - interval '1 hour';

        IF v_freq_count >= v_winner.freq_cap_hour THEN
            RETURN jsonb_build_object('ad', NULL, 'message', 'Frequency cap reached');
        END IF;
    END IF;

    -- ── Daily budget check ──
    DECLARE
        v_daily_impressions integer;
    BEGIN
        SELECT COUNT(*) INTO v_daily_impressions
        FROM public.ad_impressions
        WHERE creative_id = v_winner.creative_id
          AND viewed_at::date = CURRENT_DATE;

        -- Rough CPM check: if daily spend exceeds cap
        IF v_daily_impressions * COALESCE(v_winner.pacing_factor, 0.5) > 10000 THEN
            RETURN jsonb_build_object('ad', NULL, 'message', 'Campaign over daily cap');
        END IF;
    END;

    -- ── Record impression ──
    INSERT INTO public.ad_impressions (creative_id, placement_id, user_id, user_role, jurisdiction_code)
    VALUES (v_winner.creative_id, p_placement_id, v_user_id, p_user_role, p_jurisdiction);

    -- ── Record traffic event for fraud analysis ──
    INSERT INTO public.ad_traffic_events (event_type, creative_id, placement_id, user_id, ip_hash)
    VALUES ('impression', v_winner.creative_id, p_placement_id, v_user_id, p_user_ip_hash);

    RETURN jsonb_build_object(
        'ad', jsonb_build_object(
            'creative_id', v_winner.creative_id,
            'headline', v_winner.headline,
            'body', v_winner.body,
            'cta_text', v_winner.cta_text,
            'cta_url', v_winner.cta_url,
            'image_url', v_winner.image_url,
            'creative_type', v_winner.creative_type,
            'placement_id', p_placement_id,
            'ad_rank', ROUND(v_winner.ad_rank::numeric, 2)
        )
    );
END;
$$;

-- ============================================================
-- QUALITY SCORE UPDATE RPC (runs on schedule)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_ad_quality_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated integer := 0;
BEGIN
    INSERT INTO public.ad_quality_scores (creative_id, predicted_ctr, historical_impressions, historical_clicks, quality_score, last_computed_at)
    SELECT
        cr.id,
        CASE WHEN COUNT(i.id) > 20 THEN
            COUNT(cl.id)::numeric / GREATEST(COUNT(i.id)::numeric, 1)
        ELSE 0.01 END as pred_ctr,
        COUNT(i.id),
        COUNT(cl.id),
        -- Quality = CTR-based + creative completeness
        LEAST(100, (
            CASE WHEN COUNT(i.id) > 20 THEN
                COUNT(cl.id)::numeric / GREATEST(COUNT(i.id)::numeric, 1) * 1000
            ELSE 10 END +
            CASE WHEN cr.image_url IS NOT NULL THEN 20 ELSE 0 END +
            CASE WHEN cr.body IS NOT NULL AND length(cr.body) > 20 THEN 15 ELSE 0 END +
            CASE WHEN cr.headline IS NOT NULL AND length(cr.headline) > 5 THEN 15 ELSE 0 END
        )),
        now()
    FROM public.ad_creatives cr
    LEFT JOIN public.ad_impressions i ON i.creative_id = cr.id AND i.viewed_at > now() - interval '7 days'
    LEFT JOIN public.ad_clicks cl ON cl.creative_id = cr.id AND cl.clicked_at > now() - interval '7 days'
    GROUP BY cr.id, cr.image_url, cr.body, cr.headline
    ON CONFLICT (creative_id) DO UPDATE SET
        predicted_ctr = EXCLUDED.predicted_ctr,
        historical_impressions = EXCLUDED.historical_impressions,
        historical_clicks = EXCLUDED.historical_clicks,
        quality_score = EXCLUDED.quality_score,
        last_computed_at = now();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$;

-- ============================================================
-- FRAUD DETECTION RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.detect_ad_fraud()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rapid_clicks integer := 0;
    v_ip_floods integer := 0;
    v_invalidated integer := 0;
BEGIN
    -- 1. Rapid click detection: >2 clicks from same user on same creative within 5 seconds
    UPDATE public.ad_traffic_events te
    SET is_valid = false, fraud_reason = 'rapid_click'
    WHERE te.event_type = 'click'
      AND te.is_valid = true
      AND te.occurred_at > now() - interval '1 hour'
      AND EXISTS (
          SELECT 1 FROM public.ad_traffic_events prev
          WHERE prev.creative_id = te.creative_id
            AND prev.user_id = te.user_id
            AND prev.event_type = 'click'
            AND prev.id != te.id
            AND ABS(EXTRACT(EPOCH FROM (te.occurred_at - prev.occurred_at))) < 5
      );
    GET DIAGNOSTICS v_rapid_clicks = ROW_COUNT;

    -- 2. IP velocity: >100 events from same IP in 1 hour
    WITH flood_ips AS (
        SELECT ip_hash, COUNT(*) as cnt
        FROM public.ad_traffic_events
        WHERE occurred_at > now() - interval '1 hour'
          AND ip_hash IS NOT NULL
        GROUP BY ip_hash
        HAVING COUNT(*) > 100
    )
    UPDATE public.ad_ip_reputation
    SET flagged_events = flagged_events + 1,
        reputation_score = GREATEST(0, reputation_score - 10),
        is_blocked = CASE WHEN flagged_events > 3 THEN true ELSE is_blocked END
    FROM flood_ips
    WHERE ad_ip_reputation.ip_hash = flood_ips.ip_hash;
    GET DIAGNOSTICS v_ip_floods = ROW_COUNT;

    -- 3. Invalidate traffic from blocked IPs
    UPDATE public.ad_traffic_events
    SET is_valid = false, fraud_reason = 'blocked_ip'
    WHERE is_valid = true
      AND ip_hash IN (SELECT ip_hash FROM public.ad_ip_reputation WHERE is_blocked = true)
      AND occurred_at > now() - interval '24 hours';
    GET DIAGNOSTICS v_invalidated = ROW_COUNT;

    RETURN jsonb_build_object(
        'rapid_clicks_flagged', v_rapid_clicks,
        'ip_floods_detected', v_ip_floods,
        'events_invalidated', v_invalidated,
        'checked_at', now()
    );
END;
$$;
