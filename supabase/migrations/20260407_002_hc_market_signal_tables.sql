create table if not exists public.hc_signal_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  object_type text not null,
  object_id text not null,
  country_code text,
  region_code text,
  city_slug text,
  corridor_id uuid,
  severity numeric(6,2) not null default 0,
  confidence numeric(6,4) not null default 0,
  payload_json jsonb not null default '{}'::jsonb,
  source_system text not null default 'app',
  dedupe_key text,
  fingerprint text,
  status public.hc_signal_status not null default 'queued',
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.hc_market_signals (
  id uuid primary key default gen_random_uuid(),
  signal_type text not null,
  source_event_id uuid references public.hc_signal_events(id) on delete set null,
  object_type text not null,
  object_id text not null,
  geo_scope text not null default 'global',
  country_code text,
  region_code text,
  city_slug text,
  corridor_id uuid,
  signal_score numeric(8,4) not null default 0,
  urgency_score numeric(8,4) not null default 0,
  seo_value_score numeric(8,4) not null default 0,
  claim_value_score numeric(8,4) not null default 0,
  monetization_value_score numeric(8,4) not null default 0,
  liquidity_value_score numeric(8,4) not null default 0,
  quality_score numeric(8,4) not null default 0,
  expires_at timestamptz,
  status public.hc_signal_status not null default 'queued',
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_content_packets (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references public.hc_market_signals(id) on delete cascade,
  packet_type text not null,
  object_type text not null,
  object_id text not null,
  geo_scope text not null default 'global',
  country_code text,
  region_code text,
  city_slug text,
  corridor_id uuid,
  language_code text not null default 'en',
  status public.hc_packet_status not null default 'draft',
  risk_level public.hc_risk_level not null default 'low',
  narrative_angle text,
  hook_text text,
  primary_cta text,
  secondary_cta text,
  packet_json jsonb not null default '{}'::jsonb,
  onsite_surface_targets_json jsonb not null default '[]'::jsonb,
  channel_targets_json jsonb not null default '[]'::jsonb,
  review_required boolean not null default false,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_distribution_jobs (
  id uuid primary key default gen_random_uuid(),
  content_packet_id uuid not null references public.hc_content_packets(id) on delete cascade,
  channel text not null,
  account_key text,
  publish_mode public.hc_publish_mode not null default 'draft_only',
  scheduled_for timestamptz,
  status public.hc_distribution_status not null default 'queued',
  priority_score numeric(8,4) not null default 0,
  retry_count integer not null default 0,
  external_reference text,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_claim_pressure_targets (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null unique,
  entity_type text not null default 'profile',
  country_code text,
  region_code text,
  city_slug text,
  traffic_score numeric(8,4) not null default 0,
  gap_score numeric(8,4) not null default 0,
  competitive_risk_score numeric(8,4) not null default 0,
  seo_value_score numeric(8,4) not null default 0,
  missed_money_score numeric(8,4) not null default 0,
  trust_gap_score numeric(8,4) not null default 0,
  claim_probability_score numeric(8,4) not null default 0,
  priority_score numeric(8,4) not null default 0,
  recommended_cta text,
  status text not null default 'open',
  last_notified_at timestamptz,
  next_notify_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_surface_refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  surface_type text not null,
  surface_key text not null,
  source_object_type text not null,
  source_object_id text not null,
  reason text not null,
  priority_score numeric(8,4) not null default 0,
  status text not null default 'queued',
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_geo_distribution_accounts (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  country_code text,
  region_code text,
  account_key text not null unique,
  publishing_rules_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hc_content_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  object_type text not null,
  signal_type text not null,
  channel text not null,
  language_code text not null default 'en',
  risk_level public.hc_risk_level not null default 'low',
  variant_label text,
  template_json jsonb not null default '{}'::jsonb,
  qa_rules_json jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_localization_bundles (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  language_code text not null,
  region_code text,
  currency_code text not null,
  distance_unit text not null default 'mi',
  weight_unit text not null default 'lb',
  route_terms_json jsonb not null default '{}'::jsonb,
  authority_terms_json jsonb not null default '{}'::jsonb,
  compliance_terms_json jsonb not null default '{}'::jsonb,
  stylistic_rules_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, language_code, coalesce(region_code, ''))
);

create table if not exists public.hc_market_gap_targets (
  id uuid primary key default gen_random_uuid(),
  gap_type text not null,
  country_code text,
  region_code text,
  city_slug text,
  corridor_id uuid,
  demand_score numeric(8,4) not null default 0,
  supply_score numeric(8,4) not null default 0,
  strategic_value_score numeric(8,4) not null default 0,
  monetization_value_score numeric(8,4) not null default 0,
  urgency_score numeric(8,4) not null default 0,
  recommended_recruiting_actions_json jsonb not null default '[]'::jsonb,
  status text not null default 'detected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_sponsor_inventory_dynamic (
  id uuid primary key default gen_random_uuid(),
  inventory_type text not null,
  geo_scope text not null default 'global',
  country_code text,
  region_code text,
  city_slug text,
  corridor_id uuid,
  page_family text not null,
  slot_key text not null unique,
  traffic_score numeric(8,4) not null default 0,
  urgency_score numeric(8,4) not null default 0,
  scarcity_score numeric(8,4) not null default 0,
  premium_multiplier numeric(8,4) not null default 1,
  current_price_minor bigint not null default 0,
  currency_code text not null default 'USD',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_data_product_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_type text not null,
  geo_scope text not null default 'global',
  country_code text,
  region_code text,
  corridor_id uuid,
  title text not null,
  teaser_json jsonb not null default '{}'::jsonb,
  full_report_json jsonb not null default '{}'::jsonb,
  price_minor bigint not null default 0,
  currency_code text not null default 'USD',
  freshness_score numeric(8,4) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.hc_agent_configs (
  id uuid primary key default gen_random_uuid(),
  agent_key text not null unique,
  active boolean not null default true,
  model_policy text not null default 'deterministic_first',
  run_schedule_json jsonb not null default '{}'::jsonb,
  thresholds_json jsonb not null default '{}'::jsonb,
  rate_limits_json jsonb not null default '{}'::jsonb,
  guardrails_json jsonb not null default '{}'::jsonb,
  review_policy_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
