-- ============================================================
-- 57-COUNTRY ADGRID PRICING MATRIX SEED + MARKET MODE + DISTRIBUTION SCHEMA
-- Adds all missing countries to adgrid_pricing_matrix
-- Adds market_mode column to country tracking
-- Adds distribution_posts table for social engine
-- Adds creative_versions table for Gemini factory
-- ============================================================

begin;

-- ============================================================
-- 1. Seed remaining 46 countries into adgrid_pricing_matrix
-- ============================================================

INSERT INTO public.adgrid_pricing_matrix (country_code, currency, base_cpm_usd, base_cpc_usd, multiplier, floor_price_usd, vat_rate, ad_maturity) VALUES
    -- Blue Tier (missing)
    ('IE', 'EUR', 20.00, 4.00, 0.90, 0.70, 0.23, 'medium'),
    ('DK', 'DKK', 20.00, 4.00, 0.90, 0.70, 0.25, 'medium'),
    ('FI', 'EUR', 18.00, 3.50, 0.85, 0.60, 0.24, 'medium'),
    ('BE', 'EUR', 20.00, 4.00, 0.90, 0.70, 0.21, 'medium'),
    ('AT', 'EUR', 20.00, 4.00, 0.90, 0.70, 0.20, 'medium'),
    ('CH', 'CHF', 24.00, 5.00, 1.10, 0.90, 0.077, 'high'),
    ('ES', 'EUR', 18.00, 3.50, 0.80, 0.60, 0.21, 'medium'),
    ('FR', 'EUR', 22.00, 4.50, 0.90, 0.80, 0.20, 'high'),
    ('IT', 'EUR', 18.00, 3.50, 0.80, 0.60, 0.22, 'medium'),
    ('PT', 'EUR', 15.00, 3.00, 0.70, 0.50, 0.23, 'emerging'),
    ('QA', 'QAR', 22.00, 4.50, 1.05, 0.80, 0.0, 'medium'),
    ('MX', 'MXN', 15.00, 3.00, 0.65, 0.40, 0.16, 'emerging'),
    ('NL', 'EUR', 22.00, 4.50, 0.95, 0.80, 0.21, 'high'),
    ('BR', 'BRL', 12.00, 2.50, 0.55, 0.30, 0.18, 'emerging'),
    ('IN', 'INR', 8.00, 1.50, 0.35, 0.15, 0.18, 'emerging'),
    ('ID', 'IDR', 6.00, 1.00, 0.30, 0.10, 0.11, 'emerging'),
    ('TH', 'THB', 8.00, 1.50, 0.35, 0.15, 0.07, 'emerging'),
    -- Silver Tier
    ('PL', 'PLN', 12.00, 2.50, 0.55, 0.35, 0.23, 'emerging'),
    ('CZ', 'CZK', 10.00, 2.00, 0.50, 0.30, 0.21, 'emerging'),
    ('SK', 'EUR', 10.00, 2.00, 0.45, 0.25, 0.20, 'emerging'),
    ('HU', 'HUF', 10.00, 2.00, 0.45, 0.25, 0.27, 'emerging'),
    ('SI', 'EUR', 10.00, 2.00, 0.50, 0.30, 0.22, 'emerging'),
    ('EE', 'EUR', 8.00, 1.50, 0.40, 0.20, 0.22, 'emerging'),
    ('LV', 'EUR', 8.00, 1.50, 0.40, 0.20, 0.21, 'emerging'),
    ('LT', 'EUR', 8.00, 1.50, 0.40, 0.20, 0.21, 'emerging'),
    ('HR', 'EUR', 10.00, 2.00, 0.45, 0.25, 0.25, 'emerging'),
    ('RO', 'RON', 8.00, 1.50, 0.40, 0.20, 0.19, 'emerging'),
    ('BG', 'BGN', 8.00, 1.50, 0.35, 0.20, 0.20, 'emerging'),
    ('GR', 'EUR', 12.00, 2.50, 0.50, 0.30, 0.24, 'emerging'),
    ('TR', 'TRY', 10.00, 2.00, 0.45, 0.20, 0.20, 'emerging'),
    ('KW', 'KWD', 22.00, 4.50, 1.00, 0.80, 0.0, 'medium'),
    ('OM', 'OMR', 18.00, 3.50, 0.85, 0.60, 0.05, 'emerging'),
    ('BH', 'BHD', 20.00, 4.00, 0.90, 0.70, 0.10, 'medium'),
    ('SG', 'SGD', 22.00, 4.50, 1.00, 0.80, 0.09, 'high'),
    ('MY', 'MYR', 12.00, 2.50, 0.55, 0.30, 0.08, 'emerging'),
    ('JP', 'JPY', 25.00, 5.00, 1.15, 0.90, 0.10, 'high'),
    ('KR', 'KRW', 22.00, 4.50, 1.00, 0.80, 0.10, 'high'),
    ('CL', 'CLP', 12.00, 2.50, 0.55, 0.30, 0.19, 'emerging'),
    ('AR', 'ARS', 8.00, 1.50, 0.35, 0.15, 0.21, 'emerging'),
    ('CO', 'COP', 10.00, 2.00, 0.45, 0.25, 0.19, 'emerging'),
    ('PE', 'PEN', 10.00, 2.00, 0.45, 0.25, 0.18, 'emerging'),
    ('VN', 'VND', 6.00, 1.00, 0.30, 0.10, 0.10, 'emerging'),
    ('PH', 'PHP', 6.00, 1.00, 0.30, 0.10, 0.12, 'emerging'),
    -- Slate Tier
    ('UY', 'UYU', 8.00, 1.50, 0.35, 0.15, 0.22, 'emerging'),
    ('PA', 'PAB', 10.00, 2.00, 0.45, 0.25, 0.07, 'emerging'),
    ('CR', 'CRC', 8.00, 1.50, 0.35, 0.15, 0.13, 'emerging')
ON CONFLICT (country_code) DO NOTHING;

-- ============================================================
-- 2. Distribution Posts Table (Social Engine)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.distribution_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_bucket text NOT NULL,
    channel text NOT NULL,
    target_role text NOT NULL DEFAULT 'both',
    country_code text NOT NULL,
    corridor_code text,
    headline text NOT NULL,
    body text NOT NULL,
    cta_text text NOT NULL,
    cta_url text NOT NULL,
    image_url text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    scheduled_at timestamptz NOT NULL,
    published_at timestamptz,
    status text NOT NULL DEFAULT 'draft',
    variant_id text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dist_posts_status ON public.distribution_posts (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dist_posts_country ON public.distribution_posts (country_code, channel);
CREATE INDEX IF NOT EXISTS idx_dist_posts_campaign ON public.distribution_posts (utm_campaign);

ALTER TABLE public.distribution_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY dist_posts_service ON public.distribution_posts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY dist_posts_admin_read ON public.distribution_posts FOR SELECT TO authenticated USING (public.is_admin());

-- ============================================================
-- 3. Social Post Queue (External Channels)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.social_post_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.distribution_posts(id),
    channel text NOT NULL,
    headline text NOT NULL,
    body text NOT NULL,
    cta_url text NOT NULL,
    image_url text,
    country_code text NOT NULL,
    status text NOT NULL DEFAULT 'queued',
    scheduled_at timestamptz,
    published_at timestamptz,
    external_post_id text,
    error text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_queue_status ON public.social_post_queue (status, scheduled_at);

ALTER TABLE public.social_post_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY social_queue_service ON public.social_post_queue FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 4. Creative Versions Table (Gemini Factory)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creative_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id text UNIQUE NOT NULL,
    parent_variant_id text,
    template_slug text,
    country_code text NOT NULL,
    corridor_code text,
    city_slug text,
    surface text NOT NULL,
    target_role text NOT NULL DEFAULT 'operator',
    language text NOT NULL DEFAULT 'en',
    headline text NOT NULL,
    description text NOT NULL,
    cta_text text NOT NULL,
    cta_url text NOT NULL,
    -- Scorecard (10 dimensions)
    score_clarity numeric DEFAULT 0,
    score_stop_power numeric DEFAULT 0,
    score_trust numeric DEFAULT 0,
    score_niche_fit numeric DEFAULT 0,
    score_cta_strength numeric DEFAULT 0,
    score_compliance numeric DEFAULT 0,
    score_mobile_readability numeric DEFAULT 0,
    score_visual_hierarchy numeric DEFAULT 0,
    score_expected_ctr numeric DEFAULT 0,
    score_conversion_fit numeric DEFAULT 0,
    score_composite numeric DEFAULT 0,
    -- Generation metadata
    generation_model text NOT NULL DEFAULT 'template_fallback',
    generation_params jsonb DEFAULT '{}',
    -- Lifecycle
    status text NOT NULL DEFAULT 'active',  -- active, promoted, retired, killed
    promoted_at timestamptz,
    retired_at timestamptz,
    -- Performance (denormalized for fast reads)
    impressions int DEFAULT 0,
    clicks int DEFAULT 0,
    conversions int DEFAULT 0,
    ctr numeric DEFAULT 0,
    cvr numeric DEFAULT 0,
    revenue_usd numeric DEFAULT 0,
    -- Meta
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creative_ver_country ON public.creative_versions (country_code, status);
CREATE INDEX IF NOT EXISTS idx_creative_ver_parent ON public.creative_versions (parent_variant_id);
CREATE INDEX IF NOT EXISTS idx_creative_ver_surface ON public.creative_versions (surface, status);
CREATE INDEX IF NOT EXISTS idx_creative_ver_variant ON public.creative_versions (variant_id);

ALTER TABLE public.creative_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY creative_ver_service ON public.creative_versions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY creative_ver_admin_read ON public.creative_versions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY creative_ver_public_read ON public.creative_versions FOR SELECT USING (status = 'active' OR status = 'promoted');

-- ============================================================
-- 5. Notifications Table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    type text NOT NULL DEFAULT 'general',
    title text NOT NULL,
    body text,
    action_url text,
    metadata jsonb DEFAULT '{}',
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notif_own_read ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_own_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY notif_service_write ON public.notifications FOR INSERT USING (auth.role() = 'service_role');

commit;
