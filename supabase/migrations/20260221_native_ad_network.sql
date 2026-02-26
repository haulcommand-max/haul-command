-- Migration: 20260221_native_ad_network.sql
-- Wave 4: Mantis-Style Native Ad Network
-- Full ad serving pipeline: campaigns, creatives, placements, impressions, clicks

-- 1. Ad Campaigns
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id uuid NOT NULL REFERENCES auth.users(id),
    campaign_name text NOT NULL,
    budget_cents integer NOT NULL DEFAULT 0,
    daily_cap_cents integer NOT NULL DEFAULT 0,
    targeting jsonb DEFAULT '{}'::jsonb,
    -- targeting: { roles: ["broker","escort"], jurisdictions: ["US-FL"], corridors: ["FL-GA"], hours: [8,17] }
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','archived')),
    start_date date,
    end_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON public.ad_campaigns(advertiser_id);

-- 2. Ad Creatives
CREATE TABLE IF NOT EXISTS public.ad_creatives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    headline text NOT NULL,
    body text,
    cta_text text DEFAULT 'Learn More',
    cta_url text NOT NULL,
    image_url text,
    creative_type text NOT NULL DEFAULT 'native' CHECK (creative_type IN ('native','banner','inline','sidebar')),
    status text DEFAULT 'active' CHECK (status IN ('active','paused','rejected')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON public.ad_creatives(campaign_id);

-- 3. Ad Placements (where ads can appear)
CREATE TABLE IF NOT EXISTS public.ad_placements (
    id text PRIMARY KEY, -- e.g. 'directory_listing', 'load_board_inline'
    surface text NOT NULL, -- display area
    position text DEFAULT 'inline',
    format text DEFAULT 'native' CHECK (format IN ('native','banner','sidebar')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Seed placements
INSERT INTO public.ad_placements (id, surface, position, format) VALUES
    ('directory_listing', 'directory', 'inline', 'native'),
    ('load_board_inline', 'load_board', 'inline', 'native'),
    ('chambers_sidebar', 'chambers', 'sidebar', 'sidebar'),
    ('map_drawer', 'map', 'inline', 'native'),
    ('dashboard_banner', 'dashboard', 'top', 'banner')
ON CONFLICT (id) DO NOTHING;

-- 4. Ad Impressions (viewability tracking)
CREATE TABLE IF NOT EXISTS public.ad_impressions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    placement_id text NOT NULL REFERENCES public.ad_placements(id),
    user_id uuid,
    user_role text,
    jurisdiction_code text,
    viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impressions_creative ON public.ad_impressions(creative_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_impressions_placement ON public.ad_impressions(placement_id, viewed_at);
-- Partition-friendly: daily queries
CREATE INDEX IF NOT EXISTS idx_impressions_daily ON public.ad_impressions(viewed_at);

-- 5. Ad Clicks
CREATE TABLE IF NOT EXISTS public.ad_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    placement_id text NOT NULL REFERENCES public.ad_placements(id),
    user_id uuid,
    clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clicks_creative ON public.ad_clicks(creative_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_dedup ON public.ad_clicks(creative_id, user_id, clicked_at);

-- 6. Daily Spend View
CREATE OR REPLACE VIEW public.ad_daily_spend AS
SELECT
    c.campaign_id,
    DATE(i.viewed_at) as spend_date,
    COUNT(DISTINCT i.id) as impressions,
    COUNT(DISTINCT cl.id) as clicks,
    CASE WHEN COUNT(DISTINCT i.id) > 0 THEN
        ROUND(COUNT(DISTINCT cl.id)::numeric / COUNT(DISTINCT i.id)::numeric * 100, 2)
    ELSE 0 END as ctr_pct,
    -- CPM billing: $X per 1000 impressions
    ROUND(COUNT(DISTINCT i.id)::numeric / 1000 * 5, 2) as estimated_spend_usd  -- $5 CPM default
FROM public.ad_creatives c
LEFT JOIN public.ad_impressions i ON i.creative_id = c.id
LEFT JOIN public.ad_clicks cl ON cl.creative_id = c.id AND DATE(cl.clicked_at) = DATE(i.viewed_at)
GROUP BY c.campaign_id, DATE(i.viewed_at);

-- 7. RLS
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Advertisers manage own campaigns
CREATE POLICY "advertiser_own_campaigns" ON public.ad_campaigns FOR ALL USING (advertiser_id = auth.uid());
CREATE POLICY "advertiser_own_creatives" ON public.ad_creatives FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ad_campaigns WHERE id = ad_creatives.campaign_id AND advertiser_id = auth.uid())
);

-- Public read for serving
CREATE POLICY "public_read_placements" ON public.ad_placements FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "service_role_campaigns" ON public.ad_campaigns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_creatives" ON public.ad_creatives FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_impressions" ON public.ad_impressions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_clicks" ON public.ad_clicks FOR ALL USING (auth.role() = 'service_role');

-- 8. RPC: Serve Best Ad for a Surface
CREATE OR REPLACE FUNCTION public.serve_ad(
    p_placement_id text,
    p_user_role text DEFAULT NULL,
    p_jurisdiction text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_creative record;
    v_daily_spend numeric;
BEGIN
    -- Find eligible creative: active campaign, matching placement format, under daily cap
    SELECT cr.*, ac.daily_cap_cents, ac.targeting
    INTO v_creative
    FROM public.ad_creatives cr
    JOIN public.ad_campaigns ac ON ac.id = cr.campaign_id
    JOIN public.ad_placements ap ON ap.format = cr.creative_type AND ap.id = p_placement_id
    WHERE ac.status = 'active'
      AND cr.status = 'active'
      AND (ac.start_date IS NULL OR ac.start_date <= CURRENT_DATE)
      AND (ac.end_date IS NULL OR ac.end_date >= CURRENT_DATE)
      -- Role targeting
      AND (ac.targeting->>'roles' IS NULL OR ac.targeting->'roles' ? COALESCE(p_user_role, 'unknown'))
      -- Jurisdiction targeting
      AND (ac.targeting->>'jurisdictions' IS NULL OR ac.targeting->'jurisdictions' ? COALESCE(p_jurisdiction, ''))
    ORDER BY random()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ad', NULL, 'message', 'No eligible ads');
    END IF;

    -- Check daily spend cap
    SELECT COALESCE(SUM(1), 0) INTO v_daily_spend
    FROM public.ad_impressions
    WHERE creative_id = v_creative.id AND viewed_at::date = CURRENT_DATE;

    -- If over daily cap (rough estimate: impressions * $5 CPM), skip
    IF v_daily_spend * 0.5 > v_creative.daily_cap_cents THEN
        RETURN jsonb_build_object('ad', NULL, 'message', 'Campaign over daily cap');
    END IF;

    -- Record impression
    INSERT INTO public.ad_impressions (creative_id, placement_id, user_id, user_role, jurisdiction_code)
    VALUES (v_creative.id, p_placement_id, auth.uid(), p_user_role, p_jurisdiction);

    RETURN jsonb_build_object(
        'ad', jsonb_build_object(
            'creative_id', v_creative.id,
            'headline', v_creative.headline,
            'body', v_creative.body,
            'cta_text', v_creative.cta_text,
            'cta_url', v_creative.cta_url,
            'image_url', v_creative.image_url,
            'creative_type', v_creative.creative_type,
            'placement_id', p_placement_id
        )
    );
END;
$$;
