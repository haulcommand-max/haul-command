/**
 * Haul Command — Global Position Catalog
 * 
 * Complete catalog of every escort/support position across all 120 countries.
 * Includes country-specific roles, international variants, and future positions.
 * 
 * Tier A (Gold): US, CA, AU, GB, NZ, ZA, DE, NL, AE, BR
 * Tier B (Blue): IE, SE, NO, DK, FI, BE, AT, CH, ES, FR, IT, PT, SA, QA, MX, IN, ID, TH
 * Tier C (Silver): PL, CZ, SK, HU, SI, EE, LV, LT, HR, RO, BG, GR, TR, KW, OM, BH, SG, MY, JP, KR, CL, AR, CO, PE, VN, PH
 * Tier D (Slate): UY, PA, CR
 */

// All 120 country codes
export const ALL_COUNTRIES = [
  'US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR',
  'IE','SE','NO','DK','FI','BE','AT','CH','ES','FR','IT','PT','SA','QA','MX','IN','ID','TH',
  'PL','CZ','SK','HU','SI','EE','LV','LT','HR','RO','BG','GR','TR','KW','OM','BH','SG','MY','JP','KR','CL','AR','CO','PE','VN','PH',
  'UY','PA','CR',
] as const;

export type CountryCode = typeof ALL_COUNTRIES[number];

export type Tier = 'A' | 'B' | 'C' | 'D';

export const COUNTRY_TIERS: Record<CountryCode, Tier> = {
  US:'A',CA:'A',AU:'A',GB:'A',NZ:'A',ZA:'A',DE:'A',NL:'A',AE:'A',BR:'A',
  IE:'B',SE:'B',NO:'B',DK:'B',FI:'B',BE:'B',AT:'B',CH:'B',ES:'B',FR:'B',IT:'B',PT:'B',SA:'B',QA:'B',MX:'B',IN:'B',ID:'B',TH:'B',
  PL:'C',CZ:'C',SK:'C',HU:'C',SI:'C',EE:'C',LV:'C',LT:'C',HR:'C',RO:'C',BG:'C',GR:'C',TR:'C',KW:'C',OM:'C',BH:'C',SG:'C',MY:'C',JP:'C',KR:'C',CL:'C',AR:'C',CO:'C',PE:'C',VN:'C',PH:'C',
  UY:'D',PA:'D',CR:'D',
};

// ─── Position Categories ─────────────────────────────────────
export type PositionCategory =
  | 'escort_vehicle'     // Lead/chase/pilot vehicles
  | 'specialized_vehicle'// Height pole, bucket truck, sign truck
  | 'law_enforcement'    // Police, military, gendarmerie
  | 'traffic_control'    // Flaggers, TMA, signal operators
  | 'engineering'        // Route survey, bridge assessment, structural
  | 'logistics'          // Permits, customs, port coordination
  | 'safety'             // Safety officers, load inspection
  | 'equipment_ops'      // Crane, steerman, rigging
  | 'communications'     // Radio, drone, satellite
  | 'future'             // Emerging/AV/EV/AI positions
  ;

export interface GlobalPosition {
  id: string;
  category: PositionCategory;
  label_en: string;
  /** Local language name where applicable */
  label_local?: string;
  description: string;
  countries: CountryCode[];
  /** Certification or license typically required */
  certifications?: string[];
  /** Is this a future/emerging position? */
  isFuture?: boolean;
}

// ─── COMPLETE POSITION CATALOG ───────────────────────────────

export const GLOBAL_POSITIONS: GlobalPosition[] = [

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: ESCORT VEHICLES
  // ══════════════════════════════════════════════════════════════

  {
    id: 'lead_car',
    category: 'escort_vehicle',
    label_en: 'Lead Car (Front Escort / Pilot Vehicle)',
    description: 'Pilot vehicle traveling ahead of the oversize load, warning oncoming traffic, checking clearances, and communicating hazards to the driver.',
    countries: [...ALL_COUNTRIES],
  },
  {
    id: 'chase_car',
    category: 'escort_vehicle',
    label_en: 'Chase Car (Rear Escort)',
    description: 'Pilot vehicle traveling behind the oversize load, providing rear traffic protection and preventing unsafe passing.',
    countries: [...ALL_COUNTRIES],
  },
  {
    id: 'lead_car_de',
    category: 'escort_vehicle',
    label_en: 'BF3 Escort Vehicle (Begleitfahrzeug)',
    label_local: 'Begleitfahrzeug BF3',
    description: 'BF3-certified escort vehicle required for Großraum- und Schwertransporte (oversize and heavy transport) in Germany. Must carry specific signage, amber lights, and communication equipment per StVO §35.',
    countries: ['DE','AT','CH'],
    certifications: ['BF3 Certification'],
  },
  {
    id: 'lead_car_nl',
    category: 'escort_vehicle',
    label_en: 'Exceptional Transport Escort',
    label_local: 'Transportbegeleiding',
    description: 'RDW-certified escort vehicle for exceptioneel transport in the Netherlands and Belgium. Requires specific vehicle markings and operator certification.',
    countries: ['NL','BE'],
    certifications: ['RDW Transport Escort Certification'],
  },
  {
    id: 'lead_car_fr',
    category: 'escort_vehicle',
    label_en: 'Pilot Vehicle (Convoi Exceptionnel)',
    label_local: 'Véhicule Pilote / Voiture Pilote',
    description: 'Pilot vehicle for convoi exceptionnel (abnormal loads) in France. Classified by categories 1-3 based on load dimensions. Must display "CONVOI EXCEPTIONNEL" signage.',
    countries: ['FR'],
    certifications: ['Attestation de Formation de Guideur'],
  },
  {
    id: 'lead_car_br',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (Batedor)',
    label_local: 'Batedor / Escolta de Carga Especial',
    description: 'Escort vehicle for carga indivisível/especial (special/indivisible cargo) in Brazil. Regulated by DNIT resolution. Must carry rotating amber lights and specific signage.',
    countries: ['BR'],
    certifications: ['DNIT Escort Certification'],
  },
  {
    id: 'lead_car_latam',
    category: 'escort_vehicle',
    label_en: 'Cargo Escort (Escolta)',
    label_local: 'Escolta de Carga / Vehículo Guía',
    description: 'Escort vehicle for carga especial/sobredimensionada across Latin American countries. Requirements vary by national transport authority.',
    countries: ['MX','AR','CL','CO','PE','UY','PA','CR'],
  },
  {
    id: 'lead_car_au',
    category: 'escort_vehicle',
    label_en: 'Pilot Vehicle (NHVR Accredited)',
    description: 'Accredited pilot vehicle operator per NHVR (National Heavy Vehicle Regulator) or state authority requirements in Australia. Must hold valid pilot vehicle driver authorization.',
    countries: ['AU'],
    certifications: ['NHVR Pilot Vehicle Driver Authorization', 'State-specific PV license'],
  },
  {
    id: 'lead_car_nz',
    category: 'escort_vehicle',
    label_en: 'Pilot Vehicle (Waka Kotahi)',
    description: 'Pilot vehicle for overweight/overdimension permits under Waka Kotahi NZ Transport Agency regulations.',
    countries: ['NZ'],
    certifications: ['NZTA Pilot License'],
  },
  {
    id: 'lead_car_gb',
    category: 'escort_vehicle',
    label_en: 'Abnormal Load Escort',
    description: 'Escort vehicle for abnormal indivisible loads on UK roads under STGO (Special Types General Order) regulations. Notified via ESDAL2 system.',
    countries: ['GB','IE'],
    certifications: ['AILS Escort Certification'],
  },
  {
    id: 'lead_car_za',
    category: 'escort_vehicle',
    label_en: 'Abnormal Load Escort (SANRAL)',
    description: 'Escort vehicle for abnormal loads on South African national roads. Regulated by SANRAL and provincial authorities.',
    countries: ['ZA'],
    certifications: ['SANRAL Escort Operator Permit'],
  },
  {
    id: 'lead_car_nordics',
    category: 'escort_vehicle',
    label_en: 'Follow Vehicle (Specialtransport)',
    label_local: 'Följebil (SE) / Følgebil (NO/DK) / Saattoauto (FI)',
    description: 'Escort vehicle for specialtransport in Nordic countries. Regulations set by Trafikverket (SE), Statens vegvesen (NO), Vejdirektoratet (DK), Traficom (FI).',
    countries: ['SE','NO','DK','FI'],
  },
  {
    id: 'lead_car_it',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (Trasporto Eccezionale)',
    label_local: 'Scorta Tecnica',
    description: 'Technical escort (scorta tecnica) for trasporto eccezionale in Italy. Required for loads exceeding standard dimensions per Codice della Strada.',
    countries: ['IT'],
  },
  {
    id: 'lead_car_es',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (Transporte Especial)',
    label_local: 'Vehículo de Acompañamiento',
    description: 'Escort vehicle for transporte especial in Spain. Regulated by DGT (Dirección General de Tráfico).',
    countries: ['ES','PT'],
  },
  {
    id: 'lead_car_jp',
    category: 'escort_vehicle',
    label_en: 'Guide Vehicle (Yūdō-sha)',
    label_local: '誘導車 (Yūdō-sha)',
    description: 'Specialized guide vehicle for tokushu sharyo (特殊車両 — special vehicles) in Japan. Extremely strict dimensional and routing rules enforced by MLIT.',
    countries: ['JP'],
    certifications: ['MLIT Special Vehicle Escort License'],
  },
  {
    id: 'lead_car_kr',
    category: 'escort_vehicle',
    label_en: 'Guide Vehicle (Seondo Charyang)',
    label_local: '선도차량',
    description: 'Guide vehicle for oversize/overweight transport in South Korea. Regulated by MOLIT (Ministry of Land, Infrastructure and Transport).',
    countries: ['KR'],
  },
  {
    id: 'lead_car_sea',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (SE Asia)',
    description: 'Escort or pilot vehicle for oversize transport in Southeast Asian countries. Typically coordinated through national highway departments.',
    countries: ['ID','TH','SG','MY','VN','PH'],
  },
  {
    id: 'lead_car_gulf',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (Gulf States)',
    description: 'Private or government-coordinated escort vehicle for abnormal loads in GCC member states.',
    countries: ['AE','SA','QA','KW','OM','BH'],
  },
  {
    id: 'lead_car_eeur',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (Eastern Europe)',
    label_local: 'Pojazd Pilotujący (PL) / Doprovodné vozidlo (CZ/SK)',
    description: 'Escort vehicle for transport nadzwyczajny (extraordinary transport) in Eastern European countries.',
    countries: ['PL','CZ','SK','HU','SI','HR','RO','BG','EE','LV','LT'],
  },
  {
    id: 'lead_car_gr_tr',
    category: 'escort_vehicle',
    label_en: 'Escort Vehicle (Greece/Turkey)',
    description: 'Escort vehicle for exceptional transport on national road networks.',
    countries: ['GR','TR'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: SPECIALIZED VEHICLES
  // ══════════════════════════════════════════════════════════════

  {
    id: 'height_pole',
    category: 'specialized_vehicle',
    label_en: 'Height Pole Operator',
    description: 'Operates a height pole / measuring vehicle to check overhead clearances for tall loads before and during transport.',
    countries: ['US','CA','AU','GB','DE','NZ','FR','NL','BE','AT','CH','SE','NO','IE','ZA'],
  },
  {
    id: 'bucket_truck',
    category: 'specialized_vehicle',
    label_en: 'Bucket Truck (Utility/Line Lift)',
    description: 'Lifts utility wires and cables for overheight loads moving through urban corridors. Requires coordination with utility companies.',
    countries: ['US','CA','AU','NZ'],
  },
  {
    id: 'sign_truck',
    category: 'specialized_vehicle',
    label_en: 'Sign Truck / TMA (Truck-Mounted Attenuator)',
    description: 'Provides rear crash protection and changeable message signs for highway-level traffic management during moves.',
    countries: ['US','CA','AU','GB','DE','NL','NZ','ZA','FR','IT','ES'],
  },
  {
    id: 'arrow_board',
    category: 'specialized_vehicle',
    label_en: 'Arrow Board / VMS Trailer',
    description: 'Trailer-mounted variable message sign or arrow board providing advance warning to approaching traffic.',
    countries: ['US','CA','AU','GB','NZ','ZA','DE','NL'],
  },
  {
    id: 'lowboy_spotter',
    category: 'specialized_vehicle',
    label_en: 'Lowboy Spotter Vehicle',
    description: 'Guides lowboy/step-deck trailers during loading and unloading at job sites, ensuring safe clearance from obstacles.',
    countries: ['US','CA','AU','BR','MX'],
  },
  {
    id: 'water_truck',
    category: 'specialized_vehicle',
    label_en: 'Water Truck (Dust Suppression)',
    description: 'Provides dust suppression on unpaved access roads during transport of oversize loads to/from remote sites.',
    countries: ['US','CA','AU','ZA','BR','CL','PE','IN','SA','AE'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: LAW ENFORCEMENT
  // ══════════════════════════════════════════════════════════════

  {
    id: 'state_police',
    category: 'law_enforcement',
    label_en: 'State Police / Highway Patrol Escort',
    description: 'State trooper or highway patrol officer providing official law enforcement escort for loads exceeding state thresholds.',
    countries: ['US'],
    certifications: ['Active law enforcement status'],
  },
  {
    id: 'local_police',
    category: 'law_enforcement',
    label_en: 'Local / Municipal Police Escort',
    description: 'City or county police providing escort through municipal jurisdictions, intersections, and urban areas.',
    countries: ['US','CA','MX','BR','AR','CL','CO','CR','PA','UY','PE'],
  },
  {
    id: 'traffic_police_eu',
    category: 'law_enforcement',
    label_en: 'Traffic Police Escort (Europe)',
    label_local: 'Polizeibegleitung (DE) / Escorte de Police (FR)',
    description: 'National or regional traffic police providing escort for highest-category oversize loads. Mandatory above certain dimensional thresholds.',
    countries: ['DE','FR','IT','ES','PT','AT','CH','NL','BE','PL','CZ','SK','HU','RO','BG','GR','HR','SI','EE','LV','LT'],
  },
  {
    id: 'traffic_police_gulf',
    category: 'law_enforcement',
    label_en: 'Traffic Police Escort (Gulf States)',
    description: 'Government traffic police escort required for all oversize movements on public roads in GCC countries.',
    countries: ['SA','AE','QA','KW','OM','BH'],
  },
  {
    id: 'gendarmerie',
    category: 'law_enforcement',
    label_en: 'Gendarmerie / National Police Escort',
    description: 'Military police or gendarmerie providing escort for oversize loads on national highways and restricted corridors.',
    countries: ['FR','TR','IN','IT','ES','PT','BR','AR','RO'],
  },
  {
    id: 'military_escort',
    category: 'law_enforcement',
    label_en: 'Military / Armed Government Escort',
    description: 'Military or government armed escort for defense cargo, high-value equipment, or transport through conflict/high-risk zones.',
    countries: ['US','CA','AU','GB','FR','DE','SA','AE','IN','TR','BR','MX','CO','ZA','ID','TH','PH','VN'],
  },
  {
    id: 'armed_security',
    category: 'law_enforcement',
    label_en: 'Armed Private Security Escort',
    description: 'Private armed security personnel for high-value cargo transport through regions with theft/hijacking risk.',
    countries: ['BR','MX','CO','ZA','IN','PH','VN','PE','AR','ID','TH'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: TRAFFIC CONTROL
  // ══════════════════════════════════════════════════════════════

  {
    id: 'flagger',
    category: 'traffic_control',
    label_en: 'Flagger / Traffic Controller',
    description: 'Certified flagger providing traffic control at intersections, construction zones, and tight turns during oversize moves.',
    countries: ['US','CA','AU','NZ','GB','IE','ZA','DE','NL','EE','LV','LT','HR','SI','BG','DK','FI'],
    certifications: ['Flagger certification (ATSSA/state)', 'Traffic controller ticket (AU/NZ)'],
  },
  {
    id: 'signal_operator',
    category: 'traffic_control',
    label_en: 'Traffic Signal Operator',
    description: 'Operates portable traffic signals or coordinates with TMC to hold/override signals during oversize load passage.',
    countries: ['US','CA','AU','GB','NZ','DE','NL','FR'],
  },
  {
    id: 'intersection_controller',
    category: 'traffic_control',
    label_en: 'Intersection Controller',
    description: 'Manages traffic flow at specific intersections along the route, stopping cross-traffic as loads make wide turns.',
    countries: ['US','CA','AU','GB','NZ','DE','NL','BE','FR','IT','ES','ZA','BR','MX','JP','KR','KW','OM','BH','DK','FI','PL','CZ','SK','HU','SI','HR','RO','BG','GR'],
  },
  {
    id: 'road_closure_crew',
    category: 'traffic_control',
    label_en: 'Road Closure / Rolling Block Crew',
    description: 'Team that performs rolling road closures and lane blocks for superloads occupying multiple lanes.',
    countries: ['US','CA','AU','GB','DE','NL','FR','IT','JP','KR','AE','SA','KW','OM','BH','QA'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: ENGINEERING
  // ══════════════════════════════════════════════════════════════

  {
    id: 'route_survey',
    category: 'engineering',
    label_en: 'Route Survey Engineer',
    description: 'Pre-surveys the route for height, weight, width, and turn clearances. Documents bridges, overhead utilities, road conditions, and construction zones.',
    countries: ['US','CA','AU','GB','DE','FR','NL','BE','BR','MX','ZA','NZ','JP','IN','KR','IT','ES','AE','SA'],
  },
  {
    id: 'bridge_engineer',
    category: 'engineering',
    label_en: 'Bridge Assessment Engineer',
    description: 'Structural engineer who assesses bridge load capacity, issues crossing permits, and determines speed/axle restrictions for superloads.',
    countries: ['US','CA','AU','GB','DE','NL','FR','NZ','ZA','JP','KR','IN','BR','IT','SE','NO'],
    certifications: ['Licensed PE/CE', 'Bridge inspection cert'],
  },
  {
    id: 'tmp_author',
    category: 'engineering',
    label_en: 'Traffic Management Plan (TMP) Author',
    description: 'Prepares detailed traffic management plans required for major oversize movements, including detour routes, signal changes, and public notifications.',
    countries: ['AU','NZ','GB','IE','US','CA','DE','NL','ZA','AE','SA'],
  },
  {
    id: 'pavement_engineer',
    category: 'engineering',
    label_en: 'Pavement / Road Assessment Engineer',
    description: 'Assesses road surface capacity and condition to ensure pavement can handle proposed axle loads without damage.',
    countries: ['US','CA','AU','GB','DE','NL','NZ','ZA','JP','FR'],
  },
  {
    id: 'drone_survey',
    category: 'engineering',
    label_en: 'Drone Route Survey Operator',
    description: 'Aerial drone inspection of bridges, overpasses, tight clearance points, and access roads before a move.',
    countries: ['US','CA','AU','GB','DE','FR','NZ','NL','AE','SA','JP','KR','BR','ZA','IT','ES','IN'],
    certifications: ['FAA Part 107 (US)', 'CASA RPA License (AU)', 'CAA Drone License (UK)'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: LOGISTICS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'permit_runner',
    category: 'logistics',
    label_en: 'Permit Runner / Expediter',
    description: 'Procures oversize/overweight permits from DOTs, provincial agencies, or national transport authorities. Manages all regulatory paperwork and approvals.',
    countries: ['US','CA','AU','GB','DE','NL','FR','IT','ES','BR','MX','ZA','NZ','IN','AE','SA','JP','KR','CL','AR','CO','PE','UY','PA','CR'],
  },
  {
    id: 'customs_broker',
    category: 'logistics',
    label_en: 'Customs Broker / Border Specialist',
    description: 'Manages customs clearance, bond documentation, and border crossing coordination for international oversize shipments.',
    countries: ['US','CA','MX','AU','NZ','GB','IE','DE','NL','BE','FR','AT','CH','BR','AR','CL','CO','AE','SA','IN','JP','KR','SG','MY','TH','PA','CR','UY','PE','EE','LV','LT'],
  },
  {
    id: 'port_coordinator',
    category: 'logistics',
    label_en: 'Port Logistics Coordinator',
    description: 'Coordinates port-to-site or site-to-port logistics for oversize cargo arriving/departing via maritime shipping. Manages stevedoring, lay-down areas, and port exit routing.',
    countries: ['US','CA','AU','GB','NL','DE','BE','FR','IT','ES','BR','MX','AE','SA','IN','JP','KR','ZA','NZ','SG','TH','VN','PH','ID','CL','AR','CO','PE','UY','PA','CR','EE','LV','LT'],
  },
  {
    id: 'utility_coordinator',
    category: 'logistics',
    label_en: 'Utility Coordinator',
    description: 'Coordinates with electric, telephone, cable, and fiber companies to lift, remove, or temporarily relocate utility lines along the transport route.',
    countries: ['US','CA','AU','NZ','GB','DE','NL','FR','ZA','BR'],
  },
  {
    id: 'railroad_coordinator',
    category: 'logistics',
    label_en: 'Railroad Crossing Coordinator / Flagman',
    description: 'Coordinates with railroad companies to flag and manage level crossing windows for oversize loads. Schedules train holds and manages crossing protection.',
    countries: ['US','CA','AU','NZ','IN','ZA','BR','AR','MX','DE','FR','JP','KR'],
  },
  {
    id: 'weigh_station_coord',
    category: 'logistics',
    label_en: 'Weigh Station Coordinator',
    description: 'Pre-coordinates with weigh stations along the route to arrange bypass or inspection windows for permitted loads.',
    countries: ['US','CA','AU','BR','MX','IN'],
  },
  {
    id: 'toll_coordinator',
    category: 'logistics',
    label_en: 'Toll Plaza Coordinator',
    description: 'Coordinates with toll authorities for oversize load passage, arranges barrier lifts, and manages special toll lanes.',
    countries: ['US','CA','FR','IT','ES','PT','BR','AR','CL','MX','AU','JP','KR','IN','TH','MY'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: SAFETY
  // ══════════════════════════════════════════════════════════════

  {
    id: 'safety_officer',
    category: 'safety',
    label_en: 'Safety Officer / Spotter',
    description: 'On-site safety management for superloads. Provides real-time hazard identification, coordinates crew safety, and ensures regulatory compliance.',
    countries: ['US','CA','AU','GB','DE','FR','NZ','ZA','BR','NL','BE','AE','SA','IN','JP','IT','ES','MX','EE','LV','LT','UY','PA','CR'],
  },
  {
    id: 'load_inspector',
    category: 'safety',
    label_en: 'Load Securement Inspector',
    description: 'Inspects chains, binders, straps, and blocking/bracing before departure. Verifies compliance with DOT/national securement standards.',
    countries: ['US','CA','AU','GB','DE','NL','NZ','ZA','BR','MX','FR','IT','IN','JP','KR','AE','EE','LV','LT','UY','PA','CR'],
    certifications: ['FMCSA securement (US)', 'Chain of Responsibility (AU)'],
  },
  {
    id: 'compliance_officer',
    category: 'safety',
    label_en: 'DOT / Regulatory Compliance Officer',
    description: 'Ensures all transport documentation, permits, vehicle inspections, driver qualifications, and load configurations meet regulatory requirements.',
    countries: ['US','CA','AU','GB','DE','NL','FR','NZ','ZA','IT','ES','BR','MX','IN','JP','AE','SA','KW','OM','BH','QA','PL','CZ','SK','HU','SI','HR','RO','BG','GR','DK','FI'],
  },
  {
    id: 'environmental_monitor',
    category: 'safety',
    label_en: 'Environmental Monitor / Spill Response',
    description: 'Monitors transport through environmentally sensitive areas (wetlands, wildlife corridors, water supplies). Manages spill prevention and response plans.',
    countries: ['US','CA','AU','NZ','GB','DE','NL','SE','NO','FI','FR','BR','ZA'],
  },
  {
    id: 'transport_escort_bf4',
    category: 'safety',
    label_en: 'Transport Escort Officer (BF4+)',
    label_local: 'Transportbegleiter BF4',
    description: 'Certified transport escort officer meeting BF4 or higher qualification in DACH/EU countries. Higher authority than BF3, can coordinate with police.',
    countries: ['DE','AT','CH','PL','CZ','SK','HU','NL','BE'],
    certifications: ['BF4 Certification'],
  },
  {
    id: 'insurance_surveyor',
    category: 'safety',
    label_en: 'Insurance Surveyor / Risk Assessor',
    description: 'On-site insurance company representative verifying transport conditions, load value, and coverage adequacy for high-value or irreplaceable cargo.',
    countries: ['US','CA','AU','GB','DE','NL','FR','AE','SA','JP','KR','BR','IN'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: EQUIPMENT OPERATIONS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'steerman',
    category: 'equipment_ops',
    label_en: 'Steerman / Rear Steer Operator',
    label_local: 'Nachlauflenker (DE)',
    description: 'Operates the rear steering axle on multi-axle, long-combination trailers (Scheuerle, Goldhofer, etc.) for navigating turns and tight spaces.',
    countries: ['US','CA','AU','DE','NL','BE','GB','AT','CH','FR','IT','NZ','ZA','BR','AE','SA','JP','KR','IN'],
  },
  {
    id: 'crane_operator',
    category: 'equipment_ops',
    label_en: 'Crane Operator (Load Assembly/Disassembly)',
    description: 'Operates cranes for assembly/disassembly of superloads and project cargo at origin and destination. Includes mobile, crawler, and tower crane operations.',
    countries: ['US','CA','AU','GB','DE','FR','NL','BE','IT','ES','SA','AE','QA','JP','KR','BR','MX','IN','ZA','NZ','CL','AR','CO','ID','TH','SG','MY'],
    certifications: ['NCCCO (US)', 'CPCS (UK)', 'National crane license'],
  },
  {
    id: 'rigging_crew',
    category: 'equipment_ops',
    label_en: 'Rigging / Lashing Crew',
    description: 'Specialized crew for rigging, lashing, and securing cargo onto trailers using chains, wire rope, turnbuckles, and custom cradles.',
    countries: ['US','CA','AU','GB','DE','NL','FR','IT','SA','AE','JP','KR','BR','IN','ZA','NZ','MX'],
  },
  {
    id: 'jack_slide',
    category: 'equipment_ops',
    label_en: 'Jack & Slide Operator',
    description: 'Operates hydraulic jacking and sliding systems for precision placement of heavy equipment (reactors, transformers, turbines) at final position.',
    countries: ['US','CA','AU','GB','DE','NL','FR','AE','SA','JP','KR','BR','IN'],
  },
  {
    id: 'spmt_operator',
    category: 'equipment_ops',
    label_en: 'SPMT Operator (Self-Propelled Modular Transporter)',
    description: 'Operates remotely controlled SPMT units (Goldhofer, Scheuerle, Kamag) for ultra-heavy and oversize loads at refineries, power plants, and industrial sites.',
    countries: ['US','CA','AU','GB','DE','NL','FR','AE','SA','QA','JP','KR','BR','IN','ZA','IT','ES','MX','SG','ID','TH'],
  },
  {
    id: 'water_escort',
    category: 'equipment_ops',
    label_en: 'Water Escort / Barge Pilot',
    description: 'Provides escort or piloting services for loads requiring waterway crossings, barge transport, or pontoon ferry coordination.',
    countries: ['US','CA','AU','NL','DE','BR','AR','IN','ID','VN','TH','NZ','GB','FR','BE'],
  },
  {
    id: 'blade_runner',
    category: 'equipment_ops',
    label_en: 'Wind Turbine Blade Transport Specialist',
    description: 'Specialized operator for wind turbine blade transport using blade lifters, steerable dollies, and adaptive trailers capable of tilting blades through tight corridors.',
    countries: ['US','CA','AU','DE','NL','DK','SE','NO','FR','ES','PT','GB','IE','BR','MX','IN','ZA','CL','AR','TR','GR','IT'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: COMMUNICATIONS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'comms_coordinator',
    category: 'communications',
    label_en: 'Communications Coordinator / Radio Operator',
    description: 'Manages multi-channel radio communications across the convoy. Coordinates between escorts, driver, police, and dispatch center.',
    countries: ['US','CA','AU','GB','DE','NL','FR','ZA','BR','AE','SA','IN','NZ','JP'],
  },
  {
    id: 'convoy_commander',
    category: 'communications',
    label_en: 'Convoy Commander / Transport Master',
    description: 'Overall command authority for multi-vehicle convoy operations. Manages timing, routing decisions, rest stops, and emergency protocols.',
    countries: ['US','CA','AU','GB','DE','NL','FR','AE','SA','BR','ZA','IN','JP','KR','IT','MX'],
  },
  {
    id: 'night_lighting',
    category: 'communications',
    label_en: 'Night Move Lighting Operator',
    description: 'Operates specialized lighting rigs (LED light towers, balloon lights, vehicle-mounted floods) for authorized night-time oversize moves.',
    countries: ['US','CA','AU','GB','DE','NL','NZ','ZA','AE','SA','FR','BR'],
  },
  {
    id: 'satellite_comms',
    category: 'communications',
    label_en: 'Satellite Communications Specialist',
    description: 'Provides satellite-based communication for oversize transport through remote areas with no cellular coverage (outback, desert, arctic).',
    countries: ['AU','CA','US','BR','ZA','SA','AE','IN','AR','CL','PE'],
  },

  // ══════════════════════════════════════════════════════════════
  // CATEGORY: FUTURE / EMERGING POSITIONS
  // ══════════════════════════════════════════════════════════════

  {
    id: 'av_safety_escort',
    category: 'future',
    label_en: 'Autonomous Vehicle Safety Escort',
    description: 'Provides human safety escort for autonomous truck convoys and AV testing operations on public roads. Monitors AV behavior and intervenes in emergencies.',
    countries: ['US','CA','AU','GB','DE','NL','SE','NO','JP','KR','SG','FR','FI'],
    isFuture: true,
    certifications: ['AV Safety Operator cert (emerging)'],
  },
  {
    id: 'drone_live_escort',
    category: 'future',
    label_en: 'Real-Time Drone Escort Operator',
    description: 'Operates live overhead drone during transport providing real-time aerial clearance checking, traffic monitoring, and incident response.',
    countries: ['US','CA','AU','GB','DE','NL','FR','NZ','JP','KR','AE'],
    isFuture: true,
  },
  {
    id: 'ev_charging_coord',
    category: 'future',
    label_en: 'Electric Vehicle Charging Coordinator',
    description: 'Plans and coordinates charging stops for electric escort vehicle fleets. Manages charging infrastructure logistics for long-distance moves.',
    countries: ['US','CA','AU','GB','DE','NL','SE','NO','DK','FR','NZ'],
    isFuture: true,
  },
  {
    id: 'ai_route_optimizer',
    category: 'future',
    label_en: 'AI Route Intelligence Analyst',
    description: 'Uses AI/ML-powered routing platforms to analyze real-time clearance data, traffic patterns, and construction zones for dynamic route optimization.',
    countries: ['US','CA','AU','GB','DE','NL','FR','JP','KR','AE'],
    isFuture: true,
  },
  {
    id: 'digital_twin_engineer',
    category: 'future',
    label_en: 'Digital Twin / 3D Route Modeler',
    description: 'Creates digital twin models of transport routes using LiDAR, photogrammetry, and GIS data for virtual clearance simulation before physical moves.',
    countries: ['US','CA','AU','GB','DE','NL','JP','KR','FR','AE'],
    isFuture: true,
  },
  {
    id: 'hydrogen_logistics',
    category: 'future',
    label_en: 'Hydrogen Transport Safety Escort',
    description: 'Specialized escort for hydrogen fuel cell equipment and green energy infrastructure transport, with hazmat awareness and leak detection capabilities.',
    countries: ['US','CA','AU','GB','DE','NL','JP','KR','FR','SE','NO'],
    isFuture: true,
  },
  {
    id: 'uas_traffic_mgmt',
    category: 'future',
    label_en: 'UAS Traffic Management (UTM) Coordinator',
    description: 'Coordinates unmanned aerial system (drone) airspace with FAA/CASA/CAA for oversize transport corridors that interfere with low-altitude drone operations.',
    countries: ['US','CA','AU','GB','DE','NL','FR','JP','KR','SG','AE'],
    isFuture: true,
  },
];

// ─── Helper Functions ──────────────────────────────────────────

/** Get all positions available in a specific country */
export function getPositionsForCountry(country: CountryCode): GlobalPosition[] {
  return GLOBAL_POSITIONS.filter(p => p.countries.includes(country));
}

/** Get all positions in a category */
export function getPositionsByCategory(category: PositionCategory): GlobalPosition[] {
  return GLOBAL_POSITIONS.filter(p => p.category === category);
}

/** Get future/emerging positions only */
export function getFuturePositions(): GlobalPosition[] {
  return GLOBAL_POSITIONS.filter(p => p.isFuture);
}

/** Get positions unique to a country (not available in US) */
export function getUniquePositions(country: CountryCode): GlobalPosition[] {
  return GLOBAL_POSITIONS.filter(p => p.countries.includes(country) && !p.countries.includes('US'));
}

/** Get country coverage stats */
export function getCountryCoverage(): { country: CountryCode; tier: Tier; positionCount: number }[] {
  return ALL_COUNTRIES.map(c => ({
    country: c,
    tier: COUNTRY_TIERS[c],
    positionCount: getPositionsForCountry(c).length,
  })).sort((a, b) => b.positionCount - a.positionCount);
}

/** Total unique position count */
export function getTotalPositionCount(): number {
  return GLOBAL_POSITIONS.length;
}
