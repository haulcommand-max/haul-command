-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 120 — SCHEMA PATCH: Upgrade pre-existing tables
-- Adds missing columns to countries, hc_jobs, hc_corridors
-- Then creates indexes and deferred FKs that previously failed
-- ═══════════════════════════════════════════════════════════════════════════════

-- ════ PATCH: public.countries ════
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS tier text;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS archetype_profile text;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS local_roots jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS legal_root text DEFAULT 'common_law';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS geo_order jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS validation_priority text DEFAULT 'medium';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS market_status text DEFAULT 'research';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS pricing_capture_status text DEFAULT 'unknown';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS roles_capture_status text DEFAULT 'unknown';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS permit_actor_capture_status text DEFAULT 'unknown';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS dispatch_launch_status text DEFAULT 'not_ready';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS directory_launch_status text DEFAULT 'not_ready';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS payment_launch_status text DEFAULT 'not_ready';
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS top_cities jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS top_corridors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS top_ports jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS top_border_crossings jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS top_industrial_zones jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS monetization_priority jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS risk_notes text;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS code char(2);
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.countries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indexes on countries
CREATE INDEX IF NOT EXISTS idx_countries_tier ON public.countries(tier);
CREATE INDEX IF NOT EXISTS idx_countries_archetype ON public.countries(archetype_profile);
CREATE INDEX IF NOT EXISTS idx_countries_market_status ON public.countries(market_status);

-- ════ PATCH: public.hc_jobs ════
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS job_type text;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS country_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS customer_entity_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS broker_entity_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS carrier_entity_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS corridor_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS intake_event_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS enterprise_contract_id uuid;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS load_type text;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS origin_label text;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS destination_label text;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS origin_lat numeric(9,6);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS origin_lng numeric(9,6);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS destination_lat numeric(9,6);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS destination_lng numeric(9,6);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS length_ft numeric(8,2);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS width_ft numeric(8,2);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS height_ft numeric(8,2);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS weight_lbs numeric(12,2);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS urgency_level text DEFAULT 'normal';
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS job_status text DEFAULT 'intake';
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS customer_budget_min numeric(12,2);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS customer_budget_max numeric(12,2);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS currency_code char(3);
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.hc_jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- FKs on hc_jobs
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_country FOREIGN KEY (country_id) REFERENCES public.countries(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_customer FOREIGN KEY (customer_entity_id) REFERENCES public.market_entities(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_broker FOREIGN KEY (broker_entity_id) REFERENCES public.market_entities(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_carrier FOREIGN KEY (carrier_entity_id) REFERENCES public.market_entities(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_intake FOREIGN KEY (intake_event_id) REFERENCES public.intake_events(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes on hc_jobs
CREATE INDEX IF NOT EXISTS idx_hc_jobs_country_type ON public.hc_jobs(country_id, job_type);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_status ON public.hc_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_urgency ON public.hc_jobs(urgency_level);
CREATE INDEX IF NOT EXISTS idx_hc_jobs_corridor ON public.hc_jobs(corridor_id);

-- ════ PATCH: public.hc_corridors ════
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS country_id uuid;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS corridor_key text;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS corridor_name text;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS origin_zone text;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS destination_zone text;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS corridor_type text;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS risk_summary jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS demand_score integer DEFAULT 0;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS supply_score integer DEFAULT 0;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS monetization_score integer DEFAULT 0;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.hc_corridors ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- FKs on hc_corridors
DO $$ BEGIN ALTER TABLE public.hc_corridors ADD CONSTRAINT fk_hc_corridors_country FOREIGN KEY (country_id) REFERENCES public.countries(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes on hc_corridors
CREATE INDEX IF NOT EXISTS idx_hc_corr_country ON public.hc_corridors(country_id);
CREATE INDEX IF NOT EXISTS idx_hc_corr_demand ON public.hc_corridors(demand_score);
CREATE INDEX IF NOT EXISTS idx_hc_corr_money ON public.hc_corridors(monetization_score);

-- ════ DEFERRED FKs (from phase 040/060/080 that failed) ════
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_corridor FOREIGN KEY (corridor_id) REFERENCES public.hc_corridors(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.hc_jobs ADD CONSTRAINT fk_hc_jobs_enterprise_contract FOREIGN KEY (enterprise_contract_id) REFERENCES public.enterprise_contracts(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.capacity_heatmaps ADD CONSTRAINT fk_ch_corridor FOREIGN KEY (corridor_id) REFERENCES public.hc_corridors(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════ RECREATE ALL VIEWS (they failed because countries.code didn't exist) ════

CREATE OR REPLACE VIEW public.v_public_directory_cards AS
SELECT
  me.id, me.display_name, me.entity_type, me.claim_status, me.hq_lat, me.hq_lng,
  c.code AS country_code, c.name AS country_name, c.tier AS country_tier,
  ppr.trust_score, ppr.completed_jobs_count, ppr.response_rate
FROM public.market_entities me
LEFT JOIN public.countries c ON c.id = me.country_id
LEFT JOIN public.provider_performance_rollups ppr ON ppr.entity_id = me.id
WHERE me.claim_status IN ('claimed','verified');

CREATE OR REPLACE VIEW public.v_public_country_role_aliases AS
SELECT
  ra.alias_text, ra.alias_normalized, ra.alias_language, ra.alias_type, ra.search_intent_type,
  cr.local_title, cr.commercial_title, cr.english_fallback,
  crole.role_key, crole.role_name, c.code AS country_code, c.name AS country_name
FROM public.role_aliases ra
JOIN public.country_roles cr ON cr.id = ra.country_role_id
JOIN public.canonical_roles crole ON crole.id = cr.canonical_role_id
JOIN public.countries c ON c.id = ra.country_id;

CREATE OR REPLACE VIEW public.v_public_corridor_pages AS
SELECT
  hc.id, hc.corridor_key, hc.corridor_name, hc.origin_zone, hc.destination_zone, hc.corridor_type,
  hc.demand_score, hc.supply_score, c.code AS country_code, c.name AS country_name,
  crp.wind_risk_score, crp.bridge_risk_score, crp.permit_difficulty_score
FROM public.hc_corridors hc
JOIN public.countries c ON c.id = hc.country_id
LEFT JOIN public.corridor_risk_profiles crp ON crp.corridor_id = hc.id;

CREATE OR REPLACE VIEW public.v_public_cost_ranges AS
SELECT
  po.country_id, c.code AS country_code, po.service_type, po.pricing_basis, po.currency_code,
  po.base_min, po.base_max, po.hourly_min, po.hourly_max, po.daily_min, po.daily_max,
  po.distance_min, po.distance_max, po.minimum_charge, po.observation_date, po.confidence_label
FROM public.pricing_observations po
JOIN public.countries c ON c.id = po.country_id
WHERE po.internal_only_or_public = 'public';

CREATE OR REPLACE VIEW public.v_internal_profit_leakage AS
SELECT
  j.id AS job_id, j.job_type, j.job_status, j.country_id, c.code AS country_code, j.corridor_id,
  jf.customer_price, jf.provider_pay_total, jf.haul_command_take, jf.gross_margin, jf.payment_status,
  CASE WHEN jf.gross_margin IS NULL OR jf.gross_margin <= 0 THEN true ELSE false END AS leak_negative_margin,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.job_role_requirements jrr WHERE jrr.job_id = j.id AND jrr.mandatory = true
    AND NOT EXISTS (SELECT 1 FROM public.job_assignments ja WHERE ja.job_id = j.id AND ja.country_role_id = jrr.country_role_id AND ja.assignment_status IN ('accepted','completed'))
  ) THEN true ELSE false END AS leak_missing_required_role,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM public.job_stack_line_items li WHERE li.job_id = j.id AND li.line_item_type = 'fee' AND li.label ILIKE '%deadhead%'
  ) AND j.job_status = 'completed' THEN true ELSE false END AS leak_unbilled_deadhead,
  CASE WHEN j.job_status = 'completed' AND NOT EXISTS (
    SELECT 1 FROM public.route_survey_assets rsa WHERE rsa.job_id = j.id
  ) AND j.job_type = 'route_survey' THEN true ELSE false END AS leak_survey_not_captured
FROM public.hc_jobs j
LEFT JOIN public.job_financials jf ON jf.job_id = j.id
LEFT JOIN public.countries c ON c.id = j.country_id
WHERE j.job_status IN ('completed','in_progress','failed');

CREATE OR REPLACE VIEW public.v_margin_by_corridor AS
SELECT
  j.corridor_id, hc.corridor_name, c.code AS country_code, count(*) AS job_count,
  avg(jf.gross_margin) AS avg_margin, sum(jf.haul_command_take) AS total_haul_command_take,
  sum(jf.customer_price) AS total_customer_price
FROM public.hc_jobs j
JOIN public.job_financials jf ON jf.job_id = j.id
LEFT JOIN public.hc_corridors hc ON hc.id = j.corridor_id
LEFT JOIN public.countries c ON c.id = j.country_id
WHERE j.job_status = 'completed'
GROUP BY j.corridor_id, hc.corridor_name, c.code;

CREATE OR REPLACE VIEW public.v_claim_pipeline_roi AS
SELECT
  cap.pipeline_stage, c.code AS country_code, count(*) AS entity_count,
  avg(cap.contact_priority_score) AS avg_priority,
  count(*) FILTER (WHERE cap.pipeline_stage = 'activated') AS activated_count,
  count(*) FILTER (WHERE cap.pipeline_stage = 'lost') AS lost_count
FROM public.claim_activation_pipeline cap
JOIN public.countries c ON c.id = cap.country_id
GROUP BY cap.pipeline_stage, c.code;

CREATE OR REPLACE VIEW public.v_route_survey_asset_roi AS
SELECT
  rsa.country_id, c.code AS country_code, count(*) AS total_surveys,
  count(*) FILTER (WHERE rsa.resale_tier = 'public') AS public_surveys,
  count(*) FILTER (WHERE rsa.resale_tier = 'partner') AS partner_surveys,
  sum(rsa.resale_price) AS total_resale_value,
  count(*) FILTER (WHERE rsa.survey_status = 'approved') AS approved_count
FROM public.route_survey_assets rsa
JOIN public.countries c ON c.id = rsa.country_id
GROUP BY rsa.country_id, c.code;

CREATE OR REPLACE VIEW public.v_unused_capacity_blocks AS
SELECT
  rcb.id, ec.contract_key, ec.buyer_entity_id, me.display_name AS buyer_name,
  c.code AS country_code, cr.local_title AS role_title, rcb.reserved_count,
  rcb.starts_at, rcb.ends_at, rcb.status
FROM public.reserved_capacity_blocks rcb
JOIN public.enterprise_contracts ec ON ec.id = rcb.enterprise_contract_id
JOIN public.market_entities me ON me.id = ec.buyer_entity_id
JOIN public.countries c ON c.id = rcb.country_id
JOIN public.country_roles cr ON cr.id = rcb.country_role_id
WHERE rcb.status IN ('active','partially_used');

CREATE OR REPLACE VIEW public.v_dispatch_ready_supply_internal AS
SELECT
  ds.entity_id, me.display_name, ds.country_id, c.code AS country_code, ds.country_role_id,
  cr.local_title, crole.role_key, ds.availability_status, ds.accepts_urgent, ds.accepts_night_moves,
  ds.accepts_cross_border, ds.priority_score, ds.trust_score_snapshot, ds.home_lat, ds.home_lng, ds.last_seen_at
FROM public.dispatch_supply ds
JOIN public.market_entities me ON me.id = ds.entity_id
JOIN public.countries c ON c.id = ds.country_id
JOIN public.country_roles cr ON cr.id = ds.country_role_id
JOIN public.canonical_roles crole ON crole.id = cr.canonical_role_id
WHERE ds.availability_status = 'available';
