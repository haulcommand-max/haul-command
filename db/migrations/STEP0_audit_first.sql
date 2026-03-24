-- ============================================================
-- MASTER FIX: Create listings table + migrate operator_listings
-- ============================================================
-- Run this ONCE in Supabase SQL Editor.
-- This creates the listings table, migrates all data from
-- operator_listings, and fixes all RLS/indexes.
-- ============================================================

-- STEP 0: Audit what tables exist
SELECT table_name, 
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name ILIKE '%list%'
ORDER BY table_name;

-- STEP 1: Check operator_listings schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'operator_listings' AND table_schema = 'public'
ORDER BY ordinal_position;
