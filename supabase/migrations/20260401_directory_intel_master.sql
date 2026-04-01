-- =========================================================================
-- HAUL COMMAND - DIRECTORY INTEL STACK (MASTER SPEC UPGRADE)
-- Implementation of directory_intel_stack.yaml for 120-country Knowledge OS
-- UPGRADE ACTION: Smashing new Intel variables directly into `hc_global_operators` 
-- rather than causing redundant table fragmentation.
-- =========================================================================

-- 1. Extend `hc_global_operators` with Role Classifier & Confidence Intel
ALTER TABLE public.hc_global_operators
    ADD COLUMN IF NOT EXISTS geo_confidence NUMERIC(4,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS geo_candidates_json JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS geo_provenance_json JSONB DEFAULT '{}'::jsonb,
    
    ADD COLUMN IF NOT EXISTS role_primary TEXT CHECK (role_primary IN ('escort', 'broker', 'mobile_home_mover', 'vendor_support', 'unknown')),
    ADD COLUMN IF NOT EXISTS roles_multi_json JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS role_scores_json JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_confidence NUMERIC(4,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS role_provenance_json JSONB DEFAULT '{}'::jsonb,
    
    ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS confidence_tier TEXT CHECK (confidence_tier IN ('A', 'B', 'C', 'D', 'UNRANKED')),
    ADD COLUMN IF NOT EXISTS score_breakdown_json JSONB DEFAULT '{}'::jsonb;

-- 2. Coverage Heatmaps & Supply Density
CREATE TABLE IF NOT EXISTS public.coverage_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_id TEXT NOT NULL, -- 'geohash_h6', 'geohash_h7', 'county', 'metro'
    cell_key TEXT NOT NULL,
    cell_center_lat DOUBLE PRECISION,
    cell_center_lon DOUBLE PRECISION,
    measures_json JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(grid_id, cell_key)
);

CREATE TABLE IF NOT EXISTS public.coverage_rollups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rollup_type TEXT NOT NULL,
    rollup_key TEXT NOT NULL,
    measures_json JSONB DEFAULT '{}'::jsonb,
    top_companies_json JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(rollup_type, rollup_key)
);

ALTER TABLE public.coverage_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read coverage_cells ON public.coverage_cells" ON public.coverage_cells FOR SELECT USING (true);
CREATE POLICY "Public read coverage_rollups ON public.coverage_rollups" ON public.coverage_rollups FOR SELECT USING (true);

-- 3. Update the Meilisearch-Fallback RPC to utilize `hc_global_operators`
CREATE OR REPLACE FUNCTION rpc_directory_search(search_query TEXT, limit_val INT DEFAULT 50)
RETURNS TABLE (
    id UUID,
    name TEXT,
    company TEXT,
    phone TEXT,
    city TEXT,
    state TEXT,
    confidence_tier TEXT,
    role_primary TEXT,
    defense_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        COALESCE(o.name, 'Operator') as name,
        o.name as company,
        o.phone_normalized as phone,
        o.city,
        o.admin1_code as state,
        o.confidence_tier,
        o.role_primary,
        o.confidence_score as defense_score
    FROM public.hc_global_operators o
    WHERE 
        search_query = '' OR
        o.name ILIKE '%' || search_query || '%' OR
        o.city ILIKE '%' || search_query || '%' OR
        o.admin1_code ILIKE '%' || search_query || '%'
    ORDER BY COALESCE(o.confidence_score, 0) DESC NULLS LAST
    LIMIT limit_val;
END;
$$;

-- 4. Rebuild Materialized View mv_state_counts using `hc_global_operators`
DROP MATERIALIZED VIEW IF EXISTS mv_state_counts CASCADE;

CREATE MATERIALIZED VIEW mv_state_counts AS
  SELECT
    UPPER(TRIM(admin1_code)) as state,
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE is_claimed = true)::int AS claimed_count,
    COUNT(*) FILTER (WHERE is_claimed = false OR is_claimed IS NULL)::int AS unclaimed_count,
    ROUND(AVG(confidence_score)::numeric, 1) AS avg_rating
  FROM public.hc_global_operators
  WHERE admin1_code IS NOT NULL AND TRIM(admin1_code) != ''
  GROUP BY UPPER(TRIM(admin1_code))
  ORDER BY total DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_state_counts_state ON mv_state_counts(state);

CREATE OR REPLACE FUNCTION rpc_state_counts()
RETURNS TABLE(
  state text,
  total int,
  claimed_count int,
  unclaimed_count int,
  avg_rating numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT state, total, claimed_count, unclaimed_count, avg_rating
  FROM mv_state_counts
  ORDER BY total DESC;
$$;

-- 5. Helper Function to instantly recalculate confidence scores
CREATE OR REPLACE FUNCTION rpc_refresh_directory_confidence()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.hc_global_operators
    SET 
        confidence_score = (CASE WHEN is_claimed = true THEN 85 ELSE 40 END) + (CASE WHEN is_verified = true THEN 15 ELSE 0 END),
        confidence_tier = CASE 
            WHEN ((CASE WHEN is_claimed = true THEN 85 ELSE 40 END) + (CASE WHEN is_verified = true THEN 15 ELSE 0 END)) >= 85 THEN 'A'
            WHEN ((CASE WHEN is_claimed = true THEN 85 ELSE 40 END) + (CASE WHEN is_verified = true THEN 15 ELSE 0 END)) >= 70 THEN 'B'
            WHEN ((CASE WHEN is_claimed = true THEN 85 ELSE 40 END) + (CASE WHEN is_verified = true THEN 15 ELSE 0 END)) >= 50 THEN 'C'
            ELSE 'D'
        END,
        role_primary = COALESCE(role_primary, 'escort')
    WHERE confidence_tier IS NULL;
END;
$$;
