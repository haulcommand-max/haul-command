import type {
  ContentPacketInsert,
  DistributionJobSpec,
  MarketSignalUpsertPayload,
  SignalIngestPayload,
} from "@/types/market-signal";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid ${field}`);
  }
  return value.trim();
};

const asOptionalString = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Expected optional string");
  return value;
};

const asOptionalNumber = (value: unknown, defaultValue = 0): number => {
  if (value === undefined || value === null || value === "") return defaultValue;
  const n = Number(value);
  if (Number.isNaN(n)) throw new Error("Expected number");
  return n;
};

export const parseSignalIngestPayload = (input: unknown): SignalIngestPayload => {
  if (!isObject(input)) throw new Error("Payload must be an object");

  return {
    event_name: asString(input.event_name, "event_name"),
    object_type: asString(input.object_type, "object_type"),
    object_id: asString(input.object_id, "object_id"),
    payload_json: isObject(input.payload_json) ? input.payload_json : {},
    country_code: asOptionalString(input.country_code),
    region_code: asOptionalString(input.region_code),
    city_slug: asOptionalString(input.city_slug),
    corridor_id: asOptionalString(input.corridor_id),
    severity: asOptionalNumber(input.severity, 0),
    confidence: asOptionalNumber(input.confidence, 0),
    source_system:
      typeof input.source_system === "string" && input.source_system
        ? input.source_system
        : "app",
    dedupe_key: asOptionalString(input.dedupe_key),
  };
};

export const parseMarketSignalUpsertPayload = (
  input: unknown,
): MarketSignalUpsertPayload => {
  if (!isObject(input)) throw new Error("Payload must be an object");

  return {
    signal_type: asString(input.signal_type, "signal_type"),
    source_event_id: asOptionalString(input.source_event_id),
    object_type: asString(input.object_type, "object_type"),
    object_id: asString(input.object_id, "object_id"),
    geo_scope:
      typeof input.geo_scope === "string" && input.geo_scope ? input.geo_scope : "global",
    country_code: asOptionalString(input.country_code),
    region_code: asOptionalString(input.region_code),
    city_slug: asOptionalString(input.city_slug),
    corridor_id: asOptionalString(input.corridor_id),
    signal_score: asOptionalNumber(input.signal_score, 0),
    urgency_score: asOptionalNumber(input.urgency_score, 0),
    seo_value_score: asOptionalNumber(input.seo_value_score, 0),
    claim_value_score: asOptionalNumber(input.claim_value_score, 0),
    monetization_value_score: asOptionalNumber(input.monetization_value_score, 0),
    liquidity_value_score: asOptionalNumber(input.liquidity_value_score, 0),
    quality_score: asOptionalNumber(input.quality_score, 0),
    expires_at: asOptionalString(input.expires_at),
    meta_json: isObject(input.meta_json) ? input.meta_json : {},
  };
};

export const parseDistributionJobs = (input: unknown): DistributionJobSpec[] => {
  if (!Array.isArray(input)) throw new Error("jobs must be an array");

  return input.map((item) => {
    if (!isObject(item)) throw new Error("Invalid job item");

    return {
      channel: asString(item.channel, "channel"),
      account_key: asOptionalString(item.account_key),
      publish_mode:
        item.publish_mode === "autopublish" ||
        item.publish_mode === "draft_only" ||
        item.publish_mode === "manual_review"
          ? item.publish_mode
          : "draft_only",
      scheduled_for: asOptionalString(item.scheduled_for),
      priority_score: asOptionalNumber(item.priority_score, 0),
    };
  });
};

export const assertContentPacket = (input: ContentPacketInsert): ContentPacketInsert => {
  if (!input.signal_id) throw new Error("signal_id is required");
  if (!input.packet_type) throw new Error("packet_type is required");
  if (!input.object_type) throw new Error("object_type is required");
  if (!input.object_id) throw new Error("object_id is required");
  if (!input.packet_json?.hook) throw new Error("packet_json.hook is required");
  if (!input.packet_json?.body) throw new Error("packet_json.body is required");
  if (!input.packet_json?.primary_cta) throw new Error("packet_json.primary_cta is required");
  return input;
};
