-- =====================================================================
-- SONNET-01 Migration 1/3: GPS Proof Packet System
-- Mode: ADDITIVE ONLY — no existing columns or data modified
-- Opus signoff: 2026-04-10
-- =====================================================================
begin;

-- Add proof_packet_url to hc_jobs if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'hc_jobs' and column_name = 'proof_packet_url'
  ) then
    alter table public.hc_jobs add column proof_packet_url text;
  end if;
end $$;

-- Proof packets table — stores generated proof artifacts per job
create table if not exists public.proof_packets (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid not null,
  coverage_pct  numeric(5,2) not null default 0,
  breadcrumb_count int not null default 0,
  route_distance_km numeric(10,2),
  gps_start_at  timestamptz,
  gps_end_at    timestamptz,
  packet_url    text not null,
  packet_hash   text, -- sha256 of the proof JSON for tamper detection
  generated_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Index for fast lookup by job
create index if not exists idx_proof_packets_job_id
  on public.proof_packets (job_id);

-- Enable RLS (service-role only by default)
alter table public.proof_packets enable row level security;

commit;
