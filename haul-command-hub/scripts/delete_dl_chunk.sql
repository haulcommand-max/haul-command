WITH deleted AS (
  DELETE FROM directory_listings
  WHERE id IN (
    SELECT id FROM directory_listings 
    WHERE trust_classification = 'fake_synthetic_generated'
    LIMIT 20000
  )
  RETURNING 1
)
SELECT count(*) AS deleted_count FROM deleted;
