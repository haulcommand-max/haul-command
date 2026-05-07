/**
 * lib/geo/country-packs.ts
 *
 * Global country pack system for Haul Command report cards.
 * Every country gets the same report-card skeleton, but terminology,
 * units, currency, and compliance labels change by country.
 *
 * RULE: Never default missing country to 'US'. Use the proof chain:
 *   country_code_verified > country_code_inferred > geocode_country
 *   > phone_country > source_country > 'unknown'
 *
 * If unknown → show "Country needs verification", not "United States".
 */

export type ProofState =
  | 'verified'      // Third-party confirmed
  | 'self-reported' // Operator stated, not confirmed
  | 'inferred'      // Derived from data signals
  | 'seeded'        // Scraped/seeded, not claimed
  | 'stale'         // Was verified, now past expiry
  | 'missing'       // Not provided
  | 'not-applicable'; // Not relevant for this country/role

export type DistanceUnit = 'mile' | 'km';

export interface CountryPack {
  countryCode: string;
  countryName: string;
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  currency: string;
  currencySymbol: string;
  distanceUnit: DistanceUnit;
  // Role terminology
  pilotCarTerm: string;        // What a pilot car operator is called
  escortTerm: string;          // General escort term
  escortVehicleTerm: string;   // The escort vehicle
  leadCarTerm: string;
  chaseCarTerm: string;
  heightPoleTerm: string;
  routeSurveyTerm: string;
  superloadTerm: string;
  overloadTerm: string;        // General oversize load term
  // Compliance terminology
  certificationTerm: string;   // Primary certification name
  licenceTerm: string;         // Licence body/authority
  insuranceTerm: string;
  permitTerm: string;
  regionTerm: string;          // state / province / territory / county
  // Regulatory body
  regulatoryBody: string;
  regulatoryBodyShort: string;
  // Additional localized notes
  notes?: string;
}

// ── Country packs by tier ────────────────────────────────────────────────────

const PACKS: Record<string, CountryPack> = {

  // ── TIER A: Deep report cards, full localization ──────────────────────────

  US: {
    countryCode: 'US', countryName: 'United States', tier: 'A',
    currency: 'USD', currencySymbol: '$', distanceUnit: 'mile',
    pilotCarTerm: 'Pilot Car Operator (PEVO)',
    escortTerm: 'Escort Service',
    escortVehicleTerm: 'Pilot Car',
    leadCarTerm: 'Lead Car',
    chaseCarTerm: 'Chase Car',
    heightPoleTerm: 'Height Pole',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Superload',
    overloadTerm: 'Oversize / Overweight Load (OSOW)',
    certificationTerm: 'PEVO Certification',
    licenceTerm: 'State Escort Permit / Certification',
    insuranceTerm: 'Certificate of Insurance (COI)',
    permitTerm: 'Oversize / Overweight Permit',
    regionTerm: 'State',
    regulatoryBody: 'Federal Highway Administration',
    regulatoryBodyShort: 'FHWA',
    notes: 'TWIC required for port access. DOT/MC required for carriers.',
  },

  CA: {
    countryCode: 'CA', countryName: 'Canada', tier: 'A',
    currency: 'CAD', currencySymbol: 'C$', distanceUnit: 'km',
    pilotCarTerm: 'Pilot Car Operator',
    escortTerm: 'Escort Service',
    escortVehicleTerm: 'Pilot Vehicle',
    leadCarTerm: 'Lead Pilot Vehicle',
    chaseCarTerm: 'Rear Pilot Vehicle',
    heightPoleTerm: 'Height Pole',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Superload / Permitted Load',
    overloadTerm: 'Oversize / Overweight Vehicle (OSW)',
    certificationTerm: 'Provincial Escort Certification',
    licenceTerm: 'Provincial Pilot Car Permit',
    insuranceTerm: 'Certificate of Insurance (COI)',
    permitTerm: 'Oversize / Overweight Permit',
    regionTerm: 'Province / Territory',
    regulatoryBody: 'Transport Canada / Provincial MTO',
    regulatoryBodyShort: 'TC/MTO',
    notes: 'CVOR/NSC compliance for carriers. Rules vary by province.',
  },

  AU: {
    countryCode: 'AU', countryName: 'Australia', tier: 'A',
    currency: 'AUD', currencySymbol: 'A$', distanceUnit: 'km',
    pilotCarTerm: 'Heavy Vehicle Pilot',
    escortTerm: 'Escort Service',
    escortVehicleTerm: 'Pilot Vehicle',
    leadCarTerm: 'Front Pilot Vehicle',
    chaseCarTerm: 'Rear Pilot Vehicle',
    heightPoleTerm: 'Height Pole',
    routeSurveyTerm: 'Route Assessment',
    superloadTerm: 'OSOM Load (Oversize Overmass)',
    overloadTerm: 'OSOM / Oversize Overmass Load',
    certificationTerm: 'Heavy Vehicle Pilot Licence',
    licenceTerm: 'HVPL (Heavy Vehicle Pilot Licence)',
    insuranceTerm: 'Public Liability Insurance',
    permitTerm: 'OSOM Permit / RAV Access',
    regionTerm: 'State / Territory',
    regulatoryBody: 'National Heavy Vehicle Regulator',
    regulatoryBodyShort: 'NHVR',
    notes: 'WA and NT regulated by state authority (Main Roads WA). QLD uses pilot/escort vehicle driver accreditation.',
  },

  GB: {
    countryCode: 'GB', countryName: 'United Kingdom', tier: 'A',
    currency: 'GBP', currencySymbol: '£', distanceUnit: 'mile',
    pilotCarTerm: 'Escort / Attendant Vehicle Operator',
    escortTerm: 'Escort Service',
    escortVehicleTerm: 'Attendant Vehicle',
    leadCarTerm: 'Front Attendant Vehicle',
    chaseCarTerm: 'Rear Attendant Vehicle',
    heightPoleTerm: 'Height Gauge',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Special Types General Order (STGO) Load',
    overloadTerm: 'Abnormal Load',
    certificationTerm: 'Escort Operator Qualification',
    licenceTerm: 'DVSA Attendant Vehicle Qualification',
    insuranceTerm: 'Motor Trade / Public Liability Insurance',
    permitTerm: 'Abnormal Load Movement Notification',
    regionTerm: 'County / Region',
    regulatoryBody: 'Driver and Vehicle Standards Agency',
    regulatoryBodyShort: 'DVSA',
    notes: 'Category 1 STGO: notification to police. Cat 2/3: notify highways authority.',
  },

  NZ: {
    countryCode: 'NZ', countryName: 'New Zealand', tier: 'A',
    currency: 'NZD', currencySymbol: 'NZ$', distanceUnit: 'km',
    pilotCarTerm: 'Pilot Vehicle Operator',
    escortTerm: 'Escort Service',
    escortVehicleTerm: 'Pilot Vehicle',
    leadCarTerm: 'Front Pilot Vehicle',
    chaseCarTerm: 'Rear Pilot Vehicle',
    heightPoleTerm: 'Height Pole',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Overdimension Load',
    overloadTerm: 'Overdimension / Overweight Load',
    certificationTerm: 'Pilot Vehicle Operator Certification',
    licenceTerm: 'NZTA Pilot Vehicle Certification',
    insuranceTerm: 'Public Liability Insurance',
    permitTerm: 'Overdimension Permit',
    regionTerm: 'Region',
    regulatoryBody: 'NZ Transport Agency Waka Kotahi',
    regulatoryBodyShort: 'NZTA',
  },

  ZA: {
    countryCode: 'ZA', countryName: 'South Africa', tier: 'A',
    currency: 'ZAR', currencySymbol: 'R', distanceUnit: 'km',
    pilotCarTerm: 'Escort Pilot Vehicle Operator',
    escortTerm: 'Abnormal Load Escort',
    escortVehicleTerm: 'Pilot Vehicle',
    leadCarTerm: 'Front Pilot Vehicle',
    chaseCarTerm: 'Rear Pilot Vehicle',
    heightPoleTerm: 'Height Gauge',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Abnormal Load',
    overloadTerm: 'Abnormal / Oversize Load',
    certificationTerm: 'SAPOA / Provincial Escort Accreditation',
    licenceTerm: 'DLTC / Provincial Permit',
    insuranceTerm: 'Public Liability Insurance',
    permitTerm: 'Abnormal Load Permit',
    regionTerm: 'Province',
    regulatoryBody: 'Department of Transport',
    regulatoryBodyShort: 'DoT',
  },

  DE: {
    countryCode: 'DE', countryName: 'Germany', tier: 'A',
    currency: 'EUR', currencySymbol: '€', distanceUnit: 'km',
    pilotCarTerm: 'Begleitfahrzeug-Fahrer (Escort Driver)',
    escortTerm: 'Schwertransportbegleitung',
    escortVehicleTerm: 'Begleitfahrzeug',
    leadCarTerm: 'Vorsicherung',
    chaseCarTerm: 'Nachsicherung',
    heightPoleTerm: 'Höhenmaßstab',
    routeSurveyTerm: 'Streckenprüfung',
    superloadTerm: 'Schwertransport (Großraum/Schwertransport)',
    overloadTerm: 'Großraum- und Schwerverkehr',
    certificationTerm: 'Fahrerlaubnis + Qualifikation',
    licenceTerm: 'Straßenverkehrsamt Erlaubnis',
    insuranceTerm: 'Haftpflichtversicherung',
    permitTerm: 'Ausnahmegenehmigung',
    regionTerm: 'Bundesland',
    regulatoryBody: 'Bundesamt für Güterverkehr',
    regulatoryBodyShort: 'BAG',
  },

  NL: {
    countryCode: 'NL', countryName: 'Netherlands', tier: 'A',
    currency: 'EUR', currencySymbol: '€', distanceUnit: 'km',
    pilotCarTerm: 'Begeleidingsvoertuig Bestuurder',
    escortTerm: 'Begeleidingsvoertuig Dienst',
    escortVehicleTerm: 'Begeleidingsvoertuig',
    leadCarTerm: 'Voertuig Voorkant',
    chaseCarTerm: 'Voertuig Achterkant',
    heightPoleTerm: 'Hoogtepaal',
    routeSurveyTerm: 'Routeonderzoek',
    superloadTerm: 'Uitzonderlijk Transport',
    overloadTerm: 'Uitzonderlijk Transport',
    certificationTerm: 'RDW Ontheffing / Begeleidingskwalificatie',
    licenceTerm: 'RDW Ontheffing',
    insuranceTerm: 'Aansprakelijkheidsverzekering (WA)',
    permitTerm: 'RDW Ontheffing',
    regionTerm: 'Provincie',
    regulatoryBody: 'Rijksdienst voor het Wegverkeer',
    regulatoryBodyShort: 'RDW',
  },

  AE: {
    countryCode: 'AE', countryName: 'United Arab Emirates', tier: 'A',
    currency: 'AED', currencySymbol: 'AED', distanceUnit: 'km',
    pilotCarTerm: 'Escort Vehicle Operator',
    escortTerm: 'Heavy Cargo Escort',
    escortVehicleTerm: 'Escort Vehicle',
    leadCarTerm: 'Front Escort Vehicle',
    chaseCarTerm: 'Rear Escort Vehicle',
    heightPoleTerm: 'Height Gauge',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Heavy / Abnormal Load',
    overloadTerm: 'Oversize / Heavy Load',
    certificationTerm: 'RTA / Authority Escort Permit',
    licenceTerm: 'UAE RTA Escort Licence',
    insuranceTerm: 'Third Party Liability Insurance',
    permitTerm: 'Heavy Cargo Permit',
    regionTerm: 'Emirate',
    regulatoryBody: 'Roads and Transport Authority',
    regulatoryBodyShort: 'RTA',
  },

  BR: {
    countryCode: 'BR', countryName: 'Brazil', tier: 'A',
    currency: 'BRL', currencySymbol: 'R$', distanceUnit: 'km',
    pilotCarTerm: 'Veículo de Escolta / Piloto',
    escortTerm: 'Serviço de Escolta',
    escortVehicleTerm: 'Veículo de Escolta',
    leadCarTerm: 'Batedores Dianteiros',
    chaseCarTerm: 'Batedores Traseiros',
    heightPoleTerm: 'Baliza de Altura',
    routeSurveyTerm: 'Vistoria de Rota',
    superloadTerm: 'Carga Especial Superdimensionada',
    overloadTerm: 'Transporte Especial de Cargas',
    certificationTerm: 'ANTT / DETRAN Autorização de Escolta',
    licenceTerm: 'Licença Especial ANTT',
    insuranceTerm: 'Seguro de Responsabilidade Civil',
    permitTerm: 'Autorização Especial de Trânsito (AET)',
    regionTerm: 'Estado',
    regulatoryBody: 'Agência Nacional de Transportes Terrestres',
    regulatoryBodyShort: 'ANTT',
  },

  // ── TIER B: Full structure, fewer verified sources at launch ──────────────

  IE: {
    countryCode: 'IE', countryName: 'Ireland', tier: 'B',
    currency: 'EUR', currencySymbol: '€', distanceUnit: 'km',
    pilotCarTerm: 'Escort Vehicle Operator',
    escortTerm: 'Abnormal Load Escort',
    escortVehicleTerm: 'Escort Vehicle',
    leadCarTerm: 'Front Escort Vehicle',
    chaseCarTerm: 'Rear Escort Vehicle',
    heightPoleTerm: 'Height Gauge',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Special Load',
    overloadTerm: 'Abnormal Load',
    certificationTerm: 'An Garda Síochána Escort Qualification',
    licenceTerm: 'RSA / TII Special Load Permit',
    insuranceTerm: 'Public Liability Insurance',
    permitTerm: 'Special Load Permit (RSA)',
    regionTerm: 'County',
    regulatoryBody: 'Road Safety Authority / Transport Infrastructure Ireland',
    regulatoryBodyShort: 'RSA / TII',
  },

  FR: {
    countryCode: 'FR', countryName: 'France', tier: 'B',
    currency: 'EUR', currencySymbol: '€', distanceUnit: 'km',
    pilotCarTerm: 'Accompagnateur / Escorteur',
    escortTerm: 'Escorte de Transport Exceptionnel',
    escortVehicleTerm: 'Véhicule d\'Escorte',
    leadCarTerm: 'Véhicule Avant',
    chaseCarTerm: 'Véhicule Arrière',
    heightPoleTerm: 'Gabarit de Hauteur',
    routeSurveyTerm: 'Étude d\'Itinéraire',
    superloadTerm: 'Transport Exceptionnel de Classe IV',
    overloadTerm: 'Transport Exceptionnel',
    certificationTerm: 'Qualification Accompagnateur TE',
    licenceTerm: 'Arrêté Préfectoral / Autorisation DREAL',
    insuranceTerm: 'Assurance Responsabilité Civile',
    permitTerm: 'Autorisation de Transport Exceptionnel',
    regionTerm: 'Département / Région',
    regulatoryBody: 'Direction Régionale de l\'Environnement',
    regulatoryBodyShort: 'DREAL',
  },

  MX: {
    countryCode: 'MX', countryName: 'Mexico', tier: 'B',
    currency: 'MXN', currencySymbol: 'MX$', distanceUnit: 'km',
    pilotCarTerm: 'Vehículo de Escolta / Piloto',
    escortTerm: 'Servicio de Escolta',
    escortVehicleTerm: 'Vehículo de Escolta',
    leadCarTerm: 'Escolta Delantera',
    chaseCarTerm: 'Escolta Trasera',
    heightPoleTerm: 'Señalizador de Altura',
    routeSurveyTerm: 'Reconocimiento de Ruta',
    superloadTerm: 'Carga Sobredimensionada',
    overloadTerm: 'Carga Especial / Sobredimensionada',
    certificationTerm: 'Autorización SCT',
    licenceTerm: 'Permiso Especial SCT',
    insuranceTerm: 'Seguro de Responsabilidad Civil',
    permitTerm: 'Permiso de Carga Indivisible (SCT)',
    regionTerm: 'Estado',
    regulatoryBody: 'Secretaría de Comunicaciones y Transportes',
    regulatoryBodyShort: 'SCT',
  },

  IN: {
    countryCode: 'IN', countryName: 'India', tier: 'B',
    currency: 'INR', currencySymbol: '₹', distanceUnit: 'km',
    pilotCarTerm: 'Pilot Vehicle Operator',
    escortTerm: 'Escort Service',
    escortVehicleTerm: 'Pilot Vehicle',
    leadCarTerm: 'Front Pilot Vehicle',
    chaseCarTerm: 'Rear Pilot Vehicle',
    heightPoleTerm: 'Height Gauge',
    routeSurveyTerm: 'Route Survey',
    superloadTerm: 'Over Dimensional Cargo (ODC)',
    overloadTerm: 'ODC / Oversize Load',
    certificationTerm: 'State Transport Authority Authorisation',
    licenceTerm: 'STA Escort Authorisation',
    insuranceTerm: 'Third Party Liability Insurance',
    permitTerm: 'ODC Movement Permit',
    regionTerm: 'State',
    regulatoryBody: 'Ministry of Road Transport and Highways',
    regulatoryBodyShort: 'MoRTH',
  },

  SA: {
    countryCode: 'SA', countryName: 'Saudi Arabia', tier: 'B',
    currency: 'SAR', currencySymbol: 'SAR', distanceUnit: 'km',
    pilotCarTerm: 'مرافق شاحنة (Escort Vehicle Operator)',
    escortTerm: 'خدمة المرافقة',
    escortVehicleTerm: 'سيارة المرافقة',
    leadCarTerm: 'المرافق الأمامي',
    chaseCarTerm: 'المرافق الخلفي',
    heightPoleTerm: 'مقياس الارتفاع',
    routeSurveyTerm: 'مسح المسار',
    superloadTerm: 'شحن استثنائي',
    overloadTerm: 'شحن استثنائي / ضخم',
    certificationTerm: 'ترخيص وزارة النقل',
    licenceTerm: 'تصريح نقل استثنائي',
    insuranceTerm: 'تأمين المسؤولية المدنية',
    permitTerm: 'تصريح نقل البضائع الاستثنائية',
    regionTerm: 'المنطقة',
    regulatoryBody: 'وزارة النقل والخدمات اللوجستية',
    regulatoryBodyShort: 'MoT KSA',
  },

  // ── Tier C/D/E — same skeleton, truth-first empty states ─────────────────
  // Generic fallback for any unlisted country
};

// ── Country state code maps for AU (WA ambiguity fix) ────────────────────────

export const AU_STATE_SPECIFIC: Record<string, {
  pilotCarTerm: string;
  certificationTerm: string;
  regulatoryBody: string;
  notes: string;
}> = {
  WA: {
    pilotCarTerm: 'Heavy Vehicle Pilot (WA)',
    certificationTerm: 'WA Heavy Vehicle Pilot Licence (HVPL)',
    regulatoryBody: 'Main Roads Western Australia',
    notes: 'WA regulated directly by Main Roads WA (not NHVR). Requires HVPL. Loads over 4.5m wide need white flashing lights. UHF radio mandatory.',
  },
  QLD: {
    pilotCarTerm: 'Pilot Vehicle Driver (QLD)',
    certificationTerm: 'QLD Pilot/Escort Vehicle Driver Accreditation',
    regulatoryBody: 'Queensland Department of Transport and Main Roads',
    notes: 'QLD uses pilot vehicle driver and escort vehicle driver accreditation language.',
  },
  NT: {
    pilotCarTerm: 'Escort Vehicle Driver (NT)',
    certificationTerm: 'NT Escort Vehicle Driver Authority',
    regulatoryBody: 'Department of Infrastructure, Planning and Logistics NT',
    notes: 'NT not covered by NHVR — regulated directly by NT government.',
  },
};

// ── Generic fallback pack ────────────────────────────────────────────────────

const GENERIC_PACK: Omit<CountryPack, 'countryCode' | 'countryName' | 'currency' | 'currencySymbol' | 'tier'> = {
  distanceUnit: 'km',
  pilotCarTerm: 'Pilot Vehicle Operator',
  escortTerm: 'Escort Service',
  escortVehicleTerm: 'Escort Vehicle',
  leadCarTerm: 'Front Escort Vehicle',
  chaseCarTerm: 'Rear Escort Vehicle',
  heightPoleTerm: 'Height Gauge',
  routeSurveyTerm: 'Route Survey',
  superloadTerm: 'Exceptional / Special Load',
  overloadTerm: 'Oversize / Overweight Load',
  certificationTerm: 'National Escort Certification',
  licenceTerm: 'Government Escort Licence',
  insuranceTerm: 'Public Liability Insurance',
  permitTerm: 'Special Transport Permit',
  regionTerm: 'Region',
  regulatoryBody: 'National Transport Authority',
  regulatoryBodyShort: 'NTA',
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Resolve the country code using the proof chain.
 * NEVER defaults to 'US'. Returns 'unknown' if nothing found.
 */
export function resolveCountryCode(operator: {
  country_code_verified?: string | null;
  country_code_inferred?: string | null;
  geocode_country?: string | null;
  phone_country?: string | null;
  source_country?: string | null;
}): string {
  return (
    operator.country_code_verified?.toUpperCase() ||
    operator.country_code_inferred?.toUpperCase() ||
    operator.geocode_country?.toUpperCase() ||
    operator.phone_country?.toUpperCase() ||
    operator.source_country?.toUpperCase() ||
    'unknown'
  );
}

/**
 * Get the country pack for a country code.
 * Returns a localized pack with country-specific terminology.
 * For AU + state code, applies state-specific overlay.
 */
export function getCountryPack(
  countryCode: string,
  stateCode?: string | null
): CountryPack & { stateOverride?: typeof AU_STATE_SPECIFIC[string] } {
  const code = countryCode.toUpperCase();

  if (code === 'unknown' || !code) {
    // Return a clearly neutral pack — don't default to US
    return {
      countryCode: 'unknown',
      countryName: 'Unknown — Verification Needed',
      tier: 'E',
      currency: '—',
      currencySymbol: '—',
      ...GENERIC_PACK,
    };
  }

  const pack = PACKS[code];

  if (!pack) {
    // Country exists but no specific pack — use generic
    return {
      countryCode: code,
      countryName: code,
      tier: 'C',
      currency: '—',
      currencySymbol: '—',
      ...GENERIC_PACK,
    };
  }

  // Australia state-specific overlay
  if (code === 'AU' && stateCode) {
    const stateOverride = AU_STATE_SPECIFIC[stateCode.toUpperCase()];
    if (stateOverride) {
      return { ...pack, stateOverride };
    }
  }

  return pack;
}

/**
 * Human-readable proof state label.
 */
export function proofStateLabel(state: ProofState): string {
  const labels: Record<ProofState, string> = {
    'verified': '✓ Verified',
    'self-reported': '~ Self-reported',
    'inferred': '≈ Inferred',
    'seeded': '○ Seeded',
    'stale': '⚠ Stale',
    'missing': '— Not provided',
    'not-applicable': 'N/A',
  };
  return labels[state] ?? state;
}

/**
 * Proof state badge color for UI.
 */
export function proofStateBadgeClass(state: ProofState): string {
  const classes: Record<ProofState, string> = {
    'verified': 'bg-green-500/15 text-green-400 border-green-500/30',
    'self-reported': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'inferred': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'seeded': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    'stale': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'missing': 'bg-white/5 text-gray-500 border-white/10',
    'not-applicable': 'bg-white/5 text-gray-600 border-white/[0.06]',
  };
  return classes[state] ?? classes['missing'];
}

export { PACKS };
