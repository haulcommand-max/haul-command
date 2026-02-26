-- 0002_rls.sql
-- Row Level Security policies

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.driver_profiles enable row level security;
alter table public.broker_profiles enable row level security;
alter table public.equipment_catalog enable row level security;
alter table public.documents enable row level security;
alter table public.driver_equipment enable row level security;
alter table public.certifications enable row level security;
alter table public.loads enable row level security;
alter table public.offers enable row level security;
alter table public.jobs enable row level security;
alter table public.pretrip_handshakes enable row level security;
alter table public.evidence_artifacts enable row level security;
alter table public.gps_breadcrumbs enable row level security;
alter table public.payments enable row level security;
alter table public.hazards enable row level security;
alter table public.hazard_reports enable row level security;
alter table public.score_snapshots enable row level security;
alter table public.leaderboard_periods enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.audit_events enable row level security;
alter table public.feature_flags enable row level security;
alter table public.webhook_inbox enable row level security;

-- ---------- PROFILES ----------
-- Public read (limited fields ideally via view; for now allow read)
create policy "profiles_select_all"
on public.profiles for select
to authenticated
using (true);

-- Self update only
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---------- ORGS / MEMBERS ----------
create policy "orgs_select_members"
on public.orgs for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.org_members m where m.org_id = id and m.user_id = auth.uid())
);

create policy "orgs_insert_admin_only"
on public.orgs for insert
to authenticated
with check (public.is_admin());

create policy "org_members_select_members"
on public.org_members for select
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (select 1 from public.org_members m2 where m2.org_id = org_id and m2.user_id = auth.uid())
);

create policy "org_members_admin_manage"
on public.org_members for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- DRIVER / BROKER PROFILES ----------
create policy "driver_profiles_select_all"
on public.driver_profiles for select
to authenticated
using (true);

create policy "driver_profiles_upsert_self"
on public.driver_profiles for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "broker_profiles_select_all"
on public.broker_profiles for select
to authenticated
using (true);

create policy "broker_profiles_upsert_self"
on public.broker_profiles for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---------- EQUIPMENT CATALOG ----------
create policy "equipment_catalog_read_all"
on public.equipment_catalog for select
to authenticated
using (true);

create policy "equipment_catalog_admin_write"
on public.equipment_catalog for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- DOCUMENTS ----------
-- Owner or admin can read
create policy "documents_select_owner_or_admin"
on public.documents for select
to authenticated
using (owner_id = auth.uid() or public.is_admin());

-- Owner can insert
create policy "documents_insert_owner"
on public.documents for insert
to authenticated
with check (owner_id = auth.uid());

-- Owner can update ONLY non-verification fields (practical: allow update if owner, but keep verification admin-only)
create policy "documents_update_owner_limited"
on public.documents for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Admin can verify/reject
create policy "documents_admin_update"
on public.documents for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- DRIVER EQUIPMENT / CERTIFICATIONS ----------
create policy "driver_equipment_read_all"
on public.driver_equipment for select
to authenticated
using (true);

create policy "driver_equipment_write_self"
on public.driver_equipment for insert
to authenticated
with check (driver_id = auth.uid());

create policy "driver_equipment_update_self"
on public.driver_equipment for update
to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

create policy "driver_equipment_admin_verify"
on public.driver_equipment for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "certifications_read_all"
on public.certifications for select
to authenticated
using (true);

create policy "certifications_write_self"
on public.certifications for insert
to authenticated
with check (driver_id = auth.uid());

create policy "certifications_update_self"
on public.certifications for update
to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

create policy "certifications_admin_verify"
on public.certifications for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- LOADS ----------
-- Auth users can read posted loads (unless deleted)
create policy "loads_select_posted"
on public.loads for select
to authenticated
using (deleted_at is null and status in ('posted','paused','filled','cancelled','draft'));

-- Broker can manage own loads
create policy "loads_broker_write_own"
on public.loads for all
to authenticated
using (broker_id = auth.uid())
with check (broker_id = auth.uid());

-- Admin override
create policy "loads_admin_all"
on public.loads for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- OFFERS ----------
-- Driver sees own offers
create policy "offers_driver_select"
on public.offers for select
to authenticated
using (driver_id = auth.uid() and deleted_at is null);

-- Broker sees offers for their load
create policy "offers_broker_select"
on public.offers for select
to authenticated
using (
  exists (
    select 1 from public.loads l
    where l.id = load_id and l.broker_id = auth.uid()
  )
  and deleted_at is null
);

-- System creates offers (use service role in Edge Functions) OR admin
create policy "offers_admin_write"
on public.offers for insert
to authenticated
with check (public.is_admin());

-- Driver can update offer status (accept/decline)
create policy "offers_driver_update"
on public.offers for update
to authenticated
using (driver_id = auth.uid())
with check (driver_id = auth.uid());

-- ---------- JOBS ----------
-- Driver or broker or admin can read
create policy "jobs_select_parties"
on public.jobs for select
to authenticated
using (deleted_at is null and (driver_id = auth.uid() or broker_id = auth.uid() or public.is_admin()));

-- Broker can create jobs (from accepted offer) + update statuses
create policy "jobs_broker_write"
on public.jobs for insert
to authenticated
with check (broker_id = auth.uid());

create policy "jobs_parties_update"
on public.jobs for update
to authenticated
using (driver_id = auth.uid() or broker_id = auth.uid() or public.is_admin())
with check (driver_id = auth.uid() or broker_id = auth.uid() or public.is_admin());

-- ---------- PRETRIP / EVIDENCE ----------
create policy "pretrip_select_parties"
on public.pretrip_handshakes for select
to authenticated
using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.driver_id = auth.uid() or j.broker_id = auth.uid()))
  or public.is_admin()
);

create policy "pretrip_insert_driver_or_broker"
on public.pretrip_handshakes for insert
to authenticated
with check (
  exists (select 1 from public.jobs j where j.id = job_id and (j.driver_id = auth.uid() or j.broker_id = auth.uid()))
  or public.is_admin()
);

create policy "evidence_select_parties"
on public.evidence_artifacts for select
to authenticated
using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.driver_id = auth.uid() or j.broker_id = auth.uid()))
  or public.is_admin()
);

create policy "evidence_insert_parties"
on public.evidence_artifacts for insert
to authenticated
with check (
  exists (select 1 from public.jobs j where j.id = job_id and (j.driver_id = auth.uid() or j.broker_id = auth.uid()))
  or public.is_admin()
);

-- ---------- GPS ----------
create policy "gps_select_parties"
on public.gps_breadcrumbs for select
to authenticated
using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.driver_id = auth.uid() or j.broker_id = auth.uid()))
  or public.is_admin()
);

create policy "gps_insert_driver_only"
on public.gps_breadcrumbs for insert
to authenticated
with check (
  exists (select 1 from public.jobs j where j.id = job_id and j.driver_id = auth.uid())
  or public.is_admin()
);

-- ---------- PAYMENTS ----------
create policy "payments_select_parties"
on public.payments for select
to authenticated
using (broker_id = auth.uid() or driver_id = auth.uid() or public.is_admin());

-- Writes should be service-role (Stripe webhooks). Allow admin for manual recovery.
create policy "payments_admin_write"
on public.payments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- HAZARDS ----------
-- Read all hazards
create policy "hazards_select_all"
on public.hazards for select
to authenticated
using (true);

-- Crowd hazards insert by authenticated
create policy "hazards_insert_any"
on public.hazards for insert
to authenticated
with check (created_by = auth.uid() or created_by is null);

-- Update only by creator or admin
create policy "hazards_update_creator_or_admin"
on public.hazards for update
to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy "hazard_reports_select_all"
on public.hazard_reports for select
to authenticated
using (true);

create policy "hazard_reports_insert_self"
on public.hazard_reports for insert
to authenticated
with check (reporter_id = auth.uid());

-- ---------- SCORES / LEADERBOARDS ----------
create policy "scores_select_all"
on public.score_snapshots for select
to authenticated
using (true);

create policy "scores_admin_write"
on public.score_snapshots for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "lb_periods_select_all"
on public.leaderboard_periods for select
to authenticated
using (true);

create policy "lb_entries_select_all"
on public.leaderboard_entries for select
to authenticated
using (true);

create policy "leaderboards_admin_write"
on public.leaderboard_periods for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "leaderboards_admin_write_entries"
on public.leaderboard_entries for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- AUDIT ----------
-- Select admin only
create policy "audit_select_admin"
on public.audit_events for select
to authenticated
using (public.is_admin());

-- Insert: parties can insert their own events (or you can restrict to service role later)
create policy "audit_insert_any"
on public.audit_events for insert
to authenticated
with check (true);

-- No update/delete already blocked by triggers

-- ---------- FEATURE FLAGS / WEBHOOK INBOX ----------
create policy "feature_flags_admin"
on public.feature_flags for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "webhook_admin"
on public.webhook_inbox for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ---------- STORAGE POLICIES (run after creating buckets) ----------
-- Buckets recommended:
-- 1) public-assets (public)
-- 2) private-docs (private)
-- 3) evidence-private (private)

-- NOTE: Supabase Storage policies apply to storage.objects
-- This assumes you create buckets named exactly as above.

-- Allow authenticated users to upload to their own folder path:
-- private-docs/{auth.uid()}/...
create policy "private_docs_upload_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "private_docs_read_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'private-docs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy "evidence_upload_job_scoped"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'evidence-private'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "evidence_read_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'evidence-private'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
