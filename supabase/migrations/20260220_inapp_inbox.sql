-- 20260220_inapp_inbox.sql
-- Implements the OSS Tooling Upgrade Pack unified inbox and preferences.

CREATE TABLE IF NOT EXISTS public.inbox_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL, -- 'morning_pulse', 'viewed_you', 'panic_fill', 'load_update', 'system'
    payload jsonb DEFAULT '{}'::jsonb,
    read_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Index for fast inbox queries
CREATE INDEX IF NOT EXISTS idx_inbox_messages_user_time ON public.inbox_messages(user_id, created_at DESC) WHERE read_at IS NULL;

-- Keep inbox lightweight by auto-cleaning expired messages (could be done via pg_cron, but TTL is better if supported)
-- We'll just define the column for now.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    morning_pulse boolean DEFAULT true,
    viewed_you boolean DEFAULT true,
    panic_fill boolean DEFAULT true,
    leaderboard_weekly boolean DEFAULT true,
    digest_time_utc time DEFAULT '12:00:00',
    updated_at timestamptz DEFAULT now()
);

-- RLS Settings
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own inbox" ON public.inbox_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox read status" ON public.inbox_messages
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Setup trigger to auto-create preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id) 
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing when auth.users is populated
-- Note: Typically attached to auth.users, but we might just do this on first load or via existing triggers
-- We'll attach it safely.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_prefs'
    ) THEN
        CREATE TRIGGER on_auth_user_created_prefs
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_preferences();
    END IF;
END
$$;
