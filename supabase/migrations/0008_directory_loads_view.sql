-- 0008_directory_loads_view.sql
-- Assumes you have public.loads with broker_id, contact fields, etc.

create or replace view public.directory_loads as
select
  l.id,
  l.status,
  l.created_at,
  l.pickup_city,
  l.origin_admin1           as pickup_state,
  l.origin_country          as pickup_country,
  l.dest_city               as drop_city,
  l.dest_admin1             as drop_state,
  l.dest_country            as drop_country,
  l.load_date               as pickup_date,
  null::timestamptz         as pickup_window_start,
  null::timestamptz         as pickup_window_end,
  l.miles                   as estimated_miles,
  null::text[]              as required_positions,
  null::text[]              as required_equipment,
  null::real                as load_height_ft,
  null::real                as load_width_ft,
  null::real                as load_length_ft,
  l.rate_amount             as public_rate_hint,
  'public'::text            as visibility_scope
from public.loads l
where l.status = 'posted';
