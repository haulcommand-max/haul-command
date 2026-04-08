create index if not exists idx_hc_signal_events_event_name on public.hc_signal_events(event_name);
create index if not exists idx_hc_signal_events_object on public.hc_signal_events(object_type, object_id);
create index if not exists idx_hc_signal_events_geo on public.hc_signal_events(country_code, region_code, city_slug);
create index if not exists idx_hc_signal_events_status_created_at on public.hc_signal_events(status, created_at desc);
create index if not exists idx_hc_signal_events_dedupe_key on public.hc_signal_events(dedupe_key);

create index if not exists idx_hc_market_signals_signal_type on public.hc_market_signals(signal_type);
create index if not exists idx_hc_market_signals_object on public.hc_market_signals(object_type, object_id);
create index if not exists idx_hc_market_signals_geo on public.hc_market_signals(country_code, region_code, city_slug);
create index if not exists idx_hc_market_signals_status_updated on public.hc_market_signals(status, updated_at desc);
create index if not exists idx_hc_market_signals_scores on public.hc_market_signals(signal_score desc, urgency_score desc);

create index if not exists idx_hc_content_packets_signal_id on public.hc_content_packets(signal_id);
create index if not exists idx_hc_content_packets_status on public.hc_content_packets(status);
create index if not exists idx_hc_content_packets_object on public.hc_content_packets(object_type, object_id);
create index if not exists idx_hc_content_packets_geo on public.hc_content_packets(country_code, region_code, city_slug);
create index if not exists idx_hc_content_packets_created on public.hc_content_packets(created_at desc);

create index if not exists idx_hc_distribution_jobs_packet_id on public.hc_distribution_jobs(content_packet_id);
create index if not exists idx_hc_distribution_jobs_status on public.hc_distribution_jobs(status);
create index if not exists idx_hc_distribution_jobs_channel_status on public.hc_distribution_jobs(channel, status);
create index if not exists idx_hc_distribution_jobs_scheduled on public.hc_distribution_jobs(scheduled_for);

create index if not exists idx_hc_claim_pressure_targets_priority on public.hc_claim_pressure_targets(priority_score desc);
create index if not exists idx_hc_claim_pressure_targets_status on public.hc_claim_pressure_targets(status);

create index if not exists idx_hc_surface_refresh_jobs_status on public.hc_surface_refresh_jobs(status);
create index if not exists idx_hc_surface_refresh_jobs_surface on public.hc_surface_refresh_jobs(surface_type, surface_key);

create index if not exists idx_hc_geo_distribution_accounts_channel_country on public.hc_geo_distribution_accounts(channel, country_code);
create index if not exists idx_hc_content_templates_lookup on public.hc_content_templates(signal_type, object_type, channel, language_code);
create index if not exists idx_hc_market_gap_targets_geo on public.hc_market_gap_targets(country_code, region_code, city_slug);
create index if not exists idx_hc_sponsor_inventory_dynamic_lookup on public.hc_sponsor_inventory_dynamic(page_family, country_code, region_code, city_slug);
create index if not exists idx_hc_data_product_snapshots_lookup on public.hc_data_product_snapshots(snapshot_type, country_code, region_code);
