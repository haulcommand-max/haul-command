import { runCorridorHeatWorker } from "@/workers/corridor-heat.worker";
import { runClaimPressureWorker } from "@/workers/claim-pressure.worker";
import { runDistributionRouterWorker } from "@/workers/distribution-router.worker";
import { runPageRefreshWorker } from "@/workers/page-refresh.worker";
import { logger } from "@/workers/_shared/logger";

const main = async () => {
  logger.info("workers.start");

  await runCorridorHeatWorker();
  await runClaimPressureWorker();
  await runDistributionRouterWorker();
  await runPageRefreshWorker();

  logger.info("workers.done");
};

main().catch((error) => {
  logger.error("workers.fatal", {
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
