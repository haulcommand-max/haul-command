-- =========================================================
-- MARKETPLACE RLS POLICIES & HELPER FUNCTIONS (v1.1)
-- Safe execution: Replaces policies and helper functions.
-- =========================================================

-- Helper Functions
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.has_role(roles text[])
RETURNS boolean AS $$
  SELECT public.current_role() = ANY(roles);
$$ LANGUAGE sql STABLE;

-- 1. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_visibility_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_pages ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin'])) WITH CHECK (id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin']));

-- 3. Driver Profiles Policies
DROP POLICY IF EXISTS "driver_profiles_public_read" ON public.driver_profiles;
CREATE POLICY "driver_profiles_public_read" ON public.driver_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "driver_profiles_self_update" ON public.driver_profiles;
CREATE POLICY "driver_profiles_self_update" ON public.driver_profiles FOR UPDATE USING (user_id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin','moderator'])) WITH CHECK (user_id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin','moderator']));

-- 4. Broker Profiles Policies
DROP POLICY IF EXISTS "broker_profiles_public_read" ON public.broker_profiles;
CREATE POLICY "broker_profiles_public_read" ON public.broker_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "broker_profiles_self_update" ON public.broker_profiles;
CREATE POLICY "broker_profiles_self_update" ON public.broker_profiles FOR UPDATE USING (user_id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin'])) WITH CHECK (user_id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin']));

-- 5. Loads Policies
DROP POLICY IF EXISTS "loads_public_read_open" ON public.loads;
CREATE POLICY "loads_public_read_open" ON public.loads FOR SELECT USING (status IN ('open','filled','expired'));

DROP POLICY IF EXISTS "loads_broker_update_own" ON public.loads;
CREATE POLICY "loads_broker_update_own" ON public.loads FOR UPDATE USING ((broker_id = auth.uid()) OR public.has_role(ARRAY['owner_admin','admin','moderator'])) WITH CHECK ((broker_id = auth.uid()) OR public.has_role(ARRAY['owner_admin','admin','moderator']));

-- 6. Load Visibility Zones Policies
DROP POLICY IF EXISTS "lvz_public_read" ON public.load_visibility_zones;
CREATE POLICY "lvz_public_read" ON public.load_visibility_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "lvz_admin_write" ON public.load_visibility_zones;
CREATE POLICY "lvz_admin_write" ON public.load_visibility_zones FOR ALL USING (public.has_role(ARRAY['owner_admin','admin'])) WITH CHECK (public.has_role(ARRAY['owner_admin','admin']));

-- 7. Load Matches Policies
DROP POLICY IF EXISTS "load_matches_driver_read_own" ON public.load_matches;
CREATE POLICY "load_matches_driver_read_own" ON public.load_matches FOR SELECT USING (
  escort_id = auth.uid()
  OR public.has_role(ARRAY['owner_admin','admin','moderator','support'])
);

DROP POLICY IF EXISTS "load_matches_driver_update_own" ON public.load_matches;
CREATE POLICY "load_matches_driver_update_own" ON public.load_matches FOR UPDATE USING (escort_id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin','moderator'])) WITH CHECK (escort_id = auth.uid() OR public.has_role(ARRAY['owner_admin','admin','moderator']));

DROP POLICY IF EXISTS "load_matches_admin_insert" ON public.load_matches;
CREATE POLICY "load_matches_admin_insert" ON public.load_matches FOR INSERT WITH CHECK (public.has_role(ARRAY['owner_admin','admin']));

-- 8. Activity Events Policies
DROP POLICY IF EXISTS "activity_events_public_read" ON public.activity_events;
CREATE POLICY "activity_events_public_read" ON public.activity_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "activity_events_admin_insert" ON public.activity_events;
CREATE POLICY "activity_events_admin_insert" ON public.activity_events FOR INSERT WITH CHECK (public.has_role(ARRAY['owner_admin','admin']));

-- 9. Reviews Policies
DROP POLICY IF EXISTS "reviews_public_read_approved" ON public.reviews;
CREATE POLICY "reviews_public_read_approved" ON public.reviews FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "reviews_anyone_insert_pending" ON public.reviews;
CREATE POLICY "reviews_anyone_insert_pending" ON public.reviews FOR INSERT WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "reviews_moderator_approve" ON public.reviews;
CREATE POLICY "reviews_moderator_approve" ON public.reviews FOR UPDATE USING (public.has_role(ARRAY['owner_admin','admin','moderator'])) WITH CHECK (public.has_role(ARRAY['owner_admin','admin','moderator']));

-- 10. Monetization Events Policies
DROP POLICY IF EXISTS "monetization_admin_read" ON public.monetization_events;
CREATE POLICY "monetization_admin_read" ON public.monetization_events FOR SELECT USING (public.has_role(ARRAY['owner_admin','admin','finance']));

DROP POLICY IF EXISTS "monetization_self_read" ON public.monetization_events;
CREATE POLICY "monetization_self_read" ON public.monetization_events FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "monetization_admin_write" ON public.monetization_events;
CREATE POLICY "monetization_admin_write" ON public.monetization_events FOR INSERT WITH CHECK (public.has_role(ARRAY['owner_admin','admin','finance']));

-- 11. Geo Pages Policies
DROP POLICY IF EXISTS "geo_pages_admin_read" ON public.geo_pages;
CREATE POLICY "geo_pages_admin_read" ON public.geo_pages FOR SELECT USING (public.has_role(ARRAY['owner_admin','admin','moderator']));

DROP POLICY IF EXISTS "geo_pages_admin_write" ON public.geo_pages;
CREATE POLICY "geo_pages_admin_write" ON public.geo_pages FOR INSERT WITH CHECK (public.has_role(ARRAY['owner_admin','admin']));

DROP POLICY IF EXISTS "geo_pages_admin_update" ON public.geo_pages;
CREATE POLICY "geo_pages_admin_update" ON public.geo_pages FOR UPDATE USING (public.has_role(ARRAY['owner_admin','admin'])) WITH CHECK (public.has_role(ARRAY['owner_admin','admin']));

-- Note: In Supabase, turning on Realtime for these tables happens in the dashboard Settings > Database > Replication.
