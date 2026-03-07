-- ============================================================
-- AdGrid Moat Layer — Tables, Indexes, RLS
-- Source: adgrid_moat_layer_wiring_map.md + adgrid_rotation_yield_hardening.md
-- 9 tables: intent graph, operator reputation, creatives,
--           creative performance, advertiser health, guardrails,
--           kill switch events
-- ============================================================

begin;

-- ============================================================
-- 1) Intent Graph Nodes
-- ============================================================
create table if not exists public.intent_graph_nodes (
  node_id text primary key,
  node_type text not null,  -- corridor|city|port|industrial_zone|equipment|permit|category|query|operator_cluster
  country text not null,
  label text not null,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_intent_nodes_country_type on public.intent_graph_nodes (country, node_type);
create index if not exists idx_intent_nodes_label_gin on public.intent_graph_nodes using gin (to_tsvector('english', label));

comment on table public.intent_graph_nodes is 'Corridor Intent Graph — nodes represent corridors, cities, equipment types, queries, etc.';

-- ============================================================
-- 2) Intent Graph Edges
-- ============================================================
create table if not exists public.intent_graph_edges (
  edge_id text primary key,
  from_node_id text not null references public.intent_graph_nodes(node_id) on delete cascade,
  to_node_id text not null references public.intent_graph_nodes(node_id) on delete cascade,
  edge_type text not null,  -- searches_for|clicks_on|contacts|books_proxy|co_occurs_with
  weight_hot numeric not null default 0,
  weight_warm numeric not null default 0,
  weight_baseline numeric not null default 0,
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_intent_edges_from on public.intent_graph_edges (from_node_id, edge_type);
create index if not exists idx_intent_edges_to on public.intent_graph_edges (to_node_id, edge_type);
create index if not exists idx_intent_edges_seen on public.intent_graph_edges (last_seen_at);

comment on table public.intent_graph_edges is 'Corridor Intent Graph — edges with hot/warm/baseline weights.';

-- ============================================================
-- 3) Corridor Intent Snapshot
-- ============================================================
create table if not exists public.corridor_intent_snapshot (
  corridor_id text primary key,
  country text not null,
  window_hot_start timestamptz not null,
  top_intents_json jsonb not null default '[]'::jsonb,
  top_queries_json jsonb not null default '[]'::jsonb,
  shortage_signals_json jsonb not null default '[]'::jsonb,
  intent_strength numeric not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_corridor_snapshot_country on public.corridor_intent_snapshot (country, updated_at);
create index if not exists idx_corridor_snapshot_intents on public.corridor_intent_snapshot using gin (top_intents_json);

comment on table public.corridor_intent_snapshot is 'Aggregated intent snapshot per corridor — refreshed every 5 minutes.';

-- ============================================================
-- 4) Operator Reputation
-- ============================================================
create table if not exists public.operator_reputation (
  operator_id text primary key,
  country text not null,
  trust_score numeric not null default 0.5,
  verification_level int not null default 0,
  response_time_score numeric not null default 0.5,
  review_quality_score numeric not null default 0.5,
  dispute_penalty numeric not null default 0,
  corridor_expertise_score numeric not null default 0,
  badges_json jsonb not null default '[]'::jsonb,
  fraud_risk_flag boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_operator_rep_country_trust on public.operator_reputation (country, trust_score desc);
create index if not exists idx_operator_rep_fraud on public.operator_reputation (fraud_risk_flag, updated_at);

comment on table public.operator_reputation is 'Operator Reputation Flywheel — trust scores, badges, and fraud risk.';

-- ============================================================
-- 5) Ad Creatives
-- ============================================================
create table if not exists public.ad_creatives (
  creative_id text primary key,
  advertiser_id text not null,
  campaign_id text not null,
  country text,
  language text not null default 'en',
  placement_type text not null,  -- top_of_search|featured_row|map_pin|profile_related|hub_hero
  copy_json jsonb not null default '{}'::jsonb,
  policy_hash text,
  status text not null default 'active',  -- active|paused|rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ad_creatives_advertiser on public.ad_creatives (advertiser_id, campaign_id);
create index if not exists idx_ad_creatives_status on public.ad_creatives (status, updated_at);
create index if not exists idx_ad_creatives_copy_gin on public.ad_creatives using gin (copy_json);

comment on table public.ad_creatives is 'Ad creative registry with policy screening and quality scoring.';

-- ============================================================
-- 6) Creative Performance Daily
-- ============================================================
create table if not exists public.creative_performance_daily (
  day date not null,
  creative_id text not null,
  country text not null,
  corridor_id text,
  impressions int not null default 0,
  clicks int not null default 0,
  contacts_proxy int not null default 0,
  ctr numeric not null default 0,
  contact_rate numeric not null default 0,
  fatigue_score numeric not null default 0,
  score numeric not null default 0,
  primary key (day, creative_id, country)
);

create index if not exists idx_creative_perf_day_country on public.creative_performance_daily (day, country);
create index if not exists idx_creative_perf_creative_day on public.creative_performance_daily (creative_id, day desc);

comment on table public.creative_performance_daily is 'Daily rollup of creative performance metrics — used by bandit rotation.';

-- ============================================================
-- 7) Advertiser Health
-- ============================================================
create table if not exists public.advertiser_health (
  advertiser_id text primary key,
  ltv_score numeric not null default 0,
  churn_risk numeric not null default 0,
  roi_30d numeric not null default 0,
  roi_confidence numeric not null default 0,
  pacing_health numeric not null default 1.0,
  last_login_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_advertiser_health_churn on public.advertiser_health (churn_risk desc);
create index if not exists idx_advertiser_health_ltv on public.advertiser_health (ltv_score desc);

comment on table public.advertiser_health is 'Advertiser LTV scoring, churn risk, pacing health.';

-- ============================================================
-- 8) Guardrail Config
-- ============================================================
create table if not exists public.guardrail_config (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.guardrail_config is 'Runtime guardrail configuration for ad density, floor limits, consent, etc.';

-- Seed essential guardrails
insert into public.guardrail_config (key, value_json) values
  ('max_above_fold_ad_ratio', '{"value": 0.30}'::jsonb),
  ('max_total_ad_ratio', '{"value": 0.40}'::jsonb),
  ('max_promoted_map_pin_ratio', '{"value": 0.10}'::jsonb),
  ('page_speed_budget_ms', '{"value": 2000}'::jsonb),
  ('min_expected_margin_percent', '{"value": 20}'::jsonb),
  ('max_floor_change_per_cycle_pct', '{"value": 20}'::jsonb),
  ('creative_auto_reject_threshold', '{"value": 0.35}'::jsonb),
  ('creative_manual_review_band', '{"min": 0.35, "max": 0.55}'::jsonb),
  ('frequency_cap_per_ad_day', '{"value": 3}'::jsonb),
  ('frequency_cap_per_ad_hour', '{"value": 1}'::jsonb),
  ('max_creatives_per_slot', '{"value": 5}'::jsonb),
  ('ctr_decay_halflife_impressions', '{"value": 5000}'::jsonb),
  ('max_house_share_per_slot_pct', '{"value": 25}'::jsonb),
  ('fraud_hard_block_threshold', '{"value": 0.85}'::jsonb),
  ('fraud_soft_throttle_threshold', '{"value": 0.65}'::jsonb),
  ('creative_quality_adrank_weight', '{"value": 0.07}'::jsonb),
  ('share_of_voice_max_per_slot', '{"value": 0.60}'::jsonb),
  ('share_of_voice_max_per_geo', '{"value": 0.45}'::jsonb),
  ('consent_gdpr_zones', '{"zones": ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","BR","CA"]}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- 9) Kill Switch Events (append-only)
-- ============================================================
create table if not exists public.kill_switch_events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  switch_name text not null,
  reason text,
  state text not null default 'enabled',  -- enabled|disabled
  actor text not null default 'system',   -- system|admin
  context_json jsonb not null default '{}'::jsonb
);

create index if not exists idx_kill_switch_ts on public.kill_switch_events (ts desc);
create index if not exists idx_kill_switch_name_ts on public.kill_switch_events (switch_name, ts desc);

comment on table public.kill_switch_events is 'Immutable log of kill switch state changes for auditability.';

-- ============================================================
-- RLS
-- ============================================================
alter table public.intent_graph_nodes enable row level security;
alter table public.intent_graph_edges enable row level security;
alter table public.corridor_intent_snapshot enable row level security;
alter table public.operator_reputation enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.creative_performance_daily enable row level security;
alter table public.advertiser_health enable row level security;
alter table public.guardrail_config enable row level security;
alter table public.kill_switch_events enable row level security;

-- Public read for intent snapshots and operator reputation (powers directory/map)
create policy intent_nodes_public_read on public.intent_graph_nodes for select using (true);
create policy intent_edges_public_read on public.intent_graph_edges for select using (true);
create policy corridor_snapshot_public_read on public.corridor_intent_snapshot for select using (true);
create policy operator_rep_public_read on public.operator_reputation for select using (true);

-- Creatives: advertisers read own, admins read all
create policy ad_creatives_owner_read on public.ad_creatives for select to authenticated
  using (advertiser_id = auth.uid()::text or public.is_admin());
create policy ad_creatives_admin_write on public.ad_creatives for insert to authenticated
  with check (advertiser_id = auth.uid()::text or public.is_admin());
create policy ad_creatives_admin_update on public.ad_creatives for update to authenticated
  using (advertiser_id = auth.uid()::text or public.is_admin());

-- Performance: admin only
create policy creative_perf_admin_read on public.creative_performance_daily for select to authenticated
  using (public.is_admin());

-- Advertiser health: own or admin
create policy advertiser_health_read on public.advertiser_health for select to authenticated
  using (advertiser_id = auth.uid()::text or public.is_admin());

-- Guardrail config: admin only
create policy guardrail_config_admin_read on public.guardrail_config for select to authenticated
  using (public.is_admin());
create policy guardrail_config_admin_write on public.guardrail_config for update to authenticated
  using (public.is_admin());

-- Kill switch: admin read only
create policy kill_switch_admin_read on public.kill_switch_events for select to authenticated
  using (public.is_admin());
create policy kill_switch_admin_insert on public.kill_switch_events for insert to authenticated
  with check (public.is_admin());

commit;
