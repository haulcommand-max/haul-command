-- Migration: 20260221_premium_page_auctions.sql
-- Premium Page Auction System — SEO-safe rentable pages with time-boxed bidding

-- ============================================================
-- 1. PREMIUM PAGES (inventory objects)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.premium_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    page_type text NOT NULL CHECK (page_type IN ('corridor','city_service','state_hub','resource_hub','near_me_cluster')),
    geo_scope jsonb NOT NULL DEFAULT '{}',
    corridor_id text,
    categories text[] DEFAULT '{}',
    intent_score numeric DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
    seo_score numeric DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
    eligibility_status text NOT NULL DEFAULT 'draft' CHECK (eligibility_status IN ('draft','eligible','paused','retired')),
    eligibility_reasons text[] DEFAULT '{}',
    floor_price_cents integer NOT NULL DEFAULT 0,
    current_holder_advertiser_id uuid,
    lock_expires_at timestamptz,
    next_auction_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. CONTENT BLOCKS (SEO guardrail: must be substantial + unique)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.premium_page_content_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    premium_page_id uuid NOT NULL REFERENCES public.premium_pages(id) ON DELETE CASCADE,
    block_type text NOT NULL CHECK (block_type IN ('guide','rules','local_data','faq','tools','links')),
    heading text NOT NULL,
    body_md text NOT NULL,
    unique_hash text NOT NULL,
    word_count integer NOT NULL DEFAULT 0,
    sources jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(premium_page_id, block_type, unique_hash)
);

-- ============================================================
-- 3. PROVIDER LIST (SEO: page shows >= 3 providers always)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.premium_page_provider_list (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    premium_page_id uuid NOT NULL REFERENCES public.premium_pages(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL,
    rank_hint integer NOT NULL DEFAULT 1000,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(premium_page_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_prov_list_page ON public.premium_page_provider_list(premium_page_id, rank_hint);

-- ============================================================
-- 4. AUCTION CYCLES (30-day lock, 12-18h randomized duration)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_auction_cycles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    premium_page_id uuid NOT NULL REFERENCES public.premium_pages(id) ON DELETE CASCADE,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    randomized_duration_hours integer NOT NULL,
    floor_price_cents integer NOT NULL,
    status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','closed','canceled')),
    winner_bid_id uuid,
    winning_advertiser_id uuid,
    winning_bid_cents integer,
    lock_starts_at timestamptz,
    lock_ends_at timestamptz,
    soft_close_extensions integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auction_page_status ON public.page_auction_cycles(premium_page_id, status);
CREATE INDEX IF NOT EXISTS idx_auction_starts ON public.page_auction_cycles(starts_at);
CREATE INDEX IF NOT EXISTS idx_auction_ends ON public.page_auction_cycles(ends_at);

-- ============================================================
-- 5. BIDS (with proxy bidding + anti-sniping)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_bids (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_cycle_id uuid NOT NULL REFERENCES public.page_auction_cycles(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL,
    bid_cents integer NOT NULL,
    max_proxy_bid_cents integer,
    is_proxy boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    ip_hash text,
    ua_hash text
);

CREATE INDEX IF NOT EXISTS idx_bids_auction_amount ON public.page_bids(auction_cycle_id, bid_cents DESC);
CREATE INDEX IF NOT EXISTS idx_bids_advertiser ON public.page_bids(advertiser_id, created_at);

-- ============================================================
-- 6. WATCHERS (notification subscriptions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_watchers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    premium_page_id uuid NOT NULL REFERENCES public.premium_pages(id) ON DELETE CASCADE,
    advertiser_id uuid NOT NULL,
    notify_email boolean NOT NULL DEFAULT true,
    notify_push boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_notified_at timestamptz,
    UNIQUE(premium_page_id, advertiser_id)
);

-- ============================================================
-- 7. NOTIFICATION OUTBOX (reliable queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.page_notifications_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel text NOT NULL CHECK (channel IN ('email','push','inapp')),
    to_ref text NOT NULL,
    template text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}',
    scheduled_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
    fail_reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notify_outbox_status ON public.page_notifications_outbox(status, scheduled_at);

-- ============================================================
-- 8. PERFORMANCE DAILY (dashboard + floor pricing inputs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.premium_page_performance_daily (
    premium_page_id uuid NOT NULL REFERENCES public.premium_pages(id) ON DELETE CASCADE,
    date date NOT NULL,
    impressions integer NOT NULL DEFAULT 0,
    clicks integer NOT NULL DEFAULT 0,
    conversions integer NOT NULL DEFAULT 0,
    est_value_cents integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (premium_page_id, date)
);

-- ============================================================
-- 9. AUDIT LOG (immutable)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.premium_page_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL CHECK (entity_type IN ('page','auction','bid','lock','notify')),
    entity_id uuid NOT NULL,
    action text NOT NULL,
    actor_advertiser_id uuid,
    meta jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.premium_page_audit_log(entity_type, entity_id, created_at DESC);

-- ============================================================
-- MARKET VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.v_premium_page_market AS
SELECT
    p.*,
    (SELECT COALESCE(SUM(impressions), 0) FROM public.premium_page_performance_daily d
     WHERE d.premium_page_id = p.id AND d.date >= CURRENT_DATE - 30) as impressions_30d,
    (SELECT COALESCE(SUM(clicks), 0) FROM public.premium_page_performance_daily d
     WHERE d.premium_page_id = p.id AND d.date >= CURRENT_DATE - 30) as clicks_30d
FROM public.premium_pages p;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.premium_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_page_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_page_provider_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_auction_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_notifications_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_page_performance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_page_audit_log ENABLE ROW LEVEL SECURITY;

-- Public read for eligible pages
CREATE POLICY "public_read_pages" ON public.premium_pages FOR SELECT USING (eligibility_status IN ('eligible','paused'));
CREATE POLICY "service_write_pages" ON public.premium_pages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_content" ON public.premium_page_content_blocks FOR SELECT USING (true);
CREATE POLICY "service_write_content" ON public.premium_page_content_blocks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_providers" ON public.premium_page_provider_list FOR SELECT USING (true);
CREATE POLICY "service_write_providers" ON public.premium_page_provider_list FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "public_read_auctions" ON public.page_auction_cycles FOR SELECT USING (true);
CREATE POLICY "service_write_auctions" ON public.page_auction_cycles FOR ALL USING (auth.role() = 'service_role');
-- Bids: insert only via RPC, read own
CREATE POLICY "service_write_bids" ON public.page_bids FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_bids_read" ON public.page_bids FOR SELECT USING (advertiser_id = auth.uid());
-- Watchers: own management
CREATE POLICY "own_watchers" ON public.page_watchers FOR ALL USING (advertiser_id = auth.uid());
CREATE POLICY "service_watchers" ON public.page_watchers FOR ALL USING (auth.role() = 'service_role');
-- Service only
CREATE POLICY "service_only_outbox" ON public.page_notifications_outbox FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_write_perf" ON public.premium_page_performance_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_write_audit" ON public.premium_page_audit_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "own_audit_read" ON public.premium_page_audit_log FOR SELECT USING (actor_advertiser_id = auth.uid());

-- ============================================================
-- PLACE BID RPC (with proxy + soft-close + anti-sniping)
-- ============================================================
CREATE OR REPLACE FUNCTION public.premium_page_place_bid(
    p_auction_cycle_id uuid,
    p_advertiser_id uuid,
    p_bid_cents integer,
    p_max_proxy_bid_cents integer DEFAULT NULL,
    p_ip_hash text DEFAULT NULL,
    p_ua_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction record;
    v_current_high integer;
    v_current_leader uuid;
    v_min_next integer;
    v_increment integer;
    v_new_ends_at timestamptz;
    v_proxy_needed boolean := false;
    v_proxy_bid_id uuid;
BEGIN
    -- Get auction
    SELECT * INTO v_auction FROM public.page_auction_cycles WHERE id = p_auction_cycle_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('status', 'rejected', 'reason', 'auction_not_found'); END IF;
    IF v_auction.status != 'live' THEN RETURN jsonb_build_object('status', 'rejected', 'reason', 'auction_not_live'); END IF;
    IF now() > v_auction.ends_at THEN RETURN jsonb_build_object('status', 'rejected', 'reason', 'auction_ended'); END IF;

    -- Get current high bid
    SELECT bid_cents, advertiser_id INTO v_current_high, v_current_leader
    FROM public.page_bids WHERE auction_cycle_id = p_auction_cycle_id
    ORDER BY bid_cents DESC, created_at ASC LIMIT 1;

    v_current_high := COALESCE(v_current_high, 0);

    -- Compute minimum next bid (1% increment, min 500 cents / $5)
    v_increment := GREATEST(500, CEIL(v_current_high * 0.01));
    v_min_next := GREATEST(v_auction.floor_price_cents, v_current_high + v_increment);

    IF p_bid_cents < v_min_next THEN
        RETURN jsonb_build_object('status', 'rejected', 'reason', 'bid_too_low', 'min_next_bid_cents', v_min_next);
    END IF;

    -- Insert bid
    INSERT INTO public.page_bids (auction_cycle_id, advertiser_id, bid_cents, max_proxy_bid_cents, is_proxy, ip_hash, ua_hash)
    VALUES (p_auction_cycle_id, p_advertiser_id, p_bid_cents, p_max_proxy_bid_cents, false, p_ip_hash, p_ua_hash);

    -- Audit
    INSERT INTO public.premium_page_audit_log (entity_type, entity_id, action, actor_advertiser_id, meta)
    VALUES ('bid', p_auction_cycle_id, 'bid_placed', p_advertiser_id, jsonb_build_object('bid_cents', p_bid_cents, 'proxy_max', p_max_proxy_bid_cents));

    -- Auto-proxy: check if previous leader had a proxy that can respond
    IF v_current_leader IS NOT NULL AND v_current_leader != p_advertiser_id THEN
        DECLARE
            v_prev_proxy integer;
        BEGIN
            SELECT max_proxy_bid_cents INTO v_prev_proxy
            FROM public.page_bids WHERE auction_cycle_id = p_auction_cycle_id AND advertiser_id = v_current_leader AND max_proxy_bid_cents IS NOT NULL
            ORDER BY max_proxy_bid_cents DESC LIMIT 1;

            IF v_prev_proxy IS NOT NULL AND v_prev_proxy > p_bid_cents THEN
                -- Auto-increment to beat new bid by increment
                v_increment := GREATEST(500, CEIL(p_bid_cents * 0.01));
                INSERT INTO public.page_bids (auction_cycle_id, advertiser_id, bid_cents, max_proxy_bid_cents, is_proxy)
                VALUES (p_auction_cycle_id, v_current_leader, LEAST(v_prev_proxy, p_bid_cents + v_increment), v_prev_proxy, true)
                RETURNING id INTO v_proxy_bid_id;

                INSERT INTO public.premium_page_audit_log (entity_type, entity_id, action, actor_advertiser_id, meta)
                VALUES ('bid', p_auction_cycle_id, 'auto_proxy_bid', v_current_leader, jsonb_build_object('proxy_bid_cents', LEAST(v_prev_proxy, p_bid_cents + v_increment)));

                v_proxy_needed := true;
            END IF;
        END;
    END IF;

    -- Soft-close anti-sniping: extend by 60s if bid in last 60s (cap +15 min total)
    IF now() >= v_auction.ends_at - interval '60 seconds' AND v_auction.soft_close_extensions < 15 THEN
        v_new_ends_at := v_auction.ends_at + interval '60 seconds';
        UPDATE public.page_auction_cycles
        SET ends_at = v_new_ends_at, soft_close_extensions = soft_close_extensions + 1
        WHERE id = p_auction_cycle_id;

        INSERT INTO public.premium_page_audit_log (entity_type, entity_id, action, meta)
        VALUES ('auction', p_auction_cycle_id, 'soft_close_extended', jsonb_build_object('new_ends_at', v_new_ends_at, 'extensions', v_auction.soft_close_extensions + 1));
    END IF;

    -- Get final state
    SELECT bid_cents, advertiser_id INTO v_current_high, v_current_leader
    FROM public.page_bids WHERE auction_cycle_id = p_auction_cycle_id
    ORDER BY bid_cents DESC, created_at ASC LIMIT 1;

    RETURN jsonb_build_object(
        'status', 'accepted',
        'current_high_bid_cents', v_current_high,
        'current_leader_is_you', v_current_leader = p_advertiser_id,
        'auction_ends_at', COALESCE(v_new_ends_at, v_auction.ends_at),
        'proxy_responded', v_proxy_needed
    );
END;
$$;

-- ============================================================
-- CLOSE AUCTION RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.premium_page_close_auction(p_auction_cycle_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auction record;
    v_winner record;
    v_lock_ends timestamptz;
    v_next_auction_start timestamptz;
    v_next_duration integer;
BEGIN
    SELECT * INTO v_auction FROM public.page_auction_cycles WHERE id = p_auction_cycle_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
    IF v_auction.status = 'closed' THEN RETURN jsonb_build_object('success', true, 'already_closed', true); END IF;

    -- Get winner (highest bid, earliest timestamp tiebreak)
    SELECT * INTO v_winner FROM public.page_bids
    WHERE auction_cycle_id = p_auction_cycle_id
    ORDER BY bid_cents DESC, created_at ASC LIMIT 1;

    v_lock_ends := now() + interval '30 days';

    IF FOUND THEN
        -- Update auction
        UPDATE public.page_auction_cycles SET
            status = 'closed', winner_bid_id = v_winner.id, winning_advertiser_id = v_winner.advertiser_id,
            winning_bid_cents = v_winner.bid_cents, lock_starts_at = now(), lock_ends_at = v_lock_ends
        WHERE id = p_auction_cycle_id;

        -- Update page
        UPDATE public.premium_pages SET
            current_holder_advertiser_id = v_winner.advertiser_id,
            lock_expires_at = v_lock_ends, updated_at = now()
        WHERE id = v_auction.premium_page_id;

        -- Audit
        INSERT INTO public.premium_page_audit_log (entity_type, entity_id, action, actor_advertiser_id, meta)
        VALUES ('auction', p_auction_cycle_id, 'auction_closed_winner', v_winner.advertiser_id,
            jsonb_build_object('winning_bid', v_winner.bid_cents, 'lock_ends', v_lock_ends));
    ELSE
        -- No bids: close without winner
        UPDATE public.page_auction_cycles SET status = 'closed' WHERE id = p_auction_cycle_id;
        v_lock_ends := NULL;
    END IF;

    -- Schedule next auction (T-72h with randomized 12-18h duration)
    v_next_duration := 12 + FLOOR(random() * 7)::integer;
    v_next_auction_start := COALESCE(v_lock_ends, now() + interval '7 days') - interval '72 hours';

    INSERT INTO public.page_auction_cycles (premium_page_id, starts_at, ends_at, randomized_duration_hours, floor_price_cents, status)
    VALUES (v_auction.premium_page_id, v_next_auction_start, v_next_auction_start + (v_next_duration || ' hours')::interval,
            v_next_duration, v_auction.floor_price_cents, 'scheduled');

    UPDATE public.premium_pages SET next_auction_at = v_next_auction_start WHERE id = v_auction.premium_page_id;

    RETURN jsonb_build_object(
        'success', true,
        'winner_advertiser_id', v_winner.advertiser_id,
        'winning_bid_cents', v_winner.bid_cents,
        'lock_ends_at', v_lock_ends,
        'next_auction_at', v_next_auction_start
    );
END;
$$;

-- ============================================================
-- SCHEDULE NEXT AUCTION RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.premium_page_schedule_next_auction(p_premium_page_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_page record;
    v_duration integer;
    v_start timestamptz;
    v_cycle_id uuid;
BEGIN
    SELECT * INTO v_page FROM public.premium_pages WHERE id = p_premium_page_id;
    IF NOT FOUND THEN RETURN NULL; END IF;

    v_duration := 12 + FLOOR(random() * 7)::integer;

    IF v_page.lock_expires_at IS NOT NULL AND v_page.lock_expires_at > now() THEN
        v_start := v_page.lock_expires_at - interval '72 hours';
    ELSE
        v_start := now() + (1 + FLOOR(random() * 5))::integer * interval '1 hour';
    END IF;

    INSERT INTO public.page_auction_cycles (premium_page_id, starts_at, ends_at, randomized_duration_hours, floor_price_cents, status)
    VALUES (p_premium_page_id, v_start, v_start + (v_duration || ' hours')::interval, v_duration, v_page.floor_price_cents, 'scheduled')
    RETURNING id INTO v_cycle_id;

    UPDATE public.premium_pages SET next_auction_at = v_start, updated_at = now() WHERE id = p_premium_page_id;
    RETURN v_cycle_id;
END;
$$;

-- ============================================================
-- COMPUTE FLOOR PRICE RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.premium_page_compute_floor(p_premium_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_page record;
    v_impressions integer;
    v_clicks integer;
    v_ctr numeric;
    v_lead_value numeric := 10.00;
    v_margin numeric := 0.40;
    v_corridor_mult numeric := 1.0;
    v_floor integer;
BEGIN
    SELECT * INTO v_page FROM public.premium_pages WHERE id = p_premium_page_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    SELECT COALESCE(SUM(impressions), 0), COALESCE(SUM(clicks), 0)
    INTO v_impressions, v_clicks
    FROM public.premium_page_performance_daily
    WHERE premium_page_id = p_premium_page_id AND date >= CURRENT_DATE - 30;

    v_ctr := CASE WHEN v_impressions > 0 THEN v_clicks::numeric / v_impressions ELSE 0.02 END;

    -- Corridor multiplier from scarcity
    IF v_page.corridor_id IS NOT NULL THEN
        SELECT CASE WHEN scarcity_tier = 'critical_shortage' THEN 1.5
                    WHEN scarcity_tier = 'tightening' THEN 1.2
                    WHEN scarcity_tier = 'balanced' THEN 1.0
                    ELSE 0.8 END
        INTO v_corridor_mult
        FROM public.hc_scarcity_index WHERE corridor_id = v_page.corridor_id;
        v_corridor_mult := COALESCE(v_corridor_mult, 1.0);
    END IF;

    -- Floor = (monthly_impressions * expected_ctr * lead_value * margin) * corridor_mult
    v_floor := GREATEST(2500, CEIL(v_impressions * v_ctr * v_lead_value * v_margin * v_corridor_mult * 100));

    UPDATE public.premium_pages SET floor_price_cents = v_floor, updated_at = now() WHERE id = p_premium_page_id;
    RETURN v_floor;
END;
$$;
