import {
  decideFirecrawlAction,
  scoreSourceCandidate,
  validateFirecrawlJob,
  type DurableOutputRoute,
  type FirecrawlJobPolicy,
  type SourceType,
} from "@/lib/intelligence/source-scoring";

export type AcquisitionTool =
  | "tavily_search"
  | "tavily_extract"
  | "firecrawl_map"
  | "firecrawl_scrape"
  | "clay_import"
  | "clay_enrich"
  | "discovery_ingest"
  | "dedupe_review"
  | "claim_outreach";

export interface AcquisitionBudget {
  tavilySearches: number;
  tavilyExtracts: number;
  firecrawlCredits: number;
  clayActions: number;
  clayDataCredits: number;
  maxProspects: number;
}

export interface ProviderAcquisitionInput {
  role: string;
  countryCode: string;
  region?: string;
  city?: string;
  corridor?: string;
  targetBatchSize?: number;
  sourceTypes?: SourceType[];
}

export interface AcquisitionStage {
  order: number;
  tool: AcquisitionTool;
  name: string;
  purpose: string;
  maxItems: number;
  creditEstimate: Partial<AcquisitionBudget>;
  outputRoutes: DurableOutputRoute[];
  safetyGate: string;
}

export interface ProviderAcquisitionWorkflow {
  workflowKey: string;
  target: {
    role: string;
    countryCode: string;
    region?: string;
    city?: string;
    corridor?: string;
  };
  queryPack: string[];
  budget: AcquisitionBudget;
  stages: AcquisitionStage[];
  firecrawlPolicies: FirecrawlJobPolicy[];
  durableOutputs: DurableOutputRoute[];
  launchRules: string[];
}

const DEFAULT_SOURCE_TYPES: SourceType[] = [
  "industry_association",
  "public_business_directory",
  "company_website",
  "competitor_resource",
];

function compact(values: Array<string | undefined | null>): string[] {
  return values.filter((value): value is string => Boolean(value?.trim()));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampBatchSize(size: number | undefined): number {
  if (!size || Number.isNaN(size)) return 50;
  return Math.max(10, Math.min(size, 100));
}

export function buildProviderAcquisitionWorkflow(input: ProviderAcquisitionInput): ProviderAcquisitionWorkflow {
  const role = input.role.trim();
  const countryCode = input.countryCode.trim().toUpperCase();
  const targetBatchSize = clampBatchSize(input.targetBatchSize);
  const location = compact([input.city, input.region, countryCode]).join(" ");
  const routeContext = compact([input.corridor, input.city, input.region, countryCode]).join(" ");
  const sourceTypes = input.sourceTypes?.length ? input.sourceTypes : DEFAULT_SOURCE_TYPES;

  const queryPack = [
    `${role} ${location}`,
    `${role} near ${location}`,
    `${role} directory ${location}`,
    `${role} service area ${location}`,
    `${role} ${routeContext} oversize load support`,
    `${role} ${countryCode} heavy haul`,
  ].filter((query, index, list) => query.trim().length > 0 && list.indexOf(query) === index);

  const durableOutputs: DurableOutputRoute[] = [
    "directory_entity_candidate",
    "claim_machine_target",
    "seo_page_opportunity",
    "adgrid_market_signal",
  ];

  const firecrawlPolicies: FirecrawlJobPolicy[] = sourceTypes.map((sourceType) => {
    const score = scoreSourceCandidate({
      url: "candidate_url_pending",
      sourceType,
      topic: `${role} acquisition`,
      countryCode,
      admin1Code: input.region ?? null,
    });
    const decision = decideFirecrawlAction(score);
    const endpoint = decision.action === "conditional_firecrawl" || decision.action === "firecrawl_scrape"
      ? "scrape"
      : "search";
    const policy: FirecrawlJobPolicy = {
      endpoint,
      sourceScore: score.score,
      limit: endpoint === "crawl" ? targetBatchSize : undefined,
      maxDiscoveryDepth: endpoint === "crawl" ? 1 : undefined,
      allowExternalLinks: false,
      allowSubdomains: false,
      moneyPathReason: decision.requiresMoneyPath
        ? "Provider acquisition creates directory candidates, claim targets, SEO gaps, and AdGrid market signals."
        : undefined,
      outputRoutes: durableOutputs,
      manualApproval: false,
    };
    validateFirecrawlJob(policy);
    return policy;
  });

  const budget: AcquisitionBudget = {
    tavilySearches: Math.min(queryPack.length, 6),
    tavilyExtracts: Math.min(targetBatchSize, 50),
    firecrawlCredits: Math.min(Math.ceil(targetBatchSize / 2), 50),
    clayActions: targetBatchSize,
    clayDataCredits: Math.min(targetBatchSize * 2, 100),
    maxProspects: targetBatchSize,
  };

  const stages: AcquisitionStage[] = [
    {
      order: 1,
      tool: "tavily_search",
      name: "Broad provider discovery",
      purpose: "Find likely provider, association, competitor, and local directory sources without crawling entire sites.",
      maxItems: budget.tavilySearches,
      creditEstimate: { tavilySearches: budget.tavilySearches },
      outputRoutes: ["directory_entity_candidate", "seo_page_opportunity"],
      safetyGate: "Store source URL, title, snippet, role, country, and source confidence before extraction.",
    },
    {
      order: 2,
      tool: "tavily_extract",
      name: "Cheap source triage",
      purpose: "Extract clean text for promising URLs before spending Firecrawl credits.",
      maxItems: budget.tavilyExtracts,
      creditEstimate: { tavilyExtracts: budget.tavilyExtracts },
      outputRoutes: ["directory_entity_candidate", "authority_source", "competitor_gap"],
      safetyGate: "Reject spam/private sources and keep low-confidence sources out of public listings.",
    },
    {
      order: 3,
      tool: "firecrawl_scrape",
      name: "Durable proof capture",
      purpose: "Scrape only sources that can produce a provider candidate, claim target, authority source, or money signal.",
      maxItems: budget.firecrawlCredits,
      creditEstimate: { firecrawlCredits: budget.firecrawlCredits },
      outputRoutes: durableOutputs,
      safetyGate: "Firecrawl jobs must pass source scoring and output-route validation before execution.",
    },
    {
      order: 4,
      tool: "clay_import",
      name: "Clay small-batch import",
      purpose: "Import high-value candidates into Clay for normalization and enrichment using the free-tier budget.",
      maxItems: budget.maxProspects,
      creditEstimate: { clayActions: budget.clayActions },
      outputRoutes: ["directory_entity_candidate", "claim_machine_target"],
      safetyGate: "Do not enrich every row. Start with candidates that have a role, country, source URL, and claim value.",
    },
    {
      order: 5,
      tool: "clay_enrich",
      name: "Clay enrichment",
      purpose: "Fill contact gaps and draft personalized claim outreach for only the highest-value candidates.",
      maxItems: Math.floor(budget.clayDataCredits / 2),
      creditEstimate: { clayDataCredits: budget.clayDataCredits },
      outputRoutes: ["claim_machine_target"],
      safetyGate: "Private fields remain private; enrichment cannot create fake verification, reviews, or availability.",
    },
    {
      order: 6,
      tool: "discovery_ingest",
      name: "Discovery ingest",
      purpose: "Send normalized records to the existing discovery pipeline instead of bypassing dedupe and trust gates.",
      maxItems: budget.maxProspects,
      creditEstimate: {},
      outputRoutes: ["directory_entity_candidate", "claim_machine_target", "adgrid_market_signal"],
      safetyGate: "Use /api/discovery/ingest or service-role batch ingestion; public display waits for dedupe and confidence.",
    },
    {
      order: 7,
      tool: "dedupe_review",
      name: "Dedupe and confidence review",
      purpose: "Merge duplicates and quarantine weak/synthetic candidates before public directory exposure.",
      maxItems: budget.maxProspects,
      creditEstimate: {},
      outputRoutes: ["directory_entity_candidate", "listing_shell"],
      safetyGate: "No candidate becomes indexable or dispatchable without source confidence and duplicate review.",
    },
    {
      order: 8,
      tool: "claim_outreach",
      name: "Claim outreach",
      purpose: "Turn verified candidates into claim pressure, provider onboarding, and local market coverage.",
      maxItems: budget.maxProspects,
      creditEstimate: {},
      outputRoutes: ["claim_machine_target", "adgrid_market_signal"],
      safetyGate: "Outreach copy must say claimable/unverified unless the provider has completed proof review.",
    },
  ];

  return {
    workflowKey: `provider-acquisition:${countryCode}:${slugify(compact([input.region, input.city, role]).join("-"))}`,
    target: {
      role,
      countryCode,
      region: input.region,
      city: input.city,
      corridor: input.corridor,
    },
    queryPack,
    budget,
    stages,
    firecrawlPolicies,
    durableOutputs,
    launchRules: [
      "Directory search and no-dead-end fallbacks must work before paid acquisition traffic is scaled.",
      "Tavily is the broad search layer; Firecrawl is the proof capture layer; Clay is the small-batch enrichment and outreach layer.",
      "No scraped candidate is publicly verified, reviewed, available, or dispatchable until Haul Command proof gates say so.",
      "Every acquisition run must produce at least one durable output: directory candidate, claim target, SEO gap, AdGrid signal, or authority source.",
      "Start with 50 to 100 prospects per market so Clay free-tier actions and data credits are not burned on low-value rows.",
    ],
  };
}
