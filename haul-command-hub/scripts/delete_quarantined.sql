-- SQL to delete the quarantined synthetic data to free up space
BEGIN;

-- 1. Delete associated search_documents
DELETE FROM search_documents
WHERE is_quarantined = true;

-- 2. Delete the actual synthetic directory listings
DELETE FROM directory_listings
WHERE trust_classification = 'fake_synthetic_generated';

COMMIT;

-- Verify the remaining counts
SELECT 
  (SELECT count(*) FROM directory_listings) as remaining_directory_listings,
  (SELECT count(*) FROM search_documents) as remaining_search_documents;
