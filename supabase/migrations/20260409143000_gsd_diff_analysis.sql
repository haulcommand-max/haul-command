begin;

create table if not exists public.gsd_diff_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.gsd_projects(id) on delete cascade,
  pr_number integer,
  base_ref text not null,
  head_sha text not null,
  merge_base_sha text,
  changed_files jsonb not null default '[]'::jsonb,
  introduced_debt jsonb not null default '{}'::jsonb,
  baseline_debt jsonb not null default '{}'::jsonb,
  improvements jsonb not null default '{}'::jsonb,
  blocking_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gsd_diff_analysis_runs_project_idx
on public.gsd_diff_analysis_runs(project_id, created_at desc);

alter table public.gsd_diff_analysis_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gsd_diff_analysis_runs'
      and policyname = 'gsd_diff_analysis_runs_select_authenticated'
  ) then
    create policy gsd_diff_analysis_runs_select_authenticated
    on public.gsd_diff_analysis_runs
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'gsd_diff_analysis_runs'
      and policyname = 'gsd_diff_analysis_runs_write_authenticated'
  ) then
    create policy gsd_diff_analysis_runs_write_authenticated
    on public.gsd_diff_analysis_runs
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;

commit;
