/**
 * Haul Command — 57-Country Regulations Database
 * 
 * Regulatory framework for oversize/overweight transport across all 57 countries.
 * Covers: governing authority, standard limits, escort thresholds, permit types,
 * operating hours, and key regulatory citations.
 */

import type { CountryCode } from './positions-global';

export interface CountryRegulation {
  country: CountryCode;
  name: string;
  /** Primary governing transport authority */
  authority: string;
  authorityUrl?: string;
  /** Standard legal limits (without OD permit) */
  standardLimits: {
    maxWidthM: number;
    maxHeightM: number;
    maxLengthM: number;
    maxGrossWeightKg: number;
  };
  /** Dimensional thresholds requiring escort(s) */
  escortThresholds: {
    singleEscortWidthM?: number;
    dualEscortWidthM?: number;
    policeEscortWidthM?: number;
    escortHeightM?: number;
    escortLengthM?: number;
    notes?: string;
  };
  /** Permit categories and types */
  permitTypes: string[];
  /** Operating hour restrictions */
  operatingHours: {
    daylight?: boolean;
    nightRestrictions?: string;
    weekendRestrictions?: string;
    holidayRestrictions?: string;
  };
  /** Key regulatory citation */
  regulatoryRef: string;
  /** Local language term for "oversize load" */
  localTerm?: string;
  /** Required signage / markings */
  requiredSignage?: string[];
  /** Speed restrictions for oversize */
  speedRestrictions?: string;
  /** Special notes */
  notes?: string;
}

export const COUNTRY_REGULATIONS: CountryRegulation[] = [
  // ══════════════ TIER A — GOLD ══════════════════════════════════
  {
    country: 'US',
    name: 'United States',
    authority: 'Federal Highway Administration (FHWA) + State DOTs',
    authorityUrl: 'https://ops.fhwa.dot.gov/freight/sw/permit_report/',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.11, maxLengthM: 16.15, maxGrossWeightKg: 36287 },
    escortThresholds: {
      singleEscortWidthM: 3.05,
      dualEscortWidthM: 3.66,
      policeEscortWidthM: 4.88,
      escortHeightM: 4.42,
      escortLengthM: 30.48,
      notes: 'Thresholds vary by state. Some states require escorts for any permitted load.',
    },
    permitTypes: ['Single Trip', 'Annual/Blanket', 'Superload', 'Multi-Trip', 'Self-Issue'],
    operatingHours: {
      daylight: true,
      nightRestrictions: 'Most states restrict to daylight (30 min before sunrise - 30 min after sunset)',
      weekendRestrictions: 'Many states restrict Fri PM to Mon AM',
      holidayRestrictions: 'No movement on federal holidays in most states',
    },
    regulatoryRef: '23 CFR 658; 49 CFR 393; State-specific OD regulations',
    localTerm: 'Oversize Load / Wide Load',
    requiredSignage: ['OVERSIZE LOAD banner (7\' x 18")', 'Amber rotating/flashing lights', 'Red flags on load extremities'],
    speedRestrictions: 'Typically 45-55 mph on highways; 25-35 mph through towns; varies by permit',
  },
  {
    country: 'CA',
    name: 'Canada',
    authority: 'Transport Canada + Provincial Ministries of Transportation',
    authorityUrl: 'https://tc.canada.ca/en/road-transportation',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.15, maxLengthM: 23.0, maxGrossWeightKg: 39500 },
    escortThresholds: {
      singleEscortWidthM: 3.2,
      dualEscortWidthM: 3.85,
      policeEscortWidthM: 5.0,
      notes: 'Provincial regulations vary significantly. Alberta and BC have different escort rules.',
    },
    permitTypes: ['Single Trip', 'Annual', 'Project', 'Multi-Trip'],
    operatingHours: {
      daylight: true,
      nightRestrictions: 'Generally daylight only; exceptions for urban curfew compliance',
      weekendRestrictions: 'Province-specific; AB restricts some weekends',
    },
    regulatoryRef: 'Motor Vehicle Transport Act; Provincial Highway Traffic Acts',
    localTerm: 'Oversize Load / Charge Surdimensionnée (QC)',
    requiredSignage: ['OVERSIZE / SURDIMENSIONNÉ banners', 'Amber beacons', 'Red/orange flags'],
  },
  {
    country: 'AU',
    name: 'Australia',
    authority: 'National Heavy Vehicle Regulator (NHVR)',
    authorityUrl: 'https://www.nhvr.gov.au/',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.3, maxLengthM: 19.0, maxGrossWeightKg: 42500 },
    escortThresholds: {
      singleEscortWidthM: 3.5,
      dualEscortWidthM: 4.5,
      policeEscortWidthM: 5.5,
      escortHeightM: 4.6,
      notes: 'NHVR National Class permits cover many standard oversize movements. State-specific requirements for larger loads.',
    },
    permitTypes: ['National Class 1', 'State Access Permit', 'Special Purpose Vehicle'],
    operatingHours: {
      daylight: true,
      nightRestrictions: 'Daylight hours; night moves by special approval only',
      weekendRestrictions: 'State-dependent; NSW restricts some weekends',
    },
    regulatoryRef: 'Heavy Vehicle National Law (HVNL); NHVR Guidelines',
    localTerm: 'Oversize / Over-Dimensional (OD)',
    requiredSignage: ['OVERSIZE signs front/rear', 'Amber flashing beacons', 'Red flags/reflectors'],
    speedRestrictions: '80-90 km/h on highways; reduced in urban areas',
  },
  {
    country: 'GB',
    name: 'United Kingdom',
    authority: 'Department for Transport (DfT) / National Highways',
    authorityUrl: 'https://www.gov.uk/government/organisations/department-for-transport',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.95, maxLengthM: 18.75, maxGrossWeightKg: 44000 },
    escortThresholds: {
      singleEscortWidthM: 3.0,
      dualEscortWidthM: 4.3,
      policeEscortWidthM: 5.0,
      escortHeightM: 4.95,
      notes: 'STGO Categories 1-3 govern escort requirements. ESDAL2 notification required.',
    },
    permitTypes: ['STGO Notification', 'Special Order', 'VR1 Movement Order'],
    operatingHours: {
      nightRestrictions: 'Large Cat 3 loads restricted to night moves in some areas',
      weekendRestrictions: 'No movement on major bank holidays',
    },
    regulatoryRef: 'STGO 2003; Road Vehicles Act 1988; Construction & Use Regulations',
    localTerm: 'Abnormal Indivisible Load (AIL)',
    requiredSignage: ['ABNORMAL LOAD marker boards', 'Amber beacons', 'Side markers'],
  },
  {
    country: 'NZ',
    name: 'New Zealand',
    authority: 'Waka Kotahi NZ Transport Agency',
    authorityUrl: 'https://www.nzta.govt.nz/',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.25, maxLengthM: 20.0, maxGrossWeightKg: 44000 },
    escortThresholds: {
      singleEscortWidthM: 3.1,
      dualEscortWidthM: 4.5,
      notes: 'Pilot vehicle requirements set by overweight/overdimension permit conditions.',
    },
    permitTypes: ['Overweight Permit', 'Overdimension Permit', 'High Productivity Vehicle Permit'],
    operatingHours: { daylight: true },
    regulatoryRef: 'Land Transport Rule: Vehicle Dimensions and Mass 2016',
    localTerm: 'Overweight/Overdimension',
    requiredSignage: ['OVERSIZE signs', 'Flashing beacons'],
  },
  {
    country: 'ZA',
    name: 'South Africa',
    authority: 'South African National Roads Agency Limited (SANRAL)',
    authorityUrl: 'https://www.sanral.co.za/',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.3, maxLengthM: 22.0, maxGrossWeightKg: 56000 },
    escortThresholds: {
      singleEscortWidthM: 3.5,
      dualEscortWidthM: 4.5,
      policeEscortWidthM: 5.0,
    },
    permitTypes: ['Exemption Permit', 'Abnormal Load Permit'],
    operatingHours: { daylight: true, nightRestrictions: 'Daylight only for most abnormal loads' },
    regulatoryRef: 'National Road Traffic Act 93 of 1996; SANS 10260',
    localTerm: 'Abnormal Load',
  },
  {
    country: 'DE',
    name: 'Germany',
    authority: 'Bundesministerium für Digitales und Verkehr (BMDV)',
    authorityUrl: 'https://www.bmdv.bund.de/',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: {
      singleEscortWidthM: 3.0,
      dualEscortWidthM: 3.5,
      policeEscortWidthM: 4.4,
      escortHeightM: 4.4,
      notes: 'BF3 escort for >3.0m width. BF4 + police for >4.4m width. Strict autobahn restrictions.',
    },
    permitTypes: ['Einzelgenehmigung (Single Trip)', 'Dauererlaubnis (Annual)', 'Großraum-/Schwertransportgenehmigung'],
    operatingHours: {
      daylight: true,
      weekendRestrictions: 'No movement Sundays and holidays (Sonntagsfahrverbot)',
      holidayRestrictions: 'Strict holiday bans',
    },
    regulatoryRef: 'StVO §29 Abs. 3; StVZO §70; BMVBS Richtlinien',
    localTerm: 'Großraum- und Schwertransport (GST)',
    requiredSignage: ['Warntafeln (warning plates)', 'Gelbes Blinklicht (amber beacon)', 'Schwertransport signage'],
    speedRestrictions: '60-80 km/h on autobahn; 30-50 km/h in urban areas',
  },
  {
    country: 'NL',
    name: 'Netherlands',
    authority: 'Rijksdienst voor het Wegverkeer (RDW)',
    authorityUrl: 'https://www.rdw.nl/',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 50000 },
    escortThresholds: {
      singleEscortWidthM: 3.0,
      dualEscortWidthM: 3.5,
      policeEscortWidthM: 4.5,
    },
    permitTypes: ['Ontheffing (Exemption)', 'Langdurige Ontheffing (Long-term)'],
    operatingHours: { daylight: true, weekendRestrictions: 'Restricted during peak hours' },
    regulatoryRef: 'Regeling Voertuigen; Wegenverkeerswet 1994',
    localTerm: 'Exceptioneel Transport',
    requiredSignage: ['Exceptioneel Transport borden', 'Zwaailampen (rotating beacons)'],
  },
  {
    country: 'AE',
    name: 'United Arab Emirates',
    authority: 'Federal Transport Authority (FTA) / Municipality Authorities',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 45000 },
    escortThresholds: {
      singleEscortWidthM: 3.0,
      policeEscortWidthM: 3.5,
      notes: 'Police escort mandatory for most oversized movements. NOC required from multiple authorities.',
    },
    permitTypes: ['NOC (No Objection Certificate)', 'Heavy Load Permit', 'Abnormal Load Permit'],
    operatingHours: { nightRestrictions: 'Large loads restricted to night/off-peak in Dubai/Abu Dhabi' },
    regulatoryRef: 'Federal Traffic Law No. 21 of 1995; Municipal regulations',
    localTerm: 'Abnormal Load / Heavy Load',
  },
  {
    country: 'BR',
    name: 'Brazil',
    authority: 'Departamento Nacional de Infraestrutura de Transportes (DNIT)',
    authorityUrl: 'https://www.gov.br/dnit/',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.4, maxLengthM: 19.8, maxGrossWeightKg: 45000 },
    escortThresholds: { singleEscortWidthM: 3.2, dualEscortWidthM: 4.0 },
    permitTypes: ['AET (Autorização Especial de Trânsito)', 'Licença Especial'],
    operatingHours: { daylight: true, nightRestrictions: 'Daylight preferred; night with special authorization' },
    regulatoryRef: 'Resolução CONTRAN 211/2006; CTB (Código de Trânsito Brasileiro)',
    localTerm: 'Carga Indivisível / Carga Especial',
    requiredSignage: ['Sinalização CARGA INDIVISÍVEL', 'Giroflex (rotating amber light)'],
  },

  // ══════════════ TIER B — BLUE ══════════════════════════════════
  {
    country: 'IE', name: 'Ireland', authority: 'Transport Infrastructure Ireland (TII)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.65, maxLengthM: 18.75, maxGrossWeightKg: 44000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 4.3 },
    permitTypes: ['Abnormal Load Permit'], operatingHours: { daylight: true },
    regulatoryRef: 'Road Traffic Act; SI No. 5 of 2003', localTerm: 'Abnormal Load',
  },
  {
    country: 'SE', name: 'Sweden', authority: 'Trafikverket',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.5, maxLengthM: 25.25, maxGrossWeightKg: 64000 },
    escortThresholds: { singleEscortWidthM: 3.1, dualEscortWidthM: 4.5 },
    permitTypes: ['Dispensation', 'Specialtransport Permit'], operatingHours: { daylight: true },
    regulatoryRef: 'Trafikförordningen (1998:1276)', localTerm: 'Specialtransport',
  },
  {
    country: 'NO', name: 'Norway', authority: 'Statens vegvesen',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 19.5, maxGrossWeightKg: 50000 },
    escortThresholds: { singleEscortWidthM: 3.0, dualEscortWidthM: 4.0 },
    permitTypes: ['Dispensasjon', 'Spesialtransport Permit'], operatingHours: { daylight: true },
    regulatoryRef: 'Forskrift om bruk av kjøretøy', localTerm: 'Spesialtransport',
  },
  {
    country: 'DK', name: 'Denmark', authority: 'Vejdirektoratet',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 48000 },
    escortThresholds: { singleEscortWidthM: 3.3, dualEscortWidthM: 4.5 },
    permitTypes: ['Transport Dispensation'], operatingHours: { daylight: true },
    regulatoryRef: 'Færdselsloven; Dimensionsbekendtgørelsen', localTerm: 'Specialtransport',
  },
  {
    country: 'FI', name: 'Finland', authority: 'Traficom / Väylävirasto',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.4, maxLengthM: 25.25, maxGrossWeightKg: 76000 },
    escortThresholds: { singleEscortWidthM: 3.5, dualEscortWidthM: 5.0 },
    permitTypes: ['Erikoiskuljetuslupa (Special Transport Permit)'], operatingHours: { daylight: true },
    regulatoryRef: 'Tieliikennelaki; Erikoiskuljetusasetus', localTerm: 'Erikoiskuljetus',
  },
  {
    country: 'BE', name: 'Belgium', authority: 'SPF Mobilité et Transports',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 44000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 4.25 },
    permitTypes: ['Transport Exceptionnel Permit'], operatingHours: { daylight: true },
    regulatoryRef: 'Arrêté royal du 2 juin 2010', localTerm: 'Transport Exceptionnel / Uitzonderlijk Vervoer',
  },
  {
    country: 'AT', name: 'Austria', authority: 'Bundesministerium für Klimaschutz (BMK)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 4.0 },
    permitTypes: ['Sondertransportbewilligung'], operatingHours: { daylight: true, weekendRestrictions: 'Weekend/holiday bans apply' },
    regulatoryRef: 'StVO (Straßenverkehrsordnung); KFG 1967', localTerm: 'Sondertransport',
  },
  {
    country: 'CH', name: 'Switzerland', authority: 'Bundesamt für Strassen (ASTRA)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 3.5 },
    permitTypes: ['Sonderbewilligung', 'Ausnahmebewilligung'], operatingHours: { daylight: true, weekendRestrictions: 'Sunday driving ban (Sonntagsfahrverbot)' },
    regulatoryRef: 'SVG (Strassenverkehrsgesetz); VRV', localTerm: 'Sondertransport / Schwertransport',
  },
  {
    country: 'ES', name: 'Spain', authority: 'Dirección General de Tráfico (DGT)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 4.5 },
    permitTypes: ['Autorización Complementaria', 'Autorización Genérica', 'Autorización Específica'],
    operatingHours: { daylight: true, holidayRestrictions: 'Restricted on major holidays and weekends in summer' },
    regulatoryRef: 'Reglamento General de Circulación; Real Decreto 2822/1998', localTerm: 'Transporte Especial',
  },
  {
    country: 'FR', name: 'France', authority: 'Direction Générale des Infrastructures, des Transports et des Mobilités (DGITM)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0, dualEscortWidthM: 4.0, policeEscortWidthM: 4.0, notes: 'Category 1/2/3 classification determines escort level.' },
    permitTypes: ['1ère Catégorie', '2ème Catégorie', '3ème Catégorie'],
    operatingHours: { daylight: true, weekendRestrictions: 'Restricted Sat 12:00 - Mon 06:00', holidayRestrictions: 'No movement during Bison Futé "rouge" periods' },
    regulatoryRef: 'Arrêté du 4 mai 2006; Code de la route', localTerm: 'Convoi Exceptionnel / Transport Exceptionnel',
    requiredSignage: ['Panneau CONVOI EXCEPTIONNEL', 'Gyrophare orange'],
  },
  {
    country: 'IT', name: 'Italy', authority: 'Ministero delle Infrastrutture e dei Trasporti (MIT)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 44000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 4.0 },
    permitTypes: ['Autorizzazione Trasporto Eccezionale'], operatingHours: { daylight: true },
    regulatoryRef: 'Codice della Strada Art. 10; DM 18/07/2006', localTerm: 'Trasporto Eccezionale',
  },
  {
    country: 'PT', name: 'Portugal', authority: 'Instituto da Mobilidade e dos Transportes (IMT)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Licença Especial de Circulação'], operatingHours: { daylight: true },
    regulatoryRef: 'Código da Estrada; DL 257/2007', localTerm: 'Transporte Especial',
  },
  {
    country: 'SA', name: 'Saudi Arabia', authority: 'General Authority for Transport (GAT)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 45000 },
    escortThresholds: { policeEscortWidthM: 3.0, notes: 'Government/police escort mandatory for all oversize.' },
    permitTypes: ['Abnormal Load Permit', 'Heavy Equipment Transport Permit'],
    operatingHours: { nightRestrictions: 'Large loads often restricted to night in urban areas' },
    regulatoryRef: 'Traffic Law Royal Decree M/85', localTerm: 'Abnormal Load / حمولة غير طبيعية',
  },
  {
    country: 'QA', name: 'Qatar', authority: 'Ministry of Transport and Communications',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 45000 },
    escortThresholds: { policeEscortWidthM: 3.0 },
    permitTypes: ['Heavy Load Permit'], operatingHours: { nightRestrictions: 'Night movement preferred' },
    regulatoryRef: 'Traffic Law No. 19 of 2007', localTerm: 'حمولة ثقيلة',
  },
  {
    country: 'MX', name: 'Mexico', authority: 'Secretaría de Infraestructura, Comunicaciones y Transportes (SICT)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.25, maxLengthM: 23.0, maxGrossWeightKg: 48500 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Permiso Especial de Tránsito'], operatingHours: { daylight: true },
    regulatoryRef: 'NOM-012-SCT-2-2008; Ley de Caminos', localTerm: 'Transporte Sobredimensionado',
  },
  {
    country: 'IN', name: 'India', authority: 'Ministry of Road Transport and Highways (MoRTH)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 3.8, maxLengthM: 18.0, maxGrossWeightKg: 40200 },
    escortThresholds: { singleEscortWidthM: 3.0, notes: 'State RTOs issue permits; police escort often required.' },
    permitTypes: ['Over Dimension Cargo Permit (ODC)'], operatingHours: { daylight: true },
    regulatoryRef: 'Motor Vehicles Act 1988; CMVR 1989', localTerm: 'Over Dimensional Cargo (ODC)',
  },
  {
    country: 'ID', name: 'Indonesia', authority: 'Direktorat Jenderal Perhubungan Darat (DJPD)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.2, maxLengthM: 18.0, maxGrossWeightKg: 35000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Izin Dispensasi Angkutan'], operatingHours: { daylight: true },
    regulatoryRef: 'PP 55/2012 tentang Kendaraan', localTerm: 'Muatan Berlebih / Angkutan Khusus',
  },
  {
    country: 'TH', name: 'Thailand', authority: 'Department of Highways (DOH)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.0, maxLengthM: 18.0, maxGrossWeightKg: 37000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Special Vehicle Permit'], operatingHours: { nightRestrictions: 'Night movement common for large loads in urban areas' },
    regulatoryRef: 'Highway Act B.E. 2535', localTerm: 'รถขนส่งพิเศษ',
  },

  // ══════════════ TIER C — SILVER ════════════════════════════════
  {
    country: 'PL', name: 'Poland', authority: 'Generalna Dyrekcja Dróg Krajowych i Autostrad (GDDKiA)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.2, policeEscortWidthM: 4.0 },
    permitTypes: ['Zezwolenie Kategorii I-VII'], operatingHours: { daylight: true },
    regulatoryRef: 'Prawo o Ruchu Drogowym; Rozporządzenie MTBiGM', localTerm: 'Transport Nadzwyczajny',
  },
  {
    country: 'CZ', name: 'Czech Republic', authority: 'Ministerstvo dopravy',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 48000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Povolení k přepravě nadměrného nákladu'], operatingHours: { daylight: true },
    regulatoryRef: 'Zákon 361/2000 Sb.', localTerm: 'Nadměrný náklad',
  },
  {
    country: 'SK', name: 'Slovakia', authority: 'Ministerstvo dopravy SR',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Povolenie na prepravu nadrozmerného nákladu'], operatingHours: { daylight: true },
    regulatoryRef: 'Zákon č. 106/2018 Z.z.', localTerm: 'Nadrozmerný náklad',
  },
  {
    country: 'HU', name: 'Hungary', authority: 'Magyar Közút Nonprofit Zrt.',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Túlméretes szállítási engedély'], operatingHours: { daylight: true },
    regulatoryRef: 'KRESZ (1/1975. KPM-BM rendelet)', localTerm: 'Túlméretes rakomány',
  },
  {
    country: 'SI', name: 'Slovenia', authority: 'DARS (Družba za avtoceste v RS)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Dovoljenje za izredni prevoz'], operatingHours: { daylight: true },
    regulatoryRef: 'Zakon o pravilih cestnega prometa (ZPrCP)', localTerm: 'Izredni prevoz',
  },
  {
    country: 'EE', name: 'Estonia', authority: 'Transpordiamet',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Eriveoluba'], operatingHours: { daylight: true },
    regulatoryRef: 'Liiklusseadus', localTerm: 'Erivedu',
  },
  {
    country: 'LV', name: 'Latvia', authority: 'VSIA Latvijas Valsts ceļi',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Atļauja lielgabarīta pārvadājumiem'], operatingHours: { daylight: true },
    regulatoryRef: 'Ceļu satiksmes likums', localTerm: 'Lielgabarīta krava',
  },
  {
    country: 'LT', name: 'Lithuania', authority: 'Lietuvos automobilių kelių direkcija',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Leidimas viršgabaritiniam kroviniui'], operatingHours: { daylight: true },
    regulatoryRef: 'Kelių eismo taisyklės', localTerm: 'Viršgabaritinis krovinys',
  },
  {
    country: 'HR', name: 'Croatia', authority: 'Hrvatske ceste d.o.o.',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Dozvola za izvanredni prijevoz'], operatingHours: { daylight: true },
    regulatoryRef: 'Zakon o sigurnosti prometa na cestama', localTerm: 'Izvanredni prijevoz',
  },
  {
    country: 'RO', name: 'Romania', authority: 'Compania Națională de Administrare a Infrastructurii Rutiere (CNAIR)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.2 },
    permitTypes: ['Autorizație specială de transport'], operatingHours: { daylight: true },
    regulatoryRef: 'OG 43/1997; HG 1391/2006', localTerm: 'Transport agabaritic',
  },
  {
    country: 'BG', name: 'Bulgaria', authority: 'Агенция Пътна Инфраструктура (API)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Разрешително за извънгабаритен транспорт'], operatingHours: { daylight: true },
    regulatoryRef: 'Закон за движението по пътищата', localTerm: 'Извънгабаритен товар',
  },
  {
    country: 'GR', name: 'Greece', authority: 'Ministry of Infrastructure and Transport',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Ειδική Άδεια Κυκλοφορίας'], operatingHours: { daylight: true },
    regulatoryRef: 'Κώδικας Οδικής Κυκλοφορίας (ΚΟΚ)', localTerm: 'Υπερβαρύ Φορτίο',
  },
  {
    country: 'TR', name: 'Turkey', authority: 'Karayolları Genel Müdürlüğü (KGM)',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.0, maxLengthM: 18.75, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0, policeEscortWidthM: 4.0 },
    permitTypes: ['Özel Yük Taşıma İzni'], operatingHours: { daylight: true },
    regulatoryRef: 'Karayolları Trafik Kanunu 2918', localTerm: 'Gabari Dışı Yük',
  },
  {
    country: 'KW', name: 'Kuwait', authority: 'Ministry of Public Works',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 45000 },
    escortThresholds: { policeEscortWidthM: 3.0 },
    permitTypes: ['Heavy Load Permit'], operatingHours: { nightRestrictions: 'Night preferred' },
    regulatoryRef: 'Traffic Law No. 67/1976', localTerm: 'حمولة ثقيلة',
  },
  {
    country: 'OM', name: 'Oman', authority: 'Ministry of Transport, Communications and Information Technology',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 45000 },
    escortThresholds: { policeEscortWidthM: 3.0 },
    permitTypes: ['Abnormal Load Permit'], operatingHours: { nightRestrictions: 'Night movement preferred for large loads' },
    regulatoryRef: 'Royal Decree 28/93', localTerm: 'حمولة غير اعتيادية',
  },
  {
    country: 'BH', name: 'Bahrain', authority: 'Ministry of Transportation and Telecommunications',
    standardLimits: { maxWidthM: 2.55, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 44000 },
    escortThresholds: { policeEscortWidthM: 3.0 },
    permitTypes: ['Heavy Vehicle Permit'], operatingHours: { nightRestrictions: 'Off-peak preferred' },
    regulatoryRef: 'Traffic Law 1979', localTerm: 'حمولة كبيرة',
  },
  {
    country: 'SG', name: 'Singapore', authority: 'Land Transport Authority (LTA)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.5, maxLengthM: 16.5, maxGrossWeightKg: 38000 },
    escortThresholds: { singleEscortWidthM: 2.7 },
    permitTypes: ['Vehicle and Load Permit'], operatingHours: { nightRestrictions: 'Large moves restricted to 2300-0500' },
    regulatoryRef: 'Road Traffic Act; Road Traffic Rules', localTerm: 'Oversize Vehicle',
  },
  {
    country: 'MY', name: 'Malaysia', authority: 'Jabatan Kerja Raya (JKR)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.5, maxLengthM: 18.0, maxGrossWeightKg: 38000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Permit Kenderaan Muatan Besar'], operatingHours: { daylight: true },
    regulatoryRef: 'Road Transport Act 1987', localTerm: 'Kenderaan Muatan Besar',
  },
  {
    country: 'JP', name: 'Japan', authority: 'Ministry of Land, Infrastructure, Transport and Tourism (MLIT)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 3.8, maxLengthM: 12.0, maxGrossWeightKg: 25000 },
    escortThresholds: { singleEscortWidthM: 3.0, notes: 'Very strict. All special vehicles require MLIT online permit application (Tokushu Sharyo system).' },
    permitTypes: ['特殊車両通行許可 (Special Vehicle Permit)'], operatingHours: { nightRestrictions: 'Night moves common for large loads in urban areas' },
    regulatoryRef: '車両制限令 (Vehicle Limitation Order); 道路法 (Road Act)', localTerm: '特殊車両 (Tokushu Sharyō)',
    speedRestrictions: 'Strict speed monitoring; 50-60 km/h highway limit for special vehicles',
  },
  {
    country: 'KR', name: 'South Korea', authority: 'Ministry of Land, Infrastructure and Transport (MOLIT)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.0, maxLengthM: 16.7, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['특수차량 운행허가 (Special Vehicle Permit)'], operatingHours: { daylight: true },
    regulatoryRef: '도로법 (Road Act); 도로교통법 (Road Traffic Act)', localTerm: '특수차량 (Teuksu Charyang)',
  },
  {
    country: 'CL', name: 'Chile', authority: 'Ministerio de Transportes y Telecomunicaciones',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.2, maxLengthM: 18.6, maxGrossWeightKg: 45000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Autorización de Carga Especial'], operatingHours: { daylight: true },
    regulatoryRef: 'Decreto Supremo 158/1980', localTerm: 'Carga Sobredimensionada',
  },
  {
    country: 'AR', name: 'Argentina', authority: 'Dirección Nacional de Vialidad (DNV)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.1, maxLengthM: 18.5, maxGrossWeightKg: 45000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Permiso de Tránsito de Cargas Especiales'], operatingHours: { daylight: true },
    regulatoryRef: 'Ley Nacional de Tránsito 24.449', localTerm: 'Carga Especial / Sobredimensionada',
  },
  {
    country: 'CO', name: 'Colombia', authority: 'Instituto Nacional de Vías (INVIAS)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.4, maxLengthM: 18.5, maxGrossWeightKg: 48000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Permiso para Carga Extradimensionada'], operatingHours: { daylight: true },
    regulatoryRef: 'Resolución 4100 de 2004', localTerm: 'Carga Extradimensionada',
  },
  {
    country: 'PE', name: 'Peru', authority: 'Ministerio de Transportes y Comunicaciones (MTC)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.3, maxLengthM: 18.0, maxGrossWeightKg: 48000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Autorización Especial de Tránsito'], operatingHours: { daylight: true },
    regulatoryRef: 'DS 058-2003-MTC', localTerm: 'Carga Especial',
  },
  {
    country: 'VN', name: 'Vietnam', authority: 'Directorate for Roads of Vietnam (DRVN)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.2, maxLengthM: 18.0, maxGrossWeightKg: 34000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Giấy phép vận tải quá tải / quá khổ'], operatingHours: { daylight: true },
    regulatoryRef: 'Luật Giao Thông Đường Bộ 2008', localTerm: 'Hàng quá khổ / quá tải',
  },
  {
    country: 'PH', name: 'Philippines', authority: 'Department of Public Works and Highways (DPWH)',
    standardLimits: { maxWidthM: 2.5, maxHeightM: 4.2, maxLengthM: 18.0, maxGrossWeightKg: 36000 },
    escortThresholds: { singleEscortWidthM: 3.0 },
    permitTypes: ['Special Permit for Oversized/Overweight Vehicles'], operatingHours: { nightRestrictions: 'Manila: night movement only for large loads' },
    regulatoryRef: 'Republic Act 8794; DPWH D.O.', localTerm: 'Oversized/Overweight Vehicle',
  },

  // ══════════════ TIER D — SLATE ═════════════════════════════════
  {
    country: 'UY', name: 'Uruguay', authority: 'Ministerio de Transporte y Obras Públicas (MTOP)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.3, maxLengthM: 18.5, maxGrossWeightKg: 45000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Permiso de Carga Especial'], operatingHours: { daylight: true },
    regulatoryRef: 'Ley Nº 15.462', localTerm: 'Carga Especial',
  },
  {
    country: 'PA', name: 'Panama', authority: 'Autoridad del Tránsito y Transporte Terrestre (ATTT)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.2, maxLengthM: 18.0, maxGrossWeightKg: 42000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Permiso Especial de Circulación'], operatingHours: { daylight: true },
    regulatoryRef: 'Ley 14 de 1993', localTerm: 'Carga Sobredimensionada',
  },
  {
    country: 'CR', name: 'Costa Rica', authority: 'Ministerio de Obras Públicas y Transportes (MOPT)',
    standardLimits: { maxWidthM: 2.6, maxHeightM: 4.1, maxLengthM: 18.0, maxGrossWeightKg: 40000 },
    escortThresholds: { singleEscortWidthM: 3.5 },
    permitTypes: ['Permiso de Carga Especial'], operatingHours: { daylight: true },
    regulatoryRef: 'Ley de Tránsito por Vías Públicas y Terrestres Nº 9078', localTerm: 'Carga Especial',
  },
];

// ─── Helper Functions ──────────────────────────────────────────

/** Get regulations for a specific country */
export function getRegulationsForCountry(country: CountryCode): CountryRegulation | undefined {
  return COUNTRY_REGULATIONS.find(r => r.country === country);
}

/** Get all countries requiring police escort at a given width */
export function getCountriesRequiringPoliceEscort(widthM: number): CountryRegulation[] {
  return COUNTRY_REGULATIONS.filter(r =>
    r.escortThresholds.policeEscortWidthM && widthM >= r.escortThresholds.policeEscortWidthM
  );
}

/** Get all countries by escort requirement for a given width */
export function getEscortRequirement(widthM: number): { noEscort: string[]; singleEscort: string[]; dualEscort: string[]; policeEscort: string[] } {
  const result = { noEscort: [] as string[], singleEscort: [] as string[], dualEscort: [] as string[], policeEscort: [] as string[] };
  for (const r of COUNTRY_REGULATIONS) {
    const { singleEscortWidthM, dualEscortWidthM, policeEscortWidthM } = r.escortThresholds;
    if (policeEscortWidthM && widthM >= policeEscortWidthM) result.policeEscort.push(r.country);
    else if (dualEscortWidthM && widthM >= dualEscortWidthM) result.dualEscort.push(r.country);
    else if (singleEscortWidthM && widthM >= singleEscortWidthM) result.singleEscort.push(r.country);
    else result.noEscort.push(r.country);
  }
  return result;
}
