-- TRUNCATE is O(1) time and instantly reclaims disk space
TRUNCATE TABLE search_documents CASCADE;
TRUNCATE TABLE directory_listings CASCADE;

SELECT 
  (SELECT pg_size_pretty(pg_total_relation_size('directory_listings'))) as dl_size,
  (SELECT pg_size_pretty(pg_total_relation_size('search_documents'))) as sd_size;
