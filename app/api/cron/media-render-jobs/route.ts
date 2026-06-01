import { NextRequest, NextResponse } from "next/server";
import { cronGuard, logCronRun } from "@/app/api/cron/_lib/cron-guard";
import { runMediaRenderWorker } from "@/workers/media-render.worker";

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest) {
  const guard = await cronGuard();
  if (guard) return guard;

  const started = Date.now();
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");

  try {
    const result = await runMediaRenderWorker({ limit });
    await logCronRun("media-render-jobs", started, result.failed_count > 0 ? "failed" : "success", {
      rows_affected: result.submitted_count,
      metadata: result,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media render worker failed.";
    await logCronRun("media-render-jobs", started, "failed", { error_message: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
