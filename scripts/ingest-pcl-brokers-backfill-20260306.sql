-- =============================================================================
-- PCL BROKERS BACKFILL: 2026-03-06
-- 16 brokers from pcl-brokers-enriched.json with phones, never ingested
-- + 2 phone backfills for companies that gained phones via dispatch batches
-- =============================================================================

-- Step 1: Insert raw artifact
INSERT INTO public.hc_artifacts (id, artifact_type, source_channel, batch_id, entity_count, raw_payload)
VALUES (
  'a0000001-0306-4000-8000-000000000010',
  'broker_scrape',
  'pcl',
  'pcl_backfill_20260306',
  18,
  '{
    "drop_date": "2026-03-06",
    "source": "pcl-brokers-enriched.json",
    "purpose": "backfill — 16 PCL brokers with phones never ingested + 2 phone backfills",
    "original_scrape_date": "2026-02-28",
    "enrichment_date": "2026-03-01"
  }'::jsonb
);

-- =============================================================================
-- SECTION A: 16 PCL Brokers with Phones, Never Ingested
-- =============================================================================

-- 1. Bonnie Blue HH
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Bonnie Blue HH', '918-810-9868', false,
   NULL, 'OK', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted"]'::jsonb);

-- 2. M&L Express LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'M&L Express LLC', '240-217-1663', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted"]'::jsonb);

-- 3. 373 Cargo Incorporated
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   '373 Cargo Incorporated', '224-804-0447', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","2_loads_posted"]'::jsonb);

-- 4. Angie's Pilot Car, llc
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Angies Pilot Car LLC', '918-638-5878', false,
   NULL, 'OK', NULL, NULL,
   'unknown', '["pcl_broker","2_loads_posted"]'::jsonb);

-- 5. Ace Convoy Pilot Escorts
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Ace Convoy Pilot Escorts', '572-568-7183', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","2_loads_posted"]'::jsonb);

-- 6. RDJ Trucking
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'RDJ Trucking', '641-414-4998', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","2_loads_posted"]'::jsonb);

-- 7. patelpcs (highest-value un-ingested: 5 loads)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'patelpcs', '866-795-0150', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","5_loads_posted","toll_free","alt_phone_785-206-0065"]'::jsonb);

-- 8. American heavy haul
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'American Heavy Haul', '419-293-5333', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted","alt_phone_614-515-6560"]'::jsonb);

-- 9. KEENCO Transport, LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'KEENCO Transport LLC', '832-515-5630', false,
   NULL, 'TX', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted"]'::jsonb);

-- 10. Ace Transports LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Ace Transports LLC', '620-205-9368', false,
   NULL, NULL, NULL, NULL,
   'unknown', '["pcl_broker","2_loads_posted","alt_phone_620-205-9471"]'::jsonb);

-- 11. Blue Ridge Pilot Cars
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Blue Ridge Pilot Cars', '540-532-7428', false,
   NULL, 'VA', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted","alt_phone_540-931-1545"]'::jsonb);

-- 12. Aldarelli Enterprises LLC
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Aldarelli Enterprises LLC', '732-403-9286', false,
   NULL, 'NJ', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted"]'::jsonb);

-- 13. Lowboy Services Inc
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Lowboy Services Inc', '561-708-0506', false,
   NULL, 'FL', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted"]'::jsonb);

-- 14. Band Specialized
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'Band Specialized', '630-339-4985', false,
   NULL, 'IL', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted"]'::jsonb);

-- 15. GATOR TRANSPORT
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'GATOR TRANSPORT', '352-799-3788', false,
   NULL, 'FL', NULL, NULL,
   'unknown', '["pcl_broker","1_load_posted","alt_phone_352-796-2619"]'::jsonb);

-- 16. First Response Pilot Cars (has PCL phone 423-355-0213, appeared in batch 3 without phone)
INSERT INTO public.hc_extraction_candidates
  (artifact_id, company_name, phone, is_id_verified, origin_city, origin_state, dest_city, dest_state, escort_type, signals, dedupe_confidence, dedupe_reason)
VALUES
  ('a0000001-0306-4000-8000-000000000010',
   'First Response Pilot Cars', '423-355-0213', true,
   'Wellington', 'CO', 'Burlington', 'CO',
   'unknown', '["pcl_broker","covered_load","phone_backfill"]'::jsonb,
   0.90, 'name_match_covered_load_phone_backfill');

-- =============================================================================
-- SECTION B: Phone Backfills for Previously Phoneless Companies
-- =============================================================================

-- Edgemont Pilots LLC: Had no phone in PCL, now has 301-991-4406 from Batch 1
-- (Already ingested in Batch 1 with phone — just noting for audit)

-- Reliable Transport LLC: Had no phone in PCL, now has 937-818-6627 from Batch 2/3
-- (Already ingested in Batches 2 and 3 with phone — just noting for audit)

-- =============================================================================
-- SECTION C: Process All Pending Candidates
-- =============================================================================
SELECT public.hc_process_pending_candidates(100);

-- =============================================================================
-- BACKFILL SUMMARY
-- =============================================================================
-- Total new entities: 16 companies
-- Phone backfills applied: 1 (First Response Pilot Cars)
-- Previously backfilled by dispatch batches: 2 (Edgemont, Reliable Transport)
--
-- After this + batch 003, every phone number from ALL sources
-- (PCL brokers, dispatch feeds, seed data) has a listing in the system.
-- Zero orphaned contacts remain.
-- =============================================================================
