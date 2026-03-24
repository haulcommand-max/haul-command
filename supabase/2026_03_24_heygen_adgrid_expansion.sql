-- ============================================================================
-- HEYGEN VIDEO PIPELINE + ADGRID SELF-SERVE EXPANSION
-- Migration: 2026_03_24_heygen_adgrid_expansion.sql
-- Anti-downgrade: additive only
-- ============================================================================

-- ============================================================================
-- 1. UPGRADE video_jobs TABLE (Elai → HeyGen upgrade, backward-compatible)
-- ============================================================================

-- Rename elai column to provider_video_id (covers both Elai and HeyGen)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_jobs' AND column_name='elai_video_id') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='video_jobs' AND column_name='provider_video_id') THEN
    ALTER TABLE video_jobs RENAME COLUMN elai_video_id TO provider_video_id;
  END IF;
END $$;

-- Add HeyGen-specific columns
ALTER TABLE video_jobs
  ADD COLUMN IF NOT EXISTS provider            TEXT DEFAULT 'elai' CHECK (provider IN ('elai','heygen')),
  ADD COLUMN IF NOT EXISTS heygen_status       TEXT DEFAULT 'not_started'
                                               CHECK (heygen_status IN ('not_started','rendering','complete','failed')),
  ADD COLUMN IF NOT EXISTS youtube_video_id    TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url         TEXT,
  ADD COLUMN IF NOT EXISTS admin_approved      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_rejected      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS thumbnail_url       TEXT,
  ADD COLUMN IF NOT EXISTS duration_secs       INTEGER,
  ADD COLUMN IF NOT EXISTS script_text         TEXT,
  ADD COLUMN IF NOT EXISTS topic_slug          TEXT;

CREATE INDEX IF NOT EXISTS idx_video_jobs_provider     ON video_jobs(provider);
CREATE INDEX IF NOT EXISTS idx_video_jobs_hy_status    ON video_jobs(heygen_status);
CREATE INDEX IF NOT EXISTS idx_video_jobs_approved     ON video_jobs(admin_approved);
CREATE INDEX IF NOT EXISTS idx_video_jobs_language     ON video_jobs(language);

-- ============================================================================
-- 2. UPGRADE blog_posts / content_queue TABLE for HeyGen multilingual URLs
-- ============================================================================

-- Add HeyGen-specific video columns to blog_posts (or content_queue — whichever exists)
DO $$
BEGIN
  -- blog_posts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='blog_posts') THEN
    ALTER TABLE blog_posts
      ADD COLUMN IF NOT EXISTS heygen_video_id   TEXT,
      ADD COLUMN IF NOT EXISTS video_url_es       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_pt       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_de       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_fr       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_ar       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_nl       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_ja       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_ko       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_hi       TEXT,
      ADD COLUMN IF NOT EXISTS youtube_url_en     TEXT,
      ADD COLUMN IF NOT EXISTS youtube_url_es     TEXT,
      ADD COLUMN IF NOT EXISTS video_admin_approved BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS video_approved_at   TIMESTAMPTZ;
  END IF;
  -- content_queue
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='content_queue') THEN
    ALTER TABLE content_queue
      ADD COLUMN IF NOT EXISTS heygen_video_id   TEXT,
      ADD COLUMN IF NOT EXISTS heygen_status     TEXT DEFAULT 'not_started',
      ADD COLUMN IF NOT EXISTS video_url_en       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_es       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_pt       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_de       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_fr       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_ar       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_nl       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_ja       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_ko       TEXT,
      ADD COLUMN IF NOT EXISTS video_url_hi       TEXT,
      ADD COLUMN IF NOT EXISTS youtube_url_en     TEXT,
      ADD COLUMN IF NOT EXISTS youtube_url_es     TEXT,
      ADD COLUMN IF NOT EXISTS admin_approved     BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS admin_approved_at  TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 3. ADGRID SELF-SERVE ADVERTISER SCHEMA
-- ============================================================================

-- Advertiser accounts (external companies buying ad space)
CREATE TABLE IF NOT EXISTS ad_advertisers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  contact_email   TEXT NOT NULL,
  contact_phone   TEXT,
  billing_email   TEXT,
  stripe_customer_id TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  total_spend     NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_advertisers_user   ON ad_advertisers(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_advertisers_status ON ad_advertisers(status);

-- Ad campaigns (created by self-serve advertisers)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id   UUID NOT NULL REFERENCES ad_advertisers(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  status          TEXT DEFAULT 'draft'
                  CHECK (status IN ('draft','pending_review','active','paused','completed','rejected')),
  -- Targeting
  plan_type       TEXT DEFAULT 'run_of_network'
                  CHECK (plan_type IN ('run_of_network','corridor_targeted','corridor_exclusive')),
  target_corridors TEXT[] DEFAULT '{}',
  target_states    TEXT[] DEFAULT '{}',
  target_operator_types TEXT[] DEFAULT '{}',
  target_load_types TEXT[] DEFAULT '{}',
  target_audience_segment TEXT CHECK (target_audience_segment IN ('all','fuel_card','insurance','equipment','hotel','oilfield','av_ready')),
  -- Placement
  placements      TEXT[] DEFAULT '{}'  -- load_board, directory, corridor_page, app_push, sidebar
                  CHECK (placements <@ ARRAY['load_board','directory','corridor_page','app_push','sidebar','training_page','av_regs_page']::text[]),
  -- Budget
  monthly_budget  NUMERIC(10,2) NOT NULL DEFAULT 0,
  daily_budget    NUMERIC(10,2),
  total_budget    NUMERIC(10,2),
  spend_to_date   NUMERIC(10,2) DEFAULT 0,
  -- Schedule
  start_date      DATE,
  end_date        DATE,
  -- Billing
  plan_monthly_fee NUMERIC(10,2),
  stripe_subscription_id TEXT,
  billing_cycle_day INTEGER DEFAULT 1,
  -- Metadata
  admin_notes     TEXT,
  rejection_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status     ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_plan       ON ad_campaigns(plan_type);

-- Ad creatives (the actual ad content)
CREATE TABLE IF NOT EXISTS ad_creatives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creative_type   TEXT NOT NULL CHECK (creative_type IN ('banner','text_link','push_notification','video_pre_roll','native_card')),
  headline        TEXT NOT NULL,
  body_copy       TEXT,
  cta_text        TEXT DEFAULT 'Learn More',
  cta_url         TEXT NOT NULL,
  image_url       TEXT,
  -- AI-generated creative fields
  ai_generated    BOOLEAN DEFAULT FALSE,
  ai_prompt       TEXT,
  -- Status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','archived')),
  rejection_reason TEXT,
  -- Performance
  impressions     BIGINT DEFAULT 0,
  clicks          BIGINT DEFAULT 0,
  ctr             NUMERIC(6,4) DEFAULT 0,   -- click-through rate
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_creatives_campaign ON ad_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_status   ON ad_creatives(status);

-- Ad audience segments (named targeting groups)
CREATE TABLE IF NOT EXISTS ad_audience_segments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  operator_count_estimate INTEGER,
  targeting_logic JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ad_audience_segments (code, name, description, operator_count_estimate, targeting_logic) VALUES
('all',         'All Operators',             'Every operator on Haul Command — 7,700+ nationally', 7745,
 '{"no_filter": true}'),
('fuel_card',   'Fuel Card Seekers',         'All operators — fuel cards shown to everyone', 7745,
 '{"no_filter": true}'),
('insurance',   'Unverified Operators',      'Operators missing insurance verification — hot leads for insurance brokers', 3200,
 '{"verification_incomplete": true}'),
('equipment',   'New Operators (0-12 mo)',   'Recently joined operators likely buying equipment', 1100,
 '{"days_since_join": {"lte": 365}}'),
('hotel',       'Multi-Day Corridor Ops',   'Operators on corridors > 300 miles who need lodging', 2400,
 '{"corridor_length_miles": {"gte": 300}}'),
('oilfield',    'Oilfield Specialists',      'Operators with oilfield specialization flag', 890,
 '{"oilfield_specialist": true}'),
('av_ready',    'AV-Ready Certified',        'Operators with Tier 2+ AV-Ready certification', 340,
 '{"av_cert_tier": {"gte": 2}}')
ON CONFLICT (code) DO NOTHING;

-- Pricing plans for self-serve
CREATE TABLE IF NOT EXISTS ad_pricing_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  monthly_price   NUMERIC(10,2) NOT NULL,
  features        JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ad_pricing_plans (code, name, description, monthly_price, sort_order, features) VALUES
('ron',        'Run of Network',           'Show your ad across all Haul Command placements', 19, 10,
 '{"placements": ["load_board","directory","sidebar"], "targeting": "network_wide", "impressions_est": "50K-150K/month"}'),
('corridor',   'Corridor Targeted',        'Target operators on specific corridors and states', 59, 20,
 '{"placements": ["load_board","directory","corridor_page","sidebar"], "targeting": "corridor+state", "impressions_est": "10K-40K/month"}'),
('exclusive',  'Exclusive Corridor',       'Own a corridor — your logo only, no competitors', 149, 30,
 '{"placements": ["all"], "targeting": "exclusive_corridor", "exclusivity": true, "impressions_est": "5K-15K/month exclusive"}'),
('push',       '+ App Push Add-On',        'Add push notification delivery to any plan', 29, 40,
 '{"placements": ["app_push"], "delivery": "push_notification", "max_sends_monthly": 2}')
ON CONFLICT (code) DO NOTHING;

-- Ad events (impressions + clicks — extends existing hc_ad_events if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='hc_ad_events') THEN
    CREATE TABLE hc_ad_events (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      creative_id     UUID REFERENCES ad_creatives(id) ON DELETE CASCADE,
      campaign_id     UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
      event_type      TEXT NOT NULL CHECK (event_type IN ('impression','click','push_sent','push_opened')),
      surface         TEXT,
      corridor_code   TEXT,
      country_code    TEXT DEFAULT 'US',
      state_code      TEXT,
      operator_id     UUID,
      session_id      TEXT,
      ip_hash         TEXT,
      revenue_credit  NUMERIC(8,4) DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_hc_ad_events_campaign  ON hc_ad_events(campaign_id);
    CREATE INDEX idx_hc_ad_events_creative  ON hc_ad_events(creative_id);
    CREATE INDEX idx_hc_ad_events_type      ON hc_ad_events(event_type);
    CREATE INDEX idx_hc_ad_events_created   ON hc_ad_events(created_at DESC);
    CREATE INDEX idx_hc_ad_events_surface   ON hc_ad_events(surface);
  ELSE
    -- Extend existing hc_ad_events with new columns
    ALTER TABLE hc_ad_events
      ADD COLUMN IF NOT EXISTS state_code     TEXT,
      ADD COLUMN IF NOT EXISTS session_id     TEXT,
      ADD COLUMN IF NOT EXISTS ip_hash        TEXT,
      ADD COLUMN IF NOT EXISTS revenue_credit NUMERIC(8,4) DEFAULT 0;
  END IF;
END $$;

-- Daily ad revenue rollup (materialized for performance)
CREATE TABLE IF NOT EXISTS ad_revenue_daily (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  campaign_id     UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  advertiser_id   UUID REFERENCES ad_advertisers(id) ON DELETE CASCADE,
  impressions     BIGINT DEFAULT 0,
  clicks          BIGINT DEFAULT 0,
  revenue         NUMERIC(10,2) DEFAULT 0,
  UNIQUE(date, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_revenue_date        ON ad_revenue_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_revenue_advertiser  ON ad_revenue_daily(advertiser_id);

-- ============================================================================
-- 4. RLS POLICIES — AdGrid self-serve
-- ============================================================================

ALTER TABLE IF EXISTS ad_advertisers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_campaigns          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_creatives          ENABLE ROW LEVEL SECURITY;

-- Advertisers can see/manage their own data
CREATE POLICY IF NOT EXISTS "advertiser_own_data" ON ad_advertisers
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "advertiser_own_campaigns" ON ad_campaigns
  FOR ALL TO authenticated
  USING (advertiser_id IN (SELECT id FROM ad_advertisers WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "advertiser_own_creatives" ON ad_creatives
  FOR ALL TO authenticated
  USING (campaign_id IN (
    SELECT ac.id FROM ad_campaigns ac
    JOIN ad_advertisers aa ON ac.advertiser_id = aa.id
    WHERE aa.user_id = auth.uid()
  ));

-- Service role full access
CREATE POLICY IF NOT EXISTS "service_adv"    ON ad_advertisers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "service_camp"   ON ad_campaigns   FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "service_creat"  ON ad_creatives   FOR ALL USING (auth.role() = 'service_role');

-- Public read for pricing and segments
ALTER TABLE IF EXISTS ad_pricing_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_audience_segments     ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "pricing_public_read"   ON ad_pricing_plans     FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "segments_public_read"  ON ad_audience_segments FOR SELECT USING (TRUE);

-- ============================================================================
-- END MIGRATION
-- ============================================================================
