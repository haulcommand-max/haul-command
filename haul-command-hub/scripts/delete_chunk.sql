-- Delete chunks
WITH deleted_sd AS (
  DELETE FROM search_documents
  WHERE id IN (
    SELECT id FROM search_documents
    WHERE is_quarantined = true
    LIMIT 25000
  )
  RETURNING 1
), deleted_dl AS (
  DELETE FROM directory_listings
  WHERE id IN (
    SELECT id FROM directory_listings
    WHERE trust_classification = 'fake_synthetic_generated'
    LIMIT 25000
  )
  RETURNING 1
)
SELECT 
  (SELECT count(*) FROM deleted_sd) as sd_deleted,
  (SELECT count(*) FROM deleted_dl) as dl_deleted;
