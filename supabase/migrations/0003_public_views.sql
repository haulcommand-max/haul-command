-- 0003_public_views.sql
-- Public SEO-safe view for directory pages

-- 1) Add a visibility flag (if you don't already have it)
alter table public.driver_profiles
add column if not exists is_public boolean not null default true;

-- 2) Optional: bucket "last active" into privacy-safe labels
create or replace function public.activity_bucket(ts timestamptz)
returns text language sql stable as $$
  select case
    when ts is null then 'inactive'
    when ts >= now() - interval '6 hours' then 'active_now'
    when ts >= now() - interval '24 hours' then 'active_today'
    when ts >= now() - interval '7 days' then 'active_week'
    else 'stale'
  end;
$$;

-- 3) Create SEO-safe view
create or replace view public.directory_drivers
with (security_barrier = true) as
select
  -- public identifiers
  dp.user_id::text as public_id,

  -- location (no exact coordinates unless you choose)
  coalesce(p.country, 'US') as country,
  p.home_state as region_code,            -- state/province code
  p.home_city as city,

  -- capability flags
  dp.has_high_pole,
  dp.has_dashcam,
  dp.service_radius_miles,

  -- trust / freshness (privacy-safe)
  dp.verified_badge,
  public.activity_bucket(dp.last_active_at) as activity,

  -- “marketing-safe” numeric
  dp.insurance_min_limit_usd,

  -- derived tags to help SERP snippets / filters
  (case when dp.has_high_pole then 'high-pole' else null end) as primary_tag,

  -- timestamps for internal caching / debugging (optional)
  dp.last_active_at,
  p.created_at

from public.driver_profiles dp
join public.profiles p on p.id = dp.user_id
where
  dp.is_public = true
  -- choose your public gate:
  -- option A: only show verified in public SEO
  and dp.verified_badge = true
  -- option B (if you want more density): show verified OR recently active
  -- and (dp.verified_badge = true or dp.last_active_at >= now() - interval '14 days')
;

-- 4) Make view run with view-owner privileges (so anon doesn't need table grants)
alter view public.directory_drivers set (security_invoker = false);

-- 5) Privileges: allow anon read view, keep base tables locked
revoke all on table public.profiles from anon;
revoke all on table public.driver_profiles from anon;

grant select on public.directory_drivers to anon;

-- (Optional) also allow authenticated read without hitting private tables directly
grant select on public.directory_drivers to authenticated;
