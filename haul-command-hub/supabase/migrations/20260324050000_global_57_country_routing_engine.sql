-- Migration: HAUL COMMAND Global 57-Country Config & Antigravity Pipeline Engine
-- Version: 2.1 (Architecture-Corrected, Global Unified)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. DROP EVERYTHING TO BE REPLACED COMMITTEDLY
DROP TABLE IF EXISTS country_launch_status CASCADE;
DROP TABLE IF EXISTS country_rate_config CASCADE;
DROP TABLE IF EXISTS capability_translations CASCADE;
DROP TABLE IF EXISTS routing_edges CASCADE;
DROP TABLE IF EXISTS infrastructure_nodes CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS brokers CASCADE;
DROP TABLE IF EXISTS corridors CASCADE;
DROP TABLE IF EXISTS coverage_nodes CASCADE;
DROP TABLE IF EXISTS operator_capabilities CASCADE;
DROP TABLE IF EXISTS operator_phones CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS hc_countries CASCADE;


-- 3. COUNTRIES Core 
create table hc_countries (
  code char(2) primary key,
  name text not null,
  name_local text,
  currency text not null,
  currency_symbol text,
  distance_unit text default 'km' check (distance_unit in ('km','miles')),
  phone_prefix text,              
  locale_default text default 'en',
  rtl boolean default false,      
  push_provider text default 'fcm' check (push_provider in ('fcm','apns','custom')),
  tier char(1) default 'C' check (tier in ('A','B','C','D')),
  active boolean default true,
  launched boolean default false,
  created_at timestamptz default now()
);

insert into hc_countries (
  code, name, name_local, currency, currency_symbol,
  distance_unit, phone_prefix, locale_default, rtl,
  push_provider, tier, launched, active
) values
('US', 'United States',    'United States',    'USD', '$',   'miles', '+1',   'en',    false, 'fcm',    'A', true,  true),
('CA', 'Canada',           'Canada',           'CAD', 'C$',  'km',    '+1',   'en',    false, 'fcm',    'A', true,  true),
('AU', 'Australia',        'Australia',        'AUD', 'A$',  'km',    '+61',  'en-AU', false, 'fcm',    'A', true,  true),
('GB', 'United Kingdom',   'United Kingdom',   'GBP', '£',   'miles', '+44',  'en-GB', false, 'fcm',    'A', true,  true),
('NZ', 'New Zealand',      'New Zealand',      'NZD', 'NZ$', 'km',    '+64',  'en-NZ', false, 'fcm',    'A', true,  true),
('ZA', 'South Africa',     'South Africa',     'ZAR', 'R',   'km',    '+27',  'en-ZA', false, 'fcm',    'A', true,  true),
('DE', 'Germany',          'Deutschland',      'EUR', '€',   'km',    '+49',  'de',    false, 'fcm',    'A', true,  true),
('NL', 'Netherlands',      'Nederland',        'EUR', '€',   'km',    '+31',  'nl',    false, 'fcm',    'A', true,  true),
('AE', 'UAE',              'الإمارات',         'AED', 'د.إ', 'km',    '+971', 'ar',    true,  'fcm',    'A', true,  true),
('BR', 'Brazil',           'Brasil',           'BRL', 'R$',  'km',    '+55',  'pt-BR', false, 'fcm',    'A', true,  true),
('IE', 'Ireland',          'Éire',             'EUR', '€',   'km',    '+353', 'en-IE', false, 'fcm',    'B', false, true),
('SE', 'Sweden',           'Sverige',          'SEK', 'kr',  'km',    '+46',  'sv',    false, 'fcm',    'B', false, true),
('NO', 'Norway',           'Norge',            'NOK', 'kr',  'km',    '+47',  'no',    false, 'fcm',    'B', false, true),
('DK', 'Denmark',          'Danmark',          'DKK', 'kr',  'km',    '+45',  'da',    false, 'fcm',    'B', false, true),
('FI', 'Finland',          'Suomi',            'EUR', '€',   'km',    '+358', 'fi',    false, 'fcm',    'B', false, true),
('BE', 'Belgium',          'België/Belgique',  'EUR', '€',   'km',    '+32',  'fr',    false, 'fcm',    'B', false, true),
('AT', 'Austria',          'Österreich',       'EUR', '€',   'km',    '+43',  'de',    false, 'fcm',    'B', false, true),
('CH', 'Switzerland',      'Schweiz',          'CHF', 'Fr.', 'km',    '+41',  'de',    false, 'fcm',    'B', false, true),
('ES', 'Spain',            'España',           'EUR', '€',   'km',    '+34',  'es',    false, 'fcm',    'B', false, true),
('FR', 'France',           'France',           'EUR', '€',   'km',    '+33',  'fr',    false, 'fcm',    'B', false, true),
('IT', 'Italy',            'Italia',           'EUR', '€',   'km',    '+39',  'it',    false, 'fcm',    'B', false, true),
('PT', 'Portugal',         'Portugal',         'EUR', '€',   'km',    '+351', 'pt-PT', false, 'fcm',    'B', false, true),
('SA', 'Saudi Arabia',     'المملكة العربية',  'SAR', '﷼',   'km',    '+966', 'ar',    true,  'fcm',    'B', false, true),
('QA', 'Qatar',            'قطر',              'QAR', '﷼',   'km',    '+974', 'ar',    true,  'fcm',    'B', false, true),
('MX', 'Mexico',           'México',           'MXN', '$',   'km',    '+52',  'es-MX', false, 'fcm',    'B', false, true),
('IN', 'India',            'भारत',             'INR', '₹',   'km',    '+91',  'hi',    false, 'fcm',    'B', false, true),
('ID', 'Indonesia',        'Indonesia',        'IDR', 'Rp',  'km',    '+62',  'id',    false, 'fcm',    'B', false, true),
('TH', 'Thailand',         'ประเทศไทย',        'THB', '฿',   'km',    '+66',  'th',    false, 'fcm',    'B', false, true),
('PL', 'Poland',           'Polska',           'PLN', 'zł',  'km',    '+48',  'pl',    false, 'fcm',    'C', false, true),
('CZ', 'Czech Republic',   'Česká republika',  'CZK', 'Kč',  'km',    '+420', 'cs',    false, 'fcm',    'C', false, true),
('SK', 'Slovakia',         'Slovensko',        'EUR', '€',   'km',    '+421', 'sk',    false, 'fcm',    'C', false, true),
('HU', 'Hungary',          'Magyarország',     'HUF', 'Ft',  'km',    '+36',  'hu',    false, 'fcm',    'C', false, true),
('SI', 'Slovenia',         'Slovenija',        'EUR', '€',   'km',    '+386', 'sl',    false, 'fcm',    'C', false, true),
('EE', 'Estonia',          'Eesti',            'EUR', '€',   'km',    '+372', 'et',    false, 'fcm',    'C', false, true),
('LV', 'Latvia',           'Latvija',          'EUR', '€',   'km',    '+371', 'lv',    false, 'fcm',    'C', false, true),
('LT', 'Lithuania',        'Lietuva',          'EUR', '€',   'km',    '+370', 'lt',    false, 'fcm',    'C', false, true),
('HR', 'Croatia',          'Hrvatska',         'EUR', '€',   'km',    '+385', 'hr',    false, 'fcm',    'C', false, true),
('RO', 'Romania',          'România',          'RON', 'lei', 'km',    '+40',  'ro',    false, 'fcm',    'C', false, true),
('BG', 'Bulgaria',         'България',         'BGN', 'лв',  'km',    '+359', 'bg',    false, 'fcm',    'C', false, true),
('GR', 'Greece',           'Ελλάδα',           'EUR', '€',   'km',    '+30',  'el',    false, 'fcm',    'C', false, true),
('TR', 'Turkey',           'Türkiye',          'TRY', '₺',   'km',    '+90',  'tr',    false, 'fcm',    'C', false, true),
('KW', 'Kuwait',           'الكويت',           'KWD', 'K.D.','km',    '+965', 'ar',    true,  'fcm',    'C', false, true),
('OM', 'Oman',             'عُمان',            'OMR', 'ر.ع.','km',    '+968', 'ar',    true,  'fcm',    'C', false, true),
('BH', 'Bahrain',          'البحرين',          'BHD', 'BD',  'km',    '+973', 'ar',    true,  'fcm',    'C', false, true),
('SG', 'Singapore',        'Singapore',        'SGD', 'S$',  'km',    '+65',  'en-SG', false, 'fcm',    'C', false, true),
('MY', 'Malaysia',         'Malaysia',         'MYR', 'RM',  'km',    '+60',  'ms',    false, 'fcm',    'C', false, true),
('JP', 'Japan',            '日本',             'JPY', '¥',   'km',    '+81',  'ja',    false, 'fcm',    'C', false, true),
('KR', 'South Korea',      '대한민국',         'KRW', '₩',   'km',    '+82',  'ko',    false, 'fcm',    'C', false, true),
('CL', 'Chile',            'Chile',            'CLP', '$',   'km',    '+56',  'es-CL', false, 'fcm',    'C', false, true),
('AR', 'Argentina',        'Argentina',        'ARS', '$',   'km',    '+54',  'es-AR', false, 'fcm',    'C', false, true),
('CO', 'Colombia',         'Colombia',         'COP', '$',   'km',    '+57',  'es-CO', false, 'fcm',    'C', false, true),
('PE', 'Peru',             'Perú',             'PEN', 'S/',  'km',    '+51',  'es-PE', false, 'fcm',    'C', false, true),
('VN', 'Vietnam',          'Việt Nam',         'VND', '₫',   'km',    '+84',  'vi',    false, 'fcm',    'C', false, true),
('PH', 'Philippines',      'Pilipinas',        'PHP', '₱',   'km',    '+63',  'en-PH', false, 'fcm',    'C', false, true),
('UY', 'Uruguay',          'Uruguay',          'UYU', '$',   'km',    '+598', 'es-UY', false, 'fcm',    'D', false, true),
('PA', 'Panama',           'Panamá',           'USD', '$',   'km',    '+507', 'es-PA', false, 'fcm',    'D', false, true),
('CR', 'Costa Rica',       'Costa Rica',       'CRC', '₡',   'km',    '+506', 'es-CR', false, 'fcm',    'D', false, true)
;

-- 4. OPERATORS (Core Unified Structure)
create table operators (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  state char(2),
  source text,
  raw_payload jsonb,

  -- GLOBAL FIELDS --
  country_code char(2) not null default 'US' references hc_countries(code),
  region text,
  region_code text,
  locale text default 'en',
  timezone text default 'America/Chicago',
  distance_unit text default 'miles' check (distance_unit in ('miles','km')),
  currency text default 'USD',
  permit_countries text[] default '{}',
  language_primary text default 'en',
  languages_spoken text[] default '{}',

  -- scoring --
  confidence_score float default 0.5,
  completeness_score float default 0.0,
  priority_rank float default 0.5,
  rank_score float default 0.5,

  -- tier --
  tier text default 'standard' check (tier in ('platinum','gold','standard','probation')),

  -- subscription --
  subscription_tier text default 'road_ready' check (subscription_tier in ('road_ready','fast_lane')),
  subscription_active boolean default false,

  -- claim --
  is_claimed boolean default false,
  claimed_by_user_id uuid,
  claimed_at timestamp,

  -- job stats
  jobs_completed int default 0,
  jobs_accepted int default 0,
  jobs_declined int default 0,
  jobs_cancelled int default 0,
  avg_response_minutes float,

  -- flags --
  flags text[] default '{}',
  needs_review boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. OPERATOR SUB-ENTITIES
create table operator_phones (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  phone text unique not null,
  is_primary boolean default false,
  line_type text,
  carrier text,
  is_mobile boolean,
  area_code_state char(2),
  state_mismatch boolean default false,
  created_at timestamptz default now()
);

create table operator_capabilities (
  id uuid primary key default gen_random_uuid(),
  operator_id uuid references operators(id) on delete cascade,
  capability text not null check (capability in ('lead','chase','height_pole','route_survey','twic', 'adr', 'cpc', 'pov')),
  unique(operator_id, capability)
);

-- 6. BROKERS
create table brokers (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  company_name text,
  email text,
  estimated_monthly_volume int,
  is_captured boolean default false,
  subscription_tier text default 'none',
  created_at timestamptz default now()
);

-- 7. COVERAGE NODES
create table coverage_nodes (
  id uuid primary key default gen_random_uuid(),
  state char(2) not null,
  capability text not null,
  operator_count int default 0,
  density_score float default 0.0,
  country_code char(2) default 'US',
  region_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(state, capability, country_code)
);

-- 8. CORRIDORS (Unified Global)
create table corridors (
  id uuid primary key default gen_random_uuid(),
  origin_state char(2),
  destination_state char(2),
  demand_score float default 0.0,
  supply_score float default 0.0,
  dominance_score float default 0.0,
  job_count_30d int default 0,
  fill_rate_30d float,
  avg_price_30d float,
  revenue_30d float,
  expansion_triggered boolean default false,
  
  -- GLOBAL Support
  origin_country char(2) default 'US',
  destination_country char(2) default 'US',
  crosses_border boolean default false,
  border_crossing_points text[],
  permit_complexity text default 'low' check (permit_complexity in ('low','medium','high','extreme')),
  tier char(1) default 'A' check (tier in ('A','B','C','D')),

  updated_at timestamptz default now()
);

-- 9. ROUTE EDGES AND INFRASTRUCTURE
create table routing_edges (
  id uuid primary key default gen_random_uuid(),
  from_node uuid references coverage_nodes(id),
  to_node uuid references coverage_nodes(id),
  weight float default 1.0,
  travel_time_estimate_hours float,
  distance_miles float,
  priority_score float
);

create table infrastructure_nodes (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('yard','hotel','escort_meetup','fuel','repair','rest_area')),
  name text,
  state char(2),
  location jsonb,
  verified boolean default false,
  usage_score float default 0.0
);


-- 10. JOBS TABLE
create table jobs (
  id uuid primary key default gen_random_uuid(),
  origin_state char(2),
  origin_country char(2) default 'US',
  destination_state char(2),
  destination_country char(2) default 'US',
  distance_miles float,
  required_capabilities text[],
  urgency text default 'standard' check (urgency in ('standard','urgent','emergency')),
  assigned_operator_id uuid references operators(id),
  broker_id uuid references brokers(id),
  broker_price float,
  operator_payout float,
  platform_margin float,
  status text default 'open' check (status in ('open','matched','accepted','active','completed','cancelled','unfilled')),
  coverage_risk text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 11. CAPABILITY TRANSLATIONS
create table capability_translations (
  capability text not null,
  country_code char(2),
  locale text not null,
  display_name text not null,
  abbreviation text,
  primary key (capability, locale)
);

insert into capability_translations (capability, locale, display_name, abbreviation) values
  ('lead',          'en', 'Lead vehicle',          'Lead'),
  ('lead',          'es', 'Vehículo guía',          'Guía'),
  ('lead',          'fr', 'Véhicule de tête',       'Tête'),
  ('lead',          'de', 'Führungsfahrzeug',        'FF'),
  ('lead',          'pt', 'Veículo líder',           'Líder'),
  ('chase',         'en', 'Chase vehicle',          'Chase'),
  ('chase',         'es', 'Vehículo de seguimiento', 'Seg.'),
  ('chase',         'fr', 'Véhicule de queue',       'Queue'),
  ('chase',         'de', 'Begleitfahrzeug',         'BF'),
  ('height_pole',   'en', 'Height pole',             'HP'),
  ('height_pole',   'es', 'Poste de altura',         'PA'),
  ('height_pole',   'fr', 'Gabarit de hauteur',      'GH'),
  ('height_pole',   'de', 'Höhenmessgerät',          'HM'),
  ('height_pole',   'au', 'Height stick',            'HS'),  
  ('route_survey',  'en', 'Route survey',            'RS'),
  ('route_survey',  'es', 'Reconocimiento de ruta',  'RR'),
  ('route_survey',  'fr', 'Inspection de route',     'IR'),
  ('route_survey',  'de', 'Streckenkundung',         'SK'),
  ('twic',          'en', 'TWIC card',               'TWIC'),  
  ('twic',          'gb', 'Port access permit',      'PAP'),
  ('twic',          'au', 'Maritime Security ID',    'MSIC'),
  ('adr',           'de', 'ADR certification',       'ADR'),   
  ('cpc',           'gb', 'CPC qualification',       'CPC'),   
  ('pov',           'au', 'Pilot/Escort vehicle',    'POV');

-- 12. COUNTRY RATES
create table country_rate_config (
  country_code char(2) primary key references hc_countries(code),
  base_rate_per_km float not null,
  platform_margin_pct float default 0.28,
  fast_lane_margin_pct float default 0.22,
  min_job_price float,
  currency text not null,
  notes text
);

insert into country_rate_config (country_code, base_rate_per_km, min_job_price, currency, notes) values
('US', 1.80,  250,  'USD', 'Miles internally converted. $2.90/mile = $1.80/km'),
('CA', 2.10,  280,  'CAD', 'Higher due to sparse coverage areas'),
('AU', 2.40,  300,  'AUD', 'Outback premium baked in'),
('GB', 2.80,  200,  'GBP', 'Chapter 8 compliance adds cost'),
('NZ', 2.50,  250,  'NZD', 'Island geography, limited operators'),
('ZA', 8.50,  800,  'ZAR', 'Local rate — roughly $0.46 USD/km'),
('DE', 2.60,  180,  'EUR', 'BASt permit costs reflected'),
('NL', 2.70,  160,  'EUR', 'Dense network, short corridors'),
('AE', 7.00,  500,  'AED', 'Megaproject premium'),
('BR', 10.00, 800,  'BRL', 'Local rate — roughly $1.90 USD/km');

-- 13. LAUNCH STATUS
create table country_launch_status (
  country_code char(2) primary key references hc_countries(code),
  tier char(1),
  target_launch_date date,
  operator_count_current int default 0,
  operator_count_target int,
  corridors_configured boolean default false,
  push_provider_tested boolean default false,
  capability_translations_done boolean default false,
  regulatory_notes_done boolean default false,
  currency_config_done boolean default false,
  rate_config_done boolean default false,
  ready_to_launch boolean generated always as (
    operator_count_current >= operator_count_target
    and corridors_configured
    and push_provider_tested
    and capability_translations_done
    and regulatory_notes_done
    and currency_config_done
    and rate_config_done
  ) stored
);

-- 14. MATCHING FUNCTION
-- (Rebuilding without random() explicitly as requested)
create or replace function match_operators_global(
  p_job_id uuid,
  p_limit int default 20
)
returns table(
  operator_id uuid,
  score float,
  capability_match float,
  state_proximity float,
  operator_rank float,
  coverage_density float,
  response_history float,
  completeness float
) as $$
declare
  v_job jobs%rowtype;
  v_origin_country char(2);
  v_origin_state char(2);
begin
  select * into v_job from jobs where id = p_job_id;
  
  begin
      v_origin_country := (v_job.origin_country);
  exception 
      when undefined_column then
          v_origin_country := 'US';
  end;

  v_origin_state := v_job.origin_state;

  return query
  select
    o.id,
    -- TOTAL SCORE (Deterministic)
    (
      cap_match.score         * 0.30 +
      prox.score              * 0.20 +
      o.rank_score            * 0.20 +
      coalesce(cn.density_score, 0.3) * 0.15 +
      hist.score              * 0.10 +
      o.completeness_score    * 0.05
    ) as score,
    cap_match.score,
    prox.score,
    o.rank_score,
    coalesce(cn.density_score, 0.3),
    hist.score,
    o.completeness_score

  from operators o

  join lateral (
    select
      case
        when v_job.required_capabilities is null or array_length(v_job.required_capabilities,1) = 0
          then 1.0
        when (
          select count(*) from operator_capabilities oc
          where oc.operator_id = o.id
          and oc.capability = any(v_job.required_capabilities)
        ) = array_length(v_job.required_capabilities,1)
          then 1.0
        when (
          select count(*) from operator_capabilities oc
          where oc.operator_id = o.id
          and oc.capability = any(v_job.required_capabilities)
        ) > 0
          then 0.5
        else 0.0
      end as score
  ) cap_match on true

  join lateral (
    select
      case
        when o.state = v_origin_state then 1.0
        when o.state in (
          select adj from (values
            ('TX','OK'),('TX','NM'),('TX','AR'),('TX','LA'),
            ('CA','NV'),('CA','OR'),('CA','AZ'),
            ('FL','GA'),('FL','AL'),
            ('CO','WY'),('CO','UT'),('CO','NM'),('CO','KS'),
            ('MT','WY'),('MT','ID'),('MT','ND'),('MT','SD')
          ) as t(st, adj)
          where st = v_origin_state
        ) then 0.70
        else 0.30
      end as score
  ) prox on true

  join lateral (
    select
      case
        when o.jobs_completed = 0 then 0.5
        else least(1.0, (o.jobs_accepted::float / nullif(o.jobs_completed + o.jobs_declined, 0)))
      end as score
  ) hist on true

  left join coverage_nodes cn on cn.state = o.state
    and cn.capability = (v_job.required_capabilities[1])

  where o.needs_review = false
  and cap_match.score > 0    

  order by score desc
  limit p_limit;
end;
$$ language plpgsql stable;

-- 15. INDEXES
create index if not exists idx_operators_loc on operators(country_code, region_code);
create index if not exists idx_operators_tier on operators(tier);
create index if not exists idx_corridors_loc on corridors(origin_country, destination_country);
