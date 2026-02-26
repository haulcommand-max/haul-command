-- 20260220_email_core.sql
-- Email Campaign Engine: job queue, events, preferences, suppression, templates
-- Feature-flagged everything via app_settings keys.

-- ─── Email Events (telemetry: sent, opened, clicked, bounced, unsubscribed) ───
CREATE TABLE IF NOT EXISTS public.email_events (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text NOT NULL,
    event_type text NOT NULL CHECK (event_type IN ('queued','sent','opened','clicked','bounced','complained','unsubscribed','suppressed','failed')),
    template_key text,
    provider text, -- 'brevo_smtp', 'amazon_ses_smtp', 'resend_smtp'
    status text DEFAULT 'ok',
    error text,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_user ON public.email_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(event_type, created_at DESC);

-- ─── Email Preferences (per-user toggles) ───
CREATE TABLE IF NOT EXISTS public.email_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    newsletter_opt_in boolean DEFAULT true,
    product_updates boolean DEFAULT true,
    viewed_you boolean DEFAULT true,
    claim_reminders boolean DEFAULT true,
    leaderboard_alerts boolean DEFAULT false,
    corridor_risk_pulse boolean DEFAULT false,
    digest_frequency text DEFAULT 'monthly' CHECK (digest_frequency IN ('weekly','monthly','never')),
    quiet_hours_start time DEFAULT '21:00:00',
    quiet_hours_end time DEFAULT '07:00:00',
    updated_at timestamptz DEFAULT now()
);

-- ─── Email Suppression (bounces, complaints, manual blocks) ───
CREATE TABLE IF NOT EXISTS public.email_suppression (
    email text PRIMARY KEY,
    reason text NOT NULL CHECK (reason IN ('hard_bounce','complaint','manual','auto_sunset','user_unsubscribe')),
    created_at timestamptz DEFAULT now()
);

-- ─── Email Templates (MJML-rendered, subject A/B variants) ───
CREATE TABLE IF NOT EXISTS public.email_templates (
    key text PRIMARY KEY,
    subject_variants text[] DEFAULT '{}', -- rotated for A/B
    mjml text, -- raw MJML source
    html text, -- pre-rendered HTML fallback
    text_body text, -- plain text fallback
    enabled boolean DEFAULT true,
    updated_at timestamptz DEFAULT now()
);

-- ─── Email Jobs (queue for worker to drain) ───
CREATE TABLE IF NOT EXISTS public.email_jobs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    to_email text NOT NULL,
    template_key text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    send_after timestamptz DEFAULT now(),
    dedupe_key text, -- prevents duplicate sends (e.g. 'viewed_you:user123:2026-02-20')
    status text DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','suppressed')),
    attempts integer DEFAULT 0,
    last_error text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_jobs_pending ON public.email_jobs(status, send_after) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_jobs_dedupe ON public.email_jobs(dedupe_key) WHERE dedupe_key IS NOT NULL AND status IN ('pending','sent');

-- ─── Feature Flag Keys (seed into app_settings) ───
INSERT INTO public.app_settings (key, value) VALUES
    ('email.provider', 'brevo_smtp'),
    ('email.from_name', 'Haul Command'),
    ('email.from_email', 'dispatch@haulcommand.com'),
    ('email.reply_to', 'support@haulcommand.com'),
    ('email.quiet_hours_start', '21:00'),
    ('email.quiet_hours_end', '07:00'),
    ('email.daily_cap_per_user', '3'),
    ('email.weekly_cap_per_user', '10'),
    ('email.enable_open_tracking', 'true'),
    ('email.enable_click_tracking', 'true'),
    ('email.enable_listmonk_campaigns', 'true'),
    ('email.enable_transactional', 'true'),
    ('email.enable_digests', 'true'),
    ('email.enable_viewed_you', 'true'),
    ('email.enable_claim_nudges', 'true'),
    ('email.enable_leaderboard_alerts', 'false'),
    ('email.enable_corridor_risk_pulse', 'false')
ON CONFLICT (key) DO NOTHING;

-- ─── Seed default templates ───
INSERT INTO public.email_templates (key, subject_variants, enabled) VALUES
    ('welcome_claim', ARRAY['quick one — is this you?', 'you popped up in our directory 👀', 'claim your operator profile (takes 60 seconds)'], true),
    ('claim_nudge_2', ARRAY['still you? (last ping)', 'your profile is getting views — but it''s unclaimed'], true),
    ('claim_nudge_3', ARRAY['final check — your lane is heating up', 'brokers are searching your corridor'], true),
    ('viewed_you', ARRAY['someone checked your profile', 'you got looked up today'], true),
    ('report_card_ready', ARRAY['your report card just dropped 📊', 'new intel on your corridor'], true),
    ('panic_fill_alert', ARRAY['🚨 load needs escort NOW', '⚡ urgent match on your lane'], true),
    ('monthly_digest', ARRAY['Escort Market Pulse — what mattered this month', 'Corridor Heat + Leaderboard Movers (monthly)'], true)
ON CONFLICT (key) DO NOTHING;

-- ─── RLS ───
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read own events and preferences
CREATE POLICY "Users read own email events" ON public.email_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own email prefs" ON public.email_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role full access on operational tables
CREATE POLICY "Service role on email_jobs" ON public.email_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role on email_suppression" ON public.email_suppression FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role on email_templates" ON public.email_templates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role on email_events" ON public.email_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-create email_preferences row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_email_prefs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_preferences (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_email_prefs') THEN
        CREATE TRIGGER on_auth_user_created_email_prefs
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_email_prefs();
    END IF;
END
$$;
