begin;

alter table if exists public.seo_pages
  add column if not exists metro_cluster_id text,
  add column if not exists h3_r6 text;

create index if not exists seo_pages_metro_cluster_idx on public.seo_pages(metro_cluster_id);
create index if not exists seo_pages_h3_r6_idx on public.seo_pages(h3_r6);

commit;
