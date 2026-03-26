/**
 * HAUL COMMAND — Tier A (Gold) Cities: 10 Countries
 * 🇺🇸 US · 🇨🇦 CA · 🇦🇺 AU · 🇬🇧 GB · 🇳🇿 NZ · 🇿🇦 ZA · 🇩🇪 DE · 🇳🇱 NL · 🇦🇪 AE · 🇧🇷 BR
 * US has 220+ cities — every metro, energy hub, port, corridor anchor
 */

import type { CountryConfig } from './geo-expansion-v2';
import { KEYWORDS_EN, KEYWORDS_DE, KEYWORDS_NL, KEYWORDS_AR, KEYWORDS_PT, KEYWORDS_FR, KEYWORDS_GB, KEYWORDS_ZA } from './keywords';

export const TIER_A: CountryConfig[] = [
  {
    code: 'US', name: 'United States', tier: 'A',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: [
      // Texas (energy + freight capital)
      'Houston TX','Dallas TX','San Antonio TX','Fort Worth TX','Austin TX','El Paso TX',
      'Lubbock TX','Midland TX','Odessa TX','Amarillo TX','Corpus Christi TX','Laredo TX',
      'McAllen TX','Brownsville TX','Beaumont TX','Tyler TX','Waco TX','Abilene TX',
      'Longview TX','Victoria TX','Lufkin TX','Big Spring TX','San Angelo TX',
      // Oklahoma + Kansas
      'Oklahoma City OK','Tulsa OK','Lawton OK','Enid OK','Wichita KS','Topeka KS','Salina KS',
      // Louisiana + Mississippi
      'New Orleans LA','Baton Rouge LA','Shreveport LA','Lake Charles LA','Lafayette LA','Monroe LA',
      'Jackson MS','Gulfport MS','Hattiesburg MS','Meridian MS',
      // Southeast
      'Atlanta GA','Savannah GA','Augusta GA','Macon GA','Albany GA','Valdosta GA',
      'Birmingham AL','Mobile AL','Montgomery AL','Huntsville AL','Tuscaloosa AL','Dothan AL',
      'Nashville TN','Memphis TN','Knoxville TN','Chattanooga TN','Jackson TN','Cookeville TN',
      'Charlotte NC','Raleigh NC','Greensboro NC','Wilmington NC','Fayetteville NC','Asheville NC',
      'Charleston SC','Columbia SC','Greenville SC','Florence SC',
      'Jacksonville FL','Miami FL','Tampa FL','Orlando FL','Fort Myers FL','Pensacola FL',
      'Tallahassee FL','Daytona Beach FL','Gainesville FL','Panama City FL',
      // Mid-Atlantic + Northeast
      'Richmond VA','Norfolk VA','Roanoke VA','Lynchburg VA','Winchester VA',
      'Baltimore MD','Hagerstown MD','Salisbury MD',
      'Philadelphia PA','Pittsburgh PA','Harrisburg PA','Allentown PA','Erie PA','Scranton PA','Williamsport PA',
      'New York NY','Buffalo NY','Syracuse NY','Albany NY','Rochester NY','Utica NY',
      'Newark NJ','Trenton NJ','Camden NJ',
      'Boston MA','Springfield MA','Worcester MA',
      'Hartford CT','Bridgeport CT','New Haven CT',
      'Providence RI','Portland ME','Burlington VT','Concord NH','Dover DE',
      'Washington DC',
      // Midwest
      'Chicago IL','Springfield IL','Peoria IL','Rockford IL','Champaign IL','Decatur IL',
      'Indianapolis IN','Fort Wayne IN','Evansville IN','South Bend IN','Terre Haute IN',
      'Detroit MI','Grand Rapids MI','Lansing MI','Saginaw MI','Traverse City MI','Marquette MI',
      'Columbus OH','Cleveland OH','Cincinnati OH','Toledo OH','Akron OH','Youngstown OH','Dayton OH',
      'Milwaukee WI','Madison WI','Green Bay WI','La Crosse WI','Eau Claire WI',
      'Minneapolis MN','Duluth MN','Rochester MN','St Cloud MN',
      'St Louis MO','Kansas City MO','Springfield MO','Joplin MO','Columbia MO',
      'Louisville KY','Lexington KY','Bowling Green KY','Paducah KY','Owensboro KY',
      'Charleston WV','Huntington WV','Morgantown WV',
      // Plains + Mountain
      'Omaha NE','Lincoln NE','North Platte NE','Scottsbluff NE',
      'Des Moines IA','Cedar Rapids IA','Davenport IA','Sioux City IA','Waterloo IA',
      'Sioux Falls SD','Rapid City SD','Aberdeen SD',
      'Fargo ND','Bismarck ND','Williston ND','Minot ND','Dickinson ND',
      'Denver CO','Colorado Springs CO','Grand Junction CO','Pueblo CO','Greeley CO',
      'Cheyenne WY','Casper WY','Gillette WY','Rock Springs WY',
      'Billings MT','Great Falls MT','Missoula MT','Bozeman MT','Miles City MT',
      // Southwest
      'Phoenix AZ','Tucson AZ','Flagstaff AZ','Yuma AZ','Prescott AZ',
      'Albuquerque NM','Las Cruces NM','Roswell NM','Farmington NM','Carlsbad NM',
      'Las Vegas NV','Reno NV','Elko NV','Winnemucca NV',
      'Salt Lake City UT','St George UT','Vernal UT','Price UT',
      // Pacific
      'Los Angeles CA','San Diego CA','San Francisco CA','Sacramento CA','Fresno CA',
      'Bakersfield CA','Stockton CA','Modesto CA','Redding CA','San Jose CA','Riverside CA',
      'Portland OR','Eugene OR','Medford OR','Bend OR','Pendleton OR','Coos Bay OR',
      'Seattle WA','Spokane WA','Tacoma WA','Yakima WA','Bellingham WA','Tri-Cities WA','Moses Lake WA',
      // Non-contiguous
      'Anchorage AK','Fairbanks AK','Juneau AK',
      'Honolulu HI','Kahului HI',
      // Idaho
      'Boise ID','Idaho Falls ID','Twin Falls ID','Pocatello ID','Lewiston ID',
    ],
    corridors: [
      'I-10 corridor','I-20 corridor','I-30 corridor','I-40 corridor','I-44 corridor',
      'I-70 corridor','I-80 corridor','I-90 corridor','I-94 corridor','I-95 corridor',
      'I-35 corridor','I-75 corridor','I-65 corridor','I-55 corridor','I-15 corridor',
      'I-5 corridor','I-25 corridor','I-81 corridor','I-64 corridor','I-85 corridor',
      'Gulf Coast corridor','Permian Basin corridor','Bakken oil corridor',
      'Wind Energy corridor Texas','Wind Energy corridor Iowa','Wind Energy corridor Oklahoma',
      'Appalachian corridor','US Route 2 corridor','Coal corridor Wyoming',
      'Port of Houston corridor','Port of Long Beach corridor','Port of Savannah corridor',
    ],
    borderCrossings: [
      'Laredo TX','El Paso TX','Buffalo NY','Detroit MI','San Diego CA',
      'Blaine WA','Sweetgrass MT','Portal ND','Pembina ND','Champlain NY',
    ],
  },
  {
    code: 'CA', name: 'Canada', tier: 'A',
    languages: ['en', 'fr'], keywords: [...KEYWORDS_EN, ...KEYWORDS_FR],
    cities: [
      'Toronto ON','Calgary AB','Edmonton AB','Vancouver BC','Winnipeg MB',
      'Montreal QC','Ottawa ON','Saskatoon SK','Regina SK','Halifax NS',
      'Thunder Bay ON','Brandon MB','Red Deer AB','Kamloops BC','Prince George BC',
      'Fort McMurray AB','Grande Prairie AB','Lethbridge AB','Medicine Hat AB',
      'London ON','Sudbury ON','Moncton NB','Saint John NB','Quebec City QC',
      'Hamilton ON','Windsor ON','Kitchener ON','Barrie ON','Kingston ON',
      'Sault Ste Marie ON','North Bay ON','Kenora ON','Lloydminster AB',
      'Dawson Creek BC','Fort St John BC','Fort Nelson BC','Williams Lake BC',
      'Kelowna BC','Cranbrook BC','Nanaimo BC','Victoria BC',
      'Fredericton NB','Charlottetown PE','St Johns NL','Corner Brook NL',
      'Yellowknife NT','Whitehorse YT',
    ],
    corridors: ['Trans-Canada Highway','Highway 401 corridor','Highway 1 BC corridor',
      'Alberta Oil Sands corridor','Highway 63 corridor','Highway 2 AB corridor',
      'Highway 97 BC corridor','Alaska Highway corridor'],
    borderCrossings: ['Windsor ON','Niagara Falls ON','Surrey BC','Emerson MB','Coutts AB'],
  },
  {
    code: 'AU', name: 'Australia', tier: 'A',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: [
      'Sydney NSW','Melbourne VIC','Brisbane QLD','Perth WA','Adelaide SA',
      'Darwin NT','Townsville QLD','Cairns QLD','Rockhampton QLD','Mackay QLD',
      'Mount Isa QLD','Alice Springs NT','Kalgoorlie WA','Karratha WA','Port Hedland WA',
      'Newcastle NSW','Wollongong NSW','Geelong VIC','Toowoomba QLD','Launceston TAS',
      'Hobart TAS','Gladstone QLD','Bundaberg QLD','Emerald QLD','Dubbo NSW',
      'Broken Hill NSW','Whyalla SA','Port Augusta SA','Geraldton WA','Albany WA',
      'Broome WA','Newman WA','Tom Price WA','Dampier WA',
    ],
    corridors: ['Pacific Highway','Stuart Highway','Great Northern Highway',
      'Pilbara mining corridor','Hume Highway','Pacific Motorway',
      'Bruce Highway','Western Highway','Great Western Highway'],
    borderCrossings: [],
  },
  {
    code: 'GB', name: 'United Kingdom', tier: 'A',
    languages: ['en'], keywords: KEYWORDS_GB,
    cities: [
      'London','Birmingham','Manchester','Leeds','Glasgow','Edinburgh',
      'Liverpool','Newcastle','Sheffield','Bristol','Cardiff','Nottingham',
      'Southampton','Aberdeen','Inverness','Plymouth','Swindon','Felixstowe',
      'Immingham','Grangemouth','Hull','Middlesbrough','Stoke on Trent',
      'Coventry','Leicester','Derby','Swansea','Newport','Belfast','Derry',
    ],
    corridors: ['M1 corridor','M6 corridor','M25 corridor','A1 corridor',
      'M62 corridor','M4 corridor','M5 corridor','M74 corridor','A9 corridor'],
    borderCrossings: [],
  },
  {
    code: 'NZ', name: 'New Zealand', tier: 'A',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: [
      'Auckland','Wellington','Christchurch','Hamilton','Tauranga','Dunedin',
      'Napier','New Plymouth','Palmerston North','Rotorua','Whangarei',
      'Invercargill','Nelson','Timaru','Queenstown','Gisborne',
    ],
    corridors: ['State Highway 1 North Island','State Highway 1 South Island','State Highway 2'],
    borderCrossings: [],
  },
  {
    code: 'ZA', name: 'South Africa', tier: 'A',
    languages: ['en'], keywords: KEYWORDS_ZA,
    cities: [
      'Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth','Bloemfontein',
      'East London','Richards Bay','Nelspruit','Polokwane','Rustenburg',
      'Pietermaritzburg','Kimberley','Upington','Saldanha Bay','Middelburg',
      'Witbank','George','Mossel Bay','Vereeniging',
    ],
    corridors: ['N1 corridor','N2 corridor','N3 corridor','N4 corridor',
      'N7 corridor','N12 corridor','Maputo corridor'],
    borderCrossings: ['Beitbridge','Lebombo','Maseru Bridge','Ficksburg','Oshoek'],
  },
  {
    code: 'DE', name: 'Germany', tier: 'A',
    languages: ['de', 'en'], keywords: [...KEYWORDS_DE, ...KEYWORDS_EN],
    cities: [
      'Hamburg','Munich','Frankfurt','Cologne','Stuttgart','Dusseldorf',
      'Dortmund','Essen','Bremen','Hanover','Leipzig','Dresden','Nuremberg',
      'Duisburg','Rostock','Mannheim','Karlsruhe','Kiel','Lubeck',
      'Bremerhaven','Wolfsburg','Kassel','Magdeburg','Erfurt',
    ],
    corridors: ['Autobahn A1','Autobahn A2','Autobahn A7','Autobahn A3',
      'Rhine corridor','North Sea port corridor','Autobahn A9'],
    borderCrossings: ['Frankfurt Oder','Aachen','Basel crossing','Kiefersfelden','Passau'],
  },
  {
    code: 'NL', name: 'Netherlands', tier: 'A',
    languages: ['nl', 'en'], keywords: [...KEYWORDS_NL, ...KEYWORDS_EN],
    cities: [
      'Rotterdam','Amsterdam','The Hague','Eindhoven','Utrecht','Groningen',
      'Maastricht','Tilburg','Breda','Nijmegen','Enschede','Vlissingen','Dordrecht',
    ],
    corridors: ['Rotterdam port corridor','A2 corridor','A1 corridor','A4 corridor',
      'Europoort corridor','Maasvlakte corridor'],
    borderCrossings: ['Venlo','Maastricht','Hook of Holland'],
  },
  {
    code: 'AE', name: 'UAE', tier: 'A',
    languages: ['en', 'ar'], keywords: [...KEYWORDS_EN, ...KEYWORDS_AR],
    cities: [
      'Dubai','Abu Dhabi','Sharjah','Ras Al Khaimah','Fujairah','Jebel Ali',
      'Ajman','Umm Al Quwain','Ruwais','Khalifa Port','Mussafah',
    ],
    corridors: ['Dubai-Abu Dhabi corridor','Jebel Ali port corridor',
      'E11 corridor','ICAD industrial corridor'],
    borderCrossings: ['Al Ain border','Hatta border','Khatm Al Shiklah'],
  },
  {
    code: 'BR', name: 'Brazil', tier: 'A',
    languages: ['pt'], keywords: KEYWORDS_PT,
    cities: [
      'São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre',
      'Salvador','Recife','Fortaleza','Manaus','Campinas','Santos','Vitória',
      'Goiânia','Uberlândia','Ribeirão Preto','Joinville','Londrina','Maringá',
      'Belém','São Luís','Natal','Maceió','Aracaju','Cuiabá','Campo Grande',
      'Macaé','Paranaguá','Itajaí','Rio Grande','São José dos Campos',
    ],
    corridors: ['BR-101 corridor','BR-116 corridor','BR-153 corridor',
      'Santos port corridor','Dutra Highway corridor','BR-364 corridor'],
    borderCrossings: ['Foz do Iguaçu','Rivera','Chuí','Uruguaiana'],
  },
];
