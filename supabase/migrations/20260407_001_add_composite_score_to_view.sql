-- Migration: Add composite_score alias to hc_corridor_public_v1
-- Issue: CorridorLeaderboard queries composite_score but view only exposes corridor_score
-- Fix: Add corridor_score aliased as composite_score to the view
-- Policy: upgrade-only, CREATE OR REPLACE (safe, no drops)
-- Author: Anti-Gravity Sprint — Homepage Crown Jewel Activation

begin;

create or replace view public.hc_corridor_public_v1 as
select
  c.id, c.corridor_code, c.slug, c.name, c.short_name,
  c.status, c.corridor_type, c.tier, c.country_code,
  c.primary_language_code, c.currency_code,
  c.origin_country_code, c.origin_region_code, c.origin_city_name,
  c.destination_country_code, c.destination_region_code, c.destination_city_name,
  c.is_cross_border, c.distance_km, c.distance_miles, c.typical_mode,
  c.corridor_score,
  c.corridor_score as composite_score,  -- ← ADDED: alias for CorridorLeaderboard compatibility
  c.seo_priority_score, c.market_priority_score,
  c.monetization_priority_score, c.freshness_score, c.confidence_score,
  c.permit_complexity_score, c.escort_complexity_score,
  c.credential_complexity_score, c.scarcity_score, c.urgency_score,
  c.ad_inventory_score, c.commercial_value_estimate, c.search_volume_estimate,
  req.requirement_count, req.permit_count, req.escort_count,
  cr.credential_count, cr.required_credential_count,
  pr.escort_rate_median, pr.operator_rate_median, pr.urgent_fill_premium
from public.hc_corridors c
left join (
  select corridor_id,
    count(*) as requirement_count,
    count(*) filter (where requirement_type='permit') as permit_count,
    count(*) filter (where requirement_type in ('escort','pilot_car')) as escort_count
  from public.hc_corridor_requirements
  group by corridor_id
) req on req.corridor_id = c.id
left join (
  select corridor_id,
    count(*) as credential_count,
    count(*) filter (where required=true) as required_credential_count
  from public.hc_corridor_credentials
  group by corridor_id
) cr on cr.corridor_id = c.id
left join (
  select corridor_id,
    max(amount_median) filter (where observation_type='escort_rate') as escort_rate_median,
    max(amount_median) filter (where observation_type='operator_rate') as operator_rate_median,
    max(amount_median) filter (where observation_type='urgent_fill_premium') as urgent_fill_premium
  from public.hc_corridor_pricing_obs
  group by corridor_id
) pr on pr.corridor_id = c.id
where c.active = true and c.status = 'active';

commit;
