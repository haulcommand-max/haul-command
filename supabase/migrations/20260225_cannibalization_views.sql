-- ============================================================================
-- Cannibalization Analysis Views + SQL Clamp Helper
-- Depends on: gsc_query_metrics, seo_page_variants, v_query_cannibalization_28d
-- ============================================================================

-- SQL clamp helper (Postgres doesn't have a native clamp)
create or replace function public.clamp(val numeric, lo numeric default 0, hi numeric default 100)
returns numeric language sql immutable as $$
  select greatest(lo, least(hi, val));
$$;


-- Page-level cannibalization detail: which pages fight for which queries
create or replace view public.v_page_cannibalization_28d as
select
  g.page_path,
  g.query,
  sum(g.impressions) as impressions_28d,
  sum(g.clicks) as clicks_28d,
  case when sum(g.impressions) > 0
    then (sum(g.clicks)::numeric / sum(g.impressions)::numeric)
    else null end as ctr_28d,
  avg(g.avg_position) as avg_position_28d
from public.gsc_query_metrics g
join public.v_query_cannibalization_28d q on q.query = g.query
where g.day >= (current_date - interval '28 days')
group by 1, 2;


-- Per-page cannibalization score (0-100, higher = worse)
create or replace view public.v_page_cannibalization_score as
select
  page_path,
  public.clamp(
    (count(*)::numeric * 6) +
    (case when avg(ctr_28d) is null then 8
          else greatest(0, (0.05 - avg(ctr_28d)) * 200) end) +
    greatest(0, (avg(avg_position_28d) - 10) * 1.5),
    0, 100
  ) as cannibalization_score
from public.v_page_cannibalization_28d
group by 1;
