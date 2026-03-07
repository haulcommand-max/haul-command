-- ============================================================
-- AUTHORITY DIRECTORY — ROW LEVEL SECURITY
-- Public read for published content, gated writes
-- ============================================================
begin;

-- Enable RLS on all authority tables
alter table public.authority_jurisdictions       enable row level security;
alter table public.authority_sources             enable row level security;
alter table public.authority_orgs                enable row level security;
alter table public.authority_org_jurisdictions   enable row level security;
alter table public.authority_contacts            enable row level security;
alter table public.authority_rulesets            enable row level security;
alter table public.authority_threshold_tables    enable row level security;
alter table public.authority_change_log          enable row level security;
alter table public.authority_reports             enable row level security;
alter table public.authority_verification_tasks  enable row level security;

-- ------------------------------------------------------------
-- Helper: admin check (service_role or hc_admin claim)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce((auth.jwt() ->> 'role') = 'service_role', false)
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'hc_admin')::boolean, false);
$$;

-- ============================================================
-- PUBLIC READ POLICIES
-- ============================================================

-- Jurisdictions: fully public
create policy "public_read_jurisdictions"
  on public.authority_jurisdictions for select using (true);

-- Orgs: fully public
create policy "public_read_orgs"
  on public.authority_orgs for select using (true);

-- Org-Jurisdiction mappings: fully public
create policy "public_read_org_jurisdictions"
  on public.authority_org_jurisdictions for select using (true);

-- Contacts: only public + active
create policy "public_read_contacts_public_active"
  on public.authority_contacts for select
  using (is_public = true and is_active = true);

-- Rulesets: only active
create policy "public_read_rulesets_active"
  on public.authority_rulesets for select
  using (is_active = true);

-- Threshold tables: via active ruleset
create policy "public_read_threshold_tables_via_ruleset"
  on public.authority_threshold_tables for select
  using (
    exists (
      select 1 from public.authority_rulesets r
      where r.id = authority_threshold_tables.ruleset_id
        and r.is_active = true
    )
  );

-- Sources: admin-only
create policy "admin_read_sources"
  on public.authority_sources for select
  using (public.is_admin());

-- Change log: admin-only
create policy "admin_read_change_log"
  on public.authority_change_log for select
  using (public.is_admin());

-- Verification tasks: admin-only (all ops)
create policy "admin_manage_verification_tasks"
  on public.authority_verification_tasks for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- WRITE POLICIES — Admin only for core data
-- ============================================================

create policy "admin_manage_jurisdictions"
  on public.authority_jurisdictions for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_orgs"
  on public.authority_orgs for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_org_jurisdictions"
  on public.authority_org_jurisdictions for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_contacts"
  on public.authority_contacts for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_rulesets"
  on public.authority_rulesets for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_threshold_tables"
  on public.authority_threshold_tables for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_sources"
  on public.authority_sources for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admin_manage_change_log"
  on public.authority_change_log for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- REPORTS — Authenticated users can submit, admin can manage
-- ============================================================

create policy "auth_create_reports"
  on public.authority_reports for insert
  with check (auth.uid() is not null);

create policy "read_own_or_admin_reports"
  on public.authority_reports for select
  using (public.is_admin() or reporter_user_id = auth.uid());

create policy "admin_update_reports"
  on public.authority_reports for update
  using (public.is_admin()) with check (public.is_admin());

commit;
