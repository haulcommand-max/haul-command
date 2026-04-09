-- ============================================================
-- Haul Command — Training Delta Patch v2
-- Additive only. No destructive type changes.
-- Safe to re-run.
-- ============================================================

-- ─── 1. Add node_id to training_catalog (populated from slug) ─
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='training_catalog' AND column_name='node_id'
  ) THEN
    ALTER TABLE public.training_catalog ADD COLUMN node_id text;
    UPDATE public.training_catalog SET node_id = slug WHERE node_id IS NULL;
    CREATE UNIQUE INDEX training_catalog_node_id_uidx ON public.training_catalog(node_id) WHERE node_id IS NOT NULL;
  END IF;
END $$;

-- ─── 2. training_enrollments: add missing columns ─────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='user_id') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='training_id') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN training_id uuid REFERENCES public.training_catalog(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='status') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN status text NOT NULL DEFAULT 'enrolled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='purchased_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN purchased_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='completed_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN completed_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='expires_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN expires_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='review_due_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN review_due_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='stripe_session_id') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN stripe_session_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='created_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='updated_at') THEN
    ALTER TABLE public.training_enrollments ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- ─── 3. training_user_badges: add updated_at ──────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_user_badges' AND column_name='updated_at') THEN
    ALTER TABLE public.training_user_badges ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- ─── 4. Unique constraint on enrollments ──────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_enrollments_user_training_uq')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='user_id')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='training_enrollments' AND column_name='training_id')
  THEN
    ALTER TABLE public.training_enrollments
      ADD CONSTRAINT training_enrollments_user_training_uq UNIQUE (user_id, training_id);
  END IF;
END $$;

-- ─── 4b. Dedup training_levels before adding unique constraint ─
-- Keep the row with the highest rank_weight per level_slug (latest/best).
DELETE FROM public.training_levels
WHERE id NOT IN (
  SELECT DISTINCT ON (level_slug) id
  FROM public.training_levels
  ORDER BY level_slug, rank_weight DESC, created_at DESC
);

-- Now safe to add unique constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_levels_level_slug_key') THEN
    ALTER TABLE public.training_levels ADD CONSTRAINT training_levels_level_slug_key UNIQUE (level_slug);
  END IF;
END $$;

-- ─── 4c. Unique constraint on training_badge_effects(training_id, badge_slug) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_badge_effects_tid_slug_key') THEN
    ALTER TABLE public.training_badge_effects ADD CONSTRAINT training_badge_effects_tid_slug_key UNIQUE (training_id, badge_slug);
  END IF;
END $$;

-- ─── 4d. Unique constraint on training_links(training_id, target_id) ────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='training_links_tid_targetid_key') THEN
    ALTER TABLE public.training_links ADD CONSTRAINT training_links_tid_targetid_key UNIQUE (training_id, target_id);
  END IF;
END $$;

-- ─── 5. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tc_credential_level       ON public.training_catalog(credential_level);
CREATE INDEX IF NOT EXISTS idx_te_user_id                ON public.training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_te_status                 ON public.training_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_tub_user_id               ON public.training_user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_tub_badge_slug            ON public.training_user_badges(badge_slug);
CREATE INDEX IF NOT EXISTS idx_tub_status                ON public.training_user_badges(status);

-- ─── 6. RLS ───────────────────────────────────────────────────
ALTER TABLE public.training_catalog      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_levels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_user_badges  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_catalog' AND policyname='tc_public_read') THEN
    CREATE POLICY tc_public_read ON public.training_catalog FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_levels' AND policyname='tl_public_read') THEN
    CREATE POLICY tl_public_read ON public.training_levels FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_enrollments' AND policyname='te_user_read') THEN
    CREATE POLICY te_user_read ON public.training_enrollments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_enrollments' AND policyname='te_service_all') THEN
    CREATE POLICY te_service_all ON public.training_enrollments FOR ALL USING (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_user_badges' AND policyname='tub_user_read') THEN
    CREATE POLICY tub_user_read ON public.training_user_badges FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='training_user_badges' AND policyname='tub_service_all') THEN
    CREATE POLICY tub_service_all ON public.training_user_badges FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ─── 7. Seed canonical 4-tier catalog entries ─────────────────
-- These are the commercial tier slugs (road-ready / certified / elite / av-ready).
-- They co-exist with the existing detailed course records.
INSERT INTO public.training_catalog
  (slug, node_id, title, training_type, credential_level, module_count, hours_total, jurisdiction_scope, pricing_json, confidence_state, freshness_state)
VALUES
  ('road-ready', 'road-ready', 'Road Ready', 'foundational', 'road_ready', 4,  4,  'global', '{"one_time":49,  "currency":"usd"}'::jsonb, 'verified_current', 'current'),
  ('certified',  'certified',  'Certified',  'core',         'certified',  8,  12, 'global', '{"one_time":149, "currency":"usd", "annual_refresh":49}'::jsonb, 'verified_current', 'current'),
  ('elite',      'elite',      'Elite',      'advanced',     'elite',      14, 24, 'global', '{"subscription":29,"period":"month","currency":"usd"}'::jsonb, 'verified_current', 'current'),
  ('av-ready',   'av-ready',   'AV-Ready',   'specialized',  'av_ready',   6,  8,  'global', '{"one_time":199, "currency":"usd"}'::jsonb, 'seeded_needs_review', 'seeded')
ON CONFLICT (slug) DO UPDATE SET
  node_id          = EXCLUDED.node_id,
  title            = EXCLUDED.title,
  training_type    = EXCLUDED.training_type,
  credential_level = EXCLUDED.credential_level,
  module_count     = EXCLUDED.module_count,
  hours_total      = EXCLUDED.hours_total,
  pricing_json     = EXCLUDED.pricing_json,
  confidence_state = EXCLUDED.confidence_state,
  updated_at       = now();

-- ─── 8. Seed tier levels ──────────────────────────────────────
INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT tc.id, 'road-ready',
  'Road Ready',
  'Foundational training for all heavy haul escort operators. Basics of compliance, safety, and operations.',
  'road_ready', 10, 10, '{"one_time":49,"currency":"usd"}'::jsonb
FROM public.training_catalog tc WHERE tc.slug = 'road-ready'
ON CONFLICT (level_slug) DO UPDATE SET
  level_name=EXCLUDED.level_name, description=EXCLUDED.description,
  rank_weight=EXCLUDED.rank_weight, trust_weight=EXCLUDED.trust_weight, pricing_json=EXCLUDED.pricing_json;

INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT tc.id, 'certified',
  'Certified',
  'Core certification path. Broker-visible badge, directory weighting, and filter eligibility.',
  'certified', 25, 30, '{"one_time":149,"currency":"usd"}'::jsonb
FROM public.training_catalog tc WHERE tc.slug = 'certified'
ON CONFLICT (level_slug) DO UPDATE SET
  level_name=EXCLUDED.level_name, description=EXCLUDED.description,
  rank_weight=EXCLUDED.rank_weight, trust_weight=EXCLUDED.trust_weight, pricing_json=EXCLUDED.pricing_json;

INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT tc.id, 'elite',
  'Elite',
  'Advanced mastery. Premium badge, expanded trust card, top search weighting, and annual verification.',
  'elite', 45, 50, '{"subscription":29,"period":"month","currency":"usd"}'::jsonb
FROM public.training_catalog tc WHERE tc.slug = 'elite'
ON CONFLICT (level_slug) DO UPDATE SET
  level_name=EXCLUDED.level_name, description=EXCLUDED.description,
  rank_weight=EXCLUDED.rank_weight, trust_weight=EXCLUDED.trust_weight, pricing_json=EXCLUDED.pricing_json;

INSERT INTO public.training_levels (training_id, level_slug, level_name, description, badge_slug, rank_weight, trust_weight, pricing_json)
SELECT tc.id, 'av-ready',
  'AV-Ready',
  'Autonomous vehicle escort specialist. Category-specific search weighting and enterprise visibility.',
  'av_ready', 35, 35, '{"one_time":199,"currency":"usd"}'::jsonb
FROM public.training_catalog tc WHERE tc.slug = 'av-ready'
ON CONFLICT (level_slug) DO UPDATE SET
  level_name=EXCLUDED.level_name, description=EXCLUDED.description,
  rank_weight=EXCLUDED.rank_weight, trust_weight=EXCLUDED.trust_weight, pricing_json=EXCLUDED.pricing_json;

-- ─── 9. Seed badge effects ────────────────────────────────────
INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT tc.id, 'road_ready', '{"directory_boost":0.10,"profile_badge":true,"broker_visible":false}'::jsonb,
  'Road Ready badge on your profile. Small positive rank effect in directory search.'
FROM public.training_catalog tc WHERE tc.slug = 'road-ready'
ON CONFLICT ON CONSTRAINT training_badge_effects_tid_slug_key DO NOTHING;

INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT tc.id, 'certified', '{"directory_boost":0.25,"profile_badge":true,"broker_visible":true,"filter_eligible":true}'::jsonb,
  'Certified badge visible to brokers. Higher directory weighting. Eligible for broker filter tools.'
FROM public.training_catalog tc WHERE tc.slug = 'certified'
ON CONFLICT ON CONSTRAINT training_badge_effects_tid_slug_key DO NOTHING;

INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT tc.id, 'elite', '{"directory_boost":0.45,"profile_badge":true,"broker_visible":true,"filter_eligible":true,"trust_card_expanded":true}'::jsonb,
  'Elite badge with expanded trust card. Top weighting in premium search. Broker-facing trust detail block.'
FROM public.training_catalog tc WHERE tc.slug = 'elite'
ON CONFLICT ON CONSTRAINT training_badge_effects_tid_slug_key DO NOTHING;

INSERT INTO public.training_badge_effects (training_id, badge_slug, on_platform_effect_json, visible_copy)
SELECT tc.id, 'av_ready', '{"directory_boost":0.35,"profile_badge":true,"broker_visible":true,"category_specific":true}'::jsonb,
  'AV-Ready specialist badge. Category-specific search weighting for autonomous vehicle escort.'
FROM public.training_catalog tc WHERE tc.slug = 'av-ready'
ON CONFLICT ON CONSTRAINT training_badge_effects_tid_slug_key DO NOTHING;

-- ─── 10. Seed internal links ──────────────────────────────────
INSERT INTO public.training_links (training_id, link_type, target_type, target_id, anchor_text, priority)
SELECT tc.id, l.link_type, l.target_type, l.target_id, l.anchor_text, l.priority
FROM public.training_catalog tc
JOIN (VALUES
  ('road-ready','regulation','page','/escort-requirements',    'Escort Requirements',10),
  ('road-ready','tool',      'page','/tools/permit-checker/us','Permit Checker',      20),
  ('road-ready','claim',     'page','/claim',                  'Claim Your Profile',  30),
  ('certified', 'regulation','page','/escort-requirements',    'Escort Requirements',10),
  ('certified', 'tool',      'page','/tools/escort-rules/us',  'Escort Rules',        15),
  ('certified', 'glossary',  'page','/glossary',               'HC Glossary',         20),
  ('certified', 'claim',     'page','/claim',                  'Claim Profile',       25),
  ('elite',     'regulation','page','/escort-requirements',    'Regulations',         10),
  ('elite',     'directory', 'page','/directory',              'Directory Ranking',   20)
) AS l(cat_slug,link_type,target_type,target_id,anchor_text,priority)
ON tc.slug = l.cat_slug
ON CONFLICT ON CONSTRAINT training_links_tid_targetid_key DO NOTHING;

-- ─── 11. RPCs ─────────────────────────────────────────────────
-- Drop existing conflicting signatures first (parameter rename requires drop).
DROP FUNCTION IF EXISTS public.training_hub_payload();
DROP FUNCTION IF EXISTS public.training_page_payload(text, text, text);
DROP FUNCTION IF EXISTS public.training_country_payload(text);
DROP FUNCTION IF EXISTS public.training_user_status_payload(uuid);
DROP FUNCTION IF EXISTS public.training_badge_effects_payload(text);
DROP FUNCTION IF EXISTS public.training_enterprise_payload();
-- rank_weight stays as integer in DB; RPCs divide by 100 to get 0-1 decimal.

CREATE OR REPLACE FUNCTION public.training_hub_payload()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'levels', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'node_id',          COALESCE(tc.node_id, tc.slug),
          'credential_level', tc.credential_level,
          'training_type',    tc.training_type,
          'hours_total',      tc.hours_total,
          'module_count',     tc.module_count,
          'pricing_json',     tc.pricing_json,
          'confidence_state', tc.confidence_state,
          'badge_slug',       tl.badge_slug,
          'rank_weight',      tl.rank_weight::numeric / 100.0,
          'trust_weight',     tl.trust_weight::numeric / 100.0,
          'level_slug',       tl.level_slug,
          'level_name',       tl.level_name,
          'description',      tl.description,
          'pricing',          tl.pricing_json
        )
        ORDER BY tl.rank_weight
      )
      FROM public.training_catalog tc
      JOIN public.training_levels tl ON tl.training_id = tc.id
      WHERE tc.slug IN ('road-ready','certified','elite','av-ready')
    ),
    'total_catalog_count', (SELECT COUNT(*) FROM public.training_catalog),
    'badge_effects', (
      SELECT jsonb_agg(jsonb_build_object(
        'badge_slug',         tbe.badge_slug,
        'on_platform_effect', tbe.on_platform_effect_json,
        'visible_copy',       tbe.visible_copy
      ))
      FROM public.training_badge_effects tbe
      JOIN public.training_catalog tc ON tc.id = tbe.training_id
      WHERE tc.slug IN ('road-ready','certified','elite','av-ready')
    )
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.training_page_payload(
  p_training_slug text,
  p_country_code  text DEFAULT NULL,
  p_region_code   text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result        jsonb;
  v_training_id uuid;
BEGIN
  SELECT id INTO v_training_id
  FROM public.training_catalog
  WHERE slug = p_training_slug OR node_id = p_training_slug
  LIMIT 1;
  IF v_training_id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'training',      (SELECT row_to_json(tc)::jsonb FROM public.training_catalog tc WHERE tc.id = v_training_id),
    'modules',       (SELECT jsonb_agg(row_to_json(tm)::jsonb ORDER BY tm.sort_order)
                      FROM public.training_modules tm WHERE tm.training_id = v_training_id),
    'levels',        (SELECT jsonb_agg(
                        jsonb_build_object(
                          'id',          tl.id,
                          'training_id', tl.training_id,
                          'level_slug',  tl.level_slug,
                          'level_name',  tl.level_name,
                          'description', tl.description,
                          'badge_slug',  tl.badge_slug,
                          'rank_weight', tl.rank_weight::numeric / 100.0,
                          'trust_weight',tl.trust_weight::numeric / 100.0,
                          'pricing_json',tl.pricing_json
                        )
                        ORDER BY tl.rank_weight
                      )
                      FROM public.training_levels tl WHERE tl.training_id = v_training_id),
    'geo_fit',       (SELECT jsonb_agg(row_to_json(tgf)::jsonb)
                      FROM public.training_geo_fit tgf
                      WHERE tgf.training_id = v_training_id
                        AND (p_country_code IS NULL OR tgf.country_code = p_country_code)
                        AND (p_region_code  IS NULL OR tgf.region_code  = p_region_code)),
    'links',         (SELECT jsonb_agg(row_to_json(tli)::jsonb ORDER BY tli.priority)
                      FROM public.training_links tli WHERE tli.training_id = v_training_id),
    'badge_effects', (SELECT jsonb_agg(row_to_json(tbe)::jsonb)
                      FROM public.training_badge_effects tbe WHERE tbe.training_id = v_training_id)
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.training_user_status_payload(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'enrollments', (
      SELECT jsonb_agg(jsonb_build_object(
        'training_id',   te.training_id,
        'node_id',       COALESCE(tc.node_id, tc.slug),
        'status',        te.status,
        'completed_at',  te.completed_at,
        'expires_at',    te.expires_at,
        'review_due_at', te.review_due_at
      ) ORDER BY te.created_at DESC)
      FROM public.training_enrollments te
      JOIN public.training_catalog tc ON tc.id = te.training_id
      WHERE te.user_id = p_user_id
    ),
    'badges', (
      SELECT jsonb_agg(jsonb_build_object(
        'badge_slug',    tub.badge_slug,
        'status',        tub.status,
        'issued_at',     tub.issued_at,
        'expires_at',    tub.expires_at,
        'review_due_at', tub.review_due_at
      ) ORDER BY tub.issued_at DESC)
      FROM public.training_user_badges tub
      WHERE tub.user_id = p_user_id
    )
  ) INTO result;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.training_badge_effects_payload(p_badge_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'badge_slug',         tbe.badge_slug,
    'on_platform_effect', tbe.on_platform_effect_json,
    'visible_copy',       tbe.visible_copy,
    'training_node_id',   COALESCE(tc.node_id, tc.slug),
    'level_name',         tl.level_name
  ))
  INTO result
  FROM public.training_badge_effects tbe
  JOIN public.training_catalog tc ON tc.id = tbe.training_id
  LEFT JOIN public.training_levels tl ON tl.badge_slug = tbe.badge_slug
    AND tl.training_id = tc.id
  WHERE tbe.badge_slug = p_badge_slug;
  RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.training_enterprise_payload()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN jsonb_build_object(
    'team_plans', jsonb_build_array(
      jsonb_build_object('slug','team',       'name','Team Plan',  'min_seats',2,  'max_seats',49),
      jsonb_build_object('slug','enterprise', 'name','Enterprise', 'min_seats',50, 'max_seats',null)
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
END; $$;

-- ─── 12. updated_at triggers ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_training_catalog_updated_at') THEN
    CREATE TRIGGER set_training_catalog_updated_at
      BEFORE UPDATE ON public.training_catalog
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_training_enrollments_updated_at') THEN
    CREATE TRIGGER set_training_enrollments_updated_at
      BEFORE UPDATE ON public.training_enrollments
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_training_user_badges_updated_at') THEN
    CREATE TRIGGER set_training_user_badges_updated_at
      BEFORE UPDATE ON public.training_user_badges
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
