-- =============================================================================
-- HAUL COMMAND: BULK INGESTION BYPASS RPC
-- Allows service-role clients to insert large batches without hitting
-- PostgREST's default statement_timeout.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.bulk_ingest_directory_listings(
  p_rows JSONB
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '0'   -- Unlimited for this trusted function only
AS $$
DECLARE
  v_row   JSONB;
  v_count INT := 0;
BEGIN
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    INSERT INTO public.directory_listings (
      id, entity_id, entity_type, name, slug, city, city_slug,
      region_code, country_code, latitude, longitude,
      source, claim_status, rank_score, is_visible,
      entity_confidence_score, profile_completeness,
      claim_priority_score, metadata
    )
    VALUES (
      COALESCE((v_row->>'id')::uuid,  gen_random_uuid()),
      COALESCE((v_row->>'entity_id')::uuid, gen_random_uuid()),
      COALESCE(v_row->>'entity_type', 'operator'),
      v_row->>'name',
      v_row->>'slug',
      v_row->>'city',
      v_row->>'city_slug',
      v_row->>'region_code',
      COALESCE(v_row->>'country_code', 'US'),
      (v_row->>'latitude')::float,
      (v_row->>'longitude')::float,
      COALESCE(v_row->>'source', 'global_matrix_simulation'),
      COALESCE(v_row->>'claim_status', 'unclaimed'),
      COALESCE((v_row->>'rank_score')::int, 10),
      COALESCE((v_row->>'is_visible')::boolean, true),
      COALESCE((v_row->>'entity_confidence_score')::int, 80),
      COALESCE((v_row->>'profile_completeness')::int, 40),
      COALESCE((v_row->>'claim_priority_score')::int, 60),
      COALESCE(v_row->'metadata', '{}'::jsonb)
    )
    ON CONFLICT (slug) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Only the service role can invoke this
REVOKE ALL ON FUNCTION public.bulk_ingest_directory_listings(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_ingest_directory_listings(JSONB) TO service_role;
