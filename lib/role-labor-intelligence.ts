export type PayUnit = 'hour' | 'day' | 'mile' | 'week' | 'year' | 'load' | 'permit' | 'project' | 'commission';
export type AutomationClass = 'human_physical' | 'human_plus_software' | 'workflow_automatable' | 'data_product';

export type RoleIntelligence = {
  slug: string;
  title: string;
  emoji: string;
  directoryCategoryKey: string;
  jobFamily: string;
  aliases: string[];
  description: string;
  demandSignals: string[];
  painPoints: string[];
  credentials: string[];
  equipment: string[];
  payModel: { primaryUnit: PayUnit; publicRange: string; dataNotes: string };
  automationScore: number;
  automationClass: AutomationClass;
  automationPlan: string[];
  surfaces: { directory: string; role: string; training: string; tools: string[]; corridors: string; dataProduct: string };
  monetizationProducts: string[];
  searchableAcross120Countries: boolean;
};

export const HC_120_COUNTRY_CODES = [
  'US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR','IE','SE','NO','DK','FI','BE','AT','CH','ES','FR','IT','PT','SA','QA','MX','IN','ID','TH','PL','CZ','SK','HU','SI','EE','LV','LT','HR','RO','BG','GR','TR','KW','OM','BH','SG','MY','JP','KR','CL','AR','CO','PE','VN','PH','UY','PA','CR','IL','NG','EG','KE','MA','RS','UA','KZ','TW','PK','BD','MN','TT','JO','GH','TZ','GE','AZ','CY','IS','LU','EC','BO','PY','GT','DO','HN','SV','NI','JM','GY','SR','BA','ME','MK','AL','MD','IQ','NA','AO','MZ','ET','CI','SN','BW','ZM','UG','CM','KH','LK','UZ','LA','NP','DZ','TN','MT','BN','RW','MG','PG','TM','KG','MW'
] as const;

export const laborDemandFields = [
  { key: 'role_slug', label: 'Normalized role', purpose: 'Turns messy job titles into Haul Command role pages, directory categories, and training paths.' },
  { key: 'country_region_city', label: 'Hyperlocal market', purpose: 'Shows where jobs, worker shortages, and sponsor opportunities are concentrated.' },
  { key: 'pay_range', label: 'Pay/rate range', purpose: 'Powers pay benchmarks without copying full third-party listings.' },
  { key: 'pay_unit', label: 'Pay unit', purpose: 'Separates hourly, mileage, day-rate, project, permit, commission, and salary economics.' },
  { key: 'credentials', label: 'Credential requirements', purpose: 'Feeds qualification gates, training recommendations, and directory trust badges.' },
  { key: 'equipment', label: 'Equipment requirements', purpose: 'Connects jobs to RouteReady marketplace bundles and supplier ads.' },
  { key: 'task_phrases', label: 'Repeated task phrases', purpose: 'Identifies pain points Haul Command can automate or turn into tools.' },
  { key: 'posting_velocity', label: 'Posting velocity', purpose: 'Creates labor-demand heatmaps and market launch triggers.' },
  { key: 'employer_type', label: 'Employer type', purpose: 'Distinguishes carrier, broker, construction, utility, crane, port, government, and 3PL demand.' },
  { key: 'confidence_score', label: 'Confidence score', purpose: 'Prevents weak samples from being sold as strong market intelligence.' },
];

export const roleIntelligenceRoles: RoleIntelligence[] = [
  {
    slug: 'pilot-car-operator', title: 'Pilot Car / Escort Vehicle Operator', emoji: '🚗', directoryCategoryKey: 'pilot_car_operator', jobFamily: 'escort_operations',
    aliases: ['pilot car driver', 'escort vehicle operator', 'PEVO', 'wide load escort', 'oversize load escort'],
    description: 'Escorts oversize and overweight loads ahead of, behind, or alongside the transport unit to warn traffic, manage clearances, and support safe permitted movement.',
    demandSignals: ['pilot car near me', 'escort vehicle jobs', 'oversize load escort', 'PEVO certification', 'pilot car rates per mile'],
    painPoints: ['finding consistent broker work', 'knowing state requirements', 'proving insurance and certifications', 'getting paid fairly', 'being visible in local markets'],
    credentials: ['driver license', 'state PEVO or escort certification where required', 'commercial auto insurance', 'flagging/safety training'],
    equipment: ['amber lights', 'oversize load sign', 'flags', 'radio', 'fire extinguisher', 'cones', 'height pole when applicable'],
    payModel: { primaryUnit: 'mile', publicRange: '$1.50-$3.50+/mile or $300-$700/day depending on load, market, and specialization.', dataNotes: 'Normalize by country, corridor, load class, day rate, deadhead, and specialty premium.' },
    automationScore: 38, automationClass: 'human_plus_software',
    automationPlan: ['automate broker matching', 'automate document verification intake', 'automate availability and radius alerts', 'automate rate guidance and corridor ranking'],
    surfaces: { directory: '/directory?category=pilot_car_operator', role: '/roles/pilot-car-operator', training: '/training/roles/pilot-car-operator', tools: ['/tools/escort-calculator','/tools/escort-count-calculator','/rates'], corridors: '/corridors?role=pilot-car-operator', dataProduct: '/labor-demand?role=pilot-car-operator' },
    monetizationProducts: ['verified profile', 'priority placement', 'broker lead routing', 'corridor sponsorship', 'rate intelligence'], searchableAcross120Countries: true,
  },
  {
    slug: 'high-pole-escort', title: 'High Pole Escort', emoji: '📐', directoryCategoryKey: 'high_pole', jobFamily: 'escort_operations',
    aliases: ['height pole operator', 'pole car', 'overheight escort', 'high pole pilot car'],
    description: 'Operates an escort vehicle with a calibrated height pole to detect overhead clearance conflicts before an over-height load reaches them.',
    demandSignals: ['height pole escort', 'high pole pilot car', 'overheight load escort', 'bridge clearance escort'],
    painPoints: ['calibration proof', 'premium pricing', 'route clearance uncertainty', 'low-clearance incident risk'],
    credentials: ['base escort certification', 'height pole training where required', 'calibration documentation'],
    equipment: ['calibrated height pole', 'lead escort vehicle', 'amber/white lights where required', 'radio'],
    payModel: { primaryUnit: 'mile', publicRange: '$2.00-$4.00+/mile or premium day rate above standard escort.', dataNotes: 'Track premium over base escort rate by height threshold and route complexity.' },
    automationScore: 42, automationClass: 'human_plus_software',
    automationPlan: ['match over-height loads to high-pole profiles', 'store calibration proof', 'surface clearance risk by corridor', 'sell high-pole rate benchmarks'],
    surfaces: { directory: '/directory?category=high_pole', role: '/roles/high-pole-escort', training: '/training/roles/high-pole-escort', tools: ['/tools/height-clearance','/tools/escort-calculator'], corridors: '/corridors?specialty=overheight', dataProduct: '/labor-demand?role=high-pole-escort' },
    monetizationProducts: ['specialist badge', 'overheight lead fee', 'equipment supplier placement', 'clearance-risk data'], searchableAcross120Countries: true,
  },
  {
    slug: 'steerman', title: 'Steerman / Rear Steer Operator', emoji: '🕹️', directoryCategoryKey: 'steerman', jobFamily: 'specialized_operations',
    aliases: ['tillerman', 'rear steer', 'steer car operator', 'modular steering operator'],
    description: 'Controls or supports rear steering for long, modular, or extremely complex loads that need coordinated turning control.',
    demandSignals: ['rear steer operator', 'steerman heavy haul', 'tillerman jobs', 'superload steering'],
    painPoints: ['scarce specialist availability', 'high liability', 'hard-to-verify experience', 'superload scheduling'],
    credentials: ['documented heavy haul experience', 'superload references', 'site-specific safety training'],
    equipment: ['rear steer controls', 'radio/headset', 'PPE', 'load-specific steering system'],
    payModel: { primaryUnit: 'day', publicRange: '$500-$1,500+/day depending on load complexity and market scarcity.', dataNotes: 'Normalize by superload class, modular trailer type, and verified experience.' },
    automationScore: 25, automationClass: 'human_physical',
    automationPlan: ['build scarce-specialist marketplace', 'verify prior projects', 'alert brokers when specialists are near a corridor', 'sell scarcity indexes'],
    surfaces: { directory: '/directory?category=steerman', role: '/roles/steerman', training: '/training/roles/steerman', tools: ['/corridors','/loads'], corridors: '/corridors?role=steerman', dataProduct: '/labor-demand?role=steerman' },
    monetizationProducts: ['scarce-specialist referral fee', 'verified specialist badge', 'superload data product'], searchableAcross120Countries: true,
  },
  {
    slug: 'heavy-haul-driver', title: 'Heavy Haul Driver', emoji: '🚛', directoryCategoryKey: 'heavy_haul_driver', jobFamily: 'carrier_operations',
    aliases: ['lowboy driver', 'RGN driver', 'Landoll driver', 'step deck driver', 'specialized transport driver'],
    description: 'Moves heavy equipment, construction machinery, project cargo, and oversize loads using specialized trailers and compliant routing.',
    demandSignals: ['heavy haul driver', 'RGN driver', 'lowboy driver', 'Landoll driver', 'step deck heavy haul'],
    painPoints: ['consistent freight', 'permit coordination', 'escort scheduling', 'detention and layover pay', 'loading and securement requirements'],
    credentials: ['CDL or country equivalent', 'medical card where required', 'securement knowledge', 'oversize/overweight compliance'],
    equipment: ['tractor', 'lowboy/RGN/Landoll/step deck', 'chains and binders', 'PPE', 'ELD/compliance tools'],
    payModel: { primaryUnit: 'week', publicRange: '$1,000-$3,500+/week or owner-operator revenue share depending on equipment and market.', dataNotes: 'Split company driver wages, owner-operator gross, per-mile, and accessorials.' },
    automationScore: 48, automationClass: 'human_plus_software',
    automationPlan: ['automate escort pairing', 'automate permit checklist', 'route carriers to verified staging yards', 'price accessorial intelligence'],
    surfaces: { directory: '/directory?category=heavy_haul_driver', role: '/roles/heavy-haul-driver', training: '/training/roles/heavy-haul-driver', tools: ['/tools/permit-calculator','/tools/escort-calculator','/loads'], corridors: '/corridors?role=heavy-haul-driver', dataProduct: '/labor-demand?role=heavy-haul-driver' },
    monetizationProducts: ['load-board access', 'rate intelligence', 'carrier profile upsell', 'fuel/maintenance partner ads'], searchableAcross120Countries: true,
  },
  {
    slug: 'heavy-haul-dispatcher', title: 'Heavy Haul Dispatcher / Project Coordinator', emoji: '📋', directoryCategoryKey: 'heavy_haul_dispatcher', jobFamily: 'coordination',
    aliases: ['project coordinator', 'transport coordinator', 'load coordinator', 'specialized dispatcher', 'track and trace coordinator'],
    description: 'Coordinates trucks, escorts, permits, SOPs, accessorials, TMS updates, carrier communication, and track-and-trace for specialized transport moves.',
    demandSignals: ['heavy haul dispatcher', 'transport project coordinator', 'track and trace heavy haul', 'TMS coordinator'],
    painPoints: ['afterhours coverage', 'carrier capacity gaps', 'rate negotiation', 'SOP compliance', 'manual status updates'],
    credentials: ['logistics experience', 'DOT/regulatory knowledge', 'multi-state geography', 'customer service', 'TMS proficiency'],
    equipment: ['TMS', 'phone/email', 'load board access', 'tracking dashboard'],
    payModel: { primaryUnit: 'year', publicRange: '$45,000-$75,000+/year or commission by move depending on employer and market.', dataNotes: 'Aggregate salary postings separately from per-load brokerage commissions.' },
    automationScore: 82, automationClass: 'workflow_automatable',
    automationPlan: ['automate capacity matching', 'automate SOP checklists', 'automate status updates', 'automate accessorial capture', 'build dispatcher cockpit'],
    surfaces: { directory: '/directory?category=heavy_haul_dispatcher', role: '/roles/heavy-haul-dispatcher', training: '/training/roles/heavy-haul-dispatcher', tools: ['/loads','/tools/dispatch-checklist','/tools/rate-estimator'], corridors: '/corridors?role=heavy-haul-dispatcher', dataProduct: '/labor-demand?role=heavy-haul-dispatcher' },
    monetizationProducts: ['dispatcher cockpit', 'broker automation', 'capacity intelligence', 'SOP compliance module'], searchableAcross120Countries: true,
  },
  {
    slug: 'permit-coordinator', title: 'Permit Coordinator / Permit Agent', emoji: '📄', directoryCategoryKey: 'permit_services', jobFamily: 'compliance',
    aliases: ['permit agent', 'oversize permit specialist', 'OSOW permit coordinator', 'compliance coordinator'],
    description: 'Obtains oversize/overweight permits, interprets jurisdiction rules, manages route restrictions, and ensures required escorts and movement windows are satisfied.',
    demandSignals: ['oversize permit coordinator', 'overweight permit agent', 'permit service heavy haul', 'OSOW permits'],
    painPoints: ['state-by-state complexity', 'manual forms', 'permit rejections', 'route restrictions', 'time-sensitive filings'],
    credentials: ['jurisdiction permit system knowledge', 'bridge/route rules', 'insurance documentation workflow', 'attention to detail'],
    equipment: ['permit portals', 'route tools', 'document storage', 'carrier/load data intake'],
    payModel: { primaryUnit: 'permit', publicRange: '$50-$250+/permit or salary/retainer for high-volume operations.', dataNotes: 'Track permit type, state/country, complexity, turnaround, and rejection rate.' },
    automationScore: 88, automationClass: 'workflow_automatable',
    automationPlan: ['automate load intake', 'pre-check missing data', 'generate jurisdiction checklists', 'route to human filer only when needed'],
    surfaces: { directory: '/directory?category=permit_services', role: '/roles/permit-coordinator', training: '/training/roles/permit-coordinator', tools: ['/tools/permit-calculator','/regulations','/escort-requirements'], corridors: '/corridors?need=permits', dataProduct: '/labor-demand?role=permit-coordinator' },
    monetizationProducts: ['permit filing marketplace', 'compliance subscription', 'permit data benchmarks', 'rush-permit upsell'], searchableAcross120Countries: true,
  },
  {
    slug: 'route-surveyor', title: 'Route Surveyor', emoji: '🗺️', directoryCategoryKey: 'route_survey', jobFamily: 'route_intelligence',
    aliases: ['route survey specialist', 'route assessment specialist', 'clearance surveyor', 'pre-trip route scout'],
    description: 'Assesses the proposed path for bridge clearances, turns, utilities, weight restrictions, staging areas, and physical obstacles before an oversize move.',
    demandSignals: ['route survey heavy haul', 'oversize route survey', 'route assessment abnormal load'],
    painPoints: ['bad route data', 'clearance surprises', 'manual reports', 'lack of reusable corridor intelligence'],
    credentials: ['route survey methodology', 'clearance measurement', 'report writing', 'permit rule knowledge'],
    equipment: ['survey vehicle', 'dashcam/camera', 'measuring tools', 'GPS', 'report template'],
    payModel: { primaryUnit: 'project', publicRange: '$500-$1,500+/survey depending on route length, complexity, and country.', dataNotes: 'Create reusable corridor intelligence while respecting client confidentiality.' },
    automationScore: 62, automationClass: 'human_plus_software',
    automationPlan: ['standardize survey intake', 'reuse anonymous corridor risk data', 'generate report templates', 'match surveyors by region'],
    surfaces: { directory: '/directory?category=route_survey', role: '/roles/route-surveyor', training: '/training/roles/route-surveyor', tools: ['/corridors','/tools/route-survey-checklist'], corridors: '/corridors?role=route-surveyor', dataProduct: '/labor-demand?role=route-surveyor' },
    monetizationProducts: ['survey lead routing', 'corridor risk intelligence', 'report templates', 'sponsor placements'], searchableAcross120Countries: true,
  },
  {
    slug: 'freight-broker', title: 'Freight Broker / Heavy Haul Broker', emoji: '🤝', directoryCategoryKey: 'freight_broker', jobFamily: 'brokerage',
    aliases: ['heavy haul broker', 'specialized freight broker', 'carrier sales', 'logistics broker'],
    description: 'Sources capacity, negotiates rates, books carriers and escorts, and manages customer expectations for oversize/specialized freight.',
    demandSignals: ['heavy haul broker', 'specialized freight broker', 'carrier sales heavy haul', 'oversize load broker'],
    painPoints: ['finding verified capacity', 'escort shortages', 'quote speed', 'trusting new operators', 'claiming margin'],
    credentials: ['broker authority where required', 'insurance/bond knowledge', 'specialized freight knowledge', 'carrier network'],
    equipment: ['TMS', 'load board', 'CRM', 'rate tools', 'phone/email'],
    payModel: { primaryUnit: 'commission', publicRange: 'Commission or margin per move; varies heavily by load value and brokerage model.', dataNotes: 'Use demand, margin proxies, and quote velocity instead of exposing confidential broker economics.' },
    automationScore: 84, automationClass: 'workflow_automatable',
    automationPlan: ['automate capacity discovery', 'score operator fit', 'suggest rate ranges', 'trigger follow-ups and claim flows'],
    surfaces: { directory: '/directory?category=freight_broker', role: '/roles/freight-broker', training: '/training/roles/freight-broker', tools: ['/loads/post','/directory','/rates'], corridors: '/corridors?role=freight-broker', dataProduct: '/labor-demand?role=freight-broker' },
    monetizationProducts: ['broker seat', 'lead routing', 'premium load posting', 'capacity intelligence'], searchableAcross120Countries: true,
  },
  {
    slug: 'heavy-towing-rotator', title: 'Heavy Towing / Rotator Operator', emoji: '🏗️', directoryCategoryKey: 'heavy_towing', jobFamily: 'recovery',
    aliases: ['heavy recovery', 'rotator operator', 'wrecker operator', 'incident recovery'],
    description: 'Responds to disabled, stuck, overturned, or high-risk heavy haul equipment with heavy wreckers, rotators, recovery crews, and traffic-control coordination.',
    demandSignals: ['heavy towing rotator', 'heavy recovery near me', 'lowboy recovery', 'oversize load recovery'],
    painPoints: ['emergency availability', 'route access', 'price opacity', 'incident response coordination'],
    credentials: ['heavy recovery experience', 'commercial insurance', 'traffic safety training', 'equipment certifications'],
    equipment: ['rotator', 'heavy wrecker', 'winches', 'rigging', 'traffic cones', 'PPE'],
    payModel: { primaryUnit: 'project', publicRange: '$750-$10,000+ per incident depending on recovery complexity and equipment.', dataNotes: 'Store as incident class ranges, not as single flat rates.' },
    automationScore: 45, automationClass: 'human_plus_software',
    automationPlan: ['emergency routing', 'availability status', 'incident type intake', 'tow/recovery marketplace'],
    surfaces: { directory: '/directory?category=heavy_towing', role: '/roles/heavy-towing-rotator', training: '/training/roles/heavy-towing-rotator', tools: ['/directory','/corridors'], corridors: '/corridors?need=recovery', dataProduct: '/labor-demand?role=heavy-towing-rotator' },
    monetizationProducts: ['emergency lead fee', 'featured recovery profile', 'corridor incident intelligence'], searchableAcross120Countries: true,
  },
  {
    slug: 'twic-port-escort', title: 'Port / TWIC Cleared Escort', emoji: '🚢', directoryCategoryKey: 'twic_cleared_operator', jobFamily: 'port_operations',
    aliases: ['port escort', 'TWIC escort', 'terminal escort', 'project cargo port escort'],
    description: 'Supports port, terminal, refinery, or controlled-site movements where special access credentials and local port knowledge are required.',
    demandSignals: ['TWIC escort', 'port heavy haul escort', 'project cargo port transport', 'terminal escort'],
    painPoints: ['credential access', 'port appointment windows', 'scarce local operators', 'project cargo timing'],
    credentials: ['TWIC or country-equivalent port access where applicable', 'site orientation', 'escort certification'],
    equipment: ['escort vehicle', 'PPE', 'port-approved ID/access', 'radio'],
    payModel: { primaryUnit: 'day', publicRange: 'Premium day, project, or access fee; varies by port and access requirements.', dataNotes: 'Normalize by port, terminal, access credential, and project cargo class.' },
    automationScore: 55, automationClass: 'human_plus_software',
    automationPlan: ['store credential badges', 'match port moves to cleared operators', 'sell port-capacity intelligence'],
    surfaces: { directory: '/directory?category=twic_cleared_operator', role: '/roles/twic-port-escort', training: '/training/roles/twic-port-escort', tools: ['/directory','/corridors'], corridors: '/corridors?surface=port', dataProduct: '/labor-demand?role=twic-port-escort' },
    monetizationProducts: ['credentialed lead routing', 'port sponsor placement', 'port demand dashboards'], searchableAcross120Countries: true,
  },
  {
    slug: 'border-customs-expediter', title: 'Border Customs Expediter', emoji: '🛂', directoryCategoryKey: 'border_customs_expediter', jobFamily: 'cross_border',
    aliases: ['customs expediter', 'border fixer', 'cross-border heavy haul coordinator', 'customs broker support'],
    description: 'Helps cross-border heavy haul moves clear paperwork, permits, inspections, and local requirements between countries or customs zones.',
    demandSignals: ['cross border heavy haul', 'customs expediter heavy equipment', 'oversize border crossing'],
    painPoints: ['paperwork mismatch', 'language gaps', 'delays at border', 'country-specific permit conflicts'],
    credentials: ['customs knowledge', 'language/local market knowledge', 'document workflow experience'],
    equipment: ['document portal', 'phone/email', 'local contacts', 'translation workflow'],
    payModel: { primaryUnit: 'project', publicRange: 'Project fee or retainer; varies by border, paperwork complexity, and urgency.', dataNotes: 'Track border pair and document complexity instead of copying individual quotes.' },
    automationScore: 68, automationClass: 'workflow_automatable',
    automationPlan: ['document checklist by country pair', 'translation support', 'border demand heatmap', 'human escalations for hard cases'],
    surfaces: { directory: '/directory?category=border_customs_expediter', role: '/roles/border-customs-expediter', training: '/training/roles/border-customs-expediter', tools: ['/regulations','/tools/cross-border-checklist'], corridors: '/corridors?type=cross-border', dataProduct: '/labor-demand?role=border-customs-expediter' },
    monetizationProducts: ['cross-border concierge', 'border demand intelligence', 'sponsored border pages'], searchableAcross120Countries: true,
  },
  {
    slug: 'equipment-supplier-installer', title: 'Equipment Supplier / Installer', emoji: '🧰', directoryCategoryKey: 'equipment_supplier', jobFamily: 'marketplace',
    aliases: ['pilot car equipment supplier', 'light bar installer', 'radio installer', 'height pole installer', 'vehicle upfitter'],
    description: 'Sells, installs, rents, or services pilot car and heavy haul support equipment such as signs, lights, radios, height poles, and vehicle upfit packages.',
    demandSignals: ['pilot car equipment', 'oversize load sign', 'height pole kit', 'amber light installer'],
    painPoints: ['state-specific equipment confusion', 'finding installers', 'fitment trust', 'starter bundle pricing'],
    credentials: ['installation experience', 'state equipment requirement knowledge', 'supplier warranty'],
    equipment: ['inventory', 'installation tools', 'vehicle fitment docs', 'shipping/fulfillment'],
    payModel: { primaryUnit: 'project', publicRange: '$200-$15,000+ depending on install, bundle, vehicle, and fleet size.', dataNotes: 'Track bundle price, install labor, margin, and state compliance category.' },
    automationScore: 76, automationClass: 'workflow_automatable',
    automationPlan: ['map equipment to role requirements', 'route buyers to installers', 'recommend starter bundles', 'sell sponsored fitment'],
    surfaces: { directory: '/directory?category=equipment_supplier', role: '/roles/equipment-supplier-installer', training: '/training', tools: ['/training','/directory'], corridors: '/corridors?need=equipment', dataProduct: '/labor-demand?role=equipment-supplier-installer' },
    monetizationProducts: ['marketplace margin', 'installer referral', 'sponsored equipment placement', 'starter kit bundles'], searchableAcross120Countries: true,
  },
  {
    slug: 'staging-yard-operator', title: 'Staging Yard / Oversize Parking Operator', emoji: '🅿️', directoryCategoryKey: 'truck_parking', jobFamily: 'infrastructure',
    aliases: ['staging yard', 'oversize parking', 'secure truck parking', 'heavy haul laydown yard'],
    description: 'Provides heavy-haul-friendly staging, parking, laydown, meet-up, and waiting-window space for oversized equipment and convoy support vehicles.',
    demandSignals: ['oversize load parking', 'heavy haul staging yard', 'secure truck parking heavy equipment'],
    painPoints: ['finding legal parking', 'turning radius', 'security', 'permit movement windows', 'last-minute staging'],
    credentials: ['property permission', 'commercial access rules', 'insurance/waiver workflow'],
    equipment: ['yard/lot', 'security lighting', 'gate/access', 'wide turning area'],
    payModel: { primaryUnit: 'day', publicRange: '$100-$1,000+/day or monthly contract depending on yard size and corridor demand.', dataNotes: 'Track surface type, security, turning radius, access hours, and corridor proximity.' },
    automationScore: 72, automationClass: 'workflow_automatable',
    automationPlan: ['property intake', 'availability calendar', 'route-based recommendations', 'staging demand heatmaps'],
    surfaces: { directory: '/directory?category=truck_parking', role: '/roles/staging-yard-operator', training: '/training', tools: ['/corridors','/directory'], corridors: '/corridors?surface=staging', dataProduct: '/labor-demand?role=staging-yard-operator' },
    monetizationProducts: ['booking fee', 'monthly listing', 'infrastructure sponsor package', 'corridor parking data'], searchableAcross120Countries: true,
  },
  {
    slug: 'police-escort-coordinator', title: 'Police / Traffic Authority Escort Coordinator', emoji: '🚓', directoryCategoryKey: 'police_convoi_exceptionnel', jobFamily: 'authority_coordination',
    aliases: ['police escort coordinator', 'traffic authority escort', 'law enforcement escort', 'gendarmerie coordination'],
    description: 'Coordinates mandatory law-enforcement or traffic authority support for high-risk, urban, restricted, or legally required oversize movements.',
    demandSignals: ['police escort oversize load', 'traffic authority escort', 'convoi exceptionnel police'],
    painPoints: ['agency scheduling', 'authority rules', 'price uncertainty', 'movement windows'],
    credentials: ['authorized agency role or approved coordinator status', 'jurisdiction rule knowledge'],
    equipment: ['official vehicle or agency workflow', 'radio', 'permit coordination'],
    payModel: { primaryUnit: 'hour', publicRange: 'Agency hourly or project rate; varies by jurisdiction and authority rules.', dataNotes: 'Do not present as private substitute for government authority; track requirement rules and estimated costs.' },
    automationScore: 46, automationClass: 'human_plus_software',
    automationPlan: ['identify when police/authority escort is required', 'route to approved contacts', 'store jurisdiction rules', 'notify brokers early'],
    surfaces: { directory: '/directory?category=police_convoi_exceptionnel', role: '/roles/police-escort-coordinator', training: '/training', tools: ['/regulations','/escort-requirements'], corridors: '/corridors?need=authority-escort', dataProduct: '/labor-demand?role=police-escort-coordinator' },
    monetizationProducts: ['requirement intelligence', 'compliance workflow', 'authority-contact routing where legal'], searchableAcross120Countries: true,
  }
];

export const roleDirectoryCategories = Array.from(new Map(roleIntelligenceRoles.map((role) => [role.directoryCategoryKey, role])).values()).map((role) => ({
  key: role.directoryCategoryKey,
  label: role.title,
  emoji: role.emoji,
  href: role.surfaces.directory,
  roleHref: role.surfaces.role,
  automationScore: role.automationScore,
}));

export const indeedDerivedIntelligenceRules = [
  'Store normalized and aggregated market intelligence, not copied job listings.',
  'Keep raw third-party descriptions out of public pages unless licensed or explicitly permitted.',
  'Hash or summarize source references when the data is only being used for trend detection.',
  'Separate salary, hourly, mileage, day-rate, per-permit, per-load, and commission economics.',
  'Require sample size and confidence scoring before selling a labor-demand data product.',
  'Use demand signals to create role pages, training pages, directory categories, tools, corridor pages, and sponsor inventory.',
];

export function getRoleBySlug(slug: string) {
  return roleIntelligenceRoles.find((role) => role.slug === slug);
}

export function getRolesByDirectoryCategory(categoryKey: string) {
  return roleIntelligenceRoles.filter((role) => role.directoryCategoryKey === categoryKey);
}

export function getAutomationBand(score: number) {
  if (score >= 80) return 'mostly automatable workflow';
  if (score >= 60) return 'strong software-assisted workflow';
  if (score >= 40) return 'human work with high-value automation around it';
  return 'physical/specialist human work with marketplace and trust automation';
}

export function getLaborDemandSummary() {
  const totalRoles = roleIntelligenceRoles.length;
  const avgAutomation = Math.round(roleIntelligenceRoles.reduce((sum, role) => sum + role.automationScore, 0) / totalRoles);
  return {
    totalRoles,
    countries: HC_120_COUNTRY_CODES.length,
    avgAutomation,
    automatableRoles: roleIntelligenceRoles.filter((role) => role.automationScore >= 60).length,
    physicalRoles: roleIntelligenceRoles.filter((role) => role.automationScore < 40).length,
    directoryCategories: roleDirectoryCategories.length,
  };
}
