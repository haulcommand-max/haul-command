-- Glossary Category Normalization Migration
-- Standardizes all legacy category names to the new capitalized format
-- Run in Supabase SQL Editor

-- Escort / Pilot Car
UPDATE glossary_public SET category = 'Escort & Pilot Car' WHERE category IN ('escort_operations', 'escort');

-- Permits & Regulations
UPDATE glossary_public SET category = 'Permits & Regulations' WHERE category IN ('regulations', 'Regulations', 'Regulations / Infrastructure', 'Regulations / Planning');

-- Load Types
UPDATE glossary_public SET category = 'Load Types' WHERE category IN ('cargo_types', 'load_classification', 'specialized_hauling');

-- Equipment
UPDATE glossary_public SET category = 'Equipment' WHERE category IN ('equipment');

-- Safety & Compliance
UPDATE glossary_public SET category = 'Safety & Compliance' WHERE category IN ('safety');

-- Rates & Finance
UPDATE glossary_public SET category = 'Rates & Finance' WHERE category IN ('finance');

-- Business & Operations
UPDATE glossary_public SET category = 'Business & Operations' WHERE category IN ('operations', 'Procedural', 'Roles');

-- Routing & Navigation
UPDATE glossary_public SET category = 'Routing & Navigation' WHERE category IN ('infrastructure', 'Infrastructure', 'Maneuver');

-- Technology
UPDATE glossary_public SET category = 'Technology' WHERE category IN ('technology');

-- Industry Lingo
UPDATE glossary_public SET category = 'Industry Lingo' WHERE category IN ('Lingo', 'Radio Callout');

-- Energy & Components
UPDATE glossary_public SET category = 'Load Types' WHERE category IN ('energy_components');

-- Verify results
SELECT category, count(*) as term_count 
FROM glossary_public 
GROUP BY category 
ORDER BY term_count DESC;
