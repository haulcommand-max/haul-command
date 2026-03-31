CREATE OR REPLACE PROCEDURE purge_fake_data()
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  total_deleted INT := 0;
BEGIN
  -- 1. Search documents
  LOOP
    DELETE FROM search_documents
    WHERE id IN (
      SELECT id FROM search_documents 
      WHERE is_quarantined = true
      LIMIT 50000
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    COMMIT;
    total_deleted := total_deleted + v_count;
    IF v_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;

  -- 2. Directory listings
  LOOP
    DELETE FROM directory_listings
    WHERE id IN (
      SELECT id FROM directory_listings 
      WHERE trust_classification = 'fake_synthetic_generated'
      LIMIT 50000
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    COMMIT;
    total_deleted := total_deleted + v_count;
    IF v_count = 0 THEN
      EXIT;
    END IF;
  END LOOP;
END;
$$;

CALL purge_fake_data();

DROP PROCEDURE purge_fake_data();

SELECT 
  (SELECT count(*) FROM directory_listings WHERE trust_classification = 'fake_synthetic_generated') as remaining_fake_dl,
  (SELECT count(*) FROM search_documents WHERE is_quarantined = true) as remaining_fake_sd;
