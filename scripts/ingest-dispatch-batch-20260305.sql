-- =============================================================================
-- BATCH INGESTION: 2026-03-05 Dispatch Alert Feed
-- 11 companies, 11 corridors, 8 escort demand signals
-- =============================================================================

-- Step 1: Insert raw artifact
INSERT INTO public.hc_artifacts (id, artifact_type, source_channel, batch_id, entity_count, raw_payload)
VALUES (
  'a0000001-0305-4000-8000-000000000001',
  'dispatch_alert_feed',
  'central_dispatch',
  'batch_20260305_001',
  11,
  '{
    "drop_date": "2026-03-05",
    "source": "dispatch_alert_feed",
    "companies_extracted": 11,
    "corridors_discovered": 11,
    "dedupe_flags": ["ZMAXIM_dual_phone", "TpT_Dispatch_typo_variant"],
    "signals": ["quick_pay","text_only","rate_per_mile","rate_per_day","escort_type","scammer_report"]
  }'::jsonb
);

-- Step 2: Insert extraction candidates
-- Candidate 1: AM
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'AM', '785-209-4062', false,
   'Texarkana', 'TX', 'Prescott', 'AR',
   'lead', '[]'::jsonb);

-- Candidate 2: GC Pilot Car Supply
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'GC Pilot Car Supply', '620-272-4563', true,
   'Olathe', 'KS', 'New Albany', 'OH',
   696, 'high_pole', '[]'::jsonb);

-- Candidate 3: Proactive Logistics Solutions Inc
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'Proactive Logistics Solutions Inc', '630-943-6285', true,
   'Manheim', 'PA', 'Lancaster', 'PA',
   16, 'high_pole', '["quick_pay"]'::jsonb);

-- Candidate 4: ZMAXIM (phone A)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_mile, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'ZMAXIM', '409-504-8220', true,
   'Post Falls', 'ID', 'Tukwila', 'WA',
   307, 1.85, 'high_pole', '["text_only"]'::jsonb);

-- Candidate 5: Vidalia Dispatch Service Inc
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_day, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'Vidalia Dispatch Service Inc', '972-635-2480', true,
   'Lampasas', 'TX', 'Liberty Hill', 'TX',
   42, 600.00, 'high_pole', '["quick_pay"]'::jsonb);

-- Candidate 6: TpT Dispatch LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_mile, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'TpT Dispatch LLC', '985-323-1699', true,
   'Waskom', 'TX', 'Okolona', 'MS',
   432, 1.70, 'chase', '["quick_pay","text_only"]'::jsonb);

-- Candidate 7: Deniz Trucking LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'Deniz Trucking LLC', '425-502-2487', true,
   'Solon', 'OH', 'Avon', 'IN',
   337, 'chase', '["quick_pay","text_only"]'::jsonb);

-- Candidate 8: Zmaxim Corp (phone B — dedupe flag)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_day, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'Zmaxim Corp', '765-338-8801', true,
   'Post Falls', 'ID', 'Tukwila', 'WA',
   307, 500.00, 'high_pole', '[]'::jsonb,
   0.880, 'same_company_same_lane_same_escort_24h');

-- Candidate 9: Midwest Pilot Cars
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'Midwest Pilot Cars', '605-670-9654', true,
   'Wetmore', 'MI', 'Norway Twp', 'MI',
   97, 'high_pole', '["text_only"]'::jsonb);

-- Candidate 10: MY PEVO (Drive With Us)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'MY PEVO (Drive With Us)', '704-766-8664', true,
   'Franklin', 'KY', 'Memphis', 'TN',
   262, 'route_survey', '["quick_pay"]'::jsonb);

-- Candidate 11: Edgemont Pilots LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000001',
   'Edgemont Pilots LLC', '301-991-4406', true,
   'Fair Play', 'SC', 'Conyers', 'GA',
   118, 'chase', '["quick_pay"]'::jsonb);

-- Step 3: Process all pending candidates through the upsert RPC
-- This creates companies, graph edges, and corridor heat entries.
SELECT public.hc_process_pending_candidates(100);
