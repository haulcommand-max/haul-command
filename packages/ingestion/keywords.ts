/**
 * HAUL COMMAND — 200K+ Operator Discovery Keywords
 * 30+ keywords per language, including industry-adjacent terms
 * that feed into the oversize/heavy-haul operator ecosystem.
 *
 * ALL 8 POSITIONS:
 * 1. pevo_lead_chase (drivers)  — 200K+ target
 * 2. height_pole                — 30K target (1:10)
 * 3. bucket_truck               — 12K target (1:25)
 * 4. route_survey               — 6K target  (1:50)
 * 5. police_escort              — 6K target  (1:100)
 * 6. broker                     — 750 target (1:400)
 * 7. steer_car                  — 1.5K target (1:200)
 * 8. advanced_visibility        — ancillary (covered by driver queries)
 */

// ═══════════════════════════════════════════════════════════════
// CORE OVERSIZE/ESCORT KEYWORDS (by language)
// ═══════════════════════════════════════════════════════════════

export const KEYWORDS_EN = [
  // Direct escort/pilot
  'pilot car service', 'escort vehicle service', 'oversize load escort',
  'wide load escort', 'heavy haul escort', 'superload escort',
  'height pole service', 'bucket truck escort', 'route survey service',
  'oversize load pilot car', 'wide load pilot vehicle',
  'permitted load escort', 'lead car service', 'chase car service',
  'high pole escort', 'over dimensional escort',
  // Heavy haul & transport
  'heavy haul trucking', 'oversize load transport', 'over dimensional cargo',
  'flatbed heavy haul', 'lowboy transport service', 'specialized carrier',
  'superload trucking company', 'permitted trucking service',
  'abnormal load transport', 'wide load trucking',
  // Industry-adjacent (feeds operators)
  'crane transport service', 'wind turbine blade transport',
  'wind energy transport', 'solar panel transport oversize',
  'modular building transport', 'prefab home delivery',
  'transformer transport heavy', 'generator transport oversize',
  'mining equipment transport', 'oil rig equipment hauling',
  'construction equipment hauling', 'bridge beam transport',
  'steel beam delivery oversize', 'tank transport heavy haul',
  'vessel transport oversize', 'yacht transport oversize',
  'mobile home transport', 'manufactured home movers',
  // Permit & compliance
  'oversize load permit service', 'heavy haul permit agent',
  'superload permit expediter', 'overweight permit service',
  'route survey oversize load', 'bridge analysis heavy haul',
  // Regional terms (US/CA/AU/NZ)
  'pilot car operator', 'escort driver service',
  'flagging service oversize load', 'traffic control escort',
];

export const KEYWORDS_ES = [
  'vehiculo escolta', 'carga sobredimensionada', 'escolta de carga ancha',
  'transporte de carga pesada', 'transporte sobredimensionado',
  'escolta de cargas especiales', 'vehiculo piloto transporte',
  'transporte de maquinaria pesada', 'carga extradimensionada',
  'transporte especial carretera', 'grua transporte pesado',
  'transporte aspas eolicas', 'transporte modular pesado',
  'permiso carga sobredimensionada', 'transporte equipos mineros',
  'transporte tanques industriales', 'escolta carga extralarga',
];

export const KEYWORDS_PT = [
  'veículo escolta', 'carga superdimensionada', 'escolta de carga larga',
  'transporte de carga pesada', 'transporte superdimensionado',
  'escolta para cargas especiais', 'batedor de cargas especiais',
  'transporte de equipamentos pesados', 'carga indivisível transporte',
  'transporte de pás eólicas', 'transporte de máquinas pesadas',
  'autorização especial de trânsito', 'transporte excepcional rodoviário',
];

export const KEYWORDS_DE = [
  'Begleitfahrzeug', 'Schwertransport Begleitung', 'Überbreite Ladung',
  'Schwerlasttransport', 'Sondertransport Begleitung',
  'Großraumtransport', 'Schwerlast Genehmigung',
  'Windrad Transport', 'Kran Transport Schwerlast',
  'Überbreiter Transport Begleitung', 'BF3 Begleitfahrzeug',
  'Schwertransportbegleitung', 'Ausnahmetransport',
];

export const KEYWORDS_FR = [
  'véhicule pilote', 'convoi exceptionnel', 'transport exceptionnel',
  'escorte convoi', 'transport hors gabarit', 'charge lourde transport',
  'guidage convoi exceptionnel', 'transport indivisible',
  'voiture pilote convoi', 'transport surdimensionné',
  'escorte routière transport', 'autorisation transport exceptionnel',
];

export const KEYWORDS_NL = [
  'begeleidingsvoertuig', 'exceptioneel transport',
  'zwaar transport begeleiding', 'breed transport',
  'speciaal transport begeleiding', 'vergunning zwaar transport',
  'windmolen transport', 'buitengewoon transport',
  'transport begeleiding dienst', 'zwaar vervoer',
];

export const KEYWORDS_AR = [
  'مرافقة حمولة كبيرة', 'نقل ثقيل', 'نقل معدات ثقيلة',
  'مرافقة نقل خاص', 'تصريح نقل حمولة كبيرة',
  'نقل مواد ضخمة', 'نقل معدات بناء', 'شاحنات نقل ثقيل',
];

export const KEYWORDS_IT = [
  'trasporto eccezionale', 'scorta trasporto eccezionale',
  'veicolo pilota trasporto', 'trasporto fuori sagoma',
  'carico eccezionale', 'trasporto pesante speciale',
  'autorizzazione trasporto eccezionale', 'scorta tecnica trasporto',
];

export const KEYWORDS_TR = [
  'ağır yük taşımacılığı', 'gabari dışı yük taşıma',
  'özel yük taşımacılığı', 'eskort araç hizmeti',
  'büyük yük refakat aracı', 'ağır nakliye firması',
];

export const KEYWORDS_PL = [
  'transport nienormatywny', 'pojazd pilotujący',
  'ładunek ponadgabarytowy', 'pilot transportu ciężkiego',
  'transport ponadnormatywny', 'zezwolenie transport szczególny',
];

export const KEYWORDS_JA = [
  '特殊車両 誘導', '重量物運搬', '大型貨物輸送',
  '特殊輸送 先導', '重機運搬',
];

export const KEYWORDS_KO = [
  '특수운송 호송', '중량물 운반', '과적화물 운송',
  '특수차량 운송', '대형화물 운송업체',
];

// GB-specific terms (different regulatory language)
export const KEYWORDS_GB = [
  'abnormal load escort', 'wide load escort UK', 'heavy haulage escort',
  'ESDAL escort service', 'abnormal load notification',
  'police escort abnormal load', 'VR1 escort service',
  'STGO escort service', 'special order escort',
  ...KEYWORDS_EN,
];

// India-specific terms
export const KEYWORDS_IN = [
  'ODC transport', 'Over Dimensional Cargo escort',
  'OWC transport service', 'heavy lift transport India',
  'project cargo transport', 'abnormal load escort India',
  ...KEYWORDS_EN,
];

// South Africa specific
export const KEYWORDS_ZA = [
  'abnormal load escort', 'abnormal load pilot', 'wide load pilot vehicle',
  'TRH11 escort service', 'exemption permit transport',
  ...KEYWORDS_EN,
];

// All keywords grouped by language code
export const ALL_KEYWORDS: Record<string, string[]> = {
  en: KEYWORDS_EN,
  es: KEYWORDS_ES,
  pt: KEYWORDS_PT,
  de: KEYWORDS_DE,
  fr: KEYWORDS_FR,
  nl: KEYWORDS_NL,
  ar: KEYWORDS_AR,
  it: KEYWORDS_IT,
  tr: KEYWORDS_TR,
  pl: KEYWORDS_PL,
  ja: KEYWORDS_JA,
  ko: KEYWORDS_KO,
  // Specialized per-country
  gb: KEYWORDS_GB,
  in: KEYWORDS_IN,
  za: KEYWORDS_ZA,
};

// ═══════════════════════════════════════════════════════════════
// BROKER KEYWORDS (by language)
// ═══════════════════════════════════════════════════════════════

export const BROKER_KEYWORDS_EN = [
  'heavy haul freight broker', 'oversize load freight broker',
  'specialized freight broker', 'flatbed freight broker',
  'superload freight broker', 'heavy equipment freight broker',
  'wind energy freight broker', 'project cargo broker',
  'overweight freight broker', 'oil field freight broker',
  'mining freight broker', 'construction freight broker',
  'crane freight broker', 'transformer freight broker',
  'modular freight broker', 'permitted load broker',
  'freight brokerage oversize', 'heavy haul load board',
  'oversize load board', 'specialized transport broker',
  'wide load freight agent', 'heavy haul dispatcher',
  'oversize load dispatcher', 'freight agent heavy equipment',
];

export const BROKER_KEYWORDS_ES = [
  'agente de carga pesada', 'broker transporte sobredimensionado',
  'agente de flete especial', 'corredor de carga pesada',
  'despachador carga sobredimensionada', 'agente transporte especial',
  'broker carga proyecto', 'intermediario flete pesado',
];

export const BROKER_KEYWORDS_PT = [
  'agente de frete pesado', 'corretor de transporte especial',
  'despachante carga superdimensionada', 'agente carga projeto',
  'corretor frete industrial', 'intermediário transporte pesado',
];

export const BROKER_KEYWORDS_DE = [
  'Schwertransport Spediteur', 'Spezialtransport Vermittler',
  'Schwerlast Frachtmakler', 'Projektladung Spediteur',
  'Überbreite Ladung Vermittlung', 'Schwertransport Disponent',
];

export const BROKER_KEYWORDS_FR = [
  'courtier transport exceptionnel', 'affréteur convoi exceptionnel',
  'courtier fret lourd', 'commissionnaire transport spécial',
  'affréteur charge lourde', 'courtier projet industriel',
];

export const BROKER_KEYWORDS_AR = [
  'وسيط نقل ثقيل', 'سمسار شحن كبير', 'وكيل نقل معدات',
  'وسيط شحن مشاريع', 'سمسار نقل خاص',
];

export const ALL_BROKER_KEYWORDS: Record<string, string[]> = {
  en: BROKER_KEYWORDS_EN,
  es: BROKER_KEYWORDS_ES,
  pt: BROKER_KEYWORDS_PT,
  de: BROKER_KEYWORDS_DE,
  fr: BROKER_KEYWORDS_FR,
  ar: BROKER_KEYWORDS_AR,
};

// ═══════════════════════════════════════════════════════════════
// POSITION-SPECIFIC KEYWORDS (support positions)
// These map to the rate_benchmarks service_types in the DB
// ═══════════════════════════════════════════════════════════════

/** Height Pole & Specialized Escort — 1:10 ratio to drivers */
export const HEIGHT_POLE_KEYWORDS = [
  'height pole service', 'high pole escort', 'height pole operator',
  'utility line escort', 'power line clearance escort',
  'overhead wire escort', 'high pole truck service',
  'height clearance vehicle', 'high pole pilot car',
  'height pole company', 'height pole near me',
];

/** Bucket Truck (Utility/Line Lift) — 1:25 ratio to drivers */
export const BUCKET_TRUCK_KEYWORDS = [
  'bucket truck escort service', 'utility bucket truck hire',
  'line lift truck service', 'aerial lift truck rental',
  'bucket truck operator', 'utility escort vehicle',
  'overhead line lift service', 'bucket truck for hire',
  'bucket truck company near me', 'utility line lift escort',
];

/** Route Survey (Engineering) — 1:50 ratio to drivers */
export const ROUTE_SURVEY_KEYWORDS = [
  'route survey service oversize', 'bridge clearance survey',
  'heavy haul route planning', 'oversize load route analysis',
  'route feasibility study', 'bridge weight analysis',
  'overhead clearance survey', 'route engineering service',
  'pre-trip route survey', 'route survey company',
];

/** Police Escort — 1:100 ratio (state + local combined) */
export const POLICE_ESCORT_KEYWORDS = [
  'police escort oversize load', 'state police escort service',
  'law enforcement escort', 'municipal police escort',
  'highway patrol escort', 'traffic escort service',
  'police escort permit', 'sworn officer escort',
  'off duty police escort', 'certified law enforcement escort',
];

/** Steerman / Rear Escort — 1:200 ratio */
export const STEERMAN_KEYWORDS = [
  'steer car service', 'rear steer escort', 'jeep steer heavy haul',
  'rear escort operator', 'trailing escort vehicle', 'steerman heavy haul',
  'push car service oversize', 'steer axle operator',
  'rear pilot car', 'steer truck service', 'rear chase car',
];

/** Flagger / Traffic Control (from ESC) — 1:8 ratio to drivers */
export const FLAGGER_KEYWORDS = [
  'certified flagger service', 'flagger for hire', 'traffic flagger',
  'construction zone flagger', 'MUTCD flagger', 'work zone flagger',
  'flagging company', 'flagging service near me', 'flag person service',
  'road construction flagger', 'highway flagger service',
  'certified flagger operator', 'traffic control flagger',
];

/** Traffic Control Supervisor (TCS) (from ESC) — 1:50 ratio */
export const TCS_KEYWORDS = [
  'traffic control supervisor', 'traffic control company',
  'traffic management plan service', 'work zone traffic control',
  'TCP traffic control', 'road closure traffic management',
  'traffic control plan oversize load', 'TCS certified operator',
  'highway traffic control service', 'temporary traffic control',
  'traffic control contractor', 'TMA truck service',
];

/** WITPAC / Interstate Pilot Car (from ESC) — overlaps PEVO, 1:20 ratio */
export const WITPAC_KEYWORDS = [
  'WITPAC certified pilot car', 'interstate pilot car',
  'multi-state escort vehicle', 'cross-state pilot car',
  'interstate escort service', 'WITPAC operator',
  'interstate oversize load escort', 'cross-border pilot car',
];

/** Permit Services / Expediters — 1:40 ratio to drivers */
export const PERMIT_FILER_KEYWORDS = [
  'oversize load permit service', 'trucking permit expediter',
  'permit service company', 'heavy haul permit service',
  'oversize permit agency', 'DOT permit service',
  'state permit filing service', 'wide load permit expediter',
];

/** Drone Route Surveying — 1:100 ratio */
export const DRONE_KEYWORDS = [
  'commercial drone route survey', 'UAV route planning service',
  'drone mapping oversize load', 'drone utility inspection',
  'aerial surveying for heavy haul', 'drone clearance survey',
  'Part 107 drone route mapping', 'industrial drone survey',
];

/** Autonomous Freight Escorts — 1:600 ratio */
export const AV_SUPPORT_KEYWORDS = [
  'autonomous truck escort', 'driverless freight support vehicle',
  'AV-ready pilot car', 'autonomous vehicle support car',
  'relay convoy escort service', 'robotruck escort',
];

/** All position keywords indexed by service_type code */
export const POSITION_KEYWORDS: Record<string, string[]> = {
  pevo_lead_chase: KEYWORDS_EN,
  height_pole: HEIGHT_POLE_KEYWORDS,
  bucket_truck: BUCKET_TRUCK_KEYWORDS,
  route_survey: ROUTE_SURVEY_KEYWORDS,
  police_escort: POLICE_ESCORT_KEYWORDS,
  steerman: STEERMAN_KEYWORDS,
  broker: BROKER_KEYWORDS_EN,
  flagger: FLAGGER_KEYWORDS,
  traffic_control_supervisor: TCS_KEYWORDS,
  witpac: WITPAC_KEYWORDS,
  permit_filer: PERMIT_FILER_KEYWORDS,
  drone_survey: DRONE_KEYWORDS,
  av_support: AV_SUPPORT_KEYWORDS,
};

/**
 * Target ratios relative to 200K drivers.
 */
export const POSITION_TARGETS = {
  pevo_lead_chase:           { ratio: 1,       target: 200_000, float: 1.0 },
  height_pole:               { ratio: 0.10,    target: 30_000,  float: 1.5 },
  flagger:                   { ratio: 0.125,   target: 37_500,  float: 1.5 },
  bucket_truck:              { ratio: 0.04,    target: 12_000,  float: 1.5 },
  route_survey:              { ratio: 0.02,    target: 6_000,   float: 1.5 },
  police_escort:             { ratio: 0.01,    target: 6_000,   float: 1.5 },
  traffic_control_supervisor:{ ratio: 0.02,    target: 6_000,   float: 1.5 },
  witpac:                    { ratio: 0.05,    target: 15_000,  float: 1.5 },
  permit_filer:              { ratio: 0.025,   target: 5_000,   float: 1.5 },
  steerman:                  { ratio: 0.005,   target: 1_500,   float: 1.5 },
  drone_survey:              { ratio: 0.01,    target: 2_000,   float: 1.5 },
  broker:                    { ratio: 0.0025,  target: 750,     float: 1.5 },
  av_support:                { ratio: 0.0016,  target: 333,     float: 1.5 },
} as const;

