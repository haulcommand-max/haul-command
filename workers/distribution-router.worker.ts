import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildDistributionJobs } from "@/lib/distribution/router";
import { logger } from "@/workers/_shared/logger";

export const runDistributionRouterWorker = async () => {
  const supabase = getSupabaseAdmin();

  const { data: packets, error } = await supabase
    .from("hc_content_packets")
    .select("*")
    .in("status", ["draft", "approved"])
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;

  let queuedCount = 0;

  for (const packet of packets ?? []) {
    try {
      if (packet.review_required && packet.status !== "approved") {
        continue;
      }

      const jobs = buildDistributionJobs({
        country_code: packet.country_code,
        risk_level: packet.risk_level,
        channels: Array.isArray(packet.channel_targets_json)
          ? packet.channel_targets_json.map((item: Record<string, unknown>) => ({
              channel: String(item.channel),
              account_key:
                typeof item.account_key === "string" ? item.account_key : null,
            }))
          : undefined,
      });

      const { error: queueError } = await supabase.rpc("rpc_queue_distribution_jobs", {
        p_content_packet_id: packet.id,
        p_jobs: jobs,
      });

      if (queueError) throw queueError;
      queuedCount += jobs.length;
    } catch (error) {
      logger.error("distribution_router.failed", {
        packet_id: packet.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  logger.info("distribution_router.completed", { queued_count: queuedCount });
  return { queued_count: queuedCount };
};
