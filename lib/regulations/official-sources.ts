/**
 * lib/regulations/official-sources.ts
 * 
 * Official government regulatory source URLs for all 57 countries.
 * These are the actual .gov / official authority links where operators
 * can find the legal requirements that govern pilot car / escort operations.
 * 
 * Used by /regulations page and compliance copilot.
 */

export interface OfficialSource {
  countryCode: string;
  label: string;
  url: string;
  type: 'government' | 'authority' | 'legislation' | 'industry' | 'digital_system';
  language: string;
}

export const OFFICIAL_REGULATORY_SOURCES: OfficialSource[] = [
  // ═══════════════════════════════════════════════════════════
  // TIER A — GOLD (10 countries)
  // ═══════════════════════════════════════════════════════════

  // United States
  { countryCode: 'US', label: 'FHWA Oversize/Overweight Permit Procedures', url: 'https://ops.fhwa.dot.gov/freight/sw/permit_report/index.htm', type: 'government', language: 'en' },
  { countryCode: 'US', label: 'USDOT — Federal Bridge Formula', url: 'https://www.fhwa.dot.gov/bridge/brdgform.cfm', type: 'government', language: 'en' },
  { countryCode: 'US', label: 'Oversize.io — State-by-State Escort Requirements', url: 'https://oversize.io/regulations/pilot-cars-escort-vehicles', type: 'industry', language: 'en' },

  // Canada
  { countryCode: 'CA', label: 'BC Ministry of Transportation — Permit Centre', url: 'https://www.th.gov.bc.ca/permits/', type: 'government', language: 'en' },
  { countryCode: 'CA', label: 'Alberta Transportation — Oversize Permits', url: 'https://www.alberta.ca/oversize-overweight-vehicle-permits', type: 'government', language: 'en' },
  { countryCode: 'CA', label: 'Ontario MTO — Oversize/Overweight Permits', url: 'https://www.ontario.ca/page/oversize-overweight-vehicles', type: 'government', language: 'en' },

  // Australia
  { countryCode: 'AU', label: 'NHVR — National Heavy Vehicle Regulator', url: 'https://www.nhvr.gov.au', type: 'authority', language: 'en' },
  { countryCode: 'AU', label: 'NHVR — Pilot Vehicle Requirements', url: 'https://www.nhvr.gov.au/road-access/access-management/pilot-and-escort-vehicles', type: 'authority', language: 'en' },
  { countryCode: 'AU', label: 'NHVR Portal — Access Permits', url: 'https://www.service.nhvr.gov.au/', type: 'digital_system', language: 'en' },

  // United Kingdom
  { countryCode: 'GB', label: 'GOV.UK — Abnormal Loads Guide', url: 'https://www.gov.uk/government/publications/abnormal-load-movements', type: 'government', language: 'en' },
  { countryCode: 'GB', label: 'ESDAL — Electronic Service Delivery for Abnormal Loads', url: 'https://www.esdal.com/', type: 'digital_system', language: 'en' },
  { countryCode: 'GB', label: 'Highways England — STGO Categories', url: 'https://www.gov.uk/guidance/abnormal-loads', type: 'government', language: 'en' },

  // New Zealand
  { countryCode: 'NZ', label: 'NZTA — Overweight & Overdimension Permits', url: 'https://www.nzta.govt.nz/vehicles/vehicle-types/heavy/overweight-vehicles-and-loads/', type: 'authority', language: 'en' },
  { countryCode: 'NZ', label: 'NZTA — Load Pilot Requirements', url: 'https://www.nzta.govt.nz/vehicles/vehicle-types/heavy/load-pilots/', type: 'authority', language: 'en' },

  // South Africa
  { countryCode: 'ZA', label: 'SANRAL — Abnormal Load Permits', url: 'https://www.nra.co.za/live/content.php?Category_ID=78', type: 'authority', language: 'en' },
  { countryCode: 'ZA', label: 'National Road Traffic Act — Reg 247, 248', url: 'https://www.gov.za/documents/national-road-traffic-act', type: 'legislation', language: 'en' },

  // Germany
  { countryCode: 'DE', label: 'VEMAGS — Permit Management System', url: 'https://www.vemags.de/', type: 'digital_system', language: 'de' },
  { countryCode: 'DE', label: 'StVO §29 — Großraum- und Schwertransporte', url: 'https://www.gesetze-im-internet.de/stvo_2013/__29.html', type: 'legislation', language: 'de' },
  { countryCode: 'DE', label: 'BASt — BF3/BF4 Escort Requirements', url: 'https://www.bast.de/', type: 'authority', language: 'de' },

  // Netherlands
  { countryCode: 'NL', label: 'RDW — Exceptional Transport Permits', url: 'https://www.rdw.nl/zakelijk/paginas/ontheffingen-exceptioneel-transport', type: 'authority', language: 'nl' },
  { countryCode: 'NL', label: 'Rijkswaterstaat — Road Rules for Exceptional Transport', url: 'https://www.rijkswaterstaat.nl/', type: 'government', language: 'nl' },

  // UAE
  { countryCode: 'AE', label: 'MOI — Ministry of Interior Transport Regulations', url: 'https://www.moi.gov.ae/', type: 'government', language: 'ar' },
  { countryCode: 'AE', label: 'RTA Dubai — Oversize Load Permits', url: 'https://www.rta.ae/', type: 'authority', language: 'en' },

  // Brazil
  { countryCode: 'BR', label: 'ANTT — Agência Nacional de Transportes Terrestres', url: 'https://www.antt.gov.br/', type: 'authority', language: 'pt' },
  { countryCode: 'BR', label: 'DNIT — AET Special Transit Authorization', url: 'https://www.gov.br/dnit/', type: 'government', language: 'pt' },

  // ═══════════════════════════════════════════════════════════
  // TIER B — BLUE (18 countries)
  // ═══════════════════════════════════════════════════════════

  // Ireland
  { countryCode: 'IE', label: 'TII — Transport Infrastructure Ireland Permits', url: 'https://www.tii.ie/', type: 'authority', language: 'en' },

  // Sweden
  { countryCode: 'SE', label: 'Transportstyrelsen — Oversize Transport', url: 'https://www.transportstyrelsen.se/', type: 'authority', language: 'sv' },

  // Norway
  { countryCode: 'NO', label: 'Statens vegvesen — Special Transport', url: 'https://www.vegvesen.no/', type: 'authority', language: 'no' },

  // Denmark
  { countryCode: 'DK', label: 'Vejdirektoratet — Special Transport', url: 'https://www.vejdirektoratet.dk/', type: 'authority', language: 'da' },

  // Finland
  { countryCode: 'FI', label: 'Traficom — Special Transport Permits', url: 'https://www.traficom.fi/', type: 'authority', language: 'fi' },

  // Belgium
  { countryCode: 'BE', label: 'SPW Mobilité — Wallonia Transport Permits', url: 'https://www.wallonie.be/', type: 'government', language: 'fr' },

  // Austria
  { countryCode: 'AT', label: 'ASFINAG — Motorway Oversize Permits', url: 'https://www.asfinag.at/', type: 'authority', language: 'de' },

  // Switzerland
  { countryCode: 'CH', label: 'ASTRA — Federal Roads Office', url: 'https://www.astra.admin.ch/', type: 'government', language: 'de' },

  // Spain
  { countryCode: 'ES', label: 'DGT — Transportes Especiales', url: 'https://www.dgt.es/', type: 'authority', language: 'es' },

  // France
  { countryCode: 'FR', label: 'DREAL — Transport Exceptionnel', url: 'https://www.ecologie.gouv.fr/', type: 'government', language: 'fr' },
  { countryCode: 'FR', label: 'Service-Public.fr — Convoi Exceptionnel', url: 'https://www.service-public.fr/', type: 'government', language: 'fr' },

  // Italy
  { countryCode: 'IT', label: 'MIT — Ministero delle Infrastrutture e dei Trasporti', url: 'https://www.mit.gov.it/', type: 'government', language: 'it' },

  // Portugal
  { countryCode: 'PT', label: 'IMT — Instituto da Mobilidade', url: 'https://www.imt-ip.pt/', type: 'authority', language: 'pt' },

  // Saudi Arabia
  { countryCode: 'SA', label: 'TGA — Transport General Authority', url: 'https://www.tga.gov.sa/', type: 'authority', language: 'ar' },

  // Qatar
  { countryCode: 'QA', label: 'Ashghal — Public Works Authority', url: 'https://www.ashghal.gov.qa/', type: 'authority', language: 'ar' },

  // Mexico
  { countryCode: 'MX', label: 'SCT — Secretaría de Comunicaciones y Transportes', url: 'https://www.gob.mx/sct', type: 'government', language: 'es' },

  // India
  { countryCode: 'IN', label: 'MoRTH — Ministry of Road Transport', url: 'https://morth.nic.in/', type: 'government', language: 'en' },

  // Indonesia
  { countryCode: 'ID', label: 'Kemenhub — Ministry of Transportation', url: 'https://dephub.go.id/', type: 'government', language: 'id' },

  // Thailand
  { countryCode: 'TH', label: 'DLT — Department of Land Transport', url: 'https://www.dlt.go.th/', type: 'authority', language: 'th' },

  // ═══════════════════════════════════════════════════════════
  // TIER C — SILVER (26 countries)
  // ═══════════════════════════════════════════════════════════

  { countryCode: 'PL', label: 'GITD — General Inspectorate of Road Transport', url: 'https://www.gitd.gov.pl/', type: 'authority', language: 'pl' },
  { countryCode: 'CZ', label: 'ŘSD — Road and Motorway Directorate', url: 'https://www.rsd.cz/', type: 'authority', language: 'cs' },
  { countryCode: 'SK', label: 'SSC — Slovak Road Administration', url: 'https://www.ssc.sk/', type: 'authority', language: 'sk' },
  { countryCode: 'HU', label: 'Magyar Közút — Hungarian Road Management', url: 'https://internet.kozut.hu/', type: 'authority', language: 'hu' },
  { countryCode: 'SI', label: 'DRSI — Slovenian Infrastructure Agency', url: 'https://www.di.gov.si/', type: 'authority', language: 'sl' },
  { countryCode: 'EE', label: 'Transpordiamet — Transport Administration', url: 'https://www.transpordiamet.ee/', type: 'authority', language: 'et' },
  { countryCode: 'LV', label: 'LVC — Latvian Road Administration', url: 'https://lvceli.lv/', type: 'authority', language: 'lv' },
  { countryCode: 'LT', label: 'LAKD — Lithuanian Road Administration', url: 'https://lakd.lt/', type: 'authority', language: 'lt' },
  { countryCode: 'HR', label: 'Hrvatske ceste — Croatian Roads', url: 'https://hrvatske-ceste.hr/', type: 'authority', language: 'hr' },
  { countryCode: 'RO', label: 'CNAIR — National Road Infrastructure Company', url: 'https://www.cnair.ro/', type: 'authority', language: 'ro' },
  { countryCode: 'BG', label: 'API — Road Infrastructure Agency', url: 'https://www.api.bg/', type: 'authority', language: 'bg' },
  { countryCode: 'GR', label: 'Ministry of Infrastructure and Transport', url: 'https://www.yme.gov.gr/', type: 'government', language: 'el' },
  { countryCode: 'TR', label: 'KGM — General Directorate of Highways', url: 'https://www.kgm.gov.tr/', type: 'authority', language: 'tr' },
  { countryCode: 'KW', label: 'Ministry of Interior — Transport Division', url: 'https://www.moi.gov.kw/', type: 'government', language: 'ar' },
  { countryCode: 'OM', label: 'MOT — Ministry of Transport', url: 'https://www.mot.gov.om/', type: 'government', language: 'ar' },
  { countryCode: 'BH', label: 'MOT — Ministry of Transportation', url: 'https://www.transportation.gov.bh/', type: 'government', language: 'ar' },
  { countryCode: 'SG', label: 'LTA — Land Transport Authority', url: 'https://www.lta.gov.sg/', type: 'authority', language: 'en' },
  { countryCode: 'MY', label: 'JPJ — Road Transport Department', url: 'https://www.jpj.gov.my/', type: 'authority', language: 'ms' },
  { countryCode: 'JP', label: 'MLIT — Ministry of Land, Infrastructure, Transport', url: 'https://www.mlit.go.jp/', type: 'government', language: 'ja' },
  { countryCode: 'KR', label: 'MOLIT — Ministry of Land, Infrastructure and Transport', url: 'https://www.molit.go.kr/', type: 'government', language: 'ko' },
  { countryCode: 'CL', label: 'MTT — Ministry of Transport', url: 'https://www.mtt.gob.cl/', type: 'government', language: 'es' },
  { countryCode: 'AR', label: 'Vialidad Nacional — National Road Authority', url: 'https://www.argentina.gob.ar/obras-publicas/vialidad-nacional', type: 'authority', language: 'es' },
  { countryCode: 'CO', label: 'MinTransporte — Ministry of Transport', url: 'https://www.mintransporte.gov.co/', type: 'government', language: 'es' },
  { countryCode: 'PE', label: 'SUTRAN / Provías Nacional', url: 'https://www.sutran.gob.pe/', type: 'authority', language: 'es' },
  { countryCode: 'VN', label: 'TDSI — Transport Development and Strategy Institute', url: 'https://www.mt.gov.vn/', type: 'government', language: 'vi' },
  { countryCode: 'PH', label: 'LTO — Land Transportation Office', url: 'https://lto.gov.ph/', type: 'authority', language: 'en' },

  // ═══════════════════════════════════════════════════════════
  // TIER D — SLATE (3 countries)
  // ═══════════════════════════════════════════════════════════

  { countryCode: 'UY', label: 'DNV — Dirección Nacional de Vialidad', url: 'https://www.dnv.gub.uy/', type: 'authority', language: 'es' },
  { countryCode: 'PA', label: 'MOP — Ministry of Public Works', url: 'https://www.mop.gob.pa/', type: 'government', language: 'es' },
  { countryCode: 'CR', label: 'MOPT — Ministry of Public Works and Transport', url: 'https://www.mopt.go.cr/', type: 'government', language: 'es' },
];

// ── Helpers ──

export function getSourcesByCountry(countryCode: string): OfficialSource[] {
  return OFFICIAL_REGULATORY_SOURCES.filter(s => s.countryCode === countryCode);
}

export function getSourceCount(): number {
  return OFFICIAL_REGULATORY_SOURCES.length;
}

export function getCountriesWithSources(): string[] {
  return [...new Set(OFFICIAL_REGULATORY_SOURCES.map(s => s.countryCode))];
}
