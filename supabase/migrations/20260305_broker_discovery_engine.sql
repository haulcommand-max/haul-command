-- =============================================================================
-- BROKER DISCOVERY ENGINE
-- Tables + RPCs for dispatch alert feed ingestion, entity extraction,
-- company upsert, deduplication, and dispatcher graph edges.
-- =============================================================================

-- 1. RAW FEED ARTIFACTS
-- Every raw dispatch alert drop lands here as an immutable artifact.
CREATE TABLE IF NOT EXISTS public.hc_artifacts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type      TEXT NOT NULL DEFAULT 'dispatch_alert_feed'
                     CHECK (artifact_type IN (
                       'dispatch_alert_feed','broker_scrape','manual_entry',
                       'email_parse','api_ingest','social_scrape'
                     )),
  source_channel     TEXT,                    -- 'central_dispatch','dat','direct','pcl', etc.
  raw_payload        JSONB NOT NULL,          -- full original message / structured data
  batch_id           TEXT,                    -- groups artifacts from same drop
  entity_count       INT DEFAULT 0,          -- how many candidates extracted
  ingested_by        UUID,                   -- user or system actor
  ingested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hc_artifacts_type ON public.hc_artifacts (artifact_type);
CREATE INDEX idx_hc_artifacts_batch ON public.hc_artifacts (batch_id);
CREATE INDEX idx_hc_artifacts_ingested ON public.hc_artifacts (ingested_at DESC);

-- 2. EXTRACTION CANDIDATES
-- Parsed entities from raw artifacts. Each row = one company/dispatcher sighting.
CREATE TABLE IF NOT EXISTS public.hc_extraction_candidates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id        UUID NOT NULL REFERENCES public.hc_artifacts(id) ON DELETE CASCADE,

  -- Company identity
  company_name       TEXT NOT NULL,
  company_name_norm  TEXT GENERATED ALWAYS AS (lower(trim(regexp_replace(company_name, '\s+', ' ', 'g')))) STORED,
  phone              TEXT,
  phone_norm         TEXT GENERATED ALWAYS AS (regexp_replace(phone, '[^0-9]', '', 'g')) STORED,
  is_id_verified     BOOLEAN DEFAULT false,

  -- Lane
  origin_city        TEXT,
  origin_state       TEXT,
  dest_city          TEXT,
  dest_state         TEXT,
  distance_miles     NUMERIC(8,1),

  -- Pricing
  rate_per_mile      NUMERIC(6,2),
  rate_per_day       NUMERIC(10,2),
  rate_flat          NUMERIC(10,2),

  -- Escort details
  escort_type        TEXT CHECK (escort_type IN (
                       'lead','chase','high_pole','route_survey',
                       'front','rear','steer','police','unknown'
                     )),

  -- Signals (bitfield as jsonb for flexibility)
  signals            JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- e.g. ["quick_pay","text_only","scammer_report"]

  -- Dedupe
  dedupe_hash        TEXT GENERATED ALWAYS AS (
    md5(
      coalesce(lower(trim(regexp_replace(company_name, '\s+', ' ', 'g'))), '') || '|' ||
      coalesce(lower(origin_state), '') || '|' ||
      coalesce(lower(dest_state), '') || '|' ||
      coalesce(escort_type, '')
    )
  ) STORED,

  -- Processing status
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','merged','skipped','flagged')),
  merged_into_company_id UUID,
  dedupe_confidence  NUMERIC(4,3),
  dedupe_reason      TEXT,

  -- Metadata
  seen_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hc_candidates_artifact ON public.hc_extraction_candidates (artifact_id);
CREATE INDEX idx_hc_candidates_status ON public.hc_extraction_candidates (status);
CREATE INDEX idx_hc_candidates_dedupe ON public.hc_extraction_candidates (dedupe_hash);
CREATE INDEX idx_hc_candidates_phone ON public.hc_extraction_candidates (phone_norm);
CREATE INDEX idx_hc_candidates_company ON public.hc_extraction_candidates (company_name_norm);

-- 3. DISPATCHER GRAPH EDGES
-- Links dispatchers/companies to corridors, escort types, and pay behaviors.
CREATE TABLE IF NOT EXISTS public.hc_dispatcher_graph_edges (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id       UUID REFERENCES public.hc_extraction_candidates(id) ON DELETE CASCADE,
  company_id         UUID,  -- populated after merge

  edge_type          TEXT NOT NULL CHECK (edge_type IN (
                       'operates_corridor','offers_escort_type',
                       'pay_behavior','contact_preference',
                       'fraud_signal','reliability_signal'
                     )),
  edge_key           TEXT NOT NULL,   -- e.g. 'TX-AR', 'high_pole', 'quick_pay'
  edge_value         JSONB DEFAULT '{}'::jsonb,
  weight             NUMERIC(5,3) DEFAULT 1.000,

  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_count         INT NOT NULL DEFAULT 1,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hc_graph_company ON public.hc_dispatcher_graph_edges (company_id);
CREATE INDEX idx_hc_graph_type_key ON public.hc_dispatcher_graph_edges (edge_type, edge_key);
CREATE INDEX idx_hc_graph_candidate ON public.hc_dispatcher_graph_edges (candidate_id);

-- 4. COMPANY UPSERT FROM CANDIDATE RPC
-- Dedupes by normalized name + phone, inserts or updates companies table,
-- then marks the candidate as merged.
CREATE OR REPLACE FUNCTION public.hc_company_upsert_from_candidate(
  p_candidate_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidate    RECORD;
  v_company_id   UUID;
  v_is_new       BOOLEAN := false;
  v_corridor_key TEXT;
BEGIN
  -- Fetch candidate
  SELECT * INTO v_candidate
  FROM public.hc_extraction_candidates
  WHERE id = p_candidate_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'candidate not found or already processed');
  END IF;

  -- Try to match existing company by normalized phone first, then name
  SELECT id INTO v_company_id
  FROM public.hc_extraction_candidates
  WHERE phone_norm = v_candidate.phone_norm
    AND phone_norm IS NOT NULL
    AND phone_norm != ''
    AND status = 'merged'
    AND merged_into_company_id IS NOT NULL
  ORDER BY seen_at DESC
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    -- Found existing company via phone match
    v_is_new := false;
  ELSE
    -- Try name match
    SELECT merged_into_company_id INTO v_company_id
    FROM public.hc_extraction_candidates
    WHERE company_name_norm = v_candidate.company_name_norm
      AND status = 'merged'
      AND merged_into_company_id IS NOT NULL
    ORDER BY seen_at DESC
    LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    -- Brand new company — generate UUID
    v_company_id := gen_random_uuid();
    v_is_new := true;
  END IF;

  -- Mark candidate as merged
  UPDATE public.hc_extraction_candidates
  SET status = 'merged',
      merged_into_company_id = v_company_id
  WHERE id = p_candidate_id;

  -- Build corridor key (origin_state-dest_state)
  v_corridor_key := upper(coalesce(v_candidate.origin_state, '??'))
                 || '-'
                 || upper(coalesce(v_candidate.dest_state, '??'));

  -- Insert graph edges
  -- 1. Corridor edge
  INSERT INTO public.hc_dispatcher_graph_edges
    (candidate_id, company_id, edge_type, edge_key, edge_value)
  VALUES
    (p_candidate_id, v_company_id, 'operates_corridor', v_corridor_key,
     jsonb_build_object(
       'origin_city', v_candidate.origin_city,
       'dest_city', v_candidate.dest_city,
       'distance_miles', v_candidate.distance_miles
     ));

  -- 2. Escort type edge
  IF v_candidate.escort_type IS NOT NULL THEN
    INSERT INTO public.hc_dispatcher_graph_edges
      (candidate_id, company_id, edge_type, edge_key)
    VALUES
      (p_candidate_id, v_company_id, 'offers_escort_type', v_candidate.escort_type);
  END IF;

  -- 3. Signal edges (quick_pay, text_only, etc.)
  IF jsonb_array_length(v_candidate.signals) > 0 THEN
    INSERT INTO public.hc_dispatcher_graph_edges
      (candidate_id, company_id, edge_type, edge_key)
    SELECT
      p_candidate_id, v_company_id,
      CASE
        WHEN s.value #>> '{}' IN ('quick_pay','text_only') THEN 'pay_behavior'
        WHEN s.value #>> '{}' = 'scammer_report' THEN 'fraud_signal'
        ELSE 'reliability_signal'
      END,
      s.value #>> '{}'
    FROM jsonb_array_elements(v_candidate.signals) s;
  END IF;

  -- 4. Upsert into corridor_heat if table exists
  INSERT INTO public.corridor_heat (corridor_key, country, origin_admin1, dest_admin1, service_type, heat_01, active_loads)
  VALUES (
    v_corridor_key, 'US',
    coalesce(v_candidate.origin_state, '??'),
    coalesce(v_candidate.dest_state, '??'),
    coalesce(v_candidate.escort_type, 'escort'),
    0.1, 1
  )
  ON CONFLICT (corridor_key) DO UPDATE SET
    heat_01 = corridor_heat.heat_01 + 0.05,
    active_loads = corridor_heat.active_loads + 1,
    last_seen_at = now(),
    updated_at = now();

  RETURN jsonb_build_object(
    'ok', true,
    'company_id', v_company_id,
    'is_new', v_is_new,
    'corridor_key', v_corridor_key,
    'candidate_id', p_candidate_id
  );
END;
$$;

-- 5. BATCH PROCESS ALL PENDING CANDIDATES
CREATE OR REPLACE FUNCTION public.hc_process_pending_candidates(
  p_batch_limit INT DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidate RECORD;
  v_results   JSONB := '[]'::jsonb;
  v_result    JSONB;
  v_count     INT := 0;
BEGIN
  FOR v_candidate IN
    SELECT id FROM public.hc_extraction_candidates
    WHERE status = 'pending'
    ORDER BY seen_at ASC
    LIMIT p_batch_limit
  LOOP
    v_result := public.hc_company_upsert_from_candidate(v_candidate.id);
    v_results := v_results || v_result;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_count,
    'results', v_results
  );
END;
$$;

-- 6. DEDUPE CANDIDATES RPC
-- Finds likely duplicates based on same company + lane + escort type within window.
CREATE OR REPLACE FUNCTION public.hc_dedupe_candidates(
  p_window_hours INT DEFAULT 24
)
RETURNS TABLE (
  candidate_a    UUID,
  candidate_b    UUID,
  company_a      TEXT,
  company_b      TEXT,
  match_type     TEXT,
  confidence     NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS candidate_a,
    b.id AS candidate_b,
    a.company_name AS company_a,
    b.company_name AS company_b,
    CASE
      WHEN a.phone_norm = b.phone_norm AND a.phone_norm IS NOT NULL THEN 'exact_phone'
      WHEN a.company_name_norm = b.company_name_norm THEN 'exact_name'
      WHEN a.dedupe_hash = b.dedupe_hash THEN 'hash_match'
      ELSE 'fuzzy'
    END AS match_type,
    CASE
      WHEN a.phone_norm = b.phone_norm AND a.phone_norm IS NOT NULL THEN 0.95
      WHEN a.company_name_norm = b.company_name_norm
           AND a.origin_state = b.origin_state
           AND a.dest_state = b.dest_state THEN 0.88
      WHEN a.dedupe_hash = b.dedupe_hash THEN 0.85
      ELSE 0.60
    END AS confidence
  FROM public.hc_extraction_candidates a
  JOIN public.hc_extraction_candidates b
    ON a.id < b.id
    AND a.status = 'pending' AND b.status = 'pending'
    AND b.seen_at BETWEEN a.seen_at - (p_window_hours || ' hours')::interval
                      AND a.seen_at + (p_window_hours || ' hours')::interval
  WHERE (
    (a.phone_norm = b.phone_norm AND a.phone_norm IS NOT NULL AND a.phone_norm != '')
    OR a.dedupe_hash = b.dedupe_hash
    OR (a.company_name_norm = b.company_name_norm AND a.company_name_norm != '')
  )
  ORDER BY confidence DESC;
END;
$$;

-- 7. RLS POLICIES
ALTER TABLE public.hc_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_extraction_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_dispatcher_graph_edges ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by RPCs and backend)
CREATE POLICY hc_artifacts_service ON public.hc_artifacts
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY hc_candidates_service ON public.hc_extraction_candidates
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY hc_graph_service ON public.hc_dispatcher_graph_edges
  FOR ALL USING (true) WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY hc_artifacts_read ON public.hc_artifacts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY hc_candidates_read ON public.hc_extraction_candidates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY hc_graph_read ON public.hc_dispatcher_graph_edges
  FOR SELECT TO authenticated USING (true);
