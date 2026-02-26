-- 0029_high_pole_calibration.sql
-- High pole calibration logs + PDF artifact path.

begin;

create table if not exists public.high_pole_calibrations (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  profile_id              uuid not null,
  load_height_inches      int not null,
  pole_set_height_inches  int not null,
  required_buffer_inches  int not null default 6,
  status                  text not null default 'submitted'
                              check (status in ('submitted','approved','rejected')),
  photos                  jsonb not null default '[]'::jsonb,  -- storage paths
  notes                   text,
  artifact_pdf_path       text   -- set by highpole-calibration-pdf edge function
);

create index if not exists idx_high_pole_cal_profile  on public.high_pole_calibrations(profile_id);
create index if not exists idx_high_pole_cal_created  on public.high_pole_calibrations(created_at desc);

alter table public.high_pole_calibrations enable row level security;

-- Owner can read their own calibrations
create policy "high_pole_cal_owner_read"
on public.high_pole_calibrations for select
to authenticated
using (profile_id = auth.uid());

-- Owner submits calibrations
create policy "high_pole_cal_owner_insert"
on public.high_pole_calibrations for insert
to authenticated
with check (profile_id = auth.uid());

-- service_role updates (sets artifact_pdf_path, status)
create policy "high_pole_cal_deny_client_update"
on public.high_pole_calibrations for update
to authenticated
using (false);

commit;
