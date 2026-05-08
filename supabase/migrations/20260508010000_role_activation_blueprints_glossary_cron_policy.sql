-- Haul Command role activation, glossary growth, and cron cadence control layer.
--
-- This migration records the next ROI layer in the database:
-- every role gets a hard-to-find asset, job/opportunity path, readiness gate,
-- partner/AdGrid context, and country-aware activation mode.

begin;

create table if not exists public.hc_role_activation_blueprints (
  role_key text primary key references public.canonical_roles(role_key),
  role_family text not null,
  marketplace_side text not null check (marketplace_side in ('supply','demand','authority','infrastructure','supplier','training','advertiser','hybrid')),
  primary_pain text not null,
  hard_to_find_assets jsonb not null default '[]'::jsonb,
  default_offer_stack jsonb not null default '[]'::jsonb,
  readiness_gates jsonb not null default '[]'::jsonb,
  provider_partner_categories text[] not null default '{}',
  house_ad_goals text[] not null default '{}',
  customer_ad_slot_types text[] not null default '{}',
  default_next_actions jsonb not null default '[]'::jsonb,
  glossary_seed_topics text[] not null default '{}',
  government_trust_path jsonb not null default '{}'::jsonb,
  public_user_value text,
  fleet_value text,
  monetization_paths text[] not null default '{}',
  activation_priority integer not null default 50 check (activation_priority between 1 and 100),
  coverage_status text not null default 'seeded_needs_review' check (coverage_status in ('seeded_needs_review','active','data_limited','country_review_required','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_role_activation_blueprints_family
  on public.hc_role_activation_blueprints(role_family);
create index if not exists idx_hc_role_activation_blueprints_side
  on public.hc_role_activation_blueprints(marketplace_side);
create index if not exists idx_hc_role_activation_blueprints_priority
  on public.hc_role_activation_blueprints(activation_priority desc);

alter table public.hc_role_activation_blueprints enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='hc_role_activation_blueprints'
      and policyname='Public read role activation blueprints'
  ) then
    create policy "Public read role activation blueprints"
      on public.hc_role_activation_blueprints
      for select
      to anon, authenticated
      using (coverage_status in ('active','seeded_needs_review','data_limited','country_review_required'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='hc_role_activation_blueprints'
      and policyname='Service role write role activation blueprints'
  ) then
    create policy "Service role write role activation blueprints"
      on public.hc_role_activation_blueprints
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

insert into public.hc_role_activation_blueprints (
  role_key,
  role_family,
  marketplace_side,
  primary_pain,
  hard_to_find_assets,
  default_offer_stack,
  readiness_gates,
  provider_partner_categories,
  house_ad_goals,
  customer_ad_slot_types,
  default_next_actions,
  glossary_seed_topics,
  government_trust_path,
  public_user_value,
  fleet_value,
  monetization_paths,
  activation_priority,
  coverage_status
)
select
  cr.role_key,
  cr.role_family,
  case
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then 'authority'
    when cr.role_family in ('shipper','demand_side','broker') then 'demand'
    when cr.role_family in ('training') then 'training'
    when cr.role_family in ('supplier','equipment_services','installer','support_market') then 'supplier'
    when cr.role_family in ('infrastructure','site_operations','border_port_site') then 'infrastructure'
    when cr.can_be_dispatched or cr.is_dispatchable then 'supply'
    else 'hybrid'
  end,
  case
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then 'Keeping public rules accurate, source-backed, updated, and usable without creating unsafe legal shortcuts.'
    when cr.role_family in ('shipper','demand_side','broker') then 'Finding qualified, available, trustworthy support fast enough to quote or move the load without costly surprises.'
    when cr.role_family in ('training') then 'Getting the right students into the right credential path and proving that training unlocks real work.'
    when cr.role_family in ('supplier','equipment_services','installer','support_market') then 'Reaching buyers at the exact moment they discover a readiness, equipment, insurance, or service gap.'
    when cr.role_family in ('infrastructure','site_operations','border_port_site') then 'Getting discovered by route planners before the load reaches the corridor, port, border, yard, or overnight stop.'
    when cr.can_be_dispatched or cr.is_dispatchable then 'Finding profitable work, proving readiness, reducing deadhead, and getting paid by trustworthy buyers.'
    else 'Turning fragmented demand, proof, and local knowledge into a clear Haul Command workflow.'
  end,
  case
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then jsonb_build_array('official source trail','correction workflow','jurisdiction terminology','public safety distribution','change log')
    when cr.role_family in ('shipper','demand_side','broker') then jsonb_build_array('verified providers','rate confidence','permit and escort requirements','route risk','payer/operator trust','trip packet')
    when cr.role_family in ('training') then jsonb_build_array('role-to-credential map','student demand','course trust proof','credential verification','job unlocks')
    when cr.role_family in ('supplier','equipment_services','installer','support_market') then jsonb_build_array('buyer intent','equipment gap signals','country requirements','installer availability','sponsored placement')
    when cr.role_family in ('infrastructure','site_operations','border_port_site') then jsonb_build_array('route demand visibility','oversize-friendly proof','facility restrictions','availability','sponsored map/corridor pins')
    when cr.can_be_dispatched or cr.is_dispatchable then jsonb_build_array('good jobs','verified buyers','credential proof','equipment proof','deadhead reduction','fast pay')
    else jsonb_build_array('qualified demand','trust proof','country context','next action')
  end,
  case
    when cr.role_family in ('shipper','demand_side','broker') then jsonb_build_array('post need/load','build quote packet','find verified providers','check route/permit risk')
    when cr.can_be_dispatched or cr.is_dispatchable then jsonb_build_array('claim profile','set availability','receive matched jobs','upload proof','enable Fast Lane')
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then jsonb_build_array('verify source','publish correction','review country rule page','support safety campaign')
    else jsonb_build_array('claim profile','publish offer','join partner network','run AdGrid')
  end,
  case
    when cr.can_be_dispatched or cr.is_dispatchable then jsonb_build_array('claimed profile','verified contact','service area','role tags','credentials or proof where required','availability status')
    when cr.role_family in ('shipper','demand_side','broker') then jsonb_build_array('contact verification','load details','budget/rate clarity','payer reliability path','route dimensions')
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then jsonb_build_array('official source URL','jurisdiction owner','last reviewed date','correction channel')
    else jsonb_build_array('claimed profile','verified contact','service geography','offer details','trust proof')
  end,
  case
    when cr.role_family in ('training') then array['training_provider','credential_verifier','school_partner']
    when cr.role_family in ('supplier','equipment_services','installer','support_market') then array['equipment_supplier','installer','insurance_partner','finance_partner']
    when cr.role_family in ('infrastructure','site_operations','border_port_site') then array['staging_yard','truck_stop','hotel','repair','port_or_border_support']
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then array['government_authority','training_authority','public_safety_partner']
    else array['verified_provider','broker_carrier','permit_service','route_support']
  end,
  case
    when cr.can_be_dispatched or cr.is_dispatchable then array['claim_profile','set_available_now','get_matched_jobs','upload_readiness_proof']
    when cr.role_family in ('shipper','demand_side','broker') then array['post_load','build_trip_packet','find_verified_support','verify_payer_trust']
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then array['submit_official_source','review_country_rules','public_safety_campaign']
    else array['join_partner_network','claim_provider_profile','sponsor_market','publish_offer']
  end,
  case
    when cr.role_family in ('shipper','demand_side','broker') then array['sponsored_provider_card','corridor_sponsor','emergency_support_slot','quote_builder_sponsor']
    when cr.can_be_dispatched or cr.is_dispatchable then array['featured_availability','fast_lane_profile','corridor_availability_boost','load_match_boost']
    when cr.role_family in ('supplier','equipment_services','installer','support_market') then array['route_ready_bundle','readiness_gap_sponsor','equipment_tool_sponsor']
    when cr.role_family in ('infrastructure','site_operations','border_port_site') then array['map_pin_sponsor','corridor_stop_sponsor','route_support_card']
    else array['sponsored_profile','role_hub_sponsor','market_launch_sponsor']
  end,
  case
    when cr.role_family in ('shipper','demand_side','broker') then jsonb_build_array(
      jsonb_build_object('label','Build trip packet','url','/tools/oversize-load-checker'),
      jsonb_build_object('label','Find verified support','url','/directory'),
      jsonb_build_object('label','Post need/load','url','/load-board/post')
    )
    when cr.can_be_dispatched or cr.is_dispatchable then jsonb_build_array(
      jsonb_build_object('label','Claim profile','url','/directory/claim'),
      jsonb_build_object('label','Set availability','url','/available-now'),
      jsonb_build_object('label','Find matching jobs','url','/loads')
    )
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then jsonb_build_array(
      jsonb_build_object('label','Submit official source','url','/regulations'),
      jsonb_build_object('label','Review country page','url','/regulations'),
      jsonb_build_object('label','Publish safety guidance','url','/resources')
    )
    else jsonb_build_array(
      jsonb_build_object('label','Join partner network','url','/partners'),
      jsonb_build_object('label','Run AdGrid','url','/sponsor'),
      jsonb_build_object('label','Claim listing','url','/directory/claim')
    )
  end,
  array[cr.role_key, cr.role_family, coalesce(cr.directory_slug, cr.seo_page_slug, cr.role_key)],
  jsonb_build_object(
    'needs_official_sources', cr.is_regulated or cr.is_authority_actor or cr.is_government_only,
    'trusted_public_output', 'source-backed role/country guidance, correction workflow, freshness date, and non-legal disclaimer where needed',
    'government_friendly_cta', 'submit correction or official source'
  ),
  'A non-expert can understand who helps, what could go wrong, and what to do next without knowing industry jargon.',
  'Fleets and repeat buyers can turn the role into a repeatable workflow with proof, pricing context, availability, and reporting.',
  case
    when cr.role_family in ('shipper','demand_side','broker') then array['job_matching','lead_routing','adgrid','data_products','trip_packets']
    when cr.can_be_dispatched or cr.is_dispatchable then array['job_matching','claims','fast_lane','escrow_fast_pay','training','route_ready']
    when cr.is_authority_actor or cr.is_government_only or cr.role_family in ('authority','authority_reference') then array['data_products','public_safety','training','source_confidence']
    else array['partners','adgrid','route_ready','claims','lead_routing']
  end,
  least(100, greatest(25, coalesce(cr.monetization_score, cr.default_money_score, 50) + coalesce(cr.dispatchability_score,0)/5 + coalesce(cr.scarcity_score,0)/10))::int,
  'seeded_needs_review'
from public.canonical_roles cr
on conflict (role_key) do update set
  role_family = excluded.role_family,
  marketplace_side = excluded.marketplace_side,
  primary_pain = excluded.primary_pain,
  hard_to_find_assets = excluded.hard_to_find_assets,
  default_offer_stack = excluded.default_offer_stack,
  readiness_gates = excluded.readiness_gates,
  provider_partner_categories = excluded.provider_partner_categories,
  house_ad_goals = excluded.house_ad_goals,
  customer_ad_slot_types = excluded.customer_ad_slot_types,
  default_next_actions = excluded.default_next_actions,
  glossary_seed_topics = excluded.glossary_seed_topics,
  government_trust_path = excluded.government_trust_path,
  public_user_value = excluded.public_user_value,
  fleet_value = excluded.fleet_value,
  monetization_paths = excluded.monetization_paths,
  activation_priority = excluded.activation_priority,
  updated_at = now();

create table if not exists public.hc_glossary_growth_targets (
  target_key text primary key,
  target_family text not null,
  canonical_target_count integer not null,
  variant_target_count integer not null,
  current_baseline_table text not null,
  style_contract jsonb not null default '{}'::jsonb,
  snippet_contract jsonb not null default '{}'::jsonb,
  interlink_contract jsonb not null default '{}'::jsonb,
  source_confidence_policy jsonb not null default '{}'::jsonb,
  branded_language_policy jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','paused','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hc_glossary_growth_targets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='hc_glossary_growth_targets'
      and policyname='Public read active glossary targets'
  ) then
    create policy "Public read active glossary targets"
      on public.hc_glossary_growth_targets
      for select
      to anon, authenticated
      using (status = 'active');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='hc_glossary_growth_targets'
      and policyname='Service role write glossary targets'
  ) then
    create policy "Service role write glossary targets"
      on public.hc_glossary_growth_targets
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

insert into public.hc_glossary_growth_targets (
  target_key,
  target_family,
  canonical_target_count,
  variant_target_count,
  current_baseline_table,
  style_contract,
  snippet_contract,
  interlink_contract,
  source_confidence_policy,
  branded_language_policy,
  status
) values (
  'global_10000_glossary_os',
  'global_glossary_dictionary_ai_search',
  5000,
  5000,
  'glossary_terms + hc_dictionary + hc_glossary_country_variants',
  '{"required_sections":["one_sentence_answer","plain_definition","who_uses_it","when_it_matters","what_can_go_wrong","haul_command_next_action","related_terms","related_tools","country_notes"],"tone":"plain, authoritative, field-useful, non-legal unless source-backed","avoid":["thin definitions","keyword stuffing","unsupported compliance claims","fake legal certainty"]}'::jsonb,
  '{"first_40_words":"direct answer suitable for featured snippets and AI answers","must_include":["term","definition","role or workflow context"],"must_not_include":["sales pitch before answer","unsupported required/legal claims"]}'::jsonb,
  '{"minimum_links_per_term":5,"link_targets":["related glossary","role page","tool","regulation/country page","directory or load action","training where applicable"],"dead_end_allowed":false}'::jsonb,
  '{"official_source_required_for":["legal","required","permit","escort count","police escort","equipment requirement","hours/restrictions"],"confidence_labels":["official","source-backed","field-common","needs local review"]}'::jsonb,
  '{"allowed_brand_terms":["Haul Command","HC-ID","Road Ready","RouteReady","AdGrid","Trip Packet","Takeability Score"],"rule":"Use branded terms when they name a real Haul Command workflow, not as filler."}'::jsonb,
  'active'
)
on conflict (target_key) do update set
  target_family = excluded.target_family,
  canonical_target_count = excluded.canonical_target_count,
  variant_target_count = excluded.variant_target_count,
  current_baseline_table = excluded.current_baseline_table,
  style_contract = excluded.style_contract,
  snippet_contract = excluded.snippet_contract,
  interlink_contract = excluded.interlink_contract,
  source_confidence_policy = excluded.source_confidence_policy,
  branded_language_policy = excluded.branded_language_policy,
  status = excluded.status,
  updated_at = now();

create table if not exists public.hc_cron_cadence_policies (
  policy_key text primary key,
  workload_family text not null,
  current_pattern text,
  recommended_pattern text not null,
  urgency_class text not null check (urgency_class in ('realtime','near_realtime','hourly','daily','weekly','queue_driven')),
  keep_fast_when jsonb not null default '{}'::jsonb,
  throttle_when jsonb not null default '{}'::jsonb,
  cost_note text,
  status text not null default 'active' check (status in ('active','paused','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hc_cron_cadence_policies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='hc_cron_cadence_policies'
      and policyname='Public read active cron cadence policies'
  ) then
    create policy "Public read active cron cadence policies"
      on public.hc_cron_cadence_policies
      for select
      to anon, authenticated
      using (status = 'active');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='hc_cron_cadence_policies'
      and policyname='Service role write cron cadence policies'
  ) then
    create policy "Service role write cron cadence policies"
      on public.hc_cron_cadence_policies
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

insert into public.hc_cron_cadence_policies (
  policy_key,
  workload_family,
  current_pattern,
  recommended_pattern,
  urgency_class,
  keep_fast_when,
  throttle_when,
  cost_note
) values
  ('cron_realtime_dispatch', 'dispatch/matching/emergency', '1-5 minutes', '2-5 minutes while open urgent/emergency work exists; otherwise 15 minutes', 'realtime', '{"open_urgent_jobs":true,"pending_match_queue":true}'::jsonb, '{"open_urgent_jobs":false,"pending_match_queue":false}'::jsonb, 'Fast cadence is justified only for live job fill, emergency dispatch, and notification drains.'),
  ('cron_content_generation', 'content/glossary/blog/seo', '2-15 minutes', 'hourly queue drain plus daily quality/freshness audits', 'queue_driven', '{"approved_queue_depth_gt":100,"manual_launch_batch":true}'::jsonb, '{"queue_depth_lte":100,"no_human_review_capacity":true}'::jsonb, 'Frequent AI/content generation can create compute/API cost and thin-content risk; batch and review-gate it.'),
  ('cron_directory_backfill', 'directory/enrichment/backfill', '1-5 minutes', 'hourly during launch batches, daily after backlog falls below threshold', 'queue_driven', '{"backlog_gt":1000,"launch_sprint":true}'::jsonb, '{"backlog_lte":1000,"duplicate_backfill_jobs":true}'::jsonb, 'Backfills should be queue-depth driven, not forever accelerated.'),
  ('cron_adgrid_pricing', 'adgrid/pricing/scarcity', '15-60 minutes', 'hourly for scarcity/pricing, daily for billing/settlement, realtime only for spend caps', 'hourly', '{"active_campaigns":true,"spend_cap_risk":true}'::jsonb, '{"no_active_campaigns":true}'::jsonb, 'AdGrid does not need every surface recomputed every few minutes unless budget or availability would be harmed.'),
  ('cron_regulatory_sources', 'regulations/official_sources', 'daily-weekly', 'Tier A: weekly to biweekly; Tier B/C: monthly; Tier D/E: quarterly unless source-change signal exists', 'weekly', '{"source_change_detected":true,"tier_a_country":true}'::jsonb, '{"no_source_change":true,"low_tier_country":true}'::jsonb, 'Regulation checks should be freshness/confidence driven, not high-frequency polling.'),
  ('cron_analytics_rollups', 'analytics/rankings/scorecards', 'hourly-daily', 'daily for stable rollups, hourly only for public leaderboard or active campaign dashboards', 'daily', '{"public_dashboard_needs_freshness":true}'::jsonb, '{"stable_rollup":true}'::jsonb, 'Rollups are usually cheap individually but expensive in aggregate if run too often.')
on conflict (policy_key) do update set
  workload_family = excluded.workload_family,
  current_pattern = excluded.current_pattern,
  recommended_pattern = excluded.recommended_pattern,
  urgency_class = excluded.urgency_class,
  keep_fast_when = excluded.keep_fast_when,
  throttle_when = excluded.throttle_when,
  cost_note = excluded.cost_note,
  updated_at = now();

create or replace view public.v_hc_role_country_activation_matrix
with (security_invoker = true)
as
select
  crs.id as country_role_id,
  c.iso_code as country_code,
  c.name as country_name,
  c.tier as country_tier,
  c.market_status,
  c.dispatch_launch_status,
  c.directory_launch_status,
  cr.role_key,
  cr.role_name,
  cr.role_family,
  cr.directory_slug,
  cr.seo_page_slug,
  crs.local_title,
  crs.commercial_title,
  crs.legal_title,
  crs.can_be_job_fed_by_haul_command,
  crs.can_be_advertised,
  crs.can_be_subscription_sold,
  crs.capture_confidence,
  b.marketplace_side,
  b.primary_pain,
  b.hard_to_find_assets,
  b.default_offer_stack,
  b.readiness_gates,
  b.provider_partner_categories,
  b.house_ad_goals,
  b.customer_ad_slot_types,
  b.default_next_actions,
  b.public_user_value,
  b.fleet_value,
  b.monetization_paths,
  b.activation_priority,
  case
    when c.dispatch_launch_status in ('live','active') and crs.can_be_job_fed_by_haul_command then 'live_job_activation'
    when c.directory_launch_status in ('live','active') then 'directory_activation_first'
    when crs.capture_confidence = 'low' then 'country_review_required'
    else 'request_or_claim_first'
  end as activation_mode
from public.country_roles crs
join public.countries c on c.id = crs.country_id
join public.canonical_roles cr on cr.id = crs.canonical_role_id
left join public.hc_role_activation_blueprints b on b.role_key = cr.role_key;

grant select on public.v_hc_role_country_activation_matrix to anon, authenticated;

commit;
