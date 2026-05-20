export type IndexabilityDecision = "indexable" | "draft" | "noindex";

export interface PageResearchPacketInput {
  target_url: string;
  page_family?: string | null;
  role_id?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  corridor?: string | null;
  search_intent?: string | null;
  buyer_intent?: string | null;
  provider_intent?: string | null;
  advertiser_intent?: string | null;
  top_serp_urls?: string[];
  bing_result_urls?: string[];
  paa_questions?: string[];
  competitor_urls?: string[];
  authority_sources?: string[];
  forum_pain_points?: string[];
  review_pain_points?: string[];
  competitor_gaps?: string[];
  internal_link_targets?: string[];
  unique_data_modules?: string[];
  recommended_schema?: string[];
  recommended_media?: string[];
  unique_haul_command_angle?: string | null;
  provider_record_count?: number | null;
  redundancy_score?: number | null;
  source_confidence?: "low" | "medium" | "high" | null;
}

export interface PageResearchPacketScore {
  score: number;
  decision: IndexabilityDecision;
  category_scores: {
    research_coverage: number;
    uniqueness: number;
    page_readiness: number;
    trust_and_supply: number;
  };
  blockers: string[];
  repair_actions: string[];
}

function count(values: string[] | undefined): number {
  return Array.isArray(values) ? values.filter((value) => value.trim()).length : 0;
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function capped(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

export function scorePageResearchPacket(packet: PageResearchPacketInput): PageResearchPacketScore {
  const blockers: string[] = [];
  const repairActions: string[] = [];
  const topSerp = count(packet.top_serp_urls);
  const bing = count(packet.bing_result_urls);
  const paa = count(packet.paa_questions);
  const competitors = count(packet.competitor_urls);
  const authorities = count(packet.authority_sources);
  const forumPain = count(packet.forum_pain_points);
  const reviewPain = count(packet.review_pain_points);
  const gaps = count(packet.competitor_gaps);
  const links = count(packet.internal_link_targets);
  const dataModules = count(packet.unique_data_modules);
  const schema = count(packet.recommended_schema);
  const media = count(packet.recommended_media);
  const providerCount = Number(packet.provider_record_count ?? 0);
  const redundancy = Number(packet.redundancy_score ?? 0);
  const hasGeo = [packet.country, packet.region, packet.city, packet.corridor].some(hasText);

  const researchCoverage =
    capped(topSerp, 10) * 0.6 +
    capped(bing, 5) * 0.4 +
    capped(paa, 6) * 0.8 +
    capped(competitors, 5) * 1 +
    capped(authorities, 4) * 1.5 +
    capped(forumPain + reviewPain, 6) * 0.7 +
    capped(gaps, 5) * 0.9;

  const uniqueness =
    (hasText(packet.unique_haul_command_angle) ? 10 : 0) +
    capped(dataModules, 3) * 4 +
    (hasGeo ? 4 : 0) +
    (hasText(packet.role_id) ? 2 : 0) +
    (hasText(packet.search_intent) ? 2 : 0);

  const pageReadiness =
    capped(links, 5) * 1.5 +
    capped(schema, 4) * 1.5 +
    capped(media, 2) * 2 +
    (hasText(packet.buyer_intent) || hasText(packet.provider_intent) ? 3 : 0) +
    (hasText(packet.advertiser_intent) ? 1 : 0);

  const trustAndSupply =
    capped(authorities, 3) * 2 +
    (packet.source_confidence === "high" ? 4 : packet.source_confidence === "medium" ? 2 : 0) +
    (providerCount >= 5 ? 5 : providerCount > 0 ? 3 : 0) +
    (dataModules >= 1 ? 3 : 0);

  if (!hasText(packet.target_url)) blockers.push("Missing target URL.");
  if (!hasText(packet.unique_haul_command_angle)) blockers.push("Missing unique Haul Command angle.");
  if (dataModules < 3) blockers.push("Fewer than 3 unique Haul Command data modules.");
  if (links < 3) blockers.push("Fewer than 3 internal link targets.");
  if (authorities < 1) blockers.push("No local or official authority source.");
  if (!hasGeo) blockers.push("No country, region, city, or corridor context.");
  if (redundancy >= 0.7) blockers.push("Redundancy score is too high for indexable publication.");

  if (topSerp < 5) repairActions.push("Collect at least 5 current search-result references before drafting.");
  if (paa < 3) repairActions.push("Add People Also Ask or support-ticket questions for AEO blocks.");
  if (gaps < 2) repairActions.push("Document at least 2 competitor gaps the page will answer.");
  if (dataModules < 3) repairActions.push("Attach provider density, support gap, demand, rate, permit, or freshness data.");
  if (links < 3) repairActions.push("Add links from role, location, directory, regulation, tool, corridor, or training hubs.");
  if (providerCount === 0) repairActions.push("Keep as noindex or market opportunity until supply/proof exists.");

  const rawScore = researchCoverage + uniqueness + pageReadiness + trustAndSupply;
  const score = Math.round(capped(rawScore, 100));
  const hardNoindex = blockers.some((blocker) =>
    blocker.includes("unique Haul Command angle") ||
    blocker.includes("Redundancy") ||
    blocker.includes("No country"),
  );
  const decision: IndexabilityDecision = hardNoindex || score < 60 ? "noindex" : score >= 80 && blockers.length === 0 ? "indexable" : "draft";

  return {
    score,
    decision,
    category_scores: {
      research_coverage: Math.round(capped(researchCoverage, 30)),
      uniqueness: Math.round(capped(uniqueness, 30)),
      page_readiness: Math.round(capped(pageReadiness, 25)),
      trust_and_supply: Math.round(capped(trustAndSupply, 15)),
    },
    blockers,
    repair_actions: repairActions,
  };
}
