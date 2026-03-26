-- Add FMCSA enrichment columns to hc_extraction_candidates
ALTER TABLE public.hc_extraction_candidates
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS dot_number TEXT,
  ADD COLUMN IF NOT EXISTS mc_number TEXT,
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS extracted_phone TEXT;

-- Drop the old constraint
ALTER TABLE public.hc_extraction_candidates 
  DROP CONSTRAINT hc_extraction_candidates_status_check;

-- Add the new constraint with the extended FMCSA enrichment statuses
ALTER TABLE public.hc_extraction_candidates
  ADD CONSTRAINT hc_extraction_candidates_status_check 
  CHECK (status IN ('pending', 'merged', 'skipped', 'flagged', 'RAW_FMCSA', 'ENRICHMENT_FAILED', 'PROMOTED_UNCLAIMED'));
