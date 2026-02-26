-- 0027_event_log.sql
-- Generic event spine: retention, analytics, SEO queue, trust signals.
-- service_role writes; authenticated reads own; anon blocked.

begin;

create table if not exists public.event_log (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  actor_profile_id uuid,
  actor_role  text,
  event_type  text not null,
  entity_type text,
  entity_id   uuid,
  region_country text,
  region_admin1  text,   -- state/province slug
  region_city    text,
  payload     jsonb not null default '{}'::jsonb
);

create index if not exists idx_event_log_created_at  on public.event_log (created_at desc);
create index if not exists idx_event_log_event_type  on public.event_log (event_type);
create index if not exists idx_event_log_entity      on public.event_log (entity_type, entity_id);
create index if not exists idx_event_log_actor       on public.event_log (actor_profile_id) where actor_profile_id is not null;

alter table public.event_log enable row level security;

-- Authenticated users can read their own events
create policy "event_log_read_own"
on public.event_log for select
to authenticated
using (actor_profile_id = auth.uid());

-- service_role bypasses RLS; deny direct writes from client roles
create policy "event_log_deny_client_insert"
on public.event_log for insert
to authenticated
with check (false);

create policy "event_log_deny_client_update"
on public.event_log for update
to authenticated
using (false);

create policy "event_log_deny_client_delete"
on public.event_log for delete
to authenticated
using (false);

commit;
