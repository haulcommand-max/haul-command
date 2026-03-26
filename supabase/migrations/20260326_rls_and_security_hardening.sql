-- ============================================================
-- HAUL COMMAND — SECURITY HARDENING MIGRATION
-- Phase 1: RLS Enforcement + Search Path Patching
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- SECTION 1A: ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- 1) public.users
-- Only the authenticated owner can see/update their own row.
-- The service_role bypasses RLS entirely (by design in Supabase).

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users: owner select" ON public.users;
CREATE POLICY "users: owner select"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users: owner update" ON public.users;
CREATE POLICY "users: owner update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users: owner insert" ON public.users;
CREATE POLICY "users: owner insert"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);


-- 2) public.companies
-- Company members can view their company. Only owners/admins can mutate it.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies: member select" ON public.companies;
CREATE POLICY "companies: member select"
  ON public.companies FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = id
    )
  );

DROP POLICY IF EXISTS "companies: owner update" ON public.companies;
CREATE POLICY "companies: owner update"
  ON public.companies FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members
      WHERE company_id = id AND role IN ('owner', 'admin')
    )
  );


-- 3) public.hc_places
-- PUBLIC SELECT for SEO directory pages (all users, unauthenticated included).
-- INSERT/UPDATE restricted to service_role only (autonomous scraper) 
-- OR the authenticated user who is the verified claimed owner.

ALTER TABLE public.hc_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hc_places: public read" ON public.hc_places;
CREATE POLICY "hc_places: public read"
  ON public.hc_places FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "hc_places: claimed owner update" ON public.hc_places;
CREATE POLICY "hc_places: claimed owner update"
  ON public.hc_places FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND claim_status = 'claimed'
    AND auth.uid()::text = (metadata->>'claimed_by_uid')
  );

-- INSERT is handled exclusively by the service_role backend scraper.
-- No authenticated user should INSERT directly via the client SDK.
-- (service_role bypasses RLS; no INSERT policy = client can't insert)


-- 4) public.hc_payment_log
-- Locked down completely. Only service_role (backend) can read or write.
-- No client-side SDK should ever query this table directly.

ALTER TABLE public.hc_payment_log ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE policies = zero client access.
-- service_role bypasses this automatically.


-- 5) public.recommendations (flagged in DB advisor)
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations: public read" ON public.recommendations;
CREATE POLICY "recommendations: public read"
  ON public.recommendations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "recommendations: owner write" ON public.recommendations;
CREATE POLICY "recommendations: owner write"
  ON public.recommendations FOR ALL
  USING (auth.uid() IS NOT NULL);


-- 6) public.sitemap_urls (flagged in DB advisor)
ALTER TABLE public.sitemap_urls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sitemap_urls: public read" ON public.sitemap_urls;
CREATE POLICY "sitemap_urls: public read"
  ON public.sitemap_urls FOR SELECT
  USING (true);


-- ────────────────────────────────────────────────────────────
-- SECTION 1B: PATCH FUNCTION SEARCH PATHS
-- Prevents malicious schema hijacking via search_path manipulation.
-- ────────────────────────────────────────────────────────────

-- match_regulations (pgvector RPC)
CREATE OR REPLACE FUNCTION public.match_regulations(
  query_embedding vector,
  match_threshold float,
  match_count int,
  country_filter text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title text,
  requirement_name text,
  requirement_text text,
  country_code text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.requirement_name,
    r.requirement_text,
    r.country_code,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM public.hc_regulations_global r
  WHERE
    (country_filter IS NULL OR r.country_code = country_filter)
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- match_dictionary (pgvector RPC)
CREATE OR REPLACE FUNCTION public.match_dictionary(
  query_embedding vector,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  term_id bigint,
  term text,
  definition text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.term_id,
    d.term,
    d.definition,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.hc_dictionary d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- SECTION 1C: REVOKE PUBLIC SCHEMA EXECUTE PRIVILEGES
-- Prevents unauthenticated callers from executing privileged functions.
-- ────────────────────────────────────────────────────────────

-- Restrict direct execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.match_regulations FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_regulations TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_regulations TO service_role;

REVOKE EXECUTE ON FUNCTION public.match_dictionary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_dictionary TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_dictionary TO service_role;


-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
-- To verify RLS is active, run:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ────────────────────────────────────────────────────────────
