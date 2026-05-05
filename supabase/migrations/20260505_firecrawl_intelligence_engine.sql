-- Haul Command Firecrawl Intelligence Engine
-- Public-source intelligence intake for SEO/AEO, regulations, directory supply,
-- AdGrid, data products, content hooks, localization, and emerging-service watch.

create extension if not exists pgcrypto;

create table if not exists hc_source_registry (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null unique,
  source_type text not null,
  source_family text not null default 'public_web',
  country_code text,
  region_code text,
  city_or_locality text,
  corridor_key text,
  language_code text default 'en',
  currency_code text,
  measurement_system text,
  authority_tier text not null default 'unknown' check (authority_tier in ('official','industry_authority','competitor','community','directory','marketplace','supplier','media','unknown')),
  allowed_signal_routes text[] not null default '{}',
  crawl_strategy text not null default 'scrape' check (crawl_strategy in ('map','scrape','crawl','search','browser','agent')),
  crawl_frequency_hours integer not null default 168,
  credit_budget_per_run integer not null default 10,
  credit_budget_per_day integer not null default 40,
  owner_agent text not null default 'firecrawl-intelligence-engine',
  review_required boolean not null default true,
  do_not_crawl boolean not null default false,
  do_not_publish boolean not null default true,
  robots_policy_status text not null default 'unknown' check (robots_policy_status in ('unknown','allowed','limited','blocked','manual_review')),
  last_crawled_at timestamptz,
  last_changed_at timestamptz,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer not null default 0,
  monetization_score numeric not null default 0,
  confidence_score numeric not null default 0,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hc_source_authority_scores (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references hc_source_registry(id) on delete cascade,
  score numeric not null default 0,
  score_reason text,
  official_source boolean not null default false,
  human_reviewed boolean not null default false,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists hc_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references hc_source_registry(id) on delete cascade,
  source_url text not null,
  content_hash text not null,
  markdown text,
  raw_text text,
  html_excerpt text,
  title text,
  description text,
  status_code integer,
  firecrawl_metadata jsonb not null default '{}',
  fetched_at timestamptz not null default now(),
  unique(source_id, content_hash)
);

create table if not exists hc_source_change_events (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references hc_source_registry(id) on delete cascade,
  previous_snapshot_id uuid references hc_source_snapshots(id) on delete set null,
  current_snapshot_id uuid references hc_source_snapshots(id) on delete cascade,
  change_type text not null default 'content_hash_changed' check (change_type in ('new_source','content_hash_changed','metadata_changed','gone','manual_flag')),
  changed_fields jsonb not null default '{}',
  confidence_score numeric not null default 0,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected','needs_more_sources','no_public_change')),
  created_at timestamptz not null default now()
);

create table if not exists hc_firecrawl_runs (
  id uuid primary key default gen_random_uuid(),
  command_run_id uuid,
  source_id uuid references hc_source_registry(id) on delete set null,
  run_kind text not null default 'scheduled' check (run_kind in ('scheduled','manual','backfill','change_check','competitor_watch','source_discovery','emergency')),
  status text not null default 'started' check (status in ('started','completed','failed','partial','skipped')),
  firecrawl_endpoint text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  credits_estimated integer not null default 0,
  credits_used integer not null default 0,
  pages_requested integer not null default 0,
  pages_successful integer not null default 0,
  pages_failed integer not null default 0,
  signals_created integer not null default 0,
  tasks_created integer not null default 0,
  proof_packet_id uuid,
  money_events_influenced integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'
);

create table if not exists hc_firecrawl_run_pages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references hc_firecrawl_runs(id) on delete cascade,
  source_id uuid references hc_source_registry(id) on delete set null,
  url text not null,
  status text not null default 'queued' check (status in ('queued','scraped','failed','skipped','rejected')),
  snapshot_id uuid references hc_source_snapshots(id) on delete set null,
  content_hash text,
  rejection_reason text,
  error_message text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists hc_firecrawl_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references hc_firecrawl_runs(id) on delete cascade,
  source_id uuid references hc_source_registry(id) on delete set null,
  credits_used integer not null default 0,
  credit_reason text not null default 'firecrawl_run',
  expected_value_route text,
  created_at timestamptz not null default now()
);

create table if not exists hc_extraction_schemas (
  id uuid primary key default gen_random_uuid(),
  schema_key text not null unique,
  description text,
  source_types text[] not null default '{}',
  required_fields text[] not null default '{}',
  review_required boolean not null default true,
  json_schema jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hc_firecrawl_extractions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references hc_firecrawl_runs(id) on delete cascade,
  source_id uuid references hc_source_registry(id) on delete set null,
  snapshot_id uuid references hc_source_snapshots(id) on delete set null,
  extraction_schema_key text not null,
  extracted_json jsonb not null default '{}',
  raw_excerpt text,
  confidence_score numeric not null default 0,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected','needs_more_sources','auto_routed')),
  created_at timestamptz not null default now()
);

create table if not exists hc_firecrawl_signal_routes (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid references hc_firecrawl_extractions(id) on delete cascade,
  run_id uuid references hc_firecrawl_runs(id) on delete cascade,
  source_id uuid references hc_source_registry(id) on delete set null,
  route text not null check (route in (
    'seo_gap','aeo_answer_gap','glossary_term_candidate','regulation_change_candidate',
    'blog_update_candidate','tool_gap','training_gap','directory_supply_candidate',
    'partner_candidate','infrastructure_candidate','adgrid_signal','data_product_signal',
    'dispatch_liquidity_signal','pain_point_signal','country_readiness_signal',
    'emerging_service_signal','fraud_trust_signal','content_hook_signal','brand_authority_signal',
    'local_pack_signal','creator_content_signal','gbp_compliance_signal'
  )),
  route_status text not null default 'queued' check (route_status in ('queued','task_created','manual_review','accepted','rejected','published','monetized')),
  priority_score numeric not null default 0,
  monetization_score numeric not null default 0,
  confidence_score numeric not null default 0,
  command_task_id uuid,
  rejection_reason text,
  routed_payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hc_signal_review_queue (
  id uuid primary key default gen_random_uuid(),
  signal_route_id uuid references hc_firecrawl_signal_routes(id) on delete cascade,
  review_type text not null check (review_type in ('regulation','legal_compliance','public_safety','localization','directory_entity','gbp_compliance','brand_claim','customer_comms','destructive_action')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','needs_more_sources')),
  assigned_agent text not null default 'trust-compliance-localization-engine',
  reviewer_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists hc_competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references hc_source_registry(id) on delete set null,
  competitor_name text,
  competitor_url text not null,
  topic text,
  country_code text,
  region_code text,
  page_title text,
  page_summary text,
  detected_strengths text[] not null default '{}',
  detected_gaps text[] not null default '{}',
  haul_command_response_needed text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists hc_local_pack_signals (
  id uuid primary key default gen_random_uuid(),
  country_code text,
  region_code text,
  city_or_locality text,
  service_role text,
  query text not null,
  observed_competitors jsonb not null default '[]',
  observed_gbp_features jsonb not null default '{}',
  required_landing_page_url text,
  map_pack_radius_miles numeric,
  compliance_notes text,
  opportunity_score numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists hc_brand_authority_signals (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references hc_source_registry(id) on delete set null,
  source_url text,
  topic text not null,
  brand_mentioned text not null default 'Haul Command',
  mention_context text,
  signal_type text not null default 'mention' check (signal_type in ('mention','citation','review','community_discussion','comparison','partner_reference','press','podcast','youtube','social','directory_reference')),
  sentiment text not null default 'unknown' check (sentiment in ('positive','neutral','negative','unknown')),
  authority_score numeric not null default 0,
  action_needed text,
  created_at timestamptz not null default now()
);

insert into hc_extraction_schemas (schema_key, description, source_types, required_fields, review_required, json_schema)
values
  ('regulation_page','Official or semi-official regulation page extraction',array['official','industry_authority'],array['jurisdiction','rule_summary','source_url','last_checked'],true,'{}'),
  ('permit_pdf','Permit manual/PDF extraction',array['official'],array['jurisdiction','document_title','effective_date','source_url'],true,'{}'),
  ('directory_listing','Provider/entity candidate extraction',array['directory','competitor','marketplace'],array['name','role','source_url'],true,'{}'),
  ('load_observation','Public load/demand observation extraction',array['marketplace','community'],array['raw_text','source_url','observed_at'],false,'{}'),
  ('competitor_page','Competitor content and offer gap extraction',array['competitor'],array['page_title','topic','source_url'],false,'{}'),
  ('training_page','Training topic extraction',array['industry_authority','competitor'],array['topic','audience','source_url'],true,'{}'),
  ('glossary_page','Glossary/local terminology extraction',array['industry_authority','competitor','official'],array['term','definition','source_url'],true,'{}'),
  ('forum_qa','Community pain/question extraction',array['community'],array['question_or_pain','source_url'],false,'{}'),
  ('infrastructure_place','Oversize/heavy-haul infrastructure candidate extraction',array['supplier','directory','official','community'],array['name','place_type','source_url'],true,'{}'),
  ('supplier_page','Supplier/installer/sponsor candidate extraction',array['supplier'],array['company_name','offer','source_url'],false,'{}'),
  ('brand_authority_page','Brand mention/citation/comparison extraction',array['media','community','competitor','industry_authority'],array['topic','brand_mentioned','source_url'],false,'{}'),
  ('local_pack_page','Local/map-pack and hyperlocal landing-page signal extraction',array['official','competitor','directory','community'],array['query','city_or_locality','service_role'],true,'{}')
on conflict (schema_key) do update set
  description = excluded.description,
  source_types = excluded.source_types,
  required_fields = excluded.required_fields,
  review_required = excluded.review_required,
  updated_at = now();

create index if not exists idx_hc_source_registry_type_geo on hc_source_registry(source_type, country_code, region_code);
create index if not exists idx_hc_source_registry_next_crawl on hc_source_registry(do_not_crawl, last_crawled_at, crawl_frequency_hours);
create index if not exists idx_hc_source_snapshots_source on hc_source_snapshots(source_id, fetched_at desc);
create index if not exists idx_hc_firecrawl_runs_source_status on hc_firecrawl_runs(source_id, status, started_at desc);
create index if not exists idx_hc_firecrawl_signal_routes_route on hc_firecrawl_signal_routes(route, route_status, priority_score desc);
create index if not exists idx_hc_signal_review_queue_status on hc_signal_review_queue(status, review_type, created_at);
create index if not exists idx_hc_brand_authority_topic on hc_brand_authority_signals(topic, signal_type, created_at desc);
create index if not exists idx_hc_local_pack_geo on hc_local_pack_signals(country_code, region_code, city_or_locality, service_role);

comment on table hc_source_registry is 'Supabase source of truth for Firecrawl sources. Do not rely on hardcoded production crawl sources.';
comment on table hc_firecrawl_signal_routes is 'Every useful Firecrawl extraction must route here or be rejected with a reason. No dead crawl rule.';
comment on table hc_signal_review_queue is 'Manual/human review gate for regulation, compliance, public safety, localization, GBP, and directory risks.';
comment on table hc_brand_authority_signals is 'Tracks off-site brand/entity authority signals that support AI search recommendations beyond owned SEO pages.';
comment on table hc_local_pack_signals is 'Tracks hyperlocal/map-pack signals and GBP-safe landing page opportunities.';
