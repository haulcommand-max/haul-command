-- =============================================================================
-- BATCH INGESTION: 2026-03-05 Dispatch Alert Feed (Batch 2)
-- 4 companies (1 returning), 5 corridors, high-pole + route survey signals
-- =============================================================================

-- Step 1: Insert raw artifact
INSERT INTO public.hc_artifacts (id, artifact_type, source_channel, batch_id, entity_count, raw_payload)
VALUES (
  'a0000001-0305-4000-8000-000000000002',
  'dispatch_alert_feed',
  'central_dispatch',
  'batch_20260305_002',
  5,
  '{
    "drop_date": "2026-03-05",
    "source": "dispatch_alert_feed",
    "companies_extracted": 4,
    "lanes_extracted": 5,
    "corridors_discovered": ["TX-TX","FL-TX","MS-TX","AZ-OK","CA-AZ"],
    "dedupe_flags": ["Reliable_Transport_LLC_returning"],
    "signals": ["quick_pay","text_only","rate_per_day","high_pole","route_survey"],
    "monetization_insight": "LA-Phoenix-Oklahoma corridor = energy/industrial cargo, high AdGrid value"
  }'::jsonb
);

-- Step 2: Insert extraction candidates

-- Candidate 1: Vidalia Dispatch Service Inc (RETURNING — already in batch 001)
-- Same phone 972-635-2480, same lane TX-TX — upsert will match via phone_norm
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, rate_per_day, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000002',
   'Vidalia Dispatch Service Inc', '972-635-2480', true,
   'Lampasas', 'TX', 'Liberty Hill', 'TX',
   42, 600.00, 'high_pole', '["quick_pay"]'::jsonb);

-- Candidate 2: Swift PCS
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000002',
   'Swift PCS', '310-210-0111', true,
   'Panama City', 'FL', 'Orange', 'TX',
   530, 'chase', '[]'::jsonb);

-- Candidate 3: Rosebudz, LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals)
VALUES
  ('a0000001-0305-4000-8000-000000000002',
   'Rosebudz, LLC', '812-239-1981', true,
   'Batesville', 'MS', 'Waskom', 'TX',
   388, 'chase', '["text_only"]'::jsonb);

-- Candidate 4a: Reliable Transport LLC — Lane 1 (RETURNING dispatcher)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0305-4000-8000-000000000002',
   'Reliable Transport LLC', '937-818-6627', true,
   'Phoenix', 'AZ', 'Pryor', 'OK',
   1137, 'high_pole', '["quick_pay","text_only","route_survey"]'::jsonb,
   0.95, 'returning_dispatcher_phone_match');

-- Candidate 4b: Reliable Transport LLC — Lane 2
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, distance_miles, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0305-4000-8000-000000000002',
   'Reliable Transport LLC', '937-818-6627', true,
   'Los Angeles', 'CA', 'Phoenix', 'AZ',
   391, 'high_pole', '["quick_pay","text_only"]'::jsonb,
   0.95, 'returning_dispatcher_phone_match_lane2');

-- Step 3: Process all pending candidates
SELECT public.hc_process_pending_candidates(100);
