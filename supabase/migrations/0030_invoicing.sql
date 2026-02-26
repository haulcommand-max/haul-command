-- 0030_invoicing.sql
-- Driver invoices with line items + PDF artifact.

begin;

create table if not exists public.invoices (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  profile_id        uuid not null,       -- driver (invoice sender)
  broker_profile_id uuid,                -- broker (invoice recipient), nullable for self-generated
  job_id            uuid,                -- optional link to jobs table
  currency          text not null default 'USD',
  status            text not null default 'draft'
                        check (status in ('draft','sent','paid','overdue','void')),
  line_items        jsonb not null default '[]'::jsonb,
  -- line_item shape: [{description, qty, unit_price_cents, total_cents}]
  totals            jsonb not null default '{}'::jsonb,
  -- totals shape: {subtotal_cents, tax_cents, total_cents}
  artifact_pdf_path text   -- set by invoice-generate-pdf edge function
);

create index if not exists idx_invoices_profile  on public.invoices(profile_id);
create index if not exists idx_invoices_job      on public.invoices(job_id) where job_id is not null;
create index if not exists idx_invoices_status   on public.invoices(status);

alter table public.invoices enable row level security;

-- Owner reads their invoices
create policy "invoices_owner_read"
on public.invoices for select
to authenticated
using (profile_id = auth.uid());

-- Owner creates draft invoices
create policy "invoices_owner_insert"
on public.invoices for insert
to authenticated
with check (profile_id = auth.uid());

-- Owner can update their own draft invoices only
create policy "invoices_owner_update_draft"
on public.invoices for update
to authenticated
using (profile_id = auth.uid() and status = 'draft')
with check (profile_id = auth.uid());

-- Broker can read invoices addressed to them
create policy "invoices_broker_read"
on public.invoices for select
to authenticated
using (broker_profile_id = auth.uid());

commit;
