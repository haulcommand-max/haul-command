import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/workers/_shared/logger";

export const runCorridorHeatWorker = async () => {
  const supabase = getSupabaseAdmin();

  const { data: events, error } = await supabase
    .from("hc_signal_events")
    .select("*")
    .eq("status", "processed")
    .ilike("event_name", "%corridor%")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  let count = 0;

  for (const event of events ?? []) {
    const signalScore = Number(event.severity ?? 0.5);
    const urgencyScore = signalScore;
    const seoValue = 0.8;
    const claimValue = 0.3;
    const monetizationValue = 0.7;
    const liquidityValue = 0.6;
    const qualityScore = Number(event.confidence ?? 0.7);

    const { error: upsertError } = await supabase.rpc("rpc_upsert_market_signal", {
      p_signal_type: "corridor_heat",
      p_source_event_id: event.id,
      p_object_type: event.object_type,
      p_object_id: event.object_id,
      p_geo_scope: event.city_slug ? "city" : event.region_code ? "region" : "country",
      p_country_code: event.country_code,
      p_region_code: event.region_code,
      p_city_slug: event.city_slug,
      p_corridor_id: event.corridor_id,
      p_signal_score: signalScore,
      p_urgency_score: urgencyScore,
      p_seo_value_score: seoValue,
      p_claim_value_score: claimValue,
      p_monetization_value_score: monetizationValue,
      p_liquidity_value_score: liquidityValue,
      p_quality_score: qualityScore,
      p_meta_json: event.payload_json ?? {},
    });

    if (upsertError) {
      logger.error("corridor_heat.upsert_failed", { event_id: event.id, error: upsertError.message });
      continue;
    }

    count += 1;
  }

  logger.info("corridor_heat.completed", { processed: count });
  return { processed: count };
};
