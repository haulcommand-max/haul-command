import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const queueSurfaceRefresh = async (input: {
  surface_type: string;
  surface_key: string;
  source_object_type: string;
  source_object_id: string;
  reason: string;
  priority_score?: number;
  payload_json?: Record<string, unknown>;
}) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("rpc_enqueue_surface_refresh", {
    p_surface_type: input.surface_type,
    p_surface_key: input.surface_key,
    p_source_object_type: input.source_object_type,
    p_source_object_id: input.source_object_id,
    p_reason: input.reason,
    p_priority_score: input.priority_score ?? 0,
    p_payload_json: input.payload_json ?? {},
  });

  if (error) throw error;
  return data as string;
};
