-- Migration: COMPETITOR INGESTION & TRACKING SCHEMA
-- Source: osowhaven.com & truckstopsandservices.com
-- Purpose: Intelligence gap analysis and automated displacement campaigns

-- 1. Track competitor data for ongoing intelligence
create table if not exists competitor_intel (
  id uuid primary key default gen_random_uuid(),
  competitor_name text not null,  -- 'osow_haven' | 'truckstopsandservices'
  country_code char(2) default 'US',
  state char(2),
  competitor_operator_count int,
  our_operator_count int,
  coverage_delta int generated always as (our_operator_count - competitor_operator_count) stored,
  our_status text generated always as (
    case
      when our_operator_count > competitor_operator_count then 'WINNING'
      when our_operator_count = competitor_operator_count then 'TIED'
      else 'BEHIND'
    end
  ) stored,
  competitor_url text,
  last_checked timestamptz default now(),
  notes text
);

-- 2. Track operators sourced from competitors
alter table operators 
  add column if not exists competitor_sourced boolean default false,
  add column if not exists competitor_source text,
  add column if not exists competitor_profile_url text,
  add column if not exists competitor_id text,
  add column if not exists claim_priority text default 'normal' check (claim_priority in ('high','normal','low')),
  add column if not exists claim_value_score float;

-- 3. Track operator overlap
create or replace view competitor_operator_overlap as
  select
    o.id,
    o.company_name,
    o.state,
    o.is_claimed,
    o.competitor_source,
    o.claim_priority,
    o.claim_value_score,
    op.phone,
    o.confidence_score
  from operators o
  join operator_phones op on op.operator_id = o.id and op.is_primary = true
  where o.competitor_sourced = true
  order by o.claim_value_score desc nulls last;

-- 4. Weekly competitor count refresh
create or replace function refresh_competitor_intel()
returns void as $$
begin
  -- Update our counts vs their counts per state
  insert into competitor_intel (competitor_name, state, competitor_operator_count, our_operator_count, competitor_url)
  select
    'osow_haven',
    o.state,
    0,  -- To be updated via ingestion scripts
    count(distinct o.id),
    'https://osowhaven.com/pilot-car-directory/' || lower(s.state_name) || '/'
  from operators o
  join (values
    ('AL','alabama'),('AK','alaska'),('AZ','arizona'),('AR','arkansas'),
    ('CA','california'),('CO','colorado'),('CT','connecticut'),('DE','delaware'),
    ('FL','florida'),('GA','georgia'),('HI','hawaii'),('ID','idaho'),
    ('IL','illinois'),('IN','indiana'),('IA','iowa'),('KS','kansas'),
    ('KY','kentucky'),('LA','louisiana'),('ME','maine'),('MD','maryland'),
    ('MA','massachusetts'),('MI','michigan'),('MN','minnesota'),('MS','mississippi'),
    ('MO','missouri'),('MT','montana'),('NE','nebraska'),('NV','nevada'),
    ('NH','new_hampshire'),('NJ','new_jersey'),('NM','new_mexico'),('NY','new_york'),
    ('NC','north_carolina'),('ND','north_dakota'),('OH','ohio'),('OK','oklahoma'),
    ('OR','oregon'),('PA','pennsylvania'),('RI','rhode_island'),('SC','south_carolina'),
    ('SD','south_dakota'),('TN','tennessee'),('TX','texas'),('UT','utah'),
    ('VT','vermont'),('VA','virginia'),('WA','washington'),('WV','west_virginia'),
    ('WI','wisconsin'),('WY','wyoming')
  ) as s(state_code, state_name) on s.state_code = o.state
  where o.country_code = 'US'
  group by o.state, s.state_name;
end;
$$ language plpgsql;
