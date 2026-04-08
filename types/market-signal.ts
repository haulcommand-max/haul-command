export type HcSignalStatus =
  | "queued"
  | "processed"
  | "failed"
  | "expired"
  | "archived";

export type HcPacketStatus =
  | "draft"
  | "qa_pending"
  | "review_required"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "retired";

export type HcDistributionStatus =
  | "queued"
  | "scheduled"
  | "published"
  | "failed"
  | "cancelled";

export type HcPublishMode = "autopublish" | "draft_only" | "manual_review";
export type HcRiskLevel = "low" | "medium" | "high";

export type SignalIngestPayload = {
  event_name: string;
  object_type: string;
  object_id: string;
  payload_json?: Record<string, unknown>;
  country_code?: string | null;
  region_code?: string | null;
  city_slug?: string | null;
  corridor_id?: string | null;
  severity?: number;
  confidence?: number;
  source_system?: string;
  dedupe_key?: string | null;
};

export type MarketSignalUpsertPayload = {
  signal_type: string;
  source_event_id: string | null;
  object_type: string;
  object_id: string;
  geo_scope?: string;
  country_code?: string | null;
  region_code?: string | null;
  city_slug?: string | null;
  corridor_id?: string | null;
  signal_score?: number;
  urgency_score?: number;
  seo_value_score?: number;
  claim_value_score?: number;
  monetization_value_score?: number;
  liquidity_value_score?: number;
  quality_score?: number;
  expires_at?: string | null;
  meta_json?: Record<string, unknown>;
};

export type DistributionJobSpec = {
  channel: string;
  account_key?: string | null;
  publish_mode?: HcPublishMode;
  scheduled_for?: string | null;
  priority_score?: number;
};

export type PacketJson = {
  hook: string;
  body: string;
  primary_cta: string;
  secondary_cta?: string | null;
  internal_link_targets?: string[];
  onsite_targets?: string[];
};

export type ContentPacketInsert = {
  signal_id: string;
  packet_type: string;
  object_type: string;
  object_id: string;
  geo_scope?: string;
  country_code?: string | null;
  region_code?: string | null;
  city_slug?: string | null;
  corridor_id?: string | null;
  language_code?: string;
  risk_level?: HcRiskLevel;
  narrative_angle?: string | null;
  hook_text?: string | null;
  primary_cta?: string | null;
  secondary_cta?: string | null;
  packet_json: PacketJson;
  onsite_surface_targets_json?: Array<Record<string, unknown>>;
  channel_targets_json?: Array<Record<string, unknown>>;
  review_required?: boolean;
};
