import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/workers/_shared/logger";

export const runPageRefreshWorker = async () => {
  const supabase = getSupabaseAdmin();

  const { data: jobs, error } = await supabase
    .from("hc_surface_refresh_jobs")
    .select("*")
    .eq("status", "queued")
    .order("priority_score", { ascending: false })
    .limit(100);

  if (error) throw error;

  let refreshedCount = 0;

  for (const job of jobs ?? []) {
    try {
      // Actual page rebuild / ISR revalidation flow
      let targetPath = `/${job.source_object_type}/${job.source_object_id}`;
      // Special logic to build valid paths (e.g. profiling, corridors, tools)
      if (job.source_object_type === 'profile') targetPath = `/directory/profile/${job.source_object_id}`;
      else if (job.source_object_type === 'corridor') targetPath = `/corridors/${job.source_object_id}`;
      
      const internalUrl = process.env.INTERNAL_APP_BASE_URL || 'http://localhost:3000';
      const workerToken = process.env.INTERNAL_WORKER_TOKEN || '';
      
      try {
        await fetch(`${internalUrl}/api/admin/revalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': workerToken
          },
          body: JSON.stringify({ path: targetPath })
        });
      } catch (err) {
         logger.error("page_refresh.revalidate_request_failed", { targetPath, err });
      }

      const { error: updateError } = await supabase
        .from("hc_surface_refresh_jobs")
        .update({
          status: "processed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (updateError) throw updateError;
      refreshedCount += 1;
    } catch (error) {
      logger.error("page_refresh.failed", {
        job_id: job.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  logger.info("page_refresh.completed", { refreshed_count: refreshedCount });
  return { refreshed_count: refreshedCount };
};
