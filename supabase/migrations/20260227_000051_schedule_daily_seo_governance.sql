-- ============================================================
-- pg_cron: Schedule daily SEO governance at 03:30 UTC
-- ============================================================
create extension if not exists pg_cron;

-- Unschedule first so this is idempotent (cron.schedule errors if name already exists)
do $$
begin
  perform cron.unschedule('hc_daily_seo_governance');
exception when others then null;
end $$;

select cron.schedule(
  'hc_daily_seo_governance',
  '30 3 * * *',
  $$select public.run_daily_seo_governance((now() at time zone 'utc')::date);$$
);
