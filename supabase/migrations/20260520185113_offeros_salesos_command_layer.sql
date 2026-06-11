-- Haul Command OfferOS + SalesOS command layer.
-- Additive only: bridges existing role activation, AdGrid, proof, partner, and
-- workflow systems without replacing their canonical tables.

begin;

create table if not exists public.hc_offeros_offers (
  id uuid primary key default gen_random_uuid(),
  offer_key text not null unique,
  product_key text not null,
  product_family text not null,
  audience text not null check (
    audience in (
      'operator',
      'broker',
      'carrier',
      'shipper',
      'advertiser',
      'insurance_partner',
      'equipment_supplier',
      'training_provider',
      'infrastructure_partner',
      'data_buyer',
      'internal',
      'other'
    )
  ),
  role_keys text[] not null default '{}',
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  corridor_keys text[] not null default '{}',
  problem text not null,
  broken_alternative text,
  hc_mechanism text not null,
  proof_asset_ids uuid[] not null default '{}',
  risk_reversal text,
  safe_guarantee_type text not null default 'none' check (
    safe_guarantee_type in (
      'none',
      'profile_completion',
      'qualified_placement',
      'lead_quality_filter',
      'useful_data_preview',
      'coverage_attempt',
      'custom_legal_approved'
    )
  ),
  legal_review_status text not null default 'pending' check (
    legal_review_status in ('pending','approved','rejected','not_required')
  ),
  primary_cta_label text not null,
  primary_cta_url text not null,
  pricing_model text not null check (
    pricing_model in (
      'free',
      'subscription',
      'one_time',
      'pay_per_lead',
      'pay_per_call',
      'pay_per_click',
      'sponsor_slot',
      'data_license',
      'revenue_share',
      'manual'
    )
  ),
  upsell_path jsonb not null default '[]'::jsonb,
  downsell_path jsonb not null default '[]'::jsonb,
  objection_notes jsonb not null default '{}'::jsonb,
  follow_up_open_loop text,
  decision_pack_template_key text,
  connected_adgrid_surfaces text[] not null default '{}',
  connected_data_signals text[] not null default '{}',
  connected_partner_categories text[] not null default '{}',
  source_confidence integer not null default 50 check (source_confidence between 0 and 100),
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_offeros_offers_filter
  on public.hc_offeros_offers (audience, product_family, product_key, status);

create index if not exists idx_hc_offeros_offers_countries
  on public.hc_offeros_offers using gin (country_codes);

create index if not exists idx_hc_offeros_offers_roles
  on public.hc_offeros_offers using gin (role_keys);

create index if not exists idx_hc_offeros_offers_corridors
  on public.hc_offeros_offers using gin (corridor_keys);

create table if not exists public.hc_offeros_proof_assets (
  id uuid primary key default gen_random_uuid(),
  proof_key text not null unique,
  proof_type text not null check (
    proof_type in (
      'metric',
      'testimonial',
      'case_study',
      'market_snapshot',
      'profile_preview',
      'call_click_report',
      'seo_win',
      'partner_result',
      'data_sample',
      'compliance_source',
      'other'
    )
  ),
  audiences text[] not null default '{}',
  product_keys text[] not null default '{}',
  role_keys text[] not null default '{}',
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  corridor_keys text[] not null default '{}',
  metric_label text,
  metric_value numeric,
  metric_unit text,
  before_state text,
  after_state text,
  asset_url text,
  source_url text,
  permission_status text not null default 'needs_review' check (
    permission_status in ('internal_only','public_allowed','sales_only','ad_allowed','needs_review','revoked')
  ),
  can_use_publicly boolean not null default false,
  sales_use_allowed boolean not null default false,
  ad_use_allowed boolean not null default false,
  source_confidence integer not null default 50 check (source_confidence between 0 and 100),
  data_freshness_at timestamptz,
  notes text,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_offeros_proof_permission_consistency check (
    (can_use_publicly = false or permission_status in ('public_allowed','ad_allowed'))
    and (ad_use_allowed = false or permission_status in ('ad_allowed','public_allowed'))
    and (sales_use_allowed = false or permission_status in ('sales_only','public_allowed','ad_allowed'))
  )
);

create index if not exists idx_hc_offeros_proof_assets_type_status
  on public.hc_offeros_proof_assets (proof_type, status);

create index if not exists idx_hc_offeros_proof_assets_audiences
  on public.hc_offeros_proof_assets using gin (audiences);

create index if not exists idx_hc_offeros_proof_assets_countries
  on public.hc_offeros_proof_assets using gin (country_codes);

create table if not exists public.hc_salesos_opportunities (
  id uuid primary key default gen_random_uuid(),
  opportunity_key text unique,
  product_key text not null,
  audience text not null,
  role_keys text[] not null default '{}',
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  corridor_keys text[] not null default '{}',
  offer_id uuid references public.hc_offeros_offers(id) on delete set null,
  account_id uuid,
  entity_id uuid,
  contact_email text,
  contact_phone text,
  stage text not null default 'nurture' check (
    stage in (
      'laydown',
      'fringe_deal',
      'uncertain',
      'support_needed',
      'financial_logistic',
      'timing_logistic',
      'needs_manager_callback',
      'needs_market_snapshot',
      'needs_partner_decision_pack',
      'proposal_sent',
      'closed_won',
      'closed_lost',
      'nurture'
    )
  ),
  estimated_value_cents bigint not null default 0 check (estimated_value_cents >= 0),
  currency_code text not null default 'USD',
  probability integer not null default 0 check (probability between 0 and 100),
  objection_type text not null default 'none' check (
    objection_type in ('none','uncertainty','support','financial_logistic','timing_logistic','other')
  ),
  support_decision_maker_status text,
  next_best_action text,
  follow_up_date date,
  proof_sent boolean not null default false,
  decision_pack_sent boolean not null default false,
  needs_manager_callback boolean not null default false,
  fringe_deal_score integer not null default 0 check (fringe_deal_score between 0 and 100),
  closed_reason text,
  owner_user_id uuid,
  last_activity_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_salesos_opportunities_stage
  on public.hc_salesos_opportunities (stage, probability desc, fringe_deal_score desc);

create index if not exists idx_hc_salesos_opportunities_filter
  on public.hc_salesos_opportunities (audience, product_key, stage);

create index if not exists idx_hc_salesos_opportunities_countries
  on public.hc_salesos_opportunities using gin (country_codes);

create table if not exists public.hc_salesos_fringe_rescue_events (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references public.hc_salesos_opportunities(id) on delete set null,
  source_event_type text not null check (
    source_event_type in (
      'started_claim_no_finish',
      'pricing_view_no_buy',
      'adgrid_info_no_pay',
      'insurance_click_no_submit',
      'booked_call_no_confirm',
      'demo_no_purchase',
      'broker_one_load_no_subscribe',
      'advertiser_activity_no_renew',
      'high_value_objection',
      'other'
    )
  ),
  entity_id uuid,
  product_key text,
  audience text,
  role_keys text[] not null default '{}',
  country_codes text[] not null default '{}',
  trigger_path text,
  objection_type text not null default 'none' check (
    objection_type in ('none','uncertainty','support','financial_logistic','timing_logistic','other')
  ),
  recommended_proof_asset_id uuid references public.hc_offeros_proof_assets(id) on delete set null,
  recommended_follow_up_message text,
  recommended_livekit_action text,
  recommended_open_loop text,
  next_best_cta text,
  rescue_score integer not null default 0 check (rescue_score between 0 and 100),
  status text not null default 'queued' check (status in ('queued','in_progress','done','snoozed','suppressed')),
  due_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_salesos_rescue_status
  on public.hc_salesos_fringe_rescue_events (status, rescue_score desc, due_at);

create table if not exists public.hc_partner_profit_filters (
  id uuid primary key default gen_random_uuid(),
  partner_entity_id uuid,
  partner_name text,
  partner_type text not null check (
    partner_type in (
      'insurance_partner',
      'equipment_supplier',
      'training_provider',
      'staging_yard',
      'installer',
      'fuel_vendor',
      'repair_vendor',
      'finance_partner',
      'data_partner',
      'other'
    )
  ),
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  role_keys text[] not null default '{}',
  heavy_haul_relevance integer not null default 0 check (heavy_haul_relevance between 0 and 100),
  pilot_car_relevance integer not null default 0 check (pilot_car_relevance between 0 and 100),
  monetizable boolean not null default false,
  referral_terms_available boolean not null default false,
  call_tracking_possible boolean not null default false,
  lead_tracking_possible boolean not null default false,
  payout_model text not null default 'none' check (
    payout_model in (
      'none',
      'flat_fee',
      'pay_per_lead',
      'pay_per_call',
      'pay_per_bind',
      'pay_per_policy',
      'sponsor_subscription',
      'revenue_share',
      'manual_legal_review'
    )
  ),
  reputation_score integer not null default 0 check (reputation_score between 0 and 100),
  response_speed_score integer not null default 0 check (response_speed_score between 0 and 100),
  partner_score integer not null default 0 check (partner_score between 0 and 100),
  paid_status text not null default 'free' check (
    paid_status in ('free','basic','paid','sponsor','founding_seed','paused')
  ),
  premium_routing_eligible boolean not null default false,
  license_authority_notes text,
  compliance_status text not null default 'pending' check (
    compliance_status in ('pending','approved','rejected','legal_review')
  ),
  status text not null default 'candidate' check (status in ('candidate','outreach','active','paused','rejected','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hc_partner_profit_filters_premium_requires_tracking check (
    premium_routing_eligible = false
    or (
      monetizable
      and (call_tracking_possible or lead_tracking_possible)
      and paid_status in ('paid','sponsor','founding_seed')
      and compliance_status in ('approved','legal_review')
      and payout_model <> 'none'
    )
  )
);

create index if not exists idx_hc_partner_profit_filters_type_status
  on public.hc_partner_profit_filters (partner_type, paid_status, premium_routing_eligible);

create index if not exists idx_hc_partner_profit_filters_countries
  on public.hc_partner_profit_filters using gin (country_codes);

create table if not exists public.hc_adgrid_offer_targeting_rules (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.hc_offeros_offers(id) on delete cascade,
  rule_key text not null unique,
  campaign_id uuid,
  creative_template_key text,
  role_keys text[] not null default '{}',
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  corridor_keys text[] not null default '{}',
  page_families text[] not null default '{}',
  buyer_intents text[] not null default '{}',
  claim_events text[] not null default '{}',
  training_events text[] not null default '{}',
  regulation_events text[] not null default '{}',
  load_matching_events text[] not null default '{}',
  partner_intents text[] not null default '{}',
  surface_keys text[] not null default '{}',
  priority integer not null default 50 check (priority between 0 and 100),
  compliance_review_status text not null default 'pending' check (
    compliance_review_status in ('pending','approved','rejected','needs_legal_review')
  ),
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_adgrid_offer_targeting_offer
  on public.hc_adgrid_offer_targeting_rules (offer_id, status, priority desc);

create index if not exists idx_hc_adgrid_offer_targeting_surfaces
  on public.hc_adgrid_offer_targeting_rules using gin (surface_keys);

create table if not exists public.hc_decision_pack_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  audience text not null,
  product_key text not null,
  role_keys text[] not null default '{}',
  country_codes text[] not null default '{}',
  region_keys text[] not null default '{}',
  corridor_keys text[] not null default '{}',
  sections jsonb not null default '[]'::jsonb,
  required_proof_types text[] not null default '{}',
  problem_prompt text not null,
  mechanism_summary text not null,
  pricing_options jsonb not null default '[]'::jsonb,
  objection_answers jsonb not null default '{}'::jsonb,
  next_step_label text not null,
  next_step_url text not null,
  status text not null default 'draft' check (status in ('draft','active','paused','retired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_decision_pack_templates_filter
  on public.hc_decision_pack_templates (audience, product_key, status);

create table if not exists public.hc_salesos_call_qc_scores (
  id uuid primary key default gen_random_uuid(),
  call_id text not null unique,
  opportunity_id uuid references public.hc_salesos_opportunities(id) on delete set null,
  transcript_url text,
  summary text,
  objection_type text not null default 'none' check (
    objection_type in ('none','uncertainty','support','financial_logistic','timing_logistic','other')
  ),
  rep_score integer check (rep_score between 0 and 100),
  clarity_score integer check (clarity_score between 0 and 100),
  mechanism_score integer check (mechanism_score between 0 and 100),
  proof_score integer check (proof_score between 0 and 100),
  next_step_score integer check (next_step_score between 0 and 100),
  manager_callback_needed boolean not null default false,
  training_notes text,
  consent_status text not null default 'legal_review_required' check (
    consent_status in ('recorded_with_consent','not_recorded','transcript_imported','legal_review_required')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hc_salesos_call_qc_opportunity
  on public.hc_salesos_call_qc_scores (opportunity_id, manager_callback_needed);

create or replace view public.v_hc_partner_premium_routing_eligibility
with (security_invoker = true) as
select
  id,
  partner_entity_id,
  partner_name,
  partner_type,
  country_codes,
  region_keys,
  role_keys,
  partner_score,
  premium_routing_eligible,
  paid_status,
  compliance_status,
  status,
  updated_at
from public.hc_partner_profit_filters
where status in ('candidate','outreach','active','paused');

create or replace view public.v_hc_offeros_adgrid_targeting
with (security_invoker = true) as
select
  r.id as targeting_rule_id,
  r.rule_key,
  r.status as rule_status,
  r.priority,
  r.surface_keys,
  r.page_families,
  r.buyer_intents,
  r.partner_intents,
  o.id as offer_id,
  o.offer_key,
  o.product_key,
  o.product_family,
  o.audience,
  o.role_keys,
  o.country_codes,
  o.region_keys,
  o.corridor_keys,
  o.status as offer_status
from public.hc_adgrid_offer_targeting_rules r
join public.hc_offeros_offers o on o.id = r.offer_id
where r.status = 'active'
  and o.status = 'active'
  and r.compliance_review_status = 'approved';

alter table public.hc_offeros_offers enable row level security;
alter table public.hc_offeros_proof_assets enable row level security;
alter table public.hc_salesos_opportunities enable row level security;
alter table public.hc_salesos_fringe_rescue_events enable row level security;
alter table public.hc_partner_profit_filters enable row level security;
alter table public.hc_adgrid_offer_targeting_rules enable row level security;
alter table public.hc_decision_pack_templates enable row level security;
alter table public.hc_salesos_call_qc_scores enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_offeros_offers' and policyname = 'Service role manages OfferOS offers') then
    create policy "Service role manages OfferOS offers" on public.hc_offeros_offers for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_offeros_proof_assets' and policyname = 'Service role manages OfferOS proof assets') then
    create policy "Service role manages OfferOS proof assets" on public.hc_offeros_proof_assets for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_salesos_opportunities' and policyname = 'Service role manages SalesOS opportunities') then
    create policy "Service role manages SalesOS opportunities" on public.hc_salesos_opportunities for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_salesos_fringe_rescue_events' and policyname = 'Service role manages SalesOS rescue events') then
    create policy "Service role manages SalesOS rescue events" on public.hc_salesos_fringe_rescue_events for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_partner_profit_filters' and policyname = 'Service role manages partner profit filters') then
    create policy "Service role manages partner profit filters" on public.hc_partner_profit_filters for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_adgrid_offer_targeting_rules' and policyname = 'Service role manages AdGrid offer targeting') then
    create policy "Service role manages AdGrid offer targeting" on public.hc_adgrid_offer_targeting_rules for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_decision_pack_templates' and policyname = 'Service role manages decision pack templates') then
    create policy "Service role manages decision pack templates" on public.hc_decision_pack_templates for all to service_role using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'hc_salesos_call_qc_scores' and policyname = 'Service role manages SalesOS call QC') then
    create policy "Service role manages SalesOS call QC" on public.hc_salesos_call_qc_scores for all to service_role using (true) with check (true);
  end if;
end $$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'hc_offeros_offers',
    'hc_offeros_proof_assets',
    'hc_salesos_opportunities',
    'hc_salesos_fringe_rescue_events',
    'hc_partner_profit_filters',
    'hc_adgrid_offer_targeting_rules',
    'hc_decision_pack_templates',
    'hc_salesos_call_qc_scores'
  ]
  loop
    begin
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        'set_' || target_table || '_updated_at',
        target_table
      );
    exception
      when duplicate_object then
        null;
    end;
  end loop;
end $$;

insert into public.hc_system_registry (
  system_key,
  system_family,
  canonical_table,
  canonical_view,
  canonical_route,
  canonical_component,
  status,
  public_surface,
  monetization_surface,
  seo_surface,
  data_product_surface,
  notes,
  last_verified_at
) values
  (
    'offeros_command_layer',
    'offers/sales/proof/adgrid',
    'hc_offeros_offers',
    'v_hc_offeros_adgrid_targeting',
    null,
    null,
    'PARTIALLY_WIRED',
    false,
    true,
    false,
    true,
    'Internal bridge layer for specific-person, specific-problem, specific-way offers connected to proof, partner routing, AdGrid targeting, and data signals.',
    now()
  ),
  (
    'salesos_fringe_rescue',
    'sales/rescue/opportunities',
    'hc_salesos_opportunities',
    null,
    null,
    null,
    'PARTIALLY_WIRED',
    false,
    true,
    false,
    true,
    'Internal opportunity and fringe-deal rescue layer. No public guarantee, job, income, or insurance-approval claims are implied by the schema.',
    now()
  )
on conflict (system_key) do update set
  system_family = excluded.system_family,
  canonical_table = excluded.canonical_table,
  canonical_view = excluded.canonical_view,
  canonical_route = excluded.canonical_route,
  canonical_component = excluded.canonical_component,
  status = excluded.status,
  public_surface = excluded.public_surface,
  monetization_surface = excluded.monetization_surface,
  seo_surface = excluded.seo_surface,
  data_product_surface = excluded.data_product_surface,
  notes = excluded.notes,
  last_verified_at = excluded.last_verified_at,
  updated_at = now();

commit;
