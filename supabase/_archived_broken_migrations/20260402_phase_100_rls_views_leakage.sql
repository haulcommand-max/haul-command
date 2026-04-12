-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 100 — RLS MATRIX, PUBLIC VIEWS, AND PROFIT LEAKAGE THERMOSTAT
-- Default deny all base tables. Public reads from scrubbed views only.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══ ENABLE RLS ON ALL NEW TABLES ═══
ALTER TABLE public.canonical_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_default_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_activation_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_performance_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_stack_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_stack_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_role_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_supply ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referral_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_heatmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relocation_bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_survey_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corridor_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_level_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_capacity_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetization_flags ENABLE ROW LEVEL SECURITY;

-- ═══ SERVICE ROLE BYPASS — allows backend/cron/webhook to access everything ═══
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'canonical_roles','countries','archetype_defaults','monetization_default_rules',
      'country_roles','role_aliases','market_entities','claim_activation_pipeline',
      'provider_documents','provider_performance_rollups',
      'intake_channels','intake_events','job_stack_templates',
      'hc_jobs','job_stack_line_items','job_role_requirements','job_assignments',
      'job_quotes','job_financials','pricing_observations',
      'wallets_ledger','payout_splits','reserves',
      'dispatch_supply','partner_referral_edges','capacity_heatmaps','relocation_bounties',
      'permit_actors','hc_corridors','route_survey_assets','corridor_risk_profiles',
      'enterprise_contracts','service_level_agreements','reserved_capacity_blocks',
      'api_subscriptions','webhook_subscriptions','monetization_flags'
    ])
  LOOP
    BEGIN
      EXECUTE format('CREATE POLICY "service_role_all_%s" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl, tbl);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ═══ AUTHENTICATED READ POLICIES — dictionary tables are world-readable to authed users ═══
DO $$ BEGIN CREATE POLICY "authed_read_canonical_roles" ON public.canonical_roles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_countries" ON public.countries FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_archetype_defaults" ON public.archetype_defaults FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_country_roles" ON public.country_roles FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_role_aliases" ON public.role_aliases FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_permit_actors" ON public.permit_actors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_hc_corridors" ON public.hc_corridors FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "authed_read_intake_channels" ON public.intake_channels FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══ OWNER-SCOPED POLICIES — entities, jobs, financials ═══
DO $$ BEGIN CREATE POLICY "own_market_entities" ON public.market_entities
  FOR ALL TO authenticated
  USING (claimed_by_user_id = auth.uid())
  WITH CHECK (claimed_by_user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "own_dispatch_supply" ON public.dispatch_supply
  FOR ALL TO authenticated
  USING (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid()))
  WITH CHECK (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "own_wallets" ON public.wallets_ledger
  FOR SELECT TO authenticated
  USING (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "own_payout_splits" ON public.payout_splits
  FOR SELECT TO authenticated
  USING (payee_entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "own_job_assignments" ON public.job_assignments
  FOR ALL TO authenticated
  USING (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid()))
  WITH CHECK (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "own_provider_documents" ON public.provider_documents
  FOR ALL TO authenticated
  USING (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid()))
  WITH CHECK (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "own_monetization_flags" ON public.monetization_flags
  FOR SELECT TO authenticated
  USING (entity_id IN (SELECT id FROM public.market_entities WHERE claimed_by_user_id = auth.uid())); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══ PUBLIC VIEWS — scrubbed for SEO and marketplace pages ═══

CREATE OR REPLACE VIEW public.v_public_directory_cards AS
SELECT
  me.id,
  me.display_name,
  me.entity_type,
  me.claim_status,
  me.hq_lat,
  me.hq_lng,
  c.code AS country_code,
  c.name AS country_name,
  c.tier AS country_tier,
  ppr.trust_score,
  ppr.completed_jobs_count,
  ppr.response_rate
FROM public.market_entities me
LEFT JOIN public.countries c ON c.id = me.country_id
LEFT JOIN public.provider_performance_rollups ppr ON ppr.entity_id = me.id
WHERE me.claim_status IN ('claimed','verified');

CREATE OR REPLACE VIEW public.v_public_country_role_aliases AS
SELECT
  ra.alias_text,
  ra.alias_normalized,
  ra.alias_language,
  ra.alias_type,
  ra.search_intent_type,
  cr.local_title,
  cr.commercial_title,
  cr.english_fallback,
  crole.role_key,
  crole.role_name,
  c.code AS country_code,
  c.name AS country_name
FROM public.role_aliases ra
JOIN public.country_roles cr ON cr.id = ra.country_role_id
JOIN public.canonical_roles crole ON crole.id = cr.canonical_role_id
JOIN public.countries c ON c.id = ra.country_id;

CREATE OR REPLACE VIEW public.v_public_corridor_pages AS
SELECT
  hc.id,
  hc.corridor_key,
  hc.corridor_name,
  hc.origin_zone,
  hc.destination_zone,
  hc.corridor_type,
  hc.demand_score,
  hc.supply_score,
  c.code AS country_code,
  c.name AS country_name,
  crp.wind_risk_score,
  crp.bridge_risk_score,
  crp.permit_difficulty_score
FROM public.hc_corridors hc
JOIN public.countries c ON c.id = hc.country_id
LEFT JOIN public.corridor_risk_profiles crp ON crp.corridor_id = hc.id;

CREATE OR REPLACE VIEW public.v_public_cost_ranges AS
SELECT
  po.country_id,
  c.code AS country_code,
  po.service_type,
  po.pricing_basis,
  po.currency_code,
  po.base_min, po.base_max,
  po.hourly_min, po.hourly_max,
  po.daily_min, po.daily_max,
  po.distance_min, po.distance_max,
  po.minimum_charge,
  po.observation_date,
  po.confidence_label
FROM public.pricing_observations po
JOIN public.countries c ON c.id = po.country_id
WHERE po.internal_only_or_public = 'public';

-- ═══ INTERNAL VIEWS — Profit Leakage Thermostat ═══

CREATE OR REPLACE VIEW public.v_internal_profit_leakage AS
SELECT
  j.id AS job_id,
  j.job_type,
  j.job_status,
  j.country_id,
  c.code AS country_code,
  j.corridor_id,
  jf.customer_price,
  jf.provider_pay_total,
  jf.haul_command_take,
  jf.gross_margin,
  jf.payment_status,
  -- Leak detection flags
  CASE WHEN jf.gross_margin IS NULL OR jf.gross_margin <= 0 THEN true ELSE false END AS leak_negative_margin,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.job_role_requirements jrr
    WHERE jrr.job_id = j.id AND jrr.mandatory = true
    AND NOT EXISTS (
      SELECT 1 FROM public.job_assignments ja
      WHERE ja.job_id = j.id AND ja.country_role_id = jrr.country_role_id
      AND ja.assignment_status IN ('accepted','completed')
    )
  ) THEN true ELSE false END AS leak_missing_required_role,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM public.job_stack_line_items li
    WHERE li.job_id = j.id AND li.line_item_type = 'fee' AND li.label ILIKE '%deadhead%'
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
  j.corridor_id,
  hc.corridor_name,
  c.code AS country_code,
  count(*) AS job_count,
  avg(jf.gross_margin) AS avg_margin,
  sum(jf.haul_command_take) AS total_haul_command_take,
  sum(jf.customer_price) AS total_customer_price
FROM public.hc_jobs j
JOIN public.job_financials jf ON jf.job_id = j.id
LEFT JOIN public.hc_corridors hc ON hc.id = j.corridor_id
LEFT JOIN public.countries c ON c.id = j.country_id
WHERE j.job_status = 'completed'
GROUP BY j.corridor_id, hc.corridor_name, c.code;

CREATE OR REPLACE VIEW public.v_claim_pipeline_roi AS
SELECT
  cap.pipeline_stage,
  c.code AS country_code,
  count(*) AS entity_count,
  avg(cap.contact_priority_score) AS avg_priority,
  count(*) FILTER (WHERE cap.pipeline_stage = 'activated') AS activated_count,
  count(*) FILTER (WHERE cap.pipeline_stage = 'lost') AS lost_count
FROM public.claim_activation_pipeline cap
JOIN public.countries c ON c.id = cap.country_id
GROUP BY cap.pipeline_stage, c.code;

CREATE OR REPLACE VIEW public.v_route_survey_asset_roi AS
SELECT
  rsa.country_id,
  c.code AS country_code,
  count(*) AS total_surveys,
  count(*) FILTER (WHERE rsa.resale_tier = 'public') AS public_surveys,
  count(*) FILTER (WHERE rsa.resale_tier = 'partner') AS partner_surveys,
  sum(rsa.resale_price) AS total_resale_value,
  count(*) FILTER (WHERE rsa.survey_status = 'approved') AS approved_count
FROM public.route_survey_assets rsa
JOIN public.countries c ON c.id = rsa.country_id
GROUP BY rsa.country_id, c.code;

CREATE OR REPLACE VIEW public.v_unused_capacity_blocks AS
SELECT
  rcb.id,
  ec.contract_key,
  ec.buyer_entity_id,
  me.display_name AS buyer_name,
  c.code AS country_code,
  cr.local_title AS role_title,
  rcb.reserved_count,
  rcb.starts_at,
  rcb.ends_at,
  rcb.status
FROM public.reserved_capacity_blocks rcb
JOIN public.enterprise_contracts ec ON ec.id = rcb.enterprise_contract_id
JOIN public.market_entities me ON me.id = ec.buyer_entity_id
JOIN public.countries c ON c.id = rcb.country_id
JOIN public.country_roles cr ON cr.id = rcb.country_role_id
WHERE rcb.status IN ('active','partially_used');

-- ═══ DISPATCH MATCHING VIEW (internal only) ═══
CREATE OR REPLACE VIEW public.v_dispatch_ready_supply_internal AS
SELECT
  ds.entity_id,
  me.display_name,
  ds.country_id,
  c.code AS country_code,
  ds.country_role_id,
  cr.local_title,
  crole.role_key,
  ds.availability_status,
  ds.accepts_urgent,
  ds.accepts_night_moves,
  ds.accepts_cross_border,
  ds.priority_score,
  ds.trust_score_snapshot,
  ds.home_lat,
  ds.home_lng,
  ds.last_seen_at
FROM public.dispatch_supply ds
JOIN public.market_entities me ON me.id = ds.entity_id
JOIN public.countries c ON c.id = ds.country_id
JOIN public.country_roles cr ON cr.id = ds.country_role_id
JOIN public.canonical_roles crole ON crole.id = cr.canonical_role_id
WHERE ds.availability_status = 'available';
