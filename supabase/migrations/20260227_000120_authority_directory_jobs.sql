-- ============================================================
-- AUTHORITY DIRECTORY — INGESTION & VERIFICATION JOBS
-- pg_cron-ready functions for auto-verification scheduling
-- ============================================================
begin;

-- ------------------------------------------------------------
-- Job 1: Queue verification tasks for stale contacts/rules
-- Contacts stale after 90 days, rules after 180 days
-- ------------------------------------------------------------
create or replace function public.queue_authority_verification_tasks()
returns void
language plpgsql
as $$
declare
  nowts timestamptz := now();
begin
  -- Stale contacts (90-day window)
  insert into public.authority_verification_tasks
    (task_type, contact_id, jurisdiction_id, due_at, priority, status, notes)
  select
    'verify_contact',
    c.id,
    c.jurisdiction_id,
    nowts + interval '1 day',
    4,
    'queued',
    'Auto-queued: contact verification stale (>90d)'
  from public.authority_contacts c
  where c.is_active = true
    and (c.last_verified_at is null or c.last_verified_at < (nowts - interval '90 days'))
    and not exists (
      select 1 from public.authority_verification_tasks t
      where t.contact_id = c.id
        and t.task_type = 'verify_contact'
        and t.status in ('queued', 'processing')
    );

  -- Stale rulesets (180-day window)
  insert into public.authority_verification_tasks
    (task_type, ruleset_id, jurisdiction_id, due_at, priority, status, notes)
  select
    'verify_rules',
    r.id,
    r.jurisdiction_id,
    nowts + interval '2 days',
    5,
    'queued',
    'Auto-queued: ruleset verification stale (>180d)'
  from public.authority_rulesets r
  where r.is_active = true
    and (r.last_verified_at is null or r.last_verified_at < (nowts - interval '180 days'))
    and not exists (
      select 1 from public.authority_verification_tasks t
      where t.ruleset_id = r.id
        and t.task_type = 'verify_rules'
        and t.status in ('queued', 'processing')
    );
end;
$$;

-- ------------------------------------------------------------
-- Job 2: Escalate when user reports spike
-- ≥3 open reports on same contact in 14 days → priority verify
-- ------------------------------------------------------------
create or replace function public.queue_tasks_from_report_spikes()
returns void
language plpgsql
as $$
declare
  nowts timestamptz := now();
begin
  -- Contact report spikes
  insert into public.authority_verification_tasks
    (task_type, contact_id, jurisdiction_id, due_at, priority, status, notes)
  select
    'verify_contact',
    r.contact_id,
    max(r.jurisdiction_id),
    nowts + interval '6 hours',
    2,
    'queued',
    'Auto-queued: report spike on contact (≥3 in 14d)'
  from public.authority_reports r
  where r.status = 'open'
    and r.contact_id is not null
    and r.created_at >= (nowts - interval '14 days')
  group by r.contact_id
  having count(*) >= 3
    and not exists (
      select 1 from public.authority_verification_tasks t
      where t.contact_id = r.contact_id
        and t.task_type = 'verify_contact'
        and t.status in ('queued', 'processing')
        and t.priority <= 2
    );

  -- Ruleset report spikes
  insert into public.authority_verification_tasks
    (task_type, ruleset_id, jurisdiction_id, due_at, priority, status, notes)
  select
    'verify_rules',
    r.ruleset_id,
    max(r.jurisdiction_id),
    nowts + interval '6 hours',
    2,
    'queued',
    'Auto-queued: report spike on ruleset (≥3 in 14d)'
  from public.authority_reports r
  where r.status = 'open'
    and r.ruleset_id is not null
    and r.created_at >= (nowts - interval '14 days')
  group by r.ruleset_id
  having count(*) >= 3
    and not exists (
      select 1 from public.authority_verification_tasks t
      where t.ruleset_id = r.ruleset_id
        and t.task_type = 'verify_rules'
        and t.status in ('queued', 'processing')
        and t.priority <= 2
    );
end;
$$;

-- ------------------------------------------------------------
-- Job 3: Detect source hash changes (PDF replaced)
-- When content_hash changed in last 2 days → queue refetch
-- ------------------------------------------------------------
create or replace function public.queue_tasks_from_source_hash_change()
returns void
language plpgsql
as $$
declare
  nowts timestamptz := now();
begin
  insert into public.authority_verification_tasks
    (task_type, source_id, jurisdiction_id, due_at, priority, status, notes)
  select
    'refetch_source',
    s.id,
    s.jurisdiction_id,
    nowts + interval '2 hours',
    2,
    'queued',
    'Auto-queued: source content hash changed'
  from public.authority_sources s
  where s.is_active = true
    and s.fetched_at >= (nowts - interval '2 days')
    and s.last_changed_at is not null
    and s.last_changed_at >= (nowts - interval '2 days')
    and not exists (
      select 1 from public.authority_verification_tasks t
      where t.source_id = s.id
        and t.task_type = 'refetch_source'
        and t.status in ('queued', 'processing')
    );
end;
$$;

commit;
