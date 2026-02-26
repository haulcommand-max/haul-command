-- 0020_public_views_safe_for_seo.sql
-- This is the SEO-safe public directory view (no contact info).
begin;

create or replace view public.directory_drivers as
select
  dp.driver_id,
  dp.country_code,
  dp.region_code,
  dp.city,
  dp.city_slug,
  dp.company_name,
  dp.rig_type,
  dp.equipment,
  dp.insurance_level,
  dp.is_verified,
  dp.last_active_bucket,
  dp.opted_in_contact,
  dp.updated_at
from public.driver_profiles dp;

grant select on public.directory_drivers to anon, authenticated;

commit;
