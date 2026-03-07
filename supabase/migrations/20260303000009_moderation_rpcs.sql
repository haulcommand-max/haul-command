-- ============================================================================
-- Moderation RPCs (Admin Queue + Actions)
-- Migration: 20260303000009
-- ============================================================================
-- Backend RPCs for the Next.js admin moderation UI:
--   - hc_fetch_moderation_queue()  (reported + under_review posts)
--   - hc_remove_post()             (staff removes a post)
--   - hc_mark_spam()               (staff marks post as spam)
--   - hc_resolve_report()          (staff resolves a report)
-- ============================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Moderation Queue RPC
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_fetch_moderation_queue(
  p_limit_n  INT DEFAULT 50,
  p_offset_n INT DEFAULT 0
)
RETURNS TABLE (
  post_id            UUID,
  thread_id          UUID,
  thread_title       TEXT,
  scope_type         TEXT,
  scope_id           TEXT,
  author_identity_id UUID,
  author_role        TEXT,
  body_md            TEXT,
  post_status        TEXT,
  post_created_at    TIMESTAMPTZ,
  report_count       BIGINT,
  latest_report_at   TIMESTAMPTZ,
  latest_reason_code TEXT,
  score_weighted     NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Staff only
  IF NOT public.hc_is_staff() THEN
    RAISE EXCEPTION 'staff_only';
  END IF;

  RETURN QUERY
  SELECT
    p.post_id,
    p.thread_id,
    t.title AS thread_title,
    t.scope_type,
    t.scope_id,
    p.author_identity_id,
    hi.role AS author_role,
    p.body_md,
    p.status AS post_status,
    p.created_at AS post_created_at,
    COALESCE(rpt.report_count, 0) AS report_count,
    rpt.latest_report_at,
    rpt.latest_reason_code,
    p.score_weighted
  FROM public.hc_posts p
  JOIN public.hc_threads t ON t.thread_id = p.thread_id
  LEFT JOIN public.hc_identities hi ON hi.identity_id = p.author_identity_id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS report_count,
      MAX(r.created_at) AS latest_report_at,
      (SELECT r2.reason_code FROM public.hc_post_reports r2
       WHERE r2.post_id = p.post_id
       ORDER BY r2.created_at DESC LIMIT 1
      ) AS latest_reason_code
    FROM public.hc_post_reports r
    WHERE r.post_id = p.post_id
      AND r.status = 'open'
  ) rpt ON true
  WHERE p.status IN ('under_review', 'active')
    AND (
      rpt.report_count > 0
      OR p.status = 'under_review'
    )
  ORDER BY
    CASE WHEN p.status = 'under_review' THEN 0 ELSE 1 END,
    rpt.report_count DESC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit_n
  OFFSET p_offset_n;
END;
$$;

REVOKE ALL ON FUNCTION public.hc_fetch_moderation_queue FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_fetch_moderation_queue TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2) Remove Post RPC
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_remove_post(
  p_post_id     UUID,
  p_reason_code TEXT DEFAULT 'moderation',
  p_notes       TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post   public.hc_posts%ROWTYPE;
  v_mod_id UUID;
BEGIN
  IF NOT public.hc_is_staff() THEN
    RAISE EXCEPTION 'staff_only';
  END IF;

  v_mod_id := public.hc_my_identity_id();

  SELECT * INTO v_post FROM public.hc_posts WHERE post_id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  -- Mark post as removed
  UPDATE public.hc_posts SET
    status = 'removed',
    edited_at = now()
  WHERE post_id = p_post_id;

  -- Decrement thread post count
  UPDATE public.hc_threads SET
    post_count = GREATEST(0, post_count - 1)
  WHERE thread_id = v_post.thread_id;

  -- Auto-resolve all open reports for this post
  UPDATE public.hc_post_reports SET
    status = 'resolved',
    resolved_at = now(),
    resolved_by_identity_id = v_mod_id
  WHERE post_id = p_post_id
    AND status = 'open';
END;
$$;

REVOKE ALL ON FUNCTION public.hc_remove_post FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_remove_post TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3) Mark Spam RPC
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_mark_spam(
  p_post_id UUID,
  p_notes   TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post   public.hc_posts%ROWTYPE;
  v_mod_id UUID;
BEGIN
  IF NOT public.hc_is_staff() THEN
    RAISE EXCEPTION 'staff_only';
  END IF;

  v_mod_id := public.hc_my_identity_id();

  SELECT * INTO v_post FROM public.hc_posts WHERE post_id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'post_not_found';
  END IF;

  -- Mark post as spam
  UPDATE public.hc_posts SET
    status = 'spam',
    edited_at = now()
  WHERE post_id = p_post_id;

  -- Decrement thread post count
  UPDATE public.hc_threads SET
    post_count = GREATEST(0, post_count - 1)
  WHERE thread_id = v_post.thread_id;

  -- Auto-resolve reports
  UPDATE public.hc_post_reports SET
    status = 'resolved',
    resolved_at = now(),
    resolved_by_identity_id = v_mod_id
  WHERE post_id = p_post_id
    AND status = 'open';

  -- Bump risk flag on author identity
  UPDATE public.hc_identities SET
    risk_flags_json = jsonb_set(
      COALESCE(risk_flags_json, '{}'::jsonb),
      '{spam_count}',
      to_jsonb(COALESCE((risk_flags_json->>'spam_count')::int, 0) + 1)
    )
  WHERE identity_id = v_post.author_identity_id;
END;
$$;

REVOKE ALL ON FUNCTION public.hc_mark_spam FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_mark_spam TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4) Resolve Report RPC
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.hc_resolve_report(
  p_report_id   UUID,
  p_resolution  TEXT,
  p_notes       TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report  public.hc_post_reports%ROWTYPE;
  v_mod_id  UUID;
BEGIN
  IF NOT public.hc_is_staff() THEN
    RAISE EXCEPTION 'staff_only';
  END IF;

  v_mod_id := public.hc_my_identity_id();

  SELECT * INTO v_report FROM public.hc_post_reports WHERE report_id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'report_not_found';
  END IF;

  IF v_report.status != 'open' THEN
    RAISE EXCEPTION 'report_already_resolved';
  END IF;

  -- Update report
  UPDATE public.hc_post_reports SET
    status = 'resolved',
    resolved_at = now(),
    resolved_by_identity_id = v_mod_id
  WHERE report_id = p_report_id;

  -- If resolution removes the post, do it
  IF p_resolution IN ('removed', 'spam') THEN
    UPDATE public.hc_posts SET
      status = CASE WHEN p_resolution = 'spam' THEN 'spam' ELSE 'removed' END,
      edited_at = now()
    WHERE post_id = v_report.post_id;

    UPDATE public.hc_threads SET
      post_count = GREATEST(0, post_count - 1)
    WHERE thread_id = (
      SELECT thread_id FROM public.hc_posts WHERE post_id = v_report.post_id
    );
  END IF;

  -- If upheld but not removed, mark post under_review for visibility
  IF p_resolution = 'upheld' THEN
    UPDATE public.hc_posts SET status = 'under_review'
    WHERE post_id = v_report.post_id
      AND status = 'active';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.hc_resolve_report FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hc_resolve_report TO authenticated;

COMMIT;
