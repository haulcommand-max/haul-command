-- 0011_leaderboards_rls.sql

-- EVENTS: private, write by service only
alter table public.leaderboard_events enable row level security;

-- nobody reads raw events (PII/behavioral)
drop policy if exists "events_select_none" on public.leaderboard_events;
create policy "events_select_none"
on public.leaderboard_events
for select
to public
using (false);

-- only service_role can insert/update/delete
drop policy if exists "events_write_service" on public.leaderboard_events;
create policy "events_write_service"
on public.leaderboard_events
for all
to service_role
using (true)
with check (true);

-- ROLLUPS: public-readable, service writes
alter table public.leaderboard_rollups enable row level security;

drop policy if exists "rollups_select_public" on public.leaderboard_rollups;
create policy "rollups_select_public"
on public.leaderboard_rollups
for select
to public
using (true);

drop policy if exists "rollups_write_service" on public.leaderboard_rollups;
create policy "rollups_write_service"
on public.leaderboard_rollups
for all
to service_role
using (true)
with check (true);

-- OPTIONAL: lock down direct updates for authenticated users (already blocked by RLS)
-- No extra policy needed.
