-- Global SEO Domination & Pain Point Elimination Sprint
-- Tracks 1-6: Company listings, permit marketplace, emergency dispatch, QuickPay, availability calendar

------------------------------------------------------------
-- TRACK 1: Company Listings (unclaimed company claim pages)
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  company_name text NOT NULL,
  company_type text NOT NULL CHECK (company_type IN ('autonomous','broker','fleet','wind_energy','mining','heavy_haul','logistics')),
  country_code text NOT NULL DEFAULT 'US',
  countries_operating text[] DEFAULT '{}',
  website text,
  description text,
  logo_url text,
  estimated_annual_escorts int DEFAULT 0,
  primary_corridors text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed','claimed','verified')),
  claimed_by uuid REFERENCES auth.users(id),
  claimed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view companies" ON company_listings FOR SELECT USING (true);
CREATE POLICY "Claimed owners manage their page" ON company_listings FOR UPDATE USING (auth.uid() = claimed_by);

CREATE INDEX IF NOT EXISTS idx_company_slug ON company_listings(slug);
CREATE INDEX IF NOT EXISTS idx_company_type ON company_listings(company_type);
CREATE INDEX IF NOT EXISTS idx_company_country ON company_listings(country_code);

-- Seed 30 companies across autonomous, heavy haul, and wind energy
INSERT INTO company_listings (slug, company_name, company_type, country_code, countries_operating, website, description, estimated_annual_escorts, primary_corridors) VALUES
  ('aurora-innovation','Aurora Innovation','autonomous','US','{US}','https://aurora.tech','Commercial autonomous trucking on I-45 Texas corridor. First to launch driverless freight.',4200,'{I-45 Dallas-Houston,I-10 Texas,I-20 Fort Worth-Midland}'),
  ('waymo-via','Waymo Via','autonomous','US','{US}','https://waymo.com','Alphabet subsidiary operating autonomous Class 8 trucks across the American Southwest.',3800,'{I-10 Phoenix-LA,I-40 Southwest,I-15 California}'),
  ('kodiak-robotics','Kodiak Robotics','autonomous','US','{US}','https://kodiak.ai','Autonomous trucking focused on long-haul freight lanes in Texas and the southern US.',2900,'{I-10 Texas,I-35 Texas,I-20 Texas}'),
  ('plus-ai','Plus.ai','autonomous','US','{US,CN}','https://plus.ai','AI-powered autonomous driving for heavy trucks. Operations in US and China.',1800,'{I-10 Southwest,I-5 California}'),
  ('gatik','Gatik','autonomous','US','{US,CA}','https://gatik.ai','Middle-mile autonomous delivery for B2B supply chains.',1200,'{I-30 Arkansas,US-71 Arkansas,TX Urban}'),
  ('einride','Einride','autonomous','SE','{SE,US,DE}','https://einride.tech','Swedish autonomous electric freight. Pod-based transport across Europe and US.',950,'{E4 Sweden,A7 Germany,I-75 US}'),
  ('volvo-autonomous','Volvo Autonomous Solutions','autonomous','SE','{SE,US,AU}','https://www.volvoautonomoussolutions.com','Autonomous transport solutions for logistics, mining, and ports.',2100,'{E6 Sweden,I-10 US,AU Mining Corridors}'),
  ('daimler-autonomous','Daimler Truck Autonomous','autonomous','DE','{DE,US}','https://daimlertruck.com','Autonomous driving division of Daimler Truck, operating Freightliner Cascadia AVs.',3200,'{I-45 Texas,A5 Germany,I-10 US}'),
  ('torc-robotics','Torc Robotics','autonomous','US','{US}','https://torc.ai','Daimler subsidiary focused on hub-to-hub autonomous trucking.',2400,'{I-45 Texas,I-81 Virginia,I-40 Southwest}'),
  ('locomation','Locomation','autonomous','US','{US}','https://locomation.ai','Autonomous relay convoy technology for long-haul trucking.',800,'{I-80 Midwest,I-76 Pennsylvania}'),
  ('mammoet','Mammoet','heavy_haul','NL','{NL,US,AE,SG,AU,BR,SA}','https://mammoet.com','World leader in heavy lifting and transport. Operates across 60+ countries.',8500,'{A2 Netherlands,I-10 US Gulf,Trans-Siberian}'),
  ('sarens','Sarens','heavy_haul','BE','{BE,US,AE,AU,IN,SA}','https://sarens.com','Global heavy lift and engineered transport solutions.',6200,'{E40 Belgium,I-10 US,Abu Dhabi Corridors}'),
  ('ale-heavylift','ALE Heavylift','heavy_haul','GB','{GB,AE,US,AU,NL}','https://www.ale-heavylift.com','Specialist heavy transport and lifting services worldwide.',4800,'{M1 UK,A1 Netherlands,I-10 US}'),
  ('fagioli','Fagioli','heavy_haul','IT','{IT,AE,US,SA}','https://fagioli.com','Italian heavy transport and installation company operating globally.',3100,'{A1 Italy,I-10 US Gulf,Saudi Corridors}'),
  ('barnhart','Barnhart Crane & Rigging','heavy_haul','US','{US}','https://barnhartcrane.com','US heavy haul and rigging across energy, industrial, and infrastructure sectors.',5400,'{I-10 Gulf Coast,I-40 Southeast,I-20 Texas}'),
  ('landstar','Landstar System','broker','US','{US,CA,MX}','https://landstar.com','Major freight broker with heavy/specialized divisions.',7200,'{I-10 National,I-40 National,I-95 East Coast}'),
  ('daseke','Daseke Inc','fleet','US','{US,CA}','https://daseke.com','Largest flatbed and specialized carrier in North America.',6800,'{I-35 Central,I-10 Southern,I-20 Texas}'),
  ('vestas','Vestas Wind Systems','wind_energy','DK','{DK,US,DE,AU,BR,IN,GB}','https://vestas.com','World largest wind turbine manufacturer. Massive blade transport requirements.',9200,'{I-35 Wind Belt,I-40 Oklahoma,E45 Denmark}'),
  ('ge-vernova','GE Vernova','wind_energy','US','{US,BR,IN,AU}','https://gevernova.com','GE wind energy division. Turbine blade and nacelle transport across continents.',7800,'{I-35 Great Plains,I-40 Wind Belt,BR-101 Brazil}'),
  ('siemens-gamesa','Siemens Gamesa','wind_energy','ES','{ES,US,DE,GB,DK,IN}','https://siemensgamesa.com','Major wind turbine manufacturer requiring oversize transport globally.',6500,'{A-7 Spain,I-35 US,A7 Germany}'),
  ('nordex','Nordex Group','wind_energy','DE','{DE,ES,FR,US,BR}','https://nordex-online.com','German wind turbine manufacturer with global transport needs.',4100,'{A7 Germany,A-7 Spain,I-35 US}'),
  ('enercon','Enercon','wind_energy','DE','{DE,NL,CA,BR,AU}','https://enercon.de','German wind energy company with gearless turbine technology.',3600,'{A1 Germany,Trans-Canada,BR-116 Brazil}'),
  ('deep-south-crane','Deep South Crane & Rigging','heavy_haul','US','{US}','https://deepsouthcrane.com','Gulf Coast heavy haul and crane services for energy and petrochemical.',2800,'{I-10 Gulf Coast,I-49 Louisiana,I-20 Louisiana}'),
  ('omega-morgan','Omega Morgan','heavy_haul','US','{US,CA}','https://omegamorgan.com','Pacific Northwest specialized transport and rigging.',2200,'{I-5 Pacific NW,I-84 Oregon,I-90 Washington}'),
  ('keen-transport','Keen Transport','heavy_haul','US','{US}','https://keentransport.com','Nationwide heavy haul and oversized freight transport.',3400,'{I-10 National,I-40 Midwest,I-70 Central}'),
  ('nussbaum-transportation','Nussbaum Transportation','fleet','US','{US}','https://nfrp.com','Major trucking fleet with oversize/overweight divisions.',2600,'{I-55 Midwest,I-57 Illinois,I-74 Central}'),
  ('buchanan-hauling','Buchanan Hauling & Rigging','heavy_haul','US','{US}','https://buchananhr.com','Specialized heavy haul for transformers, turbines, and industrial equipment.',3000,'{I-65 Southeast,I-75 Southeast,I-10 Gulf}'),
  ('goldhofer','Goldhofer','heavy_haul','DE','{DE,US,AE,AU}','https://goldhofer.com','German manufacturer of heavy-duty transport vehicles and trailers.',1500,'{A8 Germany,I-10 US,UAE Corridors}'),
  ('max-bogl','Max Bögl','heavy_haul','DE','{DE,AT}','https://max-boegl.de','German construction and transport group handling wind tower logistics.',1800,'{A9 Germany,A1 Austria}'),
  ('cts-nordics','CTS Nordics','heavy_haul','SE','{SE,NO,FI,DK}','https://ctsnordics.com','Scandinavian heavy transport and crane services.',2400,'{E4 Sweden,E6 Norway,E18 Finland}')
ON CONFLICT (slug) DO NOTHING;

------------------------------------------------------------
-- TRACK 3: Permit Agent Marketplace
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permit_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  states_covered text[] DEFAULT '{}',
  countries_covered text[] DEFAULT '{US}',
  avg_turnaround_hours int DEFAULT 48,
  rate_per_permit numeric(10,2) DEFAULT 150.00,
  completed_permits_count int DEFAULT 0,
  rating numeric(3,2) DEFAULT 0.00,
  verified boolean DEFAULT false,
  bio text,
  subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active','inactive','trial')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permit_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view agents" ON permit_agents FOR SELECT USING (true);
CREATE POLICY "Agents manage own profile" ON permit_agents FOR ALL USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS permit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_state text NOT NULL,
  destination_states text[] NOT NULL,
  load_dimensions jsonb NOT NULL DEFAULT '{}',
  needed_by_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
  assigned_agent_id uuid REFERENCES permit_agents(id),
  total_fee numeric(10,2),
  platform_fee numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Requesters see own requests" ON permit_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = (SELECT profile_id FROM permit_agents WHERE id = assigned_agent_id));
CREATE POLICY "Authenticated users create requests" ON permit_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Requesters update own" ON permit_requests FOR UPDATE USING (auth.uid() = requester_id);

------------------------------------------------------------
-- TRACK 4: Emergency Replacement Dispatch
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_replacements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id uuid NOT NULL,
  breakdown_operator_id uuid REFERENCES auth.users(id),
  replacement_operator_id uuid REFERENCES auth.users(id),
  breakdown_lat numeric(10,6),
  breakdown_lng numeric(10,6),
  miles_completed numeric(10,2) DEFAULT 0,
  miles_remaining numeric(10,2) DEFAULT 0,
  original_rate numeric(10,2),
  premium_rate numeric(10,2),
  partial_payment numeric(10,2),
  status text DEFAULT 'searching' CHECK (status IN ('searching','notified','accepted','en_route','completed','expired')),
  notified_operators uuid[] DEFAULT '{}',
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_replacements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Involved parties can view" ON emergency_replacements FOR SELECT USING (
  auth.uid() = breakdown_operator_id OR auth.uid() = replacement_operator_id OR
  auth.uid() = ANY(notified_operators)
);

------------------------------------------------------------
-- TRACK 5: QuickPay Invoice Factoring
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quickpay_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  operator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_amount numeric(10,2) NOT NULL,
  advance_amount numeric(10,2) NOT NULL,
  fee_amount numeric(10,2) NOT NULL,
  fee_percentage numeric(5,2) DEFAULT 3.00,
  escrow_status text CHECK (escrow_status IN ('funded','released','collected')),
  advance_status text DEFAULT 'pending' CHECK (advance_status IN ('pending','advanced','collected','failed')),
  stripe_transfer_id text,
  advanced_at timestamptz,
  collected_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quickpay_advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Operators see own advances" ON quickpay_advances FOR SELECT USING (auth.uid() = operator_id);

------------------------------------------------------------
-- TRACK 6: Availability Calendar
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operator_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  available_date date NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available','unavailable','booked','tentative')),
  job_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(operator_id, available_date)
);

ALTER TABLE operator_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone sees availability" ON operator_availability FOR SELECT USING (true);
CREATE POLICY "Operators manage own" ON operator_availability FOR ALL USING (auth.uid() = operator_id);

CREATE INDEX IF NOT EXISTS idx_avail_operator_date ON operator_availability(operator_id, available_date);
CREATE INDEX IF NOT EXISTS idx_avail_date_status ON operator_availability(available_date, status);
