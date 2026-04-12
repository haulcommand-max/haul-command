-- =========================================================================
-- HAUL COMMAND — Trust Visibility Patch
-- Merges into: pilot_car_media_gear_verification
--
-- Purpose: Enforce tiered access to report cards, media, and profiles.
--   Every listing gets a report card. Claimed owners control public
--   visibility. Paid users can override hidden visibility on trust surfaces.
-- =========================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A) VISIBILITY AUDIT LOG (track owner toggle changes)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.visibility_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL,
    changed_by      UUID NOT NULL,
    field_changed   TEXT NOT NULL CHECK (field_changed IN (
        'public_profile_visible', 'public_report_card_visible',
        'public_media_visible', 'public_contact_visible'
    )),
    old_value       BOOLEAN NOT NULL,
    new_value       BOOLEAN NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vis_audit_listing ON public.visibility_audit_log(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vis_audit_user ON public.visibility_audit_log(changed_by);

ALTER TABLE public.visibility_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vis_audit_owner_select" ON public.visibility_audit_log
    FOR SELECT TO authenticated
    USING (changed_by = auth.uid());

CREATE POLICY "vis_audit_service_all" ON public.visibility_audit_log
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- B) HELPER: Check if a user has an active paid subscription
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_paid_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = p_user_id
          AND status = 'active'
          AND current_period_end > NOW()
    );
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- C) HELPER: Get the user's audience tier for a given listing
-- Returns: 'admin', 'claimed_owner', 'paid', 'free', 'anonymous'
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_audience_tier(
    p_viewer_id UUID,
    p_listing_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT := 'anonymous';
    v_is_owner BOOLEAN := false;
    v_is_admin BOOLEAN := false;
BEGIN
    -- Null viewer = anonymous
    IF p_viewer_id IS NULL THEN
        RETURN 'anonymous';
    END IF;

    -- Check admin (service_role or admin flag)
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_viewer_id AND role = 'admin'
    ) INTO v_is_admin;
    IF v_is_admin THEN RETURN 'admin'; END IF;

    -- Check if viewer is the claimed owner
    SELECT EXISTS (
        SELECT 1 FROM public.driver_profiles
        WHERE id = p_listing_id
          AND user_id = p_viewer_id
          AND is_claimed = true
    ) INTO v_is_owner;
    IF v_is_owner THEN RETURN 'claimed_owner'; END IF;

    -- Check paid subscription
    IF public.is_paid_user(p_viewer_id) THEN RETURN 'paid'; END IF;

    -- Default: free logged-in
    RETURN 'free';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- D) CORE: Resolve effective visibility for a viewer on a listing
-- Returns JSON with what the viewer can see
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resolve_visibility(
    p_viewer_id UUID,
    p_listing_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
    v_vis RECORD;
    v_result JSONB;
BEGIN
    v_tier := public.get_audience_tier(p_viewer_id, p_listing_id);

    -- Get visibility settings (defaults if no row)
    SELECT
        COALESCE(pv.public_profile_visible, true) AS pub_profile,
        COALESCE(pv.public_report_card_visible, true) AS pub_report_card,
        COALESCE(pv.public_media_visible, true) AS pub_media,
        COALESCE(pv.public_contact_visible, true) AS pub_contact
    INTO v_vis
    FROM (SELECT 1) dummy
    LEFT JOIN public.profile_visibility pv ON pv.listing_id = p_listing_id;

    -- Build result based on tier
    CASE v_tier
        WHEN 'admin' THEN
            v_result := jsonb_build_object(
                'tier', 'admin',
                'can_view_profile', true,
                'can_view_report_card', true,
                'can_view_media', true,
                'can_view_contact', true,
                'can_view_subscriber_media', true,
                'can_view_private_media', true,
                'can_manage_visibility', true,
                'show_upgrade_prompt', false
            );

        WHEN 'claimed_owner' THEN
            v_result := jsonb_build_object(
                'tier', 'claimed_owner',
                'can_view_profile', true,
                'can_view_report_card', true,
                'can_view_media', true,
                'can_view_contact', true,
                'can_view_subscriber_media', true,
                'can_view_private_media', true,
                'can_manage_visibility', true,
                'show_upgrade_prompt', false
            );

        WHEN 'paid' THEN
            v_result := jsonb_build_object(
                'tier', 'paid',
                -- Paid users CAN see hidden profiles + report cards
                'can_view_profile', true,
                'can_view_report_card', true,
                'can_view_media', true,
                'can_view_contact', v_vis.pub_contact,
                'can_view_subscriber_media', true,
                'can_view_private_media', false,
                'can_manage_visibility', false,
                'show_upgrade_prompt', false
            );

        WHEN 'free' THEN
            v_result := jsonb_build_object(
                'tier', 'free',
                'can_view_profile', v_vis.pub_profile,
                'can_view_report_card', v_vis.pub_report_card,
                'can_view_media', v_vis.pub_media,
                'can_view_contact', v_vis.pub_contact,
                'can_view_subscriber_media', false,
                'can_view_private_media', false,
                'can_manage_visibility', false,
                'show_upgrade_prompt', NOT (v_vis.pub_profile AND v_vis.pub_report_card)
            );

        ELSE -- anonymous
            v_result := jsonb_build_object(
                'tier', 'anonymous',
                'can_view_profile', v_vis.pub_profile,
                'can_view_report_card', v_vis.pub_report_card,
                'can_view_media', v_vis.pub_media,
                'can_view_contact', false,
                'can_view_subscriber_media', false,
                'can_view_private_media', false,
                'can_manage_visibility', false,
                'show_upgrade_prompt', NOT (v_vis.pub_profile AND v_vis.pub_report_card)
            );
    END CASE;

    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- E) SEED: Ensure every listing has a report card
-- Runs as batch cron or after claim events
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.seed_missing_report_cards()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    INSERT INTO public.operator_report_cards (
        listing_id, claim_state, public_visible, subscriber_visible,
        identity_score, completeness_score, media_completeness,
        gear_presence, verification_level, responsiveness_pct,
        freshness_pct, service_area_confidence, overall_trust_score
    )
    SELECT
        de.id,
        CASE WHEN dp.is_claimed THEN 'claimed' ELSE 'unclaimed' END,
        true,  -- public by default
        true,  -- subscriber visible by default
        0, 0, 0, 0,
        'self_reported'::verification_state,
        0, 0, 0, 0
    FROM public.directory_entities de
    LEFT JOIN public.driver_profiles dp ON dp.id = de.id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.operator_report_cards orc
        WHERE orc.listing_id = de.id
    )
    ON CONFLICT (listing_id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Also seed visibility defaults
CREATE OR REPLACE FUNCTION public.seed_missing_visibility_controls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    INSERT INTO public.profile_visibility (
        listing_id, public_profile_visible, public_report_card_visible,
        public_media_visible, public_contact_visible
    )
    SELECT
        de.id,
        true, true, true, true
    FROM public.directory_entities de
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profile_visibility pv
        WHERE pv.listing_id = de.id
    )
    ON CONFLICT (listing_id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- F) OWNER TOGGLE: Update visibility with audit trail
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.toggle_profile_visibility(
    p_listing_id UUID,
    p_field TEXT,
    p_new_value BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_value BOOLEAN;
    v_user_id UUID;
    v_is_owner BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    -- Verify ownership
    SELECT EXISTS (
        SELECT 1 FROM public.driver_profiles
        WHERE id = p_listing_id AND user_id = v_user_id AND is_claimed = true
    ) INTO v_is_owner;

    IF NOT v_is_owner THEN
        RETURN jsonb_build_object('error', 'Not the listing owner');
    END IF;

    -- Validate field name
    IF p_field NOT IN (
        'public_profile_visible', 'public_report_card_visible',
        'public_media_visible', 'public_contact_visible'
    ) THEN
        RETURN jsonb_build_object('error', 'Invalid field');
    END IF;

    -- Get old value
    EXECUTE format(
        'SELECT %I FROM public.profile_visibility WHERE listing_id = $1',
        p_field
    ) INTO v_old_value USING p_listing_id;

    -- Ensure row exists
    INSERT INTO public.profile_visibility (listing_id)
    VALUES (p_listing_id)
    ON CONFLICT (listing_id) DO NOTHING;

    -- Update
    EXECUTE format(
        'UPDATE public.profile_visibility SET %I = $1, updated_at = NOW(), updated_by = $2 WHERE listing_id = $3',
        p_field
    ) USING p_new_value, v_user_id, p_listing_id;

    -- Audit
    INSERT INTO public.visibility_audit_log (listing_id, changed_by, field_changed, old_value, new_value)
    VALUES (p_listing_id, v_user_id, p_field, COALESCE(v_old_value, true), p_new_value);

    -- Sync to report card if relevant
    IF p_field = 'public_report_card_visible' THEN
        UPDATE public.operator_report_cards
        SET public_visible = p_new_value, updated_at = NOW()
        WHERE listing_id = p_listing_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'field', p_field,
        'old_value', COALESCE(v_old_value, true),
        'new_value', p_new_value
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- G) ENHANCED RLS — operator_media refined for paid-tier
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: We DROP and recreate to avoid conflicts with the base migration policies

-- Drop existing policies that we need to refine
DROP POLICY IF EXISTS "Authenticated can view subscriber media" ON operator_media;

-- Paid users can view public + subscriber_only media
CREATE POLICY "Paid users view subscriber media" ON operator_media
    FOR SELECT TO authenticated
    USING (
        moderation_state = 'approved'
        AND visibility IN ('public', 'subscriber_only')
        AND public.is_paid_user(auth.uid())
    );

-- Free authenticated only see public media
CREATE POLICY "Free auth view public media" ON operator_media
    FOR SELECT TO authenticated
    USING (
        moderation_state = 'approved'
        AND visibility = 'public'
        AND NOT public.is_paid_user(auth.uid())
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- H) ENHANCED RLS — report cards refined for paid-tier
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Auth can view subscriber report cards" ON operator_report_cards;

-- Paid users can see ALL report cards (even hidden ones)
CREATE POLICY "Paid users view all report cards" ON operator_report_cards
    FOR SELECT TO authenticated
    USING (
        subscriber_visible = true
        AND public.is_paid_user(auth.uid())
    );

-- Free auth only see public report cards
CREATE POLICY "Free auth view public report cards" ON operator_report_cards
    FOR SELECT TO authenticated
    USING (
        public_visible = true
        AND NOT public.is_paid_user(auth.uid())
    );

-- Owners always see their own report card
CREATE POLICY "Owners view own report card" ON operator_report_cards
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.driver_profiles dp
            WHERE dp.id = operator_report_cards.listing_id
              AND dp.user_id = auth.uid()
              AND dp.is_claimed = true
        )
    );

-- Service role full access
CREATE POLICY "report_cards_service_all" ON operator_report_cards
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- I) GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT ON public.visibility_audit_log TO authenticated;
GRANT INSERT ON public.visibility_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_paid_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audience_tier(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_visibility(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_profile_visibility(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_missing_report_cards() TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_missing_visibility_controls() TO service_role;
