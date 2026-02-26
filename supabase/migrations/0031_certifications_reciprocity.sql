-- 0031_certifications_reciprocity.sql
-- Certification registry + reciprocity lookup rules.
-- (separate from existing reciprocity_matrix — this is the normalized authority-based version)

begin;

-- Certifications: the authoritative cert bodies (e.g., Utah, Colorado, ESCORTED, etc.)
create table if not exists public.certifications (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,     -- e.g. "utah", "colorado", "national_safety"
  title     text not null,
  country   text not null default 'us' check (country in ('us','ca')),
  authority text,                     -- issuing body
  active    boolean not null default true
);

-- Reciprocity rules: cert_slug → allowed in region_slug
create table if not exists public.reciprocity_rules (
  id             uuid primary key default gen_random_uuid(),
  from_cert_slug text not null references public.certifications(slug) on delete cascade,
  to_region_slug text not null,       -- state/province slug, e.g. "tx", "on"
  allowed        boolean not null default true,
  notes          text,
  updated_at     timestamptz not null default now(),
  unique(from_cert_slug, to_region_slug)
);

create index if not exists idx_reciprocity_from    on public.reciprocity_rules(from_cert_slug);
create index if not exists idx_reciprocity_to      on public.reciprocity_rules(to_region_slug);
create index if not exists idx_reciprocity_allowed on public.reciprocity_rules(from_cert_slug, to_region_slug, allowed);

alter table public.certifications enable row level security;
alter table public.reciprocity_rules enable row level security;

-- Public safety data — everyone can read
create policy "certifications_public_read"
on public.certifications for select
to anon, authenticated
using (active = true);

create policy "reciprocity_public_read"
on public.reciprocity_rules for select
to anon, authenticated
using (true);

-- service_role only writes (keep it authoritative; no client writes)
create policy "certifications_deny_client_write"
on public.certifications for insert
to authenticated
with check (false);

create policy "reciprocity_deny_client_write"
on public.reciprocity_rules for insert
to authenticated
with check (false);

commit;
