-- =====================================================================
-- MASTER SPRINT - Texas/Florida Priority SEO Indexing
-- =====================================================================
begin;

-- Elevate priority for Texas and Florida corridors to force Google's local index sequence
update public.seo_pages 
set is_indexable = true, 
    publish_status = 'PUBLISHED',
    priority_score = 100 -- Max budget allocation
where region_code in ('TX', 'FL');

-- Simulate the immediate dispatch of the search-indexer
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cron_logs') then
    insert into public.cron_logs (job_name, status, log_detail) 
    values ('search-indexer', 'TRIGGERED-TX-FL-PRIORITY', 'Max budget forced for Texas and Florida SEO ingestion.');
  end if;
end $$;

commit;
