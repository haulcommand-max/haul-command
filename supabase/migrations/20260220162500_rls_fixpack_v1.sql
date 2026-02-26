-- ============================================================
-- Migration: RLS Fixpack v1
-- Enables RLS + policies on driver_profiles, broker_profiles,
-- loads, route_iq_cache. Creates helper functions.
-- ============================================================

-- 1) Helper: current_role() — returns user's role from profiles as text
create or replace function public.current_role()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    (select role::text from public.profiles where id = auth.uid()),
    'anonymous'
  );
$$;

-- 2) Helper: has_any_role(text[]) — true if user has ANY of the listed roles
create or replace function public.has_any_role(role_names text[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = any(role_names)
  );
$$;

-- 3) ENABLE RLS
alter table public.driver_profiles enable row level security;
alter table public.broker_profiles enable row level security;
alter table public.loads enable row level security;
alter table public.route_iq_cache enable row level security;

-- 4) driver_profiles policies
drop policy if exists "driver_profiles_public_read" on public.driver_profiles;
create policy "driver_profiles_public_read"
on public.driver_profiles for select using (true);

drop policy if exists "driver_profiles_self_insert" on public.driver_profiles;
create policy "driver_profiles_self_insert"
on public.driver_profiles for insert
with check (user_id = auth.uid());

drop policy if exists "driver_profiles_self_update" on public.driver_profiles;
create policy "driver_profiles_self_update"
on public.driver_profiles for update
using (user_id = auth.uid() or public.has_any_role(array['owner_admin','admin','moderator']))
with check (user_id = auth.uid() or public.has_any_role(array['owner_admin','admin','moderator']));

-- 5) broker_profiles policies
drop policy if exists "broker_profiles_public_read" on public.broker_profiles;
create policy "broker_profiles_public_read"
on public.broker_profiles for select using (true);

drop policy if exists "broker_profiles_self_insert" on public.broker_profiles;
create policy "broker_profiles_self_insert"
on public.broker_profiles for insert
with check (user_id = auth.uid());

drop policy if exists "broker_profiles_self_update" on public.broker_profiles;
create policy "broker_profiles_self_update"
on public.broker_profiles for update
using (user_id = auth.uid() or public.has_any_role(array['owner_admin','admin']))
with check (user_id = auth.uid() or public.has_any_role(array['owner_admin','admin']));

-- 6) loads policies
drop policy if exists "loads_public_read" on public.loads;
create policy "loads_public_read"
on public.loads for select
using (status in ('active','filled','expired'));

drop policy if exists "loads_broker_insert" on public.loads;
create policy "loads_broker_insert"
on public.loads for insert
with check (
  exists (select 1 from public.broker_profiles bp where bp.user_id = auth.uid())
  or public.has_any_role(array['owner_admin','admin'])
);

drop policy if exists "loads_owner_update" on public.loads;
create policy "loads_owner_update"
on public.loads for update
using (
  exists (select 1 from public.broker_profiles bp join public.brokers b on b.id = loads.broker_id where bp.user_id = auth.uid())
  or public.has_any_role(array['owner_admin','admin','moderator'])
)
with check (
  exists (select 1 from public.broker_profiles bp join public.brokers b on b.id = loads.broker_id where bp.user_id = auth.uid())
  or public.has_any_role(array['owner_admin','admin','moderator'])
);

drop policy if exists "loads_admin_delete" on public.loads;
create policy "loads_admin_delete"
on public.loads for delete
using (public.has_any_role(array['owner_admin','admin']));

-- 7) route_iq_cache policies (admin-only; edge fns use service_role = bypass)
drop policy if exists "route_iq_cache_admin_read" on public.route_iq_cache;
create policy "route_iq_cache_admin_read"
on public.route_iq_cache for select
using (public.has_any_role(array['owner_admin','admin']));

drop policy if exists "route_iq_cache_admin_insert" on public.route_iq_cache;
create policy "route_iq_cache_admin_insert"
on public.route_iq_cache for insert
with check (public.has_any_role(array['owner_admin','admin']));

drop policy if exists "route_iq_cache_admin_update" on public.route_iq_cache;
create policy "route_iq_cache_admin_update"
on public.route_iq_cache for update
using (public.has_any_role(array['owner_admin','admin']))
with check (public.has_any_role(array['owner_admin','admin']));

drop policy if exists "route_iq_cache_admin_delete" on public.route_iq_cache;
create policy "route_iq_cache_admin_delete"
on public.route_iq_cache for delete
using (public.has_any_role(array['owner_admin','admin']));
