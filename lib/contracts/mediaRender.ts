export const MEDIA_OBJECT_TYPES = [
  "profile",
  "claim",
  "load",
  "corridor",
  "country",
  "regulation",
  "glossary",
  "tool_result",
  "adgrid_sponsor",
  "house_ad",
  "training_lesson",
  "trust_score",
  "leaderboard",
  "routeintel_movie",
  "marketplace_product",
  "infrastructure_partner",
  "sponsor_recap",
  "operator_recap",
  "broker_recap",
  "data_product_report",
  "graphify_report",
] as const;

export const MEDIA_VIDEO_FORMATS = ["six_second", "fifteen_second", "thirty_second", "sixty_second", "vertical", "square", "sixteen_by_nine", "dashboard_card"] as const;
export const MEDIA_RENDER_STATUSES = ["queued", "rendering", "rendered", "failed", "needs_review", "cancelled"] as const;

export type MediaObjectType = (typeof MEDIA_OBJECT_TYPES)[number];
export type MediaVideoFormat = (typeof MEDIA_VIDEO_FORMATS)[number];
export type MediaRenderStatus = (typeof MEDIA_RENDER_STATUSES)[number];

export type MediaRenderRequest = {
  object_type: MediaObjectType;
  object_id?: string | null;
  object_label?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  corridor?: string | null;
  role?: string | null;
  language?: string | null;
  locale?: string | null;
  template_id?: string | null;
  video_format?: MediaVideoFormat;
  tone?: string | null;
  source_page?: string | null;
  script_hints?: string[];
  cta?: string | null;
  owner_user_id?: string | null;
  sponsor_id?: string | null;
  demand_event_id?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
};

const TEMPLATE_BY_OBJECT_TYPE: Record<MediaObjectType, string> = {
  profile: "profile-video-card",
  claim: "claim-profile-proof",
  load: "broker-load-blast",
  corridor: "corridor-intelligence",
  country: "country-launch-pack",
  regulation: "regulation-explainer",
  glossary: "glossary-definition",
  tool_result: "tool-result-explainer",
  adgrid_sponsor: "adgrid-sponsor-video",
  house_ad: "adgrid-house-ad",
  training_lesson: "training-lesson-preview",
  trust_score: "trust-score-explainer",
  leaderboard: "leaderboard-hype",
  routeintel_movie: "routeintel-route-movie",
  marketplace_product: "routeready-product-video",
  infrastructure_partner: "infrastructure-partner-video",
  sponsor_recap: "sponsor-roi-recap",
  operator_recap: "operator-monthly-recap",
  broker_recap: "broker-monthly-recap",
  data_product_report: "data-product-report-video",
  graphify_report: "graphify-market-map-video",
};

function cleanText(value: unknown, max = 240): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

function cleanStringArray(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, 180))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}

function cleanRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function normalizeMediaObjectType(value: unknown): MediaObjectType {
  if (typeof value === "string" && (MEDIA_OBJECT_TYPES as readonly string[]).includes(value)) {
    return value as MediaObjectType;
  }
  return "house_ad";
}

export function normalizeMediaVideoFormat(value: unknown): MediaVideoFormat {
  if (typeof value === "string" && (MEDIA_VIDEO_FORMATS as readonly string[]).includes(value)) {
    return value as MediaVideoFormat;
  }
  return "fifteen_second";
}

export function resolveMediaTemplateId(objectType: MediaObjectType, requested?: string | null): string {
  return cleanText(requested, 120) ?? TEMPLATE_BY_OBJECT_TYPE[objectType];
}

export function normalizeMediaRenderRequest(input: unknown): MediaRenderRequest {
  const source = cleanRecord(input);
  const objectType = normalizeMediaObjectType(source.object_type ?? source.objectType);

  return {
    object_type: objectType,
    object_id: cleanText(source.object_id ?? source.objectId, 180),
    object_label: cleanText(source.object_label ?? source.objectLabel, 240),
    country: cleanText(source.country, 80),
    region: cleanText(source.region, 120),
    city: cleanText(source.city, 120),
    corridor: cleanText(source.corridor, 240),
    role: cleanText(source.role, 160),
    language: cleanText(source.language, 40) ?? "en",
    locale: cleanText(source.locale, 80),
    template_id: resolveMediaTemplateId(objectType, cleanText(source.template_id ?? source.templateId, 120)),
    video_format: normalizeMediaVideoFormat(source.video_format ?? source.videoFormat),
    tone: cleanText(source.tone, 120),
    source_page: cleanText(source.source_page ?? source.sourcePage, 600),
    script_hints: cleanStringArray(source.script_hints ?? source.scriptHints, 12),
    cta: cleanText(source.cta, 240),
    owner_user_id: cleanText(source.owner_user_id ?? source.ownerUserId, 80),
    sponsor_id: cleanText(source.sponsor_id ?? source.sponsorId, 80),
    demand_event_id: cleanText(source.demand_event_id ?? source.demandEventId, 80),
    priority: ["low", "normal", "high", "urgent"].includes(String(source.priority)) ? source.priority as MediaRenderRequest["priority"] : "normal",
  };
}

export function buildMediaRenderInsert(input: unknown) {
  const payload = normalizeMediaRenderRequest(input);
  return {
    object_type: payload.object_type,
    object_id: payload.object_id,
    object_label: payload.object_label,
    country: payload.country,
    region: payload.region,
    city: payload.city,
    corridor: payload.corridor,
    role: payload.role,
    language: payload.language,
    locale: payload.locale,
    template_id: payload.template_id,
    video_format: payload.video_format,
    tone: payload.tone,
    source_page: payload.source_page,
    script_hints: payload.script_hints ?? [],
    cta: payload.cta,
    owner_user_id: payload.owner_user_id,
    sponsor_id: payload.sponsor_id,
    demand_event_id: payload.demand_event_id,
    priority: payload.priority ?? "normal",
    render_status: "queued",
  };
}

export function listMediaTemplates() {
  return Object.entries(TEMPLATE_BY_OBJECT_TYPE).map(([object_type, template_id]) => ({ object_type, template_id }));
}
