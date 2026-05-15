-- Queue health and backlog acceleration.
-- Purpose: distinguish real work from quarantined low-signal gaps and expose
-- live queue lag so Haul Command does not treat hidden queues as "done."

update public.hc_seo_gap_queue
set status = 'quarantined_low_signal'
where status = 'pending'
  and coalesce(urgency_score, 0) < 70
  and (
    suggested_slug is null
    or suggested_page_type is null
    or role_context is null
  );

create or replace view public.v_hc_execution_queue_health
with (security_invoker = true) as
select
  'overpass_work'::text as queue_name,
  status::text as queue_state,
  count(*)::bigint as item_count,
  min(created_at) as oldest_created_at,
  max(updated_at) as newest_updated_at,
  case
    when status in ('pending','running') and count(*) > 0 then 'active_ingestion'
    else 'clear_or_historical'
  end as operational_state
from public.hc_overpass_work_queue
group by status
union all
select
  'open_data_ingestion'::text,
  promotion_status::text,
  count(*)::bigint,
  min(created_at),
  max(updated_at),
  case
    when promotion_status = 'pending' and count(*) > 0 then 'active_promotion_backlog'
    when promotion_status in ('promoted','duplicate_of_existing','rejected') then 'resolved'
    else 'needs_review'
  end
from public.hc_open_data_ingestion_queue
group by promotion_status
union all
select
  'indexnow'::text,
  status::text,
  count(*)::bigint,
  min(created_at),
  max(coalesce(submitted_at, scheduled_at, created_at)),
  case
    when status = 'queued' and count(*) > 0 then 'active_indexing_backlog'
    else 'clear_or_historical'
  end
from public.hc_indexnow_queue
group by status
union all
select
  'seo_gap'::text,
  status::text,
  count(*)::bigint,
  min(created_at),
  max(created_at),
  case
    when status = 'pending' and count(*) > 0 then 'publishable_gap_backlog'
    when status like 'quarantined%' then 'quarantined_not_blocking'
    else 'clear_or_historical'
  end
from public.hc_seo_gap_queue
group by status;

grant select on public.v_hc_execution_queue_health to anon, authenticated;

update public.hc_policy
set default_value = '"queue_health_visible"'::jsonb,
    updated_at = now()
where key = 'directory.category_registry.status'
  and exists (select 1 from public.hc_policy where key = 'directory.category_registry.status');

insert into public.hc_policy (key, description, value_type, default_value, updated_at)
values (
  'operations.queue_health.required',
  'Live execution queues must be measured through v_hc_execution_queue_health. Pending ingestion is active work, not a hidden blocker; low-signal SEO gaps are quarantined instead of left pending.',
  'text',
  '"required"'::jsonb,
  now()
)
on conflict (key) do update
set description = excluded.description,
    value_type = excluded.value_type,
    default_value = excluded.default_value,
    updated_at = now();

