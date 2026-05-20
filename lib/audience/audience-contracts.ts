import audienceContracts from "./audience-contracts.json";

export type AudienceKey =
  | "demand_side"
  | "supply_side"
  | "discovery_authority"
  | "monetization";

export type PageFamily =
  | "directory"
  | "profile"
  | "role"
  | "location"
  | "corridor"
  | "regulation"
  | "tool"
  | "training"
  | "data"
  | "glossary"
  | "near_me"
  | "load_board";

export type CtaKey =
  | "find_providers"
  | "post_load"
  | "ask_who_i_need"
  | "check_requirements"
  | "build_support_packet"
  | "claim_listing"
  | "create_profile"
  | "add_proof"
  | "show_coverage"
  | "get_more_leads"
  | "sponsor_market"
  | "feature_profile"
  | "get_market_data";

export type TrustModuleKey =
  | "claimed_status"
  | "verification_status"
  | "source_confidence"
  | "last_updated"
  | "service_area"
  | "proof_badges"
  | "contact_confidence"
  | "report_correction";

export type DiscoveryModuleKey =
  | "short_answer"
  | "faq"
  | "breadcrumbs"
  | "canonical"
  | "schema"
  | "internal_links"
  | "related_roles"
  | "related_locations"
  | "source_freshness"
  | "hreflang";

export type InternalLinkFamily =
  | "role_hub"
  | "location_hub"
  | "directory"
  | "profile"
  | "corridor"
  | "regulation"
  | "tool"
  | "glossary"
  | "training"
  | "load_board"
  | "sponsor";

export type SchemaKey =
  | "Organization"
  | "WebSite"
  | "BreadcrumbList"
  | "FAQPage"
  | "LocalBusiness"
  | "Service"
  | "Place"
  | "Dataset"
  | "Course"
  | "VideoObject";

export interface AudienceScoreThresholds {
  demandUsefulness: number;
  supplyUsefulness: number;
  discoveryReadiness: number;
  trustProof: number;
  monetizationRelevance: number;
}

export interface AudienceContract {
  id: string;
  routePattern: string;
  routeFile?: string;
  pageFamily: PageFamily;
  primaryAudience: AudienceKey;
  secondaryAudiences: AudienceKey[];
  userIntents: string[];
  requiredCtas: CtaKey[];
  requiredTrustModules: TrustModuleKey[];
  requiredDiscoveryModules: DiscoveryModuleKey[];
  requiredInternalLinkFamilies: InternalLinkFamily[];
  requiredSchema: SchemaKey[];
  noDeadEndActions: CtaKey[];
  minimumScores: AudienceScoreThresholds;
  monetizationRule: "none" | "secondary" | "contextual" | "primary";
  notes: string;
}

export interface AudienceEvidence {
  ctas?: CtaKey[];
  trustModules?: TrustModuleKey[];
  discoveryModules?: DiscoveryModuleKey[];
  internalLinkFamilies?: InternalLinkFamily[];
  schema?: SchemaKey[];
  hasNoDeadEndActions?: boolean;
}

export interface AudienceContractScore {
  contractId: string;
  score: number;
  pass: boolean;
  missing: string[];
}

export const AUDIENCE_CONTRACTS = audienceContracts as AudienceContract[];

export function getAudienceContract(id: string): AudienceContract | undefined {
  return AUDIENCE_CONTRACTS.find((contract) => contract.id === id);
}

export function getAudienceContractsByFamily(pageFamily: PageFamily): AudienceContract[] {
  return AUDIENCE_CONTRACTS.filter((contract) => contract.pageFamily === pageFamily);
}

export function scoreAudienceContract(
  contract: AudienceContract,
  evidence: AudienceEvidence,
): AudienceContractScore {
  const missing: string[] = [];
  const checks: Array<[string, boolean]> = [
    ...contract.requiredCtas.map((key) => [`cta:${key}`, evidence.ctas?.includes(key) ?? false] as [string, boolean]),
    ...contract.requiredTrustModules.map((key) => [`trust:${key}`, evidence.trustModules?.includes(key) ?? false] as [string, boolean]),
    ...contract.requiredDiscoveryModules.map((key) => [`discovery:${key}`, evidence.discoveryModules?.includes(key) ?? false] as [string, boolean]),
    ...contract.requiredInternalLinkFamilies.map((key) => [`link:${key}`, evidence.internalLinkFamilies?.includes(key) ?? false] as [string, boolean]),
    ...contract.requiredSchema.map((key) => [`schema:${key}`, evidence.schema?.includes(key) ?? false] as [string, boolean]),
    ["no_dead_end_actions", evidence.hasNoDeadEndActions === true],
  ];

  for (const [label, ok] of checks) {
    if (!ok) missing.push(label);
  }

  const passed = checks.length - missing.length;
  const score = checks.length === 0 ? 100 : Math.round((passed / checks.length) * 100);

  return {
    contractId: contract.id,
    score,
    pass: missing.length === 0,
    missing,
  };
}

