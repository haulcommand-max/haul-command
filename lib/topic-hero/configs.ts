import { getTopicVisualOntology } from "./ontology";
import { classifyTopicHeroRoute } from "./route-classifier";
import type {
  TopicHeroAdSlot,
  TopicHeroConfig,
  TopicHeroCta,
  TopicHeroLink,
  TopicHeroPageFamily,
  TopicHeroStat,
  TopicHeroTier,
} from "./types";

const MASTER_BACKGROUND = "/backgrounds/master-background.png";

const familyBackground: Record<TopicHeroPageFamily, string> = {
  homepage: MASTER_BACKGROUND,
  tools: MASTER_BACKGROUND,
  "tool-detail": MASTER_BACKGROUND,
  glossary: MASTER_BACKGROUND,
  "glossary-term": MASTER_BACKGROUND,
  regulations: MASTER_BACKGROUND,
  "regulation-detail": MASTER_BACKGROUND,
  training: MASTER_BACKGROUND,
  "training-detail": MASTER_BACKGROUND,
  directory: MASTER_BACKGROUND,
  "directory-category": MASTER_BACKGROUND,
  profile: MASTER_BACKGROUND,
  "route-intel": MASTER_BACKGROUND,
  corridor: MASTER_BACKGROUND,
  "market-data": MASTER_BACKGROUND,
  "load-board": MASTER_BACKGROUND,
  "load-detail": MASTER_BACKGROUND,
  country: MASTER_BACKGROUND,
  region: MASTER_BACKGROUND,
  city: MASTER_BACKGROUND,
  role: MASTER_BACKGROUND,
  service: MASTER_BACKGROUND,
  sponsor: MASTER_BACKGROUND,
  claim: MASTER_BACKGROUND,
  pricing: MASTER_BACKGROUND,
  dashboard: MASTER_BACKGROUND,
  admin: MASTER_BACKGROUND,
  auth: MASTER_BACKGROUND,
  utility: MASTER_BACKGROUND,
};

const defaultCtas: Record<TopicHeroPageFamily, TopicHeroCta> = {
  homepage: { label: "Find your next action", href: "/directory", intent: "find_next_action", style: "primary" },
  tools: { label: "Open HaulSuggest", href: "/tools/haulsuggest", intent: "open_tool", style: "primary" },
  "tool-detail": { label: "Run this tool", href: "#tool", intent: "run_tool", style: "primary" },
  glossary: { label: "Search a term", href: "#topic-hero-search", intent: "search_term", style: "primary" },
  "glossary-term": { label: "View related tools", href: "#related-tools", intent: "view_related_tools", style: "primary" },
  regulations: { label: "Check a rule", href: "#topic-hero-search", intent: "check_rule", style: "primary" },
  "regulation-detail": { label: "Check related calculator", href: "/tools/escort-count-calculator", intent: "open_calculator", style: "primary" },
  training: { label: "Choose certification path", href: "#catalog", intent: "view_training", style: "primary" },
  "training-detail": { label: "Start this program", href: "#enroll", intent: "start_training", style: "primary" },
  directory: { label: "Find support", href: "#directory-results", intent: "find_provider", style: "primary" },
  "directory-category": { label: "Search this category", href: "#directory-results", intent: "find_provider", style: "primary" },
  profile: { label: "Claim or verify", href: "/claim", intent: "claim_profile", style: "primary" },
  "route-intel": { label: "Start route check", href: "/tools/route-iq", intent: "check_route", style: "primary" },
  corridor: { label: "Check corridor support", href: "/directory", intent: "find_corridor_support", style: "primary" },
  "market-data": { label: "View data products", href: "/data-products", intent: "view_data_products", style: "primary" },
  "load-board": { label: "Post a load", href: "/load-board/post", intent: "post_load", style: "primary" },
  "load-detail": { label: "Match support", href: "/directory", intent: "match_support", style: "primary" },
  country: { label: "Search this market", href: "/directory", intent: "search_country", style: "primary" },
  region: { label: "Search this region", href: "/directory", intent: "search_region", style: "primary" },
  city: { label: "Find local support", href: "/directory", intent: "near_me", style: "primary" },
  role: { label: "Start role path", href: "/onboarding", intent: "role_activation", style: "primary" },
  service: { label: "Find service providers", href: "/directory", intent: "find_service", style: "primary" },
  sponsor: { label: "Buy AdGrid visibility", href: "/advertise/buy", intent: "sponsor_intent", style: "primary" },
  claim: { label: "Claim profile", href: "/claim", intent: "claim_profile", style: "primary" },
  pricing: { label: "Compare plans", href: "#plans", intent: "pricing_intent", style: "primary" },
  dashboard: { label: "Open command center", href: "/dashboard", intent: "dashboard_action", style: "primary" },
  admin: { label: "Review system status", href: "/admin", intent: "admin_action", style: "primary" },
  auth: { label: "Continue", href: "/login", intent: "auth_continue", style: "primary" },
  utility: { label: "Continue", href: "/", intent: "utility_continue", style: "primary" },
};

const houseAdIntent: Record<TopicHeroPageFamily, TopicHeroAdSlot["intent"]> = {
  homepage: "directory",
  tools: "tools",
  "tool-detail": "tools",
  glossary: "glossary",
  "glossary-term": "glossary",
  regulations: "permits",
  "regulation-detail": "permits",
  training: "training",
  "training-detail": "training",
  directory: "directory",
  "directory-category": "directory",
  profile: "claim",
  "route-intel": "corridor",
  corridor: "corridor",
  "market-data": "advertise",
  "load-board": "loads",
  "load-detail": "loads",
  country: "directory",
  region: "directory",
  city: "directory",
  role: "training",
  service: "directory",
  sponsor: "advertise",
  claim: "claim",
  pricing: "advertise",
  dashboard: "directory",
  admin: "advertise",
  auth: "claim",
  utility: "directory",
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function titleCase(input: string) {
  return input
    .replace(/\[[^\]]+\]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function topicFromRoute(route: string, pageFamily: TopicHeroPageFamily) {
  if (route === "/") return "Haul Command";
  const cleanSegments = route
    .split("/")
    .filter(Boolean)
    .filter((segment) => !segment.startsWith("("));
  const last = cleanSegments[cleanSegments.length - 1] ?? pageFamily;
  const title = titleCase(last) || titleCase(pageFamily);

  if (pageFamily === "country" || pageFamily === "region" || pageFamily === "city") return `${title} Heavy Haul`;
  if (pageFamily === "corridor" || pageFamily === "route-intel") return `${title} Route Intelligence`;
  if (pageFamily === "tool-detail") return `${title} Tool`;
  if (pageFamily === "glossary-term") return `${title} Definition`;
  if (pageFamily === "regulation-detail") return `${title} Regulations`;
  if (pageFamily === "training-detail") return `${title} Training`;
  if (pageFamily === "load-detail") return `${title} Load Support`;
  if (pageFamily === "profile") return `${title} Trust Profile`;
  return `${title} ${titleCase(pageFamily)}`.replace(/\s+/g, " ").trim();
}

function h1FromFamily(pageTopic: string, pageFamily: TopicHeroPageFamily) {
  if (pageFamily === "utility" || pageFamily === "auth" || pageFamily === "dashboard" || pageFamily === "admin") {
    return pageTopic;
  }
  return `${pageTopic}`;
}

function compactStats(stats: TopicHeroStat[]) {
  return stats.filter((stat) => {
    if (stat.value === 0 || stat.value === "0" || stat.value === "") return false;
    return true;
  });
}

function defaultQuickChips(pageFamily: TopicHeroPageFamily): TopicHeroLink[] {
  const map: Record<TopicHeroPageFamily, TopicHeroLink[]> = {
    homepage: [
      { label: "Pilot car", href: "/directory?category=pilot-car", intent: "role_intent" },
      { label: "Post a load", href: "/load-board/post", intent: "load_post_intent" },
      { label: "Check regulations", href: "/regulations", intent: "regulation_intent" },
    ],
    tools: [
      { label: "Escort count", href: "/tools/escort-count-calculator", intent: "tool_intent" },
      { label: "Permit cost", href: "/tools/permit-cost-calculator", intent: "tool_intent" },
      { label: "Route survey", href: "/tools/route-iq", intent: "tool_intent" },
    ],
    "tool-detail": [
      { label: "Related tools", href: "/tools", intent: "tool_intent" },
      { label: "Find providers", href: "/directory", intent: "provider_intent" },
      { label: "Check rules", href: "/regulations", intent: "regulation_intent" },
    ],
    glossary: [
      { label: "High pole", href: "/glossary/high-pole", intent: "glossary_intent" },
      { label: "Route survey", href: "/glossary/route-survey", intent: "glossary_intent" },
      { label: "OSOW", href: "/glossary/osow", intent: "glossary_intent" },
    ],
    "glossary-term": [
      { label: "Related rules", href: "/regulations", intent: "regulation_intent" },
      { label: "Related tools", href: "/tools", intent: "tool_intent" },
      { label: "Training paths", href: "/training", intent: "training_intent" },
    ],
    regulations: [
      { label: "Texas escort rules", href: "/regulations/us", intent: "regulation_intent" },
      { label: "Height threshold", href: "/tools/escort-count-calculator", intent: "tool_intent" },
      { label: "Permit authority", href: "/directory?category=permit-service", intent: "provider_intent" },
    ],
    "regulation-detail": [
      { label: "Find permit help", href: "/directory?category=permit-service", intent: "provider_intent" },
      { label: "Run calculator", href: "/tools/escort-count-calculator", intent: "tool_intent" },
      { label: "Submit correction", href: "/contact?intent=regulation-correction", intent: "correction_intent" },
    ],
    training: [
      { label: "Certification", href: "/training/pilot-car-operator-certification", intent: "training_intent" },
      { label: "Report card", href: "/training/report-card", intent: "proof_intent" },
      { label: "First-job path", href: "/training/first-job", intent: "training_intent" },
    ],
    "training-detail": [
      { label: "View catalog", href: "/training", intent: "training_intent" },
      { label: "Claim profile", href: "/claim", intent: "claim_intent" },
      { label: "Report card", href: "/report-card", intent: "proof_intent" },
    ],
    directory: [
      { label: "Pilot car", href: "/directory?category=pilot-car", intent: "provider_intent" },
      { label: "High pole", href: "/directory?category=height-pole", intent: "provider_intent" },
      { label: "Staging yard", href: "/directory?category=truck-parking", intent: "provider_intent" },
    ],
    "directory-category": [
      { label: "Near me", href: "/near-me", intent: "city_intent" },
      { label: "Claim listing", href: "/claim", intent: "claim_intent" },
      { label: "Sponsor gap", href: "/advertise", intent: "sponsor_intent" },
    ],
    profile: [
      { label: "Claim profile", href: "/claim", intent: "claim_intent" },
      { label: "View report card", href: "/report-card", intent: "proof_intent" },
      { label: "Contact support", href: "/contact", intent: "contact_intent" },
    ],
    "route-intel": [
      { label: "Clearance risk", href: "/tools/route-iq", intent: "route_intent" },
      { label: "Staging", href: "/directory?category=truck-parking", intent: "provider_intent" },
      { label: "Permit help", href: "/directory?category=permit-service", intent: "provider_intent" },
    ],
    corridor: [
      { label: "Find escorts", href: "/directory?category=escort", intent: "provider_intent" },
      { label: "Sponsor corridor", href: "/advertise?placement=corridor", intent: "sponsor_intent" },
      { label: "Check route", href: "/tools/route-iq", intent: "route_intent" },
    ],
    "market-data": [
      { label: "Shortage index", href: "/data-products", intent: "data_intent" },
      { label: "Sponsor pricing", href: "/advertise", intent: "sponsor_intent" },
      { label: "Corridor demand", href: "/corridors", intent: "corridor_intent" },
    ],
    "load-board": [
      { label: "Post a load", href: "/load-board/post", intent: "load_post_intent" },
      { label: "Find capacity", href: "/directory", intent: "provider_intent" },
      { label: "Boost load", href: "/pricing", intent: "pro_intent" },
    ],
    "load-detail": [
      { label: "Find support", href: "/directory", intent: "provider_intent" },
      { label: "Check route", href: "/tools/route-iq", intent: "route_intent" },
      { label: "Boost visibility", href: "/pricing", intent: "pro_intent" },
    ],
    country: [
      { label: "Local rules", href: "/regulations", intent: "regulation_intent" },
      { label: "Local providers", href: "/directory", intent: "provider_intent" },
      { label: "Training", href: "/training", intent: "training_intent" },
    ],
    region: [
      { label: "Near me", href: "/near-me", intent: "city_intent" },
      { label: "Regional rules", href: "/regulations", intent: "regulation_intent" },
      { label: "Support packet", href: "/load-board/post", intent: "load_post_intent" },
    ],
    city: [
      { label: "Pilot car near me", href: "/directory?category=pilot-car", intent: "provider_intent" },
      { label: "Suggest provider", href: "/claim", intent: "claim_intent" },
      { label: "Sponsor this gap", href: "/advertise", intent: "sponsor_intent" },
    ],
    role: [
      { label: "Tools", href: "/tools", intent: "tool_intent" },
      { label: "Training", href: "/training", intent: "training_intent" },
      { label: "Directory", href: "/directory", intent: "provider_intent" },
    ],
    service: [
      { label: "Find providers", href: "/directory", intent: "provider_intent" },
      { label: "Claim listing", href: "/claim", intent: "claim_intent" },
      { label: "Sponsor service", href: "/advertise", intent: "sponsor_intent" },
    ],
    sponsor: [
      { label: "Directory sponsor", href: "/advertise/buy?zone=directory_sponsor", intent: "sponsor_intent" },
      { label: "Tool sponsor", href: "/advertise/buy?zone=tools_hub", intent: "sponsor_intent" },
      { label: "Corridor sponsor", href: "/advertise?placement=corridor", intent: "sponsor_intent" },
    ],
    claim: [
      { label: "Find your profile", href: "/claim", intent: "claim_intent" },
      { label: "Add equipment", href: "/onboarding/claim", intent: "proof_intent" },
      { label: "Upgrade proof", href: "/pricing", intent: "pro_intent" },
    ],
    pricing: [
      { label: "Pro", href: "/pricing#pro", intent: "pro_intent" },
      { label: "Sponsors", href: "/advertise", intent: "sponsor_intent" },
      { label: "Data products", href: "/data-products", intent: "data_intent" },
    ],
    dashboard: [
      { label: "Profile", href: "/profile", intent: "profile_intent" },
      { label: "Loads", href: "/load-board", intent: "load_post_intent" },
      { label: "Directory", href: "/directory", intent: "provider_intent" },
    ],
    admin: [
      { label: "Sitemap health", href: "/admin/sitemap-health", intent: "admin_action" },
      { label: "Authority", href: "/admin/authority", intent: "admin_action" },
      { label: "Scoreboard", href: "/admin/scoreboard", intent: "admin_action" },
    ],
    auth: [
      { label: "Sign in", href: "/login", intent: "auth_intent" },
      { label: "Claim profile", href: "/claim", intent: "claim_intent" },
      { label: "Post load", href: "/load-board/post", intent: "load_post_intent" },
    ],
    utility: [
      { label: "Home", href: "/", intent: "utility_intent" },
      { label: "Directory", href: "/directory", intent: "provider_intent" },
      { label: "Help", href: "/contact", intent: "contact_intent" },
    ],
  };

  return map[pageFamily] ?? map.utility;
}

function defaultAskCopy(pageFamily: TopicHeroPageFamily) {
  const map: Record<TopicHeroPageFamily, { title: string; prompt: string; placeholder: string; search: string }> = {
    homepage: {
      title: "Not sure where to start?",
      prompt: "Ask Haul Command for the right provider, tool, rule, training path, or next action for your role and market.",
      placeholder: "Tell us the role, location, load, or problem...",
      search: "Search the heavy-haul operating system...",
    },
    tools: {
      title: "Not sure which tool you need?",
      prompt: "Ask which calculator, permit checker, rate estimator, route workflow, or support packet fits your move.",
      placeholder: "Example: I need high pole and permit help in Texas",
      search: "Search tools, calculators, permit helpers, rate estimators...",
    },
    "tool-detail": {
      title: "Need the next step after this result?",
      prompt: "Ask how this tool connects to requirements, providers, training, support packets, or sponsor inventory.",
      placeholder: "Example: What should I do after calculating escort count?",
      search: "Search related tools, rules, providers, and terms...",
    },
    glossary: {
      title: "Need a heavy-haul term explained?",
      prompt: "Ask for definitions, examples, related rules, tools, training, and provider types.",
      placeholder: "Example: What is a high pole?",
      search: "Search terms, acronyms, local language, and regulation concepts...",
    },
    "glossary-term": {
      title: "Need this term in the field context?",
      prompt: "Ask how the term affects rules, tools, training, providers, equipment, or buyer trust.",
      placeholder: "Example: When does this term matter on a move?",
      search: "Search related terms, rules, tools, and providers...",
    },
    regulations: {
      title: "Need to know what rule applies?",
      prompt: "Ask by country, state, province, load dimension, escort requirement, permit authority, or source confidence.",
      placeholder: "Example: Width threshold for pilot cars in Texas",
      search: "Search countries, thresholds, permit authorities, and local terms...",
    },
    "regulation-detail": {
      title: "Need help applying this rule?",
      prompt: "Ask what provider type, calculator, source path, or correction flow fits the jurisdiction.",
      placeholder: "Example: Who can verify this escort requirement?",
      search: "Search related thresholds, calculators, and providers...",
    },
    training: {
      title: "Not sure what to learn next?",
      prompt: "Ask which certification, badge, module, or career path improves your operator profile.",
      placeholder: "Example: What certification helps me get my first paid move?",
      search: "Search certifications, badges, modules, role paths...",
    },
    "training-detail": {
      title: "Need to know if this credential is worth it?",
      prompt: "Ask how this training affects rank, proof, role fit, country rules, and buyer trust.",
      placeholder: "Example: Does this badge help brokers trust me?",
      search: "Search training, badges, report-card paths...",
    },
    directory: {
      title: "Not sure who to hire?",
      prompt: "Tell Haul Command the load, location, route, and urgency. We will route you toward the right provider type.",
      placeholder: "Example: I need high pole support from Houston to Dallas",
      search: "Search role, provider type, location, proof state, service area...",
    },
    "directory-category": {
      title: "Need the right category of support?",
      prompt: "Ask which provider type, proof state, service radius, or claim path fits this support need.",
      placeholder: "Example: Do I need route survey or permit service?",
      search: "Search this provider category by location and proof state...",
    },
    profile: {
      title: "Need to know whether this profile is trustworthy?",
      prompt: "Ask what proof, service area, equipment, claim state, or next contact action matters before the move is urgent.",
      placeholder: "Example: What should I verify before I call?",
      search: "Search proof, equipment, service area, and claim state...",
    },
    "route-intel": {
      title: "Need help planning the route?",
      prompt: "Ask by origin, destination, dimensions, clearance, staging, escort needs, and permit checkpoints.",
      placeholder: "Example: What support do I need on I-10?",
      search: "Search route, clearance, staging, corridor, permit support...",
    },
    corridor: {
      title: "Need corridor support?",
      prompt: "Ask for escort count, permit support, route risk, staging, rates, and local provider categories.",
      placeholder: "Example: Find support on this corridor",
      search: "Search corridor support, rates, staging, and providers...",
    },
    "market-data": {
      title: "Need to understand demand?",
      prompt: "Ask which corridor, shortage, rate, sponsor slot, or data product matches the signal.",
      placeholder: "Example: Which corridor is short on escorts?",
      search: "Search corridor demand, shortage signals, rates, and reports...",
    },
    "load-board": {
      title: "Need to fill or post a move?",
      prompt: "Ask what support roles, proof states, route checks, or saved lanes fit the load.",
      placeholder: "Example: Need escort support for an urgent oversize move",
      search: "Search loads, origins, destinations, rates, and capacity...",
    },
    "load-detail": {
      title: "Need to route this load to the right support?",
      prompt: "Ask by urgency, dimensions, origin, destination, provider type, and route risk.",
      placeholder: "Example: What providers fit this load?",
      search: "Search matching providers, route tools, and support roles...",
    },
    country: {
      title: "Need local heavy-haul context?",
      prompt: "Ask by local terminology, country rules, providers, tools, training, market maturity, or correction path.",
      placeholder: "Example: What is pilot car called in this market?",
      search: "Search local rules, providers, tools, training, and terms...",
    },
    region: {
      title: "Need state or province support?",
      prompt: "Ask by region, local rule, service area, corridor, provider type, and urgency.",
      placeholder: "Example: Find high pole support in this region",
      search: "Search regional providers, rules, and corridors...",
    },
    city: {
      title: "Need local support near this city?",
      prompt: "Ask by provider type, route, urgency, service radius, and no-result fallback.",
      placeholder: "Example: Pilot car near this city",
      search: "Search local availability, near-me support, and providers...",
    },
    role: {
      title: "Need the right role path?",
      prompt: "Ask which tool, training, proof, money path, or risk guardrail fits this role.",
      placeholder: "Example: What should a new pilot car operator do next?",
      search: "Search role paths, tools, training, and directory actions...",
    },
    service: {
      title: "Need the right service provider?",
      prompt: "Ask by service type, location, proof requirement, urgency, and related rules.",
      placeholder: "Example: Who handles staging support near this route?",
      search: "Search services, providers, and support categories...",
    },
    sponsor: {
      title: "Need the right sponsor slot?",
      prompt: "Ask which page, country, corridor, tool, or provider category has the best buyer intent.",
      placeholder: "Example: Sponsor high-pole searches in Texas",
      search: "Search sponsor inventory, markets, and AdGrid placements...",
    },
    claim: {
      title: "Need to make your profile more trusted?",
      prompt: "Ask which proof, equipment, service area, documents, or badges improve buyer confidence.",
      placeholder: "Example: What should I add before brokers call?",
      search: "Search claim, proof, equipment, and profile actions...",
    },
    pricing: {
      title: "Need the right paid path?",
      prompt: "Ask which Pro, sponsor, data, or claim upgrade is closest to money.",
      placeholder: "Example: What should I upgrade first?",
      search: "Search plans, upgrades, sponsor slots, and data products...",
    },
    dashboard: {
      title: "Need the next account action?",
      prompt: "Ask what to do next based on role, profile status, loads, training, or alerts.",
      placeholder: "Example: What should I finish next?",
      search: "Search account actions, loads, profile, and training...",
    },
    admin: {
      title: "Need the next system action?",
      prompt: "Ask which queue, audit, route, or schema surface needs attention.",
      placeholder: "Example: What route coverage is missing?",
      search: "Search admin tools, queues, and audits...",
    },
    auth: {
      title: "Need account access?",
      prompt: "Sign in, claim a profile, post a load, or continue the route you started.",
      placeholder: "Example: I need to claim my profile",
      search: "Search account actions...",
    },
    utility: {
      title: "Need the next Haul Command action?",
      prompt: "Use the fastest path back to directory, tools, rules, claims, loads, or support.",
      placeholder: "Example: Find heavy-haul support",
      search: "Search Haul Command...",
    },
  };

  return map[pageFamily] ?? map.utility;
}

export function buildTopicHeroConfig(input: {
  pageFamily: TopicHeroPageFamily;
  pageTopic: string;
  routePattern: string;
  heroTier?: TopicHeroTier;
  h1?: string;
  eyebrow?: string;
  subheadline?: string;
  microcopy?: string;
  quickChips?: TopicHeroLink[];
  statCards?: TopicHeroStat[];
  trustBadges?: TopicHeroConfig["trustBadges"];
  proofStates?: TopicHeroConfig["proofStates"];
  primaryCTA?: TopicHeroCta;
  secondaryCTA?: TopicHeroCta;
  tertiaryCTA?: TopicHeroCta;
  relatedNextSteps?: TopicHeroLink[];
  internalLinks?: TopicHeroLink[];
  countryScope?: string;
  regionScope?: string;
  cityScope?: string;
  corridorScope?: string;
  roleScope?: string;
  sourceConfidence?: TopicHeroConfig["sourceConfidence"];
  schemaType?: TopicHeroConfig["schemaType"];
  searchAction?: string;
  searchPlaceholder?: string;
  askTitle?: string;
  askPrompt?: string;
  askPlaceholder?: string;
  imageSrc?: string;
  imageAlt?: string;
  canonicalSlug?: string;
  houseAdSlot?: TopicHeroAdSlot | false;
}): TopicHeroConfig {
  const ontology = getTopicVisualOntology(input.pageFamily);
  const ask = defaultAskCopy(input.pageFamily);
  const topicSlug = slugify(input.pageTopic || input.pageFamily);
  const heroTier = input.heroTier ?? "tier2";
  const primaryCTA = input.primaryCTA ?? defaultCtas[input.pageFamily] ?? defaultCtas.utility;
  const quickChips = input.quickChips?.length ? input.quickChips : defaultQuickChips(input.pageFamily);
  const relatedNextSteps =
    input.relatedNextSteps?.length
      ? input.relatedNextSteps
      : [
          primaryCTA,
          ...quickChips.slice(0, 3),
          { label: "Submit correction", href: "/contact?intent=correction", intent: "correction_intent" },
        ];
  const canonicalSlug = input.canonicalSlug ?? input.routePattern;
  const imageSrc = input.imageSrc ?? familyBackground[input.pageFamily] ?? familyBackground.utility;
  const imageAlt =
    input.imageAlt ??
    `Haul Command ${input.pageTopic} topic hero for ${ontology.metadataLanguage.slice(0, 3).join(", ")}`;

  return {
    pageFamily: input.pageFamily,
    pageTopic: input.pageTopic,
    routePattern: input.routePattern,
    heroTier,
    h1: input.h1 ?? input.pageTopic,
    eyebrow: input.eyebrow,
    subheadline:
      input.subheadline ??
      `A Haul Command ${input.pageFamily.replace(/-/g, " ")} surface with topic-specific search, proof, links, and next actions.`,
    microcopy: input.microcopy,
    heroVisualPreset: ontology.visualPreset,
    animationPreset: ontology.animationPreset,
    searchMode: heroTier === "tier4" ? "action-only" : "dual",
    searchScope: input.pageFamily,
    searchAction: input.searchAction ?? "/search",
    searchParamName: "q",
    searchPlaceholder: input.searchPlaceholder ?? ask.search,
    secondarySearchPlaceholder: ask.placeholder,
    askTitle: input.askTitle ?? ask.title,
    askPrompt: input.askPrompt ?? ask.prompt,
    askPlaceholder: input.askPlaceholder ?? ask.placeholder,
    quickChips,
    rotatingLeftPills: ontology.visualObjects.slice(0, 4),
    rotatingRightPills: ontology.metadataLanguage.slice(0, 4),
    primaryCTA,
    secondaryCTA: input.secondaryCTA,
    tertiaryCTA: input.tertiaryCTA,
    trustBadges: input.trustBadges ?? [{ label: "Topic-specific", value: "Hero engine", tone: "gold" }],
    proofStates: input.proofStates,
    statCards: compactStats(input.statCards ?? []),
    houseAdSlot:
      input.houseAdSlot === false
        ? undefined
        : input.houseAdSlot ?? {
            surface: `topic-hero.${input.pageFamily}`,
            placementId: `topic-hero-${topicSlug || input.pageFamily}`,
            intent: houseAdIntent[input.pageFamily] ?? "directory",
            variant: heroTier === "tier1" ? "card" : "compact",
          },
    internalLinks: input.internalLinks?.length ? input.internalLinks : quickChips,
    relatedNextSteps,
    countryScope: input.countryScope,
    regionScope: input.regionScope,
    cityScope: input.cityScope,
    corridorScope: input.corridorScope,
    roleScope: input.roleScope,
    schemaType: input.schemaType ?? ["WebPage", "BreadcrumbList"],
    ogImageTemplate: `haul-command-${topicSlug}-${input.pageFamily}-og.webp`,
    imageAltTemplate: imageAlt,
    image: {
      filename: `haul-command-${topicSlug}-${input.pageFamily}-hero.webp`,
      src: imageSrc,
      alt: imageAlt,
      width: 1600,
      height: 900,
      ogImage: imageSrc,
      twitterImage: imageSrc,
      preload: heroTier === "tier1",
    },
    canonicalSlug,
    noResultFallback: {
      headline: `No perfect ${input.pageFamily.replace(/-/g, " ")} match yet? Turn it into a Haul Command demand signal.`,
      actions: [
        { label: "Request support", href: "/contact?intent=request-support", intent: "request_support" },
        { label: "Add missing provider", href: "/claim?intent=missing-provider", intent: "claim_intent" },
        { label: "Sponsor this gap", href: "/advertise?intent=gap-sponsor", intent: "sponsor_intent" },
      ],
    },
    mobileBehavior: heroTier === "tier1" ? "stacked" : "compact",
    prefersReducedMotionBehavior: "pause",
    sourceConfidence: input.sourceConfidence ?? "developing",
  };
}

export function buildTopicHeroConfigForRoute(route: string): TopicHeroConfig {
  const coverage = classifyTopicHeroRoute(route);
  const pageTopic = topicFromRoute(coverage.route, coverage.pageFamily);

  return buildTopicHeroConfig({
    pageFamily: coverage.pageFamily,
    pageTopic,
    routePattern: coverage.route,
    heroTier: coverage.heroTier,
    h1: h1FromFamily(pageTopic, coverage.pageFamily),
    eyebrow: coverage.heroTier === "tier4" ? "Haul Command context" : undefined,
    subheadline:
      coverage.heroTier === "tier4"
        ? "A compact Haul Command context layer with the next action, trusted navigation, and no dead end."
        : `A ${coverage.pageFamily.replace(/-/g, " ")} page with topic-specific search, Ask Haul Command guidance, internal links, proof signals, and a next action.`,
    statCards:
      coverage.heroTier === "tier4"
        ? []
        : [
            { value: "Scoped", label: "Search intent" },
            { value: "Linked", label: "Internal graph" },
            { value: "Active", label: "Next action" },
          ],
    trustBadges:
      coverage.heroTier === "tier4"
        ? [{ label: "Context hero", value: "Compact", tone: "slate" }]
        : [
            { label: "Topic-specific", value: "Covered", tone: "gold" },
            { label: "No-dead-end", value: "Enabled", tone: "green" },
          ],
    sourceConfidence: coverage.metadataStatus === "specific" ? "source-backed" : "developing",
  });
}

export const TOPIC_HERO_PRESETS = {
  toolsHub: buildTopicHeroConfig({
    pageFamily: "tools",
    pageTopic: "Heavy Haul Tools",
    routePattern: "/tools",
    heroTier: "tier1",
    h1: "Free Heavy Haul Tools for Pilot Cars, Permits, Rates, and Route Support",
    eyebrow: "Calculators, route checks, permit math, and support workflows",
    subheadline:
      "Search calculators, permit helpers, route workflows, rate estimators, and move-support packets built for heavy-haul decisions.",
    microcopy: "Check escort, permit, route, and support needs before quoting.",
    primaryCTA: { label: "Open HaulSuggest", href: "/tools/haulsuggest", intent: "tool_intent", style: "primary" },
    secondaryCTA: { label: "Find support after calculating", href: "/directory", intent: "provider_intent", style: "secondary" },
    tertiaryCTA: { label: "Sponsor tool intent", href: "/advertise/buy?zone=tools_hub", intent: "sponsor_intent", style: "ghost" },
    statCards: [
      { value: 566, label: "Tool assets indexed" },
      { value: 13, label: "Tool families" },
      { value: 120, label: "Country framework" },
    ],
    trustBadges: [
      { label: "Search metadata", value: "Live", tone: "green" },
      { label: "No-dead-end", value: "Enabled", tone: "gold" },
      { label: "AdGrid", value: "Sponsor-ready", tone: "blue" },
    ],
    schemaType: ["SoftwareApplication", "WebApplication", "ItemList", "BreadcrumbList"],
  }),
  glossaryHub: buildTopicHeroConfig({
    pageFamily: "glossary",
    pageTopic: "Heavy Haul Glossary",
    routePattern: "/glossary",
    heroTier: "tier1",
    h1: "Heavy Haul Terms, Local Language, and Field Definitions",
    eyebrow: "Dictionary, semantic clusters, regulation language, and role terms",
    subheadline:
      "Search terms, acronyms, examples, local terminology, related rules, tools, training paths, and provider types.",
    microcopy: "Understand the field before the rule, route, or buyer conversation gets expensive.",
    primaryCTA: { label: "Search a term", href: "#topic-hero-search", intent: "glossary_intent", style: "primary" },
    secondaryCTA: { label: "Check related regulations", href: "/regulations", intent: "regulation_intent", style: "secondary" },
    tertiaryCTA: { label: "Sponsor glossary intent", href: "/advertise?placement=glossary", intent: "sponsor_intent", style: "ghost" },
    statCards: [
      { value: "5,000+", label: "Term framework" },
      { value: 120, label: "Jurisdictions" },
      { value: "Role + rule", label: "Linked" },
    ],
    trustBadges: [
      { label: "Definitions", value: "Clustered", tone: "gold" },
      { label: "Local terms", value: "Supported", tone: "blue" },
    ],
    schemaType: ["DefinedTermSet", "ItemList", "BreadcrumbList"],
  }),
  regulationsHub: buildTopicHeroConfig({
    pageFamily: "regulations",
    pageTopic: "Global Escort Regulations",
    routePattern: "/regulations",
    heroTier: "tier1",
    h1: "Escort Vehicle Regulations Across the 120-Country Framework",
    eyebrow: "Thresholds, permit paths, local terms, and source confidence",
    subheadline:
      "Search countries, states, provinces, escort thresholds, permit authorities, local terms, and source-backed requirements without fake authority.",
    microcopy: "Check the rule, then verify with the local authority or qualified provider before the move.",
    primaryCTA: { label: "Check a rule", href: "#topic-hero-search", intent: "regulation_intent", style: "primary" },
    secondaryCTA: { label: "Run escort calculator", href: "/tools/escort-count-calculator", intent: "tool_intent", style: "secondary" },
    tertiaryCTA: { label: "Find permit help", href: "/directory?category=permit-service", intent: "provider_intent", style: "ghost" },
    statCards: [
      { value: 120, label: "Country framework" },
      { value: "Tracked", label: "Source confidence" },
      { value: "Local", label: "Terminology mapped" },
    ],
    trustBadges: [
      { label: "Authority path", value: "Shown where known", tone: "green" },
      { label: "Legal status", value: "No guarantees", tone: "slate" },
    ],
    schemaType: ["WebPage", "Dataset", "FAQPage", "BreadcrumbList"],
    sourceConfidence: "source-backed",
  }),
  trainingHub: buildTopicHeroConfig({
    pageFamily: "training",
    pageTopic: "Haul Command Training",
    routePattern: "/training",
    heroTier: "tier1",
    h1: "Get Certified. Get Chosen First.",
    eyebrow: "Badges, report cards, rank points, and role-based learning",
    subheadline:
      "Choose the certification, badge, module, or career path that improves your profile before buyers compare you.",
    microcopy: "Learn the path, build your report card, and get closer to your first paid move.",
    primaryCTA: { label: "Start certification", href: "/training/pilot-car-operator-certification", intent: "training_intent", style: "primary" },
    secondaryCTA: { label: "View programs", href: "#catalog", intent: "training_intent", style: "secondary" },
    tertiaryCTA: { label: "View report card", href: "/training/report-card", intent: "proof_intent", style: "ghost" },
    statCards: [
      { value: "50+", label: "Program framework" },
      { value: "Badge", label: "Report-card paths" },
      { value: "Role-based", label: "Learning" },
    ],
    trustBadges: [
      { label: "Rank points", value: "Tracked", tone: "gold" },
      { label: "Credential paths", value: "Mapped", tone: "green" },
    ],
    schemaType: ["Course", "FAQPage", "BreadcrumbList"],
  }),
  directoryHub: buildTopicHeroConfig({
    pageFamily: "directory",
    pageTopic: "Heavy Haul Support Directory",
    routePattern: "/directory",
    heroTier: "tier1",
    h1: "Find support. Get found. Post the need.",
    eyebrow: "Heavy-haul jobs, provider search, support requests, and proof states",
    subheadline:
      "Operators use the directory to get discovered for more work. Brokers, carriers, and shippers use it to find pilot cars, permits, route survey, staging, repair, parking, and field support before a load stalls.",
    microcopy: "Choose the action first, then narrow by role, country, market, and proof state.",
    primaryCTA: { label: "Find support", href: "#directory-results", intent: "provider_intent", style: "primary" },
    secondaryCTA: { label: "Claim your listing", href: "/claim", intent: "claim_intent", style: "secondary" },
    tertiaryCTA: { label: "Post demand", href: "/loads/post?intent=support-packet", intent: "load_post_intent", style: "ghost" },
    statCards: [
      { value: "7,468+", label: "Industry records" },
      { value: "Claimable", label: "Profiles" },
      { value: "Role/service", label: "Graph" },
    ],
    trustBadges: [
      { label: "Proof states", value: "Conservative", tone: "green" },
      { label: "No fake availability", value: "Guarded", tone: "gold" },
    ],
    schemaType: ["CollectionPage", "ItemList", "BreadcrumbList", "FAQPage"],
  }),
};
