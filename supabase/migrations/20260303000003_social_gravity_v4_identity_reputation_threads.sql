-- ============================================================================
-- Social Gravity v4.0 — Unified Identity + Reputation Graph + Thread System
-- Migration: 20260303000003
-- ============================================================================
-- Consolidates the scattered social/trust/thread tables into a clean hc_*
-- prefixed system with:
--   A) hc_identities (unified identity spine)
--   B) Reputation Graph (weighted, proof-aware, dispute-ready)
--   C) Thread System (Reddit-style, scoped to any surface)
--   D) Social Gravity Scoring (nightly computed score per entity)
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- A) UNIFIED IDENTITY SPINE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hc_identities (
  identity_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'operator' CHECK (role IN (
    'operator','broker','carrier','admin','moderator'
  )),
  country_code    CHAR(2),
  trust_tier      SMALLINT NOT NULL DEFAULT 0 CHECK (trust_tier BETWEEN 0 AND 4),
  verified_level  SMALLINT NOT NULL DEFAULT 0 CHECK (verified_level BETWEEN 0 AND 3),
  risk_flags      JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_active_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_id_user ON public.hc_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_id_country_role ON public.hc_identities(country_code, role);
CREATE INDEX IF NOT EXISTS idx_hc_id_active ON public.hc_identities(last_active_at DESC);

ALTER TABLE public.hc_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_id_read ON public.hc_identities FOR SELECT USING (true);
CREATE POLICY hc_id_self_update ON public.hc_identities FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY hc_id_service ON public.hc_identities FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_identities TO anon, authenticated;
GRANT UPDATE ON public.hc_identities TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- B) PROFILE REPUTATION GRAPH (Weighted, Proof-Aware)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── B1: Reputation Weight Matrix ─────────────────────────────────────────
-- Lookup table: actor credibility → vote weight

CREATE TABLE IF NOT EXISTS public.hc_reputation_weights (
  weight_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_trust_tier    SMALLINT NOT NULL CHECK (actor_trust_tier BETWEEN 0 AND 4),
  actor_verified_level SMALLINT NOT NULL CHECK (actor_verified_level BETWEEN 0 AND 3),
  has_evidence        BOOLEAN NOT NULL DEFAULT false,
  base_weight         NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  UNIQUE (actor_trust_tier, actor_verified_level, has_evidence)
);

INSERT INTO public.hc_reputation_weights
  (actor_trust_tier, actor_verified_level, has_evidence, base_weight)
VALUES
  (0, 0, false, 0.30),
  (0, 0, true,  0.50),
  (0, 1, false, 0.45),
  (0, 1, true,  0.65),
  (1, 1, false, 0.60),
  (1, 1, true,  0.85),
  (1, 2, false, 0.75),
  (1, 2, true,  1.00),
  (2, 2, false, 0.90),
  (2, 2, true,  1.20),
  (2, 3, false, 1.10),
  (2, 3, true,  1.40),
  (3, 3, false, 1.30),
  (3, 3, true,  1.80),
  (4, 3, false, 1.60),
  (4, 3, true,  2.20)
ON CONFLICT DO NOTHING;

ALTER TABLE public.hc_reputation_weights ENABLE ROW LEVEL SECURITY;
CREATE POLICY rw_read ON public.hc_reputation_weights FOR SELECT USING (true);
GRANT SELECT ON public.hc_reputation_weights TO anon, authenticated;


-- ── B2: Reputation Events ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_reputation_events (
  rep_event_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type        TEXT NOT NULL CHECK (subject_type IN (
    'operator','broker','corridor','port','zone','load_post'
  )),
  subject_id          TEXT NOT NULL,
  actor_identity_id   UUID NOT NULL REFERENCES public.hc_identities(identity_id),
  event_type          TEXT NOT NULL CHECK (event_type IN (
    'upvote','downvote','tag','endorsement','warning','thanks'
  )),
  reaction_tag        TEXT CHECK (reaction_tag IN (
    'reliable','fast','compliance','communication','pricing',
    'issue_reported','late','unsafe'
  )),
  weight              NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  comment_text        TEXT CHECK (comment_text IS NULL OR char_length(comment_text) <= 500),
  evidence_ref_id     UUID,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active','under_review','removed'
  )),
  moderation_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Anti-spam: one reaction_tag per actor per subject per 30 days
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_rep_event_anti_spam
  ON public.hc_reputation_events (
    actor_identity_id, subject_type, subject_id, reaction_tag,
    (date_trunc('month', created_at))
  )
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_hc_rep_event_subject
  ON public.hc_reputation_events(subject_type, subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_rep_event_actor
  ON public.hc_reputation_events(actor_identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_rep_event_status
  ON public.hc_reputation_events(status) WHERE status != 'active';

ALTER TABLE public.hc_reputation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_re_read ON public.hc_reputation_events FOR SELECT
  USING (status = 'active');
CREATE POLICY hc_re_insert ON public.hc_reputation_events FOR INSERT
  WITH CHECK (actor_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_re_moderate ON public.hc_reputation_events FOR UPDATE
  USING (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.hc_identities
    WHERE user_id = auth.uid() AND role IN ('admin','moderator')
  ));

GRANT SELECT ON public.hc_reputation_events TO anon, authenticated;
GRANT INSERT ON public.hc_reputation_events TO authenticated;


-- ── B3: Disputes ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_disputes (
  dispute_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_event_id       UUID NOT NULL REFERENCES public.hc_reputation_events(rep_event_id),
  opened_by_identity_id UUID NOT NULL REFERENCES public.hc_identities(identity_id),
  reason_code        TEXT NOT NULL CHECK (reason_code IN (
    'incorrect','fraud','harassment','spam','other'
  )),
  details            TEXT NOT NULL CHECK (char_length(details) <= 2000),
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','resolved','rejected'
  )),
  resolution         TEXT CHECK (resolution IN ('upheld','removed','edited')),
  resolved_by_identity_id UUID REFERENCES public.hc_identities(identity_id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hc_dispute_event ON public.hc_disputes(rep_event_id);
CREATE INDEX IF NOT EXISTS idx_hc_dispute_status ON public.hc_disputes(status)
  WHERE status = 'open';

ALTER TABLE public.hc_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_disp_insert ON public.hc_disputes FOR INSERT
  WITH CHECK (opened_by_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_disp_read ON public.hc_disputes FOR SELECT
  USING (
    opened_by_identity_id IN (
      SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.hc_identities
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );
CREATE POLICY hc_disp_resolve ON public.hc_disputes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.hc_identities
    WHERE user_id = auth.uid() AND role IN ('admin','moderator')
  ));

GRANT SELECT, INSERT ON public.hc_disputes TO authenticated;


-- ── B4: Subject Reputation Rollups (Materialized View) ───────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.hc_subject_reputation_rollups AS
SELECT
  subject_type,
  subject_id,
  -- Overall weighted score (0..100)
  ROUND(LEAST(100, GREATEST(0,
    (
      SUM(CASE WHEN event_type IN ('upvote','endorsement','thanks') THEN weight ELSE 0 END) -
      SUM(CASE WHEN event_type IN ('downvote','warning') THEN weight ELSE 0 END)
    ) / NULLIF(COUNT(*), 0)::numeric * 100
  ))::numeric, 1)                                AS score_overall,
  -- Per-tag scores
  ROUND(AVG(weight) FILTER (WHERE reaction_tag = 'reliable')::numeric, 2)      AS score_reliable,
  ROUND(AVG(weight) FILTER (WHERE reaction_tag = 'fast')::numeric, 2)          AS score_fast,
  ROUND(AVG(weight) FILTER (WHERE reaction_tag = 'compliance')::numeric, 2)    AS score_compliance,
  ROUND(AVG(weight) FILTER (WHERE reaction_tag = 'communication')::numeric, 2) AS score_communication,
  ROUND(AVG(weight) FILTER (WHERE reaction_tag = 'pricing')::numeric, 2)       AS score_pricing_fair,
  -- Issue rate (higher = worse)
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE reaction_tag IN ('issue_reported','late','unsafe'))
    / NULLIF(COUNT(*), 0)::numeric, 1
  )                                               AS score_issue_rate,
  -- Counts
  COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '90 days')  AS votes_count_90d,
  COUNT(*) FILTER (WHERE evidence_ref_id IS NOT NULL
    AND created_at >= now() - INTERVAL '90 days')                    AS evidence_count_90d,
  0::int                                           AS disputes_count_90d,
  now()                                            AS last_computed_at
FROM public.hc_reputation_events
WHERE status = 'active'
GROUP BY subject_type, subject_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_rollup_pk
  ON public.hc_subject_reputation_rollups(subject_type, subject_id);

GRANT SELECT ON public.hc_subject_reputation_rollups TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- C) REDDIT-STYLE THREAD SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

-- ── C1: Threads ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_threads (
  thread_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type         TEXT NOT NULL CHECK (scope_type IN (
    'operator','broker','corridor','port','zone','load_post','city','country'
  )),
  scope_id           TEXT NOT NULL,
  title              TEXT NOT NULL CHECK (char_length(title) <= 200),
  created_by_identity_id UUID NOT NULL REFERENCES public.hc_identities(identity_id),
  last_activity_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked             BOOLEAN NOT NULL DEFAULT false,
  archived           BOOLEAN NOT NULL DEFAULT false,
  visibility         TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN (
    'public','members','private'
  )),
  tags               JSONB NOT NULL DEFAULT '[]'::jsonb,
  post_count         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_thread_scope
  ON public.hc_threads(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_hc_thread_activity
  ON public.hc_threads(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_thread_scope_activity
  ON public.hc_threads(scope_type, scope_id, last_activity_at DESC);

ALTER TABLE public.hc_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_thread_read ON public.hc_threads FOR SELECT
  USING (visibility = 'public' OR created_by_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_thread_insert ON public.hc_threads FOR INSERT
  WITH CHECK (created_by_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_thread_moderate ON public.hc_threads FOR UPDATE
  USING (
    created_by_identity_id IN (
      SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.hc_identities
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );

GRANT SELECT ON public.hc_threads TO anon, authenticated;
GRANT INSERT, UPDATE ON public.hc_threads TO authenticated;


-- ── C2: Posts (threaded, weighted scoring) ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_posts (
  post_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id          UUID NOT NULL REFERENCES public.hc_threads(thread_id) ON DELETE CASCADE,
  parent_post_id     UUID REFERENCES public.hc_posts(post_id) ON DELETE CASCADE,
  author_identity_id UUID NOT NULL REFERENCES public.hc_identities(identity_id),
  body_md            TEXT NOT NULL CHECK (char_length(body_md) BETWEEN 1 AND 5000),
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active','removed','spam','under_review'
  )),
  upvotes_weighted   NUMERIC(8,2) NOT NULL DEFAULT 0,
  downvotes_weighted NUMERIC(8,2) NOT NULL DEFAULT 0,
  score_weighted     NUMERIC(8,2) NOT NULL DEFAULT 0,
  depth              SMALLINT NOT NULL DEFAULT 0,
  evidence_ref_id    UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hc_post_thread_time
  ON public.hc_posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hc_post_thread_score
  ON public.hc_posts(thread_id, score_weighted DESC);
CREATE INDEX IF NOT EXISTS idx_hc_post_author
  ON public.hc_posts(author_identity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_post_active
  ON public.hc_posts(status) WHERE status = 'active';

ALTER TABLE public.hc_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_post_read ON public.hc_posts FOR SELECT
  USING (status = 'active' OR author_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_post_insert ON public.hc_posts FOR INSERT
  WITH CHECK (
    author_identity_id IN (
      SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.hc_threads WHERE thread_id = hc_posts.thread_id AND locked = true
    )
  );
CREATE POLICY hc_post_edit ON public.hc_posts FOR UPDATE
  USING (
    author_identity_id IN (
      SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.hc_identities
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );

GRANT SELECT ON public.hc_posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.hc_posts TO authenticated;


-- ── C3: Post Votes (weighted by identity credibility) ────────────────────

CREATE TABLE IF NOT EXISTS public.hc_post_votes (
  vote_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID NOT NULL REFERENCES public.hc_posts(post_id) ON DELETE CASCADE,
  voter_identity_id  UUID NOT NULL REFERENCES public.hc_identities(identity_id),
  vote               SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  weight             NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, voter_identity_id)
);

CREATE INDEX IF NOT EXISTS idx_hc_vote_post ON public.hc_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_hc_vote_voter
  ON public.hc_post_votes(voter_identity_id, created_at DESC);

ALTER TABLE public.hc_post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_vote_read ON public.hc_post_votes FOR SELECT USING (true);
CREATE POLICY hc_vote_insert ON public.hc_post_votes FOR INSERT
  WITH CHECK (voter_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_vote_delete ON public.hc_post_votes FOR DELETE
  USING (voter_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));

GRANT SELECT ON public.hc_post_votes TO anon, authenticated;
GRANT INSERT, DELETE ON public.hc_post_votes TO authenticated;


-- ── C4: Post Reports ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hc_post_reports (
  report_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id            UUID NOT NULL REFERENCES public.hc_posts(post_id) ON DELETE CASCADE,
  reporter_identity_id UUID NOT NULL REFERENCES public.hc_identities(identity_id),
  reason_code        TEXT NOT NULL CHECK (reason_code IN (
    'spam','abuse','dox','fraud','other'
  )),
  details            TEXT CHECK (char_length(details) <= 1000),
  status             TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolved_at        TIMESTAMPTZ,
  resolved_by_identity_id UUID REFERENCES public.hc_identities(identity_id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_report_post ON public.hc_post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_hc_report_open ON public.hc_post_reports(status)
  WHERE status = 'open';

ALTER TABLE public.hc_post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY hc_report_insert ON public.hc_post_reports FOR INSERT
  WITH CHECK (reporter_identity_id IN (
    SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
  ));
CREATE POLICY hc_report_read ON public.hc_post_reports FOR SELECT
  USING (
    reporter_identity_id IN (
      SELECT identity_id FROM public.hc_identities WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.hc_identities
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );
CREATE POLICY hc_report_resolve ON public.hc_post_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.hc_identities
    WHERE user_id = auth.uid() AND role IN ('admin','moderator')
  ));

GRANT SELECT, INSERT ON public.hc_post_reports TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- D) SOCIAL GRAVITY SCORING
-- ═══════════════════════════════════════════════════════════════════════════

-- ── D1: Social Gravity Scores (nightly computed, entity-level) ───────────

CREATE TABLE IF NOT EXISTS public.hc_social_gravity_scores (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type        TEXT NOT NULL CHECK (entity_type IN (
    'operator','broker','corridor','port','zone'
  )),
  entity_id          TEXT NOT NULL,
  -- Component scores (0..1 each)
  recency_score      NUMERIC(5,4) NOT NULL DEFAULT 0,
  verification_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  evidence_score     NUMERIC(5,4) NOT NULL DEFAULT 0,
  responsiveness_score NUMERIC(5,4) NOT NULL DEFAULT 0,
  demand_score       NUMERIC(5,4) NOT NULL DEFAULT 0,
  reputation_score   NUMERIC(5,4) NOT NULL DEFAULT 0,
  coverage_score     NUMERIC(5,4) NOT NULL DEFAULT 0,
  cold_start_score   NUMERIC(5,4) NOT NULL DEFAULT 0,
  -- Composite (0..100)
  social_gravity_score SMALLINT NOT NULL DEFAULT 0 CHECK (social_gravity_score BETWEEN 0 AND 100),
  -- Metadata
  computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_hc_sgs_score
  ON public.hc_social_gravity_scores(entity_type, social_gravity_score DESC);
CREATE INDEX IF NOT EXISTS idx_hc_sgs_entity
  ON public.hc_social_gravity_scores(entity_type, entity_id);

ALTER TABLE public.hc_social_gravity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY sgs_read ON public.hc_social_gravity_scores FOR SELECT USING (true);
CREATE POLICY sgs_service ON public.hc_social_gravity_scores FOR ALL
  USING (auth.role() = 'service_role');

GRANT SELECT ON public.hc_social_gravity_scores TO anon, authenticated;


-- ── D2: Profile Strength (cold-start meter, 0..100) ─────────────────────

CREATE TABLE IF NOT EXISTS public.hc_profile_strength (
  user_id            UUID PRIMARY KEY,
  identity_verified  BOOLEAN NOT NULL DEFAULT false,
  insurance_uploaded BOOLEAN NOT NULL DEFAULT false,
  equipment_photos   BOOLEAN NOT NULL DEFAULT false,
  lane_coverage_set  BOOLEAN NOT NULL DEFAULT false,
  availability_set   BOOLEAN NOT NULL DEFAULT false,
  references_requested BOOLEAN NOT NULL DEFAULT false,
  profile_photo      BOOLEAN NOT NULL DEFAULT false,
  bio_written        BOOLEAN NOT NULL DEFAULT false,
  -- Computed score
  strength_score     SMALLINT NOT NULL DEFAULT 0 CHECK (strength_score BETWEEN 0 AND 100),
  next_step          TEXT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hc_profile_strength ENABLE ROW LEVEL SECURITY;

CREATE POLICY ps_read ON public.hc_profile_strength FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');
CREATE POLICY ps_upsert ON public.hc_profile_strength FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY ps_update ON public.hc_profile_strength FOR UPDATE
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON public.hc_profile_strength TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- E) RPCs (SECURITY DEFINER — Server-Side Logic)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── E1: Cast Reputation Event ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_cast_reputation_event(
  p_subject_type    TEXT,
  p_subject_id      TEXT,
  p_event_type      TEXT,
  p_reaction_tag    TEXT DEFAULT NULL,
  p_comment_text    TEXT DEFAULT NULL,
  p_evidence_ref_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity    public.hc_identities%ROWTYPE;
  v_weight      NUMERIC(4,2);
  v_event_id    UUID;
BEGIN
  -- Get caller identity
  SELECT * INTO v_identity
  FROM public.hc_identities
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found. Register first.';
  END IF;

  -- Downvotes require verified_level >= 2 or trust_tier >= 2
  IF p_event_type = 'downvote' AND v_identity.verified_level < 2 AND v_identity.trust_tier < 2 THEN
    RAISE EXCEPTION 'Downvoting requires verified_level >= 2 or trust_tier >= 2.';
  END IF;

  -- Lookup weight from matrix
  SELECT base_weight INTO v_weight
  FROM public.hc_reputation_weights
  WHERE actor_trust_tier = v_identity.trust_tier
    AND actor_verified_level = v_identity.verified_level
    AND has_evidence = (p_evidence_ref_id IS NOT NULL)
  LIMIT 1;

  IF v_weight IS NULL THEN
    -- Fallback: find closest match
    SELECT base_weight INTO v_weight
    FROM public.hc_reputation_weights
    WHERE actor_trust_tier <= v_identity.trust_tier
      AND actor_verified_level <= v_identity.verified_level
    ORDER BY actor_trust_tier DESC, actor_verified_level DESC
    LIMIT 1;
  END IF;

  v_weight := COALESCE(v_weight, 0.30);

  INSERT INTO public.hc_reputation_events (
    subject_type, subject_id, actor_identity_id,
    event_type, reaction_tag, weight,
    comment_text, evidence_ref_id
  ) VALUES (
    p_subject_type, p_subject_id, v_identity.identity_id,
    p_event_type, p_reaction_tag, v_weight,
    p_comment_text, p_evidence_ref_id
  )
  RETURNING rep_event_id INTO v_event_id;

  -- Update identity last_active
  UPDATE public.hc_identities
  SET last_active_at = now()
  WHERE identity_id = v_identity.identity_id;

  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_cast_reputation_event TO authenticated;


-- ── E2: Open Dispute ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_open_dispute(
  p_rep_event_id    UUID,
  p_reason_code     TEXT,
  p_details         TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity_id UUID;
  v_dispute_id  UUID;
BEGIN
  SELECT identity_id INTO v_identity_id
  FROM public.hc_identities
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found.';
  END IF;

  -- Mark the event as under review
  UPDATE public.hc_reputation_events
  SET status = 'under_review'
  WHERE rep_event_id = p_rep_event_id
    AND status = 'active';

  INSERT INTO public.hc_disputes (
    rep_event_id, opened_by_identity_id, reason_code, details
  ) VALUES (
    p_rep_event_id, v_identity_id, p_reason_code, p_details
  )
  RETURNING dispute_id INTO v_dispute_id;

  RETURN v_dispute_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_open_dispute TO authenticated;


-- ── E3: Create Thread ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_create_thread(
  p_scope_type      TEXT,
  p_scope_id        TEXT,
  p_title           TEXT,
  p_visibility      TEXT DEFAULT 'public'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity    public.hc_identities%ROWTYPE;
  v_thread_id   UUID;
BEGIN
  SELECT * INTO v_identity
  FROM public.hc_identities
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found. Register first.';
  END IF;

  -- Gate: must have verified_level >= 1 or trust_tier >= 1
  IF v_identity.verified_level < 1 AND v_identity.trust_tier < 1 THEN
    RAISE EXCEPTION 'Creating threads requires verified_level >= 1 or trust_tier >= 1.';
  END IF;

  INSERT INTO public.hc_threads (
    scope_type, scope_id, title, created_by_identity_id, visibility
  ) VALUES (
    p_scope_type, p_scope_id, p_title, v_identity.identity_id, p_visibility
  )
  RETURNING thread_id INTO v_thread_id;

  UPDATE public.hc_identities SET last_active_at = now()
  WHERE identity_id = v_identity.identity_id;

  RETURN v_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_create_thread TO authenticated;


-- ── E4: Create Post ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_create_post(
  p_thread_id       UUID,
  p_parent_post_id  UUID DEFAULT NULL,
  p_body_md         TEXT DEFAULT '',
  p_evidence_ref_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity    public.hc_identities%ROWTYPE;
  v_thread      public.hc_threads%ROWTYPE;
  v_parent_depth SMALLINT := 0;
  v_post_id     UUID;
  v_recent_count INT;
BEGIN
  SELECT * INTO v_identity
  FROM public.hc_identities
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found.';
  END IF;

  -- Check thread exists and is not locked
  SELECT * INTO v_thread
  FROM public.hc_threads
  WHERE thread_id = p_thread_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Thread not found.';
  END IF;

  IF v_thread.locked THEN
    RAISE EXCEPTION 'Thread is locked.';
  END IF;

  -- Rate limit: max 6 posts per 10 minutes
  SELECT COUNT(*) INTO v_recent_count
  FROM public.hc_posts
  WHERE author_identity_id = v_identity.identity_id
    AND created_at >= now() - INTERVAL '10 minutes';

  IF v_recent_count >= 6 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 6 posts per 10 minutes.';
  END IF;

  -- Link check: new accounts cant post links
  IF v_identity.trust_tier < 1 AND v_identity.verified_level < 1 THEN
    IF p_body_md ~ 'https?://' THEN
      RAISE EXCEPTION 'New accounts cannot post links until verified.';
    END IF;
  END IF;

  -- Compute depth from parent
  IF p_parent_post_id IS NOT NULL THEN
    SELECT depth INTO v_parent_depth
    FROM public.hc_posts
    WHERE post_id = p_parent_post_id;
    v_parent_depth := COALESCE(v_parent_depth, 0) + 1;
  END IF;

  INSERT INTO public.hc_posts (
    thread_id, parent_post_id, author_identity_id,
    body_md, depth, evidence_ref_id
  ) VALUES (
    p_thread_id, p_parent_post_id, v_identity.identity_id,
    p_body_md, v_parent_depth, p_evidence_ref_id
  )
  RETURNING post_id INTO v_post_id;

  -- Update thread counters
  UPDATE public.hc_threads
  SET last_activity_at = now(),
      post_count = post_count + 1
  WHERE thread_id = p_thread_id;

  -- Update identity last_active
  UPDATE public.hc_identities SET last_active_at = now()
  WHERE identity_id = v_identity.identity_id;

  RETURN v_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_create_post TO authenticated;


-- ── E5: Vote Post ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_vote_post(
  p_post_id    UUID,
  p_vote       INT  -- +1 or -1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity    public.hc_identities%ROWTYPE;
  v_weight      NUMERIC(4,2);
  v_old_vote    SMALLINT;
BEGIN
  IF p_vote NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Vote must be +1 or -1.';
  END IF;

  SELECT * INTO v_identity
  FROM public.hc_identities
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found.';
  END IF;

  -- Downvoting requires verified_level >= 1
  IF p_vote = -1 AND v_identity.verified_level < 1 THEN
    RAISE EXCEPTION 'Downvoting requires verified_level >= 1.';
  END IF;

  -- Compute weight
  SELECT base_weight INTO v_weight
  FROM public.hc_reputation_weights
  WHERE actor_trust_tier <= v_identity.trust_tier
    AND actor_verified_level <= v_identity.verified_level
    AND has_evidence = false
  ORDER BY actor_trust_tier DESC, actor_verified_level DESC
  LIMIT 1;

  v_weight := COALESCE(v_weight, 0.30);

  -- Check existing vote
  SELECT vote INTO v_old_vote
  FROM public.hc_post_votes
  WHERE post_id = p_post_id AND voter_identity_id = v_identity.identity_id;

  IF FOUND THEN
    -- Remove old vote impact
    UPDATE public.hc_posts SET
      upvotes_weighted = upvotes_weighted - CASE WHEN v_old_vote = 1 THEN v_weight ELSE 0 END,
      downvotes_weighted = downvotes_weighted - CASE WHEN v_old_vote = -1 THEN v_weight ELSE 0 END,
      score_weighted = score_weighted - (v_old_vote * v_weight)
    WHERE post_id = p_post_id;

    -- Update vote
    UPDATE public.hc_post_votes
    SET vote = p_vote, weight = v_weight, created_at = now()
    WHERE post_id = p_post_id AND voter_identity_id = v_identity.identity_id;
  ELSE
    INSERT INTO public.hc_post_votes (post_id, voter_identity_id, vote, weight)
    VALUES (p_post_id, v_identity.identity_id, p_vote, v_weight);
  END IF;

  -- Apply new vote impact
  UPDATE public.hc_posts SET
    upvotes_weighted = upvotes_weighted + CASE WHEN p_vote = 1 THEN v_weight ELSE 0 END,
    downvotes_weighted = downvotes_weighted + CASE WHEN p_vote = -1 THEN v_weight ELSE 0 END,
    score_weighted = score_weighted + (p_vote * v_weight)
  WHERE post_id = p_post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_vote_post TO authenticated;


-- ── E6: Report Post ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_report_post(
  p_post_id      UUID,
  p_reason_code  TEXT,
  p_details      TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity_id UUID;
  v_report_id   UUID;
BEGIN
  SELECT identity_id INTO v_identity_id
  FROM public.hc_identities WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identity not found.';
  END IF;

  INSERT INTO public.hc_post_reports (
    post_id, reporter_identity_id, reason_code, details
  ) VALUES (
    p_post_id, v_identity_id, p_reason_code, p_details
  )
  RETURNING report_id INTO v_report_id;

  RETURN v_report_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_report_post TO authenticated;


-- ── E7: Lock/Unlock Thread ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_lock_thread(
  p_thread_id    UUID,
  p_locked       BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins/moderators
  IF NOT EXISTS (
    SELECT 1 FROM public.hc_identities
    WHERE user_id = auth.uid() AND role IN ('admin','moderator')
  ) THEN
    RAISE EXCEPTION 'Only admins/moderators can lock threads.';
  END IF;

  UPDATE public.hc_threads
  SET locked = p_locked
  WHERE thread_id = p_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_lock_thread TO authenticated;


-- ── E8: Refresh Reputation Rollup ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_refresh_reputation_rollup(
  p_subject_type TEXT DEFAULT NULL,
  p_subject_id   TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.hc_subject_reputation_rollups;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_refresh_reputation_rollup TO authenticated;


-- ── E9: Compute Profile Strength ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.hc_compute_profile_strength(
  p_user_id UUID
)
RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score   SMALLINT := 0;
  v_next    TEXT := 'Complete your profile';
  v_ps      public.hc_profile_strength%ROWTYPE;
BEGIN
  SELECT * INTO v_ps
  FROM public.hc_profile_strength
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.hc_profile_strength (user_id) VALUES (p_user_id);
    RETURN 0;
  END IF;

  -- Each item = 12.5 points (8 items = 100)
  v_score := (
    (CASE WHEN v_ps.identity_verified THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.insurance_uploaded THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.equipment_photos THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.lane_coverage_set THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.availability_set THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.references_requested THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.profile_photo THEN 1 ELSE 0 END) +
    (CASE WHEN v_ps.bio_written THEN 1 ELSE 0 END)
  ) * 12;

  -- Cap at 100
  v_score := LEAST(100, v_score + 4);  -- rounding bonus

  -- Determine next step
  IF NOT v_ps.identity_verified THEN v_next := 'Verify your identity';
  ELSIF NOT v_ps.profile_photo THEN v_next := 'Upload a profile photo';
  ELSIF NOT v_ps.insurance_uploaded THEN v_next := 'Upload insurance docs';
  ELSIF NOT v_ps.equipment_photos THEN v_next := 'Add equipment photos';
  ELSIF NOT v_ps.lane_coverage_set THEN v_next := 'Set your lane coverage';
  ELSIF NOT v_ps.availability_set THEN v_next := 'Toggle your availability';
  ELSIF NOT v_ps.bio_written THEN v_next := 'Write your bio';
  ELSIF NOT v_ps.references_requested THEN v_next := 'Request broker references';
  ELSE v_next := NULL;
  END IF;

  UPDATE public.hc_profile_strength
  SET strength_score = v_score,
      next_step = v_next,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_compute_profile_strength TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- F) VIEWS FOR UI CONSUMPTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Thread feed with post counts + last activity
CREATE OR REPLACE VIEW public.v_hc_thread_feed AS
SELECT
  t.*,
  i.user_id AS author_user_id,
  (SELECT COUNT(*) FROM public.hc_posts p WHERE p.thread_id = t.thread_id AND p.status = 'active') AS active_post_count,
  (SELECT body_md FROM public.hc_posts p
   WHERE p.thread_id = t.thread_id AND p.parent_post_id IS NULL AND p.status = 'active'
   ORDER BY p.created_at LIMIT 1) AS first_post_preview
FROM public.hc_threads t
JOIN public.hc_identities i ON i.identity_id = t.created_by_identity_id
WHERE t.archived = false;

GRANT SELECT ON public.v_hc_thread_feed TO anon, authenticated;

-- Active threads by scope (for embedding on pages)
CREATE OR REPLACE VIEW public.v_hc_active_threads_by_scope AS
SELECT
  scope_type,
  scope_id,
  COUNT(*) AS thread_count,
  MAX(last_activity_at) AS latest_activity,
  SUM(post_count) AS total_posts
FROM public.hc_threads
WHERE archived = false AND visibility = 'public'
GROUP BY scope_type, scope_id;

GRANT SELECT ON public.v_hc_active_threads_by_scope TO anon, authenticated;

COMMIT;
