-- ============================================================================
-- Haul Command — FCM Push Notification Tables
-- Migration: 20260321100000
--
-- Tables:
-- 1. push_tokens — one row per user per device
-- 2. push_log — audit trail for every send attempt
-- ============================================================================

-- Device tokens — one row per user per device
CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_label TEXT,                        -- optional: "iPhone 14", "Chrome on Mac"
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_tokens(platform, is_active);

-- RLS: users can manage their own tokens
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push tokens"
    ON push_tokens FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notification log — audit trail for every send attempt
CREATE TABLE IF NOT EXISTS push_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    notification_type TEXT NOT NULL,          -- 'dispatch_wave', 'hold_request', etc.
    title TEXT,
    body TEXT,
    data JSONB DEFAULT '{}',
    fcm_message_id TEXT,
    status TEXT DEFAULT 'sent',               -- 'sent', 'failed', 'invalid_token'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_push_log_type ON push_log(notification_type, created_at);
CREATE INDEX IF NOT EXISTS idx_push_log_status ON push_log(status, created_at);

-- RLS: users can read their own notification log
ALTER TABLE push_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push log"
    ON push_log FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can insert (server-side send functions use service role key)
