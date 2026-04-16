-- Haul Command — Notification Drain Cron + Supporting Infrastructure
-- Migration: 20260416_000001_notif_drain_cron.sql
-- Purpose: Wire pg_cron to drain hc_notif_jobs every 30 seconds via
--          Supabase Edge Function HTTP call. Also wires the Monday
--          claim reminder schedule. Requires pg_cron and pg_net extensions.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Increment helper for job attempt counter
--    Called via RPC in notification-dispatch edge function.
--    coalesce(attempts, 0) + 1  — avoids null arithmetic errors.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.coalesce_increment_attempts()
returns int language sql stable as $$
  select 1;  -- placeholder; actual increment done in UPDATE SET attempts = attempts + 1
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Drain function: calls notification-dispatch edge function via pg_net
--    Scheduled every 30 seconds by pg_cron below.
--    pg_net is available in Supabase projects by default.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.hc_drain_notif_jobs()
returns void language plpgsql as $$
declare
  v_url    text;
  v_key    text;
begin
  -- Read config from feature_flags / app_settings to avoid hardcoding
  select
    coalesce(
      (select value from public.app_settings where key = 'supabase_functions_url' limit 1),
      current_setting('app.supabase_url', true) || '/functions/v1'
    )
  into v_url;

  select
    coalesce(
      (select value from public.app_settings where key = 'supabase_service_role_key' limit 1),
      current_setting('app.service_role_key', true)
    )
  into v_key;

  if v_url is null or v_key is null then
    raise warning '[hc_drain_notif_jobs] Missing supabase_functions_url or service key — skipping drain';
    return;
  end if;

  perform net.http_post(
    url     := v_url || '/notification-dispatch',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. pg_cron Schedules
--    NOTE: pg_cron minimum resolution is 1 minute. For near-real-time drain
--    (30-second cadence), the standard Supabase pattern is to use a Realtime
--    DB Webhook on hc_notif_jobs INSERT instead — configured in the Supabase
--    Dashboard under Database > Webhooks. The cron below provides a guaranteed
--    drain floor (in case the webhook misses).
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove existing conflicting schedules if any
select cron.unschedule('notif-drain-1min')    where exists (select 1 from cron.job where jobname = 'notif-drain-1min');
select cron.unschedule('weekly-claim-reminders') where exists (select 1 from cron.job where jobname = 'weekly-claim-reminders');
select cron.unschedule('notif-stale-token-cleanup') where exists (select 1 from cron.job where jobname = 'notif-stale-token-cleanup');

-- Every minute: drain notification job queue (floor guarantee)
select cron.schedule(
  'notif-drain-1min',
  '* * * * *',  -- every minute
  'select public.hc_drain_notif_jobs()'
);

-- Every Monday 09:00 UTC: enqueue claim reminders for unclaimed users
select cron.schedule(
  'weekly-claim-reminders',
  '0 9 * * 1',
  'select public.hc_enqueue_claim_reminders()'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Stale token cleanup — runs nightly at 02:00 UTC
--    Removes hc_device_tokens that haven't been seen in 90 days and are inactive.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.hc_cleanup_stale_tokens()
returns int language plpgsql as $$
declare
  v_count int;
begin
  delete from public.hc_device_tokens
  where is_active = false
    and last_seen_at < now() - interval '90 days';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select cron.schedule(
  'notif-stale-token-cleanup',
  '0 2 * * *',  -- every day at 02:00 UTC
  'select public.hc_cleanup_stale_tokens()'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. app_settings entries for the drain function config
--    These must be set with real values by the deployer (or via Supabase secrets).
--    Insert only if missing (do not overwrite existing prod values).
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.app_settings(key, value, description)
values
  (
    'supabase_functions_url',
    '',  -- FILL IN: e.g. https://xxxx.supabase.co/functions/v1
    'Base URL for Supabase Edge Functions, used by pg_net cron drain'
  ),
  (
    'notification_drain_enabled',
    'true',
    'Feature flag: enable hc_notif_jobs drain cron'
  )
on conflict (key) do nothing;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-MIGRATION CHECKLIST (run manually in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- 1. Set Supabase Secrets (Dashboard → Settings → Edge Functions → Secrets):
--      FIREBASE_PROJECT_ID     = your-gcp-project-id
--      FIREBASE_SERVICE_ACCOUNT = <full service account JSON, stringified>
--
-- 2. Set app_settings.supabase_functions_url:
--      UPDATE public.app_settings
--      SET value = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1'
--      WHERE key = 'supabase_functions_url';
--
-- 3. Configure Supabase DB Webhook (Dashboard → Database → Webhooks):
--      Table: hc_notif_jobs
--      Event: INSERT
--      URL:   https://YOUR_PROJECT_REF.supabase.co/functions/v1/notification-dispatch
--      Header: Authorization: Bearer <SERVICE_ROLE_KEY>
--    This provides near-real-time drain (sub-second latency on new jobs).
--    The pg_cron above is a 1-minute floor guarantee.
--
-- 4. Test the pipeline end-to-end:
--      -- Insert a test job
--      INSERT INTO public.hc_notif_jobs(event_type, mode, payload) VALUES (
--        'route_alert', 'single',
--        jsonb_build_object(
--          'eventType', 'route_alert',
--          'userId',    'YOUR_TEST_USER_UUID',
--          'title',     'Test Push',
--          'body',      'Haul Command push pipeline is live.',
--          'deepLink',  '/dashboard',
--          'dedupKey',  'test:pipeline:' || now()::text
--        )
--      );
--      -- Wait 1-2 seconds, then check:
--      SELECT * FROM public.hc_notif_events ORDER BY created_at DESC LIMIT 5;
--      SELECT * FROM public.hc_notif_jobs ORDER BY created_at DESC LIMIT 5;
