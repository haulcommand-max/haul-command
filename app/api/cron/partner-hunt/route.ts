import { NextRequest, NextResponse } from "next/server";
import { requireInternalRequest } from "@/lib/security/internal-request-auth";
import { queueSupplyAcquisitionTasks } from "@/lib/directory/supply-acquisition-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await queueSupplyAcquisitionTasks({
      limit: body.limit ?? 75,
      dryRun: body.dry_run === true,
      queueStates: ["ready", "pending", "open"],
    });

    return NextResponse.json({
      ok: true,
      workflow: "partner_hunt_supply_acquisition_bridge",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown partner-hunt cron error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
