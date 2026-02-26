-- 20260219_data_plumber_views.sql
-- The "Contract" for the SEO Engine & Load Board UI.
-- Decouples internal table schema from public retrieval logic.

-- 1. Directory Driver Profiles View
-- Purpose: Public profile data for SEO pages.
create or replace view public.directory_driver_profiles_view as
select
  p.id,
  p.user_id,
  p.slug, -- Canonical slug
  p.business_name as display_name,
  p.city,
  p.state,
  p.zip,
  p.about_text as description,
  p.verified_tier, -- 'V0', 'V1', etc.
  p.equipment_tags, -- jsonb array e.g. ['high_pole', 'chase']
  p.service_area_states, -- jsonb array e.g. ['FL', 'GA']
  p.review_count,
  p.avg_rating,
  p.years_in_business,
  p.logo_url,
  p.cover_image_url,
  p.verification_badges, -- jsonb array
  p.last_active_at,
  p.created_at as joined_at,
  -- Contact info (maybe masked for non-logged in? For SEO render, we might show "Login to Call" or partial)
  -- For now exposing public contact if they have 'public_visibility' = true
  case when p.public_visibility then p.phone else null end as public_phone,
  case when p.public_visibility then p.website else null end as public_website
from public.driver_profiles p
where p.status = 'active'
  and p.slug is not null;

-- 2. Directory Active Loads View (Enhancing 0008)
-- Purpose: Public load details for SEO and Feed.
create or replace view public.directory_active_loads_view as
select
  l.id,
  l.slug, -- Canonical slug
  l.posted_at,
  l.pickup_city as origin_city,
  l.pickup_state as origin_state,
  l.pickup_country as origin_country,
  l.drop_city as dest_city,
  l.drop_state as dest_state,
  l.drop_country as dest_country,
  l.description,
  l.equipment_required, -- jsonb
  l.rate_per_mile,
  l.total_rate,
  l.currency,
  l.status,
  l.broker_id,
  b.business_name as broker_name,
  b.verified_tier as broker_tier,
  b.slug as broker_slug,
  -- Aggregated fields for SEO context
  l.pickup_date,
  l.length_ft,
  l.width_ft,
  l.height_ft,
  l.weight_lbs
from public.loads l
left join public.broker_profiles b on l.broker_id = b.id
where l.status in ('open', 'posted')
  and l.visibility = 'public';

-- 3. Liquidity Engine Read Access (if not already covered)
-- This view helps fetch specific load details efficiently
create or replace view public.liquidity_loads_view as
select * from public.directory_active_loads_view;
