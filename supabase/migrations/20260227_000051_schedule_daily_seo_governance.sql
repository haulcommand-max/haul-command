-- ============================================================
-- pg_cron: Schedule daily SEO governance at 03:30 UTC
-- ============================================================
begin;

create extension if not exists pg_cron;

select
  cron.schedule(
    'hc_daily_seo_governance',
    '30 3 * * *',
    $$select public.run_daily_seo_governance((now() at time zone 'utc')::date);$$
  )
on conflict do nothing;

commit;
