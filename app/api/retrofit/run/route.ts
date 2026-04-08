import { NextRequest, NextResponse } from "next/server";
import { runRetrofitAuditWorker } from "@/workers/retrofit-audit.worker";
import { env } from "@/lib/env";
import {
  buildWorkerContext,
  workerSuccess,
  workerFailed,
} from "@/workers/_shared/types";

const WORKER_NAME = "retrofit_audit";

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
    const raw = await runRetrofitAuditWorker();
    const findings_count = (raw?.keep ?? 0) + (raw?.merge ?? 0) + (raw?.kill ?? 0);
    const result = workerSuccess(ctx, {
      audit_id: `audit_${Date.now()}`,
      findings_count,
      message: `Retrofit audit complete: keep=${raw?.keep ?? 0} merge=${raw?.merge ?? 0} kill=${raw?.kill ?? 0}`,
    });
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const result = workerFailed(ctx, "WORKER_EXECUTION_FAILED", msg);
    return NextResponse.json(result, { status: 500 });
  }
}
