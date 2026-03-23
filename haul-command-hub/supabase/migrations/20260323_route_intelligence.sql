-- ═══════════════════════════════════════════════════════════════
-- HAUL COMMAND — GLOBAL ROUTE INTELLIGENCE SYSTEM
-- Sprint 1: Core tables
-- Sprint 2: All 57 countries seeded with routing maturity + sources
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. JURISDICTION ROUTING SOURCES ──────────────────────────
CREATE TABLE IF NOT EXISTS jurisdiction_routing_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  jurisdiction_code TEXT,
  jurisdiction_name TEXT NOT NULL,
  jurisdiction_name_local TEXT,
  permit_authority_name TEXT NOT NULL,
  permit_authority_url TEXT,
  permit_portal_url TEXT,
  routing_maturity TEXT NOT NULL CHECK (routing_maturity IN ('permit_exact','approved_network','planning_mode','rules_only')),
  source_name TEXT,
  source_url TEXT,
  source_type TEXT,
  access_method TEXT,
  supports_permit_exact BOOLEAN DEFAULT false,
  supports_approved_network BOOLEAN DEFAULT false,
  supports_bridge_clearances BOOLEAN DEFAULT false,
  supports_escort_rules BOOLEAN DEFAULT false,
  supports_seasonal_restrictions BOOLEAN DEFAULT false,
  supports_live_restrictions BOOLEAN DEFAULT false,
  supports_pilot_car_maps BOOLEAN DEFAULT false,
  is_authoritative BOOLEAN DEFAULT true,
  requires_login BOOLEAN DEFAULT false,
  has_public_api BOOLEAN DEFAULT false,
  has_gis_service BOOLEAN DEFAULT false,
  has_downloadable_data BOOLEAN DEFAULT false,
  confidence_class TEXT DEFAULT 'official' CHECK (confidence_class IN ('official','derived','community')),
  notes TEXT,
  anti_gravity_hunt_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jrs_country ON jurisdiction_routing_sources (country_code);
CREATE INDEX IF NOT EXISTS idx_jrs_maturity ON jurisdiction_routing_sources (routing_maturity);
CREATE INDEX IF NOT EXISTS idx_jrs_jurisdiction ON jurisdiction_routing_sources (jurisdiction_code);

-- ─── 2. JURISDICTION ROUTE RESTRICTIONS ──────────────────────
CREATE TABLE IF NOT EXISTS jurisdiction_route_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdiction_routing_sources(id) ON DELETE CASCADE,
  restriction_type TEXT,
  road_name TEXT,
  road_ref TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  route_geojson JSONB,
  value_metric DECIMAL,
  value_imperial TEXT,
  unit TEXT,
  effective_from DATE,
  effective_until DATE,
  is_permanent BOOLEAN DEFAULT true,
  source_type TEXT,
  source_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  confidence_class TEXT DEFAULT 'official',
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_jrr_jurisdiction ON jurisdiction_route_restrictions (jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_jrr_type ON jurisdiction_route_restrictions (restriction_type);
CREATE INDEX IF NOT EXISTS idx_jrr_geo ON jurisdiction_route_restrictions (lat, lng);

-- ─── 3. CLEARANCE POINTS (bridge/overhead) ───────────────────
CREATE TABLE IF NOT EXISTS clearance_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdiction_routing_sources(id) ON DELETE SET NULL,
  country_code TEXT NOT NULL,
  jurisdiction_code TEXT,
  road_name TEXT,
  road_ref TEXT,
  structure_name TEXT,
  structure_type TEXT DEFAULT 'bridge',
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  clearance_height_m DECIMAL(5,2),
  clearance_height_ft DECIMAL(5,1),
  clearance_width_m DECIMAL(5,2),
  clearance_width_ft DECIMAL(5,1),
  weight_limit_tonnes DECIMAL(8,2),
  weight_limit_lbs INTEGER,
  posted_date DATE,
  source_authority TEXT,
  source_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  confidence_class TEXT DEFAULT 'official',
  is_verified BOOLEAN DEFAULT false,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_cp_geo ON clearance_points (lat, lng);
CREATE INDEX IF NOT EXISTS idx_cp_country ON clearance_points (country_code);
CREATE INDEX IF NOT EXISTS idx_cp_clearance ON clearance_points (clearance_height_m);

-- ─── RLS ──────────────────────────────────────────────────────
ALTER TABLE jurisdiction_routing_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_route_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_points ENABLE ROW LEVEL SECURITY;

-- Public read for all (SEO + unauthenticated route-check tool)
CREATE POLICY "public_read_jrs" ON jurisdiction_routing_sources FOR SELECT USING (true);
CREATE POLICY "public_read_jrr" ON jurisdiction_route_restrictions FOR SELECT USING (true);
CREATE POLICY "public_read_cp" ON clearance_points FOR SELECT USING (true);
-- Service role full access
CREATE POLICY "svc_jrs" ON jurisdiction_routing_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "svc_jrr" ON jurisdiction_route_restrictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "svc_cp" ON clearance_points FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- SPRINT 2 — SEED ALL 57 COUNTRIES
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- TIER A — GOLD (10 countries)
-- ────────────────────────────────────────────────────────────

-- 🇺🇸 UNITED STATES — KEY STATES (top 15 heavy haul states)
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_url, source_type, access_method, supports_permit_exact, supports_approved_network, supports_bridge_clearances, supports_escort_rules, supports_seasonal_restrictions, supports_live_restrictions, supports_pilot_car_maps, has_public_api, has_gis_service, has_downloadable_data, notes, anti_gravity_hunt_terms) VALUES
('US','US-CA','California','Caltrans','https://dot.ca.gov','https://tms.caltrans.ca.gov','permit_exact','CalRoute','https://calroute.dot.ca.gov','official_gis_service','rest_query',true,true,true,true,true,false,true,false,true,true,'CalRoute provides exact permit routing + pilot car maps. CTPS portal for single-trip. Bridge clearance GIS available.','CalRoute Caltrans oversize permit routing pilot car maps California'),
('US','US-TX','Texas','TxDMV','https://www.txdmv.gov','https://txpros.txdmv.gov','approved_network','TxPROS','https://txpros.txdmv.gov','official_portal','portal_login',false,true,true,true,true,false,false,false,true,true,'TxDMV permit portal + TxDOT bridge database + 511TX live conditions. TxDOT open data portal.','TxDMV oversize permit Texas TxDOT bridge clearance 511TX'),
('US','US-FL','Florida','FDOT','https://www.fdot.gov','https://fdotxwp02.dot.state.fl.us/OVERPERMIT','approved_network','PAS/GIS','https://opendata.arcgis.com/datasets/fdot-bridges','official_gis_service','rest_query',false,true,true,true,true,true,false,true,true,true,'PAS/GIS self-issued permits. FDOT bridges ArcGIS. FL511 live feed. FDOT open geospatial hub.','FDOT oversize permit Florida bridges ArcGIS FL511'),
('US','US-OH','Ohio','ODOT','https://www.transportation.ohio.gov','https://www.ohgo.com','approved_network','OHGO','https://publicgis.transportation.ohio.gov','official_gis_service','rest_query',false,true,true,true,true,true,false,false,true,true,'ODOT GIS portal for bridge clearances. OHGO real-time traffic.','ODOT oversize Ohio permit bridge clearance'),
('US','US-PA','Pennsylvania','PennDOT','https://www.penndot.pa.gov','https://www.dot7.state.pa.us/LHSFR','planning_mode','PennDOT Permits','https://www.penndot.pa.gov/TravelInPA/Pages/Oversize-Overweight.aspx','official_portal','portal_login',false,false,true,true,true,false,false,false,true,false,'PennDOT permit system. Bridge clearance data available.','PennDOT oversize Pennsylvania permit bridge'),
('US','US-NY','New York','NYSDOT','https://www.dot.ny.gov','https://www.dot.ny.gov/divisions/operating/osss/permits','planning_mode','NYSDOT Permits','https://www.dot.ny.gov/divisions/operating/osss/permits','official_portal','portal_login',false,false,true,true,false,false,false,false,true,false,'NYSDOT permit portal for oversize/overweight loads.','NYSDOT oversize New York permit'),
('US','US-IL','Illinois','IDOT','https://idot.illinois.gov','https://trucking.illinoisaccess.com','planning_mode','IDOT Permits','https://idot.illinois.gov','official_portal','portal_login',false,false,true,true,true,false,false,false,false,false,'IDOT oversize permit portal.','IDOT Illinois oversize permit'),
('US','US-GA','Georgia','GDOT','https://www.dot.ga.gov','https://www.dot.ga.gov/InvestSmart/Permits','planning_mode','GDOT Permits','https://www.dot.ga.gov','official_portal','portal_login',false,false,false,true,false,false,false,false,false,false,'GDOT oversize/overweight permit system.','GDOT Georgia oversize permit'),
('US','US-LA','Louisiana','LaDOTD','https://wwwsp.dotd.la.gov','https://www.dotd.la.gov/Inside_LaDOTD/Divisions/Multimodal/Freight/Pages/Oversize_Overweight_Permits.aspx','planning_mode','LaDOTD Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,false,false,false,false,'LaDOTD permit portal — Permian Basin corridor activity.','LaDOTD Louisiana oversize permit'),
('US','US-ND','North Dakota','NDHP','https://www.nd.gov/ndhp','https://www.nd.gov/ndhp/motor-carrier/permits','permit_exact','E-Permits','https://apps.nd.gov/dot/epermit','official_portal','portal_login',true,true,false,true,true,true,false,false,false,false,'E-Permits system — real-time roadway restriction assessment, auto safe-route calculation.','NDHP North Dakota E-Permits oversize routing'),
('US','US-OK','Oklahoma','ODOT','https://oklahoma.gov/odot','https://oklahoma.gov/odot/doing-business/oversize-overweight-permits.html','planning_mode','ODOT Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,false,false,false,false,'ODOT oversize/overweight permit system — wind energy corridor.','ODOT Oklahoma oversize permit wind energy'),
('US','US-MT','Montana','MDT','https://www.mdt.mt.gov','https://app.mt.gov/oversize/','planning_mode','MDT Permits','https://app.mt.gov/oversize/','official_portal','portal_login',false,false,false,true,true,false,false,false,false,false,'MDT oversize permit — Bakken oil field corridor.','MDT Montana oversize permit Bakken'),
('US','US-WA','Washington','WSDOT','https://wsdot.wa.gov','https://www.wsdot.wa.gov/CommercialVehicle/permits.htm','planning_mode','WSDOT Permits',NULL,'official_portal','portal_login',false,false,true,true,true,false,false,false,true,false,'WSDOT permit system. Bridge clearance data.','WSDOT Washington oversize permit'),
('US','US-NC','North Carolina','NCDOT','https://www.ncdot.gov','https://connect.ncdot.gov/business/trucking/Pages/Oversize-Overweight.aspx','planning_mode','NCDOT Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,false,false,false,false,'NCDOT oversize permit system.','NCDOT North Carolina oversize permit'),
('US','US-AZ','Arizona','ADOT','https://azdot.gov','https://apps.azdot.gov/ADOTPermits/','planning_mode','ADOT Permits','https://apps.azdot.gov/ADOTPermits/','official_portal','portal_login',false,false,false,true,true,false,false,false,false,false,'ADOT oversize/overweight permit portal.','ADOT Arizona oversize permit');

-- 🇨🇦 CANADA — 13 provinces/territories
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_url, source_type, access_method, supports_permit_exact, supports_approved_network, supports_bridge_clearances, supports_escort_rules, supports_pilot_car_maps, has_gis_service, notes, anti_gravity_hunt_terms) VALUES
('CA','CA-BC','British Columbia','CVSE','https://www2.gov.bc.ca/gov/content/transportation/vehicle-safety-enforcement','https://onroutebc.gov.bc.ca','permit_exact','onRouteBC','https://onroutebc.gov.bc.ca','official_portal','portal_login',true,true,true,true,true,false,'onRouteBC: exact permit routing for single-trip. BC pilot car guidelines. Term permits = planning_mode.','onRouteBC CVSE British Columbia oversize permit pilot car'),
('CA','CA-AB','Alberta','Alberta Transportation','https://www.alberta.ca/oversize-overweight-vehicles','https://travis.alberta.ca','approved_network','TRAVIS Web','https://travis.alberta.ca','official_portal','portal_login',false,true,true,true,false,false,'TRAVIS Web permit system. AMA oversize routing. Alberta bridge data.','TRAVIS Alberta oversize permit routing'),
('CA','CA-ON','Ontario','MTO','https://www.ontario.ca/page/ministry-transportation','https://www.ontario.ca/page/get-oversize-overweight-vehicle-permit','approved_network','PRIO','https://www.ontario.ca/page/get-oversize-overweight-vehicle-permit','official_portal','portal_login',false,true,true,true,false,true,'PRIO permit portal. MTO oversize guide. MTO bridge data.','MTO Ontario PRIO oversize permit'),
('CA','CA-SK','Saskatchewan','SGI','https://www.sgi.sk.ca','https://www.sgi.sk.ca/commercial-trucking','planning_mode','SGI Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,'SGI commercial trucking permits.','SGI Saskatchewan oversize permit'),
('CA','CA-MB','Manitoba','Manitoba Infrastructure','https://www.gov.mb.ca/mit/','https://www.gov.mb.ca/mit/mcd/overweight/','planning_mode','MIT Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,'Manitoba Infrastructure oversize permits.','Manitoba oversize permit'),
('CA','CA-QC','Quebec','MTQ','https://www.transports.gouv.qc.ca','https://www.transports.gouv.qc.ca/en/camionnage/Pages/default.aspx','planning_mode','MTQ Permits',NULL,'official_portal','portal_login',false,false,true,true,false,true,'MTQ oversize permits. Quebec bridge data.','MTQ Quebec oversize permit'),
('CA','CA-NB','New Brunswick','NBDTI','https://www2.gnb.ca/content/gnb/en/departments/dti.html',NULL,'planning_mode','NBDTI Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,'NB oversize permits.','NBDTI New Brunswick oversize'),
('CA','CA-NS','Nova Scotia','TIR','https://novascotia.ca/tran/',NULL,'planning_mode','TIR Permits',NULL,'official_portal','portal_login',false,false,false,true,false,false,'Nova Scotia oversize permits.','Nova Scotia TIR oversize'),
('CA','CA-PE','Prince Edward Island','TIE','https://www.princeedwardisland.ca/en/topic/transportation',NULL,'rules_only','TIE Permits',NULL,'official_document','document_parse',false,false,false,true,false,false,'PEI oversize permits — small jurisdiction.','PEI oversize permit'),
('CA','CA-NL','Newfoundland','TW','https://www.gov.nl.ca/ti/',NULL,'rules_only','TW Permits',NULL,'official_document','document_parse',false,false,false,true,false,false,'Newfoundland oversize permits.','Newfoundland oversize permit'),
('CA','CA-YT','Yukon','Highways & Public Works','https://yukon.ca/en/transportation',NULL,'rules_only','Yukon Permits',NULL,'official_document','document_parse',false,false,false,true,false,false,'Yukon oversize permits.','Yukon oversize permit'),
('CA','CA-NT','Northwest Territories','DOT','https://www.inf.gov.nt.ca',NULL,'rules_only','NWT Permits',NULL,'official_document','document_parse',false,false,false,true,false,false,'NWT oversize permits.','NWT oversize permit'),
('CA','CA-NU','Nunavut','CGS','https://www.gov.nu.ca/community-and-government-services',NULL,'rules_only','Nunavut Permits',NULL,'official_document','document_parse',false,false,false,false,false,false,'Nunavut — limited road network.','Nunavut oversize');

-- 🇦🇺 AUSTRALIA — 8 states/territories
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_url, source_type, access_method, supports_permit_exact, supports_approved_network, supports_bridge_clearances, supports_escort_rules, supports_seasonal_restrictions, has_public_api, has_gis_service, notes, anti_gravity_hunt_terms) VALUES
('AU','AU-NSW','New South Wales','NHVR / TfNSW','https://www.nhvr.gov.au','https://www.nhvr.gov.au/road-access/route-planner','approved_network','NHVR Route Planner','https://www.nhvr.gov.au/road-access/route-planner','official_gis_service','rest_query',false,true,true,true,true,true,true,'NHVR Route Planner — single authoritative source. NHVR National Network Map.','NHVR Route Planner Australia oversize'),
('AU','AU-VIC','Victoria','NHVR / VicRoads','https://www.nhvr.gov.au','https://www.nhvr.gov.au/road-access/route-planner','approved_network','NHVR Route Planner',NULL,'official_gis_service','rest_query',false,true,true,true,true,true,true,'NHVR route planner covers VIC.','NHVR Victoria oversize'),
('AU','AU-QLD','Queensland','NHVR / TMR','https://www.nhvr.gov.au','https://www.nhvr.gov.au/road-access/route-planner','approved_network','NHVR Route Planner',NULL,'official_gis_service','rest_query',false,true,true,true,true,true,true,'NHVR route planner covers QLD. TMR also has own portal.','NHVR Queensland TMR oversize'),
('AU','AU-SA','South Australia','NHVR / DPTI','https://www.nhvr.gov.au','https://www.nhvr.gov.au/road-access/route-planner','approved_network','NHVR Route Planner',NULL,'official_gis_service','rest_query',false,true,true,true,true,true,true,'NHVR route planner covers SA.','NHVR South Australia oversize'),
('AU','AU-WA','Western Australia','Main Roads WA','https://www.mainroads.wa.gov.au','https://www.mainroads.wa.gov.au/heavy-vehicles/permits-and-access/','approved_network','Main Roads WA','https://www.mainroads.wa.gov.au/heavy-vehicles/','official_portal','portal_login',false,true,true,true,true,false,true,'Separate from NHVR. Main Roads WA own permit system.','Main Roads WA oversize permit Western Australia'),
('AU','AU-TAS','Tasmania','NHVR / State Growth','https://www.nhvr.gov.au',NULL,'approved_network','NHVR Route Planner',NULL,'official_gis_service','rest_query',false,true,true,true,false,true,true,'NHVR covers TAS.','NHVR Tasmania oversize'),
('AU','AU-NT','Northern Territory','NT DOT','https://dipl.nt.gov.au',NULL,'planning_mode','NT DOT Permits',NULL,'official_portal','portal_login',false,false,false,true,true,false,false,'Separate from NHVR. NT DOT own system.','NT DOT Northern Territory oversize permit'),
('AU','AU-ACT','Australian Capital Territory','NHVR / ACT','https://www.nhvr.gov.au',NULL,'approved_network','NHVR Route Planner',NULL,'official_gis_service','rest_query',false,true,true,true,false,true,true,'NHVR covers ACT.','NHVR ACT oversize');

-- 🇬🇧 UNITED KINGDOM — 4 jurisdictions
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_url, source_type, access_method, supports_permit_exact, supports_approved_network, supports_bridge_clearances, supports_escort_rules, supports_pilot_car_maps, requires_login, has_gis_service, notes, anti_gravity_hunt_terms) VALUES
('GB','GB-ENG','England','National Highways','https://nationalhighways.co.uk','https://www.esdal.com','permit_exact','ESDAL','https://www.esdal.com','official_portal','portal_login',true,true,true,true,true,true,true,'ESDAL abnormal load route planning. National Highways high-and-heavy load grid maps. STGO categories.','ESDAL abnormal load England National Highways STGO'),
('GB','GB-SCT','Scotland','Transport Scotland','https://www.transport.gov.scot',NULL,'approved_network','ESDAL Scotland','https://www.esdal.com','official_portal','portal_login',false,true,true,true,false,true,false,'Transport Scotland ESDAL integration.','Transport Scotland ESDAL abnormal load'),
('GB','GB-WLS','Wales','Welsh Government Transport','https://www.gov.wales/transport',NULL,'approved_network','ESDAL Wales','https://www.esdal.com','official_portal','portal_login',false,true,true,true,false,true,false,'Welsh Government Transport ESDAL.','Wales ESDAL abnormal load'),
('GB','GB-NIR','Northern Ireland','DfI Roads NI','https://www.infrastructure-ni.gov.uk',NULL,'planning_mode','DfI Roads','https://www.infrastructure-ni.gov.uk','official_portal','portal_login',false,false,false,true,false,false,false,'DfI Roads NI abnormal load permits.','DfI Roads Northern Ireland abnormal load');

-- 🇩🇪 GERMANY — Federal + key Bundesländer
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, routing_maturity, source_name, source_type, access_method, supports_approved_network, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('DE','DE-BUND','Germany (Federal)','Deutschland (Bund)','Fernstraßen-Bundesamt (BAST)','https://www.bast.de','approved_network','VEMAGS','official_portal','portal_login',true,true,'Federal Sonderfahrten routing system via VEMAGS portal.','VEMAGS Sonderfahrt Schwertransport Germany Bundesamt'),
('DE','DE-BY','Bavaria','Bayern','Bayerische Straßenbauverwaltung','https://www.stbv.bayern.de','approved_network','VEMAGS Bayern',NULL,'portal_login',true,true,'Bavaria has good VEMAGS integration for Schwertransport.','Bayern Schwertransport oversize permit'),
('DE','DE-NW','North Rhine-Westphalia','Nordrhein-Westfalen','Straßen.NRW','https://www.strassen.nrw.de','approved_network','VEMAGS NRW',NULL,'portal_login',true,true,'NRW — major industrial corridor (Ruhr, Duisburg port).','NRW Schwertransport Nordrhein-Westfalen'),
('DE','DE-BW','Baden-Württemberg','Baden-Württemberg','Regierungspräsidium Tübingen','https://rp.baden-wuerttemberg.de','approved_network','VEMAGS BW',NULL,'portal_login',true,true,'BW major industrial state.','Baden-Württemberg Schwertransport'),
('DE','DE-NI','Lower Saxony','Niedersachsen','NLStBV','https://www.strassenbau.niedersachsen.de','planning_mode','VEMAGS NI',NULL,'portal_login',false,true,'Lower Saxony — wind energy corridor.','Niedersachsen Schwertransport wind energy'),
('DE','DE-HE','Hesse','Hessen','Hessen Mobil','https://mobil.hessen.de','planning_mode','VEMAGS HE',NULL,'portal_login',false,true,'Hesse — Frankfurt corridor.','Hessen Schwertransport Frankfurt'),
('DE','DE-SH','Schleswig-Holstein','Schleswig-Holstein','LBV.SH','https://www.schleswig-holstein.de','planning_mode','VEMAGS SH',NULL,'portal_login',false,true,'SH — wind energy / port corridor.','Schleswig-Holstein Schwertransport');

-- 🇳🇱 NETHERLANDS — National + key provinces
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_url, source_type, access_method, supports_approved_network, supports_escort_rules, has_public_api, notes, anti_gravity_hunt_terms) VALUES
('NL','NL-NAT','Netherlands (National)','Nederland','RDW','https://www.rdw.nl','https://www.rdw.nl/zakelijk/paginas/ontheffing-zwaar-transport','approved_network','RDW Ontheffing','https://www.rdw.nl','official_portal','portal_login',true,true,false,'RDW ontheffing portal. NL Portaal Bijzondere Transporten. Rotterdam port corridor well documented.','RDW ontheffing bijzonder transport Netherlands Rotterdam'),
('NL','NL-ZH','South Holland','Zuid-Holland','Provincie Zuid-Holland','https://www.zuid-holland.nl',NULL,'approved_network','Provincial ZH',NULL,'official_portal','portal_login',true,true,false,'Rotterdam port — busiest special transport corridor in NL.','Zuid-Holland Rotterdam bijzonder transport');

-- 🇧🇷 BRAZIL — Federal + key states
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, routing_maturity, source_name, source_type, access_method, supports_approved_network, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('BR','BR-NAT','Brazil (Federal)','Brasil (Federal)','DNIT','https://www.gov.br/dnit','planning_mode','SISCOMEX','official_portal','portal_login',false,true,'DNIT SISCOMEX portal for federal highways.','DNIT SISCOMEX transporte especial Brasil'),
('BR','BR-SP','São Paulo','São Paulo','ARTESP / DER-SP','https://www.artesp.sp.gov.br','planning_mode','ARTESP Portal','official_portal','portal_login',false,true,'ARTESP has better portal infrastructure. SP is largest industrial state.','ARTESP DER São Paulo transporte especial'),
('BR','BR-RJ','Rio de Janeiro','Rio de Janeiro','DER-RJ','https://www.der.rj.gov.br','rules_only','DER-RJ',NULL,'official_document','document_parse',false,true,'DER-RJ oversize permits.','DER Rio de Janeiro transporte especial'),
('BR','BR-MG','Minas Gerais','Minas Gerais','DER-MG','https://www.der.mg.gov.br','rules_only','DER-MG',NULL,'official_document','document_parse',false,true,'MG — major mining corridor.','DER Minas Gerais transporte especial mineração');

-- 🇦🇪 UAE — 7 emirates
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, routing_maturity, source_name, source_type, access_method, supports_approved_network, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('AE','AE-DU','Dubai','دبي','Dubai RTA','https://www.rta.ae','approved_network','RTA Permits','official_portal','portal_login',true,true,'Dubai RTA permit system. Jebel Ali port corridor rules.','Dubai RTA oversize permit Jebel Ali'),
('AE','AE-AZ','Abu Dhabi','أبوظبي','Abu Dhabi ITC','https://www.itc.gov.ae','approved_network','ITC Permits','official_portal','portal_login',true,true,'Abu Dhabi ITC permit system. Ruwais industrial corridor.','Abu Dhabi ITC oversize permit'),
('AE','AE-SH','Sharjah','الشارقة','Sharjah Roads','https://www.shjmun.gov.ae','planning_mode','Sharjah Permits','official_portal','portal_login',false,true,'Sharjah road authority permits.','Sharjah oversize permit'),
('AE','AE-AJ','Ajman','عجمان','Ajman Municipality','https://www.am.gov.ae','rules_only','Ajman Permits','official_document','document_parse',false,true,'Ajman permits.','Ajman oversize'),
('AE','AE-RK','Ras Al Khaimah','رأس الخيمة','RAK Transport','https://www.rak.ae','rules_only','RAK Permits','official_document','document_parse',false,true,'RAK permits.','RAK oversize'),
('AE','AE-UQ','Umm Al Quwain','أم القيوين','UAQ Municipality','https://www.uaq.ae','rules_only','UAQ Permits','official_document','document_parse',false,false,'UAQ — smallest emirate.','UAQ oversize'),
('AE','AE-FU','Fujairah','الفجيرة','Fujairah Municipality','https://www.fujmun.gov.ae','rules_only','Fujairah Permits','official_document','document_parse',false,true,'Fujairah — east coast port.','Fujairah oversize port');

-- 🇿🇦 SOUTH AFRICA — National + key provinces
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_url, source_type, access_method, supports_approved_network, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('ZA','ZA-NAT','South Africa (National)','RTMC','https://www.rtmc.co.za','https://alps.rtmc.co.za','approved_network','ALPS','https://alps.rtmc.co.za','official_portal','portal_login',true,true,'RTMC ALPS — centralized abnormal load permit system.','RTMC ALPS abnormal load South Africa'),
('ZA','ZA-GP','Gauteng','Gauteng Transport','https://www.gauteng.gov.za',NULL,'planning_mode','Gauteng DOT',NULL,'official_portal','portal_login',false,true,'Gauteng provincial roads. Johannesburg corridor.','Gauteng abnormal load permit'),
('ZA','ZA-KZN','KwaZulu-Natal','KZN Transport','https://www.kzntransport.gov.za',NULL,'planning_mode','KZN DOT',NULL,'official_portal','portal_login',false,true,'N3 Durban–JHB: highest volume abnormal load corridor.','KwaZulu-Natal Durban N3 abnormal load');

-- 🇳🇿 NEW ZEALAND — National
INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, permit_authority_name, permit_authority_url, permit_portal_url, routing_maturity, source_name, source_type, access_method, supports_approved_network, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('NZ','NZ-NAT','New Zealand (National)','NZTA / Waka Kotahi','https://www.nzta.govt.nz','https://www.nzta.govt.nz/vehicles/vehicle-types/heavy/permits/','approved_network','NZTA HPMV','official_portal','portal_login',true,true,'NZTA HPMV permit system. Route assessment for specialist loads.','NZTA Waka Kotahi oversize permit New Zealand HPMV');

-- ────────────────────────────────────────────────────────────
-- TIER B — BLUE (18 countries)
-- ────────────────────────────────────────────────────────────

INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, routing_maturity, source_name, source_type, access_method, supports_approved_network, supports_escort_rules, has_public_api, has_gis_service, notes, anti_gravity_hunt_terms) VALUES
('IE','IE-NAT','Ireland','Éire','Transport Infrastructure Ireland','https://www.tii.ie','planning_mode','TII Permits','official_portal','portal_login',false,true,false,true,'TII abnormal load permits. TII has GIS portal.','TII Ireland abnormal load permit'),
('SE','SE-NAT','Sweden','Sverige','Transportstyrelsen','https://www.transportstyrelsen.se','approved_network','Transportstyrelsen','official_portal','portal_login',true,true,false,false,'Swedish Transport Agency special transport permits. Good digital infrastructure.','Transportstyrelsen Sweden dispensation specialtransport'),
('NO','NO-NAT','Norway','Norge','Statens Vegvesen','https://www.vegvesen.no','approved_network','Statens Vegvesen','official_portal','portal_login',true,true,true,true,'NPRA special transport permits. VegBridge clearance data. Open road data APIs.','Statens Vegvesen Norway dispensasjon spesialtransport'),
('DK','DK-NAT','Denmark','Danmark','Vejdirektoratet','https://www.vejdirektoratet.dk','planning_mode','Vejdirektoratet','official_portal','portal_login',false,true,false,false,'Danish Road Directorate special transport.','Vejdirektoratet Denmark specialtransport'),
('FI','FI-NAT','Finland','Suomi','Traficom','https://www.traficom.fi','planning_mode','Traficom','official_portal','portal_login',false,true,true,false,'Traficom special transport permits. Fintraffic open APIs.','Traficom Finland erikoiskuljetus'),
('BE','BE-NAT','Belgium','België / Belgique','SPF Mobilité','https://mobilit.belgium.be','planning_mode','SPF Mobilité','official_portal','portal_login',false,true,false,false,'Federal + Flanders/Wallonia road authorities.','SPF Mobilité Belgium uitzonderlijk vervoer transport exceptionnel'),
('AT','AT-NAT','Austria','Österreich','BMVIT / ASFiNAG','https://www.bmk.gv.at','planning_mode','BMVIT','official_portal','portal_login',false,true,false,false,'BMVIT special transport + ASFiNAG motorways.','BMVIT ASFiNAG Austria Sondertransport'),
('CH','CH-NAT','Switzerland','Schweiz / Suisse','ASTRA / FEDRO','https://www.astra.admin.ch','planning_mode','ASTRA','official_portal','portal_login',false,true,false,false,'ASTRA Federal Roads Office special transport. Viasuisse conditions.','ASTRA Switzerland Sondertransport'),
('ES','ES-NAT','Spain','España','DGT','https://www.dgt.es','planning_mode','DGT','official_portal','portal_login',false,true,false,false,'DGT special transport permits. Ministry of Transport.','DGT Spain transporte especial'),
('FR','FR-NAT','France','France','DREAL','https://www.ecologie.gouv.fr','planning_mode','DREAL','official_portal','portal_login',false,true,false,true,'DREAL regional special transport. CEREMA route intelligence. Good GIS.','DREAL France transport exceptionnel convoi exceptionnel'),
('IT','IT-NAT','Italy','Italia','MIT','https://www.mit.gov.it','planning_mode','MIT','official_portal','portal_login',false,true,false,false,'MIT special transport permits. ANAS national roads.','MIT Italy trasporto eccezionale'),
('PT','PT-NAT','Portugal','Portugal','IMTT / IMT','https://www.imt-ip.pt','rules_only','IMT','official_document','document_parse',false,true,false,false,'IMT special transport. Infraestruturas de Portugal.','IMT Portugal transporte especial'),
('SA','SA-NAT','Saudi Arabia','المملكة العربية السعودية','Ministry of Transport','https://www.mot.gov.sa','rules_only','MOT SA','official_document','document_parse',false,true,false,false,'Ministry of Transport special transport permits.','Saudi Arabia MOT oversize permit نقل استثنائي'),
('QA','QA-NAT','Qatar','قطر','Ashghal','https://www.ashghal.gov.qa','rules_only','Ashghal','official_document','document_parse',false,true,false,false,'Ashghal Public Works Authority special transport.','Ashghal Qatar oversize permit'),
('MX','MX-NAT','Mexico','México','SICT','https://www.gob.mx/sct','planning_mode','SICT','official_portal','portal_login',false,true,false,false,'SICT (formerly SCT) special transport. Mining + wind energy.','SICT SCT Mexico transporte especial sobredimensionado'),
('IN','IN-NAT','India','भारत','MoRTH','https://morth.nic.in','rules_only','MoRTH','official_document','document_parse',false,true,false,false,'MoRTH ODC permits. State PWD departments handle roads.','MoRTH India ODC oversize overweight permit'),
('ID','ID-NAT','Indonesia','Indonesia','Ministry of Public Works (PUPR)','https://www.pu.go.id','rules_only','BPJT','official_document','document_parse',false,true,false,false,'BPJT special transport. Limited digital infrastructure.','BPJT Indonesia oversize kendaraan berat'),
('TH','TH-NAT','Thailand','ไทย','Department of Highways','https://www.doh.go.th','rules_only','DOH Thailand','official_document','document_parse',false,true,false,false,'Department of Highways special transport.','DOH Thailand oversize ขนส่งพิเศษ');

-- ────────────────────────────────────────────────────────────
-- TIER C — SILVER (26 countries)
-- ────────────────────────────────────────────────────────────

INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, routing_maturity, source_type, access_method, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('PL','PL-NAT','Poland','Polska','GDDKiA','https://www.gddkia.gov.pl','planning_mode','official_portal','portal_login',true,'GDDKiA special transport — has online portal.','GDDKiA Poland przejazd nienormatywny'),
('CZ','CZ-NAT','Czech Republic','Česko','ŘSD','https://www.rsd.cz','planning_mode','official_portal','portal_login',true,'ŘSD special transport permits.','ŘSD Czech Republic nadrozmerny naklad'),
('RO','RO-NAT','Romania','România','CNAIR','https://www.cnair.ro','rules_only','official_document','document_parse',true,'CNAIR special transport.','CNAIR Romania transport agabaritic'),
('HU','HU-NAT','Hungary','Magyarország','Magyar Közút','https://www.kozut.hu','rules_only','official_document','document_parse',true,'Magyar Közút special transport.','Magyar Közút Hungary különleges szállítás'),
('BG','BG-NAT','Bulgaria','България','API','https://www.api.bg','rules_only','official_document','document_parse',true,'Road Infrastructure Agency special transport.','API Bulgaria извънгабаритен товар'),
('HR','HR-NAT','Croatia','Hrvatska','HAC / HC','https://hac.hr','rules_only','official_document','document_parse',true,'Croatian motorways special transport.','HAC Croatia izvanredni prijevoz'),
('GR','GR-NAT','Greece','Ελλάδα','Ministry of Infrastructure','https://www.yme.gov.gr','rules_only','official_document','document_parse',true,'Greek special transport permits.','Greece υπερβαρύ μεταφορά'),
('SG','SG-NAT','Singapore','Singapore','LTA','https://www.lta.gov.sg','approved_network','official_portal','portal_login',true,'LTA special vehicle permits — very organized system.','LTA Singapore oversize vehicle permit'),
('JP','JP-NAT','Japan','日本','MLIT','https://www.mlit.go.jp','approved_network','official_portal','portal_login',true,'MLIT special vehicle permits. Online application system. Sophisticated routing.','MLIT Japan 特殊車両 oversize permit'),
('KR','KR-NAT','South Korea','대한민국','MOLIT','https://www.molit.go.kr','approved_network','official_portal','portal_login',true,'MOLIT special vehicle permits.','MOLIT South Korea 특수차량 oversize permit'),
('MY','MY-NAT','Malaysia','Malaysia','JKR','https://www.jkr.gov.my','rules_only','official_document','document_parse',true,'JKR special transport.','JKR Malaysia oversize kenderaan berat'),
('PH','PH-NAT','Philippines','Pilipinas','DPWH','https://www.dpwh.gov.ph','rules_only','official_document','document_parse',true,'DPWH special vehicle permits.','DPWH Philippines oversize vehicle permit'),
('VN','VN-NAT','Vietnam','Việt Nam','MOT','https://www.mt.gov.vn','rules_only','official_document','document_parse',true,'Ministry of Transport special vehicle.','MOT Vietnam xe quá khổ quá tải'),
('CL','CL-NAT','Chile','Chile','MOP','https://www.mop.cl','planning_mode','official_portal','portal_login',true,'MOP special transport. Mining corridor focus.','MOP Chile transporte especial sobredimensionado'),
('AR','AR-NAT','Argentina','Argentina','DNV','https://www.argentina.gob.ar/obras-publicas/vialidad-nacional','rules_only','official_document','document_parse',true,'DNV special transport.','DNV Argentina transporte excepcional'),
('CO','CO-NAT','Colombia','Colombia','INVIAS','https://www.invias.gov.co','rules_only','official_document','document_parse',true,'INVIAS special transport permits.','INVIAS Colombia transporte especial sobredimensionado'),
('PE','PE-NAT','Peru','Perú','MTC','https://www.gob.pe/mtc','rules_only','official_document','document_parse',true,'MTC special transport. Mining corridor.','MTC Peru transporte especial sobredimensionado'),
('TR','TR-NAT','Turkey','Türkiye','KGM','https://www.kgm.gov.tr','planning_mode','official_portal','portal_login',true,'KGM special transport.','KGM Turkey özel nakliye büyük yük'),
('IL','IL-NAT','Israel','ישראל','Netivei Israel','https://www.iroads.co.il','planning_mode','official_portal','portal_login',true,'Netivei Israel special transport permits.','Netivei Israel oversize permit'),
('KW','KW-NAT','Kuwait','الكويت','MPW','https://www.mpw.gov.kw','rules_only','official_document','document_parse',true,'Ministry of Public Works special transport.','Kuwait MPW oversize'),
('OM','OM-NAT','Oman','عُمان','MOT Oman','https://www.mot.gov.om','rules_only','official_document','document_parse',true,'Ministry of Transport special vehicle.','Oman MOT oversize'),
('BH','BH-NAT','Bahrain','البحرين','MOW','https://www.works.gov.bh','rules_only','official_document','document_parse',false,'Ministry of Works special transport.','Bahrain MOW oversize'),
('NG','NG-NAT','Nigeria','Nigeria','FRSC','https://frsc.gov.ng','rules_only','official_document','document_parse',true,'Federal Road Safety Corps. Very limited digital infrastructure.','FRSC Nigeria oversize vehicle'),
('EG','EG-NAT','Egypt','مصر','GARBLT','https://www.garblt.gov.eg','rules_only','official_document','document_parse',true,'General Authority for Roads Bridges and Land Transport.','GARBLT Egypt oversize transport'),
('KE','KE-NAT','Kenya','Kenya','KeNHA','https://www.kenha.co.ke','rules_only','official_document','document_parse',true,'Kenya National Highways Authority.','KeNHA Kenya oversize'),
('GH','GH-NAT','Ghana','Ghana','GHA','https://www.highways.gov.gh','rules_only','official_document','document_parse',true,'Ghana Highway Authority.','GHA Ghana oversize');

-- ────────────────────────────────────────────────────────────
-- TIER D — SLATE (3 countries)
-- ────────────────────────────────────────────────────────────

INSERT INTO jurisdiction_routing_sources (country_code, jurisdiction_code, jurisdiction_name, jurisdiction_name_local, permit_authority_name, permit_authority_url, routing_maturity, source_type, access_method, supports_escort_rules, notes, anti_gravity_hunt_terms) VALUES
('UY','UY-NAT','Uruguay','Uruguay','MTOP','https://www.gub.uy/ministerio-transporte-obras-publicas','rules_only','official_document','document_parse',true,'MTOP special transport.','MTOP Uruguay transporte especial'),
('PA','PA-NAT','Panama','Panamá','MOP','https://www.mop.gob.pa','rules_only','official_document','document_parse',true,'MOP special transport. Canal corridor.','MOP Panama transporte especial'),
('CR','CR-NAT','Costa Rica','Costa Rica','MOPT','https://www.mopt.go.cr','rules_only','official_document','document_parse',true,'MOPT special transport.','MOPT Costa Rica transporte especial');

-- ═══════════════════════════════════════════════════════════════
-- UPDATE global_countries with routing_intelligence_live flag
-- ═══════════════════════════════════════════════════════════════

-- Add column if not exists
DO $$ BEGIN
  ALTER TABLE global_countries ADD COLUMN IF NOT EXISTS routing_intelligence_live BOOLEAN DEFAULT false;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
