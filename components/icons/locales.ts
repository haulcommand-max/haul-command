/**
 * HAUL COMMAND — Locale Mapping Files
 *
 * Centralized localization for category labels, synonyms, alt text, and tooltips.
 * One global icon asset. Localized metadata per-country.
 *
 * Tier A = full coverage. Tier B = labels + synonyms. Tier C/D = labels only.
 */

export type CountryCode = string;

export interface CategoryLocale {
    label: string;
    synonyms: string[];
    alt_text: string;
    tooltip: string;
}

export type CategoryLocaleMap = Record<string, CategoryLocale>;

// ── TIER A: Full Coverage ───────────────────────────────────────────────────

export const LOCALE_US: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Pilot Car Operators', synonyms: ['pilot car', 'escort car', 'lead car', 'chase car', 'flag car', 'oversize escort', 'wide load escort'], alt_text: 'Pilot car operator icon showing SUV with roof-mounted beacon lights', tooltip: 'Find certified pilot car operators for oversize load escorts' },
    pilot_car_companies: { label: 'Pilot Car Companies', synonyms: ['pilot car company', 'escort service provider', 'pilot car fleet', 'escort fleet'], alt_text: 'Pilot car company icon showing fleet of escort vehicles', tooltip: 'Find pilot car companies with fleet capacity' },
    heavy_haul_trucking_companies: { label: 'Heavy Haul Trucking', synonyms: ['heavy haul', 'oversize trucking', 'flatbed hauling', 'lowboy', 'overweight carrier', 'superload carrier'], alt_text: 'Heavy haul trucking icon showing semi with lowboy flatbed', tooltip: 'Find heavy haul trucking companies for oversize freight' },
    heavy_haul_brokers: { label: 'Heavy Haul Brokers', synonyms: ['freight broker', 'heavy haul broker', 'oversize broker', 'load broker', 'transport broker'], alt_text: 'Heavy haul broker icon showing document with route handshake', tooltip: 'Connect with heavy haul freight brokers' },
    permit_services: { label: 'Permit Services', synonyms: ['oversize permit', 'overweight permit', 'trip permit', 'state permit', 'single trip permit', 'annual permit'], alt_text: 'Permit services icon showing route document with shield', tooltip: 'Find permit services for oversize and overweight loads' },
    route_surveyors: { label: 'Route Surveyors', synonyms: ['route survey', 'bridge survey', 'clearance survey', 'height survey', 'pre-trip survey'], alt_text: 'Route surveyor icon showing road with measurement markers', tooltip: 'Find route surveyors for oversize load clearance checks' },
    truck_parking_operators: { label: 'Truck Parking', synonyms: ['truck parking', 'overnight parking', 'commercial parking', 'CDL parking', 'safe haven'], alt_text: 'Truck parking icon showing P letter with trailer silhouette', tooltip: 'Find secure truck parking locations' },
    staging_yards: { label: 'Staging Yards', synonyms: ['staging yard', 'staging area', 'laydown yard', 'marshalling yard', 'assembly area'], alt_text: 'Staging yard icon showing fenced lot with equipment', tooltip: 'Find staging yards for load assembly' },
    industrial_outdoor_storage: { label: 'Industrial Outdoor Storage', synonyms: ['outdoor storage', 'industrial storage', 'yard storage', 'container yard', 'pipe yard'], alt_text: 'Industrial storage icon showing fenced area with containers', tooltip: 'Find industrial outdoor storage yards' },
    truck_repair_shops: { label: 'Truck Repair Shops', synonyms: ['truck repair', 'diesel repair', 'heavy duty repair', 'semi repair', 'fleet service'], alt_text: 'Truck repair icon showing wrench across truck wheel', tooltip: 'Find truck repair shops near you' },
    mobile_diesel_repair: { label: 'Mobile Diesel Repair', synonyms: ['mobile diesel', 'roadside diesel repair', 'mobile truck repair', 'mobile mechanic', 'field repair'], alt_text: 'Mobile diesel repair icon showing service van with wrench', tooltip: 'Find mobile diesel repair services' },
    tow_recovery: { label: 'Tow & Recovery', synonyms: ['tow truck', 'heavy tow', 'recovery service', 'wrecker', 'rotator crane', 'heavy recovery'], alt_text: 'Tow and recovery icon showing heavy tow truck with boom', tooltip: 'Find tow and recovery services for heavy vehicles' },
    trailer_leasing: { label: 'Trailer Leasing', synonyms: ['trailer lease', 'trailer rental', 'flatbed lease', 'lowboy rental', 'step deck rental'], alt_text: 'Trailer leasing icon showing detached trailer', tooltip: 'Find trailer leasing and rental services' },
    truck_stops: { label: 'Truck Stops', synonyms: ['truck stop', 'travel center', 'travel plaza', 'fuel stop', 'diesel station', 'flying j', 'loves', 'pilot'], alt_text: 'Truck stop icon showing fuel pump with parking facility', tooltip: 'Find truck stops and travel plazas' },
    hotels: { label: 'Hotels', synonyms: ['hotel', 'motel', 'lodging', 'trucker hotel', 'overnight stay', 'extended stay'], alt_text: 'Hotel icon showing building with truck parking', tooltip: 'Find truck-friendly hotels and lodging' },
    warehouses: { label: 'Warehouses', synonyms: ['warehouse', 'distribution center', 'cross dock', 'loading dock', 'fulfillment center'], alt_text: 'Warehouse icon showing facility with dock doors', tooltip: 'Find warehouses and distribution centers' },
    shippers_manufacturers: { label: 'Shippers & Manufacturers', synonyms: ['shipper', 'manufacturer', 'OEM', 'fabricator', 'production facility', 'plant'], alt_text: 'Shipper icon showing industrial facility', tooltip: 'Find shippers and manufacturers' },
    cdl_schools: { label: 'CDL Schools', synonyms: ['CDL school', 'CDL training', 'truck driving school', 'commercial driving school', 'Class A training'], alt_text: 'CDL school icon showing steering wheel with graduation cap', tooltip: 'Find CDL and commercial driving schools' },
    crane_rigging: { label: 'Crane & Rigging', synonyms: ['crane service', 'rigging', 'heavy lift', 'crane rental', 'mobile crane', 'hydraulic crane'], alt_text: 'Crane icon showing construction crane with boom', tooltip: 'Find crane and rigging services' },
    police_escorts: { label: 'Police Escorts', synonyms: ['police escort', 'law enforcement escort', 'police detail', 'state police escort', 'LEO escort'], alt_text: 'Police escort icon showing patrol vehicle with light bar', tooltip: 'Find police escort services for oversize loads' },
    // Infrastructure
    secure_parking: { label: 'Secure Parking', synonyms: ['secure parking', 'guarded parking', 'fenced parking', 'gated parking'], alt_text: 'Secure parking icon showing locked facility', tooltip: 'Find secure parking for trucks and equipment' },
    self_storage_operators: { label: 'Self Storage', synonyms: ['self storage', 'storage units', 'mini storage'], alt_text: 'Self storage icon showing storage unit facility', tooltip: 'Find self storage facilities' },
    laydown_yards: { label: 'Laydown Yards', synonyms: ['laydown yard', 'laydown area', 'material yard', 'pipe laydown'], alt_text: 'Laydown yard icon showing open material storage area', tooltip: 'Find laydown yards for materials and equipment' },
    ports_terminals: { label: 'Ports & Terminals', synonyms: ['port', 'terminal', 'seaport', 'marine terminal', 'cargo terminal', 'container port'], alt_text: 'Port icon showing shipping facility with crane', tooltip: 'Find ports and marine terminals' },
    rail_intermodal: { label: 'Rail & Intermodal', synonyms: ['rail yard', 'intermodal', 'rail terminal', 'rail siding', 'container on flat car'], alt_text: 'Rail icon showing intermodal terminal', tooltip: 'Find rail and intermodal terminals' },
    truck_wash_detail: { label: 'Truck Wash & Detail', synonyms: ['truck wash', 'fleet wash', 'pressure wash', 'truck detail'], alt_text: 'Truck wash icon showing water spray on vehicle', tooltip: 'Find truck wash and detailing services' },
    fuel_services: { label: 'Fuel Services', synonyms: ['fuel service', 'diesel fuel', 'bulk fuel', 'mobile fueling', 'wet hosing'], alt_text: 'Fuel services icon showing fuel pump', tooltip: 'Find fuel delivery and fueling services' },
    rest_areas: { label: 'Rest Areas', synonyms: ['rest area', 'rest stop', 'highway rest', 'picnic area', 'service area'], alt_text: 'Rest area icon showing rest stop facility', tooltip: 'Find highway rest areas and service plazas' },
    weigh_stations: { label: 'Weigh Stations', synonyms: ['weigh station', 'scale', 'truck scale', 'inspection station', 'portable scale'], alt_text: 'Weigh station icon showing truck on scale', tooltip: 'Find weigh stations and inspection points' },
    bridge_clearance: { label: 'Bridge Clearance', synonyms: ['bridge clearance', 'low bridge', 'overhead clearance', 'height restriction', 'vertical clearance'], alt_text: 'Bridge clearance icon showing height restriction marker', tooltip: 'Check bridge and overhead clearance data' },
    route_restrictions: { label: 'Route Restrictions', synonyms: ['route restriction', 'road restriction', 'weight limit', 'width limit', 'seasonal restriction'], alt_text: 'Route restriction icon showing warning barrier', tooltip: 'View route restrictions and limitations' },
    escort_meetup_zones: { label: 'Escort Meetup Zones', synonyms: ['meetup zone', 'escort meetup', 'staging point', 'rendezvous point', 'swap point'], alt_text: 'Escort meetup icon showing location pin with vehicles', tooltip: 'Find designated escort meetup zones' },
    overnight_staging: { label: 'Overnight Staging', synonyms: ['overnight staging', 'night parking', 'overnight hold', 'curfew parking'], alt_text: 'Overnight staging icon showing moon with parking zone', tooltip: 'Find overnight staging locations for loads' },
    repair_install_locations: { label: 'Repair & Install', synonyms: ['repair shop', 'installation service', 'equipment repair', 'maintenance facility'], alt_text: 'Repair icon showing tools in workshop', tooltip: 'Find repair and installation services' },
    // Support Services
    trailer_repair: { label: 'Trailer Repair', synonyms: ['trailer repair', 'trailer service', 'trailer maintenance', 'reefer repair'], alt_text: 'Trailer repair icon showing trailer with wrench', tooltip: 'Find trailer repair services' },
    tire_shops: { label: 'Truck Tire Shops', synonyms: ['tire shop', 'truck tires', 'commercial tires', 'tire service', '24hr tire'], alt_text: 'Tire shop icon showing truck tire', tooltip: 'Find truck tire shops and services' },
    body_fabrication: { label: 'Body & Fabrication', synonyms: ['body shop', 'fabrication', 'welding', 'truck body', 'custom fab'], alt_text: 'Body and fabrication icon showing welding on metal', tooltip: 'Find body work and metal fabrication shops' },
    roadside_assistance: { label: 'Roadside Assistance', synonyms: ['roadside assistance', 'breakdown service', 'emergency repair', 'road service'], alt_text: 'Roadside assistance icon showing emergency service vehicle', tooltip: 'Find roadside assistance for heavy vehicles' },
    dispatch_services: { label: 'Dispatch Services', synonyms: ['dispatch', 'freight dispatch', 'trucking dispatch', 'load dispatch'], alt_text: 'Dispatch services icon showing headset with route display', tooltip: 'Find professional dispatch services' },
    recruiting_staffing: { label: 'Recruiting & Staffing', synonyms: ['recruiting', 'staffing', 'driver recruiting', 'CDL recruiting', 'temp drivers'], alt_text: 'Recruiting icon showing person with checkmark', tooltip: 'Find driver recruiting and staffing agencies' },
    training_certification: { label: 'Training & Certification', synonyms: ['training', 'certification', 'safety training', 'OSHA', 'flagger cert'], alt_text: 'Training icon showing certificate with checkmark', tooltip: 'Find training and certification programs' },
    survey_engineering: { label: 'Survey & Engineering', synonyms: ['survey', 'engineering', 'civil engineering', 'route engineering', 'structural assessment'], alt_text: 'Survey and engineering icon showing transit instrument', tooltip: 'Find survey and engineering services' },
    utility_coordination: { label: 'Utility Coordination', synonyms: ['utility coordination', 'power line', 'utility clearance', 'line lift', 'utility move'], alt_text: 'Utility coordination icon showing power lines with truck', tooltip: 'Find utility coordination services for load movements' },
    // Commerce
    equipment_dealers: { label: 'Equipment Dealers', synonyms: ['equipment dealer', 'heavy equipment', 'construction equipment', 'used equipment'], alt_text: 'Equipment dealer icon showing dealership lot', tooltip: 'Find heavy equipment dealers' },
    truck_dealers: { label: 'Truck Dealers', synonyms: ['truck dealer', 'semi dealer', 'truck sales', 'new trucks', 'used trucks'], alt_text: 'Truck dealer icon showing dealership with truck', tooltip: 'Find truck dealers and sales' },
    trailer_dealers: { label: 'Trailer Dealers', synonyms: ['trailer dealer', 'trailer sales', 'flatbed dealer', 'new trailers', 'used trailers'], alt_text: 'Trailer dealer icon showing trailer lot', tooltip: 'Find trailer dealers and sales' },
    parts_accessories: { label: 'Parts & Accessories', synonyms: ['parts', 'truck parts', 'accessories', 'aftermarket', 'OEM parts'], alt_text: 'Parts icon showing gear and wrench', tooltip: 'Find truck parts and accessories' },
    installers: { label: 'Installers', synonyms: ['installer', 'equipment installer', 'sign installer', 'light installer'], alt_text: 'Installer icon showing tool with component', tooltip: 'Find equipment installers' },
    escort_equipment: { label: 'Escort Equipment', synonyms: ['escort equipment', 'pilot car equipment', 'oversize signs', 'amber lights', 'flags', 'height poles'], alt_text: 'Escort equipment icon showing beacon and signs', tooltip: 'Find escort and pilot car equipment suppliers' },
    used_equipment: { label: 'Used Equipment', synonyms: ['used equipment', 'pre-owned', 'surplus', 'refurbished'], alt_text: 'Used equipment icon showing recycled tag', tooltip: 'Find used and refurbished equipment' },
    auctions: { label: 'Auctions', synonyms: ['auction', 'equipment auction', 'truck auction', 'surplus auction', 'Ritchie Bros'], alt_text: 'Auction icon showing gavel with truck', tooltip: 'Find equipment and truck auctions' },
    property_hosts: { label: 'Property Hosts', synonyms: ['property host', 'yard host', 'parking host', 'land lease'], alt_text: 'Property host icon showing land with pin', tooltip: 'Find property hosts for truck and equipment parking' },
    // Compliance
    insurance: { label: 'Insurance', synonyms: ['insurance', 'trucking insurance', 'cargo insurance', 'liability', 'commercial auto'], alt_text: 'Insurance icon showing shield with checkmark', tooltip: 'Find trucking and cargo insurance providers' },
    financing_factoring: { label: 'Financing & Factoring', synonyms: ['financing', 'factoring', 'freight factoring', 'equipment financing', 'truck financing'], alt_text: 'Financing icon showing dollar with graph', tooltip: 'Find financing and factoring services' },
    legal_compliance: { label: 'Legal & Compliance', synonyms: ['legal', 'compliance', 'DOT compliance', 'regulatory', 'transportation law'], alt_text: 'Legal icon showing scales of justice with document', tooltip: 'Find legal and compliance services' },
    permitting_authorities: { label: 'Permitting Authorities', synonyms: ['permitting authority', 'DOT', 'state DOT', 'FMCSA', 'transport authority'], alt_text: 'Permitting authority icon showing government building', tooltip: 'Find permitting authorities and DOT offices' },
    inspection_services: { label: 'Inspection Services', synonyms: ['inspection', 'vehicle inspection', 'DOT inspection', 'annual inspection', 'CVSA'], alt_text: 'Inspection icon showing clipboard with checkmarks', tooltip: 'Find vehicle inspection services' },
    // Platform
    load_board: { label: 'Load Board', synonyms: ['load board', 'freight board', 'available loads'], alt_text: 'Load board icon', tooltip: 'Browse available loads' },
    load_alerts: { label: 'Load Alerts', synonyms: ['load alerts', 'freight alerts', 'load notifications'], alt_text: 'Load alerts icon', tooltip: 'Set up load alerts' },
    route_planner: { label: 'Route Planner', synonyms: ['route planner', 'trip planner', 'route optimizer'], alt_text: 'Route planner icon', tooltip: 'Plan your route' },
    report_cards: { label: 'Report Cards', synonyms: ['report card', 'scorecard', 'operator report'], alt_text: 'Report cards icon', tooltip: 'View operator report cards' },
    directory: { label: 'Directory', synonyms: ['directory', 'business directory', 'operator directory'], alt_text: 'Directory icon', tooltip: 'Browse the directory' },
    map: { label: 'Map', synonyms: ['map', 'location map', 'area map'], alt_text: 'Map icon', tooltip: 'Open the map' },
    marketplace: { label: 'Marketplace', synonyms: ['marketplace', 'shop', 'store'], alt_text: 'Marketplace icon', tooltip: 'Browse the marketplace' },
    academy_docs: { label: 'Academy & Docs', synonyms: ['academy', 'documentation', 'guides', 'learning center'], alt_text: 'Academy icon', tooltip: 'Access guides and documentation' },
    community: { label: 'Community', synonyms: ['community', 'forum', 'discussion'], alt_text: 'Community icon', tooltip: 'Join the community' },
    ads_sponsors: { label: 'Ads & Sponsors', synonyms: ['advertising', 'sponsorship', 'promote'], alt_text: 'Ads icon', tooltip: 'Advertising and sponsorship opportunities' },
    claims_verification: { label: 'Claims & Verification', synonyms: ['claim', 'verify', 'claim profile'], alt_text: 'Claims icon', tooltip: 'Claim and verify your listing' },
    urgent_services: { label: 'Urgent Services', synonyms: ['urgent', 'emergency', 'rush', 'ASAP'], alt_text: 'Urgent services icon', tooltip: 'Find urgent and emergency services' },
    messages_chat: { label: 'Messages & Chat', synonyms: ['messages', 'chat', 'inbox'], alt_text: 'Messages icon', tooltip: 'View messages' },
    saved_watchlists: { label: 'Saved & Watchlists', synonyms: ['saved', 'watchlist', 'favorites', 'bookmarks'], alt_text: 'Saved icon', tooltip: 'View saved items and watchlists' },
    and_more: { label: 'And More', synonyms: ['more', 'other', 'additional'], alt_text: 'More categories icon', tooltip: 'Browse more categories' },
    // Status
    verified: { label: 'Verified', synonyms: ['verified', 'confirmed', 'validated'], alt_text: 'Verified badge icon', tooltip: 'Verified profile' },
    claimed: { label: 'Claimed', synonyms: ['claimed', 'owned', 'managed'], alt_text: 'Claimed badge icon', tooltip: 'Claimed listing' },
    top_ranked: { label: 'Top Ranked', synonyms: ['top ranked', 'best rated', 'highest rated'], alt_text: 'Top ranked badge icon', tooltip: 'Top ranked operator' },
    new_listing: { label: 'New Listing', synonyms: ['new', 'new listing', 'recently added'], alt_text: 'New listing badge icon', tooltip: 'New listing' },
    sponsored: { label: 'Sponsored', synonyms: ['sponsored', 'promoted', 'featured'], alt_text: 'Sponsored badge icon', tooltip: 'Sponsored listing' },
    urgent: { label: 'Urgent', synonyms: ['urgent', 'time-sensitive', 'rush'], alt_text: 'Urgent badge icon', tooltip: 'Urgent need' },
    available_now: { label: 'Available Now', synonyms: ['available', 'open', 'ready', 'online'], alt_text: 'Available now badge icon', tooltip: 'Available right now' },
    premium: { label: 'Premium', synonyms: ['premium', 'pro', 'elite', 'paid'], alt_text: 'Premium badge icon', tooltip: 'Premium member' },
};

export const LOCALE_CA: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Pilot Vehicle Operators', synonyms: ['pilot vehicle', 'escort vehicle', 'lead vehicle', 'wide load escort', 'oversize escort'], alt_text: 'Pilot vehicle operator icon with roof beacon bar', tooltip: 'Browse pilot vehicle operators for wide load movements' },
    pilot_car_companies: { label: 'Pilot Vehicle Companies', synonyms: ['pilot vehicle company', 'escort fleet', 'escort service'], alt_text: 'Pilot vehicle company icon', tooltip: 'Find pilot vehicle companies' },
    heavy_haul_trucking_companies: { label: 'Heavy Haul Trucking', synonyms: ['heavy haul', 'oversize carrier', 'wide load trucking', 'over-dimensional'], alt_text: 'Heavy haul trucking icon', tooltip: 'Find heavy haul carriers in Canada' },
    heavy_haul_brokers: { label: 'Heavy Haul Brokers', synonyms: ['freight broker', 'transport broker', 'heavy load broker'], alt_text: 'Heavy haul broker icon', tooltip: 'Connect with heavy haul brokers' },
    permit_services: { label: 'Permit Services', synonyms: ['permit service', 'over-dimensional permit', 'provincial permit', 'transport permit'], alt_text: 'Permit services icon', tooltip: 'Find permit services for oversize loads' },
    truck_stops: { label: 'Truck Stops', synonyms: ['truck stop', 'fuel stop', 'cardlock', 'travel centre'], alt_text: 'Truck stop icon', tooltip: 'Find truck stops across Canada' },
    truck_repair_shops: { label: 'Truck Repair Shops', synonyms: ['truck repair', 'diesel repair', 'fleet service', 'heavy duty repair'], alt_text: 'Truck repair shop icon', tooltip: 'Find truck repair shops' },
    tow_recovery: { label: 'Tow & Recovery', synonyms: ['towing', 'heavy recovery', 'wrecker', 'roadside'], alt_text: 'Tow and recovery icon', tooltip: 'Find tow and recovery services' },
};

export const LOCALE_AU: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Escort Vehicle Operators', synonyms: ['escort vehicle', 'pilot vehicle', 'warning vehicle', 'oversize escort', 'OSOM escort'], alt_text: 'Escort vehicle operator icon with warning lights', tooltip: 'Search escort vehicle operators across Australia' },
    pilot_car_companies: { label: 'Escort Vehicle Companies', synonyms: ['escort company', 'pilot vehicle fleet', 'escort service'], alt_text: 'Escort vehicle company icon', tooltip: 'Find escort vehicle companies in Australia' },
    heavy_haul_trucking_companies: { label: 'Heavy Haulage', synonyms: ['heavy haulage', 'oversize transport', 'over-dimensional transport', 'OSOM transport'], alt_text: 'Heavy haulage icon with semi-trailer', tooltip: 'Find heavy haulage operators across Australia' },
    truck_stops: { label: 'Roadhouses', synonyms: ['roadhouse', 'truck stop', 'servo', 'rest stop', 'fuel stop'], alt_text: 'Roadhouse icon', tooltip: 'Find roadhouses and truck stops' },
    hotels: { label: 'Accommodation', synonyms: ['accommodation', 'motel', 'motor inn', 'lodge', 'caravan park'], alt_text: 'Accommodation icon', tooltip: 'Find truck-friendly accommodation' },
};

export const LOCALE_GB: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Escort Vehicle Operators', synonyms: ['escort vehicle', 'abnormal load escort', 'wide load escort', 'pilot vehicle'], alt_text: 'Escort vehicle icon for abnormal load operations', tooltip: 'Find escort vehicle services for abnormal loads in the UK' },
    heavy_haul_trucking_companies: { label: 'Abnormal Load Haulage', synonyms: ['abnormal load haulage', 'heavy haulage', 'wide load transport', 'STGO'], alt_text: 'Abnormal load haulage icon', tooltip: 'Find abnormal load haulage services' },
    truck_stops: { label: 'Truck Stops', synonyms: ['truck stop', 'motorway services', 'lorry park', 'service station'], alt_text: 'Truck stop icon', tooltip: 'Find truck stops and motorway services' },
    hotels: { label: 'Hotels', synonyms: ['hotel', 'B&B', 'lodge', 'inn', 'guest house'], alt_text: 'Hotel icon', tooltip: 'Find hotels and lodging' },
    truck_repair_shops: { label: 'HGV Repair Garages', synonyms: ['HGV repair', 'lorry repair', 'truck garage', 'commercial vehicle repair'], alt_text: 'HGV repair garage icon', tooltip: 'Find HGV and commercial vehicle repair garages' },
    tow_recovery: { label: 'Recovery Services', synonyms: ['recovery', 'heavy recovery', 'breakdown recovery', 'HGV recovery'], alt_text: 'Recovery services icon', tooltip: 'Find vehicle recovery services' },
    cdl_schools: { label: 'HGV Training Schools', synonyms: ['HGV training', 'LGV training', 'commercial driving school', 'Cat C training'], alt_text: 'HGV training school icon', tooltip: 'Find HGV and LGV training schools' },
    trailer_leasing: { label: 'Trailer Hire', synonyms: ['trailer hire', 'flatbed hire', 'equipment hire', 'trailer rental'], alt_text: 'Trailer hire icon', tooltip: 'Find trailer hire services' },
};

export const LOCALE_NZ: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Pilot Vehicle Operators', synonyms: ['pilot vehicle', 'escort vehicle', 'overweight escort', 'oversize escort'], alt_text: 'Pilot vehicle operator icon', tooltip: 'Find pilot vehicle operators in New Zealand' },
    heavy_haul_trucking_companies: { label: 'Heavy Haulage', synonyms: ['heavy haulage', 'oversize transport', 'over-dimension transport'], alt_text: 'Heavy haulage icon', tooltip: 'Find heavy haulage companies in New Zealand' },
};

// ── TIER B: Labels + Synonyms ───────────────────────────────────────────────

export const LOCALE_MX: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Vehículos Escolta', synonyms: ['vehículo escolta', 'carro piloto', 'escolta de carga'], alt_text: 'Icono de vehículo escolta', tooltip: 'Encontrar operadores de vehículos escolta' },
    heavy_haul_trucking_companies: { label: 'Transporte Pesado', synonyms: ['transporte pesado', 'carga sobredimensionada', 'carga pesada'], alt_text: 'Icono de transporte pesado', tooltip: 'Encontrar empresas de transporte pesado' },
    truck_stops: { label: 'Paradas de Camiones', synonyms: ['parada de camiones', 'gasolinera', 'estación de servicio'], alt_text: 'Icono de parada de camiones', tooltip: 'Encontrar paradas de camiones' },
};

export const LOCALE_DE: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Begleitfahrzeuge', synonyms: ['Begleitfahrzeug', 'Schwertransport-Begleitung', 'Brückenprüfer'], alt_text: 'Begleitfahrzeug-Symbol', tooltip: 'Begleitfahrzeuge für Schwertransporte finden' },
    heavy_haul_trucking_companies: { label: 'Schwertransport', synonyms: ['Schwertransport', 'Sondertransport', 'Überbreite', 'Überhöhe'], alt_text: 'Schwertransport-Symbol', tooltip: 'Schwertransport-Unternehmen finden' },
};

export const LOCALE_FR: CategoryLocaleMap = {
    pilot_car_operators: { label: 'Véhicules Pilotes', synonyms: ['véhicule pilote', 'voiture pilote', 'escorte convoi exceptionnel'], alt_text: 'Icône véhicule pilote', tooltip: 'Trouver des véhicules pilotes pour convois exceptionnels' },
    heavy_haul_trucking_companies: { label: 'Transport Exceptionnel', synonyms: ['transport exceptionnel', 'convoi exceptionnel', 'transport hors gabarit'], alt_text: 'Icône transport exceptionnel', tooltip: 'Trouver des entreprises de transport exceptionnel' },
};

// ── Locale registry ─────────────────────────────────────────────────────────

export const LOCALE_REGISTRY: Record<CountryCode, CategoryLocaleMap> = {
    US: LOCALE_US, CA: LOCALE_CA, AU: LOCALE_AU, GB: LOCALE_GB, NZ: LOCALE_NZ,
    MX: LOCALE_MX, DE: LOCALE_DE, FR: LOCALE_FR,
};

// ── Runtime helpers ─────────────────────────────────────────────────────────

export function getLocale(country: CountryCode): CategoryLocaleMap {
    return LOCALE_REGISTRY[country] || LOCALE_US;
}

export function getLocalizedLabel(iconId: string, country: CountryCode = 'US'): string {
    const loc = getLocale(country)[iconId];
    return loc?.label || getLocale('US')[iconId]?.label || iconId;
}

export function getLocalizedSynonyms(iconId: string, country: CountryCode = 'US'): string[] {
    const loc = getLocale(country)[iconId];
    return loc?.synonyms || getLocale('US')[iconId]?.synonyms || [];
}

export function getLocalizedAltText(iconId: string, country: CountryCode = 'US'): string {
    const loc = getLocale(country)[iconId];
    return loc?.alt_text || getLocale('US')[iconId]?.alt_text || '';
}

export function getLocalizedTooltip(iconId: string, country: CountryCode = 'US'): string {
    const loc = getLocale(country)[iconId];
    return loc?.tooltip || getLocale('US')[iconId]?.tooltip || '';
}

export function getSupportedCountries(): CountryCode[] {
    return Object.keys(LOCALE_REGISTRY);
}
