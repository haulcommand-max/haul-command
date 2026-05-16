import type { SupabaseClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

export interface CorridorSeoPageRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  canonical_url: string | null;
  jsonld: unknown;
  content_blocks: unknown;
  lastmod: string | null;
  index_state: string | null;
  published: boolean | null;
  country_code: string | null;
  geo_key: string | null;
  publish_status: string | null;
  updated_at: string | null;
}

export interface CorridorSeoPageModel {
  id: string;
  slug: string;
  title: string;
  h1: string;
  description: string;
  canonicalPath: string;
  originLabel: string;
  destinationLabel: string;
  serviceLabel: string;
  countryCode: string;
  geoKey: string | null;
  sourceConfidenceLabel: string;
  sourceConfidenceDetail: string;
  shouldIndex: boolean;
  hasUsefulContent: boolean;
  published: boolean;
  indexState: string;
  publishStatus: string;
  updatedAt: string | null;
  jsonld: unknown;
}

const SERVICE_SUFFIXES: Array<{ suffix: string; label: string }> = [
  { suffix: "heavy-haul", label: "Heavy haul route support" },
  { suffix: "oversize-load", label: "Oversize load route support" },
  { suffix: "pilot-car", label: "Pilot car and escort support" },
  { suffix: "escort", label: "Pilot car and escort support" },
  { suffix: "permit", label: "Permit and routing support" },
];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function titleCaseToken(token: string) {
  return token
    .split("-")
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function formatPlace(tokens: string[]) {
  if (tokens.length === 0) return "Route endpoint";
  if (tokens.length === 1) return titleCaseToken(tokens[0]);

  const [region, ...cityParts] = tokens;
  const city = titleCaseToken(cityParts.join("-"));
  return city ? `${city}, ${region.toUpperCase()}` : region.toUpperCase();
}

function extractServiceSuffix(tokens: string[]) {
  const joined = tokens.join("-");
  const match = SERVICE_SUFFIXES.find((service) => joined.endsWith(`-${service.suffix}`) || joined === service.suffix);

  if (!match) {
    return { serviceLabel: "Heavy haul route support", remainingTokens: tokens };
  }

  const suffixLength = match.suffix.split("-").length;
  return {
    serviceLabel: match.label,
    remainingTokens: tokens.slice(0, Math.max(0, tokens.length - suffixLength)),
  };
}

export function normalizeCorridorSeoSlug(slug: string) {
  return String(slug ?? "")
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .replace(/^corridors\//, "")
    .replace(/\/+$/, "");
}

export function parseCorridorServiceSlug(slug: string) {
  const normalized = normalizeCorridorSeoSlug(slug);
  const [originRaw, destinationRaw] = normalized.split("-to-");
  const originTokens = (originRaw ?? "").split("-").filter(Boolean);
  const destinationTokens = (destinationRaw ?? "").split("-").filter(Boolean);
  const countryCode = originTokens.length > 0 && originTokens[0].length === 2 ? originTokens[0].toUpperCase() : "US";
  const originPlaceTokens = originTokens[0]?.length === 2 ? originTokens.slice(1) : originTokens;
  const { serviceLabel, remainingTokens } = extractServiceSuffix(destinationTokens);

  return {
    countryCode,
    originLabel: formatPlace(originPlaceTokens),
    destinationLabel: formatPlace(remainingTokens),
    serviceLabel,
  };
}

export function hasUsefulCorridorSeoContent(contentBlocks: unknown) {
  if (!isRecord(contentBlocks)) return false;

  const body = [
    contentBlocks.body,
    contentBlocks.body_markdown,
    contentBlocks.markdown,
    contentBlocks.intro,
    contentBlocks.summary,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .trim();

  return body.length >= 160;
}

function getContentH1(contentBlocks: unknown) {
  if (!isRecord(contentBlocks)) return null;
  return typeof contentBlocks.h1 === "string" && contentBlocks.h1.trim() ? contentBlocks.h1.trim() : null;
}

function canonicalPathFromRow(row: CorridorSeoPageRow) {
  if (row.canonical_url) {
    try {
      const url = new URL(row.canonical_url, "https://www.haulcommand.com");
      return url.pathname || `/corridors/${normalizeCorridorSeoSlug(row.slug)}`;
    } catch {
      if (row.canonical_url.startsWith("/")) return row.canonical_url;
    }
  }

  return `/corridors/${normalizeCorridorSeoSlug(row.slug)}`;
}

export function buildCorridorSeoPageModel(row: CorridorSeoPageRow): CorridorSeoPageModel {
  const slug = normalizeCorridorSeoSlug(row.slug);
  const parsed = parseCorridorServiceSlug(slug);
  const hasUsefulContent = hasUsefulCorridorSeoContent(row.content_blocks);
  const published = row.published === true;
  const indexState = row.index_state || "noindex";
  const shouldIndex = published && indexState === "index" && hasUsefulContent;
  const h1 = getContentH1(row.content_blocks) || row.title || `${parsed.originLabel} to ${parsed.destinationLabel} Heavy Haul`;
  const description =
    row.description ||
    `${parsed.serviceLabel} for ${parsed.originLabel} to ${parsed.destinationLabel}. This corridor page is source-labeled while Haul Command verifies route, permit, operator, and support coverage.`;

  return {
    id: row.id,
    slug,
    title: row.title || h1,
    h1,
    description,
    canonicalPath: canonicalPathFromRow(row),
    originLabel: parsed.originLabel,
    destinationLabel: parsed.destinationLabel,
    serviceLabel: parsed.serviceLabel,
    countryCode: row.country_code || parsed.countryCode,
    geoKey: row.geo_key,
    sourceConfidenceLabel: hasUsefulContent && published ? "Source-backed page" : "Seeded corridor page",
    sourceConfidenceDetail: hasUsefulContent
      ? "This page has stored content blocks and still keeps route-specific source confidence visible."
      : "The seed row has title, H1, description, and route intent, but content blocks are still empty. Use the actions below instead of treating this as verified route guidance.",
    shouldIndex,
    hasUsefulContent,
    published,
    indexState,
    publishStatus: row.publish_status || (published ? "published" : "draft"),
    updatedAt: row.updated_at,
    jsonld: row.jsonld,
  };
}

export async function getCorridorSeoPageBySlug(supabase: SupabaseClient, slug: string) {
  const normalized = normalizeCorridorSeoSlug(slug);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("hc_seo_pages")
    .select(
      "id, slug, title, description, canonical_url, jsonld, content_blocks, lastmod, index_state, published, country_code, geo_key, publish_status, updated_at",
    )
    .eq("page_type", "corridor_service")
    .eq("slug", normalized)
    .maybeSingle();

  if (error || !data) return null;
  return buildCorridorSeoPageModel(data as CorridorSeoPageRow);
}
