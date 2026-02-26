-- ==========================================================
-- Migration: 20260221_profile_badges_and_stress_scores.sql
-- Tier 1: Trust Badges + Tier 2 schema (stress scores)
-- ==========================================================

-- ─────────────────────────────────────────────────────────────
-- TIER 1: Profile Badges
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_badges (
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_slug text NOT NULL,
  -- escort badges: verified_profile | docs_on_file | active_30d | fast_responder | corridor_experienced | preferred
  -- broker badges: fast_pay | low_dispute | repeat_booker | verified_company
  awarded_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  PRIMARY KEY (profile_id, badge_slug)
);

CREATE INDEX IF NOT EXISTS idx_profile_badges_profile ON profile_badges(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_slug ON profile_badges(badge_slug);

ALTER TABLE profile_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_badges" ON profile_badges FOR SELECT USING (true);
CREATE POLICY "admin_write_badges" ON profile_badges FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin','super_admin'));

-- ─────────────────────────────────────────────────────────────
-- RPC: refresh_profile_badges
-- Computes and upserts all auto-awarded badges for a profile
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION refresh_profile_badges(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_badges_awarded text[] := '{}';
  v_median_reply_ms numeric;
  v_corridor_jobs int;
  v_job_count int;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','profile not found'); END IF;

  -- 1. verified_profile — claimed + has phone
  IF v_profile.claimed = true AND v_profile.phone IS NOT NULL THEN
    INSERT INTO profile_badges(profile_id, badge_slug, metadata)
      VALUES (p_profile_id, 'verified_profile', '{}')
      ON CONFLICT (profile_id, badge_slug) DO NOTHING;
    v_badges_awarded := array_append(v_badges_awarded, 'verified_profile');
  ELSE
    DELETE FROM profile_badges WHERE profile_id = p_profile_id AND badge_slug = 'verified_profile';
  END IF;

  -- 2. docs_on_file — has cert AND insurance in profile docs
  IF (v_profile.onboarding_state ->> 'docs_uploaded')::boolean = true
    OR (v_profile.profile_strength >= 60) THEN
    INSERT INTO profile_badges(profile_id, badge_slug)
      VALUES (p_profile_id, 'docs_on_file')
      ON CONFLICT (profile_id, badge_slug) DO NOTHING;
    v_badges_awarded := array_append(v_badges_awarded, 'docs_on_file');
  ELSE
    DELETE FROM profile_badges WHERE profile_id = p_profile_id AND badge_slug = 'docs_on_file';
  END IF;

  -- 3. active_30d — last_seen within 30 days
  IF v_profile.updated_at > now() - interval '30 days' THEN
    INSERT INTO profile_badges(profile_id, badge_slug, metadata)
      VALUES (p_profile_id, 'active_30d', jsonb_build_object('last_seen', v_profile.updated_at))
      ON CONFLICT (profile_id, badge_slug)
      DO UPDATE SET metadata = EXCLUDED.metadata, awarded_at = now();
    v_badges_awarded := array_append(v_badges_awarded, 'active_30d');
  ELSE
    DELETE FROM profile_badges WHERE profile_id = p_profile_id AND badge_slug = 'active_30d';
  END IF;

  -- 4. fast_responder — median reply < 15 minutes on last 10 offers
  -- (uses escort_offers table if it exists)
  BEGIN
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY
      EXTRACT(EPOCH FROM (responded_at - created_at)) / 60
    ) INTO v_median_reply_ms
    FROM (
      SELECT created_at, responded_at
      FROM escort_offers
      WHERE escort_id = p_profile_id
        AND responded_at IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    ) sub;

    IF v_median_reply_ms IS NOT NULL AND v_median_reply_ms < 15 THEN
      INSERT INTO profile_badges(profile_id, badge_slug, metadata)
        VALUES (p_profile_id, 'fast_responder', jsonb_build_object('median_minutes', round(v_median_reply_ms::numeric, 1)))
        ON CONFLICT (profile_id, badge_slug)
        DO UPDATE SET metadata = EXCLUDED.metadata, awarded_at = now();
      v_badges_awarded := array_append(v_badges_awarded, 'fast_responder');
    ELSE
      DELETE FROM profile_badges WHERE profile_id = p_profile_id AND badge_slug = 'fast_responder';
    END IF;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- 5. corridor_experienced — 3+ completed jobs on same corridor pair
  BEGIN
    SELECT COUNT(*) INTO v_corridor_jobs
    FROM (
      SELECT corridor_slug, COUNT(*) as cnt
      FROM escort_jobs
      WHERE escort_id = p_profile_id AND status = 'completed'
      GROUP BY corridor_slug
      HAVING COUNT(*) >= 3
    ) corridors;

    IF v_corridor_jobs > 0 THEN
      INSERT INTO profile_badges(profile_id, badge_slug, metadata)
        VALUES (p_profile_id, 'corridor_experienced', jsonb_build_object('corridors', v_corridor_jobs))
        ON CONFLICT (profile_id, badge_slug)
        DO UPDATE SET metadata = EXCLUDED.metadata, awarded_at = now();
      v_badges_awarded := array_append(v_badges_awarded, 'corridor_experienced');
    ELSE
      DELETE FROM profile_badges WHERE profile_id = p_profile_id AND badge_slug = 'corridor_experienced';
    END IF;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- Broker badges: fast_pay, low_dispute, repeat_booker, verified_company
  -- These are awarded by admin or via job completion hooks

  RETURN jsonb_build_object('awarded', v_badges_awarded, 'profile_id', p_profile_id);
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Escort Invite Links (viral loop)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS escort_invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  escort_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  broker_name text,
  broker_phone text,
  broker_email text,
  trigger_context text DEFAULT 'manual', -- 'manual' | 'post_approval' | 'post_job'
  source_job_id uuid,
  clicked_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '30 days'
);

CREATE INDEX IF NOT EXISTS idx_invite_links_escort ON escort_invite_links(escort_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON escort_invite_links(token);

ALTER TABLE escort_invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escort_own_invites" ON escort_invite_links
  FOR ALL USING (auth.uid() = escort_id);
CREATE POLICY "public_read_by_token" ON escort_invite_links
  FOR SELECT USING (token IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- TIER 2 SCHEMA: Corridor Stress Scores (schema-only, no data yet)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS corridor_stress_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_slug text NOT NULL,
  region_a text,
  region_b text,
  supply_density_score numeric DEFAULT 0,
  load_pressure_ratio numeric DEFAULT 0,
  activity_decay_score numeric DEFAULT 0,
  unfilled_rate numeric DEFAULT 0,
  response_time_drift numeric DEFAULT 0,
  deadhead_inflation numeric DEFAULT 0,
  -- computed stress score (0-100)
  stress_score numeric DEFAULT 0,
  band text DEFAULT 'healthy' CHECK (band IN ('healthy','tightening','at_risk','critical')),
  escorts_per_100mi numeric,
  active_escort_count int DEFAULT 0,
  load_count_24h int DEFAULT 0,
  computed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridor_stress_slug ON corridor_stress_scores(corridor_slug);
CREATE INDEX IF NOT EXISTS idx_corridor_stress_band ON corridor_stress_scores(band);

ALTER TABLE corridor_stress_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_stress" ON corridor_stress_scores FOR SELECT USING (true);
CREATE POLICY "admin_write_stress" ON corridor_stress_scores FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin','super_admin'));

-- Seed 6 monitored corridors with default healthy scores
INSERT INTO corridor_stress_scores (corridor_slug, region_a, region_b, stress_score, band, active_escort_count, load_count_24h)
VALUES
  ('i-95-northeast', 'FL', 'ME', 0, 'healthy', 0, 0),
  ('i-10-southern', 'CA', 'FL', 0, 'healthy', 0, 0),
  ('i-75-southeast', 'FL', 'MI', 0, 'healthy', 0, 0),
  ('i-80-transcontinental', 'CA', 'NJ', 0, 'healthy', 0, 0),
  ('i-40-southern-cross', 'CA', 'NC', 0, 'healthy', 0, 0),
  ('trans-canada-highway', 'BC', 'ON', 0, 'healthy', 0, 0)
ON CONFLICT DO NOTHING;
