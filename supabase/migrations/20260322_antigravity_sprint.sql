-- ============================================================
-- ANTI-GRAVITY SPRINT — ALL 6 TRACKS DATABASE MIGRATION
-- Generated: 2026-03-21
-- ============================================================

-- ============================================================
-- TRACK 1: Company Listings (Autonomous + Enterprise Claim Pages)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  company_type TEXT NOT NULL CHECK (company_type IN ('autonomous', 'broker', 'fleet', 'wind_energy', 'mining', 'heavy_haul')),
  country_code TEXT NOT NULL DEFAULT 'US',
  countries_operating TEXT[] DEFAULT '{}',
  website TEXT,
  description TEXT,
  logo_url TEXT,
  hq_city TEXT,
  hq_country TEXT,
  estimated_annual_escorts INTEGER DEFAULT 0,
  related_corridors TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'verified')),
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_listings_slug ON company_listings(slug);
CREATE INDEX idx_company_listings_type ON company_listings(company_type);
CREATE INDEX idx_company_listings_country ON company_listings(country_code);
CREATE INDEX idx_company_listings_status ON company_listings(status);

ALTER TABLE company_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_listings_public_read" ON company_listings FOR SELECT USING (true);
CREATE POLICY "company_listings_auth_claim" ON company_listings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- TRACK 3: Permit Professional Marketplace
-- ============================================================
CREATE TABLE IF NOT EXISTS permit_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  bio TEXT,
  states_covered TEXT[] DEFAULT '{}',
  countries_covered TEXT[] DEFAULT '{}',
  avg_turnaround_hours INTEGER DEFAULT 48,
  rate_per_permit NUMERIC(10,2) DEFAULT 0,
  completed_permits_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  subscription_active BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permit_agents_profile ON permit_agents(profile_id);
CREATE INDEX idx_permit_agents_states ON permit_agents USING GIN(states_covered);
CREATE INDEX idx_permit_agents_verified ON permit_agents(verified);

CREATE TABLE IF NOT EXISTS permit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  origin_state TEXT NOT NULL,
  destination_states TEXT[] NOT NULL DEFAULT '{}',
  load_dimensions JSONB DEFAULT '{}'::jsonb,
  needed_by_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_agent_id UUID REFERENCES permit_agents(id),
  total_fee NUMERIC(10,2) DEFAULT 0,
  platform_fee NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permit_requests_requester ON permit_requests(requester_id);
CREATE INDEX idx_permit_requests_status ON permit_requests(status);
CREATE INDEX idx_permit_requests_agent ON permit_requests(assigned_agent_id);

CREATE TABLE IF NOT EXISTS permit_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id UUID NOT NULL REFERENCES permit_requests(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID NOT NULL REFERENCES permit_agents(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE permit_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permit_agents_public_read" ON permit_agents FOR SELECT USING (true);
CREATE POLICY "permit_agents_own_write" ON permit_agents FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "permit_requests_own_read" ON permit_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() IN (SELECT profile_id FROM permit_agents WHERE id = assigned_agent_id));
CREATE POLICY "permit_requests_auth_insert" ON permit_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "permit_reviews_public_read" ON permit_reviews FOR SELECT USING (true);
CREATE POLICY "permit_reviews_auth_insert" ON permit_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- TRACK 4: Emergency Replacement Dispatch
-- ============================================================
CREATE TABLE IF NOT EXISTS breakdown_replacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id UUID NOT NULL,
  original_operator_id UUID NOT NULL REFERENCES auth.users(id),
  breakdown_location JSONB DEFAULT '{}'::jsonb,
  breakdown_lat NUMERIC(10,7),
  breakdown_lng NUMERIC(10,7),
  corridor TEXT,
  miles_completed NUMERIC(10,2) DEFAULT 0,
  miles_remaining NUMERIC(10,2) DEFAULT 0,
  original_rate NUMERIC(10,2) DEFAULT 0,
  premium_rate NUMERIC(10,2) DEFAULT 0,
  replacement_operator_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'notified', 'accepted', 'en_route', 'completed', 'expired')),
  notified_operators UUID[] DEFAULT '{}',
  accepted_at TIMESTAMPTZ,
  broker_notified BOOLEAN DEFAULT false,
  replacement_eta_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_breakdown_status ON breakdown_replacements(status);
CREATE INDEX idx_breakdown_location ON breakdown_replacements(breakdown_lat, breakdown_lng);

ALTER TABLE breakdown_replacements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breakdown_auth_read" ON breakdown_replacements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "breakdown_auth_insert" ON breakdown_replacements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "breakdown_auth_update" ON breakdown_replacements FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================
-- TRACK 5: QuickPay Invoice Factoring
-- ============================================================
CREATE TABLE IF NOT EXISTS quickpay_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  broker_id UUID,
  invoice_amount NUMERIC(10,2) NOT NULL,
  advance_amount NUMERIC(10,2) NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL,
  fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  escrow_id TEXT,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'advanced', 'collected', 'failed')),
  advanced_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quickpay_operator ON quickpay_advances(operator_id);
CREATE INDEX idx_quickpay_status ON quickpay_advances(status);
CREATE INDEX idx_quickpay_job ON quickpay_advances(job_id);

ALTER TABLE quickpay_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quickpay_own_read" ON quickpay_advances FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "quickpay_auth_insert" ON quickpay_advances FOR INSERT WITH CHECK (auth.uid() = operator_id);

-- ============================================================
-- TRACK 6: Availability Calendar
-- ============================================================
CREATE TABLE IF NOT EXISTS operator_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'booked')),
  job_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(operator_id, date)
);

CREATE INDEX idx_availability_operator_date ON operator_availability(operator_id, date);
CREATE INDEX idx_availability_status ON operator_availability(status);
CREATE INDEX idx_availability_date_status ON operator_availability(date, status);

ALTER TABLE operator_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "availability_public_read" ON operator_availability FOR SELECT USING (true);
CREATE POLICY "availability_own_write" ON operator_availability FOR ALL USING (auth.uid() = operator_id);

-- ============================================================
-- SEED DATA: Track 1 — Company Listings (50 companies)
-- ============================================================
INSERT INTO company_listings (company_name, slug, company_type, country_code, countries_operating, website, description, hq_city, hq_country, estimated_annual_escorts, related_corridors) VALUES
-- Autonomous
('Aurora Innovation', 'aurora-innovation', 'autonomous', 'US', '{US}', 'https://aurora.tech', 'Self-driving technology company developing the Aurora Driver for trucks and ride-hailing.', 'Pittsburgh', 'US', 2400, '{I-45 TX,I-20 TX,I-10 TX}'),
('Waymo Via', 'waymo-via', 'autonomous', 'US', '{US}', 'https://waymo.com', 'Alphabet subsidiary operating autonomous trucks on US highways.', 'Mountain View', 'US', 3200, '{I-10 AZ,I-40 NM,I-10 TX}'),
('Kodiak Robotics', 'kodiak-robotics', 'autonomous', 'US', '{US}', 'https://kodiak.ai', 'Autonomous trucking company operating daily routes between Dallas and Houston.', 'Mountain View', 'US', 1800, '{I-45 TX,I-35 TX,I-10 TX}'),
('Plus.ai', 'plus-ai', 'autonomous', 'US', '{US,CN}', 'https://plus.ai', 'Autonomous driving technology for long-haul trucks with PlusDrive system.', 'Cupertino', 'US', 1200, '{I-80 CA,I-5 CA,I-10 CA}'),
('Gatik', 'gatik', 'autonomous', 'US', '{US,CA}', 'https://gatik.ai', 'B2B short-haul autonomous delivery for major retailers.', 'Mountain View', 'US', 800, '{I-5 CA,AR corridors}'),
('Einride', 'einride', 'autonomous', 'SE', '{SE,US,DE,GB}', 'https://einride.tech', 'Swedish electric and autonomous freight technology company.', 'Stockholm', 'SE', 1500, '{E4 SE,I-95 US,A2 DE}'),
('Volvo Autonomous Solutions', 'volvo-autonomous-solutions', 'autonomous', 'SE', '{SE,US,AU,NO}', 'https://www.volvoautonomoussolutions.com', 'Autonomous transport solutions for logistics, mining, and ports.', 'Gothenburg', 'SE', 2000, '{E6 SE,I-70 US,Pacific Highway AU}'),
('Daimler Truck Autonomous', 'daimler-truck-autonomous', 'autonomous', 'DE', '{DE,US}', 'https://daimlertruck.com', 'Daimler Truck autonomous driving division developing SAE Level 4 trucks.', 'Stuttgart', 'DE', 2800, '{A5 DE,I-45 TX,I-10 TX}'),
('Torc Robotics', 'torc-robotics', 'autonomous', 'US', '{US}', 'https://torc.ai', 'Daimler Truck subsidiary developing Level 4 self-driving trucks.', 'Blacksburg', 'US', 1600, '{I-45 TX,I-35 TX,I-10 TX}'),
('Locomation', 'locomation', 'autonomous', 'US', '{US}', 'https://locomation.ai', 'Autonomous relay convoy trucking technology company.', 'Pittsburgh', 'US', 900, '{I-76 PA,I-80 OH,I-70 IN}'),
-- Heavy Haul Global
('Mammoet', 'mammoet', 'heavy_haul', 'NL', '{NL,US,AU,AE,SA,BR,DE,GB,CA,MX}', 'https://mammoet.com', 'World''s largest heavy lifting and transport company. Operates globally with specialized cranes and transport vehicles.', 'Schiedam', 'NL', 8500, '{A15 NL,I-10 US,Pacific Highway AU}'),
('Sarens', 'sarens', 'heavy_haul', 'BE', '{BE,US,AU,AE,SA,NL,DE,FR,GB,IN}', 'https://sarens.com', 'Global leader in crane rental, heavy lifting, and engineered transport solutions.', 'Wolvertem', 'BE', 6200, '{E40 BE,I-10 US,A1 DE}'),
('ALE Heavylift', 'ale-heavylift', 'heavy_haul', 'GB', '{GB,US,AU,AE,SA,NL,DE}', 'https://ale-heavylift.com', 'World leader in heavy lifting and transport, now part of Mammoet.', 'Stafford', 'GB', 4800, '{M6 GB,A1 GB,I-10 US}'),
('Fagioli', 'fagioli', 'heavy_haul', 'IT', '{IT,FR,DE,AE,SA,US}', 'https://fagioli.com', 'Italian company specializing in heavy transport, lifting, and marine operations.', 'Sant''Ilario d''Enza', 'IT', 3100, '{A1 IT,A4 IT,A8 FR}'),
('Barnhart Crane & Rigging', 'barnhart-crane-rigging', 'heavy_haul', 'US', '{US}', 'https://barnhartcrane.com', 'Largest privately held US crane and rigging company with nationwide heavy haul capabilities.', 'Memphis', 'US', 5400, '{I-40 TN,I-10 TX,I-20 GA}'),
('Landstar System', 'landstar-system', 'heavy_haul', 'US', '{US,CA,MX}', 'https://landstar.com', 'Transportation management company with over 11,000 independent agents.', 'Jacksonville', 'US', 12000, '{I-10 FL,I-95 FL,I-75 GA,I-40 TN}'),
('Daseke Inc', 'daseke-inc', 'heavy_haul', 'US', '{US,CA}', 'https://daseke.com', 'Largest flatbed, specialized transportation, and logistics company in North America.', 'Addison', 'US', 9800, '{I-35 TX,I-45 TX,I-20 TX,I-10 TX}'),
('Omega Morgan', 'omega-morgan', 'heavy_haul', 'US', '{US}', 'https://omegamorgan.com', 'Heavy equipment moving and industrial services company in the Pacific Northwest.', 'Portland', 'US', 2200, '{I-5 OR,I-5 WA,I-84 OR}'),
('Berger Transfer & Storage', 'berger-transfer-storage', 'heavy_haul', 'US', '{US}', 'https://bergertransfer.com', 'Specialized heavy haul carrier for transformers, turbines and oversize loads.', 'St. Paul', 'US', 1800, '{I-94 MN,I-35 MN,I-90 WI}'),
('Buckingham Trucking', 'buckingham-trucking', 'heavy_haul', 'US', '{US}', 'https://buckinghamtrucking.com', 'Specialized carrier for defense, aerospace, and energy sector heavy haul.', 'Burlington', 'US', 1500, '{I-85 NC,I-40 NC,I-95 VA}'),
-- Wind Energy
('Vestas', 'vestas', 'wind_energy', 'DK', '{DK,US,AU,DE,GB,ES,BR,IN,MX,SE}', 'https://vestas.com', 'World''s largest manufacturer of wind turbines. Requires extensive blade and tower transport.', 'Aarhus', 'DK', 15000, '{I-35 TX,I-40 OK,I-70 KS,A7 DE}'),
('GE Vernova', 'ge-vernova', 'wind_energy', 'US', '{US,CA,BR,AU,GB,FR,DE,IN}', 'https://gevernova.com', 'GE''s energy division manufacturing wind turbines requiring specialized oversized blade transport.', 'Cambridge', 'US', 12000, '{I-35 TX,I-70 CO,I-80 IA,I-90 SD}'),
('Siemens Gamesa', 'siemens-gamesa', 'wind_energy', 'ES', '{ES,US,GB,DE,DK,AU,BR,IN,MX}', 'https://siemensgamesa.com', 'Leading wind turbine manufacturer with global operations requiring heavy haul escort services.', 'Zamudio', 'ES', 11000, '{I-35 TX,A1 ES,M62 GB,A7 DE}'),
('Nordex Group', 'nordex-group', 'wind_energy', 'DE', '{DE,ES,FR,US,BR,AU,SE,FI,TR}', 'https://nordex-online.com', 'German manufacturer of wind turbines for onshore and offshore markets.', 'Hamburg', 'DE', 5500, '{A1 DE,A7 DE,I-35 TX}'),
('Enercon', 'enercon', 'wind_energy', 'DE', '{DE,CA,BR,SE,FR,AT,NL,BE}', 'https://enercon.de', 'Germany''s largest wind turbine manufacturer with direct drive technology.', 'Aurich', 'DE', 4200, '{A1 DE,A28 DE,A31 DE}'),
('Goldwind', 'goldwind', 'wind_energy', 'CN', '{CN,AU,US,AR,CL,PK}', 'https://goldwind.com', 'China''s largest and world''s second largest wind turbine manufacturer.', 'Beijing', 'CN', 8000, '{G1 CN,Pacific Highway AU}'),
('Suzlon Energy', 'suzlon-energy', 'wind_energy', 'IN', '{IN,US,AU,BR}', 'https://suzlon.com', 'Indian multinational wind turbine supplier with global installations.', 'Pune', 'IN', 3500, '{NH48 IN,NH44 IN,I-35 TX}'),
-- Additional autonomous/fleet
('TuSimple', 'tusimple', 'autonomous', 'US', '{US,CN}', 'https://tusimple.com', 'Autonomous trucking technology company focused on hub-to-hub routes.', 'San Diego', 'US', 1400, '{I-10 AZ,I-10 TX,I-8 CA}'),
('Embark Trucks', 'embark-trucks', 'autonomous', 'US', '{US}', 'https://embarktrucks.com', 'Self-driving truck technology company partnering with major carriers.', 'San Francisco', 'US', 1100, '{I-10 TX,I-20 TX,I-5 CA}'),
('Nuro', 'nuro', 'autonomous', 'US', '{US}', 'https://nuro.ai', 'Autonomous delivery vehicle company operating in multiple US cities.', 'Mountain View', 'US', 600, '{TX corridors,CA corridors,AZ corridors}'),
-- Mining
('Caterpillar Autonomous', 'caterpillar-autonomous', 'mining', 'US', '{US,AU,CA,CL,PE,ZA,BR}', 'https://cat.com', 'CAT autonomous haul trucks operating in mines worldwide. Requires escort for repositioning.', 'Deerfield', 'US', 3200, '{Pacific Highway AU,I-80 NV}'),
('Komatsu Mining', 'komatsu-mining', 'mining', 'JP', '{JP,AU,US,CA,CL,PE,ZA}', 'https://komatsu.com', 'Autonomous mining haul trucks requiring escort services for transport between sites.', 'Tokyo', 'JP', 2800, '{Pacific Highway AU,I-80 NV}'),
('Rio Tinto AutoHaul', 'rio-tinto-autohaul', 'mining', 'AU', '{AU,US,CA,ZA}', 'https://riotinto.com', 'World''s first autonomous heavy-haul rail network. Requires road escort for equipment transport.', 'Melbourne', 'AU', 2100, '{Great Northern Highway AU,Stuart Highway AU}'),
('BHP Autonomous', 'bhp-autonomous', 'mining', 'AU', '{AU,CL,US,CA}', 'https://bhp.com', 'BHP operates one of the world''s largest autonomous truck fleets in Pilbara mines.', 'Melbourne', 'AU', 1900, '{Great Northern Highway AU,Stuart Highway AU}'),
-- Major brokers
('XPO Logistics', 'xpo-logistics', 'broker', 'US', '{US,GB,FR,ES,IT,DE,NL,BE}', 'https://xpo.com', 'Top-three global provider of transportation services for heavy and oversized freight.', 'Greenwich', 'US', 18000, '{I-95 US,I-10 TX,M1 GB,A1 FR}'),
('C.H. Robinson', 'ch-robinson', 'broker', 'US', '{US,CA,MX,EU}', 'https://chrobinson.com', 'One of the world''s largest logistics platforms with massive oversize/overweight division.', 'Eden Prairie', 'US', 14000, '{I-35 TX,I-90 MN,I-94 WI}'),
('Schneider National', 'schneider-national', 'broker', 'US', '{US,CA,MX}', 'https://schneider.com', 'Major carrier and logistics provider with specialized heavy haul and oversized freight.', 'Green Bay', 'US', 7500, '{I-41 WI,I-94 WI,I-80 IN}'),
('J.B. Hunt Transport', 'jb-hunt-transport', 'broker', 'US', '{US,CA,MX}', 'https://jbhunt.com', 'One of the largest transportation logistics companies in North America.', 'Lowell', 'US', 6200, '{I-40 AR,I-30 AR,I-49 AR}'),
('Werner Enterprises', 'werner-enterprises', 'broker', 'US', '{US,CA,MX}', 'https://werner.com', 'Major truckload carrier and logistics company with specialized oversized division.', 'Omaha', 'US', 4800, '{I-80 NE,I-35 TX,I-10 TX}'),
-- Additional companies for global coverage
('Laso Transportes', 'laso-transportes', 'heavy_haul', 'PT', '{PT,ES,FR}', 'https://lasotransportes.pt', 'Portugal''s leading heavy transport company for wind and energy sector.', 'Figueira da Foz', 'PT', 2100, '{A1 PT,A14 PT,AP-1 ES}'),
('Collett Transport', 'collett-transport', 'heavy_haul', 'GB', '{GB,IE,FR,BE,NL,DE}', 'https://collett.co.uk', 'UK heavy transport specialist for wind energy, oil and gas, and infrastructure.', 'Halifax', 'GB', 3400, '{M62 GB,A1 GB,M1 GB}'),
('Nooteboom Trailers', 'nooteboom-trailers', 'heavy_haul', 'NL', '{NL,DE,BE,FR,GB,SE,NO}', 'https://nooteboom.com', 'Dutch manufacturer and operator of specialized heavy transport trailers.', 'Wijchen', 'NL', 2600, '{A15 NL,A2 NL,A1 DE}'),
('Al Faris Group', 'al-faris-group', 'heavy_haul', 'AE', '{AE,SA,QA,KW,OM,BH}', 'https://alfaris.com', 'Middle East''s largest equipment rental and heavy transport company.', 'Dubai', 'AE', 4500, '{E11 AE,E311 AE,Route 40 SA}'),
('Toll Group', 'toll-group', 'heavy_haul', 'AU', '{AU,NZ,SG,JP}', 'https://tollgroup.com', 'Australia''s leading transport and logistics company with heavy haul division.', 'Melbourne', 'AU', 5800, '{Pacific Highway AU,Hume Highway AU,Stuart Highway AU}'),
('JSW Infrastructure', 'jsw-infrastructure', 'heavy_haul', 'IN', '{IN}', 'https://jsw.in', 'Major Indian infrastructure company requiring heavy transport escort services.', 'Mumbai', 'IN', 3700, '{NH48 IN,NH44 IN,NH4 IN}'),
('TFG Transfracht', 'tfg-transfracht', 'heavy_haul', 'DE', '{DE,AT,CH,NL,BE,IT}', 'https://transfracht.com', 'Deutsche Bahn subsidiary for intermodal and heavy transport logistics.', 'Frankfurt', 'DE', 2900, '{A5 DE,A3 DE,A1 DE}'),
('Maxim Crane Works', 'maxim-crane-works', 'heavy_haul', 'US', '{US}', 'https://maximcrane.com', 'Largest crane rental company in North America with heavy haul transport division.', 'Bridgeville', 'US', 4100, '{I-76 PA,I-80 OH,I-90 NY}'),
('Perkins Specialized', 'perkins-specialized', 'heavy_haul', 'US', '{US,CA}', 'https://perkins-specialized.com', 'Specialized carrier for transformers, wind components, and super loads.', 'North Ridgeville', 'US', 3300, '{I-80 OH,I-90 OH,I-71 OH}')
ON CONFLICT (slug) DO NOTHING;
