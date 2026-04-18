-- ============================================================================
-- WAVE 15: Visual Production OS + Coverage Ledger
-- ============================================================================
-- Two new systems that turn architecture into production:
--   1. visual_assets — canonical asset pipeline for every visual surface
--   2. coverage_ledger — tracks every route/surface against ownership & status
-- ============================================================================

-- ─── 1. VISUAL PRODUCTION OS ─────────────────────────────────────────────────
-- Every image, OG card, hero, badge, heat strip, sponsor creative, and
-- app-store screenshot flows through this table. No orphan assets.

CREATE TABLE IF NOT EXISTS public.visual_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- What is it?
  asset_type     TEXT NOT NULL CHECK (asset_type IN (
    'hero_image', 'hero_video', 'hero_poster',
    'og_card', 'twitter_card',
    'sponsor_creative', 'sponsor_logo',
    'training_badge', 'certification_badge',
    'report_card_graphic', 'trust_badge',
    'corridor_heat_strip', 'corridor_teaser',
    'city_hero', 'city_og', 'city_proof_strip',
    'app_screenshot', 'app_store_graphic',
    'market_art', 'localized_hero',
    'icon', 'favicon', 'manifest_icon',
    'email_header', 'push_icon',
    'ad_creative', 'social_post_image'
  )),

  -- Where does it belong?
  route          TEXT,                          -- e.g. '/directory/us/tx', '/corridor/i-10'
  locale         TEXT DEFAULT 'en-US',          -- BCP-47 locale
  market         TEXT,                          -- e.g. 'us-tx', 'ca-on', 'mx-nl'
  country_code   TEXT,                          -- ISO 3166-1 alpha-2
  subdivision    TEXT,                          -- state/province slug
  city_slug      TEXT,                          -- city slug if applicable
  corridor_slug  TEXT,                          -- corridor slug if applicable

  -- What model/tool made it?
  role           TEXT DEFAULT 'background',     -- 'hero', 'background', 'thumbnail', 'og', 'badge'
  prompt_hash    TEXT,                          -- SHA-256 of generation prompt (dedup)
  prompt_text    TEXT,                          -- the actual prompt used
  model_used     TEXT,                          -- 'gemini-2.5-flash', 'dall-e-3', 'midjourney', etc.
  generation_cost NUMERIC(8,4) DEFAULT 0,      -- cost in USD to generate

  -- The file
  storage_path   TEXT NOT NULL,                 -- Supabase Storage path
  storage_bucket TEXT DEFAULT 'visual-assets',
  cdn_url        TEXT,                          -- public CDN URL after upload
  format         TEXT DEFAULT 'webp' CHECK (format IN ('webp', 'avif', 'png', 'jpg', 'svg', 'mp4')),
  width_px       INT,
  height_px      INT,
  file_size_bytes BIGINT,

  -- Metadata
  alt_text       TEXT NOT NULL DEFAULT '',      -- accessibility + SEO
  caption        TEXT,
  version        INT DEFAULT 1,                -- increment on replacement
  is_current     BOOLEAN DEFAULT true,          -- false = superseded by newer version

  -- Lifecycle
  approval_status TEXT DEFAULT 'auto_approved' CHECK (approval_status IN (
    'pending_review', 'auto_approved', 'human_approved', 'rejected', 'expired'
  )),
  approved_by    UUID REFERENCES auth.users(id),
  approved_at    TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,                  -- stale date for freshness governance
  replacement_date TIMESTAMPTZ,                -- scheduled replacement

  -- Monetization
  is_monetizable BOOLEAN DEFAULT false,        -- can this surface carry a sponsor?
  sponsor_slot_id UUID,                        -- FK to ad_grid_slots if applicable
  sponsor_price_cents INT,                     -- what it costs to sponsor this surface

  -- Linking
  parent_asset_id UUID REFERENCES public.visual_assets(id), -- for variants (e.g. OG derived from hero)
  operator_id    UUID,                         -- FK to operators if operator-specific
  training_level_id UUID                       -- FK to training_levels if badge
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_visual_assets_route ON public.visual_assets(route);
CREATE INDEX IF NOT EXISTS idx_visual_assets_type ON public.visual_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_visual_assets_locale ON public.visual_assets(locale);
CREATE INDEX IF NOT EXISTS idx_visual_assets_market ON public.visual_assets(market);
CREATE INDEX IF NOT EXISTS idx_visual_assets_current ON public.visual_assets(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_visual_assets_monetizable ON public.visual_assets(is_monetizable) WHERE is_monetizable = true;
CREATE INDEX IF NOT EXISTS idx_visual_assets_expiry ON public.visual_assets(expires_at) WHERE expires_at IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_visual_assets_prompt_dedup ON public.visual_assets(prompt_hash) WHERE is_current = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_visual_asset_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_visual_asset_updated ON public.visual_assets;
CREATE TRIGGER trg_visual_asset_updated
  BEFORE UPDATE ON public.visual_assets
  FOR EACH ROW EXECUTE FUNCTION update_visual_asset_timestamp();

-- RLS: public read, authenticated write
ALTER TABLE public.visual_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visual_assets_public_read" ON public.visual_assets
  FOR SELECT USING (approval_status IN ('auto_approved', 'human_approved'));

CREATE POLICY "visual_assets_auth_write" ON public.visual_assets
  FOR ALL USING (auth.role() = 'authenticated');


-- ─── 2. COVERAGE LEDGER ─────────────────────────────────────────────────────
-- Tracks EVERY surface in the system against ownership, runtime, tests,
-- monetization, SEO, visual assets, and trust status.
-- This is how you stop "we think it's covered" from becoming blind spots.

CREATE TABLE IF NOT EXISTS public.coverage_ledger (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- What is this surface?
  surface_type   TEXT NOT NULL CHECK (surface_type IN (
    'page', 'api_route', 'cron_job', 'edge_function',
    'component', 'rpc', 'webhook', 'worker',
    'email_template', 'push_template', 'sms_template'
  )),
  surface_path   TEXT NOT NULL,                -- e.g. '/directory/[country]/[state]', '/api/cron/claim-sniper'
  surface_name   TEXT NOT NULL,                -- human-readable name
  description    TEXT,

  -- Ownership
  owner_agent    TEXT,                         -- which Magnificent 7 agent owns this
  owner_model    TEXT,                         -- which model tier handles it
  owner_skill    TEXT,                         -- which skill module implements it

  -- Runtime
  runtime        TEXT CHECK (runtime IN ('next_page', 'next_api', 'edge_function', 'vercel_cron', 'supabase_rpc', 'process_script', 'webhook')),
  adapter        TEXT CHECK (adapter IN ('claude_local', 'codex_local', 'gemini_local', 'process', 'http', 'none')),

  -- Quality gates
  has_tests      BOOLEAN DEFAULT false,
  test_file_path TEXT,
  has_analytics  BOOLEAN DEFAULT false,
  analytics_event TEXT,                        -- e.g. 'page_view_directory', 'cron_run_claim_sniper'

  -- Monetization
  is_monetized   BOOLEAN DEFAULT false,
  monetization_type TEXT CHECK (monetization_type IN (
    'sponsor_slot', 'premium_gate', 'subscription', 'one_time_purchase',
    'affiliate', 'lead_gen', 'data_product', 'none'
  )),
  stripe_price_id TEXT,                        -- if gated behind Stripe
  monthly_revenue_cents INT DEFAULT 0,         -- tracked revenue from this surface

  -- SEO
  is_seo_surface BOOLEAN DEFAULT false,
  has_canonical  BOOLEAN DEFAULT false,
  has_schema_ld  BOOLEAN DEFAULT false,
  has_answer_block BOOLEAN DEFAULT false,
  has_og_card    BOOLEAN DEFAULT false,
  has_hreflang   BOOLEAN DEFAULT false,
  serp_position  INT,                          -- latest tracked position
  monthly_organic_clicks INT DEFAULT 0,

  -- Local / Market
  is_localized   BOOLEAN DEFAULT false,
  locale_count   INT DEFAULT 0,                -- how many locales this surface serves
  market_coverage TEXT[],                       -- array of market slugs covered

  -- Trust
  is_trust_surface BOOLEAN DEFAULT false,      -- does this affect user trust?
  has_verified_stamp BOOLEAN DEFAULT false,
  last_verified  TIMESTAMPTZ,

  -- Visual Assets
  has_visual_assets BOOLEAN DEFAULT false,
  visual_asset_count INT DEFAULT 0,
  has_hero       BOOLEAN DEFAULT false,
  has_og_image   BOOLEAN DEFAULT false,

  -- Status
  coverage_status TEXT DEFAULT 'uncovered' CHECK (coverage_status IN (
    'uncovered', 'partial', 'covered', 'production', 'deprecated'
  )),
  notes          TEXT,
  priority       TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low', 'deferred'))
);

CREATE INDEX IF NOT EXISTS idx_coverage_surface_path ON public.coverage_ledger(surface_path);
CREATE INDEX IF NOT EXISTS idx_coverage_status ON public.coverage_ledger(coverage_status);
CREATE INDEX IF NOT EXISTS idx_coverage_owner ON public.coverage_ledger(owner_agent);
CREATE INDEX IF NOT EXISTS idx_coverage_monetized ON public.coverage_ledger(is_monetized) WHERE is_monetized = true;
CREATE INDEX IF NOT EXISTS idx_coverage_seo ON public.coverage_ledger(is_seo_surface) WHERE is_seo_surface = true;
CREATE INDEX IF NOT EXISTS idx_coverage_priority ON public.coverage_ledger(priority);

ALTER TABLE public.coverage_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coverage_ledger_auth_read" ON public.coverage_ledger
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "coverage_ledger_auth_write" ON public.coverage_ledger
  FOR ALL USING (auth.role() = 'authenticated');

-- Auto-update
CREATE OR REPLACE FUNCTION update_coverage_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coverage_updated ON public.coverage_ledger;
CREATE TRIGGER trg_coverage_updated
  BEFORE UPDATE ON public.coverage_ledger
  FOR EACH ROW EXECUTE FUNCTION update_coverage_timestamp();


-- ─── 3. SEED COVERAGE LEDGER WITH KNOWN SURFACES ────────────────────────────
-- These are the surfaces that MUST be tracked. Gap = money/SEO left on table.

INSERT INTO public.coverage_ledger (surface_type, surface_path, surface_name, owner_agent, runtime, is_seo_surface, is_monetized, monetization_type, priority, coverage_status) VALUES
-- Revenue surfaces
('page', '/', 'Homepage', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'critical', 'covered'),
('page', '/directory', 'Operator Directory', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'critical', 'covered'),
('page', '/directory/[country]/[state]', 'State Directory Page', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'critical', 'partial'),
('page', '/directory/[country]/[state]/[city]', 'City Directory Page', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'high', 'uncovered'),
('page', '/corridor', 'Corridor Index', 'seo_engine', 'next_page', true, true, 'subscription', 'critical', 'covered'),
('page', '/corridor/[slug]', 'Corridor Detail Page', 'seo_engine', 'next_page', true, true, 'subscription', 'critical', 'partial'),
('page', '/tools/escort-calculator', 'Escort Calculator', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'critical', 'covered'),
('page', '/training', 'Training Hub', 'revenue_engine', 'next_page', true, true, 'one_time_purchase', 'critical', 'partial'),
('page', '/training/[course]', 'Training Course Detail', 'revenue_engine', 'next_page', true, true, 'one_time_purchase', 'high', 'uncovered'),
('page', '/glossary', 'Glossary Index', 'seo_engine', 'next_page', true, false, 'none', 'high', 'covered'),
('page', '/glossary/[term]', 'Glossary Term Detail', 'seo_engine', 'next_page', true, false, 'none', 'high', 'partial'),
('page', '/escort-requirements', 'State Requirements', 'seo_engine', 'next_page', true, false, 'none', 'high', 'covered'),
('page', '/escort-requirements/[state]', 'State Detail Requirements', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'high', 'partial'),
('page', '/leaderboards', 'Leaderboards', 'seo_engine', 'next_page', true, false, 'none', 'medium', 'covered'),
('page', '/blog', 'Blog Index', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'high', 'covered'),
('page', '/blog/[slug]', 'Blog Post Detail', 'seo_engine', 'next_page', true, true, 'sponsor_slot', 'high', 'partial'),
('page', '/load-board', 'Load Board', 'dispatch_engine', 'next_page', true, true, 'premium_gate', 'critical', 'partial'),

-- Monetization surfaces NOT yet wired
('page', '/pricing', 'Pricing Page', 'revenue_engine', 'next_page', true, true, 'subscription', 'critical', 'uncovered'),
('api_route', '/api/stripe/checkout', 'Stripe Checkout Endpoint', 'revenue_engine', 'next_api', false, true, 'one_time_purchase', 'critical', 'uncovered'),
('api_route', '/api/stripe/webhook', 'Stripe Webhook Handler', 'revenue_engine', 'next_api', false, true, 'subscription', 'critical', 'uncovered'),
('page', '/report-card/[operator]', 'Operator Report Card', 'revenue_engine', 'next_page', true, true, 'premium_gate', 'high', 'uncovered'),
('page', '/corridor-command', 'Corridor Command Product', 'revenue_engine', 'next_page', true, true, 'subscription', 'high', 'uncovered'),

-- Cron jobs
('cron_job', '/api/cron/claim-sniper', 'Claim Sniper', 'dispatch_engine', 'vercel_cron', false, false, 'none', 'high', 'covered'),
('cron_job', '/api/cron/operator-briefing', 'Operator Briefing', 'dispatch_engine', 'vercel_cron', false, false, 'none', 'high', 'covered'),
('cron_job', '/api/cron/broker-briefing', 'Broker Briefing', 'revenue_engine', 'vercel_cron', false, false, 'none', 'high', 'covered'),
('cron_job', '/api/cron/content-engine', 'Content Engine', 'seo_engine', 'vercel_cron', false, false, 'none', 'high', 'covered'),
('cron_job', '/api/cron/content-pipeline', 'Content Pipeline', 'seo_engine', 'vercel_cron', false, false, 'none', 'high', 'covered'),
('cron_job', '/api/cron/fmcsa-ingest', 'FMCSA Ingest', 'back_office', 'vercel_cron', false, false, 'none', 'high', 'covered'),
('cron_job', '/api/cron/supply-density', 'Supply Density Map', 'dispatch_engine', 'vercel_cron', false, false, 'none', 'medium', 'covered'),

-- Missing money surfaces
('page', '/escrow', 'Escrow Payment Hold', 'revenue_engine', 'next_page', false, true, 'one_time_purchase', 'high', 'uncovered'),
('page', '/premium-support', 'After-Hours Premium', 'emergency_desk', 'next_page', false, true, 'subscription', 'medium', 'uncovered'),
('api_route', '/api/push/send', 'Push Notification Sender', 'dispatch_engine', 'next_api', false, false, 'none', 'high', 'partial'),
('email_template', 'sponsor-outreach', 'Sponsor Outreach Email', 'revenue_engine', 'process_script', false, true, 'lead_gen', 'high', 'uncovered'),
('email_template', 'training-upsell', 'Training Upsell Email', 'revenue_engine', 'process_script', false, true, 'one_time_purchase', 'high', 'uncovered'),
('email_template', 'ar-collection', 'A/R Collection Notice', 'back_office', 'process_script', false, false, 'none', 'medium', 'uncovered')

ON CONFLICT DO NOTHING;
