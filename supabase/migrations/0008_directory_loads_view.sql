-- 0008_directory_loads_view.sql
-- Assumes you have public.loads with broker_id, contact fields, etc.

create or replace view public.directory_loads as
select
  l.id,
  l.status,
  l.created_at,
  l.pickup_city,
  l.pickup_state,
  l.pickup_country,
  l.drop_city,
  l.drop_state,
  l.drop_country,
  l.pickup_date,
  l.pickup_window_start,
  l.pickup_window_end,
  l.estimated_miles,
  l.required_positions,          -- e.g. ['lead','chase','high_pole']
  l.required_equipment,          -- e.g. ['light_bar','height_pole']
  l.load_height_ft,
  l.load_width_ft,
  l.load_length_ft,
  l.public_rate_hint,            -- safe teaser like '$2.25+/mi' (no exact if you want)
  l.visibility_scope             -- 'public'|'members' etc
from public.loads l
where l.status in ('open','scheduled')
  and coalesce(l.visibility_scope,'public') = 'public';
