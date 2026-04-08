import { env } from "@/lib/env";

export const workerHeaders = () => ({
  "content-type": "application/json",
  "x-internal-token": env.INTERNAL_WORKER_TOKEN,
});
