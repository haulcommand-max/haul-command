// ══════════════════════════════════════════════════════════════
// 57-COUNTRY LOCALIZATION CONFIGURATION
// Master config for all country-specific SEO, voice, and content
// ══════════════════════════════════════════════════════════════

export interface CountryConfig {
  code: string;
  name: string;
  nameLocal: string;
  tier: 'A' | 'B' | 'C' | 'D';
  languages: string[];
  primaryLanguage: string;
  searchEngines: { name: string; share: number }[];
  haroEquivalent: string[];
  wikipediaEditions: string[];
  govDomainPattern: string;
  govTransportAgency: string;
  govTransportUrl: string;
  timezone: string;
  callingCode: string;
  privacyLaw: string;
  escortTerminology: string[];
  currency: string;
}

export const COUNTRY_CONFIGS: CountryConfig[] = [
  // ── TIER A — GOLD (10) ─────────────────────────────────
  {
    code: 'US', name: 'United States', nameLocal: 'United States', tier: 'A',
    languages: ['en'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 87 }, { name: 'Bing', share: 7 }],
    haroEquivalent: ['HARO', 'Qwoted', 'ProfNet', 'Muck Rack'],
    wikipediaEditions: ['en'], govDomainPattern: '.gov',
    govTransportAgency: 'FMCSA / State DOTs', govTransportUrl: 'https://www.fmcsa.dot.gov',
    timezone: 'America/New_York', callingCode: '+1', privacyLaw: 'CCPA/State Laws',
    escortTerminology: ['pilot car', 'escort vehicle', 'oversize load escort', 'flagging vehicle'],
    currency: 'USD',
  },
  {
    code: 'CA', name: 'Canada', nameLocal: 'Canada', tier: 'A',
    languages: ['en', 'fr'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 92 }, { name: 'Bing', share: 5 }],
    haroEquivalent: ['HARO', 'SourceBottle'],
    wikipediaEditions: ['en', 'fr'], govDomainPattern: '.gc.ca',
    govTransportAgency: 'Transport Canada', govTransportUrl: 'https://tc.canada.ca',
    timezone: 'America/Toronto', callingCode: '+1', privacyLaw: 'PIPEDA',
    escortTerminology: ['pilot vehicle', 'escort vehicle', 'wide load escort'],
    currency: 'CAD',
  },
  {
    code: 'AU', name: 'Australia', nameLocal: 'Australia', tier: 'A',
    languages: ['en'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 94 }, { name: 'Bing', share: 3.5 }],
    haroEquivalent: ['SourceBottle', 'Qwoted'],
    wikipediaEditions: ['en'], govDomainPattern: '.gov.au',
    govTransportAgency: 'NHVR', govTransportUrl: 'https://www.nhvr.gov.au',
    timezone: 'Australia/Sydney', callingCode: '+61', privacyLaw: 'Privacy Act 1988',
    escortTerminology: ['pilot vehicle', 'escort vehicle', 'OSOM escort'],
    currency: 'AUD',
  },
  {
    code: 'GB', name: 'United Kingdom', nameLocal: 'United Kingdom', tier: 'A',
    languages: ['en'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 93 }, { name: 'Bing', share: 4 }],
    haroEquivalent: ['ResponseSource', 'Muck Rack'],
    wikipediaEditions: ['en'], govDomainPattern: '.gov.uk',
    govTransportAgency: 'DVSA', govTransportUrl: 'https://www.gov.uk/dvsa',
    timezone: 'Europe/London', callingCode: '+44', privacyLaw: 'UK GDPR / DPA 2018',
    escortTerminology: ['escort vehicle', 'abnormal load escort', 'wide load pilot'],
    currency: 'GBP',
  },
  {
    code: 'NZ', name: 'New Zealand', nameLocal: 'New Zealand', tier: 'A',
    languages: ['en'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 95 }, { name: 'Bing', share: 3 }],
    haroEquivalent: ['SourceBottle'],
    wikipediaEditions: ['en'], govDomainPattern: '.govt.nz',
    govTransportAgency: 'Waka Kotahi NZTA', govTransportUrl: 'https://www.nzta.govt.nz',
    timezone: 'Pacific/Auckland', callingCode: '+64', privacyLaw: 'Privacy Act 2020',
    escortTerminology: ['pilot vehicle', 'escort vehicle', 'overweight permit escort'],
    currency: 'NZD',
  },
  {
    code: 'ZA', name: 'South Africa', nameLocal: 'South Africa', tier: 'A',
    languages: ['en', 'af', 'zu'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 91 }, { name: 'Bing', share: 4 }],
    haroEquivalent: ['ResponseSource'],
    wikipediaEditions: ['en'], govDomainPattern: '.gov.za',
    govTransportAgency: 'DoT SA', govTransportUrl: 'https://www.transport.gov.za',
    timezone: 'Africa/Johannesburg', callingCode: '+27', privacyLaw: 'POPIA',
    escortTerminology: ['pilot vehicle', 'escort vehicle', 'abnormal load escort'],
    currency: 'ZAR',
  },
  {
    code: 'DE', name: 'Germany', nameLocal: 'Deutschland', tier: 'A',
    languages: ['de'], primaryLanguage: 'de',
    searchEngines: [{ name: 'Google', share: 90 }, { name: 'Bing', share: 5 }],
    haroEquivalent: ['Presseportal.de', 'ResponseSource DACH'],
    wikipediaEditions: ['de'], govDomainPattern: '.de',
    govTransportAgency: 'BAG', govTransportUrl: 'https://www.bag.bund.de',
    timezone: 'Europe/Berlin', callingCode: '+49', privacyLaw: 'GDPR + BDSG',
    escortTerminology: ['Begleitfahrzeug', 'Schwertransportbegleitung', 'BF3'],
    currency: 'EUR',
  },
  {
    code: 'NL', name: 'Netherlands', nameLocal: 'Nederland', tier: 'A',
    languages: ['nl'], primaryLanguage: 'nl',
    searchEngines: [{ name: 'Google', share: 93 }, { name: 'Bing', share: 4 }],
    haroEquivalent: ['ResponseSource'],
    wikipediaEditions: ['nl'], govDomainPattern: '.nl',
    govTransportAgency: 'RDW', govTransportUrl: 'https://www.rdw.nl',
    timezone: 'Europe/Amsterdam', callingCode: '+31', privacyLaw: 'GDPR + UAVG',
    escortTerminology: ['begeleidingsvoertuig', 'exceptioneel transport begeleiding'],
    currency: 'EUR',
  },
  {
    code: 'AE', name: 'United Arab Emirates', nameLocal: 'الإمارات', tier: 'A',
    languages: ['ar', 'en'], primaryLanguage: 'en',
    searchEngines: [{ name: 'Google', share: 96 }, { name: 'Bing', share: 2 }],
    haroEquivalent: ['Meltwater MENA'],
    wikipediaEditions: ['en', 'ar'], govDomainPattern: '.gov.ae',
    govTransportAgency: 'MoIAT', govTransportUrl: 'https://www.moiat.gov.ae',
    timezone: 'Asia/Dubai', callingCode: '+971', privacyLaw: 'PDPL',
    escortTerminology: ['escort vehicle', 'pilot car', 'مركبة مرافقة'],
    currency: 'AED',
  },
  {
    code: 'BR', name: 'Brazil', nameLocal: 'Brasil', tier: 'A',
    languages: ['pt'], primaryLanguage: 'pt',
    searchEngines: [{ name: 'Google', share: 97 }, { name: 'Bing', share: 1.5 }],
    haroEquivalent: ['Meltwater'],
    wikipediaEditions: ['pt'], govDomainPattern: '.gov.br',
    govTransportAgency: 'ANTT', govTransportUrl: 'https://www.gov.br/antt',
    timezone: 'America/Sao_Paulo', callingCode: '+55', privacyLaw: 'LGPD',
    escortTerminology: ['veículo de escolta', 'batedor', 'carga superdimensionada'],
    currency: 'BRL',
  },
  // ── TIER B — BLUE (18) ─────────────────────────────────
  { code: 'IE', name: 'Ireland', nameLocal: 'Éire', tier: 'B', languages: ['en', 'ga'], primaryLanguage: 'en', searchEngines: [{ name: 'Google', share: 94 }], haroEquivalent: ['ResponseSource'], wikipediaEditions: ['en'], govDomainPattern: '.gov.ie', govTransportAgency: 'TII', govTransportUrl: 'https://www.tii.ie', timezone: 'Europe/Dublin', callingCode: '+353', privacyLaw: 'GDPR', escortTerminology: ['escort vehicle', 'abnormal load pilot'], currency: 'EUR' },
  { code: 'SE', name: 'Sweden', nameLocal: 'Sverige', tier: 'B', languages: ['sv'], primaryLanguage: 'sv', searchEngines: [{ name: 'Google', share: 94 }], haroEquivalent: ['Cision Nordic'], wikipediaEditions: ['sv'], govDomainPattern: '.se', govTransportAgency: 'Trafikverket', govTransportUrl: 'https://www.trafikverket.se', timezone: 'Europe/Stockholm', callingCode: '+46', privacyLaw: 'GDPR', escortTerminology: ['eskortfordon', 'ledsagningsfordon'], currency: 'SEK' },
  { code: 'NO', name: 'Norway', nameLocal: 'Norge', tier: 'B', languages: ['no'], primaryLanguage: 'no', searchEngines: [{ name: 'Google', share: 93 }], haroEquivalent: ['Cision Nordic'], wikipediaEditions: ['no'], govDomainPattern: '.no', govTransportAgency: 'Statens vegvesen', govTransportUrl: 'https://www.vegvesen.no', timezone: 'Europe/Oslo', callingCode: '+47', privacyLaw: 'GDPR', escortTerminology: ['følgebil', 'ledsagerbil'], currency: 'NOK' },
  { code: 'DK', name: 'Denmark', nameLocal: 'Danmark', tier: 'B', languages: ['da'], primaryLanguage: 'da', searchEngines: [{ name: 'Google', share: 95 }], haroEquivalent: ['Cision Nordic'], wikipediaEditions: ['da'], govDomainPattern: '.dk', govTransportAgency: 'Vejdirektoratet', govTransportUrl: 'https://www.vejdirektoratet.dk', timezone: 'Europe/Copenhagen', callingCode: '+45', privacyLaw: 'GDPR', escortTerminology: ['ledsagebil', 'specialtransport'], currency: 'DKK' },
  { code: 'FI', name: 'Finland', nameLocal: 'Suomi', tier: 'B', languages: ['fi'], primaryLanguage: 'fi', searchEngines: [{ name: 'Google', share: 96 }], haroEquivalent: ['Cision Nordic'], wikipediaEditions: ['fi'], govDomainPattern: '.fi', govTransportAgency: 'Traficom', govTransportUrl: 'https://www.traficom.fi', timezone: 'Europe/Helsinki', callingCode: '+358', privacyLaw: 'GDPR', escortTerminology: ['saattoauto', 'erikoiskuljetuksen saatto'], currency: 'EUR' },
  { code: 'BE', name: 'Belgium', nameLocal: 'België', tier: 'B', languages: ['nl', 'fr', 'de'], primaryLanguage: 'nl', searchEngines: [{ name: 'Google', share: 93 }], haroEquivalent: ['ResponseSource'], wikipediaEditions: ['nl', 'fr'], govDomainPattern: '.be', govTransportAgency: 'FOD Mobiliteit', govTransportUrl: 'https://mobilit.belgium.be', timezone: 'Europe/Brussels', callingCode: '+32', privacyLaw: 'GDPR', escortTerminology: ['begeleidingsvoertuig', 'véhicule d\'escorte'], currency: 'EUR' },
  { code: 'AT', name: 'Austria', nameLocal: 'Österreich', tier: 'B', languages: ['de'], primaryLanguage: 'de', searchEngines: [{ name: 'Google', share: 93 }], haroEquivalent: ['ResponseSource DACH'], wikipediaEditions: ['de'], govDomainPattern: '.gv.at', govTransportAgency: 'ASFINAG', govTransportUrl: 'https://www.asfinag.at', timezone: 'Europe/Vienna', callingCode: '+43', privacyLaw: 'GDPR + DSG', escortTerminology: ['Begleitfahrzeug', 'Schwertransportbegleitung'], currency: 'EUR' },
  { code: 'CH', name: 'Switzerland', nameLocal: 'Schweiz', tier: 'B', languages: ['de', 'fr', 'it'], primaryLanguage: 'de', searchEngines: [{ name: 'Google', share: 92 }], haroEquivalent: ['ResponseSource DACH'], wikipediaEditions: ['de', 'fr', 'it'], govDomainPattern: '.admin.ch', govTransportAgency: 'ASTRA', govTransportUrl: 'https://www.astra.admin.ch', timezone: 'Europe/Zurich', callingCode: '+41', privacyLaw: 'nDSG', escortTerminology: ['Begleitfahrzeug', 'véhicule d\'escorte'], currency: 'CHF' },
  { code: 'ES', name: 'Spain', nameLocal: 'España', tier: 'B', languages: ['es'], primaryLanguage: 'es', searchEngines: [{ name: 'Google', share: 96 }], haroEquivalent: ['Cision España'], wikipediaEditions: ['es'], govDomainPattern: '.gob.es', govTransportAgency: 'DGT', govTransportUrl: 'https://www.dgt.es', timezone: 'Europe/Madrid', callingCode: '+34', privacyLaw: 'GDPR + LOPDGDD', escortTerminology: ['vehículo de escolta', 'transporte especial'], currency: 'EUR' },
  { code: 'FR', name: 'France', nameLocal: 'France', tier: 'B', languages: ['fr'], primaryLanguage: 'fr', searchEngines: [{ name: 'Google', share: 92 }], haroEquivalent: ['Cision France'], wikipediaEditions: ['fr'], govDomainPattern: '.gouv.fr', govTransportAgency: 'DREAL', govTransportUrl: 'https://www.ecologie.gouv.fr', timezone: 'Europe/Paris', callingCode: '+33', privacyLaw: 'GDPR + Loi Informatique', escortTerminology: ['véhicule d\'escorte', 'convoi exceptionnel', 'voiture pilote'], currency: 'EUR' },
  { code: 'IT', name: 'Italy', nameLocal: 'Italia', tier: 'B', languages: ['it'], primaryLanguage: 'it', searchEngines: [{ name: 'Google', share: 95 }], haroEquivalent: ['Cision Italia'], wikipediaEditions: ['it'], govDomainPattern: '.gov.it', govTransportAgency: 'MIT', govTransportUrl: 'https://www.mit.gov.it', timezone: 'Europe/Rome', callingCode: '+39', privacyLaw: 'GDPR', escortTerminology: ['veicolo di scorta', 'trasporto eccezionale'], currency: 'EUR' },
  { code: 'PT', name: 'Portugal', nameLocal: 'Portugal', tier: 'B', languages: ['pt'], primaryLanguage: 'pt', searchEngines: [{ name: 'Google', share: 96 }], haroEquivalent: [], wikipediaEditions: ['pt'], govDomainPattern: '.gov.pt', govTransportAgency: 'IMT', govTransportUrl: 'https://www.imt-ip.pt', timezone: 'Europe/Lisbon', callingCode: '+351', privacyLaw: 'GDPR', escortTerminology: ['veículo de escolta', 'transporte especial'], currency: 'EUR' },
  { code: 'SA', name: 'Saudi Arabia', nameLocal: 'المملكة العربية السعودية', tier: 'B', languages: ['ar', 'en'], primaryLanguage: 'ar', searchEngines: [{ name: 'Google', share: 97 }], haroEquivalent: ['Meltwater MENA'], wikipediaEditions: ['ar'], govDomainPattern: '.gov.sa', govTransportAgency: 'MOT', govTransportUrl: 'https://www.mot.gov.sa', timezone: 'Asia/Riyadh', callingCode: '+966', privacyLaw: 'PDPL', escortTerminology: ['مركبة مرافقة', 'نقل استثنائي'], currency: 'SAR' },
  { code: 'QA', name: 'Qatar', nameLocal: 'قطر', tier: 'B', languages: ['ar', 'en'], primaryLanguage: 'ar', searchEngines: [{ name: 'Google', share: 96 }], haroEquivalent: ['Meltwater MENA'], wikipediaEditions: ['ar'], govDomainPattern: '.gov.qa', govTransportAgency: 'MOT Qatar', govTransportUrl: 'https://www.mot.gov.qa', timezone: 'Asia/Qatar', callingCode: '+974', privacyLaw: 'PDPL', escortTerminology: ['escort vehicle', 'مركبة مرافقة'], currency: 'QAR' },
  { code: 'MX', name: 'Mexico', nameLocal: 'México', tier: 'B', languages: ['es'], primaryLanguage: 'es', searchEngines: [{ name: 'Google', share: 95 }], haroEquivalent: [], wikipediaEditions: ['es'], govDomainPattern: '.gob.mx', govTransportAgency: 'SCT', govTransportUrl: 'https://www.gob.mx/sct', timezone: 'America/Mexico_City', callingCode: '+52', privacyLaw: 'LFPDPPP', escortTerminology: ['vehículo de escolta', 'transporte especial'], currency: 'MXN' },
  { code: 'IN', name: 'India', nameLocal: 'भारत', tier: 'B', languages: ['hi', 'en'], primaryLanguage: 'en', searchEngines: [{ name: 'Google', share: 98 }], haroEquivalent: ['Meltwater India'], wikipediaEditions: ['en', 'hi'], govDomainPattern: '.gov.in', govTransportAgency: 'MoRTH', govTransportUrl: 'https://morth.nic.in', timezone: 'Asia/Kolkata', callingCode: '+91', privacyLaw: 'DPDP Act', escortTerminology: ['pilot vehicle', 'escort vehicle', 'ODC escort'], currency: 'INR' },
  { code: 'ID', name: 'Indonesia', nameLocal: 'Indonesia', tier: 'B', languages: ['id'], primaryLanguage: 'id', searchEngines: [{ name: 'Google', share: 97 }], haroEquivalent: [], wikipediaEditions: ['id'], govDomainPattern: '.go.id', govTransportAgency: 'Dishub', govTransportUrl: 'https://dephub.go.id', timezone: 'Asia/Jakarta', callingCode: '+62', privacyLaw: 'PDP Law', escortTerminology: ['kendaraan pengawal', 'muatan berlebih'], currency: 'IDR' },
  { code: 'TH', name: 'Thailand', nameLocal: 'ประเทศไทย', tier: 'B', languages: ['th'], primaryLanguage: 'th', searchEngines: [{ name: 'Google', share: 98 }], haroEquivalent: [], wikipediaEditions: ['th'], govDomainPattern: '.go.th', govTransportAgency: 'DLT', govTransportUrl: 'https://www.dlt.go.th', timezone: 'Asia/Bangkok', callingCode: '+66', privacyLaw: 'PDPA', escortTerminology: ['รถนำขบวน', 'การขนส่งพิเศษ'], currency: 'THB' },
];

// Helper functions
export function getCountryByCode(code: string): CountryConfig | undefined {
  return COUNTRY_CONFIGS.find(c => c.code === code);
}

export function getCountriesByTier(tier: 'A' | 'B' | 'C' | 'D'): CountryConfig[] {
  return COUNTRY_CONFIGS.filter(c => c.tier === tier);
}

export function getAllLanguages(): string[] {
  const langs = new Set<string>();
  COUNTRY_CONFIGS.forEach(c => c.languages.forEach(l => langs.add(l)));
  return Array.from(langs);
}

export function getCountriesForWikipedia(edition: string): CountryConfig[] {
  return COUNTRY_CONFIGS.filter(c => c.wikipediaEditions.includes(edition));
}

export const TIER_A_CODES = COUNTRY_CONFIGS.filter(c => c.tier === 'A').map(c => c.code);
export const TIER_B_CODES = COUNTRY_CONFIGS.filter(c => c.tier === 'B').map(c => c.code);
