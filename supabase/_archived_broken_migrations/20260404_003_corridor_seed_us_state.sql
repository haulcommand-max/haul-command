-- Haul Command Corridor OS — State Layer Seed
-- Migration: 20260404_003_corridor_seed_us_state.sql
-- Depends on: 20260404_002_corridor_seed_us.sql
-- Coverage: ~60 U.S. state + regional corridors (oil, auto, port, wind, solar, intermodal)
-- Strategy: INSERT ... ON CONFLICT DO NOTHING (idempotent)

begin;

insert into public.hc_corridors (
  corridor_code, slug, name, short_name,
  status, corridor_type, tier, country_code,
  origin_country_code, origin_region_code, origin_city_name,
  destination_country_code, destination_region_code, destination_city_name,
  is_cross_border, distance_miles, typical_mode,
  search_volume_estimate, commercial_value_estimate
) values

-- ── TEXAS state corridors ─────────────────────────────────────────────────────────

('US_HOUSTONTX_DALLASTX','houston-to-dallas-tx',
 'Houston to Dallas Heavy Haul Corridor','Houston–Dallas TX',
 'active','country_spine','regional','US',
 'US','TX','Houston','US','TX','Dallas',
 false,240,'road',8200,1600000),

('US_HOUSTONTX_SANANTONIOX','houston-to-san-antonio-tx',
 'Houston to San Antonio Corridor','Houston–San Antonio',
 'active','country_spine','regional','US',
 'US','TX','Houston','US','TX','San Antonio',
 false,197,'road',5800,1100000),

('US_DALLASTX_ELPASOTX','dallas-to-el-paso-tx',
 'Dallas to El Paso Corridor (I-20/I-10)','Dallas–El Paso',
 'active','country_spine','regional','US',
 'US','TX','Dallas','US','TX','El Paso',
 false,617,'road',4200,860000),

('US_VICTORIATTX_LAREDOTX','victoria-to-laredo-tx',
 'Victoria to Laredo Energy Corridor','Victoria–Laredo',
 'active','industrial_connector','regional','US',
 'US','TX','Victoria','US','TX','Laredo',
 false,185,'road',3100,780000),

('US_PORTARTHURTX_HOUSTONTX','port-arthur-to-houston-tx',
 'Port Arthur to Houston Refinery Corridor','Port Arthur–Houston',
 'active','port_connector','regional','US',
 'US','TX','Port Arthur','US','TX','Houston',
 false,88,'road',4900,1200000),

('US_MIDLANDTX_ABILENETX','permian-to-abilene-tx',
 'Permian Basin to Abilene Corridor','Permian–Abilene',
 'active','industrial_connector','regional','US',
 'US','TX','Midland','US','TX','Abilene',
 false,150,'road',3400,890000),

-- ── CALIFORNIA state corridors ──────────────────────────────────────────────────

('US_PORTLALBCA_CENTRALVALLEYCA','la-ports-to-central-valley-ca',
 'Port of LA/LB to Central Valley Corridor','LA Ports–Central Valley',
 'active','port_connector','regional','US',
 'US','CA','Los Angeles','US','CA','Fresno',
 false,220,'road',6200,1100000),

('US_PORTLALBCA_LASVEGASNV','la-ports-to-las-vegas-nv',
 'Port of LA/LB to Las Vegas Distribution Corridor','LA Ports–Las Vegas',
 'active','port_connector','regional','US',
 'US','CA','Los Angeles','US','NV','Las Vegas',
 false,292,'road',5100,920000),

('US_PORTOAKLANDCA_SACRAMENTOCA','port-oakland-to-sacramento-ca',
 'Port of Oakland to Sacramento Corridor','Oakland–Sacramento',
 'active','port_connector','regional','US',
 'US','CA','Oakland','US','CA','Sacramento',
 false,88,'road',4400,800000),

('US_SACRAMENTOCA_RENONA','sacramento-to-reno-nv',
 'Sacramento to Reno Corridor (I-80)','Sacramento–Reno',
 'active','country_spine','regional','US',
 'US','CA','Sacramento','US','NV','Reno',
 false,134,'road',4000,720000),

-- ── LOUISIANA / GULF STATE corridors ───────────────────────────────────────────

('US_BATONROUGELA_LAKECHARLESLA','baton-rouge-to-lake-charles-la',
 'Baton Rouge to Lake Charles Petrochemical Corridor','BR–Lake Charles',
 'active','industrial_connector','regional','US',
 'US','LA','Baton Rouge','US','LA','Lake Charles',
 false,130,'road',5800,1400000),

('US_PORTNOORLEANSLA_BATONROUGELA','port-nola-to-baton-rouge-la',
 'Port of New Orleans to Baton Rouge River Corridor','NOLA–Baton Rouge',
 'active','port_connector','regional','US',
 'US','LA','New Orleans','US','LA','Baton Rouge',
 false,80,'road',4700,1050000),

('US_MORGANCITYLA_NEWORLEANSLA','morgan-city-to-nola-la',
 'Morgan City Offshore Staging Corridor','Morgan City–NOLA',
 'active','industrial_connector','regional','US',
 'US','LA','Morgan City','US','LA','New Orleans',
 false,77,'road',3200,900000),

-- ── GEORGIA / SOUTHEAST corridors ──────────────────────────────────────────────

('US_ATLANTAGA_CHATANOOGATN','atlanta-to-chattanooga-ga-tn',
 'Atlanta to Chattanooga Auto Manufacturing Corridor','Atlanta–Chattanooga',
 'active','industrial_connector','regional','US',
 'US','GA','Atlanta','US','TN','Chattanooga',
 false,115,'road',4100,820000),

('US_PORTOFBRUNCWICKGA_ATLANTAGA','port-brunswick-to-atlanta-ga',
 'Port of Brunswick to Atlanta Corridor','Brunswick–Atlanta',
 'active','port_connector','regional','US',
 'US','GA','Brunswick','US','GA','Atlanta',
 false,290,'road',3600,720000),

('US_ATLANTAGA_BIRMINGHAMAL','atlanta-to-birmingham-ga-al',
 'Atlanta to Birmingham Industrial Corridor','Atlanta–Birmingham',
 'active','industrial_connector','regional','US',
 'US','GA','Atlanta','US','AL','Birmingham',
 false,150,'road',3200,640000),

-- ── SOUTHEAST port/industrial corridors ─────────────────────────────────────────

('US_PORTOFMOBILEAL_BIRMINGHAMAL','port-mobile-to-birmingham-al',
 'Port of Mobile to Birmingham Steel Corridor','Mobile–Birmingham',
 'active','port_connector','regional','US',
 'US','AL','Mobile','US','AL','Birmingham',
 false,265,'road',3800,760000),

('US_PORTOFCHARLESTONSC_GREENVILLES','port-charleston-to-greenville-sc',
 'Port of Charleston to Greenville Auto Corridor','Charleston–Greenville SC',
 'active','port_connector','regional','US',
 'US','SC','Charleston','US','SC','Greenville',
 false,230,'road',3400,680000),

('US_PORTOFWILMINGTONNC_RALEIGHNC','port-wilmington-to-raleigh-nc',
 'Port of Wilmington to Raleigh Corridor','Wilmington–Raleigh NC',
 'active','port_connector','regional','US',
 'US','NC','Wilmington','US','NC','Raleigh',
 false,130,'road',2900,580000),

-- ── MIDWEST industrial corridors ──────────────────────────────────────────────────

('US_CHICAGOIL_DETROITMI','chicago-to-detroit-il-mi',
 'Chicago to Detroit Auto Alley Connector','Chicago–Detroit',
 'active','industrial_connector','regional','US',
 'US','IL','Chicago','US','MI','Detroit',
 false,285,'road',5100,1000000),

('US_DETROITMI_CLEVELANDOH','detroit-to-cleveland-mi-oh',
 'Detroit to Cleveland Manufacturing Corridor','Detroit–Cleveland',
 'active','industrial_connector','regional','US',
 'US','MI','Detroit','US','OH','Cleveland',
 false,170,'road',3700,740000),

('US_CLEVELANDOH_PITTSBURGHPA','cleveland-to-pittsburgh-oh-pa',
 'Cleveland to Pittsburgh Steel Corridor (I-76/I-376)','Cleveland–Pittsburgh',
 'active','industrial_connector','regional','US',
 'US','OH','Cleveland','US','PA','Pittsburgh',
 false,130,'road',3200,640000),

('US_INDIANAPOLISIND_CHICAGOIL','indianapolis-to-chicago-in-il',
 'Indianapolis to Chicago Logistics Corridor','Indy–Chicago',
 'active','country_spine','regional','US',
 'US','IN','Indianapolis','US','IL','Chicago',
 false,180,'road',4200,830000),

('US_STLOUISMO_NASHVILLETN','st-louis-to-nashville-mo-tn',
 'St. Louis to Nashville Corridor (I-24/I-64)','St Louis–Nashville',
 'active','country_spine','regional','US',
 'US','MO','St. Louis','US','TN','Nashville',
 false,312,'road',3500,690000),

('US_MUSKEGONMI_CHICAGOIL','great-lakes-steel-mi-il',
 'Great Lakes Steel & Energy Corridor (MI to IL)','Great Lakes Steel Corridor',
 'active','industrial_connector','regional','US',
 'US','MI','Muskegon','US','IL','Chicago',
 false,185,'road',2800,620000),

-- ── OHIO VALLEY / APPALACHIAN corridors ───────────────────────────────────────

('US_LOUISVILLEKKY_NASHVILLETN','louisville-to-nashville-ky-tn',
 'Louisville to Nashville Auto Corridor (I-65)','Louisville–Nashville',
 'active','industrial_connector','regional','US',
 'US','KY','Louisville','US','TN','Nashville',
 false,175,'road',3800,750000),

('US_NASHVILLETN_MEMPHISNTN','nashville-to-memphis-tn',
 'Nashville to Memphis I-40 Corridor','Nashville–Memphis',
 'active','country_spine','regional','US',
 'US','TN','Nashville','US','TN','Memphis',
 false,210,'road',3600,720000),

-- ── I-81 APPALACHIAN corridor ──────────────────────────────────────────────────

('US_KNOXVILLETN_ROANOKEVA','i-81-appalachian-tn-va',
 'I-81 Appalachian Corridor — Knoxville to Roanoke','I-81 Appal TN–VA',
 'active','country_spine','regional','US',
 'US','TN','Knoxville','US','VA','Roanoke',
 false,300,'road',3100,620000),

('US_ROANOKEVA_HARRISBURGPA','i-81-appalachian-va-pa',
 'I-81 Appalachian Corridor — Roanoke to Harrisburg','I-81 Appal VA–PA',
 'active','country_spine','regional','US',
 'US','VA','Roanoke','US','PA','Harrisburg',
 false,280,'road',2900,580000),

-- ── NORTHEAST PORT corridors ────────────────────────────────────────────────────

('US_PORTOFBALTIFOREMD_PITTSBURGPA','port-baltimore-to-pittsburgh-md-pa',
 'Port of Baltimore to Pittsburgh Corridor','Baltimore–Pittsburgh',
 'active','port_connector','regional','US',
 'US','MD','Baltimore','US','PA','Pittsburgh',
 false,248,'road',3200,640000),

('US_PORTOFPHILADELPIA_ALLENTONPA','port-philly-to-allentown-pa',
 'Port of Philadelphia to Allentown Industrial Corridor','Philly–Allentown PA',
 'active','port_connector','regional','US',
 'US','PA','Philadelphia','US','PA','Allentown',
 false,60,'road',2700,540000),

('US_PORTOFNYNJNJ_BUFFALONE','port-ny-nj-to-buffalo-ny',
 'Port of NY/NJ to Buffalo Distribution Corridor','NY/NJ Port–Buffalo',
 'active','port_connector','regional','US',
 'US','NJ','Newark','US','NY','Buffalo',
 false,392,'road',3400,680000),

-- ── WIND ENERGY state corridors ──────────────────────────────────────────────

('US_AMARILLOTX_OKLAHOMACITYOK','wind-energy-tx-panhandle-ok',
 'Wind Energy Corridor — TX Panhandle to Oklahoma City','TX Panhandle Wind–OKC',
 'active','industrial_connector','regional','US',
 'US','TX','Amarillo','US','OK','Oklahoma City',
 false,262,'road',5100,1300000),

('US_OKLAHOMACITYOK_WICHITAKS','wind-energy-ok-to-ks',
 'Wind Energy Corridor — Oklahoma City to Wichita','OKC–Wichita Wind',
 'active','industrial_connector','regional','US',
 'US','OK','Oklahoma City','US','KS','Wichita',
 false,157,'road',4200,1100000),

('US_WICIHITAKS_DESMOINESIA','wind-energy-ks-to-ia',
 'Wind Energy Corridor — Wichita to Des Moines','KS–Iowa Wind',
 'active','industrial_connector','regional','US',
 'US','KS','Wichita','US','IA','Des Moines',
 false,342,'road',3800,980000),

('US_BISMARCKND_SILOUXFALLSSD','wind-energy-nd-to-sd',
 'Wind Energy Corridor — Bismarck to Sioux Falls','ND–SD Wind Corridor',
 'active','industrial_connector','regional','US',
 'US','ND','Bismarck','US','SD','Sioux Falls',
 false,280,'road',3200,850000),

-- ── SOLAR / RENEWABLE SW state corridors ─────────────────────────────────────

('US_TUCSONAZ_ELPASOTX','solar-az-to-el-paso-tx',
 'Southwest Solar Corridor — Tucson to El Paso','Tucson–El Paso Solar',
 'active','industrial_connector','regional','US',
 'US','AZ','Tucson','US','TX','El Paso',
 false,318,'road',3600,900000),

('US_LASVEGAS NV_BARSTOWCA','solar-nv-to-barstow-ca',
 'Desert Renewable Energy Corridor — Las Vegas to Barstow','LV–Barstow Solar',
 'active','industrial_connector','regional','US',
 'US','NV','Las Vegas','US','CA','Barstow',
 false,162,'road',3100,780000),

-- ── ENERGY / OIL regional corridors (non-TX) ──────────────────────────────────

('US_CASPAPRWY_BILLINSGMT','bakken-casper-to-billings-wy-mt',
 'Bakken / Powder River Basin — Casper to Billings','Casper–Billings Energy',
 'active','industrial_connector','regional','US',
 'US','WY','Casper','US','MT','Billings',
 false,228,'road',3500,920000),

('US_WILLISTONND_BISMARCKND','bakken-williston-to-bismarck-nd',
 'Bakken Oilfield — Williston to Bismarck Corridor','Bakken ND Intrastate',
 'active','industrial_connector','regional','US',
 'US','ND','Williston','US','ND','Bismarck',
 false,214,'road',3800,1000000),

('US_ANCHORAGEAK_FAIRBANKSAK','alaska-energy-anchorage-fairbanks',
 'Alaska Energy Corridor — Anchorage to Fairbanks (Parks Hwy)','Alaska ANC–FAI',
 'active','industrial_connector','regional','US',
 'US','AK','Anchorage','US','AK','Fairbanks',
 false,360,'road',2200,950000),

-- ── WEST COAST port/intermodal corridors ─────────────────────────────────────────

('US_PORTOFSEATLWA_SPOKANEWA','port-seattle-to-spokane-wa',
 'Port of Seattle to Spokane East-West Corridor','Seattle–Spokane WA',
 'active','port_connector','regional','US',
 'US','WA','Seattle','US','WA','Spokane',
 false,290,'road',3100,620000),

('US_PORTTACOMAWA_PORTLANDOR','port-tacoma-to-portland-or',
 'Port of Tacoma to Portland Corridor (I-5)','Tacoma–Portland',
 'active','port_connector','regional','US',
 'US','WA','Tacoma','US','OR','Portland',
 false,155,'road',3800,760000),

('US_PORTLANDOR_EUGENOR','portland-to-eugene-or',
 'Portland to Eugene Industrial Corridor','Portland–Eugene OR',
 'active','country_spine','regional','US',
 'US','OR','Portland','US','OR','Eugene',
 false,111,'road',2700,540000),

('US_PORTLANDOR_BOISEIDS','portland-to-boise-or-id',
 'Portland to Boise Corridor (I-84)','Portland–Boise',
 'active','country_spine','regional','US',
 'US','OR','Portland','US','ID','Boise',
 false,425,'road',3200,640000),

-- ── MOUNTAIN WEST state corridors ──────────────────────────────────────────────

('US_SALTLAKECITYUT_LASVEGASNV','slc-to-las-vegas-ut-nv',
 'Salt Lake City to Las Vegas Corridor (I-15)','SLC–Las Vegas',
 'active','country_spine','regional','US',
 'US','UT','Salt Lake City','US','NV','Las Vegas',
 false,420,'road',4600,900000),

('US_SALTLAKECITYUT_DENVERCOL','slc-to-denver-ut-co',
 'Salt Lake City to Denver Mountain Corridor (I-70/US-40)','SLC–Denver',
 'active','country_spine','regional','US',
 'US','UT','Salt Lake City','US','CO','Denver',
 false,530,'road',4100,820000),

('US_DENVERCOL_COLORADOSPRINCO','denver-to-colorado-springs-co',
 'Denver to Colorado Springs Industrial Corridor (I-25)','Denver–Colorado Springs',
 'active','country_spine','regional','US',
 'US','CO','Denver','US','CO','Colorado Springs',
 false,70,'road',3300,660000),

('US_DENVERCOL_GRANDJUNCTCOL','denver-to-grand-junction-co',
 'Denver to Grand Junction Energy Corridor (I-70)','Denver–Grand Junction',
 'active','industrial_connector','regional','US',
 'US','CO','Denver','US','CO','Grand Junction',
 false,248,'road',3000,780000),

-- ── FLORIDA state corridors ────────────────────────────────────────────────────

('US_JACKSONVILLEFL_TAMPAFL','jacksonville-to-tampa-fl',
 'Jacksonville to Tampa I-75 Corridor','Jacksonville–Tampa FL',
 'active','country_spine','regional','US',
 'US','FL','Jacksonville','US','FL','Tampa',
 false,200,'road',4400,880000),

('US_TAMPAFL_MIAMIFL','tampa-to-miami-fl',
 'Tampa to Miami I-75/I-95 Corridor','Tampa–Miami FL',
 'active','country_spine','regional','US',
 'US','FL','Tampa','US','FL','Miami',
 false,280,'road',4100,820000),

('US_PORTEVERGLADESFL_ORLANDOFL','port-everglades-to-orlando-fl',
 'Port Everglades to Orlando Distribution Corridor','Port Everglades–Orlando',
 'active','port_connector','regional','US',
 'US','FL','Fort Lauderdale','US','FL','Orlando',
 false,220,'road',3600,720000),

-- ── PLAINS / AGRICULTURAL corridors ───────────────────────────────────────────

('US_OMAHANE_KANSASCITYMO','omaha-to-kc-agricultural-ne-mo',
 'Omaha to Kansas City Agricultural Corridor (I-29/I-35)','Omaha–KC Ag Corridor',
 'active','industrial_connector','regional','US',
 'US','NE','Omaha','US','MO','Kansas City',
 false,188,'road',3100,620000),

('US_DESMOINESIA_MINNEAPOLISMN','des-moines-to-minneapolis-ia-mn',
 'Des Moines to Minneapolis Corridor (I-35)','Des Moines–Minneapolis',
 'active','country_spine','regional','US',
 'US','IA','Des Moines','US','MN','Minneapolis',
 false,243,'road',3400,680000),

('US_MINNEAPOLISMN_DULLUTHMN','twin-cities-to-duluth-mn',
 'Twin Cities to Duluth Mining Corridor (I-35N)','Minneapolis–Duluth',
 'active','industrial_connector','regional','US',
 'US','MN','Minneapolis','US','MN','Duluth',
 false,150,'road',2800,560000),

on conflict (corridor_code) do nothing;

-- Compute scores for all newly seeded corridors
select public.hc_score_all_corridors();

commit;
