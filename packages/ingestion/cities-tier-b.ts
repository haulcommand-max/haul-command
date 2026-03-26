/**
 * HAUL COMMAND — Tier B (Blue) Cities: 18 Countries
 * 🇮🇪 IE · 🇸🇪 SE · 🇳🇴 NO · 🇩🇰 DK · 🇫🇮 FI · 🇧🇪 BE · 🇦🇹 AT · 🇨🇭 CH
 * 🇪🇸 ES · 🇫🇷 FR · 🇮🇹 IT · 🇵🇹 PT · 🇸🇦 SA · 🇶🇦 QA · 🇲🇽 MX · 🇮🇳 IN · 🇮🇩 ID · 🇹🇭 TH
 */

import type { CountryConfig } from './geo-expansion-v2';
import {
  KEYWORDS_EN, KEYWORDS_ES, KEYWORDS_FR, KEYWORDS_DE, KEYWORDS_NL,
  KEYWORDS_AR, KEYWORDS_IT, KEYWORDS_PT, KEYWORDS_IN,
} from './keywords';

export const TIER_B: CountryConfig[] = [
  {
    code: 'IE', name: 'Ireland', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Dublin','Cork','Limerick','Galway','Waterford','Killarney','Drogheda','Dundalk','Shannon','Rosslare'],
    corridors: ['M1 motorway','M7 motorway','N18 corridor','M6 motorway'],
    borderCrossings: ['Newry border','Dundalk border'],
  },
  {
    code: 'SE', name: 'Sweden', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Stockholm','Gothenburg','Malmö','Uppsala','Luleå','Kiruna','Norrköping','Sundsvall','Umeå','Gävle','Jönköping','Helsingborg'],
    corridors: ['E4 highway','E6 highway','E20 highway','Kiruna mining corridor'],
    borderCrossings: ['Helsingborg-Helsingør','Malmö-Copenhagen Øresund'],
  },
  {
    code: 'NO', name: 'Norway', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Oslo','Bergen','Stavanger','Trondheim','Tromsø','Kristiansand','Drammen','Ålesund','Haugesund','Bodø','Hammerfest','Narvik'],
    corridors: ['E6 highway','E39 highway','E18 highway','North Sea oil corridor'],
    borderCrossings: ['Svinesund','Ørje'],
  },
  {
    code: 'DK', name: 'Denmark', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Copenhagen','Aarhus','Odense','Aalborg','Esbjerg','Randers','Kolding','Horsens','Vejle','Fredericia','Herning'],
    corridors: ['E45 highway','Øresund bridge corridor','Storebælt corridor','E20 highway'],
    borderCrossings: ['Padborg','Rødby-Puttgarden'],
  },
  {
    code: 'FI', name: 'Finland', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Helsinki','Tampere','Turku','Oulu','Jyväskylä','Kuopio','Lahti','Kouvola','Pori','Vaasa','Rovaniemi','Kotka'],
    corridors: ['E75 highway','E12 highway','Helsinki-Tampere corridor'],
    borderCrossings: ['Vaalimaa','Nuijamaa','Tornio'],
  },
  {
    code: 'BE', name: 'Belgium', tier: 'B',
    languages: ['nl', 'fr'], keywords: [...KEYWORDS_NL, ...KEYWORDS_FR],
    cities: ['Antwerp','Brussels','Ghent','Liège','Bruges','Charleroi','Namur','Mons','Mechelen','Hasselt','Zeebrugge','Ostend'],
    corridors: ['Port of Antwerp corridor','E40 corridor','E17 corridor','E313 corridor','Albert Canal corridor'],
    borderCrossings: ['Hazeldonk','Eynatten'],
  },
  {
    code: 'AT', name: 'Austria', tier: 'B',
    languages: ['de'], keywords: KEYWORDS_DE,
    cities: ['Vienna','Graz','Linz','Salzburg','Innsbruck','Klagenfurt','Villach','Wels','St Pölten','Bregenz'],
    corridors: ['Brenner corridor','A1 Westautobahn','A2 Südautobahn','Danube corridor'],
    borderCrossings: ['Brenner Pass','Nickelsdorf','Kufstein'],
  },
  {
    code: 'CH', name: 'Switzerland', tier: 'B',
    languages: ['de', 'fr'], keywords: [...KEYWORDS_DE, ...KEYWORDS_FR],
    cities: ['Zurich','Geneva','Basel','Bern','Lausanne','Winterthur','Lucerne','St Gallen','Lugano','Biel'],
    corridors: ['Gotthard corridor','A1 motorway','A2 motorway','Rhine corridor'],
    borderCrossings: ['Basel border','Chiasso','Kreuzlingen'],
  },
  {
    code: 'ES', name: 'Spain', tier: 'B',
    languages: ['es'], keywords: KEYWORDS_ES,
    cities: ['Madrid','Barcelona','Valencia','Seville','Bilbao','Zaragoza','Málaga','Murcia','Vigo','Gijón',
      'A Coruña','Algeciras','Tarragona','Cartagena','Cádiz','Huelva','Santander','Pamplona','Castellón'],
    corridors: ['AP-7 corridor','A-2 corridor','A-4 corridor','Mediterranean corridor','Ebro corridor'],
    borderCrossings: ['La Junquera','Irún','Gibraltar'],
  },
  {
    code: 'FR', name: 'France', tier: 'B',
    languages: ['fr'], keywords: KEYWORDS_FR,
    cities: ['Paris','Lyon','Marseille','Toulouse','Lille','Bordeaux','Nantes','Strasbourg','Le Havre',
      'Rouen','Nice','Montpellier','Rennes','Reims','Dunkirk','Dijon','Clermont-Ferrand','Tours','Brest','Calais','Fos-sur-Mer'],
    corridors: ['A1 autoroute','A6 autoroute','A7 autoroute','A10 autoroute','Seine axis corridor','Rhône corridor'],
    borderCrossings: ['Calais tunnel','Ventimiglia','Hendaye','Bâle-Mulhouse'],
  },
  {
    code: 'IT', name: 'Italy', tier: 'B',
    languages: ['it', 'en'], keywords: [...KEYWORDS_IT, ...KEYWORDS_EN],
    cities: ['Milan','Rome','Naples','Turin','Genoa','Bologna','Venice','Florence','Bari','Catania',
      'Palermo','Trieste','Ravenna','Livorno','Taranto','La Spezia','Salerno','Gioia Tauro','Ancona'],
    corridors: ['A1 autostrada','A4 autostrada','A14 autostrada','Brenner-Rome corridor','Genoa port corridor'],
    borderCrossings: ['Brenner Pass','Ventimiglia','Chiasso','Tarvisio'],
  },
  {
    code: 'PT', name: 'Portugal', tier: 'B',
    languages: ['pt'], keywords: KEYWORDS_PT,
    cities: ['Lisbon','Porto','Sines','Setúbal','Leixões','Aveiro','Braga','Faro','Coimbra','Funchal','Évora'],
    corridors: ['A1 autoestrada','A2 autoestrada','Sines port corridor','IP5 corridor'],
    borderCrossings: ['Vilar Formoso','Valença','Elvas'],
  },
  {
    code: 'SA', name: 'Saudi Arabia', tier: 'B',
    languages: ['en', 'ar'], keywords: [...KEYWORDS_EN, ...KEYWORDS_AR],
    cities: ['Riyadh','Jeddah','Dammam','Jubail','Yanbu','NEOM','Ras Tanura','Al Khobar','Dhahran',
      'Tabuk','Jazan','Madinah','Rabigh','Ras Al Khair'],
    corridors: ['Riyadh-Dammam corridor','Riyadh-Jeddah corridor','NEOM corridor','Eastern Province industrial corridor'],
    borderCrossings: ['King Fahd Causeway','Al Batha border'],
  },
  {
    code: 'QA', name: 'Qatar', tier: 'B',
    languages: ['en', 'ar'], keywords: [...KEYWORDS_EN, ...KEYWORDS_AR],
    cities: ['Doha','Al Wakrah','Al Khor','Lusail','Ras Laffan','Mesaieed','Dukhan','Umm Said'],
    corridors: ['Al Khor industrial corridor','Ras Laffan corridor','Lusail corridor'],
    borderCrossings: ['Abu Samra border'],
  },
  {
    code: 'MX', name: 'Mexico', tier: 'B',
    languages: ['es'], keywords: KEYWORDS_ES,
    cities: ['Mexico City','Monterrey','Guadalajara','Querétaro','Tijuana','Ciudad Juárez','León','Puebla',
      'Saltillo','San Luis Potosí','Aguascalientes','Veracruz','Manzanillo','Lázaro Cárdenas','Tampico',
      'Chihuahua','Hermosillo','Mazatlán','Torreón','Guanajuato','Celaya'],
    corridors: ['Autopista del Sol','NAFTA corridor','Bajío industrial corridor','Manzanillo port corridor'],
    borderCrossings: ['Nuevo Laredo','Ciudad Juárez','Tijuana','Nogales','Piedras Negras','Matamoros'],
  },
  {
    code: 'IN', name: 'India', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_IN,
    cities: ['Mumbai','Delhi','Chennai','Kolkata','Bangalore','Hyderabad','Pune','Ahmedabad','Surat','Jaipur',
      'Vadodara','Visakhapatnam','Coimbatore','Kochi','Nagpur','Indore','Bhopal','Ludhiana','Rajkot',
      'Kandla','Mundra','JNPT Navi Mumbai','Haldia','Mangalore','Paradip','Ennore','Krishnapatnam'],
    corridors: ['Delhi-Mumbai Industrial Corridor','Golden Quadrilateral','NH44 corridor',
      'Dedicated Freight Corridor','Sagarmala coastal corridor','NH48 corridor'],
    borderCrossings: ['Attari','Petrapole','Moreh'],
  },
  {
    code: 'ID', name: 'Indonesia', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Jakarta','Surabaya','Semarang','Bandung','Medan','Makassar','Balikpapan','Palembang',
      'Cilegon','Cilacap','Dumai','Batam','Bontang','Tanjung Priok'],
    corridors: ['Java Northern Corridor','Trans-Java Toll Road','Trans-Sumatra corridor'],
    borderCrossings: [],
  },
  {
    code: 'TH', name: 'Thailand', tier: 'B',
    languages: ['en'], keywords: KEYWORDS_EN,
    cities: ['Bangkok','Laem Chabang','Map Ta Phut','Chonburi','Rayong','Nakhon Ratchasima',
      'Chiang Mai','Songkhla','Hat Yai','Surat Thani','Khon Kaen','Udon Thani'],
    corridors: ['Eastern Seaboard corridor','EEC corridor','Thailand-Laos freight corridor'],
    borderCrossings: ['Sadao','Nong Khai','Mukdahan','Aranyaprathet'],
  },
];
