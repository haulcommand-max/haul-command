import type { MarketSignalUpsertPayload } from "@/types/market-signal";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const materializeSignal = async (payload: MarketSignalUpsertPayload) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("rpc_upsert_market_signal", {
    p_signal_type: payload.signal_type,
    p_source_event_id: payload.source_event_id,
    p_object_type: payload.object_type,
    p_object_id: payload.object_id,
    p_geo_scope: payload.geo_scope ?? "global",
    p_country_code: payload.country_code ?? null,
    p_region_code: payload.region_code ?? null,
    p_city_slug: payload.city_slug ?? null,
    p_corridor_id: payload.corridor_id ?? null,
    p_signal_score: payload.signal_score ?? 0,
    p_urgency_score: payload.urgency_score ?? 0,
    p_seo_value_score: payload.seo_value_score ?? 0,
    p_claim_value_score: payload.claim_value_score ?? 0,
    p_monetization_value_score: payload.monetization_value_score ?? 0,
    p_liquidity_value_score: payload.liquidity_value_score ?? 0,
    p_quality_score: payload.quality_score ?? 0,
    p_expires_at: payload.expires_at ?? null,
    p_meta_json: payload.meta_json ?? {},
  });

  if (error) throw error;
  return data as string;
};

export const inferSignalTypeFromEventName = (eventName: string): string => {
  if (eventName.includes("urgent")) return "urgent_load";
  if (eventName.includes("claim")) return "claim_pressure";
  if (eventName.includes("corridor")) return "corridor_heat";
  if (eventName.includes("requirement")) return "requirement_update";
  return "generic_signal";
};
