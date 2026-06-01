import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildMediaRenderInsert, type MediaRenderRequest } from "@/lib/contracts/mediaRender";

type MediaRenderInsertClient = {
  from(table: string): {
    insert(payload: Record<string, unknown>): {
      select(columns: string): {
        single(): Promise<{ data?: unknown; error?: { message?: string } | null }>;
      };
    };
  };
};

export async function createMediaRenderJob(payload: MediaRenderRequest, supabaseClient?: MediaRenderInsertClient) {
  const supabase = supabaseClient ?? (getSupabaseAdmin() as unknown as MediaRenderInsertClient);
  const insert = buildMediaRenderInsert(payload);

  const { data, error } = await supabase
    .from("hc_media_render_jobs")
    .insert(insert)
    .select("id, object_type, template_id, video_format, render_status, priority, created_at")
    .single();

  if (error) throw new Error(error.message ?? "Failed to create media render job.");
  return data;
}
