-- ============================================================
-- Seed crawl_budget_policy: 52 countries × 10 page types
-- Sane defaults that prevent global index explosion
-- ============================================================
begin;

with countries(country_code) as (
  values
  ('US'), ('CA'),
  ('AU'), ('GB'), ('NZ'), ('IE'), ('ZA'),
  ('NL'), ('DE'), ('SE'), ('NO'), ('DK'), ('FI'),
  ('BE'), ('AT'), ('CH'),
  ('ES'), ('FR'), ('IT'), ('PT'),
  ('PL'), ('CZ'), ('SK'), ('HU'), ('SI'),
  ('EE'), ('LV'), ('LT'),
  ('HR'), ('RO'), ('BG'), ('GR'), ('TR'),
  ('AE'), ('SA'), ('QA'), ('KW'), ('OM'), ('BH'),
  ('SG'), ('MY'), ('JP'), ('KR'),
  ('CL'), ('MX'), ('BR'), ('AR'), ('CO'), ('PE'),
  ('UY'), ('PA'), ('CR')
),
page_types(page_type, max_indexable, promote_threshold, demote_threshold) as (
  values
  ('glossary',     999999, 1.00, 0.00),
  ('city',           8000, 1.10, 0.85),
  ('near_me',        3000, 1.15, 0.90),
  ('corridor',       2500, 1.05, 0.80),
  ('port',           2500, 1.05, 0.80),
  ('operator',       4000, 1.15, 0.90),
  ('rules',         99999, 1.00, 0.00),
  ('leaderboard',   99999, 1.00, 0.00),
  ('country',       99999, 1.00, 0.00),
  ('region',        99999, 1.00, 0.00)
)
insert into public.crawl_budget_policy (country_code, page_type, max_indexable, promote_threshold, demote_threshold, enabled)
select c.country_code, p.page_type, p.max_indexable, p.promote_threshold, p.demote_threshold, true
from countries c
cross join page_types p
on conflict (country_code, page_type)
do update set
  max_indexable = excluded.max_indexable,
  promote_threshold = excluded.promote_threshold,
  demote_threshold = excluded.demote_threshold,
  enabled = excluded.enabled;

commit;
