-- ============================================================================
-- Thread Views + Pagination RPCs (Frontend Query Contracts)
-- Migration: 20260303000008
-- ============================================================================
-- Creates the views and RPCs that the Next.js query patterns expect:
--   - hc_scope_thread_v        (thread lookup by scope)
--   - hc_thread_top_posts_v    (ranked posts with row numbers)
--   - hc_thread_new_posts_v    (chronological posts with row numbers)
--   - hc_get_or_create_thread_for_scope()
--   - hc_fetch_thread_page()   (cursor-keyset pagination)
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Thread Scope View
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.hc_scope_thread_v AS
SELECT
  t.thread_id,
  t.scope_type,
  t.scope_id,
  t.title,
  t.visibility,
  t.locked,
  t.archived,
  t.created_at,
  t.last_activity_at,
  COALESCE(t.post_count, 0) AS posts_count,
  t.created_by_identity_id,
  hi.role AS creator_role,
  hi.verified_level AS creator_verified_level
FROM public.hc_threads t
LEFT JOIN public.hc_identities hi
  ON hi.identity_id = t.created_by_identity_id
WHERE t.visibility = 'public';

GRANT SELECT ON public.hc_scope_thread_v TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2) Top Posts View (ranked by weighted score, row numbered)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.hc_thread_top_posts_v AS
SELECT
  p.post_id,
  p.thread_id,
  p.parent_post_id,
  p.author_identity_id,
  hi.role AS author_role,
  hi.verified_level AS author_verified_level,
  hi.trust_tier AS author_trust_tier,
  p.body_md,
  p.evidence_ref_id,
  p.status,
  p.created_at,
  p.edited_at,
  p.depth,
  p.upvotes_weighted,
  p.downvotes_weighted,
  p.score_weighted,
  ROW_NUMBER() OVER (
    PARTITION BY p.thread_id
    ORDER BY p.score_weighted DESC, p.created_at ASC
  ) AS rn
FROM public.hc_posts p
LEFT JOIN public.hc_identities hi
  ON hi.identity_id = p.author_identity_id
WHERE p.status = 'active';

GRANT SELECT ON public.hc_thread_top_posts_v TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3) New Posts View (chronological, row numbered)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.hc_thread_new_posts_v AS
SELECT
  p.post_id,
  p.thread_id,
  p.parent_post_id,
  p.author_identity_id,
  hi.role AS author_role,
  hi.verified_level AS author_verified_level,
  hi.trust_tier AS author_trust_tier,
  p.body_md,
  p.evidence_ref_id,
  p.status,
  p.created_at,
  p.edited_at,
  p.depth,
  p.upvotes_weighted,
  p.downvotes_weighted,
  p.score_weighted,
  ROW_NUMBER() OVER (
    PARTITION BY p.thread_id
    ORDER BY p.created_at DESC
  ) AS rn
FROM public.hc_posts p
LEFT JOIN public.hc_identities hi
  ON hi.identity_id = p.author_identity_id
WHERE p.status = 'active';

GRANT SELECT ON public.hc_thread_new_posts_v TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4) Get-or-Create Thread RPC
-- ═══════════════════════════════════════════════════════════════════════════
-- Returns thread_id. Creates if not exists (requires verified gate).
-- Wraps hc_create_thread with a read-first check for non-authenticated callers.

CREATE OR REPLACE FUNCTION public.hc_get_or_create_thread_for_scope(
  p_scope_type   TEXT,
  p_scope_id     TEXT,
  p_title        TEXT DEFAULT 'Discussion',
  p_visibility   TEXT DEFAULT 'public'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  -- Try to find existing thread first (no auth needed for read)
  SELECT thread_id INTO v_thread_id
  FROM public.hc_threads
  WHERE scope_type = p_scope_type
    AND scope_id = p_scope_id
  LIMIT 1;

  IF v_thread_id IS NOT NULL THEN
    RETURN v_thread_id;
  END IF;

  -- Create new thread (requires authenticated + verified)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  v_thread_id := public.hc_create_thread(p_scope_type, p_scope_id, p_title, p_visibility);
  RETURN v_thread_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_get_or_create_thread_for_scope TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 5) Paginated Thread Page RPC (keyset cursor)
-- ═══════════════════════════════════════════════════════════════════════════
-- Supports three sort modes: hot, new, top
-- Uses keyset pagination for consistent results during realtime activity.

CREATE OR REPLACE FUNCTION public.hc_fetch_thread_page(
  p_thread_id       UUID,
  p_sort_mode       TEXT DEFAULT 'hot',
  p_page_size       INT DEFAULT 30,
  p_cursor_score    NUMERIC DEFAULT NULL,
  p_cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  p_cursor_post_id  UUID DEFAULT NULL
)
RETURNS TABLE (
  post_id            UUID,
  parent_post_id     UUID,
  author_identity_id UUID,
  author_role        TEXT,
  author_verified_level INT,
  author_trust_tier  INT,
  body_md            TEXT,
  evidence_ref_id    UUID,
  created_at         TIMESTAMPTZ,
  edited_at          TIMESTAMPTZ,
  depth              INT,
  score_weighted     NUMERIC,
  upvotes_weighted   NUMERIC,
  downvotes_weighted NUMERIC,
  path_ltree         ltree
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_sort_mode = 'top' THEN
    RETURN QUERY
    SELECT
      p.post_id, p.parent_post_id, p.author_identity_id,
      hi.role, hi.verified_level, hi.trust_tier,
      p.body_md, p.evidence_ref_id, p.created_at, p.edited_at,
      p.depth, p.score_weighted, p.upvotes_weighted, p.downvotes_weighted,
      p.path_ltree
    FROM public.hc_posts p
    LEFT JOIN public.hc_identities hi ON hi.identity_id = p.author_identity_id
    WHERE p.thread_id = p_thread_id
      AND p.status = 'active'
      AND (p_cursor_score IS NULL OR (
        p.score_weighted < p_cursor_score
        OR (p.score_weighted = p_cursor_score AND p.post_id > p_cursor_post_id)
      ))
    ORDER BY p.score_weighted DESC, p.post_id ASC
    LIMIT p_page_size;

  ELSIF p_sort_mode = 'new' THEN
    RETURN QUERY
    SELECT
      p.post_id, p.parent_post_id, p.author_identity_id,
      hi.role, hi.verified_level, hi.trust_tier,
      p.body_md, p.evidence_ref_id, p.created_at, p.edited_at,
      p.depth, p.score_weighted, p.upvotes_weighted, p.downvotes_weighted,
      p.path_ltree
    FROM public.hc_posts p
    LEFT JOIN public.hc_identities hi ON hi.identity_id = p.author_identity_id
    WHERE p.thread_id = p_thread_id
      AND p.status = 'active'
      AND (p_cursor_created_at IS NULL OR (
        p.created_at < p_cursor_created_at
        OR (p.created_at = p_cursor_created_at AND p.post_id > p_cursor_post_id)
      ))
    ORDER BY p.created_at DESC, p.post_id ASC
    LIMIT p_page_size;

  ELSE  -- 'hot': Wilson score decay (approximated as score * recency factor)
    RETURN QUERY
    SELECT
      p.post_id, p.parent_post_id, p.author_identity_id,
      hi.role, hi.verified_level, hi.trust_tier,
      p.body_md, p.evidence_ref_id, p.created_at, p.edited_at,
      p.depth, p.score_weighted, p.upvotes_weighted, p.downvotes_weighted,
      p.path_ltree
    FROM public.hc_posts p
    LEFT JOIN public.hc_identities hi ON hi.identity_id = p.author_identity_id
    WHERE p.thread_id = p_thread_id
      AND p.status = 'active'
    ORDER BY
      -- Hot rank: score × recency decay (half-life ~12 hours)
      (p.score_weighted + 1) * EXP(-0.5 * EXTRACT(EPOCH FROM (now() - p.created_at)) / 43200.0) DESC,
      p.post_id ASC
    LIMIT p_page_size
    OFFSET COALESCE(
      -- For hot sort, use simple offset via page counting
      CASE WHEN p_cursor_post_id IS NOT NULL THEN p_page_size ELSE 0 END,
      0
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hc_fetch_thread_page TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6) Ensure post_count column exists on hc_threads
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.hc_threads
  ADD COLUMN IF NOT EXISTS post_count INT NOT NULL DEFAULT 0;

COMMIT;
