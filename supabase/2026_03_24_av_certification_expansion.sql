-- ============================================================================
-- AV CERTIFICATION SYSTEM + EXPANDED LOAD TYPES + OILFIELD MODULE
-- Migration: 2026_03_24_av_certification_expansion.sql
-- Anti-downgrade: additive only — no destructive changes
-- Extends: escort_directory_schema, antigravity_schema
-- ============================================================================

-- ============================================================================
-- 1. AV CERTIFICATION TIERS (extends operator_certifications)
-- ============================================================================

-- Add AV certification types to existing certification_types table
INSERT INTO certification_types (name, issuer, region_scope) VALUES
('HC Certified Escort', 'Haul Command', 'global'),
('HC AV-Ready Certified', 'Haul Command', 'global'),
('HC Elite Certified', 'Haul Command', 'global'),
('HC Oilfield Specialist', 'Haul Command', 'global'),
('HC Superload Specialist', 'Haul Command', 'global'),
('HC International Ops', 'Haul Command', 'global')
ON CONFLICT DO NOTHING;

-- AV certification tiers table (canonical, not redundant with operator_certifications)
CREATE TABLE IF NOT EXISTS av_certification_tiers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier             INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 3),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  tagline          TEXT,
  badge_label      TEXT NOT NULL,
  badge_color      TEXT DEFAULT 'silver',   -- silver | gold | platinum
  price_annual     NUMERIC(10,2) DEFAULT 0,
  price_renewal    NUMERIC(10,2) DEFAULT 0,
  price_standalone NUMERIC(10,2) DEFAULT 0,
  requirements     JSONB DEFAULT '[]',
  benefits         JSONB DEFAULT '[]',
  modules_required INTEGER[] DEFAULT '{}',  -- module numbers required
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO av_certification_tiers (tier, name, slug, tagline, badge_label, badge_color, price_annual, price_renewal, price_standalone, modules_required) VALUES
(1, 'HC Certified', 'hc-certified',
 'The foundation. Meets all baseline standards.',
 'SILVER', 'silver', 0, 0, 49,
 ARRAY[1,2,3]),
(2, 'HC AV-Ready', 'av-ready',
 'Trained to operate alongside autonomous freight systems.',
 'GOLD · AV-READY', 'gold', 149, 99, 0,
 ARRAY[1,2,3,4,5,6]),
(3, 'HC Elite', 'elite',
 'The highest standard in global heavy haul escort.',
 'PLATINUM · ELITE', 'platinum', 299, 199, 0,
 ARRAY[1,2,3,4,5,6,7])
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. TRAINING MODULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_modules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_number    INTEGER NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  duration_minutes INTEGER NOT NULL,
  tier_required    INTEGER NOT NULL CHECK (tier_required BETWEEN 1 AND 3),
  description      TEXT,
  content_outline  JSONB DEFAULT '[]',
  pass_score       INTEGER DEFAULT 80,  -- percentage
  question_count   INTEGER DEFAULT 20,
  price_standalone NUMERIC(10,2) DEFAULT 29,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO training_modules (module_number, title, slug, duration_minutes, tier_required, description, pass_score, question_count) VALUES
(1, 'Platform Fundamentals', 'platform-fundamentals', 30, 1,
 'How Haul Command works, escrow payment, profile optimization, communication protocols.', 80, 20),
(2, 'Global Regulations Overview', 'global-regulations', 60, 1,
 'Escort requirements across 57 countries — thresholds, permit types, curfews, cross-border.', 80, 20),
(3, 'Load Type Mastery', 'load-type-mastery', 60, 1,
 'Every load type: wind, oilfield, mining, construction, aerospace, military, manufactured homes.', 80, 25),
(4, 'AV Proximity Protocols', 'av-proximity-protocols', 90, 2,
 'How AVs differ from humans, LiDAR blind zones, company-specific protocols, 5 country modules.', 85, 30),
(5, 'Oilfield Specialist', 'oilfield-specialist', 75, 2,
 'TxDMV Subchapter D, international oilfield (Aramco, ADNOC, Pilbara), all oilfield load types.', 85, 25),
(6, 'Superloads & Extreme Moves', 'superloads-extreme', 60, 2,
 'Route surveys, police coordination, bridge engineering, NASA/SpaceX, DOD protocols.', 85, 20),
(7, 'International Operations', 'international-operations', 45, 3,
 'US-Mexico/Canada border handoffs, EU cross-border (ESTA), GCC protocols, AU state variations.', 85, 15)
ON CONFLICT (module_number) DO NOTHING;

-- ============================================================================
-- 3. OPERATOR TRAINING PROGRESS + CERTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS operator_training_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  module_id     UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'enrolled' 
                CHECK (status IN ('enrolled', 'in_progress', 'passed', 'failed', 'expired')),
  score         NUMERIC(5,2),
  attempts      INTEGER DEFAULT 0,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  stripe_payment_id TEXT,
  UNIQUE(operator_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_operator ON operator_training_enrollments(operator_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status  ON operator_training_enrollments(status);

-- AV Certification awards (canonical record of what tier an operator holds)
CREATE TABLE IF NOT EXISTS operator_av_certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES escort_operators(id) ON DELETE CASCADE,
  tier_id       UUID NOT NULL REFERENCES av_certification_tiers(id),
  tier          INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  renewal_at    TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  certificate_url TEXT,
  UNIQUE(operator_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_av_certs_operator ON operator_av_certifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_av_certs_tier     ON operator_av_certifications(tier);
CREATE INDEX IF NOT EXISTS idx_av_certs_status   ON operator_av_certifications(status);

-- Corporate training cohorts
CREATE TABLE IF NOT EXISTS corporate_training_cohorts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  TEXT NOT NULL,
  contact_name  TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  operator_count INTEGER,
  tier_requested INTEGER,
  budget_range  TEXT,
  notes         TEXT,
  status        TEXT DEFAULT 'inquiry'
                CHECK (status IN ('inquiry', 'proposal_sent', 'signed', 'in_progress', 'completed')),
  price_agreed  NUMERIC(10,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. EXPANDED LOAD TYPE TAXONOMY
-- ============================================================================

-- Drop and recreate as a proper taxonomy (additive — new table)
CREATE TABLE IF NOT EXISTS load_type_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  icon        TEXT,   -- emoji or icon slug
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO load_type_categories (code, name, icon, description, sort_order) VALUES
('wind_energy',      'Wind Energy',                  '💨', 'Wind turbine blades, towers, nacelles, transformers, cable reels', 10),
('solar_energy',     'Solar Energy',                 '☀️', 'Inverter stations, transformer packages, solar modules, tracking systems', 20),
('oilfield',         'Oilfield & Gas',               '🛢️', 'Drilling rigs, fracking equipment, mud systems, pressure vessels, pipe racks', 30),
('nuclear_power',    'Nuclear & Power Generation',   '⚡', 'Steam generators, reactor vessels, HV transformers, turbine components', 40),
('offshore',         'Offshore & Marine Energy',     '🌊', 'Platform modules, subsea equipment, mooring systems, topsides', 50),
('mining',           'Mining Equipment',             '⛏️', 'Haul trucks, excavators, draglines, crushers, SAG mills, conveyors', 60),
('construction',     'Construction & Civil',         '🏗️', 'Tower cranes, mobile cranes, TBMs, bridge beams, data center modules', 70),
('military',         'Military & Defense',           '🎖️', 'Armored vehicles, artillery, aircraft components, radar arrays', 80),
('aerospace',        'Aerospace & Space',            '🚀', 'Rocket stages, aircraft fuselages, wings, spacecraft modules', 90),
('agricultural',     'Agricultural Equipment',       '🌾', 'Combines, planters, sprayers, irrigation pivots, grain equipment', 100),
('manufactured_home','Manufactured Homes & Modular', '🏠', 'Single/double/triple-wide manufactured homes, modular buildings, park models', 110),
('storage_sheds',    'Storage Buildings & Sheds',    '🏚️', 'Large sheds, portable garages, barns, tiny homes, carports', 120),
('industrial',       'Industrial Manufacturing',     '🏭', 'Presses, boilers, heat exchangers, reactors, distillation columns', 130),
('ports_maritime',   'Port & Maritime',              '⚓', 'Ship-to-shore cranes, container equipment, propellers, yacht transport', 140),
('rail_transit',     'Rail & Transit',               '🚂', 'Locomotives, railcars, LRVs, metro cars, high-speed train sections', 150),
('telecom_utilities','Telecom & Utilities',          '📡', 'Transmission towers, substations, cable reels, pipeline sections', 160),
('medical',          'Medical & Specialized',        '🏥', 'MRI machines, CT scanners, linear accelerators, hyperbaric chambers', 170),
('entertainment',    'Entertainment & Events',       '🎪', 'Concert stages, LED displays, carnival rides, theme park components', 180),
('bridge_infra',     'Bridge & Infrastructure',      '🌉', 'Precast beams, bridge sections, tunnel segments, precast elements', 190),
('general_oversize', 'General Oversize',             '📦', 'General heavy haul and wide load not fitting other categories', 200)
ON CONFLICT (code) DO NOTHING;

-- Load subtypes (the individual items within each category)
CREATE TABLE IF NOT EXISTS load_subtypes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES load_type_categories(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  typical_width_ft  NUMERIC(8,2),
  typical_height_ft NUMERIC(8,2),
  typical_length_ft NUMERIC(8,2),
  typical_weight_lb NUMERIC(12,2),
  escort_complexity TEXT DEFAULT 'standard'
                    CHECK (escort_complexity IN ('low', 'standard', 'high', 'extreme')),
  requires_police_common   BOOLEAN DEFAULT FALSE,
  requires_route_survey    BOOLEAN DEFAULT FALSE,
  countries_primary TEXT[] DEFAULT '{}',
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Oilfield subtypes (high priority per prompt)
INSERT INTO load_subtypes (category_id, code, name, escort_complexity, requires_route_survey, countries_primary) VALUES
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'rig_complete',       'Complete Drilling Rig',            'extreme', true,  ARRAY['US','CA','SA','AE','NO','GB','BR','MX']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'rig_mast',           'Rig Mast Section',                 'high',    true,  ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'rig_substructure',   'Rig Substructure',                 'high',    false, ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'drawworks',          'Drawworks',                        'standard',false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'mud_pump',           'Mud Pump (Triplex)',                'standard',false, ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'mud_system',         'Complete Mud System',              'high',    false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'bop_stack',          'Blowout Preventer (BOP)',           'high',    false, ARRAY['US','CA','NO','GB']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'tubular_rack',       'Casing/Drill Pipe (Tubular Rack)', 'standard',false, ARRAY['US','CA','SA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'drill_collars',      'Drill Collars (Pipe Box)',          'standard',false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'fracking_blender',   'Fracking Blender',                 'high',    false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'fracking_pump',      'Fracking Pump Unit (Tier 4)',       'high',    false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'coil_tubing',        'Coil Tubing Unit',                 'standard',false, ARRAY['US','CA','SA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'workover_rig',       'Workover Rig',                     'high',    false, ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'pressure_vessel',    'Pressure Vessel / Separator',      'high',    true,  ARRAY['US','CA','SA','AE','NO','GB']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'tank_battery',       'Tank Battery',                     'standard',false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'compressor_package', 'Compressor Package (Large)',        'high',    false, ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'gas_processing_skid','Gas Processing Skid',              'high',    false, ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'flare_stack',        'Flare Stack',                      'extreme', true,  ARRAY['US','CA','SA','AE']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'water_transfer',     'Water Transfer System',            'standard',false, ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'oilfield'), 'produced_water_tank','Produced Water Tank',              'standard',false, ARRAY['US','CA'])
ON CONFLICT (code) DO NOTHING;

-- Wind energy subtypes
INSERT INTO load_subtypes (category_id, code, name, escort_complexity, typical_length_ft, countries_primary) VALUES
((SELECT id FROM load_type_categories WHERE code = 'wind_energy'), 'wind_blade_std',    'Wind Turbine Blade (Standard, up to 200ft)',  'extreme', 200, ARRAY['US','DE','NL','SE','NO','DK','AU','BR','IN']),
((SELECT id FROM load_type_categories WHERE code = 'wind_energy'), 'wind_blade_ext',    'Wind Turbine Blade (Extended, 250ft+)',        'extreme', 275, ARRAY['US','DE','NL','SE','NO']),
((SELECT id FROM load_type_categories WHERE code = 'wind_energy'), 'wind_tower',        'Wind Turbine Tower Section',                  'high',    120, ARRAY['US','DE','NL','SE','AU']),
((SELECT id FROM load_type_categories WHERE code = 'wind_energy'), 'nacelle',           'Nacelle',                                     'high',     60, ARRAY['US','DE','NL','SE','AU']),
((SELECT id FROM load_type_categories WHERE code = 'wind_energy'), 'hub_assembly',      'Hub Assembly',                                'high',     30, ARRAY['US','DE','NL','SE']),
((SELECT id FROM load_type_categories WHERE code = 'wind_energy'), 'wind_transformer',  'Transformer (Wind Farm)',                     'extreme', 80,  ARRAY['US','DE','AU','GB'])
ON CONFLICT (code) DO NOTHING;

-- Manufactured homes subtypes
INSERT INTO load_subtypes (category_id, code, name, escort_complexity, typical_width_ft, countries_primary) VALUES
((SELECT id FROM load_type_categories WHERE code = 'manufactured_home'), 'mfg_single',    'Single-Section Manufactured Home',      'standard', 16,  ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'manufactured_home'), 'mfg_double',    'Double-Wide Manufactured Home',         'high',     28,  ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'manufactured_home'), 'mfg_triple',    'Triple-Wide Manufactured Home',         'high',     42,  ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'manufactured_home'), 'modular_home',  'Modular Home (Factory-Built)',           'high',     32,  ARRAY['US','CA','AU','GB']),
((SELECT id FROM load_type_categories WHERE code = 'manufactured_home'), 'park_model',    'Park Model Home',                       'standard', 14,  ARRAY['US','CA']),
((SELECT id FROM load_type_categories WHERE code = 'manufactured_home'), 'modular_commercial', 'Modular Commercial Building',       'high',     36,  ARRAY['US','CA','AU'])
ON CONFLICT (code) DO NOTHING;

-- Aerospace subtypes
INSERT INTO load_subtypes (category_id, code, name, escort_complexity, requires_route_survey, countries_primary) VALUES
((SELECT id FROM load_type_categories WHERE code = 'aerospace'), 'rocket_stage',      'Rocket Stage (SpaceX, ULA, Ariane)', 'extreme', true, ARRAY['US','FR','DE','AU']),
((SELECT id FROM load_type_categories WHERE code = 'aerospace'), 'aircraft_fuselage', 'Aircraft Fuselage',                  'extreme', true, ARRAY['US','DE','FR','GB']),
((SELECT id FROM load_type_categories WHERE code = 'aerospace'), 'aircraft_wing',     'Aircraft Wing Section',              'extreme', true, ARRAY['US','DE','FR','GB']),
((SELECT id FROM load_type_categories WHERE code = 'aerospace'), 'satellite',         'Satellite / Spacecraft Module',      'extreme', true, ARRAY['US','FR','DE'])
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 5. OILFIELD CORRIDORS (extends existing corridors data)
-- ============================================================================

-- Assumes corridors table exists from route intelligence schema
-- If not, create a lightweight version here
CREATE TABLE IF NOT EXISTS oilfield_corridors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  country     TEXT DEFAULT 'US',
  region      TEXT,
  description TEXT,
  key_cities  TEXT[],
  highways    TEXT[],
  basin_name  TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO oilfield_corridors (code, name, country, region, basin_name, key_cities, highways) VALUES
('permian',    'Permian Basin',                   'US', 'Texas-New Mexico', 'Permian Basin',
 ARRAY['Midland','Odessa','Pecos','Andrews','Ward County'], ARRAY['US-287','FM-1788','I-20','TX-349']),
('eagle_ford', 'Eagle Ford Shale',                'US', 'South Texas',      'Eagle Ford',
 ARRAY['Laredo','Corpus Christi','San Antonio','Cotulla'], ARRAY['I-35','US-59','TX-16']),
('bakken',     'Bakken Formation',                'US', 'North Dakota',     'Williston Basin',
 ARRAY['Williston','Minot','Bismarck'], ARRAY['US-2','US-85','ND-8']),
('marcellus',  'Marcellus / Utica',               'US', 'Pennsylvania-WV',  'Appalachian',
 ARRAY['Pittsburgh','Morgantown','Columbus','Canton'], ARRAY['I-79','I-77','US-19']),
('dj_basin',   'DJ Basin',                        'US', 'Colorado',         'Denver-Julesburg',
 ARRAY['Greeley','Denver','Cheyenne','Fort Collins'], ARRAY['I-25','CO-257','US-85']),
('gulf_coast', 'Gulf Coast Petrochemical',        'US', 'Texas-Louisiana',  'Gulf Coast',
 ARRAY['Port Arthur','Beaumont','Houston','Freeport'], ARRAY['I-10','TX-87','US-90']),
('haynesville','Haynesville Shale',               'US', 'Texas-Louisiana',  'Haynesville',
 ARRAY['Shreveport','Marshall TX','Longview'], ARRAY['I-20','US-79','US-80']),
('anadarko',   'Anadarko Basin',                  'US', 'Oklahoma-Kansas',  'Anadarko',
 ARRAY['Oklahoma City','Woodward','Amarillo TX'], ARRAY['I-40','US-270','OK-3']),
('oilsands',   'Alberta Oil Sands',               'CA', 'Alberta',          'Athabasca',
 ARRAY['Fort McMurray','Edmonton','Lac La Biche'], ARRAY['AB-63','AB-881']),
('ghawar',     'Saudi Ghawar Field Routes',       'SA', 'Eastern Province',  'Ghawar',
 ARRAY['Dhahran','Dammam','Riyadh','Abqaiq'], ARRAY['Route 40','Route 65']),
('pilbara',    'Pilbara Mining Corridor',         'AU', 'Western Australia', 'Pilbara Iron',
 ARRAY['Port Hedland','Karratha','Newman','Tom Price'], ARRAY['Great Northern Hwy','Marble Bar Rd']),
('north_sea_uk','North Sea UK Shore Routes',      'GB', 'Scotland-England',  'North Sea',
 ARRAY['Aberdeen','Dundee','Peterhead'], ARRAY['A90','A96'])
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 6. AV COMPANIES REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS av_companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  country_code    TEXT NOT NULL,
  headquarters    TEXT,
  operational_status TEXT DEFAULT 'active'
                  CHECK (operational_status IN ('active', 'testing', 'planned', 'suspended')),
  corridors       TEXT[],  -- corridor codes or free text
  truck_classes   TEXT[],
  key_routes      TEXT[],
  emergency_contact TEXT,
  regulatory_body TEXT,
  notes           TEXT,
  website         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO av_companies (name, country_code, headquarters, operational_status, corridors, key_routes, notes) VALUES
('Aurora Innovation',    'US', 'Pittsburgh, PA', 'active',  ARRAY['permian','gulf_coast'], ARRAY['I-45 Dallas-Houston','I-10 Houston-El Paso','I-35'], 'Peterbilt 579 + Kenworth T680 with Aurora Driver. 200ft following minimum.'),
('Kodiak Robotics',      'US', 'Mountain View, CA', 'active', ARRAY['permian'], ARRAY['US-287 Texas-Oklahoma','FM roads Permian Basin'], 'Oilfield-specific FM road operations. Kodiak remote monitoring center.'),
('Waabi',                'US', 'Toronto, CA', 'active', ARRAY[],  ARRAY['Texas highways'], 'Texas + Canadian highway testing. Scaling 2026-2027.'),
('Waymo',                'US', 'Mountain View, CA', 'active', ARRAY[], ARRAY['Austin TX','Phoenix AZ','San Francisco CA'], 'Robotaxi + freight. Urban escort considerations differ from highway.'),
('Torc Robotics',        'US', 'Blacksburg, VA', 'active', ARRAY[], ARRAY['I-81 Virginia','Texas corridors'], 'Daimler Truck partnership.'),
('Gatik',                'US', 'Palo Alto, CA', 'active', ARRAY[], ARRAY['Texas B2B routes','Ontario Canada'], 'Short-haul B2B. Walmart and Loblaws routes in Canada.'),
('Plus.ai',              'US', 'Cupertino, CA', 'active', ARRAY[], ARRAY['I-75 California','Texas'], 'SAE L4 autonomous trucking.'),
('Bot Auto',             'US', 'Austin, TX', 'active', ARRAY[], ARRAY['Texas'], 'Fully driverless Class 8 trucks.'),
('Einride',              'SE', 'Stockholm, Sweden', 'active', ARRAY[], ARRAY['Sweden','Germany','Norway','US'], 'Autonomous electric freight. No cab — pure AV truck.'),
('Wayve',                'GB', 'London, UK', 'testing', ARRAY[], ARRAY['M1 London-Leeds','M6 corridor'], 'Raising $1B+ for global L4. Nissan partnership.'),
('WeRide',               'AE', 'Abu Dhabi, UAE', 'active', ARRAY[], ARRAY['Dubai Marina-Downtown','Abu Dhabi city'], '50 robotaxis commercial since Dec 2024.'),
('Rio Tinto AutoHaul',   'AU', 'Perth, WA', 'active', ARRAY['pilbara'], ARRAY['Pilbara haul roads WA'], 'World''s first fully autonomous long-haul heavy haul rail + road.'),
('Fortescue',            'AU', 'Perth, WA', 'active', ARRAY['pilbara'], ARRAY['Pilbara iron ore haul roads'], 'Autonomous haul trucks at Pilbara iron ore mines.'),
('BHP',                  'AU', 'Melbourne, VIC', 'active', ARRAY['pilbara'], ARRAY['Olympic Dam','Pilbara operations'], 'Autonomous trucks at multiple Australian mine sites.'),
('Pony.ai',              'AE', 'Guangzhou, China', 'active', ARRAY[], ARRAY['Dubai RTA routes'], 'Dubai RTA partnership — driverless robotaxi by 2026.'),
('Baidu Apollo',         'CN', 'Beijing, China', 'active', ARRAY[], ARRAY['Beijing','Shanghai','Wuhan','Chongqing'], 'Largest robotaxi fleet globally. China-only currently.'),
('May Mobility',         'US', 'Ann Arbor, MI', 'active', ARRAY[], ARRAY['Houston TX','Detroit MI','Tokyo','Brisbane AU'], 'Public transit pilots globally.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. ENHANCED OPERATOR SPECIALIZATIONS (extends capability_flags)
-- ============================================================================

ALTER TABLE capability_flags 
  ADD COLUMN IF NOT EXISTS av_ready_certified     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS av_cert_tier           INTEGER,
  ADD COLUMN IF NOT EXISTS oilfield_specialist    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS superload_specialist   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS international_ops      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mining_specialist      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS aerospace_specialist   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS military_cleared       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manufactured_home_exp  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS oilfield_corridors     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS av_corridors           TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cert_updated_at        TIMESTAMPTZ;

-- ============================================================================
-- 8. AV REGULATIONS TABLE (powers /regulations/autonomous-vehicles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS av_regulations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    TEXT NOT NULL,
  region_code     TEXT,  -- state/province/emirate
  regulation_name TEXT NOT NULL,
  effective_date  DATE,
  summary         TEXT,
  escort_required BOOLEAN DEFAULT TRUE,
  escort_notes    TEXT,
  regulatory_body TEXT,
  key_provisions  JSONB DEFAULT '[]',
  source_url      TEXT,
  maturity_level  TEXT DEFAULT 'emerging'
                  CHECK (maturity_level IN ('no_law', 'emerging', 'framework', 'mature', 'advanced')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO av_regulations (country_code, regulation_name, effective_date, escort_required, escort_notes, regulatory_body, maturity_level, key_provisions) VALUES
('US', 'Texas SB 2807 — Commercial AV Authorization', '2025-09-01', true,
 'All commercial AV ops require TxDMV authorization by May 28 2026. Oversize AV loads still require human escort vehicles.',
 'TxDMV + FMCSA + NHTSA', 'mature',
 '["TxDMV authorization required for all commercial AV ops","May 28 2026 authorization deadline","Oversize loads still require human escort","Escort operator must maintain 200ft minimum following distance from AV truck"]'),
('GB', 'Automated Vehicles Act 2024', '2024-04-01', true,
 'World''s first comprehensive AV legal framework. Escort vehicle requirements maintained for oversize freight. STGO rules apply.',
 'DVSA + Department for Transport', 'advanced',
 '["World''s first comprehensive AV legal framework","STGO categories 1/2/3 still apply to AV freight","Escort operators must be trained in AV emergency procedures","ZENZIC CAM Corridor designated test routes have specific protocols"]'),
('DE', 'German Level 4 AV Law (AFGBV)', '2021-07-01', true,
 'World''s first national L4 autonomous vehicle law. A9 autobahn designated AV test corridor. Schwertransport rules apply to AV freight.',
 'Kraftfahrt-Bundesamt (KBA) + BMVI', 'advanced',
 '["World''s first national L4 AV law","A9 Digital Motorway Test Bed is primary AV corridor","Begleitfahrzeuge (escort vehicles) required for overwidth AV freight","KBA authorization required for AV operations"]'),
('AU', 'NTC Automated Vehicle Safety Law', '2023-01-01', true,
 'National Transport Commission guidelines. Pilbara mining autonomous trucks most advanced deployment globally. State-specific variations apply.',
 'NTC + state RMS', 'mature',
 '["NTC guidelines cover automated vehicles nationally","State RMS authority for escort requirements","Pilbara mine site access has specific autonomous truck protocols","Escort required for equipment transport TO mine sites"]'),
('AE', 'UAE Dubai Autonomous Transportation Strategy 2030', '2017-01-01', false,
 'Target: 25% of all trips autonomous by 2030. RTA developing escort framework. Currently limited escort requirements for AV oversize freight.',
 'UAE Roads and Transport Authority (RTA)', 'framework',
 '["Dubai 2030 strategy targets 25% autonomous trips","WeRide operating 50+ robotaxis commercially since Dec 2024","Pony.ai driverless robotaxi launching 2026","Escort requirements still evolving for AV freight"]'),
('SG', 'LTA Singapore AV Framework', '2019-01-01', false,
 'Land Transport Authority framework. WeRide founder on Singapore AV steering committee. Robobus operational on Sentosa.',
 'Land Transport Authority (LTA)', 'framework',
 '["LTA sandbox program for AV testing","WeRide robobus operational on Sentosa island","Robosweepers operational city-wide","Escort requirements minimal — rework expected 2026"]'),
('CA', 'Canada Motor Vehicle Safety Act + Provincial Acts', '2020-01-01', true,
 'Federal + provincial framework. Alberta Oil Sands autonomous mining trucks expanding. Gatik operating commercially in Ontario.',
 'Transport Canada + provincial ministries', 'mature',
 '["Federal framework + provincial variations","Alberta: autonomous mining trucks at oil sands haul roads","Ontario: Gatik commercial B2B operations (Walmart, Loblaws)","Escort requirements maintained for oversize autonomous freight"]')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. ENHANCED LOADS TABLE (adds oilfield + expanded fields)
-- ============================================================================

-- Add new columns to loads table if it exists
DO $$
BEGIN
  -- load_category (links to load_type_categories)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loads' AND column_name='load_category') THEN
    ALTER TABLE loads ADD COLUMN load_category TEXT;
  END IF;
  -- load_subtype (links to load_subtypes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loads' AND column_name='load_subtype') THEN
    ALTER TABLE loads ADD COLUMN load_subtype TEXT;
  END IF;
  -- well_pad_coords (oilfield: destination often has no address)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loads' AND column_name='well_pad_lat') THEN
    ALTER TABLE loads ADD COLUMN well_pad_lat NUMERIC(10,7);
    ALTER TABLE loads ADD COLUMN well_pad_lng NUMERIC(10,7);
  END IF;
  -- oilfield-specific fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='loads' AND column_name='lease_road_condition') THEN
    ALTER TABLE loads ADD COLUMN lease_road_condition TEXT 
      CHECK (lease_road_condition IN ('paved','caliche','dirt','unknown'));
    ALTER TABLE loads ADD COLUMN county_sheriff_required BOOLEAN DEFAULT FALSE;
    ALTER TABLE loads ADD COLUMN night_move_approved BOOLEAN;
    ALTER TABLE loads ADD COLUMN route_survey_required BOOLEAN DEFAULT FALSE;
    ALTER TABLE loads ADD COLUMN txdmv_permit_number TEXT;
    ALTER TABLE loads ADD COLUMN is_subchapter_d_oilfield BOOLEAN DEFAULT FALSE;
    ALTER TABLE loads ADD COLUMN is_superload BOOLEAN DEFAULT FALSE;
    ALTER TABLE loads ADD COLUMN av_corridor TEXT;  -- ties to oilfield/AV corridors
    ALTER TABLE loads ADD COLUMN country TEXT DEFAULT 'US';
  END IF;
END $$;

-- ============================================================================
-- 10. ROUTE INTEL / USER-GENERATED CONTENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS corridor_operator_intel (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corridor_code TEXT,
  operator_id   UUID REFERENCES escort_operators(id) ON DELETE SET NULL,
  route_from    TEXT,
  route_to      TEXT,
  hazard_notes  TEXT,
  traffic_notes TEXT,
  bridge_notes  TEXT,
  construction_notes TEXT,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  job_id        UUID,  -- optional link to completed job
  upvotes       INTEGER DEFAULT 0,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corridor_intel_corridor ON corridor_operator_intel(corridor_code);
CREATE INDEX IF NOT EXISTS idx_corridor_intel_operator ON corridor_operator_intel(operator_id);
CREATE INDEX IF NOT EXISTS idx_corridor_intel_ts       ON corridor_operator_intel(timestamp DESC);

-- ============================================================================
-- INDEXES + RLS
-- ============================================================================

-- Training
ALTER TABLE IF EXISTS operator_training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS operator_av_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS av_certification_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS training_modules ENABLE ROW LEVEL SECURITY;

-- Public read for tiers and modules
CREATE POLICY IF NOT EXISTS "av_tiers_public_read" ON av_certification_tiers FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "training_modules_public_read" ON training_modules FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "load_categories_public_read" ON load_type_categories FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "av_companies_public_read" ON av_companies FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "av_regulations_public_read" ON av_regulations FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "oilfield_corridors_public_read" ON oilfield_corridors FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "corridor_intel_public_read" ON corridor_operator_intel FOR SELECT USING (TRUE);

-- Operators own their certifications
CREATE POLICY IF NOT EXISTS "av_certs_operator_own" ON operator_av_certifications 
  FOR ALL TO authenticated USING (
    operator_id IN (SELECT id FROM escort_operators WHERE user_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "training_enrollments_operator_own" ON operator_training_enrollments 
  FOR ALL TO authenticated USING (
    operator_id IN (SELECT id FROM escort_operators WHERE user_id = auth.uid())
  );

-- Service role
CREATE POLICY IF NOT EXISTS "av_certs_service_role" ON operator_av_certifications
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "training_enrollments_service_role" ON operator_training_enrollments
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "corporate_cohorts_service_role" ON corporate_training_cohorts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY IF NOT EXISTS "corridor_intel_service_role" ON corridor_operator_intel
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- END MIGRATION
-- ============================================================================
