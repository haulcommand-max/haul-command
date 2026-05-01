import { COUNTRIES } from './seo-countries';

export type AutomationBand = 'physical-first' | 'assisted-workflow' | 'highly-automatable' | 'data-product';

export interface RoleIntelligenceRecord {
  slug: string;
  categoryKey: string;
  title: string;
  family: string;
  summary: string;
  demandSignal: string;
  automationBand: AutomationBand;
  automationScore: number;
  marketplaceValueScore: number;
  dataMonetizationScore: number;
  directoryFit: string;
  trainingFit: string;
  toolsFit: string[];
  corridorFit: string;
  paySignals: string[];
  credentialSignals: string[];
  painPoints: string[];
  countrySearchTerms: Record<string, string[]>;
}

export const ROLE_INTELLIGENCE: RoleIntelligenceRecord[] = [
  {
    slug: 'pilot-car-operator',
    categoryKey: 'pilot_car_operator',
    title: 'Pilot Car / Escort Vehicle Operator',
    family: 'Escort Operations',
    summary: 'Escorts oversize and overdimension loads, warns traffic, coordinates with the heavy haul driver, and helps protect bridges, utilities, lanes, and public safety.',
    demandSignal: 'Core role for oversize loads in the US, Canada, Australia, New Zealand, UK, Europe, Gulf markets, Brazil, and other heavy transport countries, but the title changes by country.',
    automationBand: 'assisted-workflow',
    automationScore: 42,
    marketplaceValueScore: 96,
    dataMonetizationScore: 88,
    directoryFit: 'Primary provider profile, claim listing, broker request, availability, rating, training badge, and corridor coverage surface.',
    trainingFit: 'Road Ready path, high-pole basics, route communication, state/country compliance, incident reporting, and broker professionalism.',
    toolsFit: ['escort requirement checker', 'rate estimator', 'equipment checklist', 'availability broadcast', 'broker request intake'],
    corridorFit: 'Attach to corridor pages where escorts are required because of width, height, length, weight, terrain, curfews, or infrastructure constraints.',
    paySignals: ['hourly escort rate', 'day rate', 'mileage add-on', 'high-pole premium', 'short-notice premium', 'multi-day standby'],
    credentialSignals: ['state escort card', 'pilot vehicle certification', 'insurance', 'vehicle equipment', 'amber lights', 'signage', 'radio', 'country-specific escort credentials'],
    painPoints: ['brokers cannot find available escorts fast enough', 'operators miss loads because they are invisible', 'rates are unclear by market', 'requirements change by jurisdiction'],
    countrySearchTerms: {
      US: ['pilot car operator', 'escort vehicle operator', 'high pole escort'],
      CA: ['pilot car operator', 'escort vehicle operator', 'oversize escort'],
      GB: ['abnormal load escort', 'escort vehicle', 'STGO escort'],
      AU: ['pilot vehicle operator', 'oversize escort', 'OSOM escort'],
      NZ: ['pilot vehicle', 'overdimension escort'],
      DE: ['BF3 Fahrer', 'Begleitfahrzeug Fahrer', 'Schwertransport Begleitung'],
      NL: ['transportbegeleider', 'exceptioneel vervoer begeleiding'],
      BR: ['carro batedor', 'escolta de carga', 'veículo de escolta'],
      AE: ['pilot car', 'heavy transport escort', 'abnormal load escort'],
      MX: ['vehículo piloto', 'escolta de carga sobredimensionada'],
    },
  },
  {
    slug: 'heavy-haul-driver',
    categoryKey: 'heavy_haul_driver',
    title: 'Heavy Haul / Specialized Transport Driver',
    family: 'Driving & Capacity',
    summary: 'Moves oversized, overweight, project, construction, mining, oilfield, wind, transformer, modular, and industrial cargo using specialized tractors and trailers.',
    demandSignal: 'Indeed samples surfaced RGN, Landoll, lowboy, step deck, STGO, low loader, AZ, HGV, CE, LZV, CNH E, UAE heavy vehicle, and NZ Class 4/5 language across markets.',
    automationBand: 'assisted-workflow',
    automationScore: 38,
    marketplaceValueScore: 94,
    dataMonetizationScore: 91,
    directoryFit: 'Carrier/operator profile, available equipment, lane preferences, credential status, pay/rate benchmark, and broker capacity request surface.',
    trainingFit: 'Securement, route readiness, pre/post-trip inspection, load documentation, dimensional compliance, customer communication, and heavy haul career path.',
    toolsFit: ['driver pay benchmark', 'securement checklist', 'equipment match tool', 'route risk checklist', 'load-card eligibility rules'],
    corridorFit: 'Use demand by origin/destination and equipment type to rank corridor pages and show shortage/demand heatmaps.',
    paySignals: ['hourly rate', 'weekly gross', 'annual pay', 'per-mile pay', 'percent of load', 'detention', 'layover', 'tarp pay', 'permit/toll reimbursement'],
    credentialSignals: ['Class A CDL', 'AZ', 'HGV Class 1', 'CPC', 'tachograph card', 'CE', 'Code 95', 'CNH E', 'MOPP', 'UAE Category 4', 'NZ Class 4/5'],
    painPoints: ['qualified heavy haul drivers are hard to find', 'pay varies by equipment and axle configuration', 'credential language differs by country', 'manual dispatch slows matching'],
    countrySearchTerms: {
      US: ['heavy haul driver', 'RGN driver', 'lowboy driver', 'Landoll driver', 'step deck driver'],
      CA: ['heavy haul AZ driver', 'over-dimensional AZ driver', 'float driver'],
      GB: ['HGV Class 1 low loader driver', 'STGO driver', 'abnormal load driver'],
      AU: ['heavy haul driver', 'HC truck driver', 'road train driver', 'float driver'],
      NZ: ['Class 5 truck driver', 'heavy truck driver', 'overdimension transport driver'],
      DE: ['LKW Fahrer Schwertransport', 'Berufskraftfahrer CE', 'Schwerlast Fahrer'],
      NL: ['vrachtwagenchauffeur exceptioneel vervoer', 'chauffeur zwaar transport', 'chauffeur CE LZV'],
      BR: ['motorista carreteiro', 'motorista carga pesada', 'CNH E carreta'],
      AE: ['heavy truck driver', 'GCC heavy vehicle driver', 'project cargo driver'],
      MX: ['operador quinta rueda', 'chofer carga pesada', 'operador plataforma'],
    },
  },
  {
    slug: 'permit-coordinator',
    categoryKey: 'permit_services',
    title: 'Oversize Permit Coordinator',
    family: 'Permits & Compliance',
    summary: 'Prepares, submits, tracks, audits, and coordinates oversize/overweight, abnormal load, OSOM, STGO, AET, and transport permits across jurisdictions.',
    demandSignal: 'This role is often hidden inside dispatcher, project coordinator, transport planner, operations coordinator, or permit service postings rather than using one universal title.',
    automationBand: 'highly-automatable',
    automationScore: 82,
    marketplaceValueScore: 87,
    dataMonetizationScore: 95,
    directoryFit: 'Provider profile for permit services, permit expediters, and internal broker/carrier workflows.',
    trainingFit: 'Permit basics, document intake, jurisdiction rules, route constraints, audit trail, and exception handling.',
    toolsFit: ['permit checker', 'document intake checklist', 'jurisdiction rule lookup', 'permit status tracker', 'fee/rule benchmark'],
    corridorFit: 'Connect to corridors where permit timing, curfews, escorts, bridge reviews, and state/country boundaries create friction.',
    paySignals: ['annual coordinator salary', 'per-permit service fee', 'rush permit premium', 'multi-state package fee'],
    credentialSignals: ['jurisdiction knowledge', 'TMS skills', 'DOT/regulatory knowledge', 'route geography', 'document accuracy'],
    painPoints: ['wrong permit delays loads', 'country/state rules are fragmented', 'rush requests create margin', 'brokers need visibility into status'],
    countrySearchTerms: {
      US: ['oversize permit coordinator', 'heavy haul permit specialist', 'transportation permit coordinator'],
      CA: ['oversize permit coordinator', 'overdimensional permit specialist'],
      GB: ['abnormal load planner', 'STGO transport planner', 'movement order coordinator'],
      AU: ['OSOM permit coordinator', 'NHVR permit coordinator', 'route assessment coordinator'],
      NZ: ['overdimension permit coordinator', 'transport compliance coordinator'],
      DE: ['Schwertransport Genehmigung', 'Transportdisponent Schwerlast'],
      NL: ['ontheffing exceptioneel transport', 'planner exceptioneel vervoer'],
      BR: ['AET transporte especial', 'licença carga indivisível'],
      AE: ['RTA transport permit coordinator', 'project cargo permit coordinator'],
      MX: ['permiso carga sobredimensionada', 'coordinador permisos transporte especial'],
    },
  },
  {
    slug: 'heavy-haul-dispatcher',
    categoryKey: 'heavy_haul_dispatcher',
    title: 'Heavy Haul Dispatcher / Project Coordinator',
    family: 'Dispatch & Operations',
    summary: 'Assigns capacity, coordinates drivers and escorts, monitors shipments, negotiates rates, handles accessorials, updates TMS records, and solves route/load problems in real time.',
    demandSignal: 'Indeed samples showed project coordinator, transport planner, dispatcher, TMS, rate negotiation, track-and-trace, carrier relationship, and capacity assignment language.',
    automationBand: 'highly-automatable',
    automationScore: 78,
    marketplaceValueScore: 90,
    dataMonetizationScore: 93,
    directoryFit: 'Internal workflow role plus public company capability signal for brokers and carriers.',
    trainingFit: 'Dispatch SOP, broker communication, TMS hygiene, accessorial capture, carrier selection, and escalation handling.',
    toolsFit: ['capacity matcher', 'track-and-trace board', 'rate negotiation notes', 'accessorial calculator', 'SOP checklist'],
    corridorFit: 'Dispatch demand maps reveal where brokers, carriers, and escort networks are underbuilt.',
    paySignals: ['annual salary', 'hourly coordinator pay', 'bonus/incentive', 'after-hours premium'],
    credentialSignals: ['DOT knowledge', 'multi-state geography', 'TMS experience', 'dispatch operations', 'customer service', 'carrier relationship management'],
    painPoints: ['capacity assignment is manual', 'rate negotiation data is fragmented', 'shipment visibility is weak', 'accessorials are missed'],
    countrySearchTerms: {
      US: ['heavy haul dispatcher', 'heavy haul project coordinator', 'transportation coordinator'],
      CA: ['transport dispatcher', 'heavy haul dispatcher', 'AZ fleet dispatcher'],
      GB: ['transport planner', 'heavy haul transport planner', 'fleet planner'],
      AU: ['transport allocator', 'heavy haul scheduler', 'fleet controller'],
      NZ: ['transport dispatcher', 'fleet dispatcher', 'transport planner'],
      DE: ['Disponent Schwertransport', 'Speditionskaufmann', 'Transportdisponent'],
      NL: ['transportplanner', 'planner exceptioneel vervoer', 'vrachtwagen planner'],
      BR: ['analista de transporte', 'coordenador de transporte', 'programador de transporte'],
      AE: ['project cargo coordinator', 'transport planner', 'heavy transport coordinator'],
      MX: ['coordinador de transporte', 'despachador de transporte', 'planner logístico'],
    },
  },
  {
    slug: 'route-surveyor',
    categoryKey: 'route_survey',
    title: 'Route Surveyor / Route Assessment Specialist',
    family: 'Route Intelligence',
    summary: 'Checks route feasibility for height, width, weight, bridges, turns, utilities, grades, curfews, police/escort requirements, and site access.',
    demandSignal: 'Often appears as route survey, route assessment, project cargo operations, engineering support, transport planner, or permit/escort coordination work.',
    automationBand: 'assisted-workflow',
    automationScore: 58,
    marketplaceValueScore: 92,
    dataMonetizationScore: 97,
    directoryFit: 'Specialist provider profile and corridor intelligence contributor.',
    trainingFit: 'Survey documentation, photos, hazard capture, turn analysis, bridge/utility escalation, and route report standards.',
    toolsFit: ['route survey checklist', 'photo evidence uploader', 'turn radius notes', 'bridge/utility risk log', 'corridor risk score'],
    corridorFit: 'Highest-value input for corridor pages because route friction is commercial intelligence brokers will pay for.',
    paySignals: ['survey fee', 'day rate', 'rush survey premium', 'engineering review add-on'],
    credentialSignals: ['route assessment experience', 'engineering support', 'local road knowledge', 'utility/bridge clearance workflow'],
    painPoints: ['bad surveys cause delays', 'local route knowledge is trapped in people’s heads', 'brokers need reusable corridor intelligence'],
    countrySearchTerms: {
      US: ['route surveyor heavy haul', 'oversize route survey', 'route survey specialist'],
      CA: ['route survey oversize load', 'heavy haul route survey'],
      GB: ['abnormal load route survey', 'STGO route planner'],
      AU: ['OSOM route assessment', 'pilot vehicle route survey'],
      NZ: ['overdimension route assessment', 'route survey transport'],
      DE: ['Streckenerkundung Schwertransport', 'Schwertransport Routenplanung'],
      NL: ['route verkenning exceptioneel transport', 'transportbegeleiding route'],
      BR: ['vistoria de rota carga indivisível', 'estudo de rota transporte especial'],
      AE: ['project cargo route survey', 'heavy transport route assessment'],
      MX: ['estudio de ruta carga sobredimensionada', 'ruta transporte especial'],
    },
  },
  {
    slug: 'heavy-diesel-mechanic',
    categoryKey: 'heavy_diesel_mechanic',
    title: 'Heavy Diesel / Heavy Vehicle Mechanic',
    family: 'Maintenance & Uptime',
    summary: 'Maintains and repairs commercial trucks, heavy equipment, mining machines, brakes, hydraulics, engines, electrical systems, and fleet assets needed to keep heavy transport moving.',
    demandSignal: 'Samples surfaced South African diesel mechanic demand, Australian heavy diesel fitter/mining equipment demand, and repeated inspection/maintenance requirements across driver postings.',
    automationBand: 'assisted-workflow',
    automationScore: 45,
    marketplaceValueScore: 84,
    dataMonetizationScore: 81,
    directoryFit: 'Repair, mobile mechanic, installer, fleet maintenance, and emergency infrastructure profile category.',
    trainingFit: 'Pre-trip defect triage, preventive maintenance, heavy equipment awareness, mobile repair workflow, and downtime documentation.',
    toolsFit: ['breakdown request', 'maintenance checklist', 'mobile repair locator', 'parts/vendor directory', 'downtime cost calculator'],
    corridorFit: 'Map scarce repair capacity along corridors, ports, mines, oilfields, wind routes, and remote staging areas.',
    paySignals: ['hourly mechanic pay', 'monthly pay', 'callout fee', 'overtime', 'site rate'],
    credentialSignals: ['Red Seal', 'diesel fitter trade certificate', 'heavy vehicle mechanic', 'air brake knowledge', 'mining equipment experience'],
    painPoints: ['breakdowns kill schedules', 'remote corridors lack repair capacity', 'downtime cost is not visible', 'brokers need rescue options'],
    countrySearchTerms: {
      US: ['heavy diesel mechanic', 'mobile truck mechanic', 'fleet mechanic'],
      CA: ['heavy duty mechanic', '310T mechanic', 'diesel mechanic'],
      GB: ['HGV mechanic', 'heavy vehicle technician'],
      AU: ['heavy diesel fitter', 'HD fitter', 'heavy vehicle mechanic'],
      NZ: ['heavy diesel mechanic', 'heavy vehicle technician'],
      DE: ['LKW Mechaniker', 'Nutzfahrzeug Mechatroniker'],
      NL: ['vrachtwagen monteur', 'bedrijfswagenmonteur'],
      BR: ['mecânico diesel', 'mecânico caminhão pesado'],
      AE: ['heavy truck mechanic', 'diesel mechanic'],
      MX: ['mecánico diesel', 'mecánico tractocamión'],
    },
  },
];

export function getRoleBySlug(slug: string) {
  return ROLE_INTELLIGENCE.find((role) => role.slug === slug);
}

export function getRolesForCountry(countryCode: string) {
  const upper = countryCode.toUpperCase();
  return ROLE_INTELLIGENCE.map((role) => ({
    ...role,
    localSearchTerms: role.countrySearchTerms[upper] ?? role.countrySearchTerms.US ?? [],
  }));
}

export function roleCoverageSummary() {
  return {
    countryCount: COUNTRIES.length,
    roleCount: ROLE_INTELLIGENCE.length,
    highestDataProducts: ROLE_INTELLIGENCE.filter((role) => role.dataMonetizationScore >= 90).map((role) => role.slug),
    mostAutomatable: ROLE_INTELLIGENCE.filter((role) => role.automationScore >= 75).map((role) => role.slug),
  };
}
