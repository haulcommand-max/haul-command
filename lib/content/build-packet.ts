import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assertContentPacket } from "@/lib/contracts/market-signal";
import type { ContentPacketInsert, HcRiskLevel } from "@/types/market-signal";

type MinimalSignalRow = {
  id: string;
  signal_type: string;
  object_type: string;
  object_id: string;
  geo_scope: string;
  country_code: string | null;
  region_code: string | null;
  city_slug: string | null;
  corridor_id: string | null;
  signal_score: number;
  urgency_score: number;
  seo_value_score: number;
  claim_value_score: number;
  monetization_value_score: number;
  meta_json: Record<string, unknown>;
};

const mapRiskLevel = (signal: MinimalSignalRow): HcRiskLevel => {
  if (signal.signal_type === "requirement_update") return "high";
  if (signal.claim_value_score >= 0.5 || signal.urgency_score >= 0.5) return "medium";
  return "low";
};

export const buildDefaultPacketFromSignal = (
  signal: MinimalSignalRow,
): ContentPacketInsert => {
  const primaryCta =
    signal.signal_type === "claim_pressure"
      ? "claim_profile"
      : signal.signal_type === "urgent_load"
        ? "view_urgent_load"
        : signal.signal_type === "corridor_heat"
          ? "view_corridor"
          : "view_details";

  const hook =
    signal.signal_type === "claim_pressure"
      ? "Your profile may already be getting searched."
      : signal.signal_type === "urgent_load"
        ? "Urgent support may be needed right now."
        : signal.signal_type === "corridor_heat"
          ? "This corridor is heating up."
          : "New market activity detected.";

  const body =
    signal.signal_type === "claim_pressure"
      ? "Complete and claim your profile to improve what buyers see."
      : signal.signal_type === "urgent_load"
        ? "This route has time-sensitive activity. Check the live details."
        : signal.signal_type === "corridor_heat"
          ? "Demand is shifting here. See coverage, recent activity, and nearby support."
          : "See the latest update and next best actions.";

  return assertContentPacket({
    signal_id: signal.id,
    packet_type: signal.signal_type,
    object_type: signal.object_type,
    object_id: signal.object_id,
    geo_scope: signal.geo_scope,
    country_code: signal.country_code,
    region_code: signal.region_code,
    city_slug: signal.city_slug,
    corridor_id: signal.corridor_id,
    language_code: "en",
    risk_level: mapRiskLevel(signal),
    narrative_angle: signal.signal_type,
    hook_text: hook,
    primary_cta: primaryCta,
    secondary_cta: "view_related",
    review_required: signal.signal_type === "requirement_update",
    packet_json: {
      hook,
      body,
      primary_cta: primaryCta,
      secondary_cta: "view_related",
      internal_link_targets: [
        "geo_parent",
        "related_profiles",
        "requirements",
        "corridors",
      ],
      onsite_targets: [
        `/${signal.object_type}/${signal.object_id}`,
      ],
    },
    onsite_surface_targets_json: [
      {
        surface_type: signal.object_type,
        surface_key: signal.object_id,
      },
    ],
    channel_targets_json: [
      { channel: "facebook" },
      { channel: "tiktok" },
    ],
  });
};

export const insertContentPacket = async (packet: ContentPacketInsert) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("hc_content_packets")
    .insert({
      signal_id: packet.signal_id,
      packet_type: packet.packet_type,
      object_type: packet.object_type,
      object_id: packet.object_id,
      geo_scope: packet.geo_scope ?? "global",
      country_code: packet.country_code ?? null,
      region_code: packet.region_code ?? null,
      city_slug: packet.city_slug ?? null,
      corridor_id: packet.corridor_id ?? null,
      language_code: packet.language_code ?? "en",
      risk_level: packet.risk_level ?? "low",
      narrative_angle: packet.narrative_angle ?? null,
      hook_text: packet.hook_text ?? null,
      primary_cta: packet.primary_cta ?? null,
      secondary_cta: packet.secondary_cta ?? null,
      packet_json: packet.packet_json,
      onsite_surface_targets_json: packet.onsite_surface_targets_json ?? [],
      channel_targets_json: packet.channel_targets_json ?? [],
      review_required: packet.review_required ?? false,
      status: packet.review_required ? "review_required" : "draft",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
};
