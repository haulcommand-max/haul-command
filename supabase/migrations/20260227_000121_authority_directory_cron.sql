-- ============================================================
-- AUTHORITY DIRECTORY — CRON SCHEDULING
-- ============================================================
begin;

create extension if not exists pg_cron;

-- Nightly: queue stale contact/ruleset verifications
select cron.schedule(
  'hc_authority_queue_stale',
  '15 3 * * *',
  $$select public.queue_authority_verification_tasks();$$
);

-- Every 6 hours: escalate from report spikes
select cron.schedule(
  'hc_authority_report_spikes',
  '0 */6 * * *',
  $$select public.queue_tasks_from_report_spikes();$$
);

-- Every 4 hours: detect source hash changes
select cron.schedule(
  'hc_authority_source_hash_changes',
  '30 */4 * * *',
  $$select public.queue_tasks_from_source_hash_change();$$
);

commit;
