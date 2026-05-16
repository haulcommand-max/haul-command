-- Canonical lead capture table for resource downloads, sponsor waitlists,
-- and other public demand-capture flows.
create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null default 'unknown',
  country_code text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  listmonk_id integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_captures_email_source_uniq unique (email, source),
  constraint lead_captures_email_has_at check (position('@' in email) > 1),
  constraint lead_captures_source_not_blank check (length(trim(source)) > 0)
);

create index if not exists idx_lead_captures_email on public.lead_captures (email);
create index if not exists idx_lead_captures_source on public.lead_captures (source);
create index if not exists idx_lead_captures_created on public.lead_captures (created_at desc);
create index if not exists idx_lead_captures_status on public.lead_captures (status);

create or replace function public.update_lead_captures_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lead_captures_updated_at on public.lead_captures;
create trigger trg_lead_captures_updated_at
  before update on public.lead_captures
  for each row
  execute function public.update_lead_captures_updated_at();

alter table public.lead_captures enable row level security;

drop policy if exists "service_role_all" on public.lead_captures;
drop policy if exists "anon_insert_leads" on public.lead_captures;
drop policy if exists "lead_captures_service_role_all" on public.lead_captures;
drop policy if exists "lead_captures_public_insert_only" on public.lead_captures;

create policy "lead_captures_service_role_all"
on public.lead_captures
for all
to service_role
using (true)
with check (true);

create policy "lead_captures_public_insert_only"
on public.lead_captures
for insert
to anon, authenticated
with check (
  email = lower(trim(email))
  and length(trim(source)) > 0
);

revoke all on public.lead_captures from anon, authenticated;
grant insert on public.lead_captures to anon, authenticated;
grant all on public.lead_captures to service_role;

do $$
begin
  if to_regclass('public.waitlist_signups') is not null then
    insert into public.lead_captures (email, source, country_code, metadata, created_at)
    select
      lower(trim(email)),
      'waitlist',
      upper(country_code),
      jsonb_build_object('original_source', source),
      coalesce(signed_up_at, now())
    from public.waitlist_signups
    where email is not null
    on conflict (email, source) do nothing;
  end if;
end;
$$;
