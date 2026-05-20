export type AudienceKey = "demand" | "supply" | "discovery" | "monetization";
export type PageFamily =
  | "directory"
  | "role"
  | "location"
  | "corridor"
  | "profile"
  | "regulation"
  | "tool"
  | "training"
  | "data";

export interface AudienceCta {
  label: string;
  href: string;
  intent: string;
}

export interface AudienceContract {
  pageFamily: PageFamily;
  primaryAudience: AudienceKey;
  secondaryAudiences: AudienceKey[];
  userIntents: string[];
  requiredCtas: Record<AudienceKey, AudienceCta[]>;
  requiredTrustModules: string[];
  requiredDiscoveryModules: string[];
  requiredInternalLinkFamilies: string[];
  noDeadEndActions: AudienceCta[];
  monetizationRules: string[];
  localizationRules: string[];
}

export interface AudienceContractScore {
  demandUsefulness: number;
  supplyUsefulness: number;
  discoveryReadiness: number;
  trustProof: number;
  noDeadEnd: number;
  monetizationFit: number;
  localizationReadiness: number;
  overall: number;
  failures: string[];
  indexableRecommended: boolean;
}

export const AUDIENCE_CTA_BUNDLES = {
  demand: [
    { label: "Find Providers", href: "/directory", intent: "find_provider" },
    { label: "Post a Load", href: "/loads/post", intent: "post_load" },
    { label: "Ask Who I Need", href: "/directory#role-resolver", intent: "role_resolver" },
    { label: "Check Requirements", href: "/regulations", intent: "check_requirements" },
    { label: "Build Support Packet", href: "/loads/post?intent=support-packet", intent: "support_packet" },
  ],
  supply: [
    { label: "Claim Listing", href: "/claim", intent: "claim_listing" },
    { label: "Create Profile", href: "/claim?intent=create-profile", intent: "create_profile" },
    { label: "Add Proof", href: "/claim?intent=add-proof", intent: "add_proof" },
    { label: "Show My Coverage", href: "/claim?intent=coverage", intent: "show_coverage" },
    { label: "Get More Leads", href: "/claim?intent=get-more-leads", intent: "get_more_leads" },
  ],
  discovery: [
    { label: "FAQ", href: "#directory-faq", intent: "faq" },
    { label: "Related Roles", href: "#directory-role-coverage", intent: "related_roles" },
    { label: "Internal Links", href: "#directory-links", intent: "internal_links" },
  ],
  monetization: [
    { label: "Sponsor This Market", href: "/advertise?placement=directory-market", intent: "sponsor_market" },
    { label: "Feature Your Profile", href: "/advertise?placement=featured-profile", intent: "featured_profile" },
    { label: "Get Market Data", href: "/data-products/corridor-intelligence", intent: "market_data" },
  ],
} satisfies Record<AudienceKey, AudienceCta[]>;

export const DIRECTORY_AUDIENCE_CONTRACT: AudienceContract = {
  pageFamily: "directory",
  primaryAudience: "demand",
  secondaryAudiences: ["supply", "discovery", "monetization"],
  userIntents: [
    "find heavy-haul support",
    "compare proof states",
    "post demand when supply is thin",
    "claim or correct a provider listing",
    "sponsor a real buyer moment without fake rank",
  ],
  requiredCtas: AUDIENCE_CTA_BUNDLES,
  requiredTrustModules: [
    "claim state",
    "contact signal",
    "source confidence",
    "proof state",
    "thin-market disclosure",
  ],
  requiredDiscoveryModules: [
    "short answer",
    "FAQ",
    "schema",
    "breadcrumbs",
    "related roles",
    "internal links",
  ],
  requiredInternalLinkFamilies: [
    "role hub",
    "location hub",
    "requirements",
    "tools",
    "training",
    "claim",
    "load board",
    "sponsor",
  ],
  noDeadEndActions: [
    AUDIENCE_CTA_BUNDLES.demand[1],
    AUDIENCE_CTA_BUNDLES.demand[2],
    AUDIENCE_CTA_BUNDLES.supply[0],
    AUDIENCE_CTA_BUNDLES.monetization[0],
  ],
  monetizationRules: [
    "Paid placement stays labeled.",
    "Sponsor CTAs cannot imply fake availability, verification, or rank.",
    "The primary user job must appear before sponsor inventory.",
  ],
  localizationRules: [
    "Use country-aware terminology when a country is scoped.",
    "Never assume U.S.-only requirements on global pages.",
    "Thin countries stay request/claim/sponsor oriented until evidence supports indexing depth.",
  ],
};

function scoreCount(actual: number, target: number): number {
  if (target <= 0) return 10;
  return Math.min(10, Math.round((actual / target) * 10));
}

export function scoreAudienceContract(contract: AudienceContract): AudienceContractScore {
  const failures: string[] = [];
  const demandUsefulness = scoreCount(contract.requiredCtas.demand.length, 4);
  const supplyUsefulness = scoreCount(contract.requiredCtas.supply.length, 3);
  const discoveryReadiness = scoreCount(contract.requiredDiscoveryModules.length, 6);
  const trustProof = scoreCount(contract.requiredTrustModules.length, 4);
  const noDeadEnd = scoreCount(contract.noDeadEndActions.length, 3);
  const monetizationFit = contract.monetizationRules.length >= 2 && contract.requiredCtas.monetization.length > 0 ? 10 : 4;
  const localizationReadiness = scoreCount(contract.localizationRules.length, 3);

  if (demandUsefulness < 7) failures.push("Demand-side next actions are too thin.");
  if (supplyUsefulness < 5) failures.push("Supply-side claim/profile path is missing.");
  if (discoveryReadiness < 8) failures.push("Discovery/AEO modules are not strong enough for indexable pages.");
  if (trustProof < 6) failures.push("Trust and proof modules are too weak.");
  if (noDeadEnd < 8) failures.push("No-dead-end action set must include at least three useful moves.");
  if (monetizationFit < 7) failures.push("Money path is missing or risks overpowering the primary user job.");
  if (localizationReadiness < 7) failures.push("120-country localization guardrails are missing.");

  const overall = Math.round(
    (demandUsefulness +
      supplyUsefulness +
      discoveryReadiness +
      trustProof +
      noDeadEnd +
      monetizationFit +
      localizationReadiness) / 7,
  );

  return {
    demandUsefulness,
    supplyUsefulness,
    discoveryReadiness,
    trustProof,
    noDeadEnd,
    monetizationFit,
    localizationReadiness,
    overall,
    failures,
    indexableRecommended: failures.length === 0 && overall >= 8,
  };
}
