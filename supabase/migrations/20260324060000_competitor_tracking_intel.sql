-- Canonical competitor displacement schema for the admin-only competitor dashboard.
-- This migration intentionally creates source-backed storage only. It does not
-- seed competitor counts or public operator claims.

begin;

create table if not exists public.competitor_intel (
  id uuid primary key default gen_random_uuid(),
  competitor_name text not null,
  country_code text default 'US',
  state text,
  competitor_operator_count integer default 0,
  our_operator_count integer default 0,
  coverage_delta integer generated always as (our_operator_count - competitor_operator_count) stored,
  our_status text generated always as (
    case
      when our_operator_count > competitor_operator_count then 'WINNING'
      when our_operator_count = competitor_operator_count then 'TIED'
      else 'BEHIND'
    end
  ) stored,
  competitor_url text,
  source_url text,
  source_name text,
  observed_at timestamptz,
  confidence_score numeric(5,4) default 0,
  ingestion_run_id uuid,
  is_mocked boolean not null default false,
  last_checked timestamptz default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint competitor_intel_status_check check (our_status in ('WINNING', 'TIED', 'BEHIND')),
  constraint competitor_intel_confidence_score_check check (confidence_score >= 0 and confidence_score <= 1)
);

create index if not exists idx_competitor_intel_market
  on public.competitor_intel (country_code, state, competitor_name);

create index if not exists idx_competitor_intel_status
  on public.competitor_intel (our_status, coverage_delta);

create table if not exists public.competitor_operator_overlap (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid,
  competitor_name text not null,
  competitor_profile_url text,
  country_code text default 'US',
  state text,
  match_confidence numeric(5,4) default 0,
  source_url text,
  observed_at timestamptz,
  ingestion_run_id uuid,
  is_mocked boolean not null default false,
  created_at timestamptz default now(),
  constraint competitor_operator_overlap_confidence_check check (match_confidence >= 0 and match_confidence <= 1)
);

create index if not exists idx_competitor_operator_overlap_operator
  on public.competitor_operator_overlap (operator_id);

create index if not exists idx_competitor_operator_overlap_market
  on public.competitor_operator_overlap (country_code, state, competitor_name);

alter table if exists public.operators
  add column if not exists competitor_sourced boolean default false,
  add column if not exists competitor_source text,
  add column if not exists competitor_profile_url text,
  add column if not exists competitor_id text,
  add column if not exists claim_priority text,
  add column if not exists claim_value_score numeric,
  add column if not exists competitor_source_url text,
  add column if not exists competitor_observed_at timestamptz,
  add column if not exists competitor_confidence_score numeric(5,4),
  add column if not exists competitor_ingestion_run_id uuid,
  add column if not exists competitor_is_mocked boolean not null default false;

create index if not exists idx_operators_competitor_sourced
  on public.operators (competitor_sourced, claim_value_score desc)
  where competitor_sourced = true;

alter table public.competitor_intel enable row level security;
alter table public.competitor_operator_overlap enable row level security;

do $$
begin
  if to_regclass('public.operators') is not null then
    execute 'alter table public.operators enable row level security';
  end if;
end $$;

revoke all on table public.competitor_intel from anon, authenticated;
revoke all on table public.competitor_operator_overlap from anon, authenticated;

create or replace function public.refresh_competitor_intel()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.competitor_intel
  set
    last_checked = coalesce(last_checked, now()),
    updated_at = now()
  where last_checked is null
     or updated_at < now() - interval '1 day';
end;
$$;

comment on table public.competitor_intel is
  'Admin-only competitor coverage deltas. Counts must come from observed source URLs or explicit ingestion runs; no public grants.';

comment on column public.competitor_intel.is_mocked is
  'True only for non-production research rows. Admin dashboard must treat these as non-authoritative.';

comment on column public.operators.competitor_is_mocked is
  'True only when the competitor-sourced operator row came from a mock or non-authoritative seed.';

commit;
