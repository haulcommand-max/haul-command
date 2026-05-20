create extension if not exists pgcrypto;

create table if not exists public.directory_search_logs (
  id uuid primary key default gen_random_uuid(),
  raw_query text not null default '',
  parsed_role text,
  parsed_country text,
  parsed_state text,
  parsed_city text,
  result_count integer not null default 0,
  no_results boolean not null default false,
  filters jsonb not null default '{}'::jsonb,
  source text not null default 'directory',
  visitor_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_directory_search_logs_created
  on public.directory_search_logs(created_at desc);

create index if not exists idx_directory_search_logs_geo
  on public.directory_search_logs(parsed_country, parsed_state, parsed_city);

create index if not exists idx_directory_search_logs_role
  on public.directory_search_logs(parsed_role);

create index if not exists idx_directory_search_logs_no_results
  on public.directory_search_logs(no_results, created_at desc);

alter table public.directory_search_logs enable row level security;

drop policy if exists directory_search_logs_deny_anon_auth on public.directory_search_logs;
create policy directory_search_logs_deny_anon_auth
  on public.directory_search_logs
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on table public.directory_search_logs is
  'Server-written directory search demand signals. Public users never read raw rows; aggregates feed demand intelligence and no-result market gap repair.';
