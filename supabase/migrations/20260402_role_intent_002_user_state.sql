-- ============================================================================
-- HAUL COMMAND: Role + Intent Engine — Step 2: User State + Behavior Tables
-- Tables: hc_user_role_state, hc_user_intent_scores, hc_mode_sessions,
--         hc_user_completion_state, hc_next_move_impressions, hc_next_move_clicks
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. hc_user_role_state — Persistent role / intent / mode state per user
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_user_role_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  family_key text REFERENCES public.hc_role_families(family_key),
  role_key text REFERENCES public.hc_roles(role_key),
  primary_intent_key text REFERENCES public.hc_intents(intent_key),
  secondary_intent_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_mode_key text REFERENCES public.hc_modes(mode_key),
  current_stage_key text,
  market_country_code text,
  market_region_code text,
  market_city_slug text,
  profile_completion_score integer NOT NULL DEFAULT 0,
  claim_state text,
  last_action_key text,
  last_action_at timestamptz,
  onboarding_completed_at timestamptz,
  updated_by_behavior_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_user_role_state_role
  ON public.hc_user_role_state(role_key);
CREATE INDEX IF NOT EXISTS idx_hc_user_role_state_intent
  ON public.hc_user_role_state(primary_intent_key);
CREATE INDEX IF NOT EXISTS idx_hc_user_role_state_mode
  ON public.hc_user_role_state(current_mode_key);
CREATE INDEX IF NOT EXISTS idx_hc_user_role_state_market
  ON public.hc_user_role_state(market_country_code, market_region_code);

DROP TRIGGER IF EXISTS trg_hc_user_role_state_updated_at ON public.hc_user_role_state;
CREATE TRIGGER trg_hc_user_role_state_updated_at
  BEFORE UPDATE ON public.hc_user_role_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. hc_user_intent_scores — Behavior-based intent scoring
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_user_intent_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  intent_key text NOT NULL REFERENCES public.hc_intents(intent_key),
  score numeric NOT NULL DEFAULT 0,
  last_reinforced_at timestamptz,
  source_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, intent_key)
);

CREATE INDEX IF NOT EXISTS idx_hc_user_intent_scores_user
  ON public.hc_user_intent_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_user_intent_scores_intent
  ON public.hc_user_intent_scores(intent_key);

DROP TRIGGER IF EXISTS trg_hc_user_intent_scores_updated_at ON public.hc_user_intent_scores;
CREATE TRIGGER trg_hc_user_intent_scores_updated_at
  BEFORE UPDATE ON public.hc_user_intent_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. hc_mode_sessions — Track mode usage
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_mode_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode_key text NOT NULL REFERENCES public.hc_modes(mode_key),
  source_key text,
  current_path text,
  market_country_code text,
  market_region_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_hc_mode_sessions_user_started
  ON public.hc_mode_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_mode_sessions_mode
  ON public.hc_mode_sessions(mode_key);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. hc_user_completion_state — Track completion gates per user
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_user_completion_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gate_key text NOT NULL REFERENCES public.hc_completion_gates(gate_key),
  status text NOT NULL,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, gate_key)
);

CREATE INDEX IF NOT EXISTS idx_hc_user_completion_state_user
  ON public.hc_user_completion_state(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_user_completion_state_gate
  ON public.hc_user_completion_state(gate_key);

DROP TRIGGER IF EXISTS trg_hc_user_completion_state_updated_at ON public.hc_user_completion_state;
CREATE TRIGGER trg_hc_user_completion_state_updated_at
  BEFORE UPDATE ON public.hc_user_completion_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. hc_next_move_impressions — Track shown next-move modules
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_next_move_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role_key text,
  intent_key text,
  mode_key text,
  page_type_key text,
  rule_id uuid,
  current_path text,
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_next_move_impressions_user_shown
  ON public.hc_next_move_impressions(user_id, shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_next_move_impressions_rule
  ON public.hc_next_move_impressions(rule_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. hc_next_move_clicks — Track clicked next-move actions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hc_next_move_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role_key text,
  intent_key text,
  mode_key text,
  action_key text,
  rule_id uuid,
  current_path text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hc_next_move_clicks_user_clicked
  ON public.hc_next_move_clicks(user_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_hc_next_move_clicks_action
  ON public.hc_next_move_clicks(action_key);

COMMIT;
