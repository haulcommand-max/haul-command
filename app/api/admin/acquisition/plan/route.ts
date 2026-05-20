import { NextRequest, NextResponse } from "next/server";
import { isInternalRequest } from "@/lib/auth/internal-request";
import { buildProviderAcquisitionWorkflow } from "@/lib/acquisition/provider-acquisition-workflow";

export async function POST(req: NextRequest) {
  if (!isInternalRequest(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "";

  if (!role || !countryCode) {
    return NextResponse.json({ error: "role and countryCode are required" }, { status: 400 });
  }

  const workflow = buildProviderAcquisitionWorkflow({
    role,
    countryCode,
    region: typeof body.region === "string" ? body.region.trim() : undefined,
    city: typeof body.city === "string" ? body.city.trim() : undefined,
    corridor: typeof body.corridor === "string" ? body.corridor.trim() : undefined,
    targetBatchSize: typeof body.targetBatchSize === "number" ? body.targetBatchSize : undefined,
    sourceTypes: Array.isArray(body.sourceTypes) ? body.sourceTypes : undefined,
  });

  return NextResponse.json({
    ok: true,
    spendsExternalCredits: false,
    workflow,
  });
}
