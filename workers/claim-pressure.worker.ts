import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildDefaultPacketFromSignal, insertContentPacket } from "@/lib/content/build-packet";
import { logger } from "@/workers/_shared/logger";

export const runClaimPressureWorker = async () => {
  const supabase = getSupabaseAdmin();

  const { data: scoredCount, error: scoreError } = await supabase.rpc(
    "rpc_score_claim_pressure_targets",
  );

  if (scoreError) throw scoreError;

  const { data: topSignals, error: topSignalsError } = await supabase
    .from("hc_market_signals")
    .select("*")
    .eq("signal_type", "claim_pressure")
    .order("claim_value_score", { ascending: false })
    .limit(100);

  if (topSignalsError) throw topSignalsError;

  let packetCount = 0;

  for (const signal of topSignals ?? []) {
    try {
      const packet = buildDefaultPacketFromSignal(signal);
      await insertContentPacket(packet);
      packetCount += 1;
    } catch (error) {
      logger.error("claim_pressure.packet_failed", {
        signal_id: signal.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  logger.info("claim_pressure.completed", {
    scored_count: scoredCount,
    packet_count: packetCount,
  });

  return {
    scored_count: scoredCount,
    packet_count: packetCount,
  };
};
