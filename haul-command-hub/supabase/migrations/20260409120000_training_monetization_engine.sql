-- ============================================================
-- Haul Command — Training Monetization Engine
-- Migration: training_monetization_engine
-- Version: 2026-04-09
-- ============================================================

-- ─── training_catalog ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_catalog (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id             text UNIQUE NOT NULL,                        -- e.g. "foundational", "certified", "elite", "av-ready"
  training_type       text NOT NULL,                               -- 'foundational' | 'core' | 'advanced' | 'specialized'
  credential_level    text NOT NULL,                               -- 'road_ready' | 'certified' | 'elite' | 'av_ready'
  module_count        integer NOT NULL DEFAULT 0,
  hours_total         numeric(5,1) NOT NULL DEFAULT 0,
  jurisdiction_scope  text NOT NULL DEFAULT 'global',              -- 'global' | 'us' | 'us-ca' etc
  reciprocity_scope   text,
  requirement_fit     text,
  ranking_impact      numeric(3,2) NOT NULL DEFAULT 0,             -- 0.00–1.00 rank weight contribution
  trust_badge_effect  text,
  pricing_json        jsonb NOT NULL DEFAULT '{}',
  confidence_state    text NOT NULL DEFAULT 'seeded_needs_review',
  freshness_state     text NOT NULL DEFAULT 'seeded',
  reviewed_at         timestamptz,
  next_review_due     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_catalog_node_id ON public.training_catalog(node_id);
CREATE INDEX IF NOT EXISTS idx_training_catalog_credential_level ON public.training_catalog(credential_level);

-- ─── training_modules ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  slug        text NOT NULL UNIQUE,
  title       text NOT NULL,
  summary     text,
  hours       numeric(4,1) NOT NULL DEFAULT 1,
  sort_order  integer NOT NULL DEFAULT 0,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_modules_training_id ON public.training_modules(training_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_slug ON public.training_modules(slug);

-- ─── training_levels ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_levels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  level_slug  text NOT NULL UNIQUE,
  level_name  text NOT NULL,
  description text,
  badge_slug  text NOT NULL,
  rank_weight numeric(3,2) NOT NULL DEFAULT 0,
  trust_weight numeric(3,2) NOT NULL DEFAULT 0,
  pricing_json jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_levels_badge_slug ON public.training_levels(badge_slug);

-- ─── training_geo_fit ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_geo_fit (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id      uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  country_code     text NOT NULL,
  region_code      text,
  fit_type         text NOT NULL DEFAULT 'partial',  -- 'full' | 'partial' | 'cultural' | 'none'
  note             text,
  confidence_state text NOT NULL DEFAULT 'seeded_needs_review',
  freshness_state  text NOT NULL DEFAULT 'seeded',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_geo_fit_country ON public.training_geo_fit(country_code);
CREATE INDEX IF NOT EXISTS idx_training_geo_fit_region ON public.training_geo_fit(region_code);

-- ─── training_reciprocity_notes ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_reciprocity_notes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id      uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  from_geo         text NOT NULL,
  to_geo           text NOT NULL,
  note             text,
  confidence_state text NOT NULL DEFAULT 'seeded_needs_review',
  freshness_state  text NOT NULL DEFAULT 'seeded',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── training_links ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  link_type   text NOT NULL,           -- 'regulation' | 'tool' | 'glossary' | 'claim' | 'directory'
  target_type text NOT NULL,
  target_id   text NOT NULL,
  anchor_text text,
  priority    integer NOT NULL DEFAULT 50,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_links_training_id ON public.training_links(training_id);
CREATE INDEX IF NOT EXISTS idx_training_links_link_type ON public.training_links(link_type);

-- ─── training_badge_effects ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_badge_effects (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id             uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  badge_slug              text NOT NULL,
  on_platform_effect_json jsonb NOT NULL DEFAULT '{}',
  visible_copy            text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_badge_effects_badge_slug ON public.training_badge_effects(badge_slug);

-- ─── training_enrollments ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id     uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'enrolled',  -- 'enrolled' | 'in_progress' | 'completed' | 'expired' | 'review_due'
  purchased_at    timestamptz,
  completed_at    timestamptz,
  expires_at      timestamptz,
  review_due_at   timestamptz,
  stripe_session_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, training_id)
);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_user_id ON public.training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_training_id ON public.training_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status ON public.training_enrollments(status);

-- ─── training_user_badges ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_user_badges (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_slug         text NOT NULL,
  source_training_id uuid REFERENCES public.training_catalog(id),
  status             text NOT NULL DEFAULT 'active',  -- 'active' | 'expired' | 'review_due' | 'revoked'
  issued_at          timestamptz NOT NULL DEFAULT now(),
  expires_at         timestamptz,
  review_due_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_slug)
);

CREATE INDEX IF NOT EXISTS idx_training_user_badges_user_id ON public.training_user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_training_user_badges_badge_slug ON public.training_user_badges(badge_slug);
CREATE INDEX IF NOT EXISTS idx_training_user_badges_status ON public.training_user_badges(status);

-- ─── training_team_accounts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_team_accounts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL,
  plan_type  text NOT NULL DEFAULT 'team',    -- 'team' | 'enterprise'
  seat_count integer NOT NULL DEFAULT 1,
  renewal_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── training_team_enrollments ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_team_enrollments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_account_id  uuid NOT NULL REFERENCES public.training_team_accounts(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id      uuid NOT NULL REFERENCES public.training_catalog(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'enrolled',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_account_id, user_id, training_id)
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE public.training_catalog           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_modules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_levels            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_geo_fit           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_reciprocity_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_links             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_badge_effects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_user_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_team_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_team_enrollments  ENABLE ROW LEVEL SECURITY;

-- Public read for catalog/modules/levels/geo/links/badge-effects
CREATE POLICY training_catalog_public_read           ON public.training_catalog           FOR SELECT USING (true);
CREATE POLICY training_modules_public_read           ON public.training_modules           FOR SELECT USING (true);
CREATE POLICY training_levels_public_read            ON public.training_levels            FOR SELECT USING (true);
CREATE POLICY training_geo_fit_public_read           ON public.training_geo_fit           FOR SELECT USING (true);
CREATE POLICY training_reciprocity_public_read       ON public.training_reciprocity_notes FOR SELECT USING (true);
CREATE POLICY training_links_public_read             ON public.training_links             FOR SELECT USING (true);
CREATE POLICY training_badge_effects_public_read     ON public.training_badge_effects     FOR SELECT USING (true);

-- User-scoped read for enrollments + badges
CREATE POLICY training_enrollments_user_read         ON public.training_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY training_enrollments_user_update       ON public.training_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY training_user_badges_user_read         ON public.training_user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY training_user_badges_user_update       ON public.training_user_badges FOR UPDATE USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY training_catalog_service_write         ON public.training_catalog           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_modules_service_write         ON public.training_modules           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_levels_service_write          ON public.training_levels            FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_geo_fit_service_write         ON public.training_geo_fit           FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_reciprocity_service_write     ON public.training_reciprocity_notes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_links_service_write           ON public.training_links             FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_badge_effects_service_write   ON public.training_badge_effects     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_enrollments_service_write     ON public.training_enrollments       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_user_badges_service_write     ON public.training_user_badges       FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_team_accounts_service_write   ON public.training_team_accounts     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY training_team_enrollments_service_write ON public.training_team_enrollments  FOR ALL USING (auth.role() = 'service_role');

-- ─── RPC: training_hub_payload ──────────────────────────────
CREATE OR REPLACE FUNCTION public.training_hub_payload()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'levels', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'node_id',         tc.node_id,
          'credential_level', tc.credential_level,
          'training_type',   tc.training_type,
          'hours_total',     tc.hours_total,
          'module_count',    tc.module_count,
          'ranking_impact',  tc.ranking_impact,
          'pricing_json',    tc.pricing_json,
          'confidence_state', tc.confidence_state,
          'badge_slug',      tl.badge_slug,
          'rank_weight',     tl.rank_weight,
          'trust_weight',    tl.trust_weight,
          'level_name',      tl.level_name,
          'description',     tl.description,
          'pricing',         tl.pricing_json
        )
        ORDER BY tl.rank_weight
      )
      FROM public.training_catalog tc
      LEFT JOIN public.training_levels tl ON tl.training_id = tc.id
    ),
    'total_catalog_count', (SELECT COUNT(*) FROM public.training_catalog),
    'badge_effects', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'badge_slug',            tbe.badge_slug,
          'on_platform_effect',    tbe.on_platform_effect_json,
          'visible_copy',          tbe.visible_copy
        )
      )
      FROM public.training_badge_effects tbe
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ─── RPC: training_page_payload ─────────────────────────────
CREATE OR REPLACE FUNCTION public.training_page_payload(
  p_training_slug text,
  p_country_code  text DEFAULT NULL,
  p_region_code   text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_training_id uuid;
BEGIN
  SELECT id INTO v_training_id FROM public.training_catalog WHERE node_id = p_training_slug LIMIT 1;
  IF v_training_id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'training',    row_to_json(tc)::jsonb,
    'modules',     (SELECT jsonb_agg(row_to_json(tm)::jsonb ORDER BY tm.sort_order) FROM public.training_modules tm WHERE tm.training_id = v_training_id),
    'levels',      (SELECT jsonb_agg(row_to_json(tl)::jsonb ORDER BY tl.rank_weight) FROM public.training_levels tl WHERE tl.training_id = v_training_id),
    'geo_fit',     (
      SELECT jsonb_agg(row_to_json(tgf)::jsonb)
      FROM public.training_geo_fit tgf
      WHERE tgf.training_id = v_training_id
        AND (p_country_code IS NULL OR tgf.country_code = p_country_code)
        AND (p_region_code IS NULL OR tgf.region_code = p_region_code)
    ),
    'links',       (SELECT jsonb_agg(row_to_json(tli)::jsonb ORDER BY tli.priority) FROM public.training_links tli WHERE tli.training_id = v_training_id),
    'badge_effects', (SELECT jsonb_agg(row_to_json(tbe)::jsonb) FROM public.training_badge_effects tbe WHERE tbe.training_id = v_training_id)
  )
  FROM public.training_catalog tc
  WHERE tc.id = v_training_id
  INTO result;

  RETURN result;
END;
$$;

-- ─── RPC: training_user_status_payload ──────────────────────
CREATE OR REPLACE FUNCTION public.training_user_status_payload(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'enrollments', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'training_id',   te.training_id,
          'node_id',       tc.node_id,
          'status',        te.status,
          'completed_at',  te.completed_at,
          'expires_at',    te.expires_at,
          'review_due_at', te.review_due_at
        ) ORDER BY te.created_at DESC
      )
      FROM public.training_enrollments te
      JOIN public.training_catalog tc ON tc.id = te.training_id
      WHERE te.user_id = p_user_id
    ),
    'badges', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'badge_slug',    tub.badge_slug,
          'status',        tub.status,
          'issued_at',     tub.issued_at,
          'expires_at',    tub.expires_at,
          'review_due_at', tub.review_due_at
        ) ORDER BY tub.issued_at DESC
      )
      FROM public.training_user_badges tub
      WHERE tub.user_id = p_user_id
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ─── RPC: training_badge_effects_payload ────────────────────
CREATE OR REPLACE FUNCTION public.training_badge_effects_payload(p_badge_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'badge_slug',         tbe.badge_slug,
      'on_platform_effect', tbe.on_platform_effect_json,
      'visible_copy',       tbe.visible_copy,
      'training_node_id',   tc.node_id,
      'level_name',         tl.level_name
    )
  )
  INTO result
  FROM public.training_badge_effects tbe
  JOIN public.training_catalog tc ON tc.id = tbe.training_id
  LEFT JOIN public.training_levels tl ON tl.badge_slug = tbe.badge_slug
  WHERE tbe.badge_slug = p_badge_slug;
  RETURN result;
END;
$$;

-- ─── RPC: training_enterprise_payload ───────────────────────
CREATE OR REPLACE FUNCTION public.training_enterprise_payload()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'team_plans', jsonb_build_array(
      jsonb_build_object('slug', 'team', 'name', 'Team Plan', 'min_seats', 2, 'max_seats', 49),
      jsonb_build_object('slug', 'enterprise', 'name', 'Enterprise', 'min_seats', 50, 'max_seats', null)
    ),
    'features', jsonb_build_array(
      'Multi-seat training dashboard',
      'Company roster tracking',
      'Completion audit exports',
      'Badge verification API',
      'Jurisdiction fit overlays',
      'Private cohorts',
      'Custom reporting'
    )
  );
END;
$$;

-- ─── Seed catalog data ───────────────────────────────────────
INSERT INTO public.training_catalog (node_id, training_type, credential_level, module_count, hours_total, ranking_impact, pricing_json, confidence_state, freshness_state)
VALUES
  ('road-ready',  'foundational', 'road_ready', 4,  4.0,  0.10, '{"one_time": 49,  "currency": "usd"}', 'verified_current', 'current'),
  ('certified',   'core',         'certified',  8,  12.0, 0.25, '{"one_time": 149, "currency": "usd", "annual_refresh": 49}', 'verified_current', 'current'),
  ('elite',       'advanced',     'elite',      14, 24.0, 0.45, '{"subscription": 29, "period": "month", "currency": "usd"}', 'verified_current', 'current'),
  ('av-ready',    'specialized',  'av_ready',   6,  8.0,  0.35, '{"one_time": 199, "currency": "usd"}', 'seeded_needs_review', 'seeded')
ON CONFLICT (node_id) DO NOTHING;

-- Seed levels
INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT id, 'road-ready',  'Road Ready',  'Foundational training for all heavy haul escort operators. Basics of compliance, safety, and operations.',  'road_ready', 0.10, 0.10, '{"one_time": 49}'  FROM public.training_catalog WHERE node_id = 'road-ready'  ON CONFLICT (level_slug) DO NOTHING;
INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT id, 'certified',   'Certified',   'Core certification path. Broker-visible badge, directory weighting, and filter eligibility.',                'certified',  0.25, 0.30, '{"one_time": 149}' FROM public.training_catalog WHERE node_id = 'certified'  ON CONFLICT (level_slug) DO NOTHING;
INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT id, 'elite',       'Elite',       'Advanced mastery. Premium badge, expanded trust card, top search weighting, and annual verification.',        'elite',      0.45, 0.50, '{"subscription": 29, "period": "month"}' FROM public.training_catalog WHERE node_id = 'elite'     ON CONFLICT (level_slug) DO NOTHING;
INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT id, 'av-ready',    'AV-Ready',    'Autonomous vehicle escort specialist. Category-specific search weighting and enterprise visibility.',         'av_ready',   0.35, 0.35, '{"one_time": 199}' FROM public.training_catalog WHERE node_id = 'av-ready'  ON CONFLICT (level_slug) DO NOTHING;

-- Seed badge effects
INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT id, 'road_ready', '{"directory_boost": 0.10, "profile_badge": true, "broker_visible": false}',
  'Displays Road Ready badge on your profile. Small positive rank effect in directory search.'
FROM public.training_catalog WHERE node_id = 'road-ready' ON CONFLICT DO NOTHING;

INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT id, 'certified', '{"directory_boost": 0.25, "profile_badge": true, "broker_visible": true, "filter_eligible": true}',
  'Certified badge visible to brokers. Higher directory and search weighting. Eligible for broker filter tools.'
FROM public.training_catalog WHERE node_id = 'certified' ON CONFLICT DO NOTHING;

INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT id, 'elite', '{"directory_boost": 0.45, "profile_badge": true, "broker_visible": true, "filter_eligible": true, "trust_card_expanded": true}',
  'Elite badge with expanded trust card. Top weighting in premium search contexts. Broker-facing trust detail block.'
FROM public.training_catalog WHERE node_id = 'elite' ON CONFLICT DO NOTHING;

INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT id, 'av_ready', '{"directory_boost": 0.35, "profile_badge": true, "broker_visible": true, "category_specific": true}',
  'AV-Ready specialist badge. Category-specific search weighting for autonomous vehicle escort opportunities.'
FROM public.training_catalog WHERE node_id = 'av-ready' ON CONFLICT DO NOTHING;

-- Seed modules
INSERT INTO public.training_modules (training_id, slug, title, summary, hours, sort_order)
SELECT tc.id, m.slug, m.title, m.summary, m.hours, m.sort_order
FROM public.training_catalog tc
CROSS JOIN (VALUES
  ('road-ready', 'intro-to-heavy-haul',      'Introduction to Heavy Haul',        'Core concepts of oversize and heavy haul transport.',              1.0, 1),
  ('road-ready', 'escort-safety-fundamentals','Escort Safety Fundamentals',         'Safe following distances, flagging, and communication.',           1.0, 2),
  ('road-ready', 'permits-overview',          'Permits Overview',                   'How permits work across U.S. states and provinces.',               1.0, 3),
  ('road-ready', 'basic-compliance-check',    'Basic Compliance Checklist',         'Pre-trip compliance for escort operators.',                        1.0, 4)
) AS m(cat_node_id, slug, title, summary, hours, sort_order)
WHERE tc.node_id = m.cat_node_id
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.training_modules (training_id, slug, title, summary, hours, sort_order)
SELECT tc.id, m.slug, m.title, m.summary, m.hours, m.sort_order
FROM public.training_catalog tc
CROSS JOIN (VALUES
  ('certified', 'route-survey-mastery',       'Route Survey Mastery',               'Professional route survey execution and documentation.',           2.0, 1),
  ('certified', 'jurisdiction-requirements',  'Jurisdiction Requirements',          'State-by-state and province escort law deep dive.',                2.0, 2),
  ('certified', 'broker-communication',       'Broker Communication',               'Standards for professional broker and client interaction.',        1.5, 3),
  ('certified', 'load-securing-protocols',    'Load Securing Protocols',            'Rigging and securement standards for oversize loads.',             1.5, 4),
  ('certified', 'emergency-procedures',       'Emergency Procedures',               'Incident response, accident management, and reporting.',           1.5, 5),
  ('certified', 'equipment-inspection',       'Equipment Inspection',               'Vehicle and equipment inspection standards.',                      1.0, 6),
  ('certified', 'documentation-standards',   'Documentation Standards',            'Permit packets, logs, and paperwork compliance.',                  1.0, 7),
  ('certified', 'professionalism-ethics',     'Professionalism and Ethics',         'Industry standards, reputation management, and ethics.',           1.5, 8)
) AS m(cat_node_id, slug, title, summary, hours, sort_order)
WHERE tc.node_id = m.cat_node_id
ON CONFLICT (slug) DO NOTHING;

-- Seed internal links
INSERT INTO public.training_links (training_id, link_type, target_type, target_id, anchor_text, priority)
SELECT tc.id, l.link_type, l.target_type, l.target_id, l.anchor_text, l.priority
FROM public.training_catalog tc
CROSS JOIN (VALUES
  ('road-ready',  'regulation', 'page',    '/escort-requirements',         'Escort Requirements',         10),
  ('road-ready',  'tool',       'page',    '/tools/permit-checker/us',     'Permit Checker',              20),
  ('road-ready',  'claim',      'page',    '/claim',                       'Claim Your Profile',          30),
  ('certified',   'regulation', 'page',    '/escort-requirements',         'Escort Requirements',         10),
  ('certified',   'tool',       'page',    '/tools/route-survey',          'Route Survey Tool',           15),
  ('certified',   'glossary',   'page',    '/glossary',                    'HC Glossary',                 20),
  ('certified',   'directory',  'page',    '/directory',                   'Browse Directory',            25),
  ('elite',       'regulation', 'page',    '/escort-requirements',         'Regulations',                 10),
  ('elite',       'directory',  'page',    '/directory',                   'Directory Ranking',           20)
) AS l(cat_node_id, link_type, target_type, target_id, anchor_text, priority)
WHERE tc.node_id = l.cat_node_id
ON CONFLICT DO NOTHING;

-- ─── Updated_at triggers ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_training_catalog_updated_at') THEN
    CREATE TRIGGER set_training_catalog_updated_at BEFORE UPDATE ON public.training_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_training_enrollments_updated_at') THEN
    CREATE TRIGGER set_training_enrollments_updated_at BEFORE UPDATE ON public.training_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_training_user_badges_updated_at') THEN
    CREATE TRIGGER set_training_user_badges_updated_at BEFORE UPDATE ON public.training_user_badges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
