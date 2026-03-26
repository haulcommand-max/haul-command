-- 0020_public_views_safe_for_seo.sql
-- This is the SEO-safe public directory view (no contact info).
begin;

-- Drop first to handle any column-count mismatch from prior definitions
drop view if exists public.directory_drivers cascade;

create view public.directory_drivers as
select
  p.user_id              as driver_id,
  p.display_name,
  p.home_base_city,
  p.home_base_state,
  null::text             as home_base_country,
  null::text             as profile_slug,
  p.photo_url            as avatar_url,
  dp.verified_badge      as is_verified,
  p.last_active_bucket,
  p.lifetime_runs,
  p.lifetime_verified_miles,
  p.public_tags,
  null::text             as public_phone_masked,
  dp.updated_at
from public.driver_profiles dp
join public.profiles p on p.user_id = dp.user_id;

grant select on public.directory_drivers to anon, authenticated;

commit;
