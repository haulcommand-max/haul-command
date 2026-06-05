export type LinkableAssetSignalInput = {
  sourceConfidence: number;
  sourceUrlCount: number;
  hasMethodology: boolean;
  hasDownloadableImage?: boolean;
  hasShortVideo?: boolean;
  hasYoutubeVideo?: boolean;
  hasEmbedCode?: boolean;
  hasShareButton?: boolean;
  hasFaq?: boolean;
  hasQuoteSheet?: boolean;
  countrySpecific?: boolean;
  roleSpecific?: boolean;
  corridorSpecific?: boolean;
  journalistPitchAngle?: string | null;
  podcastTalkingPointCount?: number;
};

export type LinkableAssetScores = {
  linkabilityScore: number;
  shareabilityScore: number;
  publishable: boolean;
  missing: string[];
};

export type OutreachGuardrailInput = {
  message: string;
  personalizedContext?: string | null;
  hasPriorInteraction?: boolean;
  asksForLinkDirectly?: boolean;
  includesUnverifiedClaim?: boolean;
  hasSourceBackedAsset?: boolean;
  relationshipStage?: "identified" | "warmed" | "source_given" | "pitched" | "quoted" | "linked" | "partner" | "do_not_contact";
};

export type OutreachGuardrailResult = {
  allowed: boolean;
  status: "approved" | "rejected" | "needs_human_review";
  reasons: string[];
};

export type ShareWidgetInput = {
  canonicalUrl: string;
  title: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

export type EmbedAttributionInput = {
  assetTitle: string;
  canonicalUrl: string;
  nofollow?: boolean;
};

export type PrSourcePlatform =
  | "haro_featured"
  | "featured"
  | "qwoted"
  | "source_of_sources"
  | "podcast"
  | "newsletter"
  | "direct"
  | "social"
  | "association"
  | "manual"
  | "other";

const GENERIC_OUTREACH_PATTERNS = [
  /\bgreat post\b/i,
  /\blove your content\b/i,
  /\bjust checking in\b/i,
  /\bcan you add (?:our|my) link\b/i,
  /\blink exchange\b/i,
  /\bsponsored guest post\b/i,
];

const UNVERIFIED_CLAIM_PATTERNS = [
  /\bverified network partners?\b/i,
  /\bguaranteed (?:jobs?|links?|coverage|traffic)\b/i,
  /\bmost trusted\b/i,
  /\b#1\b/i,
  /\blargest\b/i,
];

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasUsefulText(value?: string | null, minLength = 24): boolean {
  return typeof value === "string" && value.trim().length >= minLength;
}

export function normalizeCountryCodes(countryCodes?: string[]): string[] {
  return Array.from(
    new Set(
      (countryCodes ?? [])
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z]{2}$/.test(code)),
    ),
  ).sort();
}

export function scoreLinkableAsset(input: LinkableAssetSignalInput): LinkableAssetScores {
  const missing: string[] = [];
  if (input.sourceConfidence < 60) missing.push("source_confidence_below_60");
  if (input.sourceUrlCount < 1) missing.push("source_list_required");
  if (!input.hasMethodology) missing.push("methodology_required");
  if (!input.hasDownloadableImage && !input.hasShortVideo && !input.hasEmbedCode && !input.hasShareButton) {
    missing.push("shareable_or_embeddable_format_required");
  }

  const sourceScore = Math.min(25, input.sourceConfidence * 0.25);
  const citationScore = Math.min(15, input.sourceUrlCount * 5);
  const methodologyScore = input.hasMethodology ? 12 : 0;
  const mediaScore =
    (input.hasDownloadableImage ? 8 : 0) +
    (input.hasShortVideo ? 8 : 0) +
    (input.hasYoutubeVideo ? 6 : 0) +
    (input.hasEmbedCode ? 10 : 0);
  const specificityScore =
    (input.countrySpecific ? 5 : 0) +
    (input.roleSpecific ? 5 : 0) +
    (input.corridorSpecific ? 5 : 0);
  const journalistScore = hasUsefulText(input.journalistPitchAngle) ? 10 : 0;
  const podcastScore = Math.min(5, input.podcastTalkingPointCount ?? 0);

  const shareabilityScore = clampScore(
    (input.hasShareButton ? 25 : 0) +
      (input.hasDownloadableImage ? 20 : 0) +
      (input.hasShortVideo ? 20 : 0) +
      (input.hasEmbedCode ? 20 : 0) +
      (input.hasFaq ? 5 : 0) +
      (input.hasQuoteSheet ? 10 : 0),
  );

  const linkabilityScore = clampScore(
    sourceScore + citationScore + methodologyScore + mediaScore + specificityScore + journalistScore + podcastScore,
  );

  return {
    linkabilityScore,
    shareabilityScore,
    publishable: missing.length === 0,
    missing,
  };
}

export function validateOutreachGuardrails(input: OutreachGuardrailInput): OutreachGuardrailResult {
  const reasons: string[] = [];
  const message = input.message.trim();
  const personalized = hasUsefulText(input.personalizedContext, 40);

  if (input.relationshipStage === "do_not_contact") reasons.push("relationship_marked_do_not_contact");
  if (!personalized) reasons.push("personalized_context_required");
  if (GENERIC_OUTREACH_PATTERNS.some((pattern) => pattern.test(message))) reasons.push("generic_or_link_scheme_language");
  if (input.asksForLinkDirectly && !input.hasPriorInteraction) reasons.push("direct_link_ask_requires_prior_interaction");
  if (input.includesUnverifiedClaim || UNVERIFIED_CLAIM_PATTERNS.some((pattern) => pattern.test(message))) {
    reasons.push("unverified_claim_requires_review");
  }
  if (!input.hasSourceBackedAsset) reasons.push("source_backed_asset_required");

  if (reasons.length > 0) {
    return {
      allowed: false,
      status: reasons.includes("unverified_claim_requires_review") ? "needs_human_review" : "rejected",
      reasons,
    };
  }

  return { allowed: true, status: "approved", reasons: [] };
}

export function buildShareUrl(input: ShareWidgetInput): string {
  const url = new URL(input.canonicalUrl);
  url.searchParams.set("utm_source", input.source ?? "share_widget");
  url.searchParams.set("utm_medium", input.medium ?? "earned");
  url.searchParams.set("utm_campaign", input.campaign ?? "linkable_asset");
  if (input.content) url.searchParams.set("utm_content", input.content);
  return url.toString();
}

export function buildEmbedAttribution(input: EmbedAttributionInput): string {
  const rel = input.nofollow ? ' rel="nofollow noopener"' : ' rel="noopener"';
  return `<a href="${input.canonicalUrl}"${rel}>${input.assetTitle} - Haul Command</a>`;
}

export function classifyPrSourcePlatform(value?: string | null): PrSourcePlatform {
  const normalized = (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (normalized === "haro" || normalized === "haro_by_featured" || normalized === "featured_haro") return "haro_featured";
  if (normalized === "featured") return "featured";
  if (normalized === "qwoted") return "qwoted";
  if (normalized === "source_of_sources" || normalized === "sourceofsources") return "source_of_sources";
  if (normalized.includes("podcast")) return "podcast";
  if (normalized.includes("newsletter")) return "newsletter";
  if (normalized === "linkedin" || normalized === "x" || normalized === "twitter" || normalized === "social") return "social";
  if (normalized.includes("association")) return "association";
  if (normalized === "direct" || normalized === "email") return "direct";
  if (normalized === "manual" || normalized === "") return "manual";
  return "other";
}

export function buildJournalistModePrompt(intent?: string | null): string {
  const normalized = (intent ?? "").toLowerCase();
  if (normalized.includes("quote")) return "Need a quote? Share your deadline, topic, country, and whether you need an operator, broker, safety, or data source.";
  if (normalized.includes("data")) return "Need data? Tell us the role, country, corridor, and stat type you are trying to cite.";
  if (normalized.includes("source")) return "Need a source? Tell us the beat, geography, and whether you need an operator, broker, insurer, trainer, or infrastructure contact.";
  if (normalized.includes("visual")) return "Need a visual? Tell us whether you need a map, diagram, chart, short video, or embeddable card.";
  return "Are you looking for a quote, data, a source/operator, or a visual?";
}
