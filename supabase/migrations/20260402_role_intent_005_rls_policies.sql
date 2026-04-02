-- ============================================================================
-- HAUL COMMAND: Role + Intent Engine — Step 5: RLS Policies
-- Enable RLS and create policies for all user-state/private tables
-- Public catalog tables get public read access
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION A: Enable RLS on private/user-state tables
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.hc_user_role_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_user_intent_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_mode_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_user_completion_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_next_move_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_next_move_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_entity_contact_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_listing_shell_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_listing_shell_events ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION B: hc_user_role_state — users own their role state
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_user_role_state_select_own" ON public.hc_user_role_state;
CREATE POLICY "hc_user_role_state_select_own"
  ON public.hc_user_role_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_role_state_insert_own" ON public.hc_user_role_state;
CREATE POLICY "hc_user_role_state_insert_own"
  ON public.hc_user_role_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_role_state_update_own" ON public.hc_user_role_state;
CREATE POLICY "hc_user_role_state_update_own"
  ON public.hc_user_role_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_role_state_service_all" ON public.hc_user_role_state;
CREATE POLICY "hc_user_role_state_service_all"
  ON public.hc_user_role_state FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION C: hc_user_intent_scores — users own their scores
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_user_intent_scores_select_own" ON public.hc_user_intent_scores;
CREATE POLICY "hc_user_intent_scores_select_own"
  ON public.hc_user_intent_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_intent_scores_insert_own" ON public.hc_user_intent_scores;
CREATE POLICY "hc_user_intent_scores_insert_own"
  ON public.hc_user_intent_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_intent_scores_update_own" ON public.hc_user_intent_scores;
CREATE POLICY "hc_user_intent_scores_update_own"
  ON public.hc_user_intent_scores FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_intent_scores_service_all" ON public.hc_user_intent_scores;
CREATE POLICY "hc_user_intent_scores_service_all"
  ON public.hc_user_intent_scores FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION D: hc_mode_sessions — users own their sessions
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_mode_sessions_select_own" ON public.hc_mode_sessions;
CREATE POLICY "hc_mode_sessions_select_own"
  ON public.hc_mode_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_mode_sessions_insert_own" ON public.hc_mode_sessions;
CREATE POLICY "hc_mode_sessions_insert_own"
  ON public.hc_mode_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_mode_sessions_update_own" ON public.hc_mode_sessions;
CREATE POLICY "hc_mode_sessions_update_own"
  ON public.hc_mode_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_mode_sessions_service_all" ON public.hc_mode_sessions;
CREATE POLICY "hc_mode_sessions_service_all"
  ON public.hc_mode_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION E: hc_user_completion_state — users own their gates
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_user_completion_state_select_own" ON public.hc_user_completion_state;
CREATE POLICY "hc_user_completion_state_select_own"
  ON public.hc_user_completion_state FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_completion_state_insert_own" ON public.hc_user_completion_state;
CREATE POLICY "hc_user_completion_state_insert_own"
  ON public.hc_user_completion_state FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_completion_state_update_own" ON public.hc_user_completion_state;
CREATE POLICY "hc_user_completion_state_update_own"
  ON public.hc_user_completion_state FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_user_completion_state_service_all" ON public.hc_user_completion_state;
CREATE POLICY "hc_user_completion_state_service_all"
  ON public.hc_user_completion_state FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION F: hc_next_move_impressions — users + anon can insert
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_next_move_impressions_select_own" ON public.hc_next_move_impressions;
CREATE POLICY "hc_next_move_impressions_select_own"
  ON public.hc_next_move_impressions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_next_move_impressions_insert_own_or_anon" ON public.hc_next_move_impressions;
CREATE POLICY "hc_next_move_impressions_insert_own_or_anon"
  ON public.hc_next_move_impressions FOR INSERT TO authenticated, anon
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_next_move_impressions_service_all" ON public.hc_next_move_impressions;
CREATE POLICY "hc_next_move_impressions_service_all"
  ON public.hc_next_move_impressions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION G: hc_next_move_clicks — users + anon can insert
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_next_move_clicks_select_own" ON public.hc_next_move_clicks;
CREATE POLICY "hc_next_move_clicks_select_own"
  ON public.hc_next_move_clicks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_next_move_clicks_insert_own_or_anon" ON public.hc_next_move_clicks;
CREATE POLICY "hc_next_move_clicks_insert_own_or_anon"
  ON public.hc_next_move_clicks FOR INSERT TO authenticated, anon
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "hc_next_move_clicks_service_all" ON public.hc_next_move_clicks;
CREATE POLICY "hc_next_move_clicks_service_all"
  ON public.hc_next_move_clicks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION H: Service-role-only tables (ingestion/shell pipeline)
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "hc_entity_contact_observations_service_all" ON public.hc_entity_contact_observations;
CREATE POLICY "hc_entity_contact_observations_service_all"
  ON public.hc_entity_contact_observations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "hc_listing_shell_queue_service_all" ON public.hc_listing_shell_queue;
CREATE POLICY "hc_listing_shell_queue_service_all"
  ON public.hc_listing_shell_queue FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "hc_listing_shell_events_service_all" ON public.hc_listing_shell_events;
CREATE POLICY "hc_listing_shell_events_service_all"
  ON public.hc_listing_shell_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION I: Enable RLS on public catalog tables (readable by all)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.hc_role_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_role_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_page_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_action_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_completion_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_role_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_route_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_next_move_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_country_role_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_country_intent_overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_monetization_surfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_entity_surface_links ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "hc_role_families_public_read" ON public.hc_role_families FOR SELECT USING (true);
CREATE POLICY "hc_roles_public_read" ON public.hc_roles FOR SELECT USING (true);
CREATE POLICY "hc_role_aliases_public_read" ON public.hc_role_aliases FOR SELECT USING (true);
CREATE POLICY "hc_intents_public_read" ON public.hc_intents FOR SELECT USING (true);
CREATE POLICY "hc_modes_public_read" ON public.hc_modes FOR SELECT USING (true);
CREATE POLICY "hc_page_types_public_read" ON public.hc_page_types FOR SELECT USING (true);
CREATE POLICY "hc_action_catalog_public_read" ON public.hc_action_catalog FOR SELECT USING (true);
CREATE POLICY "hc_completion_gates_public_read" ON public.hc_completion_gates FOR SELECT USING (true);
CREATE POLICY "hc_role_intents_public_read" ON public.hc_role_intents FOR SELECT USING (true);
CREATE POLICY "hc_route_patterns_public_read" ON public.hc_route_patterns FOR SELECT USING (true);
CREATE POLICY "hc_next_move_rules_public_read" ON public.hc_next_move_rules FOR SELECT USING (true);
CREATE POLICY "hc_country_role_overlays_public_read" ON public.hc_country_role_overlays FOR SELECT USING (true);
CREATE POLICY "hc_country_intent_overlays_public_read" ON public.hc_country_intent_overlays FOR SELECT USING (true);
CREATE POLICY "hc_monetization_surfaces_public_read" ON public.hc_monetization_surfaces FOR SELECT USING (true);
CREATE POLICY "hc_entity_surface_links_public_read" ON public.hc_entity_surface_links FOR SELECT USING (true);

-- Service-role write on all catalogs
CREATE POLICY "hc_role_families_service_write" ON public.hc_role_families FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_roles_service_write" ON public.hc_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_role_aliases_service_write" ON public.hc_role_aliases FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_intents_service_write" ON public.hc_intents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_modes_service_write" ON public.hc_modes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_page_types_service_write" ON public.hc_page_types FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_action_catalog_service_write" ON public.hc_action_catalog FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_completion_gates_service_write" ON public.hc_completion_gates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_role_intents_service_write" ON public.hc_role_intents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_route_patterns_service_write" ON public.hc_route_patterns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_next_move_rules_service_write" ON public.hc_next_move_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_country_role_overlays_service_write" ON public.hc_country_role_overlays FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_country_intent_overlays_service_write" ON public.hc_country_intent_overlays FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_monetization_surfaces_service_write" ON public.hc_monetization_surfaces FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "hc_entity_surface_links_service_write" ON public.hc_entity_surface_links FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION J: GRANT SELECT to anon + authenticated on all public catalogs
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT ON public.hc_role_families TO anon, authenticated;
GRANT SELECT ON public.hc_roles TO anon, authenticated;
GRANT SELECT ON public.hc_role_aliases TO anon, authenticated;
GRANT SELECT ON public.hc_intents TO anon, authenticated;
GRANT SELECT ON public.hc_modes TO anon, authenticated;
GRANT SELECT ON public.hc_page_types TO anon, authenticated;
GRANT SELECT ON public.hc_action_catalog TO anon, authenticated;
GRANT SELECT ON public.hc_completion_gates TO anon, authenticated;
GRANT SELECT ON public.hc_role_intents TO anon, authenticated;
GRANT SELECT ON public.hc_route_patterns TO anon, authenticated;
GRANT SELECT ON public.hc_next_move_rules TO anon, authenticated;
GRANT SELECT ON public.hc_country_role_overlays TO anon, authenticated;
GRANT SELECT ON public.hc_country_intent_overlays TO anon, authenticated;
GRANT SELECT ON public.hc_monetization_surfaces TO anon, authenticated;
GRANT SELECT ON public.hc_entity_surface_links TO anon, authenticated;

-- GRANT INSERT/SELECT/UPDATE on user-owned tables to authenticated
GRANT SELECT, INSERT, UPDATE ON public.hc_user_role_state TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hc_user_intent_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hc_mode_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hc_user_completion_state TO authenticated;
GRANT SELECT, INSERT ON public.hc_next_move_impressions TO anon, authenticated;
GRANT SELECT, INSERT ON public.hc_next_move_clicks TO anon, authenticated;

COMMIT;
