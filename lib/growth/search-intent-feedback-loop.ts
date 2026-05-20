export type SearchIntentSource =
  | "google_ads"
  | "bing_ads"
  | "directory_search"
  | "organic_search"
  | "support"
  | "sales_call";

export type SearchIntentActionType =
  | "fix_directory_search"
  | "create_noindex_market_opportunity"
  | "create_seo_page_candidate"
  | "add_faq_or_aeo_block"
  | "queue_provider_acquisition"
  | "queue_claim_outreach"
  | "open_adgrid_sponsor_slot"
  | "create_training_or_tool_snippet"
  | "keep_ads_learning";

export interface SearchIntentSignal {
  query: string;
  source: SearchIntentSource;
  role?: string | null;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  corridor?: string | null;
  impressions?: number | null;
  clicks?: number | null;
  costCents?: number | null;
  providerClicks?: number | null;
  postLoadStarts?: number | null;
  claimStarts?: number | null;
  supportRequests?: number | null;
  noResultsCount?: number | null;
  resultsCount?: number | null;
  conversions?: number | null;
}

export interface SearchIntentFeedbackAction {
  type: SearchIntentActionType;
  priority: "P0" | "P1" | "P2";
  reason: string;
  targetUrl?: string;
  payload: Record<string, unknown>;
}

export interface SearchIntentFeedbackPlan {
  normalizedQuery: string;
  inferredIntent: "find_provider" | "post_load" | "claim_listing" | "learn_requirement" | "market_research";
  intentScore: number;
  commercialScore: number;
  geoSpecificityScore: number;
  supplyGapScore: number;
  actions: SearchIntentFeedbackAction[];
  indexablePageAllowed: boolean;
  indexabilityReason: string;
}

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

function value(input: number | null | undefined) {
  return typeof input === "number" && Number.isFinite(input) ? input : 0;
}

function hasGeo(signal: SearchIntentSignal) {
  return Boolean(signal.countryCode || signal.region || signal.city || signal.corridor);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function inferIntent(signal: SearchIntentSignal): SearchIntentFeedbackPlan["inferredIntent"] {
  const query = normalizeQuery(signal.query);
  if (/claim|my listing|my profile|get listed/.test(query)) return "claim_listing";
  if (/post|load|quote|move|need.*today|available now/.test(query)) return "post_load";
  if (/requirement|rule|permit|need a|how many|legal|escort count/.test(query)) return "learn_requirement";
  if (/demand|market|coverage|sponsor|data|report/.test(query)) return "market_research";
  return "find_provider";
}

function targetPath(signal: SearchIntentSignal, intent: SearchIntentFeedbackPlan["inferredIntent"]) {
  const country = slugify(signal.countryCode || "us");
  const region = signal.region ? slugify(signal.region) : null;
  const city = signal.city ? slugify(signal.city) : null;
  const role = slugify(signal.role || normalizeQuery(signal.query));
  if (intent === "learn_requirement") return `/escort-requirements/${region ?? country}`;
  if (intent === "post_load") return "/load-board/post";
  if (intent === "claim_listing") return `/claim?role=${encodeURIComponent(role)}`;
  if (city && region) return `/${country}/${region}/${city}/${role}`;
  if (region) return `/${country}/${region}/${role}`;
  return `/directory/${country}?q=${encodeURIComponent(signal.query)}`;
}

export function buildSearchIntentFeedbackPlan(signal: SearchIntentSignal): SearchIntentFeedbackPlan {
  const normalizedQuery = normalizeQuery(signal.query);
  const inferredIntent = inferIntent(signal);
  const clicks = value(signal.clicks);
  const conversions =
    value(signal.conversions) +
    value(signal.providerClicks) +
    value(signal.postLoadStarts) +
    value(signal.claimStarts) +
    value(signal.supportRequests);
  const noResults = value(signal.noResultsCount);
  const results = value(signal.resultsCount);
  const commercialScore = Math.min(100, conversions * 20 + clicks * 4 + (signal.source.includes("ads") ? 15 : 0));
  const geoSpecificityScore = hasGeo(signal) ? 100 : signal.query.match(/\bnear me\b/i) ? 60 : 25;
  const supplyGapScore = Math.min(100, noResults * 25 + (results === 0 ? 35 : 0));
  const intentScore = Math.min(100, commercialScore * 0.45 + geoSpecificityScore * 0.25 + supplyGapScore * 0.3);
  const targetUrl = targetPath(signal, inferredIntent);
  const actions: SearchIntentFeedbackAction[] = [];

  if (noResults > 0 || results === 0) {
    actions.push({
      type: "create_noindex_market_opportunity",
      priority: "P0",
      reason: "Demand exists but the directory did not return enough supply. Capture the gap without publishing a thin indexable page.",
      targetUrl,
      payload: { query: signal.query, role: signal.role, countryCode: signal.countryCode, region: signal.region, city: signal.city, noResults },
    });
    actions.push({
      type: "queue_provider_acquisition",
      priority: "P0",
      reason: "Weak supply should trigger provider discovery before more ad spend or indexable SEO expansion.",
      payload: { role: signal.role ?? signal.query, countryCode: signal.countryCode, region: signal.region, city: signal.city },
    });
  }

  if (conversions > 0 && inferredIntent === "find_provider") {
    actions.push({
      type: "queue_claim_outreach",
      priority: "P1",
      reason: "Buyer/provider action exists. Use the term to prioritize claim outreach in that market.",
      targetUrl,
      payload: { query: signal.query, conversions },
    });
  }

  if (intentScore >= 60 && hasGeo(signal) && signal.role) {
    actions.push({
      type: "create_seo_page_candidate",
      priority: noResults > 0 ? "P1" : "P0",
      reason: "High-intent role/place query deserves a research packet and survival-score review before indexing.",
      targetUrl,
      payload: { role: signal.role, countryCode: signal.countryCode, region: signal.region, city: signal.city, corridor: signal.corridor },
    });
  }

  if (inferredIntent === "learn_requirement") {
    actions.push({
      type: "add_faq_or_aeo_block",
      priority: "P1",
      reason: "Requirement queries should become short answers, FAQs, and voice/AEO blocks before ad expansion.",
      targetUrl,
      payload: { query: signal.query, countryCode: signal.countryCode, region: signal.region },
    });
    actions.push({
      type: "create_training_or_tool_snippet",
      priority: "P2",
      reason: "Requirement education can support training, calculators, and route support tools.",
      payload: { query: signal.query, role: signal.role },
    });
  }

  if (commercialScore >= 50 && hasGeo(signal)) {
    actions.push({
      type: "open_adgrid_sponsor_slot",
      priority: "P2",
      reason: "Commercial intent and local specificity can support sponsor inventory after the primary user task is served.",
      targetUrl,
      payload: { query: signal.query, role: signal.role, region: signal.region, city: signal.city },
    });
  }

  if (signal.source.includes("ads") && conversions === 0 && clicks >= 10) {
    actions.push({
      type: "fix_directory_search",
      priority: "P0",
      reason: "Paid traffic clicked but did not convert. Inspect landing page/search flow before spending more.",
      payload: { query: signal.query, clicks, costCents: signal.costCents ?? null },
    });
  }

  if (actions.length === 0) {
    actions.push({
      type: "keep_ads_learning",
      priority: "P2",
      reason: "Signal is not strong enough yet. Keep gathering query, click, and conversion data.",
      payload: { query: signal.query, source: signal.source },
    });
  }

  const indexablePageAllowed = intentScore >= 70 && hasGeo(signal) && Boolean(signal.role) && noResults === 0;
  const indexabilityReason = indexablePageAllowed
    ? "eligible_for_survival_score_review"
    : noResults > 0 || results === 0
      ? "noindex_until_supply_or_unique_data_exists"
      : "needs_more_role_place_or_conversion_signal";

  return {
    normalizedQuery,
    inferredIntent,
    intentScore: Math.round(intentScore),
    commercialScore: Math.round(commercialScore),
    geoSpecificityScore,
    supplyGapScore,
    actions,
    indexablePageAllowed,
    indexabilityReason,
  };
}
