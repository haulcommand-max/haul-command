export type SourceType =
  | "official_government"
  | "official_pdf"
  | "industry_association"
  | "training_authority"
  | "competitor_resource"
  | "public_business_directory"
  | "company_website"
  | "forum_social_job_board"
  | "generic_blog"
  | "spam_unknown_private";

export type DurableOutputRoute =
  | "regulation_fact"
  | "glossary_candidate"
  | "directory_entity_candidate"
  | "listing_shell"
  | "corridor_signal"
  | "labor_signal"
  | "load_signal"
  | "authority_source"
  | "competitor_gap"
  | "training_gap"
  | "adgrid_market_signal"
  | "seo_page_opportunity"
  | "claim_machine_target";

export interface SourceCandidate {
  url: string;
  title?: string;
  sourceType: SourceType;
  topic?: string;
  countryCode?: string;
  admin1Code?: string | null;
}

export interface SourceScore {
  score: number;
  reason: string;
  candidate: SourceCandidate;
}

export interface FirecrawlDecision {
  action:
    | "firecrawl_scrape"
    | "conditional_firecrawl"
    | "tavily_extract_first"
    | "low_confidence_discovery"
    | "reject_or_low_confidence";
  requiresMoneyPath: boolean;
  reason: string;
}

export interface FirecrawlJobPolicy {
  endpoint: "scrape" | "crawl" | "map" | "search" | "json" | "screenshot" | "branding" | "browser";
  url?: string;
  query?: string;
  sourceScore: number;
  limit?: number;
  maxDiscoveryDepth?: number;
  allowExternalLinks?: boolean;
  allowSubdomains?: boolean;
  premiumModes?: Array<"json" | "query" | "pdf" | "screenshot" | "branding" | "enhanced_proxy" | "browser" | "agent">;
  moneyPathReason?: string;
  outputRoutes: DurableOutputRoute[];
  manualApproval?: boolean;
}

const SOURCE_TYPE_SCORES: Record<SourceType, number> = {
  official_government: 100,
  official_pdf: 95,
  industry_association: 85,
  training_authority: 80,
  competitor_resource: 70,
  public_business_directory: 60,
  company_website: 55,
  forum_social_job_board: 40,
  generic_blog: 20,
  spam_unknown_private: 0,
};

export function scoreSourceCandidate(candidate: SourceCandidate): SourceScore {
  const score = SOURCE_TYPE_SCORES[candidate.sourceType] ?? 0;
  return {
    score,
    candidate,
    reason: `${candidate.sourceType} source scored ${score} for ${candidate.topic ?? "general intelligence"}`,
  };
}

export function decideFirecrawlAction(score: SourceScore): FirecrawlDecision {
  if (score.score >= 90) {
    return {
      action: "firecrawl_scrape",
      requiresMoneyPath: false,
      reason: "High-confidence authority source; proof capture is allowed.",
    };
  }

  if (score.score >= 70) {
    return {
      action: "conditional_firecrawl",
      requiresMoneyPath: true,
      reason: "Useful source, but Firecrawl should spend credits only when it supports a durable path.",
    };
  }

  if (score.score >= 50) {
    return {
      action: "tavily_extract_first",
      requiresMoneyPath: true,
      reason: "Candidate should be triaged through cheap extraction before Firecrawl.",
    };
  }

  if (score.score >= 30) {
    return {
      action: "low_confidence_discovery",
      requiresMoneyPath: true,
      reason: "Store as low-confidence discovery only.",
    };
  }

  return {
    action: "reject_or_low_confidence",
    requiresMoneyPath: true,
    reason: "Rejected or stored only as low-confidence discovery.",
  };
}

export function validateFirecrawlJob(job: FirecrawlJobPolicy): { ok: true } {
  if (job.outputRoutes.length === 0) {
    throw new Error("Every Firecrawl job must route to at least one durable output path.");
  }

  if (job.endpoint === "crawl") {
    if (!job.limit || job.limit <= 0) {
      throw new Error("Firecrawl crawl jobs require an explicit limit.");
    }
    if (job.limit > 100 && !job.manualApproval) {
      throw new Error("Firecrawl crawl limits above 100 require manual approval.");
    }
    if (typeof job.maxDiscoveryDepth !== "number") {
      throw new Error("Firecrawl crawl jobs require maxDiscoveryDepth.");
    }
    if (job.allowExternalLinks === true && !job.manualApproval) {
      throw new Error("External crawl links require manual approval.");
    }
    if (job.allowSubdomains === true && !job.manualApproval) {
      throw new Error("Subdomain crawl expansion requires manual approval.");
    }
  }

  if ((job.premiumModes?.length ?? 0) > 0 && !job.moneyPathReason) {
    throw new Error("Premium Firecrawl modes require a money-path reason.");
  }

  return { ok: true };
}
