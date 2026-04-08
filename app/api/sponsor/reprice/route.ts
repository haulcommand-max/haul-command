import { NextRequest, NextResponse } from "next/server";
import { runSponsorRepriceWorker } from "@/workers/sponsor-reprice.worker";
import { env } from "@/lib/env";
import {
  buildWorkerContext,
  workerSuccess,
  workerFailed,
} from "@/workers/_shared/types";

const WORKER_NAME = "sponsor_reprice";

const authorize = (request: NextRequest) =>
  request.headers.get("x-internal-token") === env.INTERNAL_WORKER_TOKEN;

export async function POST(request: NextRequest) {
  const request_id =
    request.headers.get("x-request-id") ?? crypto.randomUUID();
  const actor = request.headers.get("x-actor") ?? "system";
  const ctx = buildWorkerContext(request_id, actor, WORKER_NAME);

  if (!authorize(request)) {
    const result = workerFailed(ctx, "UNAUTHORIZED", "Missing or invalid x-internal-token.");
    return NextResponse.json(result, { status: 401 });
  }

  try {
    const raw = await runSponsorRepriceWorker();
    const repriced_count = raw?.updated_count ?? 0;
    const result = workerSuccess(ctx, {
      repriced_count,
      pricing_version: `v_${Date.now()}`,
      message: `Sponsor reprice complete: ${repriced_count} slots updated.`,
    });
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const result = workerFailed(ctx, "WORKER_EXECUTION_FAILED", msg);
    return NextResponse.json(result, { status: 500 });
  }
}
