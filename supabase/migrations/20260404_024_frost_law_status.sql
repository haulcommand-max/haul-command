-- Migration 024: Live frost law status table
-- Source of truth for the frost law tracker page
begin;

drop table if exists public.hc_frost_law_status cascade;
create table if not exists public.hc_frost_law_status (
  id               uuid primary key default gen_random_uuid(),
  state_code       text not null,          -- e.g. 'MN', 'ON'
  country_code     text not null default 'US',
  state_name       text not null,
  status           text not null default 'normal'
                     check(status in('active','watch','normal','lifting')),
  weight_reduction_pct int default 0,      -- e.g. 50 = 50% reduction
  activated_at     timestamptz,
  expected_lift_at timestamptz,
  source_url       text,
  source_name      text,
  details          text,
  typical_start    text,                   -- 'Mar 1'
  typical_end      text,                   -- 'May 15'
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(state_code, country_code)
);

create index if not exists idx_frost_status_country on public.hc_frost_law_status(country_code, status);
create index if not exists idx_frost_status_active  on public.hc_frost_law_status(status, activated_at desc)
  where status in ('active','watch');

alter table public.hc_frost_law_status enable row level security;

create policy "Anyone can read frost law status" on public.hc_frost_law_status
  for select using (true);

create policy "Service role manages frost laws" on public.hc_frost_law_status
  for all using (auth.role() = 'service_role');

-- Seed reference data for 16 states/provinces
insert into public.hc_frost_law_status
  (state_code, country_code, state_name, status, weight_reduction_pct, typical_start, typical_end, source_name)
values
  ('MN','US','Minnesota',          'watch',  50, 'Mar 1',  'May 15', 'MnDOT'),
  ('WI','US','Wisconsin',          'watch',  50, 'Mar 1',  'May 1',  'WisDOT'),
  ('MI','US','Michigan',           'watch',  35, 'Feb 15', 'Apr 30', 'MDOT'),
  ('ND','US','North Dakota',       'normal', 50, 'Mar 15', 'May 15', 'NDDOT'),
  ('SD','US','South Dakota',       'normal', 50, 'Mar 15', 'May 1',  'SDDOT'),
  ('IA','US','Iowa',               'normal', 35, 'Mar 1',  'Apr 15', 'Iowa DOT'),
  ('IL','US','Illinois',           'normal', 20, 'Feb 15', 'Apr 15', 'IDOT'),
  ('IN','US','Indiana',            'normal', 25, 'Mar 1',  'Apr 15', 'INDOT'),
  ('OH','US','Ohio',               'normal', 25, 'Mar 1',  'Apr 30', 'ODOT'),
  ('PA','US','Pennsylvania',       'normal', 25, 'Feb 15', 'Apr 15', 'PennDOT'),
  ('NY','US','New York',           'normal', 25, 'Mar 1',  'Apr 30', 'NYSDOT'),
  ('ME','US','Maine',              'normal', 50, 'Mar 15', 'May 15', 'MaineDOT'),
  ('ON','CA','Ontario',            'normal', 50, 'Mar 1',  'Apr 30', 'MTO'),
  ('AB','CA','Alberta',            'normal', 35, 'Mar 1',  'May 1',  'Alberta Transportation'),
  ('SK','CA','Saskatchewan',       'normal', 50, 'Mar 15', 'May 1',  'Sask Highways'),
  ('MB','CA','Manitoba',           'normal', 50, 'Mar 15', 'May 1',  'Manitoba Infrastructure')
on conflict (state_code, country_code) do update set
  state_name           = excluded.state_name,
  typical_start        = excluded.typical_start,
  typical_end          = excluded.typical_end,
  source_name          = excluded.source_name;

-- Update trigger
create or replace function public.hc_touch_frost_law_updated()
returns trigger language plpgsql as $$
begin NEW.updated_at = now(); return NEW; end;
$$;
drop trigger if exists tg_frost_law_updated on public.hc_frost_law_status;
create trigger tg_frost_law_updated
  before update on public.hc_frost_law_status
  for each row execute function public.hc_touch_frost_law_updated();

commit;
