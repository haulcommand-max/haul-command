export type TrainingCatalogRow = {
  slug: string;
  title: string;
  summary?: string | null;
  training_type?: string | null;
  credential_level?: string | null;
  module_count?: number | null;
  hours_total?: number | null;
  pricing_mode?: string | null;
  price_cents?: number | null;
  currency?: string | null;
  price_display?: string | null;
  requirement_fit?: string | null;
  ranking_impact?: string | null;
  sponsor_eligible?: boolean | null;
  [key: string]: unknown;
};

type LegacyTrainingHubPayload = {
  catalog?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function formatTrainingPrice(input: {
  pricing_mode?: string | null;
  price_cents?: number | string | null;
  currency?: string | null;
  price_display?: string | null;
}): string {
  const mode = input.pricing_mode?.toLowerCase() ?? "";
  const cents = toNumber(input.price_cents);

  if (mode === "free" || cents === 0) return "Free";
  if (cents && cents > 0) {
    const currency = (input.currency || "USD").toUpperCase();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  }

  return input.price_display?.trim() || (mode === "paid" ? "PAID" : "Contact sales");
}

export function normalizeTrainingCatalogItem(row: unknown): TrainingCatalogRow | null {
  if (!isRecord(row)) return null;

  const slug = toStringValue(row.slug);
  const title = toStringValue(row.title);
  if (!slug || !title) return null;

  const priceCents = toNumber(row.price_cents);
  const pricingMode =
    toStringValue(row.pricing_mode) ??
    (priceCents === 0 ? "free" : priceCents && priceCents > 0 ? "paid" : "paid");

  return {
    ...row,
    slug,
    title,
    summary: toStringValue(row.summary),
    training_type: toStringValue(row.training_type) ?? "course",
    credential_level: toStringValue(row.credential_level) ?? "road_ready",
    module_count: toNumber(row.module_count) ?? 0,
    hours_total: toNumber(row.hours_total) ?? 0,
    pricing_mode: pricingMode,
    price_cents: priceCents,
    currency: toStringValue(row.currency) ?? "USD",
    price_display: formatTrainingPrice({
      pricing_mode: pricingMode,
      price_cents: priceCents,
      currency: toStringValue(row.currency) ?? "USD",
      price_display: toStringValue(row.price_display),
    }),
    requirement_fit: toStringValue(row.requirement_fit) ?? "useful",
    ranking_impact: toStringValue(row.ranking_impact),
    sponsor_eligible: Boolean(row.sponsor_eligible),
  };
}

export function extractTrainingCatalogRows(payload: unknown): TrainingCatalogRow[] {
  const sourceRows = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray((payload as LegacyTrainingHubPayload).catalog)
      ? (payload as LegacyTrainingHubPayload).catalog
      : [];

  return sourceRows
    .map(normalizeTrainingCatalogItem)
    .filter((row): row is TrainingCatalogRow => Boolean(row));
}

export function isPaidTraining(row: Pick<TrainingCatalogRow, "pricing_mode" | "price_cents">) {
  const cents = toNumber(row.price_cents);
  return row.pricing_mode?.toLowerCase() === "paid" && Boolean(cents && cents > 0);
}
