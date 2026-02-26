-- 20260220_directory_views.sql
-- Tracking profile views to power the "Viewed-You" retention loop

CREATE TABLE IF NOT EXISTS public.directory_views (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- User being viewed
    viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Authenticated user viewing (if any)
    viewer_ip text, -- Anonymous tracking
    created_at timestamptz DEFAULT now()
);

-- Index for querying recent views and aggregation
CREATE INDEX IF NOT EXISTS idx_directory_views_recent ON public.directory_views(profile_id, created_at DESC);

-- Throttle view counting (only 1 view per viewer per profile per hour) to prevent abuse
CREATE UNIQUE INDEX IF NOT EXISTS unq_directory_views_throttle 
ON public.directory_views(profile_id, viewer_id, date_trunc('hour', created_at))
WHERE viewer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unq_directory_views_throttle_anon 
ON public.directory_views(profile_id, viewer_ip, date_trunc('hour', created_at))
WHERE viewer_id IS NULL;

-- Enable RLS
ALTER TABLE public.directory_views ENABLE ROW LEVEL SECURITY;

-- Profiles can see who viewed them
CREATE POLICY "Users can read own received views" ON public.directory_views 
    FOR SELECT USING (auth.uid() = profile_id);

-- Anyone (even anon) can insert a view
CREATE POLICY "Anyone can insert a view" ON public.directory_views 
    FOR INSERT WITH CHECK (true);

-- Trigger to create inbox_message when viewed
-- We only notify if `notification_preferences.viewed_you` is true
CREATE OR REPLACE FUNCTION public.handle_new_directory_view() 
RETURNS TRIGGER AS $$
DECLARE
    prefs RECORD;
    existing_inbox_today uuid;
BEGIN
    -- Check if user wants viewed_you notifications
    SELECT * INTO prefs FROM public.notification_preferences WHERE user_id = NEW.profile_id;
    
    IF prefs.viewed_you = true THEN
        -- Check if we already sent a viewed_you message today to avoid spamming the inbox
        SELECT id INTO existing_inbox_today 
        FROM public.inbox_messages 
        WHERE user_id = NEW.profile_id 
          AND type = 'viewed_you' 
          AND created_at > now() - INTERVAL '1 day'
        LIMIT 1;

        IF existing_inbox_today IS NULL THEN
            INSERT INTO public.inbox_messages (user_id, type, payload)
            VALUES (
                NEW.profile_id, 
                'viewed_you', 
                jsonb_build_object(
                    'title', 'Your profile is getting noticed', 
                    'body', 'You received new views on your directory profile today. Add recent photos to increase load matches.',
                    'action_url', '/profile'
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_directory_view_notify') THEN
        CREATE TRIGGER on_directory_view_notify
            AFTER INSERT ON public.directory_views
            FOR EACH ROW EXECUTE PROCEDURE public.handle_new_directory_view();
    END IF;
END
$$;
