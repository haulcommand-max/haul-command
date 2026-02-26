-- 0028_insurance_docs.sql
-- Insurance OCR storage + extend compliance_reminders with ref columns.
-- compliance_reminders already exists (0016). We ADD columns only — backwards compatible.

begin;

-- ── insurance_docs ──────────────────────────────────────────────────────────
create table if not exists public.insurance_docs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  profile_id    uuid not null,                    -- auth.users.id
  storage_path  text not null,                    -- Supabase Storage path
  doc_type      text not null default 'acord_25',
  status        text not null default 'pending'
                    check (status in ('pending','parsed','verified','rejected')),
  parsed        jsonb not null default '{}'::jsonb,
  expires_on    date,
  limits        jsonb not null default '{}'::jsonb,  -- {gl, auto, umbrella, ...}
  producer      jsonb not null default '{}'::jsonb,  -- {name, email, phone}
  insured_name  text,
  policy_number text
);

create index if not exists idx_insurance_docs_profile  on public.insurance_docs(profile_id);
create index if not exists idx_insurance_docs_expires  on public.insurance_docs(expires_on)
  where expires_on is not null;

alter table public.insurance_docs enable row level security;

-- Owner reads their own docs
create policy "insurance_docs_owner_read"
on public.insurance_docs for select
to authenticated
using (profile_id = auth.uid());

-- Owner can initiate an upload (insert stub row)
create policy "insurance_docs_owner_insert"
on public.insurance_docs for insert
to authenticated
with check (profile_id = auth.uid());

-- service_role updates status/parsed fields (OCR result)
create policy "insurance_docs_deny_client_update"
on public.insurance_docs for update
to authenticated
using (false);

-- Timestamp trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_insurance_docs_updated_at on public.insurance_docs;
create trigger trg_insurance_docs_updated_at
before update on public.insurance_docs
for each row execute function public.set_updated_at();


-- ── extend compliance_reminders with new columns ─────────────────────────────
-- The table already exists from 0016 with: actor_id, kind (enum), due_at.
-- We ADD new columns so new edge functions can use ref_table / ref_id.
-- Old columns remain intact.

alter table public.compliance_reminders
  add column if not exists ref_table text,
  add column if not exists ref_id    uuid,
  add column if not exists run_at    timestamptz;   -- alias for due_at; null = use due_at

-- Populate run_at from due_at for existing rows (idempotent)
update public.compliance_reminders
set run_at = due_at
where run_at is null;

-- Add new status value 'queued' / 'skipped' to existing check constraint.
-- Supabase/Postgres: drop and recreate constraint.
alter table public.compliance_reminders
  drop constraint if exists compliance_reminders_status_check;

alter table public.compliance_reminders
  add constraint compliance_reminders_status_check
  check (status in ('pending','sent','dismissed','resolved','failed','queued','skipped'));

commit;
