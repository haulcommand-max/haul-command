-- =============================================================================
-- BATCH INGESTION: 2026-03-06 Triple Intelligence Feed (Batch 3)
-- 15 companies, 20 dispatchers, 30+ corridors, 10 covered loads
-- THREE INTEL TYPES: Open Loads + Covered Loads + Dispatch Alerts
-- =============================================================================

-- Step 1: Insert raw artifact for OPEN LOADS
INSERT INTO public.hc_artifacts (id, artifact_type, source_channel, batch_id, entity_count, raw_payload)
VALUES (
  'a0000001-0306-4000-8000-000000000001',
  'dispatch_alert_feed',
  'central_dispatch',
  'batch_20260306_003',
  8,
  '{
    "drop_date": "2026-03-06",
    "source": "dispatch_alert_feed",
    "batch_type": "triple_intelligence",
    "intel_types": ["open_loads", "covered_loads", "dispatch_alerts"],
    "companies_extracted": 15,
    "dispatchers_discovered": 20,
    "corridors_discovered": 30,
    "covered_loads": 10,
    "dedupe_flags": ["Nav_Pilot_Car_NPC_alias_graph", "MY_PEVO_returning", "Midwest_Pilot_Cars_returning", "Zmaxim_Corp_returning", "Reliable_Transport_returning", "JLS_returning"],
    "signals": ["quick_pay","text_only","rate_per_mile","rate_per_day","high_pole","chase","lead","multi_corridor"],
    "identity_graph_discovery": {
      "phone": "470-544-3305",
      "aliases": ["Nav Pilot Car", "NPC", "dispatch"],
      "confidence": 0.95
    },
    "monetization_insight": "Covered loads enable corridor_completion_rate scoring — strongest demand signal in escort industry"
  }'::jsonb
);

-- Step 2: Insert raw artifact for COVERED LOADS (separate artifact for audit trail)
INSERT INTO public.hc_artifacts (id, artifact_type, source_channel, batch_id, entity_count, raw_payload)
VALUES (
  'a0000001-0306-4000-8000-000000000002',
  'dispatch_alert_feed',
  'central_dispatch',
  'batch_20260306_003_covered',
  13,
  '{
    "drop_date": "2026-03-06",
    "source": "dispatch_alert_feed",
    "batch_subtype": "covered_loads",
    "companies_extracted": 13,
    "signal": "confirmed_demand_completion",
    "value": "extremely_high — covered loads prove escort demand + booking velocity"
  }'::jsonb
);

-- Step 3: Insert raw artifact for DISPATCH ALERTS
INSERT INTO public.hc_artifacts (id, artifact_type, source_channel, batch_id, entity_count, raw_payload)
VALUES (
  'a0000001-0306-4000-8000-000000000003',
  'dispatch_alert_feed',
  'central_dispatch',
  'batch_20260306_003_dispatch_alerts',
  17,
  '{
    "drop_date": "2026-03-06",
    "source": "dispatch_alert_feed",
    "batch_subtype": "dispatcher_identity_feed",
    "new_dispatchers": 17,
    "returning_dispatchers": ["Vidalia Dispatch", "Atlas Logistics", "Elite MCE", "Peters Pilot Cars"],
    "identity_graph_edges": 1
  }'::jsonb
);

-- =============================================================================
-- SECTION A: OPEN LOADS (Active Demand)
-- =============================================================================

-- Open Load 1: Nav Pilot Car (NEW — not in system yet)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_mile, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Nav Pilot Car', '470-544-3305', false,
   'Rock Hill', 'SC', 'New Orleans', 'LA',
   705, 2.00, 'high_pole', '["quick_pay"]'::jsonb);

-- Open Load 2: Rosebudz LLC (RETURNING — phone match 812-239-1981)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Rosebudz LLC', '812-239-1981', true,
   'Batesville', 'MS', 'Waskom', 'TX',
   388, 'chase', '["text_only"]'::jsonb,
   0.95, 'returning_dispatcher_phone_match');

-- Open Load 3a: Reliable Transport LLC — Lane 1 (RETURNING)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Reliable Transport LLC', '937-818-6627', true,
   'Phoenix', 'AZ', 'Pryor', 'OK',
   1137, 'high_pole', '["quick_pay"]'::jsonb,
   0.95, 'returning_dispatcher_phone_match');

-- Open Load 3b: Reliable Transport LLC — Lane 2 (RETURNING)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Reliable Transport LLC', '937-818-6627', true,
   'Los Angeles', 'CA', 'Phoenix', 'AZ',
   391, 'high_pole', '[]'::jsonb,
   0.95, 'returning_dispatcher_phone_match_lane2');

-- Open Load 4: Zmaxim Corp (RETURNING — dual phone known)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_day, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Zmaxim Corp', '765-338-8801', true,
   'Post Falls', 'ID', 'Tukwila', 'WA',
   307, 500.00, 'high_pole', '[]'::jsonb,
   0.88, 'returning_zmaxim_dual_phone');

-- Open Load 5: Midwest Pilot Cars (RETURNING)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Midwest Pilot Cars', '605-670-9654', true,
   'Wetmore', 'MI', 'Norway', 'MI',
   97, 'high_pole', '["text_only"]'::jsonb,
   0.95, 'returning_dispatcher_phone_match');

-- Open Load 6: JLS Pilot Car Services (RETURNING)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'JLS Pilot Car Services', '678-873-5016', true,
   'Hammonton', 'NJ', 'Vineland', 'NJ',
   17, 'high_pole', '[]'::jsonb,
   0.95, 'returning_dispatcher_phone_match');

-- Open Load 7: MY PEVO (Drive With Us) (RETURNING)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'MY PEVO (Drive With Us)', '704-766-8664', true,
   'Wilmington', 'CA', 'Topock', 'AZ',
   292, 'chase', '["quick_pay"]'::jsonb,
   0.95, 'returning_dispatcher_phone_match');

-- Open Load 8: Sagan Express (NEW lane for known operator)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000001',
   'Sagan Express', '301-458-0111', true,
   'Virginia Beach', 'VA', 'Crystal Springs', 'MS',
   980, 'unknown', '["text_only"]'::jsonb,
   0.88, 'returning_dispatcher_name_match');

-- =============================================================================
-- SECTION B: COVERED LOADS (Confirmed Demand — Extremely Valuable)
-- load_status = 'filled' signals completed booking
-- =============================================================================

-- Covered 1: BDS
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_mile, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'BDS', NULL, false,
   'Childress', 'TX', 'Pocasset', 'OK',
   185, 1.50, 'unknown', '["quick_pay","covered_load"]'::jsonb);

-- Covered 2: A&M
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'A&M', NULL, false,
   'Terre Haute', 'IN', 'Fremont', 'IN',
   250, 'unknown', '["covered_load"]'::jsonb);

-- Covered 3: First Response Pilot Cars
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_day, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'First Response Pilot Cars', NULL, false,
   'Wellington', 'CO', 'Burlington', 'CO',
   233, 450.00, 'unknown', '["covered_load"]'::jsonb);

-- Covered 4: RBZ Transport LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'RBZ Transport LLC', NULL, false,
   'Wendover', 'UT', 'Sparks', 'NV',
   399, 'unknown', '["covered_load"]'::jsonb);

-- Covered 5: Swift PCS (RETURNING from batch 002)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Swift PCS', '310-210-0111', true,
   'Panama City', 'FL', 'Orange', 'TX',
   530, 'chase', '["covered_load"]'::jsonb,
   0.95, 'returning_dispatcher_name_match_covered');

-- Covered 6: Cornbelt 3PL
-- NOTE: Rate listed as $400/mi is likely $400/day or typo — stored as rate_per_day
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_day, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Cornbelt 3PL', NULL, false,
   'Rayville', 'LA', 'Houston', 'TX',
   360, 400.00, 'unknown', '["quick_pay","covered_load"]'::jsonb);

-- Covered 7a: Valley Transportation — Lane 1
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Valley Transportation', NULL, false,
   'St Louis', 'MO', 'Holland', 'MO',
   207, 'unknown', '["quick_pay","covered_load","multi_corridor"]'::jsonb);

-- Covered 7b: Valley Transportation — Lane 2
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Valley Transportation', NULL, false,
   'St Louis', 'MO', 'Blythe', 'CA',
   1649, 'unknown', '["quick_pay","covered_load","multi_corridor"]'::jsonb);

-- Covered 8: Mega Trucking LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Mega Trucking LLC', NULL, false,
   'Simpsonville', 'SC', 'Destrehan', 'LA',
   647, 'unknown', '["quick_pay","covered_load"]'::jsonb);

-- Covered 9: GC Pilot Car Supply (RETURNING from batch 001)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'GC Pilot Car Supply', '620-272-4563', true,
   'Olathe', 'KS', 'New Albany', 'OH',
   696, 'high_pole', '["covered_load"]'::jsonb,
   0.95, 'returning_dispatcher_name_match_covered');

-- Covered 10: Proactive Logistics Solutions (RETURNING from batch 001)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Proactive Logistics Solutions', '630-943-6285', true,
   'Manheim', 'PA', 'Lancaster', 'PA',
   16, 'high_pole', '["quick_pay","covered_load"]'::jsonb,
   0.95, 'returning_dispatcher_name_match_covered');

-- Covered 11: MY PEVO ASAP (alias of MY PEVO)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'MY PEVO ASAP', '704-766-8664', true,
   'Weimar', 'TX', 'Burkeville', 'TX',
   246, 'unknown', '["covered_load"]'::jsonb,
   0.88, 'alias_match_MY_PEVO');

-- Covered 12: Shocker Ag Services
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000002',
   'Shocker Ag Services', NULL, false,
   'Tulsa', 'OK', 'Neosho', 'MO',
   111, 'lead', '["covered_load"]'::jsonb);

-- =============================================================================
-- SECTION C: DISPATCH ALERT ENTITIES (New Dispatcher Identities)
-- =============================================================================

-- Dispatcher 1: PAN LOGISTICS
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'PAN LOGISTICS', '253-666-3879', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 2: Southern Trans
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Southern Trans', '931-412-0788', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 3: Corbin Pilot Car
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Corbin Pilot Car', '217-821-1989', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 4: JT Speed / Eva
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'JT Speed / Eva', '832-446-7989', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 5: RPS Dispatch
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'RPS Dispatch', '909-436-4220', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 6: Atlas
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Atlas', '347-210-8610', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 7: Smartway Express
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Smartway Express', '513-450-6999', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 8: AM Trucking
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'AM Trucking', '785-209-4062', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 9: Diamond / Cindy
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Diamond / Cindy', '479-928-5524', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 10: Grand Carriers LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Grand Carriers LLC', '440-299-3313', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 11: Gracefull
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Gracefull', '310-910-2953', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 12: Coco Unlimited
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Coco Unlimited', '832-308-9916', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 13: MJS
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'MJS', '251-367-1582', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 14: Holmen Transport
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Holmen Transport', '608-386-9337', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 15: Heavy Haulers
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Heavy Haulers', '620-204-0786', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 16: Olga
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Olga', '312-395-7322', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- Dispatcher 17: Exchange Luxury Enterprises
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000003',
   'Exchange Luxury Enterprises', '336-988-1331', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["dispatcher_identity"]'::jsonb);

-- =============================================================================
-- SECTION D: IDENTITY GRAPH — Nav Pilot Car Multi-Alias
-- =============================================================================
-- Dispatcher 470-544-3305 controls multiple identities:
--   Nav Pilot Car, NPC, dispatch
-- This is exactly what the Dispatcher Identity Graph detects.

-- After processing, we need to manually add alias edges for the identity graph.
-- The phone_norm dedup will link "Nav Pilot Car" to the company_id created above.
-- We add explicit alias edges for the other names.

-- We'll do this AFTER hc_process_pending_candidates runs, using a DO block.

-- =============================================================================
-- SECTION E: CORRIDOR HEAT UPDATES (from demand signals)
-- =============================================================================

-- Update corridor heat for strongest corridors seen in this batch
INSERT INTO public.corridor_heat (corridor_key, country, origin_admin1, dest_admin1, service_type, heat_01, active_loads, last_seen_at)
VALUES
  -- Western Industrial
  ('ID-WA', 'US', 'ID', 'WA', 'high_pole', 0.55, 3, now()),
  ('CA-AZ', 'US', 'CA', 'AZ', 'chase', 0.50, 2, now()),
  -- Southern Industrial
  ('SC-LA', 'US', 'SC', 'LA', 'high_pole', 0.45, 2, now()),
  ('AZ-OK', 'US', 'AZ', 'OK', 'high_pole', 0.50, 2, now()),
  ('LA-TX', 'US', 'LA', 'TX', 'unknown', 0.40, 2, now()),
  -- Midwest
  ('MI-MI', 'US', 'MI', 'MI', 'high_pole', 0.35, 1, now()),
  ('OK-MO', 'US', 'OK', 'MO', 'lead', 0.30, 1, now()),
  -- Northeast
  ('NJ-NJ', 'US', 'NJ', 'NJ', 'high_pole', 0.25, 1, now()),
  ('PA-PA', 'US', 'PA', 'PA', 'high_pole', 0.30, 1, now()),
  -- Cross-country
  ('VA-MS', 'US', 'VA', 'MS', 'unknown', 0.35, 1, now()),
  ('MO-CA', 'US', 'MO', 'CA', 'unknown', 0.40, 1, now()),
  ('TX-OK', 'US', 'TX', 'OK', 'unknown', 0.45, 2, now()),
  ('IN-IN', 'US', 'IN', 'IN', 'unknown', 0.25, 1, now()),
  ('CO-CO', 'US', 'CO', 'CO', 'unknown', 0.30, 1, now()),
  ('UT-NV', 'US', 'UT', 'NV', 'unknown', 0.35, 1, now()),
  ('FL-TX', 'US', 'FL', 'TX', 'chase', 0.40, 1, now()),
  ('KS-OH', 'US', 'KS', 'OH', 'high_pole', 0.45, 1, now()),
  ('SC-LA_2', 'US', 'SC', 'LA', 'unknown', 0.40, 1, now()),
  ('MS-TX', 'US', 'MS', 'TX', 'chase', 0.35, 1, now()),
  ('MO-MO', 'US', 'MO', 'MO', 'unknown', 0.25, 1, now()),
  ('TX-TX', 'US', 'TX', 'TX', 'unknown', 0.30, 1, now())
ON CONFLICT (corridor_key) DO UPDATE SET
  heat_01 = GREATEST(corridor_heat.heat_01, EXCLUDED.heat_01),
  active_loads = corridor_heat.active_loads + EXCLUDED.active_loads,
  last_seen_at = now(),
  updated_at = now();

-- =============================================================================
-- SECTION F: PROCESS ALL PENDING CANDIDATES
-- =============================================================================
SELECT public.hc_process_pending_candidates(200);

-- =============================================================================
-- SECTION G: POST-PROCESSING — Identity Graph Alias Edges
-- =============================================================================
-- After company creation, insert dispatcher identity graph edges for the
-- Nav Pilot Car / NPC / dispatch alias cluster (phone: 470-544-3305)

DO $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Find the company created for Nav Pilot Car by phone
  SELECT merged_into_company_id INTO v_company_id
  FROM public.hc_extraction_candidates
  WHERE phone = '470-544-3305'
  AND merged_into_company_id IS NOT NULL
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    -- Alias edge: NPC
    INSERT INTO public.hc_dispatcher_graph_edges
      (company_id, edge_type, edge_key, edge_value, weight, first_seen_at, last_seen_at, seen_count)
    VALUES
      (v_company_id, 'alias', 'NPC',
       '{"source": "dispatch_alert_feed", "confidence": 0.95, "primary_name": "Nav Pilot Car"}'::jsonb,
       0.95, now(), now(), 1)
    ON CONFLICT (company_id, edge_type, edge_key) DO UPDATE SET
      seen_count = hc_dispatcher_graph_edges.seen_count + 1,
      last_seen_at = now();

    -- Alias edge: dispatch
    INSERT INTO public.hc_dispatcher_graph_edges
      (company_id, edge_type, edge_key, edge_value, weight, first_seen_at, last_seen_at, seen_count)
    VALUES
      (v_company_id, 'alias', 'dispatch',
       '{"source": "dispatch_alert_feed", "confidence": 0.90, "primary_name": "Nav Pilot Car"}'::jsonb,
       0.90, now(), now(), 1)
    ON CONFLICT (company_id, edge_type, edge_key) DO UPDATE SET
      seen_count = hc_dispatcher_graph_edges.seen_count + 1,
      last_seen_at = now();

    RAISE NOTICE 'Identity graph: Nav Pilot Car (%) aliases NPC + dispatch linked', v_company_id;
  ELSE
    RAISE NOTICE 'Warning: Nav Pilot Car company_id not found after processing — alias edges skipped';
  END IF;
END $$;

-- =============================================================================
-- BATCH SUMMARY
-- =============================================================================
-- Total entities ingested:
--   Open loads:     9 candidates (8 companies, 2 multi-lane)
--   Covered loads: 13 candidates (13 companies, 10 distinct)
--   Dispatchers:   17 new dispatcher identities
--   Identity graph: 1 alias cluster (Nav Pilot Car = NPC = dispatch)
--   Corridor heat:  21 corridor entries updated
--
-- Returning dispatchers (dedupe will merge):
--   Rosebudz LLC, Reliable Transport LLC, Zmaxim Corp,
--   Midwest Pilot Cars, JLS Pilot Car Services, MY PEVO,
--   Swift PCS, GC Pilot Car Supply, Proactive Logistics Solutions
--
-- NEW companies (first sighting):
--   Nav Pilot Car, BDS, A&M, First Response Pilot Cars,
--   RBZ Transport LLC, Cornbelt 3PL, Valley Transportation,
--   Mega Trucking LLC, Shocker Ag Services
--
-- NEW dispatchers (identity only):
--   PAN LOGISTICS, Southern Trans, Corbin Pilot Car, JT Speed / Eva,
--   RPS Dispatch, Atlas, Smartway Express, AM Trucking, Diamond / Cindy,
--   Grand Carriers LLC, Gracefull, Coco Unlimited, MJS, Holmen Transport,
--   Heavy Haulers, Olga, Exchange Luxury Enterprises
-- =============================================================================
