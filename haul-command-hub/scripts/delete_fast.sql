-- Fast deletion of 250k rows per table, multiple passes
DELETE FROM search_documents
WHERE ctid IN (
  SELECT ctid FROM search_documents
  WHERE is_quarantined = true
  LIMIT 250000
);

DELETE FROM directory_listings
WHERE ctid IN (
  SELECT ctid FROM directory_listings
  WHERE trust_classification = 'fake_synthetic_generated'
  LIMIT 250000
);

SELECT 
  (SELECT count(*) FROM directory_listings WHERE trust_classification = 'fake_synthetic_generated') as rem_dl,
  (SELECT count(*) FROM search_documents WHERE is_quarantined = true) as rem_sd;
