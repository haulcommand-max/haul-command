begin;

create or replace function public.compute_link_weight(
  gsc_impressions bigint,
  gsc_clicks bigint,
  gsc_avg_position numeric,
  analytics_pageviews bigint,
  internal_searches bigint,
  bookings bigint,
  lead_submits bigint,
  review_velocity_7d int
)
returns table(demand_score numeric, link_weight numeric)
language plpgsql
as $$
declare
  ctr numeric := 0;
  pos_boost numeric := 0;
  score numeric := 0;
  weight numeric := 1;
begin
  if gsc_impressions > 0 then
    ctr := (gsc_clicks::numeric / gsc_impressions::numeric);
  end if;

  -- Position boost: pages already near page 1 get extra push (to win snippets/top 3)
  -- Lower avg_position is better. Null treated neutral.
  if gsc_avg_position is not null then
    pos_boost := greatest(0, (20 - gsc_avg_position)) / 20; -- 0..~1
  else
    pos_boost := 0.2;
  end if;

  -- Score components (tunable)
  score :=
      (ln(greatest(analytics_pageviews, 1)) * 0.35)
    + (ln(greatest(internal_searches, 1)) * 0.20)
    + (ln(greatest(gsc_impressions, 1)) * 0.20)
    + (ctr * 0.35)
    + (pos_boost * 0.25)
    + (ln(greatest(bookings, 1)) * 0.60)
    + (ln(greatest(lead_submits, 1)) * 0.30)
    + (ln(greatest(review_velocity_7d, 1)) * 0.25);

  -- Convert score → weight (bounded)
  -- 1.0 baseline, up to 3.0 for hot pages
  weight := least(3.0, greatest(0.8, 0.8 + (score / 3.0)));

  return query select score, weight;
end;
$$;

commit;
