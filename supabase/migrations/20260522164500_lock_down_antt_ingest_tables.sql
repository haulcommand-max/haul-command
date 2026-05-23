-- Lock down ANTT ingest staging tables. These are worker-owned ingestion
-- surfaces, not public Data API surfaces.

revoke all on table public.hc_antt_bulk_snapshots from anon, authenticated;
revoke all on table public.hc_antt_brazil_carriers from anon, authenticated;

grant select, insert, update, delete on table public.hc_antt_bulk_snapshots to service_role;
grant select, insert, update, delete on table public.hc_antt_brazil_carriers to service_role;

alter table public.hc_antt_bulk_snapshots enable row level security;
alter table public.hc_antt_brazil_carriers enable row level security;

notify pgrst, 'reload schema';
