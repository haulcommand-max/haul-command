-- IndexNow queue throughput acceleration.
-- Purpose: keep new directory/category/profile surfaces from sitting in the
-- crawl-notification queue for days after production deploy.

do $$
begin
  perform cron.unschedule('hc-indexnow-ping');
exception
  when others then
    null;
end $$;

select cron.schedule(
  'hc-indexnow-ping',
  '*/5 * * * *',
  'SELECT public.fn_hc_send_indexnow_pings(500);'
);

insert into public.hc_policy (key, description, value_type, default_value, updated_at)
values (
  'seo.indexnow.queue_drain_cadence',
  'IndexNow queue drain cadence is every 5 minutes at 500 URLs per run while the directory is expanding. This prevents crawl-notification backlog from becoming an SEO activation blocker.',
  'text',
  '"500_urls_every_5_minutes"'::jsonb,
  now()
)
on conflict (key) do update
set description = excluded.description,
    value_type = excluded.value_type,
    default_value = excluded.default_value,
    updated_at = now();
