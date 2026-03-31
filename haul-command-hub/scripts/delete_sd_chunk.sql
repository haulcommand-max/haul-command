WITH deleted AS (
  DELETE FROM search_documents
  WHERE id IN (
    SELECT id FROM search_documents 
    WHERE is_quarantined = true
    LIMIT 20000
  )
  RETURNING 1
)
SELECT count(*) AS deleted_count FROM deleted;
