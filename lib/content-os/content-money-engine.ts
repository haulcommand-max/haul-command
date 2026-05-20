export type ContentFranchiseKey =
  | "would_you_take_this_load"
  | "broker_mistake_breakdown"
  | "pilot_car_setup_check"
  | "do_you_need_this_role"
  | "route_risk_breakdown"
  | "country_rule_in_30_seconds"
  | "near_me_search_challenge"
  | "provider_spotlight"
  | "search_failure_market_opportunity"
  | "heavy_haul_myth_vs_fact";

export type ContentAudience =
  | "broker"
  | "carrier"
  | "dispatcher"
  | "shipper"
  | "operator"
  | "provider"
  | "advertiser"
  | "regulator"
  | "learner";

export type ContentRevenueTag =
  | "claim"
  | "post_load"
  | "sponsor"
  | "featured_profile"
  | "verified_profile"
  | "marketplace"
  | "training"
  | "data_product"
  | "api"
  | "provider_spotlight"
  | "emergency_support"
  | "adgrid"
  | "route_packet";

export type ContentDistributionTarget =
  | "short_form_video"
  | "remotion_script"
  | "faq_block"
  | "directory_page_module"
  | "city_page_module"
  | "corridor_page_module"
  | "provider_profile_module"
  | "training_snippet"
  | "google_bing_local_post_draft"
  | "email_sms_push_snippet"
  | "social_post"
  | "aeo_answer_block"
  | "ad_creative"
  | "newsletter_item";

export type ContentClaimType = "general" | "regulatory" | "safety" | "market" | "profile";

export interface ContentFranchise {
  key: ContentFranchiseKey;
  label: string;
  defaultAudience: ContentAudience[];
  defaultRevenueTags: ContentRevenueTag[];
  defaultDistributionTargets: ContentDistributionTarget[];
  requiredProofSignals: string[];
  hookPattern: string;
}

export interface ContentMoneyInput {
  franchise: ContentFranchiseKey;
  role: string;
  audience: ContentAudience;
  hook: string;
  problem: string;
  story: string;
  payoff: string;
  cta: string;
  targetUrl: string;
  countryCode?: string | null;
  region?: string | null;
  city?: string | null;
  corridor?: string | null;
  proofSignal?: string | null;
  credentialSignal?: string | null;
  revenueTags: ContentRevenueTag[];
  distributionTargets?: ContentDistributionTarget[];
  claimType?: ContentClaimType;
  sourceConfidence?: "verified" | "source_review_needed" | "seeded_needs_review" | null;
  verifyBeforeDispatchDisclaimer?: boolean;
  weakSupplySignal?: boolean;
  searchVolumeSignal?: number | null;
}

export interface ContentScorecard {
  totalScore: number;
  hookStrength: number;
  roleClarity: number;
  localRelevance: number;
  shareStatus: number;
  proofCredential: number;
  ctaClarity: number;
  seoReuse: number;
  revenuePath: number;
  safetyCompliance: "pass" | "fail";
  localization: "pass" | "fail";
}

export interface ContentMoneyPlan {
  franchise: ContentFranchise;
  scorecard: ContentScorecard;
  publishable: boolean;
  blockers: string[];
  revenueTags: ContentRevenueTag[];
  distributionTargets: ContentDistributionTarget[];
  websiteSurfaces: Array<{
    target: ContentDistributionTarget;
    purpose: string;
    targetUrl: string;
  }>;
  marketOpportunity?: {
    title: string;
    slug: string;
    reasons: string[];
    nextActions: string[];
  };
}

export const CONTENT_FRANCHISE_LIBRARY: Record<ContentFranchiseKey, ContentFranchise> = {
  would_you_take_this_load: {
    key: "would_you_take_this_load",
    label: "Would You Take This Load?",
    defaultAudience: ["operator", "broker", "carrier"],
    defaultRevenueTags: ["post_load", "route_packet", "provider_spotlight"],
    defaultDistributionTargets: ["short_form_video", "remotion_script", "social_post", "directory_page_module", "aeo_answer_block"],
    requiredProofSignals: ["load context", "role fit", "route or dimension detail"],
    hookPattern: "Would this load need [role] support?",
  },
  broker_mistake_breakdown: {
    key: "broker_mistake_breakdown",
    label: "Broker Mistake Breakdown",
    defaultAudience: ["broker", "dispatcher", "carrier"],
    defaultRevenueTags: ["post_load", "emergency_support", "route_packet"],
    defaultDistributionTargets: ["short_form_video", "social_post", "email_sms_push_snippet", "faq_block", "ad_creative"],
    requiredProofSignals: ["time loss", "wrong role", "missed support step"],
    hookPattern: "Most brokers miss this before the load moves.",
  },
  pilot_car_setup_check: {
    key: "pilot_car_setup_check",
    label: "Pilot Car Setup Check",
    defaultAudience: ["operator", "provider", "learner"],
    defaultRevenueTags: ["marketplace", "training", "verified_profile"],
    defaultDistributionTargets: ["short_form_video", "provider_profile_module", "training_snippet", "social_post"],
    requiredProofSignals: ["equipment photo", "role capability", "safety setup"],
    hookPattern: "This is what a serious [role] setup looks like.",
  },
  do_you_need_this_role: {
    key: "do_you_need_this_role",
    label: "Do You Need This Role?",
    defaultAudience: ["broker", "carrier", "shipper", "learner"],
    defaultRevenueTags: ["post_load", "training", "route_packet"],
    defaultDistributionTargets: ["aeo_answer_block", "faq_block", "directory_page_module", "training_snippet", "remotion_script"],
    requiredProofSignals: ["role definition", "adjacent role comparison", "use case"],
    hookPattern: "Do you need [role], or a different heavy-haul support role?",
  },
  route_risk_breakdown: {
    key: "route_risk_breakdown",
    label: "Route Risk Breakdown",
    defaultAudience: ["broker", "carrier", "dispatcher", "shipper"],
    defaultRevenueTags: ["route_packet", "data_product", "sponsor"],
    defaultDistributionTargets: ["remotion_script", "corridor_page_module", "short_form_video", "newsletter_item", "aeo_answer_block"],
    requiredProofSignals: ["corridor detail", "hazard type", "support role"],
    hookPattern: "One route detail can change the whole move.",
  },
  country_rule_in_30_seconds: {
    key: "country_rule_in_30_seconds",
    label: "Country Rule in 30 Seconds",
    defaultAudience: ["broker", "carrier", "operator", "learner"],
    defaultRevenueTags: ["training", "route_packet", "sponsor"],
    defaultDistributionTargets: ["short_form_video", "faq_block", "google_bing_local_post_draft", "aeo_answer_block"],
    requiredProofSignals: ["country or region", "source confidence", "verify before dispatch"],
    hookPattern: "[Country] oversize support: check this before moving.",
  },
  near_me_search_challenge: {
    key: "near_me_search_challenge",
    label: "Near Me Search Challenge",
    defaultAudience: ["broker", "dispatcher", "operator"],
    defaultRevenueTags: ["claim", "post_load", "adgrid"],
    defaultDistributionTargets: ["short_form_video", "city_page_module", "directory_page_module", "ad_creative"],
    requiredProofSignals: ["city", "role", "search outcome"],
    hookPattern: "Can you find real [role] support near [city] in under 30 seconds?",
  },
  provider_spotlight: {
    key: "provider_spotlight",
    label: "Provider Spotlight",
    defaultAudience: ["provider", "operator", "broker"],
    defaultRevenueTags: ["featured_profile", "verified_profile", "provider_spotlight"],
    defaultDistributionTargets: ["provider_profile_module", "short_form_video", "social_post", "google_bing_local_post_draft"],
    requiredProofSignals: ["claimed profile", "equipment or service proof", "service area"],
    hookPattern: "This is what a claimed [role] profile should prove.",
  },
  search_failure_market_opportunity: {
    key: "search_failure_market_opportunity",
    label: "Search Failure = Market Opportunity",
    defaultAudience: ["operator", "provider", "advertiser"],
    defaultRevenueTags: ["claim", "sponsor", "adgrid", "data_product"],
    defaultDistributionTargets: ["city_page_module", "newsletter_item", "email_sms_push_snippet", "ad_creative"],
    requiredProofSignals: ["search demand", "weak supply", "claim opportunity"],
    hookPattern: "People are searching for [role] here, but supply is thin.",
  },
  heavy_haul_myth_vs_fact: {
    key: "heavy_haul_myth_vs_fact",
    label: "Heavy Haul Myth vs Fact",
    defaultAudience: ["broker", "carrier", "operator", "learner"],
    defaultRevenueTags: ["training", "post_load", "claim"],
    defaultDistributionTargets: ["short_form_video", "faq_block", "training_snippet", "social_post", "aeo_answer_block"],
    requiredProofSignals: ["myth", "fact", "role-specific lesson"],
    hookPattern: "Myth: every [role] job is the same.",
  },
};

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
}

function uniq<T extends string>(values: T[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function hasLocalContext(input: ContentMoneyInput) {
  return Boolean(input.countryCode || input.region || input.city || input.corridor);
}

function requiresComplianceGate(input: ContentMoneyInput) {
  return input.claimType === "regulatory" || input.claimType === "safety" || input.franchise === "country_rule_in_30_seconds";
}

function startsProductFirst(hook: string) {
  return /^haul command\s+is\b/i.test(hook.trim());
}

export function scoreContentMoneyAsset(input: ContentMoneyInput): ContentScorecard {
  const franchise = CONTENT_FRANCHISE_LIBRARY[input.franchise];
  const combinedText = `${input.hook} ${input.problem} ${input.story} ${input.payoff}`;
  const hasProof = Boolean(input.proofSignal || input.credentialSignal);
  const hasRequiredProofLanguage = franchise.requiredProofSignals.some((signal) => combinedText.toLowerCase().includes(signal.split(" ")[0].toLowerCase()));
  const safetyPass = !requiresComplianceGate(input) || Boolean(input.countryCode && input.sourceConfidence && input.verifyBeforeDispatchDisclaimer);
  const localizationPass = input.countryCode?.toLowerCase() === "us" || hasLocalContext(input);

  const scorecard: ContentScorecard = {
    hookStrength: clampScore(startsProductFirst(input.hook) ? 0 : Math.min(input.hook.length / 7, 10)),
    roleClarity: clampScore(input.role ? 10 : 0),
    localRelevance: clampScore(hasLocalContext(input) ? 10 : input.franchise === "heavy_haul_myth_vs_fact" ? 6 : 3),
    shareStatus: clampScore(/send|save|share|before|mistake|would|myth|fact|stop|check/i.test(input.hook) ? 9 : 5),
    proofCredential: clampScore((hasProof ? 7 : 0) + (hasRequiredProofLanguage ? 3 : 0)),
    ctaClarity: clampScore(input.cta && input.targetUrl ? 10 : 0),
    seoReuse: clampScore((input.distributionTargets?.length ?? franchise.defaultDistributionTargets.length) >= 4 ? 10 : 6),
    revenuePath: clampScore(input.revenueTags.length > 0 ? Math.min(input.revenueTags.length * 4, 10) : 0),
    safetyCompliance: safetyPass ? "pass" : "fail",
    localization: localizationPass ? "pass" : "fail",
    totalScore: 0,
  };

  scorecard.totalScore = Math.round((
    scorecard.hookStrength +
    scorecard.roleClarity +
    scorecard.localRelevance +
    scorecard.shareStatus +
    scorecard.proofCredential +
    scorecard.ctaClarity +
    scorecard.seoReuse +
    scorecard.revenuePath
  ) * 1.25);

  if (scorecard.safetyCompliance === "fail") scorecard.totalScore -= 20;
  if (scorecard.localization === "fail") scorecard.totalScore -= 10;
  scorecard.totalScore = Math.max(0, Math.min(100, scorecard.totalScore));

  return scorecard;
}

export function buildContentMoneyPlan(input: ContentMoneyInput): ContentMoneyPlan {
  const franchise = CONTENT_FRANCHISE_LIBRARY[input.franchise];
  const scorecard = scoreContentMoneyAsset(input);
  const blockers: string[] = [];

  if (startsProductFirst(input.hook)) blockers.push("product_first_hook");
  if (!input.role.trim()) blockers.push("missing_role");
  if (!input.audience) blockers.push("missing_audience");
  if (!input.cta.trim() || !input.targetUrl.trim()) blockers.push("missing_cta_or_target");
  if (input.revenueTags.length === 0) blockers.push("missing_revenue_tag");
  if (!input.proofSignal && !input.credentialSignal) blockers.push("missing_proof_or_credential");
  if (scorecard.safetyCompliance === "fail") blockers.push("missing_regulatory_or_safety_disclaimer");
  if (scorecard.localization === "fail") blockers.push("missing_localization_context");

  const revenueTags = uniq([...franchise.defaultRevenueTags, ...input.revenueTags]);
  const distributionTargets = uniq([...(input.distributionTargets ?? []), ...franchise.defaultDistributionTargets]);
  const websiteSurfaces = distributionTargets.map((target) => ({
    target,
    targetUrl: input.targetUrl,
    purpose: purposeForDistributionTarget(target, input),
  }));

  return {
    franchise,
    scorecard,
    publishable: blockers.length === 0 && scorecard.totalScore >= 80,
    blockers,
    revenueTags,
    distributionTargets,
    websiteSurfaces,
    marketOpportunity: buildMarketOpportunity(input),
  };
}

function purposeForDistributionTarget(target: ContentDistributionTarget, input: ContentMoneyInput) {
  const location = [input.city, input.region, input.countryCode].filter(Boolean).join(", ");
  switch (target) {
    case "short_form_video":
      return "Capture attention with the hook-problem-story-payoff sequence.";
    case "remotion_script":
      return "Turn the same idea into reusable visual media for the page and social channels.";
    case "faq_block":
      return "Convert the content lesson into a crawlable answer block.";
    case "directory_page_module":
      return "Make directory search dummy-proof with role context and next action.";
    case "city_page_module":
      return `Localize the content for ${location || "the market"} and connect it to provider discovery.`;
    case "corridor_page_module":
      return "Attach the lesson to route support, friction, and corridor sponsorship.";
    case "provider_profile_module":
      return "Strengthen claimed provider proof and profile conversion.";
    case "training_snippet":
      return "Convert the lesson into a training or certification upsell.";
    case "google_bing_local_post_draft":
      return "Reuse the local angle for claimed/provider local-search surfaces.";
    case "email_sms_push_snippet":
      return "Send the lesson to the audience most likely to act.";
    case "social_post":
      return "Package the hook for native channel distribution.";
    case "aeo_answer_block":
      return "Make the answer quotable by AI, voice, and snippet surfaces.";
    case "ad_creative":
      return "Use the winning hook as paid search or retargeting creative.";
    case "newsletter_item":
      return "Turn the market signal into repeat audience and sponsor inventory.";
  }
}

function buildMarketOpportunity(input: ContentMoneyInput): ContentMoneyPlan["marketOpportunity"] {
  if (input.franchise !== "search_failure_market_opportunity" && !input.weakSupplySignal) return undefined;
  const location = [input.city, input.region, input.countryCode].filter(Boolean).join(" ");
  const slug = [input.countryCode, input.region, input.city, input.role, "demand"].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return {
    title: `${input.role} demand${location ? ` in ${location}` : ""}`,
    slug,
    reasons: [
      "Search demand exists before supply is strong enough.",
      input.searchVolumeSignal ? `${input.searchVolumeSignal} search-volume signal recorded.` : "Search-volume signal can be attached when available.",
      "Weak supply can become claim outreach, sponsor inventory, and data-product evidence.",
    ],
    nextActions: [
      "Create or update a no-dead-end market opportunity page.",
      "Queue provider claim outreach for this role and location.",
      "Expose a sponsor/adgrid slot only after the user job remains clear.",
      "Feed the demand signal into directory acquisition and SEO repair queues.",
    ],
  };
}
