-- Deduplicate glossary terms keeping the most recently updated entry
DELETE FROM public.glossary_terms
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY lower(term)
                   ORDER BY updated_at DESC, id ASC
               ) as rn
        FROM public.glossary_terms
    ) sub
    WHERE rn = 1
);

-- Add a unique constraint to prevent future duplicates if possible, 
-- note: this assumes we aren't using the same exact term for multiple jurisdictions yet, 
-- or if we are, we should add jurisdiction to the UNIQUE index. 
-- Assuming jurisdiction is null for generic terms, COALESCE is used.
CREATE UNIQUE INDEX IF NOT EXISTS glossary_terms_unique_term_jurisdiction_idx 
ON public.glossary_terms (lower(term), COALESCE(jurisdiction, 'GLOBAL'));
