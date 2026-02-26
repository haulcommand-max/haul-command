-- ============================================================================
-- RLS Hardening: Step 0 — User Roles for Admin/Moderator RBAC
-- ============================================================================

create table if not exists public.user_roles (
    user_id    uuid not null references auth.users(id) on delete cascade,
    role       text not null check (role in ('admin','moderator','staff')),
    created_at timestamptz not null default now(),
    primary key (user_id, role)
);

alter table public.user_roles enable row level security;

-- Only admins can manage roles (service_role bypasses RLS automatically)
drop policy if exists "user_roles_admin_read" on public.user_roles;
create policy "user_roles_admin_read"
on public.user_roles for select
to authenticated
using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
));

drop policy if exists "user_roles_admin_write" on public.user_roles;
create policy "user_roles_admin_write"
on public.user_roles for all
to authenticated
using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
))
with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
));
