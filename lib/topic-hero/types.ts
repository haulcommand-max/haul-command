export type TopicHeroTier = "tier1" | "tier2" | "tier3" | "tier4";

export type TopicHeroPageFamily =
  | "homepage"
  | "tools"
  | "tool-detail"
  | "glossary"
  | "glossary-term"
  | "regulations"
  | "regulation-detail"
  | "training"
  | "training-detail"
  | "directory"
  | "directory-category"
  | "profile"
  | "route-intel"
  | "corridor"
  | "market-data"
  | "load-board"
  | "load-detail"
  | "country"
  | "region"
  | "city"
  | "role"
  | "service"
  | "sponsor"
  | "claim"
  | "pricing"
  | "dashboard"
  | "admin"
  | "auth"
  | "utility";

export type TopicHeroVisualPreset =
  | "command-center"
  | "tools-dashboard"
  | "semantic-map"
  | "regulatory-threshold"
  | "training-badges"
  | "provider-graph"
  | "route-intel-map"
  | "market-heatmap"
  | "load-matching"
  | "profile-proof-card"
  | "country-market"
  | "corridor-lane"
  | "sponsor-inventory"
  | "utility-console";

export type TopicHeroAnimationPreset =
  | "none"
  | "search-rotation"
  | "digits-tick"
  | "route-draw"
  | "term-connect"
  | "threshold-sweep"
  | "badge-progress"
  | "pin-pulse"
  | "heat-breathe"
  | "load-ticker"
  | "trust-meter";

export type TopicHeroSearchMode = "global" | "scoped" | "dual" | "action-only";

export type TopicHeroSchemaType =
  | "Organization"
  | "WebPage"
  | "CollectionPage"
  | "SoftwareApplication"
  | "WebApplication"
  | "DefinedTerm"
  | "DefinedTermSet"
  | "Dataset"
  | "Course"
  | "ItemList"
  | "ProfilePage"
  | "Service"
  | "BreadcrumbList"
  | "FAQPage";

export type TopicHeroLink = {
  label: string;
  href: string;
  intent?: string;
  description?: string;
};

export type TopicHeroCta = TopicHeroLink & {
  style?: "primary" | "secondary" | "ghost";
};

export type TopicHeroBadge = {
  label: string;
  value?: string | number;
  tone?: "gold" | "green" | "blue" | "slate" | "red";
};

export type TopicHeroStat = {
  label: string;
  value: string | number;
  helper?: string;
};

export type TopicHeroAdSlot = {
  surface: string;
  placementId: string;
  intent:
    | "claim"
    | "directory"
    | "training"
    | "permits"
    | "glossary"
    | "infrastructure"
    | "loads"
    | "corridor"
    | "tools"
    | "advertise";
  variant?: "banner" | "card" | "compact";
};

export type TopicHeroNoResultFallback = {
  headline: string;
  actions: TopicHeroLink[];
};

export type TopicHeroImageMetadata = {
  filename: string;
  src?: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  ogImage?: string;
  twitterImage?: string;
  blurDataUrl?: string;
  preload?: boolean;
};

export type TopicHeroConfig = {
  pageFamily: TopicHeroPageFamily;
  pageTopic: string;
  pageSubtopic?: string;
  routePattern: string;
  heroTier: TopicHeroTier;
  h1: string;
  eyebrow?: string;
  subheadline: string;
  microcopy?: string;
  heroVisualPreset: TopicHeroVisualPreset;
  animationPreset: TopicHeroAnimationPreset;
  searchMode: TopicHeroSearchMode;
  searchScope: string;
  searchAction?: string;
  searchParamName?: string;
  searchPlaceholder: string;
  secondarySearchPlaceholder?: string;
  askTitle: string;
  askPrompt: string;
  askPlaceholder: string;
  quickChips: TopicHeroLink[];
  rotatingLeftPills?: string[];
  rotatingRightPills?: string[];
  primaryCTA: TopicHeroCta;
  secondaryCTA?: TopicHeroCta;
  tertiaryCTA?: TopicHeroCta;
  trustBadges: TopicHeroBadge[];
  proofStates?: TopicHeroBadge[];
  statCards: TopicHeroStat[];
  houseAdSlot?: TopicHeroAdSlot;
  adGridSlot?: {
    zone: string;
    country?: string;
    corridor?: string;
    topic?: string;
  };
  internalLinks: TopicHeroLink[];
  relatedTools?: TopicHeroLink[];
  relatedGlossaryTerms?: TopicHeroLink[];
  relatedRegulations?: TopicHeroLink[];
  relatedTraining?: TopicHeroLink[];
  relatedDirectoryCategories?: TopicHeroLink[];
  relatedNextSteps: TopicHeroLink[];
  countryScope?: string;
  regionScope?: string;
  cityScope?: string;
  corridorScope?: string;
  roleScope?: string;
  schemaType: TopicHeroSchemaType[];
  ogImageTemplate: string;
  imageAltTemplate: string;
  image: TopicHeroImageMetadata;
  canonicalSlug: string;
  noResultFallback: TopicHeroNoResultFallback;
  mobileBehavior: "full" | "stacked" | "compact";
  prefersReducedMotionBehavior: "pause" | "static" | "hide-nonessential";
  sourceConfidence?: "verified" | "source-backed" | "developing" | "low-confidence";
  legalDisclaimer?: string;
};

export type TopicHeroRouteCoverage = {
  route: string;
  sourcePath?: string;
  pageFamily: TopicHeroPageFamily;
  heroTier: TopicHeroTier;
  heroVisualPreset: TopicHeroVisualPreset;
  animationPreset: TopicHeroAnimationPreset;
  searchScope: string;
  askScope: string;
  metadataStatus: "specific" | "derived" | "fallback";
  ogImageStatus: "specific" | "family" | "fallback";
  internalLinkStatus: "specific" | "derived" | "fallback";
  conversionPathStatus: "specific" | "derived" | "fallback";
  classificationSource: "explicit" | "pattern" | "fallback";
  missingItems: string[];
};
