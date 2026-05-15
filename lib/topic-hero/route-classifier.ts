import routePatterns from "./route-patterns.json";
import { getTopicVisualOntology } from "./ontology";
import type {
  TopicHeroPageFamily,
  TopicHeroRouteCoverage,
  TopicHeroTier,
} from "./types";

type RoutePatternRecord = {
  id: string;
  match: string;
  pageFamily: TopicHeroPageFamily;
  heroTier: TopicHeroTier;
  classificationSource: TopicHeroRouteCoverage["classificationSource"];
};

const ROUTE_PATTERNS = routePatterns as RoutePatternRecord[];

const tierMetadataStatus: Record<TopicHeroTier, TopicHeroRouteCoverage["metadataStatus"]> = {
  tier1: "specific",
  tier2: "derived",
  tier3: "derived",
  tier4: "fallback",
};

const tierOgStatus: Record<TopicHeroTier, TopicHeroRouteCoverage["ogImageStatus"]> = {
  tier1: "specific",
  tier2: "family",
  tier3: "family",
  tier4: "fallback",
};

function buildMissingItems(source: TopicHeroRouteCoverage["classificationSource"], tier: TopicHeroTier) {
  const missing: string[] = [];
  if (source === "fallback") {
    missing.push("needs explicit route pattern");
    missing.push("needs page-family-specific copy review");
  }
  if (tier === "tier4") {
    missing.push("compact utility hero only; review if page is indexable");
  }
  return missing;
}

export function normalizeRoutePattern(route: string) {
  if (!route || route === "/") return "/";
  return `/${route.replace(/^\/+|\/+$/g, "")}`;
}

export function classifyTopicHeroRoute(route: string, sourcePath?: string): TopicHeroRouteCoverage {
  const normalized = normalizeRoutePattern(route);
  const record =
    ROUTE_PATTERNS.find((pattern) => new RegExp(pattern.match).test(normalized)) ??
    ROUTE_PATTERNS[ROUTE_PATTERNS.length - 1];
  const ontology = getTopicVisualOntology(record.pageFamily);
  const metadataStatus = record.classificationSource === "fallback" ? "fallback" : tierMetadataStatus[record.heroTier];
  const ogImageStatus = record.classificationSource === "fallback" ? "fallback" : tierOgStatus[record.heroTier];

  return {
    route: normalized,
    sourcePath,
    pageFamily: record.pageFamily,
    heroTier: record.heroTier,
    heroVisualPreset: ontology.visualPreset,
    animationPreset: ontology.animationPreset,
    searchScope: record.heroTier === "tier4" ? "context-action" : `${record.pageFamily}-scoped`,
    askScope: record.heroTier === "tier4" ? "next-action" : `${record.pageFamily}-ask`,
    metadataStatus,
    ogImageStatus,
    internalLinkStatus: record.classificationSource === "fallback" ? "fallback" : "derived",
    conversionPathStatus: record.classificationSource === "fallback" ? "fallback" : "derived",
    classificationSource: record.classificationSource,
    missingItems: buildMissingItems(record.classificationSource, record.heroTier),
  };
}

export function getTopicHeroRoutePatterns() {
  return ROUTE_PATTERNS;
}
