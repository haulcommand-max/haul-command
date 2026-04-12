-- ============================================================================
-- HAUL COMMAND — COMMS PTT (Push-to-Talk) Tables
-- Voice Channels, Members, Quick-Calls, Events, Preferences
--
-- Architecture:
--   Media plane: LiveKit WebRTC (audio streams)
--   Control plane: Supabase Realtime (signaling, presence, quick-calls)
--   Persistence: These tables (membership, events, audit, preferences)
--
-- NOTE: comms_status (online/nearby_only/no_comms) is EPHEMERAL.
--       It is computed from transport health and NEVER stored here.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- A) COMMS CHANNELS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comms_channels (
    id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_type        text        NOT NULL DEFAULT 'job_channel'
                        CHECK (channel_type IN (
                            'job_channel', 'convoy_channel', 'lead_rear_private',
                            'escort_only', 'emergency'
                        )),
    source_id           text,           -- FK to job/load (nullable for ad-hoc channels)
    display_name        text        NOT NULL DEFAULT 'Job Channel',
    livekit_room_name   text        NOT NULL,
    is_active           boolean     NOT NULL DEFAULT true,
    created_at          timestamptz DEFAULT now(),
    expires_at          timestamptz     -- auto-cleanup after TTL
);

CREATE INDEX IF NOT EXISTS idx_comms_channels_source
    ON public.comms_channels(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comms_channels_active
    ON public.comms_channels(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_comms_channels_expires
    ON public.comms_channels(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.comms_channels ENABLE ROW LEVEL SECURITY;

-- Members can see channels they belong to
CREATE POLICY "comms_channels_member_select" ON public.comms_channels
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.comms_members cm
            WHERE cm.channel_id = id
              AND cm.user_id = auth.uid()
              AND cm.left_at IS NULL
        )
    );

-- Service role can do everything
CREATE POLICY "comms_channels_service_all" ON public.comms_channels
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- B) COMMS MEMBERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comms_members (
    channel_id      uuid        NOT NULL REFERENCES public.comms_channels(id) ON DELETE CASCADE,
    user_id         uuid        NOT NULL,
    display_name    text        NOT NULL DEFAULT 'Operator',
    role            text        NOT NULL DEFAULT 'escort'
                    CHECK (role IN ('lead', 'rear', 'escort', 'driver', 'observer')),
    is_muted        boolean     NOT NULL DEFAULT false,
    joined_at       timestamptz DEFAULT now(),
    left_at         timestamptz,

    PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comms_members_user
    ON public.comms_members(user_id);
CREATE INDEX IF NOT EXISTS idx_comms_members_active
    ON public.comms_members(channel_id) WHERE left_at IS NULL;

ALTER TABLE public.comms_members ENABLE ROW LEVEL SECURITY;

-- Users can see/update their own membership
CREATE POLICY "comms_members_own_select" ON public.comms_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "comms_members_own_update" ON public.comms_members
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "comms_members_service_all" ON public.comms_members
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- C) COMMS QUICK-CALLS (persisted for replay)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comms_quick_calls (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id      uuid        NOT NULL REFERENCES public.comms_channels(id) ON DELETE CASCADE,
    sender_id       uuid        NOT NULL,
    sender_name     text        NOT NULL,
    call_type       text        NOT NULL
                    CHECK (call_type IN (
                        'stop', 'hold', 'clear', 'low_wire',
                        'breakdown', 'lane_move', 'permit_issue'
                    )),
    sent_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_qc_channel
    ON public.comms_quick_calls(channel_id, sent_at DESC);

ALTER TABLE public.comms_quick_calls ENABLE ROW LEVEL SECURITY;

-- Channel members can see and create quick-calls
CREATE POLICY "comms_qc_member_select" ON public.comms_quick_calls
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.comms_members cm
            WHERE cm.channel_id = comms_quick_calls.channel_id
              AND cm.user_id = auth.uid()
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "comms_qc_member_insert" ON public.comms_quick_calls
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.comms_members cm
            WHERE cm.channel_id = comms_quick_calls.channel_id
              AND cm.user_id = auth.uid()
              AND cm.left_at IS NULL
        )
    );

CREATE POLICY "comms_qc_service_all" ON public.comms_quick_calls
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- D) COMMS EVENTS (analytics / audit)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comms_events (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type      text        NOT NULL
                    CHECK (event_type IN (
                        'ptt_started', 'ptt_stopped',
                        'channel_joined', 'channel_left',
                        'quick_call_sent', 'emergency_broadcast_sent'
                    )),
    channel_id      uuid        REFERENCES public.comms_channels(id) ON DELETE SET NULL,
    user_id         uuid        NOT NULL,
    metadata        jsonb       DEFAULT '{}',
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_events_channel
    ON public.comms_events(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comms_events_user
    ON public.comms_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comms_events_type
    ON public.comms_events(event_type);

ALTER TABLE public.comms_events ENABLE ROW LEVEL SECURITY;

-- Users can see their own events
CREATE POLICY "comms_events_own_select" ON public.comms_events
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own events
CREATE POLICY "comms_events_own_insert" ON public.comms_events
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "comms_events_service_all" ON public.comms_events
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- E) COMMS PREFERENCES (per-user settings)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comms_preferences (
    user_id             uuid        PRIMARY KEY,
    plan                text        NOT NULL DEFAULT 'road_ready'
                        CHECK (plan IN ('road_ready', 'fast_lane')),
    auto_join_job_channel boolean   NOT NULL DEFAULT true,
    device_route        text        NOT NULL DEFAULT 'speaker'
                        CHECK (device_route IN ('speaker', 'earpiece', 'wired_headset')),
    favorite_channel_ids uuid[]     DEFAULT '{}',
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.comms_preferences ENABLE ROW LEVEL SECURITY;

-- Users can see/update their own preferences
CREATE POLICY "comms_prefs_own_select" ON public.comms_preferences
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "comms_prefs_own_upsert" ON public.comms_preferences
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "comms_prefs_own_update" ON public.comms_preferences
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "comms_prefs_service_all" ON public.comms_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════════
-- F) GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

-- Authenticated users need INSERT on channels (to create) + SELECT
GRANT SELECT, INSERT ON public.comms_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.comms_members TO authenticated;
GRANT SELECT, INSERT ON public.comms_quick_calls TO authenticated;
GRANT SELECT, INSERT ON public.comms_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.comms_preferences TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- G) AUTO-EXPIRE CLEANUP FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

-- Deactivate expired channels (run via pg_cron)
CREATE OR REPLACE FUNCTION public.comms_expire_channels()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH expired AS (
        UPDATE public.comms_channels
        SET is_active = false
        WHERE is_active = true
          AND expires_at IS NOT NULL
          AND expires_at < now()
        RETURNING id
    )
    SELECT count(*)::integer FROM expired;
$$;

-- Cleanup function for old events (keep 30 days)
CREATE OR REPLACE FUNCTION public.comms_cleanup_old_events()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH deleted AS (
        DELETE FROM public.comms_events
        WHERE created_at < now() - interval '30 days'
        RETURNING id
    )
    SELECT count(*)::integer FROM deleted;
$$;
