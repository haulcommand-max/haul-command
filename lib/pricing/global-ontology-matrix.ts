/**
 * HAUL COMMAND GLOBAL SYSTEM ARCHITECTURE
 * Core Ontology Matrix, Country Archetypes, and Role Aliases
 * Defines the 12 global archetypes and canonical roles to standardize pricing models globally.
 */

// ----------------------------------------------------
// 1. THE 12 COUNTRY ARCHETYPES
// ----------------------------------------------------
export const GLOBAL_ARCHETYPES = {
  NA_PEVO: {
    id: 'na_pevo',
    name: 'North America PEVO Archetype',
    countries: ['US', 'CA', 'PR'], // United States, Canada, Puerto Rico
    coreTerms: ['Pilot car', 'Escort vehicle', 'High pole', 'Route survey'],
    pricingMechanism: 'Market-driven range + permit modifiers',
  },
  UK_IRE_AIL: {
    id: 'uk_ire_ail',
    name: 'UK / Ireland Abnormal Load Archetype',
    countries: ['GB', 'IE'], // UK, Ireland
    coreTerms: ['Abnormal indivisible load', 'Self escort', 'Private escort'],
    pricingMechanism: 'Police notification framework, hourly/daily',
  },
  AU_NZ_OSOM: {
    id: 'au_nz_osom',
    name: 'Australia / New Zealand OSOM Archetype',
    countries: ['AU', 'NZ'], // Australia, New Zealand
    coreTerms: ['Oversize-overmass', 'Pilot vehicle', 'NHVR conditions'],
    pricingMechanism: 'Level 1/Level 2 credentialing + km rate',
  },
  GERMAN_BF: {
    id: 'german_bf',
    name: 'German BF Archetype',
    countries: ['DE', 'AT', 'CH', 'PL', 'CZ', 'HU', 'SK', 'SI'], // DACH + Eastern EU influence
    coreTerms: ['Schwertransport', 'Begleitfahrzeug', 'BF3', 'BF4'],
    pricingMechanism: 'Federal guideline + delegated traffic control',
  },
  ROMANCE_EU_TECHNICAL: {
    id: 'romance_eu_technical',
    name: 'Romance Europe Technical Escort Archetype',
    countries: ['FR', 'IT', 'ES', 'PT', 'RO', 'BG', 'GR', 'HR'], // Romance EU + Med
    coreTerms: ['Convoi exceptionnel', 'Scorta tecnica', 'Coche piloto'],
    pricingMechanism: 'Strict technical escort + convoy authority',
  },
  DUTCH_BENELUX: {
    id: 'dutch_benelux',
    name: 'Dutch / Benelux Exceptional Transport',
    countries: ['NL', 'BE', 'LU', 'DK', 'SE', 'NO', 'FI', 'EE', 'LV', 'LT'], // Benelux + Nordics/Baltics
    coreTerms: ['Exceptioneel transport', 'Transport guidance', 'Specialtransport'],
    pricingMechanism: 'High-density mixed language guidance',
  },
  BRAZIL_AET: {
    id: 'brazil_aet',
    name: 'Brazil AET + Escolta Archetype',
    countries: ['BR'], // Brazil
    coreTerms: ['AET permit', 'PRF oversight', 'Escolta de cargas'],
    pricingMechanism: 'AET + State highway patrol dependency',
  },
  LATAM_ESPECIAL: {
    id: 'latam_especial',
    name: 'Spanish-speaking LatAm Transporte Especial',
    countries: ['MX', 'AR', 'CO', 'CL', 'PE', 'EC', 'UY', 'PY', 'VE', 'BO', 'GT', 'CR', 'PA', 'DO', 'HN', 'SV', 'NI'], // Rest of LatAm
    coreTerms: ['Transporte especial', 'Vehículo piloto', 'Coche guía'],
    pricingMechanism: 'Corridor-by-corridor negotiation',
  },
  INDIA_ODC: {
    id: 'india_odc',
    name: 'India ODC Archetype',
    countries: ['IN', 'BD', 'LK', 'NP', 'PK'], // Subcontinent
    coreTerms: ['Over Dimensional Cargo', 'Project cargo'],
    pricingMechanism: 'State-border clearing + route spotting',
  },
  EAST_ASIA_SPECIAL: {
    id: 'east_asia_special',
    name: 'East Asia Special Transport',
    countries: ['JP', 'KR', 'TW', 'CN', 'HK', 'MN'], // East Asia
    coreTerms: ['Special transport', 'Over-limit transport', '誘導車'],
    pricingMechanism: 'Strict curfew-based urban clearing',
  },
  GULF_BILINGUAL: {
    id: 'gulf_bilingual',
    name: 'Gulf Bilingual Heavy Transport',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'EG', 'JO', 'LB', 'IQ'], // Middle East & MENA North
    coreTerms: ['Heavy transport permit', 'Arabic/English project cargo'],
    pricingMechanism: 'Massive infrastructure corridor pricing',
  },
  EMERGING_MIXED: {
    id: 'emerging_mixed',
    name: 'Emerging Africa/Caribbean/Pacific Mixed',
    countries: [
      // Africa
      'ZA', 'NG', 'KE', 'MA', 'DZ', 'TN', 'GH', 'TZ', 'UG', 'AO', 'MZ', 'ZM', 'ZW', 'BW', 'NA', 'SN', 'CI', 'CM',
      // SE Asia / Pacific
      'PH', 'MY', 'ID', 'TH', 'VN', 'SG', 'KH', 'MM', 'PG', 'FJ',
      // Central Asia / Eurasia
      'TR', 'KZ', 'UZ', 'GE', 'AZ', 'AM', 'CY',
      // Caribbean / Others
      'JM', 'TT', 'BS', 'BB', 'GY', 'SR', 'BZ'
    ], // Totaling exactly the remaining footprint for 120 countries
    coreTerms: ['Abnormal load', 'Special transport', 'Police convoy'],
    pricingMechanism: 'Ad-hoc project cargo security & escort',
  }
};

// ----------------------------------------------------
// 2. MASTER ROLE ONTOLOGY (Canonical Base)
// ----------------------------------------------------
export const MASTER_ROLES = [
  // A. Demand-side
  { id: 'shipper', canonical: 'Shipper', category: 'demand' },
  { id: 'project_cargo_owner', canonical: 'Project Cargo Owner', category: 'demand' },
  { id: 'epc_contractor', canonical: 'EPC Contractor', category: 'demand' },
  { id: 'oem_manufacturer', canonical: 'OEM / Manufacturer', category: 'demand' },
  // B. Transport-execution
  { id: 'heavy_haul_carrier', canonical: 'Heavy Haul Carrier', category: 'execution' },
  { id: 'spmt_provider', canonical: 'SPMT Provider', category: 'execution' },
  { id: 'dispatch_coordinator', canonical: 'Dispatch Coordinator', category: 'execution' },
  // C. Escort / Roadside-control
  { id: 'pilot_car_operator', canonical: 'Pilot Car Operator', category: 'escort' },
  { id: 'high_pole_escort', canonical: 'High-Pole Escort', category: 'escort' },
  { id: 'bf3_escort', canonical: 'BF3 Escort', category: 'escort' },
  { id: 'police_escort_unit', canonical: 'Police Escort Unit', category: 'escort' },
  // D. Permit / Regulatory
  { id: 'permit_expediter', canonical: 'Permit Expediter', category: 'permit' },
  { id: 'route_surveyor', canonical: 'Route Surveyor', category: 'permit' },
  // E. Field / Infrastructure
  { id: 'bucket_truck_escort', canonical: 'Bucket-Truck Escort', category: 'field' },
  { id: 'crane_crew', canonical: 'Crane Crew', category: 'field' },
  // F. Port / Border
  { id: 'port_logistics_coord', canonical: 'Port Logistics Coordinator', category: 'port' },
  // G. Commercial
  { id: 'freight_broker', canonical: 'Freight Broker', category: 'commercial' },
  // H. Platform
  { id: 'escort_trainer', canonical: 'Escort Trainer', category: 'platform' }
];

// ----------------------------------------------------
// 3. GLOBAL ALIAS DICTIONARY (Resolution Engine)
// ----------------------------------------------------
export const ALIAS_DICTIONARY = [
  {
    globalTerm: 'Pilot Car Operator',
    aliases: [
      { term: 'Pilot Car', regions: ['US', 'CA'], regulated: true },
      { term: 'Escort Vehicle', regions: ['US', 'CA', 'AU'], regulated: true },
      { term: 'Flag Car', regions: ['US (Legacy)'], regulated: false },
      { term: 'Abnormal Load Escort', regions: ['GB', 'IE'], regulated: true },
      { term: 'OSOM Pilot', regions: ['AU', 'NZ'], regulated: true },
      { term: 'Begleitfahrzeug', regions: ['DE', 'AT'], regulated: true },
      { term: 'BF3', regions: ['DE'], regulated: true, police_powers: false },
      { term: 'BF4', regions: ['DE'], regulated: true, police_powers: true },
      { term: 'Convoi Exceptionnel', regions: ['FR'], regulated: true },
      { term: 'Scorta Tecnica', regions: ['IT'], regulated: true },
      { term: 'Coche Piloto', regions: ['ES', 'MX', 'AR'], regulated: true },
      { term: 'Escolta de Cargas', regions: ['BR'], regulated: true },
      { term: 'ODC Escort', regions: ['IN'], regulated: false }
    ]
  }
];

export function resolveAliasToCanonical(localTerm: string): string {
  for (const entry of ALIAS_DICTIONARY) {
    if (entry.aliases.some(a => a.term.toLowerCase() === localTerm.toLowerCase())) {
      return entry.globalTerm;
    }
  }
  return 'Unknown Role';
}
