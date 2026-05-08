export type IntentSurfaceKey =
  | 'homepage_search'
  | 'directory_results'
  | 'profile_claim'
  | 'role_pages'
  | 'public_tools'
  | 'glossary'
  | 'community'
  | 'adgrid'
  | 'map_corridors'
  | 'developer_api';

export type IntentStage = 'discover' | 'plan' | 'verify' | 'match' | 'transact' | 'retain';

export interface IntentOperatingSurface {
  key: IntentSurfaceKey;
  surface: string;
  userIntent: string;
  primaryRoleFamilies: string[];
  stage: IntentStage;
  nextActions: [string, string, string];
  stickyLoop: string;
  socialLoop: string;
  monetizationPath: string;
  aeoSurface: string;
  evidenceRequired: string[];
  guardrails: string[];
}

export interface IntentSurfaceScore {
  key: IntentSurfaceKey;
  score: number;
  missing: string[];
  nextFix: string;
}

export const INTENT_OPERATING_SURFACES: IntentOperatingSurface[] = [
  {
    key: 'homepage_search',
    surface: '/',
    userIntent: 'Find the right heavy-haul support role, place, answer, or next workflow quickly.',
    primaryRoleFamilies: ['buyers', 'operators', 'brokers', 'suppliers', 'authorities'],
    stage: 'discover',
    nextActions: ['Search coverage', 'Ask a heavy-haul question', 'Start a move plan'],
    stickyLoop: 'Saved searches and trip packets turn anonymous search into repeat workflow.',
    socialLoop: 'High-intent questions can become moderated Q&A and glossary improvements.',
    monetizationPath: 'Routes to claims, job posts, sponsored provider cards, and tools.',
    aeoSurface: 'Direct answer block plus voice/near-me query expansion.',
    evidenceRequired: ['query', 'role_hint', 'country_hint', 'clicked_next_action', 'zero_result'],
    guardrails: ['No fake-live country claims', 'No more than three primary next actions'],
  },
  {
    key: 'directory_results',
    surface: '/directory',
    userIntent: 'Compare providers by role, geography, trust, availability, and fit.',
    primaryRoleFamilies: ['buyers', 'operators', 'brokers', 'service providers'],
    stage: 'match',
    nextActions: ['Call or quote', 'Save provider', 'Compare report cards'],
    stickyLoop: 'Saved providers, watched markets, and report cards create return behavior.',
    socialLoop: 'Reviews, endorsements, follows, and corridor posts attach proof to profiles.',
    monetizationPath: 'Claim upgrades, Fast Lane, sponsored cards, corridor priority, qualified leads.',
    aeoSurface: 'LocalBusiness/Service/ItemList schema with role/city/country answer summaries.',
    evidenceRequired: ['role_match', 'geo_match', 'claim_status', 'trust_score', 'availability_signal'],
    guardrails: ['Sponsored cannot hide trust rank', 'Do not mark verified without evidence'],
  },
  {
    key: 'profile_claim',
    surface: '/claim',
    userIntent: 'Take ownership of a profile and activate the path to work.',
    primaryRoleFamilies: ['operators', 'brokers', 'carriers', 'suppliers', 'training providers'],
    stage: 'verify',
    nextActions: ['Claim free', 'Confirm service area', 'Turn on job alerts'],
    stickyLoop: 'Profile proof, alerts, readiness score, and missed-demand packets bring users back.',
    socialLoop: 'Claimed profiles can receive reviews, endorsements, follows, and role-specific posts.',
    monetizationPath: 'Road Ready to Fast Lane to Priority Lane after proof and activation triggers.',
    aeoSurface: 'Claimable profile snippets, report-card previews, and safe unclaimed-profile copy.',
    evidenceRequired: ['ownership_method', 'role_confirmed', 'service_area', 'proof_items', 'consent_basis'],
    guardrails: ['No SMS claim outreach', 'No fake urgency', 'Paid offer after free claim value'],
  },
  {
    key: 'role_pages',
    surface: '/roles',
    userIntent: 'Understand what this role does, what it needs, and how it gets work in a country.',
    primaryRoleFamilies: ['all 169+ roles'],
    stage: 'plan',
    nextActions: ['See requirements', 'Find matching work', 'Claim or create profile'],
    stickyLoop: 'Role readiness checklists and job paths create identity and progress loops.',
    socialLoop: 'Role-specific posts, Q&A, training proof, and leaderboards attach community to role intent.',
    monetizationPath: 'Role hub sponsorships, training, equipment, profile upgrades, job routing.',
    aeoSurface: 'Role definition, country-local terms, FAQs, HowTo, and llms.txt-friendly summaries.',
    evidenceRequired: ['role_key', 'country_code', 'local_term', 'requirements', 'job_path'],
    guardrails: ['No hardcoded US-only role behavior', 'Data-limited countries need fallback actions'],
  },
  {
    key: 'public_tools',
    surface: '/tools',
    userIntent: 'Get a fast answer and continue the job workflow without starting over.',
    primaryRoleFamilies: ['buyers', 'brokers', 'carriers', 'operators', 'permit services'],
    stage: 'plan',
    nextActions: ['Save result', 'Find help', 'Continue planning'],
    stickyLoop: 'Each tool output feeds a trip packet, saved search, or claim path.',
    socialLoop: 'Tool confusion and route questions create moderated Q&A, glossary, and corridor updates.',
    monetizationPath: 'Permit leads, provider matches, trip packet exports, AdGrid journey slots.',
    aeoSurface: 'Calculator answer blocks, FAQ schema, and structured tool outputs.',
    evidenceRequired: ['tool_key', 'inputs', 'result_summary', 'risk_warning', 'next_action_clicked'],
    guardrails: ['No dead-end tool result', 'Do not present estimates as permit authority rulings'],
  },
  {
    key: 'glossary',
    surface: '/glossary',
    userIntent: 'Decode heavy-haul language, local terms, acronyms, and role-specific requirements.',
    primaryRoleFamilies: ['new operators', 'buyers', 'brokers', 'AI agents', 'authorities'],
    stage: 'discover',
    nextActions: ['See local meaning', 'Open related tool', 'Find providers'],
    stickyLoop: 'Autolinks, country equivalents, and related workflows make glossary pages entry points.',
    socialLoop: 'Users can suggest corrections, examples, and country variants for moderation.',
    monetizationPath: 'Training, tools, provider matching, sponsor-safe glossary clusters.',
    aeoSurface: 'DefinedTerm, FAQ, country equivalent tables, and direct answer snippets.',
    evidenceRequired: ['term', 'country_variant', 'related_roles', 'source_confidence', 'internal_links'],
    guardrails: ['Avoid thin definitions', 'Separate official rules from industry usage'],
  },
  {
    key: 'community',
    surface: '/community',
    userIntent: 'Ask, answer, prove expertise, and find people around a role, corridor, or problem.',
    primaryRoleFamilies: ['operators', 'brokers', 'training providers', 'authorities', 'suppliers'],
    stage: 'retain',
    nextActions: ['Post question', 'Follow provider', 'Attach to corridor'],
    stickyLoop: 'Replies, follows, badges, leaderboards, and watched corridors create social gravity.',
    socialLoop: 'Every post attaches to at least one object: role, country, corridor, profile, tool, or term.',
    monetizationPath: 'Sponsored Q&A, training, provider leads, AdGrid conversation slots, data signals.',
    aeoSurface: 'Moderated Q&A snippets and object-linked discussion summaries.',
    evidenceRequired: ['object_link', 'role_context', 'country_context', 'moderation_status', 'helpful_votes'],
    guardrails: ['Moderate safety/legal claims', 'No sponsor control over factual answers'],
  },
  {
    key: 'adgrid',
    surface: '/adgrid',
    userIntent: 'Buy intent, not banners: reach a role at the moment they need a service.',
    primaryRoleFamilies: ['advertisers', 'sponsors', 'suppliers', 'providers', 'market owners'],
    stage: 'transact',
    nextActions: ['Choose goal', 'Pick market', 'Launch proof-safe placement'],
    stickyLoop: 'ROI reports, rules, creative bank, and budget optimizer create advertiser retention.',
    socialLoop: 'Sponsored content can attach to Q&A, training, report-card environments, and community surfaces.',
    monetizationPath: 'Sponsored cards, corridors, emergency slots, training, inventory, data reports.',
    aeoSurface: 'Advertiser API/docs and market-native ad playbooks.',
    evidenceRequired: ['conversion_event', 'surface', 'role_target', 'market_target', 'spend_ledger'],
    guardrails: ['Sponsored label required', 'Paid placement cannot override visible trust logic'],
  },
  {
    key: 'map_corridors',
    surface: '/map',
    userIntent: 'Understand route, corridor, restriction, support, and provider context spatially.',
    primaryRoleFamilies: ['carriers', 'brokers', 'operators', 'infrastructure', 'authorities'],
    stage: 'execute',
    nextActions: ['Check route risk', 'Find support nearby', 'Save corridor'],
    stickyLoop: 'Watched corridors, route packets, live hazards, and route support make the map habitual.',
    socialLoop: 'Crowd reports and corridor alerts feed social proof and trust signals.',
    monetizationPath: 'Sponsored map pins, corridor sponsorships, route support leads, data products.',
    aeoSurface: 'Corridor summaries, route-risk answer blocks, and map-pack local modules.',
    evidenceRequired: ['origin', 'destination', 'corridor', 'risk_signal', 'support_need'],
    guardrails: ['Do not imply official routing approval', 'Use authority links where available'],
  },
  {
    key: 'developer_api',
    surface: '/developers',
    userIntent: 'Use Haul Command trust, role, country, and market data inside another system.',
    primaryRoleFamilies: ['data buyers', 'insurers', 'enterprise carriers', 'authorities', 'partners'],
    stage: 'transact',
    nextActions: ['Choose API tier', 'Create key', 'Run verification'],
    stickyLoop: 'API keys, usage dashboards, and country health reports create technical lock-in.',
    socialLoop: 'Partner submissions and corrections improve public authority/trust surfaces.',
    monetizationPath: 'Trust API, insurer feeds, market reports, compliance data, partner integrations.',
    aeoSurface: 'API docs, OpenAPI, examples, llms.txt, and machine-readable endpoints.',
    evidenceRequired: ['api_key', 'product_tier', 'usage_event', 'customer_type', 'privacy_class'],
    guardrails: ['No raw private trip packets', 'Use aggregated or permissioned data products'],
  },
];

export function scoreIntentSurface(surface: IntentOperatingSurface): IntentSurfaceScore {
  const missing: string[] = [];

  if (surface.nextActions.length !== 3) missing.push('Exactly three primary next actions required.');
  if (surface.primaryRoleFamilies.length < 1) missing.push('Needs role-family coverage.');
  if (surface.evidenceRequired.length < 4) missing.push('Needs enough evidence signals to measure intent.');
  if (surface.guardrails.length < 2) missing.push('Needs at least two trust/compliance guardrails.');
  if (!surface.stickyLoop) missing.push('Needs a sticky loop.');
  if (!surface.socialLoop) missing.push('Needs a social loop.');
  if (!surface.monetizationPath) missing.push('Needs a monetization path.');
  if (!surface.aeoSurface) missing.push('Needs an AEO surface.');

  const score = Math.max(0, 100 - missing.length * 14);

  return {
    key: surface.key,
    score,
    missing,
    nextFix: missing.length
      ? missing[0]
      : `Instrument ${surface.key} so every visit records intent, next action, social object, and monetization context.`,
  };
}

export function getIntentOperatingDashboard() {
  const scores = INTENT_OPERATING_SURFACES.map(scoreIntentSurface);
  const averageScore = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);

  return {
    total: INTENT_OPERATING_SURFACES.length,
    averageScore,
    complete: scores.filter((score) => score.missing.length === 0).length,
    socialReady: INTENT_OPERATING_SURFACES.filter((surface) => surface.socialLoop.length > 0).length,
    monetizationReady: INTENT_OPERATING_SURFACES.filter((surface) => surface.monetizationPath.length > 0).length,
    scores,
  };
}
