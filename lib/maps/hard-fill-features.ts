import type { Database, Json } from "@/types/supabase";

type LoadRow = Pick<
  Database["public"]["Tables"]["loads"]["Row"],
  "id" | "title" | "origin_lat" | "origin_lng" | "origin_city" | "origin_state" | "status"
>;

export type HardFillIntelRow = Pick<
  Database["public"]["Tables"]["hard_fill_intelligence"]["Row"],
  "load_id" | "computed_at" | "hard_fill_risk_score_01" | "hard_fill_label" | "top_reasons"
>;

export type HardFillFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    load_id: string;
    title: string;
    hard_fill_label: string;
    hard_fill_risk_score_01: number;
    computed_at: string | null;
    city: string;
    state: string;
    status: string;
    top_reasons: string[];
    source_status: "source_backed";
  };
};

export type HardFillFeatureCollection = {
  type: "FeatureCollection";
  source_status:
    | "source_backed"
    | "source_backed_empty"
    | "source_error"
    | "not_configured";
  features: HardFillFeature[];
};

const MAX_REASON_LENGTH = 140;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compactReason(value: unknown): string | null {
  if (typeof value === "string") return value.trim();
  if (isRecord(value)) {
    for (const key of ["reason", "label", "message", "name"]) {
      const candidate = value[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  }
  return null;
}

export function sanitizeHardFillReasons(value: Json | null, limit = 3): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(compactReason)
    .filter((reason): reason is string => Boolean(reason))
    .map((reason) =>
      reason.length > MAX_REASON_LENGTH
        ? `${reason.slice(0, MAX_REASON_LENGTH - 1).trim()}...`
        : reason,
    )
    .slice(0, limit);
}

function toFiniteNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildHardFillFeature(
  intel: HardFillIntelRow,
  load: LoadRow | undefined,
): HardFillFeature | null {
  if (!load) return null;

  const lat = toFiniteNumber(load.origin_lat);
  const lng = toFiniteNumber(load.origin_lng);
  if (lat === null || lng === null) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
    properties: {
      load_id: intel.load_id,
      title: load.title ?? "Open load",
      hard_fill_label: intel.hard_fill_label,
      hard_fill_risk_score_01: intel.hard_fill_risk_score_01,
      computed_at: intel.computed_at,
      city: load.origin_city ?? "",
      state: load.origin_state ?? "",
      status: load.status ?? "",
      top_reasons: sanitizeHardFillReasons(intel.top_reasons),
      source_status: "source_backed",
    },
  };
}

export function buildHardFillFeatureCollection(
  intelRows: HardFillIntelRow[],
  loadRows: LoadRow[],
): HardFillFeatureCollection {
  const loadsById = new Map(loadRows.map((load) => [load.id, load]));
  const features = intelRows
    .map((intel) => buildHardFillFeature(intel, loadsById.get(intel.load_id)))
    .filter((feature): feature is HardFillFeature => Boolean(feature));

  return {
    type: "FeatureCollection",
    source_status: features.length > 0 ? "source_backed" : "source_backed_empty",
    features,
  };
}

export function emptyHardFillFeatureCollection(
  sourceStatus: HardFillFeatureCollection["source_status"] = "source_backed_empty",
): HardFillFeatureCollection {
  return {
    type: "FeatureCollection",
    source_status: sourceStatus,
    features: [],
  };
}
