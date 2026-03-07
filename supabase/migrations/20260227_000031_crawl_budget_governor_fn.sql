begin;

create or replace function public.run_crawl_budget_governor(target_country text default null)
returns void
language plpgsql
as $$
declare
  r record;
begin
  for r in
    select p.country_code, p.page_type, p.max_indexable, p.promote_threshold, p.demote_threshold
    from public.crawl_budget_policy p
    where p.enabled = true
      and (target_country is null or p.country_code = target_country)
  loop
    -- 1) Mark the top max_indexable pages as indexable based on latest link_weight
    with latest as (
      select
        sp.id as seo_page_id,
        sp.canonical_path,
        sp.is_indexable,
        lws.link_weight,
        lws.demand_score
      from public.seo_pages sp
      join lateral (
        select link_weight, demand_score
        from public.link_weight_signals
        where seo_page_id = sp.id
        order by signal_date desc
        limit 1
      ) lws on true
      where sp.country_code = r.country_code
        and sp.page_type = r.page_type
    ),
    ranked as (
      select *, row_number() over (order by link_weight desc, demand_score desc) as rn
      from latest
    )
    update public.seo_pages sp
    set is_indexable = (ranked.rn <= r.max_indexable)
    from ranked
    where sp.id = ranked.seo_page_id;

    -- 2) Update state table
    insert into public.crawl_budget_state(country_code, page_type, currently_indexable, last_run_at)
    values (
      r.country_code,
      r.page_type,
      (select count(*) from public.seo_pages where country_code = r.country_code and page_type = r.page_type and is_indexable = true),
      now()
    )
    on conflict (country_code, page_type)
    do update set
      currently_indexable = excluded.currently_indexable,
      last_run_at = excluded.last_run_at;
  end loop;
end;
$$;

commit;
