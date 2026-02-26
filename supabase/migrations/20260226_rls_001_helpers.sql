-- ============================================================================
-- RLS Hardening: Step 1 — Helper Functions (is_admin / is_moderator_or_admin)
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid() and ur.role = 'admin'
    );
$$;

create or replace function public.is_moderator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role in ('admin','moderator')
    );
$$;
