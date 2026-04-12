create trigger trg_hc_market_signals_updated_at
before update on public.hc_market_signals
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_content_packets_updated_at
before update on public.hc_content_packets
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_distribution_jobs_updated_at
before update on public.hc_distribution_jobs
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_claim_pressure_targets_updated_at
before update on public.hc_claim_pressure_targets
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_surface_refresh_jobs_updated_at
before update on public.hc_surface_refresh_jobs
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_content_templates_updated_at
before update on public.hc_content_templates
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_localization_bundles_updated_at
before update on public.hc_localization_bundles
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_market_gap_targets_updated_at
before update on public.hc_market_gap_targets
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_sponsor_inventory_dynamic_updated_at
before update on public.hc_sponsor_inventory_dynamic
for each row
execute procedure public.set_updated_at();

create trigger trg_hc_agent_configs_updated_at
before update on public.hc_agent_configs
for each row
execute procedure public.set_updated_at();

alter table public.hc_signal_events enable row level security;
alter table public.hc_market_signals enable row level security;
alter table public.hc_content_packets enable row level security;
alter table public.hc_distribution_jobs enable row level security;
alter table public.hc_claim_pressure_targets enable row level security;
alter table public.hc_surface_refresh_jobs enable row level security;
alter table public.hc_geo_distribution_accounts enable row level security;
alter table public.hc_content_templates enable row level security;
alter table public.hc_localization_bundles enable row level security;
alter table public.hc_market_gap_targets enable row level security;
alter table public.hc_sponsor_inventory_dynamic enable row level security;
alter table public.hc_data_product_snapshots enable row level security;
alter table public.hc_agent_configs enable row level security;

create policy "service_role_hc_signal_events_all"
  on public.hc_signal_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_market_signals_all"
  on public.hc_market_signals
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_content_packets_all"
  on public.hc_content_packets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_distribution_jobs_all"
  on public.hc_distribution_jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_claim_pressure_targets_all"
  on public.hc_claim_pressure_targets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_surface_refresh_jobs_all"
  on public.hc_surface_refresh_jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_geo_distribution_accounts_all"
  on public.hc_geo_distribution_accounts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_content_templates_all"
  on public.hc_content_templates
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_localization_bundles_all"
  on public.hc_localization_bundles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_market_gap_targets_all"
  on public.hc_market_gap_targets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_sponsor_inventory_dynamic_all"
  on public.hc_sponsor_inventory_dynamic
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_data_product_snapshots_all"
  on public.hc_data_product_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service_role_hc_agent_configs_all"
  on public.hc_agent_configs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "authenticated_select_hc_sponsor_inventory_dynamic"
  on public.hc_sponsor_inventory_dynamic
  for select
  using (auth.role() in ('authenticated', 'anon') and active = true);

create policy "authenticated_select_hc_data_product_snapshots"
  on public.hc_data_product_snapshots
  for select
  using (auth.role() in ('authenticated', 'anon'));

create policy "authenticated_select_hc_localization_bundles"
  on public.hc_localization_bundles
  for select
  using (auth.role() in ('authenticated', 'anon'));
