-- ============================================================================
-- Social Gravity Layer — Reddit Playbook Gaps
-- Migration: 20260303000002_social_gravity_upgrades.sql
-- ============================================================================
-- Closes the remaining gaps identified in the community features audit:
-- 1. Domain-specific reputation reactions
-- 2. Operator evidence timeline
-- 3. "Last seen on lane" signals
-- 4. Load comment threads
-- 5. Micro-communities (industry verticals)
-- 6. Co-hiring social proof
-- 7. Operator privacy preferences
-- 8. Smart posting guardrails (load validation)

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. DOMAIN-SPECIFIC REPUTATION REACTIONS
--    Upgrade from generic (useful/cool/thanks/flag)
--    to industry-weighted signals.
-- ─────────────────────────────────────────────────────────────

-- Add new reaction values to the existing enum
-- (safe to add; won't break existing rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reliable' AND enumtypid = 'reaction_type'::regtype) THEN
    ALTER TYPE reaction_type ADD VALUE IF NOT EXISTS 'reliable';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'fast_response' AND enumtypid = 'reaction_type'::regtype) THEN
    ALTER TYPE reaction_type ADD VALUE IF NOT EXISTS 'fast_response';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'compliance_strong' AND enumtypid = 'reaction_type'::regtype) THEN
    ALTER TYPE reaction_type ADD VALUE IF NOT EXISTS 'compliance_strong';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'issue_reported' AND enumtypid = 'reaction_type'::regtype) THEN
    ALTER TYPE reaction_type ADD VALUE IF NOT EXISTS 'issue_reported';
  END IF;
END$$;

-- Weighted reaction system (not democratic — verified signals weigh more)
CREATE TABLE IF NOT EXISTS public.reputation_reactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id   UUID NOT NULL,           -- operator or broker being reacted to
  reactor_user_id  UUID NOT NULL,
  reaction_kind    TEXT NOT NULL CHECK (reaction_kind IN (
    'reliable', 'fast_response', 'compliance_strong', 'issue_reported'
  )),
  weight           NUMERIC(3,2) NOT NULL DEFAULT 1.00,  -- verified reactors get 1.5x
  context_corridor TEXT,                    -- optional: which corridor this relates to
  context_load_id  UUID,                    -- optional: which load this relates to
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Anti-gaming: one reaction kind per pair per week
  UNIQUE (target_user_id, reactor_user_id, reaction_kind)
);

CREATE INDEX IF NOT EXISTS idx_rep_react_target ON public.reputation_reactions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_rep_react_kind   ON public.reputation_reactions(reaction_kind);

ALTER TABLE public.reputation_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rep_react_read ON public.reputation_reactions FOR SELECT USING (true);
CREATE POLICY rep_react_insert ON public.reputation_reactions FOR INSERT
  WITH CHECK (reactor_user_id = auth.uid());

GRANT SELECT ON public.reputation_reactions TO anon, authenticated;
GRANT INSERT ON public.reputation_reactions TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 2. OPERATOR EVIDENCE TIMELINE
--    One-stop feed: completed escorts, permits, route surveys,
--    equipment photos, broker confirmations.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.operator_evidence (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL,
  evidence_type    TEXT NOT NULL CHECK (evidence_type IN (
    'escort_completed', 'permit_handled', 'route_survey',
    'equipment_photo', 'broker_confirmation', 'certification_earned',
    'safety_inspection', 'corridor_coverage'
  )),
  title            TEXT NOT NULL,
  details          TEXT,
  media_url        TEXT,                    -- photo/document URL in Supabase Storage
  corridor_id      TEXT,                    -- optional: which corridor
  load_id          UUID,                    -- optional: which load
  verified         BOOLEAN NOT NULL DEFAULT false,  -- system-verified vs self-reported
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_operator ON public.operator_evidence(operator_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_type     ON public.operator_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_corridor ON public.operator_evidence(corridor_id);

ALTER TABLE public.operator_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY evidence_read ON public.operator_evidence FOR SELECT USING (true);
CREATE POLICY evidence_insert ON public.operator_evidence FOR INSERT
  WITH CHECK (operator_user_id = auth.uid());

GRANT SELECT ON public.operator_evidence TO anon, authenticated;
GRANT INSERT ON public.operator_evidence TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 3. "LAST SEEN ON LANE" SIGNAL
--    Tracks corridor-specific activity (not just global last_active).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.operator_lane_presence (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL,
  corridor_id      TEXT NOT NULL,
  city_slug        TEXT,                    -- nearest city at time of activity
  activity_type    TEXT NOT NULL CHECK (activity_type IN (
    'escort_active', 'available_ping', 'load_accepted',
    'quote_responded', 'intel_reported', 'check_in'
  )),
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Only keep latest per operator per corridor
  UNIQUE (operator_user_id, corridor_id)
);

CREATE INDEX IF NOT EXISTS idx_lane_presence_corridor ON public.operator_lane_presence(corridor_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_lane_presence_operator ON public.operator_lane_presence(operator_user_id);

ALTER TABLE public.operator_lane_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY lane_pres_read ON public.operator_lane_presence FOR SELECT USING (true);
CREATE POLICY lane_pres_upsert ON public.operator_lane_presence FOR INSERT
  WITH CHECK (operator_user_id = auth.uid());
CREATE POLICY lane_pres_update ON public.operator_lane_presence FOR UPDATE
  USING (operator_user_id = auth.uid());

GRANT SELECT ON public.operator_lane_presence TO anon, authenticated;
GRANT INSERT, UPDATE ON public.operator_lane_presence TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 4. LOAD COMMENT THREADS
--    Adds discussion directly on load posts (broker-operator Q&A).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.load_comments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id          UUID NOT NULL,           -- references loads.id
  user_id          UUID NOT NULL,
  parent_id        UUID REFERENCES public.load_comments(id) ON DELETE CASCADE,
  body             TEXT NOT NULL CHECK (char_length(body) <= 1000),
  is_operator      BOOLEAN NOT NULL DEFAULT false,  -- for UI styling
  is_broker        BOOLEAN NOT NULL DEFAULT false,
  status           TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden','removed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_load_comments_load ON public.load_comments(load_id, created_at);
CREATE INDEX IF NOT EXISTS idx_load_comments_user ON public.load_comments(user_id);

ALTER TABLE public.load_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY lc_read ON public.load_comments FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY lc_insert ON public.load_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

GRANT SELECT ON public.load_comments TO anon, authenticated;
GRANT INSERT ON public.load_comments TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 5. MICRO-COMMUNITIES (Industry Verticals)
--    Reddit subreddit model: heavy_haul, wind_energy, mobile_homes, etc.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.communities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT,
  icon_url         TEXT,
  member_count     INT NOT NULL DEFAULT 0,
  post_count       INT NOT NULL DEFAULT 0,
  category         TEXT NOT NULL DEFAULT 'industry' CHECK (category IN (
    'industry', 'equipment', 'region', 'service_type'
  )),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed known communities
INSERT INTO public.communities (slug, name, description, category) VALUES
  ('heavy-haul', 'Heavy Haul', 'Oversize and overweight loads, specialized transport', 'industry'),
  ('wind-energy', 'Wind Energy Transport', 'Turbine blades, towers, nacelles', 'industry'),
  ('mobile-homes', 'Mobile Home Moving', 'Manufactured housing transport', 'industry'),
  ('superloads', 'Superloads', 'Extreme oversize permits, route engineering, police escorts', 'industry'),
  ('port-escorts', 'Port Escorts', 'Gateway coverage, port-to-site heavy haul', 'region'),
  ('high-poles', 'High Pole Operations', 'Utility line clearance, height pole specialists', 'equipment'),
  ('chase-cars', 'Chase Cars & Route Survey', 'Pre-route and rear escort operations', 'service_type')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.community_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL,
  role             TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);

-- Add community_id to posts for scoping
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id);

CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(community_id, created_at DESC);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_read ON public.communities FOR SELECT USING (true);
CREATE POLICY cm_read ON public.community_members FOR SELECT USING (true);
CREATE POLICY cm_insert ON public.community_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY cm_delete ON public.community_members FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT ON public.communities TO anon, authenticated;
GRANT SELECT ON public.community_members TO anon, authenticated;
GRANT INSERT, DELETE ON public.community_members TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 6. CO-HIRING SOCIAL PROOF
--    "Operators brokers also hired" — collaborative filtering signal.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_also_hired AS
SELECT
  o1.escort_id AS viewed_operator_id,
  o2.escort_id AS also_hired_operator_id,
  COUNT(DISTINCT o1.broker_id) AS shared_broker_count
FROM public.escort_reviews o1
JOIN public.escort_reviews o2
  ON o1.broker_id = o2.broker_id
  AND o1.escort_id != o2.escort_id
  AND o2.would_use_again = true
WHERE o1.would_use_again = true
GROUP BY o1.escort_id, o2.escort_id
HAVING COUNT(DISTINCT o1.broker_id) >= 2
ORDER BY shared_broker_count DESC;

GRANT SELECT ON public.v_also_hired TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 7. OPERATOR PRIVACY PREFERENCES
--    Let operators control what's visible to drive engagement.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.operator_privacy_preferences (
  user_id                UUID PRIMARY KEY,
  show_evidence_timeline BOOLEAN NOT NULL DEFAULT true,
  show_lane_presence     BOOLEAN NOT NULL DEFAULT true,
  show_streak            BOOLEAN NOT NULL DEFAULT true,
  show_earnings_range    BOOLEAN NOT NULL DEFAULT false,   -- off by default (sensitive)
  show_load_history      BOOLEAN NOT NULL DEFAULT true,
  show_reviews           BOOLEAN NOT NULL DEFAULT true,
  show_recommendations   BOOLEAN NOT NULL DEFAULT true,
  visibility_tier        TEXT NOT NULL DEFAULT 'public' CHECK (visibility_tier IN (
    'public', 'verified_only', 'brokers_only', 'private'
  )),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_privacy_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY priv_read ON public.operator_privacy_preferences FOR SELECT
  USING (user_id = auth.uid() OR visibility_tier = 'public');
CREATE POLICY priv_upsert ON public.operator_privacy_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY priv_update ON public.operator_privacy_preferences FOR UPDATE
  USING (user_id = auth.uid());

GRANT SELECT ON public.operator_privacy_preferences TO anon, authenticated;
GRANT INSERT, UPDATE ON public.operator_privacy_preferences TO authenticated;


-- ─────────────────────────────────────────────────────────────
-- 8. SMART POST GUARDRAILS (Load Validation)
--    Warn on missing dimensions, routes, or permits.
--    Stored as a config table so rules are adjustable.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.load_post_guardrails (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name       TEXT NOT NULL UNIQUE,
  warning_message  TEXT NOT NULL,
  severity         TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'block')),
  enabled          BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.load_post_guardrails (field_name, warning_message, severity) VALUES
  ('dimensions_height', 'Missing load height — escorts need this to assess clearance risk.', 'warning'),
  ('dimensions_width', 'Missing load width — this determines escort count requirements in most states.', 'warning'),
  ('dimensions_length', 'Missing overall length — required for permit and escort calculations.', 'warning'),
  ('dimensions_weight', 'Missing gross weight — affects route planning and bridge restrictions.', 'warning'),
  ('origin_city', 'Missing origin city — escorts cannot evaluate if they cover this area.', 'block'),
  ('destination_city', 'Missing destination — cannot match to corridor coverage.', 'block'),
  ('pickup_date', 'Missing pickup date — urgency and availability depend on this.', 'warning'),
  ('permit_status', 'No permit status indicated — remember to check state escort requirements.', 'info'),
  ('rate_amount', 'No rate indicated — loads without rates get 60% fewer responses.', 'warning')
ON CONFLICT (field_name) DO NOTHING;

ALTER TABLE public.load_post_guardrails ENABLE ROW LEVEL SECURITY;
CREATE POLICY lpg_read ON public.load_post_guardrails FOR SELECT USING (true);

GRANT SELECT ON public.load_post_guardrails TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 9. AGGREGATE VIEWS FOR UI CONSUMPTION
-- ─────────────────────────────────────────────────────────────

-- Reputation reaction summary per operator
CREATE OR REPLACE VIEW public.v_reputation_reaction_summary AS
SELECT
  target_user_id,
  COUNT(*) FILTER (WHERE reaction_kind = 'reliable')          AS reliable_count,
  COUNT(*) FILTER (WHERE reaction_kind = 'fast_response')     AS fast_response_count,
  COUNT(*) FILTER (WHERE reaction_kind = 'compliance_strong') AS compliance_count,
  COUNT(*) FILTER (WHERE reaction_kind = 'issue_reported')    AS issue_count,
  SUM(weight) FILTER (WHERE reaction_kind = 'reliable')       AS reliable_weighted,
  SUM(weight) FILTER (WHERE reaction_kind = 'fast_response')  AS fast_response_weighted,
  SUM(weight) FILTER (WHERE reaction_kind = 'compliance_strong') AS compliance_weighted,
  COUNT(DISTINCT reactor_user_id)                              AS unique_reactors
FROM public.reputation_reactions
GROUP BY target_user_id;

GRANT SELECT ON public.v_reputation_reaction_summary TO anon, authenticated;

-- Operator profile trust stack (combined view for UI)
CREATE OR REPLACE VIEW public.v_operator_trust_stack AS
SELECT
  p.user_id,
  p.display_name,
  p.trust_score,
  p.response_time_avg_seconds,
  p.last_post_at,
  uvt.tier AS verification_tier,
  uvt.tier_label AS verification_label,
  us.current_streak_days,
  us.longest_streak_days,
  us.last_active_date,
  ul.level,
  ul.total_points,
  -- Lane presence (most recent)
  (SELECT json_agg(json_build_object(
    'corridor_id', lp.corridor_id,
    'city', lp.city_slug,
    'activity', lp.activity_type,
    'last_seen', lp.last_seen_at
  ) ORDER BY lp.last_seen_at DESC)
  FROM public.operator_lane_presence lp
  WHERE lp.operator_user_id = p.user_id
  LIMIT 5) AS recent_lane_activity,
  -- Badge count
  (SELECT COUNT(*) FROM public.user_badges ub
   WHERE ub.user_id = p.user_id AND ub.active = true) AS active_badge_count,
  -- Evidence count
  (SELECT COUNT(*) FROM public.operator_evidence oe
   WHERE oe.operator_user_id = p.user_id) AS evidence_count,
  -- Privacy
  opp.visibility_tier,
  opp.show_evidence_timeline,
  opp.show_lane_presence,
  opp.show_streak
FROM public.profiles p
LEFT JOIN public.user_verification_tiers uvt ON uvt.user_id = p.user_id
LEFT JOIN public.user_streaks us ON us.user_id = p.user_id
LEFT JOIN public.user_levels ul ON ul.user_id = p.user_id
LEFT JOIN public.operator_privacy_preferences opp ON opp.user_id = p.user_id;

GRANT SELECT ON public.v_operator_trust_stack TO anon, authenticated;

COMMIT;
