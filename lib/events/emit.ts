import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SignalIngestPayload } from "@/types/market-signal";

export const emitSignalEvent = async (payload: SignalIngestPayload) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("rpc_emit_signal_event", {
    p_event_name: payload.event_name,
    p_object_type: payload.object_type,
    p_object_id: payload.object_id,
    p_payload_json: payload.payload_json ?? {},
    p_country_code: payload.country_code ?? null,
    p_region_code: payload.region_code ?? null,
    p_city_slug: payload.city_slug ?? null,
    p_corridor_id: payload.corridor_id ?? null,
    p_severity: payload.severity ?? 0,
    p_confidence: payload.confidence ?? 0,
    p_source_system: payload.source_system ?? "app",
    p_dedupe_key: payload.dedupe_key ?? null,
  });

  if (error) throw error;
  return data as string;
};
