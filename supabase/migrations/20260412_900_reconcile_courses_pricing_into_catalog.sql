begin;

-- ==============================================================================
-- MOVE 5: RECONCILE PRICING & COURSES INTO TRAINING CATALOG
-- ==============================================================================

-- 1. Add pricing and delivery fields to canonical training_catalog
alter table public.training_catalog 
  add column if not exists price_cents int default 0,
  add column if not exists currency char(3) default 'USD',
  add column if not exists delivery_method text check(delivery_method in('self_paced','live_online','in_person','hybrid')),
  add column if not exists certification_level text;

-- 2. Migrate courses that don't already exist in the catalog
insert into public.training_catalog (
  slug, title, summary, pricing_mode, price_cents, currency, hours_total, module_count, delivery_method, certification_level, credential_level
)
select 
  hc.slug, 
  hc.title, 
  hc.description, 
  case when hc.price_cents = 0 then 'free' else 'paid' end,
  hc.price_cents,
  hc.currency,
  coalesce(cast(hc.duration_hours as int), 0),
  hc.modules_count,
  hc.delivery_method,
  hc.certification_level,
  'certified' -- default credential level for migrated courses
from public.hc_training_courses hc
where not exists (
  select 1 from public.training_catalog tc where tc.slug = hc.slug
);

-- 3. Update existing catalog rows if they match (though there's currently low overlap)
update public.training_catalog tc
set 
  price_cents = hc.price_cents,
  currency = hc.currency,
  delivery_method = hc.delivery_method,
  certification_level = hc.certification_level,
  pricing_mode = case when hc.price_cents = 0 then 'free' else 'paid' end
from public.hc_training_courses hc
where tc.slug = hc.slug;

-- 4. Update training_hub_payload RPC to include the new fields
drop function if exists public.training_hub_payload();
create or replace function public.training_hub_payload()
returns table (
  slug text,
  title text,
  summary text,
  training_type text,
  credential_level text,
  module_count int,
  hours_total int,
  pricing_mode text,
  price_cents int,
  currency text,
  delivery_method text,
  certification_level text,
  requirement_fit text,
  ranking_impact text,
  sponsor_eligible boolean,
  geo_coverage_count bigint
) language sql security definer as $$
  select 
    c.slug,
    c.title,
    c.summary,
    c.training_type,
    c.credential_level,
    c.module_count,
    c.hours_total,
    c.pricing_mode,
    c.price_cents,
    c.currency::text,
    c.delivery_method,
    c.certification_level,
    c.requirement_fit,
    c.ranking_impact,
    c.sponsor_eligible,
    count(g.id) as geo_coverage_count
  from public.training_catalog c
  left join public.training_geo_fit g on g.training_id = c.id
  where c.is_active = true
  group by c.id
  order by c.created_at asc;
$$;

commit;
