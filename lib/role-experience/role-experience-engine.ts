export type RoleExperienceFamilyId =
  | 'operator'
  | 'broker_dispatcher'
  | 'support_partner'
  | 'route_intelligence'
  | 'adgrid_sponsor'
  | 'admin_command';

export type MobileRoleKey =
  | 'escort_operator'
  | 'broker_dispatcher'
  | 'both'
  | 'support_partner'
  | 'observer_researcher';

export type AppPageTemplateId =
  | 'role_home'
  | 'loads_jobs'
  | 'route_corridor'
  | 'support_coverage'
  | 'docs_proofs'
  | 'alerts_incidents'
  | 'marketplace_adgrid'
  | 'reports_analytics'
  | 'messaging_command'
  | 'profile_compliance'
  | 'admin_users'
  | 'country_region_rules'
  | 'saved_shortlists'
  | 'data_products';

export interface AppPageTemplate {
  id: AppPageTemplateId;
  label: string;
  purpose: string;
  routePattern: string;
  publicIndexable: boolean;
}

export interface RoleExperienceFamily {
  id: RoleExperienceFamilyId;
  label: string;
  productPosition: string;
  primaryWorkflow: string;
  defaultTemplates: AppPageTemplateId[];
  coreRoleExamples: string[];
  variantExamples: string[];
}

export const ROLE_EXPERIENCE_SCALE_TARGET = {
  roleFamilies: 6,
  coreRoleDefinitions: 131,
  roleVariantDefinitions: 426,
  countryPacks: 120,
  appPageTemplatesMin: 10,
  appPageTemplatesMax: 18,
} as const;

export const MOBILE_APP_PAGE_TEMPLATES: Record<AppPageTemplateId, AppPageTemplate> = {
  role_home: {
    id: 'role_home',
    label: 'Role Home',
    purpose: 'Personalized command center for the current role, country, corridor, and urgency moment.',
    routePattern: '/home',
    publicIndexable: false,
  },
  loads_jobs: {
    id: 'loads_jobs',
    label: 'Loads / Jobs',
    purpose: 'Available, assigned, covered, completed, and stale work by role permission.',
    routePattern: '/loads',
    publicIndexable: false,
  },
  route_corridor: {
    id: 'route_corridor',
    label: 'Route / Corridor',
    purpose: 'Route planning, corridor risk, restrictions, permit friction, and support requirements.',
    routePattern: '/tools/route-iq',
    publicIndexable: true,
  },
  support_coverage: {
    id: 'support_coverage',
    label: 'Support / Coverage',
    purpose: 'Pilot cars, escorts, flaggers, permits, yards, gear, and local support coverage.',
    routePattern: '/directory',
    publicIndexable: true,
  },
  docs_proofs: {
    id: 'docs_proofs',
    label: 'Docs / Proofs',
    purpose: 'Permits, insurance, certificates, proof cards, POD, and compliance evidence.',
    routePattern: '/claim',
    publicIndexable: false,
  },
  alerts_incidents: {
    id: 'alerts_incidents',
    label: 'Alerts / Incidents',
    purpose: 'Weather, restrictions, enforcement, no-shows, delays, hazards, and rescue events.',
    routePattern: '/app/inbox',
    publicIndexable: false,
  },
  marketplace_adgrid: {
    id: 'marketplace_adgrid',
    label: 'Marketplace / AdGrid',
    purpose: 'Sponsored inventory, vendors, local offers, lead gen, and pain-moment placements.',
    routePattern: '/sponsor',
    publicIndexable: true,
  },
  reports_analytics: {
    id: 'reports_analytics',
    label: 'Reports / Analytics',
    purpose: 'Performance, risk, demand, revenue, source confidence, and market maturity.',
    routePattern: '/leaderboards',
    publicIndexable: true,
  },
  messaging_command: {
    id: 'messaging_command',
    label: 'Messaging / Command',
    purpose: 'Dispatch, broker, support, admin, and field communication with audit context.',
    routePattern: '/app/inbox',
    publicIndexable: false,
  },
  profile_compliance: {
    id: 'profile_compliance',
    label: 'Profile / Compliance',
    purpose: 'Licenses, regions, equipment, credentials, service areas, and profile ownership.',
    routePattern: '/claim',
    publicIndexable: false,
  },
  admin_users: {
    id: 'admin_users',
    label: 'Admin / Users',
    purpose: 'Approvals, queues, permissions, RLS-sensitive review, and system health.',
    routePattern: '/admin',
    publicIndexable: false,
  },
  country_region_rules: {
    id: 'country_region_rules',
    label: 'Country / Region Rules',
    purpose: 'Local law, documentation, units, language, source confidence, and operating requirements.',
    routePattern: '/escort-requirements',
    publicIndexable: true,
  },
  saved_shortlists: {
    id: 'saved_shortlists',
    label: 'Saved Shortlists',
    purpose: 'Saved providers, corridors, searches, lanes, and reusable move stacks.',
    routePattern: '/directory',
    publicIndexable: false,
  },
  data_products: {
    id: 'data_products',
    label: 'Data Products',
    purpose: 'Aggregated market intelligence, reports, samples, confidence, and buyer paths.',
    routePattern: '/data',
    publicIndexable: true,
  },
};

export const ROLE_EXPERIENCE_FAMILIES: Record<RoleExperienceFamilyId, RoleExperienceFamily> = {
  operator: {
    id: 'operator',
    label: 'Operator',
    productPosition: 'Field-ready operator command layer',
    primaryWorkflow: 'get found -> prove readiness -> find better work -> protect payment -> build rank',
    defaultTemplates: [
      'role_home',
      'loads_jobs',
      'route_corridor',
      'docs_proofs',
      'alerts_incidents',
      'profile_compliance',
      'country_region_rules',
    ],
    coreRoleExamples: ['heavy haul driver', 'pilot car operator', 'escort driver', 'owner operator'],
    variantExamples: ['high pole operator', 'lead car', 'chase car', 'superload escort', 'wind blade trailer operator'],
  },
  broker_dispatcher: {
    id: 'broker_dispatcher',
    label: 'Broker / Dispatcher',
    productPosition: 'Coverage and dispatch command layer',
    primaryWorkflow: 'post need -> verify fit -> broadcast -> track response -> fill lane -> reuse stack',
    defaultTemplates: [
      'role_home',
      'loads_jobs',
      'support_coverage',
      'route_corridor',
      'saved_shortlists',
      'messaging_command',
      'reports_analytics',
    ],
    coreRoleExamples: ['broker', 'dispatcher', 'freight forwarder', 'load coordinator'],
    variantExamples: ['superload coordinator', 'project cargo dispatcher', 'urgent coverage coordinator'],
  },
  support_partner: {
    id: 'support_partner',
    label: 'Support Partner',
    productPosition: 'Physical support and service-area visibility layer',
    primaryWorkflow: 'list location -> prove access -> receive requests -> monetize corridor',
    defaultTemplates: [
      'role_home',
      'support_coverage',
      'profile_compliance',
      'marketplace_adgrid',
      'route_corridor',
      'reports_analytics',
    ],
    coreRoleExamples: ['yard operator', 'permit runner', 'mechanic', 'fuel partner', 'safety trainer'],
    variantExamples: ['staging yard', 'escort upfitter', 'tire service', 'flagging instructor', 'route survey provider'],
  },
  route_intelligence: {
    id: 'route_intelligence',
    label: 'Route Intelligence',
    productPosition: 'Source-backed route, rule, and risk intelligence layer',
    primaryWorkflow: 'define move -> check rules -> inspect corridor risk -> recommend support roles',
    defaultTemplates: [
      'role_home',
      'route_corridor',
      'country_region_rules',
      'reports_analytics',
      'data_products',
      'support_coverage',
    ],
    coreRoleExamples: ['permit analyst', 'route planner', 'risk analyst', 'infrastructure reviewer'],
    variantExamples: ['bridge clearance analyst', 'border crossing specialist', 'port operations analyst'],
  },
  adgrid_sponsor: {
    id: 'adgrid_sponsor',
    label: 'AdGrid Sponsor',
    productPosition: 'Self-serve sponsor and buyer-intent placement layer',
    primaryWorkflow: 'select audience moment -> choose geography -> preview placement -> sponsor truthful inventory',
    defaultTemplates: [
      'role_home',
      'marketplace_adgrid',
      'reports_analytics',
      'data_products',
      'support_coverage',
    ],
    coreRoleExamples: ['supplier', 'installer', 'equipment vendor', 'insurance partner'],
    variantExamples: ['tarp supplier', 'beacon dealer', 'escort vehicle outfitter', 'route survey software sponsor'],
  },
  admin_command: {
    id: 'admin_command',
    label: 'Admin / Command',
    productPosition: 'Private operations, moderation, authority, and system-health layer',
    primaryWorkflow: 'review queue -> verify public/private fields -> assign work -> audit changes',
    defaultTemplates: [
      'role_home',
      'admin_users',
      'reports_analytics',
      'support_coverage',
      'data_products',
      'messaging_command',
    ],
    coreRoleExamples: ['admin reviewer', 'verification analyst', 'market manager', 'system operator'],
    variantExamples: ['claim queue reviewer', 'SEO page health admin', 'country maturity reviewer'],
  },
};

export const MOBILE_ROLE_TO_EXPERIENCE_FAMILY: Record<MobileRoleKey, RoleExperienceFamilyId> = {
  escort_operator: 'operator',
  broker_dispatcher: 'broker_dispatcher',
  both: 'operator',
  support_partner: 'support_partner',
  observer_researcher: 'route_intelligence',
};

export function getMobileRoleExperienceFamily(role: MobileRoleKey): RoleExperienceFamily {
  return ROLE_EXPERIENCE_FAMILIES[MOBILE_ROLE_TO_EXPERIENCE_FAMILY[role]];
}

export function getMobileRoleTemplates(role: MobileRoleKey, limit?: number): AppPageTemplate[] {
  const familyIds: RoleExperienceFamilyId[] =
    role === 'both'
      ? ['operator', 'broker_dispatcher']
      : [MOBILE_ROLE_TO_EXPERIENCE_FAMILY[role]];

  const ids = new Set<AppPageTemplateId>();
  for (const familyId of familyIds) {
    for (const templateId of ROLE_EXPERIENCE_FAMILIES[familyId].defaultTemplates) {
      ids.add(templateId);
    }
  }

  const templates = Array.from(ids).map((id) => MOBILE_APP_PAGE_TEMPLATES[id]);
  return typeof limit === 'number' ? templates.slice(0, limit) : templates;
}

export function getRoleExperienceFamilyForRoleKey(roleKey: string): RoleExperienceFamily {
  const normalized = roleKey.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  if (/(broker|dispatcher|shipper|load_source|forwarder)/.test(normalized)) {
    return ROLE_EXPERIENCE_FAMILIES.broker_dispatcher;
  }
  if (/(sponsor|supplier|vendor|dealer|installer|insurance)/.test(normalized)) {
    return ROLE_EXPERIENCE_FAMILIES.adgrid_sponsor;
  }
  if (/(route|permit|risk|clearance|bridge|border|port|analyst|intelligence)/.test(normalized)) {
    return ROLE_EXPERIENCE_FAMILIES.route_intelligence;
  }
  if (/(yard|mechanic|fuel|flagger|rigger|support|service|upfitter)/.test(normalized)) {
    return ROLE_EXPERIENCE_FAMILIES.support_partner;
  }
  if (/(admin|reviewer|moderator|verification|system_operator)/.test(normalized)) {
    return ROLE_EXPERIENCE_FAMILIES.admin_command;
  }

  return ROLE_EXPERIENCE_FAMILIES.operator;
}
