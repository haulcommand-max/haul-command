import type { PageSeoContract, PageSeoFamily } from "@/lib/seo/page-seo-contract";

export type IndexSurvivalPageClass =
  | "role_place"
  | "role_explainer"
  | "requirement"
  | "corridor"
  | "provider_profile"
  | "market_data"
  | "near_me"
  | "hub";

export type IndexSurvivalDecision = "index" | "noindex";
export type IndexSurvivalStatus = "publishable_index" | "index_candidate" | "noindex_repair" | "draft";

export interface IndexSurvivalInput {
  path: string;
  pageClass: IndexSurvivalPageClass;
  pageFamily?: PageSeoFamily;
  countryCode?: string | null;
  role?: string | null;
  city?: string | null;
  region?: string | null;
  corridor?: string | null;
  hasSearchIntent: boolean;
  hasClearNextAction: boolean;
  hasCanonical: boolean;
  hasShortAnswer: boolean;
  hasNoDeadEndFallback: boolean;
  usesLocalTerminology: boolean;
  avoidsUsOnlyAssumption: boolean;
  uniqueResearchSignals: number;
  originalDataModules: string[];
  roleSpecificitySignals: string[];
  localSpecificitySignals: string[];
  internalLinkFamilies: string[];
  authoritySourceCount: number;
  mobileUxModules: string[];
  schemaTypes: string[];
  trustProofModules: string[];
  redundancyRiskScore: number;
}

export interface IndexSurvivalCategory {
  key:
    | "contentUniqueness"
    | "originalData"
    | "localRoleSpecificity"
    | "internalLinkGraph"
    | "authoritySources"
    | "mobileUxStructure"
    | "schemaEntityClarity"
    | "trustProofModules";
  label: string;
  max: number;
  score: number;
  notes: string[];
}

export interface IndexSurvivalResult {
  path: string;
  totalScore: number;
  publishable: boolean;
  decision: IndexSurvivalDecision;
  status: IndexSurvivalStatus;
  categories: IndexSurvivalCategory[];
  blockers: string[];
  repairActions: string[];
}

const PUBLISH_THRESHOLD = 80;
const PROGRAMMATIC_INDEX_THRESHOLD = 70;
const DEFAULT_INDEX_THRESHOLD = 80;

const PROGRAMMATIC_CLASSES: IndexSurvivalPageClass[] = ["role_place", "corridor", "near_me", "market_data"];

function clamp(value: number, max: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, value));
}

function scoreCount(count: number, needed: number, max: number) {
  return clamp((Math.max(0, count) / needed) * max, max);
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function addCategory(
  categories: IndexSurvivalCategory[],
  key: IndexSurvivalCategory["key"],
  label: string,
  max: number,
  score: number,
  notes: string[],
) {
  categories.push({ key, label, max, score: Math.round(clamp(score, max)), notes });
}

function requiredSchemaForPage(input: IndexSurvivalInput) {
  const required = new Set<string>(["BreadcrumbList"]);
  if (input.pageClass === "provider_profile") required.add("LocalBusiness");
  if (input.pageClass === "market_data") required.add("Dataset");
  if (input.pageClass === "requirement" || input.hasShortAnswer) required.add("FAQPage");
  if (input.pageClass === "role_place" || input.pageClass === "role_explainer") required.add("Service");
  return required;
}

function buildBlockers(input: IndexSurvivalInput) {
  const blockers: string[] = [];
  const isRolePlace = input.pageClass === "role_place" || input.pageClass === "near_me";

  if (!input.hasSearchIntent) blockers.push("missing_search_intent");
  if (!input.hasClearNextAction) blockers.push("missing_clear_next_action");
  if (!input.hasCanonical) blockers.push("missing_canonical");
  if (!input.hasNoDeadEndFallback) blockers.push("missing_no_dead_end_fallback");
  if (isRolePlace && !input.role) blockers.push("missing_role");
  if (isRolePlace && !input.city && !input.region && !input.corridor) blockers.push("missing_place_or_corridor");
  if ((input.countryCode ?? "").toLowerCase() !== "us" && !input.avoidsUsOnlyAssumption) {
    blockers.push("us_only_assumption_on_global_page");
  }
  if (input.redundancyRiskScore >= 70) blockers.push("high_redundancy_risk");
  if (input.uniqueResearchSignals < 2 && input.originalDataModules.length === 0) {
    blockers.push("missing_unique_haul_command_angle");
  }

  const schemaTypes = new Set(input.schemaTypes);
  for (const schemaType of requiredSchemaForPage(input)) {
    if (!schemaTypes.has(schemaType)) blockers.push(`missing_schema_${schemaType}`);
  }

  return blockers;
}

function buildRepairActions(input: IndexSurvivalInput, blockers: string[]) {
  const actions = new Set<string>();

  if (blockers.includes("missing_search_intent")) actions.add("Declare the exact user job: find support, understand requirements, compare roles, post demand, claim listing, or sponsor market.");
  if (blockers.includes("missing_clear_next_action")) actions.add("Add a visible next action above the fold for the primary audience.");
  if (blockers.includes("missing_canonical")) actions.add("Add a canonical URL before the page can be indexable.");
  if (blockers.includes("missing_no_dead_end_fallback")) actions.add("Add no-result and thin-market fallbacks: expand radius, post load, ask who I need, claim listing, and sponsor market.");
  if (blockers.includes("missing_unique_haul_command_angle")) actions.add("Add at least one original Haul Command data module or two source-backed local research signals.");
  if (blockers.includes("high_redundancy_risk")) actions.add("Rewrite the page around gaps competitors do not answer, not generic role text.");
  if (input.originalDataModules.length < 3) actions.add("Add three uniqueness modules where possible: provider density, coverage gap, demand signal, permit complexity, corridor friction, claimed count, or sponsor availability.");
  if (input.internalLinkFamilies.length < 3) actions.add("Link from at least three relevant families: role hub, country/region/city, corridor, regulations, tools, glossary, training, profiles, load board, market data, sponsor.");
  if (input.authoritySourceCount < 2) actions.add("Add official or local authority sources and visible source confidence.");
  if (!input.hasShortAnswer) actions.add("Add a short answer block that can be quoted by search, AI, and voice surfaces.");
  if (input.trustProofModules.length === 0) actions.add("Add trust/proof: claim state, contact confidence, source freshness, proof badges, verified docs, review/report card, or methodology.");
  if ((input.countryCode ?? "").toLowerCase() !== "us" && !input.usesLocalTerminology) actions.add("Add country-local terminology, units, language, and authority context.");

  for (const blocker of blockers) {
    if (blocker.startsWith("missing_schema_")) {
      actions.add(`Add ${blocker.replace("missing_schema_", "")} JSON-LD that matches visible page content.`);
    }
  }

  return Array.from(actions);
}

export function scoreIndexSurvival(input: IndexSurvivalInput): IndexSurvivalResult {
  const categories: IndexSurvivalCategory[] = [];

  addCategory(categories, "contentUniqueness", "Content uniqueness", 20, 20 - input.redundancyRiskScore * 0.16 + scoreCount(input.uniqueResearchSignals, 5, 8), [
    `${input.uniqueResearchSignals} research signals`,
    `${input.redundancyRiskScore}/100 redundancy risk`,
  ]);

  addCategory(categories, "originalData", "Original Haul Command data", 15, scoreCount(unique(input.originalDataModules).length, 3, 15), input.originalDataModules);

  addCategory(categories, "localRoleSpecificity", "Local and role specificity", 15,
    scoreCount(unique(input.roleSpecificitySignals).length, 3, 7) +
      scoreCount(unique(input.localSpecificitySignals).length, 3, 6) +
      (input.usesLocalTerminology ? 2 : 0),
    [...input.roleSpecificitySignals, ...input.localSpecificitySignals],
  );

  addCategory(categories, "internalLinkGraph", "Internal authority graph", 10, scoreCount(unique(input.internalLinkFamilies).length, 5, 10), input.internalLinkFamilies);

  addCategory(categories, "authoritySources", "Authority and source citations", 10, scoreCount(input.authoritySourceCount, 3, 10), [`${input.authoritySourceCount} sources`]);

  addCategory(categories, "mobileUxStructure", "Mobile-first action structure", 10,
    scoreCount(unique(input.mobileUxModules).length, 5, 7) +
      (input.hasShortAnswer ? 1 : 0) +
      (input.hasClearNextAction ? 1 : 0) +
      (input.hasNoDeadEndFallback ? 1 : 0),
    input.mobileUxModules,
  );

  const requiredSchema = requiredSchemaForPage(input);
  const schemaTypes = new Set(input.schemaTypes);
  const requiredMet = Array.from(requiredSchema).filter((schemaType) => schemaTypes.has(schemaType)).length;
  addCategory(categories, "schemaEntityClarity", "Schema and entity clarity", 10,
    scoreCount(requiredMet, requiredSchema.size, 7) +
      (input.hasCanonical ? 1 : 0) +
      (input.hasSearchIntent ? 1 : 0) +
      (input.avoidsUsOnlyAssumption ? 1 : 0),
    input.schemaTypes,
  );

  addCategory(categories, "trustProofModules", "Trust and proof modules", 10, scoreCount(unique(input.trustProofModules).length, 3, 10), input.trustProofModules);

  const totalScore = categories.reduce((sum, category) => sum + category.score, 0);
  const blockers = buildBlockers(input);
  const indexThreshold = PROGRAMMATIC_CLASSES.includes(input.pageClass) ? PROGRAMMATIC_INDEX_THRESHOLD : DEFAULT_INDEX_THRESHOLD;
  const publishable = totalScore >= PUBLISH_THRESHOLD && blockers.length === 0;
  const decision: IndexSurvivalDecision = totalScore >= indexThreshold && blockers.length === 0 ? "index" : "noindex";
  const status: IndexSurvivalStatus = publishable
    ? "publishable_index"
    : decision === "index"
      ? "index_candidate"
      : totalScore >= PROGRAMMATIC_INDEX_THRESHOLD
        ? "noindex_repair"
        : "draft";

  return {
    path: input.path,
    totalScore,
    publishable,
    decision,
    status,
    categories,
    blockers,
    repairActions: buildRepairActions(input, blockers),
  };
}

export function assertIndexSurvival(input: IndexSurvivalInput, minimumScore = PUBLISH_THRESHOLD) {
  const result = scoreIndexSurvival(input);
  if (result.totalScore < minimumScore || result.blockers.length > 0) {
    throw new Error(
      `Index survival failed for ${input.path}: score=${result.totalScore}, blockers=${result.blockers.join(", ") || "none"}, repairs=${result.repairActions.join(" | ")}`,
    );
  }
  return result;
}

export function contractToIndexSurvivalInput(
  contract: PageSeoContract,
  evidence: Partial<Omit<IndexSurvivalInput, "path" | "pageClass">> & { pageClass?: IndexSurvivalPageClass } = {},
): IndexSurvivalInput {
  const pageClass = evidence.pageClass ?? pageFamilyToPageClass(contract.pageType);
  const schemaTypes = evidence.schemaTypes ?? contract.schemaTypes;
  const internalLinkFamilies = evidence.internalLinkFamilies ?? unique(contract.internalLinkSlots.map((slot) => slot.pageFamily ?? "unknown"));
  const roleSpecificitySignals = evidence.roleSpecificitySignals ?? unique([contract.role, ...contract.entityTerms.filter((term) => /escort|pilot|permit|route|carrier|broker|survey|load/i.test(term))]);
  const localSpecificitySignals = evidence.localSpecificitySignals ?? unique([contract.country, contract.region, contract.city, contract.corridor]);

  return {
    path: contract.canonicalPath ?? contract.path,
    pageClass,
    pageFamily: contract.pageType,
    countryCode: contract.country,
    role: contract.role,
    city: contract.city,
    region: contract.region,
    corridor: contract.corridor,
    hasSearchIntent: evidence.hasSearchIntent ?? Boolean(contract.primaryKeyword || contract.quickAnswer),
    hasClearNextAction: evidence.hasClearNextAction ?? contract.conversionCtas.length > 0,
    hasCanonical: evidence.hasCanonical ?? Boolean(contract.canonicalPath ?? contract.path),
    hasShortAnswer: evidence.hasShortAnswer ?? contract.quickAnswer.trim().length > 0,
    hasNoDeadEndFallback: evidence.hasNoDeadEndFallback ?? contract.conversionCtas.length >= 2,
    usesLocalTerminology: evidence.usesLocalTerminology ?? Boolean(contract.country || contract.region || contract.city || contract.corridor),
    avoidsUsOnlyAssumption: evidence.avoidsUsOnlyAssumption ?? contract.country?.toLowerCase() === "us",
    uniqueResearchSignals: evidence.uniqueResearchSignals ?? Math.min(contract.h2Outline.length + (contract.faqQuestions?.length ?? 0), 8),
    originalDataModules: evidence.originalDataModules ?? [],
    roleSpecificitySignals,
    localSpecificitySignals,
    internalLinkFamilies,
    authoritySourceCount: evidence.authoritySourceCount ?? (contract.sourceBasis ? 1 : 0),
    mobileUxModules: evidence.mobileUxModules ?? unique(["h1", contract.quickAnswer ? "short_answer" : "", contract.visibleIntro ? "visible_intro" : "", contract.conversionCtas.length ? "cta" : ""]),
    schemaTypes,
    trustProofModules: evidence.trustProofModules ?? unique([contract.sourceBasis ? "source_basis" : "", contract.lastReviewedAt ? "last_reviewed" : "", contract.qualityStatus]),
    redundancyRiskScore: evidence.redundancyRiskScore ?? (contract.qualityStatus === "indexable" ? 35 : 65),
  };
}

function pageFamilyToPageClass(pageType: PageSeoFamily): IndexSurvivalPageClass {
  if (pageType === "profile") return "provider_profile";
  if (pageType === "corridor") return "corridor";
  if (pageType === "market_data") return "market_data";
  if (pageType === "regulation") return "requirement";
  if (pageType === "role") return "role_explainer";
  if (pageType === "directory_city" || pageType === "directory_region" || pageType === "directory_country") return "role_place";
  return "hub";
}
