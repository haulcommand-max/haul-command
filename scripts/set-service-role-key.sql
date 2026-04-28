-- ════════════════════════════════════════════════════════════════
-- RUN THIS ONCE IN SUPABASE SQL EDITOR
-- Gets your service role key from: Dashboard → Settings → API
-- Paste it below replacing: YOUR_SERVICE_ROLE_KEY_HERE
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  srk text := 'YOUR_SERVICE_ROLE_KEY_HERE';
BEGIN
  IF srk = 'YOUR_SERVICE_ROLE_KEY_HERE' THEN
    RAISE EXCEPTION 'Replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key';
  END IF;

  -- Pattern 1: app_settings table (21 cron jobs use this)
  INSERT INTO public.app_settings (key, value)
  VALUES ('SERVICE_ROLE_KEY', to_jsonb(srk))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  -- Pattern 2: ALTER DATABASE (25 + 10 cron jobs use current_setting())
  EXECUTE format('ALTER DATABASE postgres SET "app.supabase_service_role_key" = %L', srk);
  EXECUTE format('ALTER DATABASE postgres SET "app.settings.service_role_key" = %L', srk);
  EXECUTE format('ALTER DATABASE postgres SET "app.settings.supabase_url" = %L',
    'https://hvjyfyzotqobfkakjozp.supabase.co');
  EXECUTE format('ALTER DATABASE postgres SET "app.supabase_url" = %L',
    'https://hvjyfyzotqobfkakjozp.supabase.co');

  RAISE NOTICE 'Done — all 56 cron jobs will have valid auth on next run.';
END;
$$;

-- Verify
SELECT key, LEFT(value::text, 40) as val
FROM public.app_settings
WHERE key IN ('SERVICE_ROLE_KEY', 'EDGE_BASE_URL');
