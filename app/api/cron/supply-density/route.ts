import { NextRequest, NextResponse } from "next/server";
import { requireInternalRequest } from "@/lib/security/internal-request-auth";
import {
  getSupplyAcquisitionQueueSummary,
  queueSupplyAcquisitionTasks,
} from "@/lib/directory/supply-acquisition-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function run(req: NextRequest) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  const body = await req.json().catch(() => ({}));
  const result = await queueSupplyAcquisitionTasks({
    limit: body.limit,
    dryRun: body.dry_run === true,
  });

  return NextResponse.json({
    ok: true,
    workflow: "supply_density_to_acquisition_tasks",
    ...result,
  });
}

export async function POST(req: NextRequest) {
  try {
    return await run(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown supply-density cron error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  try {
    const summary = await getSupplyAcquisitionQueueSummary();
    return NextResponse.json({
      ok: true,
      workflow: "supply_density_to_acquisition_tasks",
      summary,
      trigger: "POST with optional { limit, dry_run } to queue work",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown supply-density health error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
