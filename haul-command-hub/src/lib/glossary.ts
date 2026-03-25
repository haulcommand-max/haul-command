/**
 * Haul Command — Industry Glossary & Dictionary
 * 
 * The definitive reference for heavy haul, oversize load, and escort
 * industry terminology. Covers all 57 countries with local-language
 * equivalents. Branded as "The HC Dictionary™".
 * 
 * SEO targets: PEVO, pilot car, escort vehicle, oversize load, wide load,
 * abnormal load, heavy haul, convoi exceptionnel, schwertransport, etc.
 */

export interface GlossaryEntry {
  id: string;
  term: string;
  /** Aliases / alternate spellings / abbreviations */
  aliases: string[];
  /** HC-branded term (our preferred usage) */
  hcBrandTerm?: string;
  definition: string;
  /** Category for filtering */
  category: GlossaryCategory;
  /** Countries where this term is primarily used */
  countries: string[];
  /** Local language equivalents */
  localTerms?: { country: string; term: string; language: string }[];
  /** SEO keywords to target */
  seoKeywords?: string[];
  /** Related terms (by id) */
  relatedTerms?: string[];
  /** Citation / regulatory reference */
  regulatoryRef?: string;
}

export type GlossaryCategory =
  | 'positions'
  | 'vehicles'
  | 'loads'
  | 'permits_regulations'
  | 'equipment'
  | 'operations'
  | 'safety'
  | 'business'
  | 'technology'
  | 'geography'
  | 'physics_geometry'
  | 'business_finance'
  | 'safety_compliance'
  | 'autonomous_future_tech'
  | 'trailers'
  | 'hardware_rigging'
  | 'tactical_logistics'
  | 'informal_lingo'
  | 'infrastructure';

// ─── THE HC DICTIONARY™ ──────────────────────────────────────

import { HC_GLOSSARY_EXPANSION } from './glossary-expansion';

import { MILITARY_ESC_TERMS } from './glossary-military-esc';

export const HC_GLOSSARY: GlossaryEntry[] = [
  ...MILITARY_ESC_TERMS,

  ...HC_GLOSSARY_EXPANSION,


  // ══════════════ POSITIONS ══════════════════════════════════════

  {
    id: 'pevo',
    term: 'PEVO (Pilot/Escort Vehicle Operator)',
    aliases: ['Pilot Car Driver', 'Escort Vehicle Operator', 'Pilot Vehicle Operator', 'PVO', 'Escort Driver'],
    hcBrandTerm: 'HC Certified Escort Operator',
    definition: 'A certified professional who operates a pilot or escort vehicle to guide oversize, overweight, or overdimensional loads safely along designated routes. The PEVO warns oncoming traffic, monitors overhead and lateral clearances, communicates with the load driver via CB/radio, and coordinates with law enforcement when required. Most US states require PEVO certification; Washington State\'s ESC (Evergreen Safety Council) card is accepted in multiple states.',
    category: 'positions',
    countries: ['US', 'CA'],
    localTerms: [
      { country: 'AU', term: 'Pilot Vehicle Driver (PVD)', language: 'English' },
      { country: 'GB', term: 'Abnormal Load Escort', language: 'English' },
      { country: 'NZ', term: 'Pilot Vehicle Operator', language: 'English' },
      { country: 'DE', term: 'Schwertransportbegleiter', language: 'German' },
      { country: 'FR', term: 'Guideur / Accompagnateur', language: 'French' },
      { country: 'NL', term: 'Transportbegeleider', language: 'Dutch' },
      { country: 'IT', term: 'Addetto Scorta Tecnica', language: 'Italian' },
      { country: 'ES', term: 'Acompañante de Transporte Especial', language: 'Spanish' },
      { country: 'BR', term: 'Batedor / Escolteiro', language: 'Portuguese' },
      { country: 'JP', term: '誘導員 (Yūdō-in)', language: 'Japanese' },
      { country: 'KR', term: '유도차량 운전자', language: 'Korean' },
      { country: 'SE', term: 'Följebilstransportör', language: 'Swedish' },
      { country: 'NO', term: 'Følgebilsjåfør', language: 'Norwegian' },
      { country: 'PL', term: 'Pilotaż Transportu', language: 'Polish' },
      { country: 'TR', term: 'Refakat / Eskort Araç Şoförü', language: 'Turkish' },
      { country: 'IN', term: 'Escort Vehicle Driver', language: 'Hindi/English' },
      { country: 'ZA', term: 'Abnormal Load Escort Operator', language: 'English' },
    ],
    seoKeywords: ['PEVO', 'pilot car driver', 'escort vehicle operator', 'pilot car certification', 'PEVO certification', 'pilot car training', 'escort driver', 'pilot vehicle operator'],
    relatedTerms: ['pilot_car', 'lead_car', 'chase_car', 'witpac'],
    regulatoryRef: 'Varies by state/province; WA State RCW 46.44.090',
  },
  {
    id: 'lead_car_driver',
    term: 'Lead Car Driver',
    aliases: ['Front Escort', 'Lead Pilot', 'Point Car', 'Lead Vehicle'],
    hcBrandTerm: 'HC Lead Escort',
    definition: 'The PEVO/escort operator driving the pilot vehicle positioned AHEAD of the oversize load. Responsible for scouting the route, identifying low bridges, tight turns, construction zones, and oncoming traffic hazards. Communicates real-time clearance info to the load driver.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA'],
    seoKeywords: ['lead car driver', 'front escort', 'lead pilot car'],
    relatedTerms: ['pevo', 'chase_car_driver'],
  },
  {
    id: 'chase_car_driver',
    term: 'Chase Car Driver',
    aliases: ['Rear Escort', 'Trail Car', 'Chase Pilot', 'Rear Guard', 'Follow Car'],
    hcBrandTerm: 'HC Rear Escort',
    definition: 'The PEVO/escort operator driving the pilot vehicle positioned BEHIND the oversize load. Protects the rear of the convoy, prevents unsafe passing by impatient drivers, and warns rear-approaching traffic of the slow-moving load.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA'],
    seoKeywords: ['chase car driver', 'rear escort', 'trail car'],
    relatedTerms: ['pevo', 'lead_car_driver'],
  },
  {
    id: 'height_pole_operator',
    term: 'Height Pole Operator',
    aliases: ['High Pole', 'HP Operator', 'Pole Car', 'Hi-Pole', 'Measuring Vehicle'],
    hcBrandTerm: 'HC Height Pole Specialist',
    definition: 'Operates a vehicle equipped with an adjustable height pole (typically telescoping aluminum) set to the exact height of the load being transported. Travels ahead of the oversize load testing overhead clearances at bridges, overpasses, utility lines, and traffic signals to prevent bridge strikes.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'DE', 'NL', 'FR', 'ZA'],
    seoKeywords: ['height pole operator', 'high pole car', 'bridge clearance check', 'hi-pole'],
    relatedTerms: ['pevo', 'bridge_strike', 'overheight'],
  },
  {
    id: 'steerman',
    term: 'Steerman / Rear Steer Operator',
    aliases: ['Steer Operator', 'Jeep Driver', 'Push Pull Operator', 'Rear Axle Operator', 'Nachlauflenker'],
    hcBrandTerm: 'HC Steer Specialist',
    definition: 'Operates the rear steering axle assembly (jeep/dolly) on extended or multi-axle trailers. Uses wireless controls or a cab mounted on the trailer to navigate tight turns, switchbacks, and narrow corridors where conventional trailer steering cannot track properly.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'DE', 'NL', 'GB', 'FR', 'AE', 'SA', 'JP', 'KR', 'IN', 'BR'],
    localTerms: [
      { country: 'DE', term: 'Nachlauflenker', language: 'German' },
      { country: 'NL', term: 'Achterste stuurman', language: 'Dutch' },
    ],
    seoKeywords: ['steerman', 'rear steer operator', 'trailer steer'],
    relatedTerms: ['spmt', 'superload'],
  },
  {
    id: 'bucket_truck_op',
    term: 'Bucket Truck Operator',
    aliases: ['Boom Truck', 'Line Lifter', 'Utility Wire Lifter', 'Aerial Lift Operator'],
    hcBrandTerm: 'HC Wire Clearance Operator',
    definition: 'Operates a truck with an articulating hydraulic boom and personnel basket (bucket) to physically raise or hold overhead utility wires, telephone cables, and fiber optic lines while an overheight load passes underneath. Essential for moves through urban corridors.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'NZ'],
    seoKeywords: ['bucket truck oversize load', 'wire lifter', 'utility line clearance'],
    relatedTerms: ['overheight', 'utility_coordinator'],
  },
  {
    id: 'flagger',
    term: 'Flagger / Traffic Controller',
    aliases: ['Flagman', 'Flag Person', 'Traffic Control Person (TCP)', 'Traffic Controller'],
    hcBrandTerm: 'HC Traffic Controller',
    definition: 'Certified individual who manually controls traffic at intersections, construction zones, or narrow passages during oversize load transport. Uses signs (STOP/SLOW paddles), flags, and hand signals to direct traffic safely.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'IE', 'ZA', 'DE', 'NL'],
    seoKeywords: ['flagger certification', 'traffic controller oversize load', 'flagman'],
    relatedTerms: ['pevo', 'tma'],
    regulatoryRef: 'MUTCD Part 6 (US); ATSSA certification',
  },
  {
    id: 'route_surveyor',
    term: 'Route Surveyor',
    aliases: ['Route Scout', 'Pre-Trip Survey', 'Route Planner', 'Route Survey Engineer'],
    hcBrandTerm: 'HC Route Intelligence Surveyor',
    definition: 'Pre-travels the planned route to measure, photograph, and document all clearance restrictions including bridge heights, lane widths, turn radii, shoulder conditions, construction zones, and utility conflicts. Produces a detailed route survey report used by the transport team.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'NL', 'ZA', 'NZ', 'JP', 'IN', 'BR'],
    seoKeywords: ['oversize load route survey', 'route surveyor', 'route planning oversize'],
    relatedTerms: ['tmp', 'bridge_assessment'],
  },
  {
    id: 'permit_runner',
    term: 'Permit Runner / Expediter',
    aliases: ['Permit Service', 'Permit Agent', 'Permit Coordinator', 'OD Permit Specialist'],
    hcBrandTerm: 'HC Permit Intelligence Agent',
    definition: 'Procures oversize/overweight permits from state DOTs, provincial ministries, or national transport authorities. Manages all dimensional data, route specifications, insurance certificates, and bond requirements. Multi-state/multi-jurisdiction runners can coordinate dozens of permits for a single cross-country move.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'BR', 'MX', 'ZA', 'NZ', 'JP', 'IN'],
    seoKeywords: ['oversized load permit', 'permit runner', 'permit expediter', 'overweight permit'],
    relatedTerms: ['single_trip_permit', 'annual_permit', 'superload_permit'],
  },
  {
    id: 'witpac',
    term: 'WITPAC (Wind Industry Transport Professional Advanced Certification)',
    aliases: ['WITPAC Certification', 'Wind Transport Cert'],
    hcBrandTerm: 'HC WITPAC Specialist',
    definition: 'An advanced certification for pilot/escort vehicle operators and transport drivers who specialize in hauling wind energy components (blades, towers, nacelles). Administered by the Evergreen Safety Council (ESC). Requires completing an 8-hour pre-course, attending training, and passing the exam. Valid for 3 years. Price: $325+.',
    category: 'positions',
    countries: ['US', 'CA'],
    seoKeywords: ['WITPAC certification', 'wind turbine transport certification', 'wind energy escort'],
    relatedTerms: ['pevo', 'blade_runner'],
    regulatoryRef: 'ESC / Evergreen Safety Council',
  },
  {
    id: 'convoy_commander',
    term: 'Convoy Commander / Transport Master',
    aliases: ['Convoy Leader', 'Transport Manager', 'Move Coordinator', 'Move Boss'],
    hcBrandTerm: 'HC Convoy Commander',
    definition: 'The overall authority for a multi-vehicle oversize transport operation. Coordinates all escorts, police, utility crews, and support vehicles. Makes real-time routing decisions, manages rest stops, authorizes movement windows, and handles emergency protocols.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'AE', 'SA', 'JP', 'BR', 'ZA', 'IN'],
    seoKeywords: ['convoy commander', 'transport master', 'heavy haul coordinator'],
    relatedTerms: ['pevo', 'comms_coordinator'],
  },
  {
    id: 'bf3_operator',
    term: 'BF3 Escort Operator',
    aliases: ['Begleitfahrzeug BF3', 'Schwertransportbegleiter', 'BF3 Certified'],
    hcBrandTerm: 'HC BF3 Operator (DACH)',
    definition: 'A certified escort vehicle operator meeting BF3 qualification standards under German StVO §35 regulations. Operates an officially marked escort vehicle (Begleitfahrzeug) for Großraum- und Schwertransporte (oversize and heavy transport). The BF3 standard is recognized in Germany, Austria, and Switzerland (DACH region).',
    category: 'positions',
    countries: ['DE', 'AT', 'CH'],
    localTerms: [
      { country: 'DE', term: 'BF3-zertifizierter Transportbegleiter', language: 'German' },
    ],
    seoKeywords: ['BF3 certification', 'Begleitfahrzeug', 'Schwertransport escort Germany'],
    relatedTerms: ['bf4_operator', 'schwertransport'],
    regulatoryRef: 'StVO §35, StVZO (Germany)',
  },
  {
    id: 'bf4_operator',
    term: 'BF4 Transport Escort Officer',
    aliases: ['Transportbegleiter BF4', 'BF4 Certified'],
    hcBrandTerm: 'HC BF4 Authority Escort (DACH)',
    definition: 'Higher-grade certified transport escort officer in DACH/EU countries. BF4 operators have authority to coordinate directly with police, manage intersection crossings, and direct traffic. Required for the largest category oversize transports.',
    category: 'positions',
    countries: ['DE', 'AT', 'CH', 'NL', 'BE', 'PL', 'CZ', 'SK', 'HU'],
    seoKeywords: ['BF4 certification', 'BF4 transport escort', 'heavy transport escort EU'],
    relatedTerms: ['bf3_operator', 'schwertransport'],
    regulatoryRef: 'StVO §35 / BMVBS (Germany)',
  },
  {
    id: 'spmt_operator',
    term: 'SPMT Operator',
    aliases: ['Self-Propelled Modular Transporter Operator', 'Goldhofer Operator', 'Scheuerle Operator', 'Kamag Operator'],
    hcBrandTerm: 'HC SPMT Specialist',
    definition: 'Operates self-propelled modular transporter units (SPMTs) — remote-controlled multi-axle platforms used for transporting ultra-heavy loads (refineries, reactors, bridges, entire buildings). SPMTs can be combined for loads exceeding 50,000 tons. Major manufacturers: Goldhofer, Scheuerle, Kamag.',
    category: 'positions',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'AE', 'SA', 'QA', 'JP', 'KR', 'BR', 'IN', 'ZA', 'IT', 'ES', 'MX', 'SG', 'ID', 'TH'],
    seoKeywords: ['SPMT operator', 'self propelled modular transporter', 'heavy lift transport'],
    relatedTerms: ['superload', 'steerman'],
  },

  // ══════════════ VEHICLES ══════════════════════════════════════

  {
    id: 'pilot_car',
    term: 'Pilot Car',
    aliases: ['Escort Vehicle', 'Pilot Vehicle', 'PV', 'PC', 'Flag Car', 'Warning Vehicle', 'Scout Car'],
    hcBrandTerm: 'HC Escort Vehicle',
    definition: 'A vehicle equipped with warning signs ("OVERSIZE LOAD", "WIDE LOAD"), amber flashing/rotating lights, CB radio, flags, and height pole that escorts oversize loads on public highways. Pilot cars travel ahead (lead) and/or behind (chase) the oversize load to warn traffic and ensure safe passage.',
    category: 'vehicles',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA'],
    localTerms: [
      { country: 'AU', term: 'Pilot Vehicle', language: 'English' },
      { country: 'GB', term: 'Abnormal Load Escort Vehicle', language: 'English' },
      { country: 'DE', term: 'Begleitfahrzeug (BF)', language: 'German' },
      { country: 'FR', term: 'Véhicule Pilote', language: 'French' },
      { country: 'NL', term: 'Begeleidingsvoertuig', language: 'Dutch' },
      { country: 'IT', term: 'Veicolo di Scorta', language: 'Italian' },
      { country: 'ES', term: 'Vehículo de Acompañamiento', language: 'Spanish' },
      { country: 'BR', term: 'Veículo Batedor', language: 'Portuguese' },
      { country: 'JP', term: '誘導車 (Yūdō-sha)', language: 'Japanese' },
      { country: 'KR', term: '선도차량 (Seondo Charyang)', language: 'Korean' },
      { country: 'SE', term: 'Följebil', language: 'Swedish' },
      { country: 'NO', term: 'Følgebil', language: 'Norwegian' },
      { country: 'DK', term: 'Følgebil', language: 'Danish' },
      { country: 'FI', term: 'Saattoauto', language: 'Finnish' },
      { country: 'PL', term: 'Pojazd Pilotujący', language: 'Polish' },
      { country: 'CZ', term: 'Doprovodné vozidlo', language: 'Czech' },
      { country: 'TR', term: 'Eskort Araç', language: 'Turkish' },
      { country: 'IN', term: 'Escort Vehicle / Pilot Vehicle', language: 'English/Hindi' },
      { country: 'TH', term: 'รถนำขบวน', language: 'Thai' },
      { country: 'VN', term: 'Xe hộ tống', language: 'Vietnamese' },
      { country: 'ID', term: 'Kendaraan Pengawal', language: 'Indonesian' },
      { country: 'AR', term: 'Vehículo Guía', language: 'Spanish' },
      { country: 'MX', term: 'Vehículo Escolta', language: 'Spanish' },
    ],
    seoKeywords: ['pilot car', 'escort vehicle', 'pilot vehicle', 'PEVO vehicle', 'oversize load escort car'],
    relatedTerms: ['pevo', 'lead_car_driver', 'chase_car_driver'],
  },
  {
    id: 'tma',
    term: 'TMA (Truck-Mounted Attenuator)',
    aliases: ['Crash Cushion Truck', 'Impact Attenuator', 'Shadow Vehicle', 'Crash Truck'],
    hcBrandTerm: 'HC Impact Shield',
    definition: 'A truck equipped with a rear-mounted energy-absorbing crash cushion designed to protect the escort convoy and work crew from rear-end collisions. The TMA absorbs impact energy if a vehicle crashes into the rear of the convoy. Often combined with arrow boards and variable message signs.',
    category: 'vehicles',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'NZ', 'ZA', 'FR', 'IT'],
    seoKeywords: ['TMA truck', 'truck mounted attenuator', 'crash cushion truck', 'shadow vehicle'],
    relatedTerms: ['sign_truck', 'arrow_board'],
  },
  {
    id: 'sign_truck',
    term: 'Sign Truck / Message Board Vehicle',
    aliases: ['VMS Truck', 'CMS Truck', 'Arrow Board Truck', 'Warning Sign Vehicle'],
    hcBrandTerm: 'HC Warning Display Vehicle',
    definition: 'A truck carrying a vehicle-mounted changeable message sign (VMS/CMS) or arrow board that provides advance warning to approaching traffic about the oversize load ahead. Displays messages like "OVERSIZE LOAD AHEAD", "WIDE LOAD", or directional arrows.',
    category: 'vehicles',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'FR'],
    seoKeywords: ['sign truck oversize load', 'message board vehicle', 'CMS truck'],
    relatedTerms: ['tma', 'arrow_board'],
  },

  // ══════════════ LOADS / CARGO ══════════════════════════════════

  {
    id: 'oversize_load',
    term: 'Oversize Load',
    aliases: ['Oversized Load', 'Over-Dimensional Load', 'OD Load', 'Overdimension', 'Out-of-Gauge'],
    hcBrandTerm: 'HC Oversize Freight',
    definition: 'Any load that exceeds the standard legal dimensions for width (typically 8\'6" / 2.6m), height (typically 13\'6" / 4.15m), or length (typically 48-53 ft / 16.5m) for a given jurisdiction. Oversize loads require special permits, escort vehicles, and route planning.',
    category: 'loads',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'FR', 'BR', 'JP'],
    localTerms: [
      { country: 'GB', term: 'Abnormal Indivisible Load (AIL)', language: 'English' },
      { country: 'AU', term: 'Over-Dimensional (OD) / Oversize', language: 'English' },
      { country: 'DE', term: 'Großraum- und Schwertransport (GST)', language: 'German' },
      { country: 'FR', term: 'Convoi Exceptionnel / Transport Exceptionnel', language: 'French' },
      { country: 'NL', term: 'Exceptioneel Transport', language: 'Dutch' },
      { country: 'IT', term: 'Trasporto Eccezionale', language: 'Italian' },
      { country: 'ES', term: 'Transporte Especial / Sobredimensionado', language: 'Spanish' },
      { country: 'BR', term: 'Carga Indivisível / Carga Especial', language: 'Portuguese' },
      { country: 'JP', term: '特殊車両 (Tokushu Sharyō)', language: 'Japanese' },
      { country: 'PL', term: 'Transport Nadzwyczajny', language: 'Polish' },
      { country: 'SE', term: 'Specialtransport', language: 'Swedish' },
      { country: 'NO', term: 'Spesialtransport', language: 'Norwegian' },
      { country: 'TR', term: 'Gabari Dışı Yük', language: 'Turkish' },
      { country: 'IN', term: 'Over Dimensional Cargo (ODC)', language: 'English/Hindi' },
      { country: 'KR', term: '특수차량 (Teuksu Charyang)', language: 'Korean' },
    ],
    seoKeywords: ['oversize load', 'oversized load', 'wide load', 'over-dimensional', 'abnormal load'],
    relatedTerms: ['overweight_load', 'superload', 'wide_load'],
  },
  {
    id: 'overweight_load',
    term: 'Overweight Load',
    aliases: ['Heavy Load', 'Over-Gross', 'Excess Weight'],
    hcBrandTerm: 'HC Overweight Freight',
    definition: 'A load that exceeds the standard legal gross vehicle weight (typically 80,000 lbs / 36,287 kg in the US) or individual axle weight limits for a given jurisdiction. May also be oversize simultaneously. Requires overweight permits and may need bridge analysis.',
    category: 'loads',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'DE', 'FR', 'NL', 'BR', 'ZA', 'JP'],
    seoKeywords: ['overweight load', 'heavy load permit', 'over gross weight'],
    relatedTerms: ['oversize_load', 'superload', 'axle_weight'],
  },
  {
    id: 'superload',
    term: 'Superload',
    aliases: ['Super Load', 'Ultra-Heavy', 'Heavy Haul Superload', 'Category III+'],
    hcBrandTerm: 'HC Superload',
    definition: 'An oversize/overweight load that exceeds the maximum limits for standard oversize permits, typically requiring special engineering analysis, bridge assessments, route-specific approvals, and multi-agency coordination. Thresholds vary: typically >200,000 lbs / >16\' wide / >16\' tall in the US. Often requires police escort, multiple pilot cars, and utility coordination.',
    category: 'loads',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'JP', 'AE', 'SA', 'BR', 'ZA'],
    seoKeywords: ['superload', 'super load transport', 'ultra heavy haul', 'superload permit'],
    relatedTerms: ['oversize_load', 'overweight_load', 'bridge_assessment'],
  },
  {
    id: 'wide_load',
    term: 'Wide Load',
    aliases: ['Overwide', 'Over-Width', 'Excess Width'],
    hcBrandTerm: 'HC Wide Load',
    definition: 'A load exceeding the standard legal width limit (8\'6" / 2.6m in US; varies by country). Wide loads typically require escort vehicles, "WIDE LOAD" / "OVERSIZE LOAD" banners, and may be restricted from certain times of day or certain road types.',
    category: 'loads',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'FR', 'BR'],
    seoKeywords: ['wide load', 'overwide load', 'wide load regulations'],
    relatedTerms: ['oversize_load', 'pilot_car'],
  },
  {
    id: 'indivisible_load',
    term: 'Indivisible Load',
    aliases: ['Non-Divisible Load', 'Indivisible Cargo', 'AIL'],
    hcBrandTerm: 'HC Indivisible Cargo',
    definition: 'A load that cannot be legally or practically divided into smaller loads for transport without destroying its utility or compromising its integrity. Examples: wind turbine blades, transformers, construction beams, pre-fabricated buildings. Most jurisdictions only issue oversize permits for genuinely indivisible loads.',
    category: 'loads',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'DE', 'FR', 'NL', 'ZA', 'BR', 'JP'],
    localTerms: [
      { country: 'GB', term: 'Abnormal Indivisible Load (AIL)', language: 'English' },
      { country: 'FR', term: 'Charge Indivisible', language: 'French' },
      { country: 'DE', term: 'Unteilbare Ladung', language: 'German' },
    ],
    seoKeywords: ['indivisible load', 'non-divisible cargo', 'AIL UK'],
    relatedTerms: ['oversize_load', 'project_cargo'],
  },

  // ══════════════ PERMITS & REGULATIONS ══════════════════════════

  {
    id: 'single_trip_permit',
    term: 'Single Trip Permit',
    aliases: ['One-Time Permit', 'Trip Permit', 'Temporary Oversize Permit'],
    hcBrandTerm: 'HC Single Trip Authorization',
    definition: 'A permit authorizing one oversize/overweight load movement along a specific route on specific dates. Must include exact dimensions, route, and dates of travel. Typical cost: $15–$100+ depending on state/province.',
    category: 'permits_regulations',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'BR', 'ZA', 'NZ', 'JP'],
    seoKeywords: ['single trip permit', 'oversize load permit', 'one time permit'],
    relatedTerms: ['annual_permit', 'superload_permit', 'permit_runner'],
  },
  {
    id: 'annual_permit',
    term: 'Annual / Blanket Permit',
    aliases: ['Blanket Permit', 'Annual Oversize Permit', 'Continuous Permit', 'Annual OD Permit'],
    hcBrandTerm: 'HC Annual Authorization',
    definition: 'A permit covering multiple oversize/overweight trips within a defined dimensional envelope over a 12-month period. Typically limited to loads below the superload threshold. Cost: $50–$1,500+ per state/province per year.',
    category: 'permits_regulations',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'ZA', 'BR'],
    seoKeywords: ['annual oversize permit', 'blanket permit', 'continuous permit'],
    relatedTerms: ['single_trip_permit', 'superload_permit'],
  },
  {
    id: 'superload_permit',
    term: 'Superload Permit',
    aliases: ['Super Permit', 'Category III Permit', 'Extra-Heavy Permit', 'Special Permit'],
    hcBrandTerm: 'HC Superload Authorization',
    definition: 'A permit for loads exceeding standard oversize permit thresholds. Requires detailed engineering analysis, bridge assessments, route-specific approvals, and often multi-agency sign-off. Processing: 2–8+ weeks. Cost: $200–$5,000+ per state.',
    category: 'permits_regulations',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'JP', 'AE', 'SA', 'BR', 'ZA'],
    seoKeywords: ['superload permit', 'super permit', 'heavy haul permit'],
    relatedTerms: ['superload', 'bridge_assessment'],
  },

  // ══════════════ EQUIPMENT ══════════════════════════════════════

  {
    id: 'oversize_banner',
    term: 'Oversize Load Banner / Sign',
    aliases: ['Wide Load Banner', 'OVERSIZE LOAD Sign', 'WIDE LOAD Sign', 'Warning Banner'],
    hcBrandTerm: 'HC Load Warning Banner',
    definition: 'A bright yellow or fluorescent banner (typically 7\' x 18" in the US) mounted on the front, rear, or sides of an oversize load and escort vehicles reading "OVERSIZE LOAD", "WIDE LOAD", or equivalent. Required by most jurisdictions when transporting overdimensional cargo.',
    category: 'equipment',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA'],
    localTerms: [
      { country: 'AU', term: 'OVERSIZE banner', language: 'English' },
      { country: 'FR', term: 'Panneau CONVOI EXCEPTIONNEL', language: 'French' },
      { country: 'DE', term: 'Schwertransport Warntafel', language: 'German' },
      { country: 'IT', term: 'Segnale TRASPORTO ECCEZIONALE', language: 'Italian' },
    ],
    seoKeywords: ['oversize load sign', 'wide load banner', 'oversize load banner'],
    relatedTerms: ['pilot_car', 'amber_light'],
  },
  {
    id: 'amber_light',
    term: 'Amber Warning Light',
    aliases: ['Rotating Beacon', 'Strobe Light', 'Amber Beacon', 'Flashing Light', 'Rundumkennleuchte'],
    hcBrandTerm: 'HC Amber Beacon',
    definition: 'Amber (yellow/orange) rotating or flashing warning light mounted on the roof of escort and transport vehicles. Provides 360° visibility to alert surrounding traffic. LED and strobe types are increasingly common. Required on all pilot/escort vehicles in most jurisdictions.',
    category: 'equipment',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'FR', 'IT', 'JP'],
    seoKeywords: ['amber warning light', 'pilot car light', 'escort beacon'],
    relatedTerms: ['pilot_car', 'oversize_banner'],
  },
  {
    id: 'cb_radio',
    term: 'CB Radio / Two-Way Radio',
    aliases: ['Citizens Band', 'CB', 'Walkie-Talkie', 'Two-Way', 'UHF Radio'],
    hcBrandTerm: 'HC Comms System',
    definition: 'Radio communication system used between escort vehicles and the load driver. In the US/Canada, CB Channel 19 is standard for trucking. Australia uses UHF CB (Channel 40). Essential for real-time clearance communication, hazard alerts, and convoy coordination.',
    category: 'equipment',
    countries: ['US', 'CA', 'AU', 'NZ', 'GB', 'ZA', 'BR', 'MX'],
    seoKeywords: ['CB radio pilot car', 'two way radio escort', 'trucker CB channel'],
    relatedTerms: ['pilot_car', 'comms_coordinator'],
  },

  // ══════════════ OPERATIONS ═════════════════════════════════════

  {
    id: 'deadhead',
    term: 'Deadhead / Dead Miles',
    aliases: ['Empty Miles', 'Repositioning', 'Non-Revenue Miles', 'DH Miles'],
    hcBrandTerm: 'HC Repositioning Miles',
    definition: 'Miles driven WITHOUT an active load assignment — typically traveling to the pickup location or returning home after a delivery. Deadhead miles represent direct cost without revenue. Smart operators negotiate deadhead pay ($0.75–$1.25/mi) or backhaul loads to minimize losses.',
    category: 'operations',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'BR'],
    seoKeywords: ['deadhead miles', 'dead miles', 'empty miles pilot car', 'deadhead pay'],
    relatedTerms: ['backhaul', 'detention'],
  },
  {
    id: 'detention',
    term: 'Detention / Wait Time',
    aliases: ['Demurrage', 'Standby', 'Hold Time', 'Waiting Time'],
    hcBrandTerm: 'HC Standby Time',
    definition: 'Time spent waiting at a job site beyond the allotted free time (typically 1–2 hours). Operators charge detention rates ($55–$85/hr) for extended waits caused by shipper delays, weather holds, permit issues, or mechanical breakdowns.',
    category: 'operations',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'FR', 'NL', 'BR'],
    seoKeywords: ['detention time', 'wait time trucking', 'demurrage oversize load'],
    relatedTerms: ['deadhead', 'layover'],
  },
  {
    id: 'layover',
    term: 'Layover',
    aliases: ['Overnight Stop', 'Rest Stop', 'Staging', 'Holding'],
    hcBrandTerm: 'HC Layover',
    definition: 'An overnight or multi-night stop during a multi-day oversize load transport. Requires secured staging with adequate space for the oversize load. Operators charge layover day rates ($150–$250/day) plus hotel/meals.',
    category: 'operations',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'ZA', 'BR'],
    seoKeywords: ['layover rate', 'overnight oversize load', 'staging area'],
    relatedTerms: ['detention', 'deadhead'],
  },
  {
    id: 'pre_trip_meeting',
    term: 'Pre-Trip Meeting / Pre-Move Conference',
    aliases: ['Tailgate Meeting', 'Pre-Move Briefing', 'Safety Briefing'],
    hcBrandTerm: 'HC Pre-Move Intel Brief',
    definition: 'A mandatory safety and logistics meeting held before every oversize load move. All escorts, the load driver, and any support personnel review the route, clearance restrictions, radio channels, emergency procedures, and move timing. Required by ESC/PEVO training standards.',
    category: 'operations',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL'],
    seoKeywords: ['pre-trip meeting oversize load', 'safety briefing escort', 'pre-move conference'],
    relatedTerms: ['pevo', 'route_surveyor'],
    regulatoryRef: 'ESC PEVO Training Standard',
  },
  {
    id: 'bridge_strike',
    term: 'Bridge Strike / Bridge Hit',
    aliases: ['Overhead Strike', 'Low Bridge Hit', 'Height Strike'],
    hcBrandTerm: 'HC Bridge Impact Incident',
    definition: 'A collision between an overheight load and an overhead structure (bridge, overpass, utility line, traffic signal). Bridge strikes cause millions in damage annually, can close highways for days, and are entirely preventable with proper height pole operations and route surveys.',
    category: 'operations',
    countries: ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'FR', 'NL', 'JP'],
    seoKeywords: ['bridge strike', 'bridge hit oversize load', 'low clearance accident', 'overheight truck'],
    relatedTerms: ['height_pole_operator', 'overheight', 'route_surveyor'],
  },

  // ══════════════ SAFETY ═════════════════════════════════════════

  {
    id: 'chain_of_responsibility',
    term: 'Chain of Responsibility (CoR)',
    aliases: ['CoR', 'Shared Responsibility', 'Supply Chain Responsibility'],
    hcBrandTerm: 'HC Chain of Accountability',
    definition: 'A legal framework (primarily in Australia, adopted conceptually in other jurisdictions) holding EVERY party in the transport chain accountable for safety — from shippers and loaders to drivers, escorts, and receivers. Violations can result in fines for all parties, not just the driver.',
    category: 'safety',
    countries: ['AU', 'NZ', 'GB'],
    seoKeywords: ['chain of responsibility', 'CoR transport', 'supply chain safety'],
    relatedTerms: ['compliance_officer', 'load_inspector'],
    regulatoryRef: 'HVNL (Heavy Vehicle National Law) — Australia',
  },
  {
    id: 'stgo',
    term: 'STGO (Special Types General Order)',
    aliases: ['Special Types', 'STGO Order'],
    hcBrandTerm: 'HC STGO Compliance (UK)',
    definition: 'UK legislation governing the movement of abnormal indivisible loads (AILs) on public roads. Classifies vehicles and loads into Categories 1, 2, and 3 based on weight. Requires ESDAL2 notification system for moves.',
    category: 'safety',
    countries: ['GB'],
    seoKeywords: ['STGO order', 'special types general order', 'UK abnormal load'],
    relatedTerms: ['esdal2', 'oversize_load'],
    regulatoryRef: 'The Road Vehicles (Authorisation of Special Types) (General) Order 2003',
  },
  {
    id: 'schwertransport',
    term: 'Schwertransport',
    aliases: ['Schwerlasttransport', 'Heavy Transport (DE)', 'GST'],
    hcBrandTerm: 'HC Schwertransport (DACH)',
    definition: 'German/DACH term for heavy transport exceeding normal weight and dimensional limits. Governed by StVO and StVZO regulations. Classified into categories requiring different levels of escort (BF3/BF4) and police accompaniment (Polizeibegleitung).',
    category: 'safety',
    countries: ['DE', 'AT', 'CH'],
    localTerms: [
      { country: 'DE', term: 'Großraum- und Schwertransport (GST)', language: 'German' },
    ],
    seoKeywords: ['Schwertransport', 'Schwerlasttransport', 'heavy transport Germany'],
    relatedTerms: ['bf3_operator', 'bf4_operator'],
    regulatoryRef: 'StVZO §70, StVO §29',
  },
  {
    id: 'convoi_exceptionnel',
    term: 'Convoi Exceptionnel',
    aliases: ['Transport Exceptionnel', 'CE', 'Exceptional Convoy'],
    hcBrandTerm: 'HC Convoi Exceptionnel (France)',
    definition: 'French term for exceptional/oversize transport. Classified into 3 categories based on dimensions and weight. Category 3 (largest) requires police escort (gendarmerie), multiple pilot vehicles, and advance authorization from prefectures. All convoi exceptionnel vehicles must display "CONVOI EXCEPTIONNEL" signage.',
    category: 'safety',
    countries: ['FR'],
    seoKeywords: ['convoi exceptionnel', 'transport exceptionnel France', 'French oversize load'],
    relatedTerms: ['oversize_load', 'gendarmerie'],
    regulatoryRef: 'Arrêté du 4 mai 2006 (France)',
  },

  // ══════════════ BUSINESS ═══════════════════════════════════════

  {
    id: 'broker',
    term: 'Broker / Load Broker',
    aliases: ['Freight Broker', 'Transport Broker', 'Dispatch Service', 'Load Dispatcher'],
    hcBrandTerm: 'HC Verified Broker',
    definition: 'An intermediary who connects shippers needing oversize/heavy haul transport with operators and escort providers. Brokers negotiate rates, manage logistics, and take a margin (typically 15–30%) between the shipper price and operator pay. Quality brokers add value through route planning, permit coordination, and risk management.',
    category: 'business',
    countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'FR', 'BR', 'ZA', 'AE'],
    seoKeywords: ['heavy haul broker', 'oversize load broker', 'freight broker escort'],
    relatedTerms: ['shipper', 'carrier'],
  },
  {
    id: 'cod',
    term: 'COD (Cash on Delivery)',
    aliases: ['Cash on Delivery', 'Pay on Delivery', 'COD Payment'],
    hcBrandTerm: 'HC Instant Pay',
    definition: 'Payment method where the escort operator/driver receives payment immediately upon completing the job (delivery). Preferred by most independent PEVOs. Alternative payment methods include EFS codes, CashApp, QuickPay, and Net-30 (30-day invoicing).',
    category: 'business',
    countries: ['US', 'CA'],
    seoKeywords: ['COD pilot car', 'cash on delivery escort', 'pilot car payment'],
    relatedTerms: ['efs', 'quick_pay'],
  },
  {
    id: 'efs',
    term: 'EFS (Electronic Funds Source)',
    aliases: ['EFS Code', 'Comcheck', 'TCH', 'T-Check'],
    hcBrandTerm: 'HC Fuel Card Payment',
    definition: 'A truck stop/fuel station payment code system allowing brokers to send money to drivers/escorts at fuel stops. EFS codes can be cashed at participating truck stops (Pilot, Love\'s, TA/Petro). Common payment method in the escort industry for immediate payment without bank transfer delays.',
    category: 'business',
    countries: ['US', 'CA'],
    seoKeywords: ['EFS code', 'Comcheck', 'truck stop payment escort'],
    relatedTerms: ['cod', 'quick_pay'],
  },

  // ══════════════ TECHNOLOGY ═════════════════════════════════════

  {
    id: 'esdal2',
    term: 'ESDAL2 (Electronic Service Delivery for Abnormal Loads)',
    aliases: ['ESDAL', 'Abnormal Load Notification System'],
    hcBrandTerm: 'HC Route Notification (UK)',
    definition: 'The UK\'s electronic system for notifying highways authorities, bridge owners, and police about planned abnormal load movements. Operators must submit ESDAL2 notifications in advance of any abnormal load move on UK roads.',
    category: 'technology',
    countries: ['GB'],
    seoKeywords: ['ESDAL2', 'abnormal load notification UK', 'ESDAL system'],
    relatedTerms: ['stgo', 'oversize_load'],
    regulatoryRef: 'Highways England',
  },
  {
    id: 'nhvr',
    term: 'NHVR (National Heavy Vehicle Regulator)',
    aliases: ['National Heavy Vehicle Regulator', 'NHVR Australia'],
    hcBrandTerm: 'HC NHVR Compliance (AU)',
    definition: 'Australia\'s national regulator for heavy vehicles and oversize/overweight transport. Manages the national permit system, accreditation of pilot vehicle drivers, and enforcement of heavy vehicle laws across all states and territories.',
    category: 'technology',
    countries: ['AU'],
    seoKeywords: ['NHVR', 'National Heavy Vehicle Regulator', 'NHVR permit', 'Australia oversize'],
    relatedTerms: ['chain_of_responsibility', 'pilot_car'],
    regulatoryRef: 'Heavy Vehicle National Law (HVNL)',
  },
];

// ─── Helper Functions ──────────────────────────────────────────

/** Get all glossary entries */
export function getAllTerms(): GlossaryEntry[] {
  return HC_GLOSSARY;
}

/** Search glossary by text (matches term, aliases, definition) */
export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.toLowerCase();
  return HC_GLOSSARY.filter(e =>
    e.term.toLowerCase().includes(q) ||
    e.aliases.some(a => a.toLowerCase().includes(q)) ||
    e.definition.toLowerCase().includes(q) ||
    (e.hcBrandTerm && e.hcBrandTerm.toLowerCase().includes(q)) ||
    (e.seoKeywords && e.seoKeywords.some(k => k.toLowerCase().includes(q)))
  );
}

/** Get entries by category */
export function getTermsByCategory(category: GlossaryCategory): GlossaryEntry[] {
  return HC_GLOSSARY.filter(e => e.category === category);
}

/** Get local term for a specific country */
export function getLocalTerm(entryId: string, countryCode: string): string | null {
  const entry = HC_GLOSSARY.find(e => e.id === entryId);
  if (!entry?.localTerms) return null;
  const local = entry.localTerms.find(l => l.country === countryCode);
  return local?.term ?? null;
}

/** Get all entries with local terms for a country */
export function getCountryGlossary(countryCode: string): (GlossaryEntry & { localTerm?: string })[] {
  return HC_GLOSSARY
    .filter(e => e.countries.includes(countryCode) || e.localTerms?.some(l => l.country === countryCode))
    .map(e => ({
      ...e,
      localTerm: e.localTerms?.find(l => l.country === countryCode)?.term,
    }));
}

/** Total entry count */
export function getGlossaryCount(): number {
  return HC_GLOSSARY.length;
}
