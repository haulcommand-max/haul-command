export type AdgridServeContext = {
  placement?: string | null;
  surface?: string | null;
  zone?: string | null;
  corridor?: string | null;
  country?: string | null;
  role?: string | null;
};

export type AdgridCreativeRow = {
  campaign_id?: string | null;
  creative_id?: string | null;
  headline?: string | null;
  description?: string | null;
  body?: string | null;
  subhead?: string | null;
  cta_text?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  image_url?: string | null;
  image_landscape_url?: string | null;
  image_square_url?: string | null;
  sponsor_label?: string | null;
  advertiser_name?: string | null;
  page_types?: string[] | null;
  country_slugs?: string[] | null;
  corridor_slugs?: string[] | null;
  service_slugs?: string[] | null;
  ab_variant?: string | null;
};

export type NormalizedAdgridCreative = {
  campaign_id: string | null;
  creative_id: string | null;
  headline: string;
  body: string;
  cta_label: string;
  cta_url: string | null;
  image_url: string | null;
  sponsor_label: string;
  advertiser_name: string;
  page_types: string[];
  country_slugs: string[];
  corridor_slugs: string[];
  service_slugs: string[];
  variant: string | null;
};

function compactSlug(value?: string | null) {
  return value?.trim().toLowerCase() || "";
}

function matchesTarget(targets: string[], value?: string | null) {
  if (targets.length === 0) return true;
  const normalized = compactSlug(value);
  return Boolean(normalized) && targets.map(compactSlug).includes(normalized);
}

export function buildAdgridPlacementKey(context: AdgridServeContext) {
  const placement = context.surface || context.zone || context.placement || "homepage_hero";
  return context.corridor ? `${placement}:${context.corridor}` : placement;
}

export function normalizeAdgridCreative(row: AdgridCreativeRow): NormalizedAdgridCreative {
  return {
    campaign_id: row.campaign_id ?? null,
    creative_id: row.creative_id ?? null,
    headline: row.headline || row.subhead || "Haul Command sponsor",
    body: row.body || row.description || "",
    cta_label: row.cta_label || row.cta_text || "Learn More",
    cta_url: row.cta_url ?? null,
    image_url: row.image_landscape_url || row.image_square_url || row.image_url || null,
    sponsor_label: row.sponsor_label || "sponsored",
    advertiser_name: row.advertiser_name || "",
    page_types: row.page_types ?? [],
    country_slugs: row.country_slugs ?? [],
    corridor_slugs: row.corridor_slugs ?? [],
    service_slugs: row.service_slugs ?? [],
    variant: row.ab_variant ?? null,
  };
}

export function creativeMatchesAdgridContext(
  creative: NormalizedAdgridCreative,
  context: AdgridServeContext,
) {
  const placement = context.surface || context.zone || context.placement;
  return (
    matchesTarget(creative.page_types, placement) &&
    matchesTarget(creative.country_slugs, context.country) &&
    matchesTarget(creative.corridor_slugs, context.corridor) &&
    matchesTarget(creative.service_slugs, context.role)
  );
}

export function buildAdgridImpressionInsert(
  ad: Pick<AdgridCreativeRow, "campaign_id" | "creative_id">,
  context: { placementKey: string; country?: string | null },
) {
  if (!ad.campaign_id) return null;

  return {
    table: "hc_ad_impressions" as const,
    payload: {
      campaign_id: ad.campaign_id,
      creative_id: ad.creative_id ?? null,
      placement_key: context.placementKey,
      viewer_country: context.country ?? null,
      viewable: false,
    },
  };
}
