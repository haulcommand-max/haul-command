-- normalize_glossary_categories.sql
-- Run this script to standardize and normalize categories across the glossary_terms table

BEGIN;

UPDATE public.glossary_terms
SET category = 'Regulations'
WHERE category IN ('Regulatory', 'Regulations / Infrastructure', 'Regulations / Planning');

UPDATE public.glossary_terms
SET category = 'Terminology'
WHERE category IN ('Lingo', 'Radio Callout');

UPDATE public.glossary_terms
SET category = 'Personnel'
WHERE category IN ('Roles');

UPDATE public.glossary_terms
SET category = 'Operations'
WHERE category IN ('Procedural', 'Maneuver', 'Operational');

UPDATE public.glossary_terms
SET category = 'Infrastructure'
WHERE category IN ('Infrastructure');

UPDATE public.glossary_terms
SET category = 'Equipment'
WHERE category IN ('Equipment');

UPDATE public.glossary_terms
SET category = 'Documentation'
WHERE category IN ('Documentation');

-- Standardize general null or unknown categories to General
UPDATE public.glossary_terms
SET category = 'General'
WHERE category IS NULL OR category = '';

COMMIT;
