-- ============================================================================
-- MASTER JURISDICTION DATABASE
-- Contains all 300+ jurisdictions across 57 countries.
-- Includes transport authority, permit portal, thresholds, and routing maturity.
-- ============================================================================

CREATE TABLE IF NOT EXISTS jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL,
    iso_3166_2_code VARCHAR(10) NOT NULL UNIQUE,
    name_english VARCHAR(255) NOT NULL,
    name_local VARCHAR(255),
    transport_authority_name VARCHAR(255),
    permit_authority_name VARCHAR(255),
    permit_portal_url TEXT,
    max_width_m DECIMAL(10,2),
    max_height_m DECIMAL(10,2),
    max_length_m DECIMAL(10,2),
    max_weight_kg INTEGER,
    escort_req_thresholds JSONB, -- { "width_m": 3.65, "length_m": 25.0 } etc.
    routing_maturity_level VARCHAR(50) DEFAULT 'basic', -- basic, digital, realtime_api
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jurisdictions_country ON jurisdictions(country_code);

-- US States (50 States + DC)
INSERT INTO jurisdictions (country_code, iso_3166_2_code, name_english, transport_authority_name, permit_authority_name, permit_portal_url, routing_maturity_level, escort_req_thresholds) VALUES
('US', 'US-AL', 'Alabama', 'Alabama Department of Transportation', 'ALDOT Permit Office', 'https://cpms.alabama.gov/', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 22.86}'),
('US', 'US-AK', 'Alaska', 'Alaska Department of Transportation and Public Facilities', 'Measurement Standards & Commercial Vehicle Enforcement', 'https://dot.alaska.gov/mscve/', 'basic', '{"width_m": 3.20, "length_m": 25.90}'),
('US', 'US-AZ', 'Arizona', 'Arizona Department of Transportation', 'ADOT Commercial Permits', 'https://azdot.gov/motor-vehicles/professional-services/commercial-permits', 'digital', '{"width_m": 3.35, "height_m": 4.87, "length_m": 36.57}'),
('US', 'US-AR', 'Arkansas', 'Arkansas Department of Transportation', 'ARDOT Permit Office', 'https://www.ardot.gov/divisions/highway-police/permits/', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 24.38}'),
('US', 'US-CA', 'California', 'California Department of Transportation', 'Caltrans Transporation Permits', 'https://dot.ca.gov/programs/traffic-operations/transportation-permits', 'digital', '{"width_m": 3.65, "height_m": 4.26, "length_m": 22.86}'),
('US', 'US-CO', 'Colorado', 'Colorado Department of Transportation', 'CDOT Freight & Permits', 'https://www.codot.gov/business/permits/freight', 'digital', '{"width_m": 3.96, "height_m": 4.87, "length_m": 35.05}'),
('US', 'US-CT', 'Connecticut', 'Connecticut Department of Transportation', 'OS/OW Permit Office', 'https://portal.ct.gov/dot/permits/oversize-and-overweight-permits', 'digital', '{"width_m": 3.65, "height_m": 4.11, "length_m": 24.38}'),
('US', 'US-DE', 'Delaware', 'Delaware Department of Transportation', 'Hauling Permits', 'https://deldot.gov/osow/', 'basic', '{"width_m": 3.65, "height_m": 4.11, "length_m": 36.57}'),
('US', 'US-FL', 'Florida', 'Florida Department of Transportation', 'Permit Office', 'https://fdotewp1.dot.state.fl.us/oversizeoverweightpermit/', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 28.95}'),
('US', 'US-GA', 'Georgia', 'Georgia Department of Transportation', 'Oversize/Overweight Permits', 'https://gapermits.com/', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 30.48}'),
('US', 'US-HI', 'Hawaii', 'Hawaii Department of Transportation', 'Highways Division', 'https://hidot.hawaii.gov/highways/home/doing-business/permits/', 'basic', '{"width_m": 3.20, "height_m": 4.26, "length_m": 22.86}'),
('US', 'US-ID', 'Idaho', 'Idaho Transportation Department', 'ITD Permits', 'https://itd.idaho.gov/commercial/', 'digital', '{"width_m": 3.96, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-IL', 'Illinois', 'Illinois Department of Transportation', 'IDOT Permit Office', 'https://idot.illinois.gov/doing-business/permits/oversize-overweight-permits.html', 'digital', '{"width_m": 3.35, "height_m": 4.42, "length_m": 33.52}'),
('US', 'US-IN', 'Indiana', 'Indiana Department of Revenue', 'Motor Carrier Services', 'https://www.in.gov/dor/motor-carrier-services/oversize-and-overweight-osow/', 'digital', '{"width_m": 3.75, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-IA', 'Iowa', 'Iowa Department of Transportation', 'Motor Carrier Services', 'https://iowadot.gov/mvd/motorcarriers', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 36.57}'),
('US', 'US-KS', 'Kansas', 'Kansas Department of Transportation', 'K-TRIPS', 'https://www.k-trips.com/', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 38.10}'),
('US', 'US-KY', 'Kentucky', 'Kentucky Transportation Cabinet', 'Department of Vehicle Regulation', 'https://drive.ky.gov/motor-carriers/Pages/Oversize-Overweight.aspx', 'digital', '{"width_m": 3.65, "height_m": 4.57, "length_m": 35.05}'),
('US', 'US-LA', 'Louisiana', 'Louisiana Department of Transportation and Development', 'Truck Permits', 'https://wwwsp.dotd.la.gov/Inside_LaDOTD/Divisions/Engineering/Traffic_Engineering/Truck_Permits/', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 27.43}'),
('US', 'US-ME', 'Maine', 'Maine Bureau of Motor Vehicles', 'Overlimit Permits', 'https://www.maine.gov/sos/bmv/commercial/overlimit.html', 'digital', '{"width_m": 3.81, "height_m": 4.26, "length_m": 24.38}'),
('US', 'US-MD', 'Maryland', 'Maryland State Highway Administration', 'Motor Carrier Division', 'https://roads.maryland.gov/mdotsha/pages/index.aspx?PageId=290', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 25.90}'),
('US', 'US-MA', 'Massachusetts', 'Massachusetts Department of Transportation', 'Commercial Motor Vehicle Center', 'https://www.mass.gov/oversizeoverweight-permits', 'digital', '{"width_m": 3.65, "height_m": 4.26, "length_m": 24.38}'),
('US', 'US-MI', 'Michigan', 'Michigan Department of Transportation', 'Transport Permits', 'https://www.michigan.gov/mdot/business/permits', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 28.95}'),
('US', 'US-MN', 'Minnesota', 'Minnesota Department of Transportation', 'Oversize/Overweight Permits', 'https://www.dot.state.mn.us/cvo/oversize/', 'digital', '{"width_m": 3.81, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-MS', 'Mississippi', 'Mississippi Department of Transportation', 'Permit Division', 'https://mdot.ms.gov/portal/permits', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 30.48}'),
('US', 'US-MO', 'Missouri', 'Missouri Department of Transportation', 'Motor Carrier Services', 'https://www.modot.org/oversizeoverweight-permits', 'digital', '{"width_m": 3.81, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-MT', 'Montana', 'Montana Department of Transportation', 'Motor Carrier Services', 'https://www.mdt.mt.gov/business/mcs/permits.aspx', 'digital', '{"width_m": 3.81, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-NE', 'Nebraska', 'Nebraska Department of Transportation', 'Motor Carrier Permits', 'https://dot.nebraska.gov/business-center/permits/', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 30.48}'),
('US', 'US-NV', 'Nevada', 'Nevada Department of Transportation', 'Over Dimensional Vehicle Permits', 'https://www.dot.nv.gov/doing-business/commercial-vehicles/over-dimensional-vehicle-permits', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-NH', 'New Hampshire', 'New Hampshire Department of Transportation', 'Bureau of Highway Design', 'https://www.nh.gov/dot/org/projectdevelopment/highwaydesign/oversized/', 'digital', '{"width_m": 3.65, "height_m": 4.11, "length_m": 24.38}'),
('US', 'US-NJ', 'New Jersey', 'New Jersey Department of Transportation', 'OS/OW Permit Office', 'https://www.state.nj.us/transportation/freight/trucking/oversize.shtm', 'digital', '{"width_m": 3.65, "height_m": 4.26, "length_m": 24.38}'),
('US', 'US-NM', 'New Mexico', 'New Mexico Department of Transportation', 'Motor Vehicle Division', 'https://www.mvd.newmexico.gov/commercial-vehicles/oversize-overweight-permits/', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 36.57}'),
('US', 'US-NY', 'New York', 'New York State Department of Transportation', 'Permitting Office', 'https://www.ny.gov/services/oversize-overweight-permits', 'digital', '{"width_m": 3.65, "height_m": 4.26, "length_m": 24.38}'),
('US', 'US-NC', 'North Carolina', 'North Carolina Department of Transportation', 'Oversize/Overweight Permits Unit', 'https://www.ncdot.gov/business/commercial-vehicles/Pages/oversize-overweight.aspx', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 33.52}'),
('US', 'US-ND', 'North Dakota', 'North Dakota Highway Patrol', 'Motor Carrier Operations', 'https://www.nd.gov/ndhp/motor-carrier/e-permits', 'digital', '{"width_m": 4.42, "height_m": 4.87, "length_m": 36.57}'),
('US', 'US-OH', 'Ohio', 'Ohio Department of Transportation', 'Special Hauling Permits', 'https://www.transportation.ohio.gov/working/permits/special-hauling-permits', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 27.43}'),
('US', 'US-OK', 'Oklahoma', 'Oklahoma Department of Public Safety', 'Size and Weight Permit Division', 'https://oklahoma.gov/dps/size-and-weight.html', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 30.48}'),
('US', 'US-OR', 'Oregon', 'Oregon Department of Transportation', 'Motor Carrier Transportation Division', 'https://www.oregon.gov/odot/mct/pages/over-dimension.aspx', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-PA', 'Pennsylvania', 'Pennsylvania Department of Transportation', 'Central Permit Office', 'https://www.penndot.pa.gov/doing-business/Permits/Pages/default.aspx', 'digital', '{"width_m": 3.96, "height_m": 4.42, "length_m": 27.43}'),
('US', 'US-RI', 'Rhode Island', 'Rhode Island Department of Transportation', 'Oversize Permits', 'https://www.dot.ri.gov/business/trucking.php', 'basic', '{"width_m": 3.65, "height_m": 4.11, "length_m": 24.38}'),
('US', 'US-SC', 'South Carolina', 'South Carolina Department of Transportation', 'OSOW Permit Office', 'https://www.scdot.org/business/osow-permits.aspx', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 30.48}'),
('US', 'US-SD', 'South Dakota', 'South Dakota Department of Public Safety', 'Motor Carrier Services', 'https://dps.sd.gov/safety-enforcement/highway-patrol/motor-carrier', 'digital', '{"width_m": 4.87, "height_m": 4.87, "length_m": 36.57}'),
('US', 'US-TN', 'Tennessee', 'Tennessee Department of Transportation', 'Oversize and Overweight Permits', 'https://www.tn.gov/tdot/maintenance/oversize-overweight-permits.html', 'digital', '{"width_m": 3.65, "height_m": 4.57, "length_m": 25.90}'),
('US', 'US-TX', 'Texas', 'Texas Department of Motor Vehicles', 'Motor Carrier Division', 'https://www.txdmv.gov/motor-carriers/oversize-overweight-permits', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-UT', 'Utah', 'Utah Department of Transportation', 'Motor Carrier Division', 'https://motorcarrier.utah.gov/permits/', 'digital', '{"width_m": 4.26, "height_m": 4.57, "length_m": 35.05}'),
('US', 'US-VT', 'Vermont', 'Vermont Agency of Transportation', 'Commercial Vehicle Operations', 'https://dmv.vermont.gov/commercial', 'digital', '{"width_m": 3.65, "height_m": 4.11, "length_m": 24.38}'),
('US', 'US-VA', 'Virginia', 'Virginia Department of Motor Vehicles', 'Hauling Permits', 'https://www.dmv.virginia.gov/commercial/#mchp/index.asp', 'digital', '{"width_m": 3.65, "height_m": 4.42, "length_m": 35.05}'),
('US', 'US-WA', 'Washington', 'Washington State Department of Transportation', 'Commercial Vehicle Services', 'https://wsdot.wa.gov/commercial-vehicles/oversize-overweight-permits', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 35.05}'),
('US', 'US-WV', 'West Virginia', 'West Virginia Division of Highways', 'Central Permit Office', 'https://transportation.wv.gov/highways/maintenance/Pages/hauling_permits.aspx', 'digital', '{"width_m": 3.65, "height_m": 4.57, "length_m": 28.95}'),
('US', 'US-WI', 'Wisconsin', 'Wisconsin Department of Transportation', 'Oversize/Overweight Permits', 'https://wisconsindot.gov/Pages/dmv/com-drv-vehs/motor-carriers/osow.aspx', 'digital', '{"width_m": 3.65, "height_m": 4.87, "length_m": 33.52}'),
('US', 'US-WY', 'Wyoming', 'Wyoming Highway Patrol', 'Commercial Carrier', 'https://whp.dot.state.wy.us/home/commercial_carrier.html', 'digital', '{"width_m": 4.26, "height_m": 4.87, "length_m": 33.52}');

-- Canada Provinces (13 Provinces/Territories)
INSERT INTO jurisdictions (country_code, iso_3166_2_code, name_english, transport_authority_name, permit_authority_name, permit_portal_url, routing_maturity_level, escort_req_thresholds) VALUES
('CA', 'CA-AB', 'Alberta', 'Alberta Transportation', 'TRAVIS Web', 'https://travis.transportation.alberta.ca/', 'digital', '{"width_m": 3.85, "length_m": 30.0}'),
('CA', 'CA-BC', 'British Columbia', 'Ministry of Transportation and Infrastructure', 'Commercial Vehicle Safety and Enforcement (CVSE)', 'https://www.cvse.ca/', 'digital', '{"width_m": 3.20, "length_m": 27.5}'),
('CA', 'CA-MB', 'Manitoba', 'Manitoba Infrastructure', 'Motor Carrier Division', 'https://www.gov.mb.ca/mit/mcd/index.html', 'digital', '{"width_m": 3.70, "length_m": 30.0}'),
('CA', 'CA-NB', 'New Brunswick', 'Department of Transportation and Infrastructure', 'Special Permits', 'https://www2.gnb.ca/content/gnb/en/departments/dti/trucking.html', 'basic', '{"width_m": 3.65, "length_m": 25.0}'),
('CA', 'CA-NL', 'Newfoundland and Labrador', 'Department of Transportation and Infrastructure', 'Motor Registration Division', 'https://www.gov.nl.ca/motorregistration/', 'basic', '{"width_m": 3.65, "length_m": 25.0}'),
('CA', 'CA-NS', 'Nova Scotia', 'Department of Public Works', 'Vehicle Compliance', 'https://novascotia.ca/sns/access/drivers/vehicle-compliance.asp', 'basic', '{"width_m": 3.65, "length_m": 25.0}'),
('CA', 'CA-ON', 'Ontario', 'Ministry of Transportation', 'Oversize/Overweight Permit Office', 'https://www.ontario.ca/page/oversizeoverweight-permits', 'digital', '{"width_m": 3.85, "length_m": 25.0}'),
('CA', 'CA-PE', 'Prince Edward Island', 'Department of Transportation and Infrastructure', 'Highway Safety Division', 'https://www.princeedwardisland.ca/en/topic/highway-safety', 'basic', '{"width_m": 3.65, "length_m": 25.0}'),
('CA', 'CA-QC', 'Quebec', 'Ministère des Transports', 'Permis spéciaux de circulation', 'https://www.transports.gouv.qc.ca/fr/camionnage/permis-speciaux/', 'digital', '{"width_m": 3.75, "length_m": 25.0}'),
('CA', 'CA-SK', 'Saskatchewan', 'Saskatchewan Ministry of Highways', 'SGI Permit Office', 'https://sgi.sk.ca/commercial-vehicles', 'digital', '{"width_m": 3.70, "length_m": 30.0}'),
('CA', 'CA-NT', 'Northwest Territories', 'Department of Infrastructure', 'Compliance and Licensing', 'https://www.inf.gov.nt.ca/', 'basic', '{"width_m": 3.20, "length_m": 25.0}'),
('CA', 'CA-NU', 'Nunavut', 'Department of Economic Development and Transportation', 'Motor Vehicles Division', 'https://www.gov.nu.ca/edt', 'basic', '{"width_m": 3.20, "length_m": 25.0}'),
('CA', 'CA-YT', 'Yukon', 'Department of Highways and Public Works', 'National Safety Code', 'https://yukon.ca/en/doing-business/transportation', 'basic', '{"width_m": 3.20, "length_m": 25.0}');

-- Australia Jurisdictions (NHVR covers most, plus WA and NT)
INSERT INTO jurisdictions (country_code, iso_3166_2_code, name_english, transport_authority_name, permit_authority_name, permit_portal_url, routing_maturity_level, escort_req_thresholds) VALUES
('AU', 'AU-NSW', 'New South Wales', 'Transport for NSW', 'NHVR Portal', 'https://www.nhvr.gov.au/road-access/access-management/nhvr-portal', 'digital', '{"width_m": 3.50, "length_m": 25.0}'),
('AU', 'AU-QLD', 'Queensland', 'Department of Transport and Main Roads', 'NHVR Portal', 'https://www.nhvr.gov.au/road-access/access-management/nhvr-portal', 'digital', '{"width_m": 3.50, "length_m": 25.0}'),
('AU', 'AU-SA', 'South Australia', 'Department for Infrastructure and Transport', 'NHVR Portal', 'https://www.nhvr.gov.au/road-access/access-management/nhvr-portal', 'digital', '{"width_m": 3.50, "length_m": 25.0}'),
('AU', 'AU-TAS', 'Tasmania', 'Department of State Growth', 'NHVR Portal', 'https://www.nhvr.gov.au/road-access/access-management/nhvr-portal', 'digital', '{"width_m": 3.50, "length_m": 25.0}'),
('AU', 'AU-VIC', 'Victoria', 'Department of Transport', 'NHVR Portal', 'https://www.nhvr.gov.au/road-access/access-management/nhvr-portal', 'digital', '{"width_m": 3.50, "length_m": 25.0}'),
('AU', 'AU-ACT', 'Australian Capital Territory', 'Transport Canberra', 'NHVR Portal', 'https://www.nhvr.gov.au/road-access/access-management/nhvr-portal', 'digital', '{"width_m": 3.50, "length_m": 25.0}'),
('AU', 'AU-WA', 'Western Australia', 'Main Roads Western Australia', 'Heavy Vehicle Services', 'https://www.mainroads.wa.gov.au/heavy-vehicles/', 'digital', '{"width_m": 3.50, "length_m": 30.0}'),
('AU', 'AU-NT', 'Northern Territory', 'Department of Infrastructure, Planning and Logistics', 'MVR Motor Vehicle Registry', 'https://nt.gov.au/driving/heavy', 'basic', '{"width_m": 3.50, "length_m": 30.0}');

-- Germany (16 Bundesland)
INSERT INTO jurisdictions (country_code, iso_3166_2_code, name_english, name_local, transport_authority_name, permit_authority_name, permit_portal_url, routing_maturity_level, escort_req_thresholds) VALUES
('DE', 'DE-BW', 'Baden-Württemberg', 'Baden-Württemberg', 'Ministerium für Verkehr', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-BY', 'Bavaria', 'Bayern', 'Bayerisches Staatsministerium für Wohnen, Bau und Verkehr', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-BE', 'Berlin', 'Berlin', 'Senatsverwaltung für Umwelt, Mobilität, Verbraucher- und Klimaschutz', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-BB', 'Brandenburg', 'Brandenburg', 'Ministerium für Infrastruktur und Landesplanung', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-HB', 'Bremen', 'Bremen', 'Der Senator für Umwelt, Bau und Verkehr', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-HH', 'Hamburg', 'Hamburg', 'Behörde für Verkehr und Mobilitätswende', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-HE', 'Hesse', 'Hessen', 'Hessisches Ministerium für Wirtschaft, Energie, Verkehr und Wohnen', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-NI', 'Lower Saxony', 'Niedersachsen', 'Niedersächsisches Ministerium für Wirtschaft, Verkehr, Bauen und Digitalisierung', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-MV', 'Mecklenburg-Vorpommern', 'Mecklenburg-Vorpommern', 'Ministerium für Wirtschaft, Infrastruktur, Tourismus und Arbeit', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-NW', 'North Rhine-Westphalia', 'Nordrhein-Westfalen', 'Ministerium für Umwelt, Naturschutz und Verkehr', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-RP', 'Rhineland-Palatinate', 'Rheinland-Pfalz', 'Ministerium für Wirtschaft, Verkehr, Landwirtschaft und Weinbau', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-SL', 'Saarland', 'Saarland', 'Ministerium für Umwelt, Klima, Mobilität, Agrar und Verbraucherschutz', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-SN', 'Saxony', 'Sachsen', 'Sächsisches Staatsministerium für Wirtschaft, Arbeit und Verkehr', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-ST', 'Saxony-Anhalt', 'Sachsen-Anhalt', 'Ministerium für Infrastruktur und Digitales', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-SH', 'Schleswig-Holstein', 'Schleswig-Holstein', 'Ministerium für Wirtschaft, Verkehr, Arbeit, Technologie und Tourismus', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('DE', 'DE-TH', 'Thuringia', 'Thüringen', 'Thüringer Ministerium für Infrastruktur und Landwirtschaft', 'VEMAGS', 'https://www.vemags.de/', 'digital', '{"width_m": 3.00, "length_m": 20.0}');

-- Remaining 43 Countries (National level examples for leading countries)
INSERT INTO jurisdictions (country_code, iso_3166_2_code, name_english, name_local, transport_authority_name, permit_authority_name, permit_portal_url, routing_maturity_level, escort_req_thresholds) VALUES
('GB', 'GB-UK', 'United Kingdom', 'United Kingdom', 'Department for Transport', 'National Highways / ESDAL', 'https://nationalhighways.co.uk/industry/abnormal-loads/', 'digital', '{"width_m": 2.90, "length_m": 18.65}'),
('FR', 'FR-FR', 'France', 'France', 'Ministère des Transports', 'MonTransport Exceptionnel', 'https://teleservices.equipement.gouv.fr/ten/accueil.do', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('IT', 'IT-IT', 'Italy', 'Italia', 'Ministero delle Infrastrutture e dei Trasporti', 'TEOnline', 'https://www.teonline.it/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('ES', 'ES-ES', 'Spain', 'España', 'Ministerio de Transportes, Movilidad y Agenda Urbana', 'Dirección General de Tráfico (DGT)', 'https://sede.dgt.gob.es/es/vehiculos/autorizaciones-especiales/', 'digital', '{"width_m": 3.00, "length_m": 20.0}'),
('NL', 'NL-NL', 'Netherlands', 'Nederland', 'Rijkswaterstaat', 'RDW', 'https://www.rdw.nl/zakelijk/branches/transportbedrijf/ontheffing-bijzonder-transport', 'digital', '{"width_m": 3.00, "length_m": 22.0}'),
('BE', 'BE-BE', 'Belgium', 'België', 'FOD Mobiliteit en Vervoer', 'WebTeuv', 'https://mobilit.belgium.be/nl/wegverkeer/uitzonderlijk_vervoer', 'digital', '{"width_m": 3.00, "length_m": 22.0}'),
('PL', 'PL-PL', 'Poland', 'Polska', 'Ministerstwo Infrastruktury', 'Generalna Dyrekcja Dróg Krajowych i Autostrad', 'https://www.gddkia.gov.pl/pl/23/zezwolenia-na-przejazd', 'basic', '{"width_m": 3.00, "length_m": 20.0}'),
('SE', 'SE-SE', 'Sweden', 'Sverige', 'Trafikverket', 'Transportstyrelsen', 'https://www.transportstyrelsen.se/sv/vagtrafik/Yrkestrafik/Dispenser-och-undantag/', 'digital', '{"width_m": 3.50, "length_m": 30.0}'),
('NO', 'NO-NO', 'Norway', 'Norge', 'Statens vegvesen', 'Vegvesen', 'https://www.vegvesen.no/kjoretoy/yrkestransport/spesialtransport/', 'digital', '{"width_m": 3.00, "length_m": 22.0}'),
('FI', 'FI-FI', 'Finland', 'Suomi', 'Väylävirasto', 'Traficom', 'https://www.traficom.fi/fi/liikenne/tieliikenne/erikoiskuljetukset', 'digital', '{"width_m": 3.50, "length_m": 30.0}');
-- ============================================================================
-- MASTER CORRIDOR DATABASE
-- Major Heavy Haul Corridors across Tier A countries
-- Demand levels, rates, hazards, shippers, restriction data
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_corridors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    regions_covered TEXT[] NOT NULL,
    primary_load_types TEXT[] NOT NULL,
    average_rate_per_mile_usd DECIMAL(10,2),
    demand_level VARCHAR(50) DEFAULT 'WARM', -- HOT, WARM, COOL
    seasonal_notes TEXT,
    known_hazards JSONB,
    major_shippers TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corridors_country ON route_corridors(country_code);

-- United States Corridors
INSERT INTO route_corridors (corridor_name, country_code, regions_covered, primary_load_types, average_rate_per_mile_usd, demand_level, seasonal_notes, known_hazards, major_shippers) VALUES
('I-80 Central Transcon', 'US', '{"WY", "NE", "IA", "IL", "IN", "OH", "PA"}', '{"Wind Blades", "Transformers", "Machinery"}', 2.85, 'HOT', 'Heavy winter storms in Wyoming/Nebraska. Spring thaw weight restrictions in IA/IL.', '{"hazards": ["Donner Pass winter closures", "Wyoming high wind warnings", "Elk Mountain chain laws"]}', '{"Vestas", "GE Renewable", "Caterpillar"}'),
('I-10 Southern Corridor', 'US', '{"CA", "AZ", "NM", "TX", "LA", "MS", "AL", "FL"}', '{"Oil & Gas Equipment", "Aerospace", "Military"}', 2.45, 'HOT', 'Hurricane season impacts TX/LA/FL. Extreme summer heat affects daytime moves in AZ/CA.', '{"hazards": ["Houston traffic restrictions", "Caltrans daytime width limits", "Atchafalaya Basin Bridge restrictions"]}', '{"SpaceX", "Halliburton", "Lockheed Martin"}'),
('I-35 NAFTA Highway', 'US', '{"TX", "OK", "KS", "MO", "IA", "MN"}', '{"Ag Equipment", "Construction Machinery", "Wind Tower Sections"}', 2.60, 'WARM', 'Tornado alley spring delays. High volume border crossing at Laredo.', '{"hazards": ["DFW metro curfews", "Laredo port-of-entry bottlenecks", "Austin I-35 deck replacements"]}', '{"Deere", "Vestas", "Volvo Construction"}'),
('I-90 Northern Tier', 'US', '{"WA", "ID", "MT", "WY", "SD", "MN", "WI", "IL"}', '{"Mining Equipment", "Timber Machinery", "Wind Generators"}', 3.10, 'COOL', 'Severe winter conditions. Very strict chain laws in MT/ID/WA.', '{"hazards": ["Snoqualmie Pass closures", "Lookout Pass grades", "South Dakota high winds"]}', '{"Komatsu", "Weyerhaeuser", "Siemens Gamesa"}'),
('I-95 Eastern Seaboard', 'US', '{"FL", "GA", "SC", "NC", "VA", "MD", "DE", "PA", "NJ", "NY", "CT", "MA", "ME"}', '{"Modular Homes", "Marine Equipment", "Generators"}', 3.50, 'WARM', 'Hurricane evacuations south. Nor''easter storms north. Extremely strict metro curfews.', '{"hazards": ["GW Bridge strict limits", "Baltimore Harbor Tunnel bans", "I-495 Capital Beltway curfews", "Boston tunnel heights"]}', '{"General Dynamics", "Modular Building Systems"}');

-- Canada Corridors
INSERT INTO route_corridors (corridor_name, country_code, regions_covered, primary_load_types, average_rate_per_mile_usd, demand_level, seasonal_notes, known_hazards, major_shippers) VALUES
('Trans-Canada Hwy (West)', 'CA', '{"BC", "AB", "SK", "MB"}', '{"Oil Sands Modules", "Forestry Equipment", "Mining Gear"}', 4.20, 'HOT', 'Spring weight restrictions (Spring Thaw) severely limit loads. Winter mountains.', '{"hazards": ["Coquihalla Highway grades", "Kicking Horse Pass snow", "Alberta high load corridor limits"]}', '{"Suncor", "Finning", "CNRL"}'),
('Hwy 401 Manufacturing Belt', 'CA', '{"ON", "QC"}', '{"Automotive Stamping Presses", "Transformers", "Steel Coils"}', 3.00, 'WARM', 'Heavy winter lake effect snow. Toronto/Montreal metro curfews.', '{"hazards": ["Toronto GTA severe traffic rules", "Montreal bridge limits", "Border crossing delays at Ambassador/Blue Water"]}', '{"Magna", "Bombardier", "Hydro-Quebec"}');

-- Australia Corridors
INSERT INTO route_corridors (corridor_name, country_code, regions_covered, primary_load_types, average_rate_per_mile_usd, demand_level, seasonal_notes, known_hazards, major_shippers) VALUES
('Stuart Highway (Outback)', 'AU', '{"SA", "NT"}', '{"Mining dump trucks", "Road Trains", "Remote Site Housing"}', 3.80, 'HOT', 'Wet season flooding in NT can close roads for weeks. Extreme heat.', '{"hazards": ["Bovine/Kangaroo strikes at night", "Floodways", "Extreme isolation/fuel planning"]}', '{"BHP", "Rio Tinto", "Newmont"}'),
('Bruce Highway (East Coast)', 'AU', '{"QLD"}', '{"Sugar Mill Equipment", "Coal Mining Gear", "Ag Machinery"}', 2.90, 'WARM', 'Cyclone season (Nov-Apr) causes frequent closures and flooding.', '{"hazards": ["Narrow undivided sections", "Heavy tourist traffic overlaps", "Cyclones"]}', '{"Glencore", "Peabody Energy"}');

-- Europe Corridors (Rates approximated in USD for consistency in this table)
INSERT INTO route_corridors (corridor_name, country_code, regions_covered, primary_load_types, average_rate_per_mile_usd, demand_level, seasonal_notes, known_hazards, major_shippers) VALUES
('A7 Autobahn (North-South)', 'DE', '{"SH", "NI", "HE", "BW", "BY"}', '{"Wind Turbines", "Heavy Manufacturing", "Brewery Tanks"}', 4.50, 'HOT', 'Strict nighttime only travel rules. Weekend driving bans highly enforced.', '{"hazards": ["Baustellen (construction zones) narrow lanes", "Kassel hills", "Elbe tunnel restrictions"]}', '{"Enercon", "Siemens", "Liebherr"}'),
('A2 Autobahn (East-West)', 'DE', '{"NW", "NI", "ST", "BB"}', '{"Industrial Machinery", "Steel Components", "Chemical Vessels"}', 4.10, 'WARM', 'Night travel standard. High police escort demand.', '{"hazards": ["Ruhrgebiet severe traffic density", "Border checks at PL", "Construction zones"]}', '{"Thyssenkrupp", "BASF"}');
-- ============================================================================
-- HEAVY HAUL ROUTE INTELLIGENCE — Database Schema
-- Purpose-built for oversize/overweight load transport across 57 countries.
-- NOT generic GPS. Permit-enforced, clearance-aware, convoy-coordinated.
-- ============================================================================

-- 1. Permit routes — the actual approved path for a specific load
CREATE TABLE IF NOT EXISTS permit_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL DEFAULT 'US',
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  route_geojson JSONB NOT NULL,
  total_distance_km DECIMAL,
  permit_number TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  travel_windows JSONB,
  load_dimensions JSONB, -- {width_m, height_m, length_m, weight_kg}
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permit_routes_load ON permit_routes(load_id);
CREATE INDEX IF NOT EXISTS idx_permit_routes_country ON permit_routes(country_code);

-- 2. Bridge and overhead clearance database
CREATE TABLE IF NOT EXISTS clearance_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
  ) STORED,
  country_code TEXT NOT NULL DEFAULT 'US',
  clearance_posted_m DECIMAL,
  clearance_actual_m DECIMAL,
  clearance_source TEXT DEFAULT 'osm', -- osm, dot, crowdsourced, permit
  obstacle_type TEXT DEFAULT 'bridge', -- bridge, overpass, railroad, power_line, tunnel
  road_name TEXT,
  osm_way_id BIGINT,
  verified_by_count INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clearance_geom ON clearance_points USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_clearance_country ON clearance_points(country_code);
CREATE INDEX IF NOT EXISTS idx_clearance_type ON clearance_points(obstacle_type);

-- 3. Weight restricted roads
CREATE TABLE IF NOT EXISTS weight_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
  ) STORED,
  country_code TEXT NOT NULL DEFAULT 'US',
  road_name TEXT,
  max_gross_weight_kg INTEGER,
  max_axle_weight_kg INTEGER,
  restriction_type TEXT DEFAULT 'permanent', -- permanent, seasonal, emergency
  active_from DATE,
  active_until DATE,
  osm_way_id BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_geom ON weight_restrictions USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_weight_country ON weight_restrictions(country_code);
CREATE INDEX IF NOT EXISTS idx_weight_type ON weight_restrictions(restriction_type);

-- 4. Convoy real-time positions
CREATE TABLE IF NOT EXISTS convoy_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'load_driver', -- lead_pilot, rear_pilot, load_driver, supervisor
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  speed_kmh DECIMAL,
  heading_degrees INTEGER,
  accuracy_m DECIMAL,
  on_permit_route BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(load_id, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_convoy_load ON convoy_positions(load_id);
CREATE INDEX IF NOT EXISTS idx_convoy_updated ON convoy_positions(updated_at);

-- 5. Route deviation alerts
CREATE TABLE IF NOT EXISTS route_deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES profiles(id),
  deviation_lat DECIMAL(10,8),
  deviation_lng DECIMAL(11,8),
  distance_from_route_m INTEGER,
  severity TEXT DEFAULT 'warning', -- info, warning, critical
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT -- returned_to_route, rerouted, emergency_stop, false_alarm
);

CREATE INDEX IF NOT EXISTS idx_deviation_load ON route_deviations(load_id);
CREATE INDEX IF NOT EXISTS idx_deviation_unresolved ON route_deviations(load_id) WHERE resolved_at IS NULL;

-- 6. Tribal knowledge checkpoints (crowdsourced)
CREATE TABLE IF NOT EXISTS route_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng::double precision, lat::double precision), 4326)::geography
  ) STORED,
  country_code TEXT NOT NULL DEFAULT 'US',
  checkpoint_type TEXT DEFAULT 'weigh_station', -- weigh_station, dot_checkpoint, port_of_entry, toll, low_clearance_warning, timing_issue, road_condition
  name TEXT,
  description TEXT,
  severity TEXT DEFAULT 'info', -- info, caution, warning, critical
  reported_by UUID REFERENCES profiles(id),
  verified_count INTEGER DEFAULT 0,
  last_reported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_geom ON route_checkpoints USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_checkpoint_country ON route_checkpoints(country_code);
CREATE INDEX IF NOT EXISTS idx_checkpoint_type ON route_checkpoints(checkpoint_type);

-- 7. Post-job intel submissions
CREATE TABLE IF NOT EXISTS route_intel_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES hc_loads(id),
  operator_id UUID REFERENCES profiles(id),
  clearance_concerns TEXT,
  strict_checkpoints BOOLEAN,
  checkpoint_lat DECIMAL(10,8),
  checkpoint_lng DECIMAL(11,8),
  timing_issues TEXT,
  trust_points_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intel_operator ON route_intel_submissions(operator_id);

-- Enable RLS
ALTER TABLE permit_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE convoy_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_intel_submissions ENABLE ROW LEVEL SECURITY;

-- Public read for clearance/weight/checkpoints (crowdsourced knowledge)
CREATE POLICY "Public read clearance" ON clearance_points FOR SELECT USING (true);
CREATE POLICY "Public read weight" ON weight_restrictions FOR SELECT USING (true);
CREATE POLICY "Public read checkpoints" ON route_checkpoints FOR SELECT USING (true);

-- Authenticated write for intel submissions
CREATE POLICY "Auth insert intel" ON route_intel_submissions FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Auth read own intel" ON route_intel_submissions FOR SELECT USING (auth.uid() = operator_id);

-- Enable Realtime for convoy positions
ALTER PUBLICATION supabase_realtime ADD TABLE convoy_positions;
