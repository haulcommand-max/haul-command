/**
 * HAUL COMMAND — Global Geo Expansion Engine
 * Generates search queries for 57 countries to reach 100K→200K operators.
 * Prioritized by freight GDP, corridor density, and expected yield.
 */

// ═══════════════════════════════════════════════════════════════
// COUNTRY TIER SYSTEM
// ═══════════════════════════════════════════════════════════════

export interface CountryConfig {
  code: string;
  name: string;
  tier: 'A' | 'B' | 'C' | 'D';
  queriesPerRegion: number;
  languages: string[];
  keywords: string[];
  cities: string[];
  corridors: string[];
  borderCrossings: string[];
}

export const SEARCH_KEYWORDS = {
  en: [
    'pilot car service', 'escort vehicle service', 'oversize load escort',
    'wide load escort', 'heavy haul escort', 'superload escort',
    'height pole service', 'bucket truck escort', 'route survey service',
  ],
  es: ['vehiculo escolta', 'carga sobredimensionada', 'escolta de carga ancha'],
  pt: ['veículo escolta', 'carga superdimensionada', 'escolta de carga larga'],
  de: ['Begleitfahrzeug', 'Schwertransport Begleitung', 'Überbreite Ladung'],
  fr: ['véhicule pilote', 'convoi exceptionnel', 'transport exceptionnel'],
  nl: ['begeleidingsvoertuig', 'exceptioneel transport'],
  ar: ['مرافقة حمولة كبيرة', 'نقل ثقيل'],
};

// ═══════════════════════════════════════════════════════════════
// TIER A — DOMINATION MODE (80K-100K target)
// ═══════════════════════════════════════════════════════════════

const TIER_A_COUNTRIES: CountryConfig[] = [
  {
    code: 'US', name: 'United States', tier: 'A', queriesPerRegion: 120,
    languages: ['en'], keywords: SEARCH_KEYWORDS.en,
    cities: [
      'Houston', 'Dallas', 'Los Angeles', 'Chicago', 'Atlanta', 'Phoenix',
      'Denver', 'Seattle', 'Portland', 'Miami', 'Tampa', 'Jacksonville',
      'San Antonio', 'Oklahoma City', 'Memphis', 'Nashville', 'Louisville',
      'Indianapolis', 'Columbus', 'Charlotte', 'Raleigh', 'Richmond',
      'Baltimore', 'Philadelphia', 'New York', 'Boston', 'Detroit',
      'Minneapolis', 'Kansas City', 'St Louis', 'Omaha', 'Des Moines',
      'Boise', 'Salt Lake City', 'Las Vegas', 'Sacramento', 'Fresno',
      'Bakersfield', 'Tucson', 'El Paso', 'Lubbock', 'Midland',
      'New Orleans', 'Baton Rouge', 'Mobile', 'Birmingham', 'Knoxville',
      'Charleston', 'Savannah', 'Albuquerque', 'Spokane', 'Billings',
    ],
    corridors: [
      'I-10 corridor', 'I-20 corridor', 'I-40 corridor', 'I-80 corridor',
      'I-90 corridor', 'I-95 corridor', 'I-35 corridor', 'I-75 corridor',
      'I-65 corridor', 'I-70 corridor', 'I-15 corridor', 'I-5 corridor',
      'Gulf Coast corridor', 'Wind Energy corridor Texas',
      'Permian Basin corridor', 'Appalachian corridor',
    ],
    borderCrossings: ['Laredo TX', 'El Paso TX', 'Buffalo NY', 'Detroit MI', 'San Diego CA'],
  },
  {
    code: 'CA', name: 'Canada', tier: 'A', queriesPerRegion: 100,
    languages: ['en', 'fr'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.fr],
    cities: [
      'Toronto', 'Calgary', 'Edmonton', 'Vancouver', 'Winnipeg',
      'Montreal', 'Ottawa', 'Saskatoon', 'Regina', 'Halifax',
      'Thunder Bay', 'Brandon', 'Red Deer', 'Kamloops', 'Prince George',
      'Fort McMurray', 'Grande Prairie', 'Lethbridge', 'Medicine Hat',
      'London ON', 'Sudbury', 'Moncton', 'Saint John', 'Quebec City',
    ],
    corridors: ['Trans-Canada Highway', 'Highway 401 corridor', 'Alberta Oil Sands corridor'],
    borderCrossings: ['Windsor ON', 'Niagara Falls ON', 'Surrey BC'],
  },
  {
    code: 'AU', name: 'Australia', tier: 'A', queriesPerRegion: 80,
    languages: ['en'], keywords: SEARCH_KEYWORDS.en,
    cities: [
      'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
      'Darwin', 'Townsville', 'Cairns', 'Rockhampton', 'Mackay',
      'Mount Isa', 'Alice Springs', 'Kalgoorlie', 'Karratha', 'Port Hedland',
      'Newcastle', 'Wollongong', 'Geelong', 'Toowoomba', 'Launceston',
    ],
    corridors: ['Pacific Highway', 'Stuart Highway', 'Great Northern Highway', 'Pilbara mining corridor'],
    borderCrossings: [],
  },
  {
    code: 'GB', name: 'United Kingdom', tier: 'A', queriesPerRegion: 80,
    languages: ['en'], keywords: ['abnormal load escort', 'wide load escort', 'heavy haulage', 'ESDAL escort', ...SEARCH_KEYWORDS.en],
    cities: [
      'London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow',
      'Edinburgh', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol',
      'Cardiff', 'Nottingham', 'Southampton', 'Aberdeen', 'Inverness',
      'Plymouth', 'Swindon', 'Felixstowe', 'Immingham', 'Grangemouth',
    ],
    corridors: ['M1 corridor', 'M6 corridor', 'M25 corridor', 'A1 corridor'],
    borderCrossings: [],
  },
  {
    code: 'DE', name: 'Germany', tier: 'A', queriesPerRegion: 70,
    languages: ['de', 'en'], keywords: [...SEARCH_KEYWORDS.de, ...SEARCH_KEYWORDS.en],
    cities: [
      'Hamburg', 'Munich', 'Frankfurt', 'Cologne', 'Stuttgart',
      'Dusseldorf', 'Dortmund', 'Essen', 'Bremen', 'Hanover',
      'Leipzig', 'Dresden', 'Nuremberg', 'Duisburg', 'Rostock',
    ],
    corridors: ['Autobahn A1', 'Autobahn A2', 'Autobahn A7', 'Rhine corridor'],
    borderCrossings: ['Frankfurt Oder', 'Aachen', 'Basel crossing'],
  },
  {
    code: 'NL', name: 'Netherlands', tier: 'A', queriesPerRegion: 60,
    languages: ['nl', 'en'], keywords: [...SEARCH_KEYWORDS.nl, ...SEARCH_KEYWORDS.en],
    cities: ['Rotterdam', 'Amsterdam', 'The Hague', 'Eindhoven', 'Utrecht', 'Groningen', 'Maastricht'],
    corridors: ['Rotterdam port corridor', 'A2 corridor', 'A1 corridor'],
    borderCrossings: ['Venlo', 'Maastricht'],
  },
  {
    code: 'AE', name: 'UAE', tier: 'A', queriesPerRegion: 50,
    languages: ['en', 'ar'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.ar],
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Fujairah', 'Jebel Ali'],
    corridors: ['Dubai-Abu Dhabi corridor', 'Jebel Ali port corridor'],
    borderCrossings: ['Al Ain border', 'Hatta border'],
  },
  {
    code: 'BR', name: 'Brazil', tier: 'A', queriesPerRegion: 60,
    languages: ['pt'], keywords: SEARCH_KEYWORDS.pt,
    cities: [
      'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba',
      'Porto Alegre', 'Salvador', 'Recife', 'Fortaleza', 'Manaus',
      'Campinas', 'Santos', 'Vitória', 'Goiânia', 'Uberlândia',
    ],
    corridors: ['BR-101 corridor', 'BR-116 corridor', 'Santos port corridor'],
    borderCrossings: ['Foz do Iguaçu', 'Rivera', 'Chuí'],
  },
  {
    code: 'ZA', name: 'South Africa', tier: 'A', queriesPerRegion: 50,
    languages: ['en'], keywords: ['abnormal load escort', 'wide load pilot', ...SEARCH_KEYWORDS.en],
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Richards Bay'],
    corridors: ['N1 corridor', 'N2 corridor', 'N3 corridor', 'N4 corridor'],
    borderCrossings: ['Beitbridge', 'Lebombo', 'Maseru Bridge'],
  },
  {
    code: 'NZ', name: 'New Zealand', tier: 'A', queriesPerRegion: 40,
    languages: ['en'], keywords: SEARCH_KEYWORDS.en,
    cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Napier', 'New Plymouth'],
    corridors: ['State Highway 1', 'State Highway 2'],
    borderCrossings: [],
  },
];

// ═══════════════════════════════════════════════════════════════
// TIER B — EXPANSION MODE (50K-60K target)
// ═══════════════════════════════════════════════════════════════

const TIER_B_COUNTRIES: CountryConfig[] = [
  { code: 'FR', name: 'France', tier: 'B', queriesPerRegion: 50, languages: ['fr'], keywords: SEARCH_KEYWORDS.fr, cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Lille', 'Bordeaux', 'Nantes', 'Strasbourg', 'Le Havre'], corridors: ['A1 autoroute', 'A6 autoroute'], borderCrossings: [] },
  { code: 'BE', name: 'Belgium', tier: 'B', queriesPerRegion: 40, languages: ['nl', 'fr'], keywords: [...SEARCH_KEYWORDS.nl, ...SEARCH_KEYWORDS.fr], cities: ['Antwerp', 'Brussels', 'Ghent', 'Liège', 'Bruges', 'Charleroi'], corridors: ['Port of Antwerp corridor', 'E40 corridor'], borderCrossings: [] },
  { code: 'SE', name: 'Sweden', tier: 'B', queriesPerRegion: 40, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Luleå', 'Kiruna'], corridors: ['E4 highway'], borderCrossings: [] },
  { code: 'NO', name: 'Norway', tier: 'B', queriesPerRegion: 40, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Tromsø', 'Kristiansand'], corridors: ['E6 highway', 'E39 highway'], borderCrossings: [] },
  { code: 'FI', name: 'Finland', tier: 'B', queriesPerRegion: 35, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Helsinki', 'Tampere', 'Turku', 'Oulu', 'Jyväskylä'], corridors: ['E75 highway'], borderCrossings: [] },
  { code: 'DK', name: 'Denmark', tier: 'B', queriesPerRegion: 35, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'], corridors: ['E45 highway', 'Øresund bridge corridor'], borderCrossings: [] },
  { code: 'AT', name: 'Austria', tier: 'B', queriesPerRegion: 35, languages: ['de'], keywords: SEARCH_KEYWORDS.de, cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'], corridors: ['Brenner corridor'], borderCrossings: [] },
  { code: 'CH', name: 'Switzerland', tier: 'B', queriesPerRegion: 35, languages: ['de', 'fr'], keywords: [...SEARCH_KEYWORDS.de, ...SEARCH_KEYWORDS.fr], cities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'], corridors: ['Gotthard corridor'], borderCrossings: [] },
  { code: 'PL', name: 'Poland', tier: 'B', queriesPerRegion: 40, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Warsaw', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódź', 'Katowice', 'Szczecin'], corridors: ['A2 motorway', 'A1 motorway'], borderCrossings: [] },
  { code: 'MX', name: 'Mexico', tier: 'B', queriesPerRegion: 50, languages: ['es'], keywords: SEARCH_KEYWORDS.es, cities: ['Mexico City', 'Monterrey', 'Guadalajara', 'Querétaro', 'Tijuana', 'Ciudad Juárez', 'León', 'Puebla'], corridors: ['Autopista del Sol', 'NAFTA corridor'], borderCrossings: ['Nuevo Laredo', 'Ciudad Juárez', 'Tijuana'] },
  { code: 'SA', name: 'Saudi Arabia', tier: 'B', queriesPerRegion: 40, languages: ['en', 'ar'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.ar], cities: ['Riyadh', 'Jeddah', 'Dammam', 'Jubail', 'Yanbu', 'NEOM'], corridors: ['Riyadh-Dammam corridor'], borderCrossings: [] },
  { code: 'IN', name: 'India', tier: 'B', queriesPerRegion: 60, languages: ['en'], keywords: ['ODC transport', 'Over Dimensional Cargo escort', ...SEARCH_KEYWORDS.en], cities: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'], corridors: ['Delhi-Mumbai Industrial Corridor', 'Golden Quadrilateral'], borderCrossings: [] },
];

// ═══════════════════════════════════════════════════════════════
// TIER C & D — DATA HARVEST + TEST MODES
// ═══════════════════════════════════════════════════════════════

const TIER_C_COUNTRIES: CountryConfig[] = [
  { code: 'IT', name: 'Italy', tier: 'C', queriesPerRegion: 25, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Milan', 'Rome', 'Naples', 'Turin', 'Genoa', 'Bologna'], corridors: ['A1 autostrada'], borderCrossings: [] },
  { code: 'ES', name: 'Spain', tier: 'C', queriesPerRegion: 25, languages: ['es'], keywords: SEARCH_KEYWORDS.es, cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Zaragoza'], corridors: ['AP-7 corridor'], borderCrossings: [] },
  { code: 'CZ', name: 'Czech Republic', tier: 'C', queriesPerRegion: 20, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň'], corridors: ['D1 motorway'], borderCrossings: [] },
  { code: 'RO', name: 'Romania', tier: 'C', queriesPerRegion: 20, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Bucharest', 'Cluj', 'Timișoara', 'Constanța'], corridors: ['A1 motorway'], borderCrossings: [] },
  { code: 'CL', name: 'Chile', tier: 'C', queriesPerRegion: 20, languages: ['es'], keywords: SEARCH_KEYWORDS.es, cities: ['Santiago', 'Valparaíso', 'Antofagasta', 'Concepción'], corridors: ['Ruta 5'], borderCrossings: [] },
  { code: 'AR', name: 'Argentina', tier: 'C', queriesPerRegion: 20, languages: ['es'], keywords: SEARCH_KEYWORDS.es, cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza'], corridors: ['Ruta 9', 'Ruta 3'], borderCrossings: [] },
  { code: 'CO', name: 'Colombia', tier: 'C', queriesPerRegion: 20, languages: ['es'], keywords: SEARCH_KEYWORDS.es, cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'], corridors: ['Ruta del Sol'], borderCrossings: [] },
  { code: 'QA', name: 'Qatar', tier: 'C', queriesPerRegion: 15, languages: ['en', 'ar'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.ar], cities: ['Doha', 'Al Wakrah', 'Al Khor'], corridors: [], borderCrossings: [] },
  { code: 'KW', name: 'Kuwait', tier: 'C', queriesPerRegion: 15, languages: ['en', 'ar'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.ar], cities: ['Kuwait City', 'Shuwaikh'], corridors: [], borderCrossings: [] },
  { code: 'OM', name: 'Oman', tier: 'C', queriesPerRegion: 15, languages: ['en', 'ar'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.ar], cities: ['Muscat', 'Sohar', 'Salalah'], corridors: [], borderCrossings: [] },
  { code: 'NG', name: 'Nigeria', tier: 'C', queriesPerRegion: 20, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano'], corridors: [], borderCrossings: [] },
  { code: 'KE', name: 'Kenya', tier: 'C', queriesPerRegion: 15, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Nairobi', 'Mombasa', 'Eldoret'], corridors: ['Northern Corridor'], borderCrossings: [] },
];

const TIER_D_COUNTRIES: CountryConfig[] = [
  { code: 'MY', name: 'Malaysia', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru'], corridors: [], borderCrossings: [] },
  { code: 'SG', name: 'Singapore', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Singapore'], corridors: [], borderCrossings: [] },
  { code: 'TH', name: 'Thailand', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Bangkok', 'Laem Chabang'], corridors: [], borderCrossings: [] },
  { code: 'PH', name: 'Philippines', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Manila', 'Cebu', 'Davao'], corridors: [], borderCrossings: [] },
  { code: 'EG', name: 'Egypt', tier: 'D', queriesPerRegion: 10, languages: ['en', 'ar'], keywords: [...SEARCH_KEYWORDS.en, ...SEARCH_KEYWORDS.ar], cities: ['Cairo', 'Alexandria', 'Suez'], corridors: ['Suez Canal corridor'], borderCrossings: [] },
  { code: 'GH', name: 'Ghana', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Accra', 'Tema', 'Kumasi'], corridors: [], borderCrossings: [] },
  { code: 'TZ', name: 'Tanzania', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Dar es Salaam', 'Dodoma'], corridors: [], borderCrossings: [] },
  { code: 'PE', name: 'Peru', tier: 'D', queriesPerRegion: 10, languages: ['es'], keywords: SEARCH_KEYWORDS.es, cities: ['Lima', 'Callao', 'Arequipa'], corridors: [], borderCrossings: [] },
  { code: 'JP', name: 'Japan', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Tokyo', 'Osaka', 'Nagoya', 'Yokohama'], corridors: [], borderCrossings: [] },
  { code: 'KR', name: 'South Korea', tier: 'D', queriesPerRegion: 10, languages: ['en'], keywords: SEARCH_KEYWORDS.en, cities: ['Seoul', 'Busan', 'Incheon'], corridors: [], borderCrossings: [] },
];

// ═══════════════════════════════════════════════════════════════
// ALL COUNTRIES
// ═══════════════════════════════════════════════════════════════

export const ALL_COUNTRIES: CountryConfig[] = [
  ...TIER_A_COUNTRIES,
  ...TIER_B_COUNTRIES,
  ...TIER_C_COUNTRIES,
  ...TIER_D_COUNTRIES,
];

// ═══════════════════════════════════════════════════════════════
// QUERY GENERATOR
// ═══════════════════════════════════════════════════════════════

export interface SearchQuery {
  query: string;
  countryCode: string;
  countryName: string;
  tier: 'A' | 'B' | 'C' | 'D';
  type: 'city' | 'corridor' | 'border';
  priority: number; // 1-100
}

export function generateQueriesForCountry(config: CountryConfig): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const tierPriority = { A: 100, B: 70, C: 40, D: 15 };

  // City × keyword combinations
  for (const city of config.cities) {
    for (const keyword of config.keywords.slice(0, config.queriesPerRegion > 50 ? 9 : 5)) {
      queries.push({
        query: `${keyword} ${city} ${config.name}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        type: 'city',
        priority: tierPriority[config.tier],
      });
    }
  }

  // Corridor × keyword combinations
  for (const corridor of config.corridors) {
    for (const keyword of config.keywords.slice(0, 3)) {
      queries.push({
        query: `${keyword} near ${corridor}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        type: 'corridor',
        priority: tierPriority[config.tier] - 5,
      });
    }
  }

  // Border crossings
  for (const border of config.borderCrossings) {
    for (const keyword of config.keywords.slice(0, 2)) {
      queries.push({
        query: `${keyword} ${border}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        type: 'border',
        priority: tierPriority[config.tier] - 10,
      });
    }
  }

  return queries;
}

export function generateAllQueries(): SearchQuery[] {
  const all: SearchQuery[] = [];
  for (const country of ALL_COUNTRIES) {
    all.push(...generateQueriesForCountry(country));
  }
  return all.sort((a, b) => b.priority - a.priority);
}

// ═══════════════════════════════════════════════════════════════
// YIELD ESTIMATION & DIMINISHING RETURNS
// ═══════════════════════════════════════════════════════════════

export function estimateYield(queries: SearchQuery[]): {
  totalQueries: number;
  estimatedOperators: number;
  estimatedCostUsd: number;
  byTier: Record<string, { queries: number; estimatedOperators: number }>;
} {
  const avgResultsPerQuery = 8;
  const dedupeRate = 0.35;
  const costPerQuery = 0.017;

  const byTier: Record<string, { queries: number; estimatedOperators: number }> = {};
  for (const q of queries) {
    if (!byTier[q.tier]) byTier[q.tier] = { queries: 0, estimatedOperators: 0 };
    byTier[q.tier].queries++;
    byTier[q.tier].estimatedOperators += avgResultsPerQuery * (1 - dedupeRate);
  }

  const totalQueries = queries.length;
  const rawEstimate = totalQueries * avgResultsPerQuery;
  const estimatedOperators = Math.round(rawEstimate * (1 - dedupeRate));
  const estimatedCostUsd = Math.round(totalQueries * costPerQuery * 100) / 100;

  return { totalQueries, estimatedOperators, estimatedCostUsd, byTier };
}

// ═══════════════════════════════════════════════════════════════
// SELF-EXPANDING GEO ENGINE
// ═══════════════════════════════════════════════════════════════

export function detectExpansionOpportunities(
  operatorCounts: Record<string, number>,
  demandSignals: Record<string, number>
): string[] {
  const expansions: string[] = [];

  for (const [region, demand] of Object.entries(demandSignals)) {
    const supply = operatorCounts[region] || 0;
    const ratio = supply > 0 ? demand / supply : demand;

    if (ratio > 3) {
      expansions.push(region);
    }
  }

  return expansions;
}
